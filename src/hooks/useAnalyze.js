import { useState, useCallback } from 'react'
import { mapKras as mapAllMethods } from '../utils/krasMapper'

const ROBOFLOW_WORKFLOW_URL     = 'https://serverless.roboflow.com/grb/workflows/custom-workflow-3'
const ROBOFLOW_WORKFLOW_URL_TBM = 'https://serverless.roboflow.com/grb/workflows/custom-workflow-3-2'
const ROBOFLOW_API_KEY          = 'P0UYFNweFjm7uZo2nVVG'

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

// ── 기존 위험성평가용 ──
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

// ── TBM용 (workname, descript 포함) ──
async function scanImageTbm(imageBlob, workname = '', descript = '') {
  const base64 = await blobToPureBase64(imageBlob)

  // 프롬프트를 JS에서 조립해서 통째로 전달 ($inputs.prompt)
  const prompt = `OUTPUT ONLY VALID JSON. No markdown, no explanation, no code blocks. Start with { and end with }.\n\n[언어 규칙 — 반드시 준수]\n- 출력 JSON의 모든 값(문장)은 100% 한국어로 작성하십시오.\n- 영어 단어/약어/로마자(예: PPE, harness, lanyard, OK, check 등) 사용 금지.\n- 숫자/단위(mm, m 등)는 예외적으로 허용.\n\n[INPUTS]\nworkName = $inputs.workname\ndescript = $inputs.descript\n\n[중요]\n- 출력에 \"$inputs\" 문자열이 단 1글자라도 포함되면 실패입니다.\n- work_name은 위 workName의 실제 텍스트를 그대로 복사하십시오.\n- description은 위 descript의 실제 텍스트를 그대로 복사하십시오.\n\n당신은 대한민국 건설 현장에서 20년 이상 근무한 현장소장입니다.\n이미지와 입력값(workName, descript)을 분석하여 오늘 작업 전 반장이 실제로 점검해야 할 TBM 질문만 작성하십시오.\n\n[핵심 원칙]\n- checkpoint_question만 출력(다른 필드 추가 금지)\n- workName/descript를 1차 기준으로 사용\n- 이미지는 보강 근거로만 사용\n- 이미지/입력에 근거 없는 장비·공정 항목을 임의로 만들지 말 것\n\n[작성 규칙]\n- 항목 수: 최소 12개 이상 18개 이하\n- 각 질문은 예/아니오로 답할 수 있어야 함\n- 질문은 '사고가 나는 순간'을 포함해야 함(이동 순간, 체결점 변경 순간, 공구 교환 순간, 상하 동시작업 순간 등)\n- 단순 \"안전대 착용했는가\" 같은 일반 질문 금지\n- 추상어(\"주의\", \"철저히\") 금지\n- 서로 다른 위험 포인트로 구성(중복 금지)\n\n[출력 JSON 형식]\n{\n  \"tbm_info\": {\n    \"work_name\": \"\",\n    \"description\": \"\",\n    \"analysis_basis\": \"\"\n  },\n  \"tbm_checklist\": [\n    {\n      \"id\": 1,\n      \"checkpoint_question\": \"\"\n    }\n  ]\n}\n\n[tbm_info 작성 규칙]\n- work_name: 위 INPUTS의 workName 그대로 복사\n- description: 위 INPUTS의 descript 그대로 복사\n- analysis_basis: 이미지 기반으로 확인된 요소 + descript 기반 작업 흐름을 결합해 1~2문장(한국어)\n`

  console.log('========================================')
  console.log('📋 TBM 분석 시작')
  console.log('========================================')
  console.log(`workname: ${workname}`)
  console.log(`descript: ${descript}`)

  const res = await fetch(ROBOFLOW_WORKFLOW_URL_TBM, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: ROBOFLOW_API_KEY,
      inputs: {
        image:  { type: 'base64', value: base64 },
        prompt,   // ✅ 프롬프트 통째로 전달
      },
    }),
  })

  console.log('🌐 Roboflow TBM HTTP Status:', res.status)
  const rawText = await res.text()
  console.log('🌐 Roboflow TBM 응답 원문:', rawText)

  if (!res.ok) {
    throw new Error(`Roboflow HTTP ${res.status}: ${rawText}`)
  }

  const result = JSON.parse(rawText)
  const rawOutput = result?.outputs?.[0]?.open_ai?.output

  if (!rawOutput) {
    return { success: false, error: 'TBM AI 응답 본문이 비어있습니다.', _raw: null }
  }

  const analysisData = parseOpenAIJson(rawOutput)
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
  ],
  overall_risk_summary: {
    highest_risk_item: '지게차-작업자 충돌',
    immediate_action_required: true,
    recommended_action: '작업자 이동통로 즉시 분리, 후방감지기 설치 전까지 신호수 상시 배치',
  },
}

const DEMO_TBM_RAW = {
  tbm_info: {
    work_name: '데모 작업',
    description: '데모 세부공정',
    industry_specific: '건설현장 데모',
    work_stage: '설치',
    analysis_basis: '데모 데이터',
  },
  tbm_checklist: [
    {
      id: 1,
      question: '작업 전 발판 고정 상태를 확인했습니까?',
      related_hazard: '작업자가 발판 위에서 이동하는 과정에서 고정 불량으로 인해 추락사고 발생',
      risk_category: '추락',
      risk_reduction_measure: '발판 고정핀 체결 여부 육안 확인 후 서명, 산업안전보건기준에 관한 규칙 등 관련 기준 준수',
      action_if_not_ok: '즉시 작업중지, 발판 재고정 후 재확인',
    },
  ],
  tbm_summary: {
    key_focus_point: '발판 고정 및 추락 방지',
    required_control_level: '상',
    stop_work_condition: '발판 고정 불량 확인 시 즉시 작업중지',
  },
}

export function useAnalyze() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // ── 기존 위험성평가 분석 ──
  const analyze = useCallback(async (imageFile) => {
    setLoading(true)
    setError(null)

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

      const wrapped = { outputs: [{ open_ai: scanResult._raw }] }
      const mapped = mapAllMethods(wrapped)
      setResult(mapped)
      setLoading(false)
      return mapped

    } catch (err) {
      console.error('분석 오류:', err.message)
      setError(err.message)
      const mapped = mapAllMethods({ outputs: [{ open_ai: DEMO_RAW }] })
      setResult(mapped)
      setLoading(false)
      return mapped
    }
  }, [])

  // ── TBM 분석 (workname, descript 포함) ──
  const analyze2 = useCallback(async (imageFile, workname = '', descript = '') => {
    setLoading(true)
    setError(null)

    if (!imageFile) {
      await new Promise(r => setTimeout(r, 2000))
      setResult(DEMO_TBM_RAW)
      setLoading(false)
      return DEMO_TBM_RAW
    }

    try {
      const scanResult = await scanImageTbm(imageFile, workname, descript)

      if (!scanResult.success || !scanResult._raw) {
        throw new Error(scanResult.error || 'TBM Roboflow 응답 파싱 실패')
      }

      setResult(scanResult._raw)
      setLoading(false)
      return scanResult._raw

    } catch (err) {
      console.error('TBM 분석 오류:', err.message)
      setError(err.message)
      setResult(DEMO_TBM_RAW)
      setLoading(false)
      return DEMO_TBM_RAW
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setLoading(false)
  }, [])

  return { analyze, analyze2, loading, result, error, reset }
}