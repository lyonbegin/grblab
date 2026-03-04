// src/pages/PpeDetailPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Input, Modal } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import { getPpeDetail, updatePpeDetail, deletePpeDetail } from '../api/ppeDetailApi'

// ✅ 모바일 지급대장(카드형)
import MobilePpeLedgerCards from './MobilePpeLedgerCards'

const CSS = `
  .pd2-wrap { background: #f3f6fb; padding: 18px 18px 28px; }

  .pd2-card {
    background: #fff;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 16px;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
    overflow: hidden;
  }

  /* ── 상단 바 ── */
  .pd2-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(15,23,42,0.06);
    background: #fff;
  }
  .pd2-top-title {
    flex: 1;
    text-align: center;
    font-weight: 900;
    font-size: 15px;
    color: #0f172a;
    letter-spacing: -0.2px;
  }
  .pd2-top-side {
    min-width: 90px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .pd2-top-side-right { justify-content: flex-end; }

  .pd2-top .ant-btn {
    border-radius: 12px !important;
    height: 34px !important;
    padding: 0 14px !important;
    font-weight: 900 !important;
    font-size: 13px !important;
  }
  .pd2-top .ant-btn-default {
    background: #ffffff !important;
    border: 1px solid #d1d5db !important;
    color: #374151 !important;
  }
  .pd2-top .ant-btn-default:hover {
    background: #f1f5f9 !important;
    border-color: #9ca3af !important;
    color: #0f172a !important;
  }
  .pd2-top .ant-btn-primary:not(.ant-btn-dangerous) {
    background: #2563eb !important;
    border-color: #2563eb !important;
    color: #fff !important;
  }
  .pd2-top .ant-btn-primary:not(.ant-btn-dangerous):hover {
    background: #1d4ed8 !important;
    border-color: #1d4ed8 !important;
  }
  .pd2-top .ant-btn-dangerous,
  .pd2-top .ant-btn-primary.ant-btn-dangerous {
    background: #ef4444 !important;
    border-color: #ef4444 !important;
    color: #fff !important;
  }
  .pd2-top .ant-btn-dangerous:hover,
  .pd2-top .ant-btn-primary.ant-btn-dangerous:hover {
    background: #dc2626 !important;
    border-color: #dc2626 !important;
  }

  /* ── 정보 테이블 ── */
  .pd2-body { padding: 12px 12px 4px; }

  .pd2-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    border-top: 1px solid rgba(15,23,42,0.06);
  }
  .pd2-table td {
    border-bottom: 1px solid rgba(15,23,42,0.06);
    padding: 12px 12px;
    vertical-align: top;
    font-size: 12px;
    color: #0f172a;
    word-break: break-word;
  }
  .pd2-table .k {
    width: 110px;
    background: #f8fafc;
    color: #475569;
    font-weight: 900;
    font-size: 12px;
  }
  .pd2-table .v { font-weight: 800; color: #0f172a; }

  .pd2-pill {
    display: inline-flex;
    align-items: center;
    height: 22px;
    padding: 0 10px;
    border-radius: 999px;
    background: rgba(37,99,235,0.10);
    border: 1px solid rgba(37,99,235,0.25);
    color: #2563eb;
    font-weight: 900;
    font-size: 11px;
    margin-left: 8px;
    white-space: nowrap;
  }

  .pd2-link { color: #2563eb; font-weight: 900; }

  .pd2-created {
    padding: 10px 12px 14px;
    color: rgba(17,24,39,0.45);
    font-weight: 900;
    font-size: 11px;
  }

  /* 입력 스타일 */
  .pd2-body .ant-input,
  .pd2-body .ant-input-affix-wrapper,
  .pd2-body textarea {
    border-radius: 10px !important;
    border: 1px solid rgba(15,23,42,0.12) !important;
    font-size: 13px !important;
  }
  .pd2-body .ant-input:focus,
  .pd2-body .ant-input-affix-wrapper:focus-within {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 2px rgba(37,99,235,0.10) !important;
  }
  .pd2-body textarea { min-height: 140px !important; }

  /* 상태 pill */
  .pd2-status-done {
    height: 22px; padding: 0 10px; border-radius: 999px;
    font-size: 11px; font-weight: 900;
    display: inline-flex; align-items: center;
    background: #f1f5f9; border: 1px solid rgba(15,23,42,0.08); color: #475569;
  }
  .pd2-status-progress {
    height: 22px; padding: 0 10px; border-radius: 999px;
    font-size: 11px; font-weight: 900;
    display: inline-flex; align-items: center;
    background: rgba(37,99,235,0.10); border: 1px solid rgba(37,99,235,0.25); color: #2563eb;
  }

  /* PC 지급대장 표 */
  .pd2-ledger-wrap { overflow-x: auto; }
  .pd2-ledger-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 980px;
  }
  .pd2-ledger-table th {
    background: #f8fafc;
    border-bottom: 1px solid rgba(15,23,42,0.08);
    padding: 10px 8px;
    font-size: 12px;
    font-weight: 900;
    color: #475569;
    text-align: center;
    white-space: nowrap;
  }
  .pd2-ledger-table td {
    border-bottom: 1px solid rgba(15,23,42,0.06);
    padding: 10px 8px;
    font-size: 12px;
    font-weight: 800;
    color: #0f172a;
    text-align: center;
    white-space: nowrap;
  }
  .pd2-ledger-table td.left { text-align: left; }

  .pd2-ledger-inp {
    width: 100%;
    height: 34px;
    border-radius: 10px;
    border: 1px solid rgba(15,23,42,0.12);
    padding: 0 10px;
    font-weight: 900;
    font-size: 13px;
    outline: none;
  }

  .pd2-ledger-addbar { margin-top: 10px; display: flex; justify-content: flex-end; gap: 8px; }
  .pd2-ledger-addbtn {
    height: 34px; padding: 0 14px;
    border-radius: 10px;
    border: 2px dashed rgba(37,99,235,0.35);
    background: rgba(37,99,235,0.04);
    color: #2563eb;
    font-weight: 900;
    cursor: pointer;
  }
  .pd2-ledger-delbtn {
    height: 28px; padding: 0 10px;
    border-radius: 8px;
    border: 1px solid rgba(239,68,68,0.25);
    background: rgba(239,68,68,0.10);
    color: #ef4444;
    font-weight: 900;
    cursor: pointer;
  }
  .pd2-ledger-toggle {
    width: 28px; height: 28px;
    border-radius: 8px;
    border: 1px solid rgba(15,23,42,0.12);
    background: #fff;
    color: #94a3b8;
    font-weight: 900;
    cursor: pointer;
  }
  .pd2-ledger-toggle.on {
    background: rgba(37,99,235,0.10);
    border: 1px solid rgba(37,99,235,0.25);
    color: #2563eb;
  }

  /* ── 모바일 ── */
  @media (max-width: 767px) {
    .pd2-wrap { padding: 0 !important; }
    .pd2-card {
      border-radius: 0 !important;
      box-shadow: none !important;
      border-left: 0 !important;
      border-right: 0 !important;
    }
    .pd2-top {
      position: sticky;
      top: 0;
      z-index: 10;
      border-radius: 0 !important;
    }
    .pd2-table .k { width: 88px !important; padding: 10px 10px !important; font-size: 11px !important; }
    .pd2-table td { padding: 10px 10px !important; font-size: 12px !important; }
  }
`

