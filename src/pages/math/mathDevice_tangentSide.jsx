import React from 'react';
import { Mafs, Coordinates, Plot, Theme, MovablePoint, Point, Text } from 'mafs';

export function renderTangentSide(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v) return null;

  // 1. 상태 관리 (Zero-Hook 규칙 준수, 부모 sharedXByLog 상속)
  // t: 접선을 대는 기준 시점 (x좌표, 범위 0.5 ~ 4.5, 기본값 2.0)
  const t = sharedXByLog?.[logIdx]?.t ?? 2.0;
  
  // mode: 'bubble' (가속 폭등 ∪) vs 'burst' (감속 둔화 ∩)
  const mode = sharedXByLog?.[logIdx]?.mode ?? 'bubble';

  const setT = (val) => setSharedXByLog?.(prev => ({
    ...prev,
    [logIdx]: { ...(prev?.[logIdx] || {}), t: Math.min(4.5, Math.max(0.5, val)) }
  }));

  const setMode = (newMode) => setSharedXByLog?.(prev => ({
    ...prev,
    [logIdx]: { ...(prev?.[logIdx] || {}), mode: newMode }
  }));

  // 2. 두 가지 경제 시나리오 곡선 정의 (x 범위 [0, 6], y 범위 [0, 5])
  // 가속 폭등 (∪): y = 0.1 * x^2 + 0.5 (접선 아래에 곡선이 깔리지 않고, 곡선이 접선 '위'에 존재)
  const fBubble = (x) => 0.1 * Math.pow(x, 2) + 0.5;
  const dBubble = (x) => 0.2 * x;

  // 감속 둔화 (∩): y = -0.08 * x^2 + x + 0.5 (기울기는 양수이나 갈수록 완만, 곡선이 접선 '아래'에 존재)
  const fBurst = (x) => -0.08 * Math.pow(x, 2) + x + 0.5;
  const dBurst = (x) => -0.16 * x + 1.0;

  // 선택된 모드에 따른 수학 식 매핑
  const f = mode === 'bubble' ? fBubble : fBurst;
  const df = mode === 'bubble' ? dBubble : dBurst;

  // 3. 접선(상인의 예측 자) 방정식: L(x) = f'(t)*(x - t) + f(t)
  const getTangentY = (x, evalT) => {
    return df(evalT) * (x - evalT) + f(evalT);
  };

  const currentY = f(t);
  const currentSlope = df(t);

  // 4. 미래 예측 시점 (기준 시점 t로부터 1.2초 뒤의 미래)
  const futureX = Math.min(5.7, t + 1.2);
  const realFutureY = f(futureX); // 실제 미래 가격
  const predictedFutureY = getTangentY(futureX, t); // 접선 자가 예측한 미래 가격
  const gap = realFutureY - predictedFutureY; // 오차 (양수면 잭팟, 음수면 대폭락)

  // 5. 상황별 피드백 데코레이션 및 설명 텍스트
  const isBubble = mode === 'bubble';
  let bannerText = '';
  let bannerBg = '';
  let bannerColor = '';

  if (isBubble) {
    bannerText = '🤑 잭팟 발생! 곡선이 접선 "위(∪)"로 치솟아, 자로 예측했던 것보다 실제 튤립 가격이 더 비싸졌습니다!';
    bannerBg = '#ecfdf5';
    bannerColor = '#065f46';
  } else {
    bannerText = '😱 예측 실패! 곡선이 접선 "아래(∩)"로 꺾여, 자로 그린 장밋빛 미래보다 실제 가격이 처참히 낮아졌습니다!';
    bannerBg = '#fef2f2';
    bannerColor = '#991b1b';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'sans-serif', userSelect: 'none' }}>
      
      <style>{`
        .mafs-slide-container .MafsView {
          background-color: transparent !important;
        }
      `}</style>

      {/* [상단 제어 패널] 모드 전환 스위치 */}
      <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
        <button 
          onClick={() => setMode('bubble')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '10px',
            border: '2px solid',
            borderColor: isBubble ? '#059669' : '#e2e8f0',
            background: isBubble ? '#10b981' : '#ffffff',
            color: isBubble ? '#ffffff' : '#475569',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          📈 1단계: 가속 폭등기 (아래로 볼록 ∪)
        </button>
        <button 
          onClick={() => setMode('burst')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '10px',
            border: '2px solid',
            borderColor: !isBubble ? '#dc2626' : '#e2e8f0',
            background: !isBubble ? '#ef4444' : '#ffffff',
            color: !isBubble ? '#ffffff' : '#475569',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          📉 2단계: 거품 둔화기 (위로 볼록 ∩)
        </button>
      </div>

      {/* [중앙 메인 시뮬레이터] */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '15px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>
          📐 {isBubble ? '가속하는 그래프와 예측 자' : '꺾이기 시작한 그래프와 예측 자'}
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginBottom: '12px' }}>
          <b>빨간 조종 핸들(t)</b>을 잡고 흔들면, 그 순간 상인이 대고 그린 <b>직선 예측 자(접선)</b>가 그려집니다.
        </div>

        <div className="mafs-slide-container" style={{ 
          width: '100%', 
          overflow: 'hidden', 
          borderRadius: '10px', 
          background: '#1e293b', // 네이비 계열 칠판 느낌 배경
          border: '1px solid #334155'
        }}>
          <Mafs viewBox={{ x: [0, 6], y: [-0.5, 5.0] }} preserveAspectRatio={true} height={240}>
            {/* 그리드 배제, 직관적 기하 구조 위주 표기 */}

            {/* 1. 실제 가격 곡선 */}
            <Plot.OfX y={f} color={isBubble ? '#10b981' : '#f43f5e'} weight={4.5} />

            {/* 2. 상인의 예측 자 (접선) - 전 구간으로 확장해서 그리기 */}
            <Plot.OfX y={(x) => getTangentY(x, t)} color="#e2e8f0" weight={2} style="solid" />

            {/* 3. 현재 측정 점 t */}
            <Point x={t} y={currentY} color="#f43f5e" size={6} />
            <Text x={t} y={currentY + 0.3} size={13} hAlign="center" color="#fca5a5">📐 자 대는 곳 (t)</Text>

            {/* 4. 미래 오차 추적 가이드선 (t + 1.2 위치) */}
            {/* 미래 실제 지점 */}
            <Point x={futureX} y={realFutureY} color={isBubble ? '#34d399' : '#fda4af'} size={5} />
            {/* 미래 예측 지점 */}
            <Point x={futureX} y={predictedFutureY} color="#94a3b8" size={5} />

            {/* 오차를 잇는 세로 점선 기둥 */}
            <Plot.OfX 
              y={(x) => x >= futureX - 0.02 && x <= futureX + 0.02 ? Math.min(realFutureY, predictedFutureY) : null} 
              color="#fbbf24" 
              style="dashed" 
            />

            {/* 예측 오차 이모지 표기 */}
            <Text x={futureX + 0.1} y={(realFutureY + predictedFutureY) / 2} size={22} hAlign="left">
              {isBubble ? '🤑' : '😭'}
            </Text>

            {/* 미래 시점 텍스트 안내 */}
            <Text x={futureX} y={-0.3} size={11} hAlign="center" color="#94a3b8">미래 예측 시점</Text>

            {/* 5. 제어용 MovablePoint 핸들 (t축 상에서 자유로운 슬라이더 대체) */}
            <MovablePoint
              point={[t, currentY]}
              color={Theme.red}
              constrain={(pos) => {
                const clampedX = Math.min(4.5, Math.max(0.5, pos[0]));
                return [clampedX, f(clampedX)];
              }}
              onMove={(pos) => setT(pos[0])}
            />
          </Mafs>
        </div>

        {/* 상황 매핑 배너 */}
        <div style={{ 
          marginTop: '12px', 
          padding: '10px', 
          borderRadius: '8px', 
          background: bannerBg, 
          color: bannerColor, 
          fontSize: '13px', 
          fontWeight: 'bold', 
          textAlign: 'center',
          lineHeight: '1.4',
          transition: 'all 0.2s ease'
        }}>
          {bannerText}
        </div>
      </div>

      {/* [하단 수치 정보 패널] */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', fontSize: '12px', color: '#475569' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span>⏱️ 현재 측정 시점: <b>{t.toFixed(1)}일차</b></span>
          <span>🔮 예측 일차 (미래): <b>{futureX.toFixed(1)}일차</b></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
          <span>📈 현재 기울기: <span style={{ color: isBubble ? '#059669' : '#dc2626' }}>{currentSlope.toFixed(2)}</span></span>
          <span>📊 예측 오차율: <span style={{ color: gap >= 0 ? '#059669' : '#dc2626' }}>{gap >= 0 ? '+' : ''}{gap.toFixed(2)} 냥 (골드)</span></span>
        </div>
      </div>

    </div>
  );
}