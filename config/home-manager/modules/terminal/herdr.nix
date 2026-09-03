{ config, pkgs, lib, ... }:

{
  home.packages = [
    #pkgs.herdr
  ];

  home.file.".config/herdr/config.toml".source =
    config.lib.file.mkOutOfStoreSymlink
    "${config.home.homeDirectory}/.dotfiles/config/herdr/config.toml";
}
