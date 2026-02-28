/**
 * FormInputPage.jsx (FULL, SAFE, WORKING)
 * - useLocation으로 templateJson 수신
 * - 뒤로가기 / PDF / 인쇄 / 공유
 * - 로컬스토리지 저장
 * - JSON(layout) 기반 렌더 (table/field 지원)
 * - ✅ Safe helper 모두 포함 (toTextStyleSafe / cellToTdStyleSafe 등)
 * - ✅ 입력 가능 (field 셀은 실제 input/textarea)
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/* =========================
 * DEBUG 토글
 * ========================= */
const DEBUG_FORM = true

/* =========================
 * 공통 유틸 (스코프 문제 방지: 파일 최상단)
 * ========================= */

function cleanTitleFromTemplate(templateJson) {
  const title =
    (templateJson?.title ||
      templateJson?.source?.filename ||
      '양식')
      .replace(/^bid_\d+_/, '')
      .replace(/\.json$/i, '')
      .trim()
  return title || '양식'
}

// (레거시/필드용) fields 추출: 반드시 파일 최상단에 있어야 합니다.
function extractFields(templateJson) {
  if (!templateJson) return []

  // ✅ layout 기반 템플릿이면 templateJson.fields 그대로 사용
  if (Array.isArray(templateJson.fields) && templateJson.fields.length) {
    return templateJson.fields.map(f => ({
      id: f.id,
      label: f.label || f.id,
      type: f.type || 'text',
      placeholder: f.placeholder || '',
      rows: f.rows || 3,
      valueSample: f.valueSample || ''
    }))
  }

  // (옵션) 레거시 호환 (hwpx/hwp 등)
  const raw = templateJson.raw || {}
  const sourceType = raw.source_type || templateJson.source?.file_type

  if (sourceType === 'hwp' || sourceType === 'hwpx') {
    return (raw.fields || []).map((f, i) => ({
      id: f.id || `f_${i}`,
      label: f.label || `필드${i + 1}`,
      valueSample: f.value_sample || '',
      type: f.type || 'text',
      placeholder: f.placeholder || ''
    }))
  }

  return []
}

/* =========================
 * Safe Style Helpers (누락되면 바로 터지는 부분)
 * ========================= */

function toBoxStyleSafe(st = {}) {
  const pad = st?.padding
  const padding = Array.isArray(pad)
    ? pad.map(v => `${(v * 0.063).toFixed(3)}em`).join(' ')
    : undefined
  return {
    padding,
    marginTop: st?.marginTop != null ? `${(st.marginTop * 0.063).toFixed(3)}em` : undefined,
  }
}

function toTextStyleSafe(st = {}) {
  const pad = st?.padding
  const padding = Array.isArray(pad)
    ? pad.map(v => `${(v * 0.063).toFixed(3)}em`).join(' ')
    : undefined
  const fs = st?.fontSize
  const fontSize = fs != null
    ? `clamp(0.6rem, ${(fs / 16).toFixed(3)}em + 0.5vw, ${(fs / 14).toFixed(3)}em)`
    : 'clamp(0.75rem, 1.8vw, 0.875rem)'
  return {
    fontSize,
    fontWeight: st?.fontWeight,
    textAlign: st?.textAlign,
    letterSpacing: st?.letterSpacing != null ? `${st.letterSpacing}px` : undefined,
    color: st?.color || '#1a1a1a',
    marginTop: st?.marginTop != null ? `${(st.marginTop * 0.063).toFixed(3)}em` : undefined,
    padding,
    lineHeight: st?.lineHeight ?? 1.6,
    whiteSpace: st?.whiteSpace || 'pre-wrap',
    overflow: 'visible',
  }
}


function useTableSizes(isMobile) {
  return {
    baseFontSize: isMobile ? '0.6875em' : '0.75em',
    padY: isMobile ? '0.25em' : '0.375em',
    padX: isMobile ? '0.5em'  : '0.625em',
  }
}


function cellToTdStyleSafe(st = {}, borderColor = '#c0c0c0') {
  return {
    border: `1px solid ${borderColor || '#c0c0c0'}`,
    padding: 0,
    background: st?.bg || '#fff',
    fontWeight: st?.fontWeight || 500,
    textAlign: st?.align || 'left',
    color: st?.color || '#1a1a1a',
    verticalAlign: st?.valign || 'middle',
    overflow: 'visible', // ✅ td에서 잘라먹지 않게
  }
}

