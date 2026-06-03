/**
 * InputPage.jsx — 작성+서식 탭 추가 버전
 * 기존 코드에서 변경된 부분:
 *   1. tabs 배열에 { key: 'forms', label: '작성 · 서식' } 추가
 *   2. FormsPage 컴포넌트 추가 (public/hrdb_templates에서 랜덤 4개 로드 → 2×2 미리보기)
 *   3. activeTab === 'forms' 분기 처리
 */
import { useState,useMemo , useRef, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnalyze } from '../hooks/useAnalyze'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import AgricultureDetailPage    from './AgricultureDetailPage'
import ConstructionDetailPage   from './ConstructionDetailPage'
import GovernmentDetailPage     from './GovernmentDetailPage'
import HealthcareDetailPage     from './HealthcareDetailPage'
import ManufacturingDetailPage  from './ManufacturingDetailPage'
import LogisticsDetailPage      from './LogisticsDetailPage'
import SecurityDetailPage       from './SecurityDetailPage'
import TransportDetailPage      from './TransportDetailPage'
import FireDetailPage           from './FireDetailPage'
import AiModelDemo              from './AiModelDemo'
import { FormDocumentPreview } from './FormInputPage'
import html2canvas from 'html2canvas'
import SiteDetailPage from './SiteDetailPage'
import SafetyMarketingSections from './SafetyMarketingSections'
import HeavyEquipmentCollisionDetailPage from './HeavyEquipmentCollisionDetailPage'

import ManufacturingCollisionDetailPage from './ManufacturingCollisionDetailPage'

import OpeningFallDetailPage from './OpeningFallDetailPage'

// import ContractDetailPage     from './ContractDetailPage'
// import BoardDetailPage        from './BoardDetailPage'
import BoardIndexPage from './BoardIndexPage'
import SiteListPage       from './SiteListPage'

import BoardListPage from './BoardListPage'
import BoardDetailPage from './BoardDetailPage'

import TbmListPage from './TbmListPage'
import TbmDetailPage from './TbmDetailPage'

import InspectionListPage from './InspectionListPage'
import InspectionDetailPage from './InspectionDetailPage'

import PpeListPage from './PpeListPage'
import PpeDetailPage from './PpeDetailPage'

import SafetyEduListPage   from './SafetyEduListPage'
import SafetyEduDetailPage from './SafetyEduDetailPage'

import ThermalDetectionDetailPage from './ThermalDetectionDetailPage'
import AnalogGaugeAIDetailPage from './AnalogGaugeAIDetailPage'
import SmartPowerSafetyDetailPage from './SmartPowerSafetyDetailPage'


import AntiageTab from './AntiageTab'

import SafetyDetailPage from './SafetyDetailPage'

import SafetyListPage from './SafetyListPage'

import TbmResultPage from './TbmResultPage'
import EmergencyListPage   from './EmergencyListPage'
import EmergencyDetailPage from './EmergencyDetailPage'
import PPESmartManagementDetailPage from './PPESmartManagementDetailPage'

import RiskFactorModal from './RiskFactorModal'
// import TbmDetailPage          from './TbmDetailPage'
// import RiskDetailPage         from './RiskDetailPage'
// import SafetyLogDetailPage    from './SafetyLogDetailPage'
// import OshmsDetailPage        from './OshmsDetailPage'
// import ApprovalDetailPage     from './ApprovalDetailPage'
// import DocsDetailPage         from './DocsDetailPage'

// const CONSTRUCTION_DETAIL_PAGE_MAP = {
//   contract: ContractDetailPage,
//   board: BoardDetailPage,
//   report: ReportDetailPage,
//   tbm: TbmDetailPage,
//   risk: RiskDetailPage,
//   safetylog: SafetyLogDetailPage,
//   oshms: OshmsDetailPage,
//   approval: ApprovalDetailPage,
//   docs: DocsDetailPage,
// }contract

const CONSTRUCTION_DETAIL_PAGE_MAP = {
  contract: SiteListPage,
   board: BoardIndexPage,  

report:SafetyListPage,
 tbm: TbmListPage, 
  edu: SafetyEduListPage   , 
 ppe: PpeListPage,
   emergency: EmergencyListPage   , 

  inspection: InspectionListPage   , 

}


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

// ─────────────────────────────────────
// 양식 미리보기 컴포넌트
// ─────────────────────────────────────

/** bid_00XXX_ 접두어 제거 */
function cleanTitle(json) {
  const raw = json?.title || json?.source?.filename?.replace(/\.[^.]+$/, '') || '양식'
  return raw.replace(/^bid_\d+_/, '').trim()
}
function cleanFname(fname) {
  return fname.replace(/^bid_\d+_/, '').replace(/\.json$/i, '').trim()
}

/** JSON raw → 필드 레이블 추출 */
function extractPreviewFields(templateJson) {
  if (!templateJson) return []
  const raw = templateJson.raw || {}
  const type = raw.source_type || templateJson.source?.file_type
  if (type === 'hwp' || type === 'hwpx') {
    return (raw.fields || []).filter(f => f.label?.trim()).slice(0, 7).map(f => f.label.trim())
  }
  if (['xls', 'xlsx', 'xlsm'].includes(type)) {
    const labels = []
    ;(raw.sheets || []).forEach(sheet => {
      ;(sheet.rows || []).forEach(row => {
        row.filter(v => v && v.trim() && v.length < 20).forEach(v => {
          if (!labels.includes(v)) labels.push(v)
        })
      })
    })
    return labels.slice(0, 7)
  }
  if (type === 'pdf') {
    const labels = []
    ;(raw.pages || []).forEach(page => {
      (page.text || '').split('\n').forEach(line => {
        const m = line.match(/^([^:：]{1,18})[：:]/)
        if (m && !labels.includes(m[1].trim())) labels.push(m[1].trim())
      })
    })
    return labels.slice(0, 7)
  }
  return []
}

/** 양식 1개 미니 카드 */

function MiniPreviewImage({ templateJson, width = 320, height = 220 }) {
  const [dataUrl, setDataUrl] = useState('')
  const [err, setErr] = useState('')

  const cacheKey = useMemo(() => {
    const id = templateJson?.template_id || templateJson?.source?.filename || 'unknown'
    return `kras_tpl_preview_${String(id)}_${width}x${height}`
  }, [templateJson, width, height])

  useEffect(() => {
    if (!templateJson) return

    const DEBUG = !!window.__KRAS_PREVIEW_DEBUG__
    const NOCACHE = !!window.__KRAS_PREVIEW_NOCACHE__

    const fname = templateJson?.source?.filename || templateJson?.title || templateJson?.template_id || 'unknown'
    const stamp = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
    const TAG = `[KRAS_PREVIEW ${stamp}]`

    const log = (...a) => { if (DEBUG) console.log(TAG, ...a) }
    const warn = (...a) => { if (DEBUG) console.warn(TAG, ...a) }
    const errorLog = (...a) => { if (DEBUG) console.error(TAG, ...a) }

    log('START', { fname, cacheKey, width, height, DEBUG, NOCACHE })

    // 1) 캐시
    if (!NOCACHE) {
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached && cached.startsWith('data:image/')) {
          log('CACHE HIT', { bytes: cached.length })
          setDataUrl(cached)
          return
        }
        log('CACHE MISS')
      } catch (e) {
        warn('CACHE READ FAIL', e)
      }
    } else {
      log('CACHE BYPASS (NOCACHE=true)')
    }

    let cancelled = false
    const sleep = (ms) => new Promise(r => setTimeout(r, ms))
    const raf = () => new Promise(r => requestAnimationFrame(r))

    const snapshotEl = (el, label) => {
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cs = window.getComputedStyle(el)
      log(`SNAPSHOT:${label}`, {
        rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
        scroll: { w: el.scrollWidth, h: el.scrollHeight },
        css: {
          position: cs.position,
          transform: cs.transform,
          opacity: cs.opacity,
          visibility: cs.visibility,
          display: cs.display,
          overflow: cs.overflow,
          zIndex: cs.zIndex,
          background: cs.backgroundColor,
        }
      })
    }

    // ✅ 렌더 안정화: 높이가 0이 아니고, 3프레임 연속으로 변하지 않으면 안정으로 간주
    const waitStableLayout = async (el, maxMs = 2000) => {
      const start = performance.now()
      let lastH = -1
      let stableCount = 0

      while (performance.now() - start < maxMs) {
        await raf()
        const rect = el.getBoundingClientRect()
        const h = Math.round(Math.max(el.scrollHeight || 0, rect.height || 0))

        if (h > 0 && h === lastH) stableCount += 1
        else stableCount = 0

        lastH = h
        if (stableCount >= 3) {
          log('LAYOUT STABLE', { h, stableCount })
          return h
        }
      }

      const rect = el.getBoundingClientRect()
      const h = Math.round(Math.max(el.scrollHeight || 0, rect.height || 0))
      warn('LAYOUT NOT STABLE (timeout)', { h })
      return h
    }

    const run = async () => {
      let mount = null
      let root = null

      try {
        // 0) 사전 점검
        if (typeof createRoot !== 'function') {
          throw new Error('createRoot is not a function (import { createRoot } from "react-dom/client" 확인)')
        }
        if (typeof flushSync !== 'function') {
          throw new Error('flushSync is not a function (import { flushSync } from "react-dom" 확인)')
        }
        if (typeof html2canvas !== 'function') {
          throw new Error('html2canvas is not a function (import html2canvas from "html2canvas" 확인)')
        }

        // 1) 오프스크린 마운트 생성
        mount = document.createElement('div')
        Object.assign(mount.style, {
          position: 'fixed',
          left: '0px',
          top: '0px',
          width: '820px',
          background: '#fff',
          zIndex: '999999',
          padding: '0',
          margin: '0',
          // -99999px 금지: 렌더가 끊기는 케이스가 있습니다.
          transform: 'translateX(-200vw)',
          pointerEvents: 'none',
        })
        document.body.appendChild(mount)

        log('MOUNT APPENDED')
        snapshotEl(mount, 'mount-after-append')

        // 2) React 렌더(동기 커밋)
        root = createRoot(mount)
        log('ROOT CREATED')

        // ✅ 여기서 FormDocumentPreview가 values를 참조하면 죽으므로, 빈 객체라도 전달
        flushSync(() => {
          root.render(
            <div style={{ width: 820, background: '#fff' }}>
              <FormDocumentPreview templateJson={templateJson} values={{}} isMobile={false} />
            </div>
          )
        })
        log('RENDER COMMITTED')
        snapshotEl(mount, 'mount-after-render')

        // 3) 폰트 준비
        if (document.fonts?.ready) {
          log('WAIT FONTS...')
          try { await document.fonts.ready } catch (e) { warn('FONTS READY FAIL', e) }
          log('FONTS READY OK')
        } else {
          warn('document.fonts.ready not supported')
        }

        // 4) 레이아웃 안정화 대기
        const stableH = await waitStableLayout(mount, 2000)
        snapshotEl(mount, 'mount-after-stable')

        // 5) 높이 검증
        const captureH = Math.max(1, stableH || 1)
        if (captureH <= 1) {
          // 이 경우는 거의 “렌더가 안 됨” 입니다.
          // FormDocumentPreview에서 예외가 났거나 null을 반환했을 가능성이 큽니다.
          throw new Error(`capture height too small (${captureH}). FormDocumentPreview 렌더 실패 가능성 높음`)
        }
        log('CAPTURE SIZE', { windowWidth: 820, windowHeight: captureH })

        // 6) 마지막 페인트 1~2프레임 확보
        await raf()
        await raf()

        // 7) 캡처
        log('HTML2CANVAS START')
        const canvas = await html2canvas(mount, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          windowWidth: 820,
          windowHeight: captureH,
          scrollX: 0,
          scrollY: 0,
        })
        log('HTML2CANVAS DONE', { cw: canvas.width, ch: canvas.height })

        if (!canvas.width || !canvas.height) {
          throw new Error(`html2canvas returned invalid canvas size ${canvas.width}x${canvas.height}`)
        }

        // 8) 카드 비율 크롭(상단 기준) + 다운스케일
        const srcW = canvas.width
        const srcH = canvas.height
        const targetRatio = width / height

        const cropW = srcW
        const cropH = Math.min(srcH, Math.max(1, Math.round(cropW / targetRatio)))

        log('CROP', { srcW, srcH, cropW, cropH, targetRatio })

        const out = document.createElement('canvas')
        out.width = width * 2
        out.height = height * 2

        const ctx = out.getContext('2d')
        ctx.imageSmoothingEnabled = true
        ctx.drawImage(canvas, 0, 0, cropW, cropH, 0, 0, out.width, out.height)

        const url = out.toDataURL('image/jpeg', 0.88)
        log('DATAURL OK', { bytes: url.length })

        if (cancelled) {
          warn('CANCELLED BEFORE SET')
          return
        }

        setDataUrl(url)

        if (!NOCACHE) {
          try {
            localStorage.setItem(cacheKey, url)
            log('CACHE WRITE OK')
          } catch (e) {
            warn('CACHE WRITE FAIL', e)
          }
        }

        log('DONE')
      } catch (e) {
        if (cancelled) return
        const msg = String(e?.message || e)

        errorLog('FAIL', msg, e)
        setErr(msg)
      } finally {
        // 9) 정리
        try {
          root?.unmount?.()
          log('ROOT UNMOUNT OK')
        } catch (e) {
          warn('ROOT UNMOUNT FAIL', e)
        }
        try {
          mount && document.body.removeChild(mount)
          log('MOUNT REMOVED OK')
        } catch (e) {
          warn('MOUNT REMOVE FAIL', e)
        }
      }
    }

    run()

    return () => {
      cancelled = true
      log('CLEANUP(cancelled=true)')
    }
  }, [templateJson, cacheKey, width, height])

  return (
    <div
      style={{
        width,
        height,
        border: '1px solid #f0f0f0',
        borderRadius: 10,
        overflow: 'hidden',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt="preview"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            background: '#fff',
          }}
        />
      ) : err ? (
        <div style={{ fontSize: 11, color: '#c00', padding: 10, textAlign: 'center', lineHeight: 1.4 }}>
          미리보기 생성 실패<br />
          <span style={{ fontSize: 10, color: '#555' }}>{err}</span>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: '#999' }}>미리보기 생성 중…</div>
      )}
    </div>
  )
}
function FormMiniCard({ json, onClick, isNew }) {
  if (!json) return null
  const title = cleanTitle(json)

  return (
    <motion.div
      layout
      initial={{ opacity:0, y:16 }}
      animate={{ opacity:1, y:0 }}
      exit={{ opacity:0, y:-12 }}
      transition={{ duration:0.35, ease:[0.22,1,0.36,1] }}
      whileHover={{ y:-3, boxShadow:'0 8px 24px rgba(0,0,0,0.13)' }}
      onClick={onClick}
      style={{
        background:'#fff',
        border:'1px solid #e8e8e8',
        borderRadius:10,
        overflow:'hidden',
        cursor:'pointer',
        boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
        display:'flex',
        flexDirection:'column',
        outline: isNew ? '2px solid #1a1a2e' : 'none'
      }}
    >
      <div style={{
        display:'flex',
        alignItems:'center',
        gap:8,
        padding:'10px 12px',
        borderBottom:'1px solid #f0f0f0',
        background:'#fafafa'
      }}>
        <span style={{
          fontSize:11,
          fontWeight:700,
          color:'#1a1a1a',
          flex:1,
          overflow:'hidden',
          textOverflow:'ellipsis',
          whiteSpace:'nowrap'
        }}>
          {title}
        </span>
        {isNew && (
          <span style={{
            fontSize:9, fontWeight:800, color:'#fff', background:'#1a1a2e',
            padding:'1px 5px', borderRadius:3, flexShrink:0
          }}>
            NEW
          </span>
        )}
      </div>

      {/* ✅ framer-motion이 여기까지 ref/measure 하더라도 "DOM div"이므로 안전 */}
      <div style={{ padding:10, display:'flex', justifyContent:'center' }}>
        {/* ✅ MiniPreviewImage는 ref 대상이 아님(단순 렌더) */}
        <MiniPreviewImage templateJson={json} width={320} height={220} />
      </div>

      <div style={{
        padding:'7px 12px',
        fontSize:10,
        color:'#bbb',
        textAlign:'right',
        borderTop:'1px solid #f0f0f0',
        background:'#fafafa'
      }}>
        클릭하여 작성하기 →
      </div>
    </motion.div>
  )
}

