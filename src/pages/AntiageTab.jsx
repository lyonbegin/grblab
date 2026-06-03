// AntiageTab.jsx
// AI안전 탭과 동일한 레이아웃을 가진 독자 컴포넌트

import SafetyMarketingSections from './SafetyMarketingSections'

export default function AntiageTab({ isMobile }) {
  return (
    <>
      {/* AI안전 탭과 동일한 hero 영역 */}
      <main
        style={{
          flex: 1,
          margin: '0 auto',
          width: '100%',
          maxWidth: 1200,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          padding: isMobile ? '1px 20px 48px' : '60px 40px',
          gap: isMobile ? 0 : 32,
          alignItems: isMobile ? 'flex-start' : 'stretch',
        }}
      >
        {/* 왼쪽 컬럼 */}
        <div style={{ flex: isMobile ? 'none' : '0 0 460px', maxWidth: isMobile ? '100%' : 460, width: '100%' }}>
          <h1 style={{
            fontSize: isMobile ? 30 : 40,
            lineHeight: 1.4,
            letterSpacing: isMobile ? '-1.2px' : '-2.5px',
            marginBottom: isMobile ? 12 : 18,
            fontWeight: 400,
            color: '#1a1a1a',
            fontFamily: "'Noto Sans KR','Malgun Gothic',sans-serif",
          }}>
            <span style={{ fontWeight: 900 }}>앙티아쥬</span>가 바꾸는 <br /> 안전장비 / TBM / 위험성평가
          </h1>
          <p style={{ color: '#999', fontSize: isMobile ? 15 : 17, marginBottom: isMobile ? 10 : 14 }}>
            AI로 더 빠르고 정확하게
          </p>
        </div>

        {/* 오른쪽 컬럼 (PC만) */}
        {!isMobile && (
          <div style={{
            alignSelf: 'stretch', display: 'flex', flexDirection: 'column',
            alignItems: 'stretch', justifyContent: 'flex-start', flex: 1, paddingTop: 6,
          }}>
            <div style={{ flex: 1, background: '#f7f7f7', borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>
                  추천코드가 없다면 클릭 👉
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="추천인 코드를 입력하세요"
                  style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff', color: '#333', minWidth: 0 }}
                />
                <button style={{ padding: '10px 18px', background: '#FAE100', color: '#3C1E1E', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  신청하기
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 8, lineHeight: 1.5 }}>
                추천코드 입력 시 50인 미만 사업장 무상 도입이 적용됩니다.
              </div>
            </div>

            {/* 폰 목업 영상 */}
            <div style={{
              height: 700, aspectRatio: '1 / 2', background: '#1a1a1a', borderRadius: 44,
              padding: '10px 7px', boxShadow: '0 24px 80px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(255,255,255,0.07)',
              position: 'relative', flexShrink: 0, alignSelf: 'center',
            }}>
              <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 52, height: 7, background: '#000', borderRadius: 4, zIndex: 10 }} />
              <div style={{ width: '100%', height: '100%', borderRadius: 36, overflow: 'hidden', background: '#000' }}>
                <video autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} src="/output.webm" />
              </div>
              <div style={{ position: 'absolute', bottom: 7, left: '50%', transform: 'translateX(-50%)', width: 52, height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 2 }} />
            </div>
          </div>
        )}
      </main>

      {/* 마케팅 섹션 (AI안전과 동일) */}
      <SafetyMarketingSections isMobile={isMobile} />
    </>
  )
}