// ===========================================================
// no:"2a" "가파름 — 기울기가 뭔가" 전용 인터랙션. (접선 세트 첫 칸)
//
// [이 파일의 위치] 접선(no:2)으로 올라가는 4계단의 첫 칸. 반전 없음.
// "기울기 = 얼마나 가파른가"라는 가장 기본 믿음만 확실히 세운다.
// 이걸 세워야 2b(할선=두 점의 평균 기울기), 2c(접선=한 점의 기울기)가 의미를 갖는다.
//
// [핵심 직관] 기울기 숫자가 클수록 미끄럼틀이 가파르다. 작을수록 완만하다.
//   기울기 = 가로로 1 갈 때 세로로 얼마나 올라가는가 (오른쪽으로 1, 위로 m).
//
// [조작] 슬라이더 1개(기울기 m): 밀면 (1) 왼쪽 미끄럼틀 그림의 각도가 실시간으로 변하고
//   (2) 오른쪽 그래프의 직선 y=m·x 가 같이 기울어진다. 두 그림이 sharedX로 연동.
//
// [상태] logIdx별 숫자 하나(slope). 기본 1.
//
// [모델 필드] visual.kind만 mafs_function이면 된다(formula는 이 장치에선 안 씀).
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Line, Theme, MovablePoint } from 'mafs';
import { toRange } from './mathDeviceShared';

export function renderSlopeRamp(log, logIdx, sharedXByLog, setSharedXByLog) {
  const DEBUG = '[mathDevice_slopeRamp 디버그]';
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') {
    console.log(`${DEBUG} 중단: visual.kind가 mafs_function이 아니다.`, v);
    return null;
  }

  const slopeMin = 0.2, slopeMax = 4;
  const slope = sharedXByLog?.[logIdx] ?? 1;
  const setSlope = (val) => {
    const clamped = Math.min(slopeMax, Math.max(slopeMin, val));
    setSharedXByLog?.(prev => ({ ...prev, [logIdx]: clamped }));
  };

  // 미끄럼틀 SVG: 왼쪽 아래(출발)에서 오른쪽 위로 올라가는 경사면.
  // 기울기가 클수록 오른쪽 끝이 더 높이 올라간다.
  const SVG_W = 240, SVG_H = 200, PAD = 24;
  const baseY = SVG_H - PAD;          // 바닥
  const leftX = PAD, rightX = SVG_W - PAD;
  const runPx = rightX - leftX;       // 가로 이동량(고정)
  const risePx = Math.min(baseY - PAD, runPx * slope); // 세로 상승량(기울기 비례, 위로 잘림)
  const topY = baseY - risePx;

  const axisMax = 5;

  // 가파름 텍스트 판정
  const steepWord = slope >= 2.5 ? '매우 가파름' : slope >= 1.3 ? '가파름' : slope >= 0.7 ? '보통' : '완만함';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 슬라이더 */}
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '4px' }}>
          <b>기울기</b>를 바꿔 보자 — 숫자가 클수록 <b>가파른</b> 미끄럼틀
        </div>
        <input type="range" min={slopeMin} max={slopeMax} step={0.1} value={slope}
          onChange={(e) => setSlope(parseFloat(e.target.value))}
          style={{ width: '80%' }} />
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#b5701a', marginTop: '2px' }}>
          기울기 {slope.toFixed(1)} · {steepWord}
        </div>
      </div>

      {/* 미끄럼틀 + 그래프 좌우 */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* 왼쪽: 미끄럼틀 그림 */}
        <div style={{ background: '#f5f2e8', borderRadius: '10px', padding: '8px' }}>
          <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginBottom: '2px' }}>미끄럼틀</div>
          <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
            {/* 바닥 */}
            <line x1={0} y1={baseY} x2={SVG_W} y2={baseY} stroke="#c9c0aa" strokeWidth="2" />
            {/* 경사면(미끄럼틀) */}
            <polygon points={`${leftX},${baseY} ${rightX},${topY} ${rightX},${baseY}`}
              fill="#f0c070" stroke="#b5701a" strokeWidth="2" />
            {/* 미끄럼 라인 강조 */}
            <line x1={leftX} y1={baseY} x2={rightX} y2={topY} stroke="#b5701a" strokeWidth="3" />
            {/* 가로 1, 세로 m 표시(직각 삼각형 느낌) */}
            <line x1={rightX} y1={baseY} x2={rightX} y2={topY} stroke="#2f5a99" strokeWidth="2" strokeDasharray="4 3" />
            <text x={rightX - 6} y={(baseY + topY) / 2} fontSize="11" fill="#2f5a99" textAnchor="end">↑ {slope.toFixed(1)}</text>
            <text x={(leftX + rightX) / 2} y={baseY + 14} fontSize="11" fill="#5f5e5a" textAnchor="middle">가로 →</text>
            {/* 공 아이콘 */}
            <circle cx={leftX + 8} cy={baseY - 8} r="7" fill="#e24b4a" />
          </svg>
        </div>

        {/* 오른쪽: 그래프 y = slope · x */}
        <div className="viz-box" style={{ minWidth: '260px', flex: 1 }}>
          <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>그래프: 직선 y = 기울기 × x</div>
          <Mafs viewBox={{ x: [0, axisMax], y: [0, axisMax] }} preserveAspectRatio={false} height={200}>
            <Coordinates.Cartesian />
            <Line.Segment point1={[0, 0]}
              point2={[axisMax, Math.min(axisMax, slope * axisMax)]} color={Theme.blue} />
            <MovablePoint
              point={[1, slope]}
              constrain={(pos) => {
                // 가로를 1로 고정하고 세로만 끌어 기울기 조절 (세로 = 기울기)
                const y = Math.min(slopeMax, Math.max(slopeMin, pos[1]));
                return [1, y];
              }}
              color={Theme.red}
              onMove={(pos) => setSlope(pos[1])}
            />
          </Mafs>
          <div style={{ fontSize: '11px', color: '#5f5e5a', textAlign: 'center' }}>
            가로로 1 갈 때 세로로 {slope.toFixed(1)} 올라감 = 기울기 {slope.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
}
