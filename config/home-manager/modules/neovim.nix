{ config, pkgs, ... }:

{
  home.packages = [
    pkgs.neovim
    # essentials
    pkgs.curl
    pkgs.fzf
    pkgs.gcc
    pkgs.nodejs
    # LSP servers, formatters, linters
    pkgs.clang-tools
    pkgs.lua-language-server
    pkgs.stylua
  ];

  home.sessionVariables = {
    EDITOR = "nvim";
    VISUAL = "nvim";
  };

  # copy as writable for convenience
  home.file.".config/nvim".source =
    config.lib.file.mkOutOfStoreSymlink
    "${config.home.homeDirectory}/.dotfiles/config/nvim";
}
