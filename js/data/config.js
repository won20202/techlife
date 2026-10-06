// 게임 숫자·목록 (금액 단위: 만 원). 숫자는 밸런스 시뮬레이션으로 조정.

export const STAGES = [
  { k: 'baby',    name: '아기',         short: '아기',     adult: false, theme: '#FFE8F0' },
  { k: 'kid',     name: '어린이',       short: '어린이',   adult: false, theme: '#FFF1D6' },
  { k: 'elem',    name: '초등학생',     short: '초등',     adult: false, theme: '#E6F6E0' },
  { k: 'mid',     name: '중학생',       short: '중학생',   adult: false, theme: '#E3EEFF' },
  { k: 'high',    name: '고등학생',     short: '고등',     adult: false, theme: '#EDE6FF' },
  { k: 'college', name: '대학·취업 준비', short: '청년',   adult: true,  theme: '#E0F5F5' },
  { k: 'young',   name: '사회 초년생',  short: '초년생',   adult: true,  theme: '#FFF6D9' },
  { k: 'middle',  name: '중년',         short: '중년',     adult: true,  theme: '#FDE7DA' },
  { k: 'elder',   name: '황혼기',       short: '황혼기',   adult: true,  theme: '#F3E9DD' },
];

// 모드별 단계 턴 수 (0 = 그 단계 없음)
export const MODES = {
  growth:      { name: '성장 모드',     turns: [1, 1, 3, 4, 3, 0, 0, 0, 0],  desc: '아기 ~ 고등학교 졸업 · 약 30분' },
  career:      { name: '커리어 모드',   turns: [0, 0, 0, 0, 0, 3, 5, 8, 4],  desc: '진로 선택 ~ 노년 · 약 50분' },
  careerShort: { name: '짧은 커리어 모드', turns: [0, 0, 0, 0, 0, 2, 3, 5, 2], desc: '진로 선택 ~ 노년 · 약 30분' },
  life:        { name: '평생 모드',     turns: [1, 1, 3, 4, 3, 3, 5, 8, 4],  desc: '아기 ~ 노년 · 약 80분' },
  extreme:     { name: '익스트림 모드', turns: [1, 1, 3, 4, 3, 4, 8, 16, 8], desc: '아기 ~ 노년 (어른 인생 길게) · 약 120분' },
};

export const STATS = { int: '지력', str: '체력', sen: '센스' };
export const STAT_SHORT = { int: '지', str: '체', sen: '센' };
export const GRADES = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
export const GAUGE_PER_GRADE = 20;

export const TAGS = ['발명', '제조', '건설', '수송', '정보통신', '생명', '적정기술', '가정'];
export const TAG_ICON = { 발명: '💡', 제조: '⚙️', 건설: '🏗️', 수송: '🚗', 정보통신: '💻', 생명: '🌱', 적정기술: '🌍', 가정: '🏠' };

export const LUCK = ['최악', '나쁨', '보통', '좋음', '최고'];
export const LUCK_ICON = ['😵', '😟', '🙂', '😊', '🤩'];
export const LUCK_MOD = [-3, -2, 0, 2, 3];

export const FATE_BASE = { 안정: [2, 6, 2], 보통: [2, 5, 3], 도전: [3, 3, 4] }; // [대운, 보통, 꽝]

export const RANK_MULT = [1, 1.3, 1.7, 2.2, 3];
export const FREELANCER_PAY = 3600;
export const CREATOR_PAY = [2000, 4000, 8000, 30000, 100000];
export const FOUNDER_PAY = [2000, 5000, 15000, 50000, 200000];
export const PATENT_ROYALTY = 1000;
export const PENSION_RATE = { 안정: 0.5, 보통: 0.3, 도전: 0.3 };

export const COST = {
  rent: 1000, childcare: 500, interestRate: 0.05,
  tuition4: 5000, tuition2: 2500,
  studentDebtMax: 50,   // 학생은 '돈 − 빚'이 −50만 아래로 안 내려감 (살짝 빚은 괜찮게)
  allowance: 1,         // 용돈 칸 (지나가면 ×10 = 10만, 딱 멈추면 ×20 = 20만 → 고등학교 끝에 100만 원 안팎)
};
export const CAR_UPKEEP = { used: 100, small: 200, suv: 300, eco: 150, auto: 500 };

