// ===========================================================
// no:"11-4" "합치는 부분 = 합집합" — 막대 스타일, 손잡이를 직접 드래그.
// recharts는 드래그가 안 되므로 순수 SVG 막대로 바꾸고, 막대 위쪽 손잡이를
// pointer 이벤트로 끌어 값이 실시간 변하게 한다.
// ===========================================================
import React, { useRef } from 'react';

function DraggableBar({ x, label, value, max, color, onChange }) {
  const H = 160, baseY = 170, W = 46;
  const dragging = useRef(false);
  const svgRootRef = useRef(null);

  const yToVal = (clientY) => {
    const rect = svgRootRef.current.getBoundingClientRect();
    const svgY = ((clientY - rect.top) / rect.height) * 200;
    const val = Math.round(((baseY - svgY) / H) * max);
    return Math.min(max, Math.max(0, val));
  };

  const onDown = (e) => { dragging.current = true; svgRootRef.current = e.target.closest('svg'); e.target.setPointerCapture?.(e.pointerId); };
  const onMove = (e) => { if (!dragging.current) return; onChange(yToVal(e.clientY)); };
  const onUp = () => { dragging.current = false; };

  const barH = (value / max) * H;
  return (
    <g>
      <rect x={x} y={baseY - barH} width={W} height={barH} fill={color} opacity="0.75" />
      {/* 손잡이 */}
      <rect x={x - 4} y={baseY - barH - 10} width={W + 8} height={16} fill={color} rx="4"
        style={{ cursor: 'ns-resize', touchAction: 'none' }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} />
      <text x={x + W / 2} y={baseY + 16} fontSize="12" textAnchor="middle" fill="#333">{label}</text>
      <text x={x + W / 2} y={baseY - barH - 16} fontSize="12" textAnchor="middle" fill={color} fontWeight="bold">{value}</text>
    </g>
  );
}

export function renderUnionBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  const st = sharedXByLog?.[logIdx] || {};
  const onlyA = st.onlyA ?? 3, both = st.both ?? 2, onlyB = st.onlyB ?? 4;
  const patch = (p) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { onlyA, both, onlyB, ...(prev?.[logIdx] || {}), ...p } }));

  const total = onlyA + both + onlyB;
  const MAX = 8;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '6px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          👉 <b>막대 위쪽 손잡이</b>를 위아래로 끌어 크기를 바꿔보세요
        </div>
      </div>
      <div className="viz-box">
        <svg width="260" height="200" viewBox="0 0 260 200" style={{ display: 'block', margin: '0 auto', touchAction: 'none' }}>
          <line x1="20" y1="170" x2="240" y2="170" stroke="#999" strokeWidth="1.5" />
          <DraggableBar x={30} label="A만" value={onlyA} max={MAX} color="#5a86c4" onChange={(val) => patch({ onlyA: val })} />
          <DraggableBar x={107} label="겹침" value={both} max={MAX} color="#2e7d32" onChange={(val) => patch({ both: val })} />
          <DraggableBar x={184} label="B만" value={onlyB} max={MAX} color="#e8a13a" onChange={(val) => patch({ onlyB: val })} />
        </svg>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          세 막대를 합친 전체(<b>{total}</b>)가 <b>합집합</b>의 크기입니다
        </div>
      </div>
    </div>
  );
}
