// ===========================================================
// no:"11-4" "합치는 부분 = 합집합" — bar_chart 스타일 재구성.
// 기존 renderBarChart(recharts BarChart)의 시각언어를 그대로 쓰되, A만/겹침/B만
// 세 막대 값을 슬라이더로 조절해 합집합 크기(전체 막대 합)가 실시간으로 변하게 한다.
// [조작] A만·겹침·B만 슬라이더 3개 [결과도형] 막대그래프(recharts)
// [그래프] 같은 막대그래프가 곧 그래프 — 전체 높이가 합집합 크기
// ===========================================================
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function renderUnionBand(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  const st = sharedXByLog?.[logIdx] || {};
  const onlyA = st.onlyA ?? 3, both = st.both ?? 2, onlyB = st.onlyB ?? 4;
  const patch = (p) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: { onlyA, both, onlyB, ...(prev?.[logIdx] || {}), ...p } }));

  const bars = [
    { label: 'A만', value: onlyA },
    { label: '겹침', value: both },
    { label: 'B만', value: onlyB },
  ];
  const total = onlyA + both + onlyB;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="viz-box" style={{ background: '#f5f2e8', borderRadius: '10px', padding: '8px' }}>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', fontSize: '11px' }}>
          <div>A만<input type="range" min={0} max={8} step={1} value={onlyA} onChange={(e) => patch({ onlyA: +e.target.value })} style={{ width: '80px' }} /></div>
          <div>겹침<input type="range" min={0} max={8} step={1} value={both} onChange={(e) => patch({ both: +e.target.value })} style={{ width: '80px' }} /></div>
          <div>B만<input type="range" min={0} max={8} step={1} value={onlyB} onChange={(e) => patch({ onlyB: +e.target.value })} style={{ width: '80px' }} /></div>
        </div>
      </div>
      <div className="viz-box">
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={bars}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b6d11" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ fontSize: '12px', color: '#5f5e5a', textAlign: 'center' }}>
          세 막대를 합친 전체(<b>{total}</b>)가 <b>합집합</b>의 크기입니다
        </div>
      </div>
    </div>
  );
}
