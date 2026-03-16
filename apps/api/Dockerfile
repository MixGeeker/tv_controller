FROM node:22-alpine

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/core/package.json packages/core/package.json

RUN pnpm install --frozen-lockfile --filter @tv-controller/api...

COPY apps/api ./apps/api
COPY packages/core ./packages/core

RUN pnpm --filter @tv-controller/core build && pnpm --filter @tv-controller/api build

EXPOSE 3100

CMD ["pnpm", "--filter", "@tv-controller/api", "start"]
