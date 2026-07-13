// ===========================================================
// no:8 "방정식 해=교점" 전용 인터랙션 — 양팔저울.
// 오른쪽 접시를 드래그해서 두 요금(값)을 손으로 맞춰보고, 그 조작이 실시간으로
// 그래프의 교점(x)과 연동된다. 이 파일은 no:8 하나만을 위한 것이다 — 다른 항목은
// 절대 이 파일을 재사용하지 말고, 각자의 mathDevice_noN.jsx를 따로 만든다.
// ===========================================================
import { Mafs, Coordinates, Plot, Point, Line, Theme, MovablePoint } from 'mafs';
import { safeCompile, toRange, findXForDiff } from './mathDeviceShared';

export const MATH_DEVICE_ITEM_NO8 = {
  part: "Ⅰ부",
  category: "도구 2. 그래프",
  no: "8",
  title: "방정식 해=교점",
  difficulty: "4.2 (상)",
  trend: "추론형 4점 문항의 핵심 도구",
  vizType: "mafs_function",
  deviceType: "balance",
  graphRule: `방정식 해=교점 — 3단계 완성판
1단계 — 기원
데카르트(1637)가 좌표기하학으로 대수와 기하를 처음 통합
2단계 — 시나리오 (도형 장치, 그래프 아님)
상인이 양팔저울 위에서 두 가지 다른 요금제의 "무게"(비용)를 손으로 느껴보려 합니다. 왼쪽 접시엔 A회사 요금(사용량에 비례해 늘어나는 추), 오른쪽 접시엔 B회사 요금을 올려가며, 사용량이 어느 정도일 때 저울대가 수평(평형)을 이루는지 찾아봅니다.
- points: 저울의 받침점(중심) + 양쪽 접시 위치
- segments: 저울대(가로 막대) + 양쪽에 매달린 줄
3단계 — 진짜 그래프로 확장
상인은 매번 저울로 손수 재보는 게 번거롭다는 걸 깨닫습니다. 대신 각 사용량에서 두 회사 요금을 미리 계산해 종이에 그려두면, 저울 없이도 눈으로 바로 "평형이 되는 지점"을 찾을 수 있다는 걸 알게 됩니다.
그래프 매핑
- curves: 두 요금제를 나타내는 직선/곡선 2개(예: formula: "3*x+2", formula: "5*x")
- 핵심 질문: 두 요금(저울 양쪽 무게)이 정확히 같아지는 사용량은 얼마인가?
- 그래프 판정 규칙: 두 곡선이 만나는 지점의 x좌표가 곧 "저울이 평형을 이루는 사용량"이자 "방정식의 해" — 곡선이 교차하는 순간이 저울대가 수평이 되는 순간과 정확히 같은 사건.
[실제 구현 규격] narration/choices와 함께 두 시각 필드를 반드시 채운다: (1) device_visual — kind="mafs_shape", points는 정확히 3개: points[0]=받침점(고정), points[1]=왼쪽 접시, points[2]=오른쪽 접시. (2) visual — kind="mafs_function", curves는 정확히 2개.
(segments는 points 인덱스로 연결: {fromPoint:1,toPoint:2}(저울대), {fromPoint:0,toPoint:1}과 {fromPoint:0,toPoint:2}(매단 줄).)`
};

