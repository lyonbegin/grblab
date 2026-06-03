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
  const imageUrl = state?.imageUrl // InputPage에서 전달된 프리뷰 이미지

  const [step1Data, setStep1Data] = useState([]);
  const [step2Data, setStep2Data] = useState([]);

  useEffect(() => {
    if (!state?.result) {
      navigate('/')
      return
    }

    try {
      // 배열 형태나 단일 객체 모두 대응 가능하도록 안전하게 처리
      const targetData = Array.isArray(state.result) ? state.result[0] : state.result

      // ```json ... ``` 블록 제거 후 순수 JSON 파싱
      const cleanJson = (str) => {
        if (!str) return '{}';
        return str.replace(/```json\n?/, '').replace(/```$/, '').trim();
      }

      if (targetData.step1_raw_result) {
        const parsed1 = JSON.parse(cleanJson(targetData.step1_raw_result));
        setStep1Data(parsed1.분석결과 || []);
      }
      if (targetData.step2_prescription_result) {
        const parsed2 = JSON.parse(cleanJson(targetData.step2_prescription_result));
        setStep2Data(parsed2.longevity_mechanisms || []);
      }
    } catch (e) {
      console.error("JSON 파싱 에러:", e);
    }
  }, [state, navigate])

  if (!state?.result) return null;

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

    pdf.save(`AI_소변분석_생체지표보고서_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div style={s.page}>
      {/* 상단 네비바 */}
      <div style={{ ...s.navBar, ...(isMobile ? s.navBarMobile : {}) }}>
        <button onClick={() => navigate(-1)} style={{ ...s.backBtn, ...(isMobile ? s.backBtnMobile : {}) }}>
          ← 뒤로가기
        </button>
        <span style={{ ...s.navTitle, ...(isMobile ? s.navTitleMobile : {}) }}>
          GRBlab Bio AI
        </span>
        <div style={{ ...s.navActions, ...(isMobile ? s.navActionsMobile : {}) }}>
          <button onClick={savePdf} style={s.pdfBtn}>
            PDF 다운로드
          </button>
        </div>
      </div>

      <div id="result-content" style={s.sheet}>
        {/* ══ 문서 제목 헤더 ══ */}
        <div style={s.docHeader}>
          <div style={s.docMeta}>
            <span style={s.docMetaText}>AI 생체 지표 분석 및 소변 검사 결과보고서</span>
            <span style={s.docMetaText}>문서번호: URINE-AI-{Date.now().toString().slice(-6)}</span>
          </div>
          <h1 style={s.docTitle}>소변 분석 기반 신체 기능 및 장수 가이드라인</h1>
          <div style={s.docMetaBottom}>
            <span style={s.docMetaText}>분석일자: {today}</span>
            <span style={s.docMetaText}>AI 멀티모달 자동 정밀분석 시스템</span>
          </div>
        </div>

        {/* ══ 촬영 이미지 확인 섹션 ══ */}
        {imageUrl && (
          <>
            <SectionTitle num="분석대상" title="소변 검사 시트 캡처 이미지" />
            <div style={s.imageSection}>
              <div style={s.imageWrap}>
                <img src={imageUrl} alt="소변 검사지" style={s.siteImage} />
                <div style={s.imageBadge}>AI 인식 완료</div>
              </div>
              <div style={s.imageCaption}>
                📷 촬영된 생체 지표 스트립을 분석하여 딥러닝 기반으로 각 검출 항목의 스펙트럼 강도를 추출하였습니다.
              </div>
            </div>
          </>
        )}

        {/* ══ 제1항. 소변 지표별 검출 순위 및 연계 물질 ══ */}
        <SectionTitle num="제1항" title="소변 생체 지표별 검출 강도 순위 및 필요 영양 성분" />
        <table style={s.table}>
          <thead>
            <tr>
              <th style={{ ...s.th, width: 60, textAlign: 'center' }}>우선순위</th>
              <th style={{ ...s.th, width: 140 }}>지표 항목명 (Item)</th>
              <th style={s.th}>최적 매칭 맞춤형 영양 물질 (Nutrients)</th>
            </tr>
          </thead>
          <tbody>
            {step1Data.length > 0 ? step1Data.map((item, i) => (
              <tr key={i} style={i % 2 === 1 ? { background: '#fafafa' } : {}}>
                <td style={{ ...s.td, textAlign: 'center', fontWeight: 'bold', color: i < 3 ? '#c0392b' : '#555' }}>
                  {item.순위}
                </td>
                <td style={{ ...s.td, fontWeight: 700, color: '#1a1a2e' }}>{item.항목명}</td>
                <td style={s.td}>
                  <div style={s.badgeContainer}>
                    {item.영양물질?.map((nut, idx) => (
                      <span key={idx} style={s.nutrientBadge}>{nut}</span>
                    ))}
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td style={{ ...s.td, color: '#999', textAlign: 'center' }} colSpan={3}>추출된 지표 데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>

        {/* ══ 제2항. 12대 장수 메커니즘 연계 정밀 처방 ══ */}
        <SectionTitle num="제2항" title="12대 생체 장수 메커니즘(Longevity Mechanisms) 분석 및 보완 솔루션" />
        <div style={s.mechanismGrid}>
          {step2Data.length > 0 ? step2Data.map((mech, i) => (
            <div key={i} style={s.mechCard}>
              <div style={s.mechHeader}>
                <span style={s.mechTitle}>{mech.mechanism}</span>
                <span style={s.mechLabel}>지표: {mech.related_urine_item}</span>
              </div>
              <div style={s.mechBody}>
                <div style={s.mechSubTitle}>핵심 추천 고기능성 물질</div>
                <div style={s.nutList}>
                  {mech.primary_nutrients?.map((nut, idx) => (
                    <span key={idx} style={s.primaryNutrientBadge}>✓ {nut}</span>
                  ))}
                </div>
              </div>
            </div>
          )) : (
            <div style={{ ...s.td, color: '#999', textAlign: 'center', width: '100%' }}>장수 메커니즘 데이터가 없습니다.</div>
          )}
        </div>

        {/* ══ 서명 및 확인란 ══ */}
        <div style={s.signSection}>
          <div style={s.signTitle}>분 석 확 인 란</div>
          <div style={s.signRow}>
            {['분석 시스템', '연구 책임자', '최종 승인'].map((label, i) => (
              <div key={label} style={{ ...s.signBox, borderRight: i < 2 ? '1px solid #ccc' : 'none' }}>
                <div style={s.signLabel}>{label}</div>
                <div style={s.signSpace} />
                <div style={s.signBottom}>(인)</div>
              </div>
            ))}
          </div>
        </div>

        <div style={s.docFooter}>
          본 분석 결과보고서는 GRBlab Bio AI 유린 스크리닝 아키텍처에 의해 자동 생성되었습니다. 본 가이드는 질병의 진단 및 치료를 대체할 수 없으며, 상세 수치는 연구 목적의 생체 메커니즘 추정치입니다.
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

const s = {
  page: {
    minHeight: '100dvh',
    background: '#d4d8de',
    fontFamily: "'Noto Sans KR', 'Malgun Gothic', sans-serif",
  },
  navBar: {
    position: 'sticky', top: 0, zIndex: 30,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    padding: '10px 20px',
    background: '#1a1a2e',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
  },
  navBarMobile: { padding: '8px 12px', gap: 8 },
  backBtn: {
    background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.85)', fontSize: 12, padding: '6px 12px',
    cursor: 'pointer', borderRadius: 4,
  },
  backBtnMobile: { padding: '4px 8px', fontSize: 11 },
  navTitle: { color: '#fff', fontSize: 15, fontWeight: 800, letterSpacing: '-0.2px' },
  navTitleMobile: { fontSize: 13 },
  navActions: { flexShrink: 0 },
  navActionsMobile: { flexShrink: 0 },
  pdfBtn: {
    background: '#FAE100', border: 'none', color: '#1a1a1a',
    fontSize: 12, fontWeight: 800, padding: '6px 14px',
    borderRadius: 6, cursor: 'pointer', boxShadow: '0 2px 8px rgba(250,225,0,0.2)',
  },
  sheet: {
    maxWidth: 820, margin: '24px auto 40px',
    background: '#fff',
    border: '1px solid #aaa',
    boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
    padding: '36px 40px',
    boxSizing: 'border-box',
  },
  docHeader: {
    borderBottom: '3px double #1a1a2e',
    paddingBottom: 16, marginBottom: 18,
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  docMeta: { display: 'flex', justifyContent: 'space-between' },
  docMetaBottom: { display: 'flex', justifyContent: 'space-between' },
  docMetaText: { fontSize: 11, color: '#777', letterSpacing: '0.1px' },
  docTitle: {
    fontSize: 24, fontWeight: 900, color: '#1a1a2e',
    letterSpacing: '-1px', margin: '6px 0', textAlign: 'center',
  },
  table: {
    width: '100%', borderCollapse: 'collapse',
    border: '1px solid #c0c0c0', marginBottom: 20, fontSize: 12,
  },
  th: {
    background: '#eef0f3', color: '#2c3e50',
    fontSize: 12, fontWeight: 700,
    padding: '10px 12px', border: '1px solid #c0c0c0',
    textAlign: 'left',
  },
  td: {
    fontSize: 12, color: '#1a1a1a',
    padding: '10px 12px', border: '1px solid #c0c0c0', lineHeight: 1.6,
  },
  badgeContainer: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  nutrientBadge: {
    background: '#f1f3f5', color: '#495057',
    padding: '3px 8px', borderRadius: 4,
    fontSize: 11, fontWeight: 500,
    border: '1px solid #e9ecef'
  },
  imageSection: { marginBottom: 16 },
  imageWrap: {
    position: 'relative', width: '100%', borderRadius: 4,
    overflow: 'hidden', border: '1px solid #c0c0c0',
    background: '#f8f9fa', maxHeight: 300,
  },
  siteImage: { width: '100%', maxHeight: 300, objectFit: 'contain', display: 'block' },
  imageBadge: {
    position: 'absolute', top: 10, right: 10,
    background: 'rgba(26,26,46,0.85)', color: '#fff',
    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 3,
  },
  imageCaption: { marginTop: 6, fontSize: 11, color: '#888', lineHeight: 1.5 },
  
  // 장수 메커니즘 그리드 스타일
  mechanismGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
    gap: 12,
    marginBottom: 24,
  },
  mechCard: {
    border: '1px solid #dcdde1',
    borderRadius: 6,
    background: '#fff',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  mechHeader: {
    background: '#1a1a2e',
    padding: '8px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mechTitle: { color: '#fff', fontSize: 12, fontWeight: 800 },
  mechLabel: { color: '#FAE100', fontSize: 11, fontWeight: 500 },
  mechBody: { padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 },
  mechSubTitle: { fontSize: 11, color: '#888', fontWeight: 600 },
  nutList: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  primaryNutrientBadge: {
    fontSize: 11, color: '#2c3e50', fontWeight: 600,
    background: '#edf2f7', padding: '2px 6px', borderRadius: 4,
  },

  signSection: { marginTop: 32, border: '1px solid #ccc' },
  signTitle: {
    background: '#eef0f3', padding: '6px 14px',
    fontSize: 11, fontWeight: 700, color: '#333',
    borderBottom: '1px solid #ccc', letterSpacing: '2px', textAlign: 'center',
  },
  signRow: { display: 'flex' },
  signBox: { flex: 1, display: 'flex', flexDirection: 'column' },
  signLabel: {
    fontSize: 11, fontWeight: 600, color: '#444',
    background: '#f5f5f5', textAlign: 'center',
    padding: '6px', borderBottom: '1px solid #ddd',
  },
  signSpace: { height: 48 },
  signBottom: {
    fontSize: 11, color: '#bbb', textAlign: 'right',
    padding: '4px 10px', borderTop: '1px solid #eee',
  },
  docFooter: {
    marginTop: 24, fontSize: 10, color: '#aaa', textAlign: 'center',
    borderTop: '1px solid #eee', paddingTop: 12, lineHeight: 1.6,
  },
}