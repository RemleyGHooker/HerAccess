{pkgs}: {
  deps = [
    pkgs.lsof
    pkgs.rustc
    pkgs.pkg-config
    pkgs.openssl
    pkgs.libxcrypt
    pkgs.libiconv
    pkgs.cargo
    pkgs.gitFull
    pkgs.glibcLocales
    pkgs.postgresql
  ];
}
