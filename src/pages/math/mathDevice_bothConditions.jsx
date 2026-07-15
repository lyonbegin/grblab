// ===========================================================
// no:"11-6" ★ "두 조건 동시 만족은 겹친 구간뿐" — window addEventListener + rAF 드래그
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Line, Point, Theme } from 'mafs';

const LO2 = 3, HI2 = 7;

export function renderBothConditions(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const b1 = sharedXByLog?.[logIdx]?.b1 ?? 1;
  const setB1 = (b) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), b1: Math.min(9, Math.max(0, b)) } }));
  const width = Math.max(0, HI2 - Math.max(b1, LO2));
  const px = (val) => (val / 10) * 320;

  const onDown = (e) => {
    const svg = e.currentTarget.ownerSVGElement || e.currentTarget.closest('svg');
    const rect = svg.getBoundingClientRect();
    let rafId = null, lastClientX = e.clientX;
    const apply = () => {
      rafId = null;
      setB1(((lastClientX - rect.left) / rect.width) * 10);
    };
    const onMove = (ev) => { lastClientX = ev.clientX; if (rafId === null) rafId = requestAnimationFrame(apply); };
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '10px', padding: '6px', border: '1px solid #e5e0d3' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>👉 <b>파란 조건1 띠</b>를 직접 밀어보세요 — 조건2(노랑, 3~7)는 고정입니다</div>
        <svg width="100%" height="90" viewBox="0 0 320 90" style={{ touchAction: 'none', display: 'block' }}>
          <rect x={px(b1)} y={8} width={px(10 - b1)} height={20} fill="#5a86c455" stroke="#2f5a99" strokeWidth="2"
            style={{ cursor: 'grab', touchAction: 'none' }} onPointerDown={onDown} />
          <rect x={px(LO2)} y={34} width={px(HI2 - LO2)} height={20} fill="#e8a13a55" stroke="#b5701a" strokeWidth="2" />
          {width > 0 && <rect x={px(Math.max(b1, LO2))} y={60} width={px(width)} height={12} fill="#2e7d32" />}
        </svg>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>겹친 폭: <b>{width}</b></div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: [0, 9], y: [0, 5] }} preserveAspectRatio={false} height={220}>
          <Coordinates.Cartesian />
          <Line.Segment point1={[0, HI2 - LO2]} point2={[LO2, HI2 - LO2]} color={Theme.green} />
          <Line.Segment point1={[LO2, HI2 - LO2]} point2={[HI2, 0]} color={Theme.green} />
          <Line.Segment point1={[HI2, 0]} point2={[9, 0]} color={Theme.green} />
          <Point x={b1} y={width} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로=조건1 경계, 세로=겹친 폭 — <b>꺾인 직선(절선)</b>으로 평평하다가 줄어들고 다시 평평해집니다
        </div>
      </div>
    </div>
  );
}
