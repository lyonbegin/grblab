// ===========================================================
// no:"4d" "극대·극소 판별 — 국소는 창 크기가 정한다" (깔때기 에디션)
//
// [설계 의도]
// 1. 위쪽 그래프: x축 상의 1차원 국소 구간 [cx - w, cx + w]을 반투명한 수직 장막(Vertical Strip)으로 표현합니다.
// 2. 아래쪽 그래프: 창 크기(w)를 넓혀감에 따라, 그 창 안에 갇힌 곡선의 '최댓값'과 '최솟값'이 벌어지는 깔때기 영역을 그립니다.
// 3. 극대/극소 탐색: 극대점에 서면 최댓값 선이, 극소점에 서면 최솟값 선이 한동안 수평을 유지하는 현상을 실시간 중계합니다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Polygon, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderExtremumJudge(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  // 1. 수식 컴파일 및 기본 셋업
  const formula = (v.curves || [])[0]?.formula || '0.12*x*x*x-1.05*x*x+2.1*x+2.5';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) return null;
  const f = (x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 7]);
  const yRange = toRange(v.yRange, [0, 8]);

  // 2. 상태 관리 (Zero-Hook 구조 준수)
  const st = sharedXByLog?.[logIdx] || {};
  const cx = st.cx ?? 3.0; // 창의 중심
  const w = st.w ?? 1.0;   // 창의 반지름 (너비)
  const wMin = 0.2;
  const wMax = 3.0;

  const patch = (p) => {
    setSharedXByLog?.(prev => ({
      ...prev,
      [logIdx]: {
        ...(prev?.[logIdx] || { cx, w }),
        ...p
      }
    }));
  };

  // 3. 미분 기초 연산을 통한 극값 사전 수집 (시각적 마커용)
  const eps = 1e-4;
  const df = (x) => (f(x + eps) - f(x - eps)) / (2 * eps);
  const extrema = [];
  let prevUp = null;
  for (let i = 0; i <= 200; i++) {
    const x = xRange[0] + ((xRange[1] - xRange[0]) * i) / 200;
    const up = df(x) > 0;
    if (prevUp !== null && up !== prevUp) {
      extrema.push({ x, isMax: prevUp && !up });
    }
    prevUp = up;
  }

  // 4. [핵심 알고리즘] 주어진 창 안에서의 최댓값 / 최솟값 산출 헬퍼
  const getExtremaInInterval = (center, radius) => {
    const xStart = Math.max(xRange[0], center - radius);
    const xEnd = Math.min(xRange[1], center + radius);
    
    let maxVal = f(center);
    let minVal = f(center);
    const samples = 20; // 가벼운 연산을 위한 최적의 샘플링 수
    
    for (let i = 0; i <= samples; i++) {
      const sx = xStart + (xEnd - xStart) * (i / samples);
      const val = f(sx);
      if (val > maxVal) maxVal = val;
      if (val < minVal) minVal = val;
    }
    return { min: minVal, max: maxVal };
  };

  // 실시간 최댓값/최솟값 함수 정의 (아래쪽 깔때기 그래프 매핑용)
  const fMaxW = (wVal) => getExtremaInInterval(cx, wVal).max;
  const fMinW = (wVal) => getExtremaInInterval(cx, wVal).min;

  const currentExtrema = getExtremaInInterval(cx, w);

  // 5. 실시간 상태 진단 (극대/극소 여부 자동 판단)
  const slope = df(cx);
  const isFlat = Math.abs(slope) < 0.15;
  const maxDiff = fMaxW(0.4) - f(cx);
  const minDiff = f(cx) - fMinW(0.4);

  let diagnosis = '일반 경사 구간 (돋보기를 열자마자 최댓값/최솟값이 바로 변합니다)';
  let diagnosisColor = '#475569';
  if (isFlat) {
    if (maxDiff < 0.02) {
      diagnosis = '✨ 극대점 발견! (돋보기를 넓혀도 한동안 최댓값이 꼼짝 않고 버팁니다)';
      diagnosisColor = '#16a34a';
    } else if (minDiff < 0.02) {
      diagnosis = '✨ 극소점 발견! (돋보기를 넓혀도 한동안 최솟값이 꼼짝 않고 버팁니다)';
      diagnosisColor = '#dc2626';
    } else {
      diagnosis = '평평한 구간 (변곡점 또는 안장점 부근)';
      diagnosisColor = '#ca8a04';
    }
  }

  // 아래쪽 깔때기 채우기용 다각형 좌표 계산 (w = 0부터 wMax까지 누적 영역)
  const funnelPoints = [];
  const steps = 30;
  for (let i = 0; i <= steps; i++) {
    const currW = (wMax * i) / steps;
    funnelPoints.push([currW, fMaxW(currW)]);
  }
  for (let i = steps; i >= 0; i--) {
    const currW = (wMax * i) / steps;
    funnelPoints.push([currW, fMinW(currW)]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'sans-serif', userSelect: 'none' }}>
      
      {/* [1단계] 상단 조작계 및 실시간 판독 결과 */}
      <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ textAlign: 'center', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>
          🔍 국소 돋보기 관찰 (창 중심: {cx.toFixed(2)}, 반지름: {w.toFixed(2)})
        </div>
        <div style={{ 
          textAlign: 'center', 
          fontSize: '14px', 
          fontWeight: 'bold', 
          color: diagnosisColor,
          padding: '6px', 
          background: '#ffffff', 
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          {diagnosis}
        </div>
      </div>

      {/* [2단계] 메인 그래프: 1차원 수직 장막 구간 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '12px', padding: '10px', border: '1px solid #cbd5e1' }}>
        <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginBottom: '6px' }}>
          <b>{"주황 점"}</b>{"을 끌어 위치를 이동하고, "}<b>{"보라 점"}</b>{"을 끌어 관찰 영역을 조절하세요."}
        </div>
        
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={true} height={230}>
          <Coordinates.Cartesian />

          {/* 1차원 국소 범위를 나타내는 반투명 주황색 수직 장막 */}
          <Polygon 
            points={[
              [cx - w, yRange[0]],
              [cx + w, yRange[0]],
              [cx + w, yRange[1]],
              [cx - w, yRange[1]]
            ]} 
            color={Theme.orange} 
            opacity={0.08} 
          />
          
          {/* 장막의 좌우 경계선 */}
          <Line.Segment point1={[cx - w, yRange[0]]} point2={[cx - w, yRange[1]]} color={Theme.orange} style="dashed" weight={1} />
          <Line.Segment point1={[cx + w, yRange[0]]} point2={[cx + w, yRange[1]]} color={Theme.orange} style="dashed" weight={1} />

          {/* 현재 관찰 구간 안에서의 최댓값/최솟값 가이드 박스 라인 */}
          <Line.Segment point1={[cx - w, currentExtrema.max]} point2={[cx + w, currentExtrema.max]} color={Theme.green} style="dashed" weight={1.5} />
          <Line.Segment point1={[cx - w, currentExtrema.min]} point2={[cx + w, currentExtrema.min]} color={Theme.red} style="dashed" weight={1.5} />

          {/* 메인 함수 곡선 */}
          <Plot.OfX y={f} color={Theme.blue} weight={3} />

          {/* 전체 극값 위치 표시 (장막 안에 들어오면 진해짐) */}
          {extrema.map((e, i) => {
            const inside = e.x >= cx - w && e.x <= cx + w;
            return (
              <g key={i}>
                <Point 
                  x={e.x} 
                  y={f(e.x)} 
                  color={e.isMax ? Theme.green : Theme.red} 
                  size={inside ? 5 : 3} 
                  opacity={inside ? 1.0 : 0.2} 
                />
              </g>
            );
          })}

          {/* 창 크기(w) 조절용 보라색 점 (데드존 방지 상호 구속 탑재) */}
          <MovablePoint
            point={[cx + w, f(cx)]}
            constrain={(pos) => {
              const maxEdgeX = Math.min(xRange[1], cx + wMax);
              const minEdgeX = cx + wMin;
              const clampedX = Math.min(maxEdgeX, Math.max(minEdgeX, pos[0]));
              return [clampedX, f(cx)];
            }}
            color={Theme.violet}
            onMove={(pos) => {
              const nw = pos[0] - cx;
              patch({ w: nw });
            }}
          />

          {/* 창 중심(cx) 조절용 주황색 점 */}
          <MovablePoint
            point={[cx, f(cx)]}
            constrain={(pos) => {
              const ncx = Math.min(xRange[1] - 0.3, Math.max(xRange[0] + 0.3, pos[0]));
              return [ncx, f(ncx)];
            }}
            color={Theme.orange}
            onMove={(pos) => {
              const ncx = Math.min(xRange[1] - 0.3, Math.max(xRange[0] + 0.3, pos[0]));
              patch({ cx: ncx });
            }}
          />
        </Mafs>
      </div>

      {/* [3단계] 서브 그래프: 최댓값/최솟값 깔때기 (Funnel) 시각화 */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '12px', padding: '10px', border: '1px solid #cbd5e1' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155', textAlign: 'center', marginBottom: '4px' }}>
          📊 창의 크기(가로)에 따른 최댓값·최솟값 벌어짐 곡선
        </div>

        <Mafs viewBox={{ x: [-0.2, wMax + 0.2], y: yRange }} preserveAspectRatio={false} height={160}>
          <Coordinates.Cartesian />

          {/* 깔때기 영역 채우기 */}
          {funnelPoints.length > 0 && (
            <Polygon points={funnelPoints} color={Theme.orange} opacity={0.12} />
          )}

          {/* 최댓값 한계선 (Green Envelope) */}
          <Plot.OfX y={fMaxW} color={Theme.green} weight={2.5} />

          {/* 최솟값 한계선 (Red Envelope) */}
          <Plot.OfX y={fMinW} color={Theme.red} weight={2.5} />

          {/* 현재 설정된 창 크기(w) 위치 표시 가로등(세로 점선) */}
          <Line.Segment point1={[w, yRange[0]]} point2={[w, yRange[1]]} color={Theme.violet} style="dashed" weight={1.5} />

          {/* 깔때기 상단 엔벨로프 위에서 미끄러지는 보라색 크기 조절 핸들 */}
          <MovablePoint
            point={[w, fMaxW(w)]}
            constrain={(pos) => {
              const nw = Math.min(wMax, Math.max(wMin, pos[0]));
              return [nw, fMaxW(nw)];
            }}
            color={Theme.violet}
            onMove={(pos) => {
              const nw = Math.min(wMax, Math.max(wMin, pos[0]));
              patch({ w: nw });
            }}
          />

          {/* 하단 엔벨로프 상의 동적 지시 마커 (단순 인디케이터) */}
          <Point x={w} y={fMinW(w)} color={Theme.red} size={4} />
        </Mafs>

        <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', marginTop: '6px', lineHeight: '1.4' }}>
          {"가로축: 창의 크기(반지름 w) · 세로축: 함수값(높이)"}
          <br />
          {"💡 극점에 창을 두면 출발지점(왼쪽 끝)에서 한쪽 선이 일직선으로 곧게 뻗어나갑니다!"}
        </div>
      </div>

    </div>
  );
}