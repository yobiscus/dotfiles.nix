{ config, pkgs, ... }:

{
  home.packages = [
    pkgs.wofi
  ];

  # Hyprland
  wayland.windowManager.hyprland = {
    enable = true;
    extraConfig = ''
      source = ~/.config/hypr/conf/main.conf
    '';
  };

  home.file.".config/hypr/conf".source = ../../hypr/conf;
}
