import { renderDevice_no8 } from './mathDevice_no8';
import { renderDevice_no1, renderLimitApproachLinked } from './mathDevice_no1';
import { renderDevice_no1_1 } from './mathDevice_no1_1';
import { renderDivGt1 } from './mathDevice_div_gt1';
import { renderDivLt1 } from './mathDevice_div_lt1';
import { renderInfDiv } from './mathDevice_infdiv';
import { renderZeroDiv } from './mathDevice_zerodiv';
import { renderSlopeRamp }     from './mathDevice_slopeRamp';
import { renderSecant }        from './mathDevice_secant';
import { renderSecantTangent } from './mathDevice_secantTangent';
import { renderTangentJudge }  from './mathDevice_tangentJudge';
import { renderUpDownIntro }   from './mathDevice_upDownIntro';
import { renderRollPoint }     from './mathDevice_rollPoint';
import { renderTangentArrow }  from './mathDevice_tangentArrow';
import { renderIntervalSplit } from './mathDevice_intervalSplit';


// deviceType(+선택 no) → 렌더러. 새 장치는 여기 한 줄만 추가.
const REGISTRY = [
  { deviceType: 'balance',        no: '8', render: renderDevice_no8,   needsDeviceVisual: true },
  { deviceType: 'limit_approach', no: '1', render: renderDevice_no1,   linkedRender: renderLimitApproachLinked, needsDeviceVisual: true },
  { deviceType: 'limit_approach', no: '0', render: renderDevice_no1_1, needsDeviceVisual: true },
  { deviceType: 'divide_shrink',  no: 'div1', render: renderDivGt1,    needsDeviceVisual: false },
   { deviceType: 'divide_grow',   no: 'div2', render: renderDivLt1,       needsDeviceVisual: false },
   { deviceType: 'inf_over_inf', no: 'infdiv', render: renderInfDiv, needsDeviceVisual: false },
   { deviceType: 'zero_over_zero', no: 'zerodiv', render: renderZeroDiv, needsDeviceVisual: false },
   { deviceType: 'slope_ramp',      no: '2a', render: renderSlopeRamp,     needsDeviceVisual: false },
  { deviceType: 'secant',          no: '2b', render: renderSecant,        needsDeviceVisual: false },
  { deviceType: 'secant_tangent',  no: '2c', render: renderSecantTangent, needsDeviceVisual: false },
  { deviceType: 'tangent_judge',   no: '2d', render: renderTangentJudge,  needsDeviceVisual: false },
  { deviceType: 'up_down_intro',  no: '3a', render: renderUpDownIntro,   needsDeviceVisual: false },
  { deviceType: 'roll_point',     no: '3b', render: renderRollPoint,     needsDeviceVisual: false },
  { deviceType: 'tangent_arrow',  no: '3c', render: renderTangentArrow,  needsDeviceVisual: false },
  { deviceType: 'interval_split', no: '3d', render: renderIntervalSplit, needsDeviceVisual: false },
  
];

const BY_NO = {}, BY_DEVICE_TYPE = {};
REGISTRY.forEach(r => {
  if (r.no != null) BY_NO[String(r.no)] = r;
  BY_DEVICE_TYPE[r.deviceType] = r;
});

export function getDeviceRenderer(deviceType) {
  const r = BY_DEVICE_TYPE[deviceType];
  return r ? { render: r.render, linkedRender: r.linkedRender || null } : null;
}
export function getDeviceRendererByNo(no) {
  const r = BY_NO[String(no)];
  return r ? { render: r.render, linkedRender: r.linkedRender || null } : null;
}
export function deviceNeedsDeviceVisual(deviceType) {
  const r = BY_DEVICE_TYPE[deviceType];
  return r ? r.needsDeviceVisual !== false : true;
}