export const HOUSES = [
  { k: 'room',      name: '원룸',       price: 0,       cap: 1,  icon: '🏚️', note: '모두의 시작 집 · 월급날마다 집세' },
  { k: 'villa',     name: '빌라',       price: 20000,   cap: 2,  icon: '🏠', note: '집세 없음' },
  { k: 'apt',       name: '아파트',     price: 50000,   cap: 3,  icon: '🏢', note: '편의시설 → 생활 이벤트 조금 유리' },
  { k: 'house',     name: '단독주택',   price: 100000,  cap: 5,  icon: '🏡', note: '마당 → 가족 행사 이벤트' },
  { k: 'country',   name: '전원주택',   price: 150000,  cap: 8,  icon: '🌳', note: '텃밭·캠핑 이벤트, 💚' },
  { k: 'penthouse', name: '펜트하우스', price: 400000,  cap: 15, icon: '🌃', note: '전망 → 데이트·파티 보너스' },
  { k: 'mansion',   name: '대저택',     price: 800000,  cap: 30, icon: '🏰', note: '파티 → 축하금 더 받음' },
  { k: 'castle',    name: '성',         price: 2000000, cap: 99, icon: '👑', note: '원작 느낌 끝판왕' },
];

export const CARS = [
  { k: 'used',  name: '중고차',     price: 500,   icon: '🚙', move: [0, 1],     note: '훨씬 쌈, 가끔 고장' },
  { k: 'small', name: '소형차',     price: 3000,  icon: '🚗', move: [0, 1],     note: '무난' },
  { k: 'suv',   name: 'SUV',        price: 6000,  icon: '🚐', move: [0, 1],     note: '여행·캠핑 보너스' },
  { k: 'eco',   name: '친환경차',   price: 7000,  icon: '⚡', move: [0, 1],     note: '월급날마다 💚' },
  { k: 'auto',  name: '자율주행차', price: 20000, icon: '🛸', move: [-1, 0, 1], note: '−1 / +1 조절' },
];

export const CARDS = {
  small:  { name: '작은 수 카드', icon: '🐢', price: 300,  desc: '이동 룰렛이 1~3만 나옴' },
  big:    { name: '큰 수 카드',   icon: '🐇', price: 300,  desc: '이동 룰렛이 8~10만 나옴' },
  five:   { name: '딱 5 카드',    icon: '🖐️', price: 300,  desc: '무조건 5칸' },
  pick:   { name: '고르기 카드',  icon: '🎯', price: 800,  desc: '1~10 중 원하는 수' },
  charm:  { name: '행운 부적',    icon: '🍀', price: 1000, desc: '다음 운명 룰렛 대운 +2' },
  date:   { name: '데이트권',     icon: '💌', price: 100,  desc: '연락처의 사람과 바로 데이트' },
  int:    { name: '코딩 강좌',    icon: '📘', price: 1000, desc: '지력 게이지 +15' },
  str:    { name: '공예 공방',    icon: '🪚', price: 1000, desc: '체력 게이지 +15' },
  sen:    { name: '디자인 클래스', icon: '🎨', price: 1000, desc: '센스 게이지 +15' },
};
export const CARD_MAX = 5;

export const INSURANCE = {
  car:    { name: '자동차 보험', price: 1000, desc: '교통사고 손해를 막아요' },
  fire:   { name: '화재 보험',   price: 1000, desc: '화재·누수·재해 손해를 막아요' },
  health: { name: '실손 보험',   price: 1000, desc: '병원비를 막아요' },
};

export const STOCKS = ['로봇', '반도체', '전기차', '바이오', '푸드테크', '친환경 에너지'];
export const STOCK_TAG = { 로봇: '제조', 반도체: '제조', 전기차: '수송', 바이오: '생명', 푸드테크: '가정', '친환경 에너지': '적정기술' };
export const STOCK_AMOUNTS = [500, 2000, 5000];

export const GIFT_WHEEL = [5, 10, 30, 50, 100, 300, 500, 1000, 3000, 5000];
export const QUIZ_MONEY_WHEEL = [10, 10, 30, 50, 100, 100, 300, 500, 1000, 3000];
export const QUIZ_STAT_WHEEL = [5, 5, 10, 10, 10, 20, 20, 20, 20, 20];
export const QUIZ_PRIZE = 100;
export const SOUVENIR_VALUE = [100, 500, 2000, 10000, 50000];
export const GREEN_REWARD = 3000;
export const MEDALS = [[50, '🏅', '대훈장'], [35, '🥇', '금메달 훈장'], [20, '🥈', '은메달 훈장'], [10, '🥉', '동메달 훈장']];

