{ config, pkgs, lib, ... }:

{
  home.packages = [
    pkgs.fastfetch
    pkgs.zsh-powerlevel10k
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
      zshConfigLast = lib.mkOrder 1500 ''
        source $HOME/.config/zsh/conf/main.zsh
        source $HOME/.config/zsh/conf/p10k.zsh
        source ${pkgs.zsh-powerlevel10k}/share/zsh-powerlevel10k/powerlevel10k.zsh-theme
      '';
    in lib.mkMerge [ zshConfigEarlyInit zshConfigLast ];
  };
  home.file.".config/zsh/conf".source = ../../../zsh/conf;

  # integrations
  programs.direnv.enableZshIntegration = true;
  programs.fzf.enableZshIntegration = true;

  # TODO: Prompt follow-ups:
  # - Reload matugen colors in running shells when the palette changes.
  # - Consider rounded segments, transient prompts, and startup instant prompt.
  # - Add cached/async runtime versions and Nix/virtualenv context as needed.
  # - Measure command-to-prompt latency in large repos, including direnv hooks.

  home.file.".config/fastfetch".source = ../../../fastfetch;
}
