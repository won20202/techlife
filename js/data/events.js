import { JOBS } from './jobs.js';
// 이벤트 데이터 — 나이(단계) 꼬리표가 붙은 것만 그 나이에 나온다.
// 형식: { id, st:[단계], cell:'normal'|'lucky'|'verylucky'|'unlucky', bg, t:상황, ch:[선택지] }
//   선택지: { l:글, e:효과, n:결과 제목, r:운명 룰렛{k,s,tag,g,n,b}, call:분야(전문가 부르기), cost, need:(S,p)=>bool }
//   효과(e): money(만원) sal(연봉 배수) int/str/sen luck tag{} green happy love card patent rank houseVal kidStat kidTag award souvenir ins debtCut cash
const BABY = ['baby'], KID = ['kid'], CH = ['baby', 'kid'];
const ELEM = ['elem'], MID = ['mid'], HIGH = ['high'], SCH = ['elem', 'mid', 'high'], TEEN = ['mid', 'high'];
const COL = ['college'], YOUNG = ['young'], MIDL = ['middle'], OLD = ['elder'];
const AD = ['college', 'young', 'middle'], WORK = ['young', 'middle'], ADULT = ['college', 'young', 'middle', 'elder'];
const married = (S, p) => p.spouse != null;
const hasKids = (S, p) => p.kids.length > 0;
const hasHouse = (S, p) => p.house.k !== 'room';
const hasCar = (S, p) => !!p.car;
const single = (S, p) => p.spouse == null;
const hasDebt = (S, p) => p.debt > 0;
const R = (k, s, tag, g, n, b, extra = {}) => ({ k, s, tag, g, n, b, ...extra });
const isConstr = p => p.job && !p.job.free && JOBS[p.job.id].tags.includes('건설');

let n = 0;
const ev = (o) => ({ id: 'e' + (++n), ...o });

