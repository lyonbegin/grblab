/**
 * PowerOpsCasesSection.jsx
 * 9개 세부 페이지 실제 내용 100% 반영
 * - 금액 표기 없음 (% 기준)
 * - 실제 이미지 URL (eco-saving.com)
 * - 카드 클릭 → 우측 슬라이드 상세 패널
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CASES = [
  // ── 컴프레셔 ──────────────────────────────────────────
  {
    id: 'c1',
    category: 'compressor',
    categoryLabel: '컴프레셔',
    title: '노후 통합 제어 시스템 교체로 컴프레셔 전력 최대 9.3% 절감',
    metric: '최대 9.3%',
    metricSub: '전력 절감률',
    date: '2023.02',
    img: 'https://eco-saving.com/factory/wp-content/uploads/2023/02/189-コピー-800x440.png',
    summary:
      '이미 멀티 컴프레셔 통합 제어 시스템을 도입한 공장이라도 일반 제어반으로는 구현할 수 없는 제어가 있어 추가 절감의 여지가 남아 있습니다. 기존 시스템을 특수 멀티 컴프레셔 통합 제어 시스템으로 교체한 것만으로 추가 에너지 절감을 실현한 사례입니다.',
    situation:
      '컴프레셔 메이커 기본 제어반은 메이커·기종·용량에 따라 제어 가능한 범위에 제한이 있습니다. 증설을 반복한 결과 여러 메이커의 컴프레셔가 혼재하게 되었고, 일부 기기를 통합 제어하지 못하는 상황이었습니다.',
    solution:
      '국내외 주요 메이커에 대응하는 멀티 컴프레셔 통합 제어 시스템으로 교체. 메이커·기종·용량에 무관하게 일괄 제어가 가능하며, 인버터 회전수를 읽어 더욱 정밀한 최적 운전을 실현합니다. 압력 상·하한을 세밀하게 설정해 마치 사람이 상시 조작하는 듯한 추종성 높은 제어도 구현합니다.',
    result: [
      { label: 'A 사업장 (16대, 인버터기 4대)', value: '9.3% 절감', sub: 'CO₂ 107t 감축' },
      { label: 'B 사업장 (12대, 인버터기 0대)', value: '7.2% 절감', sub: 'CO₂ 148t 감축' },
    ],
    point:
      '기존 통합 제어 시스템이 있어도 「시스템 설치 후 컴프레셔를 추가 증설한 경우」「여러 메이커 기기가 혼재하는 경우」「인버터 탑재기 비율이 30% 미만인 경우」 등은 교체만으로 추가 절감이 기대됩니다.',
  },
  {
    id: 'c2',
    category: 'compressor',
    categoryLabel: '컴프레셔',
    title: '멀티 컴프레셔 통합 제어 시스템 신규 도입으로 최대 33.8% 전력 절감',
    metric: '최대 33.8%',
    metricSub: '전력 절감률',
    date: '2022.12',
    img: 'https://eco-saving.com/factory/wp-content/uploads/2022/12/185-コピー-800x520.png',
    summary:
      '공장 전체 전력 사용량의 20~25%를 차지하는 컴프레셔. 멀티 컴프레셔 통합 제어 시스템을 처음 도입한 4개 사업장에서 모두 약 20% 이상의 전력 절감 효과를 실현한 실적을 수치와 함께 소개합니다.',
    situation:
      '컴프레셔 사용량 절감에 관심은 있지만 어디서부터 시작해야 할지 모르거나, 컴프레셔 증설을 검토 중인 사업장에서 통합 제어 시스템 미도입 상태로 각 기기를 개별 관리하고 있었습니다.',
    solution:
      '메이커·기종·용량이 다른 컴프레셔도 한꺼번에 제어하고, 분산 설치된 원격지 기기도 통합 제어하는 멀티 컴프레셔 통합 제어 시스템을 신규 도입. 인버터 회전수까지 고려한 최적 운전으로 개별 제어 대비 훨씬 큰 절감 효과를 실현합니다.',
    result: [
      { label: 'A 사업장 (12대, 인버터기 3대)', value: '19.2% 절감' },
      { label: 'B 사업장 (10대, 인버터기 3대)', value: '18.5% 절감' },
      { label: 'C 사업장 (8대, 인버터기 2대)', value: '20.4% 절감' },
      { label: 'D 사업장 (6대, 인버터기 1대)', value: '33.8% 절감' },
    ],
    point:
      '통합 제어 시스템을 도입한 적 없는 공장은 최대 약 40%의 절감 효과를 기대할 수 있습니다. 「설비 신설 15년 이상 경과」「이기종 기기 혼재」「3대 이상」「인버터 탑재기 30% 미만」에 해당하면 특히 큰 효과가 예상됩니다.',
  },
  {
    id: 'c3',
    category: 'compressor',
    categoryLabel: '컴프레셔',
    title: '24시간 가동 제조 공장에서 컴프레셔 소비전력 30% 절감',
    metric: '30%',
    metricSub: '소비전력 절감',
    date: '2021.02',
    img: 'https://eco-saving.com/factory/wp-content/uploads/2021/02/IMG_03600001-e1612624837838.jpg',
    summary:
      '24시간 가동하는 제조 공장에서 현황 파악부터 시작해 개선책 제시, 실제 시공까지 진행하여 당초 소비전력의 30% 절감을 실현했습니다. 37kW~70kW급 이기종 컴프레셔 6대를 운용 중이던 현장입니다.',
    situation:
      '컴프레셔 가동 상황이 전혀 가시화되지 않아 지금까지의 운용은 경험치에만 의존해 왔습니다. 주·야 생산량 차이에 따라 에어 사용량도 달라지는데, 실제 사용량조차 파악하지 못한 채 생산 라인 가동 현황과 에어 사용량 수치 취득부터 시작해야 하는 상황이었습니다.',
    solution:
      '① 원격지에서도 일괄 제어 가능한 멀티 컴프레셔 통합 제어 시스템을 설치해 에어 소비량과 생산량을 실시간으로 가시화. 최적값을 명확히 도출.\n② 가시화 과정에서 에어 생산량과 소비량 사이에 명백한 괴리 발견 → 에어 누설 감지 장치로 누설 지점을 특정, 순차 보수 진행.',
    result: [
      { label: '소비전력 절감', value: '30% 달성' },
      { label: '에어 소비량', value: '목표치로 감소' },
      { label: '에어 설정 압력', value: '최적값으로 저감 성공' },
    ],
    point:
      '현황 가시화 없이 진행하는 에너지 절약은 효과를 측정할 수 없습니다. 「계측 → 분석 → 시공」 순서가 30% 절감의 핵심입니다. 에어 누설도 일정 수준은 어쩔 수 없다고 생각했지만, 예상을 훨씬 초과하는 누설이 있었습니다.',
  },
  {
    id: 'c4',
    category: 'compressor',
    categoryLabel: '컴프레셔',
    title: '분산 설치 컴프레셔 네트워크 일괄 제어로 13% 절감',
    metric: '13%',
    metricSub: '에너지 절감률',
    date: '2021.02',
    img: 'https://eco-saving.com/factory/wp-content/uploads/2021/02/iStock-10720737180001.jpg',
    summary:
      '금속 부품 제조 공장에서 분산 설치된 컴프레셔의 사용 상황과 생산 설비가 필요로 하는 에어량·압력을 파악한 뒤 최적 설정을 적용한 결과, 소비전력 13% 절감을 실현했습니다.',
    situation:
      '집중 설치로 시작했지만 장기 운영 중 생산 설비 이전·건물 증축 등으로 인해 여러 구역에 컴프레셔가 분산 배치되었습니다. 그때마다 임기응변식으로 설정 압력을 변경해 온 결과 무엇이 올바른 설정인지 알 수 없는 상태가 되었습니다.',
    solution:
      '① 컴프레셔 소비전력·토출 공기량·압력 조사, 에어 소비량이 큰 설비의 사용 상황도 동시에 확인해 현황 정리.\n② 네트워크로 원격지를 일괄 제어하는 멀티 컴프레셔 통합 제어 시스템을 설치해 컴프레셔 가동 최적화 실시.',
    result: [
      { label: '소비전력 절감', value: '13% 달성' },
      { label: '전 구역 가동 현황', value: '실시간 가시화' },
      { label: '설정 압력', value: '최적값으로 통일' },
    ],
    point:
      '"에어가 부족한 곳 근처에 새 컴프레셔를 설치했던" 경위는 나름 합리적이었습니다. 멀티 컴프레셔 통합 제어 시스템으로 제대로 관리함으로써 분산 배치 상태에서도 절감 효과를 만들어낼 수 있습니다.',
  },
  {
    id: 'c5',
    category: 'compressor',
    categoryLabel: '컴프레셔',
    title: '에어 배관 전자밸브 자동 개폐만으로 4% 전력 절감',
    metric: '4%',
    metricSub: '에너지 절감률',
    date: '2021.02',
    img: 'https://eco-saving.com/factory/wp-content/uploads/2021/02/iStock-1785225340017.jpg',
    summary:
      '공장 내 배관을 통해 에어를 공급하는 수지 성형 제조 공장에서, 에어 배관에 전자밸브를 설치하고 가동 설비에 맞게 자동 개폐하는 절감 방안을 적용한 결과 4%의 에너지 절감을 실현했습니다.',
    situation:
      '당일 생산 계획에 따라 가동 설비가 다름에도 불구하고, 전체 배관이 연결되어 있어 1대만 가동해도 전체 배관 내압을 높여야 했습니다. 또한 여러 곳에서 에어 누설이 발생해 설비가 멈춰 있어도 배관 내압이 떨어지면서 컴프레셔가 계속 작동했습니다.',
    solution:
      '멀티 컴프레셔 통합 제어 시스템을 커스터마이즈해 전자밸브 개폐 전기 신호를 출력하는 사양으로 구성. 당일 생산 계획에 맞춰 시스템에서 개폐할 밸브를 지정함으로써 불필요한 에어 생성과 누설을 제거했습니다.',
    result: [
      { label: '에너지 절감률', value: '4% 달성' },
      { label: '기계 정지 시 배관 내압 저하', value: '크게 개선' },
      { label: '에어 누설량', value: '별도 보수로 추가 감소' },
    ],
    point:
      '「이미 다른 절감 수단을 모두 적용했다」는 공장에서도 유효한 추가 수단입니다. 공사 규모가 작고 투자 회수가 빠른 점도 장점입니다.',
  },

  // ── 공조 ──────────────────────────────────────────
  {
    id: 'c6',
    category: 'hvac',
    categoryLabel: '공조',
    title: '중앙 공조 펌프 유량 제어 최적화로 전력 80% 이상 절감',
    metric: '80%+',
    metricSub: '공조 전력 절감',
    date: '2021.02',
    img: 'https://eco-saving.com/factory/wp-content/uploads/2020/03/iStock-10579189840009.jpg',
    summary:
      '중앙 공조의 단점인 피크 시에 맞춘 용량으로 운용하면 낭비 에너지가 발생합니다. 온도 관리를 통해 펌프 동작을 제어하는 방법으로 연간 80% 이상, 월간 최대 98.3%의 전력 절감을 실현했습니다.',
    situation:
      '정격 운전 중인 펌프와 실내 온도 설정 관리만으로는 전력 절감에 거의 기여하지 못했습니다. 에너지를 낭비하고 있다는 것은 알았지만 대응이 어려웠고, 에너지 절약형 펌프로의 교체는 비용 대비 효과가 맞지 않아 사내 예산 확보가 어려운 상황이었습니다.',
    solution:
      '온도 관리를 통해 펌프 유량을 제어하는 방식을 적용. 실제 소비전력은 유량 제어율의 세제곱에 비례해 감소합니다. 예를 들어 유량을 1/2로 줄이면 송수에 필요한 전력은 1/8이 되어 87.5% 감소합니다. 설정 온도와 압력 설정을 자동으로 최적 운용함으로써 환경을 바꾸지 않고도 대폭적인 전력 절감을 실현합니다.',
    result: [
      { label: '연간 전력 절감률', value: '80% 이상' },
      { label: '월간 최대 절감률', value: '98.3%' },
      { label: '공조·펌프 가동 현황', value: '실시간 가시화' },
      { label: '열원 가스 사용량', value: '함께 감소' },
    ],
    point:
      '펌프 교체 없이 제어 방식만 바꾸는 방식이므로 초기 투자가 적습니다. 실내 온도 환경은 그대로 유지되며, 가동 현황 가시화도 함께 실현됩니다.',
  },
  {
    id: 'c7',
    category: 'hvac',
    categoryLabel: '공조',
    title: '공조 간헐 운전 후부착 디바이스로 온도 유지 + 15% 절감',
    metric: '15%',
    metricSub: '공조 전력 절감',
    date: '2021.02',
    img: 'https://eco-saving.com/factory/wp-content/uploads/2020/03/iStock-6798791480015.jpg',
    summary:
      '10여 년 동안 에너지 절약을 추진해 온 제조 공장에서, 더 이상의 방법이 없어 고민하던 중 기존 공조 설비에 후부착으로 적용 가능한 특수 제어 방식을 도입해 전기 사용량 15% 절감과 가동 현황 가시화를 실현했습니다.',
    situation:
      '이미 10여 년에 걸쳐 에너지 절약을 추진해 설비 갱신도 일통 마친 공장에서 다음 수단을 찾지 못하고 있었습니다. 비용 대비 효과를 생각하면 할 수 있는 것이 적은 상황에서, 수고 없이 절감을 실현할 수 있는 방법이 요구되고 있었습니다.',
    solution:
      '실외기에 후부착으로 설치 가능한 에너지 절약 디바이스를 적용해 특수 제어를 구현. 기존 공조 설비를 교체하지 않고도 간헐 운전에 의한 절감이 가능합니다.',
    result: [
      { label: '공조 단독 전력 절감', value: '15% 달성' },
      { label: '실내 온도', value: '변화 없음' },
      { label: '공조 가동 현황', value: '가시화 실현' },
    ],
    point:
      '공장에서 공조 전기 사용량 비중은 낮지만, ISO14001 등 기업 차원의 지속가능성 목표 달성을 위해 「할 수 있는 것은 해야 한다」는 현장에 유효합니다. 후부착이므로 설비 교체 없이 도입 가능합니다.',
  },

  // ── 조명 ──────────────────────────────────────────
  {
    id: 'c8',
    category: 'lighting',
    categoryLabel: '조명',
    title: '초기비용 0원 LED 전환으로 전력·유지관리비 대폭 절감',
    metric: '초기비용 0원',
    metricSub: 'LED 전환',
    date: '2021.02',
    img: 'https://eco-saving.com/factory/wp-content/uploads/2021/02/2405862_l0001-e1612625186422.jpg',
    summary:
      '조명 LED 전환을 추진하는 보조금이 해마다 줄고 있어 현실적으로 활용이 어려운 상황에서, 「밝기 제공 서비스」 방식을 활용해 초기비용 0원으로 LED 전환에 성공한 사례입니다.',
    situation:
      '투자 회수 기간이 길어 사내 품의 통과가 어렵고, 수은등·형광등 제조 중단 시기가 되어서야 LED로 전환해야 한다는 것을 알면서도 갱신 비용이 고액이라 사내 예산 확보가 필요한 상황이었습니다.',
    solution:
      '「밝기 제공 서비스」 방식 도입. 조명 기기 비용과 공사비는 0원으로 처리하고, 밝기 제공에 대한 서비스료를 납부하는 방식으로 LED 전환을 완료했습니다.',
    result: [
      { label: '초기비용', value: '0원' },
      { label: '조명 트러블 대응', value: '불필요 (무상 처리)' },
      { label: '자산 관리', value: '불필요' },
      { label: '재고 관리·업체 조율', value: '불필요, 관리 공수 대폭 감소' },
    ],
    point:
      '가장 높은 평가를 받은 것은 「조명 기기 관리를 직접 하지 않아도 된다」는 점입니다. 재고 관리, 업체 조율 등 눈에 보이지 않는 수고가 사라진 것이 전력 절감 못지않게 큰 성과였습니다.',
  },
  {
    id: 'c9',
    category: 'lighting',
    categoryLabel: '조명',
    title: '열원 설비 상부 LED 반복 단선 문제 해결, 보수 공수 제로화',
    metric: '단선 제로',
    metricSub: '트러블 해결',
    date: '2021.02',
    img: 'https://eco-saving.com/factory/wp-content/uploads/2021/02/3212845_l0002-e1612625210232.jpg',
    summary:
      'LED 조명은 열에 약하다는 특성이 있어 열원 설비 상부에서는 고열 대응 제품도 반복 단선이 발생했습니다. 세미오더 타입 LED 조명을 설치함으로써 고온 환경에서도 단선 없이 운용하게 된 사례입니다.',
    situation:
      'LED 가격이 안정된 시점에 고온 환경 대응 LED를 설치했지만, 여름철에는 지붕 열과 열원 설비 열이 복합적으로 작용해 반복 단선이 발생했습니다. 설치 장소가 고천장이라 보수 시 비계가 필요해 큰 비용이 발생했습니다.',
    solution:
      '세미오더 타입 LED 조명을 설치. 고온 환경에서도 단선이 발생하지 않도록 설계된 제품으로 교체해, 단선 트러블 자체를 없앴습니다.',
    result: [
      { label: 'LED 단선', value: '발생 없음' },
      { label: '고천장 보수 비계 설치', value: '불필요' },
      { label: '보수 비용·공수', value: '대폭 절감' },
    ],
    point:
      '「어쩔 수 없다」고 체념했던 문제도, 설치 환경에 맞는 제품 선정으로 해결됩니다. 열원 근처의 LED는 카탈로그 스펙만 믿지 말고 실제 환경 온도를 계측한 뒤 제품을 선정하는 것이 핵심입니다.',
  },

  // ── 열환경 ──────────────────────────────────────────
  {
    id: 'c10',
    category: 'heat',
    categoryLabel: '열환경',
    title: '우물물 활용 냉풍 송풍으로 소비전력 억제 + 혹서 대책 실현',
    metric: '저전력',
    metricSub: '혹서 대책',
    date: '2025.06',
    img: 'https://work-kaizen.com/wp-content/uploads/29d3bc99193cb0b837fb8cc53f050ae5.jpg',
    summary:
      '우물물을 활용한 냉풍 장치를 작업장 내에 도입해, 에어컨에 비해 소비전력을 대폭 억제하면서 여름철 혹서 환경을 개선한 사례입니다. 전기 요금 절감과 작업환경 개선을 동시에 달성했습니다.',
    situation:
      '여름철 공장 내부 온도가 상승해 작업자의 열중증 리스크가 높아졌습니다. 기존 에어컨으로는 전력 소비가 과다하고 냉각 효율도 낮아 근본적인 혹서 대책이 필요한 상황이었습니다.',
    solution:
      '우물물을 냉열원으로 활용하는 냉풍 장치를 설치해 작업장 내로 냉각 공기를 직접 공급. 지하수의 연간 안정적인 저온 특성을 이용해 압축기 없이도 냉각 효과를 실현, 소비전력을 크게 억제했습니다.',
    result: [
      { label: '작업장 내 온도', value: '효과적으로 저하' },
      { label: '소비전력', value: '에어컨 대비 대폭 절감' },
      { label: '열중증 리스크', value: '현저히 감소' },
    ],
    point:
      '우물이 있는 사업장에서는 추가 설비 투자 없이 기존 수자원을 활용할 수 있습니다. 전력 비용 절감과 작업환경 개선이라는 두 가지 효과를 동시에 얻을 수 있는 방법입니다.',
  },
  {
    id: 'c11',
    category: 'heat',
    categoryLabel: '열환경',
    title: '유인팬·배기팬 + 우물물 냉풍 장치 조합으로 공장 내 체감온도 개선',
    metric: '체감온도↓',
    metricSub: '혹서 환경 개선',
    date: '2025.06',
    img: 'https://work-kaizen.com/wp-content/uploads/20210726_161715-1024x925.jpg',
    summary:
      '유인팬과 배기팬으로 공장 상부의 열기를 외부로 배출하면서, 우물물을 활용한 냉풍 장치로 신선한 냉기를 공급하는 투트랙 방식으로 작업환경의 체감온도를 크게 낮춘 사례입니다.',
    situation:
      '공장 지붕 아래에 열기가 정체되어 작업자가 상시 고온 환경에 노출되어 있었습니다. 단순 환기만으로는 외부 열기가 유입되어 효과가 제한적이었고, 에어컨 증설은 비용 부담이 컸습니다.',
    solution:
      '유인팬으로 공장 상부의 뜨거운 공기를 효율적으로 외부로 배출하고, 동시에 우물물 냉풍 장치로 냉각된 공기를 작업구역에 직접 공급. 배열 제거와 냉기 공급을 동시에 진행해 최대 효과를 달성했습니다.',
    result: [
      { label: '공장 내 체감온도', value: '현저히 개선' },
      { label: '상부 열기 정체', value: '해소' },
      { label: '작업자 평가', value: '매우 쾌적해졌다는 반응' },
    ],
    point:
      '열기 배출과 냉기 공급을 조합하는 접근법이 핵심입니다. 어느 한쪽만 시행할 때보다 체감 효과가 훨씬 크며, 기존 설비를 최대한 활용해 비용을 억제할 수 있습니다.',
  },
  {
    id: 'c12',
    category: 'heat',
    categoryLabel: '열환경',
    title: '급기팬으로 냉각된 외기를 실내 공급, 작업환경 쾌적화 실현',
    metric: '환경 개선',
    metricSub: '열환경 쾌적화',
    date: '2025.06',
    img: 'https://work-kaizen.com/wp-content/uploads/d0d88f756854adf2d723b88e9d7e6647-1024x768.jpg',
    summary:
      '칠러·열교환기·급기팬을 조합해 냉각된 외기를 실내로 공급하는 방식으로 공장 내 온도를 낮추고 작업환경을 쾌적하게 개선한 사례입니다.',
    situation:
      '여름철 공장 내부 온도가 외기 이상으로 상승해 작업자의 부담이 가중되었습니다. 기존 스팟 에어컨은 국소적인 효과에 그쳐 공장 전체 환경 개선에는 한계가 있었습니다.',
    solution:
      '칠러로 냉각수를 생성하고, 열교환기를 통해 외기를 냉각한 뒤 급기팬으로 실내 전체에 공급하는 시스템을 구축. 균일한 냉기 분배로 공장 전체의 온도 환경을 개선했습니다.',
    result: [
      { label: '실내 온도', value: '목표 수준으로 저하' },
      { label: '작업환경', value: '쾌적하다는 평가' },
      { label: '스팟 에어컨 의존도', value: '크게 감소' },
    ],
    point:
      '칠러+열교환기+급기팬의 조합은 초기 투자가 필요하지만, 장기적으로 에너지 효율이 높고 공장 전체를 균일하게 냉각할 수 있습니다. 기존 스팟 공조로는 해결할 수 없었던 넓은 작업장에 특히 효과적입니다.',
  },
  {
    id: 'c13',
    category: 'heat',
    categoryLabel: '열환경',
    title: '건물 상부로 유입되는 열기를 유인팬으로 효율적으로 배출, 온도 저감 성공',
    metric: '온도 저감',
    metricSub: '열기 배출 최적화',
    date: '2025.06',
    img: 'https://work-kaizen.com/wp-content/uploads/CIMG1726-1024x768.jpg',
    summary:
      '건물 지붕 아래에 정체되는 열기를 유인팬과 프로펠러팬을 조합해 효율적으로 외부로 배출함으로써 공장 내 온도를 낮추는 데 성공한 사례입니다.',
    situation:
      '공장 지붕에서 복사열이 강하게 유입되어 상부에 열기가 쌓이고, 이것이 아래로 내려와 작업구역 전체의 온도를 높이는 악순환이 발생하고 있었습니다.',
    solution:
      '건물 상부에 유인팬과 프로펠러팬을 전략적으로 배치해 지붕 아래에 정체된 열기를 강제적으로 외부로 배출. 기류를 최적화해 열기가 작업구역으로 내려오기 전에 제거하는 구조를 만들었습니다.',
    result: [
      { label: '상부 정체 열기', value: '효율적으로 배출' },
      { label: '작업구역 온도', value: '저하 달성' },
      { label: '작업자 환경', value: '개선 효과 확인' },
    ],
    point:
      '열기는 상부에 쌓이는 특성이 있습니다. 이를 제거하는 것이 근본적인 대책입니다. 팬 배치와 기류 방향 설계가 효과를 좌우하며, 냉방 설비 증설 없이도 상당한 온도 저감을 실현할 수 있습니다.',
  },
  {
    id: 'c14',
    category: 'heat',
    categoryLabel: '열환경',
    title: '국소배기설비 도입 후 외기처리공조기로 유입 외기 온도 조정, 공조 부하 저감',
    metric: '공조 부하↓',
    metricSub: '열환경·에너지 동시 개선',
    date: '2023.08',
    img: 'https://work-kaizen.com/wp-content/uploads/Heat-Case-02.jpg',
    summary:
      '국소배기설비 도입으로 공장 내 공기를 외부로 배출한 결과 동량의 외기가 유입되면서 기존 공조 설비가 과부하 상태가 되었습니다. 외기처리공조기를 추가해 유입 외기를 1차 처리함으로써 공조 부하를 대폭 낮춘 사례입니다.',
    situation:
      '냄새와 열 제거를 위해 국소배기설비를 설치했으나, 배기된 공기량만큼 외기가 공장 내로 자연 유입되어 여름에는 덥고 겨울에는 차가운 외기가 그대로 들어와 공조 설비의 처리 능력이 부족해졌습니다.',
    solution:
      '유입되는 외기를 외기처리공조기로 1차 냉각 또는 가열 처리한 후 공장 내로 공급하는 방식으로 변경. 기존 공조 설비의 부담을 줄이고 실내 온도 환경을 안정적으로 유지할 수 있게 했습니다.',
    result: [
      { label: '기존 공조 설비 부하', value: '대폭 저감' },
      { label: '실내 온도 안정성', value: '사계절 유지' },
      { label: '작업자 환경', value: '연간 쾌적하게 개선' },
    ],
    point:
      '국소배기설비 도입 시 외기 유입 문제는 간과되기 쉽습니다. 배기량과 급기량의 균형을 처음부터 설계에 반영하는 것이 중요하며, 외기처리공조기는 이 문제를 해결하는 효과적인 수단입니다.',
  },
  {
    id: 'c15',
    category: 'heat',
    categoryLabel: '열환경',
    title: '메인 통로에 상시 기류를 형성해 스팟 공조로는 해결 불가했던 열중증 리스크 제거',
    metric: '열중증 리스크↓',
    metricSub: '이동 구간 환경 개선',
    date: '2023.08',
    img: 'https://work-kaizen.com/wp-content/uploads/Heat-Case-01.jpg',
    summary:
      '자동차 조립 공장에서 공정 간 이동 시와 바람이 닿지 않는 작업 구역의 열중증 리스크를 해결하기 위해, 메인 통로와 안전 보행대에 상시 기류를 형성해 작업자가 항상 바람을 느낄 수 있는 환경을 구현한 사례입니다.',
    situation:
      '기존 스팟 공조로는 고정된 작업 위치에만 효과가 있었고, 공정 간 이동 시나 스팟 공조 범위 밖의 작업 구역에서는 열중증 위험이 남아 있었습니다. 이동 경로 전체를 커버하는 공조 방식이 필요했습니다.',
    solution:
      '메인 통로 및 안전 보행대를 따라 급기 덕트와 팬을 설치해 상시 기류가 흐르도록 구성. 작업자가 이동 중에도 지속적으로 기류를 느낄 수 있게 해 체감온도를 효과적으로 낮췄습니다.',
    result: [
      { label: '이동 중 열중증 리스크', value: '현저히 감소' },
      { label: '작업자 체감온도', value: '이동 구간 전반 개선' },
      { label: '현장 평가', value: '매우 긍정적 반응' },
    ],
    point:
      '스팟 공조는 고정 작업 구역에는 효과적이지만 이동 구간은 커버하기 어렵습니다. 통로에 상시 기류를 만드는 접근법은 적은 설비 투자로 넓은 범위의 열환경 개선이 가능합니다.',
  },

  // ── 분진 ──────────────────────────────────────────
  {
    id: 'c16',
    category: 'dust',
    categoryLabel: '분진',
    title: '용접 흄 분진 전체 확산 문제 해결, 제품 불량 클레임 완전 제거',
    metric: '클레임 제로',
    metricSub: '분진 확산 차단',
    date: '2024.05',
    img: 'https://work-kaizen.com/wp-content/uploads/Dust-Case-01-1.png',
    summary:
      '금속 제품 제조 공장에서 연속 용접기로부터 발생하는 흄 연기가 공장 전체에 충만해 완성품에 산화철 분진이 부착되는 불량이 반복되었습니다. 이동 흡인 덕트·집진기 갱신·포위식 개조를 통해 발진 문제를 근본적으로 해결한 사례입니다.',
    situation:
      '교량·철탑 제조 공정의 연속 용접기에서 발생하는 흄 연기가 공장 전체로 확산되어 완성품에 산화철 분진이 부착되는 불량이 발생했습니다. 기존 루프팬만으로는 광범위하게 부유·낙하하는 분진에 대응할 수 없었으며, 작업자 건강 관리 측면에서도 과제가 있었습니다.',
    solution:
      '수봉 덕트 철거, 이동 흡인 덕트 및 후드 신설, 집진기 갱신, 다연장 용접기의 포위식 개조와 용접 포인트별 후드 설치를 실시. 발진원에서 직접 포집하는 구조로 변경해 분진의 공장 내 확산을 원천 차단했습니다.',
    result: [
      { label: '발진에 의한 환경오염', value: '해소' },
      { label: '완성품 분진 부착 클레임', value: '완전 해소' },
      { label: '작업자 위생환경', value: '현저히 향상' },
      { label: '용접 부위 목시 확인', value: '가능하게 되어 품질 향상' },
    ],
    point:
      '분진 문제는 발생원에서 직접 포집하는 것이 가장 효과적입니다. 전체 환기 방식은 분진을 희석할 뿐 제거하지 못합니다. 포위식 후드와 이동식 흡인의 조합이 품질 문제와 작업환경 문제를 동시에 해결했습니다.',
  },
  {
    id: 'c17',
    category: 'dust',
    categoryLabel: '분진',
    title: '강판 플라즈마 절단 분진 대책, 이동식 흡인 후드로 작업환경 1관리구분 달성',
    metric: '1관리구분',
    metricSub: '작업환경 기준 달성',
    date: '2024.05',
    img: 'https://work-kaizen.com/wp-content/uploads/Dust-Case-04.png',
    summary:
      '철구 가공 공장의 플라즈마 절단 작업에서 발생하는 산화철 분진이 작업자 건강과 작업환경에 악영향을 미치고 있었습니다. 고압형 집진기와 이동식 흡인 후드 설치를 통해 작업환경을 법정 기준인 1관리구분으로 개선한 사례입니다.',
    situation:
      '플라즈마 절단 작업 위치가 일정하지 않고 가공물 크기도 다양해 기존 고정식 국소배기장치로는 대응이 어려웠습니다. 작업자는 분진 흡입으로 인한 건강 위험에 지속적으로 노출되어 있었으며, 마스크 착용이 필수였습니다.',
    solution:
      '고압형 집진기와 송풍기를 새로 설치하고, 푸시 에어로 분진을 유도하는 방식과 함께 가공물 크기에 맞게 폭을 조정할 수 있는 이동식 흡인 후드를 도입. 작업 위치가 바뀌어도 항상 효과적인 분진 포집이 가능하게 했습니다.',
    result: [
      { label: '작업환경 측정 결과', value: '1관리구분 달성' },
      { label: '작업자 반응', value: '마스크 불필요, 여름 답답함 해소' },
      { label: '생산성', value: '향상' },
    ],
    point:
      '작업 위치가 유동적인 공정에는 이동식 흡인이 필수입니다. 고압형 집진기와 이동식 후드의 조합은 유연성과 포집 성능을 동시에 확보할 수 있는 효과적인 해결책입니다.',
  },

  // ── 환기·공기질 ──────────────────────────────────────────
  {
    id: 'c18',
    category: 'airquality',
    categoryLabel: '환기·공기질',
    title: '국소배기장치 도입으로 작업성 유지하면서 쾌적한 작업환경 실현',
    metric: '환경 개선',
    metricSub: '작업환경 쾌적화',
    date: '2025.06',
    img: 'https://work-kaizen.com/wp-content/uploads/1-1.png',
    summary:
      '기존 전체 환기 방식으로는 해결되지 않던 국소 오염 문제를 국소배기장치 도입으로 해결한 사례입니다. 작업 방식을 바꾸지 않고도 오염물질을 발생원에서 직접 포집해 작업환경을 크게 개선했습니다.',
    situation:
      '전체 환기만으로는 특정 작업 구역에서 발생하는 오염물질을 충분히 제거할 수 없었습니다. 작업자 주변의 공기질이 기준을 초과하는 경우가 있었고, 작업 방식을 변경하지 않고 환경을 개선하는 방법이 필요했습니다.',
    solution:
      '작업 위치에 맞게 설계된 국소배기장치를 도입해 오염물질을 발생원에서 직접 포집. 작업 흐름을 방해하지 않는 후드 형상과 위치를 검토해 작업성을 그대로 유지하면서 환경 개선을 달성했습니다.',
    result: [
      { label: '작업 구역 공기질', value: '기준 이내로 개선' },
      { label: '작업 방식', value: '변경 없음' },
      { label: '작업자 환경 평가', value: '쾌적해졌다는 반응' },
    ],
    point:
      '국소배기는 오염원 직접 포집이 핵심입니다. 후드 형상과 배치가 효과를 좌우하므로 작업 동선과 오염물질 발생 특성을 충분히 파악한 후 설계하는 것이 중요합니다.',
  },
  {
    id: 'c19',
    category: 'airquality',
    categoryLabel: '환기·공기질',
    title: '푸시풀형 환기장치 + 지붕 배기팬 조합으로 쾌적한 작업환경 구현',
    metric: '환경 기준 달성',
    metricSub: '환기 효율 최적화',
    date: '2025.06',
    img: 'https://work-kaizen.com/wp-content/uploads/RIMG3053-1024x768.jpg',
    summary:
      '푸시풀형 환기장치로 오염 공기를 효율적으로 포집하고, 배기팬을 통해 지붕 위로 배출하는 방식으로 작업 구역 전체의 공기질을 개선한 사례입니다.',
    situation:
      '작업 구역에서 발생하는 오염물질이 주변으로 확산되어 인근 작업자에게까지 영향을 미쳤습니다. 기존 국소배기장치만으로는 포집 범위가 제한적이어서 보다 넓은 범위에 대응할 수 있는 환기 방식이 필요했습니다.',
    solution:
      '한쪽에서 급기(Push)하고 반대쪽에서 흡기(Pull)하는 푸시풀형 환기장치를 설치해 오염물질을 균일하게 포집. 포집된 오염 공기는 지붕 배기팬을 통해 옥상으로 배출해 실내 재확산을 방지했습니다.',
    result: [
      { label: '작업 구역 공기질', value: '현저히 개선' },
      { label: '오염물질 주변 확산', value: '차단' },
      { label: '배기 효율', value: '최적화 달성' },
    ],
    point:
      '푸시풀형 환기는 포집 범위가 넓어 작업 위치가 다소 변동되어도 효과를 유지할 수 있습니다. 급기와 흡기의 균형 설계가 성능을 좌우합니다.',
  },
  {
    id: 'c20',
    category: 'airquality',
    categoryLabel: '환기·공기질',
    title: '기존 기기를 국소배기장치로 개조, 작업성 그대로 환경 개선 달성',
    metric: '환경 개선',
    metricSub: '기존 설비 활용',
    date: '2025.06',
    img: 'https://work-kaizen.com/wp-content/uploads/DSC_04551.jpg',
    summary:
      '새 설비를 도입하지 않고 기존 기기를 국소배기장치로 개조하는 방식으로 초기 비용을 절감하면서 작업환경을 개선한 사례입니다. 작업성도 전혀 손상되지 않았습니다.',
    situation:
      '기존 기기 주변에서 오염물질이 발생하고 있었지만, 작업 방식상 기기를 교체하거나 작업 위치를 변경하기 어려운 상황이었습니다. 새 설비 도입 비용도 부담이 되었습니다.',
    solution:
      '기존 기기에 후드와 덕트를 추가하는 방식으로 국소배기장치로 개조. 기기 본체는 그대로 유지하면서 오염물질만 포집·배출하는 구조를 만들어 최소 비용으로 환경 기준을 충족시켰습니다.',
    result: [
      { label: '기존 기기 교체 여부', value: '불필요' },
      { label: '작업 방식', value: '변경 없음' },
      { label: '작업환경 기준', value: '충족 달성' },
    ],
    point:
      '기존 설비를 활용한 개조는 신규 도입에 비해 비용과 공사 기간을 크게 줄일 수 있습니다. 먼저 기존 기기의 개조 가능성을 검토하는 것이 비용 효율적인 접근입니다.',
  },

  // ── 유해물질 ──────────────────────────────────────────
  {
    id: 'c21',
    category: 'toxic',
    categoryLabel: '유해물질',
    title: '이동식 국소배기장치 도입으로 유기용제 공장 내 확산 차단',
    metric: '확산 차단',
    metricSub: '유해물질 대책',
    date: '2023.08',
    img: 'https://work-kaizen.com/wp-content/uploads/ToxicSubstance-Case-01.png',
    summary:
      '건축 자재 도장 작업에서 유기용제가 공장 내로 확산되는 문제를 이동식 국소배기장치 도입으로 해결한 사례입니다. 작업 위치와 가공물 크기가 다양해도 유연하게 대응할 수 있는 구조를 구현했습니다.',
    situation:
      '컨베이어 위의 작업 위치가 일정하지 않고 가공물 크기도 다양해 고정식 국소배기장치로는 대응이 어려웠습니다. 유기용제 증기가 공장 내로 확산되어 작업자의 건강 리스크와 법적 기준 초과 문제가 있었습니다.',
    solution:
      '가공물 크기에 맞게 폭 조정이 가능하고 컨베이어 위를 자유롭게 이동할 수 있는 국소배기장치를 설계·도입. 어떤 작업 위치에서도 항상 오염원 근처에서 포집할 수 있는 구조를 실현했습니다.',
    result: [
      { label: '유기용제 공장 내 확산', value: '방지 달성' },
      { label: '작업환경 기준', value: '법정 기준 충족' },
      { label: '작업자 건강 리스크', value: '현저히 감소' },
    ],
    point:
      '작업 위치가 유동적인 공정에는 이동식 국소배기가 필수입니다. 가공물 크기에 맞는 후드 폭 조정 기능을 갖추면 다양한 조건에서도 안정적인 포집 성능을 유지할 수 있습니다.',
  },
  {
    id: 'c22',
    category: 'toxic',
    categoryLabel: '유해물질',
    title: '후드 재설계로 작업성 유지 + 유기용제 증기 제어 풍속 법적 기준 충족',
    metric: '법정 기준 달성',
    metricSub: '유해물질 제어',
    date: '2023.08',
    img: 'https://work-kaizen.com/wp-content/uploads/ToxicSubstance-Case-07.png',
    summary:
      '압연·혼련 공정에서 유기용제 증기가 확산되어 작업환경 측정 결과가 3관리구분이었습니다. 기존 작업 방식을 그대로 유지하면서 포위식 후드와 배풍기를 갱신해 법정 제어 풍속을 충족시킨 사례입니다.',
    situation:
      '제2종 유기용제인 톨루엔을 함유한 원재료를 롤로 압연·혼련하는 공정에서 유기용제 증기가 확산되어 작업환경 측정 결과가 3관리구분이었습니다. 작업 방식상 대규모 변경 없이 환경 기준을 충족시킬 방법이 필요했습니다.',
    solution:
      '포위식 후드와 배풍기를 갱신하고, 유기용제 중독 예방 규칙에서 정하는 법정 제어 풍속을 만족하도록 재설계. 기존 작업 방식을 전혀 변경하지 않고 유기용제 증기의 확산을 억제하는 데 성공했습니다.',
    result: [
      { label: '작업환경 측정 결과', value: '3관리구분 → 기준 충족' },
      { label: '법정 제어 풍속', value: '달성' },
      { label: '기존 작업 방식', value: '변경 없음' },
    ],
    point:
      '후드 형상과 배풍기 용량의 최적화만으로도 법정 기준을 충족시킬 수 있는 경우가 많습니다. 작업 방식 변경 없이 환경 기준을 달성하는 것이 현장 수용성을 높이는 핵심입니다.',
  },

  // ── 측정·분석 ──────────────────────────────────────────
  {
    id: 'c23',
    category: 'measurement',
    categoryLabel: '측정·분석',
    title: '3D스캔 활용으로 고소 복잡 배관 현장의 치수 측정 문제 해결',
    metric: '안전·정확',
    metricSub: '시공 전 치수 확인',
    date: '2023.08',
    img: 'https://work-kaizen.com/wp-content/uploads/3Dscan-Case-03.jpg',
    summary:
      '기존 공장 내 복잡하게 얽힌 고소 배관 사이에 새 설비를 설치해야 하는 상황에서, 3D스캔을 활용해 안전하고 정확하게 현장 치수를 취득한 사례입니다. 시공 전 간섭 확인과 관계자 간 정보 공유도 원활해졌습니다.',
    situation:
      '기존 공장 내에 새 설비를 설치할 때 기존 덕트와 배관 사이를 통과하는 시공이 필요했습니다. 고소에 복잡하게 얽힌 기존 설비의 치수를 측정하는 것은 안전 면에서도 위험했고 정확성도 확보하기 어려웠습니다.',
    solution:
      '3D스캔 장비로 현장 전체를 스캔해 정밀한 3D 포인트 클라우드 데이터를 취득. 지상에서 안전하게 고소 구조물의 치수를 확인하고, 3D 모델을 통해 새 설비와의 간섭 여부를 시공 전에 검증했습니다.',
    result: [
      { label: '고소 치수 측정', value: '안전하게 달성' },
      { label: '시공 전 간섭 확인', value: '3D 모델로 사전 검증' },
      { label: '관계자 간 정보 공유', value: '원활하게 진행' },
    ],
    point:
      '3D스캔은 고소·협소·복잡한 환경에서 특히 효과적입니다. 시공 전 디지털 트윈으로 간섭을 확인함으로써 현장 수정 작업을 줄이고 공사 품질과 안전성을 동시에 높일 수 있습니다.',
  },
  {
    id: 'c24',
    category: 'measurement',
    categoryLabel: '측정·분석',
    title: '기류해석으로 시공 전 최적 배기 부스 형상 검증, 재시공 리스크 제거',
    metric: '시공 전 검증',
    metricSub: '기류 시뮬레이션',
    date: '2023.08',
    img: 'https://work-kaizen.com/wp-content/uploads/AirFlow-Case-01.jpg',
    summary:
      '자동차 관련 기업의 자동 용접 로봇 공정에서 배기 부스 형상과 배기구 위치를 최적화하기 위해 기류해석 소프트웨어를 활용. 시공 전에 복수의 부스 형상을 3D 모델로 검증해 가장 효율적인 설계를 결정한 사례입니다.',
    situation:
      '용접 부스의 형상과 배기구 위치에 따라 배기 효율이 크게 달라지지만, 시공 후에 수정하면 비용과 시간이 막대하게 소요됩니다. 시공 전에 최적 설계를 결정할 수 있는 방법이 필요했습니다.',
    solution:
      '기류해석 소프트웨어로 복수의 부스 형상 패턴을 3D 시뮬레이션해 각 설계안의 기류와 배기 효율을 가시화. 관계자 간 설계 의도를 공유하고 합의된 최적 형상을 결정한 후 시공에 착수했습니다.',
    result: [
      { label: '시공 후 수정 리스크', value: '사전 제거' },
      { label: '최적 부스 형상', value: '시공 전 결정' },
      { label: '관계자 간 합의', value: '기류 가시화로 원활하게 진행' },
    ],
    point:
      '「만들어보고 수정」 방식은 비용이 큽니다. 기류해석으로 시공 전에 검증하는 것이 결과적으로 가장 경제적입니다. 관계자 간 인식 공유 도구로도 매우 유효합니다.',
  },

  // ── 품질 ──────────────────────────────────────────
  {
    id: 'c25',
    category: 'quality',
    categoryLabel: '품질',
    title: '도장 로봇 도입으로 막 두께 균일화, 품질 안정화 + 작업자 건강 리스크 동시 해소',
    metric: '품질 안정화',
    metricSub: '불량률 제거',
    date: '2023.08',
    img: 'https://work-kaizen.com/wp-content/uploads/Quolity-Case-01.jpg',
    summary:
      '커터 날 코팅 공정에서 수작업에 의한 막 두께 편차와 품질 불안정 문제를 도장 로봇 도입으로 해결한 사례입니다. 도장 부스·로봇·도료 공급 장치·건조로를 일괄 도입해 품질 안정화와 작업자 건강 리스크 저감을 동시에 달성했습니다.',
    situation:
      '커터 날의 코팅 공정이 수작업에 의존하고 있어 작업자마다 막 두께와 도포 균일성에 편차가 생겼습니다. 품질 불안정으로 인한 불량 발생과 함께, 유기용제를 사용하는 도장 작업에서 작업자의 건강 리스크도 과제였습니다.',
    solution:
      '도장 부스·도장 로봇·도료 공급 장치·배치식 건조로를 일괄 도입해 도장 공정을 자동화. 로봇에 의한 일정한 도포 패턴과 도료 공급량 제어로 막 두께를 균일화하고, 작업자가 도장 환경에 노출되는 시간을 대폭 줄였습니다.',
    result: [
      { label: '막 두께 균일성', value: '현저히 향상' },
      { label: '도장 품질', value: '안정화 달성' },
      { label: '작업자 건강 리스크', value: '대폭 저감' },
      { label: '작업 표준화', value: '완전 실현' },
    ],
    point:
      '도장 로봇 도입은 초기 투자가 필요하지만 품질 안정화와 불량 감소, 작업자 보호라는 복수의 효과를 동시에 얻을 수 있습니다. 수작업 의존도가 높은 도장 공정에서 특히 큰 효과가 기대됩니다.',
  },
]

const CATEGORIES = [
  { key: 'all', label: '전체' },
  { key: 'compressor', label: '컴프레셔' },
  { key: 'hvac', label: '공조' },
  { key: 'lighting', label: '조명' },
  { key: 'heat', label: '열환경' },
  { key: 'dust', label: '분진' },
  { key: 'airquality', label: '환기·공기질' },
  { key: 'toxic', label: '유해물질' },
  { key: 'measurement', label: '측정·분석' },
  { key: 'quality', label: '품질' },
]

const CAT_COLOR = {
  compressor: '#1a1a1a',
  hvac:       '#2563eb',
  lighting:   '#d97706',
  heat:       '#dc2626',
  dust:       '#7c3aed',
  airquality: '#0891b2',
  toxic:      '#be185d',
  measurement:'#065f46',
  quality:    '#92400e',
}

// ── 상세 패널 ──────────────────────────────────────
function DetailPanel({ item, onClose }) {
  const accent = CAT_COLOR[item.category] || '#1a1a1a'
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 1000,
        display: 'flex', justifyContent: 'flex-end',
      }}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 540, height: '100%',
          background: '#fff', overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
          fontFamily: "'Noto Sans KR','Malgun Gothic',sans-serif",
        }}
      >
        {/* 이미지 헤더 */}
        <div style={{ position: 'relative', height: 200, flexShrink: 0, background: '#eee', overflow: 'hidden' }}>
          <img src={item.img} alt={item.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none' }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)',
          }} />
          <button onClick={onClose} style={{
            position: 'absolute', top: 14, right: 14,
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)', border: 'none',
            color: '#fff', fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
          <span style={{
            position: 'absolute', top: 14, left: 14,
            fontSize: 11, fontWeight: 700, color: '#fff',
            background: accent, padding: '3px 10px', borderRadius: 20,
          }}>{item.categoryLabel}</span>
          <div style={{ position: 'absolute', bottom: 16, left: 20, color: '#fff' }}>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1 }}>{item.metric}</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 3 }}>{item.metricSub}</div>
          </div>
        </div>

        {/* 본문 */}
        <div style={{ padding: '24px 24px 52px', flex: 1 }}>
          <p style={{ fontSize: 11, color: '#bbb', marginBottom: 8 }}>{item.date}</p>
          <h2 style={{
            fontSize: 18, fontWeight: 900, color: '#1a1a1a',
            lineHeight: 1.45, letterSpacing: '-0.4px', marginBottom: 16,
          }}>{item.title}</h2>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.85, marginBottom: 28 }}>{item.summary}</p>

          <DSection title="도입 배경 · 과제" accent={accent}>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.85 }}>{item.situation}</p>
          </DSection>

          <DSection title="도입 내용" accent={accent}>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.85, whiteSpace: 'pre-line' }}>{item.solution}</p>
          </DSection>

          <DSection title="도입 효과" accent={accent}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {item.result.map((r, i) => (
                <div key={i} style={{
                  background: '#f8f8f8', borderRadius: 8,
                  padding: '10px 14px', display: 'flex',
                  alignItems: 'flex-start', gap: 10, flexWrap: 'wrap',
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: accent, flexShrink: 0, marginTop: 5,
                  }} />
                  <span style={{ fontSize: 12, color: '#888', flex: '0 0 auto', minWidth: 120 }}>{r.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>{r.value}</span>
                  {r.sub && <span style={{ fontSize: 11, color: '#aaa', width: '100%', paddingLeft: 16 }}>{r.sub}</span>}
                </div>
              ))}
            </div>
          </DSection>

          <div style={{
            marginTop: 24, padding: '14px 16px',
            borderLeft: `3px solid ${accent}`,
            background: '#f8f8f8', borderRadius: '0 8px 8px 0',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: accent, marginBottom: 5, letterSpacing: '0.07em' }}>POINT</div>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.75 }}>{item.point}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function DSection({ title, accent, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: accent,
        letterSpacing: '0.07em', marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ width: 16, height: 2, background: accent, display: 'block' }} />
        {title}
      </div>
      {children}
    </div>
  )
}

