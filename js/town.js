// 보드 풍경: 원작처럼 풀밭 위 노란 길과 마을 (단계마다 동네가 바뀜)
// 같은 모양은 <defs>에 한 번만 그리고 <use>로 재사용 → 크롬북에서도 가볍게
const SH = (rx, ry = 8, cy = 2) => `<ellipse rx="${rx}" ry="${ry}" cy="${cy}" fill="rgba(0,0,0,.17)"/>`;
const tree = (id, dark, mid, light, dots = '') => `<g id="${id}">${SH(26, 7)}<rect x="-5" y="-26" width="10" height="26" rx="3" fill="#8B5A2B"/>
  <circle cx="-15" cy="-40" r="18" fill="${dark}"/><circle cx="15" cy="-40" r="18" fill="${dark}"/><circle cy="-56" r="23" fill="${mid}"/><circle cx="-8" cy="-63" r="9" fill="${light}"/>${dots}</g>`;
const house = (id, roof, roofSide, wall = '#FFF6E6') => `<g id="${id}">${SH(42, 8)}
  <path d="M28 0 L44 -8 L44 -46 L28 -38 Z" fill="#E6D3BC"/><rect x="-32" y="-38" width="60" height="38" fill="${wall}"/>
  <path d="M34 -36 L-2 -70 L14 -78 L50 -44 Z" fill="${roofSide}"/><path d="M-38 -36 L-2 -70 L34 -36 Z" fill="${roof}"/>
  <rect x="-8" y="-22" width="14" height="22" rx="3" fill="#A0522D"/>
  <rect x="-26" y="-29" width="12" height="12" rx="2" fill="#8FD3FF" stroke="#fff" stroke-width="2"/><rect x="12" y="-29" width="12" height="12" rx="2" fill="#8FD3FF" stroke="#fff" stroke-width="2"/></g>`;
function grid(x0, y0, cols, rows, dx, dy, w, h, fill) {
  let s = ''; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) s += `<rect x="${x0 + c * dx}" y="${y0 + r * dy}" width="${w}" height="${h}" rx="2" fill="${fill}"/>`;
  return s;
}

