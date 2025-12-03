{ config, pkgs, ... }:

{
  home.packages = [
    pkgs.fd
    pkgs.ripgrep
  ];

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
    shellAliases = {
      hm = "home-manager";
      hmb = "home-manager build";
      hms = "home-manager switch && $HOME/.dotfiles/scripts/home-manager-diff-last";
    };
  };
}
