// 소리: 효과음·배경음을 코드로 만들어 냄 (Web Audio — 소리 파일이 없어 가볍고, 인터넷 없이도 남)
// 배경음: 생애 단계마다 다른 곡 (아기=오르골, 학창 시절=행진곡, 어른=팝, 노년=왈츠, 결과=축하곡)
let ctx = null, bgmBus = null, sfxBus = null, noiseBuf = null;
const pref = (() => { try { return { fx: true, bgm: true, ...JSON.parse(localStorage.getItem('tlg_snd') || '{}') }; } catch { return { fx: true, bgm: true }; } })();
let policy = 'all'; // 선생님 설정: all(효과음+배경음) · sfx(효과음만) · off(끄기)
let want = null;    // 지금 화면에 맞는 배경음
let cur = null;     // 재생 중인 배경음
let paused = false; // 수업 일시정지 중
const fxOn = () => pref.fx && policy !== 'off';
const bgmOn = () => pref.bgm && policy === 'all' && !paused;

function ac() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  const comp = ctx.createDynamicsCompressor(); comp.connect(ctx.destination);
  bgmBus = ctx.createGain(); bgmBus.gain.value = 0.22; bgmBus.connect(comp);
  sfxBus = ctx.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(comp);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}
const ready = () => !!ac() && ctx.state === 'running';
// 브라우저는 사용자가 한 번 누른 뒤에야 소리를 낼 수 있음 → 처음 누를 때 깨우기
export function unlock() {
  if (!ac()) return;
  const go = () => { if (want && bgmOn() && (!cur || cur.name !== want)) startBgm(want); };
  if (ctx.state === 'suspended') ctx.resume().then(go).catch(() => {}); else go();
}
['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, unlock, { capture: true, passive: true }));
document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else ctx.resume().catch(() => {}); });

/* ───── 소리 재료 ───── */
const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function hz(n) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(n); if (!m) return 0;
  return 440 * 2 ** ((12 * (+m[3] + 1) + SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) - 69) / 12);
}
function tone(bus, t, f, dur, { type = 'square', vol = 0.3, a = 0.005, slide = 0, det = 0 } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
  if (det) o.detune.value = det;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.setValueAtTime(vol, t + Math.max(a, dur * 0.6)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.03);
}
function bell(bus, t, f, dur, vol) { // 오르골·종 소리 (배음 3개, 천천히 사라짐)
  [[1, 1], [2, 0.35], [3, 0.12]].forEach(([m, v]) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f * m;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol * v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.05);
  });
}
function noise(bus, t, dur, { vol = 0.3, type = 'highpass', f = 1000, q = 1, to = 0 } = {}) {
  const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
  if (to) fl.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(bus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.03);
}
function kick(bus, t, vol) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.2);
}

