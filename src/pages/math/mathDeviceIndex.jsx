import { renderDevice_no8 } from './mathDevice_no8';
import { renderDevice_no1, renderLimitApproachLinked } from './mathDevice_no1';
import { renderDevice_no1_1 } from './mathDevice_no1_1';
import { renderDivGt1 } from './mathDevice_div_gt1';

// deviceType(+선택 no) → 렌더러. 새 장치는 여기 한 줄만 추가.
const REGISTRY = [
  { deviceType: 'balance',        no: '8', render: renderDevice_no8,   needsDeviceVisual: true },
  { deviceType: 'limit_approach', no: '1', render: renderDevice_no1,   linkedRender: renderLimitApproachLinked, needsDeviceVisual: true },
  { deviceType: 'limit_approach', no: '0', render: renderDevice_no1_1, needsDeviceVisual: true },
  { deviceType: 'divide_shrink',  no: 'div1', render: renderDivGt1,    needsDeviceVisual: false },
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