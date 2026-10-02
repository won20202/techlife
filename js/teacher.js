// 교사 화면: ① 준비(학교·게임·퀴즈 설정, 수업 열기) ② 진행(명단·방 배정·모두 시작·일시정지·마무리) ③ 결과(순위·기록·엑셀)
// teacher.html?tv=수업번호 → 교실 TV 화면 (입장 QR → 실시간 순위·사건 소식 → 상 발표)
import * as N from './net.js';
import * as E from './engine.js';
import * as A from './art.js';
import { QUIZ, UNITS } from './data/quiz.js';
import qrcode from './vendor/qrcode.js';
import * as SND from './sound.js';
const { C, JOBS } = E;

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const app = $('#app');
const TVID = new URLSearchParams(location.search).get('tv');
const BASE = location.href.replace(/teacher\.html.*$/, '').replace(/[?#].*$/, '');
const REFLECT = ['이번 인생에서 가장 중요했던 선택은 무엇이었나요? 왜 그렇게 골랐나요?', '실제 나라면 어떤 경험을 쌓고 싶나요? 관심이 생긴 직업은?'];
const DEF_GAME = { timer: 30, comFill: true, quiz: true, units: [], quizTime: 15, onlyMine: false, reflect: REFLECT, sound: 'all' };
const MODE_KEYS = ['growth', 'careerShort', 'career', 'life', 'extreme'];
const T = { tab: 'prep', cid: null, classes: {}, cfg: {}, online: {}, rooms: {}, games: {}, draft: null, sel: null, res: null, resCid: null, resRound: null, feed: [] };
const NEW_LOOK = { skin: 0, hair: 0, hairColor: 0, outfit: 3, item: 'none' };
const gameLook = l => { const x = { ...NEW_LOOK, ...(l || {}) }; return { ...x, item: x.item === 'none' ? null : x.item }; };
const face = (look, gender, size = 40) => A.faceSvg(gameLook(look), gender || 'm', 'adult', size);
const isOn = sid => N.isOn(T.online, sid);
const game = () => ({ ...DEF_GAME, ...(T.cfg.game || {}) });
const rand = () => (Math.random() * 2 ** 31) | 0;

/* ───── 공용: 알림·확인 창·글 입력 창 ───── */
function toast(t) { const b = $('#toast'); const d = document.createElement('div'); d.textContent = t; b.appendChild(d); setTimeout(() => d.remove(), 3500); }
function modal(html) { $('#modal').innerHTML = `<div class="dim" data-k="mclose"></div><div class="mbox">${html}</div>`; $('#modal').classList.add('on'); }
function mclose() { $('#modal').classList.remove('on'); $('#modal').innerHTML = ''; }
function ask(msg, ok = '확인', danger = true) {
  return new Promise(res => {
    modal(`<p class="ask">${esc(msg)}</p><div class="btns"><button class="${danger ? 'danger' : 'primary'}" id="m-ok">${esc(ok)}</button><button id="m-no">취소</button></div>`);
    $('#m-ok').onclick = () => { mclose(); res(true); };
    $('#m-no').onclick = () => { mclose(); res(false); };
  });
}
function askText(msg, value = '') {
  return new Promise(res => {
    modal(`<p class="ask">${esc(msg)}</p><input id="m-in" value="${esc(value)}" maxlength="40"><div class="btns"><button class="primary" id="m-ok">저장</button><button id="m-no">취소</button></div>`);
    const go = v => { mclose(); res(v); };
    $('#m-ok').onclick = () => go($('#m-in').value.trim());
    $('#m-no').onclick = () => go(null);
    $('#m-in').onkeydown = e => { if (e.key === 'Enter') go($('#m-in').value.trim()); };
    $('#m-in').focus();
  });
}
function qrSvg(text, cell = 5) { const q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: cell, margin: 2, scalable: true }); }

/* ───── 클릭 처리 ───── */
const H = {};
document.addEventListener('click', e => {
  const t = e.target.closest('[data-k]');
  if (!t || t.disabled) return;
  const f = H[t.dataset.k];
  if (f) Promise.resolve(f(t.dataset, t, e)).catch(err => { console.error(err); toast('⚠️ ' + (/PERMISSION/.test(err.message) ? '권한이 없어요. 새로고침 후 다시 로그인해 주세요' : err.message)); });
});
H.mclose = () => mclose();

/* ═════════════ 시작 ═════════════ */
(async () => {
  try { await N.login(); }
  catch (e) { app.innerHTML = '<div class="login card"><h1>📡 연결 실패</h1><p>인터넷 연결(학교 사이트 차단)을 확인해 주세요. gstatic.com · firebasedatabase.app 주소가 열려 있어야 해요.</p></div>'; return; }
  if (TVID) return tv(TVID);
  if (await isTeacher()) start(); else login();
})();
async function isTeacher() { try { await N.get(N.R('results/__check')); return true; } catch { return false; } }

async function login(msg = '') {
  const hasPw = (await N.get(N.R('config/hasPw'))).val();
  app.innerHTML = `<div class="login card"><h1>👩‍🏫 선생님 화면</h1>
    ${hasPw ? `<p>교사 비밀번호를 넣어 주세요</p><input type="password" id="pw" autocomplete="current-password"><button class="primary big" data-k="login">들어가기</button>`
      : `<p>처음 쓰시네요! <b>교사 비밀번호</b>를 만들어 주세요.<br><span class="muted">4글자 이상 · 학생에게 알려 주지 마세요 · 비밀번호는 서버에서도 아무도 읽을 수 없게 저장돼요</span></p>
         <input type="password" id="pw" placeholder="새 비밀번호" autocomplete="new-password"><input type="password" id="pw2" placeholder="한 번 더" autocomplete="new-password"><button class="primary big" data-k="setup">비밀번호 만들기</button>`}
    <div class="err">${esc(msg)}</div><a href="./">← 게임으로</a></div>`;
  $('#pw').focus();
  $('#pw').onkeydown = e => { if (e.key === 'Enter') H[hasPw ? 'login' : 'setup'](); };
}
H.login = async () => {
  const pw = $('#pw').value;
  if (await N.teacherLogin(pw)) start(); else login('비밀번호가 달라요');
};
H.setup = async () => {
  const pw = $('#pw').value, pw2 = $('#pw2').value;
  if (pw.length < 4) return login('4글자 이상으로 만들어 주세요');
  if (pw !== pw2) return login('두 비밀번호가 달라요');
  try { await N.teacherSetup(pw); start(); }
  catch { login('이미 비밀번호가 있어요. 그 비밀번호로 들어와 주세요'); }
};

/* ═════════════ 교사 화면 ═════════════ */
function start() {
  app.innerHTML = `<header><div class="brand">👩‍🏫 기술인생게임 <span>선생님 화면</span></div>
    <nav>${[['prep', '① 준비'], ['live', '② 진행'], ['res', '③ 결과']].map(([k, n]) => `<button data-k="tab" data-t="${k}" id="tab-${k}">${n}</button>`).join('')}</nav>
    <div class="cur" id="cur"></div></header><main id="body"></main>`;
  N.onValue(N.R('config'), s => { T.cfg = s.val() || {}; if (T.tab === 'prep') { if (!T.prepDrawn) render(); else drawQuiz(); } });
  N.onValue(N.R('classes'), s => { T.classes = s.val() || {}; if (T.cid && !T.classes[T.cid]) selectClass(null); else soon(); });
  N.onValue(N.R('online'), s => { T.online = s.val() || {}; soon(); });
  const open = () => Object.entries(T.classes).filter(([, c]) => !c.closed).sort((a, b) => (b[1].created || 0) - (a[1].created || 0));
  setTimeout(() => { const o = open(); if (o.length && !T.cid) { selectClass(o[0][0]); T.tab = 'live'; render(); } }, 900);
  render();
}
H.tab = d => { T.tab = d.t; T.prepDrawn = false; if (d.t === 'res' && !T.resCid) T.resCid = T.cid; if (d.t === 'res') loadResults(T.resCid); render(); };
let soonT = null;
function soon() {
  if (TVID) { window.__tvSoon && window.__tvSoon(); return; }
  clearTimeout(soonT); soonT = setTimeout(() => { if (T.tab !== 'prep') render(); else renderCur(); }, 250);
}
function render() {
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.t === T.tab));
  renderCur();
  const body = $('#body'); if (!body) return;
  if (T.tab === 'prep') { body.innerHTML = prepHtml(); T.prepDrawn = true; prepAfter(); }
  else if (T.tab === 'live') liveRender(body);
  else body.innerHTML = resHtml();
}
function renderCur() {
  const el = $('#cur'); if (!el) return;
  const open = Object.entries(T.classes).filter(([, c]) => !c.closed).sort((a, b) => (b[1].created || 0) - (a[1].created || 0));
  el.innerHTML = open.length ? `<select onchange="window.__selClass(this.value)">${open.map(([cid, c]) => `<option value="${cid}" ${cid === T.cid ? 'selected' : ''}>${esc(c.title)} · 코드 ${esc(c.code)}</option>`).join('')}</select>` : '<span class="muted">열린 수업 없음</span>';
}
window.__selClass = cid => { selectClass(cid); render(); };