/* ═════════════ 배경음 ═════════════ */
// 악보: 16분음표 한 칸씩, '.' 쉼, '_' 앞 음 늘이기, '|' 마디 구분(무시)
const TRACKS = {
  title: { bpm: 116, parts: [ // 시작·대기실: 밝은 C장조 (C-G-Am-F)
    { i: 'lead', type: 'square', vol: 0.09, pat: 'E5 _ G5 _ C6 _ _ _ B5 _ C6 _ G5 _ _ _ | D5 _ G5 _ B5 _ _ _ A5 _ G5 _ D5 _ _ _ | C5 _ E5 _ A5 _ _ _ G5 _ A5 _ E5 _ _ _ | F5 _ A5 _ C6 _ A5 _ G5 _ _ _ . . . .' },
    { i: 'bass', vol: 0.3, pat: 'C3 _ _ . C3 _ G2 _ C3 _ _ . C3 _ G2 _ | G2 _ _ . G2 _ D3 _ G2 _ _ . G2 _ D3 _ | A2 _ _ . A2 _ E3 _ A2 _ _ . A2 _ E3 _ | F2 _ _ . F2 _ C3 _ F2 _ _ . G2 _ B2 _' },
    { i: 'arp', vol: 0.035, pat: 'C4 . E4 . G4 . E4 . C4 . E4 . G4 . E4 . | B3 . D4 . G4 . D4 . B3 . D4 . G4 . D4 . | A3 . C4 . E4 . C4 . A3 . C4 . E4 . C4 . | A3 . C4 . F4 . C4 . B3 . D4 . G4 . D4 .' },
    { i: 'drum', vol: 1, pat: 'k . h . s . h . k k h . s . h h' },
  ] },
  baby: { bpm: 88, parts: [ // 아기·어린이: 오르골 자장가 (3/4박, F장조)
    { i: 'bell', vol: 0.2, pat: 'C6 _ A5 _ F5 _ A5 _ C6 _ _ _ | Bb5 _ G5 _ E5 _ G5 _ Bb5 _ _ _ | A5 _ F5 _ D5 _ F5 _ A5 _ D6 _ | C6 _ Bb5 _ G5 _ E5 _ F5 _ _ _' },
    { i: 'bass', vol: 0.18, pat: 'F3 _ _ _ . . C4 _ . . . . | C3 _ _ _ . . G3 _ . . . . | D3 _ _ _ . . A3 _ . . . . | C3 _ _ _ . . C3 _ F3 _ _ _' },
    { i: 'bellLo', vol: 0.07, pat: '. . A4 . C5 . . . A4 . C5 . | . . G4 . Bb4 . . . G4 . Bb4 . | . . F4 . A4 . . . F4 . A4 . | . . E4 . G4 . . . A4 . C5 .' },
    { i: 'drum', vol: 0.4, pat: 'h . . . h . . . h . . .' },
  ] },
  school: { bpm: 132, parts: [ // 초·중·고: 신나는 행진곡 (G-Em-C-D)
    { i: 'lead', type: 'square', vol: 0.085, pat: 'G5 _ G5 . B5 _ D6 _ B5 _ G5 _ A5 _ B5 _ | G5 _ E5 _ . . E5 _ G5 _ B5 _ A5 _ G5 _ | E5 _ G5 _ C6 _ _ _ B5 _ A5 _ G5 _ E5 _ | F#5 _ A5 _ D6 _ _ _ C6 _ B5 _ A5 _ _ _' },
    { i: 'bass', vol: 0.28, pat: 'G2 _ . G2 D3 _ . D3 G2 _ . G2 D3 _ . D3 | E2 _ . E2 B2 _ . B2 E2 _ . E2 B2 _ . B2 | C3 _ . C3 G2 _ . G2 C3 _ . C3 G2 _ . G2 | D3 _ . D3 A2 _ . A2 D3 _ . D3 F#2 _ A2 _' },
    { i: 'arp', vol: 0.03, pat: 'G4 . B4 . D5 . B4 . G4 . B4 . D5 . B4 . | E4 . G4 . B4 . G4 . E4 . G4 . B4 . G4 . | E4 . G4 . C5 . G4 . E4 . G4 . C5 . G4 . | F#4 . A4 . D5 . A4 . F#4 . A4 . D5 . A4 .' },
    { i: 'drum', vol: 1, pat: 'k . h . s . h k k . h . s . s s' },
  ] },
  adult: { bpm: 108, parts: [ // 청년·중년: 경쾌한 팝 (Am-F-C-G)
    { i: 'lead', type: 'triangle', vol: 0.16, pat: '. . E5 _ A5 _ C6 _ B5 _ A5 _ E5 _ _ _ | . . F5 _ A5 _ C6 _ B5 _ A5 _ F5 _ _ _ | . . E5 _ G5 _ C6 _ D6 _ C6 _ G5 _ _ _ | . . D5 _ G5 _ B5 _ A5 _ G5 _ D5 _ E5 _' },
    { i: 'bass', vol: 0.3, pat: 'A2 _ . A2 . A2 E3 _ A2 _ . A2 . G2 _ . | F2 _ . F2 . F2 C3 _ F2 _ . F2 . E2 _ . | C3 _ . C3 . C3 G2 _ C3 _ . C3 . B2 _ . | G2 _ . G2 . G2 D3 _ G2 _ . G2 . B2 _ .' },
    { i: 'arp', vol: 0.03, pat: 'A4 . C5 . E5 . C5 . A4 . C5 . E5 . C5 . | F4 . A4 . C5 . A4 . F4 . A4 . C5 . A4 . | E4 . G4 . C5 . G4 . E4 . G4 . C5 . G4 . | D4 . G4 . B4 . G4 . D4 . G4 . B4 . G4 .' },
    { i: 'drum', vol: 1, pat: 'k . h . s . h k . k h . s . h .' },
  ] },
  elder: { bpm: 84, parts: [ // 황혼기: 잔잔한 왈츠 (3/4박, D장조)
    { i: 'lead', type: 'triangle', vol: 0.15, pat: 'F#5 _ _ _ _ _ E5 _ D5 _ F#5 _ | G5 _ _ _ _ _ B5 _ A5 _ G5 _ | A5 _ _ _ _ _ C#6 _ B5 _ A5 _ | D6 _ _ _ _ _ _ _ _ _ . .' },
    { i: 'bass', vol: 0.22, pat: 'D3 _ _ _ . . . . . . . . | G2 _ _ _ . . . . . . . . | A2 _ _ _ . . . . . . . . | D3 _ _ _ . . . . A2 _ _ _' },
    { i: 'bellLo', vol: 0.06, pat: '. . . . F#4 _ A4 _ F#4 _ A4 _ | . . . . G4 _ B4 _ G4 _ B4 _ | . . . . A4 _ C#5 _ A4 _ C#5 _ | . . . . F#4 _ A4 _ F#4 _ A4 _' },
  ] },
  result: { bpm: 124, parts: [ // 인생 보고서·시상식: 축하 팡파르 (C-F-G-C)
    { i: 'lead', type: 'square', vol: 0.09, pat: 'C5 _ E5 _ G5 _ C6 _ _ _ G5 _ C6 _ _ _ | A5 _ C6 _ F6 _ _ _ E6 _ D6 _ C6 _ _ _ | B5 _ D6 _ G6 _ _ _ F6 _ E6 _ D6 _ _ _ | C6 _ _ _ G5 _ E5 _ C6 _ _ _ _ _ . .' },
    { i: 'bass', vol: 0.28, pat: 'C3 _ . . C3 _ . . G2 _ . . C3 _ . . | F2 _ . . F2 _ . . C3 _ . . F2 _ . . | G2 _ . . G2 _ . . D3 _ . . G2 _ . . | C3 _ . . G2 _ . . C3 _ . . C3 _ . .' },
    { i: 'arp', vol: 0.03, pat: 'C4 . E4 . G4 . E4 . C4 . E4 . G4 . E4 . | F4 . A4 . C5 . A4 . F4 . A4 . C5 . A4 . | G4 . B4 . D5 . B4 . G4 . B4 . D5 . B4 . | C4 . E4 . G4 . E4 . C4 . E4 . G4 . E4 .' },
    { i: 'drum', vol: 1, pat: 'k . h . s . h . k . h . s . s .' },
  ] },
};
function parse(str) {
  const tk = str.replace(/\|/g, ' ').trim().split(/\s+/), by = {};
  tk.forEach((x, i) => { if (x === '.' || x === '_') return; let len = 1; while (tk[i + len] === '_') len++; (by[i] ||= []).push({ x, len }); });
  return { n: tk.length, by };
}
for (const tr of Object.values(TRACKS)) tr.parts.forEach(p => Object.assign(p, parse(p.pat)));
function playPart(p, e, t, sp, out) {
  const dur = e.len * sp;
  if (p.i === 'drum') {
    for (const ch of e.x) {
      if (ch === 'k') kick(out, t, 0.55 * p.vol);
      else if (ch === 's') { noise(out, t, 0.12, { vol: 0.22 * p.vol, f: 1800 }); tone(out, t, 190, 0.07, { type: 'triangle', vol: 0.12 * p.vol }); }
      else if (ch === 'h') noise(out, t, 0.035, { vol: 0.07 * p.vol, f: 7000 });
    }
    return;
  }
  const f = hz(e.x); if (!f) return;
  if (p.i === 'bell') bell(out, t, f, Math.max(0.7, dur * 2), p.vol);
  else if (p.i === 'bellLo') bell(out, t, f, Math.max(0.5, dur * 1.5), p.vol);
  else if (p.i === 'bass') tone(out, t, f, dur * 0.92, { type: 'triangle', vol: p.vol, a: 0.01 });
  else if (p.i === 'arp') tone(out, t, f, Math.min(dur, sp * 0.9), { type: 'square', vol: p.vol });
  else { tone(out, t, f, dur * 0.95, { type: p.type, vol: p.vol, a: 0.01 }); tone(out, t, f, dur * 0.95, { type: 'sine', vol: p.vol * 0.6, det: 7, a: 0.01 }); }
}
function startBgm(name) {
  stopBgm(0.4);
  const tr = TRACKS[name]; if (!tr || !ready()) return;
  const sp = 60 / tr.bpm / 4; // 16분음표 길이(초)
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 0.8); g.connect(bgmBus);
  const len = Math.max(...tr.parts.map(p => p.n));
  const c = cur = { name, g, step: 0, t: ctx.currentTime + 0.12 };
  c.iv = setInterval(() => {
    if (ctx.state !== 'running') return;
    if (c.t < ctx.currentTime - 0.2) c.t = ctx.currentTime + 0.05; // 멈췄다 돌아오면 밀린 음은 건너뜀
    while (c.t < ctx.currentTime + 0.25) {
      for (const p of tr.parts) for (const e of p.by[c.step % p.n] || []) playPart(p, e, c.t, sp, g);
      c.step = (c.step + 1) % len; c.t += sp;
    }
  }, 60);
}
function stopBgm(fade = 0.5) {
  if (!cur) return;
  const c = cur; cur = null; clearInterval(c.iv);
  try { c.g.gain.cancelScheduledValues(ctx.currentTime); c.g.gain.setValueAtTime(c.g.gain.value || 0.0001, ctx.currentTime); c.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + fade); } catch {}
  setTimeout(() => { try { c.g.disconnect(); } catch {} }, fade * 1000 + 300);
}
// 화면에 맞는 배경음 (같은 곡이면 그대로 이어서)
export function bgm(name) {
  want = name;
  if (!bgmOn() || !name) { stopBgm(0.6); return; }
  if (cur && cur.name === name) return;
  if (ready()) startBgm(name);
}
export const trackOfStage = k => ({ baby: 'baby', kid: 'baby', elem: 'school', mid: 'school', high: 'school', college: 'adult', young: 'adult', middle: 'adult', elder: 'elder' }[k] || 'title');

