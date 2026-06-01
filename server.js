/**
 * YT2Top — YouTube to Top4Top Uploader
 * Jalankan: node server.js
 * Buka:     http://localhost:3000
 *
 * Install dulu:
 *   npm install express axios axios-cookiejar-support cheerio tough-cookie form-data cors
 *   sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && sudo chmod +x /usr/local/bin/yt-dlp
 */

import express from "express";
import axios from "axios";
import FormData from "form-data";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const execAsync = promisify(exec);
const app = express();
app.use(express.json());

// ─── HTML Frontend (inline) ──────────────────────────────────────────────────
const HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>YT2Top — YouTube to Top4Top</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --bg:#f5f3ef;--surface:#ffffff;--surface2:#f0ede8;--border:#e4dfd8;
      --accent:#ff5c35;--text:#1a1714;--text2:#6b6560;--text3:#a09890;
      --success:#2ec27e;--error:#e5341a;
      --shadow:0 2px 8px rgba(0,0,0,.06),0 8px 32px rgba(0,0,0,.08);
      --shadow-lg:0 4px 16px rgba(0,0,0,.08),0 16px 48px rgba(0,0,0,.12);
      --radius:18px;--radius-sm:10px;
    }
    html{scroll-behavior:smooth}
    body{
      font-family:'Plus Jakarta Sans',sans-serif;background:var(--bg);color:var(--text);
      min-height:100vh;display:flex;flex-direction:column;align-items:center;
      padding:24px 16px 64px;position:relative;overflow-x:hidden;
    }
    body::before,body::after{
      content:'';position:fixed;border-radius:50%;filter:blur(80px);
      pointer-events:none;z-index:0;
    }
    body::before{width:500px;height:500px;background:radial-gradient(circle,rgba(255,92,53,.15) 0%,transparent 70%);top:-100px;right:-150px}
    body::after{width:400px;height:400px;background:radial-gradient(circle,rgba(255,140,107,.12) 0%,transparent 70%);bottom:-80px;left:-100px}
    .wrapper{width:100%;max-width:560px;position:relative;z-index:1}
    header{text-align:center;padding:48px 0 36px}
    .logo-chip{
      display:inline-flex;align-items:center;gap:8px;background:var(--accent);color:#fff;
      font-family:'Space Mono',monospace;font-weight:700;font-size:12px;letter-spacing:.06em;
      padding:6px 14px;border-radius:100px;margin-bottom:20px;
      box-shadow:0 4px 14px rgba(255,92,53,.35);
    }
    h1{font-size:clamp(28px,6vw,40px);font-weight:800;line-height:1.15;letter-spacing:-.02em;margin-bottom:12px}
    h1 span{color:var(--accent)}
    .subtitle{font-size:15px;color:var(--text2);line-height:1.6;max-width:420px;margin:0 auto}
    .card{
      background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);
      box-shadow:var(--shadow);padding:28px 28px 24px;transition:box-shadow .25s;
    }
    .card:hover{box-shadow:var(--shadow-lg)}
    .input-label{font-size:12.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--text3);margin-bottom:10px;display:block}
    .input-row{display:flex;gap:8px;align-items:stretch}
    .input-wrap{position:relative;flex:1}
    .yt-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text3);pointer-events:none;transition:color .2s}
    #ytUrl{
      width:100%;background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--radius-sm);
      padding:14px 16px 14px 44px;font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;
      color:var(--text);outline:none;transition:border-color .2s,box-shadow .2s,background .2s;
    }
    #ytUrl::placeholder{color:var(--text3)}
    #ytUrl:focus{border-color:var(--accent);box-shadow:0 0 0 4px rgba(255,92,53,.12);background:#fff}
    .input-wrap:focus-within .yt-icon{color:var(--accent)}
    .paste-btn{
      flex-shrink:0;background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--radius-sm);
      padding:0 16px;cursor:pointer;color:var(--text2);font-family:'Plus Jakarta Sans',sans-serif;
      font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;
      transition:all .2s;white-space:nowrap;
    }
    .paste-btn:hover{background:var(--border);color:var(--text);transform:translateY(-1px)}
    .divider{height:1px;background:var(--border);margin:20px 0}
    #generateBtn{
      width:100%;background:linear-gradient(135deg,#ff5c35 0%,#e8401e 100%);color:#fff;border:none;
      border-radius:var(--radius-sm);padding:16px 24px;font-family:'Plus Jakarta Sans',sans-serif;
      font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;
      justify-content:center;gap:10px;transition:all .2s;
      box-shadow:0 4px 16px rgba(255,92,53,.3),0 1px 0 rgba(255,255,255,.15) inset;
      position:relative;overflow:hidden;
    }
    #generateBtn::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.12) 0%,transparent 60%);pointer-events:none}
    #generateBtn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 24px rgba(255,92,53,.4)}
    #generateBtn:active:not(:disabled){transform:translateY(0)}
    #generateBtn:disabled{opacity:.7;cursor:not-allowed;transform:none}
    .spinner{width:18px;height:18px;border:2.5px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
    @keyframes spin{to{transform:rotate(360deg)}}
    .steps-wrap{margin-top:20px;display:none}
    .step-row{display:flex;align-items:center;gap:12px;padding:9px 0;opacity:.3;transition:opacity .3s,transform .3s}
    .step-row.active{opacity:1;transform:translateX(4px)}
    .step-row.done{opacity:.55}
    .step-dot{
      width:28px;height:28px;border-radius:50%;background:var(--surface2);border:2px solid var(--border);
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
      font-size:11px;font-weight:700;color:var(--text3);transition:all .3s;
    }
    .step-row.active .step-dot{background:rgba(255,92,53,.1);border-color:var(--accent);color:var(--accent)}
    .step-row.done .step-dot{background:var(--success);border-color:var(--success);color:#fff}
    .step-check{display:none}
    .step-row.done .step-check{display:block}
    .step-row.done .step-num{display:none}
    .step-text{font-size:13.5px;font-weight:500;color:var(--text2)}
    .step-row.active .step-text{color:var(--text);font-weight:600}
    .step-spin{margin-left:auto;width:14px;height:14px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .7s linear infinite;display:none}
    .step-row.active .step-spin{display:block}
    .info-strip{display:flex;gap:8px;margin-top:16px}
    .info-tag{flex:1;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:12px 14px;text-align:center}
    .info-tag-icon{font-size:18px;margin-bottom:4px}
    .info-tag-label{font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.04em}
    .info-tag-val{font-size:13px;font-weight:600;color:var(--text);margin-top:2px}
    #resultCard{
      display:none;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);
      box-shadow:var(--shadow);padding:24px;margin-top:16px;
      animation:slideUp .4s cubic-bezier(.16,1,.3,1);
    }
    @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    .result-label{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--success);display:flex;align-items:center;gap:6px;margin-bottom:14px}
    .result-title{font-size:14px;color:var(--text2);margin-bottom:4px;font-weight:500}
    .result-title strong{color:var(--text)}
    .link-box{background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:12px 16px;display:flex;align-items:center;gap:10px;margin-top:12px}
    .link-text{flex:1;font-family:'Space Mono',monospace;font-size:12px;color:var(--text);word-break:break-all;line-height:1.5}
    .copy-btn{
      flex-shrink:0;background:var(--accent);color:#fff;border:none;border-radius:8px;padding:8px 14px;
      font-family:'Plus Jakarta Sans',sans-serif;font-size:12.5px;font-weight:700;cursor:pointer;
      display:flex;align-items:center;gap:6px;transition:all .2s;
      box-shadow:0 2px 8px rgba(255,92,53,.25);
    }
    .copy-btn:hover{background:#e8401e;transform:translateY(-1px)}
    .open-btn{
      display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:10px;
      background:transparent;border:1.5px solid var(--border);border-radius:var(--radius-sm);
      padding:11px 16px;font-family:'Plus Jakarta Sans',sans-serif;font-size:13.5px;font-weight:600;
      color:var(--text2);cursor:pointer;text-decoration:none;transition:all .2s;
    }
    .open-btn:hover{border-color:var(--accent);color:var(--accent);background:rgba(255,92,53,.05)}
    #errorCard{
      display:none;background:#fff5f4;border:1.5px solid #ffc9c2;border-radius:var(--radius);
      padding:18px 20px;margin-top:16px;align-items:flex-start;gap:12px;
      animation:slideUp .3s ease;
    }
    .error-icon{color:var(--error);flex-shrink:0;margin-top:1px}
    .error-msg{font-size:13.5px;color:#c0271a;line-height:1.55;font-weight:500}
    footer{margin-top:40px;text-align:center;font-size:12.5px;color:var(--text3)}
    .toast{
      position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);
      background:var(--text);color:#fff;padding:10px 20px;border-radius:100px;
      font-size:13.5px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.2);
      transition:transform .35s cubic-bezier(.16,1,.3,1);z-index:999;white-space:nowrap;
    }
    .toast.show{transform:translateX(-50%) translateY(0)}
  </style>
