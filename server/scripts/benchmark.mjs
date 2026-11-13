// Synthetic queue CPU benchmark; no external traffic or existing database.
import { performance } from "node:perf_hooks";
process.env.DATABASE_PATH = ":memory:";
const match = await import("../src/matching.ts");
const { db } = await import("../src/db.ts");
const count = Number(process.env.BENCH_USERS ?? 500);
function entry(i, scenario) {
  const id = `bench${i}`;
  return { userId: id, socketId: id, since: Date.now(), emit() {}, profile: { id, name: id, gender: "female", age: "25–34", country: "India", languages: ["English"], interests: scenario === "gender" ? ["music", "coding", "ai"] : [id], conversationTypes: ["casual"], bio: "" }, prefs: { genderPref: scenario === "gender" ? "male" : "anyone", agePref: ["25–34"], languages: ["English"], conversationTypes: ["casual"] } };
}
for (const scenario of ["gender", "interests"]) {
  const started = performance.now();
  for (let i = 0; i < count; i++) match.joinQueue(entry(i, scenario));
  const queued = performance.now();
  const times = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    match.pairingPass();
    times.push(performance.now() - start);
  }
  console.log(JSON.stringify({ scenario: `incompatible ${scenario} (full scan)`, users: count, totalEnqueueMs: +(queued - started).toFixed(2), pairingPassMs: times.map((t) => +t.toFixed(2)) }, null, 2));
  for (let i = 0; i < count; i++) match.leaveQueue(`bench${i}`);
}
db.close();
