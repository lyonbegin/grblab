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

import { renderCoordPoint } from './mathDevice_coordPoint';
import { renderFormulaMachine } from './mathDevice_formulaMachine';
import { renderSubstitute } from './mathDevice_substitute';
import { renderTracePath } from './mathDevice_tracePath';
import { renderTwoLines } from './mathDevice_twoLines';
import { renderIntersectX } from './mathDevice_intersectX';
import { renderCountCross } from './mathDevice_countCross';
import { renderCompare } from './mathDevice_compare';
import { renderHeightIsSize } from './mathDevice_heightIsSize';
import { renderSwapOrder } from './mathDevice_swapOrder';
import { renderRange } from './mathDevice_range';
import { renderBoundary } from './mathDevice_boundary';
import { renderAboveRegion } from './mathDevice_aboveRegion';
import { renderCrossBoundary } from './mathDevice_crossBoundary';


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
{ deviceType: 'coord_point',     no: '8-1', render: renderCoordPoint,     needsDeviceVisual: false },
  { deviceType: 'formula_machine', no: '8-2', render: renderFormulaMachine, needsDeviceVisual: false },
  { deviceType: 'substitute',      no: '8-3', render: renderSubstitute,     needsDeviceVisual: false },
  { deviceType: 'trace_path',      no: '8-4', render: renderTracePath,      needsDeviceVisual: false },
  { deviceType: 'two_lines',       no: '8-5', render: renderTwoLines,       needsDeviceVisual: false },
  { deviceType: 'intersect_x',     no: '8-6', render: renderIntersectX,     needsDeviceVisual: false },
  { deviceType: 'count_cross',     no: '8-7', render: renderCountCross,     needsDeviceVisual: false },
  { deviceType: 'compare',        no: '9-1', render: renderCompare,      needsDeviceVisual: false },
  { deviceType: 'height_is_size', no: '9-2', render: renderHeightIsSize, needsDeviceVisual: false },
  { deviceType: 'swap_order',     no: '9-3', render: renderSwapOrder,    needsDeviceVisual: false },
  { deviceType: 'range',          no: '9-4', render: renderRange,        needsDeviceVisual: false },
  { deviceType: 'boundary',       no: '9-5', render: renderBoundary,     needsDeviceVisual: false },
  { deviceType: 'above_region',   no: '9-6', render: renderAboveRegion,  needsDeviceVisual: false },
  { deviceType: 'cross_boundary', no: '9-7', render: renderCrossBoundary, needsDeviceVisual: false },
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