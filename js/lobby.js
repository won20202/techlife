// 온라인 입장 화면
// 수업 모드: 수업 코드 → 학번 → (처음이면) 별명·성별·꾸미기 → 모둠 → 대기실 → 선생님이 방 배정·시작
// 자유 모드: 학번 → 방 만들기(4자리 방 코드) 또는 코드로 참가 → 방장이 시작
let K = null; // ui.js가 넘겨주는 화면 도구
let N = null; // net.js (처음 쓸 때 불러옴 — 혼자 하기는 인터넷 없이도 되게)
const L = { sid: null, prof: null, cid: null, cls: null, rid: null, group: null, unsubs: [], draft: null, kind: null };
const off = () => { L.unsubs.forEach(f => { try { f(); } catch {} }); L.unsubs = []; };
const $ = s => document.querySelector(s);
const MODE_KEYS = ['growth', 'careerShort', 'career', 'life', 'extreme'];
const NEW_LOOK = () => ({ skin: 0, hair: 0, hairColor: 0, outfit: 3, item: 'none' });

export function install(k) {
  K = k;
  Object.assign(K.UI, H);
  document.addEventListener('keydown', e => { // 입력칸에서 Enter = 다음
    if (e.key !== 'Enter' || !e.target.matches('input[data-enter]')) return;
    const t = JSON.parse(e.target.dataset.enter); H[t.k] && H[t.k](t);
  });
  return { joinClass, free, autoResume, stop };
}

async function net() {
  if (N) return N;
  try { N = await import('./net.js'); await N.login(); return N; }
  catch (e) { N = null; console.error(e); K.toast('📡 온라인에 연결하지 못했어요. 인터넷 연결(학교 사이트 차단)을 확인해 주세요'); throw e; }
}
function err(t) { const el = $('#f-err'); if (el) el.textContent = t; return null; }
function busy(on) { const s = $('#stage'); if (s) s.classList.toggle('sending', on); }
async function guard(f) { busy(true); try { return await f(); } catch (e) { console.error(e); err('⚠️ 연결이 불안정해요. 잠시 뒤 다시 눌러 주세요'); } finally { busy(false); } }
const save = v => { try { v ? N.store.setItem('tlg_on', JSON.stringify(v)) : N.store.removeItem('tlg_on'); } catch {} };
const fixLook = l => ({ ...NEW_LOOK(), ...(l || {}) });
const gameLook = l => { const x = fixLook(l); return { ...x, item: x.item === 'none' ? null : x.item }; };

function screen(title, body, back = 'title') {
  K.closeOv();
  K.stage.innerHTML = `<div class="screen lobby"><div class="lhead"><div class="title-big">${title}</div>${back ? `<button class="btn w sm" data-ui='${K.J({ k: back })}'>← ${back === 'title' ? '처음으로' : '뒤로'}</button>` : ''}</div>${body}</div>`;
}
const face = (look, gender, size = 60) => K.A.faceSvg(fixLook(look), gender || 'm', 'adult', size);

/* ═════════════ 수업 모드 ═════════════ */
function joinClass(code = '') {
  stopGame(); off(); L.kind = 'class';
  screen('🏫 수업 참가', `<div class="panel form">
    <label>수업 코드 <span class="muted">(선생님 화면·TV의 4자리 숫자)</span><input id="f-code" inputmode="numeric" maxlength="4" value="${K.esc(code)}" placeholder="0000" data-enter='{"k":"jcGo"}' autocomplete="off"></label>
    <label>학번<input id="f-sid" inputmode="numeric" maxlength="10" placeholder="예: 20312" data-enter='{"k":"jcGo"}' autocomplete="off"></label>
    <div class="err" id="f-err"></div>
    <button class="btn y big" data-ui='{"k":"jcGo"}'>다음 ▶</button>
    <p class="muted" style="font-size:15px;text-align:center">이름은 받지 않아요. 게임에서는 내가 정한 별명만 보여요.</p></div>`);
  setTimeout(() => $(code ? '#f-sid' : '#f-code')?.focus(), 50);
}
const H = {};
H.joinClass = () => joinClass(new URLSearchParams(location.search).get('c') || '');
H.jcGo = () => guard(async () => {
  const code = $('#f-code').value.trim(), sidIn = $('#f-sid').value.trim();
  err('');
  if (!/^\d{4}$/.test(code)) return err('수업 코드 4자리를 넣어 주세요');
  await net();
  const c = (await N.get(N.R(`codes/${code}`))).val();
  const cls = c && (await N.get(N.R(`classes/${c.v}`))).val();
  if (!cls || cls.closed) return err('수업 코드를 다시 확인해 주세요 (끝난 수업일 수도 있어요)');
  const school = (await N.get(N.R('config/school'))).val();
  const rule = N.sidRule(school);
  const id = rule.parse(sidIn);
  if (!id) return err(`학번을 확인해 주세요 — ${rule.text}`);
  if (cls.g && id.g != null && (id.g !== cls.g || (cls.c && id.c !== cls.c))) return err(`${cls.title} 학번이 아니에요. 반을 확인해 주세요`);
  Object.assign(L, { cid: c.v, cls, sid: sidIn, group: null, code });
  await afterSid();
});

