// 온라인 입장 화면
// 수업 모드: 수업 코드(QR이면 자동) → 별명·성별·꾸미기 → 모둠 → 대기실 → 선생님이 방 배정·시작
//   학번·이름은 받지 않음 — 별명이 곧 이 수업 안의 자리(같은 별명은 한 명만), 새로고침은 이 기기가 기억, 기기를 바꾸면 선생님 허락
//   수업 시간에만: 선생님이 연 수업의 코드로만 들어옴(오늘 연 수업만), '수업 닫기'를 누르면 모두 나가고 그 코드는 끝
//   🚪 퇴장(분탕 학생): 선생님이 내보낸 기기는 그 수업에 다시 못 들어옴 (선생님이 되돌릴 수 있음)
let K = null; // ui.js가 넘겨주는 화면 도구
let N = null; // net.js (처음 쓸 때 불러옴 — 혼자 하기는 인터넷 없이도 되게)
const L = { sid: null, prof: null, cid: null, cls: null, rid: null, group: null, unsubs: [], draft: null, kind: null };
const off = () => { L.unsubs.forEach(f => { try { f(); } catch {} }); L.unsubs = []; };
const $ = s => document.querySelector(s);
const NEW_LOOK = () => ({ skin: 0, hair: 0, hairColor: 0, outfit: 9, item: 'none' });

export function install(k) {
  K = k;
  Object.assign(K.UI, H);
  document.addEventListener('keydown', e => { // 입력칸에서 Enter = 다음
    if (e.key !== 'Enter' || !e.target.matches('input[data-enter]')) return;
    const t = JSON.parse(e.target.dataset.enter); H[t.k] && H[t.k](t);
  });
  return { joinClass, autoResume, stop, redraw: () => L.lastLobby && renderLobby(...L.lastLobby) };
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
  K.stage.innerHTML = `<div class="screen lobby"><div class="lhead"><div class="title-big">${title}</div><div class="lbtns">${K.snd.ctlHtml()}${back ? `<button class="btn w sm" data-back data-ui='${K.J({ k: back })}'>← ${back === 'title' ? '처음으로' : back === 'lbLeave' ? '나가기' : '뒤로'}</button>` : ''}</div></div>${body}</div>`;
  K.snd.bgm('title');
}
const face = (look, gender, size = 60) => K.A.faceSvg(fixLook(look), gender || 'm', 'adult', size);

/* ═════════════ 수업 모드 ═════════════ */
function joinClass(code = '', sid = '', auto = false) {
  stopGame(); off(); L.kind = 'class'; L.testIn = sid;
  screen('🏫 수업 참가', `<div class="panel form">
    <label>수업 코드 <span class="muted">(선생님 화면·TV의 4자리 숫자)</span><input id="f-code" inputmode="numeric" maxlength="4" value="${K.esc(code)}" placeholder="0000" data-enter='{"k":"jcGo"}' autocomplete="off"></label>
    <div class="err" id="f-err"></div>
    <button class="btn y big" data-ui='{"k":"jcGo"}'>다음 ▶</button>
    <p class="muted" style="font-size:15px;text-align:center">이름·학번은 받지 않아요. 내가 정한 별명으로 들어가요.</p></div>`);
  setTimeout(() => $('#f-code')?.focus(), 50);
  if (auto && code) setTimeout(() => H.jcGo(), 80); // QR·선생님 화면 🧪로 열면 코드 확인 없이 바로 다음으로
}
const H = {};
H.joinClass = () => { const q = new URLSearchParams(location.search); joinClass(q.get('c') || '', q.get('sid') || '', true); };
H.jcBack = () => joinClass(L.code || '');
const BANNED = '🚪 선생님이 퇴장시켜서 이 수업에는 들어갈 수 없어요';
const today = c => !c.created || new Date(c.created).toDateString() === new Date(N.now()).toDateString(); // 수업 코드는 연 날에만 (닫기를 잊어도 다음 날엔 못 들어옴)
H.jcGo = () => guard(async () => {
  const code = $('#f-code').value.trim();
  err('');
  if (!/^\d{4}$/.test(code)) return err('수업 코드 4자리를 넣어 주세요');
  await net();
  const c = (await N.get(N.R(`codes/${code}`))).val();
  const cls = c && (await N.get(N.R(`classes/${c.v}`))).val();
  if (!cls || cls.closed) return err('수업 코드를 다시 확인해 주세요 (끝난 수업일 수도 있어요)');
  if (L.testIn !== N.TEST_SID && !today(cls)) return err('오늘 연 수업이 아니에요. 선생님께 오늘 수업 코드를 받아 주세요');
  if (cls.ban && cls.ban[N.uid]) return err(BANNED);
  Object.assign(L, { cid: c.v, cls, code, group: null, sid: null, prof: null });
  if (L.testIn === N.TEST_SID) return testGate(); // 선생님 화면 🧪
  newProfile();
});
// 선생님 시험용 00000: 선생님 화면에 로그인한 기기면 바로, 아니면 선생님 비밀번호를 확인
async function testGate() {
  const go = () => { L.sid = N.TEST_SID; return testEnter(); };
  if (await N.isTeacherNow()) return go();
  L.testGo = go;
  screen('🧪 선생님 시험용', `<div class="panel form" style="width:560px">
    <p style="font-size:20px">${N.TEST_SID}은 선생님만 쓰는 시험용이에요.<br>선생님 비밀번호를 넣어 주세요.</p>
    <input type="password" id="f-tpw" autocomplete="current-password" data-enter='{"k":"tpwGo"}'>
    <div class="err" id="f-err"></div>
    <button class="btn y big" data-ui='{"k":"tpwGo"}'>확인 ▶</button></div>`, 'title');
  setTimeout(() => $('#f-tpw')?.focus(), 50);
}
H.tpwGo = () => guard(async () => {
  const pw = $('#f-tpw').value; err('');
  if (!pw) return err('비밀번호를 넣어 주세요');
  if (!(await N.teacherLogin(pw))) return err('비밀번호가 달라요');
  await N.remove(N.R(`adminAuth/${N.uid}`)); // 확인만 하고 이 기기를 선생님 기기로 남기지 않음 (학생 기기일 수도 있어서)
  const go = L.testGo; L.testGo = null; if (go) await go();
});

