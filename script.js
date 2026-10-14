const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const pad = n => String(n).padStart(2, '0');
const fmt = s => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;
const clamp01 = n => Math.min(Math.max(n, 0), 1);
// the site is English only now (the Arabic switch was removed at the owner's request); data-ar texts are leftovers
let lang = 'en';

/* ---------- language ---------- */
function setLang(l) {
  lang = l;
  document.documentElement.lang = l;
  document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  $$('[data-en]').forEach(el => el.textContent = el.dataset[l]);
  if (active >= 0) $('#wheelTitle').textContent = AI_VIDEOS[active].title[l];
  splitWords();
  fitHero();
  measurePanels();
}

/* ---------- night / day mode ---------- */
const isDay = () => document.documentElement.dataset.theme === 'light';
// in day mode every panel is light
const lightPanel = p => isDay() || p.classList.contains('light');
$('#theme').onclick = () => {
  const day = !isDay();
  day ? document.documentElement.dataset.theme = 'light' : delete document.documentElement.dataset.theme;
  try { localStorage.setItem('theme', day ? 'light' : 'dark'); } catch (e) {}
  fx();
};

/* ---------- hero: name always spans the full width ---------- */
function fitHero() {
  // measure only once the display font for the current language has loaded, otherwise the fallback font skews the size
  if (document.fonts && !fitHero.waiting) {
    const spec = lang === 'ar' ? '900 100px Alexandria' : '900 100px Archivo';
    if (!document.fonts.check(spec)) { fitHero.waiting = true; document.fonts.load(spec).then(() => { fitHero.waiting = false; fitHero(); measurePanels(); }); }
  }
  const el = $('#heroName');
  el.style.fontSize = '100px';
  // leave room on the sides for the floating WhatsApp button on desktop
  const wide = Math.min(innerWidth * .94, innerWidth > 760 ? innerWidth - 230 : innerWidth, 1500);
  // the Arabic name is two short words with tall letters: at full width it would swallow the photo, so it stays narrower
  const target = lang === 'ar' ? wide * (innerWidth > 760 ? .6 : .82) : wide;
  el.style.fontSize = (100 * target / el.scrollWidth) + 'px';
  // the row above the name (intro + buttons) lines up with the name's two edges (in Arabic: with the full-width grid)
  el.closest('.hero').style.setProperty('--nameW', wide + 'px');
}

/* ---------- word-by-word reveal ---------- */
function splitWords() {
  $$('.words').forEach(p => { p.innerHTML = p.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' '); });
}

/* ---------- media helpers: poster first, tiny preview loop on demand, full video only in the viewer ---------- */
const MEDIA = 'assets/media/';
const vidPaths = (cat, v) => ({ full: `${MEDIA}${cat}/full/${v.id}.mp4`, preview: `${MEDIA}${cat}/preview/${v.id}.mp4`, poster: `${MEDIA}${cat}/poster/${v.id}.jpg` });
const clipVideo = p => `<video data-poster="${p.poster}" data-src="${p.preview}" muted loop playsinline preload="none"></video>`;
const T = o => o ? `data-en="${o.en}" data-ar="${o.ar}"` : '';
function playClip(vid) {
  if (vid.dataset.src) { vid.src = vid.dataset.src; vid.removeAttribute('data-src'); }
  vid.play().catch(() => {});
}
function wireClip(el, v) {
  el.addEventListener('mouseenter', () => { el.classList.add('live'); playClip(v); });
  el.addEventListener('mouseleave', () => { el.classList.remove('live'); if (!el.classList.contains('on')) v.pause(); });
}
// a panel gets .away while it is fully covered by the next one or not reached yet (see fx); loops and clips rest meanwhile
const shown = el => { const p = el.closest('.panel'); return !p || !p.classList.contains('away'); };
const onShown = (el, fn) => { const p = el.closest('.panel'); if (p) p.addEventListener('vis', fn); };
const soon = (n, cls) => Array.from({ length: n }, () => `<div class="${cls} soon"><span data-en="Coming soon" data-ar="قريبًا"></span></div>`).join('');

/* ---------- viewer (lightbox): images and videos, with next / previous ---------- */
const modal = $('#modal'), box = $('#modalBox');
let viewList = null, viewIdx = -1;
function openViewer(list, i) {
  viewList = list; viewIdx = (i + list.length) % list.length;
  const it = list[viewIdx];
  const media = it.type === 'video'
    ? `<video src="${it.src}" poster="${it.poster || ''}" controls autoplay playsinline></video>`
    : `<img src="${it.src}" alt="">`;
  box.innerHTML = `${media}
    <div class="player-bar"><button data-go="-1" aria-label="Previous">←</button>
    <div><small>${it.label} · ${pad(viewIdx + 1)} / ${pad(list.length)}</small><h4>${it.title ? it.title[lang] : ''}</h4></div>
    <button data-go="1" aria-label="Next">→</button></div>`;
  const m = box.firstElementChild;
  box.classList.add('tall');
  const fit = () => { const w = m.videoWidth || m.naturalWidth, h = m.videoHeight || m.naturalHeight; box.classList.toggle('tall', h >= w); };
  m.addEventListener(it.type === 'video' ? 'loadedmetadata' : 'load', fit);
  modal.classList.add('open');
}
box.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) openViewer(viewList, viewIdx + +b.dataset.go); });
const closeModal = () => { modal.classList.remove('open'); viewIdx = -1; const vid = $('video', box); if (vid) vid.pause(); setTimeout(() => box.innerHTML = '', 400); };
$('#close').onclick = closeModal;
modal.onclick = e => { if (e.target === modal) closeModal(); };
addEventListener('keydown', e => {
  if (e.key === 'Escape') return closeModal();
  if (!modal.classList.contains('open') || viewIdx < 0) return;
  const rtl = document.dir === 'rtl';
  if (e.key === 'ArrowRight') openViewer(viewList, viewIdx + (rtl ? -1 : 1));
  if (e.key === 'ArrowLeft') openViewer(viewList, viewIdx + (rtl ? 1 : -1));
});

