import React, { useState, useRef, useEffect } from 'react';
import { Mafs, Coordinates, Plot, Point, Line } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

// 1. 부모 래퍼 (안전 조건 검사 전용 - 훅을 절대 사용하지 않음)
export function renderRootsJudge(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null; // 여기서 탈출해도 하위 훅에 영향을 주지 않음!

  return (
    <RootsJudgeDevice
      v={v}
      logIdx={logIdx}
      sharedXByLog={sharedXByLog}
      setSharedXByLog={setSharedXByLog}
    />
  );
}

// SVG viewBox 고정 좌표계 상수 (그리기와 드래그 계산이 반드시 같은 값을 써야 어긋나지 않음)
const VB_W = 500;
const VB_H = 180;

// 2. 실제 디바이스 컴포넌트 (모든 훅은 이 안전지대 내부에서 무조건 100% 실행됨)
function RootsJudgeDevice({ v, logIdx, sharedXByLog, setSharedXByLog }) {
  // 수학적 기초 3차 함수 정의
  const formula = (v.curves || [])[0]?.formula || '0.15*x*x*x - 1.2*x*x + 2*x + 3';
  const compiled = safeCompile(formula, 'explicit');

  const fBase = (x) => {
    if (!compiled) return 0.15 * x * x * x - 1.2 * x * x + 2 * x + 3;
    try {
      return compiled.evaluate({ x });
    } catch (e) {
      return NaN;
    }
  };

  const xRange = toRange(v.xRange, [0.2, 6.8]);
  const yRange = toRange(v.yRange, [-1.5, 4.5]);

  // 극대 및 극소 지점 정의 (x=4.30이 이 영역 안의 절대 최솟값 골짜기입니다)
  const peakX = 1.033;
  const peakYBase = fBase(peakX); // 약 3.95
  const valleyX = 4.30;
  const valleyYBase = fBase(valleyX); // 약 1.34

  // 통합 연동 상태 관리 (kShift: 궤도 높이, cVal: 위험 기준선 높이)
  const st = sharedXByLog?.[logIdx] || {};
  const kShift = st.kShift ?? 0.0;
  const cVal = st.cVal ?? 0.8;

  const patchState = (updatedFields) => {
    if (typeof setSharedXByLog !== 'function') return;
    setSharedXByLog(prev => ({
      ...prev,
      [logIdx]: { ...(prev?.[logIdx] || {}), ...updatedFields }
    }));
  };

  // 평행이동이 반영된 실시간 함수 f(x) = fBase(x) + kShift
  const f = (x) => fBase(x) + kShift;

  // [수학 엔진] 실시간 X축과의 교점(실근) 탐색 알고리즘
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

  // 실시간 꼭대기/골짜기 높이 상태 계산
  const currentPeakY = peakYBase + kShift;
  const currentValleyY = valleyYBase + kShift;

  // 부등식 만족 여부 판정 (최솟값인 골짜기가 기준선 cVal보다 크거나 같으면 합격!)
  const isInequalitySatisfied = currentValleyY >= cVal;

  // 극대/극소 스냅용 접촉 감지
  const isPeakTouchingX = Math.abs(currentPeakY) < 0.12;
  const isValleyTouchingX = Math.abs(currentValleyY) < 0.12;

  // 직접 드래그 인터랙션 제어부 (SVG 물리 디바이스용 이중 조작계)
  const svgRef = useRef(null);
  const [activeDrag, setActiveDrag] = useState(null); // 'curve' | 'line' | null

  // SVG 픽셀과 수학 좌표 매핑
  const toSvgCoords = (mx, my) => {
    const sx = 50 + ((mx - 0.5) / 6.0) * 400; // 가로 400px 폭
    const sy = 110 - (my / 4.0) * 80;        // 세로 지면(y=0) 기준 110px 매핑
    return [sx, sy];
  };

  useEffect(() => {
    if (!activeDrag) return;

    const handleMove = (e) => {
      // 터치로 끌 때 페이지가 같이 스크롤되며 충돌하는 것을 막는다.
      if (e.cancelable) e.preventDefault();

      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect || rect.height === 0) return;

      // [버그수정] 기존 코드는 e.clientX(가로좌표)를 clientY 변수에 넣고 있었다.
      // 위아래 드래그인데 가로 좌표를 읽으니 핸들이 엉뚱하게 움직였다.
      const clientY = e.clientY ?? e.touches?.[0]?.clientY;
      if (clientY === undefined) return;

      // [버그수정] toSvgCoords는 viewBox="0 0 500 180" 고정 좌표계로 그림을 그리는데
      // 기존 코드는 rect.height(실제 화면 픽셀 높이)를 곱해서 좌표를 계산했다.
      // 화면 크기가 달라질 때마다 rect.height도 달라지므로 손가락 위치와
      // 실제 도형 위치가 계속 어긋났다. 반드시 viewBox 높이(180)를 써야 한다.
      const pctY = (clientY - rect.top) / rect.height;
      const mathY = (110 - (pctY * VB_H)) / 80 * 4.0;

      if (activeDrag === 'curve') {
        let targetK = mathY - fBase(3.5); // 궤도 중심점(x=3.5) 기준
        targetK = Math.min(0.5, Math.max(-4.5, targetK));

        // 꼭대기/골짜기가 X축에 닿을 때의 기하 자석 스냅
        if (Math.abs(peakYBase + targetK) < 0.15) targetK = -peakYBase;
        else if (Math.abs(valleyYBase + targetK) < 0.15) targetK = -valleyYBase;

        patchState({ kShift: targetK });
      } 
      else if (activeDrag === 'line') {
        let targetC = Math.min(4.2, Math.max(-1.2, mathY));

        // [초등 감각 극대화!] 기준선 c가 골짜기 최솟값 높이에 가까워지면 한계선으로 챡! 스냅 고정
        const currentMinHeight = valleyYBase + kShift;
        if (Math.abs(targetC - currentMinHeight) < 0.15) {
          targetC = currentMinHeight;
        }

        patchState({ cVal: targetC });
      }
    };

    const handleUp = () => setActiveDrag(null);

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
  }, [activeDrag, kShift]);

  // 핸들 조작 위치 계산
  const handleX = 3.5;
  const handleY = f(handleX);
  const [handlePx, handlePy] = toSvgCoords(handleX, handleY);
  // [버그수정] toSvgCoords는 [sx, sy]를 반환한다. 기존 코드는 첫 번째(가로 sx)를
  // lineY로 받아서 기준선이 엉뚱한 높이에 그려졌다. 두 번째(세로 sy)를 받아야 한다.
  const [, lineY] = toSvgCoords(handleX, cVal);

  // 물리 레일 패스 빌드
  const pathPoints = [];
  for (let x = 0.5; x <= 6.5; x += 0.05) {
    const [px, py] = toSvgCoords(x, f(x));
    pathPoints.push(`${px},${py}`);
  }
  const pathD = `M ${pathPoints.join(' L ')}`;

  const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'sans-serif', userSelect: 'none' },
    card: { background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '16px', padding: '16px', textAlign: 'center' },
    hud: {
      background: isInequalitySatisfied ? '#f0fdf4' : '#fef2f2',
      border: `2px solid ${isInequalitySatisfied ? '#16a34a' : '#ef4444'}`,
      borderRadius: '12px', padding: '10px 14px', marginTop: '10px',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center', transition: 'all 0.3s'
    },
    svgBox: {
      background: '#fafafa', borderRadius: '16px', border: '2px solid #cbd5e1',
      overflow: 'hidden', position: 'relative',
      // 터치 드래그 중 브라우저 기본 스크롤/줌 제스처가 끼어들지 않게 막는다.
      touchAction: 'none'
    },
    htmlLabel: { position: 'absolute', pointerEvents: 'none', fontWeight: '900', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap', transition: 'all 0.1s ease-out' }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes alertPulse {
          0% { stroke-width: 3.5px; opacity: 1; }
          50% { stroke-width: 6px; opacity: 0.6; }
          100% { stroke-width: 3.5px; opacity: 1; }
        }
        .danger-line-anim {
          animation: alertPulse 1.2s infinite ease-in-out;
        }
        .mafs-7d-engine .MafsView { background-color: transparent !important; }
        .mafs-7d-engine .MafsView svg { overflow: visible !important; }
      `}</style>

      {/* 1. 종합 실시간 판정 상태 전광판 */}
      <div style={styles.card}>
        <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'bold', marginBottom: '6px' }}>
          📐 궤도 레일과 위험 기준선을 직접 드래그해서 움직여 보세요!
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
          방정식 실근은 <b>X축 바닥선</b>과 닿는 점이고, 부등식 조건은 <b>위험선보다 늘 위에 떠 있는 것</b>이에요. <br />
          곡선의 가장 깊은 골짜기가 위험선보다 안전하게 높이 있는 조건을 찾아봐요!
        </div>

        <div style={styles.hud}>
          <div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>📡 바닥 접촉 상태 (실근)</div>
            <div style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>
              교점 {currentRoots.length}개 발견!
            </div>
          </div>
          <div style={{ width: '1px', height: '28px', background: '#e2e8f0' }} />
          <div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>⛰️ 가장 낮은 골짜기 높이</div>
            <div style={{ fontSize: '15px', fontWeight: '900', color: '#3b82f6', marginTop: '2px' }}>
              Y = {currentValleyY.toFixed(2)}
            </div>
          </div>
          <div style={{ width: '1px', height: '28px', background: '#e2e8f0' }} />
          <div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>🔋 부등식 만족 상태</div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: isInequalitySatisfied ? '#16a34a' : '#dc2626', marginTop: '2px' }}>
              {isInequalitySatisfied ? '🟢 안전 (SAFE)' : '🔴 위험 침범 (FAIL)'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. [상단] 직접 조작형 이중 액션 SVG 월드 */}
      <div ref={svgRef} style={styles.svgBox}>
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ display: 'block', width: '100%', touchAction: 'none' }}>
          {/* 해수면 바닥 가이드 라인 (y=0, 실근 판단선) */}
          <line x1="10" y1="110" x2="490" y2="110" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4,3" />
          <text x="15" y="104" fill="#64748b" fontSize="9" fontWeight="bold">X축 바닥 기준선 (Y = 0)</text>

          {/* 궤도 레일 선 (붉은색 3차 곡선) */}
          <path d={pathD} fill="none" stroke="#e11d48" strokeWidth="3" opacity="0.8" />

          {/* 꼭대기 / 골짜기 센서 마커 */}
          <circle cx={toSvgCoords(peakX, currentPeakY)[0]} cy={toSvgCoords(peakX, currentPeakY)[1]} r="5" fill="#10b981" />
          <circle cx={toSvgCoords(valleyX, currentValleyY)[0]} cy={toSvgCoords(valleyX, currentValleyY)[1]} r="5" fill="#3b82f6" />

          {/* [조종 장치 1] 레일 전체 높이를 조종하는 오렌지색 십자 핸들 */}
          <g 
            transform={`translate(${handlePx}, ${handlePy})`} 
            style={{ cursor: activeDrag === 'curve' ? 'grabbing' : 'grab' }}
            onPointerDown={(e) => {
              e.preventDefault();
              setActiveDrag('curve');
            }}
          >
            <circle cx="0" cy="0" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
            <line x1="-7" y1="0" x2="7" y2="0" stroke="#ffffff" strokeWidth="2.5" />
            <line x1="0" y1="-7" x2="0" y2="7" stroke="#ffffff" strokeWidth="2.5" />
          </g>

          {/* [조종 장치 2] 암석 위험선을 슬라이딩하는 보라색 한계 기준선 */}
          <line 
            x1="10" y1={lineY} x2="450" y2={lineY} 
            stroke={isInequalitySatisfied ? '#8b5cf6' : '#ef4444'} 
            strokeWidth="3.5" 
            className={isInequalitySatisfied ? "" : "danger-line-anim"}
          />
          <g 
            transform={`translate(460, ${lineY})`} 
            style={{ cursor: activeDrag === 'line' ? 'grabbing' : 'grab' }}
            onPointerDown={(e) => {
              e.preventDefault();
              setActiveDrag('line');
            }}
          >
            <rect x="-14" y="-10" width="28" height="20" rx="5" fill={isInequalitySatisfied ? '#8b5cf6' : '#ef4444'} stroke="#ffffff" strokeWidth="1.5" />
            <line x1="-6" y1="-4" x2="6" y2="-4" stroke="#ffffff" strokeWidth="2" />
            <line x1="-6" y1="0" x2="6" y2="0" stroke="#ffffff" strokeWidth="2" />
            <line x1="-6" y1="4" x2="6" y2="4" stroke="#ffffff" strokeWidth="2" />
          </g>
          <text x="360" y={lineY - 6} fill={isInequalitySatisfied ? '#8b5cf6' : '#ef4444'} fontSize="9" fontWeight="bold">
            위험 한계 기준선 (Y = {cVal.toFixed(1)})
          </text>
        </svg>
      </div>

      {/* 3. [하단] 동기화 수학 그래프 좌표평면 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '2px solid #e2e8f0', position: 'relative' }}>
        <div className="mafs-7d-engine" style={{ position: 'relative', overflow: 'hidden' }}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={250}>
            <Coordinates.Cartesian />

            {/* X축 (실근 판별 기준선) */}
            <Line.Segment point1={[xRange[0], 0]} point2={[xRange[1], 0]} color="#1e293b" weight={2.5} />

            {/* 부등식 기준 수평선 y = c */}
            <Line.Segment 
              point1={[xRange[0], cVal]} 
              point2={[xRange[1], cVal]} 
              color={isInequalitySatisfied ? '#8b5cf6' : '#ef4444'} 
              weight={3} 
            />

            {/* 실시간 평행이동 곡선 */}
            <Plot.OfX y={f} color="#2563eb" weight={4.5} />

            {/* 꼭대기 극대 마커 */}
            <Point x={peakX} y={currentPeakY} color="#10b981" svgCircleProps={{ r: 5 }} />
            {isPeakTouchingX && (
              <Line.Segment point1={[peakX, 0]} point2={[0, 0]} color="#10b981" weight={2} style="dashed" />
            )}

            {/* 골짜기 극소(절대 최솟값) 마커 */}
            <Point x={valleyX} y={currentValleyY} color="#2563eb" svgCircleProps={{ r: 7 }} />
            {isValleyTouchingX && (
              <Line.Segment point1={[valleyX, 0]} point2={[0, 0]} color="#2563eb" weight={2} style="dashed" />
            )}

            {/* 부등식 한계 분석용 최솟값-기준선 연결 가이드 기하선 */}
            <Line.Segment 
              point1={[valleyX, currentValleyY]} 
              point2={[valleyX, cVal]} 
              color={isInequalitySatisfied ? '#16a34a' : '#dc2626'} 
              weight={2.5} 
            />

            {/* 실시간 발견된 진짜 교점(해)의 위치 표시 */}
            {currentRoots.map((rx, idx) => (
              <Point key={idx} x={rx} y={0} color="#ea580c" svgCircleProps={{ r: 6 }} />
            ))}
          </Mafs>

          {/* 4. 기하 좌표와 정밀 매핑되는 실시간 HTML 라벨 */}
          {/* 최솟값 기하 정보 오버레이 */}
          <div style={{
            ...styles.htmlLabel,
            left: `${((valleyX - xRange[0]) / (xRange[1] - xRange[0])) * 100}%`,
            top: `${((yRange[1] - currentValleyY) / (yRange[1] - yRange[0])) * 100}%`,
            transform: 'translate(-50%, -145%)',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}>
            ⚓ 꼴찌 골짜기 (Y = {currentValleyY.toFixed(1)})
          </div>

          {/* 기준선 정보 오버레이 */}
          <div style={{
            ...styles.htmlLabel,
            left: `${((5.8 - xRange[0]) / (xRange[1] - xRange[0])) * 100}%`,
            top: `${((yRange[1] - cVal) / (yRange[1] - yRange[0])) * 100}%`,
            transform: 'translate(-50%, 40%)',
            backgroundColor: isInequalitySatisfied ? '#8b5cf6' : '#ef4444',
            color: '#ffffff',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}>
            🎯 기준선 c = {cVal.toFixed(1)}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', fontWeight: 'bold', lineHeight: '1.4' }}>
        주황색 핸들로 <b>곡선 전체 높이</b>를 조종하고, 보라색 핸들로 <b>기준선 높이 c</b>를 조절해 보세요! <br />
        가장 낮은 꼴찌 골짜기(⚓)가 기준선 아래로 내려오는 순간 <span style={{ color: '#dc2626', textDecoration: 'underline' }}>부등식 불합격(FAIL) 경보</span>가 즉시 연동됩니다.
      </div>
    </div>
  );
}