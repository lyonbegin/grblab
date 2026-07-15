
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


import { renderCompare } from './mathDevice_compare';
import { renderHeightIsSize } from './mathDevice_heightIsSize';
import { renderSwapOrder } from './mathDevice_swapOrder';
import { renderRange } from './mathDevice_range';
import { renderBoundary } from './mathDevice_boundary';
import { renderAboveRegion } from './mathDevice_aboveRegion';
import { renderCrossBoundary } from './mathDevice_crossBoundary';
import { renderParabolaShape } from './mathDevice_parabolaShape';
import { renderParabolaSign } from './mathDevice_parabolaSign';
import { renderSquarePositive } from './mathDevice_squarePositive';
import { renderVertex } from './mathDevice_vertex';
import { renderTranslate } from './mathDevice_translate';
import { renderDipCount } from './mathDevice_dipCount';
import { renderTangentBoundary } from './mathDevice_tangentBoundary';
import { renderPeakValley }        from './mathDevice_peakValley';
import { renderExtremumZeroSlope } from './mathDevice_extremumZeroSlope';
import { renderExtremumTurn }      from './mathDevice_extremumTurn';
import { renderExtremumJudge }     from './mathDevice_extremumJudge';
import { renderBowlShape }       from './mathDevice_bowlShape';
import { renderCurveBend }       from './mathDevice_curveBend';
import { renderTangentSide }     from './mathDevice_tangentSide';
import { renderInflectionPoint } from './mathDevice_inflectionPoint';
import { renderHighestPoint }      from './mathDevice_highestPoint';
import { renderWindowSlide }       from './mathDevice_windowSlide';
import { renderEndpointCandidate } from './mathDevice_endpointCandidate';
import { renderMaxMinJudge }       from './mathDevice_maxMinJudge';
import { renderFloorTouch } from './mathDevice_floorTouch';
import { renderCountRoots } from './mathDevice_countRoots';
import { renderShiftCurve } from './mathDevice_shiftCurve';
import { renderRootsJudge } from './mathDevice_rootsJudge';


import { renderOneBand } from './mathDevice_oneBand';
import { renderShadeBand } from './mathDevice_shadeBand';
import { renderIntersectBand } from './mathDevice_intersectBand';
import { renderUnionBand } from './mathDevice_unionBand';
import { renderEmptySet } from './mathDevice_emptySet';
import { renderBothConditions } from './mathDevice_bothConditions';
import { renderNoSolution } from './mathDevice_noSolution';

import { renderCoordPoint } from './mathDevice_coordPoint';           // 8-1: 레이저 스캔 교차
import { renderFormulaMachine } from './mathDevice_formulaMachine';   // 8-2: 네온 레일 자취
import { renderIntersectX } from './mathDevice_intersectX';           // 8-3: 두 레일 충돌과 x축
import { renderCountCross } from './mathDevice_countCross';           // 8-4: 궤적 시프트와 해의 개수
import { renderDevice_no8 } from './mathDevice_no8';                  // 8  : 양팔저울 마스터판

import { renderInflectionJudge } from './mathDevice_inflectionJudge';

