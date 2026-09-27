import { Routes, Route, Navigate } from 'react-router-dom'
import InputPage      from './pages/InputPage'
import ResultPage     from './pages/ResultPage'
import FormInputPage  from './pages/FormInputPage'
import UrineResultPage from './pages/UrineResultPage'
import ProjectDashboardPage from './pages/ProjectDashboardPage'
import BoardIndexPage       from './pages/BoardIndexPage'
import EmergencyListPage   from './pages/EmergencyListPage'
import EmergencyDetailPage from './pages/EmergencyDetailPage'
// ✅ 현장관리
import SiteListPage   from './pages/SiteListPage'
import SiteDetailPage from './pages/SiteDetailPage'
import InspectionListPage   from './pages/InspectionListPage'
import InspectionDetailPage from './pages/InspectionDetailPage'
import TbmListPage   from './pages/TbmListPage'
import TbmDetailPage from './pages/TbmDetailPage'
import TbmResultPage from './pages/TbmResultPage'
import SafetyDetailPage from './pages/SafetyDetailPage'
import SafetyListPage   from './pages/SafetyListPage'
import PpeListPage   from './pages/PpeListPage'
import PpeDetailPage from './pages/PpeDetailPage'
import SafetyEduDetailPage from './pages/SafetyEduDetailPage'
import SafetyEduListPage   from './pages/SafetyEduListPage'
import GrbLabPage from './pages/GrbLabPage'
import HospitalPartnerPage from './pages/HospitalPartnerPage'

// ✅ 2026-09-29 객석심사 / 무대 송출
import AudienceJudgePage from './judge/AudienceJudgePage'
import JudgeAdminPage from './judge/JudgeAdminPage'
import AudienceJudgeDisplay from './judge/AudienceJudgeDisplay'

// ✅ 기프트카드 교환 (담당자용)
import AdminExchangePage from './pages/AdminExchangePage'

const Stub = ({ title }) => (
  <div style={{ padding: 24 }}>
    <h3>{title}</h3>
    <p>UI 준비 중 (API 연동 전)</p>
  </div>
)

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<InputPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/urine-result" element={<UrineResultPage />} />
      <Route path="/form" element={<FormInputPage />} />
      <Route path="/tbm/result" element={<TbmResultPage />} />

      <Route path="/site" element={<SiteListPage />} />
      <Route path="/site/:siteId" element={<SiteDetailPage />} />
      <Route path="/safety" element={<SafetyListPage />} />
      <Route path="/safety/:safetyId" element={<SafetyDetailPage />} />
      <Route path="/tbm" element={<TbmListPage />} />
      <Route path="/tbm/:tbmId" element={<TbmDetailPage />} />
      <Route path="/edu" element={<SafetyEduListPage />} />
      <Route path="/edu/:eduId" element={<SafetyEduDetailPage />} />
      <Route path="/inspection" element={<InspectionListPage />} />
      <Route path="/inspection/:postId" element={<InspectionDetailPage />} />
      <Route path="/pt" element={<InputPage />} />
      <Route path="/hp" element={<HospitalPartnerPage />} />

      {/* 객석심사 */}
      <Route path="/judge" element={<AudienceJudgePage />} />
      <Route path="/judge/admin" element={<JudgeAdminPage />} />
      <Route path="/judge/display" element={<AudienceJudgeDisplay />} />
      {/* 현장 노트북에서 짧은 주소도 사용 가능 */}
      <Route path="/display" element={<AudienceJudgeDisplay />} />

      <Route path="/admin/exchange" element={<AdminExchangePage />} />
      <Route path="/emergency" element={<EmergencyListPage />} />
      <Route path="/emergency/:postId" element={<EmergencyDetailPage />} />
      <Route path="/ppe" element={<PpeListPage />} />
      <Route path="/ppe/:postId" element={<PpeDetailPage />} />

      <Route path="/site/:siteId/dashboard" element={<ProjectDashboardPage />}>
        <Route index element={<Navigate to="board" replace />} />
        <Route path="contract" element={<Stub title="계약정보" />} />
        <Route path="board/*" element={<BoardIndexPage />} />
        <Route path="report" element={<Stub title="안전신고" />} />
        <Route path="tbm" element={<Stub title="TBM" />} />
        <Route path="risk" element={<Stub title="위험성평가" />} />
        <Route path="edu" element={<Stub title="안전교육일지" />} />
        <Route path="emmergency" element={<Stub title="비상훈련" />} />
        <Route path="inspection" element={<Stub title="안전점검" />} />
        <Route path="ppe" element={<Stub title="개인보호구" />} />
        <Route path="oshms" element={<Stub title="안전보건관리체계" />} />
        <Route path="approval" element={<Stub title="전자결재" />} />
        <Route path="docs" element={<Stub title="공무문서함" />} />
      </Route>
    </Routes>
  )
}