// 새 캐릭터: 이 기기에서 마지막에 고른 성별·꾸미기로 시작 (별명은 매번 새로 — 크롬북을 여러 학생이 같이 쓸 수 있어서)
function newProfile() {
  let last = null; try { last = JSON.parse(N.store.getItem('tlg_look')); } catch {}
  L.draft = { name: '', gender: last && last.gender === 'f' ? 'f' : 'm', look: (last && last.look) || NEW_LOOK() };
  profile();
}
function profile() {
  const d = L.draft;
  screen('✨ 나의 캐릭터 만들기', `<div class="prof">
    <div class="panel pv">${K.A.fullSvg(gameLook(d.look), { age: 'adult', gender: d.gender, mood: 'g' }, 220, 350)}</div>
    <div class="panel form" style="width:560px">
      <label>별명 <span class="muted">(2~6글자 · 진짜 이름·학번은 쓰지 않아요)</span><span class="nickrow"><input id="p-nick" maxlength="6" value="${K.esc(d.name)}" placeholder="별명" autocomplete="off" data-enter='{"k":"pfSave"}'><button class="btn w" data-ui='{"k":"pfRand"}'>🎲 추천</button></span></label>
      <div><div class="lab">성별</div><div class="seg big"><button class="${d.gender === 'm' ? 'on' : ''}" data-ui='{"k":"pfGen","v":"m"}'>남자</button><button class="${d.gender === 'f' ? 'on' : ''}" data-ui='{"k":"pfGen","v":"f"}'>여자</button></div></div>
      <button class="btn p" data-ui='{"k":"pfEdit"}'>✨ 꾸미기 (머리·피부·옷·아이템)</button>
      <div class="err" id="f-err"></div>
      <button class="btn y big" data-ui='{"k":"pfSave"}'>이걸로 할래요 ▶</button>
    </div></div>`, 'jcBack');
}
const keepNick = () => { const el = $('#p-nick'); if (el) L.draft.name = el.value; };
H.pfGen = o => { keepNick(); L.draft.gender = o.v; profile(); };
const outfitSets = async () => { try { return Object.values((await N.get(N.R('config/outfitSets'))).val() || {}); } catch { return []; } }; // 선생님 옷 세트
H.pfEdit = async () => { keepNick(); K.openEditor(L.draft, profile, await outfitSets()); };
// 🎲 별명 추천 (이 수업에서 아직 안 쓴 것) — 고르기 어려운 학생도 빨리, 진짜 이름 대신
const NICK_A = ['용감한', '반짝', '졸린', '배고픈', '신나는', '씩씩한', '느긋한', '똑똑한', '엉뚱한', '수줍은', '날쌘', '튼튼한', '행복한', '멋진', '귀여운', '기운찬'];
const NICK_B = ['수달', '판다', '고래', '여우', '펭귄', '로봇', '토끼', '공룡', '기린', '사자', '부엉이', '다람쥐', '돌고래', '햄스터', '너구리', '코알라', '고양이', '강아지'];
H.pfRand = () => {
  const used = new Set(Object.values((L.cls && L.cls.members) || {}).map(m => N.nickKey(m.nick)));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  let s = '';
  for (let i = 0; i < 30 && (!s || used.has(N.nickKey(s))); i++) s = pick(NICK_A) + pick(NICK_B);
  L.draft.name = s; const el = $('#p-nick'); if (el) el.value = s;
};
H.pfSave = () => guard(async () => {
  keepNick();
  await net();
  const nick = L.draft.name.trim(), gender = L.draft.gender, look = fixLook(L.draft.look);
  if (nick === N.TEST_SID) return testGate(); // 다른 기기의 선생님: 별명 칸에 00000
  const prob = N.nickProblem(nick);
  if (prob) return err(prob);
  try { N.store.setItem('tlg_look', JSON.stringify({ gender, look })); } catch {}
  // 수업: 별명이 곧 이 수업 안의 자리 이름 → 같은 별명(띄어쓰기·대소문자 무시)은 한 명만 (동시에 눌러도 서버가 한 명만 받음)
  const key = N.nickKey(nick), sid = `${L.cid}_${key}`;
  if ((await N.get(N.R(`classes/${L.cid}/ban/${N.uid}`))).val()) return err(BANNED); // 별명을 바꿔 다시 들어오기 막기
  const ms = (await N.get(N.R(`classes/${L.cid}/members`))).val() || {};
  const dup = Object.entries(ms).find(([s, m]) => s !== sid && m && N.nickKey(m.nick) === key); // 선생님이 바꿔 준 별명과 겹침
  if (dup) return nickTaken(nick, dup[0]);
  const r = await N.runTransaction(N.R(`classes/${L.cid}/members/${sid}`), cur => (cur == null ? { nick, gender, look, uid: N.uid, t: Date.now() } : undefined));
  const m = r.committed ? null : r.snapshot.val();
  if (m && m.uid !== N.uid) return nickTaken(nick, sid);
  if (L.sid && L.sid !== sid) await release(L.sid); // 뒤로 가서 별명을 바꿨으면 먼저 잡아 둔 별명은 놓아줌
  Object.assign(L, { sid, prof: { nick: m ? m.nick : nick, gender, look } });
  if (m) L.group = m.group ?? null;
  await afterProfile();
});
// 이미 이 수업에 있는 별명: 다른 별명 쓰기, 또는 기기를 바꾼 본인이면 선생님 허락을 받고 그 자리로
function nickTaken(nick, sid) {
  L.takeSid = sid;
  screen('🙋 이미 있는 별명이에요', `<div class="panel form" style="width:660px;text-align:center"><div style="font-size:64px">🙋</div>
    <p style="font-size:24px">'${K.esc(nick)}'은(는) 이 수업에 이미 있는 별명이에요.</p>
    <button class="btn y big" data-ui='{"k":"nickRetry"}'>다른 별명 쓰기</button>
    <button class="btn w" data-ui='{"k":"nickMine"}'>제 별명이에요 (기기를 바꿨어요)</button>
    <p class="muted">기기를 바꿨을 때만 눌러요 — 선생님이 허락하면 하던 그대로 이어서 해요</p></div>`, 'jcBack');
}
H.nickRetry = () => profile();
H.nickMine = () => guard(async () => {
  const m = (await N.get(N.R(`classes/${L.cid}/members/${L.takeSid}`))).val();
  if (!m) return profile(); // 그사이 명단에서 빠짐 → 다시 정하기
  if (L.sid && L.sid !== L.takeSid) await release(L.sid);
  Object.assign(L, { sid: L.takeSid, prof: { nick: m.nick, gender: m.gender, look: m.look }, group: m.group ?? null });
  await askTeacher();
});
// 내가 잡아 두고 아직 게임에 안 들어간 별명 놓아주기
async function release(sid) { const ref = N.R(`classes/${L.cid}/members/${sid}`), m = (await N.get(ref)).val(); if (m && m.uid === N.uid && !m.room) await N.remove(ref).catch(() => {}); }

