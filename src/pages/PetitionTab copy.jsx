// PetitionTab.jsx
import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const FONT = "'Noto Sans KR','Malgun Gothic',sans-serif"
const SERIF = "'Nanum Myeongjo','Noto Sans KR',serif"

const C = {
  green: '#79b043', greenDark: '#6aa036',
  yellow: '#FAE100', yellowText: '#1a1a1a',
  cream: '#efeae0',
  serif: '#7d7164', serifSoft: '#9a8f80',
  steel: '#4f8295', steelDark: '#44707f',
  ink: '#2f2f2f', inkSoft: '#5a5a5a',
  hair: '#e6e2da',
  live: '#36d399',
}

const ov = {
  root: { position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(20,18,14,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT },
  sheet: { width: '100%', maxWidth: 460, background: '#fff', borderRadius: '18px 18px 0 0', padding: '22px 22px max(env(safe-area-inset-bottom),24px)', boxShadow: '0 -10px 40px rgba(0,0,0,0.25)', boxSizing: 'border-box' },
  grip: { width: 40, height: 4, borderRadius: 99, background: '#dcd7cd', margin: '0 auto 16px' },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 18, fontWeight: 800, color: C.ink, letterSpacing: '-0.4px' },
  sub: { fontSize: 13, color: C.inkSoft, margin: '6px 0 18px', lineHeight: 1.6 },
  closeBtn: { width: 32, height: 32, borderRadius: 8, cursor: 'pointer', border: '1px solid ' + C.hair, background: '#faf8f3', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12.5, fontWeight: 700, color: C.inkSoft, margin: '0 0 6px' },
  input: { width: '100%', boxSizing: 'border-box', padding: '12px 14px', marginBottom: 14, border: '1px solid ' + C.hair, borderRadius: 10, fontSize: 15, fontFamily: FONT, color: C.ink, outline: 'none', background: '#faf8f3' },
  agreeRow: { display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5, margin: '2px 0 18px', cursor: 'pointer' },
  submit: { width: '100%', padding: '15px', border: 'none', borderRadius: 12, background: C.green, color: '#fff', fontSize: 16, fontWeight: 800, fontFamily: FONT, cursor: 'pointer', letterSpacing: '-0.4px' },
  submitOff: { background: '#cfcabf', cursor: 'not-allowed' },
}

function SignOverlay({ onSubmit, onClose, submitting }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [agree, setAgree] = useState(false)
  const ready = name.trim().length >= 2 && phone.trim().length >= 9 && agree && !submitting
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={ov.root} onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 320 }} style={ov.sheet} onClick={e => e.stopPropagation()}>
        <div style={ov.grip} />
        <div style={ov.head}>
          <div style={ov.title}>청원 서명 참여</div>
          <button style={ov.closeBtn} onClick={onClose} aria-label="닫기">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4L4 14" stroke="#777" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <p style={ov.sub}>장애인 의료비 부담 경감·재활치료 접근권 보장 청원에 동참합니다.</p>
        <p style={ov.label}>이름</p>
        <input style={ov.input} value={name} onChange={e => setName(e.target.value)} placeholder="이름을 입력하세요" />
        <p style={ov.label}>휴대폰 번호</p>
        <input style={ov.input} value={phone} inputMode="numeric" onChange={e => setPhone(e.target.value.replace(/[^0-9-]/g, ''))} placeholder="010-0000-0000" />
        <label style={ov.agreeRow}>
          <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, accentColor: C.green }} />
          <span>청원 서명 목적의 개인정보 수집·이용에 동의합니다. (이름·연락처는 청원 집계 외 용도로 사용되지 않습니다.)</span>
        </label>
        <button style={{ ...ov.submit, ...(ready ? {} : ov.submitOff) }} disabled={!ready} onClick={() => onSubmit({ name: name.trim(), phone: phone.trim() })}>
          {submitting ? '제출 중…' : '서명 제출하기'}
        </button>
      </motion.div>
    </motion.div>
  )
}

