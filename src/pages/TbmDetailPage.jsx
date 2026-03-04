// src/pages/TbmDetailPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Input, Modal, Select } from 'antd'
import { LeftOutlined, PlusOutlined, PaperClipOutlined, CheckOutlined } from '@ant-design/icons'
import { createTbmPost } from '../api/tbmApi'
import { getTbmDetail, updateTbmDetail, deleteTbmDetail, requestTbmConfirm, approveTbm, completeApprovalTbm } from '../api/tbmDetailApi'
import { listSites } from '../api/siteApi'

const CSS = `
  .td-wrap { background:#f3f6fb; padding:18px 18px 28px; }
  .td-card {
    background:#fff; border:1px solid rgba(15,23,42,0.08);
    border-radius:16px; box-shadow:0 2px 10px rgba(15,23,42,0.06);
    overflow:hidden;
  }

  .td-top {
    display:flex; align-items:center; justify-content:space-between; gap:10px;
    padding:12px 16px; border-bottom:1px solid rgba(15,23,42,0.06); background:#fff;
  }
  .td-top-title { flex:1; text-align:center; font-weight:900; font-size:15px; color:#0f172a; letter-spacing:-0.2px; }
  .td-top-side { min-width:90px; flex-shrink:0; display:flex; align-items:center; gap:6px; }
  .td-top-side-right { justify-content:flex-end; }

  .td-top .ant-btn { border-radius:12px !important; height:34px !important; padding:0 14px !important; font-weight:900 !important; font-size:13px !important; }
  .td-top .ant-btn-default { background:#fff !important; border:1px solid #d1d5db !important; color:#374151 !important; }
  .td-top .ant-btn-default:hover { background:#f1f5f9 !important; border-color:#9ca3af !important; color:#0f172a !important; }
  .td-top .ant-btn-primary:not(.ant-btn-dangerous) { background:#2563eb !important; border-color:#2563eb !important; color:#fff !important; }
  .td-top .ant-btn-primary:not(.ant-btn-dangerous):hover { background:#1d4ed8 !important; border-color:#1d4ed8 !important; }
  .td-top .ant-btn-dangerous, .td-top .ant-btn-primary.ant-btn-dangerous { background:#ef4444 !important; border-color:#ef4444 !important; color:#fff !important; }
  .td-top .ant-btn-dangerous:hover, .td-top .ant-btn-primary.ant-btn-dangerous:hover { background:#dc2626 !important; border-color:#dc2626 !important; }

  .td-body { padding:12px 12px 4px; }

  .td-table { width:100%; border-collapse:collapse; table-layout:fixed; border-top:1px solid rgba(15,23,42,0.06); }
  .td-table td { border-bottom:1px solid rgba(15,23,42,0.06); padding:12px 12px; vertical-align:top; font-size:12px; color:#0f172a; word-break:break-word; }
  .td-table .k { width:110px; background:#f8fafc; color:#475569; font-weight:900; font-size:12px; }
  .td-table .v { font-weight:800; color:#0f172a; }

  .td-pill {
    display:inline-flex; align-items:center; height:22px; padding:0 10px; border-radius:999px;
    background:rgba(37,99,235,0.10); border:1px solid rgba(37,99,235,0.25);
    color:#2563eb; font-weight:900; font-size:11px; margin-left:8px; white-space:nowrap;
  }
  .td-pill-gray {
    background:#f1f5f9; border:1px solid rgba(15,23,42,0.08); color:#475569;
  }

  .td-btn-mini {
    height:28px; padding:0 10px; border-radius:10px; font-weight:900; font-size:12px;
    border:1px solid rgba(15,23,42,0.12); background:#fff; cursor:pointer;
  }
  .td-btn-mini:hover { background:#f8fafc; }

  .td-primary-mini {
    height:28px; padding:0 10px; border-radius:10px; font-weight:900; font-size:12px;
    border:1px solid rgba(37,99,235,0.25); background:rgba(37,99,235,0.08); color:#2563eb; cursor:pointer;
  }
  .td-primary-mini:hover { background:rgba(37,99,235,0.12); }

  .td-created { padding:10px 12px 14px; color:rgba(17,24,39,0.45); font-weight:900; font-size:11px; }

  .td-body .ant-input,
  .td-body .ant-input-affix-wrapper,
  .td-body textarea,
  .td-body .ant-select-selector {
    border-radius:10px !important;
    border:1px solid rgba(15,23,42,0.12) !important;
    font-size:13px !important;
    box-shadow:none !important;
  }
  .td-body .ant-input:focus,
  .td-body .ant-input-affix-wrapper:focus-within,
  .td-body .ant-select-focused .ant-select-selector {
    border-color:#2563eb !important;
    box-shadow:0 0 0 2px rgba(37,99,235,0.10) !important;
  }
  .td-body textarea { min-height:150px !important; }

  @media (max-width: 767px) {
    .td-wrap { padding:0 !important; }
    .td-card { border-radius:0 !important; box-shadow:none !important; border-left:0 !important; border-right:0 !important; }
    .td-top { position:sticky; top:0; z-index:10; border-radius:0 !important; }
    .td-table .k { width:88px !important; padding:10px 10px !important; font-size:11px !important; }
    .td-table td { padding:10px 10px !important; font-size:12px !important; }
  }
`