// ── 카드 ──────────────────────────────────────────
function CaseCard({ item, onClick }) {
  const accent = CAT_COLOR[item.category] || '#1a1a1a'
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(item)}
      style={{
        background: '#fff', border: '1px solid #ebebeb',
        borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex', flexDirection: 'column', height: '100%',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#f0f0f0', overflow: 'hidden' }}>
        <img src={item.img} alt={item.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.style.display = 'none' }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.58) 0%, transparent 55%)',
        }} />
        <span style={{
          position: 'absolute', top: 10, left: 10,
          fontSize: 10, fontWeight: 700, color: '#fff',
          background: accent, padding: '2px 8px', borderRadius: 20,
        }}>{item.categoryLabel}</span>
        <div style={{ position: 'absolute', bottom: 10, left: 12, color: '#fff' }}>
          <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px' }}>{item.metric}</span>
          <span style={{ fontSize: 10, opacity: 0.8, marginLeft: 5 }}>{item.metricSub}</span>
        </div>
      </div>

      <div style={{ padding: '14px 14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <p style={{
          fontSize: 13, fontWeight: 700, color: '#1a1a1a',
          lineHeight: 1.5, letterSpacing: '-0.2px',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{item.title}</p>
        <p style={{
          fontSize: 11, color: '#999', lineHeight: 1.6,
          display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1,
        }}>{item.summary}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 10, color: '#ccc' }}>{item.date}</span>
          <span style={{ fontSize: 11, color: accent, fontWeight: 700 }}>상세 보기 →</span>
        </div>
      </div>
    </motion.div>
  )
}