/* ═════════════ ① 준비 ═════════════ */
function prepHtml() {
  const sc = T.cfg.school || {}, f = sc.fmt || { g: 1, c: 2, n: 2 }, g = game();
  const opt = (arr, v) => arr.map(x => `<option value="${x}" ${String(x) === String(v) ? 'selected' : ''}>${x}</option>`).join('');
  return `<section class="card"><h3>🚪 수업 열기</h3>
      <div class="row">학년 <select id="oc-g"><option value="">-</option>${opt([1, 2, 3], '')}</select> 반 <select id="oc-c"><option value="">-</option>${opt(Array.from({ length: 20 }, (_, i) => i + 1), '')}</select>
        <span class="muted">또는 이름</span> <input id="oc-title" placeholder="예: 로봇 동아리 (학년·반 대신)"></div>
      <div class="lab">모드</div><div class="modes">${MODE_KEYS.map(k => `<label class="mode"><input type="radio" name="oc-mode" value="${k}" ${k === (g.mode || 'careerShort') ? 'checked' : ''}><b>${C.MODES[k].name}</b><small>${C.MODES[k].desc}</small></label>`).join('')}</div>
      <div class="lab">방 배정 방법</div><div class="row">
        <label class="rb"><input type="radio" name="oc-as" value="group" checked> 👥 모둠별 <small>학생이 모둠 번호를 골라요 → 같은 모둠끼리</small></label>
        <label class="rb"><input type="radio" name="oc-as" value="auto"> 🎲 자동 <small>4명씩 섞어서</small></label>
        <label class="rb"><input type="radio" name="oc-as" value="manual"> ✋ 직접 <small>선생님이 한 명씩</small></label>
        모둠 수 <select id="oc-groups">${opt([4, 5, 6, 7, 8, 9, 10], 8)}</select></div>
      <button class="primary big" data-k="openClass">수업 열기 → 입장 코드·QR 만들기</button></section>
    <section class="card"><h3>⚙️ 게임 설정 <small class="muted">새로 시작하는 방부터 적용</small></h3>
      <div class="row">선택 제한시간 <select id="gs-timer">${[[0, '끄기'], [20, '20초'], [30, '30초'], [45, '45초'], [60, '60초']].map(([v, n]) => `<option value="${v}" ${+g.timer === v ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <label class="rb"><input type="checkbox" id="gs-com" ${g.comFill ? 'checked' : ''}> 빈자리 COM 채우기 (4명 방)</label></div>
      <div class="row">학생 기기 소리 ${[['all', '🔊 효과음 + 배경음'], ['sfx', '🔔 효과음만'], ['off', '🔇 끄기']].map(([v, n]) => `<label class="rb"><input type="radio" name="gs-snd" value="${v}" ${(g.sound || 'all') === v ? 'checked' : ''}> ${n}</label>`).join('')}
        <span class="muted">교실이 시끄러우면 '효과음만' + TV 화면 배경음악을 추천해요 (학생도 각자 끌 수 있어요)</span></div>
      <div class="row"><label class="rb"><input type="checkbox" id="gs-quiz" ${g.quiz ? 'checked' : ''}> ❓ 퀴즈 칸 · 🎤 같은 칸 퀴즈쇼 켜기</label>
        퀴즈 제한시간 <select id="gs-qt">${opt([10, 15, 20, 30], g.quizTime)}</select>초
        <label class="rb"><input type="radio" name="gs-pool" value="all" ${g.onlyMine ? '' : 'checked'}> 기본 문제 + 직접 넣은 문제</label><label class="rb"><input type="radio" name="gs-pool" value="mine" ${g.onlyMine ? 'checked' : ''}> 직접 넣은 문제만</label></div>
      <div class="row">퀴즈 단원 <span class="muted">(안 고르면 전체)</span> ${UNITS.map(u => `<label class="rb"><input type="checkbox" class="gs-unit" value="${u}" ${(g.units || []).includes(u) ? 'checked' : ''}> ${u}</label>`).join('')}</div>
      <div class="lab">진로 성찰 질문 (게임이 끝나면 학생이 써요)</div>
      <input id="gs-r1" class="wide" value="${esc((g.reflect || REFLECT)[0])}"><input id="gs-r2" class="wide" value="${esc((g.reflect || REFLECT)[1])}">
      <button class="primary" data-k="saveGame">게임 설정 저장</button></section>
    <section class="card"><h3>🏫 학교 설정 <small class="muted">처음 한 번 · 다른 학교에서도 그 학교 학번으로 · 선생님 시험용 학번 <b>${N.TEST_SID}</b>은 형식·반과 상관없이 들어가요</small></h3>
      <div class="row">학교 이름 <input id="sc-name" value="${esc(sc.name || '')}" placeholder="예: 오션중학교"></div>
      <div class="row"><label class="rb"><input type="radio" name="sc-fmt" value="digits" ${f.free ? '' : 'checked'}> 학년·반·번호</label>
        학년 <select id="sc-g">${opt([1], f.g || 1)}</select>자리 · 반 <select id="sc-c">${opt([1, 2], f.c || 2)}</select>자리 · 번호 <select id="sc-n">${opt([2, 3], f.n || 2)}</select>자리
        <span class="muted" id="sc-ex"></span>
        <label class="rb"><input type="radio" name="sc-fmt" value="free" ${f.free ? 'checked' : ''}> 번호만 (형식 상관없이)</label></div>
      <button class="primary" data-k="saveSchool">학교 설정 저장</button></section>
    <section class="card" id="quizSec"><h3>❓ 퀴즈 문제 <small class="muted" id="qcount"></small></h3>
      <p class="muted">퀴즈 칸 · 같은 칸 퀴즈쇼에 나와요 (보기 4개 중 고르기). 기본 문제도 고치고 지울 수 있어요 — 고친 내용은 새로 시작하는 방부터 나와요.</p>
      <div class="row">${['', ...UNITS].map(u => `<button class="mini ${(T.qUnit || '') === u ? 'primary' : ''}" data-k="qUnit" data-u="${u}">${u || '전체'}</button>`).join('')}</div>
      <div class="qlist" id="qlist"></div>
      <div class="row" id="qrestore"></div>
      <div class="qform" id="qform"><div class="lab" id="q-head">✏️ 새 문제 쓰기</div>
        <div class="row">단원 <select id="q-u">${UNITS.map(u => `<option>${u}</option>`).join('')}</select><input id="q-q" class="wide" placeholder="문제"></div>
        <div class="row">${[0, 1, 2, 3].map(i => `<label class="rb"><input type="radio" name="q-a" value="${i}" ${i ? '' : 'checked'}> <input id="q-o${i}" placeholder="보기 ${i + 1}${i ? '' : ' (정답 보기 왼쪽 동그라미 선택)'}"></label>`).join('')}</div>
        <div class="row"><input id="q-x" class="wide" placeholder="한 줄 해설 (선택 — 퀴즈가 끝나면 보여 줘요)"><input type="hidden" id="q-id"><input type="hidden" id="q-kind" value="mine">
          <button class="primary" data-k="qSave">저장</button><button data-k="qClear">새 문제 쓰기</button></div></div></section>
    <section class="card"><h3>🔑 교사 비밀번호 바꾸기</h3><div class="row"><input type="password" id="np1" placeholder="새 비밀번호"><input type="password" id="np2" placeholder="한 번 더"><button data-k="newPw">바꾸기</button></div></section>`;
}
function prepAfter() {
  const ex = () => { const g = +$('#sc-g').value, c = +$('#sc-c').value, n = +$('#sc-n').value; $('#sc-ex').textContent = `예: ${'2'.padStart(g, '0')}${'3'.padStart(c, '0')}${'12'.padStart(n, '0')} = 2학년 3반 12번`; };
  ['#sc-g', '#sc-c', '#sc-n'].forEach(s => { $(s).onchange = ex; }); ex();
  drawQuiz();
}
H.saveSchool = async () => {
  const free = document.querySelector('input[name=sc-fmt]:checked').value === 'free';
  await N.set(N.R('config/school'), { name: $('#sc-name').value.trim(), fmt: free ? { free: true } : { g: +$('#sc-g').value, c: +$('#sc-c').value, n: +$('#sc-n').value } });
  toast('✅ 학교 설정을 저장했어요');
};
H.saveGame = async () => {
  const g = { ...game(), timer: +$('#gs-timer').value, comFill: $('#gs-com').checked, quiz: $('#gs-quiz').checked, quizTime: +$('#gs-qt').value,
    onlyMine: document.querySelector('input[name=gs-pool]:checked').value === 'mine',
    units: [...document.querySelectorAll('.gs-unit:checked')].map(x => x.value),
    reflect: [$('#gs-r1').value.trim() || REFLECT[0], $('#gs-r2').value.trim() || REFLECT[1]],
    sound: document.querySelector('input[name=gs-snd]:checked').value };
  await N.set(N.R('config/game'), g);
  toast('✅ 게임 설정을 저장했어요 (새로 시작하는 방부터)');
};
/* ── 퀴즈 문제: 기본 문제 고치기·지우기(config/quizBase) + 직접 넣기(config/quiz) ── */
function quizRows() {
  const fix = T.cfg.quizBase || {}, rows = [];
  QUIZ.forEach(q0 => { const f = fix[q0.id]; if (f && f.del) return; rows.push({ kind: 'base', id: q0.id, q: f ? { ...q0, ...f } : q0, edited: !!f }); });
  Object.entries(T.cfg.quiz || {}).forEach(([id, q]) => { if (q && q.q) rows.push({ kind: 'mine', id, q }); });
  return rows;
}
function drawQuiz() {
  const el = $('#qlist'); if (!el) return;
  const rows = quizRows(), del = Object.values(T.cfg.quizBase || {}).filter(v => v && v.del).length;
  const mine = rows.filter(r => r.kind === 'mine').length, edited = rows.filter(r => r.edited).length;
  $('#qcount').textContent = `쓰는 문제 ${rows.length}개 · 기본 ${rows.length - mine}개(고친 것 ${edited}개) · 직접 넣은 것 ${mine}개${del ? ` · 지운 기본 문제 ${del}개` : ''}`;
  el.innerHTML = rows.filter(r => !T.qUnit || r.q.u === T.qUnit).map(r => `<div class="q"><span class="pill">${esc(r.q.u)}</span> <span class="qt ${r.kind}${r.edited ? ' ed' : ''}">${r.kind === 'base' ? (r.edited ? '기본·고침' : '기본') : '직접'}</span> <b>${esc(r.q.q)}</b><br>
    <small>${(r.q.o || []).map((o, i) => (i === +r.q.a ? `<u>✔ ${esc(o)}</u>` : esc(o))).join(' · ')}</small>${r.q.x ? `<br><small class="muted">💡 ${esc(r.q.x)}</small>` : ''}
    <span class="qb"><button data-k="qEdit" data-kind="${r.kind}" data-id="${r.id}">고치기</button>${r.edited ? `<button data-k="qReset" data-id="${r.id}">원래대로</button>` : ''}<button class="danger" data-k="qDel" data-kind="${r.kind}" data-id="${r.id}">지우기</button></span></div>`).join('') || '<p class="muted">이 단원에는 문제가 없어요</p>';
  $('#qrestore').innerHTML = del ? `<button data-k="qRestore">🔄 지운 기본 문제 ${del}개 되살리기</button>` : '';
}
function qClear() {
  ['#q-q', '#q-x', '#q-id', '#q-o0', '#q-o1', '#q-o2', '#q-o3'].forEach(s => { $(s).value = ''; });
  $('#q-kind').value = 'mine'; $('#q-head').textContent = '✏️ 새 문제 쓰기';
  document.querySelectorAll('input[name=q-a]').forEach(r => { r.checked = r.value === '0'; });
}
H.qUnit = d => { T.qUnit = d.u; document.querySelectorAll('[data-k=qUnit]').forEach(b => b.classList.toggle('primary', b.dataset.u === d.u)); drawQuiz(); };
H.qSave = async () => {
  const opts = [0, 1, 2, 3].map(i => $('#q-o' + i).value.trim());
  const ai = +document.querySelector('input[name=q-a]:checked').value;
  const qText = $('#q-q').value.trim();
  if (!qText) return toast('문제를 넣어 주세요');
  if (!opts[ai]) return toast('정답으로 고른 보기를 채워 주세요');
  const o = opts.filter(Boolean);
  if (o.length < 2) return toast('보기를 2개 이상 넣어 주세요');
  const q = { u: $('#q-u').value, q: qText, o, a: opts.slice(0, ai).filter(Boolean).length, x: $('#q-x').value.trim() };
  const id = $('#q-id').value, kind = $('#q-kind').value;
  await N.set(N.R(kind === 'base' && id ? `config/quizBase/${id}` : `config/quiz/${id || N.newId()}`), q);
  toast(kind === 'base' ? '✅ 기본 문제를 고쳤어요' : id ? '✅ 문제를 고쳤어요' : '✅ 새 문제를 넣었어요');
  qClear(); drawQuiz();
};
H.qClear = () => qClear();
H.qEdit = d => {
  const r = quizRows().find(x => x.kind === d.kind && x.id === d.id); if (!r) return;
  const q = r.q;
  $('#q-u').value = q.u; $('#q-q').value = q.q; $('#q-x').value = q.x || ''; $('#q-id').value = d.id; $('#q-kind').value = d.kind;
  [0, 1, 2, 3].forEach(i => { $('#q-o' + i).value = (q.o || [])[i] || ''; });
  document.querySelectorAll('input[name=q-a]').forEach(x => { x.checked = +x.value === +q.a; });
  $('#q-head').textContent = d.kind === 'base' ? '✏️ 기본 문제 고치는 중 (저장하면 이 내용으로 바뀌어요 · "원래대로"로 되돌릴 수 있어요)' : '✏️ 직접 넣은 문제 고치는 중';
  $('#qform').scrollIntoView({ behavior: 'smooth', block: 'center' });
  $('#q-q').focus();
};
H.qDel = async d => {
  if (!(await ask(d.kind === 'base' ? '이 기본 문제를 지울까요? (나중에 되살릴 수 있어요)' : '이 문제를 지울까요?', '지우기'))) return;
  if (d.kind === 'base') await N.set(N.R(`config/quizBase/${d.id}`), { del: true });
  else await N.remove(N.R(`config/quiz/${d.id}`));
  if ($('#q-id').value === d.id) qClear();
  drawQuiz();
};
H.qReset = async d => {
  if (!(await ask('이 기본 문제를 처음 내용으로 되돌릴까요?', '되돌리기', false))) return;
  await N.remove(N.R(`config/quizBase/${d.id}`));
  if ($('#q-id').value === d.id) qClear();
  drawQuiz();
};
H.qRestore = async () => {
  for (const [id, v] of Object.entries(T.cfg.quizBase || {})) if (v && v.del) await N.remove(N.R(`config/quizBase/${id}`));
  drawQuiz(); toast('🔄 지운 기본 문제를 되살렸어요');
};
H.newPw = async () => {
  const a = $('#np1').value, b = $('#np2').value;
  if (a.length < 4 || a !== b) return toast('4글자 이상, 두 칸을 똑같이 넣어 주세요');
  await N.teacherChangePw(a); $('#np1').value = $('#np2').value = ''; toast('✅ 비밀번호를 바꿨어요');
};
H.openClass = async () => {
  const g = +$('#oc-g').value || null, c = +$('#oc-c').value || null;
  const title = $('#oc-title').value.trim() || (g && c ? `${g}학년 ${c}반` : '');
  if (!title) return toast('학년·반을 고르거나 수업 이름을 넣어 주세요');
  const mode = document.querySelector('input[name=oc-mode]:checked').value;
  const assign = document.querySelector('input[name=oc-as]:checked').value;
  const cid = N.newId();
  const code = await N.claimCode('codes', cid);
  await N.set(N.R(`classes/${cid}`), { title, g: $('#oc-title').value.trim() ? null : g, c: $('#oc-title').value.trim() ? null : c, mode, assign, groups: +$('#oc-groups').value, code, status: 'lobby', round: 0, paused: false, sound: game().sound || 'all', created: N.serverTimestamp() });
  selectClass(cid); T.tab = 'live'; render();
  toast(`✅ 수업을 열었어요 · 코드 ${code}`);
};

/* ═════════════ 수업 고르기 · 방·게임 실시간 보기 ═════════════ */
let clsOff = [];
function selectClass(cid) {
  clsOff.forEach(f => f()); clsOff = [];
  T.cid = cid; T.rooms = {}; T.draft = null; T.sel = null;
  if (!cid) return;
  clsOff.push(N.onValue(N.query(N.R('rooms'), N.orderByChild('cid'), N.equalTo(cid)), s => {
    T.rooms = s.val() || {};
    Object.values(T.rooms).forEach(r => r.gid && watchGame(r.gid));
    soon();
  }));
}
// 방의 게임을 교사 화면에서도 똑같이 계산 (진행 상황·순위·학생 살펴보기)
function watchGame(gid) {
  if (T.games[gid]) return T.games[gid];
  const g = T.games[gid] = { gid, S: null, applied: 0, buf: {}, lastSeq: 0 };
  N.get(N.R(`acts/${gid}/meta`)).then(s => {
    const meta = s.val(); if (!meta) return;
    g.meta = meta; g.old = meta.ver !== N.VER;
    g.S = E.newGame(meta.opts);
    N.onChildAdded(N.R(`acts/${gid}/a`), c => {
      g.buf[+c.key] = c.val();
      while (g.buf[g.applied] != null) { try { E.act(g.S, g.buf[g.applied]); } catch (e) { console.error(e); } delete g.buf[g.applied]; g.applied++; }
      collectNews(g);
      if (g.S.over) saveResults(g);
      soon();
    });
    soon();
  });
  return g;
}
function collectNews(g) {
  g.S.log.forEach(e => { if (e.seq > g.lastSeq && e.k === 'news') T.feed.push({ room: g.meta.room, text: e.text, at: Date.now() }); });
  g.lastSeq = g.S.seq;
  if (T.feed.length > 60) T.feed.splice(0, T.feed.length - 60);
}
// 결과 기록 (학생 기기도 같은 내용을 씀 — 일찍 나간 학생도 기록이 남게 교사 화면이 한 번 더)
function saveResults(g) {
  if (g.saved || !g.meta.cid || TVID) return;
  g.saved = true;
  g.S.players.forEach(p => {
    if (p.isCom || !p.sid) return;
    const rec = { ...E.resultRecord(g.S, p.id), room: g.meta.room || null, round: g.meta.round || 1, t: N.serverTimestamp() };
    N.update(N.R(`results/${g.meta.cid}/${g.gid}/${p.sid}`), N.clean(rec)).catch(() => {});
  });
}
async function sendSys(gid, a) { // 방 게임에 교사 명령 넣기 (빈 순번에 먼저 쓰기)
  const g = T.games[gid]; if (!g || !g.S || g.S.over) return false;
  for (let i = 0; i < 12; i++) { if (await N.putAct(gid, g.applied, a)) return true; await sleep(250); }
  return false;
}
const roomsOf = () => Object.entries(T.rooms).map(([rid, r]) => ({ rid, ...r })).sort((a, b) => (a.no || 0) - (b.no || 0));
const playing = () => roomsOf().filter(r => r.status === 'play' && T.games[r.gid] && T.games[r.gid].S && !T.games[r.gid].S.over);
function liveScore(S, p) {
  if (S.mode === 'growth') return ['int', 'str', 'sen'].reduce((s, k) => s + E.grade(p, k), 0) * 10 + C.TAGS.reduce((s, t) => s + p.tags[t], 0) * 5 + p.awards.length * 10 + p.green * 3;
  return E.assets(S, p).total;
}
const fmtScore = (S, v) => (S.mode === 'growth' ? `${v}점` : E.money(v));
function progress(S) {
  if (S.over) return '🏁 끝';
  const st = C.STAGES[S.stage];
  return `${st.name} · 턴 ${Math.min(S.stageRound + 1, S.turns[S.stage])}/${S.turns[S.stage]}${S.wrap ? ' · ⏰ 마무리 중' : ''}`;
}

/* ═════════════ ② 진행 ═════════════ */
function liveRender(body) {
  const cls = T.classes[T.cid];
  if (!cls) { body.innerHTML = '<section class="card empty">열린 수업이 없어요. <b>① 준비</b> 탭에서 수업을 열어 주세요.</section>'; return; }
  const url = `${BASE}?c=${cls.code}`;
  const members = Object.entries(cls.members || {}).map(([sid, m]) => ({ sid, ...m })).sort((a, b) => a.sid.localeCompare(b.sid, undefined, { numeric: true }));
  const lobbyM = members.filter(m => !m.room);
  const reqs = Object.entries(cls.req || {});
  const old = Object.values(T.games).some(g => g.old);
  const headKey = [T.cid, cls.code, cls.title, cls.paused, cls.mode, cls.assign, cls.round, old].join('|');
  if (body.dataset.head !== headKey || !$('#lv-head')) {
    body.dataset.head = headKey;
    body.innerHTML = `<div id="lv-head">${old ? '<section class="card warn">⚠️ 게임 버전이 바뀌었어요. 이 창을 새로고침해 주세요.</section>' : ''}
    <section class="card livehead">
      <div class="codebig"><small>수업 코드</small><b>${esc(cls.code)}</b></div>
      <div class="qr">${qrSvg(url, 4)}</div>
      <div class="info"><h2>${esc(cls.title)} <span class="pill">${esc(C.MODES[cls.mode]?.name || '')}</span> <span class="pill">${{ group: '👥 모둠별', auto: '🎲 자동', manual: '✋ 직접' }[cls.assign] || ''}</span>${cls.round ? ` <span class="pill">${cls.round}판째</span>` : ''}</h2>
        <div class="url">학생 주소: <b>${esc(url)}</b></div>
        <div class="btns"><button data-k="tvOpen">📺 TV 화면 열기</button>
          <button class="${cls.paused ? 'primary' : ''}" data-k="pause">${cls.paused ? '▶ 다시 시작' : '⏸ 전체 일시정지'}</button>
          <button data-k="wrapAll">⏰ 마무리하기</button><button data-k="allLobby">🏠 모두 대기실로</button><button class="danger" data-k="closeClass">수업 닫기</button></div>
        <div class="btns"><input id="notice" placeholder="학생 화면에 띄울 알림 (예: 5분 남았어요)"><button data-k="notice">📢 알림 보내기</button>
          <select id="surp">${C.SURPRISES.map(s => `<option value="${s.k}">${s.icon} ${s.name} — ${s.desc}</option>`).join('')}</select><button data-k="surprise">🎁 깜짝 이벤트</button></div></div></section></div>
    <div id="lv-req"></div>
    <section class="card"><h3 id="lv-ah"></h3><div id="lv-assign"></div></section>
    <section class="card"><h3>🎮 방 현황 <small class="muted">학생을 누르면 상태 보기 · 학생 ▸ 다른 방을 누르면 옮기기</small></h3><div id="lv-rooms"></div></section>
    <section class="card"><h3 id="lv-rh"></h3><div id="lv-roster"></div></section>`;
  }
  $('#lv-req').innerHTML = reqs.length ? `<section class="card warn"><h3>✋ 다른 기기에서 같은 학번으로 들어오려고 해요</h3>${reqs.map(([sid, r]) => `<div class="row">학번 <b>${esc(sid)}</b> (${esc(r.nick || '')}) <button class="primary" data-k="reqOk" data-sid="${esc(sid)}">허락 (새 기기로 이어서)</button><button data-k="reqNo" data-sid="${esc(sid)}">거절</button></div>`).join('')}</section>` : '';
  $('#lv-ah').innerHTML = `🧩 방 배정 <small class="muted">대기실 ${lobbyM.length}명 (접속 ${lobbyM.filter(m => isOn(m.sid)).length}명)</small>`;
  $('#lv-assign').innerHTML = assignHtml(cls, lobbyM);
  $('#lv-rooms').innerHTML = roomsHtml();
  $('#lv-rh').innerHTML = `📋 학생 명단 <small class="muted">${members.length}명 · 학번은 이 화면에만 보여요</small>`;
  $('#lv-roster').innerHTML = rosterHtml(members);
}
const chip = (sid, m, extra = '') => `<span class="schip ${T.sel && T.sel.sid === sid ? 'sel' : ''} ${isOn(sid) ? '' : 'offl'}" data-k="pick" data-sid="${esc(sid)}" ${extra}>${face(m.look, m.gender, 30)}<b>${esc(m.nick)}</b><small>${esc(sid)}${m.group ? ` · ${m.group}모둠` : ''}</small></span>`;
function assignHtml(cls, lobbyM) {
  const d = T.draft;
  const mem = sid => (cls.members || {})[sid] || { nick: '?' };
  if (!d) {
    const late = playing().length > 0;
    return `<div class="row"><button class="${cls.assign === 'group' ? 'primary' : ''}" data-k="draft" data-m="group">👥 모둠별로 나누기</button><button class="${cls.assign === 'auto' ? 'primary' : ''}" data-k="draft" data-m="auto">🎲 자동으로 나누기</button><button class="${cls.assign === 'manual' ? 'primary' : ''}" data-k="draft" data-m="manual">✋ 직접 나누기</button>
      <span class="muted">${late ? '늦게 온 학생: 학생 ▸ 아래 방 현황의 방을 누르면 COM 자리를 이어받아요' : '나누기 → 확인·조정 → ▶ 모두 시작'}</span></div>
      <div class="chips">${lobbyM.map(m => chip(m.sid, m)).join('') || '<span class="muted">대기실에 학생이 없어요</span>'}</div>`;
  }
  const g = game();
  const base = Math.max(0, ...roomsOf().map(r => r.no || 0));
  return `<div class="draft">${d.rooms.map((r, i) => `<div class="dbox" data-k="dropTo" data-to="${i}"><h4>새 ${base + i + 1}번 방 · ${r.length}명${g.comFill && r.length && r.length < 4 ? ` + COM ${4 - r.length}` : ''}</h4><div class="chips">${r.map(sid => chip(sid, mem(sid))).join('')}</div></div>`).join('')}
      <div class="dbox none" data-k="dropTo" data-to="none"><h4>배정 안 됨 ${d.none.length}명</h4><div class="chips">${d.none.map(sid => chip(sid, mem(sid))).join('')}</div></div></div>
    <div class="row"><span class="muted">학생을 누른 다음 옮길 방을 누르세요</span><button data-k="addRoom">＋ 방 추가</button><button data-k="draftOff">취소</button>
      <button class="primary big" data-k="startAll">▶ 모두 시작 (${d.rooms.filter(r => r.length).length}개 방)</button></div>`;
}
function roomsHtml() {
  const rs = roomsOf().filter(r => r.status === 'play' || r.status === 'end');
  if (!rs.length) return '<p class="muted">아직 시작한 방이 없어요</p>';
  return `<div class="rooms">${rs.map(r => {
    const g = T.games[r.gid], S = g && g.S;
    if (!S) return `<div class="room"><h4>${r.no}번 방</h4><p class="muted">불러오는 중…</p></div>`;
    const rows = S.players.map(p => {
      const sid = p.sid, on = p.isCom || N.isIn(T.online, sid, r.rid);
      const sel = T.sel && T.sel.rid === r.rid && T.sel.pid === p.id;
      return `<div class="prow ${sel ? 'sel' : ''}" data-k="pickP" data-rid="${r.rid}" data-pid="${p.id}"><span class="dot ${p.isCom ? 'com' : on ? 'on' : 'off'}"></span>${p.isCom ? A.robotFace(28) : face(p.look, p.gender, 30)}
        <b>${esc(p.name)}</b><small>${p.isCom ? 'COM' : esc(sid || '')}</small><span class="sc">${fmtScore(S, liveScore(S, p))}</span><small class="jt">${esc(E.jobTitle(p).split(' · ')[0] || '')}</small></div>`;
    }).join('');
    return `<div class="room ${r.status === 'end' ? 'ended' : ''}" data-k="roomTo" data-rid="${r.rid}"><h4>${r.no}번 방 <small>${esc(progress(S))}${r.status === 'end' ? ' · 대기실로 보냄' : ''}</small></h4>${rows}
      <div class="rbtn">${S.over || r.status !== 'play' ? '' : `<button data-k="wrapRoom" data-rid="${r.rid}">⏰ 마무리</button>`}${r.status === 'play' ? `<button class="danger" data-k="endRoom" data-rid="${r.rid}">방 끝내기</button>` : ''}</div></div>`;
  }).join('')}</div>`;
}
function rosterHtml(members) {
  if (!members.length) return '<p class="muted">아직 들어온 학생이 없어요</p>';
  const rno = rid => (T.rooms[rid] ? `${T.rooms[rid].no}번 방` : '방');
  return `<table class="roster"><tr><th>학번</th><th></th><th>별명</th><th>모둠</th><th>위치</th><th>접속</th><th></th></tr>${members.map(m => `<tr>
    <td>${esc(m.sid)}</td><td>${face(m.look, m.gender, 34)}</td><td><b>${esc(m.nick)}</b> <button class="mini" data-k="nick" data-sid="${esc(m.sid)}">✏️ 바꾸기</button><button class="mini" data-k="nickReset" data-sid="${esc(m.sid)}">초기화</button></td>
    <td>${m.group ? m.group + '모둠' : '-'}</td><td>${m.room ? rno(m.room) : '대기실'}</td><td>${isOn(m.sid) ? '<span class="on">● 접속</span>' : '<span class="off">○ 끊김</span>'}</td>
    <td><button class="mini danger" data-k="kick" data-sid="${esc(m.sid)}">명단에서 빼기</button></td></tr>`).join('')}</table>`;
}

/* ── 진행 버튼들 ── */
const clsRef = p => N.R(`classes/${T.cid}${p ? '/' + p : ''}`);
H.tvOpen = () => window.open(`teacher.html?tv=${T.cid}`, 'tlg_tv');
H.pause = async () => { const c = T.classes[T.cid]; await N.update(clsRef(), { paused: !c.paused }); toast(c.paused ? '▶ 다시 시작!' : '⏸ 모든 방을 멈췄어요'); };
H.notice = async () => { const t = $('#notice').value.trim(); if (!t) return; await N.set(clsRef('notice'), { text: t.slice(0, 80), t: N.serverTimestamp() }); $('#notice').value = ''; toast('📢 보냈어요'); };
H.surprise = async () => {
  const k = $('#surp').value, sp = C.SURPRISES.find(s => s.k === k), rs = playing();
  if (!rs.length) return toast('진행 중인 방이 없어요');
  if (!(await ask(`모든 방에 "${sp.name}" 깜짝 이벤트를 보낼까요?`, '보내기', false))) return;
  let ok = 0; for (const r of rs) if (await sendSys(r.gid, { sys: 'surprise', k })) ok++;
  toast(`🎁 ${ok}개 방에 보냈어요`);
};
H.wrapAll = async () => {
  const rs = playing(); if (!rs.length) return toast('진행 중인 방이 없어요');
  if (!(await ask('모든 방을 마무리할까요? 지금 바퀴가 끝나면 결승 정산(인생 보고서)으로 가요.', '마무리하기', false))) return;
  let ok = 0; for (const r of rs) if (await sendSys(r.gid, { sys: 'wrap' })) ok++;
  toast(`⏰ ${ok}개 방을 마무리해요`);
};
H.wrapRoom = async d => { const r = T.rooms[d.rid]; if (r && await sendSys(r.gid, { sys: 'wrap' })) toast(`⏰ ${r.no}번 방을 마무리해요`); };
H.endRoom = async d => {
  const r = T.rooms[d.rid]; if (!r || !(await ask(`${r.no}번 방을 끝내고 학생들을 대기실로 보낼까요?`, '방 끝내기'))) return;
  const upd = { }; Object.entries(T.classes[T.cid].members || {}).forEach(([sid, m]) => { if (m.room === d.rid) upd[`members/${sid}/room`] = null; });
  await N.update(N.R(`rooms/${d.rid}`), { status: 'end' });
  if (Object.keys(upd).length) await N.update(clsRef(), upd);
};
H.allLobby = async () => {
  if (!(await ask('모든 학생을 대기실로 보낼까요? (진행 중인 게임은 거기서 끝나요)', '모두 대기실로'))) return;
  const upd = { status: 'lobby' };
  Object.entries(T.classes[T.cid].members || {}).forEach(([sid, m]) => { if (m.room) upd[`members/${sid}/room`] = null; });
  for (const r of roomsOf()) if (r.status === 'play') await N.update(N.R(`rooms/${r.rid}`), { status: 'end' });
  await N.update(clsRef(), upd);
  T.draft = null; toast('🏠 모두 대기실로 보냈어요');
};
H.closeClass = async () => {
  const c = T.classes[T.cid];
  if (!(await ask(`"${c.title}" 수업을 닫을까요? 학생들은 처음 화면으로 나가요. (기록은 ③ 결과에 남아요)`, '수업 닫기'))) return;
  const upd = { closed: true, status: 'closed', paused: false };
  Object.entries(c.members || {}).forEach(([sid, m]) => { if (m.room) upd[`members/${sid}/room`] = null; });
  for (const r of roomsOf()) if (r.status === 'play') await N.update(N.R(`rooms/${r.rid}`), { status: 'end' });
  await N.update(clsRef(), upd);
  const code = (await N.get(N.R(`codes/${c.code}`))).val(); if (code && code.v === T.cid) await N.remove(N.R(`codes/${c.code}`));
  const resCid = T.cid; selectClass(null); T.resCid = resCid; T.tab = 'res'; loadResults(resCid); render();
};
H.reqOk = async d => { const r = (T.classes[T.cid].req || {})[d.sid]; if (r) await N.update(clsRef(), { [`members/${d.sid}/uid`]: r.uid, [`req/${d.sid}`]: null }); };
H.reqNo = d => N.set(clsRef(`req/${d.sid}`), null);
H.nick = async d => {
  const m = T.classes[T.cid].members[d.sid];
  const v = await askText(`학번 ${d.sid}의 별명 바꾸기`, m.nick); if (v == null) return;
  const prob = N.nickProblem(v); if (prob) return toast(prob);
  await N.update(N.R(`students/${d.sid}`), { nick: v });
  await N.update(clsRef(`members/${d.sid}`), { nick: v });
  toast('✅ 바꿨어요 (진행 중인 게임에는 다음 판부터 보여요)');
};
H.nickReset = async d => {
  if (!(await ask(`학번 ${d.sid}의 별명을 지울까요? 다음에 들어올 때 학생이 새로 정해요.`, '지우기'))) return;
  await N.remove(N.R(`students/${d.sid}/nick`));
};
H.kick = async d => { if (await ask(`학번 ${d.sid}을(를) 이 수업 명단에서 뺄까요?`, '빼기')) await N.remove(clsRef(`members/${d.sid}`)); };

/* ── 방 나누기 (모둠별 · 자동 · 직접) ── */
function split(sids) { const k = Math.ceil(sids.length / 4), out = Array.from({ length: k }, () => []); sids.forEach((s, i) => out[i % k].push(s)); return out; } // 5→3+2, 7→4+3, 30→4×6+3×2
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
H.draft = d => {
  const cls = T.classes[T.cid];
  const lob = Object.entries(cls.members || {}).filter(([, m]) => !m.room).map(([sid, m]) => ({ sid, ...m }));
  const on = lob.filter(m => isOn(m.sid)), offl = lob.filter(m => !isOn(m.sid)).map(m => m.sid);
  let rooms = [], none = offl;
  if (d.m === 'group') {
    const by = {}; on.forEach(m => (by[m.group || 0] ||= []).push(m.sid));
    Object.keys(by).sort((a, b) => a - b).forEach(k => { if (+k) rooms.push(...split(by[k])); });
    if (by[0]) rooms.push(...split(shuffle(by[0])));
  } else if (d.m === 'auto') rooms = split(shuffle(on.map(m => m.sid)));
  else { rooms = Array.from({ length: Math.max(1, Math.ceil(on.length / 4)) }, () => []); none = on.map(m => m.sid).concat(offl); }
  if (!rooms.length) rooms = [[]];
  T.draft = { rooms, none }; T.sel = null; render();
};
H.draftOff = () => { T.draft = null; T.sel = null; render(); };
H.addRoom = () => { T.draft.rooms.push([]); render(); };
H.pick = (d, el, e) => {
  e.stopPropagation();
  T.sel = T.sel && T.sel.sid === d.sid && T.sel.rid == null ? null : { sid: d.sid }; render();
};
H.dropTo = d => {
  if (!T.sel || !T.draft || T.sel.rid) return;
  const sid = T.sel.sid, D = T.draft;
  D.rooms.forEach(r => { const i = r.indexOf(sid); if (i >= 0) r.splice(i, 1); });
  D.none = D.none.filter(x => x !== sid);
  if (d.to === 'none') D.none.push(sid); else if (D.rooms[+d.to].length < 4) D.rooms[+d.to].push(sid); else { toast('한 방은 4명까지예요'); D.none.push(sid); }
  T.sel = null; render();
};
H.startAll = async (d, el) => {
  const cls = T.classes[T.cid], g = game();
  const rooms = T.draft.rooms.map(r => r.filter(sid => (cls.members || {})[sid])).filter(r => r.length); // 그사이 명단에서 빠진 학생 제외
  if (!rooms.length) return toast('방에 넣은 학생이 없어요');
  el.disabled = true;
  const settings = { quiz: g.quiz, units: g.units || [], quizList: E.quizPool(T.cfg), timer: g.timer, quizTime: g.quizTime, reflect: g.reflect, sound: g.sound || 'all' }; // 고친 기본 문제 + 직접 넣은 문제
  const round = (cls.round || 0) + 1;
  let no = Math.max(0, ...roomsOf().map(r => r.no || 0));
  const upd = { status: 'play', round };
  for (const sids of rooms) {
    no++;
    const rid = N.newId();
    const players = sids.map(sid => { const m = cls.members[sid]; return { name: m.nick, gender: m.gender, look: gameLook(m.look), sid }; });
    if (g.comFill) { let k = 0; while (players.length < 4) players.push({ name: `COM${++k}`, gender: players.length % 2 ? 'f' : 'm', look: gameLook(null), isCom: true }); }
    const gid = await N.createGame({ mode: cls.mode, seed: rand(), settings, players }, { cid: T.cid, rid, round, room: no });
    await N.set(N.R(`rooms/${rid}`), { cid: T.cid, no, gid, mode: cls.mode, status: 'play', round, t: N.serverTimestamp() });
    sids.forEach(sid => { upd[`members/${sid}/room`] = rid; });
  }
  await N.update(clsRef(), upd);
  T.draft = null; T.sel = null; toast(`▶ ${rooms.length}개 방 시작!`); render();
};
/* ── 진행 중인 방: 늦게 온 학생 넣기 · 학생 옮기기 · 상태 보기 ── */
H.pickP = (d, el, e) => {
  e.stopPropagation();
  if (T.sel && T.sel.rid !== d.rid && (T.sel.sid || T.sel.rid)) return H.roomTo({ rid: d.rid }); // 다른 방 학생을 누른 상태 → 이 방으로
  const r = T.rooms[d.rid], g = r && T.games[r.gid], p = g && g.S && g.S.players[+d.pid];
  if (!p) return;
  if (T.sel && T.sel.rid === d.rid && T.sel.pid === +d.pid) { T.sel = null; render(); return peek(g.S, p, r); }
  T.sel = p.sid ? { rid: d.rid, pid: +d.pid, sid: p.sid } : null;
  if (!p.sid) return peek(g.S, p, r);
  render(); toast(`${p.name}: 한 번 더 누르면 상태 보기 · 다른 방을 누르면 옮기기`);
};
H.roomTo = async d => {
  if (!T.sel) return;
  const sel = T.sel; T.sel = null;
  const to = T.rooms[d.rid], tg = to && T.games[to.gid];
  if (!tg || !tg.S || tg.S.over || to.status !== 'play') { render(); return toast('진행 중인 방에만 넣을 수 있어요'); }
  if (sel.rid === d.rid) return render();
  const pid = tg.S.players.findIndex(p => p.isCom);
  if (pid < 0) { render(); return toast('이 방에는 COM 자리가 없어요'); }
  const cls = T.classes[T.cid], m = cls.members[sel.sid];
  if (!m) { render(); return toast('명단에 없는 학생이에요'); }
  if (sel.rid) { const from = T.rooms[sel.rid]; if (from) await sendSys(from.gid, { sys: 'com', pid: sel.pid }); }
  if (!(await sendSys(to.gid, { sys: 'seat', pid, sid: sel.sid, name: m.nick, gender: m.gender, look: gameLook(m.look) }))) return toast('⚠️ 넣지 못했어요. 다시 해 주세요');
  await N.update(clsRef(`members/${sel.sid}`), { room: d.rid });
  toast(`✅ ${m.nick} → ${to.no}번 방`); render();
};
function peek(S, p, r) {
  const a = E.assets(S, p);
  modal(`<h3>${r.no}번 방 · ${esc(p.name)} ${p.sid ? `<small class="muted">${esc(p.sid)}</small>` : ''}</h3>
    <div class="peek"><div>${p.isCom ? A.robotFull(120, 180) : A.fullSvg(p.look, { age: A.STAGE_AGE[C.STAGES[S.stage].k], gender: p.gender }, 120, 190)}</div><div>
      <p><b>${esc(E.jobTitle(p) || C.STAGES[S.stage].name)}</b> ${p.job && !p.job.free && !p.retired ? '★'.repeat(p.job.rank) : ''}</p>
      <p>능력치 ${['int', 'str', 'sen'].map(s => `${C.STATS[s]} ${C.GRADES[E.grade(p, s)]}`).join(' · ')} · 운세 ${C.LUCK[p.luck]}</p>
      <p>돈 ${E.money(p.money)}${p.debt ? ` · 빚 ${E.money(p.debt)}` : ''} · 지금 총점 ${fmtScore(S, liveScore(S, p))}</p>
      <p>💚 ${p.green} · 😊 ${p.happy} · ${p.spouse != null ? '💑 결혼' : '1인 가구'}${p.kids.length ? ` · 👶 ${p.kids.length}명` : ''}</p>
      <p>경험 ${C.TAGS.filter(t => p.tags[t]).map(t => `${C.TAG_ICON[t]}${t}×${p.tags[t]}`).join(' ') || '-'}</p>
      <p class="muted">진로 흐름: ${p.hist.map(esc).join(' → ') || '-'}</p></div></div>
    <div class="btns"><button data-k="mclose">닫기</button></div>`);
  void a;
}

/* ═════════════ ③ 결과 ═════════════ */
let resOff = null;
function loadResults(cid) {
  if (resOff) { resOff(); resOff = null; }
  T.resCid = cid; T.res = null;
  if (!cid) return;
  resOff = N.onValue(N.R(`results/${cid}`), s => { T.res = s.val() || {}; if (T.tab === 'res') soon(); }, () => { T.res = {}; });
}
function resRows() {
  const out = [];
  Object.entries(T.res || {}).forEach(([gid, by]) => Object.entries(by || {}).forEach(([sid, r]) => { if (r && r.nick && r.rank) out.push({ gid, sid, ...r }); }));
  return out;
}
function resHtml() {
  const list = Object.entries(T.classes).sort((a, b) => (b[1].created || 0) - (a[1].created || 0));
  const sel = `<select onchange="window.__resClass(this.value)"><option value="">수업 고르기</option>${list.map(([cid, c]) => `<option value="${cid}" ${cid === T.resCid ? 'selected' : ''}>${esc(c.title)} · ${c.created ? new Date(c.created).toLocaleDateString('ko-KR') : ''}${c.closed ? ' (닫음)' : ''}</option>`).join('')}</select>`;
  const tools = `<section class="card"><h3>🧹 정리 <small class="muted">학기 말 개인정보 정리</small></h3><div class="row"><button data-k="cleanFree">자유 모드 방 정리 (하루 지난 것)</button><button class="danger" data-k="wipeStudents">학번·별명 목록 모두 지우기</button></div></section>`;
  if (!T.resCid) return `<section class="card"><div class="row">${sel}</div><p class="muted">수업을 고르면 순위·기록을 볼 수 있어요</p></section>${tools}`;
  if (!T.res) return `<section class="card"><div class="row">${sel}</div><p class="muted">불러오는 중…</p></section>`;
  const all = resRows();
  const rounds = [...new Set(all.map(r => r.round || 1))].sort((a, b) => a - b);
  const cur = T.resRound != null && rounds.includes(T.resRound) ? T.resRound : rounds[rounds.length - 1];
  const rows = all.filter(r => (r.round || 1) === cur).sort((a, b) => b.score - a.score);
  const growth = rows.some(r => r.growth);
  const top = (f, filt = () => true) => rows.filter(filt).sort((a, b) => f(b) - f(a))[0];
  const aw = [[growth ? '🌱 성장왕' : '💰 총자산왕', top(r => r.score)], ['💚 사회기여왕', top(r => r.green, r => r.green > 0)], ['😊 행복왕', top(r => r.happy)], ['🚀 도전왕', top(r => r.score, r => r.founder)]];
  const count = key => { const m = {}; rows.forEach(r => { const k = key(r); if (k) m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8); };
  const greenRatio = rows.length ? Math.round(rows.filter(r => r.jobGreen || r.green >= 5).length / rows.length * 100) : 0;
  return `<section class="card"><div class="row">${sel} ${rounds.map(n => `<button class="${n === cur ? 'primary' : ''}" data-k="resRound" data-n="${n}">${n}판</button>`).join('')}
      <span class="muted">${rows.length}명</span><button data-k="csv">📥 엑셀(CSV) 내려받기</button><button class="danger" data-k="delClass">🗑️ 이 수업 기록 지우기</button></div></section>
    ${rows.length ? `<section class="card awards">${aw.map(([n, r]) => `<div class="aw"><small>${n}</small><b>${r ? esc(r.nick) : '-'}</b><span class="muted">${r ? esc(r.sid) : ''}</span></div>`).join('')}</section>
    <section class="card"><h3>🏆 반 전체 순위 <small class="muted">이름을 누르면 진로 흐름·성찰</small></h3><table class="roster"><tr><th>순위</th><th>학번</th><th>별명</th><th>방</th><th>직업</th><th>${growth ? '성장 점수' : '인생 총점'}</th><th>💚</th><th>😊</th><th>훈장</th><th>성찰</th></tr>
      ${rows.map((r, i) => `<tr class="click" data-k="resOne" data-gid="${r.gid}" data-sid="${esc(r.sid)}"><td>${i + 1}</td><td>${esc(r.sid)}</td><td><b>${esc(r.nick)}</b></td><td>${r.room ? r.room + '번' : ''}</td><td>${esc((r.job || '').split(' · ')[0] || r.title || '')}</td><td>${r.growth ? r.score + '점' : E.money(r.score)}</td><td>${r.green || 0}</td><td>${r.happy ?? ''}</td><td>${esc(r.medal || '')}</td><td>${r.reflect ? '✅' : ''}</td></tr>`).join('')}</table></section>
    <section class="card stats"><div><h3>💼 많이 고른 직업</h3>${count(r => (r.job || '').split(' · ')[0]).map(([k, v]) => `<div class="bar"><span>${esc(k)}</span><i style="width:${v / rows.length * 100}%"></i><b>${v}</b></div>`).join('') || '<p class="muted">-</p>'}</div>
      <div><h3>🧭 분야</h3>${count(r => r.field).map(([k, v]) => `<div class="bar"><span>${esc(k)}</span><i style="width:${v / rows.length * 100}%"></i><b>${v}</b></div>`).join('') || '<p class="muted">-</p>'}</div>
      <div><h3>💚 사회기여를 고른 비율</h3><p class="big">${greenRatio}%</p><p class="muted">💚 직업이거나 사회기여 5점 이상</p><h3>🚀 창업 도전</h3><p class="big">${rows.filter(r => r.founder).length}명</p></div></section>` : '<section class="card"><p class="muted">이 판의 기록이 아직 없어요 (게임이 끝나면 저장돼요)</p></section>'}
    ${tools}`;
}
window.__resClass = cid => { T.resRound = null; loadResults(cid || null); render(); };
H.resRound = d => { T.resRound = +d.n; render(); };
H.resOne = d => {
  const r = (T.res[d.gid] || {})[d.sid]; if (!r) return;
  const qs = game().reflect || REFLECT;
  modal(`<h3>${esc(r.nick)} <small class="muted">${esc(d.sid)} · ${r.room ? r.room + '번 방 · ' : ''}${esc(C.MODES[r.mode]?.name || '')}</small></h3>
    <p class="big2">${esc(r.title || '')}</p>
    <p><b>${esc(r.job || '')}</b> · ${r.growth ? r.score + '점' : E.money(r.score)} · ${r.rank}등 (방 안)</p>
    <p>능력치 ${esc(r.grades || '')} · 경험 ${esc(r.tags || '-')} · 💚 ${r.green || 0} · 😊 ${r.happy ?? '-'}${r.married ? ' · 💑 결혼' : ''}${r.kids ? ` · 👶 ${r.kids}` : ''}</p>
    <p>🧭 진로 흐름: ${(r.hist || []).map(esc).join(' → ')}</p>${(r.awards || []).length ? `<p>🏆 ${r.awards.map(esc).join(', ')}</p>` : ''}
    <h4>✏️ 진로 성찰</h4>${r.reflect ? r.reflect.map((a, i) => `<p class="refl"><small>${esc(qs[i] || '')}</small><br>${esc(a) || '<span class="muted">(빈칸)</span>'}</p>`).join('') : '<p class="muted">아직 안 썼어요</p>'}
    <div class="btns"><button data-k="mclose">닫기</button></div>`);
};
H.csv = () => {
  const cls = T.classes[T.resCid] || {};
  const head = ['판', '방', '학번', '별명', '방 순위', '점수/총점(만원)', '직업', '분야', '사회기여', '행복도', '훈장', '결혼', '자녀', '경험', '능력치', '진로 흐름', '상장', '성찰1', '성찰2'];
  const rows = resRows().sort((a, b) => (a.round || 1) - (b.round || 1) || a.sid.localeCompare(b.sid, undefined, { numeric: true }))
    .map(r => [r.round || 1, r.room || '', r.sid, r.nick, r.rank, r.score, r.job, r.field, r.green, r.happy, r.medal, r.married ? 'O' : '', r.kids || 0, r.tags, r.grades, (r.hist || []).join(' → '), (r.awards || []).join(', '), (r.reflect || [])[0] || '', (r.reflect || [])[1] || '']);
  const csv = '﻿' + [head, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `기술인생게임_${(cls.title || '수업').replace(/\s/g, '')}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
H.delClass = async () => {
  const cid = T.resCid, cls = T.classes[cid];
  if (!(await ask(`"${cls ? cls.title : '이 수업'}"의 명단·게임·결과 기록을 모두 지울까요? 되돌릴 수 없어요.`, '모두 지우기'))) return;
  const res = (await N.get(N.R(`results/${cid}`))).val() || {};
  const rooms = (await N.get(N.query(N.R('rooms'), N.orderByChild('cid'), N.equalTo(cid)))).val() || {};
  const gids = new Set([...Object.keys(res), ...Object.values(rooms).map(r => r.gid).filter(Boolean)]);
  for (const gid of gids) await N.remove(N.R(`acts/${gid}`)).catch(() => {});
  for (const rid of Object.keys(rooms)) await N.remove(N.R(`rooms/${rid}`));
  await N.remove(N.R(`results/${cid}`));
  if (cls && cls.code) { const c = (await N.get(N.R(`codes/${cls.code}`))).val(); if (c && c.v === cid) await N.remove(N.R(`codes/${cls.code}`)); }
  await N.remove(N.R(`classes/${cid}`));
  if (T.cid === cid) selectClass(null);
  T.resCid = null; T.res = null; render(); toast('🗑️ 지웠어요');
};
H.cleanFree = async () => {
  const rooms = (await N.get(N.query(N.R('rooms'), N.orderByChild('cid'), N.equalTo(null)))).val() || {};
  const old = Object.entries(rooms).filter(([, r]) => !r.cid && (!r.t || r.t < Date.now() - 24 * 3600e3));
  if (!(await ask(`하루 지난 자유 모드 방 ${old.length}개를 지울까요?`, '정리하기', false))) return;
  for (const [rid, r] of old) { if (r.gid) await N.remove(N.R(`acts/${r.gid}`)).catch(() => {}); await N.remove(N.R(`rooms/${rid}`)); }
  toast(`🧹 ${old.length}개 정리했어요`);
};
H.wipeStudents = async () => {
  if (!(await ask('모든 학생의 학번·별명·꾸미기 정보를 지울까요? 다음 수업에서 학생들이 별명을 새로 정해요.', '모두 지우기'))) return;
  await N.remove(N.R('students')); toast('🗑️ 지웠어요');
};

/* ═════════════ 📺 TV 화면 ═════════════ */
function tv(cid) {
  document.body.classList.add('tvmode');
  let cls = null, phase0 = null, feed0 = 0;
  // 교실 스피커용 소리: 브라우저 규칙상 한 번 눌러야 켜짐
  const sb = document.createElement('button'); sb.id = 'tvsnd'; document.body.appendChild(sb);
  const label = () => { const s = SND.state(), on = (s.bgm || s.fx) && SND.running(); sb.textContent = on ? '🔊 소리 끄기' : '🔈 소리 켜기 (배경음악·소식 알림)'; sb.classList.toggle('on', on); };
  sb.onclick = () => {
    const s = SND.state(), on = !((s.bgm || s.fx) && SND.running());
    if (s.bgm !== on) SND.toggle('bgm'); if (s.fx !== on) SND.toggle('fx');
    SND.unlock(); setTimeout(() => { label(); draw(); }, 300);
  };
  label();
  const sound = (phase, growth) => {
    SND.bgm({ lobby: 'title', live: growth ? 'school' : 'adult', awards: 'result' }[phase] || null);
    if (phase === 'awards' && phase0 !== 'awards') SND.sfx('fanfare');
    if (phase === 'live' && phase0 === 'live' && T.feed.length > feed0) SND.sfx('notice');
    phase0 = phase; feed0 = T.feed.length;
  };
  const draw = () => {
    if (!cls) { app.innerHTML = '<div class="tv"><h1>수업을 찾지 못했어요</h1></div>'; return; }
    const url = `${BASE}?c=${cls.code}`;
    const rs = roomsOf().filter(r => r.status === 'play');
    const gs = rs.map(r => ({ r, g: T.games[r.gid] })).filter(x => x.g && x.g.S);
    const members = Object.values(cls.members || {});
    if (cls.closed) { sound('closed'); app.innerHTML = `<div class="tv"><h1>${esc(cls.title)}</h1><p class="sub">수업이 끝났어요. 수고했어요! 👏</p></div>`; return; }
    if (!gs.length) { // 입장 화면
      sound('lobby');
      app.innerHTML = `<div class="tv lobbytv"><div class="left"><h1>${esc(cls.title)} · 기술인생게임</h1>
        <p class="sub">① 주소로 들어가기 → ② <b>🏫 수업 참가</b> → ③ 수업 코드와 학번</p><div class="code"><small>수업 코드</small>${esc(cls.code)}</div><p class="url">${esc(url)}</p>
        <div class="faces">${members.map(m => `<span>${face(m.look, m.gender, 54)}<b>${esc(m.nick)}</b></span>`).join('')}</div><p class="sub">들어온 친구 ${members.length}명</p></div>
        <div class="qrbig">${qrSvg(url, 10)}</div></div>`;
      return;
    }
    const people = [];
    gs.forEach(({ r, g }) => g.S.players.forEach(p => { if (!p.isCom) people.push({ p, S: g.S, no: r.no, score: liveScore(g.S, p) }); }));
    people.sort((a, b) => b.score - a.score);
    const allOver = gs.every(x => x.g.S.over);
    if (allOver) {
      const best = (f, filt = () => true) => people.filter(filt).sort((a, b) => f(b) - f(a))[0];
      const growth = gs[0].g.S.mode === 'growth';
      sound('awards');
      const sc = x => fmtScore(x.S, x.score);
      const aw = [[growth ? '🌱 성장왕' : '💰 총자산왕', best(x => x.score), sc], ['💚 사회기여왕', best(x => x.p.green, x => x.p.green > 0), x => `💚 ${x.p.green}점`],
        ['😊 행복왕', best(x => x.p.happy), x => `😊 행복도 ${x.p.happy}`], ['🚀 도전왕', best(x => x.score, x => x.p.hist.includes('창업 도전') || (E.jobOf(x.p) && E.jobOf(x.p).titles === '창업')), sc]];
      app.innerHTML = `<div class="tv"><h1>🏆 ${esc(cls.title)} 시상식</h1><div class="awardsTV">${aw.map(([n, x, f]) => `<div class="awc"><small>${n}</small>${x ? `${A.fullSvg(x.p.look, { age: growth ? 'high' : 'elder', gender: x.p.gender, mood: 'g' }, 150, 230)}<b>${esc(x.p.name)}</b><span>${x.no}번 방 · ${f(x)}</span>` : '<b>-</b>'}</div>`).join('')}</div></div>`;
      return;
    }
    sound('live', gs[0].g.S.mode === 'growth');
    app.innerHTML = `<div class="tv livetv"><div class="col"><h2>🏆 실시간 순위</h2>${people.slice(0, 10).map((x, i) => `<div class="rk"><span class="no">${i + 1}</span>${face(x.p.look, x.p.gender, 46)}<b>${esc(x.p.name)}</b><small>${x.no}번 방 · ${esc(E.jobTitle(x.p).split(' · ')[0] || C.STAGES[x.S.stage].name)}</small><span class="sc">${fmtScore(x.S, x.score)}</span></div>`).join('')}</div>
      <div class="col"><h2>📰 사건 소식</h2>${T.feed.slice(-9).reverse().map(f => `<div class="news"><span>${f.room}번 방</span>${esc(f.text)}</div>`).join('') || '<p class="sub">곧 소식이 들어와요!</p>'}
        <h2 style="margin-top:18px">🎮 방 진행</h2>${gs.map(({ r, g }) => `<div class="prog"><b>${r.no}번 방</b><span>${esc(progress(g.S))}</span></div>`).join('')}</div></div>`;
  };
  N.onValue(N.R(`classes/${cid}`), s => { cls = s.val(); draw(); });
  N.onValue(N.query(N.R('rooms'), N.orderByChild('cid'), N.equalTo(cid)), s => { T.rooms = s.val() || {}; Object.values(T.rooms).forEach(r => r.gid && watchGame(r.gid)); draw(); });
  let t = null;
  window.__tvSoon = () => { clearTimeout(t); t = setTimeout(draw, 400); };
}
