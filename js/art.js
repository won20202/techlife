// 그림: 아바타(나이·성별·꾸미기·상황 옷) · 장면 배경(조립식) · 룰렛
export const SKINS = ['#FFE0C7', '#F5C9A0', '#D9A27A', '#A86F4C', '#FFF0E6', '#7A4E36'];
export const HAIR_COLORS = ['#4A3B6B', '#2B2B33', '#7A4B2A', '#C98A3E', '#E8C25A', '#FF8FB1', '#B5463A', '#5B8BD9', '#A9B0BF', '#8C6BF0'];
export const HAIR_STYLES = ['짧은 머리', '삐침 머리', '단발', '긴 머리', '옆 묶음', '양갈래', '똥머리', '곱슬 머리', '까까머리', '가르마', '일자 앞머리', '땋은 머리', '모히칸', '웨이브', '바가지 머리', '올백', '포니테일'];
const LONG_HAIR = [2, 3, 4, 5, 10, 11, 13, 16]; // 노인이 되면 쪽 찐 머리로
export const EYES = ['동글', '반짝', '웃는 눈', '졸린 눈', '고양이 눈', '점 눈', '속눈썹'];
export const MOUTHS = ['방긋', '활짝', '헤헤', '오!', '메롱', '무표정'];
export const TOPS = ['반팔 티', '긴팔 티', '줄무늬 티', '후드티', '셔츠', '카디건', '재킷', '맨투맨', '니트 조끼'];
export const BOTTOMS = ['긴 바지', '청바지', '나팔바지', '카고바지', '와이드 팬츠', '조거 팬츠', '7부 바지', '반바지', '츄리닝', '멜빵 바지', '멜빵 반바지',
  '치마', '주름 치마', '풍성한 치마', '긴 치마', '멜빵 치마', '원피스', '프릴 원피스'];
const BOTTOM_FX = [{}, { jeans: true }, { bell: true }, { cargo: true }, { wide: true }, { jogger: true }, { crop: true }, { shorts: true }, { track: true },
  { strap: true }, { strap: true, shorts: true }, { skirt: true }, { skirt: true, pleats: true }, { skirt: true, flare: true }, { skirt: true, longSkirt: true },
  { strap: true, skirt: true }, { dress: true }, { dress: true, frill: true }];
export const SHOES = ['운동화', '구두', '부츠', '샌들', '하이탑'];
export const CLOTHES = ['#FFFFFF', '#FF9EC4', '#7DD3A8', '#8FB8FF', '#FFD54A', '#B79CFF', '#FF7A6B', '#FFB547', '#3F4C8C', '#3B3B48']; // 윗옷 색 (look.outfit)
export const BOTTOM_COLORS = ['#2B2F4F', '#4B6FB0', '#6B7280', '#C9A27A', '#3F4C8C', '#6C5B9E', '#FF9EC4', '#FFFFFF', '#7A4B2A', '#3B7A4B'];
export const SHOE_COLORS = ['#FFFFFF', '#2B2F4F', '#E8505B', '#4A9BFF', '#FFD23F', '#8C5E32', '#FF8FB1', '#3BB273'];
export const ITEMS = { none: '없음', cap: '야구모자', beanie: '비니', crown: '왕관', glasses: '안경', sunglasses: '선글라스', mustache: '콧수염', beard: '턱수염', santa: '산타 수염', ribbon: '리본', headphones: '헤드폰', sticker: '볼 스티커' };
// 고르지 않은 칸은 예전 모습 그대로 (긴팔 티 · 남: 긴 바지 / 여: 치마 · 남색 운동화)
export function lookOf(look, gender) {
  const f = gender === 'f';
  const o = { skin: 0, hair: f ? 3 : 0, hairColor: 0, eyes: 0, mouth: 0, top: 1, outfit: 3, bottom: f ? 11 : 0, bottomColor: f ? 5 : 0, shoes: 0, shoeColor: 1, item: null };
  for (const [k, v] of Object.entries(look || {})) if (v != null) o[k] = v;
  return o;
}

const AGE = {
  baby:  { r: 44, torso: 40, legs: 0 },
  kid:   { r: 46, torso: 44, legs: 26 },
  elem:  { r: 46, torso: 52, legs: 42 },
  mid:   { r: 45, torso: 62, legs: 60 },
  high:  { r: 44, torso: 70, legs: 74 },
  adult: { r: 44, torso: 74, legs: 82 },
  elder: { r: 44, torso: 70, legs: 76 },
};
export const STAGE_AGE = { baby: 'baby', kid: 'kid', elem: 'elem', mid: 'mid', high: 'high', college: 'adult', young: 'adult', middle: 'adult', elder: 'elder' };

// 직업 옷: 직업 종류(연구원·요리사·조종사…)가 먼저, 없으면 분야 옷 (회사원은 분야 옷 + 사원증)
const TRACK_OUTFIT = {
  연구: { top: '#FFFFFF', bottom: '#4B5BA8', labcoat: true, inner: '#8FB8FF', prop: 'glasses' },
  요리: { top: '#FFFFFF', bottom: '#3B3B48', prop: 'chef', tie: '#E8505B', apron: '#FFFFFF' },
  하늘: { top: '#2B3550', bottom: '#2B3550', prop: 'pilot', jacket: true, inner: '#FFFFFF', tie: '#2B2F4F' },
  디자인: { top: '#FFB547', bottom: '#4B4F6B', prop: 'beret', stripes: true },
  농업: { top: '#FFFFFF', bottom: '#4B6FB0', strap: true, prop: 'sunhat', shortSleeve: true },
  보육: { top: '#FFB0C9', bottom: '#4B6FB0', apron: '#FFF6D6' },
  교육: { top: '#8B6CD9', bottom: '#3F3A5A', cardigan: true, inner: '#FFFFFF', prop: 'glasses' },
  크리에이터: { top: '#FF6B9A', bottom: '#2B2F4F', hood: true, prop: 'headphones' },
  창업: { top: '#3B3B48', bottom: '#4B6FB0', jacket: true, inner: '#FFFFFF' },
  '기술:수송': { top: '#3F7DD9', bottom: '#3F7DD9', prop: 'cap', badge: true }, // 정비원
};
const FIELD_OUTFIT = {
  '발명·디자인': { top: '#FFB547', bottom: '#4B4F6B', prop: 'beret' }, 제조: { top: '#3F7DD9', bottom: '#2F3A55', prop: 'goggles' },
  건설: { top: '#FF8C2E', bottom: '#3B4A6B', prop: 'helmet', vest: true }, 수송: { top: '#2E9E8F', bottom: '#2B3550', vest: true }, // 조종사·기관사는 직업 종류(하늘)로 따로
  정보통신: { top: '#5B6BD9', bottom: '#2B2F4F', prop: 'headset' }, 생명: { top: '#FFFFFF', bottom: '#5BA36B', labcoat: true, inner: '#7DD3A8' },
  '적정기술·환경·에너지': { top: '#6CC46C', bottom: '#3B5A3B', prop: 'cap' }, 가정: { top: '#FFB0C9', bottom: '#4B5070', cardigan: true, inner: '#FFFFFF' },
  교육: { top: '#8B6CD9', bottom: '#3F3A5A', prop: 'glasses' }, 융합: { top: '#FFFFFF', bottom: '#4B5BA8', labcoat: true, inner: '#B79CFF' },
  프리랜서: { top: '#FFD54A', bottom: '#3F4C8C', prop: 'headphones' },
};
export function jobOutfit(track, field) {
  const o = TRACK_OUTFIT[track + ':' + field] || TRACK_OUTFIT[track] || FIELD_OUTFIT[field] || FIELD_OUTFIT['프리랜서'];
  return track === '회사' ? { ...o, badge: true } : o;
}

