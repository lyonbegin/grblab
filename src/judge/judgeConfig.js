export const EVENT_DATE = '2026-09-29'

export const DEFAULT_EVENT_TITLE_1 = '2026 장애인 합창단 초청 음악회'
export const DEFAULT_EVENT_TITLE_2 = '오늘의 무대가 도쿄로 이어집니다'

export const DISPLAY_MODES = {
  EVENT_INTRO_1: 'event_intro_1',
  EVENT_INTRO_2: 'event_intro_2',
  EVENT_INTRO_3: 'event_intro_3',
  TEAM_INTRO: 'team_intro',
  QR_REGISTER: 'qr_register',
  SCORE: 'score',
}

// 구버전 코드 호환용
DISPLAY_MODES.EVENT_INTRO = DISPLAY_MODES.EVENT_INTRO_1

export const DEFAULT_EVENT_INTROS = [
  { title1: DEFAULT_EVENT_TITLE_1, title2: DEFAULT_EVENT_TITLE_2 },
  { title1: DEFAULT_EVENT_TITLE_1, title2: DEFAULT_EVENT_TITLE_2 },
  { title1: DEFAULT_EVENT_TITLE_1, title2: DEFAULT_EVENT_TITLE_2 },
]

export const JUDGE_REGISTRATION_URL = 'https://grblab.co.kr/judge'

// 공연곡 기본값은 사용자가 제공한
// 2026-09-29_합창단_공연곡_총회안건_매칭표.xlsx 기준입니다.
export const DEFAULT_TEAMS = [
  {
    id: 1,
    name: '은가비합창단',
    start: '14:15',
    end: '14:25',
    songs: ['', ''],
    background: '/judge-backgrounds/team-01.png',
  },
  {
    id: 2,
    name: '완주장애인합창단 ‘꽃’',
    start: '14:31',
    end: '14:36',
    songs: ['좋아좋아'],
    background: '/judge-backgrounds/team-02.png',
  },
  {
    id: 3,
    name: '대구라온휠합창단',
    start: '14:42',
    end: '14:46',
    songs: ['푸르른 날'],
    background: '/judge-backgrounds/team-03.png',
  },
  {
    id: 4,
    name: 'KYCU 에바다합창단',
    start: '14:52',
    end: '14:58',
    songs: ['친구'],
    background: '/judge-backgrounds/team-04.png',
  },
  {
    id: 5,
    name: '옥구슬합창단',
    start: '15:04',
    end: '15:09',
    songs: [''],
    background: '/judge-backgrounds/team-05.png',
  },
  {
    id: 6,
    name: '부산베데스다합창단',
    start: '15:15',
    end: '15:20',
    songs: ['FLY ME TO THE MOON'],
    background: '/judge-backgrounds/team-06.png',
  },
  {
    id: 7,
    name: '이지글리합창단',
    start: '15:26',
    end: '15:33',
    songs: ['흰수염고래', '오나라'],
    background: '/judge-backgrounds/team-07.png',
  },
  {
    id: 8,
    name: '부산 단디소리합창단',
    start: '15:39',
    end: '15:44',
    songs: ['그대 있는 곳까지'],
    background: '/judge-backgrounds/team-08.png',
  },
  {
    id: 9,
    name: '코웨이물빛합창단',
    start: '15:50',
    end: '15:55',
    songs: ['노던 라이츠'],
    background: '/judge-backgrounds/team-09.png',
  },
  {
    id: 10,
    name: '골프존파스텔합창단',
    start: '16:01',
    end: '16:05',
    songs: ['Dawn and Dusk (Fajar dan Senja)'],
    background: '/judge-backgrounds/team-10.png',
  },
  {
    id: 11,
    name: '어울림시각장애인합창단',
    start: '16:12',
    end: '16:18',
    songs: ['푸니쿨리 푸니쿨라', '잊혀진 계절 메들리'],
    background: '/judge-backgrounds/team-11.png',
  },
]

export function teamById(teams, teamId) {
  const list = Array.isArray(teams) && teams.length ? teams : DEFAULT_TEAMS
  return list.find((team) => Number(team.id) === Number(teamId)) || list[0]
}

export function formatSeconds(seconds = 0) {
  const safe = Math.max(0, Math.round(Number(seconds) || 0))
  const min = String(Math.floor(safe / 60)).padStart(2, '0')
  const sec = String(safe % 60).padStart(2, '0')
  return `${min}:${sec}`
}

export function maskPhone(phone = '') {
  const p = String(phone).replace(/\D/g, '')
  if (p.length < 8) return p || '—'
  return `${p.slice(0, 3)}-****-${p.slice(-4)}`
}
