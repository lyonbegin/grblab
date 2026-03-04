// src/api/emergencyApi.js
// ✅ localStorage 기반 목업 API (비상훈련 보고서)

const LS_KEY = 'kras_emergency_v1';

function nowIso() { return new Date().toISOString(); }
function uid() { return Math.random().toString(36).slice(2, 10); }

function sleep(ms = 160) {
  return new Promise(r => setTimeout(r, ms));
}

function fmtYMDHM(dateIso) {
  const d = new Date(dateIso);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yy}/${mm}/${dd} ${hh}:${mi}`;
}

function seedIfEmpty() {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) return;

  const demo = {
    reports: [
      {
        id: 'em7',
        siteId: 'site_demo_1',
        siteName: '2025년 여름철 복지센터 신축공사',
        title: '비상훈련 보고서(안전사고)-20250915',
        createdAt: '2025-10-23T04:13:00.000Z',
        writer: '계정일',
        hasAttachment: true,

        // ✅ 보고서 핵심(상세 이미지 기준)
        reportType: '안전사고',             // 훈련유형
        drillFrom: '2025-09-15T00:00:00.000Z', // 훈련일시 시작(예: 09:00)
        drillTo:   '2025-09-15T01:00:00.000Z', // 훈련일시 종료(예: 10:00)
        drillPlace: '현장사무실',            // 훈련장소
        instructor: '김안전',                // 훈련강사명
        remarks: '비고',

        // 훈련내용(텍스트)
        content:
`<화재시 대피 비상훈련>
■ 주요내용
- 화재진고 및 경보발령
- 소화기 사용법 및 초기 화재진압 훈련
- 비상구 및 비상유도등 확인
- 긴급차량 진입로 확보 및 환자 이송훈련

■ 교육/점검
- 소방시설 점검(소화기, 옥내소화전 등)
- 대피동선 확인 및 집결지 운영`,

        // 참석자 명단
        participants: [
          { no: 1, name: '홍길동', sign: '서명' },
          { no: 2, name: '유관순', sign: '서명' },
          { no: 3, name: '이순신', sign: '서명' },
        ],

        // 사진첨부(상세 이미지처럼 “사진첨부” 영역)
        photos: [
          { id: 'p1', url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=900&q=80', name: '훈련사진1' },
          { id: 'p2', url: 'https://images.unsplash.com/photo-1520975958225-1f158a21d45b?w=900&q=80', name: '훈련사진2' },
        ],

        // 상태/결재
        confirmStatus: '확인요청',  // 예: 확인요청/확인완료/-
        approvalStatus: '결재중',  // 미결재/결재중/결재완료
      },
    ],
  };

  localStorage.setItem(LS_KEY, JSON.stringify(demo));
}

function readAll() {
  seedIfEmpty();
  return JSON.parse(localStorage.getItem(LS_KEY));
}

function writeAll(db) {
  localStorage.setItem(LS_KEY, JSON.stringify(db));
}

// filter:
// #전체 #확인요청 #결재중 #결재완료 #미결재
export async function listEmergencyReports({ siteId = '', q = '', filter = '#전체', page = 1, pageSize = 10 } = {}) {
  await sleep();
  const db = readAll();

  const filtered = db.reports
    .filter(x => !siteId || x.siteId === siteId)
    .filter(x => {
      if (!q) return true;
      const hay = `${x.title} ${x.siteName} ${x.writer} ${x.reportType}`.toLowerCase();
      return hay.includes(String(q).toLowerCase());
    })
    .filter(x => {
      if (!filter || filter === '#전체') return true;
      if (filter === '#확인요청') return String(x.confirmStatus || '').includes('요청');
      if (filter === '#결재중') return x.approvalStatus === '결재중';
      if (filter === '#결재완료') return x.approvalStatus === '결재완료';
      if (filter === '#미결재') return x.approvalStatus === '미결재';
      return true;
    })
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const items = pageItems.map((x, idx) => ({
    id: x.id,
    no: total - (start + idx),
    title: x.title,
    siteName: x.siteName,
    hasAttachment: !!x.hasAttachment || (x.photos || []).length > 0,
    writer: x.writer,
    createdAtLabel: fmtYMDHM(x.createdAt),
    drillDateLabel: x.drillFrom ? x.drillFrom.slice(0, 10).replaceAll('-', '.') : '',
    participantsCount: Array.isArray(x.participants) ? x.participants.length : 0,
    confirmStatus: x.confirmStatus || '',
    approvalStatus: x.approvalStatus || '미결재',
  }));

  return { items, total };
}

export async function getEmergencyReport({ postId }) {
  await sleep();
  const db = readAll();
  const p = db.reports.find(x => x.id === postId);
  if (!p) throw new Error('POST_NOT_FOUND');
  return JSON.parse(JSON.stringify(p));
}

export async function createEmergencyReport(payload = {}) {
  await sleep();
  const db = readAll();

  const post = {
    id: uid(),
    siteId: payload.siteId || 'site_demo_1',
    siteName: payload.siteName || '현장명',
    title: payload.title || `비상훈련 보고서-${new Date().toISOString().slice(0,10).replaceAll('-','')}`,
    createdAt: nowIso(),
    writer: payload.writer || '작성자',
    hasAttachment: false,

    reportType: payload.reportType || '안전사고',
    drillFrom: payload.drillFrom || '',
    drillTo: payload.drillTo || '',
    drillPlace: payload.drillPlace || '',
    instructor: payload.instructor || '',
    remarks: payload.remarks || '',

    content: payload.content || '',
    participants: Array.isArray(payload.participants) ? payload.participants : [],
    photos: Array.isArray(payload.photos) ? payload.photos : [],

    confirmStatus: payload.confirmStatus || '',
    approvalStatus: payload.approvalStatus || '미결재',
  };

  db.reports.unshift(post);
  writeAll(db);
  return JSON.parse(JSON.stringify(post));
}

export async function updateEmergencyReport({ postId, patch = {} }) {
  await sleep();
  const db = readAll();
  const idx = db.reports.findIndex(x => x.id === postId);
  if (idx < 0) throw new Error('POST_NOT_FOUND');

  db.reports[idx] = { ...db.reports[idx], ...patch };
  db.reports[idx].hasAttachment = !!db.reports[idx].hasAttachment || (db.reports[idx].photos || []).length > 0;

  writeAll(db);
  return JSON.parse(JSON.stringify(db.reports[idx]));
}

export async function deleteEmergencyReport({ postId }) {
  await sleep();
  const db = readAll();
  const before = db.reports.length;
  db.reports = db.reports.filter(x => x.id !== postId);
  writeAll(db);
  return { ok: db.reports.length !== before };
}