// PetitionTab.jsx
import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const FONT = "'Noto Sans KR','Malgun Gothic',sans-serif"
const SERIF = "'Nanum Myeongjo','Noto Sans KR',serif"

const HANGUL_NAME = /^[가-힣]{2,6}(\s[가-힣]{1,6})?$/
function onlyDigits(v) { return v.replace(/\D/g, '') }
function formatPhone(d) {
  const n = onlyDigits(d).slice(0, 11)
  if (n.length < 4) return n
  if (n.length < 8) return n.slice(0, 3) + '-' + n.slice(3)
  return n.slice(0, 3) + '-' + n.slice(3, 7) + '-' + n.slice(7)
}
function isPhone(v) { return /^010\d{8}$/.test(onlyDigits(v)) }
function onlyRrn(v) { return v.replace(/\D/g, '').slice(0, 13) }
function formatRrn(d) {
  const n = onlyRrn(d)
  return n.length <= 6 ? n : n.slice(0, 6) + '-' + n.slice(6)
}
function isValidRRN(v) {
  const n = onlyRrn(v)
  if (!/^\d{13}$/.test(n)) return false
  const mm = +n.slice(2, 4), dd = +n.slice(4, 6), g = +n[6]
  if (g < 1 || g > 8) return false
  const century = (g === 1 || g === 2 || g === 5 || g === 6) ? 1900 : 2000
  const year = century + +n.slice(0, 2)
  if (mm < 1 || mm > 12) return false
  if (dd < 1 || dd > new Date(year, mm, 0).getDate()) return false
  const w = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5]
  let sum = 0
  for (let i = 0; i < 12; i++) sum += +n[i] * w[i]
  return ((11 - (sum % 11)) % 10) === +n[12]
}

// ─── 컬러 토큰 (네이비 + 옐로 + 레드 경고 톤) ────────────────────────────────
const C = {
  navy: '#16215C',
  navyDark: '#0E1640',
  navySoft: '#283875',
  yellow: '#FFD400',
  yellowDeep: '#F5B700',
  red: '#E63946',
  redSoft: '#FDEAEC',
  cream: '#F4F5FA',
  ink: '#16182B',
  inkSoft: '#54577A',
  hair: '#D9DBEC',
  live: '#22C55E',
  white: '#ffffff',
}

