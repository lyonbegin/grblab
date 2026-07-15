import React from 'react';
// ⚠️ [수정] 꽃을 수학 좌표에 제대로 심기 위해 'Text' 컴포넌트를 추가로 불러왔습니다!
import { Mafs, Coordinates, Theme, MovablePoint, Point, Polygon, Plot, Text } from 'mafs';

const HI2 = 7; // 물뿌리개의 오른쪽 끝 경계선 (고정)

// 완벽한 원형 면적을 그리기 위한 좌표 계산 함수
const getCirclePoints = (cx, cy, r) => {
  const points = [];
  for (let i = 0; i <= 40; i++) {
    const theta = (i / 40) * 2 * Math.PI;
    points.push([cx + r * Math.cos(theta), cy + r * Math.sin(theta)]);
  }
  return points;
};

export function renderBothConditions(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  // b1: 파란 그늘막 원의 중심 x좌표 (기본값 -1.5)
  const b1 = sharedXByLog?.[logIdx]?.b1 ?? -1.5;
  const setB1 = (val) => setSharedXByLog?.(prev => ({
    ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), b1: Math.min(5, Math.max(-5, val)) }
  }));

  // b2: 주황 물뿌리개 원의 중심 x좌표 (기본값 2.0)
  const b2 = sharedXByLog?.[logIdx]?.b2 ?? 2.0;
  const setB2 = (val) => {
    const clamped = Math.min(5, Math.max(-5, val));
    setSharedXByLog?.(prev => ({
      ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), b2: clamped }
    }));
  };

  const R = 2.0; // 원의 반지름 (2칸)
  const d = Math.abs(b1 - b2); // 두 원 중심 사이의 거리 (변동요인 x)

  // [수학 공식] 두 원의 2D 겹침(교집합) 면적 계산 (결과요인 y)
  let overlapArea = 0;
  if (d < 2 * R) {
    if (d === 0) {
      overlapArea = Math.PI * R * R;
    } else {
      const part1 = R * R * Math.acos(d / (2 * R));
      const part2 = (d / 2) * Math.sqrt(R * R - (d * d) / 4);
      overlapArea = 2 * (part1 - part2);
    }
  }

  // 🌿 1. 넓은 꽃밭에 150송이 꽃 좌표 생성
  const flowerPositions = [];
  let bloomingCount = 0;
  let wiltedCount = 0;

  // 가로 -5.5 ~ 5.5 / 세로 -2.5 ~ 2.5 범위에 촘촘히 심기
  for (let x = -5.5; x <= 5.5; x += 0.8) {
    for (let y = -2.5; y <= 2.5; y += 0.8) {
      // 바둑판처럼 보이지 않게 미세하게 위치를 흔들어 자연스러운 정원 연출
      const jitterX = Math.sin(x * 11 + y * 7) * 0.2;
      const jitterY = Math.cos(x * 8 + y * 13) * 0.2;
      const fx = x + jitterX;
      const fy = y + jitterY;

      const inShade = Math.pow(fx - b1, 2) + Math.pow(fy, 2) <= R * R;
      const inWater = Math.pow(fx - b2, 2) + Math.pow(fy, 2) <= R * R;

      let emoji = '🌱';
      if (inShade && inWater) {
        emoji = '🌸';
        bloomingCount++;
      } else if (inShade || inWater) {
        emoji = '🥀';
        wiltedCount++;
      }

      flowerPositions.push({ x: fx, y: fy, emoji });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'sans-serif' }}>
      
      {/* ⚠️ [해결] Mafs의 고질적인 검은 배경을 강제로 지우는 CSS 주입 */}
      <style>{`
        .mafs-garden-container .MafsView {
          background-color: transparent !important;
        }
      `}</style>

      {/* [1단계] 2D 평면 정원 놀이터 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '15px', padding: '12px', border: '2px solid #e2e8f0' }}>
        
        {/* 실시간 꽃밭 현황판 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-around', 
          alignItems: 'center',
          padding: '10px', 
          background: '#f8fafc', 
          borderRadius: '12px', 
          marginBottom: '12px',
          border: '1px solid #f1f5f9'
        }}>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#16a34a' }}>
            🌸 활짝 핀 꽃: <span style={{ fontSize: '18px' }}>{bloomingCount}</span>송이
          </div>
          <div style={{ width: '1px', height: '20px', background: '#cbd5e1' }} />
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#64748b' }}>
            🥀 시든 꽃: <span style={{ fontSize: '18px' }}>{wiltedCount}</span>송이
          </div>
        </div>

        {/* 🌿 진짜 연초록색 잔디밭 배경 박스 */}
        <div className="mafs-garden-container" style={{ 
          width: '100%', 
          overflow: 'hidden', 
          borderRadius: '10px', 
          background: '#e8f5e9', // 화사한 잔디밭 색상
          border: '1px solid #c8e6c9'
        }}>
          {/* ⚠️ [해결] 찌그러짐 방지를 위해 viewBox 비율(12:6 = 2:1)을 정확히 맞춤 */}
          <Mafs 
            viewBox={{ x: [-6, 6], y: [-3, 3] }} 
            preserveAspectRatio={true} 
            height={250}
          >
            {/* 파란색 그늘막 영역 */}
            <Polygon points={getCirclePoints(b1, 0, R)} color={Theme.blue} fillOpacity={0.15} />
            
            {/* 주황색 물뿌리개 영역 */}
            <Polygon points={getCirclePoints(b2, 0, R)} color={Theme.orange} fillOpacity={0.15} />

            {/* ⚠️ [해결] 뭉쳐있던 꽃들을 원래 수학 위치(x, y)에 넓게 심어줌 */}
            {flowerPositions.map((f, idx) => (
              <Text key={idx} x={f.x} y={f.y} size={18}>
                {f.emoji}
              </Text>
            ))}

            {/* 조종 핸들 (그늘막/물뿌리개) */}
            <MovablePoint point={[b1, 0]} constrain={(pos) => [Math.min(5, Math.max(-5, pos[0])), 0]} color={Theme.blue} onMove={(pos) => setB1(pos[0])} />
            <MovablePoint point={[b2, 0]} constrain={(pos) => [Math.min(5, Math.max(-5, pos[0])), 0]} color={Theme.orange} onMove={(pos) => setB2(pos[0])} />
          </Mafs>
        </div>
      </div>

      {/* [2단계] 거리(x) vs 면적(y) 결과 연동 그래프 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '15px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>
          📈 중심 거리(<span style={{ color: '#ef4444' }}>가로 d</span>)와 <b>겹친 꽃밭 넓이(<span style={{ color: '#10b981' }}>세로 y</span>)</b> 연동 그래프
        </div>

        {/* 이 그래프는 넓이값을 보여주므로 좌표 눈금(Cartesian)을 남겨둡니다 */}
        <Mafs viewBox={{ x: [-0.5, 5.0], y: [-1, 14] }} preserveAspectRatio={false} height={180}>
          <Coordinates.Cartesian />
          
          <Plot.OfX
            y={(x) => {
              if (x >= 4) return 0;
              const part1 = 4 * Math.acos(x / 4);
              const part2 = (x / 2) * Math.sqrt(4 - (x * x) / 4);
              return 2 * (part1 - part2);
            }}
            color={Theme.green}
            weight={4}
          />
          
          <Point x={d} y={overlapArea} color={Theme.red} size={6} />
        </Mafs>

        <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '8px', borderRadius: '8px', fontSize: '12px', color: '#475569', marginTop: '6px', fontWeight: '500' }}>
          <span>📏 중심 거리(x축): <b style={{ color: '#ef4444' }}>{d.toFixed(1)}칸</b></span>
          <span>🟢 겹친 넓이(y축): <b style={{ color: '#16a34a' }}>{overlapArea.toFixed(1)}</b></span>
        </div>
      </div>

    </div>
  );
}