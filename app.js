const ENDPOINT = "https://download.data.grandlyon.com/ws/tcl_sirilight_traffic.siri_lite_situation/all.json";

const container = document.querySelector("#alertsContainer");
const statusElement = document.querySelector("#networkStatus");
const lastUpdateElement = document.querySelector("#lastUpdate");
const refreshButton = document.querySelector("#refreshButton");
const queryInput = document.querySelector("#query");
const clearButton = document.querySelector("#clearButton");

let alerts = [];

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value == null ? "" : String(value);
  return div.innerHTML;
}

function findTexts(value) {
  if (value == null) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(findTexts);
  if (typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => {
      if (/text|value|title|summary|description/i.test(key)) return findTexts(item);
      return [];
    });
  }
  return [];
}

function collectText(item) {
  const keys = ["description", "summary", "title", "message", "text"];
  const direct = keys.flatMap(key => findTexts(item[key])).filter(Boolean);
  const nested = findTexts(item);
  return [...new Set([...direct, ...nested])].join(" — ") || "Perturbation sur le réseau TCL";
}

function collectLines(item) {
  const serialized = JSON.stringify(item);
  const matches = serialized.match(/(?:Métro\s*[A-F]|Tramway\s*T?\d+|T\d+|(?:Bus|C|N)\s*\d+[A-Z]?|Ligne\s*[A-Z]?\d+)/gi) || [];
  return [...new Set(matches.map(value => value.trim()))].slice(0, 12);
}

function normalize(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload?.values && Array.isArray(payload.values)) return payload.values;
  if (payload?.features && Array.isArray(payload.features)) return payload.features.map(feature => feature.properties || feature);

  for (const key of ["Siri", "ServiceDelivery", "SituationExchangeDelivery", "Situations", "PtSituationElement", "SituationExchanges", "data"]) {
    const found = payload?.[key];
    if (found) {
      const nested = normalize(found);
      if (nested.length) return nested;
    }
  }
  return [];
}

function parseAlert(item, index) {
  const lines = collectLines(item);
  return {
    id: item.id || item.Id || index,
    text: collectText(item),
    lines,
    raw: item
  };
}

function getDotClass(count) {
  if (count === 0) return "";
  if (count <= 2) return "warning";
  return "bad";
}

function updateStatus(count) {
  const dot = statusElement.querySelector(".dot");
  dot.className = `dot ${getDotClass(count)}`;
  statusElement.innerHTML = `<span class="dot ${getDotClass(count)}"></span>${count ? `${count} perturbation${count > 1 ? "s" : ""}` : "Trafic normal"}`;
}

function render() {
  const query = queryInput.value.trim().toLowerCase();
  const filtered = alerts.filter(alert => {
    if (!query) return true;
    const haystack = `${alert.text} ${alert.lines.join(" ")}`.toLowerCase();
    return haystack.includes(query);
  });

  updateStatus(filtered.length);

  if (!filtered.length) {
    container.innerHTML = `<article class="empty"><h2>${query ? "Aucune perturbation trouvée" : "Aucune perturbation annoncée"}</h2><p>${query ? "Essayez une autre ligne ou effacez la recherche." : "Le trafic semble circuler normalement."}</p></article>`;
    return;
  }

  container.innerHTML = filtered.map(alert => `
    <article class="alert">
      <div class="alert-head">
        <div>
          <h2>Perturbation réseau</h2>
          <p>${escapeHTML(alert.text)}</p>
          ${alert.lines.length ? `<div class="lines">${alert.lines.map(line => `<span class="line-badge">${escapeHTML(line)}</span>`).join("")}</div>` : ""}
        </div>
      </div>
    </article>
  `).join("");
}

async function refresh() {
  refreshButton.disabled = true;
  refreshButton.innerHTML = '<span aria-hidden="true">↻</span> Actualisation';

  try {
    const response = await fetch(`${ENDPOINT}?_=${Date.now()}`, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new Error(`Erreur ${response.status}`);
    const payload = await response.json();
    const normalized = normalize(payload);
    alerts = normalized.map(parseAlert).filter(alert => alert.text);
    lastUpdateElement.textContent = `Mise à jour à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  } catch (error) {
    alerts = [];
    lastUpdateElement.textContent = "Impossible d’actualiser";
    container.innerHTML = `<article class="empty error"><h2>Le trafic est momentanément indisponible</h2><p>Vérifiez votre connexion puis réessayez.</p></article>`;
  } finally {
    refreshButton.disabled = false;
    refreshButton.innerHTML = '<span aria-hidden="true">↻</span> Actualiser';
    if (alerts.length) render();
  }
}

refreshButton.addEventListener("click", refresh);
queryInput.addEventListener("input", render);
clearButton.addEventListener("click", () => { queryInput.value = ""; queryInput.focus(); render(); });

refresh();
setInterval(refresh, 60_000);
