{ config, pkgs, lib, ... }:

{
  home.packages = [
    pkgs.fd
    pkgs.fastfetch
    pkgs.ripgrep
  ];

  programs.direnv = {
    enable = true;
    enableZshIntegration = true;
  };

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

  services.ssh-agent = {
    enable = true;
    enableZshIntegration = true;
  };
}
