// ===========================================================
// no:"11-1" "한 조건은 하나의 띠를 만든다" — window addEventListener + rAF 드래그
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Line, Point, Theme } from 'mafs';

const HI = 8;

export function renderOneBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const lo = sharedXByLog?.[logIdx]?.lo ?? 2;
  const setLo = (l) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), lo: Math.min(HI, Math.max(0, l)) } }));
  const length = HI - lo;
  const px = (val) => (val / 10) * 320;

  const onDown = (e) => {
    const svg = e.currentTarget.ownerSVGElement || e.currentTarget.closest('svg');
    const rect = svg.getBoundingClientRect();
    let rafId = null, lastClientX = e.clientX;
    const apply = () => {
      rafId = null;
      const xVal = Math.round(((lastClientX - rect.left) / rect.width) * 10);
      setLo(Math.min(HI, Math.max(0, xVal)));
    };
    const onMove = (ev) => { lastClientX = ev.clientX; if (rafId === null) rafId = requestAnimationFrame(apply); };
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '10px', padding: '6px', border: '1px solid #e5e0d3' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>👉 <b>파란 띠</b>를 손가락으로 직접 밀어 길이를 바꿔보세요</div>
        <svg width="100%" height="60" viewBox="0 0 320 60" style={{ touchAction: 'none', display: 'block' }}>
          <rect x={px(lo)} y={18} width={px(length)} height={22} fill="#5a86c488" stroke="#2f5a99" strokeWidth="2" rx="4"
            style={{ cursor: 'grab', touchAction: 'none' }} onPointerDown={onDown} />
        </svg>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>구간: {lo} ~ {HI} · 길이 {length}</div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: [0, 10], y: [0, 10] }} preserveAspectRatio={false} height={240}>
          <Coordinates.Cartesian />
          <Line.Segment point1={[0, HI]} point2={[HI, 0]} color={Theme.blue} />
          <Point x={lo} y={length} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로=왼끝 위치, 세로=띠 길이 — 왼끝이 커질수록 길이는 <b>직선으로 줄어듭니다</b>
        </div>
      </div>
    </div>
  );
}