async function afterProfile() {
  if (L.cls.assign === 'group' && L.group == null) {
    const m = (await N.get(N.R(`classes/${L.cid}/members/${L.sid}`))).val();
    if (m && m.group) L.group = m.group; else return groups();
  }
  await enterClass();
}
function groups() {
  const n = L.cls.groups || 8;
  screen('👥 우리 모둠은?', `<div class="panel form" style="width:900px"><p style="text-align:center;font-size:22px">같이 앉은 모둠 번호를 골라요. 같은 모둠끼리 같은 방에서 게임해요!</p>
    <div class="grid" style="grid-template-columns:repeat(4,1fr)">${Array.from({ length: n }, (_, i) => `<button class="opt" data-ui='${K.J({ k: 'grp', v: i + 1 })}'><div class="ic">${['🍎', '🍊', '🍋', '🍀', '🐳', '🍇', '🌸', '🍫', '⭐', '🎈'][i % 10]}</div><b>${i + 1}모둠</b></button>`).join('')}</div></div>`, 'lbBackMe');
}
H.grp = o => guard(async () => {
  L.group = o.v;
  if (L.entered) { await N.update(N.R(`classes/${L.cid}/members/${L.sid}`), { group: o.v }); lobby(); return; }
  await enterClass();
});

async function enterClass() {
  const mRef = N.R(`classes/${L.cid}/members/${L.sid}`);
  const m = (await N.get(mRef)).val();
  // 다른 기기가 쓰던 별명이면 선생님이 허락해야 (기기를 바꾼 본인만 — 같은 별명으로 친구 자리에 들어가기 막기, 시험용 00000은 그냥 옮김)
  if (L.sid !== N.TEST_SID && m && m.uid && m.uid !== N.uid) return askTeacher();
  await N.update(mRef, { nick: (m && m.nick) || L.prof.nick, gender: L.prof.gender, look: fixLook(L.prof.look), uid: N.uid, group: L.group ?? (m && m.group) ?? null, t: N.serverTimestamp() });
  save({ kind: 'class', cid: L.cid, sid: L.sid });
  N.presence(L.sid, { cid: L.cid });
  L.entered = true;
  lobby();
}
// 다른 기기가 쓰던 별명 → 선생님이 허락하면 이 기기로 이어서 (거절하면 다시 별명 정하기)
async function askTeacher() {
  await N.set(N.R(`classes/${L.cid}/req/${L.sid}`), { uid: N.uid, nick: L.prof.nick, t: N.serverTimestamp() });
  screen('✋ 선생님 확인 중', `<div class="panel form" style="width:640px;text-align:center"><div style="font-size:70px">✋</div>
    <p style="font-size:24px">'${K.esc(L.prof.nick)}'은(는) 다른 기기에서 쓰던 별명이에요.<br>선생님이 허락하면 바로 이어서 해요.</p>
    <p class="muted">기기를 바꿨다면 선생님께 말씀드리세요</p></div>`, 'jcBack');
  off();
  const uidRef = N.R(`classes/${L.cid}/members/${L.sid}/uid`);
  L.unsubs.push(N.onValue(uidRef, s => { if (s.val() === N.uid) { off(); guard(() => enterClass()); } }));
  L.unsubs.push(N.onValue(N.R(`classes/${L.cid}/req/${L.sid}`), async s => {
    if (s.exists() || (await N.get(uidRef)).val() === N.uid) return;
    off(); L.sid = null;
    if (L.draft) profile(); else newProfile();
    err('선생님이 허락하지 않았어요. 다른 별명을 써 주세요');
  }));
}

