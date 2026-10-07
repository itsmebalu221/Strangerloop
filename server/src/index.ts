/**
 * StrangrLoop server — Fastify (REST + admin + static SPA) and Socket.IO
 * (matching/chat) on one HTTP server. SQLite persistence via node:sqlite,
 * zero native dependencies.
 *
 *   cd server && npm install && npm run dev
 *
 * Production (single container serves the built frontend too):
 *   STATIC_DIR=../dist npm start
 */
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import cors from "@fastify/cors";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { ALLOW_ALL_ORIGINS, CLIENT_ORIGINS, HOST, PORT, STATIC_DIR, TRUST_PROXY, AUTH_MODE } from "./config.js";
import { db } from "./db.js";
import { registerRoutes } from "./routes.js";
import { attachSockets, stopStatsLoop } from "./sockets.js";

const app = Fastify({
  logger: { level: process.env.LOG_LEVEL ?? "info" },
  trustProxy: TRUST_PROXY || undefined,
});

await app.register(cors, { origin: ALLOW_ALL_ORIGINS ? true : CLIENT_ORIGINS });
await registerRoutes(app);

/* serve the built frontend when STATIC_DIR points at a dist folder */
if (STATIC_DIR) {
  const root = resolve(STATIC_DIR);
  mkdirSync(root, { recursive: true });
  await app.register(fastifyStatic, { root, index: "index.html" });
  // SPA fallback — anything unknown renders the app shell
  app.setNotFoundHandler((req, reply) => {
    if (req.method === "GET" && !req.url.startsWith("/api")) {
      return reply.sendFile("index.html");
    }
    reply.code(404).send({ error: "Not found" });
  });
}

await app.ready();

const { statsTimer } = attachSockets(app.server);

await app.listen({ port: PORT, host: HOST });
app.log.info(`StrangrLoop server on :${PORT} — auth: ${AUTH_MODE}, origins: ${ALLOW_ALL_ORIGINS ? "*" : CLIENT_ORIGINS.join(", ")}${STATIC_DIR ? `, static: ${STATIC_DIR}` : ""}`);

/* ---------- graceful shutdown ---------- */
let closing = false;
async function shutdown(signal: string): Promise<void> {
  if (closing) return;
  closing = true;
  app.log.info(`${signal} received — shutting down…`);
  stopStatsLoop(statsTimer);
  try {
    await app.close();
  } finally {
    db.close();
    process.exit(0);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

process.on("unhandledRejection", (err) => {
  app.log.error({ err }, "unhandled rejection");
});
process.on("uncaughtException", (err) => {
  app.log.error({ err }, "uncaught exception — exiting");
  void shutdown("uncaughtException");
});