/** 작성·서식 메인 페이지 */

// ─────────────────────────────────────────────────────────
// FormsPage
// ─────────────────────────────────────────────────────────
const PAGE_SIZE = 10


function FormsPage({ isMobile, navigate }) {
  const [allFiles,     setAllFiles]     = useState([])
  const [allLoaded,    setAllLoaded]    = useState({})
  const [displayed,    setDisplayed]    = useState([])
  const [newestId,     setNewestId]     = useState(null)
  const [initLoading,  setInitLoading]  = useState(true)

  const [searchQuery,     setSearchQuery]     = useState('')
  const [suggestions,     setSuggestions]     = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearchMode,    setIsSearchMode]    = useState(false)
  const [searchResults,   setSearchResults]   = useState([])
  const [currentPage,     setCurrentPage]     = useState(0)
  const [pageItems,       setPageItems]       = useState([])
  const [pageLoading,     setPageLoading]     = useState(false)
  const [activeQuery,     setActiveQuery]     = useState('')

  const searchWrapRef = useRef(null)
  const inputRef      = useRef(null)

  // 초기 로드
  useEffect(() => {
    const init = async () => {
      try {
        const idxRes = await fetch('/hrdb_templates/index.json')
        if (!idxRes.ok) return
        const idx   = await idxRes.json()
        const files = idx.files || []
        setAllFiles(files)
        const picked = [...files].sort(() => Math.random() - 0.5).slice(0, 4)
        const cache  = {}
        const loaded = await Promise.all(picked.map(async fname => {
          try {
            const r = await fetch(`/hrdb_templates/${encodeURIComponent(fname)}`)
            const j = r.ok ? await r.json() : null
            if (j) cache[fname] = j
            return j ? { id: fname + Date.now(), fname, json: j } : null
          } catch { return null }
        }))
        setAllLoaded(cache)
        setDisplayed(loaded.filter(Boolean))
      } catch {}
      finally { setInitLoading(false) }
    }
    init()
  }, [])

  // 10초 회전
  useEffect(() => {
    if (isSearchMode || allFiles.length === 0) return
    const timer = setInterval(async () => {
      const notShown = allFiles.filter(f => !displayed.find(d => d.fname === f))
      if (!notShown.length) return
      const nextFname = notShown[Math.floor(Math.random() * notShown.length)]
      let nextJson = allLoaded[nextFname]
      if (!nextJson) {
        try {
          const r = await fetch(`/hrdb_templates/${encodeURIComponent(nextFname)}`)
          if (r.ok) { nextJson = await r.json(); setAllLoaded(prev => ({ ...prev, [nextFname]: nextJson })) }
        } catch { return }
      }
      if (!nextJson) return
      const newItem = { id: nextFname + Date.now(), fname: nextFname, json: nextJson }
      setNewestId(newItem.id)
      setDisplayed(prev => [newItem, ...prev.slice(0, 3)])
    }, 10000)
    return () => clearInterval(timer)
  }, [allFiles, displayed, allLoaded, isSearchMode])

  // 자동완성
  useEffect(() => {
    if (searchQuery.length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    const q = searchQuery.toLowerCase()
    const matches = allFiles.filter(f => cleanFname(f).toLowerCase().includes(q)).slice(0, 5)
    setSuggestions(matches)
    setShowSuggestions(matches.length > 0)
  }, [searchQuery, allFiles])

  // 바깥 클릭 닫기
  useEffect(() => {
    const handler = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target))
        setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadPage = useCallback(async (results, page) => {
    setPageLoading(true)
    const slice = results.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    const items = await Promise.all(slice.map(async fname => {
      if (allLoaded[fname]) return { id: fname + page, fname, json: allLoaded[fname] }
      try {
        const r = await fetch(`/hrdb_templates/${encodeURIComponent(fname)}`)
        const j = r.ok ? await r.json() : null
        if (j) setAllLoaded(prev => ({ ...prev, [fname]: j }))
        return j ? { id: fname + page, fname, json: j } : null
      } catch { return null }
    }))
    setPageItems(items.filter(Boolean))
    setPageLoading(false)
  }, [allLoaded])

  const executeSearch = useCallback(async (query) => {
    const q = query.toLowerCase().trim()
    if (!q) return
    const matches = allFiles.filter(f => cleanFname(f).toLowerCase().includes(q))
    setSearchResults(matches)
    setCurrentPage(0)
    setIsSearchMode(true)
    setShowSuggestions(false)
    setActiveQuery(query)
    await loadPage(matches, 0)
  }, [allFiles, loadPage])

  const handlePageChange = useCallback(async (newPage) => {
    setCurrentPage(newPage)
    await loadPage(searchResults, newPage)
    window.scrollTo({ top:0, behavior:'smooth' })
  }, [searchResults, loadPage])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setIsSearchMode(false)
    setSearchResults([])
    setPageItems([])
    setShowSuggestions(false)
    setActiveQuery('')
    inputRef.current?.focus()
  }, [])

  const handleSelect = useCallback((json) => {
    navigate('/form', { state: { templateJson: json } })
  }, [navigate])

  const totalPages = Math.ceil(searchResults.length / PAGE_SIZE)

  return (
    <motion.div
      key="forms"
      initial={{ opacity:0 }}
      animate={{ opacity:1 }}
      exit={{ opacity:0 }}
      style={{
        flex:1, margin:'0 auto', width:'100%', maxWidth:1200,
        display:'flex',
        flexDirection: isMobile ? 'column' : 'row',
        padding: isMobile ? '32px 20px 60px' : '60px 40px',
        gap: isMobile ? 28 : 60,
        alignItems:'flex-start',
      }}
    >
      {/* ── 왼쪽 */}
      <div style={{ flex: isMobile ? 'none' : '0 0 460px', maxWidth: isMobile ? '100%' : 460, width:'100%' }}>
        <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>

          {/* 검색창 */}
          <div ref={searchWrapRef} style={{ position:'relative', marginBottom: isMobile ? 20 : 28 }}>
            <div style={{ position:'relative' }}>
              <input
                ref={inputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchQuery.trim()) executeSearch(searchQuery.trim())
                  if (e.key === 'Escape') setShowSuggestions(false)
                }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="양식 검색… (예: 지게차, 작업계획서)"
                style={{
                  width:'100%', boxSizing:'border-box',
                  padding:'13px 48px 13px 16px',
                  border:'1.5px solid #e0e0e0', borderRadius:9,
                  fontSize: isMobile ? 14 : 15,
                  fontFamily:'inherit', color:'#1a1a1a',
                  outline:'none', background:'#fafafa',
                }}
              />
              {searchQuery ? (
                <button onClick={clearSearch}
                  style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
                            background:'none', border:'none', cursor:'pointer', color:'#aaa',
                            fontSize:22, lineHeight:1, padding:0 }}>×</button>
              ) : (
                <svg style={{ position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}
                     width="17" height="17" viewBox="0 0 16 16" fill="none">
                  <circle cx="6.5" cy="6.5" r="5" stroke="#bbb" strokeWidth="1.6"/>
                  <path d="M10.5 10.5l3 3" stroke="#bbb" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              )}
            </div>

            {/* 자동완성 드롭다운 */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
                  transition={{ duration:0.15 }}
                  style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:200,
                            background:'#fff', border:'1px solid #e0e0e0', borderRadius:9,
                            boxShadow:'0 8px 28px rgba(0,0,0,0.13)', overflow:'hidden' }}
                >
                  {suggestions.map((fname, i) => (
                    <div key={i}
                      onMouseDown={() => { const q = cleanFname(fname); setSearchQuery(q); executeSearch(q) }}
                      style={{ padding:'11px 16px', fontSize:13, color:'#222', cursor:'pointer',
                               borderBottom: i < suggestions.length-1 ? '1px solid #f5f5f5' : 'none',
                               display:'flex', alignItems:'center', gap:10 }}
                      onMouseEnter={e => e.currentTarget.style.background='#f8f8f8'}
                      onMouseLeave={e => e.currentTarget.style.background='#fff'}
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink:0 }}>
                        <circle cx="5.5" cy="5.5" r="4" stroke="#ccc" strokeWidth="1.4"/>
                        <path d="M8.5 8.5l2.5 2.5" stroke="#ccc" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                      <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {cleanFname(fname)}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 제목 */}
          <div style={{ fontWeight:600, color:'#bbb', letterSpacing:'0.06em', textTransform:'uppercase',
                        marginBottom: isMobile ? 12 : 16, fontSize: isMobile ? 11 : 12 }}>
            Safety Form Library
          </div>
          <h1 style={{ fontWeight:400, color:'#1a1a1a', lineHeight:1.05,
                       fontFamily:"'Noto Sans KR',sans-serif",
                       fontSize: isMobile ? 36 : 62,
                       letterSpacing: isMobile ? '-1.2px' : '-2.5px',
                       marginBottom: isMobile ? 12 : 18 }}>
            <span style={{ fontWeight:900 }}>GRB</span>lab이 만드는<br/>산업현장 안전관리
          </h1>
          <p style={{ color:'#999', lineHeight:1.5, letterSpacing:'-0.2px', fontWeight:500,
                      fontSize: isMobile ? 14 : 16 }}>
            안전관리 관련 1,300여 개의 서식
          </p>
        </motion.div>
      </div>

      {/* ── 오른쪽 */}
      <motion.div
        style={{ flex:1, minWidth:0, width:'100%' }}
        initial={{ opacity:0, x:24 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.6, delay:0.15 }}
      >
        {isSearchMode ? (
          <>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <span style={{ fontSize:13, color:'#555', fontWeight:600 }}>
                "{activeQuery}" 검색결과&nbsp;
                <span style={{ color:'#1a1a1a', fontWeight:900 }}>{searchResults.length}개</span>
              </span>
              <button onClick={clearSearch}
                style={{ fontSize:12, color:'#aaa', background:'none', border:'none',
                          cursor:'pointer', fontFamily:'inherit', textDecoration:'underline' }}>
                초기화
              </button>
            </div>

            {pageLoading ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 }}>
                {[...Array(4)].map((_,i) => (
                  <div key={i} style={{ background:'#f8f8f8', borderRadius:10, height:180, border:'1px solid #eee' }}/>
                ))}
              </div>
            ) : pageItems.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 20px', color:'#bbb', fontSize:14 }}>
                검색 결과가 없습니다
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 }}>
                {pageItems.map(item => (
                  <FormMiniCard key={item.id} json={item.json} isNew={false} onClick={() => handleSelect(item.json)}/>
                ))}
              </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:24 }}>
                <button onClick={() => handlePageChange(currentPage-1)} disabled={currentPage===0}
                  style={{ padding:'9px 18px', background: currentPage===0?'#f5f5f5':'#1a1a1a',
                            color: currentPage===0?'#ccc':'#fff', border:'none', borderRadius:7,
                            cursor: currentPage===0?'default':'pointer', fontSize:13, fontFamily:'inherit', fontWeight:600 }}>
                  ← 이전
                </button>
                <span style={{ fontSize:13, color:'#999', minWidth:64, textAlign:'center' }}>
                  {currentPage+1} / {totalPages}
                </span>
                <button onClick={() => handlePageChange(currentPage+1)} disabled={currentPage>=totalPages-1}
                  style={{ padding:'9px 18px', background: currentPage>=totalPages-1?'#f5f5f5':'#1a1a1a',
                            color: currentPage>=totalPages-1?'#ccc':'#fff', border:'none', borderRadius:7,
                            cursor: currentPage>=totalPages-1?'default':'pointer', fontSize:13, fontFamily:'inherit', fontWeight:600 }}>
                  다음 →
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {initLoading ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ background:'#f8f8f8', borderRadius:10, padding:14, border:'1px solid #eee', height:180 }}>
                    <div style={{ height:10, background:'#ebebeb', borderRadius:4, marginBottom:8 }}/>
                    <div style={{ height:10, background:'#ebebeb', borderRadius:4, width:'60%', marginBottom:16 }}/>
                    <div style={{ height:8, background:'#ebebeb', borderRadius:4, width:'80%', marginBottom:6 }}/>
                    <div style={{ height:8, background:'#ebebeb', borderRadius:4, width:'70%' }}/>
                  </div>
                ))}
              </div>
            ) : displayed.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 20px', color:'#bbb', fontSize:14 }}>
                양식을 불러올 수 없습니다
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 }}>
                <AnimatePresence mode="popLayout">
                  {displayed.map(item => (
                    <FormMiniCard key={item.id} json={item.json} isNew={item.id===newestId} onClick={() => handleSelect(item.json)}/>
                  ))}
                </AnimatePresence>
              </div>
            )}
            {displayed.length > 0 && (
              <div style={{ marginTop:14, textAlign:'right' }}>
                <button style={{ background:'none', border:'none', fontSize:12, color:'#aaa',
                                  cursor:'pointer', fontFamily:'inherit', textDecoration:'underline' }}
                  onClick={() => inputRef.current?.focus()}>
                  전체 양식 검색하기 →
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────
// 기존 코드 (변경 없음)
// ─────────────────────────────────────

const SUBTAB_MODEL_CONFIG = {
//   '중장비 충돌 예방': {
//   modelId: 'construction-site-safety/27',
//   apiKey: 'P0UYFNweFjm7uZo2nVVG',
//   modelName: '건설 현장 안전 감지 모델',
//   modelVersion: 'v27',
//   modelStats: { mAP: 84.1, precision: 92.7, recall: 77.4 },
//   sampleImages: [
//     '/riskimage/collision-02-zones.jpg',
//     '/riskimage/collision-03-beacon.png',
//     '/riskimage/collision-05-helmet.jpg',
//     '/riskimage/collision-06-full.jpg',
//   ],
// },
  '농업': { modelId: 'detecting-diseases/5', apiKey: 'P0UYFNweFjm7uZo2nVVG', modelName: '작물 병해 감지 모델', modelVersion: 'v5', modelStats: { mAP: 91.5, precision: 89.1, recall: 88.7 }, sampleImages: ['https://source.roboflow.com/6nOEoTQ7uLUslcyM5Gl4fc0d8Ov2/VKK0QdiTEEcLmHOlIdGs/original.jpg','https://source.roboflow.com/6nOEoTQ7uLUslcyM5Gl4fc0d8Ov2/BHuN2ZMlqhmZfi6I9YkL/original.jpg','https://source.roboflow.com/6nOEoTQ7uLUslcyM5Gl4fc0d8Ov2/Tk3nqiOMKjHCyC0gvIt4/original.jpg','https://source.roboflow.com/6nOEoTQ7uLUslcyM5Gl4fc0d8Ov2/URPH8OQFEo3DkljAYF1A/original.jpg'] },
  '건설': { modelId: 'construction-site-safety/27', apiKey: 'P0UYFNweFjm7uZo2nVVG', modelName: '건설 현장 안전 감지 모델', modelVersion: 'v27', modelStats: { mAP: 84.1, precision: 92.7, recall: 77.4 }, sampleImages: ['https://source.roboflow.com/zD7y6XOoQnh7WC160Ae7/4D5gAya8QSO2rMPJh8Zn/original.jpg','https://source.roboflow.com/zD7y6XOoQnh7WC160Ae7/MGXm4Ba0fuVYseAlOqVo/original.jpg','https://source.roboflow.com/zD7y6XOoQnh7WC160Ae7/01YQB5mO36NOmLpc6ho6/original.jpg','https://source.roboflow.com/zD7y6XOoQnh7WC160Ae7/13rfPNN5ZnJQXOBClitr/original.jpg'] },
  '공공·정부': { modelId: 'crack-vqykz/1', apiKey: 'P0UYFNweFjm7uZo2nVVG', modelName: '균열·파손 감지 모델', modelVersion: 'v1', modelStats: { mAP: 78.9, precision: 78.9, recall: 78.9 }, sampleImages: ['https://source.roboflow.com/VdmTudKqY6NKqU260tgUbrrhdGG2/kZ54TSAdjwvdxjR7Re61/original.jpg','https://source.roboflow.com/VdmTudKqY6NKqU260tgUbrrhdGG2/mGx7orc2td1xPuWhVYeR/original.jpg','https://source.roboflow.com/VdmTudKqY6NKqU260tgUbrrhdGG2/zVVLAWRh2sNbZltPTCRd/original.jpg','https://source.roboflow.com/VdmTudKqY6NKqU260tgUbrrhdGG2/mlOfLAewXjBr067OmuDD/original.jpg'] },
  '의료·헬스케어': { modelId: 'fall-7lbue/1', apiKey: 'P0UYFNweFjm7uZo2nVVG', modelName: '의료 응급상황 분석 모델', modelVersion: 'v1', modelStats: { mAP: 83.9, precision: 89.0, recall: 79.1 }, sampleImages: ['https://source.roboflow.com/gBs2kTP34RSFwmpism3R5cEBQ6z1/QVKHKAf5HGnbkjXyMXp7/original.jpg','https://source.roboflow.com/gBs2kTP34RSFwmpism3R5cEBQ6z1/Zl0HHiPFhQFc4wiOM7JL/original.jpg','https://source.roboflow.com/gBs2kTP34RSFwmpism3R5cEBQ6z1/U3ZDmmRbGZkLaMKFyaUF/original.jpg','https://source.roboflow.com/gBs2kTP34RSFwmpism3R5cEBQ6z1/a7izrY45NbpOeFKpp7a0/original.jpg'] },
  '제조': { modelId: 'cable-damage/1', apiKey: 'P0UYFNweFjm7uZo2nVVG', modelName: '케이블 손상 감지 모델', modelVersion: 'v1', modelStats: { mAP: 91.3, precision: 90.3, recall: 89.5 }, sampleImages: ['https://source.roboflow.com/pwYAXv9BTpqLyFfgQoPZ/UwoAg3TLuVo4djoZw0Fb/original.jpg','https://source.roboflow.com/pwYAXv9BTpqLyFfgQoPZ/teG8cPSjSy1XRGLTSBG2/original.jpg','https://source.roboflow.com/pwYAXv9BTpqLyFfgQoPZ/ESAKyUsoxXcgWXoqP9R6/original.jpg','https://source.roboflow.com/pwYAXv9BTpqLyFfgQoPZ/2fl0AbYWqESWYKCRlynm/original.jpg'] },
  '유통·물류': { modelId: 'logistics-sz9jr/2', apiKey: 'P0UYFNweFjm7uZo2nVVG', modelName: '물류 현장 감지 모델', modelVersion: 'v2', modelStats: { mAP: 76.6, precision: 79.5, recall: 70.7 }, sampleImages: ['https://source.roboflow.com/WStLbW6Owiz8aE9Z5N23/I0IylDxDxQJPJb4kJPn1/original.jpg','https://source.roboflow.com/WStLbW6Owiz8aE9Z5N23/V0ET9ItZwPAcARr2LWS8/original.jpg','https://source.roboflow.com/WStLbW6Owiz8aE9Z5N23/LzhYQ2hZPZVlWFRIfrrQ/original.jpg','https://source.roboflow.com/WStLbW6Owiz8aE9Z5N23/BXNaElB2BkDclJ2JApOH/original.jpg'] },
  '안전·보안': { modelId: 'people-detection-thermal/5', apiKey: 'P0UYFNweFjm7uZo2nVVG', modelName: '열화상 인원 감지 모델', modelVersion: 'v5', modelStats: { mAP: 91.1, precision: 90.1, recall: 82.7 }, sampleImages: ['https://source.roboflow.com/zD7y6XOoQnh7WC160Ae7/UfIG51IsGpZ8AIeL86jm/original.jpg','https://source.roboflow.com/zD7y6XOoQnh7WC160Ae7/3LnSjbkKaGhe6qjOLBIn/original.jpg','https://source.roboflow.com/zD7y6XOoQnh7WC160Ae7/zuNWXwmlxbtYjV0ruqha/original.jpg','https://source.roboflow.com/zD7y6XOoQnh7WC160Ae7/4IEgdJiZo8le52JdlfUJ/original.jpg'] },
  '교통·운송': { modelId: 'parking-space-ipm1b/4', apiKey: 'P0UYFNweFjm7uZo2nVVG', modelName: '주차 공간 감지 모델', modelVersion: 'v4', modelStats: { mAP: 98.4, precision: 97.3, recall: 95.7 }, sampleImages: ['https://source.roboflow.com/RxXho6hI5zW7g9LrlTQmdOWXAQK2/N4vwQvdDORdq2B1dIbal/original.jpg','https://source.roboflow.com/RxXho6hI5zW7g9LrlTQmdOWXAQK2/QmAnxN5QUmVQSXls12Jc/original.jpg','https://source.roboflow.com/RxXho6hI5zW7g9LrlTQmdOWXAQK2/NEJZgf7f4bFU4uIaaSsb/original.jpg','https://source.roboflow.com/RxXho6hI5zW7g9LrlTQmdOWXAQK2/SIda3gtqI7J9Za9JEDvZ/original.jpg'] },
  '소방·화재': { modelId: 'fireandsmokedataset1/1', apiKey: 'P0UYFNweFjm7uZo2nVVG', modelName: '화재·연기 감지 모델', modelVersion: 'v1', modelStats: { mAP: 83.7, precision: 80.6, recall: 75.1 }, sampleImages: ['https://source.roboflow.com/EIrrALTpIMcQju5RnC3P/KZpdFn1aJgo97uG7JEH1/original.jpg','https://source.roboflow.com/EIrrALTpIMcQju5RnC3P/2pEBvRNRdta4MdaevjUo/original.jpg','https://source.roboflow.com/EIrrALTpIMcQju5RnC3P/z2S52kbm7AvCLDIUrl23/original.jpg','https://source.roboflow.com/EIrrALTpIMcQju5RnC3P/M870mGFYnZ8ROEhlCSYk/original.jpg'] },
}

const DETAIL_PAGE_MAP = {
  '농업': AgricultureDetailPage, '건설': ConstructionDetailPage, '공공·정부': GovernmentDetailPage,
  '의료·헬스케어': HealthcareDetailPage, '제조': ManufacturingDetailPage, '유통·물류': LogisticsDetailPage,
  '안전·보안': SecurityDetailPage, '교통·운송': TransportDetailPage, '소방·화재': FireDetailPage,
   'TBM 안전 관리': PPESmartManagementDetailPage, '설비 게이지 모니터링': SmartPowerSafetyDetailPage,'열화상 감지': ThermalDetectionDetailPage,'중장비 충돌 예방': HeavyEquipmentCollisionDetailPage,'지게차 충돌 예방': ManufacturingCollisionDetailPage,'개구부 추락 예방': OpeningFallDetailPage,
}


function CameraOverlay({ onCapture, onClose }) {
  const webcamRef = useRef(null)
  const [capturing, setCapturing] = useState(false)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const shoot = useCallback(async () => {
    if (capturing) returnㄴ
    setCapturing(true)
    const imgSrc = webcamRef.current?.getScreenshot()
    if (!imgSrc) { setCapturing(false); return }
    const res = await fetch(imgSrc)
    const blob = await res.blob()
    const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
    onCapture(file, imgSrc)
  }, [capturing, onCapture])
  const CORNERS = [
    { top: 0, left: 0, borderWidth: '2px 0 0 2px', borderRadius: '4px 0 0 0' },
    { top: 0, right: 0, borderWidth: '2px 2px 0 0', borderRadius: '0 4px 0 0' },
    { bottom: 0, left: 0, borderWidth: '0 0 2px 2px', borderRadius: '0 0 0 4px' },
    { bottom: 0, right: 0, borderWidth: '0 2px 2px 0', borderRadius: '0 0 4px 0' },
  ]
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={cam.root}>
      <style>{`@keyframes camScan { 0%{top:4%} 50%{top:96%} 100%{top:4%} }`}</style>
      <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" style={cam.video} videoConstraints={{ facingMode: isMobile ? 'environment' : 'user' }} />
      <div style={cam.vignette} />
      <div style={cam.topBar}>
        <div style={cam.badge}>KRAS AI</div>
        <button style={cam.closeBtn} onClick={onClose}><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4L4 14" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg></button>
      </div>
      <div style={cam.framewrap}>
        <div style={cam.frame}>
          {CORNERS.map((c, i) => (<div key={i} style={{ position: 'absolute', width: 28, height: 28, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.9)', ...c }}/>))}
          <div style={cam.scanLine}/>
        </div>
        <p style={cam.guide}>{capturing ? '분석 중…' : '현장을 프레임 안에 맞춰 촬영하세요'}</p>
      </div>
      <div style={cam.shutterRow}>
        <motion.button style={cam.shutterOuter} whileTap={{ scale: 0.9 }} onClick={shoot} disabled={capturing}>
          <div style={{ ...cam.shutterCore, opacity: capturing ? 0.4 : 1 }}/>
        </motion.button>
      </div>
    </motion.div>
  )
}

const RISK_GRID = [
  { label: '건설 분진', file: '건설분진.png' },
  { label: '건설 포크', file: '건설포크.png' },
  { label: '끼임', file: '끼임.png' },
  { label: '배터리', file: '밧데리.png' },
  { label: '마감', file: '천장.png' },
  { label: '식품', file: '식품.png' },
  { label: '전기', file: '전기.png' },
  { label: '컨베이어', file: '컨베이어.png' },
  { label: '크레인', file: '크레인.png' },
  { label: '폐기물', file: '패기물.png' },
  { label: '프레스', file: '프레스.png' },
  { label: '화학', file: '화학.png' },
]


const CMANAGE_CARDS = [
  {
    key: 'all',
    title: '전체',
    desc: '',
    img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=75&fit=crop'
  },

// ── 스마트 건설안전장비 ──
  {
    key: '중장비 충돌 예방',
    title: '중장비 충돌',
    desc: 'AI 카메라 기반 충돌 예방',
    img: '/riskimage/건설구역.png'
  },


//  { key: '지게차 충돌 예방', title: '지게차 충돌', img: '/riskimage/지게차.png' },
  {
    key: '지게차 충돌 예방',
    title: '지게차 충돌',
    desc: '지게차 충돌',
    img: '/riskimage/지게차.png'
  },

  {
    key: '개구부 추락 예방',
    title: '개구부 추락',
    desc: '개구부 추락 감지',
    img: '/riskimage/개구부.png'
  },
  {
    key: 'TBM 안전 관리',
    title: '개인 보호구 태그',
    desc: '개인 보호구 위치 기반 관리',
    img: '/riskimage/tbm.png'
  },
  // {
  //   key: '호이스트 충돌 예방',
  //   title: '크레인 충돌',
  //   desc: '크레인 충돌 예방',
  //   img: '/riskimage/호이스트.png'
  // },


  {
    key: 'board',
    title: '공사구역',
    desc: '현장 공지/협업 게시판/댓글',
    img: 'https://images.unsplash.com/photo-1533378890784-b2a5b0a59d40?w=400&q=75&fit=crop'
  },



  {
    key: 'tbmai',
    title: 'AI TBM',
    desc: '작업 전 안전회의/교육일지 관리',
    img: 'https://images.unsplash.com/photo-1622611935038-1c4caa0db5d2?w=400&q=75&fit=crop'
  },
  {
    key: 'tbm',
    title: 'TBM',
    desc: '작업 전 안전회의/교육일지 관리',
    img: 'https://images.unsplash.com/photo-1622611935038-1c4caa0db5d2?w=400&q=75&fit=crop'
  },


  {
    key: 'risk',
    title: '위험성평가',
    desc: '공종별 위험요인 DB/평가표 작성',
    img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&q=75&fit=crop'
  },


    {
    key: 'report',
    title: '안전신고',
    desc: '위험요소 신고/조치내역 관리',
    img: 'https://images.unsplash.com/photo-1730473145269-ae0bb7665a34?w=400&q=75&fit=crop'
  },



  {
    key: 'emergency',
    title: '비상훈련',
    desc: '안전사고, 화재 및 폭팔 등 다양한 훈련 관리',
    img: 'https://images.unsplash.com/photo-1643635197111-96179e1797ce?w=400&q=75&fit=crop'
  },
  {
    key: 'inspection',
    title: '안전점검',
    desc: '정기, 특별, 순회 등 다양한 점검',
    img: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&q=75&fit=crop'
  },

   {
    key: 'edu',
    title: '안전교육일지',
    desc: '안전교육/비상훈련/점검/PPE 관리',
    img: 'https://images.unsplash.com/photo-1612024499574-7b0379631333?w=400&q=75&fit=crop'
  },
  {
    key: 'ppe',
    title: '개인보호구',
    desc: '개인보호구의 지급·수령 이력을  관리',
    img: 'https://images.unsplash.com/photo-1662309376159-b95fb193d96b?w=400&q=75&fit=crop'
  },
    {
    key: 'contract',
    title: '현장관리',
    desc: '공사 계약/기간/도급/책임자 정보 관리',
    img: 'https://images.unsplash.com/photo-1554224155-1696413565d3?w=400&q=75&fit=crop'
  },
  // {
  //   key: 'oshms',
  //   title: '',
  //   desc: '등록/정기점검/결과보고 관리',
  //   img: 'https://images.unsplash.com/photo-1581090700227-4c4f50f9c1c4?w=400&q=75&fit=crop'
  // },

  // {
  //   key: 'approval',
  //   title: '전자결재',
  //   desc: '결재 요청/승인/반려 관리',
  //   img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=75&fit=crop'
  // },

  {
    key: 'docs',
    title: '안전관리서식',
    desc: '파일관리/사진대지/서식자동생성/CAD',
    img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=75&fit=crop'
  },
];





const SMART_CONSTRUCTION_CARDS = [
  {
    key: '중장비 충돌 예방',
    title: '중장비 충돌',
    desc: 'AI 카메라 기반 충돌 예방',
    img: '/riskimage/건설구역.png'
  },

    {
    key: '지게차 충돌 예방',
    title: '지게차 충돌',
    desc: '지게차 충돌',
    img: '/riskimage/지게차.png'
  },

  {
    key: '개구부 추락 예방',
    title: '개구부 추락',
    desc: '개구부 추락 감지',
    img: '/riskimage/개구부.png'
  },
  {
    key: 'TBM 안전 관리',
    title: '개인 보호구 태그',
    desc: '개인 보호구 위치 기반 관리',
    img: '/riskimage/tbm.png'
  },
  //   {
  //   key: '호이스트 충돌 예방',
  //   title: '크레인 충돌',
  //   desc: '크레인 충돌 예방',
  //   img: '/riskimage/호이스트.png',
  // },
]

const CCTV_CARDS = [

  {
    key: '중장비 충돌 예방',
    title: '중장비 충돌 예방',
    desc: '굴삭기, 지게차, 덤프트럭, 크레인 주변 작업자 접근 시 경보를 발생시켜 충돌 위험을 줄입니다.',
    img: '/riskimage/건설구역.png',
  },
  {
    key: '개구부 추락 예방',
    title: '개구부 추락 예방',
    desc: '개구부 주변 접근을 감지해 경보를 발생시키고 추락 사고를 예방합니다.',
    img: '/riskimage/개구부.png',
  },
  {
    key: 'TBM 안전 관리',
    title: '개인 보호구 태그',
    desc: 'TBM 진행 시 참여자 태그 인식과 모바일 앱 연동으로 출석 및 안전관리 기록을 자동화합니다.',
    img: '/riskimage/tbm.png',
  },
  {
    key: '지게차 충돌 예방',
    title: '지게차 충돌 예방',
    desc: '지게차 주변 위험 구역을 감시하여 작업자 접근 시 즉시 경보를 제공합니다.',
    img: '/riskimage/지게차.png',
  },
  {
    key: '열화상 감지',
    title: '열화상 감지',
    desc: '분전반, 배터리, 컴프레서 등 주요 설비의 온도 상승을 감지하여 화재를 조기에 발견합니다.',
    img: '/riskimage/열화상.png',
  },
  {
    key: '설비 게이지 모니터링',
    title: '전기안전 통합모니터링',
    desc: '압력·온도·유량 게이지를 영상으로 읽고 이상 수치를 자동 감지합니다.',
    img: '/riskimage/게이지.png',
  },
  // {
  //   key: '호이스트 충돌 예방',
  //   title: '호이스트 충돌 예방',
  //   desc: '호이스트 작업 구역 접근을 감지하여 낙하물 및 충돌 위험을 예방합니다.',
  //   img: '/riskimage/호이스트.png',
  // },
   { key: '소방·화재', title: '소방·화재', desc: '', img: 'https://images.unsplash.com/photo-1741024189350-f1d22a92da02?w=400&q=75&fit=crop' },

    { key: '건설', title: '건설', desc: '', img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=75&fit=crop' },
   { key: '제조', title: '제조', desc: '', img: 'https://images.unsplash.com/photo-1701328778019-e95dedbf5346?w=400&q=75&fit=crop' },
  { key: '유통·물류', title: '유통·물류', desc: '', img: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&q=75&fit=crop' },
  { key: '안전·보안', title: '안전·보안', desc: '', img: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&q=75&fit=crop' },
  { key: '교통·운송', title: '교통·운송', desc: '.', img: 'https://images.unsplash.com/photo-1740647154342-92a91e89c3c9?w=400&q=75&fit=crop' },
 
 { key: '공공·정부', title: '공공·정부', desc: '', img: 'https://images.unsplash.com/photo-1762090242198-e8260bfaeb04?w=400&q=75&fit=crop' },
  { key: '의료·헬스케어', title: '의료·헬스케어', desc: '', img: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&q=75&fit=crop' },

{ key: '농업', title: '농업', desc: '', img: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=75&fit=crop' },

]

function ImageGrid({ items, isMobile, onSelect, columns }) {
  const cols = columns || (isMobile ? 3 : 4)
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: isMobile ? 4 : 8,
    }}>
      {items.map((item, i) => (
        <motion.div
          key={item.file ?? i}
          style={{
            ...s.gridItem,
            backgroundImage: `url(/riskimage/${item.file})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            cursor: 'pointer',
          }}
          onClick={() => onSelect?.(item.file)}
          role="button"
          tabIndex={0}
          animate={{ y: [0, -5, 0] }}
          whileHover={{ scale: 1.06, zIndex: 2 }}
          whileTap={{ scale: 0.97 }}
          transition={{
            duration: 3.5 + i * 0.15,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.2,
          }}
        >
          <div style={s.gridDim} />
          <div style={{ ...s.gridLabel, fontSize: isMobile && cols === 5 ? 9 : 10 }}>
            {item.label}
          </div>
        </motion.div>
      ))}
    </div>
  )
}



function CctvPage({ isMobile, activeSubTab, onSelectSubTab }) {
  const filtered = activeSubTab === 'all' ? CCTV_CARDS : CCTV_CARDS.filter(c => c.key === activeSubTab)
  const handleCardClick = (key) => { if (activeSubTab !== 'all') return; onSelectSubTab?.(key) }

  return (
    <motion.main key={`cctv-${activeSubTab}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ ...s.hero, flexDirection: isMobile ? 'column' : 'row', padding: isMobile ? '36px 20px 48px' : '60px 40px', gap: isMobile ? 0 : 60, alignItems: isMobile ? 'flex-start' : 'center' }}>

      {/* ── 왼쪽 텍스트 영역 ── */}
      <div style={{ flex: isMobile ? 'none' : '0 0 460px', maxWidth: isMobile ? '100%' : 460, width: '100%' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div style={{ ...s.eyebrow, fontSize: isMobile ? 11 : 12 }}>AI CCTV Monitoring Platform</div>
          <h1 style={{ ...s.heroTitle, fontSize: isMobile ? 36 : 62, letterSpacing: isMobile ? '-1.2px' : '-2.5px', marginBottom: isMobile ? 12 : 18, fontWeight: 400 }}>
            <span style={{ fontWeight: 900 }}>AI</span>가 바꾸는<br />산업안전 시스템
          </h1>
          <p style={{ ...s.heroSub, fontSize: isMobile ? 14 : 16, marginBottom: isMobile ? 20 : 32 }}>
            컴퓨터 비전은 현실의 비즈니스 문제를 해결합니다.<br />산업별 적용 방법을 확인하세요.
          </p>
          {activeSubTab !== 'all' && (
            <motion.div key={activeSubTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={s.subTabDetail}>
              <div style={s.subTabDetailTitle}>{activeSubTab}</div>
              <p style={s.subTabDetailDesc}>{CCTV_CARDS.find(c => c.key === activeSubTab)?.desc}</p>
            </motion.div>
          )}

          {/* ✅ 모바일: 텍스트 바로 아래 2열 카드 */}
          {isMobile && (
            <AnimatePresence mode="wait">
              <motion.div key={activeSubTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
                style={{ display: 'grid', gridTemplateColumns: activeSubTab !== 'all' ? '1fr' : 'repeat(2, 1fr)', gap: 10, marginTop: 24 }}>
                {filtered.map((item) => (
                  <motion.div key={item.key}
                    style={{ ...s.cctvCard, backgroundImage: `url(${item.img})`, backgroundSize: 'cover', backgroundPosition: 'center', aspectRatio: activeSubTab !== 'all' ? '16/7' : '4/3', cursor: activeSubTab === 'all' ? 'pointer' : 'default' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleCardClick(item.key)}>
                    <div style={s.cctvCardDim} />
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <div style={s.cctvCardTitle}>{item.title}</div>
                      {activeSubTab !== 'all' && <div style={s.cctvCardDesc}>{item.desc}</div>}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
      </div>

      {/* ✅ PC만: 오른쪽 3열 카드 */}
      {!isMobile && (
        <motion.div style={{ flex: 1, minWidth: 0 }} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeSubTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
              style={{ display: 'grid', gridTemplateColumns: activeSubTab !== 'all' ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
              {filtered.map((item) => (
                <motion.div key={item.key}
                  style={{ ...s.cctvCard, backgroundImage: `url(${item.img})`, backgroundSize: 'cover', backgroundPosition: 'center', aspectRatio: activeSubTab !== 'all' ? '16/7' : '4/3', cursor: activeSubTab === 'all' ? 'pointer' : 'default' }}
                  whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }} transition={{ duration: 0.18 }}
                  onClick={() => handleCardClick(item.key)} role={activeSubTab === 'all' ? 'button' : undefined} tabIndex={activeSubTab === 'all' ? 0 : undefined}
                  onKeyDown={(e) => { if (activeSubTab !== 'all') return; if (e.key === 'Enter' || e.key === ' ') handleCardClick(item.key) }}>
                  <div style={s.cctvCardDim} />
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={s.cctvCardTitle}>{item.title}</div>
                    {/* <div style={s.cctvCardDesc}>{item.desc}</div> */}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}

    </motion.main>
  )
}



function PhoneMockup({ isMobile }) {
  if (isMobile) {
    // 모바일: 기존 고정 크기 유지
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '24px 0 0',
      }}>
        <div style={{
          width: '80%',
          aspectRatio: '1 / 2',
          background: '#1a1a1a',
          borderRadius: 32,
          padding: '10px 7px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(255,255,255,0.07)',
          position: 'relative',
          flexShrink: 0,
        }}>
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 52, height: 7, background: '#000', borderRadius: 4, zIndex: 10 }}/>
          <div style={{ width: '100%', height: '100%', borderRadius: 26, overflow: 'hidden', background: '#000' }}>
            <video autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} src="/output.webm"/>
          </div>
          <div style={{ position: 'absolute', bottom: 7, left: '50%', transform: 'translateX(-50%)', width: 52, height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 2 }}/>
          <div style={{ position: 'absolute', right: -3, top: 80, width: 3, height: 40, background: '#2a2a2a', borderRadius: 2 }}/>
          <div style={{ position: 'absolute', left: -3, top: 70, width: 3, height: 26, background: '#2a2a2a', borderRadius: 2 }}/>
          <div style={{ position: 'absolute', left: -3, top: 104, width: 3, height: 26, background: '#2a2a2a', borderRadius: 2 }}/>
        </div>
      </div>
    )
  }

  // PC: 부모가 stretch로 높이를 주므로 height 100% + aspect-ratio로 비율 유지
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
    }}>
      <div style={{
        height: '100%',
        aspectRatio: '1 / 2',
        background: '#1a1a1a',
        borderRadius: 44,
        padding: '10px 7px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(255,255,255,0.07)',
        position: 'relative',
        flexShrink: 0,
      }}>
        {/* 노치 */}
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 52, height: 7, background: '#000', borderRadius: 4, zIndex: 10 }}/>
        {/* 화면 */}
        <div style={{ width: '100%', height: '100%', borderRadius: 36, overflow: 'hidden', background: '#000' }}>
          <video autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} src="/output.webm"/>
        </div>
        {/* 홈바 */}
        <div style={{ position: 'absolute', bottom: 7, left: '50%', transform: 'translateX(-50%)', width: 52, height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 2 }}/>
        {/* 사이드 버튼 */}
        <div style={{ position: 'absolute', right: -3, top: 80, width: 3, height: 40, background: '#2a2a2a', borderRadius: 2 }}/>
        <div style={{ position: 'absolute', left: -3, top: 70, width: 3, height: 26, background: '#2a2a2a', borderRadius: 2 }}/>
        <div style={{ position: 'absolute', left: -3, top: 104, width: 3, height: 26, background: '#2a2a2a', borderRadius: 2 }}/>
      </div>
    </div>
  )
}




function CmanagePage({ isMobile, activeSubTab, onSelectSubTab, onNavigateTab }) {
  const filtered =
    activeSubTab === 'all'
      ? CMANAGE_CARDS.filter(c => c.key !== 'all')
      : CMANAGE_CARDS.filter(c => c.key === activeSubTab)

  const SMART_KEYS = ['중장비 충돌 예방', '개구부 추락 예방', 'TBM 안전 관리']

const constructionCards = filtered.filter(c => !SMART_KEYS.includes(c.key))

  const handleCardClick = (key) => {
    if (activeSubTab !== 'all') return

    if (key === 'docs') {
      onNavigateTab?.('forms')
      return
    }

    if (key === 'risk' || key === 'tbmai') {
      onNavigateTab?.('risk')
      return
    }

    onSelectSubTab?.(key)
  }



  
const handleSmartCardClick = (key) => {
  if (activeSubTab !== 'all') return
  onNavigateTab?.('cctv', key)  // key도 같이 넘기기
}


  const activeCard = CMANAGE_CARDS.find(c => c.key === activeSubTab)

  if (activeSubTab !== 'all') return null

  return (
    <motion.main
      key={`cmanage-${activeSubTab}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        ...s.hero,
        flexDirection: isMobile ? 'column' : 'row',
        padding: isMobile ? '36px 20px 48px' : '60px 40px',
        gap: isMobile ? 0 : 60,
        alignItems: isMobile ? 'flex-start' : 'center'
      }}
    >
      {/* ── 왼쪽 텍스트 영역 ── */}
      <div
        style={{
          flex: isMobile ? 'none' : '0 0 460px',
          maxWidth: isMobile ? '100%' : 460,
          width: '100%'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ ...s.eyebrow, fontSize: isMobile ? 11 : 12 }}>
            Construction Safety Management
          </div>

          <h1
            style={{
              ...s.heroTitle,
              fontSize: isMobile ? 32 : 62,
              letterSpacing: isMobile ? '-1.2px' : '-2.5px',
              marginBottom: isMobile ? 12 : 18,
              fontWeight: 400
            }}
          >
            <span style={{ fontWeight: 900 }}>AI</span>가 바꾸는
            <br />
            건설현장
          </h1>

          <p
            style={{
              ...s.heroSub,
              fontSize: isMobile ? 14 : 16,
              marginBottom: isMobile ? 20 : 32
            }}
          >
            건설 현장에 필요한 관리 항목을 카테고리로 확인하십시오.
          </p>

          {activeSubTab !== 'all' && (
            <motion.div
              key={activeSubTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={s.subTabDetail}
            >
              <div style={s.subTabDetailTitle}>{activeCard?.title || activeSubTab}</div>
              {/* <p style={s.subTabDetailDesc}>{activeCard?.desc}</p> */}
            </motion.div>
          )}

          {/* 모바일 */}
          {isMobile && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSubTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                style={{ marginTop: 24 }}
              >
                <div style={{ marginBottom: 10, fontSize: 14, fontWeight: 800, color: '#222' }}>
                  스마트 건설안전장비
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 10,
                    marginBottom: 26
                  }}
                >
                  {SMART_CONSTRUCTION_CARDS.map((item) => (
                    <motion.div
                      key={item.key}
                      style={{
                        ...s.cctvCard,
                        backgroundImage: `url(${item.img})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        aspectRatio: '4/3',
                        cursor: 'pointer'
                      }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSmartCardClick(item.key)}
                    >
                      <div style={s.cctvCardDim} />
                      <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={s.cctvCardTitle}>{item.title}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div style={{ marginBottom: 10, fontSize: 14, fontWeight: 800, color: '#222' }}>
                  건설안전관리
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 10
                  }}
                >
                  {constructionCards.map((item) => (
                    <motion.div
                      key={item.key}
                      style={{
                        ...s.cctvCard,
                        backgroundImage: `url(${item.img})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        aspectRatio: '4/3',
                        cursor: 'pointer'
                      }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleCardClick(item.key)}
                    >
                      <div style={s.cctvCardDim} />
                      <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={s.cctvCardTitle}>{item.title}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
      </div>

      {/* PC */}
      {!isMobile && (
        <motion.div
          style={{ flex: 1, minWidth: 0 }}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSubTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{ marginBottom: 12, fontSize: 16, fontWeight: 800, color: '#222' }}>
                스마트 건설안전장비
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 14,
                  marginBottom: 30
                }}
              >
                {SMART_CONSTRUCTION_CARDS.map((item) => (
                  <motion.div
                    key={item.key}
                    style={{
                      ...s.cctvCard,
                      backgroundImage: `url(${item.img})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      aspectRatio: '4/3',
                      cursor: 'pointer'
                    }}
                    whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}
                    transition={{ duration: 0.18 }}
                    onClick={() => handleSmartCardClick(item.key)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleSmartCardClick(item.key)
                    }}
                  >
                    <div style={s.cctvCardDim} />
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <div style={s.cctvCardTitle}>{item.title}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div style={{ marginBottom: 12, fontSize: 16, fontWeight: 800, color: '#222' }}>
                건설안전관리
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 14
                }}
              >
                {constructionCards.map((item) => (
                  <motion.div
                    key={item.key}
                    style={{
                      ...s.cctvCard,
                      backgroundImage: `url(${item.img})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      aspectRatio: '4/3',
                      cursor: 'pointer'
                    }}
                    whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}
                    transition={{ duration: 0.18 }}
                    onClick={() => handleCardClick(item.key)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleCardClick(item.key)
                    }}
                  >
                    <div style={s.cctvCardDim} />
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <div style={s.cctvCardTitle}>{item.title}</div>
                      {/* <div style={s.cctvCardDesc}>{item.desc}</div> */}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </motion.main>
  )
}

const ReferralBox = ({ isMobile }) => (
  <div style={{
    width: '100%',
    background: '#f7f7f7',
    borderRadius: isMobile ? 10 : 12,
    padding: isMobile ? '12px 14px' : '16px 18px',
    marginBottom: isMobile ? 12 : 14,
  }}>
    <div style={{ marginBottom: isMobile ? 6 : 10 }}>
      <span style={{
        fontSize: isMobile ? 12 : 13,
        fontWeight: 800,
        color: '#111',
        cursor: 'pointer',
        textDecoration: 'underline',
        textUnderlineOffset: 3,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}>
        추천코드가 없다면 클릭<span>👉</span>
      </span>
    </div>
    <div style={{ display: 'flex', gap: isMobile ? 6 : 8 }}>
      <input
        type="text"
        placeholder="추천인 코드를 입력하세요"
        style={{
          flex: 1,
          padding: isMobile ? '8px 12px' : '10px 14px',
          border: '1.5px solid #e0e0e0',
          borderRadius: 8,
          fontSize: isMobile ? 12 : 13,
          fontFamily: 'inherit',
          outline: 'none',
          background: '#fff',
          color: '#333',
          minWidth: 0,
        }}
      />
      <button style={{
        padding: isMobile ? '8px 14px' : '10px 18px',
        background: '#FAE100',
        color: '#3C1E1E',
        border: 'none',
        borderRadius: 8,
        fontSize: isMobile ? 12 : 13,
        fontWeight: 800,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}>
        신청하기
      </button>
    </div>
    {/* <div style={{ fontSize: 11, color: '#aaa', marginTop: 8, lineHeight: 1.5 }}>
      추천코드 입력 시 50인 미만 사업장 무상 도입이 적용됩니다.
    </div> */}

    <div style={{ fontSize: 11, color: '#aaa', marginTop: 8, lineHeight: 1.5 }}>
  추천코드 입력 후 신청 시, 아래 화면은 실제 도입 후 운영 예시입니다. 50인 미만 사업장은 무상으로 동일한 체계를 사용하실 수 있습니다.
</div>
  </div>
)





export default function InputPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { analyze, analyze2,  analyze3,loading: apiLoading, error } = useAnalyze()
  const [cacheLoading, setCacheLoading] = useState(false)
  const fileInputRef = useRef(null)
  const cctvDetailAnchorRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('power')
  const [activeSubTab, setActiveSubTab] = useState('all')
  const [activeCmanageSubTab, setActiveCmanageSubTab] = useState('all')
  const [selectedSiteId, setSelectedSiteId] = useState(null)
  const [selectedEmergencyId, setSelectedEmergencyId] = useState(null)
  const [selectedInspectionId, setSelectedInspectionId] = useState(null)
  const [selectedEduId, setSelectedEduId] = useState(null)
  const [selectedPpeId, setSelectedPpeId] = useState(null)
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [selectedSafetyId, setSelectedSafetyId] = useState(null)
  const [selectedTbmId, setSelectedTbmId] = useState(null)
  const [riskModalOpen, setRiskModalOpen] = useState(false)
  const [pendingRiskFile, setPendingRiskFile] = useState(null) // { file, imageUrl, cachedResult }
  const pendingActionRef = useRef(null)
  const [selectedRiskFactors, setSelectedRiskFactors] = useState([])

  const previewRef = useRef(null)

  
// ② state 선언부에 추가 (다른 useState 옆에)
const [activePowerTab, setActivePowerTab] = useState(false)

// 모바일 햄버거 드로어
const [drawerOpen, setDrawerOpen] = useState(false)
const [drawerExpandedTab, setDrawerExpandedTab] = useState(null)


const HERO_SLIDES = [
  {
    question: '왜 일부 사업장은 무료 도입이 가능한가요?',
    line1: '협회, 노무법인, 안전진단기관, 산업재해 예방기관 등 전문기관 추천 사업장은 무료 도입 구조로 운영됩니다.',
    line2: '개인 추천이나 코드 배포 방식이 아닙니다. 산업안전 및 전기안전 관리가 필요한 사업장을 전문기관이 추천하면, 당사가 시스템 구축과 운영을 지원합니다.',
    img: '/riskimage/전기.png'
  },
  {
    question: '무엇을 관리하는 시스템인가요?',
    line1: '전기 안전, 전력 비용, 설비 상태를 하나의 체계로 통합 관리합니다.',
    line2: '카메라 AI 판독, CT 전류 측정, 전력 분석, 전기설비 점검, 산업안전진단을 연결하여 현장 운영 리스크와 비용을 동시에 관리합니다.',
    img: '/riskimage/컨베이어.png'
  },
  {
    question: '어떤 사업장이 대상인가요?',
    line1: '제조업, 식품공장, 냉동·냉장 설비 사업장, 산업단지 입주사, 노후 설비 사업장이 우선 대상입니다.',
    line2: '컴프레셔, 냉동기, 팬·펌프, 전기실, 분전반, 생산설비를 보유한 사업장에서 전기 안전과 전력 절감 효과를 동시에 기대할 수 있습니다.',
    img: '/riskimage/식품.png'
  },
  {
    question: '기존 설비를 모두 바꿔야 하나요?',
    line1: '기존 계기와 설비를 최대한 유지한 상태에서 적용합니다.',
    line2: '배선 공사와 설비 개조를 최소화하고, 카메라와 CT 기반으로 데이터를 수집해 기존 공장 환경에 맞춰 도입할 수 있습니다.',
    img: '/riskimage/프레스.png'
  },
  {
    question: '단순 모니터링 시스템인가요?',
    line1: '아닙니다. 전기 안전 감시, 전력 진단, 절감 솔루션, 법정 점검 대응까지 포함하는 운영 서비스입니다.',
    line2: '전기설비 상태 점검, 열화상 진단, 산업안전진단, 전력 절감 실행, 성과 측정·검증까지 연결되는 구조입니다.',
    img: '/riskimage/크레인.png'
  },
  {
    question: '전문기관은 어떤 방식으로 연계되나요?',
    line1: '협회, 노무법인, 산업안전진단기관, 산업재해 예방기관, 산업단지 관리조직이 추천기관이 됩니다.',
    line2: '전문기관은 관리가 필요한 사업장을 추천하고, 당사는 시스템 도입·현장 진단·운영·보고 체계를 제공하는 구조입니다.',
    img: '/riskimage/화학.png'
  },
  {
    question: '비용은 어떻게 정산되나요?',
    line1: '성과기반 에너지계약 구조에서는 절감이 검증된 경우에만 성과보수가 발생합니다.',
    line2: '기준선 대비 절감량을 측정·검증한 후 절감액의 계약 비율로 정산하며, 전문기관 추천 무료 도입 사업장은 별도 구조로 운영합니다.',
    img: '/riskimage/건설분진.png'
  },
  {
    question: '법정 점검도 포함되나요?',
    line1: '산업안전진단, 전기안전진단, 전력·화재진단, 공식 보고서 및 기관 제출까지 계약 범위에 포함됩니다.',
    line2: '법정 자격 전문인력이 직접 방문해 현장 점검, 보고서 작성, 관계기관 제출, 사후 관리까지 수행합니다.',
    img: '/riskimage/천장.png'
  },
  {
  question: '50인 미만 사업장은 추가 지원이 있나요?',
  line1: '협회, 노무법인, 안전진단기관 등 전문기관 추천 사업장은 무료 도입 구조로 운영됩니다.',
  line2: '또한 50인 미만 사업장의 경우 정부의 산업안전 및 에너지 관련 지원사업 대상에 해당할 수 있으며, 적용 가능 여부를 함께 검토합니다.',
  img: '/riskimage/전기.png'
}
]

  const SMART_EQUIPMENT_ITEMS = [
    { key: '중장비 충돌 예방', title: '중장비 충돌', img: '/riskimage/건설구역.png' },
    { key: '개구부 추락 예방', title: '개구부 추락', img: '/riskimage/개구부.png' },
    { key: 'TBM 안전 관리', title: '개인 보호구', img: '/riskimage/tbm.png' },
    { key: '지게차 충돌 예방', title: '지게차 충돌', img: '/riskimage/지게차.png' },
    { key: '열화상 감지', title: '열화상 감지', img: '/riskimage/열화상.png' },
    { key: '설비 게이지 모니터링', title: '전기안전 통합모니터링', img: '/riskimage/게이지.png' },
    // { key: '호이스트 충돌 예방', title: '호이스트 충돌', img: '/riskimage/호이스트.png' },
  ]

  const [copyIdx, setCopyIdx] = useState(0)

  const handleRiskFactorConfirm = useCallback(async (factors) => {
    console.log('[MODAL] onConfirm 호출됨 factors:', JSON.stringify(factors))

    setSelectedRiskFactors(factors)
    setRiskModalOpen(false)

    const action = pendingActionRef.current
    console.log('[ACTION] pendingActionRef.current:', action)
    pendingActionRef.current = null

    if (action === 'camera') {
      console.log('[ACTION] → 카메라 오픈')
      setCameraOpen(true)
      return
    }

    if (action === 'gallery') {
      console.log('[ACTION] → 갤러리 파일선택창 오픈')
      fileInputRef.current?.click()
      return
    }

    console.log('[PENDING] pendingRiskFile:', pendingRiskFile)
    if (!pendingRiskFile) {
      console.warn('[PENDING] pendingRiskFile 없음 → 종료')
      return
    }

    const { file, imageUrl } = pendingRiskFile
    console.log('[FILE] name:', file.name, 'type:', file.type, 'size:', file.size)
    console.log('[IMAGE] imageUrl:', imageUrl)

    setPendingRiskFile(null)
    setPreview(imageUrl)

    setTimeout(() => {
      if (!previewRef.current) return
      const rect = previewRef.current.getBoundingClientRect()
      const scrollTop = window.pageYOffset + rect.top - (window.innerHeight / 2) + (rect.height / 2)
      window.scrollTo({ top: scrollTop, behavior: 'smooth' })
    }, 300)

    const hasWorkSelected = !!factors?.workName && factors?.mode !== 'risk'
    console.log('[BRANCH] hasWorkSelected:', hasWorkSelected, '/ workName:', factors?.workName, '/ detailName:', factors?.detailName)

    const cacheKey = hasWorkSelected
      ? `tbm_${file.name.replace(/\s+/g, '_')}`
      : file.name

    console.log('[CACHE] cacheKey:', cacheKey)

    let cachedResult = null
    try {
      const cr = await fetch(`/api-cache/${cacheKey}.json`, { cache: 'no-store' })
      console.log('[CACHE] fetch status:', cr.status, 'ok:', cr.ok)
      if (cr.ok) {
        cachedResult = await cr.json()
        console.log('[CACHE] 캐시 히트! cachedResult keys:', Object.keys(cachedResult))
      } else {
        console.log('[CACHE] 캐시 없음 → API 호출')
      }
    } catch (e) {
      console.warn('[CACHE] fetch 에러:', e)
    }

    if (hasWorkSelected) {
      const workname = factors.workName
      const descript = factors.detailName ?? ''
      console.log('[TBM] workname:', workname, '/ descript:', descript)

      if (cachedResult) {
        console.log('[TBM] 캐시 사용 → /tbm/result')
        setCacheLoading(true)
        await new Promise(r => setTimeout(r, 2000))
        setCacheLoading(false)
        navigate('/tbm/result', { state: { result: cachedResult, imageUrl, workname, descript } })
        return
      }

      console.log('[TBM] analyze2 호출 시작')
      const result = await analyze2(file, workname, descript)
      console.log('[TBM] analyze2 결과:', result ? '성공 / keys:' + Object.keys(result) : '실패(null)')
      if (!result) return

      if (import.meta.env.DEV) {
        try {
          const saveRes = await fetch('/api/save-cache', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: cacheKey, data: result }),
          })
          console.log('[CACHE] tbm 저장 결과:', saveRes.ok, 'filename:', cacheKey)
        } catch (e) {
          console.warn('[CACHE] tbm 저장 실패:', e)
        }
      }

      console.log('[TBM] navigate → /tbm/result')
      navigate('/tbm/result', { state: { result, imageUrl, workname, descript } })

    } else {
      console.log('[RISK] analyze 호출 시작')

      if (cachedResult) {
        console.log('[RISK] 캐시 사용 → /result')
        setCacheLoading(true)
        await new Promise(r => setTimeout(r, 2000))
        setCacheLoading(false)
        navigate('/result', { state: { result: cachedResult, imageUrl, riskFactors: factors } })
        return
      }

      const result = await analyze(file)
      console.log('[RISK] analyze 결과:', result ? '성공 / keys:' + Object.keys(result) : '실패(null)')
      if (!result) return

      if (import.meta.env.DEV) {
        try {
          const saveRes = await fetch('/api/save-cache', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: cacheKey, data: result }),
          })
          console.log('[CACHE] risk 저장 결과:', saveRes.ok, 'filename:', cacheKey)
        } catch (e) {
          console.warn('[CACHE] risk 저장 실패:', e)
        }
      }

      console.log('[RISK] navigate → /result')
      navigate('/result', { state: { result, imageUrl, riskFactors: factors } })
    }
  }, [
    pendingRiskFile,
    analyze,
    analyze2,
    analyze3,
    navigate,
    setPreview,
    setPendingRiskFile,
    setRiskModalOpen,
    setSelectedRiskFactors,
    setCacheLoading,
    setCameraOpen,
  ])

  useEffect(() => {
    const timer = setInterval(() => {
      setCopyIdx(prev => (prev + 1) % HERO_SLIDES.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  const loading = apiLoading || cacheLoading

  const handleFile = useCallback(async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      message.error('이미지 파일만 업로드 가능합니다.')
      return
    }
    const imageUrl = URL.createObjectURL(file)

    let cachedResult = null
    try {
      const cacheKey = file.name.replace(/\s+/g, '_')
      const cr = await fetch(`/api-cache/${cacheKey}.json`, { cache: 'no-store' })
      if (cr.ok) cachedResult = await cr.json()
    } catch (_) {}

    setPendingRiskFile({ file, imageUrl, cachedResult })
    pendingActionRef.current = 'drop'
    setRiskModalOpen(true)
  }, [])

  const handleCapture = useCallback(async (file, previewSrc) => {
    setCameraOpen(false)
    setPreview(previewSrc)

    const factors = selectedRiskFactors
    const hasWorkSelected = !!factors?.workName && factors?.mode !== 'risk'

    if (hasWorkSelected) {
      const workname = factors.workName
      const descript = factors.detailName ?? ''

      const result = await analyze2(file, workname, descript)
      if (!result) return

      navigate('/tbm/result', { state: { result, imageUrl: previewSrc, workname, descript } })

    } else {
      const result = await analyze(file)
      if (!result) return

      navigate('/result', { state: { result, imageUrl: previewSrc, riskFactors: factors } })
    }
  }, [selectedRiskFactors, analyze, analyze2, navigate, setPreview])

const handleRiskImageSelect = useCallback(async (filename) => {
  try {
    const imageUrl = `/riskimage/${filename}`

    let cachedResult = null
    try {
      const cr = await fetch(`/api-cache/${filename}.json`, { cache: 'no-store' })
      if (cr.ok) cachedResult = await cr.json()
    } catch (_) {}

    const res = await fetch(imageUrl, { cache: 'no-store' })
    if (!res.ok) throw new Error(`image fetch failed: ${res.status}`)
    const blob = await res.blob()
    const file = new File([blob], filename, { type: blob.type || 'image/png' })

    setPendingRiskFile({ file, imageUrl, cachedResult })  // ← 먼저 세팅
    setRiskModalOpen(true)  // ← 세팅 완료 후 모달 열기
  } catch (err) {
    console.error('Risk image load/analyze failed:', err)
  }
}, [])

  const handleSmartEquipmentClick = useCallback((key) => {
    setActiveTab('cctv')
    setActiveSubTab(key)

    setTimeout(() => {
      cctvDetailAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }, [])

  const DetailPageComponent = DETAIL_PAGE_MAP[activeSubTab] || null
  const CmanageDetailComponent = CONSTRUCTION_DETAIL_PAGE_MAP[activeCmanageSubTab] || null

  const LoadingUI = (
    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {preview && (
        <div ref={previewRef} style={s.loadingPreview}>
          <img src={preview} alt="" style={s.loadingImg} />
          <motion.div
            style={s.loadingScan}
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      )}
      <div style={s.loadingSteps}>
        {['이미지 전처리 및 객체 인식', 'KRAS 위험등급 분류', '법적 기준 검토', '보고서 자동 생성'].map((step, i) => (
          <motion.div key={i} style={s.stepRow} initial={{ opacity: 0.2 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.5 }}>
            <motion.div style={s.stepDot} animate={{ background: ['#ccc', '#1a1a1a'] }} transition={{ delay: i * 0.5 }} />
            <span style={s.stepText}>{step}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )

  const ActionUI = (
    <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      {isMobile ? (
        <div style={s.mobileActions}>
          <motion.button
            style={s.mobileCamBtn}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              pendingActionRef.current = 'camera'
              setRiskModalOpen(true)
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="13" r="4.5" stroke="white" strokeWidth="1.8" />
              <path d="M3 9h2l2-3h10l2 3h2a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1v-9a1 1 0 011-1z" stroke="white" strokeWidth="1.8" />
            </svg>
            카메라로 촬영하기
          </motion.button>

          <button
            style={s.mobileFileBtn}
            onClick={() => {
              pendingActionRef.current = 'gallery'
              setRiskModalOpen(true)
            }}
          >
            또는 갤러리에서 파일 선택
          </button>

          {error && <div style={s.errorBox}>! {error} — 데모 데이터로 표시됩니다.</div>}
        </div>
      ) : (
        <div>
          <div
            style={{ ...s.dropZone, ...(dragOver ? s.dropActive : {}) }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              const file = e.dataTransfer?.files?.[0]
              if (!file) return
              handleFile(file)
            }}
            onClick={() => {
              pendingActionRef.current = 'gallery'
              setRiskModalOpen(true)
            }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 4v16M7 11l7-7 7 7" stroke="#aaa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="4" y="22" width="20" height="2" rx="1" fill="#ddd" />
            </svg>
            <span style={s.dropText}>이미지를 끌어다 놓거나 화면의 테스트 이미지를 클릭</span>
            <span style={s.dropSub}>JPG · PNG · WEBP</span>
          </div>

          <div style={s.pcBtnRow}>
            <button
              style={s.pcFileBtn}
              onClick={() => {
                pendingActionRef.current = 'gallery'
                setRiskModalOpen(true)
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M14 10v3a1 1 0 01-1 1H3a1 1 0 01-1-1v-3M8 2v8M5 5l3-3 3 3" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              파일 선택
            </button>

            <button
              style={s.pcCamBtn}
              onClick={() => {
                pendingActionRef.current = 'camera'
                setRiskModalOpen(true)
              }}
            >
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="11" r="4" stroke="white" strokeWidth="1.5" />
                <path d="M2 8h2l1.5-2.5h9L16 8h2a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V9a1 1 0 011-1z" stroke="white" strokeWidth="1.5" />
              </svg>
              카메라 촬영
            </button>
          </div>

          {error && <div style={s.errorBox}>! {error} — 데모 데이터로 표시됩니다.</div>}
        </div>
      )}
    </motion.div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #fff; -webkit-tap-highlight-color: transparent; }
        .sub-tab-scroll::-webkit-scrollbar { display: none; }
        .sub-tab-scroll { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

      <AnimatePresence>
        {cameraOpen && <CameraOverlay onCapture={handleCapture} onClose={() => setCameraOpen(false)} />}
      </AnimatePresence>

      {/* ── 모바일 햄버거 드로어 ── */}
      <AnimatePresence>
        {drawerOpen && isMobile && (
          <>
            {/* 딤 오버레이 */}
            <motion.div
              key="drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setDrawerOpen(false)}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
                zIndex: 200,
              }}
            />

            {/* 드로어 패널 */}
            <motion.div
              key="drawer-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: '78vw', maxWidth: 320,
                background: '#fff', zIndex: 201,
                display: 'flex', flexDirection: 'column',
                boxShadow: '-4px 0 32px rgba(0,0,0,0.18)',
                overflowY: 'auto',
              }}
            >
              {/* 드로어 헤더 */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 20px', borderBottom: '1px solid #f0f0f0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={s.logoMark}>G</div>
                  {/* <span style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>안전보건전문가그룹</span> */}
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 4l12 12M16 4L4 16" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* 드로어 메뉴 목록 */}
              <div style={{ flex: 1, padding: '12px 0' }}>
                {[
                  {
                    key: 'power',
                    label: 'PowerOps',
                    subs: [],
                  },
                  {
                    key: 'cmanage',
                    label: '건설안전',
                    subs: CMANAGE_CARDS.filter(c => c.key !== 'all').map(c => ({ key: c.key, label: c.title })),
                  },
                  {
                    key: 'risk',
                    label: 'AI안전',
                    subs: [],
                  },
                  {
                    key: 'cctv',
                    label: '스마트안전장비',
                    subs: CCTV_CARDS.map(c => ({ key: c.key, label: c.title })),
                  },
                  {
    key: 'antitage',
    label: '앙티아쥬',
    subs: [],
  },
                ].map(tab => {
                  const isActive = activeTab === tab.key
                  const isExpanded = drawerExpandedTab === tab.key
                  const hasSubs = tab.subs.length > 0

                  return (
                    <div key={tab.key}>
                      {/* 메인 탭 항목 */}
                      <button
                        onClick={() => {
                          if (hasSubs) {
                            setDrawerExpandedTab(isExpanded ? null : tab.key)
                          } else {
                            setActiveTab(tab.key)
                            setDrawerOpen(false)
                          }
                        }}
                        style={{
                          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '14px 20px',
                          fontFamily: 'inherit',
                          borderLeft: isActive ? '3px solid #1a1a1a' : '3px solid transparent',
                          background: isActive ? '#f8f8f8' : 'none',
                        }}
                      >
                        <span style={{
                          fontSize: 15, fontWeight: isActive ? 800 : 600,
                          color: isActive ? '#1a1a1a' : '#555',
                        }}>
                          {tab.label}
                        </span>
                        {hasSubs && (
                          <svg
                            width="16" height="16" viewBox="0 0 16 16" fill="none"
                            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                          >
                            <path d="M4 6l4 4 4-4" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>

                      {/* 서브 메뉴 */}
                      <AnimatePresence>
                        {hasSubs && isExpanded && (
                          <motion.div
                            key={`sub-${tab.key}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            style={{ overflow: 'hidden', background: '#fafafa', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}
                          >
                            {tab.subs.map(sub => {
                              const isSubActive =
                                (tab.key === 'cctv' && activeSubTab === sub.key) ||
                                (tab.key === 'cmanage' && activeCmanageSubTab === sub.key)

                              return (
                                <button
                                  key={sub.key}
                                  onClick={() => {
                                    setActiveTab(tab.key)
                                    if (tab.key === 'cctv') {
                                      // cmanage_cards 에서 cctv/risk 탭으로 리다이렉트 되는 키들 처리
                                      if (sub.key === 'docs') { setActiveTab('forms') }
                                      else if (sub.key === 'risk' || sub.key === 'tbmai') { setActiveTab('risk') }
                                      else { setActiveSubTab(sub.key) }
                                    } else if (tab.key === 'cmanage') {
                                      if (sub.key === 'docs') { setActiveTab('forms') }
                                      else if (sub.key === 'risk' || sub.key === 'tbmai') { setActiveTab('risk') }
                                      else {
                                        const SMART_KEYS = ['중장비 충돌 예방', '개구부 추락 예방', 'TBM 안전 관리', '지게차 충돌 예방']
                                        if (SMART_KEYS.includes(sub.key)) {
                                          setActiveTab('cctv')
                                          setActiveSubTab(sub.key)
                                        } else {
                                          setActiveCmanageSubTab(sub.key)
                                          setSelectedSiteId(null)
                                          setSelectedPostId(null)
                                          setSelectedSafetyId(null)
                                          setSelectedTbmId(null)
                                        }
                                      }
                                    }
                                    setDrawerOpen(false)
                                  }}
                                  style={{
                                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '11px 20px 11px 32px',
                                    fontFamily: 'inherit',
                                    borderLeft: isSubActive ? '3px solid #555' : '3px solid transparent',
                                    background: isSubActive ? '#f0f0f0' : 'none',
                                    textAlign: 'left',
                                  }}
                                >
                                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: isSubActive ? '#1a1a1a' : '#ccc', flexShrink: 0 }} />
                                  <span style={{
                                    fontSize: 13, fontWeight: isSubActive ? 700 : 400,
                                    color: isSubActive ? '#1a1a1a' : '#666',
                                  }}>
                                    {sub.label}
                                  </span>
                                </button>
                              )
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>

              {/* 드로어 하단 */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: 11, color: '#ccc' }}>GRBlab · 산업안전 AI 플랫폼</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div style={s.page}>

        {/* ── 네비 ── */}
        <nav style={s.nav}>
          <div style={{ ...s.navInner, padding: isMobile ? '0 16px' : '0 40px' }}>
            <div style={{ ...s.logo, transform: isMobile ? 'scale(0.85)' : 'none', transformOrigin: 'left center' }}>
              <div style={s.logoMark}>G</div>
              <span style={s.logoText}>GRB 안전보건전문가그룹</span>
            </div>

            {/* PC: 탭 버튼 / 모바일: 현재 탭 이름 + 햄버거 */}
            {isMobile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>
                  {[
                    { key: 'power', label: 'PowerOps' },
                    { key: 'cmanage', label: '건설안전' },
                    { key: 'risk', label: 'AI안전' },
                    { key: 'cctv', label: '스마트안전장비' },
                    { key: 'antitage', label: '앙티아쥬' },
                  ].find(t => t.key === activeTab)?.label}
                </span>
                <button
                  onClick={() => { setDrawerOpen(true); setDrawerExpandedTab(activeTab) }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '6px', display: 'flex', flexDirection: 'column',
                    gap: 5, alignItems: 'center', justifyContent: 'center',
                  }}
                  aria-label="메뉴 열기"
                >
                  <span style={{ display: 'block', width: 22, height: 2, background: '#1a1a1a', borderRadius: 2 }} />
                  <span style={{ display: 'block', width: 22, height: 2, background: '#1a1a1a', borderRadius: 2 }} />
                  <span style={{ display: 'block', width: 22, height: 2, background: '#1a1a1a', borderRadius: 2 }} />
                </button>
              </div>
            ) : (
              <div style={s.tabs}>
                {[
                  { key: 'power', label: 'PowerOps' },
                  { key: 'cmanage', label: '건설안전' },
                  { key: 'risk', label: 'AI안전' },
                  { key: 'cctv', label: '스마트안전장비' },
                  { key: 'antitage', label: '앙티아쥬' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    style={{
                      ...s.tabBtn,
                      color: activeTab === tab.key ? '#1a1a1a' : '#bbb',
                      fontWeight: activeTab === tab.key ? 700 : 500,
                      borderBottom: activeTab === tab.key ? '2px solid #1a1a1a' : '2px solid transparent',
                      fontSize: 18,
                      padding: '0 12px',
                    }}
                    onClick={() => {
                      setActiveTab(tab.key)
                      if (tab.key === 'cctv') setActiveSubTab('all')
                      if (tab.key === 'cmanage') {
                        setActiveCmanageSubTab('all')
                        setSelectedSiteId(null)
                        setSelectedPostId(null)
                        setSelectedSafetyId(null)
                        setSelectedTbmId(null)
                      }
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeTab === 'risk' && (
            <div style={{ ...s.navBelow, padding: isMobile ? '10px 20px 12px' : '20px 40px 24px' }}>
              <div style={s.navRight}>
                {!isMobile ? (
                  <>
                    <span style={s.navBadge}>산업안전보건법 제36조</span>
                    <span style={s.navBadge}>KRAS Open Interoperability Architecture</span>
                  </>
                ) : (
                  <motion.div
                    style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', flex: 1, paddingTop: 6 }}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                  >
                    <div style={{ width: '100%', marginBottom: 10, display: 'flex', flexDirection: 'row', gap: 14, alignItems: 'stretch' }}>
                      <div style={{ flex: 1, background: '#f7f7f7', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#111', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            추천코드가 없다면 클릭<span>👉</span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input
                            type="text"
                            placeholder="추천인 코드 입력"
                            style={{ flex: 1, padding: '8px 12px', border: '1.2px solid #e0e0e0', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#333', minWidth: 0 }}
                          />
                          <button style={{ padding: '8px 14px', background: '#FAE100', color: '#3C1E1E', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            신청
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* ── 서브탭 바 ── */}
        <AnimatePresence>
          {activeTab === 'cctv' && (
            <div style={s.subTabWrap}>
              <div
                className="sub-tab-scroll"
                style={{
                  ...s.subTabInner,
                  padding: isMobile ? '0 20px' : '0 40px',
                  overflowX: isMobile ? 'auto' : 'visible',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                <button
                  style={{
                    ...s.subTabBtn,
                    color: activeSubTab === 'all' ? '#1a1a1a' : '#999',
                    fontWeight: activeSubTab === 'all' ? 700 : 400,
                    borderBottom: activeSubTab === 'all' ? '2px solid #1a1a1a' : '2px solid transparent'
                  }}
                  onClick={() => setActiveSubTab('all')}
                >
                  전체
                </button>

                {CCTV_CARDS.map(card => (
                  <button
                    key={card.key}
                    style={{
                      ...s.subTabBtn,
                      color: activeSubTab === card.key ? '#1a1a1a' : '#999',
                      fontWeight: activeSubTab === card.key ? 700 : 400,
                      borderBottom: activeSubTab === card.key ? '2px solid #1a1a1a' : '2px solid transparent'
                    }}
                    onClick={() => setActiveSubTab(card.key)}
                  >
                    {card.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'cmanage' && (
            <div style={s.subTabWrap}>
              <div
                className="sub-tab-scroll"
                style={{
                  ...s.subTabInner,
                  padding: isMobile ? '0 20px' : '0 40px',
                  overflowX: isMobile ? 'auto' : 'visible',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                <button
                  style={{
                    ...s.subTabBtn,
                    color: activeCmanageSubTab === 'all' ? '#1a1a1a' : '#999',
                    fontWeight: activeCmanageSubTab === 'all' ? 700 : 400,
                    borderBottom: activeCmanageSubTab === 'all' ? '2px solid #1a1a1a' : '2px solid transparent'
                  }}
                  onClick={() => {
                    setActiveCmanageSubTab('all')
                    setSelectedSiteId(null)
                    setSelectedPostId(null)
                    setSelectedSafetyId(null)
                    setSelectedTbmId(null)
                  }}
                >
                  전체
                </button>

              {CMANAGE_CARDS.filter(c => c.key !== 'all').map(card => (
  <button
    key={card.key}
    style={{
      ...s.subTabBtn,
      color: activeCmanageSubTab === card.key ? '#1a1a1a' : '#999',
      fontWeight: activeCmanageSubTab === card.key ? 700 : 400,
      borderBottom: activeCmanageSubTab === card.key ? '2px solid #1a1a1a' : '2px solid transparent'
    }}
    onClick={() => {
      if (card.key === 'docs') { setActiveTab('forms'); return }
      if (card.key === 'risk' || card.key === 'tbmai') { setActiveTab('risk'); return }

      // 스마트 건설안전장비 → cctv 탭으로 이동



      const SMART_KEYS = ['중장비 충돌 예방', '개구부 추락 예방', 'TBM 안전 관리','지게차 충돌 예방']
      if (SMART_KEYS.includes(card.key)) {
        setActiveTab('cctv')
        setActiveSubTab(card.key)
        setTimeout(() => {
          cctvDetailAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 150)
        return
      }

      setActiveCmanageSubTab(card.key)
      setSelectedSiteId(null)
      setSelectedPostId(null)
      setSelectedSafetyId(null)
      setSelectedTbmId(null)
    }}
  >
    {card.title}
  </button>
))}
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* ── 탭 콘텐츠 ── */} 
        <AnimatePresence mode="wait">
          {
          
          
          
          
          
activeTab === 'power' ? (

  <motion.div
    key="power"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    // transition={{ duration: 0.1, ease: [0.22, 1, 0.36, 1] }}
  >

    <SmartPowerSafetyDetailPage />
   
  </motion.div>

) : activeTab === 'forms' ? (

            <FormsPage key="forms" isMobile={isMobile} navigate={navigate} />

          ) : activeTab === 'cmanage' ? (

            <motion.div key="cmanage-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {activeCmanageSubTab !== 'all' && (
                <div style={{ padding: isMobile ? '12px 20px 0' : '12px 40px 0' }}>
                  <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <ReferralBox isMobile={isMobile} />
                  </div>
                </div>
              )}
<CmanagePage
  isMobile={isMobile}
  activeSubTab={activeCmanageSubTab}
  onSelectSubTab={(key) => {
    setActiveCmanageSubTab(key)
    setSelectedSiteId(null)
    setSelectedPostId(null)
    setSelectedSafetyId(null)
    setSelectedTbmId(null)
  }}
  onNavigateTab={(tab, subKey) => {
    setActiveTab(tab)
    if (subKey) setActiveSubTab(subKey)
    if (tab === 'cctv') {
      setTimeout(() => {
        cctvDetailAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    }
  }}
/>
              <AnimatePresence mode="wait">
                {activeCmanageSubTab === 'contract' && (
                  selectedSiteId ? (
                    <motion.div key={`site-detail-${selectedSiteId}`} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                      <SiteDetailPage siteId={selectedSiteId} onBack={() => setSelectedSiteId(null)} />
                    </motion.div>
                  ) : (
                    <motion.div key="site-list" initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                      <SiteListPage onSelectSite={(id) => setSelectedSiteId(id)} />
                    </motion.div>
                  )
                )}

                {activeCmanageSubTab === 'board' && (
                  selectedPostId ? (
                    <motion.div key={`post-detail-${selectedPostId}`} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                      <BoardDetailPage postId={selectedPostId} onBack={() => setSelectedPostId(null)} />
                    </motion.div>
                  ) : (
                    <motion.div key="board-list" initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                      <BoardListPage onSelectPost={(id) => setSelectedPostId(id)} />
                    </motion.div>
                  )
                )}

                {activeCmanageSubTab === 'report' && (
                  selectedSafetyId ? (
                    <motion.div key={`safety-detail-${selectedSafetyId}`} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                      <SafetyDetailPage postId={selectedSafetyId} onBack={() => setSelectedSafetyId(null)} />
                    </motion.div>
                  ) : (
                    <motion.div key="safety-list" initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                      <SafetyListPage onSelectPost={(id) => setSelectedSafetyId(id)} />
                    </motion.div>
                  )
                )}

                {activeCmanageSubTab === 'inspection' && (
                  selectedInspectionId ? (
                    <motion.div key={`inspection-detail-${selectedInspectionId}`} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                      <InspectionDetailPage postId={selectedInspectionId} onBack={() => setSelectedInspectionId(null)} />
                    </motion.div>
                  ) : (
                    <motion.div key="inspection-list" initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                      <InspectionListPage onSelectPost={(id) => setSelectedInspectionId(id)} />
                    </motion.div>
                  )
                )}

                {activeCmanageSubTab === 'ppe' && (
                  selectedPpeId ? (
                    <motion.div key={`ppe-detail-${selectedPpeId}`} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                      <PpeDetailPage postId={selectedPpeId} onBack={() => setSelectedPpeId(null)} />
                    </motion.div>
                  ) : (
                    <motion.div key="ppe-list" initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                      <PpeListPage onSelectPost={(id) => setSelectedPpeId(id)} />
                    </motion.div>
                  )
                )}

                {activeCmanageSubTab === 'tbm' && (
                  selectedTbmId ? (
                    <motion.div key={`tbm-detail-${selectedTbmId}`} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                      <TbmDetailPage postId={selectedTbmId} onBack={() => setSelectedTbmId(null)} />
                    </motion.div>
                  ) : (
                    <motion.div key="tbm-list" initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                      <TbmListPage onSelectPost={(id) => setSelectedTbmId(id)} />
                    </motion.div>
                  )
                )}

                {activeCmanageSubTab === 'edu' && (
                  selectedEduId ? (
                    <motion.div key={`edu-detail-${selectedEduId}`} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                      <SafetyEduDetailPage postId={selectedEduId} onBack={() => setSelectedEduId(null)} />
                    </motion.div>
                  ) : (
                    <motion.div key="edu-list" initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                      <SafetyEduListPage onSelectPost={(id) => setSelectedEduId(id)} />
                    </motion.div>
                  )
                )}

                {activeCmanageSubTab === 'emergency' && (
                  selectedEmergencyId ? (
                    <motion.div key={`emergency-detail-${selectedEmergencyId}`} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                      <EmergencyDetailPage postId={selectedEmergencyId} onBack={() => setSelectedEmergencyId(null)} />
                    </motion.div>
                  ) : (
                    <motion.div key="emergency-list" initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                      <EmergencyListPage onSelectPost={(id) => setSelectedEmergencyId(id)} />
                    </motion.div>
                  )
                )}

                {activeCmanageSubTab !== 'all'
                  && activeCmanageSubTab !== 'ppe'
                  && activeCmanageSubTab !== 'inspection'
                  && activeCmanageSubTab !== 'emergency'
                  && activeCmanageSubTab !== 'edu'
                  && activeCmanageSubTab !== 'contract'
                  && activeCmanageSubTab !== 'board'
                  && activeCmanageSubTab !== 'report'
                  && activeCmanageSubTab !== 'tbm'
                  && CmanageDetailComponent && (
                    <motion.div key={`cmanage-detail-${activeCmanageSubTab}`} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                      <CmanageDetailComponent />
                    </motion.div>
                  )}
              </AnimatePresence>
            </motion.div>

          ) : activeTab === 'cctv' ? (

            <motion.div key="cctv-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CctvPage
                isMobile={isMobile}
                activeSubTab={activeSubTab}
                onSelectSubTab={(key) => {
                  setActiveSubTab(key)
                  requestAnimationFrame(() => {
                    cctvDetailAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  })
                }}
              />
              <AnimatePresence>
                <div ref={cctvDetailAnchorRef} />
                {activeSubTab !== 'all' && SUBTAB_MODEL_CONFIG[activeSubTab] && (
                  <motion.div key={`demo-${activeSubTab}`} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
                    <AiModelDemo {...SUBTAB_MODEL_CONFIG[activeSubTab]} />
                  </motion.div>
                )}
                {activeSubTab !== 'all' && DetailPageComponent && (
                  <motion.div key={`detail-${activeSubTab}`} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}>
                    <DetailPageComponent />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

          ) : activeTab === 'antitage' ? (

            <AntiageTab
    isMobile={isMobile}
    smartEquipmentItems={SMART_EQUIPMENT_ITEMS}
    onSmartEquipmentClick={handleSmartEquipmentClick}
    riskGrid={RISK_GRID}
    ImageGrid={ImageGrid}
    onRiskImageSelect={handleRiskImageSelect}
    loading={loading}
    LoadingUI={LoadingUI}
    ActionUI={ActionUI}
    PhoneMockup={PhoneMockup}
    analyze={analyze3}      
setPreview={setPreview} 
  />

          ) : (

            <motion.main
              key="risk"



              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                ...s.hero,
                flexDirection: isMobile ? 'column' : 'row',
                padding: isMobile ? '1px 20px 48px' : '60px 40px',
                gap: isMobile ? 0 : 32,
                alignItems: isMobile ? 'flex-start' : 'stretch'
              }}
            >
              {/* ── 왼쪽 컬럼 ── */}
              <div style={{ flex: isMobile ? 'none' : '0 0 460px', maxWidth: isMobile ? '100%' : 460, width: '100%' }}>
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

                  <h1 style={{ ...s.heroTitle, fontSize: isMobile ? 30 : 40, lineHeight: 1.4, letterSpacing: isMobile ? '-1.2px' : '-2.5px', marginBottom: isMobile ? 12 : 18, fontWeight: 400 }}>
                    <span style={{ fontWeight: 900 }}>AI</span>가 바꾸는 <br /> 안전장비 / TBM / 위험성평가
                  </h1>

                  <p style={{ ...s.heroSub, fontSize: isMobile ? 15 : 17, marginBottom: isMobile ? 10 : 14 }}>
                    AI로 더 빠르고 정확하게
                  </p>

                  {/* 채팅 버블 */}
                  {/* <div style={{ marginBottom: isMobile ? 16 : 20, minHeight: isMobile ? 110 : 120 }}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={copyIdx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.4 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#555', flexShrink: 0 }}>
                            Q
                          </div>
                          <div style={{ background: '#f0f0f0', borderRadius: '0px 14px 14px 14px', padding: '10px 14px', fontSize: isMobile ? 13 : 15, fontWeight: 700, color: '#333', lineHeight: 1.55, maxWidth: '80%' }}>
                            {HERO_SLIDES[copyIdx % HERO_SLIDES.length].question}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: 'row-reverse' }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#FAE100', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#3C1E1E', flexShrink: 0 }}>
                            A
                          </div>
                          <div style={{ background: '#FAE100', borderRadius: '14px 0px 14px 14px', padding: '10px 14px', maxWidth: '80%' }}>
                            <p style={{ fontSize: isMobile ? 13 : 15, fontWeight: 800, color: '#3C1E1E', lineHeight: 1.5, margin: '0 0 4px' }}>
                              {HERO_SLIDES[copyIdx % HERO_SLIDES.length].line1}
                            </p>
                            <p style={{ fontSize: isMobile ? 12 : 13, color: 'rgba(60,30,30,0.7)', lineHeight: 1.7, margin: 0 }}>
                              {HERO_SLIDES[copyIdx % HERO_SLIDES.length].line2}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div> */}

                  {/* 스마트안전장비 */}
      <div style={{ marginBottom: isMobile ? 16 : 20 }}>
  <p style={{ ...s.gridSectionLabel, marginBottom: 8 }}>스마트안전장비</p>

  <div
    style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
      gap: isMobile ? 8 : 10,
    }}
  >
    {SMART_EQUIPMENT_ITEMS.map((item) => (
      <motion.button
        key={item.key}
        type="button"
        whileHover={isMobile ? undefined : { y: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleSmartEquipmentClick(item.key)}
        style={{
          position: 'relative',
          border: 'none',
          borderRadius: 14,
          overflow: 'hidden',
          background: '#ddd',
          cursor: 'pointer',
          padding: 0,
          textAlign: 'left',
          aspectRatio: '1 / 1',
          boxShadow: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${item.img})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.08) 55%, rgba(0,0,0,0.02))',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 8,
            right: 8,
            bottom: 8,
            zIndex: 2,
            color: '#fff',
            fontSize: isMobile ? 11 : 12,
            fontWeight: 800,
            lineHeight: 1.2,
            textShadow: '0 1px 2px rgba(0,0,0,0.35)',
            wordBreak: 'keep-all',
          }}
        >
          {item.title}
        </div>
      </motion.button>
    ))}
  </div>
</div>

                  {/* ImageGrid */}
                  <div style={{ marginBottom: isMobile ? 16 : 20 }}>
                    <p style={{ ...s.gridSectionLabel, marginBottom: 8 }}> AI 위험성 평가 / TBM  </p>
                    <ImageGrid items={RISK_GRID} isMobile={isMobile} onSelect={handleRiskImageSelect} columns={6} />
                  </div>

                  {/* 업로드 */}
                  <AnimatePresence mode="wait">
                    {loading ? LoadingUI : ActionUI}
                  </AnimatePresence>

                  {isMobile && <PhoneMockup isMobile={true} />}
                </motion.div>
              </div>

              {/* ── 오른쪽 컬럼 (PC만) ── */}
              {!isMobile && (
                <motion.div
                  style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', flex: 1, paddingTop: 6 }}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                >
                  <div style={{ width: '100%', marginBottom: 14, display: 'flex', flexDirection: 'row', gap: 14, alignItems: 'stretch' }}>
                    <div style={{ flex: 1, background: '#f7f7f7', borderRadius: 12, padding: '16px 18px' }}>
                      <div style={{ marginBottom: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#111', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          추천코드가 없다면 클릭<span>👉</span>
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          placeholder="추천인 코드를 입력하세요"
                          style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#333', minWidth: 0 }}
                        />
                        <button style={{ padding: '10px 18px', background: '#FAE100', color: '#3C1E1E', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          신청하기
                        </button>
                      </div>
                      <div style={{ fontSize: 11, color: '#aaa', marginTop: 8, lineHeight: 1.5 }}>
                        추천코드 입력 시 50인 미만 사업장 무상 도입이 적용됩니다.
                      </div>
                    </div>
                  </div>

                  <div style={{ height: 700, aspectRatio: '1 / 2', background: '#1a1a1a', borderRadius: 44, padding: '10px 7px', boxShadow: '0 24px 80px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(255,255,255,0.07)', position: 'relative', flexShrink: 0, alignSelf: 'center' }}>
                    <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 52, height: 7, background: '#000', borderRadius: 4, zIndex: 10 }} />
                    <div style={{ width: '100%', height: '100%', borderRadius: 36, overflow: 'hidden', background: '#000' }}>
                      <video autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} src="/output.webm" />
                    </div>
                    <div style={{ position: 'absolute', bottom: 7, left: '50%', transform: 'translateX(-50%)', width: 52, height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 2 }} />
                    <div style={{ position: 'absolute', right: -3, top: 80, width: 3, height: 40, background: '#2a2a2a', borderRadius: 2 }} />
                    <div style={{ position: 'absolute', left: -3, top: 70, width: 3, height: 26, background: '#2a2a2a', borderRadius: 2 }} />
                    <div style={{ position: 'absolute', left: -3, top: 104, width: 3, height: 26, background: '#2a2a2a', borderRadius: 2 }} />
                  </div>
                </motion.div>
              )}
            </motion.main>
          )}
        </AnimatePresence>

        {activeTab === 'risk' && <SafetyMarketingSections isMobile={isMobile} />}

        <div style={{ ...s.notice, padding: isMobile ? '12px 20px' : '12px 40px' }}>
          <span style={s.noticeDot} />
          <span style={s.noticeText}>
            본 서비스는 산업안전보건법 제36조에 따른 위험성평가 보조 도구입니다. AI 분석 결과는 참고용이며 최종 판단은 안전관리자가 확인해야 합니다.
          </span>
        </div>

        <footer style={{ ...s.footer, padding: isMobile ? '14px 20px' : '14px 40px', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 4 : 14 }}>
          <span>© 2026 GRBlab AI 위험성평가 산업안전관리 시스템</span>
          {!isMobile && <span style={s.footerDiv}>|</span>}
          <span>고용노동부 · 안전보건공단 의 KRAS채계와 호환</span>
          {!isMobile && <span style={s.footerDiv}>|</span>}
          <span>sky011900@gmail.com</span>
        </footer>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) handleFile(file)
        }}
      />

      <RiskFactorModal
        open={riskModalOpen}
        onClose={() => {
          setRiskModalOpen(false)
          setPendingRiskFile(null)
          pendingActionRef.current = null
        }}
        onConfirm={handleRiskFactorConfirm}
      />
    </>
  )
}
/* ── 카메라 스타일 ── */
const cam = {
  root: { position: 'fixed', inset: 0, zIndex: 2000, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: "'Noto Sans KR',sans-serif" },
  video: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  vignette: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center,transparent 30%,rgba(0,0,0,0.7) 100%)', pointerEvents: 'none' },
  topBar: { position: 'relative', zIndex: 10, width: '100%', padding: '52px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  badge: { background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', padding: '7px 14px', borderRadius: 20, color: '#fff', fontSize: 12, fontWeight: 700 },
  closeBtn: { background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  framewrap: { flex: 1, position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 },
  frame: { width: '80vw', maxWidth: 320, aspectRatio: '1/1', position: 'relative' },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.55) 50%,transparent)', animation: 'camScan 3s ease-in-out infinite' },
  guide: { color: 'rgba(255,255,255,0.55)', fontSize: 13, textAlign: 'center' },
  shutterRow: { position: 'relative', zIndex: 10, paddingBottom: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  shutterOuter: { width: 76, height: 76, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.8)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  shutterCore: { width: 58, height: 58, borderRadius: '50%', background: 'rgba(255,255,255,0.85)' },
}

/* ── 메인 스타일 ── */
const s = {
navBelow: {
  width: '100%',
  borderTop: '1px solid rgba(0,0,0,0.06)',
  paddingTop: 16,     // ↑ 위 여백 증가
  paddingBottom: 18,  // ↓ 아래 여백 증가
},

navRight: {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  justifyContent: 'flex-start',
  flexWrap: 'wrap',
},
  page: { minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column', fontFamily: "'Noto Sans KR','Malgun Gothic',sans-serif" },
  nav: { borderBottom: '1px solid #ebebeb', background: '#fff', position: 'sticky', top: 0, zIndex: 100 },
  navInner: { maxWidth: 1200, margin: '0 auto', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { display: 'flex', alignItems: 'center', gap: 9 },
  logoMark: { width: 30, height: 30, borderRadius: 7, background: '#1a1a1a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900 },
  logoText: { fontSize: 15, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.5px' },
  tabs: { display: 'flex', alignItems: 'stretch', height: 58 },
  tabBtn: { background: 'none', border: 'none', borderBottom: '2px solid transparent', padding: '0 20px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap' },
  navRightBox: { display: 'flex', gap: 8 },
  navBadge: { fontSize: 11, color: '#999', border: '1px solid #e8e8e8', padding: '3px 10px', borderRadius: 20 },
  subTabWrap: { borderBottom: '1px solid #f0f0f0', background: '#fafafa', position: 'sticky', top: 58, zIndex: 90 },
  subTabInner: { maxWidth: 1200, margin: '0 auto', height: 44, display: 'flex', alignItems: 'stretch', gap: 0, whiteSpace: 'nowrap' },
  subTabBtn: { background: 'none', border: 'none', borderBottom: '2px solid transparent', padding: '0 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.15s, border-color 0.15s', whiteSpace: 'nowrap', flexShrink: 0, color: '#999' },
  hero: { flex: 1, margin: '0 auto', width: '100%', maxWidth: 1200, display: 'flex' },
  eyebrow: { fontWeight: 600, color: '#bbb', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 },
  heroTitle: { fontWeight: 900, color: '#1a1a1a', lineHeight: 1.05, fontFamily: "'Noto Sans KR',sans-serif" },
  heroSub: { color: '#999', lineHeight: 1.5, letterSpacing: '-0.2px', fontWeight: 500 },
  dropZone: { border: '1.5px dashed #d8d8d8', borderRadius: 8, padding: '26px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s', background: '#fafafa', marginBottom: 14 },
  dropActive: { border: '1.5px dashed #555', background: '#f5f5f5' },
  dropText: { fontSize: 14, fontWeight: 600, color: '#444' },
  dropSub: { fontSize: 12, color: '#bbb' },
  pcBtnRow: { display: 'flex', gap: 10, marginBottom: 14 },
  pcFileBtn: { background: '#fff', color: '#333', border: '1.5px solid #d8d8d8', borderRadius: 7, padding: '11px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit' },
  pcCamBtn: { flex: 1, background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 7, padding: '12px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' },
  mobileActions: { display: 'flex', flexDirection: 'column', gap: 10 },
  mobileCamBtn: { width: '100%', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 10, padding: '18px 20px', fontSize: 17, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'inherit', letterSpacing: '-0.3px' },
  mobileFileBtn: { width: '100%', background: 'none', border: 'none', color: '#aaa', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', textAlign: 'center', padding: '6px 0' },
  gridSectionLabel: { fontSize: 11, color: '#ccc', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 },
  errorBox: { fontSize: 12, color: '#666', background: '#f8f8f8', border: '1px solid #e8e8e8', padding: '10px 14px', borderRadius: 6, marginBottom: 10 },
  demoBtn: { background: 'none', border: 'none', color: '#ccc', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', padding: '2px 0' },
  loadingPreview: { borderRadius: 8, overflow: 'hidden', position: 'relative', aspectRatio: '16/9', marginBottom: 14, border: '1px solid #ebebeb' },
  loadingImg: { width: '100%', height: '100%', objectFit: 'cover' },
  loadingScan: { position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#1a1a1a 50%,transparent)', opacity: 0.4 },
  loadingSteps: { display: 'flex', flexDirection: 'column', gap: 10 },
  stepRow: { display: 'flex', alignItems: 'center', gap: 10 },
  stepDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  stepText: { fontSize: 13, color: '#555' },
  gridItem: { borderRadius: 8, aspectRatio: '1/1', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', padding: 8 },
  gridDim: { position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)' },
  gridLabel: { fontSize: 10, fontWeight: 700, color: '#fff', position: 'relative', zIndex: 2, textShadow: '0 1px 3px rgba(0,0,0,0.5)' },
  notice: { borderTop: '1px solid #f2f2f2', display: 'flex', alignItems: 'flex-start', gap: 10, maxWidth: 1200, margin: '0 auto', width: '100%' },
  noticeDot: { width: 4, height: 4, borderRadius: '50%', background: '#ddd', flexShrink: 0, marginTop: 6 },
  noticeText: { fontSize: 11, color: '#ccc', lineHeight: 1.7 },
  footer: { borderTop: '1px solid #f2f2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: 11 },
  footerDiv: { color: '#e8e8e8' },
  cctvCard: { padding: '18px 16px', borderRadius: 10, overflow: 'hidden', position: 'relative', cursor: 'default', transition: 'all 0.18s', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', backgroundColor: '#e0e0e0' },
  cctvCardDim: { position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' },
  cctvCardTitle: { fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 5, letterSpacing: '-0.2px' },
  cctvCardDesc: { fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 },
  subTabDetail: { marginTop: 24, padding: '18px 20px', background: '#f8f8f8', borderRadius: 10, borderLeft: '3px solid #1a1a1a' },
  subTabDetailTitle: { fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 },
  subTabDetailDesc: { fontSize: 13, color: '#666', lineHeight: 1.7 },
}

/* ── 작성·서식 전용 스타일 ── */
const fs = {
  // 특징 리스트
  featureList: { display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 },
  featureItem: { display: 'flex', alignItems: 'flex-start', gap: 14 },
  featureIcon: { width: 32, height: 32, borderRadius: 8, background: '#f5f5f5', border: '1px solid #ebebeb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 },
  featureTitle: { fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 },
  featureDesc: { fontSize: 12, color: '#999', lineHeight: 1.5 },

  // 2×2 그리드
  grid2x2: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 },
  loadingGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 },

  // 미니 카드
  miniCard: {
    background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10,
    overflow: 'hidden', cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex', flexDirection: 'column',
  },
  miniCardHeader: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' },
  miniCardType: { fontSize: 9, fontWeight: 700, color: '#fff', padding: '2px 6px', borderRadius: 3 },
  miniCardTitle: { fontSize: 11, fontWeight: 700, color: '#1a1a1a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

  // 양식 미니 렌더
  miniSheet: { padding: '8px 10px', flex: 1, background: '#fff' },
  miniDocTitle: { fontSize: 10, fontWeight: 900, color: '#1a1a2e', textAlign: 'center', marginBottom: 6, letterSpacing: '-0.3px', borderBottom: '1.5px double #1a1a2e', paddingBottom: 4 },
  miniTable: { display: 'flex', flexDirection: 'column', gap: 2 },
  miniRow: { display: 'flex', gap: 2 },
  miniTh: { background: '#eef0f3', padding: '2px 4px', fontSize: 8, color: '#2c3e50', fontWeight: 700, flex: '0 0 44%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', border: '0.5px solid #d0d0d0' },
  miniTd: { flex: 1, background: '#fff', border: '0.5px solid #d0d0d0', minHeight: 14 },
  miniSign: { display: 'flex', gap: 2, marginTop: 6, borderTop: '0.5px solid #d0d0d0', paddingTop: 4 },
  miniSignBox: { flex: 1, border: '0.5px solid #d0d0d0', fontSize: 7, color: '#999', textAlign: 'center', padding: '2px 0', background: '#f5f5f5' },

  miniCardFooter: { padding: '7px 12px', fontSize: 10, color: '#bbb', textAlign: 'right', borderTop: '1px solid #f0f0f0', background: '#fafafa' },

  // 스켈레톤
  skeletonCard: { background: '#f8f8f8', borderRadius: 10, padding: 14, border: '1px solid #eee' },
  skeletonLine: { height: 10, borderRadius: 4, background: 'linear-gradient(90deg, #ebebeb 25%, #f5f5f5 50%, #ebebeb 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', width: '100%' },

  // 빈 상태
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 15, fontWeight: 700, color: '#555' },
  emptyDesc: { fontSize: 12, color: '#aaa', textAlign: 'center', lineHeight: 1.6 },

  // NEW 뱃지
  newBadge: { fontSize: 9, fontWeight: 800, color: '#fff', background: '#1a1a2e', padding: '1px 5px', borderRadius: 3, marginLeft: 'auto', flexShrink: 0 },

  // 더보기
  moreLink: { marginTop: 12, textAlign: 'right' },
  moreLinkBtn: { background: 'none', border: 'none', fontSize: 12, color: '#aaa', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' },
}