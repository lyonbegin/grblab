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
  // const prompt = `OUTPUT ONLY VALID JSON. No markdown, no explanation, no code blocks. Start with { and end with }.\n\n[언어 규칙 — 반드시 준수]\n- 출력 JSON의 모든 값(문장)은 100% 한국어로 작성하십시오.\n- 영어 단어/약어/로마자(예: PPE, harness, lanyard, OK, check 등) 사용 금지.\n- 숫자/단위(mm, m 등)는 예외적으로 허용.\n\n[INPUTS]\nworkName = $inputs.workname\ndescript = $inputs.descript\n\n[중요]\n- 출력에 \"$inputs\" 문자열이 단 1글자라도 포함되면 실패입니다.\n- work_name은 위 workName의 실제 텍스트를 그대로 복사하십시오.\n- description은 위 descript의 실제 텍스트를 그대로 복사하십시오.\n\n당신은 대한민국 건설 현장에서 20년 이상 근무한 현장소장입니다.\n이미지와 입력값(workName, descript)을 분석하여 오늘 작업 전 반장이 실제로 점검해야 할 TBM 질문만 작성하십시오.\n\n[핵심 원칙]\n- checkpoint_question만 출력(다른 필드 추가 금지)\n- workName/descript를 1차 기준으로 사용\n- 이미지는 보강 근거로만 사용\n- 이미지/입력에 근거 없는 장비·공정 항목을 임의로 만들지 말 것\n\n[작성 규칙]\n- 항목 수: 최소 12개 이상 18개 이하\n- 각 질문은 예/아니오로 답할 수 있어야 함\n- 질문은 '사고가 나는 순간'을 포함해야 함(이동 순간, 체결점 변경 순간, 공구 교환 순간, 상하 동시작업 순간 등)\n- 단순 \"안전대 착용했는가\" 같은 일반 질문 금지\n- 추상어(\"주의\", \"철저히\") 금지\n- 서로 다른 위험 포인트로 구성(중복 금지)\n\n[출력 JSON 형식]\n{\n  \"tbm_info\": {\n    \"work_name\": \"\",\n    \"description\": \"\",\n    \"analysis_basis\": \"\"\n  },\n  \"tbm_checklist\": [\n    {\n      \"id\": 1,\n      \"checkpoint_question\": \"\"\n    }\n  ]\n}\n\n[tbm_info 작성 규칙]\n- work_name: 위 INPUTS의 workName 그대로 복사\n- description: 위 INPUTS의 descript 그대로 복사\n- analysis_basis: 이미지 기반으로 확인된 요소 + descript 기반 작업 흐름을 결합해 1~2문장(한국어)\n`

  console.log('========================================')
  console.log('📋 TBM 분석 시작')
  console.log('========================================')
const workInfo = '작업명은 ' + workname + '이고, 세부공정은 ' + descript + '입니다.'
const jsonTemplate = '{\n  "tbm_info": {\n    "work_name": "' + workname + '",\n    "description": "' + descript + '",\n    "analysis_basis": ""\n  },\n  "tbm_checklist": [\n    {\n      "id": 1,\n      "checkpoint_question": ""\n    }\n  ]\n}'

