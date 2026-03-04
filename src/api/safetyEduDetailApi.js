// src/api/safetyEduDetailApi.js
// ✅ 디테일 전용 API 래퍼 (패턴 맞추기 위해 분리)

import { getSafetyEduLog, updateSafetyEduLog, deleteSafetyEduLog } from './safetyEduApi'

function toSafeIso(s) {
  const v = String(s || '').trim()
  if (!v) return ''
  if (/[zZ]$/.test(v) || /[+\-]\d{2}:\d{2}$/.test(v)) return v
  if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return v + 'Z'
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v + 'T00:00:00Z'
  return v
}

function fmtKST(dateIso) {
  const d = new Date(dateIso)
  if (Number.isNaN(d.getTime())) return String(dateIso || '')
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit',
  })
}

export async function getEduDetail(postId) {
  const p = await getSafetyEduLog({ postId })
  const createdAtSafe = toSafeIso(p.createdAt)

  const eduFromSafe = toSafeIso(p.eduFrom)
  const eduToSafe = toSafeIso(p.eduTo)

  return {
    ...p,
    createdAt: createdAtSafe || p.createdAt,
    createdAtLabel: fmtKST(createdAtSafe || p.createdAt),
    eduRangeLabel: (eduFromSafe && eduToSafe) ? `${fmtKST(eduFromSafe)} ~ ${fmtKST(eduToSafe)}` : '-',
    eduFrom: eduFromSafe || p.eduFrom,
    eduTo: eduToSafe || p.eduTo,
  }
}

export async function updateEduDetail(postId, patch = {}) {
  const updated = await updateSafetyEduLog({ postId, patch })
  return getEduDetail(updated.id)
}

export async function deleteEduDetail(postId) {
  const r = await deleteSafetyEduLog({ postId })
  if (!r.ok) throw new Error('DELETE_FAILED')
  return true
}