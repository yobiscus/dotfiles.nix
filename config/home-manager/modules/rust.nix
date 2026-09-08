{ config, pkgs, ... }:

{
  home.packages = [
    pkgs.cargo        # The Rust package manager
    pkgs.rustc        # The Rust compiler
    pkgs.clippy       # Rust linter
    pkgs.rustfmt      # Rust code formatter
    pkgs.openssl
    pkgs.pkg-config
  ];

  home.sessionVariables = {
    PKG_CONFIG_PATH = "${pkgs.openssl.dev}/lib/pkgconfig";
  };
}
