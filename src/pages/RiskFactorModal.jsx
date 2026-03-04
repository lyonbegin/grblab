// src/components/RiskFactorModal.jsx
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

const PAGE_SIZE = 10

const SECTORS = [
  { key: 'construction', label: '건설' },
  { key: 'manufacturing', label: '제조' },
  { key: 'facility',      label: '시설' },
]

const MODES = [
  { key: 'tbm',  label: 'TBM' },
  { key: 'risk', label: '위험성 평가' },
]

const CSS = `
  .rfm-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.35);
    z-index: 9000;
    display: flex; align-items: center; justify-content: center;
  }
  .rfm-panel {
    position: relative; background: #fff;
    border-radius: 12px; width: 520px;
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - 48px);
    display: flex; flex-direction: column;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
  }

  /* 헤더 */
  .rfm-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 20px 14px;
    border-bottom: 1px solid #f3f4f6; flex-shrink: 0;
  }
  .rfm-title { font-size: 15px; font-weight: 800; color: #111827; }
  .rfm-close {
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    border: none; background: none; color: #9ca3af; cursor: pointer;
    border-radius: 6px; font-size: 18px; line-height: 1;
    transition: color 0.1s, background 0.1s;
  }
  .rfm-close:hover { color: #374151; background: #f3f4f6; }

  /* 바디 */
  .rfm-body { padding: 16px 20px; overflow-y: auto; flex: 1; }
  .rfm-body::-webkit-scrollbar { width: 4px; }
  .rfm-body::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 999px; }

  /* 푸터 */
  .rfm-footer {
    padding: 12px 20px; border-top: 1px solid #f3f4f6;
    display: flex; justify-content: flex-end; flex-shrink: 0;
  }
  .rfm-cancel-btn {
    height: 34px; padding: 0 18px;
    border: 1px solid #e5e7eb; border-radius: 7px;
    background: #fff; font-size: 13px; font-weight: 600;
    color: #6b7280; cursor: pointer; font-family: inherit;
    transition: all 0.1s;
  }
  .rfm-cancel-btn:hover { border-color: #9ca3af; color: #374151; }

  /* ── 카드 그리드 ── */
  .rfm-card-label {
    text-align: center; font-size: 13px; font-weight: 600;
    color: #6b7280; margin-bottom: 16px;
  }
  .rfm-card-grid-3 {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
  }
  .rfm-card-grid-2 {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
  }
  .rfm-card {
    display: flex; align-items: center; justify-content: center;
    height: 52px;
    border: 1px solid #e5e7eb; border-radius: 8px;
    background: #fff; cursor: pointer;
    transition: border-color 0.12s; user-select: none;
  }
  .rfm-card:hover { border-color: #2563eb; }
  .rfm-card:hover .rfm-card-label-text { color: #2563eb; }
  .rfm-card:active { background: #f8faff; }
  .rfm-card-label-text {
    font-size: 14px; font-weight: 700;
    color: #374151; transition: color 0.12s;
  }

  /* ── 모드 탭 ── */
  .rfm-mode-tabs { display: flex; gap: 6px; margin-bottom: 14px; }
  .rfm-mode-tab {
    height: 32px; padding: 0 16px;
    border: 1px solid #e5e7eb; border-radius: 7px;
    background: #fff; font-size: 12px; font-weight: 700;
    color: #9ca3af; cursor: pointer; font-family: inherit; transition: all 0.12s;
  }
  .rfm-mode-tab:hover { border-color: #2563eb; color: #2563eb; }
  .rfm-mode-tab.rfm-mode-active { border-color: #2563eb; background: #2563eb; color: #fff; }

  /* ── 컨트롤 영역 ── */
  .rfm-controls {
    display: flex; flex-direction: row;
    gap: 8px; margin-bottom: 10px; align-items: stretch;
  }
  @media (max-width: 480px) {
    .rfm-controls { flex-direction: column; }
  }

  /* ── 커스텀 드롭다운 ── */
  .rfm-dropdown {
    position: relative;
    flex: 0 0 155px;
  }
  @media (max-width: 480px) {
    .rfm-dropdown { flex: none; width: 100%; box-sizing: border-box; }
  }
  .rfm-dropdown-trigger {
    display: flex; align-items: center;
    width: 100%; height: 36px; box-sizing: border-box;
    padding: 0 10px;
    border: 1px solid #e2e8f0; border-radius: 8px;
    background: #f9fafb; cursor: pointer;
    font-size: 13px; font-weight: 600; font-family: inherit;
    color: #374151; transition: border-color 0.12s;
    user-select: none;
  }
  .rfm-dropdown-trigger:hover,
  .rfm-dropdown-trigger.open { border-color: #2563eb; background: #fff; }
  .rfm-dropdown-trigger-text {
    flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .rfm-dropdown-trigger-text.placeholder { color: #9ca3af; }
  .rfm-dropdown-arrow {
    flex-shrink: 0; margin-left: 6px;
    display: flex; align-items: center;
    transition: transform 0.15s;
  }
  .rfm-dropdown-trigger.open .rfm-dropdown-arrow { transform: rotate(180deg); }

  .rfm-dropdown-menu {
    position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 10000;
    background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.10);
    max-height: 220px; overflow-y: auto;
  }
  .rfm-dropdown-menu::-webkit-scrollbar { width: 4px; }
  .rfm-dropdown-menu::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 999px; }
  .rfm-dropdown-option {
    padding: 10px 12px;
    font-size: 13px; font-weight: 600; color: #374151;
    cursor: pointer; border-bottom: 1px solid #f3f4f6; transition: background 0.1s;
  }
  .rfm-dropdown-option:last-child { border-bottom: none; }
  .rfm-dropdown-option:hover { background: #f5f7ff; color: #2563eb; }
  .rfm-dropdown-option.selected { color: #2563eb; background: #eff6ff; }
  .rfm-dropdown-option.placeholder-opt { color: #9ca3af; }

  /* ── 검색박스 ── */
  .rfm-search-box { position: relative; flex: 1; }
  @media (max-width: 480px) { .rfm-search-box { flex: none; width: 100%; } }
  .rfm-search-inp {
    width: 100%; height: 36px; box-sizing: border-box;
    border: 1px solid #e2e8f0; border-radius: 8px;
    padding: 0 34px 0 12px;
    font-size: 13px; font-weight: 600; font-family: inherit; color: #374151;
    background: #f9fafb; outline: none; transition: border-color 0.12s;
  }
  .rfm-search-inp:focus { border-color: #2563eb; background: #fff; }
  .rfm-search-icon {
    position: absolute; right: 10px; top: 50%;
    transform: translateY(-50%); pointer-events: none;
  }
  .rfm-search-clear {
    position: absolute; right: 9px; top: 50%; transform: translateY(-50%);
    background: none; border: none; font-size: 17px;
    line-height: 1; color: #9ca3af; cursor: pointer; padding: 0;
  }
  .rfm-search-clear:hover { color: #6b7280; }

  /* 자동완성 */
  .rfm-autocomplete {
    position: absolute; top: calc(100% + 3px); left: 0; right: 0; z-index: 9999;
    background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08); overflow: hidden;
  }
  .rfm-ac-item {
    display: flex; align-items: center; gap: 8px; padding: 9px 12px;
    font-size: 12px; font-weight: 600; color: #374151;
    cursor: pointer; border-bottom: 1px solid #f3f4f6; transition: background 0.1s;
  }
  .rfm-ac-item:last-child { border-bottom: none; }
  .rfm-ac-item:hover, .rfm-ac-item.active { background: #f5f7ff; }
  .rfm-ac-tag {
    font-size: 10px; font-weight: 700; color: #2563eb;
    background: #eff6ff; border-radius: 4px;
    padding: 1px 6px; white-space: nowrap; flex-shrink: 0;
  }
  .rfm-ac-text { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .rfm-hl { color: #2563eb; font-weight: 800; }

  .rfm-meta {
    font-size: 11px; font-weight: 600;
    color: #9ca3af; margin-bottom: 8px; padding-left: 2px;
  }
  .rfm-hint {
    padding: 36px 0; text-align: center;
    color: #d1d5db; font-size: 13px; font-weight: 600;
  }
  .rfm-hint-sub { font-size: 11px; color: #e5e7eb; margin-top: 4px; }
  .rfm-list { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
  .rfm-list-item {
    display: flex; align-items: center; padding: 11px 14px;
    border-bottom: 1px solid #f3f4f6;
    cursor: pointer; transition: background 0.1s; user-select: none;
  }
  .rfm-list-item:last-child { border-bottom: none; }
  .rfm-list-item:hover { background: #f5f7ff; }
  .rfm-list-item:active { background: #eff6ff; }
  .rfm-list-num { flex: 0 0 26px; font-size: 11px; font-weight: 700; color: #d1d5db; text-align: center; }
  .rfm-list-work {
    flex: 0 0 120px; font-size: 12px; font-weight: 700; color: #2563eb;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .rfm-list-sep { color: #d1d5db; font-size: 12px; margin: 0 8px; flex-shrink: 0; }
  .rfm-list-detail {
    flex: 1; font-size: 13px; font-weight: 600; color: #374151;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .rfm-list-arrow {
    flex-shrink: 0; margin-left: 8px; color: #d1d5db; font-size: 13px;
    transition: color 0.1s, transform 0.1s;
  }
  .rfm-list-item:hover .rfm-list-arrow { color: #2563eb; transform: translateX(2px); }
  .rfm-pagination {
    display: flex; align-items: center; justify-content: center;
    gap: 6px; margin-top: 12px;
  }
  .rfm-page-btn {
    height: 32px; padding: 0 12px;
    border: 1px solid #e5e7eb; border-radius: 7px;
    background: #fff; font-size: 12px; font-weight: 600;
    color: #6b7280; cursor: pointer; font-family: inherit; transition: all 0.1s;
  }
  .rfm-page-btn:hover:not(:disabled) { border-color: #2563eb; color: #2563eb; }
  .rfm-page-btn:disabled { opacity: 0.3; cursor: default; }
  .rfm-page-info { font-size: 12px; font-weight: 600; color: #9ca3af; min-width: 60px; text-align: center; }
  .rfm-loading { padding: 36px 0; text-align: center; color: #9ca3af; font-size: 13px; font-weight: 600; }
`

