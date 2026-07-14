// ===========================================================
// no:"10-6" ★ "x축과 만나는 횟수 = 실근 개수" (판별식 D의 핵심개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: 포물선(그릇)을 위아래로 담그는 슬라이더
//   - 결과도형: 수면(x축)에 닿는 점이 2개→1개→0개로 바뀜
//   - 그래프: 포물선과 x축의 교점을 실제로 세어 실근 개수로 표시
//   sharedXByLog[logIdx] = { k }.
//
// [핵심] 포물선이 x축과 만나는 점의 개수가 곧 실근(답)의 개수다.
// [모델 필드] visual.curves[0].formula (포물선, 예 "x^2-1") 씀. k만큼 상하 이동.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderDipCount(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_dipCount 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }
  const curves = (v.curves || []).filter(c => c && c.formula);
  if (curves.length < 1) return null;
  const base = safeCompile(curves[0].formula, curves[0].kind);
  if (!base) return null;

  const xRange = toRange(v.xRange, [-4, 4]);
  const yRange = toRange(v.yRange, [-6, 8]);
  const k = sharedXByLog?.[logIdx]?.k ?? 0;
  const setK = (nk) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), k: Math.min(6, Math.max(-6, nk)) } }));

  const f = (x) => { try { return base.evaluate({ x }) + k; } catch (e) { return NaN; } };
  // x축 교점 개수
  let roots = [], prevX = null, prevV = null;
  const steps = 500;
  for (let i = 0; i <= steps; i++) {
    const x = xRange[0] + (i / steps) * (xRange[1] - xRange[0]);
    const val = f(x);
    if (Number.isFinite(val) && prevV !== null && Number.isFinite(prevV) && (prevV < 0) !== (val < 0)) {
      const t = prevV / (prevV - val); roots.push(prevX + t * (x - prevX));
    }
    prevX = x; prevV = val;
  }
  const n = roots.length;
  const label = n === 2 ? '두 점에서 만남 (실근 2개, D>0)' : n === 1 ? '한 점만 스침 (실근 1개, D=0)' : '안 만남 (실근 없음, D<0)';
  const col = n === 2 ? '#2e7d32' : n === 1 ? '#b5701a' : '#c0392b';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ textAlign: 'center', marginBottom: '4px', fontSize: '12px', color: '#5f5e5a' }}>
          그릇을 위아래로 담가 수면(가로선)에 닿는 점 개수를 바꿔보세요
        </div>
        <input type="range" min={-6} max={6} step={0.25} value={k}
          onChange={(e) => setK(parseFloat(e.target.value))} style={{ width: '80%', display: 'block', margin: '0 auto' }} />
        <div style={{ textAlign: 'center', marginTop: '6px' }}>
          <span style={{ fontSize: '26px', fontWeight: 'bold', color: col }}>{n}</span>
          <span style={{ fontSize: '13px', color: '#5f5e5a' }}> 개 — {label}</span>
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={260}>
          <Coordinates.Cartesian />
          {/* 수면 = 가로축 강조 */}
          <Line.Segment point1={[xRange[0], 0]} point2={[xRange[1], 0]} color="#4a90d9" />
          <Plot.OfX y={f} color={Theme.blue} />
          {roots.map((rx, i) => <Point key={i} x={rx} y={0} color={Theme.red} />)}
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          수면(x축)에 <b>닿는 점의 개수 = 실근(답)의 개수</b>입니다
        </div>
      </div>
    </div>
  );
}