export function townDefs() {
  const cab = ['#FF6B6B', '#FFC94A', '#4AB8FF', '#3BB273', '#B07AFF', '#FF9E4A', '#4ACFAC', '#FF6BC8'];
  let ferrisSpokes = '', ferrisCabs = '';
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, x = Math.cos(a) * 56, y = -92 + Math.sin(a) * 56;
    ferrisSpokes += `<line x1="0" y1="-92" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#FFC2D6" stroke-width="3"/>`;
    ferrisCabs += `<rect x="${(x - 8).toFixed(1)}" y="${(y - 4).toFixed(1)}" width="16" height="14" rx="4" fill="${cab[i]}" stroke="#fff" stroke-width="2"/>`; }
  return `<defs>
    ${tree('tw-treeR', '#3E9C45', '#4CB050', '#71CC63')}
    ${tree('tw-treeB', '#FF8FB8', '#FFB3D1', '#FFD6E7', '<circle cx="10" cy="-52" r="3" fill="#fff"/><circle cx="-12" cy="-44" r="3" fill="#fff"/><circle cx="4" cy="-70" r="3" fill="#fff"/>')}
    ${tree('tw-treeA', '#E9852B', '#F7A440', '#FFC867')}
    <g id="tw-treeP">${SH(20, 6)}<rect x="-4" y="-16" width="8" height="16" fill="#7A4E2A"/><path d="M0 -88 L22 -48 L-22 -48 Z" fill="#2E9E5B"/><path d="M0 -68 L27 -22 L-27 -22 Z" fill="#268F51"/><path d="M0 -80 L9 -62 L-5 -63 Z" fill="#55C27F"/></g>
    <g id="tw-bush">${SH(24, 6)}<ellipse cx="-12" cy="-12" rx="16" ry="13" fill="#3E9C45"/><ellipse cx="12" cy="-12" rx="16" ry="13" fill="#3E9C45"/><ellipse cy="-20" rx="16" ry="14" fill="#55B65A"/><circle cx="-4" cy="-26" r="5" fill="#7AD06B"/></g>
    <g id="tw-flowers"><ellipse rx="28" ry="7" cy="-3" fill="#7FC85E"/>${[[-18, '#FF6B8A'], [-6, '#FFE14D'], [6, '#FFFFFF'], [18, '#FF9E4A']].map(([x, c]) => `<line x1="${x}" y1="-4" x2="${x}" y2="-14" stroke="#3E9C45" stroke-width="2"/><circle cx="${x}" cy="-16" r="5" fill="${c}"/><circle cx="${x}" cy="-16" r="2" fill="#FFB300"/>`).join('')}</g>
    ${house('tw-house1', '#FF6B6B', '#E04F55')}${house('tw-house2', '#4AB8FF', '#3596DD')}${house('tw-house3', '#FFC94A', '#E8AA2A')}${house('tw-house4', '#9B87FF', '#7D68E6')}${house('tw-cottage', '#4FA86A', '#3B8A55', '#FFF1D9')}
    <g id="tw-apt">${SH(54, 9)}<path d="M40 0 L58 -10 L58 -150 L40 -140 Z" fill="#CDD2E2"/><rect x="-44" y="-140" width="84" height="140" fill="#F3F4F9"/><path d="M-44 -140 L40 -140 L58 -150 L-26 -150 Z" fill="#B9BED0"/>${grid(-36, -130, 4, 6, 19, 20, 12, 12, '#9EC9F5')}<rect x="-8" y="-18" width="16" height="18" fill="#8A93AD"/></g>
    <g id="tw-tower">${SH(44, 8)}<path d="M30 0 L46 -9 L46 -209 L30 -200 Z" fill="#5A8FCC"/><rect x="-34" y="-200" width="64" height="200" fill="#83B7EC"/><path d="M-34 -200 L30 -200 L46 -209 L-18 -209 Z" fill="#A9CEF4"/>
      ${[-22, -10, 2, 14].map(x => `<line x1="${x}" y1="-196" x2="${x}" y2="-6" stroke="#B9DBFA" stroke-width="3"/>`).join('')}${Array.from({ length: 12 }, (_, i) => `<line x1="-34" y1="${-188 + i * 16}" x2="30" y2="${-188 + i * 16}" stroke="rgba(255,255,255,.35)" stroke-width="2"/>`).join('')}
      <line x1="-2" y1="-209" x2="-2" y2="-234" stroke="#8A93AD" stroke-width="3"/><circle cx="-2" cy="-236" r="4" fill="#FF6B6B"/></g>
    <g id="tw-school">${SH(84, 10)}<path d="M70 0 L86 -9 L86 -79 L70 -70 Z" fill="#EBCB9F"/><rect x="-74" y="-70" width="144" height="70" fill="#FFE7C2"/><path d="M-80 -70 L76 -70 L92 -80 L-64 -80 Z" fill="#E2715F"/>
      ${grid(-66, -60, 6, 2, 22, 22, 14, 14, '#8FD3FF')}<rect x="-18" y="-114" width="36" height="46" fill="#FFE7C2"/><path d="M-25 -112 L0 -138 L25 -112 Z" fill="#E2715F"/><circle cy="-93" r="11" fill="#fff" stroke="#8A6A4A" stroke-width="3"/><path d="M0 -93 V-100 M0 -93 H6" stroke="#4B3F6B" stroke-width="2"/>
      <rect x="-10" y="-24" width="20" height="24" fill="#A0522D"/><line x1="54" y1="-80" x2="54" y2="-124" stroke="#777" stroke-width="2"/><rect x="54" y="-124" width="20" height="12" fill="#FF6B6B"/></g>
    <g id="tw-field"><ellipse rx="88" ry="30" cy="-30" fill="#E8956B"/><ellipse rx="70" ry="20" cy="-30" fill="#5DBB4A"/><line y1="-50" y2="-10" stroke="#fff" stroke-width="2"/><circle cy="-30" r="8" fill="none" stroke="#fff" stroke-width="2"/><rect x="-70" y="-36" width="8" height="12" fill="none" stroke="#fff" stroke-width="2"/><rect x="62" y="-36" width="8" height="12" fill="none" stroke="#fff" stroke-width="2"/></g>
    <g id="tw-play">${SH(48, 8)}<path d="M-40 0 L-40 -44 M-28 0 L-28 -44" stroke="#4AB8FF" stroke-width="4"/>${[-36, -26, -16, -6].map(y => `<line x1="-40" y1="${y}" x2="-28" y2="${y}" stroke="#4AB8FF" stroke-width="3"/>`).join('')}<path d="M-28 -44 Q -6 -40 2 0" stroke="#FF6B6B" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M12 0 L24 -50 L36 0 M24 -50 L52 -50 L60 0 M44 -50 L64 0" stroke="#FFC94A" stroke-width="4" fill="none"/><line x1="38" y1="-50" x2="38" y2="-20" stroke="#777" stroke-width="2"/><rect x="31" y="-20" width="14" height="5" fill="#A0522D"/></g>
    <g id="tw-pond"><ellipse rx="74" ry="25" cy="-25" fill="#A8E4F7"/><ellipse rx="66" ry="20" cy="-25" fill="#5BC2EA"/><path d="M-34 -28 q8 -5 16 0 M12 -20 q8 -5 16 0" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/><circle cx="30" cy="-31" r="6" fill="#FFE14D"/><circle cx="35" cy="-37" r="4" fill="#FFE14D"/><path d="M38 -37 l5 1 l-5 2 z" fill="#FF9E4A"/></g>
    <g id="tw-lake"><ellipse rx="128" ry="36" cy="-36" fill="#A8E4F7"/><ellipse rx="118" ry="30" cy="-36" fill="#4FB6E8"/><path d="M-70 -40 q10 -6 20 0 M-10 -28 q10 -6 20 0 M40 -44 q10 -6 20 0" stroke="#fff" stroke-width="2.5" fill="none" opacity=".8"/>
      <path d="M-36 -40 L-6 -40 L-12 -32 L-30 -32 Z" fill="#fff"/><line x1="-21" y1="-40" x2="-21" y2="-64" stroke="#8B5A2B" stroke-width="2"/><path d="M-21 -64 L-21 -42 L-6 -44 Z" fill="#FF6B6B"/></g>
    <g id="tw-shop">${SH(46, 8)}<path d="M34 0 L48 -8 L48 -60 L34 -52 Z" fill="#E1E2EE"/><rect x="-38" y="-52" width="72" height="52" fill="#FFFFFF"/><rect x="-30" y="-34" width="34" height="22" fill="#8FD3FF"/><rect x="10" y="-26" width="16" height="26" fill="#A0522D"/>
      ${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${-42 + i * 13} -52 L${-29 + i * 13} -52 L${-31 + i * 13} -40 L${-44 + i * 13} -40 Z" fill="${i % 2 ? '#fff' : '#FF6B6B'}"/>`).join('')}<rect x="-26" y="-66" width="52" height="12" rx="3" fill="#4AB8FF"/></g>
    <g id="tw-factory">${SH(72, 10)}<rect x="-62" y="-56" width="112" height="56" fill="#DADCE6"/><path d="M50 0 L64 -8 L64 -64 L50 -56 Z" fill="#C2C5D3"/><path d="M-62 -56 L-62 -78 L-34 -56 L-34 -78 L-6 -56 L-6 -78 L22 -56 L22 -78 L50 -56 Z" fill="#9FAEC6"/>
      <rect x="28" y="-112" width="14" height="56" fill="#C0675A"/><circle cx="35" cy="-124" r="9" fill="#EEF0F5"/><circle cx="46" cy="-138" r="12" fill="#EEF0F5" opacity=".9"/><circle cx="60" cy="-152" r="14" fill="#EEF0F5" opacity=".75"/>${grid(-54, -42, 5, 1, 20, 0, 12, 14, '#8FD3FF')}<rect x="-14" y="-24" width="28" height="24" fill="#8A93AD"/></g>
    <g id="tw-campus">${SH(84, 10)}<rect x="-72" y="-62" width="144" height="62" fill="#F4E7D4"/><path d="M-82 -62 L0 -102 L82 -62 Z" fill="#B9654B"/><circle cy="-108" r="10" fill="#E8B04B"/>${[-56, -28, 0, 28, 56].map(x => `<rect x="${x - 5}" y="-58" width="10" height="50" fill="#fff"/>`).join('')}<rect x="-76" y="-8" width="152" height="8" fill="#E2D3BE"/><circle cy="-76" r="7" fill="#fff"/></g>
    <g id="tw-hospital">${SH(56, 9)}<path d="M44 0 L58 -8 L58 -86 L44 -78 Z" fill="#DDE3EE"/><rect x="-50" y="-78" width="94" height="78" fill="#FFFFFF"/><path d="M-50 -78 L44 -78 L58 -86 L-36 -86 Z" fill="#C9D3E6"/>${grid(-42, -66, 4, 2, 22, 22, 14, 14, '#9EC9F5')}<rect x="-6" y="-104" width="12" height="30" fill="#FF6B6B"/><rect x="-15" y="-95" width="30" height="12" fill="#FF6B6B"/><rect x="-10" y="-22" width="20" height="22" fill="#9FD8E6"/></g>
    <g id="tw-ferris">${SH(56, 9)}<path d="M-36 0 L0 -86 L36 0" stroke="#8E7BFF" stroke-width="7" fill="none"/><circle cy="-92" r="56" fill="none" stroke="#FF8FB1" stroke-width="6"/>${ferrisSpokes}${ferrisCabs}<circle cy="-92" r="8" fill="#FFE14D" stroke="#fff" stroke-width="3"/></g>
    <g id="tw-windmill">${SH(18, 5)}<path d="M-11 0 L-5 -92 L5 -92 L11 0 Z" fill="#F4F4F8"/>${[0, 120, 240].map(a => `<ellipse cx="0" cy="-122" rx="5" ry="30" fill="#fff" stroke="#C9CED8" stroke-width="2" transform="rotate(${a} 0 -94)"/>`).join('')}<circle cy="-94" r="6" fill="#9AA3B5"/></g>
    <g id="tw-solar">${SH(40, 6)}<g transform="skewX(-25)"><rect x="-22" y="-30" width="56" height="22" fill="#2F4F8F" stroke="#C7D6F2" stroke-width="2"/><line x1="-8" y1="-30" x2="-8" y2="-8" stroke="#7F9AD0"/><line x1="6" y1="-30" x2="6" y2="-8" stroke="#7F9AD0"/><line x1="20" y1="-30" x2="20" y2="-8" stroke="#7F9AD0"/><line x1="-22" y1="-19" x2="34" y2="-19" stroke="#7F9AD0"/></g><line x1="-10" y1="-8" x2="-10" y2="0" stroke="#888" stroke-width="3"/><line x1="16" y1="-8" x2="16" y2="0" stroke="#888" stroke-width="3"/></g>
    <g id="tw-bench">${SH(22, 5)}<rect x="-20" y="-16" width="40" height="5" rx="2" fill="#B5763C"/><rect x="-20" y="-26" width="40" height="5" rx="2" fill="#B5763C"/><line x1="-15" y1="-11" x2="-15" y2="0" stroke="#6B4A2A" stroke-width="3"/><line x1="15" y1="-11" x2="15" y2="0" stroke="#6B4A2A" stroke-width="3"/></g>
    <g id="tw-lamp"><ellipse rx="8" ry="3" fill="rgba(0,0,0,.15)"/><line y1="0" y2="-56" stroke="#4B3F6B" stroke-width="4"/><circle cy="-60" r="8" fill="#FFE98A" stroke="#4B3F6B" stroke-width="3"/></g>
    <g id="tw-car1">${SH(24, 5)}<rect x="-22" y="-18" width="44" height="14" rx="6" fill="#FF6B6B"/><path d="M-12 -18 L-8 -28 L10 -28 L14 -18 Z" fill="#FF6B6B"/><rect x="-6" y="-26" width="16" height="7" rx="2" fill="#CFEFFF"/><circle cx="-12" cy="-4" r="5" fill="#333"/><circle cx="12" cy="-4" r="5" fill="#333"/></g>
    <g id="tw-car2">${SH(24, 5)}<rect x="-22" y="-18" width="44" height="14" rx="6" fill="#4AB8FF"/><path d="M-12 -18 L-8 -28 L10 -28 L14 -18 Z" fill="#4AB8FF"/><rect x="-6" y="-26" width="16" height="7" rx="2" fill="#CFEFFF"/><circle cx="-12" cy="-4" r="5" fill="#333"/><circle cx="12" cy="-4" r="5" fill="#333"/></g>
    <g id="tw-cloud"><ellipse cx="-20" cy="0" rx="26" ry="16" fill="#fff"/><ellipse cx="10" cy="-8" rx="30" ry="22" fill="#fff"/><ellipse cx="36" cy="2" rx="22" ry="14" fill="#fff"/><rect x="-44" y="0" width="100" height="14" rx="7" fill="#fff"/></g>
    <pattern id="tw-check" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#fff"/><rect width="8" height="8" fill="#333"/><rect x="8" y="8" width="8" height="8" fill="#333"/></pattern>
    ${Object.entries(GROUND).map(([k, [a, b]]) => `<linearGradient id="tw-g-${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`).join('')}
  </defs>`;
}

// 단계별 땅 색 (위가 밝고 아래가 진함) · 먼 배경 · 장식
const GROUND = {
  baby: ['#D3F2B4', '#AEDF8B'], kid: ['#CDEFAB', '#A6DB83'], elem: ['#C2EB9C', '#9AD477'], mid: ['#BBE796', '#93CF70'], high: ['#B4E390', '#8CCB6A'],
  college: ['#C4E8A4', '#9ED27E'], young: ['#CFE3B6', '#A9CC90'], middle: ['#B9E192', '#92C96D'], elder: ['#DCE8A6', '#BED184'],
};
const BAND = {
  baby: { far: 'hills', top: ['treeB', 'treeR', 'house1', 'house3', 'treeB', 'hospital'], bot: ['flowers', 'bush', 'pond', 'flowers', 'treeB'], big: ['hospital', 'pond'] },
  kid: { far: 'hills', top: ['treeR', 'house2', 'play', 'treeB', 'house4', 'treeR'], bot: ['flowers', 'bush', 'play', 'flowers', 'pond'], big: ['play'] },
  elem: { far: 'hills', top: ['treeR', 'school', 'house1', 'treeR', 'shop', 'treeB'], bot: ['field', 'bush', 'flowers', 'treeR', 'bench'], big: ['school', 'field'] },
  mid: { far: 'mount', top: ['treeR', 'school', 'shop', 'treeP', 'house2', 'treeR'], bot: ['field', 'bush', 'bench', 'treeP', 'flowers'], big: ['school', 'field'] },
  high: { far: 'mount', top: ['treeP', 'school', 'apt', 'treeR', 'shop', 'treeR'], bot: ['field', 'bush', 'lamp', 'treeP', 'flowers'], big: ['school'] },
  college: { far: 'city', top: ['treeR', 'campus', 'shop', 'treeR', 'lamp', 'apt'], bot: ['bush', 'bench', 'lamp', 'flowers', 'treeR'], big: ['campus'] },
  young: { far: 'city', top: ['tower', 'apt', 'treeR', 'ferris', 'shop', 'tower'], bot: ['car1', 'lamp', 'bush', 'car2', 'bench'], big: ['ferris', 'tower'] },
  middle: { far: 'mount', top: ['house1', 'factory', 'treeR', 'house2', 'apt', 'windmill'], bot: ['car2', 'bush', 'solar', 'treeR', 'flowers'], big: ['factory'] },
  elder: { far: 'sunset', top: ['cottage', 'treeA', 'treeR', 'windmill', 'house3', 'treeA'], bot: ['lake', 'bench', 'flowers', 'treeA', 'bush'], big: ['lake'] },
};
// 모양별 너비·높이 (겹치지 않게 놓을 때 씀)
const SIZE = { treeR: [56, 82], treeB: [56, 82], treeA: [56, 82], treeP: [50, 90], bush: [50, 30], flowers: [56, 22], house1: [86, 80], house2: [86, 80], house3: [86, 80], house4: [86, 80], cottage: [86, 80],
  apt: [104, 152], tower: [82, 238], school: [172, 140], field: [178, 62], play: [110, 54], pond: [150, 52], lake: [258, 72], shop: [92, 68], factory: [140, 156], campus: [166, 120], hospital: [112, 106],
  ferris: [130, 152], windmill: [70, 154], solar: [80, 34], bench: [46, 28], lamp: [20, 70], car1: [50, 30], car2: [50, 30] };
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// 한 단계 구간의 풍경. roadAt(x) → {y: 길 가운데, half: 길이 차지하는 반폭(갈림길이면 넓음)}
export function townLayer(sk, si, L, R, roadAt) {
  const B = BAND[sk] || BAND.young;
  let s = `<rect x="${L}" y="0" width="${R - L}" height="720" fill="url(#tw-g-${sk})"/>`;
  s += farLayer(B.far, si, L, R);
  // 위·아래 띠에 차례로 놓기 (큰 것은 자리를 더 차지)
  for (const band of ['top', 'bot']) {
    let x = L + 40 + (band === 'bot' ? 46 : 0), i = 0, bigUsed = 0;
    while (x < R - 40) {
      const r = hash(si * 31 + (band === 'top' ? 1 : 2), i++);
      let k = B[band][Math.floor(r * B[band].length)];
      if (B.big.includes(k) && (bigUsed >= Math.max(1, Math.floor((R - L) / 900)) || hash(si, i + 99) < 0.45)) k = band === 'top' ? 'treeR' : 'bush'; // 큰 건물은 드문드문
      const [w, h] = SIZE[k];
      const cx = x + w / 2;
      const ra = roadAt(cx), rb = roadAt(x + 4), rc = roadAt(x + w - 4);
      const ry = Math.min(ra.y, rb.y, rc.y), ryMax = Math.max(ra.y, rb.y, rc.y), half = Math.max(ra.half, rb.half, rc.half);
      let base;
      if (band === 'top') base = Math.min(ry - half - 16, 150 + h + hash(si, i + 7) * 60);
      else base = Math.max(ryMax + half + 18 + h, 640 + hash(si, i + 5) * 66);
      const ok = band === 'top' ? base - h > 96 && base < ry - half - 10 : base <= 712 && base - h > ryMax + half + 10;
      if (ok) { s += `<use href="#tw-${k}" x="${cx.toFixed(0)}" y="${base.toFixed(0)}"/>`; if (B.big.includes(k)) bigUsed++; x += w + 16 + hash(si, i + 3) * 30; }
      else x += 34;
    }
  }
  return s;
}
// 먼 배경: 언덕 · 산 · 도시 · 노을 언덕 + 구름
function farLayer(kind, si, L, R) {
  const pts = (y0, amp, step, seed) => { let d = `M ${L} 0 L ${L} ${y0}`; for (let x = L; x <= R + step; x += step) d += ` L ${Math.min(x, R)} ${(y0 - amp * (0.5 + 0.5 * Math.sin(x / 170 + seed))).toFixed(0)}`; return d + ` L ${R} 0 Z`; };
  let s = '';
  if (kind === 'city') {
    s += `<path d="${pts(130, 30, 60, si)}" fill="#DDEFF6" opacity=".7"/>`;
    for (let x = L + 10, i = 0; x < R - 30; x += 46, i++) { const h = 40 + hash(si * 7, i) * 70, w = 30 + hash(si * 9, i) * 18; s += `<rect x="${x.toFixed(0)}" y="${(150 - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="#B8C9E4" opacity=".75"/>`; }
  } else if (kind === 'mount') {
    for (let x = L - 40, i = 0; x < R; x += 210, i++) { const h = 70 + hash(si * 5, i) * 60; s += `<path d="M ${x} 160 L ${x + 110} ${160 - h} L ${x + 220} 160 Z" fill="#8CC79A"/><path d="M ${x + 110} ${160 - h} L ${x + 92} ${160 - h + 22} L ${x + 128} ${160 - h + 22} Z" fill="#fff" opacity=".9"/>`; }
  } else if (kind === 'sunset') {
    s += `<path d="${pts(150, 40, 60, si)}" fill="#E9C97A" opacity=".75"/>`;
  } else s += `<path d="${pts(150, 46, 60, si)}" fill="#9ED783" opacity=".8"/>`;
  for (let x = L + 120, i = 0; x < R - 80; x += 520, i++) s += `<use href="#tw-cloud" x="${x + hash(si, i) * 200}" y="${40 + hash(si + 3, i) * 46}" opacity=".9"/>`;
  return s;
}

