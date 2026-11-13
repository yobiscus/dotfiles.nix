# Herdr app

## Focus layout

Focus replaces the separate Spaces and Agents lists with a sidebar of
single-line space rows. Each row shows aggregate agent status, the space
name, branch and Git drift. The details area below contains the freeform
note preview/editor, path actions, branch, and Git change counts.

The leftmost icon is All, a view of every space. Every space belongs to
exactly one real panel. Priority, Work, Research, Blocked, and Parked are
initial panels; right-click an icon to rename it, choose an icon or color,
change its position, choose the default, or delete it. Deletion moves its
spaces to another chosen panel and keeps their terminals running. Existing
spaces initially belong to Work.

Drag one or more spaces onto a panel icon to reassign them. Pause over an
icon to preview its list; Escape or leaving the sidebar cancels the drag.
Ctrl-click toggles selection and Shift-click selects a range. Dropping onto
a row reorders within that machine. All cannot own spaces; reordering its
rows preserves their original panel assignments. Undo restores the last
move without reverting note edits.

Each panel keeps its machine sections, selected space, search settings, and
scroll position. Icon badges report input requests and unseen results from
hidden panels. Clicking a badge jumps to attention in that panel. Clicking
a row's status jumps to its most urgent agent; right-clicking the status
shows the full agent list, including subagents. Agent completion never
changes panel membership or edits a note.

Click the note preview or note button in the details area to edit the full
note. Save with the button or Ctrl+Enter; Escape cancels. Notes,
panel membership, display order, and panel settings are local to this app
installation and follow spaces between panels. Offline spaces retain their
assignments and notes. No new pinning, automatic routing, or snapshots.

New spaces use the active space's machine. Creation inside a named panel
assigns that panel; creation in All inherits the active space's owner, or
uses the default when nothing is active. Spaces discovered after a remote
reconnect receive the default if they have no saved assignment.

Git follows the space's first terminal's current folder, falling back to
the space's configured folder. `↑`/`↓` compare against the locally known
upstream, and `Δ` counts changed files. Queries do not fetch or change the
index. Failed queries retain the last known values and mark them stale.

| Keys in Focus | Action |
| --- | --- |
| `Alt+1..9` | Select a space within this panel |
| `Ctrl+Space`, then Tab / Shift+Tab | Next / previous panel |
| `Ctrl+Space`, then `w` or `g` | Search this panel |
| `Ctrl+Space`, then `/` | Search all panels |
| `Ctrl+Space`, then `e` | Edit the selected space's note |
| `Ctrl+Space`, then `u` | Undo the last move |
| `Alt+Down/Up` or `Ctrl+Space`, then `.` / `,` | Next / previous agent in this panel |

Search matches names, paths, branches, notes, machine names, and agent
titles. Use Here/All beside the field to change its scope. Selecting a
global result reveals its owning panel, unless already viewing All.

Home Manager links the personal Focus directory as a unit, so relative
imports stay inside Herdr's module boundary. Its activation step copies the
SVGs to `focus-icons/` inside Herdr's config directory, because older running
app versions cannot read assets through links to the checkout. JavaScript
edits remain live; rerun the installer after changing icons. To install it
before the next Home Manager switch:

```sh
python3 ~/.dotfiles/config/herdr-app/install-focus.py
herdr-app do layout.switch '{"name":"focus"}'
```

The installer preserves the bundled layouts and merges only Focus's key
bindings into a regular key file. The mod follows the existing theme in
light and dark modes. Its retained scroll lists support drag handlers and
keep separate native scroll positions per panel; row construction is linear
in the number of spaces.

Validation:

```sh
node --experimental-vm-modules ~/.dotfiles/config/herdr-app/tests/focus.mjs
herdr-app check ~/.dotfiles/config/herdr-app/mods/focus
```

## Keys

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

Home Manager links `keys.json`, `settings.json`, the two `scroll-mode`
files, and the personal Focus directory with `mkOutOfStoreSymlink`. Their
targets are in this writable checkout, and changes apply live.

`~/.config/herdr-app` stays a regular directory. Herdr provisions and
updates its bundled files and runtime state there, regardless of which
is installed first.

If existing config files differ on the first switch, use `hms -b backup`
to preserve them while installing the links. Files with identical
contents do not block activation, though Home Manager may leave them
as regular files until their contents differ.