async function afterSid() {
  const prof = (await N.get(N.R(`students/${L.sid}`))).val();
  if (prof && prof.nick) { L.prof = prof; confirmMe(); }
  else { L.draft = { name: '', gender: 'm', look: NEW_LOOK() }; profile(); }
}
function confirmMe() {
  const p = L.prof;
  screen('🙌 반가워요!', `<div class="panel form" style="width:620px;text-align:center">
    <div style="display:flex;justify-content:center">${K.A.fullSvg(gameLook(p.look), { age: 'adult', gender: p.gender, mood: 'g' }, 170, 270)}</div>
    <p class="jua" style="font-size:34px;color:var(--purple)">${K.esc(p.nick)} 맞나요?</p>
    <p class="muted">학번 ${K.esc(L.sid)}로 정한 별명이에요 (별명은 선생님만 바꿀 수 있어요)</p>
    <div style="display:flex;gap:12px;justify-content:center;margin-top:8px"><button class="btn y big" data-ui='{"k":"meOk"}'>네, 맞아요 ▶</button><button class="btn w" data-ui='{"k":"meNo"}'>제 학번이 아니에요</button></div></div>`, L.kind === 'class' ? 'joinClass' : 'free');
}
H.meOk = () => guard(() => afterProfile());
H.meNo = () => (L.kind === 'class' ? joinClass(L.code || '') : free());

function profile() {
  const d = L.draft;
  screen('✨ 나의 캐릭터 만들기', `<div class="prof">
    <div class="panel pv">${K.A.fullSvg(gameLook(d.look), { age: 'adult', gender: d.gender, mood: 'g' }, 220, 350)}</div>
    <div class="panel form" style="width:560px">
      <label>별명 <span class="muted">(2~6글자 · 한 번 정하면 그대로 써요)</span><input id="p-nick" maxlength="6" value="${K.esc(d.name)}" placeholder="별명" autocomplete="off"></label>
      <div><div class="lab">성별</div><div class="seg big"><button class="${d.gender === 'm' ? 'on' : ''}" data-ui='{"k":"pfGen","v":"m"}'>남자</button><button class="${d.gender === 'f' ? 'on' : ''}" data-ui='{"k":"pfGen","v":"f"}'>여자</button></div></div>
      <button class="btn p" data-ui='{"k":"pfEdit"}'>✨ 꾸미기 (머리·피부·옷·아이템)</button>
      <div class="err" id="f-err"></div>
      <button class="btn y big" data-ui='{"k":"pfSave"}'>이걸로 할래요 ▶</button>
    </div></div>`, L.kind === 'class' ? 'joinClass' : 'free');
}
const keepNick = () => { const el = $('#p-nick'); if (el) L.draft.name = el.value; };
H.pfGen = o => { keepNick(); L.draft.gender = o.v; profile(); };
H.pfEdit = () => { keepNick(); K.openEditor(L.draft, profile); };
H.pfSave = () => guard(async () => {
  keepNick();
  const nick = L.draft.name.trim();
  const prob = N.nickProblem(nick);
  if (prob) return err(prob);
  const prof = { nick, gender: L.draft.gender, look: fixLook(L.draft.look), uid: N.uid, t: N.serverTimestamp() };
  try { await N.update(N.R(`students/${L.sid}`), prof); }
  catch { return afterSid(); } // 그사이 같은 학번으로 별명이 생김 → 그 별명 확인
  L.prof = { ...prof, t: Date.now() };
  await afterProfile();
});

