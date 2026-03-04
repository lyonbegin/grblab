// src/pages/company/approval/ApprovalInboxPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiListApprovalsInbox, apiCreateApproval } from "../../../api/mockApi";

const s = {
  h: { fontSize: 16, fontWeight: 900, color: "#111", marginBottom: 10 },
  sub: { fontSize: 12, color: "#777", marginBottom: 14, lineHeight: 1.6 },
  row: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 },
  input: { flex: "1 1 260px", border: "1px solid #ddd", borderRadius: 10, padding: "10px 12px", fontSize: 13, outline: "none" },
  btn: { border: "1px solid #111", background: "#111", color: "#fff", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontWeight: 900, cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse", border: "1px solid #eee", borderRadius: 12, overflow: "hidden" },
  th: { textAlign: "left", fontSize: 12, color: "#777", background: "#fafafa", padding: "10px 10px", borderBottom: "1px solid #eee" },
  td: { fontSize: 13, color: "#222", padding: "10px 10px", borderBottom: "1px solid #f1f1f1" },
  badge: (status) => ({
    display: "inline-flex", fontSize: 11, fontWeight: 900,
    padding: "2px 8px", borderRadius: 999,
    border: "1px solid #e5e5e5",
    color: status === "대기" ? "#111" : "#666",
    background: status === "대기" ? "#f7f7f7" : "#fff",
  }),
};

export default function ApprovalInboxPage() {
  const { projectId } = useParams();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");

  const load = async () => {
    const list = await apiListApprovalsInbox(projectId);
    setItems(list);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const createDummy = async () => {
    if (!title.trim()) return;
    await apiCreateApproval(projectId, { title: title.trim(), requester: "UI 테스트" });
    setTitle("");
    await load();
  };

  return (
    <div>
      <div style={s.h}>전자결재 · 내 결재함</div>
      <div style={s.sub}>
        현재는 <b>UI만</b> 동작합니다. 나중에 API 연동 시 <code>apiListApprovalsInbox</code>, <code>apiCreateApproval</code>를 실제 호출로 교체하시면 됩니다.
      </div>

      <div style={s.row}>
        <input style={s.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="테스트용 결재 문서 제목 입력 (예: 안전점검 결과보고)" />
        <button style={s.btn} onClick={createDummy}>결재 생성(UI)</button>
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
            <tr><td style={s.td} colSpan={5}>대기 문서가 없습니다.</td></tr>
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