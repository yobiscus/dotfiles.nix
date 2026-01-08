#!/bin/bash
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
        echo $module
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
else
    fatal "Only --dotfiles-only is implemented"
fi
