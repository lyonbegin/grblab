// src/api/emergencyDetailApi.js
import { getEmergencyReport, updateEmergencyReport, deleteEmergencyReport } from './emergencyApi';

function toSafeIso(s) {
  const v = String(s || '').trim();
  if (!v) return '';
  if (/[zZ]$/.test(v) || /[+\-]\d{2}:\d{2}$/.test(v)) return v;
  if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return v + 'Z';
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v + 'T00:00:00Z';
  return v;
}

function fmtKST(dateIso) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return String(dateIso || '');
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit',
  });
}

export async function getEmergencyDetail(postId) {
  const p = await getEmergencyReport({ postId });

  const createdAtSafe = toSafeIso(p.createdAt);
  const fromSafe = toSafeIso(p.drillFrom);
  const toSafe = toSafeIso(p.drillTo);

  return {
    ...p,
    createdAt: createdAtSafe || p.createdAt,
    createdAtLabel: fmtKST(createdAtSafe || p.createdAt),
    drillRangeLabel: (fromSafe && toSafe)
      ? `${fmtKST(fromSafe)} ~ ${fmtKST(toSafe)}`
      : '-',
    drillFrom: fromSafe || p.drillFrom,
    drillTo: toSafe || p.drillTo,
  };
}

export async function updateEmergencyDetail(postId, patch = {}) {
  await updateEmergencyReport({ postId, patch });
  return getEmergencyDetail(postId);
}

export async function deleteEmergencyDetail(postId) {
  const r = await deleteEmergencyReport({ postId });
  if (!r.ok) throw new Error('DELETE_FAILED');
  return true;
}