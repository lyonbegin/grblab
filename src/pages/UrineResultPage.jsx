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
  const isMobile = useIsMobile()

  const [step1Data, setStep1Data] = useState([])
  const [step2Data, setStep2Data] = useState([])
  const [step3Data, setStep3Data] = useState([])

  useEffect(() => {
    if (!state?.result) { navigate('/'); return }
    try {
      const targetData = Array.isArray(state.result) ? state.result[0] : state.result
      console.log('📦 받은 result:', targetData)
      if (targetData.step1_result) setStep1Data(targetData.step1_result?.분석결과 || [])
      if (targetData.step2_result) setStep2Data(targetData.step2_result?.longevity_mechanisms || [])
      if (targetData.step3_result) setStep3Data(targetData.step3_result?.supplement_stack || [])
    } catch (e) {
      console.error("JSON 파싱 에러:", e)
    }
  }, [state, navigate])

  if (!state?.result) return null

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })

  const savePdf = async () => {
    const src = document.getElementById('result-content')
    if (!src) return
    const clone = src.cloneNode(true)
    const sandbox = document.createElement('div')
    sandbox.style.cssText = 'position:fixed;left:-99999px;top:0;width:820px;background:#ffffff;z-index:999999'
    clone.style.cssText = 'width:820px;max-width:820px;margin:0;box-shadow:none;border:none;padding:36px 40px;background:#ffffff'
    clone.querySelectorAll('*').forEach((el) => {
      const cs = window.getComputedStyle(el)
      if (cs.position === 'sticky' || cs.position === 'fixed') el.style.position = 'static'
    })
    sandbox.appendChild(clone)
    document.body.appendChild(sandbox)
    if (document.fonts?.ready) { try { await document.fonts.ready } catch (_) {} }
    const canvas = await html2canvas(clone, {
      scale: 2, useCORS: true, allowTaint: true,
      backgroundColor: '#ffffff',
      windowWidth: clone.scrollWidth, windowHeight: clone.scrollHeight,
      scrollX: 0, scrollY: 0,
    })
    document.body.removeChild(sandbox)
    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgWidth = 210
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight, position = 0
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
    heightLeft -= 297
    while (heightLeft > 0) {
      pdf.addPage()
      position = heightLeft - imgHeight
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= 297
    }
    pdf.save(`Anti-age_Personalized_Nutrition_Report_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#ede8e0', fontFamily: "'Noto Sans KR', 'Malgun Gothic', sans-serif" }}>

      {/* ══ 네비바 ══ */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '8px 12px' : '10px 20px',
        background: '#2a1f14',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        gap: 8,
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'transparent', border: '1px solid rgba(255,255,255,0.18)',
          color: 'rgba(255,255,255,0.7)', fontSize: isMobile ? 11 : 12,
          padding: isMobile ? '4px 8px' : '6px 12px',
          cursor: 'pointer', borderRadius: 3, whiteSpace: 'nowrap',
        }}>← Back</button>
        <span style={{
          color: '#e8ddd0', fontSize: isMobile ? 14 : 16,
          fontWeight: 800, letterSpacing: '1px', fontStyle: 'italic',
        }}>Anti-âge</span>
        <button onClick={savePdf} style={{
          background: '#c9b89a', border: 'none', color: '#2a1f14',
          fontSize: isMobile ? 10 : 11, fontWeight: 800,
          padding: isMobile ? '4px 10px' : '6px 14px',
          borderRadius: 3, cursor: 'pointer', whiteSpace: 'nowrap',
          textTransform: 'uppercase',
        }}>Download PDF</button>
      </div>

      {/* ══ 시트 ══ */}
      <div id="result-content" style={{
        maxWidth: 820,
        margin: isMobile ? '12px auto 32px' : '24px auto 40px',
        background: '#fff',
        border: '1px solid #d4ccc0',
        boxShadow: '0 4px 32px rgba(42,31,20,0.10)',
        padding: isMobile ? '20px 16px' : '40px 44px',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}>

        {/* ── 헤더 ── */}
        <div style={{ borderBottom: '2px solid #2a1f14', paddingBottom: 14, marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <span style={{ fontSize: 10, color: '#9e8e7e' }}>Anti-âge Personalized Nutrition Analysis</span>
            <span style={{ fontSize: 10, color: '#9e8e7e' }}>Report No. ANA-{Date.now().toString().slice(-6)}</span>
          </div>
          <h1 style={{
            fontSize: isMobile ? 16 : 22, fontWeight: 900, color: '#2a1f14',
            letterSpacing: '-0.5px', margin: '8px 0 2px', textAlign: 'center',
          }}>Anti-âge 개인 영양 프로파일</h1>
          <div style={{
            textAlign: 'center', fontSize: isMobile ? 9 : 11, color: '#8b5e3c',
            fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6,
          }}>Urine Biomarker — Based Nutritional Intelligence</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, marginTop: 4 }}>
            <span style={{ fontSize: 10, color: '#9e8e7e' }}>Analysis Date: {today}</span>
            <span style={{ fontSize: 10, color: '#9e8e7e' }}>Anti-âge Bio AI Analysis System</span>
          </div>
        </div>

        {/* ── SAMPLE 이미지 ── */}
        {imageUrl && (
          <>
            <SectionTitle num="SAMPLE" title="Urine Test Strip — Captured Image" />
            <div style={{ marginBottom: 16 }}>
              <div style={{ position: 'relative', width: '100%', borderRadius: 3, overflow: 'hidden', border: '1px solid #ddd4c8', background: '#f8f5f0', maxHeight: 260 }}>
                <img src={imageUrl} alt="소변 검사지" style={{ width: '100%', maxHeight: 260, objectFit: 'contain', display: 'block' }} />
                <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(42,31,20,0.85)', color: '#e8ddd0', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 2 }}>
                  AI Recognition Complete
                </div>
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: '#9e8e7e', lineHeight: 1.6 }}>
                📷 소변 바이오마커 스트립 이미지를 AI가 분석하여 각 항목의 반응 강도를 정량화하고 개인 맞춤형 영양 인사이트를 생성하였습니다.
              </div>
            </div>
          </>
        )}

        {/* ── 01. 바이오마커 ── */}
        <SectionTitle num="01" title="우선 관리 바이오마커 및 추천 영양 성분" />
        {isMobile ? (
          /* 모바일: 카드형 */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {step1Data.length > 0 ? step1Data.map((item, i) => (
              <div key={i} style={{ border: '1px solid #e0d4c4', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: i % 2 === 0 ? '#f5f0e8' : '#faf7f3', padding: '8px 12px', borderBottom: '1px solid #e0d4c4' }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: i < 3 ? '#8b5e3c' : '#aaa', minWidth: 22 }}>{item.순위}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#1a1a1a' }}>{item.항목명}</span>
                </div>
                <div style={{ padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {item.영양물질?.map((nut, idx) => (
                    <span key={idx} style={{ background: '#f5f0e8', color: '#5c4030', padding: '2px 8px', borderRadius: 3, fontSize: 11, border: '1px solid #e0d4c4' }}>{nut}</span>
                  ))}
                </div>
              </div>
            )) : <div style={{ color: '#bbb', textAlign: 'center', fontSize: 12, fontStyle: 'italic' }}>No biomarker data available.</div>}
          </div>
        ) : (
          /* 데스크톱: 테이블 */
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
                  <td style={{ ...s.td, textAlign: 'center', fontWeight: 'bold', color: i < 3 ? '#8b5e3c' : '#777' }}>{item.순위}</td>
                  <td style={{ ...s.td, fontWeight: 700, color: '#1a1a1a' }}>{item.항목명}</td>
                  <td style={s.td}>
                    <div style={s.badgeRow}>
                      {item.영양물질?.map((nut, idx) => <span key={idx} style={s.nutBadge}>{nut}</span>)}
                    </div>
                  </td>
                </tr>
              )) : <tr><td style={{ ...s.td, color: '#bbb', textAlign: 'center', fontStyle: 'italic' }} colSpan={3}>No biomarker data available.</td></tr>}
            </tbody>
          </table>
        )}

        {/* ── 02. 장수 메커니즘 ── */}
        <SectionTitle num="02" title="Well-Aging Biomarker Insights" />
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(330px, 1fr))',
          gap: isMobile ? 8 : 12,
          marginBottom: 24,
        }}>
          {step2Data.length > 0 ? step2Data.map((mech, i) => (
            <div key={i} style={{ border: '1px solid #ddd4c8', borderRadius: 4, background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: '#215a8e', padding: isMobile ? '7px 10px' : '9px 13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#fff', fontSize: isMobile ? 11 : 12, fontWeight: 800 }}>{mech.mechanism}</span>
                <span style={{ color: '#c9e0f5', fontSize: 10, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>{mech.related_urine_item}</span>
              </div>
              <div style={{ padding: isMobile ? '8px 10px' : '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 10, color: '#8b5e3c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Recommended Functional Nutrients</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {mech.primary_nutrients?.map((nut, idx) => (
                    <span key={idx} style={{ fontSize: 11, color: '#2a3a50', fontWeight: 600, background: '#eaf1f8', padding: '2px 7px', borderRadius: 3, border: '1px solid #d0e2f0' }}>✓ {nut}</span>
                  ))}
                </div>
              </div>
            </div>
          )) : (
            <div style={{ color: '#bbb', textAlign: 'center', fontStyle: 'italic', fontSize: 12 }}>생체 메커니즘 분석 데이터가 없습니다.</div>
          )}
        </div>

        {/* ── 03. 서플리먼트 스택 ── */}
        <SectionTitle num="03" title="Personalized Supplement Stack" />
        {isMobile ? (
          /* 모바일: 카드형 */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {step3Data.length > 0 ? step3Data.map((item, i) => (
              <div key={i} style={{ border: '1px solid #ddd4c8', borderRadius: 4, overflow: 'hidden' }}>
                {/* 카드 헤더 */}
                <div style={{ background: '#2a1f14', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: '#e8ddd0', fontWeight: 800, fontSize: 13 }}>{item.product_name}</span>
                    <span style={{ color: '#c9b89a', fontSize: 11, marginLeft: 8 }}>{item.brand}</span>
                  </div>
                  <span style={{ background: '#c9b89a', color: '#2a1f14', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 2, whiteSpace: 'nowrap' }}>
                    #{item.rank}
                  </span>
                </div>
                {/* 카드 바디 */}
                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* 타겟 메커니즘 */}
                  <div>
                    <div style={{ fontSize: 10, color: '#8b5e3c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Target</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {item.target_mechanisms?.map((m, idx) => (
                        <span key={idx} style={{ background: '#eaf1f8', color: '#2a3a50', padding: '2px 7px', borderRadius: 3, fontSize: 11, border: '1px solid #d0e2f0' }}>{m}</span>
                      ))}
                    </div>
                  </div>
                  {/* 핵심 영양소 */}
                  <div>
                    <div style={{ fontSize: 10, color: '#8b5e3c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Key Nutrients</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {item.key_nutrients?.map((nut, idx) => (
                        <span key={idx} style={{ background: '#f5f0e8', color: '#5c4030', padding: '2px 7px', borderRadius: 3, fontSize: 11, border: '1px solid #e0d4c4' }}>{nut}</span>
                      ))}
                    </div>
                  </div>
                  {/* 복용 팁 */}
                  <div style={{ fontSize: 11, color: '#555', lineHeight: 1.55, background: '#faf7f3', padding: '7px 10px', borderRadius: 3, border: '1px solid #ede8e0' }}>
                    💊 {item.dosage_tip}
                  </div>
                  {/* 구매처 */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ background: '#2a1f14', color: '#e8ddd0', padding: '3px 10px', borderRadius: 3, fontSize: 10, fontWeight: 700 }}>{item.purchase_channel}</span>
                  </div>
                </div>
              </div>
            )) : <div style={{ color: '#bbb', textAlign: 'center', fontSize: 12, fontStyle: 'italic' }}>No supplement data available.</div>}
          </div>
        ) : (
          /* 데스크톱: 테이블 */
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
                  <td style={{ ...s.td, textAlign: 'center', fontWeight: 'bold', color: i < 3 ? '#8b5e3c' : '#777' }}>{item.rank}</td>
                  <td style={s.td}>
                    <div style={{ fontWeight: 700, color: '#1a1a1a', fontSize: 12 }}>{item.product_name}</div>
                    <div style={{ fontSize: 10, color: '#8b5e3c', marginTop: 2 }}>{item.brand}</div>
                  </td>
                  <td style={s.td}>
                    <div style={s.badgeRow}>
                      {item.target_mechanisms?.map((m, idx) => <span key={idx} style={s.mechBadge}>{m}</span>)}
                    </div>
                  </td>
                  <td style={s.td}>
                    <div style={s.badgeRow}>
                      {item.key_nutrients?.map((nut, idx) => <span key={idx} style={s.nutBadge}>{nut}</span>)}
                    </div>
                  </td>
                  <td style={{ ...s.td, fontSize: 11, color: '#555', lineHeight: 1.5 }}>{item.dosage_tip}</td>
                  <td style={{ ...s.td, textAlign: 'center' }}>
                    <span style={{ background: '#2a1f14', color: '#e8ddd0', padding: '3px 8px', borderRadius: 3, fontSize: 10, fontWeight: 700 }}>{item.purchase_channel}</span>
                  </td>
                </tr>
              )) : <tr><td style={{ ...s.td, color: '#bbb', textAlign: 'center', fontStyle: 'italic' }} colSpan={6}>No supplement data available.</td></tr>}
            </tbody>
          </table>
        )}

        {/* ── 서명란 ── */}
        <div style={{ marginTop: 32, border: '1px solid #ddd4c8' }}>
          <div style={{ background: '#f5f0e8', padding: '6px 14px', fontSize: 10, fontWeight: 800, color: '#2a1f14', borderBottom: '1px solid #ddd4c8', letterSpacing: '3px', textAlign: 'center', textTransform: 'uppercase' }}>
            VERIFICATION
          </div>
          <div style={{ display: 'flex' }}>
            {['Analysis System', 'Research Director', 'Final Approval'].map((label, i) => (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: i < 2 ? '1px solid #e5e5e5' : 'none' }}>
                <div style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, color: '#5c4030', background: '#faf7f3', textAlign: 'center', padding: '6px', borderBottom: '1px solid #e8e0d8' }}>{label}</div>
                <div style={{ height: 40 }} />
                <div style={{ fontSize: 10, color: '#c0b0a0', textAlign: 'right', padding: '4px 10px', borderTop: '1px solid #eee8e0' }}>(seal)</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 푸터 ── */}
        <div style={{ marginTop: 20, fontSize: 10, color: '#b0a090', textAlign: 'center', borderTop: '1px solid #ede8e0', paddingTop: 12, lineHeight: 1.7 }}>
          본 보고서는 소변 바이오마커 분석 결과를 기반으로 생성된 개인 맞춤형 영양 및 건강관리 참고자료입니다.
          본 보고서는 의료적 진단 또는 치료를 위한 자료가 아니며, 건강수명 관리와 웰에이징 라이프스타일 설계를 위한 참고 정보로 활용하시기 바랍니다.
        </div>
        <div style={{ height: 60 }} />
      </div>
    </div>
  )
}

function SectionTitle({ num, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0 10px', paddingBottom: 6, borderBottom: '1.5px solid #c9b89a' }}>
      <span style={{ background: '#8b5e3c', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 8px', letterSpacing: '1.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{num}</span>
      <span style={{ fontSize: 13, fontWeight: 800, color: '#2a1f14', letterSpacing: '0.2px' }}>{title}</span>
    </div>
  )
}

const s = {
  table: { width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd4c8', marginBottom: 20, fontSize: 12 },
  th: { background: '#f5f0e8', color: '#2a1f14', fontSize: 11, fontWeight: 800, padding: '10px 12px', border: '1px solid #ddd4c8', textAlign: 'left', letterSpacing: '0.5px', textTransform: 'uppercase' },
  td: { fontSize: 12, color: '#1a1a1a', padding: '10px 12px', border: '1px solid #e8e0d8', lineHeight: 1.6, verticalAlign: 'top' },
  badgeRow: { display: 'flex', flexWrap: 'wrap', gap: 5 },
  nutBadge: { background: '#f5f0e8', color: '#5c4030', padding: '3px 9px', borderRadius: 3, fontSize: 11, fontWeight: 500, border: '1px solid #e0d4c4' },
  mechBadge: { background: '#eaf1f8', color: '#2a3a50', padding: '3px 9px', borderRadius: 3, fontSize: 11, fontWeight: 500, border: '1px solid #d0e2f0' },
}