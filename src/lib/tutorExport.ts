import type { TutorStep } from './tutorScript'

export interface TutorExportOptions {
  title: string
  lang: 'es' | 'en'
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Genera un archivo HTML autocontenido con la animación del tutor:
 * tecleo paso a paso + burbuja de narración + voz (speechSynthesis del
 * navegador). Sin dependencias externas: funciona 100% offline al abrirlo
 * en cualquier navegador. Pesa KB y se puede compartir por cualquier medio.
 */
export function buildTutorHtml(steps: TutorStep[], opts: TutorExportOptions): string {
  const stepsJson = JSON.stringify(steps).replace(/</g, '\\u003c')
  const title = escHtml(opts.title)
  const emptyMsg = opts.lang === 'es' ? 'Sin pasos de tutor.' : 'No tutor steps.'
  const labels =
    opts.lang === 'es'
      ? { play: 'Reproducir', pause: 'Pausar', prev: 'Anterior', next: 'Siguiente', voice: 'Voz' }
      : { play: 'Play', pause: 'Pause', prev: 'Previous', next: 'Next', voice: 'Voice' }

  return `<!DOCTYPE html>
<html lang="${opts.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
body{font-family:system-ui,sans-serif;background:#1E1E2E;color:#CDD6F4;margin:0;padding:16px}
.card{max-width:720px;margin:0 auto;border:1px solid #45475A;border-radius:12px;overflow:hidden}
.head{display:flex;justify-content:space-between;align-items:center;padding:8px 16px;background:#181825;font-size:14px}
.code{background:#11111B;padding:16px;min-height:180px}
.code pre{margin:0;font-family:ui-monospace,monospace;font-size:14px;white-space:pre-wrap}
.cursor{display:inline-block;width:8px;animation:blink 1s steps(1) infinite;color:#89B4FA}
@keyframes blink{50%{opacity:0}}
.bubble{display:flex;gap:8px;margin:12px 16px 0;padding:12px;border:1px solid #45475A;border-radius:8px;background:#181825;font-size:14px}
.controls{display:flex;gap:8px;padding:12px 16px;background:#181825;border-top:1px solid #45475A}
button{background:#45475A;color:#CDD6F4;border:0;border-radius:6px;padding:6px 12px;font-size:13px;cursor:pointer}
button:disabled{opacity:.4;cursor:default}
button.primary{background:#89B4FA;color:#11111B;font-weight:600}
</style>
</head>
<body>
<div class="card">
<div class="head"><span>${title}</span><span id="counter"></span></div>
<div class="code"><pre><code id="code"></code><span class="cursor" id="cursor">|</span></pre></div>
<div class="bubble" id="bubble" style="display:none"><span>&#128172;</span><span id="narr"></span></div>
<div class="controls">
<button id="bPrev">${labels.prev}</button>
<button id="bPlay" class="primary">${labels.play}</button>
<button id="bNext">${labels.next}</button>
<button id="bVoice">${labels.voice}: ON</button>
</div>
</div>
<script>
var STEPS=${stepsJson};
var LANG=${JSON.stringify(opts.lang)};
var EMPTY=${JSON.stringify(emptyMsg)};
var idx=0,playing=true,voiceOn=true,timer=null;
var codeEl=document.getElementById('code'),narrEl=document.getElementById('narr'),
bubble=document.getElementById('bubble'),counter=document.getElementById('counter'),
cursor=document.getElementById('cursor'),bPlay=document.getElementById('bPlay'),
bPrev=document.getElementById('bPrev'),bNext=document.getElementById('bNext'),
bVoice=document.getElementById('bVoice');
var PLAY=${JSON.stringify(labels.play)},PAUSE=${JSON.stringify(labels.pause)};
function clearT(){if(timer){clearTimeout(timer);timer=null}}
function speak(t){try{if(!voiceOn||!t||!('speechSynthesis' in window))return;window.speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(t);u.lang=(LANG==='es'?'es-ES':'en-US');window.speechSynthesis.speak(u)}catch(e){}}
function stopSpeak(){try{if('speechSynthesis' in window)window.speechSynthesis.cancel()}catch(e){}}
function typeStep(s,pos){clearT();codeEl.textContent=s.code.slice(0,pos);cursor.style.visibility='visible';
if(pos<s.code.length){timer=setTimeout(function(){typeStep(s,pos+1)},30)}else{showNarr(s)}}
function showNarr(s){cursor.style.visibility='hidden';bubble.style.display='flex';narrEl.textContent=s.narration||'';speak(s.narration);
var w=(s.narration||'').trim()?s.narration.trim().split(/\\s+/).length:0;
timer=setTimeout(next,1500+w*350)}
function start(i){clearT();stopSpeak();if(!STEPS.length){codeEl.textContent=EMPTY;counter.textContent='';return}
idx=Math.max(0,Math.min(STEPS.length-1,i));var s=STEPS[idx];counter.textContent=(idx+1)+' / '+STEPS.length;
bubble.style.display='none';bPrev.disabled=idx===0;bNext.disabled=idx>=STEPS.length-1;playing=true;bPlay.textContent=PAUSE;typeStep(s,0)}
function next(){if(idx+1<STEPS.length)start(idx+1);else{clearT();playing=false;bPlay.textContent=PLAY}}
bPlay.onclick=function(){if(playing){clearT();stopSpeak();playing=false;bPlay.textContent=PLAY}else{start(idx)}};
bPrev.onclick=function(){start(idx-1)};bNext.onclick=function(){start(idx+1)};
bVoice.onclick=function(){voiceOn=!voiceOn;if(!voiceOn)stopSpeak();bVoice.textContent=(LANG==='es'?'Voz':'Voice')+': '+(voiceOn?'ON':'OFF')};
start(0);
</script>
</body>
</html>`
}
