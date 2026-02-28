import { useState, useCallback } from 'react'
import { mapKras as mapAllMethods } from '../utils/krasMapper'

const ROBOFLOW_WORKFLOW_URL = 'https://serverless.roboflow.com/grb/workflows/custom-workflow-3'
const ROBOFLOW_API_KEY = 'P0UYFNweFjm7uZo2nVVG'

function parseOpenAIJson(rawOutput) {
  try {
    const cleaned = rawOutput
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()
    return JSON.parse(cleaned)
  } catch {
    const match = rawOutput.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) } catch {}
    }
    return null
  }
}

function blobToPureBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = () => reject(new Error('파일 읽기 실패'))
    reader.readAsDataURL(blob)
  })
}

// ── 대표님 제공 scanImage 함수 그대로 ──
async function scanImage(imageBlob) {
  const base64 = await blobToPureBase64(imageBlob)

  const img = await new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = `data:image/jpeg;base64,${base64}`
  })

  const IMAGE_WIDTH = img.width
  const IMAGE_HEIGHT = img.height

  console.log('========================================')
  console.log('📷 원본 이미지 크기')
  console.log('========================================')
  console.log(`Width: ${IMAGE_WIDTH}px`)
  console.log(`Height: ${IMAGE_HEIGHT}px`)
  console.log(`Aspect Ratio: ${(IMAGE_WIDTH / IMAGE_HEIGHT).toFixed(2)}`)

  const res = await fetch(ROBOFLOW_WORKFLOW_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: ROBOFLOW_API_KEY,
      inputs: {
        image: { type: 'base64', value: base64 },
      },
    }),
  })

  console.log('🌐 Roboflow HTTP Status:', res.status)
  console.log('🌐 Roboflow Headers:', Object.fromEntries(res.headers.entries()))
  const rawText = await res.text()
  console.log('🌐 Roboflow 응답 원문:', rawText)

  if (!res.ok) {
    throw new Error(`Roboflow HTTP ${res.status}: ${rawText}`)
  }

  const result = JSON.parse(rawText)
  const rawOutput = result?.outputs?.[0]?.open_ai?.output

  if (!rawOutput) {
    return { success: false, error: 'AI 응답 본문이 비어있습니다.', _raw: null }
  }

  const analysisData = parseOpenAIJson(rawOutput)

  const results = Array.isArray(analysisData?.results)
    ? analysisData.results
    : Array.isArray(analysisData?.detected_objects)
    ? analysisData.detected_objects
    : []

  console.log('========================================')
  console.log('🔍 감지된 객체 분석')
  console.log('========================================')
  console.log(`총 객체 수: ${results.length}개`)

  results.forEach((item, idx) => {
    const bbox = item?.bbox
    console.log(`--- 객체 #${idx + 1} ---`)
    console.log(`Keyword: ${item?.keyword || 'N/A'}`)
    console.log(`OCR: ${item?.ocr || 'N/A'}`)
    console.log(`BBox 원본: [${bbox?.join(', ') || 'N/A'}]`)
    if (Array.isArray(bbox) && bbox.length === 4) {
      const [ymin, xmin, ymax, xmax] = bbox
      const x1_px = Math.round((xmin / 1000) * IMAGE_WIDTH)
      const x2_px = Math.round((xmax / 1000) * IMAGE_WIDTH)
      const y1_px = Math.round((ymin / 1000) * IMAGE_HEIGHT)
      const y2_px = Math.round((ymax / 1000) * IMAGE_HEIGHT)
      console.log(`픽셀 변환: x1=${x1_px} y1=${y1_px} x2=${x2_px} y2=${y2_px}`)
      console.log(`크롭 크기: ${x2_px - x1_px}px × ${y2_px - y1_px}px`)
    }
  })

  return { success: true, _raw: analysisData }
}

