// src/pages/company/docs/DocsFormAutoPage.jsx
import React from "react";
export default function DocsFormAutoPage() {
  return (
    <div>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>공무문서함 · 서식자동생성</h3>
      <p style={{ marginTop: 10, color: "#777", fontSize: 12, lineHeight: 1.6 }}>
        UI만 먼저 구현합니다. (템플릿 선택 → 값 입력 → PDF/문서 생성)
      </p>

      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>서식 선택</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {["TBM 교육일지", "안전점검 일지", "PPE 지급대장", "비상훈련 보고서"].map((t) => (
            <button key={t} style={{ padding: 12, borderRadius: 12, border: "1px solid #eee", background: "#fff", textAlign: "left", cursor: "pointer" }}>
              <div style={{ fontWeight: 900 }}>{t}</div>
              <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>선택 후 입력폼 표시(UI)</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}