function useCountUp(target, duration = 700, run = true, from = 0) {
  const [display, setDisplay] = useState(from)
  const rafRef = useRef(0)
  useEffect(() => {
    if (!run) return
    setDisplay(from)
    const start = performance.now()
    const ease = t => 1 - Math.pow(1 - t, 3)
    const tick = now => {
      const p = Math.min((now - start) / duration, 1)
      setDisplay(Math.round(from + (target - from) * ease(p)))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration, run, from])
  return display
}

// ─── 완료 오버레이 ───────────────────────────────────────────────────────────
function DoneOverlay({ total, onClose, couponReady }) {
  const [run, setRun] = useState(false)
  const [checkDone, setCheckDone] = useState(false)
  const count = useCountUp(total, 700, run, Math.max(0, total - 3))

  useEffect(() => {
    const t = setTimeout(() => setRun(true), 650)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(10,12,24,0.82)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT, padding: 24,
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 24,
          padding: '48px 36px 40px',
          maxWidth: 360,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
        }}
      >
        {/* 체크 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
            <motion.circle cx="48" cy="48" r="44" fill={C.navy}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 18, stiffness: 300, delay: 0.05 }} />
            <motion.path d="M28 50 L42 64 L68 34" stroke={C.yellow} strokeWidth="6"
              strokeLinecap="round" strokeLinejoin="round" fill="none"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.3 }}
              onAnimationComplete={() => setCheckDone(true)} />
          </svg>
        </div>

        <div style={{ fontSize: 22, fontWeight: 900, color: C.ink, letterSpacing: '-0.5px', marginBottom: 8 }}>
          서명이 완료되었습니다
        </div>
        <div style={{ fontSize: 14.5, color: C.inkSoft, lineHeight: 1.7, marginBottom: 28 }}>
          청원에 동참해 주셔서 감사합니다.<br />
          여러분의 서명이 변화를 만듭니다.
        </div>

        {/* 카운터 */}
        <div style={{
          background: C.navy, borderRadius: 14, padding: '18px 0', marginBottom: 20,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.1em', marginBottom: 4 }}>
            현재 총 서명 인원
          </div>
          <div style={{ fontSize: 48, fontWeight: 900, color: C.yellow, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {count.toLocaleString()}<span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>명</span>
          </div>
          {checkDone && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: 12.5, color: C.live, fontWeight: 700, marginTop: 6 }}>
              ▲ 내 서명 반영됨
            </motion.div>
          )}
        </div>

        {/* 감사 쿠폰 - 서버 응답 후 슬라이드업 */}
        <AnimatePresence>
          {couponReady && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              style={{
                background: `linear-gradient(135deg, ${C.navyDark} 0%, ${C.navy} 100%)`,
                borderRadius: 16,
                padding: '20px 22px',
                marginBottom: 20,
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* 배경 장식 원 */}
              <div style={{
                position: 'absolute', right: -20, top: -20,
                width: 100, height: 100, borderRadius: '50%',
                background: 'rgba(255,212,0,0.08)',
              }} />
              <div style={{
                position: 'absolute', right: 20, bottom: -30,
                width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(255,212,0,0.05)',
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'rgba(255,212,0,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, flexShrink: 0,
                }}>
                  ☕
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.yellow, letterSpacing: '0.1em', marginBottom: 3 }}>
                    서명 감사 선물
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>
                    스타벅스 아메리카노
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 }}>
                    입력하신 번호로 문자 발송됩니다
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: 14,
                borderTop: '1px solid rgba(255,255,255,0.15)',
                paddingTop: 12,
                fontSize: 11.5, color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.6,
              }}>
                * 쿠폰은 영업일 기준 3일 이내 발송됩니다.<br />
                * 선착순 소진 시 조기 마감될 수 있습니다.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '15px', border: 'none', borderRadius: 12,
            background: C.navy, color: '#fff', fontSize: 16, fontWeight: 800,
            fontFamily: FONT, cursor: 'pointer', letterSpacing: '-0.3px',
          }}
        >
          확인
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── 3단계 서명 시트 ─────────────────────────────────────────────────────────
const sheetSt = {
  root: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(14,16,30,0.6)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    fontFamily: FONT,
  },
  sheet: {
    width: '100%', maxWidth: 460,
    background: '#fff',
    borderRadius: '22px 22px 0 0',
    padding: '20px 24px max(env(safe-area-inset-bottom),28px)',
    boxShadow: '0 -12px 48px rgba(0,0,0,0.28)',
    boxSizing: 'border-box',
  },
  grip: { width: 40, height: 4, borderRadius: 99, background: '#dcdcec', margin: '0 auto 18px' },
  stepLabel: { fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', color: C.navy, marginBottom: 6 },
  title: { fontSize: 19, fontWeight: 900, color: C.ink, letterSpacing: '-0.4px', marginBottom: 6 },
  desc: { fontSize: 13.5, color: C.inkSoft, lineHeight: 1.65, marginBottom: 26 },
  label: { fontSize: 12.5, fontWeight: 700, color: C.inkSoft, marginBottom: 7, display: 'block' },
  input: {
    width: '100%', boxSizing: 'border-box',
    padding: '16px 18px', border: `1.5px solid ${C.hair}`,
    borderRadius: 12, fontSize: 18, fontFamily: FONT,
    color: C.ink, outline: 'none', background: C.cream,
    marginBottom: 20,
  },
  nextBtn: {
    width: '100%', padding: '17px', border: 'none', borderRadius: 13,
    fontSize: 17, fontWeight: 900, fontFamily: FONT,
    cursor: 'pointer', letterSpacing: '-0.4px', transition: 'background 0.15s',
  },
  disabledBtn: { background: '#e2e3ef', color: '#a4a6c0', cursor: 'not-allowed' },
  activeBtn: { background: C.navy, color: C.yellow },
}

function SegmentBtn({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      flex: 1, padding: '14px 0',
      border: active ? `2px solid ${C.navy}` : `2px solid ${C.hair}`,
      borderRadius: 12,
      background: active ? C.navy : C.cream,
      color: active ? C.yellow : C.inkSoft,
      fontSize: 16, fontWeight: active ? 800 : 600,
      fontFamily: FONT, cursor: 'pointer', transition: 'all 0.15s',
    }}>
      {active ? '✓ ' : ''}{label}
    </button>
  )
}

