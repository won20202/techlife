// 온라인 연결: Firebase 로그인 · 실시간 데이터 · 접속 표시 · 게임 행동 기록
// 게임은 "처음 설정 + 행동 목록"만 서버에 저장하고, 기기마다 같은 엔진으로 다시 계산한다(결과가 모두 같음).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, signInAnonymously, setPersistence, inMemoryPersistence } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getDatabase, ref, get, set, update, remove, push, onValue, onChildAdded, onDisconnect, serverTimestamp, runTransaction, query, orderByChild, equalTo }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { VER } from './data/config.js';

const fb = initializeApp({
  apiKey: 'AIzaSyDsT_unyXQ5BuVzhTyXpku10e2AS9RYQVo',
  authDomain: 'techlife-ocean.firebaseapp.com',
  databaseURL: 'https://techlife-ocean-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'techlife-ocean',
  storageBucket: 'techlife-ocean.firebasestorage.app',
  messagingSenderId: '942884130338',
  appId: '1:942884130338:web:e7579205a104e30b77047b',
});
const auth = getAuth(fb);
const db = getDatabase(fb);
export { get, set, update, remove, onValue, onChildAdded, serverTimestamp, runTransaction, query, orderByChild, equalTo, VER };
export const R = p => ref(db, p);
// ?qa=번호 : 테스트용 — 한 창에 여러 학생(로그인은 메모리에만, 내 정보는 번호별로 따로)
const QI = new URLSearchParams(location.search).get('qa');
export const QA = QI != null;
export const store = QA ? { getItem: k => sessionStorage.getItem(k + QI), setItem: (k, v) => sessionStorage.setItem(k + QI, v), removeItem: k => sessionStorage.removeItem(k + QI) } : localStorage;
export const newId = () => push(R('ids')).key; // 쓰지 않고 고유 번호만 만듦

let uidP = null;
export let uid = null;
export function login() {
  return uidP ||= (async () => {
    if (QA) await setPersistence(auth, inMemoryPersistence);
    uid = (await signInAnonymously(auth)).user.uid; // 이미 로그인돼 있으면 같은 사람 그대로
    return uid;
  })();
}

/* ───── 연결 상태 · 서버 시계 ───── */
export let connected = false;
let offset = 0;
const connWatch = new Set();
onValue(R('.info/connected'), s => { connected = !!s.val(); connWatch.forEach(f => f(connected)); });
onValue(R('.info/serverTimeOffset'), s => { offset = s.val() || 0; });
export const now = () => Date.now() + offset;
export function onConn(f) { connWatch.add(f); return () => connWatch.delete(f); }

/* ───── 접속 표시: online/학번/로그인번호 (창을 닫거나 끊기면 서버가 자동으로 지움) ───── */
let pres = null;
export function presence(sid, info) {
  stopPresence();
  const me = R(`online/${sid}/${uid}`);
  const put = () => { onDisconnect(me).remove(); set(me, { ...info, t: serverTimestamp() }).catch(() => {}); };
  pres = { me, off: onConn(c => { if (c) put(); }) };
  if (connected) put();
}
export function stopPresence() {
  if (!pres) return;
  pres.off(); remove(pres.me).catch(() => {}); pres = null;
}
export const isOn = (online, sid) => !!(online && sid && online[sid] && Object.keys(online[sid]).length);
// 그 방 화면에 들어와 있는가 (대기실로 나간 학생은 방에서는 '자리 비움')
export const isIn = (online, sid, rid) => !!(online && sid && online[sid] && Object.values(online[sid]).some(v => v && v.rid === rid));

/* ───── 교사 인증: 비밀번호는 아무도 읽을 수 없음. adminAuth/내번호 에 써 보고, 맞을 때만 규칙이 허락 ───── */
export async function teacherLogin(pw) {
  await login();
  try { await set(R(`adminAuth/${uid}`), pw); return true; } catch { return false; }
}
export async function teacherSetup(pw) { // 처음 한 번: 비밀번호가 아직 없을 때만 됨
  await login();
  await set(R('admin/pw'), pw);
  await set(R(`adminAuth/${uid}`), pw);
  await set(R('config/hasPw'), true);
}
export async function isTeacherNow() { // 이 기기가 선생님으로 로그인돼 있나 (선생님만 읽을 수 있는 곳을 읽어 봄)
  try { await get(R('results/__check')); return true; } catch { return false; }
}
export async function teacherChangePw(pw) {
  await set(R('admin/pw'), pw);
  await set(R(`adminAuth/${uid}`), pw);
}

