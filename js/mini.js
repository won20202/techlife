// 🎮 미니게임 (화면): 연타 · 타이밍 · 순서 기억 · 골라 잡기 → 점수(0~100)를 돌려줌
// lv(0~6, 관련 능력치 등급)가 높을수록 쉬워짐. 마우스·터치·키보드(스페이스) 모두 됨.
// 점수만 게임에 보내므로(엔진이 70점↑ 대운 · 35점↑ 보통) 어느 기기에서든 결과가 같음
import { miniTier } from './engine.js';

export const MINI = {
  tap: { name: '연타', icon: '👆', help: '5초 동안 버튼을 최대한 빨리 눌러요! (스페이스 키도 돼요)' },
  timing: { name: '타이밍', icon: '🎯', help: '바늘이 초록 칸에 왔을 때 눌러요! 세 번 해요' },
  memory: { name: '순서 기억', icon: '🧠', help: '불이 켜지는 순서를 잘 보고, 똑같이 눌러요!' },
  catch: { name: '골라 잡기', icon: '🎈', help: '나오는 것 중에 맞는 것만 빨리 눌러요! 틀린 걸 누르면 감점' },
};
const TIER = { g: ['🌟', '대운!'], n: ['🙂', '보통'], b: ['💥', '꽝…'] };
const wait = ms => new Promise(r => setTimeout(r, ms));
const now = () => performance.now();

