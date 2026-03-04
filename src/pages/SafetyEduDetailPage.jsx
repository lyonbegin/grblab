// src/pages/SafetyEduDetailPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { App, Button, Input, Modal } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import { getEduDetail, updateEduDetail, deleteEduDetail } from '../api/safetyEduDetailApi'

const CSS = `
  .ed2-wrap { background:#f3f6fb; padding:18px 18px 28px; }

  .ed2-card {
    background:#fff;
    border:1px solid rgba(15,23,42,0.08);
    border-radius:16px;
    box-shadow:0 2px 10px rgba(15,23,42,0.06);
    overflow:hidden;
  }

  .ed2-top {
    display:flex; align-items:center; justify-content:space-between; gap:10px;
    padding:12px 16px;
    border-bottom:1px solid rgba(15,23,42,0.06);
    background:#fff;
  }
  .ed2-top-title {
    flex:1; text-align:center;
    font-weight:900; font-size:15px; color:#0f172a; letter-spacing:-0.2px;
  }
  .ed2-top-side { min-width:90px; flex-shrink:0; display:flex; align-items:center; gap:6px; }
  .ed2-top-side-right { justify-content:flex-end; }

  .ed2-top .ant-btn {
    border-radius:12px !important;
    height:34px !important;
    padding:0 14px !important;
    font-weight:900 !important;
    font-size:13px !important;
  }
  .ed2-top .ant-btn-default {
    background:#fff !important;
    border:1px solid #d1d5db !important;
    color:#374151 !important;
  }
  .ed2-top .ant-btn-default:hover {
    background:#f1f5f9 !important;
    border-color:#9ca3af !important;
    color:#0f172a !important;
  }
  .ed2-top .ant-btn-primary:not(.ant-btn-dangerous) {
    background:#2563eb !important;
    border-color:#2563eb !important;
    color:#fff !important;
  }
  .ed2-top .ant-btn-primary:not(.ant-btn-dangerous):hover {
    background:#1d4ed8 !important;
    border-color:#1d4ed8 !important;
  }
  .ed2-top .ant-btn-dangerous,
  .ed2-top .ant-btn-primary.ant-btn-dangerous {
    background:#ef4444 !important;
    border-color:#ef4444 !important;
    color:#fff !important;
  }
  .ed2-top .ant-btn-dangerous:hover,
  .ed2-top .ant-btn-primary.ant-btn-dangerous:hover {
    background:#dc2626 !important;
    border-color:#dc2626 !important;
  }

  .ed2-body { padding:12px 12px 4px; }

  .ed2-table {
    width:100%;
    border-collapse:collapse;
    table-layout:fixed;
    border-top:1px solid rgba(15,23,42,0.06);
  }
  .ed2-table td {
    border-bottom:1px solid rgba(15,23,42,0.06);
    padding:12px 12px;
    vertical-align:top;
    font-size:12px;
    color:#0f172a;
    word-break:break-word;
  }
  .ed2-table .k {
    width:110px;
    background:#f8fafc;
    color:#475569;
    font-weight:900;
    font-size:12px;
  }
  .ed2-table .v { font-weight:800; color:#0f172a; }

  .ed2-created {
    padding:10px 12px 14px;
    color:rgba(17,24,39,0.45);
    font-weight:900;
    font-size:11px;
  }

  .ed2-body .ant-input,
  .ed2-body .ant-input-affix-wrapper,
  .ed2-body textarea {
    border-radius:10px !important;
    border:1px solid rgba(15,23,42,0.12) !important;
    font-size:13px !important;
  }
  .ed2-body .ant-input:focus,
  .ed2-body .ant-input-affix-wrapper:focus-within {
    border-color:#2563eb !important;
    box-shadow:0 0 0 2px rgba(37,99,235,0.10) !important;
  }
  .ed2-body textarea { min-height:160px !important; }

  .ed2-thumb {
    width:80px; height:80px; border-radius:10px;
    object-fit:cover;
    border:1px solid rgba(15,23,42,0.08);
    margin-right:8px;
  }

  @media (max-width: 767px) {
    .ed2-wrap { padding:0 !important; }
    .ed2-card { border-radius:0 !important; box-shadow:none !important; border-left:0 !important; border-right:0 !important; }
    .ed2-top { position:sticky; top:0; z-index:10; border-radius:0 !important; }
    .ed2-table .k { width:88px !important; padding:10px 10px !important; font-size:11px !important; }
    .ed2-table td { padding:10px 10px !important; font-size:12px !important; }
  }
`

