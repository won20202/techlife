// 기술인생게임 엔진 — DOM 없이 돌아가는 순수 규칙.
// 상태(S) + 행동(action) → 상태. 화면·온라인·시뮬레이션이 모두 이 파일을 같이 쓴다.
// 진행 방식: S.tasks(할 일 줄)를 차례로 처리하다가 사람의 입력이 필요하면 S.pending에 멈춘다.
import * as C from './data/config.js';
import { JOBS, TITLES } from './data/jobs.js';
import { EVENTS, JOB_EVENTS, EXP_EVENTS } from './data/events.js';
import { QUIZ } from './data/quiz.js';

/* ───────── 난수 (상태 안에 저장 → 온라인에서도 같은 결과) ───────── */
function rnd(S) {
  let t = (S.rng = (S.rng + 0x6D2B79F5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const ri = (S, a, b) => a + Math.floor(rnd(S) * (b - a + 1));
const pick = (S, arr) => arr[Math.floor(rnd(S) * arr.length)];
function shuffle(S, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd(S) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ───────── 작은 도우미 ───────── */
export const jobOf = p => (p.job && p.job.id != null ? JOBS[p.job.id] : null);
export const grade = (p, s) => Math.min(6, Math.floor(p.stats[s] / C.GAUGE_PER_GRADE));
export const stageKey = S => C.STAGES[S.stage].k;
const isAdultStage = S => C.STAGES[S.stage].adult;
const others = (S, p) => S.players.filter(q => q.id !== p.id);
const P = (S, pid) => S.players[pid];

export function money(v) { // 만 원 → "1억 2,300만"
  const neg = v < 0; v = Math.abs(Math.round(v));
  const eok = Math.floor(v / 10000), man = v % 10000;
  let s = eok ? `${eok.toLocaleString()}억${man ? ' ' + man.toLocaleString() + '만' : ''}` : `${man.toLocaleString()}만`;
  if (v === 0) s = '0';
  return (neg ? '−' : '') + s + '원';
}

export function jobTitle(p) {
  if (p.retired) return '은퇴';
  if (p.student) return p.edu === 2 ? '대학생' : '전문대생';
  if (!p.job) return '';
  if (p.job.free) return `프리랜서 · ${TITLES['프리랜서'][p.job.rank - 1]}`;
  const j = jobOf(p);
  return `${j.name} · ${TITLES[j.titles][p.job.rank - 1]}`;
}

/* ───────── 로그 (화면 연출용) ───────── */
function log(S, e) { e.seq = ++S.seq; S.log.push(e); if (S.log.length > 300) S.log.shift(); }
function toast(S, pid, text, icon = '') { log(S, { k: 'toast', pid, text, icon }); }

/* ───────── 할 일 줄 ───────── */
const front = (S, ...ts) => S.tasks.unshift(...ts);
const back = (S, ...ts) => S.tasks.push(...ts);
// n: 대기 화면 번호 — 온라인에서 이미 지나간 화면에 늦게 온 입력을 버리는 데 씀
const wait = (S, type, pid, data = {}) => { S.pending = { type, pid, ...data, n: (S.pn = (S.pn || 0) + 1) }; };
function news(S, pid, text) { log(S, { k: 'news', pid, text }); } // TV 화면 사건 소식

/* ═════════════ 새 게임 ═════════════ */
export function newGame(opt) {
  const S = {
    v: 1, seq: 0, log: [], tasks: [], pending: null, over: false,
    rng: (opt.seed ?? Date.now()) | 0, mode: opt.mode,
    settings: { quiz: true, ...(opt.settings || {}) },
    turns: C.MODES[opt.mode].turns.slice(),
    round: 0, stageRound: 0, cur: 0, stage: 0,
    market: { houses: {}, cars: {} }, npcs: [], results: null,
  };
  S.stage = S.turns.findIndex(t => t > 0);
  S.board = buildBoard(S);
  S.npcs = makeNpcs(S);
  S.players = opt.players.map((o, i) => newPlayer(S, o, i));
  log(S, { k: 'stage', stage: S.stage });
  if (opt.mode === 'career' || opt.mode === 'careerShort') {
    S.players.forEach(p => back(S, { t: 'careerSetup', pid: p.id }));
    S.players.forEach(p => back(S, { t: 'gate', pid: p.id, kind: 'career' }));
    back(S, { t: 'stageStart', stage: S.stage, first: true });
  } else {
    S.players.forEach(p => back(S, { t: 'talent', pid: p.id }));
    back(S, { t: 'turn' });
  }
  run(S);
  return S;
}

function newPlayer(S, o, i) {
  return {
    id: i, name: o.name, gender: o.gender || 'm', look: o.look || {}, isCom: !!o.isCom, sid: o.sid || null,
    pos: S.board.stageStart[S.stage], money: 100, debt: 0,
    stats: { int: 10, str: 10, sen: 10 }, talent: null, luck: 2,
    tags: Object.fromEntries(C.TAGS.map(t => [t, 0])),
    green: 0, happy: 50, cards: [], charm: 0, force: null,
    club: null, school: null, edu: null, dept: null, student: false,
    job: null, retired: false, hist: [], awards: [],
    contacts: [], spouse: null, kids: [],
    house: { k: 'room', value: 0, smart: false }, car: null, insurance: {},
    stocks: [], patents: 0, souvenirs: [],
    waiting: false, goalRank: 0, seen: {}, greenLevel: 0,
  };
}

function makeNpcs(S) {
  const list = [];
  ['m', 'f'].forEach(g => { // 두 성별 모두 (게임 중에 학생이 COM 자리를 이어받아도 만날 사람이 있게)
    shuffle(S, C.NPC_NAMES[g]).slice(0, 12).forEach(name => {
      const j = pick(S, JOBS);
      list.push({ id: list.length, name, gender: g, jobId: j.id, rank: ri(S, 1, 4), taste: pick(S, C.TASTES).k,
                  tag: j.tags[0] || pick(S, C.TAGS), married: null, look: randomLook(S, g) });
    });
  });
  return list;
}
export function randomLook(S, g) {
  return { skin: ri(S, 0, 3), hair: ri(S, 0, 4), hairColor: ri(S, 0, 5), outfit: ri(S, 0, 5), item: null };
}

/* ═════════════ 지도 만들기 ═════════════ */
function buildBoard(S) {
  const cells = [], stageStart = [], gate = [];
  const add = (type, stage, extra = {}) => { const c = { id: cells.length, type, stage, next: [], ...extra }; cells.push(c); return c; };
  const link = (a, b) => { a.next.push(b.id); };
  let prev = null;
  C.STAGES.forEach((st, si) => {
    const turns = S.turns[si];
    if (!turns) { stageStart.push(null); gate.push(null); return; }
    const per = st.adult ? C.CELLS_PER_TURN.adult : C.CELLS_PER_TURN.child;
    const n = Math.max(10, turns * per);
    const start = add('start', si); stageStart.push(start.id);
    if (prev) link(prev, start);
    prev = start;
    // 바탕 칸 순서 만들기
    const mix = C.CELL_MIX[st.k];
    const types = [];
    const bag = Object.entries(mix);
    const total = bag.reduce((s, [, w]) => s + w, 0);
    for (let i = 0; i < n; i++) {
      let r = rnd(S) * total, t = 'normal';
      for (const [k, w] of bag) { if ((r -= w) < 0) { t = k; break; } }
      if (t === 'quiz' && !S.settings.quiz) t = 'normal';
      types.push(t);
    }
    const branchAt = st.adult && n > 24 ? Math.floor(n * 0.45) : -1;
    const inBranch = i => branchAt >= 0 && i >= branchAt && i <= branchAt + 6;
    // 어른 단계: 월급날 6칸마다, 상점 12칸마다, 집 장만 멈춤 칸
    if (st.adult) {
      for (let i = 3; i < n; i += 6) types[i] = 'payday';
      for (let i = 8; i < n; i += 12) if (types[i] !== 'payday') types[i] = 'shop';
      const houseCount = { college: 0, young: 1, middle: 2, elder: 1 }[st.k];
      for (let h = 0; h < houseCount; h++) {
        let at = Math.floor(n * (h + 1) / (houseCount + 1));
        while (inBranch(at) || types[at] === 'payday') at++;
        types[at] = 'house';
      }
    }
    // 같은 종류가 3번 이상 이어지지 않게 섞기
    for (let i = 2; i < n; i++) if (types[i] === types[i - 1] && types[i] === types[i - 2] && !['normal', 'payday', 'house'].includes(types[i])) types[i] = 'normal';
    // 갈림길 (어른 단계에 하나씩)
    for (let i = 0; i < n; i++) {
      if (i === branchAt) {
        const b = add('branch', si); link(prev, b);
        const lanes = st.k === 'young' || st.k === 'college'
          ? [{ name: '일 집중 길', mix: ['job', 'normal', 'job', 'lucky', 'job', 'payday'] }, { name: '가족 집중 길', mix: ['love', 'normal', 'love', 'lucky', 'love', 'normal'] }]
          : [{ name: '안전한 길', mix: ['normal', 'lucky', 'normal', 'normal', 'lucky', 'normal'] }, { name: '모험의 길', mix: ['verylucky', 'unlucky', 'lucky', 'unlucky', 'verylucky', 'unlucky'] }];
        b.lanes = lanes.map(l => l.name);
        const ends = lanes.map((l, li) => {
          let lp = b;
          l.mix.forEach(t => { const c = add(t, si, { lane: li }); link(lp, c); lp = c; });
          return lp;
        });
        const join = add('normal', si); ends.forEach(e => link(e, join));
        prev = join; i += 6; continue;
      }
      const c = add(types[i], si); link(prev, c); prev = c;
    }
    const last = si === C.STAGES.length - 1 || !S.turns.slice(si + 1).some(t => t > 0);
    const g = add(last ? 'goal' : 'gate', si); link(prev, g); gate.push(g.id); prev = g;
  });
  return { cells, stageStart, gate };
}

/* ═════════════ 진행 루프 ═════════════ */
export function run(S) {
  let guard = 0;
  while (!S.pending && S.tasks.length && !S.over) {
    if (++guard > 5000) throw new Error('task loop');
    const t = S.tasks.shift();
    const h = TASK[t.t];
    if (!h) throw new Error('unknown task ' + t.t);
    h(S, t);
  }
  return S;
}

export function act(S, a) {
  if (a.sys) { if (SYS[a.sys] && !S.over) SYS[a.sys](S, a); return run(S); } // 교사 명령
  const pd = S.pending;
  if (!pd) return S;
  const r = RESOLVE[pd.type];
  if (!r) throw new Error('no resolver ' + pd.type);
  if (a.n != null && pd.n != null && a.n !== pd.n) return S; // 이미 지나간 화면에 대한 입력
  if (pd.pid != null && a.pid != null && a.pid !== pd.pid && pd.type !== 'quiz') return S; // 내 차례 아님
  r(S, a, pd);
  return run(S);
}

/* ═════════════ 할 일 처리기 ═════════════ */
const TASK = {};
const RESOLVE = {};

// 아기: 재능 룰렛
TASK.talent = (S, t) => {
  const p = P(S, t.pid);
  wait(S, 'wheel', p.id, { purpose: 'talent', title: `${p.name}의 재능 룰렛!`, labels: ['🧠 지력', '💪 체력', '✨ 센스'] });
};
// 공용 바퀴(숫자·종류 고르기용)
RESOLVE.wheel = (S, a, pd) => {
  const idx = Math.floor(rnd(S) * pd.labels.length);
  log(S, { k: 'wheel', pid: pd.pid, labels: pd.labels, idx, title: pd.title });
  S.pending = null;
  WHEEL_DONE[pd.purpose](S, pd, idx);
};
const WHEEL_DONE = {};
WHEEL_DONE.talent = (S, pd, idx) => {
  const p = P(S, pd.pid);
  p.talent = ['int', 'str', 'sen'][idx];
  p.stats[p.talent] += 10;
  ack(S, p.id, '재능을 받았어요!', [`${C.STATS[p.talent]}이(가) 다른 능력치보다 더 잘 자라요`], { bg: 'nursery' });
};

// 커리어 모드 시작 설정
TASK.careerSetup = (S, t) => {
  const p = P(S, t.pid);
  p.stats = { int: 40, str: 40, sen: 40 };
  wait(S, 'careerSetup', p.id, { step: 'talent' });
};
RESOLVE.careerSetup = (S, a, pd) => {
  const p = P(S, pd.pid);
  if (pd.step === 'talent') { p.talent = a.talent; p.stats[a.talent] = 60; wait(S, 'careerSetup', p.id, { step: 'school' }); return; }
  if (pd.step === 'school') {
    p.school = a.school;
    wait(S, 'careerSetup', p.id, { step: 'tags', count: 2 }); return;
  }
  if (pd.step === 'tags') {
    (a.tags || []).slice(0, 2).forEach(tg => { p.tags[tg] += 1; });
    p.hist.push(`${C.HIGH_SCHOOLS.find(h => h.k === p.school).name} 졸업`);
    S.pending = null;
  }
};

/* ───── 한 사람의 차례 ───── */
TASK.turn = (S) => {
  const p = S.players[S.cur];
  if (p.goalRank) { // 먼저 골인: 어른은 노후 룰렛, 학생(성장 모드)은 졸업 준비
    if (isAdultStage(S)) {
      const v = pick(S, [300, 500, 1000, 2000, 5000]);
      p.money += v;
      toast(S, p.id, `🏖️ 노후 룰렛 +${money(v)}`);
    } else {
      const s = pick(S, ['int', 'str', 'sen']);
      addStat(p, s, 3);
      toast(S, p.id, `🎓 졸업 준비! ${C.STATS[s]} +3`);
    }
    back(S, { t: 'endTurn' }); return;
  }
  if (p.waiting) { // 단계 문 앞 보너스 활동
    const s = pick(S, ['int', 'str', 'sen']);
    addStat(p, s, 5);
    toast(S, p.id, `🚪 문 앞에서 기다리며 연습! ${C.STATS[s]} +5`);
    back(S, { t: 'endTurn' }); return;
  }
  log(S, { k: 'turn', pid: p.id });
  wait(S, 'preSpin', p.id);
};

RESOLVE.preSpin = (S, a, pd) => {
  const p = P(S, pd.pid);
  if (a.a === 'card') { useCard(S, p, a.i, a.value); return; }
  if (a.a !== 'spin') return;
  S.pending = null;
  let v;
  if (p.force) {
    v = p.force.fixed ?? ri(S, p.force.min, p.force.max);
    p.force = null;
  } else v = ri(S, 1, 10);
  log(S, { k: 'spin', pid: p.id, value: v });
  const car = p.car && C.CARS.find(c => c.k === p.car);
  if (car && isAdultStage(S)) {
    const opts = [...new Set(car.move.map(d => v + d).filter(n => n >= 1))];
    const info = opts.map(n => ({ steps: n, type: peekCell(S, p, n) }));
    if (new Set(info.map(o => o.type)).size > 1) { wait(S, 'carPick', p.id, { options: info, rolled: v }); return; }
  }
  front(S, { t: 'move', pid: p.id, steps: v });
};
RESOLVE.carPick = (S, a, pd) => {
  S.pending = null;
  const steps = pd.options.some(o => o.steps === a.steps) ? a.steps : pd.options[0].steps;
  if (steps !== pd.rolled) toast(S, pd.pid, `🚗 차로 ${steps > pd.rolled ? '+1' : '−1'}칸 조절!`);
  front(S, { t: 'move', pid: pd.pid, steps });
};

function peekCell(S, p, n) { // 갈림길 앞에서는 첫 길 기준으로 미리 보기
  let id = p.pos;
  for (let i = 0; i < n; i++) {
    const c = S.board.cells[id];
    if (!c.next.length || c.type === 'gate' || c.type === 'goal') break;
    id = c.next[0];
    const nc = S.board.cells[id];
    if (['gate', 'goal', 'house'].includes(nc.type)) break;
  }
  return S.board.cells[id].type;
}

function useCard(S, p, i, value) {
  const c = p.cards[i];
  if (!c) return;
  const info = C.CARDS[c];
  if (c === 'small') p.force = { min: 1, max: 3 };
  else if (c === 'big') p.force = { min: 8, max: 10 };
  else if (c === 'five') p.force = { fixed: 5 };
  else if (c === 'pick') p.force = { fixed: clamp(value | 0 || 5, 1, 10) };
  else if (c === 'charm') p.charm = 2;
  else if (c === 'date') {
    if (!isAdultStage(S) || (!p.spouse && !p.contacts.length)) { toast(S, p.id, '💌 데이트할 사람이 아직 없어요'); return; }
    p.cards.splice(i, 1);
    toast(S, p.id, `${info.icon} ${info.name} 사용!`);
    const keep = S.pending; S.pending = null;
    front(S, { t: 'love', pid: p.id, viaTicket: true }, { t: 'resume', pending: keep });
    return;
  } else if (c === 'int' || c === 'str' || c === 'sen') { addStat(p, c, 15); }
  p.cards.splice(i, 1);
  toast(S, p.id, `${info.icon} ${info.name} 사용!`);
}
TASK.resume = (S, t) => { S.pending = { ...t.pending, n: (S.pn = (S.pn || 0) + 1) }; };

/* ───── 이동 ───── */
TASK.move = (S, t) => {
  const p = P(S, t.pid);
  const path = [];
  let left = t.steps;
  while (left > 0) {
    const c = S.board.cells[p.pos];
    if (!c.next.length || c.type === 'goal') break;
    let nextId;
    if (c.next.length > 1) {
      if (t.lane == null) {
        if (path.length) log(S, { k: 'move', pid: p.id, path: path.slice() });
        wait(S, 'branch', p.id, { lanes: c.lanes, left }); return;
      }
      nextId = c.next[t.lane]; t.lane = null;
    } else nextId = c.next[0];
    p.pos = nextId; path.push(nextId); left--;
    const nc = S.board.cells[nextId];
    if (['gate', 'goal', 'house'].includes(nc.type)) { left = 0; break; }
    if (left > 0) {
      if (nc.type === 'payday') { log(S, { k: 'move', pid: p.id, path: path.slice() }); front(S, { t: 'payday', pid: p.id, exact: false }, { t: 'move', pid: p.id, steps: left }); return; }
      if (nc.type === 'allowance') { p.money += C.COST.allowance * 10; toast(S, p.id, `🪙 용돈 +${money(C.COST.allowance * 10)}`); }
      if (nc.type === 'shop' && canShop(S, p)) { log(S, { k: 'move', pid: p.id, path: path.slice() }); front(S, { t: 'shopAsk', pid: p.id }, { t: 'move', pid: p.id, steps: left }); return; }
    }
  }
  if (path.length) log(S, { k: 'move', pid: p.id, path });
  front(S, { t: 'land', pid: p.id });
};
RESOLVE.branch = (S, a, pd) => {
  S.pending = null;
  const lane = a.lane === 1 ? 1 : 0;
  toast(S, pd.pid, `🔀 ${pd.lanes[lane]}(으)로!`);
  front(S, { t: 'move', pid: pd.pid, steps: pd.left, lane });
};

/* ───── 칸 도착 ───── */
TASK.land = (S, t) => {
  const p = P(S, t.pid);
  const c = S.board.cells[p.pos];
  log(S, { k: 'land', pid: p.id, cell: c.id, type: c.type });
  back_after(S, p);
  const sk = stageKey(S);
  switch (c.type) {
    case 'payday': front(S, { t: 'payday', pid: p.id, exact: true }); break;
    case 'shop': front(S, { t: 'shop', pid: p.id, exact: true }); break;
    case 'allowance': p.money += C.COST.allowance * 20; ack(S, p.id, '🪙 용돈 받는 날!', [`딱 멈춰서 두 배! +${money(C.COST.allowance * 20)}`], { bg: 'home' }); break;
    case 'exp': front(S, { t: 'exp', pid: p.id }); break;
    case 'contest': front(S, { t: 'contest', pid: p.id }); break;
    case 'quiz': front(S, { t: 'quizSolo', pid: p.id }); break;
    case 'love': front(S, isAdultStage(S) ? { t: 'love', pid: p.id, cell: true } : { t: 'event', pid: p.id, cell: 'normal' }); break;
    case 'job': front(S, p.job && !p.retired ? { t: 'jobFate', pid: p.id } : { t: 'event', pid: p.id, cell: 'normal' }); break;
    case 'stock': front(S, { t: 'stock', pid: p.id }); break;
    case 'house': front(S, { t: 'houseCell', pid: p.id }); break;
    case 'reverse': front(S, { t: 'reverse', pid: p.id }); break;
    case 'patent': front(S, { t: 'patentPay', pid: p.id, owner: c.owner }, { t: 'event', pid: p.id, cell: 'normal' }); break;
    case 'gate': p.waiting = true; ack(S, p.id, '🚪 단계 문에 도착!', ['다른 친구들을 기다리는 동안 남은 차례마다 보너스 연습을 해요'], { bg: 'gate' }); break;
    case 'goal': front(S, { t: 'goal', pid: p.id }); break;
    case 'start': case 'branch': break;
    default: front(S, { t: 'event', pid: p.id, cell: c.type }); // normal, lucky, verylucky, unlucky
  }
  void sk;
};
// 칸 처리 뒤에: 같은 칸 퀴즈쇼 → 차례 끝
function back_after(S, p) {
  const at = S.tasks.findIndex(x => x.t === 'endTurn');
  if (at === -1) S.tasks.push({ t: 'sameCell', pid: p.id }, { t: 'endTurn' });
}

TASK.endTurn = (S) => {
  const me = S.players[S.cur];
  kidsTick(S, me);
  growTick(S, me);
  S.cur++;
  if (S.cur >= S.players.length) {
    S.cur = 0; S.round++; S.stageRound++;
    if (S.wrap) { back(S, { t: 'wrapEnd' }); return; }
    if (S.stageRound >= S.turns[S.stage]) { back(S, { t: 'stageEnd' }); return; }
  }
  back(S, { t: 'turn' });
};
// 교사 "마무리하기": 이번 바퀴가 끝나면 → 어른은 은퇴 정산 → 결과
TASK.wrapEnd = (S) => {
  log(S, { k: 'notice', text: '🏁 마무리! 결승 정산을 해요' });
  if (isAdultStage(S)) S.players.forEach(p => { if (p.job && !p.retired && !p.goalRank) back(S, { t: 'retire', pid: p.id }); });
  back(S, { t: 'gameEnd' });
};

/* ───── 교사 명령 (온라인 수업) ───── */
const SYS = {};
SYS.wrap = (S) => {
  if (S.wrap) return;
  S.wrap = true;
  log(S, { k: 'notice', text: '⏰ 마무리 시간! 이번 바퀴가 끝나면 결승 정산을 해요' });
};
SYS.surprise = (S, a) => {
  const sp = C.SURPRISES.find(x => x.k === a.k); if (!sp) return;
  const adult = isAdultStage(S);
  log(S, { k: 'notice', text: `${sp.icon} 깜짝 이벤트: ${sp.name}! ${sp.desc}` });
  S.players.forEach(p => {
    const top = C.TAGS.slice().sort((x, y) => p.tags[y] - p.tags[x])[0];
    const fx = {
      innov: { tag: { [p.tags[top] ? top : pick(S, C.TAGS)]: 1 }, sen: 5 },
      invent: { tag: { 발명: 1 }, int: 5 },
      safety: { str: 6, happy: 5 },
      earth: { green: 1, happy: 3 },
      bonus: adult ? { money: Math.max(300, Math.round(salaryOf(S, p) * 0.1)) } : { money: 10, anyStat: 5 },
      luck: { luck: 1 },
    }[sp.k];
    const lines = applyFx(S, p, fx);
    if (lines.length) toast(S, p.id, `${sp.icon} ${p.name}: ${lines.join(' · ')}`);
  });
};
// 늦게 온 학생이 COM 자리를 이어받음 / 학생이 빠진 자리를 COM이 맡음
SYS.seat = (S, a) => {
  const p = S.players[a.pid]; if (!p) return;
  p.isCom = false; p.sid = a.sid || null; p.name = String(a.name || p.name).slice(0, 6);
  if (a.look) p.look = a.look;
  if (a.gender && a.gender !== p.gender && p.spouse == null) { p.gender = a.gender; p.contacts = []; }
  log(S, { k: 'notice', text: `🙌 ${p.name}이(가) ${a.pid + 1}번 자리를 이어받았어요` });
};
SYS.com = (S, a) => {
  const p = S.players[a.pid]; if (!p || p.isCom) return;
  p.isCom = true; p.sid = null;
  log(S, { k: 'notice', text: `🤖 ${p.name}의 자리는 이제 COM이 이어서 해요` });
};

// 학창 시절: 나이 들며 조금씩 + 집중 활동(동아리)만큼 더 자람
function growTick(S, p) {
  if (S.stage > 4) return;
  const base = S.stage <= 1 ? 1 : 2;
  ['int', 'str', 'sen'].forEach(s => addStat(p, s, base));
  const club = C.CLUBS.find(c => c.k === p.club);
  if (club) for (const [s, v] of Object.entries(club.gain)) addStat(p, s, v);
}

/* ───── 단계 끝 → 문 → 다음 단계 ───── */
TASK.stageEnd = (S) => {
  const g = S.board.gate[S.stage];
  const kind = { baby: 'grow', kid: 'club', elem: 'club', mid: 'highSchool', high: 'career', college: 'firstJob', young: 'grow', middle: 'retire', elder: 'end' }[stageKey(S)];
  const last = !S.turns.slice(S.stage + 1).some(t => t > 0);
  if (last) { S.players.forEach(p => { if (!p.goalRank) p.pos = g; }); back(S, { t: 'gameEnd' }); return; }
  S.players.forEach(p => {
    if (p.pos !== g) { p.pos = g; log(S, { k: 'jump', pid: p.id, cell: g }); }
    p.waiting = false;
  });
  log(S, { k: 'gateAll', stage: S.stage });
  S.players.forEach(p => back(S, { t: 'gate', pid: p.id, kind }));
  back(S, { t: 'stageStart', stage: S.turns.findIndex((t, i) => i > S.stage && t > 0) });
};

TASK.stageStart = (S, t) => {
  S.stage = t.stage; S.stageRound = 0; S.cur = 0;
  S.players.forEach(p => { p.pos = S.board.stageStart[S.stage]; p.waiting = false; });
  log(S, { k: 'stage', stage: S.stage });
  // 대학·취업 준비 단계: 바로 취업한 사람은 직장 생활
  back(S, { t: 'turn' });
};

TASK.gate = (S, t) => {
  const p = P(S, t.pid);
  switch (t.kind) {
    case 'grow': ack(S, p.id, `🌱 ${p.name}이(가) 쑥! 자랐어요`, [`이제 ${C.STAGES[S.turns.findIndex((x, i) => i > S.stage && x > 0)].name}!`], { bg: 'gate', grow: true }); break;
    case 'club': wait(S, 'pickClub', p.id, { title: S.stage <= 1 ? '초등학교 입학! 무엇에 집중할까?' : '중학교 입학! 무엇에 집중할까?' }); break;
    case 'highSchool': wait(S, 'pickSchool', p.id); break;
    case 'career': wait(S, 'pickCareer', p.id); break;
    case 'firstJob': if (p.student) front(S, { t: 'jobPick', pid: p.id, first: true }); break;
    case 'retire': front(S, { t: 'retire', pid: p.id }); break;
  }
};

RESOLVE.pickClub = (S, a, pd) => {
  const p = P(S, pd.pid);
  const club = C.CLUBS.find(c => c.k === a.club) || C.CLUBS[0];
  p.club = club.k;
  if (club.tag) p.tags[club.tag] += 1;
  p.hist.push(club.name);
  S.pending = null;
  toast(S, p.id, `${club.icon} ${club.name}에 집중!`);
};
RESOLVE.pickSchool = (S, a, pd) => {
  const p = P(S, pd.pid);
  const sc = C.HIGH_SCHOOLS.find(h => h.k === a.school) || C.HIGH_SCHOOLS[0];
  p.school = sc.k;
  for (const [s, v] of Object.entries(sc.gain)) addStat(p, s, v);
  p.hist.push(sc.name);
  S.pending = null;
  if (sc.tags) { p.schoolTagCount = sc.tags; wait(S, 'pickTag', p.id, { title: `${sc.name}! 어느 분야를 배울까?`, purpose: 'school' }); return; }
  front(S, { t: 'gate', pid: p.id, kind: 'club' });
};
RESOLVE.pickTag = (S, a, pd) => {
  const p = P(S, pd.pid);
  const tag = C.TAGS.includes(a.tag) ? a.tag : C.TAGS[0];
  S.pending = null;
  if (pd.purpose === 'school') {
    p.tags[tag] += p.schoolTagCount; p.schoolTag = tag;
    toast(S, p.id, `${C.TAG_ICON[tag]} ${tag} 경험 +${p.schoolTagCount}`);
    front(S, { t: 'gate', pid: p.id, kind: 'club' });
  } else if (pd.purpose === 'dept') {
    wait(S, 'pickDept', p.id, { tag, depts: C.DEPTS[tag][p.edu === 2 ? 4 : 2] });
  } else if (pd.purpose === 'exp') {
    p.tags[tag] += 1; toast(S, p.id, `${C.TAG_ICON[tag]} ${tag} 경험 +1`);
  }
};

/* 진로 선택 */
RESOLVE.pickCareer = (S, a, pd) => {
  const p = P(S, pd.pid);
  S.pending = null;
  if (a.career === 'uni4' || a.career === 'uni2') {
    p.edu = a.career === 'uni4' ? 2 : 1; p.student = true;
    pay(S, p, a.career === 'uni4' ? C.COST.tuition4 : C.COST.tuition2, '학비');
    wait(S, 'pickTag', p.id, { title: '어느 분야 학과로 갈까?', purpose: 'dept' });
  } else if (a.career === 'job') {
    p.edu = 0; p.hist.push('바로 취업');
    front(S, { t: 'jobPick', pid: p.id, first: true });
  } else { // 창업 도전
    p.edu = 0; p.hist.push('창업 도전');
    front(S, { t: 'fate', pid: p.id, kind: 'startup' });
  }
};
RESOLVE.pickDept = (S, a, pd) => {
  const p = P(S, pd.pid);
  p.dept = pd.depts.includes(a.dept) ? a.dept : pd.depts[0];
  p.tags[pd.tag] += p.edu === 2 ? 2 : 1;
  addStat(p, p.edu === 2 ? 'int' : 'str', 12);
  p.hist.push(p.dept);
  S.pending = null;
  ack(S, p.id, `🎓 ${p.dept} 입학!`, [`${C.TAG_ICON[pd.tag]} ${pd.tag} 경험 +${p.edu === 2 ? 2 : 1}`, `${p.edu === 2 ? '4년제 대학' : '전문대'} 학생이 되었어요`], { bg: 'campus' });
};

/* ───── 직업 고르기 ───── */
export function qualifies(p, j, eduOverride) {
  const edu = eduOverride ?? p.edu ?? 0;
  const relax = j.tags.some(t => p.tags[t] > 0) ? 1 : 0;
  const missing = [];
  if (j.edu > edu) missing.push(['고졸', '전문대', '4년제'][j.edu] + '부터');
  if (j.fusion && !j.tags.every(t => p.tags[t] > 0)) missing.push(`${j.tags.join('+')} 경험 필요`);
  j.req.forEach(([s, g]) => { if (grade(p, s) < g - relax) missing.push(`${C.STATS[s]} ${C.GRADES[Math.max(0, g - relax)]} 이상`); });
  return { ok: !missing.length, missing, relax };
}
function jobCards(S, p, exclude = []) {
  const rel = j => Math.max(0, ...j.tags.map(t => p.tags[t]));
  const all = JOBS.filter(j => !exclude.includes(j.id));
  let okList = shuffle(S, all.filter(j => qualifies(p, j).ok)).sort((a, b) => Math.min(rel(b), 2) - Math.min(rel(a), 2));
  const fusion = okList.filter(j => j.fusion).slice(0, 2);
  okList = okList.filter(j => !j.fusion || fusion.includes(j));
  // 마이스터고 취업 보장
  if (p.school === 'meister' && p.schoolTag) {
    const g = JOBS.find(j => j.edu === 0 && j.tags.includes(p.schoolTag));
    if (g && !okList.includes(g)) okList.unshift(g);
  }
  const ok = okList.slice(0, 7).map(j => ({ id: j.id, ok: true }));
  const lockedPool = shuffle(S, all.filter(j => !qualifies(p, j).ok && rel(j) > 0)).slice(0, Math.max(0, 8 - ok.length));
  return ok.concat(lockedPool.slice(0, 2).map(j => ({ id: j.id, ok: false, missing: qualifies(p, j).missing })));
}
TASK.jobPick = (S, t) => {
  const p = P(S, t.pid);
  p.student = false;
  wait(S, 'pickJob', p.id, { cards: jobCards(S, p), reroll: true, change: !!t.change, first: !!t.first });
};
RESOLVE.pickJob = (S, a, pd) => {
  const p = P(S, pd.pid);
  if (a.reroll && pd.reroll) {
    S.pending = { ...pd, reroll: false, cards: jobCards(S, p, pd.cards.map(c => c.id)) }; return;
  }
  if (a.stay && pd.change) { S.pending = null; toast(S, p.id, '지금 직업을 계속해요'); return; }
  S.pending = null;
  if (a.free || a.id == null) {
    p.job = { free: true, rank: 1 };
    p.hist.push('프리랜서');
    ack(S, p.id, '🧑‍💻 프리랜서로 시작!', ['월급날마다 정해진 수입을 받아요', '언제든 이직 기회가 와요'], { bg: 'office', outfit: 'work' });
    return;
  }
  const j = JOBS[a.id];
  if (!j || !pd.cards.some(c => c.id === a.id && c.ok)) { S.pending = pd; return; }
  const keepRank = pd.change && p.job && !p.job.free && jobOf(p) && jobOf(p).field === j.field ? p.job.rank : 1;
  p.job = { id: j.id, rank: keepRank };
  if (j.titles === '창업') p.company = companyName(S, p, j);
  p.hist.push(j.name);
  news(S, p.id, `${j.icon} ${p.name} → ${j.name}`);
  const relax = qualifies(p, j).relax;
  if (relax && pd.first) p.money += Math.round(j.salary * 0.2);
  ack(S, p.id, `${j.icon} ${j.name}이(가) 되었어요!`, [
    `${TITLES[j.titles][keepRank - 1]} · 연봉 ${money(salaryOf(S, p))}`,
    relax && pd.first ? `관련 경험 덕분에 첫 월급 보너스 +${money(Math.round(j.salary * 0.2))}` : j.desc,
  ], { bg: jobBg(j), outfit: 'job' });
};
function companyName(S, p, j) {
  const tag = j.tags[0] || pick(S, C.TAGS);
  const w = { 발명: '아이디어', 제조: '로보틱스', 건설: '하우징', 수송: '모빌리티', 정보통신: '소프트', 생명: '바이오', 적정기술: '그린', 가정: '리빙' }[tag];
  return `${p.name}${w}`;
}
export function jobBg(j) {
  return { '발명·디자인': 'studio', 제조: 'factory', 건설: 'construction', 수송: 'garage', 정보통신: 'office', 생명: 'farm', '적정기술·환경·에너지': 'solar', 가정: 'kitchen', 교육: 'classroom', 융합: 'lab' }[j.field] || 'office';
}

/* ───── 연봉 계산 ───── */
export function salaryOf(S, p) {
  if (!p.job || p.retired) return 0;
  const r = p.job.rank - 1;
  if (p.job.free) return Math.round(C.FREELANCER_PAY * C.RANK_MULT[r]);
  const j = jobOf(p);
  if (j.titles === '크리에이터') return C.CREATOR_PAY[r];
  if (j.titles === '창업') return C.FOUNDER_PAY[r];
  return Math.round(j.salary * C.RANK_MULT[r]);
}
function npcSalary(n) {
  const j = JOBS[n.jobId];
  if (j.titles === '크리에이터') return C.CREATOR_PAY[n.rank - 1];
  if (j.titles === '창업') return C.FOUNDER_PAY[n.rank - 1];
  return Math.round(j.salary * C.RANK_MULT[n.rank - 1]);
}
export const npcOf = (S, id) => S.npcs[id];

/* ───── 월급날 ───── */
TASK.payday = (S, t) => {
  const p = P(S, t.pid);
  const lines = [];
  let income = 0;
  const own = p.retired ? Math.round(p.pension || 0) : salaryOf(S, p);
  if (p.retired) { if (own) lines.push(['🏖️ 연금', own]); }
  else if (p.student) { lines.push(['🧑‍🎓 아르바이트', 300]); income += 300; }
  else if (p.job) lines.push([`나 · ${jobTitle(p)} ${'★'.repeat(p.job.rank)}`, own]);
  else lines.push(['나 · 아직 직업 없음', 0]);
  income += own;
  if (p.spouse != null) {
    const n = npcOf(S, p.spouse); const v = npcSalary(n);
    lines.push([`배우자 · ${n.name} (${JOBS[n.jobId].name} ${'★'.repeat(n.rank)})`, v]); income += v;
  }
  p.kids.filter(k => k.jobId != null).forEach(k => {
    const v = Math.round(JOBS[k.jobId].salary * C.RANK_MULT[k.rank - 1]);
    lines.push([`자녀 · ${k.name} (${JOBS[k.jobId].name})`, v]); income += v;
  });
  if (p.patents) { const v = p.patents * C.PATENT_ROYALTY; lines.push([`📜 특허 로열티 (${p.patents}개)`, v]); income += v; }
  const happyBonus = Math.round(income * p.happy * 0.003);
  if (happyBonus) lines.push([`😊 행복 보너스 (행복도 ${p.happy} → +${Math.round(p.happy * 0.3)}%)`, happyBonus]);
  let total = income + happyBonus;
  if (t.exact) { const b = Math.round(total * 0.5); if (b) { lines.push(['🎉 딱 멈춤 보너스 +50%', b]); total += b; } }
  // 나가는 돈
  let out = 0; const outs = [];
  if (p.house.k === 'room' && !p.student) { out += C.COST.rent; outs.push('집세'); }
  const minors = p.kids.filter(k => k.jobId == null).length;
  if (minors) { out += minors * C.COST.childcare; outs.push(`양육비 ${minors}명`); }
  if (p.car) { out += C.CAR_UPKEEP[p.car]; outs.push('차 유지비'); }
  if (p.debt > 0) { const it = Math.round(p.debt * C.COST.interestRate); out += it; outs.push('대출 이자'); }
  if (out) lines.push([`💸 나가는 돈 (${outs.join('·')})`, -out]);
  p.money += total - out;
  if (p.car === 'eco') addGreen(S, p, 1);
  // 주식 시장: 🌟두 배 15% · 🙂그대로 70% · 💥반토막 15% (잘 아는 분야는 🌟20%·💥10%), 산 값의 10배까지
  if (p.stocks.length) {
    const r = rnd(S);
    let before = 0, after = 0, label = [];
    p.stocks.forEach(st => {
      before += st.value;
      const known = p.tags[C.STOCK_TAG[st.co]] > 0;
      const up = known ? 0.2 : 0.15, down = known ? 0.9 : 0.85;
      const m = st.junk ? 0 : r < up ? 2 : r < down ? 1 : 0.5;
      st.value = Math.min(Math.round(st.value * m), (st.cost || st.value) * 10);
      after += st.value;
    });
    label = r < 0.15 ? '🌟 두 배' : r < 0.2 ? '🌟 아는 분야만 두 배' : r < 0.85 ? '🙂 그대로' : r < 0.9 ? '💥 모르는 분야만 반토막' : '💥 반토막';
    lines.push([`📈 시장 ${label} (주식 ${money(before)} → ${money(after)})`, 0]);
  }
  fixDebt(S, p);
  log(S, { k: 'payday', pid: p.id, total: total - out });
  wait(S, 'ack', p.id, { kind: 'payday', title: t.exact ? '💰 월급날! (딱 멈춤)' : '💰 월급날!', lines, sum: total - out, bg: 'bank' });
  // 빚쟁이 (대출이 있으면 가끔)
  if (p.debt > 0 && rnd(S) < 0.25) S.after = { t: 'creditor', pid: p.id };
};

/* ───── 확인 화면 ───── */
function ack(S, pid, title, lines, extra = {}) {
  wait(S, 'ack', pid, { title, lines, ...extra });
}
RESOLVE.ack = (S) => {
  S.pending = null;
  if (S.after) { const a = S.after; S.after = null; front(S, a); }
};

/* ───── 돈·능력치 ───── */
function pay(S, p, amt, why) {
  p.money -= amt;
  fixDebt(S, p, why);
}
function fixDebt(S, p, why) {
  if (p.money < 0) {
    p.debt += -p.money; p.money = 0;
    toast(S, p.id, `🐱‍👤 돈이 모자라 대출! (빚 ${money(p.debt)})`);
  }
}
export function addStat(p, s, d) {
  if (d > 0 && p.talent === s) d = Math.round(d * 1.5);
  p.stats[s] = clamp(p.stats[s] + d, 0, 6 * C.GAUGE_PER_GRADE + 19);
}
function addGreen(S, p, d) {
  p.green = Math.max(0, p.green + d);
  const lv = Math.floor(p.green / 5);
  if (lv > p.greenLevel) { p.greenLevel = lv; if (p.luck < 4) { p.luck++; toast(S, p.id, `💚 사회기여 덕분에 운세가 올랐어요! (${C.LUCK[p.luck]})`); } }
}
function addHappy(p, d) { p.happy = clamp(p.happy + d, 0, 100); }

// 효과 적용 → 화면에 보여 줄 줄 목록
export function applyFx(S, p, fx, ctx = {}) {
  const out = [];
  if (!fx) return out;
  if (typeof fx === 'function') fx = fx(S, p, ctx) || {};
  if (fx.ins && p.insurance[fx.ins]) { out.push(`🛡️ ${C.INSURANCE[fx.ins].name} 덕분에 손해를 막았어요!`); fx = { ...fx, money: 0, sal: 0 }; }
  let m = (fx.money || 0) + Math.round((fx.sal || 0) * Math.max(salaryOf(S, p), 2000));
  if (fx.cash) m += Math.round(p.money * fx.cash);
  if (m) { p.money += m; out.push(`💰 ${m > 0 ? '+' : ''}${money(m)}`); }
  for (const s of ['int', 'str', 'sen']) if (fx[s]) { addStat(p, s, fx[s]); out.push(`${C.STATS[s]} ${fx[s] > 0 ? '+' : ''}${fx[s]}`); }
  if (fx.main) { const j = jobOf(p); const s = j ? j.req[0][0] : pick(S, ['int', 'str', 'sen']); addStat(p, s, fx.main); out.push(`${C.STATS[s]} ${fx.main > 0 ? '+' : ''}${fx.main}`); }
  if (fx.anyStat) { const s = pick(S, ['int', 'str', 'sen']); addStat(p, s, fx.anyStat); out.push(`${C.STATS[s]} ${fx.anyStat > 0 ? '+' : ''}${fx.anyStat}`); }
  if (fx.luck) { const b = p.luck; p.luck = clamp(p.luck + fx.luck, 0, 4); if (p.luck !== b) out.push(`운세 ${fx.luck > 0 ? '↑' : '↓'} (${C.LUCK_ICON[p.luck]} ${C.LUCK[p.luck]})`); }
  if (fx.tag) for (const [t, v] of Object.entries(fx.tag)) { const tag = t === 'job' ? (jobOf(p)?.tags[0] || pick(S, C.TAGS)) : t; p.tags[tag] += v; out.push(`${C.TAG_ICON[tag]} ${tag} 경험 +${v}`); }
  if (fx.green) { addGreen(S, p, fx.green); out.push(`💚 사회기여 ${fx.green > 0 ? '+' : ''}${fx.green}`); }
  if (fx.happy) { addHappy(p, fx.happy); out.push(`😊 행복도 ${fx.happy > 0 ? '+' : ''}${fx.happy}`); }
  if (fx.love && p.spouse != null) { p.love = clamp((p.love || 50) + fx.love, 0, 100); out.push(`💗 호감도 ${fx.love > 0 ? '+' : ''}${fx.love}`); }
  if (fx.card) { const c = fx.card === 'random' ? pick(S, Object.keys(C.CARDS)) : fx.card; if (giveCard(p, c)) out.push(`🎁 ${C.CARDS[c].icon} ${C.CARDS[c].name}`); }
  if (fx.patent) { p.patents += fx.patent; placePatent(S, p); out.push(`📜 특허 +${fx.patent} (월급날마다 로열티)`); }
  if (fx.rank) { if (p.job && !p.job.free && p.job.rank < 5) { p.job.rank++; out.push(`⬆️ RANK UP! ${jobTitle(p)}`); } }
  if (fx.houseVal && p.house.k !== 'room') { const d = Math.round(p.house.value * fx.houseVal); p.house.value += d; out.push(`🏠 집값 ${d > 0 ? '+' : ''}${money(d)}`); }
  if (fx.kidStat && p.kids.length) { p.kids.forEach(k => { k.stats[fx.kidStat] = (k.stats[fx.kidStat] || 0) + 10; }); out.push('👶 자녀 능력치↑'); }
  if (fx.kidTag && p.kids.length) { p.kids.forEach(k => { k.tags.push(fx.kidTag); }); out.push(`👶 자녀 ${fx.kidTag} 경험`); }
  if (fx.award) { p.awards.push(fx.award); out.push(`🏆 ${fx.award}`); }
  if (fx.souvenir) { const o = others(S, p); if (o.length) { const f = pick(S, o); p.souvenirs.push(f.id); out.push(`🎁 ${f.name}의 기념품을 받았어요 (${f.name}이(가) 성공할수록 값이 올라요)`); f.luck = clamp(f.luck + 1, 0, 4); } }
  if (fx.debtCut) { const d = Math.round(p.debt * fx.debtCut); p.debt -= d; if (d) out.push(`🧾 빚 −${money(d)}`); }
  fixDebt(S, p);
  return out;
}
function giveCard(p, c) {
  if (p.cards.length >= C.CARD_MAX) return false;
  p.cards.push(c); return true;
}
function placePatent(S, p) {
  const maxPos = Math.max(...S.players.map(q => q.pos));
  const cand = S.board.cells.filter(c => c.id > maxPos + 3 && c.type === 'normal' && c.stage === S.stage);
  if (cand.length) { const c = pick(S, cand); c.type = 'patent'; c.owner = p.id; }
}
TASK.patentPay = (S, t) => {
  const p = P(S, t.pid);
  if (t.owner == null || t.owner === p.id) return;
  const o = P(S, t.owner);
  const fee = 300;
  pay(S, p, fee); o.money += fee;
  toast(S, p.id, `📜 ${o.name}의 특허 칸! 사용료 ${money(fee)}`);
};

/* ═════════════ 운명 룰렛 ═════════════ */
export function fateSlots(S, p, spec) {
  let [g, n, b] = C.FATE_BASE[spec.base || '보통'];
  const mods = [];
  if (spec.fixedBad != null) { // 호감도 룰렛 (성공/꽝)
    const bad = clamp(spec.fixedBad, 0, 9);
    return { layout: layoutOf(10 - bad, 0, bad), mods: [[`호감도 ${spec.love}`, 0]], cond: 0 };
  }
  const luck = C.LUCK_MOD[p.luck]; if (luck) mods.push([`운세 ${C.LUCK[p.luck]}`, luck]);
  if (spec.stat) {
    const gr = grade(p, spec.stat), need = spec.need ?? 3;
    let m = gr >= 6 ? 2 : gr - need >= 1 ? 1 : gr - need <= -2 ? -2 : gr - need === -1 ? -1 : 0;
    if (m) mods.push([`${C.STATS[spec.stat]} ${C.GRADES[gr]}`, m]);
  }
  if (spec.tag) {
    const tags = Array.isArray(spec.tag) ? spec.tag : [spec.tag];
    const cnt = tags.reduce((s, t) => s + (p.tags[t] || 0), 0);
    const m = cnt >= 3 ? 2 : cnt >= 1 ? 1 : 0;
    if (m) mods.push([`${tags[0]} 경험`, m]);
  }
  if (spec.bonus && spec.bonus.length) mods.push(...spec.bonus);
  if (p.debt > 0 && p.money <= 0) mods.push(['빚', -1]);
  if (p.charm) mods.push(['🍀 행운 부적', p.charm]);
  const cond = ri(S, -2, 2);
  if (cond) mods.push([`🎲 컨디션`, cond]);
  let d = mods.reduce((s, [, v]) => s + v, 0);
  while (d > 0) { if (b > 0) { b--; g++; } else if (n > 0 && g < 8) { n--; g++; } else break; d--; }
  while (d < 0) { if (g > 0) { g--; b++; } else if (n > 0 && b < 9) { n--; b++; } else break; d++; }
  return { layout: layoutOf(g, n, b), mods, cond };
}
function layoutOf(g, n, b) { // 칸을 고르게 섞어 둥근 바퀴에 배치
  const arr = [];
  const counts = { g, n, b };
  const order = ['g', 'n', 'b'];
  for (let i = 0; i < 10; i++) {
    // 가장 많이 남은 종류를 번갈아
    let best = null;
    for (const k of order) if (counts[k] > 0 && (best == null || counts[k] > counts[best]) && arr[arr.length - 1] !== k) best = k;
    if (best == null) best = order.find(k => counts[k] > 0);
    arr.push(best); counts[best]--;
  }
  return arr;
}

TASK.fate = (S, t) => {
  const p = P(S, t.pid);
  const spec = FATE[t.kind].spec(S, p, t);
  if (!spec) return;
  const { layout, mods, cond } = fateSlots(S, p, spec);
  wait(S, 'fate', p.id, { kind: t.kind, ctx: t, title: spec.title, labels: spec.labels, layout, mods, cond, twoWay: spec.fixedBad != null, bg: spec.bg });
};
RESOLVE.fate = (S, a, pd) => {
  const p = P(S, pd.pid);
  const idx = Math.floor(rnd(S) * 10);
  const res = pd.layout[idx];
  p.charm = 0;
  log(S, { k: 'fate', pid: p.id, layout: pd.layout, idx, res, title: pd.title });
  S.pending = null;
  FATE[pd.kind].done(S, p, res, pd.ctx);
};

const FATE = {};
const RES_NAME = { g: '🌟 대운!', n: '🙂 보통', b: '💥 꽝…' };

// 이벤트 선택지 룰렛
FATE.event = {
  spec: (S, p, t) => {
    const ev = findEvent(t.eid); const ch = ev.ch[t.i]; const r = ch.r;
    const stat = typeof r.s === 'function' ? r.s(S, p) : r.s;
    const tag = r.tag === 'job' ? (jobOf(p)?.tags || null) : r.tag;
    return { base: r.k || '보통', stat, need: r.need ?? needFor(S), tag, bonus: r.bonus ? r.bonus(S, p) : null, title: ch.l, labels: r.labels, bg: ev.bg };
  },
  done: (S, p, res, t) => {
    const ev = findEvent(t.eid); const r = ev.ch[t.i].r;
    const o = r[res] || r.n;
    const lines = applyFx(S, p, o.e, { ev });
    if (o.then) front(S, ...[].concat(o.then).map(x => ({ ...x, pid: p.id })));
    ack(S, p.id, `${RES_NAME[res]} ${o.t}`, lines, { bg: ev.bg, mood: res });
  },
};
function needFor(S) { // 단계에 맞는 기준 등급 (학생 E~C, 어른 C)
  return [1, 1, 2, 2, 3, 3, 3, 3, 3][S.stage];
}

// 창업 룰렛
FATE.startup = {
  spec: () => ({ base: '보통', stat: 'sen', need: 3, tag: '발명', title: '🚀 창업 룰렛!', bg: 'garage_studio' }),
  done: (S, p, res) => {
    const inv = JOBS.find(j => j.name === '발명가');
    if (res === 'b') {
      p.job = { free: true, rank: 1 };
      ack(S, p.id, '💥 창업 실패… 프리랜서로 시작', ['다음 이직 기회에 다시 도전할 수 있어요'], { bg: 'office', mood: 'b' }); return;
    }
    p.job = { id: inv.id, rank: res === 'g' ? 2 : 1 };
    p.company = companyName(S, p, inv);
    news(S, p.id, `🚀 ${p.name} '${p.company}' 창업!`);
    ack(S, p.id, res === 'g' ? `🌟 투자 유치! '${p.company}' 스타트업 시작` : `🙂 '${p.company}' 1인 창업 시작`, ['회사가 커질수록 월급날 수입이 늘어요'], { bg: 'studio', mood: res, outfit: 'job' });
  },
};

// 직업 룰렛 (직업 칸)
FATE.job = {
  spec: (S, p) => {
    const j = p.job.free ? null : jobOf(p);
    const ev = pickJobEvent(S, p, 'fate');
    return { base: j ? j.kind : '보통', stat: j ? j.req[0][0] : 'sen', need: (j ? j.req[0][1] : 2) + Math.floor((p.job.rank - 1) / 2), tag: j ? j.tags : null, title: ev.t, bg: j ? jobBg(j) : 'office', labels: ev };
  },
  done: (S, p, res, t) => { jobFateDone(S, p, res); },
};
TASK.jobFate = (S, t) => { front(S, { t: 'fate', pid: t.pid, kind: 'job' }); };
function jobFateDone(S, p, res) {
  const j = p.job.free ? null : jobOf(p);
  const sal = Math.max(salaryOf(S, p), 2000);
  const ev = S.pending?.labels || null; void ev;
  const lines = [];
  let title;
  const tpl = pickJobEvent(S, p, 'fate');
  if (res === 'g') {
    title = `🌟 ${tpl.g}`;
    const need = j ? j.req[0][1] + Math.floor((p.job.rank - 1) / 2) : 0;
    if (p.job.rank < 5 && (!j || grade(p, j.req[0][0]) >= Math.min(6, need))) {
      p.job.rank++;
      lines.push(`⬆️ RANK UP! ${jobTitle(p)} ${'★'.repeat(p.job.rank)}`);
      lines.push(`연봉이 ${money(salaryOf(S, p))}(으)로 올랐어요`);
      if (p.job.rank === 5) { back_gift(S, p, 'rank5'); news(S, p.id, `🏅 ${p.name} 최고 랭크 달성! (${jobTitle(p)})`); }
    } else if (p.job.rank < 5) lines.push(`랭크 업까지 ${j ? C.STATS[j.req[0][0]] : '능력치'}이(가) 조금 부족해요`);
    lines.push(...applyFx(S, p, { money: Math.round(sal * 0.5), main: 6 }));
  } else if (res === 'n') {
    title = `🙂 ${tpl.n}`;
    lines.push(...applyFx(S, p, { money: Math.round(sal * 0.15), main: 3 }));
  } else {
    title = `💥 ${tpl.b}`;
    if (j && j.titles === '창업' && p.job.rank > 1) { p.job.rank--; lines.push(`📉 회사가 작아졌어요: ${jobTitle(p)}`); }
    else if (j && j.titles === '창업') { p.job = { free: true, rank: 1 }; lines.push('📉 폐업… 프리랜서로 다시 시작해요 (이직 기회에 재도전 가능)'); }
    lines.push(...applyFx(S, p, { money: -Math.round(sal * 0.15), main: -4 }));
  }
  ack(S, p.id, title, lines, { bg: j ? jobBg(j) : 'office', outfit: 'job', mood: res });
}
function pickJobEvent(S, p, kind) {
  const j = p.job && !p.job.free ? jobOf(p) : null;
  const key = j ? (JOB_EVENTS.byJob[j.name] ? j.name : j.field) : '프리랜서';
  const set = JOB_EVENTS.byJob[key] || JOB_EVENTS.byField[key] || JOB_EVENTS.byField['프리랜서'];
  const list = set[kind] || set.fate;
  return list[(S.round + p.id) % list.length];
}

/* ═════════════ 이벤트 칸 ═════════════ */
function findEvent(id) { return EVENTS.find(e => e.id === id) || EXP_EVENTS.find(e => e.id === id); }
TASK.event = (S, t) => {
  const p = P(S, t.pid);
  const sk = stageKey(S);
  // 어른·직업 있음: 럭키/불행 칸의 절반은 내 직업 이벤트
  if ((t.cell === 'lucky' || t.cell === 'unlucky') && p.job && !p.retired && isAdultStage(S) && rnd(S) < 0.5) {
    front(S, { t: 'jobLuck', pid: p.id, good: t.cell === 'lucky' }); return;
  }
  if (t.cell === 'normal' && p.job && !p.retired && !p.student && isAdultStage(S) && rnd(S) < 0.25) {
    front(S, { t: 'jobFate', pid: p.id }); return;
  }
  const pool = EVENTS.filter(e => e.cell === t.cell && e.st.includes(sk) && (!e.need || e.need(S, p)));
  let list = pool.filter(e => !p.seen[e.id]);
  if (!list.length) { list = pool; pool.forEach(e => { delete p.seen[e.id]; }); }
  if (!list.length) { ack(S, p.id, '평범한 하루', ['오늘은 별일 없이 지나갔어요'], { bg: 'home' }); return; }
  const ev = pick(S, list);
  p.seen[ev.id] = 1;
  presentEvent(S, p, ev);
};
function presentEvent(S, p, ev) {
  if (!ev.ch) { // 선택 없는 이벤트
    const lines = applyFx(S, p, ev.e);
    if (ev.cell === 'verylucky') news(S, p.id, `🌈 ${p.name}: ${ev.t}`);
    if (ev.then) front(S, ...[].concat(ev.then).map(x => ({ ...x, pid: p.id })));
    ack(S, p.id, ev.t, lines, { bg: ev.bg, text: ev.n, mood: ev.cell === 'unlucky' ? 'b' : 'g', eid: ev.id });
    return;
  }
  const avail = ev.ch.map((c, i) => (!c.need || c.need(S, p)) ? i : -1).filter(i => i >= 0);
  wait(S, 'event', p.id, { eid: ev.id, avail });
}
RESOLVE.event = (S, a, pd) => {
  const p = P(S, pd.pid);
  const i = pd.avail.includes(a.i) ? a.i : pd.avail[0];
  const ev = findEvent(pd.eid); const ch = ev.ch[i];
  S.pending = null;
  if (ch.r) { front(S, { t: 'fate', pid: p.id, kind: 'event', eid: ev.id, i }); return; }
  if (ch.call) { front(S, { t: 'expertCall', pid: p.id, field: ch.call, cost: ch.cost || 300, eid: ev.id, i }); return; }
  const lines = applyFx(S, p, ch.e, { ev });
  if (ch.then) front(S, ...[].concat(ch.then).map(x => ({ ...x, pid: p.id })));
  ack(S, p.id, ch.n ? ch.n : ch.l, lines, { bg: ev.bg, mood: ch.mood });
};
// 생활 이벤트: 전문가 부르기 → 그 분야 직업 친구에게 수리비
TASK.expertCall = (S, t) => {
  const p = P(S, t.pid);
  const fieldOf = q => (q.job && !q.job.free ? jobOf(q).tags : []);
  const pro = others(S, p).find(q => fieldOf(q).includes(t.field));
  pay(S, p, t.cost);
  const lines = [`💰 −${money(t.cost)}`];
  if (pro) { pro.money += t.cost; lines.push(`🔧 같은 방 ${pro.name}(${jobOf(pro).name})이(가) 고쳐 줬어요! 수리비는 ${pro.name}에게`); }
  else lines.push('🔧 전문가가 깔끔하게 고쳐 줬어요');
  ack(S, p.id, '전문가를 불렀어요', lines, { bg: 'home' });
};
// 직업 행운·불행
TASK.jobLuck = (S, t) => {
  const p = P(S, t.pid);
  const tpl = pickJobEvent(S, p, t.good ? 'good' : 'bad');
  const sal = Math.max(salaryOf(S, p), 2000);
  const lines = t.good ? applyFx(S, p, { money: Math.round(sal * (0.3 + rnd(S) * 0.5)), main: 4, ...(tpl.fx || {}) })
                       : applyFx(S, p, { money: -Math.round(sal * (0.1 + rnd(S) * 0.2)), main: -3, ...(tpl.fx || {}) });
  const j = jobOf(p);
  ack(S, p.id, (t.good ? '⭐ ' : '🌧️ ') + tpl.t, lines, { bg: j ? jobBg(j) : 'office', outfit: 'job', mood: t.good ? 'g' : 'b' });
};

// 경험 칸
TASK.exp = (S, t) => {
  const p = P(S, t.pid);
  const pool = EXP_EVENTS.filter(e => e.st.includes(stageKey(S)));
  const ev = pick(S, pool);
  presentEvent(S, p, ev);
};
// 대회 칸
TASK.contest = (S, t) => {
  const p = P(S, t.pid);
  const club = C.CLUBS.find(c => c.k === p.club) || C.CLUBS[0];
  const stat = Object.keys(club.gain).sort((a, b) => club.gain[b] - club.gain[a])[0];
  front(S, { t: 'fate', pid: p.id, kind: 'contest', stat, club: club.k });
};
FATE.contest = {
  spec: (S, p, t) => { const club = C.CLUBS.find(c => c.k === t.club); return { base: '보통', stat: t.stat, need: needFor(S), tag: club.tag, title: `${club.icon} ${club.contest} 출전!`, bg: t.club === 'sports' ? 'field' : 'hall' }; },
  done: (S, p, res, t) => {
    const club = C.CLUBS.find(c => c.k === t.club);
    const prize = { g: ['금상', 30, 12], n: ['장려상', 10, 6], b: ['아쉽게 탈락', 0, 3] }[res];
    const fx = { money: prize[1], [t.stat]: prize[2] };
    if (res === 'g') { news(S, p.id, `🏆 ${p.name} ${club.contest} 금상!`); fx.award = `${C.STAGES[S.stage].short} ${club.contest} ${prize[0]}`; if (club.tag) fx.tag = { [club.tag]: 1 }; if (rnd(S) < 0.4) fx.card = 'random'; }
    if (club.green && res !== 'b') fx.green = club.green;
    ack(S, p.id, `${RES_NAME[res]} ${prize[0]}!`, applyFx(S, p, fx), { bg: t.club === 'sports' ? 'field' : 'hall', mood: res });
  },
};

// 퀴즈 칸 (혼자)
TASK.quizSolo = (S, t) => {
  const p = P(S, t.pid);
  const q = pickQuiz(S);
  wait(S, 'quiz', p.id, { pids: [p.id], q, answers: {}, solo: true });
  comAnswers(S);
};
// 게임에 쓸 퀴즈 목록: 기본 문제(선생님이 고치거나 지운 것 반영) + 선생님이 넣은 문제
// cfg = 서버의 config (quizBase: 기본 문제 고침/지움, quiz: 직접 넣은 문제, game.onlyMine)
export function quizPool(cfg = {}) {
  const fix = cfg.quizBase || {}, g = cfg.game || {};
  const ok = q => q && q.q && Array.isArray(q.o) && q.o.length >= 2;
  const base = QUIZ.map(q => (fix[q.id] ? (fix[q.id].del ? null : { ...q, ...fix[q.id], id: q.id }) : q)).filter(ok);
  const mine = Object.entries(cfg.quiz || {}).filter(([, q]) => ok(q)).map(([id, q]) => ({ id: 'c_' + id, u: q.u, q: q.q, o: q.o, a: q.a | 0, x: q.x || '' }));
  return g.onlyMine && mine.length ? mine : base.concat(mine);
}
function pickQuiz(S) {
  const units = S.settings.units;
  const mine = S.settings.extraQuiz || []; // (예전 방식) 선생님이 넣은 문제
  // 방을 만들 때 퀴즈 목록을 설정에 함께 저장 → 방 안 모든 기기가 같은 문제
  const base = S.settings.quizList && S.settings.quizList.length ? S.settings.quizList : S.settings.onlyMine && mine.length ? mine : QUIZ.concat(mine);
  let pool = base.filter(q => !units || !units.length || units.includes(q.u));
  if (!pool.length) pool = base;
  const used = S.usedQuiz || (S.usedQuiz = {});
  let list = pool.filter((q, i) => !used[q.id]);
  if (!list.length) { S.usedQuiz = {}; list = pool; }
  const q = pick(S, list); S.usedQuiz[q.id] = 1;
  const order = shuffle(S, q.o.map((_, i) => i));
  return { id: q.id, q: q.q, o: order.map(i => q.o[i]), a: order.indexOf(q.a), u: q.u, x: q.x };
}
function comAnswers(S) {
  const pd = S.pending;
  pd.pids.forEach(id => {
    const q = P(S, id);
    if (q.isCom && pd.answers[id] == null) {
      const right = rnd(S) < 0.6;
      pd.answers[id] = { c: right ? pd.q.a : (pd.q.a + 1) % pd.q.o.length, ms: 1500 + Math.floor(rnd(S) * 5000) };
    }
  });
  if (pd.pids.every(id => pd.answers[id])) finishQuiz(S);
}
RESOLVE.quiz = (S, a, pd) => {
  if (!pd.pids.includes(a.pid) || pd.answers[a.pid]) return;
  pd.answers[a.pid] = { c: a.c, ms: a.ms ?? 9999 };
  if (pd.pids.every(id => pd.answers[id])) finishQuiz(S);
};
function finishQuiz(S) {
  const pd = S.pending; S.pending = null;
  const right = pd.pids.filter(id => pd.answers[id].c === pd.q.a).sort((a, b) => pd.answers[a].ms - pd.answers[b].ms);
  log(S, { k: 'quizResult', pids: pd.pids, answers: pd.answers, q: pd.q, winner: right[0] ?? null });
  if (pd.solo) {
    const p = P(S, pd.pids[0]);
    const ok = right.length > 0;
    const lines = ok ? applyFx(S, p, isAdultStage(S) ? { money: 300, anyStat: 4 } : { money: 10, anyStat: 6 }) : ['다음엔 맞힐 수 있어요!'];
    ack(S, p.id, ok ? '⭕ 정답!' : '❌ 아쉬워요', [`정답: ${pd.q.o[pd.q.a]}`, ...(pd.q.x ? [pd.q.x] : []), ...lines], { bg: 'classroom', mood: ok ? 'g' : 'b' });
    return;
  }
  // 같은 칸 퀴즈쇼
  if (!right.length) {
    if (!pd.retry) { front(S, { t: 'quizShow', pid: pd.host, pids: pd.pids, retry: true }); return; }
    ack(S, pd.host, '🤝 무승부!', ['아무도 못 맞혔어요', `정답: ${pd.q.o[pd.q.a]}`], { bg: 'stage' }); return;
  }
  const w = P(S, right[0]);
  const student = !isAdultStage(S);
  if (!student) { w.money += C.QUIZ_PRIZE; }
  front(S, { t: 'showWheels', pid: w.id, student, step: 0, sel: {} });
  log(S, { k: 'toast', pid: w.id, text: `🏆 퀴즈쇼 승리: ${w.name}! ${student ? '' : '상금 ' + money(C.QUIZ_PRIZE)}`, icon: '' });
}
TASK.sameCell = (S, t) => {
  const p = P(S, t.pid);
  if (S.over || S.stage < 2 || !S.settings.quiz) return;
  const here = S.players.filter(q => q.id !== p.id && q.pos === p.pos && !q.goalRank);
  const c = S.board.cells[p.pos];
  if (!here.length || ['gate', 'goal', 'start'].includes(c.type)) return;
  front(S, { t: 'quizShow', pid: p.id, pids: [p.id, ...here.map(q => q.id)] });
};
TASK.quizShow = (S, t) => {
  log(S, { k: 'quizShow', pids: t.pids });
  wait(S, 'quiz', t.pid, { pids: t.pids, q: pickQuiz(S), answers: {}, host: t.pid, retry: !!t.retry, show: true });
  comAnswers(S);
};
// 퀴즈쇼 룰렛 4~5개: 하나씩 차례로
TASK.showWheels = (S, t) => {
  const w = P(S, t.pid);
  const names = S.players.map(q => q.name);
  const steps = t.student ? ['who', 'to', 'stat', 'amt', 'dir'] : ['who', 'to', 'amt', 'dir'];
  const st = steps[t.step];
  if (!st) { front(S, { t: 'showApply', pid: w.id, sel: t.sel, student: t.student }); return; }
  let labels;
  if (st === 'who') labels = names;
  else if (st === 'to') labels = [...S.players.filter(q => q.id !== t.sel.who).map(q => q.name), '모두'];
  else if (st === 'stat') labels = ['지력', '체력', '센스'];
  else if (st === 'amt') labels = t.student ? C.QUIZ_STAT_WHEEL.map(v => v >= 20 ? '한 등급' : `${v}만큼`) : C.QUIZ_MONEY_WHEEL.map(v => money(Math.round(v * (S.stage <= 6 ? 0.5 : 1))));
  else labels = ['준다', '받는다'];
  wait(S, 'wheel', w.id, { purpose: 'show', title: { who: '누가?', to: '누구에게?', stat: '어떤 능력치를?', amt: '얼마나?', dir: '준다? 받는다?' }[st], labels, step: t.step, steps, sel: t.sel, student: t.student });
};
WHEEL_DONE.show = (S, pd, idx) => {
  const sel = { ...pd.sel };
  const st = pd.steps[pd.step];
  if (st === 'who') sel.who = idx;
  else if (st === 'to') { const ids = S.players.filter(q => q.id !== sel.who).map(q => q.id); sel.to = idx < ids.length ? ids[idx] : 'all'; }
  else if (st === 'stat') sel.stat = ['int', 'str', 'sen'][idx];
  else if (st === 'amt') sel.amt = pd.student ? C.QUIZ_STAT_WHEEL[idx] : Math.round(C.QUIZ_MONEY_WHEEL[idx] * (S.stage <= 6 ? 0.5 : 1));
  else sel.dir = idx === 0 ? 'give' : 'take';
  sel.text = (sel.text || []).concat(pd.labels[idx]);
  front(S, { t: 'showWheels', pid: pd.pid, step: pd.step + 1, sel, student: pd.student });
};
TASK.showApply = (S, t) => {
  const sel = t.sel;
  const who = P(S, sel.who);
  const targets = sel.to === 'all' ? others(S, who) : [P(S, sel.to)];
  const lines = [];
  targets.forEach(q => {
    const [from, to] = sel.dir === 'give' ? [who, q] : [q, who];
    if (t.student) {
      const amt = Math.min(sel.amt, from.stats[sel.stat]);
      from.stats[sel.stat] -= amt; to.stats[sel.stat] += amt;
      lines.push(`${from.name} → ${to.name}: ${C.STATS[sel.stat]} ${amt}`);
    } else {
      pay(S, from, sel.amt); to.money += sel.amt;
      lines.push(`${from.name} → ${to.name}: ${money(sel.amt)}`);
    }
  });
  ack(S, t.pid, `🎡 ${sel.text.join(' · ')}`, lines, { bg: 'stage' });
};

/* ═════════════ 축하금 ═════════════ */
function back_gift(S, p, kind) { S.tasks.splice(Math.max(0, S.tasks.findIndex(x => x.t === 'sameCell')), 0, { t: 'gift', pid: p.id, kind }); }
TASK.gift = (S, t) => {
  const p = P(S, t.pid);
  if (S.players.length < 2) return;
  const wheel = t.kind === 'house' ? C.GIFT_WHEEL.slice(0, 8) : C.GIFT_WHEEL;
  const title = { wedding: '💒 축의금 룰렛!', baby: '👶 아기 축하금 룰렛!', house: '🏠 집들이 선물 룰렛!', rank5: '🏅 최고 랭크 축하금 룰렛!' }[t.kind];
  wait(S, 'wheel', p.id, { purpose: 'gift', title, labels: wheel.map(v => money(v)), values: wheel, kind: t.kind });
};
WHEEL_DONE.gift = (S, pd, idx) => {
  const p = P(S, pd.pid);
  let amt = pd.values[idx];
  if (p.house.k === 'mansion' || p.house.k === 'castle') amt = Math.round(amt * 1.5);
  const lines = [];
  others(S, p).forEach(q => { pay(S, q, amt); p.money += amt; lines.push(`${q.name} → ${p.name} ${money(amt)}`); });
  ack(S, p.id, `🎉 모두에게서 ${money(amt)}씩!`, lines, { bg: pd.kind === 'wedding' ? 'wedding' : 'party' });
};

/* ═════════════ 사랑·결혼·아기 ═════════════ */
TASK.love = (S, t) => {
  const p = P(S, t.pid);
  if (p.spouse != null) { wait(S, 'datePick', p.id, { npc: p.spouse, places: datePlaces(S, p), spouse: true }); return; }
  const canMeet = !!t.cell;
  if (!canMeet && !p.contacts.length) return;
  wait(S, 'loveMenu', p.id, { canMeet, contacts: p.contacts.map(c => c.id) });
};
function datePlaces(S, p) {
  const free = C.DATE_PLACES.filter(d => d.cost === 0);
  const paid = C.DATE_PLACES.filter(d => d.cost > 0 && (!d.car || p.car));
  return [pick(S, free), ...shuffle(S, paid).slice(0, 3)].map(d => d.k);
}
RESOLVE.loveMenu = (S, a, pd) => {
  const p = P(S, pd.pid);
  S.pending = null;
  if (a.skip) { toast(S, p.id, '오늘은 혼자만의 시간을 보냈어요'); addHappy(p, 3); return; }
  let id = a.npc;
  if (a.meet && pd.canMeet) {
    id = meetNpc(S, p);
    if (id == null) { ack(S, p.id, '💗 오늘은 새로운 만남이 없었어요', [], { bg: 'park' }); return; }
    if (p.contacts.length >= 5) p.contacts.shift();
    p.contacts.push({ id, love: 20 });
    const n = npcOf(S, id);
    toast(S, p.id, `💗 ${n.name}을(를) 만났어요! (${JOBS[n.jobId].name} ${'★'.repeat(n.rank)})`);
  }
  if (id == null || !p.contacts.some(c => c.id === id)) return;
  wait(S, 'datePick', p.id, { npc: id, places: datePlaces(S, p), spouse: false });
};
function meetNpc(S, p) {
  const free = S.npcs.filter(n => n.gender !== p.gender && n.married == null && !p.contacts.some(c => c.id === n.id));
  if (!free.length) return null;
  const topTag = C.TAGS.slice().sort((a, b) => p.tags[b] - p.tags[a])[0];
  const pref = free.filter(n => n.tag === topTag);
  const myRank = p.job && !p.job.free ? p.job.rank : 1;
  const near = (pref.length && rnd(S) < 0.5 ? pref : free).sort((a, b) => Math.abs(a.rank - myRank) - Math.abs(b.rank - myRank));
  return near[Math.min(near.length - 1, ri(S, 0, 2))].id;
}
RESOLVE.datePick = (S, a, pd) => {
  const p = P(S, pd.pid);
  const place = C.DATE_PLACES.find(d => d.k === a.place && pd.places.includes(d.k)) || C.DATE_PLACES.find(d => d.k === pd.places[0]);
  const n = npcOf(S, pd.npc);
  S.pending = null;
  if (place.cost) pay(S, p, place.cost);
  let gain;
  const lines = [];
  if (pd.spouse) {
    gain = place.cost ? ri(S, 60, 100) : 15;
    p.love = clamp((p.love ?? 50) + gain, 0, 100);
  } else {
    const c = p.contacts.find(x => x.id === n.id);
    gain = place.cost ? ri(S, 30, 45) : 20;
    if (place.taste === n.taste) { gain += 10; lines.push(`${C.TASTES.find(x => x.k === n.taste).icon} 좋아하는 데이트! +10`); }
    if (p.tags[n.tag] > 0) { gain += 10; lines.push(`${C.TAG_ICON[n.tag]} 말이 잘 통해요! +10`); }
    if (p.car) { gain += 5; lines.push('🚗 차로 데리러 갔어요 +5'); }
    if (n.rank >= 4) gain = Math.round(gain * 0.8);
    if (S.mode === 'careerShort') gain = Math.round(gain * 1.5);
    c.love = clamp(c.love + gain, 0, 100);
  }
  addHappy(p, 3);
  const love = pd.spouse ? p.love : p.contacts.find(x => x.id === n.id).love;
  log(S, { k: 'date', pid: p.id, npc: n.id, place: place.k, love });
  const cap = (C.HOUSES.find(h => h.k === p.house.k) || C.HOUSES[0]).cap;
  const canBaby = pd.spouse && love >= 60 && p.kids.length < cap;
  const babyBlocked = pd.spouse && love >= 60 && p.kids.length >= cap;
  wait(S, 'dateEnd', p.id, { npc: n.id, place: place.k, love, gain, lines, spouse: pd.spouse, canBaby, babyBlocked,
    badSlots: pd.spouse ? Math.max(0, Math.round((100 - love) / 5)) : Math.max(0, Math.round((100 - love) / 10)), cost: place.cost, bg: place.bg });
};
RESOLVE.dateEnd = (S, a, pd) => {
  const p = P(S, pd.pid);
  S.pending = null;
  if (a.propose && !pd.spouse) { front(S, { t: 'fate', pid: p.id, kind: 'propose', npc: pd.npc }); return; }
  if (a.baby && pd.canBaby) { front(S, { t: 'fate', pid: p.id, kind: 'baby' }); return; }
};
FATE.propose = {
  spec: (S, p, t) => { const c = p.contacts.find(x => x.id === t.npc); return { fixedBad: Math.max(0, Math.round((100 - c.love) / 10)), love: c.love, title: `💍 ${npcOf(S, t.npc).name}에게 프로포즈!`, bg: 'river' }; },
  done: (S, p, res, t) => {
    const n = npcOf(S, t.npc);
    const c = p.contacts.find(x => x.id === t.npc);
    if (res === 'b') { c.love = Math.max(0, c.love - 20); ack(S, p.id, '💔 프로포즈 실패…', ['호감도 −20', '데이트로 마음을 더 얻으면 다시 도전할 수 있어요'], { bg: 'river', mood: 'b' }); return; }
    p.spouse = n.id; n.married = p.id; p.love = Math.max(60, c.love); p.contacts = [];
    S.players.forEach(q => { if (q.id !== p.id && q.contacts.some(x => x.id === n.id)) { q.contacts = q.contacts.filter(x => x.id !== n.id); toast(S, q.id, `💔 ${p.name}님이 ${n.name}님과 결혼했어요`); } });
    addHappy(p, 10);
    p.hist.push(`${n.name}님과 결혼`);
    news(S, p.id, `💒 ${p.name} 결혼! (${n.name}님과)`);
    front(S, { t: 'gift', pid: p.id, kind: 'wedding' });
    ack(S, p.id, `💒 ${n.name}님과 결혼!`, [`배우자도 월급날 연봉을 받아요 (${JOBS[n.jobId].name})`, '😊 행복도 +10'], { bg: 'wedding', outfit: 'wedding', mood: 'g' });
  },
};
FATE.baby = {
  spec: (S, p) => ({ fixedBad: Math.max(0, Math.round((100 - p.love) / 5)), love: p.love, title: '👶 아기 룰렛!', bg: 'home' }),
  done: (S, p, res) => {
    if (res === 'b') { ack(S, p.id, '🙂 이번에는 아기가 오지 않았어요', ['다음 데이트에서 다시!'], { bg: 'home' }); return; }
    const cap = (C.HOUSES.find(h => h.k === p.house.k) || C.HOUSES[0]).cap;
    const r = rnd(S);
    let n = r < 0.005 ? 3 : r < 0.055 ? 2 : 1;
    n = Math.min(n, cap - p.kids.length);
    for (let i = 0; i < n; i++) {
      const g = rnd(S) < 0.5 ? 'm' : 'f';
      p.kids.push({ name: pick(S, C.KID_NAMES[g]) + (p.kids.length + 1 > 6 ? p.kids.length + 1 : ''), gender: g, born: S.round, age: 0, stats: { int: 0, str: 0, sen: 0 }, tags: [], jobId: null, rank: 1, look: randomLook(S, g) });
      back_gift_now(S, p);
    }
    p.love = Math.max(0, p.love - (jobOf(p)?.name === '보육교사' ? 15 : 30));
    news(S, p.id, `👶 ${p.name}네 ${n === 3 ? '세쌍둥이' : n === 2 ? '쌍둥이' : '아기'} 탄생!`);
    addHappy(p, 10);
    ack(S, p.id, n === 3 ? '👶👶👶 세쌍둥이가 찾아왔어요!!' : n === 2 ? '👶👶 쌍둥이가 찾아왔어요!' : '👶 아기가 찾아왔어요!', ['😊 행복도 +10', '아이가 자라면 월급날 연봉을 받아요'], { bg: 'home', mood: 'g' });
  },
};
function back_gift_now(S, p) { front(S, { t: 'gift', pid: p.id, kind: 'baby' }); }

function kidsTick(S, p) {
  p.kids.forEach((k, i) => {
    if (k.jobId != null) return;
    k.age = S.round - k.born;
    if (k.age >= 6 && !k.pending) { k.pending = true; front(S, { t: 'kidAdult', pid: p.id, idx: i }); }
  });
}
TASK.kidAdult = (S, t) => {
  const p = P(S, t.pid); const k = p.kids[t.idx];
  const dreamTags = k.tags.length ? k.tags : [pick(S, C.TAGS)];
  const dream = pick(S, JOBS.filter(j => j.tags.some(tg => dreamTags.includes(tg)) && !j.fusion)) || pick(S, JOBS);
  const best = JOBS.filter(j => !j.fusion).sort((a, b) => b.salary - a.salary)[ri(S, 0, 10)];
  wait(S, 'kidDream', p.id, { idx: t.idx, dream: dream.id, best: best.id });
};
RESOLVE.kidDream = (S, a, pd) => {
  const p = P(S, pd.pid); const k = p.kids[pd.idx];
  S.pending = null;
  if (a.support) { k.jobId = pd.dream; k.rank = 2; addHappy(p, 10); if (p.spouse != null) p.love = clamp((p.love || 50) + 10, 0, 100); }
  else { k.jobId = pd.best; k.rank = 1; addHappy(p, -10); }
  k.supported = !!a.support;
  ack(S, p.id, `🎓 ${k.name}이(가) ${JOBS[k.jobId].name}이(가) 되었어요!`, [a.support ? '꿈을 응원했어요 · 😊 행복도 +10' : '돈 잘 버는 직업을 권했어요 · 😊 행복도 −10', `월급날마다 자녀 연봉 ${money(Math.round(JOBS[k.jobId].salary * C.RANK_MULT[k.rank - 1]))}`], { bg: 'home' });
};

/* ═════════════ 상점 ═════════════ */
// 대출 한도: 연봉의 8배 (최소 2억) — 지금 빚을 뺀 만큼만 더 빌릴 수 있음
export function loanRoom(S, p) { return Math.max(0, Math.max(20000, salaryOf(S, p) * 8) - p.debt); }
export const canAfford = (S, p, price) => price <= p.money + loanRoom(S, p);
function canShop(S, p) { return isAdultStage(S) && p.job && p.money >= 100; }
TASK.shopAsk = (S, t) => { wait(S, 'shopAsk', t.pid); };
RESOLVE.shopAsk = (S, a, pd) => { S.pending = null; if (a.enter) front(S, { t: 'shop', pid: pd.pid, exact: false }); };
TASK.shop = (S, t) => {
  const p = P(S, t.pid);
  if (!isAdultStage(S) || !p.job) { front(S, { t: 'event', pid: p.id, cell: 'normal' }); return; }
  let free = null;
  if (t.exact && p.cards.length < C.CARD_MAX) { free = pick(S, Object.keys(C.CARDS)); p.cards.push(free); }
  wait(S, 'shop', p.id, { exact: !!t.exact, discount: t.exact ? 0.3 : 0, free });
};
export function shopItems(S, p, discount = 0) {
  const price = v => Math.round(v * (1 - discount));
  const items = [];
  C.CARS.forEach(c => { if (S.market.cars[c.k] == null && p.car !== c.k) items.push({ kind: 'car', k: c.k, name: c.name, icon: c.icon, price: price(c.price), note: c.note, full: !canAfford(S, p, price(c.price)) }); });
  Object.entries(C.CARDS).forEach(([k, c]) => items.push({ kind: 'card', k, name: c.name, icon: c.icon, price: price(c.price), note: c.desc, full: p.cards.length >= C.CARD_MAX }));
  Object.entries(C.INSURANCE).forEach(([k, c]) => { if (!p.insurance[k]) items.push({ kind: 'ins', k, name: c.name, icon: '🛡️', price: price(c.price), note: c.desc }); });
  houseList(S, p).forEach(h => items.push({ ...h, kind: 'house', price: price(h.price), full: !canAfford(S, p, price(h.price) - (p.house.k !== 'room' ? Math.round(p.house.value * 0.5) : 0)) }));
  if (p.house.k !== 'room' && !p.house.smart) items.push({ kind: 'smart', k: 'smart', name: '스마트홈 개조', icon: '🏠', price: price(10000), note: '가사 시간↓ → 호감도·양육 보너스' });
  return items;
}
function houseList(S, p) {
  const sell = p.house.k !== 'room' ? Math.round(p.house.value * 0.5) : 0;
  return C.HOUSES.filter(h => h.k !== 'room' && h.k !== p.house.k && S.market.houses[h.k] == null).map(h => ({ k: h.k, name: h.name, icon: h.icon, price: h.price, note: `아이 최대 ${h.cap}명 · ${h.note}`, ok: canAfford(S, p, h.price - sell) }));
}
RESOLVE.shop = (S, a, pd) => {
  const p = P(S, pd.pid);
  if (a.leave) { S.pending = null; return; }
  const it = shopItems(S, p, pd.discount).find(x => x.kind === a.kind && x.k === a.k);
  if (!it || it.full) return;
  if (it.kind === 'card') { pay(S, p, it.price); p.cards.push(it.k); toast(S, p.id, `${it.icon} ${it.name} 구입`); return; }
  if (it.kind === 'ins') { pay(S, p, it.price); p.insurance[it.k] = true; toast(S, p.id, `🛡️ ${it.name} 가입`); return; }
  if (it.kind === 'car') { buyCar(S, p, it.k, it.price); return; }
  if (it.kind === 'house') { buyHouse(S, p, it.k, it.price); S.pending = null; return; }
  if (it.kind === 'smart') { pay(S, p, it.price); p.house.smart = true; p.love = clamp((p.love || 50) + 10, 0, 100); addHappy(p, 5); toast(S, p.id, '🏠 스마트홈 개조 완료!'); }
};
function buyCar(S, p, k, price) {
  if (p.car) { const old = C.CARS.find(c => c.k === p.car); p.money += Math.round((p.carPaid || old.price) * 0.5); delete S.market.cars[p.car]; }
  pay(S, p, price); p.car = k; p.carPaid = price; S.market.cars[k] = p.id;
  const c = C.CARS.find(x => x.k === k);
  toast(S, p.id, `${c.icon} ${c.name} 구입! 이제 차를 타고 이동해요`);
  log(S, { k: 'car', pid: p.id, car: k });
}
function buyHouse(S, p, k, price) {
  if (p.house.k !== 'room') { p.money += Math.round(p.house.value * 0.5); delete S.market.houses[p.house.k]; }
  pay(S, p, price);
  p.house = { k, value: C.HOUSES.find(h => h.k === k).price, smart: false };
  S.market.houses[k] = p.id;
  const h = C.HOUSES.find(x => x.k === k);
  p.hist.push(`${h.name} 장만`);
  news(S, p.id, `${h.icon} ${p.name} ${h.name} 장만!`);
  addHappy(p, 5);
  front(S, { t: 'gift', pid: p.id, kind: 'house' });
  ack(S, p.id, `${h.icon} ${h.name} 장만!`, [`아이 최대 ${h.cap}명`, h.note, p.debt ? `빚 ${money(p.debt)} — 월급날마다 이자가 나가요` : ''].filter(Boolean), { bg: 'house_' + k, mood: 'g' });
}
TASK.houseCell = (S, t) => {
  const p = P(S, t.pid);
  wait(S, 'house', p.id, { list: houseList(S, p) });
};
RESOLVE.house = (S, a, pd) => {
  const p = P(S, pd.pid);
  S.pending = null;
  if (!a.k) { toast(S, p.id, '🏠 이번엔 집을 사지 않았어요'); return; }
  const h = houseList(S, p).find(x => x.k === a.k && x.ok);
  if (h) buyHouse(S, p, h.k, h.price); else toast(S, p.id, '🏠 대출 한도를 넘어서 살 수 없어요');
};

/* ═════════════ 주식 ═════════════ */
TASK.stock = (S, t) => {
  const p = P(S, t.pid);
  if (!p.job && !p.retired) { front(S, { t: 'event', pid: p.id, cell: 'normal' }); return; }
  wait(S, 'stock', p.id, { amounts: C.STOCK_AMOUNTS });
};
RESOLVE.stock = (S, a, pd) => {
  const p = P(S, pd.pid);
  S.pending = null;
  if (a.sell) {
    const v = p.stocks.reduce((s, x) => s + x.value, 0);
    p.money += v; p.stocks = [];
    ack(S, p.id, '📈 주식을 모두 팔았어요', [`💰 +${money(v)}`], { bg: 'stock' }); return;
  }
  if (a.amount && pd.amounts.includes(a.amount)) front(S, { t: 'fate', pid: p.id, kind: 'stockPick', amount: a.amount });
};
FATE.stockPick = {
  spec: (S, p, t) => {
    const tags = Object.values(C.STOCK_TAG);
    const bonus = [];
    const j = jobOf(p);
    if (j && ['생활설계사(재무)', '빅 데이터 전문가'].includes(j.name)) bonus.push(['직업 특전', 1]);
    if (j && j.name === '소비생활어드바이저') bonus.push(['직업 특전', 1]);
    return { base: '도전', stat: 'int', need: 3, tag: tags.filter(x => p.tags[x] > 0).slice(0, 1)[0] || null, bonus, title: `📈 주식 뽑기 룰렛 (${money(t.amount)})`, bg: 'stock' };
  },
  done: (S, p, res, t) => {
    pay(S, p, t.amount);
    const myTag = C.TAGS.slice().sort((a, b) => p.tags[b] - p.tags[a])[0];
    const goodCo = Object.keys(C.STOCK_TAG).find(k => C.STOCK_TAG[k] === myTag) || pick(S, C.STOCKS);
    const co = res === 'g' ? goodCo : pick(S, C.STOCKS);
    if (res === 'b') { ack(S, p.id, '💥 꽝! 부실 회사 주식…', ['휴지조각이 되었어요', `💰 −${money(t.amount)}`], { bg: 'stock', mood: 'b' }); return; }
    p.stocks.push({ co, value: t.amount, cost: t.amount, good: res === 'g' });
    ack(S, p.id, res === 'g' ? `🌟 유망주! ${co} 주식` : `🙂 보통주 · ${co} 주식`, [`${money(t.amount)}어치 샀어요`, '월급날마다 시장 룰렛으로 값이 바뀌어요'], { bg: 'stock', mood: res });
  },
};

/* ═════════════ 인생역전·은퇴·빚쟁이 ═════════════ */
TASK.reverse = (S, t) => { wait(S, 'reverse', t.pid, { cash: P(S, t.pid).money }); };
RESOLVE.reverse = (S, a, pd) => { S.pending = null; if (a.go) front(S, { t: 'fate', pid: pd.pid, kind: 'reverse' }); else toast(S, pd.pid, '🎲 인생역전은 다음 기회에'); };
FATE.reverse = {
  spec: () => ({ base: '도전', title: '🎲 인생역전 룰렛!', bg: 'stage' }),
  done: (S, p, res) => {
    const before = p.money;
    p.money = Math.round(p.money * { g: 2, n: 1, b: 0.5 }[res]);
    if (res === 'g') news(S, p.id, `🎲 ${p.name} 인생역전! 돈이 두 배!`);
    ack(S, p.id, { g: '🌟 인생역전! 돈이 두 배!', n: '🙂 그대로!', b: '💥 돈이 반으로…' }[res], [`${money(before)} → ${money(p.money)}`], { bg: 'stage', mood: res });
  },
};
TASK.retire = (S, t) => {
  const p = P(S, t.pid);
  if (!p.job) { p.retired = true; return; }
  const sal = salaryOf(S, p);
  const j = jobOf(p);
  const kind = p.job.free ? '보통' : j.kind;
  p.pension = Math.round(sal * C.PENSION_RATE[kind]);
  const sev = Math.round(sal * (kind === '안정' ? 3 : 1));
  p.money += sev;
  p.retired = true;
  p.retiredTitle = jobTitle({ ...p, retired: false });
  p.hist.push('은퇴');
  ack(S, p.id, '🎊 은퇴식!', [`퇴직금 +${money(sev)}`, `이제 월급날마다 연금 ${money(p.pension)}`, kind === '안정' ? '안정형 직업이라 퇴직금이 커요!' : ''].filter(Boolean), { bg: 'party', mood: 'g' });
};
TASK.creditor = (S, t) => {
  const p = P(S, t.pid);
  if (p.debt <= 0) return;
  if (rnd(S) < 0.12) { wait(S, 'wheel', p.id, { purpose: 'forgive', title: '🐱 빚쟁이: "오늘은 기분이 좋아! 룰렛 돌려 볼래?"', labels: ['빚 전부 탕감!', '이자 면제', '평소대로', '평소대로', '이자 면제', '평소대로', '평소대로', '이자 면제', '평소대로', '평소대로'] }); return; }
  const take = Math.min(p.money, Math.round(p.debt * 0.3));
  const lines = [];
  if (take > 0) { p.money -= take; p.debt -= take; lines.push(`💰 ${money(take)}을(를) 가져갔어요`); }
  else { const s = pick(S, ['int', 'str', 'sen']); addStat(p, s, -10); p.luck = Math.max(0, p.luck - 1); lines.push(`돈이 없어서… ${C.STATS[s]} −10, 운세 ↓`); }
  lines.push(`남은 빚 ${money(p.debt)}`);
  ack(S, p.id, '🐱‍👤 빚쟁이가 찾아왔어요!', lines, { bg: 'creditor', mood: 'b' });
};
WHEEL_DONE.forgive = (S, pd, idx) => {
  const p = P(S, pd.pid);
  const l = pd.labels[idx];
  if (l === '빚 전부 탕감!') { const d = p.debt; p.debt = 0; ack(S, p.id, '🎉 빚 전부 탕감!!', [`${money(d)}이(가) 사라졌어요`], { bg: 'creditor', mood: 'g' }); }
  else if (l === '이자 면제') { ack(S, p.id, '🙂 이번엔 그냥 갈게~', ['빚쟁이가 돌아갔어요'], { bg: 'creditor' }); }
  else { const take = Math.min(p.money, Math.round(p.debt * 0.3)); p.money -= take; p.debt -= take; ack(S, p.id, '🐱‍👤 평소대로!', [`💰 ${money(take)}을(를) 가져갔어요`], { bg: 'creditor', mood: 'b' }); }
};

/* ═════════════ 골인·결과 ═════════════ */
TASK.goal = (S, t) => {
  const p = P(S, t.pid);
  const rank = S.players.filter(q => q.goalRank).length + 1;
  p.goalRank = rank;
  news(S, p.id, `🏁 ${p.name} ${rank}등으로 골인!`);
  if (!isAdultStage(S)) { // 성장 모드: 고교 졸업 → 돈 대신 능력치
    const s = C.STATS[p.talent] ? p.talent : 'int';
    const v = [12, 8, 5, 3][rank - 1] || 2;
    addStat(p, s, v);
    ack(S, p.id, `🎓 ${rank}등으로 졸업!`, [`졸업 보너스 ${C.STATS[s]} +${v}`, '게임이 끝날 때까지 차례마다 졸업 준비로 능력치를 키워요'], { bg: 'goal', mood: 'g' });
    return;
  }
  const bonus = [20000, 10000, 5000, 3000][rank - 1] || 2000;
  p.money += bonus;
  ack(S, p.id, `🏁 ${rank}등으로 골인!`, [`골인 보너스 +${money(bonus)}`, '게임이 끝날 때까지 차례마다 노후 룰렛으로 돈을 늘려요'], { bg: 'goal', mood: 'g' });
};

export function assets(S, p) {
  const house = p.house.k === 'room' ? 0 : p.house.value;
  const car = p.car ? Math.round((p.carPaid || 0) * 0.5) : 0;
  const stock = p.stocks.reduce((s, x) => s + x.value, 0);
  const souvenir = p.souvenirs.reduce((s, id) => s + souvenirValue(S, P(S, id)), 0);
  const debt = Math.round(p.debt * 1.2);
  const medal = p.green * C.GREEN_REWARD;
  const total = p.money + house + car + stock + souvenir - debt + medal;
  return { cash: p.money, house, car, stock, souvenir, debt, medal, total };
}
export function souvenirValue(S, f) {
  const r = f.job && !f.job.free ? f.job.rank : 1;
  return C.SOUVENIR_VALUE[r - 1];
}
export function medalOf(p) { return C.MEDALS.find(([n]) => p.green >= n) || null; }

TASK.gameEnd = (S) => {
  S.over = true;
  const growth = S.mode === 'growth';
  const rows = S.players.map(p => {
    if (growth) {
      const g = ['int', 'str', 'sen'].reduce((s, k) => s + grade(p, k), 0);
      const tags = C.TAGS.reduce((s, t) => s + p.tags[t], 0);
      const score = g * 10 + tags * 5 + p.awards.length * 10 + p.green * 3;
      const rec = JOBS.filter(j => qualifies(p, j, p.school === 'general' ? 2 : 1).ok).sort((a, b) => b.tags.reduce((s, t) => s + p.tags[t], 0) - a.tags.reduce((s, t) => s + p.tags[t], 0) || b.tier - a.tier).slice(0, 3).map(j => j.id);
      return { pid: p.id, score, rec, title: growthTitle(p) };
    }
    const a = assets(S, p);
    return { pid: p.id, score: a.total, assets: a, medal: medalOf(p), title: lifeTitle(S, p) };
  }).sort((x, y) => y.score - x.score);
  rows.forEach((r, i) => { r.rank = i + 1; });
  S.results = { growth, rows };
  log(S, { k: 'end' });
  wait(S, 'results', null);
};
RESOLVE.results = () => {};

// 교사 화면 결과 탭에 저장할 한 사람의 기록 (학생 기기·교사 화면이 같은 내용을 씀)
export function resultRecord(S, pid) {
  const p = P(S, pid), R = S.results, r = R.rows.find(x => x.pid === pid);
  const j = jobOf(p);
  return {
    nick: p.name, rank: r.rank, score: r.score, title: r.title, growth: R.growth, mode: S.mode,
    job: p.retiredTitle || jobTitle(p) || '', field: j ? j.field : (p.job && p.job.free ? '프리랜서' : ''),
    jobGreen: !!(j && j.green), founder: !!(j && j.titles === '창업') || p.hist.includes('창업 도전'),
    hist: p.hist.slice(0, 30), awards: p.awards.slice(0, 20),
    grades: ['int', 'str', 'sen'].map(s => C.GRADES[grade(p, s)]).join(''),
    tags: C.TAGS.filter(t => p.tags[t]).map(t => `${t}${p.tags[t]}`).join(' '),
    green: p.green, happy: p.happy, medal: r.medal ? r.medal[2] : '', kids: p.kids.length, married: p.spouse != null,
    money: R.growth ? 0 : r.assets.total, club: p.club || '', school: p.school || '',
  };
}

function growthTitle(p) {
  if (p.awards.length >= 3) return `대회 ${p.awards.length}관왕`;
  const top = ['int', 'str', 'sen'].sort((a, b) => p.stats[b] - p.stats[a])[0];
  const club = C.CLUBS.find(c => c.k === p.club);
  return `${{ int: '똑똑한', str: '튼튼한', sen: '센스 넘치는' }[top]} ${club ? club.name.replace(/ 동아리$/, '') : ''} ${{ general: '일반고', special: '특성화고', meister: '마이스터고' }[p.school] || ''} 졸업생`.replace(/\s+/g, ' ').trim();
}
function lifeTitle(S, p) {
  const m = medalOf(p);
  const j = p.retiredTitle || jobTitle(p);
  if (p.green >= 20) return `돈보다 사람을 먼저 생각한 ${j.split(' · ')[0]}`;
  if (p.job && !p.job.free && p.job.rank === 5) return `꿈을 이룬 ${j.split(' · ')[1] || ''} ${j.split(' · ')[0]}`.trim();
  if (p.kids.length >= 5) return `${p.kids.length + 2}식구 대가족의 ${j.split(' · ')[0]}`;
  if (p.stocks.length >= 3) return '주식의 신';
  if (p.house.k !== 'room' && C.HOUSES.findIndex(h => h.k === p.house.k) >= 5) return `${C.HOUSES.find(h => h.k === p.house.k).name}의 주인`;
  if (m) return `${m[2]}을 받은 ${j.split(' · ')[0]}`;
  return `행복한 ${j.split(' · ')[0] || '사람'}`;
}

/* ═════════════ COM (컴퓨터 플레이어) ═════════════ */
export function aiAction(S) {
  const pd = S.pending; if (!pd) return null;
  const p = pd.pid != null ? P(S, pd.pid) : null;
  const r = () => rnd({ rng: S.rng ^ (S.seq * 7919) }); // 상태를 흔들지 않는 가짜 난수
  switch (pd.type) {
    case 'preSpin': return { a: 'spin' };
    case 'wheel': case 'fate': return { a: 'spin' };
    case 'ack': return { a: 'ok' };
    case 'carPick': { const score = { payday: 5, lucky: 4, verylucky: 5, love: 3, job: 3, shop: 2, unlucky: -3, normal: 1 }; const best = pd.options.slice().sort((a, b) => (score[b.type] || 0) - (score[a.type] || 0))[0]; return { steps: best.steps }; }
    case 'branch': return { lane: r() < 0.5 ? 0 : 1 };
    case 'event': { const ev = findEvent(pd.eid); const costly = i => (ev.ch[i].e && (ev.ch[i].e.money || 0) < 0); const opts = pd.avail.filter(i => p.money > 2000 || !costly(i)); return { i: (opts.length ? opts : pd.avail)[Math.floor(r() * (opts.length || pd.avail.length))] }; }
    case 'pickClub': return { club: C.CLUBS[Math.floor(r() * C.CLUBS.length)].k };
    case 'pickSchool': return { school: C.HIGH_SCHOOLS[Math.floor(r() * 3)].k };
    case 'pickTag': return { tag: C.TAGS.slice().sort((a, b) => p.tags[b] - p.tags[a])[0] };
    case 'pickDept': return { dept: pd.depts[0] };
    case 'pickCareer': return { career: grade(p, 'int') >= 3 ? 'uni4' : r() < 0.4 ? 'uni2' : r() < 0.85 ? 'job' : 'startup' };
    case 'careerSetup': return pd.step === 'talent' ? { talent: 'int' } : pd.step === 'school' ? { school: 'general' } : { tags: [C.TAGS[0], C.TAGS[1]] };
    case 'pickJob': { const ok = pd.cards.filter(c => c.ok).map(c => JOBS[c.id]).sort((a, b) => b.salary - a.salary); if (pd.change) return ok.length && ok[0].salary > salaryOf(S, p) ? { id: ok[0].id } : { stay: true }; return ok.length ? { id: ok[0].id } : { free: true }; }
    case 'loveMenu': return pd.contacts.length && r() < 0.6 ? { npc: pd.contacts[0] } : pd.canMeet ? { meet: true } : { skip: true };
    case 'datePick': return { place: pd.places[pd.places.length > 1 && p.money > 500 ? 1 : 0] };
    case 'dateEnd': return pd.spouse ? (pd.canBaby && pd.love >= 70 ? { baby: true } : {}) : (pd.love >= 60 ? { propose: true } : {});
    case 'shopAsk': return { enter: !p.car && p.money > 3000 };
    case 'shop': { const items = shopItems(S, p, pd.discount); const car = items.find(i => i.kind === 'car' && !p.car && i.price < p.money * 0.5); if (car) return { kind: 'car', k: car.k }; const ins = items.find(i => i.kind === 'ins' && i.price < p.money * 0.1); if (ins && r() < 0.5) return { kind: 'ins', k: ins.k }; return { leave: true }; }
    case 'house': { const can = pd.list.filter(h => h.ok && h.price <= p.money + salaryOf(S, p) * 4).sort((a, b) => b.price - a.price); return can.length && r() < 0.8 ? { k: can[0].k } : {}; }
    case 'stock': return p.money > 8000 && r() < 0.5 ? { amount: C.STOCK_AMOUNTS[1] } : (p.stocks.length && r() < 0.3 ? { sell: true } : {});
    case 'reverse': return { go: r() < 0.4 };
    case 'kidDream': return { support: r() < 0.6 };
    case 'quiz': return null; // COM 답은 엔진이 자동으로
    default: return null;
  }
}
// 판(지도·상태)을 처음부터 다시 그리는 화면을 위해 내보냄
export { C, JOBS, TITLES, findEvent, isAdultStage };