export function renderDevice_no8(log, logIdx, sharedXByLog, setSharedXByLog) {
  const dv = log.deviceVisual;
  const v = log.visual;
  if (!dv || dv.kind !== 'mafs_shape' || !v || v.kind !== 'mafs_function') return null;
  const curves = (v.curves || []).filter(c => c && c.formula);
  if (curves.length !== 2) return null;
  const compiledA = safeCompile(curves[0].formula, curves[0].kind);
  const compiledB = safeCompile(curves[1].formula, curves[1].kind);
  if (!compiledA || !compiledB) return null;
  const dPoints = Array.isArray(dv.points) ? dv.points : [];
  if (dPoints.length < 3) return null;
  const dSegments = Array.isArray(dv.segments) ? dv.segments : [];

  const xRange = toRange(v.xRange, [-10, 10]);
  const yRange = toRange(v.yRange, [-10, 10]);

  const sharedX = sharedXByLog[logIdx] ?? (xRange[0] + xRange[1]) / 2;
  const setSharedX = (x) => {
    const clamped = Math.min(xRange[1], Math.max(xRange[0], x));
    setSharedXByLog(prev => ({ ...prev, [logIdx]: clamped }));
  };

  let yA = NaN, yB = NaN;
  try { yA = compiledA.evaluate({ x: sharedX }); } catch (e) { /* 무시 */ }
  try { yB = compiledB.evaluate({ x: sharedX }); } catch (e) { /* 무시 */ }
  const diff = (Number.isFinite(yA) && Number.isFinite(yB)) ? (yA - yB) : 0;
  const isBalanced = Math.abs(diff) < (Math.max(1, Math.abs(dPoints[0].y)) * 0.01 + 0.05);
  const tiltScale = 0.2;

  const baseY = dPoints[0].y;
  const livePoints = dPoints.map((p, i) => {
    if (i === 1) return { ...p, y: baseY + diff * tiltScale };
    if (i === 2) return { ...p, y: baseY - diff * tiltScale };
    return p;
  });

  const dXRange = toRange(dv.xRange, [dPoints[0].x - 4, dPoints[0].x + 4]);
  const dYRange = toRange(dv.yRange, [baseY - 3, baseY + 3]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '6px' }}>
        <Mafs viewBox={{ x: dXRange, y: dYRange }} preserveAspectRatio={false} height={220}>
          {dSegments.map((s, i) => {
            const p1 = livePoints[s.fromPoint];
            const p2 = livePoints[s.toPoint];
            if (!p1 || !p2) return null;
            const isBeam = (s.fromPoint === 1 && s.toPoint === 2) || (s.fromPoint === 2 && s.toPoint === 1);
            return (
              <Line.Segment
                key={`seg${i}`}
                point1={[p1.x, p1.y]}
                point2={[p2.x, p2.y]}
                color={isBeam && isBalanced ? Theme.green : (s.color || '#8a7f6a')}
              />
            );
          })}
          {livePoints.map((p, i) => {
            if (i === 2) {
              return (
                <MovablePoint
                  key="movable-pan"
                  point={[p.x, p.y]}
                  constrain={(pos) => [p.x, pos[1]]}
                  color={Theme.red}
                  onMove={(pos) => {
                    const newDiff = (baseY - pos[1]) / tiltScale;
                    const newX = findXForDiff(compiledA, compiledB, xRange[0], xRange[1], newDiff);
                    setSharedX(newX);
                  }}
                />
              );
            }
            return typeof p.x === 'number' && typeof p.y === 'number'
              ? <Point key={`pt${i}`} x={p.x} y={p.y} color={i === 1 ? Theme.blue : '#5f5e5a'} />
              : null;
          })}
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          저울의 오른쪽 접시(빨간 점)를 위아래로 끌어보세요{isBalanced ? ' — 지금 평형입니다!' : ''}
        </div>
      </div>
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={320}>
          <Coordinates.Cartesian />
          {curves.map((curve, i) => {
            const compiled = i === 0 ? compiledA : compiledB;
            const color = curve.color || (i === 0 ? Theme.blue : Theme.red);
            return (
              <Plot.OfX key={i} y={(x) => { try { return compiled.evaluate({ x }); } catch (e) { return NaN; } }} color={color} />
            );
          })}
          <MovablePoint
            point={[sharedX, yA]}
            constrain={(pos) => {
              const clampedX = Math.min(xRange[1], Math.max(xRange[0], pos[0]));
              setSharedX(clampedX);
              let y; try { y = compiledA.evaluate({ x: clampedX }); } catch (e) { y = pos[1]; }
              return [clampedX, y];
            }}
            color={Theme.blue}
          />
        </Mafs>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          지금 x = {sharedX.toFixed(2)} · 차이 = {diff.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
