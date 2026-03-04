// src/api/inspectionDetailApi.js
// ✅ 안전점검 "디테일 전용" 단독 API (SafetyDetailApi 패턴 동일)

const DETAIL_DB = {
  i39: {
    id: 'i39',
    boardType: '안전점검 일지',
    title: '안전점검(정기점검)-20250924',
    siteId: 'site_demo_1',
    siteName: '현장없음',
    author: '김상현',
    createdAt: '2025-09-24T04:10:00',
    checkType: '정기점검',
    checkAtFrom: '2025-09-24T00:00:00',
    checkAtTo: '2025-09-24T01:00:00',
    confirmStatusText: '대기',
    approvalStatus: '결재중',
    body: `■ 일반 점검사항
1. 복장 및 안전화 착용 준수 여부
2. 위험구역 안전시설 상태는 양호한가?
3. 작업통로 및 보행자 동선 확보는 어떠한가?

■ 소화기/비상설비
- 소화기 비치/유효기간 점검
- 비상구 표시/차단 여부 점검

■ 기타
- 지적사항 즉시 시정 및 사진 첨부`,
    participants: [
      { no: 1, name: '이순신', sign: '이순신' },
      { no: 3, name: '강해', sign: '강해' },
      { no: 5, name: '유관순', sign: '유관순' },
      { no: 7, name: '홍길동', sign: '홍길동' },
    ],
    attachments: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80', name: '점검사진1' },
    ],
  },
};

function sleep(ms = 120) { return new Promise(r => setTimeout(r, ms)); }

function toSafeIso(dateStr) {
  const s = String(dateStr || '').trim();
  if (!s) return '';
  if (/[zZ]$/.test(s) || /[+\-]\d{2}:\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(s)) return s + 'Z';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s + 'T00:00:00Z';
  return s;
}

function formatKoreanDateTime(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr || '');
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit',
  });
}

function resolveKey(postId) {
  const raw = String(postId || '').trim();
  if (!raw) return '';
  if (DETAIL_DB[raw]) return raw;
  return '';
}

function firstKey() {
  const keys = Object.keys(DETAIL_DB);
  return keys.length ? keys[0] : '';
}

// ── 조회 ──
export async function getInspectionDetail(postId, options = {}) {
  const { fallback = true, throwIfNotFound = false } = options;
  await sleep();

  const key = resolveKey(postId);
  let data = key ? DETAIL_DB[key] : null;

  if (!data) {
    if (throwIfNotFound || !fallback) throw new Error('POST_NOT_FOUND');
    const fk = firstKey();
    data = fk ? DETAIL_DB[fk] : null;
    if (!data) throw new Error('POST_NOT_FOUND');
  }

  const createdAtSafe = toSafeIso(data.createdAt);
  const fromSafe = toSafeIso(data.checkAtFrom);
  const toSafe = toSafeIso(data.checkAtTo);

  return {
    ...data,
    createdAt: createdAtSafe || data.createdAt,
    createdAtLabel: formatKoreanDateTime(createdAtSafe || data.createdAt),
    checkRangeLabel: `${formatKoreanDateTime(fromSafe || data.checkAtFrom)} ~ ${formatKoreanDateTime(toSafe || data.checkAtTo)}`,
  };
}

// ── 수정 ──
export async function updateInspectionDetail(postId, patch = {}) {
  await sleep();

  const key = resolveKey(postId) || firstKey();
  const post = key ? DETAIL_DB[key] : null;
  if (!post) throw new Error('POST_NOT_FOUND');

  const allow = [
    'title', 'body', 'siteName', 'checkType',
    'checkAtFrom', 'checkAtTo',
    'confirmStatusText', 'approvalStatus',
  ];
  allow.forEach((f) => { if (f in patch) post[f] = patch[f]; });

  const createdAtSafe = toSafeIso(post.createdAt);
  const fromSafe = toSafeIso(post.checkAtFrom);
  const toSafe = toSafeIso(post.checkAtTo);

  return {
    ...post,
    createdAt: createdAtSafe || post.createdAt,
    createdAtLabel: formatKoreanDateTime(createdAtSafe || post.createdAt),
    checkRangeLabel: `${formatKoreanDateTime(fromSafe || post.checkAtFrom)} ~ ${formatKoreanDateTime(toSafe || post.checkAtTo)}`,
  };
}

// ── 삭제 ──
export async function deleteInspectionDetail(postId) {
  await sleep();
  const key = resolveKey(postId);
  if (!key) throw new Error('POST_NOT_FOUND');
  delete DETAIL_DB[key];
  return true;
}