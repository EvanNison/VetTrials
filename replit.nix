{ pkgs }: {
  deps = [
    pkgs.nodejs_22
    pkgs.postgresql_17
    pkgs.chromium
    pkgs.nss
    pkgs.xorg.libX11
    pkgs.xorg.libXcomposite
    pkgs.xorg.libXdamage
    pkgs.xorg.libXext
    pkgs.xorg.libXfixes
    pkgs.xorg.libXrandr
    pkgs.xorg.libxcb
    pkgs.mesa
    pkgs.alsa-lib
    pkgs.at-spi2-atk
    pkgs.cups
    pkgs.dbus
    pkgs.expat
    pkgs.glib
    pkgs.gtk3
    pkgs.pango
    pkgs.cairo
  ];

  env = {
    PLAYWRIGHT_BROWSERS_PATH = "${pkgs.chromium}/bin";
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";
    CHROME_PATH = "${pkgs.chromium}/bin/chromium";
  };
}
