#!/bin/bash
set -euo pipefail

# Run from a TTY after a locker crash. An optional argument selects the instance.
hyprctl --instance "${1:-0}" eval 'hl.config({ misc = { allow_session_lock_restore = true } }); hl.exec_cmd("hyprlock")'
