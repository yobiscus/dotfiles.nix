{ config, pkgs, lib, ... }:

{
  home.packages = [
    pkgs.fastfetch
  ];

  programs.zsh = {
    enable = true;
    autosuggestion.enable = true;
    dotDir = "${config.xdg.configHome}/zsh";
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
  home.file.".config/zsh/conf".source = ../../../zsh/conf;

  # integrations
  programs.direnv.enableZshIntegration = true;
  programs.fzf.enableZshIntegration = true;

  programs.oh-my-posh = {
    enable = true;
    enableZshIntegration = true;
    configFile = "$HOME/.config/oh-my-posh/config.json";
  };
  # config.json is modified by Mutagen, so it has to be writable
  home.file.".config/oh-my-posh/config.json".source =
    config.lib.file.mkOutOfStoreSymlink
    "${config.home.homeDirectory}/.dotfiles/config/oh-my-posh/config.json";

  home.file.".config/fastfetch".source = ../../../fastfetch;
}
