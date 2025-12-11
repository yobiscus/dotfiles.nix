{ config, pkgs, lib, ... }:

{
  home.packages = [
    pkgs.tmux
  ];

  home.file.".config/tmux".source = ../../../tmux;
}
