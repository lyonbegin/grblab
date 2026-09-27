import { useEffect, useMemo, useState } from 'react'
import './audience-judge-display.css'
import {
  DEFAULT_EVENT_TITLE_1,
  DEFAULT_EVENT_TITLE_2,
  DEFAULT_EVENT_INTROS,
  DEFAULT_TEAMS,
  DISPLAY_MODES,
  JUDGE_REGISTRATION_URL,
  formatSeconds,
  teamById,
} from './judgeConfig'

const INITIAL = {
  displayMode: DISPLAY_MODES.EVENT_INTRO_1,
  eventIntros: DEFAULT_EVENT_INTROS,
  eventTitle1: DEFAULT_EVENT_TITLE_1,
  eventTitle2: DEFAULT_EVENT_TITLE_2,
  currentTeamId: 1,
  introTeamId: 1,
  currentTeam: DEFAULT_TEAMS[0],
  introTeam: DEFAULT_TEAMS[0],
  phase: 'idle',
  participants: 0,
  remainingSeconds: 180,
  score: null,
  comments: [],
}

function quoteSize(text = '') {
  const n = [...text].length
  if (n <= 14) return 'clamp(62px, 5.5vw, 108px)'
  if (n <= 22) return 'clamp(54px, 4.8vw, 92px)'
  if (n <= 30) return 'clamp(46px, 4.1vw, 80px)'
  return 'clamp(40px, 3.6vw, 70px)'
}

export default function AudienceJudgeDisplay() {
  const [state, setState] = useState(INITIAL)
  const [connected, setConnected] = useState(false)
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement))

  useEffect(() => {
    const source = new EventSource('/api/judge/live')
    source.onopen = () => setConnected(true)
    source.onerror = () => setConnected(false)
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'state') setState((prev) => ({ ...prev, ...data }))
      } catch {}
    }
    return () => source.close()
  }, [])

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const currentTeam = useMemo(
    () => state.currentTeam || teamById(DEFAULT_TEAMS, state.currentTeamId),
    [state.currentTeam, state.currentTeamId],
  )
  const introTeam = useMemo(
    () => state.introTeam || teamById(DEFAULT_TEAMS, state.introTeamId),
    [state.introTeam, state.introTeamId],
  )

  async function toggleFullscreen(event) {
    event?.stopPropagation?.()
    try {
      if (!document.fullscreenElement) await document.querySelector('.judge-display')?.requestFullscreen()
      else await document.exitFullscreen()
    } catch {}
  }

  const mode = state.displayMode === 'event_intro'
    ? DISPLAY_MODES.EVENT_INTRO_1
    : (state.displayMode || DISPLAY_MODES.EVENT_INTRO_1)

  const eventIntroIndex = mode === DISPLAY_MODES.EVENT_INTRO_2 ? 1 : mode === DISPLAY_MODES.EVENT_INTRO_3 ? 2 : 0
  const activeEventIntro = state.eventIntros?.[eventIntroIndex] || DEFAULT_EVENT_INTROS[eventIntroIndex] || DEFAULT_EVENT_INTROS[0]
  const isEventIntro = [DISPLAY_MODES.EVENT_INTRO_1, DISPLAY_MODES.EVENT_INTRO_2, DISPLAY_MODES.EVENT_INTRO_3].includes(mode)
  const background =
    isEventIntro || mode === DISPLAY_MODES.QR_REGISTER
      ? '/judge-backgrounds/event-intro.png'
      : (mode === DISPLAY_MODES.TEAM_INTRO ? introTeam.background : currentTeam.background)

  return (
    <main
      className={`judge-display judge-display--${mode}`}
      style={{ '--display-bg': `url("${background}")` }}
      onDoubleClick={toggleFullscreen}
    >
      <div className="judge-display__bg" />
      <div className="judge-display__veil" />

      {!fullscreen && (
        <button className="judge-display__fullscreen" onClick={toggleFullscreen} type="button">
          ⛶ 전체화면
        </button>
      )}

      {!connected && <div className="judge-display__offline">연결 확인 중</div>}

      {isEventIntro && (
        <section className="event-intro">
          <div className="event-intro__eyebrow">NAEUMIEUM · BUSAN 2026</div>
          <h1>{activeEventIntro.title1 || DEFAULT_EVENT_TITLE_1}</h1>
          <p>{activeEventIntro.title2 || DEFAULT_EVENT_TITLE_2}</p>
        </section>
      )}

      {mode === DISPLAY_MODES.QR_REGISTER && (
        <section className="qr-register">
          <div className="qr-register__title">심사위원 등록</div>
          <div className="qr-register__body">
            <div className="qr-register__copy">
              <h1>휴대폰으로<br />QR을 찍어주세요</h1>
              <p>등록 후 바로 객석심사에 참여하실 수 있습니다.</p>
              <div className="qr-register__url">{state.judgeRegistrationUrl || JUDGE_REGISTRATION_URL}</div>
            </div>
            <div className="qr-register__qr-wrap">
              <img src="/judge-registration-qr.svg" alt="https://grblab.co.kr/judge 심사위원 등록 QR" />
            </div>
          </div>
        </section>
      )}

      {mode === DISPLAY_MODES.TEAM_INTRO && (
        <section className="team-intro">
          <div className="team-intro__eyebrow">다음 무대</div>
          <h1>{introTeam.name}</h1>
          <div className="team-intro__songs">
            {(introTeam.songs || []).filter(Boolean).slice(0, 2).map((song) => (
              <div key={song}>{song}</div>
            ))}
          </div>
        </section>
      )}

      {mode === DISPLAY_MODES.SCORE && state.phase !== 'result' && (
        <section className="score-live">
          <div className="score-live__comments">
            <div className="score-live__comment-slot">
              {state.comments?.[0] && <p style={{ fontSize: quoteSize(state.comments[0]) }}>{state.comments[0]}</p>}
            </div>
            <div className="score-live__comment-slot">
              {state.comments?.[1] && <p style={{ fontSize: quoteSize(state.comments[1]) }}>{state.comments[1]}</p>}
            </div>
          </div>
          <aside className="score-live__status">
            <div className="phone-icon" aria-hidden="true"><span /><i /></div>
            <div className="status-number">{state.participants ?? 0}<small>명 참여</small></div>
            <div className="status-divider" />
            <div className="status-time">{formatSeconds(state.remainingSeconds)}<small>남은 시간</small></div>
          </aside>
        </section>
      )}

      {mode === DISPLAY_MODES.SCORE && state.phase === 'result' && (
        <section className="score-result">
          <h1>{currentTeam.name}</h1>
          <div className="score-result__label">객석심사 결과</div>
          <div className="score-result__body">
            <div className="score-result__score">{Number(state.score || 0).toFixed(1)}<small>POINT</small></div>
            <div className="score-result__participants">{state.participants ?? 0}<small>명 참여</small></div>
          </div>
        </section>
      )}
    </main>
  )
}
