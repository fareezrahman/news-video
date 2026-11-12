import React from 'react';
import {AbsoluteFill, Series, useCurrentFrame, interpolate, Easing} from 'remotion';
import {Background, Burst, Wipe, BounceWords, C, HEAD, BODY, useSpr} from './Episode';

export const MFPS = 30;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// ---------- Types ----------
type Move = {value: number; change: number; changePct?: number; decimals?: number; prefix?: string; suffix?: string};
type Card =
  | {type: 'index'; tag: string; title: string; move: Move; note?: string; sec?: number}
  | {type: 'fx'; tag: string; title: string; move: Move; convertLabel?: string; convertValue?: string; note?: string; sec?: number}
  | {type: 'duo'; tag: string; items: {label: string; unit: string; move: Move}[]; sec?: number}
  | {type: 'story'; tag: string; headline: string; lines: string[]; impact?: string; sec?: number};
export type MarketData = {
  id: string; date: string; brand?: string;
  hook: {kicker: string; big: string; sub: string; sec?: number};
  cards: Card[];
  outro: {question: string; sec?: number};
  sources: string[];
};

const secOf = (s?: number, d = 3.6) => Math.round((s ?? d) * MFPS);
export const marketFrames = (d: MarketData) =>
  secOf(d.hook.sec, 3) + d.cards.reduce((a, c) => a + secOf(c.sec, c.type === 'story' ? 5 : 3.6), 0) + secOf(d.outro.sec, 3.6);

const num = (v: number, dec = 2) => v.toLocaleString('en-US', {minimumFractionDigits: dec, maximumFractionDigits: dec});

// ---------- Pieces ----------
const Count: React.FC<{m: Move; start: number; size: number; color?: string}> = ({m, start, size, color = C.white}) => {
  const f = useCurrentFrame();
  const t = interpolate(f - start, [0, 22], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const from = m.value - m.change * 3;
  const v = from + (m.value - from) * t;
  return (
    <span style={{fontFamily: HEAD, fontSize: size, lineHeight: 1, color, textShadow: '0 12px 0 rgba(0,0,0,0.35)'}}>
      {m.prefix ?? ''}{num(v, m.decimals ?? 2)}{m.suffix ?? ''}
    </span>
  );
};

const ChangePill: React.FC<{m: Move; delay: number; size?: number}> = ({m, delay, size = 46}) => {
  const s = useSpr(delay, 8, 240);
  const up = m.change > 0, flat = m.change === 0;
  const col = flat ? C.dim : up ? '#2EE59D' : C.red;
  const arrow = flat ? '■' : up ? '▲' : '▼';
  const dec = m.decimals ?? 2;
  return (
    <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, background: col, color: C.ink, fontFamily: BODY, fontWeight: 900,
      fontSize: size, padding: '8px 22px', borderRadius: 14, transform: `scale(${s}) rotate(-2deg)`, boxShadow: '0 8px 0 rgba(0,0,0,0.35)'}}>
      <span>{arrow}</span>
      <span>{up ? '+' : ''}{num(m.change, dec)}{m.changePct !== undefined ? ` (${up ? '+' : ''}${num(m.changePct, 2)}%)` : ''}</span>
    </div>
  );
};

const Head: React.FC<{tag: string; title?: string}> = ({tag, title}) => {
  const f = useCurrentFrame();
  const t = useSpr(2, 8);
  const wiggle = Math.sin(f / 10) * 3;
  return (
    <div style={{position: 'absolute', top: 300, left: 70, right: 70}}>
      <div style={{display: 'inline-block', background: C.cyan, color: C.ink, fontFamily: BODY, fontWeight: 900, fontSize: 38, letterSpacing: 3,
        padding: '10px 24px', borderRadius: 10, transform: `translateX(${(1 - t) * -500}px) rotate(${-3 + wiggle * 0.5}deg)`, boxShadow: '0 6px 0 rgba(0,0,0,0.35)'}}>{tag}</div>
      {title && <div style={{marginTop: 22}}><BounceWords text={title} delay={6} size={110} color={C.white} /></div>}
    </div>
  );
};

