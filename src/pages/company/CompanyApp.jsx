// src/pages/company/CompanyApp.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import ProjectsListPage from "./ProjectsListPage";
import ProjectLayout from "./ProjectLayout";
import DashboardHome from "./DashboardHome";

// 계약/보드/신고/TBM/위험/일지/체계
import ContractPage from "./contract/ContractPage";
import BoardListPage from "./board/BoardListPage";
import BoardDetailPage from "./board/BoardDetailPage";
import ReportsListPage from "./reports/ReportsListPage";
import ReportDetailPage from "./reports/ReportDetailPage";
import TbmWritePage from "./tbm/TbmWritePage";
import TbmAttendeesPage from "./tbm/TbmAttendeesPage";
import TbmPdfPage from "./tbm/TbmPdfPage";
import RiskHomePage from "./risk/RiskHomePage";
import RiskTradeTaskPage from "./risk/RiskTradeTaskPage";
import RiskHazardDbPage from "./risk/RiskHazardDbPage";
import RiskSheetPage from "./risk/RiskSheetPage";
import SafetyLogHome from "./safetylog/SafetyLogHome";
import EduListPage from "./safetylog/EduListPage";
import EduDetailPage from "./safetylog/EduDetailPage";
import EduPdfPage from "./safetylog/EduPdfPage";
import DrillPdfPage from "./safetylog/DrillPdfPage";
import InspectPdfPage from "./safetylog/InspectPdfPage";
import PpePdfPage from "./safetylog/PpePdfPage";
import OshmsRegisterPage from "./oshms/OshmsRegisterPage";
import OshmsPeriodicCheckPage from "./oshms/OshmsPeriodicCheckPage";
import OshmsReportPage from "./oshms/OshmsReportPage";

// 전자결재/공무문서함
import ApprovalInboxPage from "./approval/ApprovalInboxPage";
import ApprovalAdminPage from "./approval/ApprovalAdminPage";
import DocsFilesPage from "./docs/DocsFilesPage";
import DocsApprovalLinkPage from "./docs/DocsApprovalLinkPage";
import DocsPhotoSheetPage from "./docs/DocsPhotoSheetPage";
import DocsFormAutoPage from "./docs/DocsFormAutoPage";
import DocsCadPage from "./docs/DocsCadPage";

export default function CompanyApp() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/company/site/projects" replace />} />
      <Route path="/site/projects" element={<ProjectsListPage />} />

      <Route path="/site/projects/:projectId" element={<ProjectLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardHome />} />

        <Route path="contract" element={<ContractPage />} />

        <Route path="board" element={<BoardListPage />} />
        <Route path="board/:postId" element={<BoardDetailPage />} />

        <Route path="reports" element={<ReportsListPage />} />
        <Route path="reports/:reportId" element={<ReportDetailPage />} />

        <Route path="tbm/new" element={<TbmWritePage />} />
        <Route path="tbm/attendees" element={<TbmAttendeesPage />} />
        <Route path="tbm/:tbmId/pdf" element={<TbmPdfPage />} />

        <Route path="risk" element={<RiskHomePage />} />
        <Route path="risk/trade-task" element={<RiskTradeTaskPage />} />
        <Route path="risk/hazard-db" element={<RiskHazardDbPage />} />
        <Route path="risk/sheet/:sheetId" element={<RiskSheetPage />} />

        <Route path="safety-log" element={<SafetyLogHome />} />
        <Route path="safety-log/edu" element={<EduListPage />} />
        <Route path="safety-log/edu/:eduId" element={<EduDetailPage />} />
        <Route path="safety-log/edu/:eduId/pdf" element={<EduPdfPage />} />
        <Route path="safety-log/drill/:drillId/pdf" element={<DrillPdfPage />} />
        <Route path="safety-log/inspect/:inspectId/pdf" element={<InspectPdfPage />} />
        <Route path="safety-log/ppe/:issueId/pdf" element={<PpePdfPage />} />

        <Route path="oshms/register" element={<OshmsRegisterPage />} />
        <Route path="oshms/periodic-check" element={<OshmsPeriodicCheckPage />} />
        <Route path="oshms/report" element={<OshmsReportPage />} />

        {/* 전자결재 */}
        <Route path="approval/inbox" element={<ApprovalInboxPage />} />
        <Route path="approval/admin" element={<ApprovalAdminPage />} />

        {/* 공무문서함 */}
        <Route path="docs/files" element={<DocsFilesPage />} />
        <Route path="docs/approval-link" element={<DocsApprovalLinkPage />} />
        <Route path="docs/photo-sheet" element={<DocsPhotoSheetPage />} />
        <Route path="docs/form-auto" element={<DocsFormAutoPage />} />
        <Route path="docs/cad" element={<DocsCadPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/company/site/projects" replace />} />
    </Routes>
  );
}