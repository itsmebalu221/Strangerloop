# StrangrLoop — single-container production image.
# Builds the frontend, builds the server, then serves the SPA + REST + websockets
# from one Node process. No native compilation anywhere (SQLite is built into Node).

# ---------- stage 1: frontend ----------
FROM node:24-alpine AS client
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# ---------- stage 2: server ----------
FROM node:24-alpine AS server
WORKDIR /srv
COPY server/package.json server/package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build && npm prune --omit=dev

# ---------- stage 3: runtime ----------
FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /srv
COPY --from=server /srv/node_modules ./node_modules
COPY --from=server /srv/dist ./dist
COPY --from=client /app/dist ./public
ENV STATIC_DIR=./public \
    PORT=8787 \
    DATABASE_PATH=/data/strangrloop.db
VOLUME ["/data"]
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8787/health >/dev/null || exit 1
CMD ["node", "dist/index.js"]
