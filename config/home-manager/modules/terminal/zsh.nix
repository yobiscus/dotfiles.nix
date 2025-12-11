{ config, pkgs, lib, ... }:

{
  home.packages = [
    pkgs.fastfetch
  ];

  programs.starship = {
    enable = true;
  };

  programs.zsh = {
    enable = true;
    enableCompletion = true;
    autosuggestion.enable = true;
    syntaxHighlighting.enable = true;
    history = {
      saveNoDups = true;
    };
    oh-my-zsh = {
      enable = true;
    };
    shellAliases = {
      hm = "home-manager";
      hms = "$HOME/.dotfiles/scripts/home-manager-switch";
    };
    initContent = lib.mkOrder 1500 ''
      fastfetch
    '';
  };
}
