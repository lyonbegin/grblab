// PetitionTab.jsx
import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const FONT = "'Noto Sans KR','Malgun Gothic',sans-serif"
const SERIF = "'Nanum Myeongjo','Noto Sans KR',serif"

// ─── 입력 검증 유틸 ──────────────────────────────────────────────────────────
// 한글 이름: 완성형 한글(가-힣) 2~6자, 가운데 공백 1회 허용
const HANGUL_NAME = /^[가-힣]{2,6}(\s[가-힣]{1,6})?$/
function onlyHangul(v) {
  // 한글 자모/완성형만 남김 (영문/숫자/특수문자 제거, 공백 1개 허용)
  return v.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣ\s]/g, '').replace(/\s{2,}/g, ' ')
}
function isHangulName(v) {
  return HANGUL_NAME.test(v.trim())
}

// 휴대폰: 숫자만, 010으로 시작하는 11자리
function onlyDigits(v) {
  return v.replace(/\D/g, '')
}
function formatPhone(d) {
  // 숫자만 받아 010-1234-5678 형태로 (표시는 하이픈, 검증/전송은 숫자)
  const n = onlyDigits(d).slice(0, 11)
  if (n.length < 4) return n
  if (n.length < 8) return n.slice(0, 3) + '-' + n.slice(3)
  return n.slice(0, 3) + '-' + n.slice(3, 7) + '-' + n.slice(7)
}
function isPhone(v) {
  return /^010\d{8}$/.test(onlyDigits(v))
}

// 주민등록번호: 형식 + 생년월일 + 체크섬(검증식)까지
function onlyRrn(v) {
  return v.replace(/\D/g, '').slice(0, 13)
}
function formatRrn(d) {
  const n = onlyRrn(d)
  return n.length <= 6 ? n : n.slice(0, 6) + '-' + n.slice(6)
}
function isValidRRN(v) {
  const n = onlyRrn(v)
  if (!/^\d{13}$/.test(n)) return false
  // 생년월일 유효성
  const yy = +n.slice(0, 2), mm = +n.slice(2, 4), dd = +n.slice(4, 6)
  const g = +n[6]
  if (g < 1 || g > 8) return false           // 성별/세기 코드 1~8 (9,0=1800년대 제외)
  const century = (g === 1 || g === 2 || g === 5 || g === 6) ? 1900 : 2000
  const year = century + yy
  if (mm < 1 || mm > 12) return false
  const last = new Date(year, mm, 0).getDate()
  if (dd < 1 || dd > last) return false
  // 체크섬 (외국인 포함 표준 가중치식)
  const w = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5]
  let sum = 0
  for (let i = 0; i < 12; i++) sum += +n[i] * w[i]
  const check = (11 - (sum % 11)) % 10
  return check === +n[12]
}
const C = {
  green: '#00704A', greenDark: '#005C3C',
  yellow: '#1E3932', yellowText: '#ffffff',
  cream: '#D4E9E2',
  serif: '#1E3932', serifSoft: '#4A6741',
  steel: '#00704A', steelDark: '#005C3C',
  ink: '#1E1E1E', inkSoft: '#4A4A4A',
  hair: '#C8D8D0',
  live: '#00A862',
}