/* ---------- drifting rows: auto-scroll forever, drag / swipe with momentum, click to open ----------
   the track holds the same items twice; it wraps exactly at the start of the second copy, so there is no jump */
function driftRow(row, auto, onOpen) {
  const track = row.firstElementChild;
  let x = 0, v = auto, drag = null, moved = false, hover = false, seen = false, half = 0;
  const measure = () => { const k = track.children.length / 2; half = track.children[k] ? track.children[k].offsetLeft - track.children[0].offsetLeft : track.scrollWidth / 2; };
  measure(); addEventListener('resize', measure); addEventListener('load', measure);
  if (auto > 0) x = -half;
  let running = false;
  const wake = () => { if (seen && shown(row) && !running) { running = true; requestAnimationFrame(step); } };
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; wake(); }).observe(row);
  onShown(row, wake);
  function step() {
    if (!seen || !shown(row)) { running = false; return; }
    if (!drag) { v += ((hover ? 0 : auto) - v) * .05; x += v; }
    if (half) { while (x <= -half) x += half; while (x > 0) x -= half; }
    track.style.transform = `translate3d(${x}px,0,0)`;
    requestAnimationFrame(step);
  }
  row.addEventListener('mouseenter', () => hover = true);
  row.addEventListener('mouseleave', () => hover = false);
  row.addEventListener('pointerdown', e => { drag = { last: e.clientX, start: e.clientX }; moved = false; try { row.setPointerCapture(e.pointerId); } catch (err) {} });
  row.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.last; drag.last = e.clientX;
    if (Math.abs(e.clientX - drag.start) > 6) { moved = true; row.classList.add('dragging'); }
    x += dx; v = dx;
  });
  row.addEventListener('pointerup', e => {
    if (!drag) return;
    drag = null; row.classList.remove('dragging');
    if (!moved && onOpen) { const t = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-i]'); if (t && row.contains(t)) onOpen(+t.dataset.i); }
  });
  row.addEventListener('pointercancel', () => { drag = null; row.classList.remove('dragging'); });
}

/* ---------- clients: tilted wall, three rows of logo cards (every row holds all the logos, starting at a different one) ---------- */
(function renderClients() {
  const ids = Array.from({ length: 16 }, (_, i) => i + 1);
  ['#logos1', '#logos2', '#logos3'].forEach((sel, r) => {
    const order = ids.map((_, i) => ids[(i + r * 5) % ids.length]);
    const html = order.map(i => `<span class="logo-tile"><img src="assets/media/clients/client-${i}.webp" alt="" draggable="false"></span>`).join('');
    $(sel).innerHTML = html + html;
    driftRow($(sel).parentElement, [-.4, .5, -.3][r]);
  });
  // optical sizing: every logo gets roughly the same visual area, so square marks don't overpower wide wordmarks
  $$('.logo-tile img').forEach(img => {
    const fit = () => {
      const box = img.parentElement, bw = box.clientWidth * .76, bh = box.clientHeight * .62;
      const ar = img.naturalWidth / img.naturalHeight, area = bw * bh * .55;
      let h = Math.sqrt(area / ar), w = h * ar;
      if (w > bw) { w = bw; h = w / ar; }
      if (h > bh) { h = bh; w = h * ar; }
      img.style.width = w + 'px'; img.style.height = h + 'px';
    };
    img.complete && img.naturalWidth ? fit() : img.addEventListener('load', fit, { once: true });
    addEventListener('resize', fit);
  });
})();
/* ---------- 01 · social media: two rows drifting in opposite directions ---------- */
const socialView = SOCIAL.map(s => ({ type: 'image', src: `${MEDIA}social/${s.id}.webp`, label: s.client || 'SOCIAL', title: s.title }));
(function renderSocial() {
  const tile = (s, i) => `<button class="gtile" data-i="${i}"><img src="${MEDIA}social/thumb/${s.id}.webp" alt="" loading="lazy" decoding="async"></button>`;
  const rows = [SOCIAL.filter((_, i) => i % 2 === 0), SOCIAL.filter((_, i) => i % 2 === 1)];
  ['#social1', '#social2'].forEach((sel, r) => {
    const items = rows[r].map(s => tile(s, SOCIAL.indexOf(s)));
    let html = SOCIAL.length ? items.join('') : soon(6, 'gtile');
    while (SOCIAL.length && html.split('class="gtile"').length - 1 < 8) html += items.join('');
    $(sel).innerHTML = html + html;
  });
  // keyboard (Enter/Space) opens a design; mouse/touch opening is handled by the drag logic below
  $$('.social-sec .gtile:not(.soon)').forEach(t => t.onclick = e => { if (e.detail === 0) openViewer(socialView, +t.dataset.i); });
  $$('.social-sec .grow').forEach((row, r) => driftRow(row, r ? .45 : -.45, i => openViewer(socialView, i)));
})();