/* ───── 대기실 ───── */
function lobby() {
  off(); stopGame(); L.going = null;
  screen('🏠 대기실', '<div class="panel form" style="text-align:center"><div class="waitmsg">대기실로 가는 중…</div></div>', null); // 게임 화면이 남지 않게
  L.unsubs.push(N.onValue(N.R(`classes/${L.cid}`), s => {
    const c = s.val();
    if (!c || c.closed) { leaveClass('수업이 끝났어요. 수고했어요!'); return; }
    L.cls = c;
    const me = c.members && c.members[L.sid];
    if (!me) { leaveClass(c.ban && c.ban[N.uid] ? '🚪 선생님이 퇴장시켰어요' : '선생님이 명단에서 뺐어요. 다시 들어와 주세요'); return; }
    if (me.uid && me.uid !== N.uid) { leaveClass('다른 기기에서 같은 별명으로 이어서 하고 있어요'); return; }
    if (c.notice && c.notice.t !== L.noticeT && N.now() - c.notice.t < 60000) { L.noticeT = c.notice.t; K.toast('📢 ' + c.notice.text); }
    if (me.room) { if (L.going !== me.room) goRoom(me.room); return; }
    renderLobby(c, me);
  }));
}
function renderLobby(c, me) {
  K.snd.setPolicy(c.sound || 'all'); // 선생님이 정한 소리 (효과음+배경음 / 효과음만 / 끄기)
  L.lastLobby = [c, me];
  if ($('#ov.on .editor, #ov.on .guide')) return; // 꾸미기·게임 방법 창이 열려 있으면 그대로 (닫을 때 다시 그림)
  const all = Object.entries(c.members || {}).filter(([, m]) => !m.room);
  const byGroup = c.assign === 'group';
  const list = all.sort((a, b) => (byGroup ? (a[1].group || 99) - (b[1].group || 99) : 0) || (a[1].t || 0) - (b[1].t || 0))
    .map(([sid, m]) => `<div class="mate ${sid === L.sid ? 'me' : ''}">${face(m.look, m.gender, 54)}<b>${K.esc(m.nick)}</b>${byGroup && m.group ? `<small>${m.group}모둠</small>` : ''}</div>`).join('');
  screen(`🏠 대기실 · ${K.esc(c.title || '')}`, `<div class="lob">
    <div class="panel mecard">${K.A.fullSvg(gameLook(me.look), { age: 'adult', gender: me.gender, mood: 'g' }, 170, 270)}
      <b class="jua" style="font-size:30px">${K.esc(me.nick)}</b>${byGroup ? `<span class="pill2">${me.group ? me.group + '모둠' : '모둠 없음'}</span>` : ''}
      <button class="btn p sm" data-ui='{"k":"lbEdit"}'>✨ 꾸미기 바꾸기</button><button class="btn w sm" data-ui='{"k":"guide"}'>📖 게임 방법 보기</button>${byGroup ? '<button class="btn w sm" data-ui=\'{"k":"lbGroup"}\'>👥 모둠 바꾸기</button>' : ''}</div>
    <div class="panel waitbox"><div class="waitmsg">⏳ 선생님이 시작할 때까지 기다려요${c.paused ? ' (잠시 멈춤)' : ''}</div>
      <div class="muted" style="margin:4px 0 10px">${C_MODE(c.mode)} · 들어온 친구 ${all.length}명</div>
      ${L.sid === N.TEST_SID ? `<div class="testgo"><button class="btn y" data-ui='{"k":"testStart"}'>🧪 바로 테스트 시작 (COM 3명과)</button><small>학생들과 함께 하려면 선생님 화면에서 방을 나누고 '시작'을 눌러요</small></div>` : ''}
      <div class="mates">${list}</div></div></div>`, 'lbLeave');
}
H.lbLeave = () => leaveClass();
// 선생님 시험용 00000: 별명 정하기·모둠·대기실을 건너뛰고 바로 테스트 게임 (하던 테스트 방이 있으면 그 판으로)
async function testEnter() {
  let prof = (await N.get(N.R(`students/${L.sid}`))).val();
  if (!prof || !prof.nick) { await N.update(N.R(`students/${L.sid}`), { nick: '선생님', gender: 'm', look: NEW_LOOK(), uid: N.uid, t: N.serverTimestamp() }).catch(() => {}); prof = (await N.get(N.R(`students/${L.sid}`))).val() || { nick: '선생님', gender: 'm', look: NEW_LOOK() }; }
  L.prof = prof; L.group = null;
  // 하던 테스트 방: 같은 모드면 이어서, 다른 모드를 골랐거나 끝난 방이면 정리하고 새로 (학생 방에 들어가 있으면 그대로)
  const mRef = N.R(`classes/${L.cid}/members/${L.sid}`), m0 = (await N.get(mRef)).val(), tm = new URLSearchParams(location.search).get('tmode');
  if (m0 && m0.room) {
    const r = (await N.get(N.R(`rooms/${m0.room}`))).val();
    if (!r || r.status !== 'play' || (r.test && tm && r.mode !== tm)) {
      if (r && r.test && r.status === 'play') await N.update(N.R(`rooms/${m0.room}`), { status: 'end' }).catch(() => {});
      await N.update(mRef, { room: null }).catch(() => {});
    }
  }
  await enterClass(); // 수업 명단에 들어감 → 대기실이 방을 지켜보다가 방이 생기면 바로 게임으로
  const m = (await N.get(mRef)).val();
  if (!(m && m.room)) await H.testStart();
}
H.lbBackMe = () => { off(); if (L.entered) lobby(); else profile(); }; // 모둠 고르기 ← 뒤로: 대기실에서 왔으면 대기실, 처음 들어오는 중이면 캐릭터 만들기
// 선생님 시험용 00000: 선생님이 '시작'을 누르지 않아도 COM 3명과 바로 시작 (학생 방과 따로, 선생님 화면엔 '🧪 테스트 방')
H.testStart = () => guard(async () => {
  const c = L.cls, me = (await N.get(N.R(`classes/${L.cid}/members/${L.sid}`))).val(); if (!c || !me) return;
  const tm = new URLSearchParams(location.search).get('tmode'), mode = K.C.MODES[tm] ? tm : c.mode; // 선생님 화면에서 고른 모드 (주소에 남아 새로고침해도 같음, 없으면 이 수업 모드)
  const cfg = (await N.get(N.R('config'))).val() || {}, g = { quiz: true, units: [], timer: 30, quizTime: 15, sound: 'all', ...(cfg.game || {}) };
  const settings = { quiz: g.quiz, units: g.units || [], quizList: K.E.quizPool(cfg), timer: g.timer, quizTime: g.quizTime, reflect: g.reflect, sound: g.sound || 'all' };
  const players = [{ name: me.nick, gender: me.gender, look: gameLook(me.look), sid: L.sid }];
  while (players.length < 4) players.push({ name: `COM${players.length}`, gender: players.length % 2 ? 'f' : 'm', look: gameLook(null), isCom: true });
  const rid = N.newId(), round = c.round || 0;
  const gid = await N.createGame({ mode, seed: (Math.random() * 2 ** 31) | 0, settings, players }, { cid: L.cid, rid, round, room: 0, test: true });
  await N.set(N.R(`rooms/${rid}`), { cid: L.cid, no: 0, test: true, gid, mode, status: 'play', round, t: N.serverTimestamp() });
  await N.update(N.R(`classes/${L.cid}/members/${L.sid}`), { room: rid }); // 대기실이 이걸 보고 바로 게임으로
});
const C_MODE = k => (K.C.MODES[k] ? K.C.MODES[k].name : '');
H.lbEdit = async () => { const d = { name: L.prof.nick, gender: L.prof.gender, look: fixLook(L.prof.look) }, sets = await outfitSets(); K.openEditor(d, () => guard(async () => {
  L.prof.look = d.look;
  try { N.store.setItem('tlg_look', JSON.stringify({ gender: L.prof.gender, look: d.look })); } catch {}
  if (L.sid === N.TEST_SID) await N.update(N.R(`students/${L.sid}`), { look: d.look }); // 선생님 시험용은 다음 수업에도 그대로
  await N.update(N.R(`classes/${L.cid}/members/${L.sid}`), { look: d.look });
}), sets); };
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

