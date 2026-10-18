/*
 * haseiq-ring-card
 * Doppelring-Karte für Hase IQ Kaminöfen (Home Assistant Lovelace)
 * Außenring: Temperatur  |  Innenring: Leistung
 * Keine Abhängigkeiten. Version 1.2.1
 */

const HASEIQ_VERSION = "1.2.1";

const PHASES = {
  "idle": { label: "Bereit", color: "#78716c", fg: "#f5f5f4", icon: "mdi:fireplace-off" },
  "heating up": { label: "Anheizen", color: "#F08C2A", fg: "#2b1405", icon: "mdi:fire" },
  "burning": { label: "Abbrand", color: "#E8590C", fg: "#2b1405", icon: "mdi:fire" },
  "add wood": { label: "Holz nachlegen", color: "#F2C14E", fg: "#2b1f05", icon: "mdi:tree", alert: "amber" },
  "don't add wood": { label: "Glut · nicht nachlegen", color: "#5DCAA5", fg: "#04342C", icon: "mdi:fire-off" },
};

const TEMP_STOPS = [
  [0.0, "#378ADD"],
  [0.4, "#EF9F27"],
  [0.7, "#F08C2A"],
  [1.0, "#E24B4A"],
];

const UNAVAILABLE = ["unavailable", "unknown", "", undefined, null];

const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lerp = (a, b, t) => a + (b - a) * t;

function tempColor(frac) {
  const f = Math.min(1, Math.max(0, frac));
  for (let i = 1; i < TEMP_STOPS.length; i++) {
    const [p1, c1] = TEMP_STOPS[i];
    if (f <= p1) {
      const [p0, c0] = TEMP_STOPS[i - 1];
      const t = (f - p0) / (p1 - p0 || 1);
      const a = hex2rgb(c0);
      const b = hex2rgb(c1);
      return `rgb(${a.map((v, k) => Math.round(lerp(v, b[k], t))).join(",")})`;
    }
  }
  return TEMP_STOPS[TEMP_STOPS.length - 1][1];
}

const R_OUT = 100;
const R_IN = 76;
const C_OUT = 2 * Math.PI * R_OUT;
const C_IN = 2 * Math.PI * R_IN;

const STYLE = `
  :host { display: block; }
  ha-card {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    background: var(--haseiq-bg, #1c1917);
    color: #f5f5f4;
    container-type: inline-size;
    border-radius: var(--ha-card-border-radius, 12px);
  }
  ha-card:focus-visible { outline: 2px solid #F2C14E; outline-offset: -2px; }
  .bg { position: absolute; inset: 0; background-size: cover; background-position: center; }
  .bg::after { content: ""; position: absolute; inset: 0; background: rgba(18, 15, 14, 0.74); }
  .wrap { position: relative; padding: 16px 20px 20px; }
  .head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  .name { font-size: 16px; font-weight: 500; }
  .sub { font-size: 12px; color: #a8a29e; }
  .main { display: flex; flex-direction: column; align-items: center; gap: 16px; margin-top: 8px; }
  svg { width: min(100%, 210px); height: auto; display: block; }
  .track { stroke: rgba(255, 255, 255, 0.1); }
  .arc { transition: stroke-dashoffset 0.9s ease, stroke 0.9s ease; }
  .big { font-size: 38px; font-weight: 500; fill: #f5f5f4; }
  .unit { font-size: 15px; fill: #d6d3d1; }
  .cap { font-size: 12px; fill: #a8a29e; }
  .info { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 280px; }
  .badge {
    display: inline-flex; align-items: center; gap: 6px; width: fit-content;
    padding: 5px 12px 5px 8px; border-radius: 999px; font-size: 13px; font-weight: 500;
    --mdc-icon-size: 18px;
  }
  .row { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #e7e5e4; }
  .row .v { margin-left: auto; font-weight: 500; font-variant-numeric: tabular-nums; }
  .sw { width: 10px; height: 10px; border-radius: 2px; flex: none; }
  .bar { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; margin-top: 6px; }
  .bar span { display: block; height: 100%; width: 0; background: #F08C2A; border-radius: 3px; transition: width 0.9s ease; }
  .scale { display: flex; gap: 2px; margin-top: 2px; }
  .scale span { height: 6px; flex: 1; border-radius: 2px; }
  .scalelbl { display: flex; justify-content: space-between; font-size: 11px; color: #898781; }
  .alert {
    display: none; align-items: center; gap: 10px; margin-top: 12px;
    padding: 10px 12px; border-radius: 10px; font-size: 14px; --mdc-icon-size: 22px;
  }
  .alert.show { display: flex; }
  .alert small { display: block; font-size: 12px; color: #a8a29e; }
  .alert.amber { background: #2a2013; border: 1px solid #EF9F27; color: #F2C14E; }
  .alert.red { background: #2d1616; border: 1px solid #E24B4A; color: #F09595; }
  ha-card.pulse-amber { animation: pulseA 2.6s ease-in-out infinite; }
  ha-card.pulse-red { animation: pulseR 1.8s ease-in-out infinite; }
  ha-card.off svg { opacity: 0.6; }
  @keyframes pulseA { 0%, 100% { box-shadow: 0 0 0 0 rgba(242,193,78,0); } 50% { box-shadow: 0 0 22px 2px rgba(242,193,78,0.4); } }
  @keyframes pulseR { 0%, 100% { box-shadow: 0 0 0 0 rgba(226,75,74,0); } 50% { box-shadow: 0 0 22px 2px rgba(226,75,74,0.45); } }
  @container (min-width: 440px) {
    .main { flex-direction: row; justify-content: space-around; }
  }
  @media (prefers-reduced-motion: reduce) {
    ha-card.pulse-amber, ha-card.pulse-red { animation: none; }
    .arc { transition: none; }
  }
`;

class HaseIQRingCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("haseiq-ring-card-editor");
  }

  static getStubConfig(hass) {
    const find = (suffix, fallback) =>
      Object.keys((hass && hass.states) || {}).find((id) => id.includes("hase") && id.endsWith(suffix)) || fallback;
    return {
      name: "Kamin",
      temperature: find("_temperature", "sensor.wohnzimmer_hase_temperature"),
      performance: find("_performance", "sensor.wohnzimmer_hase_performance"),
      phase: find("_phase", "sensor.wohnzimmer_hase_phase"),
      error: find("_error", "binary_sensor.wohnzimmer_hase_error"),
      heating_up: find("_heating_up", "sensor.wohnzimmer_hase_heating_up"),
    };
  }

  setConfig(config) {
    if (!config || !config.temperature || !config.performance || !config.phase) {
      throw new Error("Bitte temperature, performance und phase angeben.");
    }
    this._config = { temp_min: 0, temp_max: 700, name: "Kamin", ...config };
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._build();
    if (this._hass) this._update();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._els) this._update();
  }

  getCardSize() {
    return 7;
  }

  getGridOptions() {
    return { columns: 12, rows: "auto", min_columns: 6 };
  }

  _build() {
    const c = this._config;
    const bg = c.image ? `<div class="bg" style="background-image:url('${String(c.image).replace(/'/g, "%27")}')"></div>` : "";
    this.shadowRoot.innerHTML = `
      <style>${STYLE}</style>
      <ha-card tabindex="0" role="button">
        ${bg}
        <div class="wrap">
          <div class="head">
            <span class="name"></span>
          </div>
          <div class="main">
            <svg viewBox="0 0 240 240" role="img" id="svg">
              <circle class="track" cx="120" cy="120" r="${R_OUT}" fill="none" stroke-width="14"/>
              <circle class="track" cx="120" cy="120" r="${R_IN}" fill="none" stroke-width="14"/>
              <circle class="arc" id="aOut" cx="120" cy="120" r="${R_OUT}" fill="none" stroke-width="14" stroke-linecap="round"
                stroke-dasharray="${C_OUT}" stroke-dashoffset="${C_OUT}" transform="rotate(-90 120 120)"/>
              <circle class="arc" id="aIn" cx="120" cy="120" r="${R_IN}" fill="none" stroke-width="14" stroke-linecap="round"
                stroke-dasharray="${C_IN}" stroke-dashoffset="${C_IN}" transform="rotate(-90 120 120)" stroke="#F2C14E"/>
              <text x="120" y="122" text-anchor="middle"><tspan class="big" id="tVal">–</tspan><tspan class="unit" id="tUnit" dx="3"></tspan></text>
              <text class="cap" x="120" y="144" text-anchor="middle" id="pCap"></text>
            </svg>
            <div class="info">
              <span class="badge" id="badge"><ha-icon id="bIcon"></ha-icon><span id="bTxt"></span></span>
              <div id="hu" style="display:none"><div class="row">Anheizfortschritt<span class="v" id="vH"></span></div><div class="bar"><span id="bH"></span></div></div>
              <div>
                <div class="row"><span class="sw" id="swT"></span>Außenring · Temperatur<span class="v" id="vT">–</span></div>
                <div class="row"><span class="sw" style="background:#F2C14E"></span>Innenring · Leistung<span class="v" id="vP">–</span></div>
              </div>
              <div>
                <div class="scale"><span style="background:#378ADD"></span><span style="background:#EF9F27"></span><span style="background:#E24B4A"></span></div>
                <div class="scalelbl"><span>kalt</span><span>warm</span><span>heiß</span></div>
              </div>
            </div>
          </div>
          <div class="alert" id="alert"><ha-icon id="aIcon"></ha-icon><div><span id="aTxt"></span><small id="aSub"></small></div></div>
        </div>
      </ha-card>`;

    const q = (s) => this.shadowRoot.querySelector(s);
    this._els = {
      card: q("ha-card"), name: q(".name"), svg: q("#svg"),
      aOut: q("#aOut"), aIn: q("#aIn"), tVal: q("#tVal"), tUnit: q("#tUnit"), pCap: q("#pCap"),
      badge: q("#badge"), bIcon: q("#bIcon"), bTxt: q("#bTxt"),
      swT: q("#swT"), vT: q("#vT"), vP: q("#vP"), hu: q("#hu"), vH: q("#vH"), bH: q("#bH"),
      alert: q("#alert"), aIcon: q("#aIcon"), aTxt: q("#aTxt"), aSub: q("#aSub"),
    };
    this._els.name.textContent = c.name;

    const open = () => {
      this.dispatchEvent(new CustomEvent("hass-more-info", {
        detail: { entityId: c.tap_entity || c.temperature }, bubbles: true, composed: true,
      }));
    };
    this._els.card.addEventListener("click", open);
    this._els.card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  }

  _num(entityId) {
    const s = this._hass.states[entityId];
    if (!s || UNAVAILABLE.includes(s.state)) return null;
    const n = parseFloat(s.state);
    return Number.isFinite(n) ? n : null;
  }

  _update() {
    const c = this._config;
    const e = this._els;
    const st = this._hass.states;

    const temp = this._num(c.temperature);
    const perf = this._num(c.performance);
    const tUnit = (st[c.temperature] && st[c.temperature].attributes.unit_of_measurement) || "°C";

    const tFrac = temp === null ? 0 : Math.min(1, Math.max(0, (temp - c.temp_min) / (c.temp_max - c.temp_min)));
    const pFrac = perf === null ? 0 : Math.min(1, Math.max(0, perf / 100));
    const col = tempColor(tFrac);

    e.aOut.style.strokeDashoffset = C_OUT * (1 - tFrac);
    e.aOut.style.stroke = col;
    e.aIn.style.strokeDashoffset = C_IN * (1 - pFrac);
    e.swT.style.background = col;

    const tTxt = temp === null ? "–" : String(Math.round(temp));
    const pTxt = perf === null ? "–" : `${Math.round(perf)} %`;
    e.tVal.textContent = tTxt;
    e.tUnit.textContent = temp === null ? "" : ` ${tUnit}`;
    e.pCap.textContent = perf === null ? "" : `${pTxt} Leistung`;
    e.vT.textContent = temp === null ? "–" : `${tTxt} ${tUnit}`;
    e.vP.textContent = pTxt;

    const ps = st[c.phase];
    const raw = ps && !UNAVAILABLE.includes(ps.state) ? String(ps.state).toLowerCase().replace(/[’‘`´]/g, "'").trim() : null;
    const labels = c.labels || {};
    const known = raw ? PHASES[raw] : null;
    const phase = known || (raw
      ? { label: raw, color: "#78716c", fg: "#f5f5f4", icon: "mdi:fireplace" }
      : { label: "Nicht verfügbar", color: "#44403c", fg: "#d6d3d1", icon: "mdi:help-circle-outline" });
    const label = (raw && labels[raw]) || phase.label;
    e.badge.style.background = phase.color;
    e.badge.style.color = phase.fg;
    e.bIcon.setAttribute("icon", phase.icon);
    const heat = c.heating_up ? this._num(c.heating_up) : null;
    const heatPct = heat === null ? null : Math.min(100, Math.max(0, heat));
    const showHeat = heatPct !== null && (raw === "heating up" || (heatPct > 0 && heatPct < 100));
    e.bTxt.textContent = raw === "heating up" && heatPct !== null ? `${label} · ${Math.round(heatPct)} %` : label;
    e.hu.style.display = showHeat ? "" : "none";
    if (showHeat) {
      e.vH.textContent = `${Math.round(heatPct)} %`;
      e.bH.style.width = `${heatPct}%`;
    }

    const err = c.error && st[c.error] && st[c.error].state === "on";
    const addWood = known && known.alert === "amber";
    e.card.classList.toggle("off", raw === "idle" || !raw);
    e.card.classList.toggle("pulse-red", !!err);
    e.card.classList.toggle("pulse-amber", !err && !!addWood);
    e.alert.classList.remove("amber", "red");
    if (err) {
      e.alert.classList.add("show", "red");
      e.aIcon.setAttribute("icon", "mdi:alert");
      e.aTxt.textContent = "Störung gemeldet";
      e.aSub.textContent = "Ofen prüfen";
    } else if (addWood) {
      e.alert.classList.add("show", "amber");
      e.aIcon.setAttribute("icon", "mdi:fireplace");
      e.aTxt.textContent = "Zeit zum Nachlegen";
      e.aSub.textContent = temp === null ? "" : `Temperatur aktuell ${tTxt} ${tUnit}`;
    } else {
      e.alert.classList.remove("show");
    }

    e.svg.setAttribute("aria-label",
      `${c.name}: ${label}, Temperatur ${temp === null ? "nicht verfügbar" : `${tTxt} ${tUnit}`}, Leistung ${pTxt}`);
  }
}

const EDITOR_SCHEMA = [
  { name: "name", selector: { text: {} } },
  { name: "temperature", required: true, selector: { entity: { domain: "sensor" } } },
  { name: "performance", required: true, selector: { entity: { domain: "sensor" } } },
  { name: "phase", required: true, selector: { entity: { domain: "sensor" } } },
  { name: "error", selector: { entity: { domain: "binary_sensor" } } },
  { name: "heating_up", selector: { entity: { domain: "sensor" } } },
  { name: "image", selector: { text: {} } },
  {
    type: "grid",
    name: "",
    schema: [
      { name: "temp_min", selector: { number: { mode: "box" } } },
      { name: "temp_max", selector: { number: { mode: "box" } } },
    ],
  },
];

const EDITOR_LABELS = {
  name: "Name",
  temperature: "Temperatur-Sensor",
  performance: "Leistungs-Sensor",
  phase: "Phasen-Sensor",
  error: "Fehler-Sensor (optional)",
  heating_up: "Anheiz-Fortschritt 0–100 (optional)",
  image: "Hintergrundfoto, z. B. /local/haseiq/kamin.jpg (optional)",
  temp_min: "Temperatur Minimum (Ringanfang)",
  temp_max: "Temperatur Maximum (Ringende)",
};

class HaseIQRingCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
  }

  _render() {
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => EDITOR_LABELS[s.name] || s.name;
      this._form.addEventListener("value-changed", (ev) => {
        this._config = ev.detail.value;
        this.dispatchEvent(new CustomEvent("config-changed", {
          detail: { config: this._config }, bubbles: true, composed: true,
        }));
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = EDITOR_SCHEMA;
    this._form.data = this._config;
  }
}

if (!customElements.get("haseiq-ring-card")) {
  customElements.define("haseiq-ring-card", HaseIQRingCard);
  customElements.define("haseiq-ring-card-editor", HaseIQRingCardEditor);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "haseiq-ring-card",
  name: "Hase IQ Doppelring",
  description: "Doppelring-Anzeige für Hase IQ Kamine: Temperatur außen, Leistung innen, Phase und Alarme.",
  preview: false,
});

console.info(`%c HASEIQ-RING-CARD %c v${HASEIQ_VERSION} `, "background:#E8590C;color:#fff", "background:#1c1917;color:#f5f5f4");
