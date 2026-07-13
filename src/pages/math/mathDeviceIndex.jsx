// ===========================================================
// 항목별 파일 매핑. 렌더링 로직은 없다 — 조회용 인덱스다.
// 새 항목이 생기면 오직 여기 REGISTRY에 한 줄만 추가하면 된다.
// SceneGeneratorEngine은 이 파일만 import하고, 아래 3개 함수로만 조회한다:
//   getDeviceRenderer(deviceType) / deviceNeedsDeviceVisual(deviceType) / getDevicePromptBlock(deviceType)
// ===========================================================
import { MATH_DEVICE_ITEM_NO8, renderDevice_no8 } from './mathDevice_no8';
import { MATH_DEVICE_ITEM_NO1, renderDevice_no1, renderLimitApproachLinked } from './mathDevice_no1';
import { MATH_DEVICE_ITEM_NO1_1, renderDevice_no1_1 } from './mathDevice_no1_1';
import { MATH_DEVICE_ITEM_DIV1, renderDivGt1 } from './mathDevice_div_gt1';

// ── 항목 하나 = 한 줄. 새 파일 추가 시 여기만 늘린다. ──────────────
// deviceType: 이 항목의 GOALS_DATA deviceType 문자열 (디스패치 키)
// render:     실제 렌더러 함수 (log, logIdx, sharedXByLog, setSharedXByLog) 시그니처
// linkedRender: (선택) device_visual 연동 우선 렌더러. 있으면 먼저 시도하고 실패 시 render로 폴백
// needsDeviceVisual: 모델이 device_visual을 채워야 하는가 (false면 검증·프롬프트에서 제외)
const REGISTRY = [
  { item: MATH_DEVICE_ITEM_NO8,   deviceType: 'balance',        render: renderDevice_no8,   needsDeviceVisual: true },
  { item: MATH_DEVICE_ITEM_NO1,   deviceType: 'limit_approach', render: renderDevice_no1,   linkedRender: renderLimitApproachLinked, needsDeviceVisual: true },
  { item: MATH_DEVICE_ITEM_NO1_1, deviceType: 'limit_approach', render: renderDevice_no1_1, needsDeviceVisual: true },
  { item: MATH_DEVICE_ITEM_DIV1,  deviceType: 'divide_shrink',  render: renderDivGt1,       needsDeviceVisual: false },
];

// 테스트용 GOALS_DATA.math 항목 목록.
export const MATH_DEVICE_TEST_ITEMS = REGISTRY.map(r => r.item);

// deviceType → 렌더러 정보. 같은 deviceType이 여러 항목에 쓰이면(예: limit_approach)
// no로 더 정밀히 갈라야 할 수 있으므로, deviceType 기준 조회 + no 기준 조회 둘 다 제공한다.
const BY_DEVICE_TYPE = {};
const BY_NO = {};
REGISTRY.forEach(r => {
  BY_DEVICE_TYPE[r.deviceType] = r;       // 같은 deviceType이면 마지막 것이 이김(주의)
  if (r.item && r.item.no != null) BY_NO[String(r.item.no)] = r;
});

// deviceType으로 렌더러(및 연동 렌더러) 조회. SceneGeneratorEngine이 이걸로 디스패치한다.
export function getDeviceRenderer(deviceType) {
  const r = BY_DEVICE_TYPE[deviceType];
  return r ? { render: r.render, linkedRender: r.linkedRender || null } : null;
}

// no로 렌더러 조회 (같은 deviceType이 여러 개일 때 정밀 분기용).
export function getDeviceRendererByNo(no) {
  const r = BY_NO[String(no)];
  return r ? { render: r.render, linkedRender: r.linkedRender || null } : null;
}

// 이 deviceType은 모델이 device_visual을 채워야 하는가.
export function deviceNeedsDeviceVisual(deviceType) {
  const r = BY_DEVICE_TYPE[deviceType];
  return r ? r.needsDeviceVisual !== false : true; // 등록 안 된 건 기본 true(안전)
}