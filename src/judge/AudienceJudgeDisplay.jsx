import { useEffect, useMemo, useRef, useState } from 'react'
import './audience-judge-display.css'

const EVENT_DATE = '2026-09-29'

// 사용자가 확정한 실제 공연 순서/시간 그대로 유지합니다.
export const CHOIR_SCHEDULE = [
  { id: 1,  name: '은가비합창단',                 start: '14:15', end: '14:25', background: '/judge-backgrounds/team-01.png' },
  { id: 2,  name: "완주장애인합창단 ‘꽃’",        start: '14:31', end: '14:36', background: '/judge-backgrounds/team-02.png' },
  { id: 3,  name: '대구라온휠합창단',              start: '14:42', end: '14:46', background: '/judge-backgrounds/team-03.png' },
  { id: 4,  name: 'KYCU 에바다합창단',             start: '14:52', end: '14:58', background: '/judge-backgrounds/team-04.png' },
  { id: 5,  name: '옥구슬합창단',                   start: '15:04', end: '15:09', background: '/judge-backgrounds/team-05.png' },
  { id: 6,  name: '부산베데스다합창단',             start: '15:15', end: '15:20', background: '/judge-backgrounds/team-06.png' },
  { id: 7,  name: '이지글리합창단',                 start: '15:26', end: '15:33', background: '/judge-backgrounds/team-07.png' },
  { id: 8,  name: '부산 단디소리합창단',            start: '15:39', end: '15:44', background: '/judge-backgrounds/team-08.png' },
  { id: 9,  name: '코웨이물빛합창단',               start: '15:50', end: '15:55', background: '/judge-backgrounds/team-09.png' },
  { id: 10, name: '골프존파스텔합창단',             start: '16:01', end: '16:05', background: '/judge-backgrounds/team-10.png' },
  { id: 11, name: '어울림시각장애인합창단',          start: '16:12', end: '16:18', background: '/judge-backgrounds/team-11.png' },
]

const DEMO_COMMENTS = [
  '화음이 정말 아름다웠어요',
  '마음이 따뜻해졌습니다',
  '오래 기억에 남을 무대였어요',
  '노래가 끝났는데도 여운이 남아요',
  '한마음으로 부르는 모습이 정말 좋았습니다',
  '다시 한 번 듣고 싶은 합창입니다',
]

function pad2(value) {
  return String(Math.max(0, value)).padStart(2, '0')
}

function formatTime(totalSeconds) {
  const sec = Math.max(0, Number(totalSeconds) || 0)
  return `${pad2(Math.floor(sec / 60))}:${pad2(sec % 60)}`
}

function getQueryNumber(name, fallback) {
  if (typeof window === 'undefined') return fallback
  const value = Number(new URLSearchParams(window.location.search).get(name))
  return Number.isFinite(value) ? value : fallback
}

function getQueryText(name) {
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get(name) || ''
}

