# Edit Desktop Files GNOME Shell Extension

<img width="389" height="266" alt="Screenshot From 2025-07-20 19-52-15" src="https://github.com/user-attachments/assets/40b702d2-2121-497f-93c5-87bc7840292d" />

Adds "Edit Entry", "Open Entry Location", and "Move Desktop Entry to Trash" options to the right-click menu of app icons in the app grid and dash.

- `Edit Entry` opens the .desktop file associated with the app using the system's default editor or a custom command configured in the extension's preferences.

- `Open Entry Location` opens the folder containing the .desktop file in the default file manager.

- `Move Entry to Trash` asks for confirmation, then moves the .desktop file to the user's trash if supported and permitted. If that fails, it offers a separate confirmation to permanently delete the file through GVfs's `admin://` backend, which may request administrator authorization through Polkit. If the backend or authorization is unavailable, the error is shown in a GNOME Shell notification.

## Installation

Get the latest release from the [GNOME Extensions site](https://extensions.gnome.org/extension/7397/edit-desktop-files/)

Alternatively, download the extension bundle from a [release](https://github.com/Dannflower/edit-desktop-files/releases).

## Development

Clone the project into:
```sh
~/.local/share/gnome-shell/extensions/editdesktopfiles@dannflower/
```

Enable the extension:
```sh
gnome-extensions enable editdesktopfiles@dannflower
```

### Development Commands

#### Start a nested Wayland session
```sh
dbus-run-session -- gnome-shell --nested --wayland
```

#### View the preferences window
```sh
gnome-extensions prefs editdesktopfiles@dannflower
```

#### Regenerate translation files
Regenerate translation template:
```sh
./scripts/template-translations.sh
```

Make sure to remove the entry for "App Details" from the `.pot` files before updating the other translations as this translation will be handled by the Gnome Shell.

Update existing translations:
```sh
./scripts/update-translations.sh
```

#### Recompile schemas
```sh
glib-compile-schemas schemas/
```

#### Pack the extension for release
```sh
gnome-extensions pack
```
Release tags here on GitHub should be created any time a new release gets approved on the GNOME Extensions site. The tags should match the version number in the approved release on GNOME Extensions.

#### Analyze the extension for GNOME extension issues
```sh
virtualenv venv
. venv/bin/activate
pip install -U shexli
shexli editdesktopfiles@dannflower.shell-extension.zip
```