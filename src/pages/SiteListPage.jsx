// src/pages/SiteListPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Pagination, Table } from 'antd'
import { SearchOutlined, PlusOutlined, WarningOutlined } from '@ant-design/icons'
import { listSites } from '../api/siteApi'

const CSS = `
  /* =========================
     공통 (PC/모바일)
  ========================= */
  .site-wrap {
    background: #f3f6fb;
    padding: 18px 18px 28px;
  }

  .site-card {
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
    border: 1px solid rgba(15, 23, 42, 0.08);
    overflow: hidden;
  }

  /* 상단 헤더 */
  .site-head {
    padding: 16px 20px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .site-head-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .site-page-title {
    font-size: 17px;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: -0.4px;
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
    font-family: 'Noto Sans KR', sans-serif;
    transition: background 0.15s;
    letter-spacing: -0.2px;
    white-space: nowrap;
  }
  .btn-register:hover { background: #1d4ed8; }

  /* 검색 인풋 */
  .site-search .ant-input-affix-wrapper {
    border-radius: 999px !important;
    height: 32px;
    border: 1px solid rgba(15,23,42,0.10) !important;
    box-shadow: none !important;
    background: #ffffff !important;
  }
  .site-search .ant-input {
    font-size: 12px !important;
    font-family: 'Noto Sans KR', sans-serif !important;
  }

  /* 태그검색 영역 */
  .site-tag-area {
    padding: 6px 20px 12px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .tag-label {
    font-size: 13px;
    font-weight: 900;
    color: #0f172a;
    min-width: 60px;
    letter-spacing: -0.2px;
    white-space: nowrap;
  }

  .tag-chips {
    display: flex;
    gap: 7px;
    flex-wrap: wrap;
  }

  .tag-chip {
    height: 26px;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid rgba(15,23,42,0.10);
    background: #ffffff;
    color: #475569;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    user-select: none;
    display: inline-flex;
    align-items: center;
    transition: all .12s ease;
    letter-spacing: -0.2px;
  }
  .tag-chip.active {
    background: rgba(37,99,235,0.10);
    border-color: rgba(37,99,235,0.25);
    color: #2563eb;
  }
  .tag-chip:hover:not(.active) {
    background: #f1f5f9;
    border-color: rgba(15,23,42,0.14);
  }

  /* =========================
     PC TABLE
  ========================= */
  .site-table .ant-table {
    background: transparent !important;
    font-family: 'Noto Sans KR', sans-serif !important;
  }

  .site-table .ant-table-thead > tr > th {
    background: #f8fafc !important;
    color: #475569 !important;
    font-weight: 900 !important;
    font-size: 12px !important;
    border-bottom: 1px solid rgba(15,23,42,0.08) !important;
    padding: 10px 10px !important;
    letter-spacing: -0.2px !important;
    font-family: 'Noto Sans KR', sans-serif !important;
  }

  .site-table .ant-table-tbody > tr > td {
    border-bottom: 1px solid rgba(15,23,42,0.06) !important;
    padding: 11px 10px !important;
    color: #0f172a;
    font-size: 12px;
    font-family: 'Noto Sans KR', sans-serif !important;
    cursor: pointer;
  }

  .site-table .ant-table-tbody > tr:hover > td {
    background: rgba(37, 99, 235, 0.03) !important;
  }

  /* 공사여부 pill */
  .status-active {
    height: 22px;
    padding: 0 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 900;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    background: rgba(37,99,235,0.10);
    border: 1px solid rgba(37,99,235,0.25);
    color: #2563eb;
  }

  /* 현장명 */
  .cell-site-name {
    font-weight: 900;
    font-size: 13px;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 6px;
    letter-spacing: -0.3px;
  }

  /* 공사보드 셀 */
  .board-cell {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .board-icon-box {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: 1px solid rgba(15,23,42,0.08);
    background: #f1f5f9;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: #64748b;
    font-weight: 900;
  }
  .board-count {
    font-size: 12px;
    font-weight: 900;
    color: #0f172a;
  }

  /* 안전신고 */
  .warn-cell {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .warn-icon {
    color: #f59e0b;
    font-size: 12px;
  }
  .warn-count {
    font-size: 12px;
    font-weight: 900;
    color: #0f172a;
  }

  /* 위험성평가 pill */
  .risk-pill {
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
  .risk-blue {
    background: rgba(37,99,235,0.10);
    border: 1px solid rgba(37,99,235,0.25);
    color: #2563eb;
  }
  .risk-none {
    background: rgba(239,68,68,0.10);
    border: 1px solid rgba(239,68,68,0.25);
    color: #ef4444;
  }

  /* 준공일 */
  .due-date {
    color: #0f172a;
    font-weight: 900;
    font-size: 12px;
    line-height: 1.3;
  }
  .due-dday {
    font-size: 11px;
    font-weight: 900;
    color: #2563eb;
    margin-top: 2px;
  }

  /* muted */
  .muted {
    color: rgba(17,24,39,0.50);
    font-weight: 800;
    font-size: 11px;
  }

  /* 하단 페이징 */
  .site-foot {
    padding: 12px 16px 16px;
    display: flex;
    justify-content: flex-end;
  }

  /* Pagination 톤 통일 */
  .site-wrap .ant-pagination .ant-pagination-item {
    border-radius: 10px !important;
    border: 1px solid rgba(15,23,42,0.08) !important;
    background: #fff !important;
  }
  .site-wrap .ant-pagination .ant-pagination-item a {
    color: rgba(17,24,39,0.55) !important;
    font-weight: 900 !important;
  }
  .site-wrap .ant-pagination .ant-pagination-item-active {
    background: rgba(37,99,235,0.10) !important;
    border-color: rgba(37,99,235,0.25) !important;
  }
  .site-wrap .ant-pagination .ant-pagination-item-active a {
    color: #2563eb !important;
  }
  .site-wrap .ant-pagination .ant-pagination-prev button,
  .site-wrap .ant-pagination .ant-pagination-next button {
    color: rgba(17,24,39,0.55) !important;
  }
  .site-wrap .ant-pagination .ant-pagination-prev:hover button,
  .site-wrap .ant-pagination .ant-pagination-next:hover button {
    color: #2563eb !important;
  }

  /* =========================
     모바일 카드 리스트
  ========================= */
  .m-site-list {
    padding: 10px 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* =========================
     모바일: 전체 가로 + 중첩 박스 제거
  ========================= */
  @media (max-width: 767px) {
    .site-wrap {
      padding: 0 !important;
      background: #f3f6fb;
    }
    .site-card {
      border-radius: 0 !important;
      box-shadow: none !important;
      border-left: 0 !important;
      border-right: 0 !important;
    }
    .m-site-list {
      padding: 10px 0 12px !important;
    }
    .site-foot {
      justify-content: center !important;
      padding: 12px 0 18px !important;
    }
  }
`

