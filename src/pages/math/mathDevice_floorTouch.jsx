import React, { useState, useRef, useEffect } from 'react';
import { Mafs, Coordinates, Plot, Point, Line } from 'mafs';
import { toRange } from './mathDeviceShared';

// 1. 부모 래퍼 (안전 조건 검사 전용 - 훅을 절대 사용하지 않음)
export function renderFloorTouch(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null; // 여기서 안전하게 탈출하므로 하위 훅에 영향을 주지 않음!

  return (
    <FloorTouchDevice 
      v={v} 
      logIdx={logIdx} 
      sharedXByLog={sharedXByLog} 
      setSharedXByLog={setSharedXByLog} 
    />
  );
}

// 2. 실제 디바이스 컴포넌트 (모든 훅은 이 안전지대 내부에서 무조건 100% 실행됨)
function FloorTouchDevice({ v, logIdx, sharedXByLog, setSharedXByLog }) {
  const f = (x) => 0.4 * (x - 2) * (x - 5);

  const xRange = toRange(v.xRange, [0.2, 6.8]);
  const yRange = toRange(v.yRange, [-1.5, 4.5]);

  const st = sharedXByLog?.[logIdx] || {};
  const xVal = st.xVal ?? 0.8;

  const patchState = (updatedFields) => {
    if (typeof setSharedXByLog !== 'function') return;
    setSharedXByLog(prev => ({
      ...prev,
      [logIdx]: { ...(prev?.[logIdx] || {}), ...updatedFields }
    }));
  };

  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const toSvgCoords = (mx, my) => {
    const sx = 50 + ((mx - 0.5) / 6.0) * 400;
    const sy = 160 - ((my - (-1.2)) / 5.7) * 140;
    return [sx, sy];
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      if (clientX === undefined) return;

      const pct = (clientX - rect.left) / rect.width;
      const mathPct = (pct - 0.1) / 0.8;
      const targetX = 0.5 + Math.min(1, Math.max(0, mathPct)) * 6.0;

      patchState({ xVal: targetX });
    };

    const handleUp = () => setIsDragging(false);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging]);

  const yVal = f(xVal);
  const isNearRoot2 = Math.abs(xVal - 2) < 0.15;
  const isNearRoot5 = Math.abs(xVal - 5) < 0.15;
  const isAtFloor = isNearRoot2 || isNearRoot5;
  const activeRoot = isNearRoot2 ? 2 : (isNearRoot5 ? 5 : null);

  const [subX, subY] = toSvgCoords(xVal, yVal);
  const [seaY] = toSvgCoords(xVal, 0);

  const pathPoints = [];
  for (let x = 0.5; x <= 6.5; x += 0.05) {
    const [px, py] = toSvgCoords(x, f(x));
    pathPoints.push(`${px},${py}`);
  }
  const pathD = `M ${pathPoints.join(' L ')}`;

  const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'sans-serif', userSelect: 'none' },
    card: { background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '16px', padding: '16px', textAlign: 'center' },
    hud: {
      background: isAtFloor ? '#f0fdf4' : '#eff6ff',
      border: `2px solid ${isAtFloor ? '#86efac' : '#bfdbfe'}`,
      borderRadius: '12px', padding: '12px', transition: 'all 0.3s'
    },
    svgContainer: {
      background: '#e0f2fe', borderRadius: '16px', border: '2px solid #bae6fd',
      overflow: 'hidden', position: 'relative', cursor: isDragging ? 'grabbing' : 'grab'
    },
    htmlLabel: { position: 'absolute', pointerEvents: 'none', fontWeight: '900', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap', transition: 'all 0.1s ease-out' }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes ripple {
          0% { r: 6px; opacity: 1; stroke-width: 2px; }
          100% { r: 35px; opacity: 0; stroke-width: 4px; }
        }
        .splash-wave {
          animation: ripple 0.8s infinite ease-out;
        }
        .mafs-7a-engine .MafsView { background-color: transparent !important; }
        .mafs-7a-engine .MafsView svg { overflow: visible !important; }
      `}</style>

      {/* 1. 실시간 물리학-기하학 연동 계기판 */}
      <div style={styles.card}>
        <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'bold', marginBottom: '6px' }}>
          🚢 탐험선을 직접 잡고 움직여 해수면에 닿는 자리를 구해보세요!
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4', marginBottom: '12px' }}>
          수학에서 "방정식을 푼다"는 것은 탐험선이 <b>해수면(Y=0)과 딱 부딪혀 닿는 찰나의 가로 위치</b>를 찾는 마법과도 같아요.
        </div>

        <div style={styles.hud}>
          {isAtFloor ? (
            <div>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#16a34a' }}>🎉 바닥 충돌 센서 작동! (Y = 0)</span>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#15803d', marginTop: '4px' }}>
                X = {activeRoot} 에서 발자국 발견!
              </div>
              <span style={{ fontSize: '11px', color: '#16a34a' }}>이 값이 바로 방정식의 진짜 정답(실근)입니다!</span>
            </div>
          ) : (
            <div>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#2563eb' }}>🌊 탐사선 잠항 비행 중</span>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#1d4ed8', marginTop: '4px' }}>
                현재 깊이 높이: Y = {yVal.toFixed(2)}
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>해수면(높이 Y=0)에 딱 걸치는 자리를 찾아보세요.</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. [상단] 직접 조작형 SVG 물리 월드 디바이스 */}
      <div 
        ref={svgRef} 
        style={styles.svgContainer}
        onPointerDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
      >
        <svg viewBox="0 0 500 180" style={{ display: 'block', width: '100%' }}>
          {/* 하늘 구역 */}
          <rect x="0" y="0" width="500" height={seaY} fill="#bae6fd" />
          {/* 바다 속 구역 */}
          <rect x="0" y={seaY} width="500" height={180 - seaY} fill="#0284c7" />

          {/* 해수면 가이드 라인 (바닥 경계) */}
          <line x1="10" y1={seaY} x2="490" y2={seaY} stroke="#f0f9ff" strokeWidth="3" strokeDasharray="6,4" opacity="0.9" />
          <text x="15" y={seaY - 8} fill="#ffffff" fontSize="10" fontWeight="bold" opacity="0.8">해수면 (바닥 라인 Y = 0)</text>

          {/* 잠항 궤적 점선 */}
          <path d={pathD} fill="none" stroke="#fef08a" strokeWidth="2.5" strokeDasharray="5,5" opacity="0.8" />

          {/* 해수면 닿는 곳 감지 타깃 플레이트 */}
          <circle cx={toSvgCoords(2, 0)[0]} cy={seaY} r="8" fill="#15803d" opacity="0.7" />
          <circle cx={toSvgCoords(5, 0)[0]} cy={seaY} r="8" fill="#15803d" opacity="0.7" />

          {/* 바닥 터치 물보라 파동 */}
          {isAtFloor && (
            <circle 
              cx={toSvgCoords(activeRoot, 0)[0]} 
              cy={seaY} 
              r="20" 
              fill="none" 
              stroke="#ffffff" 
              className="splash-wave" 
            />
          )}

          {/* 움직이는 주인공 잠수 탐험선 */}
          <g transform={`translate(${subX}, ${subY})`}>
            <circle cx="0" cy="0" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
            <rect x="-10" y="-4" width="20" height="8" rx="3" fill="#f97316" />
            <rect x="2" y="-12" width="4" height="8" fill="#cbd5e1" />
            <circle cx="6" cy="-12" r="2" fill="#ef4444" />
            <line x1="-14" y1="-8" x2="-14" y2="8" stroke="#334155" strokeWidth="2.5" />
          </g>
        </svg>
      </div>

      {/* 3. [하단] 동기화 수학 그래프 좌표평면 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '2px solid #e2e8f0', position: 'relative' }}>
        <div className="mafs-7a-engine" style={{ position: 'relative', overflow: 'hidden' }}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={260}>
            <Coordinates.Cartesian />

            {/* 바닥 라인 (X축 강조) */}
            <Line.Segment point1={[xRange[0], 0]} point2={[xRange[1], 0]} color="#0f172a" weight={2.5} />

            {/* 수학 연동 포물선 곡선 */}
            <Plot.OfX y={f} color="#3b82f6" weight={4} />

            {/* 해수면 근처 터치 시 Y축 조준 레이저 발사 */}
            {isAtFloor && (
              <Line.Segment 
                point1={[activeRoot, 0]} 
                point2={[0, 0]} 
                color="#16a34a" 
                weight={3} 
              />
            )}

            {/* 해수면 접촉 랜드마크 점 */}
            <Point x={2} y={0} color="#15803d" svgCircleProps={{ r: 5 }} />
            <Point x={5} y={0} color="#15803d" svgCircleProps={{ r: 5 }} />

            {/* 동기화되어 실시간으로 움직이는 추적 노드 */}
            <Point 
              x={xVal} 
              y={yVal} 
              color={isAtFloor ? '#16a34a' : '#f97316'} 
              svgCircleProps={{ r: 8 }} 
            />
          </Mafs>

          {/* 4. 실시간 수치 플로팅 라벨 */}
          <div style={{
            ...styles.htmlLabel,
            left: `${((xVal - xRange[0]) / (xRange[1] - xRange[0])) * 100}%`,
            top: `${((yRange[1] - yVal) / (yRange[1] - yRange[0])) * 100}%`,
            transform: 'translate(-50%, -145%)',
            backgroundColor: isAtFloor ? '#16a34a' : '#1e293b',
            color: '#ffffff',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}>
            {isAtFloor ? `🎉 충돌 검출! (${activeRoot}, 0)` : `🛸 탐사 좌표 (${xVal.toFixed(1)}, ${yVal.toFixed(1)})`}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>
        👆 마우스나 손가락으로 <b>상단의 주황색 탐험선</b>을 직접 움켜쥐고 움직여 보세요! <br />
        해수면에 닿는 순간, 하단 수학 그래프에 어떤 레이저가 발사되는지 확인해 봐요.
      </div>
    </div>
  );
}