/* ═════════════ 새로고침·창 다시 열기 → 그 자리로 ═════════════ */
async function autoResume() {
  let v = null;
  try { const qi = new URLSearchParams(location.search).get('qa'); v = JSON.parse(qi != null ? sessionStorage.getItem('tlg_on' + qi) : localStorage.getItem('tlg_on')); } catch {}
  if (!v || !v.sid) return false;
  try {
    await net();
    if (v.kind === 'class') {
      const cls = (await N.get(N.R(`classes/${v.cid}`))).val();
      const m = cls && cls.members && cls.members[v.sid], qc = new URLSearchParams(location.search).get('c');
      if (!cls || cls.closed || !m || !today(cls) || (qc && qc !== cls.code)) { save(null); return false; } // 끝난 수업 · 명단에서 빠짐 · 지난 수업 · QR로 다른 수업에 들어옴
      Object.assign(L, { kind: 'class', sid: v.sid, prof: { nick: m.nick, gender: m.gender, look: m.look }, cid: v.cid, cls, code: cls.code, group: m.group ?? null });
      await enterClass(); // 같은 기기면 바로 대기실·방으로, 로그인이 바뀌었으면 선생님 허락을 거쳐서
      return true;
    }
  } catch (e) { console.error(e); }
  return false;
}
function stopGame() { K && K.leaveOnline(); }
// 처음 화면으로 나갈 때: 듣기 끄기·접속 표시 지우기·저장된 입장 정보 지우기
function stop() { off(); if (N) { N.stopPresence(); save(null); } L.entered = false; }
