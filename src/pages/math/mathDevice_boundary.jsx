// ===========================================================
// no:"9-5" "경계는 포함될 수도, 아닐 수도" (부등식=위/아래의 선행개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: 기준값 슬라이더 + "경계 포함(≤)/불포함(<)" 토글 버튼
//   - 결과도형: 딱 기준값인 알갱이가 포함이면 초록(통과), 불포함이면 회색(막힘)
//   - 그래프: 수직선 끝점이 채운 점(포함)/빈 점(불포함)으로 표시
//   sharedXByLog[logIdx] = { thr, inclusive }.
//
// [핵심] "크거나 같다(≤)"와 "크다(<)"는 딱 경계값 하나가 들어가느냐로 갈린다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Point, Line, Theme } from 'mafs';

export function renderBoundary(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_boundary 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }

  const XMAX = 10;
  const st = sharedXByLog?.[logIdx] || {};
  const thr = st.thr ?? 5;
  const inclusive = st.inclusive ?? true;
  const patch = (p) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { thr, inclusive, ...(prev?.[logIdx] || {}), ...p } }));

  const samples = [3, 4, 5, 6, 7];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ textAlign: 'center', marginBottom: '4px', fontSize: '12px', color: '#5f5e5a' }}>
          기준값 = {thr} · 경계값(딱 {thr})을 포함할지 골라보세요
        </div>
        <input type="range" min={1} max={XMAX - 1} step={1} value={thr}
          onChange={(e) => patch({ thr: parseInt(e.target.value, 10) })} style={{ width: '80%', display: 'block', margin: '0 auto' }} />
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '8px' }}>
          <button type="button" onClick={() => patch({ inclusive: true })}
            style={{ padding: '4px 12px', borderRadius: '6px', cursor: 'pointer',
              border: inclusive ? '2px solid #2e7d32' : '1px solid #ccc',
              background: inclusive ? '#d7ecd7' : '#fff', fontWeight: inclusive ? 'bold' : 'normal' }}>
            크거나 같다 (≤, 경계 포함)
          </button>
          <button type="button" onClick={() => patch({ inclusive: false })}
            style={{ padding: '4px 12px', borderRadius: '6px', cursor: 'pointer',
              border: !inclusive ? '2px solid #c0392b' : '1px solid #ccc',
              background: !inclusive ? '#f3d9d9' : '#fff', fontWeight: !inclusive ? 'bold' : 'normal' }}>
            크다 (&lt;, 경계 빼기)
          </button>
        </div>
        {/* 알갱이: 경계값 처리 */}
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '8px' }}>
          {samples.map(s => {
            const isBoundary = s === thr;
            const pass = isBoundary ? inclusive : s > thr;
            return (
              <div key={s} style={{
                width: '30px', height: '30px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 'bold',
                background: pass ? '#2e7d32' : '#bbb', color: '#fff',
                outline: isBoundary ? '3px solid #7b3fa0' : 'none'
              }}>{s}</div>
            );
          })}
        </div>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginTop: '6px' }}>
          보라 테두리가 <b>경계값({thr})</b> — {inclusive ? '포함이라 통과(초록)' : '빼기라 막힘(회색)'}
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: [-1, XMAX + 1], y: [-2, 2] }} preserveAspectRatio={false} height={140}>
          <Coordinates.Cartesian yAxis={{ lines: false }} />
          <Line.Segment point1={[thr, 0]} point2={[XMAX, 0]} color={Theme.green} />
          {/* 끝점: 포함이면 채운 점(빨강), 불포함이면 흰 점 */}
          <Point x={thr} y={0} color={inclusive ? Theme.red : 'white'} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          끝점이 <b>{inclusive ? '채운 점(포함, ≤)' : '빈 점(불포함, <)'}</b>으로 표시됩니다
        </div>
      </div>
    </div>
  );
}