/* ---------- 02 · AI wheel: rotating ring of clips (auto-spin, drag, arrows) ---------- */
const aiP = v => vidPaths('ai', v);
const aiView = AI_VIDEOS.map(v => ({ type: 'video', src: aiP(v).full, poster: aiP(v).poster, label: v.brand, title: v.title }));
const openClip = i => openViewer(aiView, i);
const stage = $('#wheelStage'), wheel = $('#wheel'), N = AI_VIDEOS.length, SLICE = 360 / N;
wheel.innerHTML = AI_VIDEOS.map((v, i) => `
  <article class="wcard" data-i="${i}" style="--ang:${i * SLICE}deg">
    <div class="wcard-in">
      ${clipVideo(aiP(v))}
      <div class="clip-shade"></div>
      <span class="clip-num">${pad(i + 1)}</span>
      <span class="clip-dur">${v.dur}</span>
      <div class="clip-play">▶</div>
      <div class="clip-info"><small>${v.brand}</small><h4 ${T(v.title)}>${v.title.en}</h4></div>
    </div>
  </article>`).join('');
const cards = $$('.wcard', wheel);
$('#reelAll').textContent = pad(N);
cards.forEach(c => wireClip(c, $('video', c)));

// the wheel only animates (and plays its active preview) while it is on screen
let wheelVisible = false;
let wheelSeen = false, wheelRunning = false;
function wheelVis() {
  wheelVisible = wheelSeen && shown(stage);
  const v = active >= 0 && $('video', cards[active]);
  if (wheelVisible) { if (v) playClip(v); if (!wheelRunning) { wheelRunning = true; requestAnimationFrame(tick); } } else if (v) v.pause();
}
new IntersectionObserver(([e]) => { wheelSeen = e.isIntersecting; wheelVis(); }).observe(stage);
onShown(stage, wheelVis);

function layoutWheel() {
  // size the wheel to the stage: top arc of cards + the hub text all fit inside one screen
  // (phones get a much bigger ring, so only its top arc shows instead of a whole wheel squeezed in)
  const h = stage.clientHeight || innerHeight * .8;
  const R = Math.max(220, Math.min((h - 110) / 1.546, innerWidth * (innerWidth < 760 ? .9 : .42), 640)), cw = R * .48, ch = cw * 16 / 9;
  const cy = ch * .14 + 40 + R + ch / 2, hub = Math.min(2 * (R - ch / 2 - 30), 560);
  Object.entries({ '--r': R, '--cw': cw, '--ch': ch, '--cy': cy, '--hub': hub })
    .forEach(([k, v]) => stage.style.setProperty(k, v + 'px'));
}layoutWheel();

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const AUTO = REDUCED ? 0 : .05; // deg per frame
let spin = 0, vel = AUTO, target = null, hovering = false, holdUntil = 0, active = -1, drag = null, moved = false;

function setActive(i) {
  if (i === active) return;
  if (active >= 0) { const o = cards[active]; o.classList.remove('on'); if (!o.classList.contains('live')) $('video', o).pause(); }
  active = i;
  const c = cards[i]; c.classList.add('on'); if (wheelVisible) playClip($('video', c));
  $('#reelNow').textContent = pad(i + 1);
  $('#wheelTitle').textContent = AI_VIDEOS[i].title[lang];
}
function tick() {
  if (!wheelVisible) { wheelRunning = false; return; }
  if (target !== null) {
    spin += (target - spin) * .1;
    if (Math.abs(target - spin) < .05) { spin = target; target = null; }
  } else if (!drag) {
    vel += ((hovering || performance.now() < holdUntil ? 0 : AUTO) - vel) * .04;
    spin += vel;
  }
  wheel.style.transform = `rotate(${spin}deg)`;
  setActive(((Math.round(-spin / SLICE) % N) + N) % N);
  requestAnimationFrame(tick);
}
setActive(0);

const go = d => { holdUntil = performance.now() + 3000; target = (Math.round(spin / SLICE) - d) * SLICE; };
$('#reelNext').onclick = () => go(document.dir === 'rtl' ? -1 : 1);
$('#reelPrev').onclick = () => go(document.dir === 'rtl' ? 1 : -1);
stage.addEventListener('mouseenter', () => hovering = true);
stage.addEventListener('mouseleave', () => hovering = false);
stage.addEventListener('pointerdown', e => { drag = { x: e.clientX, last: e.clientX }; moved = false; target = null; });
addEventListener('pointermove', e => {
  if (!drag) return;
  const dx = e.clientX - drag.last; drag.last = e.clientX;
  if (Math.abs(e.clientX - drag.x) > 6) { moved = true; stage.classList.add('dragging'); }
  vel = dx * .12; spin += vel;
});
addEventListener('pointerup', () => { if (!drag) return; drag = null; stage.classList.remove('dragging'); holdUntil = performance.now() + 1500; });
stage.addEventListener('click', e => {
  if (moved) { moved = false; return; }
  const c = e.target.closest('.wcard'); if (c) openClip(+c.dataset.i);
});

