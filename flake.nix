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
      in
      {

        packages.default = pkgs.writeScriptBin "start" ''
          #!/bin/bash
          pnpm install
          pnpm build
          pnpm start
        '';

        apps.${system}.default = {
          type = "app";
          program = "${self.packages.${system}.start}/bin/start";
        };

        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            ffmpeg
            gnumake
            prisma_6
            nodejs_22
            openssl
            pnpm_10
            python3
          ];
          shellHook = with pkgs; ''
            export PRISMA_SCHEMA_ENGINE_BINARY="${prisma-engines_6}/bin/schema-engine"
            export PRISMA_QUERY_ENGINE_BINARY="${prisma-engines_6}/bin/query-engine"
            export PRISMA_QUERY_ENGINE_LIBRARY="${prisma-engines_6}/lib/libquery_engine.node"
            export PRISMA_INTROSPECTION_ENGINE_BINARY="${prisma-engines_6}/bin/introspection-engine"
            export PRISMA_FMT_BINARY="${prisma-engines_6}/bin/prisma-fmt"
          '';
        };
      }
    );
}
