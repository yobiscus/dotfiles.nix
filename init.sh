#!/bin/bash

# Update pre-installed packages
sudo apt update
sudo apt dist-upgrade

# Install Nix
if [[ ! -d /nix ]]; then
    sudo apt install curl
    sh <(curl --proto '=https' --tlsv1.2 -L https://nixos.org/nix/install) --daemon
fi

#
# May need to log out and back in at this point
#

# Install Nix Home Manager
if [[ ! -e $HOME/.nix-profile/bin/home-manager ]]; then
    nix-channel \
        --add https://github.com/nix-community/home-manager/archive/master.tar.gz \
        home-manager
    nix-channel --update
    nix-shell '<home-manager>' -A install
    mv $HOME/.config/home-manager{,.bak}
    ln -sf $HOME/.dotfiles/config/home-manager $HOME/.config/home-manager
    home-manager switch
fi

#
# May need to log out and back in at this point
#
