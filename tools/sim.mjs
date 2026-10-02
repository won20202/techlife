// COM끼리 자동으로 여러 판 돌려서 오류·밸런스 확인: node tools/sim.mjs [판 수] [모드]
import { newGame, act, aiAction, assets, jobOf } from '../js/engine.js';
const N = +process.argv[2] || 50, mode = process.argv[3] || 'life';
const stat = { byJob: {}, totals: [], married: 0, kids: 0, players: 0, steps: 0, parts: {}, edu: {}, rank: 0, house: {} };
for (let g = 0; g < N; g++) {
  const S = newGame({ mode, seed: 1000 + g, players: [0, 1, 2, 3].map(i => ({ name: 'COM' + (i + 1), gender: i % 2 ? 'f' : 'm', isCom: true })) });
  let steps = 0;
  while (!S.over) {
    const pd = S.pending;
    if (!pd) throw new Error('stuck without pending');
    let a = aiAction(S);
    if (pd.type === 'quiz') throw new Error('quiz waiting for human');
    if (!a) throw new Error('no ai for ' + pd.type);
    a.pid = pd.pid;
    act(S, a);
    if (++steps > 20000) throw new Error('too many steps');
  }
  stat.steps += steps;
  if (!S.results.growth) S.players.forEach(p => {
    const a = assets(S, p);
    const name = p.job ? (p.job.free ? '프리랜서' : jobOf(p).name) : '없음';
    (stat.byJob[name] ||= []).push(a.total);
    stat.totals.push(a.total); stat.players++;
    if (p.spouse != null) stat.married++; stat.kids += p.kids.length;
    for (const k of ['cash', 'house', 'car', 'stock', 'souvenir', 'debt', 'medal']) stat.parts[k] = (stat.parts[k] || 0) + a[k];
    const e = ['고졸', '전문대', '4년제'][p.edu ?? 0]; (stat.edu[e] ||= []).push(a.total);
    stat.rank += p.job && !p.job.free ? p.job.rank : 1; stat.house[p.house.k] = (stat.house[p.house.k] || 0) + 1;
  });
}
const avg = a => Math.round(a.reduce((s, v) => s + v, 0) / a.length);
console.log(`${N}판 OK (${mode}) · 평균 행동 수 ${Math.round(stat.steps / N)}`);
if (stat.players) {
  const t = stat.totals.sort((a, b) => a - b);
  console.log(`인생 총점 평균 ${(avg(t) / 10000).toFixed(1)}억 · 중앙 ${(t[t.length >> 1] / 10000).toFixed(1)}억 · 최소 ${(t[0] / 10000).toFixed(1)}억 · 최대 ${(t[t.length - 1] / 10000).toFixed(1)}억`);
  console.log(`결혼 ${Math.round(stat.married / stat.players * 100)}% · 아이 평균 ${(stat.kids / stat.players).toFixed(1)}명`);
  const rows = Object.entries(stat.byJob).filter(([, v]) => v.length >= 3).map(([k, v]) => [k, avg(v), v.length]).sort((a, b) => b[1] - a[1]);
  console.log('재산 구성 평균:', Object.entries(stat.parts).map(([k, v]) => `${k} ${(v / stat.players / 10000).toFixed(1)}억`).join(' · '));
  console.log('학력별 중앙값:', Object.entries(stat.edu).map(([k, v]) => { v.sort((a, b) => a - b); return `${k} ${(v[v.length >> 1] / 10000).toFixed(1)}억 (${v.length}명)`; }).join(' · '));
  console.log(`평균 직업 랭크 ${(stat.rank / stat.players).toFixed(1)} · 집:`, JSON.stringify(stat.house));
  console.log('직업별 평균(3명 이상):'); rows.forEach(([k, v, n]) => console.log(`  ${k.padEnd(14)} ${(v / 10000).toFixed(1)}억 (${n}명)`));
}
