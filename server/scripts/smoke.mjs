/**
 * End-to-end smoke test — boots nothing; expects a server already running
 * (default http://127.0.0.1:8787, demo auth). Drives three clients through
 * the full lifecycle: profile → queue → match → chat → malformed-input
 * survival → mutual connect → next → stats.
 *
 *   SERVER_URL=http://127.0.0.1:8787 npm run smoke
 */
import { io } from "socket.io-client";

const SERVER = process.env.SERVER_URL ?? "http://127.0.0.1:8787";
const suffix = Date.now().toString(36);
const TAG = { a: `smokea${suffix}`, b: `smokeb${suffix}`, c: `smokec${suffix}` };

let failures = 0;
function check(name, ok, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
  if (!ok) failures += 1;
}
function timeout(ms, label) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout: ${label}`)), ms));
}

async function createProfile(tag, name) {
  const res = await fetch(`${SERVER}/profile`, {
    method: "POST",
    headers: { authorization: `Bearer demo:${tag}`, "content-type": "application/json" },
    body: JSON.stringify({
      name,
      gender: "female",
      age: "25–34",
      country: "India",
      languages: ["English"],
      interests: ["programming", "ai", "music"],
      conversationTypes: ["casual", "coding"],
      bio: "",
    }),
  });
  const body = await res.json().catch(() => ({}));
  return res.ok && body?.ok === true;
}

function connectUser(tag) {
  return new Promise((resolve, reject) => {
    const s = io(SERVER, { auth: { token: `demo:${tag}` }, transports: ["websocket"], reconnectionAttempts: 2 });
    const t = setTimeout(() => reject(new Error("welcome timeout")), 10_000);
    s.on("welcome", () => {
      clearTimeout(t);
      resolve(s);
    });
    s.on("connect_error", (e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

check("REST profile A created", await createProfile(TAG.a, "SmokeA"));
check("REST profile B created", await createProfile(TAG.b, "SmokeB"));
check("REST profile C created", await createProfile(TAG.c, "SmokeC"));

const sockA = await connectUser(TAG.a);
const sockB = await connectUser(TAG.b);
const sockC = await connectUser(TAG.c);
check("socket handshake A+B+C", sockA.connected && sockB.connected && sockC.connected);

/* queue both compatible users → expect match:found on each */
const matchedA = new Promise((res) => sockA.once("match:found", (m) => res(m)));
const matchedB = new Promise((res) => sockB.once("match:found", (m) => res(m)));
sockA.emit("queue:join", { prefs: { genderPref: "anyone", agePref: ["25–34"], languages: ["English"], conversationTypes: ["casual"] } });
await new Promise((r) => setTimeout(r, 300));
sockB.emit("queue:join", { prefs: { genderPref: "anyone", agePref: ["18–24", "25–34"], languages: ["English"], conversationTypes: ["casual", "coding"] } });

const mA = await Promise.race([matchedA, timeout(15_000, "match:found A")]);
const mB = await Promise.race([matchedB, timeout(15_000, "match:found B")]);
const sessionId = mA.sessionId;
check("matched via queue", Boolean(sessionId && sessionId === mB.sessionId), `session=${sessionId}`);
check("match carries shared interests", Array.isArray(mA.shared) && mA.shared.length > 0, JSON.stringify(mA.shared));
check("peer profile delivered", mB.peer?.id === `demo_${TAG.a}`);

/* chat relay: A sends, B receives exactly one peer message */
let bMessages = 0;
const gotMessage = new Promise((res) =>
  sockB.on("chat:message", (m) => {
    bMessages += 1;
    res(m);
  })
);
sockA.emit("chat:message", { sessionId, text: "hello from smoke test" });
const msgOnB = await Promise.race([gotMessage, timeout(8_000, "chat:message relay")]);
check(
  "message relayed to peer exactly once",
  msgOnB?.text === "hello from smoke test" && msgOnB.from === `demo_${TAG.a}` && bMessages === 1,
  `count=${bMessages}`
);

/* malformed prefs from C must be sanitized, not crash the pairing loop */
sockC.emit("queue:join", { prefs: { genderPref: 123, agePref: "nope", conversationTypes: null, languages: 42 } });
const joinedOrErrored = new Promise((res) => {
  sockC.once("queue:joined", () => res("joined"));
  sockC.once("queue:error", (e) => res(`error:${e?.message ?? ""}`));
});
const joinResult = await Promise.race([joinedOrErrored, timeout(5_000, "queue:join C")]);
check("malformed prefs handled gracefully", joinResult === "joined" || String(joinResult).startsWith("error:"), String(joinResult));

/* typing relay */
const typingB = new Promise((res) => sockB.once("chat:typing", () => res(true)));
sockA.emit("chat:typing", { sessionId });
check("typing indicator relayed", await Promise.race([typingB, timeout(4_000, "chat:typing")]));

/* mutual connect */
const establishedB = new Promise((res) => sockB.once("connect:established", (e) => res(e)));
sockA.emit("connect:request", { sessionId });
await new Promise((r) => setTimeout(r, 400));
sockB.emit("connect:request", { sessionId });
const est = await Promise.race([establishedB, timeout(8_000, "connect:established")]);
check("mutual connect established", est?.sessionId === sessionId);

/* NEXT ends the session for the other side */
const endedB = new Promise((res) => sockB.once("chat:ended", (e) => res(e)));
sockA.emit("chat:next", { sessionId });
const ended = await Promise.race([endedB, timeout(8_000, "chat:ended")]);
check("next notifies peer", ended?.sessionId === sessionId && ended?.reason === "next");

/* stats endpoint reflects live presence */
const stats = await (await fetch(`${SERVER}/stats`)).json();
check("stats endpoint", Number(stats.online) >= 3, JSON.stringify(stats));
check("health endpoint", (await (await fetch(`${SERVER}/health`)).json())?.ok === true);

sockA.disconnect();
sockB.disconnect();
sockC.disconnect();

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