export const CLUBS = [
  { k: 'study',  name: '공부',             icon: '📚', gain: { int: 4 },          tag: null,       contest: '경시대회' },
  { k: 'sports', name: '운동부',           icon: '⚽', gain: { str: 4 },          tag: null,       contest: '운동 경기' },
  { k: 'maker',  name: '메이커·로봇 동아리', icon: '🤖', gain: { str: 2, sen: 2 }, tag: '제조',     contest: '로봇대회' },
  { k: 'invent', name: '발명·디자인 동아리', icon: '💡', gain: { sen: 4 },          tag: '발명',     contest: '발명대회' },
  { k: 'coding', name: '코딩 동아리',      icon: '💻', gain: { int: 2, sen: 2 }, tag: '정보통신', contest: '코딩 대회' },
  { k: 'cook',   name: '요리·생활 동아리', icon: '🍳', gain: { str: 2, sen: 2 }, tag: '가정',     contest: '요리 대회' },
  { k: 'eco',    name: '환경·봉사 동아리', icon: '🌍', gain: { sen: 3 },          tag: '적정기술', contest: '환경 공모전', green: 1 },
];

// 고등학교 (지금 교육과정 이름). exam이 있으면 입학 심사 룰렛 — 해당 능력치가 need 등급보다 높을수록 합격 칸이 많아짐
// uniAid: 4년제 대학 등록금 장학 비율 (과학고·영재학교는 이공계 진학이 목적)
export const HIGH_SCHOOLS = [
  { k: 'general', name: '일반고',     icon: '📖', desc: '지력↑ · 진로 선택 과목으로 분야 경험 +1', gain: { int: 15 }, tags: 1 },
  { k: 'special', name: '특성화고',   icon: '🔧', desc: '체력·센스↑ · 실습으로 분야 경험 +1', gain: { str: 12, sen: 6 }, tags: 1 },
  { k: 'meister', name: '마이스터고', icon: '🏅', desc: '체력 크게↑ · 분야 경험 +2 · 그 분야 취업 보장', gain: { str: 20 }, tags: 2,
    exam: { name: '면접·실기 전형', stat: 'str', need: 2, base: '보통', tag: ['제조', '건설'], bg: 'techroom' } },
  { k: 'science', name: '과학고',     icon: '🔬', desc: '지력 크게↑ · 연구 경험 · 이공계 4년제 장학금 50%', gain: { int: 20 }, tags: 1, uniAid: 0.5,
    exam: { name: '자기주도학습 전형 (서류·면접)', stat: 'int', need: 3, base: '보통', tag: ['생명', '정보통신'], bg: 'lab' } },
  { k: 'gifted',  name: '영재학교',   icon: '🧪', desc: '지력·센스 크게↑ · 연구 경험 +2 · 이공계 4년제 전액 장학금', gain: { int: 25, sen: 8 }, tags: 2, uniAid: 1,
    exam: { name: '영재성 검사·영재 캠프', stat: 'int', need: 4, base: '도전', tag: ['생명', '정보통신'], bg: 'lab' } },
  { k: 'arts',    name: '예술고',     icon: '🎨', desc: '센스 크게↑ · 디자인(발명) 경험 +1', gain: { sen: 20 }, tags: 1,
    exam: { name: '실기 시험', stat: 'sen', need: 3, base: '보통', tag: '발명', bg: 'studio' } },
];

export const DEPTS = {
  발명: { 4: ['산업디자인과', '디자인공학과'], 2: ['제품디자인과'] },
  제조: { 4: ['기계공학과', '로봇공학과', '반도체공학과', '이차전지공학과'], 2: ['기계과', '3D프린팅과'] },
  건설: { 4: ['건축학과', '건축공학과', '토목공학과'], 2: ['실내건축과', '건축설비과', '전기과'] },
  수송: { 4: ['자동차공학과', '항공우주공학과', '조선해양공학과'], 2: ['자동차과', '항공정비과', '철도운전과', '드론과'] },
  정보통신: { 4: ['컴퓨터공학과', '인공지능학과', '데이터사이언스학과', '정보보호학과'], 2: ['소프트웨어과', '게임콘텐츠과', '가상현실콘텐츠과'] },
  생명: { 4: ['생명공학과', '식품공학과', '스마트팜학과'], 2: ['스마트농업과'] },
  적정기술: { 4: ['환경공학과', '에너지공학과', '국제개발협력학과'], 2: ['환경과', '신재생에너지과'] },
  가정: { 4: ['식품영양학과', '의류학과', '아동가족학과', '소비자학과'], 2: ['호텔조리과', '제과제빵과', '유아교육과', '패션디자인과'] },
};

