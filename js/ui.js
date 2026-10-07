// 화면: 시작 → 준비 → 게임판(지도·상태창·룰렛·이벤트) → 결과
import * as E from './engine.js';
import * as A from './art.js';
import * as Lobby from './lobby.js';
import * as SND from './sound.js';
import * as TW from './town.js';
const { C, JOBS, TITLES } = E;

const $ = (s, r = document) => r.querySelector(s);
const stage = $('#stage');
const app = { S: null, seen: 0, busy: false, cfg: null, pos: {}, maxK: 0, camX: 0, comTimer: null, view: null, edit: null, quizStart: 0, boardSig: '', net: null, peek: false };
const P = id => app.S.players[id];
let FAST = new URLSearchParams(location.search).has('fast'); // 빠른 재생 (?fast · 시험용 학번의 ⏩ 버튼)
const canFast = () => new URLSearchParams(location.search).has('fast') || !!(app.net && app.net.N && app.net.sid === app.net.N.TEST_SID);
const sleep = ms => new Promise(r => setTimeout(r, FAST ? ms / 10 : ms));
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const J = o => esc(JSON.stringify(o));
const money = E.money;
const ageOf = (S = app.S) => A.STAGE_AGE[C.STAGES[S.stage].k];

/* ───── 화면 크기 맞추기 ───── */
function fit() {
  const s = Math.min(innerWidth / 1280, innerHeight / 720) * 0.985;
  stage.style.transform = `translate(-50%, -50%) scale(${s})`;
}
addEventListener('resize', fit); fit();

/* ───── 클릭 처리 (data-a: 게임 행동, data-ui: 화면 명령) ───── */
// 브라우저 '뒤로' 버튼 = 화면 안 '← 뒤로' (한 단계씩). 크롬은 사람이 누른 뒤에 만든 기록만 인정해서 누를 때마다 다시 걸어 둠
let backArmed = false;
const armBack = () => { if (!backArmed) { history.pushState({ tlg: 1 }, ''); backArmed = true; } };
addEventListener('popstate', () => {
  backArmed = false;
  const back = document.querySelector('#stage [data-back]');
  if (back) { back.click(); return; }
  if (document.querySelector('#title')) { history.back(); return; } // 처음 화면이면 진짜로 뒤로
  armBack(); toast('게임 중에는 뒤로 갈 수 없어요');
});
document.addEventListener('click', e => {
  armBack();
  const t = e.target.closest('[data-a],[data-ui]');
  if (!t || t.disabled) return;
  SND.sfx('click');
  if (t.dataset.a) send(JSON.parse(t.dataset.a), true);
  else UI[JSON.parse(t.dataset.ui).k]?.(JSON.parse(t.dataset.ui), t);
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && $('#ov.on .dlg') && !e.target.matches('input, textarea, button')) { e.preventDefault(); UI.dlg(); }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.name != null && app.cfg) { app.cfg.players[+t.dataset.name].name = t.value.slice(0, 6); }
});

/* ═════════════ 시작 화면 ═════════════ */
const SAMPLE = [{ hair: 0, hairColor: 0, outfit: 9 }, { hair: 3, hairColor: 2, outfit: 13 }, { hair: 1, hairColor: 3, outfit: 5 }, { hair: 4, hairColor: 1, outfit: 8 }];
function showTitle() {
  clearCom(); leaveOnline();
  const ages = ['baby', 'kid', 'elem', 'mid', 'high', 'adult', 'elder'];
  stage.innerHTML = `<div class="screen" id="title"><div style="text-align:center">
    <div class="people">${ages.map((a, i) => A.fullSvg(SAMPLE[i % 4], { age: a, gender: i % 2 ? 'f' : 'm', mood: 'g' }, 92, 170)).join('')}</div>
    <div class="logo">기술인생게임</div>
    <div class="sub">아기부터 노년까지, 나의 기술 진로 인생!</div>
    <div class="row">
      <button class="btn y big" data-ui='{"k":"joinClass"}'>🏫 수업 참가</button>
      <button class="btn p big" data-ui='{"k":"free"}'>🎲 친구와 온라인</button>
      <button class="btn w big" data-ui='{"k":"setup"}'>🎮 이 기기에서</button>
      ${savedGame() ? `<button class="btn w big" data-ui='{"k":"resume"}'>▶ 이어하기</button>` : ''}
    </div>
    <div class="row" style="margin-top:14px"><span class="muted">수업 참가: 수업 코드 + 학번 · 친구와 온라인: 방 코드 · 이 기기에서: 혼자 COM과, 또는 한 기기로 번갈아</span></div>
  </div><a class="tlink" href="teacher.html">👩‍🏫 선생님 화면</a><div class="sndbox">${SND.ctlHtml()}</div></div>`;
  SND.setPolicy('all'); SND.bgm('title');
}

/* ───── 하던 게임 저장 (새로고침·창 닫기에도 이어하기) ───── */
function saveGame() { if (app.net) return; try { if (app.S && !app.S.over) localStorage.setItem('tlg_game', JSON.stringify(app.S)); else localStorage.removeItem('tlg_game'); } catch {} }
function savedGame() { try { const g = JSON.parse(localStorage.getItem('tlg_game')); return g && !g.over ? g : null; } catch { return null; } }
function resumeGame() {
  const g = savedGame(); if (!g) return showTitle();
  app.S = g; app.seen = g.seq; app.busy = false; app.boardSig = '';
  buildGameScreen(); camTo(P(g.cur).pos, true); sync();
}

/* ═════════════ 준비 화면 ═════════════ */
function defaultCfg() {
  return { mode: 'life', players: [
    { on: true, name: '나', gender: 'm', isCom: false, look: { skin: 0, hair: 0, hairColor: 0, outfit: 9, item: 'none' } },
    { on: true, name: 'COM1', gender: 'f', isCom: true, look: { skin: 1, hair: 3, hairColor: 2, outfit: 13, item: 'none' } },
    { on: true, name: 'COM2', gender: 'm', isCom: true, look: { skin: 2, hair: 1, hairColor: 3, outfit: 5, item: 'none' } },
    { on: true, name: 'COM3', gender: 'f', isCom: true, look: { skin: 0, hair: 4, hairColor: 1, outfit: 8, item: 'none' } },
  ] };
}
function showSetup() {
  app.cfg = app.cfg || loadCfg() || defaultCfg();
  renderSetup();
}
function renderSetup() {
  const c = app.cfg;
  stage.innerHTML = `<div class="screen" id="setup">
    <div style="display:flex;justify-content:space-between;align-items:center"><div class="title-big">🎮 게임 준비</div><div style="display:flex;gap:10px;align-items:center">${SND.ctlHtml()}<button class="btn w sm" data-back data-ui='{"k":"title"}'>← 처음으로</button></div></div>
    <div class="modes">${Object.entries(C.MODES).map(([k, m]) => `<div class="mode ${c.mode === k ? 'on' : ''}" data-ui='${J({ k: 'mode', v: k })}'><b>${m.name}</b><span>${m.desc}</span></div>`).join('')}</div>
    <div class="players">${c.players.map((p, i) => `<div class="pcard ${p.on ? '' : 'off'}">
        <div style="position:absolute;right:10px;top:10px">${i ? `<button class="btn sm ${p.on ? 'w' : 'p'}" data-ui='${J({ k: 'pon', i })}'>${p.on ? '빼기' : '넣기'}</button>` : ''}</div>
        <div style="height:150px;display:grid;place-items:end center">${p.isCom ? A.robotFull(90, 150) : A.fullSvg(p.look, { age: 'adult', gender: p.gender }, 90, 150)}</div>
        <input data-name="${i}" maxlength="6" value="${esc(p.name)}" ${p.on ? '' : 'disabled'} placeholder="별명">
        <div class="seg"><button class="${p.isCom ? '' : 'on'}" data-ui='${J({ k: 'pcom', i, v: false })}'>🙂 사람</button><button class="${p.isCom ? 'on' : ''}" data-ui='${J({ k: 'pcom', i, v: true })}'>🤖 COM</button></div>
        <div class="seg"><button class="${p.gender === 'm' ? 'on' : ''}" data-ui='${J({ k: 'pgen', i, v: 'm' })}'>남자</button><button class="${p.gender === 'f' ? 'on' : ''}" data-ui='${J({ k: 'pgen', i, v: 'f' })}'>여자</button></div>
        ${p.isCom ? '<div class="muted" style="font-size:14px">컴퓨터가 대신 해요</div>' : `<button class="btn p sm" data-ui='${J({ k: 'edit', i })}'>✨ 꾸미기</button>`}
      </div>`).join('')}</div>
    <div style="display:flex;justify-content:flex-end;align-items:center">
      <button class="btn y big" data-ui='{"k":"start"}'>▶ 게임 시작!</button>
    </div>
  </div>`;
}
function saveCfg() { try { localStorage.setItem('tlg_cfg', JSON.stringify(app.cfg)); } catch {} }
function loadCfg() { try { return JSON.parse(localStorage.getItem('tlg_cfg')); } catch { return null; } }

/* ───── 아바타 꾸미기 ───── */
function openEditor(t, done) { app.editT = t; app.editDone = done; app.editTab = 'hair'; renderEditor(); }
// 꾸미기: 원작처럼 부위별 탭 + 그림으로 고르기 (머리·눈·입·윗옷·아랫옷·신발은 모양과 색 따로)
const EDIT_TABS = [['hair', '💇 머리'], ['face', '😀 얼굴'], ['top', '👕 윗옷'], ['bottom', '👖 아랫옷'], ['shoes', '👟 신발'], ['item', '🎀 소품']];
function renderEditor() {
  const p = app.editT, g = p.gender, tab = app.editTab || 'hair';
  const L = p.look = { ...A.lookOf(p.look, g), item: (p.look && p.look.item) || 'none' };
  const sw = (f, arr) => `<div class="row">${arr.map((col, v) => `<div class="sw ${L[f] === v ? 'on' : ''}" style="background:${col}" data-ui='${J({ k: 'eset', f, v })}'></div>`).join('')}</div>`;
  const thumbs = (f, names, draw) => `<div class="thumbs">${names.map((nm, v) => `<div class="th ${L[f] === v ? 'on' : ''}" data-ui='${J({ k: 'eset', f, v })}'>${draw({ ...L, [f]: v })}<span>${nm}</span></div>`).join('')}</div>`;
  const face = l => A.faceSvg(l, g, 'adult', 60);
  const part = box => l => A.cropSvg(l, { age: 'adult', gender: g }, box, 64, 64);
  const items = Object.entries(A.ITEMS).map(([k, nm]) => `<span class="tchip ${L.item === k ? 'on' : ''}" data-ui='${J({ k: 'eset', f: 'item', v: k })}'>${nm}</span>`).join('');
  const pane = {
    hair: `<h4>머리 모양</h4>${thumbs('hair', A.HAIR_STYLES, face)}<h4>머리색</h4>${sw('hairColor', A.HAIR_COLORS)}`,
    face: `<h4>피부색</h4>${sw('skin', A.SKINS)}<h4>눈</h4>${thumbs('eyes', A.EYES, face)}<h4>눈 색</h4>${sw('eyeColor', A.EYE_COLORS)}<h4>입</h4>${thumbs('mouth', A.MOUTHS, face)}`,
    top: `<h4>윗옷 모양</h4>${thumbs('top', A.TOPS, part(A.BOX.top))}<h4>윗옷 색</h4>${sw('outfit', A.CLOTHES)}`,
    bottom: `<h4>아랫옷 모양</h4>${thumbs('bottom', A.BOTTOMS, part(A.BOX.bottom))}<h4>아랫옷 색 <small class="muted">(원피스는 윗옷 색)</small></h4>${sw('bottomColor', A.BOTTOM_COLORS)}`,
    shoes: `<h4>신발 모양</h4>${thumbs('shoes', A.SHOES, part(A.BOX.shoes))}<h4>신발 색</h4>${sw('shoeColor', A.SHOE_COLORS)}`,
    item: `<h4>소품 (아기 때부터 노년까지 따라가요!)</h4><div class="row">${items}</div><h4>소품 색 <small class="muted">(모자·머리띠·리본·안전모·목도리 등)</small></h4><div class="row"><div class="sw dflt ${L.itemColor == null ? 'on' : ''}" data-ui='${J({ k: 'eset', f: 'itemColor', v: null })}' title="소품마다 원래 색">기본</div>${A.COLORS.map((col, v) => `<div class="sw ${L.itemColor === v ? 'on' : ''}" style="background:${col}" data-ui='${J({ k: 'eset', f: 'itemColor', v })}'></div>`).join('')}</div>`,
  }[tab];
  const ages = ['kid', 'elem', 'mid', 'adult', 'elder'];
  ov(`<div class="modal"><h2>✨ ${esc(p.name || '내 캐릭터')} 꾸미기</h2><div class="editor">
    <div><div class="prev">${A.fullSvg(L, { age: 'adult', gender: g }, 220, 360)}</div>
      <div class="ages" title="나이별 모습 (중·고등학교 때는 교복)">${ages.map(a => A.fullSvg(L, { age: a, gender: g }, 50, 84)).join('')}</div></div>
    <div class="opts"><div class="etabs">${EDIT_TABS.map(([k, nm]) => `<button class="${tab === k ? 'on' : ''}" data-ui='${J({ k: 'etab', v: k })}'>${nm}</button>`).join('')}</div>
      <div class="epane">${pane}</div>
      <div class="ebtns"><button class="btn w" data-ui='{"k":"erand"}'>🎲 아무거나</button><button class="btn y" data-ui='{"k":"edone"}'>다 했어요!</button></div>
    </div></div></div>`);
}

const UI = {
  title: () => { lobby.stop(); showTitle(); },
  sndFx: () => { SND.toggle('fx'); SND.refreshCtl(); },
  jobAsk: o => {
    const pd = app.S.pending, p = P(pd.pid), j = JOBS[o.id], from = E.jobTitle(p).split(' · ')[0];
    confirmBox(`${from ? `'${from}'에서 ` : ''}'${j.name}'(으)로 ${pd.change ? '이직' : '취업'}할까요?`, [['첫 직함', TITLES[j.titles][0]], ['수입', salText(j)], ['필요 능력치', j.req.map(([s, g]) => `${C.STATS[s]} ${C.GRADES[g]}`).join(' · ')]], { id: o.id });
  },
  buyAsk: o => { // 집 장만 칸(kind 없음) · 상점 차·집 — 엔진과 같은 계산 (헌 집·차는 50%에 팔고, 모자라면 대출)
    const S = app.S, pd = S.pending, p = P(pd.pid);
    const it = o.kind ? E.shopItems(S, p, pd.discount).find(x => x.kind === o.kind && x.k === o.key) : (pd.list || []).find(x => x.k === o.key); if (!it) return;
    const car = o.kind === 'car', sell = car ? (p.car ? Math.round((p.carPaid || C.CARS.find(c => c.k === p.car).price) * 0.5) : 0) : p.house.k !== 'room' ? Math.round(p.house.value * 0.5) : 0;
    const need = it.price - sell - p.money;
    confirmBox(`${it.name}을(를) 구입할까요?`, [['소지금', money(p.money)], ...(sell ? [[`지금 ${car ? '차' : '집'} 판 돈 (50%)`, '+' + money(sell)]] : []), ['가격', money(it.price)], ...(need > 0 ? [['모자란 돈은 대출', money(need)]] : [])], o.kind ? { kind: o.kind, k: o.key } : { k: o.key });
  },
  cfmNo: () => { const c = $('#ov .cfm2'); if (c) c.remove(); },
  ff: () => { FAST = !FAST; toast(FAST ? '⏩ 빨리 감기 (테스트용)' : '▶ 보통 속도로'); renderHUD(); },
  testExit: () => { if (Date.now() - (app.exitAt || 0) > 3000) { app.exitAt = Date.now(); toast('🏠 한 번 더 누르면 테스트를 끝내고 처음 화면으로 가요'); return; } app.exitAt = 0; UI.title(); },
  dlg: () => { if (app.typeIv) { app.typeSkip(); return; } if (app.dlgOk && Date.now() - (app.dlgAt || 0) > 250) { app.dlgOk = false; send({ a: 'ok' }); } },
  sndBgm: () => { SND.toggle('bgm'); SND.refreshCtl(); },
  resume: () => resumeGame(),
  setup: () => showSetup(),
  mode: o => { app.cfg.mode = o.v; renderSetup(); },
  pon: o => { app.cfg.players[o.i].on = !app.cfg.players[o.i].on; renderSetup(); },
  pcom: o => { const p = app.cfg.players[o.i]; p.isCom = o.v; if (o.v && !/^COM/.test(p.name)) p.name = 'COM' + o.i; if (!o.v && /^COM/.test(p.name)) p.name = '플레이어' + (o.i + 1); renderSetup(); },
  pgen: o => { app.cfg.players[o.i].gender = o.v; renderSetup(); },
  edit: o => openEditor(app.cfg.players[o.i], renderSetup),
  eset: o => { app.editT.look[o.f] = o.v; renderEditor(); },
  etab: o => { app.editTab = o.v; renderEditor(); },
  erand: () => {
    const R = n => Math.floor(Math.random() * n), it = Object.keys(A.ITEMS);
    app.editT.look = { skin: R(A.SKINS.length), hair: R(A.HAIR_STYLES.length), hairColor: R(A.HAIR_COLORS.length), eyes: R(A.EYES.length), eyeColor: Math.random() < 0.6 ? 0 : R(A.EYE_COLORS.length), itemColor: Math.random() < 0.5 ? null : R(A.COLORS.length), mouth: R(A.MOUTHS.length), top: R(A.TOPS.length), outfit: R(A.CLOTHES.length),
      bottom: R(A.BOTTOMS.length), bottomColor: R(A.BOTTOM_COLORS.length), shoes: R(A.SHOES.length), shoeColor: R(A.SHOE_COLORS.length), item: Math.random() < 0.6 ? 'none' : it[R(it.length)] };
    renderEditor();
  },
  edone: () => { closeOv(); const f = app.editDone; app.editDone = null; f && f(); },
  start: () => startGame(),
  closeOv: () => { closeOv(); renderPending(); },
  again: () => { const net = app.net; if (net) net.N.set(net.N.R(`rooms/${net.rid}/again/${net.sid}`), true).catch(() => {}); },
  toLobby: () => toLobby(),
  reflect: () => showReflect(),
  reflectSave: () => saveReflect(),
  status: o => showStatus(o.pid ?? viewPid()),
  map: () => showMap(),
  cards: () => showCards(),
  usecard: o => { if (o.card === 'pick') { showPickNumber(o.i); return; } closeOv(); SND.sfx('card'); send({ a: 'card', i: o.i }); },
  picknum: o => { closeOv(); SND.sfx('card'); send({ a: 'card', i: o.i, value: o.v }); },
  report: o => showReport(o.pid),
  results: () => renderResults(),
  graph: () => showGraph(),
  print: o => printReport(o.pid),
  newgame: () => { app.S = null; showSetup(); },
  quizAns: o => send({ pid: o.pid, c: o.c, ms: Date.now() - app.quizStart }),
};

