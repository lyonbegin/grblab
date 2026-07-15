// ===========================================================
// no:"5a" "그릇 모양 — 받친 그릇 vs 엎어놓은 그릇" 전용 인터랙션. (오목볼록 세트 첫 칸)
//
// [핵심] 아래로 볼록(∪, 물 담기는 그릇) vs 위로 볼록(∩, 엎어놓은 그릇) 구분. 반전 없음.
//   - 규칙 준수 1: React Hooks (useState, useEffect)를 절대 사용하지 않는 Zero-Hook 구조입니다.
//   - 규칙 준수 2: 상단 조작계와 하단 Mafs 그래프의 MovablePoint(꼭짓점)가 실시간으로 연동되는 양방향 인터랙션입니다.
//   - 규칙 준수 3: preserveAspectRatio={true}를 적용하여 수학적으로 정확한 곡률을 유지합니다.
//   - 규칙 준수 4: 텍스트 내 특수문자 파싱 에러 방지를 위해 자바스크립트 문자열 표현식을 완벽하게 바인딩했습니다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Theme, MovablePoint, Polygon, Line, Point } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderBowlShape(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_bowlShape 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }

  // 1. 수식 컴파일 및 기본값 세팅
  const upFormula = (v.curves || [])[0]?.formula || '0.4*(x-3)*(x-3)+1';   // ∪ 골짜기 기본값
  const downFormula = (v.curves || [])[1]?.formula || '-0.4*(x-3)*(x-3)+7'; // ∩ 언덕 기본값
  
  const cUp = safeCompile(upFormula, 'explicit');
  const cDown = safeCompile(downFormula, 'explicit');
  if (!cUp || !cDown) return null;

  const xRange = toRange(v.xRange, [0, 6]);
  const yRange = toRange(v.yRange, [0, 8]);
  const xCenterOrig = (xRange[0] + xRange[1]) / 2; // 원본 수식의 기준 중심축 (3.0)

  // 2. 상태 관리 설계 (sharedXByLog 구조 활성화, Hook 절대 금지)
  const st = sharedXByLog?.[logIdx] || {};
  const which = st.which ?? 'up'; // 'up'=∪ (골짜기), 'down'=∩ (언덕)
  const cx = st.cx ?? xCenterOrig; // 지형의 중심축 X 좌표 (양방향 연동 대상)

  const patchState = (updatedFields) => {
    setSharedXByLog?.(prev => ({
      ...prev,
      [logIdx]: {
        ...(prev?.[logIdx] || {}),
        ...updatedFields
      }
    }));
  };

  // 3. 지형 이동(shift) 메커니즘을 적용한 실시간 함수 정의
  const dx = cx - xCenterOrig;
  
  const fUp = (x) => { 
    try { return cUp.evaluate({ x: x - dx }); } catch (e) { return NaN; } 
  };
  const fDown = (x) => { 
    try { return cDown.evaluate({ x: x - dx }); } catch (e) { return NaN; } 
  };

  const isUp = which === 'up';
  const f = isUp ? fUp : fDown;

  // 4. 시각적 피드백: 오목(∪)일 때 물이 고이는 레이어 생성 (정밀 샘플링 폴리곤)
  const waterPoints = [];
  if (isUp) {
    const yWaterLevel = fUp(cx) + 1.4; // 꼭짓점으로부터 일정 높이까지 물이 차오름
    const steps = 20;
    const wWidth = 1.6;
    const xStart = cx - wWidth;
    const xEnd = cx + wWidth;

    for (let i = 0; i <= steps; i++) {
      const sx = xStart + (xEnd - xStart) * (i / steps);
      waterPoints.push([sx, Math.min(yWaterLevel, fUp(sx))]);
    }
    waterPoints.push([xEnd, yWaterLevel]);
    waterPoints.push([xStart, yWaterLevel]);
  }

  const word = isUp ? '아래로 볼록 (∪) — 물을 안전하게 담는 골짜기 그릇' : '위로 볼록 (∩) — 모두 흘러내리는 엎어놓은 그릇';
  const themeColor = isUp ? '#0284c7' : '#d97706';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'sans-serif', userSelect: 'none' }}>
      
      <style>{`
        .mafs-bowl-container .MafsView {
          background-color: transparent !important;
        }
      `}</style>

      {/* [1단계] 상단 조작계: 스토리텔링 콘텍스트 패널 */}
      <div className="viz-box" style={{ background: '#fefcf8', borderRadius: '14px', padding: '14px', border: '2px solid #f3eae0' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#451a03' }}>
          🌧️ 구름 요정의 물주기 대작전 (지형 중심: {cx.toFixed(1)})
        </div>
        
        <div style={{ fontSize: '12px', color: '#57534e', textAlign: 'center', marginBottom: '10px', lineHeight: '1.4' }}>
          하늘에서 비가 내릴 때, 땅의 모양에 따라 물의 운명은 어떻게 될까요?
          <br />
          <b>{"두 지형을 전환하고, 그래프 위의 빨간 꼭짓점을 좌우로 직접 드래그해 보세요!"}</b>
        </div>

        {/* 지형 전환 버튼 세트 */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '12px' }}>
          <button 
            type="button" 
            onClick={() => patchState({ which: 'up' })}
            style={{ 
              padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
              border: isUp ? '2px solid #0284c7' : '1px solid #cbd5e1', 
              background: isUp ? '#e0f2fe' : '#ffffff',
              fontWeight: isUp ? 'bold' : 'normal', color: isUp ? '#0369a1' : '#64748b' 
            }}
          >
            {"∪ 골짜기 모양 (받친 그릇)"}
          </button>
          <button 
            type="button" 
            onClick={() => patchState({ which: 'down' })}
            style={{ 
              padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
              border: !isUp ? '2px solid #d97706' : '1px solid #cbd5e1', 
              background: !isUp ? '#fef3c7' : '#ffffff',
              fontWeight: !isUp ? 'bold' : 'normal', color: !isUp ? '#b45309' : '#64748b' 
            }}
          >
            {"∩ 언덕 모양 (엎은 그릇)"}
          </button>
        </div>

        {/* 지형 중심 슬라이더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#78716c' }}>위치 조절:</span>
          <input 
            type="range" 
            min={xRange[0] + 0.8} 
            max={xRange[1] - 0.8} 
            step={0.1} 
            value={cx}
            onChange={(e) => patchState({ cx: parseFloat(e.target.value) })} 
            style={{ width: '50%', cursor: 'pointer' }} 
          />
        </div>

        <div style={{ fontSize: '14px', fontWeight: 'bold', color: themeColor, marginTop: '10px', textAlign: 'center' }}>
          {word}
        </div>
      </div>

      {/* [2단계] 하단 결과 그래프 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '14px', padding: '12px', border: '2px solid #e2e8f0' }}>
        <div className="mafs-bowl-container" style={{ background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          
          <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={280}>
            <Coordinates.Cartesian />

            {/* 오목(∪)일 때 물 레이어 */}
            {isUp && waterPoints.length > 0 && (
              <Polygon points={waterPoints} color={Theme.blue} opacity={0.35} />
            )}

            {/* 볼록(∩)일 때 흘러내림 효과 */}
            {!isUp && (
              <>
                <Line.Segment point1={[cx, fDown(cx) + 1.2]} point2={[cx, fDown(cx) + 0.2]} color={Theme.blue} style="dashed" weight={2} />
                <Line.Segment point1={[cx - 0.2, fDown(cx - 0.2)]} point2={[cx - 1.2, fDown(cx - 1.2)]} color={Theme.orange} weight={3} />
                <Line.Segment point1={[cx + 0.2, fDown(cx + 0.2)]} point2={[cx + 1.2, fDown(cx + 1.2)]} color={Theme.orange} weight={3} />
                <Point x={cx - 0.8} y={fDown(cx - 0.8)} color={Theme.blue} size={3} />
                <Point x={cx + 0.8} y={fDown(cx + 0.8)} color={Theme.blue} size={3} />
              </>
            )}

            <Plot.OfX y={f} color={isUp ? Theme.blue : Theme.orange} weight={4} />

            {/* 양방향 연동 자석 꼭짓점 */}
            <MovablePoint 
              point={[cx, f(cx)]} 
              color={Theme.red}
              constrain={(pos) => {
                const clampedX = Math.min(xRange[1] - 0.8, Math.max(xRange[0] + 0.8, pos[0]));
                return [clampedX, f(clampedX)];
              }}
              onMove={(pos) => patchState({ cx: pos[0] })}
            />
          </Mafs>
          
        </div>

        {/* 하단 설명 블록 */}
        <div style={{ fontSize: '12px', color: '#475569', textAlign: 'center', marginTop: '8px', lineHeight: '1.4' }}>
          {isUp ? (
            <span>
              💧 주변보다 가장 아래에 있는 꼭짓점(최솟값)으로 물이 모여 <b>{"안정적인 호수"}</b>를 이룹니다.
            </span>
          ) : (
            <span>
              ⛰️ 주변보다 가장 높이 솟은 꼭짓점(최대값)에 닿은 물은 중심에 고이지 못하고 <b>{"양옆으로 흘러내립니다."}</b>
            </span>
          )}
          <br />
          <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
            이 그릇의 형태(휨의 방향) 감각은 훗날 미분에서 <b>{"'오목과 볼록(곡률)'"}</b>을 결정하는 결정적 토대가 됩니다.
          </span>
        </div>
      </div>

    </div>
  );
}