function Highlight({ text, query }) {
  if (!query) return <span>{text}</span>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx < 0) return <span>{text}</span>
  return (
    <span>
      {text.slice(0, idx)}
      <span className="rfm-hl">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </span>
  )
}

/** 네이티브 select 대신 완전 커스텀 드롭다운 — 모바일 높이 깨짐 없음 */
function CustomSelect({ value, onChange, options, placeholder = '선택' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div className="rfm-dropdown" ref={ref}>
      <div
        className={`rfm-dropdown-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className={`rfm-dropdown-trigger-text${!selected ? ' placeholder' : ''}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="rfm-dropdown-arrow">
          <svg width="11" height="7" viewBox="0 0 11 7" fill="none">
            <path d="M1 1l4.5 4.5L10 1" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
      {open && (
        <div className="rfm-dropdown-menu">
          <div
            className={`rfm-dropdown-option placeholder-opt${!value ? ' selected' : ''}`}
            onMouseDown={e => { e.preventDefault(); onChange(''); setOpen(false) }}
          >
            {placeholder}
          </div>
          {options.map(o => (
            <div
              key={o.value}
              className={`rfm-dropdown-option${value === o.value ? ' selected' : ''}`}
              onMouseDown={e => { e.preventDefault(); onChange(o.value); setOpen(false) }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RiskFactorModal({ open, onClose, onConfirm }) {
  const [step,         setStep]         = useState('sector')
  const [sector,       setSector]       = useState(null)
  const [mode,         setMode]         = useState(null)
  const [data,         setData]         = useState(null)
  const [loadErr,      setLoadErr]      = useState(false)
  const [selectedWork, setSelectedWork] = useState('')
  const [search,       setSearch]       = useState('')
  const [showAC,       setShowAC]       = useState(false)
  const [acIdx,        setAcIdx]        = useState(-1)
  const [page,         setPage]         = useState(0)

  const inputRef     = useRef(null)
  const searchBoxRef = useRef(null)

  useEffect(() => {
    if (step !== 'work' || sector !== 'construction' || data) return
    fetch('/risk_work_data.json')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setData)
      .catch(() => setLoadErr(true))
  }, [step, sector, data])

  useEffect(() => {
    if (!open) return
    const fn = e => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [open])

  useEffect(() => {
    const fn = e => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) setShowAC(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const handleSectorSelect = useCallback((key) => {
    if (key !== 'construction') {
      onConfirm?.({ sector: key }); resetAll(); onClose?.(); return
    }
    setSector(key); setStep('mode')
  }, [onClose, onConfirm])

  const handleModeSelect = useCallback((key) => {
    setMode(key); setStep('work')
  }, [])

  const suggestions = useMemo(() => {
    if (!data || search.trim().length < 1) return []
    const q = search.trim().toLowerCase()
    const result = []
    for (const item of data.flat) {
      if (item.workName.toLowerCase().includes(q) || item.detailName.toLowerCase().includes(q)) {
        result.push(item)
        if (result.length >= 5) break
      }
    }
    return result
  }, [data, search])

  useEffect(() => {
    setShowAC(search.trim().length > 0 && suggestions.length > 0)
    setAcIdx(-1)
  }, [suggestions, search])

  const hasFilter = selectedWork !== '' || search.trim() !== ''
  const filtered = useMemo(() => {
    if (!data || !hasFilter) return []
    const q = search.trim().toLowerCase()
    let list = selectedWork ? data.flat.filter(f => f.workName === selectedWork) : data.flat
    if (q) list = list.filter(f =>
      f.workName.toLowerCase().includes(q) || f.detailName.toLowerCase().includes(q)
    )
    return list
  }, [data, selectedWork, search, hasFilter])

  useEffect(() => { setPage(0) }, [filtered])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageItems  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const applyAC = useCallback(item => {
    setSearch(item.detailName); setSelectedWork(item.workName)
    setShowAC(false); inputRef.current?.focus()
  }, [])

  const onKeyDown = useCallback(e => {
    if (!showAC || !suggestions.length) return
    if (e.key === 'ArrowDown')  { e.preventDefault(); setAcIdx(p => Math.min(p + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp')  { e.preventDefault(); setAcIdx(p => Math.max(p - 1, -1)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (acIdx >= 0) applyAC(suggestions[acIdx]); else setShowAC(false) }
    else if (e.key === 'Escape') { setShowAC(false) }
  }, [showAC, suggestions, acIdx, applyAC])

  const handleSelect = useCallback(item => {
    onConfirm?.({ ...item, sector, mode }); resetAll(); onClose?.()
  }, [onConfirm, sector, mode, onClose])

  const resetAll = () => {
    setStep('sector'); setSector(null); setMode(null)
    setSelectedWork(''); setSearch(''); setShowAC(false); setPage(0)
  }
  const handleClose = useCallback(() => { resetAll(); onClose?.() }, [onClose])

  const workOptions = useMemo(
    () => (data?.workNames ?? []).map(w => ({ value: w, label: w })),
    [data]
  )

  if (!open) return null

  return createPortal(
    <>
      <style>{CSS}</style>
      <div className="rfm-overlay" onMouseDown={e => { if (e.target === e.currentTarget) handleClose() }}>
        <div className="rfm-panel">

          <div className="rfm-header">
            <span className="rfm-title">공종별 작업 선택</span>
            <button className="rfm-close" onClick={handleClose}>×</button>
          </div>

          <div className="rfm-body">

            {step === 'sector' && (
              <>
                <div className="rfm-card-label">어떤 분야의 작업을 선택하시겠습니까?</div>
                <div className="rfm-card-grid-3">
                  {SECTORS.map(s => (
                    <div key={s.key} className="rfm-card" onClick={() => handleSectorSelect(s.key)}>
                      <span className="rfm-card-label-text">{s.label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 'mode' && (
              <>
                <div className="rfm-card-label">어떤 목적으로 사용하시겠습니까?</div>
                <div className="rfm-card-grid-2">
                  {MODES.map(m => (
                    <div key={m.key} className="rfm-card" onClick={() => handleModeSelect(m.key)}>
                      <span className="rfm-card-label-text">{m.label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 'work' && (
              <>
                <div className="rfm-mode-tabs">
                  {MODES.map(m => (
                    <button
                      key={m.key}
                      className={`rfm-mode-tab${mode === m.key ? ' rfm-mode-active' : ''}`}
                      onClick={() => { setMode(m.key); setSelectedWork(''); setSearch(''); setPage(0) }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="rfm-controls">
                  <CustomSelect
                    value={selectedWork}
                    onChange={v => { setSelectedWork(v); setSearch(''); setPage(0) }}
                    options={workOptions}
                    placeholder="작업명 선택"
                  />

                  <div className="rfm-search-box" ref={searchBoxRef}>
                    <input
                      ref={inputRef}
                      className="rfm-search-inp"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      onKeyDown={onKeyDown}
                      onFocus={() => { if (suggestions.length > 0) setShowAC(true) }}
                      placeholder="세부공정명 검색…"
                      autoComplete="off"
                    />
                    {search ? (
                      <button className="rfm-search-clear"
                        onClick={() => { setSearch(''); setShowAC(false); inputRef.current?.focus() }}>
                        ×
                      </button>
                    ) : (
                      <svg className="rfm-search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <circle cx="6.5" cy="6.5" r="5" stroke="#9ca3af" strokeWidth="1.5"/>
                        <path d="M10.5 10.5l3 3" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    )}
                    {showAC && (
                      <div className="rfm-autocomplete">
                        {suggestions.map((item, i) => (
                          <div
                            key={`ac-${item.workName}-${item.detailName}`}
                            className={`rfm-ac-item${acIdx === i ? ' active' : ''}`}
                            onMouseDown={e => { e.preventDefault(); applyAC(item) }}
                          >
                            <span className="rfm-ac-tag">{item.workName}</span>
                            <span className="rfm-ac-text">
                              <Highlight text={item.detailName} query={search.trim()} />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {!hasFilter ? (
                  <div className="rfm-hint">작업명을 선택하거나 검색어를 입력해 주세요.</div>
                ) : loadErr ? (
                  <div className="rfm-hint">
                    데이터를 불러오지 못했습니다.
                    <div className="rfm-hint-sub">public/risk_work_data.json을 확인해 주세요.</div>
                  </div>
                ) : !data ? (
                  <div className="rfm-loading">불러오는 중…</div>
                ) : filtered.length === 0 ? (
                  <div className="rfm-hint">검색 결과가 없습니다.</div>
                ) : (
                  <>
                    <div className="rfm-meta">
                      총 {filtered.length}개{totalPages > 1 ? `  ·  ${page + 1} / ${totalPages} 페이지` : ''}
                    </div>
                    <div className="rfm-list">
                      {pageItems.map((item, i) => (
                        <div
                          key={`${item.workName}-${item.detailName}`}
                          className="rfm-list-item"
                          onClick={() => handleSelect(item)}
                        >
                          <span className="rfm-list-num">{page * PAGE_SIZE + i + 1}</span>
                          <span className="rfm-list-work">
                            <Highlight text={item.workName} query={search.trim()} />
                          </span>
                          <span className="rfm-list-sep">/</span>
                          <span className="rfm-list-detail">
                            <Highlight text={item.detailName} query={search.trim()} />
                          </span>
                          <span className="rfm-list-arrow">→</span>
                        </div>
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="rfm-pagination">
                        <button className="rfm-page-btn" onClick={() => setPage(0)} disabled={page === 0}>처음</button>
                        <button className="rfm-page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}>← 이전</button>
                        <span className="rfm-page-info">{page + 1} / {totalPages}</span>
                        <button className="rfm-page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>다음 →</button>
                        <button className="rfm-page-btn" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>마지막</button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          <div className="rfm-footer">
            <button className="rfm-cancel-btn" onClick={handleClose}>취소</button>
          </div>

        </div>
      </div>
    </>,
    document.body
  )
}