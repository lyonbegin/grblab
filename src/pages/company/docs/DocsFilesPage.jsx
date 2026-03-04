// src/pages/company/docs/DocsFilesPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { apiListDocs, apiUploadDoc } from "../../../api/mockApi";

const s = {
  h: { fontSize: 16, fontWeight: 900, color: "#111", marginBottom: 10 },
  sub: { fontSize: 12, color: "#777", marginBottom: 14, lineHeight: 1.6 },
  row: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 },
  btn: { border: "1px solid #111", background: "#111", color: "#fff", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontWeight: 900, cursor: "pointer" },
  btnLite: { border: "1px solid #ddd", background: "#fff", color: "#111", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontWeight: 900, cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse", border: "1px solid #eee", borderRadius: 12, overflow: "hidden" },
  th: { textAlign: "left", fontSize: 12, color: "#777", background: "#fafafa", padding: "10px 10px", borderBottom: "1px solid #eee" },
  td: { fontSize: 13, color: "#222", padding: "10px 10px", borderBottom: "1px solid #f1f1f1" },
  tag: { display: "inline-flex", fontSize: 11, border: "1px solid #e5e5e5", padding: "2px 8px", borderRadius: 999, color: "#666", marginRight: 6 },
};

export default function DocsFilesPage() {
  const { projectId } = useParams();
  const inputRef = useRef(null);
  const [items, setItems] = useState([]);

  const load = async () => {
    const list = await apiListDocs(projectId);
    setItems(list);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const upload = async (file) => {
    if (!file) return;
    await apiUploadDoc(projectId, file);
    await load();
  };

  return (
    <div>
      <div style={s.h}>공무문서함 · 파일관리</div>
      <div style={s.sub}>
        현재는 UI만 구현되어 있으며, 업로드는 <b>mockApi 메모리</b>에 저장됩니다.
      </div>

      <div style={s.row}>
        <button style={s.btn} onClick={() => inputRef.current?.click()}>파일 업로드(UI)</button>
        <button style={s.btnLite} onClick={load}>새로고침</button>
        <input
          ref={inputRef}
          type="file"
          style={{ display: "none" }}
          onChange={(e) => upload(e.target.files?.[0])}
        />
      </div>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>파일ID</th>
            <th style={s.th}>파일명</th>
            <th style={s.th}>유형</th>
            <th style={s.th}>태그</th>
            <th style={s.th}>수정일</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td style={s.td} colSpan={5}>등록된 파일이 없습니다.</td></tr>
          ) : items.map(f => (
            <tr key={f.fileId}>
              <td style={s.td}>{f.fileId}</td>
              <td style={s.td}>{f.name}</td>
              <td style={s.td}>{f.type}</td>
              <td style={s.td}>
                {(f.tags || []).length === 0 ? "-" : f.tags.map((t, i) => <span key={i} style={s.tag}>{t}</span>)}
              </td>
              <td style={s.td}>{f.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}