// ===========================================================
// no:"11-7" ★ "겹침이 없으면 해가 없다" — window addEventListener + rAF 드래그
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Line, Point, Theme } from 'mafs';

const R = 45;

export function renderNoSolution(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  const cxA = 90;
  const cxB = sharedXByLog?.[logIdx]?.cxB ?? 150;
  const setCxB = (x) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), cxB: Math.min(300, Math.max(20, x)) } }));
  const d = Math.abs(cxB - cxA);
  const possible = d < 2 * R ? 1 : 0;
  const dGraph = d / 25;

  const onDown = (e) => {
    const svg = e.currentTarget.ownerSVGElement || e.currentTarget.closest('svg');
    const rect = svg.getBoundingClientRect();
    let rafId = null, lastClientX = e.clientX;
    const apply = () => { rafId = null; setCxB(((lastClientX - rect.left) / rect.width) * 320); };
    const onMove = (ev) => { lastClientX = ev.clientX; if (rafId === null) rafId = requestAnimationFrame(apply); };
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '10px', padding: '6px', border: '1px solid #e5e0d3' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>👉 <b>주황 원</b>을 직접 끌어 떨어뜨려보세요 — 동시 만족이 가능할까요?</div>
        <svg width="100%" height="200" viewBox="0 0 320 200" style={{ touchAction: 'none', display: 'block' }}>
          <circle cx={cxA} cy={100} r={R} fill="#3b6d1133" stroke="#3b6d11" strokeWidth="2" />
          <circle cx={cxB} cy={100} r={R} fill="#d85a3055" stroke="#d85a30" strokeWidth="2"
            style={{ cursor: 'grab', touchAction: 'none' }} onPointerDown={onDown} />
          <text x={cxA} y="55" fontSize="12" textAnchor="middle" fill="#3b6d11">조건1</text>
          <text x={cxB} y="55" fontSize="12" textAnchor="middle" fill="#d85a30">조건2</text>
        </svg>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: [0, 8], y: [-0.5, 1.5] }} preserveAspectRatio={false} height={200}>
          <Coordinates.Cartesian />
          <Line.Segment point1={[0, 1]} point2={[2 * R / 25, 1]} color={Theme.green} />
          <Line.Segment point1={[2 * R / 25, 0]} point2={[8, 0]} color={Theme.red} />
          <Point x={dGraph} y={possible} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로=중심거리, 세로=동시만족 가능(1)/불가능(0) — <b>딱 한 번 뚝 떨어지는 계단</b>입니다
        </div>
      </div>
    </div>
  );
}
