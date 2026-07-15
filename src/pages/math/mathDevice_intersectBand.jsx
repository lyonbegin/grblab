// ===========================================================
// no:"11-3" "겹침 = 교집합" (연립부등식의 선행개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: 두 띠 각각의 위치 슬라이더 (A띠, B띠)
//   - 결과도형: 두 띠가 포개지는 부분만 진하게 표시
//   - 그래프: 수직선에서 두 구간의 겹치는 구간이 강조
//   sharedXByLog[logIdx] = { aLo, aHi, bLo, bHi }.
//
// [핵심] '둘 다'는 두 구간이 겹치는 부분(교집합)뿐이다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Line, Theme } from 'mafs';

export function renderIntersectBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_intersectBand 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }

  const XMAX = 10;
  const st = sharedXByLog?.[logIdx] || {};
  const aLo = st.aLo ?? 1, aHi = st.aHi ?? 6;
  const bLo = st.bLo ?? 4, bHi = st.bHi ?? 9;
  const patch = (p) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { aLo, aHi, bLo, bHi, ...(prev?.[logIdx] || {}), ...p } }));

  const oLo = Math.max(aLo, bLo), oHi = Math.min(aHi, bHi);
  const hasOverlap = oLo <= oHi;

  const W = 300, PAD = 20, barW = W - PAD * 2;
  const px = (x) => PAD + (x / XMAX) * barW;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', fontSize: '11px' }}>
          <div>A띠 왼끝<input type="range" min={0} max={XMAX} step={1} value={aLo} onChange={(e) => patch({ aLo: Math.min(aHi, +e.target.value) })} style={{ width: '80px' }} /></div>
          <div>A띠 오른끝<input type="range" min={0} max={XMAX} step={1} value={aHi} onChange={(e) => patch({ aHi: Math.max(aLo, +e.target.value) })} style={{ width: '80px' }} /></div>
          <div>B띠 왼끝<input type="range" min={0} max={XMAX} step={1} value={bLo} onChange={(e) => patch({ bLo: Math.min(bHi, +e.target.value) })} style={{ width: '80px' }} /></div>
          <div>B띠 오른끝<input type="range" min={0} max={XMAX} step={1} value={bHi} onChange={(e) => patch({ bHi: Math.max(bLo, +e.target.value) })} style={{ width: '80px' }} /></div>
        </div>
        <svg width={W} height={80} viewBox={`0 0 ${W} 80`} style={{ display: 'block', margin: '8px auto 0' }}>
          {/* A띠 */}
          <rect x={px(aLo)} y={12} width={px(aHi) - px(aLo)} height={16} fill="#5a86c4" opacity="0.6" />
          <text x={PAD - 4} y={24} fontSize="11" textAnchor="end" fill="#2f5a99">A</text>
          {/* B띠 */}
          <rect x={px(bLo)} y={34} width={px(bHi) - px(bLo)} height={16} fill="#e8a13a" opacity="0.6" />
          <text x={PAD - 4} y={46} fontSize="11" textAnchor="end" fill="#b5701a">B</text>
          {/* 겹침 */}
          {hasOverlap && <rect x={px(oLo)} y={56} width={px(oHi) - px(oLo)} height={16} fill="#2e7d32" />}
          <text x={PAD - 4} y={68} fontSize="11" textAnchor="end" fill="#2e7d32">겹침</text>
        </svg>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          {hasOverlap ? `겹치는 부분: ${oLo} ~ ${oHi} (둘 다 만족)` : '겹치는 부분이 없습니다'}
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: [-1, XMAX + 1], y: [-2, 2] }} preserveAspectRatio={false} height={130}>
          <Coordinates.Cartesian yAxis={{ lines: false }} />
          {hasOverlap && <Line.Segment point1={[oLo, 0]} point2={[oHi, 0]} color={Theme.green} />}
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          '둘 다 만족'은 <b>겹치는 구간(교집합)</b>뿐입니다
        </div>
      </div>
    </div>
  );
}