/* ---------- 03 · video editing: one stacking card per project ---------- */
const edP = v => vidPaths('editing', v);
const editView = EDITING.flatMap(p => p.videos.map(v => ({ type: 'video', src: edP(v).full, poster: edP(v).poster, label: p.client, title: p.title })));
(function renderEditing() {
  if (!$('#stack')) return; // section removed on the Lemon site
  if (!EDITING.length) { $('#stack').innerHTML = `<article class="pcard soon-card" style="--i:0"><span data-en="Video editing projects — coming soon" data-ar="مشاريع المونتاج — قريبًا"></span></article>`; return; }
  let k = 0;
  $('#stack').innerHTML = EDITING.map((p, n) => `
    <article class="pcard" style="--i:${n}">
      <header class="pcard-head">
        <span class="pcard-num">${pad(n + 1)}</span>
        <div><small data-en="Client" data-ar="العميل"></small><h3>${p.client}</h3></div>
        <button class="pill" data-open="${k}"><span data-en="Watch ▶" data-ar="شوف ▶"></span></button>
      </header>
      <div class="pcard-body">
        <div class="pcard-info">
          <h4 class="pcard-title" ${T(p.title)}></h4>
          <p ${T(p.desc)}></p>
          <div class="ptags"><span data-en="VIDEO EDITING" data-ar="مونتاج"></span><span data-en="${p.videos.length} video${p.videos.length > 1 ? 's' : ''}" data-ar="${p.videos.length} فيديو"></span></div>
        </div>
        <div class="ptiles">${p.videos.map(v => `
          <div class="ptile${v.ratio === '16:9' ? ' wide' : ''}" data-open="${k++}">
            ${clipVideo(edP(v))}
            <span class="clip-dur">${v.dur || ''}</span><div class="clip-play">▶</div>
          </div>`).join('')}
        </div>
      </div>
    </article>`).join('');
  $$('.ptile').forEach(t => wireClip(t, $('video', t)));
  $('#stack').addEventListener('click', e => { const t = e.target.closest('[data-open]'); if (t) openViewer(editView, +t.dataset.open); });
})();

/* ---------- 04 · gifs: bento grid of looping clips, playing only while on screen ---------- */
const gifView = GIFS.map(g => ({ type: 'video', src: `${MEDIA}gifs/${g.id}.mp4`, poster: `${MEDIA}gifs/${g.id}.jpg`, label: 'GIF' }));
(function renderGifs() {
  const bento = $('#bento');
  if (!GIFS.length) { bento.innerHTML = ['b', 's', 's', 'w', 't', 's'].map(s => `<div class="gif soon size-${s}"><span data-en="Coming soon" data-ar="قريبًا"></span></div>`).join(''); return; }
  bento.innerHTML = GIFS.map((g, i) => `
    <button class="gif size-${g.size || 's'}" data-i="${i}">
      <video data-poster="${MEDIA}gifs/${g.id}.jpg" data-src="${MEDIA}gifs/${g.id}.mp4" muted loop playsinline preload="none"></video>
    </button>`).join('');
  const sync = g => { const v = $('video', g); g._seen && shown(g) ? playClip(v) : v.pause(); };
  const gio = new IntersectionObserver(es => es.forEach(e => { e.target._seen = e.isIntersecting; sync(e.target); }), { rootMargin: '100px' });
  $$('.gif', bento).forEach(g => { gio.observe(g); g.onclick = () => openViewer(gifView, +g.dataset.i); });
  onShown(bento, () => $$('.gif', bento).forEach(sync));
})();

/* ---------- 05 · print: horizontal gallery driven by vertical scroll ---------- */
const flatPrint = PRINT.filter(p => !p.book && !p.model);
const printView = flatPrint.map(p => ({ type: 'image', src: `${MEDIA}print/${p.id}.webp`, label: p.client || 'PRINT', title: p.title }));
const printSec = $('#printSec'), printTrack = $('#printTrack');
const pageSrc = (p, n, thumb) => `${MEDIA}print/${p.id}/${thumb ? 'thumb/' : ''}p${pad(n)}.webp`;
(function renderPrint() {
  printTrack.innerHTML = PRINT.length
    ? PRINT.map(p => p.model ? `
        <button class="print-item model" data-model="${PRINT.indexOf(p)}">
          <img src="${MEDIA}print/${p.id}/shots/s2.webp" alt="" loading="lazy" decoding="async">
          <span class="book-badge"><b>3D</b> · ${p.shots} <span data-en="views" data-ar="زوايا"></span></span>
          <span class="print-cap"><small>${p.client || ''}</small><b ${T(p.title)}></b><em data-en="Spin it in 3D ↗" data-ar="لفّها 3D ↗"></em></span>
        </button>` : p.book ? `
        <button class="print-item book" data-book="${PRINT.indexOf(p)}" style="--ratio:${p.book.ratio}">
          <span class="book-stack" aria-hidden="true"><i></i><i></i><i></i></span>
          <img src="${pageSrc(p, 1, true)}" alt="" loading="lazy" decoding="async">
          <span class="book-badge"><b>${p.book.pages}</b> <span data-en="pages" data-ar="صفحة"></span></span>
          <span class="print-cap"><small>${p.client || ''}</small><b ${T(p.title)}></b><em data-en="Open the book ↗" data-ar="افتح الكتاب ↗"></em></span>
        </button>` : `
        <button class="print-item" data-i="${flatPrint.indexOf(p)}">
          <img src="${MEDIA}print/thumb/${p.id}.webp" alt="" loading="lazy" decoding="async">
          <span class="print-cap"><small>${p.client || ''}</small><b ${T(p.title)}></b></span>
        </button>`).join('')
    : soon(4, 'print-item');
  $('#printAll').textContent = pad(Math.max(PRINT.length, 1));
  $$('.print-item[data-i]', printTrack).forEach(b => b.onclick = () => openViewer(printView, +b.dataset.i));
  $$('.print-item[data-book]', printTrack).forEach(b => b.onclick = () => openBook(PRINT[+b.dataset.book]));
  $$('.print-item[data-model]', printTrack).forEach(b => b.onclick = () => openShowcase(PRINT[+b.dataset.model]));
})();

