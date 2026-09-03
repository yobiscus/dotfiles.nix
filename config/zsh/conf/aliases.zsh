# -----------------------------------------------------
# Aliases
# -----------------------------------------------------

# -----------------------------------------------------
# Functions
# -----------------------------------------------------
et-herdr() {
    while : ; do
        herdr --remote "$@"
        echo "Auto-reconnecting to '$1'. Ctrl+C to cancel."
        sleep 1s || break
    done
}

# -----------------------------------------------------
# Named dirs
# -----------------------------------------------------
hash -d code=~/Code
hash -d cy=~/Code/yobiscus
hash -d notes=~/Notes
hash -d ny=~/Notes/Vaults/"Yobi's"
