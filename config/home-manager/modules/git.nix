{ config, pkgs, ... }:

{
  programs.git = {
    enable = true;
    settings.user.email = "jo@stashed.dev";
    settings.user.name = "Jonathan Gravel";
    settings.init.defaultBranch = "main";
  };
}


