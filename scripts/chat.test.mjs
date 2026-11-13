import assert from "node:assert/strict";
import { test, afterEach } from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import React from "react";
import { create, act } from "react-test-renderer";
import { build } from "esbuild";

const require = createRequire(import.meta.url);
async function component(path, store = false) {
  const result = await build({
    entryPoints: [fileURLToPath(new URL(path, import.meta.url))], bundle: true, write: false,
    platform: "node", format: "cjs", packages: "external",
    plugins: [{ name: "chat-fixtures", setup(build) {
      if (store) {
        build.onResolve({ filter: /^\.\/auth$/ }, () => ({ path: "auth", namespace: "auth-fixture" }));
        build.onLoad({ filter: /.*/, namespace: "auth-fixture" }, () => ({ contents: "export const getCurrentUser=()=>Promise.resolve(globalThis.__chatHarness.user); export const onAuthChange=cb=>{globalThis.__chatHarness.authChange=cb;return ()=>{};}; export async function signOutUser(){};" }));
      }
      build.onResolve({ filter: /(?:store|live|config|components\/ui)$/ }, ({ path }) => ({ path, namespace: "fixture" }));
      build.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({ contents:
        path.endsWith("store") ? "export function useStore(){ return globalThis.__chatHarness.store; }" :
        path.endsWith("config") ? "export const LIVE_ENABLED = true;" :
        path.endsWith("live") ? `export function closeLiveSocket(){} export function liveSocket(){return globalThis.__chatHarness.socket;} export function getLiveSocket(){return globalThis.__chatHarness.getLiveSocket();} export function syncLiveProfile(){return globalThis.__chatHarness.syncProfile();} export function fetchLiveConnections(){return Promise.resolve(globalThis.__chatHarness.connections);}` :
        "export function Avatar(){return null;} export function Icon(){return null;} export function Modal({open, children}){return open ? children : null;}"
      }));
    } }],
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", result.outputFiles[0].text)(require, module, module.exports);
  return module.exports;
}
const Chat = (await component("../src/screens/Chat.tsx")).default;
const Searching = (await component("../src/screens/MatchFlow.tsx")).Searching;
const Store = await component("../src/store.tsx", true);
const match = { sessionId: "session-1", peer: { id: "peer-1", name: "TestPeer", gender: "female", age: "25–34", country: "India", languages: ["English"], interests: ["music"], conversationTypes: ["casual"] }, shared: ["music"], pct: 80 };
let renderer;

function harness() {
  const listeners = new Map(), sent = [], added = [], stats = [], flows = [], toasts = [], timers = new Map();
  let timerId = 0;
  const socket = {
    connected: true,
    on(name, fn) { const set = listeners.get(name) ?? new Set(); set.add(fn); listeners.set(name, set); return this; },
    off(name, fn) { listeners.get(name)?.delete(fn); return this; },
    emit(name, payload) { sent.push({ name, payload }); return this; },
    trigger(name, payload) { for (const fn of [...listeners.get(name) ?? []]) fn(payload); },
    timeout() { return { emit(name, payload, ack) { sent.push({ name, payload }); ack(null, h.delivery); } }; },
  };
  const h = {
    socket, sent, added, stats, flows, toasts, timers, connections: [],
    delivery: { ok: true, message: { id: "server-1", text: "hello", at: 123 } },
    getLiveSocket: () => Promise.resolve(socket), syncProfile: () => Promise.resolve(),
    store: {
      profile: { name: "Tester", birthDate: "2000-01-01", gender: "female", country: "India", languages: ["English"], interests: ["music"] },
      prefs: { genderPref: "anyone", agePref: ["25–34"], languages: ["English"], conversationTypes: ["casual"] },
      settings: { notifyConnect: true, showAge: true, showCountry: true }, connections: [], blocked: [],
      setFlow: (flow) => flows.push(flow), bumpStats: (value) => stats.push(value), addConnection: (value) => added.push(value),
      toast: (text) => toasts.push(text), blockUser() {},
    },
  };
  globalThis.__chatHarness = h;
  globalThis.window = { setTimeout(fn) { timers.set(++timerId, fn); return timerId; }, clearTimeout(id) { timers.delete(id); }, setInterval(fn) { timers.set(++timerId, fn); return timerId; }, clearInterval(id) { timers.delete(id); } };
  return h;
}
afterEach(() => { if (renderer) act(() => renderer.unmount()); renderer = undefined; delete globalThis.__chatHarness; delete globalThis.window; delete globalThis.localStorage; });
const button = (name) => renderer.root.findAllByType("button").find((node) => node.props["aria-label"] === name || node.children.join("") === name);
function renderChat() { act(() => { renderer = create(React.createElement(Chat, { live: match })); }); }

test("Accept waits for server confirmation and schedules no simulated reply", async () => {
  const h = harness(); renderChat();
  act(() => h.socket.trigger("connect:incoming", { sessionId: match.sessionId }));
  act(() => button("Accept").props.onClick());
  assert.ok(h.sent.some((event) => event.name === "connect:request"));
  assert.equal(h.added.length, 0);
  assert.equal(h.stats.length, 0);
  h.connections = [{ id: 42, createdAt: 100, peer: match.peer }];
  await act(async () => h.socket.trigger("connect:established", { sessionId: match.sessionId }));
  assert.equal(h.added.length, 1);
  assert.equal(h.added[0].id, "lc-42");
  assert.equal(h.timers.size, 0);
});

test("peer departure disables messages and Connect while retaining Next", () => {
  const h = harness(); renderChat();
  act(() => h.socket.trigger("chat:ended", { sessionId: match.sessionId, reason: "next" }));
  assert.equal(renderer.root.findByType("input").props.disabled, true);
  assert.equal(button("Send message").props.disabled, true);
  assert.equal(button("Connect"), undefined);
  const next = renderer.root.findAllByType("button").find((node) => node.props.title === "End this chat and find someone new");
  act(() => next.props.onClick());
  assert.deepEqual(h.flows.at(-1), { stage: "searching" });
});

test("disconnect marks the chat ended instead of buffering messages into a dead session", () => {
  const h = harness(); renderChat();
  h.socket.connected = false;
  act(() => h.socket.trigger("disconnect"));
  assert.equal(renderer.root.findByType("input").props.disabled, true);
  assert.equal(button("Send message").props.disabled, true);
});

test("Leave sends the session lifecycle event", () => {
  const h = harness(); renderChat();
  act(() => button("Leave chat").props.onClick());
  assert.deepEqual(h.sent.at(-1), { name: "chat:leave", payload: { sessionId: match.sessionId } });
  assert.deepEqual(h.flows.at(-1), { stage: "idle" });
});

test("rejected messages restore the draft and are not shown as delivered", () => {
  const h = harness(); renderChat();
  h.delivery = { ok: false, error: "Slow down" };
  act(() => renderer.root.findByType("input").props.onChange({ target: { value: "hello" } }));
  act(() => button("Send message").props.onClick());
  assert.equal(renderer.root.findByType("input").props.value, "hello");
  assert.equal(h.stats.length, 0);
  assert.ok(h.toasts.includes("Slow down"));
  assert.equal(renderer.root.findAllByType("p").some((node) => node.children.join("") === "hello"), false);
});

test("accepted messages use the server text and increment stats only on delivery", () => {
  const h = harness(); renderChat();
  act(() => renderer.root.findByType("input").props.onChange({ target: { value: "hello" } }));
  act(() => button("Send message").props.onClick());
  assert.deepEqual(h.stats, [{ messages: 1 }]);
  assert.equal(renderer.root.findAllByType("p").filter((node) => node.children.join("") === "hello").length, 1);
});

test("long chats render a bounded feed and let readers reveal earlier messages", () => {
  const h = harness(); renderChat();
  act(() => {
    for (let i = 0; i < 250; i++) h.socket.trigger("chat:message", { id: `peer-${i}`, from: match.peer.id, sessionId: match.sessionId, text: `history ${i}`, at: i });
  });
  const history = () => renderer.root.findAllByType("p").filter((node) => node.children.join("").startsWith("history "));
  assert.equal(history().length, 100);
  act(() => button("Show earlier messages").props.onClick());
  assert.equal(history().length, 200);
});

test("queue rejoins after reconnect and matched searches do not send queue:leave", async () => {
  const h = harness();
  await act(async () => { renderer = create(React.createElement(Searching)); });
  assert.equal(h.sent.filter((event) => event.name === "queue:join").length, 1);
  assert.deepEqual(h.stats, []);
  act(() => { h.socket.trigger("disconnect"); h.socket.trigger("connect"); });
  assert.equal(h.sent.filter((event) => event.name === "queue:join").length, 2);
  act(() => h.socket.trigger("match:found", match));
  assert.deepEqual(h.stats, [{ chats: 1 }]);
  act(() => renderer.unmount()); renderer = undefined;
  assert.equal(h.sent.some((event) => event.name === "queue:leave"), false);
});

test("cancelled search does not join after slow profile synchronization", async () => {
  const h = harness(); let finish;
  h.syncProfile = () => new Promise((resolve) => { finish = resolve; });
  await act(async () => { renderer = create(React.createElement(Searching)); });
  act(() => renderer.unmount()); renderer = undefined;
  await act(async () => finish());
  assert.equal(h.sent.some((event) => event.name === "queue:join"), false);
});

async function renderStore() {
  const h = harness(), saved = new Map();
  h.user = { id: "alpha", name: "Alpha" };
  saved.set("strangrloop:v2:alpha", JSON.stringify({ profile: { name: "Alpha" } }));
  saved.set("strangrloop:v2:beta", JSON.stringify({ profile: { name: "Beta" } }));
  globalThis.localStorage = { getItem: (key) => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value), removeItem: (key) => saved.delete(key) };
  function Consumer() { h.snapshot = Store.useStore(); return null; }
  await act(async () => { renderer = create(React.createElement(Store.StoreProvider, null, React.createElement(Consumer))); });
  return { h, saved };
}

test("account switches hydrate before persisting and never overwrite another profile", async () => {
  const { h, saved } = await renderStore();
  assert.equal(h.snapshot.profile.name, "Alpha");
  await act(async () => h.authChange({ id: "beta", name: "Beta" }));
  assert.equal(h.snapshot.profile.name, "Beta");
  assert.equal(JSON.parse(saved.get("strangrloop:v2:beta")).profile.name, "Beta");
  assert.equal(JSON.parse(saved.get("strangrloop:v2:alpha")).profile.name, "Alpha");
});

test("server connection IDs replace existing peer entries without losing shared interests", async () => {
  const { h } = await renderStore();
  act(() => h.snapshot.addConnection({ id: "c-peer", personaId: "peer", shared: ["music"] }));
  act(() => h.snapshot.addConnection({ id: "lc-42", personaId: "peer", shared: [] }));
  assert.equal(h.snapshot.connections.length, 1);
  assert.equal(h.snapshot.connections[0].id, "lc-42");
  assert.deepEqual(h.snapshot.connections[0].shared, ["music"]);
});
