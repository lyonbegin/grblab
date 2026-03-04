// src/api/tbmApi.js
// ✅ localStorage 기반 TBM 목업 API (리스트 화면용)
// ✅ 나중에 서버 API로 교체해도 UI 유지 가능

const LS_KEY = 'kras_tbm_v1';

function nowIso() { return new Date().toISOString(); }
function uid() { return Math.random().toString(36).slice(2, 10); }
function sleep(ms = 200) { return new Promise(r => setTimeout(r, ms)); }

function seedIfEmpty(siteId) {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) return;

  const demo = {
    posts: [
      {
        id: 't11',
        siteId,
        siteName: '죽동2지구 가로수 정비공사',
        tbmDate: '2025-09-24',
        workFrom: '08:00',
        workTo: '17:00',
        durationMin: 10,
        workName: '가로수 정비 및 가지치기 작업 TBM',
        body: `1. 작업내용 및 작업계획 설명
2. 위험성평가 내용 공유
3. 비상시 행동요령
- 비상대피 경로 및 대피/비상연락처 안내
- 작업위치 내 소화시설 위치 주지`,
        memo: `개인보호구 착용상태 확인(안전모/장갑/안전화)
건강상태 확인(혈압 등)
운행/교통 주의사항`,
        hasRiskEval: true,
        hasNearMiss: true,
        confirmRequestText: '확인요청',
        approvalStatus: '결재중',
        author: '계정일님',
        createdAt: '2025-09-24T01:35:00.000Z',
        updatedAt: '2025-09-24T01:35:00.000Z',
      },
      {
        id: 't10',
        siteId,
        siteName: '앱테스트현장',
        tbmDate: '2025-09-23',
        workFrom: '09:00',
        workTo: '18:00',
        durationMin: 5,
        workName: '철골 설치 작업 TBM',
        body: '철골 설치 작업 전 TBM 진행',
        memo: '',
        hasRiskEval: true,
        hasNearMiss: false,
        confirmRequestText: '',
        approvalStatus: '결재완료',
        author: '계정이님',
        createdAt: '2025-09-23T01:10:00.000Z',
        updatedAt: '2025-09-23T01:10:00.000Z',
      },
    ],
  };

  localStorage.setItem(LS_KEY, JSON.stringify(demo));
}

function readAll(siteId) {
  seedIfEmpty(siteId);
  return JSON.parse(localStorage.getItem(LS_KEY) || '{"posts":[]}');
}

function writeAll(db) {
  localStorage.setItem(LS_KEY, JSON.stringify(db));
}

function fmtYMDHM(date) {
  const d = new Date(date);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yy}/${mm}/${dd} ${hh}:${mi}`;
}

export async function listTbmPosts({ siteId, q = '', filter = '#전체', page = 1, pageSize = 10 } = {}) {
  await sleep();
  const db = readAll(siteId);

  const filtered = (db.posts || [])
    .filter(p => p.siteId === siteId)
    .filter(p => {
      if (!q) return true;
      const hay = `${p.workName} ${p.body} ${p.siteName} ${p.author} ${p.tbmDate}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    })
    .filter(p => {
      if (!filter || filter === '#전체') return true;
      if (filter === '#확인요청') return !!p.confirmRequestText;
      if (filter === '#결재중') return p.approvalStatus === '결재중';
      if (filter === '#결재완료') return p.approvalStatus === '결재완료';
      if (filter === '#미결재') return !p.approvalStatus;
      return true;
    })
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const items = pageItems.map((p, idx) => ({
    id: p.id,
    no: total - (start + idx),
    siteName: p.siteName,
    tbmDate: p.tbmDate,
    workTimeLabel: `${p.workFrom || '--:--'} ~ ${p.workTo || '--:--'}`,
    durationMin: p.durationMin || 0,
    workName: p.workName,
    hasRiskEval: !!p.hasRiskEval,
    hasNearMiss: !!p.hasNearMiss,
    confirmRequestText: p.confirmRequestText || '',
    approvalStatus: p.approvalStatus || '',
    author: p.author || '',
    createdAt: p.createdAt,
    createdAtLabel: fmtYMDHM(p.createdAt),
  }));

  return { items, total };
}

// (선택) 추후 상세/생성/수정/삭제 필요 시 확장
export async function createTbmPost({ siteId, siteName, tbmDate, workFrom, workTo, durationMin, workName, body, memo, hasRiskEval, hasNearMiss, confirmRequestText, approvalStatus, author }) {
  await sleep();
  const db = readAll(siteId);
  const post = {
    id: uid(),
    siteId,
    siteName: siteName || '현장명',
    tbmDate: tbmDate || '',
    workFrom: workFrom || '',
    workTo: workTo || '',
    durationMin: Number(durationMin || 0),
    workName: workName || '',
    body: body || '',
    memo: memo || '',
    hasRiskEval: !!hasRiskEval,
    hasNearMiss: !!hasNearMiss,
    confirmRequestText: confirmRequestText || '',
    approvalStatus: approvalStatus || '',
    author: author || '개발팀',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.posts.unshift(post);
  writeAll(db);
  return JSON.parse(JSON.stringify(post));
}