function fmtKST(dateIso) {
  const d = new Date(dateIso)
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit',
  })
}

function StatusPill({ v }) {
  if (!v) return <span className="pd2-status-progress">진행중</span>
  if (v === '확인완료') return <span className="pd2-status-done">확인완료</span>
  return <span className="pd2-status-progress">{v}</span>
}

const PPE_COLS = [
  ['helmet', '안전모'],
  ['shoes', '안전화'],
  ['goggles', '보안경'],
  ['gloves', '안전장갑'],
  ['belt', '안전대'],
  ['mask', '마스크'],
  ['earplug', '귀마개'],
  ['vest', '조끼'],
  ['etc', '기타'],
]

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function PpeLedgerTable({ rows = [], editing, onChange }) {
  const safeRows = Array.isArray(rows) ? rows : []

  const setCell = (id, patch) => {
    const next = safeRows.map(r => (r.id === id ? { ...r, ...patch } : r))
    onChange?.(next)
  }

  const toggleItem = (id, key) => {
    const r = safeRows.find(x => x.id === id)
    const selected = { ...(r?.selected || {}) }
    selected[key] = !selected[key]
    setCell(id, { selected })
  }

  const addRow = () => {
    const next = [
      ...safeRows,
      { id: uid(), receiverName: '', giveDate: '', giverName: '', signName: '', selected: {} },
    ]
    onChange?.(next)
  }

  const removeRow = (id) => {
    onChange?.(safeRows.filter(r => r.id !== id))
  }

  const colSpan = editing ? (5 + PPE_COLS.length + 1) : (5 + PPE_COLS.length)

  return (
    <div className="pd2-ledger-wrap">
      <table className="pd2-ledger-table">
        <thead>
          <tr>
            <th>번호</th>
            <th>수령자</th>
            <th>지급일</th>
            <th>지급자</th>
            <th>서명</th>
            {PPE_COLS.map(([k, label]) => <th key={k}>{label}</th>)}
            {editing ? <th>관리</th> : null}
          </tr>
        </thead>

        <tbody>
          {safeRows.map((r, idx) => (
            <tr key={r.id}>
              <td>{idx + 1}</td>

              <td className="left">
                {editing ? (
                  <input
                    className="pd2-ledger-inp"
                    value={r.receiverName || ''}
                    onChange={(e) => setCell(r.id, { receiverName: e.target.value })}
                    placeholder="수령자"
                  />
                ) : (r.receiverName || '-')}
              </td>

              <td>
                {editing ? (
                  <input
                    className="pd2-ledger-inp"
                    type="date"
                    value={r.giveDate || ''}
                    onChange={(e) => setCell(r.id, { giveDate: e.target.value })}
                  />
                ) : (r.giveDate || '-')}
              </td>

              <td className="left">
                {editing ? (
                  <input
                    className="pd2-ledger-inp"
                    value={r.giverName || ''}
                    onChange={(e) => setCell(r.id, { giverName: e.target.value })}
                    placeholder="지급자"
                  />
                ) : (r.giverName || '-')}
              </td>

              <td className="left">
                {editing ? (
                  <input
                    className="pd2-ledger-inp"
                    value={r.signName || ''}
                    onChange={(e) => setCell(r.id, { signName: e.target.value })}
                    placeholder="서명"
                  />
                ) : (r.signName || '-')}
              </td>

              {PPE_COLS.map(([k]) => (
                <td key={k}>
                  {editing ? (
                    <button
                      type="button"
                      className={`pd2-ledger-toggle ${r.selected?.[k] ? 'on' : ''}`}
                      onClick={() => toggleItem(r.id, k)}
                      title={k}
                    >
                      {r.selected?.[k] ? '✓' : ''}
                    </button>
                  ) : (r.selected?.[k] ? '✓' : '')}
                </td>
              ))}

              {editing ? (
                <td>
                  <button type="button" className="pd2-ledger-delbtn" onClick={() => removeRow(r.id)}>
                    삭제
                  </button>
                </td>
              ) : null}
            </tr>
          ))}

          {safeRows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 900 }}>
                지급내역이 없습니다.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {editing ? (
        <div className="pd2-ledger-addbar">
          <button type="button" className="pd2-ledger-addbtn" onClick={addRow}>+ 추가</button>
        </div>
      ) : null}
    </div>
  )
}

