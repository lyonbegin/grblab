// ===========================================================
// no → 항목별 파일 매핑. 이 파일 자체엔 렌더링 로직이 없다 — 그냥 조회용 인덱스다.
// 새 항목이 생기면: 1) mathDevice_noN.jsx를 새로 만들고 2) 여기에 한 줄만 추가한다.
// ===========================================================
import { MATH_DEVICE_ITEM_NO8, renderDevice_no8 } from './mathDevice_no8';
import { MATH_DEVICE_ITEM_NO1, renderDevice_no1 } from './mathDevice_no1';
import { MATH_DEVICE_ITEM_NO1, renderDevice_no1_1 } from './mathDevice_no1_1';

import { MATH_DEVICE_ITEM_NO1, renderDivGt1 } from './mathDevice_div_gt1';


// 테스트용 GOALS_DATA.math 항목 목록 (각 파일에서 export한 데이터를 그대로 모음).
export const MATH_DEVICE_TEST_ITEMS = [
  MATH_DEVICE_ITEM_NO8,
  MATH_DEVICE_ITEM_NO1,
   MATH_DEVICE_ITEM_NO1_1
];

// no별 렌더러. 함수 시그니처가 항목마다 다를 수 있다(no:8은 sharedXByLog 등 추가 인자가
// 필요하고, no:1은 log 하나만 받는다) — 그래서 통일된 시그니처를 강제하지 않고,
// AntiageTab.jsx 쪽에서 각 렌더러가 실제로 몇 개의 인자를 받는지 보고 맞춰 호출한다.
export const MATH_DEVICE_RENDERERS = {
  '8': renderDevice_no8,
  '1': renderDevice_no1,
   '0': renderDevice_no1_1,
    'div1': renderDivGt1
};

export function getDeviceRenderer(no) {
  return MATH_DEVICE_RENDERERS[String(no)] || null;
}
