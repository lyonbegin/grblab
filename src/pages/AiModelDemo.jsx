/**
 * AiModelDemo.jsx  — 반응형 AI 모델 데모 위젯
 * ✅ 캐시: Vite 플러그인 /api/cache (서버 파일 기반, 전체 방문객 공유, 재시작 후도 유지)
 * ✅ URL·파일 미입력 시 선택된 샘플 이미지로 자동 실행
 * ✅ 모바일 반응형
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const BOX_COLORS = ['#00C8FF','#FF6B6B','#6BFF8E','#FFD93D','#C77DFF','#FF9F43','#00D2D3']

/* ── Vite 서버 캐시 API 헬퍼 ──────────────────────────────────
 * GET  /api/cache?key=xxx  → { hit: [...] | null }
 * POST /api/cache          → body: { key, predictions }
 * vite-plugin-inference-cache.js 가 이 경로를 처리합니다.
 * ─────────────────────────────────────────────────────────── */
async function cacheGet(filename) {
  try {
    const res = await fetch(`/api-cache/${filename}.json`, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

async function cacheSet(filename, predictions) {
  try {
    await fetch('/api/save-cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, data: predictions }),
    })
  } catch (e) {
    console.warn('[Cache] 서버 저장 실패:', e.message)
  }
}

// ✅ 파일명으로 쓸 수 있도록 특수문자 제거
function makeCacheKey(modelId, imageUrl) {
  return `${modelId}__${imageUrl}`.replace(/[^\w.-]/g, '_')
}

function drawBoxes(canvas, img, predictions, confidence) {
  const ctx   = canvas.getContext('2d')
  const rect  = img.getBoundingClientRect()
  const dispW = rect.width
  const dispH = rect.height
  if (!dispW || !dispH) return
  canvas.width        = dispW
  canvas.height       = dispH
  canvas.style.width  = dispW + 'px'
  canvas.style.height = dispH + 'px'
  ctx.clearRect(0, 0, dispW, dispH)
  const natW  = img.naturalWidth  || dispW
  const natH  = img.naturalHeight || dispH
  const scale = Math.min(dispW / natW, dispH / natH)
  const offX  = (dispW - natW * scale) / 2
  const offY  = (dispH - natH * scale) / 2
  const colorMap = {}
  predictions
    .filter(p => p.confidence >= confidence / 100)
    .forEach(pred => {
      if (!colorMap[pred.class])
        colorMap[pred.class] = BOX_COLORS[Object.keys(colorMap).length % BOX_COLORS.length]
      const color = colorMap[pred.class]
      const x = offX + (pred.x - pred.width  / 2) * scale
      const y = offY + (pred.y - pred.height / 2) * scale
      const w = pred.width  * scale
      const h = pred.height * scale
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h)
      const label = `${pred.class} ${Math.round(pred.confidence * 100)}%`
      ctx.font = 'bold 11px monospace'
      const tw = ctx.measureText(label).width
      ctx.fillStyle = color; ctx.fillRect(x, Math.max(0, y - 18), tw + 8, 18)
      ctx.fillStyle = '#000'; ctx.fillText(label, x + 4, Math.max(13, y - 5))
    })
}

function useIsMobile() {
  const [m, setM] = useState(typeof window !== 'undefined' && window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return m
}

export default function AiModelDemo({
  modelId      = 'detecting-diseases/5',
  apiKey       = 'P0UYFNweFjm7uZo2nVVG',
  modelName    = '작물 병해 감지 모델',
  modelStats   = { mAP: 91.5, precision: 89.1, recall: 88.7 },
  sampleImages = [
    'https://source.roboflow.com/6nOEoTQ7uLUslcyM5Gl4fc0d8Ov2/VKK0QdiTEEcLmHOlIdGs/original.jpg',
    'https://source.roboflow.com/6nOEoTQ7uLUslcyM5Gl4fc0d8Ov2/BHuN2ZMlqhmZfi6I9YkL/original.jpg',
    'https://source.roboflow.com/6nOEoTQ7uLUslcyM5Gl4fc0d8Ov2/Tk3nqiOMKjHCyC0gvIt4/original.jpg',
    'https://source.roboflow.com/6nOEoTQ7uLUslcyM5Gl4fc0d8Ov2/URPH8OQFEo3DkljAYF1A/original.jpg',
  ],
}) {
  const isMobile = useIsMobile()
  const [activeImg,   setActiveImg]   = useState(sampleImages[3])
  const [predictions, setPredictions] = useState([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)
  const [confidence,  setConfidence]  = useState(50)
  const [overlap,     setOverlap]     = useState(50)
  const [urlInput,    setUrlInput]    = useState('')
  const [cacheStatus, setCacheStatus] = useState(null)
  const imgRef    = useRef(null)
  const canvasRef = useRef(null)
  const fileRef   = useRef(null)

  const clearCanvas = () => {
    if (!canvasRef.current) return
    canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
  }

// ✅ 1. runInference — 캐시 히트도 3초 로딩 표시
const runInference = useCallback(async (imageUrl) => {
  const key = makeCacheKey(modelId, imageUrl)
  setLoading(true); setError(null); setPredictions([]); clearCanvas(); setCacheStatus(null)

  const cached = await cacheGet(key)
  if (cached) {
    await new Promise(r => setTimeout(r, 2000))  // ✅ 3초 대기
    setPredictions(cached)
    setLoading(false)
    return
  }

  // 캐시 미스 — 기존 API 호출
  try {
    const res  = await fetch(
      `https://serverless.roboflow.com/${modelId}?api_key=${apiKey}&image=${encodeURIComponent(imageUrl)}&confidence=${confidence}&overlap=${overlap}`,
      { method: 'POST' }
    )
    const data  = await res.json()
    const preds = data.predictions || []
    await cacheSet(key, preds)
    setPredictions(preds)
  } catch (e) {
    setError('API 호출 실패: ' + e.message)
  } finally {
    setLoading(false)
  }
}, [modelId, apiKey, confidence, overlap])
  const runInferenceBase64 = useCallback(async (file) => {
    setLoading(true); setError(null); setPredictions([]); clearCanvas(); setCacheStatus(null)
    try {
      const b64 = await new Promise((res, rej) => {
        const r = new FileReader()
        r.onload  = () => res(r.result.split(',')[1])
        r.onerror = rej
        r.readAsDataURL(file)
      })
      setActiveImg(URL.createObjectURL(file))
      const res  = await fetch(
        `https://serverless.roboflow.com/${modelId}?api_key=${apiKey}&confidence=${confidence}&overlap=${overlap}`,
        { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: b64 }
      )
      const data  = await res.json()
      setPredictions(data.predictions || [])
    } catch (e) {
      setError('분석 실패: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [modelId, apiKey, confidence, overlap])

  const redraw = useCallback(() => {
    if (!imgRef.current || !canvasRef.current || predictions.length === 0) return
    setTimeout(() => {
      if (imgRef.current && canvasRef.current)
        drawBoxes(canvasRef.current, imgRef.current, predictions, confidence)
    }, 0)
  }, [predictions, confidence])

  useEffect(() => { redraw() }, [redraw])

  const handleSample = (url) => {
    setActiveImg(url); setPredictions([]); clearCanvas(); runInference(url)
  }

  const handleAnalyze = (e) => {
    e.preventDefault()
    if (urlInput.trim()) { setActiveImg(urlInput.trim()); runInference(urlInput.trim()) }
    else { runInference(activeImg) }
  }

  const detectedCount = predictions.filter(p => p.confidence >= confidence / 100).length

  return (
    <section style={{ background:'#f8f8f8', borderTop:'1px solid #ebebeb', borderBottom:'1px solid #ebebeb', padding: isMobile ? '36px 20px' : '52px 40px', fontFamily:"'Noto Sans KR','Malgun Gothic',sans-serif" }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>

        <div style={{ marginBottom: isMobile ? 20 : 28 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#bbb', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>AI 모델 데모</div>
          <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight:900, color:'#1a1a1a', letterSpacing:'-1px', marginBottom:6 }}>{modelName}</h2>
          <p style={{ fontSize:14, color:'#999' }}>실시간 이미지 분석을 직접 체험해보세요.</p>
        </div>

        <div style={{ display:'flex', gap: isMobile ? 8 : 14, marginBottom: isMobile ? 20 : 28 }}>
          {[
            { key:'mAP@50',    val:modelStats.mAP,       color:'#7C3AED' },
            { key:'Precision', val:modelStats.precision,  color:'#2563EB' },
            { key:'Recall',    val:modelStats.recall,     color:'#D97706' },
          ].map(s => (
            <div key={s.key} style={{ background:'#fff', border:'1px solid #ebebeb', borderRadius:10, padding: isMobile ? '12px 10px' : '14px 20px', display:'flex', gap:10, alignItems:'center', flex:1, minWidth:0 }}>
              <div style={{ width:6, height: isMobile ? 50 : 68, background:'#f0f0f0', borderRadius:4, position:'relative', overflow:'hidden', flexShrink:0 }}>
                <motion.div style={{ width:'100%', borderRadius:4, position:'absolute', bottom:0, left:0, background:s.color }} initial={{ height:0 }} animate={{ height:`${s.val}%` }} transition={{ duration:0.9, ease:'easeOut' }}/>
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize: isMobile ? 10 : 11, color:'#999', marginBottom:3, whiteSpace:'nowrap' }}>{s.key}</div>
                <div style={{ fontSize: isMobile ? 15 : 20, fontWeight:900, letterSpacing:'-0.5px', color:s.color }}>{s.val}%</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '240px 1fr', gap: isMobile ? 14 : 20, alignItems:'start' }}>

          <div style={{ display:'flex', flexDirection:'column', gap:10, order: isMobile ? 2 : 1   }}>

            <div style={{ background:'#fff', border:'1px solid #ebebeb', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#444', marginBottom:10 }}>테스트 샘플 이미지</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {sampleImages.map((url, i) => (
                  <motion.img key={i} src={url} alt="" style={{ width: isMobile ? 52 : 48, height: isMobile ? 52 : 48, borderRadius:7, objectFit:'cover', cursor:'pointer', flexShrink:0, outline: activeImg === url ? '2.5px solid #1a1a1a' : '2px solid transparent' }} whileHover={{ scale:1.07 }} whileTap={{ scale:0.95 }} onClick={() => handleSample(url)}/>
                ))}
              </div>
            </div>

            <div style={{ background:'#fff', border:'1px solid #ebebeb', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#444', marginBottom:10 }}>이미지 파일 업로드</div>
              <div style={{ border:'1.5px dashed #ddd', borderRadius:8, padding:'14px 10px', display:'flex', flexDirection:'column', alignItems:'center', gap:6, cursor:'pointer', background:'#fafafa' }} onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f) runInferenceBase64(f) }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2v10M4 7l5-5 5 5" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="2" y="14" width="14" height="1.5" rx=".75" fill="#ddd"/></svg>
                <span style={{ fontSize:12, color:'#999' }}>파일을 끌어다 놓거나</span>
                <button style={{ background:'#fff', border:'1.5px solid #d8d8d8', borderRadius:6, padding:'6px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', color:'#444' }}>파일 선택</button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files[0]; if(f) runInferenceBase64(f) }}/>
            </div>

            <div style={{ background:'#fff', border:'1px solid #ebebeb', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#444', marginBottom:10 }}>이미지 URL 붙여넣기</div>
              <form onSubmit={handleAnalyze}>
                <input style={{ width:'100%', boxSizing:'border-box', border:'1px solid #ddd', borderRadius:6, padding:'8px 10px', fontSize:12, fontFamily:'inherit', outline:'none', color:'#333', marginBottom:10 }} placeholder="https://... (비워두면 선택된 샘플로 실행)" value={urlInput} onChange={e => setUrlInput(e.target.value)}/>
                <motion.button type="submit" style={{ width:'100%', background:'#1a1a1a', color:'#fff', border:'none', borderRadius:8, padding:'12px 0', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit', letterSpacing:'-0.3px', opacity: loading ? 0.65 : 1 }} whileTap={{ scale:0.97 }} disabled={loading}>
                  {loading ? '분석 중…' : '🔍 AI 분석 실행'}
                </motion.button>
              </form>
            </div>

            <div style={{ background:'#fff', border:'1px solid #ebebeb', borderRadius:10, padding:'14px 16px', display:'flex', flexDirection:'column', gap:14 }}>
              {[{ label:'Confidence', val:confidence, set:setConfidence }, { label:'Overlap', val:overlap, set:setOverlap }].map(sl => (
                <div key={sl.label}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#555', marginBottom:6 }}>{sl.label}: <b>{sl.val}%</b></div>
                  <input type="range" min="1" max="99" value={sl.val} onChange={e => sl.set(+e.target.value)} style={{ width:'100%', accentColor:'#1a1a1a', cursor:'pointer' }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#ccc', marginTop:2 }}><span>0%</span><span>100%</span></div>
                </div>
              ))}
            </div>

          </div>

          <div style={{ background:'#111', borderRadius:12, overflow:'hidden', width:'100%', position:'relative' , order: isMobile ? 1 : 2 }}>
            <div style={{ position:'relative', lineHeight:0, display:'block' }}>
              <img ref={imgRef} src={activeImg} alt="분석 이미지" style={{ width:'100%', height:'auto', display:'block', objectFit:'contain', maxHeight: isMobile ? '60vw' : 560, background:'#111' }} onLoad={redraw}/>
              <canvas ref={canvasRef} style={{ position:'absolute', top:0, left:0, pointerEvents:'none' }}/>

              <AnimatePresence>
                {detectedCount > 0 && (
                  <motion.div style={{ position:'absolute', bottom:12, right:12, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)', color:'#fff', fontSize:12, fontWeight:700, padding:'5px 13px', borderRadius:20, fontFamily:'inherit' }} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                    {detectedCount}개 객체 감지됨
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {cacheStatus === 'hit' && (
                  <motion.div style={{ position:'absolute', top:12, left:12, background:'rgba(34,197,94,0.9)', backdropFilter:'blur(6px)', color:'#fff', fontSize:11, fontWeight:700, padding:'4px 11px', borderRadius:20, fontFamily:'inherit' }} initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.25 }}>
                    ⚡ 캐시에서 즉시 로드
                  </motion.div>
                )}
              </AnimatePresence>

              {error && <div style={{ position:'absolute', bottom:12, left:12, background:'rgba(220,50,50,0.88)', color:'#fff', fontSize:11, padding:'5px 10px', borderRadius:8, fontFamily:'inherit' }}>{error}</div>}
            </div>

            {loading && (
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, borderRadius:12 }}>
                <motion.div style={{ width:18, height:18, borderRadius:'50%', background:'#fff' }} animate={{ scale:[1,1.4,1] }} transition={{ duration:0.8, repeat:Infinity }}/>
                <span style={{ fontSize:13, color:'#fff', fontFamily:'inherit' }}>분석 중…</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}