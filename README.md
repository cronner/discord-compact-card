# Discord Compact Card

Custom [Home Assistant](https://www.home-assistant.io/) Lovelace card that auto-discovers all Discord users from the [Discord Game](https://github.com/3rob3/Discord-Game) integration and displays them in a compact grid layout.

Requires the [Discord Game](https://github.com/3rob3/Discord-Game) integration.

## Features

- Auto-discovers all `sensor.discord_user_*` entities
- Compact 2-column grid layout
- Avatar with colored status border (online/idle/dnd/offline/voice)
- Game background images (header, large, capsule)
- Voice channel indicator with mute/deaf/stream icons
- Voice users sorted to top with red avatar border
- Toggle button to show/hide offline users
- Click to open entity details popup

## Installation

### HACS (recommended)

1. Add this repository as a custom repository in HACS (type: Lovelace)
2. Search for "Discord Compact Card" and install

### Manual

Copy `discord-compact-card.js` to your `www/community/discord-compact-card/` directory.

Then add the resource in **Settings > Dashboards > Resources**:

| URL                                | Type   |
|------------------------------------|--------|
| `/local/community/discord-compact-card/discord-compact-card.js` | JavaScript Module |

## Configuration

| Name             | Type    | Default              | Description                                      |
|------------------|---------|----------------------|--------------------------------------------------|
| `title`          | string  | `"Discord Gaming"`   | Card header title                                |
| `auto_populate`  | boolean | `true`               | Auto-discover all Discord users                  |
| `show_toggle`    | boolean | `true`               | Show the eye toggle button                       |
| `hide_offline`   | boolean | `false`              | Start with offline users hidden                  |

### Example

```yaml
type: custom:discord-compact-card
title: "Discord Gaming"
auto_populate: true
show_toggle: true
hide_offline: false
```
