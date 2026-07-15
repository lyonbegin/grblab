// ===========================================================
// no:"6a" "가장 높은 곳 — 여럿 중 최고/최저 짚기" 전용 인터랙션. (최대최소 세트 첫 칸)
//
// [핵심] 흩어진 점 몇 개 중 가장 높은/낮은 것을 고른다. 단순 비교. 반전 없음.
//   전역 비교의 씨앗 — 뒤에서 '구간'과 '끝점'으로 확장된다.
//
// [모델 필드] points 배열(각 {x,y})로 비교할 점들. 없으면 기본 제공.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Point, Line, Theme } from 'mafs';
import { toRange } from './mathDeviceShared';

export function renderHighestPoint(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  const pts = Array.isArray(v.points) && v.points.length
    ? v.points
    : [{ x: 1, y: 3 }, { x: 2, y: 6 }, { x: 3, y: 2 }, { x: 4, y: 5 }, { x: 5, y: 4 }];

  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const xRange = toRange(v.xRange, [0, Math.max(...xs) + 1]);
  const yRange = toRange(v.yRange, [0, Math.max(...ys) + 1]);

  // 어떤 걸 찾을지(최고/최저) 토글
  const mode = sharedXByLog?.[logIdx] ?? 'max';
  const setMode = (m) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: m }));

  const target = mode === 'max'
    ? pts.reduce((a, b) => (b.y > a.y ? b : a))
    : pts.reduce((a, b) => (b.y < a.y ? b : a));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '6px' }}>
          점들 중 <b>가장 높은 것</b>과 <b>가장 낮은 것</b>을 찾아 보자
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button type="button" onClick={() => setMode('max')}
            style={{ padding: '4px 12px', borderRadius: '6px', cursor: 'pointer',
              border: mode === 'max' ? '2px solid #2e7d32' : '1px solid #ccc',
              background: mode === 'max' ? '#e6f4ea' : '#fff', fontWeight: mode === 'max' ? 'bold' : 'normal' }}>가장 높은 곳</button>
          <button type="button" onClick={() => setMode('min')}
            style={{ padding: '4px 12px', borderRadius: '6px', cursor: 'pointer',
              border: mode === 'min' ? '2px solid #c0392b' : '1px solid #ccc',
              background: mode === 'min' ? '#fdecea' : '#fff', fontWeight: mode === 'min' ? 'bold' : 'normal' }}>가장 낮은 곳</button>
        </div>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: mode === 'max' ? '#2e7d32' : '#c0392b', marginTop: '6px' }}>
          {mode === 'max' ? '최고' : '최저'} = ({target.x}, {target.y})
        </div>
      </div>
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={280}>
          <Coordinates.Cartesian />
          {/* 목표 높이 기준선 */}
          <Line.Segment point1={[xRange[0], target.y]} point2={[xRange[1], target.y]}
            color={mode === 'max' ? Theme.green : Theme.red} opacity={0.4} />
          {pts.map((p, i) => (
            <Point key={i} x={p.x} y={p.y}
              color={p === target ? (mode === 'max' ? Theme.green : Theme.red) : Theme.blue} />
          ))}
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          <span style={{ fontSize: '11px' }}>모든 점의 높이를 견주어, {mode === 'max' ? '가장 높은' : '가장 낮은'} 점 하나를 고릅니다.</span>
        </div>
      </div>
    </div>
  );
}