// look: lookOf 참고  opt: {age, gender, wear:'auto'|'job'|'wedding'|'suit'|'sports'|'work'|'travel'|'grad', field, mood}
export function avatar(look0 = {}, opt = {}) {
  const k = opt.age || 'adult', st = AGE[k], f = opt.gender === 'f';
  const look = lookOf(look0, opt.gender);
  const { r, torso, legs } = st;
  const SKIN = SKINS[look.skin] || SKINS[0], SKIN_D = shade(SKIN, -18);
  const hairC = k === 'elder' ? '#DDD9E6' : HAIR_COLORS[look.hairColor] || HAIR_COLORS[0];
  const style = look.hair;
  const tw = r * (k === 'baby' ? 1.25 : 1.1), top = -(legs + torso);
  const hy = top - r * 0.82;
  const ry = (k === 'high' || k === 'adult' || k === 'elder') ? r * 1.05 : r;
  const o = outfitOf(k, f, look, opt);
  const bst = o.bottom === '#FFFFFF' ? 'stroke="#DCD6EE" stroke-width="2"' : ''; // 흰 아랫옷은 연한 테두리
  let p = '';

  // 머리카락 (뒤)
  if (o.prop === 'veil') p += `<path d="M ${-r * 1.25} ${hy + r * 1.6} Q ${-r * 1.45} ${hy - ry - r * 0.25} 0 ${hy - ry - r * 0.12} Q ${r * 1.45} ${hy - ry - r * 0.25} ${r * 1.25} ${hy + r * 1.6} Z" fill="#FFFFFF" opacity=".9" stroke="#E6E0F5" stroke-width="2"/>`; // 면사포는 머리 뒤로
  if (k !== 'baby') p += hairBack(style, k, r, hy, ry, hairC);
  // 다리
  if (k === 'baby') {
    p += `<ellipse cx="${-r * 0.42}" cy="-8" rx="${r * 0.32}" ry="${r * 0.2}" fill="${o.bottom}"/><ellipse cx="${r * 0.42}" cy="-8" rx="${r * 0.32}" ry="${r * 0.2}" fill="${o.bottom}"/>
          <circle cx="${-r * 0.72}" cy="-8" r="${r * 0.14}" fill="${SKIN}"/><circle cx="${r * 0.72}" cy="-8" r="${r * 0.14}" fill="${SKIN}"/>`;
  } else {
    const lw = r * 0.3, lx = r * 0.26;
    const bare = o.shorts || o.skirt || o.dress || o.crop;
    const leg = (x, fill, st, w = lw, h = legs) => `<rect x="${x - w / 2}" y="${-legs}" width="${w}" height="${h}" rx="${lw / 2}" fill="${fill}" ${st}/>`;
    if (bare) p += leg(-lx, SKIN, '') + leg(lx, SKIN, '');
    if (!bare || o.crop) {
      if (o.bell) p += [-lx, lx].map(x => `<path d="M ${x - lw / 2} ${-legs} L ${x + lw / 2} ${-legs} L ${x + lw * 0.95} 0 L ${x - lw * 0.95} 0 Z" fill="${o.bottom}" ${bst}/>`).join('');
      else if (o.jogger) p += [-lx, lx].map(x => `<path d="M ${x - lw * 0.62} ${-legs} L ${x + lw * 0.62} ${-legs} L ${x + lw * 0.4} -13 L ${x - lw * 0.4} -13 Z" fill="${o.bottom}" ${bst}/>`).join(''); // 위는 넉넉, 발목은 좁게
      else { const w = o.wide ? lw * 1.5 : lw, h = o.crop ? legs * 0.7 : legs; p += leg(-lx, o.bottom, bst, w, h) + leg(lx, o.bottom, bst, w, h); }
    }
    if (o.cargo) p += [-1, 1].map(d => `<rect x="${d * (lx + lw * 0.3) - lw * 0.35}" y="${-legs * 0.6}" width="${lw * 0.7}" height="${legs * 0.22}" rx="2" fill="${shade(o.bottom, -18)}" stroke="${shade(o.bottom, -35)}" stroke-width="1"/>`).join('');
    // 청바지: 물 빠진 가운데 + 주황 박음질 + 접어 올린 밑단 / 조거: 시보리 밑단 + 허리 끈
    if (o.jeans) p += [-lx, lx].map(x => `<rect x="${x - lw * 0.18}" y="${-legs + 8}" width="${lw * 0.36}" height="${Math.max(0, legs - 30)}" rx="${lw * 0.18}" fill="#fff" opacity=".2"/><path d="M ${x + Math.sign(x) * (lw / 2 - 2.5)} ${-legs + 6} V -19" stroke="#E8A33A" stroke-width="1.4" stroke-dasharray="3 2"/><rect x="${x - lw / 2 - 1}" y="-19" width="${lw + 2}" height="7" rx="2" fill="${shade(o.bottom, 30)}" stroke="${shade(o.bottom, -20)}" stroke-width="1"/>`).join('');
    if (o.jogger) p += [-lx, lx].map(x => `<rect x="${x - lw * 0.45}" y="-14" width="${lw * 0.9}" height="7" rx="3" fill="${shade(o.bottom, -30)}"/><path d="M ${x - lw * 0.25} -13 V -8 M ${x} -13 V -8 M ${x + lw * 0.25} -13 V -8" stroke="${shade(o.bottom, -50)}" stroke-width="1"/>`).join('')
      + `<path d="M -3 ${-legs + 6} q -2 6 -4 ${Math.min(13, legs * 0.25)} M 3 ${-legs + 6} q 2 6 4 ${Math.min(13, legs * 0.25)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    if (o.track) { const x = lx + lw / 2 - 2.5; p += `<path d="M ${-x} ${-legs + 4} V -10 M ${x} ${-legs + 4} V -10" stroke="${o.bottom === '#FFFFFF' ? '#8FB8FF' : '#fff'}" stroke-width="2.5"/>`; }
    if (o.shorts) p += `<rect x="${-tw / 2}" y="${-legs - 4}" width="${tw}" height="${legs * 0.45}" rx="8" fill="${o.bottom}" ${bst}/>`;
    if (o.socks) p += `<rect x="${-lx - lw / 2}" y="${-legs * 0.45}" width="${lw}" height="${legs * 0.45}" rx="${lw / 2}" fill="#fff"/><rect x="${lx - lw / 2}" y="${-legs * 0.45}" width="${lw}" height="${legs * 0.45}" rx="${lw / 2}" fill="#fff"/>`;
    if (o.skirt || o.dress) {
      const sl = o.gown ? legs * 0.8 : o.longSkirt ? legs * 0.9 : o.dress ? legs * 0.65 : (k === 'adult' || k === 'elder') ? legs * 0.6 : legs * 0.5;
      const fl = o.gown ? 26 : o.flare || o.frill ? 20 : 10, hem = -legs + sl, hw = tw / 2 + fl;
      p += `<path d="M ${-tw / 2} ${-legs - 6} L ${tw / 2} ${-legs - 6} L ${hw} ${hem} L ${-hw} ${hem} Z" fill="${o.bottom}" ${bst}/>`;
      if (o.pleats) p += [-0.5, -0.17, 0.17, 0.5].map(t => `<path d="M ${t * tw * 0.8} ${-legs - 2} L ${t * hw * 1.6} ${hem - 1}" stroke="${shade(o.bottom, -30)}" stroke-width="1.6"/>`).join('');
      if (o.flare || o.frill) { const n = 6, cr = hw / n; p += Array.from({ length: n }, (_, i) => `<circle cx="${-hw + cr * (2 * i + 1)}" cy="${hem}" r="${cr}" fill="${o.frill ? shade(o.bottom, 45) : o.bottom}"/>`).join(''); }
    }
    p += shoesSvg(o.shoes, o.shoeC, lx, lw, legs, SKIN);
  }
  if (o.bag) p += `<rect x="${-tw / 2 - 12}" y="${top + 4}" width="${tw + 24}" height="${torso * 0.95}" rx="14" fill="${o.bag}"/>`;
  const stroke = o.top === '#FFFFFF' ? 'stroke="#DCD6EE" stroke-width="2"' : '';
  p += `<rect x="${-tw / 2}" y="${top}" width="${tw}" height="${torso + 6}" rx="${Math.min(22, tw / 2.6)}" fill="${o.top}" ${stroke}/>`;
  if (o.labcoat) p += `<rect x="${-tw / 2}" y="${top + torso - 4}" width="${tw}" height="${legs * 0.32 + 4}" rx="6" fill="#FFFFFF" stroke="#DCD6EE" stroke-width="2"/><path d="M 0 ${top + torso} V ${top + torso + legs * 0.32}" stroke="#DCD6EE" stroke-width="2"/>`;
  p += topDetails(o, tw, top, torso, r);
  if (o.apron) p += `<path d="M ${-tw * 0.22} ${top + torso * 0.28} L ${-tw * 0.12} ${top + 2} M ${tw * 0.22} ${top + torso * 0.28} L ${tw * 0.12} ${top + 2}" stroke="${shade(o.apron, -30)}" stroke-width="3"/><rect x="${-tw * 0.36}" y="${top + torso * 0.28}" width="${tw * 0.72}" height="${torso * 0.72 + legs * 0.3}" rx="7" fill="${o.apron}" stroke="${shade(o.apron, -25)}" stroke-width="1.5"/><rect x="${-tw * 0.18}" y="${top + torso * 0.62}" width="${tw * 0.36}" height="${torso * 0.18}" rx="4" fill="none" stroke="${shade(o.apron, -30)}" stroke-width="1.5"/>`;
  if (o.strap) p += `<rect x="${-tw / 2 + 4}" y="${top + torso * 0.45}" width="${tw - 8}" height="${torso * 0.6}" rx="8" fill="${o.bottom}" ${bst}/><rect x="${-tw / 2 + 8}" y="${top}" width="7" height="${torso * 0.5}" fill="${o.bottom}"/><rect x="${tw / 2 - 15}" y="${top}" width="7" height="${torso * 0.5}" fill="${o.bottom}"/>`;
  if (o.tie) {
    p += `<path d="M ${-r * 0.3} ${top} L 0 ${top + r * 0.42} L ${r * 0.3} ${top} Z" fill="#fff"/>`;
    p += `<path d="M -4 ${top + 8} L 4 ${top + 8} L 6 ${top + torso * 0.55} L 0 ${top + torso * 0.62} L -6 ${top + torso * 0.55} Z" fill="${o.tie}"/>`;
  }
  if (o.bow) p += `<path d="M -12 ${top + 14} L 0 ${top + 20} L -12 ${top + 26} Z M 12 ${top + 14} L 0 ${top + 20} L 12 ${top + 26} Z" fill="#1E2033"/><circle cy="${top + 20}" r="3.5" fill="#1E2033"/>`;
  if (o.labcoat) p += `<path d="M ${-tw * 0.2} ${top} L 0 ${top + torso * 0.5} L ${tw * 0.2} ${top} Z" fill="${o.inner || '#8FB8FF'}"/><path d="M ${-tw * 0.2} ${top} L 0 ${top + torso * 0.5} L ${tw * 0.2} ${top}" stroke="#DCD6EE" stroke-width="2.5" fill="none"/>`
    + `<rect x="${tw * 0.1}" y="${top + torso * 0.42}" width="${tw * 0.26}" height="${torso * 0.18}" rx="3" fill="#fff" stroke="#DCD6EE" stroke-width="2"/><path d="M ${tw * 0.16} ${top + torso * 0.34} V ${top + torso * 0.48} M ${tw * 0.25} ${top + torso * 0.34} V ${top + torso * 0.48}" stroke="#4A9BFF" stroke-width="2.5" stroke-linecap="round"/>`;
  if (o.badge) p += `<path d="M ${-tw * 0.16} ${top + 1} L 0 ${top + torso * 0.42} L ${tw * 0.16} ${top + 1}" stroke="#4A9BFF" stroke-width="2" fill="none"/><rect x="-6" y="${top + torso * 0.42}" width="12" height="16" rx="2" fill="#fff" stroke="#4A9BFF" stroke-width="1.5"/><rect x="-3.5" y="${top + torso * 0.42 + 3}" width="7" height="5" fill="#8FB8FF"/>`;
  if (o.vest) p += `<rect x="${-tw / 2 + 3}" y="${top + torso * 0.35}" width="${tw - 6}" height="7" fill="#F5F06B"/>`;
  if (o.number) p += `<text x="0" y="${top + torso * 0.6}" text-anchor="middle" font-size="${r * 0.45}" font-family="Jua" fill="#fff">7</text>`;
  // 팔·손
  const aw = r * 0.34, ay = top + 6, al = torso * 0.78;
  const sleeve = o.shortSleeve ? SKIN : (o.sleeveC || o.top);
  const sst = !o.shortSleeve && sleeve === '#FFFFFF' ? 'stroke="#DCD6EE" stroke-width="2"' : '';
  p += `<rect x="${-tw / 2 - aw + 4}" y="${ay}" width="${aw}" height="${al}" rx="${aw / 2}" fill="${sleeve}" ${sst}/><rect x="${tw / 2 - 4}" y="${ay}" width="${aw}" height="${al}" rx="${aw / 2}" fill="${sleeve}" ${sst}/>`;
  if (o.shortSleeve) p += `<rect x="${-tw / 2 - aw + 4}" y="${ay}" width="${aw}" height="${al * 0.35}" rx="${aw / 2}" fill="${o.top}"/><rect x="${tw / 2 - 4}" y="${ay}" width="${aw}" height="${al * 0.35}" rx="${aw / 2}" fill="${o.top}"/>`;
  else if (o.logo) p += `<rect x="${-tw / 2 - aw + 4}" y="${ay + al - 8}" width="${aw}" height="7" fill="${shade(o.top, -28)}"/><rect x="${tw / 2 - 4}" y="${ay + al - 8}" width="${aw}" height="7" fill="${shade(o.top, -28)}"/>`;
  p += `<circle cx="${-tw / 2 - aw / 2 + 4}" cy="${ay + al}" r="${aw * 0.55}" fill="${SKIN}"/><circle cx="${tw / 2 + aw / 2 - 4}" cy="${ay + al}" r="${aw * 0.55}" fill="${SKIN}"/>`;
  if (o.bag) p += `<path d="M ${-tw / 2 + 6} ${top + 2} L ${-tw / 2 + 10} ${top + torso * 0.7} M ${tw / 2 - 6} ${top + 2} L ${tw / 2 - 10} ${top + torso * 0.7}" stroke="${shade(o.bag, -25)}" stroke-width="5" stroke-linecap="round"/>`;
  if (o.flowers) p += `<g transform="translate(${tw / 2 + aw / 2 - 4} ${ay + al - 18})"><circle r="9" fill="#FF8FB1"/><circle cx="-9" cy="6" r="8" fill="#FFD54A"/><circle cx="8" cy="7" r="8" fill="#B79CFF"/><rect x="-2" y="10" width="4" height="22" fill="#5BA36B"/></g>`;
  if (k === 'elder') p += `<path d="M ${tw / 2 + aw / 2 - 4} ${ay + al} L ${tw / 2 + aw / 2 + 2} 0" stroke="#8C5E32" stroke-width="5" stroke-linecap="round"/>`;
  if (o.hood) p += `<ellipse cx="0" cy="${top + 2}" rx="${tw * 0.42}" ry="${r * 0.26}" fill="${shade(o.top, -22)}"/><path d="M -5 ${top + 8} L -6 ${top + torso * 0.42} M 5 ${top + 8} L 6 ${top + torso * 0.42}" stroke="${o.top === '#FFFFFF' ? '#B8B2C8' : '#fff'}" stroke-width="2.5" stroke-linecap="round"/>`;
  if (style === 11 && k !== 'baby' && k !== 'elder') p += braid(r, hy, hairC); // 땋은 머리는 어깨 앞으로

  // 얼굴
  p += `<ellipse cx="0" cy="${hy}" rx="${r}" ry="${ry}" fill="${SKIN}"/>`;
  p += `<ellipse cx="${-r * 0.98}" cy="${hy + r * 0.15}" rx="${r * 0.14}" ry="${r * 0.2}" fill="${SKIN_D}"/><ellipse cx="${r * 0.98}" cy="${hy + r * 0.15}" rx="${r * 0.14}" ry="${r * 0.2}" fill="${SKIN_D}"/>`;
  if (k === 'baby') p += `<path d="M -2 ${hy - r * 0.98} c -8 -14 10 -22 14 -10 c 3 9 -8 11 -9 4" stroke="${hairC}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  else p += hairFront(style, k, r, hy, ry, hairC);
  const adultish = k === 'high' || k === 'adult' || k === 'elder';
  const ex = r * 0.36, ey = hy + r * 0.14, erx = r * (adultish ? 0.13 : 0.16), ery = r * (adultish ? 0.16 : 0.2);
  p += eyesSvg(look.eyes, opt.mood, k, adultish, ex, ey, erx, ery);
  if (k === 'elder') p += `<circle cx="${-ex}" cy="${ey - 2}" r="${r * 0.24}" fill="none" stroke="#6B5B95" stroke-width="3"/><circle cx="${ex}" cy="${ey - 2}" r="${r * 0.24}" fill="none" stroke="#6B5B95" stroke-width="3"/><path d="M ${-ex + r * 0.24} ${ey - 2} L ${ex - r * 0.24} ${ey - 2}" stroke="#6B5B95" stroke-width="3"/>`;
  const blush = { baby: .85, kid: .8, elem: .7, mid: .6, high: .45, adult: .35, elder: .4 }[k];
  p += `<ellipse cx="${-r * 0.6}" cy="${hy + r * 0.45}" rx="${r * 0.2}" ry="${r * 0.12}" fill="#FF9EB5" opacity="${blush}"/><ellipse cx="${r * 0.6}" cy="${hy + r * 0.45}" rx="${r * 0.2}" ry="${r * 0.12}" fill="#FF9EB5" opacity="${blush}"/>`;
  const my = hy + r * 0.5;
  p += mouthSvg(look.mouth, opt.mood, k, adultish, r, my);
  // 상황 소품 (모자 등)
  p += prop(o.prop, hy, r, ry);
  // 아이템 (나이 상관없이 따라감, 상황 모자가 있으면 모자류만 잠깐 숨김)
  p += itemSvg(look.item, hy, r, ry, ex, ey, my, !!o.prop && ['cap', 'beanie', 'crown', 'ribbon', 'headphones'].includes(look.item));
  const lean = k === 'elder' ? 'rotate(4 0 0)' : '';
  return `<g transform="${lean}">${p}</g>`;
}

// 머리카락: 뒤(얼굴보다 먼저) · 앞(얼굴 위) · 땋은 머리(어깨 앞)
function hairBack(s, k, r, hy, ry, c) {
  const young = k === 'kid' || k === 'elem';
  if (k === 'elder') return LONG_HAIR.includes(s) ? `<circle cx="0" cy="${hy - r * 1.02}" r="${r * 0.32}" fill="${c}"/>` : s === 7 ? curls(r, hy, c) : '';
  switch (s) {
    case 2: return `<rect x="${-r * 1.08}" y="${hy - r * 0.6}" width="${r * 2.16}" height="${r * 1.2}" rx="${r * 0.5}" fill="${c}"/>`;
    case 3: return `<rect x="${-r * 1.05}" y="${hy - r * 0.5}" width="${r * 2.1}" height="${r * (young ? 1.25 : 1.55)}" rx="${r * 0.45}" fill="${c}"/>`;
    case 4: return `<ellipse cx="${r * 0.95}" cy="${hy - r * 0.2}" rx="${r * 0.28}" ry="${r * 0.5}" fill="${c}"/>`;
    case 5: return [-1, 1].map(d => `<g transform="translate(${d * r * 1.02} ${hy - r * 0.05}) rotate(${d * -14})"><ellipse cy="${r * 0.5}" rx="${r * 0.25}" ry="${r * 0.55}" fill="${c}"/><circle r="${r * 0.12}" fill="#FF6B9A"/></g>`).join('');
    case 6: return `<circle cx="0" cy="${hy - ry - r * 0.18}" r="${r * 0.36}" fill="${c}"/>`;
    case 7: return curls(r, hy, c);
    case 10: return `<rect x="${-r * 1.08}" y="${hy - r * 0.6}" width="${r * 2.16}" height="${r * (young ? 1.3 : 1.5)}" rx="${r * 0.3}" fill="${c}"/>`;
    case 13: {
      const h = r * (young ? 1.3 : 1.6);
      return `<rect x="${-r * 1.05}" y="${hy - r * 0.5}" width="${r * 2.1}" height="${h}" rx="${r * 0.45}" fill="${c}"/>`
        + [0.15, 0.55, 0.95].filter(t => t * r < h - r * 0.6).map(t => `<circle cx="${-r * 1.08}" cy="${hy + t * r}" r="${r * 0.2}" fill="${c}"/><circle cx="${r * 1.08}" cy="${hy + t * r}" r="${r * 0.2}" fill="${c}"/>`).join('');
    }
    case 16: return `<path d="M ${r * 0.15} ${hy - ry * 0.95} Q ${r * 1.45} ${hy - ry * 1.05} ${r * 1.08} ${hy + r * 0.75}" stroke="${c}" stroke-width="${r * 0.4}" fill="none" stroke-linecap="round"/>`;
    default: return '';
  }
}
function curls(r, hy, c) {
  return [[-1, 0.25], [-1.05, -0.2], [-0.85, -0.65], [-0.45, -0.95], [0, -1.05], [0.45, -0.95], [0.85, -0.65], [1.05, -0.2], [1, 0.25]]
    .map(([x, y]) => `<circle cx="${x * r}" cy="${hy + y * r}" r="${r * 0.32}" fill="${c}"/>`).join('');
}
function hairFront(s, k, r, hy, ry, c) {
  const cap = (b, extra = '') => `<path d="M ${-r * 1.03} ${hy + r * 0.12} C ${-r * 1.1} ${hy - ry * 1.4}, ${r * 1.1} ${hy - ry * 1.4}, ${r * 1.03} ${hy + r * 0.12}
          C ${r * 0.78} ${hy - r * 0.3}, ${r * 0.45} ${hy - r * (b - 0.1)}, ${r * 0.18} ${hy - r * b}
          C ${r * 0.05} ${hy - r * (b - 0.12)}, ${-r * 0.2} ${hy - r * (b - 0.14)}, ${-r * 0.32} ${hy - r * b}
          C ${-r * 0.55} ${hy - r * (b - 0.1)}, ${-r * 0.85} ${hy - r * 0.3}, ${-r * 1.03} ${hy + r * 0.12} Z" fill="${c}" ${extra}/>`;
  if (k === 'elder') return cap(0.55);
  const tie = (x, y) => `<circle cx="${x}" cy="${y}" r="${r * 0.11}" fill="#FF6B9A"/>`;
  const topY = hy - ry;
  switch (s) {
    case 0: return cap(0.42) + `<path d="M ${r * 0.3} ${hy - r * 1.05} q 10 -16 22 -8" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    case 1: return cap(0.42) + `<path d="M ${-r * 0.5} ${hy - ry * 0.95} l -8 -16 l 14 8 l 4 -18 l 8 16 l 10 -14 l 2 18" fill="${c}"/>`;
    case 4: return cap(0.42) + tie(r * 0.88, hy - r * 0.62);
    case 7: return cap(0.5) + [-0.62, -0.25, 0.12, 0.5].map(x => `<circle cx="${x * r}" cy="${hy - r * 0.5}" r="${r * 0.22}" fill="${c}"/>`).join('');
    case 8: return cap(0.66, 'opacity=".8"');
    case 9: return cap(0.62) + `<path d="M ${-r * 0.3} ${topY + r * 0.02} Q ${r * 0.9} ${topY + r * 0.05} ${r * 1.02} ${hy + r * 0.05} Q ${r * 0.45} ${hy - r * 0.05} ${-r * 0.3} ${topY + r * 0.02} Z" fill="${c}"/><path d="M ${-r * 0.3} ${topY + r * 0.04} Q ${-r * 0.36} ${hy - r * 0.62} ${-r * 0.5} ${hy - r * 0.52}" stroke="${shade(c, 40)}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    case 10: case 14: { const side = s === 10 ? 0.5 : 0.15; return `<path d="M ${-r * 1.04} ${hy + r * side} C ${-r * 1.12} ${hy - ry * 1.42}, ${r * 1.12} ${hy - ry * 1.42}, ${r * 1.04} ${hy + r * side} L ${r * 0.98} ${hy - r * 0.12} L ${-r * 0.98} ${hy - r * 0.12} Z" fill="${c}"/>`; }
    case 12: return cap(0.7, 'opacity=".75"') + `<path d="M ${-r * 0.2} ${topY + r * 0.15} L ${-r * 0.24} ${topY - r * 0.22} L ${-r * 0.08} ${topY - r * 0.06} L 0 ${topY - r * 0.4} L ${r * 0.08} ${topY - r * 0.06} L ${r * 0.24} ${topY - r * 0.22} L ${r * 0.2} ${topY + r * 0.15} Z" fill="${c}"/>`;
    case 15: return `<path d="M ${-r * 1.03} ${hy + r * 0.05} C ${-r * 1.1} ${hy - ry * 1.4}, ${r * 1.1} ${hy - ry * 1.4}, ${r * 1.03} ${hy + r * 0.05} C ${r * 0.8} ${hy - r * 1.0}, ${-r * 0.8} ${hy - r * 1.0}, ${-r * 1.03} ${hy + r * 0.05} Z" fill="${c}"/><path d="M ${-r * 0.4} ${hy - r * 0.86} Q 0 ${topY - r * 0.02} ${r * 0.4} ${hy - r * 0.86}" stroke="${shade(c, 45)}" stroke-width="2.5" fill="none" opacity=".6"/>`;
    case 16: return cap(0.42) + tie(r * 0.18, topY + r * 0.06);
    default: return cap(0.42); // 단발·긴 머리·양갈래·똥머리·땋은 머리·웨이브
  }
}
function braid(r, hy, c) {
  return [0, 1, 2, 3].map(i => `<ellipse cx="${-r * (0.78 - i * 0.04)}" cy="${hy + r * (0.55 + i * 0.3)}" rx="${r * 0.19}" ry="${r * 0.17}" fill="${c}" stroke="${shade(c, -25)}" stroke-width="1.5"/>`).join('')
    + `<circle cx="${-r * 0.66}" cy="${hy + r * 1.62}" r="${r * 0.1}" fill="#FF6B9A"/><path d="M ${-r * 0.66} ${hy + r * 1.66} l -5 ${r * 0.22} l 10 0 Z" fill="${c}"/>`;
}
// 눈 (기분이 좋으면 웃는 눈, 나쁘면 시무룩 — 평소엔 고른 모양)
function eyesSvg(s, mood, k, adultish, ex, ey, erx, ery) {
  const D = '#2B2340', both = fn => fn(-1) + fn(1);
  if (k === 'elder' || mood === 'g' || s === 2) return `<path d="M ${-ex - erx} ${ey} q ${erx} ${-ery * 1.1} ${erx * 2} 0 M ${ex - erx} ${ey} q ${erx} ${-ery * 1.1} ${erx * 2} 0" stroke="${D}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  if (mood === 'b') return `<path d="M ${-ex - erx * 1.1} ${ey - ery * 0.95} L ${-ex + erx * 0.9} ${ey - ery * 1.55} M ${ex + erx * 1.1} ${ey - ery * 0.95} L ${ex - erx * 0.9} ${ey - ery * 1.55}" stroke="${D}" stroke-width="3.5" stroke-linecap="round"/><ellipse cx="${-ex}" cy="${ey + 3}" rx="${erx * 0.7}" ry="${ery * 0.7}" fill="${D}"/><ellipse cx="${ex}" cy="${ey + 3}" rx="${erx * 0.7}" ry="${ery * 0.7}" fill="${D}"/>`;
  const dot = x => `<ellipse cx="${x}" cy="${ey}" rx="${erx}" ry="${ery}" fill="${D}"/><circle cx="${x + erx * 0.35}" cy="${ey - ery * 0.35}" r="${erx * 0.42}" fill="#fff"/>`;
  switch (s) {
    case 1: return both(d => `<ellipse cx="${d * ex}" cy="${ey}" rx="${erx * 1.22}" ry="${ery * 1.22}" fill="${D}"/><circle cx="${d * ex + erx * 0.4}" cy="${ey - ery * 0.4}" r="${erx * 0.5}" fill="#fff"/><circle cx="${d * ex - erx * 0.35}" cy="${ey + ery * 0.45}" r="${erx * 0.25}" fill="#fff"/>`);
    case 3: return both(d => `<path d="M ${d * ex - erx * 1.1} ${ey - ery * 0.1} L ${d * ex + erx * 1.1} ${ey - ery * 0.1} A ${erx * 1.1} ${ery * 0.8} 0 0 1 ${d * ex - erx * 1.1} ${ey - ery * 0.1} Z" fill="${D}"/>`);
    case 4: return both(d => `<path d="M ${d * (ex - erx * 1.15)} ${ey + ery * 0.2} Q ${d * ex} ${ey - ery * 1.3} ${d * (ex + erx * 1.35)} ${ey - ery * 0.55} Q ${d * (ex + erx * 0.2)} ${ey + ery} ${d * (ex - erx * 1.15)} ${ey + ery * 0.2} Z" fill="${D}"/><circle cx="${d * ex + erx * 0.25}" cy="${ey - ery * 0.2}" r="${erx * 0.32}" fill="#fff"/>`);
    case 5: return both(d => `<circle cx="${d * ex}" cy="${ey}" r="${erx * 0.62}" fill="${D}"/>`);
    case 6: return both(d => dot(d * ex) + `<path d="M ${d * (ex + erx * 0.6)} ${ey - ery * 0.8} l ${d * 5} -4 M ${d * (ex + erx * 0.95)} ${ey - ery * 0.35} l ${d * 6} -2" stroke="${D}" stroke-width="2.2" stroke-linecap="round"/>`);
    default: return dot(-ex) + dot(ex) + (adultish ? `<path d="M ${-ex - erx - 2} ${ey - ery * 0.7} l -5 -3 M ${ex + erx + 2} ${ey - ery * 0.7} l 5 -3" stroke="${D}" stroke-width="2.5" stroke-linecap="round"/>` : '');
  }
}
// 입 (아기는 쪽쪽이, 기분이 나쁘면 시무룩)
function mouthSvg(s, mood, k, adultish, r, my) {
  const M = '#C0505A';
  if (k === 'baby') return `<ellipse cx="0" cy="${my + 2}" rx="${r * 0.3}" ry="${r * 0.17}" fill="#7DD3FC"/><circle cx="0" cy="${my + 2}" r="${r * 0.08}" fill="#fff"/><circle cx="0" cy="${my + r * 0.22}" r="${r * 0.12}" fill="none" stroke="#FF8FB1" stroke-width="3.5"/>`;
  if (mood === 'b') return `<path d="M ${-r * 0.14} ${my + 6} Q 0 ${my - 4} ${r * 0.14} ${my + 6}" stroke="${M}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  switch (s) {
    case 1: return `<path d="M ${-r * 0.2} ${my} Q 0 ${my + r * 0.34} ${r * 0.2} ${my} Z" fill="${M}"/><rect x="${-r * 0.14}" y="${my}" width="${r * 0.28}" height="${r * 0.07}" fill="#fff"/>`;
    case 2: return `<path d="M ${-r * 0.17} ${my} q ${r * 0.085} ${r * 0.13} ${r * 0.17} 0 q ${r * 0.085} ${r * 0.13} ${r * 0.17} 0" stroke="${M}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    case 3: return `<ellipse cx="0" cy="${my + r * 0.07}" rx="${r * 0.08}" ry="${r * 0.1}" fill="${M}"/>`;
    case 4: return `<ellipse cx="${r * 0.06}" cy="${my + r * 0.13}" rx="${r * 0.08}" ry="${r * 0.1}" fill="#FF7A8A"/><path d="M ${-r * 0.16} ${my} Q 0 ${my + r * 0.16} ${r * 0.16} ${my}" stroke="${M}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    case 5: return `<path d="M ${-r * 0.12} ${my + r * 0.05} L ${r * 0.12} ${my + r * 0.05}" stroke="${M}" stroke-width="3.5" stroke-linecap="round"/>`;
    default: { const w = adultish ? 0.14 : 0.17; return `<path d="M ${-r * w} ${my} Q 0 ${my + r * (mood === 'g' ? 0.3 : 0.22)} ${r * w} ${my}" stroke="${M}" stroke-width="3.5" fill="${adultish && mood !== 'g' ? 'none' : '#FF8A8A'}" stroke-linecap="round"/>`; }
  }
}
// 신발 (발 두 개)
function shoesSvg(s, c, lx, lw, legs, SKIN) {
  const w = lw * 1.5, d = shade(c, -40), white = c === '#FFFFFF', sole = white ? '#DCD6EE' : '#fff', st = white ? 'stroke="#DCD6EE" stroke-width="1.5"' : '';
  return [-lx, lx].map(x => {
    switch (s) {
      case 1: return `<ellipse cx="${x}" cy="-4.5" rx="${w / 2}" ry="5.5" fill="${c}" ${st}/><ellipse cx="${x - w * 0.15}" cy="-6.5" rx="${w * 0.15}" ry="1.6" fill="#fff" opacity=".55"/>`;
      case 2: { const h = Math.max(10, legs * 0.36); return `<rect x="${x - lw / 2 - 2}" y="${-h}" width="${lw + 4}" height="${h}" rx="5" fill="${c}" ${st}/><ellipse cx="${x}" cy="-3.5" rx="${w / 2}" ry="4.5" fill="${c}" ${st}/><rect x="${x - w / 2}" y="-3" width="${w}" height="3" rx="1.5" fill="${d}"/>`; }
      case 3: return `<ellipse cx="${x}" cy="-4" rx="${w * 0.42}" ry="4.5" fill="${SKIN}"/><rect x="${x - w / 2}" y="-2.5" width="${w}" height="2.5" rx="1.2" fill="${d}"/><rect x="${x - w * 0.42}" y="-7.5" width="${w * 0.84}" height="3" rx="1.5" fill="${c}" ${st}/>`;
      case 4: { const h = Math.max(8, legs * 0.2); return `<rect x="${x - lw / 2 - 2}" y="${-h}" width="${lw + 4}" height="${h}" rx="4" fill="${c}" ${st}/><rect x="${x - w / 2}" y="-8" width="${w}" height="8" rx="4" fill="${c}" ${st}/><rect x="${x - w / 2}" y="-3.2" width="${w}" height="3.2" rx="1.6" fill="${sole}"/><circle cx="${x}" cy="${-h * 0.6}" r="2.2" fill="${sole}"/>`; }
      default: return `<rect x="${x - w / 2}" y="-9" width="${w}" height="9" rx="4.5" fill="${c}" ${st}/><rect x="${x - w / 2}" y="-3.2" width="${w}" height="3.2" rx="1.6" fill="${sole}"/><path d="M ${x - 3} -6.5 l 6 0" stroke="${white ? '#B8B2C8' : '#fff'}" stroke-width="1.6" stroke-linecap="round"/>`;
    }
  }).join('');
}
// 윗옷 무늬·깃·단추 (몸통 위에)
function topDetails(o, tw, top, torso, r) {
  const dk = shade(o.top, -28), white = o.top === '#FFFFFF', lt = white ? '#DCD6EE' : shade(o.top, 45);
  const hem = `<rect x="${-tw / 2 + 1}" y="${top + torso - 1}" width="${tw - 2}" height="7" rx="3.5" fill="${dk}"/>`;
  const wings = (fill, st) => `<path d="M -2 ${top + 1} L ${-r * 0.42} ${top + r * 0.1} L ${-r * 0.2} ${top + r * 0.55} Z M 2 ${top + 1} L ${r * 0.42} ${top + r * 0.1} L ${r * 0.2} ${top + r * 0.55} Z" fill="${fill}" stroke="${st}" stroke-width="1.5"/>`; // 턱 아래로 보이게
  let p = '';
  if (o.stripes) p += [0.22, 0.47, 0.72].map(t => `<rect x="${-tw / 2 + 2}" y="${top + torso * t}" width="${tw - 4}" height="${torso * 0.11}" fill="${white ? '#8FB8FF' : lt}"/>`).join('');
  if (o.logo) p += hem + `<path d="${starPath(0, top + torso * 0.45, r * 0.2)}" fill="${white ? '#FF6B9A' : '#fff'}"/>`;
  if (o.hood) p += `<rect x="${-tw * 0.3}" y="${top + torso * 0.58}" width="${tw * 0.6}" height="${torso * 0.3}" rx="7" fill="${dk}" opacity=".45"/>`;
  if (o.jacket) p += `<path d="M ${-tw * 0.2} ${top} L 0 ${top + torso * 0.55} L ${tw * 0.2} ${top} Z" fill="${o.inner}"/><path d="M ${-tw * 0.2} ${top} L ${-tw * 0.05} ${top + torso * 0.45} L ${-tw * 0.32} ${top + torso * 0.12} Z M ${tw * 0.2} ${top} L ${tw * 0.05} ${top + torso * 0.45} L ${tw * 0.32} ${top + torso * 0.12} Z" fill="${dk}"/><circle cx="0" cy="${top + torso * 0.72}" r="2.6" fill="${dk}"/>`;
  if (o.cardigan) p += `<rect x="${-tw * 0.14}" y="${top}" width="${tw * 0.28}" height="${torso + 6}" fill="${o.inner}"/>` + [0.3, 0.55, 0.8].map(t => `<circle cx="${-tw * 0.14 - 3}" cy="${top + torso * t}" r="2.4" fill="${dk}"/>`).join('');
  if (o.knit) p += hem + `<path d="M ${-tw * 0.22} ${top} L 0 ${top + torso * 0.42} L ${tw * 0.22} ${top} Z" fill="#FFFFFF" stroke="${dk}" stroke-width="3"/>` + wings('#fff', '#DCD6EE');
  if (o.collar) p += `<path d="M 0 ${top + r * 0.2} V ${top + torso}" stroke="${dk}" stroke-width="1.5"/>` + [0.38, 0.6, 0.82].map(t => `<circle cx="0" cy="${top + torso * t}" r="2.4" fill="${dk}"/>`).join('')
    + wings(white ? '#F2F0F8' : lt, dk);
  return p;
}
function starPath(cx, cy, R) {
  return Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * 0.45 : R; return `${i ? 'L' : 'M'} ${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`; }).join(' ') + ' Z';
}