function addDays(ymd, n) {
  const s = String(ymd || '').trim()
  if (!s) return ''
  const d = new Date(s + 'T00:00:00')
  d.setDate(d.getDate() + n)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function fmtKST(dateIso) {
  const d = new Date(dateIso)
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit'
  })
}

function ApprovalPill({ v }) {
  if (!v) return <span className="td-pill td-pill-gray">미결재</span>
  if (v === '결재중') return <span className="td-pill">결재중</span>
  if (v === '결재완료') return <span className="td-pill td-pill-gray">결재완료</span>
  return <span className="td-pill">{v}</span>
}

export default function TbmDetailPage({
  onBack,
  postId: postIdProp,
  siteId: siteIdProp,
  projectId: projectIdProp,
  projectName: projectNameProp,
  onCreated,
}) {
  const nav = useNavigate()
  const { siteId: siteIdFromParams, postId: postIdFromParams } = useParams()
  const postId = postIdProp || postIdFromParams
  const effectiveSiteId = siteIdProp || siteIdFromParams

  const { message } = App.useApp()

  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // 현장 선택(이미지 UI 상단 select 대응)
  const [siteOptions, setSiteOptions] = useState([])
  const [draftSiteId, setDraftSiteId] = useState(effectiveSiteId || '')
  const [draftSiteName, setDraftSiteName] = useState('')

  // ✅ 공사보드 컨텍스트(필수)
  const [draftProjectId, setDraftProjectId] = useState(projectIdProp || '')
  const [draftProjectName, setDraftProjectName] = useState(projectNameProp || '')

  // TBM 필드
  const [draftTbmDate, setDraftTbmDate] = useState('')
  const [draftWorkFrom, setDraftWorkFrom] = useState('')
  const [draftWorkTo, setDraftWorkTo] = useState('')
  const [draftDurationMin, setDraftDurationMin] = useState(0)
  const [draftWorkName, setDraftWorkName] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const [draftMemo, setDraftMemo] = useState('')

  const [hasRiskEval, setHasRiskEval] = useState(false)
  const [hasNearMiss, setHasNearMiss] = useState(false)

  const [confirmRequestText, setConfirmRequestText] = useState('')
  const [confirmStatusText, setConfirmStatusText] = useState('')
  const [approvalStatus, setApprovalStatus] = useState('')

  useEffect(() => {
    // 현장 옵션 로드
    listSites({ page: 1, pageSize: 200 })
      .then((res) => {
        const opts = (res.items || []).map(s => ({ label: s.siteName, value: s.id }))
        setSiteOptions(opts)
        // draftSiteName 동기화
        const found = opts.find(o => o.value === (effectiveSiteId || draftSiteId))
        if (found) setDraftSiteName(found.label)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = async () => {
    // ✅ new 모드: 빈 폼 + 편집 모드 시작
    if (postId === 'new') {
      setPost({ boardType: 'TBM일지' })
      setDraftSiteId(effectiveSiteId || '')
      setDraftSiteName(draftSiteName || '')
      setDraftProjectId(projectIdProp || '')
      setDraftProjectName(projectNameProp || '')
      setDraftTbmDate('')
      setDraftWorkFrom('')
      setDraftWorkTo('')
      setDraftDurationMin(0)
      setDraftWorkName('')
      setDraftBody(
`1. 작업내용 및 작업계획 설명
2. 위험성평가 내용 공유
3. 비상시 행동요령
- 비상대피 경로 및 대피/비상연락처 안내
- 작업위치 내 소화시설 위치 주지`
      )
      setDraftMemo(
`개인보호구 착용상태 확인(안전모/장갑/안전화)
건강상태 확인(혈압 등)
운행/교통 주의사항`
      )
      setHasRiskEval(false)
      setHasNearMiss(false)
      setConfirmRequestText('')
      setConfirmStatusText('')
      setApprovalStatus('')
      setEditing(true)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const p = await getTbmDetail(postId)
      setPost(p)

      setDraftSiteId(p.siteId || effectiveSiteId || '')
      setDraftSiteName(p.siteName || '')
      setDraftProjectId(p.projectId || projectIdProp || '')
      setDraftProjectName(p.projectName || projectNameProp || '')

      setDraftTbmDate(p.tbmDate || '')
      setDraftWorkFrom(p.workFrom || '')
      setDraftWorkTo(p.workTo || '')
      setDraftDurationMin(Number(p.durationMin || 0))
      setDraftWorkName(p.workName || '')
      setDraftBody(p.body || '')
      setDraftMemo(p.memo || '')

      setHasRiskEval(!!p.hasRiskEval)
      setHasNearMiss(!!p.hasNearMiss)
      setConfirmRequestText(p.confirmRequestText || '')
      setConfirmStatusText(p.confirmStatusText || '')
      setApprovalStatus(p.approvalStatus || '')
    } catch {
      message.error('TBM을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [postId]) // eslint-disable-line react-hooks/exhaustive-deps

  const createdLine = useMemo(() => {
    if (!post || postId === 'new') return ''
    return `현장명 ${post.siteName || '-'}  ·  공사명 ${post.projectName || '-'}  ·  등록자 ${post.author || '-'}  ·  ${fmtKST(post.createdAt)}`
  }, [post, postId])

  const validateRequired = () => {
    if (!draftSiteId) { message.warning('현장을 선택해 주십시오.'); return false }
    if (!String(draftProjectName || '').trim()) { message.warning('공사이름(공사명)을 입력해 주십시오.'); return false } // ✅ 필수
    if (!String(draftTbmDate || '').trim()) { message.warning('TBM일시를 입력해 주십시오.'); return false }
    if (!String(draftWorkFrom || '').trim() || !String(draftWorkTo || '').trim()) { message.warning('근로시간을 입력해 주십시오.'); return false }
    if (!String(draftWorkName || '').trim()) { message.warning('작업명을 입력해 주십시오.'); return false }
    if (!String(draftBody || '').trim()) { message.warning('작업내용을 입력해 주십시오.'); return false }
    return true
  }

  const onSave = async () => {
    if (!validateRequired()) return
    setSaving(true)
    try {
      if (postId === 'new') {
        // ✅ 생성: tbmApi.createTbmPost 사용
        const created = await createTbmPost({
          siteId: draftSiteId,
          siteName: draftSiteName || (siteOptions.find(o => o.value === draftSiteId)?.label || ''),
          projectId: draftProjectId || '',
          projectName: String(draftProjectName || '').trim(), // ✅ 필수
          tbmDate: draftTbmDate,
          workFrom: draftWorkFrom,
          workTo: draftWorkTo,
          durationMin: Number(draftDurationMin || 0),
          workName: String(draftWorkName || '').trim(),
          body: String(draftBody || '').trim(),
          memo: String(draftMemo || '').trim(),
          hasRiskEval,
          hasNearMiss,
          confirmRequestText,
          confirmStatusText,
          approvalStatus,
          author: '계정일님',
        })
        message.success('등록되었습니다.')
        if (onCreated) onCreated(created.id)
        else if (onBack) onBack()
        else nav(-1)
      } else {
        const updated = await updateTbmDetail(postId, {
          siteId: draftSiteId,
          siteName: draftSiteName || (siteOptions.find(o => o.value === draftSiteId)?.label || ''),
          projectId: draftProjectId || '',
          projectName: String(draftProjectName || '').trim(), // ✅ 필수
          tbmDate: draftTbmDate,
          workFrom: draftWorkFrom,
          workTo: draftWorkTo,
          durationMin: Number(draftDurationMin || 0),
          workName: String(draftWorkName || '').trim(),
          body: String(draftBody || '').trim(),
          memo: String(draftMemo || '').trim(),
          hasRiskEval,
          hasNearMiss,
          confirmRequestText,
          confirmStatusText,
          approvalStatus,
        })
        setPost(updated)
        setEditing(false)
        message.success('저장되었습니다.')
      }
    } catch {
      message.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const onClickEditOrSave = async () => {
    if (!editing) { setEditing(true); return }
    await onSave()
  }

  const onCancelEdit = () => {
    if (postId === 'new') {
      onBack ? onBack() : nav(-1)
      return
    }
    // 기존 값으로 되돌림
    setDraftSiteId(post?.siteId || effectiveSiteId || '')
    setDraftSiteName(post?.siteName || '')
    setDraftProjectId(post?.projectId || projectIdProp || '')
    setDraftProjectName(post?.projectName || projectNameProp || '')
    setDraftTbmDate(post?.tbmDate || '')
    setDraftWorkFrom(post?.workFrom || '')
    setDraftWorkTo(post?.workTo || '')
    setDraftDurationMin(Number(post?.durationMin || 0))
    setDraftWorkName(post?.workName || '')
    setDraftBody(post?.body || '')
    setDraftMemo(post?.memo || '')
    setHasRiskEval(!!post?.hasRiskEval)
    setHasNearMiss(!!post?.hasNearMiss)
    setConfirmRequestText(post?.confirmRequestText || '')
    setConfirmStatusText(post?.confirmStatusText || '')
    setApprovalStatus(post?.approvalStatus || '')
    setEditing(false)
  }

  const onDelete = () => {
    Modal.confirm({
      title: 'TBM을 삭제하시겠습니까?',
      content: '삭제된 내용은 복구할 수 없습니다.',
      okText: '삭제', okType: 'danger', cancelText: '취소',
      okButtonProps: { style: { borderRadius: 10, fontWeight: 900 } },
      cancelButtonProps: { style: { borderRadius: 10, fontWeight: 900 } },
      onOk: async () => {
        setDeleting(true)
        try {
          await deleteTbmDetail(postId)
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

  const onPlusDay = () => setDraftTbmDate(prev => addDays(prev, 1))
  const onPlusMin = (m) => setDraftDurationMin(v => Math.max(0, Number(v || 0) + m))

  const onToggleRiskEval = () => setHasRiskEval(v => !v)
  const onToggleNearMiss = () => setHasNearMiss(v => !v)

  const onConfirmRequest = async () => {
    if (postId === 'new') {
      // new 모드에서는 상태만 표시
      setConfirmRequestText('확인요청')
      setConfirmStatusText('확인중')
      message.success('확인요청 상태로 변경되었습니다.')
      return
    }
    try {
      const updated = await requestTbmConfirm(postId)
      setPost(updated)
      setConfirmRequestText(updated.confirmRequestText || '')
      setConfirmStatusText(updated.confirmStatusText || '')
      message.success('확인요청이 등록되었습니다.')
    } catch {
      message.error('확인요청에 실패했습니다.')
    }
  }

  const onApprove = async () => {
    if (!validateRequired()) return
    if (postId === 'new') {
      setApprovalStatus('결재중')
      message.success('결재중 상태로 변경되었습니다.')
      return
    }
    try {
      const updated = await approveTbm(postId)
      setPost(updated)
      setApprovalStatus(updated.approvalStatus || '')
      message.success('결재중으로 전환되었습니다.')
    } catch {
      message.error('결재 처리에 실패했습니다.')
    }
  }

  const onApproveComplete = async () => {
    if (postId === 'new') {
      setApprovalStatus('결재완료')
      message.success('결재완료로 변경되었습니다.')
      return
    }
    try {
      const updated = await completeApprovalTbm(postId)
      setPost(updated)
      setApprovalStatus(updated.approvalStatus || '')
      message.success('결재완료로 전환되었습니다.')
    } catch {
      message.error('결재완료 처리에 실패했습니다.')
    }
  }

  if (loading) return <div style={{ padding: 24, color: '#94a3b8', fontWeight: 900 }}>불러오는 중…</div>
  if (!post && postId !== 'new') return <div style={{ padding: 24, color: '#94a3b8', fontWeight: 900 }}>TBM이 없습니다.</div>

  return (
    <>
      <style>{CSS}</style>

      <div className="td-wrap">
        <div className="td-card">

          {/* 상단 바 */}
          <div className="td-top">
            <div className="td-top-side">
              <Button icon={<LeftOutlined />} onClick={() => onBack ? onBack() : nav(-1)} disabled={saving || deleting}>
                목록
              </Button>
            </div>

            <div className="td-top-title">TBM일지</div>

            <div className="td-top-side td-top-side-right">
              {editing ? (
                <>
                  <Button size="small" onClick={onCancelEdit} disabled={saving}>취소</Button>
                  <Button size="small" type="primary" onClick={onSave} loading={saving}>저장</Button>
                </>
              ) : (
                <>
                  <Button size="small" type="primary" onClick={onClickEditOrSave}>수정</Button>
                  {postId !== 'new' && (
                    <Button size="small" type="primary" danger onClick={onDelete} loading={deleting}>삭제</Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 본문 */}
          <div className="td-body">
            <table className="td-table">
              <colgroup>
                <col style={{ width: 110 }} />
                <col />
              </colgroup>
              <tbody>

                {/* 현장 */}
                <tr>
                  <td className="k">현장</td>
                  <td className="v">
                    {editing ? (
                      <Select
                        value={draftSiteId}
                        options={siteOptions}
                        placeholder="현장 선택"
                        style={{ width: '100%', maxWidth: 520 }}
                        onChange={(v) => {
                          setDraftSiteId(v)
                          const label = siteOptions.find(o => o.value === v)?.label || ''
                          setDraftSiteName(label)
                        }}
                        disabled={saving}
                      />
                    ) : (
                      <span>{post?.siteName || draftSiteName || '-'}</span>
                    )}
                  </td>
                </tr>

                {/* 공사이름(필수) */}
                <tr>
                  <td className="k">공사이름*</td>
                  <td className="v">
                    {editing ? (
                      <Input
                        value={draftProjectName}
                        onChange={(e) => setDraftProjectName(e.target.value)}
                        disabled={saving}
                        placeholder="공사이름(공사명)을 입력해 주십시오."
                        style={{ maxWidth: 520 }}
                      />
                    ) : (
                      <span>{post?.projectName || '-'}</span>
                    )}
                    <span className="td-pill td-pill-gray" style={{ marginLeft: 10 }}>공사보드 컨텍스트 필수</span>
                  </td>
                </tr>

                {/* TBM일시 */}
                <tr>
                  <td className="k">TBM일시*</td>
                  <td className="v">
                    {editing ? (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Input type="date" value={draftTbmDate} onChange={(e) => setDraftTbmDate(e.target.value)} disabled={saving} style={{ maxWidth: 180 }} />
                        <button className="td-primary-mini" onClick={onPlusDay} type="button" disabled={saving}>
                          <PlusOutlined /> 1일
                        </button>
                      </div>
                    ) : (
                      <span>{post?.tbmDate || '-'}</span>
                    )}
                  </td>
                </tr>

                {/* 근로시간 */}
                <tr>
                  <td className="k">근로시간*</td>
                  <td className="v">
                    {editing ? (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Input type="time" value={draftWorkFrom} onChange={(e) => setDraftWorkFrom(e.target.value)} disabled={saving} style={{ maxWidth: 150 }} />
                        <span style={{ fontWeight: 900, color: 'rgba(17,24,39,0.45)' }}>~</span>
                        <Input type="time" value={draftWorkTo} onChange={(e) => setDraftWorkTo(e.target.value)} disabled={saving} style={{ maxWidth: 150 }} />
                      </div>
                    ) : (
                      <span>{(post?.workFrom || '--:--') + ' ~ ' + (post?.workTo || '--:--')}</span>
                    )}
                  </td>
                </tr>

                {/* 진행시간 */}
                <tr>
                  <td className="k">진행시간</td>
                  <td className="v">
                    {editing ? (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Input
                          value={String(draftDurationMin)}
                          onChange={(e) => setDraftDurationMin(Number(e.target.value || 0))}
                          disabled={saving}
                          style={{ maxWidth: 100 }}
                        />
                        <span style={{ fontWeight: 900, color: 'rgba(17,24,39,0.45)' }}>분</span>
                        <button className="td-btn-mini" type="button" onClick={() => onPlusMin(5)} disabled={saving}>+5분</button>
                        <button className="td-btn-mini" type="button" onClick={() => onPlusMin(10)} disabled={saving}>+10분</button>
                      </div>
                    ) : (
                      <span>{Number(post?.durationMin || 0)} 분</span>
                    )}
                  </td>
                </tr>

                {/* 작업명 */}
                <tr>
                  <td className="k">작업명*</td>
                  <td className="v">
                    {editing ? (
                      <Input value={draftWorkName} onChange={(e) => setDraftWorkName(e.target.value)} disabled={saving} placeholder="작업명" />
                    ) : (
                      <span>{post?.workName || '-'}</span>
                    )}
                  </td>
                </tr>

                {/* 위험성평가표 */}
                <tr>
                  <td className="k">위험성평가표</td>
                  <td className="v">
                    <button className="td-primary-mini" type="button" onClick={onToggleRiskEval} disabled={saving}>
                      <PaperClipOutlined /> 위험성평가표 불러오기
                    </button>
                    {hasRiskEval ? <span className="td-pill">연동됨</span> : <span className="td-pill td-pill-gray">미연동</span>}
                  </td>
                </tr>

                {/* 아차사고 */}
                <tr>
                  <td className="k">아차사고*</td>
                  <td className="v">
                    <button className="td-primary-mini" type="button" onClick={onToggleNearMiss} disabled={saving}>
                      <PaperClipOutlined /> 아차사고 불러오기
                    </button>
                    {hasNearMiss ? <span className="td-pill">연동됨</span> : <span className="td-pill td-pill-gray">미연동</span>}
                  </td>
                </tr>

                {/* 작업내용 */}
                <tr>
                  <td className="k">작업내용*</td>
                  <td className="v">
                    {editing ? (
                      <Input.TextArea value={draftBody} onChange={(e) => setDraftBody(e.target.value)} disabled={saving} placeholder="작업내용" />
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontWeight: 700 }}>
                        {post?.body || ''}
                      </div>
                    )}
                  </td>
                </tr>

                {/* 비고 */}
                <tr>
                  <td className="k">비고</td>
                  <td className="v">
                    {editing ? (
                      <Input.TextArea value={draftMemo} onChange={(e) => setDraftMemo(e.target.value)} disabled={saving} placeholder="비고" />
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontWeight: 700 }}>
                        {post?.memo || ''}
                      </div>
                    )}
                  </td>
                </tr>

                {/* 확인요청 */}
                <tr>
                  <td className="k">확인요청</td>
                  <td className="v">
                    <button className="td-btn-mini" type="button" onClick={onConfirmRequest} disabled={saving}>
                      <PlusOutlined /> 확인요청
                    </button>
                    {confirmRequestText ? <span className="td-pill">{confirmRequestText}</span> : <span className="td-pill td-pill-gray">없음</span>}
                    {confirmStatusText ? <span className="td-pill td-pill-gray" style={{ marginLeft: 6 }}>{confirmStatusText}</span> : null}
                  </td>
                </tr>

                {/* 결재 */}
                <tr>
                  <td className="k">결재상태</td>
                  <td className="v">
                    <ApprovalPill v={approvalStatus} />
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="td-primary-mini" type="button" onClick={onApprove} disabled={saving}>
                        <CheckOutlined /> 결재받기
                      </button>
                      <button className="td-btn-mini" type="button" onClick={onApproveComplete} disabled={saving}>
                        결재완료 처리
                      </button>
                    </div>
                  </td>
                </tr>

              </tbody>
            </table>

            {createdLine ? <div className="td-created">{createdLine}</div> : null}
          </div>

        </div>
      </div>
    </>
  )
}