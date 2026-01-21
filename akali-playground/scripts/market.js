import { initTheme } from "./theme.js";
import { CONFIG } from "./config.js";
import { fetchMarkets } from "./api/coingecko.js";
import { formatUsd, formatPct, classForChange, qs, readJSON, writeJSON, toast } from "./utils.js";
import { getFavorites, toggleFavorite } from "./favorites.js";
import { getAlerts, addAlert, removeAlert, markAlertTriggered, clearTriggered } from "./price-alerts.js";

import "./components/navbar.js";
import "./components/footer.js";

initTheme();

let markets = [];
let priceById = {};

const tableBody = qs("#marketBody");
const search = qs("#search");
const sortSel = qs("#sort");
const toggleTop = qs("#toggleTop");
const topCoinsInfo = qs("#topCoinsInfo");

const toolsMount = qs("#toolsMount");
const alertsMount = qs("#alertsMount");

let expanded = false;

const toolsState = readJSON(CONFIG.STORAGE.market_tools, {
  fromId: "bitcoin",
  toId: "ethereum",
  amount: 1,
});

/*********************
 * Table + Favorites
 *********************/
function currentFavorites(){
  return getFavorites();
}

function rowHtml(coin){
  const fav = currentFavorites().has(coin.id);
  const ch = coin.price_change_percentage_24h;
  return `
    <tr data-id="${coin.id}">
      <td>
        <div class="coin">
          <button class="star ${fav ? "on" : ""}" data-fav="${coin.id}" type="button" aria-label="favorite">★</button>
          <img src="${coin.image}" alt="${coin.name}" />
          <div>
            <div style="font-weight:900">${coin.name}</div>
            <div class="muted" style="font-size:12px">${coin.symbol.toUpperCase()}</div>
          </div>
        </div>
      </td>
      <td>${formatUsd(coin.current_price)}</td>
      <td><span class="${classForChange(ch)}">${formatPct(ch)}</span></td>
      <td class="muted">#${coin.market_cap_rank}</td>
    </tr>
  `;
}

function sortAndFilter(){
  const q = (search?.value || "").trim().toLowerCase();
  let list = markets;
  if (q){
    list = list.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
  }

  const mode = sortSel?.value || "cap";
  list = [...list].sort((a,b)=>{
    if (mode === "price") return b.current_price - a.current_price;
    if (mode === "change") return (b.price_change_percentage_24h||0) - (a.price_change_percentage_24h||0);
    return (a.market_cap_rank||9999) - (b.market_cap_rank||9999);
  });

  const favs = currentFavorites();
  list.sort((a,b)=> (favs.has(b.id) - favs.has(a.id)) );

  return list;
}

function renderTable(){
  if (!tableBody) return;
  const list = sortAndFilter();
  const shown = expanded ? list : list.slice(0, 10);
  tableBody.innerHTML = shown.map(rowHtml).join("");

  if (topCoinsInfo){
    const q = (search?.value || "").trim();
    const prefix = q ? "Results" : "Top coins";
    topCoinsInfo.textContent = expanded
      ? `${prefix}: ${list.length}`
      : `${prefix}: showing 10 of ${list.length}`;
  }

  if (toggleTop){
    toggleTop.textContent = expanded ? "Show only top 10" : "Show more";
    toggleTop.style.display = list.length > 10 ? "inline-flex" : "none";
  }
}

/*********************
 * Market Tools module
 *********************/
function pulseStats(){
  const list = markets.slice(0, 50);
  const changes = list.map(c=>c.price_change_percentage_24h).filter(Number.isFinite);
  if (!changes.length) return null;

  const pos = changes.filter(x=>x >= 0).length;
  const neg = changes.length - pos;
  const avg = changes.reduce((a,b)=>a+b, 0) / changes.length;

  const topGainer = [...list].sort((a,b)=>(b.price_change_percentage_24h||0)-(a.price_change_percentage_24h||0))[0];
  const topLoser = [...list].sort((a,b)=>(a.price_change_percentage_24h||0)-(b.price_change_percentage_24h||0))[0];

  return { pos, neg, avg, topGainer, topLoser };
}

function optionsHtml(selectedId){
  return markets.map(c=>`<option value="${c.id}" ${c.id===selectedId ? "selected":""}>${c.name} (${c.symbol.toUpperCase()})</option>`).join("");
}

