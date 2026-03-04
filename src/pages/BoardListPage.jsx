// src/pages/BoardListPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Input, Pagination, Select, Table } from 'antd'
import { SearchOutlined, PaperClipOutlined, PlusOutlined } from '@ant-design/icons'
import { listPosts } from '../api/boardApi'
import { listSites } from '../api/siteApi'

const CSS = `
  /* =========================
     공통(PC/모바일)
  ========================= */
  .board-wrap {
    background: #f3f6fb;
    padding: 18px 18px 28px;
  }

  .board-card {
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
    border: 1px solid rgba(15, 23, 42, 0.08);
    overflow: hidden;
  }

  /* 상단 헤더 */
  .board-head {
    padding: 14px 16px 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .board-head-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .board-title {
    font-weight: 900;
    color: #0f172a;
    font-size: 15px;
    letter-spacing: -0.2px;
  }

  .btn-register {
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
  .btn-register:hover { background: #1d4ed8; }

  /* 검색 인풋 */
  .board-search .ant-input-affix-wrapper {
    border-radius: 999px !important;
    height: 32px;
    border: 1px solid rgba(15,23,42,0.10) !important;
    box-shadow: none !important;
    background: #ffffff !important;
  }
  .board-search .ant-input {
    font-size: 12px !important;
  }

  /* 빠른검색 영역 */
  .board-quick {
    padding: 8px 16px 10px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .quick-label {
    font-size: 12px;
    font-weight: 900;
    color: #0f172a;
    min-width: 64px;
    letter-spacing: -0.2px;
  }
  .quick-chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .qchip {
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
  .qchip.active {
    background: rgba(37,99,235,0.10);
    border-color: rgba(37,99,235,0.25);
    color: #2563eb;
  }

  /* =========================
     PC TABLE
  ========================= */
  .board-table .ant-table {
    background: transparent !important;
  }
  .board-table .ant-table-thead > tr > th {
    background: #f8fafc !important;
    color: #475569 !important;
    font-weight: 900 !important;
    font-size: 12px !important;
    border-bottom: 1px solid rgba(15,23,42,0.08) !important;
    padding: 11px 10px !important;
  }
  .board-table .ant-table-tbody > tr > td {
    border-bottom: 1px solid rgba(15,23,42,0.06) !important;
    padding: 13px 10px !important;
    color: #0f172a;
    font-size: 12px;
  }
  .board-table .ant-table-tbody > tr:hover > td {
    background: rgba(37, 99, 235, 0.04) !important;
  }

  .cell-title {
    font-weight: 900;
    color: #0f172a;
    font-size: 13px;
    line-height: 1.25;
    letter-spacing: -0.2px;
  }
  .cell-chips {
    margin-top: 6px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .mini-chip {
    border: 1px solid rgba(15, 23, 42, 0.06);
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

  .clip-dot {
    width: 26px;
    height: 26px;
    border-radius: 8px;
    border: 1px solid rgba(15, 23, 42, 0.08);
    background: #ffffff;
    color: #64748b;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .muted {
    color: rgba(17,24,39,0.55);
    font-weight: 800;
    font-size: 11px;
  }
  .due-link {
    color: #2563eb;
    font-weight: 900;
    font-size: 11px;
  }

  .status-done,
  .status-progress {
    height: 22px;
    padding: 0 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 900;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
  }
  .status-done {
    background: #f1f5f9;
    border: 1px solid rgba(15,23,42,0.08);
    color: #475569;
  }
  .status-progress {
    background: rgba(37,99,235,0.10);
    border: 1px solid rgba(37,99,235,0.25);
    color: #2563eb;
  }

  /* 하단 페이징 */
  .board-foot {
    padding: 12px 16px 16px;
    display: flex;
    justify-content: flex-end;
  }
  .board-card .ant-pagination .ant-pagination-item {
    border-radius: 10px !important;
    border: 1px solid rgba(15,23,42,0.08) !important;
    background: #fff !important;
  }
  .board-card .ant-pagination .ant-pagination-item a {
    color: rgba(17,24,39,0.55) !important;
    font-weight: 900 !important;
  }
  .board-card .ant-pagination .ant-pagination-item-active {
    background: rgba(37,99,235,0.10) !important;
    border-color: rgba(37,99,235,0.25) !important;
  }
  .board-card .ant-pagination .ant-pagination-item-active a {
    color: #2563eb !important;
  }
  .board-card .ant-pagination .ant-pagination-prev button,
  .board-card .ant-pagination .ant-pagination-next button {
    color: rgba(17,24,39,0.55) !important;
  }
  .board-card .ant-pagination .ant-pagination-prev:hover button,
  .board-card .ant-pagination .ant-pagination-next:hover button {
    color: #2563eb !important;
  }

  /* =========================
     모바일 헤더
  ========================= */
  .m-header {
    background: #fff;
    border-bottom: 1px solid rgba(15,23,42,0.06);
    padding: 12px 14px 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* 현장선택 + 검색 + 등록 */
  .m-header-row1 {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* 현장선택 드롭다운 */
  .m-site-select.ant-select .ant-select-selector {
    border-radius: 999px !important;
    height: 34px !important;
    border: 1px solid rgba(15,23,42,0.10) !important;
    background: #fff !important;
    box-shadow: none !important;
    font-size: 12px !important;
    font-weight: 800 !important;
    padding: 0 12px !important;
    display: flex !important;
    align-items: center !important;
  }
  .m-site-select.ant-select .ant-select-selection-item {
    font-size: 12px !important;
    font-weight: 800 !important;
    color: #0f172a !important;
    line-height: 34px !important;
  }
  .m-site-select.ant-select .ant-select-arrow {
    color: #94a3b8 !important;
  }

  /* 모바일 검색 */
  .m-search .ant-input-affix-wrapper {
    border-radius: 999px !important;
    height: 34px !important;
    border: 1px solid rgba(15,23,42,0.10) !important;
    box-shadow: none !important;
    background: #fff !important;
  }
  .m-search .ant-input {
    font-size: 12px !important;
  }

  /* 모바일 등록 버튼 */
  .m-btn-register {
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
  .m-btn-register:hover { background: #1d4ed8; }

  /* 빠른검색 chips (모바일) */
  .m-header-row2 {
    display: flex;
    gap: 7px;
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 2px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .m-header-row2::-webkit-scrollbar { display: none; }

  /* =========================
     모바일 카드 리스트
  ========================= */
  .m-list {
    padding: 10px 0 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .m-foot {
    padding: 12px 0 18px;
    display: flex;
    justify-content: center;
  }

  /* =========================
     모바일: 전체 가로
  ========================= */
  @media (max-width: 767px){
    .board-wrap {
      padding: 0 !important;
      background: #f3f6fb;
    }
    .board-card {
      border-radius: 0 !important;
      box-shadow: none !important;
      border-left: 0 !important;
      border-right: 0 !important;
    }
    .board-foot {
      justify-content: center !important;
      padding: 12px 0 18px !important;
    }

    /* PC 현장선택 */
.board-site-select.ant-select .ant-select-selector {
  border-radius: 999px !important;
  height: 32px !important;
  border: 1px solid rgba(15,23,42,0.10) !important;
  box-shadow: none !important;
  background: #ffffff !important;
  display: flex !important;
  align-items: center !important;
}
.board-site-select.ant-select .ant-select-selection-item,
.board-site-select.ant-select .ant-select-selection-placeholder {
  font-size: 12px !important;
  font-weight: 800 !important;
  color: #475569 !important;
  line-height: 32px !important;
}
.board-site-select.ant-select .ant-select-arrow {
  color: #94a3b8 !important;
}

/* 모바일 현장선택 */
.m-site-select.ant-select .ant-select-selector {
  border-radius: 999px !important;
  height: 34px !important;
  border: 1px solid rgba(15,23,42,0.10) !important;
  box-shadow: none !important;
  background: #ffffff !important;
  display: flex !important;
  align-items: center !important;
}
.m-site-select.ant-select .ant-select-selection-item,
.m-site-select.ant-select .ant-select-selection-placeholder {
  font-size: 12px !important;
  font-weight: 800 !important;
  color: #475569 !important;
  line-height: 34px !important;
}
.m-site-select.ant-select .ant-select-arrow {
  color: #94a3b8 !important;
}


  }
`

