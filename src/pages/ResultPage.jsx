import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import MethodCarousel from '../components/Result/MethodCarousel'
import StickyActions from '../components/Result/StickyActions'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}



export default function ResultPage() {
  const { state }  = useLocation()
  const navigate   = useNavigate()
  const result     = state?.result
  const imageUrl   = state?.imageUrl   // ✅ InputPage에서 전달한 이미지 URL



  useEffect(() => { if (!result) navigate('/') }, [result, navigate])
  if (!result) return null

  const { summary, hazards, overallLevel, raw } = result
  const isImmediate = overallLevel?.immediateAction
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
const isMobile = useIsMobile()






  const levelColor = (lvl) => {
    if (!lvl) return '#333'
    if (lvl.includes('즉시') || lvl === '허용불가능') return '#c0392b'
    if (lvl.includes('고위험')) return '#e67e22'
    if (lvl.includes('중위험') || lvl === '개선필요') return '#c8960c'
    return '#1e8449'
  }


const savePdf = async () => {
  const src = document.getElementById('result-content')
  if (!src) return

  // ✅ 1) PDF용 “PC 레이아웃” 복제본을 화면 밖에 생성
  const clone = src.cloneNode(true)

  // PDF에서 필요 없는 UI가 있으면 숨김(선택)
  // clone.querySelectorAll('.someClass').forEach(n => n.remove())

  const sandbox = document.createElement('div')
  sandbox.style.position = 'fixed'
  sandbox.style.left = '-99999px'
  sandbox.style.top = '0'
  sandbox.style.width = '820px'          // ✅ PC 문서 폭 고정
  sandbox.style.background = '#ffffff'
  sandbox.style.zIndex = '999999'
  sandbox.style.padding = '0'
  sandbox.style.margin = '0'

  // 복제본 자체에 “PC 문서 스타일” 강제 적용
  clone.style.width = '820px'
  clone.style.maxWidth = '820px'
  clone.style.margin = '0'
  clone.style.boxShadow = 'none'
  clone.style.border = 'none'
  clone.style.padding = '36px 40px'      // ✅ PC에서 보던 sheet padding 유지
  clone.style.background = '#ffffff'

  // ✅ sticky/position:fixed 류가 있으면 캡처를 망가뜨릴 수 있어 제거(안전장치)
  clone.querySelectorAll('*').forEach((el) => {
    const cs = window.getComputedStyle(el)
    if (cs.position === 'sticky' || cs.position === 'fixed') {
      el.style.position = 'static'
    }
  })

  sandbox.appendChild(clone)
  document.body.appendChild(sandbox)

  // ✅ 2) 폰트 로딩 안정화(가능하면)
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready } catch (_) {}
  }

  // ✅ 3) 캡처(PC 폭 기준)
  const canvas = await html2canvas(clone, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    windowWidth: clone.scrollWidth,
    windowHeight: clone.scrollHeight,
    scrollX: 0,
    scrollY: 0,
  })

  // ✅ 4) 오프스크린 복제본 제거
  document.body.removeChild(sandbox)

  // ✅ 5) 멀티 페이지 PDF 생성
  const imgData = canvas.toDataURL('image/jpeg', 0.95)
  const pdf = new jsPDF('p', 'mm', 'a4')

  const pageWidth = 210
  const pageHeight = 297

  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    pdf.addPage()
    position = heightLeft - imgHeight
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  pdf.save(`KRAS_AI_위험성평가_${new Date().toISOString().slice(0, 10)}.pdf`)
}


  return (
    <div style={s.page}>
      {/* 상단 네비바 */}



      <div style={{ ...s.navBar, ...(isMobile ? s.navBarMobile : {}) }}>
  <button onClick={() => navigate(-1)} style={{ ...s.backBtn, ...(isMobile ? s.backBtnMobile : {}) }}>
    ←
  </button>

  <span style={{ ...s.navTitle, ...(isMobile ? s.navTitleMobile : {}) }}>
    GRBlab
  </span>

  <div style={{ ...s.navActions, ...(isMobile ? s.navActionsMobile : {}) }}>
<StickyActions result={result} compact onPdf={savePdf} />
  </div>
</div>

      <div id="result-content" style={s.sheet}>

        {/* ══ 문서 제목 헤더 ══ */}
        <div style={s.docHeader}>
          <div style={s.docMeta}>
            <span style={s.docMetaText}>산업안전보건법 제36조에 의한 위험성평가</span>
            <span style={s.docMetaText}>문서번호: KRAS-AI-{Date.now().toString().slice(-6)}</span>
          </div>
          <h1 style={s.docTitle}>위험성평가 결과보고서</h1>
          <div style={s.docMetaBottom}>
            <span style={s.docMetaText}>작성일: {today}</span>
            <span style={s.docMetaText}>AI 자동분석 · KRAS 연동</span>
          </div>
        </div>

        {/* ══ 즉시조치 경고 ══ */}
        {isImmediate && (
          <div style={s.alertBox}>
            <div style={s.alertTitle}>⚠ 즉시조치 필요 — 작업중지 검토 요망</div>
            <div style={s.alertDesc}>{raw?.overall_risk_summary?.recommended_action}</div>
          </div>
        )}

        {/* ══ 1. 현장 기본정보 ══ */}
        <SectionTitle num="제1항" title="현장 기본정보" />
        <table style={s.table}>
          <tbody>
            <tr>
              <Th w={90}>세부 공정</Th>
              <Td>{summary?.processName}</Td>
              <Th w={90}>작업 단계</Th>
              <Td>{summary?.workContent}</Td>
            </tr>
            <tr>
              <Th>산업군 / 장비</Th>
              <Td>{summary?.equipment}</Td>
              <Th>평가 일자</Th>
              <Td>{today}</Td>
            </tr>
            <tr>
              <Th>판단 근거</Th>
              <Td colSpan={3}>{summary?.location || summary?.basis || '—'}</Td>
            </tr>
            <tr>
              <Th>법적 기준</Th>
              <Td colSpan={3}>
                {raw?.risk_assessment_standard?.legal_basis || '산업안전보건법 제36조 (위험성평가 실시)'}&nbsp;·&nbsp;5×5 매트릭스 적용
              </Td>
            </tr>
          </tbody>
        </table>

        {/* 종합위험등급 박스 */}
        <div style={s.gradeRow}>
          <div style={s.gradeLabel}>종합위험등급</div>
          <div style={{
            ...s.gradeValue,
            color: levelColor(overallLevel?.label),
            borderColor: levelColor(overallLevel?.label),
          }}>
            {overallLevel?.label || '—'}
          </div>
          <div style={s.gradeDesc}>
            {overallLevel?.topHazard && `최고위험: ${overallLevel.topHazard} (${overallLevel.score}점)`}
          </div>
        </div>

        {/* ══ ✅ 현장 이미지 ══ */}
        {imageUrl && (
          <>
            <SectionTitle num="현장사진" title="분석 대상 현장 이미지" />
            <div style={s.imageSection}>
              <div style={s.imageWrap}>
                <img src={imageUrl} alt="현장 이미지" style={s.siteImage} />
                <div style={s.imageBadge}>AI 분석 완료</div>
              </div>
              <div style={s.imageCaption}>
                📷 본 이미지는 위험성 평가의 분석 대상 현장 사진입니다. 이미지는 외부 서버에 저장되지 않습니다.
              </div>
            </div>
          </>
        )}

        {/* ══ 2. 유해·위험요인 목록 ══ */}
        <SectionTitle num="제2항" title={`식별된 유해·위험요인 목록 (총 ${hazards?.length || 0}건)`} />
        <table style={s.table}>
          <thead>
            <tr>
              <th style={{...s.th, width:38, textAlign:'center'}}>번호</th>
              <th style={s.th}>유해·위험요인명</th>
              <th style={{...s.th, width:110}}>분류</th>
            </tr>
          </thead>
          <tbody>
            {hazards?.length > 0 ? hazards.map((h, i) => (
              <tr key={i} style={i%2===1 ? {background:'#fafafa'} : {}}>
                <td style={{...s.td, textAlign:'center', color:'#999', fontFamily:'monospace'}}>{String(i+1).padStart(2,'0')}</td>
                <td style={s.td}>{h.name}</td>
                <td style={{...s.td, color:'#555'}}>{h.category}</td>
              </tr>
            )) : (
              <tr><td style={{...s.td, color:'#999', textAlign:'center'}} colSpan={3}>식별된 위험요인 없음</td></tr>
            )}
          </tbody>
        </table>

        {/* ══ 3. 5가지 평가 결과 ══ */}
        <SectionTitle num="제3항" title="위험성 평가 결과 — 5가지 방식" />
        <MethodCarousel data={result} />

        {/* ══ 서명란 ══ */}
        <div style={s.signSection}>
          <div style={s.signTitle}>확 인 란</div>
          <div style={s.signRow}>
            {['작 성 자', '검 토 자', '승 인 자'].map((label, i) => (
              <div key={label} style={{...s.signBox, borderRight: i < 2 ? '1px solid #ccc' : 'none'}}>
                <div style={s.signLabel}>{label}</div>
                <div style={s.signSpace} />
                <div style={s.signBottom}>(인)</div>
              </div>
            ))}
          </div>
        </div>

        <div style={s.docFooter}>
          본 문서는 KRAS AI 자동분석 시스템에 의해 생성되었습니다. 최종 판단은 안전관리자가 확인하여야 합니다.
        </div>

        <div style={{ height: 80 }} />
      </div>
    </div>
  )
}

