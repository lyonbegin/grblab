// PetitionTab.jsx
import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import QRCodeLib from 'qrcode'
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


// ─── QR 코드 (qrcode.js via CDN) ────────────────────────────────────────────
// import { useEffect, useRef } from 'react'

function QRCode({ value, size = 180 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !value) return
    QRCodeLib.toCanvas(canvasRef.current, String(value), {
      width: size,
      margin: 2,
      color: { dark: '#111111', light: '#ffffff' },
    })
  }, [value, size])

  return <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 8 }} />
}

// // ─── CODE128 바코드 (외부 라이브러리 없이 SVG로 직접 렌더) ───────────────────
// // 숫자 문자열을 Code C로 인코딩합니다. 휴대폰 카메라/바코드 스캐너로 읽힙니다.
// const C128_PATTERNS = [
//   "11011001100","11001101100","11001100110","10010011000","10010001100","10001001100","10011001000","10011000100","10001100100","11001001000",
//   "11001000100","11000100100","10110011100","10011011100","10011001110","10111001100","10011101100","10011100110","11001110010","11001011100",
//   "11001001110","11011100100","11001110100","11101101110","11101001100","11100101100","11100100110","11101100100","11100110100","11100110010",
//   "11011011000","11011000110","11000110110","10100011000","10001011000","10001000110","10110001000","10001101000","10001100010","11010001000",
//   "11000101000","11000100010","10110111000","10110001110","10001101110","10111011000","10111000110","10001110110","11101110110","11010001110",
//   "11000101110","11011101000","11011100010","11011101110","11101011000","11101000110","11100010110","11101101000","11101100010","11100011010",
//   "11101111010","11001000010","11110001010","10100110000","10100001100","10010110000","10010000110","10000101100","10000100110","10110010000",
//   "10110000100","10011010000","10011000010","10000110100","10000110010","11000010010","11001010000","11110111010","11000010100","10001111010",
//   "10100111100","10010111100","10010011110","10111100100","10011110100","10011110010","11110100100","11110010100","11110010010","11011011110",
//   "11011110110","11110110110","10101111000","10100011110","10001011110","10111101000","10111100010","11110101000","11110100010","10111011110",
//   "10111101110","11101011110","11110101110","11010000100","11010010000","11010011100","11000111010"
// ]
// const C128_STOP = "1100011101011"

// function code128CBits(numStr) {
//   let s = String(numStr == null ? '' : numStr).replace(/\D/g, '')
//   if (s.length === 0) s = '0'
//   if (s.length % 2 !== 0) s = '0' + s // 짝수 자리 보정
//   const START_C = 105
//   const codes = [START_C]
//   for (let i = 0; i < s.length; i += 2) codes.push(parseInt(s.substr(i, 2), 10))
//   let sum = START_C
//   for (let i = 1; i < codes.length; i++) sum += codes[i] * i
//   codes.push(sum % 103) // checksum
//   return codes.map(c => C128_PATTERNS[c]).join('') + C128_STOP
// }

// function Barcode({ value, height = 90, barWidth = 2.4 }) {
//   const bits = code128CBits(value)
//   const width = bits.length * barWidth
//   // 연속된 1을 한 개의 막대(rect)로 묶어 그림
//   const bars = []
//   let x = 0
//   let i = 0
//   while (i < bits.length) {
//     let run = 1
//     while (i + run < bits.length && bits[i + run] === bits[i]) run++
//     if (bits[i] === '1') {
//       bars.push(<rect key={i} x={x} y={0} width={run * barWidth} height={height} fill="#111" />)
//     }
//     x += run * barWidth
//     i += run
//   }
//   return (
//     <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet"
//       style={{ display: 'block' }} shapeRendering="crispEdges">
//       <rect x={0} y={0} width={width} height={height} fill="#fff" />
//       {bars}
//     </svg>
//   )
// }


