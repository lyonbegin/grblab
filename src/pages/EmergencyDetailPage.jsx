// src/pages/EmergencyDetailPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { App, Button, Input, Modal } from 'antd'
import { LeftOutlined, PlusOutlined } from '@ant-design/icons'
import { getEmergencyDetail, updateEmergencyDetail, deleteEmergencyDetail } from '../api/emergencyDetailApi'

const CSS = `
  .emd-wrap { background:#f3f6fb; padding:18px 18px 28px; }
  .emd-card {
    background:#fff; border:1px solid rgba(15,23,42,0.08);
    border-radius:16px; box-shadow:0 2px 10px rgba(15,23,42,0.06);
    overflow:hidden;
  }
  .emd-top {
    display:flex; align-items:center; justify-content:space-between; gap:10px;
    padding:12px 16px; border-bottom:1px solid rgba(15,23,42,0.06); background:#fff;
  }
  .emd-top-title { flex:1; text-align:center; font-weight:900; font-size:15px; color:#0f172a; letter-spacing:-0.2px; }
  .emd-top-side { min-width:90px; display:flex; align-items:center; gap:6px; }
  .emd-top-side-right { justify-content:flex-end; }

  .emd-top .ant-btn {
    border-radius:12px !important;
    height:34px !important;
    padding:0 14px !important;
    font-weight:900 !important;
    font-size:13px !important;
  }

  .emd-body { padding:12px 12px 4px; }

  .emd-table { width:100%; border-collapse:collapse; table-layout:fixed; border-top:1px solid rgba(15,23,42,0.06); }
  .emd-table td {
    border-bottom:1px solid rgba(15,23,42,0.06);
    padding:12px 12px; vertical-align:top; font-size:12px; color:#0f172a; word-break:break-word;
  }
  .emd-table .k {
    width:110px; background:#f8fafc; color:#475569; font-weight:900; font-size:12px;
  }
  .emd-table .v { font-weight:800; color:#0f172a; }

  .emd-created { padding:10px 12px 14px; color:rgba(17,24,39,0.45); font-weight:900; font-size:11px; }

  .emd-body .ant-input,
  .emd-body .ant-input-affix-wrapper,
  .emd-body textarea {
    border-radius:10px !important;
    border:1px solid rgba(15,23,42,0.12) !important;
    font-size:13px !important;
  }
  .emd-body textarea { min-height:180px !important; }

  .emd-thumb {
    width:110px; height:80px; border-radius:10px; object-fit:cover;
    border:1px solid rgba(15,23,42,0.08); margin-right:8px; margin-bottom:8px;
  }

  .emd-subtitle { font-weight:900; color:#0f172a; margin-bottom:8px; }

  .emd-pt-table { width:100%; border-collapse:collapse; border:1px solid rgba(15,23,42,0.08); border-radius:12px; overflow:hidden; }
  .emd-pt-table th, .emd-pt-table td { border-bottom:1px solid rgba(15,23,42,0.06); padding:10px 10px; font-size:12px; }
  .emd-pt-table th { background:#f8fafc; color:#475569; font-weight:900; }
  .emd-pt-table td { font-weight:800; }
  .emd-pt-actions { display:flex; gap:8px; margin-top:10px; }

  @media (max-width: 767px) {
    .emd-wrap { padding:0 !important; }
    .emd-card { border-radius:0 !important; box-shadow:none !important; border-left:0 !important; border-right:0 !important; }
    .emd-top { position:sticky; top:0; z-index:10; border-radius:0 !important; }
    .emd-table .k { width:88px !important; padding:10px 10px !important; font-size:11px !important; }
    .emd-table td { padding:10px 10px !important; font-size:12px !important; }
  }
    .emd-top .ant-btn-default {
  background: #ffffff !important;
  border: 1px solid #d1d5db !important;
  color: #374151 !important;
}
.emd-top .ant-btn-default:hover {
  background: #f1f5f9 !important;
  border-color: #9ca3af !important;
  color: #0f172a !important;
}

.emd-top .ant-btn-primary:not(.ant-btn-dangerous) {
  background: #2563eb !important;
  border-color: #2563eb !important;
  color: #fff !important;
}
.emd-top .ant-btn-primary:not(.ant-btn-dangerous):hover {
  background: #1d4ed8 !important;
  border-color: #1d4ed8 !important;
}

.emd-top .ant-btn-dangerous,
.emd-top .ant-btn-primary.ant-btn-dangerous {
  background: #ef4444 !important;
  border-color: #ef4444 !important;
  color: #fff !important;
}
.emd-top .ant-btn-dangerous:hover,
.emd-top .ant-btn-primary.ant-btn-dangerous:hover {
  background: #dc2626 !important;
  border-color: #dc2626 !important;
}
`;