async function afterProfile() {
  if (L.kind === 'free') return freeMenu();
  if (L.cls.assign === 'group' && L.group == null) {
    const m = (await N.get(N.R(`classes/${L.cid}/members/${L.sid}`))).val();
    if (m && m.group) L.group = m.group; else return groups();
  }
  await enterClass();
}
function groups() {
  const n = L.cls.groups || 8;
  screen('👥 우리 모둠은?', `<div class="panel form" style="width:900px"><p style="text-align:center;font-size:22px">같이 앉은 모둠 번호를 골라요. 같은 모둠끼리 같은 방에서 게임해요!</p>
    <div class="grid" style="grid-template-columns:repeat(4,1fr)">${Array.from({ length: n }, (_, i) => `<button class="opt" data-ui='${K.J({ k: 'grp', v: i + 1 })}'><div class="ic">${['🍎', '🍊', '🍋', '🍀', '🐳', '🍇', '🌸', '🍫', '⭐', '🎈'][i % 10]}</div><b>${i + 1}모둠</b></button>`).join('')}</div></div>`, null);
}
H.grp = o => guard(async () => {
  L.group = o.v;
  if (L.entered) { await N.update(N.R(`classes/${L.cid}/members/${L.sid}`), { group: o.v }); lobby(); return; }
  await enterClass();
});

async function enterClass() {
  const mRef = N.R(`classes/${L.cid}/members/${L.sid}`);
  const m = (await N.get(mRef)).val();
  const on = (await N.get(N.R(`online/${L.sid}`))).val() || {};
  if (m && m.uid && m.uid !== N.uid && Object.keys(on).some(u => u !== N.uid)) return askTeacher();
  await N.update(mRef, { nick: L.prof.nick, gender: L.prof.gender, look: fixLook(L.prof.look), uid: N.uid, group: L.group ?? (m && m.group) ?? null, t: N.serverTimestamp() });
  save({ kind: 'class', cid: L.cid, sid: L.sid });
  N.presence(L.sid, { cid: L.cid });
  L.entered = true;
  lobby();
}
// 이미 다른 기기에서 들어와 있는 학번 → 선생님이 허락해야 들어감 (친구 학번으로 장난치기 방지)
async function askTeacher() {
  await N.set(N.R(`classes/${L.cid}/req/${L.sid}`), { uid: N.uid, nick: L.prof.nick, t: N.serverTimestamp() });
  screen('✋ 선생님 확인 중', `<div class="panel form" style="width:640px;text-align:center"><div style="font-size:70px">✋</div>
    <p style="font-size:24px">학번 ${K.esc(L.sid)}은(는) 다른 기기에서 이미 들어와 있어요.<br>선생님이 허락하면 바로 들어가요.</p>
    <p class="muted">기기를 바꿨다면 선생님께 말씀드리세요</p></div>`, 'joinClass');
  off();
  L.unsubs.push(N.onValue(N.R(`classes/${L.cid}/members/${L.sid}/uid`), s => { if (s.val() === N.uid) { off(); guard(() => enterClass()); } }));
}

