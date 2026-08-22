/**
 * StrangrLoop server — Fastify (REST + admin) and Socket.IO (matching/chat)
 * on one HTTP server. SQLite persistence, zero external services beyond
 * Supabase when real auth is enabled.
 *
 *   cd server && npm install && npm run dev
 */
import Fastify from "fastify";
import cors from "@fastify/cors";
import { AUTH_MODE, CLIENT_ORIGINS, HOST, PORT } from "./config.js";
import { registerRoutes } from "./routes.js";
import { attachSockets } from "./sockets.js";

const app = Fastify({ logger: { level: "info" } });

await app.register(cors, { origin: CLIENT_ORIGINS });
await registerRoutes(app);
await app.ready();

attachSockets(app.server);

await app.listen({ port: PORT, host: HOST });
// eslint-disable-next-line no-console
console.log(`⚡ StrangrLoop server on :${PORT} — auth: ${AUTH_MODE}, origins: ${CLIENT_ORIGINS.join(", ")}`);
