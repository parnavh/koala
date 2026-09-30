FROM nixos/nix

ENV NIX_CONFIG="experimental-features = nix-command flakes"

WORKDIR /app

COPY flake.nix .
COPY flake.lock .
COPY tsconfig.json .
COPY package.json .
COPY bun.lock .
COPY prisma/ ./prisma/

RUN nix run .#prod_install

COPY src/ ./src/
COPY prisma.config.ts .

CMD ["nix", "run", "."]
