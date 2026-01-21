import { CONFIG } from "../config.js";
import { getTheme, setTheme } from "../theme.js";

function isActive(path){
  const p = location.pathname.split("/").pop() || "index.html";
  return p === path;
}

function themeLabel(theme){
  return theme === "day" ? "🌙 Night" : "☀️ Day";
}

class AkaliNav extends HTMLElement{
  connectedCallback(){
    this.render();
    this.bind();
  }

  render(){
    const theme = getTheme();
    this.innerHTML = `
      <div class="nav-wrap">
        <nav class="nav">
          <div class="container">
            <a class="brand" href="index.html" aria-label="${CONFIG.APP_NAME} home">
              <img src="assets/images/akali.png" alt="Akali" />
              <span>${CONFIG.BRAND}</span>
            </a>

            <div class="nav-links" role="navigation" aria-label="Main">
              <a href="index.html" class="${isActive("index.html") ? "active" : ""}">Home</a>
              <a href="market.html" class="${isActive("market.html") ? "active" : ""}">Market</a>
              <a href="games.html" class="${isActive("games.html") ? "active" : ""}">Games</a>
              <a href="memes.html" class="${isActive("memes.html") ? "active" : ""}">Memes</a>
            </div>

            <div style="display:flex; gap:10px; align-items:center;">
              <button class="btn" id="themeBtn" type="button" aria-label="Toggle theme">
                ${themeLabel(theme)}
              </button>
            </div>
          </div>
        </nav>
      </div>
    `;
  }

  bind(){
    const btn = this.querySelector("#themeBtn");
    if (!btn) return;

    const sync = ()=>{
      btn.textContent = themeLabel(getTheme());
    };

    btn.addEventListener("click", ()=>{
      const next = getTheme() === "day" ? "night" : "day";
      setTheme(next);
      sync();
    });

    document.addEventListener("theme-changed", sync);
  }
}

customElements.define("akali-nav", AkaliNav);