/* ═════════════ 효과음 ═════════════ */
const SFX = {
  click: t => tone(sfxBus, t, 900, 0.05, { type: 'triangle', vol: 0.07 }),
  ding: t => { bell(sfxBus, t, hz('E6'), 0.6, 0.22); bell(sfxBus, t + 0.08, hz('A6'), 0.7, 0.14); },
  step: (t, o) => tone(sfxBus, t, o.i % 2 ? 660 : 523, 0.08, { type: 'triangle', vol: 0.2, slide: 1.35 }),
  myturn: t => [hz('G5'), hz('C6'), hz('E6')].forEach((f, i) => tone(sfxBus, t + i * 0.09, f, 0.16, { type: 'triangle', vol: 0.22 })),
  coin: t => { tone(sfxBus, t, hz('B5'), 0.07, { vol: 0.14 }); tone(sfxBus, t + 0.07, hz('E6'), 0.3, { vol: 0.14 }); },
  pay: t => { for (let i = 0; i < 4; i++) SFX.coin(t + i * 0.11); noise(sfxBus, t + 0.48, 0.12, { vol: 0.14, f: 3000 }); bell(sfxBus, t + 0.52, hz('C7'), 0.7, 0.18); },
  good: t => { ['C5', 'E5', 'G5', 'C6', 'E6', 'G6'].forEach((n, i) => tone(sfxBus, t + i * 0.065, hz(n), 0.2, { vol: 0.13 })); [0, 1, 2].forEach(i => bell(sfxBus, t + 0.42 + i * 0.07, 2400 + i * 500, 0.5, 0.06)); },
  normal: t => { tone(sfxBus, t, hz('G5'), 0.14, { type: 'triangle', vol: 0.24 }); tone(sfxBus, t + 0.13, hz('C6'), 0.32, { type: 'triangle', vol: 0.24 }); },
  bad: t => ['G4', 'F#4', 'F4', 'E4'].forEach((n, i) => tone(sfxBus, t + i * 0.25, hz(n), i === 3 ? 0.75 : 0.24, { type: 'sawtooth', vol: 0.15, slide: i === 3 ? 0.88 : 1 })),
  rankup: t => { ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'].forEach((n, i) => tone(sfxBus, t + i * 0.045, hz(n), 0.09, { vol: 0.11 })); ['C6', 'E6', 'G6'].forEach(n => tone(sfxBus, t + 0.42, hz(n), 0.6, { vol: 0.08 })); },
  fanfare: t => [['G4', 0, 0.12], ['C5', 0.12, 0.12], ['E5', 0.24, 0.12], ['G5', 0.36, 0.3], ['E5', 0.7, 0.12], ['G5', 0.82, 0.7]].forEach(([n, d, l]) => { tone(sfxBus, t + d, hz(n), l, { vol: 0.13 }); tone(sfxBus, t + d, hz(n) / 2, l, { type: 'triangle', vol: 0.12 }); }),
  wedding: t => [['C5', 0], ['F5', 0.32], ['F5', 0.56], ['F5', 0.68], ['C5', 1.0], ['G5', 1.32], ['E5', 1.56], ['F5', 1.68]].forEach(([n, d]) => bell(sfxBus, t + d, hz(n), 0.9, 0.2)),
  baby: t => { [1568, 1760, 2093].forEach((f, i) => tone(sfxBus, t + i * 0.09, f, 0.11, { type: 'sine', vol: 0.18, slide: 1.2 })); [0.32, 0.46, 0.6].forEach(d => noise(sfxBus, t + d, 0.1, { vol: 0.07, type: 'bandpass', f: 5000, q: 3 })); },
  quiz: t => [['C5', 0], ['C5', 0.12], ['G5', 0.24], ['C6', 0.42]].forEach(([n, d], i) => { tone(sfxBus, t + d, hz(n), i === 3 ? 0.5 : 0.1, { vol: 0.13 }); tone(sfxBus, t + d, hz(n) * 1.5, i === 3 ? 0.5 : 0.1, { vol: 0.06 }); }),
  correct: t => { tone(sfxBus, t, hz('E6'), 0.1, { vol: 0.13 }); tone(sfxBus, t + 0.1, hz('A6'), 0.4, { vol: 0.13 }); },
  wrong: t => { tone(sfxBus, t, 150, 0.42, { type: 'sawtooth', vol: 0.16 }); tone(sfxBus, t, 157, 0.42, { type: 'sawtooth', vol: 0.12 }); },
  timer: t => noise(sfxBus, t, 0.05, { vol: 0.28, type: 'bandpass', f: 2200, q: 8 }),
  card: t => { for (let i = 0; i < 6; i++) tone(sfxBus, t + i * 0.04, 1800 + i * 260, 0.12, { type: 'sine', vol: 0.08 }); },
  horn: t => [[0, 0.13], [0.19, 0.32]].forEach(([d, l]) => { tone(sfxBus, t + d, 392, l, { vol: 0.11 }); tone(sfxBus, t + d, 494, l, { vol: 0.09 }); }),
  heart: t => [660, 880].forEach((f, i) => tone(sfxBus, t + i * 0.12, f, 0.2, { type: 'sine', vol: 0.2, slide: 1.15 })),
  notice: t => { bell(sfxBus, t, hz('E6'), 0.7, 0.22); bell(sfxBus, t + 0.25, hz('C6'), 0.9, 0.22); },
  whoosh: t => noise(sfxBus, t, 0.5, { vol: 0.16, type: 'bandpass', f: 400, to: 4000, q: 1.5 }),
  stage: t => { SFX.whoosh(t); [['C5', 0.2], ['E5', 0.32], ['G5', 0.44], ['C6', 0.56]].forEach(([n, d], i) => tone(sfxBus, t + d, hz(n), i === 3 ? 0.45 : 0.12, { type: 'triangle', vol: 0.2 })); },
  pause: t => [hz('E5'), hz('C5')].forEach((f, i) => tone(sfxBus, t + i * 0.18, f, 0.3, { type: 'sine', vol: 0.2 })),
  creditor: t => { tone(sfxBus, t, 110, 0.7, { type: 'sawtooth', vol: 0.1 }); tone(sfxBus, t, 116, 0.7, { type: 'sawtooth', vol: 0.08 }); tone(sfxBus, t + 0.35, 98, 0.6, { type: 'sawtooth', vol: 0.08 }); },
  house: t => { SFX.fanfare(t); bell(sfxBus, t + 1.0, hz('C7'), 0.8, 0.12); },
};
export function sfx(name, o = {}) { if (fxOn() && ready() && SFX[name]) SFX[name](ctx.currentTime + 0.01, o); }
// 룰렛이 도는 동안 칸을 지날 때마다 '딱딱' (화면의 회전과 같은 속도로 점점 느려짐)
export function spin(totalDeg, n, dur) {
  if (!fxOn() || !ready() || !(totalDeg > 0)) return;
  const seg = 360 / n, t0 = ctx.currentTime + 0.02;
  let last = 0, lastT = -1;
  for (let k = 1; k <= 300; k++) {
    const x = k / 300, c = Math.floor(ease(x) * totalDeg / seg);
    if (c > last && x * dur - lastT > 0.035) { last = c; lastT = x * dur; tone(sfxBus, t0 + x * dur, 1500, 0.025, { type: 'square', vol: 0.06 }); }
  }
}
function ease(x) { // CSS cubic-bezier(.17,.67,.2,1) — 룰렛 회전과 같은 곡선
  const X = u => 3 * (1 - u) ** 2 * u * 0.17 + 3 * (1 - u) * u * u * 0.2 + u ** 3, Y = u => 3 * (1 - u) ** 2 * u * 0.67 + 3 * (1 - u) * u * u + u ** 3;
  let lo = 0, hi = 1; for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; if (X(m) < x) lo = m; else hi = m; }
  return Y((lo + hi) / 2);
}

