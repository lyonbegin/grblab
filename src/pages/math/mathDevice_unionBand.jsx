// ===========================================================
// no:"11-4" "합침 = 합집합" (연립부등식의 선행개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: 두 띠 각각 위치 슬라이더
//   - 결과도형: 둘 중 하나라도 덮인 부분 전체가 표시
//   - 그래프: 수직선에서 두 구간을 합친 전체가 강조 (떨어져 있으면 두 조각)
//   sharedXByLog[logIdx] = { aLo, aHi, bLo, bHi }.
//
// [핵심] '둘 중 하나라도'는 두 구간을 합친 전체(합집합)다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Line, Theme } from 'mafs';

export function renderUnionBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_unionBand 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }

  const XMAX = 10;
  const st = sharedXByLog?.[logIdx] || {};
  const aLo = st.aLo ?? 1, aHi = st.aHi ?? 4;
  const bLo = st.bLo ?? 6, bHi = st.bHi ?? 9;
  const patch = (p) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { aLo, aHi, bLo, bHi, ...(prev?.[logIdx] || {}), ...p } }));

  const overlap = Math.max(aLo, bLo) <= Math.min(aHi, bHi);
  // 합집합 조각들
  const pieces = overlap
    ? [[Math.min(aLo, bLo), Math.max(aHi, bHi)]]
    : [[aLo, aHi], [bLo, bHi]].sort((p, q) => p[0] - q[0]);

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
        <svg width={W} height={70} viewBox={`0 0 ${W} 70`} style={{ display: 'block', margin: '8px auto 0' }}>
          <rect x={px(aLo)} y={10} width={px(aHi) - px(aLo)} height={14} fill="#5a86c4" opacity="0.6" />
          <rect x={px(bLo)} y={28} width={px(bHi) - px(bLo)} height={14} fill="#e8a13a" opacity="0.6" />
          {pieces.map((p, i) => <rect key={i} x={px(p[0])} y={48} width={px(p[1]) - px(p[0])} height={14} fill="#2e7d32" />)}
          <text x={PAD - 4} y={22} fontSize="11" textAnchor="end" fill="#2f5a99">A</text>
          <text x={PAD - 4} y={40} fontSize="11" textAnchor="end" fill="#b5701a">B</text>
          <text x={PAD - 4} y={60} fontSize="11" textAnchor="end" fill="#2e7d32">합침</text>
        </svg>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          {overlap ? '두 띠가 붙어 하나로 합쳐집니다' : '두 띠가 떨어져 두 조각으로 남습니다'}
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: [-1, XMAX + 1], y: [-2, 2] }} preserveAspectRatio={false} height={130}>
          <Coordinates.Cartesian yAxis={{ lines: false }} />
          {pieces.map((p, i) => <Line.Segment key={i} point1={[p[0], 0]} point2={[p[1], 0]} color={Theme.green} />)}
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          '둘 중 하나라도'는 <b>두 구간을 합친 전체(합집합)</b>입니다
        </div>
      </div>
    </div>
  );
}
