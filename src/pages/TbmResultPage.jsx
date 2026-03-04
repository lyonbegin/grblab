// src/pages/TbmResultPage.jsx
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}

/**
 * Roboflow 응답 예:
 * {
 *   outputs: [
 *     { open_ai: { output: "{\n  \"tbm_info\": ... }", classes: null } }
 *   ]
 * }
 */
function parseRoboflowTbm(result) {
  if (!result) return null

  // 1) 이미 tbm 객체로 들어오는 경우
  if (result.tbm_info && result.tbm_checklist) return result

  // 2) Roboflow wrapper
  const outputStr =
    result?.outputs?.[0]?.open_ai?.output ??
    result?.open_ai?.output ??
    result?.raw?.outputs?.[0]?.open_ai?.output

  if (!outputStr) return null

  try {
    const parsed = JSON.parse(outputStr)
    return parsed
  } catch {
    // 혹시 output이 이미 객체 형태인데 string이 아닌 경우 대비
    if (typeof outputStr === 'object' && outputStr?.tbm_info) return outputStr
    return null
  }
}

function todayKR() {
  return new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function Chip({ children }) {
  return <span style={ui.chip}>{children}</span>
}

function Label({ children, required }) {
  return (
    <div style={ui.labelRow}>
      <div style={ui.label}>
        {children}
        {required ? <span style={ui.req}>*</span> : null}
      </div>
    </div>
  )
}

function Field({ children }) {
  return <div style={ui.field}>{children}</div>
}

function Segmented({ value, onChange, options }) {
  return (
    <div style={ui.segmented}>
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{ ...ui.segBtn, ...(active ? ui.segBtnActive : {}) }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function Select({ value, onChange, options, compact }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...ui.select, ...(compact ? ui.selectCompact : {}) }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function SignatureModal({ open, title, onClose, onSave }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const last = useRef({ x: 0, y: 0 })

  const clear = () => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, c.width, c.height)
  }

  const getPos = (e) => {
    const c = canvasRef.current
    const r = c.getBoundingClientRect()
    const x = (e.clientX ?? (e.touches?.[0]?.clientX || 0)) - r.left
    const y = (e.clientY ?? (e.touches?.[0]?.clientY || 0)) - r.top
    return { x, y }
  }

  const start = (e) => {
    const c = canvasRef.current
    if (!c) return
    drawing.current = true
    const p = getPos(e)
    last.current = p
  }

  const move = (e) => {
    if (!drawing.current) return
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    const p = getPos(e)
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#111'
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
  }

  const end = () => {
    drawing.current = false
  }

  const save = () => {
    const c = canvasRef.current
    if (!c) return
    const dataUrl = c.toDataURL('image/png')
    onSave?.(dataUrl)
    onClose?.()
  }

  useEffect(() => {
    if (!open) return
    const c = canvasRef.current
    if (!c) return
    // 고해상도 대응
    const ratio = Math.max(1, Math.floor(window.devicePixelRatio || 1))
    const w = 320
    const h = 220
    c.width = w * ratio
    c.height = h * ratio
    c.style.width = w + 'px'
    c.style.height = h + 'px'
    const ctx = c.getContext('2d')
    ctx.scale(ratio, ratio)
    ctx.clearRect(0, 0, w, h)
  }, [open])

  if (!open) return null

  return createPortal(
    <div style={ui.modalOverlay} onMouseDown={onClose}>
      <div style={ui.modalPanel} onMouseDown={(e) => e.stopPropagation()}>
        <div style={ui.modalHeader}>
          <div style={ui.modalTitle}>{title || '서명'}</div>
          <button type="button" onClick={onClose} style={ui.iconBtn}>
            ✕
          </button>
        </div>

        <div style={ui.modalBody}>
          <div style={ui.signHint}>여기에 서명해주십시오.</div>

          <div style={ui.canvasWrap}>
            <canvas
              ref={canvasRef}
              onMouseDown={start}
              onMouseMove={move}
              onMouseUp={end}
              onMouseLeave={end}
              onTouchStart={(e) => {
                e.preventDefault()
                start(e)
              }}
              onTouchMove={(e) => {
                e.preventDefault()
                move(e)
              }}
              onTouchEnd={(e) => {
                e.preventDefault()
                end(e)
              }}
              style={ui.canvas}
            />
          </div>

          <div style={ui.modalActions}>
            <button type="button" onClick={clear} style={ui.btnGhost}>
              지우기
            </button>
            <button type="button" onClick={save} style={ui.btnPrimary}>
              서명저장
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function TbmResultPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  // state.result: Roboflow 응답 (또는 TBM JSON)
  // state.imageUrl: 촬영/업로드 이미지 URL
  // state.workname / state.descript (선택)
  const result = state?.result
  const imageUrl = state?.imageUrl

  useEffect(() => {
    if (!result) navigate('/')
  }, [result, navigate])
  if (!result) return null

  const tbm = useMemo(() => parseRoboflowTbm(result), [result])

 const workName = state?.workname ||  ''
const descript = state?.descript || ''
  const analysisBasis = tbm?.tbm_info?.analysis_basis || ''

  const rawChecklist = Array.isArray(tbm?.tbm_checklist) ? tbm.tbm_checklist : []

  const [responses, setResponses] = useState(() =>
    rawChecklist.map(() => '예')
  )

  useEffect(() => {
    setResponses(rawChecklist.map(() => '예'))
  }, [rawChecklist.length])

  const setResponse = (idx, v) => {
    setResponses((prev) => {
      const next = [...prev]
      next[idx] = v
      return next
    })
  }

  // 교육/출석/참석자(샘플 UI: 실제로는 귀사 데이터로 치환)
  const [eduApplied, setEduApplied] = useState('예')
  const [eduCourse, setEduCourse] = useState(() => ('TBM 안전보건교육'))
  const [attendanceMode, setAttendanceMode] = useState('전자서명') // 전자서명 | QR

  const [participants, setParticipants] = useState([
    { id: 'p1', dept: '안전관리팀', name: '이보건', sign: null },
    { id: 'p2', dept: '안전관리팀', name: '박건강', sign: null },
  ])

  const [signModal, setSignModal] = useState({ open: false, pid: null })

  const openSign = (pid) => setSignModal({ open: true, pid })
  const closeSign = () => setSignModal({ open: false, pid: null })

  const saveSign = (dataUrl) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === signModal.pid ? { ...p, sign: dataUrl } : p))
    )
  }

  const submit = () => {
    // 실제 저장 payload 예시 (귀사 API로 POST)
    const payload = {
      tbm_info: {
        work_name: workName,
        description: descript,
        date: todayKR(),
        analysis_basis: analysisBasis,
      },
      checklist: rawChecklist.map((q, i) => ({
        id: q.id ?? i + 1,
        checkpoint_question: q.checkpoint_question ?? '',
        answer: responses[i] ?? '예',
      })),
      education: {
        applied: eduApplied,
        course: eduCourse,
        attendance_mode: attendanceMode,
      },
      participants: participants.map((p, idx) => ({
        no: idx + 1,
        dept: p.dept,
        name: p.name,
        signed: !!p.sign,
        signature_data_url: p.sign,
      })),
    }

    console.log('[TBM SAVE PAYLOAD]', payload)
    alert('저장 페이로드를 콘솔에 출력했습니다.')
  }

  return (
    <div style={ui.page}>
      {/* Top Bar */}
      <div style={{ ...ui.nav, ...(isMobile ? ui.navMobile : {}) }}>
  
  <button type="button" onClick={() => navigate(-1)} style={ui.navBtn}>
    ❮
  </button>

  <div style={ui.navTitle}>TBM 일지 등록</div>

  <div style={ui.navRight}>
    {/* <button type="button" onClick={submit} style={ui.navSave}>
      저장
    </button> */}

    <button
      type="button"
      onClick={() => navigate(-1)}
      style={ui.navClose}
    >
      ✕
    </button>
  </div>

</div>

      <div style={{ ...ui.wrap, ...(isMobile ? ui.wrapMobile : {}) }}>
        {/* LEFT: TBM Checklist */}
        <div style={ui.card}>
          <div style={ui.cardHeader}>
            <div>
              <div style={ui.cardKicker}>안전점검</div>
              <div style={ui.cardTitle}>
         
              </div>
            </div>
            <div style={ui.cardHeaderRight}>
              <Chip>{todayKR()}</Chip>
            </div>
          </div>

          {/* 이미지(선택) */}
          {imageUrl ? (
            <div style={ui.photoWrap}>
              <img src={imageUrl} alt="현장사진" style={ui.photo} />
              <div style={ui.photoCaption}>
                이미지 기반 분석 포함
                {analysisBasis ? ` · 근거: ${analysisBasis}` : ''}
              </div>
            </div>
          ) : (
            <div style={ui.note}>
              {analysisBasis ? `분석 근거: ${analysisBasis}` : '이미지 없이 TBM 질문만 표시합니다.'}
            </div>
          )}

          {/* TBM 체크리스트 표 */}
          <div style={ui.tableWrap}>
            <table style={ui.table}>
              <thead>
                <tr>
                  <th style={{ ...ui.th, width: 56, textAlign: 'center' }}>번호</th>
                  <th style={ui.th}>점검항목</th>
                  <th style={{ ...ui.th, width: 120, textAlign: 'center' }}>응답</th>
                </tr>
              </thead>
              <tbody>
                {rawChecklist.length ? (
                  rawChecklist.map((row, idx) => (
                    <tr key={row.id ?? idx} style={idx % 2 ? ui.trAlt : null}>
                      <td style={{ ...ui.td, textAlign: 'center', color: '#555', fontFamily: 'monospace' }}>
                        {row.id ?? idx + 1}
                      </td>
                      <td style={ui.td}>
                        <div style={ui.qText}>{row.checkpoint_question || '—'}</div>
                      </td>
                      <td style={{ ...ui.td, textAlign: 'center' }}>
                        <Select
                          value={responses[idx] ?? '예'}
                          onChange={(v) => setResponse(idx, v)}
                          compact
                          options={[
                            { value: '예', label: '예' },
                            { value: '아니오', label: '아니오' },
                            { value: '해당없음', label: '해당없음' },
                          ]}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td style={{ ...ui.td, textAlign: 'center', color: '#888' }} colSpan={3}>
                      TBM 점검항목이 없습니다. (API 응답을 확인해주십시오.)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Education / Attendance / Signature */}
        <div style={ui.side}>
          <div style={ui.card}>
            <div style={ui.cardHeader}>
              <div>
                <div style={ui.cardKicker}>교육/출석</div>
                <div style={ui.cardTitle}>TBM 교육 및 참석 확인</div>
              </div>
            </div>

            <div style={ui.formGrid}>
              <div>
                <Label required>교육시간 반영여부</Label>
                <Field>
                  <Segmented
                    value={eduApplied}
                    onChange={setEduApplied}
                    options={[
                      { value: '예', label: '예' },
                      { value: '아니오', label: '아니오' },
                    ]}
                  />
                </Field>
              </div>

              <div>
                <Label required>교육과정</Label>
                <Field>
                  <input
                    value={eduCourse}
                    onChange={(e) => setEduCourse(e.target.value)}
                    placeholder="예: 대설 대비 안전보건교육"
                    style={ui.input}
                  />
                </Field>
              </div>

              <div>
                <Label required>출석방식</Label>
                <Field>
                  <Segmented
                    value={attendanceMode}
                    onChange={setAttendanceMode}
                    options={[
                      { value: '전자서명', label: '전자서명' },
                      { value: 'QR', label: 'QR' },
                    ]}
                  />
                </Field>
              </div>

              <div>
                <Label required>참석자</Label>
                <Field>
                  <div style={ui.partList}>
                    <table style={ui.partTable}>
                      <thead>
                        <tr>
                          <th style={{ ...ui.th, width: 46, textAlign: 'center' }}>번호</th>
                          <th style={ui.th}>부서</th>
                          <th style={ui.th}>이름</th>
                          <th style={{ ...ui.th, width: 86, textAlign: 'center' }}>전자서명</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map((p, idx) => (
                          <tr key={p.id} style={idx % 2 ? ui.trAlt : null}>
                            <td style={{ ...ui.td, textAlign: 'center', color: '#555', fontFamily: 'monospace' }}>
                              {idx + 1}
                            </td>
                            <td style={ui.td}>{p.dept}</td>
                            <td style={ui.td}>{p.name}</td>
                            <td style={{ ...ui.td, textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => openSign(p.id)}
                                style={ui.linkBtn}
                              >
                                {p.sign ? '서명완료' : '서명전'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div style={ui.saveRow}>
                      <button type="button" onClick={submit} style={ui.btnPrimary}>
                        저장
                      </button>
                    </div>
                  </div>
                </Field>
              </div>
            </div>
          </div>

          {/* TBM 상세(하단 표 UI 느낌) */}
          <div style={ui.card}>
            <div style={ui.cardHeader}>
              <div>
                <div style={ui.cardKicker}>기록</div>
                <div style={ui.cardTitle}>TBM 일지 정보</div>
              </div>
            </div>

            <table style={ui.metaTable}>
              <tbody>
                <tr>
                  <td style={ui.metaTh}>현장</td>
                  <td style={ui.metaTd}>—</td>
                </tr>
                <tr>
                  <td style={ui.metaTh}>TBM일시</td>
                  <td style={ui.metaTd}>{todayKR()}</td>
                </tr>
                <tr>
                  <td style={ui.metaTh}>진행시간</td>
                  <td style={ui.metaTd}>10분</td>
                </tr>
                <tr>
                  <td style={ui.metaTh}>작업명</td>
                  <td style={ui.metaTd}>{workName || '—'}</td>
                </tr>
                <tr>
                  <td style={ui.metaTh}>작업설명</td>
                  <td style={ui.metaTd}>{descript || '—'}</td>
                </tr>
                <tr>
                  <td style={ui.metaTh}>비고</td>
                  <td style={ui.metaTd}>개인보호구 착용상태 확인(안전모/장갑/안전화 등)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SignatureModal
        open={signModal.open}
        title="TBM 전자서명"
        onClose={closeSign}
        onSave={saveSign}
      />

      {/* 서명 미리보기(옵션) */}
      <AnimatePresence>
        {signModal.open ? null : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={ui.footerHint}
          >
            ※ TBM 체크리스트 응답/서명은 현장 기록 용도로 저장됩니다.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const ui = {
  page: {
    minHeight: '100dvh',
    background: '#f4f6f8',
    fontFamily: "'Noto Sans KR','Malgun Gothic','Apple SD Gothic Neo',sans-serif",
  },

  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: '#ffffff',
    borderBottom: '1px solid rgba(0,0,0,0.08)',
  },
  navMobile: { padding: '10px 12px' },
  navBtn: {
    border: 'none',
    background: 'transparent',
    fontSize: 18,
    cursor: 'pointer',
    padding: '6px 8px',
    borderRadius: 10,
  },
  navTitle: { fontSize: 14, fontWeight: 800, color: '#111', flex: 1 },
  navRight: { display: 'flex', alignItems: 'center', gap: 8 },
  navSave: {
    border: '1px solid rgba(0,0,0,0.12)',
    background: '#fff',
    padding: '7px 10px',
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
  },

  wrap: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr',
    gap: 14,
    padding: 14,
    maxWidth: 1100,
    margin: '0 auto',
  },
  wrapMobile: { gridTemplateColumns: '1fr', padding: 12 },

  side: { display: 'flex', flexDirection: 'column', gap: 14 },

  card: {
    background: '#fff',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
  },
  cardHeader: {
    padding: '12px 12px 10px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    borderBottom: '1px solid rgba(0,0,0,0.06)',
  },
  cardHeaderRight: { display: 'flex', alignItems: 'center', gap: 8 },
  cardKicker: { fontSize: 12, fontWeight: 800, color: '#111' },
  cardTitle: { marginTop: 2, fontSize: 13, color: '#666', fontWeight: 700 },

  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderRadius: 999,
    border: '1px solid rgba(0,0,0,0.08)',
    background: '#fafafa',
    fontSize: 12,
    color: '#333',
    fontWeight: 800,
  },

  photoWrap: { padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' },
  photo: {
    width: '100%',
    maxHeight: 280,
    objectFit: 'contain',
    borderRadius: 12,
    border: '1px solid rgba(0,0,0,0.08)',
    background: '#f7f7f7',
  },
  photoCaption: { marginTop: 8, fontSize: 12, color: '#777', lineHeight: 1.4 },

  note: { padding: 12, fontSize: 12, color: '#666', lineHeight: 1.5 },

  tableWrap: { padding: 12 },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    overflow: 'hidden',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 12,
  },
  th: {
    background: '#f5f6f7',
    padding: '10px 10px',
    fontSize: 12,
    fontWeight: 900,
    color: '#333',
    borderBottom: '1px solid rgba(0,0,0,0.08)',
    textAlign: 'left',
  },
  td: {
    padding: '10px 10px',
    fontSize: 12,
    color: '#111',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    verticalAlign: 'top',
  },
  trAlt: { background: '#fcfcfd' },
  qText: { lineHeight: 1.45, color: '#111', fontWeight: 700 },

  select: {
    width: '100%',
    height: 34,
    borderRadius: 10,
    border: '1px solid rgba(0,0,0,0.12)',
    padding: '0 10px',
    fontSize: 12,
    background: '#fff',
  },
  selectCompact: { width: 96, height: 32 },

  formGrid: { padding: 12, display: 'grid', gap: 12 },
  labelRow: { marginBottom: 6 },
  label: { fontSize: 12, fontWeight: 900, color: '#111' },
  req: { marginLeft: 4, color: '#d63031', fontWeight: 900 },

  field: {},
  input: {
    width: '100%',
    height: 36,
    borderRadius: 10,
    border: '1px solid rgba(0,0,0,0.12)',
    padding: '0 12px',
    fontSize: 12,
    outline: 'none',
  },

  segmented: {
    display: 'inline-flex',
    borderRadius: 12,
    border: '1px solid rgba(0,0,0,0.12)',
    overflow: 'hidden',
  },
  segBtn: {
    border: 'none',
    background: '#fff',
    padding: '8px 12px',
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 900,
    color: '#333',
  },
  segBtnActive: { background: '#111', color: '#fff' },

  partList: {
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 12,
    overflow: 'hidden',
    background: '#fff',
  },
  partTable: { width: '100%', borderCollapse: 'separate', borderSpacing: 0 },
  linkBtn: {
    border: 'none',
    background: 'transparent',
    color: '#2563eb',
    fontWeight: 900,
    cursor: 'pointer',
    padding: 0,
    fontSize: 12,
    textDecoration: 'underline',
  },
  saveRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: 10,
    borderTop: '1px solid rgba(0,0,0,0.06)',
    background: '#fafafa',
  },

  btnPrimary: {
    border: 'none',
    background: '#111',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 900,
    cursor: 'pointer',
  },

  metaTable: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
  },
  metaTh: {
    width: 92,
    padding: '10px 12px',
    fontSize: 12,
    fontWeight: 900,
    color: '#333',
    background: '#f5f6f7',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
  },
  metaTd: {
    padding: '10px 12px',
    fontSize: 12,
    color: '#111',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    lineHeight: 1.45,
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  modalPanel: {
    width: 'min(420px, 96vw)',
    background: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 18px 60px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    padding: '12px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(0,0,0,0.08)',
  },
  modalTitle: { fontSize: 13, fontWeight: 900, color: '#111' },
  iconBtn: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 16,
    padding: '6px 10px',
    borderRadius: 10,
  },
  modalBody: { padding: 12 },
  signHint: { fontSize: 12, color: '#666', marginBottom: 10, fontWeight: 800 },

  canvasWrap: {
    border: '1px solid rgba(0,0,0,0.12)',
    borderRadius: 14,
    background: '#fff',
    padding: 10,
    display: 'flex',
    justifyContent: 'center',
  },
  canvas: {
    borderRadius: 10,
    background: '#fff',
    touchAction: 'none',
  },

  modalActions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  btnGhost: {
    border: '1px solid rgba(0,0,0,0.14)',
    background: '#fff',
    color: '#111',
    padding: '10px 12px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 900,
    cursor: 'pointer',
    flex: 1,
  },

  footerHint: {
    padding: '10px 14px 18px',
    fontSize: 11,
    color: '#777',
    textAlign: 'center',
  },
}