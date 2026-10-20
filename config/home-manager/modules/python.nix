{ config, pkgs, ... }:

{
  home.packages = [
    # wip
    (pkgs.python3.withPackages (ps: with ps; [
      pip
      virtualenv
    ]))
    pkgs.uv
  ];
}
