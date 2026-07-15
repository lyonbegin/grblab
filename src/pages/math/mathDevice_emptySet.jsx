// ===========================================================
// no:"11-5" "겹침이 아예 없을 수도 있다 (공집합)" (연립부등식의 선행개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: 두 띠를 좌우로 미는 슬라이더 (거리 조절)
//   - 결과도형: 두 띠를 떼어놓으면 겹침이 사라지고 "없음" 표시
//   - 그래프: 수직선에 아무 구간도 안 남음
//   sharedXByLog[logIdx] = { aPos, bPos }.
//
// [핵심] 조건이 서로 어긋나면 만족하는 값이 하나도 없을 수 있다 — 답이 없음(공집합).
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Line, Theme } from 'mafs';

export function renderEmptySet(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_emptySet 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }

  const XMAX = 10, WIDTH = 3; // 각 띠의 폭 고정
  const st = sharedXByLog?.[logIdx] || {};
  const aPos = st.aPos ?? 1;
  const bPos = st.bPos ?? 6;
  const patch = (p) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { aPos, bPos, ...(prev?.[logIdx] || {}), ...p } }));

  const aLo = aPos, aHi = aPos + WIDTH;
  const bLo = bPos, bHi = bPos + WIDTH;
  const oLo = Math.max(aLo, bLo), oHi = Math.min(aHi, bHi);
  const hasOverlap = oLo <= oHi;

  const W = 300, PAD = 20, barW = W - PAD * 2;
  const px = (x) => PAD + (x / XMAX) * barW;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#5f5e5a' }}>A띠 위치</div>
            <input type="range" min={0} max={XMAX - WIDTH} step={0.5} value={aPos}
              onChange={(e) => patch({ aPos: parseFloat(e.target.value) })} style={{ width: '110px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#5f5e5a' }}>B띠 위치</div>
            <input type="range" min={0} max={XMAX - WIDTH} step={0.5} value={bPos}
              onChange={(e) => patch({ bPos: parseFloat(e.target.value) })} style={{ width: '110px' }} />
          </div>
        </div>
        <svg width={W} height={70} viewBox={`0 0 ${W} 70`} style={{ display: 'block', margin: '8px auto 0' }}>
          <rect x={px(aLo)} y={10} width={px(aHi) - px(aLo)} height={14} fill="#5a86c4" opacity="0.6" />
          <rect x={px(bLo)} y={28} width={px(bHi) - px(bLo)} height={14} fill="#e8a13a" opacity="0.6" />
          {hasOverlap
            ? <rect x={px(oLo)} y={48} width={px(oHi) - px(oLo)} height={14} fill="#2e7d32" />
            : <text x={W / 2} y={60} fontSize="13" textAnchor="middle" fill="#c0392b" fontWeight="bold">겹침 없음 — 답 없음!</text>}
        </svg>
        <div style={{ fontSize: '13px', textAlign: 'center', fontWeight: 'bold', color: hasOverlap ? '#2e7d32' : '#c0392b' }}>
          {hasOverlap ? `겹침 있음: ${oLo.toFixed(1)} ~ ${oHi.toFixed(1)}` : '두 조건을 동시에 만족하는 값이 하나도 없습니다'}
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: [-1, XMAX + 1], y: [-2, 2] }} preserveAspectRatio={false} height={130}>
          <Coordinates.Cartesian yAxis={{ lines: false }} />
          {hasOverlap && <Line.Segment point1={[oLo, 0]} point2={[oHi, 0]} color={Theme.green} />}
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          {hasOverlap ? '겹치는 구간이 답입니다' : '수직선에 아무것도 안 남습니다 — 이것이 답 없음(공집합)'}
        </div>
      </div>
    </div>
  );
}
