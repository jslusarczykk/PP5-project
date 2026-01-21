import { CONFIG } from "../config.js";
import { fetchJson } from "../utils.js";

function qs(params){
  const u = new URLSearchParams(params);
  return u.toString();
}

export async function fetchFeaturedPrices(){
  const ids = CONFIG.FEATURED_COINS.map(c=>c.id).join(",");
  const url = `${CONFIG.COINGECKO_BASE}/simple/price?${qs({ ids, vs_currencies: CONFIG.VS_CURRENCY, include_24hr_change: "true" })}`;
  return await fetchJson(url);
}

export async function fetchMarkets({ page = 1, perPage = CONFIG.MARKET_PER_PAGE } = {}){
  const url = `${CONFIG.COINGECKO_BASE}/coins/markets?${qs({
    vs_currency: CONFIG.VS_CURRENCY,
    order: "market_cap_desc",
    per_page: String(perPage),
    page: String(page),
    sparkline: "false",
    price_change_percentage: "24h",
  })}`;
  return await fetchJson(url);
}

export async function fetchGlobal(){
  const url = `${CONFIG.COINGECKO_BASE}/global`;
  return await fetchJson(url);
}
