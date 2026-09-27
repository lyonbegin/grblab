import { useEffect, useMemo, useRef, useState } from 'react'
import './judge-admin.css'
import { DEFAULT_TEAMS, DISPLAY_MODES, formatSeconds, maskPhone, teamById } from './judgeConfig'

const TABS = [
  ['control', '송출·진행'],
  ['mobiles', '모바일 접속자'],
  ['comments', '댓글'],
  ['experts', '현장 전문가'],
  ['order', '합창단 순서'],
  ['settings', '설정·원자료'],
]

const INITIAL = {
  displayMode: DISPLAY_MODES.EVENT_INTRO,
  eventTitle1: '2026 장애인 합창단 초청 음악회',
  eventTitle2: '오늘의 무대가 도쿄로 이어집니다',
  currentTeamId: 1,
  introTeamId: 1,
  teamOrder: DEFAULT_TEAMS.map((team) => team.id),
  phase: 'idle',
  durationSeconds: 180,
  remainingSeconds: 180,
  participants: 0,
  audienceCount: 0,
  expertCount: 0,
  score: 0,
  comments: [],
  judges: [],
  registeredAudienceCount: 0,
  onlineAudienceCount: 0,
  expertVotes: [],
  expertBatches: [],
  teams: DEFAULT_TEAMS,
  settings: {
    mobileEnabled: true,
    registrationEnabled: true,
    commentInputEnabled: true,
    commentDisplayEnabled: true,
    allowVoteEdit: true,
  },
}

function adminHeaders(adminKey) {
  return {
    'Content-Type': 'application/json',
    ...(adminKey ? { 'x-judge-admin-key': adminKey } : {}),
  }
}

