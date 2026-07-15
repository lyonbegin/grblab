// ===========================================================
// no:"11-2" "그래프에서 조건을 색칠한다"
// x = 기준선 높이(k), y = 만족 구간의 폭(=2*sqrt(k), 곡선 y=x^2 기준).
//
// [수정 요지]
//   1) Plot.Inequality 문법 오류 수정.
//      기존: y={{ '<=': (x)=>(x*x<k?k:0), '>': ()=>1e9 }}
//        → '>' 가 1e9 를 반환해 "y>1e9 이면서 y<=..." 라는 모순 조건이 되어 음영이
//          안 그려지거나 엉뚱하게 나왔다.
//      수정: 곡선 아래(y >= x*x)이면서 기준선 아래(y <= k)인 영역으로 정확히 표현.
//   2) 드래그점을 더 크고 명확하게(기준선 위에 올려) 잡기 쉽게 했다. 슬라이더도 병행.
//
// [도형] 곡선 y=x^2 + 기준선(드래그) + 그 사이 음영.
// [그래프] x=기준높이 k, y=만족구간 폭. 제곱근 곡선.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, MovablePoint, Theme } from 'mafs';

export function renderShadeBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const k = sharedXByLog?.[logIdx]?.k ?? 4;
  const setK = (kk) => setSharedXByLog?.(prev => ({
    ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), k: Math.min(9, Math.max(0, kk)) }
  }));
  const width = 2 * Math.sqrt(Math.max(0, k));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 도형: 곡선 + 기준선(드래그) + 음영 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '10px', padding: '6px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          👉 <b>초록 점</b>을 위아래로 끌어 기준선을 옮겨보세요
        </div>
        <Mafs viewBox={{ x: [-4, 4], y: [0, 9] }} preserveAspectRatio={false} height={240}>
          <Coordinates.Cartesian />
          {/* 음영: 곡선 위(y >= x^2)이면서 기준선 아래(y <= k)인 영역 = 조건을 만족하는 부분 */}
          <Plot.Inequality
            y={{ '>=': (x) => x * x, '<=': () => k }}
            color={Theme.green}
          />
          <Plot.OfX y={(x) => x * x} color={Theme.blue} />
          {/* 기준선 y=k 를 눈에 보이게 */}
          <Line.Segment point1={[-4, k]} point2={[4, k]} color={Theme.green} />
          {/* 드래그점: 기준선 위, 잡기 쉬운 위치 */}
          <MovablePoint
            point={[-3.2, k]}
            constrain={(pos) => [-3.2, Math.min(9, Math.max(0, pos[1]))]}
            color={Theme.green}
            onMove={(pos) => setK(pos[1])}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          기준선 높이 <b>{k.toFixed(1)}</b> · 만족 구간 폭 <b>{width.toFixed(2)}</b>
        </div>
        <input type="range" min={0} max={9} step={0.1} value={k}
          onChange={(e) => setK(parseFloat(e.target.value))}
          style={{ width: '90%', display: 'block', margin: '4px auto 0' }} />
      </div>

      {/* 그래프: x=기준높이 k, y=만족구간 폭. 제곱근 곡선 */}
      <div className="viz-box">
        <Mafs viewBox={{ x: [0, 9], y: [0, 7] }} preserveAspectRatio={false} height={220}>
          <Coordinates.Cartesian />
          <Plot.OfX y={(x) => 2 * Math.sqrt(Math.max(0, x))} color={Theme.orange} />
          <Point x={k} y={width} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로=기준선 높이, 세로=만족 구간 폭 — <b>제곱근 곡선</b>으로 늘어납니다(처음엔 빠르게, 나중엔 느리게)
        </div>
      </div>
    </div>
  );
}