// ── 메인 ──────────────────────────────────────────
export default function PowerOpsCasesSection() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedCase, setSelectedCase] = useState(null)

  const filtered = activeCategory === 'all'
    ? CASES
    : CASES.filter(c => c.category === activeCategory)

  return (
    <>
     <section style={{
  padding: '56px 40px 64px',
  fontFamily: "'Noto Sans KR','Malgun Gothic',sans-serif",
}}>
  <div style={{ maxWidth: 1200, margin: '0 auto' }}> 
        {/* 헤더 */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#bbb',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10,
          }}>CASE STUDIES</div>
          <h2 style={{
            fontSize: 28, fontWeight: 900, color: '#1a1a1a',
            letterSpacing: '-0.8px', lineHeight: 1.2, marginBottom: 10,
          }}>에너지 절약 시공 사례</h2>
          <p style={{ fontSize: 14, color: '#888', lineHeight: 1.7, maxWidth: 560 }}>
            압축기·공조·조명 분야의 실제 시공 사례입니다.
            각 카드를 클릭하면 도입 배경, 시공 내용, 절감 효과를 확인하실 수 있습니다.
          </p>
        </div>

    {/* 카테고리 탭 */}
<div style={{
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
  marginBottom: 32,
  borderBottom: '1px solid #f0f0f0',
  scrollbarWidth: 'none', // Firefox
  msOverflowStyle: 'none', // IE
}}>
  <div style={{
    display: 'flex',
    gap: 4,
    width: 'max-content', // 탭이 줄바꿈 없이 한 줄로
    minWidth: '100%',
  }}>
    {CATEGORIES.map(cat => {
      const count = cat.key === 'all' ? CASES.length : CASES.filter(c => c.category === cat.key).length
      const active = activeCategory === cat.key
      return (
        <button key={cat.key} onClick={() => setActiveCategory(cat.key)} style={{
          background: 'none', border: 'none',
          borderBottom: active ? '2px solid #1a1a1a' : '2px solid transparent',
          padding: '8px 14px', marginBottom: -1,
          fontSize: 13, fontWeight: active ? 700 : 500,
          color: active ? '#1a1a1a' : '#aaa',
          cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', gap: 5,
          whiteSpace: 'nowrap', // ← 핵심: 텍스트 줄바꿈 방지
          flexShrink: 0,
        }}>
          {cat.label}
          <span style={{
            fontSize: 10, padding: '1px 5px', borderRadius: 10, fontWeight: 600,
            background: active ? '#1a1a1a' : '#f0f0f0',
            color: active ? '#fff' : '#aaa',
            transition: 'all 0.15s',
          }}>{count}</span>
        </button>
      )
    })}
  </div>
</div>

        {/* 카드 그리드 */}
        <motion.div layout style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20, alignItems: 'start',
        }}>
          <AnimatePresence>
            {filtered.map(item => (
              <motion.div key={item.id} layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}>
                <CaseCard item={item} onClick={setSelectedCase} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        </div> 
      </section>

      {/* 상세 슬라이드 패널 */}
      <AnimatePresence>
        {selectedCase && (
          <DetailPanel item={selectedCase} onClose={() => setSelectedCase(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
