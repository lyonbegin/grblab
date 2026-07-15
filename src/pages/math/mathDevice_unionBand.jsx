// ===========================================================
// no:"11-4" "합치는 부분 = 합집합" — MovablePoint 기반 막대(y좌표 = 값).
// [방식] 각 막대마다 MovablePoint 하나를 세로로만 움직이게 하고, 그 y값을
// 막대 높이로 오버레이 렌더링한다. MovablePoint 자체는 투명 처리.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Theme, MovablePoint } from 'mafs';

const X_RANGE = [0, 3], Y_RANGE = [0, 9];
const MAX = 8;

function BarOverlay({ xCenter, value, color, label }) {
  const xr = X_RANGE[1] - X_RANGE[0], yr = Y_RANGE[1] - Y_RANGE[0];
  const barW = 0.6;
  const leftPct = ((xCenter - barW / 2 - X_RANGE[0]) / xr) * 100;
  const wPct = (barW / xr) * 100;
  const topPct = ((Y_RANGE[1] - value) / yr) * 100;
  const hPct = (value / yr) * 100;
  return (
    <>
      <div style={{ position: 'absolute', left: `${leftPct}%`, top: `${topPct}%`, width: `${wPct}%`, height: `${hPct}%`, background: color, opacity: 0.75 }} />
      <div style={{ position: 'absolute', left: `${leftPct}%`, top: `${topPct - 8}%`, width: `${wPct}%`, textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color }}>{value}</div>
      <div style={{ position: 'absolute', left: `${leftPct}%`, top: '100%', width: `${wPct}%`, textAlign: 'center', fontSize: '11px', color: '#333' }}>{label}</div>
    </>
  );
}

export function renderUnionBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  const st = sharedXByLog?.[logIdx] || {};
  const onlyA = st.onlyA ?? 3, both = st.both ?? 2, onlyB = st.onlyB ?? 4;
  const patch = (p) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { onlyA, both, onlyB, ...(prev?.[logIdx] || {}), ...p } }));
  const clamp = (v) => Math.min(MAX, Math.max(0, Math.round(v)));

  const total = onlyA + both + onlyB;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '6px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          👉 <b>막대 위 점</b>을 위아래로 끌어 크기를 바꿔보세요
        </div>
      </div>
      <div className="viz-box" style={{ position: 'relative', paddingBottom: '20px' }}>
        <Mafs viewBox={{ x: X_RANGE, y: Y_RANGE }} preserveAspectRatio={false} height={220}>
          <Coordinates.Cartesian xAxis={{ lines: false }} yAxis={{ lines: false }} />
          <MovablePoint point={[0.5, onlyA]} constrain={(pos) => [0.5, clamp(pos[1])]} color={Theme.blue} onMove={(pos) => patch({ onlyA: clamp(pos[1]) })} />
          <MovablePoint point={[1.5, both]} constrain={(pos) => [1.5, clamp(pos[1])]} color={Theme.green} onMove={(pos) => patch({ both: clamp(pos[1]) })} />
          <MovablePoint point={[2.5, onlyB]} constrain={(pos) => [2.5, clamp(pos[1])]} color={Theme.orange} onMove={(pos) => patch({ onlyB: clamp(pos[1]) })} />
        </Mafs>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <BarOverlay xCenter={0.5} value={onlyA} color="#2f5a99" label="A만" />
          <BarOverlay xCenter={1.5} value={both} color="#2e7d32" label="겹침" />
          <BarOverlay xCenter={2.5} value={onlyB} color="#b5701a" label="B만" />
        </div>
      </div>
      <div className="viz-box">
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          세 막대를 합친 전체(<b>{total}</b>)가 <b>합집합</b>의 크기입니다
        </div>
      </div>
    </div>
  );
}
