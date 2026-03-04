// src/pages/BoardDetailPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Input, Modal } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import { getBoardDetail, updateBoardDetail, deleteBoardDetail } from '../api/boardDetailApi'

const CSS = `
  .bd-wrap { background:#f3f6fb; padding: 18px 18px 28px; }

  .bd-card{
    background:#fff;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 16px;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
    overflow:hidden;
  }

  /* ── 상단 바 ── */
  .bd-top{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap: 10px;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(15,23,42,0.06);
    background:#fff;
  }
  .bd-top-title{
    flex: 1;
    text-align:center;
    font-weight: 900;
    font-size: 15px;
    color:#0f172a;
    letter-spacing: -0.2px;
  }
  .bd-top-side{
    min-width: 90px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .bd-top-side-right { justify-content: flex-end; }

  /* 버튼 공통 */
  .bd-top .ant-btn {
    border-radius: 12px !important;
    height: 34px !important;
    padding: 0 14px !important;
    font-weight: 900 !important;
    font-size: 13px !important;
  }
  .bd-top .ant-btn-default {
    background: #ffffff !important;
    border: 1px solid #d1d5db !important;
    color: #374151 !important;
  }
  .bd-top .ant-btn-default:hover {
    background: #f1f5f9 !important;
    border-color: #9ca3af !important;
    color: #0f172a !important;
  }
  .bd-top .ant-btn-primary:not(.ant-btn-dangerous) {
    background: #2563eb !important;
    border-color: #2563eb !important;
    color: #fff !important;
  }
  .bd-top .ant-btn-primary:not(.ant-btn-dangerous):hover {
    background: #1d4ed8 !important;
    border-color: #1d4ed8 !important;
  }
  .bd-top .ant-btn-dangerous,
  .bd-top .ant-btn-primary.ant-btn-dangerous {
    background: #ef4444 !important;
    border-color: #ef4444 !important;
    color: #fff !important;
  }
  .bd-top .ant-btn-dangerous:hover,
  .bd-top .ant-btn-primary.ant-btn-dangerous:hover {
    background: #dc2626 !important;
    border-color: #dc2626 !important;
  }

  /* ── 정보 테이블 ── */
  .bd-body{ padding: 12px 12px 4px; }

  .bd-table{
    width:100%;
    border-collapse: collapse;
    table-layout: fixed;
    border-top: 1px solid rgba(15,23,42,0.06);
  }
  .bd-table td{
    border-bottom: 1px solid rgba(15,23,42,0.06);
    padding: 12px 12px;
    vertical-align: top;
    font-size: 12px;
    color:#0f172a;
    word-break: break-word;
  }
  .bd-table .k{
    width: 110px;
    background: #f8fafc;
    color: #475569;
    font-weight: 900;
    font-size: 12px;
  }
  .bd-table .v{ font-weight: 800; color:#0f172a; }

  .bd-pill{
    display:inline-flex;
    align-items:center;
    height: 22px;
    padding: 0 10px;
    border-radius: 999px;
    background: rgba(37,99,235,0.10);
    border: 1px solid rgba(37,99,235,0.25);
    color:#2563eb;
    font-weight: 900;
    font-size: 11px;
    margin-left: 8px;
    white-space: nowrap;
  }

  .bd-link{ color: #2563eb; font-weight: 900; }

  .bd-created{
    padding: 10px 12px 14px;
    color: rgba(17,24,39,0.45);
    font-weight: 900;
    font-size: 11px;
  }

  /* 편집 입력 톤 */
  .bd-body .ant-input,
  .bd-body .ant-input-affix-wrapper,
  .bd-body textarea{
    border-radius: 10px !important;
    border: 1px solid rgba(15, 23, 42, 0.12) !important;
    font-size: 13px !important;
  }
  .bd-body .ant-input:focus,
  .bd-body .ant-input-affix-wrapper:focus-within {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 2px rgba(37,99,235,0.10) !important;
  }
  .bd-body textarea{ min-height: 140px !important; }

  /* ── 모바일 ── */
  @media (max-width: 767px){
    .bd-wrap{ padding: 0 !important; }
    .bd-card{
      border-radius: 0 !important;
      box-shadow: none !important;
      border-left: 0 !important;
      border-right: 0 !important;
    }
    .bd-top{
      position: sticky;
      top: 0;
      z-index: 10;
      border-radius: 0 !important;
    }
    .bd-table .k{ width: 88px !important; padding: 10px 10px !important; font-size: 11px !important; }
    .bd-table td{ padding: 10px 10px !important; font-size: 12px !important; }
  }
`

function fmtKST(dateIso) {
  const d = new Date(dateIso)
  return d.toLocaleString('ko-KR', { year:'numeric', month:'numeric', day:'numeric', hour:'numeric', minute:'2-digit', second:'2-digit' })
}