// 내가 고른 옷 → 그리기 표시
function casualOf(look) {
  const top = CLOTHES[look.outfit] || CLOTHES[3];
  const o = { top, bottom: BOTTOM_COLORS[look.bottomColor] || BOTTOM_COLORS[0], shoes: look.shoes, shoeC: SHOE_COLORS[look.shoeColor] || SHOE_COLORS[1] };
  Object.assign(o, [{ shortSleeve: true }, {}, { stripes: true }, { hood: true }, { collar: true }, { cardigan: true, inner: '#FFFFFF' }, { jacket: true, inner: '#FFFFFF' }, { logo: true }, { knit: true, sleeveC: '#FFFFFF' }][look.top] || {});
  Object.assign(o, BOTTOM_FX[look.bottom] || {});
  if (o.dress) o.bottom = top; // 원피스는 윗옷 색으로 한 벌
  return o;
}
function outfitOf(k, f, look, opt) { // 평소 옷은 성별 상관없이 고른 대로, 정장·교복·결혼식 옷은 성별대로
  const wear = opt.wear || 'auto';
  const shoe = { shoes: look.shoes, shoeC: SHOE_COLORS[look.shoeColor] || SHOE_COLORS[1] };
  if (k === 'baby') return { top: '#FFE88A', bottom: '#FFE88A' };
  if (wear === 'collector') return { top: '#1E1E26', bottom: '#1E1E26', jacket: true, inner: '#FFFFFF', tie: '#1E1E26', shoes: 1, shoeC: '#111111' };
  if (wear === 'wedding' && (k === 'adult' || k === 'elder')) return f ? { top: '#FFFFFF', bottom: '#FFFFFF', dress: true, gown: true, prop: 'veil', shoes: 1, shoeC: '#FFFFFF' } : { top: '#2B2F4F', bottom: '#2B2F4F', jacket: true, inner: '#FFFFFF', bow: true, shoes: 1, shoeC: '#2B2F4F' };
  if (wear === 'suit' && k !== 'kid') return f ? { top: '#3F4C8C', bottom: '#3F4C8C', skirt: true, tie: '#FFFFFF', shoes: 1, shoeC: '#2B2F4F' } : { top: '#3F4C8C', bottom: '#2B2F4F', tie: '#FF6B6B', shoes: 1, shoeC: '#2B2F4F' };
  if (wear === 'sports') return { top: '#FF6B6B', bottom: '#2B3550', shortSleeve: true, shorts: true, number: true, shoes: 0, shoeC: '#FFFFFF' };
  if (wear === 'work') return { top: '#5A6FA8', bottom: '#3B4A6B', prop: 'goggles', ...shoe };
  if (wear === 'travel') return { ...casualOf(look), shortSleeve: true, prop: 'sunhat' };
  if (wear === 'grad') return { ...schoolUniform(k, f), ...shoe, flowers: true };
  if (wear === 'job' && (k === 'adult' || k === 'elder')) return { ...jobOutfit(opt.track, opt.field), ...shoe };
  if (k === 'mid' || k === 'high') return { ...schoolUniform(k, f), ...shoe };
  return { ...casualOf(look), bag: k === 'elem' ? '#FFC93C' : null }; // 유아·초등·어른·노년은 내가 고른 옷
}
function schoolUniform(k, skirt) {
  return k === 'mid' ? { top: '#3F4C8C', bottom: skirt ? '#5B6BB0' : '#6B7280', tie: '#FF6B6B', skirt, socks: skirt }
                     : { top: '#2E3550', bottom: skirt ? '#4B5070' : '#4B5563', tie: '#7B6CFF', skirt, socks: skirt };
}
function prop(pr, hy, r, ry) {
  const top = hy - ry;
  switch (pr) {
    case 'helmet': return `<path d="M ${-r * 1.1} ${hy - r * 0.35} Q 0 ${top - r * 0.75} ${r * 1.1} ${hy - r * 0.35} Z" fill="#FFD23F"/><rect x="${-r * 1.2}" y="${hy - r * 0.42}" width="${r * 2.4}" height="${r * 0.16}" rx="4" fill="#F5B800"/>`;
    case 'chef': return `<circle cx="${-r * 0.42}" cy="${top - r * 0.32}" r="${r * 0.32}" fill="#fff" stroke="#DCD6EE" stroke-width="2"/><circle cx="${r * 0.42}" cy="${top - r * 0.32}" r="${r * 0.32}" fill="#fff" stroke="#DCD6EE" stroke-width="2"/><circle cx="0" cy="${top - r * 0.42}" r="${r * 0.34}" fill="#fff" stroke="#DCD6EE" stroke-width="2"/><rect x="${-r * 0.7}" y="${top - r * 0.3}" width="${r * 1.4}" height="${r * 0.55}" rx="4" fill="#fff" stroke="#DCD6EE" stroke-width="2"/>`;
    case 'pilot': return `<path d="M ${-r * 1.0} ${hy - r * 0.5} Q 0 ${top - r * 0.6} ${r * 1.0} ${hy - r * 0.5} Z" fill="#2B3550"/><rect x="${-r * 1.15}" y="${hy - r * 0.56}" width="${r * 2.3}" height="${r * 0.18}" rx="5" fill="#1E2640"/><circle cx="0" cy="${hy - r * 0.85}" r="${r * 0.16}" fill="#FFD23F"/>`;
    case 'goggles': return `<rect x="${-r * 0.85}" y="${hy - r * 0.05}" width="${r * 1.7}" height="${r * 0.42}" rx="${r * 0.2}" fill="#8FD3FF" opacity=".55" stroke="#2B3550" stroke-width="3"/>`;
    case 'headset': return `<path d="M ${-r * 0.95} ${hy} Q 0 ${top - r * 0.5} ${r * 0.95} ${hy}" stroke="#2B2F4F" stroke-width="5" fill="none"/><rect x="${-r * 1.1}" y="${hy - r * 0.15}" width="${r * 0.3}" height="${r * 0.45}" rx="5" fill="#2B2F4F"/><path d="M ${-r * 0.9} ${hy + r * 0.3} Q ${-r * 0.6} ${hy + r * 0.7} ${-r * 0.2} ${hy + r * 0.62}" stroke="#2B2F4F" stroke-width="3" fill="none"/>`;
    case 'beret': return `<ellipse cx="${-r * 0.1}" cy="${top + r * 0.1}" rx="${r * 0.95}" ry="${r * 0.32}" fill="#E8505B"/><circle cx="${-r * 0.1}" cy="${top - r * 0.2}" r="${r * 0.08}" fill="#E8505B"/>`;
    case 'cap': return `<path d="M ${-r * 0.95} ${hy - r * 0.45} Q 0 ${top - r * 0.6} ${r * 0.95} ${hy - r * 0.45} Z" fill="#5BA36B"/><path d="M ${r * 0.3} ${hy - r * 0.48} L ${r * 1.45} ${hy - r * 0.42} L ${r * 0.9} ${hy - r * 0.62} Z" fill="#3B7A4B"/>`;
    case 'glasses': return `<rect x="${-r * 0.62}" y="${hy + r * 0.0}" width="${r * 0.5}" height="${r * 0.32}" rx="6" fill="none" stroke="#3F3A5A" stroke-width="3"/><rect x="${r * 0.12}" y="${hy + r * 0.0}" width="${r * 0.5}" height="${r * 0.32}" rx="6" fill="none" stroke="#3F3A5A" stroke-width="3"/>`;
    case 'headphones': return `<path d="M ${-r * 1.0} ${hy} Q 0 ${top - r * 0.6} ${r * 1.0} ${hy}" stroke="#FF6B9A" stroke-width="6" fill="none"/><rect x="${-r * 1.18}" y="${hy - r * 0.2}" width="${r * 0.32}" height="${r * 0.5}" rx="6" fill="#FF6B9A"/><rect x="${r * 0.86}" y="${hy - r * 0.2}" width="${r * 0.32}" height="${r * 0.5}" rx="6" fill="#FF6B9A"/>`;
    case 'veil': return [-0.5, 0, 0.5].map(x => `<circle cx="${x * r}" cy="${top + r * (x ? 0.1 : -0.02)}" r="${r * (x ? 0.12 : 0.14)}" fill="${x ? '#FF9EC4' : '#FFFFFF'}" stroke="#F5B8CF" stroke-width="1.5"/>`).join('');
    case 'sunhat': return `<ellipse cx="0" cy="${hy - r * 0.55}" rx="${r * 1.45}" ry="${r * 0.28}" fill="#F2D27A"/><path d="M ${-r * 0.75} ${hy - r * 0.6} Q 0 ${top - r * 0.5} ${r * 0.75} ${hy - r * 0.6} Z" fill="#F2D27A"/><rect x="${-r * 0.75}" y="${hy - r * 0.72}" width="${r * 1.5}" height="${r * 0.14}" fill="#FF8FB1"/>`;
    default: return '';
  }
}
function itemSvg(it, hy, r, ry, ex, ey, my, hideHat) {
  const top = hy - ry;
  switch (it) {
    case 'cap': return hideHat ? '' : `<path d="M ${-r * 0.95} ${hy - r * 0.45} Q 0 ${top - r * 0.6} ${r * 0.95} ${hy - r * 0.45} Z" fill="#5B6BD9"/><path d="M ${r * 0.3} ${hy - r * 0.48} L ${r * 1.45} ${hy - r * 0.42} L ${r * 0.9} ${hy - r * 0.62} Z" fill="#3F4CA8"/>`;
    case 'beanie': return hideHat ? '' : `<path d="M ${-r * 0.98} ${hy - r * 0.35} Q 0 ${top - r * 0.9} ${r * 0.98} ${hy - r * 0.35} Z" fill="#FF7A6B"/><rect x="${-r}" y="${hy - r * 0.45}" width="${r * 2}" height="${r * 0.2}" rx="6" fill="#E85A4B"/><circle cx="0" cy="${top - r * 0.55}" r="${r * 0.18}" fill="#fff"/>`;
    case 'crown': return hideHat ? '' : `<path d="M ${-r * 0.6} ${top + r * 0.05} L ${-r * 0.6} ${top - r * 0.45} L ${-r * 0.3} ${top - r * 0.2} L 0 ${top - r * 0.55} L ${r * 0.3} ${top - r * 0.2} L ${r * 0.6} ${top - r * 0.45} L ${r * 0.6} ${top + r * 0.05} Z" fill="#FFD23F" stroke="#E0A800" stroke-width="2"/>`;
    case 'glasses': return `<circle cx="${-ex}" cy="${ey - 2}" r="${r * 0.24}" fill="none" stroke="#3F3A5A" stroke-width="3"/><circle cx="${ex}" cy="${ey - 2}" r="${r * 0.24}" fill="none" stroke="#3F3A5A" stroke-width="3"/><path d="M ${-ex + r * 0.24} ${ey - 2} L ${ex - r * 0.24} ${ey - 2}" stroke="#3F3A5A" stroke-width="3"/>`;
    case 'sunglasses': return `<rect x="${-ex - r * 0.28}" y="${ey - r * 0.2}" width="${r * 0.56}" height="${r * 0.36}" rx="${r * 0.12}" fill="#1E1E2A"/><rect x="${ex - r * 0.28}" y="${ey - r * 0.2}" width="${r * 0.56}" height="${r * 0.36}" rx="${r * 0.12}" fill="#1E1E2A"/><path d="M ${-ex + r * 0.28} ${ey - 2} L ${ex - r * 0.28} ${ey - 2}" stroke="#1E1E2A" stroke-width="3"/>`;
    case 'mustache': return `<path d="M 0 ${my - 4} q -10 -8 -24 2 q 12 2 24 -1 q 12 3 24 1 q -14 -10 -24 -2" fill="#3B2B2B"/>`;
    case 'beard': return `<path d="M ${-r * 0.75} ${hy + r * 0.3} Q ${-r * 0.7} ${hy + r * 1.25} 0 ${hy + r * 1.3} Q ${r * 0.7} ${hy + r * 1.25} ${r * 0.75} ${hy + r * 0.3} Q ${r * 0.4} ${hy + r * 0.85} 0 ${hy + r * 0.8} Q ${-r * 0.4} ${hy + r * 0.85} ${-r * 0.75} ${hy + r * 0.3} Z" fill="#4A3B33"/>`;
    case 'santa': return `<path d="M ${-r * 0.85} ${hy + r * 0.25} Q ${-r * 0.9} ${hy + r * 1.5} 0 ${hy + r * 1.6} Q ${r * 0.9} ${hy + r * 1.5} ${r * 0.85} ${hy + r * 0.25} Q ${r * 0.4} ${hy + r * 0.8} 0 ${hy + r * 0.75} Q ${-r * 0.4} ${hy + r * 0.8} ${-r * 0.85} ${hy + r * 0.25} Z" fill="#fff" stroke="#E6E6EE" stroke-width="2"/>`;
    case 'ribbon': return hideHat ? '' : `<path d="M ${r * 0.35} ${top + r * 0.15} l -18 -14 l 0 28 Z M ${r * 0.35} ${top + r * 0.15} l 18 -14 l 0 28 Z" fill="#FF6B9A"/><circle cx="${r * 0.35}" cy="${top + r * 0.15}" r="6" fill="#E84B80"/>`;
    case 'headphones': return hideHat ? '' : `<path d="M ${-r * 1.0} ${hy} Q 0 ${top - r * 0.6} ${r * 1.0} ${hy}" stroke="#7B6CFF" stroke-width="6" fill="none"/><rect x="${-r * 1.18}" y="${hy - r * 0.2}" width="${r * 0.32}" height="${r * 0.5}" rx="6" fill="#7B6CFF"/><rect x="${r * 0.86}" y="${hy - r * 0.2}" width="${r * 0.32}" height="${r * 0.5}" rx="6" fill="#7B6CFF"/>`;
    case 'sticker': return `<path d="M ${r * 0.62} ${hy + r * 0.28} l 4 9 l 10 1 l -7 7 l 2 10 l -9 -5 l -9 5 l 2 -10 l -7 -7 l 10 -1 Z" fill="#FFD23F"/>`;
    default: return '';
  }
}
function shade(hex, d) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + d));
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => c(v).toString(16).padStart(2, '0')).join('');
}

