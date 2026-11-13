{ config, lib, ... }:

{
  xdg.configFile = lib.genAttrs [
    "herdr-core/config.toml"
    "herdr-app/keys.json"
    "herdr-app/settings.json"
  ] (path: {
    source = config.lib.file.mkOutOfStoreSymlink
      "${config.home.homeDirectory}/.dotfiles/config/${path}";
  });
}
