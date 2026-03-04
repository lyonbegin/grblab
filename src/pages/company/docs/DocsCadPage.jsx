// src/pages/company/docs/DocsCadPage.jsx
import React from "react";
export default function DocsCadPage() {
  return (
    <div>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>공무문서함 · 공달캐드</h3>
      <p style={{ marginTop: 10, color: "#777", fontSize: 12, lineHeight: 1.6 }}>
        UI만 먼저 구현합니다. (도면 업로드 → 뷰어 표시 → 마크업/출력)
      </p>

      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>도면 뷰어</div>
        <div style={{ height: 360, borderRadius: 12, border: "1px dashed #ddd", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontWeight: 900 }}>
          CAD 뷰어 자리(UI)
        </div>
      </div>
    </div>
  );
}