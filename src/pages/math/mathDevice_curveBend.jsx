import React from 'react';
import { Mafs, Coordinates, Plot, Theme, MovablePoint, Point, Text } from 'mafs';
import { toRange } from './mathDeviceShared';

// renderSpaceshipAndStone 대신 원래 규격인 renderCurveBend로 변경하여 export 합니다.
export function renderCurveBend(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  // 1. 우주선(가속 ∪)과 돌멩이(감속 ∩)의 경로 함수 정의
  // 우주선: 처음엔 느리지만 갈수록 수직으로 치솟는 가속 곡선 f(x) = 0.1 * x^2
  const fSpaceship = (x) => 0.1 * Math.pow(x, 2);
  const dSpaceship = (x) => 0.2 * x; // 우주선의 기울기(속도)

  // 돌멩이: 처음엔 빠르지만 갈수록 힘을 잃고 눕는 감속 곡선 g(x) = -0.1 * x^2 + 1.2 * x
  const fStone = (x) => -0.1 * Math.pow(x, 2) + 1.2 * x;
  const dStone = (x) => -0.2 * x + 1.2; // 돌멩이의 기울기(속도)

  // 2. 접선(기울기 자) 방정식 계산 함수
  const getSpaceshipTangent = (x, t) => {
    return dSpaceship(t) * (x - t) + fSpaceship(t);
  };

  const getStoneTangent = (x, t) => {
    return dStone(t) * (x - t) + fStone(t);
  };

  // 3. 상태 관리 (Zero-Hook 규칙 준수, 부모 sharedXByLog 사용)
  // t: 시간의 흐름 (x좌표, 기본값 1, 범위 0.2 ~ 5.8)
  const t = sharedXByLog?.[logIdx]?.t ?? 1;
  const setT = (val) => setSharedXByLog?.(prev => ({
    ...prev,
    [logIdx]: { ...(prev?.[logIdx] || {}), t: Math.min(5.8, Math.max(0.2, val)) }
  }));

  const currentShipY = fSpaceship(t);
  const currentStoneY = fStone(t);
  
  const shipSlope = dSpaceship(t);
  const stoneSlope = dStone(t);

  // 4. 움직임에 따른 역동적인 이펙트(이모지 파티클) 생성
  const effects = [];
  
  // 우주선: 가속도(속도)가 붙을수록 뒤에 뿜어져 나오는 엔진 불꽃(🔥)이 커지고 많아집니다.
  const fireCount = Math.floor(shipSlope * 4) + 1;
  for (let i = 0; i < fireCount; i++) {
    effects.push({
      x: t - 0.2 - (i * 0.15),
      y: currentShipY - 0.1 - (i * 0.08),
      char: i % 2 === 0 ? '🔥' : '✨'
    });
  }

  // 돌멩이: 속도가 떨어져 멈추기 직전일수록 중력의 힘(⬇️)과 힘겨움(💧)을 나타내는 파티클이 생깁니다.
  const gravityHeavy = 1.2 - stoneSlope; // 속도가 줄어들수록 중력감이 커짐
  const sweatCount = Math.floor(gravityHeavy * 3);
  for (let i = 0; i < sweatCount; i++) {
    effects.push({
      x: t + 0.1 + (i * 0.12),
      y: currentStoneY + 0.2 + (Math.sin(i) * 0.1),
      char: i % 2 === 0 ? '💧' : '⬇️'
    });
  }

  // 5. 실시간 피드백 텍스트 및 스타일 테마 분기
  let statusText = '⏱️ 시간 여행 중... 우주선과 돌멩이의 날아가는 힘을 관찰해 보세요!';
  let bgTheme = '#f8fafc';
  let textTheme = '#475569';

  if (t < 2) {
    statusText = '🪨 돌멩이 압승! 초반 기세가 아주 매서워요. (기울기 자가 바짝 서있음)';
    bgTheme = '#fffbeb'; // 노란색 테마
    textTheme = '#b45309';
  } else if (t >= 2 && t < 4) {
    statusText = '🚀 우주선 추격 시작! 엔진 불꽃이 점점 더 커지며 가속하고 있어요! (∪)';
    bgTheme = '#f0fdf4'; // 초록색 테마
    textTheme = '#15803d';
  } else if (t >= 4) {
    statusText = '⚡ 역전 완료! 우주선은 안드로메다로, 돌멩이는 힘이 빠져 눕습니다. (∩)';
    bgTheme = '#f0f9ff'; // 파란색 테마
    textTheme = '#0369a1';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'sans-serif', userSelect: 'none' }}>
      
      {/* Mafs 기본 검은 배경 지우기 */}
      <style>{`
        .mafs-slide-container .MafsView {
          background-color: transparent !important;
        }
      `}</style>

      {/* [1단계] 상단 조작계: 우주선 vs 돌멩이 운동 비교 (우주 테마) */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '15px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>
          🚀 <b>[우주선 vs 돌멩이 발사 실험]</b> 시간을 이동시켜 두 물체의 차이를 느껴보세요!
        </div>
        
        <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginBottom: '10px', lineHeight: '1.4' }}>
          그래프 위 <b>빨간색 조종 핸들(MovablePoint)</b>을 가로로 잡고 끌어 시간을 움직여 보세요.
        </div>

        {/* 시뮬레이션 패널 배경 */}
        <div className="mafs-slide-container" style={{ 
          width: '100%', 
          overflow: 'hidden', 
          borderRadius: '10px', 
          background: '#0b0f19', // 깊은 우주 밤하늘 테마 배경
          border: '1px solid #1e293b'
        }}>
          <Mafs viewBox={{ x: [0, 6], y: [-0.5, 4.0] }} preserveAspectRatio={true} height={220}>
            {/* 가이드 그리드선 없이 물체의 운동선만 직관적으로 표기 */}

            {/* 1. 우주선 가속 경로 (파란색) 및 접선 */}
            <Plot.OfX y={fSpaceship} color="#38bdf8" weight={4} />
            <Plot.OfX y={(x) => getSpaceshipTangent(x, t)} color="#0284c7" style="dashed" weight={1.5} />

            {/* 2. 돌멩이 감속 경로 (주황색) 및 접선 */}
            <Plot.OfX y={fStone} color="#fb923c" weight={4} />
            <Plot.OfX y={(x) => getStoneTangent(x, t)} color="#ea580c" style="dashed" weight={1.5} />

            {/* 실시간 파티클 이펙트 (엔진 불꽃 / 중력 땀방울) */}
            {effects.map((ef, idx) => (
              <Text key={idx} x={ef.x} y={ef.y} size={16}>
                {ef.char}
              </Text>
            ))}

            {/* 우주선 텍스트 이모지 */}
            <Text x={t} y={currentShipY + 0.3} size={22} hAlign="center">🚀</Text>

            {/* 돌멩이 텍스트 이모지 */}
            <Text x={t} y={currentStoneY + 0.3} size={22} hAlign="center">🪨</Text>

            {/* 시간 제어용 핸들 (우주선 축 위에 배치) */}
            <MovablePoint
              point={[t, currentShipY]}
              color={Theme.red}
              constrain={(pos) => {
                const clampedX = Math.min(5.8, Math.max(0.2, pos[0]));
                return [clampedX, fSpaceship(clampedX)];
              }}
              onMove={(pos) => setT(pos[0])}
            />
          </Mafs>
        </div>

        {/* 상황에 맞는 직관적 피드백 */}
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

      {/* [2단계] 하단 결과 매핑 그래프: 시간에 따른 속도(접선 기울기) 비교 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '14px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>
          📈 시간(<span style={{ color: '#64748b' }}>가로 t초</span>)에 따른 <b>기울기 자의 일어선 정도(<span style={{ color: '#be123c' }}>세로 y축 = 솟구치는 힘</span>)</b>
        </div>

        {/* 실시간 기울기(속도) 변화율 그래프 */}
        <Mafs viewBox={{ x: [0, 6], y: [-0.2, 1.5] }} preserveAspectRatio={false} height={160}>
          <Coordinates.Cartesian />
          
          {/* 우주선 기울기 변화율 선: 점점 증가하는 직선 (우상향) */}
          <Plot.OfX
            y={dSpaceship}
            color="#38bdf8"
            weight={3}
          />
          <Point x={t} y={shipSlope} color="#0284c7" size={6} />

          {/* 돌멩이 기울기 변화율 선: 점점 감소하는 직선 (우하향) */}
          <Plot.OfX
            y={dStone}
            color="#fb923c"
            weight={3}
          />
          <Point x={t} y={stoneSlope} color="#ea580c" size={6} />
        </Mafs>

        {/* 실시간 수치 정보 출력 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '8px', borderRadius: '8px', fontSize: '12px', color: '#475569', marginTop: '6px' }}>
          <span>⏱️ 경과 시간: <b>{t.toFixed(1)}초</b></span>
          <span style={{ color: '#0284c7' }}>🚀 우주선 기울기: <b>+{shipSlope.toFixed(2)} (가속 중!)</b></span>
          <span style={{ color: '#ea580c' }}>🪨 돌멩이 기울기: <b>+{stoneSlope.toFixed(2)} (감속 중...)</b></span>
        </div>
      </div>

    </div>
  );
}