function SignOverlay({ onDone, onClose }) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [disabled, setDisabled] = useState(false)
  const [regNum, setRegNum] = useState('')
  const [idNum, setIdNum] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const step1ok = name.trim().length > 0
  const step2ok = isPhone(phone)
  const rrnFilled = onlyRrn(idNum).length > 0
  const step3ok = disabled ? true : (regNum.trim().length >= 4 || (rrnFilled && isValidRRN(idNum)))

  const goNext = () => setStep(s => s + 1)
  const handleDone = () => {
    if (submitted) return
    setSubmitted(true)
    onDone({ name: name.trim(), phone: phone.trim(), disabled, regNum: regNum.trim(), idNum: idNum.trim() })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={sheetSt.root} onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        style={sheetSt.sheet} onClick={e => e.stopPropagation()}>
        <div style={sheetSt.grip} />

        <div style={{ display: 'flex', gap: 5, marginBottom: 22 }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{
              flex: 1, height: 4, borderRadius: 99,
              background: n <= step ? C.navy : C.hair,
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
              <div style={sheetSt.stepLabel}>STEP 1 / 3</div>
              <div style={sheetSt.title}>청원 서명 참여</div>
              <div style={sheetSt.desc}>
                이 청원은 <b style={{ color: C.ink }}>(가칭) 부산의료복지사회적협동조합</b> 이름으로 진행합니다.<br />
                조합 설립과 청원에 동의합니다.
              </div>
              <label style={sheetSt.label}>이름</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
                <input value={name} autoComplete="name"
                  onChange={e => setName(e.target.value)} placeholder="이름"
                  style={{ ...sheetSt.input, marginBottom: 0, flex: 1 }} />
                <button type="button"
                  style={{ ...sheetSt.nextBtn, width: 76, flexShrink: 0, padding: '0', ...(step1ok ? sheetSt.activeBtn : sheetSt.disabledBtn) }}
                  disabled={!step1ok} onClick={goNext}>다음</button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
              <div style={sheetSt.stepLabel}>STEP 2 / 3</div>
              <div style={sheetSt.title}>연락처</div>
              <div style={sheetSt.desc}>서명 확인을 위해 휴대폰 번호를 입력해 주세요.</div>
              <label style={sheetSt.label}>휴대폰 번호</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
                <input style={{ ...sheetSt.input, marginBottom: 0, flex: 1 }}
                  value={phone} inputMode="numeric" maxLength={13}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  placeholder="숫자만 입력 (010…)" />
                <button type="button"
                  style={{ ...sheetSt.nextBtn, width: 76, flexShrink: 0, padding: '0', ...(step2ok ? sheetSt.activeBtn : sheetSt.disabledBtn) }}
                  disabled={!step2ok} onClick={goNext}>다음</button>
              </div>
              {onlyDigits(phone).length > 0 && !step2ok && (
                <p style={{ fontSize: 12, color: C.red, margin: '8px 2px 0', fontWeight: 600 }}>
                  010으로 시작하는 11자리 숫자를 입력해 주세요.
                </p>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
              <div style={sheetSt.stepLabel}>STEP 3 / 3</div>
              <div style={sheetSt.title}>장애 여부 선택</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                <SegmentBtn label="장애인" active={!disabled} onClick={() => setDisabled(false)} />
                <SegmentBtn label="비장애인" active={disabled} onClick={() => setDisabled(true)} />
              </div>

              <AnimatePresence>
                {!disabled && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                    <label style={sheetSt.label}>장애인 등록번호</label>
                    <input style={{ ...sheetSt.input }} value={regNum}
                      onChange={e => setRegNum(e.target.value)} placeholder="등록번호 입력" />
                    <div style={{ textAlign: 'center', fontSize: 13, color: C.navySoft, fontWeight: 700, margin: '0 0 14px' }}>또는</div>
                    <label style={sheetSt.label}>주민등록번호</label>
                    <input style={{ ...sheetSt.input }}
                      value={idNum} inputMode="numeric" maxLength={14}
                      onChange={e => setIdNum(formatRrn(e.target.value))}
                      placeholder="000000-0000000" />
                    {onlyRrn(idNum).length === 13 && !isValidRRN(idNum) && (
                      <p style={{ fontSize: 12, color: C.red, margin: '-12px 2px 12px', fontWeight: 600 }}>
                        올바른 주민등록번호가 아닙니다.
                      </p>
                    )}
                    <p style={{ fontSize: 12, color: C.navySoft, lineHeight: 1.65, margin: '0 0 16px' }}>
                      장애인 등록번호를 모르실 경우 주민번호를 기입하시면 됩니다.<br />
                      장애인 혜택 적용을 위해 필요합니다.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 완료 버튼 — 항상 하나만 */}
              <button type="button"
                style={{ ...sheetSt.nextBtn, ...(step3ok && !submitted ? sheetSt.activeBtn : sheetSt.disabledBtn) }}
                disabled={!step3ok || submitted}
                onClick={handleDone}>
                완료
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ─── Live 카운터 ─────────────────────────────────────────────────────────────
function LiveCounter({ baseCount = 0, variant = 'float' }) {
  const isInline = variant === 'inline'
  const wrap = isInline
    ? { position: 'relative', width: '100%', marginBottom: 22 }
    : { position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)', zIndex: 4, minWidth: 248 }
  return (
    <div style={wrap}>
      <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(9px)', WebkitBackdropFilter: 'blur(9px)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 16, padding: isInline ? '16px 18px' : '20px 24px', boxShadow: '0 12px 40px rgba(0,0,0,0.32)', fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ position: 'relative', width: 8, height: 8 }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.yellow }} />
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.yellow, animation: 'petPulse 1.8s ease-out infinite' }} />
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.82)' }}>LIVE · 실시간 청원 현황</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, marginBottom: 2 }}>현재</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: isInline ? 40 : 50, fontWeight: 900, color: C.yellow, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px' }}>{baseCount.toLocaleString()}</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>명</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13.5, marginTop: 6 }}>이 서명에 동참하고 있습니다</div>
      </div>
    </div>
  )
}

