// src/pages/SiteDetailPage.jsx
// ✅ 현장 상세 페이지
//    - 상단: 현장 정보 (읽기 ↔ 수정/저장/삭제 토글) — BoardDetailPage 패턴 동일
//    - 하단: 이 현장에 속한 공사보드 리스트 (클릭 → 공사보드 상세)

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Input, message, Modal, Switch } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import { getSiteDetail, updateSiteDetail, deleteSiteDetail } from '../api/siteDetailApi'

const CSS = `
  /* =========================
     공통
  ========================= */
  .sd-wrap {
    background: #f3f6fb;
    padding: 18px 18px 28px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* 카드 공통 */
  .sd-card {
    background: #fff;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 16px;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
    overflow: hidden;
  }

  /* ── 상단 바 ── */
  .sd-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(15, 23, 42, 0.06);
    background: #fff;
  }
  .sd-top-title {
    flex: 1;
    text-align: center;
    font-weight: 900;
    font-size: 15px;
    color: #0f172a;
    letter-spacing: -0.2px;
  }
  .sd-top-side {
    min-width: 90px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .sd-top-side-right { justify-content: flex-end; }



  /* 모든 버튼 공통 */
  .sd-top .ant-btn {
    border-radius: 12px !important;
    height: 34px !important;
    padding: 0 14px !important;
    font-weight: 900 !important;
    font-size: 13px !important;
    font-family: 'Noto Sans KR', sans-serif !important;
  }
  /* 기본(default) 버튼 — 목록 버튼 글자/배경 명시 */
  .sd-top .ant-btn-default {
    background: #ffffff !important;
    border: 1px solid #d1d5db !important;
    color: #374151 !important;
  }
  .sd-top .ant-btn-default:hover {
    background: #f1f5f9 !important;
    border-color: #9ca3af !important;
    color: #0f172a !important;
  }
  /* primary 버튼 */
  .sd-top .ant-btn-primary:not(.ant-btn-dangerous) {
    background: #2563eb !important;
    border-color: #2563eb !important;
    color: #fff !important;
  }
  .sd-top .ant-btn-primary:not(.ant-btn-dangerous):hover {
    background: #1d4ed8 !important;
    border-color: #1d4ed8 !important;
  }
  /* 삭제 버튼 — danger */
  .sd-top .ant-btn-dangerous,
  .sd-top .ant-btn-primary.ant-btn-dangerous {
    background: #ef4444 !important;
    border-color: #ef4444 !important;
    color: #fff !important;
  }
  .sd-top .ant-btn-dangerous:hover,
  .sd-top .ant-btn-primary.ant-btn-dangerous:hover {
    background: #dc2626 !important;
    border-color: #dc2626 !important;
    color: #fff !important;
  }

  /* ── 정보 테이블 ── */
  .sd-body { padding: 12px 12px 4px; }

  .sd-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    border-top: 1px solid rgba(15, 23, 42, 0.06);
  }
  .sd-table td {
    border-bottom: 1px solid rgba(15, 23, 42, 0.06);
    padding: 13px 14px;
    vertical-align: middle;
    font-size: 13px;
    color: #0f172a;
    word-break: break-word;
  }
  .sd-table .k {
    width: 110px;
    background: #f8fafc;
    color: #475569;
    font-weight: 900;
    font-size: 12px;
  }
  .sd-table .v { font-weight: 800; color: #0f172a; }

  /* 입력 스타일 */
  .sd-body .ant-input,
  .sd-body .ant-input-affix-wrapper {
    border-radius: 10px !important;
    border: 1px solid rgba(15, 23, 42, 0.12) !important;
    font-size: 13px !important;
    font-family: 'Noto Sans KR', sans-serif !important;
  }
  .sd-body .ant-input:focus,
  .sd-body .ant-input-affix-wrapper:focus-within {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 2px rgba(37,99,235,0.10) !important;
  }

  /* pill */
  .sd-pill-active {
    display: inline-flex; align-items: center;
    height: 22px; padding: 0 10px; border-radius: 999px;
    background: rgba(37,99,235,0.10); border: 1px solid rgba(37,99,235,0.25);
    color: #2563eb; font-weight: 900; font-size: 11px;
  }
  .sd-pill-done {
    display: inline-flex; align-items: center;
    height: 22px; padding: 0 10px; border-radius: 999px;
    background: #f1f5f9; border: 1px solid rgba(15,23,42,0.08);
    color: #475569; font-weight: 900; font-size: 11px;
  }

  /* 태그 칩 */
  .sd-tag-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .sd-tag {
    height: 26px; padding: 0 12px; border-radius: 999px;
    border: 1px solid rgba(15,23,42,0.10); background: #f1f5f9;
    color: #475569; font-size: 12px; font-weight: 800;
    cursor: pointer; user-select: none;
    display: inline-flex; align-items: center; transition: all .12s;
  }
  .sd-tag.active {
    background: rgba(37,99,235,0.10); border-color: rgba(37,99,235,0.25); color: #2563eb;
  }
  .sd-tag.readonly { cursor: default; }

  /* switch row */
  .sd-switch-row { display: flex; align-items: center; gap: 10px; }
  .sd-switch-on  { font-size: 12px; font-weight: 900; color: #2563eb; }
  .sd-switch-off { font-size: 12px; font-weight: 900; color: #94a3b8; }

  /* 등록정보 */
  .sd-created {
    padding: 10px 14px 16px;
    color: rgba(17,24,39,0.45); font-weight: 900; font-size: 11px;
  }









  /* muted */
  .sd-muted { color: rgba(17,24,39,0.50); font-weight: 800; font-size: 11px; }



  /* ── 모바일 ── */
  @media (max-width: 767px) {
    .sd-wrap { padding: 0 !important; gap: 10px; background: #f3f6fb; }
    .sd-card {
      border-radius: 0 !important; box-shadow: none !important;
      border-left: 0 !important; border-right: 0 !important;
    }
    .sd-top { position: sticky; top: 0; z-index: 10; }
    .sd-table .k { width: 88px !important; padding: 10px 10px !important; font-size: 11px !important; }
    .sd-table td { padding: 10px 10px !important; font-size: 12px !important; }
  }
`

