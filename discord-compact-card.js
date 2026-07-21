const LitElement = Object.getPrototypeOf(
  customElements.get("ha-panel-lovelace")
);
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

class DiscordCompactCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
      _hideOffline: { type: Boolean },
    };
  }

  constructor() {
    super();
    this._hideOffline = false;
  }

  static getStubConfig() {
    return {
      title: "Discord",
      auto_populate: true,
      hide_offline: false,
      show_toggle: true,
      max_online: 0,
      sort_by: "status",
      show_game_badge: false,
      click_action: "popup",
      click_action_target: "",
      compact_mode: false,
      voice_highlight_color: "",
      filter_roles: [],
      card_size: "auto",
    };
  }

  setConfig(config) {
    this.config = config;
  }

  set hass(hass) {
    this._hass = hass;
    let entities = this._discoverEntities(hass);
    this._entities = entities;
    this.requestUpdate();
  }

  get hass() {
    return this._hass;
  }

  _discoverEntities(hass) {
    const auto = this.config.auto_populate !== false;
    const filterList = this.config.entities || [];
    const useFilter = !auto && filterList.length > 0;
    const prefix = "sensor.discord_user_";
    const baseEntities = {};

    for (const [entityId, state] of Object.entries(hass.states)) {
      if (!entityId.startsWith(prefix)) continue;
      const rest = entityId.slice(prefix.length);
      if (rest.includes("_")) continue;
      const uid = rest;
      if (useFilter && !filterList.includes(entityId) && !filterList.includes(uid)) continue;
      baseEntities[uid] = {
        entity: state,
        game: null,
        game_image_capsule_231x87: null,
        game_image_header: null,
        game_image_large: null,
        voice_channel: null,
        voice_afk: false,
        voice_self_mute: false,
        voice_self_deaf: false,
        voice_stream: false,
      };
    }

    for (const [entityId, state] of Object.entries(hass.states)) {
      if (!entityId.startsWith(prefix)) continue;
      const rest = entityId.slice(prefix.length);
      if (!rest.includes("_")) continue;
      const parts = rest.split("_");
      if (parts.length < 2) continue;
      const uid = parts[0];
      const suffix = parts.slice(1).join("_");
      if (!baseEntities[uid]) continue;
      const entry = baseEntities[uid];

      if (suffix === "game") entry.game = state.state;
      else if (suffix === "game_image_capsule_231x87") entry.game_image_capsule_231x87 = state.state;
      else if (suffix === "game_image_header") entry.game_image_header = state.state;
      else if (suffix === "game_image_large") entry.game_image_large = state.state;
      else if (suffix === "voice_channel") entry.voice_channel = state.state;
      else if (suffix === "voice_afk") entry.voice_afk = state.state === "True";
      else if (suffix === "voice_self_mute") entry.voice_self_mute = state.state === "True";
      else if (suffix === "voice_self_deaf") entry.voice_self_deaf = state.state === "True";
      else if (suffix === "voice_self_stream") entry.voice_stream = state.state === "True";
    }

    return Object.values(baseEntities);
  }

  _filterByRoles(entities) {
    const roles = this.config.filter_roles;
    if (!roles || roles.length === 0) return entities;
    return entities.filter(e => {
      const userRoles = e.entity.attributes.roles || [];
      return roles.some(r => userRoles.includes(r));
    });
  }

  _sortByStatus(entities) {
    const sortBy = this.config.sort_by || "status";
    const groups = { online: [], idle: [], dnd: [], offline: [], unavailable: [] };
    for (const e of entities) {
      const state = e.entity.state;
      const group = groups[state] || groups.offline;
      group.push(e);
    }
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => {
        const aVoice = (a.voice_channel && a.voice_channel !== "unknown") ? 0 : 1;
        const bVoice = (b.voice_channel && b.voice_channel !== "unknown") ? 0 : 1;
        if (aVoice !== bVoice) return aVoice - bVoice;
        if (sortBy === "name") {
          const na = a.entity.attributes.display_name || "";
          const nb = b.entity.attributes.display_name || "";
          return na.localeCompare(nb);
        }
        if (sortBy === "game") {
          const na = a.entity.attributes.display_name || "";
          const nb = b.entity.attributes.display_name || "";
          const ag = a.game && a.game !== "unknown" && a.game !== "None" ? a.game : "";
          const bg = b.game && b.game !== "unknown" && b.game !== "None" ? b.game : "";
          if (ag && !bg) return -1;
          if (!ag && bg) return 1;
          return ag.localeCompare(bg) || na.localeCompare(nb);
        }
        const na = a.entity.attributes.display_name || "";
        const nb = b.entity.attributes.display_name || "";
        return na.localeCompare(nb);
      });
    }
    return groups;
  }

  _stateLabel(state) {
    switch (state) {
      case "online": return "Online";
      case "idle": return "Inaktiv";
      case "dnd": return "Forstyr ikke";
      case "offline": return "Offline";
      default: return "Ukendt";
    }
  }

  _handleAction(entry) {
    const action = this.config.click_action || "popup";
    const target = this.config.click_action_target || "";
    const e = entry.entity;

    if (action === "navigate" && target) {
      history.pushState(null, "", target);
      const event = new Event("location-changed", { composed: true });
      window.dispatchEvent(event);
    } else if (action === "toggle" && target) {
      const domain = target.split(".")[0];
      this.hass.callService(domain, "toggle", { entity_id: target });
    } else {
      const event = new Event("hass-more-info", { composed: true });
      event.detail = { entityId: e.entity_id };
      this.dispatchEvent(event);
    }
  }

  _renderUserItem(entry) {
    const e = entry.entity;
    const attrs = e.attributes;
    const name = attrs.display_name || attrs.friendly_name || "Unknown";
    const avatar = attrs.entity_picture || "";
    const game = entry.game && entry.game !== "unknown" && entry.game !== "None" ? entry.game : null;
    const gameImg = entry.game_image_header && entry.game_image_header !== "unknown"
      ? entry.game_image_header
      : entry.game_image_capsule_231x87 && entry.game_image_capsule_231x87 !== "unknown"
        ? entry.game_image_capsule_231x87
        : null;
    let bgImg = this.config.compact_mode ? null : (entry.game_image_header && entry.game_image_header !== "unknown"
      ? entry.game_image_header
      : entry.game_image_large && entry.game_image_large !== "unknown"
        ? entry.game_image_large
        : entry.game_image_capsule_231x87 && entry.game_image_capsule_231x87 !== "unknown"
          ? entry.game_image_capsule_231x87
          : null);
    const voice = entry.voice_channel && entry.voice_channel !== "unknown" ? entry.voice_channel : null;
    const state = e.state;
    const showBadge = this.config.show_game_badge && gameImg;
    const compact = this.config.compact_mode;

    return html`
      <div class="steam-multi ${state} ${voice ? "in-voice" : ""} ${compact ? "compact" : ""}" @click=${() => this._handleAction(entry)}>
        ${bgImg ? html`<img src="${bgImg}" class="steam-game-bg" onerror="this.style.display='none'">` : ""}
        <div class="steam-user ${compact ? "compact" : ""}">
          <div class="avatar-wrap ${voice ? "voice" : state}">
            ${avatar ? html`<img src="${avatar}?size=128" class="steam-avatar ${voice ? "voice" : state}" onerror="this.style.display='none'">` : html`<div class="steam-avatar ${voice ? "voice" : state}"></div>`}
            ${showBadge ? html`<img src="${gameImg}" class="game-badge" onerror="this.style.display='none'">` : ""}
          </div>
          <div class="user-container ${game ? "" : "no-game"}">
            <div class="steam-username ${voice ? "voice" : state}">${name}</div>
            ${!compact ? html`
            <div class="steam-value ${state} ${voice ? "voice" : ""}">
              ${voice ? html`<ha-icon icon="mdi:phone" class="mic-icon"></ha-icon>${" " + voice}` : ""}
              ${!voice && game ? game : ""}
              ${!voice && !game ? this._stateLabel(state) : ""}
              ${voice && entry.voice_self_deaf ? html`<ha-icon icon="mdi:volume-off" class="mic-icon"></ha-icon>` : ""}
              ${voice && entry.voice_self_mute ? html`<ha-icon icon="mdi:microphone-off" class="mic-icon"></ha-icon>` : ""}
              ${voice && entry.voice_stream ? html`<ha-icon icon="mdi:monitor-shimmer" class="mic-icon"></ha-icon>` : ""}
            </div>` : ""}
          </div>
        </div>
      </div>
    `;
  }

  render() {
    if (!this._hass || !this._entities || this._entities.length === 0) {
      return html`<ha-card><div class="empty">Ingen Discord-brugere fundet</div></ha-card>`;
    }

    let filtered = this._filterByRoles(this._entities);

    const hideOffline = this.config.hide_offline || this._hideOffline || (this.config.show_offline === false);
    const showToggle = this.config.show_toggle !== false;
    const maxOnline = this.config.max_online || 0;
    const compact = this.config.compact_mode;
    const voiceColor = this.config.voice_highlight_color || "";

    let cardStyle = "";
    if (voiceColor) {
      cardStyle = `--voice-color: ${voiceColor}; --voice-shadow: ${voiceColor}88;`;
    }

    const groups = this._sortByStatus(filtered);
    const allDiscord = [...groups.online, ...groups.idle, ...groups.dnd, ...groups.unavailable, ...groups.offline];
    const inVoice = allDiscord.filter(e => e.voice_channel && e.voice_channel !== "unknown");
    const notInVoice = allDiscord.filter(e => !e.voice_channel || e.voice_channel === "unknown");
    let offlineNotInVoice = notInVoice.filter(e => e.entity.state === "offline");
    const maxOffline = this.config.max_offline || 0;
    if (maxOffline > 0) offlineNotInVoice = offlineNotInVoice.slice(0, maxOffline);
    let activeNotInVoice = notInVoice.filter(e => e.entity.state !== "offline");
    if (maxOnline > 0) activeNotInVoice = activeNotInVoice.slice(0, maxOnline);

    return html`
      <ha-card style="${cardStyle}">
        <div class="card-header">
          ${this.config.title ? html`<div class="name">${this.config.title}</div>` : html`<div></div>`}
          ${showToggle && groups.offline.length > 0
            ? html`<div class="toggle-btn" @click=${this._toggleOffline}>
                <ha-icon icon="${hideOffline ? "mdi:eye-off" : "mdi:eye"}"></ha-icon>
                <span>${hideOffline ? "Vis offline (" + groups.offline.length + ")" : "Skjul offline"}</span>
              </div>`
            : ""}
        </div>
        ${inVoice.length > 0
          ? html`
              <div class="status-category">I opkald (${inVoice.length})</div>
              <div class="user-grid ${compact ? "compact" : ""}">
                ${inVoice.map(e => this._renderUserItem(e))}
              </div>`
          : ""}
        ${activeNotInVoice.length > 0
          ? html`<div class="user-grid ${compact ? "compact" : ""}">
              ${activeNotInVoice.map(e => this._renderUserItem(e))}
            </div>`
          : ""}
        ${!hideOffline && offlineNotInVoice.length > 0
          ? html`
              <div class="status-category">Offline (${offlineNotInVoice.length})</div>
              <div class="user-grid ${compact ? "compact" : ""}">
                ${offlineNotInVoice.map(e => this._renderUserItem(e))}
              </div>`
          : ""}
      </ha-card>
    `;
  }

  _toggleOffline() {
    this._hideOffline = !this._hideOffline;
  }

  getCardSize() {
    return 3;
  }

  static get styles() {
    return css`
      ha-card {
        padding: 16px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .card-header {
        width: 100%;
        padding-bottom: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .card-header .name {
        font-size: 1.2em;
        font-weight: 600;
      }
      .toggle-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.75em;
        opacity: 0.6;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
        transition: opacity 0.15s, background 0.15s;
        user-select: none;
      }
      .toggle-btn:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.08);
      }
      .toggle-btn ha-icon {
        --mdc-icon-size: 16px;
      }
      .empty {
        text-align: center;
        padding: 16px;
        opacity: 0.5;
      }
      .status-category {
        text-align: left;
        width: 100%;
        font-size: 0.75em;
        font-weight: 600;
        text-transform: uppercase;
        opacity: 0.6;
        margin: 6px 0 4px 0;
        letter-spacing: 0.5px;
      }
      .user-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
        margin-bottom: 4px;
      }
      .user-grid.compact {
        gap: 2px;
        margin-bottom: 2px;
      }
      .steam-multi {
        position: relative;
        overflow: hidden;
        border-radius: 8px;
        min-height: 48px;
        cursor: pointer;
        transition: opacity 0.15s;
      }
      .steam-multi.compact {
        min-height: 36px;
        border-radius: 6px;
      }
      .steam-multi.offline {
        opacity: 0.45;
      }
      .steam-multi.in-voice {
        opacity: 1;
      }
      .steam-multi:hover {
        opacity: 1;
      }
      .steam-game-bg {
        z-index: 0;
        position: absolute;
        top: 0;
        right: 0;
        height: 100%;
        width: 100%;
        object-fit: cover;
        opacity: 0.4;
        mask-image: linear-gradient(to right, transparent 5%, black 70%);
        -webkit-mask-image: linear-gradient(to right, transparent 5%, black 70%);
      }
      .steam-user {
        display: flex;
        align-items: center;
        padding: 6px 8px;
        position: relative;
        z-index: 1;
        gap: 8px;
      }
      .steam-user.compact {
        padding: 4px 6px;
        gap: 6px;
      }
      .avatar-wrap {
        flex-shrink: 0;
        position: relative;
      }
      .steam-avatar {
        width: 36px;
        height: 36px;
        min-width: 36px;
        min-height: 36px;
        border-radius: 50%;
        border-style: solid;
        border-width: 2px;
        object-fit: cover;
      }
      .steam-multi.compact .steam-avatar {
        width: 28px;
        height: 28px;
        min-width: 28px;
        min-height: 28px;
      }
      .game-badge {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 16px;
        height: 16px;
        border-radius: 3px;
        object-fit: cover;
        border: 1px solid rgba(0, 0, 0, 0.4);
      }
      .steam-avatar.online {
        border-color: #6cff4f9d;
        box-shadow: 1px 0.5px 3px #6cff4f88;
      }
      .steam-avatar.idle {
        border-color: #d6ca1c9d;
        box-shadow: 1px 0.5px 3px #d6ca1c88;
      }
      .steam-avatar.dnd {
        border-color: #4081e49d;
        box-shadow: 1px 0.5px 3px #4081e488;
      }
      .steam-avatar.offline {
        border-color: #aaaaaa9d;
        opacity: 0.3;
        box-shadow: 1px 0.5px 3px #aaaaaa88;
      }
      .steam-avatar.voice {
        border-color: var(--voice-color, #e44040cc);
        box-shadow: 1px 0.5px 3px var(--voice-shadow, #e4404088);
        opacity: 1;
      }
      .steam-username.voice {
        opacity: 1;
      }
      .user-container {
        margin-left: 0;
        width: 100%;
        min-width: 0;
        overflow: hidden;
        align-content: center;
      }
      .user-container.no-game {
        align-items: center;
      }
      .steam-username {
        width: 100%;
        font-weight: 600;
        font-size: 0.85em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .steam-multi.compact .steam-username {
        font-size: 0.78em;
      }
      .steam-username.offline {
        opacity: 0.5;
      }
      .steam-value {
        width: 100%;
        font-size: 0.72em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .steam-value.offline {
        opacity: 0.5;
      }
      .steam-value.voice {
        color: #4081e4;
        display: flex;
        align-items: center;
        gap: 3px;
      }
      .mic-icon {
        --mdc-icon-size: 12px;
      }
    `;
  }
}

customElements.define("discord-compact-card", DiscordCompactCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "discord-compact-card",
  name: "Discord Compact Card",
  description: "Auto-discovers Discord users and displays them compactly by status with game backgrounds.",
});
