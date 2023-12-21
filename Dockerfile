## build runner
FROM node:18 as build-runner

# Set temp directory
WORKDIR /tmp/app

# Move package.json
COPY package.json .

RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Move source files
COPY src ./src
COPY prisma ./prisma
COPY tsconfig.json   .

# Generate prisma client
RUN pnpm run db:gen

# Build project
RUN pnpm run build

## production runner
FROM node:18-alpine as prod-runner

# Set work directory
WORKDIR /app

# Copy package.json from build-runner
COPY --from=build-runner /tmp/app/package.json /app/package.json
COPY pnpm-lock.yaml .

RUN npm install -g pnpm

RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN apk add build-base

# Install dependencies
RUN pnpm install --production --frozen-lockfile

# Move build files
COPY --from=build-runner /tmp/app/build /app/build

# Start bot
CMD [ "pnpm", "run", "start" ]
