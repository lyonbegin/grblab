// src/pages/ProjectDashboardPage.jsx
import { useMemo } from 'react'
import { useLocation, useNavigate, useParams, Outlet } from 'react-router-dom'
import { Tabs } from 'antd'

export default function ProjectDashboardPage() {
  const nav = useNavigate()
  const { siteId } = useParams()
  const loc = useLocation()

  const activeKey = useMemo(() => {
    // /site/:siteId/dashboard/board  같은 경로에서 마지막 segment를 탭으로 사용
    const parts = loc.pathname.split('/').filter(Boolean)
    return parts[parts.length - 1] || 'contract'
  }, [loc.pathname])

  const items = [
    { key: 'contract', label: '계약정보' },
    { key: 'board', label: '공사보드' },
    { key: 'report', label: '안전신고' },
    { key: 'tbm', label: 'TBM!!' },
    { key: 'risk', label: '위험성평가' },
    { key: 'edu', label: '안전교육일지' },
    { key: 'emmergency', label: '비상훈련' },
   { key: 'ppe', label: '개인보호구' },
    { key: 'oshms', label: '안전보건관리체계' },
    { key: 'approval', label: '전자결재' },
    { key: 'docs', label: '공무문서함' },
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '22px 20px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>공사 대시보드</h2>
        <span style={{ color: '#999', fontSize: 12 }}>siteId: {siteId}</span>
      </div>

      <Tabs
        activeKey={activeKey}
        items={items}
        onChange={(k) => nav(`/site/${siteId}/dashboard/${k}`)}
      />

      <div style={{ marginTop: 14 }}>
        <Outlet />
      </div>
    </div>
  )
}