// src/pages/SafetyListPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Input, Pagination, Table } from 'antd'
import { SearchOutlined, PlusOutlined, PaperClipOutlined } from '@ant-design/icons'
import { listSafetyPosts } from '../api/safetyApi'
import { listSites } from '../api/siteApi'
import { Select } from 'antd'

const CSS = `
  /* =========================
     공통
  ========================= */
  .safety-wrap {
    background: #f3f6fb;
    padding: 18px 18px 28px;
  }

  .safety-card {
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
    border: 1px solid rgba(15, 23, 42, 0.08);
    overflow: hidden;
  }

  /* 헤더 */
  .safety-head {
    padding: 14px 16px 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .safety-head-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .safety-title {
    font-weight: 900;
    color: #0f172a;
    font-size: 15px;
    letter-spacing: -0.2px;
  }
  .safety-btn-register {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 30px;
    padding: 0 12px;
    border-radius: 999px;
    background: #2563eb;
    color: #fff;
    font-size: 12px;
    font-weight: 900;
    border: none;
    cursor: pointer;
    transition: background 0.15s;
    letter-spacing: -0.2px;
    white-space: nowrap;
  }
  .safety-btn-register:hover { background: #1d4ed8; }

  /* 검색 */
  .safety-search .ant-input-affix-wrapper {
    border-radius: 999px !important;
    height: 32px;
    border: 1px solid rgba(15,23,42,0.10) !important;
    box-shadow: none !important;
    background: #ffffff !important;
  }
  .safety-search .ant-input { font-size: 12px !important; }

  /* 태그검색 */
  .safety-quick {
    padding: 8px 16px 10px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .safety-quick-label {
    font-size: 12px;
    font-weight: 900;
    color: #0f172a;
    min-width: 64px;
    letter-spacing: -0.2px;
    white-space: nowrap;
  }
  .safety-quick-chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .safety-qchip {
    height: 26px;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid rgba(15,23,42,0.08);
    background: #ffffff;
    color: #475569;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    user-select: none;
    display: inline-flex;
    align-items: center;
    transition: all .12s ease;
  }
  .safety-qchip.active {
    background: rgba(37,99,235,0.10);
    border-color: rgba(37,99,235,0.25);
    color: #2563eb;
  }

  /* =========================
     PC TABLE
  ========================= */
  .safety-table .ant-table { background: transparent !important; }
  .safety-table .ant-table-thead > tr > th {
    background: #f8fafc !important;
    color: #475569 !important;
    font-weight: 900 !important;
    font-size: 12px !important;
    border-bottom: 1px solid rgba(15,23,42,0.08) !important;
    padding: 11px 10px !important;
  }
  .safety-table .ant-table-tbody > tr > td {
    border-bottom: 1px solid rgba(15,23,42,0.06) !important;
    padding: 13px 10px !important;
    color: #0f172a;
    font-size: 12px;
  }
  .safety-table .ant-table-tbody > tr:hover > td {
    background: rgba(37, 99, 235, 0.04) !important;
  }

  .s-cell-title {
    font-weight: 900;
    color: #0f172a;
    font-size: 13px;
    line-height: 1.25;
    letter-spacing: -0.2px;
  }
  .s-cell-chips {
    margin-top: 6px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .s-mini-chip {
    border: 1px solid rgba(15,23,42,0.06);
    background: #f1f5f9;
    color: #475569;
    height: 22px;
    border-radius: 999px;
    padding: 0 10px;
    font-size: 11px;
    font-weight: 900;
    display: inline-flex;
    align-items: center;
  }

  .s-clip-dot {
    width: 26px; height: 26px;
    border-radius: 8px;
    border: 1px solid rgba(15,23,42,0.08);
    background: #fff;
    color: #64748b;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .s-muted { color: rgba(17,24,39,0.55); font-weight: 800; font-size: 11px; }
  .s-due-link { color: #2563eb; font-weight: 900; font-size: 11px; }

  /* 상태 pill */
  .s-status-done {
    height: 22px; padding: 0 10px; border-radius: 999px;
    font-size: 11px; font-weight: 900;
    display: inline-flex; align-items: center; justify-content: center;
    white-space: nowrap;
    background: #f1f5f9;
    border: 1px solid rgba(15,23,42,0.08);
    color: #475569;
  }
  .s-status-progress {
    height: 22px; padding: 0 10px; border-radius: 999px;
    font-size: 11px; font-weight: 900;
    display: inline-flex; align-items: center; justify-content: center;
    white-space: nowrap;
    background: rgba(37,99,235,0.10);
    border: 1px solid rgba(37,99,235,0.25);
    color: #2563eb;
  }
  .s-status-red {
    height: 22px; padding: 0 10px; border-radius: 999px;
    font-size: 11px; font-weight: 900;
    display: inline-flex; align-items: center; justify-content: center;
    white-space: nowrap;
    background: rgba(239,68,68,0.10);
    border: 1px solid rgba(239,68,68,0.25);
    color: #ef4444;
  }

  /* 완료보고 pill */
  .s-done-pill {
    height: 22px; padding: 0 10px; border-radius: 999px;
    font-size: 11px; font-weight: 900;
    display: inline-flex; align-items: center;
    background: rgba(37,99,235,0.10);
    border: 1px solid rgba(37,99,235,0.25);
    color: #2563eb;
  }

  /* 하단 페이징 */
  .safety-foot {
    padding: 12px 16px 16px;
    display: flex;
    justify-content: flex-end;
  }

  /* =========================
     모바일 헤더
  ========================= */
  .s-m-header {
    background: #fff;
    border-bottom: 1px solid rgba(15,23,42,0.06);
    padding: 12px 14px 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .s-m-header-row1 {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .s-m-search .ant-input-affix-wrapper {
    border-radius: 999px !important;
    height: 34px !important;
    border: 1px solid rgba(15,23,42,0.10) !important;
    box-shadow: none !important;
    background: #fff !important;
  }
  .s-m-search .ant-input { font-size: 12px !important; }

  .s-m-btn-register {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 34px;
    padding: 0 14px;
    border-radius: 999px;
    background: #2563eb;
    color: #fff;
    font-size: 12px;
    font-weight: 900;
    border: none;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: background 0.15s;
  }
  .s-m-btn-register:hover { background: #1d4ed8; }

  .s-m-header-row2 {
    display: flex;
    gap: 7px;
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 2px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .s-m-header-row2::-webkit-scrollbar { display: none; }

  /* =========================
     모바일 카드
  ========================= */
  .s-m-list {
    padding: 10px 0 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .s-m-foot {
    padding: 12px 0 18px;
    display: flex;
    justify-content: center;
  }

  /* 썸네일 */
  .s-thumb {
    width: 64px;
    height: 64px;
    border-radius: 10px;
    object-fit: cover;
    flex-shrink: 0;
    border: 1px solid rgba(15,23,42,0.06);
  }
  .s-thumb-placeholder {
    width: 64px;
    height: 64px;
    border-radius: 10px;
    background: #f1f5f9;
    border: 1px solid rgba(15,23,42,0.06);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    font-size: 20px;
  }

  /* =========================
     모바일: 전체 가로
  ========================= */
  @media (max-width: 767px){
    .safety-wrap {
      padding: 0 !important;
      background: #f3f6fb;
    }
    .safety-card {
      border-radius: 0 !important;
      box-shadow: none !important;
      border-left: 0 !important;
      border-right: 0 !important;
    }
    .safety-foot {
      justify-content: center !important;
      padding: 12px 0 18px !important;
    }
  }
`

