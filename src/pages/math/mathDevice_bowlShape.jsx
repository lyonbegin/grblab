// ===========================================================
// no:"5a" "그릇 모양 — 받친 그릇 vs 엎어놓은 그릇" 전용 인터랙션. (오목볼록 세트 첫 칸)
//
// [핵심] 아래로 볼록(∪, 물 담기는 그릇) vs 위로 볼록(∩, 엎어놓은 그릇) 구분. 반전 없음.
//   토글로 두 모양을 번갈아 보며 "담을 수 있나?"로 직관을 세운다.
//
// [모델 필드] curves[0].formula(∪ 곡선), curves[1].formula(∩ 곡선). 없으면 기본 제공.
// ===========================================================
import React from 'react';
import { Mafs, Coordinates, Plot, Theme } from 'mafs';
import { safeCompile, toRange } from './mathDeviceShared';

export function renderBowlShape(log, logIdx, sharedXByLog, setSharedXByLog) {
  const v = log.visual;
  if (!v || v.kind !== 'mafs_function') return null;

  const upFormula = (v.curves || [])[0]?.formula || '0.4*(x-3)*(x-3)+1';   // ∪
  const downFormula = (v.curves || [])[1]?.formula || '-0.4*(x-3)*(x-3)+7'; // ∩
  const cUp = safeCompile(upFormula, 'explicit');
  const cDown = safeCompile(downFormula, 'explicit');
  if (!cUp || !cDown) return null;
  const fUp = (x) => { try { return cUp.evaluate({ x }); } catch (e) { return NaN; } };
  const fDown = (x) => { try { return cDown.evaluate({ x }); } catch (e) { return NaN; } };

  const xRange = toRange(v.xRange, [0, 6]);
  const yRange = toRange(v.yRange, [0, 8]);

  // 상태: 어느 그릇을 보고 있나 ('up'=∪, 'down'=∩)
  const which = sharedXByLog?.[logIdx] ?? 'up';
  const setWhich = (w) => setSharedXByLog?.(prev => ({ ...prev, [logIdx]: w }));

  const isUp = which === 'up';
  const f = isUp ? fUp : fDown;
  const word = isUp ? '아래로 볼록 (∪) — 물을 담을 수 있는 그릇' : '위로 볼록 (∩) — 엎어놓은 그릇';
  const wc = isUp ? '#2f5a99' : '#b5701a';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: '#efe9db', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '6px' }}>
          두 그릇을 번갈아 보자 — <b>물을 담을 수 있나?</b>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button type="button" onClick={() => setWhich('up')}
            style={{ padding: '4px 12px', borderRadius: '6px', cursor: 'pointer',
              border: isUp ? '2px solid #2f5a99' : '1px solid #ccc', background: isUp ? '#dbe6f5' : '#fff',
              fontWeight: isUp ? 'bold' : 'normal' }}>∪ 받친 그릇</button>
          <button type="button" onClick={() => setWhich('down')}
            style={{ padding: '4px 12px', borderRadius: '6px', cursor: 'pointer',
              border: !isUp ? '2px solid #b5701a' : '1px solid #ccc', background: !isUp ? '#f5e6cc' : '#fff',
              fontWeight: !isUp ? 'bold' : 'normal' }}>∩ 엎은 그릇</button>
        </div>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: wc, marginTop: '6px' }}>{word}</div>
      </div>
      <div className="viz-box">
        <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
          <Coordinates.Cartesian />
          <Plot.OfX y={f} color={isUp ? Theme.blue : Theme.orange} />
        </Mafs>
        <div style={{ fontSize: '13px', color: '#5f5e5a', textAlign: 'center' }}>
          <span style={{ fontSize: '11px' }}>
            아래로 볼록(∪)은 물이 고이는 그릇, 위로 볼록(∩)은 엎어놓아 물이 흘러내리는 모양입니다.
          </span>
        </div>
      </div>
    </div>
  );
}