export const EVENTS = [
  /* ───── 아기 ───── */
  ev({ st: BABY, cell: 'normal', bg: 'nursery', t: '장난감 상자에서 무엇을 꺼낼까?', ch: [
    { l: '블록을 쌓는다', e: { str: 4, sen: 2 }, n: '높이 높이 쌓았어요!' },
    { l: '그림책을 본다', e: { int: 5 }, n: '그림책을 보며 옹알옹알' },
    { l: '장난감을 분해해 본다', e: { sen: 5 }, n: '속이 궁금해서 다 열어 봤어요' }] }),
  ev({ st: BABY, cell: 'normal', bg: 'nursery', t: '첫 걸음마!', n: '한 발, 두 발… 혼자 걸었어요!', e: { str: 5, happy: 3 } }),
  ev({ st: BABY, cell: 'lucky', bg: 'nursery', t: '첫 돌잔치! 무엇을 잡을까?', ch: [
    { l: '연필', e: { int: 6, money: 5 }, n: '연필을 잡았어요! 공부를 좋아할까?' },
    { l: '공', e: { str: 6, money: 5 }, n: '공을 잡았어요! 운동을 좋아할까?' },
    { l: '드라이버(공구)', e: { sen: 4, tag: { 제조: 1 }, money: 5 }, n: '공구를 잡았어요! 만들기를 좋아할까?' }] }),
  ev({ st: BABY, cell: 'lucky', bg: 'nursery', t: '할머니가 손뜨개 인형을 선물해 주셨어요', n: '포근포근 행복해요', e: { happy: 5, sen: 3 } }),
  ev({ st: BABY, cell: 'unlucky', bg: 'hospital', t: '열이 나요', ch: [
    { l: '푹 잔다', r: R('보통', 'str', null, { t: '푹 자고 나니 개운! 면역력 쑥', e: { str: 5, happy: 2 } }, { t: '하루 앓고 나았어요', e: { str: -1, happy: 1 } }, { t: '열이 더 올라 결국 병원에…', e: { str: -4, happy: -2 } }) },
    { l: '병원에 간다', e: { str: 3, happy: -1 }, n: '주사는 무서웠지만 금방 나았어요' }] }),
  ev({ st: BABY, cell: 'unlucky', bg: 'nursery', t: '넘어져서 엉엉', n: '토닥토닥… 다시 일어났어요', e: { str: 2 } }),

  /* ───── 어린이 ───── */
  ev({ st: KID, cell: 'normal', bg: 'park', t: '종이비행기 멀리 날리기 놀이', ch: [
    { l: '날개를 이리저리 접어 본다', r: R('보통', 'sen', '발명', { t: '가장 멀리 날았어요!', e: { sen: 8, tag: { 발명: 1 } } }, { t: '잘 날았어요', e: { sen: 4 } }, { t: '빙글빙글 추락…', e: { sen: 2 } }) },
    { l: '친구 것을 따라 접는다', e: { sen: 2, happy: 2 }, n: '같이 날리니 재밌어요' }] }),
  ev({ st: KID, cell: 'normal', bg: 'home', t: '할머니의 고장 난 라디오', ch: [
    { l: '같이 열어 본다 (안전하게 어른과 함께)', r: R('보통', 'sen', '제조', { t: '라디오를 고쳤어요! 할머니 감동', e: { int: 5, sen: 5, tag: { 제조: 1 }, happy: 3 } }, { t: '안이 이렇게 생겼구나!', e: { int: 4, sen: 2, tag: { 제조: 1 } } }, { t: '나사를 잃어버렸어요… 그래도 구조는 알았어요', e: { int: 2, happy: -2 } }) },
    { l: '할머니께 옛날 이야기를 듣는다', e: { int: 2, happy: 4, luck: 1 }, n: '할머니가 아끼던 행운 열쇠고리를 주셨어요' }] }),
  ev({ st: KID, cell: 'normal', bg: 'nursery', t: '블록으로 무엇을 만들까?', ch: [
    { l: '높은 탑', e: { str: 4, tag: { 건설: 1 } }, n: '쓰러지지 않는 튼튼한 탑!' },
    { l: '자동차', e: { sen: 4, tag: { 수송: 1 } }, n: '부릉부릉 자동차 완성!' },
    { l: '로봇', e: { int: 2, sen: 2, tag: { 제조: 1 } }, n: '삐빅! 로봇 완성!' }] }),
  ev({ st: KID, cell: 'normal', bg: 'kitchen', t: '엄마 아빠와 함께 쿠키 만들기', n: '반죽을 조물조물! 맛있는 쿠키 완성', e: { str: 3, sen: 3, tag: { 가정: 1 } } }),
  ev({ st: KID, cell: 'lucky', bg: 'museum', t: '과학관 견학!', n: '공룡 뼈랑 로켓을 봤어요', e: { int: 6, tag: { 생명: 1 } } }),
  ev({ st: KID, cell: 'lucky', bg: 'park', t: '자전거 보조바퀴를 뗐어요!', n: '혼자서 씽씽!', e: { str: 6, happy: 3 } }),
  ev({ st: KID, cell: 'unlucky', bg: 'park', t: '놀이터에서 길을 잃었어요', ch: [
    { l: '그 자리에서 기다린다', r: R('안정', null, null, { t: '경찰관 아저씨가 칭찬해 주셨어요', e: { int: 4, luck: 1 } }, { t: '배운 대로 기다렸더니 부모님이 찾아왔어요', e: { int: 3 } }, { t: '한참 기다려 지루했어요', e: { int: 1, happy: -1 } }) },
    { l: '직접 찾아 나선다', r: R('도전', 'str', null, { t: '혼자 길을 찾았어요! 씩씩해요', e: { str: 5, happy: 2 } }, { t: '한참 만에 찾았어요', e: { str: 1, happy: -1 } }, { t: '더 멀리 헤맸어요… 다음엔 그 자리에!', e: { str: -2, happy: -3 } }) }] }),
  ev({ st: KID, cell: 'unlucky', bg: 'home', t: '아끼던 장난감이 부서졌어요', ch: [
    { l: '테이프로 고쳐 본다', r: R('보통', 'sen', '제조', { t: '새것보다 튼튼하게 고쳤어요!', e: { sen: 6, tag: { 제조: 1 } } }, { t: '조금 삐뚤지만 고쳤어요', e: { sen: 4 } }, { t: '더 망가졌어요…', e: { sen: 1, happy: -2 } }) },
    { l: '친구와 장난감을 바꿔 논다', r: R('보통', null, null, { t: '친구랑 더 친해졌어요! 새 놀이도 배웠어요', e: { happy: 5, sen: 2 } }, { t: '그럭저럭 재밌어요', e: { happy: 2 } }, { t: '친구가 다시 돌려 달래요…', e: { happy: -3 } }) }] }),

  /* ───── 초등학생 ───── */
  ev({ st: ELEM, cell: 'normal', bg: 'classroom', t: '받아쓰기 시험', ch: [
    { l: '전날 열심히 연습했다', r: R('보통', 'int', null, { t: '100점!', e: { int: 8 } }, { t: '80점', e: { int: 4 } }, { t: '실수 연발…', e: { int: 1 } }) },
    { l: '그냥 본다', e: { int: 2 }, n: '보통 점수' }] }),
  ev({ st: ELEM, cell: 'normal', bg: 'classroom', t: '블록 코딩 시간! 캐릭터를 움직여 봐요', n: '반복문으로 캐릭터가 춤을 춰요', e: { int: 4, sen: 2, tag: { 정보통신: 1 } } }),
  ev({ st: ELEM, cell: 'normal', bg: 'park', t: '방과 후에 무엇을 할까?', ch: [
    { l: '축구', e: { str: 5 }, n: '땀 뻘뻘!' }, { l: '도서관', e: { int: 5 }, n: '책 세 권 완독!' }, { l: '그림 그리기', e: { sen: 5 }, n: '멋진 작품 완성!' }] }),
  ev({ st: ELEM, cell: 'normal', bg: 'farm', t: '학교 텃밭에서 상추 키우기', n: '물 주고 기다렸더니 쑥쑥!', e: { str: 3, tag: { 생명: 1 } } }),
  ev({ st: ELEM, cell: 'lucky', bg: 'hall', t: '과학의 날 발명대회!', ch: [
    { l: '불편한 점을 찾아 아이디어를 낸다', r: R('보통', 'sen', '발명', { t: '금상! 우리 학교 대표!', e: { sen: 10, tag: { 발명: 1 }, award: '초등 발명대회 금상', money: 10 } }, { t: '장려상', e: { sen: 5 } }, { t: '발표에서 실수… 그래도 배웠어요', e: { sen: 2, happy: -2 } }) },
    { l: '친구 작품을 도와준다', e: { int: 3, happy: 3 }, n: '친구가 상을 받아 같이 기뻐했어요' }] }),
  ev({ st: ELEM, cell: 'lucky', bg: 'home', t: '세뱃돈 대박!', ch: [
    { l: '저금한다', e: { money: 25, int: 2 }, n: '저금했더니 이자가 붙었어요' },
    { l: '갖고 싶던 과학 키트를 산다', r: R('보통', 'sen', '발명', { t: '키트로 발명품 완성! 칭찬받았어요', e: { money: 3, sen: 6, tag: { 발명: 1 } } }, { t: '키트로 실험 완성!', e: { money: 3, sen: 4 } }, { t: '설명서가 어려워 반만 했어요', e: { money: 3, sen: 1 } }) }] }),
  ev({ st: ELEM, cell: 'lucky', bg: 'hall', t: '학교 대표로 뽑혔어요!', n: '발표를 멋지게 해냈어요', e: { anyStat: 6, happy: 3 } }),
  ev({ st: ELEM, cell: 'unlucky', bg: 'classroom', t: '준비물을 깜빡했어요', ch: [
    { l: '친구에게 빌린다', r: R('안정', null, null, { t: '친구랑 더 친해졌어요', e: { happy: 4, sen: 2 } }, { t: '고마운 친구!', e: { happy: 2 } }, { t: '친구도 깜빡해서 같이 혼났어요', e: { happy: -1 } }) },
    { l: '있는 재료로 대신 만든다', r: R('도전', 'sen', '발명', { t: '임기응변 대성공! 선생님이 칭찬', e: { sen: 6, tag: { 발명: 1 } } }, { t: '그럭저럭 해냈어요', e: { sen: 2 } }, { t: '수업을 제대로 못 했어요', e: { sen: -2, happy: -1 } }) }] }),
  ev({ st: ELEM, cell: 'unlucky', bg: 'park', t: '자전거를 타다 넘어졌어요', ch: [
    { l: '헬멧을 쓰고 있었다', e: { str: 2, happy: 1 }, n: '헬멧 덕분에 무릎만 살짝!' },
    { l: '헬멧 없이 탔다', r: R('도전', 'str', null, { t: '살짝 긁혔지만 자전거 실력이 늘었어요', e: { str: 4 } }, { t: '무릎이 까졌어요', e: { str: -2 } }, { t: '머리를 다쳐 병원에… 다음엔 꼭 헬멧!', e: { str: -6, happy: -3, money: -5 } }) }] }),
  ev({ st: ELEM, cell: 'unlucky', bg: 'classroom', t: '친구랑 다퉜어요', ch: [
    { l: '먼저 사과한다', r: R('안정', 'sen', null, { t: '더 친해졌어요!', e: { sen: 5, happy: 4 } }, { t: '화해했어요', e: { sen: 3, happy: 2 } }, { t: '사과했는데 아직 화가 났대요', e: { sen: 2, happy: -1 } }) },
    { l: '시간을 두고 기다린다', r: R('도전', null, null, { t: '친구가 먼저 손을 내밀었어요', e: { happy: 5, int: 2 } }, { t: '며칠 어색했어요', e: { happy: -2 } }, { t: '사이가 멀어졌어요…', e: { happy: -5, luck: -1 } }) }] }),

  /* ───── 중학생 ───── */
  ev({ st: MID, cell: 'normal', bg: 'techroom', t: '기술실 실습! 톱질을 시작하기 전에…', ch: [
    { l: '보안경을 쓰고 안전수칙을 지킨다', r: R('안정', 'str', '제조', { t: '안전하게 멋진 작품 완성! 칭찬까지', e: { str: 6, sen: 4, tag: { 제조: 1 } } }, { t: '안전하게 완성!', e: { str: 5, sen: 2, tag: { 제조: 1 } } }, { t: '꼼꼼히 하느라 시간이 모자랐어요', e: { str: 3, sen: 1 } }) },
    { l: '귀찮아서 그냥 한다', r: R('도전', 'str', null, { t: '빨리 끝내고 하나 더 만들었어요', e: { str: 3, sen: 3 } }, { t: '나무 가루가 눈에… 쉬어야 했어요', e: { str: -3 } }, { t: '손을 다쳤어요! 병원비도 들었어요', e: { str: -8, happy: -2, money: -10 } }) }] }),
  ev({ st: MID, cell: 'normal', bg: 'classroom', t: '의자 설계: 치수가 안 맞아요!', ch: [
    { l: '수학 시간에 배운 대로 다시 계산한다', r: R('보통', 'int', '건설', { t: '딱 맞게 완성! (수학 융합)', e: { int: 7, tag: { 건설: 1 } } }, { t: '조금 오래 걸렸지만 완성', e: { int: 5, tag: { 건설: 1 } } }, { t: '계산 실수… 다시 해야 해요', e: { int: 2 } }) },
    { l: '감으로 빨리 맞춘다', r: R('도전', 'sen', null, { t: '감각이 딱 맞았어요! 제일 먼저 완성', e: { sen: 6, happy: 2 } }, { t: '삐걱거리는 의자…', e: { sen: 1 } }, { t: '부러져서 처음부터…', e: { sen: -1, happy: -2 } }) }] }),
  ev({ st: MID, cell: 'normal', bg: 'classroom', t: '진로 체험의 날! 어디로 갈까?', ch: [
    { l: '자동차 공장', e: { tag: { 수송: 1 }, int: 2 }, n: '로봇이 차를 조립해요!' },
    { l: '스마트팜', e: { tag: { 생명: 1 }, str: 2 }, n: '센서가 물을 줘요!' },
    { l: '게임 회사', e: { tag: { 정보통신: 1 }, sen: 2 }, n: '게임은 이렇게 만드는구나!' }] }),
  ev({ st: MID, cell: 'normal', bg: 'field', t: '체육대회 계주 대표!', ch: [
    { l: '전력으로 달린다', r: R('보통', 'str', null, { t: '1등! 반 우승!', e: { str: 8, happy: 5 } }, { t: '2등!', e: { str: 4 } }, { t: '바통을 놓쳤어요…', e: { str: 2 } }) },
    { l: '응원단을 맡는다', e: { sen: 5, happy: 3 }, n: '응원 상 받았어요' }] }),
  ev({ st: MID, cell: 'normal', bg: 'classroom', t: '중간고사가 다가와요', ch: [
    { l: '계획표를 짜서 공부한다', r: R('보통', 'int', null, { t: '전 과목 성적 UP!', e: { int: 9 } }, { t: '평소만큼', e: { int: 4 } }, { t: '시험 범위를 잘못 알았어요…', e: { int: 1 } }) },
    { l: '벼락치기', r: R('도전', 'int', null, { t: '찍은 게 다 맞았어요?!', e: { int: 10, str: -2 } }, { t: '밤을 새웠더니 피곤해요', e: { int: 3, str: -2 } }, { t: '시험 중에 졸았어요…', e: { int: -1, str: -3 } }) }] }),
  ev({ st: MID, cell: 'lucky', bg: 'hall', t: '동아리 박람회에서 선배가 스카우트!', n: '경험을 하나 더 얻었어요', e: { tag: { 발명: 1 }, sen: 4 } }),
  ev({ st: MID, cell: 'lucky', bg: 'museum', t: '해외 과학 캠프 당첨!', n: '세계 친구들과 프로젝트를 했어요', e: { int: 6, sen: 6, tag: { 정보통신: 1, 적정기술: 1 } } }),
  ev({ st: MID, cell: 'lucky', bg: 'home', t: '학교 메이커 수업에서 3D 펜을 써 봤어요', n: '입체 작품을 마구 만들어요', e: { sen: 6, tag: { 제조: 1 } } }),
  ev({ st: MID, cell: 'unlucky', bg: 'classroom', t: '시험 전날 감기에 걸렸어요', ch: [
    { l: '약 먹고 일찍 잔다', r: R('안정', 'str', null, { t: '푹 자고 시험도 잘 봤어요', e: { int: 3, str: 3 } }, { t: '푹 자서 시험은 그럭저럭', e: { int: 2, str: 2 } }, { t: '아직 아파요…', e: { int: 1, str: 1 } }) },
    { l: '아파도 밤샘 공부', r: R('도전', 'int', null, { t: '아파도 해냈어요! 성적 UP', e: { int: 7, str: -3 } }, { t: '시험 끝나고 앓아누웠어요', e: { str: -5, int: 2 } }, { t: '시험 날 쓰러졌어요…', e: { str: -7, int: -1 } }) }] }),
  ev({ st: MID, cell: 'unlucky', bg: 'classroom', t: '스마트폰 액정이 깨졌어요', ch: [
    { l: '용돈으로 수리점에 맡긴다', r: R('안정', null, null, { t: '단골 가게에서 싸게 고쳤어요', e: { money: -5, happy: 2 } }, { t: '깨끗해졌어요', e: { money: -10, happy: 2 } }, { t: '수리비가 생각보다 비싸요', e: { money: -20 } }) },
    { l: '깨진 채로 조심해서 쓴다', r: R('보통', null, null, { t: '보호 필름을 붙였더니 멀쩡해요!', e: { sen: 2, happy: 2 } }, { t: '조금 불편하지만 쓸 만해요', e: { happy: -1 } }, { t: '손가락을 살짝 베었어요…', e: { str: -3, happy: -2 } }) },
    { l: '영상을 보고 직접 고쳐 본다', r: R('도전', 'sen', '정보통신', { t: '셀프 수리 성공! 손재주 UP', e: { sen: 5, tag: { 정보통신: 1 } } }, { t: '대충 붙였어요', e: { sen: 2 } }, { t: '더 망가졌어요… 한동안 못 써요', e: { sen: -1, happy: -3 } }) }] }),
  ev({ st: MID, cell: 'unlucky', bg: 'classroom', t: '친구가 내 과제를 베끼자고 해요', ch: [
    { l: '같이 공부하자고 한다 (운세↑)', e: { int: 2, luck: 1 }, n: '둘 다 실력이 늘고 마음도 뿌듯해요' },
    { l: '그냥 보여 준다 (운세↓)', r: R('보통', null, null, { t: '친구가 고맙다며 선물을! 우정 UP', e: { sen: 8, happy: 4, luck: -1 } }, { t: '들키지 않았어요… 친구는 좋아해요', e: { sen: 4, happy: 2, luck: -1 } }, { t: '들켜서 둘 다 점수 0점!', e: { int: -5, luck: -1 } }) }] }),

  /* ───── 고등학생 (공통) ───── */
  ev({ st: HIGH, cell: 'normal', bg: 'classroom', t: '진로 상담 시간', n: '선생님이 내 경험에 맞는 학과와 직업을 알려 주셨어요', e: { int: 3, sen: 3 } }),
  ev({ st: HIGH, cell: 'normal', bg: 'classroom', t: '팀 프로젝트에 무임승차 친구가 있어요', ch: [
    { l: '역할을 다시 나누자고 말한다', r: R('보통', 'sen', null, { t: '모두 참여해서 1등!', e: { sen: 7, happy: 3 } }, { t: '모두 참여해서 좋은 결과!', e: { sen: 5, happy: 2 } }, { t: '말다툼만 하다 시간이 부족했어요', e: { sen: 2, happy: -2 } }) },
    { l: '내가 다 한다', r: R('보통', 'int', null, { t: '혼자 해냈어요! 실력이 쑥', e: { int: 8, str: -3 } }, { t: '결과는 좋았지만 지쳤어요', e: { int: 4, str: -4 } }, { t: '밤새도 다 못 했어요…', e: { int: 1, str: -5 } }) }] }),
  ev({ st: HIGH, cell: 'normal', bg: 'hall', t: '축제 부스 운영!', ch: [
    { l: '음식 부스', e: { tag: { 가정: 1 }, money: 10, str: 3 }, n: '떡볶이 완판!' },
    { l: '게임 부스 (직접 코딩)', e: { tag: { 정보통신: 1 }, sen: 4 }, n: '줄이 길게 섰어요' },
    { l: '친환경 장터', e: { tag: { 적정기술: 1 }, green: 1 }, n: '업사이클 물건이 인기!' }] }),
  ev({ st: HIGH, cell: 'normal', bg: 'cafe', t: '첫 아르바이트! 근로계약서는?', ch: [
    { l: '근로계약서를 꼭 쓰고 시작한다', r: R('안정', null, null, { t: '시급도 제대로, 사장님이 보너스까지!', e: { money: 40, int: 3 } }, { t: '시급도 제대로 받았어요', e: { money: 30, int: 3 } }, { t: '계약서 쓰느라 첫날 늦게 시작했어요', e: { money: 20, int: 3 } }) },
    { l: '그냥 시작한다', r: R('도전', null, null, { t: '바로 시작해서 첫 달 꽉 채워 받았어요', e: { money: 60 } }, { t: '시급을 덜 받았어요', e: { money: 10 } }, { t: '돈을 못 받았어요… 계약서가 중요해요', e: { money: 0, luck: -1 } }) }] }),
  ev({ st: HIGH, cell: 'normal', bg: 'classroom', t: '작품은 좋은데 디자인이 아쉬워요', ch: [
    { l: '미술 시간에 배운 색 조합을 쓴다', r: R('보통', 'sen', null, { t: '훨씬 멋져졌어요! (미술 융합)', e: { sen: 7, happy: 2 } }, { t: '조금 나아졌어요', e: { sen: 4 } }, { t: '색이 오히려 어색해졌어요', e: { sen: 1 } }) },
    { l: '그대로 내고 기능을 더 다듬는다', r: R('안정', 'int', null, { t: '기능이 최고라 칭찬받았어요!', e: { int: 6, happy: 2 } }, { t: '기능은 최고!', e: { int: 3 } }, { t: '디자인 점수가 낮았어요', e: { int: 2, happy: -1 } }) }] }),
  ev({ st: HIGH, cell: 'normal', bg: 'classroom', t: '특성화고·마이스터고 친구: 자격증 도전!', need: (S, p) => ['special', 'meister'].includes(p.school), ch: [
    { l: '기능사 시험에 도전한다', r: R('보통', 'str', null, { t: '국가기술자격증 합격!', e: { str: 8, award: '기능사 자격증' } }, { t: '필기 합격, 실기는 다음에', e: { str: 4 } }, { t: '불합격… 다시 도전!', e: { str: 2 } }) },
    { l: '내신 공부에 집중한다', e: { int: 4 }, n: '성적이 올랐어요' }] }),
  ev({ st: HIGH, cell: 'normal', bg: 'factory', t: '마이스터고 현장실습! 안전 교육 시간', need: (S, p) => p.school === 'meister', ch: [
    { l: '안전 수칙을 꼼꼼히 지킨다', r: R('안정', 'str', null, { t: '현장 선배에게 칭찬받고 추천서까지!', e: { str: 6, int: 3, luck: 1, card: 'random' } }, { t: '현장 선배에게 칭찬받았어요', e: { str: 6, int: 3 } }, { t: '꼼꼼히 하느라 작업을 덜 했어요', e: { str: 3, int: 2 } }) },
    { l: '빨리 끝내려고 서두른다', r: R('도전', 'str', null, { t: '빨리 끝내고 다른 기계도 배웠어요', e: { str: 5, sen: 3 } }, { t: '실수해서 다시 했어요', e: { str: -2 } }, { t: '다쳤어요! 안전이 먼저 (병원비도…)', e: { str: -8, happy: -2, money: -10 } }) }] }),
  ev({ st: HIGH, cell: 'lucky', bg: 'hall', t: '기능경기대회 출전!', ch: [
    { l: '도전한다', r: R('보통', 'str', null, { t: '금메달!', e: { str: 10, award: '기능경기대회 금메달', money: 50 } }, { t: '동메달', e: { str: 5, money: 10 } }, { t: '좋은 경험이었어요', e: { str: 3 } }) },
    { l: '응원하며 기술을 배운다', e: { sen: 3, happy: 3 }, n: '친구가 메달을 땄어요! 비법도 배웠어요' }] }),
  ev({ st: HIGH, cell: 'lucky', bg: 'campus', t: '대학 전공 체험 캠프', n: '대학에서는 이런 걸 배우는구나!', e: { int: 6, tag: { 정보통신: 1 } } }),
  ev({ st: HIGH, cell: 'lucky', bg: 'hall', t: '창업 동아리 아이디어 대회 우승!', n: '상금과 특허 출원 기회!', e: { money: 30, sen: 6, tag: { 발명: 1 } } }),
  ev({ st: HIGH, cell: 'unlucky', bg: 'classroom', t: '대회 당일 늦잠!', ch: [
    { l: '택시를 탄다 (용돈)', r: R('안정', null, null, { t: '여유 있게 도착해 실력 발휘!', e: { money: -10, int: 3, happy: 2 } }, { t: '아슬아슬하게 도착!', e: { money: -10 } }, { t: '길이 막혀 결국 지각…', e: { money: -15, happy: -2 } }) },
    { l: '버스를 타고 간다', r: R('안정', null, null, { t: '버스에서 마지막 점검까지! 실력 발휘', e: { int: 3, happy: 2 } }, { t: '아슬아슬하게 도착!', e: { happy: -1 } }, { t: '버스가 늦게 와서 지각…', e: { int: -1, happy: -2 } }) },
    { l: '뛰어간다', r: R('보통', 'str', null, { t: '전력 질주! 시간 맞춰 도착', e: { str: 5 } }, { t: '도착했지만 너무 지쳤어요', e: { str: 4, int: -2 } }, { t: '넘어져서 무릎이…', e: { str: -2, happy: -2 } }) }] }),
  ev({ st: HIGH, cell: 'unlucky', bg: 'home', t: '수상한 문자: "택배 주소를 확인하세요 (링크)"', ch: [
    { l: '누르지 않고 신고한다', r: R('안정', 'int', null, { t: '스미싱 신고! 경찰서 감사장', e: { int: 4, luck: 1, award: '스미싱 신고 감사장' } }, { t: '스미싱이었어요! 잘 피했어요', e: { int: 4 } }, { t: '진짜 택배 문자였어요… 택배가 늦게 와요', e: { int: 2, happy: -2 } }) },
    { l: '눌러 본다', r: R('도전', null, null, { t: '진짜 택배 안내였어요! 바로 받았어요', e: { happy: 3 } }, { t: '광고였어요… 스팸만 늘었어요', e: { happy: -2 } }, { t: '개인정보가 털렸어요… 용돈이 빠져나갔어요', e: { luck: -1, happy: -2, money: -20 } }) }] }),
  ev({ st: SCH, cell: 'unlucky', bg: 'techroom', t: '실습 중 친구가 안전수칙을 안 지켜요', ch: [
    { l: '알려 주고 선생님께 말씀드린다 (운세↑)', e: { sen: 2, green: 1, luck: 1 }, n: '덕분에 사고를 막았어요' },
    { l: '모른 척하고 내 작품에 집중한다 (운세↓)', r: R('보통', 'sen', null, { t: '사이도 좋고 내 작품도 최고!', e: { sen: 7, happy: 3, luck: -1 } }, { t: '내 작품은 잘했지만 마음이 불편해요', e: { sen: 4, luck: -1 } }, { t: '결국 사고가… 마음이 무거워요', e: { happy: -4, luck: -1 } }) }] }),
  ev({ st: SCH, cell: 'lucky', bg: 'home', t: '세뱃돈이 잔뜩!', e: { money: 20 }, n: '친척들이 모두 모였어요' }),
  ev({ st: SCH, cell: 'lucky', bg: 'museum', t: '과학관 무료 초대권', n: '전시를 실컷 봤어요', e: { sen: 4, int: 3, tag: { 생명: 1 } } }),
  ev({ st: SCH, cell: 'lucky', bg: 'park', t: '우연히 주운 고장 난 로봇', ch: [
    { l: '고쳐 본다', r: R('보통', 'str', '제조', { t: '움직여요! 나만의 로봇', e: { str: 6, sen: 4, tag: { 제조: 1 } } }, { t: '팔만 움직여요', e: { str: 3 } }, { t: '못 고쳤지만 배웠어요', e: { int: 2 } }) },
    { l: '주인을 찾아 준다', e: { green: 1, luck: 1 }, n: '주인이 고맙다며 선물을 줬어요' }] }),

  /* ───── 대학·청년 ───── */
  ev({ st: COL, cell: 'normal', bg: 'campus', t: '학과 동아리 모집', ch: [
    { l: '공모전 동아리', e: { sen: 5, int: 3 }, n: '첫 공모전 준비!' },
    { l: '봉사 동아리', e: { green: 1, happy: 4 }, n: '보람찬 주말' },
    { l: '창업 동아리', e: { tag: { 발명: 1 }, sen: 3 }, n: '사업 계획서를 써 봤어요' }] }),
  ev({ st: COL, cell: 'normal', bg: 'cafe', t: '아르바이트를 할까?', ch: [
    { l: '카페 알바', e: { money: 300, str: -2, sen: 2 }, n: '생활비도 벌고 손님 응대로 센스도 UP' },
    { l: '학교 연구실 보조', r: R('보통', 'int', null, { t: '교수님 추천으로 논문에 이름이!', e: { money: 150, int: 7 } }, { t: '연구 경험도 쌓았어요', e: { money: 150, int: 4 } }, { t: '실험만 반복… 지루했어요', e: { money: 150, int: 1, happy: -2 } }) }] }),
  ev({ st: COL, cell: 'normal', bg: 'airport', t: '교환학생 기회!', ch: [
    { l: '간다', r: R('보통', 'sen', null, { t: '세상이 넓어졌어요! 외국 친구도', e: { money: -500, int: 6, sen: 6, happy: 5 } }, { t: '공부는 했지만 돈이 많이 들었어요', e: { money: -500, int: 4, sen: 3 } }, { t: '향수병에 고생했어요', e: { money: -500, int: 2, happy: -3 } }) },
    { l: '국내에서 열심히', e: { int: 4, money: 100 }, n: '학점 관리로 장학금!' }] }),
  ev({ st: COL, cell: 'lucky', bg: 'hall', t: '공모전 대상!', n: '상금과 함께 이력서에 한 줄!', e: { money: 500, sen: 6, award: '대학생 공모전 대상' } }),
  ev({ st: COL, cell: 'lucky', bg: 'campus', t: '장학금을 받았어요!', n: '학비 걱정 덜었어요', e: { money: 800, int: 3 } }),
  ev({ st: COL, cell: 'unlucky', bg: 'office', t: '면접에서 떨어졌어요', ch: [
    { l: '부족한 점을 정리한다', e: { int: 5 }, n: '다음엔 꼭 붙을 거예요' },
    { l: '하루 종일 게임', r: R('도전', null, null, { t: '게임하다 아이디어가 번뜩! 기분 최고', e: { happy: 5, sen: 4 } }, { t: '기분 전환은 됐어요', e: { happy: 3, int: -2 } }, { t: '다음 면접 준비를 못 했어요', e: { int: -3 } }) }] }),
  ev({ st: AD, cell: 'unlucky', bg: 'home', t: '첫 월급 노리는 사기 문자 "고수익 알바"', ch: [
    { l: '무시하고 신고한다', r: R('안정', null, null, { t: '사기 조직 검거에 도움! 포상금', e: { int: 3, luck: 1, green: 1, money: 100 } }, { t: '사기였어요! 신고 완료', e: { int: 3, green: 1 } }, { t: '신고하느라 하루를 다 썼어요', e: { int: 2 } }) },
    { l: '연락해 본다', r: R('도전', null, null, { t: '진짜 단기 알바였어요! 쏠쏠', e: { money: 300, sen: 2 } }, { t: '수상해서 그만뒀어요', e: { int: 1 } }, { t: '돈만 날렸어요…', e: { money: -300, luck: -1 } }) }] }),

  /* ───── 사회 초년생·중년 공통 ───── */
  ev({ st: YOUNG, cell: 'normal', bg: 'bank', t: '첫 월급! 어떻게 쓸까?', ch: [
    { l: '부모님 선물', e: { money: -100, happy: 8 }, n: '부모님이 정말 기뻐하셨어요' },
    { l: '저축', e: { money: 100, int: 2 }, n: '통장에 차곡차곡' },
    { l: '갖고 싶던 것 쇼핑', e: { money: -200, happy: 6, sen: 2 }, n: '득템! 유행 감각도 UP' }] }),
  ev({ st: YOUNG, cell: 'normal', bg: 'home', t: '자취방 구하기', ch: [
    { l: '발품 팔아 꼼꼼히 본다', r: R('보통', 'int', null, { t: '역세권 좋은 방을 싸게!', e: { money: 300, happy: 3 } }, { t: '괜찮은 방을 구했어요', e: { money: 100 } }, { t: '발품만 팔고 비슷한 방…', e: { str: -2 } }) },
    { l: '처음 본 방으로', r: R('도전', null, null, { t: '알고 보니 숨은 명당!', e: { happy: 5, luck: 1 } }, { t: '창문이 북향이에요…', e: { money: -100 } }, { t: '곰팡이 방이었어요…', e: { money: -300, happy: -3 } }) }] }),
  ev({ st: YOUNG, cell: 'normal', bg: 'office', t: '신입 첫 실수!', ch: [
    { l: '바로 보고하고 고친다 (운세↑)', e: { int: 2, luck: 1 }, n: '선배가 믿을 만하다고 칭찬!' },
    { l: '몰래 넘어간다 (운세↓)', r: R('보통', null, null, { t: '아무도 모르게 해결! 평가도 좋아요', e: { main: 5, sal: 0.05, luck: -1 } }, { t: '조용히 넘어갔어요', e: { main: 2, luck: -1 } }, { t: '나중에 크게 터졌어요!', e: { sal: -0.2, luck: -1 } }) }] }),
  ev({ st: WORK, cell: 'normal', bg: 'office', t: '승진 프로젝트를 맡아 달래요', need: married, ch: [
    { l: '맡는다', r: R('보통', null, 'job', { t: '대성공! 승진!', e: { rank: 1, happy: -5, sal: 0.2 } }, { t: '무난하게 끝', e: { sal: 0.1, happy: -5 } }, { t: '야근만 하고 실패', e: { happy: -8, str: -3 } }) },
    { l: '거절하고 가족과 시간', e: { happy: 8, love: 10 }, n: '가족 여행을 다녀왔어요' }] }),
  ev({ st: WORK, cell: 'normal', bg: 'home', t: '집안일이 산더미!', need: married, ch: [
    { l: '가족이 나눠서 한다', e: { happy: 6, love: 10 }, n: '금방 끝났어요' },
    { l: '혼자 다 한다', r: R('보통', 'str', null, { t: '배우자가 감동해서 외식 선물!', e: { love: 20, happy: 4, str: -1 } }, { t: '혼자 하느라 지쳤어요', e: { str: -3, love: 2 } }, { t: '지쳐서 짜증만…', e: { str: -3, love: -10 } }) }] }),
  ev({ st: WORK, cell: 'normal', bg: 'home', t: '아이가 태어났어요! 육아휴직을 할까?', need: (S, p) => p.kids.some(k => S.round - k.born <= 1), ch: [
    { l: '육아휴직', r: R('안정', null, null, { t: '아이와 행복한 시간! 가족 사진도 찰칵', e: { happy: 10, love: 15, kidStat: 'sen', sal: -0.2 } }, { t: '육아는 힘들지만 보람차요', e: { happy: 6, love: 10, kidStat: 'sen', sal: -0.2 } }, { t: '복귀해 보니 일이 밀려 있어요', e: { happy: 4, love: 8, sal: -0.3 } }) },
    { l: '바로 복귀', r: R('도전', null, null, { t: '일에 집중해서 승진!', e: { rank: 1, love: -10 } }, { t: '일은 순조로워요', e: { sal: 0.1, love: -10 } }, { t: '아이 얼굴을 못 봐 속상해요', e: { love: -15, happy: -4 } }) }] }),
  ev({ st: WORK, cell: 'normal', bg: 'home', t: '아이에게 어떤 경험을 시켜 줄까?', need: hasKids, ch: [
    { l: '코딩 캠프', e: { money: -300, kidTag: '정보통신', kidStat: 'int' }, n: '아이가 앱을 만들었어요!' },
    { l: '같이 요리하기', e: { kidTag: '가정', kidStat: 'str', happy: 4 }, n: '맛있는 저녁 완성' },
    { l: '메이커 교실', e: { money: -200, kidTag: '제조', kidStat: 'str' }, n: '아이 손으로 만든 로봇!' },
    { l: '그냥 놀게 둔다', e: { kidStat: 'sen', happy: 3 }, n: '창의력이 쑥쑥' }] }),
  ev({ st: WORK, cell: 'normal', bg: 'museum', t: '가족 나들이! 어디로?', need: hasKids, ch: [
    { l: '과학관 (차 필요)', need: hasCar, e: { money: -100, kidTag: '생명', kidStat: 'sen', happy: 6 }, n: '아이가 공룡에 푹 빠졌어요' },
    { l: '동네 공원', e: { happy: 5, love: 5, str: 2 }, n: '도시락 먹고 뛰어놀았어요' }] }),
  ev({ st: ADULT, cell: 'normal', bg: 'travel', t: '여행을 떠날까?', ch: [
    { l: '해외 여행', r: R('보통', null, null, { t: '최고의 추억!', e: { money: -800, happy: 15, sen: 4 } }, { t: '즐거운 여행', e: { money: -800, happy: 8 } }, { t: '비 오고 짐 분실… 그래도 추억', e: { money: -900, happy: 3 } }) },
    { l: '캠핑 (차 필요)', need: hasCar, r: R('안정', null, null, { t: '별이 쏟아지는 밤!', e: { money: -100, happy: 12, love: 15 } }, { t: '즐거운 캠핑', e: { money: -100, happy: 7 } }, { t: '모기에 물렸어요', e: { money: -100, happy: 3 } }) },
    { l: '집에서 쉰다', e: { str: 3, happy: 2 }, n: '푹 쉬었어요' }] }),
  ev({ st: ADULT, cell: 'normal', bg: 'home', t: '1인 가구의 주말 — 무엇을 할까?', need: single, ch: [
    { l: '자격증 공부', e: { int: 6, happy: 3 }, n: '실력이 쌓여요' },
    { l: '운동', e: { str: 6, happy: 4 }, n: '몸이 가벼워요' },
    { l: '봉사 활동', e: { green: 1, happy: 6 }, n: '보람찬 하루' },
    { l: '혼자 여행', e: { money: -300, happy: 10, sen: 4 }, n: '나만의 시간 최고!' }] }),
  ev({ st: ADULT, cell: 'normal', bg: 'home', t: '주말 재능기부 요청이 왔어요', ch: [
    { l: '참여한다 (운세↑)', e: { green: 2, luck: 1, str: -1 }, n: '이웃들이 정말 고마워했어요 · 조금 피곤해요' },
    { l: '이번엔 쉰다', e: { str: 3, happy: 3 }, n: '푹 쉬었어요' }] }),
  ev({ st: ADULT, cell: 'normal', bg: 'mart', t: '가전제품을 바꿀 때가 됐어요', ch: [
    { l: '에너지 효율 1등급 (비싸지만 전기료↓)', r: R('안정', null, null, { t: '전기료가 쑥 줄었어요!', e: { money: -100, green: 1, happy: 3 } }, { t: '전기료도 아끼고 지구도 지켰어요', e: { money: -150, green: 1, happy: 2 } }, { t: '설치비가 더 들었어요', e: { money: -250, green: 1 } }) },
    { l: '제일 싼 것', r: R('도전', null, null, { t: '싸고 튼튼한 숨은 명품!', e: { money: -40, happy: 4, int: 1 } }, { t: '싸게 샀어요', e: { money: -60 } }, { t: '금방 고장 났어요…', e: { money: -200, happy: -2 } }) }] }),
  ev({ st: ADULT, cell: 'normal', bg: 'home', t: '리모델링을 해 볼까? (비용: 집값의 10%, 건설 직업은 5%)', need: hasHouse, ch: [
    { l: '한다', r: R('보통', (S, p) => (p.stats.str >= p.stats.sen ? 'str' : 'sen'), '건설',
        { t: '대성공! 집값 +30%', e: (S, p) => ({ money: -Math.round(p.house.value * (isConstr(p) ? 0.05 : 0.1)), houseVal: 0.3, happy: 6 }) },
        { t: '무난! 집값 +10%', e: (S, p) => ({ money: -Math.round(p.house.value * (isConstr(p) ? 0.05 : 0.1)), houseVal: 0.1 }) },
        { t: '공사 실패… 비용만 날렸어요 (집값은 그대로)', e: (S, p) => ({ money: -Math.round(p.house.value * (isConstr(p) ? 0.05 : 0.1)) }) },
        { bonus: (S, p) => (isConstr(p) ? [['건설 직업', 2]] : []) }) },
    { l: '안 한다', e: { money: 50 }, n: '지금 집도 좋아요' }] }),
  ev({ st: ADULT, cell: 'normal', bg: 'stock', t: '동창회에서 투자 제안', ch: [
    { l: '투자한다 (1,000만)', r: R('도전', 'int', null, { t: '대박!', e: { money: 2000 } }, { t: '본전', e: { money: 0 } }, { t: '손해…', e: { money: -1000 } }) },
    { l: '거절한다', e: { int: 2 }, n: '신중한 선택' }] }),

  /* 생활 기술 이벤트 (노말·불행) */
  ev({ st: ADULT, cell: 'unlucky', bg: 'home', t: '집에 물이 새요!', ch: [
    { l: '직접 고친다', r: R('보통', 'str', '건설', { t: '깔끔하게 고쳤어요!', e: { str: 3 } }, { t: '임시로 막았어요', e: { money: -50 } }, { t: '더 크게 터졌어요!', e: { money: -300, ins: 'fire' } }) },
    { l: '전문가를 부른다', call: '건설', cost: 200 },
    { l: '그냥 둔다', r: R('도전', null, null, { t: '알고 보니 윗집 문제! 윗집이 다 고쳐 줬어요', e: { happy: 3 } }, { t: '조금씩 새지만 버틸 만해요', e: { money: -50 } }, { t: '곰팡이가 피어 수리비가 두 배…', e: { money: -400, happy: -5, ins: 'fire' } }) }] }),
  ev({ st: ADULT, cell: 'unlucky', bg: 'home', t: '차단기가 자꾸 내려가요', ch: [
    { l: '직접 점검한다', r: R('보통', 'int', '건설', { t: '원인을 찾았어요! 문어발 콘센트', e: { int: 3 } }, { t: '일단 해결', e: { int: 1 } }, { t: '스파크가 튀었어요!', e: { money: -300, ins: 'fire' } }) },
    { l: '전문가를 부른다', call: '건설', cost: 150 },
    { l: '그냥 둔다', r: R('도전', null, null, { t: '일시적인 과부하였어요! 저절로 괜찮아짐', e: { happy: 2 } }, { t: '가끔 내려가 불편해요', e: { happy: -2 } }, { t: '화재 위험! 큰 수리비…', e: { money: -500, ins: 'fire' } }) }] }),
  ev({ st: ADULT, cell: 'unlucky', bg: 'home', t: '겨울에 보일러가 고장 났어요', ch: [
    { l: '직접 고친다', r: R('보통', 'str', '건설', { t: '따뜻해졌어요!', e: { str: 2 } }, { t: '반쯤 고쳤어요', e: { money: -50 } }, { t: '감기에 걸렸어요', e: { money: -100, str: -3, ins: 'health' } }) },
    { l: '전문가를 부른다', call: '건설', cost: 200 }] }),
  ev({ st: ADULT, cell: 'unlucky', bg: 'garage', t: '타이어 펑크!', ch: [
    { l: '직접 갈아 끼운다', r: R('보통', 'str', '수송', { t: '5분 만에 교체!', e: { str: 2 } }, { t: '조금 늦었어요', e: { money: -30 } }, { t: '못 갈아서 지각…', e: { money: -100 } }) },
    { l: '정비소를 부른다', call: '수송', cost: 100 }] }),
  ev({ st: ADULT, cell: 'unlucky', bg: 'home', t: '스마트폰이 고장 났어요', ch: [
    { l: '수리점에 맡긴다', call: '정보통신', cost: 150 },
    { l: '중고폰을 산다', r: R('보통', null, null, { t: '거의 새것 같은 중고폰을 싸게!', e: { money: -50, happy: 3 } }, { t: '아직 쓸 만해요', e: { money: -100 } }, { t: '배터리가 금방 닳아요…', e: { money: -100, happy: -2 } }) }] }),
  ev({ st: ADULT, cell: 'unlucky', bg: 'home', t: '수상한 문자 "택배 주소 확인 (링크)"', ch: [
    { l: '누르지 않고 신고한다', r: R('안정', 'int', '정보통신', { t: '스미싱 차단! 신고 포상', e: { money: 50, luck: 1 } }, { t: '잘 피했어요', e: { int: 1 } }, { t: '실수로 눌렀어요… 돈이 빠져나감', e: { money: -300 } }) },
    { l: '눌러 본다', r: R('도전', null, null, { t: '진짜 택배 안내였어요! 바로 받았어요', e: { happy: 3 } }, { t: '광고였어요… 스팸만 늘었어요', e: { happy: -2 } }, { t: '스미싱이었어요!', e: { money: -500, luck: -1 } }) }] }),
  ev({ st: ADULT, cell: 'unlucky', bg: 'kitchen', t: '냉장고 음식이 이상한 냄새가 나요', ch: [
    { l: '아깝지만 버린다', e: { money: -20, int: 2 }, n: '현명한 선택!' },
    { l: '그냥 먹는다', r: R('도전', 'str', null, { t: '멀쩡했어요! 음식도 안 버리고 돈도 아꼈어요', e: { happy: 2, green: 1 } }, { t: '배가 살살 아파요', e: { str: -2 } }, { t: '식중독… 병원에 갔어요', e: { money: -150, str: -5, ins: 'health' } }) }] }),
  ev({ st: ADULT, cell: 'unlucky', bg: 'home', t: '아끼는 옷에 얼룩이!', ch: [
    { l: '세탁 기호를 보고 맞게 빤다', r: R('안정', 'sen', null, { t: '새 옷처럼 깨끗!', e: { sen: 3, happy: 2 } }, { t: '얼룩이 거의 빠졌어요', e: { sen: 2 } }, { t: '얼룩이 조금 남았어요', e: { sen: 1 } }) },
    { l: '세탁기에 막 넣는다', r: R('도전', null, null, { t: '얼룩이 쏙! 시간도 아꼈어요', e: { happy: 3, str: 1 } }, { t: '옷이 조금 줄었어요', e: { money: -50 } }, { t: '옷이 망가졌어요…', e: { money: -100, happy: -2 } }) }] }),
  ev({ st: ADULT, cell: 'unlucky', bg: 'home', t: '층간 소음 때문에 잠을 못 자요', ch: [
    { l: '정중하게 대화한다', r: R('보통', 'sen', null, { t: '이웃과 친해져 선물까지!', e: { sen: 3, happy: 4, luck: 1 } }, { t: '이웃과 사이좋게 해결', e: { sen: 3, happy: 2 } }, { t: '대화가 잘 안 됐어요…', e: { happy: -2 } }) },
    { l: '쪽지를 붙인다', r: R('안정', null, null, { t: '쪽지를 보고 바로 조심해 줬어요', e: { happy: 3 } }, { t: '조금 나아졌어요', e: { happy: 1 } }, { t: '답장 쪽지로 싸움이…', e: { happy: -3 } }) },
    { l: '참는다', r: R('도전', null, null, { t: '알고 보니 잠깐 공사였어요! 금방 조용', e: { happy: 2, int: 1 } }, { t: '스트레스가 쌓여요', e: { happy: -3 } }, { t: '잠을 못 자 몸이 상했어요', e: { str: -3, happy: -3, luck: -1 } }) }] }),
  ev({ st: ADULT, cell: 'unlucky', bg: 'mart', t: '중고 거래에서 물건을 사려는데…', ch: [
    { l: '직접 만나서 확인한다', r: R('안정', 'int', null, { t: '좋은 물건을 싸게!', e: { money: -30, int: 2, happy: 2 } }, { t: '괜찮은 물건이에요', e: { money: -50, int: 1 } }, { t: '확인해 보니 고장이라 안 샀어요 (시간만…)', e: { str: -1 } }) },
    { l: '돈부터 먼저 보낸다', r: R('도전', null, null, { t: '빠르게 거래 끝! 택배로 잘 왔어요', e: { money: -30, happy: 3 } }, { t: '물건이 설명과 달라요…', e: { money: -100 } }, { t: '사기였어요…', e: { money: -300, luck: -1 } }) }] }),
  ev({ st: ADULT, cell: 'unlucky', bg: 'night', t: '정전된 밤', ch: [
    { l: '태양광 랜턴을 만든다', r: R('보통', 'sen', '적정기술', { t: '이웃에게도 나눠 줬어요', e: { green: 1, sen: 3 } }, { t: '불이 켜졌어요', e: { sen: 2 } }, { t: '실패… 촛불로 버텨요 (원리는 알았어요)', e: { sen: 1 } }) },
    { l: '그냥 잔다', r: R('보통', null, null, { t: '오랜만에 푹 잤어요!', e: { str: 3, happy: 2 } }, { t: '냉장고 음식이 조금 상했어요', e: { money: -50 } }, { t: '더워서 한숨도 못 잤어요', e: { str: -2, happy: -2 } }) }] }),
  ev({ st: ADULT, cell: 'unlucky', bg: 'garage', t: '교통사고가 났어요!', need: hasCar, e: { money: -800, ins: 'car', str: -3 }, n: '다친 데는 없어요' }),
  ev({ st: ADULT, cell: 'unlucky', bg: 'hospital', t: '감기·부상으로 병원에', e: { money: -300, ins: 'health', str: -3 }, n: '푹 쉬고 나았어요' }),
  ev({ st: ['middle'], cell: 'unlucky', bg: 'office', t: '회사 구조조정 소식…', ch: [
    { l: '경험을 살려 이직을 준비한다', r: R('보통', null, 'job', { t: '더 좋은 곳에서 연락이!', e: { sal: 0.3 } }, { t: '자리를 지켰어요', e: { main: 1 } }, { t: '한동안 힘들었어요', e: { sal: -0.3 } }) },
    { l: '버틴다', r: R('보통', null, null, { t: '살아남아 핵심 인재로! 연봉 UP', e: { sal: 0.15, main: 2 } }, { t: '살아남았어요', e: { str: -2, main: 1 } }, { t: '결국 권고사직… 쉬면서 재충전', e: { sal: -0.3, str: 2 } }) }] }),
  ev({ st: ADULT, cell: 'unlucky', bg: 'home', t: '태풍 피해', e: { money: -600, ins: 'fire' }, n: '창문이 깨지고 물이 들어왔어요' }),
  ev({ st: ADULT, cell: 'unlucky', bg: 'stock', t: '"원금 보장 고수익" 투자 권유', ch: [
    { l: '수상하니 거절한다', r: R('안정', 'int', null, { t: '사기였어요! 잘 피했어요', e: { luck: 1, int: 3 } }, { t: '잘 피했어요', e: { int: 1 } }, { t: '조금 넣었다가 날렸어요', e: { money: -300 } }) },
    { l: '투자한다', r: R('도전', null, null, { t: '운 좋게 원금+이자를 받고 빠져나왔어요', e: { money: 300 } }, { t: '원금 일부만 돌려받았어요', e: { money: -700 } }, { t: '투자 사기였어요…', e: { money: -1500, luck: -1 } }) }] }),
  ev({ st: ADULT, cell: 'unlucky', bg: 'creditor', t: '빚쟁이가 찾아왔어요', need: hasDebt, e: { cash: -0.3, debtCut: 0.1 }, n: '돈을 가져갔어요' }),
  ev({ st: WORK, cell: 'unlucky', bg: 'home', t: '부부 싸움…', need: (S, p) => married(S, p) && (p.love ?? 50) < 40, ch: [
    { l: '대화로 푼다', r: R('보통', 'sen', null, { t: '더 단단해졌어요!', e: { love: 20, happy: 3 } }, { t: '조금씩 풀렸어요', e: { love: 10, happy: 1 } }, { t: '대화하다 더 싸웠어요…', e: { love: -5, happy: -2 } }) },
    { l: '각자 시간을 갖는다', r: R('보통', null, null, { t: '혼자 생각하니 마음이 정리됐어요', e: { love: 10, sen: 2 } }, { t: '서먹서먹…', e: { happy: -3 } }, { t: '거리가 더 멀어졌어요', e: { love: -10, happy: -3 } }) }] }),
  ev({ st: ADULT, cell: 'unlucky', bg: 'office', t: '야근이 계속돼요', ch: [
    { l: '건강을 위해 쉬겠다고 말한다', r: R('안정', null, null, { t: '팀장님이 업무를 조정해 줬어요', e: { str: 3 } }, { t: '몸이 회복됐어요', e: { str: 3, sal: -0.05 } }, { t: '눈치가 보여요…', e: { str: 2, happy: -2, sal: -0.05 } }) },
    { l: '계속 버틴다', r: R('도전', 'str', null, { t: '프로젝트 성공! 성과급까지', e: { str: -3, sal: 0.15, money: 500, main: 2 } }, { t: '돈은 벌었지만 지쳐요', e: { str: -6, sal: 0.1, happy: -5 } }, { t: '번아웃… 병원 신세', e: { str: -8, happy: -6, money: -200, ins: 'health' } }) }] }),

  /* ───── 행운 (어른) ───── */
  ev({ st: ADULT, cell: 'lucky', bg: 'home', t: '지갑을 주웠어요', ch: [
    { l: '주인에게 돌려준다 (운세↑)', e: { green: 1, luck: 1, money: 50 }, n: '주인이 고맙다며 작은 사례금을 줬어요' },
    { l: '가진다 (운세↓)', r: R('보통', null, null, { t: '아무도 몰라요… 큰돈이 생겼어요', e: { money: 500, luck: -1 } }, { t: '돈은 생겼지만 찜찜해요', e: { money: 300, luck: -1 } }, { t: '경찰이 찾아왔어요! 돌려주고 벌금까지…', e: { money: -200, luck: -1 } }) }] }),
  ev({ st: ADULT, cell: 'lucky', bg: 'stage', t: '경품 당첨!', ch: [
    { l: '해외여행권', e: { happy: 12, sen: 3 }, n: '공짜 여행!' },
    { l: '최신 가전', e: { money: 300, happy: 4 }, n: '집이 스마트해졌어요' }] }),
  ev({ st: ADULT, cell: 'lucky', bg: 'stage', t: '방송 출연! 내 직업이 TV에', need: (S, p) => !!p.job, e: { sal: 0.3, happy: 6 }, n: '인기 폭발!' }),
  ev({ st: ADULT, cell: 'lucky', bg: 'office', t: '내 영상이 갑자기 인기!', ch: [
    { l: '광고를 붙인다', r: R('도전', 'sen', '정보통신', { t: '광고 수익 대박!', e: { money: 1500 } }, { t: '용돈 벌이', e: { money: 300 } }, { t: '금방 식었어요', e: { money: 30 } }) },
    { l: '그냥 즐긴다', e: { happy: 6 }, n: '댓글이 재밌어요' }] }),
  ev({ st: ADULT, cell: 'lucky', bg: 'office', t: '헤드헌터에게서 연락이 왔어요', need: (S, p) => !!p.job && !p.retired, ch: [
    { l: '이직을 알아본다', then: { t: 'jobPick', change: true }, n: '어떤 자리가 있을까?' },
    { l: '지금 회사가 좋아요', e: { happy: 3 }, n: '의리!' }] }),
  ev({ st: ['young', 'middle'], cell: 'lucky', bg: 'office', t: '이직 제안이 왔어요', need: (S, p) => !!p.job && !p.retired, ch: [
    { l: '어떤 곳인지 본다', then: { t: 'jobPick', change: true }, n: '새로운 기회!' },
    { l: '거절한다', e: { main: 2 }, n: '지금 일에 집중' }] }),
  ev({ st: ADULT, cell: 'lucky', bg: 'stage', t: '올해의 기술인상 수상!', need: (S, p) => p.job && !p.job.free, e: { rank: 1, happy: 5 }, n: '실력을 인정받았어요' }),
  ev({ st: ADULT, cell: 'lucky', bg: 'bank', t: '잊고 있던 통장 발견!', e: { money: 500 }, n: '이런 돈이 있었다니!' }),
  ev({ st: WORK, cell: 'lucky', bg: 'river', t: '결혼기념일 서프라이즈', need: married, e: { love: 30, happy: 6 }, n: '감동의 눈물' }),
  ev({ st: WORK, cell: 'lucky', bg: 'home', t: '아이가 상을 받아 왔어요!', need: hasKids, e: { kidStat: 'int', happy: 8 }, n: '우리 아이 최고!' }),
  ev({ st: ADULT, cell: 'lucky', bg: 'party', t: '친구의 첫 작품을 선물로 받았어요', need: (S, p) => S.players.length > 1, e: { souvenir: true, happy: 3 }, n: '친구가 성공하면 값이 올라요!' }),
  ev({ st: ADULT, cell: 'lucky', bg: 'home', t: '우리 동네 개발 소식!', need: hasHouse, e: { houseVal: 0.2 }, n: '집값이 올랐어요' }),
  ev({ st: ADULT, cell: 'lucky', bg: 'farm', t: '텃밭 대풍년!', e: (S, p) => ({ money: 200 + (p.tags['생명'] > 0 ? 300 : 0), happy: 4 }), n: '이웃과 나눠 먹었어요' }),
  ev({ st: ADULT, cell: 'lucky', bg: 'shop', t: '상점 쿠폰을 받았어요', e: { card: 'random' }, n: '카드 한 장 득템!' }),
  ev({ st: AD, cell: 'lucky', bg: 'lab', t: '아이디어로 특허를 출원했어요', ch: [
    { l: '출원한다 (200만)', r: R('보통', 'sen', '발명', { t: '특허 등록! 기업에서 연락까지', e: { money: -200, patent: 1, luck: 1 } }, { t: '특허 등록! 이제 로열티가 들어와요', e: { money: -200, patent: 1 } }, { t: '비슷한 특허가 이미 있었어요…', e: { money: -200, int: 2 } }) },
    { l: '아이디어를 더 다듬는다', e: { sen: 4, int: 2 }, n: '아이디어 노트가 두꺼워졌어요' }] }),
  ev({ st: AD, cell: 'lucky', bg: 'office', t: '내 작품을 누가 베꼈어요!', ch: [
    { l: '특허·저작권으로 대응', need: (S, p) => p.patents > 0, e: { money: 1000, luck: 1 }, n: '소송 승리! 배상금을 받았어요' },
    { l: '그냥 넘어간다', r: R('보통', null, null, { t: '오히려 원조로 유명해졌어요!', e: { happy: 5, luck: 1 } }, { t: '특허를 미리 냈더라면…', e: { happy: -2 } }, { t: '베낀 쪽이 더 잘 팔려요… 속상', e: { happy: -4, money: -100 } }) }] }),

  /* ───── 매우 럭키 ───── */
  ev({ st: ADULT, cell: 'verylucky', bg: 'stage', t: '🎰 로또를 샀어요!', ch: [
    { l: '번호를 고른다', r: R('도전', null, null, { t: '1등!!! 30억!', e: { money: 300000 } }, { t: '5등 5천 원', e: { money: 1 } }, { t: '꽝! 그래도 두근두근 재밌었어요', e: { happy: 1 } }) },
    { l: '안 산다', e: { int: 2 }, n: '그 돈으로 맛있는 걸!' }] }),
  ev({ st: ADULT, cell: 'verylucky', bg: 'bank', t: '연금 복권 당첨!', e: { money: 5000, happy: 8 }, n: '평생 월급 같은 기분!' }),
  ev({ st: ADULT, cell: 'verylucky', bg: 'home', t: '먼 친척의 유산', e: { money: 10000 }, n: '얼굴도 모르는 친척이…' }),
  ev({ st: ADULT, cell: 'verylucky', bg: 'stock', t: '오래 가진 주식이 10배!', need: (S, p) => p.stocks.length > 0, e: (S, p) => { p.stocks.forEach(s => { s.value *= 10; }); return { happy: 8 }; }, n: '주식 부자!' }),
  ev({ st: ADULT, cell: 'verylucky', bg: 'garage', t: '오래 탄 차가 클래식카로!', need: hasCar, e: (S, p) => { p.carPaid = (p.carPaid || 0) * 4; return { happy: 5 }; }, n: '차값이 산 값보다 올랐어요!' }),
  ev({ st: SCH, cell: 'lucky', bg: 'hall', t: '어린이 발명왕 대상!', need: (S, p) => S.stage === 2, e: { money: 30, sen: 10, card: 'random', luck: 1, award: '어린이 발명왕 대상' }, n: '신문에도 나왔어요!' }),

  /* ───── 황혼기 ───── */
  ev({ st: OLD, cell: 'normal', bg: 'hospital', t: '건강검진', ch: [
    { l: '꼼꼼히 받는다', r: R('안정', 'str', null, { t: '건강해요! 운동 처방까지', e: { money: -100, str: 5, happy: 2 } }, { t: '건강해요!', e: { money: -100, str: 4 } }, { t: '결과를 기다리며 걱정했어요', e: { money: -100, str: 2, happy: -2 } }) },
    { l: '귀찮아서 미룬다', r: R('도전', 'str', null, { t: '다행히 건강! 검진비도 아꼈어요', e: { money: 50, happy: 2 } }, { t: '조금 아팠어요', e: { money: -100 } }, { t: '병원비가 많이…', e: { money: -800, ins: 'health' } }) }] }),
  ev({ st: OLD, cell: 'normal', bg: 'classroom', t: '인생 두 번째 도전!', ch: [
    { l: '늦깎이 자격증 공부', e: { int: 6, happy: 6 }, n: '합격! 나이는 숫자일 뿐' },
    { l: '동네 어르신 기술 교실 열기', e: { green: 2, happy: 6 }, n: '재능기부 인기 폭발' },
    { l: '늦깎이 창업', r: R('도전', 'sen', '발명', { t: '대박 아이템!', e: { money: 3000 } }, { t: '소소한 수익', e: { money: 300 } }, { t: '접었어요', e: { money: -500 } }) }] }),
  ev({ st: OLD, cell: 'normal', bg: 'home', t: '손주가 놀러 왔어요', need: hasKids, e: { happy: 8 }, n: '용돈 주고 같이 놀았어요' }),
  ev({ st: OLD, cell: 'normal', bg: 'home', t: '스마트폰 쓰기가 어려워요', ch: [
    { l: '자녀·손주에게 배운다', need: hasKids, e: { int: 4, happy: 4 }, n: '이제 영상 통화도 척척' },
    { l: '복지관 디지털 교실', e: { int: 4 }, n: '키오스크도 문제없어요' }] }),
  ev({ st: OLD, cell: 'unlucky', bg: 'home', t: '보이스피싱 전화 "아들이 사고를…"', ch: [
    { l: '끊고 가족에게 직접 확인', r: R('안정', 'int', null, { t: '거짓말이었어요! 신고 완료', e: { luck: 1 } }, { t: '잘 넘겼어요', e: { int: 1 } }, { t: '깜빡 속을 뻔…', e: { money: -100 } }) },
    { l: '일단 끝까지 들어 본다', r: R('도전', 'int', null, { t: '수상한 점을 눈치채고 신고! 범인 검거', e: { luck: 1, int: 3, green: 1 } }, { t: '한참 통화하다 이상해서 끊었어요', e: { happy: -2 } }, { t: '속아서 송금하고 말았어요…', e: { money: -2000, luck: -1 } }) }] }),
  ev({ st: OLD, cell: 'unlucky', bg: 'hospital', t: '무릎이 시큰시큰', e: { money: -300, ins: 'health' }, n: '물리치료를 받았어요' }),
  ev({ st: OLD, cell: 'unlucky', bg: 'home', t: '오래된 집 여기저기 고장', ch: [
    { l: '전문가를 부른다', call: '건설', cost: 300 },
    { l: '직접 고친다', r: R('보통', 'str', '건설', { t: '말끔! 수리비도 아꼈어요', e: { str: 3, happy: 2 } }, { t: '그럭저럭', e: { money: -100 } }, { t: '더 망가졌어요', e: { money: -500 } }) }] }),
  ev({ st: OLD, cell: 'lucky', bg: 'museum', t: '젊을 때 만든 작품이 박물관에 전시!', e: (S, p) => ({ money: 1000 + p.patents * 1000, happy: 8 }), n: '사용료가 들어왔어요' }),
  ev({ st: OLD, cell: 'lucky', bg: 'farm', t: '젊을 때 심은 나무가 숲이 됐어요', e: (S, p) => ({ green: p.tags['적정기술'] + p.tags['생명'] > 0 ? 3 : 2, happy: 6 }), n: '마을 사람들이 쉬어 가요' }),
  ev({ st: OLD, cell: 'lucky', bg: 'classroom', t: '동네 어르신 기술 교실이 인기!', e: { green: 2, luck: 1, happy: 5 }, n: '재능기부 최고!' }),

  /* ───── 매우 럭키 (아기 ~ 고등학생) ───── */
  ev({ st: BABY, cell: 'verylucky', bg: 'stage', t: '🌈 아기 모델로 뽑혔어요!', e: { happy: 8, sen: 8 }, n: '방긋 웃는 사진이 광고에 나왔어요' }),
  ev({ st: BABY, cell: 'verylucky', bg: 'park', t: '🌈 네잎클로버를 꼭 쥐고 있었어요!', e: { luck: 1, happy: 5, anyStat: 6 }, n: '행운이 졸졸 따라다녀요' }),
  ev({ st: KID, cell: 'verylucky', bg: 'stage', t: '🌈 어린이 TV 퀴즈쇼 우승!', e: { int: 10, happy: 5, award: '어린이 퀴즈쇼 우승', money: 10 }, n: '전국 친구들이 알아봐요' }),
  ev({ st: KID, cell: 'verylucky', bg: 'park', t: '🌈 놀이공원 경품 추첨 당첨! 무엇을 받을까?', ch: [
    { l: '과학 실험 세트', e: { int: 8, tag: { 생명: 1 } }, n: '집이 실험실이 됐어요' },
    { l: '두발자전거', e: { str: 8, happy: 4 }, n: '동네 한 바퀴 씽씽!' },
    { l: '만들기 공구 상자', e: { sen: 8, tag: { 제조: 1 } }, n: '뚝딱뚝딱 무엇이든 만들어요' }] }),
  ev({ st: ELEM, cell: 'verylucky', bg: 'hall', t: '🌈 전국 학생 발명품 경진대회 대상!', e: { sen: 12, tag: { 발명: 1 }, award: '학생 발명품 경진대회 대상', money: 20, luck: 1 }, n: '신문에 내 이름이 나왔어요!' }),
  ev({ st: ELEM, cell: 'verylucky', bg: 'studio', t: '🌈 내가 만든 로봇이 방송에 나왔어요', e: { sen: 8, int: 6, tag: { 제조: 1 }, happy: 5 }, n: '로봇 박사님이 칭찬해 주셨어요' }),
  ev({ st: ELEM, cell: 'verylucky', bg: 'museum', t: '🌈 과학관 명예 어린이 연구원 선정!', e: { int: 10, tag: { 생명: 1 }, card: 'random' }, n: '연구원 배지와 선물을 받았어요' }),
  ev({ st: MID, cell: 'verylucky', bg: 'techroom', t: '🌈 내가 만든 앱이 앱 장터 1위!', e: { int: 10, tag: { 정보통신: 1 }, award: '청소년 앱 공모전 대상', money: 30 }, n: '다운로드 10만 회 돌파!' }),
  ev({ st: MID, cell: 'verylucky', bg: 'lab', t: '🌈 청소년 과학 탐구 올림피아드 금메달', e: { int: 12, award: '과학 탐구 올림피아드 금메달', luck: 1 }, n: '세계 대회에도 나가요!' }),
  ev({ st: MID, cell: 'verylucky', bg: 'airport', t: '🌈 해외 과학 캠프 장학생! 어디로 갈까?', ch: [
    { l: '로봇 강국 일본', e: { sen: 8, tag: { 제조: 1 } }, n: '로봇 공장을 견학했어요' },
    { l: 'IT의 본고장 미국', e: { int: 8, tag: { 정보통신: 1 } }, n: '코딩 캠프에 참가했어요' },
    { l: '친환경 도시 독일', e: { sen: 6, tag: { 적정기술: 1 }, green: 1 }, n: '태양광 마을을 둘러봤어요' }] }),
  ev({ st: HIGH, cell: 'verylucky', bg: 'hall', t: '🌈 국제 기능올림픽 국가대표 선발!', e: { str: 10, sen: 6, award: '국제 기능올림픽 국가대표', money: 50, luck: 1 }, n: '세계 무대에 서요!' }),
  ev({ st: HIGH, cell: 'verylucky', bg: 'garage_studio', t: '🌈 청소년 창업 대회 대상!', e: { sen: 10, tag: { 발명: 1 }, award: '청소년 창업 대회 대상', money: 50 }, n: '투자 상담 제안까지 받았어요' }),
  ev({ st: HIGH, cell: 'verylucky', bg: 'campus', t: '🌈 대학 총장 추천 장학생!', e: { int: 10, luck: 1, card: 'random' }, n: '대학 등록금 걱정 덜었어요' }),

  /* ───── 고등학교 종류별 ───── */
  ev({ st: HIGH, cell: 'normal', bg: 'lab', t: '과학고 R&E 연구! 주제를 골라요', need: (S, p) => ['science', 'gifted'].includes(p.school), ch: [
    { l: '어려운 주제에 도전 (교수님과 함께)', r: R('도전', 'int', null, { t: '학회 발표까지! 연구상', e: { int: 10, award: '청소년 R&E 연구상', tag: { 생명: 1 } } }, { t: '보고서 완성!', e: { int: 6 } }, { t: '실험이 계속 실패… 그래도 배웠어요', e: { int: 2, happy: -2 } }) },
    { l: '확실한 주제로 차근차근', e: { int: 5, sen: 2 }, n: '깔끔한 결과로 좋은 평가!' }] }),
  ev({ st: HIGH, cell: 'normal', bg: 'stage', t: '예술고 졸업 작품 전시회', need: (S, p) => p.school === 'arts', ch: [
    { l: '과감한 실험 작품', r: R('도전', 'sen', '발명', { t: '디자인 회사에서 연락이!', e: { sen: 10, tag: { 발명: 1 }, award: '졸업 전시 대상' } }, { t: '관람객 반응이 좋아요', e: { sen: 6 } }, { t: '너무 낯설다는 평…', e: { sen: 2, happy: -2 } }) },
    { l: '완성도 높은 작품', e: { sen: 6, happy: 2 }, n: '꼼꼼한 완성도로 칭찬받았어요' }] }),

  /* ───── 내가 어른일 때: 자녀·손주 ───── */
  ev({ st: WORK, cell: 'unlucky', bg: 'home', t: '아이가 스마트폰 액정을 깼어요', need: hasKids, ch: [
    { l: '바로 수리해 준다', e: { money: -30, happy: 2 }, n: '아이가 고마워해요' },
    { l: '아이와 같이 고쳐 본다', r: R('보통', 'sen', '정보통신', { t: '아이가 고치는 법을 배웠어요!', e: { kidTag: '정보통신', kidStat: 'sen', sen: 2 } }, { t: '그럭저럭 고쳤어요', e: { sen: 2 } }, { t: '더 망가져 결국 수리점에…', e: { money: -60, happy: -2 } }) }] }),
  ev({ st: WORK, cell: 'normal', bg: 'classroom', t: '아이가 학원을 하나 더 다니고 싶대요', need: hasKids, ch: [
    { l: '보내 준다', e: { money: -200, kidStat: 'int' }, n: '아이 실력이 쑥!' },
    { l: '집에서 같이 공부한다', r: R('보통', 'int', null, { t: '아이와 더 가까워지고 실력도!', e: { kidStat: 'int', happy: 3, str: -1 } }, { t: '조금 도움이 됐어요', e: { happy: 1 } }, { t: '서로 짜증만…', e: { happy: -3 } }) }] }),
  ev({ st: OLD, cell: 'lucky', bg: 'home', t: '손주가 놀러 왔어요!', need: hasKids, ch: [
    { l: '용돈을 두둑이 준다', e: { money: -100, happy: 6 }, n: '손주가 활짝 웃어요' },
    { l: '같이 로봇을 만든다', e: { happy: 4, sen: 3 }, n: '할머니·할아버지 최고! 손주가 신났어요' }] }),
];

