{ config, pkgs, ... }:

{
  # Hyprland
  wayland.windowManager.hyprland = {
    enable = true;
    settings = {
      bind = [
        "SUPER, B, exec, firefox"
	"SUPER, T, exec, kitty"
      ];
      monitor = [
        "eDP-1, 1920x1200, 0x0, 1.2"
      ];
    };
  };
}
