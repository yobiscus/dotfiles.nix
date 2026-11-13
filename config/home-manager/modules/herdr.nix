{ config, lib, pkgs, ... }:

{
  xdg.configFile = lib.genAttrs [
    "herdr-core/config.toml"
    "herdr-app/keys.json"
    "herdr-app/settings.json"
    "herdr-app/mods/scroll-mode/main.js"
    "herdr-app/mods/scroll-mode/mod.json"
    "herdr-app/layouts/focus.json"
    "herdr-app/layouts/focus.svg"
    "herdr-app/mods/focus"
  ] (path: {
    source = config.lib.file.mkOutOfStoreSymlink
      "${config.home.homeDirectory}/.dotfiles/config/${path}";
  });

  home.activation.installHerdrFocus = lib.hm.dag.entryAfter [ "linkGeneration" ] ''
    run env HERDR_APP_HOME="${config.xdg.configHome}/herdr-app" \
      ${pkgs.python3}/bin/python3 \
      "${config.home.homeDirectory}/.dotfiles/config/herdr-app/install-focus.py"
  '';
}
