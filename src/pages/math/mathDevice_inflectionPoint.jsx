import React from 'react';
import { Mafs, Coordinates, Plot, Theme, MovablePoint, Point, Text } from 'mafs';

export function renderInflectionPoint(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v) return null;

  // 1. 상태 관리 (Zero-Hook 규칙 준수, 부모 sharedXByLog 상속)
  // t: 시간의 흐름 (x좌표, 범위 0.5 ~ 5.5, 기본값 1.5)
  const t = sharedXByLog?.[logIdx]?.t ?? 1.5;

  const setT = (val) => setSharedXByLog?.(prev => ({
    ...prev,
    [logIdx]: { ...(prev?.[logIdx] || {}), t: Math.min(5.5, Math.max(0.5, val)) }
  }));

  // 2. 효모의 S자 발효 성장 곡선 (로지스틱 함수) 정의
  // 변곡점은 x = 3 일 때 정확히 발생합니다.
  const L = 4.0; // 최대 도달 높이
  const k = 1.2; // 성장률
  const x0 = 3.0; // 변곡점의 중심 x좌표
  
  // f(x) = L / (1 + e^(-k*(x - x0)))
  const fInflection = (x) => {
    return L / (1 + Math.exp(-k * (x - x0)));
  };

  // 도함수 (기울기, 접선의 기울기 자): f'(x) = k * f(x) * (1 - f(x)/L)
  const dInflection = (x) => {
    const fx = fInflection(x);
    return k * fx * (1 - fx / L);
  };

  // 이계도함수 (곡률, 가속도): f''(x) = k^2 * f(x) * (1 - f(x)/L) * (1 - 2*f(x)/L)
  // f''(x)의 부호가 양수(+)이면 ∪, 음수(-)이면 ∩, 0이면 정확한 변곡점입니다.
  const d2Inflection = (x) => {
    const fx = fInflection(x);
    return Math.pow(k, 2) * fx * (1 - fx / L) * (1 - (2 * fx) / L);
  };

  // 접선 방정식: L(x) = f'(t) * (x - t) + f(t)
  const getTangentY = (x, evalT) => {
    return dInflection(evalT) * (x - evalT) + fInflection(evalT);
  };

  const currentY = fInflection(t);
  const slope = dInflection(t);
  const curvature = d2Inflection(t);

  // 3. 상태에 따른 피드백 텍스트와 이펙트 테마
  let stageText = '';
  let stageBg = '';
  let stageColor = '';
  const effects = [];

  // 미세한 부동소수점 오차를 고려해 변곡점 영역(2.9 ~ 3.1)을 감지합니다.
  if (t < 2.9) {
    // 1단계: 가속 팽창기 (아래로 볼록)
    stageText = '🥐 [1단계: 가속 팽창기] 효모들이 마구 활동하며 밀가루가 기하급수적으로 부풀어요! (아래로 볼록 ∪)';
    stageBg = '#fef3c7'; // 노란색
    stageColor = '#92400e';
    // 부푸는 가스 방울 이펙트
    effects.push({ x: t - 0.2, y: currentY + 0.1, char: '✨' });
    effects.push({ x: t + 0.1, y: currentY - 0.2, char: '💨' });
  } else if (t >= 2.9 && t <= 3.1) {
    // 2단계: 골든 타임 (변곡점)
    stageText = '🎯 [골든 타임: 변곡점!] 가속에서 감속으로 바뀌는 운명의 전환점! 지금 오븐에 넣어야 최고의 식감입니다!';
    stageBg = '#f0fdf4'; // 초록색
    stageColor = '#166534';
    // 반짝이는 별빛 이펙트
    effects.push({ x: t - 0.3, y: currentY + 0.3, char: '⭐' });
    effects.push({ x: t + 0.3, y: currentY + 0.3, char: '⭐' });
  } else {
    // 3단계: 성장 둔화기 (위로 볼록)
    stageText = '📉 [3단계: 성장 둔화기] 밀가루의 한계에 도달하여 팽창이 둔화되고 눕습니다. (위로 볼록 ∩)';
    stageBg = '#f1f5f9'; // 회색
    stageColor = '#334155';
    // 시들시들 땀방울 이펙트
    effects.push({ x: t - 0.1, y: currentY + 0.2, char: '💦' });
    effects.push({ x: t + 0.2, y: currentY - 0.1, char: '💤' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'sans-serif', userSelect: 'none' }}>
      
      <style>{`
        .mafs-slide-container .MafsView {
          background-color: transparent !important;
        }
      `}</style>

      {/* [1단계] 메인 인터랙티브 발하 시뮬레이터 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '15px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>
          🍞 <b>[명품 식빵 제조용 효모 발효 곡선]</b>
        </div>
        
        <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginBottom: '12px', lineHeight: '1.4' }}>
          붉은색 <b>온도계 조종 핸들</b>을 끌며, 발효가 가장 빠르다가 둔화되는 <b>운명의 3초 변곡점</b>을 찾아보세요!
        </div>

        <div className="mafs-slide-container" style={{ 
          width: '100%', 
          overflow: 'hidden', 
          borderRadius: '10px', 
          background: '#fafaf9', // 아늑한 밀가루 반죽 베이지톤 테마
          border: '1px solid #e7e5e4'
        }}>
          <Mafs viewBox={{ x: [0, 6], y: [-0.5, 4.5] }} preserveAspectRatio={true} height={230}>
            <Coordinates.Cartesian />

            {/* 1. S자형 효모 성장 곡선 (로지스틱 곡선) */}
            <Plot.OfX y={fInflection} color="#d97706" weight={4.5} />

            {/* 2. 현재 상태에서의 접선 자 (기울기 자) */}
            <Plot.OfX y={(x) => getTangentY(x, t)} color="#78716c" weight={1.5} style="dashed" />

            {/* 변곡점 가이드라인 (x = 3 세로선) */}
            <Plot.OfX 
              y={(x) => x >= 2.98 && x <= 3.02 ? null : null} 
              color="#e11d48" 
            />
            {/* 변곡점 중심 마킹선 */}
            <Point x={3.0} y={fInflection(3.0)} color="#e11d48" size={6} />
            <Text x={3.0} y={fInflection(3.0) + 0.3} size={13} hAlign="center" color="#e11d48">🎯 변곡점 (3초)</Text>

            {/* 3. 현재 시각 t 에서의 접점 및 피드백 이모지 */}
            <Point x={t} y={currentY} color="#059669" size={5} />
            <Text x={t} y={currentY + 0.4} size={24} hAlign="center">🍞</Text>

            {/* 동적 이펙트 렌더링 */}
            {effects.map((ef, idx) => (
              <Text key={idx} x={ef.x} y={ef.y} size={15} hAlign="center">{ef.char}</Text>
            ))}

            {/* 4. 조작 핸들 */}
            <MovablePoint
              point={[t, currentY]}
              color={Theme.red}
              constrain={(pos) => {
                const clampedX = Math.min(5.5, Math.max(0.5, pos[0]));
                return [clampedX, fInflection(clampedX)];
              }}
              onMove={(pos) => setT(pos[0])}
            />
          </Mafs>
        </div>

        {/* 발효 상태 설명 배너 */}
        <div style={{ 
          marginTop: '12px', 
          padding: '10px', 
          borderRadius: '8px', 
          background: stageBg, 
          color: stageColor, 
          fontSize: '13px', 
          fontWeight: 'bold', 
          textAlign: 'center',
          lineHeight: '1.4',
          transition: 'all 0.2s ease'
        }}>
          {stageText}
        </div>
      </div>

      {/* [2단계] 하단 변화율 그래프 (기울기 자가 일어섰다 눕는 운동량 변화) */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '14px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>
          📈 발효 시간(<span style={{ color: '#64748b' }}>가로 축</span>)에 따른 <b>성장 속도(세로 y축 = 접선의 기울기)</b>
        </div>

        <div className="mafs-slide-container" style={{ borderRadius: '10px', overflow: 'hidden' }}>
          <Mafs viewBox={{ x: [0, 6], y: [-0.1, 1.4] }} preserveAspectRatio={false} height={140}>
            <Coordinates.Cartesian />
            
            {/* 속도 그래프: 변곡점(x=3)에서 극대를 가지는 가우스 종 모양 분포 곡선 */}
            <Plot.OfX
              y={dInflection}
              color="#059669"
              weight={3}
            />
            
            {/* 3초 지점 수직 점선 */}
            <Plot.OfX 
              y={(x) => x >= 2.98 && x <= 3.02 ? dInflection(x) : null} 
              color="#e11d48"
            />
            <Point x={3.0} y={dInflection(3.0)} color="#e11d48" size={5} />

            {/* 현재 시각 t에서의 속도 위치 점 */}
            <Point x={t} y={slope} color="#ef4444" size={6} />
          </Mafs>
        </div>

        {/* 실시간 대시보드 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '8px', borderRadius: '8px', fontSize: '12px', color: '#475569', marginTop: '8px' }}>
          <span>⏱️ 발효 경과: <b>{t.toFixed(1)}시간</b></span>
          <span style={{ color: '#059669' }}>📈 성장 속도: <b>+{slope.toFixed(2)}배 / h</b></span>
          <span style={{ color: '#b45309' }}>🌀 가속 강도: <b>{curvature >= 0 ? '+' : ''}{curvature.toFixed(2)}</b></span>
        </div>
      </div>

    </div>
  );
}