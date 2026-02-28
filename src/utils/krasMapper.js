// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// krasMapper.js  — 빈도×강도법 단일 모드
//
// ResultPage 요구 구조:
//   result.summary       { processName, workContent, equipment, basis }
//   result.hazards       [{ name, category }]
//   result.overallLevel  { label, immediateAction, topHazard, score }
//   result.raw           원본 parsed 객체
//
// MethodCarousel 요구 구조:
//   result.frequencySeverity / checklist / coreFactors / threeLevel / health
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function extractParsed(roboData) {
  const parsed = roboData?.outputs?.[0]?.open_ai
  if (!parsed) throw new Error('open_ai 필드를 찾을 수 없습니다.')

  const obj = typeof parsed === 'string' ? JSON.parse(parsed) : parsed
  const hazards = obj?.hazards

  if (!Array.isArray(hazards) || hazards.length === 0) {
    throw new Error('hazards 배열이 비어 있거나 존재하지 않습니다.')
  }

  return { hazards, parsed: obj }
}

// ── ResultPage: summary 필드 ──────────────────────
// summary.processName / workContent / equipment / basis
function mapSummary(sa) {
  return {
    processName: sa?.detailed_process ?? '—',
    workContent: sa?.work_stage       ?? '—',
    equipment:   sa?.industry         ?? '—',
    basis:       sa?.analysis_basis   ?? '—',
  }
}

// ── ResultPage: hazards 목록 필드 ─────────────────
// hazards[].name / category
function mapHazardList(hazards) {
  return hazards.map(h => ({
    name:     h.hazard_name,
    category: h.hazard_category,
  }))
}

// ── ResultPage: overallLevel 필드 ─────────────────
// overallLevel.label / immediateAction / topHazard / score
function mapOverallLevel(summary, hazards) {
  // 최고 risk_score 기준 위험등급 라벨 결정
  const maxScore = Math.max(...hazards.map(h => h.risk_score ?? 0))
  const label =
    maxScore >= 17 ? '즉시조치' :
    maxScore >= 10 ? '고위험'   :
    maxScore >= 5  ? '중위험'   : '저위험'

  return {
    label,
    immediateAction: summary?.immediate_action_required ?? false,
    topHazard:       summary?.highest_risk_item         ?? '—',
    score:           summary?.highest_risk_score        ?? maxScore,
  }
}

// ── FrequencySeverityCard ─────────────────────────
function mapFrequencySeverity(hazards) {
  return hazards.map(h => ({
    factor:      h.hazard_name,
    category:    h.hazard_category,
    probability: h.probability ?? 0,
    severity:    h.severity    ?? 0,
    score:       h.risk_score  ?? 0,
    level:       h.risk_level  ?? '—',
  }))
}

// ── CoreFactorsCard ───────────────────────────────
function mapCoreFactors(hazards) {
  return hazards.map(h => ({
    factor:             h.hazard_name,
    riskLevel:          h.risk_level          ?? '—',
    scenario:           h.accident_scenario,
    directCause:        h.direct_cause,
    expectedInjury:     h.expected_injury,
    improvementMeasure: h.improvement_measure ?? '—',
  }))
}

// ── ChecklistCard ─────────────────────────────────
function mapChecklist(hazards) {
  return hazards.map(h => ({
    factor:      h.hazard_name,
    category:    h.hazard_category,
    directCause: h.direct_cause,
    judgment:    h.risk_level  ?? '—',
  }))
}

// ── ThreeLevelCard ────────────────────────────────
function toThreeLevel(riskLevel) {
  switch (riskLevel) {
    case '즉시조치': return '허용불가능'
    case '고위험':   return '허용불가능'
    case '중위험':   return '개선필요'
    case '저위험':   return '허용가능'
    default:         return '개선필요'
  }
}

function mapThreeLevel(hazards) {
  return hazards.map(h => ({
    factor:   h.hazard_name,
    judgment: toThreeLevel(h.risk_level),
    measure:  h.improvement_measure ?? '—',
  }))
}

// ── HealthCard ────────────────────────────────────
function mapHealth() {
  return {
    applicable: false,
    summary:    '현재 빈도×강도법 평가 모드에서는 건강장해 분석이 포함되지 않습니다.',
    items:      [],
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 메인 export
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function mapKras(roboData) {
  const { hazards, parsed } = extractParsed(roboData)
  const sa = parsed.site_analysis       ?? {}
  const os = parsed.overall_risk_summary ?? {}

  return {
    // ── ResultPage가 사용하는 키 ──
    summary:      mapSummary(sa),
    hazards:      mapHazardList(hazards),
    overallLevel: mapOverallLevel(os, hazards),
    raw:          parsed,                       // raw.overall_risk_summary.recommended_action 등

    // ── MethodCarousel(카드)이 사용하는 키 ──
    frequencySeverity: mapFrequencySeverity(hazards),
    checklist:         mapChecklist(hazards),
    coreFactors:       mapCoreFactors(hazards),
    threeLevel:        mapThreeLevel(hazards),
    health:            mapHealth(),
    overallSummary:    os,
  }
}

// useAnalyze.js 호환용 별칭
export const mapAllMethods = mapKras