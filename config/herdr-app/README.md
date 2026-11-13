# Herdr app keys

The app's Linux defaults plus the native equivalents of the Herdr TUI's
effective keymap, including inherited defaults and personal overrides.

| Keys | Action |
| --- | --- |
| `Alt+1..9` | Select a space, already the app default |
| `Alt+Shift+1..9` | Select a tab |
| `Ctrl+h/j/k/l` | Focus the pane to the left/down/up/right |
| `Ctrl+Space`, then `,` or `.` | Previous or next agent |
| `Ctrl+Space`, then `[` | Scroll mode |
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

The `scroll-mode` mod captures the keyboard while its small popup is open.
`j`/`k` or Down/Up scroll one line; `Ctrl+d`/`Ctrl+u` scroll half a page;
`Ctrl+f`/`Ctrl+b` or PageDown/PageUp scroll a full page. `gg` jumps to the
oldest available scrollback and `G` to the live output. `q` or Escape closes
the popup and returns focus to the terminal, preserving the scroll position.
Pane navigation such as `Ctrl+h/j/k/l` and `Alt+h/j/k/l` closes scrolling
mode before moving focus. The original pane keeps its scroll position, and
the destination receives normal terminal input. Scrolling controls apply
only to the terminal where the mode opened.

While scrolling mode is open, its popup owns keyboard focus. Herdr App
therefore hides the terminal's native focus highlight and cursor. Keeping
those visible requires an app-side change.

Alternate-screen programs such as Vim and less have no host scrollback to
scroll. Text selection still uses the mouse.

The other bindings use native app commands. Numbered agent selection and the
Neovim sidebar/file picker need separate extension work. Scoopr is omitted.
TUI pane cycling, pane renaming, resize mode, notification targeting and
scrollback editing have no matching native app command. Config reload is
automatic in the app.

Home Manager links `keys.json`, `settings.json`, and the two `scroll-mode`
files individually with `mkOutOfStoreSymlink`. Their targets are in this
writable checkout, and changes apply live.

`~/.config/herdr-app` stays a regular directory. Herdr provisions and
updates its bundled files and runtime state there, regardless of which
is installed first.

If existing config files differ on the first switch, use `hms -b backup`
to preserve them while installing the links. Files with identical
contents do not block activation, though Home Manager may leave them
as regular files until their contents differ.
