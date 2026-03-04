// src/pages/company/ProjectsListPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiListProjects } from "../../api/mockApi";

const s = {
  wrap: { maxWidth: 1000, margin: "0 auto", padding: "28px 16px 60px", fontFamily: "'Noto Sans KR','Malgun Gothic',sans-serif" },
  h1: { fontSize: 22, fontWeight: 900, color: "#111", marginBottom: 8 },
  sub: { fontSize: 13, color: "#777", marginBottom: 16, lineHeight: 1.6 },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 },
  card: { border: "1px solid #eee", borderRadius: 14, padding: 14, background: "#fff", cursor: "pointer" },
  title: { fontSize: 14, fontWeight: 900, color: "#111", marginBottom: 8 },
  meta: { fontSize: 12, color: "#666", display: "flex", flexDirection: "column", gap: 4 },
  badge: { display: "inline-flex", alignSelf: "flex-start", fontSize: 11, border: "1px solid #e5e5e5", padding: "2px 8px", borderRadius: 999, color: "#666", marginTop: 10 },
};

export default function ProjectsListPage() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const list = await apiListProjects();
      if (mounted) setItems(list);
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div style={s.wrap}>
      <div style={s.h1}>회사 · 현장관리 · 공사 리스트</div>
      <div style={s.sub}>
        공사를 선택하시면 <b>공사 대시보드</b>(계약/보드/신고/TBM/위험성평가/일지/체계/전자결재/공무문서함)로 이동합니다.
      </div>

      <div style={s.grid}>
        {items.map(p => (
          <div key={p.projectId} style={s.card} onClick={() => nav(`/company/site/projects/${p.projectId}/dashboard`)}>
            <div style={s.title}>{p.name}</div>
            <div style={s.meta}>
              <span>공사ID: {p.projectId}</span>
              <span>현장: {p.siteName}</span>
              <span>기간: {p.startAt} ~ {p.endAt}</span>
            </div>
            <div style={s.badge}>상태: {p.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}