/* ───── 게임 만들기 · 행동 기록 ───── */
export async function createGame(opts, extra = {}) {
  const gid = newId();
  await set(R(`acts/${gid}/meta`), { opts: clean(opts), ver: VER, t: serverTimestamp(), ...extra });
  return gid;
}
export const clean = o => JSON.parse(JSON.stringify(o)); // undefined 없애기 (Firebase는 undefined를 못 받음)
// n번째 자리에 행동 쓰기 — 이미 누가 썼으면 실패(먼저 쓴 사람이 이김) → false
// 그냥 set으로 쓰면 서버가 거절해도 내 화면에는 잠깐 반영돼 기기끼리 어긋남 → 서버가 확정한 뒤에만 반영(applyLocally: false)
export async function putAct(gid, n, a) {
  const v = clean(a);
  try { return (await runTransaction(R(`acts/${gid}/a/${n}`), cur => (cur === null ? v : undefined), { applyLocally: false })).committed; }
  catch { return false; }
}

/* ───── 4자리 코드 (수업·자유 방) ───── */
export async function claimCode(path, value) {
  for (let i = 0; i < 30; i++) {
    const code = String(1000 + Math.floor(Math.random() * 9000));
    const r = await runTransaction(R(`${path}/${code}`), cur => (cur == null || (cur.t && cur.t < Date.now() - 12 * 3600e3)) ? { v: value, t: Date.now() } : undefined);
    if (r.committed) return code;
  }
  throw new Error('코드를 만들지 못했어요');
}

/* ───── 학번 · 별명 ───── */
export const TEST_SID = '00000'; // 선생님 시험용 학번: 학교 학번 형식·수업 반과 상관없이 들어감 (선생님 비밀번호가 있어야 함)
export function sidRule(school) {
  const f = (school && school.fmt) || { g: 1, c: 2, n: 2 };
  if (f.free) return { len: 0, text: '번호', parse: s => s === TEST_SID ? { test: true } : /^\d{1,10}$/.test(s) ? { g: null, c: null, n: +s } : null };
  const len = f.g + f.c + f.n;
  return {
    len, text: `${len}자리 학번 (예: ${'2'.padStart(f.g, '0')}${'3'.padStart(f.c, '0')}${'12'.padStart(f.n, '0')} = 2학년 3반 12번)`,
    parse: s => {
      if (s === TEST_SID) return { test: true };
      if (!new RegExp(`^\\d{${len}}$`).test(s)) return null;
      const g = +s.slice(0, f.g), c = +s.slice(f.g, f.g + f.c), n = +s.slice(f.g + f.c);
      return g >= 1 && c >= 1 && n >= 1 ? { g, c, n } : null;
    },
  };
}
// 별명 거르기: 욕설·비하 표현·COM 흉내 (띄어쓰기·기호를 빼고도 검사)
const BAD = ['시발', '씨발', '씨바', '시바', '씨빨', '시벌', '쓰발', 'ㅅㅂ', 'ㅆㅂ', 'ㅅ ㅂ', '병신', '븅신', '빙신', 'ㅂㅅ', '존나', '졸라', 'ㅈㄴ', '좆', '개새', '개색', '개세', '새끼', '쌔끼', '섹스', '야동', '미친', '미칀', 'ㅁㅊ', '지랄', 'ㅈㄹ', '닥쳐', '꺼져', '엿먹', '애미', '애비', '느금', '니미', '니애', '엠창', '앰창', '등신', '찐따', '장애인', '틀딱', '한남', '김치녀', '창녀', '걸레', '보지', '자지', '고자', '똥꼬', '변태', '살인', '자살', 'tlqkf', 'qudtls', 'fuck', 'shit', 'bitch', 'sex', 'porn', 'dick', 'pussy', 'nigg', 'stfu', 'wtf'];
export function nickProblem(nick) {
  const s = String(nick || '').trim();
  if (s.length < 2) return '별명은 2글자 이상이에요';
  if (s.length > 6) return '별명은 6글자까지예요';
  if (/^com\s*\d*$/i.test(s) || /^컴\d*$/.test(s)) return 'COM은 컴퓨터 이름이라 쓸 수 없어요';
  const flat = s.toLowerCase().replace(/[\s.\-_~!@#$%^&*()+=,'"`|\\/<>?;:[\]{}0-9]/g, '');
  if (BAD.some(w => flat.includes(w.replace(/\s/g, '')))) return '친구가 기분 나쁠 수 있는 말은 별명으로 쓸 수 없어요';
  return '';
}
