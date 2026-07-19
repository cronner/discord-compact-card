# Discord Compact Card

Custom [Home Assistant](https://www.home-assistant.io/) Lovelace card that auto-discovers all Discord users from the [Discord Game](https://github.com/3rob3/Discord-Game) integration and displays them in a compact grid layout.

Requires the [Discord Game](https://github.com/3rob3/Discord-Game) integration.

## Features

- Auto-discovers all `sensor.discord_user_*` entities
- Compact 2-column grid layout
- Avatar with colored status border (online/idle/dnd/offline/voice)
- Game background images (header, large, capsule)
- Voice channel indicator with mute/deaf/stream icons
- Voice users sorted to top with customizable border color
- Toggle button to show/hide offline users
- Click to open entity details popup, navigate, or toggle an entity
- Compact mode for minimal layout
- Game badge on avatar
- Filter by Discord roles
- Sort by status, name, or game

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

| Name                   | Type    | Default              | Description                                                 |
|------------------------|---------|----------------------|-------------------------------------------------------------|
| `title`                | string  | `"Discord Gaming"`   | Card header title                                           |
| `auto_populate`        | boolean | `true`               | Auto-discover all Discord users                             |
| `show_toggle`          | boolean | `true`               | Show the eye toggle button                                  |
| `hide_offline`         | boolean | `false`              | Start with offline users hidden                             |
| `max_online`           | number  | `0`                  | Max active users to show (0 = unlimited)                    |
| `sort_by`              | string  | `"status"`           | Sort by `status`, `name`, or `game`                         |
| `show_game_badge`      | boolean | `false`              | Show game icon as badge on avatar                           |
| `click_action`         | string  | `"popup"`            | Click action: `popup`, `navigate`, or `toggle`              |
| `click_action_target`  | string  | `""`                 | Target for navigate/toggle (URL path or entity_id)          |
| `compact_mode`         | boolean | `false`              | Minimal layout without background images                    |
| `voice_highlight_color`| string  | `""`                 | Custom hex color for voice avatar border (default: red)     |
| `filter_roles`         | list    | `[]`                 | Only show users with these Discord roles                    |

### Examples

Basic:

```yaml
type: custom:discord-compact-card
title: "Discord Gaming"
```

Full featured:

```yaml
type: custom:discord-compact-card
title: "Discord Gaming"
auto_populate: true
show_toggle: true
hide_offline: false
max_online: 10
sort_by: name
show_game_badge: true
compact_mode: false
voice_highlight_color: "#ff5722"
filter_roles:
  - "Gaming"
  - "Members"
```

Compact mode:

```yaml
type: custom:discord-compact-card
title: "Discord"
compact_mode: true
show_game_badge: true
sort_by: game
```

Click to navigate:

```yaml
type: custom:discord-compact-card
title: "Discord"
click_action: navigate
click_action_target: /lovelace/discord-detail
```

Click to toggle entity:

```yaml
type: custom:discord-compact-card
title: "Discord"
click_action: toggle
click_action_target: input_boolean.discord_notification
```
