# Akali

A compact market dashboard with interactive modules, built with vanilla HTML/CSS/JS (ES Modules) and powered by live market data.

## Pages
- **Home**: live snapshot + local dashboard stats
- **Market**: top coins (Top 10 default, expandable) + search/sort + favorites + local portfolio entries
- **Games**: clicker + higher/lower (uses live prices)
- **Memes**: Akali meme generator (top + bottom text + download)

## Live API used
- CoinGecko (prices/markets)

## Run locally
Because the site uses ES Modules, open it via a local server:

### Option A: VS Code
Install **Live Server** → right-click `index.html` → “Open with Live Server”.

### Option B: Python
```bash
python -m http.server 8000
```
Then open:
- `http://localhost:8000/index.html`

## Customize
Edit `scripts/config.js` for:
- featured coins shown in the ticker