/* ---------- showcase viewer: interactive 3D model + the original mockup shots ---------- */
function openShowcase(p) {
  const shots = Array.from({ length: p.shots }, (_, i) => `${MEDIA}print/${p.id}/shots/s${i + 1}.webp`);
  const ar = lang === 'ar';
  const V = [['three', '3/4', '3/4'], ['front', 'Front', 'قدام'], ['left', 'Left', 'شمال'], ['rear', 'Rear', 'ورا'], ['right', 'Right', 'يمين'], ['top', 'Top', 'فوق']];
  const pv = document.createElement('div');
  pv.className = 'bv pv'; pv.setAttribute('role', 'dialog'); pv.dir = 'ltr';
  pv.innerHTML = `
    <header class="bv-head">
      <div><small>${p.client}</small><b>${p.title[lang]}</b></div>
      <span class="bv-count" id="pvLabel">3D</span>
      <button class="bv-close" aria-label="Close">✕</button>
    </header>
    <div class="bv-stage pv-stage">
      <div class="pv-3d" id="pv3d"><div class="pv-loading">${ar ? 'بيحمّل الموديل…' : 'Loading 3D model…'}</div></div>
      <img class="pv-img" id="pvImg" alt="" hidden>
      <div class="pv-tools" id="pvTools">
        ${V.map(([k, en, a]) => `<button data-view="${k}">${ar ? a : en}</button>`).join('')}
        <span></span><button data-zoom="-1" aria-label="Zoom in">＋</button><button data-zoom="1" aria-label="Zoom out">－</button>
      </div>
    </div>
    <div class="bv-thumbs">
      <button class="on pv-3dthumb" data-s="-1"><b>3D</b><span>360°</span></button>
      ${shots.map((s, i) => `<button data-s="${i}"><img src="${MEDIA}print/${p.id}/shots/thumb/s${i + 1}.webp" alt="" loading="lazy"><span>${pad(i + 1)}</span></button>`).join('')}
    </div>
    <p class="bv-hint">${ar ? 'اسحب عشان تلف العربية · العجلة للتقريب · أو اختار زاوية' : 'Drag to spin the truck · scroll to zoom · or pick a view'}</p>`;
  document.body.appendChild(pv);
  document.documentElement.classList.add('bv-open');
  requestAnimationFrame(() => pv.classList.add('open'));

  let model = null, cur = -1;
  const truckLib = window.mountTruck ? Promise.resolve() : new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'truck3d.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  truckLib.then(() => window.mountTruck($('#pv3d', pv), `${MEDIA}print/${p.id}/tex`)).then(t => {
    model = t; const l = $('.pv-loading', pv); if (l) l.remove();
  }).catch(() => { const l = $('.pv-loading', pv); if (l) l.textContent = ar ? 'الـ 3D محتاج إنترنت — شوف الصور تحت' : '3D needs an internet connection — see the shots below'; });

  const show = i => {
    cur = i;
    const img = $('#pvImg', pv), three = $('#pv3d', pv);
    img.hidden = i < 0; three.style.visibility = i < 0 ? 'visible' : 'hidden';
    $('#pvTools', pv).style.display = i < 0 ? '' : 'none';
    if (i >= 0) img.src = shots[i];
    $('#pvLabel', pv).textContent = i < 0 ? '3D' : `${pad(i + 1)} / ${pad(shots.length)}`;
    $$('.bv-thumbs button', pv).forEach(b => b.classList.toggle('on', +b.dataset.s === i));
  };
  $$('.bv-thumbs button', pv).forEach(b => b.onclick = () => show(+b.dataset.s));
  $$('[data-view]', pv).forEach(b => b.onclick = () => model && model.view(b.dataset.view));
  $$('[data-zoom]', pv).forEach(b => b.onclick = () => model && model.zoom(+b.dataset.zoom));

  const close = () => {
    pv.classList.remove('open'); document.documentElement.classList.remove('bv-open');
    removeEventListener('keydown', keys);
    setTimeout(() => { if (model) model.destroy(); pv.remove(); }, 450);
  };
  const keys = e => {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(Math.min(shots.length - 1, cur + 1));
    if (e.key === 'ArrowLeft') show(Math.max(-1, cur - 1));
  };
  addEventListener('keydown', keys);
  $('.bv-close', pv).onclick = close;
}
/* ---------- book viewer: page-turning flipbook for multi-page print work ---------- */
let flipLib = null;
function loadFlip() {
  if (flipLib) return flipLib;
  return flipLib = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.js';
    s.onload = () => window.St ? res(window.St) : rej(); s.onerror = rej;
    document.head.appendChild(s);
  });
}
function openBook(p) {
  const N = p.book.pages, pages = Array.from({ length: N }, (_, i) => pageSrc(p, i + 1));
  const bv = document.createElement('div');
  bv.className = 'bv'; bv.setAttribute('role', 'dialog'); bv.dir = 'ltr';
  bv.innerHTML = `
    <header class="bv-head">
      <div><small>${p.client}</small><b>${p.title[lang]}</b></div>
      <span class="bv-count"><b id="bvNow">01</b> / ${pad(N)}</span>
      <button class="bv-close" aria-label="Close">✕</button>
    </header>
    <div class="bv-stage"><button class="bv-arrow prev" aria-label="Previous page">←</button><div class="bv-book" id="bvBook"></div><button class="bv-arrow next" aria-label="Next page">→</button></div>
    <div class="bv-thumbs">${pages.map((_, i) => `<button data-p="${i}"><img src="${pageSrc(p, i + 1, true)}" alt="" loading="lazy"><span>${pad(i + 1)}</span></button>`).join('')}</div>
    <p class="bv-hint" data-en="Drag the corner or use the arrows to turn pages" data-ar="اسحب طرف الصفحة أو استخدم الأسهم عشان تقلّب">${lang === 'ar' ? 'اسحب طرف الصفحة أو استخدم الأسهم عشان تقلّب' : 'Drag the corner or use the arrows to turn pages'}</p>`;
  document.body.appendChild(bv);
  document.documentElement.classList.add('bv-open');
  requestAnimationFrame(() => bv.classList.add('open'));

  let flip = null;
  const mark = i => {
    const right = Math.min(N - 1, i % 2 && i < N - 1 ? i + 1 : i);
    $('#bvNow').textContent = i === 0 || i === N - 1 || window.innerWidth < 760 ? pad(i + 1) : `${pad(i % 2 ? i + 1 : i)}–${pad(i % 2 ? i + 2 : i + 1)}`;
    $$('.bv-thumbs button', bv).forEach((b, k) => b.classList.toggle('on', k === i || (innerWidth >= 760 && k === right && i !== 0)));
    const on = $('.bv-thumbs button.on', bv); if (on) on.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  };
  // a lone front or back cover sits in the middle instead of on one half of an empty spread
  const center = i => { const book = $('#bvBook', bv); if (innerWidth < 760) { book.style.transform = ''; return; } book.style.transform = i === 0 ? 'translateX(-25%)' : (i === N - 1 && N % 2 === 0 ? 'translateX(25%)' : ''); };
  const build = St => {
    const stage = $('.bv-stage', bv), book = $('#bvBook', bv);
    const single = innerWidth < 760;
    const availW = stage.clientWidth - (single ? 20 : 140), availH = stage.clientHeight - 10;
    let pw = single ? availW : availW / 2, ph = pw / p.book.ratio;
    if (ph > availH) { ph = availH; pw = ph * p.book.ratio; }
    const start = flip ? flip.getCurrentPageIndex() : 0;
    if (flip) { flip.destroy(); book.innerHTML = ''; }
    const el = document.createElement('div'); book.appendChild(el);
    flip = new St.PageFlip(el, { width: Math.round(pw), height: Math.round(ph), size: 'fixed', showCover: true, usePortrait: single,
      maxShadowOpacity: .45, flippingTime: 800, mobileScrollSupport: false, startPage: start });
    const nodes = pages.map(src => { const d = document.createElement('div'); d.className = 'bv-page'; d.innerHTML = `<img src="${src}" alt="" draggable="false">`; return d; });
    el.append(...nodes);
    flip.loadFromHTML(nodes);
    flip.on('flip', e => { mark(e.data); center(e.data); });
    mark(start); center(start);
  };
  const close = () => {
    bv.classList.remove('open'); document.documentElement.classList.remove('bv-open');
    removeEventListener('keydown', keys); removeEventListener('resize', onResize);
    setTimeout(() => { if (flip) flip.destroy(); bv.remove(); }, 450);
  };
  const keys = e => {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight' && flip) flip.flipNext();
    if (e.key === 'ArrowLeft' && flip) flip.flipPrev();
  };
  let rt; const onResize = () => { clearTimeout(rt); rt = setTimeout(() => loadFlip().then(build), 250); };
  addEventListener('keydown', keys); addEventListener('resize', onResize);
  $('.bv-close', bv).onclick = close;
  bv.addEventListener('click', e => { if (e.target === bv) close(); });
  $('.bv-arrow.prev', bv).onclick = () => flip && flip.flipPrev();
  $('.bv-arrow.next', bv).onclick = () => flip && flip.flipNext();
  $$('.bv-thumbs button', bv).forEach(b => b.onclick = () => flip && flip.flip(+b.dataset.p));

  loadFlip().then(St => setTimeout(() => build(St), 60)).catch(() => {
    // no flipbook library (offline): fall back to the regular image viewer
    close();
    openViewer(pages.map((src, i) => ({ type: 'image', src, label: p.client, title: { en: `Page ${i + 1}`, ar: `صفحة ${i + 1}` } })), 0);
  });
}
let printOverflow = 0;
function layoutPrint() {
  printOverflow = Math.max(0, printTrack.scrollWidth - innerWidth);
  printSec.style.height = (innerHeight + Math.max(printOverflow, innerHeight * .4)) + 'px';
}

