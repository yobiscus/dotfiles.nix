{ config, pkgs, lib, ... }:

{
  programs.herdr = {
    enable = true;
  };

  home.file.".config/herdr/config.toml".source =
    config.lib.file.mkOutOfStoreSymlink
    "${config.home.homeDirectory}/.dotfiles/config/herdr/config.toml";
}
