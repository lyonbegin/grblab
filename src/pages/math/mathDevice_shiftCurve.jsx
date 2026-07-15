import React, { useState, useRef, useEffect } from 'react';
import { Mafs, Coordinates, Plot, Point, Line } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

// 1. 부모 래퍼 (안전 조건 검사 전용 - 훅을 절대 사용하지 않음)
export function renderShiftCurve(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null; // 여기서 탈출해도 자식 훅에 전혀 영향 없음!

  return (
    <ShiftCurveDevice
      v={v}
      logIdx={logIdx}
      sharedXByLog={sharedXByLog}
      setSharedXByLog={setSharedXByLog}
    />
  );
}

// 2. 실제 디바이스 컴포넌트 (모든 훅은 이 안전지대 내부에서 무조건 100% 실행됨)
function ShiftCurveDevice({ v, logIdx, sharedXByLog, setSharedXByLog }) {
  // 수학적 기초 수식 정의 (기본 3차 곡선)
  // f(x) = 0.15x^3 - 1.2x^2 + 2x + 3
  const formula = (v.curves || [])[0]?.formula || '0.15*x*x*x - 1.2*x*x + 2*x + 3';
  const compiled = safeCompile(formula, 'explicit');

  // safeCompile 실패 시의 Fallback 가이드라인 적용
  const fBase = (x) => {
    if (!compiled) return 0.15 * x * x * x - 1.2 * x * x + 2 * x + 3;
    try {
      return compiled.evaluate({ x });
    } catch (e) {
      return 0.15 * x * x * x - 1.2 * x * x + 2 * x + 3;
    }
  };

  const xRange = toRange(v.xRange, [0.2, 6.8]);
  const yRange = toRange(v.yRange, [-1.5, 4.5]);

  // 극대 및 극소 지점의 엄밀한 수학적 극값 정의 (스냅 및 감지용)
  const peakX = 1.033;
  const peakYBase = fBase(peakX); // 약 3.95
  const valleyX = 4.30;
  const valleyYBase = fBase(valleyX); // 약 1.34

  // 통합 연동용 Y축 평행이동 값 k 상태 관리
  const st = sharedXByLog?.[logIdx] || {};
  const kShift = st.kShift ?? 0.0;

  const patchState = (updatedFields) => {
    if (typeof setSharedXByLog !== 'function') return;
    setSharedXByLog(prev => ({
      ...prev,
      [logIdx]: { ...(prev?.[logIdx] || {}), ...updatedFields }
    }));
  };

  // 평행이동이 반영된 실시간 최종 함수 f(x) = fBase(x) + kShift
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

  // 임계 경계선 스냅 상태 감지
  const isPeakTouching = Math.abs(currentPeakY) < 0.12;
  const isValleyTouching = Math.abs(currentValleyY) < 0.12;
  const isAtBoundary = isPeakTouching || isValleyTouching;

  // 직접 드래그 인터랙션 제어부 (SVG 물리 디바이스용)
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // SVG 픽셀 좌표와 수학 좌표 1:1 기하 매핑
  // viewBox="0 0 500 180" 고정 좌표계 기준. 실제 렌더 크기가 달라져도
  // 이 함수가 그리는 도형은 항상 이 고정 좌표계를 쓴다.
  const toSvgCoords = (mx, my) => {
    const sx = 50 + ((mx - 0.5) / 6.0) * 400; // 가로 400px 폭
    const sy = 110 - (my / 4.0) * 80;        // 세로 해수면(y=0) 기준 110px 매핑
    return [sx, sy];
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      // 터치 드래그 중 페이지가 함께 스크롤되며 충돌하는 것을 막는다.
      if (e.cancelable) e.preventDefault();

      const rect = svgRef.current?.getBoundingClientRect();
      // rect 높이가 0이거나 없을 때의 오동작 방지 예외처리 추가
      if (!rect || rect.height === 0) return;

      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY;
      if (clientY === undefined || clientX === undefined) return;

      // [수정] rect.height(실제 화면 픽셀)가 아니라 viewBox 고정 좌표계(180)를 써야
      // toSvgCoords가 그린 도형과 좌표가 일치한다. 화면 크기가 달라질 때마다
      // rect.height도 달라지는데, 그걸 그대로 곱하면 손가락 위치와 핸들 위치가
      // 어긋나면서 터치할 때마다 핸들이 엉뚱한 데로 튀는 원인이 됐다.
      const pctY = (clientY - rect.top) / rect.height;
      const mathY = (110 - (pctY * 180)) / 80 * 4.0;

      let targetK = mathY - fBase(3.5); // 궤도 중심점(x=3.5) 기준
      targetK = Math.min(0.5, Math.max(-4.5, targetK));

      // [초등 선행용 자석 스냅 구현]
      if (Math.abs(peakYBase + targetK) < 0.15) {
        targetK = -peakYBase;
      }
      else if (Math.abs(valleyYBase + targetK) < 0.15) {
        targetK = -valleyYBase;
      }

      patchState({ kShift: targetK });
    };

    const handleUp = () => setIsDragging(false);

    // pointermove와 touchmove 시에 전역 이벤트를 매끄럽게 처리
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
  }, [isDragging]); // 🚀 kShift 의존성을 완전히 제거하여 드래그 렉 현상을 원천 차단!

  // 핸들 조작 위치 계산
  const handleX = 3.5;
  const handleY = f(handleX);
  const [handlePx, handlePy] = toSvgCoords(handleX, handleY);

  // 🚀 [해결] 기존의 잘못된 destructuring [seaY]를 [, seaY]로 수정하여 Y좌표를 정확히 분해해 옴
  const [, seaY] = toSvgCoords(handleX, 0);

  // 물리 궤도 패스 빌드
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
      background: isAtBoundary ? '#fef3c7' : '#f1f5f9',
      border: `2px solid ${isAtBoundary ? '#f59e0b' : '#cbd5e1'}`,
      borderRadius: '12px', padding: '10px 14px', marginTop: '10px',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center', transition: 'all 0.3s'
    },
    svgBox: {
      background: '#f8fafc', borderRadius: '16px', border: '2px solid #cbd5e1',
      overflow: 'hidden', position: 'relative', cursor: isDragging ? 'grabbing' : 'grab',
      // 터치로 드래그하는 동안 브라우저의 기본 스크롤/줌 제스처가 끼어들지 않게 막는다.
      touchAction: 'none'
    },
    htmlLabel: { position: 'absolute', pointerEvents: 'none', fontWeight: '900', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap', transition: 'all 0.1s ease-out' }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes boundaryPulse {
          0% { r: 6px; opacity: 1; stroke-width: 2px; }
          100% { r: 25px; opacity: 0; stroke-width: 4px; }
        }
        .boundary-glow {
          animation: boundaryPulse 0.8s infinite ease-out;
        }
        .mafs-7c-engine .MafsView { background-color: transparent !important; }
        .mafs-7c-engine .MafsView svg { overflow: visible !important; }
      `}</style>

      {/* 1. 상단 수학적 한계 상황판 (HUD) */}
      <div style={styles.card}>
        <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'bold', marginBottom: '6px' }}>
          🏗️ 오렌지색 조종 핸들을 잡아 위아래로 끌어 올려 보세요!
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
          곡선을 엘리베이터처럼 통째로 수직 이동시켜도 바닥에 닿는 개수가 바뀝니다. <br />
          <b>산꼭대기나 골짜기가 바닥에 딱 스치는 경계의 찰나</b>에 무슨 일이 일어나는지 관측해 봐요!
        </div>

        {/* 실시간 락온 계기판 */}
        <div style={styles.hud}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>📐 엘리베이터 높이 (k)</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginTop: '2px' }}>
              {kShift > 0 ? `+${kShift.toFixed(2)}` : kShift.toFixed(2)} 칸 이동
            </div>
          </div>
          <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }} />
          <div>
            <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 'bold' }}>🚨 현재 접촉 상태</div>
            <div style={{ fontSize: '14px', fontWeight: '900', color: isAtBoundary ? '#b45309' : '#475569', marginTop: '3px' }}>
              {isPeakTouching && '👑 꼭대기가 해수면에 접함!'}
              {isValleyTouching && '🕳️ 골짜기가 해수면에 접함!'}
              {!isPeakTouching && !isValleyTouching && '💨 공중에 떠 있는 중'}
            </div>
          </div>
          <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }} />
          <div>
            <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold' }}>🔑 진짜 해(실근)의 개수</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#15803d', marginTop: '1px' }}>
              {currentRoots.length} 개
            </div>
          </div>
        </div>
      </div>

      {/* 2. [상단] 핸들을 직접 조작하는 해저 궤도 기지 (SVG) */}
      <div
        ref={svgRef}
        style={styles.svgBox}
        onPointerDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
      >
        <svg viewBox="0 0 500 180" style={{ display: 'block', width: '100%', touchAction: 'none' }}>
          {/* 바다 상단/하단 영역 렌더링 */}
          <rect x="0" y="0" width="500" height={seaY} fill="#e0f2fe" />
          <rect x="0" y={seaY} width="500" height={180 - seaY} fill="#0284c7" opacity="0.9" />

          {/* 해수면 바닥 감지 라인 (Y = 0) */}
          <line x1="10" y1={seaY} x2="490" y2={seaY} stroke="#fef08a" strokeWidth="3" strokeDasharray="5,3" />
          <text x="15" y={seaY - 8} fill="#0f172a" fontSize="10" fontWeight="bold" opacity="0.6">해수면 바닥선 (Y = 0)</text>

          {/* 실시간 춤추는 전체 궤도 레일 */}
          <path d={pathD} fill="none" stroke="#e11d48" strokeWidth="3" opacity="0.85" />

          {/* 꼭대기 접촉 센서 지점 */}
          <circle cx={toSvgCoords(peakX, currentPeakY)[0]} cy={toSvgCoords(peakX, currentPeakY)[1]} r="6" fill="#10b981" />
          {isPeakTouching && (
            <circle cx={toSvgCoords(peakX, 0)[0]} cy={seaY} r="18" fill="none" stroke="#10b981" className="boundary-glow" />
          )}

          {/* 골짜기 접촉 센서 지점 */}
          <circle cx={toSvgCoords(valleyX, currentValleyY)[0]} cy={toSvgCoords(valleyX, currentValleyY)[1]} r="6" fill="#ef4444" />
          {isValleyTouching && (
            <circle cx={toSvgCoords(valleyX, 0)[0]} cy={seaY} r="18" fill="none" stroke="#ef4444" className="boundary-glow" />
          )}

          {/* [조작의 주체] 레일 중앙의 오렌지색 기하 핸들 */}
          <g transform={`translate(${handlePx}, ${handlePy})`}>
            <circle cx="0" cy="0" r="15" fill="#f97316" stroke="#ffffff" strokeWidth="2.5" />
            <line x1="-8" y1="0" x2="8" y2="0" stroke="#ffffff" strokeWidth="3" />
            <line x1="0" y1="-8" x2="0" y2="8" stroke="#ffffff" strokeWidth="3" />
          </g>
        </svg>
      </div>

      {/* 3. [하단] 동기화 수학 그래프 좌표평면 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '2px solid #e2e8f0', position: 'relative' }}>
        <div className="mafs-7c-engine" style={{ position: 'relative', overflow: 'hidden' }}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={250}>
            <Coordinates.Cartesian />

            {/* X축 (바닥 기준선) */}
            <Line.Segment point1={[xRange[0], 0]} point2={[xRange[1], 0]} color="#1e293b" weight={2.5} />

            {/* 실시간 평행이동이 반영되는 3차 함수 곡선 */}
            <Plot.OfX y={f} color="#2563eb" weight={4.5} />

            {/* 꼭대기 극대점 보석 마커 */}
            <Point x={peakX} y={currentPeakY} color="#10b981" svgCircleProps={{ r: 5 }} />
            {isPeakTouching && (
              <Line.Segment point1={[peakX, 0]} point2={[0, 0]} color="#10b981" weight={2.5} style="dashed" />
            )}

            {/* 골짜기 극소점 보석 마커 */}
            <Point x={valleyX} y={currentValleyY} color="#ef4444" svgCircleProps={{ r: 5 }} />
            {isValleyTouching && (
              <Line.Segment point1={[valleyX, 0]} point2={[0, 0]} color="#ef4444" weight={2.5} style="dashed" />
            )}

            {/* 실시간 검출된 진짜 교점(해)들 위치 렌더링 */}
            {currentRoots.map((rx, idx) => (
              <Point key={idx} x={rx} y={0} color="#ea580c" svgCircleProps={{ r: 6.5 }} />
            ))}
          </Mafs>

          {/* 4. 기하 궤적을 1:1로 가리키는 실시간 오버레이 수치 라벨 */}
          <div style={{
            ...styles.htmlLabel,
            left: `${((handleX - xRange[0]) / (xRange[1] - xRange[0])) * 100}%`,
            top: `${((yRange[1] - handleY) / (yRange[1] - yRange[0])) * 100}%`,
            transform: 'translate(-50%, -145%)',
            backgroundColor: isAtBoundary ? '#d97706' : '#1e293b',
            color: '#ffffff',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}>
            {isAtBoundary ? '🚨 스냅 접촉 경계면 안착!' : `🎛️ 엘리베이터 높이 제어 중`}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>
        👇 상단 바다 속 <b>오렌지색 십자 조종 핸들</b>을 직접 마우스로 잡고 위아래로 움직여 보세요! <br />
        경계 부근에 도달하면 꼭대기와 골짜기가 바닥에 스무스하게 <b>자석처럼 챡 달라붙는 스냅 피드백</b>을 경험할 수 있습니다.
      </div>
    </div>
  );
}