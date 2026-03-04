// src/pages/SiteFormPage.jsx
// ✅ 현장 등록(new) / 수정·삭제(siteId 있을 때) 통합 페이지
// ✅ BoardDetailPage 와 동일한 톤·구조·패턴
// ✅ useParams: siteId 있으면 수정모드, 없으면 등록모드

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Input, message, Modal, Switch } from 'antd'
import {
  getSiteDetail,
  createSiteDetail,
  updateSiteDetail,
  deleteSiteDetail,
} from '../api/siteDetailApi'

const CSS = `
  /* =========================
     공통
  ========================= */
  .sf-wrap {
    background: #f3f6fb;
    padding: 18px 18px 28px;
  }

  .sf-card {
    background: #fff;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 16px;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
    overflow: hidden;
  }

  /* 상단 바 */
  .sf-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(15, 23, 42, 0.06);
    background: #fff;
  }

  .sf-top .sf-title-text {
    flex: 1;
    text-align: center;
    font-weight: 900;
    font-size: 15px;
    color: #0f172a;
    letter-spacing: -0.2px;
  }

  .sf-top .sf-side {
    width: 100px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .sf-top .sf-side-right {
    justify-content: flex-end;
  }

  .sf-top .ant-btn {
    border-radius: 12px !important;
    height: 34px !important;
    padding: 0 14px !important;
    font-weight: 900 !important;
    font-size: 13px !important;
    font-family: 'Noto Sans KR', sans-serif !important;
  }

  /* 바디 */
  .sf-body {
    padding: 12px 12px 4px;
  }

  /* 테이블 */
  .sf-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    border-top: 1px solid rgba(15, 23, 42, 0.06);
  }

  .sf-table td {
    border-bottom: 1px solid rgba(15, 23, 42, 0.06);
    padding: 13px 14px;
    vertical-align: middle;
    font-size: 13px;
    color: #0f172a;
    word-break: break-word;
  }

  .sf-table .k {
    width: 120px;
    background: #f8fafc;
    color: #475569;
    font-weight: 900;
    font-size: 12px;
  }

  .sf-table .v {
    font-weight: 800;
    color: #0f172a;
  }

  /* required 표시 */
  .sf-req {
    color: #ef4444;
    margin-left: 2px;
  }

  /* 입력 스타일 통일 */
  .sf-body .ant-input,
  .sf-body .ant-input-affix-wrapper {
    border-radius: 10px !important;
    border: 1px solid rgba(15, 23, 42, 0.12) !important;
    font-size: 13px !important;
    font-family: 'Noto Sans KR', sans-serif !important;
  }

  .sf-body .ant-input:focus,
  .sf-body .ant-input-affix-wrapper:focus-within {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 2px rgba(37,99,235,0.10) !important;
  }

  /* 태그 칩 */
  .sf-tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .sf-tag {
    height: 28px;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid rgba(15, 23, 42, 0.10);
    background: #f1f5f9;
    color: #475569;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    user-select: none;
    display: inline-flex;
    align-items: center;
    transition: all .12s;
  }

  .sf-tag.active {
    background: rgba(37,99,235,0.10);
    border-color: rgba(37,99,235,0.25);
    color: #2563eb;
  }

  /* 공사여부 Switch */
  .sf-switch-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .sf-switch-label {
    font-size: 12px;
    font-weight: 900;
    color: #475569;
  }
  .sf-switch-on {
    font-size: 12px;
    font-weight: 900;
    color: #2563eb;
  }

  /* 등록 정보 하단 */
  .sf-created {
    padding: 10px 14px 16px;
    color: rgba(17, 24, 39, 0.45);
    font-weight: 900;
    font-size: 11px;
  }

  /* 삭제 버튼 구역 */
  .sf-delete-zone {
    padding: 0 14px 20px;
    display: flex;
    justify-content: flex-end;
  }

  /* 모바일 */
  @media (max-width: 767px) {
    .sf-wrap { padding: 0 !important; }
    .sf-card {
      border-radius: 0 !important;
      box-shadow: none !important;
      border-left: 0 !important;
      border-right: 0 !important;
    }
    .sf-top {
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .sf-table .k { width: 90px !important; padding: 10px 10px !important; font-size: 11px !important; }
    .sf-table td { padding: 10px 10px !important; font-size: 12px !important; }

    /* 모바일: 2열 행을 세로로 */
    .sf-table tr.row-split td {
      display: block;
      width: 100% !important;
      box-sizing: border-box;
    }
    .sf-table tr.row-split td.k { border-bottom: 0 !important; }
  }
`

