// AntiageTab.jsx
import SafetyMarketingSections from './SafetyMarketingSections'

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

export default function AntiageTab({
  isMobile,
  smartEquipmentItems,
  onSmartEquipmentClick,
  riskGrid,
  ImageGrid,
  onRiskImageSelect,
  loading,
  LoadingUI,
  ActionUI,
  PhoneMockup,
}) {
  return (
    <>
      {/* ── 카메라 촬영 버튼 영역 ── */}
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
        <div
          style={{
            width: '100%',
            maxWidth: isMobile ? '100%' : 640,
          }}
        >
          {loading ? LoadingUI : (
            // ActionUI를 감싸되, 내부의 기존 버튼 로직이 그대로 실행되도록
            // ActionUI 대신 카메라 촬영 버튼만 렌더 — ActionUI가 <input type="file"> 트리거라면
            // 아래처럼 ActionUI를 숨김 처리하고 커스텀 버튼이 그걸 트리거하도록 래핑합니다.
            <div style={{ position: 'relative' }}>
              {/* 실제 ActionUI는 숨겨두고 커스텀 버튼이 클릭 이벤트를 전달 */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  zIndex: 2,
                  cursor: 'pointer',
                  pointerEvents: 'all',
                }}
              >
                {ActionUI}
              </div>

              {/* 카메라 촬영 커스텀 버튼 */}
              <button
                type="button"
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
                  position: 'relative',
                  zIndex: 1,
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
                {/* 카메라 아이콘 */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                카메라 촬영
              </button>
            </div>
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
                style={{
                  width: '100%',
                  display: 'block',
                  verticalAlign: 'bottom',
                  lineHeight: 0,
                }}
              />
            ) : (
              <img
                key={idx}
                src={item.src}
                alt={`상세이미지 ${idx + 1}`}
                style={{
                  width: '100%',
                  display: 'block',
                  verticalAlign: 'bottom',
                  lineHeight: 0,
                }}
                loading={idx < 3 ? 'eager' : 'lazy'}
              />
            )
          )}
        </div>
      </div>

      {/* <SafetyMarketingSections isMobile={isMobile} /> */}
    </>
  )
}