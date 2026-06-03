// AntiageTab.jsx
import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Webcam from 'react-webcam'

// ─── 카메라 오버레이 스타일 상수 ────────────────────────────────────────────
const cam = {
  root: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: '#000',
    display: 'flex', flexDirection: 'column',
  },
  video: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    objectFit: 'cover',
  },
  vignette: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.72) 100%)',
    pointerEvents: 'none',
  },
  topBar: {
    position: 'relative', zIndex: 2,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '18px 20px 0',
  },
  badge: {
    fontSize: 13, fontWeight: 700, letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.85)',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: 6, padding: '4px 10px',
    fontFamily: "'Noto Sans KR','Malgun Gothic',sans-serif",
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: 8, width: 38, height: 38,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
  framewrap: {
    flex: 1, position: 'relative', zIndex: 2,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 20,
  },
  frame: {
    position: 'relative',
    width: 'min(72vw, 320px)', height: 'min(72vw, 320px)',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute', left: 0, right: 0,
    height: 2,
    background: 'linear-gradient(90deg, transparent, rgba(250,225,0,0.9), transparent)',
    animation: 'camScan 2.4s ease-in-out infinite',
  },
  guide: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13, fontWeight: 500, letterSpacing: '-0.3px',
    fontFamily: "'Noto Sans KR','Malgun Gothic',sans-serif",
    textAlign: 'center', margin: 0,
    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
  },
  shutterRow: {
    position: 'relative', zIndex: 2,
    display: 'flex', justifyContent: 'center',
    paddingBottom: 'max(env(safe-area-inset-bottom), 32px)',
    paddingTop: 16,
  },
  shutterOuter: {
    width: 76, height: 76, borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.85)',
    background: 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
  shutterCore: {
    width: 58, height: 58, borderRadius: '50%',
    background: '#fff',
    transition: 'opacity 0.2s',
  },
}

const CORNERS = [
  { top: 0,    left:  0, borderWidth: '2px 0 0 2px', borderRadius: '4px 0 0 0' },
  { top: 0,    right: 0, borderWidth: '2px 2px 0 0', borderRadius: '0 4px 0 0' },
  { bottom: 0, left:  0, borderWidth: '0 0 2px 2px', borderRadius: '0 0 0 4px' },
  { bottom: 0, right: 0, borderWidth: '0 2px 2px 0', borderRadius: '0 0 4px 0' },
]

// ─── 인라인 카메라 오버레이 컴포넌트 ────────────────────────────────────────
function CameraOverlay({ onCapture, onClose }) {
  const webcamRef = useRef(null)
  const [capturing, setCapturing] = useState(false)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const shoot = useCallback(async () => {
    if (capturing) return
    setCapturing(true)
    const imgSrc = webcamRef.current?.getScreenshot()
    if (!imgSrc) { setCapturing(false); return }
    const res  = await fetch(imgSrc)
    const blob = await res.blob()
    const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
    onCapture(file, imgSrc)
  }, [capturing, onCapture])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={cam.root}
    >
      <style>{`@keyframes camScan { 0%{top:4%} 50%{top:96%} 100%{top:4%} }`}</style>

      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        style={cam.video}
        videoConstraints={{ facingMode: isMobile ? 'environment' : 'user' }}
      />
      <div style={cam.vignette} />

      {/* 상단 바 */}
      <div style={cam.topBar}>
        <div style={cam.badge}>앙뚜아쥬</div>
        <button style={cam.closeBtn} onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 4l10 10M14 4L4 14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* 프레임 + 가이드 */}
      <div style={cam.framewrap}>
        <div style={cam.frame}>
          {CORNERS.map((c, i) => (
            <div
              key={i}
              style={{
                position: 'absolute', width: 28, height: 28,
                borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.9)',
                ...c,
              }}
            />
          ))}
          <div style={cam.scanLine} />
        </div>
        <p style={cam.guide}>
          {capturing ? '분석 중…' : '현장을 프레임 안에 맞춰 촬영하세요'}
        </p>
      </div>

      {/* 셔터 */}
      <div style={cam.shutterRow}>
        <motion.button
          style={cam.shutterOuter}
          whileTap={{ scale: 0.9 }}
          onClick={shoot}
          disabled={capturing}
        >
          <div style={{ ...cam.shutterCore, opacity: capturing ? 0.4 : 1 }} />
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── 상세페이지 이미지/미디어 목록 ──────────────────────────────────────────
const detailMediaItems = [
  { type: 'image', src: '/1-001.jpg' },
  { type: 'image', src: '/1-002.jpg' },
  { type: 'image', src: '/1-003.jpg' },
  { type: 'image', src: '/1-004.jpg' },
  { type: 'image', src: '/1-005.jpg' },

   { type: 'image', src: '/1-005-1.jpg' },
      { type: 'image', src: '/1-005-2.jpg' },
         { type: 'image', src: '/1-005-3.jpg' },
  { type: 'image', src: '/1-006.jpg' },
  { type: 'image', src: '/1-007.jpg' },
  { type: 'image', src: '/1-008.jpg' },
  { type: 'image', src: '/1-009.jpg' },
  { type: 'image', src: '/1-010.jpg' },
  { type: 'image', src: '/1-011.jpg' },
  { type: 'image', src: '/1-012.jpg' },
  { type: 'image', src: '/1-013.jpg' },
  { type: 'image', src: '/1-014.jpg' },
  { type: 'image', src: '/1-015.gif' },
  { type: 'video', src: '/1-016.mp4' },
  { type: 'image', src: '/1-017.jpg' },
  { type: 'image', src: '/1-018.jpg' },
  { type: 'image', src: '/1-019.jpg' },
  { type: 'image', src: '/1-020.jpg' },
]

