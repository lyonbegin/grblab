import React, { useState, useRef, useEffect } from 'react';
import { Mafs, Coordinates, Plot, Point, Line } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

// 1. 부모 래퍼 (안전 조건 검사 전용 - 훅을 절대 사용하지 않음)
export function renderCountRoots(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null; // 여기서 탈출해도 자식 훅에 영향 없음!

  return (
    <CountRootsDevice
      v={v}
      logIdx={logIdx}
      sharedXByLog={sharedXByLog}
      setSharedXByLog={setSharedXByLog}
    />
  );
}

// SVG viewBox 고정 좌표계 (그리기와 드래그 계산의 일관성 보장)
const VB_W = 500;
const VB_H = 180;

// 2. 실제 디바이스 컴포넌트 (모든 훅은 이 안전지대 내부에서 무조건 100% 실행됨)
function CountRootsDevice({ v, logIdx, sharedXByLog, setSharedXByLog }) {
  // 아이들 눈에는 보이지 않는 4가지 수영 궤도 수식
  const defaultFormulas = [
    '0.15*(x-3.5)*(x-3.5) + 1.5',       // 코스 0: 물속에서만 놀기 (물보라 0번)
    '0.15*(x-3.5)*(x-3.5)',             // 코스 1: 수면에 코끝만 톡! (물보라 1번)
    '0.1*(x-2.0)*(x-5.0)',              // 코스 2: 시원하게 한 번 점프! (물보라 2번)
    '-0.05*(x-1.5)*(x-3.5)*(x-5.5)'     // 코스 3: 신나게 삼중 파도 점프! (물보라 3번)
  ];

  const curvesList = Array.isArray(v.curves) && v.curves.length >= 3
    ? v.curves.map(c => c.formula)
    : defaultFormulas;

  const xRange = toRange(v.xRange, [0.2, 6.8]);
  const yRange = toRange(v.yRange, [-1.5, 4.5]);

  // 상태 관리: 선택한 수영 코스 및 핑코의 가로 위치 (xVal)
  const st = sharedXByLog?.[logIdx] || {};
  const activeCourse = st.activeCourse ?? 2; // 기본값은 '시원하게 한 번 점프'
  const xVal = st.xVal ?? 0.8;

  const patchState = (updatedFields) => {
    if (typeof setSharedXByLog !== 'function') return;
    setSharedXByLog(prev => ({
      ...prev,
      [logIdx]: { ...(prev?.[logIdx] || {}), ...updatedFields }
    }));
  };

  const formula = curvesList[activeCourse] || defaultFormulas[activeCourse];
  const compiled = safeCompile(formula, 'explicit');

  // 내부 수영 경로 높이 연산 (실패 시 기본 수영 경로 백업)
  const f = (x) => {
    if (!compiled) return 0;
    try {
      return compiled.evaluate({ x });
    } catch (e) {
      return 0;
    }
  };

  // [수학 엔진] 수면(0층)에 닿아서 물보라가 일어나는 지점 탐색
  const findRoots = (fFunc) => {
    const roots = [];
    const step = 0.05;
    let prevY = fFunc(0.5);
    for (let x = 0.55; x <= 6.5; x += step) {
      const currY = fFunc(x);
      if (prevY * currY <= 0) {
        const exactX = x - step * (currY / (currY - prevY));
        if (roots.length === 0 || Math.abs(exactX - roots[roots.length - 1]) > 0.25) {
          roots.push(parseFloat(exactX.toFixed(2)));
        }
      }
      prevY = currY;
    }
    return roots;
  };

  const currentRoots = findRoots(f);
  const yVal = f(xVal);

  // 핑코가 물보라 타깃 지점을 지나가는지 실시간 센서 작동
  const isAtGround = currentRoots.some(rx => Math.abs(xVal - rx) < 0.18);
  const activeRoot = currentRoots.find(rx => Math.abs(xVal - rx) < 0.18) || null;

  // 직접 드래그 인터랙션 제어부 (SVG 물리 디바이스용)
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // 1:1 정밀 기하 맵핑
  const toSvgCoords = (mx, my) => {
    const sx = 50 + ((mx - 0.5) / 6.0) * 400;  // 가로 400px 매핑
    const sy = 150 - ((my + 1.5) / 6.0) * 120; // 세로 120px 매핑 (해수면 0층은 sy=120)
    return [sx, sy];
  };

  // 🚀 [렉 해결] stale closure 해결을 위한 Refs 기법 도입
  const activeDragRef = useRef(isDragging);
  useEffect(() => {
    activeDragRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      if (!activeDragRef.current) return;
      if (e.cancelable) e.preventDefault();

      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;

      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      if (clientX === undefined) return;

      // 손가락 터치 가로축 비율을 수학 xVal 좌표로 역산 (1:1 싱크)
      const pct = (clientX - rect.left) / rect.width;
      const mathPct = (pct - 0.1) / 0.8; // 양 옆 마진 50px 보정
      const targetX = 0.5 + Math.min(1, Math.max(0, mathPct)) * 6.0;

      patchState({ xVal: targetX });
    };

    const handleUp = () => setIsDragging(false);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging]);

  // 돌고래 핑코 모델의 실시간 SVG 픽셀 좌표 계산
  const [dolphinX, dolphinY] = toSvgCoords(xVal, yVal);
  const [, groundY] = toSvgCoords(xVal, 0);

  // 핑코 수영 궤도 패스 빌드
  const pathPoints = [];
  for (let x = 0.5; x <= 6.5; x += 0.05) {
    const [px, py] = toSvgCoords(x, f(x));
    pathPoints.push(`${px},${py}`);
  }
  const pathD = `M ${pathPoints.join(' L ')}`;

  const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'sans-serif', userSelect: 'none' },
    card: { background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '16px', padding: '16px', textAlign: 'center' },
    courseSelector: { display: 'flex', gap: '8px', justifyContent: 'center', margin: '12px 0 4px 0', flexWrap: 'wrap' },
    courseBtn: (isActive) => ({
      padding: '8px 12px', borderRadius: '10px', border: isActive ? '2.5px solid #0284c7' : '1px solid #cbd5e1',
      background: isActive ? '#e0f2fe' : '#ffffff', color: isActive ? '#0369a1' : '#64748b',
      fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s'
    }),
    hud: {
      background: '#f1f5f9', border: '2px solid #cbd5e1', borderRadius: '12px', padding: '12px',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '10px'
    },
    svgBox: {
      background: '#e0f2fe', borderRadius: '16px', border: '2px solid #bae6fd',
      overflow: 'hidden', position: 'relative', cursor: isDragging ? 'grabbing' : 'grab',
      touchAction: 'none'
    },
    htmlLabel: { position: 'absolute', pointerEvents: 'none', fontWeight: '900', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap', transition: 'all 0.1s ease-out' }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes splashRipple {
          0% { r: 6px; opacity: 1; stroke-width: 2px; }
          100% { r: 32px; opacity: 0; stroke-width: 4px; }
        }
        .splash-wave {
          animation: splashRipple 0.8s infinite ease-out;
        }
        .mafs-7b-engine .MafsView { background-color: transparent !important; }
        .mafs-7b-engine .MafsView svg { overflow: visible !important; }
      `}</style>

      {/* 1. 상단 수식 제로 돌고래 테마 상황판 */}
      <div style={styles.card}>
        <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'bold', marginBottom: '6px' }}>
          🐬 돌고래 '핑코'의 수영 코스를 바꾸고, 직접 드래그해 헤엄쳐 보세요!
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
          핑코가 바다 표면(0층) 위아래로 점프하면서 수면을 통과할 때마다 <b>"촤아악!" 물보라</b>가 튑니다. <br />
          <b>물보라가 총 몇 번 튀는지 세어보면</b> 수수께끼 정답의 개수를 계산 없이 알 수 있어요!
        </div>

        {/* 핑코 점프 코스 버튼 선택기 */}
        <div style={styles.courseSelector}>
          <button type="button" style={styles.courseBtn(activeCourse === 0)} onClick={() => patchState({ activeCourse: 0, xVal: 0.8 })}>🌊 코스 0 (잠수 수영)</button>
          <button type="button" style={styles.courseBtn(activeCourse === 1)} onClick={() => patchState({ activeCourse: 1, xVal: 0.8 })}>✨ 코스 1 (코끝만 톡!)</button>
          <button type="button" style={styles.courseBtn(activeCourse === 2)} onClick={() => patchState({ activeCourse: 2, xVal: 0.8 })}>🐬 코스 2 (신나는 점프)</button>
          <button type="button" style={styles.courseBtn(activeCourse === 3)} onClick={() => patchState({ activeCourse: 3, xVal: 0.8 })}>🎢 코스 3 (삼중 물보라)</button>
        </div>

        {/* 실시간 물보라 카운팅 전광판 */}
        <div style={styles.hud}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>📍 핑코 가로 위치</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginTop: '2px' }}>
              X = {xVal.toFixed(1)} 번 자리
            </div>
          </div>
          <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }} />
          <div>
            <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 'bold' }}>📡 총 물보라 횟수</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#0369a1', marginTop: '1px' }}>
              {currentRoots.length} 번 발생!
            </div>
          </div>
          <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }} />
          <div>
            <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold' }}>🔑 수수께끼 정답 개수</div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#15803d', marginTop: '2px' }}>
              {currentRoots.length} 개
            </div>
          </div>
        </div>
      </div>

      {/* 2. [상단] 직접 조작하는 돌고래 바다 월드 (SVG) */}
      <div 
        ref={svgRef} 
        style={styles.svgBox}
        onPointerDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
      >
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ display: 'block', width: '100%', touchAction: 'none' }}>
          {/* 하늘과 바다 속 영역 */}
          <rect x="0" y="0" width="500" height={groundY} fill="#bae6fd" />
          <rect x="0" y={groundY} width="500" height={180 - groundY} fill="#0284c7" />

          {/* 해수면 바닥 가이드 라인 (Y = 0) */}
          <line x1="10" y1={groundY} x2="490" y2={groundY} stroke="#ffffff" strokeWidth="3" strokeDasharray="5,3" opacity="0.9" />
          <text x="15" y={groundY - 8} fill="#ffffff" fontSize="10" fontWeight="bold" opacity="0.8">바다 표면 (0층 높이)</text>

          {/* 핑코 수영 궤적 점선 패스 */}
          <path d={pathD} fill="none" stroke="#fef08a" strokeWidth="2.5" strokeDasharray="4,4" opacity="0.8" />

          {/* 궤적과 수면이 만나는 물보라 센서 플레이트 */}
          {currentRoots.map((rx, idx) => {
            const [sx] = toSvgCoords(rx, 0);
            const isHit = Math.abs(xVal - rx) < 0.18;
            return (
              <g key={idx}>
                <circle cx={sx} cy={groundY} r="7" fill={isHit ? '#22c55e' : '#15803d'} />
                {isHit && (
                  <circle cx={sx} cy={groundY} r="18" fill="none" stroke="#ffffff" className="splash-wave" />
                )}
              </g>
            );
          })}

          {/* 손가락으로 드래그해 움직이는 돌고래 핑코 */}
          <g transform={`translate(${dolphinX}, ${dolphinY})`}>
            {/* 귀여운 돌고래 모형 */}
            <path d="M-12,-4 C-6,-10 6,-10 12,-2 C16,1 12,6 4,4 C0,3 -8,10 -12,4 Z" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
            <path d="M-12,-4 L-16,-1 L-14,2 Z" fill="#0284c7" />
            {/* 지느러미 */}
            <path d="M-2,-7 L2,-12 L4,-7 Z" fill="#38bdf8" />
            {/* 눈 */}
            <circle cx="6" cy="-4" r="1.5" fill="#0f172a" />
          </g>
        </svg>
      </div>

      {/* 3. [하단] 동기화 수학 그래프 좌표평면 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '2px solid #e2e8f0', position: 'relative' }}>
        <div className="mafs-7b-engine" style={{ position: 'relative', overflow: 'hidden' }}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={250}>
            <Coordinates.Cartesian />

            {/* 바닥 수평선 (X축) */}
            <Line.Segment point1={[xRange[0], 0]} point2={[xRange[1], 0]} color="#1e293b" weight={2.5} />

            {/* 수학적 궤도 곡선 렌더링 */}
            <Plot.OfX y={f} color="#3b82f6" weight={4.5} />

            {/* 물보라 검출 시 Y축 0 눈금 조준선 발사 */}
            {isAtGround && (
              <Line.Segment 
                point1={[activeRoot, 0]} 
                point2={[0, 0]} 
                color="#16a34a" 
                weight={3} 
              />
            )}

            {/* 물보라(교점) 좌표에 녹색 초록불 점찍기 */}
            {currentRoots.map((rx, idx) => (
              <Point key={idx} x={rx} y={0} color="#15803d" svgCircleProps={{ r: 5 }} />
            ))}

            {/* 현재 움직이는 동기화 점 */}
            <Point 
              x={xVal} 
              y={yVal} 
              color={isAtGround ? '#16a34a' : '#38bdf8'} 
              svgCircleProps={{ r: 8 }} 
            />
          </Mafs>

          {/* 4. 기하 궤적을 1:1로 가리키는 실시간 오버레이 수치 라벨 */}
          <div style={{
            ...styles.htmlLabel,
            left: `${((xVal - xRange[0]) / (xRange[1] - xRange[0])) * 100}%`,
            top: `${((yRange[1] - yVal) / (yRange[1] - yRange[0])) * 100}%`,
            transform: 'translate(-50%, -145%)',
            backgroundColor: isAtGround ? '#16a34a' : '#1e293b',
            color: '#ffffff',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}>
            {isAtGround ? `💥 물보라 폭발! (${activeRoot.toFixed(1)}, 0)` : `🐬 핑코 현재 위치 (${xVal.toFixed(1)}, ${yVal.toFixed(1)})`}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>
        👆 상단의 <b>코스 버튼을 골라 수영 경로를 바꾼 뒤</b> 핑코를 드래그해 보세요! <br />
        핑코가 수면(X축)을 뚫고 지날 때마다 터지는 물보라(교점)의 개수를 실시간으로 세어 볼 수 있습니다.
      </div>
    </div>
  );
}