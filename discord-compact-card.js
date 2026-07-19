/**
 * Discord Compact Card
 * Auto-discovers all sensor.discord_user_* entities and displays them
 * in a grid layout with game background images, grouped by status.
 */
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
      title: "Discord Gaming",
      auto_populate: true,
      hide_offline: false,
      show_toggle: true,
    };
  }

  setConfig(config) {
    this.config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this._entities = this._discoverEntities(hass);
    this.requestUpdate();
  }

  get hass() {
    return this._hass;
  }

  _discoverEntities(hass) {
    const prefix = "sensor.discord_user_";
    const baseEntities = {};

    for (const [entityId, state] of Object.entries(hass.states)) {
      if (!entityId.startsWith(prefix)) continue;
      const rest = entityId.slice(prefix.length);
      if (rest.includes("_")) continue;
      const uid = rest;
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

  _sortByStatus(entities) {
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
        const na = a.entity.attributes.display_name || "";
        const nb = b.entity.attributes.display_name || "";
        return na.localeCompare(nb);
      });
    }
    return groups;
  }

  _pairUp(items) {
    const pairs = [];
    for (let i = 0; i < items.length; i += 2) {
      pairs.push(items.slice(i, i + 2));
    }
    return pairs;
  }

  _renderPairRow(pair) {
    return html`
      <div class="user-row">
        ${this._renderUserItem(pair[0])}
        ${pair[1] ? this._renderUserItem(pair[1]) : html`<div class="steam-multi empty"></div>`}
      </div>
    `;
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

  _stateColor(state) {
    switch (state) {
      case "online": return "#6cff4f";
      case "idle": return "#d6ca1c";
      case "dnd": return "#4081e4";
      default: return "#aaaaaa";
    }
  }

  _renderUserItem(entry) {
    const e = entry.entity;
    const attrs = e.attributes;
    const name = attrs.display_name || attrs.friendly_name || "Unknown";
    const avatar = attrs.entity_picture || "";
    const game = entry.game && entry.game !== "unknown" && entry.game !== "None" ? entry.game : null;
    const bgImg = entry.game_image_header && entry.game_image_header !== "unknown"
      ? entry.game_image_header
      : entry.game_image_large && entry.game_image_large !== "unknown"
        ? entry.game_image_large
        : entry.game_image_capsule_231x87 && entry.game_image_capsule_231x87 !== "unknown"
          ? entry.game_image_capsule_231x87
          : null;
    const voice = entry.voice_channel && entry.voice_channel !== "unknown" ? entry.voice_channel : null;
    const state = e.state;
    const color = this._stateColor(state);

    return html`
      <div class="steam-multi ${state} ${voice ? "in-voice" : ""}" @click=${() => this._handlePopup(e)}>
        ${bgImg ? html`<img src="${bgImg}" class="steam-game-bg" onerror="this.style.display='none'">` : ""}
        <div class="steam-user">
          <div class="avatar-wrap ${voice ? "voice" : state}">
            ${avatar ? html`<img src="${avatar}?size=128" class="steam-avatar ${voice ? "voice" : state}" onerror="this.style.display='none'">` : html`<div class="steam-avatar ${voice ? "voice" : state}"></div>`}
          </div>
          <div class="user-container ${game ? "" : "no-game"}">
            <div class="steam-username ${voice ? "voice" : state}">${name}</div>
            <div class="steam-value ${state} ${voice ? "voice" : ""}">
              ${voice ? html`<ha-icon icon="mdi:phone" class="mic-icon"></ha-icon>${" " + voice}` : ""}
              ${!voice && game ? game : ""}
              ${!voice && !game ? this._stateLabel(state) : ""}
              ${voice && entry.voice_self_deaf ? html`<ha-icon icon="mdi:volume-off" class="mic-icon"></ha-icon>` : ""}
              ${voice && entry.voice_self_mute ? html`<ha-icon icon="mdi:microphone-off" class="mic-icon"></ha-icon>` : ""}
              ${voice && entry.voice_stream ? html`<ha-icon icon="mdi:monitor-shimmer" class="mic-icon"></ha-icon>` : ""}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _renderPairRow(pair) {
    return html`
      <div class="user-row">
        ${this._renderUserItem(pair[0])}
        ${pair[1] ? this._renderUserItem(pair[1]) : html`<div class="steam-multi empty"></div>`}
      </div>
    `;
  }

  _renderGroup(label, entries) {
    if (!entries || entries.length === 0) return html``;
    return html`
      <div class="status-category">${label} (${entries.length})</div>
      <div class="user-grid">
        ${entries.map(e => this._renderUserItem(e))}
      </div>
    `;
  }

  render() {
    if (!this._hass || !this._entities || this._entities.length === 0) {
      return html`<ha-card><div class="empty">Ingen Discord-brugere fundet</div></ha-card>`;
    }

    const groups = this._sortByStatus(this._entities);
    const hideOffline = this.config.hide_offline || this._hideOffline || (this.config.show_offline === false);
    const showToggle = this.config.show_toggle !== false;

    const allUsers = [...groups.online, ...groups.idle, ...groups.dnd, ...groups.unavailable, ...groups.offline];
    const inVoice = allUsers.filter(e => e.voice_channel && e.voice_channel !== "unknown");
    const notInVoice = allUsers.filter(e => !e.voice_channel || e.voice_channel === "unknown");
    const offlineNotInVoice = notInVoice.filter(e => e.entity.state === "offline");
    const activeNotInVoice = notInVoice.filter(e => e.entity.state !== "offline");

    return html`
      <ha-card>
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
              <div class="user-grid">
                ${inVoice.map(e => this._renderUserItem(e))}
              </div>`
          : ""}
        ${activeNotInVoice.length > 0
          ? html`<div class="user-grid">
              ${activeNotInVoice.map(e => this._renderUserItem(e))}
            </div>`
          : ""}
        ${!hideOffline && offlineNotInVoice.length > 0
          ? html`
              <div class="status-category">Offline (${offlineNotInVoice.length})</div>
              <div class="user-grid">
                ${offlineNotInVoice.map(e => this._renderUserItem(e))}
              </div>`
          : ""}
      </ha-card>
    `;
  }

  _handlePopup(stateObj) {
    const event = new Event("hass-more-info", { composed: true });
    event.detail = { entityId: stateObj.entity_id };
    this.dispatchEvent(event);
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
      .user-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
        margin-bottom: 4px;
      }
      .user-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
        margin-bottom: 4px;
      }
      .steam-multi {
        position: relative;
        overflow: hidden;
        border-radius: 8px;
        min-height: 48px;
        cursor: pointer;
        transition: opacity 0.15s;
      }
      .steam-multi.empty {
        background: transparent;
        min-height: 0;
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
      .avatar-wrap {
        flex-shrink: 0;
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
      .steam-avatar.online {
        border-color: #6cff4f9d;
        box-shadow: 1px 0.5px 3px #6cff4f88;
      }
      .steam-avatar.idle, .steam-avatar.away {
        border-color: #d6ca1c9d;
        box-shadow: 1px 0.5px 3px #d6ca1c88;
      }
      .steam-avatar.dnd, .steam-avatar.snooze {
        border-color: #4081e49d;
        box-shadow: 1px 0.5px 3px #4081e488;
      }
      .steam-avatar.offline {
        border-color: #aaaaaa9d;
        opacity: 0.3;
        box-shadow: 1px 0.5px 3px #aaaaaa88;
      }
      .steam-avatar.voice {
        border-color: #e44040cc;
        box-shadow: 1px 0.5px 3px #e4404088;
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
      .steam-value.offline-text {
        opacity: 0.4;
      }
      .icon-row {
        display: inline-flex;
        align-items: center;
        gap: 1px;
        margin-left: 4px;
        opacity: 0.7;
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
  description: "Auto-discovers Discord users and displays them compactly by status with game backgrounds",
});