</head>
<body>
<div class="wrapper">
  <header>
    <div class="logo-chip">⚡ YT2TOP</div>
    <h1>YouTube ke <span>Top4Top</span><br/>dalam sekali klik</h1>
    <p class="subtitle">Paste link YouTube, klik Generate — audio dikonversi lalu upload otomatis ke Top4Top, kamu dapat langsung link-nya.</p>
  </header>

  <div class="card">
    <label class="input-label" for="ytUrl">🔗 Link Video YouTube</label>
    <div class="input-row">
      <div class="input-wrap">
        <svg class="yt-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.8 5 12 5 12 5s-4.8 0-7 .1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.2.8C6.8 19 12 19 12 19s4.8 0 7-.1c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM10 15V9l5.5 3-5.5 3z"/>
        </svg>
        <input type="text" id="ytUrl" placeholder="https://youtube.com/watch?v=..." autocomplete="off" spellcheck="false"/>
      </div>
      <button class="paste-btn" id="pasteBtn">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><rect x="4" y="6" width="16" height="16" rx="2"/><path d="M9 12h6M9 16h4"/></svg>
        Paste
      </button>
    </div>
    <div class="divider"></div>
    <button id="generateBtn">
      <svg id="btnIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-2 14.5v-9l6 4.5z"/>
      </svg>
      <span id="btnText">Generate &amp; Upload</span>
    </button>
    <div class="steps-wrap" id="stepsWrap">
      <div class="step-row" id="step1">
        <div class="step-dot"><span class="step-num">1</span><svg class="step-check" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
        <span class="step-text">Mengambil info video YouTube</span>
        <div class="step-spin"></div>
      </div>
      <div class="step-row" id="step2">
        <div class="step-dot"><span class="step-num">2</span><svg class="step-check" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
        <span class="step-text">Download &amp; konversi ke MP3</span>
        <div class="step-spin"></div>
      </div>
      <div class="step-row" id="step3">
        <div class="step-dot"><span class="step-num">3</span><svg class="step-check" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
        <span class="step-text">Upload ke Top4Top</span>
        <div class="step-spin"></div>
      </div>
    </div>
  </div>

  <div class="info-strip">
    <div class="info-tag"><div class="info-tag-icon">🎵</div><div class="info-tag-label">Format</div><div class="info-tag-val">MP3</div></div>
    <div class="info-tag"><div class="info-tag-icon">☁️</div><div class="info-tag-label">Host</div><div class="info-tag-val">Top4Top</div></div>
    <div class="info-tag"><div class="info-tag-icon">⚡</div><div class="info-tag-label">Proses</div><div class="info-tag-val">Otomatis</div></div>
  </div>

  <div id="resultCard">
    <div class="result-label">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
      Upload Berhasil!
    </div>
    <p class="result-title">Judul: <strong id="resultTitle">—</strong></p>
    <div class="link-box">
      <span class="link-text" id="resultUrl">—</span>
      <button class="copy-btn" id="copyBtn">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Salin
      </button>
    </div>
    <a class="open-btn" id="openBtn" href="#" target="_blank" rel="noopener">
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      Buka Link di Top4Top
    </a>
  </div>

  <div id="errorCard">
    <div class="error-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></div>
    <p class="error-msg" id="errorMsg">Terjadi kesalahan.</p>
  </div>

  <footer><p>Powered by yt-dlp &amp; top4top.io</p></footer>
