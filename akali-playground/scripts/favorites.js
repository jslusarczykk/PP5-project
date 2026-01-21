import { CONFIG } from "./config.js";
import { readJSON, writeJSON } from "./utils.js";

export function getFavorites(){
  return new Set(readJSON(CONFIG.STORAGE.favorites, []));
}

export function toggleFavorite(id){
  const s = getFavorites();
  if (s.has(id)) s.delete(id); else s.add(id);
  writeJSON(CONFIG.STORAGE.favorites, Array.from(s));
  return s;
}