// ─── 카운트업 훅 (run=false면 대기, from=시작값) ────────────────────────────
function useCountUp(target, duration = 700, run = true, from = 0) {
  const [display, setDisplay] = useState(from)
  const rafRef = useRef(0)
  useEffect(() => {
    if (!run) return
    // 항상 from(=목표-3)에서 출발해 target까지 — 3단계 애니메이션만
    const begin = from
    setDisplay(begin)               // 0이 보이지 않게 시작값 즉시 반영
    const start = performance.now()
    const ease = t => 1 - Math.pow(1 - t, 3)
    const tick = now => {
      const p = Math.min((now - start) / duration, 1)
      setDisplay(Math.round(begin + (target - begin) * ease(p)))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration, run, from])
  return display
}

// ─── 완료 오버레이 (체크 ✓ + 실제 총계 카운트업) ────────────────────────────
function DoneOverlay({ total, onClose }) {
  const [run, setRun] = useState(false)
  const [checkDone, setCheckDone] = useState(false)
  const count = useCountUp(total, 700, run, Math.max(0, total - 3))

  // 체크가 그려진 뒤 실제 총계까지 카운트업 시작 (가짜 증가 없음)
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
        background: 'rgba(10,12,10,0.82)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT, padding: 24,
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
        {/* 체크 원 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
            <motion.circle
              cx="48" cy="48" r="44"
              fill={C.green}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 18, stiffness: 300, delay: 0.05 }}
            />
            <motion.path
              d="M28 50 L42 64 L68 34"
              stroke="#fff"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.3 }}
              onAnimationComplete={() => setCheckDone(true)}
            />
          </svg>
        </div>

        <div style={{ fontSize: 22, fontWeight: 900, color: C.ink, letterSpacing: '-0.5px', marginBottom: 8 }}>
          서명이 완료되었습니다
        </div>
        <div style={{ fontSize: 14.5, color: C.inkSoft, lineHeight: 1.7, marginBottom: 32 }}>
          청원에 동참해 주셔서 감사합니다.<br />
          여러분의 서명이 변화를 만듭니다.
        </div>

        {/* 카운터 — 실제 총계 */}
        <div style={{
          background: '#f5f9f1',
          border: `1.5px solid ${C.green}33`,
          borderRadius: 14,
          padding: '18px 0',
          marginBottom: 28,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.greenDark, letterSpacing: '0.1em', marginBottom: 4 }}>
            현재 총 서명 인원
          </div>
          <div style={{ fontSize: 48, fontWeight: 900, color: C.green, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {count.toLocaleString()}<span style={{ fontSize: 22, fontWeight: 800 }}>명</span>
          </div>
          {checkDone && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: 12.5, color: C.live, fontWeight: 700, marginTop: 6 }}
            >
              ▲ 내 서명 반영됨
            </motion.div>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '15px', border: 'none', borderRadius: 12,
            background: C.green, color: '#fff', fontSize: 16, fontWeight: 800,
            fontFamily: FONT, cursor: 'pointer', letterSpacing: '-0.3px',
          }}
        >
          확인
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── 3단계 서명 시트 ────────────────────────────────────────────────────────
const sheetSt = {
  root: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(20,18,14,0.55)',
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
  grip: { width: 40, height: 4, borderRadius: 99, background: '#dcd7cd', margin: '0 auto 18px' },
  stepLabel: { fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', color: C.greenDark, marginBottom: 6 },
  title: { fontSize: 19, fontWeight: 900, color: C.ink, letterSpacing: '-0.4px', marginBottom: 6 },
  desc: { fontSize: 13.5, color: C.inkSoft, lineHeight: 1.65, marginBottom: 26 },
  label: { fontSize: 12.5, fontWeight: 700, color: C.inkSoft, marginBottom: 7, display: 'block' },
  input: {
    width: '100%', boxSizing: 'border-box',
    padding: '16px 18px', border: `1.5px solid ${C.hair}`,
    borderRadius: 12, fontSize: 18, fontFamily: FONT,
    color: C.ink, outline: 'none', background: '#faf8f3',
    marginBottom: 20,
  },
  nextBtn: {
    width: '100%', padding: '17px', border: 'none', borderRadius: 13,
    fontSize: 17, fontWeight: 900, fontFamily: FONT,
    cursor: 'pointer', letterSpacing: '-0.4px', transition: 'background 0.15s',
  },
  disabledBtn: { background: '#d8d4c9', color: '#aaa7a0', cursor: 'not-allowed' },
  activeBtn: { background: C.green, color: '#fff' },
}

function SegmentBtn({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1, padding: '14px 0',
        border: active ? `2px solid ${C.green}` : `2px solid ${C.hair}`,
        borderRadius: 12,
        background: active ? '#f0f7e8' : '#faf8f3',
        color: active ? C.greenDark : C.inkSoft,
        fontSize: 16, fontWeight: active ? 800 : 600,
        fontFamily: FONT, cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {active ? '✓ ' : ''}{label}
    </button>
  )
}

function SignOverlay({ onDone, onClose }) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [disabled, setDisabled] = useState(false) // true = 비장애인
  const [regNum, setRegNum] = useState('')
  const [idNum, setIdNum] = useState('')

  const step1ok = name.trim().length > 0
  const step2ok = isPhone(phone)
  // 비장애인은 통과 / 장애인은 등록번호(4자+) 또는 '유효한' 주민번호
  const rrnFilled = onlyRrn(idNum).length > 0
  const rrnOk = !rrnFilled || isValidRRN(idNum)            // 입력했다면 반드시 유효
  const step3ok = disabled
    ? true
    : (regNum.trim().length >= 4 || (rrnFilled && isValidRRN(idNum)))

  const goNext = () => setStep(s => s + 1)
  const handleDone = () => {
    onDone({ name: name.trim(), phone: phone.trim(), disabled, regNum: regNum.trim(), idNum: idNum.trim() })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={sheetSt.root}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        style={sheetSt.sheet}
        onClick={e => e.stopPropagation()}
      >
        <div style={sheetSt.grip} />

        <div style={{ display: 'flex', gap: 5, marginBottom: 22 }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{
              flex: 1, height: 4, borderRadius: 99,
              background: n <= step ? C.green : C.hair,
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
                <input
                  value={name}
                  autoComplete="name"
                  onChange={e => setName(e.target.value)}
                  placeholder="이름"
                  style={{ ...sheetSt.input, marginBottom: 0, flex: 1 }}
                />
                <button
                  type="button"
                  style={{ ...sheetSt.nextBtn, width: 76, flexShrink: 0, padding: '0', ...(step1ok ? sheetSt.activeBtn : sheetSt.disabledBtn) }}
                  disabled={!step1ok}
                  onClick={goNext}
                >
                  다음
                </button>
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
                <input
                  style={{ ...sheetSt.input, marginBottom: 0, flex: 1 }}
                  value={phone}
                  inputMode="numeric"
                  maxLength={13}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  placeholder="숫자만 입력 (010…)"
                />
                <button
                  type="button"
                  style={{ ...sheetSt.nextBtn, width: 76, flexShrink: 0, padding: '0', ...(step2ok ? sheetSt.activeBtn : sheetSt.disabledBtn) }}
                  disabled={!step2ok}
                  onClick={goNext}
                >
                  다음
                </button>
              </div>
              {onlyDigits(phone).length > 0 && !step2ok && (
                <p style={{ fontSize: 12, color: '#d9534f', margin: '8px 2px 0', fontWeight: 600 }}>
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
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <label style={sheetSt.label}>장애인 등록번호</label>
                    <input
                      style={{ ...sheetSt.input }}
                      value={regNum}
                      onChange={e => setRegNum(e.target.value)}
                      placeholder="등록번호 입력"
                    />
                    <div style={{ textAlign: 'center', fontSize: 13, color: C.serifSoft, fontWeight: 700, margin: '0 0 14px' }}>또는</div>
                    <label style={sheetSt.label}>주민등록번호</label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
                      <input
                        style={{ ...sheetSt.input, marginBottom: 0, flex: 1 }}
                        value={idNum}
                        inputMode="numeric"
                        maxLength={14}
                        onChange={e => setIdNum(formatRrn(e.target.value))}
                        placeholder="000000-0000000"
                      />
                      <button
                        type="button"
                        style={{ ...sheetSt.nextBtn, width: 76, flexShrink: 0, padding: '0', ...(step3ok ? sheetSt.activeBtn : sheetSt.disabledBtn) }}
                        disabled={!step3ok}
                        onClick={handleDone}
                      >
                        완료
                      </button>
                    </div>
                    {onlyRrn(idNum).length === 13 && !isValidRRN(idNum) && (
                      <p style={{ fontSize: 12, color: '#d9534f', margin: '8px 2px 0', fontWeight: 600 }}>
                        올바른 주민등록번호가 아닙니다. 다시 입력해 주세요.
                      </p>
                    )}
                    <p style={{ fontSize: 12, color: C.serifSoft, lineHeight: 1.65, margin: '10px 0 0' }}>
                      장애인 등록번호를 모르실 경우 주민번호를 기입하시면 됩니다.<br />
                      장애인 혜택 적용을 위해 필요합니다.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {disabled && (
                <button
                  type="button"
                  style={{ ...sheetSt.nextBtn, ...(step3ok ? sheetSt.activeBtn : sheetSt.disabledBtn) }}
                  disabled={!step3ok}
                  onClick={handleDone}
                >
                  완료
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ─── Live 카운터 (실제 baseCount만 표시, 페이크 증가 제거) ───────────────────
function LiveCounter({ baseCount = 0, variant = 'float' }) {
  const count = baseCount   // 처음 접속 시 애니메이션 없이 최종값 그대로 표시
  const isInline = variant === 'inline'
  const wrap = isInline
    ? { position: 'relative', width: '100%', marginBottom: 22 }
    : { position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)', zIndex: 4, minWidth: 248 }
  return (
    <div style={wrap}>
      <div style={{ background: 'rgba(18,16,12,0.42)', backdropFilter: 'blur(9px)', WebkitBackdropFilter: 'blur(9px)', border: '1px solid rgba(255,255,255,0.24)', borderRadius: 16, padding: isInline ? '16px 18px' : '20px 24px', boxShadow: '0 12px 40px rgba(0,0,0,0.32)', fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ position: 'relative', width: 8, height: 8 }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.live }} />
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.live, animation: 'petPulse 1.8s ease-out infinite' }} />
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.82)' }}>LIVE · 실시간 청원 현황</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, marginBottom: 2 }}>현재</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: isInline ? 40 : 50, fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px' }}>{count.toLocaleString()}</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>명</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13.5, marginTop: 6 }}>이 서명에 동참하고 있습니다</div>
      </div>
    </div>
  )
}

function Ph({ label, style }) {
  return (
    <div style={{ position: 'relative', background: 'repeating-linear-gradient(45deg,#e9e6df,#e9e6df 12px,#e2ded6 12px,#e2ded6 24px),#e9e6df', color: '#9b9486', fontSize: 12, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden', fontFamily: FONT, ...style }}>
      <span style={{ background: 'rgba(255,255,255,0.78)', padding: '4px 10px', borderRadius: 2, fontWeight: 500 }}>{label}</span>
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

// ─── 디바이스 식별 (localStorage UUID + 핑거프린트) ──────────────────────────
function getDeviceId() {
  try {
    let id = localStorage.getItem('petition_device_id')
    if (!id) {
      id = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
      localStorage.setItem('petition_device_id', id)
    }
    return id
  } catch {
    // localStorage 불가(시크릿 등) 시 임시값
    return 'nostore-' + Math.random().toString(36).slice(2, 10)
  }
}

// 저장 안 해도 비슷하게 재현되는 보조 식별값 (16자리)
function getFingerprint() {
  try {
    const cv = document.createElement('canvas')
    const gl = cv.getContext('webgl') || cv.getContext('experimental-webgl')
    const dbg = gl && gl.getExtension('WEBGL_debug_renderer_info')
    const gpu = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : ''
    const parts = [
      navigator.userAgent, navigator.language,
      screen.width + 'x' + screen.height, screen.colorDepth,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.hardwareConcurrency || '', navigator.deviceMemory || '',
      gpu,
    ].join('|')
    // 동기 32-bit 해시 (FNV-1a) → 8 hex
    let h = 0x811c9dc5
    for (let i = 0; i < parts.length; i++) {
      h ^= parts.charCodeAt(i)
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
    }
    return h.toString(16).padStart(8, '0')
  } catch {
    return '00000000'
  }
}

// 모바일/PC 구분 (참고용 태그)
function getPlatformTag() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'm' : 'p'
}

const API = 'https://backend-production-6b41.up.railway.app'

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
export default function PetitionTab({ isMobile, loading, LoadingUI, onGoSign }) {
  const navigate = useNavigate()
  const [signOpen, setSignOpen] = useState(false)
  const [doneOpen, setDoneOpen] = useState(false)
  const [liveCount, setLiveCount] = useState(0)
  const [submitError, setSubmitError] = useState(null)

  // 마운트 시 실제 카운트 조회
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

    // 1) 응답을 기다리지 않고 즉시 화면 반영 (이전 총계 + 1)
    setLiveCount(c => c + 1)
    setSignOpen(false)
    setDoneOpen(true)

    // 2) DB 저장은 백그라운드로 비동기 처리 (fire-and-forget)
    fetch(`${API}/api/petition/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // DB 스키마 변경 불가 → name 필드에 식별값을 함께 실어 보냄
        // 형식: 이름::::디바이스ID::::핑거프린트::::플랫폼(m/p)  (서버에서 name.split('::::'))
        name: `${form.name}::::${getDeviceId()}::::${getFingerprint()}::::${getPlatformTag()}`,
        phone: onlyDigits(form.phone),            // 하이픈 제거, 숫자만 전송
        is_disabled: !form.disabled,
        reg_num: form.regNum || null,
        id_num: form.idNum ? onlyRrn(form.idNum) : null,  // 숫자 13자리만 전송
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (res.status === 409) {
          // 이미 서명한 사람 → 낙관적 +1 되돌림
          setLiveCount(c => Math.max(0, c - 1))
          setSubmitError('이미 서명하셨습니다')
          return
        }
        if (!res.ok) throw new Error(data.detail || '서버 오류')
        // 서버가 실제 총계를 주면 그 값으로 보정
        if (typeof data.total_count === 'number') setLiveCount(data.total_count)
      })
      .catch(() => {
        // 저장 실패 → 낙관적 +1 되돌림 + 안내
        setLiveCount(c => Math.max(0, c - 1))
        setSubmitError('서명 저장에 실패했습니다. 다시 시도해 주세요.')
      })
  }, [])

  const handleDoneClose = useCallback(() => {
    setDoneOpen(false)
  }, [])

  const COL = isMobile ? '100%' : 860

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=Nanum+Myeongjo:wght@400;700;800&display=swap');
        @keyframes petPulse { 0%{transform:scale(1);opacity:0.9} 70%{transform:scale(2.6);opacity:0} 100%{opacity:0} }
      `}</style>

      {/* 서명 3단계 시트 */}
      <AnimatePresence>
        {signOpen && <SignOverlay onDone={handleDone} onClose={() => setSignOpen(false)} />}
      </AnimatePresence>

      {/* 완료 오버레이 — 실제 총계 */}
      <AnimatePresence>
        {doneOpen && <DoneOverlay total={liveCount} onClose={handleDoneClose} />}
      </AnimatePresence>

      {/* 토스트 */}
      <AnimatePresence>
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            onAnimationComplete={() => setTimeout(() => setSubmitError(null), 2500)}
            style={{
              position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
              background: '#2f2f2f', color: '#fff', borderRadius: 12,
              padding: '14px 24px', fontSize: 14, fontWeight: 700,
              fontFamily: FONT, zIndex: 20000, whiteSpace: 'nowrap',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}
          >
            {submitError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 상단 서명 버튼 ── */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: isMobile ? '20px 20px 16px' : '32px 40px 24px', fontFamily: FONT, boxSizing: 'border-box' }}>
        <div style={{ width: '100%', maxWidth: isMobile ? '100%' : 640 }}>
          {loading ? LoadingUI : (
            <button type="button" onClick={goSign}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: isMobile ? '15px 24px' : '17px 32px', background: C.yellow, color: C.yellowText, border: 'none', borderRadius: 12, fontSize: isMobile ? 16 : 18, fontWeight: 800, fontFamily: FONT, letterSpacing: '-0.5px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(250,225,0,0.35)', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(250,225,0,0.45)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(250,225,0,0.35)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.yellowText} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
              청원 서명 참여하기
            </button>
          )}
        </div>
      </div>

      {/* ── 본문 ── */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', fontFamily: FONT }}>
        <div style={{ width: '100%', maxWidth: COL, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>

          <div style={{ position: 'relative', minHeight: isMobile ? 460 : 520, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg,#d8cdbf 0%,#c9bdac 40%,#b9ac99 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(40,33,25,0.66) 0%,rgba(40,33,25,0.40) 52%,rgba(40,33,25,0.12) 88%)' }} />
            {/* <span style={{ position: 'absolute', right: 16, bottom: 14, background: 'rgba(255,255,255,0.7)', color: '#8b8474', fontSize: 11, padding: '4px 10px', borderRadius: 2, zIndex: 2 }}>이미지 자리 (Hero)</span> */}
            {!isMobile && <LiveCounter baseCount={liveCount} variant="float" />}
            <div style={{ position: 'relative', zIndex: 3, padding: isMobile ? '28px 24px' : '0 48px', width: isMobile ? '100%' : 'auto' }}>
              {isMobile && <LiveCounter baseCount={liveCount} variant="inline" />}
              <div style={{ color: '#f4ead4', fontSize: 13, marginBottom: 18, opacity: 0.95 }}>장애인 의료비 부담 경감·재활치료 접근권 보장 청원</div>
              <h1 style={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? 28 : 42, lineHeight: 1.33, letterSpacing: '-0.01em', textShadow: '0 2px 18px rgba(0,0,0,0.25)', margin: 0 }}>치료받을 권리가<br />비용과 횟수에<br />막혀서는 안 됩니다</h1>
              <p style={{ marginTop: 20, color: '#f2efe9', fontSize: 14.5, lineHeight: 1.85, fontWeight: 300, maxWidth: 440 }}>
                <span style={{ display: 'block', color: '#e9d9b6', fontSize: 13, marginBottom: 6 }}>청원인 (가칭) 부산의료복지사회적협동조합 및 조합원 일동</span>
                장애인은 더 자주, 더 오래 치료받아야 하지만,<br />본인부담은 비장애인과 다르지 않습니다.
              </p>
              <button onClick={goSign} style={{ marginTop: 26, display: 'inline-flex', alignItems: 'center', gap: 36, background: C.yellow, border: 'none', borderRadius: 4, padding: '12px 22px', fontSize: 14, fontWeight: 800, color: C.yellowText, cursor: 'pointer', fontFamily: FONT }}>
                서명하기 <span style={{ fontSize: 16 }}>→</span>
              </button>
            </div>
          </div>

          <div style={{ background: '#fff', padding: isMobile ? '48px 24px 40px' : '60px 40px 52px' }}>
            <div style={{ maxWidth: 660, margin: '0 auto', textAlign: 'center' }}>
              <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', color: C.greenDark, border: '1px solid ' + C.green, borderRadius: 999, padding: '4px 14px', marginBottom: 18 }}>청원 취지</span>
              <p style={{ fontSize: 15, color: C.inkSoft, lineHeight: 1.95, margin: 0 }}>장애인은 진료·재활·검진 등 의료 수요가 비장애인보다 크지만, 의료비 본인부담은 거의 같거나 오히려 더 무겁습니다. 특히 재활치료와 치과 진료 영역에서 제도가 장애인에게 불리하게 작동하고 있습니다. 이에 장애인 당사자들이 조합 단체로서, 의료비 부담 경감과 의료 접근권 보장을 위한 법·제도 개선을 청원합니다.</p>
              <div style={{ marginTop: 18, fontSize: 12.5, color: '#9a9a9a' }}>청원 대상 · 국회 / 보건복지부 / 부산광역시</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', background: C.cream }}>
            {/* <Ph label="이미지 자리 (현장 사진)" style={{ minHeight: isMobile ? 240 : 520, order: isMobile ? -1 : 0 }} /> */}
            <div style={{ padding: isMobile ? '40px 24px' : '60px 48px' }}>
              <h2 style={{ fontFamily: SERIF, color: C.serif, fontWeight: 800, fontSize: isMobile ? 23 : 26, lineHeight: 1.42, margin: '0 0 24px' }}>장애라는 이유로<br />줄어들지 않는 의료비 부담</h2>
              {REASONS.map(([h, b], i) => (<p key={i} style={{ color: C.serif, fontSize: 14, lineHeight: 1.95, margin: '0 0 16px' }}><b style={{ fontWeight: 700, color: '#5f5446' }}>{h}</b> {b}</p>))}
              {/* <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
                <Ph label="사진" style={{ width: 92, height: 64, borderRadius: 3 }} />
                <Ph label="사진" style={{ width: 92, height: 64, borderRadius: 3 }} />
                <Ph label="사진" style={{ width: 92, height: 64, borderRadius: 3 }} />
              </div> */}
              <p style={{ marginTop: 22, fontSize: 11.5, lineHeight: 1.7, color: C.serifSoft }}>* 도수치료 관리급여 본인부담률·횟수 제한은 2026년 7월 시행 기준이며, 의학적 사유에 따라 연 24회까지 적용됩니다.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', background: '#fff' }}>
            <div style={{ padding: isMobile ? '40px 24px' : '64px 48px' }}>
              <h2 style={{ color: C.steel, fontWeight: 700, fontSize: isMobile ? 22 : 25, lineHeight: 1.42, margin: '0 0 26px' }}>치료받을 권리를<br />비용이 막지 않도록</h2>
              {ASKS.map(([h, b], i) => (
                <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
                  <div style={{ flex: '0 0 26px', height: 26, borderRadius: '50%', background: C.steel, color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>{i + 1}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.85, color: '#4a4a4a' }}><b style={{ color: C.steelDark, fontWeight: 700 }}>{h}</b> — {b}</div>
                </div>
              ))}
            </div>
            {/* <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1.4fr 1fr', gap: 6, minHeight: isMobile ? 300 : 'auto' }}>
              <Ph label="이미지 자리 (대표 사진)" style={{ gridColumn: '1 / 3', height: '100%' }} />
              <Ph label="사진" style={{ height: '100%' }} />
              <Ph label="사진" style={{ height: '100%' }} />
            </div> */}
          </div>

          <div style={{ background: C.cream, padding: isMobile ? '44px 24px 52px' : '60px 40px 68px', textAlign: 'center' }}>
            <p style={{ fontFamily: SERIF, color: C.serif, fontSize: isMobile ? 20 : 24, fontWeight: 800, lineHeight: 1.45, margin: '0 0 24px' }}>치료받을 권리가 비용과 횟수에<br />막혀서는 안 됩니다</p>
            <button onClick={goSign}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', maxWidth: 440, padding: isMobile ? '18px 28px' : '20px 40px', background: C.green, color: '#fff', border: 'none', borderRadius: 14, fontSize: isMobile ? 17 : 20, fontWeight: 800, fontFamily: FONT, letterSpacing: '-0.4px', cursor: 'pointer', boxShadow: '0 8px 28px rgba(121,176,67,0.40)', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(121,176,67,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(121,176,67,0.4)' }}>
              서명 페이지로 이동 <span style={{ fontSize: 20 }}>→</span>
            </button>
            <p style={{ marginTop: 16, fontSize: 13, color: C.inkSoft, lineHeight: 1.7 }}>위 청원이 입법과 정책에 반영될 수 있도록 시민 여러분의 동참을 청원합니다.</p>
          </div>

        </div>
      </div>
    </>
  )
}