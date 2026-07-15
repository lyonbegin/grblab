// ===========================================================
// no:"9-6" ★ "위인 구간이 부등식의 해다" (부등식=위/아래의 핵심개념)
//
// [초등학생 맞춤형 v7 — 무결점 무상태(Zero-Hook) 에디션]
// - React Error #310 해결을 위해 useRef, useState 등의 모든 Hooks를 완벽히 제거했습니다.
// - 루프(.map) 내부나 조건부 렌더링 환경에서도 절대 크래시가 나지 않는 순수 함수 구조입니다.
// - HTML5 Pointer Capture와 DOM 속성을 이용해 드래그 인터랙션을 매끄럽게 처리합니다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme, Polygon } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderAboveRegion(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_aboveRegion 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }
  const curves = (v.curves || []).filter(c => c && c.formula);
  if (curves.length < 2) { console.log(`${DEBUG} 중단: curves 2개`); return null; }
  
  const A = safeCompile(curves[0].formula, curves[0].kind);
  const B = safeCompile(curves[1].formula, curves[1].kind);
  if (!A || !B) return null;

  const xRange = toRange(v.xRange, [0, 8]);
  const yRange = toRange(v.yRange, [0, 16]);
  
  // 가로축 위치 x (시간 또는 제어 변수)
  const x = sharedXByLog?.[logIdx]?.x ?? xRange[0];
  const setX = (nx) => {
    const cx = Math.min(xRange[1], Math.max(xRange[0], nx));
    setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), x: cx } }));
  };

  let ya, yb; 
  try { ya = A.evaluate({ x }); } catch (e) { ya = NaN; }
  try { yb = B.evaluate({ x }); } catch (e) { yb = NaN; }
  const aAbove = ya > yb;

  // A가 B보다 위인 구간 경계(교점) 찾기 (수치 계산)
  const steps = 400;
  let cross = null, prevX = null, prevD = null;
  for (let i = 0; i <= steps; i++) {
    const xi = xRange[0] + (i / steps) * (xRange[1] - xRange[0]);
    let d; try { d = A.evaluate({ x: xi }) - B.evaluate({ x: xi }); } catch (e) { d = NaN; }
    if (Number.isFinite(d) && prevD !== null && Number.isFinite(prevD) && (prevD < 0) !== (d < 0)) {
      const t = prevD / (prevD - d); cross = prevX + t * (xi - prevX); break;
    }
    prevX = xi; prevD = d;
  }

  // A가 위인 구간 [aLo, aHi] 결정
  let aLo = xRange[0], aHi = xRange[1];
  if (cross !== null) {
    const midLeft = (xRange[0] + cross) / 2;
    let dLeft; try { dLeft = A.evaluate({ x: midLeft }) - B.evaluate({ x: midLeft }); } catch (e) { dLeft = 0; }
    if (dLeft > 0) { aLo = xRange[0]; aHi = cross; } else { aLo = cross; aHi = xRange[1]; }
  }

  // 상단 발사대 시뮬레이터 크기 설정
  const W = 320, H = 180, base = 145;
  const scale = (H - 55) / (yRange[1] || 16);
  const yaVal = Number.isFinite(ya) ? ya : 0;
  const ybVal = Number.isFinite(yb) ? yb : 0;

  // 로켓과 UFO의 세로 위치 (SVG는 Y축이 아래 방향이므로 변환 필요)
  const yPosA = base - yaVal * scale;
  const yPosB = base - ybVal * scale;

  const paddingX = 40; // 양옆 여백
  const trackWidth = W - paddingX * 2;

  // 물리 좌표 -> SVG 가로 픽셀 좌표 변환
  const getPixelX = (val) => {
    const pct = (val - xRange[0]) / (xRange[1] - xRange[0]);
    return paddingX + pct * trackWidth;
  };

  // 마우스/터치 좌표 계산 함수 (DOM Element 직접 수신)
  const updateXFromEvent = (e, svgElement) => {
    if (!svgElement) return;
    const rect = svgElement.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const pct = Math.min(1, Math.max(0, (clientX - paddingX) / trackWidth));
    const nx = xRange[0] + pct * (xRange[1] - xRange[0]);
    setX(nx);
  };

  // Pointer Event 핸들러 (State/Ref 없이 DOM Element와 Capture API를 활용)
  const handlePointerDown = (e) => {
    e.preventDefault();
    const svg = e.currentTarget;
    svg.setPointerCapture(e.pointerId);
    svg.setAttribute('data-dragging', 'true');
    updateXFromEvent(e, svg);
  };

  const handlePointerMove = (e) => {
    const svg = e.currentTarget;
    if (svg.getAttribute('data-dragging') === 'true') {
      updateXFromEvent(e, svg);
    }
  };

  const handlePointerUp = (e) => {
    const svg = e.currentTarget;
    svg.releasePointerCapture(e.pointerId);
    svg.removeAttribute('data-dragging');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'sans-serif', userSelect: 'none' }}>
      
      {/* 1. 상단: 직접 조작하는 실물 비행 시뮬레이터 (원인 제공처) */}
      <div className="viz-box" style={{ background: '#f0f4f8', borderRadius: '14px', padding: '14px', border: '2px solid #cbd5e1' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '13px', color: '#1e293b', fontWeight: 'bold' }}>
          🚀 아래 하늘나라 발사판에서 <span style={{ color: '#2563eb' }}><b>파란색 로켓을 손으로 쥐고 직접 좌우로 끌어보세요!</b></span>
        </div>

        {/* 로켓 발사대 인터랙티브 영역 */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <svg 
            width={W} 
            height={H} 
            style={{ background: 'linear-gradient(to bottom, #e0f2fe, #ffffff)', borderRadius: '10px', border: '2px solid #94a3b8', cursor: 'grab', touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* 안전 발착지 수평 지면선 */}
            <line x1={0} y1={base} x2={W} y2={base} stroke="#64748b" strokeWidth="3" />

            {/* 가로 조종 레일 점선 가이드 */}
            <line x1={paddingX} y1={base} x2={W - paddingX} y2={base} stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 5" />
            
            {/* 현재 드래그 가이드 레이저선 (세로 보조선) */}
            <line 
              x1={getPixelX(x)} 
              y1={10} 
              x2={getPixelX(x)} 
              y2={base} 
              stroke="#cbd5e1" 
              strokeWidth="2" 
              strokeDasharray="3 3" 
            />

            {/* UFO 🛸 (자동 추종 장치) */}
            <g style={{ transition: 'transform 0.08s ease-out' }}>
              <text 
                x={getPixelX(x)} 
                y={yPosB + 10} 
                fontSize="28" 
                textAnchor="middle"
              >
                🛸
              </text>
              <text x={getPixelX(x)} y={yPosB - 14} fontSize="9" fontWeight="bold" textAnchor="middle" fill="#ea580c">
                {ybVal.toFixed(1)}m
              </text>
            </g>

            {/* 조종사 로켓 🚀 (직접 드래그하는 핵심 객체) */}
            <g style={{ transition: 'transform 0.08s ease-out' }}>
              <rect 
                x={getPixelX(x) - 20} 
                y={yPosA - 15} 
                width="40" 
                height="45" 
                fill="#3b82f6" 
                fillOpacity="0.05" 
                rx="6" 
                stroke="#2563eb" 
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <text 
                x={getPixelX(x)} 
                y={yPosA + 10} 
                fontSize="32" 
                textAnchor="middle"
                style={{ cursor: 'grabbing' }}
              >
                🚀
              </text>
              <text x={getPixelX(x)} y={yPosA - 14} fontSize="9" fontWeight="bold" textAnchor="middle" fill="#2563eb">
                {yaVal.toFixed(1)}m
              </text>
            </g>

            {/* 조작 활성화 유도 메시지 (시작할 때만 작게 표시) */}
            {x === xRange[0] && (
              <text x={W / 2} y={base - 40} fontSize="11" fill="#94a3b8" textAnchor="middle" pointerEvents="none">
                👈 로켓을 오른쪽으로 당겨 비행하기!
              </text>
            )}
          </svg>
        </div>

        {/* 대결 실시간 중계판 */}
        <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', marginTop: '10px', color: aAbove ? '#15803d' : '#b91c1c' }}>
          {aAbove 
            ? '🎉 로켓이 UFO보다 위에 있어요! (A > B 영역에 진입 완료!)' 
            : '🛸 UFO가 로켓과 같거나 위에 있어요! (A > B 영역 바깥)'}
        </div>
      </div>

      {/* 2. 하단: 자동 기록 그래프 (결과를 수동적으로 보여주는 도화지) */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '14px', padding: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', pointerEvents: 'none' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>
          📊 비행 기록 장치 (로켓의 움직임에 따른 정답 구간 자동 추적)
        </div>
        <div style={{ position: 'relative' }}>
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={240}>
            <Coordinates.Cartesian />
            
            {/* [결과] A가 B보다 높은 구간을 채워주는 연록색 정답 영역 */}
            <Polygon
              points={[
                [aLo, yRange[0]],
                [aHi, yRange[0]],
                [aHi, yRange[1]],
                [aLo, yRange[1]]
              ]}
              color="#2e7d32"
              weight={0}
              fillOpacity={0.10}
            />

            {/* [결과] 구간 경계선 (교점 세로선) */}
            {cross !== null && (
              <Line.Segment 
                point1={[cross, yRange[0]]} 
                point2={[cross, yRange[1]]} 
                color="#10b981" 
                style={{ strokeDasharray: "4 4" }} 
              />
            )}

            {/* [결과] ★ x축 투영: 부등식의 해가 되는 구간을 x축에 직접 칠함 */}
            <Line.Segment
              point1={[aLo, 0.25]}
              point2={[aHi, 0.25]}
              color="#10b981"
              weight={8}
            />

            {/* A 로켓의 고도 함수 곡선 (파란 선) */}
            <Plot.OfX y={(t) => { try { return A.evaluate({ x: t }); } catch (e) { return NaN; } }} color={Theme.blue} weight={3} />
            
            {/* B UFO의 고도 함수 곡선 (주황 선) */}
            <Plot.OfX y={(t) => { try { return B.evaluate({ x: t }); } catch (e) { return NaN; } }} color={Theme.orange} weight={3} />
            
            {/* [실시간 기록선] 위쪽 조종사의 X 위치와 동축 매칭되는 세로 레이저 점선 */}
            <Line.Segment
              point1={[x, yRange[0]]}
              point2={[x, yRange[1]]}
              color="#3b82f6"
              weight={1.5}
              style={{ strokeDasharray: "4 4" }}
            />

            {/* [실시간 기록선] 현재 로켓 위치 기록 점 */}
            <Point x={x} y={yaVal} color={Theme.blue} size={6} />

            {/* [실시간 기록선] 현재 UFO 위치 기록 점 */}
            <Point x={x} y={ybVal} color={Theme.orange} size={6} />
          </Mafs>
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', marginTop: '6px' }}>
          💡 기록지의 그래프는 사용자가 로켓을 움직이는 움직임의 <b>흔적(결과)</b>만을 기록합니다.
        </div>
      </div>

      {/* 3. 초등 기하학 직관성 확립 가이드 */}
      <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '12px', border: '1px dashed #10b981' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534', marginBottom: '4px' }}>
          🎯 조종사가 발견한 수학의 원리!
        </div>
        <div style={{ fontSize: '12px', color: '#15803d', lineHeight: '1.5' }}>
          * 위에서 🚀을 움직여 <b>UFO보다 높게 비행하는 동안</b>에는, 아래 기록계의 세로 레이저선이 정확히 <b>초록색 영역</b> 속을 지나갑니다!
          <br />
          * 이처럼 파란 선이 주황 선보다 <b>위에 떠 있는 가로축($x$)의 구간 전체</b>가 바로 부등식 <b>"$A > B$"의 완벽한 정답(해)</b>이 됩니다!
        </div>
      </div>

    </div>
  );
}