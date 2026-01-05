{ config, pkgs, lib, ... }:

{
  home.packages = [
    pkgs.tmux
  ];

  home.file = {
    ".config/tmux/tmux.conf".source = ../../../tmux/tmux.conf;
    ".config/tmux/theme.conf".source = ../../../tmux/theme.conf;
    ".config/tmux/colors-matugen.conf".source =
      config.lib.file.mkOutOfStoreSymlink
      "${config.home.homeDirectory}/.dotfiles/config/tmux/colors-matugen.conf";
  };
}
