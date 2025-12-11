{ config, pkgs, lib, ... }:

{
  home.username = "jogravel";
  home.homeDirectory = "/home/jogravel";

  home.stateVersion = "25.05"; # Don't change this, generally.

  programs.home-manager.enable = true;

  imports = [
    ./modules/fonts.nix
    ./modules/git.nix
    ./modules/hyprland.nix
    ./modules/neovim.nix
    ./modules/terminal
  ]
  ++ lib.optional (builtins.pathExists ./modules/personal/default.nix) ./modules/personal
  ;
}
