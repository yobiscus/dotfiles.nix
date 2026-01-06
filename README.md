# Dotfiles

Powered by Nix Home Manager.

## Instructions

```bash
git clone git@github.com:yobiscus/dotfiles.nix ~/.dotfiles
cd ~/.dotfiles
git submodule update --init
```

**Ubuntu desktop:**

```bash
~/.dotfiles/init.ubuntu-desktop.sh
```

**macOS desktop:**

Some nix modules are not compatible with macOS (haven't looked into it). Use
homebrew for package management. The `mac-init.sh` script just creates
symlinks.

```bash
~/.dotfiles/init.macos-desktop.sh
```

**Linux server:**

Generic Linux machine, single-user Nix setup using nix-user-chroot.

```bash
~/dotfiles/init.linux-server.sh
```

## Screenshot

![desktop screenshot](images/screenshot01.png)