function toolsTemplate(){
  const from = markets.find(c=>c.id === toolsState.fromId) || markets[0];
  const to = markets.find(c=>c.id === toolsState.toId) || markets[1] || markets[0];

  const fromP = from ? from.current_price : NaN;
  const toP = to ? to.current_price : NaN;

  const amount = Number(toolsState.amount || 0);
  const usdValue = Number.isFinite(fromP) ? amount * fromP : NaN;
  const toValue = (Number.isFinite(fromP) && Number.isFinite(toP) && toP > 0) ? (amount * fromP / toP) : NaN;

  const pulse = pulseStats();

  const pulseBlock = pulse ? `
    <div class="grid" style="gap:10px">
      <div class="row">
        <span class="badge">Up: <b>${pulse.pos}</b></span>
        <span class="badge">Down: <b>${pulse.neg}</b></span>
        <span class="badge ${classForChange(pulse.avg)}">Avg 24h: <b>${formatPct(pulse.avg)}</b></span>
      </div>

      <div class="row" style="gap:10px">
        <div style="min-width:0">
          <div class="muted" style="font-size:12px">Top gainer</div>
          <div style="font-weight:900; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${pulse.topGainer?.name || "—"}</div>
        </div>
        <span class="badge ${classForChange(pulse.topGainer?.price_change_percentage_24h)}">${formatPct(pulse.topGainer?.price_change_percentage_24h)}</span>
      </div>

      <div class="row" style="gap:10px">
        <div style="min-width:0">
          <div class="muted" style="font-size:12px">Top loser</div>
          <div style="font-weight:900; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${pulse.topLoser?.name || "—"}</div>
        </div>
        <span class="badge ${classForChange(pulse.topLoser?.price_change_percentage_24h)}">${formatPct(pulse.topLoser?.price_change_percentage_24h)}</span>
      </div>
    </div>
  ` : `<div class="muted">Loading…</div>`;

  return `
    <div class="section-title">
      <h2>Tools</h2>
      <span class="muted">Converter + market pulse</span>
    </div>

    <div class="grid" style="gap:10px">
      <div class="card panel" style="padding:12px; background:rgba(255,255,255,.04); border:1px solid var(--line)">
        <div class="muted" style="margin-bottom:6px">Converter</div>

        <form id="convForm" class="grid" style="grid-template-columns: 1fr 1fr; gap:10px">
          <div>
            <label class="muted" for="convFrom">From</label>
            <select id="convFrom">${optionsHtml(from?.id)}</select>
          </div>
          <div>
            <label class="muted" for="convTo">To</label>
            <select id="convTo">${optionsHtml(to?.id)}</select>
          </div>

          <div style="grid-column:1 / -1">
            <label class="muted" for="convAmount">Amount</label>
            <input id="convAmount" class="input" inputmode="decimal" value="${String(amount)}" />
          </div>

          <div style="grid-column:1 / -1; display:flex; gap:10px; flex-wrap:wrap; align-items:center">
            <button class="btn" id="convSwap" type="button">Swap</button>
            <span class="badge">≈ <b>${Number.isFinite(usdValue) ? formatUsd(usdValue) : "—"}</b></span>
            <span class="badge">≈ <b>${Number.isFinite(toValue) ? toValue.toFixed(toValue >= 1 ? 4 : 8) : "—"}</b> ${to?.symbol?.toUpperCase() || ""}</span>
          </div>
        </form>

        <div class="muted" style="font-size:12px; margin-top:10px">
          Tip: click a row in the table to set the <b>From</b> coin.
        </div>
      </div>

      <div class="card panel" style="padding:12px; background:rgba(255,255,255,.04); border:1px solid var(--line)">
        <div class="muted" style="margin-bottom:6px">Market pulse</div>
        ${pulseBlock}
      </div>
    </div>
  `;
}

function saveTools(){
  writeJSON(CONFIG.STORAGE.market_tools, toolsState);
}

function renderTools(){
  if (!toolsMount) return;
  toolsMount.innerHTML = toolsTemplate();
}

/*********************
 * Alerts module
 *********************/
function alertsTemplate(){
  const alerts = getAlerts();

  const rows = alerts.length
    ? alerts.map(a=>{
        const coin = markets.find(c=>c.id === a.id);
        const name = coin?.name || a.id;
        const symbol = (coin?.symbol || a.symbol || "").toUpperCase();
        const current = priceById[a.id];
        const hit = a.triggered;
        const dirLabel = a.direction === "above" ? "Above" : "Below";
        const status = hit
          ? `<span class="badge good">Triggered</span>`
          : `<span class="badge">Watching</span>`;

        return `
          <div class="row" style="padding:10px; border:1px solid var(--line); border-radius:14px; background:rgba(255,255,255,.04)">
            <div style="min-width:0">
              <div style="font-weight:900; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${name} <span class="muted">(${symbol})</span></div>
              <div class="muted" style="font-size:12px">
                ${dirLabel} ${formatUsd(a.target)} • Now: ${Number.isFinite(current) ? formatUsd(current) : "—"}
              </div>
            </div>
            <div style="display:flex; gap:10px; align-items:center">
              ${status}
              <button class="btn" data-alert-remove="${a.key}" type="button">Remove</button>
            </div>
          </div>
        `;
      }).join("")
    : `<div class="muted">Add an alert to track a target price.</div>`;

  const options = markets.map(c=>`<option value="${c.id}" data-symbol="${c.symbol}">${c.name} (${c.symbol.toUpperCase()})</option>`).join("");

  return `
    <div class="section-title">
      <h2>Price alerts</h2>
      <span class="muted">Saved locally</span>
    </div>

    <form id="alertForm" class="grid" style="grid-template-columns: 1fr 140px 1fr auto; gap:10px; align-items:end">
      <div>
        <label class="muted" for="alertCoin">Coin</label>
        <select id="alertCoin">${options}</select>
      </div>
      <div>
        <label class="muted" for="alertDir">Condition</label>
        <select id="alertDir">
          <option value="above">Above</option>
          <option value="below">Below</option>
        </select>
      </div>
      <div>
        <label class="muted" for="alertTarget">Target (USD)</label>
        <input id="alertTarget" class="input" inputmode="decimal" placeholder="e.g. 50000" />
      </div>
      <button class="btn btn-primary" type="submit">Add</button>
    </form>

    <div class="grid" style="gap:10px; margin-top:10px" id="alertList">${rows}</div>

    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px">
      <span class="muted" style="font-size:12px">Alerts trigger while this page is open.</span>
      <button class="btn" id="clearTriggered" type="button">Clear triggered</button>
    </div>
  `;
}

