// src/api/inspectionApi.js
// ✅ localStorage 기반 목업 API (리스트용)
// ✅ 나중에 여기만 서버 API로 바꾸시면 UI는 그대로 유지됩니다.

const LS_KEY = 'kras_inspection_v1';

function nowIso() { return new Date().toISOString(); }
function uid() { return Math.random().toString(36).slice(2, 10); }

function seedIfEmpty() {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) return;

  const demo = {
    items: [
      {
        id: 'i39',
        siteId: 'site_demo_1',
        siteName: '현장없음',
        title: '안전점검(정기점검)-20250924',
        author: '김상현',
        createdAt: '2025-09-24T04:10:00.000Z',
        hasAttachment: true,
        participants: 5,
        signWaiting: true,          // 서명대기
        confirmStatus: '대기',      // 확인상태
        approvalStatus: '결재중',   // 결재상태
        qrEnabled: true,            // 서명QR
        shareLink: true,            // 공유링크
      },
      {
        id: 'i38',
        siteId: 'site_demo_2',
        siteName: '2/13업데이트',
        title: '안전점검(순회점검)-20250923',
        author: '김상현',
        createdAt: '2025-09-23T01:06:00.000Z',
        hasAttachment: false,
        participants: 0,
        signWaiting: false,
        confirmStatus: '완료',
        approvalStatus: '',
        qrEnabled: true,
        shareLink: true,
      },
      {
        id: 'i37',
        siteId: 'site_demo_2',
        siteName: '2024학년도 대전천…',
        title: '안전점검(순회점검)-20250922',
        author: '확인용4123',
        createdAt: '2025-09-22T04:29:00.000Z',
        hasAttachment: false,
        participants: 3,
        signWaiting: false,
        confirmStatus: '완료',
        approvalStatus: '',
        qrEnabled: true,
        shareLink: true,
      },
    ],
  };

  localStorage.setItem(LS_KEY, JSON.stringify(demo));
}

function readAll() {
  seedIfEmpty();
  return JSON.parse(localStorage.getItem(LS_KEY));
}

function writeAll(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function sleep(ms = 160) {
  return new Promise(r => setTimeout(r, ms));
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

function matchFilter(p, filter) {
  if (!filter || filter === '#전체') return true;
  if (filter === '#확인요청') return p.confirmStatus === '대기';
  if (filter === '#결재중') return p.approvalStatus === '결재중';
  if (filter === '#결재완료') return p.approvalStatus === '결재완료';
  if (filter === '#미결재') return !p.approvalStatus;
  return true;
}

export async function listInspectionPosts({
  siteId, q = '', filter = '#전체', page = 1, pageSize = 10,
} = {}) {
  await sleep();
  const db = readAll();

  const filtered = (db.items || [])
    // ✅ siteId가 있으면 필터, 없으면 전체
    .filter(p => (siteId ? p.siteId === siteId : true))
    .filter(p => {
      if (!q) return true;
      const hay = `${p.title} ${p.siteName} ${p.author}`.toLowerCase();
      return hay.includes(String(q).toLowerCase());
    })
    .filter(p => matchFilter(p, filter))
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const items = pageItems.map((p, idx) => ({
    id: p.id,
    no: total - (start + idx),
    title: p.title,
    siteName: p.siteName || '-',
    hasAttachment: !!p.hasAttachment,
    author: p.author || '-',
    createdAt: p.createdAt,
    createdAtLabel: fmtYMDHM(p.createdAt),
    participants: Number(p.participants || 0),
    signWaiting: !!p.signWaiting,
    confirmStatus: p.confirmStatus || '',
    approvalStatus: p.approvalStatus || '',
    qrEnabled: !!p.qrEnabled,
    shareLink: !!p.shareLink,
  }));

  return { items, total };
}

export async function createInspectionPost(patch = {}) {
  await sleep();
  const db = readAll();
  const post = {
    id: uid(),
    siteId: patch.siteId || '',
    siteName: patch.siteName || '현장명',
    title: patch.title || '안전점검 일지',
    author: patch.author || '개발팀',
    createdAt: nowIso(),
    hasAttachment: !!patch.hasAttachment,
    participants: patch.participants || 0,
    signWaiting: true,
    confirmStatus: '대기',
    approvalStatus: '',
    qrEnabled: true,
    shareLink: true,
  };
  db.items.unshift(post);
  writeAll(db);
  return JSON.parse(JSON.stringify(post));
}

export async function deleteInspectionPost(id) {
  await sleep();
  const db = readAll();
  const before = db.items.length;
  db.items = (db.items || []).filter(x => x.id !== id);
  writeAll(db);
  return { ok: db.items.length !== before };
}