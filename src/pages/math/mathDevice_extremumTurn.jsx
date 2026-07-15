// ===========================================================
// no:"4c" "전환점 — 앞뒤 방향으로 극대·극소를 가린다"  (극값 세트 셋째 칸)
//
// [재설계 요지 — 11번 세트 형식에 맞춤]
//   기존: 세로선만 긋고 결과가 글자로 떴다. x→y 함수 그래프가 없었다.
//   수정: (1) 시각언어를 matrix(O/X 격자표)로 → "앞=오르막? 뒤=내리막?" 논리 조합이
//             표로 명시된다. 네 조합(↑↓ / ↓↑ / ↑↑ / ↓↓) 중 어디인지 한눈에 보인다.
//         (2) x→y 함수 그래프 추가 → x=점 위치, y=전환 종류(+1 극대/0 비탈/−1 극소).
//             이진 계단(세 값 사이 점프).
//
// [개념] 앞은 오르막·뒤는 내리막 → 극대. 앞은 내리막·뒤는 오르막 → 극소.
//   방향이 안 바뀌면(↑↑ 또는 ↓↓) 그냥 비탈.
//
// [시각언어] matrix — 2행(앞/뒤) × 상태 격자에 O/X 표시.
// [조작] 슬라이더로 점 이동 → 격자의 O/X가 실시간으로 바뀐다.
// [그래프] x=점 위치, y=전환 종류(+1/0/−1). 이진(삼진) 계단.
//
// [검증 완료] x=1.28→+1(극대), x=4.55→−1(극소), x=2.92·0.30→0(비탈)
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Point, Line, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

const D = 0.4; // 앞뒤로 살펴보는 거리

export function renderExtremumTurn(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;
  const formula = (v.curves || [])[0]?.formula || '0.12*x*x*x-1.05*x*x+2.1*x+2.5';
  const compiled = safeCompile(formula, 'explicit');
  if (!compiled) return null;
  const f = (x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 7]);
  const xMin = xRange[0] + D + 0.1, xMax = xRange[1] - D - 0.1;
  const px = sharedXByLog?.[logIdx] ?? 1.3;
  const setPx = (val) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: Math.min(xMax, Math.max(xMin, val)) }));

  const eps = 1e-4;
  const df = (x) => (f(x + eps) - f(x - eps)) / (2 * eps);
  const turnAt = (x) => {
    const L = df(x - D), R = df(x + D);
    if (L > 0.05 && R < -0.05) return 1;    // 오르다 내려감 = 극대
    if (L < -0.05 && R > 0.05) return -1;   // 내리다 오름 = 극소
    return 0;                                // 비탈
  };
  const t = turnAt(px);
  const beforeUp = df(px - D) > 0;   // 앞이 오르막인가
  const afterUp = df(px + D) > 0;    // 뒤가 오르막인가

  const word = t === 1 ? '극대 — 오르다 내려간다' : t === -1 ? '극소 — 내리다 올라간다' : '비탈 — 방향 그대로';
  const wc = t === 1 ? '#2e7d32' : t === -1 ? '#c0392b' : '#5f5e5a';

  // O/X 격자표 (matrix 시각언어)
  const cell = (on, color) => ({
    padding: '8px 0', textAlign: 'center', fontSize: '18px', fontWeight: 'bold',
    border: '1px solid #ddd8ca', background: on ? `${color}22` : '#fff', color: on ? color : '#ccc'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 조작 */}
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          점을 옮기며 <b>앞은 오르막인지, 뒤는 내리막인지</b> 표로 확인하자
        </div>
        <input type="range" min={xMin} max={xMax} step={0.02} value={px}
          onChange={(e) => setPx(parseFloat(e.target.value))} style={{ width: '80%' }} />
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: wc, marginTop: '2px' }}>{word}</div>
      </div>

      {/* 도형: O/X 격자표 (matrix 시각언어) */}
      <div className="viz-box" style={{ background: '#ffffff', borderRadius: '10px', padding: '10px' }}>
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
              <td style={{ padding: '6px', fontSize: '12px', fontWeight: 'bold', color: '#5f5e5a', border: '1px solid #ddd8ca' }}>앞 (왼쪽)</td>
              <td style={cell(beforeUp, '#2e7d32')}>{beforeUp ? 'O' : 'X'}</td>
              <td style={cell(!beforeUp, '#c0392b')}>{!beforeUp ? 'O' : 'X'}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px', fontSize: '12px', fontWeight: 'bold', color: '#5f5e5a', border: '1px solid #ddd8ca' }}>뒤 (오른쪽)</td>
              <td style={cell(afterUp, '#2e7d32')}>{afterUp ? 'O' : 'X'}</td>
              <td style={cell(!afterUp, '#c0392b')}>{!afterUp ? 'O' : 'X'}</td>
            </tr>
          </tbody>
        </table>
        <div style={{ fontSize: '11px', color: '#5f5e5a', textAlign: 'center', marginTop: '6px' }}>
          앞 <b>오르막</b> + 뒤 <b>내리막</b> = <b style={{ color: '#2e7d32' }}>극대</b> ·
          앞 <b>내리막</b> + 뒤 <b>오르막</b> = <b style={{ color: '#c0392b' }}>극소</b>
        </div>
      </div>

      {/* 그래프: x=점 위치, y=전환 종류. 삼진 계단 */}
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: [-1.6, 1.6] }} preserveAspectRatio={false} height={180}>
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
          가로=점 위치, 세로=전환 종류(+1 극대 / 0 비탈 / −1 극소) — <b>세 값 사이를 뛰는 계단</b>입니다
        </div>
      </div>
    </div>
  );
}
