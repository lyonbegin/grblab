import React from 'react';
import { Mafs, Coordinates, Line, Theme, MovablePoint, Point, Polygon } from 'mafs';

const HI2 = 7; // 물뿌리개의 오른쪽 끝 경계선 (고정)

// 원형 면적을 그리기 위해 360도 좌표를 계산하는 헬퍼 함수
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

  // [중요] 규칙 위반이었던 useState를 완전히 제거하고 부모 상태에서 직접 가져옵니다.
  // b1: 파란 그늘막 원의 중심 x좌표 (기본값 1.5)
  const b1 = sharedXByLog?.[logIdx]?.b1 ?? 1.5;
  const setB1 = (val) => setSharedXByLog?.(prev => ({
    ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), b1: Math.min(5, Math.max(-5, val)) }
  }));

  // b2: 주황 물뿌리개 원의 중심 x좌표 (기본값 4.0, 부모 상태로 완벽 통합)
  const b2 = sharedXByLog?.[logIdx]?.b2 ?? 4.0;
  const setB2 = (val) => {
    const clamped = Math.min(5, Math.max(-5, val));
    setSharedXByLog?.(prev => ({
      ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), b2: clamped }
    }));
  };

  const R = 2.0; // 원의 반지름 고정
  const d = Math.abs(b1 - b2); // 두 원의 중심 사이의 거리 (변동요인 x)

  // [수학 공식] 두 원의 2D 겹침(교집합) 면적 계산 (결과요인 y)
  let overlapArea = 0;
  if (d < 2 * R) {
    if (d === 0) {
      overlapArea = Math.PI * R * R; // 완전히 겹치면 원 넓이 그대로
    } else {
      const part1 = R * R * Math.acos(d / (2 * R));
      const part2 = (d / 2) * Math.sqrt(R * R - (d * d) / 4);
      overlapArea = 2 * (part1 - part2);
    }
  }

  // 2D 꽃밭 좌표 세팅 (0.8 간격의 2D 그리드)
  const flowerPositions = [
    { x: -3.5, y: 0.8 }, { x: -2.0, y: 0.8 }, { x: -0.5, y: 0.8 }, { x: 1.0, y: 0.8 }, { x: 2.5, y: 0.8 }, { x: 4.0, y: 0.8 }, { x: 5.5, y: 0.8 },
    { x: -3.0, y: 0.0 }, { x: -1.5, y: 0.0 }, { x: 0.0, y: 0.0 }, { x: 1.5, y: 0.0 }, { x: 3.0, y: 0.0 }, { x: 4.5, y: 0.0 }, { x: 6.0, y: 0.0 },
    { x: -3.5, y: -0.8 }, { x: -2.0, y: -0.8 }, { x: -0.5, y: -0.8 }, { x: 1.0, y: -0.8 }, { x: 2.5, y: -0.8 }, { x: 4.0, y: -0.8 }, { x: 5.5, y: -0.8 }
  ];

  const getFlowerState = (fx, fy) => {
    // 꽃이 그늘막 안에 있는지 체크
    const inShade = Math.pow(fx - b1, 2) + Math.pow(fy, 2) <= R * R;
    // 꽃이 물뿌리개 안에 있는지 체크
    const inWater = Math.pow(fx - b2, 2) + Math.pow(fy, 2) <= R * R;

    if (inShade && inWater) return '🌸'; // 겹침 영역 -> 활짝!
    if (inShade || inWater) return '🥀'; // 한쪽만 있음 -> 시듦!
    return '🌱'; // 아무것도 없음
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'sans-serif' }}>
      
      {/* 1단계: 2D 원형 조작 및 꽃의 생태 변화 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '15px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>
          🔵 <b>동그란 그늘막</b>과 🟠 <b>동그란 물뿌리개</b>가 겹쳐야 🌸 <b>꽃이 활짝 피어요!</b>
        </div>

        {/* 2D 꽃밭 실시간 렌더링 */}
        <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '24px', padding: '10px 0', background: '#f8fafc', borderRadius: '10px', marginBottom: '10px' }}>
          {flowerPositions.slice(7, 14).map((f, idx) => ( // UI 간소화를 위해 중앙 줄 꽃들만 이모지로 피드백
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span>{getFlowerState(f.x, 0)}</span>
              <span style={{ fontSize: '9px', color: '#94a3b8' }}>{f.x.toFixed(1)}</span>
            </div>
          ))}
        </div>

        <Mafs viewBox={{ x: [-5, 7], y: [-2.5, 2.5] }} preserveAspectRatio={true} height={180}>
          <Coordinates.Cartesian subdivisions={1} />
          
          {/* 파란색 그늘막 원형 면적 */}
          <Polygon
            points={getCirclePoints(b1, 0, R)}
            color={Theme.blue}
            fillOpacity={0.12}
          />
          
          {/* 주황색 물뿌리개 원형 면적 */}
          <Polygon
            points={getCirclePoints(b2, 0, R)}
            color={Theme.orange}
            fillOpacity={0.12}
          />

          {/* 2D 꽃밭에 심어진 수많은 꽃들의 개별 상태 변화 */}
          {flowerPositions.map((f, idx) => (
            <text
              key={idx}
              x={f.x}
              y={f.y}
              fontSize="16px"
              dominantBaseline="middle"
              textAnchor="middle"
              style={{ userSelect: 'none' }}
            >
              {getFlowerState(f.x, f.y)}
            </text>
          ))}

          {/* 그늘막 중심 조작 (b1) */}
          <MovablePoint
            point={[b1, 0]}
            constrain={(pos) => [Math.min(5, Math.max(-5, pos[0])), 0]}
            color={Theme.blue}
            onMove={(pos) => setB1(pos[0])}
          />

          {/* 물뿌리개 중심 조작 (b2) */}
          <MovablePoint
            point={[b2, 0]}
            constrain={(pos) => [Math.min(5, Math.max(-5, pos[0])), 0]}
            color={Theme.orange}
            onMove={(pos) => setB2(pos[0])}
          />
        </Mafs>
      </div>

      {/* 2단계: 거리(x) 대비 실제 겹친 2D 면적(y) 그래프 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '15px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>
          📈 두 원 중심 사이의 거리(<span style={{ color: '#ef4444' }}>가로 d</span>)와 <b>겹친 실제 면적(<span style={{ color: '#10b981' }}>세로 y</span>)</b>
        </div>

        <Mafs viewBox={{ x: [-0.5, 5.0], y: [-1, 14] }} preserveAspectRatio={false} height={180}>
          <Coordinates.Cartesian />
          
          {/* 원형 교집합 공식의 넓이(y) 변화를 그려내는 실시간 면적 곡선 */}
          <Mafs.Plot.OfX
            y={(x) => {
              if (x >= 4) return 0;
              const part1 = 4 * Math.acos(x / 4);
              const part2 = (x / 2) * Math.sqrt(4 - (x * x) / 4);
              return 2 * (part1 - part2);
            }}
            color={Theme.green}
            weight={4}
          />
          
          {/* 현재 거리 d와 실제 겹친 2D 넓이를 정확히 매핑하는 실시간 점 */}
          <Point x={d} y={overlapArea} color={Theme.red} size={6} />
        </Mafs>

        <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '8px', borderRadius: '8px', fontSize: '12px', color: '#475569', marginTop: '6px' }}>
          <span>📏 중심 사이의 거리(d): <b style={{ color: '#ef4444' }}>{d.toFixed(1)}칸</b></span>
          <span>🟢 겹친 꽃밭 넓이(y): <b style={{ color: '#16a34a' }}>{overlapArea.toFixed(1)}</b></span>
        </div>
      </div>

    </div>
  );
}