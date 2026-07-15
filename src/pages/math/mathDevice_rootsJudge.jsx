import React, { useState, useRef, useEffect } from 'react';
import { Mafs, Coordinates, Plot, Point, Line } from 'mafs';
import { toRange } from './mathDeviceShared';

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
  const xRange = toRange(v.xRange, [0.2, 6.8]);
  const yRange = toRange(v.yRange, [-1.5, 4.5]);

  // 실시간 상태 값 (kShift: 핑코 수영 깊이 조절, coralHeight: 가시 산호초 높이)
  const st = sharedXByLog?.[logIdx] || {};
  const kShift = st.kShift ?? 1.5;         // 기본 수영 깊이 (골짜기 바닥 높이)
  const coralHeight = st.coralHeight ?? 0.5; // 산호초 높이 (위험 기준선)

  const patchState = (updatedFields) => {
    if (typeof setSharedXByLog !== 'function') return;
    setSharedXByLog(prev => ({
      ...prev,
      [logIdx]: { ...(prev?.[logIdx] || {}), ...updatedFields }
    }));
  };

  // 핑코가 헤엄치는 간단한 U자형 포물선 궤도 (복잡한 3차 함수 제거!)
  // x = 3.5 지점이 수영 중 가장 깊이 잠수하는 "골짜기 바닥(최솟값)"이 됩니다.
  const valleyX = 3.5;
  const f = (x) => 0.15 * (x - valleyX) * (x - valleyX) + kShift;

  const currentValleyY = kShift; // 가장 깊이 잠수한 높이는 바로 kShift 그 자체입니다.

  // 💡 [부등식의 핵심 직관] 가장 깊은 골짜기가 가시 산호초보다 높이 떠 있는가?
  const isSafe = currentValleyY > coralHeight;

  // 🚀 [드래그 버그 박멸] stale closure 해결을 위한 실시간 값 참조용 Refs
  const svgRef = useRef(null);
  const [activeDrag, setActiveDrag] = useState(null); // 'dolphin' | 'coral' | null
  const activeDragRef = useRef(activeDrag);
  const kShiftRef = useRef(kShift);
  const coralHeightRef = useRef(coralHeight);

  useEffect(() => { activeDragRef.current = activeDrag; }, [activeDrag]);
  useEffect(() => { kShiftRef.current = kShift; }, [kShift]);
  useEffect(() => { coralHeightRef.current = coralHeight; }, [coralHeight]);

  // 1:1 정밀 기하 맵핑 (mx는 [0.5, 6.5], my는 [-1.5, 4.5] 범위)
  const toSvgCoords = (mx, my) => {
    const sx = 50 + ((mx - 0.5) / 6.0) * 400; // 가로 400px 매핑
    const sy = 150 - ((my + 1.5) / 6.0) * 120; // 세로 120px 매핑 (해수면 0층은 sy=120)
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

      if (active === 'dolphin') {
        // 핑코 수영 높이 조절 범위 제한
        let targetY = Math.min(3.5, Math.max(-1.0, mathY));

        // 자석 스냅 효과 (산호초 바로 위에 핑코가 아슬아슬하게 닿을 때 챡 고정)
        if (Math.abs(targetY - coralHeightRef.current) < 0.15) {
          targetY = coralHeightRef.current;
        }
        patchState({ kShift: targetY });
      } 
      else if (active === 'coral') {
        // 가시 산호초 높이 조절 범위 제한
        let targetC = Math.min(3.0, Math.max(-1.2, mathY));

        // 자석 스냅 효과 (산호초가 핑코 배 끝에 닿을 때 챡 고정)
        if (Math.abs(targetC - kShiftRef.current) < 0.15) {
          targetC = kShiftRef.current;
        }
        patchState({ coralHeight: targetC });
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
  }, [activeDrag]);

  // 그래픽 렌더링에 필요한 주요 좌표 계산
  const [dolphinPx, dolphinPy] = toSvgCoords(valleyX, currentValleyY);
  const [, coralY] = toSvgCoords(valleyX, coralHeight);
  const [, zeroY] = toSvgCoords(valleyX, 0); // 해수면 Y=0층 픽셀

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
    hud: {
      background: isSafe ? '#f0fdf4' : '#fef2f2',
      border: `2px solid ${isSafe ? '#16a34a' : '#ef4444'}`,
      borderRadius: '12px', padding: '10px 14px', marginTop: '10px',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center', transition: 'all 0.3s'
    },
    svgBox: {
      background: '#e0f2fe', borderRadius: '16px', border: '2px solid #bae6fd',
      overflow: 'hidden', position: 'relative', touchAction: 'none'
    },
    htmlLabel: { position: 'absolute', pointerEvents: 'none', fontWeight: '900', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap', transition: 'all 0.1s ease-out' }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes alertPulse {
          0% { stroke-width: 3.5px; opacity: 1; }
          50% { stroke-width: 6.0px; opacity: 0.6; }
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
          🐠 돌고래 핑코와 가시 산호초를 위아래로 움직여 보세요!
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
          핑코가 물속에서 가장 깊이 내려가는 <b>'잠수 바닥 높이'</b>가 <br />
          뾰족한 <b>'가시 산호초의 높이'</b>보다 무조건 높이 떠 있어야 핑코가 다치지 않고 안전해요!
        </div>

        <div style={styles.hud}>
          <div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>📉 가장 깊은 잠수 높이</div>
            <div style={{ fontSize: '15px', fontWeight: '900', color: '#0284c7', marginTop: '2px' }}>
              {currentValleyY.toFixed(1)}층 깊이
            </div>
          </div>
          <div style={{ width: '1px', height: '28px', background: '#e2e8f0' }} />
          <div>
            <div style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 'bold' }}>🪸 가시 산호초 높이</div>
            <div style={{ fontSize: '15px', fontWeight: '900', color: '#dc2626', marginTop: '2px' }}>
              {coralHeight.toFixed(1)}층 높이
            </div>
          </div>
          <div style={{ width: '1px', height: '28px', background: '#e2e8f0' }} />
          <div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>🚦 돌고래 안전 상태</div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: isSafe ? '#16a34a' : '#dc2626', marginTop: '2px' }}>
              {isSafe ? '🟢 안전함 (SAFE)' : '🔴 다침! (DANGER)'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. [상단] 직관적인 돌고래 수중 월드 (SVG) */}
      <div ref={svgRef} style={styles.svgBox}>
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ display: 'block', width: '100%', touchAction: 'none' }}>
          {/* 하늘과 바다 */}
          <rect x="0" y="0" width="500" height={zeroY} fill="#bae6fd" />
          <rect x="0" y={zeroY} width="500" height={180 - zeroY} fill="#0284c7" />

          {/* 해수면 라인 (Y = 0) */}
          <line x1="10" y1={zeroY} x2="490" y2={zeroY} stroke="#ffffff" strokeWidth="2" strokeDasharray="5,4" opacity="0.6" />
          <text x="15" y={zeroY - 6} fill="#ffffff" fontSize="9" fontWeight="bold" opacity="0.8">해수면 (0층)</text>

          {/* 핑코 잠수 궤적 포물선 */}
          <path d={pathD} fill="none" stroke="#fef08a" strokeWidth="3" strokeDasharray="3,3" opacity="0.9" />

          {/* 뾰족뾰족 가시 산호초 위협선 (위험 기준선) */}
          <line 
            x1="10" y1={coralY} x2="450" y2={coralY} 
            stroke={isSafe ? '#ea580c' : '#dc2626'} 
            strokeWidth="3" 
            className={isSafe ? "" : "danger-line-anim"}
          />
          {/* 산호초 뾰족 가시 시각화 */}
          {Array.from({ length: 9 }).map((_, i) => (
            <polygon 
              key={i}
              points={`${35 + i * 50},${coralY} ${45 + i * 50},${coralY - 12} ${55 + i * 50},${coralY}`}
              fill={isSafe ? '#ea580c' : '#dc2626'}
              opacity="0.95"
            />
          ))}

          {/* [조종 장치 1] 드래그해서 잠수 높이를 조절하는 핑코 모델 */}
          <g 
            transform={`translate(${dolphinPx}, ${dolphinPy})`} 
            style={{ cursor: activeDrag === 'dolphin' ? 'grabbing' : 'grab' }}
            onPointerDown={(e) => {
              e.preventDefault();
              setActiveDrag('dolphin');
            }}
          >
            {/* 돌고래 캐릭터 */}
            <path d="M-14,-5 C-8,-12 6,-12 14,-3 C18,0 14,5 4,3 C0,2 -8,9 -14,3 Z" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
            <path d="M-14,-5 L-18,-2 L-16,1 Z" fill="#0284c7" />
            <path d="M-2,-9 L2,-15 L4,-9 Z" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" />
            <circle cx="7" cy="-5" r="1.8" fill="#0f172a" />
            {/* 조절용 상하 가이드 오렌지 화살표 */}
            <path d="M0,-24 L0,-16 M-3,-20 L0,-24 L3,-20 M0,10 L0,18 M-3,14 L0,18 L3,14" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* [조종 장치 2] 산호초 높이를 조작하는 우측의 빨간 손잡이 */}
          <g 
            transform={`translate(465, ${coralY})`} 
            style={{ cursor: activeDrag === 'coral' ? 'grabbing' : 'grab' }}
            onPointerDown={(e) => {
              e.preventDefault();
              setActiveDrag('coral');
            }}
          >
            <rect x="-14" y="-12" width="28" height="24" rx="6" fill={isSafe ? '#ea580c' : '#dc2626'} stroke="#ffffff" strokeWidth="2" />
            <line x1="-7" y1="-5" x2="7" y2="-5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-7" y1="1" x2="7" y2="1" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-7" y1="7" x2="7" y2="7" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          </g>
          <text x="330" y={coralY + 18} fill={isSafe ? '#ea580c' : '#dc2626'} fontSize="9" fontWeight="bold">
            가시 산호초 ({coralHeight.toFixed(1)}층)
          </text>
        </svg>
      </div>

      {/* 3. [하단] 동기화 수학 그래프 좌표평면 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '2px solid #e2e8f0', position: 'relative' }}>
        <div className="mafs-7d-engine" style={{ position: 'relative', overflow: 'hidden' }}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={250}>
            <Coordinates.Cartesian />

            {/* X축 (해수면) */}
            <Line.Segment point1={[xRange[0], 0]} point2={[xRange[1], 0]} color="#1e293b" weight={2.5} />

            {/* 산호초 높이 수평 기준선 y = coralHeight */}
            <Line.Segment 
              point1={[xRange[0], coralHeight]} 
              point2={[xRange[1], coralHeight]} 
              color={isSafe ? '#ea580c' : '#dc2626'} 
              weight={3} 
            />

            {/* 핑코 잠수 곡선 */}
            <Plot.OfX y={f} color="#0284c7" weight={4.5} />

            {/* 가장 깊은 잠수 포인트 (골짜기 최솟값) */}
            <Point x={valleyX} y={currentValleyY} color="#0284c7" svgCircleProps={{ r: 7 }} />

            {/* 안전 체크용 골짜기~산호초 연결선 */}
            <Line.Segment 
              point1={[valleyX, currentValleyY]} 
              point2={[valleyX, coralHeight]} 
              color={isSafe ? '#16a34a' : '#dc2626'} 
              weight={3} 
            />
          </Mafs>

          {/* 4. 기하 좌표와 정밀 매핑되는 실시간 HTML 라벨 */}
          <div style={{
            ...styles.htmlLabel,
            left: `${((valleyX - xRange[0]) / (xRange[1] - xRange[0])) * 100}%`,
            top: `${((yRange[1] - currentValleyY) / (yRange[1] - yRange[0])) * 100}%`,
            transform: 'translate(-50%, -145%)',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}>
            🐬 가장 깊은 곳 ({currentValleyY.toFixed(1)}층)
          </div>

          <div style={{
            ...styles.htmlLabel,
            left: `${((5.8 - xRange[0]) / (xRange[1] - xRange[0])) * 100}%`,
            top: `${((yRange[1] - coralHeight) / (yRange[1] - yRange[0])) * 100}%`,
            transform: 'translate(-50%, 40%)',
            backgroundColor: isSafe ? '#ea580c' : '#dc2626',
            color: '#ffffff',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}>
            🪸 산호초선 = {coralHeight.toFixed(1)}층
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', fontWeight: 'bold', lineHeight: '1.4' }}>
        핑코를 드래그해 <b>잠수 깊이</b>를 조절하고, 우측 손잡이로 <b>산호초 높이</b>를 바꿀 수 있습니다! <br />
        가장 깊이 잠수한 핑코 배 끝(🐬)이 산호초선 아래로 푹 가라앉으면 빨간색 <span style={{ color: '#dc2626', textDecoration: 'underline' }}>다침 위험 판정</span>으로 바뀝니다.
      </div>
    </div>
  );
}