const Panel: React.FC<{delay: number; top: number; children: React.ReactNode}> = ({delay, top, children}) => {
  const f = useCurrentFrame();
  const s = useSpr(delay, 9, 170);
  const float = Math.sin(f / 18) * 6;
  return (
    <div style={{position: 'absolute', top, left: 70, right: 70, padding: 48, borderRadius: 36, background: 'rgba(255,255,255,0.07)',
      border: '3px solid rgba(255,255,255,0.14)', boxShadow: '0 30px 60px rgba(0,0,0,0.35)', opacity: Math.min(1, s * 2),
      transform: `translateY(${(1 - s) * 400 + float}px) rotate(${(1 - s) * 6}deg)`}}>{children}</div>
  );
};

// ---------- Scenes ----------
const Hook: React.FC<{h: MarketData['hook']}> = ({h}) => {
  const f = useCurrentFrame();
  const kick = useSpr(0, 8);
  const big = useSpr(4, 7, 260);
  const shake = f > 12 && f < 22 ? Math.sin(f * 4) * (22 - f) * 2 : 0;
  const flash = interpolate(f, [12, 17], [0.5, 0], clamp);
  return (
    <AbsoluteFill style={{transform: `translateX(${shake}px) scale(${interpolate(f, [0, 120], [1, 1.1], clamp)})`}}>
      <div style={{position: 'absolute', top: 470, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <div style={{transform: `scale(${kick}) rotate(${-3 + Math.sin(f / 6) * 2}deg)`, background: C.red, color: C.white, fontFamily: BODY,
          fontWeight: 900, fontSize: 42, padding: '12px 30px', borderRadius: 12, letterSpacing: 4, boxShadow: '0 8px 0 rgba(0,0,0,0.35)'}}>● {h.kicker}</div>
      </div>
      <div style={{position: 'absolute', top: 600, left: 50, right: 50, textAlign: 'center', fontFamily: HEAD, fontSize: 230, lineHeight: 1,
        color: C.yellow, transform: `scale(${interpolate(big, [0, 1], [3, 1])})`, textShadow: '0 20px 0 rgba(0,0,0,0.35)'}}>{h.big}</div>
      <div style={{position: 'absolute', top: 1000, left: 60, right: 60}}><BounceWords text={h.sub} delay={14} size={96} color={C.white} center /></div>
      <Burst at={12} x={540} y={720} />
      <AbsoluteFill style={{background: C.white, opacity: f >= 12 ? flash : 0}} />
    </AbsoluteFill>
  );
};

const IndexScene: React.FC<{c: Extract<Card, {type: 'index' | 'fx'}>}> = ({c}) => (
  <AbsoluteFill>
    <Head tag={c.tag} title={c.title} />
    <Panel delay={10} top={760}>
      <div style={{textAlign: 'center'}}>
        <Count m={c.move} start={16} size={200} color={C.yellow} />
        <div style={{marginTop: 26}}><ChangePill m={c.move} delay={36} /></div>
        {c.type === 'fx' && c.convertLabel && (
          <div style={{marginTop: 34, fontFamily: BODY, fontWeight: 800, fontSize: 40, color: C.white}}>
            {c.convertLabel} <span style={{color: C.cyan, fontWeight: 900}}>{c.convertValue}</span>
          </div>
        )}
      </div>
    </Panel>
    {c.note && <Note text={c.note} delay={48} />}
    <Burst at={38} x={540} y={1000} color={C.cyan} />
  </AbsoluteFill>
);

const Note: React.FC<{text: string; delay: number}> = ({text, delay}) => {
  const s = useSpr(delay, 8, 260);
  const f = useCurrentFrame();
  if (f < delay) return null;
  return (
    <div style={{position: 'absolute', top: 1360, left: 70, right: 70, transformOrigin: 'left center', opacity: Math.min(1, s * 2),
      transform: `scale(${interpolate(s, [0, 1], [1.6, 1])}) rotate(${interpolate(s, [0, 1], [-8, -1.5])}deg)`}}>
      <div style={{fontFamily: BODY, fontWeight: 900, fontSize: 52, lineHeight: 1.15, color: C.white}}>{text}</div>
    </div>
  );
};

const DuoScene: React.FC<{c: Extract<Card, {type: 'duo'}>}> = ({c}) => (
  <AbsoluteFill>
    <Head tag={c.tag} />
    {c.items.map((it, i) => (
      <Panel key={i} delay={6 + i * 10} top={440 + i * 480}>
        <div style={{fontFamily: BODY, fontWeight: 900, fontSize: 44, color: C.white, letterSpacing: 2}}>{it.label}</div>
        <div style={{display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: 10}}>
          <Count m={it.move} start={14 + i * 10} size={150} color={C.yellow} />
          <span style={{fontFamily: BODY, fontWeight: 800, fontSize: 34, color: C.dim, paddingBottom: 18}}>{it.unit}</span>
        </div>
        <div style={{marginTop: 18}}><ChangePill m={it.move} delay={32 + i * 10} size={40} /></div>
      </Panel>
    ))}
  </AbsoluteFill>
);

const StoryScene: React.FC<{c: Extract<Card, {type: 'story'}>; frames: number}> = ({c, frames}) => {
  const f = useCurrentFrame();
  const impactAt = Math.round(frames * 0.55);
  const s = useSpr(impactAt, 8, 260);
  return (
    <AbsoluteFill>
      <Head tag={c.tag} />
      <div style={{position: 'absolute', top: 420, left: 70, right: 70}}><BounceWords text={c.headline} delay={6} size={100} color={C.white} /></div>
      <div style={{position: 'absolute', top: 820, left: 70, right: 70}}>
        {c.lines.map((l, i) => {
          const t = interpolate(f - 20 - i * 10, [0, 10], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.8))});
          return (
            <div key={i} style={{display: 'flex', gap: 18, alignItems: 'flex-start', marginTop: 22, opacity: t, transform: `translateX(${(1 - t) * 120}px)`}}>
              <div style={{width: 22, height: 22, borderRadius: 11, background: C.yellow, marginTop: 18, flexShrink: 0}} />
              <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 48, lineHeight: 1.2, color: C.white}}>{l}</div>
            </div>
          );
        })}
      </div>
      {c.impact && f >= impactAt && (
        <div style={{position: 'absolute', top: 1330, left: 70, right: 70, transformOrigin: 'left center', opacity: Math.min(1, s * 2),
          transform: `scale(${interpolate(s, [0, 1], [1.8, 1])}) rotate(${interpolate(s, [0, 1], [-10, -1.5])}deg)`}}>
          <div style={{display: 'inline-block', background: C.red, color: C.white, fontFamily: BODY, fontWeight: 900, fontSize: 32, letterSpacing: 2,
            padding: '8px 18px', borderRadius: 8, boxShadow: '0 6px 0 rgba(0,0,0,0.35)'}}>MAKSUDNYA UNTUK KORANG</div>
          <div style={{fontFamily: BODY, fontWeight: 900, fontSize: 50, color: C.white, marginTop: 10, lineHeight: 1.15}}>{c.impact}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const Outro: React.FC<{o: MarketData['outro']}> = ({o}) => {
  const f = useCurrentFrame();
  const lbl = useSpr(0, 9);
  const btn = useSpr(24, 7, 240);
  const tapAt = 44, tap = f - tapAt;
  const followed = tap >= 3;
  const cursorY = interpolate(f, [28, tapAt], [1500, 1150], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 440, width: '100%', textAlign: 'center'}}>
        <span style={{display: 'inline-block', fontFamily: BODY, fontWeight: 900, fontSize: 40, letterSpacing: 4, color: C.ink, background: C.cyan,
          padding: '8px 22px', borderRadius: 10, transform: `scale(${lbl}) rotate(-2deg)`}}>SOALAN HARI NI</span>
      </div>
      <div style={{position: 'absolute', top: 540, left: 60, right: 60}}><BounceWords text={o.question} delay={4} size={130} color={C.yellow} center step={4} /></div>
      <div style={{position: 'absolute', top: 1100, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <div style={{transform: `scale(${btn * (1 + Math.sin(f / 4) * 0.05) * (tap >= 0 && tap < 6 ? 0.9 : 1)})`, background: followed ? C.white : C.red,
          color: followed ? C.ink : C.white, fontFamily: HEAD, fontSize: 84, padding: '18px 64px', borderRadius: 999, boxShadow: '0 10px 0 rgba(0,0,0,0.35)'}}>
          {followed ? '✓ FOLLOWING' : '+ FOLLOW'}
        </div>
      </div>
      {f > 28 && f < tapAt + 20 && (
        <div style={{position: 'absolute', left: 640, top: cursorY, width: 70, height: 70, borderRadius: 35, background: 'rgba(255,255,255,0.9)',
          border: `6px solid ${C.ink}`, opacity: interpolate(f, [tapAt + 8, tapAt + 20], [1, 0], clamp)}} />
      )}
      <Burst at={tapAt} x={540} y={1170} />
    </AbsoluteFill>
  );
};

// ---------- Top bar + disclaimer ----------
const Top: React.FC<{date: string; brand: string; progress: number}> = ({date, brand, progress}) => {
  const f = useCurrentFrame();
  const bob = Math.sin(f / 8) * 3;
  return (
    <div style={{position: 'absolute', top: 100, left: 70, right: 70}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
          <span style={{fontFamily: HEAD, fontSize: 64, background: C.yellow, color: C.ink, padding: '0 18px', borderRadius: 12, letterSpacing: 2,
            display: 'inline-block', transform: `rotate(${-3 + bob}deg) translateY(${bob}px)`}}>{brand}</span>
          <span style={{fontFamily: HEAD, fontSize: 44, color: C.cyan, letterSpacing: 2}}>PASARAN</span>
        </div>
        <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 28, color: C.dim, letterSpacing: 2}}>{date}</div>
      </div>
      <div style={{height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.15)', overflow: 'hidden', marginTop: 26}}>
        <div style={{width: `${progress * 100}%`, height: '100%', background: `linear-gradient(90deg, ${C.cyan}, ${C.yellow})`}} />
      </div>
    </div>
  );
};

export const Market: React.FC<{data: MarketData}> = ({data}) => {
  const f = useCurrentFrame();
  const total = marketFrames(data);
  const scenes: {len: number; el: React.ReactNode}[] = [
    {len: secOf(data.hook.sec, 3), el: <Hook h={data.hook} />},
    ...data.cards.map((c) => {
      const len = secOf(c.sec, c.type === 'story' ? 5 : 3.6);
      const el = c.type === 'duo' ? <DuoScene c={c} /> : c.type === 'story' ? <StoryScene c={c} frames={len} /> : <IndexScene c={c} />;
      return {len, el};
    }),
    {len: secOf(data.outro.sec, 3.6), el: <Outro o={data.outro} />},
  ];
  return (
    <AbsoluteFill style={{background: C.bg1, overflow: 'hidden'}}>
      <Background />
      <Series>
        {scenes.map((s, i) => (
          <Series.Sequence key={i} durationInFrames={s.len}>
            {s.el}
            {i > 0 && <Wipe />}
          </Series.Sequence>
        ))}
      </Series>
      <Top date={data.date} brand={data.brand ?? 'GLANCE'} progress={f / total} />
      <div style={{position: 'absolute', bottom: 330, width: '100%', textAlign: 'center', fontFamily: BODY, fontWeight: 700, fontSize: 26,
        color: 'rgba(255,255,255,0.55)', letterSpacing: 1}}>Bukan nasihat pelaburan · Sumber: {data.sources.join(', ')}</div>
    </AbsoluteFill>
  );
};