/* ═════════════ 게임 시작 ═════════════ */
function startGame() {
  const c = app.cfg;
  const players = c.players.filter(p => p.on).map((p, i) => ({ name: (p.name || (p.isCom ? 'COM' + i : '플레이어' + (i + 1))).slice(0, 6), gender: p.gender, look: { ...p.look, item: p.look.item === 'none' ? null : p.look.item }, isCom: p.isCom }));
  if (!players.length) return;
  saveCfg();
  app.S = E.newGame({ mode: c.mode, players }); // 퀴즈는 늘 켜짐 (끄기는 선생님 화면의 수업 설정에서만)
  app.seen = 0; app.busy = false; app.boardSig = '';
  buildGameScreen();
  sync();
}

function buildGameScreen() {
  stage.innerHTML = `<div class="screen" id="game">
    <div id="board"><div id="world"></div></div>
    <div id="hud"></div><div id="turninfo"></div><div id="plist"></div><div id="testbar"></div>
    <div id="menu"></div><div id="spinbox"></div>
    <div id="ov"></div><div id="splash"></div><div id="toasts"></div><div id="banner"></div>
    <div id="timer"></div><div id="conn">📡 연결이 끊겼어요… 다시 연결하는 중</div>
    <div id="pause"><div><div style="font-size:90px">⏸️</div><div class="jua" style="font-size:46px">잠깐 쉬어요!</div><div style="font-size:22px;margin-top:8px">선생님이 다시 시작하면 그 자리부터 이어서 해요</div></div></div>
  </div>`;
  layoutBoard();
  drawBoard();
  drawTokens(true);
  renderHUD();
  SND.bgm(app.S.over ? 'result' : SND.trackOfStage(C.STAGES[app.S.stage].k));
}

/* ═════════════ 지도 ═════════════ */
const CW = 118;
function layoutBoard() {
  const cells = app.S.board.cells;
  const pos = {}; let k = 0, laneBase = null, laneIdx = [0, 0];
  for (const c of cells) {
    if (c.lane != null) {
      if (laneBase == null) { laneBase = k; laneIdx = [0, 0]; }
      laneIdx[c.lane]++;
      const kk = laneBase + laneIdx[c.lane];
      pos[c.id] = { k: kk, lane: c.lane };
      continue;
    }
    if (laneBase != null) { k = laneBase + Math.max(...laneIdx) + 1; laneBase = null; }
    else k++;
    pos[c.id] = { k, lane: null, gap: c.type === 'start' };
  }
  let maxK = 0;
  for (const id in pos) {
    const p = pos[id];
    const wave = Math.sin(p.k / 4.2) * 70;
    p.x = 160 + p.k * CW;
    p.y = 420 + wave + (p.lane == null ? 0 : p.lane === 0 ? -95 : 95);
    maxK = Math.max(maxK, p.k);
  }
  app.pos = pos; app.maxK = maxK;
}
function stageRanges() {
  const S = app.S, r = {};
  S.board.cells.forEach(c => { const x = app.pos[c.id].x; (r[c.stage] ||= [x, x]); r[c.stage][0] = Math.min(r[c.stage][0], x); r[c.stage][1] = Math.max(r[c.stage][1], x); });
  return r;
}
// 원작처럼: 풀밭 위 마을 + 노란 길 (단계마다 동네 풍경이 바뀜)
function drawBoard() {
  const S = app.S, W = app.pos ? 160 * 2 + (app.maxK + 2) * CW : 2000;
  const ranges = stageRanges();
  const main = S.board.cells.filter(c => c.lane == null).map(c => app.pos[c.id]).sort((a, b) => a.k - b.k);
  // 길: 칸이 이어진 곳끼리 한 줄 (갈림길 사이 가운데에는 길이 없음) + 갈림길 두 갈래
  const segs = []; let seg = [];
  main.forEach((p, i) => { if (i && p.k - main[i - 1].k > 1) { segs.push(seg); seg = []; } seg.push(p); });
  if (seg.length) segs.push(seg);
  const forks = [];
  S.board.cells.filter(c => c.type === 'branch').forEach(b => {
    let x1 = app.pos[b.id].x;
    b.next.forEach(nid => {
      const pts = [app.pos[b.id]]; let id = nid, guard = 0;
      while (S.board.cells[id].lane != null && guard++ < 20) { pts.push(app.pos[id]); id = S.board.cells[id].next[0]; }
      pts.push(app.pos[id]); x1 = Math.max(x1, app.pos[id].x);
      segs.push(pts);
    });
    forks.push([app.pos[b.id].x, x1]);
  });
  const line = pts => `M ${pts.map(p => `${p.x} ${p.y}`).join(' L ')}`;
  // 장식이 길과 겹치지 않게: x 위치의 길 높이와 차지하는 폭
  const roadAt = x => {
    let i = main.findIndex(p => p.x >= x); if (i < 0) i = main.length - 1; if (i === 0) i = 1;
    const a = main[Math.max(0, i - 1)], b = main[Math.min(main.length - 1, i)];
    const t = b.x === a.x ? 0 : Math.max(0, Math.min(1, (x - a.x) / (b.x - a.x)));
    return { y: a.y + (b.y - a.y) * t, half: forks.some(([f0, f1]) => x > f0 - 70 && x < f1 + 70) ? 160 : 64 };
  };
  const st0 = Object.keys(ranges).map(Number);
  let town = '', signs = '';
  st0.forEach((si, n) => {
    const [x0, x1] = ranges[si], st = C.STAGES[si];
    const L = n === 0 ? 0 : x0 - CW / 2 - 40, R = n === st0.length - 1 ? W : x1 + CW / 2 + 40;
    town += TW.townLayer(st.k, si, L, R, roadAt);
    signs += TW.signSvg(x0 + 8, roadAt(x0).y - 128, st.name);
  });
  $('#world').innerHTML = `<svg width="${W}" height="720" id="worldsvg">${TW.townDefs()}${town}${TW.roadSvg(segs.map(line))}${signs}<g id="cells">${cellsSvg()}</g><g id="tokens"></g><g id="emote"></g></svg>`;
  $('#world').style.width = W + 'px';
  app.boardSig = boardSig();
}
function cellsSvg() {
  const S = app.S;
  return S.board.cells.map(c => {
    const p = app.pos[c.id], info = C.CELL_INFO[c.type] || C.CELL_INFO.normal;
    const big = ['gate', 'goal', 'house'].includes(c.type);
    const s = big ? 104 : 84;
    let label = info.name;
    if (c.type === 'gate') label = gateLabel(c.stage);
    if (c.type === 'patent' && c.owner != null) label = `${S.players[c.owner].name} 특허`;
    if (c.type === 'start') return `<g transform="translate(${p.x} ${p.y})"><ellipse cy="10" rx="30" ry="9" fill="rgba(0,0,0,.15)"/><circle r="30" fill="#fff" stroke="#E59B2E" stroke-width="5"/><text y="12" text-anchor="middle" font-size="30">🚩</text></g>`;
    const arch = c.type === 'gate' || c.type === 'goal' ? TW.archSvg(p.x, p.y, c.type === 'goal', label) : '';
    return arch + TW.tileSvg(p.x, p.y, s, info.color, info.icon === '•' ? '🙂' : info.icon, label, c.id);
  }).join('');
}
function gateLabel(si) {
  const k = C.STAGES[si].k;
  return { baby: '쑥쑥 문', kid: '초등 입학', elem: '중학 입학', mid: '고교 선택', high: '진로 선택', college: '첫 직업', young: '중년으로', middle: '은퇴', elder: '골인' }[k];
}
function boardSig() { return app.S.board.cells.filter(c => c.type === 'patent').length + ''; }

function tokenSvg(p) {
  const S = app.S;
  const age = ageOf();
  const face = p.isCom ? `<g transform="translate(-26 -70) scale(0.65)">${robotInner()}</g>` : `<svg x="-34" y="-82" width="68" height="68" viewBox="${A.headBox(age)}">${A.avatar(p.look, { age, gender: p.gender })}</svg>`;
  const sk = C.STAGES[S.stage].k;
  const car = p.car && C.STAGES[S.stage].adult ? C.CARS.find(c => c.k === p.car).icon : sk === 'baby' ? '🍼' : (sk === 'kid' || sk === 'elem') ? '' : '🚲';
  return `<g class="token" id="tok${p.id}"><ellipse cy="10" rx="20" ry="7" fill="rgba(0,0,0,.25)"/>${car ? `<text x="34" y="8" text-anchor="middle" font-size="30">${car}</text>` : ''}<path d="M-15 -24 L0 8 L15 -24 Z" fill="${PCOL[p.id]}" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><circle cy="-48" r="34" fill="#fff" stroke="${PCOL[p.id]}" stroke-width="6"/>${face}<g transform="translate(26 -78)"><circle r="13" fill="${PCOL[p.id]}"/><text y="6" text-anchor="middle" font-size="16" class="cell-t" fill="#fff">${p.id + 1}</text></g></g>`;
}
const PCOL = ['#FF6B6B', '#4AB8FF', '#1BAF7A', '#B07AFF']; // 색약 검사 통과 (빨강↔초록 구분)
function robotInner() { return `<line x1="40" y1="8" x2="40" y2="22" stroke="#7B6CFF" stroke-width="4"/><circle cx="40" cy="7" r="6" fill="#FFE14D"/><rect x="6" y="20" width="68" height="54" rx="20" fill="#E9F3FF" stroke="#7B6CFF" stroke-width="4"/><rect x="16" y="30" width="48" height="32" rx="12" fill="#2E3A66"/><path d="M24 48 Q30 40 36 48 M44 48 Q50 40 56 48" stroke="#7DF9C8" stroke-width="4" fill="none" stroke-linecap="round"/>`; }
function tokenXY(p, at = p.pos) {
  const c = app.pos[at];
  const same = app.S.players.filter(q => q.pos === at);
  const i = same.indexOf(p);
  const off = same.length > 1 ? (i - (same.length - 1) / 2) * 40 : 0;
  return [c.x + off, c.y - 8 + (same.length > 1 ? (i % 2) * 14 : 0)];
}
function drawTokens(force) {
  const g = $('#tokens'); if (!g) return;
  if (force || g.children.length !== app.S.players.length) g.innerHTML = app.S.players.map(tokenSvg).join('');
  app.S.players.forEach(p => { const [x, y] = tokenXY(p); const t = $('#tok' + p.id); if (t) t.setAttribute('transform', `translate(${x} ${y})`); });
  // 현재 사람을 맨 위로
  const cur = $('#tok' + app.S.cur); if (cur) g.appendChild(cur);
}
function camTo(cellId, instant) {
  const p = app.pos[cellId]; if (!p) return;
  const W = 160 * 2 + (app.maxK + 2) * CW;
  app.camX = Math.max(0, Math.min(W - 1280, p.x - 470));
  const w = $('#world'); if (!w) return;
  if (instant) { w.style.transition = 'none'; w.style.transform = `translateX(${-app.camX}px)`; void w.offsetWidth; w.style.transition = ''; }
  else w.style.transform = `translateX(${-app.camX}px)`;
}

/* ═════════════ 상태창 ═════════════ */
function viewPid() {
  const S = app.S, pd = S.pending;
  if (app.net && app.net.me >= 0) return app.net.me;
  if (pd && pd.pid != null) return pd.pid;
  return S.cur;
}
function renderHUD() {
  const S = app.S; if (!S || !$('#hud')) return;
  const p = P(viewPid());
  const st = C.STAGES[S.stage];
  const bar = s => { const v = p.stats[s] % C.GAUGE_PER_GRADE / C.GAUGE_PER_GRADE * 100; const g = E.grade(p, s); return `<div>${C.STAT_SHORT[s]}<b style="color:${['#FFB3B3', '#FFD0A8', '#FFF0A0', '#C8F7A8', '#A8E6FF', '#C9B8FF', '#FFD23F'][g]};margin-left:4px">${C.GRADES[g]}</b><div class="bar"><i style="width:${g >= 6 ? 100 : v}%"></i></div></div>`; };
  const face = p.isCom ? A.robotFace(60) : A.faceSvg(p.look, p.gender, ageOf(), 66);
  const jt = E.jobTitle(p);
  $('#hud').innerHTML = `<div class="face">${face}</div>
    <div><div class="nm">${esc(p.name)} <span class="pill">${st.name}</span></div>
      <div class="job">${jt ? esc(jt) + (p.job && !p.retired && !p.student ? ' ' + '★'.repeat(p.job.rank) : '') : (p.club ? C.CLUBS.find(c => c.k === p.club).icon + ' ' + C.CLUBS.find(c => c.k === p.club).name : '')}</div>
      <div class="stats">${bar('int')}${bar('str')}${bar('sen')}</div></div>
    <div><div class="money">${money(p.money)}</div><div class="luck">운세 ${C.LUCK_ICON[p.luck]} ${C.LUCK[p.luck]}${p.debt ? ` · 빚 ${money(p.debt)}` : ''}${p.green ? ` · 💚${p.green}` : ''}</div></div>
    <div class="hcards">${Array.from({ length: C.CARD_MAX }, (_, i) => p.cards[i] ? `<span title="${esc(C.CARDS[p.cards[i]].name)}">${C.CARDS[p.cards[i]].icon}</span>` : '<span class="empty"></span>').join('')}</div>`;
  const turns = S.turns[S.stage];
  let payInfo = '';
  if (!S.turns.slice(S.stage + 1).some(t => t > 0)) { const d = distTo(p, 'goal'); if (d != null) payInfo = `골인까지 ${d}칸`; } // 원작처럼 마지막 단계엔 골인까지
  else if (st.adult) { const d = distTo(p, 'payday'); if (d != null) payInfo = `월급날까지 ${d}칸`; }
  $('#turninfo').innerHTML = `<div class="t1">${SND.ctlHtml()} 턴 ${Math.min(S.stageRound + 1, turns)}/${turns}</div><div class="t2">${payInfo}</div>`;
  $('#testbar').innerHTML = canFast() ? `<span>🧪 테스트</span><button class="btn sm ${FAST ? 'y' : 'w'}" data-ui='{"k":"ff"}'>${FAST ? '⏩ 빨리 감기 켬' : '⏩ 빨리 감기'}</button><button class="btn sm w" data-ui='{"k":"testExit"}'>🏠 나가기</button>` : '';
  $('#plist').innerHTML = S.players.map(q => `<div class="pmini ${q.id === S.cur ? 'cur' : ''}" data-ui='${J({ k: 'status', pid: q.id })}' style="cursor:pointer">
    <div class="f" style="border:3px solid ${PCOL[q.id]}">${q.isCom ? A.robotFace(32) : A.faceSvg(q.look, q.gender, ageOf(), 40)}</div>
    <div><b>${esc(q.name)}${app.net && q.id === app.net.me ? ' <span class="me-tag">나</span>' : ''}</b><small>${money(q.money)}${q.debt ? ` <span class="minus">빚 ${money(q.debt)}</span>` : ''}</small>${app.net && !q.isCom && !seatOn(q) ? '<small class="away">● 자리 비움 (COM 대신)</small>' : `<small>${esc(E.jobTitle(q).split(' · ')[0] || (q.club ? C.CLUBS.find(c => c.k === q.club).name : ''))}</small>`}</div></div>`).join('');
}
function distTo(p, type) {
  const S = app.S; let id = p.pos;
  for (let d = 1; d < 200; d++) { const c = S.board.cells[id]; if (!c.next.length) return null; id = c.next[0]; if (S.board.cells[id].type === type) return d; }
  return null;
}

