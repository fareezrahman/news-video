import React from 'react';
import {
  AbsoluteFill, Series, Audio, staticFile, useCurrentFrame, useVideoConfig,
  interpolate, spring, Easing, random,
} from 'remotion';
import '@fontsource/anton';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';

export const FPS = 30;

// ---------- Brand ----------
const C = {
  bg1: '#06122B',
  bg2: '#11307A',
  yellow: '#FFD21F',
  red: '#FF3B5C',
  cyan: '#34E1FF',
  white: '#FFFFFF',
  ink: '#06122B',
  dim: 'rgba(255,255,255,0.6)',
};
const HEAD = 'Anton, Impact, sans-serif';
const BODY = 'Inter, sans-serif';

// ---------- Types ----------
type Card =
  | {kind: 'compare'; title: string; a: {label: string; value: number}; b: {label: string; value: number}}
  | {kind: 'stat'; value: number; label: string}
  | {kind: 'rank'; value: number; label: string; note?: string};

type Seg = {
  type: 'hook' | 'story' | 'outro';
  caption: string;
  audio: string | null;
  durationSec: number;
  kicker?: string; big?: string; sub?: string;
  n?: number; tag?: string; headline?: string; card?: Card; impact?: string;
  question?: string;
};
export type EpisodeData = {id: string; date: string; segments: Seg[]; sources: string[]};

const segFrames = (s: Seg) => Math.ceil((s.durationSec + 0.35) * FPS);
export const totalFrames = (d: EpisodeData) => d.segments.reduce((a, s) => a + segFrames(s), 0);

// ---------- Helpers ----------
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

const useSpr = (delay = 0, damping = 10, stiffness = 200) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: f - delay, fps, config: {damping, stiffness, mass: 0.7}});
};

// ---------- Background: drifting stripes + floating playful shapes ----------
const Shapes: React.FC = () => {
  const f = useCurrentFrame();
  const items = Array.from({length: 14}).map((_, i) => {
    const kind = i % 4;
    const color = [C.yellow, C.red, C.cyan, C.white][i % 4];
    const x = random(`x${i}`) * 1080;
    const speed = 0.4 + random(`s${i}`) * 0.9;
    const y = (random(`y${i}`) * 2200 - f * speed * 2) % 2200;
    const yy = y < -150 ? y + 2200 : y;
    const rot = f * (random(`r${i}`) - 0.5) * 4;
    const size = 24 + random(`z${i}`) * 46;
    const op = 0.18 + random(`o${i}`) * 0.25;
    const style: React.CSSProperties = {position: 'absolute', left: x, top: yy, width: size, height: size, opacity: op,
      transform: `rotate(${rot}deg)`};
    if (kind === 0) return <div key={i} style={{...style, borderRadius: '50%', border: `6px solid ${color}`}} />;
    if (kind === 1) return (
      <div key={i} style={style}>
        <div style={{position: 'absolute', left: '40%', width: '20%', height: '100%', background: color, borderRadius: 4}} />
        <div style={{position: 'absolute', top: '40%', height: '20%', width: '100%', background: color, borderRadius: 4}} />
      </div>
    );
    if (kind === 2) return <div key={i} style={{...style, background: color, borderRadius: 6, width: size * 0.5, height: size * 0.5}} />;
    return (
      <svg key={i} style={style} viewBox="0 0 60 20">
        <path d="M2 10 Q 12 0 22 10 T 42 10 T 58 10" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  });
  return <>{items}</>;
};

const Background: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: `radial-gradient(130% 90% at 50% ${30 + Math.sin(f / 50) * 8}%, ${C.bg2} 0%, ${C.bg1} 72%)`, overflow: 'hidden'}}>
      <AbsoluteFill style={{
        backgroundImage: 'repeating-linear-gradient(-30deg, rgba(255,255,255,0.035) 0 40px, transparent 40px 110px)',
        backgroundPosition: `${f * 1.5}px 0`,
      }} />
      <Shapes />
    </AbsoluteFill>
  );
};

