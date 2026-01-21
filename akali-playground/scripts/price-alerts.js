import { CONFIG } from "./config.js";
import { readJSON, writeJSON } from "./utils.js";

function normalizeAlert(a){
  return {
    key: String(a.key || ""),
    id: String(a.id || ""),
    symbol: String(a.symbol || ""),
    direction: a.direction === "below" ? "below" : "above",
    target: Number(a.target),
    triggered: Boolean(a.triggered),
    createdAt: Number(a.createdAt || Date.now()),
  };
}

export function getAlerts(){
  const raw = readJSON(CONFIG.STORAGE.alerts, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeAlert)
    .filter(a => a.key && a.id && Number.isFinite(a.target) && a.target > 0);
}

function save(alerts){
  writeJSON(CONFIG.STORAGE.alerts, alerts);
}

export function addAlert({ id, symbol, direction, target }){
  const alerts = getAlerts();
  const key = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  alerts.unshift(normalizeAlert({ key, id, symbol, direction, target, triggered: false, createdAt: Date.now() }));
  save(alerts);
  return key;
}

export function removeAlert(key){
  const alerts = getAlerts().filter(a => a.key !== key);
  save(alerts);
}

export function markAlertTriggered(key){
  const alerts = getAlerts();
  const a = alerts.find(x => x.key === key);
  if (!a) return;
  a.triggered = true;
  save(alerts);
}

export function clearTriggered(){
  const alerts = getAlerts().filter(a => !a.triggered);
  save(alerts);
}
