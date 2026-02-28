import { useCallback } from 'react'

export function useExport() {
  const exportPDF = useCallback(async (elementId, filename = 'KRAS_위험성평가결과.pdf') => {
    try {
      const { default: html2canvas } = await import('html2canvas')
      const { default: jsPDF } = await import('jspdf')

      const element = document.getElementById(elementId)
      if (!element) return

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#111827',
        useCORS: true,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(filename)
    } catch (err) {
      console.error('PDF 내보내기 오류:', err)
    }
  }, [])

  const shareResult = useCallback(async (summary) => {
    const text = `[AI 위험성평가 결과]\n공정: ${summary?.processName}\n종합등급: ${summary?.overallLevel?.label || '높음'}`
    if (navigator.share) {
      await navigator.share({ title: 'AI 위험성평가 결과', text })
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      alert('결과가 클립보드에 복사되었습니다.')
    }
  }, [])

  return { exportPDF, shareResult }
}