/* ---------- reveal on view + counters ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in');
  $$('[data-count]', e.target).forEach(count);
  io.unobserve(e.target);
}), { threshold: .15 });
$$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 3) * 90 + 'ms'; io.observe(el); });
// video posters load only when their clip is about to come on screen
const posterIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.poster = e.target.dataset.poster; posterIO.unobserve(e.target);
}), { rootMargin: '500px' });
$$('video[data-poster]').forEach(v => posterIO.observe(v));
function count(el) {
  const to = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now();
  (function f(t) {
    const p = Math.min((t - t0) / 1600, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + (p === 1 ? suf : '');
    if (p < 1) requestAnimationFrame(f);
  })(t0);
}

/* ---------- stacking panels + scroll-scrubbed effects ---------- */
const panels = $$('.panel');
const covers = panels.map(p => { const c = document.createElement('i'); c.className = 'cover'; p.appendChild(c); return c; });
const setCover = (i, v) => { if (covers[i]._v !== v) { covers[i]._v = v; covers[i].style.opacity = v; } };
const titles = $$('.ttl');
const objs = $$('.obj');
const anchors = $$('.anchor');
const nav = $('#nav'), bar = $('#progress'), heroMedia = $('#heroMedia');

let docH = 1;
function measurePanels() {
  layoutPrint();
  panels.forEach((p, i) => { p.style.setProperty('--z', i + 1); p.style.setProperty('--sh', p.offsetHeight + 'px'); });
  measureAnchors();
  docH = document.documentElement.scrollHeight;
  fx();
}

