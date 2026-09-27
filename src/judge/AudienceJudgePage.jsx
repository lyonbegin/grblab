import { useEffect, useMemo, useState } from 'react'
import './judge-mobile.css'

const TEAMS = [
  { id: 1,  name: '은가비합창단',              time: '14:15~14:25' },
  { id: 2,  name: '완주장애인합창단 ‘꽃’',     time: '14:31~14:36' },
  { id: 3,  name: '대구라온휠합창단',          time: '14:42~14:46' },
  { id: 4,  name: 'KYCU 에바다합창단',         time: '14:52~14:58' },
  { id: 5,  name: '옥구슬합창단',              time: '15:04~15:09' },
  { id: 6,  name: '부산베데스다합창단',        time: '15:15~15:20' },
  { id: 7,  name: '이지글리합창단',            time: '15:26~15:33' },
  { id: 8,  name: '부산 단디소리합창단',       time: '15:39~15:44' },
  { id: 9,  name: '코웨이물빛합창단',          time: '15:50~15:55' },
  { id: 10, name: '골프존파스텔합창단',        time: '16:01~16:05' },
  { id: 11, name: '어울림시각장애인합창단',    time: '16:12~16:18' },
]

const INITIAL = {
  teamId: 1,
  phase: 'idle',
  participants: 0,
  remainingSeconds: 180,
  score: 0,
  comments: [],
}

function formatTime(seconds = 0) {
  const safe = Math.max(0, Number(seconds) || 0)
  const min = String(Math.floor(safe / 60)).padStart(2, '0')
  const sec = String(safe % 60).padStart(2, '0')
  return `${min}:${sec}`
}

function getJudgeId() {
  const saved = localStorage.getItem('audienceJudgeId')
  if (saved) return saved

  const id =
    globalThis.crypto?.randomUUID?.() ||
    `judge-${Date.now()}-${Math.random().toString(16).slice(2)}`

  localStorage.setItem('audienceJudgeId', id)
  return id
}

export default function AudienceJudgePage() {
  const [state, setState] = useState(INITIAL)
  const [score, setScore] = useState(90)
  const [comment, setComment] = useState('')
  const [judgeId] = useState(getJudgeId)
  const [busy, setBusy] = useState(false)
  const [submittedTeamId, setSubmittedTeamId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const team = useMemo(
    () => TEAMS.find((item) => item.id === Number(state.teamId)) || TEAMS[0],
    [state.teamId]
  )

  useEffect(() => {
    let source

    async function loadState() {
      try {
        const response = await fetch('/api/judge/state', { cache: 'no-store' })
        const data = await response.json()
        if (data?.state) setState(data.state)
      } catch {}
    }

    loadState()

    source = new EventSource('/api/judge/live')

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'state') {
          setState((prev) => ({ ...prev, ...data }))
        }

        if (data.type === 'team') {
          setState((prev) => ({ ...prev, teamId: Number(data.teamId) || prev.teamId }))
          setSubmittedTeamId(null)
          setMessage('')
          setError('')
          setComment('')
          setScore(90)
        }

        if (data.type === 'result') {
          setState((prev) => ({
            ...prev,
            phase: 'result',
            remainingSeconds: 0,
            score: data.score,
            participants: data.participants,
          }))
        }
      } catch {}
    }

    return () => source?.close()
  }, [])

  useEffect(() => {
    if (state.phase === 'voting' && Number(submittedTeamId) !== Number(state.teamId)) {
      setMessage('')
      setError('')
    }
  }, [state.phase, state.teamId, submittedTeamId])

  async function submitVote(event) {
    event.preventDefault()

    if (state.phase !== 'voting') return

    setBusy(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/judge/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: Number(state.teamId),
          judgeId,
          score: Number(score),
          comment: comment.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || '제출하지 못했습니다.')
      }

      setSubmittedTeamId(Number(state.teamId))
      setMessage(data.updated ? '평가를 수정했습니다.' : '평가가 제출되었습니다.')
    } catch (err) {
      setError(err?.message || '제출하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const alreadySubmitted = Number(submittedTeamId) === Number(state.teamId)

  return (
    <main className="audience-judge-mobile">
      <section className="judge-shell">
        <div className="brand">나눔이음</div>

        {state.phase === 'idle' && (
          <div className="state-panel waiting">
            <div className="state-icon">♪</div>
            <h1>다음 객석심사를 기다리고 있습니다</h1>
            <p>공연이 끝나면 이 화면에서 평가하실 수 있습니다.</p>
          </div>
        )}

        {state.phase === 'voting' && (
          <>
            <div className="mobile-head">
              <span className="live-pill">객석심사 진행 중</span>
              <span className="timer">{formatTime(state.remainingSeconds)}</span>
            </div>

            <div className="team-card">
              <span className="team-order">{String(team.id).padStart(2, '0')}</span>
              <h1>{team.name}</h1>
              <p>{team.time}</p>
            </div>

            <form onSubmit={submitVote}>
              <section className="score-card">
                <div className="card-title">
                  <span>이 무대에 몇 점을 주시겠습니까?</span>
                  <strong>{score}</strong>
                </div>

                <input
                  className="score-range"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={score}
                  onChange={(event) => setScore(Number(event.target.value))}
                  aria-label="객석 평가 점수"
                />

                <div className="range-labels">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </section>

              <section className="comment-card">
                <div className="card-title">
                  <span>한마디 남겨주세요</span>
                  <small>선택</small>
                </div>

                <textarea
                  value={comment}
                  maxLength={80}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="공연을 보고 느낀 마음을 자유롭게 적어주세요."
                />

                <div className="char-count">{comment.length}/80</div>
              </section>

              <button className="submit-button" type="submit" disabled={busy}>
                {busy ? '제출 중…' : alreadySubmitted ? '평가 수정하기' : '평가 보내기'}
              </button>

              {message && <div className="mobile-notice success">{message}</div>}
              {error && <div className="mobile-notice error">{error}</div>}
            </form>

            <div className="participant-line">
              현재 <strong>{state.participants ?? 0}명</strong>이 참여하고 있습니다
            </div>
          </>
        )}

        {state.phase === 'result' && (
          <div className="state-panel closed">
            <div className="state-icon">✓</div>
            <h1>객석심사가 마감되었습니다</h1>
            <p>참여해 주셔서 감사합니다.</p>
            <div className="closed-count">{state.participants ?? 0}명 참여</div>
          </div>
        )}
      </section>
    </main>
  )
}
