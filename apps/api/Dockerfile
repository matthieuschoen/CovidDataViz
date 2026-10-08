# Contexte de build : racine du monorepo
FROM node:26-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.0.0 --activate
WORKDIR /repo

FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter api...
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter api exec prisma generate && pnpm --filter api build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo /repo
WORKDIR /repo/apps/api
EXPOSE 5000
# Applique les migrations puis démarre l'API
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/index.js"]