/* =========================
 * Mobile 판단
 * ========================= */

function useIsMobile() {
  const get = () => {
    if (typeof window === 'undefined') return false
    try {
      if (window.matchMedia && window.matchMedia('(max-width: 767px)').matches) return true
    } catch {}
    const vv = window.visualViewport
    const w = vv?.width || window.innerWidth || document.documentElement.clientWidth || 9999
    return w < 768
  }

  const [isMobile, setIsMobile] = useState(get)

  useEffect(() => {
    const mq = window.matchMedia ? window.matchMedia('(max-width: 767px)') : null
    const onChange = () => setIsMobile(get)

    window.addEventListener('resize', onChange)
    window.visualViewport?.addEventListener('resize', onChange)
    mq?.addEventListener?.('change', onChange)

    onChange()

    return () => {
      window.removeEventListener('resize', onChange)
      window.visualViewport?.removeEventListener('resize', onChange)
      mq?.removeEventListener?.('change', onChange)
    }
  }, [])

  return isMobile
}

/* =========================
 * Preview Styles
 * ========================= */

const previewStyles = {
  root: {
    boxSizing: 'border-box',
    width: '100%',
    background: '#fff',
    padding: '2.25em 2.5em',
    border: '1px solid #aaa',
  },
  docHeader: { borderBottom: '3px double #1a1a2e', paddingBottom: '1em', marginBottom: '0.5em', display: 'flex', flexDirection: 'column', gap: '0.375em' },
  docMeta: { display: 'flex', justifyContent: 'space-between' },
  docMetaBottom: { display: 'flex', justifyContent: 'space-between' },
  docMetaText: { fontSize: '0.6875em', color: '#888', letterSpacing: '0.2px' },
  docTitle: { fontSize: 'clamp(1.1rem, 3vw, 1.625rem)', fontWeight: 900, color: '#1a1a2e', letterSpacing: '-0.05em', margin: '0.25em 0', textAlign: 'center' },
  signSection: { marginTop: '2.25em', border: '1px solid #ccc' },
  signTitle: { background: '#eef0f3', padding: '0.375em 0.875em', fontSize: '0.75em', fontWeight: 700, color: '#333', borderBottom: '1px solid #ccc', letterSpacing: '2px', textAlign: 'center' },
  signRow: { display: 'flex' },
  signBox: { flex: 1, display: 'flex', flexDirection: 'column' },
  signLabel: { fontSize: '0.75em', fontWeight: 600, color: '#444', background: '#f5f5f5', textAlign: 'center', padding: '0.375em', borderBottom: '1px solid #ddd', letterSpacing: '1.5px' },
  signSpace: { height: '3.25em' },
  signBottom: { fontSize: '0.6875em', color: '#bbb', textAlign: 'right', padding: '0.25em 0.625em', borderTop: '1px solid #eee' },
  docFooter: { marginTop: '1.5em', fontSize: '0.625em', color: '#aaa', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '0.75em', lineHeight: 1.6 },
}

/* =========================
 * 공통 섹션 타이틀
 * ========================= */
function SectionTitle({ num, title }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.625em',
      margin: '1.75em 0 0.5em', paddingBottom: '0.375em',
      borderBottom: '2px solid #1a1a2e'
    }}>
      {!!num && (
        <span style={{
          background: '#1a1a2e', color: '#fff',
          fontSize: '0.625em', fontWeight: 700,
          padding: '0.2em 0.5em', letterSpacing: '0.5px'
        }}>
          {num}
        </span>
      )}
      <span style={{ fontSize: '0.875em', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em' }}>
        {title}
      </span>
    </div>
  )
}

/* =========================
 * Table Renderer (VIEW 전용: 미리보기/캡처용)
 * ========================= */