function renderAlerts(){
  if (!alertsMount) return;
  alertsMount.innerHTML = alertsTemplate();
}

function evaluateAlerts(){
  const alerts = getAlerts();
  if (!alerts.length) return;

  for (const a of alerts){
    if (a.triggered) continue;
    const current = priceById[a.id];
    if (!Number.isFinite(current)) continue;
    const hit = a.direction === "above" ? current >= a.target : current <= a.target;
    if (hit){
      markAlertTriggered(a.key);
      toast(`Alert: ${a.symbol?.toUpperCase() || a.id} ${a.direction} ${formatUsd(a.target)}`);
    }
  }
}

/*********************
 * Event wiring
 *********************/
search?.addEventListener("input", renderTable);
sortSel?.addEventListener("change", renderTable);

toggleTop?.addEventListener("click", ()=>{
  expanded = !expanded;
  renderTable();
});

qs("#marketTable")?.addEventListener("click", (e)=>{
  const btn = e.target.closest("[data-fav]");
  if (btn){
    toggleFavorite(btn.getAttribute("data-fav"));
    renderTable();
    toast("Saved to favorites ★");
    return;
  }

  const tr = e.target.closest("tr[data-id]");
  if (!tr) return;
  const id = tr.getAttribute("data-id");
  toolsState.fromId = id;
  saveTools();
  renderTools();
});

document.addEventListener("input", (e)=>{
  const amt = e.target.closest("#convAmount");
  if (amt){
    toolsState.amount = String(amt.value).replace(",", ".");
    saveTools();
    renderTools();
  }
});

document.addEventListener("change", (e)=>{
  const fromSel = e.target.closest("#convFrom");
  const toSel = e.target.closest("#convTo");
  if (fromSel){
    toolsState.fromId = fromSel.value;
    saveTools();
    renderTools();
  }
  if (toSel){
    toolsState.toId = toSel.value;
    saveTools();
    renderTools();
  }
});

document.addEventListener("click", (e)=>{
  const swap = e.target.closest("#convSwap");
  if (swap){
    const t = toolsState.fromId;
    toolsState.fromId = toolsState.toId;
    toolsState.toId = t;
    saveTools();
    renderTools();
    toast("Swapped");
    return;
  }

  const removeBtn = e.target.closest("[data-alert-remove]");
  if (removeBtn){
    removeAlert(removeBtn.getAttribute("data-alert-remove"));
    renderAlerts();
    toast("Alert removed");
    return;
  }

  const clearBtn = e.target.closest("#clearTriggered");
  if (clearBtn){
    clearTriggered();
    renderAlerts();
    toast("Cleared");
    return;
  }
});

document.addEventListener("submit", (e)=>{
  const form = e.target.closest("#alertForm");
  if (!form) return;
  e.preventDefault();

  const coinSel = qs("#alertCoin");
  const dirSel = qs("#alertDir");
  const targetInput = qs("#alertTarget");
  const id = coinSel?.value;
  const opt = coinSel?.selectedOptions?.[0];
  const symbol = opt?.dataset?.symbol || "";
  const direction = dirSel?.value || "above";
  const target = Number(String(targetInput?.value || "").replace(",","."));

  if (!id || !Number.isFinite(target) || target <= 0){
    toast("Enter a valid target price");
    return;
  }

  addAlert({ id, symbol, direction, target });
  if (targetInput) targetInput.value = "";
  renderAlerts();
  toast("Alert added");
});

/*********************
 * Load + refresh
 *********************/
async function load(){
  tableBody.innerHTML = '<tr><td colspan="4" class="muted">Loading…</td></tr>';
  try{
    markets = await fetchMarkets({ page: 1 });
    priceById = Object.fromEntries(markets.map(c=>[c.id, c.current_price]));
    renderTable();
    renderTools();
    renderAlerts();
    evaluateAlerts();
  }catch{
    tableBody.innerHTML = '<tr><td colspan="4" class="muted">Couldn\'t load market data. Try again later.</td></tr>';
  }
}

setInterval(async ()=>{
  try{
    const updated = await fetchMarkets({ page: 1 });
    markets = updated;
    priceById = Object.fromEntries(markets.map(c=>[c.id, c.current_price]));
    renderTable();
    renderTools();
    renderAlerts();
    evaluateAlerts();
  }catch{}
}, 60000);

load();
