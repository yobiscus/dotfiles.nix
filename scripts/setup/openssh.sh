#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
config_template="$script_dir/openssh.conf.in"

if [[ "$(id -u)" -eq 0 ]]; then
    sudo_cmd=()
    ssh_user="${SSH_ADMIN_USER:-${SUDO_USER:-}}"
else
    sudo_cmd=(sudo)
    ssh_user="${SSH_ADMIN_USER:-$(id -un)}"
fi

if [[ -z "$ssh_user" || "$ssh_user" == root ]]; then
    printf '%s\n' \
        'Choose a non-root SSH account by running this as that user, or set SSH_ADMIN_USER.' >&2
    exit 1
fi

if [[ ! "$ssh_user" =~ ^[a-z_][a-z0-9_.-]*[$]?$ ]]; then
    printf 'Unsupported account name for AllowUsers: %s\n' "$ssh_user" >&2
    exit 1
fi

account_entry="$(getent passwd "$ssh_user" || true)"
if [[ -z "$account_entry" ]]; then
    printf 'No local or directory account found for: %s\n' "$ssh_user" >&2
    exit 1
fi
IFS=: read -r _ _ _ _ _ ssh_home _ <<< "$account_entry"

if [[ "$(id -u)" -ne 0 ]]; then
    "${sudo_cmd[@]}" -v
fi

temporary_config="$(mktemp)"
trap 'rm -f "$temporary_config"' EXIT
sed "s/@SSH_ADMIN_USER@/${ssh_user}/" "$config_template" > "$temporary_config"

# Stage the restrictive config before installing the package, since Ubuntu may
# start ssh.socket automatically as part of the package installation.
"${sudo_cmd[@]}" install -d -o root -g root -m 0755 /etc/ssh/sshd_config.d
"${sudo_cmd[@]}" install -o root -g root -m 0644 \
    "$temporary_config" /etc/ssh/sshd_config.d/00-local-key-only.conf

"${sudo_cmd[@]}" apt-get update
"${sudo_cmd[@]}" apt-get install --yes openssh-server
"${sudo_cmd[@]}" /usr/sbin/sshd -t

# Ubuntu uses socket activation for OpenSSH. Reload the systemd generator so it
# sees the installed config, then enable the socket and restart the service.
"${sudo_cmd[@]}" systemctl daemon-reload
"${sudo_cmd[@]}" systemctl enable --now ssh.socket
"${sudo_cmd[@]}" systemctl restart ssh.service

printf '%s\n' \
    "OpenSSH is installed with key-only authentication for user $ssh_user." \
    "Add connecting device public keys to $ssh_home/.ssh/authorized_keys before relying on SSH access."
