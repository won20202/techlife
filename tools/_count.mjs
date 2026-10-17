// 시험용(배포 안 함): 한 판에 어떤 화면이 몇 번 나오는지
import { newGame, act, aiAction } from '../js/engine.js';
const mode = process.argv[2] || 'life', N = +process.argv[3] || 10, tally = {};
let seqSeen = 0;
for (let g = 0; g < N; g++) {
  const S = newGame({ mode, seed: 500 + g, players: [0, 1, 2, 3].map(i => ({ name: 'COM' + (i + 1), gender: i % 2 ? 'f' : 'm', isCom: true })) });
  let last = 0;
  while (!S.over) {
    const pd = S.pending; const a = aiAction(S); a.pid = pd.pid;
    if (pd.type === 'ack' || pd.type === 'event' || pd.type === 'fate' || pd.type === 'mini' || pd.type === 'pickPlayer') tally[pd.type] = (tally[pd.type] || 0) + 1;
    act(S, a);
    for (const e of S.log) if (e.seq > last) { if (['party', 'partyResult', 'mini', 'quizShow'].includes(e.k)) tally['log:' + e.k + (e.mode ? ':' + e.mode : '')] = (tally['log:' + e.k + (e.mode ? ':' + e.mode : '')] || 0) + 1; last = e.seq; }
  }
}
console.log(mode, Object.entries(tally).map(([k, v]) => `${k} ${(v / N).toFixed(1)}`).join(' · '));
