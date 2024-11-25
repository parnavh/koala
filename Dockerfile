# Build runner
FROM node:18 AS build-runner

## Set temp directory
WORKDIR /tmp/app

RUN npm install -g pnpm

## Move essentials
COPY package.json .
COPY pnpm-lock.yaml .
COPY prisma ./prisma

## Install dependencies
RUN pnpm install

## Move source files
COPY src ./src
COPY tsconfig.json   .
COPY tsconfig.build.json .

## Build project
RUN pnpm run build

# Production runner
FROM node:18-alpine AS prod-runner

## Set work directory
WORKDIR /app

RUN npm install -g pnpm

## Copy files from build runner
COPY --from=build-runner /tmp/app/package.json /app/package.json
COPY --from=build-runner /tmp/app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=build-runner /tmp/app/prisma /app/prisma

RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN apk add --no-cache build-base ffmpeg

## Install dependencies
RUN pnpm install --production --frozen-lockfile

## Move build files
COPY --from=build-runner /tmp/app/build /app/build

## Start bot
CMD [ "pnpm", "run", "start" ]