// 얼굴만 (상태창·명단용)
export function headBox(age = 'adult') {
  const { r, torso, legs } = AGE[age] || AGE.adult;
  const hy = -(legs + torso) - r * 0.82;
  return `-66 ${(hy - 66).toFixed(0)} 132 132`;
}
export function faceSvg(look, gender, age = 'adult', size = 60, extra = '') {
  return `<svg viewBox="${headBox(age)}" width="${size}" height="${size}" ${extra}>${avatar(look, { age, gender })}</svg>`;
}
export function fullSvg(look, opt, w = 120, h = 200) {
  return `<svg viewBox="-75 -270 150 280" width="${w}" height="${h}">${avatar(look, opt)}</svg>`;
}
// 꾸미기 창 미리 보기용: 몸의 한 부분만 (어른 기준)
export const BOX = { top: '-52 -170 104 104', bottom: '-50 -98 100 100', shoes: '-34 -44 68 46' };
export function cropSvg(look, opt, box, w, h) {
  return `<svg viewBox="${box}" width="${w}" height="${h}">${avatar(look, opt)}</svg>`;
}
export const COM_LOOK = { skin: 0, hair: 0, hairColor: 0, outfit: 3, item: null, robot: true };
// 진행자: 로봇 '띵동'(마이크) · 전구 '반짝' — 우리 게임만의 캐릭터 (mood: talk · cheer)
export function mcSvg(who, mood = 'talk', size = 150) {
  const up = mood === 'cheer';
  const eyes = (x, y, c) => up ? `<path d="M ${-x - 6} ${y + 2} q 6 -9 12 0 M ${x - 6} ${y + 2} q 6 -9 12 0" stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="${-x}" cy="${y}" rx="5" ry="7" fill="${c}"/><ellipse cx="${x}" cy="${y}" rx="5" ry="7" fill="${c}"/><circle cx="${-x + 2}" cy="${y - 3}" r="2" fill="#fff"/><circle cx="${x + 2}" cy="${y - 3}" r="2" fill="#fff"/>`;
  let g;
  if (who === 'bulb') {
    const arm = up ? 'M -32 -80 Q -50 -98 -42 -116 M 32 -80 Q 50 -98 42 -116' : 'M -33 -74 Q -48 -62 -42 -48 M 33 -74 Q 48 -62 42 -48';
    g = `${up ? [-150, -120, -90, -60, -30].map(d => { const r = d * Math.PI / 180; return `<path d="M ${(44 * Math.cos(r)).toFixed(1)} ${(-88 + 44 * Math.sin(r)).toFixed(1)} L ${(56 * Math.cos(r)).toFixed(1)} ${(-88 + 56 * Math.sin(r)).toFixed(1)}" stroke="#FFD23F" stroke-width="5" stroke-linecap="round"/>`; }).join('') : ''}
      <path d="${arm}" stroke="#5B6478" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M -6 -29 L -9 -4 M 6 -29 L 9 -4" stroke="#5B6478" stroke-width="5" stroke-linecap="round"/><ellipse cx="-11" cy="-3" rx="8" ry="4" fill="#5B6478"/><ellipse cx="11" cy="-3" rx="8" ry="4" fill="#5B6478"/>
      <circle cy="-88" r="36" fill="#FFE97A" stroke="#F2C230" stroke-width="3"/><ellipse cx="-15" cy="-104" rx="7" ry="11" fill="#fff" opacity=".7"/>
      <path d="M -18 -58 Q 0 -51 18 -58 L 14 -48 L -14 -48 Z" fill="#FFE97A" stroke="#F2C230" stroke-width="2"/>
      <rect x="-16" y="-50" width="32" height="8" rx="3" fill="#9AA3B5"/><rect x="-14" y="-42" width="28" height="7" rx="3" fill="#7A8399"/><rect x="-10" y="-35" width="20" height="6" rx="3" fill="#5B6478"/>
      ${eyes(11, -90, '#3B2F4A')}<circle cx="-22" cy="-78" r="5" fill="#FF9EB5" opacity=".8"/><circle cx="22" cy="-78" r="5" fill="#FF9EB5" opacity=".8"/>
      ${up ? '<path d="M -10 -76 Q 0 -62 10 -76 Z" fill="#C0505A"/>' : '<ellipse cy="-72" rx="6" ry="5" fill="#C0505A"/>'}
      <path d="M -10 -48 L 0 -44 L -10 -40 Z M 10 -48 L 0 -44 L 10 -40 Z" fill="#3BB273"/>`;
  } else {
    const arms = up ? 'M -30 -42 Q -48 -58 -42 -78 M 30 -42 Q 48 -58 42 -78' : 'M -30 -40 Q -44 -30 -40 -16 M 30 -40 Q 46 -48 38 -64';
    const mic = up ? '<rect x="37" y="-96" width="10" height="16" rx="5" fill="#3B3B48"/><circle cx="42" cy="-98" r="7" fill="#9AA3B5"/>' : '<rect x="33" y="-80" width="10" height="16" rx="5" fill="#3B3B48"/><circle cx="38" cy="-82" r="7" fill="#9AA3B5"/>';
    g = `<line x1="0" y1="-128" x2="0" y2="-112" stroke="#5B6B8C" stroke-width="4"/><circle cy="-133" r="7" fill="${up ? '#FFE14D' : '#FFD23F'}" stroke="#E8A200" stroke-width="2"/>
      <rect x="-20" y="-10" width="14" height="10" rx="5" fill="#2E9E8F"/><rect x="6" y="-10" width="14" height="10" rx="5" fill="#2E9E8F"/>
      <rect x="-30" y="-50" width="60" height="44" rx="16" fill="#5ED6CB" stroke="#2E9E8F" stroke-width="3"/><rect x="-16" y="-38" width="32" height="20" rx="6" fill="#E9FBF9"/>
      <circle cx="-7" cy="-28" r="3" fill="#FF6B6B"/><circle cx="2" cy="-28" r="3" fill="#FFD23F"/><circle cx="11" cy="-28" r="3" fill="#4A9BFF"/>
      <path d="${arms}" stroke="#2E9E8F" stroke-width="7" fill="none" stroke-linecap="round"/>${mic}
      <rect x="-48" y="-92" width="10" height="22" rx="5" fill="#2E9E8F"/><rect x="38" y="-92" width="10" height="22" rx="5" fill="#2E9E8F"/>
      <rect x="-40" y="-112" width="80" height="62" rx="22" fill="#5ED6CB" stroke="#2E9E8F" stroke-width="3"/><rect x="-30" y="-103" width="60" height="44" rx="14" fill="#1E2A44"/>
      ${eyes(12, -86, '#7DF9FF')}${up ? '<path d="M -9 -74 Q 0 -63 9 -74 Z" fill="#7DF9FF"/>' : '<ellipse cy="-71" rx="7" ry="4.5" fill="#7DF9FF"/>'}
      <circle cx="-22" cy="-70" r="4" fill="#FF9EB5" opacity=".75"/><circle cx="22" cy="-70" r="4" fill="#FF9EB5" opacity=".75"/>
      <path d="M -14 -50 L 0 -44 L -14 -38 Z M 14 -50 L 0 -44 L 14 -38 Z" fill="#E8505B"/><circle cy="-44" r="3.5" fill="#C03A45"/>`;
  }
  return `<svg viewBox="-62 -150 124 154" width="${size}" height="${Math.round(size * 154 / 124)}">${g}</svg>`;
}
export function robotFace(size = 60) {
  return `<svg viewBox="0 0 80 96" width="${size}" height="${size}"><line x1="40" y1="8" x2="40" y2="22" stroke="#7B6CFF" stroke-width="4"/><circle cx="40" cy="7" r="6" fill="#FFE14D"/><rect x="6" y="20" width="68" height="54" rx="20" fill="#E9F3FF" stroke="#7B6CFF" stroke-width="4"/><rect x="16" y="30" width="48" height="32" rx="12" fill="#2E3A66"/><path d="M24 48 Q30 40 36 48 M44 48 Q50 40 56 48" stroke="#7DF9C8" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`;
}
export function robotFull(w = 120, h = 200) {
  return `<svg viewBox="-75 -270 150 280" width="${w}" height="${h}"><g transform="translate(-60 -250) scale(1.5)"><line x1="40" y1="8" x2="40" y2="22" stroke="#7B6CFF" stroke-width="4"/><circle cx="40" cy="7" r="6" fill="#FFE14D"/><rect x="6" y="20" width="68" height="54" rx="20" fill="#E9F3FF" stroke="#7B6CFF" stroke-width="4"/><rect x="16" y="30" width="48" height="32" rx="12" fill="#2E3A66"/><path d="M24 48 Q30 40 36 48 M44 48 Q50 40 56 48" stroke="#7DF9C8" stroke-width="4" fill="none" stroke-linecap="round"/><rect x="18" y="76" width="44" height="60" rx="16" fill="#C9D8FF" stroke="#7B6CFF" stroke-width="4"/><rect x="22" y="136" width="12" height="30" rx="6" fill="#7B6CFF"/><rect x="46" y="136" width="12" height="30" rx="6" fill="#7B6CFF"/></g></svg>`;
}