// giant titles focus in once (CSS transition): blur → sharp, small → full size
const titleIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); titleIO.unobserve(e.target); } }), { rootMargin: '0px 0px -15% 0px' });
titles.forEach(t => titleIO.observe(t));
const words = $$('.words');
const navLinks = $$('.links a');
let anchorY = [];
function measureAnchors() { anchorY = anchors.map(a => a.getBoundingClientRect().top + scrollY); }

let fxQueued = false;
function fx() {
  fxQueued = false;
  const H = innerHeight, y = scrollY;

  // ---- read everything first (one layout pass) ----
  const pr = panels.map(p => p.getBoundingClientRect());
  const wr = words.map(w => w.getBoundingClientRect());
  const psr = printSec.getBoundingClientRect();

  // ---- then write ----
  nav.classList.toggle('solid', y > 30);
  bar.style.transform = `scaleX(${(y / Math.max(1, docH - H)).toFixed(4)})`;

  // each panel slides up over the pinned one before it: it widens from inset to full bleed,
  // while the one underneath darkens
  for (let i = 1; i < panels.length; i++) {
    const top = pr[i].top;
    if (top > H || top < -H * .2) { if (top > H) setCover(i - 1, 0); continue; }
    const e = clamp01((H - top) / (H * .85)), inset = ((1 - e) * 4).toFixed(2) + '%';
    if (panels[i]._inset !== inset) { panels[i]._inset = inset; panels[i].style.setProperty('--inset', inset); }
    setCover(i - 1, (e * .6).toFixed(2));
  }
  // rest every panel the visitor cannot see: fully covered by the next one, or still below the screen
  let covered = false;
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i], away = covered || pr[i].top > H * 1.5;
    if (away !== !!p._away) { p._away = away; p.classList.toggle('away', away); p.dispatchEvent(new Event('vis')); }
    if (pr[i].top <= -60 && pr[i].bottom >= H - 1) covered = true;   // this panel hides everything stacked under it
  }

  // print gallery slides sideways while its section is pinned
  if (psr.top < H && psr.bottom > 0) {
    const p = clamp01(-psr.top / Math.max(1, psr.height - H));
    printTrack.style.transform = `translate3d(${(document.dir === 'rtl' ? 1 : -1) * p * printOverflow}px,0,0)`;
    const n = Math.max(PRINT.length, 1);
    const now = pad(Math.min(n, Math.round(p * (n - 1)) + 1));
    if (fx.printNow !== now) $('#printNow').textContent = fx.printNow = now;
  }

  // about paragraph lights up word by word
  words.forEach((w, k) => {
    const r = wr[k];
    if (r.top > H || r.bottom < 0) return;
    const ws = w.children, p = clamp01((H * .85 - r.top) / (r.height + H * .3)) * ws.length;
    for (let i = 0; i < ws.length; i++) { const o = (.15 + .85 * clamp01(p - i)).toFixed(2); if (ws[i]._o !== o) ws[i].style.opacity = ws[i]._o = o; }
  });

  // floating objects drift at their own depth
  objs.forEach(o => {
    const r = pr[panels.indexOf(o.parentElement)];
    if (!r || r.top > H || r.bottom < 0) return;
    o.style.translate = `0 ${(r.top * +o.dataset.speed).toFixed(1)}px`;
  });

  // hero photo pushes in slightly as you leave
  if (y < H) heroMedia.style.transform = `scale(${(1 + clamp01(y / H) * .12).toFixed(3)})`;

  // nav: active link + light/dark contrast
  let cur = '';
  anchors.forEach((a, i) => { if (anchorY[i] - y <= H * .4) cur = a.id; });
  if (['social', 'reel', 'editing', 'gifs', 'print'].includes(cur)) cur = 'work';
  navLinks.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + cur));
  let under = null;
  pr.forEach((r, i) => { if (r.top <= 40 && r.bottom > 40) under = panels[i]; });
  nav.classList.toggle('on-light', !!under && lightPanel(under));
}addEventListener('scroll', () => { if (!fxQueued) { fxQueued = true; requestAnimationFrame(fx); } }, { passive: true });
addEventListener('resize', () => { layoutWheel(); fitHero(); measurePanels(); });

/* ---------- mobile menu ---------- */
const burger = $('#burger'), links = $('#links');
burger.onclick = () => { burger.classList.toggle('x'); links.classList.toggle('open'); };
links.onclick = e => { if (e.target.tagName === 'A') { burger.classList.remove('x'); links.classList.remove('open'); } };