/* ═════════════ 켜기·끄기 ═════════════ */
export const state = () => ({ fx: pref.fx, bgm: pref.bgm, policy });
export const running = () => !!ctx && ctx.state === 'running'; // 실제로 소리가 나는 중 (한 번 눌러야 켜짐)
export const _dbg = () => ({ ctx, bgmBus, sfxBus }); // 개발 확인용 (소리 크기 재기)
export function toggle(k) {
  pref[k] = !pref[k];
  try { localStorage.setItem('tlg_snd', JSON.stringify(pref)); } catch {}
  if (k === 'bgm') { if (bgmOn()) { unlock(); if (want) bgm(want); } else stopBgm(0.3); }
  if (k === 'fx' && pref.fx) { unlock(); setTimeout(() => sfx('ding'), 60); }
}
export function setPolicy(p) { policy = p || 'all'; if (!bgmOn()) stopBgm(0.4); else if (want) bgm(want); }
export function pause(v) { // 수업 일시정지: 배경음 멈춤
  if (paused === v) return;
  paused = v;
  if (v) { sfx('pause'); stopBgm(0.8); } else if (want) bgm(want);
}
export function ctlHtml() {
  const lockFx = policy === 'off', lockBgm = policy !== 'all';
  const fx = pref.fx && !lockFx, bg = pref.bgm && !lockBgm;
  return `<span class="sndctl"><button class="snd ${fx ? 'on' : ''}" data-ui='{"k":"sndFx"}' title="${lockFx ? '선생님이 소리를 껐어요' : '효과음 켜기/끄기'}" ${lockFx ? 'disabled' : ''}>${fx ? '🔊' : '🔇'}</button><button class="snd ${bg ? 'on' : ''}" data-ui='{"k":"sndBgm"}' title="${lockBgm ? '선생님이 배경음을 껐어요' : '배경음 켜기/끄기'}" ${lockBgm ? 'disabled' : ''}>🎵</button></span>`;
}
export function refreshCtl() { document.querySelectorAll('.sndctl').forEach(el => { el.outerHTML = ctlHtml(); }); }
