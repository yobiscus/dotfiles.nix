#!/bin/bash
#
# Initalize dotfiles for Mac.
#
# Some nix modules are not compatible with macOS (haven't looked into it). Use
# homebrew for package management. This script just creates symlinks.
#

set -e

# Nix can be installed with macOS package. Download and run installer:
# https://install.determinate.systems/determinate-pkg/stable/Universal
# Note that this script doesn't use Nix at the moment.

# # Install Nix Home Manager
# if [[ ! -e $HOME/.nix-profile/bin/home-manager ]]; then
#     [[ -d $HOME/.config/home-manager ]] && mv $HOME/.config/home-manager{,.bak}
#     ln -sf $HOME/.dotfiles/config/home-manager $HOME/.config/home-manager
#     nix run home-manager/master -- init --switch $HOME/.config/home-manager
#     home-manager switch --flake $HOME/.config/home-manager
# fi

for repoconfig in ~/.dotfiles/config/* ~/.dotfiles/wm/config/*; do
    config=~/.config/$(basename "${repoconfig}")
    if [[ "$config" -ef "$repoconfig" ]]; then
        continue
    fi
    if [[ -e "$config" ]]; then
        mv -v "$config"{,.bak}
    fi
    ln -sv "$repoconfig" "$config"
done
