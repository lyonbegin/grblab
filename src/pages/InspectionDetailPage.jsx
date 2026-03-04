// src/pages/InspectionDetailPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Input, Modal } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import { getInspectionDetail, updateInspectionDetail, deleteInspectionDetail } from '../api/inspectionDetailApi'

const CSS = `
  .id2-wrap { background:#f3f6fb; padding:18px 18px 28px; }
  .id2-card{
    background:#fff; border:1px solid rgba(15,23,42,0.08);
    border-radius:16px; box-shadow:0 2px 10px rgba(15,23,42,0.06);
    overflow:hidden;
  }

  .id2-top{
    display:flex; align-items:center; justify-content:space-between; gap:10px;
    padding:12px 16px; border-bottom:1px solid rgba(15,23,42,0.06); background:#fff;
  }
  .id2-top-title{ flex:1; text-align:center; font-weight:900; font-size:15px; color:#0f172a; letter-spacing:-0.2px; }
  .id2-top-side{ min-width:90px; flex-shrink:0; display:flex; align-items:center; gap:6px; }
  .id2-top-side-right{ justify-content:flex-end; }

  .id2-top .ant-btn{
    border-radius:12px !important; height:34px !important; padding:0 14px !important;
    font-weight:900 !important; font-size:13px !important;
  }
  .id2-top .ant-btn-default{
    background:#fff !important; border:1px solid #d1d5db !important; color:#374151 !important;
  }
  .id2-top .ant-btn-default:hover{
    background:#f1f5f9 !important; border-color:#9ca3af !important; color:#0f172a !important;
  }
  .id2-top .ant-btn-primary:not(.ant-btn-dangerous){
    background:#2563eb !important; border-color:#2563eb !important; color:#fff !important;
  }
  .id2-top .ant-btn-primary:not(.ant-btn-dangerous):hover{
    background:#1d4ed8 !important; border-color:#1d4ed8 !important;
  }
  .id2-top .ant-btn-dangerous,
  .id2-top .ant-btn-primary.ant-btn-dangerous{
    background:#ef4444 !important; border-color:#ef4444 !important; color:#fff !important;
  }
  .id2-top .ant-btn-dangerous:hover,
  .id2-top .ant-btn-primary.ant-btn-dangerous:hover{
    background:#dc2626 !important; border-color:#dc2626 !important;
  }

  .id2-body{ padding:12px 12px 4px; }
  .id2-table{
    width:100%; border-collapse:collapse; table-layout:fixed;
    border-top:1px solid rgba(15,23,42,0.06);
  }
  .id2-table td{
    border-bottom:1px solid rgba(15,23,42,0.06);
    padding:12px 12px; vertical-align:top; font-size:12px; color:#0f172a; word-break:break-word;
  }
  .id2-table .k{
    width:110px; background:#f8fafc; color:#475569; font-weight:900; font-size:12px;
  }
  .id2-table .v{ font-weight:800; color:#0f172a; }

  .id2-link{ color:#2563eb; font-weight:900; }

  .id2-created{ padding:10px 12px 14px; color:rgba(17,24,39,0.45); font-weight:900; font-size:11px; }

  .id2-body .ant-input,
  .id2-body .ant-input-affix-wrapper,
  .id2-body textarea{
    border-radius:10px !important; border:1px solid rgba(15,23,42,0.12) !important; font-size:13px !important;
  }
  .id2-body .ant-input:focus,
  .id2-body .ant-input-affix-wrapper:focus-within{
    border-color:#2563eb !important; box-shadow:0 0 0 2px rgba(37,99,235,0.10) !important;
  }
  .id2-body textarea{ min-height:160px !important; }

  .id2-thumb{
    width:120px; height:90px; border-radius:10px; object-fit:cover;
    border:1px solid rgba(15,23,42,0.08); margin-right:8px; margin-bottom:8px;
  }

  .id2-pill{
    display:inline-flex; align-items:center; height:22px; padding:0 10px; border-radius:999px;
    background:rgba(37,99,235,0.10); border:1px solid rgba(37,99,235,0.25); color:#2563eb;
    font-weight:900; font-size:11px; white-space:nowrap;
  }

  .id2-grid{
    display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:8px;
  }
  .id2-part{
    border:1px solid rgba(15,23,42,0.08); border-radius:12px; overflow:hidden; background:#fff;
  }
  .id2-part-head{
    background:#f8fafc; padding:10px 10px; font-weight:900; font-size:12px; color:#475569;
    border-bottom:1px solid rgba(15,23,42,0.06);
  }
  .id2-part table{ width:100%; border-collapse:collapse; }
  .id2-part td{
    border-bottom:1px solid rgba(15,23,42,0.06);
    padding:8px 10px; font-size:12px; font-weight:800; color:#0f172a;
  }
  .id2-part td:nth-child(1){ width:54px; color:#64748b; font-weight:900; }
  .id2-part td:nth-child(3){ width:88px; color:#475569; font-weight:900; }

  @media (max-width: 767px){
    .id2-wrap{ padding:0 !important; }
    .id2-card{ border-radius:0 !important; box-shadow:none !important; border-left:0 !important; border-right:0 !important; }
    .id2-top{ position:sticky; top:0; z-index:10; border-radius:0 !important; }
    .id2-table .k{ width:88px !important; padding:10px 10px !important; font-size:11px !important; }
    .id2-table td{ padding:10px 10px !important; font-size:12px !important; }
    .id2-grid{ grid-template-columns:1fr; }
  }
`

