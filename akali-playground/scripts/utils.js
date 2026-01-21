export function qs(sel, root = document) {
  return root.querySelector(sel);
}

export function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

export function clamp(n, a, b){
  return Math.min(b, Math.max(a, n));
}

export function formatUsd(n){
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: n >= 100 ? 0 : (n >= 1 ? 2 : 6) }).format(Number(n));
}

export function formatPct(n){
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  const v = Number(n);
  const s = v >= 0 ? "+" : "";
  return s + v.toFixed(Math.abs(v) >= 10 ? 1 : 2) + "%";
}

export function classForChange(n){
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "";
  return Number(n) >= 0 ? "pos" : "neg";
}

export function readJSON(key, fallback){
  try{
    const v = localStorage.getItem(key);
    if (!v) return fallback;
    return JSON.parse(v);
  }catch{
    return fallback;
  }
}

export function writeJSON(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

export function toast(msg){
  const el = qs("#toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(()=> el.classList.remove("show"), 1600);
}

export async function copyToClipboard(text){
  try{
    await navigator.clipboard.writeText(text);
    return true;
  }catch{
    return false;
  }
}

export async function fetchJson(url, { timeoutMs = 8000 } = {}){
  const ctrl = new AbortController();
  const t = setTimeout(()=> ctrl.abort(), timeoutMs);
  try{
    const res = await fetch(url, { signal: ctrl.signal, headers: { "accept": "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }finally{
    clearTimeout(t);
  }
}
