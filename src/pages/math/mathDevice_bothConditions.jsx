import React from 'react';
import { Mafs, Theme, MovablePoint, Point, Polygon, Plot } from 'mafs';

const HI2 = 7; // 물뿌리개의 오른쪽 끝 경계선 (고정)

// 원형 그늘막/물뿌리개를 매끄럽게 그리기 위한 360도 좌표 계산 함수
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

  // 🌿 1. 빽빽한 꽃밭 좌표 및 실시간 상태 동적 생성 (약 150송이)
  const flowerPositions = [];
  let bloomingCount = 0;
  let wiltedCount = 0;

  // 가로 -5.2부터 6.2까지, 세로 -2.0부터 2.0까지 촘촘하게 심기
  for (let x = -5.2; x <= 6.2; x += 0.7) {
    for (let y = -2.0; y <= 2.0; y += 0.65) {
      const jitterX = Math.sin(x * 11.5 + y * 8.3) * 0.15;
      const jitterY = Math.cos(x * 7.1 + y * 13.9) * 0.15;
      const fx = x + jitterX;
      const fy = y + jitterY;

      const inShade = Math.pow(fx - b1, 2) + Math.pow(fy, 2) <= R * R;
      const inWater = Math.pow(fx - b2, 2) + Math.pow(fy, 2) <= R * R;

      let emoji = '🌱';
      if (inShade && inWater) {
        emoji = '🌸'; // 둘 다 만족하면 활짝!
        bloomingCount++;
      } else if (inShade || inWater) {
        emoji = '🥀'; // 하나만 만족하면 시듦!
        wiltedCount++;
      }

      flowerPositions.push({ x: fx, y: fy, emoji });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'sans-serif' }}>
      
      {/* [1단계] 2D 평면 정원 놀이터 (잔디밭 테마 적용) */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '15px', padding: '12px', border: '2px solid #e2e8f0' }}>
        
        {/* 실시간 정원 스코어보드 */}
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

        {/* 🌿 검은 배경을 지우고 화사한 연초록 잔디밭 느낌으로 스타일 수정 */}
        <div style={{ 
          width: '100%', 
          overflow: 'hidden', 
          borderRadius: '10px', 
          background: '#e2f5d3', // 산뜻한 연초록색 잔디밭 배경
          border: '1px solid #c2e3a6'
        }}>
          {/* css-overrides를 통과시켜 Mafs 자체의 검은색 디폴트 백그라운드를 무력화 */}
          <Mafs 
            viewBox={{ x: [-5.5, 6.5], y: [-2.2, 2.2] }} 
            preserveAspectRatio={true} 
            height={250}
            style={{ '--mafs-bg': 'transparent' }} // Mafs 검은 배경 투명화
          >
            {/* ⚠️ 눈금과 좌표 숫자를 보여주는 Cartesian 컴포넌트를 완전히 삭제했습니다. */}
            
            {/* 파란색 그늘막 영역 (반투명 채우기) */}
            <Polygon
              points={getCirclePoints(b1, 0, R)}
              color={Theme.blue}
              fillOpacity={0.15}
            />
            
            {/* 주황색 물뿌리개 영역 (반투명 채우기) */}
            <Polygon
              points={getCirclePoints(b2, 0, R)}
              color={Theme.orange}
              fillOpacity={0.15}
            />

            {/* 생성된 150여 개의 꽃들을 평면 상에 렌더링 */}
            {flowerPositions.map((f, idx) => (
              <text
                key={idx}
                x={f.x}
                y={f.y}
                fontSize="15px"
                dominantBaseline="middle"
                textAnchor="middle"
                style={{ userSelect: 'none', transition: 'all 0.15s ease' }}
              >
                {f.emoji}
              </text>
            ))}

            {/* 그늘막 조종 파란 점 */}
            <MovablePoint
              point={[b1, 0]}
              constrain={(pos) => [Math.min(5, Math.max(-5, pos[0])), 0]}
              color={Theme.blue}
              onMove={(pos) => setB1(pos[0])}
            />

            {/* 물뿌리개 조종 주황 점 */}
            <MovablePoint
              point={[b2, 0]}
              constrain={(pos) => [Math.min(5, Math.max(-5, pos[0])), 0]}
              color={Theme.orange}
              onMove={(pos) => setB2(pos[0])}
            />
          </Mafs>
        </div>
      </div>

      {/* [2단계] 결과 연동 그래프 (그래프 영역은 좌표가 남아있어야 학습이 되므로 유지) */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '15px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>
          📈 중심 거리(<span style={{ color: '#ef4444' }}>가로 d</span>)와 <b>겹친 꽃밭 넓이(<span style={{ color: '#10b981' }}>세로 y</span>)</b> 연동 그래프
        </div>

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
          
          {/* 현재 거리 d와 겹친 실제 면적을 가리키는 붉은 점 */}
          <Point x={d} y={overlapArea} color={Theme.red} size={6} />
        </Mafs>

        <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '8px', borderRadius: '8px', fontSize: '12px', color: '#475569', marginTop: '6px', fontWeight: '500' }}>
          <span>📏 두 원 중심 사이의 거리: <b style={{ color: '#ef4444' }}>{d.toFixed(1)}칸</b></span>
          <span>🟢 동시에 만족하는 넓이(y): <b style={{ color: '#16a34a' }}>{overlapArea.toFixed(1)}</b></span>
        </div>
      </div>

    </div>
  );
}