/* ═════════════ 진행: 로그 연출 → 대기 화면 ═════════════ */
function send(a, viaClick) {
  const S = app.S; if (!S || !S.pending || (app.busy && !app.net)) return;
  clearCom();
  const pd = S.pending;
  const act = { ...a, n: viaClick && app.viewN != null ? app.viewN : pd.n }; // 누른 버튼은 그 화면의 차례 번호로 — 지나간 화면의 버튼은 엔진이 무시
  if (act.pid == null) act.pid = pd.pid;
  if (app.net) { stage.classList.add('sending'); netSend(act); return; } // 온라인: 서버에 쓰고, 돌아오면 모든 기기에서 같이 반영
  try { E.act(S, act); } catch (err) { console.error(err); toast('⚠️ 오류: ' + err.message); }
  sync();
}
async function sync() {
  const S = app.S; if (!S || app.busy) return;
  app.busy = true;
  try {
    while (true) {
      const next = S.log.find(e => e.seq > app.seen);
      if (!next) break;
      if (app.net && (document.hidden || S.seq - app.seen > 60)) { app.seen = S.seq; drawTokens(true); camTo(P(S.cur).pos, true); break; } // 너무 밀렸으면 연출 건너뛰기
      app.seen = next.seq;
      await play(next);
    }
  } catch (err) { console.error(err); }
  app.busy = false;
  if (app.S !== S) return; // 그사이 다른 게임으로 바뀜
  if (boardSig() !== app.boardSig) { const cells = $('#cells'); if (cells) cells.innerHTML = cellsSvg(); app.boardSig = boardSig(); }
  drawTokens();
  renderHUD();
  renderPending();
  saveGame();
  if (app.net && S.over) uploadResult();
}
async function play(e) {
  const S = app.S;
  switch (e.k) {
    case 'stage': {
      SND.sfx('stage'); SND.bgm(SND.trackOfStage(C.STAGES[e.stage].k));
      drawTokens(true);
      camTo(S.board.stageStart[e.stage] ?? P(0).pos, true);
      if (e.seq === 1 && C.STAGES[e.stage].k === 'baby') await cradleOpening(); // 게임 맨 처음
      else await banner(C.STAGES[e.stage].name, stageSub(e.stage), 2000, ['robot', 'talk', MC_STAGE[C.STAGES[e.stage].k] || '다음 단계로 출발~']);
      break;
    }
    case 'turn': { if (mine(P(e.pid))) SND.sfx('myturn'); camTo(P(e.pid).pos); drawTokens(); renderHUD(); await sleep(250); break; }
    case 'spin': {
      await spinWheel($('#spinbox .wheel-rot'), 10, e.value - 1); SND.sfx('ding');
      const sb = $('#spinbox'); if (sb) sb.insertAdjacentHTML('beforeend', `<div class="mvlabel">앞으로 ${e.value}칸!</div>`);
      await sleep(1000); break;
    }
    case 'move': {
      const p = P(e.pid);
      const t = $('#tok' + p.id);
      let k = 0;
      for (const id of e.path) {
        SND.sfx('step', { i: k++ });
        const [x, y] = tokenXY({ ...p, pos: id }, id);
        if (t) t.setAttribute('transform', `translate(${x} ${y})`);
        camTo(id);
        await sleep(210);
      }
      await sleep(150);
      break;
    }
    case 'jump': { drawTokens(); break; }
    case 'fate': case 'wheel': {
      const w = $('#ov .wheel-rot');
      if (w) { // 멈춘 뒤 결과를 크게 보여 주고 잠깐 기다림
        await spinWheel(w, e.layout ? 10 : e.labels.length, e.idx); SND.sfx(e.layout ? { g: 'good', n: 'normal', b: 'bad' }[e.res] : 'ding');
        const box = w.closest('.wheelbox'); if (box) box.insertAdjacentHTML('beforeend', `<div class="wres ${e.layout ? e.res : ''}">${esc(e.layout ? { g: '🌟 대운!', n: '🙂 보통', b: '💥 꽝…' }[e.res] : e.labels[e.idx])}</div>`);
        await sleep(1300);
      }
      break;
    }
    case 'slot': await spinSlot(e); break;
    case 'toast': toast(e.text); await sleep(120); break;
    case 'land': { // 처음 멈춘 칸이면 도우미 로봇이 한 줄 설명
      const p = P(e.pid), info = C.CELL_INFO[e.type];
      if (!p.isCom && info && info.help) { const key = 'tlg_seen_' + e.type; let seen = false; try { seen = !!sessionStorage.getItem(key); sessionStorage.setItem(key, 1); } catch {} if (!seen) toast(`🤖 ${info.icon === '•' ? '' : info.icon} ${info.name} 칸: ${info.help}`); }
      await splash(e.type);
      break;
    }
    case 'quizShow': SND.sfx('quiz'); toast('🎤 같은 칸! 퀴즈쇼 시작!'); await sleep(500); break;
    case 'quizResult': { // 내가 낸 답 기준 (온라인), 한 기기에서는 누가 맞혔는지 기준
      const me = app.net ? app.net.me : null;
      SND.sfx(me != null && e.pids.includes(me) ? (e.answers[me] && e.answers[me].c === e.q.a ? 'correct' : 'wrong') : e.winner != null ? 'correct' : 'wrong');
      if (e.pids.length > 1) await quizReveal(e);
      break;
    }
    case 'payday': SND.sfx('pay'); break;
    case 'date': SND.sfx('heart'); break;
    case 'end': SND.sfx('fanfare'); SND.bgm('result'); await banner('🏁 인생 골인!', '이번 인생 쇼에서 우승한 사람은…?', 2600, ['bulb', 'cheer', '모두 정말 수고했어요! 두근두근… 과연 우승자는?', 'robot']); break;
    case 'gateAll': await interim(e); break;
    case 'appraise': await appraise(e); break;
    case 'mission': await splash('mission'); break;
    case 'car': SND.sfx('horn'); drawTokens(true); break;
    case 'notice': SND.sfx('notice'); toast(e.text); await banner(e.text, '', 1900); break;
    default: break;
  }
}
// 진행자 (띵동·반짝): 단계 시작·오프닝·중간 발표·보물 감정·결과 발표에서 말풍선으로
const MC_NAME = { robot: '🤖 띵동', bulb: '💡 반짝' };
const MC_STAGE = { baby: '응애! 새로운 인생이 시작됩니다!', kid: '무럭무럭 자라는 어린이! 무엇이든 해 봐요~', elem: '초등학교 입학! 책가방 메고 출발~', mid: '중학생이 됐어요! 기술 시간과 동아리가 기다려요',
  high: '고등학생! 내 진로를 진지하게 고민해 봐요', college: '드디어 어른! 대학과 첫 직장, 두근두근~', young: '사회 초년생! 첫 월급과 사랑을 찾아서~', middle: '인생의 한가운데! 랭크 업을 노려 봐요', elder: '황혼기예요. 인생역전의 기회도 있어요!' };
function mcHtml(who, mood, text, buddy) {
  return `<div class="mc">${buddy ? `<div class="mc-fig buddy">${A.mcSvg(buddy, 'cheer', 110)}</div>` : ''}<div class="mc-fig">${A.mcSvg(who, mood, 150)}</div><div class="mc-bub"><b>${MC_NAME[who]}</b>${esc(text)}</div></div>`;
}
// 게임 맨 처음: 원작처럼 요람 속 아기들 (흔들흔들 · 응애!)
async function cradleOpening() {
  const S = app.S, el = $('#splash'); if (!el) return;
  const bed = q => `<svg class="bed" viewBox="0 0 200 170"><path d="M 30 150 Q 100 176 170 150" stroke="#C9874A" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M 52 128 L 44 152 M 148 128 L 156 152" stroke="#C9874A" stroke-width="7" stroke-linecap="round"/>
    <path d="M 26 92 Q 22 30 92 26 L 96 40 Q 42 44 42 92 Z" fill="#FFB0C9" stroke="#fff" stroke-width="3"/>
    <g transform="translate(58 30)">${q.isCom ? A.robotFace(84) : A.faceSvg(q.look, q.gender, 'baby', 84)}</g>
    <path d="M 22 92 L 178 92 Q 176 138 100 138 Q 24 138 22 92 Z" fill="#FFF6E5" stroke="#E6CFA8" stroke-width="3"/>
    <path d="M 30 96 Q 100 84 170 96 Q 166 118 100 120 Q 34 118 30 96 Z" fill="${PCOL[q.id]}" opacity=".9"/>${[70, 100, 130].map(x => `<circle cx="${x}" cy="${x === 100 ? 100 : 104}" r="4" fill="#fff" opacity=".7"/>`).join('')}</svg>`;
  el.innerHTML = `<div class="pat pink"></div><div class="op-wrap"><div class="op-title">👶 축하해요! 아기가 태어났어요</div>
    <div class="op-row">${S.players.map((q, i) => `<div class="cradle" style="--pc:${PCOL[q.id]};animation-delay:${i * 0.25}s"><div class="cr-cry" style="animation-delay:${0.7 + i * 0.4}s">응애!</div>${bed(q)}<div class="cr-name">${esc(q.name)}</div></div>`).join('')}</div></div>
    ${mcHtml('robot', 'cheer', '와아! 새 친구들이 태어났어요! 기술인생게임, 지금 시작합니다!', 'bulb')}`;
  el.className = 'on'; SND.sfx('baby');
  await sleep(4500);
  el.className = ''; el.innerHTML = '';
}
function stageSub(si) {
  return { baby: '응애! 인생이 시작됐어요', kid: '무엇이든 궁금한 나이', elem: '책가방 메고 학교로!', mid: '기술 시간·동아리·진로 체험', high: '진로를 고민하는 시기', college: '대학생 또는 직장인', young: '첫 월급·연애·자취', middle: '일과 가족, 인생의 한가운데', elder: '은퇴와 인생역전, 골인!' }[C.STAGES[si].k];
}
function spinWheel(el, n, idx) {
  return new Promise(res => {
    if (!el) return res();
    const cur = +(el.dataset.rot || 0);
    const target = cur - (cur % 360) + 360 * 5 + (360 - (idx + 0.5) * 360 / n);
    el.dataset.rot = target;
    if (FAST) el.style.transition = 'transform .3s';
    SND.spin(target - cur, n, FAST ? 0.3 : 3);
    el.style.transform = `rotate(${target}deg)`;
    setTimeout(res, FAST ? 320 : 3050);
  });
}
function spinSlot(e) {
  const reels = [...document.querySelectorAll('#ov .reel')];
  if (!reels.length) return Promise.resolve();
  const h = reels[0].clientHeight || 76, t0 = FAST ? 0.25 : 1.5, gap = FAST ? 0.08 : 0.6, end = t0 + (reels.length - 1) * gap;
  SND.spin(360 * 8, 10, end);
  reels.forEach((rl, i) => {
    const strip = rl.querySelector('.strip'), n = +rl.dataset.n;
    strip.style.transition = `transform ${t0 + i * gap}s cubic-bezier(.12,.7,.25,1.04)`;
    strip.style.transform = `translateY(${-(1 + n * (SLOT_REP - 1) + e.stops[i]) * h}px)`; // ❓ 다음 · 마지막 묶음에서 멈춤
    setTimeout(() => { rl.classList.add('stop'); SND.sfx('ding'); }, (t0 + i * gap) * 1000);
  });
  return new Promise(res => setTimeout(async () => {
    const say = $('#ov .slot-say'); if (say) { say.textContent = e.say; say.classList.add('on'); }
    SND.sfx('fanfare'); await sleep(1700); res();
  }, end * 1000 + 200));
}
async function banner(t1, t2, ms, mc) { // mc: [진행자, 표정, 말, 같이 나올 진행자]
  const b = $('#banner'); if (!b) return;
  b.innerHTML = `<div><div class="b2">${esc(t1)}</div><div class="b1">${esc(t2 || '')}</div></div>${mc ? mcHtml(...mc) : ''}`;
  b.classList.add('on'); await sleep(ms); b.classList.remove('on');
}
function toast(text) {
  const box = $('#toasts'); if (!box) return;
  const d = document.createElement('div'); d.className = 'toast'; d.textContent = text;
  box.appendChild(d); setTimeout(() => d.remove(), 3100);
  while (box.children.length > 4) box.firstChild.remove();
}

/* ───── COM 자동 진행 ───── */
function clearCom() {
  if (app.comTimer) { clearTimeout(app.comTimer); app.comTimer = null; }
  const net = app.net; if (net) { net.timers.forEach(clearTimeout); net.timers = []; net.sig = ''; }
}
function scheduleCom() {
  if (app.net) return drive();
  clearCom();
  const S = app.S, pd = S.pending;
  if (!pd || S.over) return;
  if (pd.type === 'quiz') return; // 사람의 답을 기다림
  if (pd.pid == null || !P(pd.pid).isCom) return;
  const delay = { preSpin: 700, fate: 900, wheel: 900, ack: pd.kind === 'payday' ? 2400 : 2400, event: 1900 }[pd.type] ?? 1100;
  app.comTimer = setTimeout(() => { const a = E.aiAction(S); if (a) send(a); }, FAST ? 30 : delay);
}

