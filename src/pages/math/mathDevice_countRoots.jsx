import React, { useState, useRef, useEffect } from 'react';
import { Mafs, Coordinates, Plot, Point, Line } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderCountRoots(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  // 1. 교육 목적에 맞춰 엄격하게 설계된 4가지 기본 곡선 (0개, 1개, 2개, 3개 해)
  const defaultFormulas = [
    '0.15*(x-3.5)*(x-3.5) + 1.5',       // 코스 0: 지면에 안 닿음 (0개)
    '0.15*(x-3.5)*(x-3.5)',             // 코스 1: 딱 한 번 스침 (1개)
    '0.1*(x-2.0)*(x-5.0)',              // 코스 2: 두 번 관통 (2개)
    '-0.05*(x-1.5)*(x-3.5)*(x-5.5)'     // 코스 3: 세 번 요동 (3개)
  ];

  // 커스텀 curves가 주어지면 매핑하고, 없으면 완벽한 디폴트 코스 세트 제공
  const curvesList = Array.isArray(v.curves) && v.curves.length >= 3
    ? v.curves.map(c => c.formula)
    : defaultFormulas;

  const xRange = toRange(v.xRange, [0.2, 6.8]);
  const yRange = toRange(v.yRange, [-1.5, 4.5]);

  // 상태 관리: 활성화된 비행 코스 (0, 1, 2, 3) 및 비행기 가로 위치 (xVal)
  const st = sharedXByLog?.[logIdx] || {};
  const activeCourse = st.activeCourse ?? 2; // 기본값은 '두 번 쿵쿵 비행'
  const xVal = st.xVal ?? 0.8;

  const patchState = (updatedFields) => {
    if (typeof setSharedXByLog !== 'function') return;
    setSharedXByLog(prev => ({
      ...prev,
      [logIdx]: { ...(prev?.[logIdx] || {}), ...updatedFields }
    }));
  };

  // 활성 포뮬러 컴파일 및 계산식 구현
  const formula = curvesList[activeCourse] || defaultFormulas[activeCourse];
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) return null;

  const f = (x) => {
    try {
      return compiled.evaluate({ x });
    } catch (e) {
      return NaN;
    }
  };

  // 2. [수학 엔진] 기하학적으로 X축과 만나는 정밀한 교점(실근) 실시간 탐색 알고리즘
  const findRoots = (fFunc) => {
    const roots = [];
    const step = 0.05;
    let prevY = fFunc(0.5);
    for (let x = 0.55; x <= 6.5; x += step) {
      const currY = fFunc(x);
      if (prevY * currY <= 0) {
        // 부호가 바뀌는 순간의 가로 위치를 보간법으로 정확하게 짚어냅니다.
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

  // 비행기가 현재 교점(지면) 중 한 곳을 스치고 있는지 감시 센서 작동
  const isAtGround = currentRoots.some(rx => Math.abs(xVal - rx) < 0.18);
  const activeRoot = currentRoots.find(rx => Math.abs(xVal - rx) < 0.18) || null;

  // 3. 직접 드래그 인터랙션 제어부 (SVG 물리 디바이스용)
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // SVG 픽셀과 수학 좌표 1:1 정밀 기하 매핑
  const toSvgCoords = (mx, my) => {
    const sx = 50 + ((mx - 0.5) / 6.0) * 400; // 가로 400px 폭 매핑
    const sy = 125 - (my / 5.0) * 100;       // 세로 지면(y=0) 기준 125px 매핑
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
      const mathPct = (pct - 0.1) / 0.8; // 좌우 50px 패딩 보정
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

  // 비행기 좌표 계산
  const [planeX, planeY] = toSvgCoords(xVal, yVal);
  const [groundY] = toSvgCoords(xVal, 0);

  // 물리 점선 궤적 빌드
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
      background: '#f0f9ff', borderRadius: '16px', border: '2px solid #bae6fd',
      overflow: 'hidden', position: 'relative', cursor: isDragging ? 'grabbing' : 'grab'
    },
    htmlLabel: { position: 'absolute', pointerEvents: 'none', fontWeight: '900', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap', transition: 'all 0.1s ease-out' }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes shockwave {
          0% { r: 6px; opacity: 1; stroke-width: 2px; }
          100% { r: 30px; opacity: 0; stroke-width: 3.5px; }
        }
        .shock-circle {
          animation: shockwave 0.6s infinite linear;
        }
        .mafs-7b-engine .MafsView { background-color: transparent !important; }
        .mafs-7b-engine .MafsView svg { overflow: visible !important; }
      `}</style>

      {/* 1. 상단 코스 제어반 및 계기판 */}
      <div style={styles.card}>
        <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'bold', marginBottom: '6px' }}>
          ✈️ 비행 코스를 고르고, 조종사를 끌고 날아가 보세요!
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
          비행기가 지면에 쿵쿵 닿을 때마다 카운팅 센서가 켜져요. <b>지면에 스치거나 닿은 횟수</b>가 바로 방정식의 <b>진짜 정답(실근) 개수</b>가 된답니다.
        </div>

        {/* 비행 코스 선택 버튼 */}
        <div style={styles.courseSelector}>
          <button type="button" style={styles.courseBtn(activeCourse === 0)} onClick={() => patchState({ activeCourse: 0 })}>☁️ 코스 0 (하늘비행)</button>
          <button type="button" style={styles.courseBtn(activeCourse === 1)} onClick={() => patchState({ activeCourse: 1 })}>✨ 코스 1 (스치기)</button>
          <button type="button" style={styles.courseBtn(activeCourse === 2)} onClick={() => patchState({ activeCourse: 2 })}>💥 코스 2 (두번쿵쿵)</button>
          <button type="button" style={styles.courseBtn(activeCourse === 3)} onClick={() => patchState({ activeCourse: 3 })}>🌊 코스 3 (삼중파도)</button>
        </div>

        {/* 실시간 검출 계기판 */}
        <div style={styles.hud}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>📍 현재 비행 위치</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginTop: '2px' }}>
              X = {xVal.toFixed(1)}
            </div>
          </div>
          <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }} />
          <div>
            <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 'bold' }}>📡 바닥 충돌 횟수</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#0369a1', marginTop: '1px' }}>
              {currentRoots.length} 번 터치!
            </div>
          </div>
          <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }} />
          <div>
            <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold' }}>🔑 방정식의 진짜 해</div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#15803d', marginTop: '2px' }}>
              {currentRoots.length} 개 존재!
            </div>
          </div>
        </div>
      </div>

      {/* 2. [상단] 직접 조작형 비행 궤적 물리 디바이스 */}
      <div 
        ref={svgRef} 
        style={styles.svgBox}
        onPointerDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
      >
        <svg viewBox="0 0 500 180" style={{ display: 'block', width: '100%' }}>
          {/* 하늘과 지상 레이어 분리 */}
          <rect x="0" y="0" width="500" height={groundY} fill="#e0f2fe" />
          <rect x="0" y={groundY} width="500" height={180 - groundY} fill="#f1f5f9" />

          {/* 안전 지면 기준 가로선 */}
          <line x1="10" y1={groundY} x2="490" y2={groundY} stroke="#ea580c" strokeWidth="3" strokeDasharray="5,3" />
          <text x="15" y={groundY + 14} fill="#ea580c" fontSize="10" fontWeight="bold">지면 센서 라인 (Y = 0)</text>

          {/* 코스 비행 점선 패스 */}
          <path d={pathD} fill="none" stroke="#0284c7" strokeWidth="2.5" strokeDasharray="4,4" opacity="0.75" />

          {/* 지면에 박혀있는 충돌 감지 센서기 */}
          {currentRoots.map((rx, idx) => {
            const [sx] = toSvgCoords(rx, 0);
            const isHit = Math.abs(xVal - rx) < 0.18;
            return (
              <g key={idx}>
                <circle cx={sx} cy={groundY} r="8" fill={isHit ? '#16a34a' : '#d97706'} />
                {isHit && (
                  <circle cx={sx} cy={groundY} r="20" fill="none" stroke="#16a34a" className="shock-circle" />
                )}
              </g>
            );
          })}

          {/* 사용자가 드래그하며 조종할 비행선 모형 */}
          <g transform={`translate(${planeX}, ${planeY})`}>
            <circle cx="0" cy="0" r="14" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
            <path d="M -16,-2 L -10,-8 L -2,-4 L 14,-2 L -2,4 L -10,8 Z" fill="#0369a1" />
            <circle cx="4" cy="-1" r="2" fill="#fef08a" />
          </g>
        </svg>
      </div>

      {/* 3. [하단] 동기화 수학 그래프 좌표평면 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '2px solid #e2e8f0', position: 'relative' }}>
        <div className="mafs-7b-engine" style={{ position: 'relative', overflow: 'hidden' }}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={250}>
            <Coordinates.Cartesian />

            {/* X축 (지면 수평선) */}
            <Line.Segment point1={[xRange[0], 0]} point2={[xRange[1], 0]} color="#1e293b" weight={2.5} />

            {/* 변환된 수학적 궤도 곡선 렌더링 */}
            <Plot.OfX y={f} color="#3b82f6" weight={4.5} />

            {/* 지면 접촉 시 Y축 0 눈금 조준선 발사 */}
            {isAtGround && (
              <Line.Segment 
                point1={[activeRoot, 0]} 
                point2={[0, 0]} 
                color="#16a34a" 
                weight={3} 
              />
            )}

            {/* 지면 충돌 해(Root) 좌표들을 찍기 */}
            {currentRoots.map((rx, idx) => (
              <Point key={idx} x={rx} y={0} color="#15803d" svgCircleProps={{ r: 5 }} />
            ))}

            {/* 현재 날아다니는 동기화 추적 점 */}
            <Point 
              x={xVal} 
              y={yVal} 
              color={isAtGround ? '#16a34a' : '#0284c7'} 
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
            {isAtGround ? `💥 지면 충돌 센서! (${activeRoot.toFixed(1)}, 0)` : `🛰️ 실시간 궤적 (${xVal.toFixed(1)}, ${yVal.toFixed(1)})`}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>
        👆 상단의 <b>코스 버튼을 골라 비행선을 바꾼 뒤</b> 직접 드래그하여 날려보세요! <br />
        비행선이 지면(X축)을 때릴 때마다 하단 수학 그래프에 생기는 교점을 확인해 봐요.
      </div>
    </div>
  );
}