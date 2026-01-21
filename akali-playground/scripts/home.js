import { initTheme } from "./theme.js";
import { fetchFeaturedPrices } from "./api/coingecko.js";
import { formatUsd, formatPct, classForChange } from "./utils.js";
import { CONFIG } from "./config.js";
import { getFavorites } from "./favorites.js";

import "./components/navbar.js";
import "./components/footer.js";
import "./components/price-ticker.js";

initTheme();

function renderHomeStats(){
  const box = document.getElementById("homeStats");
  if (!box) return;

  const favs = getFavorites();
  const clicker = JSON.parse(localStorage.getItem(CONFIG.STORAGE.clicker) || "{}") || {};
  const fish = Math.floor(Number(clicker.fish || 0));
  const best = Number(localStorage.getItem(CONFIG.STORAGE.hl_best) || 0);

  box.innerHTML = `
    <div class="section-title">
      <h2>Your dashboard</h2>
      <span class="muted">Saved on this device</span>
    </div>

    <div class="grid" style="gap:10px">
      <div class="row">
        <div class="muted">Favorites</div>
        <span class="badge">${favs.size} ★</span>
      </div>
      <div class="row">
        <div class="muted">Akali clicker</div>
        <span class="badge">${fish}</span>
      </div>
      <div class="row">
        <div class="muted">Higher/Lower best</div>
        <span class="badge">${best}</span>
      </div>
    </div>

    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px">
      <a class="btn btn-primary" href="market.html">Open market</a>
      <a class="btn" href="games.html">Open games</a>
    </div>
  `;
}

async function loadMood(){
  const moodEl = document.getElementById("marketMood");
  const btcEl = document.getElementById("btcMini");
  const ethEl = document.getElementById("ethMini");

  try{
    const data = await fetchFeaturedPrices();
    const btc = data?.bitcoin;
    const eth = data?.ethereum;

    const btcPrice = btc?.usd;
    const btcCh = btc?.usd_24h_change;
    const ethPrice = eth?.usd;
    const ethCh = eth?.usd_24h_change;

    btcEl.innerHTML = `${formatUsd(btcPrice)} <span class="badge ${classForChange(btcCh)}">${formatPct(btcCh)}</span>`;
    ethEl.innerHTML = `${formatUsd(ethPrice)} <span class="badge ${classForChange(ethCh)}">${formatPct(ethCh)}</span>`;

    const avg = (Number(btcCh)||0 + Number(ethCh)||0) / 2;
    if (avg > 1.2) moodEl.textContent = "Positive session — BTC/ETH up on the day.";
    else if (avg < -1.2) moodEl.textContent = "Negative session — BTC/ETH down on the day.";
    else moodEl.textContent = "Mixed session — limited movement across BTC/ETH.";
  }catch{
    btcEl.textContent = "Live price unavailable";
    ethEl.textContent = "Live price unavailable";
    moodEl.textContent = "Market data unavailable.";
  }
}

loadMood();
renderHomeStats();