/* ── 공통 서브 컴포넌트 ── */
function ActivePill() {
  return <span className="status-active">진행중</span>
}

function BoardCell({ count }) {
  return (
    <div className="board-cell">
      <span className="board-icon-box">🗂</span>
      <span className="board-count">{count}</span>
    </div>
  )
}

function SafetyCell({ confirmed, total }) {
  return (
    <div className="warn-cell">
      <WarningOutlined className="warn-icon" />
      <span className="warn-count">{confirmed}/{total}</span>
    </div>
  )
}

function RiskPill({ value }) {
  if (value == null) return null
  if (value > 0) return <span className="risk-pill risk-blue">{value}건</span>
  return <span className="risk-pill risk-none">미등록</span>
}

function DueCell({ date, dday }) {
  if (!date) return null
  return (
    <div>
      <div className="due-date">{date}</div>
      {dday != null && <div className="due-dday">(D-{dday})</div>}
    </div>
  )
}

/* ── 모바일 전용 카드 리스트 ── */
function MobileSiteList({ rows, onOpen, onEdit }) {
  return (
    <div className="m-site-list">
      {rows.map((r) => (
        <div
          key={r.id}
          role="button"
          tabIndex={0}
          onClick={() => onOpen(r.id)}
          onTouchEnd={(e) => {
            e.preventDefault()
            onOpen(r.id)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onOpen(r.id)
          }}
          style={{
            cursor: 'pointer',
            background: '#fff',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            borderRadius: 16,
            padding: '14px 14px 12px',
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)',
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
            margin: '0 12px 10px',
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          {/* 상단: No + 공사여부 + 수정버튼 + 등록일 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#64748b' }}>No. {r.no}</span>
              {r.isActive && <ActivePill />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>{r.createdAtLabel}</span>
            </div>
          </div>

          {/* 현장명 */}
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
            {r.starred && <span style={{ marginRight: 5, color: '#f59e0b' }}>⭐</span>}
            {r.siteName}
          </div>

          {/* 통계 배지 행: 공사보드 / 안전신고 / TBM / 위험성평가 */}
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {/* 공사보드 */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: '#f1f5f9', borderRadius: 8,
              padding: '4px 8px',
              border: '1px solid rgba(15,23,42,0.06)',
            }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>🗂</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: '#475569' }}>공사보드</span>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#0f172a', marginLeft: 2 }}>{r.boardCount}</span>
            </div>

            {/* 안전신고 */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: '#fffbeb', borderRadius: 8,
              padding: '4px 8px',
              border: '1px solid rgba(245,158,11,0.15)',
            }}>
              <WarningOutlined style={{ fontSize: 11, color: '#f59e0b' }} />
              <span style={{ fontSize: 11, fontWeight: 900, color: '#92400e' }}>안전신고</span>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#0f172a', marginLeft: 2 }}>
                {r.safetyConfirmed}/{r.safetyCount}
              </span>
            </div>

            {/* TBM */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: '#f1f5f9', borderRadius: 8,
              padding: '4px 8px',
              border: '1px solid rgba(15,23,42,0.06)',
            }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: '#475569' }}>TBM</span>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#0f172a', marginLeft: 2 }}>{r.tbmCount}건</span>
            </div>

            {/* 위험성평가 */}
            <RiskPill value={r.riskCount} />
          </div>

          {/* 하단: 발주처 + 준공일 */}
          <div style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid rgba(15,23,42,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'flex-end',
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', marginBottom: 2 }}>발주처</div>
              <div style={{
                fontSize: 13,
                fontWeight: 900,
                color: '#0f172a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {r.client || '-'}
              </div>
              <div style={{ marginTop: 3, fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>
                등록자: {r.author}
              </div>
            </div>

            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8' }}>준공일</div>
              <div style={{ marginTop: 2, fontSize: 13, fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>
                {r.dueDate || '-'}
              </div>
              {r.dday != null && (
                <div style={{ fontSize: 11, fontWeight: 900, color: '#2563eb', marginTop: 1 }}>
                  (D-{r.dday})
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {rows.length === 0 && (
        <div style={{ padding: '20px 0', textAlign: 'center', color: '#94a3b8', fontWeight: 900 }}>
          현장이 없습니다.
        </div>
      )}
    </div>
  )
}

/* ── 메인 페이지 ── */
export default function SiteListPage({ onSelectSite }) {
  const nav = useNavigate()

  const [q, setQ] = useState('')
  const [activeTag, setActiveTag] = useState('공사전체')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)

  const isMobile = window.innerWidth < 768

  const tagFilters = useMemo(() => ['공사전체', '#신축공사', '#가로수정비'], [])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await listSites({ q, tag: activeTag, page, pageSize })
      setRows(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchList() }, [q, activeTag, page, pageSize])

  /* PC 테이블 컬럼 */
  const columns = [
    {
      title: '번호',
      dataIndex: 'no',
      width: 55,
      align: 'center',
      render: (v) => <span style={{ color: '#64748b', fontWeight: 900, fontSize: 12 }}>{v}</span>,
    },
    {
      title: '공사여부 ∨',
      dataIndex: 'isActive',
      width: 90,
      align: 'center',
      render: (v) => v ? <ActivePill /> : null,
    },
    {
      title: '현장명',
      dataIndex: 'siteName',
      render: (v, r) => (
        <div className="cell-site-name">
          {r.starred && <span style={{ color: '#f59e0b', marginRight: 4 }}>⭐</span>}
          <span>{v}</span>
        </div>
      ),
    },
    {
      title: '공사\n보드',
      dataIndex: 'boardCount',
      width: 70,
      align: 'center',
      render: (v) => <BoardCell count={v} />,
    },
    {
      title: '안전\n신고',
      dataIndex: 'safetyCount',
      width: 75,
      align: 'center',
      render: (v, r) => <SafetyCell confirmed={r.safetyConfirmed} total={v} />,
    },
    {
      title: 'TBM',
      dataIndex: 'tbmCount',
      width: 60,
      align: 'center',
      render: (v) => <span style={{ fontWeight: 900, fontSize: 12, color: '#0f172a' }}>{v}건</span>,
    },
    {
      title: '위험성평가',
      dataIndex: 'riskCount',
      width: 95,
      align: 'center',
      render: (v) => <RiskPill value={v} />,
    },
    {
      title: '준공일',
      dataIndex: 'dueDate',
      width: 110,
      render: (v, r) => <DueCell date={v} dday={r.dday} />,
    },
    {
      title: '발주처',
      dataIndex: 'client',
      width: 130,
      render: (v) => <span style={{ fontWeight: 800, fontSize: 12, color: '#0f172a' }}>{v}</span>,
    },
    {
      title: '등록자 ∨',
      dataIndex: 'author',
      width: 80,
      render: (v) => <span className="muted">{v}</span>,
    },
    {
      title: '등록일 ∨',
      dataIndex: 'createdAtLabel',
      width: 80,
      render: (v) => <span className="muted">{v}</span>,
    },
  ]

  /* 헤더 + 태그 영역 (PC/모바일 공통) */
  const HeaderArea = () => (
    <>
      <div className="site-head">
        <div className="site-head-left">
          <span className="site-page-title">현장관리</span>
          <button className="btn-register" onClick={() => nav('/site/new')}>
            <PlusOutlined style={{ fontSize: 11 }} />
            현장 등록
          </button>
        </div>
        <div className="site-search" style={{ width: 220 }}>
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
            placeholder="현장명을 입력하세요."
            allowClear
            suffix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          />
        </div>
      </div>

      <div className="site-tag-area">
        <div className="tag-label">#태그검색</div>
        <div className="tag-chips">
          {tagFilters.map((x) => (
            <span
              key={x}
              className={`tag-chip ${activeTag === x ? 'active' : ''}`}
              onClick={() => { setActiveTag(x); setPage(1) }}
            >
              {x.startsWith('#') ? x : `#${x}`}
            </span>
          ))}
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{CSS}</style>

      <div className="site-wrap">
        {isMobile ? (
          /* =========================================
             모바일: BoardListPage 패턴과 동일하게
             - 헤더/태그는 site-card 안에
             - 카드 리스트는 site-card 밖에 (board-card 없이 바로)
             - Pagination은 최하단
          ========================================= */
          <>
            <div className="site-card">
              <HeaderArea />
            </div>

            <MobileSiteList
              rows={rows}
              onOpen={(id) => onSelectSite ? onSelectSite(id) : nav(`/site/${id}`)}
            />

            <div className="site-foot">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                onChange={(p) => setPage(p)}
                showSizeChanger={false}
              />
            </div>
          </>
        ) : (
          /* =========================================
             PC: 카드 안에 헤더 + 테이블 + 페이징
          ========================================= */
          <div className="site-card">
            <HeaderArea />

            <div className="site-table" style={{ padding: '0 12px' }}>
              <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={rows}
                pagination={false}
                onRow={(r) => ({
                  onClick: () => onSelectSite ? onSelectSite(r.id) : nav(`/site/${r.id}`),
                })}
              />
            </div>

            <div className="site-foot">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                onChange={(p) => setPage(p)}
                showSizeChanger={false}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}