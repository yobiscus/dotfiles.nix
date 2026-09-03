{ config, pkgs, lib, ... }:

{
  imports = [
    ./herdr.nix
    ./tmux.nix
    ./zsh.nix
  ];

  home.packages = [
    pkgs.fd
    pkgs.ripgrep
    pkgs.tree
  ];

  programs.direnv = {
    enable = true;
    nix-direnv.enable = true;
  };

  programs.fzf = {
    enable = true;
  };
}
