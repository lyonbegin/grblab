// ===========================================================
// no:"3a" "오르막/내리막 — 올라가는 길 vs 내려가는 길" 전용 인터랙션. (증가감소 세트 첫 칸)
//
// [이 파일의 위치] 증가·감소(no:3)로 올라가는 4계단의 첫 칸. 반전 없음.
//   가장 쉬운 직관: 왼쪽에서 오른쪽으로 갈 때 곡선이 위로 가면 오르막(증가),
//   아래로 가면 내리막(내림). 이 눈을 세워야 3b(한 곡선 안에 둘 다 있음)가 충격을 준다.
//
// [핵심 직관] 진행 방향은 항상 왼→오른쪽(x가 커지는 쪽). 그때 높이(y)가 커지면 오르막.
//
// [조작] 슬라이더로 점을 곡선 위에서 좌우로 옮긴다. 이 계단의 곡선은 단조로운(한 방향)
//   구간이라, 어디를 짚어도 오르막이면 오르막/내리막이면 내리막으로 일정하다.
//   (한 곡선 안에서 방향이 바뀌는 건 다음 칸 3b에서 다룬다.)
//
// [상태] logIdx별 숫자 하나(점의 x 위치).
//
// [모델 필드] curves[0].formula로 곡선(기본 "0.8*x+1" 같은 단조 증가, 또는 감소식).
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderUpDownIntro(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_upDownIntro 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') {
    console.log(`${DEBUG} 중단: visual.kind가 mafs_function이 아니다.`, v);
    return null;
  }
  const curves = (v.curves || []).filter(c => c && c.formula);
  const formula = curves[0]?.formula || '0.7*x+1';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) {
    console.log(`${DEBUG} 중단: formula "${formula}" 컴파일 실패.`);
    return null;
  }
  const f = (x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 6]);
  const yRange = toRange(v.yRange, [0, 8]);

  const xMin = xRange[0] + 0.3, xMax = xRange[1] - 0.3;
  const px = sharedXByLog?.[logIdx] ?? (xMin + xMax) / 2;
  const setPx = (val) => {
    const clamped = Math.min(xMax, Math.max(xMin, val));
    setSharedXByLog?.(prev => ({ ...prev, [logIdx]: clamped }));
  };

  // 진행 방향(왼→오른)으로 높이가 커지는지 판정: 살짝 오른쪽의 y와 비교
  const eps = 0.05;
  const goingUp = f(px + eps) > f(px);
  const dirWord = goingUp ? '오르막 (올라가는 중)' : '내리막 (내려가는 중)';
  const dirColor = goingUp ? '#2e7d32' : '#c0392b';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 슬라이더 */}
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          점을 곡선 위에서 <b>왼쪽→오른쪽</b>으로 옮겨 보자
        </div>
        <input type="range" min={xMin} max={xMax} step={0.05} value={px}
          onChange={(e) => setPx(parseFloat(e.target.value))}
          style={{ width: '80%' }} />
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: dirColor, marginTop: '2px' }}>
          {dirWord}
        </div>
      </div>

      {/* 그래프 */}
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          <Plot.OfX y={f} color={Theme.blue} />
          <Point x={px} y={f(px)} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          진행 방향(오른쪽)으로 갈 때 높이가 <b style={{ color: dirColor }}>{goingUp ? '커집니다 → 오르막' : '작아집니다 → 내리막'}</b>
          <br />
          <span style={{ fontSize: '11px' }}>
            항상 왼쪽에서 오른쪽으로 보면서, 높이가 커지면 오르막 · 작아지면 내리막입니다.
          </span>
        </div>
      </div>
    </div>
  );
}
