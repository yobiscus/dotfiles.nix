{ config, pkgs, ... }:

{
  home.username = "jogravel";
  home.homeDirectory = "/home/jogravel";

  home.stateVersion = "25.05"; # Don't change this, generally.

  home.sessionVariables = {
    EDITOR = "nvim";
    VISUAL = "nvim";
  };

  fonts.fontconfig = {
    enable = true;
    defaultFonts = {
      monospace = [ "JetBrainsMono Nerd Font" ];
    };
  };

  home.packages = [
    # Tools configured manually
    pkgs.neovim
    # Misc.
    pkgs.nerd-fonts.jetbrains-mono
  ];

  # Tools configured by Home Manager
  programs.home-manager.enable = true;
  programs.git = {
    enable = true;
    settings.user.email = "jo@stashed.dev";
    settings.user.name = "Jonathan Gravel";
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
  programs.starship = {
    enable = true;
    settings = {};
  };
}
