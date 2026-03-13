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
            nodejs_22
            openssl
            pnpm_10
            python3
          ];
          shellHook = with pkgs; ''
            export PRISMA_SCHEMA_ENGINE_BINARY="${pkgs.prisma-engines}/bin/schema-engine"
          '';
        };
      }
    );
}
