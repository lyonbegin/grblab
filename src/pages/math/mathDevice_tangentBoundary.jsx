// ===========================================================
// no:"10-7" ★ "딱 한 점 접할 때가 D=0인 경계다" (판별식 D의 핵심개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: 담그기 슬라이더로 '딱 스치는' 순간을 찾기
//   - 결과도형: 실근 2개(닿음) ↔ 0개(안 닿음)를 가르는 경계 순간을 강조
//   - 그래프: 꼭짓점이 x축에 딱 얹히는 순간 = D=0
//   sharedXByLog[logIdx] = { k }.
//
// [핵심] 실근이 2개인 경우와 0개인 경우를 가르는 단 하나의 경계가 D=0(접함)이다.
// [모델 필드] visual.curves[0].formula (포물선) 씀.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderTangentBoundary(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_tangentBoundary 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }
  const curves = (v.curves || []).filter(c => c && c.formula);
  if (curves.length < 1) return null;
  const base = safeCompile(curves[0].formula, curves[0].kind);
  if (!base) return null;

  const xRange = toRange(v.xRange, [-4, 4]);
  const yRange = toRange(v.yRange, [-6, 8]);
  const k = sharedXByLog?.[logIdx]?.k ?? 2;
  const setK = (nk) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), k: Math.min(6, Math.max(-6, nk)) } }));

  const f = (x) => { try { return base.evaluate({ x }) + k; } catch (e) { return NaN; } };
  // 꼭짓점의 y (표본 최소) 로 접함 판정
  let minY = Infinity, minX = 0;
  const steps = 500;
  let roots = [], prevX = null, prevV = null;
  for (let i = 0; i <= steps; i++) {
    const x = xRange[0] + (i / steps) * (xRange[1] - xRange[0]);
    const val = f(x);
    if (Number.isFinite(val)) { if (val < minY) { minY = val; minX = x; } }
    if (Number.isFinite(val) && prevV !== null && Number.isFinite(prevV) && (prevV < 0) !== (val < 0)) {
      const t = prevV / (prevV - val); roots.push(prevX + t * (x - prevX));
    }
    prevX = x; prevV = val;
  }
  const n = roots.length;
  const tangent = Math.abs(minY) < 0.15; // 꼭짓점이 x축에 거의 얹힘
  let state, col;
  if (tangent) { state = '딱 스치는 순간! (D=0, 경계)'; col = '#7b3fa0'; }
  else if (n === 2) { state = '두 점에서 만남 (D>0)'; col = '#2e7d32'; }
  else { state = '안 만남 (D<0)'; col = '#c0392b'; }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ textAlign: 'center', marginBottom: '4px', fontSize: '12px', color: '#5f5e5a' }}>
          그릇을 아주 조금씩 움직여 <b>딱 한 점만 스치는 순간</b>을 찾으세요
        </div>
        <input type="range" min={-6} max={6} step={0.1} value={k}
          onChange={(e) => setK(parseFloat(e.target.value))} style={{ width: '80%', display: 'block', margin: '0 auto' }} />
        <div style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', color: col, marginTop: '6px' }}>
          {state}
        </div>
        {tangent && <div style={{ fontSize: '12px', color: '#7b3fa0', textAlign: 'center' }}>
          이 순간이 실근 2개와 0개를 가르는 <b>경계</b>입니다
        </div>}
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={260}>
          <Coordinates.Cartesian />
          <Line.Segment point1={[xRange[0], 0]} point2={[xRange[1], 0]} color="#4a90d9" />
          <Plot.OfX y={f} color={Theme.blue} />
          {roots.map((rx, i) => <Point key={i} x={rx} y={0} color={tangent ? Theme.green : Theme.red} />)}
          {/* 꼭짓점 표시 */}
          <Point x={minX} y={minY} color={tangent ? Theme.green : '#999'} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          꼭짓점이 <b>x축에 딱 얹히는 순간이 D=0</b> — 답이 있느냐 없느냐를 가르는 경계
        </div>
      </div>
    </div>
  );
}