export default function JudgeAdminPage() {
  const [tab, setTab] = useState('control')
  const [state, setState] = useState(INITIAL)
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('judgeAdminKey') || '')
  const [duration, setDuration] = useState(180)
  const [remainingEdit, setRemainingEdit] = useState(180)
  const [introTeamId, setIntroTeamId] = useState(1)
  const [title1, setTitle1] = useState(INITIAL.eventTitle1)
  const [title2, setTitle2] = useState(INITIAL.eventTitle2)
  const [song1, setSong1] = useState('')
  const [song2, setSong2] = useState('')
  const [expertCount, setExpertCount] = useState(0)
  const [expertBase, setExpertBase] = useState(88)
  const [expertSpread, setExpertSpread] = useState(10)
  const [mobileSearch, setMobileSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [draggedId, setDraggedId] = useState(null)
  const pollRef = useRef(null)
  const localInitializedRef = useRef(false)
  const remainingEditingRef = useRef(false)

  const teams = state.teams?.length ? state.teams : DEFAULT_TEAMS
  const currentTeam = useMemo(() => teamById(teams, state.currentTeamId), [teams, state.currentTeamId])
  const introTeam = useMemo(() => teamById(teams, introTeamId), [teams, introTeamId])
  const orderedTeams = useMemo(
    () => (state.teamOrder || []).map((id) => teamById(teams, id)).filter(Boolean),
    [state.teamOrder, teams],
  )

  function hydrate(next) {
    if (!next) return
    setState((prev) => ({ ...prev, ...next }))
    if (!localInitializedRef.current) {
      const initialIntroId = Number(next.introTeamId || 1)
      const initialTeams = Array.isArray(next.teams) && next.teams.length ? next.teams : DEFAULT_TEAMS
      const initialIntroTeam = teamById(initialTeams, initialIntroId)
      setDuration(Number(next.durationSeconds || 180))
      setRemainingEdit(Number(next.remainingSeconds ?? next.durationSeconds ?? 180))
      setIntroTeamId(initialIntroId)
      setTitle1(next.eventTitle1 || '')
      setTitle2(next.eventTitle2 || '')
      setSong1(initialIntroTeam?.songs?.[0] || '')
      setSong2(initialIntroTeam?.songs?.[1] || '')
      localInitializedRef.current = true
    } else if (next.phase === 'voting' && !remainingEditingRef.current) {
      setRemainingEdit(Number(next.remainingSeconds ?? 0))
    }
  }

  async function loadState() {
    try {
      const response = await fetch('/api/judge/admin/state', {
        cache: 'no-store',
        headers: adminKey ? { 'x-judge-admin-key': adminKey } : {},
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '관리자 상태를 불러오지 못했습니다.')
      hydrate(data.state)
      setError('')
    } catch (err) {
      setError(err.message || '서버 연결을 확인해주세요.')
    }
  }

  useEffect(() => {
    loadState()
    pollRef.current = setInterval(loadState, 1500)
    return () => clearInterval(pollRef.current)
  }, [adminKey])

  useEffect(() => {
    const team = teamById(teams, introTeamId)
    setSong1(team?.songs?.[0] || '')
    setSong2(team?.songs?.[1] || '')
    // 사용자가 곡명을 입력하는 동안 1.5초 폴링이 입력값을 덮어쓰지 않도록
    // 팀 선택이 바뀔 때만 기본값을 다시 불러옵니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introTeamId])

  async function post(path, body = {}) {
    setBusy(true)
    setNotice('')
    setError('')
    try {
      const response = await fetch(path, { method: 'POST', headers: adminHeaders(adminKey), body: JSON.stringify(body) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '처리하지 못했습니다.')
      if (data.state) hydrate(data.state)
      return data
    } catch (err) {
      setError(err.message || '처리하지 못했습니다.')
      throw err
    } finally {
      setBusy(false)
    }
  }

  function saveAdminKey(value) {
    setAdminKey(value)
    localStorage.setItem('judgeAdminKey', value)
  }

  async function setDisplayMode(displayMode) {
    try {
      await post('/api/judge/admin/display', { displayMode })
      setNotice('무대 송출 화면을 변경했습니다.')
    } catch {}
  }

  async function saveEventIntro() {
    try {
      await post('/api/judge/admin/display', { displayMode: DISPLAY_MODES.EVENT_INTRO, eventTitle1: title1, eventTitle2: title2 })
      setNotice('전체 인트로를 저장하고 송출했습니다.')
    } catch {}
  }

  async function saveTeamIntro() {
    try {
      await post('/api/judge/admin/team-meta', { teamId: introTeamId, songs: [song1, song2] })
      await post('/api/judge/admin/display', { displayMode: DISPLAY_MODES.TEAM_INTRO, introTeamId })
      setNotice('다음 팀 인트로를 저장하고 송출했습니다.')
    } catch {}
  }

  async function selectCurrentTeam(teamId) {
    if (state.phase === 'voting') return setError('심사 진행 중에는 현재 팀을 바꿀 수 없습니다.')
    try { await post('/api/judge/admin/team', { teamId }) } catch {}
  }

  async function startVote() {
    try {
      await post('/api/judge/admin/display', { displayMode: DISPLAY_MODES.SCORE })
      await post('/api/judge/admin/start', { teamId: state.currentTeamId, durationSeconds: Number(duration) || 180 })
      setNotice(`${currentTeam.name} 심사를 시작했습니다.`)
    } catch {}
  }

  async function closeVote() {
    if (!window.confirm('현재 심사를 마감하고 점수 결과 화면으로 전환하시겠습니까?')) return
    try { await post('/api/judge/admin/close'); setNotice('심사를 마감했습니다.') } catch {}
  }

  async function applyRemainingTime(value = remainingEdit) {
    if (state.phase !== 'voting') return

    const seconds = Math.max(0, Math.min(3600, Math.round(Number(value) || 0)))
    setRemainingEdit(seconds)

    try {
      await post('/api/judge/admin/time', { remainingSeconds: seconds })
      setNotice(`남은 시간을 ${formatSeconds(seconds)}로 변경했습니다.`)
    } catch {
      // 서버 state가 다음 poll에서 다시 동기화됩니다.
    } finally {
      remainingEditingRef.current = false
    }
  }

  async function changeRemainingBy(delta) {
    const base = Number(remainingEdit ?? state.remainingSeconds ?? 0)
    const next = Math.max(0, Math.min(3600, base + delta))
    setRemainingEdit(next)
    await applyRemainingTime(next)
  }

  async function resetTeam() {
    if (!window.confirm(`${currentTeam.name}의 점수·댓글·현장 전문가 기록을 초기화하시겠습니까?`)) return
    try { await post('/api/judge/admin/reset', { teamId: state.currentTeamId }); setNotice('현재 팀 데이터를 초기화했습니다.') } catch {}
  }

  async function deleteComment(commentId) {
    try { await post('/api/judge/admin/comment/delete', { commentId }); setNotice('댓글을 삭제했습니다.') } catch {}
  }

  async function toggleJudge(judge) {
    try { await post('/api/judge/admin/judge/allow', { judgeId: judge.id, allowed: !judge.allowed }) } catch {}
  }

  async function changeSetting(key, value) {
    try { await post('/api/judge/admin/settings', { [key]: value }) } catch {}
  }

  async function startExperts() {
    try {
      await post('/api/judge/admin/expert/start', {
        count: Number(expertCount) || 0,
        baseScore: Number(expertBase),
        spread: Number(expertSpread),
      })
      setNotice('현장 전문가 점수 투입을 시작했습니다.')
    } catch {}
  }

  async function stopExperts() {
    try { await post('/api/judge/admin/expert/stop'); setNotice('남은 현장 전문가 자동 투입을 중지했습니다.') } catch {}
  }

  async function updateExpertVote(vote, score, remove = false) {
    try {
      await post('/api/judge/admin/expert/vote', {
        teamId: state.currentTeamId,
        judgeId: vote.judgeId,
        score: Number(score),
        delete: remove,
      })
    } catch {}
  }

  function dragStart(event, id) {
    setDraggedId(id)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(id))
  }

  async function dropTeam(event, targetId) {
    event.preventDefault()
    const sourceId = Number(draggedId || event.dataTransfer.getData('text/plain'))
    setDraggedId(null)
    if (!sourceId || sourceId === targetId) return
    const next = [...state.teamOrder]
    const from = next.indexOf(sourceId)
    const to = next.indexOf(targetId)
    if (from < 0 || to < 0) return
    next.splice(from, 1)
    next.splice(to, 0, sourceId)
    setState((prev) => ({ ...prev, teamOrder: next }))
    try { await post('/api/judge/admin/order', { teamOrder: next }); setNotice('합창단 순서를 저장했습니다.') } catch { loadState() }
  }

  async function exportCsv() {
    try {
      const response = await fetch('/api/judge/admin/export.csv', { headers: adminKey ? { 'x-judge-admin-key': adminKey } : {} })
      if (!response.ok) throw new Error('CSV 다운로드에 실패했습니다.')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'judge-votes.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) { setError(err.message) }
  }

  const filteredJudges = (state.judges || []).filter((judge) => {
    const q = mobileSearch.replace(/\D/g, '')
    return !q || String(judge.phone || '').includes(q)
  })

  const activeBatch = (state.expertBatches || []).find((batch) => batch.status === 'running')
  const expertPending = activeBatch?.entries?.filter((entry) => entry.status === 'pending').length || 0
  const expertSubmitted = activeBatch?.entries?.filter((entry) => entry.status === 'submitted').length || 0

  return (
    <div className="judge-admin-final">
      <header className="admin-top">
        <div><div className="eyebrow">NAEUMIEUM · 2026.09.29</div><h1>공연 · 객석심사 운영</h1></div>
        <div className="top-stats">
          <span>등록 <b>{state.registeredAudienceCount || 0}</b></span>
          <span>접속 <b>{state.onlineAudienceCount || 0}</b></span>
          <span>현재 제출 <b>{state.participants || 0}</b></span>
        </div>
      </header>

      <nav className="admin-tabs">
        {TABS.map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}
      </nav>

      {(notice || error) && <div className={`admin-message ${error ? 'error' : 'ok'}`}>{error || notice}</div>}

      {tab === 'control' && (
        <div className="admin-columns">
          <section className="panel wide">
            <div className="panel-title">무대 화면 선택</div>
            <div className="display-mode-grid">
              <button className={state.displayMode === DISPLAY_MODES.EVENT_INTRO ? 'selected' : ''} onClick={() => setDisplayMode(DISPLAY_MODES.EVENT_INTRO)}><b>전체 인트로</b><span>공연 전체 시작 화면</span></button>
              <button className={state.displayMode === DISPLAY_MODES.TEAM_INTRO ? 'selected' : ''} onClick={() => setDisplayMode(DISPLAY_MODES.TEAM_INTRO)}><b>다음 팀 인트로</b><span>팀명 + 공연곡 최대 2곡</span></button>
              <button className={state.displayMode === DISPLAY_MODES.SCORE ? 'selected' : ''} onClick={() => setDisplayMode(DISPLAY_MODES.SCORE)}><b>스코어</b><span>댓글 · 참여 · 시간 · 결과</span></button>
            </div>
          </section>

          {state.displayMode === DISPLAY_MODES.EVENT_INTRO && (
            <section className="panel wide">
              <div className="panel-title">전체 공연 인트로</div>
              <label>제목 1<input value={title1} onChange={(e) => setTitle1(e.target.value)} /></label>
              <label>제목 2<input value={title2} onChange={(e) => setTitle2(e.target.value)} /></label>
              <button className="primary" onClick={saveEventIntro} disabled={busy}>저장하고 전체 인트로 송출</button>
            </section>
          )}

          {state.displayMode === DISPLAY_MODES.TEAM_INTRO && (
            <section className="panel wide">
              <div className="panel-title">다음 팀 인트로</div>
              <label>합창단<select value={introTeamId} onChange={(e) => setIntroTeamId(Number(e.target.value))}>{orderedTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
              <div className="song-grid">
                <label>공연곡 1<input value={song1} onChange={(e) => setSong1(e.target.value)} placeholder="공연곡 1" /></label>
                <label>공연곡 2<input value={song2} onChange={(e) => setSong2(e.target.value)} placeholder="공연곡 2 (없으면 비움)" /></label>
              </div>
              <div className="intro-preview-text"><b>{introTeam.name}</b><span>{[song1, song2].filter(Boolean).join(' · ') || '공연곡 미입력'}</span></div>
              <button className="primary" onClick={saveTeamIntro} disabled={busy}>저장하고 다음 팀 인트로 송출</button>
            </section>
          )}

          {state.displayMode === DISPLAY_MODES.SCORE && (
            <>
              <section className="panel wide">
                <div className="panel-title split"><span>현재 스코어 운영</span><span>{currentTeam.start}~{currentTeam.end}</span></div>
                <div className="current-team-name">{currentTeam.name}</div>
                <div className="metric-grid">
                  <div><span>총 참여</span><b>{state.participants || 0}</b><small>실제 {state.audienceCount || 0} + 현장 전문가 {state.expertCount || 0}</small></div>
                  <div><span>남은 시간</span><b>{formatSeconds(state.remainingSeconds)}</b><small>{state.phase === 'voting' ? '심사 진행 중' : state.phase === 'result' ? '마감' : '대기'}</small></div>
                  <div><span>현재 총점</span><b>{Number(state.score || 0).toFixed(1)}</b><small>현장 합산 평균</small></div>
                </div>
                {state.phase === 'voting' ? (
                  <div className="duration-line">
                    <span>현재 남은 시간</span>
                    <input
                      type="number"
                      min="0"
                      max="3600"
                      step="1"
                      value={remainingEdit}
                      onFocus={() => { remainingEditingRef.current = true }}
                      onChange={(e) => {
                        remainingEditingRef.current = true
                        setRemainingEdit(e.target.value)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur()
                        }
                      }}
                      onBlur={() => applyRemainingTime(remainingEdit)}
                    />
                    <span>초</span>
                    <button type="button" onClick={() => changeRemainingBy(-30)}>-30초</button>
                    <button type="button" onClick={() => applyRemainingTime(remainingEdit)}>적용</button>
                    <button type="button" onClick={() => changeRemainingBy(30)}>+30초</button>
                    <small>변경 즉시 무대 디스플레이에도 반영됩니다.</small>
                  </div>
                ) : (
                  <div className="duration-line">
                    <span>심사 시간</span>
                    <input
                      type="number"
                      min="30"
                      max="600"
                      step="10"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                    <span>초</span>
                    <button type="button" onClick={() => setDuration(120)}>2분</button>
                    <button type="button" onClick={() => setDuration(180)}>3분</button>
                    <button type="button" onClick={() => setDuration(240)}>4분</button>
                  </div>
                )}
                <div className="score-actions"><button className="primary" onClick={startVote} disabled={busy}>심사 시작</button><button className="danger" onClick={closeVote} disabled={state.phase !== 'voting' || busy}>즉시 마감</button><button onClick={resetTeam} disabled={busy}>현재 팀 초기화</button></div>
              </section>
              <section className="panel">
                <div className="panel-title">현재 송출 댓글</div>
                {(state.commentItems || []).length ? state.commentItems.map((item) => <div className="comment-now" key={item.id}><span>{item.text}</span><button onClick={() => deleteComment(item.id)}>삭제</button></div>) : <div className="empty">표시 중인 댓글이 없습니다.</div>}
              </section>
              <section className="panel">
                <div className="panel-title">현재 팀 선택</div>
                <select value={state.currentTeamId} disabled={state.phase === 'voting'} onChange={(e) => selectCurrentTeam(Number(e.target.value))}>{orderedTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select>
                <a className="display-link" href="/judge/display" target="_blank" rel="noreferrer">무대 디스플레이 열기 ↗</a>
              </section>
            </>
          )}
        </div>
      )}

      {tab === 'mobiles' && (
        <section className="panel">
          <div className="panel-title split"><span>모바일 접속자</span><span>등록 {state.registeredAudienceCount || 0} · 현재 접속 {state.onlineAudienceCount || 0}</span></div>
          <input className="search" placeholder="전화번호 검색" value={mobileSearch} onChange={(e) => setMobileSearch(e.target.value)} />
          <div className="mobile-grid">
            {filteredJudges.map((judge) => (
              <article className={`mobile-card ${judge.online ? 'online' : ''} ${judge.allowed ? '' : 'blocked'}`} key={judge.id}>
                <div className="mobile-card-head"><b>{judge.phoneMasked || maskPhone(judge.phone)}</b><span>{judge.online ? '● 접속중' : '○ 오프라인'}</span></div>
                <div className="mobile-card-info"><span>현재팀</span><b>{judge.submittedCurrentTeam ? '제출 완료' : '미제출'}</b></div>
                <div className="mobile-card-info"><span>마지막 접속</span><b>{judge.lastSeenAt ? new Date(judge.lastSeenAt).toLocaleTimeString('ko-KR') : '—'}</b></div>
                <button className={judge.allowed ? 'danger-lite' : 'allow'} onClick={() => toggleJudge(judge)}>{judge.allowed ? '심사 차단' : '심사 허용'}</button>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'comments' && (
        <section className="panel">
          <div className="panel-title">{currentTeam.name} · 전체 댓글</div>
          <div className="comment-table">
            {(state.comments || []).map((comment) => <div className="comment-row" key={comment.id}><span className="comment-who">{comment.judgeLabel}</span><span>{comment.text}</span><span>{new Date(comment.createdAt).toLocaleTimeString('ko-KR')}</span><button onClick={() => deleteComment(comment.id)}>삭제</button></div>)}
            {!(state.comments || []).length && <div className="empty">아직 댓글이 없습니다.</div>}
          </div>
        </section>
      )}

      {tab === 'experts' && (
        <div className="admin-columns">
          <section className="panel wide">
            <div className="panel-title">현장 전문가 자동 투입</div>
            <div className="expert-inputs">
              <label>인원<input type="number" min="0" max="500" value={expertCount} onChange={(e) => setExpertCount(e.target.value)} /></label>
              <label>기준 점수<input type="number" min="0" max="100" step="0.1" value={expertBase} onChange={(e) => setExpertBase(e.target.value)} /></label>
              <label>편차 ±<input type="number" min="0" max="30" step="0.5" value={expertSpread} onChange={(e) => setExpertSpread(e.target.value)} /></label>
            </div>
            <p className="help">가상 1, 가상 2…로 DB에 <b>onsite_expert</b> 유형으로 별도 저장되며, 현장 화면 집계에는 실제 모바일과 합산됩니다. 인원이 0이면 추가되지 않습니다.</p>
            <div className="score-actions"><button className="primary" onClick={startExperts} disabled={state.phase !== 'voting' || busy}>남은 시간에 균등 투입 시작</button><button onClick={stopExperts}>남은 자동 투입 중지</button></div>
            {activeBatch && <div className="batch-status">진행 {expertSubmitted} / {activeBatch.count} · 대기 {expertPending} · 기준 {activeBatch.baseScore} ±{activeBatch.spread}</div>}
          </section>
          <section className="panel wide">
            <div className="panel-title">현재 팀 현장 전문가 기록</div>
            <div className="expert-list">
              {(state.expertVotes || []).map((vote) => <ExpertRow key={vote.id} vote={vote} onSave={updateExpertVote} />)}
              {!(state.expertVotes || []).length && <div className="empty">아직 투입된 현장 전문가 점수가 없습니다.</div>}
            </div>
          </section>
        </div>
      )}

      {tab === 'order' && (
        <section className="panel">
          <div className="panel-title split"><span>합창단 순서</span><span>☰ 카드를 드래그</span></div>
          <div className="order-list">
            {orderedTeams.map((team, index) => <div key={team.id} draggable onDragStart={(e) => dragStart(e, team.id)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => dropTeam(e, team.id)} className={`order-row ${draggedId === team.id ? 'dragging' : ''}`}><span className="handle">☰</span><b>{String(index + 1).padStart(2, '0')}</b><span>{team.name}</span><small>{team.start}~{team.end}</small></div>)}
          </div>
        </section>
      )}

      {tab === 'settings' && (
        <div className="admin-columns">
          <section className="panel wide">
            <div className="panel-title">모바일·댓글 정책</div>
            {[
              ['mobileEnabled', '전체 모바일 심사 허용'],
              ['registrationEnabled', '신규 전화번호 등록 허용'],
              ['commentInputEnabled', '모바일 댓글 입력 허용'],
              ['commentDisplayEnabled', '무대 댓글 송출 허용'],
              ['allowVoteEdit', '제출 후 점수 수정 허용'],
            ].map(([key, label]) => <label className="switch-row" key={key}><span>{label}</span><input type="checkbox" checked={Boolean(state.settings?.[key])} onChange={(e) => changeSetting(key, e.target.checked)} /></label>)}
          </section>
          <section className="panel">
            <div className="panel-title">관리자 키</div>
            <input type="password" value={adminKey} onChange={(e) => saveAdminKey(e.target.value)} placeholder="JUDGE_ADMIN_KEY" />
            <p className="help">Railway 환경변수에 JUDGE_ADMIN_KEY를 설정한 경우 입력합니다.</p>
          </section>
          <section className="panel">
            <div className="panel-title">원자료</div>
            <button className="primary" onClick={exportCsv}>전체 투표 CSV 다운로드</button>
            <p className="help">audience / onsite_expert 유형이 분리된 원자료입니다.</p>
          </section>
        </div>
      )}
    </div>
  )
}

function ExpertRow({ vote, onSave }) {
  const [value, setValue] = useState(vote.score)
  useEffect(() => setValue(vote.score), [vote.score])
  return <div className="expert-row"><b>{vote.label}</b><input type="number" min="0" max="100" step="0.1" value={value} onChange={(e) => setValue(e.target.value)} /><button onClick={() => onSave(vote, value, false)}>수정</button><button className="danger-lite" onClick={() => onSave(vote, value, true)}>삭제</button></div>
}