const prompt = 'OUTPUT ONLY VALID JSON. No markdown, no explanation, no code blocks. Start with { and end with }.\n\n[언어 규칙 — 반드시 준수]\n- 출력 JSON의 모든 값(문장)은 100% 한국어로 작성하십시오.\n- 영어 단어/약어/로마자(예: PPE, harness, lanyard, OK, check 등) 사용 금지.\n- 숫자/단위(mm, m 등)는 예외적으로 허용.\n\n' + workInfo + '\n\n당신은 대한민국 건설 현장에서 20년 이상 근무한 현장소장입니다.\n제공된 이미지를 분석의 50% 이상 반영하여 TBM 질문을 작성하십시오.\n이미지에서 확인되는 장비, 작업환경, 위험요소를 최우선으로 분석하십시오.\n이미지와 작업내용이 상충할 경우 이미지를 우선하고 작업내용은 보조 참고로만 사용하십시오.\n\n[핵심 원칙]\n- checkpoint_question만 출력(다른 필드 추가 금지)\n- 이미지에서 직접 확인된 요소를 질문의 주된 근거로 사용\n- 이미지에 없는 장비·공정은 작업내용 기준으로만 보완\n\n[작성 규칙]\n- 항목 수: 최소 12개 이상 18개 이하\n- 각 질문은 예/아니오로 답할 수 있어야 함\n- 질문은 \'사고가 나는 순간\'을 포함해야 함(이동 순간, 체결점 변경 순간, 공구 교환 순간, 상하 동시작업 순간 등)\n- 단순 \"안전대 착용했는가\" 같은 일반 질문 금지\n- 추상어(\"주의\", \"철저히\") 금지\n- 서로 다른 위험 포인트로 구성(중복 금지)\n\n[출력 JSON 형식]\n' + jsonTemplate + '\n\n[tbm_info 작성 규칙]\n- work_name: ' + workname + ' 그대로\n- description: ' + descript + ' 그대로\n- analysis_basis: 이미지에서 확인된 실제 요소를 중심으로 1~2문장(한국어)'


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
    industry: '분석 불가',
    detailed_process: '작업 현장 이미지가 아니거나 식별이 불가능한 이미지입니다',
    work_stage: '확인 불가',
    analysis_basis: '현장 작업 이미지가 아님 · 이미지 품질 불량 · 촬영 각도 부적합 등의 이유로 위험요소를 식별할 수 없습니다',
  },
  risk_assessment_standard: {
    matrix_type: '5x5',
    formula: 'risk_score = probability × severity',
    legal_basis: '산업안전보건법 제36조 (위험성평가 실시)',
  },
  hazards: [
    {
      hazard_name: '위험요소 식별 불가',
      hazard_category: '확인불가',
      accident_scenario: '업로드된 이미지가 작업 현장 사진이 아니거나, 흐릿하거나, 너무 어둡거나, 현장이 제대로 보이지 않아 위험성평가를 진행할 수 없습니다.',
      direct_cause: '부적합한 이미지 업로드 (작업현장 외 이미지 · 저화질 · 역광 · 과도한 근접 촬영 등)',
      expected_injury: '확인불가',
      probability: 0, severity: 0, risk_score: 0, risk_level: '분석불가',
      improvement_measure: '✔ 실제 작업 현장을 촬영한 이미지를 사용해 주세요\n✔ 작업자·장비·작업환경이 모두 보이도록 촬영해 주세요\n✔ 밝고 선명하게, 정면 또는 전체 앵글로 촬영해 주세요',
      ocr: null, bbox: [],
    },
  ],
  overall_risk_summary: {
    highest_risk_item: '분석불가',
    immediate_action_required: false,
    recommended_action: '작업 현장을 직접 촬영한 선명한 이미지를 다시 업로드해 주세요. 음식·사람 셀피·실내 인테리어 등 현장과 무관한 이미지는 분석되지 않습니다.',
  },
}

const DEMO_TBM_RAW = {
  tbm_info: {
    work_name: '분석 불가',
    description: '작업 현장 이미지가 아니거나 식별이 불가능한 이미지입니다',
    industry_specific: '확인불가',
    work_stage: '확인불가',
    analysis_basis: '현장 작업 이미지가 아님 · 이미지 품질 불량 · 촬영 각도 부적합 등의 이유로 분석이 불가능합니다',
  },
  tbm_checklist: [
    {
      id: 1,
      question: '업로드한 이미지가 실제 작업 현장 사진입니까?',
      related_hazard: '작업 현장이 아닌 이미지 또는 식별 불가능한 이미지로 인해 실제 위험요소를 파악할 수 없습니다. 잘못된 분석 결과는 현장 안전에 오히려 해가 될 수 있습니다.',
      risk_category: '분석불가',
      risk_reduction_measure: '✔ 실제 작업 현장을 촬영한 이미지를 사용해 주세요\n✔ 작업자·장비·작업환경이 모두 보이도록 촬영해 주세요\n✔ 밝고 선명하게, 정면 또는 전체 앵글로 촬영해 주세요',
      action_if_not_ok: '현장 사진으로 교체 후 다시 분석해 주세요. 음식·셀피·실내 인테리어 등 현장과 무관한 이미지는 분석되지 않습니다.',
    },
  ],
  tbm_summary: {
    key_focus_point: '적합한 현장 이미지 업로드 필요',
    required_control_level: '확인불가',
    stop_work_condition: '부적합한 이미지로는 TBM을 진행할 수 없습니다. 실제 작업 현장을 촬영한 선명한 이미지를 업로드해 주세요.',
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