// el 안에 게임을 그리고, 끝나면 점수로 resolve. opt: { title, lv, icons, hint, fast }
export async function playMini(el, game, opt = {}) {
  const lv = Math.max(0, Math.min(6, opt.lv | 0)), info = MINI[game] || MINI.tap;
  el.innerHTML = `<div class="mg mg-${game}">
    <div class="mg-help">${info.icon} ${esc(opt.hint || info.help)}${lv >= 3 ? ` <span class="mg-easy">능력치 덕분에 조금 쉬워요</span>` : ''}</div>
    <div class="mg-body"></div><div class="mg-foot"></div></div>`;
  const body = el.querySelector('.mg-body'), foot = el.querySelector('.mg-foot');
  let skip = null;
  if (opt.fast) { // 선생님 빨리 감기: 바로 점수 내기
    foot.innerHTML = '<button class="btn w sm mg-skip">⏩ 건너뛰기 (자동 점수)</button>';
    skip = new Promise(r => { foot.querySelector('.mg-skip').onclick = () => r(40 + Math.floor(Math.random() * 50)); });
  }
  await countdown(body);
  const run = { tap, timing, memory, catch: catchGame }[game] || tap;
  const score = Math.max(0, Math.min(100, Math.round(await (skip ? Promise.race([run(body, lv, opt), skip]) : run(body, lv, opt)))));
  foot.innerHTML = '';
  const [ic, tx] = TIER[miniTier(score)];
  body.innerHTML = `<div class="mg-score ${miniTier(score)}"><b>${score}점</b><span>${ic} ${tx}</span></div>`;
  await wait(1300);
  return score;
}
function esc(s) { return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
async function countdown(body) {
  for (const n of ['3', '2', '1', '시작!']) { body.innerHTML = `<div class="mg-count">${n}</div>`; await wait(n === '시작!' ? 450 : 600); }
}
// 누르기: 버튼 클릭(터치) + 스페이스/엔터 키 — 끝나면 지움
function onPress(target, f) {
  const down = e => { e.preventDefault(); f(e); };
  const key = e => { if ((e.code === 'Space' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); f(e); } };
  target.addEventListener('pointerdown', down);
  document.addEventListener('keydown', key);
  return () => { target.removeEventListener('pointerdown', down); document.removeEventListener('keydown', key); };
}

/* 👆 연타: 5초 동안 누른 수 ÷ 목표(능력치가 높으면 목표가 낮음) */
function tap(body, lv, opt) {
  const goal = Math.round(40 - lv * 1.7), dur = 5000;
  body.innerHTML = `<div class="mg-tap"><div class="mg-bar"><i></i></div><button class="mg-big">${esc(typeof opt.icons === 'string' ? opt.icons : '👆')}<small>눌러!</small></button>
    <div class="mg-num"><b>0</b> / ${goal}번</div><div class="mg-time"><i></i></div></div>`;
  const btn = body.querySelector('.mg-big'), num = body.querySelector('.mg-num b'), bar = body.querySelector('.mg-bar i'), tb = body.querySelector('.mg-time i');
  let n = 0;
  return new Promise(res => {
    const off = onPress(btn, () => { n++; num.textContent = n; bar.style.width = Math.min(100, n / goal * 100) + '%'; btn.classList.remove('hit'); void btn.offsetWidth; btn.classList.add('hit'); });
    const t0 = now(); let live = true;
    const tick = () => { if (!live) return; tb.style.width = Math.max(0, dur - (now() - t0)) / dur * 100 + '%'; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    setTimeout(() => { live = false; off(); res(n / goal * 100); }, dur);
  });
}

/* 🎯 타이밍: 왔다 갔다 하는 바늘을 초록 칸에서 멈추기 × 3 (갈수록 빨라짐) */
function timing(body, lv, opt) {
  const width = 14 + lv * 1.5; // 초록 칸 너비(%)
  body.innerHTML = `<div class="mg-timing"><div class="mg-round"></div><div class="mg-track"><div class="mg-zone"><div class="mg-perfect"></div></div><div class="mg-needle"></div></div>
    <button class="mg-big wide">${esc(typeof opt.icons === 'string' ? opt.icons : '🎯')}<small>멈춰!</small></button><div class="mg-rlist"></div></div>`;
  const zone = body.querySelector('.mg-zone'), needle = body.querySelector('.mg-needle'), round = body.querySelector('.mg-round'), list = body.querySelector('.mg-rlist'), btn = body.querySelector('.mg-big');
  const scores = [];
  return new Promise(res => {
    let r = 0, center = 50, t0 = 0, period = 1200, stopped = false, raf = 0;
    const start = () => {
      center = 22 + Math.random() * 56; period = 1250 - r * 180; stopped = false;
      zone.style.left = center - width / 2 + '%'; zone.style.width = width + '%';
      round.textContent = `${r + 1} / 3`; t0 = now(); raf = requestAnimationFrame(move);
    };
    const pos = () => { const ph = ((now() - t0) % (period * 2)) / period; return (ph < 1 ? ph : 2 - ph) * 100; };
    const move = () => { if (stopped) return; needle.style.left = pos() + '%'; raf = requestAnimationFrame(move); };
    const off = onPress(btn, async () => {
      if (stopped || !t0) return;
      stopped = true; cancelAnimationFrame(raf);
      const x = pos(), d = Math.abs(x - center), half = width / 2;
      needle.style.left = x + '%';
      const sc = d <= half ? 100 - (d / half) * 40 : d <= half * 2 ? 30 - ((d - half) / half) * 30 : 0;
      scores.push(sc);
      list.insertAdjacentHTML('beforeend', `<span class="${sc >= 90 ? 'p' : sc >= 60 ? 'g' : sc > 0 ? 'n' : 'b'}">${sc >= 90 ? '완벽!' : sc >= 60 ? '좋아요' : sc > 0 ? '아깝다' : '놓쳤어요'}</span>`);
      await wait(650);
      if (++r < 3) start(); else { off(); res(scores.reduce((a, b) => a + b, 0) / 3); }
    });
    start();
  });
}

/* 🧠 순서 기억: 불 켜진 순서대로 누르기 — 3개 → 4개 → 5개 (능력치가 높으면 4개까지) */
function memory(body, lv, opt) {
  const icons = (Array.isArray(opt.icons) && opt.icons.length >= 4 ? opt.icons : ['🔴', '🟡', '🔵', '🟢']).slice(0, 4);
  const lens = lv >= 4 ? [3, 4, 4] : [3, 4, 5], pts = [30, 30, 40];
  body.innerHTML = `<div class="mg-memory"><div class="mg-round"></div><div class="mg-pads">${icons.map((ic, i) => `<button class="mg-pad c${i}" data-i="${i}">${esc(ic)}</button>`).join('')}</div><div class="mg-say"></div></div>`;
  const pads = [...body.querySelectorAll('.mg-pad')], say = body.querySelector('.mg-say'), round = body.querySelector('.mg-round');
  const lit = async (i, ms) => { pads[i].classList.add('on'); await wait(ms); pads[i].classList.remove('on'); };
  return new Promise(async res => {
    let total = 0;
    for (let r = 0; r < lens.length; r++) {
      const seq = Array.from({ length: lens[r] }, () => Math.floor(Math.random() * 4));
      round.textContent = `${r + 1} / 3 · ${lens[r]}개`; say.textContent = '👀 잘 보세요!';
      pads.forEach(p => { p.disabled = true; });
      await wait(500);
      for (const i of seq) { await lit(i, 520 - r * 60); await wait(170); }
      say.textContent = '👆 이제 똑같이 눌러요!';
      pads.forEach(p => { p.disabled = false; });
      const got = await new Promise(done => {
        let k = 0; const timer = setTimeout(() => finish(false), 7000);
        const finish = ok => { clearTimeout(timer); pads.forEach(p => { p.onpointerdown = null; }); done({ ok, k }); };
        pads.forEach(p => { p.onpointerdown = e => { e.preventDefault(); const i = +p.dataset.i; lit(i, 180);
          if (i !== seq[k]) { p.classList.add('wrong'); setTimeout(() => p.classList.remove('wrong'), 400); finish(false); return; }
          if (++k >= seq.length) finish(true); }; });
      });
      if (!got.ok) { total += pts[r] * 0.5 * (got.k / lens[r]); say.textContent = '앗, 틀렸어요!'; await wait(600); break; }
      total += pts[r]; say.textContent = '⭕ 맞았어요!'; await wait(450);
    }
    res(total);
  });
}

/* 🎈 골라 잡기: 3×3 구멍에서 튀어나오는 것 중 맞는 것만 누르기 (8초) */
function catchGame(body, lv, opt) {
  const ic = opt.icons && opt.icons.good ? opt.icons : { good: ['🎈'], bad: ['💣'] };
  const dur = 8000, gap = 560 - lv * 15, stay = 980 + lv * 70;
  body.innerHTML = `<div class="mg-catch"><div class="mg-goal">이것만 눌러요 → <b>${ic.good.map(esc).join(' ')}</b> · 누르면 안 돼요 → <b>${ic.bad.map(esc).join(' ')}</b></div>
    <div class="mg-holes">${Array.from({ length: 9 }, (_, i) => `<div class="mg-hole" data-i="${i}"></div>`).join('')}</div><div class="mg-time"><i></i></div><div class="mg-num">맞힘 <b class="hit">0</b> · 실수 <b class="bad">0</b></div></div>`;
  const holes = [...body.querySelectorAll('.mg-hole')], tb = body.querySelector('.mg-time i'), hitN = body.querySelector('.hit'), badN = body.querySelector('.bad');
  let hits = 0, bads = 0, goods = 0;
  return new Promise(res => {
    const t0 = now(); let live = true;
    holes.forEach(h => { h.onpointerdown = e => { e.preventDefault(); const it = h.firstElementChild; if (!it || it.dataset.done) return;
      it.dataset.done = 1;
      if (it.dataset.good) { hits++; hitN.textContent = hits; it.classList.add('pop'); } else { bads++; badN.textContent = bads; it.classList.add('boom'); h.classList.add('shake'); setTimeout(() => h.classList.remove('shake'), 350); }
      setTimeout(() => it.remove(), 220); }; });
    const spawn = () => {
      const empty = holes.filter(h => !h.firstElementChild); if (!empty.length) return;
      const h = empty[Math.floor(Math.random() * empty.length)], good = Math.random() < 0.68;
      if (good) goods++;
      const list = good ? ic.good : ic.bad;
      h.insertAdjacentHTML('beforeend', `<span class="mg-item${good ? ' good' : ''}" ${good ? 'data-good="1"' : ''}>${esc(list[Math.floor(Math.random() * list.length)])}</span>`);
      const it = h.lastElementChild; setTimeout(() => { if (it.isConnected) it.remove(); }, stay);
    };
    const tick = () => { if (!live) return; tb.style.width = Math.max(0, dur - (now() - t0)) / dur * 100 + '%'; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    const loop = () => { if (!live) return; spawn(); setTimeout(loop, gap * (0.8 + Math.random() * 0.4)); };
    loop();
    setTimeout(() => { live = false; holes.forEach(h => { h.onpointerdown = null; }); res(goods ? (hits - bads * 1.5) / goods * 100 : 0); }, dur);
  });
}
