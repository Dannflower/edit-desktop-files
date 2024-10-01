# Edit Desktop Files GNOME Shell Extension

![Screenshot from 2024-09-28 18-21-00](https://github.com/user-attachments/assets/bcdee9ae-2886-47ac-a914-1a01d0f009ec)

Adds an `Edit` button to the pop-up menu displayed when right-clicking app icons in the app grid or dash. When clicked, it opens the `.desktop` file backing that app icon. Includes support for custom edit commands, allowing the user to specify another program or additional options when opening the file.

## Installation

Get the latest release from the [GNOME Extensions site](https://extensions.gnome.org/extension/7397/edit-desktop-files/)

Alternatively, download the extension bundle from a [release](https://github.com/Dannflower/edit-desktop-files/releases).

## Development

#### Pack the extension for release
```sh
gnome-extensions pack
```

#### Start the nested Wayland session
```sh
G_MESSAGES_DEBUG="GNOME Shell" WAYLAND_DISPLAY=wayland-1 dbus-run-session -- gnome-shell --nested --wayland
```

#### Enable the extension in the nested session
```sh
gnome-extensions enable editdesktopfiles@dannflower
```

#### View the preferences window
```sh
gnome-extensions prefs editdesktopfiles@dannflower
```

#### Recompile schemas
```sh
glib-compile-schemas schemas/
```