// 노란 길 (그림자 · 주황 테두리 · 노란 길 · 가운데 점선)
export function roadSvg(paths) {
  const one = d => `<path d="${d}" stroke="rgba(0,0,0,.13)" stroke-width="104" fill="none" stroke-linejoin="round" stroke-linecap="round" transform="translate(0 9)"/>`;
  const edge = d => `<path d="${d}" stroke="#E59B2E" stroke-width="102" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
  const top = d => `<path d="${d}" stroke="#FFD95A" stroke-width="88" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
  const line = d => `<path d="${d}" stroke="#FFF3BF" stroke-width="4" fill="none" stroke-dasharray="12 16" stroke-linecap="round" opacity=".9"/>`;
  return paths.map(one).join('') + paths.map(edge).join('') + paths.map(top).join('') + paths.map(line).join('');
}
// 칸: 두께가 보이는 입체 타일
export function shade(hex, f) { const n = parseInt(hex.slice(1), 16); const c = s => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f))); return `rgb(${c(16)},${c(8)},${c(0)})`; }
export function tileSvg(x, y, s, color, icon, label, id) {
  return `<g transform="translate(${x} ${y})"${id != null ? ` data-cell="${id}"` : ''}>
    <rect x="${-s / 2}" y="${-s / 2 + 8}" width="${s}" height="${s}" rx="18" fill="${shade(color, 0.72)}"/>
    <rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="18" fill="${color}" stroke="#fff" stroke-width="5"/>
    <rect x="${-s / 2 + 7}" y="${-s / 2 + 6}" width="${s - 14}" height="${Math.round(s * 0.3)}" rx="11" fill="#fff" opacity=".28"/>
    <text y="${s > 90 ? 8 : 6}" text-anchor="middle" font-size="${s > 90 ? 44 : 36}">${icon}</text>
    <text y="${s / 2 - 8}" text-anchor="middle" font-size="${s > 90 ? 17 : 15}" class="cell-t" fill="#4B3F6B">${label}</text></g>`;
}
// 단계 문 아치 · 골인 결승선
export function archSvg(x, y, goal, label) {
  const col = goal ? '#4B3F6B' : '#9B87FF', ban = goal ? 'url(#tw-check)' : '#FF8FB1';
  return `<g transform="translate(${x} ${y})"><rect x="-74" y="-128" width="16" height="150" rx="6" fill="${col}"/><rect x="58" y="-128" width="16" height="150" rx="6" fill="${col}"/>
    <path d="M-82 -118 Q 0 -168 82 -118 L 82 -92 Q 0 -142 -82 -92 Z" fill="${ban}" stroke="#fff" stroke-width="4"/>
    ${goal ? '' : `<text y="-114" text-anchor="middle" font-size="22" class="cell-t" fill="#fff" stroke="#C25480" stroke-width="3" paint-order="stroke">${label}</text>`}
    <circle cx="-66" cy="-134" r="9" fill="#FFE14D"/><circle cx="66" cy="-134" r="9" fill="#FFE14D"/></g>`;
}
// 단계 이름 표지판
export function signSvg(x, y, text) {
  const w = text.length * 26 + 30;
  return `<g transform="translate(${x} ${y})"><rect x="-4" y="-6" width="8" height="70" fill="#8B5A2B"/><rect x="${-w / 2}" y="-52" width="${w}" height="48" rx="10" fill="#FFE2A8" stroke="#B5763C" stroke-width="4"/>
    <text y="-18" text-anchor="middle" font-size="26" class="cell-t" fill="#6B4A2A">${text}</text></g>`;
}
