import { initTheme } from "./theme.js";
import { CONFIG } from "./config.js";
import { fetchMarkets } from "./api/coingecko.js";
import { formatUsd, readJSON, writeJSON, qs, toast } from "./utils.js";

import "./components/navbar.js";
import "./components/footer.js";

initTheme();

const LEVELS = [
  { min: 0,     title: "Warm‑up",     img: "assets/images/levels/level01.jpg" },
  { min: 200,   title: "Focus",       img: "assets/images/levels/level02.jpg" },
  { min: 600,   title: "High ground", img: "assets/images/levels/level03.jpg" },
  { min: 1500,  title: "Cozy spot",   img: "assets/images/levels/level04.jpg" },
  { min: 3200,  title: "Deep sleep",  img: "assets/images/levels/level05.jpg" },
  { min: 6200,  title: "Rich cat",    img: "assets/images/levels/level06.jpg" },
  { min: 11000, title: "Nap mode",    img: "assets/images/levels/level07.jpg" },
  { min: 18000, title: "Big stack",   img: "assets/images/levels/level08.jpg" },
  { min: 28000, title: "Final yawn",  img: "assets/images/levels/level09.jpg" },
  { min: 42000, title: "Boss",        img: "assets/images/levels/level10.jpg" },
];

const clickState = readJSON(CONFIG.STORAGE.clicker, { fish: 0, perClick: 1, upgrades: 0, total: null });

function upgradeCostAt(u){
  return Math.floor(35 * Math.pow(1.45, u));
}
function upgradeCost(){
  return upgradeCostAt(clickState.upgrades);
}

function estimateTotalFromLegacy(){
  const spent = Array.from({ length: clickState.upgrades }, (_, i) => upgradeCostAt(i))
    .reduce((a,b)=>a+b, 0);
  return Math.max(0, Math.floor(clickState.fish + spent));
}

if (clickState.total == null){
  clickState.total = estimateTotalFromLegacy();
}

const fishEl = qs("#fishCount");
const perClickEl = qs("#perClick");
const tapCard = qs("#tapCard");
const upgradeBtn = qs("#upgradeBtn");
const upgradeCostEl = qs("#upgradeCost");

const levelImg = qs("#akaliLevelImg");
const levelEl = qs("#clickerLevel");
const levelTitleEl = qs("#levelTitle");
const levelBar = qs("#levelBar");
const levelProgressText = qs("#levelProgressText");

function saveClicker(){
  writeJSON(CONFIG.STORAGE.clicker, clickState);
}

function getLevelInfo(total){
  let idx = 0;
  for (let i=0; i<LEVELS.length; i++){
    if (total >= LEVELS[i].min) idx = i;
  }
  const cur = LEVELS[idx];
  const next = LEVELS[idx + 1] || null;
  const curMin = cur.min;
  const nextMin = next ? next.min : cur.min;
  const progress = next ? Math.min(1, (total - curMin) / (nextMin - curMin)) : 1;
  return { idx, cur, next, progress };
}

function renderClicker(){
  fishEl.textContent = String(Math.floor(clickState.fish));
  perClickEl.textContent = String(clickState.perClick);
  upgradeCostEl.textContent = String(upgradeCost());
  upgradeBtn.disabled = clickState.fish < upgradeCost();

  const { idx, cur, next, progress } = getLevelInfo(clickState.total);

  if (levelImg) levelImg.src = cur.img;
  if (levelEl) levelEl.textContent = `${idx + 1} / ${LEVELS.length}`;
  if (levelTitleEl) levelTitleEl.textContent = cur.title;

  if (levelBar) levelBar.style.width = `${Math.round(progress * 100)}%`;

  if (levelProgressText){
    if (next){
      levelProgressText.textContent = `${clickState.total} / ${next.min} total fish`;
    } else {
      levelProgressText.textContent = `${clickState.total} total fish • MAX level`;
    }
  }
}

function tap(){
  clickState.fish += clickState.perClick;
  clickState.total += clickState.perClick;
  saveClicker();
  renderClicker();
}

tapCard?.addEventListener("click", tap);

upgradeBtn?.addEventListener("click", ()=>{
  const cost = upgradeCost();
  if (clickState.fish < cost) return;

  clickState.fish -= cost;
  clickState.upgrades += 1;
  clickState.perClick += 1;

  saveClicker();
  renderClicker();
  toast("Upgrade bought");
});

renderClicker();

const bestKey = CONFIG.STORAGE.hl_best;
let best = Number(localStorage.getItem(bestKey) || 0);
let streak = 0;
let list = [];
let a = null;
let b = null;

const aBox = qs("#hlA");
const bBox = qs("#hlB");
const msg = qs("#hlMsg");
const streakEl = qs("#hlStreak");
const bestEl = qs("#hlBest");

function pick(){
  if (list.length < 10) return;
  a = list[Math.floor(Math.random()*list.length)];
  do { b = list[Math.floor(Math.random()*list.length)]; } while (b.id === a.id);
}

function renderHL({ reveal = false } = {}){
  bestEl.textContent = String(best);
  streakEl.textContent = String(streak);

  if (!a || !b){
    aBox.innerHTML = '<div class="muted">Loading…</div>';
    bBox.innerHTML = '';
    return;
  }

  aBox.innerHTML = `
    <div class="coin">
      <img src="${a.image}" alt="${a.name}" />
      <div>
        <div style="font-weight:900">${a.name}</div>
        <div class="muted" style="font-size:12px">${a.symbol.toUpperCase()}</div>
      </div>
    </div>
    <div class="kpi" style="margin-top:10px">${formatUsd(a.current_price)}</div>
  `;

  bBox.innerHTML = `
    <div class="coin">
      <img src="${b.image}" alt="${b.name}" />
      <div>
        <div style="font-weight:900">${b.name}</div>
        <div class="muted" style="font-size:12px">${b.symbol.toUpperCase()}</div>
      </div>
    </div>
    <div class="kpi" style="margin-top:10px">${reveal ? formatUsd(b.current_price) : "?"}</div>
  `;

  msg.textContent = reveal ? msg.textContent : "Is the second price higher or lower?";
}

function endRound(correct){
  renderHL({ reveal: true });
  if (correct){
    msg.textContent = "Nice! +1 streak 😺";
    streak += 1;
    if (streak > best){
      best = streak;
      localStorage.setItem(bestKey, String(best));
    }
  } else {
    msg.textContent = "Oops — streak reset. Try again!";
    streak = 0;
  }

  setTimeout(()=>{
    pick();
    renderHL();
  }, 900);
}

function guess(dir){
  if (!a || !b) return;
  const correct = dir === "higher" ? b.current_price >= a.current_price : b.current_price <= a.current_price;
  endRound(correct);
}

qs("#btnHigher")?.addEventListener("click", ()=> guess("higher"));
qs("#btnLower")?.addEventListener("click", ()=> guess("lower"));

async function loadHL(){
  try{
    list = await fetchMarkets({ page: 1, perPage: 80 });
    list = list.filter(c=> typeof c.current_price === "number" && c.current_price > 0);
    pick();
    renderHL();
  }catch{
    msg.textContent = "Couldn\'t load live prices. Games still work — try again later.";
  }
}

loadHL();