/* ═════════════ 대기 화면 (pending) ═════════════ */
function ov(html, lite) {
  const dim = `<div class="dim${lite ? ' lite' : ''}"></div>`;
  const o = $('#ov'); if (!o) { stage.insertAdjacentHTML('beforeend', `<div id="ov" class="on">${dim}${html}</div>`); return; }
  o.className = 'on'; o.innerHTML = dim + html;
  $('#game') && $('#game').classList.remove('evmode');
}
// 원작처럼 "~할까요? 네/아니오" 확인 창 (지금 창 위에 겹쳐 뜸)
function confirmBox(msg, rows, act) {
  const o = $('#ov'); if (!o) return;
  const old = o.querySelector('.cfm2'); if (old) old.remove();
  o.insertAdjacentHTML('beforeend', `<div class="cfm2"><div class="cfm2-box"><p>${esc(msg)}</p>${rows.map(([k, v]) => `<div class="kv"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}
    <div class="cfm2-btns"><button class="btn y" data-a='${J(act)}'>네</button><button class="btn w" data-ui='{"k":"cfmNo"}'>아니오</button></div></div></div>`);
}
function closeOv() { app.peek = false; $('#game') && $('#game').classList.remove('evmode'); const o = $('#ov'); if (o) { o.classList.remove('on'); o.innerHTML = ''; } }
function renderPending() {
  const S = app.S; if (!S) return;
  stage.classList.remove('sending');
  const pd = S.pending;
  if (app.net && app.peek) { // 상태·지도 창을 보는 중이면 그대로 두기 (내 차례가 오면 닫음)
    if (!myInput(pd)) { scheduleCom(); return; }
    toast('🔔 내 차례예요!');
  }
  $('#menu') && ($('#menu').innerHTML = '');
  $('#spinbox') && ($('#spinbox').innerHTML = '');
  closeOv(); setEmote(null);
  app.viewN = pd ? pd.n : null;
  if (!pd) { stopTimer(); return; }
  const v = VIEW[pd.type];
  if (v) v(pd, pd.pid != null ? P(pd.pid) : null);
  else ov(`<div class="modal"><h2>${pd.type}</h2><button class="btn y" data-a='{"a":"ok"}'>계속</button></div>`);
  if (app.net && $('#menu') && !$('#menu').innerHTML && pd.type !== 'results') $('#menu').innerHTML = `<button class="btn w" data-ui='{"k":"status"}'>📋 내 상태</button><button class="btn w" data-ui='{"k":"map"}'>🗺️ 지도</button>`;
  scheduleCom();
  myTimer(pd);
}
const whoBadge = p => `<span class="jua" style="color:${PCOL[p.id]}">${esc(p.name)}</span>`;
// 이 기기에서 고를 수 있는 사람인가 (한 기기: COM이 아닌 사람 모두 · 온라인: 내 자리만)
const mine = p => !!p && (app.net ? p.id === app.net.me : !p.isCom);
const waitText = p => p.isCom ? '🤖 COM이 고르는 중…' : app.net && !seatOn(p) ? `🤖 ${esc(p.name)} 자리를 COM이 대신하는 중…` : `⏳ ${esc(p.name)}이(가) 고르는 중…`;
const comNote = p => mine(p) ? '' : `<div class="muted jua" style="text-align:center;margin-top:8px">${waitText(p)}</div>`;
const dis = p => mine(p) ? '' : 'disabled';

function actorSvg(p, opt = {}) {
  if (p.isCom) return A.robotFull(200, 300);
  let age = ageOf();
  if ((opt.wear === 'job' || opt.wear === 'wedding' || opt.wear === 'suit') && !['adult', 'elder'].includes(age)) age = 'adult';
  const j = p.job && !p.job.free ? E.jobOf(p) : null;
  return A.fullSvg(p.look, { age, gender: p.gender, track: j ? j.titles : null, ...opt }, 210, 330);
}
function wearFor(bg, outfit) {
  if (outfit === 'job') return 'job';
  if (outfit === 'wedding' || bg === 'wedding') return 'wedding';
  if (bg === 'field') return 'sports';
  if (bg === 'techroom' || bg === 'factory' && !C.STAGES[app.S.stage].adult) return 'work';
  if (bg === 'travel' || bg === 'campsite') return 'travel';
  if (bg === 'office' && /면접/.test(outfit || '')) return 'suit';
  return 'auto';
}
function sceneHtml(bg, p, opt = {}) {
  const j = p.job && !p.job.free ? E.jobOf(p) : null;
  const wear = wearFor(bg, opt.outfit);
  const actor = actorSvg(p, { wear, field: j ? j.field : '프리랜서', mood: opt.mood });
  const second = opt.partner ? `<div class="actor" style="left:420px">${opt.partner}</div>` : '';
  return `<div class="scene-wrap"><svg class="bg" viewBox="0 0 1000 480" preserveAspectRatio="xMidYMid slice">${A.scene(bg)}</svg>
    <div class="actor" style="left:${opt.partner ? 230 : 120}px">${actor}</div>${second}</div>`;
}

const VIEW = {};
VIEW.preSpin = (pd, p) => {
  const m = $('#menu');
  m.innerHTML = `<button class="btn w" data-ui='{"k":"cards"}' ${dis(p)}>🃏 카드 ${p.cards.length}장</button>
    <button class="btn w" data-ui='${J({ k: 'status', pid: p.id })}'>📋 상태</button>
    <button class="btn w" data-ui='{"k":"map"}'>🗺️ 지도</button>`;
  const force = p.force ? `<div class="toast" style="animation:none">${p.force.fixed ? `🎯 ${p.force.fixed}칸 확정!` : `🃏 ${p.force.min}~${p.force.max}만 나와요`}</div>` : '';
  $('#spinbox').innerHTML = `${force}<div class="jua" style="font-size:24px;color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.3)">${esc(p.name)}의 차례!</div>
    <div class="wheelbox"><div class="ptr"></div>${A.wheelSvg(A.moveSegs(), 230)}</div>
    ${mine(p) ? '<button class="btn y big" data-a=\'{"a":"spin"}\'>🎡 룰렛 돌리기!</button>' : `<div class="jua" style="color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.3)">${waitText(p)}</div>`}`;
  camTo(p.pos);
};
VIEW.carPick = (pd, p) => {
  ov(`<div class="modal" style="width:620px"><h2>🚗 차로 조절할까요?</h2><p class="muted" style="text-align:center;margin-bottom:12px">룰렛 숫자: ${pd.rolled}</p>
    <div class="grid" style="grid-template-columns:repeat(${pd.options.length},1fr)">${pd.options.map(o => { const info = C.CELL_INFO[o.type] || C.CELL_INFO.normal; return `<button class="opt" data-a='${J({ steps: o.steps })}' ${dis(p)}><div class="ic">${info.icon === '•' ? '🙂' : info.icon}</div><b>${o.steps}칸 → ${info.name}</b><span>${o.steps === pd.rolled ? '그대로' : o.steps > pd.rolled ? '+1칸' : '−1칸'}</span></button>`; }).join('')}</div>${comNote(p)}</div>`);
};
VIEW.branch = (pd, p) => {
  const c = app.S.board.cells[p.pos];
  ov(`<div class="modal" style="width:700px"><h2>🔀 갈림길! 어느 길로 갈까요?</h2><div class="grid" style="grid-template-columns:1fr 1fr">${pd.lanes.map((name, i) => {
    let id = c.next[i]; const icons = [];
    for (let k = 0; k < 6 && app.S.board.cells[id].lane != null; k++) { const ic = C.CELL_INFO[app.S.board.cells[id].type].icon; icons.push(ic === '•' ? '🙂' : ic); id = app.S.board.cells[id].next[0]; }
    return `<button class="opt" data-a='${J({ lane: i })}' ${dis(p)}><b>${name}</b><div style="font-size:30px">${icons.join(' ')}</div></button>`;
  }).join('')}</div>${comNote(p)}</div>`);
};
VIEW.event = (pd, p) => {
  const ev = E.findEvent(pd.eid);
  const chips = ch => {
    if (ch.r) return '<span class="tag">🎡 룰렛</span>';
    if (ch.call) return `<span class="tag">💰 ${money(ch.cost || 300)}</span>`;
    if (ch.then) return '<span class="tag">💼 이직</span>';
    return '';
  };
  const color = ev.cell ? ({ lucky: 'orange', verylucky: 'yellow', unlucky: 'purple', mission: 'blue' }[ev.cell] || 'orange') : 'teal';
  evScreen(p, { title: ev.t, bg: ev.bg, color, choices: pd.avail.map(i => ({ a: { i }, label: ev.ch[i].l, tag: chips(ev.ch[i]) })) });
};
VIEW.ack = (pd, p) => {
  if (pd.kind === 'payday') return viewPayday(pd, p);
  const rank = (pd.lines || []).some(l => /RANK UP/.test(l));
  if (app.ackSnd !== pd.n) { // 같은 화면을 다시 그려도 한 번만
    app.ackSnd = pd.n;
    const bg = pd.bg || '', tt = pd.title || '';
    SND.sfx(rank ? 'rankup' : bg === 'wedding' ? 'wedding' : /아기|쌍둥이/.test(tt) && pd.mood === 'g' ? 'baby' : bg === 'goal' ? 'fanfare'
      : /^house_/.test(bg) ? 'house' : bg === 'party' && pd.mood === 'g' ? 'fanfare' : bg === 'creditor' && pd.mood === 'b' ? 'creditor' : '');
  }
  const bg = pd.bg || 'home', tt = pd.title || '';
  const base = { title: tt, lines: [...(pd.text ? [pd.text] : []), ...(pd.lines || [])], bg, mood: pd.mood, outfit: pd.outfit, ok: true };
  if (rank && p.job) return cardScreen(p, { ...base, color: 'green', card: rankCard(p) });
  if (pd.treasure) return cardScreen(p, { ...base, color: 'yellow', card: treasureCard(pd.treasure) });
  if (bg === 'wedding') return evScreen(p, { ...base, color: 'pink', partner: spouseSvg(p, 'wedding'), hearts: true });
  if (/아기|쌍둥이/.test(tt) && pd.mood === 'g') return evScreen(p, { ...base, color: 'pink', hearts: true });
  if (/^house_/.test(bg)) return evScreen(p, { ...base, color: 'green' });
  if (bg === 'creditor') return evScreen(p, { ...base, color: 'purple' }); // 빚쟁이 장면(검은 고양이)도 보이게
  if (pd.grow || /^(goal|party|campus|hall|field|studio|garage_studio)$/.test(bg) || /되었어요!|창업|입학|골인|은퇴식|졸업/.test(tt)) return evScreen(p, { ...base, color: pd.outfit === 'job' ? 'green' : 'orange' });
  const d = statDeltas(pd.lines);
  if (Object.keys(d).length && !(pd.lines || []).some(l => /^💰/.test(l))) return cardScreen(p, { ...base, color: 'yellow', lines: [statPhrase(p, d), ...base.lines], card: statCard(p, d) });
  const emote = pd.mood === 'g' ? '🎉' : pd.mood === 'b' ? '💦' : '💬';
  dialogOv(p, { ...base, emote });
};
/* ───── 원작식 화면 조각 ───── */
function dlgBox(p, o) { // 아래 대화 상자: 플레이어 색 옆줄 · 글자가 한 자씩 · 다 나오면 "계속 ▼"
  const my = mine(p);
  return `<div class="dlg ${o.cls || ''}" data-ui='{"k":"dlg"}' style="--pc:${PCOL[p.id]}"><div class="who" style="background:${PCOL[p.id]}">${esc(C.STAGES[app.S.stage].name)} · ${esc(p.name)}</div>
    <div class="dtxt" id="dtxt"></div><div class="dsub">${(o.lines || []).map(l => `<div>${esc(l)}</div>`).join('')}</div>
    ${o.ok ? (my ? '<div class="dnext">계속 ▼</div>' : `<div class="dwait">${waitText(p)}</div>`) : ''}</div>`;
}
function startDlg(p, o) { app.dlgOk = !!(o.ok && mine(p)); typeIn($('#dtxt'), o.title || '', app.S.pending.n); }
function evScreen(p, o) { // 무늬 배경 + 큰 장면(캐릭터·상대) + 가운데 선택지 + 아래 대화 상자
  const my = mine(p), j = p.job && !p.job.free ? E.jobOf(p) : null;
  const actor = actorSvg(p, { wear: wearFor(o.bg, o.outfit), field: j ? j.field : '프리랜서', mood: o.mood });
  const ch = (o.choices || []).map(c => `<button class="epill" data-a='${J(c.a)}' ${my ? '' : 'disabled'}>${esc(c.label)} ${c.tag || ''}</button>`).join('');
  ov(`<div class="pat ${o.color || 'orange'}"></div>
    <div class="escene${ch ? '' : ' solo'}"><svg class="bg" viewBox="0 0 1000 480" preserveAspectRatio="xMidYMid slice">${A.scene(o.bg || 'home')}</svg>
      <div class="eactor${o.partner ? ' two' : ''}">${actor}</div>${o.partner ? `<div class="eactor partner">${o.partner}</div>` : ''}${o.hearts ? '<div class="hearts">💗<span>💗</span></div>' : ''}
      ${ch ? `<div class="echoices">${ch}${my ? '' : `<div class="dwait">${waitText(p)}</div>`}</div>` : ''}</div>
    ${dlgBox(p, { ...o, cls: 'ev' })}`, true);
  $('#game') && $('#game').classList.add('evmode');
  startDlg(p, o);
}
function cardScreen(p, o) { // 무늬 배경 + 카드(능력치·랭크·보물) + 아래 대화 상자
  ov(`<div class="pat ${o.color}"></div>${o.card}${dlgBox(p, { ...o, cls: 'ev' })}`, true);
  $('#game') && $('#game').classList.add('evmode');
  startDlg(p, o);
}
function spouseSvg(p, wear) {
  const n = p.spouse != null ? E.npcOf(app.S, p.spouse) : null;
  return n ? A.fullSvg(n.look, { age: ageOf() === 'elder' ? 'elder' : 'adult', gender: n.gender, mood: 'g', wear }, 210, 330) : '';
}
function statDeltas(lines) { // "지력 +6" 같은 줄에서 능력치 변화 읽기
  const d = {};
  (lines || []).forEach(l => { const m = /^(지력|체력|센스) ([+−-]?)(\d+)/.exec(l); if (m) { const s = { 지력: 'int', 체력: 'str', 센스: 'sen' }[m[1]]; d[s] = (d[s] || 0) + (m[2] === '−' || m[2] === '-' ? -1 : 1) * +m[3]; } });
  return d;
}
function statPhrase(p, d) {
  const ig = s => (s === 'sen' ? '가' : '이');
  const parts = Object.entries(d).map(([s, v]) => v > 0 ? `${C.STATS[s]}${ig(s)} ${v >= 10 ? '폭발!!' : v >= 5 ? '많이 올라갔다!!' : '올랐다!'}` : `${C.STATS[s]}${ig(s)} 떨어졌다…`);
  return `✨ ${p.name}은(는) ${parts.join(' ')}`;
}
function statCard(p, d) { // 원작처럼: 오른 능력치가 반짝
  const face = p.isCom ? A.robotFull(130, 190) : A.fullSvg(p.look, { age: ageOf(), gender: p.gender, mood: 'g' }, 130, 200);
  const st = s => { const g = E.grade(p, s), v = g >= 6 ? 100 : p.stats[s] % C.GAUGE_PER_GRADE / C.GAUGE_PER_GRADE * 100, x = d[s] || 0;
    return `<div class="sc-st ${x > 0 ? 'up' : x < 0 ? 'down' : ''}"><span>${C.STATS[s]}${x > 0 ? ' ✨' : ''}</span><b>${C.GRADES[g]}</b><div class="bar"><i style="width:${v}%"></i></div>${x ? `<small>${x > 0 ? '+' : ''}${x}</small>` : ''}</div>`; };
  return `<div class="scard"><div class="sc-face">${face}</div><div><div class="sc-name"><b>${esc(p.name)}</b><small>${esc(C.STAGES[app.S.stage].name)}</small></div>
    <div class="sc-stats">${st('int')}${st('str')}${st('sen')}</div><div class="sc-money"><span>소지금</span><b>${money(p.money)}</b></div></div></div>`;
}
function nextRankText(p) { // 다음 랭크와 필요한 능력치 (직업 칸 룰렛 대운 + 주 능력치)
  if (!p.job || p.retired) return '';
  const j = p.job.free ? null : E.jobOf(p), tl = TITLES[j ? j.titles : '프리랜서'], r = p.job.rank;
  if (r >= 5) return '👑 최고 랭크 달성!';
  return j ? `다음 랭크 ▶ ${tl[r]} · ${C.STATS[j.req[0][0]]} ${C.GRADES[Math.min(6, j.req[0][1] + Math.floor((r - 1) / 2))]} 이상이면 직업 칸 대운에서 랭크 업` : `다음 랭크 ▶ ${tl[r]} · 직업 칸 대운에서 랭크 업`;
}
function rankCard(p) {
  const j = p.job.free ? null : E.jobOf(p), tl = TITLES[j ? j.titles : '프리랜서'], r = p.job.rank;
  const face = actorSvg(p, { wear: 'job', field: j ? j.field : '프리랜서', mood: 'g' });
  return `<div class="rcard"><div class="rc-face">${face}</div><div class="rc-main"><small>${esc(j ? j.name : '프리랜서')}</small><b>${esc(tl[r - 1])}</b>
    <span class="stars">${'★'.repeat(r)}${'☆'.repeat(5 - r)}</span><div class="kv"><span>연봉</span><b>${money(E.salaryOf(app.S, p))}</b></div><p>${esc(nextRankText(p))}</p></div></div>`;
}
function treasureCard(k) {
  const tr = C.TREASURES.find(x => x.k === k); if (!tr) return '';
  return `<div class="tcard"><div class="tc-glow"></div><div class="tc-ic">${tr.icon}</div><b>${esc(tr.name)}</b><small>${C.TREASURE_TIER[tr.tier]} 보물 · 결과 발표 때 감정</small></div>`;
}
// 칸에 멈추면 원작처럼 칸 소개 (보통 칸은 생략)
const SPLASH = { mission: ['미스터리 미션!', 'blue', '❓', '#B79CFF'], lucky: ['럭키칸', 'orange'], verylucky: ['매우 럭키칸', 'yellow'], unlucky: ['조마조마칸', 'purple'], love: ['사랑칸', 'pink'], job: ['직업칸', 'green'], quiz: ['퀴즈칸', 'blue'], exp: ['경험칸', 'teal'],
  contest: ['대회칸', 'yellow'], stock: ['증권칸', 'green'], reverse: ['인생역전칸', 'purple'], house: ['집 장만칸', 'green'], payday: ['월급날 딱 멈춤!', 'yellow'], shop: ['상점 딱 멈춤!', 'teal'], allowance: ['용돈 칸', 'yellow'], patent: ['특허 칸', 'purple'] };
async function splash(type) {
  const s = SPLASH[type], el = $('#splash'); if (!s || !el) return;
  const info = C.CELL_INFO[type] || C.CELL_INFO.normal;
  el.innerHTML = `<div class="pat ${s[1]}"></div><div class="sp-in"><div class="sp-pill">${s[0]}</div><div class="sp-card" style="background:${s[3] || info.color}">${s[2] || (info.icon === '•' ? '🙂' : info.icon)}</div></div>`;
  el.className = 'on';
  SND.sfx(type === 'verylucky' ? 'good' : type === 'unlucky' ? 'creditor' : 'whoosh');
  await sleep(1000);
  el.className = ''; el.innerHTML = '';
}
// 단계가 끝나면 원작처럼 "중간 발표": 모두의 능력치·돈·카드
async function interim(e) {
  const S = app.S, el = $('#splash'), stName = C.STAGES[e.stage].name; if (!el) return;
  const card = (q, i) => {
    const face = q.isCom ? A.robotFace(52) : A.faceSvg(q.look, q.gender, ageOf(), 56);
    const st = s => { const g = E.grade(q, s), v = g >= 6 ? 100 : q.stats[s] % C.GAUGE_PER_GRADE / C.GAUGE_PER_GRADE * 100; return `<div><span>${C.STATS[s]}</span><b>${C.GRADES[g]}</b><div class="bar"><i style="width:${v}%"></i></div></div>`; };
    const jt = E.jobTitle(q).split(' · ')[0] || (q.club ? C.CLUBS.find(c => c.k === q.club).name : '');
    return `<div class="icard" style="--pc:${PCOL[q.id]};animation-delay:${i * 0.15}s"><div class="ic-top">${face}<div><b>${esc(q.name)}</b><small>${esc(jt || stName)}</small></div><span class="ic-money">${money(q.money)}</span></div>
      <div class="ic-stats">${st('int')}${st('str')}${st('sen')}</div><div class="ic-cards">${q.cards.map(c => C.CARDS[c].icon).join(' ')}${(q.treasures || []).map(k => (C.TREASURES.find(x => x.k === k) || {}).icon || '').join(' ')}</div></div>`;
  };
  el.innerHTML = `<div class="pat teal"></div><div class="in-wrap"><div class="in-title">📢 ${esc(stName)} 끝! 중간 발표</div><div class="in-grid">${S.players.map(card).join('')}</div></div>${mcHtml('bulb', 'cheer', '중간 발표 시간! 지금까지 이렇게 자랐어요~')}`;
  el.className = 'on'; SND.sfx('fanfare');
  await sleep(3000);
  el.className = ''; el.innerHTML = '';
}
// 같은 칸 퀴즈쇼 공개: COM끼리면 문제부터 잠깐 보여 주고, 각자 고른 답과 시간 · 정답 · 승자
async function quizReveal(e) {
  const el = $('#splash'); if (!el) return;
  const win = e.winner != null ? P(e.winner) : null;
  const head = `<div class="in-title">🎤 같은 칸 퀴즈쇼! <small>${e.pids.map(id => esc(P(id).name)).join(' vs ')}</small></div><div class="qr-q">${esc(e.q.q)}</div>`;
  if (e.pids.every(id => P(id).isCom)) {
    el.innerHTML = `<div class="pat blue"></div><div class="in-wrap">${head}<div class="qr-opts">${e.q.o.map(o => `<div class="qr-opt"><span>${esc(o)}</span></div>`).join('')}</div><div class="qr-think">🤔 생각하는 중…</div></div>${mcHtml('bulb', 'talk', '과연 누가 먼저 맞힐까요?')}`;
    el.className = 'on'; await sleep(2600);
  }
  const opt = (o, i) => { const who = e.pids.filter(id => e.answers[id] && e.answers[id].c === i);
    return `<div class="qr-opt ${i === e.q.a ? 'right' : ''}"><span>${i === e.q.a ? '⭕ ' : ''}${esc(o)}</span><span class="qr-who">${who.map(id => `<i style="background:${PCOL[id]}">${esc(P(id).name)} ${(e.answers[id].ms / 1000).toFixed(1)}초</i>`).join('')}</span></div>`; };
  el.innerHTML = `<div class="pat blue"></div><div class="in-wrap">${head}<div class="qr-opts">${e.q.o.map(opt).join('')}</div><div class="qr-win">${win ? `🏆 ${esc(win.name)} 승리!` : '🤝 아무도 못 맞혔어요'}</div></div>
    ${mcHtml('robot', 'cheer', win ? `${win.name}, 대단해요! 이제 퀴즈쇼 룰렛!` : '아쉬워요! 다시 한 번 승부~')}`;
  el.className = 'on'; SND.sfx(win ? 'fanfare' : 'wrong');
  await sleep(3400);
  el.className = ''; el.innerHTML = '';
}
// 결과 발표 전 보물 감정
async function appraise(e) {
  const el = $('#splash'); if (!el) return;
  el.innerHTML = `<div class="pat yellow"></div><div class="in-wrap"><div class="in-title">💎 보물 감정!</div><div class="ap-list">${e.items.map((it, i) => { const q = P(it.pid), tr = C.TREASURES.find(x => x.k === it.k) || { icon: '🎁', name: '보물' };
    return `<div class="ap-row" style="animation-delay:${i * 0.5}s"><span class="ap-ic">${tr.icon}</span><span><b>${esc(tr.name)}</b> <small>${esc(q.name)}</small></span><span></span><span class="ap-v" style="animation-delay:${i * 0.5 + 0.35}s">${money(it.v)}</span></div>`; }).join('')}</div></div>${mcHtml('robot', 'talk', '두근두근… 보물 감정 결과는?!')}`;
  el.className = 'on'; SND.sfx('fanfare');
  await sleep(2200 + e.items.length * 500);
  el.className = ''; el.innerHTML = '';
}
/* ───── 원작식 대화 상자: 판 위에 검은 상자, 글자가 한 자씩, 다 나오면 "계속 ▼" ───── */
function dialogOv(p, o) {
  const S = app.S, my = mine(p), n = S.pending.n;
  const j = p.job && !p.job.free ? E.jobOf(p) : null;
  const actor = actorSvg(p, { wear: wearFor(o.bg, o.outfit), field: j ? j.field : '프리랜서', mood: o.mood });
  // 결혼·아기·집·직업·랭크 업 같은 큰 순간에만 그림 창, 나머지는 판을 보면서
  const pic = o.big ? `<div class="pic"><svg class="bg" viewBox="0 0 1000 480" preserveAspectRatio="xMidYMid slice">${A.scene(o.bg)}</svg><div class="actor">${actor}</div></div>` : `<div class="portrait">${actor}</div>`;
  const ch = (o.choices || []).map(c => `<button class="choice" data-a='${J(c.a)}' ${my ? '' : 'disabled'}>${esc(c.label)} ${c.tag || ''}</button>`).join('');
  const m = (o.lines || []).find(l => /^💰/.test(l)); // 돈 변화는 위쪽에 크게
  ov(`${pic}${o.rank ? '<div class="rankup dlgrank">RANK UP</div>' : ''}${m ? `<div class="mpop ${/[−-]|가져갔/.test(m) ? 'minus' : ''}">${esc(m)}</div>` : ''}
    ${ch ? `<div class="dchoices">${ch}${my ? '' : `<div class="dwait">${waitText(p)}</div>`}</div>` : ''}
    ${dlgBox(p, o)}`, true);
  startDlg(p, o);
  setEmote(p, o.emote); void n;
}
function typeIn(el, text, n) {
  clearInterval(app.typeIv); app.typeIv = null;
  const done = () => { app.typeIv = null; app.typedN = n; app.dlgAt = Date.now(); const o = $('#ov'); if (o) o.classList.add('typed'); };
  if (!el) return;
  if (FAST || app.typedN === n) { el.textContent = text; done(); return; } // 같은 화면을 다시 그릴 땐 바로
  let i = 0;
  const step = () => { i = Math.min(text.length, i + 1); el.textContent = text.slice(0, i); if (i >= text.length) { clearInterval(app.typeIv); done(); } };
  app.typeSkip = () => { i = text.length - 1; step(); };
  app.typeIv = setInterval(step, 28);
}
// 판 위 내 말 머리 위의 말풍선
function setEmote(p, icon) {
  const g = $('#emote'); if (!g) return;
  if (!p || !icon) { g.innerHTML = ''; return; }
  const [x, y] = tokenXY(p);
  g.innerHTML = `<g transform="translate(${x} ${y - 128})"><g class="pop"><path d="M-30 -28 h60 a12 12 0 0 1 12 12 v30 a12 12 0 0 1 -12 12 h-20 l-10 12 l-10 -12 h-20 a12 12 0 0 1 -12 -12 v-30 a12 12 0 0 1 12 -12z" fill="#fff" stroke="#4B3F6B" stroke-width="3"/><text y="11" text-anchor="middle" font-size="30">${icon}</text></g></g>`;
}
function viewPayday(pd, p) {
  ov(`<div class="modal pay"><h2>${esc(pd.title)} ${whoBadge(p)}</h2>
    ${pd.lines.map(([l, v]) => `<div class="row"><span>${esc(l)}</span><b class="${v > 0 ? 'plus' : v < 0 ? 'minus' : ''}">${v ? (v > 0 ? '+' : '') + money(v) : ''}</b></div>`).join('')}
    <div class="sum"><span>받은 돈</span><span class="${pd.sum >= 0 ? 'plus' : 'minus'}">${pd.sum >= 0 ? '+' : ''}${money(pd.sum)}</span></div>
    <div style="text-align:center;margin-top:14px">${mine(p) ? '<button class="btn y" data-a=\'{"a":"ok"}\'>확인 ▶</button>' : `<span class="jua muted">${waitText(p)}</span>`}</div></div>`);
}
function fateTexts(pd) { // 칸별 결과 문구
  if (pd.labels && pd.labels.g) return pd.labels;
  if (pd.kind === 'event' && pd.ctx) { const r = (E.findEvent(pd.ctx.eid) || {}).ch?.[pd.ctx.i]?.r; if (r) return { g: r.g && r.g.t, n: r.n && r.n.t, b: r.b && r.b.t }; }
  return { startup: { g: '투자 유치! 스타트업', n: '1인 창업', b: '창업 실패…' }, contest: { g: '금상!', n: '장려상', b: '아쉽게 탈락' }, propose: { g: '프로포즈 성공!', b: '거절당했다…' }, baby: { g: '아기가 찾아와요!', b: '이번엔 아니에요' },
    stockPick: { g: '유망주!', n: '보통주', b: '휴지조각…' }, reverse: { g: '돈이 두 배!', n: '그대로', b: '돈이 반으로…' } }[pd.kind] || { g: '대운!', n: '보통', b: '꽝…' };
}
VIEW.fate = (pd, p) => {
  const tx = fateTexts(pd), mark = { g: '🌟', n: '🙂', b: '💥' }, name = pd.twoWay ? { g: '성공', b: '꽝' } : { g: '대운', n: '보통', b: '꽝' };
  const list = ['g', 'n', 'b'].map(r => [r, pd.layout.filter(x => x === r).length]).filter(([, c]) => c)
    .map(([r, c]) => `<div class="fo ${r}"><span class="fi">${mark[r]}</span><div><b>${name[r]} ${c}칸</b><small>${esc(tx[r] || name[r])}</small></div></div>`).join('');
  ov(`<div class="modal" style="width:980px"><h2>${esc(pd.title)}</h2>
    <div class="fwrap"><div class="flist">${list}</div><div>
    <div class="wheelbox"><div class="ptr"></div>${A.wheelSvg(A.fateSegs(pd.layout), 330)}</div>
    <div class="mods">${pd.mods.filter(([l]) => !/운세/.test(l)).map(([l, v]) => `<span class="mod ${v > 0 ? 'p' : v < 0 ? 'm' : ''}">${esc(l)}${v ? ` → ${v > 0 ? `${pd.twoWay ? '성공' : '대운'} +${v}칸` : `꽝 +${-v}칸`}` : ''}</span>`).join('')}</div>
    <div style="text-align:center;margin-top:12px">${mine(p) ? '<button class="btn y big" data-a=\'{"a":"spin"}\'>🎡 돌리기!</button>' : `<span class="jua muted">${waitText(p)}</span>`}</div></div></div></div>`);
};
// 빚쟁이의 아주 드문 제안: 빚 룰렛 (2배 · 그대로 · 50% · 탕감) — 칸을 보고 돌릴지 고름
const DEBT_COL = { zero: '#3BB273', half: '#FFB020', same: '#6B9BFF', x2: '#E8505B' };
VIEW.creditorOffer = (pd, p) => {
  const info = { zero: ['🎉', '탕감', '빚이 전부 사라져요!'], half: ['🙂', '50%', '빚이 절반으로 줄어요'], same: ['😌', '그대로', '빚은 그대로, 이번엔 안 가져가요'], x2: ['💥', '2배', '빚이 두 배로 늘어요…'] };
  const list = ['zero', 'half', 'same', 'x2'].map(k => [k, pd.kinds.filter(x => x === k).length]).filter(([, c]) => c)
    .map(([k, c]) => `<div class="fo ${k === 'x2' ? 'b' : k === 'same' ? 'n' : 'g'}"><span class="fi">${info[k][0]}</span><div><b>${info[k][1]} ${c}칸</b><small>${info[k][2]}</small></div></div>`).join('');
  ov(`<div class="modal" style="width:980px"><h2>🕶️ "오늘은 기분이 좋아. 빚 룰렛 한 판 할래?" ${whoBadge(p)}</h2>
    <div class="fwrap"><div class="flist">${list}<p class="jua" style="font-size:22px;text-align:center">지금 빚 ${money(pd.debt)}</p></div><div>
    <div class="wheelbox"><div class="ptr"></div>${A.wheelSvg(pd.kinds.map((k, i) => ({ label: pd.labels[i], color: DEBT_COL[k], small: true })), 330)}</div>
    <div style="text-align:center;margin-top:12px">${mine(p) ? `<button class="btn y big" data-a='${J({ go: true })}'>🎡 돌린다</button> <button class="btn w big" data-a='${J({ go: false })}'>평소대로 갚는다</button>` : `<span class="jua muted">${waitText(p)}</span>`}</div></div></div></div>`);
};
// 빚쟁이: 돈이 넉넉할 때 나눠 갚기 · 다 갚기 (갚을 때 이자도 같이)
VIEW.repay = (pd, p) => evScreen(p, { title: '🕶️ 빚쟁이가 찾아왔어요! 어떻게 갚을까?', lines: [`빚 ${money(pd.debt)} · 이자 ${money(pd.it)} (빚의 5%) · 가진 돈 ${money(p.money)}`, `나눠 갚기 = 원금 ${money(pd.part)} + 이자 · 다 갚기 = 빚 전부 + 이자 (빚쟁이 끝!)`], bg: 'creditor', color: 'purple',
  choices: [{ a: { all: false }, label: `🪙 나눠 갚기 ${money(pd.part + pd.it)}` }, { a: { all: true }, label: `💰 다 갚기 ${money(pd.debt + pd.it)}` }] });
// 퀴즈쇼 슬롯 머신: 칸마다 이름들이 돌다가 왼쪽부터 하나씩 멈춤 (맨 위는 ❓)
const SLOT_REP = 8;
VIEW.slot = (pd, p) => {
  const reel = rl => `<div class="reelc"><div class="rh">${esc(rl.head)}</div><div class="reel" data-n="${rl.items.length}"><div class="strip"><div class="it q">?</div>${Array.from({ length: SLOT_REP }, () => rl.items.map(x => `<div class="it">${esc(x)}</div>`).join('')).join('')}</div></div></div>`;
  ov(`<div class="modal" style="width:${pd.reels.length > 4 ? 1080 : 920}px"><h2>🎰 퀴즈쇼 룰렛! ${whoBadge(p)} 승리</h2>
    <p class="muted" style="text-align:center;margin-bottom:10px">${pd.reels.map(rl => rl.head).join(' · ')} — 한 번에 돌려요!</p>
    <div class="slotm">${pd.reels.map(reel).join('')}</div>
    <div class="slot-say">${pd.student ? '능력치' : '돈'}을 주고받는 룰렛이에요</div>
    <div style="text-align:center;margin-top:8px">${mine(p) ? '<button class="btn y big" data-a=\'{"a":"spin"}\'>🎰 돌리기!</button>' : `<span class="jua muted">${waitText(p)}</span>`}</div></div>`);
};
VIEW.wheel = (pd, p) => {
  const segs = pd.purpose === 'talent' || pd.purpose === 'creditorStat' ? [{ label: '지력', color: '#6B9BFF', small: true }, { label: '체력', color: '#FF7A7A', small: true }, { label: '센스', color: '#FFB020', small: true }]
    : A.labelSegs(pd.labels);
  ov(`<div class="modal" style="width:620px"><h2>${esc(pd.title)}</h2>
    ${pd.purpose === 'talent' ? '<p class="muted" style="text-align:center">🧠 지력 · 💪 체력 · ✨ 센스 — 받은 재능은 더 잘 자라요</p>' : ''}
    ${pd.purpose === 'creditorStat' ? '<p class="muted" style="text-align:center">돈이 계속 없으면 빚쟁이가 능력치를 가져가요 — 빚은 빨리 갚아요!</p>' : ''}
    <div class="wheelbox" style="margin-top:8px"><div class="ptr"></div>${A.wheelSvg(segs, 330)}</div>
    <div style="text-align:center;margin-top:12px">${mine(p) ? '<button class="btn y big" data-a=\'{"a":"spin"}\'>🎡 돌리기!</button>' : `<span class="jua muted">${waitText(p)}</span>`}</div></div>`);
};
VIEW.pickClub = (pd, p) => {
  ov(`<div class="modal" style="width:1080px"><h2>${esc(pd.title)} ${whoBadge(p)}</h2><div class="grid" style="grid-template-columns:repeat(4,1fr)">${C.CLUBS.map(c => `<button class="opt" data-a='${J({ club: c.k })}' ${dis(p)}><div class="ic">${c.icon}</div><b>${c.name}</b><span>${Object.keys(c.gain).map(s => C.STATS[s]).join('·')}↑ · ${c.contest}${c.tag ? ` · ${C.TAG_ICON[c.tag]} ${c.tag} 경험` : ''}</span></button>`).join('')}</div>${comNote(p)}</div>`);
};
VIEW.pickSchool = (pd, p) => {
  const card = h => {
    const x = h.exam, my = x ? E.grade(p, x.stat) : 0, ok = !x || my >= x.need, closed = pd.retry && x;
    const req = !x ? '<div class="exam ok">✅ 바로 입학</div>'
      : `<div class="exam ${ok ? 'ok' : 'hard'}">📝 ${esc(x.name)}<br>${C.STATS[x.stat]} ${C.GRADES[x.need]} 이상이면 유리 · 지금 ${C.GRADES[my]} ${ok ? '✅' : '⚠️'}</div>`;
    return `<button class="opt" ${closed ? 'disabled' : `data-a='${J({ school: h.k })}'`} ${dis(p)}><div class="ic">${h.icon}</div><b>${h.name}</b><span>${h.desc}</span>${req}</button>`;
  };
  ov(`<div class="modal" style="width:1120px"><h2>🏫 ${pd.retry ? '다른 고등학교를 골라요' : '어느 고등학교로 갈까?'} ${whoBadge(p)}</h2>
    <p class="muted" style="text-align:center;margin-bottom:8px">${pd.retry ? '심사가 있는 학교는 다음 기회에! 일반고·특성화고는 바로 입학해요' : '심사가 있는 학교는 입학 룰렛을 돌려요 — 그 능력치가 높을수록 합격 칸이 많아요'}</p>
    <div class="grid" style="grid-template-columns:repeat(3,1fr)">${C.HIGH_SCHOOLS.map(card).join('')}</div>${comNote(p)}</div>`);
};
VIEW.pickTag = (pd, p) => {
  ov(`<div class="modal" style="width:960px"><h2>${esc(pd.title)} ${whoBadge(p)}</h2><div class="grid" style="grid-template-columns:repeat(4,1fr)">${C.TAGS.map(t => `<button class="opt" data-a='${J({ tag: t })}' ${dis(p)}><div class="ic">${C.TAG_ICON[t]}</div><b>${t}</b><span>지금 경험 ${p.tags[t]}</span></button>`).join('')}</div>${comNote(p)}</div>`);
};
VIEW.pickDept = (pd, p) => {
  ov(`<div class="modal" style="width:820px"><h2>🎓 ${pd.tag} 분야 학과를 골라요</h2><div class="grid" style="grid-template-columns:repeat(${Math.min(4, pd.depts.length)},1fr)">${pd.depts.map(d => `<button class="opt" data-a='${J({ dept: d })}' ${dis(p)}><div class="ic">${C.TAG_ICON[pd.tag]}</div><b>${d}</b></button>`).join('')}</div>${comNote(p)}</div>`);
};
VIEW.pickCareer = (pd, p) => {
  const sc = p.school === 'meister' ? '🏅 마이스터고' : p.school === 'special' ? '🔧 특성화고' : null, rule = '졸업하면 취업 또는 창업';
  const opts = [
    { k: 'uni4', ic: '🎓', n: '4년제 대학', d: `학비 ${money(C.COST.tuition4)} (장학금 심사 룰렛) · 학과 경험 +2 · 지력↑ · 4년제부터 가능한 직업까지` },
    { k: 'uni2', ic: '🏫', n: '전문대 (2~3년제 대학)', d: `학비 ${money(C.COST.tuition2)} (장학금 심사 룰렛) · 학과 경험 +1 · 체력↑ · 실무 직업 유리` },
    { k: 'job', ic: '💼', n: '바로 취업', d: '고졸부터 가능한 직업 중 선택 · 일찍 연봉을 받아요' + (sc ? ` · ${sc} 취업 보장!` : '') },
    { k: 'startup', ic: '🚀', n: '창업 도전', d: '창업 룰렛! 투자 유치 / 1인 창업 / 실패' },
  ];
  const off = k => !E.careerOk(p, k);
  ov(`<div class="modal" style="width:1080px"><h2>🧭 진로 선택! ${whoBadge(p)}</h2><div class="grid" style="grid-template-columns:repeat(4,1fr)">${opts.map(o => `<button class="opt" ${off(o.k) ? 'disabled' : `data-a='${J({ career: o.k })}' ${dis(p)}`}><div class="ic">${off(o.k) ? '🔒' : o.ic}</div><b>${o.n}</b><span>${off(o.k) ? `${sc}는 ${rule}해요 — 대학은 일하면서 '선취업 후진학'으로` : o.d}</span></button>`).join('')}</div>
    <p class="muted" style="text-align:center;margin-top:10px">${sc ? `${sc}: ${rule} · ` : '대학은 장학금 심사 룰렛(지력) — 모자란 학비는 학자금 대출 · '}지금 능력치 ${['int', 'str', 'sen'].map(s => C.STAT_SHORT[s] + C.GRADES[E.grade(p, s)]).join(' ')}</p>${comNote(p)}</div>`);
};
VIEW.careerSetup = (pd, p) => {
  if (pd.step === 'talent') ov(`<div class="modal" style="width:820px"><h2>✨ 나의 재능은? ${whoBadge(p)}</h2><div class="grid" style="grid-template-columns:repeat(3,1fr)">${[['int', '🧠'], ['str', '💪'], ['sen', '✨']].map(([s, ic]) => `<button class="opt" data-a='${J({ talent: s })}' ${dis(p)}><div class="ic">${ic}</div><b>${C.STATS[s]}</b><span>이 능력치가 B로 시작해요</span></button>`).join('')}</div>${comNote(p)}</div>`);
  else if (pd.step === 'school') ov(`<div class="modal" style="width:900px"><h2>🏫 어느 고등학교를 나왔을까?</h2><div class="grid" style="grid-template-columns:repeat(3,1fr)">${C.HIGH_SCHOOLS.map(h => `<button class="opt" data-a='${J({ school: h.k })}' ${dis(p)}><div class="ic">${h.icon}</div><b>${h.name}</b><span>${h.desc}</span></button>`).join('')}</div>${comNote(p)}</div>`);
  else {
    app.tagSel = app.tagSel || [];
    ov(`<div class="modal" style="width:960px"><h2>🧭 학창 시절 경험 2개를 골라요</h2><div class="grid" style="grid-template-columns:repeat(4,1fr)">${C.TAGS.map(t => `<button class="opt" style="${app.tagSel.includes(t) ? 'border-color:#5B4BDB;background:#EDE9FF' : ''}" data-ui='${J({ k: 'tagsel', t })}' ${dis(p)}><div class="ic">${C.TAG_ICON[t]}</div><b>${t}</b></button>`).join('')}</div>
      <div style="text-align:center;margin-top:12px"><button class="btn y" ${app.tagSel.length === 2 ? '' : 'disabled'} data-a='${J({ tags: app.tagSel })}'>이걸로 시작!</button></div>${comNote(p)}</div>`);
  }
};
UI.tagsel = o => { const s = app.tagSel || []; app.tagSel = s.includes(o.t) ? s.filter(x => x !== o.t) : s.length < 2 ? [...s, o.t] : s; VIEW.careerSetup(app.S.pending, P(app.S.pending.pid)); };

const salText = j => j.titles === '크리에이터' ? `광고 수익 ${money(1000)}~` : j.titles === '창업' ? `회사 규모에 따라 ${money(2000)}~` : `연봉 ${money(j.salary)}${j.salaryKnown ? '' : '*'}`;
function jobCard(j, p, card) {
  const req = j.req.map(([s, g]) => `${C.STAT_SHORT[s]} ${C.GRADES[g]}`).join(' · ');
  const sal = salText(j);
  const eduTxt = ['고졸', '전문대', '4년제'][j.edu] + '부터';
  const realEdu = j.eduDist ? j.eduDist.filter(([, v]) => v >= 15).map(([n, v]) => `${n.replace('졸', '')} ${v}%`).join(' · ') : '';
  const relax = card.ok && j.tags.some(t => p.tags[t] > 0);
  return `<div class="jcard ${card.ok ? '' : 'locked'}" ${card.ok && mine(p) && !card.view ? `data-ui='${J({ k: 'jobAsk', id: j.id })}'` : ''} title="${esc(j.desc)}">
    <div class="top"><span><span class="ic">${j.icon}</span> <b>${esc(j.name)}</b></span></div>
    <div><span class="fld">${j.field}</span> ${j.future ? '<span class="badge">🚀 미래</span>' : ''}${j.green ? '<span class="badge" style="background:#DFF5E3;color:#2E7D4A">💚</span>' : ''}${j.kind === '안정' ? '<span class="badge" style="background:#E3EEFF;color:#3E5BA8">안정</span>' : ''}</div>
    <p>${esc(j.desc)}</p>
    <div class="meta">🎓 ${eduTxt} · ${req}${realEdu ? `<br><span class="muted">실제: ${esc(realEdu)}</span>` : ''}<br><span class="sal">💰 ${sal}</span></div>
    ${card.ok ? (relax ? `<div class="badge" style="background:#DFF5E3;color:#2E7D4A">✅ ${j.tags.filter(t => p.tags[t] > 0).join('·')} 경험 → 조건 완화</div>` : '') : `<div class="miss">🔒 ${esc(card.missing.join(', '))}</div>`}
  </div>`;
}
VIEW.pickJob = (pd, p) => {
  ov(`<div class="modal" style="width:1240px;padding:14px 20px"><h2 style="margin-bottom:6px;font-size:28px">${pd.change ? '💼 이직할 곳을 골라요' : '💼 직업을 골라요!'} ${whoBadge(p)} <span class="muted" style="font-size:16px">연봉은 커리어넷 평균 (*는 비슷한 직업 기준)</span></h2>
    <div class="jobs">${pd.cards.map(c => jobCard(JOBS[c.id], p, c)).join('')}</div>
    <div style="display:flex;justify-content:center;gap:12px;margin-top:10px">
      ${pd.reroll ? `<button class="btn w" data-a='{"reroll":true}' ${dis(p)}>🔄 다른 직업 보기 (1번)</button>` : ''}
      ${pd.change ? `<button class="btn w" data-a='{"stay":true}' ${dis(p)}>지금 직업 계속하기</button>` : `<button class="btn w" data-a='{"free":true}' ${dis(p)}>🧑‍💻 프리랜서로 시작</button>`}
    </div>${comNote(p)}</div>`);
};
VIEW.loveMenu = (pd, p) => {
  const S = app.S;
  const contacts = p.contacts.map(c => { const n = E.npcOf(S, c.id), j = JOBS[n.jobId], t = C.TASTES.find(x => x.k === n.taste); const rival = S.players.some(q => q.id !== p.id && q.contacts.some(x => x.id === n.id));
    return `<button class="opt" style="text-align:left" data-a='${J({ npc: n.id })}' ${dis(p)}><div style="display:flex;gap:10px;align-items:center">${A.faceSvg(n.look, n.gender, 'adult', 60)}<div><b>${esc(n.name)}</b><span>${j.icon} ${esc(j.name)} ${'★'.repeat(n.rank)} · ${t.icon} ${t.name}${rival ? ' · 💘 라이벌 있음' : ''}</span></div></div><div class="lovebar" style="margin-top:8px"><i style="width:${c.love}%"></i></div><span>💗 호감도 ${c.love}</span></button>`; }).join('');
  ov(`<div class="modal" style="width:980px"><h2>💗 사랑 칸! ${whoBadge(p)}</h2>
    <div class="grid" style="grid-template-columns:repeat(3,1fr)">${pd.canMeet ? `<button class="opt" data-a='{"meet":true}' ${dis(p)}><div class="ic">✨</div><b>새로운 만남</b><span>내 경험과 관련된 곳에서 우연히 만나요</span></button>` : ''}${contacts}</div>
    <div style="text-align:center;margin-top:12px"><button class="btn w" data-a='{"skip":true}' ${dis(p)}>오늘은 혼자만의 시간</button></div>${comNote(p)}</div>`);
};
VIEW.datePick = (pd, p) => {
  const n = E.npcOf(app.S, pd.npc), t = C.TASTES.find(x => x.k === n.taste);
  ov(`<div class="modal" style="width:980px"><h2>${pd.spouse ? `💑 ${esc(n.name)}(배우자)와 데이트` : `💗 ${esc(n.name)}와(과) 데이트`}</h2>
    <p class="muted" style="text-align:center;margin-bottom:10px">${t.icon} ${n.name}은(는) ${t.name}! ${pd.spouse ? '돈 쓰는 데이트를 하면 호감도가 확 올라요' : '취향에 맞는 데이트를 고르면 보너스'}</p>
    <div class="grid" style="grid-template-columns:repeat(${pd.places.length},1fr)">${pd.places.map(k => { const d = C.DATE_PLACES.find(x => x.k === k); return `<button class="opt" data-a='${J({ place: k })}' ${dis(p)}><div class="ic">${C.TASTES.find(x => x.k === d.taste).icon}</div><b>${d.name}</b><span>${d.cost ? money(d.cost) : '무료'}${d.taste === n.taste ? ' · 💖 취향 저격' : ''}</span></button>`; }).join('')}</div>${comNote(p)}</div>`);
};
VIEW.dateEnd = (pd, p) => {
  const n = E.npcOf(app.S, pd.npc);
  const partner = A.fullSvg(n.look, { age: ageOf() === 'elder' ? 'elder' : 'adult', gender: n.gender, mood: 'g' }, 210, 330);
  const choices = [];
  if (pd.spouse) { if (pd.canBaby) choices.push({ a: { baby: true }, label: '👶 아기 룰렛', tag: `<span class="tag">꽝 ${pd.badSlots}칸</span>` }); }
  else choices.push({ a: { propose: true }, label: '💍 프로포즈하기', tag: `<span class="tag">꽝 ${pd.badSlots}칸</span>` });
  choices.push({ a: {}, label: '오늘은 여기까지' });
  const more = pd.babyBlocked ? ['🏠 집이 좁아요! 더 큰 집으로 이사하면 아기 룰렛'] : pd.spouse && !pd.canBaby ? ['호감도 60 이상이면 아기 룰렛!'] : [];
  evScreen(p, { title: `💗 ${n.name}와(과) 데이트! 호감도 ${pd.love} (+${pd.gain})`, lines: [...pd.lines, ...more], bg: pd.bg, color: 'pink', partner, hearts: pd.love >= 60, choices });
};
VIEW.shopAsk = (pd, p) => {
  ov(`<div class="modal" style="width:560px"><h2>🛍️ 상점을 지나가요</h2><p style="text-align:center;font-size:20px;margin-bottom:14px">들러서 차·카드·보험을 살까요? (지금 ${money(p.money)})</p>
    <div style="display:flex;justify-content:center;gap:12px"><button class="btn y" data-a='{"enter":true}' ${dis(p)}>들르기</button><button class="btn w" data-a='{}' ${dis(p)}>지나가기</button></div>${comNote(p)}</div>`);
};
VIEW.shop = (pd, p) => {
  const items = E.shopItems(app.S, p, pd.discount);
  const group = (kind, title) => { const list = items.filter(i => i.kind === kind); return list.length ? `<h3 class="jua" style="color:#5B4BDB;margin:8px 0 6px">${title}</h3><div class="items">${list.map(i => `<div class="item ${i.full || !mine(p) ? 'no' : ''}" ${i.full || !mine(p) ? '' : i.kind === 'car' || i.kind === 'house' ? `data-ui='${J({ k: 'buyAsk', kind: i.kind, key: i.k })}'` : `data-a='${J({ kind: i.kind, k: i.k })}'`}><span class="ic">${i.icon}</span><b>${esc(i.name)}</b><small>${esc(i.note || '')}</small><span class="pr">${money(i.price)}${i.full && i.kind !== 'card' ? ' 🔒 한도 초과' : i.price > p.money ? ' (대출)' : ''}</span></div>`).join('')}</div>` : ''; };
  ov(`<div class="modal shop"><h2>🛍️ 상점 ${pd.exact ? '— 딱 멈춤! 전 품목 30% 할인' : ''}</h2>
    <p style="text-align:center;margin-bottom:6px">${whoBadge(p)} · 가진 돈 <b class="jua">${money(p.money)}</b> · 카드 ${p.cards.length}/${C.CARD_MAX}${pd.free ? ` · 🎁 무료 카드: ${C.CARDS[pd.free].icon} ${C.CARDS[pd.free].name}` : ''}</p>
    <div style="max-height:500px;overflow:auto">${group('car', '🚗 자동차 (종류마다 1대, 선착순)')}${group('card', '🃏 카드·티켓 (최대 5장)')}${group('ins', '🛡️ 보험')}${group('house', '🏠 이사 (지금 집은 50%에 팔려요)')}${group('smart', '🔧 개조')}</div>
    <div style="text-align:center;margin-top:10px"><button class="btn y" data-a='{"leave":true}' ${dis(p)}>나가기</button></div>${comNote(p)}</div>`);
};
VIEW.house = (pd, p) => {
  ov(`<div class="modal" style="width:1100px"><h2>🏠 집 장만 기회! ${whoBadge(p)}</h2><p class="muted" style="text-align:center;margin-bottom:10px">지금 ${money(p.money)} · 더 빌릴 수 있는 돈 ${money(E.loanRoom(app.S, p))} (연봉의 8배까지) · ${p.house.k !== 'room' ? '지금 집은 현재 집값의 50%에 팔려요 · ' : ''}종류마다 1채, 선착순</p>
    <div class="grid" style="grid-template-columns:repeat(4,1fr)">${pd.list.map(h => `<button class="opt ${h.ok ? '' : 'locked'}" ${h.ok ? `data-ui='${J({ k: 'buyAsk', key: h.k })}'` : ''} ${dis(p)}><div class="ic">${h.icon}</div><b>${h.name}</b><span>${money(h.price)}<br>${esc(h.note)}${h.ok ? '' : '<br>🔒 대출 한도 초과'}</span></button>`).join('')}
    ${C.HOUSES.filter(h => h.k !== 'room' && app.S.market.houses[h.k] != null && app.S.market.houses[h.k] !== p.id).map(h => `<div class="opt locked"><div class="ic">${h.icon}</div><b>${h.name}</b><span>🏷️ 품절 (${esc(P(app.S.market.houses[h.k]).name)})</span></div>`).join('')}</div>
    <div style="text-align:center;margin-top:12px"><button class="btn w" data-a='{}' ${dis(p)}>이번엔 안 사기</button></div>${comNote(p)}</div>`);
};
VIEW.stock = (pd, p) => {
  const v = p.stocks.reduce((s, x) => s + x.value, 0);
  ov(`<div class="modal" style="width:780px"><h2>📈 증권 칸 ${whoBadge(p)}</h2><p class="muted" style="text-align:center;margin-bottom:10px">주식 뽑기 룰렛: 🌟 유망주 / 🙂 보통주 / 💥 휴지조각 · 지력·경험·운세가 좋으면 꽝이 줄어요</p>
    <div class="grid" style="grid-template-columns:repeat(3,1fr)">${pd.amounts.map(a => `<button class="opt" data-a='${J({ amount: a })}' ${dis(p)}><div class="ic">💹</div><b>${money(a)}</b><span>${['조금', '보통', '많이'][pd.amounts.indexOf(a)]}</span></button>`).join('')}</div>
    <div style="display:flex;justify-content:center;gap:12px;margin-top:12px">${p.stocks.length ? `<button class="btn p" data-a='{"sell":true}' ${dis(p)}>모두 팔기 (${money(v)})</button>` : ''}<button class="btn w" data-a='{}' ${dis(p)}>그냥 지나가기</button></div>${comNote(p)}</div>`);
};
VIEW.reverse = (pd, p) => {
  ov(`<div class="modal" style="width:640px"><h2>🎲 인생역전 칸!</h2><p style="text-align:center;font-size:21px">도전하면 가진 돈(${money(p.money)})이<br>🌟 두 배 / 🙂 그대로 / 💥 반으로!</p>
    <div style="display:flex;justify-content:center;gap:12px;margin-top:16px"><button class="btn y big" data-a='{"go":true}' ${dis(p)}>도전!</button><button class="btn w big" data-a='{}' ${dis(p)}>안 한다</button></div>${comNote(p)}</div>`);
};
VIEW.kidDream = (pd, p) => {
  const k = p.kids[pd.idx], d = JOBS[pd.dream], b = JOBS[pd.best];
  ov(`<div class="modal" style="width:900px"><h2>🎓 ${esc(k.name)}: "나는 ${esc(d.name)}이(가) 되고 싶어!"</h2>
    <div style="display:flex;gap:18px;align-items:center">${A.fullSvg(k.look, { age: 'high', gender: k.gender, mood: 'g' }, 150, 240)}
    <div class="grid" style="grid-template-columns:1fr 1fr;flex:1">
      <button class="opt" data-a='{"support":true}' ${dis(p)}><div class="ic">${d.icon}</div><b>꿈을 응원한다</b><span>${esc(d.name)} · 연봉 ${money(d.salary)}<br>😊 행복도 +10</span></button>
      <button class="opt" data-a='{"support":false}' ${dis(p)}><div class="ic">${b.icon}</div><b>돈 잘 버는 직업을 권한다</b><span>${esc(b.name)} · 연봉 ${money(b.salary)}<br>😟 행복도 −10</span></button>
    </div></div>${comNote(p)}</div>`);
};
VIEW.quiz = (pd) => {
  // 이 기기에서 답할 사람: 온라인은 나만, 한 기기는 아직 안 낸 사람 차례대로
  const next = app.net ? (pd.pids.includes(app.net.me) && !pd.answers[app.net.me] ? P(app.net.me) : null)
                       : pd.pids.map(id => P(id)).find(q => !q.isCom && !pd.answers[q.id]);
  const key = pd.n + ':' + (next ? next.id : '-');
  if (app.quizKey !== key) { app.quizKey = key; app.quizStart = Date.now(); } // 같은 문제를 다시 그려도 시간은 이어서
  const many = pd.pids.length > 1;
  const done = pd.pids.filter(id => pd.answers[id]).length;
  const foot = next ? `<p style="text-align:center;margin-top:12px">${whoBadge(next)}의 답은?</p>`
    : `<p class="jua" style="text-align:center;margin-top:12px;font-size:22px">${app.net && pd.answers[app.net.me] ? '✅ 답을 냈어요! 친구들을 기다려요' : '🎤 퀴즈쇼를 보는 중…'} (${done}/${pd.pids.length})</p>`;
  ov(`<div class="modal" style="width:820px"><h2>${many ? '🎤 같은 칸 퀴즈쇼!' : '❓ 퀴즈 칸'} <span class="muted" style="font-size:18px">${esc(pd.q.u)}</span></h2>
    ${many ? `<p style="text-align:center;margin-bottom:6px">${pd.pids.map(id => whoBadge(P(id)) + (pd.answers[id] ? ' ✅' : '')).join(' vs ')} · 가장 빨리 맞힌 사람이 승리!</p>` : ''}
    <p class="jua" style="font-size:30px;text-align:center;margin:10px 0 16px">${esc(pd.q.q)}</p>
    <div class="grid" style="grid-template-columns:1fr 1fr">${pd.q.o.map((o, i) => `<button class="choice" style="justify-content:center" ${next ? `data-ui='${J({ k: 'quizAns', pid: next.id, c: i })}'` : 'disabled'}>${esc(o)}</button>`).join('')}</div>
    ${foot}</div>`);
};
VIEW.results = () => renderResults();

/* ═════════════ 상태·지도·카드 창 ═════════════ */
function showStatus(pid) {
  const S = app.S, p = P(pid);
  app.peek = true;
  const a = E.assets(S, p);
  const tabs = S.players.map(q => `<button class="btn sm ${q.id === pid ? 'p' : 'w'}" data-ui='${J({ k: 'status', pid: q.id })}'>${esc(q.name)}</button>`).join('');
  const spouse = p.spouse != null ? E.npcOf(S, p.spouse) : null;
  const medal = E.medalOf(p); const nextMedal = [...C.MEDALS].reverse().find(([n]) => p.green < n);
  ov(`<div class="modal"><div class="tabs">${tabs}</div><div class="stat-grid">
    <div class="box" style="text-align:center">${p.isCom ? A.robotFull(160, 240) : A.fullSvg(p.look, { age: ageOf(), gender: p.gender }, 170, 260)}<b class="jua" style="font-size:24px;display:block">${esc(p.name)}</b><span class="muted">${esc(E.jobTitle(p) || C.STAGES[S.stage].name)}</span>${nextRankText(p) ? `<div style="font-size:13px;color:#2E7D4A;margin-top:4px">${esc(nextRankText(p))}</div>` : ''}${(p.treasures || []).length ? `<div style="margin-top:6px;font-size:14px">💎 보물 ${p.treasures.map(k => (C.TREASURES.find(x => x.k === k) || {}).icon || '').join(' ')} <span class="muted">(마지막에 감정)</span></div>` : ''}</div>
    <div class="grid" style="gap:10px">
      <div class="box"><h3>능력치</h3>${['int', 'str', 'sen'].map(s => `<div class="kv"><span>${C.STATS[s]}${p.talent === s ? ' ⭐재능' : ''}</span><b class="jua">${C.GRADES[E.grade(p, s)]} (${p.stats[s]})</b></div>`).join('')}<div class="kv"><span>운세</span><b>${C.LUCK_ICON[p.luck]} ${C.LUCK[p.luck]}</b></div><div class="kv"><span>😊 행복도</span><b>${p.happy}</b></div><div class="kv"><span>💚 사회기여</span><b>${p.green} ${medal ? medal[1] : ''}${nextMedal ? ` <span class="muted" style="font-size:13px">다음 훈장까지 ${nextMedal[0] - p.green}</span>` : ''}</b></div></div>
      <div class="box"><h3>경험 태그</h3><div class="chips">${C.TAGS.filter(t => p.tags[t] > 0).map(t => `<span class="chip">${C.TAG_ICON[t]} ${t} ×${p.tags[t]}</span>`).join('') || '<span class="muted">아직 없어요</span>'}</div>
        <h3 style="margin-top:8px">진로 흐름</h3><div class="chips">${p.hist.map(h => `<span class="chip" style="background:#FFF1C2;color:#8A6A00">${esc(h)}</span>`).join(' → ') || '<span class="muted">이제 시작!</span>'}</div>
        ${p.awards.length ? `<h3 style="margin-top:8px">상장</h3><div class="chips">${p.awards.map(w => `<span class="chip">🏆 ${esc(w)}</span>`).join('')}</div>` : ''}</div>
    </div>
    <div class="grid" style="gap:10px">
      <div class="box"><h3>재산 (지금 계산하면)</h3>
        <div class="kv"><span>💰 돈</span><b>${money(a.cash)}</b></div><div class="kv"><span>🏠 ${C.HOUSES.find(h => h.k === p.house.k).name}</span><b>${money(a.house)}</b></div>
        <div class="kv"><span>🚗 ${p.car ? C.CARS.find(c => c.k === p.car).name + ' (50%)' : '자전거'}</span><b>${money(a.car)}</b></div><div class="kv"><span>📈 주식 ${p.stocks.length}개</span><b>${money(a.stock)}</b></div>
        ${p.souvenirs.length ? `<div class="kv"><span>🎁 친구 기념품</span><b>${money(a.souvenir)}</b></div>` : ''}${(p.treasures || []).length ? `<div class="kv"><span>💎 보물 ${p.treasures.length}개</span><b>${p.treasureVals ? money(a.treasure) : '감정 전 ?'}</b></div>` : ''}${p.debt ? `<div class="kv"><span>🧾 빚 ${money(p.debt)} <small class="muted">+ 정산 이자 20%</small></span><b class="minus">−${money(a.debt)}</b></div>` : ''}
        <div class="kv"><span>🏅 훈장 포상금</span><b>${money(a.medal)}</b></div><div class="kv" style="border-top:2px dashed #EEE;margin-top:4px;padding-top:6px"><span class="jua">인생 총점</span><b class="jua" style="color:#5B4BDB;font-size:20px">${money(a.total)}</b></div></div>
      <div class="box"><h3>가족</h3>${spouse ? `<div class="kv"><span>💑 ${esc(spouse.name)}</span><b>${esc(JOBS[spouse.jobId].name)} ${'★'.repeat(spouse.rank)}</b></div><div class="lovebar"><i style="width:${p.love || 0}%"></i></div>` : (p.contacts.length ? p.contacts.map(c => `<div class="kv"><span>💗 ${esc(E.npcOf(S, c.id).name)}</span><b>${c.love}</b></div>`).join('') : '<span class="muted">1인 가구</span>')}
        ${p.kids.map(k => `<div class="kv"><span>👶 ${esc(k.name)}</span><b>${k.jobId != null ? esc(JOBS[k.jobId].name) : '자라는 중'}</b></div>`).join('')}
        <div class="kv"><span>🃏 카드</span><b>${p.cards.map(c => C.CARDS[c].icon).join(' ') || '없음'}</b></div><div class="kv"><span>🛡️ 보험</span><b>${Object.keys(p.insurance).map(k => C.INSURANCE[k].name.replace(' 보험', '')).join('·') || '없음'}</b></div></div>
    </div></div><div style="text-align:center;margin-top:12px"><button class="btn y" data-ui='{"k":"closeOv"}'>닫기</button></div></div>`);
}
function showMap() {
  const S = app.S, W = 160 * 2 + (app.maxK + 2) * CW, scale = 1160 / W;
  app.peek = true;
  const svg = $('#worldsvg').outerHTML.replace('id="worldsvg"', `viewBox="0 0 ${W} 720" width="1160" height="${Math.round(720 * scale) + 10}"`).replace(/id="(cells|tokens)"/g, '');
  ov(`<div class="modal" style="width:1220px"><h2>🗺️ 인생 지도</h2><div style="overflow:auto;max-height:520px">${svg}</div>
    <p class="muted" style="text-align:center">${S.players.map(q => `<span style="color:${PCOL[q.id]}">●</span> ${esc(q.name)}`).join(' &nbsp; ')}</p>
    <div style="text-align:center;margin-top:8px"><button class="btn y" data-ui='{"k":"closeOv"}'>닫기</button></div></div>`);
}
function showCards() {
  const S = app.S, p = P(S.pending.pid);
  app.peek = true;
  ov(`<div class="modal" style="width:900px"><h2>🃏 내 카드 (${p.cards.length}/${C.CARD_MAX})</h2>
    <div class="grid" style="grid-template-columns:repeat(3,1fr)">${p.cards.map((c, i) => `<button class="opt" data-ui='${J({ k: 'usecard', i, card: c })}'><div class="ic">${C.CARDS[c].icon}</div><b>${C.CARDS[c].name}</b><span>${C.CARDS[c].desc}</span></button>`).join('') || '<p class="muted" style="grid-column:span 3;text-align:center">카드가 없어요. 상점이나 대회 상품으로 얻을 수 있어요!</p>'}</div>
    <p class="muted" style="text-align:center;margin-top:8px">카드는 룰렛을 돌리기 전에만 쓸 수 있어요</p>
    <div style="text-align:center;margin-top:10px"><button class="btn w" data-ui='{"k":"closeOv"}'>닫기</button></div></div>`);
}
function showPickNumber(i) {
  ov(`<div class="modal" style="width:700px"><h2>🎯 몇 칸 갈까요?</h2><div class="grid" style="grid-template-columns:repeat(5,1fr)">${Array.from({ length: 10 }, (_, k) => `<button class="opt" data-ui='${J({ k: 'picknum', i, v: k + 1 })}'><b style="font-size:34px">${k + 1}</b><span>${(C.CELL_INFO[peek(k + 1)] || {}).name || ''}</span></button>`).join('')}</div></div>`);
}
function peek(n) { const S = app.S, p = P(S.pending.pid); let id = p.pos; for (let i = 0; i < n; i++) { const c = S.board.cells[id]; if (!c.next.length) break; id = c.next[0]; } return S.board.cells[id].type; }

/* ═════════════ 결과·인생 보고서 ═════════════ */
function renderResults() {
  SND.bgm('result');
  const S = app.S, R = S.results;
  clearCom();
  $('#menu') && ($('#menu').innerHTML = ''); $('#spinbox') && ($('#spinbox').innerHTML = '');
  const rows = R.rows.map(r => { const p = P(r.pid); return `<div class="rank-row" data-ui='${J({ k: 'report', pid: p.id })}'>
    <span class="no">${r.rank}</span><span>${p.isCom ? A.robotFace(46) : A.faceSvg(p.look, p.gender, R.growth ? 'high' : 'elder', 50)}</span>
    <span><b>${esc(p.name)}</b> <span class="muted">${esc(r.title)}</span></span>
    <span class="jua" style="font-size:22px;color:#5B4BDB">${R.growth ? r.score + '점' : money(r.score)}</span><span>${r.medal ? r.medal[1] + ' ' + r.medal[2] : ''}</span></div>`; }).join('');
  ov(`<div class="modal report"><h2>🏆 ${R.growth ? '성장 보고서 — 성장 점수 순위' : '인생 총점 순위'}</h2><div class="grid" style="gap:8px">${rows}</div>
    <p class="muted" style="text-align:center;margin-top:8px">이름을 누르면 ${R.growth ? '성장' : '인생'} 보고서를 볼 수 있어요</p>
    <div style="text-align:center;margin-top:12px;display:flex;gap:10px;justify-content:center">${R.growth ? '' : '<button class="btn p" data-ui=\'{"k":"graph"}\'>📈 총자산 그래프</button>'}${app.net ? onlineEndButtons() : `<button class="btn y" data-ui='{"k":"newgame"}'>한 판 더!</button><button class="btn w" data-ui='{"k":"title"}'>처음으로</button>`}</div></div>`);
}
// 원작 '총자산 랭킹'처럼: 어른 단계가 끝날 때마다 모두의 인생 총점을 선 그래프로 (범례 · 끝 이름표 · 마우스·키보드로 단계 값 · 표로 보기)
const niceStep = x => { const e = 10 ** Math.floor(Math.log10(x || 1)), f = x / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e; };
const tickTxt = v => v === 0 ? '0' : Math.abs(v) >= 10000 ? `${+(v / 10000).toFixed(1)}억` : `${v.toLocaleString()}만`;
const graphLabel = (L, i) => i === L.length - 1 ? '골인' : `${C.STAGES[L[i].st].short} 끝`;
function assetChart(S) {
  const L = S.assetLog || [], ps = S.players;
  if (L.length < 2) return '<p class="muted" style="text-align:center">단계가 두 번 이상 끝나야 그래프를 그릴 수 있어요</p>';
  const W = 1000, H = 300, l = 70, r = 120, t = 16, b = 34, pw = W - l - r, ph = H - t - b;
  const all = L.flatMap(x => x.v), lo = Math.min(0, ...all), step = niceStep((Math.max(1, ...all) - lo) / 4);
  const y0 = Math.floor(lo / step) * step, y1 = Math.ceil(Math.max(1, ...all) / step) * step;
  const X = i => l + i * pw / (L.length - 1), Y = v => t + ph - (v - y0) / (y1 - y0) * ph;
  let g = '';
  for (let v = y0; v <= y1 + 1e-6; v += step) g += `<line x1="${l}" x2="${l + pw}" y1="${Y(v)}" y2="${Y(v)}" stroke="${v === 0 ? '#D8CCB4' : '#EFE5D3'}" stroke-width="1"/><text x="${l - 10}" y="${Y(v) + 5}" text-anchor="end" class="ax">${tickTxt(v)}</text>`;
  L.forEach((x, i) => { g += `<text x="${X(i)}" y="${H - 8}" text-anchor="middle" class="ax">${graphLabel(L, i)}</text>`; });
  g += `<line class="xh" x1="0" x2="0" y1="${t}" y2="${t + ph}" stroke="#8C84A0" stroke-width="1" visibility="hidden"/>`;
  ps.forEach(q => { g += `<polyline points="${L.map((x, i) => `${X(i)},${Y(x.v[q.id])}`).join(' ')}" fill="none" stroke="${PCOL[q.id]}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`; });
  ps.forEach(q => L.forEach((x, i) => { g += `<circle cx="${X(i)}" cy="${Y(x.v[q.id])}" r="5" fill="${PCOL[q.id]}" stroke="#FFFFFF" stroke-width="2"/>`; }));
  const k = L.length - 1, ends = ps.map(q => ({ q, y: Y(L[k].v[q.id]) })).sort((a, c) => a.y - c.y); // 끝 이름표: 겹치면 아래로 비키고 가는 선으로 이어 줌
  ends.forEach((e, i) => { e.ly = i ? Math.max(e.y, ends[i - 1].ly + 18) : e.y; });
  ends.forEach(e => { if (e.ly - e.y > 2) g += `<path d="M ${X(k) + 6} ${e.y} L ${X(k) + 14} ${e.ly}" stroke="#B8AE9C" stroke-width="1" fill="none"/>`; g += `<text x="${X(k) + 16}" y="${e.ly + 5}" class="el">${esc(e.q.name)}</text>`; });
  L.forEach((x, i) => { const w = pw / k; g += `<rect class="hit" data-i="${i}" tabindex="0" x="${X(i) - w / 2}" y="${t}" width="${w}" height="${ph}" fill="transparent"/>`; });
  return `<div class="achart"><div class="alegend">${ps.map(q => `<span><i style="background:${PCOL[q.id]}"></i>${esc(q.name)}</span>`).join('')}</div>
    <svg viewBox="0 0 ${W} ${H}" width="100%">${g}</svg><div class="atip" hidden></div>
    <details class="atable"><summary>📋 표로 보기</summary><table><tr><th></th>${L.map((x, i) => `<th>${graphLabel(L, i)}</th>`).join('')}</tr>${ps.map(q => `<tr><th>${esc(q.name)}</th>${L.map(x => `<td>${money(x.v[q.id])}</td>`).join('')}</tr>`).join('')}</table></details></div>`;
}
function showGraph() {
  ov(`<div class="modal report"><h2>📈 총자산 그래프 <small class="muted" style="font-size:16px">어른 단계가 끝날 때마다 인생 총점</small></h2>${assetChart(app.S)}
    <div style="text-align:center;margin-top:12px"><button class="btn w" data-ui='{"k":"results"}'>순위로 돌아가기</button></div></div>`);
  const box = $('#ov .achart'); if (!box) return;
  const S = app.S, L = S.assetLog, tip = box.querySelector('.atip'), xh = box.querySelector('.xh'), svg = box.querySelector('svg');
  const show = el => { // 그 단계 모두의 값 (값 먼저, 이름은 작게 · 이름은 textContent로)
    const i = +el.dataset.i, x = +el.getAttribute('x') + +el.getAttribute('width') / 2;
    xh.setAttribute('x1', x); xh.setAttribute('x2', x); xh.setAttribute('visibility', 'visible');
    const h = document.createElement('b'); h.textContent = graphLabel(L, i); tip.replaceChildren(h);
    S.players.slice().sort((a, c) => L[i].v[c.id] - L[i].v[a.id]).forEach(q => {
      const row = document.createElement('div'), key = document.createElement('i'), v = document.createElement('strong'), n = document.createElement('span');
      key.style.background = PCOL[q.id]; v.textContent = money(L[i].v[q.id]); n.textContent = q.name; row.append(key, v, n); tip.append(row);
    });
    const br = box.getBoundingClientRect(), sr = svg.getBoundingClientRect(), k = box.offsetWidth / br.width; // 화면이 줄어 있어도 상자 안 좌표로
    tip.hidden = false; tip.style.left = `${Math.max(4, Math.min((sr.left - br.left + x / 1000 * sr.width) * k + 14, box.clientWidth - tip.offsetWidth - 4))}px`;
  };
  const hide = () => { tip.hidden = true; xh.setAttribute('visibility', 'hidden'); };
  box.querySelectorAll('.hit').forEach(el => { el.addEventListener('pointerenter', () => show(el)); el.addEventListener('focus', () => show(el)); el.addEventListener('blur', hide); });
  svg.addEventListener('pointerleave', hide);
}
function reportHtml(pid) {
  const S = app.S, R = S.results, p = P(pid), r = R.rows.find(x => x.pid === pid);
  const face = p.isCom ? A.robotFull(170, 260) : A.fullSvg(p.look, { age: R.growth ? 'high' : 'elder', gender: p.gender, mood: 'g' }, 170, 270);
  const flow = p.hist.map(esc).join(' → ');
  if (R.growth) {
    return `<div class="stat-grid" style="grid-template-columns:240px 1fr"><div class="box" style="text-align:center">${face}<b class="jua" style="font-size:26px;display:block">${esc(p.name)}</b></div>
      <div class="grid" style="gap:10px"><div class="box"><h3>📗 성장 보고서 — ${r.rank}등 · ${r.score}점</h3><p class="jua" style="font-size:26px;color:#FF8C2E">${esc(r.title)}</p>
        <div class="kv"><span>능력치</span><b>${['int', 'str', 'sen'].map(s => `${C.STATS[s]} ${C.GRADES[E.grade(p, s)]}`).join(' · ')}</b></div>
        <div class="kv"><span>경험</span><b>${C.TAGS.filter(t => p.tags[t]).map(t => `${C.TAG_ICON[t]}${t}×${p.tags[t]}`).join(' ') || '-'}</b></div>
        <div class="kv"><span>상장</span><b>${p.awards.map(esc).join(', ') || '-'}</b></div><div class="kv"><span>진로 흐름</span><b>${flow}</b></div></div>
        <div class="box"><h3>💼 나에게 어울리는 직업 카드</h3><div class="jobs" style="grid-template-columns:repeat(3,1fr)">${r.rec.map(id => jobCard(JOBS[id], p, { ok: true, view: true })).join('') || '<span class="muted">경험을 더 쌓으면 추천 직업이 생겨요</span>'}</div></div></div></div>`;
  }
  const a = r.assets;
  const spouse = p.spouse != null ? E.npcOf(S, p.spouse) : null;
  const j = E.jobOf(p);
  return `<div class="stat-grid" style="grid-template-columns:240px 1fr 1fr"><div class="box" style="text-align:center">${face}<b class="jua" style="font-size:26px;display:block">${esc(p.name)}</b><span class="muted">${esc(p.retiredTitle || E.jobTitle(p))}</span>${r.medal ? `<div style="font-size:54px">${r.medal[1]}</div><div class="jua">${r.medal[2]}</div>` : ''}</div>
    <div class="grid" style="gap:10px"><div class="box"><h3>📕 인생 보고서 — ${r.rank}등</h3><p class="jua" style="font-size:28px;color:#FF8C2E">${esc(p.name)}은(는) ${esc(r.title)}</p>
      <p style="font-size:17px;margin-top:6px">${esc(lifeLine(p))}</p></div>
      <div class="box"><h3>👨‍👩‍👧 가족</h3><p style="font-size:17px">${spouse ? `${esc(spouse.name)}님과 결혼해서 ${p.kids.length ? `${p.kids.length}명의 자녀를 키웠습니다!` : '둘이서 행복하게 살았습니다.'}` : '나만의 인생을 자유롭게 살았습니다.'}</p>${p.earn ? `<p style="font-size:15px;margin-top:6px">💰 인생에서 번 월급: 나 ${money(p.earn.me)}${spouse ? ` · ${esc(spouse.name)}님 ${money(p.earn.sp)}` : ''}${p.earn.kids ? ` · 아이들 ${money(p.earn.kids)}` : ''}</p>` : ''}
        ${p.kids.filter(k => k.jobId != null).map(k => `<p style="font-size:15px">· ${esc(k.name)}: ${esc(JOBS[k.jobId].name)}${k.supported ? ' (꿈을 이뤘어요!)' : ''}</p>`).join('')}</div>
      <div class="box"><h3>🧭 진로 흐름</h3><p style="font-size:16px">${flow}</p>${p.awards.length ? `<p class="muted" style="font-size:14px;margin-top:4px">🏆 ${p.awards.map(esc).join(', ')}</p>` : ''}</div></div>
    <div class="grid" style="gap:10px"><div class="box"><h3>💰 인생 총점</h3>
      <div class="kv"><span>돈</span><b>${money(a.cash)}</b></div><div class="kv"><span>집 (현재 집값)</span><b>${money(a.house)}</b></div><div class="kv"><span>차 (산 값의 50%)</span><b>${money(a.car)}</b></div>
      <div class="kv"><span>주식</span><b>${money(a.stock)}</b></div><div class="kv"><span>친구 기념품</span><b>${money(a.souvenir)}</b></div>${(p.treasures || []).length ? `<div class="kv"><span>보물 감정 (${p.treasures.map(k => (C.TREASURES.find(x => x.k === k) || {}).icon || '').join('')})</span><b>${money(a.treasure)}</b></div>` : ''}<div class="kv"><span>빚${p.debt ? ` (${money(p.debt)} + 정산 이자 20%)` : ''}</span><b class="minus">−${money(a.debt)}</b></div>
      <div class="kv"><span>💚 훈장 포상금 (${p.green}점)</span><b>${money(a.medal)}</b></div>
      <div class="kv" style="border-top:2px dashed #EEE;padding-top:6px"><span class="jua" style="font-size:20px">합계</span><b class="jua" style="font-size:24px;color:#5B4BDB">${money(a.total)}</b></div></div>
      ${j ? `<div class="box"><h3>💼 내가 고른 직업 카드</h3><div style="transform:scale(.92);transform-origin:top left">${jobCard(j, p, { ok: true, view: true })}</div></div>` : ''}</div></div>`;
}
function lifeLine(p) {
  const tags = C.TAGS.filter(t => p.tags[t]).sort((a, b) => p.tags[b] - p.tags[a]).slice(0, 2);
  const top = ['int', 'str', 'sen'].sort((a, b) => p.stats[b] - p.stats[a])[0];
  const j = p.retiredTitle || E.jobTitle(p);
  return `${tags.length ? tags.join('·') + ' 경험을 쌓아 ' : ''}${j ? j.split(' · ')[0] + '(으)로 일한 ' : ''}인생이었습니다. ${['운이 따르지 않아도 꿋꿋했으며', '때로는 흔들렸지만', '평범하지만 소중했으며', '운이 따랐으며', '엄청난 행운이 함께했으며'][p.luck]} ${{ int: '지력', str: '체력', sen: '센스' }[top]}이(가) 넘쳤습니다.`;
}
function showReport(pid) {
  app.peek = true;
  ov(`<div class="modal" style="width:1180px"><div class="tabs">${app.S.players.map(q => `<button class="btn sm ${q.id === pid ? 'p' : 'w'}" data-ui='${J({ k: 'report', pid: q.id })}'>${esc(q.name)}</button>`).join('')}</div>
    ${reportHtml(pid)}<div style="text-align:center;margin-top:12px;display:flex;gap:10px;justify-content:center"><button class="btn p" data-ui='${J({ k: 'print', pid })}'>📄 PDF로 저장</button><button class="btn w" data-ui='{"k":"results"}'>순위로 돌아가기</button></div></div>`);
}
function printReport(pid) {
  const old = document.getElementById('printable'); if (old) old.remove();
  const d = document.createElement('div'); d.id = 'printable';
  d.innerHTML = `<div style="padding:20px;font-family:'Gowun Dodum'"><h1 class="jua" style="color:#5B4BDB">기술인생게임 ${app.S.results.growth ? '성장' : '인생'} 보고서</h1><p class="muted">${new Date().toLocaleDateString('ko-KR')}</p>${reportHtml(pid)}</div>`;
  document.body.appendChild(d);
  const name = `인생보고서_${P(pid).name}_${new Date().toISOString().slice(0, 10)}`;
  const t = document.title; document.title = name;
  setTimeout(() => { print(); document.title = t; d.remove(); }, 100);
}