const REASONS = [
  ['첫째, 장애인 의료비 부담이 비장애인과 다르지 않습니다.', '장애인이라는 이유로 본인부담이 줄어드는 경우는 제한적입니다. 정작 장애로 인해 더 자주, 더 오래 치료받아야 하는 현실은 반영되지 못하고 있습니다.'],
  ['둘째, 재활치료가 비용과 횟수에 가로막혀 있습니다.', '대표적 재활인 도수치료는 그동안 비급여로 1회 약 10만 원을 전액 본인이 부담해 왔습니다. 2026년 7월 관리급여로 편입되었으나, 본인부담률이 95%에 이르고 연 15회(의학적 사유 시 24회)로 횟수가 제한됩니다.'],
  ['셋째, 치과 진료에서 장애인의 부담이 특히 큽니다.', '구강 관리와 치과 치료의 필요가 큰 경우가 많지만, 급여 진료의 본인부담은 물론 임플란트 등 고액 비급여 진료까지 더해져 부담이 가중됩니다. 정작 치료가 더 필요한 장애인이 비용 때문에 치료를 미루게 됩니다.'],
  ['넷째, 이름만 급여인 제도가 장애인에게 불리하게 작동합니다.', '관리급여처럼 명칭은 급여이나 사실상 부담을 환자에게 그대로 떠안기는 제도는, 의료 의존도가 높은 장애인에게 더 큰 부담으로 돌아옵니다.'],
]
const ASKS = [
  ['장애인 의료 본인부담 경감', '진료·재활·검진 등 장애인의 의료 본인부담을 장애 특성에 맞게 경감하는 법적 근거를 마련해 주십시오.'],
  ['재활치료 횟수·부담 제한 완화', '도수치료 등 재활치료의 본인부담률과 연간 횟수 제한을, 재활이 필요한 장애인에게 실질적 치료가 가능한 수준으로 완화해 주십시오.'],
  ['장애인 치과 진료비 지원 법제화', '급여 진료는 물론 임플란트 등 비급여 진료까지 포함하여 치과 의료비를 지원하는 법적 근거를 마련해 주십시오.'],
  ['장애인에게 불리한 제도의 재개정', '관리급여 등 환자 부담을 과도하게 전가하는 제도를 장애인 의료 접근권 관점에서 재검토·개정해 주십시오.'],
]

