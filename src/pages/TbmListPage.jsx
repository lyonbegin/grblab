// src/pages/TbmListPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { Input, Pagination, Table, Select } from 'antd'
import { SearchOutlined, PlusOutlined, PaperClipOutlined, CheckOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { listSites } from '../api/siteApi'
import { listTbmPosts } from '../api/tbmApi'

const CSS = `
  .tbm-wrap { background:#f3f6fb; padding:18px 18px 28px; }
  .tbm-card { background:#fff; border-radius:16px; box-shadow:0 2px 10px rgba(15,23,42,0.06); border:1px solid rgba(15,23,42,0.08); overflow:hidden; }

  .tbm-head { padding:14px 16px 10px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .tbm-head-left { display:flex; align-items:center; gap:10px; }
  .tbm-title { font-weight:900; color:#0f172a; font-size:15px; letter-spacing:-0.2px; }

  .tbm-btn {
    display:inline-flex; align-items:center; gap:5px; height:30px; padding:0 12px;
    border-radius:999px; background:#2563eb; color:#fff; font-size:12px; font-weight:900;
    border:none; cursor:pointer; transition:background .15s; white-space:nowrap;
  }
  .tbm-btn:hover { background:#1d4ed8; }

  .tbm-search .ant-input-affix-wrapper {
    border-radius:999px !important; height:32px; border:1px solid rgba(15,23,42,0.10) !important;
    box-shadow:none !important; background:#fff !important;
  }
  .tbm-search .ant-input { font-size:12px !important; }

  .tbm-quick { padding:8px 16px 10px; display:flex; align-items:center; gap:12px; }
  .tbm-quick-label { font-size:12px; font-weight:900; color:#0f172a; min-width:64px; white-space:nowrap; }
  .tbm-quick-chips { display:flex; gap:8px; flex-wrap:wrap; }
  .tbm-chip {
    height:26px; padding:0 12px; border-radius:999px; border:1px solid rgba(15,23,42,0.08);
    background:#fff; color:#475569; font-size:12px; font-weight:800; cursor:pointer; user-select:none;
    display:inline-flex; align-items:center; transition:all .12s ease;
  }
  .tbm-chip.active { background:rgba(37,99,235,0.10); border-color:rgba(37,99,235,0.25); color:#2563eb; }

  .tbm-table .ant-table { background:transparent !important; }
  .tbm-table .ant-table-thead > tr > th {
    background:#f8fafc !important; color:#475569 !important; font-weight:900 !important;
    font-size:12px !important; border-bottom:1px solid rgba(15,23,42,0.08) !important; padding:11px 10px !important;
  }
  .tbm-table .ant-table-tbody > tr > td {
    border-bottom:1px solid rgba(15,23,42,0.06) !important; padding:13px 10px !important;
    color:#0f172a; font-size:12px;
  }
  .tbm-table .ant-table-tbody > tr:hover > td { background:rgba(37,99,235,0.04) !important; }

  .t-cell-title { font-weight:900; color:#0f172a; font-size:13px; line-height:1.25; letter-spacing:-0.2px; }
  .t-muted { color:rgba(17,24,39,0.55); font-weight:800; font-size:11px; }

  .t-clip-dot {
    width:26px; height:26px; border-radius:8px; border:1px solid rgba(15,23,42,0.08);
    background:#fff; color:#64748b; display:inline-flex; align-items:center; justify-content:center;
  }
  .t-ok-dot {
    width:26px; height:26px; border-radius:8px; border:1px solid rgba(37,99,235,0.20);
    background:rgba(37,99,235,0.08); color:#2563eb; display:inline-flex; align-items:center; justify-content:center;
  }

  .t-pill {
    height:22px; padding:0 10px; border-radius:999px; font-size:11px; font-weight:900;
    display:inline-flex; align-items:center; justify-content:center; white-space:nowrap;
    background:#f1f5f9; border:1px solid rgba(15,23,42,0.08); color:#475569;
  }
  .t-pill-blue { background:rgba(37,99,235,0.10); border:1px solid rgba(37,99,235,0.25); color:#2563eb; }
  .t-pill-red { background:rgba(239,68,68,0.10); border:1px solid rgba(239,68,68,0.25); color:#ef4444; }

  .tbm-foot { padding:12px 16px 16px; display:flex; justify-content:flex-end; }

  /* 모바일 */
  .t-m-header { background:#fff; border-bottom:1px solid rgba(15,23,42,0.06); padding:12px 14px 10px; display:flex; flex-direction:column; gap:10px; }
  .t-m-row1 { display:flex; align-items:center; gap:8px; }
  .t-m-search .ant-input-affix-wrapper { border-radius:999px !important; height:34px !important; border:1px solid rgba(15,23,42,0.10) !important; box-shadow:none !important; background:#fff !important; }
  .t-m-search .ant-input { font-size:12px !important; }

  .t-m-btn { display:inline-flex; align-items:center; gap:4px; height:34px; padding:0 14px; border-radius:999px; background:#2563eb; color:#fff; font-size:12px; font-weight:900; border:none; cursor:pointer; white-space:nowrap; flex-shrink:0; transition:background .15s; }
  .t-m-btn:hover { background:#1d4ed8; }

  .t-m-row2 { display:flex; gap:7px; flex-wrap:nowrap; overflow-x:auto; padding-bottom:2px; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .t-m-row2::-webkit-scrollbar { display:none; }

  .t-m-list { padding:10px 0 12px; display:flex; flex-direction:column; gap:10px; }
  .t-m-foot { padding:12px 0 18px; display:flex; justify-content:center; }

  @media (max-width: 767px){
    .tbm-wrap { padding:0 !important; background:#f3f6fb; }
    .tbm-card { border-radius:0 !important; box-shadow:none !important; border-left:0 !important; border-right:0 !important; }
    .tbm-foot { justify-content:center !important; padding:12px 0 18px !important; }
  }
`

function ApprovalPill({ v }) {
  if (!v) return <span className="t-pill t-pill-red">미결재</span>
  if (v === '결재중') return <span className="t-pill t-pill-blue">결재중</span>
  if (v === '결재완료') return <span className="t-pill">결재완료</span>
  return <span className="t-pill t-pill-blue">{v}</span>
}

function ConfirmPill({ v }) {
  if (!v) return null
  return <span className="t-pill t-pill-blue">{v}</span>
}

function MobileHeader({ q, setQ, setPage, filter, tagFilters, setFilter, siteOptions, selectedSite, setSelectedSite, onRegister }) {
  return (
    <div className="t-m-header">
      <div className="t-m-row1">
        <Select
          style={{ width: 130, flexShrink: 0 }}
          value={selectedSite}
          onChange={(v) => { setSelectedSite(v); setPage(1) }}
          options={siteOptions}
          placeholder="현장선택"
        />
        <div className="t-m-search" style={{ flex: 1 }}>
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
            placeholder="작업명/내용 검색"
            allowClear
            suffix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          />
        </div>
        <button className="t-m-btn" onClick={onRegister}>
          <PlusOutlined style={{ fontSize: 11 }} />
          등록
        </button>
      </div>

      <div className="t-m-row2">
        {tagFilters.map((x) => (
          <span
            key={x}
            className={`tbm-chip ${filter === x ? 'active' : ''}`}
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

function MobileTbmList({ rows, onOpen }) {
  return (
    <div className="t-m-list">
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
                {r.workName}
              </div>

              <div style={{ marginTop: 5, fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>
                {r.tbmDate} · {r.workTimeLabel} · {r.author}
              </div>

              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {r.hasRiskEval && (
                  <span className="t-clip-dot" title="위험성평가표">
                    <PaperClipOutlined style={{ fontSize: 12 }} />
                  </span>
                )}
                {r.hasNearMiss && (
                  <span className="t-clip-dot" title="아차사고">
                    <PaperClipOutlined style={{ fontSize: 12 }} />
                  </span>
                )}
                {r.confirmRequestText && <ConfirmPill v={r.confirmRequestText} />}
                <ApprovalPill v={r.approvalStatus} />
                <span className="t-pill">{r.durationMin}분</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {rows.length === 0 && (
        <div style={{ padding: '20px 0', textAlign: 'center', color: '#94a3b8', fontWeight: 900 }}>
          TBM 기록이 없습니다.
        </div>
      )}
    </div>
  )
}

export default function TbmListPage({ onSelectPost, siteId: siteIdProp }) {
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
    // if (!effectiveSiteId && !selectedSite) {
    //   // 탭 임베드에서 siteId를 안 내려주면 필터링이 불가능하므로 빈 화면 처리
    //   setRows([])
    //   setTotal(0)
    //   return
    // }

    setLoading(true)
    try {
      const res = await listTbmPosts({
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
    return nav(`/site/${effectiveSiteId}/dashboard/tbm/${id}`)
  }
  const handleRegister = () => {
    if (onSelectPost) return onSelectPost('new')
    return nav(`/site/${effectiveSiteId}/dashboard/tbm/new`)
  }

  const columns = [
    { title: '번호', dataIndex: 'no', width: 55, align: 'center', render: (v) => <span style={{ color: '#64748b', fontWeight: 900 }}>{v}</span> },
    { title: 'TBM일시', dataIndex: 'tbmDate', width: 110, render: (v) => <span style={{ fontWeight: 900 }}>{v}</span> },
    {
      title: '작업명',
      dataIndex: 'workName',
      render: (v, r) => (
        <div onClick={() => handleOpen(r.id)} style={{ cursor: 'pointer' }}>
          <div className="t-cell-title">{v}</div>
          <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="t-pill">{r.workTimeLabel}</span>
            <span className="t-pill">{r.durationMin}분</span>
            {r.confirmRequestText ? <ConfirmPill v={r.confirmRequestText} /> : null}
            <ApprovalPill v={r.approvalStatus} />
          </div>
        </div>
      ),
    },
    { title: '현장명', dataIndex: 'siteName', width: 200, render: (v) => <span style={{ fontWeight: 800 }}>{v}</span> },
    {
      title: '위험성평가표',
      dataIndex: 'hasRiskEval',
      width: 95,
      align: 'center',
      render: (v) => v ? <span className="t-clip-dot" title="위험성평가표"><PaperClipOutlined style={{ fontSize: 12 }} /></span> : null,
    },
    {
      title: '아차사고',
      dataIndex: 'hasNearMiss',
      width: 80,
      align: 'center',
      render: (v) => v ? <span className="t-clip-dot" title="아차사고"><PaperClipOutlined style={{ fontSize: 12 }} /></span> : null,
    },
    { title: '확인요청', dataIndex: 'confirmRequestText', width: 90, align: 'center', render: (v) => v ? <span className="t-ok-dot" title="확인요청"><CheckOutlined /></span> : null },
    { title: '결재상태', dataIndex: 'approvalStatus', width: 90, align: 'center', render: (v) => <ApprovalPill v={v} /> },
    { title: '등록자', dataIndex: 'author', width: 90, render: (v) => <span className="t-muted">{v}</span> },
    { title: '등록일', dataIndex: 'createdAtLabel', width: 130, render: (v) => <span className="t-muted">{v}</span> },
  ]

  return (
    <>
      <style>{CSS}</style>

      <div className="tbm-wrap">
        {isMobile ? (
          <>
            <div className="tbm-card">
              <MobileHeader
                q={q} setQ={setQ} setPage={setPage}
                filter={filter} tagFilters={tagFilters} setFilter={setFilter}
                siteOptions={siteOptions}
                selectedSite={selectedSite} setSelectedSite={setSelectedSite}
                onRegister={handleRegister}
              />
            </div>

            <MobileTbmList rows={rows} onOpen={handleOpen} />

            <div className="t-m-foot">
              <Pagination
                current={page} pageSize={pageSize} total={total}
                onChange={(p) => setPage(p)} showSizeChanger={false}
              />
            </div>
          </>
        ) : (
          <div className="tbm-card">
            <div className="tbm-head">
              <div className="tbm-head-left">
                <span className="tbm-title">TBM일지</span>
                <button className="tbm-btn" onClick={handleRegister}>
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
                <div className="tbm-search" style={{ width: 260 }}>
                  <Input
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setPage(1) }}
                    placeholder="작업명/내용/등록자 검색"
                    allowClear
                    prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                  />
                </div>
              </div>
            </div>

            <div className="tbm-quick">
              <div className="tbm-quick-label">#필터</div>
              <div className="tbm-quick-chips">
                {tagFilters.map((x) => (
                  <span
                    key={x}
                    className={`tbm-chip ${filter === x ? 'active' : ''}`}
                    onClick={() => { setFilter(x); setPage(1) }}
                  >
                    {x}
                  </span>
                ))}
              </div>
            </div>

            <div className="tbm-table" style={{ padding: '0 12px' }}>
              <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={rows}
                pagination={false}
                onRow={(r) => ({ onClick: () => handleOpen(r.id) })}
              />
            </div>

            <div className="tbm-foot">
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