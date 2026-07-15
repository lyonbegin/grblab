// ===========================================================
// no:"11-5" "겹침이 없을 수도 있다" — window addEventListener + rAF 드래그
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Line, Point, Theme } from 'mafs';

const W = 6;

export function renderEmptySet(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const s = sharedXByLog?.[logIdx]?.s ?? 2;
  const setS = (ss) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), s: Math.min(8, Math.max(0, Math.round(ss))) } }));
  const overlap = Math.max(0, W - s);
  const px = (val) => (val / 14) * 320;

  const onDown = (e) => {
    const svg = e.currentTarget.ownerSVGElement || e.currentTarget.closest('svg');
    const rect = svg.getBoundingClientRect();
    let rafId = null, lastClientX = e.clientX;
    const apply = () => {
      rafId = null;
      setS(((lastClientX - rect.left) / rect.width) * 14);
    };
    const onMove = (ev) => { lastClientX = ev.clientX; if (rafId === null) rafId = requestAnimationFrame(apply); };
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '10px', padding: '6px', border: '1px solid #e5e0d3' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>👉 <b>주황 띠</b>를 직접 끌어 겹침을 없애보세요</div>
        <svg width="100%" height="90" viewBox="0 0 320 90" style={{ touchAction: 'none', display: 'block' }}>
          <rect x={px(0)} y={20} width={px(W)} height={20} fill="#3b6d1155" stroke="#3b6d11" strokeWidth="2" />
          <rect x={px(s)} y={48} width={px(W)} height={20} fill="#d85a3055" stroke="#d85a30" strokeWidth="2"
            style={{ cursor: 'grab', touchAction: 'none' }} onPointerDown={onDown} />
        </svg>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>겹치는 정수 개수: <b>{overlap}</b></div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: [0, 8], y: [0, 7] }} preserveAspectRatio={false} height={220}>
          <Coordinates.Cartesian />
          {Array.from({ length: 9 }).map((_, i) => {
            const y = Math.max(0, W - i);
            return <Line.Segment key={i} point1={[i, y]} point2={[i + 1, y]} color={Theme.orange} />;
          })}
          <Point x={s} y={overlap} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로=밀린 칸 수, 세로=겹치는 개수 — <b>계단처럼 뚝뚝 떨어지다 0에서 멈춥니다</b>
        </div>
      </div>
    </div>
  );
}
