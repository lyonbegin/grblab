import React, { useState } from 'react';
import { Mafs, Coordinates, Line, Theme, MovablePoint, Point } from 'mafs';

export function renderBothConditions(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  // R: 두 원의 반지름 (2.0 고정)
  const R = 2.0;

  // b1: 파란 그늘막 원의 중심 x좌표 (y좌표는 0으로 고정)
  const b1 = sharedXByLog?.[logIdx]?.b1 ?? 1.5;
  const setB1 = (val) => setSharedXByLog?.(prev => ({
    ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), b1: Math.min(5, Math.max(-5, val)) }
  }));

  // b2: 주황 물뿌리개 원의 중심 x좌표 (y좌표는 0으로 고정, 로컬 백업)
  const [localB2, setLocalB2] = useState(4.0);
  const b2 = sharedXByLog?.[logIdx]?.b2 ?? localB2;
  const setB2 = (val) => {
    const clamped = Math.min(5, Math.max(-5, val));
    setLocalB2(clamped);
    setSharedXByLog?.(prev => ({
      ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), b2: clamped }
    }));
  };

  // 두 원의 중심 사이의 거리 (변동요인 x)
  const d = Math.abs(b1 - b2);

  // 💡 [수학 핵심] 두 원의 2D 겹침(교집합) 면적 계산 공식 (결과요인 y)
  let overlapArea = 0;
  if (d < 2 * R) {
    if (d === 0) {
      overlapArea = Math.PI * R * R; // 완전히 겹침 (약 12.57)
    } else {
      // 두 원의 겹친 렌즈 모양의 면적 공식
      const part1 = R * R * Math.acos(d / (2 * R));
      const part2 = (d / 2) * Math.sqrt(R * R - (d * d) / 4);
      overlapArea = 2 * (part1 - part2);
    }
  }

  // 꽃들이 2D 격자상에 심어져 있다고 가정하고 각 위치에서의 상태 계산
  // 평면 위에 고루 심어진 꽃들의 좌표들
  const flowerPositions = [
    { x: -3.5, y: 0.8 }, { x: -2.0, y: 0.8 }, { x: -0.5, y: 0.8 }, { x: 1.0, y: 0.8 }, { x: 2.5, y: 0.8 }, { x: 4.0, y: 0.8 }, { x: 5.5, y: 0.8 },
    { x: -3.0, y: 0.0 }, { x: -1.5, y: 0.0 }, { x: 0.0, y: 0.0 }, { x: 1.5, y: 0.0 }, { x: 3.0, y: 0.0 }, { x: 4.5, y: 0.0 }, { x: 6.0, y: 0.0 },
    { x: -3.5, y: -0.8 }, { x: -2.0, y: -0.8 }, { x: -0.5, y: -0.8 }, { x: 1.0, y: -0.8 }, { x: 2.5, y: -0.8 }, { x: 4.0, y: -0.8 }, { x: 5.5, y: -0.8 }
  ];

  const getFlowerState = (fx, fy) => {
    // 꽃이 그늘막 원 안에 있는가? (원 방정식: (x-b1)^2 + y^2 <= R^2)
    const inShade = Math.pow(fx - b1, 2) + Math.pow(fy, 2) <= R * R;
    // 꽃이 물뿌리개 원 안에 있는가? (원 방정식: (x-b2)^2 + y^2 <= R^2)
    const inWater = Math.pow(fx - b2, 2) + Math.pow(fy, 2) <= R * R;

    if (inShade && inWater) return '🌸'; // 둘 다 만족 -> 생생하게 활짝!
    if (inShade || inWater) return '🥀'; // 하나만 만족 -> 시듦!
    return '🌱'; // 아무 영역도 아님 (새싹)
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'sans-serif' }}>
      
      {/* [1단계] 2D 평면 정원 놀이터: 원형 그늘막과 원형 물뿌리개 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '15px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>
          🔵 <b>동그란 그늘막</b>과 🟠 <b>동그란 물</b>이 겹친 곳에만 🌸 <b>꽃이 활짝 피어요!</b>
        </div>

        <Mafs viewBox={{ x: [-5, 7], y: [-2.5, 2.5] }} preserveAspectRatio={true} height={200}>
          <Coordinates.Cartesian subdivisions={1} />
          
          {/* 가이드 배경으로 원들 그리기 */}
          {/* 파란색 그늘막 원 */}
          <line.Circle center={[b1, 0]} radius={R} strokeColor={Theme.blue} strokeWidth={2} fillColor={Theme.blue} fillOpacity={0.15} />
          
          {/* 주황색 물뿌리개 원 */}
          <line.Circle center={[b2, 0]} radius={R} strokeColor={Theme.orange} strokeWidth={2} fillColor={Theme.orange} fillOpacity={0.15} />

          {/* 평면 위의 꽃들을 실시간 텍스트(SVG text)로 렌더링 */}
          {flowerPositions.map((f, idx) => (
            <text
              key={idx}
              x={f.x}
              y={f.y}
              fontSize="16px"
              dominantBaseline="middle"
              textAnchor="middle"
              style={{ userSelect: 'none', transition: 'all 0.1s ease' }}
            >
              {getFlowerState(f.x, f.y)}
            </text>
          ))}

          {/* 파란 원의 중심을 조작하는 드래그 점 */}
          <MovablePoint
            point={[b1, 0]}
            constrain={(pos) => [Math.min(5, Math.max(-5, pos[0])), 0]}
            color={Theme.blue}
            onMove={(pos) => setB1(pos[0])}
          />

          {/* 주황 원의 중심을 조작하는 드래그 점 */}
          <MovablePoint
            point={[b2, 0]}
            constrain={(pos) => [Math.min(5, Math.max(-5, pos[0])), 0]}
            color={Theme.orange}
            onMove={(pos) => setB2(pos[0])}
          />
        </Mafs>
      </div>

      {/* [2단계] 결과 그래프: 중심 사이 거리(x)에 따른 실제 겹친 원의 넓이(y) */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '15px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>
          📈 두 원 중심 사이의 거리(<span style={{ color: '#ef4444' }}>가로 d</span>)와 <b>겹친 면적(<span style={{ color: '#10b981' }}>세로 넓이</span>)</b> 지도
        </div>

        <Mafs viewBox={{ x: [-0.5, 5.0], y: [-1, 14] }} preserveAspectRatio={false} height={180}>
          <Coordinates.Cartesian />
          
          {/* 원과 원의 교집합 면적을 실시간으로 꺾은선으로 렌더링하기 위한 플로팅 함수 */}
          {/* x축은 거리(0 ~ 4), y축은 겹친 실제 2D 면적 (최대 12.57 ~ 0) */}
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
          
          {/* 현재 나와 있는 두 원의 중심 거리와 실제 겹친 면적을 매핑해주는 실시간 빨간 점 */}
          <Point x={d} y={overlapArea} color={Theme.red} size={6} />
        </Mafs>

        <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '8px', borderRadius: '8px', fontSize: '12px', color: '#475569', marginTop: '6px', fontWeight: '500' }}>
          <span>📏 중심 거리(d): <b style={{ color: '#ef4444' }}>{d.toFixed(1)}칸</b></span>
          <span>🟢 겹친 꽃밭 실제 넓이: <b style={{ color: '#16a34a' }}>{overlapArea.toFixed(1)} (최대 { (Math.PI * 4).toFixed(1) })</b></span>
        </div>
      </div>

    </div>
  );
}