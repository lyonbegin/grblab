// ===========================================================
// no:"6c" "끝점도 후보 — 봉우리 없어도 끝이 최대일 수 있다" 전용 인터랙션. ★반전 (최대최소 세트 셋째 칸)
//   ※ window_slide(6b)의 창 안 최고/최저 로직을 재사용하되, '최고점이 끝점인지 봉우리인지'를 강조.
//
// [반전] 가장 높은 곳이 봉우리(극대)가 아니라 구간의 끝(벽)일 수 있다.
//   극값만 보면 놓친다 — 끝점도 반드시 후보에 넣어야 한다.
//
// [조작] 슬라이더로 창(구간)을 옮기며, 창 안 최고점이 '내부 봉우리'인지 '구간 끝점'인지 판정 표시.
//
// [모델 필드] curves[0].formula로 곡선. windowWidth(선택).
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderEndpointCandidate(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  // 끝점이 최대가 되기 쉬운 곡선(오른쪽으로 갈수록 전체적으로 상승 + 중간에 작은 봉우리)
  const formula = (v.curves || [])[0]?.formula || '0.12*x*x*x-1.0*x*x+2.2*x+2';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) return null;
  const f = (x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 8]);
  const yRange = toRange(v.yRange, [-1, 9]);
  const winW = typeof v.windowWidth === 'number' ? v.windowWidth : 3;

  const wMin = xRange[0], wMax = xRange[1] - winW;
  const wStart = sharedXByLog?.[logIdx] ?? (wMin + (wMax - wMin) * 0.4);
  const setWStart = (val) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: Math.min(wMax, Math.max(wMin, val)) }));
  const wEnd = wStart + winW;

  // 창 안 최고점
  let maxX = wStart;
  for (let x = wStart; x <= wEnd; x += 0.02) if (f(x) > f(maxX)) maxX = x;

  // 최고점이 끝점인지 내부(봉우리)인지 판정
  const atEdge = Math.abs(maxX - wStart) < 0.08 || Math.abs(maxX - wEnd) < 0.08;
  const word = atEdge ? '최고점이 구간의 끝점입니다 — 봉우리가 아니어도 끝이 최대!' : '최고점이 내부 봉우리(극대)입니다';
  const wc = atEdge ? '#b5701a' : '#2e7d32';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          창을 옮기며 보자 — 최고점이 <b>봉우리</b>일까 <b>구간의 끝</b>일까?
        </div>
        <input type="range" min={wMin} max={wMax} step={0.05} value={wStart}
          onChange={(e) => setWStart(parseFloat(e.target.value))} style={{ width: '80%' }} />
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: wc, marginTop: '2px' }}>{word}</div>
      </div>
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          <Line.Segment point1={[wStart, yRange[0]]} point2={[wStart, yRange[1]]} color={Theme.orange} opacity={0.5} />
          <Line.Segment point1={[wEnd, yRange[0]]} point2={[wEnd, yRange[1]]} color={Theme.orange} opacity={0.5} />
          {/* 끝점 두 개를 후보로 표시 */}
          <Point x={wStart} y={f(wStart)} color={Theme.orange} />
          <Point x={wEnd} y={f(wEnd)} color={Theme.orange} />
          <Plot.OfX y={f} color={Theme.blue} />
          <Point x={maxX} y={f(maxX)} color={atEdge ? Theme.orange : Theme.green} />
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          <b style={{ color: '#b5701a' }}>주황=구간 양 끝점(후보)</b>
          <br />
          <span style={{ fontSize: '11px' }}>
            최대를 찾을 땐 봉우리(극대)뿐 아니라 <b>구간의 양 끝점</b>도 반드시 후보에 넣어야 합니다.
          </span>
        </div>
      </div>
    </div>
  );
}
