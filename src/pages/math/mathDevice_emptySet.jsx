// ===========================================================
// no:"11-5" "겹침이 없을 수도 있다" — venn 스타일 재구성(11-3과 자매, 극단 케이스).
// 기존 renderVenn 시각언어를 그대로 쓰되, 두 원을 완전히 떼어놓아 vennBoth가 0이
// 되는 순간(공집합)을 학생이 직접 만들어보게 한다.
// [조작] 두 원 거리 슬라이더(0~아주 멀리) [결과도형] 벤다이어그램
// [그래프] 같은 벤다이어그램 — 겹침 0이면 "해 없음" 배지
// ===========================================================
import React from 'react';

export function renderEmptySet(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  const dist = sharedXByLog?.[logIdx]?.dist ?? 200;
  const setDist = (d) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { ...(prev?.[logIdx] || {}), dist: Math.min(260, Math.max(0, d)) } }));

  const R = 70;
  const half = Math.min(dist / 2, 150);
  const cxA = 160 - half, cxB = 160 + half;
  const cy = 100;
  const hasOverlap = dist < 2 * R;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '8px' }}>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center', marginBottom: '4px' }}>
          두 원을 멀리 떼어놓아 겹침을 없애보세요
        </div>
        <input type="range" min={0} max={260} step={4} value={dist}
          onChange={(e) => setDist(parseFloat(e.target.value))} style={{ width: '80%', display: 'block', margin: '0 auto' }} />
      </div>
      <div className="viz-box">
        <svg width="320" height="200" viewBox="0 0 320 200">
          <circle cx={cxA} cy={cy} r={R} fill="#3b6d1133" stroke="#3b6d11" strokeWidth="2" />
          <circle cx={cxB} cy={cy} r={R} fill="#d85a3033" stroke="#d85a30" strokeWidth="2" />
          <text x={Math.max(10, cxA - 45)} y="55" fontSize="14" fill="#3b6d11">조건1</text>
          <text x={Math.min(280, cxB + 15)} y="55" fontSize="14" fill="#d85a30">조건2</text>
          {!hasOverlap && <text x="160" y="105" fontSize="15" textAnchor="middle" fontWeight="bold" fill="#c0392b">겹침 없음 = 답 없음</text>}
        </svg>
        <div style={{ fontSize: '12px', color: hasOverlap ? '#5f5e5a' : '#c0392b', textAlign: 'center', fontWeight: hasOverlap ? 'normal' : 'bold' }}>
          {hasOverlap ? '아직 겹침이 있습니다' : '두 조건을 동시에 만족하는 값이 하나도 없습니다(공집합)'}
        </div>
      </div>
    </div>
  );
}