// deviceType(+선택 no) → 렌더러. 새 장치는 여기 한 줄만 추가.
const REGISTRY = [

  { deviceType: 'coord_point',     no: '8-1', render: renderCoordPoint,     needsDeviceVisual: false },
  { deviceType: 'formula_machine', no: '8-2', render: renderFormulaMachine, needsDeviceVisual: false },
  { deviceType: 'intersect_x',     no: '8-3', render: renderIntersectX,     needsDeviceVisual: false },
  { deviceType: 'count_cross',     no: '8-4', render: renderCountCross,     needsDeviceVisual: false },
  { deviceType: 'balance',         no: '8',   render: renderDevice_no8,     needsDeviceVisual: true  },

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


// { deviceType: 'coord_point',     no: '8-1', render: renderCoordPoint,     needsDeviceVisual: false },
//   { deviceType: 'formula_machine', no: '8-2', render: renderFormulaMachine, needsDeviceVisual: false },
//   { deviceType: 'substitute',      no: '8-3', render: renderSubstitute,     needsDeviceVisual: false },
//   { deviceType: 'trace_path',      no: '8-4', render: renderTracePath,      needsDeviceVisual: false },
//   { deviceType: 'two_lines',       no: '8-5', render: renderTwoLines,       needsDeviceVisual: false },
//   { deviceType: 'intersect_x',     no: '8-6', render: renderIntersectX,     needsDeviceVisual: false },
//   { deviceType: 'count_cross',     no: '8-7', render: renderCountCross,     needsDeviceVisual: false },

{ deviceType: 'inflection_judge', no: '5e', render: renderInflectionJudge, needsDeviceVisual: false },

  { deviceType: 'compare',        no: '9-1', render: renderCompare,      needsDeviceVisual: false },
  { deviceType: 'height_is_size', no: '9-2', render: renderHeightIsSize, needsDeviceVisual: false },
  { deviceType: 'swap_order',     no: '9-3', render: renderSwapOrder,    needsDeviceVisual: false },
  { deviceType: 'range',          no: '9-4', render: renderRange,        needsDeviceVisual: false },
  { deviceType: 'boundary',       no: '9-5', render: renderBoundary,     needsDeviceVisual: false },
  { deviceType: 'above_region',   no: '9-6', render: renderAboveRegion,  needsDeviceVisual: false },
  { deviceType: 'cross_boundary', no: '9-7', render: renderCrossBoundary, needsDeviceVisual: false },
  { deviceType: 'parabola_shape',    no: '10-1', render: renderParabolaShape,   needsDeviceVisual: false },
  { deviceType: 'parabola_sign',     no: '10-2', render: renderParabolaSign,    needsDeviceVisual: false },
  { deviceType: 'square_positive',   no: '10-3', render: renderSquarePositive,  needsDeviceVisual: false },
  { deviceType: 'vertex',            no: '10-4', render: renderVertex,          needsDeviceVisual: false },
  { deviceType: 'translate',         no: '10-5', render: renderTranslate,       needsDeviceVisual: false },
  { deviceType: 'dip_count',         no: '10-6', render: renderDipCount,        needsDeviceVisual: false },
  { deviceType: 'tangent_boundary',  no: '10-7', render: renderTangentBoundary, needsDeviceVisual: false },
  { deviceType: 'peak_valley',         no: '4a', render: renderPeakValley,        needsDeviceVisual: false },
  { deviceType: 'extremum_zero_slope', no: '4b', render: renderExtremumZeroSlope, needsDeviceVisual: false },
  { deviceType: 'extremum_turn',       no: '4c', render: renderExtremumTurn,      needsDeviceVisual: false },
  { deviceType: 'extremum_judge',      no: '4d', render: renderExtremumJudge,     needsDeviceVisual: false },
  { deviceType: 'bowl_shape',       no: '5a', render: renderBowlShape,       needsDeviceVisual: false },
  { deviceType: 'curve_bend',       no: '5b', render: renderCurveBend,       needsDeviceVisual: false },
  { deviceType: 'tangent_side',     no: '5c', render: renderTangentSide,     needsDeviceVisual: false },
  { deviceType: 'inflection_point', no: '5d', render: renderInflectionPoint, needsDeviceVisual: false },
  { deviceType: 'highest_point',       no: '6a', render: renderHighestPoint,      needsDeviceVisual: false },
  { deviceType: 'window_slide',        no: '6b', render: renderWindowSlide,       needsDeviceVisual: false },
  { deviceType: 'endpoint_candidate',  no: '6c', render: renderEndpointCandidate, needsDeviceVisual: false },
  { deviceType: 'max_min_judge',       no: '6d', render: renderMaxMinJudge,       needsDeviceVisual: false },
  { deviceType: 'floor_touch', no: '7a', render: renderFloorTouch, needsDeviceVisual: false },
  { deviceType: 'count_roots', no: '7b', render: renderCountRoots, needsDeviceVisual: false },
  { deviceType: 'shift_curve', no: '7c', render: renderShiftCurve, needsDeviceVisual: false },
  { deviceType: 'roots_judge', no: '7d', render: renderRootsJudge, needsDeviceVisual: false },
  { deviceType: 'one_band',        no: '11-1', render: renderOneBand,        needsDeviceVisual: false },
  { deviceType: 'shade_band',      no: '11-2', render: renderShadeBand,      needsDeviceVisual: false },
  { deviceType: 'intersect_band',  no: '11-3', render: renderIntersectBand,  needsDeviceVisual: false },
  { deviceType: 'union_band',      no: '11-4', render: renderUnionBand,      needsDeviceVisual: false },
  { deviceType: 'empty_set',       no: '11-5', render: renderEmptySet,       needsDeviceVisual: false },
  { deviceType: 'both_conditions', no: '11-6', render: renderBothConditions, needsDeviceVisual: false },
  { deviceType: 'no_solution',     no: '11-7', render: renderNoSolution,     needsDeviceVisual: false },
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