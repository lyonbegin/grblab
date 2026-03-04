// src/api/tbmDetailApi.js
// ✅ TBM 상세 전용 API (localStorage 기반)
// ✅ tbmApi.js의 LS_KEY와 동일 DB를 사용해야 리스트/상세가 1:1로 맞습니다.

const LS_KEY = 'kras_tbm_v1';

function sleep(ms = 120) { return new Promise(r => setTimeout(r, ms)); }
function nowIso() { return new Date().toISOString(); }

function readAll() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return { posts: [] };
  try { return JSON.parse(raw); } catch { return { posts: [] }; }
}

function writeAll(db) {
  localStorage.setItem(LS_KEY, JSON.stringify(db));
}

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

function findById(db, id) {
  const pid = String(id || '').trim();
  if (!pid) return null;
  return (db.posts || []).find(p => String(p.id) === pid) || null;
}

export async function getTbmDetail(postId, options = {}) {
  const { throwIfNotFound = false } = options;
  await sleep();

  const db = readAll();
  const post = findById(db, postId);

  if (!post) {
    if (throwIfNotFound) throw new Error('POST_NOT_FOUND');
    throw new Error('POST_NOT_FOUND');
  }

  const createdAtSafe = toSafeIso(post.createdAt);
  return {
    ...post,
    createdAt: createdAtSafe || post.createdAt,
    createdAtLabel: formatKoreanDateTime(createdAtSafe || post.createdAt),
  };
}

export async function updateTbmDetail(postId, patch = {}) {
  await sleep();
  const db = readAll();
  const post = findById(db, postId);
  if (!post) throw new Error('POST_NOT_FOUND');

  const allow = [
    'siteId', 'siteName',
    'projectId', 'projectName',  // ✅ 공사보드 컨텍스트
    'tbmDate',
    'workFrom', 'workTo',
    'durationMin',
    'workName',
    'body',
    'memo',
    'hasRiskEval',
    'hasNearMiss',
    'confirmRequestText',
    'confirmStatusText',
    'approvalStatus',
    'author',
    'attachments',
    'tags',
  ];

  for (const k of allow) {
    if (k in patch) post[k] = patch[k];
  }

  post.updatedAt = nowIso();
  writeAll(db);
  return await getTbmDetail(postId, { throwIfNotFound: true });
}

export async function deleteTbmDetail(postId) {
  await sleep();
  const db = readAll();
  const before = (db.posts || []).length;
  db.posts = (db.posts || []).filter(p => String(p.id) !== String(postId));
  writeAll(db);
  if ((db.posts || []).length === before) throw new Error('POST_NOT_FOUND');
  return true;
}

// ✅ 확인요청/결재는 실무에서 상태만 바뀌는 경우가 많으므로 헬퍼 제공
export async function requestTbmConfirm(postId) {
  return updateTbmDetail(postId, {
    confirmRequestText: '확인요청',
    confirmStatusText: '확인중',
  });
}

export async function approveTbm(postId) {
  return updateTbmDetail(postId, {
    approvalStatus: '결재중',
  });
}

export async function completeApprovalTbm(postId) {
  return updateTbmDetail(postId, {
    approvalStatus: '결재완료',
  });
}