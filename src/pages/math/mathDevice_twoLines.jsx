// ===========================================================
// no:"8-5" "두 직선의 관계" (방정식 해=교점의 선행개념)
//
// [규칙] 도형(조작+결과도형) + 그래프 + 연동.
//   - 조작: 둘째 직선의 기울기 슬라이더 + 높이(절편) 슬라이더
//   - 결과도형: 두 막대(직선)가 나란함(안 만남)/엇갈림(한 점 만남)/포개짐(전부 겹침)으로 변함,
//               상태를 글자와 색으로 표시
//   - 그래프: 두 직선이 실제로 그려지고 만남 여부가 보임
//   sharedXByLog[logIdx] = { slope, intercept }.
//   첫 직선은 고정(visual.curves[0]), 둘째 직선을 학생이 조작.
//
// [핵심] 두 선은 세 가지 관계뿐이다: 안 만남 / 한 점에서 만남 / 완전히 겹침.
// [모델 필드] visual.curves[0].formula (기준 직선, 예 "x+1") 씀.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderTwoLines(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_twoLines 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') { console.log(`${DEBUG} kind`, v); return null; }
  const curves = (v.curves || []).filter(c => c && c.formula);
  if (curves.length < 1) return null;
  const base = safeCompile(curves[0].formula, curves[0].kind);
  if (!base) return null;

  const xRange = toRange(v.xRange, [-1, 6]);
  const yRange = toRange(v.yRange, [-1, 8]);

  // 기준 직선의 기울기·절편을 표본으로 추정(직선 가정)
  let bSlope = 1, bIntercept = 0;
  try { const y0 = base.evaluate({ x: 0 }); const y1 = base.evaluate({ x: 1 }); bSlope = y1 - y0; bIntercept = y0; } catch (e) {}

  const st = sharedXByLog?.[logIdx] || {};
  const slope = st.slope ?? (bSlope + 1);   // 기본은 기준과 다른 기울기(엇갈림)
  const intercept = st.intercept ?? 1;
  const patch = (p) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { slope, intercept, ...(prev?.[logIdx] || {}), ...p } }));

  // 관계 판정
  const sameSlope = Math.abs(slope - bSlope) < 1e-6;
  const sameLine = sameSlope && Math.abs(intercept - bIntercept) < 1e-6;
  let relation, relColor;
  if (sameLine) { relation = '완전히 겹침 (모든 점에서 만남)'; relColor = '#7b3fa0'; }
  else if (sameSlope) { relation = '나란함 (한 점도 안 만남)'; relColor = '#c0392b'; }
  else { relation = '엇갈림 (딱 한 점에서 만남)'; relColor = '#2e7d32'; }

  // 교점(엇갈릴 때만)
  let ix = null, iy = null;
  if (!sameSlope) { ix = (intercept - bIntercept) / (bSlope - slope); try { iy = base.evaluate({ x: ix }); } catch (e) { iy = null; } }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '10px' }}>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#5f5e5a' }}>둘째 선 기울기</div>
            <input type="range" min={-2} max={4} step={0.5} value={slope}
              onChange={(e) => patch({ slope: parseFloat(e.target.value) })} style={{ width: '130px' }} />
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2f5a99' }}>{slope}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#5f5e5a' }}>둘째 선 높이</div>
            <input type="range" min={-2} max={6} step={0.5} value={intercept}
              onChange={(e) => patch({ intercept: parseFloat(e.target.value) })} style={{ width: '130px' }} />
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2f5a99' }}>{intercept}</div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '15px', fontWeight: 'bold', color: relColor }}>
          {relation}
        </div>
      </div>

      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={260}>
          <Coordinates.Cartesian />
          {/* 기준 직선(파랑) */}
          <Plot.OfX y={(x) => { try { return base.evaluate({ x }); } catch (e) { return NaN; } }} color={Theme.blue} />
          {/* 둘째 직선(주황) */}
          <Plot.OfX y={(x) => slope * x + intercept} color={Theme.orange} />
          {/* 교점 */}
          {ix !== null && iy !== null && Number.isFinite(iy) &&
            ix >= xRange[0] && ix <= xRange[1] && <Point x={ix} y={iy} color={Theme.green} />}
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          두 선의 관계는 오직 셋뿐: <b>안 만남 · 한 점에서 만남 · 완전히 겹침</b>
        </div>
      </div>
    </div>
  );
}