// ─── 완료 오버레이 ───────────────────────────────────────────────────────────
function DoneOverlay({ total, onClose, couponReady, signatureId, isNew, exchanged }) {
  // 이미 교환완료된 사람이면 카드 대신 안내만, 그 외(신규/미교환)는 바코드 노출
  const showCard = couponReady && !exchanged

  // Web OTP: 담당자가 보낸 인증문자(@grblab.co.kr #코드)를 자동 수신해 표시
  const [otpCode, setOtpCode] = useState(null)
  useEffect(() => {
    if (!showCard) return
    if (!('OTPCredential' in window)) return // 미지원 브라우저(iOS 등)는 그냥 패스
    const ac = new AbortController()
    navigator.credentials.get({
      otp: { transport: ['sms'] },
      signal: ac.signal,
    }).then(otp => {
      if (otp && otp.code) setOtpCode(otp.code)
    }).catch(() => { /* 취소/실패 무시 */ })
    return () => ac.abort()
  }, [showCard])

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
        fontFamily: FONT, padding: 20,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          borderRadius: 22,
          maxWidth: 340,
          width: '100%',
          textAlign: 'center',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* CU 카드 이미지를 모달 전체 배경으로 */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/cu.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
        {/* 가독성용 반투명 남색 오버레이 */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(180deg, rgba(14,22,64,0.86) 0%, rgba(22,33,92,0.92) 45%, rgba(14,22,64,0.96) 100%)`,
        }} />

        {/* 실제 내용 */}
        <div style={{ position: 'relative', padding: '26px 24px 22px' }}>
          {/* 체크 (작게) */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <svg width="56" height="56" viewBox="0 0 96 96" fill="none">
              <motion.circle cx="48" cy="48" r="44" fill={C.yellow}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 18, stiffness: 300, delay: 0.05 }} />
              <motion.path d="M28 50 L42 64 L68 34" stroke={C.navyDark} strokeWidth="7"
                strokeLinecap="round" strokeLinejoin="round" fill="none"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.25 }} />
            </svg>
          </div>

          <div style={{ fontSize: 19, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 4 }}>
            설립동의가 접수되었습니다
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, marginBottom: 14 }}>
            의료복지사회적협동조합 설립에 동의해 주셔서 감사합니다.
          </div>

          {/* CU 카드 이미지 */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <img src="/cu.png" alt="CU 기프트카드"
              style={{ width: 110, height: 'auto', borderRadius: 10, boxShadow: '0 8px 22px rgba(0,0,0,0.4)' }} />
          </div>

          {/* ── 이미 교환됨 안내 ── */}
          {couponReady && exchanged && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 14,
                padding: '18px 16px',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 6 }}>✅</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
                이미 교환이 완료되었습니다
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                기프트카드는 1인 1회만 지급됩니다.
              </div>
            </motion.div>
          )}

          {/* ── 신규/미교환: 바코드 ── */}
          {showCard && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              style={{ marginBottom: 16 }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: C.yellow, letterSpacing: '0.08em', marginBottom: 10 }}>
                설립동의 참여 감사 선물 · CU 모바일 상품권
              </div>
              {/* 바코드 (세로 낮게, 가로 길게) */}
              <div style={{ background: '#fff', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
  <QRCode value={signatureId} size={180} />
  <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, letterSpacing: '0.18em', fontVariantNumeric: 'tabular-nums' }}>
    {String(signatureId)}
  </div>
</div>
<div style={{ marginTop: 12, fontSize: 16, color: '#fff', lineHeight: 1.6, fontWeight: 700, background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
  이 화면을 <b style={{ color: C.yellow, fontSize: 18 }}>담당자</b>에게 보여주세요.
</div>

              {/* Web OTP로 받은 인증번호 자동 표시 */}
              {otpCode && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginTop: 12, background: 'rgba(255,212,0,0.15)',
                    border: `1px solid ${C.yellow}66`, borderRadius: 10, padding: '12px 14px',
                  }}>
                  <div style={{ fontSize: 11, color: C.yellow, fontWeight: 700, marginBottom: 3 }}>받은 인증번호</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '0.2em', fontVariantNumeric: 'tabular-nums' }}>
                    {otpCode}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>
                    담당자에게 이 번호를 확인시켜 주세요.
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
{/* 
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '14px', border: 'none', borderRadius: 12,
              background: C.yellow, color: C.navyDark, fontSize: 15.5, fontWeight: 900,
              fontFamily: FONT, cursor: 'pointer', letterSpacing: '-0.3px',
            }}
          >
            확인
          </button> */}
        </div>
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
    // PC 화면이 짧거나 입력/개인정보 안내가 길어져도 시트 안에서 세로 스크롤 가능
    maxHeight: '100dvh',
    overflowY: 'auto',
    overscrollBehaviorY: 'contain',
    WebkitOverflowScrolling: 'touch',
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
    <button type="button" onClick={onClick}
      onMouseDown={e => e.preventDefault()}
      onTouchStart={e => e.preventDefault()}
      style={{
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

// ─── 청원 전문 모달 ──────────────────────────────────────────────────────────
function PetitionTextModal({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 11000,
        background: 'rgba(10,12,24,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT, padding: 18,
      }}>
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 18, width: '100%', maxWidth: 460,
          maxHeight: '85dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
        }}>
        {/* 헤더 */}
        <div style={{ background: C.navy, padding: '20px 22px', flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.yellow, letterSpacing: '0.06em', marginBottom: 5 }}>
            (가칭) 나눔이음의료복지사회적협동조합 설립동의
          </div>
          <div style={{ fontSize: 16.5, fontWeight: 900, color: '#fff', lineHeight: 1.4, letterSpacing: '-0.3px' }}>
            의료복지사회적협동조합<br />설립 취지 및 설립동의 안내
          </div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', marginTop: 8, lineHeight: 1.6 }}>
            설립 추진: (가칭) 나눔이음의료복지사회적협동조합 발기인회<br />
            대표 추진사업: 장애인 전용 병원 설립
          </div>
        </div>

        {/* 본문 (스크롤) */}
        <div style={{ padding: '22px 22px 8px', overflowY: 'auto', overscrollBehaviorY: 'contain', minHeight: 0, flex: 1 }}>
          <PetitionSection title="설립 취지">
            장애인 당사자의 참여를 바탕으로 의료와 복지서비스를 연계하고, 필요한 서비스를 함께 만들어 갈 새로운 의료복지사회적협동조합을 설립하고자 합니다. 장애인 전용 병원 설립은 조합의 대표적인 추진사업입니다.
          </PetitionSection>

          <PetitionSection title="조합 설립의 필요성">
            <p style={pStyle}><b>첫째, 의료와 복지를 함께 제공할 협동조합이 필요합니다.</b> 의료서비스와 복지서비스를 연계하여 장애인 당사자의 건강과 복지 증진에 기여하고자 합니다.</p>
            <p style={pStyle}><b>둘째, 장애인 당사자의 참여가 중요합니다.</b> 장애인이 단순한 의료서비스 이용자를 넘어 조합 설립과 향후 운영에 참여하는 구조를 만들고자 합니다.</p>
            <p style={pStyle}><b>셋째, 지속적인 의료복지사업을 추진하고자 합니다.</b> 진료·재활·건강검진 등 장애인에게 필요한 의료복지사업을 함께 추진할 기반을 마련하고자 합니다.</p>
            <p style={pStyle}><b>넷째, 장애인이 편리하게 이용할 수 있는 병원이 필요합니다.</b> 조합의 대표적인 추진사업으로 장애인의 진료 편의와 접근성을 고려한 장애인 전용 병원 설립을 계획하고 있습니다.</p>
          </PetitionSection>

          <PetitionSection title="설립 후 주요 추진사업">
            <p style={pStyle}><b>1. 의료복지사회적협동조합 설립</b> — 의료와 복지의 공익적 목적을 수행할 (가칭) 나눔이음의료복지사회적협동조합을 새롭게 설립하고자 합니다.</p>
            <p style={pStyle}><b>2. 장애인 당사자의 조합 참여</b> — 장애인이 조합원으로 참여하고 의견을 제시할 수 있는 협동조합 운영체계를 마련하고자 합니다.</p>
            <p style={pStyle}><b>3. 의료·복지서비스 연계</b> — 진료·건강관리·재활 등 필요한 의료서비스와 복지서비스를 연계하는 사업을 추진하고자 합니다.</p>
            <p style={pStyle}><b>4. 장애인 전용 병원 설립 추진</b> — 조합의 대표적인 추진사업으로 장애인의 진료 편의와 의료 접근성을 고려한 병원 설립을 추진하고자 합니다.</p>
          </PetitionSection>

          <p style={{ ...pStyle, color: C.navy, fontWeight: 700, marginTop: 18, marginBottom: 18 }}>
            본인은 위 설립 취지와 목적을 확인하였으며, (가칭) 나눔이음의료복지사회적협동조합의 설립에 동의합니다.
          </p>
        </div>

        {/* 닫기 */}
        <div style={{ padding: '12px 22px 18px', flexShrink: 0, borderTop: `1px solid ${C.hair}` }}>
          <button type="button" onClick={onClose}
            style={{ width: '100%', padding: 14, border: 'none', borderRadius: 12, background: C.navy, color: '#fff', fontSize: 15.5, fontWeight: 800, fontFamily: FONT, cursor: 'pointer' }}>
            닫기
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

const pStyle = { fontSize: 13, lineHeight: 1.8, color: C.inkSoft, margin: '0 0 12px' }

function PetitionSection({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 900, color: C.navy, marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${C.hair}` }}>
        {title}
      </div>
      {typeof children === 'string'
        ? <p style={pStyle}>{children}</p>
        : children}
    </div>
  )
}