/* ───── 대기실 ───── */
function lobby() {
  off(); stopGame(); L.going = null;
  L.unsubs.push(N.onValue(N.R(`classes/${L.cid}`), s => {
    const c = s.val();
    if (!c || c.closed) { leaveClass('수업이 끝났어요. 수고했어요!'); return; }
    L.cls = c;
    const me = c.members && c.members[L.sid];
    if (!me) { leaveClass('선생님이 명단에서 뺐어요. 다시 들어와 주세요'); return; }
    if (me.uid && me.uid !== N.uid) { leaveClass('다른 기기에서 같은 학번으로 들어왔어요'); return; }
    if (c.notice && c.notice.t !== L.noticeT && N.now() - c.notice.t < 60000) { L.noticeT = c.notice.t; K.toast('📢 ' + c.notice.text); }
    if (me.room) { if (L.going !== me.room) goRoom(me.room); return; }
    renderLobby(c, me);
  }));
}
function renderLobby(c, me) {
  if ($('#ov.on .modal')) return; // 꾸미기 창이 열려 있으면 그대로
  const all = Object.entries(c.members || {}).filter(([, m]) => !m.room);
  const byGroup = c.assign === 'group';
  const list = all.sort((a, b) => (byGroup ? (a[1].group || 99) - (b[1].group || 99) : 0) || (a[1].t || 0) - (b[1].t || 0))
    .map(([sid, m]) => `<div class="mate ${sid === L.sid ? 'me' : ''}">${face(m.look, m.gender, 54)}<b>${K.esc(m.nick)}</b>${byGroup && m.group ? `<small>${m.group}모둠</small>` : ''}</div>`).join('');
  screen(`🏠 대기실 · ${K.esc(c.title || '')}`, `<div class="lob">
    <div class="panel mecard">${K.A.fullSvg(gameLook(me.look), { age: 'adult', gender: me.gender, mood: 'g' }, 170, 270)}
      <b class="jua" style="font-size:30px">${K.esc(me.nick)}</b>${byGroup ? `<span class="pill2">${me.group ? me.group + '모둠' : '모둠 없음'}</span>` : ''}
      <button class="btn p sm" data-ui='{"k":"lbEdit"}'>✨ 꾸미기 바꾸기</button>${byGroup ? '<button class="btn w sm" data-ui=\'{"k":"lbGroup"}\'>👥 모둠 바꾸기</button>' : ''}</div>
    <div class="panel waitbox"><div class="waitmsg">⏳ 선생님이 시작할 때까지 기다려요${c.paused ? ' (잠시 멈춤)' : ''}</div>
      <div class="muted" style="margin:4px 0 10px">${C_MODE(c.mode)} · 들어온 친구 ${all.length}명</div>
      <div class="mates">${list}</div></div></div>`, null);
}
const C_MODE = k => (K.C.MODES[k] ? K.C.MODES[k].name : '');
H.lbEdit = () => { const d = { name: L.prof.nick, gender: L.prof.gender, look: fixLook(L.prof.look) }; K.openEditor(d, () => guard(async () => {
  L.prof.look = d.look;
  await N.update(N.R(`students/${L.sid}`), { look: d.look });
  await N.update(N.R(`classes/${L.cid}/members/${L.sid}`), { look: d.look });
})); };
H.lbGroup = () => { off(); groups(); };
function leaveClass(msg) {
  off(); stopGame(); save(null); N && N.stopPresence(); L.entered = false;
  K.showTitle(); if (msg) K.toast(msg);
}
async function goRoom(rid) {
  L.going = rid;
  let room = null;
  for (let i = 0; i < 6; i++) { room = (await N.get(N.R(`rooms/${rid}`))).val(); if (room && room.gid) break; await new Promise(r => setTimeout(r, 700)); }
  if (L.going !== rid) return; // 그사이 다른 방·대기실로 바뀜
  if (!room || !room.gid || room.status === 'end') { L.going = null; return; } // 대기실에 그대로 (값이 바뀌면 다시 옴)
  off();
  N.presence(L.sid, { cid: L.cid, rid });
  await K.playOnline({ N, gid: room.gid, rid, cid: L.cid, sid: L.sid, kind: 'class',
    onRoom: v => { N.presence(L.sid, { cid: L.cid }); if (v) goRoom(v); else lobby(); } });
}