// ---------- Top bar ----------
const TopBar: React.FC<{date: string; active: number; total: number; progress: number}> = ({date, active, total, progress}) => {
  const f = useCurrentFrame();
  const bob = Math.sin(f / 8) * 3;
  return (
    <div style={{position: 'absolute', top: 100, left: 70, right: 70}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{display: 'flex', alignItems: 'center', fontFamily: HEAD, fontSize: 64}}>
          <span style={{background: C.yellow, color: C.ink, padding: '0 18px', borderRadius: 12,
            transform: `rotate(${-3 + bob}deg) translateY(${bob}px)`, display: 'inline-block', letterSpacing: 2}}>GLANCE</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, fontFamily: BODY, fontWeight: 800, fontSize: 28, color: C.dim, letterSpacing: 2}}>
          <div style={{width: 16, height: 16, borderRadius: 8, background: C.red, opacity: 0.5 + 0.5 * Math.abs(Math.sin(f / 10))}} />
          {date}
        </div>
      </div>
      <div style={{display: 'flex', gap: 12, marginTop: 26}}>
        {Array.from({length: total}).map((_, i) => {
          const fill = i + 1 < active ? 1 : i + 1 === active ? progress : 0;
          return (
            <div key={i} style={{flex: 1, height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.15)', overflow: 'hidden'}}>
              <div style={{width: `${fill * 100}%`, height: '100%', background: `linear-gradient(90deg, ${C.yellow}, ${C.red})`}} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- Karaoke captions (word by word, wraps inside frame) ----------
const isKey = (w: string) => /\d/.test(w) || /^(GST|SST|AI|IMD|Taiwan|Singapura|Anwar|Malaysia|ASEAN)/i.test(w);
const MAX_CHARS = 20;

const buildChunks = (text: string) => {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[][] = [];
  let cur: string[] = [];
  let len = 0;
  words.forEach((w) => {
    if (cur.length && len + w.length + 1 > MAX_CHARS) { chunks.push(cur); cur = []; len = 0; }
    cur.push(w); len += w.length + 1;
    if (/[.?!]$/.test(w)) { chunks.push(cur); cur = []; len = 0; }
  });
  if (cur.length) chunks.push(cur);
  return chunks;
};

const Captions: React.FC<{text: string; frames: number}> = ({text, frames}) => {
  const f = useCurrentFrame();
  const chunks = buildChunks(text);
  // time per word by character length (+ pause after punctuation)
  const flat = chunks.flatMap((c, ci) => c.map((w, wi) => ({w, ci, wi, weight: w.length + 3 + (/[.,?!]$/.test(w) ? 6 : 0)})));
  const total = flat.reduce((a, b) => a + b.weight, 0);
  const usable = frames - 10;
  let acc = 0;
  const timed = flat.map((x) => { const s = (acc / total) * usable; acc += x.weight; return {...x, start: s}; });
  let cur = timed.findIndex((t, i) => f >= t.start && (i === timed.length - 1 || f < timed[i + 1].start));
  if (cur < 0) cur = 0;
  const chunkIdx = timed[cur].ci;
  const chunkWords = timed.filter((t) => t.ci === chunkIdx);
  const chunkStart = chunkWords[0].start;
  const enter = interpolate(f - chunkStart, [0, 6], [0, 1], {...clamp, easing: Easing.out(Easing.back(2.2))});

  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 1540, display: 'flex', justifyContent: 'center'}}>
      <div style={{maxWidth: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 14px',
        transform: `translateY(${(1 - enter) * 40}px) rotate(${(1 - enter) * -3}deg)`, opacity: enter}}>
        {chunkWords.map((t, i) => {
          const shown = f >= t.start;
          const isCur = timed.indexOf(t) === cur;
          const pop = interpolate(f - t.start, [0, 4, 8], [0.6, 1.15, 1], clamp);
          return (
            <span key={i} style={{
              fontFamily: BODY, fontWeight: 900, fontSize: 70, lineHeight: 1.15, textTransform: 'uppercase',
              color: isCur ? C.ink : isKey(t.w) ? C.yellow : C.white,
              background: isCur ? (isKey(t.w) ? C.cyan : C.yellow) : 'transparent',
              padding: '0 14px', borderRadius: 14,
              opacity: shown ? 1 : 0.35,
              transform: `scale(${shown ? pop : 1}) rotate(${isCur ? -2 : 0}deg)`,
              display: 'inline-block',
              textShadow: isCur ? 'none' : '0 5px 0 rgba(0,0,0,0.5)',
              boxShadow: isCur ? '0 8px 0 rgba(0,0,0,0.35)' : 'none',
            }}>{t.w}</span>
          );
        })}
      </div>
    </div>
  );
};

// ---------- Transition: stacked colour bars ----------
const Wipe: React.FC = () => {
  const f = useCurrentFrame();
  if (f > 14) return null;
  const bars = [C.red, C.yellow, C.cyan];
  return (
    <AbsoluteFill style={{zIndex: 60, pointerEvents: 'none'}}>
      {bars.map((col, i) => {
        const x = interpolate(f - i * 2, [0, 11], [-1600, 1600], {...clamp, easing: Easing.inOut(Easing.cubic)});
        return <div key={i} style={{position: 'absolute', top: -400, width: 420, height: 2800, left: x, background: col, transform: 'rotate(16deg)'}} />;
      })}
    </AbsoluteFill>
  );
};

// ---------- Burst / shockwave ----------
const Burst: React.FC<{at: number; x: number; y: number; color?: string}> = ({at, x, y, color = C.yellow}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > 22) return null;
  const r = interpolate(f, [0, 22], [40, 520], {easing: Easing.out(Easing.cubic)});
  const op = interpolate(f, [0, 22], [0.9, 0]);
  return (
    <>
      <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%',
        border: `${interpolate(f, [0, 22], [26, 2])}px solid ${color}`, opacity: op}} />
      {Array.from({length: 10}).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        const d = r * 0.8;
        return <div key={i} style={{position: 'absolute', left: x + Math.cos(a) * d - 10, top: y + Math.sin(a) * d - 10, width: 20, height: 20,
          borderRadius: i % 2 ? 4 : 10, background: i % 3 ? color : C.white, opacity: op, transform: `rotate(${f * 20}deg)`}} />;
      })}
    </>
  );
};

