// src/pages/company/approval/ApprovalAdminPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiListApprovalsAll } from "../../../api/mockApi";

const s = {
  h: { fontSize: 16, fontWeight: 900, color: "#111", marginBottom: 10 },
  sub: { fontSize: 12, color: "#777", marginBottom: 14, lineHeight: 1.6 },
  table: { width: "100%", borderCollapse: "collapse", border: "1px solid #eee", borderRadius: 12, overflow: "hidden" },
  th: { textAlign: "left", fontSize: 12, color: "#777", background: "#fafafa", padding: "10px 10px", borderBottom: "1px solid #eee" },
  td: { fontSize: 13, color: "#222", padding: "10px 10px", borderBottom: "1px solid #f1f1f1" },
  badge: (status) => ({
    display: "inline-flex", fontSize: 11, fontWeight: 900,
    padding: "2px 8px", borderRadius: 999,
    border: "1px solid #e5e5e5",
    color:
      status === "승인" ? "#0a7" :
      status === "반려" ? "#c00" : "#111",
    background: "#fff",
  }),
};

export default function ApprovalAdminPage() {
  const { projectId } = useParams();
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const list = await apiListApprovalsAll(projectId);
      if (mounted) setItems(list);
    })();
    return () => { mounted = false; };
  }, [projectId]);

  return (
    <div>
      <div style={s.h}>전자결재 · 전체 결재 관리</div>
      <div style={s.sub}>
        관리자 화면 UI입니다. (승인/반려 등 액션 버튼은 다음 단계에서 붙이겠습니다. 지금은 목록 UI만 확정합니다.)
      </div>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>문서ID</th>
            <th style={s.th}>제목</th>
            <th style={s.th}>요청자</th>
            <th style={s.th}>상태</th>
            <th style={s.th}>생성일</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td style={s.td} colSpan={5}>문서가 없습니다.</td></tr>
          ) : items.map(d => (
            <tr key={d.docId}>
              <td style={s.td}>{d.docId}</td>
              <td style={s.td}>{d.title}</td>
              <td style={s.td}>{d.requester}</td>
              <td style={s.td}><span style={s.badge(d.status)}>{d.status}</span></td>
              <td style={s.td}>{d.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}