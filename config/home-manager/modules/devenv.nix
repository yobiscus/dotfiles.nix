{ config, pkgs, ... }:

{
  home.packages = [
    pkgs.cachix
    pkgs.devenv
  ];
}