</div>
<div class="toast" id="toast"></div>
<script>
  const $=id=>document.getElementById(id);
  const urlInput=$('ytUrl'),pasteBtn=$('pasteBtn'),generateBtn=$('generateBtn');
  const btnText=$('btnText'),btnIcon=$('btnIcon'),stepsWrap=$('stepsWrap');
  const resultCard=$('resultCard'),errorCard=$('errorCard');
  const resultUrl=$('resultUrl'),resultTitle=$('resultTitle');
  const copyBtn=$('copyBtn'),openBtn=$('openBtn'),errorMsg=$('errorMsg'),toast=$('toast');

  function showToast(msg){toast.textContent=msg;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2300)}
  
  pasteBtn.addEventListener('click',async()=>{
    try{const t=await navigator.clipboard.readText();urlInput.value=t.trim();urlInput.focus();showToast('✅ Link di-paste!');}
    catch{urlInput.focus();showToast('⚠️ Izinkan akses clipboard')}
  });

  function setStep(n,state){const el=$('step'+n);el.classList.remove('active','done');if(state)el.classList.add(state)}
  function resetSteps(){[1,2,3].forEach(n=>setStep(n,''))}
  function hideCards(){resultCard.style.display='none';errorCard.style.display='none'}

  function setLoading(on){
    generateBtn.disabled=on;
    btnText.textContent=on?'Memproses…':'Generate & Upload';
    btnIcon.style.display=on?'none':'block';
    const ex=generateBtn.querySelector('.spinner');
    if(on&&!ex){const sp=document.createElement('div');sp.className='spinner';generateBtn.prepend(sp)}
    else if(!on&&ex)ex.remove();
  }

  generateBtn.addEventListener('click',async()=>{
    const url=urlInput.value.trim();
    if(!url){urlInput.focus();showToast('⚠️ Masukkan link YouTube dulu!');return}
    if(!/youtu(\.be|be\.com)/i.test(url)){showToast('⚠️ Bukan link YouTube yang valid');return}
    hideCards();resetSteps();setLoading(true);
    stepsWrap.style.display='block';setStep(1,'active');
    const t1=setTimeout(()=>{setStep(1,'done');setStep(2,'active')},4000);
    const t2=setTimeout(()=>{setStep(2,'done');setStep(3,'active')},14000);
    try{
      const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})});
      clearTimeout(t1);clearTimeout(t2);
      const data=await res.json();
      if(data.success){
        setStep(1,'done');setStep(2,'done');setStep(3,'done');
        resultTitle.textContent=data.title||'—';
        resultUrl.textContent=data.url;
        openBtn.href=data.url;
        resultCard.style.display='block';
        resultCard.scrollIntoView({behavior:'smooth',block:'nearest'});
        showToast('🎉 Upload berhasil!');
      }else{
        setStep(1,'done');
        errorMsg.textContent=data.error||'Terjadi kesalahan. Coba lagi.';
        errorCard.style.display='flex';
      }
    }catch{
      clearTimeout(t1);clearTimeout(t2);
      errorMsg.textContent='Tidak bisa terhubung ke server. Pastikan server.js berjalan.';
      errorCard.style.display='flex';
    }finally{setLoading(false)}
  });

  urlInput.addEventListener('keydown',e=>{if(e.key==='Enter')generateBtn.click()});

  urlInput.addEventListener('focus',async()=>{
    if(urlInput.value)return;
    try{const t=await navigator.clipboard.readText();if(/youtu(\.be|be\.com)/i.test(t)){urlInput.value=t.trim();showToast('📋 Link YouTube terdeteksi!')}}catch{}
  });

  copyBtn.addEventListener('click',()=>{
    navigator.clipboard.writeText(resultUrl.textContent).then(()=>{
      const orig=copyBtn.innerHTML;
      copyBtn.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Disalin!';
      showToast('✅ Link berhasil disalin!');
      setTimeout(()=>{copyBtn.innerHTML=orig},2000);
    });
  });
