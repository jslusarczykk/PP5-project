import { CONFIG } from "./config.js";
import { readJSON, writeJSON } from "./utils.js";

const DEFAULT = {
  cash: 1000,
  holdings: [], // { id, symbol, amount }
};

export function getPortfolio(){
  return readJSON(CONFIG.STORAGE.portfolio, DEFAULT);
}

export function savePortfolio(p){
  writeJSON(CONFIG.STORAGE.portfolio, p);
}

export function setCash(cash){
  const p = getPortfolio();
  p.cash = Math.max(0, Number(cash) || 0);
  savePortfolio(p);
}

export function addHolding({ id, symbol, amount }){
  const p = getPortfolio();
  const a = Number(amount);
  if (!id || !symbol || !Number.isFinite(a) || a <= 0) return;

  const existing = p.holdings.find(h => h.id === id);
  if (existing){
    existing.amount = Number(existing.amount) + a;
  } else {
    p.holdings.push({ id, symbol, amount: a });
  }
  savePortfolio(p);
}

export function removeHolding(id){
  const p = getPortfolio();
  p.holdings = p.holdings.filter(h => h.id !== id);
  savePortfolio(p);
}

export function computePortfolioValue(p, priceById){
  const holdingsValue = p.holdings.reduce((sum, h)=>{
    const price = priceById[h.id];
    if (!Number.isFinite(price)) return sum;
    return sum + price * Number(h.amount || 0);
  }, 0);

  const total = holdingsValue + Number(p.cash || 0);
  return { holdingsValue, total };
}
