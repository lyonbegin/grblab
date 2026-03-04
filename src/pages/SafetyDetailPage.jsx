// src/pages/SafetyDetailPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Input, Modal } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import { getSafetyDetail, updateSafetyDetail, deleteSafetyDetail } from '../api/safetyDetailApi'

const CSS = `
  .sd2-wrap { background: #f3f6fb; padding: 18px 18px 28px; }

  .sd2-card {
    background: #fff;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 16px;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
    overflow: hidden;
  }

  /* ── 상단 바 ── */
  .sd2-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(15,23,42,0.06);
    background: #fff;
  }
  .sd2-top-title {
    flex: 1;
    text-align: center;
    font-weight: 900;
    font-size: 15px;
    color: #0f172a;
    letter-spacing: -0.2px;
  }
  .sd2-top-side {
    min-width: 90px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .sd2-top-side-right { justify-content: flex-end; }

  /* 버튼 공통 */
  .sd2-top .ant-btn {
    border-radius: 12px !important;
    height: 34px !important;
    padding: 0 14px !important;
    font-weight: 900 !important;
    font-size: 13px !important;
  }
  .sd2-top .ant-btn-default {
    background: #ffffff !important;
    border: 1px solid #d1d5db !important;
    color: #374151 !important;
  }
  .sd2-top .ant-btn-default:hover {
    background: #f1f5f9 !important;
    border-color: #9ca3af !important;
    color: #0f172a !important;
  }
  .sd2-top .ant-btn-primary:not(.ant-btn-dangerous) {
    background: #2563eb !important;
    border-color: #2563eb !important;
    color: #fff !important;
  }
  .sd2-top .ant-btn-primary:not(.ant-btn-dangerous):hover {
    background: #1d4ed8 !important;
    border-color: #1d4ed8 !important;
  }
  .sd2-top .ant-btn-dangerous,
  .sd2-top .ant-btn-primary.ant-btn-dangerous {
    background: #ef4444 !important;
    border-color: #ef4444 !important;
    color: #fff !important;
  }
  .sd2-top .ant-btn-dangerous:hover,
  .sd2-top .ant-btn-primary.ant-btn-dangerous:hover {
    background: #dc2626 !important;
    border-color: #dc2626 !important;
  }

  /* ── 정보 테이블 ── */
  .sd2-body { padding: 12px 12px 4px; }

  .sd2-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    border-top: 1px solid rgba(15,23,42,0.06);
  }
  .sd2-table td {
    border-bottom: 1px solid rgba(15,23,42,0.06);
    padding: 12px 12px;
    vertical-align: top;
    font-size: 12px;
    color: #0f172a;
    word-break: break-word;
  }
  .sd2-table .k {
    width: 110px;
    background: #f8fafc;
    color: #475569;
    font-weight: 900;
    font-size: 12px;
  }
  .sd2-table .v { font-weight: 800; color: #0f172a; }

  .sd2-pill {
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

  .sd2-link { color: #2563eb; font-weight: 900; }

  .sd2-created {
    padding: 10px 12px 14px;
    color: rgba(17,24,39,0.45);
    font-weight: 900;
    font-size: 11px;
  }

  /* 입력 스타일 */
  .sd2-body .ant-input,
  .sd2-body .ant-input-affix-wrapper,
  .sd2-body textarea {
    border-radius: 10px !important;
    border: 1px solid rgba(15,23,42,0.12) !important;
    font-size: 13px !important;
  }
  .sd2-body .ant-input:focus,
  .sd2-body .ant-input-affix-wrapper:focus-within {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 2px rgba(37,99,235,0.10) !important;
  }
  .sd2-body textarea { min-height: 140px !important; }

  /* 썸네일 */
  .sd2-thumb {
    width: 80px;
    height: 80px;
    border-radius: 10px;
    object-fit: cover;
    border: 1px solid rgba(15,23,42,0.08);
    margin-right: 8px;
  }

  /* 상태 pill */
  .sd2-status-done {
    height: 22px; padding: 0 10px; border-radius: 999px;
    font-size: 11px; font-weight: 900;
    display: inline-flex; align-items: center;
    background: #f1f5f9; border: 1px solid rgba(15,23,42,0.08); color: #475569;
  }
  .sd2-status-progress {
    height: 22px; padding: 0 10px; border-radius: 999px;
    font-size: 11px; font-weight: 900;
    display: inline-flex; align-items: center;
    background: rgba(37,99,235,0.10); border: 1px solid rgba(37,99,235,0.25); color: #2563eb;
  }

  /* ── 모바일 ── */
  @media (max-width: 767px) {
    .sd2-wrap { padding: 0 !important; }
    .sd2-card {
      border-radius: 0 !important;
      box-shadow: none !important;
      border-left: 0 !important;
      border-right: 0 !important;
    }
    .sd2-top {
      position: sticky;
      top: 0;
      z-index: 10;
      border-radius: 0 !important;
    }
    .sd2-table .k { width: 88px !important; padding: 10px 10px !important; font-size: 11px !important; }
    .sd2-table td { padding: 10px 10px !important; font-size: 12px !important; }
  }
`

function fmtKST(dateIso) {
  const d = new Date(dateIso)
  return d.toLocaleString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' })
}

function StatusPill({ v }) {
  if (!v) return null
  if (v === '확인완료') return <span className="sd2-status-done">확인완료</span>
  return <span className="sd2-status-progress">{v}</span>
}

