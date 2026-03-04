// src/api/safetyEduApi.js
// ✅ localStorage 기반 목업 API (안전교육 일지)
// ✅ UI는 그대로 두고, 나중에 서버 API로 여기만 교체하시면 됩니다.

const LS_KEY = 'kras_safety_edu_v1'

function nowIso() { return new Date().toISOString() }
function uid() { return Math.random().toString(36).slice(2, 10) }

function sleep(ms = 160) {
  return new Promise(r => setTimeout(r, ms))
}

function fmtYMDHM(dateIso) {
  const d = new Date(dateIso)
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yy}/${mm}/${dd} ${hh}:${mi}`
}

function seedIfEmpty() {
  const raw = localStorage.getItem(LS_KEY)
  if (raw) return

  const demo = {
    logs: [
      {
        id: 'e35',
        siteId: 'site_demo_1',
        siteName: '현장명A',
        // 화면 컬럼들
        title: '안전보건 교육일지(정기교육)-20250930',
        createdAt: '2025-09-30T05:25:00.000Z',
        writer: '팀장A',
        hasAttachment: true,
        attendees: 8,
        confirmRequest: '승인',
        approvalStatus: '결재완료', // 결재중/결재완료/미결재
        // 상세용 필드
        category: '정기교육',
        eduFrom: '2025-09-02T01:00:00.000Z',
        eduTo: '2025-09-02T07:10:00.000Z',
        content:
          `1. 작업 전 안전수칙 안내\n` +
          `2. 개인보호구 착용 교육\n` +
          `3. 추락/낙하 예방 교육\n\n` +
          `※ 교육 후 질의응답 진행`,
        attachments: [
          { id: 'a1', url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=200&q=80', name: '교육사진1' },
        ],
      },
      {
        id: 'e34',
        siteId: 'site_demo_2',
        siteName: '현장명B',
        title: '안전보건 교육일지(특별교육)-20250924',
        createdAt: '2025-09-24T02:06:00.000Z',
        writer: '관리자B',
        hasAttachment: false,
        attendees: 12,
        confirmRequest: '승인',
        approvalStatus: '결재중',
        category: '특별교육',
        eduFrom: '2025-09-01T00:30:00.000Z',
        eduTo: '2025-09-01T02:10:00.000Z',
        content: `- 고소작업 위험\n- 감전 예방\n- 장비 점검 체크`,
        attachments: [],
      },
      {
        id: 'e33',
        siteId: 'site_demo_1',
        siteName: '현장명A',
        title: '안전보건 교육일지(신규교육)-20250919',
        createdAt: '2025-09-19T03:12:00.000Z',
        writer: '팀장A',
        hasAttachment: false,
        attendees: 3,
        confirmRequest: '',
        approvalStatus: '미결재',
        category: '신규교육',
        eduFrom: '2025-09-19T01:00:00.000Z',
        eduTo: '2025-09-19T01:40:00.000Z',
        content: `- 현장 출입 안전수칙\n- PPE 지급 및 착용법`,
        attachments: [],
      },
    ],
  }

  localStorage.setItem(LS_KEY, JSON.stringify(demo))
}

function readAll() {
  seedIfEmpty()
  return JSON.parse(localStorage.getItem(LS_KEY))
}

function writeAll(db) {
  localStorage.setItem(LS_KEY, JSON.stringify(db))
}

/**
 * filter:
 * - '#전체'
 * - '#확인요청'
 * - '#결재중'
 * - '#결재완료'
 * - '#미결재'
 */
export async function listSafetyEduLogs({ siteId = '', q = '', filter = '#전체', page = 1, pageSize = 10 } = {}) {
  await sleep()
  const db = readAll()

  const filtered = db.logs
    .filter(x => !siteId || x.siteId === siteId)
    .filter(x => {
      if (!q) return true
      const hay = `${x.title} ${x.siteName} ${x.writer} ${x.approvalStatus} ${x.category}`.toLowerCase()
      return hay.includes(String(q).toLowerCase())
    })
    .filter(x => {
      if (!filter || filter === '#전체') return true
      if (filter === '#확인요청') return !!x.confirmRequest
      if (filter === '#결재중') return x.approvalStatus === '결재중'
      if (filter === '#결재완료') return x.approvalStatus === '결재완료'
      if (filter === '#미결재') return x.approvalStatus === '미결재'
      return true
    })
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))

  const total = filtered.length
  const start = (page - 1) * pageSize
  const pageItems = filtered.slice(start, start + pageSize)

  const items = pageItems.map((x, idx) => ({
    id: x.id,
    no: total - (start + idx),
    title: x.title,
    siteName: x.siteName,
    hasAttachment: !!x.hasAttachment,
    writer: x.writer,
    createdAt: x.createdAt,
    createdAtLabel: fmtYMDHM(x.createdAt),
    attendees: x.attendees || 0,
    confirmRequest: x.confirmRequest || '',
    approvalStatus: x.approvalStatus || '미결재',
    // 상세로 넘길 수 있도록 보조
    siteId: x.siteId,
  }))

  return { items, total }
}

export async function getSafetyEduLog({ postId }) {
  await sleep()
  const db = readAll()
  const p = db.logs.find(x => x.id === postId)
  if (!p) throw new Error('POST_NOT_FOUND')
  return JSON.parse(JSON.stringify(p))
}

export async function createSafetyEduLog(payload) {
  await sleep()
  const db = readAll()

  const post = {
    id: uid(),
    siteId: payload.siteId || '',
    siteName: payload.siteName || '현장명',
    title: payload.title || '안전보건 교육일지',
    createdAt: nowIso(),
    writer: payload.writer || '작성자',
    hasAttachment: !!payload.hasAttachment,
    attendees: Number(payload.attendees || 0),
    confirmRequest: payload.confirmRequest || '',
    approvalStatus: payload.approvalStatus || '미결재',
    category: payload.category || '정기교육',
    eduFrom: payload.eduFrom || '',
    eduTo: payload.eduTo || '',
    content: payload.content || '',
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
  }

  db.logs.unshift(post)
  writeAll(db)
  return JSON.parse(JSON.stringify(post))
}

export async function updateSafetyEduLog({ postId, patch = {} }) {
  await sleep()
  const db = readAll()
  const idx = db.logs.findIndex(x => x.id === postId)
  if (idx < 0) throw new Error('POST_NOT_FOUND')

  db.logs[idx] = {
    ...db.logs[idx],
    ...patch,
  }
  writeAll(db)
  return JSON.parse(JSON.stringify(db.logs[idx]))
}

export async function deleteSafetyEduLog({ postId }) {
  await sleep()
  const db = readAll()
  const before = db.logs.length
  db.logs = db.logs.filter(x => x.id !== postId)
  writeAll(db)
  return { ok: db.logs.length !== before }
}