export default function BoardDetailPage({ onBack, postId: postIdProp }) {
  const nav = useNavigate()
  const { siteId, postId: postIdFromParams } = useParams()
  const postId = postIdProp || postIdFromParams

  // ✅ antd v5 message 컨텍스트
  const { message } = App.useApp()

  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [draftTitle, setDraftTitle] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const [draftDueFrom, setDraftDueFrom] = useState('')
  const [draftDueTo, setDraftDueTo] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const p = await getBoardDetail(postId)
      setPost(p)
      setDraftTitle(p.title || '')
      setDraftBody(p.body || '')
      setDraftDueFrom(p.dueFrom || '')
      setDraftDueTo(p.dueTo || '')
    } catch {
      message.error('게시글을 불러오지 못했습니다.')
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
      const updated = await updateBoardDetail(postId, {
        title: draftTitle.trim(),
        body: draftBody.trim(),
        dueFrom: (draftDueFrom || '').trim(),
        dueTo: (draftDueTo || '').trim(),
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
    setDraftDueFrom(post?.dueFrom || '')
    setDraftDueTo(post?.dueTo || '')
    setEditing(false)
  }

  // ✅ SiteDetailPage 패턴 동일
  const onDelete = () => {
    Modal.confirm({
      title: '게시글을 삭제하시겠습니까?',
      content: '삭제된 게시글은 복구할 수 없습니다.',
      okText: '삭제', okType: 'danger', cancelText: '취소',
      okButtonProps: { style: { borderRadius: 10, fontWeight: 900 } },
      cancelButtonProps: { style: { borderRadius: 10, fontWeight: 900 } },
      onOk: async () => {
        setDeleting(true)
        try {
          await deleteBoardDetail(postId)
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
  if (!post) return <div style={{ padding: 24, color: '#94a3b8', fontWeight: 900 }}>게시글이 없습니다.</div>

  const boardType = post?.boardType || '공사보드'
  const confirmStatusText = post?.confirmStatusText || ''
  const confirmRequestText = post?.confirmRequestText || '확인요청'

  return (
    <>
      <style>{CSS}</style>

      <div className="bd-wrap">
        <div className="bd-card">

          {/* ── 상단 바 ── */}
          <div className="bd-top">
            <div className="bd-top-side">
              <Button
                icon={<LeftOutlined />}
                onClick={() => onBack ? onBack() : nav(-1)}
                disabled={saving || deleting}
              >
                목록
              </Button>
            </div>

            <div className="bd-top-title">{boardType}</div>

            <div className="bd-top-side bd-top-side-right">
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
          <div className="bd-body">
            <table className="bd-table">
              <colgroup>
                <col style={{ width: 110 }} />
                <col />
              </colgroup>

              <tbody>
                {/* ✅ 4열 깨짐 수정: 2행으로 분리 */}
                <tr>
                  <td className="k">보드타입</td>
                  <td className="v">{boardType}</td>
                </tr>

                <tr>
                  <td className="k">확인요청</td>
                  <td className="v">
                    {confirmStatusText || '-'}
                    {confirmRequestText ? <span className="bd-pill">{confirmRequestText}</span> : null}
                  </td>
                </tr>

                <tr>
                  <td className="k">제목</td>
                  <td className="v">
                    {editing ? (
                      <Input
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        disabled={saving}
                        placeholder="제목"
                      />
                    ) : post.title}
                  </td>
                </tr>

                <tr>
                  <td className="k">기한일</td>
                  <td className="v">
                    {editing ? (
                      <div style={{ display:'flex', gap: 8, flexWrap:'wrap', alignItems:'center' }}>
                        <Input
                          type="date"
                          value={draftDueFrom}
                          onChange={(e) => setDraftDueFrom(e.target.value)}
                          disabled={saving}
                          style={{ maxWidth: 160 }}
                        />
                        <span style={{ fontWeight: 900, color:'rgba(17,24,39,0.45)' }}>~</span>
                        <Input
                          type="date"
                          value={draftDueTo}
                          onChange={(e) => setDraftDueTo(e.target.value)}
                          disabled={saving}
                          style={{ maxWidth: 160 }}
                        />
                      </div>
                    ) : (
                      <span className="bd-link">{post.dueRangeLabel || '-'}</span>
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="k">내용*</td>
                  <td className="v">
                    {editing ? (
                      <Input.TextArea
                        value={draftBody}
                        onChange={(e) => setDraftBody(e.target.value)}
                        disabled={saving}
                        placeholder="내용"
                      />
                    ) : (
                      <div style={{ whiteSpace:'pre-wrap', lineHeight: 1.7, fontWeight: 700 }}>
                        {post.body}
                      </div>
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="k">파일첨부</td>
                  <td className="v">
                    {(post.attachments || []).length === 0
                      ? <span style={{ color:'#94a3b8', fontWeight: 900 }}>-</span>
                      : (post.attachments || []).map((a) => (
                          <img key={a.id} src={a.url} alt={a.name || '첨부'}
                            style={{ maxWidth: 80, borderRadius: 8, marginRight: 6 }} />
                        ))
                    }
                  </td>
                </tr>

                <tr>
                  <td className="k">태그</td>
                  <td className="v">
                    {(post.tags || []).length === 0
                      ? <span style={{ color:'#94a3b8', fontWeight: 800 }}>-</span>
                      : (post.tags || []).map((t) => (
                          <span key={t} style={{
                            display:'inline-flex', alignItems:'center',
                            height: 24, padding: '0 10px', borderRadius: 999,
                            background: '#f1f5f9', border: '1px solid rgba(15,23,42,0.08)',
                            color: '#475569', fontSize: 11, fontWeight: 800,
                            marginRight: 6,
                          }}>{t}</span>
                        ))
                    }
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="bd-created">{createdLine}</div>
          </div>

        </div>
      </div>
    </>
  )
}