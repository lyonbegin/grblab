import React, { useState, useRef, useEffect } from 'react';
import { Mafs, Coordinates, Plot, Point, Line } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

// 1. 부모 래퍼 (안전 조건 검사 전용 - 훅을 절대 사용하지 않음)
export function renderRootsJudge(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  return (
    <RootsJudgeDevice
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
function RootsJudgeDevice({ v, logIdx, sharedXByLog, setSharedXByLog }) {
  // 수학적 내부 수식 (아이들에게는 노출되지 않고 내부 연산용으로만 작동)
  const formula = '0.15*x*x*x - 1.2*x*x + 2*x + 3';
  const compiled = safeCompile(formula, 'explicit');

  const fBase = (x) => {
    if (!compiled) return 0.15 * x * x * x - 1.2 * x * x + 2 * x + 3;
    try {
      return compiled.evaluate({ x });
    } catch (e) {
      return 0.15 * x * x * x - 1.2 * x * x + 2 * x * 3;
    }
  };

  const xRange = toRange(v.xRange, [0.2, 6.8]);
  const yRange = toRange(v.yRange, [-1.5, 4.5]);

  // 극대 및 극소 지점 정의 (가장 낮게 내려가는 골짜기 위치: x = 4.30)
  const peakX = 1.033;
  const peakYBase = fBase(peakX); // 약 3.95
  const valleyX = 4.30;
  const valleyYBase = fBase(valleyX); // 약 1.34

  // 실시간 상태 값
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

  // 평행이동이 반영된 실시간 곡선 함수 f(x)
  const f = (x) => fBase(x) + kShift;

  // 실시간 X축(지면)과의 충돌 교점 탐색
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

  const currentPeakY = peakYBase + kShift;
  const currentValleyY = valleyYBase + kShift;

  // 💡 [개념 이해 핵심] 가장 낮은 골짜기가 그물망보다 같거나 높은가?
  const isSafe = currentValleyY >= cVal;

  const isPeakTouchingX = Math.abs(currentPeakY) < 0.12;
  const isValleyTouchingX = Math.abs(currentValleyY) < 0.12;

  // 🚀 [드래그 버그 박멸] stale closure 해결을 위한 실시간 값 참조용 Refs
  const svgRef = useRef(null);
  const [activeDrag, setActiveDrag] = useState(null); // 'curve' | 'line' | null
  const activeDragRef = useRef(activeDrag);
  const kShiftRef = useRef(kShift);
  const cValRef = useRef(cVal);

  useEffect(() => { activeDragRef.current = activeDrag; }, [activeDrag]);
  useEffect(() => { kShiftRef.current = kShift; }, [kShift]);
  useEffect(() => { cValRef.current = cVal; }, [cVal]);

  // 1:1 정밀 기하 맵핑 (mx는 [0.5, 6.5], my는 [-1.5, 4.5] 범위)
  const toSvgCoords = (mx, my) => {
    const sx = 50 + ((mx - 0.5) / 6.0) * 400; // 가로 400px 매핑
    const sy = 150 - ((my + 1.5) / 6.0) * 120; // 세로 120px 매핑 (지상 0층 Y=0은 sy=120이 됨)
    return [sx, sy];
  };

  useEffect(() => {
    if (!activeDrag) return;

    const handleMove = (e) => {
      const active = activeDragRef.current;
      if (!active) return;
      if (e.cancelable) e.preventDefault();

      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect || rect.height === 0) return;

      const clientY = e.clientY ?? e.touches?.[0]?.clientY;
      if (clientY === undefined) return;

      // 손가락 위치 픽셀을 수학 좌표의 Y값으로 역연산 (정밀 1:1 터치 싱크)
      const svgY = ((clientY - rect.top) / rect.height) * VB_H;
      const mathY = 6.0 * (150 - svgY) / 120 - 1.5;

      if (active === 'curve') {
        let targetK = mathY - fBase(3.5);
        targetK = Math.min(0.5, Math.max(-4.5, targetK));

        // 자석 스냅 효과 (꼭대기나 골짜기가 지면 0층에 닿을 때 챡 고정)
        if (Math.abs(peakYBase + targetK) < 0.15) targetK = -peakYBase;
        else if (Math.abs(valleyYBase + targetK) < 0.15) targetK = -valleyYBase;

        patchState({ kShift: targetK });
      } 
      else if (active === 'line') {
        let targetC = Math.min(4.2, Math.max(-1.2, mathY));

        // 자석 스냅 효과 (안전망이 레일 골짜기 바닥에 닿을 때 챡 고정)
        const currentMinHeight = valleyYBase + kShiftRef.current;
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
  }, [activeDrag]); // kShift 제거하여 버벅임 완전 차단

  const handleX = 3.5;
  const handleY = f(handleX);
  const [handlePx, handlePy] = toSvgCoords(handleX, handleY);
  const [, lineY] = toSvgCoords(handleX, cVal);
  const [, zeroY] = toSvgCoords(handleX, 0); // 지면 Y=120 픽셀

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
      background: isSafe ? '#f0fdf4' : '#fef2f2',
      border: `2px solid ${isSafe ? '#16a34a' : '#ef4444'}`,
      borderRadius: '12px', padding: '10px 14px', marginTop: '10px',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center', transition: 'all 0.3s'
    },
    svgBox: {
      background: '#fafafa', borderRadius: '16px', border: '2px solid #cbd5e1',
      overflow: 'hidden', position: 'relative', touchAction: 'none'
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

      {/* 1. 종합 실시간 판정 상태 전광판 (어려운 기호 완전 추방) */}
      <div style={styles.card}>
        <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'bold', marginBottom: '6px' }}>
          🏗️ 선로 전체와 빨간 그물망을 마우스로 움직여 보세요!
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
          롤러코스터 레일에서 가장 깊숙이 내려오는 <b>'골짜기 바닥'</b>이 <br />
          아래의 <b>'빨간 안전 그물망'</b>보다 무조건 높이 있어야 승객들이 안전하게 출발할 수 있어요!
        </div>

        <div style={styles.hud}>
          <div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>📡 지상 충돌 센서 (Y = 0)</div>
            <div style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>
              부딪힌 곳: {currentRoots.length}군데
            </div>
          </div>
          <div style={{ width: '1px', height: '28px', background: '#e2e8f0' }} />
          <div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>📉 가장 낮은 골짜기 높이</div>
            <div style={{ fontSize: '15px', fontWeight: '900', color: '#3b82f6', marginTop: '2px' }}>
              {currentValleyY.toFixed(1)}층 높이
            </div>
          </div>
          <div style={{ width: '1px', height: '28px', background: '#e2e8f0' }} />
          <div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>🚦 탑승안전 판정</div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: isSafe ? '#16a34a' : '#dc2626', marginTop: '2px' }}>
              {isSafe ? '🟢 안전출발 (SAFE)' : '🔴 추락위험 (FAIL)'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. [상단] 직접 조작형 이중 액션 SVG 월드 (함수식 없음) */}
      <div ref={svgRef} style={styles.svgBox}>
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ display: 'block', width: '100%', touchAction: 'none' }}>
          {/* 지상 0층선 (X축) */}
          <line x1="10" y1={zeroY} x2="490" y2={zeroY} stroke="#94a3b8" strokeWidth="2" strokeDasharray="4,3" />
          <text x="15" y={zeroY - 6} fill="#64748b" fontSize="9" fontWeight="bold">기본 지면선 (0층)</text>

          {/* 롤러코스터 레일 선 (붉은색 3차 곡선) */}
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

          {/* [조종 장치 2] 빨간색 안전 그물망 */}
          <line 
            x1="10" y1={lineY} x2="450" y2={lineY} 
            stroke={isSafe ? '#8b5cf6' : '#ef4444'} 
            strokeWidth="3.5" 
            className={isSafe ? "" : "danger-line-anim"}
          />
          <g 
            transform={`translate(460, ${lineY})`} 
            style={{ cursor: activeDrag === 'line' ? 'grabbing' : 'grab' }}
            onPointerDown={(e) => {
              e.preventDefault();
              setActiveDrag('line');
            }}
          >
            <rect x="-14" y="-10" width="28" height="20" rx="5" fill={isSafe ? '#8b5cf6' : '#ef4444'} stroke="#ffffff" strokeWidth="1.5" />
            <line x1="-6" y1="-4" x2="6" y2="-4" stroke="#ffffff" strokeWidth="2" />
            <line x1="-6" y1="0" x2="6" y2="0" stroke="#ffffff" strokeWidth="2" />
            <line x1="-6" y1="4" x2="6" y2="4" stroke="#ffffff" strokeWidth="2" />
          </g>
          <text x="330" y={lineY - 6} fill={isSafe ? '#8b5cf6' : '#ef4444'} fontSize="9" fontWeight="bold">
            빨간 안전 그물망선 ({cVal.toFixed(1)}층)
          </text>
        </svg>
      </div>

      {/* 3. [하단] 동기화 수학 그래프 좌표평면 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '2px solid #e2e8f0', position: 'relative' }}>
        <div className="mafs-7d-engine" style={{ position: 'relative', overflow: 'hidden' }}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={250}>
            <Coordinates.Cartesian />

            {/* X축 (지상 0층) */}
            <Line.Segment point1={[xRange[0], 0]} point2={[xRange[1], 0]} color="#1e293b" weight={2.5} />

            {/* 안전망 높이 수평선 y = c */}
            <Line.Segment 
              point1={[xRange[0], cVal]} 
              point2={[xRange[1], cVal]} 
              color={isSafe ? '#8b5cf6' : '#ef4444'} 
              weight={3} 
            />

            {/* 곡선 */}
            <Plot.OfX y={f} color="#2563eb" weight={4.5} />

            {/* 극대 꼭대기 */}
            <Point x={peakX} y={currentPeakY} color="#10b981" svgCircleProps={{ r: 5 }} />
            {isPeakTouchingX && (
              <Line.Segment point1={[peakX, 0]} point2={[0, 0]} color="#10b981" weight={2} style="dashed" />
            )}

            {/* 극소 골짜기 */}
            <Point x={valleyX} y={currentValleyY} color="#2563eb" svgCircleProps={{ r: 7 }} />
            {isValleyTouchingX && (
              <Line.Segment point1={[valleyX, 0]} point2={[0, 0]} color="#2563eb" weight={2} style="dashed" />
            )}

            {/* 안전 확인용 연결 점선 세로선 */}
            <Line.Segment 
              point1={[valleyX, currentValleyY]} 
              point2={[valleyX, cVal]} 
              color={isSafe ? '#16a34a' : '#dc2626'} 
              weight={2.5} 
            />

            {/* 지면과 만나는 충돌 포인트들 */}
            {currentRoots.map((rx, idx) => (
              <Point key={idx} x={rx} y={0} color="#ea580c" svgCircleProps={{ r: 6 }} />
            ))}
          </Mafs>

          {/* 4. 기하 좌표와 정밀 매핑되는 실시간 HTML 라벨 */}
          <div style={{
            ...styles.htmlLabel,
            left: `${((valleyX - xRange[0]) / (xRange[1] - xRange[0])) * 100}%`,
            top: `${((yRange[1] - currentValleyY) / (yRange[1] - yRange[0])) * 100}%`,
            transform: 'translate(-50%, -145%)',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}>
            ⚓ 레일 가장 밑 골짜기 ({currentValleyY.toFixed(1)}층)
          </div>

          <div style={{
            ...styles.htmlLabel,
            left: `${((5.8 - xRange[0]) / (xRange[1] - xRange[0])) * 100}%`,
            top: `${((yRange[1] - cVal) / (yRange[1] - yRange[0])) * 100}%`,
            transform: 'translate(-50%, 40%)',
            backgroundColor: isSafe ? '#8b5cf6' : '#ef4444',
            color: '#ffffff',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}>
            🎯 안전망 그물선 = {cVal.toFixed(1)}층
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', fontWeight: 'bold', lineHeight: '1.4' }}>
        주황색 핸들로 <b>선로 전체 높이</b>를 조종하고, 보라색 핸들로 <b>안전망 높이</b>를 조절해 보세요! <br />
        가장 낮은 꼴찌 골짜기(⚓)가 그물선보다 아래로 떨어지면 빨간색 <span style={{ color: '#dc2626', textDecoration: 'underline' }}>추락 위험 판정</span>으로 바뀝니다.
      </div>
    </div>
  );
}