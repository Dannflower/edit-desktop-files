# Edit Desktop Files GNOME Shell Extension

Adds an `Edit` button to the popup-menu displayed when right-clicking app icons in the 'App Grid'. When clicked, it opens the `.desktop` file backing that app icon.

![Screenshot from 2024-09-28 18-21-00](https://github.com/user-attachments/assets/bcdee9ae-2886-47ac-a914-1a01d0f009ec)

## Development

### Start the nested Wayland session
```sh
G_MESSAGES_DEBUG="GNOME Shell" WAYLAND_DISPLAY=wayland-1 dbus-run-session -- gnome-shell --nested --wayland
```

### Enable the extension in the nested session
```sh
gnome-extensions enable editdesktopfiles@dannflower
```

### View the preferences window
```sh
gnome-extensions prefs editdesktopfiles@dannflower
```

### Recompile schemas
```sh
glib-compile-schemas schemas/
```