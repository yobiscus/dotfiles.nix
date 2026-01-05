## QOL improvements

## Optional modules

- [ ] Personal and wm modules should be optional. Unitialized submodules are
      breaks flakes. Need another solution.

## Tools to configure

- [ ] zsh (oh-my-posh? oh-my-zsh plugin?)

## Dev environments

- [ ] cargo, rust-lsp, etc.
- [ ] wrapper for `nix flake new --template https://flakehub...`

## Ricing

- [ ] Customize wofi l&f
- [ ] Automatically regenerate matugen colors when changing wallpaper

## Multi-monitor

- [ ] Make sure external monitor is setup correctly when connecting for the first time
    - Currently there are way too many instances of waybar spawned
    - Sometimes waybar is not lined up properly
    - Sometimes the wallpaper is missing
- [ ] Prefer external monitor for primary workspaces (1, 2, 3)

## Misc.

- [ ] Start terminal and browser automatically in windows 1 and 2
- [ ] Avoid waybar SIGUSR2 (prefer kill and restart) ([issue](https://github.com/Alexays/Waybar/issues/3344))
