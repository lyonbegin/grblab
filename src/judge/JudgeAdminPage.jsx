import { useEffect, useMemo, useState } from 'react'
import './judge-admin.css'

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

function phaseLabel(phase) {
  if (phase === 'voting') return '객석심사 진행 중'
  if (phase === 'result') return '심사 마감 · 결과 화면'
  return '대기'
}

export default function JudgeAdminPage() {
  const [state, setState] = useState(INITIAL)
  const [selectedTeam, setSelectedTeam] = useState(1)
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('judgeAdminKey') || '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const team = useMemo(
    () => TEAMS.find((item) => item.id === Number(state.teamId)) || TEAMS[0],
    [state.teamId]
  )

  const selected = useMemo(
    () => TEAMS.find((item) => item.id === Number(selectedTeam)) || TEAMS[0],
    [selectedTeam]
  )

  async function fetchState() {
    try {
      const response = await fetch('/api/judge/state', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || '상태를 불러오지 못했습니다.')
      if (data?.state) {
        setState(data.state)
        setSelectedTeam(Number(data.state.teamId) || 1)
      }
      setError('')
    } catch (err) {
      setError(err?.message || '서버 연결을 확인해주세요.')
    }
  }

  useEffect(() => {
    fetchState()
    const timer = setInterval(fetchState, 1000)
    return () => clearInterval(timer)
  }, [])

  function saveKey(value) {
    setAdminKey(value)
    localStorage.setItem('judgeAdminKey', value)
  }

  async function postAdmin(path, body = {}) {
    setBusy(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminKey ? { 'x-judge-admin-key': adminKey } : {}),
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || '요청 처리에 실패했습니다.')
      }

      if (data?.state) {
        setState(data.state)
        setSelectedTeam(Number(data.state.teamId) || selectedTeam)
      } else {
        await fetchState()
      }

      return data
    } catch (err) {
      setError(err?.message || '요청 처리에 실패했습니다.')
      throw err
    } finally {
      setBusy(false)
    }
  }

  async function startVoting() {
    if (state.phase === 'voting') {
      const ok = window.confirm('현재 심사가 진행 중입니다. 새 팀 심사를 시작하시겠습니까?')
      if (!ok) return
    }

    try {
      await postAdmin('/api/judge/admin/start', {
        teamId: Number(selectedTeam),
        durationSeconds: 180,
      })
      setMessage(`${selected.name} 객석심사를 시작했습니다.`)
    } catch {}
  }

  async function closeVoting() {
    const ok = window.confirm('현재 객석심사를 마감하고 점수 화면으로 전환하시겠습니까?')
    if (!ok) return

    try {
      await postAdmin('/api/judge/admin/close')
      setMessage('객석심사를 마감했습니다.')
    } catch {}
  }

  async function resetCurrent() {
    const ok = window.confirm('현재 팀의 참여 수, 점수, 댓글을 초기화하시겠습니까?')
    if (!ok) return

    try {
      await postAdmin('/api/judge/admin/reset')
      setMessage('현재 팀 심사 데이터를 초기화했습니다.')
    } catch {}
  }

  async function moveToTeam(teamId) {
    setSelectedTeam(teamId)

    if (state.phase === 'voting') return

    try {
      await postAdmin('/api/judge/admin/team', { teamId })
    } catch {}
  }

  function nextTeam() {
    const next = Math.min(11, Number(state.teamId || selectedTeam) + 1)
    moveToTeam(next)
  }

  return (
    <div className="judge-admin">
      <header className="admin-header">
        <div>
          <div className="eyebrow">NAEUMIEUM · AUDIENCE JUDGE</div>
          <h1>객석심사 진행 화면</h1>
        </div>

        <div className={`phase-badge phase-${state.phase}`}>
          <span className="dot" />
          {phaseLabel(state.phase)}
        </div>
      </header>

      <main className="admin-grid">
        <section className="control-card main-status">
          <div className="section-head">
            <span>현재 상태</span>
            <span className="schedule-time">{team.time}</span>
          </div>

          <div className="current-team">{team.name}</div>

          <div className="status-metrics">
            <div className="metric">
              <span className="metric-label">참여</span>
              <strong>{state.participants ?? 0}</strong>
              <span className="unit">명</span>
            </div>

            <div className="metric">
              <span className="metric-label">남은 시간</span>
              <strong>{formatTime(state.remainingSeconds)}</strong>
            </div>

            <div className="metric">
              <span className="metric-label">객석점수</span>
              <strong>{state.phase === 'result' ? Number(state.score || 0).toFixed(1) : '—'}</strong>
            </div>
          </div>

          <div className="action-row">
            <button
              className="btn btn-start"
              disabled={busy}
              onClick={startVoting}
            >
              3분 심사 시작
            </button>

            <button
              className="btn btn-close"
              disabled={busy || state.phase !== 'voting'}
              onClick={closeVoting}
            >
              즉시 마감
            </button>

            <button
              className="btn btn-next"
              disabled={busy || Number(state.teamId) >= 11 || state.phase === 'voting'}
              onClick={nextTeam}
            >
              다음 합창단
            </button>
          </div>

          <div className="sub-actions">
            <button
              className="text-btn"
              disabled={busy}
              onClick={resetCurrent}
            >
              현재 팀 초기화
            </button>

            <a
              className="display-link"
              href={`/judge/display?team=${state.teamId}`}
              target="_blank"
              rel="noreferrer"
            >
              무대화면 새 창으로 열기 ↗
            </a>
          </div>

          {message && <div className="notice success">{message}</div>}
          {error && <div className="notice error">{error}</div>}
        </section>

        <section className="control-card live-comments">
          <div className="section-head">
            <span>현재 송출 댓글</span>
            <span className="small-note">최근 2개</span>
          </div>

          <div className="comment-list">
            {(state.comments || []).length === 0 ? (
              <div className="empty-comment">아직 표시할 댓글이 없습니다.</div>
            ) : (
              (state.comments || []).slice(-2).map((comment, index) => (
                <div className="comment-item" key={`${comment}-${index}`}>
                  <span>{comment}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="control-card team-selector">
          <div className="section-head">
            <span>공연 순서</span>
            <span className="small-note">합창단 선택</span>
          </div>

          <div className="team-list">
            {TEAMS.map((item) => {
              const active = Number(state.teamId) === item.id
              const picked = Number(selectedTeam) === item.id

              return (
                <button
                  key={item.id}
                  className={`team-row ${active ? 'active' : ''} ${picked ? 'picked' : ''}`}
                  onClick={() => moveToTeam(item.id)}
                  disabled={busy}
                >
                  <span className="team-no">{String(item.id).padStart(2, '0')}</span>
                  <span className="team-name">{item.name}</span>
                  <span className="team-time">{item.time}</span>
                  {active && <span className="now-chip">현재</span>}
                </button>
              )
            })}
          </div>
        </section>

        <section className="control-card settings-card">
          <div className="section-head">
            <span>관리자 설정</span>
          </div>

          <label className="field-label" htmlFor="judgeAdminKey">
            관리자 키
          </label>
          <input
            id="judgeAdminKey"
            type="password"
            value={adminKey}
            onChange={(event) => saveKey(event.target.value)}
            placeholder="JUDGE_ADMIN_KEY를 입력"
            autoComplete="off"
          />

          <p className="helper">
            Railway에 JUDGE_ADMIN_KEY를 설정한 경우에만 입력하시면 됩니다.
            이 값은 이 브라우저의 localStorage에만 저장됩니다.
          </p>

          <div className="server-state">
            <span>서버 상태 갱신</span>
            <strong>1초 간격</strong>
          </div>
        </section>
      </main>
    </div>
  )
}
