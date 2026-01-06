#!/bin/bash
#
# Initalize Nix toolchain and dotfiles for Ubuntu.
#

# Update pre-installed packages
sudo apt update
sudo apt dist-upgrade

# Install Nix
if [[ ! -d /nix ]]; then
    sudo apt install curl
    sh <(curl --proto '=https' --tlsv1.2 -L https://nixos.org/nix/install) --daemon
    echo experimental-features = nix-command flakes \
        | sudo tee -a /etc/nix/nix.conf
    sudo systemctl restart nix-daemon.service
fi

#
# May need to log out and back in at this point
#

# Install Nix Home Manager
export HM_HM_PERSONAL=1 NIX_HM_WM=1
if [[ ! -e $HOME/.nix-profile/bin/home-manager ]]; then
    [[ -d $HOME/.config/home-manager ]] && mv $HOME/.config/home-manager{,.bak}
    ln -sf $HOME/.dotfiles/config/home-manager $HOME/.config/home-manager
    nix run home-manager/master -- init --impure --switch --flake "$HOME/.config/home-manager"
fi

#
# May need to log out and back in at this point
#

# Finish configuring Hyprland
hyprland_desktop=/usr/share/wayland-sessions/hyprland.desktop
if [[ ! -e $hyprland_desktop ]]; then
    nix-channel \
        --add https://github.com/nix-community/nixGL/archive/main.tar.gz \
        nixgl
    nix-channel --update
    nix-env -iA nixgl.auto.nixGLDefault

    sudo tee "$hyprland_desktop" >/dev/null <<EOF
    [Desktop Entry]
    Exec=nixGL Hyprland
    Name=Hyprland
EOF
fi

# Remove unnecesary packages (TODO)
sudo apt purge curl firefox