function SectionTitle({ num, title }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      margin: '28px 0 8px',
      paddingBottom: 6,
      borderBottom: '2px solid #1a1a2e',
    }}>
      <span style={{
        background: '#1a1a2e', color: '#fff',
        fontSize: 10, fontWeight: 700,
        padding: '2px 8px', letterSpacing: '0.5px',
      }}>{num}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.3px' }}>{title}</span>
    </div>
  )
}

function Th({ children, w }) {
  return <th style={{
    background: '#eef0f3', color: '#2c3e50',
    fontSize: 12, fontWeight: 700,
    padding: '8px 10px',
    border: '1px solid #c0c0c0',
    textAlign: 'left', whiteSpace: 'nowrap',
    width: w || 'auto',
    letterSpacing: '-0.1px',
  }}>{children}</th>
}
function Td({ children, colSpan }) {
  return <td style={{
    fontSize: 12, color: '#1a1a1a',
    padding: '8px 10px', border: '1px solid #c0c0c0',
    lineHeight: 1.6,
  }} colSpan={colSpan}>{children || '—'}</td>
}

const s = {
   navBarMobile: {
    padding: '8px 12px',
    gap: 8,
  },
  backBtnMobile: {
    padding: '6px 10px',
    fontSize: 14,
    lineHeight: 1,
  },
  navTitleMobile: {
    fontSize: 13,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  navActionsMobile: {
    flexShrink: 0,
  },
  page: {
    minHeight: '100dvh',
    background: '#d4d8de',
    fontFamily: "'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif",
  },
  navBar: {
    position: 'sticky', top: 0, zIndex: 30,
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '8px 20px',
    background: '#1a1a2e',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
  },
  backBtn: {
    background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.65)', fontSize: 12, padding: '5px 12px',
    cursor: 'pointer', flexShrink: 0,
  },
  navTitle: {
    flex: 1, color: '#fff', fontSize: 14, fontWeight: 700,
    letterSpacing: '-0.2px',
  },
  navActions: { flexShrink: 0 },
  sheet: {
    maxWidth: 820, margin: '24px auto 0',
    background: '#fff',
    border: '1px solid #aaa',
    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
    padding: '36px 40px',
  },
  docHeader: {
    borderBottom: '3px double #1a1a2e',
    paddingBottom: 16, marginBottom: 8,
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  docMeta: { display: 'flex', justifyContent: 'space-between' },
  docMetaBottom: { display: 'flex', justifyContent: 'space-between' },
  docMetaText: { fontSize: 11, color: '#888', letterSpacing: '0.2px' },
  docTitle: {
    fontSize: 26, fontWeight: 900, color: '#1a1a2e',
    letterSpacing: '-1px', margin: '4px 0', textAlign: 'center',
  },
  alertBox: {
    margin: '16px 0',
    border: '2px solid #c0392b', background: '#fff8f8',
    padding: '12px 16px',
  },
  alertTitle: { fontSize: 13, fontWeight: 800, color: '#c0392b', marginBottom: 4, letterSpacing: '-0.2px' },
  alertDesc: { fontSize: 12, color: '#555', lineHeight: 1.6 },
  table: {
    width: '100%', borderCollapse: 'collapse',
    border: '1px solid #c0c0c0', marginBottom: 4, fontSize: 12,
  },
  th: {
    background: '#eef0f3', color: '#2c3e50',
    fontSize: 12, fontWeight: 700,
    padding: '8px 10px', border: '1px solid #c0c0c0',
    textAlign: 'left',
  },
  td: {
    fontSize: 12, color: '#1a1a1a',
    padding: '8px 10px', border: '1px solid #c0c0c0', lineHeight: 1.6,
  },
  gradeRow: {
    display: 'flex', alignItems: 'center', gap: 14,
    margin: '12px 0',
    padding: '12px 16px',
    background: '#f8f9fa',
    border: '1px solid #d0d0d0',
  },
  gradeLabel: { fontSize: 12, fontWeight: 700, color: '#333', whiteSpace: 'nowrap' },
  gradeValue: {
    fontSize: 20, fontWeight: 900,
    border: '2px solid', padding: '3px 14px',
    letterSpacing: '-0.5px',
  },
  gradeDesc: { fontSize: 12, color: '#666', flex: 1 },

  // ✅ 현장 이미지 섹션
  imageSection: {
    marginBottom: 8,
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    border: '1px solid #c0c0c0',
    background: '#f0f0f0',
    maxHeight: 420,
  },
  siteImage: {
    width: '100%',
    maxHeight: 420,
    objectFit: 'contain',
    display: 'block',
  },
  imageBadge: {
    position: 'absolute',
    top: 10, right: 10,
    background: 'rgba(26,26,46,0.82)',
    color: '#fff',
    fontSize: 11, fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 3,
    letterSpacing: '0.3px',
  },
  imageCaption: {
    marginTop: 6,
    fontSize: 11, color: '#888',
    lineHeight: 1.6,
  },

  signSection: { marginTop: 36, border: '1px solid #ccc' },
  signTitle: {
    background: '#eef0f3', padding: '6px 14px',
    fontSize: 12, fontWeight: 700, color: '#333',
    borderBottom: '1px solid #ccc', letterSpacing: '2px', textAlign: 'center',
  },
  signRow: { display: 'flex' },
  signBox: { flex: 1, display: 'flex', flexDirection: 'column' },
  signLabel: {
    fontSize: 12, fontWeight: 600, color: '#444',
    background: '#f5f5f5', textAlign: 'center',
    padding: '6px', borderBottom: '1px solid #ddd',
    letterSpacing: '1.5px',
  },
  signSpace: { height: 52 },
  signBottom: {
    fontSize: 11, color: '#bbb', textAlign: 'right',
    padding: '4px 10px', borderTop: '1px solid #eee',
  },
  docFooter: {
    marginTop: 24,
    fontSize: 10, color: '#aaa', textAlign: 'center',
    borderTop: '1px solid #eee', paddingTop: 12,
    lineHeight: 1.6,
  },
}