export default function SafetyEduDetailPage({ onBack, postId }) {
  const { message } = App.useApp()

  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState(null)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [draftSiteName, setDraftSiteName] = useState('')
  const [draftCategory, setDraftCategory] = useState('')
  const [draftEduFrom, setDraftEduFrom] = useState('')
  const [draftEduTo, setDraftEduTo] = useState('')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [draftWriter, setDraftWriter] = useState('')
  const [draftAttendees, setDraftAttendees] = useState('0')
  const [draftApproval, setDraftApproval] = useState('미결재')
  const [draftConfirm, setDraftConfirm] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const p = await getEduDetail(postId)
      setPost(p)

      setDraftSiteName(p.siteName || '')
      setDraftCategory(p.category || '')
      setDraftEduFrom((p.eduFrom || '').slice(0, 10))
      setDraftEduTo((p.eduTo || '').slice(0, 10))
      setDraftTitle(p.title || '')
      setDraftContent(p.content || '')
      setDraftWriter(p.writer || '')
      setDraftAttendees(String(p.attendees ?? 0))
      setDraftApproval(p.approvalStatus || '미결재')
      setDraftConfirm(p.confirmRequest || '')
    } catch {
      message.error('안전교육 일지를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [postId])

  const createdLine = useMemo(() => {
    if (!post) return ''
    return `현장명 ${post.siteName || '-'}  ·  등록자 ${post.writer || '-'}  ·  ${post.createdAtLabel || '-'}`
  }, [post])

  const onClickEditOrSave = async () => {
    if (!editing) { setEditing(true); return }
    if (!draftTitle.trim()) return message.warning('제목을 입력해 주십시오.')
    setSaving(true)
    try {
      const updated = await updateEduDetail(postId, {
        siteName: draftSiteName.trim(),
        category: draftCategory.trim(),
        eduFrom: draftEduFrom ? `${draftEduFrom}T00:00:00Z` : '',
        eduTo: draftEduTo ? `${draftEduTo}T00:00:00Z` : '',
        title: draftTitle.trim(),
        content: draftContent,
        writer: draftWriter.trim(),
        attendees: Number(draftAttendees || 0),
        approvalStatus: draftApproval,
        confirmRequest: draftConfirm,
        hasAttachment: (post?.attachments || []).length > 0,
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
    if (!post) return
    setDraftSiteName(post.siteName || '')
    setDraftCategory(post.category || '')
    setDraftEduFrom((post.eduFrom || '').slice(0, 10))
    setDraftEduTo((post.eduTo || '').slice(0, 10))
    setDraftTitle(post.title || '')
    setDraftContent(post.content || '')
    setDraftWriter(post.writer || '')
    setDraftAttendees(String(post.attendees ?? 0))
    setDraftApproval(post.approvalStatus || '미결재')
    setDraftConfirm(post.confirmRequest || '')
    setEditing(false)
  }

  const onDelete = () => {
    Modal.confirm({
      title: '안전교육 일지를 삭제하시겠습니까?',
      content: '삭제된 내용은 복구할 수 없습니다.',
      okText: '삭제',
      okType: 'danger',
      cancelText: '취소',
      okButtonProps: { style: { borderRadius: 10, fontWeight: 900 } },
      cancelButtonProps: { style: { borderRadius: 10, fontWeight: 900 } },
      onOk: async () => {
        setDeleting(true)
        try {
          await deleteEduDetail(postId)
          message.success('삭제되었습니다.')
          onBack && onBack()
        } catch {
          message.error('삭제에 실패했습니다.')
        } finally {
          setDeleting(false)
        }
      },
    })
  }

  if (loading) return <div style={{ padding: 24, color:'#94a3b8', fontWeight: 900 }}>불러오는 중…</div>
  if (!post) return <div style={{ padding: 24, color:'#94a3b8', fontWeight: 900 }}>안전교육 일지가 없습니다.</div>

  return (
    <>
      <style>{CSS}</style>

      <div className="ed2-wrap">
        <div className="ed2-card">

          <div className="ed2-top">
            <div className="ed2-top-side">
              <Button
                icon={<LeftOutlined />}
                onClick={() => onBack && onBack()}
                disabled={saving || deleting}
              >
                목록
              </Button>
            </div>

            <div className="ed2-top-title">안전보건 교육일지</div>

            <div className="ed2-top-side ed2-top-side-right">
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

          <div className="ed2-body">
            <table className="ed2-table">
              <colgroup>
                <col style={{ width: 110 }} />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <td className="k">현장명</td>
                  <td className="v">
                    {editing ? (
                      <Input value={draftSiteName} onChange={(e) => setDraftSiteName(e.target.value)} disabled={saving} placeholder="현장명" />
                    ) : (post.siteName || '-')}
                  </td>
                </tr>

                <tr>
                  <td className="k">교육구분</td>
                  <td className="v">
                    {editing ? (
                      <Input value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)} disabled={saving} placeholder="정기교육/특별교육/신규교육" />
                    ) : (post.category || '-')}
                  </td>
                </tr>

                <tr>
                  <td className="k">교육일시</td>
                  <td className="v">
                    {editing ? (
                      <div style={{ display:'flex', gap: 8, flexWrap:'wrap', alignItems:'center' }}>
                        <Input type="date" value={draftEduFrom} onChange={(e) => setDraftEduFrom(e.target.value)} disabled={saving} style={{ maxWidth: 180 }} />
                        <span style={{ fontWeight: 900, color:'rgba(17,24,39,0.45)' }}>~</span>
                        <Input type="date" value={draftEduTo} onChange={(e) => setDraftEduTo(e.target.value)} disabled={saving} style={{ maxWidth: 180 }} />
                      </div>
                    ) : (
                      <span style={{ color:'#2563eb', fontWeight: 900 }}>{post.eduRangeLabel || '-'}</span>
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="k">교육제목</td>
                  <td className="v">
                    {editing ? (
                      <Input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} disabled={saving} placeholder="교육제목" />
                    ) : (post.title || '-')}
                  </td>
                </tr>

                <tr>
                  <td className="k">등록자</td>
                  <td className="v">
                    {editing ? (
                      <Input value={draftWriter} onChange={(e) => setDraftWriter(e.target.value)} disabled={saving} placeholder="등록자" />
                    ) : (post.writer || '-')}
                  </td>
                </tr>

                <tr>
                  <td className="k">참석인원</td>
                  <td className="v">
                    {editing ? (
                      <Input value={draftAttendees} onChange={(e) => setDraftAttendees(e.target.value)} disabled={saving} placeholder="숫자" />
                    ) : `${Number(post.attendees || 0)}명`}
                  </td>
                </tr>

                <tr>
                  <td className="k">확인요청</td>
                  <td className="v">
                    {editing ? (
                      <Input value={draftConfirm} onChange={(e) => setDraftConfirm(e.target.value)} disabled={saving} placeholder="예: 승인" />
                    ) : (post.confirmRequest || '-')}
                  </td>
                </tr>

                <tr>
                  <td className="k">결재상태</td>
                  <td className="v">
                    {editing ? (
                      <Input value={draftApproval} onChange={(e) => setDraftApproval(e.target.value)} disabled={saving} placeholder="미결재/결재중/결재완료" />
                    ) : (post.approvalStatus || '미결재')}
                  </td>
                </tr>

                <tr>
                  <td className="k">교육내용</td>
                  <td className="v">
                    {editing ? (
                      <Input.TextArea value={draftContent} onChange={(e) => setDraftContent(e.target.value)} disabled={saving} placeholder="교육내용" />
                    ) : (
                      <div style={{ whiteSpace:'pre-wrap', lineHeight: 1.7, fontWeight: 700 }}>
                        {post.content || '-'}
                      </div>
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="k">첨부파일</td>
                  <td className="v">
                    {(post.attachments || []).length === 0
                      ? <span style={{ color:'#94a3b8', fontWeight: 900 }}>-</span>
                      : (post.attachments || []).map((a) => (
                        <img key={a.id} className="ed2-thumb" src={a.url} alt={a.name || '첨부'} />
                      ))
                    }
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="ed2-created">{createdLine}</div>
          </div>

        </div>
      </div>
    </>
  )
}