import { initTheme } from "./theme.js";
import { qs, toast } from "./utils.js";

import "./components/navbar.js";
import "./components/footer.js";

initTheme();

const mount = qs("#memesMount");

function template(){
  return `
    <section class="card panel">
      <div class="section-title">
        <h2>Create a meme</h2>
        <span class="muted">Top + bottom text</span>
      </div>

      <div class="grid" style="grid-template-columns: 1fr 1.2fr; gap:14px">
        <div class="grid" style="gap:10px">
          <div>
            <label class="muted" for="memeTop">Top text</label>
            <input id="memeTop" class="input" placeholder="" autocomplete="off" />
          </div>

          <div>
            <label class="muted" for="memeBottom">Bottom text</label>
            <input id="memeBottom" class="input" placeholder="" autocomplete="off" />
          </div>

          <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center">
            <button class="btn btn-primary" id="memeRender" type="button">Render</button>
            <a class="btn" id="memeDownload" download="akali-meme.png" href="#">Download</a>
            <button class="btn" id="memeClear" type="button">Clear</button>
          </div>

          <p class="muted" style="margin:0">
            Tip: short phrases work best. Text is auto-scaled to fit.
          </p>
        </div>

        <div>
          <canvas id="memeCanvas" class="card" style="width:100%; height:auto; border-radius:16px; border:1px solid var(--line)"></canvas>
        </div>
      </div>
    </section>
  `;
}

function wrapLines(ctx, text, maxWidth){
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words){
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxWidth && line){
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawCaption(ctx, text, y, canvasWidth){
  const pad = 26;
  const maxW = canvasWidth - pad * 2;
  let size = Math.floor(canvasWidth / 12);
  size = Math.max(26, Math.min(64, size));

  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  for (let i = 0; i < 10; i++){
    ctx.font = `900 ${size}px ${getComputedStyle(document.body).fontFamily}`;
    const lines = wrapLines(ctx, text, maxW);
    if (lines.length <= 3) break;
    size = Math.max(18, size - 4);
  }

  ctx.font = `900 ${size}px ${getComputedStyle(document.body).fontFamily}`;
  const lines = wrapLines(ctx, text, maxW);
  const lineH = size * 1.08;

  ctx.lineWidth = Math.max(6, Math.floor(size / 8));
  ctx.strokeStyle = "rgba(0,0,0,0.86)";
  ctx.fillStyle = "rgba(255,255,255,0.96)";

  let yy = y;
  for (const line of lines){
    ctx.strokeText(line, canvasWidth / 2, yy);
    ctx.fillText(line, canvasWidth / 2, yy);
    yy += lineH;
  }
  return lines.length * lineH;
}

function init(){
  if (!mount) return;
  mount.innerHTML = template();

  const topInput = qs("#memeTop");
  const bottomInput = qs("#memeBottom");
  const renderBtn = qs("#memeRender");
  const clearBtn = qs("#memeClear");
  const dl = qs("#memeDownload");
  const canvas = qs("#memeCanvas");
  const ctx = canvas.getContext("2d");

  const img = new Image();
  img.src = "assets/images/akali.png";

  function fitCanvas(){
    const maxW = 1100;
    const scale = Math.min(1, maxW / img.width);
    canvas.width = Math.floor(img.width * scale);
    canvas.height = Math.floor(img.height * scale);
  }

  function render(){
    if (!img.complete) return;
    fitCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const top = (topInput.value || "").trim().toUpperCase();
    const bottom = (bottomInput.value || "").trim().toUpperCase();

    if (top){
      drawCaption(ctx, top, 16, canvas.width);
    }

    if (bottom){
      ctx.save();
      ctx.globalAlpha = 0;
      const h = drawCaption(ctx, bottom, 0, canvas.width);
      ctx.restore();
      drawCaption(ctx, bottom, Math.max(16, canvas.height - h - 16), canvas.width);
    }

    const url = canvas.toDataURL("image/png");
    dl.href = url;
  }

  img.onload = render;

  renderBtn.addEventListener("click", render);
  topInput.addEventListener("input", ()=>{
    render();
  });
  bottomInput.addEventListener("input", render);

  clearBtn.addEventListener("click", ()=>{
    topInput.value = "";
    bottomInput.value = "";
    render();
    toast("Cleared");
  });
}

init();