export default function SafetyDetailPage({ onBack, postId: postIdProp }) {
  const nav = useNavigate()
  const { siteId, postId: postIdFromParams } = useParams()
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
  const [draftDueFrom, setDraftDueFrom] = useState('')
  const [draftDueTo, setDraftDueTo] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const p = await getSafetyDetail(postId)
      setPost(p)
      setDraftTitle(p.title || '')
      setDraftBody(p.body || '')
      setDraftLocation(p.location || '')
      setDraftDueFrom(p.dueFrom || '')
      setDraftDueTo(p.dueTo || '')
    } catch {
      message.error('안전신고를 불러오지 못했습니다.')
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
      const updated = await updateSafetyDetail(postId, {
        title: draftTitle.trim(),
        body: draftBody.trim(),
        location: draftLocation.trim(),
        dueFrom: draftDueFrom.trim(),
        dueTo: draftDueTo.trim(),
      })
      setPost(updated)
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
    setDraftDueFrom(post?.dueFrom || '')
    setDraftDueTo(post?.dueTo || '')
    setEditing(false)
  }

  const onDelete = () => {
    Modal.confirm({
      title: '안전신고를 삭제하시겠습니까?',
      content: '삭제된 내용은 복구할 수 없습니다.',
      okText: '삭제', okType: 'danger', cancelText: '취소',
      okButtonProps: { style: { borderRadius: 10, fontWeight: 900 } },
      cancelButtonProps: { style: { borderRadius: 10, fontWeight: 900 } },
      onOk: async () => {
        setDeleting(true)
        try {
          await deleteSafetyDetail(postId)
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
  if (!post) return <div style={{ padding: 24, color: '#94a3b8', fontWeight: 900 }}>안전신고가 없습니다.</div>

  return (
    <>
      <style>{CSS}</style>

      <div className="sd2-wrap">
        <div className="sd2-card">

          {/* ── 상단 바 ── */}
          <div className="sd2-top">
            <div className="sd2-top-side">
              <Button
                icon={<LeftOutlined />}
                onClick={() => onBack ? onBack() : nav(-1)}
                disabled={saving || deleting}
              >
                목록
              </Button>
            </div>

            <div className="sd2-top-title">안전신고</div>

            <div className="sd2-top-side sd2-top-side-right">
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
          <div className="sd2-body">
            <table className="sd2-table">
              <colgroup>
                <col style={{ width: 110 }} />
                <col />
              </colgroup>
              <tbody>

                <tr>
                  <td className="k">보드타입</td>
                  <td className="v">{post.boardType || '안전신고'}</td>
                </tr>

                <tr>
                  <td className="k">확인요청</td>
                  <td className="v">
                    {post.confirmStatusText || '-'}
                    {post.confirmRequestText ? <span className="sd2-pill">{post.confirmRequestText}</span> : null}
                  </td>
                </tr>

                <tr>
                  <td className="k">제목</td>
                  <td className="v">
                    {editing ? (
                      <Input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} disabled={saving} placeholder="제목" />
                    ) : post.title}
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
                  <td className="k">기한일</td>
                  <td className="v">
                    {editing ? (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Input type="date" value={draftDueFrom} onChange={(e) => setDraftDueFrom(e.target.value)} disabled={saving} style={{ maxWidth: 160 }} />
                        <span style={{ fontWeight: 900, color: 'rgba(17,24,39,0.45)' }}>~</span>
                        <Input type="date" value={draftDueTo} onChange={(e) => setDraftDueTo(e.target.value)} disabled={saving} style={{ maxWidth: 160 }} />
                      </div>
                    ) : (
                      <span className="sd2-link">{post.dueRangeLabel || '-'}</span>
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="k">확인상태</td>
                  <td className="v"><StatusPill v={post.status} /></td>
                </tr>

                <tr>
                  <td className="k">완료보고</td>
                  <td className="v">
                    {post.doneReport
                      ? <span className="sd2-status-progress">{post.doneReport}</span>
                      : <span style={{ color: '#94a3b8', fontWeight: 800 }}>-</span>
                    }
                  </td>
                </tr>

                {post.approvalStatus ? (
                  <tr>
                    <td className="k">결재상태</td>
                    <td className="v"><span className="sd2-status-progress">{post.approvalStatus}</span></td>
                  </tr>
                ) : null}

                <tr>
                  <td className="k">내용*</td>
                  <td className="v">
                    {editing ? (
                      <Input.TextArea value={draftBody} onChange={(e) => setDraftBody(e.target.value)} disabled={saving} placeholder="내용" />
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontWeight: 700 }}>{post.body}</div>
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="k">파일첨부</td>
                  <td className="v">
                    {(post.attachments || []).length === 0
                      ? <span style={{ color: '#94a3b8', fontWeight: 900 }}>-</span>
                      : (post.attachments || []).map((a) => (
                          <img key={a.id} className="sd2-thumb" src={a.url} alt={a.name || '첨부'} />
                        ))
                    }
                  </td>
                </tr>

                <tr>
                  <td className="k">태그</td>
                  <td className="v">
                    {(post.tags || []).length === 0
                      ? <span style={{ color: '#94a3b8', fontWeight: 800 }}>-</span>
                      : (post.tags || []).map((t) => (
                          <span key={t} style={{
                            display: 'inline-flex', alignItems: 'center',
                            height: 24, padding: '0 10px', borderRadius: 999,
                            background: '#f1f5f9', border: '1px solid rgba(15,23,42,0.08)',
                            color: '#475569', fontSize: 11, fontWeight: 800, marginRight: 6,
                          }}>{t}</span>
                        ))
                    }
                  </td>
                </tr>

              </tbody>
            </table>

            <div className="sd2-created">{createdLine}</div>
          </div>

        </div>
      </div>
    </>
  )
}