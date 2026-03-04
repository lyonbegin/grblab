// src/pages/InspectionListPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { Input, Pagination, Table, Select } from 'antd'
import { SearchOutlined, PlusOutlined, PaperClipOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { listSites } from '../api/siteApi'
import { listInspectionPosts } from '../api/inspectionApi' // ✅ 고객님 프로젝트 API명에 맞춰 유지/수정

const CSS = `
  .ins-wrap { background:#f3f6fb; padding:18px 18px 28px; }
  .ins-card { background:#fff; border-radius:16px; box-shadow:0 2px 10px rgba(15,23,42,0.06); border:1px solid rgba(15,23,42,0.08); overflow:hidden; }

  .ins-head { padding:14px 16px 10px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .ins-head-left { display:flex; align-items:center; gap:10px; }
  .ins-title { font-weight:900; color:#0f172a; font-size:15px; letter-spacing:-0.2px; }

  .ins-btn {
    display:inline-flex; align-items:center; gap:5px; height:30px; padding:0 12px;
    border-radius:999px; background:#2563eb; color:#fff; font-size:12px; font-weight:900;
    border:none; cursor:pointer; transition:background .15s; white-space:nowrap;
  }
  .ins-btn:hover { background:#1d4ed8; }

  .ins-search .ant-input-affix-wrapper {
    border-radius:999px !important; height:32px; border:1px solid rgba(15,23,42,0.10) !important;
    box-shadow:none !important; background:#fff !important;
  }
  .ins-search .ant-input { font-size:12px !important; }

  .ins-quick { padding:8px 16px 10px; display:flex; align-items:center; gap:12px; }
  .ins-quick-label { font-size:12px; font-weight:900; color:#0f172a; min-width:64px; white-space:nowrap; }
  .ins-quick-chips { display:flex; gap:8px; flex-wrap:wrap; }
  .ins-chip {
    height:26px; padding:0 12px; border-radius:999px; border:1px solid rgba(15,23,42,0.08);
    background:#fff; color:#475569; font-size:12px; font-weight:800; cursor:pointer; user-select:none;
    display:inline-flex; align-items:center; transition:all .12s ease;
  }
  .ins-chip.active { background:rgba(37,99,235,0.10); border-color:rgba(37,99,235,0.25); color:#2563eb; }

  .ins-table .ant-table { background:transparent !important; }
  .ins-table .ant-table-thead > tr > th {
    background:#f8fafc !important; color:#475569 !important; font-weight:900 !important;
    font-size:12px !important; border-bottom:1px solid rgba(15,23,42,0.08) !important; padding:11px 10px !important;
  }
  .ins-table .ant-table-tbody > tr > td {
    border-bottom:1px solid rgba(15,23,42,0.06) !important; padding:13px 10px !important;
    color:#0f172a; font-size:12px;
  }
  .ins-table .ant-table-tbody > tr:hover > td { background:rgba(37,99,235,0.04) !important; }

  .i-cell-title { font-weight:900; color:#0f172a; font-size:13px; line-height:1.25; letter-spacing:-0.2px; }
  .i-muted { color:rgba(17,24,39,0.55); font-weight:800; font-size:11px; }

  .i-clip-dot {
    width:26px; height:26px; border-radius:8px; border:1px solid rgba(15,23,42,0.08);
    background:#fff; color:#64748b; display:inline-flex; align-items:center; justify-content:center;
  }

  .i-pill {
    height:22px; padding:0 10px; border-radius:999px; font-size:11px; font-weight:900;
    display:inline-flex; align-items:center; justify-content:center; white-space:nowrap;
    background:#f1f5f9; border:1px solid rgba(15,23,42,0.08); color:#475569;
  }
  .i-pill-blue { background:rgba(37,99,235,0.10); border:1px solid rgba(37,99,235,0.25); color:#2563eb; }
  .i-pill-green { background:rgba(16,185,129,0.10); border:1px solid rgba(16,185,129,0.25); color:#10b981; }
  .i-pill-red { background:rgba(239,68,68,0.10); border:1px solid rgba(239,68,68,0.25); color:#ef4444; }

  .ins-foot { padding:12px 16px 16px; display:flex; justify-content:flex-end; }

  /* 모바일 */
  .i-m-header { background:#fff; border-bottom:1px solid rgba(15,23,42,0.06); padding:12px 14px 10px; display:flex; flex-direction:column; gap:10px; }
  .i-m-row1 { display:flex; align-items:center; gap:8px; }
  .i-m-search .ant-input-affix-wrapper { border-radius:999px !important; height:34px !important; border:1px solid rgba(15,23,42,0.10) !important; box-shadow:none !important; background:#fff !important; }
  .i-m-search .ant-input { font-size:12px !important; }
  .i-m-btn { display:inline-flex; align-items:center; gap:4px; height:34px; padding:0 14px; border-radius:999px; background:#2563eb; color:#fff; font-size:12px; font-weight:900; border:none; cursor:pointer; white-space:nowrap; flex-shrink:0; transition:background .15s; }
  .i-m-btn:hover { background:#1d4ed8; }
  .i-m-row2 { display:flex; gap:7px; flex-wrap:nowrap; overflow-x:auto; padding-bottom:2px; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .i-m-row2::-webkit-scrollbar { display:none; }
  .i-m-list { padding:10px 0 12px; display:flex; flex-direction:column; gap:10px; }
  .i-m-foot { padding:12px 0 18px; display:flex; justify-content:center; }

  @media (max-width: 767px){
    .ins-wrap { padding:0 !important; background:#f3f6fb; }
    .ins-card { border-radius:0 !important; box-shadow:none !important; border-left:0 !important; border-right:0 !important; }
    .ins-foot { justify-content:center !important; padding:12px 0 18px !important; }
  }
`

function MobileHeader({ q, setQ, setPage, filter, tagFilters, setFilter, siteOptions, selectedSite, setSelectedSite, onRegister }) {
  return (
    <div className="i-m-header">
      <div className="i-m-row1">
        <Select
          style={{ width: 130, flexShrink: 0 }}
          value={selectedSite}
          onChange={(v) => { setSelectedSite(v); setPage(1) }}
          options={siteOptions}
          placeholder="현장선택"
        />
        <div className="i-m-search" style={{ flex: 1 }}>
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
            placeholder="제목/현장/등록자 검색"
            allowClear
            suffix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          />
        </div>
        <button className="i-m-btn" onClick={onRegister}>
          <PlusOutlined style={{ fontSize: 11 }} />
          등록
        </button>
      </div>

      <div className="i-m-row2">
        {tagFilters.map((x) => (
          <span
            key={x}
            className={`ins-chip ${filter === x ? 'active' : ''}`}
            style={{ flexShrink: 0 }}
            onClick={() => { setFilter(x); setPage(1) }}
          >
            {x}
          </span>
        ))}
      </div>
    </div>
  )
}

function pillForWaiting(v) {
  // 참석(서명대기) 예: "5명(1)" 같은 형태가 들어오면 강조
  if (!v) return null
  return <span className="i-pill i-pill-red">{v}</span>
}

function pillForConfirm(v) {
  if (!v) return null
  if (v === '확인완료') return <span className="i-pill i-pill-green">확인완료</span>
  if (v === '확인중') return <span className="i-pill i-pill-blue">확인중</span>
  return <span className="i-pill i-pill-blue">{v}</span>
}

function pillForApproval(v) {
  if (!v) return <span className="i-pill i-pill-red">미결재</span>
  if (v === '결재중') return <span className="i-pill i-pill-blue">결재중</span>
  if (v === '결재완료') return <span className="i-pill">결재완료</span>
  return <span className="i-pill i-pill-blue">{v}</span>
}

function MobileInspectionList({ rows, onOpen }) {
  return (
    <div className="i-m-list">
      {rows.map((r) => (
        <div
          key={r.id}
          role="button"
          tabIndex={0}
          onClick={() => onOpen(r.id)}
          onTouchEnd={(e) => { e.preventDefault(); onOpen(r.id) }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen(r.id) }}
          style={{
            cursor: 'pointer',
            background: '#fff',
            border: '1px solid rgba(15,23,42,0.08)',
            borderRadius: 16,
            padding: '14px 14px 12px',
            boxShadow: '0 2px 10px rgba(15,23,42,0.06)',
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
            margin: '0 12px',
          }}
        >
          {r.siteName && (
            <div style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', marginBottom: 8 }}>
              {r.siteName}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 15, fontWeight: 900, lineHeight: 1.32,
                color: '#0f172a', letterSpacing: '-0.3px',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {r.title}
              </div>

              <div style={{ marginTop: 5, fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>
                {r.createdAtLabel} · {r.author}
              </div>

              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {r.hasAttachment && (
                  <span className="i-clip-dot" title="첨부파일">
                    <PaperClipOutlined style={{ fontSize: 12 }} />
                  </span>
                )}
                {pillForWaiting(r.waitingSignText)}
                {pillForConfirm(r.confirmStatus)}
                {pillForApproval(r.approvalStatus)}
              </div>
            </div>
          </div>
        </div>
      ))}

      {rows.length === 0 && (
        <div style={{ padding: '20px 0', textAlign: 'center', color: '#94a3b8', fontWeight: 900 }}>
          안전점검 기록이 없습니다.
        </div>
      )}
    </div>
  )
}

export default function InspectionListPage({ onSelectPost, siteId: siteIdProp }) {
  const nav = useNavigate()
  const { siteId: siteIdFromParams } = useParams()
  const effectiveSiteId = siteIdProp || siteIdFromParams

  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('#전체')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)

  const [siteOptions, setSiteOptions] = useState([{ label: '전체 현장', value: '' }])
  const [selectedSite, setSelectedSite] = useState('')

  const isMobile = window.innerWidth < 768
  const tagFilters = useMemo(() => ['#전체', '#확인요청', '#결재중', '#결재완료', '#미결재'], [])

  useEffect(() => {
    listSites({ page: 1, pageSize: 100 }).then((res) => {
      setSiteOptions([
        { label: '전체 현장', value: '' },
        ...(res.items || []).map((s) => ({ label: s.siteName, value: s.id })),
      ])
    }).catch(() => {})
  }, [])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await listInspectionPosts({
        siteId: selectedSite || effectiveSiteId,
        q,
        filter,
        page,
        pageSize,
      })
      setRows(res.items || [])
      setTotal(res.total || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchList() }, [effectiveSiteId, selectedSite, q, filter, page, pageSize])

  const handleOpen = (id) => {
    if (onSelectPost) return onSelectPost(id)
    return nav(`/site/${effectiveSiteId}/dashboard/inspection/${id}`)
  }
  const handleRegister = () => {
    if (onSelectPost) return onSelectPost('new')
    return nav(`/site/${effectiveSiteId}/dashboard/inspection/new`)
  }

  const columns = [
    { title: '번호', dataIndex: 'no', width: 55, align: 'center', render: (v) => <span style={{ color: '#64748b', fontWeight: 900 }}>{v}</span> },
    {
      title: '일지 제목',
      dataIndex: 'title',
      render: (v, r) => (
        <div onClick={() => handleOpen(r.id)} style={{ cursor: 'pointer' }}>
          <div className="i-cell-title">{v}</div>
          <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {r.waitingSignText ? <span className="i-pill i-pill-red">{r.waitingSignText}</span> : null}
            {r.confirmStatus ? pillForConfirm(r.confirmStatus) : null}
            {pillForApproval(r.approvalStatus)}
          </div>
        </div>
      ),
    },
    { title: '현장명', dataIndex: 'siteName', width: 200, render: (v) => <span style={{ fontWeight: 800 }}>{v}</span> },
    { title: '첨부파일', dataIndex: 'hasAttachment', width: 85, align: 'center', render: (v) => v ? <span className="i-clip-dot"><PaperClipOutlined style={{ fontSize: 12 }} /></span> : null },
    { title: '등록자', dataIndex: 'author', width: 90, render: (v) => <span className="i-muted">{v}</span> },
    { title: '등록일', dataIndex: 'createdAtLabel', width: 130, render: (v) => <span className="i-muted">{v}</span> },
    { title: '참석/서명대기', dataIndex: 'waitingSignText', width: 110, align: 'center', render: (v) => v ? <span className="i-pill i-pill-red">{v}</span> : <span className="i-pill">-</span> },
    { title: '확인상태', dataIndex: 'confirmStatus', width: 90, align: 'center', render: (v) => v ? pillForConfirm(v) : <span className="i-pill">-</span> },
    { title: '결재상태', dataIndex: 'approvalStatus', width: 90, align: 'center', render: (v) => pillForApproval(v) },
  ]

  return (
    <>
      <style>{CSS}</style>

      <div className="ins-wrap">
        {isMobile ? (
          <>
            <div className="ins-card">
              <MobileHeader
                q={q} setQ={setQ} setPage={setPage}
                filter={filter} tagFilters={tagFilters} setFilter={setFilter}
                siteOptions={siteOptions}
                selectedSite={selectedSite} setSelectedSite={setSelectedSite}
                onRegister={handleRegister}
              />
            </div>

            <MobileInspectionList rows={rows} onOpen={handleOpen} />

            <div className="i-m-foot">
              <Pagination
                current={page} pageSize={pageSize} total={total}
                onChange={(p) => setPage(p)} showSizeChanger={false}
              />
            </div>
          </>
        ) : (
          <div className="ins-card">
            <div className="ins-head">
              <div className="ins-head-left">
                <span className="ins-title">안전점검</span>
                <button className="ins-btn" onClick={handleRegister}>
                  <PlusOutlined style={{ fontSize: 11 }} />
                  등록
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Select
                  style={{ width: 180 }}
                  value={selectedSite}
                  onChange={(v) => { setSelectedSite(v); setPage(1) }}
                  options={siteOptions}
                  placeholder="현장선택"
                />
                <div className="ins-search" style={{ width: 260 }}>
                  <Input
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setPage(1) }}
                    placeholder="제목/현장/등록자 검색"
                    allowClear
                    prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                  />
                </div>
              </div>
            </div>

            <div className="ins-quick">
              <div className="ins-quick-label">#필터</div>
              <div className="ins-quick-chips">
                {tagFilters.map((x) => (
                  <span
                    key={x}
                    className={`ins-chip ${filter === x ? 'active' : ''}`}
                    onClick={() => { setFilter(x); setPage(1) }}
                  >
                    {x}
                  </span>
                ))}
              </div>
            </div>

            <div className="ins-table" style={{ padding: '0 12px' }}>
              <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={rows}
                pagination={false}
                onRow={(r) => ({ onClick: () => handleOpen(r.id) })}
              />
            </div>

            <div className="ins-foot">
              <Pagination
                current={page} pageSize={pageSize} total={total}
                onChange={(p) => setPage(p)} showSizeChanger={false}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}