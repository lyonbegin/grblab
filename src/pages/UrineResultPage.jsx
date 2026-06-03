// src/pages/UrineResultPage.jsx
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
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

export default function UrineResultPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const imageUrl = state?.imageUrl

  const [step1Data, setStep1Data] = useState([])
  const [step2Data, setStep2Data] = useState([])
  const [step3Data, setStep3Data] = useState([])  // ✅ 추가

  useEffect(() => {
    if (!state?.result) { navigate('/'); return }

    try {
      const targetData = Array.isArray(state.result) ? state.result[0] : state.result

      console.log('📦 받은 result:', targetData)

      if (targetData.step1_result) {
        setStep1Data(targetData.step1_result?.분석결과 || [])
      }
      if (targetData.step2_result) {
        setStep2Data(targetData.step2_result?.longevity_mechanisms || [])
      }
      if (targetData.step3_result) {  // ✅ 추가
        setStep3Data(targetData.step3_result?.supplement_stack || [])
      }
    } catch (e) {
      console.error("JSON 파싱 에러:", e)
    }
  }, [state, navigate])

  if (!state?.result) return null

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const isMobile = useIsMobile()

  const savePdf = async () => {
    const src = document.getElementById('result-content')
    if (!src) return

    const clone = src.cloneNode(true)
    const sandbox = document.createElement('div')
    sandbox.style.position = 'fixed'
    sandbox.style.left = '-99999px'
    sandbox.style.top = '0'
    sandbox.style.width = '820px'
    sandbox.style.background = '#ffffff'
    sandbox.style.zIndex = '999999'

    clone.style.width = '820px'
    clone.style.maxWidth = '820px'
    clone.style.margin = '0'
    clone.style.boxShadow = 'none'
    clone.style.border = 'none'
    clone.style.padding = '36px 40px'
    clone.style.background = '#ffffff'

    clone.querySelectorAll('*').forEach((el) => {
      const cs = window.getComputedStyle(el)
      if (cs.position === 'sticky' || cs.position === 'fixed') {
        el.style.position = 'static'
      }
    })

    sandbox.appendChild(clone)
    document.body.appendChild(sandbox)

    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready } catch (_) {}
    }

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

    document.body.removeChild(sandbox)

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

    pdf.save(`Anti-age_Personalized_Nutrition_Report_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div style={s.page}>
      {/* 상단 네비바 */}
      <div style={{ ...s.navBar, ...(isMobile ? s.navBarMobile : {}) }}>
        <button onClick={() => navigate(-1)} style={{ ...s.backBtn, ...(isMobile ? s.backBtnMobile : {}) }}>
          ← Back
        </button>
        <span style={{ ...s.navTitle, ...(isMobile ? s.navTitleMobile : {}) }}>
          Anti-âge
        </span>
        <div style={{ ...s.navActions, ...(isMobile ? s.navActionsMobile : {}) }}>
          <button onClick={savePdf} style={s.pdfBtn}>
            Download PDF
          </button>
        </div>
      </div>

      <div id="result-content" style={s.sheet}>
        {/* ══ 문서 제목 헤더 ══ */}
        <div style={s.docHeader}>
          <div style={s.docMeta}>
            <span style={s.docMetaText}>Anti-âge Personalized Nutrition Analysis</span>
            <span style={s.docMetaText}>Report No. ANA-{Date.now().toString().slice(-6)}</span>
          </div>
          <h1 style={s.docTitle}>Anti-âge 개인 영양 프로파일</h1>
          <div style={s.docSubTitle}>Urine Biomarker — Based Nutritional Intelligence</div>
          <div style={s.docMetaBottom}>
            <span style={s.docMetaText}>Analysis Date: {today}</span>
            <span style={s.docMetaText}>Anti-âge Bio AI Analysis System</span>
          </div>
        </div>

        {/* ══ 촬영 이미지 확인 섹션 ══ */}
        {imageUrl && (
          <>
            <SectionTitle num="SAMPLE" title="Urine Test Strip — Captured Image" />
            <div style={s.imageSection}>
              <div style={s.imageWrap}>
                <img src={imageUrl} alt="소변 검사지" style={s.siteImage} />
                <div style={s.imageBadge}>AI Recognition Complete</div>
              </div>
              <div style={s.imageCaption}>
                📷 소변 바이오마커 스트립 이미지를 AI가 분석하여 각 항목의 반응 강도를 정량화하고 개인 맞춤형 영양 인사이트를 생성하였습니다.
              </div>
            </div>
          </>
        )}

        {/* ══ 제1항. 소변 지표별 검출 순위 및 연계 물질 ══ */}
        <SectionTitle num="01" title="우선 관리 바이오마커 및 추천 영양 성분" />
        <table style={s.table}>
          <thead>
            <tr>
              <th style={{ ...s.th, width: 60, textAlign: 'center' }}>Priority</th>
              <th style={{ ...s.th, width: 140 }}>Biomarker</th>
              <th style={s.th}>Recommended Nutrients</th>
            </tr>
          </thead>
          <tbody>
            {step1Data.length > 0 ? step1Data.map((item, i) => (
              <tr key={i} style={i % 2 === 1 ? { background: '#fafafa' } : {}}>
                <td style={{ ...s.td, textAlign: 'center', fontWeight: 'bold', color: i < 3 ? '#8b5e3c' : '#777' }}>
                  {item.순위}
                </td>
                <td style={{ ...s.td, fontWeight: 700, color: '#1a1a1a' }}>{item.항목명}</td>
                <td style={s.td}>
                  <div style={s.badgeContainer}>
                    {item.영양물질?.map((nut, idx) => (
                      <span key={idx} style={s.nutrientBadge}>{nut}</span>
                    ))}
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td style={{ ...s.td, color: '#bbb', textAlign: 'center', fontStyle: 'italic' }} colSpan={3}>No biomarker data available.</td></tr>
            )}
          </tbody>
        </table>

        {/* ══ 제2항. Well-Aging Biomarker Insights ══ */}
        <SectionTitle num="02" title="Well-Aging Biomarker Insights" />
        <div style={s.mechanismGrid}>
          {step2Data.length > 0 ? step2Data.map((mech, i) => (
            <div key={i} style={s.mechCard}>
              <div style={s.mechHeader}>
                <span style={s.mechTitle}>{mech.mechanism}</span>
                <span style={s.mechLabel}>{mech.related_urine_item}</span>
              </div>
              <div style={s.mechBody}>
                <div style={s.mechSubTitle}>Recommended Functional Nutrients</div>
                <div style={s.nutList}>
                  {mech.primary_nutrients?.map((nut, idx) => (
                    <span key={idx} style={s.primaryNutrientBadge}>✓ {nut}</span>
                  ))}
                </div>
              </div>
            </div>
          )) : (
            <div style={{ color: '#bbb', textAlign: 'center', width: '100%', fontStyle: 'italic', fontSize: 12 }}>
              생체 메커니즘 분석 데이터가 없습니다.
            </div>
          )}
        </div>

        {/* ══ 제3항. 맞춤형 서플리먼트 스택 ══ */}
        <SectionTitle num="03" title="Personalized Supplement Stack" />
        <table style={s.table}>
          <thead>
            <tr>
              <th style={{ ...s.th, width: 40, textAlign: 'center' }}>#</th>
              <th style={{ ...s.th, width: 160 }}>Product / Brand</th>
              <th style={{ ...s.th, width: 180 }}>Target Mechanisms</th>
              <th style={s.th}>Key Nutrients</th>
              <th style={{ ...s.th, width: 180 }}>Dosage Tip</th>
              <th style={{ ...s.th, width: 70, textAlign: 'center' }}>Channel</th>
            </tr>
          </thead>
          <tbody>
            {step3Data.length > 0 ? step3Data.map((item, i) => (
              <tr key={i} style={i % 2 === 1 ? { background: '#fafafa' } : {}}>
                <td style={{ ...s.td, textAlign: 'center', fontWeight: 'bold', color: i < 3 ? '#8b5e3c' : '#777' }}>
                  {item.rank}
                </td>
                <td style={s.td}>
                  <div style={{ fontWeight: 700, color: '#1a1a1a', fontSize: 12 }}>{item.product_name}</div>
                  <div style={{ fontSize: 10, color: '#8b5e3c', marginTop: 2 }}>{item.brand}</div>
                </td>
                <td style={s.td}>
                  <div style={s.badgeContainer}>
                    {item.target_mechanisms?.map((m, idx) => (
                      <span key={idx} style={s.mechBadge}>{m}</span>
                    ))}
                  </div>
                </td>
                <td style={s.td}>
                  <div style={s.badgeContainer}>
                    {item.key_nutrients?.map((nut, idx) => (
                      <span key={idx} style={s.nutrientBadge}>{nut}</span>
                    ))}
                  </div>
                </td>
                <td style={{ ...s.td, fontSize: 11, color: '#555', lineHeight: 1.5 }}>
                  {item.dosage_tip}
                </td>
                <td style={{ ...s.td, textAlign: 'center' }}>
                  <span style={s.channelBadge}>{item.purchase_channel}</span>
                </td>
              </tr>
            )) : (
              <tr>
                <td style={{ ...s.td, color: '#bbb', textAlign: 'center', fontStyle: 'italic' }} colSpan={6}>
                  No supplement data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ══ 서명 및 확인란 ══ */}
        <div style={s.signSection}>
          <div style={s.signTitle}>VERIFICATION</div>
          <div style={s.signRow}>
            {['Analysis System', 'Research Director', 'Final Approval'].map((label, i) => (
              <div key={label} style={{ ...s.signBox, borderRight: i < 2 ? '1px solid #e5e5e5' : 'none' }}>
                <div style={s.signLabel}>{label}</div>
                <div style={s.signSpace} />
                <div style={s.signBottom}>(seal)</div>
              </div>
            ))}
          </div>
        </div>

        <div style={s.docFooter}>
          본 보고서는 소변 바이오마커 분석 결과를 기반으로 생성된 개인 맞춤형 영양 및 건강관리 참고자료입니다.
          본 보고서는 의료적 진단 또는 치료를 위한 자료가 아니며, 건강수명 관리와 웰에이징 라이프스타일 설계를 위한 참고 정보로 활용하시기 바랍니다.
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
      margin: '28px 0 12px',
      paddingBottom: 6,
      borderBottom: '1.5px solid #c9b89a',
    }}>
      <span style={{
        background: '#8b5e3c', color: '#fff',
        fontSize: 9, fontWeight: 800,
        padding: '2px 8px', letterSpacing: '1.5px',
        textTransform: 'uppercase',
      }}>{num}</span>
      <span style={{ fontSize: 13, fontWeight: 800, color: '#2a1f14', letterSpacing: '0.2px' }}>{title}</span>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100dvh',
    background: '#ede8e0',
    fontFamily: "'Noto Sans KR', 'Malgun Gothic', sans-serif",
  },
  navBar: {
    position: 'sticky', top: 0, zIndex: 30,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    padding: '10px 20px',
    background: '#2a1f14',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  navBarMobile: { padding: '8px 12px', gap: 8 },
  backBtn: {
    background: 'transparent', border: '1px solid rgba(255,255,255,0.18)',
    color: 'rgba(255,255,255,0.7)', fontSize: 12, padding: '6px 12px',
    cursor: 'pointer', borderRadius: 3, letterSpacing: '0.3px',
  },
  backBtnMobile: { padding: '4px 8px', fontSize: 11 },
  navTitle: {
    color: '#e8ddd0', fontSize: 16, fontWeight: 800,
    letterSpacing: '1px', fontStyle: 'italic',
  },
  navTitleMobile: { fontSize: 14 },
  navActions: { flexShrink: 0 },
  navActionsMobile: { flexShrink: 0 },
  pdfBtn: {
    background: '#c9b89a', border: 'none', color: '#2a1f14',
    fontSize: 11, fontWeight: 800, padding: '6px 14px',
    borderRadius: 3, cursor: 'pointer', letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  sheet: {
    maxWidth: 820, margin: '24px auto 40px',
    background: '#fff',
    border: '1px solid #d4ccc0',
    boxShadow: '0 4px 32px rgba(42,31,20,0.10)',
    padding: '40px 44px',
    boxSizing: 'border-box',
  },
  docHeader: {
    borderBottom: '2px solid #2a1f14',
    paddingBottom: 18, marginBottom: 20,
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  docMeta: { display: 'flex', justifyContent: 'space-between' },
  docMetaBottom: { display: 'flex', justifyContent: 'space-between', marginTop: 4 },
  docMetaText: { fontSize: 10, color: '#9e8e7e', letterSpacing: '0.4px' },
  docTitle: {
    fontSize: 22, fontWeight: 900, color: '#2a1f14',
    letterSpacing: '-0.5px', margin: '8px 0 2px', textAlign: 'center',
  },
  docSubTitle: {
    textAlign: 'center',
    fontSize: 11,
    color: '#8b5e3c',
    fontWeight: 600,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  table: {
    width: '100%', borderCollapse: 'collapse',
    border: '1px solid #ddd4c8', marginBottom: 20, fontSize: 12,
  },
  th: {
    background: '#f5f0e8', color: '#2a1f14',
    fontSize: 11, fontWeight: 800,
    padding: '10px 12px', border: '1px solid #ddd4c8',
    textAlign: 'left', letterSpacing: '0.5px', textTransform: 'uppercase',
  },
  td: {
    fontSize: 12, color: '#1a1a1a',
    padding: '10px 12px', border: '1px solid #e8e0d8', lineHeight: 1.6,
    verticalAlign: 'top',
  },
  badgeContainer: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  nutrientBadge: {
    background: '#f5f0e8', color: '#5c4030',
    padding: '3px 9px', borderRadius: 3,
    fontSize: 11, fontWeight: 500,
    border: '1px solid #e0d4c4',
  },
  mechBadge: {
    background: '#eaf1f8', color: '#2a3a50',
    padding: '3px 9px', borderRadius: 3,
    fontSize: 11, fontWeight: 500,
    border: '1px solid #d0e2f0',
  },
  channelBadge: {
    background: '#2a1f14', color: '#e8ddd0',
    padding: '3px 8px', borderRadius: 3,
    fontSize: 10, fontWeight: 700,
    letterSpacing: '0.3px',
  },
  imageSection: { marginBottom: 16 },
  imageWrap: {
    position: 'relative', width: '100%', borderRadius: 3,
    overflow: 'hidden', border: '1px solid #ddd4c8',
    background: '#f8f5f0', maxHeight: 300,
  },
  siteImage: { width: '100%', maxHeight: 300, objectFit: 'contain', display: 'block' },
  imageBadge: {
    position: 'absolute', top: 10, right: 10,
    background: 'rgba(42,31,20,0.85)', color: '#e8ddd0',
    fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 2,
    letterSpacing: '0.5px',
  },
  imageCaption: { marginTop: 6, fontSize: 11, color: '#9e8e7e', lineHeight: 1.6 },
  mechanismGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
    gap: 12,
    marginBottom: 24,
  },
  mechCard: {
    border: '1px solid #ddd4c8',
    borderRadius: 4,
    background: '#fff',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  mechHeader: {
    background: '#215a8e',
    padding: '9px 13px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mechTitle: { color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: '0.2px' },
  mechLabel: { color: '#c9e0f5', fontSize: 10, fontWeight: 500, letterSpacing: '0.3px' },
  mechBody: { padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 },
  mechSubTitle: { fontSize: 10, color: '#8b5e3c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' },
  nutList: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  primaryNutrientBadge: {
    fontSize: 11, color: '#2a3a50', fontWeight: 600,
    background: '#eaf1f8', padding: '2px 8px', borderRadius: 3,
    border: '1px solid #d0e2f0',
  },
  signSection: { marginTop: 36, border: '1px solid #ddd4c8' },
  signTitle: {
    background: '#f5f0e8', padding: '6px 14px',
    fontSize: 10, fontWeight: 800, color: '#2a1f14',
    borderBottom: '1px solid #ddd4c8', letterSpacing: '3px', textAlign: 'center',
    textTransform: 'uppercase',
  },
  signRow: { display: 'flex' },
  signBox: { flex: 1, display: 'flex', flexDirection: 'column' },
  signLabel: {
    fontSize: 10, fontWeight: 700, color: '#5c4030',
    background: '#faf7f3', textAlign: 'center',
    padding: '6px', borderBottom: '1px solid #e8e0d8',
    letterSpacing: '0.3px',
  },
  signSpace: { height: 48 },
  signBottom: {
    fontSize: 10, color: '#c0b0a0', textAlign: 'right',
    padding: '4px 10px', borderTop: '1px solid #eee8e0',
  },
  docFooter: {
    marginTop: 24, fontSize: 10, color: '#b0a090', textAlign: 'center',
    borderTop: '1px solid #ede8e0', paddingTop: 12, lineHeight: 1.7,
    letterSpacing: '0.1px',
  },
}