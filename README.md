# Edit Desktop Files GNOME Shell Extension

### Commands

Start the nested Wayland session with debug logs enabled + correct display:
```sh
G_MESSAGES_DEBUG="GNOME Shell" WAYLAND_DISPLAY=wayland-1 dbus-run-session -- gnome-shell --nested --wayland
```

Enable the extension in the nested session:
```sh
gnome-extensions enable editdesktopfiles@dannflower.github.io
```