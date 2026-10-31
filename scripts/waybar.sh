#!/bin/bash

if [[ $1 != reload ]]; then
    echo 'Error: unexpected command "$1"' >&2
    exit 1
fi

pkill -fx waybar
hyprctl eval 'hl.exec_cmd("waybar")' >/dev/null