export const NPC_NAMES = {
  m: ['도윤', '서준', '하준', '시우', '지호', '은우', '선우', '유준', '이안', '건우', '우진', '현우', '민재', '태오', '로운', '지안'],
  f: ['서연', '하윤', '지유', '서아', '하은', '수아', '지아', '윤서', '채원', '다은', '예린', '소율', '아린', '하린', '나윤', '서윤'],
};
export const KID_NAMES = { m: ['튼튼', '씩씩', '반짝', '쑥쑥', '우리', '든든'], f: ['방긋', '사랑', '보람', '새봄', '다솜', '한별'] };
export const TASTES = [
  { k: 'camp', name: '캠핑파', icon: '⛺' }, { k: 'art', name: '전시회파', icon: '🖼️' },
  { k: 'food', name: '맛집파', icon: '🍝' }, { k: 'show', name: '공연파', icon: '🎵' },
];
export const DATE_PLACES = [
  { k: 'walk',  name: '공원 산책',     cost: 0,  bg: 'park',       taste: 'camp' },
  { k: 'library', name: '도서관 데이트', cost: 0, bg: 'library',  taste: 'art' },
  { k: 'cafe',  name: '카페',          cost: 10, bg: 'cafe',       taste: 'food' },
  { k: 'rest',  name: '레스토랑',      cost: 30, bg: 'restaurant', taste: 'food' },
  { k: 'expo',  name: '과학관·전시회', cost: 20, bg: 'museum',     taste: 'art' },
  { k: 'show',  name: '공연',          cost: 40, bg: 'stage',      taste: 'show' },
  { k: 'camp',  name: '캠핑장',        cost: 30, bg: 'campsite',   taste: 'camp', car: true },
  { k: 'night', name: '강변 야경',     cost: 20, bg: 'river',      taste: 'show' },
];

// 지도: 단계별 칸 비율 (특수 칸은 엔진이 따로 배치)
export const CELL_MIX = {
  baby:    { normal: 4, lucky: 3, unlucky: 2, verylucky: 0.4 },
  kid:     { normal: 3, lucky: 3, unlucky: 2, exp: 1, allowance: 1, verylucky: 0.4 },
  elem:    { normal: 3, lucky: 2, unlucky: 2, exp: 2, contest: 2, quiz: 1, allowance: 1, verylucky: 0.5 },
  mid:     { normal: 3, lucky: 2, unlucky: 2, exp: 2, contest: 2, quiz: 1, allowance: 1, verylucky: 0.5 },
  high:    { normal: 3, lucky: 2, unlucky: 2, exp: 2, contest: 2, quiz: 1, allowance: 1, verylucky: 0.5 },
  college: { normal: 3, lucky: 2, unlucky: 2, exp: 2, love: 3, quiz: 1, job: 1, verylucky: 0.5 },
  young:   { normal: 3, lucky: 2, unlucky: 2, love: 6, job: 4, stock: 1, quiz: 1, exp: 1, verylucky: 0.5 },
  middle:  { normal: 3, lucky: 2, unlucky: 2, love: 6, job: 6, stock: 1, quiz: 1, verylucky: 0.5 },
  elder:   { normal: 3, lucky: 2, unlucky: 2, love: 1, job: 1, stock: 1, verylucky: 1, reverse: 1 },
};
export const CELLS_PER_TURN = { child: 10, adult: 11 }; // 룰렛 최대 10 (어른은 차 +1) — 매 턴 10이 나와도 지도가 남게
export const MOVE_AVG = { child: 5.5, adult: 6 };         // 평균 이동 — 갈림길·집 장만 칸은 이 안쪽에 둠 (대부분 지나가게)

