import { CONFIG } from "../config.js";

class AkaliFooter extends HTMLElement{
  connectedCallback(){
    const year = new Date().getFullYear();
    this.innerHTML = `
      <footer class="footer">
        <div class="container">
          <div>
            <div style="font-weight:900">${CONFIG.BRAND}</div>
            <div class="muted" style="margin-top:6px">Market dashboard and interactive modules.</div>
          </div>

          <div class="muted" style="width:100%; margin-top:10px">
            © ${year} ${CONFIG.BRAND}. Market data provided by CoinGecko.
          </div>
        </div>
      </footer>
    `;
  }
}

customElements.define("akali-footer", AkaliFooter);
