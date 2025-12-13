{ config, pkgs, lib, ... }:

{
  imports = [
    ./tmux.nix
    ./zsh.nix
  ];

  home.packages = [
    pkgs.fd
    pkgs.ripgrep
  ];

  programs.direnv = {
    enable = true;
    enableZshIntegration = true;
  };

  services.ssh-agent = {
    enable = true;
    enableZshIntegration = true;
  };
}
