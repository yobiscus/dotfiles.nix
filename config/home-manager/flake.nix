{
  description = "Home Manager configuration of jogravel";

  inputs = {
    # Specify the source of Home Manager and Nixpkgs.
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    gome = {
      url = "git+ssh://git@github.com/yobiscus/gome.git";
      flake = false;
    };
    pam-shim = {
      url = "github:Cu3PO42/pam_shim/next";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    self = {
      # Settings import from submodules
      submodules = true;
    };
  };

  outputs =
    { nixpkgs, home-manager, pam-shim, gome, ... }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      homeConfigurations."jogravel" = home-manager.lib.homeManagerConfiguration {
        inherit pkgs;

        # Specify your home configuration modules here, for example,
        # the path to your home.nix.
        modules = [
          ./home.nix
          pam-shim.homeModules.default
        ];

        extraSpecialArgs = { inherit gome; };
      };
    };
}

