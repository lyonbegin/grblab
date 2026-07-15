import React from 'react';
import { Mafs, Coordinates, Plot, Theme, MovablePoint, Point, Line, Text } from 'mafs';
import { toRange } from './mathDeviceShared';

export function renderBowlShape(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  const xRange = toRange(v.xRange, [0, 10]);
  const yRange = toRange(v.yRange, [-4, 4]);

  // 1. 워터슬라이드의 2D 곡선 경로 정의 (S자 슬라이드 경로)
  // fSlide(x)는 슬라이드의 높낮이/경로를 결정합니다.
  const fSlide = (x) => {
    return 2.5 * Math.sin(x * 0.9) * Math.cos(x * 0.3);
  };

  // 2. 수학적인 곡률(Curvature) 계산 함수 (곡선의 급하기 y)
  // 1계 도함수(f')와 2계 도함수(f'')를 이용하여 곡선이 꺾이는 정도를 계산합니다.
  const getCurvature = (x) => {
    const h = 0.01;
    const f0 = fSlide(x - h);
    const f1 = fSlide(x);
    const f2 = fSlide(x + h);

    const df = (f2 - f0) / (2 * h); // 1차 미분 (기울기)
    const ddf = (f2 - 2 * f1 + f0) / (h * h); // 2차 미분 (휘어짐)

    // 곡률 공식: |f''| / (1 + f'^2)^(1.5)
    const k = Math.abs(ddf) / Math.pow(1 + df * df, 1.5);
    
    // 아이들이 보기 좋은 수치로 스케일 조정 (최대 대략 5 정도로 맵핑)
    return Math.min(5, k * 3);
  };

  // 3. 상태 관리 (Zero-Hook 규칙 준수, 부모 sharedXByLog 사용)
  // t: 슬라이드 위의 현재 튜브 위치 (x좌표, 기본값 2)
  const t = sharedXByLog?.[logIdx]?.t ?? 2;
  const setT = (val) => setSharedXByLog?.(prev => ({
    ...prev,
    [logIdx]: { ...(prev?.[logIdx] || {}), t: Math.min(9.5, Math.max(0.5, val)) }
  }));

  const currentY = fSlide(t); // 현재 튜브의 y위치
  const curvatureVal = getCurvature(t); // 현재 위치의 곡선 급하기(곡률)

  // 4. 물보라(Water Splash) 이펙트 좌표들 동적 계산
  // 곡선 급하기(곡률)가 클수록 더 많고 거대한 물보라 이펙트를 주변에 흩뿌립니다.
  const splashParticles = [];
  const splashCount = Math.floor(curvatureVal * 4); // 급할수록 물보라 개수 증가

  for (let i = 0; i < splashCount; i++) {
    // 튜브 주변으로 퍼져나가는 물방울 계산
    const angle = (i / splashCount) * 2 * Math.PI + t;
    const radius = 0.3 + (curvatureVal * 0.2) * (1 + Math.sin(i * 3));
    const sx = t + radius * Math.cos(angle);
    const sy = currentY + radius * Math.sin(angle);
    splashParticles.push({ x: sx, y: sy, char: i % 2 === 0 ? '💦' : '💧' });
  }

  // 5. 텍스트 피드백 메시지
  let statusText = '🛣️ 평온하게 미끄러지는 중... (직선에 가까워요)';
  let bgTheme = '#e0f2fe'; // 하늘색
  let textTheme = '#0369a1';

  if (curvatureVal > 1.2 && curvatureVal <= 3.0) {
    statusText = '🌊 몸이 부드럽게 쏠려요! (완만한 커브)';
    bgTheme = '#e0f2fe';
    textTheme = '#0284c7';
  } else if (curvatureVal > 3.0) {
    statusText = '⚡ 쏠림 최고조! 물보라 대폭발! (엄청 급한 코너!)';
    bgTheme = '#fee2e2'; // 붉은색 경고 테마
    textTheme = '#dc2626';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'sans-serif', userSelect: 'none' }}>
      
      {/* Mafs 기본 검은 배경 지우기 */}
      <style>{`
        .mafs-slide-container .MafsView {
          background-color: transparent !important;
        }
      `}</style>

      {/* [1단계] 상단 조작계: 구불구불 워터슬라이드 평면 (하늘색 수영장 테마) */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '15px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>
          🌊 <b>[워터슬라이드 실험실]</b> 튜브를 밀어 급커브를 탈출해 보세요!
        </div>
        
        <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginBottom: '10px', lineHeight: '1.4' }}>
          구불구불한 물길 위의 <b>빨간색 튜브(MovablePoint)</b>를 손가락으로 잡고 슈우욱 미끄러뜨려 보세요.
        </div>

        {/* 워터슬라이드 판넬 배경 */}
        <div className="mafs-slide-container" style={{ 
          width: '100%', 
          overflow: 'hidden', 
          borderRadius: '10px', 
          background: '#e0f2fe', // 시원한 풀장 하늘색 배경
          border: '1px solid #bae6fd'
        }}>
          <Mafs viewBox={{ x: [0, 10], y: [-3.5, 3.5] }} preserveAspectRatio={true} height={220}>
            {/* 눈금과 축은 없애고 슬라이드만 직관적으로 노출 */}

            {/* 슬라이드 물길 가이드 (두꺼운 하늘색 파이프 형태) */}
            <Plot.OfX y={fSlide} color="#38bdf8" weight={16} />
            <Plot.OfX y={fSlide} color="#0284c7" weight={2} />

            {/* 실시간 물보라 파티클 렌더링 (곡선이 급할수록 활성화) */}
            {splashParticles.map((sp, idx) => (
              <Text key={idx} x={sp.x} y={sp.y} size={16}>
                {sp.char}
              </Text>
            ))}

            {/* 슬라이드 위를 달리는 빨간색 튜브 (조종 핸들) */}
            <MovablePoint
              point={[t, currentY]}
              color={Theme.red}
              constrain={(pos) => {
                const clampedX = Math.min(9.5, Math.max(0.5, pos[0]));
                return [clampedX, fSlide(clampedX)];
              }}
              onMove={(pos) => setT(pos[0])}
            />
          </Mafs>
        </div>

        {/* 물보라 및 쏠림 피드백 실시간 출력 창 */}
        <div style={{ 
          marginTop: '10px', 
          padding: '8px', 
          borderRadius: '8px', 
          background: bgTheme, 
          color: textTheme, 
          fontSize: '13px', 
          fontWeight: 'bold', 
          textAlign: 'center',
          transition: 'all 0.2s ease'
        }}>
          {statusText}
        </div>
      </div>

      {/* [2단계] 하단 결과 매핑 그래프: 현재 튜브 위치의 곡률(y) 표시 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '14px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>
          📈 슬라이드 위치(<span style={{ color: '#0284c7' }}>가로 x</span>)에 따른 <b>코너의 급하기(<span style={{ color: '#dc2626' }}>세로 y축 = 쏠림의 크기</span>)</b>
        </div>

        {/* 실시간 꺾은선 곡률 그래프 */}
        <Mafs viewBox={{ x: [0, 10], y: [-0.5, 5.5] }} preserveAspectRatio={false} height={160}>
          <Coordinates.Cartesian />
          
          {/* 전체 슬라이드의 곡률 변화선을 미리 그리는 가이드라인 */}
          <Plot.OfX
            y={(x) => getCurvature(x)}
            color={Theme.green}
            weight={3}
          />
          
          {/* 현재 튜브 위치에서의 곡선 급하기(곡률)를 실시간으로 가리키는 빨간 점 */}
          <Point x={t} y={curvatureVal} color={Theme.red} size={6} />
        </Mafs>

        {/* 실시간 수학 데이터 매핑 뷰어 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '8px', borderRadius: '8px', fontSize: '12px', color: '#475569', marginTop: '6px' }}>
          <span>📏 슬라이드 내려온 거리: <b>{t.toFixed(1)}m</b></span>
          <span style={{ color: '#be123c' }}>💥 <b>옆으로 쏠리는 힘(곡선 급하기): {curvatureVal.toFixed(1)}</b></span>
        </div>
      </div>

    </div>
  );
}