export default function InspectionDetailPage({ onBack, postId: postIdProp }) {
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
  const [draftSiteName, setDraftSiteName] = useState('')
  const [draftFrom, setDraftFrom] = useState('')
  const [draftTo, setDraftTo] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const p = await getInspectionDetail(postId)
      setPost(p)
      setDraftTitle(p.title || '')
      setDraftBody(p.body || '')
      setDraftSiteName(p.siteName || '')
      setDraftFrom((p.checkAtFrom || '').slice(0, 16))
      setDraftTo((p.checkAtTo || '').slice(0, 16))
    } catch {
      message.error('안전점검을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [postId])

  const createdLine = useMemo(() => {
    if (!post) return ''
    return `현장명 ${post.siteName || '-'}  ·  등록자 ${post.author || '-'}  ·  ${post.createdAtLabel || ''}`
  }, [post])

  const onClickEditOrSave = async () => {
    if (!editing) { setEditing(true); return }
    if (!draftTitle.trim()) return message.warning('제목을 입력해 주십시오.')
    if (!draftBody.trim()) return message.warning('내용을 입력해 주십시오.')
    setSaving(true)
    try {
      const updated = await updateInspectionDetail(postId, {
        title: draftTitle.trim(),
        body: draftBody.trim(),
        siteName: draftSiteName.trim(),
        checkAtFrom: draftFrom ? `${draftFrom}:00` : '',
        checkAtTo: draftTo ? `${draftTo}:00` : '',
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
    setDraftSiteName(post?.siteName || '')
    setDraftFrom((post?.checkAtFrom || '').slice(0, 16))
    setDraftTo((post?.checkAtTo || '').slice(0, 16))
    setEditing(false)
  }

  const onDelete = () => {
    Modal.confirm({
      title: '안전점검을 삭제하시겠습니까?',
      content: '삭제된 내용은 복구할 수 없습니다.',
      okText: '삭제', okType: 'danger', cancelText: '취소',
      okButtonProps: { style: { borderRadius: 10, fontWeight: 900 } },
      cancelButtonProps: { style: { borderRadius: 10, fontWeight: 900 } },
      onOk: async () => {
        setDeleting(true)
        try {
          await deleteInspectionDetail(postId)
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
  if (!post) return <div style={{ padding: 24, color: '#94a3b8', fontWeight: 900 }}>안전점검이 없습니다.</div>

  return (
    <>
      <style>{CSS}</style>

      <div className="id2-wrap">
        <div className="id2-card">

          <div className="id2-top">
            <div className="id2-top-side">
              <Button
                icon={<LeftOutlined />}
                onClick={() => onBack ? onBack() : nav(-1)}
                disabled={saving || deleting}
              >
                목록
              </Button>
            </div>

            <div className="id2-top-title">안전점검 일지</div>

            <div className="id2-top-side id2-top-side-right">
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

          <div className="id2-body">
            <table className="id2-table">
              <colgroup>
                <col style={{ width: 110 }} />
                <col />
              </colgroup>
              <tbody>

                <tr>
                  <td className="k">구분</td>
                  <td className="v">{post.checkType || '안전점검'} <span className="id2-pill">{post.boardType || '일지'}</span></td>
                </tr>

                <tr>
                  <td className="k">점검일시</td>
                  <td className="v">
                    {editing ? (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Input type="datetime-local" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} disabled={saving} style={{ maxWidth: 220 }} />
                        <span style={{ fontWeight: 900, color: 'rgba(17,24,39,0.45)' }}>~</span>
                        <Input type="datetime-local" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} disabled={saving} style={{ maxWidth: 220 }} />
                      </div>
                    ) : (
                      <span className="id2-link">{post.checkRangeLabel || '-'}</span>
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="k">현장명</td>
                  <td className="v">
                    {editing ? (
                      <Input value={draftSiteName} onChange={(e) => setDraftSiteName(e.target.value)} disabled={saving} placeholder="현장명" />
                    ) : (post.siteName || '-')}
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
                  <td className="k">확인상태</td>
                  <td className="v">{post.confirmStatusText || '-'} {post.approvalStatus ? <span className="id2-pill">{post.approvalStatus}</span> : null}</td>
                </tr>

                <tr>
                  <td className="k">점검내용*</td>
                  <td className="v">
                    {editing ? (
                      <Input.TextArea value={draftBody} onChange={(e) => setDraftBody(e.target.value)} disabled={saving} placeholder="점검내용" />
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontWeight: 700 }}>{post.body}</div>
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="k">참석자명단</td>
                  <td className="v">
                    <div className="id2-grid">
                      <div className="id2-part">
                        <div className="id2-part-head">참석자 명단</div>
                        <table>
                          <tbody>
                            {(post.participants || []).map((x) => (
                              <tr key={x.no}>
                                <td>{x.no}</td>
                                <td>{x.name}</td>
                                <td>서명</td>
                                <td>{x.sign || '-'}</td>
                              </tr>
                            ))}
                            {(post.participants || []).length === 0 ? (
                              <tr><td colSpan={4} style={{ color:'#94a3b8', fontWeight:900, padding:'10px' }}>참석자 없음</td></tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>

                      <div className="id2-part">
                        <div className="id2-part-head">서명대기 안내</div>
                        <div style={{ padding: 10, color: '#475569', fontWeight: 800, fontSize: 12, lineHeight: 1.6 }}>
                          서명이 필요한 경우 “서명QR”을 통해 참석자 서명을 받으실 수 있습니다.<br/>
                          결재 진행은 전자결재 탭과 연동됩니다(추후 API 연동).
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="k">사진첨부</td>
                  <td className="v">
                    {(post.attachments || []).length === 0
                      ? <span style={{ color: '#94a3b8', fontWeight: 900 }}>-</span>
                      : (post.attachments || []).map((a) => (
                          <img key={a.id} className="id2-thumb" src={a.url} alt={a.name || '첨부'} />
                        ))
                    }
                  </td>
                </tr>

              </tbody>
            </table>

            <div className="id2-created">{createdLine}</div>
          </div>

        </div>
      </div>
    </>
  )
}