import { CONFIG } from "../config.js";
import { fetchFeaturedPrices } from "../api/coingecko.js";
import { formatUsd, formatPct, classForChange } from "../utils.js";

class PriceTicker extends HTMLElement{
  connectedCallback(){
    this.innerHTML = `<div class="muted">Loading prices…</div>`;
    this.load();
  }

  async load(){
    try{
      const data = await fetchFeaturedPrices();
      this.render(data);
    }catch(e){
      this.innerHTML = `<div class="muted">Couldn’t load live prices (try again later).</div>`;
    }
  }

  render(data){
    const cards = CONFIG.FEATURED_COINS.map(c=>{
      const row = data?.[c.id];
      const price = row?.[CONFIG.VS_CURRENCY];
      const ch = row?.[`${CONFIG.VS_CURRENCY}_24h_change`];
      return `
        <div class="card panel">
          <div class="row">
            <div>
              <div style="font-weight:900">${c.symbol}</div>
              <div class="muted" style="font-size:12px">${c.name}</div>
            </div>
            <span class="badge ${classForChange(ch)}">${formatPct(ch)}</span>
          </div>
          <div class="kpi" style="margin-top:10px">${formatUsd(price)}</div>
        </div>
      `;
    }).join("");

    this.innerHTML = `<div class="grid cols-3">${cards}</div>`;
  }
}

customElements.define("price-ticker", PriceTicker);