// ---------- Word-stagger headline ----------
const BounceWords: React.FC<{text: string; delay: number; size: number; color: string; center?: boolean; step?: number}> = ({text, delay, size, color, center, step = 3}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', gap: `0 ${size * 0.22}px`, justifyContent: center ? 'center' : 'flex-start'}}>
      {text.split(' ').map((w, i) => {
        const s = spring({frame: f - delay - i * step, fps, config: {damping: 9, stiffness: 220, mass: 0.6}});
        return (
          <span key={i} style={{display: 'inline-block', fontFamily: HEAD, fontSize: size, lineHeight: 1.04, color, textTransform: 'uppercase',
            transform: `translateY(${(1 - s) * 140}px) rotate(${(1 - s) * (i % 2 ? 14 : -14)}deg) scale(${0.4 + s * 0.6})`, opacity: Math.min(1, s * 1.5),
            textShadow: '0 10px 0 rgba(0,0,0,0.35)'}}>{w}</span>
        );
      })}
    </div>
  );
};

// ---------- Scenes ----------
const Hook: React.FC<{s: Seg}> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const letters = (s.big ?? '').split('');
  const lastLand = 4 + (letters.length - 1) * 4 + 6;
  const shake = f > lastLand && f < lastLand + 12 ? Math.sin(f * 4) * (lastLand + 12 - f) * 2.2 : 0;
  const flash = f < lastLand ? 0 : interpolate(f, [lastLand, lastLand + 5], [0.55, 0], clamp);
  const kick = useSpr(0, 8);
  const zoom = interpolate(f, [0, 200], [1, 1.12], clamp);
  return (
    <AbsoluteFill style={{transform: `translate(${shake}px, ${shake * 0.4}px) scale(${zoom})`}}>
      <div style={{position: 'absolute', top: 450, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <div style={{transform: `scale(${kick}) rotate(${-3 + Math.sin(f / 6) * 2}deg)`, background: C.red, color: C.white,
          fontFamily: BODY, fontWeight: 900, fontSize: 42, padding: '12px 30px', borderRadius: 12, letterSpacing: 4, boxShadow: '0 8px 0 rgba(0,0,0,0.35)'}}>
          ● {s.kicker}
        </div>
      </div>
      <div style={{position: 'absolute', top: 560, width: '100%', display: 'flex', justifyContent: 'center'}}>
        {letters.map((l, i) => {
          const sp = spring({frame: f - 4 - i * 4, fps, config: {damping: 7, stiffness: 260, mass: 0.6}});
          const squash = interpolate(sp, [0.85, 1, 1.15], [1, 1, 0.8], clamp);
          return (
            <span key={i} style={{display: 'inline-block', fontFamily: HEAD, fontSize: 400, lineHeight: 1, color: i % 2 ? C.white : C.yellow,
              transform: `translateY(${(1 - sp) * -900}px) scaleY(${squash}) rotate(${(1 - sp) * 30}deg)`, transformOrigin: 'bottom',
              textShadow: '0 22px 0 rgba(0,0,0,0.35)'}}>{l}</span>
          );
        })}
      </div>
      <div style={{position: 'absolute', top: 1060, left: 60, right: 60}}>
        <BounceWords text={s.sub ?? ''} delay={lastLand + 2} size={110} color={C.white} center />
      </div>
      <Burst at={lastLand} x={540} y={760} />
      <AbsoluteFill style={{background: C.white, opacity: flash}} />
    </AbsoluteFill>
  );
};

const CompareCard: React.FC<{c: Extract<Card, {kind: 'compare'}>; start: number}> = ({c, start}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const max = Math.max(c.a.value, c.b.value);
  const Row = ({label, value, color, d}: {label: string; value: number; color: string; d: number}) => {
    const t = spring({frame: f - start - d, fps, config: {damping: 11, stiffness: 120}});
    const count = interpolate(f - start - d, [0, 24], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
    const done = f - start - d > 24;
    const pulse = done ? 1 + Math.max(0, Math.sin((f - start - d - 24) / 2.5)) * 0.08 * Math.max(0, 1 - (f - start - d - 24) / 20) : 1;
    return (
      <div style={{marginTop: 26}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontFamily: BODY, fontWeight: 800, fontSize: 34, color: C.white}}>
          <span>{label}</span>
          <span style={{fontFamily: HEAD, fontSize: 72, lineHeight: 1, color, transform: `scale(${pulse})`, display: 'inline-block'}}>{fmt(value * count)}</span>
        </div>
        <div style={{height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.12)', marginTop: 10}}>
          <div style={{width: `${Math.min(100, (value / max) * 100 * t)}%`, height: '100%', borderRadius: 20, background: color,
            backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.25) 0 14px, transparent 14px 28px)',
            backgroundPosition: `${f * 2}px 0`}} />
        </div>
      </div>
    );
  };
  return (
    <div>
      <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 3, color: C.dim}}>{c.title}</div>
      <Row label={c.a.label} value={c.a.value} color={C.yellow} d={0} />
      <Row label={c.b.label} value={c.b.value} color={C.red} d={10} />
    </div>
  );
};

