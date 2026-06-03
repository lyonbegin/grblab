// AntiageTab.jsx
import { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import AntiageCameraOverlay from './AntiageCameraOverlay'

// 상세페이지 이미지/미디어 목록 (public 폴더 기준)
const detailMediaItems = [
  { type: 'image', src: '/1-001.jpg' },
  { type: 'image', src: '/1-002.jpg' },
  { type: 'image', src: '/1-003.jpg' },
  { type: 'image', src: '/1-004.jpg' },
  { type: 'image', src: '/1-005.jpg' },
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

/**
 * AntiageTab
 *
 * Props (InputPage에서 내려오는 것만 사용):
 *   isMobile   — 모바일 여부
 *   loading    — AI 분석 중 여부
 *   LoadingUI  — 로딩 중 표시할 JSX
 *   analyze    — (file) => result  위험성평가 분석 함수
 *   setPreview — 미리보기 이미지 URL 세터
 */
export default function AntiageTab({
  isMobile,
  loading,
  LoadingUI,
  analyze,
  setPreview,
}) {
  const navigate   = useNavigate()
  const [camOpen, setCamOpen] = useState(false)

  // 셔터 클릭 후 → 모달 없이 바로 분석
  const handleCapture = useCallback(async (file, previewSrc) => {
    setCamOpen(false)
    setPreview(previewSrc)

    const result = await analyze(file)
    if (!result) return

    navigate('/result', { state: { result, imageUrl: previewSrc, riskFactors: [] } })
  }, [analyze, navigate, setPreview])

  return (
    <>
      {/* 전용 카메라 오버레이 */}
      <AnimatePresence>
        {camOpen && (
          <AntiageCameraOverlay
            onCapture={handleCapture}
            onClose={() => setCamOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── 카메라 촬영 버튼 ── */}
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

      {/* ── 상세페이지 이미지 갤러리 ── */}
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