function TableRendererView({ table, values, isMobile }) {
  const { baseFontSize, padY, padX } = useTableSizes(isMobile)
  const cols = table?.cols || []
  const rows = table?.rows || []
  const borderColor = table?.style?.borderColor || '#c0c0c0'
  const marginTop = table?.style?.marginTop != null
    ? `${(table.style.marginTop * 0.063).toFixed(3)}em`
    : undefined

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${borderColor}`, marginTop }}>
      <colgroup>
        {cols.map((c, i) => <col key={i} style={{ width: c?.w || 'auto' }} />)}
      </colgroup>
      <tbody>
        {rows.map((r, ri) => (
          <tr key={ri}>
            {(r?.cells || []).map((cell, ci) => {
              const cst = cell?.style || {}
              const tdStyle = cellToTdStyleSafe(cst, borderColor)
              const colSpan = cell?.colspan || 1
              const rowSpan = cell?.rowspan || 1

              if (cell?.type === 'label') return (
                <td key={ci} colSpan={colSpan} rowSpan={rowSpan} style={tdStyle}>
                  <div style={{ padding: `${padY} ${padX}`, fontSize: baseFontSize, fontWeight: cst?.fontWeight || 700, color: cst?.color || '#2c3e50', whiteSpace: 'normal', wordBreak: 'keep-all', overflow: 'hidden', lineHeight: 1.4 }}>
                    {cell?.text ?? ''}
                  </div>
                </td>
              )
              if (cell?.type === 'text') return (
                <td key={ci} colSpan={colSpan} rowSpan={rowSpan} style={tdStyle}>
                  <div style={toTextStyleSafe(cst)}>{cell?.value ?? ''}</div>
                </td>
              )
              if (cell?.type === 'field') {
                const v = values?.[cell?.fieldId] ?? ''
                const minH = cell?.style?.minH != null ? `${(cell.style.minH * 0.0625).toFixed(3)}em` : undefined
                return (
                  <td key={ci} colSpan={colSpan} rowSpan={rowSpan} style={{ ...tdStyle,  verticalAlign: 'middle', height: 'auto'  }}>
                    <div style={{ minHeight: minH, padding: `${padY} ${padX}`, fontSize: baseFontSize, whiteSpace: 'pre-wrap', lineHeight: 1.6, overflow: 'visible' }}>
                      {v}
                    </div>
                  </td>
                )
              }
              if (cell?.type === 'composite') return (
                <td key={ci} colSpan={colSpan} rowSpan={rowSpan} style={{ ...tdStyle, verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', padding: `${padY} ${padX}`, gap: '0.15em', overflow: 'hidden' }}>
                    {(cell.children || []).map((child, cIdx) => {
                      if (child.type === 'text') return (
                        <span key={cIdx} style={{ fontSize: baseFontSize, whiteSpace: 'nowrap', flexShrink: 0 }}>{child.value}</span>
                      )
                      if (child.type === 'field') return (
                        <span key={cIdx} style={{ fontSize: baseFontSize, flex: '1 1 5em', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {values?.[child.fieldId] ?? ''}
                        </span>
                      )
                      return null
                    })}
                  </div>
                </td>
              )
              return <td key={ci} colSpan={colSpan} rowSpan={rowSpan} style={tdStyle} />
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* =========================
 * Table Renderer (EDIT: 실제 작성용)
 * ========================= */
function TableRendererEdit({ table, values, today, isMobile, onChange }) {
  const { baseFontSize, padY, padX } = useTableSizes(isMobile)
  const cols = table?.cols || []
  const rows = table?.rows || []
  const borderColor = table?.style?.borderColor || '#c0c0c0'
  const marginTop = table?.style?.marginTop != null
    ? `${(table.style.marginTop * 0.063).toFixed(3)}em`
    : undefined

  const getFieldValue = (fieldId) => {
    if (fieldId === '__today__') return today || ''
    return values?.[fieldId] ?? ''
  }
  const setFieldValue = (fieldId, v) => {
    if (!fieldId || !onChange) return
    onChange(fieldId, v)
  }

  const renderField = (cell) => {
    const fieldId = cell?.fieldId
    const minH = cell?.style?.minH
    const multiline = !!cell?.style?.multiline || (minH && minH >= 46)
    const minHem = minH != null ? `${(minH * 0.0625).toFixed(3)}em` : undefined
  const commonStyle = {
  width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none',
  background: 'transparent', fontSize: baseFontSize, color: '#1a1a1a',
  padding: `${padY} ${padX}`,
  paddingTop: '0.5em',       // ✅ 위 여백 확보
  paddingBottom: '0.5em',    // ✅ 아래 잘림 방지
  lineHeight: 1.8,           // ✅ 1.6 → 1.8
  minHeight: '2em',          // ✅ 최소 높이 확보
  height: 'auto',            // ✅ 고정 height 방지
  fontFamily: 'inherit', display: 'block',
  WebkitAppearance: 'none', appearance: 'none',
}
    const val = getFieldValue(fieldId)
    if (multiline) return (
      <textarea value={val} onChange={e => setFieldValue(fieldId, e.currentTarget.value)}
        rows={Math.max(2, Math.round((minH || 46) / 22))}
        style={{ ...commonStyle, resize: 'none', minHeight: minHem, whiteSpace: 'pre-wrap' }}
        placeholder={cell?.placeholder || ''} />
    )
    return (
      <input value={val} onChange={e => setFieldValue(fieldId, e.currentTarget.value)}
        style={{ ...commonStyle, minHeight: minHem }}
        placeholder={cell?.placeholder || ''} />
    )
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${borderColor}`, marginTop }}>
      <colgroup>
        {cols.map((c, i) => <col key={i} style={{ width: c?.w || 'auto' }} />)}
      </colgroup>
      <tbody>
        {rows.map((r, ri) => (
          <tr key={ri}>
            {(r?.cells || []).map((cell, ci) => {
              const tdStyle = cellToTdStyleSafe(cell?.style || {}, borderColor)
              const colSpan = cell?.colspan || 1
              const rowSpan = cell?.rowspan || 1

              if (cell?.type === 'label') return (
                <td key={ci} colSpan={colSpan} rowSpan={rowSpan} style={tdStyle}>
                  <div style={{ padding: `${padY} ${padX}`, fontSize: baseFontSize, fontWeight: cell?.style?.fontWeight || 700, color: cell?.style?.color || '#2c3e50', whiteSpace: 'normal', wordBreak: 'keep-all', overflow: 'hidden', lineHeight: 1.4 }}>
                    {cell?.text ?? ''}
                  </div>
                </td>
              )
              if (cell?.type === 'text') return (
                <td key={ci} colSpan={colSpan} rowSpan={rowSpan} style={tdStyle}>
                  <div style={{ padding: `${padY} ${padX}`, fontSize: baseFontSize, whiteSpace: 'pre-wrap', lineHeight: 1.6, overflow: 'visible' }}>
                    {cell?.value ?? ''}
                  </div>
                </td>
              )
              if (cell?.type === 'field') return (
                <td key={ci} colSpan={colSpan} rowSpan={rowSpan} style={{ ...tdStyle,  verticalAlign: 'middle', height: 'auto' }}>
                  {renderField(cell)}
                </td>
              )
              if (cell?.type === 'composite') return (
                <td key={ci} colSpan={colSpan} rowSpan={rowSpan} style={{ ...tdStyle, verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', padding: `${padY} ${padX}`, gap: '0.15em', overflow: 'hidden' }}>
                    {(cell.children || []).map((child, cIdx) => {
                      if (child.type === 'text') return (
                        <span key={cIdx} style={{ fontSize: baseFontSize, whiteSpace: 'nowrap', flexShrink: 0 }}>{child.value}</span>
                      )
                      if (child.type === 'field') return (
                        <input key={cIdx}
                          value={getFieldValue(child.fieldId)}
                          onChange={e => setFieldValue(child.fieldId, e.currentTarget.value)}
                          style={{ fontSize: baseFontSize, border: 'none', borderBottom: '1px solid #ccc', outline: 'none', background: 'transparent', fontFamily: 'inherit', minWidth: 0, width: child.style?.inputWidth || '5em', flex: child.style?.inputWidth ? `0 0 ${child.style.inputWidth}` : '1 1 5em', textAlign: 'center', padding: '0.1em 0.1em' }} />
                      )
                      return null
                    })}
                  </div>
                </td>
              )
              return <td key={ci} colSpan={colSpan} rowSpan={rowSpan} style={tdStyle} />
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* =========================
 * Layout Renderer (VIEW)
 * ========================= */
function LayoutRendererView({ template, values, isMobile }) {
  const layout = template?.layout
  if (!layout) return <div style={{ padding: '0.875em', color: '#999', fontSize: '0.75em' }}>templateJson.layout 이 없습니다.</div>

  const renderNode = (node, key) => {
    if (!node) return null
    const st = node?.style || {}

    if (node.type === 'page' || node.type === 'block' || node.type === 'section') return (
      <div key={key} style={toBoxStyleSafe(st)}>
        {node.type === 'section' && node?.title?.text && (
          <SectionTitle num={node?.title?.badge || ''} title={node.title.text} />
        )}
        {(node.children || []).map((c, i) => renderNode(c, `${key}_${i}`))}
      </div>
    )
    if (node.type === 'text') return (
      <div key={key} style={toTextStyleSafe(st)}>{node.value ?? ''}</div>
    )
    if (node.type === 'table') return (
      <TableRendererView key={key} table={node} values={values} isMobile={isMobile} />
    )
    if (node.type === 'static_text') return (
      <div key={key} style={{ fontSize: st?.fontSize ? `${st.fontSize / 16}em` : '0.75em', fontWeight: st?.fontWeight || 400, marginTop: st?.marginTop ? `${st.marginTop * 0.0625}em` : undefined, lineHeight: 1.6, padding: '0.2em 0' }}>
        {node.value}
      </div>
    )
    if (node.type === 'static_list') return (
      <ul key={key} style={{ listStyle: 'none', padding: '0.3em 0 0.3em 0.5em', fontSize: st?.fontSize ? `${st.fontSize / 16}em` : '0.7em', lineHeight: st?.lineHeight || 1.8, margin: '0.3em 0' }}>
        {(node.items || []).map((item, i) => (
          <li key={i} style={{ padding: '0.1em 0' }}>{item}</li>
        ))}
      </ul>
    )
    return null
  }

  return renderNode(layout, 'root')
}
/* =========================
 * Layout Renderer (EDIT)
 * ========================= */
function LayoutRendererEdit({ template, values, today, isMobile, onChange }) {
  const layout = template?.layout
  if (!layout) return <div style={{ padding: '1.25em', color: '#999', fontSize: '0.8125em' }}>templateJson.layout 이 없습니다.</div>

  const renderNode = (node, key) => {
    if (!node) return null
    const st = node?.style || {}

    if (node.type === 'page' || node.type === 'block' || node.type === 'section') return (
      <div key={key} style={toBoxStyleSafe(st)}>
        {node.type === 'section' && node.title && (
          <SectionTitle num={node.title.badge} title={node.title.text} />
        )}
        {(node.children || []).map((c, i) => renderNode(c, `${key}_${i}`))}
      </div>
    )
    if (node.type === 'text') return (
      <div key={key} style={toTextStyleSafe(st)}>{node.value ?? ''}</div>
    )
    if (node.type === 'table') return (
      <TableRendererEdit key={key} table={node} values={values} today={today} isMobile={isMobile} onChange={onChange} />
    )
    if (node.type === 'static_text') return (
      <div key={key} style={{ fontSize: st?.fontSize ? `${st.fontSize / 16}em` : '0.75em', fontWeight: st?.fontWeight || 400, marginTop: st?.marginTop ? `${st.marginTop * 0.0625}em` : undefined, lineHeight: 1.6, padding: '0.2em 0' }}>
        {node.value}
      </div>
    )
    if (node.type === 'static_list') return (
      <ul key={key} style={{ listStyle: 'none', padding: '0.3em 0 0.3em 0.5em', fontSize: st?.fontSize ? `${st.fontSize / 16}em` : '0.7em', lineHeight: st?.lineHeight || 1.8, margin: '0.3em 0' }}>
        {(node.items || []).map((item, i) => (
          <li key={i} style={{ padding: '0.1em 0' }}>{item}</li>
        ))}
      </ul>
    )
    return null
  }

  return renderNode(layout, 'root')
}

/* =========================
 * Fields Fallback (layout 없을 때)
 * ========================= */
function FieldsFallbackTable({ templateJson, values }) {
  const fields = Array.isArray(templateJson?.fields) ? templateJson.fields : []
  if (!fields.length) {
    return (
      <div style={{ padding: 14, color: '#999', fontSize: 12 }}>
        표시할 필드가 없습니다. (templateJson.layout 또는 templateJson.fields 필요)
      </div>
    )
  }

  return (
    <div style={{ marginTop: 12 }}>
      <SectionTitle num="입력 내용" title="작성된 항목" />
      {fields.map((f, i) => (
        <div key={f?.id || i} style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
          <div style={{
            background: '#eef0f3',
            padding: '6px 10px',
            fontSize: 12,
            color: '#2c3e50',
            fontWeight: 700,
            flex: '0 0 44%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            border: '0.5px solid #d0d0d0',
          }}>
            {f?.label || f?.id || `필드${i + 1}`}
          </div>

          <div style={{
            flex: 1,
            background: '#fff',
            border: '0.5px solid #d0d0d0',
            padding: '6px 10px',
            fontSize: 12,
            color: '#1a1a1a',
            minHeight: 28,
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6,
          }}>
            {values?.[f?.id] ?? ''}
          </div>
        </div>
      ))}
    </div>
  )
}

/* =========================
 * ✅ 미리보기 컴포넌트 (InputPage 미리보기 캡처에서 사용)
 * ========================= */
export function FormDocumentPreview({ templateJson, values = {}, isMobile = false }) {
  const title = cleanTitleFromTemplate(templateJson)
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const hasLayout = !!templateJson?.layout

  useEffect(() => {
    if (!DEBUG_FORM) return
    try {
      console.groupCollapsed('[FormDocumentPreview] render')
      console.log('title:', title)
      console.log('template_id:', templateJson?.template_id)
      console.log('source:', templateJson?.source)
      console.log('hasLayout:', hasLayout)
      console.log('layout type:', templateJson?.layout?.type)
      console.groupEnd()
    } catch {}
  }, [title, templateJson, hasLayout])

  return (
    <div style={previewStyles.root}>
      <div style={previewStyles.docHeader}>
        <div style={previewStyles.docMeta}>
          <span style={previewStyles.docMetaText}>{templateJson?.source?.filename || ''}</span>
          <span style={previewStyles.docMetaText}>문서번호: {templateJson?.template_id || ''}</span>
        </div>

        <h1 style={previewStyles.docTitle}>{title}</h1>

        <div style={previewStyles.docMetaBottom}>
          <span style={previewStyles.docMetaText}>작성일: {today}</span>
          <span style={previewStyles.docMetaText}>KRAS AI 현장안전관리</span>
        </div>
      </div>

      {hasLayout ? (
        <LayoutRendererView template={templateJson} values={values} isMobile={isMobile} />
      ) : (
        <FieldsFallbackTable templateJson={templateJson} values={values} />
      )}

      <div style={previewStyles.signSection}>
        <div style={previewStyles.signTitle}>확 인 란</div>
        <div style={previewStyles.signRow}>
          {['작 성 자', '검 토 자', '승 인 자'].map((label, i) => (
            <div
              key={label}
              style={{
                ...previewStyles.signBox,
                borderRight: i < 2 ? '1px solid #ccc' : 'none',
              }}
            >
              <div style={previewStyles.signLabel}>{label}</div>
              <div style={previewStyles.signSpace} />
              <div style={previewStyles.signBottom}>(인)</div>
            </div>
          ))}
        </div>
      </div>

      <div style={previewStyles.docFooter}>
        본 문서는 KRAS AI 현장안전관리 시스템에 의해 작성되었습니다.
      </div>
    </div>
  )
}

/* =========================
 * ✅ 메인 페이지: 실제 작성 화면
 * ========================= */

export default function FormInputPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const printRef = useRef(null)

  const templateJson = location.state?.templateJson || null
  const fields = useMemo(() => extractFields(templateJson), [templateJson])

  const title = useMemo(() => cleanTitleFromTemplate(templateJson), [templateJson])
  const today = useMemo(() => new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }), [])

  const [values, setValues] = useState({})
  const [saved, setSaved] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }, [])

  // templateJson 없으면 홈으로
  useEffect(() => {
    if (!templateJson) {
      const t = setTimeout(() => navigate('/'), 300)
      return () => clearTimeout(t)
    }
  }, [templateJson, navigate])

  // fields가 있으면 values 기본키 초기화
  useEffect(() => {
    if (!fields?.length) return
    setValues(prev => {
      const next = { ...prev }
      for (const f of fields) {
        if (next[f.id] === undefined) next[f.id] = ''
      }
      return next
    })
  }, [fields])

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/', { replace: true, state: { restoreMenu: 'forms' } })
  }, [navigate])

  const onChangeValue = useCallback((fieldId, v) => {
    setValues(prev => ({ ...prev, [fieldId]: v }))
  }, [])

  const buildRecord = useCallback(() => ({
    record_id: `rec_${Date.now()}`,
    template_id: templateJson?.template_id,
    title,
    created_at: new Date().toISOString(),
    values: Object.fromEntries((fields || []).map(f => [f.id, values[f.id] ?? ''])),
  }), [templateJson, title, fields, values])

  const handleSave = useCallback(() => {
    try {
      const rec = buildRecord()
      const existing = JSON.parse(localStorage.getItem('kras_form_records') || '[]')
      existing.unshift(rec)
      localStorage.setItem('kras_form_records', JSON.stringify(existing.slice(0, 200)))
      setSaved(true)
      showToast('저장 완료')
      setTimeout(() => setSaved(false), 2000)
    } catch {
      showToast('저장 실패')
    }
  }, [buildRecord, showToast])

  const handlePrint = useCallback(() => { window.print() }, [])

  const handleShare = useCallback(async () => {
    setSharing(true)
    try {
      const data = { title: `KRAS AI - ${title}`, text: `${title} 양식`, url: window.location.href }
      if (navigator.share && navigator.canShare?.(data)) {
        await navigator.share(data)
        showToast('공유 완료')
      } else {
        await navigator.clipboard.writeText(window.location.href)
        showToast('링크 복사됨')
      }
    } catch {
      showToast('공유 실패')
    }
    setSharing(false)
  }, [title, showToast])

  const savePdf = useCallback(async () => {
    const src = printRef.current
    if (!src) return

    showToast('PDF 생성 중…')

    // ✅ 캡처할 DOM은 "현재 화면" 그대로 clone
    const clone = src.cloneNode(true)
    const sandbox = document.createElement('div')

    Object.assign(sandbox.style, {
      position: 'fixed',
      left: '-99999px',
      top: '0',
      width: '820px',
      background: '#fff',
      zIndex: '999999'
    })

    Object.assign(clone.style, {
      width: '820px',
      maxWidth: '820px',
      margin: '0',
      boxShadow: 'none',
      border: 'none',
      padding: '36px 40px',
      background: '#fff'
    })

    // fixed/sticky 제거
    clone.querySelectorAll('*').forEach(el => {
      const cs = window.getComputedStyle(el)
      if (cs.position === 'sticky' || cs.position === 'fixed') el.style.position = 'static'
    })

    sandbox.appendChild(clone)
    document.body.appendChild(sandbox)

    try {
      if (document.fonts?.ready) {
        try { await document.fonts.ready } catch {}
      }

      const h = clone.scrollHeight || clone.getBoundingClientRect().height || 0
      if (DEBUG_FORM) {
        console.groupCollapsed('[PDF] capture info')
        console.log('clone scrollHeight:', clone.scrollHeight)
        console.log('clone rect:', clone.getBoundingClientRect())
        console.groupEnd()
      }
      if (h < 10) throw new Error(`PDF capture DOM height too small: ${h}px`)

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: 820,
        windowHeight: Math.max(1, Math.ceil(h)),
        scrollX: 0,
        scrollY: 0
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageW = 210, pageH = 297
      const imgH = (canvas.height * pageW) / canvas.width

      let heightLeft = imgH
      let pos = 0

      pdf.addImage(imgData, 'JPEG', 0, pos, pageW, imgH)
      heightLeft -= pageH

      while (heightLeft > 0) {
        pdf.addPage()
        pos = heightLeft - imgH
        pdf.addImage(imgData, 'JPEG', 0, pos, pageW, imgH)
        heightLeft -= pageH
      }

      pdf.save(`${title}_${new Date().toISOString().slice(0, 10)}.pdf`)
      showToast('PDF 저장 완료')
    } catch (e) {
      if (DEBUG_FORM) console.error('[PDF] failed:', e)
      showToast(`PDF 실패: ${String(e?.message || e)}`)
    } finally {
      try { document.body.removeChild(sandbox) } catch {}
    }
  }, [title, showToast])

  if (!templateJson) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Noto Sans KR',sans-serif",
        color: '#999',
        fontSize: 14
      }}>
        돌아가는 중…
      </div>
    )
  }

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
        @media print {
          body>*:not(#form-preview){display:none!important}
          #form-preview{display:block!important;box-shadow:none;border:none;margin:0;padding:20px}
        }
      `}</style>

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(26,26,26,0.92)',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          padding: '10px 22px',
          borderRadius: 24,
          zIndex: 9999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          whiteSpace: 'nowrap'
        }}>
          {toast}
        </div>
      )}

    <div style={{ ...s.navBar, ...(isMobile ? s.navBarMobile : {}) }}>
  {/* 뒤로가기 */}
  <button onClick={handleBack} style={s.backBtn} title="뒤로가기">
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M11 4L6 9l5 5" stroke="rgba(255,255,255,0.75)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </button>

  {/* 제목 */}
  <span style={{ ...s.navTitle, ...(isMobile ? s.navTitleMobile : {}) }}>{title}</span>

  {/* ✅ 액션 버튼 — 모바일/PC 공통 */}
  <div style={s.navActions}>
    <button style={s.navBtn} onClick={handleSave}>
      {saved ? '✓' : (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path d="M13 13H3a1 1 0 01-1-1V4a1 1 0 011-1h8l2 2v7a1 1 0 01-1 1z" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M5 13V9h6v4M5 3v3h5V3" stroke="currentColor" strokeWidth="1.4"/>
        </svg>
      )}
    </button>

    <button style={s.navBtn} onClick={handlePrint}>
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M4 5V2h8v3M4 11H2V6h12v5h-2" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M4 9h8v5H4V9z" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    </button>

    <button style={s.navBtn} onClick={handleShare} disabled={sharing}>
      {sharing ? '…' : (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <circle cx="12" cy="3"  r="1.5" stroke="currentColor" strokeWidth="1.4"/>
          <circle cx="12" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
          <circle cx="3"  cy="8"  r="1.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M10.5 3.8L4.5 7.2M10.5 12.2L4.5 8.8" stroke="currentColor" strokeWidth="1.4"/>
        </svg>
      )}
    </button>

    <button style={{ ...s.navBtn, ...s.navBtnPdf }} onClick={savePdf}>PDF</button>
  </div>
</div>

      <div
        id="form-preview"
        ref={printRef}
        style={{
          ...s.sheet,
          ...(isMobile ? {
            maxWidth: '100%',
            margin: 0,
            padding: '10px 8px',
            border: 'none',
            boxShadow: 'none',
            borderRadius: 0
          } : {})
        }}
      >
        {/* ✅ layout 있으면 layout 기반, 없으면 fields fallback */}
        {templateJson?.layout ? (
          <LayoutRendererEdit
            template={templateJson}
            values={values}
            today={today}
            isMobile={isMobile}
            onChange={onChangeValue}
          />
        ) : (
          <FieldsFallbackTable templateJson={templateJson} values={values} />
        )}

        <div style={{ height: isMobile ? 16 : 80 }} />
      </div>
    </div>
  )
}

/* =========================
 * Page Styles
 * ========================= */
const s = {
  page: { minHeight: '100dvh', background: '#d4d8de', fontFamily: "'Noto Sans KR','Malgun Gothic','Apple SD Gothic Neo',sans-serif" },
  navBar: { position: 'sticky', top: 0, zIndex: 30, display: 'flex', alignItems: 'center', gap: '0.625em', padding: '0.5em 1.25em', background: '#1a1a2e', borderBottom: '1px solid rgba(255,255,255,0.12)' },
  navBarMobile: { padding: '0.5em 0.75em', gap: '0.375em' },
  backBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', width: '2.125em', height: '2.125em', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 },
  navTitle: { flex: 1, color: '#fff', fontSize: '0.875em', fontWeight: 700, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  navTitleMobile: { fontSize: '0.75em' },
  navActions: { display: 'flex', gap: '0.375em', flexShrink: 0, alignItems: 'center' },
  navBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.8)', fontSize: '0.75em', padding: '0.375em 0.625em', borderRadius: '0.375em', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '2em', minHeight: '2em' },
  navBtnPdf: { background: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 700, padding: '0.375em 0.75em' },
  sheet: { boxSizing: 'border-box', overflowX: 'hidden', maxWidth: '820px', margin: '1.75em auto 3.75em', background: '#fff', border: '1px solid #aaa', boxShadow: '0 4px 24px rgba(0,0,0,0.2)', padding: '2.25em 2.5em' }
}