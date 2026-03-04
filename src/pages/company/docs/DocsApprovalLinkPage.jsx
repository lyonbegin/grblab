// src/pages/company/docs/DocsApprovalLinkPage.jsx
import React from "react";
export default function DocsApprovalLinkPage() {
  return (
    <div>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>공무문서함 · 전자결재 연동</h3>
      <p style={{ marginTop: 10, color: "#777", fontSize: 12, lineHeight: 1.6 }}>
        UI만 먼저 구현합니다. (예: 문서 선택 → 결재 문서 생성 → 결재함으로 전송)
      </p>

      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>연동 설정</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input placeholder="전자결재 시스템 키(나중에)" style={{ flex: "1 1 260px", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 10 }} />
          <button style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 900 }}>
            저장(UI)
          </button>
        </div>
      </div>
    </div>
  );
}