// ===========================================================
// no:"11-3" "겹치는 부분 = 교집합" — venn 스타일 재구성.
// 기존 renderVenn(두 겹치는 원 SVG)의 시각언어를 그대로 쓰되, 두 원의 거리를
// 슬라이더로 조절해 겹치는 영역(교집합)이 실시간으로 커지고 작아지게 한다.
// [조작] 두 원 사이 거리 슬라이더 [결과도형] 겹치는 원(벤다이어그램)
// [그래프] 같은 벤다이어그램이 곧 그래프 역할(겹침 넓이 수치 표시)
// ===========================================================
import React from 'react';

export function renderIntersectBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  const dist = sharedXByLog?.[logIdx]?.dist ?? 60;
  const setDist = (d) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), dist: Math.min(160, Math.max(0, d)) } }));

  const R = 80;
  const cxA = 160 - dist / 2, cxB = 160 + dist / 2;
  const cy = 100;
  // 겹침 정도(대략치): 거리가 0이면 완전겹침, 2R 이상이면 안 겹침
  const overlapRatio = Math.max(0, Math.min(1, 1 - dist / (2 * R)));
  const hasOverlap = dist < 2 * R;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '8px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginBottom: '4px' }}>
          두 원의 거리를 조절해 겹치는 부분을 바꿔보세요
        </div>
        <input type="range" min={0} max={160} step={2} value={dist}
          onChange={(e) => setDist(parseFloat(e.target.value))} style={{ width: '80%', display: 'block', margin: '0 auto' }} />
      </div>
      <div className="viz-box">
        <svg width="320" height="200" viewBox="0 0 320 200">
          <circle cx={cxA} cy={cy} r={R} fill="#3b6d1133" stroke="#3b6d11" strokeWidth="2" />
          <circle cx={cxB} cy={cy} r={R} fill="#d85a3033" stroke="#d85a30" strokeWidth="2" />
          <text x={cxA - 50} y="55" fontSize="14" fill="#3b6d11">조건1</text>
          <text x={cxB + 20} y="55" fontSize="14" fill="#d85a30">조건2</text>
          <text x="160" y="105" fontSize="16" textAnchor="middle" fontWeight="bold">
            {hasOverlap ? `겹침 ${(overlapRatio * 100).toFixed(0)}%` : '겹침 없음'}
          </text>
        </svg>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          두 원이 <b>겹치는 부분(교집합)</b>이 '둘 다 만족'하는 답입니다
        </div>
      </div>
    </div>
  );
}
