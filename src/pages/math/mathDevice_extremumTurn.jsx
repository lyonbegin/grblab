// ===========================================================
// no:"4c" "전환점 — 앞뒤 방향으로 극대·극소를 가린다"  (극값 세트 셋째 칸)
//
// [v3 수정 — 슬라이더 제거, 직접 드래그로]
//   곡선 위 점을 직접 끌면 O/X 격자표와 아래 삼진 계단 그래프가 즉시 갱신된다.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Point, Line, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

const D = 0.4;

export function renderExtremumTurn(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const formula = (v.curves || [])[0]?.formula || '0.12*x*x*x-1.05*x*x+2.1*x+2.5';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) return null;
  const f = (x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 7]);
  const yRange = toRange(v.yRange, [0, 8]);
  const xMin = xRange[0] + D + 0.1, xMax = xRange[1] - D - 0.1;
  const px = sharedXByLog?.[logIdx] ?? 1.3;
  const setPx = (val) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: Math.min(xMax, Math.max(xMin, val)) }));

  const eps = 1e-4;
  const df = (x) => (f(x + eps) - f(x - eps)) / (2 * eps);
  const turnAt = (x) => {
    const L = df(x - D), R = df(x + D);
    if (L > 0.05 && R < -0.05) return 1;
    if (L < -0.05 && R > 0.05) return -1;
    return 0;
  };
  const t = turnAt(px);
  const beforeUp = df(px - D) > 0;
  const afterUp = df(px + D) > 0;
  const word = t === 1 ? '극대 — 오르다 내려간다' : t === -1 ? '극소 — 내리다 올라간다' : '비탈 — 방향 그대로';
  const wc = t === 1 ? '#2e7d32' : t === -1 ? '#c0392b' : '#5f5e5a';

  const cell = (on, color) => ({
    padding: '8px 0', textAlign: 'center', fontSize: '18px', fontWeight: 'bold',
    border: '1px solid #ddd8ca', background: on ? `${color}22` : '#fff', color: on ? color : '#ccc'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a' }}>
          👉 <b>빨간 점을 곡선 위에서 직접 끌어</b> 앞은 오르막인지 뒤는 내리막인지 표로 확인하자
        </div>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: wc, marginTop: '2px' }}>{word}</div>
      </div>

      {/* 도형: 곡선 위 직접 드래그 (앞뒤 참고점도 함께 표시) */}
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={220}>
          <Coordinates.Cartesian />
          <Plot.OfX y={f} color={Theme.blue} />
          <Point x={px - D} y={f(px - D)} color={beforeUp ? Theme.green : Theme.red} />
          <Point x={px + D} y={f(px + D)} color={afterUp ? Theme.green : Theme.red} />
          <MovablePoint
            point={[px, f(px)]}
            constrain={(pos) => {
              const cx = Math.min(xMax, Math.max(xMin, pos[0]));
              return [cx, f(cx)];
            }}
            color={Theme.red}
            onMove={(pos) => setPx(pos[0])}
          />
        </Mafs>
        <div style={{ fontSize: '11px', color: '#5f5e5a', textAlign: 'center' }}>
          작은 점 = 앞·뒤 참고 지점(초록=오르막 쪽, 빨강=내리막 쪽)
        </div>
      </div>

      {/* O/X 격자표(결과 확인용) */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '10px', padding: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', maxWidth: '340px', margin: '0 auto' }}>
          <thead>
            <tr>
              <th style={{ padding: '6px', fontSize: '12px', color: '#5f5e5a', border: '1px solid #ddd8ca' }}></th>
              <th style={{ padding: '6px', fontSize: '12px', color: '#2e7d32', border: '1px solid #ddd8ca' }}>오르막 ↗</th>
              <th style={{ padding: '6px', fontSize: '12px', color: '#c0392b', border: '1px solid #ddd8ca' }}>내리막 ↘</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '6px', fontSize: '12px', fontWeight: 'bold', color: '#5f5e5a', border: '1px solid #ddd8ca' }}>앞</td>
              <td style={cell(beforeUp, '#2e7d32')}>{beforeUp ? 'O' : 'X'}</td>
              <td style={cell(!beforeUp, '#c0392b')}>{!beforeUp ? 'O' : 'X'}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px', fontSize: '12px', fontWeight: 'bold', color: '#5f5e5a', border: '1px solid #ddd8ca' }}>뒤</td>
              <td style={cell(afterUp, '#2e7d32')}>{afterUp ? 'O' : 'X'}</td>
              <td style={cell(!afterUp, '#c0392b')}>{!afterUp ? 'O' : 'X'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 그래프: 삼진 계단 */}
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: [-1.6, 1.6] }} preserveAspectRatio={false} height={160}>
          <Coordinates.Cartesian yAxis={{ lines: 1 }} />
          {Array.from({ length: 150 }).map((_, i) => {
            const x1 = xMin + ((xMax - xMin) * i) / 150;
            const x2 = xMin + ((xMax - xMin) * (i + 1)) / 150;
            const tt = turnAt((x1 + x2) / 2);
            return <Line.Segment key={i} point1={[x1, tt]} point2={[x2, tt]}
              color={tt === 1 ? Theme.green : tt === -1 ? Theme.red : Theme.blue} />;
          })}
          <Point x={px} y={t} color={Theme.red} />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          가로=점 위치, 세로=전환 종류(+1 극대 / 0 비탈 / −1 극소)
        </div>
      </div>
    </div>
  );
}
