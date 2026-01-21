import { CONFIG } from "./config.js";

export function getTheme(){
  return localStorage.getItem(CONFIG.STORAGE.theme) || "night";
}

export function setTheme(theme){
  const t = theme === "day" ? "day" : "night";
  localStorage.setItem(CONFIG.STORAGE.theme, t);
  document.documentElement.dataset.theme = t;
  document.dispatchEvent(new CustomEvent("theme-changed", { detail: { theme: t } }));
}

export function initTheme(){
  setTheme(getTheme());
}
