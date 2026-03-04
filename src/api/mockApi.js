// src/api/mockApi.js

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const DB = {
  projects: [
    { projectId: "P-1001", name: "A동 신축공사", siteName: "서울-1현장", status: "진행", startAt: "2026-02-01", endAt: "2026-08-30" },
    { projectId: "P-1002", name: "물류센터 리모델링", siteName: "인천-2현장", status: "진행", startAt: "2026-01-15", endAt: "2026-06-10" },
    { projectId: "P-1003", name: "B동 보수공사", siteName: "수원-3현장", status: "준공", startAt: "2025-11-01", endAt: "2026-02-20" },
  ],

  approvals: {
    "P-1001": [
      { docId: "A-001", title: "TBM 교육일지 결재", status: "대기", requester: "안전관리자", createdAt: "2026-03-01" },
      { docId: "A-002", title: "안전점검 결과보고", status: "반려", requester: "현장소장", createdAt: "2026-02-26" },
    ],
    "P-1002": [
      { docId: "A-010", title: "PPE 지급대장 승인", status: "승인", requester: "안전관리자", createdAt: "2026-02-18" },
    ],
  },

  docs: {
    "P-1001": [
      { fileId: "F-001", name: "시공계획서.pdf", type: "pdf", updatedAt: "2026-02-28", tags: ["계획"] },
      { fileId: "F-002", name: "작업계획서_양중.hwpx", type: "hwpx", updatedAt: "2026-03-01", tags: ["작업계획"] },
      { fileId: "F-003", name: "현장사진_20260301.zip", type: "zip", updatedAt: "2026-03-01", tags: ["사진"] },
    ],
  },
};

// ─────────────────────────────────────────
// Projects
// ─────────────────────────────────────────
export async function apiListProjects() {
  await sleep(200);
  return DB.projects;
}

export async function apiGetProject(projectId) {
  await sleep(150);
  return DB.projects.find(p => p.projectId === projectId) || null;
}

// ─────────────────────────────────────────
// Approvals
// ─────────────────────────────────────────
export async function apiListApprovalsInbox(projectId) {
  await sleep(250);
  return (DB.approvals[projectId] || []).filter(d => d.status === "대기");
}

export async function apiListApprovalsAll(projectId) {
  await sleep(250);
  return (DB.approvals[projectId] || []);
}

export async function apiCreateApproval(projectId, payload) {
  await sleep(300);
  const row = {
    docId: `A-${Math.floor(Math.random()*900 + 100)}`,
    title: payload.title || "새 결재",
    status: "대기",
    requester: payload.requester || "사용자",
    createdAt: new Date().toISOString().slice(0,10),
  };
  DB.approvals[projectId] = [row, ...(DB.approvals[projectId] || [])];
  return row;
}

// ─────────────────────────────────────────
// Docs
// ─────────────────────────────────────────
export async function apiListDocs(projectId) {
  await sleep(250);
  return DB.docs[projectId] || [];
}

export async function apiUploadDoc(projectId, fileLike) {
  await sleep(400);
  const row = {
    fileId: `F-${Math.floor(Math.random()*900 + 100)}`,
    name: fileLike?.name || "업로드파일",
    type: (fileLike?.name || "").split(".").pop() || "file",
    updatedAt: new Date().toISOString().slice(0,10),
    tags: [],
  };
  DB.docs[projectId] = [row, ...(DB.docs[projectId] || [])];
  return row;
}