/* ═════════════ 장면 배경 (조립식: 바탕 틀 + 소품) ═════════════ */
const IN = (wall, floor) => `<rect width="1000" height="480" fill="${wall}"/><rect y="330" width="1000" height="150" fill="${floor}"/><path d="M0 330 H1000" stroke="${shade(floor, -30)}" stroke-width="6"/><g fill="${shade(floor, -12)}" opacity=".5"><rect y="380" width="1000" height="4"/><rect y="428" width="1000" height="4"/></g>`;
const OUT = (sky, ground, sun = true) => `<rect width="1000" height="480" fill="${sky}"/>${sun ? '<circle cx="860" cy="80" r="42" fill="#FFE68A"/>' : ''}<g fill="#fff" opacity=".85"><ellipse cx="180" cy="90" rx="60" ry="22"/><ellipse cx="225" cy="75" rx="40" ry="22"/><ellipse cx="560" cy="60" rx="50" ry="18"/></g><path d="M0 330 Q250 300 500 330 T1000 320 V480 H0 Z" fill="${ground}"/>`;
const NIGHT = (ground = '#2E3A66') => `<rect width="1000" height="480" fill="#1E2550"/><circle cx="840" cy="80" r="36" fill="#FFF3B0"/><circle cx="828" cy="72" r="34" fill="#1E2550"/><g fill="#fff">${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 137) % 1000}" cy="${(i * 53) % 220}" r="${i % 3 ? 1.5 : 2.5}"/>`).join('')}</g><path d="M0 340 H1000 V480 H0 Z" fill="${ground}"/>`;
const WIN = (x, y = 50, w = 200, h = 150) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#BDE8FF" stroke="#fff" stroke-width="10"/><path d="M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}" stroke="#fff" stroke-width="8"/>`;
const TREE = (x, y = 330, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-8" y="-60" width="16" height="60" fill="#8E5E32"/><circle cy="-80" r="42" fill="#6CC46C"/><circle cx="-26" cy="-60" r="28" fill="#5BB35B"/><circle cx="26" cy="-62" r="28" fill="#5BB35B"/></g>`;
const DESK = (x, y = 300, c = '#C99A5E') => `<rect x="${x}" y="${y}" width="140" height="16" rx="5" fill="${c}"/><rect x="${x + 10}" y="${y + 16}" width="10" height="60" fill="${shade(c, -30)}"/><rect x="${x + 120}" y="${y + 16}" width="10" height="60" fill="${shade(c, -30)}"/>`;
const BOARD = (x = 330, y = 60, c = '#2F5E4E') => `<rect x="${x}" y="${y}" width="360" height="170" rx="10" fill="${c}" stroke="#B07A45" stroke-width="10"/><path d="M${x + 30} ${y + 50} h120 M${x + 30} ${y + 85} h200" stroke="#fff" stroke-width="5" opacity=".6"/>`;
const SHELF = (x, y = 70) => `<rect x="${x}" y="${y}" width="190" height="200" rx="8" fill="#B07A45"/><g fill="#D9A46A"><rect x="${x + 10}" y="${y + 10}" width="170" height="54"/><rect x="${x + 10}" y="${y + 73}" width="170" height="54"/><rect x="${x + 10}" y="${y + 136}" width="170" height="54"/></g><g>${[0, 1, 2].map(r => [0, 1, 2, 3, 4].map(c => `<rect x="${x + 16 + c * 32}" y="${y + 18 + r * 63}" width="22" height="44" rx="3" fill="${['#FF8C8C', '#8FB8FF', '#7DD3A8', '#FFD54A', '#B79CFF'][(r + c) % 5]}"/>`).join('')).join('')}</g>`;
const MACHINE = (x, y = 180) => `<rect x="${x}" y="${y}" width="160" height="150" rx="14" fill="#9AA8C2"/><rect x="${x + 20}" y="${y + 20}" width="120" height="70" rx="8" fill="#2E3A66"/><circle cx="${x + 40}" cy="${y + 120}" r="12" fill="#FF6B6B"/><circle cx="${x + 80}" cy="${y + 120}" r="12" fill="#7DF9C8"/><circle cx="${x + 120}" cy="${y + 120}" r="12" fill="#FFD54A"/>`;
const CONVEYOR = (y = 300) => `<rect x="420" y="${y}" width="560" height="26" rx="13" fill="#4B5563"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${450 + i * 105}" y="${y - 44}" width="60" height="44" rx="6" fill="#FFB547"/>`).join('')}`;
const PLANTS = (x, y = 330) => [0, 1, 2, 3, 4, 5].map(i => `<g transform="translate(${x + i * 70} ${y})"><path d="M0 0 C-10 -30 -24 -40 -30 -46 M0 0 C10 -30 24 -40 30 -46 M0 0 V-52" stroke="#3B9A4B" stroke-width="6" fill="none" stroke-linecap="round"/><circle cy="-56" r="10" fill="#FF7A6B"/></g>`).join('');
const COUNTER = (x = 560, c = '#E89A5A') => `<rect x="${x}" y="250" width="420" height="80" rx="10" fill="${c}"/><rect x="${x}" y="240" width="420" height="16" rx="6" fill="${shade(c, 20)}"/>`;
const SOLAR = (x, y = 230) => `<g transform="translate(${x} ${y})"><rect x="-6" y="40" width="12" height="60" fill="#7A8AA8"/><g transform="skewX(-20)"><rect x="-70" y="0" width="140" height="56" fill="#2E4A8A" stroke="#C9D8FF" stroke-width="3"/><path d="M-35 0 V56 M0 0 V56 M35 0 V56 M-70 28 H70" stroke="#C9D8FF" stroke-width="2"/></g></g>`;
const BUILDINGS = (dark = false) => [0, 1, 2, 3, 4, 5, 6].map(i => { const h = 120 + ((i * 47) % 120); const x = 40 + i * 140; return `<rect x="${x}" y="${330 - h}" width="110" height="${h}" fill="${dark ? '#2B3366' : ['#C9D8FF', '#FFD9B3', '#D6F5E3', '#FFE0EF'][i % 4]}"/>${[0, 1, 2].map(r => [0, 1].map(c => `<rect x="${x + 18 + c * 45}" y="${340 - h + 20 + r * 40}" width="28" height="22" fill="${dark ? (r + c + i) % 3 ? '#FFE68A' : '#3B4488' : '#fff'}" opacity=".85"/>`).join('')).join('')}`; }).join('');
const HOUSE_ICON = (x, y, c = '#FF9E7A', s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-70" y="-90" width="140" height="90" fill="#FFF3D6"/><path d="M-90 -88 L0 -160 L90 -88 Z" fill="${c}"/><rect x="-18" y="-50" width="36" height="50" fill="#B07A45"/><rect x="-55" y="-75" width="26" height="24" fill="#BDE8FF"/><rect x="29" y="-75" width="26" height="24" fill="#BDE8FF"/></g>`;
const BALLOONS = `<g>${[['#FF8FB1', 120], ['#FFD54A', 180], ['#8FB8FF', 820], ['#7DD3A8', 880]].map(([c, x]) => `<ellipse cx="${x}" cy="120" rx="26" ry="32" fill="${c}"/><path d="M${x} 152 q 8 40 -4 80" stroke="#999" fill="none"/>`).join('')}</g>`;
const CURTAIN = `<rect width="1000" height="480" fill="#3B1E4A"/><path d="M0 0 H140 Q120 240 140 480 H0 Z M1000 0 H860 Q880 240 860 480 H1000 Z" fill="#C0304A"/><rect y="0" width="1000" height="40" fill="#A02040"/><ellipse cx="500" cy="420" rx="420" ry="60" fill="#FFE68A" opacity=".25"/><path d="M0 380 H1000 V480 H0 Z" fill="#6B3B2A"/>`;