/* ── 상태 Pill ── */
function StatusPill({ v }) {
  if (!v) return null
  if (v === '확인완료') return <span className="s-status-done">확인완료</span>
  if (v === '확인중') return <span className="s-status-progress">확인중</span>
  if (v === '미확인') return <span className="s-status-red">미확인</span>
  return <span className="s-status-done">{v}</span>
}

function DonePill({ v }) {
  if (!v) return null
  return <span className="s-done-pill">{v}</span>
}

/* ── 모바일 헤더 ── */
function MobileHeader({ q, setQ, setPage, filter, tagFilters, setFilter, siteOptions, selectedSite, setSelectedSite, onRegister }) {
  return (
    <div className="s-m-header">
      <div className="s-m-header-row1">
        <Select
          style={{ width: 130, flexShrink: 0 }}
          value={selectedSite}
          onChange={(v) => { setSelectedSite(v); setPage(1) }}
          options={siteOptions}
          placeholder="현장선택"
        />
        <div className="s-m-search" style={{ flex: 1 }}>
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
            placeholder="검색어 입력"
            allowClear
            suffix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          />
        </div>
        <button className="s-m-btn-register" onClick={onRegister}>
          <PlusOutlined style={{ fontSize: 11 }} />
          등록
        </button>
      </div>

      <div className="s-m-header-row2">
        {tagFilters.map((x) => (
          <span
            key={x}
            className={`safety-qchip ${filter === x ? 'active' : ''}`}
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

/* ── PC 헤더 ── */
function PcHeader({ q, setQ, setPage, filter, tagFilters, setFilter, nav, siteId, siteOptions, selectedSite, setSelectedSite }) {
  return (
    <>
      <div className="safety-head">
        <div className="safety-head-left">
          <span className="safety-title">안전신고</span>
          <button
            className="safety-btn-register"
            onClick={() => nav(`/site/${siteId}/dashboard/safety/new`)}
          >
            <PlusOutlined style={{ fontSize: 11 }} />
            등록
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Select
            style={{ width: 160 }}
            value={selectedSite}
            onChange={(v) => { setSelectedSite(v); setPage(1) }}
            options={siteOptions}
            placeholder="현장선택"
          />
          <div className="safety-search" style={{ width: 240 }}>
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1) }}
              placeholder="현장명 및 내용 검색"
              allowClear
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            />
          </div>
        </div>
      </div>

      <div className="safety-quick">
        <div className="safety-quick-label">#태그검색</div>
        <div className="safety-quick-chips">
          {tagFilters.map((x) => (
            <span
              key={x}
              className={`safety-qchip ${filter === x ? 'active' : ''}`}
              onClick={() => { setFilter(x); setPage(1) }}
            >
              {x}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}

/* ── 모바일 카드 ── */
function MobileSafetyList({ rows, onOpen }) {
  return (
    <div className="s-m-list">
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
          {/* 현장명 */}
          {r.siteName && (
            <div style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', marginBottom: 8 }}>
              {r.siteName}
            </div>
          )}

          {/* 썸네일 + 내용 */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {r.thumbnailUrl
              ? <img className="s-thumb" src={r.thumbnailUrl} alt="썸네일" />
              : <div className="s-thumb-placeholder">📷</div>
            }

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 15, fontWeight: 900, lineHeight: 1.32,
                color: '#0f172a', letterSpacing: '-0.3px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {r.title}
              </div>
              <div style={{ marginTop: 5, fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>
                {r.createdAtLabel} {r.author}
              </div>

              {/* 아이콘 + 상태 */}
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                {r.hasAttachment && (
                  <span style={{
                    width: 28, height: 28, borderRadius: 8,
                    border: '1px solid rgba(15,23,42,0.08)',
                    background: '#f1f5f9', color: '#64748b',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <PaperClipOutlined style={{ fontSize: 13 }} />
                  </span>
                )}
                {r.isConfirmed && (
                  <span style={{
                    width: 28, height: 28, borderRadius: 8,
                    border: '1px solid rgba(37,99,235,0.20)',
                    background: 'rgba(37,99,235,0.08)', color: '#2563eb',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13,
                  }}>✓</span>
                )}
                {r.status && <StatusPill v={r.status} />}
              </div>
            </div>
          </div>
        </div>
      ))}

      {rows.length === 0 && (
        <div style={{ padding: '20px 0', textAlign: 'center', color: '#94a3b8', fontWeight: 900 }}>
          안전신고가 없습니다.
        </div>
      )}
    </div>
  )
}

/* ── 메인 ── */
export default function SafetyListPage({ onSelectPost }) {
  const nav = useNavigate()
  const { siteId } = useParams()

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

  const tagFilters = useMemo(() => ['#전체', '#신고', '#2지구', '#여름', '#축동로'], [])

  // 현장 목록 로드
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
      const res = await listSafetyPosts({ siteId: selectedSite || siteId, q, filter, page, pageSize })
      setRows(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchList() }, [siteId, selectedSite, q, filter, page, pageSize])

  const handleOpen = (id) => onSelectPost ? onSelectPost(id) : nav(`/site/${siteId}/dashboard/safety/${id}`)
  const handleRegister = () => onSelectPost ? onSelectPost('new') : nav(`/site/${siteId}/dashboard/safety/new`)

  const columns = [
    {
      title: '번호',
      dataIndex: 'no',
      width: 55,
      align: 'center',
      render: (v) => <span style={{ color: '#64748b', fontWeight: 900 }}>{v}</span>,
    },
    {
      title: '안전신고 내용',
      dataIndex: 'title',
      render: (v, r) => (
        <div onClick={() => handleOpen(r.id)} style={{ cursor: 'pointer' }}>
          <div className="s-cell-title">{v}</div>
          {r.chips?.length > 0 && (
            <div className="s-cell-chips">
              {r.chips.slice(0, 4).map((c) => <span className="s-mini-chip" key={c}>{c}</span>)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '위치',
      dataIndex: 'location',
      width: 100,
      render: (v) => <span style={{ color: '#0f172a', fontWeight: 800, fontSize: 12 }}>{v || '-'}</span>,
    },
    {
      title: '현장명 ∨',
      dataIndex: 'siteName',
      width: 180,
      render: (v) => <span style={{ color: '#0f172a', fontWeight: 800, fontSize: 12 }}>{v}</span>,
    },
    {
      title: '첨부파일',
      dataIndex: 'hasAttachment',
      width: 70,
      align: 'center',
      render: (v) => v ? <span className="s-clip-dot"><PaperClipOutlined style={{ fontSize: 12 }} /></span> : null,
    },
    {
      title: '등록자 ∨',
      dataIndex: 'author',
      width: 80,
      render: (v) => <span className="s-muted">{v}</span>,
    },
    {
      title: '등록일',
      dataIndex: 'createdAtLabel',
      width: 130,
      render: (v) => <span className="s-muted">{v}</span>,
    },
    {
      title: '기한일',
      dataIndex: 'dueDateLabel',
      width: 90,
      render: (v) => v ? <span className="s-due-link">{v}</span> : null,
    },
    {
      title: '완료보고 ∨',
      dataIndex: 'doneReport',
      width: 90,
      align: 'center',
      render: (v) => <DonePill v={v} />,
    },
    {
      title: '확인상태 ∨',
      dataIndex: 'status',
      width: 90,
      align: 'center',
      render: (v) => <StatusPill v={v} />,
    },
    {
      title: '결재상태 ∨',
      dataIndex: 'approvalStatus',
      width: 90,
      align: 'center',
      render: (v) => v ? <span className="s-status-progress">{v}</span> : null,
    },
  ]

  return (
    <>
      <style>{CSS}</style>

      <div className="safety-wrap">
        {isMobile ? (
          <>
            <div className="safety-card">
              <MobileHeader
                q={q} setQ={setQ} setPage={setPage}
                filter={filter} tagFilters={tagFilters} setFilter={setFilter}
                siteOptions={siteOptions}
                selectedSite={selectedSite} setSelectedSite={setSelectedSite}
                onRegister={handleRegister}
              />
            </div>

            <MobileSafetyList rows={rows} onOpen={handleOpen} />

            <div className="s-m-foot">
              <Pagination
                current={page} pageSize={pageSize} total={total}
                onChange={(p) => setPage(p)} showSizeChanger={false}
              />
            </div>
          </>
        ) : (
          <div className="safety-card">
            <PcHeader
              q={q} setQ={setQ} setPage={setPage}
              filter={filter} tagFilters={tagFilters} setFilter={setFilter}
              nav={nav} siteId={siteId}
              siteOptions={siteOptions}
              selectedSite={selectedSite} setSelectedSite={setSelectedSite}
            />

            <div className="safety-table" style={{ padding: '0 12px' }}>
              <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={rows}
                pagination={false}
                onRow={(r) => ({ onClick: () => handleOpen(r.id) })}
              />
            </div>

            <div className="safety-foot">
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