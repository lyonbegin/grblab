// ===========================================================
// no:"3d" "구간 나누기 — 증가구간과 감소구간" 전용 인터랙션. (증가감소 세트 최종 목표)
//
// [이 파일의 위치] 3c(점마다 부호 판별)를 곡선 전체로 확장. 부호가 바뀌는 지점(전환점)을
//   경계로 곡선을 증가구간·감소구간으로 통째로 나눈다. (no:3 최종 학습목표 3.4)
//
// [핵심] 곡선 전체를 훑어 접선 기울기 부호로 구간을 칠한다: 증가구간=초록, 감소구간=빨강.
//   경계(전환점)는 세로 점선. 아이는 전체가 몇 개 구간으로 나뉘는지 한눈에 본다.
//
// [조작] 슬라이더로 확인용 점을 옮기며 지금 구간이 증가인지 감소인지 확인(보조).
//   핵심은 곡선 아래를 구간별로 칠한 배경 띠다.
//
// [상태] logIdx별 숫자 하나(확인용 점 x).
//
// [모델 필드] curves[0].formula로 여러 번 오르내리는 곡선(기본 3차식).
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderIntervalSplit(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_intervalSplit 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') {
    console.log(`${DEBUG} 중단: visual.kind가 mafs_function이 아니다.`, v);
    return null;
  }
  const curves = (v.curves || []).filter(c => c && c.formula);
  const formula = curves[0]?.formula || '0.15*x*x*x-1.2*x*x+2*x+2';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) {
    console.log(`${DEBUG} 중단: formula "${formula}" 컴파일 실패.`);
    return null;
  }
  const f = (x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 7]);
  const yRange = toRange(v.yRange, [-1, 8]);

  const xMin = xRange[0] + 0.3, xMax = xRange[1] - 0.3;
  const px = sharedXByLog?.[logIdx] ?? (xMin + 0.5);
  const setPx = (val) => {
    const clamped = Math.min(xMax, Math.max(xMin, val));
    setSharedXByLog?.(prev => ({ ...prev, [logIdx]: clamped }));
  };

  const eps = 1e-3;
  const upAt = (x) => f(x + eps) > f(x - eps);

  // 전환점(부호 바뀌는 x)과 구간 분할
  const N = 300;
  const turns = [];
  let prevUp = null;
  for (let i = 0; i <= N; i++) {
    const x = xRange[0] + (xRange[1] - xRange[0]) * (i / N);
    const up = upAt(x);
    if (prevUp !== null && up !== prevUp) turns.push(x);
    prevUp = up;
  }
  // 구간 경계 = [시작, ...전환점, 끝]
  const bounds = [xRange[0], ...turns, xRange[1]];
  const segments = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const mid = (bounds[i] + bounds[i + 1]) / 2;
    segments.push({ x1: bounds[i], x2: bounds[i + 1], up: upAt(mid) });
  }

  const curUp = upAt(px);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 안내 */}
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          곡선 전체를 <b style={{ color: '#2e7d32' }}>증가구간</b>과 <b style={{ color: '#c0392b' }}>감소구간</b>으로 나눠 보자
        </div>
        <input type="range" min={xMin} max={xMax} step={0.03} value={px}
          onChange={(e) => setPx(parseFloat(e.target.value))}
          style={{ width: '80%' }} />
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: curUp ? '#2e7d32' : '#c0392b', marginTop: '2px' }}>
          지금 점: {curUp ? '증가구간' : '감소구간'}
        </div>
      </div>

      {/* 그래프 */}
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          {/* 구간별 배경 띠(증가=초록, 감소=빨강)를 얇은 세로선 여러 개로 칠한다 */}
          {segments.map((s, si) => {
            const strips = [];
            const step = (s.x2 - s.x1) / 14;
            for (let x = s.x1; x < s.x2; x += step) {
              strips.push(
                <Line.Segment key={`${si}-${x}`} point1={[x, yRange[0]]} point2={[x, yRange[1]]}
                  color={s.up ? Theme.green : Theme.red} opacity={0.06} />
              );
            }
            return strips;
          })}
          {/* 전환점 세로 점선 */}
          {turns.map((tx, i) => (
            <Line.Segment key={`t${i}`} point1={[tx, yRange[0]]} point2={[tx, yRange[1]]} color={Theme.orange} opacity={0.6} />
          ))}
          <Plot.OfX y={f} color={Theme.blue} />
          <Point x={px} y={f(px)} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          전환점 {turns.length}개 · 구간 {segments.length}개 (
          {segments.map((s, i) => (
            <span key={i} style={{ color: s.up ? '#2e7d32' : '#c0392b', fontWeight: 'bold' }}>
              {s.up ? '증가' : '감소'}{i < segments.length - 1 ? ' · ' : ''}
            </span>
          ))}
          )
          <br />
          <span style={{ fontSize: '11px' }}>
            접선 기울기 부호가 바뀌는 지점(주황 점선)이 증가구간과 감소구간의 경계입니다.
          </span>
        </div>
      </div>
    </div>
  );
}
