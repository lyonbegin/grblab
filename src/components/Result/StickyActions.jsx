import { useState } from 'react'
import { Button } from 'antd'
import { FilePdfOutlined, ShareAltOutlined, ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

export default function StickyActions({ result, onPdf }) {
  const navigate = useNavigate()
  const [exporting, setExporting] = useState(false)

  const handlePDF = async () => {
    if (!onPdf) return
    try {
      setExporting(true)
      await onPdf()   // ✅ ResultPage에서 전달된 PDF 함수 실행
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={styles.sticky}>
      {/* <button onClick={() => navigate('/')} style={styles.resetBtn}>
        <ReloadOutlined /> 새로 분석
      </button> */}

      <div style={styles.btnGroup}>
        <Button
         type="default"
          icon={<FilePdfOutlined />}
          loading={exporting}
          onClick={handlePDF}
          style={styles.pdfBtn}
        >
          PDF 저장
        </Button>

        <Button
          icon={<ShareAltOutlined />}
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'KRAS AI 위험성평가 결과',
                text: result?.summary?.processName || '',
              })
            }
          }}
          style={styles.shareBtn}
        >
          공유
        </Button>
      </div>
    </div>
  )
}

const styles = {
  sticky: {
    position: 'sticky',
    bottom: 0,
    background: 'linear-gradient(to top, #0a0e1a 70%, transparent)',
    padding: '20px 0 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 10,
  },
  resetBtn: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontFamily: "'Noto Sans KR', sans-serif",
    padding: '8px 4px',
  },
  btnGroup: {
    display: 'flex',
    gap: 8,
  },

  // 🔥 오렌지 제거 (기존 #FF4D00 제거)
pdfBtn: {
  background: '#1a1a2e',
  borderColor: '#1a1a2e',
    color: '#fff',  
  fontWeight: 600,
  fontSize: 13,
  height: 40,
  borderRadius: 10,
},

  shareBtn: {
    background: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.15)',
    color: '#fff',
    fontWeight: 500,
    fontSize: 13,
    height: 40,
    borderRadius: 10,
  },
}