</script>
</body>
</html>`;

// ─── top4top Upload Logic ────────────────────────────────────────────────────
const TOP4TOP = "https://top4top.io";
const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

function makeClient() {
  const jar = new CookieJar();
  return {
    jar,
    client: wrapper(axios.create({
      baseURL: TOP4TOP, jar, withCredentials: true, timeout: 180000,
      validateStatus: () => true,
      headers: { "user-agent": UA, "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7" }
    }))
  };
}

function getCookieSid(jar) {
  return jar.getCookiesSync(TOP4TOP).find(c => c.key === "sid")?.value || "";
}

function parseResultUrl(html) {
  const $ = cheerio.load(html);

  // ── Prioritas 1: Link CDN langsung (e.top4top.io / f.top4top.io / subdomain lain)
  // Format: http://e.top4top.io/m_XXXXX.mp3
  const cdnFromInput = $('input[value]').toArray()
    .map(el => $(el).attr("value")?.trim())
    .find(v => v && /^https?:\/\/[a-z]\.top4top\.io\//i.test(v));
  if (cdnFromInput) return cdnFromInput;

  const cdnFromAnchor = $('a[href]').toArray()
    .map(el => $(el).attr("href")?.trim())
    .find(h => h && /^https?:\/\/[a-z]\.top4top\.io\//i.test(h));
  if (cdnFromAnchor) return cdnFromAnchor;

  // ── Prioritas 2: Input/anchor dengan ekstensi audio
  const audioExt = /\.(mp3|m4a|ogg|webm|aac|flac|wav)(\?.*)?$/i;
  const audioFromInput = $('input[value]').toArray()
    .map(el => $(el).attr("value")?.trim())
    .find(v => v && audioExt.test(v));
  if (audioFromInput) return audioFromInput;

  const audioFromAnchor = $('a[href]').toArray()
    .map(el => $(el).attr("href")?.trim())
    .find(h => h && audioExt.test(h));
  if (audioFromAnchor) return audioFromAnchor;

  // ── Prioritas 3: Field berlabel "direct" / "رابط مباشر"
  let labeledDirect = null;
  $(".inputbody").each((_, el) => {
    const title = $(el).find(".btitle").text().trim().toLowerCase();
    const value = $(el).find("input").attr("value")?.trim();
    if (value && (title.includes("مباشر") || title.includes("direct") || title.includes("download")))
      labeledDirect = value;
  });
  if (labeledDirect) return labeledDirect;

  // ── Prioritas 4: Halaman share /p_ atau /a_ (akan di-resolve oleh resolveDirectUrl)
  return $('input[value*="top4top.io/p_"]').attr("value")?.trim()
    || $('input[value*="top4top.io/a_"]').attr("value")?.trim()
    || $('a[href*="top4top.io/p_"]').attr("href")?.trim()
    || $('a[href*="top4top.io/a_"]').attr("href")?.trim()
    || null;
}

/**
 * Jika URL yang didapat masih halaman share (.html), fetch halaman itu
 * dan cari link direct download audio di dalamnya.
 */
async function resolveDirectUrl(shareUrl, client) {
  // Sudah link CDN / audio — tidak perlu resolve
  if (/^https?:\/\/[a-z]\.top4top\.io\//i.test(shareUrl)) return shareUrl;
  if (/\.(mp3|m4a|ogg|webm|aac|flac|wav)(\?.*)?$/i.test(shareUrl)) return shareUrl;

  // Fetch halaman share
  try {
    const res = await client.get(shareUrl, {
      headers: { accept: "text/html,*/*", referer: TOP4TOP + "/" }
    });
    const $ = cheerio.load(res.data || "");

    // Cari link audio di halaman share
    const cdnLink =
      $('a[href]').toArray().map(el => $(el).attr("href")?.trim())
        .find(h => h && /^https?:\/\/[a-z]\.top4top\.io\//i.test(h))
      || $('source[src]').toArray().map(el => $(el).attr("src")?.trim())
        .find(s => s && /top4top\.io/i.test(s))
      || $('[data-url]').toArray().map(el => $(el).attr("data-url")?.trim())
        .find(u => u && /top4top\.io/i.test(u));

    if (cdnLink) return cdnLink;

    // Cari di semua input / anchor dengan ekstensi audio
    const audioExt = /\.(mp3|m4a|ogg|webm|aac|flac|wav)(\?.*)?$/i;
    const audioLink =
      $('a[href]').toArray().map(el => $(el).attr("href")?.trim()).find(h => h && audioExt.test(h))
      || $('input[value]').toArray().map(el => $(el).attr("value")?.trim()).find(v => v && audioExt.test(v));

    if (audioLink) return audioLink;
  } catch (e) {
    console.warn("⚠️ resolveDirectUrl gagal:", e.message);
  }

  // Kembalikan URL asli kalau tidak ketemu
  return shareUrl;
}

async function getSid(client, jar) {
  const res = await client.get("/", { headers: { accept: "text/html,*/*", referer: `${TOP4TOP}/` } });
  const $ = cheerio.load(res.data || "");
  return $('input[name="sid"]').attr("value") || getCookieSid(jar);
}

async function uploadToTop4top(filePath, mimeType = "audio/mpeg") {
  const { jar, client } = makeClient();
  const sid = await getSid(client, jar);
  const form = new FormData();
  if (sid) form.append("sid", sid);
  form.append("file_0_", fs.createReadStream(filePath), { filename: path.basename(filePath), contentType: mimeType });
  for (let i = 1; i <= 9; i++) form.append(`file_${i}_`, "");
  form.append("submitr", "[ رفع الملفات ]");
  for (let i = 0; i <= 9; i++) form.append(`file_${i}_`, "");
  const res = await client.post("/index.php", form, {
    maxBodyLength: Infinity, maxContentLength: Infinity,
    headers: {
      ...form.getHeaders(),
      accept: "text/html,*/*", origin: TOP4TOP, referer: `${TOP4TOP}/`,
      "upgrade-insecure-requests": "1",
      "sec-ch-ua": '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
      "sec-ch-ua-mobile": "?1", "sec-ch-ua-platform": '"Android"',
      "sec-fetch-site": "same-origin", "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1", "sec-fetch-dest": "document"
    }
  });

  // Debug: log semua input values dan anchor hrefs dari halaman hasil upload
  const $dbg = cheerio.load(res.data || "");
  const allInputs = $dbg('input[value]').toArray().map(el => $dbg(el).attr("value")?.trim()).filter(Boolean);
  const allAnchors = $dbg('a[href]').toArray().map(el => $dbg(el).attr("href")?.trim()).filter(v => v && v.includes("top4top"));
  console.log("📄 Input values di halaman hasil:", allInputs.slice(0, 10));
  console.log("🔗 Anchor hrefs top4top:", allAnchors.slice(0, 10));

  const rawUrl = parseResultUrl(res.data || "");
  if (!rawUrl) return null;

  console.log(`🔍 URL mentah dari parse: ${rawUrl}`);
  const directUrl = await resolveDirectUrl(rawUrl, client);
  console.log(`✅ URL direct final: ${directUrl}`);
  return directUrl;
}

// ─── YouTube Audio Download ───────────────────────────────────────────────────
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
  ];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  return null;
}

async function installYtdlp() {
  const binPath = "/tmp/yt-dlp";
  // Kalau sudah ada skip
  if (fs.existsSync(binPath)) {
    try { await execAsync(`${binPath} --version`); return binPath; } catch {}
  }
  console.log("⬇️  Menginstall yt-dlp...");
  await execAsync(
    `curl -sL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ${binPath} && chmod +x ${binPath}`,
    { timeout: 60000 }
  );
  console.log("✅ yt-dlp berhasil diinstall");
  return binPath;
}

async function getYtdlpBin() {
  // 1. cek PATH dulu
  try { const { stdout } = await execAsync("which yt-dlp"); if (stdout.trim()) return "yt-dlp"; } catch {}
  try { const { stdout } = await execAsync("which youtube-dl"); if (stdout.trim()) return "youtube-dl"; } catch {}
  // 2. cek /tmp
  if (fs.existsSync("/tmp/yt-dlp")) return "/tmp/yt-dlp";
  // 3. auto install ke /tmp
  return await installYtdlp();
}

async function getYoutubeInfo(url, bin) {
  const { stdout } = await execAsync(`${bin} --dump-json --no-playlist --no-check-certificate "${url}" 2>/dev/null`, { timeout: 30000 });
  return JSON.parse(stdout.trim());
}

async function downloadYoutubeAudio(url, bin) {
  const tmpDir = os.tmpdir();
  const videoId = extractVideoId(url);
  const tpl = path.join(tmpDir, `yt_${videoId}_%(title)s.%(ext)s`);
  const cmd = `${bin} -x --audio-format mp3 --audio-quality 5 --no-check-certificate --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -o "${tpl}" "${url}" 2>&1`;
  await execAsync(cmd, { timeout: 180000 });
  const files = fs.readdirSync(tmpDir).filter(f => f.startsWith(`yt_${videoId}`) && f.endsWith(".mp3"));
  if (files.length === 0) {
    const any = fs.readdirSync(tmpDir).filter(f => f.startsWith(`yt_${videoId}`));
    if (any.length === 0) throw new Error("File audio tidak ditemukan setelah download.");
    return { filePath: path.join(tmpDir, any[0]), ext: path.extname(any[0]).slice(1) };
  }
  return { filePath: path.join(tmpDir, files[0]), ext: "mp3" };
}

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get("/", (_, res) => res.send(HTML));

app.post("/api/generate", async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.json({ success: false, error: "URL tidak boleh kosong" });

  const videoId = extractVideoId(url);
  if (!videoId) return res.json({ success: false, error: "URL YouTube tidak valid" });

  let tmpFile = null;
  try {
    const bin = await getYtdlpBin();
    console.log(`\n[1/3] Info video: ${url}`);
    let title = "Audio";
    try { const info = await getYoutubeInfo(url, bin); title = info.title || "Audio"; } catch {}

    console.log(`[2/3] Download audio...`);
    const { filePath, ext } = await downloadYoutubeAudio(url, bin);
    tmpFile = filePath;
    const mimeMap = { mp3: "audio/mpeg", m4a: "audio/mp4", webm: "audio/webm", ogg: "audio/ogg" };

    console.log(`[3/3] Upload ke top4top...`);
    const resultUrl = await uploadToTop4top(filePath, mimeMap[ext] || "audio/mpeg");

    if (!resultUrl) return res.json({ success: false, error: "Upload berhasil tapi link tidak ditemukan. Coba lagi." });

    console.log(`✅ Done: ${resultUrl}`);
    res.json({ success: true, url: resultUrl, title });
  } catch (err) {
    console.error("❌ FULL ERROR:", err.message);
    console.error("❌ STDERR:", err.stderr);
    console.error("❌ STDOUT:", err.stdout);
    res.json({ success: false, error: err.stderr || err.stdout || err.message });
  } finally {
    if (tmpFile) try { fs.unlinkSync(tmpFile); } catch {}
  }
});

app.get("/api/health", (_, res) => res.json({ ok: true }));

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`\n🚀 YT2Top berjalan di http://localhost:${PORT}`);
  console.log(`   Buka di browser: http://localhost:${PORT}\n`);
  try { await installYtdlp(); } catch (e) { console.warn("⚠️ Auto-install yt-dlp gagal:", e.message); }
});