/* ═════════════ 온라인 게임 (수업 모드·자유 모드) ═════════════ */
// 서버에는 "처음 설정 + 행동 목록"만 있다. 기기마다 같은 엔진으로 다시 계산하므로 모두 같은 화면이 된다.
// 행동은 n번째 자리에 "먼저 쓴 사람이 이김"으로 기록 → 순서가 하나로 정해짐.
async function playOnline(o) {
  leaveOnline();
  const tok = app.playTok = (app.playTok || 0) + 1; // 겹쳐 불려도 마지막 것만
  const { N } = o;
  const meta = (await N.get(N.R(`acts/${o.gid}/meta`))).val();
  if (app.playTok !== tok) return;
  if (!meta) { toast('⚠️ 게임 정보를 찾지 못했어요'); o.onRoom && o.onRoom(null); return; }
  if (meta.ver !== N.VER) return needUpdate();
  SND.setPolicy((meta.opts.settings || {}).sound || 'all');
  try { sessionStorage.removeItem('tlg_upd'); } catch {}
  const S = E.newGame(meta.opts);
  const set = meta.opts.settings || {};
  const net = { ...o, o, meta, me: -1, applied: 0, buf: {}, q: [], timers: [], unsubs: [], waiters: [], online: {}, paused: false, room: null,
    timer: set.timer ?? 30, quizTime: set.quizTime ?? 15, wrote: false, sig: '' };
  const list = (await N.get(N.R(`acts/${o.gid}/a`))).val() || [];
  if (app.playTok !== tok) return;
  for (let n = 0; list[n] != null; n++) { try { E.act(S, list[n]); } catch (e) { console.error(e); } net.applied = n + 1; }
  app.net = net; app.S = S; app.seen = list.length ? S.seq : 0; app.busy = false; app.boardSig = ''; app.peek = false; // 막 시작한 게임이면 오프닝부터
  net.me = S.players.findIndex(p => p.sid === o.sid);
  buildGameScreen(); camTo(P(S.cur).pos, true);
  const W = (path, f) => net.unsubs.push(N.onValue(N.R(path), s => { if (app.net === net) f(s.val()); }));
  net.unsubs.push(N.onChildAdded(N.R(`acts/${o.gid}/a`), s => { if (app.net !== net) return; const n = +s.key; if (n >= net.applied) { net.buf[n] = s.val(); flush(); } }));
  W('online', v => { net.online = v || {}; renderHUD(); if (!app.busy) renderPending(); });
  W(`rooms/${o.rid}`, v => onRoomData(v));
  if (o.cid) {
    W(`classes/${o.cid}/paused`, v => setPaused(!!v));
    W(`classes/${o.cid}/notice`, v => { if (v && v.t && v.t !== net.noticeT && N.now() - v.t < 60000) { net.noticeT = v.t; toast('📢 ' + v.text); banner('📢 선생님 알림', v.text, 3200); } });
    W(`classes/${o.cid}/members/${o.sid}/room`, v => { if (v !== o.rid) { const f = o.onRoom; leaveOnline(); f && f(v); } });
  }
  net.unsubs.push(N.onConn(c => { const el = $('#conn'); if (el) el.classList.toggle('on', !c); if (c) { net.sig = ''; pump(); } }));
  sync();
}
function leaveOnline() {
  const net = app.net; if (!net) return;
  SND.pause(false);
  net.unsubs.forEach(f => { try { f(); } catch {} });
  clearCom(); stopTimer();
  net.waiters.forEach(w => w.res());
  app.net = null;
}
function needUpdate() { // 기기마다 규칙 버전이 다르면 결과가 달라짐 → 새로고침해서 새 버전 받기
  let tried = false; try { tried = sessionStorage.getItem('tlg_upd') === '1'; sessionStorage.setItem('tlg_upd', '1'); } catch {}
  if (!tried) { toast('🔄 새 버전으로 바꾸는 중…'); setTimeout(() => location.reload(), 1200); }
  else toast('⚠️ 게임 버전이 달라요. 창을 닫았다가 다시 열어 주세요');
}
// 서버에서 온 행동을 순서대로 적용
function flush() {
  const net = app.net; let moved = false;
  while (net.buf[net.applied] != null) {
    const a = net.buf[net.applied]; delete net.buf[net.applied];
    try { E.act(app.S, a); } catch (e) { console.error(e); }
    net.applied++; moved = true;
  }
  if (!moved) return;
  net.me = app.S.players.findIndex(p => p.sid === net.sid);
  net.waiters = net.waiters.filter(w => { if (net.applied >= w.n) { w.res(); return false; } return true; });
  sync();
}
function waitApplied(net, n) { return new Promise(res => { if (net.applied >= n) return res(); net.waiters.push({ n, res }); setTimeout(res, 8000); }); }
function netSend(a) { const net = app.net; if (!net || !a || net.paused) return; net.q.push(a); pump(); }
async function pump() {
  const net = app.net; if (!net || net.pumping) return;
  net.pumping = true;
  try {
    while (app.net === net && net.q.length) {
      if (net.paused) { net.q = []; break; }
      const a = net.q[0];
      if (!stillValid(a)) { net.q.shift(); continue; }
      const n = net.applied;
      const ok = await net.N.putAct(net.gid, n, a);
      if (ok) net.q.shift();
      await waitApplied(net, n + 1); // 내 것이든 남의 것이든 n번이 도착하면 다음으로
    }
  } finally { net.pumping = false; if (app.net === net && !net.q.length) stage.classList.remove('sending'); }
}
function stillValid(a) {
  if (a.sys) return true;
  const pd = app.S.pending;
  if (!pd || pd.n !== a.n) return false;
  if (pd.type === 'quiz') return pd.pids.includes(a.pid) && !pd.answers[a.pid];
  return pd.pid == null || pd.pid === a.pid;
}
const seatOn = p => !!app.net && !p.isCom && !!p.sid && app.net.N.isIn(app.net.online, p.sid, app.net.rid);
const myInput = pd => !!pd && !!app.net && (pd.type === 'quiz' ? pd.pids.includes(app.net.me) && !pd.answers[app.net.me] : pd.pid === app.net.me);
// 진행 담당: 접속 중인 사람 중 맨 앞자리 → COM·자리 비운 친구의 차례를 대신 진행
function isDriver() {
  const net = app.net; if (!net || net.me < 0 || !net.N.connected) return false;
  return app.S.players.findIndex(p => seatOn(p)) === net.me;
}
function drive() {
  const net = app.net, S = app.S, pd = S.pending;
  const sig = pd ? [pd.n, isDriver(), net.paused, S.players.map(p => (seatOn(p) ? 1 : 0)).join(''), pd.type === 'quiz' ? Object.keys(pd.answers).length : ''].join('|') : 'x';
  if (sig === net.sig) return; // 같은 상황이면 이미 예약됨
  clearCom(); net.sig = sig;
  if (!pd || S.over || net.paused || !isDriver()) return;
  const later = (ms, make, quick) => net.timers.push(setTimeout(() => { if (app.net === net && app.S.pending && app.S.pending.n === pd.n) netSend(make()); }, FAST && quick ? Math.min(ms, 60) : ms));
  if (pd.type === 'quiz') { // 자리 비운 사람은 못 맞힌 것으로
    pd.pids.forEach(id => { const q = P(id); if (q.isCom || pd.answers[id] || id === net.me) return; later(seatOn(q) ? (net.quizTime + 20) * 1000 : 5000, () => ({ pid: id, c: -1, ms: 99999, n: pd.n }), !seatOn(q)); });
    return;
  }
  if (pd.pid == null || pd.pid === net.me) return;
  const p = P(pd.pid);
  const ms = p.isCom ? ({ preSpin: 700, fate: 900, wheel: 900, ack: 2400, event: 1900 }[pd.type] ?? 1100)
    : !seatOn(p) ? 8000 : ((net.timer || 60) + 20) * 1000; // 접속은 돼 있는데 멈춘 기기 대비
  later(ms, () => { const a = E.aiAction(app.S); return a && { ...a, pid: pd.pid, n: pd.n }; }, p.isCom || !seatOn(p));
}
// 내 차례 제한시간 → 다 되면 무난한 선택으로 자동 진행
function myTimer(pd) {
  const net = app.net;
  if (!net || !pd || net.paused || !myInput(pd)) return stopTimer();
  const sec = pd.type === 'quiz' ? net.quizTime : net.timer;
  if (!sec) return stopTimer();
  if (app.tm && app.tm.n === pd.n) return; // 같은 화면이면 이어서
  stopTimer();
  const end = Date.now() + sec * 1000;
  const tick = () => {
    const left = Math.ceil((end - Date.now()) / 1000);
    if (left <= 5 && left > 0 && app.tmBeep !== left) { app.tmBeep = left; SND.sfx('timer'); }
    const el = $('#timer'); if (el) { el.textContent = `⏱ ${Math.max(0, left)}`; el.className = left <= 5 ? 'on hurry' : 'on'; }
    if (left > 0) return;
    stopTimer();
    const cur = app.S.pending; if (!cur || cur.n !== pd.n || !myInput(cur)) return;
    if (cur.type === 'quiz') send({ pid: net.me, c: -1, ms: sec * 1000 });
    else { const a = E.aiAction(app.S); if (a) { toast('⏱ 시간이 다 돼서 자동으로 골랐어요'); app.peek = false; send(a); } }
  };
  app.tm = { n: pd.n, iv: setInterval(tick, 250) };
  tick();
}
function stopTimer() { if (app.tm) { clearInterval(app.tm.iv); app.tm = null; } const el = $('#timer'); if (el) el.className = ''; }
function setPaused(v) {
  const net = app.net; if (net.paused === v) return;
  net.paused = v;
  const el = $('#pause'); if (el) el.classList.toggle('on', v);
  SND.pause(v);
  if (v) { clearCom(); stopTimer(); net.q = []; } else { net.sig = ''; if (!app.busy) renderPending(); }
}
function onRoomData(v) {
  const net = app.net;
  if (!v) { if (!net.cid) { const f = net.onRoom; leaveOnline(); f && f(null); } return; }
  net.room = v;
  if (v.gid && v.gid !== net.gid) { const o = { ...net.o, gid: v.gid }; leaveOnline(); playOnline(o); return; } // 한 판 더 → 새 게임
  if (app.S.over) { maybeRematch(); if (!app.busy && !app.peek) renderPending(); }
}
// 결과 화면 버튼: 성찰 쓰기 · 같은 방에서 한 판 더 · 대기실로/나가기
function onlineEndButtons() {
  const net = app.net, S = app.S;
  const again = (net.room && net.room.again) || {};
  const humans = S.players.filter(p => seatOn(p));
  const votes = humans.filter(p => again[p.sid]).length;
  return `${net.cid && net.me >= 0 ? `<button class="btn p" data-ui='{"k":"reflect"}'>✏️ 진로 성찰${net.reflected ? ' ✅' : ' 쓰기'}</button>` : ''}
    <button class="btn y" data-ui='{"k":"again"}' ${again[net.sid] ? 'disabled' : ''}>🔁 같은 방에서 한 판 더 (${votes}/${humans.length})</button>
    <button class="btn w" data-ui='{"k":"toLobby"}'>${net.cid ? '🏠 대기실로' : '🚪 나가기'}</button>`;
}
async function maybeRematch() {
  const net = app.net, S = app.S, room = net.room;
  if (!room || !S.over || net.rematching || !isDriver()) return;
  const again = room.again || {};
  const humans = S.players.filter(p => seatOn(p));
  if (!humans.length || !humans.every(p => again[p.sid])) return;
  net.rematching = true;
  const N = net.N;
  try {
    let k = 0;
    const players = S.players.map(p => seatOn(p) ? { name: p.name, gender: p.gender, look: p.look, sid: p.sid } : { name: `COM${++k}`, gender: p.gender, look: p.look, isCom: true });
    const gid = await N.createGame({ mode: S.mode, seed: (Math.random() * 2 ** 31) | 0, settings: net.meta.opts.settings || {}, players },
      { cid: net.cid || null, rid: net.rid, round: (net.meta.round || 1) + 1, room: net.meta.room || null });
    const r = await N.runTransaction(N.R(`rooms/${net.rid}/gid`), cur => (cur === net.gid ? gid : undefined), { applyLocally: false });
    if (r.committed) await N.update(N.R(`rooms/${net.rid}`), { again: null });
  } catch (e) { console.error(e); }
  net.rematching = false;
}
function toLobby() {
  const net = app.net; if (!net) return showTitle();
  const N = net.N, f = net.onRoom;
  if (net.cid) { N.update(N.R(`classes/${net.cid}/members/${net.sid}`), { room: null }).catch(() => {}); return; } // 방 값이 바뀌면 대기실로
  leaveOnline();
  N.set(N.R(`rooms/${net.rid}/seats/${net.sid}`), null).catch(() => {}).then(() => f && f(null));
}
// 수업 모드: 게임이 끝나면 내 기록을 교사 화면 결과 탭으로
function uploadResult() {
  const net = app.net, S = app.S;
  if (!net.cid || net.wrote || !S.over || net.me < 0) return;
  net.wrote = true;
  const rec = { ...E.resultRecord(S, net.me), room: net.meta.room || null, round: net.meta.round || 1, t: net.N.serverTimestamp() };
  net.N.update(net.N.R(`results/${net.cid}/${net.gid}/${net.sid}`), net.N.clean(rec)).catch(() => { net.wrote = false; });
}
const REFLECT = ['이번 인생에서 가장 중요했던 선택은 무엇이었나요? 왜 그렇게 골랐나요?', '실제 나라면 어떤 경험을 쌓고 싶나요? 관심이 생긴 직업은?'];
function showReflect() {
  const net = app.net; if (!net) return;
  const qs = (net.meta.opts.settings && net.meta.opts.settings.reflect) || REFLECT;
  ov(`<div class="modal" style="width:960px"><h2>✏️ 진로 성찰</h2>${qs.map((q, i) => `<label class="rq"><b>${i + 1}. ${esc(q)}</b><textarea id="rf${i}" maxlength="400" placeholder="자유롭게 써요">${esc((net.refl || [])[i] || '')}</textarea></label>`).join('')}
    <div style="text-align:center;margin-top:12px;display:flex;gap:10px;justify-content:center"><button class="btn y" data-ui='{"k":"reflectSave"}'>저장하기</button><button class="btn w" data-ui='{"k":"closeOv"}'>닫기</button></div></div>`);
  setTimeout(() => { app.peek = true; $('#rf0') && $('#rf0').focus(); });
}
async function saveReflect() {
  const net = app.net; if (!net) return;
  const qs = (net.meta.opts.settings && net.meta.opts.settings.reflect) || REFLECT;
  const ans = qs.map((_, i) => ($('#rf' + i)?.value || '').trim().slice(0, 400));
  try {
    await net.N.update(net.N.R(`results/${net.cid}/${net.gid}/${net.sid}`), { reflect: ans, nick: P(net.me).name });
    net.refl = ans; net.reflected = true; toast('✅ 성찰을 저장했어요');
    closeOv(); renderPending();
  } catch { toast('⚠️ 저장하지 못했어요. 다시 눌러 주세요'); }
}

/* ═════════════ 시작 ═════════════ */
const lobby = Lobby.install({ app, UI, stage, ov, closeOv, esc, J, toast, openEditor, playOnline, leaveOnline, showTitle, A, E, C, snd: SND });
showTitle();
{ // 수업 QR(?c=코드)로 들어왔거나, 하던 온라인 게임이 있으면 바로 그 자리로
  const qc = new URLSearchParams(location.search).get('c');
  lobby.autoResume().then(ok => { if (!ok && qc) UI.joinClass(); });
}
window.__app = app; window.__ui = { renderPending, sync }; // 개발 확인용
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
