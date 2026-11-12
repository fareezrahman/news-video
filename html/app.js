// Glance template: plain HTML/JS port of src/Episode.tsx for render-html (virtual clock).
// window.EP = episode data (same JSON as episodes/*.json, with durationSec set from real audio).
(function () {
  const FPS = 30;
  const C = {bg1: '#06122B', bg2: '#11307A', yellow: '#FFD21F', red: '#FF3B5C', cyan: '#34E1FF', white: '#FFFFFF', ink: '#06122B', dim: 'rgba(255,255,255,0.6)'};
  const HEAD = "Anton, Impact, sans-serif";
  const BODY = "Inter, sans-serif";

  // ---------- math helpers ----------
  const clampv = (v, a, b) => Math.max(a, Math.min(b, v));
  function interp(x, xs, ys, ease) {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    let p = (x - xs[i]) / (xs[i + 1] - xs[i]);
    if (ease) p = ease(p);
    return ys[i] + (ys[i + 1] - ys[i]) * p;
  }
  const outCubic = (p) => 1 - Math.pow(1 - p, 3);
  const inOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const outBack = (s) => (p) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
  const springCache = {};
  function spring(frame, damping = 10, stiffness = 200, mass = 0.7) {
    if (frame <= 0) return 0;
    const key = damping + '_' + stiffness + '_' + mass;
    let arr = springCache[key];
    if (!arr) {
      arr = [0]; let x = 0, v = 0; const dt = 1 / FPS / 8;
      for (let f = 1; f < 400; f++) {
        for (let k = 0; k < 8; k++) { const a = (-stiffness * (x - 1) - damping * v) / mass; v += a * dt; x += v * dt; }
        arr.push(x);
      }
      springCache[key] = arr;
    }
    const i = Math.floor(frame), fr = frame - i;
    if (i >= arr.length - 1) return 1;
    return arr[i] + (arr[i + 1] - arr[i]) * fr;
  }
  function rnd(seed) { let h = 2166136261; for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return (h >>> 0) / 4294967296; }
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const st = (o) => Object.entries(o).map(([k, v]) => k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()) + ':' + v).join(';');
  const div = (style, inner = '', tag = 'div') => `<${tag} style="${st(style)}">${inner}</${tag}>`;

  const segFrames = (s) => Math.ceil((s.durationSec + 0.35) * FPS);

  // ---------- background ----------
  function background(f) {
    let shapes = '';
    for (let i = 0; i < 14; i++) {
      const kind = i % 4, color = [C.yellow, C.red, C.cyan, C.white][i % 4];
      const x = rnd('x' + i) * 1080, speed = 0.4 + rnd('s' + i) * 0.9;
      let y = (rnd('y' + i) * 2200 - f * speed * 2) % 2200; if (y < -150) y += 2200;
      const rot = f * (rnd('r' + i) - 0.5) * 4, size = 24 + rnd('z' + i) * 46, op = 0.18 + rnd('o' + i) * 0.25;
      const base = {position: 'absolute', left: x + 'px', top: y + 'px', width: size + 'px', height: size + 'px', opacity: op, transform: `rotate(${rot}deg)`};
      if (kind === 0) shapes += div({...base, borderRadius: '50%', border: `6px solid ${color}`, boxSizing: 'border-box'});
      else if (kind === 1) shapes += div(base, div({position: 'absolute', left: '40%', width: '20%', height: '100%', background: color, borderRadius: '4px'}) + div({position: 'absolute', top: '40%', height: '20%', width: '100%', background: color, borderRadius: '4px'}));
      else if (kind === 2) shapes += div({...base, width: size * 0.5 + 'px', height: size * 0.5 + 'px', background: color, borderRadius: '6px'});
      else shapes += `<svg style="${st(base)}" viewBox="0 0 60 20"><path d="M2 10 Q 12 0 22 10 T 42 10 T 58 10" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/></svg>`;
    }
    return div({position: 'absolute', inset: 0, overflow: 'hidden', background: `radial-gradient(130% 90% at 50% ${30 + Math.sin(f / 50) * 8}%, ${C.bg2} 0%, ${C.bg1} 72%)`},
      div({position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(-30deg, rgba(255,255,255,0.035) 0 40px, transparent 40px 110px)', backgroundPosition: `${f * 1.5}px 0`}) + shapes);
  }

  // ---------- top bar ----------
  function topBar(f, date, active, total, progress, brand) {
    const bob = Math.sin(f / 8) * 3;
    let bars = '';
    for (let i = 0; i < total; i++) {
      const fill = i + 1 < active ? 1 : i + 1 === active ? progress : 0;
      bars += div({flex: 1, height: '14px', borderRadius: '7px', background: 'rgba(255,255,255,0.15)', overflow: 'hidden'},
        div({width: fill * 100 + '%', height: '100%', background: `linear-gradient(90deg, ${C.yellow}, ${C.red})`}));
    }
    return div({position: 'absolute', top: '100px', left: '70px', right: '70px'},
      div({display: 'flex', alignItems: 'center', justifyContent: 'space-between'},
        div({fontFamily: HEAD, fontSize: '64px', background: C.yellow, color: C.ink, padding: '0 18px', borderRadius: '12px', letterSpacing: '2px', transform: `rotate(${-3 + bob}deg) translateY(${bob}px)`}, esc(brand)) +
        div({display: 'flex', alignItems: 'center', gap: '12px', fontFamily: BODY, fontWeight: 800, fontSize: '28px', color: C.dim, letterSpacing: '2px'},
          div({width: '16px', height: '16px', borderRadius: '8px', background: C.red, opacity: 0.5 + 0.5 * Math.abs(Math.sin(f / 10))}) + esc(date))) +
      div({display: 'flex', gap: '12px', marginTop: '26px'}, bars));
  }

  // ---------- karaoke captions ----------
  const KEY = /^(GST|SST|AI|IMD|Taiwan|Singapura|Anwar|Malaysia|ASEAN)/i;
  const isKey = (w) => /\d/.test(w) || KEY.test(w);
  function captions(f, text, frames) {
    const words = text.split(/\s+/).filter(Boolean);
    const chunks = []; let cur = [], len = 0;
    for (const w of words) {
      if (cur.length && len + w.length + 1 > 20) { chunks.push(cur); cur = []; len = 0; }
      cur.push(w); len += w.length + 1;
      if (/[.?!]$/.test(w)) { chunks.push(cur); cur = []; len = 0; }
    }
    if (cur.length) chunks.push(cur);
    const flat = []; chunks.forEach((c, ci) => c.forEach((w) => flat.push({w, ci, weight: w.length + 3 + (/[.,?!]$/.test(w) ? 6 : 0)})));
    const total = flat.reduce((a, b) => a + b.weight, 0), usable = frames - 10;
    let acc = 0; flat.forEach((x) => { x.start = (acc / total) * usable; acc += x.weight; });
    let ci = flat.findIndex((t, i) => f >= t.start && (i === flat.length - 1 || f < flat[i + 1].start)); if (ci < 0) ci = 0;
    const chunkWords = flat.filter((t) => t.ci === flat[ci].ci);
    const enter = interp(f - chunkWords[0].start, [0, 6], [0, 1], outBack(2.2));
    const spans = chunkWords.map((t) => {
      const shown = f >= t.start, isCur = flat.indexOf(t) === ci;
      const pop = interp(f - t.start, [0, 4, 8], [0.6, 1.15, 1]);
      return div({display: 'inline-block', fontFamily: BODY, fontWeight: 900, fontSize: '70px', lineHeight: 1.15, textTransform: 'uppercase',
        color: isCur ? C.ink : isKey(t.w) ? C.yellow : C.white, background: isCur ? (isKey(t.w) ? C.cyan : C.yellow) : 'transparent',
        padding: '0 14px', borderRadius: '14px', opacity: shown ? 1 : 0.35, transform: `scale(${shown ? pop : 1}) rotate(${isCur ? -2 : 0}deg)`,
        textShadow: isCur ? 'none' : '0 5px 0 rgba(0,0,0,0.5)', boxShadow: isCur ? '0 8px 0 rgba(0,0,0,0.35)' : 'none'}, esc(t.w), 'span');
    }).join('');
    return div({position: 'absolute', left: '70px', right: '70px', top: '1540px', display: 'flex', justifyContent: 'center'},
      div({maxWidth: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 14px', opacity: clampv(enter, 0, 1), transform: `translateY(${(1 - enter) * 40}px) rotate(${(1 - enter) * -3}deg)`}, spans));
  }

  // ---------- transition + burst ----------
  function wipe(f) {
    if (f > 14) return '';
    return [C.red, C.yellow, C.cyan].map((col, i) => {
      const x = interp(f - i * 2, [0, 11], [-1600, 1600], inOutCubic);
      return div({position: 'absolute', top: '-400px', width: '420px', height: '2800px', left: x + 'px', background: col, transform: 'rotate(16deg)', zIndex: 60});
    }).join('');
  }
  function burst(f0, x, y, color = C.yellow) {
    const f = f0; if (f < 0 || f > 22) return '';
    const r = interp(f, [0, 22], [40, 520], outCubic), op = interp(f, [0, 22], [0.9, 0]);
    let s = div({position: 'absolute', left: x - r + 'px', top: y - r + 'px', width: r * 2 + 'px', height: r * 2 + 'px', borderRadius: '50%', boxSizing: 'border-box', border: `${interp(f, [0, 22], [26, 2])}px solid ${color}`, opacity: op});
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, d = r * 0.8;
      s += div({position: 'absolute', left: x + Math.cos(a) * d - 10 + 'px', top: y + Math.sin(a) * d - 10 + 'px', width: '20px', height: '20px', borderRadius: i % 2 ? '4px' : '10px', background: i % 3 ? color : C.white, opacity: op, transform: `rotate(${f * 20}deg)`});
    }
    return s;
  }
  function bounceWords(f, text, delay, size, color, center, step = 3) {
    return div({display: 'flex', flexWrap: 'wrap', gap: `0 ${size * 0.22}px`, justifyContent: center ? 'center' : 'flex-start'},
      text.split(' ').map((w, i) => {
        const s = spring(f - delay - i * step, 9, 220, 0.6);
        return div({display: 'inline-block', fontFamily: HEAD, fontSize: size + 'px', lineHeight: 1.04, color, textTransform: 'uppercase',
          transform: `translateY(${(1 - s) * 140}px) rotate(${(1 - s) * (i % 2 ? 14 : -14)}deg) scale(${0.4 + s * 0.6})`, opacity: Math.min(1, s * 1.5), textShadow: '0 10px 0 rgba(0,0,0,0.35)'}, esc(w), 'span');
      }).join(''));
  }

  // ---------- scenes ----------
  function hook(f, s) {
    const letters = (s.big || '').split('');
    const lastLand = 4 + (letters.length - 1) * 4 + 6;
    const shake = f > lastLand && f < lastLand + 12 ? Math.sin(f * 4) * (lastLand + 12 - f) * 2.2 : 0;
    const flash = f < lastLand ? 0 : interp(f, [lastLand, lastLand + 5], [0.55, 0]);
    const kick = spring(f, 8), zoom = interp(f, [0, 200], [1, 1.12]);
    const big = letters.map((l, i) => {
      const sp = spring(f - 4 - i * 4, 7, 260, 0.6), squash = interp(sp, [0.85, 1, 1.15], [1, 1, 0.8]);
      return div({display: 'inline-block', fontFamily: HEAD, fontSize: '400px', lineHeight: 1, color: i % 2 ? C.white : C.yellow, transformOrigin: 'bottom',
        transform: `translateY(${(1 - sp) * -900}px) scaleY(${squash}) rotate(${(1 - sp) * 30}deg)`, textShadow: '0 22px 0 rgba(0,0,0,0.35)'}, esc(l), 'span');
    }).join('');
    return div({position: 'absolute', inset: 0, transform: `translate(${shake}px, ${shake * 0.4}px) scale(${zoom})`},
      div({position: 'absolute', top: '450px', width: '100%', display: 'flex', justifyContent: 'center'},
        div({transform: `scale(${kick}) rotate(${-3 + Math.sin(f / 6) * 2}deg)`, background: C.red, color: C.white, fontFamily: BODY, fontWeight: 900, fontSize: '42px', padding: '12px 30px', borderRadius: '12px', letterSpacing: '4px', boxShadow: '0 8px 0 rgba(0,0,0,0.35)'}, '● ' + esc(s.kicker || ''))) +
      div({position: 'absolute', top: '560px', width: '100%', display: 'flex', justifyContent: 'center'}, big) +
      div({position: 'absolute', top: '1060px', left: '60px', right: '60px'}, bounceWords(f, s.sub || '', lastLand + 2, 110, C.white, true)) +
      burst(f - lastLand, 540, 760) +
      div({position: 'absolute', inset: 0, background: C.white, opacity: flash}));
  }

  function compareCard(f, c, start) {
    const max = Math.max(c.a.value, c.b.value);
    const row = (r, color, d) => {
      const t = spring(f - start - d, 11, 120, 0.7), count = interp(f - start - d, [0, 24], [0, 1], outCubic);
      const after = f - start - d - 24;
      const pulse = after > 0 ? 1 + Math.max(0, Math.sin(after / 2.5)) * 0.08 * Math.max(0, 1 - after / 20) : 1;
      return div({marginTop: '26px'},
        div({display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontFamily: BODY, fontWeight: 800, fontSize: '34px', color: C.white},
          `<span>${esc(r.label)}</span>` + div({display: 'inline-block', fontFamily: HEAD, fontSize: '72px', lineHeight: 1, color, transform: `scale(${pulse})`}, fmt(r.value * count), 'span')) +
        div({height: '40px', borderRadius: '20px', background: 'rgba(255,255,255,0.12)', marginTop: '10px'},
          div({width: Math.min(100, (r.value / max) * 100 * t) + '%', height: '100%', borderRadius: '20px', background: color, backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.25) 0 14px, transparent 14px 28px)', backgroundPosition: `${f * 2}px 0`})));
    };
    return div({fontFamily: BODY, fontWeight: 800, fontSize: '30px', letterSpacing: '3px', color: C.dim}, esc(c.title)) + row(c.a, C.yellow, 0) + row(c.b, C.red, 10);
  }
  function statCard(f, c, start) {
    const t = interp(f - start, [0, 28], [0, 1], outCubic), v = Math.round(c.value - 80 * (1 - t));
    const land = spring(f - start - 28, 6, 260);
    return div({textAlign: 'center'}, div({fontFamily: BODY, fontWeight: 800, fontSize: '32px', letterSpacing: '3px', color: C.dim}, esc(c.label)) +
      div({fontFamily: HEAD, fontSize: '250px', color: C.yellow, lineHeight: 1, transform: `scale(${1 + (f > start + 28 ? (1 - land) * 0.25 : 0)})`, textShadow: '0 14px 0 rgba(0,0,0,0.35)'}, String(v)));
  }
  function rankCard(f, c, start) {
    const t = interp(f - start, [0, 32], [0, 1], outCubic), v = Math.round(c.value + 40 * (1 - t)), note = spring(f - start - 34, 8);
    return div({textAlign: 'center'}, div({fontFamily: BODY, fontWeight: 800, fontSize: '30px', letterSpacing: '3px', color: C.dim}, esc(c.label)) +
      div({fontFamily: HEAD, fontSize: '270px', color: C.yellow, lineHeight: 1, textShadow: '0 14px 0 rgba(0,0,0,0.35)', transform: `rotate(${(1 - t) * -8}deg)`}, '#' + v) +
      (c.note ? div({display: 'inline-block', marginTop: '8px', background: C.cyan, color: C.ink, fontFamily: BODY, fontWeight: 900, fontSize: '34px', padding: '8px 20px', borderRadius: '10px', transform: `scale(${note}) rotate(-2deg)`}, esc(c.note)) : ''));
  }

  function story(f, s, frames, total) {
    const num = spring(f - 2, 7, 240), tag = spring(f - 10, 8);
    const cardStart = Math.round(frames * 0.2), card = spring(f - cardStart, 9, 170);
    const impactStart = Math.round(frames * 0.68), stamp = spring(f - impactStart, 8, 260);
    const push = interp(f, [0, frames], [1, 1.06]), punch = interp(f - cardStart, [0, 5, 14], [0, 0.04, 0]);
    const float = Math.sin(f / 18) * 6, wiggle = Math.sin(f / 10) * 3;
    let cardHtml = '';
    if (s.card) {
      const inner = s.card.kind === 'compare' ? compareCard(f, s.card, cardStart + 8) : s.card.kind === 'stat' ? statCard(f, s.card, cardStart + 8) : rankCard(f, s.card, cardStart + 8);
      cardHtml = div({position: 'absolute', top: '840px', left: '70px', right: '70px', padding: '44px', borderRadius: '36px', background: 'rgba(255,255,255,0.07)', border: '3px solid rgba(255,255,255,0.14)', boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
        opacity: Math.min(1, card * 2), transform: `translateY(${(1 - card) * 450 + float}px) rotate(${(1 - card) * 8}deg)`}, inner);
    }
    const impact = s.impact && f >= impactStart ? div({position: 'absolute', top: '1300px', left: '70px', right: '70px', transformOrigin: 'left center', opacity: Math.min(1, stamp * 2),
      transform: `scale(${interp(stamp, [0, 1], [1.8, 1])}) rotate(${interp(stamp, [0, 1], [-10, -1.5])}deg)`},
      div({display: 'inline-block', background: C.red, color: C.white, fontFamily: BODY, fontWeight: 900, fontSize: '32px', letterSpacing: '2px', padding: '8px 18px', borderRadius: '8px', boxShadow: '0 6px 0 rgba(0,0,0,0.35)'}, 'MAKSUDNYA UNTUK KORANG') +
      div({fontFamily: BODY, fontWeight: 900, fontSize: '50px', color: C.white, marginTop: '10px', lineHeight: 1.15}, esc(s.impact))) : '';
    return div({position: 'absolute', inset: 0, transform: `scale(${push + punch})`},
      div({position: 'absolute', top: '290px', left: '70px', right: '70px'},
        div({display: 'flex', alignItems: 'center', gap: '24px'},
          div({fontFamily: HEAD, fontSize: '160px', lineHeight: 1, color: 'transparent', WebkitTextStroke: `5px ${C.yellow}`, transform: `scale(${num}) rotate(${(1 - num) * -90 + wiggle}deg)`}, `${s.n}/${total}`) +
          div({background: C.yellow, color: C.ink, fontFamily: BODY, fontWeight: 900, fontSize: '36px', padding: '10px 24px', borderRadius: '10px', letterSpacing: '3px', transform: `translateX(${(1 - tag) * 400}px) rotate(${-3 + wiggle * 0.5}deg)`, boxShadow: '0 6px 0 rgba(0,0,0,0.35)'}, esc(s.tag || ''))) +
        div({marginTop: '18px'}, bounceWords(f, s.headline || '', 8, 104, C.white, false))) +
      cardHtml + burst(f - cardStart - 8, 540, 1050, C.cyan) + impact);
  }

  function outro(f, s) {
    const lbl = spring(f, 9), btn = spring(f - 30, 7, 240), pulse = 1 + Math.sin(f / 4) * 0.05;
    const tapAt = 50, tap = f - tapAt, cursorY = interp(f, [34, tapAt], [1500, 1150], outCubic);
    const press = tap >= 0 && tap < 6 ? 0.9 : 1, followed = tap >= 3;
    return div({position: 'absolute', inset: 0},
      div({position: 'absolute', top: '440px', width: '100%', textAlign: 'center'},
        div({display: 'inline-block', fontFamily: BODY, fontWeight: 900, fontSize: '40px', letterSpacing: '4px', color: C.ink, background: C.cyan, padding: '8px 22px', borderRadius: '10px', transform: `scale(${lbl}) rotate(-2deg)`}, 'SOALAN HARI NI', 'span')) +
      div({position: 'absolute', top: '540px', left: '60px', right: '60px'}, bounceWords(f, s.question || '', 4, 140, C.yellow, true, 4)) +
      div({position: 'absolute', top: '1100px', width: '100%', display: 'flex', justifyContent: 'center'},
        div({transform: `scale(${btn * pulse * press})`, background: followed ? C.white : C.red, color: followed ? C.ink : C.white, fontFamily: HEAD, fontSize: '84px', padding: '18px 64px', borderRadius: '999px', boxShadow: '0 10px 0 rgba(0,0,0,0.35)'}, followed ? '✓ FOLLOWING' : '+ FOLLOW')) +
      (f > 34 && f < tapAt + 20 ? div({position: 'absolute', left: '640px', top: cursorY + 'px', width: '70px', height: '70px', borderRadius: '35px', background: 'rgba(255,255,255,0.9)', border: `6px solid ${C.ink}`, boxSizing: 'border-box', opacity: interp(f, [tapAt + 8, tapAt + 20], [1, 0])}) : '') +
      burst(tap, 540, 1170, C.yellow));
  }

  // ---------- frame ----------
  const EP = window.EP;
  const stories = EP.segments.filter((s) => s.type === 'story').length;
  let off = 0;
  const bounds = EP.segments.map((s) => { const b = {s, from: off, len: segFrames(s)}; off += b.len; return b; });
  window.RENDER_DURATION = off / FPS;
  const root = document.getElementById('root');

  window.renderFrame = function (t) {
    const f = Math.min(Math.round(t * FPS), off - 1);
    const cur = bounds.find((b) => f >= b.from && f < b.from + b.len) || bounds[bounds.length - 1];
    const lf = f - cur.from, s = cur.s, i = bounds.indexOf(cur);
    const active = s.type === 'story' ? s.n : s.type === 'outro' ? stories + 1 : 0;
    let scene = s.type === 'hook' ? hook(lf, s) : s.type === 'story' ? story(lf, s, cur.len, stories) : outro(lf, s);
    root.innerHTML = background(f) + scene + captions(lf, s.caption, cur.len) + (i > 0 ? wipe(lf) : '') + topBar(f, EP.date, active, stories, lf / cur.len, EP.brand || 'GLANCE');
  };
  const fontsLoaded = Promise.all(['400 100px Anton', '800 100px Inter', '900 100px Inter'].map((f) => document.fonts.load(f, 'AZ09#&✓'))).then(() => document.fonts.ready);
  window.RENDER_READY = fontsLoaded;
  const m = location.hash.match(/t=([\d.]+)/);
  fontsLoaded.then(() => window.renderFrame(m ? parseFloat(m[1]) : 0));
})();
