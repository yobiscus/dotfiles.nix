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
    autosuggestion.enable = true;
    syntaxHighlighting.enable = true;
    history = {
      # settings duplicated in .config/zsh/conf/history.zsh since there is no
      # way to turn history settings off in Home Manager
      saveNoDups = true;
    };
    shellAliases = {
      hm = "home-manager";
      hms = "$HOME/.dotfiles/scripts/home-manager-switch";
    };
    initContent = let
      zshConfigEarlyInit = lib.mkOrder 500 "export SHELL=${pkgs.zsh}/bin/zsh";
      zshConfigLast = lib.mkOrder 1500 "source $HOME/.config/zsh/conf/main.zsh";
    in lib.mkMerge [ zshConfigEarlyInit zshConfigLast ];
  };
  home.file.".config/zsh".source = ../../../zsh;

  home.file.".config/fastfetch".source = ../../../fastfetch;
}