// ── 데모 데이터 ──
const DEMO_RAW = {
  site_analysis: {
    industry: '물류·창고 산업',
    detailed_process: '지게차 이용 팔레트 적재·하역 작업',
    work_stage: '실내 창고 반입 운반',
    analysis_basis: '지게차, 팔레트 적재물, 작업자 3명 식별',
  },
  risk_assessment_standard: {
    matrix_type: '5x5',
    formula: 'risk_score = probability × severity',
    legal_basis: '산업안전보건법 제36조 (위험성평가 실시)',
  },
  hazards: [
    {
      hazard_name: '지게차-작업자 충돌', hazard_category: '충돌',
      accident_scenario: '작업자가 통로 이동 중 후진하는 지게차를 인지하지 못해 충돌사고 발생',
      direct_cause: '지게차 후방 사각지대, 경보음 미작동',
      expected_injury: '골절, 내부장기 손상, 사망',
      probability: 4, severity: 5, risk_score: 20, risk_level: '즉시조치',
      improvement_measure: '후방감지센서·경보장치 설치, 작업자 이동통로와 지게차 동선 분리',
      ocr: null, bbox: [20, 10, 70, 60],
    },
    {
      hazard_name: '적재물 낙하', hazard_category: '낙하물',
      accident_scenario: '팔레트가 불안정 적재 상태로 이동 중 진동으로 낙하하여 하부 작업자 직격',
      direct_cause: '과적·편하중, 랩핑 미실시',
      expected_injury: '두부 외상, 골절, 사망',
      probability: 3, severity: 5, risk_score: 15, risk_level: '고위험',
      improvement_measure: '적재 높이 포크 백레스트 이하 유지, 스트레치 필름 랩핑 의무화',
      ocr: null, bbox: [15, 30, 55, 70],
    },
    {
      hazard_name: '지게차 전도', hazard_category: '전도',
      accident_scenario: '과적 지게차가 불균일 바닥 주행 중 무게중심 이동으로 전복되어 운전자 압착',
      direct_cause: '최대 하중 초과, 포크 과상승 주행',
      expected_injury: '압착, 골절, 사망',
      probability: 2, severity: 5, risk_score: 10, risk_level: '고위험',
      improvement_measure: '지게차 정격하중 표시판 부착, 주행 시 포크 높이 20~30cm 유지 교육',
      ocr: null, bbox: [30, 20, 80, 65],
    },
    {
      hazard_name: '협착 위험', hazard_category: '협착',
      accident_scenario: '작업자가 팔레트 정리 중 지게차 포크와 팔레트 사이에 손·발이 끼이는 상황',
      direct_cause: '안전거리 미확보, 동시 작업',
      expected_injury: '절단, 골절, 신경손상',
      probability: 3, severity: 4, risk_score: 12, risk_level: '고위험',
      improvement_measure: '지게차 작동 중 2m 이내 접근금지구역 설정, 신호수 배치',
      ocr: null, bbox: [40, 25, 75, 60],
    },
  ],
  overall_risk_summary: {
    highest_risk_item: '지게차-작업자 충돌',
    immediate_action_required: true,
    recommended_action: '작업자 이동통로 즉시 분리, 후방감지기 설치 전까지 신호수 상시 배치',
  },
}

export function useAnalyze() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const analyze = useCallback(async (imageFile) => {
    setLoading(true)
    setError(null)

    // 파일 없으면 데모
    if (!imageFile) {
      await new Promise(r => setTimeout(r, 2000))
      const mapped = mapAllMethods({ outputs: [{ open_ai: DEMO_RAW }] })
      setResult(mapped)
      setLoading(false)
      return mapped
    }

    try {
      const scanResult = await scanImage(imageFile)

      if (!scanResult.success || !scanResult._raw) {
        throw new Error(scanResult.error || 'Roboflow 응답 파싱 실패')
      }

      // scanImage._raw 가 이미 파싱된 analysisData
      // krasMapper는 outputs[0].open_ai 구조를 기대하므로 래핑
      const wrapped = { outputs: [{ open_ai: scanResult._raw }] }
      const mapped = mapAllMethods(wrapped)
      setResult(mapped)
      setLoading(false)
      return mapped

    } catch (err) {
      console.error('분석 오류:', err.message)
      setError(err.message)
      // 폴백 데모
      const mapped = mapAllMethods({ outputs: [{ open_ai: DEMO_RAW }] })
      setResult(mapped)
      setLoading(false)
      return mapped
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setLoading(false)
  }, [])

  return { analyze, loading, result, error, reset }
}