/* ───── ❓ 미스터리 미션 (초·중·고): 보통 칸에서 가끔, 빚이 있으면 더 자주 — 심부름·분실물·봉사로 용돈 벌기 ───── */
let mi = 0;
const ms = (o) => ({ id: 'm' + (++mi), cell: 'mission', ...o });
export const MISSIONS = [
  ms({ st: SCH, bg: 'city', t: '🔍 길에서 지갑을 주웠어요!', ch: [
    { l: '경찰서에 가져다준다 (운세↑)', r: R('안정', null, null, { t: '주인이 찾아와 사례금! 감사장까지', e: { money: 30, luck: 1, award: '분실물 신고 감사장' } }, { t: '주인을 찾았어요! 작은 사례금', e: { money: 10, luck: 1 } }, { t: '주인은 못 찾았지만 뿌듯해요', e: { luck: 1, happy: 2 } }) },
    { l: '내가 가진다 (운세↓)', r: R('보통', null, null, { t: '지갑에 돈이 조금 들어 있었어요', e: { money: 20, luck: -1 } }, { t: '텅 빈 지갑이었어요…', e: { luck: -1, happy: -1 } }, { t: '주인이 나타나 도둑으로 오해받았어요!', e: { luck: -1, happy: -4, sen: -2 } }) }] }),
  ms({ st: ['elem', 'mid'], bg: 'mart', t: '🛒 옆집 할머니가 장보기 심부름을 부탁하셨어요', ch: [
    { l: '기꺼이 돕는다', r: R('안정', null, null, { t: '할머니가 고맙다며 용돈을 두둑이!', e: { money: 20, happy: 3, green: 1 } }, { t: '심부름 완료! 용돈 조금', e: { money: 10, happy: 2 } }, { t: '물건을 잘못 사 와서 다시 다녀왔어요', e: { money: 5, str: -1 } }) },
    { l: '숙제를 먼저 한다', e: { int: 3 }, n: '숙제를 끝냈어요' }] }),
  ms({ st: TEEN, bg: 'park', t: '🐕 이웃집 강아지 산책 아르바이트', ch: [
    { l: '맡는다', r: R('보통', 'str', null, { t: '강아지랑 친해져 단골 알바가 됐어요!', e: { money: 30, str: 3 } }, { t: '산책 완료!', e: { money: 15, str: 2 } }, { t: '강아지가 도망가서 한참 찾았어요…', e: { money: 5, str: -2, happy: -2 } }) },
    { l: '운동 삼아 혼자 뛴다', e: { str: 3 }, n: '체력이 늘었어요' }] }),
  ms({ st: TEEN, bg: 'home', t: '📱 동네 어르신이 스마트폰을 알려 달래요', ch: [
    { l: '차근차근 알려 드린다', r: R('안정', 'int', '정보통신', { t: '어르신이 고맙다며 용돈을!', e: { money: 20, int: 3, green: 1 } }, { t: '영상 통화 성공!', e: { money: 10, int: 2 } }, { t: '설명하다 오히려 꼬였어요…', e: { int: 1, happy: -2 } }) },
    { l: '친구랑 놀기로 했어요', e: { happy: 3, sen: 1 }, n: '친구랑 신나게 놀았어요' }] }),
  ms({ st: TEEN, bg: 'city', t: '🎨 동네 벽화 그리기 봉사 모집', ch: [
    { l: '참여한다', r: R('보통', 'sen', '발명', { t: '구청 상과 상금까지!', e: { money: 30, sen: 6, award: '동네 벽화 공모 우수상' } }, { t: '골목이 환해졌어요', e: { sen: 4, green: 1 } }, { t: '비가 와서 그림이 번졌어요…', e: { sen: 1, happy: -2 } }) },
    { l: '구경하며 사진을 찍는다', e: { sen: 2, happy: 2 }, n: '멋진 사진을 건졌어요' }] }),
  ms({ st: ['elem', 'mid'], bg: 'park', t: '♻️ 동네 재활용품 모으기 대회', ch: [
    { l: '열심히 모은다', r: R('보통', 'str', '적정기술', { t: '1등! 문화상품권을 받았어요', e: { money: 20, green: 2, award: '재활용 대회 1등' } }, { t: '참가 기념품!', e: { money: 5, green: 1 } }, { t: '힘만 들었어요… 그래도 지구는 깨끗', e: { str: -1, green: 1 } }) },
    { l: '친구 팀을 응원한다', e: { happy: 3, sen: 2 }, n: '응원 구호를 직접 만들었어요!' }] }),
  ms({ st: HIGH, bg: 'city', t: '📄 분식집 전단지 돌리기 아르바이트', ch: [
    { l: '한다', r: R('보통', 'str', null, { t: '사장님이 떡볶이까지 사 주셨어요!', e: { money: 30, str: 2, happy: 2 } }, { t: '알바비를 받았어요', e: { money: 20 } }, { t: '비가 와서 전단지가 다 젖었어요…', e: { money: 5, happy: -2 } }) },
    { l: '시험공부가 먼저', e: { int: 4 }, n: '공부가 잘됐어요' }] }),
  ms({ st: TEEN, bg: 'home', t: '🧸 이웃집 쌍둥이를 돌봐 달래요', ch: [
    { l: '맡는다', r: R('보통', 'sen', '가정', { t: '쌍둥이가 내 말만 들어요! 돌봄 알바비', e: { money: 25, sen: 4 } }, { t: '무사히 돌봤어요', e: { money: 15, sen: 2 } }, { t: '장난감 정리만 하다 끝났어요…', e: { money: 5, happy: -3 } }) },
    { l: '거절하고 쉰다', e: { int: 2, happy: 1 }, n: '푹 쉬었어요' }] }),
];

