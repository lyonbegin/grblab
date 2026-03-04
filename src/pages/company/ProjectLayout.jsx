// ProjectLayout.jsx
// 공사 대시보드 레이아웃 (좌: 서브메뉴 / 우: 콘텐츠)
// - 선생님이 주신 트리(계약정보/공사보드/안전신고/TBM/위험성평가/안전일지/안전보건관리체계/전자결재/공무문서함) 그대로 반영
// - API 연동 전 UI 전용 더미 경로 포함
//
// 사용 예:
// <Route path="/site/:siteId/project/:projectId/*" element={<ProjectLayout />}>
//   <Route index element={<ContractInfoPage />} />
//   <Route path="contract" element={<ContractInfoPage />} />
//   <Route path="board" element={<BoardListPage />} />
//   <Route path="board/:postId" element={<BoardDetailPage />} />
//   <Route path="reports" element={<SafetyReportListPage />} />
//   <Route path="reports/:reportId" element={<SafetyReportDetailPage />} />
//   <Route path="tbm/new" element={<TbmWritePage />} />
//   <Route path="tbm/attendees" element={<TbmAttendeesPage />} />
//   <Route path="tbm/:tbmId/pdf" element={<TbmPdfPage />} />
//   <Route path="risk/trade-task" element={<RiskTradeTaskPage />} />
//   <Route path="risk/hazard-db" element={<RiskHazardDbPage />} />
//   <Route path="risk/sheet/:sheetId" element={<RiskSheetPage />} />
//   <Route path="safety-log/edu" element={<SafetyEduListPage />} />
//   <Route path="safety-log/edu/:eduId" element={<SafetyEduDetailPage />} />
//   <Route path="safety-log/edu/:eduId/pdf" element={<SafetyEduPdfPage />} />
//   <Route path="safety-log/drill/:drillId/pdf" element={<EmergencyDrillPdfPage />} />
//   <Route path="safety-log/inspect/:inspectId/pdf" element={<SafetyInspectPdfPage />} />
//   <Route path="safety-log/ppe/:ppeId/pdf" element={<PpeLedgerPdfPage />} />
//   <Route path="oshms/register" element={<OshmsRegisterPage />} />
//   <Route path="oshms/periodic-check" element={<OshmsPeriodicCheckPage />} />
//   <Route path="oshms/report" element={<OshmsReportPage />} />
//   <Route path="approval/inbox" element={<ApprovalInboxPage />} />
//   <Route path="approval/admin" element={<ApprovalAdminPage />} />
//   <Route path="docs/files" element={<DocsFilesPage />} />
//   <Route path="docs/approval-link" element={<DocsApprovalLinkPage />} />
//   <Route path="docs/photo-sheet" element={<DocsPhotoSheetPage />} />
//   <Route path="docs/form-auto" element={<DocsFormAutoPage />} />
//   <Route path="docs/cad" element={<DocsCadPage />} />
// </Route>

import React from "react";
import { NavLink, Outlet, useParams, useLocation, useNavigate } from "react-router-dom";