/* ═════════════ 자유 모드 (동아리·쉬는 시간) ═════════════ */
function free() {
  stopGame(); off(); L.kind = 'free';
  screen('🎲 친구와 온라인', `<div class="panel form">
    <p style="font-size:20px;text-align:center">방을 만들어 4자리 방 코드를 알려 주거나, 친구의 방 코드로 들어가요 (1~4명, 빈자리는 COM)</p>
    <label>학번<input id="f-sid" inputmode="numeric" maxlength="10" placeholder="예: 20312" data-enter='{"k":"frGo"}' autocomplete="off"></label>
    <div class="err" id="f-err"></div>
    <button class="btn y big" data-ui='{"k":"frGo"}'>다음 ▶</button></div>`);
  setTimeout(() => $('#f-sid')?.focus(), 50);
}
H.free = () => free();
H.frGo = () => guard(async () => {
  const sidIn = $('#f-sid').value.trim();
  await net();
  const rule = N.sidRule((await N.get(N.R('config/school'))).val());
  if (!rule.parse(sidIn)) return err(`학번을 확인해 주세요 — ${rule.text}`);
  L.sid = sidIn; L.cid = null;
  await afterSid();
});
function freeMenu() {
  save(null);
  N.presence(L.sid, {});
  screen('🎲 친구와 온라인', `<div class="panel form" style="width:760px">
    <div style="display:flex;gap:14px;align-items:center;justify-content:center">${face(L.prof.look, L.prof.gender, 70)}<b class="jua" style="font-size:30px">${K.esc(L.prof.nick)}</b></div>
    <button class="btn y big" data-ui='{"k":"frNew"}'>🏠 방 만들기</button>
    <label>친구 방 코드로 참가<input id="f-code" inputmode="numeric" maxlength="4" placeholder="0000" data-enter='{"k":"frJoin"}' autocomplete="off"></label>
    <div class="err" id="f-err"></div>
    <button class="btn p" data-ui='{"k":"frJoin"}'>🔑 참가하기</button></div>`, 'free');
}
const seatOf = () => ({ nick: L.prof.nick, gender: L.prof.gender, look: fixLook(L.prof.look), t: Date.now() });
H.frNew = () => guard(async () => {
  const rid = N.newId();
  const code = await N.claimCode('fcodes', rid);
  await N.set(N.R(`rooms/${rid}`), { code, host: L.sid, mode: 'careerShort', quiz: true, com: true, status: 'wait', seats: { [L.sid]: seatOf() }, t: N.serverTimestamp() });
  enterFree(rid);
});
H.frJoin = () => guard(async () => {
  const code = ($('#f-code')?.value || '').trim();
  if (!/^\d{4}$/.test(code)) return err('방 코드 4자리를 넣어 주세요');
  const c = (await N.get(N.R(`fcodes/${code}`))).val();
  const room = c && (await N.get(N.R(`rooms/${c.v}`))).val();
  if (!room || room.status === 'closed') return err('방을 찾지 못했어요. 코드를 확인해 주세요');
  const seats = room.seats || {};
  if (!seats[L.sid]) {
    if (room.status !== 'wait') return err('이미 시작한 방이에요');
    if (Object.keys(seats).length >= 4) return err('방이 꽉 찼어요 (4명)');
    await N.set(N.R(`rooms/${c.v}/seats/${L.sid}`), seatOf());
  }
  enterFree(c.v);
});
function enterFree(rid) {
  L.rid = rid;
  save({ kind: 'free', rid, sid: L.sid });
  N.presence(L.sid, { rid });
  freeRoom();
}
function freeRoom() {
  off(); stopGame();
  let online = {};
  const draw = room => {
    const seats = Object.entries(room.seats || {}).sort((a, b) => a[1].t - b[1].t);
    const hostSid = (seats.find(([s]) => s === room.host && N.isOn(online, s)) || seats.find(([s]) => N.isOn(online, s)) || [])[0];
    const amHost = hostSid === L.sid;
    const slots = Array.from({ length: 4 }, (_, i) => { const s = seats[i];
      if (!s) return `<div class="slot empty">${room.com ? K.A.robotFace(80) + '<b>COM' + (i + 1 - seats.length) + '</b>' : '<b>빈자리</b>'}</div>`;
      return `<div class="slot">${face(s[1].look, s[1].gender, 80)}<b>${K.esc(s[1].nick)}${s[0] === hostSid ? ' 👑' : ''}</b>${N.isOn(online, s[0]) ? '' : '<small style="color:#E8505B">연결 끊김</small>'}</div>`; }).join('');
    screen('🎲 친구와 온라인', `<div class="frm">
      <div class="panel codebox"><div class="muted">방 코드</div><div class="code">${K.esc(room.code)}</div><div class="muted">친구에게 알려 주세요</div></div>
      <div class="slots">${slots}</div>
      <div class="panel hostbox">${amHost ? `<div class="lab">모드</div><div class="modes2">${MODE_KEYS.map(k => `<button class="${room.mode === k ? 'on' : ''}" data-ui='${K.J({ k: 'frMode', v: k })}'>${K.C.MODES[k].name}<small>${K.C.MODES[k].desc}</small></button>`).join('')}</div>
          <div style="display:flex;gap:18px;align-items:center;margin-top:10px">
            <label class="chk"><input type="checkbox" ${room.quiz ? 'checked' : ''} data-ui='{"k":"frQuiz"}'> 퀴즈 칸·퀴즈쇼</label>
            <label class="chk"><input type="checkbox" ${room.com ? 'checked' : ''} data-ui='{"k":"frCom"}'> 빈자리 COM 채우기</label>
            <button class="btn y big" style="margin-left:auto" data-ui='{"k":"frStart"}'>▶ 시작!</button></div>`
        : `<div class="waitmsg">⏳ 방장이 시작할 때까지 기다려요</div><div class="muted" style="text-align:center">${K.esc(K.C.MODES[room.mode]?.name || '')} · 퀴즈 ${room.quiz ? '켬' : '끔'}</div>`}</div></div>`, 'frLeave');
  };
  let last = null;
  L.unsubs.push(N.onValue(N.R('online'), s => { online = s.val() || {}; if (last && last.status === 'wait') draw(last); }));
  L.unsubs.push(N.onValue(N.R(`rooms/${L.rid}`), s => {
    const room = s.val();
    if (!room || room.status === 'closed' || !(room.seats && room.seats[L.sid])) { save(null); off(); if (L.prof) freeMenu(); else K.showTitle(); return; }
    last = room;
    if (room.status === 'play' && room.gid) {
      off();
      K.playOnline({ N, gid: room.gid, rid: L.rid, cid: null, sid: L.sid, kind: 'free', onRoom: () => freeRoom() });
      return;
    }
    draw(room);
  }));
}
const roomRef = p => N.R(`rooms/${L.rid}${p ? '/' + p : ''}`);
H.frMode = o => N.update(roomRef(), { mode: o.v });
H.frQuiz = (o, t) => N.update(roomRef(), { quiz: t.checked });
H.frCom = (o, t) => N.update(roomRef(), { com: t.checked });
H.frStart = () => guard(async () => {
  const room = (await N.get(roomRef())).val();
  if (!room || room.status !== 'wait') return;
  const seats = Object.entries(room.seats || {}).sort((a, b) => a[1].t - b[1].t).slice(0, 4);
  const players = seats.map(([sid, s]) => ({ name: s.nick, gender: s.gender, look: gameLook(s.look), sid }));
  let k = 0;
  if (room.com) while (players.length < 4) players.push({ name: `COM${++k}`, gender: players.length % 2 ? 'f' : 'm', look: gameLook(null), isCom: true });
  const settings = { quiz: !!room.quiz, timer: 30, quizTime: 15 };
  const gid = await N.createGame({ mode: room.mode, seed: (Math.random() * 2 ** 31) | 0, settings, players }, { rid: L.rid, round: 1 });
  await N.update(roomRef(), { status: 'play', gid });
});
H.frLeave = () => guard(async () => {
  const room = (await N.get(roomRef())).val();
  await N.set(roomRef(`seats/${L.sid}`), null);
  if (room && room.host === L.sid) { const next = Object.keys(room.seats || {}).find(s => s !== L.sid); await N.update(roomRef(), next ? { host: next } : { status: 'closed' }); }
  save(null); off(); freeMenu();
});

