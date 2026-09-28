{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        runtimeDeps = with pkgs; [
          bun
          ffmpeg
          prisma-engines_6
          openssl
          python3
        ];

        buildDeps = runtimeDeps ++ [
          pkgs.gcc
          pkgs.gnumake
          pkgs.gnused
          pkgs.node-gyp
        ];

        prismaEnv = ''
          export PRISMA_SCHEMA_ENGINE_BINARY="${pkgs.prisma-engines_6}/bin/schema-engine"
          export PRISMA_QUERY_ENGINE_BINARY="${pkgs.prisma-engines_6}/bin/query-engine"
          export PRISMA_QUERY_ENGINE_LIBRARY="${pkgs.prisma-engines_6}/lib/libquery_engine.node"
          export PRISMA_FMT_BINARY="${pkgs.prisma-engines_6}/bin/prisma-fmt"
        '';

      in
      {
        packages = {
          default = pkgs.writeShellApplication {
            name = "start";
            runtimeInputs = runtimeDeps;
            text = ''
              ${prismaEnv}
              bun run start
            '';
          };

          prod_install = pkgs.writeShellApplication {
            name = "prod_install";
            runtimeInputs = buildDeps;
            text = ''
              ${prismaEnv}
              bun install --frozen-lockfile --production
            '';
          };
        };

        devShells.default = pkgs.mkShell {
          buildInputs = buildDeps;
          shellHook = prismaEnv;
        };
      }
    );
}