/* ---------- cursor + magnetic buttons ---------- */
const cur = $('#cursor');
addEventListener('mousemove', e => {
  cur.style.opacity = 1;
  cur.style.left = e.clientX + 'px'; cur.style.top = e.clientY + 'px';
  cur.classList.toggle('big', !!e.target.closest('a,button,.wcard,.ptile'));
});
$$('.magnetic').forEach(m => {
  m.addEventListener('mousemove', e => {
    const r = m.getBoundingClientRect();
    m.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`;
  });
  m.addEventListener('mouseleave', () => m.style.transform = '');
});

/* ---------- contact form (opens the visitor's mail app) ---------- */
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const body = `${f.get('msg')}\n\n${f.get('name')} — ${f.get('email')}${f.get('phone') ? ' — ' + f.get('phone') : ''}`;
  location.href = `mailto:assemdarwish.1@gmail.com?subject=${encodeURIComponent('Lemon Agency inquiry from ' + f.get('name'))}&body=${encodeURIComponent(body)}`;
});

/* ---------- init ---------- */
$('#yr').textContent = new Date().getFullYear();
setLang(lang);
document.fonts && document.fonts.ready.then(() => { fitHero(); measurePanels(); });
// the intro stays long enough for its greeting to finish, even when everything is already cached
addEventListener('load', () => { measurePanels(); setTimeout(openSite, Math.max(900, 3000 - performance.now())); });
// never leave a visitor on a slow connection staring at the intro: open after 8 s even if media is still loading
setTimeout(() => { measurePanels(); openSite(); }, 8000);





/* ---------- opening: hide the loader ---------- */
function openSite() {
  $('#loader').classList.add('hide');
}











/* ---------- hero spotlight follows the cursor (eased); wanders on its own when there is no mouse ---------- */
(function heroTorch() {
  const hero = $('.hero'), dark = $('#heroDark');
  if (!hero || !dark) return;
  // the dark sheet with its hole is drawn once on a small canvas, stretched, and only moved with transform (GPU, no repaint)
  const cv = document.createElement('canvas'), RES = 768; cv.width = cv.height = RES; dark.appendChild(cv);
  let W = 1, Hh = 1, S = 1;
  function paint() {
    W = hero.clientWidth; Hh = hero.clientHeight; S = 2 * Math.max(W, Hh) + 40;
    cv.style.width = cv.style.height = S + 'px';
    const r = Math.min(300, Math.max(170, innerWidth * .19)) / S * RES, c = cv.getContext('2d'), m = RES / 2;
    c.clearRect(0, 0, RES, RES);
    const g = c.createRadialGradient(m, m, 0, m, m, r);
    g.addColorStop(0, 'rgba(60,40,24,.06)'); g.addColorStop(.35, 'rgba(12,10,10,0)');
    g.addColorStop(.62, 'rgba(12,10,10,.55)'); g.addColorStop(1, 'rgba(8,6,6,.93)');
    c.fillStyle = g; c.fillRect(0, 0, RES, RES);
  }
  paint(); addEventListener('resize', paint);
  let tx = .5, ty = .35, x = tx, y = ty, lastMove = -1e9, running = false;
  const aim = e => {
    const r = hero.getBoundingClientRect(), p = e.touches ? e.touches[0] : e;
    tx = (p.clientX - r.left) / r.width; ty = (p.clientY - r.top) / r.height; lastMove = performance.now();
    wake();
  };
  hero.addEventListener('mousemove', aim);
  hero.addEventListener('touchmove', aim, { passive: true });
  hero.addEventListener('touchstart', aim, { passive: true });
  function loop() {
    if (!shown(hero) || document.hidden) { running = false; return; }   // hero covered by the next section: rest
    const t = performance.now();
    if (t - lastMove > 3500 && !REDUCED) {                     // idle: drift slowly around the face
      tx = .5 + Math.sin(t / 2400) * .16; ty = .36 + Math.sin(t / 1700) * .08;
    }
    x += (tx - x) * .08; y += (ty - y) * .08;
    cv.style.transform = `translate3d(${(x * W - S / 2).toFixed(1)}px,${(y * Hh - S / 2).toFixed(1)}px,0)`;
    requestAnimationFrame(loop);
  }
  const wake = () => { if (!running && shown(hero)) { running = true; loop(); } };
  wake();
  onShown(hero, wake);
  document.addEventListener('visibilitychange', wake);
})();





/* ---------- WhatsApp: prefilled greeting in the current language; appears after the loader ---------- */
(function whatsapp() {
  const btn = $('#waBtn'); if (!btn) return;
  const msg = () => lang === 'ar' ? 'أهلاً ليمون، شفت موقعكم وحابب أتكلم معاكم في مشروع.' : "Hi Lemon, I saw your website and I'd like to talk about a project.";
  btn.addEventListener('click', () => { btn.href = `https://wa.me/201040379430?text=${encodeURIComponent(msg())}`; });
  setTimeout(() => btn.classList.add('show'), 2200);
})();



/* ---------- footer portrait: the eyes follow the pointer ---------- */
(function eyes() {
  const me = $('#me'); if (!me) return;
  const pupils = $$('.pupil', me).map(g => ({ g, cx: +g.dataset.cx, cy: +g.dataset.cy, rx: +g.dataset.rx, ry: +g.dataset.ry }));
  let px = null, py = null, queued = false;
  const place = () => {
    queued = false;
    const r = me.getBoundingClientRect(), vb = me.viewBox.baseVal, k = r.width / vb.width;
    pupils.forEach(p => {
      let ox = +me.dataset.rest || 0, oy = 0;      // resting look, same side as the artwork
      if (px !== null && k) {
        const dx = px - (r.left + (p.cx - vb.x) * k), dy = py - (r.top + (p.cy - vb.y) * k);
        const d = Math.hypot(dx, dy) || 1, f = Math.min(d / (r.width * .9), 1);
        ox = dx / d * f; oy = dy / d * f;
      }
      p.g.setAttribute('transform', `translate(${(p.cx + ox * p.rx).toFixed(1)} ${(p.cy + oy * p.ry).toFixed(1)})`);
    });
  };
  let near = false;
  new IntersectionObserver(([e]) => { near = e.isIntersecting; }, { rootMargin: '200px' }).observe(me);
  const move = e => { px = e.clientX; py = e.clientY; if (near && !queued) { queued = true; requestAnimationFrame(place); } };
  addEventListener('pointermove', move, { passive: true });
  addEventListener('pointerdown', move, { passive: true });
  place();
})();
