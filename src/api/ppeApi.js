// src/api/ppeApi.js
const LS_KEY = 'kras_ppe_v1'

function nowIso() { return new Date().toISOString() }

function seedIfEmpty(siteId) {
  const raw = localStorage.getItem(LS_KEY)
  if (raw) return

  const demo = {
    posts: [
      {
        id: 'p1',
        siteId,
        title: '개인보호구 지급대장(헬멧/안전모)-20250915',
        siteName: '2025년 어울림 복지센터 신축공사',
        projectName: '철근콘크리트공사',
        author: '홍익84123',
        createdAt: '2025-09-15T01:39:00.000Z',
        hasAttachment: true,
        confirmStatus: '확인중',
        approvalStatus: '결재중',
        receiverCount: 5,
        signPending: 2,
        chips: ['#서명대기', '#결재중'],
      },
      {
        id: 'p2',
        siteId,
        title: '개인보호구 지급대장(공통)-20250923',
        siteName: '신림초등학교 외 1건(전주…) ',
        projectName: '가설/안전관리',
        author: '안전담당이님',
        createdAt: '2025-09-23T08:10:00.000Z',
        hasAttachment: false,
        confirmStatus: '확인완료',
        approvalStatus: '결재완료',
        receiverCount: 4,
        signPending: 0,
        chips: ['#결재완료'],
      },
    ],
  }

  localStorage.setItem(LS_KEY, JSON.stringify(demo))
}

function readAll(siteId) {
  seedIfEmpty(siteId || 'demo_site')
  return JSON.parse(localStorage.getItem(LS_KEY))
}

function sleep(ms = 140) {
  return new Promise((r) => setTimeout(r, ms))
}

function fmtYMDHM(date) {
  const d = new Date(date)
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yy}/${mm}/${dd} ${hh}:${mi}`
}

export async function listPpePosts({ siteId, q = '', filter = '#전체', page = 1, pageSize = 10 } = {}) {
  await sleep()
  const db = readAll(siteId)

  const filtered = (db.posts || [])
    .filter((p) => !siteId ? true : p.siteId === siteId)
    .filter((p) => {
      if (!q) return true
      const hay = `${p.title} ${p.siteName} ${p.projectName} ${p.author}`.toLowerCase()
      return hay.includes(q.toLowerCase())
    })
    .filter((p) => {
      if (!filter || filter === '#전체') return true
      if (filter === '#서명대기') return (p.signPending || 0) > 0
      if (filter === '#결재중') return p.approvalStatus === '결재중'
      if (filter === '#결재완료') return p.approvalStatus === '결재완료'
      if (filter === '#미결재') return !p.approvalStatus
      return (p.chips || []).includes(filter)
    })
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))

  const total = filtered.length
  const start = (page - 1) * pageSize
  const pageItems = filtered.slice(start, start + pageSize)

  const items = pageItems.map((p, idx) => ({
    id: p.id,
    no: total - (start + idx),
    title: p.title,
    siteName: p.siteName,
    projectName: p.projectName || '',
    hasAttachment: !!p.hasAttachment,
    author: p.author,
    createdAt: p.createdAt,
    createdAtLabel: fmtYMDHM(p.createdAt),
    confirmStatus: p.confirmStatus || '',
    approvalStatus: p.approvalStatus || '',
    receiverCount: p.receiverCount || 0,
    signPending: p.signPending || 0,
    signQr: true,
    shareLink: true,
  }))

  return { items, total }
}