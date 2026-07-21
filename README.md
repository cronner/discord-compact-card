# Discord Compact Card

A Home Assistant Lovelace custom card that auto-discovers all Discord users and displays them in a compact grid layout with game backgrounds, grouped by status.

## Features

- Auto-discovers all `sensor.discord_user_*` entities
- Shows online status, game activity, and voice channels
- Steam game data overlay via `steam_discord_map`
- Toggle offline visibility
- Compact mode
- Role filtering

## Installation

### HACS (recommended)

Add this repository as a custom repository in HACS, then install "Discord Compact Card".

### Manual

1. Copy `discord-compact-card.js` to `/config/www/community/discord-compact-card/`
2. Add the resource in Lovelace:
   ```yaml
   resources:
     - url: /local/community/discord-compact-card/discord-compact-card.js
       type: module
   ```

## Configuration

```yaml
type: custom:discord-compact-card
title: "Discord"
auto_populate: true
hide_offline: true
show_toggle: true
show_game_badge: true
compact_mode: false
sort_by: "status"
click_action: "popup"
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `title` | `"Discord"` | Card title |
| `auto_populate` | `true` | Auto-discover Discord users |
| `entities` | `[]` | Manual entity list (e.g. `["sensor.discord_user_12345"]`) when `auto_populate: false` |
| `hide_offline` | `false` | Hide offline users by default |
| `show_toggle` | `true` | Show toggle button for offline visibility |
| `show_game_badge` | `false` | Show game image badge on avatar |
| `compact_mode` | `false` | Compact display mode |
| `sort_by` | `"status"` | Sort order (`status`, `name`, `game`) |
| `click_action` | `"popup"` | Click action (`popup`, `navigate`, `toggle`) |
| `filter_roles` | `[]` | Only show users with these Discord roles |
| `steam_discord_map` | `[]` | Map Steam entities to Discord users for game overlay |

### Steam Game Overlay

Use `steam_discord_map` to overlay Steam game data onto Discord users:

```yaml
steam_discord_map:
  - discord: "discord_username"
    steam: "sensor.steam_username"
```