// ─── AntiageTab (메인 export) ────────────────────────────────────────────────
/**
 * Props (InputPage에서 내려오는 것만 사용):
 *   isMobile   — 모바일 여부
 *   loading    — AI 분석 중 여부
 *   LoadingUI  — 로딩 중 표시할 JSX
 *   analyze    — (file) => result
 *   setPreview — 미리보기 이미지 URL 세터
 */
export default function AntiageTab({ isMobile, loading, LoadingUI, analyze, setPreview }) {
  const navigate = useNavigate()
  const [camOpen, setCamOpen] = useState(false)

  const handleCapture = useCallback(async (file, previewSrc) => {
    setCamOpen(false)
    setPreview(previewSrc)

    const result = await analyze(file)
    if (!result) return

    navigate('/urine-result', { state: { result, imageUrl: previewSrc, riskFactors: [] } })
  }, [analyze, navigate, setPreview])

  return (
    <>
      {/* 카메라 오버레이 */}
      <AnimatePresence>
        {camOpen && (
          <CameraOverlay
            onCapture={handleCapture}
            onClose={() => setCamOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* 촬영 버튼 */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: isMobile ? '20px 20px 16px' : '32px 40px 24px',
          fontFamily: "'Noto Sans KR','Malgun Gothic',sans-serif",
          boxSizing: 'border-box',
        }}
      >
        <div style={{ width: '100%', maxWidth: isMobile ? '100%' : 640 }}>
          {loading ? LoadingUI : (
            <button
              type="button"
              onClick={() => setCamOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                width: '100%',
                padding: isMobile ? '15px 24px' : '17px 32px',
                background: '#FAE100',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: 12,
                fontSize: isMobile ? 16 : 18,
                fontWeight: 800,
                fontFamily: "'Noto Sans KR','Malgun Gothic',sans-serif",
                letterSpacing: '-0.5px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(250,225,0,0.35)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(250,225,0,0.45)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(250,225,0,0.35)'
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              카메라 촬영
            </button>
          )}
        </div>
      </div>

      {/* 상세페이지 이미지 갤러리 */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: '#fff',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: isMobile ? '100%' : 860,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 0,
          }}
        >
          {detailMediaItems.map((item, idx) =>
            item.type === 'video' ? (
              <video
                key={idx}
                src={item.src}
                autoPlay
                loop
                muted
                playsInline
                style={{ width: '100%', display: 'block' }}
              />
            ) : (
              <img
                key={idx}
                src={item.src}
                alt={`상세이미지 ${idx + 1}`}
                style={{ width: '100%', display: 'block' }}
                loading={idx < 3 ? 'eager' : 'lazy'}
              />
            )
          )}
        </div>
      </div>
    </>
  )
}