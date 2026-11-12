# Herdr app keys

The app's Linux defaults plus the native equivalents of the Herdr TUI's
effective keymap, including inherited defaults and personal overrides.

| Keys | Action |
| --- | --- |
| `Alt+1..9` | Select a space, already the app default |
| `Alt+Shift+1..9` | Select a tab |
| `Ctrl+h/j/k/l` | Focus the pane to the left/down/up/right |
| `Ctrl+Space`, then `,` or `.` | Previous or next agent |
| `Ctrl+Space`, then `v` or `-` | Split right or down |
| `Ctrl+Space`, then `Shift+n` | New workspace |
| `Ctrl+Space`, then `c` | New tab |
| `Ctrl+Space`, then `n` or `p` | Next or previous tab |
| `Ctrl+Space`, then `x` or `Shift+x` | Close pane or tab |
| `Ctrl+Space`, then `z` | Toggle pane zoom |
| `Ctrl+Space`, then `b` | Toggle sidebar |
| `Ctrl+Space`, then `s` | Settings |
| `Ctrl+Space`, then `w` or `g` | Space/tab picker |
| `Ctrl+Space`, then `Shift+w` or `Shift+t` | Rename workspace or tab |
| `Ctrl+Space`, then `Shift+d` | Close workspace |
| `Ctrl+Space`, then `Shift+g` | New worktree dialog |
| `Ctrl+Space`, then `q` | Close app window, terminals keep running |
| `Ctrl+Space`, then `?` | Shortcut help |

Only native keybindings are included. Numbered agent selection and the
Neovim sidebar/file picker need separate extension work. Scoopr is omitted.
TUI pane cycling, pane renaming, resize mode, notification targeting and
scrollback editing have no matching native app command. Config reload is
automatic in the app.

Home Manager links `keys.json` and `settings.json` individually with
`mkOutOfStoreSymlink`. Their targets are in this writable checkout, and
changes apply live.

`~/.config/herdr-app` stays a regular directory. Herdr provisions and
updates its bundled files and runtime state there, regardless of which
is installed first.

If existing config files differ on the first switch, use `hms -b backup`
to preserve them while installing the links. Files with identical
contents do not block activation, though Home Manager may leave them
as regular files until their contents differ.