// ── 사용 가능 태그 목록 ──
const TAG_OPTIONS = ['#신축공사', '#가로수정비', '#내진보강', '#공사공지', '#리모델링', '#도로공사']

export default function SiteFormPage() {
  const nav = useNavigate()
  const { siteId } = useParams()   // 없으면 등록모드, 있으면 수정모드

  const isEdit = !!siteId

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // ── 편집 draft ──
  const [draftName, setDraftName] = useState('')
  const [draftClient, setDraftClient] = useState('')
  const [draftAuthor, setDraftAuthor] = useState('관리팀')
  const [draftDueDate, setDraftDueDate] = useState('')   // YYYY-MM-DD
  const [draftTags, setDraftTags] = useState([])
  const [draftActive, setDraftActive] = useState(true)

  // 수정모드면 기존 데이터 로드
  const [originalSite, setOriginalSite] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    ;(async () => {
      setLoading(true)
      try {
        const site = await getSiteDetail(siteId)
        setOriginalSite(site)
        setDraftName(site.siteName || '')
        setDraftClient(site.client || '')
        setDraftAuthor(site.author || '관리팀')
        setDraftDueDate(site.dueDateRaw || '')
        setDraftTags(site.tags || [])
        setDraftActive(site.isActive ?? true)
      } catch {
        message.error('현장 정보를 불러오지 못했습니다.')
        nav('/site')
      } finally {
        setLoading(false)
      }
    })()
  }, [siteId])

  // ── 태그 토글 ──
  const toggleTag = (tag) => {
    setDraftTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  // ── 저장(등록 or 수정) ──
  const onSave = async () => {
    if (!draftName.trim()) return message.warning('현장명을 입력해 주세요.')

    setSaving(true)
    try {
      if (isEdit) {
        await updateSiteDetail(siteId, {
          siteName: draftName,
          client: draftClient,
          author: draftAuthor,
          dueDateRaw: draftDueDate,
          tags: draftTags,
          isActive: draftActive,
        })
        message.success('수정되었습니다.')
        nav('/site')
      } else {
        await createSiteDetail({
          siteName: draftName,
          client: draftClient,
          author: draftAuthor,
          dueDateRaw: draftDueDate,
          tags: draftTags,
          isActive: draftActive,
        })
        message.success('현장이 등록되었습니다.')
        nav('/site')
      }
    } catch (e) {
      message.error(e?.message || '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // ── 삭제 확인 ──
  const onDelete = () => {
    Modal.confirm({
      title: '현장을 삭제하시겠습니까?',
      content: '삭제된 현장은 복구할 수 없습니다.',
      okText: '삭제',
      okType: 'danger',
      cancelText: '취소',
      okButtonProps: { style: { borderRadius: 10, fontWeight: 900 } },
      cancelButtonProps: { style: { borderRadius: 10, fontWeight: 900 } },
      onOk: async () => {
        setDeleting(true)
        try {
          await deleteSiteDetail(siteId)
          message.success('삭제되었습니다.')
          nav('/site')
        } catch {
          message.error('삭제에 실패했습니다.')
        } finally {
          setDeleting(false)
        }
      },
    })
  }

  const createdLine = useMemo(() => {
    if (!originalSite) return ''
    return `등록자: ${originalSite.author || '-'}  ·  등록일: ${originalSite.createdAtLabel || '-'}`
  }, [originalSite])

  if (loading) {
    return (
      <div style={{ padding: 28, color: '#94a3b8', fontWeight: 900, fontFamily: "'Noto Sans KR', sans-serif" }}>
        불러오는 중…
      </div>
    )
  }

  return (
    <>
      <style>{CSS}</style>

      <div className="sf-wrap">
        <div className="sf-card">

          {/* ── 상단 바 ── */}
          <div className="sf-top">
            {/* 왼쪽: 목록 */}
            <div className="sf-side">
              <Button size="small" onClick={() => nav('/site')} disabled={saving || deleting}>
                목록
              </Button>
            </div>

            {/* 가운데: 제목 */}
            <div className="sf-title-text">
              {isEdit ? '현장 수정' : '현장 등록'}
            </div>

            {/* 오른쪽: 삭제(수정모드만) + 저장 */}
            <div className="sf-side sf-side-right">
              {isEdit && (
                <Button
                  size="small"
                  danger
                  onClick={onDelete}
                  loading={deleting}
                  disabled={saving}
                >
                  삭제
                </Button>
              )}
              <Button
                size="small"
                type="primary"
                onClick={onSave}
                loading={saving}
                disabled={deleting}
              >
                저장
              </Button>
            </div>
          </div>

          {/* ── 바디 ── */}
          <div className="sf-body">
            <table className="sf-table">
              <colgroup>
                <col style={{ width: 120 }} />
                <col />
              </colgroup>
              <tbody>

                {/* 현장명 */}
                <tr>
                  <td className="k">현장명<span className="sf-req">*</span></td>
                  <td className="v">
                    <Input
                      value={draftName}
                      onChange={e => setDraftName(e.target.value)}
                      placeholder="현장명을 입력하세요."
                      disabled={saving || deleting}
                      maxLength={100}
                    />
                  </td>
                </tr>

                {/* 발주처 */}
                <tr>
                  <td className="k">발주처</td>
                  <td className="v">
                    <Input
                      value={draftClient}
                      onChange={e => setDraftClient(e.target.value)}
                      placeholder="발주처를 입력하세요."
                      disabled={saving || deleting}
                      maxLength={60}
                    />
                  </td>
                </tr>

                {/* 준공일 */}
                <tr>
                  <td className="k">준공일</td>
                  <td className="v">
                    <Input
                      type="date"
                      value={draftDueDate}
                      onChange={e => setDraftDueDate(e.target.value)}
                      disabled={saving || deleting}
                      style={{ maxWidth: 180 }}
                    />
                  </td>
                </tr>

                {/* 등록자 */}
                <tr>
                  <td className="k">등록자</td>
                  <td className="v">
                    <Input
                      value={draftAuthor}
                      onChange={e => setDraftAuthor(e.target.value)}
                      placeholder="등록자"
                      disabled={saving || deleting}
                      maxLength={30}
                      style={{ maxWidth: 160 }}
                    />
                  </td>
                </tr>

                {/* 공사여부 */}
                <tr>
                  <td className="k">공사여부</td>
                  <td className="v">
                    <div className="sf-switch-row">
                      <Switch
                        checked={draftActive}
                        onChange={v => setDraftActive(v)}
                        disabled={saving || deleting}
                        size="small"
                      />
                      <span className={draftActive ? 'sf-switch-on' : 'sf-switch-label'}>
                        {draftActive ? '진행중' : '종료'}
                      </span>
                    </div>
                  </td>
                </tr>

                {/* 태그 */}
                <tr>
                  <td className="k">태그</td>
                  <td className="v">
                    <div className="sf-tag-row">
                      {TAG_OPTIONS.map(tag => (
                        <span
                          key={tag}
                          className={`sf-tag ${draftTags.includes(tag) ? 'active' : ''}`}
                          onClick={() => !saving && !deleting && toggleTag(tag)}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>

              </tbody>
            </table>

            {/* 등록정보 (수정모드에서만) */}
            {isEdit && originalSite && (
              <div className="sf-created">{createdLine}</div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}