function CheckRow({ checked, onToggle, children }) {
  return (
    <button type="button" onClick={onToggle}
      onMouseDown={e => e.preventDefault()}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%',
        background: 'transparent', border: 'none', padding: 0, margin: 0,
        cursor: 'pointer', textAlign: 'left', fontFamily: FONT,
      }}>
      <span style={{
        flex: '0 0 22px', width: 22, height: 22, borderRadius: 6, marginTop: 1,
        background: checked ? C.navy : '#fff',
        border: `2px solid ${checked ? C.navy : C.hair}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {checked && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.yellow} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 L9 17 L4 12" />
          </svg>
        )}
      </span>
      <span style={{ flex: 1, fontSize: 13, lineHeight: 1.55, color: C.ink }}>{children}</span>
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

  // 동의 체크박스
  const [agreeCampaign, setAgreeCampaign] = useState(true)   // 조합설립·청원 동의 (디폴트 ON)
  const [agreePrivacy, setAgreePrivacy] = useState(false)    // 개인정보 수집·이용 (디폴트 OFF)
  const [privacyOpen, setPrivacyOpen] = useState(false)      // 개인정보 상세 펼침
  const [petitionOpen, setPetitionOpen] = useState(false)    // 청원 전문 모달

  // STEP1: 이름 + 전화번호 + 청원 동의 체크
  const step1ok = name.trim().length > 0 && isPhone(phone) && agreeCampaign
  // STEP2: 장애인 본인확인 정보 입력 (비장애인은 참여 불가)
  const rrnFilled = onlyRrn(idNum).length > 0
  const idInfoOk = regNum.trim().length >= 4 || (rrnFilled && isValidRRN(idNum))
  // 장애인이고(=!disabled) + 본인확인 정보 + 개인정보 동의가 있어야 완료 가능
  const step2ok = !disabled && idInfoOk && agreePrivacy

  // STEP1 → STEP2 전환 시점에만 키보드가 한 번 내려갑니다(장애여부는 입력칸이 아니라 선택).
  const goNext = () => {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur()
    }
    setStep(2)
  }

  const handleDone = () => {
    if (submitted) return
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur()
    }
    setSubmitted(true)
    onDone({ name: name.trim(), phone: phone.trim(), disabled, regNum: regNum.trim(), idNum: idNum.trim() })
  }

  return (
    <>
    <AnimatePresence>
      {petitionOpen && <PetitionTextModal onClose={() => setPetitionOpen(false)} />}
    </AnimatePresence>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={sheetSt.root} onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        style={sheetSt.sheet} onClick={e => e.stopPropagation()}>
        <div style={sheetSt.grip} />

        {/* 진행바 2칸 */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 22 }}>
          {[1, 2].map(n => (
            <div key={n} style={{
              flex: 1, height: 4, borderRadius: 99,
              background: n <= step ? C.navy : C.hair,
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* 두 스텝 모두 항상 마운트, display로만 전환 (input 재생성 없음) */}

        {/* STEP 1 — 이름 + 전화번호 한 화면 */}
        <div style={{ display: step === 1 ? 'block' : 'none' }}>
          <div style={sheetSt.stepLabel}>STEP 1 / 2</div>
          <div style={sheetSt.title}>의료복지사회적협동조합 설립동의</div>

          {/* 조합설립·청원 동의 체크 */}
          <div style={{ background: C.cream, borderRadius: 12, padding: '14px 16px', marginBottom: 22 }}>
            <CheckRow checked={agreeCampaign} onToggle={() => setAgreeCampaign(v => !v)}>
              본인은 <b style={{ color: C.navy }}>(가칭) 나눔이음의료복지사회적협동조합</b>의 설립 취지와 목적을 확인하였으며, 해당 의료복지사회적협동조합의 설립에 동의합니다.
            </CheckRow>
            <button type="button"
              onClick={() => setPetitionOpen(true)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: C.navy, fontSize: 12.5, fontWeight: 700, fontFamily: FONT,
                marginTop: 10, marginLeft: 32, padding: 0, textDecoration: 'underline',
              }}>
              설립 취지 및 동의 내용 보기
            </button>
          </div>

          <label style={sheetSt.label}>이름</label>
          <input value={name} type="text" lang="ko" autoComplete="off"
            onChange={e => setName(e.target.value)} placeholder="이름"
            style={{ ...sheetSt.input }} />

          <label style={sheetSt.label}>휴대폰 번호</label>
          <input style={{ ...sheetSt.input, marginBottom: 8 }}
            value={phone} inputMode="numeric" maxLength={13}
            onChange={e => setPhone(formatPhone(e.target.value))}
            placeholder="숫자만 입력 (010…)" />
          {onlyDigits(phone).length > 0 && !isPhone(phone) && (
            <p style={{ fontSize: 12, color: C.red, margin: '0 2px 14px', fontWeight: 600 }}>
              010으로 시작하는 11자리 숫자를 입력해 주세요.
            </p>
          )}

          <button type="button"
            style={{ ...sheetSt.nextBtn, marginTop: 12, ...(step1ok ? sheetSt.activeBtn : sheetSt.disabledBtn) }}
            disabled={!step1ok} onClick={goNext}>다음</button>
        </div>

        {/* STEP 2 — 장애 여부 + 완료 */}
        <div style={{ display: step === 2 ? 'block' : 'none' }}>
          <div style={sheetSt.stepLabel}>STEP 2 / 2</div>
          <div style={sheetSt.title}>설립동의자 정보 확인</div>
          <div style={{ ...sheetSt.desc, marginBottom: 18 }}>
            의료복지사회적협동조합 신규 설립을 위한 설립동의자 확인 절차입니다. 현재 장애인 당사자의 설립동의를 모집하고 있으며, 본인확인을 위해 문서확인번호 또는 주민등록번호를 입력해 주세요.
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <SegmentBtn label="장애인" active={!disabled} onClick={() => setDisabled(false)} />
            <SegmentBtn label="비장애인" active={disabled} onClick={() => setDisabled(true)} />
          </div>

          {/* 비장애인 선택 시 안내 (참여 불가) */}
          <div style={{ display: disabled ? 'block' : 'none' }}>
            <div style={{
              background: C.cream, border: `1px solid ${C.hair}`, borderRadius: 12,
              padding: '18px 16px', marginBottom: 20, textAlign: 'center',
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.navy, marginBottom: 6 }}>
                현재 장애인 당사자의 설립동의를 모집하고 있습니다
              </div>
              <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.7 }}>
                이번 모집은 장애인 당사자를 대상으로 하는<br />
                의료복지사회적협동조합 신규 설립동의 절차입니다.
              </div>
            </div>
          </div>

          {/* 장애인 선택 시 본인확인 입력 */}
          <div style={{ display: disabled ? 'none' : 'block' }}>
            <label style={sheetSt.label}>장애인증명서 문서확인번호(12자리)</label>
            <input style={{ ...sheetSt.input }}
              value={regNum}
              onChange={e => setRegNum(e.target.value)} placeholder="문서확인번호 입력" />
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
            <p style={{ fontSize: 12, color: C.navySoft, lineHeight: 1.65, margin: '0 0 18px' }}>
              문서확인번호를 모르실 경우 주민등록번호를 입력하시면 됩니다.<br />
              설립동의자 본인확인을 위해 사용됩니다.
            </p>

            {/* 개인정보 수집·이용 동의 */}
            <div style={{ background: C.cream, borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
              <CheckRow checked={agreePrivacy} onToggle={() => setAgreePrivacy(v => !v)}>
                <b style={{ color: C.navy }}>[필수]</b> 개인정보 수집·이용에 동의합니다.
              </CheckRow>
              <button type="button"
                onClick={() => setPrivacyOpen(v => !v)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: C.navySoft, fontSize: 12, fontWeight: 700, fontFamily: FONT,
                  marginTop: 8, marginLeft: 32, padding: 0, textDecoration: 'underline',
                }}>
                {privacyOpen ? '접기' : '펼쳐보기'}
              </button>
              {privacyOpen && (
                <div style={{ marginTop: 10, marginLeft: 32, fontSize: 11.5, color: C.inkSoft, lineHeight: 1.75 }}>
                  · 수집 항목: 이름, 휴대폰 번호, 장애 여부, 장애인증명서 문서확인번호 또는 주민등록번호<br />
                  · 수집 목적: 의료복지사회적협동조합 설립동의 접수 및 본인확인, 장애인 여부 확인, 기프트카드 지급<br />
                  · 보유 기간: 설립 관련 업무 종료 및 기프트카드 지급 완료 후 6개월 이내 파기
                </div>
              )}
            </div>
          </div>

          {/* 완료 버튼 — 항상 하나만 */}
          <button type="button"
            style={{ ...sheetSt.nextBtn, ...(step2ok && !submitted ? sheetSt.activeBtn : sheetSt.disabledBtn) }}
            disabled={!step2ok || submitted}
            onClick={handleDone}>
            완료
          </button>
        </div>
      </motion.div>
    </motion.div>
    </>
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
          <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.82)' }}>LIVE · 설립동의 참여 현황</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, marginBottom: 2 }}>현재</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: isInline ? 40 : 50, fontWeight: 900, color: C.yellow, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px' }}>{baseCount.toLocaleString()}</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>명</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13.5, marginTop: 6 }}>의료복지사회적협동조합 설립에 동참하고 있습니다</div>
      </div>
    </div>
  )
}

const REASONS = [
  ['첫째, 의료와 복지를 함께 제공할 협동조합이 필요합니다.', '의료서비스와 복지서비스를 연계하여 장애인 당사자의 건강과 복지 증진에 기여하고자 합니다.'],
  ['둘째, 장애인 당사자의 참여가 중요합니다.', '장애인이 단순한 의료서비스 이용자를 넘어 조합 설립과 향후 운영에 참여하는 구조를 만들고자 합니다.'],
  ['셋째, 지속적인 의료복지사업을 추진하고자 합니다.', '진료·재활·건강검진 등 장애인에게 필요한 의료복지사업을 함께 추진할 기반을 마련하고자 합니다.'],
  ['넷째, 장애인이 편리하게 이용할 수 있는 병원이 필요합니다.', '조합의 대표적인 추진사업으로 장애인의 진료 편의와 접근성을 고려한 장애인 전용 병원 설립을 계획하고 있습니다.'],
]
const ASKS = [
  ['의료복지사회적협동조합 신규 설립', '의료와 복지의 공익적 목적을 수행할 (가칭) 나눔이음의료복지사회적협동조합을 새롭게 설립하고자 합니다.'],
  ['장애인 당사자의 조합 참여', '장애인이 조합원으로 참여하고 의견을 제시할 수 있는 협동조합 운영체계를 마련하고자 합니다.'],
  ['의료·복지서비스 연계', '진료·건강관리·재활 등 필요한 의료서비스와 복지서비스를 연계하는 사업을 추진하고자 합니다.'],
  ['장애인 전용 병원 설립 추진', '조합의 대표적인 추진사업으로 장애인의 진료 편의와 의료 접근성을 고려한 병원 설립을 추진하고자 합니다.'],
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
  const [sigId, setSigId] = useState(null)
  const [isNew, setIsNew] = useState(true)
  const [exchanged, setExchanged] = useState(false)
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
    setSigId(null)
    setIsNew(true)
    setExchanged(false)
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
        if (!res.ok) throw new Error(data.detail || '서버 오류')

        // 기존자(중복)면 카운트는 올리지 않음 → 낙관적 +1 되돌림
        if (data.is_new === false) {
          setLiveCount(c => Math.max(0, c - 1))
        }
        if (typeof data.total_count === 'number') {
          setLiveCount(data.total_count)
          setDoneCount(data.total_count)
        }

        // 교환 화면 제어용 값 저장
        if (typeof data.signature_id !== 'undefined') setSigId(data.signature_id)
        setIsNew(data.is_new !== false)
        setExchanged(data.exchanged === true)

        setCouponReady(true)   // 서버 응답 성공 시 교환 화면 표시
      })
      .catch(() => {
        setLiveCount(c => Math.max(0, c - 1))
        setSubmitError('설립동의 저장에 실패했습니다. 다시 시도해 주세요.')
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
        {doneOpen && <DoneOverlay total={doneCount} onClose={handleDoneClose} couponReady={couponReady} signatureId={sigId} isNew={isNew} exchanged={exchanged} />}
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

      {/* PC에서는 상위 레이아웃이 스크롤을 막더라도 이 탭 내부에서 휠 스크롤 가능 */}
      <div style={{ width: '100%', maxHeight: isMobile ? undefined : '100dvh', overflowY: isMobile ? 'visible' : 'auto', overflowX: 'hidden' }}>
      {/* 상단 고정형 서명 CTA 바 */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: isMobile ? '20px 20px 16px' : '32px 40px 24px', fontFamily: FONT, boxSizing: 'border-box' }}>
        <div style={{ width: '100%', maxWidth: isMobile ? '100%' : 640 }}>
          {loading ? LoadingUI : (
            <button type="button" onClick={goSign}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: isMobile ? '15px 24px' : '17px 32px', background: C.yellow, color: C.navyDark, border: 'none', borderRadius: 12, fontSize: isMobile ? 16 : 18, fontWeight: 900, fontFamily: FONT, letterSpacing: '-0.5px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,212,0,0.45)', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(255,212,0,0.55)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,212,0,0.45)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.navyDark} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
              설립동의서 작성하기
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

            <div style={{ position: 'relative', zIndex: 3, padding: isMobile ? '32px 24px' : '0 48px', width: isMobile ? '100%' : 'auto' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,212,0,0.14)', border: '1px solid rgba(255,212,0,0.4)',
                borderRadius: 999, padding: '6px 14px', marginBottom: 20,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.yellow }} />
                <span style={{ color: C.yellow, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.04em' }}>
                  (가칭) 나눔이음의료복지사회적협동조합 · 설립동의자 모집
                </span>
              </div>
              <h1 style={{ color: '#fff', fontWeight: 800, fontSize: isMobile ? 28 : 42, lineHeight: 1.32, letterSpacing: '-0.01em', margin: 0 }}>
                의료와 복지를 함께할<br />
                <span style={{ color: C.yellow }}>협동조합 설립</span>에<br />
                동의해 주세요
              </h1>
              <p style={{ marginTop: 22, color: 'rgba(255,255,255,0.78)', fontSize: 14.5, lineHeight: 1.85, fontWeight: 300, maxWidth: 440 }}>
                <span style={{ display: 'block', color: C.yellow, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                  (가칭) 나눔이음의료복지사회적협동조합 설립 발기인회
                </span>
                장애인 당사자가 참여하는 의료복지사회적협동조합을 새롭게 설립하고자 합니다.<br />장애인 전용 병원 설립은 대표적인 추진사업입니다.
              </p>
              <button onClick={goSign} style={{ marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 10, background: C.yellow, border: 'none', borderRadius: 8, padding: '14px 26px', fontSize: 15, fontWeight: 900, color: C.navyDark, cursor: 'pointer', fontFamily: FONT, letterSpacing: '-0.2px' }}>
                설립동의하기 <span style={{ fontSize: 17 }}>→</span>
              </button>
            </div>
          </div>

          {/* ── 청원 취지 ── */}
          <div style={{ background: '#fff', padding: isMobile ? '48px 24px 40px' : '60px 40px 52px' }}>
            <div style={{ maxWidth: 660, margin: '0 auto', textAlign: 'center' }}>
              <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', color: C.navy, background: C.cream, border: `1px solid ${C.hair}`, borderRadius: 999, padding: '5px 16px', marginBottom: 20 }}>의료복지사회적협동조합 설립 취지</span>
              <p style={{ fontSize: 15, color: C.inkSoft, lineHeight: 1.95, margin: 0 }}>의료와 복지서비스의 접근성을 높이고, 장애인 당사자가 설립과 운영에 참여하는 새로운 의료복지사회적협동조합을 설립하고자 합니다. 조합 설립을 통해 의료·복지서비스 연계 등의 공익적 사업을 추진하며, 장애인 전용 병원 설립을 대표적인 추진사업으로 계획하고 있습니다.</p>
              <div style={{ marginTop: 18, fontSize: 12.5, color: '#9a9aab', fontWeight: 600 }}>설립 추진 · (가칭) 나눔이음의료복지사회적협동조합 발기인회</div>
            </div>
          </div>

          {/* ── 문제 제기: 네이비 카드 + 옐로 넘버 칩 ── */}
          <div style={{ background: C.cream, padding: isMobile ? '40px 24px' : '60px 48px' }}>
            <h2 style={{ fontFamily: SERIF, color: C.navyDark, fontWeight: 800, fontSize: isMobile ? 23 : 27, lineHeight: 1.42, margin: '0 0 28px', textAlign: isMobile ? 'left' : 'left' }}>
              왜 의료복지사회적협동조합을<br />설립하려고 할까요?
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
            <p style={{ marginTop: 18, fontSize: 11.5, lineHeight: 1.7, color: '#9a9aab' }}>의료복지사회적협동조합 설립을 통해 장애인 당사자가 참여하는 의료·복지사업을 추진하고자 합니다.</p>
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
                장애인의 참여로 시작하는 의료복지사회적협동조합
              </div>
              <div style={{ color: '#8a3a40', fontSize: 13, lineHeight: 1.7 }}>
                의료복지사회적협동조합 설립을 통해 필요한 의료·복지서비스를 함께 추진하고자 합니다.
              </div>
            </div>
          </div>

          {/* ── 청원 요구사항 ── */}
          <div style={{ background: '#fff', padding: isMobile ? '40px 24px' : '64px 48px' }}>
            <h2 style={{ color: C.navyDark, fontWeight: 800, fontSize: isMobile ? 22 : 25, lineHeight: 1.42, margin: '0 0 28px' }}>설립 후 추진하고자 하는<br />주요 사업</h2>
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
              의료복지사회적협동조합 설립,<br /><span style={{ color: C.yellow }}>여러분의 동의</span>로 시작합니다
            </p>
            <button onClick={goSign}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', maxWidth: 440, padding: isMobile ? '18px 28px' : '20px 40px', background: C.yellow, color: C.navyDark, border: 'none', borderRadius: 14, fontSize: isMobile ? 17 : 20, fontWeight: 900, fontFamily: FONT, letterSpacing: '-0.4px', cursor: 'pointer', boxShadow: '0 8px 28px rgba(255,212,0,0.35)', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(255,212,0,0.45)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(255,212,0,0.35)' }}>
              설립동의서 작성하기 <span style={{ fontSize: 20 }}>→</span>
            </button>
            <p style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>본 참여는 (가칭) 나눔이음의료복지사회적협동조합의 신규 설립에 대한 동의입니다.</p>
          </div>

        </div>
      </div>
      </div>
    </>
  )
}