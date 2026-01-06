#!/bin/bash
#
# Initialize Nix toolchain and dotfiles in single-user installation mode
#
# Must be run inside `nix-user-chroot ~/.nix bash -l` chroot

if [[ ! -d /nix/store ]]; then
    sh <(curl --proto '=https' --tlsv1.2 -L https://nixos.org/nix/install) --no-daemon
    mkdir -p /nix/etc/nix
    echo experimental-features = nix-command flakes \
        | tee -a /nix/etc/nix/nix.conf
fi

#
# May need to log out and back in at this point
#

if [[ ! -e $HOME/.nix-profile/bin/home-manager ]]; then
    [[ -d $HOME/.config/home-manager ]] && mv $HOME/.config/home-manager{,.bak}
    ln -sf "$HOME/.dotfiles/config/home-manager" "$HOME/.config/home-manager"
    nix run home-manager/master -- init --impure --switch --flake "$HOME/.config/home-manager"
fi