const StatCard: React.FC<{c: Extract<Card, {kind: 'stat'}>; start: number}> = ({c, start}) => {
  const f = useCurrentFrame();
  const t = interpolate(f - start, [0, 28], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const v = Math.round(c.value - 80 * (1 - t));
  const land = useSpr(start + 28, 6, 260);
  return (
    <div style={{textAlign: 'center', position: 'relative'}}>
      <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 32, letterSpacing: 3, color: C.dim}}>{c.label}</div>
      <div style={{fontFamily: HEAD, fontSize: 250, color: C.yellow, lineHeight: 1, transform: `scale(${1 + (f > start + 28 ? (1 - land) * 0.25 : 0)})`,
        textShadow: '0 14px 0 rgba(0,0,0,0.35)'}}>{v}</div>
    </div>
  );
};

const RankCard: React.FC<{c: Extract<Card, {kind: 'rank'}>; start: number}> = ({c, start}) => {
  const f = useCurrentFrame();
  const t = interpolate(f - start, [0, 32], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const v = Math.round(c.value + 40 * (1 - t));
  const note = useSpr(start + 34, 8);
  return (
    <div style={{textAlign: 'center'}}>
      <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 3, color: C.dim}}>{c.label}</div>
      <div style={{fontFamily: HEAD, fontSize: 270, color: C.yellow, lineHeight: 1, textShadow: '0 14px 0 rgba(0,0,0,0.35)',
        transform: `rotate(${(1 - t) * -8}deg)`}}>#{v}</div>
      {c.note && <div style={{display: 'inline-block', marginTop: 8, background: C.cyan, color: C.ink, fontFamily: BODY, fontWeight: 900, fontSize: 34,
        padding: '8px 20px', borderRadius: 10, transform: `scale(${note}) rotate(-2deg)`}}>{c.note}</div>}
    </div>
  );
};

