# ── Stage 1: Instalar dependencias ────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-lock.yaml ./
# pnpm 9 requiere el campo 'packages' cuando existe pnpm-workspace.yaml
RUN printf 'packages:\n  - "."\nonlyBuiltDependencies:\n  - sharp\n  - unrs-resolver\n' > pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

# ── Stage 2: Build de producción ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm install -g pnpm@9

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Sobrescribir workspace config con el campo packages requerido
RUN printf 'packages:\n  - "."\nonlyBuiltDependencies:\n  - sharp\n  - unrs-resolver\n' > pnpm-workspace.yaml

RUN pnpm build

# ── Stage 3: Runner mínimo (standalone) ───────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
