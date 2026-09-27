import { useEffect, useMemo, useState } from 'react'
import './judge-mobile.css'
import { DEFAULT_TEAMS, formatSeconds, teamById } from './judgeConfig'

const TOKEN_KEY = 'judgeSessionToken'

export default function AudienceJudgePage() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [phone, setPhone] = useState('010')
  const [state, setState] = useState(null)
  const [score, setScore] = useState(90)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const team = useMemo(
    () => state?.currentTeam || teamById(DEFAULT_TEAMS, state?.currentTeamId || 1),
    [state],
  )

  async function fetchState(activeToken = token) {
    if (!activeToken) return
    try {
      const response = await fetch('/api/judge/mobile/state', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${activeToken}` },
      })
      const data = await response.json()
      if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY)
        setToken('')
        setState(null)
        setError('다시 전화번호를 입력해주세요.')
        return
      }
      if (!response.ok) throw new Error(data.error || '상태를 불러오지 못했습니다.')
      setState(data.state)
      if (data.state?.myVote?.score != null) setScore(Number(data.state.myVote.score))
      setError('')
    } catch (err) {
      setError(err.message || '서버 연결을 확인해주세요.')
    }
  }

  useEffect(() => {
    if (!token) return undefined
    fetchState(token)
    const poll = setInterval(() => fetchState(token), 5000)
    return () => clearInterval(poll)
  }, [token])

  useEffect(() => {
    if (state?.phase !== 'voting' || !state?.endsAt) return undefined
    const tick = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((new Date(state.endsAt).getTime() - Date.now()) / 1000))
      setState((prev) => prev ? ({ ...prev, remainingSeconds: remaining }) : prev)
    }, 1000)
    return () => clearInterval(tick)
  }, [state?.phase, state?.endsAt])

  async function register(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/judge/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '등록하지 못했습니다.')
      localStorage.setItem(TOKEN_KEY, data.sessionToken)
      setToken(data.sessionToken)
      setState(data.state)
      setMessage('심사위원 등록이 완료되었습니다.')
    } catch (err) {
      setError(err.message || '등록하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  async function submitVote(event) {
    event.preventDefault()
    if (!token || !state) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/judge/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ teamId: state.currentTeamId, score: Number(score), comment: comment.trim() }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '평가를 제출하지 못했습니다.')
      setMessage(data.updated ? '평가를 수정했습니다.' : '평가를 제출했습니다.')
      setComment('')
      await fetchState(token)
    } catch (err) {
      setError(err.message || '평가를 제출하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <main className="judge-mobile-page">
        <section className="mobile-shell register-shell">
          <div className="mobile-brand">나눔이음</div>
          <div className="register-mark">♪</div>
          <h1>객석심사 참여</h1>
          <p>처음 한 번만 휴대폰 번호를 입력해주세요. 이 번호가 심사위원 ID가 됩니다.</p>
          <form onSubmit={register}>
            <input className="phone-input" inputMode="numeric" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9-]/g, ''))} placeholder="01012345678" />
            <button className="mobile-primary" disabled={busy}>{busy ? '등록 중…' : '확인'}</button>
          </form>
          {error && <div className="mobile-alert error">{error}</div>}
        </section>
      </main>
    )
  }

  if (!state) return <main className="judge-mobile-page"><section className="mobile-shell state-card"><h1>연결 중입니다</h1></section></main>

  if (!state.allowed) {
    return <main className="judge-mobile-page"><section className="mobile-shell state-card"><div className="state-icon">!</div><h1>현재 심사 참여가 제한되었습니다</h1><p>진행요원에게 문의해주세요.</p></section></main>
  }

  if (!state.mobileEnabled) {
    return <main className="judge-mobile-page"><section className="mobile-shell state-card"><div className="state-icon">Ⅱ</div><h1>모바일 심사가 잠시 중지되었습니다</h1><p>잠시 후 자동으로 다시 확인됩니다.</p></section></main>
  }

  if (state.phase !== 'voting') {
    return (
      <main className="judge-mobile-page">
        <section className="mobile-shell state-card">
          <div className="mobile-brand">나눔이음</div>
          <div className="state-icon">{state.phase === 'result' ? '✓' : '♪'}</div>
          <h1>{state.phase === 'result' ? '객석심사가 마감되었습니다' : '다음 객석심사를 기다리고 있습니다'}</h1>
          <p>{state.phoneMasked} · 참여해 주셔서 감사합니다.</p>
        </section>
      </main>
    )
  }

  const hasVote = Boolean(state.myVote)
  const canEdit = state.allowVoteEdit !== false

  return (
    <main className="judge-mobile-page">
      <section className="mobile-shell">
        <header className="judge-mobile-head"><span className="live-badge">객석심사 진행 중</span><b>{formatSeconds(state.remainingSeconds)}</b></header>
        <section className="team-mobile-card"><small>{state.phoneMasked}</small><h1>{team.name}</h1><p>{team.start} ~ {team.end}</p></section>
        <form onSubmit={submitVote}>
          <section className="score-mobile-card">
            <div className="score-title"><span>이 무대에 몇 점을 주시겠습니까?</span><b>{score}</b></div>
            <input type="range" min="0" max="100" step="1" value={score} onChange={(e) => setScore(Number(e.target.value))} disabled={hasVote && !canEdit} />
            <div className="range-numbers"><span>0</span><span>50</span><span>100</span></div>
          </section>
          {state.commentInputEnabled && (
            <section className="comment-mobile-card"><div className="score-title"><span>한마디 남겨주세요</span><small>선택 · 40자</small></div><textarea maxLength={40} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="공연을 보고 느낀 마음을 남겨주세요." /><div className="char-count">{comment.length}/40</div></section>
          )}
          <button className="mobile-primary" disabled={busy || (hasVote && !canEdit)}>{busy ? '제출 중…' : hasVote ? (canEdit ? '평가 수정하기' : '제출 완료') : '평가 보내기'}</button>
          {message && <div className="mobile-alert ok">{message}</div>}
          {error && <div className="mobile-alert error">{error}</div>}
        </form>
        <footer>현재 총 <b>{state.participants || 0}명</b> 참여</footer>
      </section>
    </main>
  )
}