const TAG_OPTIONS = ['#신축공사', '#가로수정비', '#내진보강', '#공사공지', '#리모델링', '#도로공사']


// ── 메인 ──
export default function SiteDetailPage({ onBack, siteId: siteIdProp }) {
  const nav = useNavigate()
  const { siteId: siteIdFromParams } = useParams()
  const siteId = siteIdProp || siteIdFromParams

  // 현장 정보
  const [loading, setLoading]   = useState(true)
  const [site, setSite]         = useState(null)
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(false)

  // 편집 draft
  const [draftName,    setDraftName]    = useState('')
  const [draftClient,  setDraftClient]  = useState('')
  const [draftAuthor,  setDraftAuthor]  = useState('')
  const [draftDueDate, setDraftDueDate] = useState('')
  const [draftTags,    setDraftTags]    = useState([])
  const [draftActive,  setDraftActive]  = useState(true)

  // ── 현장 정보 로드 ──
  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const s = await getSiteDetail(siteId)
        setSite(s)
        setDraftName(s.siteName || '')
        setDraftClient(s.client || '')
        setDraftAuthor(s.author || '관리팀')
        setDraftDueDate(s.dueDateRaw || '')
        setDraftTags(s.tags || [])
        setDraftActive(s.isActive ?? true)
      } catch {
        message.error('현장 정보를 불러오지 못했습니다.')
        onBack ? onBack() : nav(-1)
      } finally {
        setLoading(false)
      }
    })()
  }, [siteId])

  const toggleTag = (tag) => {
    if (!editing) return
    setDraftTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  // ── 수정 시작 ──
  const onClickEdit = () => setEditing(true)

  // ── 취소 ──
  const onCancelEdit = () => {
    if (!site) return
    setDraftName(site.siteName || '')
    setDraftClient(site.client || '')
    setDraftAuthor(site.author || '관리팀')
    setDraftDueDate(site.dueDateRaw || '')
    setDraftTags(site.tags || [])
    setDraftActive(site.isActive ?? true)
    setEditing(false)
  }

  // ── 저장 ──
  const onSave = async () => {
    if (!draftName.trim()) return message.warning('현장명을 입력해 주세요.')
    setSaving(true)
    try {
      const updated = await updateSiteDetail(siteId, {
        siteName: draftName,
        client: draftClient,
        author: draftAuthor,
        dueDateRaw: draftDueDate,
        tags: draftTags,
        isActive: draftActive,
      })
      setSite(updated)
      setEditing(false)
      message.success('저장되었습니다.')
    } catch (e) {
      message.error(e?.message || '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // ── 삭제 ──
  const onDelete = () => {
    Modal.confirm({
      title: '현장을 삭제하시겠습니까?',
      content: '삭제된 현장은 복구할 수 없습니다.',
      okText: '삭제', okType: 'danger', cancelText: '취소',
      okButtonProps: { style: { borderRadius: 10, fontWeight: 900 } },
      cancelButtonProps: { style: { borderRadius: 10, fontWeight: 900 } },
      onOk: async () => {
        setDeleting(true)
        try {
          await deleteSiteDetail(siteId)
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

  const createdLine = useMemo(() => {
    if (!site) return ''
    return `등록자: ${site.author || '-'}  ·  등록일: ${site.createdAtLabel || '-'}`
  }, [site])

  if (loading) return (
    <div style={{ padding: 28, color: '#94a3b8', fontWeight: 900, fontFamily: "'Noto Sans KR', sans-serif" }}>
      불러오는 중…
    </div>
  )
  if (!site) return null

  return (
    <>
      <style>{CSS}</style>

      <div className="sd-wrap">

        <div className="sd-card">

          {/* 상단 바 */}
          <div className="sd-top">
            <div className="sd-top-side">
              <Button
                icon={<LeftOutlined />}
                onClick={() => onBack ? onBack() : nav(-1)}
                disabled={saving || deleting}
                style={{ borderRadius: 12, height: 34, fontWeight: 900, fontSize: 13 }}
              >
                목록
              </Button>
            </div>

            <div className="sd-top-title">현장 상세</div>

            <div className="sd-top-side sd-top-side-right">
              {editing ? (
                <>
                  <Button size="small" onClick={onCancelEdit} disabled={saving}>취소</Button>
                  <Button size="small" type="primary" onClick={onSave} loading={saving}>저장</Button>
                </>
              ) : (
                <>
                  <Button size="small" type="primary" danger onClick={onDelete} loading={deleting}>삭제</Button>
                  <Button size="small" type="primary" onClick={onClickEdit}>수정</Button>
                </>
              )}
            </div>
          </div>

          {/* 정보 테이블 */}
          <div className="sd-body">
            <table className="sd-table">
              <colgroup>
                <col style={{ width: 110 }} />
                <col />
              </colgroup>
              <tbody>

                <tr>
                  <td className="k">현장명</td>
                  <td className="v">
                    {editing ? (
                      <Input
                        value={draftName} onChange={e => setDraftName(e.target.value)}
                        placeholder="현장명" disabled={saving} maxLength={100}
                      />
                    ) : (
                      <span style={{ fontWeight: 900, fontSize: 14 }}>{site.siteName}</span>
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="k">공사여부</td>
                  <td className="v">
                    {editing ? (
                      <div className="sd-switch-row">
                        <Switch checked={draftActive} onChange={v => setDraftActive(v)} disabled={saving} size="small" />
                        <span className={draftActive ? 'sd-switch-on' : 'sd-switch-off'}>
                          {draftActive ? '진행중' : '종료'}
                        </span>
                      </div>
                    ) : (
                      site.isActive
                        ? <span className="sd-pill-active">진행중</span>
                        : <span className="sd-pill-done">종료</span>
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="k">발주처</td>
                  <td className="v">
                    {editing ? (
                      <Input
                        value={draftClient} onChange={e => setDraftClient(e.target.value)}
                        placeholder="발주처" disabled={saving} maxLength={60}
                      />
                    ) : (
                      site.client || '-'
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="k">준공일</td>
                  <td className="v">
                    {editing ? (
                      <Input
                        type="date" value={draftDueDate}
                        onChange={e => setDraftDueDate(e.target.value)}
                        disabled={saving} style={{ maxWidth: 180 }}
                      />
                    ) : (
                      <span>
                        {site.dueDate || '-'}
                        {site.dday != null && (
                          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 900, color: '#2563eb' }}>
                            (D-{site.dday})
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="k">등록자</td>
                  <td className="v">
                    {editing ? (
                      <Input
                        value={draftAuthor} onChange={e => setDraftAuthor(e.target.value)}
                        placeholder="등록자" disabled={saving} maxLength={30}
                        style={{ maxWidth: 160 }}
                      />
                    ) : (
                      site.author || '-'
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="k">태그</td>
                  <td className="v">
                    <div className="sd-tag-row">
                      {editing ? (
                        TAG_OPTIONS.map(tag => (
                          <span
                            key={tag}
                            className={`sd-tag ${draftTags.includes(tag) ? 'active' : ''}`}
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        (site.tags?.length > 0)
                          ? site.tags.map(tag => (
                              <span key={tag} className="sd-tag active readonly">{tag}</span>
                            ))
                          : <span style={{ color: '#94a3b8', fontWeight: 800, fontSize: 12 }}>-</span>
                      )}
                    </div>
                  </td>
                </tr>

              </tbody>
            </table>

            <div className="sd-created">{createdLine}</div>
          </div>
        </div>

      </div>
    </>
  )
}