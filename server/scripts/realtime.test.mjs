import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { createRequire } from "node:module";
import Fastify from "fastify";
import { io as client } from "socket.io-client";

// Never touch the developer's database or depend on a separately running server.
process.env.DATABASE_PATH = ":memory:";
process.env.SUPABASE_JWT_SECRET = "";
const db = await import("../src/db.ts");
const matching = await import("../src/matching.ts");
const { attachSockets, stopStatsLoop } = await import("../src/sockets.ts");
const { registerRoutes } = await import("../src/routes.ts");
const app = Fastify();
const clients = new Set();
let server, url, serial = 0, live;

function event(socket, name, ms = 3000) {
  return new Promise((resolve, reject) => {
    const listener = (value) => { clearTimeout(timer); resolve(value); };
    const timer = setTimeout(() => { socket.off(name, listener); reject(new Error(`Timed out: ${name}`)); }, ms);
    socket.once(name, listener);
  });
}

before(async () => {
  await registerRoutes(app);
  await app.ready();
  server = attachSockets(app.server);
  await app.listen({ port: 0, host: "127.0.0.1" });
  url = `http://127.0.0.1:${app.server.address().port}`;

  // Exercise the real browser transport/profile helpers with only auth and
  // Vite's build-time env substituted. No extra test dependencies are needed.
  const require = createRequire(new URL("../../package.json", import.meta.url));
  const { build } = require("esbuild");
  const result = await build({
    entryPoints: [new URL("../../src/live.ts", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")],
    bundle: true, write: false, platform: "node", format: "cjs", packages: "external",
    define: { "import.meta.env": JSON.stringify({ VITE_SERVER_URL: url }) },
    plugins: [{ name: "test-auth", setup(build) {
      build.onResolve({ filter: /^\.\/auth$/ }, () => ({ path: "auth", namespace: "test" }));
      build.onLoad({ filter: /.*/, namespace: "test" }, () => ({ contents: "export async function getAuthToken() { return globalThis.__realtimeToken(); }" }));
    } }],
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", result.outputFiles[0].text)(require, module, module.exports);
  live = module.exports;
});

after(async () => {
  live?.closeLiveSocket();
  delete globalThis.__realtimeToken;
  for (const socket of clients) socket.disconnect();
  stopStatsLoop(server?.statsTimer);
  await new Promise((resolve) => server.io.close(resolve));
  await app.close();
  db.db.close();
});

async function user({ profile = true } = {}) {
  const id = `demo_testuser${++serial}`;
  if (profile) {
    const response = await fetch(`${url}/profile`, {
      method: "POST", headers: { authorization: `Bearer demo:${id}`, "content-type": "application/json" },
      body: JSON.stringify({ name: `Tester${serial}`, gender: "female", age: "25–34", country: "India", languages: ["English"], interests: ["music", "ai", "coding"], conversationTypes: ["casual"] }),
    });
    assert.equal(response.status, 200);
  }
  const socket = client(url, { autoConnect: false, auth: { token: `demo:${id}` }, transports: ["websocket"], reconnection: false });
  clients.add(socket);
  const welcome = event(socket, "welcome");
  socket.connect();
  await welcome;
  return { id, socket };
}

async function pair(a, b) {
  const foundA = event(a.socket, "match:found"), foundB = event(b.socket, "match:found");
  a.socket.emit("queue:join");
  b.socket.emit("queue:join");
  const [first, second] = await Promise.all([foundA, foundB]);
  assert.equal(first.sessionId, second.sessionId);
  assert.equal(first.peer.id, b.id);
  return first.sessionId;
}

test("onboarding profile sync enables matching; concurrent callers share one authenticated socket", async () => {
  const a = await user({ profile: false }), b = await user();
  const rejected = event(a.socket, "queue:error");
  a.socket.emit("queue:join");
  assert.match((await rejected).message, /interest/);
  a.socket.disconnect();
  globalThis.__realtimeToken = () => `demo:${a.id}`;
  await live.syncLiveProfile({ name: "SyncedUser", birthDate: "2000-01-01", gender: "female", country: "India", languages: ["English"], interests: ["music", "ai", "coding"], bio: "", color: "#fff" }, { conversationTypes: ["casual"] });
  const sockets = await Promise.all([live.getLiveSocket(), live.getLiveSocket(), live.getLiveSocket()]);
  assert.ok(sockets.every((socket) => socket === sockets[0] && socket.connected));
  const sid = await pair({ ...a, socket: sockets[0] }, b);
  assert.ok(sid);
  live.closeLiveSocket();
  b.socket.disconnect();
});

test("closing during auth lookup cannot resurrect a stale-account socket", async () => {
  let finishAuth;
  globalThis.__realtimeToken = () => new Promise((resolve) => { finishAuth = resolve; });
  const pending = live.getLiveSocket();
  live.closeLiveSocket();
  finishAuth("demo:staleuser");
  await assert.rejects(pending, /Account changed/);
  assert.equal(live.liveSocket(), null);
});

test("chat delivery is acknowledged, moderated and uniquely identified", async () => {
  const a = await user(), b = await user();
  const sid = await pair(a, b);
  const received = event(b.socket, "chat:message");
  const ack = await a.socket.timeout(3000).emitWithAck("chat:message", { sessionId: sid, text: "hello stranger" });
  assert.equal(ack.ok, true);
  assert.deepEqual(await received, ack.message);
  assert.equal(typeof ack.message.id, "string");
  const blocked = await a.socket.timeout(3000).emitWithAck("chat:message", { sessionId: sid, text: "send me bitcoin" });
  assert.equal(blocked.ok, false);
  const invalid = await a.socket.timeout(3000).emitWithAck("chat:message", { sessionId: "missing", text: "hello" });
  assert.equal(invalid.ok, false);
  assert.equal(db.sessionContext(sid).length, 1);
  a.socket.disconnect(); b.socket.disconnect();
});

test("Accept requires both users; connection response is decoded without simulated duplicates", async () => {
  const a = await user(), b = await user();
  const sid = await pair(a, b);
  const incoming = event(b.socket, "connect:incoming");
  a.socket.emit("connect:request", { sessionId: sid });
  await incoming;
  assert.equal(db.listConnections(a.id).length, 0);
  const established = event(a.socket, "connect:established");
  b.socket.emit("connect:request", { sessionId: sid });
  await established;
  globalThis.__realtimeToken = () => `demo:${a.id}`;
  const rows = await live.fetchLiveConnections();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].peer.id, b.id);
  a.socket.emit("connect:request", { sessionId: sid });
  assert.equal(db.listConnections(a.id).length, 1);
  a.socket.disconnect(); b.socket.disconnect();
});

test("Leave ends the server session, notifies the peer, and rejects stale messages", async () => {
  const a = await user(), b = await user();
  const sid = await pair(a, b);
  const ended = event(b.socket, "chat:ended");
  a.socket.emit("chat:leave", { sessionId: sid });
  assert.deepEqual(await ended, { sessionId: sid, reason: "leave" });
  assert.equal(matching.userInSession(a.id), undefined);
  assert.equal(matching.userInSession(b.id), undefined);
  const ack = await b.socket.timeout(3000).emitWithAck("chat:message", { sessionId: sid, text: "still there?" });
  assert.equal(ack.ok, false);
  a.socket.disconnect(); b.socket.disconnect();
});

test("normal Next usage works beyond three searches per minute", async () => {
  const a = await user(), b = await user();
  for (let i = 0; i < 5; i++) {
    const sid = await pair(a, b);
    const ended = event(b.socket, "chat:ended");
    a.socket.emit("chat:next", { sessionId: sid });
    assert.equal((await ended).reason, "next");
  }
  a.socket.disconnect(); b.socket.disconnect();
});

test("report without Block ends chat without silently blocking; Block prevents rematches", async () => {
  const a = await user(), b = await user();
  let sid = await pair(a, b);
  const reported = event(a.socket, "report:received");
  a.socket.emit("report", { sessionId: sid, reported: b.id, reason: "spam", block: false });
  assert.ok((await reported).reportId);
  assert.equal(db.isBlockedEither(a.id, b.id), false);
  sid = await pair(a, b);
  const ended = event(b.socket, "chat:ended");
  a.socket.emit("block", { sessionId: sid, userId: b.id });
  await ended;
  assert.equal(db.isBlockedEither(a.id, b.id), true);
  a.socket.emit("queue:join"); b.socket.emit("queue:join");
  await Promise.all([event(a.socket, "queue:joined"), event(b.socket, "queue:joined")]);
  assert.equal(matching.userInSession(a.id), undefined);
  assert.equal(matching.userInSession(b.id), undefined);
  a.socket.disconnect(); b.socket.disconnect();
});

function entry(id, since, prefs = {}) {
  return { userId: id, socketId: id, since, emit() {}, profile: { id, name: id, gender: "female", age: "25–34", country: "India", languages: ["English", "Hindi"], interests: ["music"], conversationTypes: ["casual"], bio: "" }, prefs: { genderPref: "anyone", agePref: ["25–34"], languages: ["English"], conversationTypes: ["casual"], ...prefs } };
}

test("an old waiter cannot force a new user's preferences to relax", () => {
  const old = entry("oldwaiter", Date.now() - 40_000);
  const fresh = entry("freshwaiter", Date.now(), { genderPref: "male" });
  matching.joinQueue(old); matching.joinQueue(fresh);
  matching.pairingPass();
  assert.equal(matching.userInSession(fresh.userId), undefined);
  matching.leaveQueue(fresh.userId);
  fresh.since = Date.now() - 40_000;
  matching.joinQueue(fresh);
  const sid = matching.userInSession(fresh.userId);
  assert.ok(sid);
  matching.endChat(sid, "test");
});

test("language and conversation preferences affect scoring", () => {
  const a = entry("langA", Date.now(), { languages: ["Hindi"], conversationTypes: ["deep"] });
  const b = entry("langB", Date.now());
  assert.equal(matching.computeScore(a, b).sharedLang, null);
  assert.deepEqual(matching.computeScore(a, b).sharedConv, []);
});

test("uppercase spam checks cannot downgrade severe moderation rules", async () => {
  const { moderate } = await import("../src/moderation.ts");
  db.ensureUser("uppercase-test", "Uppercase");
  const { verdict } = moderate("uppercase-test", "I WILL KILL YOU THIS IS A THREAT");
  assert.equal(verdict.risk, "severe");
});