export const CELL_INFO = {
  normal:    { name: '노말',     icon: '•',  color: '#FFE17A', help: '일상 이벤트가 일어나요' },
  lucky:     { name: '럭키',     icon: '⭐', color: '#FFC94D', help: '좋은 일이 생겨요!' },
  verylucky: { name: '매우 럭키', icon: '🌈', color: '#FF9AD5', help: '아주 큰 행운! (로또 등)' },
  unlucky:   { name: '불행',     icon: '🌧️', color: '#B8A6E8', help: '나쁜 일… 선택으로 줄일 수 있어요' },
  payday:    { name: '월급날',   icon: '💰', color: '#7ED69B', help: '지나가기만 해도 연봉! 딱 멈추면 +50%' },
  exp:       { name: '경험',     icon: '🧭', color: '#8FD3FF', help: '분야 경험 태그를 얻을 기회' },
  love:      { name: '사랑',     icon: '💗', color: '#FFB3CF', help: '만나기·데이트·배우자 데이트' },
  job:       { name: '직업',     icon: '💼', color: '#7FA8FF', help: '직업 룰렛 — 랭크 업 기회' },
  shop:      { name: '상점',     icon: '🛍️', color: '#FFB07A', help: '지나가면 들를 수 있어요. 딱 멈추면 카드 1장 + 30% 할인' },
  stock:     { name: '증권',     icon: '📈', color: '#7C8BD9', help: '주식 사고팔기' },
  quiz:      { name: '퀴즈',     icon: '❓', color: '#A8E6FF', help: '기술·가정 퀴즈! 맞히면 보너스' },
  contest:   { name: '대회',     icon: '🏆', color: '#FFD98A', help: '내 동아리 대회에 나가요' },
  allowance: { name: '용돈',     icon: '🪙', color: '#D9F2B4', help: '지나가면 용돈을 받아요' },
  house:     { name: '집 장만',  icon: '🏠', color: '#FF8C8C', help: '반드시 멈춰요 — 집을 살 기회' },
  reverse:   { name: '인생역전', icon: '🎲', color: '#FF6FB5', help: '도전하면 재산 ×2 / 그대로 / ×0.5' },
  branch:    { name: '갈림길',   icon: '🔀', color: '#E0E0E0', help: '길을 골라요' },
  gate:      { name: '단계 문',  icon: '🚪', color: '#FF8C8C', help: '다음 단계로 가는 문 — 반드시 멈춰요' },
  start:     { name: '출발',     icon: '🚩', color: '#FFFFFF', help: '' },
  goal:      { name: '골인',     icon: '🏁', color: '#FFFFFF', help: '인생 골인!' },
  patent:    { name: '특허',     icon: '📜', color: '#F5E6A8', help: '특허 주인에게 사용료를 내요' },
};

// 교사 화면 "깜짝 이벤트" (모든 방에 한 번에)
export const SURPRISES = [
  { k: 'innov',  icon: '🚀', name: '기술 혁신의 날', desc: '모두 가장 많이 쌓은 경험 +1 · 센스 +5' },
  { k: 'invent', icon: '💡', name: '발명의 날',       desc: '모두 💡 발명 경험 +1 · 지력 +5' },
  { k: 'safety', icon: '🦺', name: '안전 교육의 날', desc: '모두 체력 +6 · 행복도 +5' },
  { k: 'earth',  icon: '🌏', name: '지구의 날',       desc: '모두 💚 사회기여 +1' },
  { k: 'bonus',  icon: '🎁', name: '깜짝 보너스',     desc: '어른은 연봉의 10%, 학생은 용돈과 능력치' },
  { k: 'luck',   icon: '🍀', name: '행운의 날',       desc: '모두 운세 한 단계 ↑' },
];

// 온라인 게임 규칙 버전: 같은 방의 기기들이 같은 규칙으로 돌아야 결과가 같음 (규칙을 바꾸면 올릴 것)
// 보물 (원작처럼 모았다가 결과 발표 때 감정) — tier 0 흔한 · 1 희귀 · 2 전설
export const TREASURES = [
  { k: 'stamp', name: '희귀 우표', icon: '📮', tier: 0 }, { k: 'coin', name: '조선 시대 동전', icon: '🪙', tier: 0 },
  { k: 'robot', name: '빈티지 로봇 장난감', icon: '🤖', tier: 0 }, { k: 'phone', name: '1세대 휴대폰', icon: '📱', tier: 0 },
  { k: 'tools', name: '장인의 공구 세트', icon: '🧰', tier: 0 }, { k: 'record', name: '전설의 LP 레코드', icon: '💿', tier: 0 },
  { k: 'sewing', name: '할머니의 재봉틀', icon: '🧵', tier: 0 }, { k: 'map', name: '옛 보물 지도', icon: '🗺️', tier: 0 },
  { k: 'fossil', name: '공룡 화석', icon: '🦴', tier: 1 }, { k: 'celadon', name: '고려청자', icon: '🏺', tier: 1 },
  { k: 'meteor', name: '운석 조각', icon: '☄️', tier: 1 }, { k: 'sketch', name: '명화 스케치', icon: '🖼️', tier: 1 },
  { k: 'note', name: '발명왕의 연구 노트', icon: '📓', tier: 1 }, { k: 'trophy', name: '황금 트로피', icon: '🏆', tier: 1 },
  { k: 'gem', name: '전설의 보석', icon: '💎', tier: 2 }, { k: 'satellite', name: '최초 인공위성 부품', icon: '🛰️', tier: 2 }, { k: 'crown', name: '왕의 금관', icon: '👑', tier: 2 },
];
export const TREASURE_VALUE = [[2000, 10000], [10000, 50000], [50000, 200000]]; // 감정가 범위 (만 원)
export const TREASURE_TIER = ['흔한', '희귀한', '전설의'];

export const VER = '2026-10-06f';
