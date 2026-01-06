{ config, lib, pkgs, ... }:

{
  home.username = "jogravel";
  home.homeDirectory = builtins.getEnv "HOME";
  home.stateVersion = "25.05"; # Don't change this, generally.
  programs.home-manager.enable = true;

  nixpkgs = {
    config = {
      allowUnfree = true;
      allowUnfreePredicate = (_: true);
    };
  };

  imports = [
    ./modules/fonts.nix
    ./modules/git.nix
    ./modules/neovim.nix
    ./modules/terminal
  ]
  ++ lib.optional (builtins.getEnv "NIX_HM_PERSONAL" == "1") ./modules/personal
  ++ lib.optional (builtins.getEnv "NIX_HM_WORK" == "1") ./modules/work
  ++ lib.optional (builtins.getEnv "NIX_HM_WM" == "1") ./modules/wm
  ;

  # mark NIX_HM in environment, and persist configuration env options
  home.sessionVariables = {
    NIX_HM_INITIALIZED = "1";
  }
  // lib.optionalAttrs (builtins.getEnv "NIX_HM_PERSONAL" == "1") { "NIX_HM_PERSONAL" = "1"; }
  // lib.optionalAttrs (builtins.getEnv "NIX_HM_WORK" == "1") { "NIX_HM_WORK" = "1"; }
  // lib.optionalAttrs (builtins.getEnv "NIX_HM_WM" == "1") { "NIX_HM_WM" = "1"; }
  ;
}
