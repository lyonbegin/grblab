import { useState, useCallback } from 'react'
import { mapKras as mapAllMethods } from '../utils/krasMapper'

const ROBOFLOW_WORKFLOW_URL       = 'https://serverless.roboflow.com/grb/workflows/custom-workflow-3'
const ROBOFLOW_WORKFLOW_URL_TBM   = 'https://serverless.roboflow.com/grb/workflows/custom-workflow-3-2'
const ROBOFLOW_WORKFLOW_URL_URINE = 'https://serverless.roboflow.com/grb/workflows/custom-workflow-urine-2'
const ROBOFLOW_API_KEY            = 'P0UYFNweFjm7uZo2nVVG'

function parseOpenAIJson(rawOutput) {
  if (!rawOutput) return null
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

// ── 1. 기존 위험성평가용 ──
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

// ── 2. TBM용 (workname, descript 포함) ──
async function scanImageTbm(imageBlob, workname = '', descript = '') {
  const base64 = await blobToPureBase64(imageBlob)

  console.log('========================================')
  console.log('📋 TBM 분석 시작')
  console.log('========================================')

  const workInfo = `작업명은 ${workname}이고, 세부공정은 ${descript}입니다.`
  const jsonTemplate = `{\n  "tbm_info": {\n    "work_name": "${workname}",\n    "description": "${descript}",\n    "analysis_basis": ""\n  },\n  "tbm_checklist": [\n    {\n      "id": 1,\n      "checkpoint_question": ""\n    }\n  ]\n}`

  const prompt = `OUTPUT ONLY VALID JSON. No markdown, no explanation, no code blocks. Start with { and end with }.

[언어 규칙 — 반드시 준수]
- 출력 JSON의 모든 값(문장)은 100% 한국어로 작성하십시오.
- 영어 단어/약어/로마자(예: PPE, harness, lanyard, OK, check 등) 사용 금지.
- 숫자/단위(mm, m 등)는 예외적으로 허용.

${workInfo}

당신은 대한민국 건설 현장에서 20년 이상 근무한 현장소장입니다.
제공된 이미지를 분석의 50% 이상 반영하여 TBM 질문을 작성하십시오.
이미지에서 확인되는 장비, 작업환경, 위험요소를 최우선으로 분석하십시오.
이미지와 작업내용이 상충할 경우 이미지를 우선하고 작업내용은 보조 참고로만 사용하십시오.

[핵심 원칙]
- checkpoint_question만 출력(다른 필드 추가 금지)
- 이미지에서 직접 확인된 요소를 질문의 주된 근거로 사용
- 이미지에 없는 장비·공정은 작업내용 기준으로만 보완

[작성 규칙]
- 항목 수: 최소 12개 이상 18개 이하
- 각 질문은 예/아니오로 답할 수 있어야 함
- 질문은 '사고가 나는 순간'을 포함해야 함(이동 순간, 체결점 변경 순간, 공구 교환 순간, 상하 동시작업 순간 등)
- 단순 "안전대 착용했는가" 같은 일반 질문 금지
- 추상어 ("주의", "철저히") 금지
- 서로 다른 위험 포인트로 구성(중복 금지)

[출력 JSON 형식]
${jsonTemplate}

[tbm_info 작성 규칙]
- work_name: ${workname} 그대로
- description: ${descript} 그대로
- analysis_basis: 이미지에서 확인된 실제 요소를 중심으로 1~2문장(한국어)`

  const res = await fetch(ROBOFLOW_WORKFLOW_URL_TBM, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: ROBOFLOW_API_KEY,
      inputs: {
        image: { type: 'base64', value: base64 },
        prompt,
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

// ── 3. 소변 분석용 (Urine) ──
async function scanImageUrine(imageBlob) {
  const base64 = await blobToPureBase64(imageBlob)

  console.log('========================================')
  console.log('🧪 소변 검사지 분석 시작')
  console.log('========================================')

  const res = await fetch(ROBOFLOW_WORKFLOW_URL_URINE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: ROBOFLOW_API_KEY,
      inputs: {
        image: { type: 'base64', value: base64 },
      },
    }),
  })

  console.log('🌐 Roboflow Urine HTTP Status:', res.status)
  const rawText = await res.text()
  console.log('🌐 Roboflow Urine 응답 원문:', rawText)

  if (!res.ok) {
    throw new Error(`Roboflow HTTP ${res.status}: ${rawText}`)
  }

  const result = JSON.parse(rawText)
  
  // 다양한 응답 노드 트리 대응 탐색
  let targetNode = null
  if (Array.isArray(result)) {
    targetNode = result[0]
  } else if (Array.isArray(result?.outputs)) {
    targetNode = result.outputs[0]
  } else if (result?.outputs?.[0]?.open_ai?.output) {
    const nested = parseOpenAIJson(result.outputs[0].open_ai.output)
    targetNode = Array.isArray(nested) ? nested[0] : nested
  } else {
    // 가장 유연한 내부 키 스캔 백업
    const lookup = result?.outputs?.[0] || result
    if (lookup) {
      for (const key in lookup) {
        if (lookup[key]?.step1_raw_result || lookup[key]?.output?.[0]?.step1_raw_result) {
          targetNode = lookup[key]?.output?.[0] || lookup[key]
          break
        }
      }
    }
  }

  if (!targetNode && result?.step1_raw_result) {
    targetNode = result
  }

  const step1Raw = targetNode?.step1_raw_result
  const step2Raw = targetNode?.step2_prescription_result

  if (!step1Raw && !step2Raw) {
    return { success: false, error: '소변 분석 응답 필드를 찾을 수 없습니다.', _raw: null }
  }

  // 내부 마크다운 이중 JSON 파싱 자동화
  const parsedStep1 = parseOpenAIJson(step1Raw)
  const parsedStep2 = parseOpenAIJson(step2Raw)

  return {
    success: true,
    _raw: {
      step1_result: parsedStep1,
      step2_result: parsedStep2
    }
  }
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
      checkpoint_question: '업로드한 이미지가 실제 작업 현장 사진입니까?',
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

const DEMO_URINE_RAW = {
  step1_result: {
    "분석결과": [
      { "항목명": "Blood", "순위": 1, "영양물질": ["철분", "엽산", "메틸코발라민", "아스코르브산", "피리독신"] },
      { "항목명": "Protein", "순위": 2, "영양물질": ["코엔자임큐텐", "알파리포산", "셀레늄", "아세틸엘카르니틴", "타우린"] },
      { "항목명": "Leucocytes", "순위": 3, "영양물질": ["아연", "셀레늄", "아스코르브산", "베타글루칸", "프로폴리스"] },
      { "항목명": "Nitrite", "순위": 4, "영양물질": ["프로안토시아니딘", "아스코르브산", "아연", "디만노스", "락토페린"] },
      { "항목명": "Glucose", "순위": 5, "영양물질": ["알파리포산", "크롬", "베르베린", "이노시톨", "바나듐"] },
      { "항목명": "Ketones", "순위": 6, "영양물질": ["티아민", "리보플라빈", "니아신아마이드", "판토텐산", "바이오틴"] },
      { "항목명": "Bilirubin", "순위": 7, "영양물질": ["실리마린", "글루타치온", "아스코르브산", "알파리포산", "셀레늄"] },
      { "항목명": "Urobilinogen", "순위": 8, "영양물질": ["실리마린", "베타인", "콜린", "메티오닌", "타우린"] },
      { "항목명": "pH", "순위": 9, "영양물질": ["구연산칼륨", "탄산수소나트륨", "구연산마그네슘", "인산칼슘", "젖산칼슘"] },
      { "항목명": "S.G", "순위": 10, "영양물질": ["염화나트륨", "염화칼륨", "구연산마그네슘", "인산나트륨", "황산칼륨"] }
    ]
  },
  step2_result: {
    "longevity_mechanisms": [
      { "mechanism": "유전체 불안정성", "related_urine_item": "8-하이드록시-2-디옥시구아노신", "primary_nutrients": ["니코틴아미드 모노뉴클레오타이드", "익절-3-갈레이트 에피갈로카테킨", "프테로스틸벤", "아연 피콜리네이트", "셀레노메티오닌"] },
      { "mechanism": "텔로미어 마모", "related_urine_item": "산화 스트레스 지표", "primary_nutrients": ["아스타잔틴", "타우린", "엽산 활성형", "메틸코발라민", "베타인 무수물"] },
      { "mechanism": "후성유전 변형", "related_urine_item": "메틸화 대사산물", "primary_nutrients": ["에스-아데노실메티오닌", "트리메틸글리신", "피리독살-5-인산", "메틸테트라하이드로엽산", "콜린 비타르트레이트"] },
      { "mechanism": "단백질 항상성 상실", "related_urine_item": "미오글로빈", "primary_nutrients": ["류신 펩타이드", "글리신", "엔-아세틸시스테인", "타우린", "알파-리포산"] },
      { "mechanism": "영양소 감지 이상", "related_urine_item": "요당", "primary_nutrients": ["베르베린 염산염", "크롬 피콜리네이트", "알파-리포산", "시나몬 추출 폴리페놀", "이노시톨"] },
      { "mechanism": "미토콘드리아 기능 부전", "related_urine_item": "케톤체", "primary_nutrients": ["우비퀴놀", "피롤로퀴놀린퀴نون", "엘-카르니틴 타르트레이트", "니코틴아미드 리보사이드", "디-리보스"] },
      { "mechanism": "세포 노화", "related_urine_item": "크레아티닌", "primary_nutrients": ["피세틴", "쿼세틴 디하이드레이트", "레스베라트롤 트랜스형", "스페르미딘", "아피제닌"] },
      { "mechanism": "줄기세포 고갈", "related_urine_item": "요산", "primary_nutrients": ["알파-케토글루타르산 칼슘", "콜라겐 펩타이드 타입1", "히알루론산 나트륨", "비타민 디3 콜레칼시페롤", "비타민 케이2 메나퀴논7"] },
      { "mechanism": "세포 간 신호전달 변형", "related_urine_item": "알부민", "primary_nutrients": ["오메가3 인지질형", "감마-리놀렌산", "팔미토일에탄올아마이드", "마그네슘 글리시네이트", "아연-구리 복합체"] },
      { "mechanism": "거대자가포식 저하", "related_urine_item": "단백질", "primary_nutrients": ["스페르미딘 삼염산염", "레스베라트롤 미분화", "설포라판 글루코시놀레이트", "올레산 에탄올아마이드", "우롤리틴에이"] },
      { "mechanism": "만성 염증", "related_urine_item": "백혈구", "primary_nutrients": ["커큐민 피토솜", "보스웰리아 산 복합체", "오메가3 에틸에스터", "쿼세틴 피토솜", "징크 카르노신"] },
      { "mechanism": "장내 미생물 불균형", "related_urine_item": "pH", "primary_nutrients": ["락토바실러스 람노서스", "비피도박테리움 롱검", "이눌린 프락토올리고당", "아카시아 검 식이섬유", "낙산 부티르산"] }
    ]
  }
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

  // ── 3. 소변 분석 (analyze3) 추가 ──
  const analyze3 = useCallback(async (imageFile) => {
    setLoading(true)
    setError(null)

    if (!imageFile) {
      await new Promise(r => setTimeout(r, 2000))
      setResult(DEMO_URINE_RAW)
      setLoading(false)
      return DEMO_URINE_RAW
    }

    try {
      const scanResult = await scanImageUrine(imageFile)

      if (!scanResult.success || !scanResult._raw) {
        throw new Error(scanResult.error || '소변 검사 워크플로우 분석 실패')
      }

      setResult(scanResult._raw)
      setLoading(false)
      return scanResult._raw

    } catch (err) {
      console.error('소변 분석 오류:', err.message)
      setError(err.message)
      setResult(DEMO_URINE_RAW)
      setLoading(false)
      return DEMO_URINE_RAW
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setLoading(false)
  }, [])

  return { analyze, analyze2, analyze3, loading, result, error, reset }
}