/* ═════════════ 새로고침·창 다시 열기 → 그 자리로 ═════════════ */
async function autoResume() {
  let v = null;
  try { const qi = new URLSearchParams(location.search).get('qa'); v = JSON.parse(qi != null ? sessionStorage.getItem('tlg_on' + qi) : localStorage.getItem('tlg_on')); } catch {}
  if (!v || !v.sid) return false;
  try {
    await net();
    const prof = (await N.get(N.R(`students/${v.sid}`))).val();
    if (!prof) { save(null); return false; }
    L.sid = v.sid; L.prof = prof;
    if (v.kind === 'class') {
      const cls = (await N.get(N.R(`classes/${v.cid}`))).val();
      const m = cls && cls.members && cls.members[v.sid];
      if (!cls || cls.closed || !m || (m.uid && m.uid !== N.uid)) { save(null); return false; }
      Object.assign(L, { kind: 'class', cid: v.cid, cls, group: m.group ?? null, entered: true });
      N.presence(L.sid, { cid: L.cid });
      lobby();
      return true;
    }
    if (v.kind === 'free' && v.rid) {
      const room = (await N.get(N.R(`rooms/${v.rid}`))).val();
      if (!room || room.status === 'closed' || !(room.seats && room.seats[v.sid])) { save(null); return false; }
      L.kind = 'free'; enterFree(v.rid);
      return true;
    }
  } catch (e) { console.error(e); }
  return false;
}
function stopGame() { K && K.leaveOnline(); }
// 처음 화면으로 나갈 때: 듣기 끄기·접속 표시 지우기·저장된 입장 정보 지우기
function stop() { off(); if (N) { N.stopPresence(); save(null); } L.entered = false; }