/* ───── 경험 칸: 분야 경험 태그 고르기 ───── */
let x = 0;
const xp = (o) => ({ id: 'x' + (++x), cell: 'exp', ...o });
export const EXP_EVENTS = [
  xp({ st: ['kid', 'elem'], bg: 'museum', t: '체험 학습! 어디로 갈까?', ch: [
    { l: '🚀 항공우주 박물관', e: { tag: { 수송: 1 }, int: 3 }, n: '로켓 발사 체험!' },
    { l: '🌱 식물원', e: { tag: { 생명: 1 }, sen: 3 }, n: '신기한 식물이 가득!' },
    { l: '🏗️ 건축 체험관', e: { tag: { 건설: 1 }, str: 3 }, n: '나만의 집 짓기!' }] }),
  xp({ st: ['elem', 'mid'], bg: 'classroom', t: '방과 후 수업을 골라요', ch: [
    { l: '💻 코딩', e: { tag: { 정보통신: 1 }, int: 4 }, n: '게임을 만들었어요' },
    { l: '🍳 요리', e: { tag: { 가정: 1 }, str: 2, sen: 2 }, n: '요리사 같아요' },
    { l: '🤖 로봇', e: { tag: { 제조: 1 }, sen: 4 }, n: '로봇이 움직여요!' }] }),
  xp({ st: ['mid', 'high'], bg: 'techroom', t: '기술 시간 프로젝트 주제를 골라요', ch: [
    { l: '💡 생활 속 불편 해결 발명품', e: { tag: { 발명: 1 }, sen: 5 }, n: '아이디어 노트 완성' },
    { l: '🌍 적정기술 정수기 만들기', e: { tag: { 적정기술: 1 }, green: 1, sen: 3 }, n: '깨끗한 물이 나와요!' },
    { l: '🚗 친환경 미니카', e: { tag: { 수송: 1 }, str: 3, sen: 2 }, n: '태양광으로 달려요' }] }),
  xp({ st: ['mid', 'high'], bg: 'hall', t: '진로 박람회! 어느 부스에?', ch: [
    { l: '🏭 스마트공장', e: { tag: { 제조: 1 }, int: 3 }, n: '공장이 스스로 일해요' },
    { l: '🧬 바이오', e: { tag: { 생명: 1 }, int: 3 }, n: '유전자 실험 체험' },
    { l: '👗 패션·리빙', e: { tag: { 가정: 1 }, sen: 3 }, n: '업사이클 가방 만들기' },
    { l: '🛰️ 드론·위성', e: { tag: { 수송: 1 }, sen: 3 }, n: '드론 조종 체험' }] }),
  xp({ st: ['college', 'young'], bg: 'hall', t: '주말 원데이 클래스', ch: [
    { l: '🔧 목공·집수리', e: { tag: { 건설: 1 }, str: 4 }, n: '선반을 만들었어요' },
    { l: '📊 데이터 분석', e: { tag: { 정보통신: 1 }, int: 4 }, n: '엑셀 마스터!' },
    { l: '🌿 도시 농업', e: { tag: { 생명: 1 }, str: 2, sen: 2 }, n: '베란다 텃밭 완성' }] }),
  xp({ st: ['college', 'young'], bg: 'travel', t: '해외 봉사 기회', ch: [
    { l: '🌍 적정기술 봉사 (태양광·정수)', e: { tag: { 적정기술: 1 }, green: 2, happy: 5 }, n: '마을에 불이 켜졌어요!' },
    { l: '🏗️ 학교 짓기 봉사', e: { tag: { 건설: 1 }, green: 2, str: 3 }, n: '아이들이 기뻐해요' }] }),
];