export default function PpeDetailPage({ onBack, postId: postIdProp }) {
  const nav = useNavigate()
  const { postId: postIdFromParams } = useParams()
  const postId = postIdProp || postIdFromParams

  const { message } = App.useApp()

  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [draftTitle, setDraftTitle] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const [draftLocation, setDraftLocation] = useState('')

  // ✅ 지급대장 draft (모바일/PC 공통)
  const [draftLedger, setDraftLedger] = useState([])

  // ✅ isMobile을 state로 관리해 resize에도 반응
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const p = await getPpeDetail(postId)
      setPost(p)
      setDraftTitle(p.title || '')
      setDraftBody(p.body || '')
      setDraftLocation(p.location || '')
      // ✅ ledger 항상 배열 보장
      setDraftLedger(Array.isArray(p.ledger) ? p.ledger : [])
    } catch {
      message.error('개인보호구 기록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [postId])

  const createdLine = useMemo(() => {
    if (!post) return ''
    return `현장명 ${post.siteName || '-'}  ·  등록자 ${post.author || '-'}  ·  ${fmtKST(post.createdAt)}`
  }, [post])

  const onClickEditOrSave = async () => {
    if (!editing) { setEditing(true); return }

    if (!draftTitle.trim()) return message.warning('제목을 입력해 주십시오.')
    if (!draftBody.trim()) return message.warning('내용을 입력해 주십시오.')

    setSaving(true)
    try {
      const updated = await updatePpeDetail(postId, {
        title: draftTitle.trim(),
        body: draftBody.trim(),
        location: draftLocation.trim(),
        ledger: draftLedger, // ✅ 지급대장 저장
      })
      setPost(updated)
      // ✅ 저장 후 draftLedger를 서버 응답값으로 동기화
      setDraftLedger(Array.isArray(updated.ledger) ? updated.ledger : [])
      setEditing(false)
      message.success('저장되었습니다.')
    } catch {
      message.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const onCancelEdit = () => {
    setDraftTitle(post?.title || '')
    setDraftBody(post?.body || '')
    setDraftLocation(post?.location || '')
    // ✅ 취소 시 지급대장 원복
    setDraftLedger(Array.isArray(post?.ledger) ? post.ledger : [])
    setEditing(false)
  }

  const onDelete = () => {
    Modal.confirm({
      title: '개인보호구 기록을 삭제하시겠습니까?',
      content: '삭제된 내용은 복구할 수 없습니다.',
      okText: '삭제', okType: 'danger', cancelText: '취소',
      okButtonProps: { style: { borderRadius: 10, fontWeight: 900 } },
      cancelButtonProps: { style: { borderRadius: 10, fontWeight: 900 } },
      onOk: async () => {
        setDeleting(true)
        try {
          await deletePpeDetail(postId)
          message.success('삭제되었습니다.')
          onBack ? onBack() : nav(-1)
        } catch {
          message.error('삭제에 실패했습니다.')
        } finally {
          setDeleting(false)
        }
      },
    })
  }

  if (loading) return <div style={{ padding: 24, color: '#94a3b8', fontWeight: 900 }}>불러오는 중…</div>
  if (!post) return <div style={{ padding: 24, color: '#94a3b8', fontWeight: 900 }}>기록이 없습니다.</div>

  return (
    <>
      <style>{CSS}</style>

      <div className="pd2-wrap">
        <div className="pd2-card">

          {/* ── 상단 바 ── */}
          <div className="pd2-top">
            <div className="pd2-top-side">
              <Button
                icon={<LeftOutlined />}
                onClick={() => onBack ? onBack() : nav(-1)}
                disabled={saving || deleting}
              >
                목록
              </Button>
            </div>

            <div className="pd2-top-title">개인보호구</div>

            <div className="pd2-top-side pd2-top-side-right">
              {editing ? (
                <>
                  <Button size="small" onClick={onCancelEdit} disabled={saving}>취소</Button>
                  <Button size="small" type="primary" onClick={onClickEditOrSave} loading={saving}>저장</Button>
                </>
              ) : (
                <>
                  <Button size="small" type="primary" danger onClick={onDelete} loading={deleting}>삭제</Button>
                  <Button size="small" type="primary" onClick={onClickEditOrSave}>수정</Button>
                </>
              )}
            </div>
          </div>

          {/* ── 정보 테이블 ── */}
          <div className="pd2-body">
            <table className="pd2-table">
              <colgroup>
                <col style={{ width: 110 }} />
                <col />
              </colgroup>
              <tbody>

                <tr>
                  <td className="k">보드타입</td>
                  <td className="v">{post.boardType || '개인보호구'}</td>
                </tr>

                <tr>
                  <td className="k">확인요청</td>
                  <td className="v">
                    {post.confirmStatusText || '-'}
                    {post.confirmRequestText ? <span className="pd2-pill">{post.confirmRequestText}</span> : null}
                  </td>
                </tr>

                <tr>
                  <td className="k">제목</td>
                  <td className="v">
                    {editing ? (
                      <Input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} disabled={saving} placeholder="제목" />
                    ) : (post.title || '-')}
                  </td>
                </tr>

                <tr>
                  <td className="k">위치</td>
                  <td className="v">
                    {editing ? (
                      <Input value={draftLocation} onChange={(e) => setDraftLocation(e.target.value)} disabled={saving} placeholder="위치" />
                    ) : (post.location || '-')}
                  </td>
                </tr>

                <tr>
                  <td className="k">확인상태</td>
                  <td className="v"><StatusPill v={post.status} /></td>
                </tr>

                {post.approvalStatus ? (
                  <tr>
                    <td className="k">결재상태</td>
                    <td className="v"><span className="pd2-status-progress">{post.approvalStatus}</span></td>
                  </tr>
                ) : null}

                <tr>
                  <td className="k">내용*</td>
                  <td className="v">
                    {editing ? (
                      <Input.TextArea value={draftBody} onChange={(e) => setDraftBody(e.target.value)} disabled={saving} placeholder="내용" />
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontWeight: 700 }}>{post.body || ''}</div>
                    )}
                  </td>
                </tr>

                {/* ✅ 지급대장 */}
                <tr>
                  <td className="k">지급대장</td>
                  <td className="v">
                    {isMobile ? (
                      // ✅ 핵심 수정: value를 항상 draftLedger로 고정 (post.ledger로 리셋되는 버그 제거)
                      // ✅ editing prop 전달 → 수정 모드일 때만 추가/수정/삭제 버튼 표시
                      <MobilePpeLedgerCards
                        value={draftLedger}
                        onChange={(next) => setDraftLedger(next)}
                        editing={editing}
                      />
                    ) : (
                      // ✅ PC: editing 상태에 따라 읽기/편집 전환 (기존 동작 유지)
                      <PpeLedgerTable
                        rows={draftLedger}
                        editing={editing}
                        onChange={(next) => setDraftLedger(next)}
                      />
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="k">태그</td>
                  <td className="v">
                    {(post.tags || []).length === 0
                      ? <span style={{ color: '#94a3b8', fontWeight: 800 }}>-</span>
                      : (post.tags || []).map((t) => (
                        <span
                          key={t}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            height: 24,
                            padding: '0 10px',
                            borderRadius: 999,
                            background: '#f1f5f9',
                            border: '1px solid rgba(15,23,42,0.08)',
                            color: '#475569',
                            fontSize: 11,
                            fontWeight: 800,
                            marginRight: 6,
                          }}
                        >
                          {t}
                        </span>
                      ))
                    }
                  </td>
                </tr>

              </tbody>
            </table>

            <div className="pd2-created">{createdLine}</div>
          </div>

        </div>
      </div>
    </>
  )
}