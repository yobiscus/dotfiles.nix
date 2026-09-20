# Share an agent across interactive shells, including persistent herdr panes.
[[ -o interactive ]] || return
(( $+commands[ssh-agent] && $+commands[ssh-add] && $+commands[flock] )) || return

() {
    local agent_dir="${XDG_RUNTIME_DIR:-$HOME/.cache}/shell-ssh-agent"
    local key="$HOME/.ssh/id_ed25519"
    local lock_fd candidate identities fingerprint
    local -i agent_status

    (umask 077; mkdir -p -- "$agent_dir"; touch "$agent_dir/lock") || return
    exec {lock_fd}>"$agent_dir/lock" || return
    {
        flock "$lock_fd" || return

        ssh-add -l >/dev/null 2>&1
        agent_status=$?
        if (( agent_status > 1 )); then
            # Prefer the system agent, then our own stable socket.
            for candidate in "/run/user/$UID/ssh-agent" "$agent_dir/socket"; do
                [[ -S "$candidate" ]] || continue
                SSH_AUTH_SOCK="$candidate" ssh-add -l >/dev/null 2>&1
                agent_status=$?
                if (( agent_status <= 1 )); then
                    export SSH_AUTH_SOCK="$candidate"
                    unset SSH_AGENT_PID
                    break
                fi
            done
        fi

        if (( agent_status > 1 )); then
            # Only remove our own stale socket, with the startup lock held.
            rm -f -- "$agent_dir/socket"
            eval "$(ssh-agent -a "$agent_dir/socket" -s)" >/dev/null
            ssh-add -l >/dev/null 2>&1
            (( $? <= 1 )) || return
        fi

        # Prefer Ed25519; use the standard RSA key when it is absent.
        [[ -f "$key" ]] || key="$HOME/.ssh/id_rsa"
        [[ -r "$key" && -r "$key.pub" ]] || return
        fingerprint=$(ssh-keygen -lf "$key.pub" 2>/dev/null) || return
        fingerprint=${${(s: :)fingerprint}[2]}
        [[ -n "$fingerprint" ]] || return
        identities=$(ssh-add -l 2>/dev/null)
        if [[ " $identities " != *" $fingerprint "* ]]; then
            ssh-add "$key"
        fi
    } always {
        exec {lock_fd}>&-
    }
}