function getDeviceId() {
  try {
    let id = localStorage.getItem('petition_device_id')
    if (!id) {
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
      localStorage.setItem('petition_device_id', id)
    }
    return id
  } catch { return 'nostore-' + Math.random().toString(36).slice(2, 10) }
}
function getFingerprint() {
  try {
    const parts = [navigator.userAgent, navigator.language, screen.width + 'x' + screen.height, screen.colorDepth, Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.hardwareConcurrency || ''].join('|')
    let h = 0x811c9dc5
    for (let i = 0; i < parts.length; i++) { h ^= parts.charCodeAt(i); h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0 }
    return h.toString(16).padStart(8, '0')
  } catch { return '00000000' }
}
function getPlatformTag() { return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'm' : 'p' }

const API = 'https://backend-production-6b41.up.railway.app'

export default function PetitionTab({ isMobile, loading, LoadingUI, onGoSign }) {
  const navigate = useNavigate()
  const [signOpen, setSignOpen] = useState(false)
  const [doneOpen, setDoneOpen] = useState(false)
  const [liveCount, setLiveCount] = useState(0)
  const [doneCount, setDoneCount] = useState(0)
  const [couponReady, setCouponReady] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    fetch(`${API}/api/petition/count`)
      .then(r => r.json())
      .then(d => setLiveCount(d.total_count))
      .catch(() => {})
  }, [])

  const goSign = useCallback(() => {
    if (typeof onGoSign === 'function') onGoSign()
    else setSignOpen(true)
  }, [onGoSign])

  const handleDone = useCallback((form) => {
    setSubmitError(null)
    setCouponReady(false)
    const snap = liveCount + 1
    setLiveCount(snap)
    setDoneCount(snap)
    setSignOpen(false)
    setDoneOpen(true)

    fetch(`${API}/api/petition/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${form.name}::::${getDeviceId()}::::${getFingerprint()}::::${getPlatformTag()}`,
        phone: onlyDigits(form.phone),
        is_disabled: !form.disabled,
        reg_num: form.regNum || null,
        id_num: form.idNum ? onlyRrn(form.idNum) : null,
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (res.status === 409) {
          setLiveCount(c => Math.max(0, c - 1))
          setSubmitError('이미 서명하셨습니다')
          return
        }
        if (!res.ok) throw new Error(data.detail || '서버 오류')
        if (typeof data.total_count === 'number') {
          setLiveCount(data.total_count)
          setDoneCount(data.total_count)
        }
        setCouponReady(true)   // 서버 응답 성공 시 쿠폰 표시
      })
      .catch(() => {
        setLiveCount(c => Math.max(0, c - 1))
        setSubmitError('서명 저장에 실패했습니다. 다시 시도해 주세요.')
      })
  }, [liveCount])

  const handleDoneClose = useCallback(() => {
    setDoneOpen(false)
    setCouponReady(false)
  }, [])

  const COL = isMobile ? '100%' : 860

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=Nanum+Myeongjo:wght@400;700;800&display=swap');
        @keyframes petPulse { 0%{transform:scale(1);opacity:0.9} 70%{transform:scale(2.6);opacity:0} 100%{opacity:0} }
      `}</style>

      <AnimatePresence>
        {signOpen && <SignOverlay onDone={handleDone} onClose={() => setSignOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {doneOpen && <DoneOverlay total={doneCount} onClose={handleDoneClose} couponReady={couponReady} />}
      </AnimatePresence>
      <AnimatePresence>
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            onAnimationComplete={() => setTimeout(() => setSubmitError(null), 2500)}
            style={{
              position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
              background: C.navyDark, color: '#fff', borderRadius: 12,
              padding: '14px 24px', fontSize: 14, fontWeight: 700,
              fontFamily: FONT, zIndex: 20000, whiteSpace: 'nowrap',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}
          >
            {submitError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 상단 고정형 서명 CTA 바 */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: isMobile ? '20px 20px 16px' : '32px 40px 24px', fontFamily: FONT, boxSizing: 'border-box' }}>
        <div style={{ width: '100%', maxWidth: isMobile ? '100%' : 640 }}>
          {loading ? LoadingUI : (
            <button type="button" onClick={goSign}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: isMobile ? '15px 24px' : '17px 32px', background: C.yellow, color: C.navyDark, border: 'none', borderRadius: 12, fontSize: isMobile ? 16 : 18, fontWeight: 900, fontFamily: FONT, letterSpacing: '-0.5px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,212,0,0.45)', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(255,212,0,0.55)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,212,0,0.45)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.navyDark} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
              청원 서명 참여하기
            </button>
          )}
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', fontFamily: FONT }}>
        <div style={{ width: '100%', maxWidth: COL, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>

          {/* ── 히어로: 네이비 배경 + 옐로 강조 헤드라인 ── */}
          <div style={{ position: 'relative', minHeight: isMobile ? 480 : 540, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${C.navyDark} 0%, ${C.navy} 55%, ${C.navySoft} 100%)` }} />
            {/* 장식: 우상단 옐로 글로우 */}
            <div style={{ position: 'absolute', right: -60, top: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,212,0,0.16) 0%, rgba(255,212,0,0) 70%)' }} />

            {!isMobile && <LiveCounter baseCount={liveCount} variant="float" />}
            <div style={{ position: 'relative', zIndex: 3, padding: isMobile ? '32px 24px' : '0 48px', width: isMobile ? '100%' : 'auto' }}>
              {isMobile && <LiveCounter baseCount={liveCount} variant="inline" />}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,212,0,0.14)', border: '1px solid rgba(255,212,0,0.4)',
                borderRadius: 999, padding: '6px 14px', marginBottom: 20,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.yellow }} />
                <span style={{ color: C.yellow, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.04em' }}>
                  장애인 의료비 부담 경감 · 재활치료 접근권 보장 청원
                </span>
              </div>
              <h1 style={{ color: '#fff', fontWeight: 800, fontSize: isMobile ? 28 : 42, lineHeight: 1.32, letterSpacing: '-0.01em', margin: 0 }}>
                치료받을 권리가<br />
                <span style={{ color: C.yellow }}>비용과 횟수</span>에<br />
                막혀서는 안 됩니다
              </h1>
              <p style={{ marginTop: 22, color: 'rgba(255,255,255,0.78)', fontSize: 14.5, lineHeight: 1.85, fontWeight: 300, maxWidth: 440 }}>
                <span style={{ display: 'block', color: C.yellow, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                  청원인 (가칭) 부산의료복지사회적협동조합 및 조합원 일동
                </span>
                장애인은 더 자주, 더 오래 치료받아야 하지만,<br />본인부담은 비장애인과 다르지 않습니다.
              </p>
              <button onClick={goSign} style={{ marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 10, background: C.yellow, border: 'none', borderRadius: 8, padding: '14px 26px', fontSize: 15, fontWeight: 900, color: C.navyDark, cursor: 'pointer', fontFamily: FONT, letterSpacing: '-0.2px' }}>
                서명하기 <span style={{ fontSize: 17 }}>→</span>
              </button>
            </div>
          </div>

          {/* ── 청원 취지 ── */}
          <div style={{ background: '#fff', padding: isMobile ? '48px 24px 40px' : '60px 40px 52px' }}>
            <div style={{ maxWidth: 660, margin: '0 auto', textAlign: 'center' }}>
              <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', color: C.navy, background: C.cream, border: `1px solid ${C.hair}`, borderRadius: 999, padding: '5px 16px', marginBottom: 20 }}>청원 취지</span>
              <p style={{ fontSize: 15, color: C.inkSoft, lineHeight: 1.95, margin: 0 }}>장애인은 진료·재활·검진 등 의료 수요가 비장애인보다 크지만, 의료비 본인부담은 거의 같거나 오히려 더 무겁습니다. 특히 재활치료와 치과 진료 영역에서 제도가 장애인에게 불리하게 작동하고 있습니다. 이에 장애인 당사자들이 조합 단체로서, 의료비 부담 경감과 의료 접근권 보장을 위한 법·제도 개선을 청원합니다.</p>
              <div style={{ marginTop: 18, fontSize: 12.5, color: '#9a9aab', fontWeight: 600 }}>청원 대상 · 국회 / 보건복지부 / 부산광역시</div>
            </div>
          </div>

          {/* ── 문제 제기: 네이비 카드 + 옐로 넘버 칩 ── */}
          <div style={{ background: C.cream, padding: isMobile ? '40px 24px' : '60px 48px' }}>
            <h2 style={{ fontFamily: SERIF, color: C.navyDark, fontWeight: 800, fontSize: isMobile ? 23 : 27, lineHeight: 1.42, margin: '0 0 28px', textAlign: isMobile ? 'left' : 'left' }}>
              장애라는 이유로<br />줄어들지 않는 의료비 부담
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {REASONS.map(([h, b], i) => (
                <div key={i} style={{
                  background: '#fff', borderRadius: 14, padding: isMobile ? '18px 18px' : '20px 24px',
                  display: 'flex', gap: 16, alignItems: 'flex-start',
                  border: `1px solid ${C.hair}`,
                }}>
                  <div style={{
                    flex: '0 0 30px', height: 30, borderRadius: 8,
                    background: C.navy, color: C.yellow,
                    fontSize: 13, fontWeight: 900, fontFamily: FONT,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: C.ink, fontSize: 14.5, marginBottom: 4, lineHeight: 1.6 }}>{h}</div>
                    <div style={{ color: C.inkSoft, fontSize: 13.5, lineHeight: 1.85 }}>{b}</div>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 18, fontSize: 11.5, lineHeight: 1.7, color: '#9a9aab' }}>* 도수치료 관리급여 본인부담률·횟수 제한은 2026년 7월 시행 기준이며, 의학적 사유에 따라 연 24회까지 적용됩니다.</p>
          </div>

          {/* ── 경고 강조 배너: 레드 ── */}
          <div style={{ background: C.redSoft, padding: isMobile ? '28px 24px' : '32px 48px', display: 'flex', alignItems: 'center', gap: 16, borderTop: `1px solid ${C.hair}`, borderBottom: `1px solid ${C.hair}` }}>
            <div style={{
              flex: '0 0 44px', height: 44, borderRadius: '50%', background: C.red,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: '#fff', fontWeight: 900,
            }}>!</div>
            <div>
              <div style={{ color: C.red, fontWeight: 800, fontSize: isMobile ? 15.5 : 17, marginBottom: 4 }}>
                치료가 더 필요한 사람이 더 큰 비용을 떠안고 있습니다
              </div>
              <div style={{ color: '#8a3a40', fontSize: 13, lineHeight: 1.7 }}>
                제도가 바뀌지 않으면, 같은 부담은 계속 반복됩니다.
              </div>
            </div>
          </div>

          {/* ── 청원 요구사항 ── */}
          <div style={{ background: '#fff', padding: isMobile ? '40px 24px' : '64px 48px' }}>
            <h2 style={{ color: C.navyDark, fontWeight: 800, fontSize: isMobile ? 22 : 25, lineHeight: 1.42, margin: '0 0 28px' }}>치료받을 권리를<br />비용이 막지 않도록</h2>
            {ASKS.map(([h, b], i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
                <div style={{ flex: '0 0 26px', height: 26, borderRadius: '50%', background: C.navy, color: C.yellow, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>{i + 1}</div>
                <div style={{ fontSize: 14, lineHeight: 1.85, color: '#4a4a4a' }}><b style={{ color: C.navyDark, fontWeight: 700 }}>{h}</b> — {b}</div>
              </div>
            ))}
          </div>

          {/* ── 클로징 CTA: 네이비 + 옐로 ── */}
          <div style={{ background: `linear-gradient(135deg, ${C.navyDark} 0%, ${C.navy} 100%)`, padding: isMobile ? '44px 24px 52px' : '60px 40px 68px', textAlign: 'center' }}>
            <p style={{ fontFamily: SERIF, color: '#fff', fontSize: isMobile ? 20 : 24, fontWeight: 800, lineHeight: 1.45, margin: '0 0 24px' }}>
              치료받을 권리가 <span style={{ color: C.yellow }}>비용과 횟수</span>에<br />막혀서는 안 됩니다
            </p>
            <button onClick={goSign}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', maxWidth: 440, padding: isMobile ? '18px 28px' : '20px 40px', background: C.yellow, color: C.navyDark, border: 'none', borderRadius: 14, fontSize: isMobile ? 17 : 20, fontWeight: 900, fontFamily: FONT, letterSpacing: '-0.4px', cursor: 'pointer', boxShadow: '0 8px 28px rgba(255,212,0,0.35)', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(255,212,0,0.45)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(255,212,0,0.35)' }}>
              서명 페이지로 이동 <span style={{ fontSize: 20 }}>→</span>
            </button>
            <p style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>위 청원이 입법과 정책에 반영될 수 있도록 시민 여러분의 동참을 청원합니다.</p>
          </div>

        </div>
      </div>
    </>
  )
}