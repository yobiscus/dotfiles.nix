#!/bin/bash
#
# Initialize Nix toolchain and dotfiles in single-user installation mode
#
# Works with https://github.com/DavHau/nix-portable
#

set -e

if [[ ! -d ~/.nix-portable ]]; then
    curl -L https://github.com/DavHau/nix-portable/releases/latest/download/nix-portable-$(uname -m) > ~/.local/bin/nix-portable
    chmod +x ~/.local/bin/nix-portable
    ln -s nix-portable ~/.local/bin/nix
    ln -s nix-portable ~/.local/bin/nix-collect-garbage
    ln -s nix-portable ~/.local/bin/nix-shell
    # populate nix-portable and make sure it works
    nix-shell -p bash --run exit
fi

if [[ ! -e $HOME/.nix-profile/bin/home-manager ]]; then
    [[ -d $HOME/.config/home-manager ]] && mv $HOME/.config/home-manager{,.bak}
    ln -sf "$HOME/.dotfiles/config/home-manager" "$HOME/.config/home-manager"
    NP_RUNTIME=bwrap nix run home-manager/master -- \
        init "$(readlink -f "$HOME/.config/home-manager")" \
        --flake "$(readlink -f "$HOME/.config/home-manager")" \
        --impure --switch
fi
