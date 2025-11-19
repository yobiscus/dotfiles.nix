{ config, pkgs, ... }:

{
  programs.kitty = {
    enable = true;
    settings = {
      shell = "${pkgs.zsh}/bin/zsh";
    };
  };

  programs.starship = {
    enable = true;
  };

  programs.zsh = {
    enable = true;
    # enableCompletions = true;
    # autosuggestion.enable = true;
    # syntaxHighlighting.enable = true;
    oh-my-zsh = {
      enable = true;
    };
  };
}