const SCENES = {
  nursery: () => IN('#FFE8F0', '#FFD3A8') + WIN(80) + `<rect x="700" y="200" width="200" height="130" rx="20" fill="#FFF" stroke="#FFB3CF" stroke-width="8"/><g fill="#FFB3CF">${[0, 1, 2, 3, 4].map(i => `<rect x="${716 + i * 36}" y="200" width="10" height="130"/>`).join('')}</g><circle cx="420" cy="300" r="26" fill="#FF8C8C"/><rect x="460" y="290" width="40" height="40" fill="#8FB8FF"/><rect x="510" y="270" width="40" height="60" fill="#FFD54A"/>`,
  home: () => IN('#FFF1DE', '#E8B98A') + WIN(90) + `<rect x="620" y="210" width="300" height="100" rx="30" fill="#8FB8FF"/><rect x="600" y="250" width="60" height="80" rx="20" fill="#7AA4F0"/><rect x="880" y="250" width="60" height="80" rx="20" fill="#7AA4F0"/><rect x="380" y="80" width="140" height="100" rx="8" fill="#fff" stroke="#B07A45" stroke-width="8"/>` + TREE(450, 330, 0.5),
  kitchen: () => IN('#FFF6E0', '#D9C2A0') + `<rect x="0" y="230" width="1000" height="100" fill="#FFFFFF"/><rect x="0" y="222" width="1000" height="14" fill="#E0D2BC"/><rect x="80" y="60" width="240" height="110" rx="8" fill="#E8F5FF" stroke="#C8D8E8" stroke-width="6"/><circle cx="600" cy="215" r="34" fill="#4B5563"/><rect x="560" y="196" width="80" height="10" fill="#2B2F4F"/><rect x="760" y="90" width="160" height="230" rx="12" fill="#E9F0F8" stroke="#C8D8E8" stroke-width="6"/>`,
  classroom: () => IN('#FFF3D6', '#E2B57A') + BOARD() + DESK(80) + DESK(780) + WIN(800, 40, 150, 120),
  techroom: () => IN('#EEF3FF', '#C9B08A') + `<rect x="320" y="60" width="240" height="150" rx="14" fill="#D9A46A"/><rect x="345" y="100" width="12" height="80" rx="6" fill="#FF6B6B"/><rect x="390" y="100" width="56" height="12" rx="6" fill="#FFD54A"/><path d="M480 100 l12 0 l0 50 a14 14 0 1 1 -12 0 z" fill="#8C9BB5"/><rect x="520" y="100" width="14" height="70" rx="4" fill="#5BC0EB"/><rect x="650" y="300" width="330" height="20" rx="8" fill="#B07A45"/><rect x="760" y="180" width="140" height="120" rx="14" fill="#fff" stroke="#7B6CFF" stroke-width="6"/><rect x="800" y="230" width="40" height="40" rx="6" fill="#FF9EB5"/>` + WIN(60, 50, 180, 130) + `<text x="170" y="250" font-size="26" font-family="Jua" fill="#E8505B">⚠ 보안경 착용</text>`,
  hall: () => IN('#E8E0FF', '#C9A6FF') + `<rect x="200" y="40" width="600" height="60" rx="20" fill="#7B6CFF"/><text x="500" y="82" text-anchor="middle" font-size="34" font-family="Jua" fill="#fff">대회 · 박람회</text>` + BALLOONS + `<rect x="380" y="200" width="240" height="130" rx="16" fill="#FFD54A"/><path d="M460 200 v-40 h80 v40" fill="none" stroke="#E0A800" stroke-width="10"/>`,
  field: () => OUT('#BDE8FF', '#6CC46C') + `<ellipse cx="500" cy="400" rx="460" ry="60" fill="none" stroke="#fff" stroke-width="6"/><rect x="760" y="200" width="16" height="130" fill="#fff"/><rect x="776" y="200" width="70" height="44" fill="#FF6B6B"/>` + TREE(120) + TREE(900),
  park: () => OUT('#BDE8FF', '#8BD67A') + TREE(150) + TREE(330, 330, .8) + TREE(860) + `<rect x="520" y="290" width="160" height="14" rx="6" fill="#B07A45"/><rect x="530" y="304" width="10" height="26" fill="#8E5E32"/><rect x="660" y="304" width="10" height="26" fill="#8E5E32"/><rect x="520" y="262" width="160" height="10" rx="5" fill="#B07A45"/>`,
  museum: () => IN('#F2EEFF', '#D8CBB0') + `<g>${[120, 420, 720].map((x, i) => `<rect x="${x}" y="70" width="180" height="140" rx="6" fill="#fff" stroke="#C9A65E" stroke-width="10"/><circle cx="${x + 90}" cy="140" r="40" fill="${['#FF8C8C', '#8FB8FF', '#7DD3A8'][i]}"/>`).join('')}</g><path d="M420 330 v-60 h40 l20 -30 l40 0 l10 30 h30 v60" fill="#C9A65E"/>`,
  library: () => IN('#FFF6E8', '#C99A5E') + SHELF(60) + SHELF(260) + SHELF(760) + DESK(470),
  cafe: () => IN('#FCEBD8', '#B07A45') + WIN(60) + COUNTER(560, '#8E5E32') + `<g>${[620, 700, 780, 860].map(x => `<rect x="${x}" y="215" width="30" height="34" rx="6" fill="#fff"/>`).join('')}</g><circle cx="430" cy="300" r="40" fill="#E8B98A"/>`,
  restaurant: () => IN('#FFF0F0', '#B9805A') + `<g>${[150, 450, 750].map(x => `<rect x="${x}" y="270" width="160" height="14" rx="6" fill="#fff"/><rect x="${x + 70}" y="284" width="20" height="46" fill="#C9A65E"/><circle cx="${x + 80}" cy="250" r="10" fill="#FFD54A"/><rect x="${x + 76}" y="236" width="8" height="18" fill="#fff"/>`).join('')}</g><g fill="#FFE68A">${[200, 500, 800].map(x => `<circle cx="${x}" cy="60" r="14"/>`).join('')}</g>`,
  stage: () => CURTAIN + `<g fill="#FFD54A">${[200, 500, 800].map(x => `<polygon points="${x},40 ${x - 60},380 ${x + 60},380" opacity=".18"/>`).join('')}</g>`,
  campus: () => OUT('#CDEBFF', '#9ED68A') + `<rect x="300" y="130" width="400" height="200" fill="#F2E6D6"/><path d="M280 135 L500 50 L720 135 Z" fill="#B0604A"/>${[340, 420, 500, 580, 640].map(x => `<rect x="${x}" y="170" width="40" height="60" fill="#BDE8FF"/>`).join('')}<rect x="470" y="260" width="60" height="70" fill="#8E5E32"/>` + TREE(120) + TREE(880),
  office: () => IN('#EEF3F8', '#B8C2D0') + WIN(60, 40, 260, 170) + `<rect x="420" y="230" width="240" height="14" rx="6" fill="#fff"/><rect x="470" y="160" width="140" height="70" rx="8" fill="#2E3A66"/><rect x="530" y="230" width="20" height="20" fill="#9AA8C2"/><rect x="760" y="120" width="200" height="210" rx="10" fill="#D6DEEA"/>` + TREE(880, 330, .4),
  factory: () => IN('#E4E8EE', '#9AA0AA') + MACHINE(60) + CONVEYOR() + `<path d="M260 80 l60 -40 l60 40 l60 -40 l60 40" fill="none" stroke="#9AA8C2" stroke-width="10"/><g transform="translate(860 120)"><rect x="-10" y="0" width="20" height="120" fill="#FFB547"/><rect x="-60" y="-10" width="80" height="20" rx="8" fill="#FFB547"/><circle cx="-60" cy="0" r="16" fill="#4B5563"/></g>`,
  construction: () => OUT('#D6ECFF', '#D9B98A') + `<g stroke="#FFB547" stroke-width="10" fill="none"><path d="M650 330 V60 H900"/><path d="M650 60 L760 160"/></g><rect x="860" y="60" width="10" height="120" fill="#4B5563"/><rect x="840" y="180" width="50" height="30" fill="#8FB8FF"/><g>${[0, 1, 2].map(r => [0, 1, 2, 3].map(c => `<rect x="${120 + c * 90}" y="${150 + r * 60}" width="80" height="50" fill="none" stroke="#9AA8C2" stroke-width="6"/>`).join('')).join('')}</g><path d="M80 330 L130 270 L180 330 Z" fill="#FF8C2E"/>`,
  garage: () => IN('#E8ECF2', '#8A93A3') + `<rect x="520" y="230" width="300" height="80" rx="30" fill="#FF6B6B"/><rect x="580" y="180" width="180" height="70" rx="24" fill="#FF8C8C"/><rect x="600" y="192" width="60" height="44" rx="10" fill="#BDE8FF"/><rect x="680" y="192" width="60" height="44" rx="10" fill="#BDE8FF"/><circle cx="590" cy="312" r="30" fill="#2B2F4F"/><circle cx="760" cy="312" r="30" fill="#2B2F4F"/><rect x="80" y="70" width="240" height="160" rx="10" fill="#B07A45"/><path d="M110 110 h40 M190 110 h90 M110 160 h170" stroke="#FFD54A" stroke-width="10" stroke-linecap="round"/>`,
  studio: () => IN('#FFF4E8', '#D9B98A') + `<rect x="620" y="110" width="200" height="160" rx="6" fill="#fff" stroke="#B07A45" stroke-width="8"/><path d="M660 230 Q720 140 780 230" stroke="#FF8FB1" stroke-width="10" fill="none"/><circle cx="700" cy="170" r="20" fill="#FFD54A"/><path d="M700 270 L660 330 M720 270 L760 330" stroke="#8E5E32" stroke-width="8"/>` + DESK(100) + `<circle cx="170" cy="280" r="18" fill="#FF8C8C"/><circle cx="210" cy="285" r="14" fill="#8FB8FF"/>`,
  lab: () => IN('#EEF8FF', '#B8C8D8') + `<rect x="560" y="250" width="420" height="20" rx="8" fill="#fff"/><g>${[600, 680, 760].map((x, i) => `<path d="M${x} 170 v40 l-25 40 h70 l-25 -40 v-40 z" fill="${['#7DF9C8', '#FF9EB5', '#8FB8FF'][i]}" opacity=".8" stroke="#9AA8C2" stroke-width="3"/>`).join('')}</g><rect x="860" y="150" width="60" height="100" rx="10" fill="#4B5563"/><circle cx="890" cy="140" r="20" fill="#9AA8C2"/>` + SHELF(80),
  farm: () => OUT('#CDEBFF', '#9ED68A') + `<path d="M0 360 H1000" stroke="#7A5A3A" stroke-width="40" opacity=".4"/>` + PLANTS(80, 340) + `<path d="M600 330 V170 Q760 70 920 170 V330 Z" fill="#E8F5FF" opacity=".8" stroke="#9AA8C2" stroke-width="6"/><rect x="740" y="250" width="40" height="80" fill="#8FB8FF"/>`,
  solar: () => OUT('#BDE8FF', '#B6E08A') + SOLAR(180) + SOLAR(420) + SOLAR(660) + `<g transform="translate(900 330)"><rect x="-6" y="-200" width="12" height="200" fill="#fff"/><g transform="translate(0 -200)"><path d="M0 0 L-8 -70 L8 -70 Z M0 0 L60 30 L56 40 Z M0 0 L-58 34 L-52 42 Z" fill="#fff"/></g></g>`,
  bank: () => IN('#F0F6EC', '#C9B08A') + `<rect x="200" y="40" width="600" height="56" rx="16" fill="#3B9A6B"/><text x="500" y="80" text-anchor="middle" font-size="32" font-family="Jua" fill="#fff">💰 은행</text>` + COUNTER(150, '#7DD3A8') + `<g fill="#FFD54A">${[300, 360, 420, 640, 700].map(x => `<circle cx="${x}" cy="225" r="16"/>`).join('')}</g>`,
  stock: () => IN('#1E2550', '#2E3A66') + `<rect x="100" y="50" width="800" height="250" rx="16" fill="#0E1430" stroke="#4B5BA8" stroke-width="6"/><path d="M140 250 L260 200 L360 230 L470 140 L580 170 L700 90 L860 110" stroke="#7DF9C8" stroke-width="8" fill="none"/><path d="M140 270 L280 240 L400 260 L520 220 L640 250 L860 200" stroke="#FF6B6B" stroke-width="5" fill="none" opacity=".7"/>`,
  hospital: () => IN('#F2FBFF', '#C8D8E8') + `<rect x="420" y="40" width="160" height="60" rx="12" fill="#fff" stroke="#FF6B6B" stroke-width="6"/><path d="M500 50 v40 M480 70 h40" stroke="#FF6B6B" stroke-width="12"/><rect x="620" y="240" width="320" height="60" rx="20" fill="#fff" stroke="#C8D8E8" stroke-width="6"/><rect x="600" y="220" width="80" height="80" rx="20" fill="#DDEFFF"/>` + WIN(80),
  mart: () => IN('#FFFBEA', '#D9D2C2') + `<g>${[60, 360, 660].map(x => `<rect x="${x}" y="90" width="280" height="200" rx="10" fill="#fff" stroke="#E0D2BC" stroke-width="6"/>${[0, 1, 2].map(r => [0, 1, 2, 3, 4, 5].map(c => `<rect x="${x + 15 + c * 44}" y="${105 + r * 62}" width="34" height="46" rx="6" fill="${['#FF8C8C', '#8FB8FF', '#7DD3A8', '#FFD54A', '#B79CFF'][(r + c + x) % 5]}"/>`).join('')).join('')}`).join('')}</g>`,
  shop: () => IN('#FFF2E6', '#E8C29A') + `<rect x="200" y="40" width="600" height="56" rx="16" fill="#FF8C4A"/><text x="500" y="80" text-anchor="middle" font-size="32" font-family="Jua" fill="#fff">🛍️ 상점</text>` + COUNTER(80, '#FFB07A') + `<g font-size="56">${['🚗', '🃏', '🛡️', '🏠'].map((e, i) => `<text x="${180 + i * 200}" y="230">${e}</text>`).join('')}</g>`,
  travel: () => OUT('#9FE2FF', '#F2DDA0') + `<path d="M0 340 Q500 300 1000 340 V480 H0 Z" fill="#5BC8E8" opacity=".8"/><path d="M0 380 Q500 350 1000 385 V480 H0 Z" fill="#F2DDA0"/><g transform="translate(820 330)"><rect x="-6" y="-170" width="12" height="170" fill="#8E5E32"/><path d="M0 -170 q -70 -10 -100 30 M0 -170 q 70 -10 100 30 M0 -170 q -30 -60 -80 -50 M0 -170 q 30 -60 80 -50" stroke="#3B9A4B" stroke-width="16" fill="none" stroke-linecap="round"/></g><path d="M120 120 l60 10 l20 -14 l8 10 l-14 14 l40 6 l-6 8 l-40 -2 l-20 24 l-8 -6 l10 -22 l-56 -10 z" fill="#fff"/>`,
  airport: () => OUT('#BDE8FF', '#B8C2D0') + `<rect x="0" y="330" width="1000" height="150" fill="#6B7280"/><path d="M0 405 H1000" stroke="#fff" stroke-width="6" stroke-dasharray="40 30"/><g transform="translate(560 230)"><ellipse cx="0" cy="0" rx="200" ry="34" fill="#fff"/><path d="M-40 0 L60 -110 L100 -110 L40 0 Z M-40 0 L60 90 L100 90 L40 0 Z" fill="#E8EEF6"/><path d="M-180 -10 L-210 -70 L-170 -70 L-140 -10 Z" fill="#5B6BD9"/><g fill="#8FB8FF">${[-120, -80, -40, 0, 40, 80].map(x => `<circle cx="${x}" cy="-6" r="7"/>`).join('')}</g></g>`,
  river: () => NIGHT('#2E3A66') + BUILDINGS(true).replace(/330/g, '300') + `<path d="M0 340 H1000 V420 H0 Z" fill="#3B4CA8" opacity=".8"/><g fill="#FFE68A" opacity=".5">${[100, 260, 420, 580, 740, 900].map(x => `<rect x="${x}" y="350" width="40" height="6"/>`).join('')}</g><path d="M0 420 H1000 V480 H0 Z" fill="#8C6E5A"/><g>${[200, 500, 800].map(x => `<rect x="${x}" y="300" width="8" height="120" fill="#5A4A3A"/><circle cx="${x + 4}" cy="296" r="14" fill="#FFE68A"/>`).join('')}</g>`,
  night: () => NIGHT() + BUILDINGS(true),
  wedding: () => IN('#FFF0F6', '#F2D6E0') + `<path d="M330 330 V140 Q500 20 670 140 V330" fill="none" stroke="#FFB3CF" stroke-width="22"/><g fill="#FF8FB1">${[340, 380, 420, 580, 620, 660].map((x, i) => `<circle cx="${x}" cy="${150 - (i % 3) * 30}" r="16"/>`).join('')}</g><g fill="#FFFFFF">${[360, 640].map(x => `<circle cx="${x}" cy="120" r="12"/>`).join('')}</g>` + BALLOONS,
  party: () => IN('#FFF6D9', '#E8C29A') + BALLOONS + `<path d="M0 40 Q250 90 500 40 T1000 40" stroke="#FF8FB1" stroke-width="6" fill="none"/><g>${[60, 180, 300, 420, 540, 660, 780, 900].map((x, i) => `<polygon points="${x},44 ${x + 30},44 ${x + 15},80" fill="${['#FF8C8C', '#FFD54A', '#8FB8FF', '#7DD3A8'][i % 4]}"/>`).join('')}</g><rect x="400" y="230" width="200" height="100" rx="12" fill="#FFB3CF"/><rect x="430" y="190" width="140" height="50" rx="10" fill="#fff"/><g fill="#FFD54A">${[450, 500, 550].map(x => `<rect x="${x}" y="160" width="8" height="30"/>`).join('')}</g>`,
  creditor: () => IN('#2B2F4F', '#3B3F5F') + `<rect x="120" y="60" width="180" height="140" rx="8" fill="#1E2240"/><text x="210" y="145" text-anchor="middle" font-size="60">🧾</text><g transform="translate(770 470) scale(1.35)">${avatar({ skin: 1, hair: 15, hairColor: 1, mouth: 5, item: 'sunglasses' }, { age: 'adult', gender: 'm', wear: 'collector' })}</g><text x="800" y="360" font-size="34">🧾</text>`,
  gate: () => OUT('#FFE8F0', '#FFD3A8') + `<rect x="380" y="80" width="240" height="250" rx="20" fill="#FF8C8C"/><rect x="410" y="110" width="180" height="220" rx="14" fill="#FFF3D6"/><circle cx="560" cy="230" r="10" fill="#FFD54A"/>` + BALLOONS,
  goal: () => OUT('#FFE8C8', '#F2D6A0') + `<rect x="200" y="100" width="20" height="230" fill="#4B5563"/><rect x="780" y="100" width="20" height="230" fill="#4B5563"/><rect x="200" y="90" width="600" height="60" rx="10" fill="#FF6B6B"/><text x="500" y="133" text-anchor="middle" font-size="40" font-family="Jua" fill="#fff">🏁 인생 골인!</text>` + BALLOONS,
  campsite: () => NIGHT('#3B5A3B') + `<path d="M380 340 L500 180 L620 340 Z" fill="#FF8C2E"/><path d="M500 180 L500 340" stroke="#C0601A" stroke-width="6"/><g transform="translate(720 340)"><path d="M-30 0 L0 -50 L30 0 Z" fill="#FFB547"/><path d="M-18 0 L0 -30 L18 0 Z" fill="#FFE68A"/></g>` + TREE(150, 340, .9) + TREE(880, 340, .9),
  city: () => OUT('#CDEBFF', '#B8C2D0') + BUILDINGS(),
  garage_studio: () => IN('#EEF0F4', '#9AA0AA') + `<rect x="0" y="40" width="1000" height="30" fill="#C9CED8"/><text x="500" y="200" text-anchor="middle" font-size="90">🚀</text>` + DESK(120) + DESK(720),
};
['villa', 'apt', 'house', 'country', 'penthouse', 'mansion', 'castle'].forEach((k, i) => {
  SCENES['house_' + k] = () => OUT(['#CDEBFF', '#CDEBFF', '#BDE8FF', '#D6F5E3', '#1E2550', '#FFE8C8', '#E8E0FF'][i], '#9ED68A', i !== 4) + (i === 1 ? BUILDINGS() : HOUSE_ICON(500, 330, ['#FF9E7A', '#8FB8FF', '#FF8C8C', '#7DD3A8', '#B79CFF', '#FFD54A', '#C9A6FF'][i], [0.9, 1, 1.2, 1.3, 1.1, 1.6, 1.8][i])) + TREE(140) + TREE(860);
});

