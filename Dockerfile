## build runner
FROM oven/bun:alpine as build-runner

# Set temp directory
WORKDIR /tmp/app

# Move package.json
COPY package.json .

# Install dependencies
RUN bun install

# Move source files
COPY src ./src
COPY tsconfig.json   .

# Build project
RUN bun run build

## production runner
FROM oven/bun:alpine as prod-runner

# Set work directory
WORKDIR /app

# Copy package.json from build-runner
COPY --from=build-runner /tmp/app/package.json /app/package.json
COPY bun.lockb .

# Install dependencies
RUN bun install --production --frozen-lockfile

# Move build files
COPY --from=build-runner /tmp/app/build /app/build

# Start bot
CMD [ "bun", "run", "start" ]
