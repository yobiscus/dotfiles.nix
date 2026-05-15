#!/usr/bin/env bash
#
# Installs packages and dotfiles.
#
# If --dotfiles-only is set, nix and packages are not installed. Symlinks to
# configuration files are created instead.
#

set -eu

#
# Helpers
#

usage() {
    echo "$(basename "$0") [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --dofiles-only               Don't install nix or packages."
    echo "  -m MODULE, --module=MODULE   Include optional module, repeat option for multiple."
    echo ""
    echo "Modules:"
    echo "  personal                     Personal computer only."
    echo "  work                         Work computer only."
    echo "  wm                           Window manager, desktop only."
    echo ""
}

fatal() {
    echo "Error: $*" >&2
    exit 1
}

contains() {
    local -n list=$1
    local value=$2
    [[ "${list[*]}" =~ (^|[[:space:]])$value($|[[:space:]]) ]] && return 0
    return 1
}

#
# variables
#

allowed_modules=(personal work wm)
opt_dotfiles_only=
opt_modules=()

#
# opt parse
#

while [[ -n "${1:-}" ]]; do
    case "$1" in
        -h|--help)       usage; exit 0                                   ;;
        --dotfiles-only) opt_dotfiles_only=1                             ;;
        -m|--modules)    opt_modules+=("${2}")                   ; shift ;;
        --modules=*)     opt_modules+=("${1#--modules=}")                ;;
        *)               usage >&2; fatal "Unexpected argument: $1"      ;;
    esac
    shift
done

#
# validation
#
#
for module in "${opt_modules[@]}"; do
    if ! contains allowed_modules "$module"; then
        usage >&2; fatal "Unexpected module: $module"
    fi
done

#
# main
#

if [[ $opt_dotfiles_only ]]; then
    # prepare to symlink second level config files from main and selected modules
    repoconfigs=(~/.dotfiles/config/*/*)
    for module in "${opt_modules[@]}"; do
        repoconfigs+=(~/.dotfiles/"$module"/config/*/*)
    done

    # create symlinks
    for repoconfig in "${repoconfigs[@]}"; do
        # skip nix-specific entries
        [[ "$repoconfig" =~ .config/home-manager ]] && continue

        # calculate dest
        config=~/.config/$(basename "$(dirname "${repoconfig}")")/$(basename "${repoconfig}")

        # check if install should happen
        [[ "$repoconfig" -ef "$config" ]] && continue  # already done
        [[ -L "$config" ]] && fatal "Refusing to overwrite symlink: $config"
        [[ -e "$config" ]] && fatal "Refusing to overwrite file: $config"

        # install
        mkdir -pv "$(dirname "$config")"
        rm -rfv "$config"
        ln -sv "$repoconfig" "$config"
    done

    # non-standard symlinks
    if [[ ! ~/.zshrc -ef ~/.config/zsh/zshrc ]]; then
        # refuse to do it if there is already a file there
        [[ -L ~/.zshrc ]] && fatal "Refusing to overwrite symlink: ~/.zshrc"
        [[ -e ~/.zshrc ]] && fatal "Refusing to overwrite file: ~/.zshrc"
        # install
        ln -sv ~/.config/zsh/zshrc ~/.zshrc
    fi
    exit 0
elif [[ ! $(head -n1 /etc/lsb-release 2>/dev/null) =~ Ubuntu ]]; then
    fatal "Full install only supported on Ubuntu - use --dotfiles-only option instead"
fi

# Assume Ubuntu at this point

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

# Install Nix Home Manager
for module in "${opt_modules[@]}"; do
    case $module in
        personal) export NIX_HM_PERSONAL=1          ;;
        wm)       export NIX_HM_WM=1                ;;
        work)     export NIX_HM_WORK=1              ;;
        *)        fatal "Unhandled module: $module" ;;
    esac
done

if [[ ! -e $HOME/.nix-profile/bin/home-manager ]]; then
    [[ -d $HOME/.config/home-manager ]] && mv $HOME/.config/home-manager{,.bak}
    ln -sf $HOME/.dotfiles/config/home-manager $HOME/.config/home-manager
    nix run home-manager/master -- init --impure --switch --flake "$HOME/.config/home-manager"
fi

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
    Exec=nixGL start-hyprland
    Name=Hyprland
EOF

    sudo apt install sddm
fi

#
# Consider the systemd unit below if /nix is on a different partition.
#
#   vi /etc/systemd/system/nix-online.service
#   systemctl enable nix-online.service
#   systemctl start nix-online.service
#
# [Unit]
# Description=Bring Nix services online
# After=nix.mount
# Requires=nix.mount
# DefaultDependencies=no
#
# [Service]
# Type=oneshot
# RemainAfterExit=yes
# ExecStart=/usr/bin/systemctl daemon-reload
# ExecStart=/usr/bin/systemctl restart --no-block nix-daemon.socket
#
# [Install]
# WantedBy=sysinit.target
#

#
# Consider this /usr/local/bin/hyprland-launch wrapper for Nvidia GPU
# compatibility (may need to hardcode $USER as that variable may not
# be correct on login):
#
# #!/bin/bash
# export PATH=/home/$USER/.nix-profile/bin:$PATH
# export XDG_DATA_DIRS=/home/$USER/.nix-profile/share:/nix/var/nix/profiles/default/share:${XDG_DATA_DIRS:-/usr/local/share:/usr/share}
# exec nixGL start-hyprland
#

# Remove unnecesary packages (TODO)
sudo apt purge curl