export function scene(key) { return (SCENES[key] || SCENES.home)(); }
export const SCENE_KEYS = Object.keys(SCENES);

/* ═════════════ 룰렛 바퀴 ═════════════ */
const FATE_COLOR = { g: '#FFC93C', n: '#8FB8FF', b: '#B8B2C8' };
const FATE_ICON = { g: '🌟', n: '🙂', b: '💥' };
export const RAINBOW = ['#FF6B6B', '#FF9E4A', '#FFD54A', '#9BE15D', '#4ACFAC', '#4AB8FF', '#6B7BFF', '#A66BFF', '#FF6BC8', '#FF8FA3'];
// segs: [{label, color, small}]
export function wheelSvg(segs, size = 340) {
  const n = segs.length, R = 160, cx = 170, cy = 170;
  let g = '';
  segs.forEach((s, i) => {
    const a0 = (i / n) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
    const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0), x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    g += `<path d="M${cx} ${cy} L${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="${s.color}" stroke="#fff" stroke-width="3"/>`;
    const am = (a0 + a1) / 2, tr = R * (n > 6 ? 0.72 : 0.62);
    const tx = cx + tr * Math.cos(am), ty = cy + tr * Math.sin(am);
    const rot = (am * 180 / Math.PI) + 90;
    const fs = s.small ? (n > 8 ? 15 : n > 4 ? 19 : 28) : (n > 8 ? 30 : 38);
    g += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-size="${fs}" font-family="Jua" text-anchor="middle" dominant-baseline="middle" fill="#fff" stroke="rgba(0,0,0,.25)" stroke-width="${s.small ? 2.5 : 4}" paint-order="stroke" transform="rotate(${rot.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)})">${s.label}</text>`;
  });
  return `<svg viewBox="0 0 340 340" width="${size}" height="${size}" class="wheel-svg"><g class="wheel-rot">${g}<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#fff" stroke-width="8"/></g><circle cx="${cx}" cy="${cy}" r="34" fill="#fff" stroke="#E8E2F8" stroke-width="6"/><circle cx="${cx}" cy="${cy}" r="14" fill="#7B6CFF"/></svg>`;
}
export function moveSegs() { return Array.from({ length: 10 }, (_, i) => ({ label: String(i + 1), color: RAINBOW[i] })); }
export function fateSegs(layout) { return layout.map(k => ({ label: FATE_ICON[k], color: FATE_COLOR[k] })); }
export function labelSegs(labels) { return labels.map((l, i) => ({ label: l, color: RAINBOW[(i * 3) % 10], small: true })); }
export { FATE_COLOR, FATE_ICON };
