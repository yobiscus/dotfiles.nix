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

**Ubuntu OpenSSH server:**

Install and enable OpenSSH with key-only authentication for the account running
the script:

```bash
~/.dotfiles/scripts/setup/openssh.sh
```

Set `SSH_ADMIN_USER` to select a different account, for example:

```bash
SSH_ADMIN_USER=alice ~/.dotfiles/scripts/setup/openssh.sh
```

Add client public keys to that account's `.ssh/authorized_keys` before relying
on SSH access. The config template is `scripts/setup/openssh.conf.in`; it also
disables SSH forwarding. The script does not change firewall or router
settings, so keep port 22 unforwarded from the internet.

## Screenshot

![desktop screenshot](images/screenshot01.png)