/* ───── 직업 이벤트: 분야별 틀 (+ 일부 직업 전용) ─────
   fate: 직업 칸 룰렛 {t: 상황, g/n/b: 결과}, good/bad: 직업 행운·불행 {t, fx?} — 좋은 일·나쁜 일 같은 개수 */
const F = (t, g, n, b) => ({ t, g, n, b });
// 직업 이벤트 (원작처럼 구체적인 이야기 + 금액). {m} 자리에 금액이 들어감.
// 좋은 일·나쁜 일은 분야마다 8개씩 같은 수로 (직업 전용이 있으면 그것과 섞어서 나옴)
export const JOB_EVENTS = {
  byField: {
    '발명·디자인': {
      fate: [F('신제품 디자인 발표!', '대박 상품! 주문 폭주', '무난한 반응', '디자인 표절 의혹…'), F('국제 공모전 출품', '대상 수상!', '입선', '탈락')],
      good: [
        { t: '직접 디자인한 텀블러가 홈쇼핑에서 완판! {m}을 받는다' }, { t: '국제 디자인 어워드 대상! 상금 {m}을 받는다' },
        { t: '내가 만든 캐릭터가 글로벌 시장에 진출! {m}을 받는다' }, { t: '유명 브랜드가 협업을 제안했다! 계약금 {m}을 받는다' },
        { t: '아이디어 제품으로 특허 등록! 기술료 {m}을 받는다', fx: { patent: 1 } }, { t: '크라우드펀딩 목표 1,000% 달성! {m}을 받는다' },
        { t: '내 작품이 미술관에 전시되고 팔렸다! {m}을 받는다' }, { t: '내 디자인이 지하철 안내판으로 채택! {m}을 받는다' },
      ],
      bad: [
        { t: '아이디어를 도용당해 소송을 했다… {m}이 나갔다' }, { t: '전시 직전에 시제품이 부서졌다… {m}이 나갔다' },
        { t: '고객이 디자인을 처음부터 다 바꾸래요… {m}이 나갔다' }, { t: '작업 파일이 날아가 처음부터 다시… {m}이 나갔다' },
        { t: '표절 의혹을 해명하느라 바빴다… {m}이 나갔다' }, { t: '재료비가 갑자기 두 배로 올랐다… {m}이 나갔다' },
        { t: '마감에 쫓겨 밤샘하다 몸살… 병원비 {m}이 나갔다' }, { t: '해외로 보낸 샘플이 사라졌다… {m}이 나갔다' },
      ],
    },
    제조: {
      fate: [F('신제품 개발 프로젝트', '대성공! 생산 시작', '목표 달성', '불량품이 나왔어요'), F('공장 생산성 대회', '1등 공장!', '중간', '기계 고장')],
      good: [
        { t: '내가 만든 부품이 세계 1위 자동차에 들어간다! {m}을 받는다' }, { t: '불량률 0% 달성! 성과금 {m}을 받는다' },
        { t: '새 공정을 개발해 특허 등록! {m}을 받는다', fx: { patent: 1 } }, { t: '스마트공장 구축 대성공! 보너스 {m}을 받는다' },
        { t: '무재해 1,000일 달성! 포상금 {m}을 받는다' }, { t: '해외 공장에 기술을 가르치러 간다! {m}을 받는다' },
        { t: '내 기술이 9시 뉴스에 나왔다! 강연료 {m}을 받는다' }, { t: '대형 수출 계약 성사! 성과금 {m}을 받는다' },
      ],
      bad: [
        { t: '기계 고장으로 생산 라인이 멈췄다… {m}이 나갔다' }, { t: '불량품이 나와 전부 다시 만들었다… {m}이 나갔다' },
        { t: '부품 수입이 막혀 일이 밀렸다… {m}이 나갔다' }, { t: '안전 점검에서 지적을 받았다… 보완 비용 {m}이 나갔다' },
        { t: '정전으로 공장이 하루 쉬었다… {m}이 나갔다' }, { t: '야근이 이어져 병원 신세… {m}이 나갔다' },
        { t: '설비 설정을 잘못해 재료를 버렸다… {m}이 나갔다' }, { t: '경쟁사가 비슷한 제품을 먼저 냈다… {m}이 나갔다' },
      ],
    },
    건설: {
      fate: [F('설계·공사 공모전', '당선! 랜드마크를 짓게 됐어요', '가작', '탈락'), F('큰 공사 마감', '일찍 완공!', '제때 완공', '공사 지연')],
      good: [
        { t: '내가 설계한 다리가 세계 건축상을 받았다! 상금 {m}을 받는다' }, { t: '랜드마크 공모전 당선! 설계비 {m}을 받는다' },
        { t: '공사를 일정보다 일찍 끝냈다! 보너스 {m}을 받는다' }, { t: '한옥 복원 프로젝트를 맡았다! {m}을 받는다' },
        { t: '친환경 건축 인증 획득! 지원금 {m}을 받는다', fx: { green: 1 } }, { t: '집수리 의뢰가 줄을 섰다! {m}을 받는다' },
        { t: '내가 지은 도서관이 동네 명소가 됐다! 감사금 {m}을 받는다' }, { t: '해외 신도시 건설에 초청받았다! {m}을 받는다' },
      ],
      bad: [
        { t: '폭우로 공사가 멈췄다… {m}이 나갔다' }, { t: '자재값이 껑충 올랐다… {m}이 나갔다' },
        { t: '설계를 처음부터 다시 그렸다… {m}이 나갔다' }, { t: '현장 장비가 고장났다… 수리비 {m}이 나갔다' },
        { t: '민원이 들어와 공사가 늦어졌다… {m}이 나갔다' }, { t: '측량 실수로 다시 공사… {m}이 나갔다' },
        { t: '안전모를 안 써서 경고를 받았다… 벌금 {m}이 나갔다' }, { t: '땅속에서 큰 바위가 나왔다… 추가 공사비 {m}이 나갔다' },
      ],
    },
    수송: {
      fate: [F('신차(신기종) 출시', '올해의 차 선정!', '무난한 판매', '리콜 사태'), F('안전 운행 평가', '무사고 표창!', '통과', '경고를 받았어요')],
      good: [
        { t: '내가 설계한 전기차가 올해의 차로 선정! {m}을 받는다' }, { t: '무사고 1만 시간 달성! 포상금 {m}을 받는다' },
        { t: '드론 쇼 공연 대성공! {m}을 받는다' }, { t: '인공위성 발사 성공! 성과금 {m}을 받는다' },
        { t: '클래식카를 완벽하게 복원했다! {m}을 받는다' }, { t: '자율주행 시험 운행을 무사고로 통과! {m}을 받는다' },
        { t: '폭풍 속에서도 안전하게 운행! 감사금 {m}을 받는다' }, { t: '새 노선 개통 공로상! {m}을 받는다' },
      ],
      bad: [
        { t: '정비 실수로 재작업을 했다… {m}이 나갔다' }, { t: '리콜 사태를 수습했다… {m}이 나갔다' },
        { t: '부품 수입이 막혔다… {m}이 나갔다' }, { t: '눈길에 운행이 늦어 항의를 받았다… {m}이 나갔다' },
        { t: '시험용 드론이 추락했다… {m}이 나갔다' }, { t: '배터리 점검으로 운행이 멈췄다… {m}이 나갔다' },
        { t: '야간 근무가 이어져 몸살… {m}이 나갔다' }, { t: '연료비가 갑자기 올랐다… {m}이 나갔다' },
      ],
    },
    정보통신: {
      fate: [F('서비스 출시!', '다운로드 1위!', '본전', '버그 폭탄'), F('해커톤 출전', '우승!', '본선 진출', '서버가 터졌어요')],
      good: [
        { t: '직접 만든 앱이 앱스토어 1위! {m}을 받는다' }, { t: '해킹을 막아 회사를 지켰다! 포상금 {m}을 받는다' },
        { t: 'AI 대회에서 우승했다! 상금 {m}을 받는다' }, { t: '내 서비스 가입자 100만 명 돌파! {m}을 받는다' },
        { t: '직접 만든 오픈소스가 세계로 퍼졌다! 후원금 {m}을 받는다' }, { t: '데이터 분석으로 큰 손실을 막았다! 보너스 {m}을 받는다' },
        { t: '해외 기업이 내 기술을 사 갔다! {m}을 받는다' }, { t: '스마트폰 기능 아이디어가 채택됐다! {m}을 받는다' },
      ],
      bad: [
        { t: '서버 장애로 밤샘 복구… {m}이 나갔다' }, { t: '개인정보 유출 사고를 수습했다… {m}이 나갔다' },
        { t: '갑자기 기획이 바뀌어 다시 개발… {m}이 나갔다' }, { t: '버그 신고가 폭주했다… {m}이 나갔다' },
        { t: '랜섬웨어에 걸렸다… 복구비 {m}이 나갔다' }, { t: '클라우드 요금 폭탄을 맞았다… {m}이 나갔다' },
        { t: '출시일을 못 지켜 위약금… {m}이 나갔다' }, { t: '노트북을 떨어뜨려 고장… {m}이 나갔다' },
      ],
    },
    생명: {
      fate: [F('연구 결과 발표', '신약·신품종 허가!', '의미 있는 결과', '실험 실패'), F('수확·실험 시즌', '대풍년!', '평년작', '병충해')],
      good: [
        { t: '새 품종 개발 성공! 등록 기념 {m}을 받는다', fx: { patent: 1 } }, { t: '신약 임상 시험 성공! 성과금 {m}을 받는다' },
        { t: '내가 기른 작물이 우주 식량으로 채택! {m}을 받는다' }, { t: '논문이 세계적 학술지 표지에! 연구비 {m}을 받는다' },
        { t: '스마트팜 수확량 신기록! {m}을 받는다' }, { t: '희귀병 진단 키트 개발! {m}을 받는다', fx: { green: 1 } },
        { t: '대체육 버거가 전국 매장에 납품된다! {m}을 받는다' }, { t: '멸종위기 식물 복원 성공! 상금 {m}을 받는다', fx: { green: 1 } },
      ],
      bad: [
        { t: '실험 데이터가 날아갔다… {m}이 나갔다' }, { t: '가뭄으로 농사를 망쳤다… {m}이 나갔다' },
        { t: '실험실 오염으로 처음부터 다시… {m}이 나갔다' }, { t: '연구비가 줄었다… {m}이 나갔다' },
        { t: '병충해가 퍼졌다… 방제비 {m}이 나갔다' }, { t: '냉장 설비 고장으로 시료가 상했다… {m}이 나갔다' },
        { t: '임상 시험이 중단됐다… {m}이 나갔다' }, { t: '태풍에 비닐하우스가 찢어졌다… {m}이 나갔다' },
      ],
    },
    '적정기술·환경·에너지': {
      fate: [F('지역 프로젝트', '국제 적정기술상!', '마을이 좋아졌어요', '예산 부족'), F('발전·정화 설비 시험', '효율 신기록!', '목표 달성', '설비 고장')],
      good: [
        { t: '내가 만든 정수기로 마을에 깨끗한 물이! 국제상 {m}을 받는다', fx: { green: 2 } }, { t: '태양광 효율 세계 신기록! {m}을 받는다', fx: { green: 1 } },
        { t: '업사이클 작품 전시회 완판! {m}을 받는다' }, { t: '국제 환경 회의에 초청됐다! {m}을 받는다' },
        { t: '탄소 감축 프로젝트 성공! 보상금 {m}을 받는다', fx: { green: 1 } }, { t: '풍력 발전소 준공! 성과금 {m}을 받는다' },
        { t: '쓰레기 분리 로봇이 대박 났다! {m}을 받는다' }, { t: '해외 마을에 태양광 램프 보급 성공! {m}을 받는다', fx: { green: 1 } },
      ],
      bad: [
        { t: '현장 장비가 고장났다… {m}이 나갔다' }, { t: '후원이 끊겼다… {m}이 나갔다' },
        { t: '날씨 때문에 발전량이 줄었다… {m}이 나갔다' }, { t: '규정이 바뀌어 다시 신청했다… {m}이 나갔다' },
        { t: '배터리 저장 장치에 문제가 생겼다… {m}이 나갔다' }, { t: '현지로 가는 운송이 막혔다… {m}이 나갔다' },
        { t: '설비에 녹이 슬어 교체했다… {m}이 나갔다' }, { t: '시험 운전 중 정전… {m}이 나갔다' },
      ],
    },
    가정: {
      fate: [F('요리·패션·상담 대회', '우승! 손님이 줄 서요', '참가상', '재료(준비물) 문제'), F('신메뉴·새 프로그램 출시', '대히트!', '반응 무난', '반응 싸늘')],
      good: [
        { t: '내 가게가 줄 서는 맛집이 됐다! {m}을 받는다' }, { t: '패션쇼 대성공! 계약금 {m}을 받는다' },
        { t: '내 레시피가 TV 요리 프로그램에 나왔다! {m}을 받는다' }, { t: '급식 메뉴가 전국에서 화제! 포상금 {m}을 받는다' },
        { t: '상담한 가족이 감사 편지를 보냈다! {m}을 받는다', fx: { green: 1 } }, { t: '친환경 생활용품이 온라인 1위! {m}을 받는다' },
        { t: '해외 박람회에서 대량 주문! {m}을 받는다' }, { t: '요리 대회 금상! 상금 {m}을 받는다' },
      ],
      bad: [
        { t: '재료가 상해 버렸다… {m}이 나갔다' }, { t: '손님 항의로 환불했다… {m}이 나갔다' },
        { t: '주방 설비가 고장났다… {m}이 나갔다' }, { t: '일손이 모자라 아르바이트를 더 썼다… {m}이 나갔다' },
        { t: '원단 가격이 올랐다… {m}이 나갔다' }, { t: '위생 점검에서 지적… 보완 비용 {m}이 나갔다' },
        { t: '배달 주문이 꼬였다… {m}이 나갔다' }, { t: '세탁기가 고장났다… {m}이 나갔다' },
      ],
    },
    교육: {
      fate: [F('공개 수업', '우수 수업 선정!', '무난', '실습실 기계 고장')],
      good: [
        { t: '제자가 기능경기대회 금메달! 지도 포상금 {m}을 받는다', fx: { green: 1, luck: 1 } }, { t: '우수 수업상 수상! {m}을 받는다' },
        { t: '내 수업 영상이 교육 방송에! 출연료 {m}을 받는다' }, { t: '교과서 집필에 참여했다! 원고료 {m}을 받는다' },
        { t: '방학 연수로 해외 학교를 방문! 지원금 {m}을 받는다', fx: { happy: 8 } }, { t: '졸업생들이 감사 행사를 열었다! {m}을 받는다', fx: { green: 1 } },
        { t: '직접 만든 교육 앱이 전국 학교에! {m}을 받는다' }, { t: '강연 요청이 줄을 섰다! 강연료 {m}을 받는다' },
      ],
      bad: [
        { t: '실습실 공구가 고장났다… {m}이 나갔다' }, { t: '행정 업무 폭탄으로 밤샘… {m}이 나갔다' },
        { t: '수업 자료가 날아갔다… {m}이 나갔다' }, { t: '감기가 반 전체에 돌았다… 병원비 {m}이 나갔다' },
        { t: '체험학습 버스가 고장났다… {m}이 나갔다' }, { t: '프로젝터가 고장나 새로 샀다… {m}이 나갔다' },
        { t: '상담이 몰려 야근이 이어졌다… {m}이 나갔다' }, { t: '축제 준비물이 모자랐다… {m}이 나갔다' },
      ],
    },
    융합: {
      fate: [F('융합 프로젝트 발표', '세상을 바꿀 기술!', '가능성 확인', '기술 결함')],
      good: [
        { t: '돌봄 로봇 상용화 성공! {m}을 받는다' }, { t: '자율주행 무사고 인증 획득! {m}을 받는다' },
        { t: '스마트 건강 옷이 대히트! {m}을 받는다' }, { t: '대체육 버거 체인 대박! {m}을 받는다', fx: { green: 1 } },
        { t: '메타버스 학교가 전국에 열렸다! {m}을 받는다' }, { t: '의료 기기가 해외 승인을 받았다! {m}을 받는다' },
        { t: '스마트시티 프로젝트 수주! {m}을 받는다' }, { t: '세계 혁신상 수상! 상금 {m}을 받는다' },
      ],
      bad: [
        { t: '두 분야 팀이 의견 충돌… {m}이 나갔다' }, { t: '규제 때문에 출시가 늦어졌다… {m}이 나갔다' },
        { t: '센서 오류로 리콜… {m}이 나갔다' }, { t: '투자자가 마음을 바꿨다… {m}이 나갔다' },
        { t: '시제품 시험 중 고장… {m}이 나갔다' }, { t: '특허 분쟁에 휘말렸다… {m}이 나갔다' },
        { t: '해외 인증 심사에서 떨어졌다… {m}이 나갔다' }, { t: '부품 수급이 막혔다… {m}이 나갔다' },
      ],
    },
    프리랜서: {
      fate: [F('외주 프로젝트', '큰 계약 성사!', '무난히 납품', '대금이 늦어요')],
      good: [
        { t: '큰 외주 계약을 따냈다! {m}을 받는다' }, { t: '갑자기 인기 강연자가 됐다! 강연료 {m}을 받는다' },
        { t: '취미로 만든 작품이 대박! {m}을 받는다' }, { t: '단골 고객이 큰일을 맡겼다! {m}을 받는다' },
        { t: '온라인 강의가 베스트셀러! {m}을 받는다' }, { t: '해외 회사와 원격 계약! {m}을 받는다' },
        { t: '공모전 상금을 탔다! {m}을 받는다' }, { t: '책을 냈는데 베스트셀러! 인세 {m}을 받는다' },
      ],
      bad: [
        { t: '일감이 끊겼다… {m}이 나갔다' }, { t: '대금을 떼였다… {m}이 나갔다' },
        { t: '마감이 겹쳐 일을 다른 사람에게 맡겼다… {m}이 나갔다' }, { t: '컴퓨터가 고장났다… {m}이 나갔다' },
        { t: '세금 신고를 잘못했다… 가산세 {m}이 나갔다' }, { t: '작업실 월세가 올랐다… {m}이 나갔다' },
        { t: '계약이 취소됐다… {m}이 나갔다' }, { t: '장비를 도둑맞았다… {m}이 나갔다' },
      ],
    },
  },
  // 직업 전용 (분야 이벤트와 섞여서 나옴)
  byJob: {
    로봇연구원: { fate: [F('로봇 경진대회', '대상! 내 로봇이 뉴스에', '입선', '로봇 고장')],
      good: [{ t: '내 로봇이 세계 로봇 대회에서 우승! {m}을 받는다' }, { t: '재난 구조 로봇이 실제 구조에 성공! 포상금 {m}을 받는다', fx: { green: 1 } }],
      bad: [{ t: '시연 중 로봇 팔이 멈췄다… {m}이 나갔다' }, { t: '센서 부품 단종으로 다시 설계… {m}이 나갔다' }] },
    건축사: { fate: [F('설계 공모전', '당선! 랜드마크 설계', '가작', '탈락')] },
    자동차공학기술자: { fate: [F('신차 출시', '올해의 차!', '무난한 판매', '리콜 사태')] },
    게임기획자: { fate: [F('게임 출시', '다운로드 1위!', '본전', '버그 폭탄')],
      good: [{ t: '직접 만든 게임이 글로벌 시장에 진출! {m}을 받는다' }, { t: '올해의 게임 대상 수상! 상금 {m}을 받는다' }],
      bad: [{ t: '출시 첫날 서버가 폭주했다… {m}이 나갔다' }, { t: '밸런스 논란으로 긴급 패치… {m}이 나갔다' }] },
    '개인미디어 콘텐츠제작자(크리에이터)': { fate: [F('새 영상 업로드', '조회수 100만! 구독자 폭발', '평소처럼', '악플 폭탄…')],
      good: [{ t: '직접 만든 애니메이션 영상이 글로벌 시장에 진출! {m}을 받는다' }, { t: '조회수 1,000만 돌파! 광고 수익 {m}을 받는다' }, { t: '구독자 100만 달성! 골드 버튼과 {m}을 받는다' }, { t: '팬미팅이 매진됐다! {m}을 받는다' }],
      bad: [{ t: '악플 폭탄에 잠시 쉬었다… {m}이 나갔다' }, { t: '저작권 경고로 영상이 삭제됐다… {m}이 나갔다' }, { t: '촬영 장비가 고장났다… {m}이 나갔다' }, { t: '알고리즘이 바뀌어 조회수 급감… {m}이 나갔다' }] },
    '스마트팜 운영자': { fate: [F('수확', '대풍년!', '평년작', '병충해')] },
    '조리사 및 주방장': { fate: [F('요리 대회', '우승! 손님 줄 섬', '참가상', '재료 상함')],
      good: [{ t: '내 식당이 맛집 안내서에 소개됐다! {m}을 받는다' }, { t: '세계 요리 대회 우승! 상금 {m}을 받는다' }],
      bad: [{ t: '가스가 끊겨 하루 문을 닫았다… {m}이 나갔다' }, { t: '냉장고가 고장나 재료를 버렸다… {m}이 나갔다' }] },
    '제과사 및 제빵사': { good: [{ t: '내가 만든 빵이 전국 빵 지도 1위! {m}을 받는다' }], bad: [{ t: '오븐이 고장나 빵을 다 태웠다… {m}이 나갔다' }] },
    패션디자이너: { good: [{ t: '내 옷이 해외 패션 위크 무대에! {m}을 받는다' }], bad: [{ t: '봉제 공장이 납품을 미뤘다… {m}이 나갔다' }] },
    '드론 전문가': { fate: [F('드론 레이싱', '우승!', '완주', '추락')],
      good: [{ t: '드론 1,000대 불꽃쇼 대성공! {m}을 받는다' }], bad: [{ t: '촬영 중 드론이 강에 빠졌다… {m}이 나갔다' }] },
    발명가: { fate: [F('특허 제품 판매', '대박 상품! 회사가 커져요', '조금 팔림', '재고가 쌓였어요')],
      good: [{ t: '내 발명품이 TV 홈쇼핑 매진! {m}을 받는다', fx: { patent: 1 } }], bad: [{ t: '재고가 창고에 산더미… {m}이 나갔다' }] },
    반도체공학기술자: { fate: [F('신공정 개발', '수율 대성공!', '목표 달성', '공정 불량')],
      good: [{ t: '세계에서 가장 작은 칩 개발 성공! {m}을 받는다' }], bad: [{ t: '먼지 한 톨로 웨이퍼를 다 버렸다… {m}이 나갔다' }] },
    '기술·가정 교사': { fate: [F('공개 수업', '우수 수업 선정!', '무난', '실습실 기계 고장')] },
    비행기조종사: { fate: [F('폭풍우 속 비행', '안전 착륙! 승객 박수', '무사히 도착', '회항… 일정 꼬임')],
      good: [{ t: '폭풍 속 안전 착륙! 승객들의 박수와 포상금 {m}을 받는다' }], bad: [{ t: '기상 악화로 회항했다… {m}이 나갔다' }] },
    '신약개발연구원': { fate: [F('임상 시험', '신약 허가!', '다음 단계로', '부작용 발견')] },
    '인공지능 엔지니어': { good: [{ t: '내 AI가 날씨 예측 대회 1위! {m}을 받는다' }], bad: [{ t: 'AI가 엉뚱한 답을 내 회수했다… {m}이 나갔다' }] },
    '항공우주공학기술자': { good: [{ t: '달 탐사선 착륙 성공! 성과금 {m}을 받는다' }], bad: [{ t: '발사가 연기됐다… {m}이 나갔다' }] },
    보육교사: { good: [{ t: '아이들이 그린 감사 그림 선물! 부모님들이 {m}을 모아 주셨다', fx: { green: 1 } }], bad: [{ t: '어린이집 놀이기구가 고장났다… {m}이 나갔다' }] },
    '메이커 창업가': { good: [{ t: '내 회사 제품이 글로벌 시장에 진출! 투자금 {m}을 받는다' }], bad: [{ t: '투자 유치가 미뤄졌다… {m}이 나갔다' }] },
  },
};
