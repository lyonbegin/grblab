// ===========================================================
// no:"11-1" "한 조건은 하나의 띠를 만든다" (연립부등식의 선행개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: 구간의 왼끝·오른끝 슬라이더
//   - 결과도형: 조건을 만족하는 값들이 하나의 띠(색칠 구간)로 나타남
//   - 그래프: 수직선 위 그 구간이 굵게 표시
//   sharedXByLog[logIdx] = { lo, hi }.
//
// [핵심] 하나의 조건은 수직선 위 하나의 띠(구간)로 그려진다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Line, Point, Theme } from 'mafs';

export function renderOneBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_oneBand 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }

  const XMAX = 10;
  const st = sharedXByLog?.[logIdx] || {};
  const lo = st.lo ?? 2;
  const hi = st.hi ?? 7;
  const patch = (p) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { lo, hi, ...(prev?.[logIdx] || {}), ...p } }));

  const samples = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#5f5e5a' }}>왼끝</div>
            <input type="range" min={0} max={XMAX} step={1} value={lo}
              onChange={(e) => patch({ lo: Math.min(hi, parseInt(e.target.value, 10)) })} style={{ width: '120px' }} />
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2f5a99' }}>{lo}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#5f5e5a' }}>오른끝</div>
            <input type="range" min={0} max={XMAX} step={1} value={hi}
              onChange={(e) => patch({ hi: Math.max(lo, parseInt(e.target.value, 10)) })} style={{ width: '120px' }} />
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2f5a99' }}>{hi}</div>
          </div>
        </div>
        {/* 값 알갱이: 띠 안이면 색칠 */}
        <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
          {samples.map(s => {
            const inside = s >= lo && s <= hi;
            return (
              <div key={s} style={{
                width: '24px', height: '24px', borderRadius: '5px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 'bold',
                background: inside ? '#5a86c4' : '#e5e0d3', color: inside ? '#fff' : '#999'
              }}>{s}</div>
            );
          })}
        </div>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginTop: '6px' }}>
          조건을 만족하는 값들이 <b>하나의 띠</b>({lo}~{hi})로 모입니다
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: [-1, XMAX + 1], y: [-2, 2] }} preserveAspectRatio={false} height={130}>
          <Coordinates.Cartesian yAxis={{ lines: false }} />
          <Line.Segment point1={[lo, 0]} point2={[hi, 0]} color={Theme.blue} />
          <Point x={lo} y={0} color={Theme.red} />
          <Point x={hi} y={0} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          하나의 조건 = 수직선 위 <b>하나의 띠(구간)</b>
        </div>
      </div>
    </div>
  );
}