function StatusPill({ v }) {
  if (!v) return null
  if (v === '확인완료') return <span className="status-done">확인완료</span>
  if (v === '확인중') return <span className="status-progress">확인중</span>
  return <span className="status-done">{v}</span>
}

/* ── 모바일 헤더 ── */
function MobileHeader({ q, setQ, setPage, filter, quickFilters, setFilter, siteOptions, selectedSite, setSelectedSite, onRegister }) {
  return (
    <div className="m-header">
      {/* 1행: 현장선택 + 검색 + 등록 */}
      <div className="m-header-row1">
       <Select
  className="m-site-select"
  style={{ width: 130, flexShrink: 0 }}
  value={selectedSite}
  onChange={(v) => { setSelectedSite(v); setPage(1) }}
  options={siteOptions}
  placeholder="현장선택"
  styles={{
    selector: {
      borderRadius: 999,
      height: 34,
      border: '1px solid rgba(15,23,42,0.10)',
      background: '#fff',
      fontSize: 12,
      fontWeight: 800,
      color: '#475569',
    }
  }}
/>

        <div className="m-search" style={{ flex: 1 }}>
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
            placeholder="검색어 입력"
            allowClear
            suffix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          />
        </div>

        <button className="m-btn-register" onClick={onRegister}>
          <PlusOutlined style={{ fontSize: 11 }} />
          등록
        </button>
      </div>

      {/* 2행: 빠른검색 chips (가로 스크롤) */}
      <div className="m-header-row2">
        {quickFilters.map((x) => (
          <span
            key={x}
            className={`qchip ${filter === x ? 'active' : ''}`}
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
// PcHeader props에 siteOptions, selectedSite, setSelectedSite 추가
function PcHeader({ q, setQ, setPage, filter, quickFilters, setFilter, nav, siteId, siteOptions, selectedSite, setSelectedSite }) {
  return (
    
    <>
      <div className="board-head">
        <div className="board-head-left">
          <span className="board-title">공사보드</span>
          <button
            className="btn-register"
            onClick={() => nav(`/site/${siteId}/dashboard/board/new`)}
          >
            <PlusOutlined style={{ fontSize: 11 }} />
            공사 등록
          </button>
        </div>

        {/* ✅ 현장선택 + 검색창 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Select
  className="board-site-select"
  style={{ width: 160 }}
  value={selectedSite}
  onChange={(v) => { setSelectedSite(v); setPage(1) }}
  options={siteOptions}
  placeholder="현장선택"
  styles={{
    selector: {
      borderRadius: 999,
      height: 32,
      border: '1px solid rgba(15,23,42,0.10)',
      background: '#fff',
      fontSize: 12,
      fontWeight: 800,
      color: '#475569',
    }
  }}
/>
          <div className="board-search" style={{ width: 240 }}>
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

      <div className="board-quick">
        <div className="quick-label">빠른검색</div>
        <div className="quick-chips">
          {quickFilters.map((x) => (
            <span
              key={x}
              className={`qchip ${filter === x ? 'active' : ''}`}
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

/* ── 모바일 카드 리스트 ── */
function MobileBoardList({ rows, onOpen }) {
  return (
    <div className="m-list">
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
            border: '1px solid rgba(15, 23, 42, 0.08)',
            borderRadius: 16,
            padding: '14px 14px 12px',
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)',
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
            margin: '0 12px',
          }}
        >
          {/* 상단: No + 상태 + 첨부 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#64748b' }}>No. {r.no}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {!!r.status && <StatusPill v={r.status} />}
              {r.hasAttachment && <PaperClipOutlined style={{ fontSize: 14, color: '#94a3b8' }} />}
            </div>
          </div>

          {/* 제목 */}
          <div style={{
            marginTop: 10,
            fontSize: 15,
            fontWeight: 900,
            lineHeight: 1.32,
            color: '#0f172a',
            letterSpacing: '-0.3px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {r.title}
          </div>

          {/* 칩 */}
          {(r.chips?.length || 0) > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {r.chips.slice(0, 4).map((c) => (
                <span key={c} style={{
                  fontSize: 11, fontWeight: 800,
                  padding: '5px 10px', borderRadius: 999,
                  background: '#f1f5f9', color: '#475569',
                  border: '1px solid rgba(15, 23, 42, 0.06)',
                }}>{c}</span>
              ))}
            </div>
          )}

          {/* 푸터 */}
          <div style={{
            marginTop: 12, paddingTop: 12,
            borderTop: '1px solid rgba(15, 23, 42, 0.06)',
            display: 'flex', justifyContent: 'space-between',
            gap: 12, alignItems: 'flex-end',
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.siteName || '현장명'}
              </div>
              <div style={{ marginTop: 4, fontSize: 11, fontWeight: 800, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.author} · {r.createdAtLabel}
              </div>
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8' }}>기한일</div>
              <div style={{ marginTop: 2, fontSize: 13, fontWeight: 900, color: '#2563eb', whiteSpace: 'nowrap' }}>
                {r.dueDateLabel || '-'}
              </div>
            </div>
          </div>
        </div>
      ))}

      {rows.length === 0 && (
        <div style={{ padding: '20px 0', textAlign: 'center', color: '#94a3b8', fontWeight: 900 }}>
          게시글이 없습니다.
        </div>
      )}
    </div>
  )
}

/* ── 메인 ── */
export default function BoardListPage({ onSelectPost }) {
  const nav = useNavigate()
  const { siteId } = useParams()

  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('전체')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)

  // 현장선택 드롭다운 (모바일)
  const [siteOptions, setSiteOptions] = useState([{ label: '전체 현장', value: '' }])
  const [selectedSite, setSelectedSite] = useState('')

  const isMobile = window.innerWidth < 768

  const quickFilters = useMemo(() => ([
    '전체', '공사공지', '기안/결재진행', '공사보드', '안전보드', '위험성평가', '복공2지구',
  ]), [])

  // 현장 목록 로드 (모바일 드롭다운용)
  useEffect(() => {
    if (!isMobile) return
    listSites({ page: 1, pageSize: 100 }).then((res) => {
      const opts = [
        { label: '전체 현장', value: '' },
        ...(res.items || []).map((s) => ({ label: s.siteName, value: s.id })),
      ]
      setSiteOptions(opts)
    }).catch(() => {})
  }, [])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await listPosts({ siteId: selectedSite || siteId, q, filter, page, pageSize })
      setRows(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchList() }, [siteId, selectedSite, q, filter, page, pageSize])

  const handleOpen = (id) => onSelectPost ? onSelectPost(id) : nav(`/site/${siteId}/dashboard/board/${id}`)
  const handleRegister = () => onSelectPost ? onSelectPost('new') : nav(`/site/${siteId}/dashboard/board/new`)

  const columns = [
    {
      title: '번호',
      dataIndex: 'no',
      width: 60,
      align: 'center',
      render: (v) => <span style={{ color: '#64748b', fontWeight: 900 }}>{v}</span>,
    },
    {
      title: '공사보드 내용',
      dataIndex: 'title',
      render: (v, r) => (
        <div onClick={() => handleOpen(r.id)} style={{ cursor: 'pointer' }}>
          <div className="cell-title">{v}</div>
          {r.chips?.length > 0 && (
            <div className="cell-chips">
              {r.chips.slice(0, 6).map((c) => <span className="mini-chip" key={c}>{c}</span>)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '현장명',
      dataIndex: 'siteName',
      width: 220,
      render: (v) => <span style={{ color: '#0f172a', fontWeight: 800 }}>{v}</span>,
    },
    {
      title: '첨부\n파일',
      dataIndex: 'hasAttachment',
      width: 70,
      align: 'center',
      render: (v) => v ? (
        <span className="clip-dot"><PaperClipOutlined style={{ fontSize: 12 }} /></span>
      ) : null,
    },
    {
      title: '등록자',
      dataIndex: 'author',
      width: 90,
      render: (v) => <span className="muted">{v}</span>,
    },
    {
      title: '등록일',
      dataIndex: 'createdAtLabel',
      width: 140,
      render: (v) => <span className="muted">{v}</span>,
    },
    {
      title: '기한일',
      dataIndex: 'dueDateLabel',
      width: 90,
      render: (v) => v ? <span className="due-link">{v}</span> : null,
    },
    {
      title: '확인상태',
      dataIndex: 'status',
      width: 100,
      align: 'center',
      render: (v) => <StatusPill v={v} />,
    },
  ]

  return (
    <>
      <style>{CSS}</style>

      <div className="board-wrap">
        {isMobile ? (
          <>
            {/* 모바일: 헤더 카드 */}
            <div className="board-card">
              <MobileHeader
                q={q} setQ={setQ} setPage={setPage}
                filter={filter} quickFilters={quickFilters} setFilter={setFilter}
                siteOptions={siteOptions}
                selectedSite={selectedSite} setSelectedSite={setSelectedSite}
                onRegister={handleRegister}
              />
            </div>

            {/* 모바일: 카드 리스트 */}
            <MobileBoardList rows={rows} onOpen={handleOpen} />

            <div className="m-foot">
              <Pagination
                current={page} pageSize={pageSize} total={total}
                onChange={(p) => setPage(p)} showSizeChanger={false}
              />
            </div>
          </>
        ) : (
          <div className="board-card">
            <PcHeader
              q={q} setQ={setQ} setPage={setPage}
              filter={filter} quickFilters={quickFilters} setFilter={setFilter}
              nav={nav} siteId={siteId}
            />

            <div className="board-table" style={{ padding: '0 12px' }}>
              <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={rows}
                pagination={false}
                onRow={(r) => ({ onClick: () => handleOpen(r.id) })}
              />
            </div>

            <div className="board-foot">
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