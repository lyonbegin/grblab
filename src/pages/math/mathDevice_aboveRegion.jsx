// ===========================================================
// no:"9-6" ★ "위인 구간이 부등식의 해다" (부등식=위/아래의 핵심개념)
//
// [초등학생 맞춤형 v4 — 로켓 고도 대결 & x축 투영 연관 사고 에디션]
// - 물기둥 비교를 "파란 로켓 🚀 vs 주황 UFO 🛸" 대결로 리디자인했습니다.
// - 부등식의 해를 x축 위에 직접 두꺼운 초록색 바(Bar)로 투영하여 표현했습니다.
// - Mafs의 Polygon 컴포넌트를 사용하여 경계 구역을 깔끔하고 안정적으로 색칠했습니다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme, MovablePoint, Polygon } from 'mafs';
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

  // 상단 발사대 시뮬레이터 수치 설정
  const W = 220, H = 160, base = 135;
  const scale = (H - 45) / (yRange[1] || 16);
  const yaVal = Number.isFinite(ya) ? ya : 0;
  const ybVal = Number.isFinite(yb) ? yb : 0;

  // 로켓과 UFO의 세로 위치 (SVG 좌표계는 위가 0이므로 빼줌)
  const yPosA = base - yaVal * scale;
  const yPosB = base - ybVal * scale;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'sans-serif' }}>
      
      {/* 1. 상단 컨트롤러 및 로켓 발사대 대결판 */}
      <div className="viz-box" style={{ background: '#f5f6fa', borderRadius: '12px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>
          ⏱️ 시간 슬라이더를 밀어 로켓들의 고도를 바꾸어 보세요!
        </div>
        
        {/* 슬라이더 컨트롤 */}
        <input 
          type="range" 
          min={xRange[0]} 
          max={xRange[1]} 
          step={0.1} 
          value={x}
          onChange={(e) => setX(parseFloat(e.target.value))} 
          style={{ width: '90%', display: 'block', margin: '0 auto 10px', accentColor: '#3b82f6' }} 
        />

        {/* 로켓 발사대 비주얼 */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
          <svg width={W} height={H} style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            {/* 발사대 배경 가이드선 */}
            <line x1={0} y1={base} x2={W} y2={base} stroke="#94a3b8" strokeWidth="2" />
            <line x1={W/2} y1={10} x2={W/2} y2={base} stroke="#f1f5f9" strokeWidth="2" strokeDasharray="4 4" />

            {/* A 로켓이 출발하는 길 */}
            <rect x={35} y={10} width={30} height={base - 10} fill="#f8fafc" stroke="#e2e8f0" rx="3" />
            {/* B UFO가 출발하는 길 */}
            <rect x={155} y={10} width={30} height={base - 10} fill="#f8fafc" stroke="#e2e8f0" rx="3" />

            {/* A 로켓 (Emoji) */}
            <text x={50} y={yPosA + 8} fontSize="24" textAnchor="middle" style={{ transition: 'all 0.1s ease-out' }}>🚀</text>
            
            {/* B UFO (Emoji) */}
            <text x={170} y={yPosB + 8} fontSize="24" textAnchor="middle" style={{ transition: 'all 0.1s ease-out' }}>🛸</text>

            {/* 고도 텍스트 라벨 */}
            <text x={50} y={base + 16} fontSize="11" fontWeight="bold" textAnchor="middle" fill="#1d4ed8">A 로켓</text>
            <text x={50} y={yPosA - 10} fontSize="10" textAnchor="middle" fill="#1e40af">{yaVal.toFixed(1)}m</text>

            <text x={170} y={base + 16} fontSize="11" fontWeight="bold" textAnchor="middle" fill="#ea580c">B UFO</text>
            <text x={170} y={yPosB - 10} fontSize="10" textAnchor="middle" fill="#c2410c">{ybVal.toFixed(1)}m</text>
          </svg>
        </div>

        {/* 대결 실시간 중계 */}
        <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', marginTop: '10px', color: aAbove ? '#15803d' : '#b91c1c' }}>
          {aAbove 
            ? '🎉 지금은 A 로켓이 더 높아요! (A > B, 해의 범위가 맞아요!)' 
            : '🛸 지금은 B UFO가 더 높거나 같아요! (해의 범위가 아니에요)'}
        </div>
      </div>

      {/* 2. 메인 그래프: 비행 궤도와 수학적 해의 투영 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '12px', padding: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>
          📈 그래프 비행 분석 (A 로켓이 위를 달리는 구간이 바로 부등식의 정답!)
        </div>
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={260}>
          <Coordinates.Cartesian />
          
          {/* A가 B보다 높은 구간을 채워주는 아름다운 연록색 안전 구역 (Polygon) */}
          <Polygon
            points={[
              [aLo, yRange[0]],
              [aHi, yRange[0]],
              [aHi, yRange[1]],
              [aLo, yRange[1]]
            ]}
            color="#2e7d32"
            weight={0}
            fillOpacity={0.12}
          />

          {/* 구간의 양쪽 경계선(교점 세로선) */}
          {cross !== null && (
            <Line.Segment 
              point1={[cross, yRange[0]]} 
              point2={[cross, yRange[1]]} 
              color="#2e7d32" 
              style={{ strokeDasharray: "4 4" }} 
            />
          )}

          {/* ★ 수학적 사고력 핵심: x축 상에 직접 그려지는 '부등식의 해'의 영역 투영 */}
          <Line.Segment
            point1={[aLo, 0.2]}
            point2={[aHi, 0.2]}
            color="#2e7d32"
            weight={8}
          />

          {/* A 로켓의 비행 궤도 (파란 곡선) */}
          <Plot.OfX y={(t) => { try { return A.evaluate({ x: t }); } catch (e) { return NaN; } }} color={Theme.blue} weight={3} />
          
          {/* B UFO의 비행 궤도 (주황 곡선) */}
          <Plot.OfX y={(t) => { try { return B.evaluate({ x: t }); } catch (e) { return NaN; } }} color={Theme.orange} weight={3} />
          
          {/* 두 발사체의 세로 동축 레이저 가이드선 */}
          <Line.Segment
            point1={[x, yRange[0]]}
            point2={[x, yRange[1]]}
            color="#94a3b8"
            style={{ strokeDasharray: "3 3" }}
          />

          {/* UFO 실시간 비행 위치 표시 점 */}
          <Point x={x} y={Number.isFinite(yb) ? yb : 0} color={Theme.orange} size={5} />

          {/* 직접 드래그할 수 있는 로켓 실시간 비행 위치 조종기 */}
          <MovablePoint
            point={[x, Number.isFinite(ya) ? ya : 0]}
            constrain={(pos) => {
              const cx = Math.min(xRange[1], Math.max(xRange[0], pos[0]));
              let y; try { y = A.evaluate({ x: cx }); } catch (e) { y = NaN; }
              return [cx, Number.isFinite(y) ? y : pos[1]];
            }}
            color={Theme.blue}
            onMove={(pos) => setX(pos[0])}
          />
        </Mafs>
        <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', marginTop: '6px' }}>
          💡 궤도 위의 <b>파란 조종 점</b>을 직접 좌우로 끌어서 비행 위치를 바꿔볼 수도 있어요!
        </div>
      </div>

      {/* 3. 초등 기하학 연관 학습 가이드 */}
      <div style={{ background: '#ecfdf5', borderRadius: '12px', padding: '12px', border: '1px dashed #10b981' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#065f46', marginBottom: '4px' }}>
          🎯 초록색 정답 구간의 비밀을 알아볼까요?
        </div>
        <div style={{ fontSize: '12px', color: '#047857', lineHeight: '1.5' }}>
          * 파란 로켓 선이 주황 UFO 선보다 <b>위에 날아가고 있는 시간 범위 전체</b>가 초록색 구간으로 덮여 있어요![cite: 1]
          <br />
          * 이 초록색 구간이 가리키는 <b>가로축(x축)의 범위</b>가 바로 수학에서 말하는 <b>부등식 "A &gt; B"의 멋진 해(정답)</b>가 된답니다![cite: 1]
        </div>
      </div>

    </div>
  );
}