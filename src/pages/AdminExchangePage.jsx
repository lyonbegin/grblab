// src/pages/AdminExchangePage.jsx
import { useState, useRef, useCallback, useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

const FONT = "'Noto Sans KR','Malgun Gothic',sans-serif"
const API = 'https://backend-production-6b41.up.railway.app'

const C = {
  navy: '#16215C',
  navyDark: '#0E1640',
  yellow: '#FFD400',
  red: '#E63946',
  green: '#1B9C5A',
  cream: '#F4F5FA',
  ink: '#16182B',
  inkSoft: '#54577A',
  hair: '#D9DBEC',
  white: '#fff',
}

const READER_ID = 'admin-qr-reader'

export default function AdminExchangePage() {
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(false)       // 서버 조회/확정 중
  const [info, setInfo] = useState(null)              // {signature_id, name, exchanged, exchanged_at}
  const [confirmed, setConfirmed] = useState(false)   // 이번 세션에서 방금 확정했는지
  const [error, setError] = useState(null)
  const [manualId, setManualId] = useState('')

  const qrRef = useRef(null)       // Html5Qrcode 인스턴스
  const lockRef = useRef(false)    // 중복 스캔 방지

  // 언마운트 시 카메라 정리
  useEffect(() => {
    return () => { stopScanner() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopScanner = useCallback(async () => {
    const inst = qrRef.current
    if (inst) {
      try {
        if (inst.isScanning) await inst.stop()
        await inst.clear()
      } catch (_) { /* 무시 */ }
      qrRef.current = null
    }
    setScanning(false)
  }, [])

  // 서버에서 교환 상태 조회
  const fetchStatus = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    setInfo(null)
    setConfirmed(false)
    try {
      const res = await fetch(`${API}/api/petition/exchange/${id}`)
      const data = await res.json().catch(() => ({}))
      if (res.status === 404) { setError('해당 번호의 서명을 찾을 수 없습니다.'); return }
      if (!res.ok) { setError(data.detail || '조회에 실패했습니다.'); return }
      setInfo(data)
    } catch (_) {
      setError('네트워크 오류로 조회하지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  // 스캔 성공 콜백
  const onScanned = useCallback(async (decodedText) => {
    if (lockRef.current) return
    const digits = String(decodedText).replace(/\D/g, '')
    if (!digits) return
    lockRef.current = true
    await stopScanner()
    await fetchStatus(digits)
    // 잠깐 뒤 잠금 해제 (다음 스캔 대비)
    setTimeout(() => { lockRef.current = false }, 800)
  }, [stopScanner, fetchStatus])

  const startScanner = useCallback(async () => {
    setError(null)
    setInfo(null)
    setConfirmed(false)
    setScanning(true)
    lockRef.current = false

    // DOM이 그려진 뒤 인스턴스 생성
    setTimeout(async () => {
      try {
        const inst = new Html5Qrcode(READER_ID, { verbose: false })
        qrRef.current = inst
        await inst.start(
          { facingMode: 'environment' },          // 후면 카메라
          { fps: 10, qrbox: { width: 260, height: 160 } },
          onScanned,
          () => { /* 인식 실패 프레임은 무시 */ }
        )
      } catch (e) {
        setScanning(false)
        setError('카메라를 열 수 없습니다. 권한을 확인해 주세요.')
      }
    }, 50)
  }, [onScanned])

  // 교환 확정 (DB 업데이트)
  const confirmExchange = useCallback(async () => {
    if (!info) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/petition/exchange/${info.signature_id}/confirm`, {
        method: 'POST',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.detail || '교환 확정에 실패했습니다.'); return }
      setInfo({ ...info, exchanged: true })
      setConfirmed(!data.already_done)   // 이미 됐던 거면 confirmed=false (안내만)
    } catch (_) {
      setError('네트워크 오류로 확정하지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [info])

  const reset = useCallback(() => {
    setInfo(null)
    setError(null)
    setConfirmed(false)
    setManualId('')
    setSentCode(null)
  }, [])

  // 이름에서 부가정보(::::) 제거
  const displayName = info ? String(info.name || '').split('::::')[0] : ''

  // 담당자 폰의 문자 앱을 열어 인증번호를 발송 (외부 SMS 서비스 불필요)
  const [sentCode, setSentCode] = useState(null)
  const sendVerifySms = useCallback(() => {
    if (!info || !info.phone) {
      setError('전화번호 정보가 없습니다.')
      return
    }
    const code = String(Math.floor(10 + Math.random() * 90)) // 2자리 (10~99)
    setSentCode(code)
    const body = encodeURIComponent(`[부산의료복지사회적협동조합] 본인확인 인증번호 ${code}`)
    const phone = String(info.phone).replace(/\D/g, '')
    // iOS는 sms:번호&body=, 그 외는 sms:번호?body= 를 더 잘 처리하지만
    // 대부분의 모바일에서 ? 형식이 동작합니다.
    window.location.href = `sms:${phone}?body=${body}`
  }, [info])

  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: FONT, padding: '20px 16px 40px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
        #${READER_ID} video { border-radius: 14px; }
      `}</style>

      <div style={{ maxWidth: 440, margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{
          background: `linear-gradient(135deg, ${C.navyDark} 0%, ${C.navy} 100%)`,
          borderRadius: 18, padding: '22px 22px', color: '#fff', marginBottom: 18,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.yellow, letterSpacing: '0.1em', marginBottom: 6 }}>
            현장 담당자 · 기프트카드 교환
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.4px' }}>
            서명 바코드 확인
          </div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginTop: 6, lineHeight: 1.6 }}>
            참여자 화면의 바코드를 스캔해 교환 여부를 확인하고,<br />
            지급 후 ‘교환 확정’을 눌러 주세요.
          </div>
        </div>

        {/* 스캐너 영역 */}
        {!info && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 18, border: `1px solid ${C.hair}`, marginBottom: 16 }}>
            {scanning ? (
              <>
                <div id={READER_ID} style={{ width: '100%', borderRadius: 14, overflow: 'hidden' }} />
                <button onClick={stopScanner}
                  style={{ width: '100%', marginTop: 14, padding: 14, border: `1.5px solid ${C.hair}`, borderRadius: 12, background: '#fff', color: C.inkSoft, fontSize: 15, fontWeight: 800, fontFamily: FONT, cursor: 'pointer' }}>
                  스캔 중지
                </button>
              </>
            ) : (
              <>
                <div style={{
                  height: 180, borderRadius: 14, background: C.cream,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  color: C.inkSoft, gap: 10, border: `1px dashed ${C.hair}`,
                }}>
                  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                    <line x1="7" y1="12" x2="17" y2="12" />
                  </svg>
                  <span style={{ fontSize: 13 }}>카메라로 바코드를 스캔하세요</span>
                </div>
                <button onClick={startScanner}
                  style={{ width: '100%', marginTop: 14, padding: 15, border: 'none', borderRadius: 12, background: C.navy, color: '#fff', fontSize: 16, fontWeight: 900, fontFamily: FONT, cursor: 'pointer' }}>
                  바코드 스캔 시작
                </button>

                {/* 수동 입력 (카메라 안 될 때 대비) */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.hair}` }}>
                  <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 8, fontWeight: 700 }}>번호 직접 입력</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={manualId} inputMode="numeric"
                      onChange={e => setManualId(e.target.value.replace(/\D/g, ''))}
                      placeholder="바코드 번호"
                      style={{ flex: 1, padding: '13px 14px', border: `1.5px solid ${C.hair}`, borderRadius: 10, fontSize: 16, fontFamily: FONT, outline: 'none', background: C.cream, color: C.ink }} />
                    <button onClick={() => manualId && fetchStatus(manualId)} disabled={!manualId}
                      style={{ flexShrink: 0, padding: '0 18px', border: 'none', borderRadius: 10, background: manualId ? C.navy : C.hair, color: manualId ? '#fff' : '#a4a6c0', fontSize: 15, fontWeight: 800, fontFamily: FONT, cursor: manualId ? 'pointer' : 'not-allowed' }}>
                      조회
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <div style={{ textAlign: 'center', color: C.inkSoft, fontSize: 14, padding: 16 }}>처리 중…</div>
        )}

        {/* 에러 */}
        {error && (
          <div style={{ background: '#FDECEE', border: `1px solid ${C.red}33`, color: C.red, borderRadius: 12, padding: '14px 16px', fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
            {error}
            <button onClick={reset} style={{ display: 'block', marginTop: 10, padding: '10px 0', width: '100%', border: 'none', borderRadius: 10, background: C.navy, color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: FONT, cursor: 'pointer' }}>
              다시 스캔
            </button>
          </div>
        )}

        {/* 조회 결과 */}
        {info && !loading && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 22, border: `1px solid ${C.hair}` }}>
            <div style={{ fontSize: 12, color: C.inkSoft, fontWeight: 700, marginBottom: 4 }}>서명 번호</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.ink, letterSpacing: '0.06em', marginBottom: 16, fontVariantNumeric: 'tabular-nums' }}>
              {info.signature_id}
            </div>

            <div style={{ fontSize: 12, color: C.inkSoft, fontWeight: 700, marginBottom: 4 }}>이름</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, marginBottom: 18 }}>
              {displayName || '—'}
            </div>

            {/* 상태 배지 */}
            {info.exchanged ? (
              <div style={{
                background: confirmed ? '#E9F7EF' : '#FFF6E0',
                border: `1px solid ${confirmed ? C.green : C.yellow}66`,
                borderRadius: 12, padding: '16px', textAlign: 'center', marginBottom: 16,
              }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{confirmed ? '✅' : '⚠️'}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: confirmed ? C.green : '#9a7b00', marginBottom: 4 }}>
                  {confirmed ? '교환이 완료되었습니다' : '이미 교환된 서명입니다'}
                </div>
                <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.6 }}>
                  {confirmed
                    ? '지급 처리가 기록되었습니다.'
                    : '이 사람은 이미 기프트카드를 받았습니다. 중복 지급에 주의하세요.'}
                </div>
              </div>
            ) : (
              <div style={{
                background: C.cream, border: `1px solid ${C.hair}`,
                borderRadius: 12, padding: '14px 16px', textAlign: 'center', marginBottom: 16,
              }}>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: C.navy }}>
                  아직 교환되지 않았습니다
                </div>
                <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 4 }}>
                  기프트카드 지급 후 아래 버튼을 눌러 주세요.
                </div>
              </div>
            )}

            {/* 인증번호 발송 (담당자 폰 문자 앱) */}
            {!info.exchanged && (
              <>
                <button onClick={sendVerifySms} disabled={loading}
                  style={{ width: '100%', padding: 15, border: `2px solid ${C.navy}`, borderRadius: 12, background: '#fff', color: C.navy, fontSize: 15.5, fontWeight: 900, fontFamily: FONT, cursor: 'pointer', marginBottom: 10 }}>
                  📩 본인확인 인증문자 보내기
                </button>
                {sentCode && (
                  <div style={{ background: '#FFF6E0', border: `1px solid ${C.yellow}66`, borderRadius: 10, padding: '12px 14px', marginBottom: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: C.inkSoft, fontWeight: 700, marginBottom: 2 }}>발송한 인증번호</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: C.ink, letterSpacing: '0.2em', fontVariantNumeric: 'tabular-nums' }}>{sentCode}</div>
                    <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 4, lineHeight: 1.5 }}>
                      참여자가 받은 문자의 번호와 같은지 확인하세요.
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 버튼 */}
            {!info.exchanged ? (
              <button onClick={confirmExchange} disabled={loading}
                style={{ width: '100%', padding: 16, border: 'none', borderRadius: 12, background: C.green, color: '#fff', fontSize: 16, fontWeight: 900, fontFamily: FONT, cursor: 'pointer', marginBottom: 10 }}>
                교환 확정 (지급 완료)
              </button>
            ) : null}

            <button onClick={() => { reset(); startScanner() }}
              style={{ width: '100%', padding: 14, border: `1.5px solid ${C.hair}`, borderRadius: 12, background: '#fff', color: C.navy, fontSize: 15, fontWeight: 800, fontFamily: FONT, cursor: 'pointer' }}>
              다음 바코드 스캔
            </button>
          </div>
        )}
      </div>
    </div>
  )
}