export default function ProjectLayout() {
  const { siteId, projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // 상단 Breadcrumb/타이틀 UI용 (API 연동 전)
  const title = `공사 대시보드`;
  const subtitle = `현장: ${siteId || "-"} · 공사: ${projectId || "-"}`;

  // “선택 강조”는 NavLink의 isActive만 사용 (단순/안전)
  const S = styles;

  return (
    <div style={S.page}>
      {/* 상단 헤더 */}
      <header style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.headerTitleRow}>
            <div style={S.headerTitle}>{title}</div>
            <div style={S.badge}>UI</div>
          </div>
          <div style={S.headerSub}>{subtitle}</div>
        </div>

        <div style={S.headerRight}>
          <button
            style={S.headerBtn}
            onClick={() => navigate(-1)}
            title="뒤로"
          >
            ← 뒤로
          </button>
          <button
            style={S.headerBtn}
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
            title="링크 복사"
          >
            링크 복사
          </button>
        </div>
      </header>

      {/* 본문: 좌측 네비 + 우측 콘텐츠 */}
      <div style={S.body}>
        <aside style={S.aside}>
          <div style={S.asideTop}>
            <div style={S.asideTopTitle}>메뉴</div>
            <div style={S.asideTopPath} title={location.pathname}>
              {location.pathname}
            </div>
          </div>

          {/* ── 서브메뉴: 선생님 트리 그대로 ── */}
          <nav style={S.nav}>
            {/* 계약정보 */}
            <NavLink to="contract" style={({ isActive }) => S.navItem({ isActive })}>
              계약정보
            </NavLink>

            <div style={S.navDivider} />

            {/* 공사보드 */}
            <NavLink to="board" style={({ isActive }) => S.navItem({ isActive })}>
              공사보드
            </NavLink>
            <NavLink to="board" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 리스트
            </NavLink>
            <NavLink to="board/1" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 상세
            </NavLink>
            <NavLink to="board/1" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 댓글
            </NavLink>

            <div style={S.navDivider} />

            {/* 안전신고 */}
            <NavLink to="reports" style={({ isActive }) => S.navItem({ isActive })}>
              안전신고
            </NavLink>
            <NavLink to="reports" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 리스트
            </NavLink>
            <NavLink to="reports/1" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 상세
            </NavLink>

            <div style={S.navDivider} />

            {/* TBM */}
            <NavLink to="tbm/new" style={({ isActive }) => S.navItem({ isActive })}>
              TBM
            </NavLink>
            <NavLink to="tbm/new" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 작성
            </NavLink>
            <NavLink to="tbm/attendees" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 참여자 등록
            </NavLink>
            <NavLink to="tbm/1/pdf" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 교육일지 PDF
            </NavLink>

            <div style={S.navDivider} />

            {/* 위험성평가 */}
            <NavLink to="risk/trade-task" style={({ isActive }) => S.navItem({ isActive })}>
              위험성평가
            </NavLink>
            <NavLink to="risk/trade-task" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 공종/작업 선택
            </NavLink>
            <NavLink to="risk/hazard-db" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 위험요인 DB 모달
            </NavLink>
            <NavLink to="risk/sheet/1" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 평가표 작성
            </NavLink>

            <div style={S.navDivider} />

            {/* 안전일지 */}
            <NavLink to="safety-log/edu" style={({ isActive }) => S.navItem({ isActive })}>
              안전일지
            </NavLink>

            <div style={S.navSection}>안전교육</div>
            <NavLink to="safety-log/edu" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 리스트
            </NavLink>
            <NavLink to="safety-log/edu/1" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 상세
            </NavLink>
            <NavLink to="safety-log/edu/1/pdf" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 교육일지 PDF
            </NavLink>

            <div style={S.navSection}>비상훈련</div>
            <NavLink to="safety-log/drill/1/pdf" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 보고서 PDF
            </NavLink>

            <div style={S.navSection}>안전점검</div>
            <NavLink to="safety-log/inspect/1/pdf" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 점검일지 PDF
            </NavLink>

            <div style={S.navSection}>개인보호구</div>
            <NavLink to="safety-log/ppe/1/pdf" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 지급대장 PDF
            </NavLink>

            <div style={S.navDivider} />

            {/* 안전보건관리체계 */}
            <NavLink to="oshms/register" style={({ isActive }) => S.navItem({ isActive })}>
              안전보건관리체계
            </NavLink>
            <NavLink to="oshms/register" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 등록
            </NavLink>
            <NavLink to="oshms/periodic-check" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 정기점검
            </NavLink>
            <NavLink to="oshms/report" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 결과보고
            </NavLink>

            <div style={S.navDivider} />

            {/* 전자결재 */}
            <NavLink to="approval/inbox" style={({ isActive }) => S.navItem({ isActive })}>
              전자결재
            </NavLink>
            <NavLink to="approval/inbox" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 내 결재함
            </NavLink>
            <NavLink to="approval/admin" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 전체 결재 관리
            </NavLink>

            <div style={S.navDivider} />

            {/* 공무문서함 */}
            <NavLink to="docs/files" style={({ isActive }) => S.navItem({ isActive })}>
              공무문서함
            </NavLink>
            <NavLink to="docs/files" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 파일관리
            </NavLink>
            <NavLink to="docs/approval-link" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 전자결재 연동
            </NavLink>
            <NavLink to="docs/photo-sheet" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 사진대지 만들기
            </NavLink>
            <NavLink to="docs/form-auto" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 서식자동생성
            </NavLink>
            <NavLink to="docs/cad" style={({ isActive }) => S.navSubItem({ isActive })}>
              - 공달캐드
            </NavLink>

            <div style={{ height: 10 }} />
          </nav>
        </aside>

        <main style={S.main}>
          {/* 실제 페이지 */}
          <div style={S.contentCard}>
            <Outlet />
          </div>

          {/* 하단 안내 */}
          <div style={S.footerNote}>
            현재는 <b>UI만</b> 구성되어 있습니다. 다음 단계에서 API/DB 연동으로 실제 데이터를 연결하겠습니다.
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    background: "#fff",
    fontFamily: "'Noto Sans KR','Malgun Gothic',sans-serif",
    color: "#111",
    display: "flex",
    flexDirection: "column",
  },

  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "#fff",
    borderBottom: "1px solid #eee",
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerLeft: { display: "flex", flexDirection: "column", gap: 6, minWidth: 0 },
  headerTitleRow: { display: "flex", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: 900, letterSpacing: "-0.2px" },
  badge: {
    fontSize: 11,
    fontWeight: 900,
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid #e6e6e6",
    background: "#fafafa",
    color: "#555",
  },
  headerSub: { fontSize: 12, color: "#777", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  headerRight: { display: "flex", gap: 8, alignItems: "center" },
  headerBtn: {
    fontSize: 12,
    fontWeight: 800,
    border: "1px solid #e6e6e6",
    background: "#fff",
    borderRadius: 10,
    padding: "8px 10px",
    cursor: "pointer",
  },

  body: { flex: 1, display: "flex", minHeight: 0 },

  aside: {
    width: 280,
    borderRight: "1px solid #eee",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
  asideTop: {
    padding: "12px 12px 10px",
    borderBottom: "1px solid #f0f0f0",
    background: "#fafafa",
  },
  asideTopTitle: { fontSize: 12, fontWeight: 900, color: "#333" },
  asideTopPath: {
    marginTop: 6,
    fontSize: 11,
    color: "#aaa",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  nav: { padding: 10, overflowY: "auto" },

  navItem: ({ isActive }) => ({
    display: "block",
    padding: "10px 12px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: isActive ? 900 : 800,
    color: isActive ? "#111" : "#333",
    background: isActive ? "#f3f3f3" : "#fff",
    textDecoration: "none",
    border: "1px solid " + (isActive ? "#e6e6e6" : "transparent"),
  }),

  navSubItem: ({ isActive }) => ({
    display: "block",
    padding: "8px 12px 8px 26px",
    fontSize: 12,
    fontWeight: isActive ? 900 : 700,
    color: isActive ? "#111" : "#777",
    background: isActive ? "#f7f7f7" : "#fff",
    borderLeft: isActive ? "3px solid #111" : "3px solid transparent",
    textDecoration: "none",
    borderRadius: 8,
  }),

  navSection: {
    padding: "10px 12px 6px",
    fontSize: 11,
    fontWeight: 900,
    color: "#999",
    letterSpacing: "0.02em",
  },

  navDivider: { height: 1, background: "#f1f1f1", margin: "10px 0" },

  main: { flex: 1, minWidth: 0, padding: 18, display: "flex", flexDirection: "column", gap: 12 },
  contentCard: {
    flex: 1,
    minHeight: 0,
    border: "1px solid #eee",
    borderRadius: 16,
    background: "#fff",
    padding: 16,
    boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
  },
  footerNote: { fontSize: 12, color: "#888" },
};