function getInitialTeamId() {
  const queryTeam = getQueryNumber('team', 0)
  if (queryTeam >= 1 && queryTeam <= CHOIR_SCHEDULE.length) return queryTeam

  const now = new Date()
  const yyyyMmDd = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
  if (yyyyMmDd !== EVENT_DATE) return 1

  const hhmm = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`
  const exact = CHOIR_SCHEDULE.find((team) => hhmm >= team.start && hhmm <= team.end)
  if (exact) return exact.id

  // 공연 직후 3분간 객석심사를 진행하므로, 다음 팀 시작 전에는 직전 팀 배경을 유지합니다.
  let last = CHOIR_SCHEDULE[0]
  for (const team of CHOIR_SCHEDULE) {
    if (hhmm >= team.end) last = team
  }
  return last.id
}

function quoteFontSize(text = '') {
  const length = [...text].length
  if (length <= 14) return 'clamp(54px, 5.4vw, 104px)'
  if (length <= 22) return 'clamp(48px, 4.7vw, 90px)'
  if (length <= 32) return 'clamp(42px, 4.1vw, 78px)'
  return 'clamp(36px, 3.6vw, 68px)'
}

function normalizeComments(comments) {
  const cleaned = (Array.isArray(comments) ? comments : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
  return cleaned.slice(-2)
}

export default function AudienceJudgeDisplay({
  liveEndpoint = '/api/judge/live',
  enableLive = true,
}) {
  const [teamId, setTeamId] = useState(getInitialTeamId)
  const [participants, setParticipants] = useState(() => getQueryNumber('participants', 174))
  const [remainingSeconds, setRemainingSeconds] = useState(() => getQueryNumber('seconds', 137))
  const [comments, setComments] = useState(() => {
    const c1 = getQueryText('c1')
    const c2 = getQueryText('c2')
    return normalizeComments([c1 || DEMO_COMMENTS[0], c2 || DEMO_COMMENTS[1]])
  })
  const [phase, setPhase] = useState(() => getQueryText('phase') || 'voting')
  const [score, setScore] = useState(() => getQueryNumber('score', 94.6))
  const [connected, setConnected] = useState(false)
  const demoTimerRef = useRef(null)

  const currentTeam = useMemo(
    () => CHOIR_SCHEDULE.find((item) => item.id === teamId) || CHOIR_SCHEDULE[0],
    [teamId],
  )

  // 운영 서버 연결. 서버가 없거나 끊겨도 화면은 현재 상태를 유지합니다.
  useEffect(() => {
    if (!enableLive || typeof EventSource === 'undefined') return undefined

    const source = new EventSource(liveEndpoint)

    source.onopen = () => setConnected(true)
    source.onerror = () => setConnected(false)
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'team' && Number(data.teamId)) {
          setTeamId(Number(data.teamId))
        }
        if (data.type === 'state' || data.type === 'vote_state') {
          if (Number.isFinite(Number(data.participants))) setParticipants(Number(data.participants))
          if (Number.isFinite(Number(data.remainingSeconds))) setRemainingSeconds(Number(data.remainingSeconds))
          if (data.phase) setPhase(String(data.phase))
          if (Number.isFinite(Number(data.score))) setScore(Number(data.score))
          if (Array.isArray(data.comments)) setComments(normalizeComments(data.comments))
        }
        if (data.type === 'comment' && data.text) {
          setComments((prev) => normalizeComments([...prev, String(data.text)]))
        }
        if (data.type === 'comments' && Array.isArray(data.comments)) {
          setComments(normalizeComments(data.comments))
        }
        if (data.type === 'result') {
          setPhase('result')
          if (Number.isFinite(Number(data.score))) setScore(Number(data.score))
          if (Number.isFinite(Number(data.participants))) setParticipants(Number(data.participants))
        }
      } catch {
        // 잘못된 이벤트는 화면을 깨지 않고 무시합니다.
      }
    }

    return () => source.close()
  }, [enableLive, liveEndpoint])

  // ?demo=1 로 열면 서버 없이도 카운트다운/댓글 회전을 확인할 수 있습니다.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const demo = new URLSearchParams(window.location.search).get('demo') === '1'
    if (!demo || connected) return undefined

    let commentIndex = 2
    let tick = 0

    demoTimerRef.current = window.setInterval(() => {
      tick += 1
      setRemainingSeconds((value) => {
        const next = Math.max(0, value - 1)
        if (next === 0) setPhase('result')
        return next
      })
      if (tick % 3 === 0) setParticipants((value) => value + 1)
      if (tick % 5 === 0) {
        setComments((prev) => normalizeComments([...prev, DEMO_COMMENTS[commentIndex % DEMO_COMMENTS.length]]))
        commentIndex += 1
      }
    }, 1000)

    return () => window.clearInterval(demoTimerRef.current)
  }, [connected])

  const isResult = phase === 'result' || phase === 'closed'

  return (
    <main
      className="audience-display"
      style={{ '--display-bg': `url("${currentTeam.background}")` }}
      data-team-id={currentTeam.id}
      data-team-name={currentTeam.name}
    >
      <div className="audience-display__wash" />

      {!isResult ? (
        <section className="audience-display__layout" aria-label="객석심사 실시간 반응">
          <div className="audience-display__comments">
            <div className="audience-display__quote-slot audience-display__quote-slot--top">
              {comments[0] && (
                <p
                  className="audience-display__quote"
                  style={{ fontSize: quoteFontSize(comments[0]) }}
                >
                  {comments[0]}
                </p>
              )}
            </div>

            <div className="audience-display__quote-slot audience-display__quote-slot--bottom">
              {comments[1] && (
                <p
                  className="audience-display__quote"
                  style={{ fontSize: quoteFontSize(comments[1]) }}
                >
                  {comments[1]}
                </p>
              )}
            </div>
          </div>

          <aside className="audience-display__status" aria-label="참여 현황">
            <div className="audience-display__phone" aria-hidden="true">
              <div className="audience-display__phone-speaker" />
              <div className="audience-display__phone-screen">
                <span className="audience-display__phone-dot" />
                <span className="audience-display__phone-line" />
                <span className="audience-display__phone-line audience-display__phone-line--short" />
              </div>
            </div>

            <div className="audience-display__metric">
              <strong className="audience-display__metric-value">
                {participants.toLocaleString('ko-KR')}
                <span className="audience-display__metric-unit">명</span>
              </strong>
              <span className="audience-display__metric-label">참여</span>
            </div>

            <div className="audience-display__status-rule" />

            <div className="audience-display__metric audience-display__metric--time">
              <strong className="audience-display__metric-value">
                {formatTime(remainingSeconds)}
              </strong>
              <span className="audience-display__metric-label">남은 시간</span>
            </div>
          </aside>
        </section>
      ) : (
        <section className="audience-display__result" aria-label="객석심사 결과">
          <div className="audience-display__result-main">
            <span className="audience-display__result-label">객석 점수</span>
            <strong className="audience-display__result-score">{Number(score).toFixed(1)}</strong>
          </div>
          <div className="audience-display__result-side">
            <strong>{participants.toLocaleString('ko-KR')}명</strong>
            <span>참여</span>
          </div>
        </section>
      )}
    </main>
  )
}
