import React from 'react';
import { Mafs, Coordinates, Line, Theme, MovablePoint, Point, Polygon, Plot } from 'mafs';

// 원형 면적을 부드럽게 그리기 위해 360도 좌표 배열을 만드는 헬퍼 함수
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

  // ⚠️ [에러 해결 1] useState를 완벽히 제거하고 모든 상태를 부모 sharedXByLog로 일원화합니다.
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

  const R = 2.0; // 원의 반지름 (2칸 고정)
  const d = Math.abs(b1 - b2); // 두 원의 중심 사이의 거리 (변동요인 x)

  // 💡 원과 원이 겹친 실제 2D 면적 계산 공식 (결과요인 y)
  let overlapArea = 0;
  if (d < 2 * R) {
    if (d === 0) {
      overlapArea = Math.PI * R * R; // 완전히 겹치면 원의 총 면적
    } else {
      const part1 = R * R * Math.acos(d / (2 * R));
      const part2 = (d / 2) * Math.sqrt(R * R - (d * d) / 4);
      overlapArea = 2 * (part1 - part2);
    }
  }

  // 2D 꽃밭에 심어둘 꽃들의 좌표 배열
  const flowerPositions = [
    { x: -4.0, y: 1.0 }, { x: -2.5, y: 1.0 }, { x: -1.0, y: 1.0 }, { x: 0.5, y: 1.0 }, { x: 2.0, y: 1.0 }, { x: 3.5, y: 1.0 }, { x: 5.0, y: 1.0 },
    { x: -3.5, y: 0.0 }, { x: -2.0, y: 0.0 }, { x: -0.5, y: 0.0 }, { x: 1.0, y: 0.0 }, { x: 2.5, y: 0.0 }, { x: 4.0, y: 0.0 }, { x: 5.5, y: 0.0 },
    { x: -4.0, y: -1.0 }, { x: -2.5, y: -1.0 }, { x: -1.0, y: -1.0 }, { x: 0.5, y: -1.0 }, { x: 2.0, y: -1.0 }, { x: 3.5, y: -1.0 }, { x: 5.0, y: -1.0 }
  ];

  // 꽃의 상태 구하는 함수: 겹치면 활짝(🌸), 한쪽만 만족하면 시듦(🥀), 아무것도 없으면 새싹(🌱)
  const getFlowerState = (fx, fy) => {
    const inShade = Math.pow(fx - b1, 2) + Math.pow(fy, 2) <= R * R;
    const inWater = Math.pow(fx - b2, 2) + Math.pow(fy, 2) <= R * R;

    if (inShade && inWater) return '🌸'; // 겹침 영역 -> 활짝 피어남!
    if (inShade || inWater) return '🥀'; // 한 가지만 있음 -> 시들어 버림!
    return '🌱';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'sans-serif' }}>
      
      {/* 1단계: 2D 원형 조작판 (꽃밭 놀이터) */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '15px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>
          🔵 <b>원형 그늘막</b>과 🟠 <b>원형 물뿌리개</b>가 동시에 겹치는 영역에만 🌸 <b>꽃이 활짝 피어납니다!</b>
        </div>

        <Mafs viewBox={{ x: [-5.5, 6.5], y: [-2.2, 2.2] }} preserveAspectRatio={true} height={200}>
          <Coordinates.Cartesian subdivisions={1} />
          
          {/* 파란색 그늘막 영역 채우기 */}
          <Polygon
            points={getCirclePoints(b1, 0, R)}
            color={Theme.blue}
            fillOpacity={0.12}
          />
          
          {/* 주황색 물뿌리개 영역 채우기 */}
          <Polygon
            points={getCirclePoints(b2, 0, R)}
            color={Theme.orange}
            fillOpacity={0.12}
          />

          {/* 2D 꽃밭의 실시간 상태 변화 렌더링 */}
          {flowerPositions.map((f, idx) => (
            <text
              key={idx}
              x={f.x}
              y={f.y}
              fontSize="18px"
              dominantBaseline="middle"
              textAnchor="middle"
              style={{ userSelect: 'none' }}
            >
              {getFlowerState(f.x, f.y)}
            </text>
          ))}

          {/* 그늘막 중심 조종 핸들 */}
          <MovablePoint
            point={[b1, 0]}
            constrain={(pos) => [Math.min(5, Math.max(-5, pos[0])), 0]}
            color={Theme.blue}
            onMove={(pos) => setB1(pos[0])}
          />

          {/* 물뿌리개 중심 조종 핸들 */}
          <MovablePoint
            point={[b2, 0]}
            constrain={(pos) => [Math.min(5, Math.max(-5, pos[0])), 0]}
            color={Theme.orange}
            onMove={(pos) => setB2(pos[0])}
          />
        </Mafs>
      </div>

      {/* 2단계: 결과 그래프 (중심 사이 거리 x 대비 실제 겹친 넓이 y) */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '15px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>
          📈 두 원 중심 사이의 거리(<span style={{ color: '#ef4444' }}>가로 d</span>)와 <b>겹친 진짜 면적(<span style={{ color: '#10b981' }}>세로 y</span>)</b>의 연동 지도
        </div>

        <Mafs viewBox={{ x: [-0.5, 5.0], y: [-1, 14] }} preserveAspectRatio={false} height={180}>
          <Coordinates.Cartesian />
          
          {/* ⚠️ [에러 해결 2] Mafs.Plot.OfX 가 아닌 독립 임포트한 Plot.OfX 를 사용합니다 */}
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
          
          {/* 두 중심 거리(d)에 매핑되는 현재 실제 겹친 면적(y)의 위치 표시 점 */}
          <Point x={d} y={overlapArea} color={Theme.red} size={6} />
        </Mafs>

        <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '8px', borderRadius: '8px', fontSize: '12px', color: '#475569', marginTop: '6px', fontWeight: '500' }}>
          <span>📏 두 원 중심 사이의 거리(d): <b style={{ color: '#ef4444' }}>{d.toFixed(1)}칸</b></span>
          <span>🟢 겹쳐서 활짝 핀 꽃밭 넓이(y): <b style={{ color: '#16a34a' }}>{overlapArea.toFixed(1)}</b></span>
        </div>
      </div>

    </div>
  );
}