function useCountUp(target, duration = 1500) {
  const [display, setDisplay] = useState(0)
  const displayRef = useRef(0)
  const rafRef = useRef(0)
  useEffect(() => {
    const from = displayRef.current
    const start = performance.now()
    const ease = t => 1 - Math.pow(1 - t, 3)
    const tick = now => {
      const p = Math.min((now - start) / duration, 1)
      const v = Math.round(from + (target - from) * ease(p))
      displayRef.current = v
      setDisplay(v)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])
  return display
}

function LiveCounter({ baseCount = 2847, variant = 'float' }) {
  const [target, setTarget] = useState(baseCount)
  const [flash, setFlash] = useState(null)
  const count = useCountUp(target)
  useEffect(() => {
    const id = setInterval(() => {
      const inc = 1 + Math.floor(Math.random() * 2)
      setTarget(t => t + inc)
      setFlash({ id: Date.now(), n: inc })
    }, 3800)
    return () => clearInterval(id)
  }, [])
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
        <div style={{ height: 18, marginTop: 8 }}>
          <AnimatePresence mode="popLayout">
            {flash && (
              <motion.div key={flash.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.4 }} onAnimationComplete={() => setTimeout(() => setFlash(null), 1600)} style={{ fontSize: 12, fontWeight: 700, color: C.live, display: 'flex', alignItems: 'center', gap: 4 }}>
                ▲ 방금 +{flash.n}명 참여
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
  ['둘째, 재활치료가 비용과 횟수에 가로막혀 있습니다.', '대표적 재활인 도수치료는 그동안 비급여로 1회 약 10만 원을 전액 본인이 부담해 왔습니다. 2026년 7월 ‘관리급여’로 편입되었으나, 본인부담률이 95%에 이르고 연 15회(의학적 사유 시 24회)로 횟수가 제한됩니다.'],
  ['셋째, 치과 진료에서 장애인의 부담이 특히 큽니다.', '구강 관리와 치과 치료의 필요가 큰 경우가 많지만, 급여 진료의 본인부담은 물론 임플란트 등 고액 비급여 진료까지 더해져 부담이 가중됩니다. 정작 치료가 더 필요한 장애인이 비용 때문에 치료를 미루게 됩니다.'],
  ['넷째, 이름만 급여인 제도가 장애인에게 불리하게 작동합니다.', '관리급여처럼 명칭은 급여이나 사실상 부담을 환자에게 그대로 떠안기는 제도는, 의료 의존도가 높은 장애인에게 더 큰 부담으로 돌아옵니다.'],
]
const ASKS = [
  ['장애인 의료 본인부담 경감', '진료·재활·검진 등 장애인의 의료 본인부담을 장애 특성에 맞게 경감하는 법적 근거를 마련해 주십시오.'],
  ['재활치료 횟수·부담 제한 완화', '도수치료 등 재활치료의 본인부담률과 연간 횟수 제한을, 재활이 필요한 장애인에게 실질적 치료가 가능한 수준으로 완화해 주십시오.'],
  ['장애인 치과 진료비 지원 법제화', '급여 진료는 물론 임플란트 등 비급여 진료까지 포함하여 치과 의료비를 지원하는 법적 근거를 마련해 주십시오.'],
  ['장애인에게 불리한 제도의 재개정', '관리급여 등 환자 부담을 과도하게 전가하는 제도를 장애인 의료 접근권 관점에서 재검토·개정해 주십시오.'],
]

export default function PetitionTab({ isMobile, loading, LoadingUI, signCount, onGoSign, submitSign }) {
  const navigate = useNavigate()
  const [signOpen, setSignOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const goSign = useCallback(() => {
    if (typeof onGoSign === 'function') onGoSign()
    else setSignOpen(true)
  }, [onGoSign])
  const handleSubmit = useCallback(async (form) => {
    setSubmitting(true)
    let result = { ok: true }
    if (typeof submitSign === 'function') { try { result = await submitSign(form) } catch { result = { ok: false } } }
    setSubmitting(false)
    setSignOpen(false)
    navigate('/petition-done', { state: { form, result } })
  }, [submitSign, navigate])
  const COL = isMobile ? '100%' : 860

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=Nanum+Myeongjo:wght@400;700;800&display=swap');
        @keyframes petPulse { 0%{transform:scale(1);opacity:0.9} 70%{transform:scale(2.6);opacity:0} 100%{opacity:0} }
      `}</style>

      <AnimatePresence>
        {signOpen && <SignOverlay onSubmit={handleSubmit} onClose={() => setSignOpen(false)} submitting={submitting} />}
      </AnimatePresence>

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

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', fontFamily: FONT }}>
        <div style={{ width: '100%', maxWidth: COL, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>

          <div style={{ position: 'relative', minHeight: isMobile ? 460 : 520, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg,#d8cdbf 0%,#c9bdac 40%,#b9ac99 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(40,33,25,0.66) 0%,rgba(40,33,25,0.40) 52%,rgba(40,33,25,0.12) 88%)' }} />
            <span style={{ position: 'absolute', right: 16, bottom: 14, background: 'rgba(255,255,255,0.7)', color: '#8b8474', fontSize: 11, padding: '4px 10px', borderRadius: 2, zIndex: 2 }}>이미지 자리 (Hero)</span>
            {!isMobile && <LiveCounter baseCount={signCount ?? 2847} variant="float" />}
            <div style={{ position: 'relative', zIndex: 3, padding: isMobile ? '28px 24px' : '0 48px', width: isMobile ? '100%' : 'auto' }}>
              {isMobile && <LiveCounter baseCount={signCount ?? 2847} variant="inline" />}
              <div style={{ color: '#f4ead4', fontSize: 13, marginBottom: 18, opacity: 0.95 }}>장애인 의료비 부담 경감·재활치료 접근권 보장 청원</div>
              <h1 style={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? 28 : 42, lineHeight: 1.33, letterSpacing: '-0.01em', textShadow: '0 2px 18px rgba(0,0,0,0.25)', margin: 0 }}>치료받을 권리가<br />비용과 횟수에<br />막혀서는 안 됩니다</h1>
              <p style={{ marginTop: 20, color: '#f2efe9', fontSize: 14.5, lineHeight: 1.85, fontWeight: 300, maxWidth: 440 }}>
                <span style={{ display: 'block', color: '#e9d9b6', fontSize: 13, marginBottom: 6 }}>청원인 부산의료복지사회적협동조합 및 조합원 일동</span>
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
            <Ph label="이미지 자리 (현장 사진)" style={{ minHeight: isMobile ? 240 : 520, order: isMobile ? -1 : 0 }} />
            <div style={{ padding: isMobile ? '40px 24px' : '60px 48px' }}>
              <h2 style={{ fontFamily: SERIF, color: C.serif, fontWeight: 800, fontSize: isMobile ? 23 : 26, lineHeight: 1.42, margin: '0 0 24px' }}>장애라는 이유로<br />줄어들지 않는 의료비 부담</h2>
              {REASONS.map(([h, b], i) => (<p key={i} style={{ color: C.serif, fontSize: 14, lineHeight: 1.95, margin: '0 0 16px' }}><b style={{ fontWeight: 700, color: '#5f5446' }}>{h}</b> {b}</p>))}
              <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
                <Ph label="사진" style={{ width: 92, height: 64, borderRadius: 3 }} />
                <Ph label="사진" style={{ width: 92, height: 64, borderRadius: 3 }} />
                <Ph label="사진" style={{ width: 92, height: 64, borderRadius: 3 }} />
              </div>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1.4fr 1fr', gap: 6, minHeight: isMobile ? 300 : 'auto' }}>
              <Ph label="이미지 자리 (대표 사진)" style={{ gridColumn: '1 / 3', height: '100%' }} />
              <Ph label="사진" style={{ height: '100%' }} />
              <Ph label="사진" style={{ height: '100%' }} />
            </div>
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