export default function EmergencyDetailPage({ onBack, postId }) {
  const { message } = App.useApp()

  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState(null)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // drafts
  const [draftTitle, setDraftTitle] = useState('')
  const [draftSiteName, setDraftSiteName] = useState('')
  const [draftWriter, setDraftWriter] = useState('')
  const [draftReportType, setDraftReportType] = useState('')
  const [draftDrillFrom, setDraftDrillFrom] = useState('')
  const [draftDrillTo, setDraftDrillTo] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [draftPlace, setDraftPlace] = useState('')
  const [draftInstructor, setDraftInstructor] = useState('')
  const [draftRemarks, setDraftRemarks] = useState('')

  const [draftParticipants, setDraftParticipants] = useState([]) // [{no,name,sign}]
  const [draftPhotos, setDraftPhotos] = useState([]) // [{id,url,name}]

  const load = async () => {
    setLoading(true)
    try {
      const p = await getEmergencyDetail(postId)
      setPost(p)

      setDraftTitle(p.title || '')
      setDraftSiteName(p.siteName || '')
      setDraftWriter(p.writer || '')
      setDraftReportType(p.reportType || '')

      // date input은 YYYY-MM-DD로만 받으므로 slice
      setDraftDrillFrom((p.drillFrom || '').slice(0, 10))
      setDraftDrillTo((p.drillTo || '').slice(0, 10))

      setDraftContent(p.content || '')
      setDraftPlace(p.drillPlace || '')
      setDraftInstructor(p.instructor || '')
      setDraftRemarks(p.remarks || '')

      setDraftParticipants(Array.isArray(p.participants) ? p.participants : [])
      setDraftPhotos(Array.isArray(p.photos) ? p.photos : [])
    } catch {
      message.error('비상훈련 보고서를 불러오지 못했습니다.')
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
    if (!draftTitle.trim()) return message.warning('일지 제목을 입력해 주십시오.')
    if (!draftSiteName.trim()) return message.warning('현장명을 입력해 주십시오.')

    setSaving(true)
    try {
      const updated = await updateEmergencyDetail(postId, {
        title: draftTitle.trim(),
        siteName: draftSiteName.trim(),
        writer: draftWriter.trim(),
        reportType: draftReportType.trim(),

        drillFrom: draftDrillFrom ? `${draftDrillFrom}T00:00:00Z` : '',
        drillTo: draftDrillTo ? `${draftDrillTo}T00:00:00Z` : '',

        content: draftContent,
        drillPlace: draftPlace.trim(),
        instructor: draftInstructor.trim(),
        remarks: draftRemarks.trim(),

        participants: draftParticipants,
        photos: draftPhotos,

        hasAttachment: (draftPhotos || []).length > 0,
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
    setDraftTitle(post.title || '')
    setDraftSiteName(post.siteName || '')
    setDraftWriter(post.writer || '')
    setDraftReportType(post.reportType || '')
    setDraftDrillFrom((post.drillFrom || '').slice(0, 10))
    setDraftDrillTo((post.drillTo || '').slice(0, 10))
    setDraftContent(post.content || '')
    setDraftPlace(post.drillPlace || '')
    setDraftInstructor(post.instructor || '')
    setDraftRemarks(post.remarks || '')
    setDraftParticipants(Array.isArray(post.participants) ? post.participants : [])
    setDraftPhotos(Array.isArray(post.photos) ? post.photos : [])
    setEditing(false)
  }

  const onDelete = () => {
    Modal.confirm({
      title: '비상훈련 보고서를 삭제하시겠습니까?',
      content: '삭제된 내용은 복구할 수 없습니다.',
      okText: '삭제', okType: 'danger', cancelText: '취소',
      okButtonProps: { style: { borderRadius: 10, fontWeight: 900 } },
      cancelButtonProps: { style: { borderRadius: 10, fontWeight: 900 } },
      onOk: async () => {
        setDeleting(true)
        try {
          await deleteEmergencyDetail(postId)
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

  const addParticipant = () => {
    setDraftParticipants(prev => {
      const nextNo = prev.length ? Math.max(...prev.map(x => Number(x.no || 0))) + 1 : 1
      return [...prev, { no: nextNo, name: '', sign: '' }]
    })
  }

  const updateParticipant = (idx, field, value) => {
    setDraftParticipants(prev => prev.map((x, i) => (i === idx ? { ...x, [field]: value } : x)))
  }

  const removeParticipant = (idx) => {
    setDraftParticipants(prev => prev.filter((_, i) => i !== idx))
  }

  if (loading) return <div style={{ padding: 24, color: '#94a3b8', fontWeight: 900 }}>불러오는 중…</div>
  if (!post) return <div style={{ padding: 24, color: '#94a3b8', fontWeight: 900 }}>비상훈련 보고서가 없습니다.</div>

  return (
    <>
      <style>{CSS}</style>

      <div className="emd-wrap">
        <div className="emd-card">

          <div className="emd-top">
            <div className="emd-top-side">
              <Button icon={<LeftOutlined />} onClick={() => onBack && onBack()} disabled={saving || deleting}>
                목록
              </Button>
            </div>

            <div className="emd-top-title">비상훈련 보고서</div>

            <div className="emd-top-side emd-top-side-right">
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

          <div className="emd-body">
            <table className="emd-table">
              <colgroup>
                <col style={{ width: 110 }} />
                <col />
              </colgroup>
              <tbody>

                <tr>
                  <td className="k">일지 제목</td>
                  <td className="v">
                    {editing
                      ? <Input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} disabled={saving} placeholder="비상훈련 보고서 제목" />
                      : (post.title || '-')
                    }
                  </td>
                </tr>

                <tr>
                  <td className="k">훈련유형</td>
                  <td className="v">
                    {editing
                      ? <Input value={draftReportType} onChange={(e) => setDraftReportType(e.target.value)} disabled={saving} placeholder="예: 안전사고 / 화재 / 응급처치" />
                      : (post.reportType || '-')
                    }
                  </td>
                </tr>

                <tr>
                  <td className="k">훈련일시</td>
                  <td className="v">
                    {editing ? (
                      <div style={{ display:'flex', gap: 8, flexWrap:'wrap', alignItems:'center' }}>
                        <Input type="date" value={draftDrillFrom} onChange={(e) => setDraftDrillFrom(e.target.value)} disabled={saving} style={{ maxWidth: 180 }} />
                        <span style={{ fontWeight: 900, color:'rgba(17,24,39,0.45)' }}>~</span>
                        <Input type="date" value={draftDrillTo} onChange={(e) => setDraftDrillTo(e.target.value)} disabled={saving} style={{ maxWidth: 180 }} />
                      </div>
                    ) : (
                      <span style={{ color:'#2563eb', fontWeight: 900 }}>{post.drillRangeLabel || '-'}</span>
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="k">현장명</td>
                  <td className="v">
                    {editing
                      ? <Input value={draftSiteName} onChange={(e) => setDraftSiteName(e.target.value)} disabled={saving} placeholder="현장명" />
                      : (post.siteName || '-')
                    }
                  </td>
                </tr>

                <tr>
                  <td className="k">훈련내용</td>
                  <td className="v">
                    {editing
                      ? <Input.TextArea value={draftContent} onChange={(e) => setDraftContent(e.target.value)} disabled={saving} placeholder="훈련내용" />
                      : <div style={{ whiteSpace:'pre-wrap', lineHeight: 1.7, fontWeight: 700 }}>{post.content || '-'}</div>
                    }
                  </td>
                </tr>

                <tr>
                  <td className="k">참석자명단</td>
                  <td className="v">
                    <div className="emd-subtitle">참석자 명단</div>

                    <table className="emd-pt-table">
                      <thead>
                        <tr>
                          <th style={{ width: 70 }}>번호</th>
                          <th>이름</th>
                          <th style={{ width: 120 }}>서명</th>
                          {editing ? <th style={{ width: 90 }}>관리</th> : null}
                        </tr>
                      </thead>
                      <tbody>
                        {(editing ? draftParticipants : (post.participants || [])).map((p, idx) => (
                          <tr key={idx}>
                            <td style={{ textAlign:'center' }}>{p.no ?? (idx + 1)}</td>
                            <td>
                              {editing
                                ? <Input value={p.name} onChange={(e) => updateParticipant(idx, 'name', e.target.value)} disabled={saving} placeholder="이름" />
                                : (p.name || '-')
                              }
                            </td>
                            <td>
                              {editing
                                ? <Input value={p.sign} onChange={(e) => updateParticipant(idx, 'sign', e.target.value)} disabled={saving} placeholder="서명" />
                                : (p.sign || '-')
                              }
                            </td>
                            {editing ? (
                              <td style={{ textAlign:'center' }}>
                                <Button danger size="small" onClick={() => removeParticipant(idx)} disabled={saving}>
                                  삭제
                                </Button>
                              </td>
                            ) : null}
                          </tr>
                        ))}
                        {(editing ? draftParticipants : (post.participants || [])).length === 0 ? (
                          <tr>
                            <td colSpan={editing ? 4 : 3} style={{ textAlign:'center', color:'#94a3b8', fontWeight: 900, padding: 14 }}>
                              참석자 없음
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>

                    {editing ? (
                      <div className="emd-pt-actions">
                        <Button icon={<PlusOutlined />} onClick={addParticipant} disabled={saving}>
                          참석자 추가
                        </Button>
                      </div>
                    ) : null}
                  </td>
                </tr>

                <tr>
                  <td className="k">사진첨부</td>
                  <td className="v">
                    {(editing ? draftPhotos : (post.photos || [])).length === 0
                      ? <span style={{ color:'#94a3b8', fontWeight: 900 }}>-</span>
                      : (editing ? draftPhotos : (post.photos || [])).map((a) => (
                          <img key={a.id} className="emd-thumb" src={a.url} alt={a.name || '사진'} />
                        ))
                    }
                    {editing ? (
                      <div style={{ marginTop: 8, color:'#94a3b8', fontWeight: 900, fontSize: 12 }}>
                        ※ 사진 추가/업로드 UI는 다음 단계에서 연결하시면 됩니다(현재는 URL 기반 목업).
                      </div>
                    ) : null}
                  </td>
                </tr>

                <tr>
                  <td className="k">훈련장소</td>
                  <td className="v">
                    {editing
                      ? <Input value={draftPlace} onChange={(e) => setDraftPlace(e.target.value)} disabled={saving} placeholder="예: 현장사무실" />
                      : (post.drillPlace || '-')
                    }
                  </td>
                </tr>

                <tr>
                  <td className="k">훈련강사명</td>
                  <td className="v">
                    {editing
                      ? <Input value={draftInstructor} onChange={(e) => setDraftInstructor(e.target.value)} disabled={saving} placeholder="훈련강사명" />
                      : (post.instructor || '-')
                    }
                  </td>
                </tr>

                <tr>
                  <td className="k">비고</td>
                  <td className="v">
                    {editing
                      ? <Input value={draftRemarks} onChange={(e) => setDraftRemarks(e.target.value)} disabled={saving} placeholder="비고" />
                      : (post.remarks || '-')
                    }
                  </td>
                </tr>

              </tbody>
            </table>

            <div className="emd-created">{createdLine}</div>
          </div>

        </div>
      </div>
    </>
  )
}