const Story: React.FC<{s: Seg; frames: number; total: number}> = ({s, frames, total}) => {
  const f = useCurrentFrame();
  const num = useSpr(2, 7, 240);
  const tag = useSpr(10, 8);
  const cardStart = Math.round(frames * 0.2);
  const card = useSpr(cardStart, 9, 170);
  const impactStart = Math.round(frames * 0.68);
  const stamp = useSpr(impactStart, 8, 260);
  // slow push-in + punch-in when card lands + idle float
  const push = interpolate(f, [0, frames], [1, 1.06], clamp);
  const punch = interpolate(f - cardStart, [0, 5, 14], [0, 0.04, 0], clamp);
  const float = Math.sin(f / 18) * 6;
  const wiggle = Math.sin(f / 10) * 3;
  return (
    <AbsoluteFill style={{transform: `scale(${push + punch})`}}>
      <div style={{position: 'absolute', top: 290, left: 70, right: 70}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
          <div style={{fontFamily: HEAD, fontSize: 160, lineHeight: 1, color: 'transparent', WebkitTextStroke: `5px ${C.yellow}`,
            transform: `scale(${num}) rotate(${(1 - num) * -90 + wiggle}deg)`}}>{s.n}/{total}</div>
          <div style={{background: C.yellow, color: C.ink, fontFamily: BODY, fontWeight: 900, fontSize: 36, padding: '10px 24px',
            borderRadius: 10, letterSpacing: 3, transform: `translateX(${(1 - tag) * 400}px) rotate(${-3 + wiggle * 0.5}deg)`,
            boxShadow: '0 6px 0 rgba(0,0,0,0.35)'}}>{s.tag}</div>
        </div>
        <div style={{marginTop: 18}}>
          <BounceWords text={s.headline ?? ''} delay={8} size={104} color={C.white} />
        </div>
      </div>
      {s.card && (
        <div style={{position: 'absolute', top: 840, left: 70, right: 70, padding: 44, borderRadius: 36,
          background: 'rgba(255,255,255,0.07)', border: '3px solid rgba(255,255,255,0.14)', boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
          opacity: Math.min(1, card * 2), transform: `translateY(${(1 - card) * 450 + float}px) rotate(${(1 - card) * 8}deg)`}}>
          {s.card.kind === 'compare' && <CompareCard c={s.card} start={cardStart + 8} />}
          {s.card.kind === 'stat' && <StatCard c={s.card} start={cardStart + 8} />}
          {s.card.kind === 'rank' && <RankCard c={s.card} start={cardStart + 8} />}
        </div>
      )}
      <Burst at={cardStart + 8} x={540} y={1050} color={C.cyan} />
      {s.impact && f >= impactStart && (
        <div style={{position: 'absolute', top: 1300, left: 70, right: 70,
          transform: `scale(${interpolate(stamp, [0, 1], [1.8, 1])}) rotate(${interpolate(stamp, [0, 1], [-10, -1.5])}deg)`,
          opacity: Math.min(1, stamp * 2), transformOrigin: 'left center'}}>
          <div style={{display: 'inline-block', background: C.red, color: C.white, fontFamily: BODY, fontWeight: 900, fontSize: 32,
            letterSpacing: 2, padding: '8px 18px', borderRadius: 8, boxShadow: '0 6px 0 rgba(0,0,0,0.35)'}}>MAKSUDNYA UNTUK KORANG</div>
          <div style={{fontFamily: BODY, fontWeight: 900, fontSize: 50, color: C.white, marginTop: 10, lineHeight: 1.15}}>{s.impact}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const Outro: React.FC<{s: Seg}> = ({s}) => {
  const f = useCurrentFrame();
  const lbl = useSpr(0, 9);
  const btn = useSpr(30, 7, 240);
  const pulse = 1 + Math.sin(f / 4) * 0.05;
  // fake "tap" on the follow button
  const tapAt = 50;
  const tap = f - tapAt;
  const cursorY = interpolate(f, [34, tapAt], [1500, 1150], {...clamp, easing: Easing.out(Easing.cubic)});
  const press = tap >= 0 && tap < 6 ? 0.9 : 1;
  const followed = tap >= 3;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 440, width: '100%', textAlign: 'center'}}>
        <span style={{display: 'inline-block', fontFamily: BODY, fontWeight: 900, fontSize: 40, letterSpacing: 4, color: C.ink,
          background: C.cyan, padding: '8px 22px', borderRadius: 10, transform: `scale(${lbl}) rotate(-2deg)`}}>SOALAN HARI NI</span>
      </div>
      <div style={{position: 'absolute', top: 540, left: 60, right: 60}}>
        <BounceWords text={s.question ?? ''} delay={4} size={140} color={C.yellow} center step={4} />
      </div>
      <div style={{position: 'absolute', top: 1100, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <div style={{transform: `scale(${btn * pulse * press})`, background: followed ? C.white : C.red, color: followed ? C.ink : C.white,
          fontFamily: HEAD, fontSize: 84, padding: '18px 64px', borderRadius: 999, boxShadow: '0 10px 0 rgba(0,0,0,0.35)'}}>
          {followed ? '✓ FOLLOWING' : '+ FOLLOW'}
        </div>
      </div>
      {f > 34 && f < tapAt + 20 && (
        <div style={{position: 'absolute', left: 640, top: cursorY, width: 70, height: 70, borderRadius: 35, background: 'rgba(255,255,255,0.9)',
          border: `6px solid ${C.ink}`, opacity: interpolate(f, [tapAt + 8, tapAt + 20], [1, 0], clamp)}} />
      )}
      <Burst at={tapAt} x={540} y={1170} color={C.yellow} />
    </AbsoluteFill>
  );
};

// ---------- Episode ----------
export const Episode: React.FC<{data: EpisodeData}> = ({data}) => {
  const f = useCurrentFrame();
  const stories = data.segments.filter((s) => s.type === 'story').length;
  let offset = 0;
  const bounds = data.segments.map((s) => { const b = {s, from: offset, len: segFrames(s)}; offset += b.len; return b; });
  const cur = bounds.find((b) => f >= b.from && f < b.from + b.len) ?? bounds[bounds.length - 1];
  const active = cur.s.type === 'story' ? cur.s.n! : cur.s.type === 'outro' ? stories + 1 : 0;
  const progress = (f - cur.from) / cur.len;

  return (
    <AbsoluteFill style={{background: C.bg1, overflow: 'hidden'}}>
      <Background />
      <Series>
        {bounds.map(({s, len}, i) => (
          <Series.Sequence key={i} durationInFrames={len}>
            {s.audio && <Audio src={staticFile(s.audio)} />}
            {s.type === 'hook' && <Hook s={s} />}
            {s.type === 'story' && <Story s={s} frames={len} total={stories} />}
            {s.type === 'outro' && <Outro s={s} />}
            <Captions text={s.caption} frames={len} />
            {i > 0 && <Wipe />}
          </Series.Sequence>
        ))}
      </Series>
      <TopBar date={data.date} active={active} total={stories} progress={progress} />
    </AbsoluteFill>
  );
};
