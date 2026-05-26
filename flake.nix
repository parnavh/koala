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
            nodePackages.prisma
            nodejs_20
            openssl
            pnpm_9
            python3
          ];
          shellHook = with pkgs; ''
            export PRISMA_SCHEMA_ENGINE_BINARY="${prisma-engines}/bin/schema-engine"
            export PRISMA_QUERY_ENGINE_BINARY="${prisma-engines}/bin/query-engine"
            export PRISMA_QUERY_ENGINE_LIBRARY="${prisma-engines}/lib/libquery_engine.node"
            export PRISMA_INTROSPECTION_ENGINE_BINARY="${prisma-engines}/bin/introspection-engine"
            export PRISMA_FMT_BINARY="${prisma-engines}/bin/prisma-fmt"
          '';
        };
      }
    );
}
