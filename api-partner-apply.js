/**
 * 병원동행 파트너 신청 API
 * - NAVER SENS LMS 발송
 * - Google Sheet 저장
 * - Railway에서 이 파일 하나만 실행
 */
const http = require("node:http");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

const PORT = Number(process.env.PARTNER_API_PORT || 3001);

const NCP_ACCESS_KEY = process.env.NCP_ACCESS_KEY || "";
const NCP_SECRET_KEY = process.env.NCP_SECRET_KEY || "";
const NCP_SENS_SERVICE_ID = process.env.NCP_SENS_SERVICE_ID || "";
const NCP_SENS_FROM = String(process.env.NCP_SENS_FROM || "").replace(/\D/g, "");

const PARTNER_GSHEET_URL =
  process.env.PARTNER_GSHEET_URL ||
  "https://script.google.com/macros/s/AKfycbwypBqdKEw02OW06x4StD-BRNQJ7T9WcZSsWFHyT4KMD12hkPJBFbQz5JNVU5JIhkNd/exec";

const PARTNER_DEBUG = String(process.env.PARTNER_DEBUG || "") === "1";

function maskPhone(phone) {
  const p = cleanPhone(phone);
  if (p.length < 7) return "***";
  return `${p.slice(0, 3)}****${p.slice(-4)}`;
}

function makeDebugId() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

console.log("[PARTNER API START]", {
  port: PORT,
  ncpAccessKeyConfigured: Boolean(NCP_ACCESS_KEY),
  ncpSecretKeyConfigured: Boolean(NCP_SECRET_KEY),
  ncpSensServiceIdConfigured: Boolean(NCP_SENS_SERVICE_ID),
  ncpSensFromConfigured: Boolean(NCP_SENS_FROM),
  ncpSensFrom: NCP_SENS_FROM ? maskPhone(NCP_SENS_FROM) : "",
  googleSheetConfigured: Boolean(PARTNER_GSHEET_URL),
  debugMode: PARTNER_DEBUG,
});

function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

function cleanPhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function validMobile(phone) {
  return /^01[016789]\d{7,8}$/.test(phone);
}

function validText(value, max = 100) {
  const text = String(value || "").trim();
  return text.length > 0 && text.length <= max;
}

function makeApplicationNo() {
  const time = String(Date.now()).slice(-6);
  const random = String(crypto.randomInt(0, 100)).padStart(2, "0");
  return `NE-0929-${time}${random}`;
}

function makeSensSignature(method, uri, timestamp) {
  if (!NCP_ACCESS_KEY || !NCP_SECRET_KEY || !NCP_SENS_SERVICE_ID) {
    throw new Error(
      "NCP_ACCESS_KEY / NCP_SECRET_KEY / NCP_SENS_SERVICE_ID 환경변수를 확인해주세요."
    );
  }

  const message = `${method} ${uri}\n${timestamp}\n${NCP_ACCESS_KEY}`;

  return crypto
    .createHmac("sha256", NCP_SECRET_KEY)
    .update(message)
    .digest("base64");
}

function buildMessage({
  applicantName,
  regions,
  priorityApartment,
  applicationNo,
}) {
  const regionText = regions
    .map((r) => String(r.neighborhood || "").trim())
    .join(" / ");

  return `[나눔이음의료복지사회적협동조합]
${applicantName}님의 병원동행 파트너 신청이 접수되었습니다.

활동지역
${regionText}

우선권 전담단지
${priorityApartment.name}

신청번호
${applicationNo}

병원동행 파트너 가입 안내
9월 29일 오후 1시 30분 · 부산시민회관

병원동행 파트너 가입과 활동 안내를 진행합니다.

준비물
신분증 · 운전면허증 · 보유 우대 자격증(해당자)`;
}

async function sendSensLms({ to, text, debugId }) {
  if (!NCP_SENS_FROM) {
    const error = new Error("NCP_SENS_FROM 환경변수가 없습니다.");
    error.code = "ENV_FROM_MISSING";
    throw error;
  }

  const method = "POST";
  const uri = `/sms/v2/services/${NCP_SENS_SERVICE_ID}/messages`;
  const timestamp = String(Date.now());
  const signature = makeSensSignature(method, uri, timestamp);

  const requestStartedAt = Date.now();

  console.log("[NAVER SENS SEND START]", {
    debugId,
    to: maskPhone(to),
    from: maskPhone(NCP_SENS_FROM),
    textLength: text.length,
  });

  let response;
  let data = {};

  try {
    response = await fetch(`https://sens.apigw.ntruss.com${uri}`, {
      method,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "x-ncp-apigw-timestamp": timestamp,
        "x-ncp-iam-access-key": NCP_ACCESS_KEY,
        "x-ncp-apigw-signature-v2": signature,
      },
      body: JSON.stringify({
        type: "LMS",
        contentType: "COMM",
        countryCode: "82",
        from: NCP_SENS_FROM,
        subject: "병원동행 파트너 신청 확인",
        content: text,
        messages: [{ to }],
      }),
    });

    data = await response.json().catch(() => ({}));
  } catch (networkError) {
    console.error("[NAVER SENS NETWORK ERROR]", {
      debugId,
      message: networkError?.message || String(networkError),
      elapsedMs: Date.now() - requestStartedAt,
    });

    const error = new Error("NAVER SENS 서버 연결에 실패했습니다.");
    error.code = "SENS_NETWORK_ERROR";
    error.causeMessage = networkError?.message || String(networkError);
    throw error;
  }

  console.log("[NAVER SENS RESPONSE]", {
    debugId,
    httpStatus: response.status,
    ok: response.ok,
    elapsedMs: Date.now() - requestStartedAt,
    response: data,
  });

  if (!response.ok) {
    const error = new Error(
      String(
        data?.error?.message ||
        data?.errorMessage ||
        data?.message ||
        data?.statusName ||
        `NAVER SENS HTTP ${response.status}`
      )
    );

    error.code = String(
      data?.error?.errorCode ||
      data?.errorCode ||
      `HTTP_${response.status}`
    );
    error.httpStatus = response.status;
    error.sensResponse = data;
    throw error;
  }

  return data;
}

async function savePartnerToGoogleSheet({
  applicationNo,
  submittedAt,
  applicantName,
  applicantPhone,
  regions,
  priorityApartment,
  smsRequestId,
  debugId,
}) {
  if (!PARTNER_GSHEET_URL) {
    const error = new Error("PARTNER_GSHEET_URL이 설정되지 않았습니다.");
    error.code = "GSHEET_URL_MISSING";
    throw error;
  }

  const region1 = regions[0] || {};
  const region2 = regions[1] || {};
  const region3 = regions[2] || {};

  const params = new URLSearchParams();
  params.set("sheet", "partner");
  params.set("applicationNo", applicationNo);
  params.set("submittedAt", submittedAt);
  params.set("applicantName", applicantName);
  params.set("applicantPhone", applicantPhone);

  params.set("region1District", String(region1.district || ""));
  params.set("region1Neighborhood", String(region1.neighborhood || ""));
  params.set("region2District", String(region2.district || ""));
  params.set("region2Neighborhood", String(region2.neighborhood || ""));
  params.set("region3District", String(region3.district || ""));
  params.set("region3Neighborhood", String(region3.neighborhood || ""));

  params.set(
    "regions",
    [region1, region2, region3]
      .map((r) =>
        `${String(r.district || "").trim()} ${String(r.neighborhood || "").trim()}`.trim()
      )
      .filter(Boolean)
      .join(" / ")
  );

  params.set("priorityApartmentName", String(priorityApartment?.name || ""));
  params.set("priorityDistrict", String(priorityApartment?.district || ""));
  params.set("priorityNeighborhood", String(priorityApartment?.neighborhood || ""));
  params.set(
    "priorityHouseholds",
    String(Number(priorityApartment?.households) || 0)
  );

  params.set("smsRequestId", String(smsRequestId || ""));
  params.set("smsStatus", "발송완료");

  const startedAt = Date.now();

  console.log("[GOOGLE SHEET SAVE START]", {
    debugId,
    applicationNo,
    applicantPhone: maskPhone(applicantPhone),
  });

  let lastError = null;

  // 일시적인 네트워크 오류를 대비해 최대 3번 시도
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(PARTNER_GSHEET_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: params.toString(),
        redirect: "follow",
      });

      const responseText = await response.text().catch(() => "");

      if (!response.ok) {
        const error = new Error(`Google Sheet HTTP ${response.status}`);
        error.code = `GSHEET_HTTP_${response.status}`;
        error.responseText = responseText.slice(0, 500);
        throw error;
      }

      console.log("[GOOGLE SHEET SAVE OK]", {
        debugId,
        applicationNo,
        attempt,
        elapsedMs: Date.now() - startedAt,
      });

      return {
        ok: true,
        responseText,
      };
    } catch (error) {
      lastError = error;

      console.error("[GOOGLE SHEET SAVE RETRY]", {
        debugId,
        applicationNo,
        attempt,
        message: error?.message || String(error),
      });

      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
      }
    }
  }

  const error = new Error(
    lastError?.message || "Google Sheet 저장에 실패했습니다."
  );
  error.code = lastError?.code || "GSHEET_SAVE_FAILED";
  throw error;
}


function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;

      if (size > 100_000) {
        reject(new Error("요청 데이터가 너무 큽니다."));
        req.destroy();
        return;
      }

      body += chunk.toString("utf8");
    });

    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("잘못된 JSON 요청입니다."));
      }
    });

    req.on("error", reject);
  });
}

// 테스트 단계의 간단한 중복 발송 방지.
// Railway가 재시작되면 초기화됩니다.
const phoneHistory = new Map();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_PHONE = 3;

function allowPhone(phone) {
  const now = Date.now();

  const recent = (phoneHistory.get(phone) || []).filter(
    (time) => now - time < RATE_WINDOW_MS
  );

  if (recent.length >= MAX_PER_PHONE) {
    phoneHistory.set(phone, recent);
    return false;
  }

  recent.push(now);
  phoneHistory.set(phone, recent);
  return true;
}

async function handlePartnerApply(req, res) {
  const debugId = makeDebugId();
  const startedAt = Date.now();

  console.log("[PARTNER APPLY RECEIVED]", {
    debugId,
    method: req.method,
    url: req.url,
  });

  let body;

  try {
    body = await readJsonBody(req);
  } catch (error) {
    return json(res, 400, {
      ok: false,
      error: error.message || "요청 내용을 확인해주세요.",
      debugId,
    });
  }

  const applicantName = String(body.applicantName || "").trim();
  const applicantPhone = cleanPhone(body.applicantPhone);
  const regions = Array.isArray(body.regions) ? body.regions : [];

  const priorityApartment =
    body.priorityApartment && typeof body.priorityApartment === "object"
      ? body.priorityApartment
      : {};

  if (!validText(applicantName, 20)) {
    return json(res, 400, {
      ok: false,
      error: "신청자 이름을 확인해주세요.",
    });
  }

  if (!validMobile(applicantPhone)) {
    return json(res, 400, {
      ok: false,
      error: "휴대전화 번호를 확인해주세요.",
    });
  }

  if (
    regions.length !== 3 ||
    regions.some(
      (r) =>
        !validText(r?.district, 30) ||
        !validText(r?.neighborhood, 30)
    )
  ) {
    return json(res, 400, {
      ok: false,
      error: "활동지역 3개 동을 확인해주세요.",
    });
  }

  const uniqueRegions = new Set(
    regions.map(
      (r) =>
        `${String(r.district).trim()}|${String(r.neighborhood).trim()}`
    )
  );

  if (uniqueRegions.size !== 3) {
    return json(res, 400, {
      ok: false,
      error: "서로 다른 활동지역 3개 동을 선택해주세요.",
    });
  }

  if (!validText(priorityApartment?.name, 100)) {
    return json(res, 400, {
      ok: false,
      error: "우선권 단지를 확인해주세요.",
    });
  }

  if (!allowPhone(applicantPhone)) {
    return json(res, 429, {
      ok: false,
      error: "같은 전화번호로 반복 신청할 수 없습니다.",
    });
  }

  console.log("[PARTNER APPLY VALIDATED]", {
    debugId,
    applicantName,
    applicantPhone: maskPhone(applicantPhone),
    regions: regions.map((r) => `${r.district} ${r.neighborhood}`),
    priorityApartment: priorityApartment?.name || "",
  });

  const applicationNo = makeApplicationNo();

  const submittedAt = new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });

  const text = buildMessage({
    applicantName,
    regions,
    priorityApartment: {
      name: String(priorityApartment.name).trim(),
    },
    applicationNo,
  });

  try {
    const result = await sendSensLms({
      to: applicantPhone,
      text,
      debugId,
    });

    const requestId = String(result?.requestId || "");

    let sheetSaved = false;
    let sheetError = "";

    try {
      await savePartnerToGoogleSheet({
        applicationNo,
        submittedAt,
        applicantName,
        applicantPhone,
        regions,
        priorityApartment: {
          name: String(priorityApartment.name || "").trim(),
          district: String(priorityApartment.district || "").trim(),
          neighborhood: String(priorityApartment.neighborhood || "").trim(),
          households: Number(priorityApartment.households) || 0,
        },
        smsRequestId: requestId,
        debugId,
      });

      sheetSaved = true;
    } catch (error) {
      sheetError = error?.message || String(error);

      // 문자는 이미 정상 발송된 상태이므로 중복 문자 발송을 막기 위해
      // 시트 저장 실패만 로그에 남기고 신청 자체는 성공으로 반환한다.
      console.error("[GOOGLE SHEET SAVE FAILED]", {
        debugId,
        applicationNo,
        message: sheetError,
      });
    }

    console.log("[PARTNER APPLY OK]", {
      applicationNo,
      applicantName,
      applicantPhone,
      regions,
      priorityApartment,
      sensRequestId: requestId,
      sheetSaved,
      sheetError,
      debugId,
      elapsedMs: Date.now() - startedAt,
    });

    return json(res, 200, {
      ok: true,
      applicationNo,
      submittedAt,
      smsRequestId: requestId,
      sheetSaved,
      debugId,
    });
  } catch (error) {
    console.error("[PARTNER APPLY FAILED]", {
      debugId,
      code: error?.code || "",
      httpStatus: error?.httpStatus || "",
      message: error?.message || String(error),
      causeMessage: error?.causeMessage || "",
      sensResponse: error?.sensResponse || null,
      elapsedMs: Date.now() - startedAt,
    });

    return json(res, 502, {
      ok: false,
      error: `문자 발송 실패: ${error.message}`,
      debugId,
      ...(PARTNER_DEBUG
        ? {
            detail: {
              code: error?.code || "",
              httpStatus: error?.httpStatus || "",
            },
          }
        : {}),
    });
  }
}

// ============================
// 객석심사 / 공연 디스플레이
// ============================
const JUDGE_ADMIN_KEY = String(process.env.JUDGE_ADMIN_KEY || '');
const DATABASE_URL = String(process.env.DATABASE_URL || '');
const JUDGE_EVENT_KEY = String(process.env.JUDGE_EVENT_KEY || '2026-09-29');
const JUDGE_DEFAULT_DURATION_SECONDS = Math.max(
  30,
  Math.min(600, Number(process.env.JUDGE_DEFAULT_DURATION_SECONDS || 180))
);
const JUDGE_ONLINE_WINDOW_MS = 30_000;
const JUDGE_MAX_COMMENT_LENGTH = 40;

const JUDGE_DEFAULT_TEAMS = [
  { id: 1, name: '은가비합창단', start: '14:15', end: '14:25', songs: ['', ''], background: '/judge-backgrounds/team-01.png' },
  { id: 2, name: '완주장애인합창단 ‘꽃’', start: '14:31', end: '14:36', songs: ['좋아좋아'], background: '/judge-backgrounds/team-02.png' },
  { id: 3, name: '대구라온휠합창단', start: '14:42', end: '14:46', songs: ['푸르른 날'], background: '/judge-backgrounds/team-03.png' },
  { id: 4, name: 'KYCU 에바다합창단', start: '14:52', end: '14:58', songs: ['친구'], background: '/judge-backgrounds/team-04.png' },
  { id: 5, name: '옥구슬합창단', start: '15:04', end: '15:09', songs: [''], background: '/judge-backgrounds/team-05.png' },
  { id: 6, name: '부산베데스다합창단', start: '15:15', end: '15:20', songs: ['FLY ME TO THE MOON'], background: '/judge-backgrounds/team-06.png' },
  { id: 7, name: '이지글리합창단', start: '15:26', end: '15:33', songs: ['흰수염고래', '오나라'], background: '/judge-backgrounds/team-07.png' },
  { id: 8, name: '부산 단디소리합창단', start: '15:39', end: '15:44', songs: ['그대 있는 곳까지'], background: '/judge-backgrounds/team-08.png' },
  { id: 9, name: '코웨이물빛합창단', start: '15:50', end: '15:55', songs: ['노던 라이츠'], background: '/judge-backgrounds/team-09.png' },
  { id: 10, name: '골프존파스텔합창단', start: '16:01', end: '16:05', songs: ['Dawn and Dusk (Fajar dan Senja)'], background: '/judge-backgrounds/team-10.png' },
  { id: 11, name: '어울림시각장애인합창단', start: '16:12', end: '16:18', songs: ['푸니쿨리 푸니쿨라', '잊혀진 계절 메들리'], background: '/judge-backgrounds/team-11.png' },
];

function newJudgeDb() {
  const now = new Date().toISOString();
  return {
    version: 3,
    createdAt: now,
    updatedAt: now,
    event: {
      displayMode: 'event_intro',
      eventTitle1: '2026 장애인 합창단 초청 음악회',
      eventTitle2: '오늘의 무대가 도쿄로 이어집니다',
      currentTeamId: 1,
      introTeamId: 1,
      teamOrder: JUDGE_DEFAULT_TEAMS.map((team) => team.id),
      phase: 'idle',
      durationSeconds: JUDGE_DEFAULT_DURATION_SECONDS,
      startedAt: null,
      endsAt: null,
      mobileEnabled: true,
      registrationEnabled: true,
      commentInputEnabled: true,
      commentDisplayEnabled: true,
      allowVoteEdit: true,
    },
    teams: JUDGE_DEFAULT_TEAMS,
    judges: [],
    sessions: [],
    votes: [],
    comments: [],
    expertBatches: [],
    audit: [],
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function judgeNowIso() {
  return new Date().toISOString();
}

const judgePool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    })
  : null;

let judgeDb = newJudgeDb();
let judgeDbDirty = false;
let judgeDbFlushPromise = Promise.resolve();
let judgeDatabaseConnected = false;
let judgeDatabaseLastError = '';
let judgeTimer = null;
const judgeDisplayClients = new Set();
const expertTimers = new Map();

async function initJudgeDatabase() {
  if (!judgePool) {
    judgeDatabaseConnected = false;
    judgeDatabaseLastError = 'DATABASE_URL is not configured';
    console.error('[judge-db] DATABASE_URL is not configured; using memory only');
    return;
  }

  try {
    await judgePool.query(`
      CREATE TABLE IF NOT EXISTS grb_judge_store (
        event_key TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // 원자료를 나중에 SQL로 바로 조회할 수 있도록 JSONB 배열을 행으로 펼친 VIEW를 만듭니다.
    await judgePool.query(`
      CREATE OR REPLACE VIEW grb_judge_votes AS
      SELECT
        s.event_key,
        v.value->>'id' AS id,
        NULLIF(v.value->>'teamId','')::INT AS team_id,
        v.value->>'judgeId' AS judge_id,
        v.value->>'judgeType' AS judge_type,
        v.value->>'judgeLabel' AS judge_label,
        NULLIF(v.value->>'score','')::NUMERIC AS score,
        COALESCE(NULLIF(v.value->>'deleted','')::BOOLEAN, FALSE) AS deleted,
        v.value->>'batchId' AS batch_id,
        NULLIF(v.value->>'createdAt','')::TIMESTAMPTZ AS created_at,
        NULLIF(v.value->>'updatedAt','')::TIMESTAMPTZ AS updated_at,
        v.value AS raw
      FROM grb_judge_store s
      CROSS JOIN LATERAL jsonb_array_elements(COALESCE(s.data->'votes', '[]'::jsonb)) AS v(value)
    `);

    await judgePool.query(`
      CREATE OR REPLACE VIEW grb_judge_judges AS
      SELECT
        s.event_key,
        j.value->>'id' AS id,
        j.value->>'phone' AS phone,
        j.value->>'type' AS judge_type,
        COALESCE(NULLIF(j.value->>'allowed','')::BOOLEAN, TRUE) AS allowed,
        NULLIF(j.value->>'registeredAt','')::TIMESTAMPTZ AS registered_at,
        NULLIF(j.value->>'lastSeenAt','')::TIMESTAMPTZ AS last_seen_at,
        j.value AS raw
      FROM grb_judge_store s
      CROSS JOIN LATERAL jsonb_array_elements(COALESCE(s.data->'judges', '[]'::jsonb)) AS j(value)
    `);

    await judgePool.query(`
      CREATE OR REPLACE VIEW grb_judge_comments AS
      SELECT
        s.event_key,
        c.value->>'id' AS id,
        NULLIF(c.value->>'teamId','')::INT AS team_id,
        c.value->>'judgeId' AS judge_id,
        c.value->>'judgeType' AS judge_type,
        c.value->>'text' AS text,
        COALESCE(NULLIF(c.value->>'visible','')::BOOLEAN, TRUE) AS visible,
        COALESCE(NULLIF(c.value->>'deleted','')::BOOLEAN, FALSE) AS deleted,
        NULLIF(c.value->>'createdAt','')::TIMESTAMPTZ AS created_at,
        c.value AS raw
      FROM grb_judge_store s
      CROSS JOIN LATERAL jsonb_array_elements(COALESCE(s.data->'comments', '[]'::jsonb)) AS c(value)
    `);

    await judgePool.query(`
      CREATE OR REPLACE VIEW grb_judge_expert_batches AS
      SELECT
        s.event_key,
        b.value->>'id' AS id,
        NULLIF(b.value->>'teamId','')::INT AS team_id,
        NULLIF(b.value->>'count','')::INT AS count,
        NULLIF(b.value->>'targetScore','')::NUMERIC AS target_score,
        NULLIF(b.value->>'spread','')::NUMERIC AS spread,
        b.value->>'status' AS status,
        NULLIF(b.value->>'createdAt','')::TIMESTAMPTZ AS created_at,
        b.value AS raw
      FROM grb_judge_store s
      CROSS JOIN LATERAL jsonb_array_elements(COALESCE(s.data->'expertBatches', '[]'::jsonb)) AS b(value)
    `);

    await judgePool.query(`
      CREATE OR REPLACE VIEW grb_judge_audit AS
      SELECT
        s.event_key,
        a.value->>'id' AS id,
        NULLIF(a.value->>'at','')::TIMESTAMPTZ AS at,
        a.value->>'action' AS action,
        a.value->'detail' AS detail,
        a.value AS raw
      FROM grb_judge_store s
      CROSS JOIN LATERAL jsonb_array_elements(COALESCE(s.data->'audit', '[]'::jsonb)) AS a(value)
    `);

    const result = await judgePool.query(
      'SELECT data FROM grb_judge_store WHERE event_key = $1',
      [JUDGE_EVENT_KEY]
    );

    if (result.rows.length) {
      judgeDb = normalizeJudgeDb(result.rows[0].data);
      console.log(`[judge-db] loaded PostgreSQL event ${JUDGE_EVENT_KEY}`);
    } else {
      judgeDb = newJudgeDb();
      await judgePool.query(
        `INSERT INTO grb_judge_store(event_key, data, updated_at)
         VALUES ($1, $2::jsonb, NOW())`,
        [JUDGE_EVENT_KEY, JSON.stringify(judgeDb)]
      );
      console.log(`[judge-db] created PostgreSQL event ${JUDGE_EVENT_KEY}`);
    }

    judgeDatabaseConnected = true;
    judgeDatabaseLastError = '';
  } catch (error) {
    judgeDatabaseConnected = false;
    judgeDatabaseLastError = error?.message || String(error);
    console.error('[judge-db] PostgreSQL init failed; using memory only', judgeDatabaseLastError);
  }
}

function markJudgeDirty() {
  judgeDb.updatedAt = judgeNowIso();
  judgeDbDirty = true;
}

function flushJudgeDb() {
  if (!judgeDbDirty || !judgePool) return judgeDbFlushPromise;

  const snapshot = clone(judgeDb);
  judgeDbDirty = false;

  judgeDbFlushPromise = judgeDbFlushPromise.then(async () => {
    try {
      await judgePool.query(
        `INSERT INTO grb_judge_store(event_key, data, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (event_key)
         DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [JUDGE_EVENT_KEY, JSON.stringify(snapshot)]
      );
      judgeDatabaseConnected = true;
      judgeDatabaseLastError = '';
    } catch (error) {
      judgeDbDirty = true;
      judgeDatabaseConnected = false;
      judgeDatabaseLastError = error?.message || String(error);
      console.error('[judge-db] PostgreSQL flush failed', judgeDatabaseLastError);
    }
  });

  return judgeDbFlushPromise;
}

const judgeFlushTimer = setInterval(() => {
  void flushJudgeDb();
}, 3000);
judgeFlushTimer.unref?.();

async function shutdownJudgeDatabase() {
  try {
    await flushJudgeDb();
    await judgeDbFlushPromise;
    await judgePool?.end();
  } catch (error) {
    console.error('[judge-db] shutdown failed', error?.message || error);
  }
}

process.on('SIGTERM', () => { void shutdownJudgeDatabase(); });
process.on('SIGINT', () => { void shutdownJudgeDatabase(); });

function judgeAudit(action, detail = {}) {
  judgeDb.audit.push({
    id: crypto.randomUUID(),
    at: judgeNowIso(),
    action,
    detail,
  });
  if (judgeDb.audit.length > 5000) judgeDb.audit = judgeDb.audit.slice(-5000);
  markJudgeDirty();
}

function judgeTeam(teamId) {
  return judgeDb.teams.find((team) => Number(team.id) === Number(teamId)) || judgeDb.teams[0];
}

function judgeRemainingSeconds() {
  if (judgeDb.event.phase === 'result') return 0;
  if (judgeDb.event.phase !== 'voting' || !judgeDb.event.endsAt) {
    return Math.max(0, Number(judgeDb.event.durationSeconds) || JUDGE_DEFAULT_DURATION_SECONDS);
  }
  return Math.max(0, Math.ceil((new Date(judgeDb.event.endsAt).getTime() - Date.now()) / 1000));
}

function validJudgeVote(vote) {
  return vote && vote.deleted !== true && Number.isFinite(Number(vote.score));
}

function teamVotes(teamId) {
  return judgeDb.votes.filter((vote) => Number(vote.teamId) === Number(teamId) && validJudgeVote(vote));
}

function teamAggregate(teamId) {
  const votes = teamVotes(teamId);
  const participants = votes.length;
  const score = participants
    ? Math.round((votes.reduce((sum, vote) => sum + Number(vote.score), 0) / participants) * 10) / 10
    : 0;
  const audienceCount = votes.filter((vote) => vote.judgeType === 'audience').length;
  const expertCount = votes.filter((vote) => vote.judgeType === 'onsite_expert').length;
  return { participants, score, audienceCount, expertCount };
}

function visibleComments(teamId) {
  if (!judgeDb.event.commentDisplayEnabled) return [];
  return judgeDb.comments
    .filter((comment) => Number(comment.teamId) === Number(teamId) && !comment.deleted && comment.visible !== false)
    .slice(-2)
    .map((comment) => ({ id: comment.id, text: comment.text }));
}

function publicJudgeState() {
  const event = judgeDb.event;
  const current = judgeTeam(event.currentTeamId);
  const introTeam = judgeTeam(event.introTeamId);
  const aggregate = teamAggregate(event.currentTeamId);
  const remainingSeconds = judgeRemainingSeconds();

  return {
    displayMode: event.displayMode,
    eventTitle1: event.eventTitle1,
    eventTitle2: event.eventTitle2,
    currentTeamId: Number(event.currentTeamId),
    introTeamId: Number(event.introTeamId),
    currentTeam: clone(current),
    introTeam: clone(introTeam),
    teamOrder: clone(event.teamOrder),
    phase: event.phase,
    durationSeconds: Number(event.durationSeconds),
    remainingSeconds,
    participants: aggregate.participants,
    audienceCount: aggregate.audienceCount,
    expertCount: aggregate.expertCount,
    // 진행 중에는 외부 상태 API로 중간 평균점수를 내보내지 않습니다.
    score: event.phase === 'result' ? aggregate.score : null,
    comments: visibleComments(event.currentTeamId).map((item) => item.text),
    commentItems: visibleComments(event.currentTeamId),
    mobileEnabled: Boolean(event.mobileEnabled),
    commentInputEnabled: Boolean(event.commentInputEnabled),
    commentDisplayEnabled: Boolean(event.commentDisplayEnabled),
    startedAt: event.startedAt,
    endsAt: event.endsAt,
  };
}

function adminJudgeState() {
  const state = publicJudgeState();
  const aggregate = teamAggregate(judgeDb.event.currentTeamId);
  const now = Date.now();
  const currentTeamId = Number(judgeDb.event.currentTeamId);

  const judges = judgeDb.judges
    .filter((judge) => judge.type === 'audience')
    .map((judge) => {
      const lastSeenMs = judge.lastSeenAt ? new Date(judge.lastSeenAt).getTime() : 0;
      const vote = judgeDb.votes.find(
        (item) => Number(item.teamId) === currentTeamId && item.judgeId === judge.id && !item.deleted
      );
      return {
        id: judge.id,
        phone: judge.phone,
        phoneMasked: maskPhone(judge.phone),
        type: judge.type,
        allowed: judge.allowed !== false,
        online: Boolean(lastSeenMs && now - lastSeenMs <= JUDGE_ONLINE_WINDOW_MS),
        registeredAt: judge.registeredAt,
        lastSeenAt: judge.lastSeenAt,
        lastIp: judge.lastIp || '',
        device: judge.device || '',
        submittedCurrentTeam: Boolean(vote),
        currentScore: vote ? Number(vote.score) : null,
      };
    })
    .sort((a, b) => Number(b.online) - Number(a.online) || String(b.lastSeenAt || '').localeCompare(String(a.lastSeenAt || '')));

  const comments = judgeDb.comments
    .filter((comment) => Number(comment.teamId) === currentTeamId && !comment.deleted)
    .slice()
    .reverse()
    .map((comment) => ({
      ...clone(comment),
      judgeLabel: comment.judgeType === 'audience' ? maskPhone(comment.judgeId) : comment.judgeLabel || comment.judgeId,
    }));

  const expertVotes = judgeDb.votes
    .filter((vote) => Number(vote.teamId) === currentTeamId && vote.judgeType === 'onsite_expert' && !vote.deleted)
    .map((vote) => ({
      id: vote.id,
      judgeId: vote.judgeId,
      label: vote.judgeLabel || vote.judgeId,
      score: Number(vote.score),
      createdAt: vote.createdAt,
      updatedAt: vote.updatedAt,
      batchId: vote.batchId || null,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'ko'));

  const expertBatches = judgeDb.expertBatches
    .filter((batch) => Number(batch.teamId) === currentTeamId)
    .slice()
    .reverse()
    .map((batch) => clone(batch));

  return {
    ...state,
    score: aggregate.score,
    judges,
    registeredAudienceCount: judges.length,
    onlineAudienceCount: judges.filter((judge) => judge.online).length,
    comments,
    expertVotes,
    expertBatches,
    settings: {
      mobileEnabled: Boolean(judgeDb.event.mobileEnabled),
      registrationEnabled: Boolean(judgeDb.event.registrationEnabled),
      commentInputEnabled: Boolean(judgeDb.event.commentInputEnabled),
      commentDisplayEnabled: Boolean(judgeDb.event.commentDisplayEnabled),
      allowVoteEdit: Boolean(judgeDb.event.allowVoteEdit),
    },
    teams: clone(judgeDb.teams),
    database: { backend: 'postgresql', connected: judgeDatabaseConnected, eventKey: JUDGE_EVENT_KEY, lastError: judgeDatabaseLastError },
  };
}

function writeJudgeSse(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function broadcastJudgeState() {
  const payload = { type: 'state', ...publicJudgeState() };
  const dead = [];
  for (const client of judgeDisplayClients) {
    try {
      writeJudgeSse(client, payload);
    } catch {
      dead.push(client);
    }
  }
  dead.forEach((client) => judgeDisplayClients.delete(client));
}

function handleJudgeLive(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': connected\n\n');
  writeJudgeSse(res, { type: 'state', ...publicJudgeState() });
  judgeDisplayClients.add(res);

  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch {}
  }, 15_000);
  heartbeat.unref?.();

  req.on('close', () => {
    clearInterval(heartbeat);
    judgeDisplayClients.delete(res);
  });
}

function isJudgeAdmin(req) {
  if (!JUDGE_ADMIN_KEY) return true;
  const headerKey = String(req.headers['x-judge-admin-key'] || '');
  const auth = String(req.headers.authorization || '');
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return headerKey === JUDGE_ADMIN_KEY || bearer === JUDGE_ADMIN_KEY;
}

function requireJudgeAdmin(req, res) {
  if (isJudgeAdmin(req)) return true;
  json(res, 401, { ok: false, error: '관리자 인증이 필요합니다.' });
  return false;
}

function normalizeAudiencePhone(value) {
  const phone = cleanPhone(value);
  if (!/^010\d{8}$/.test(phone)) return '';
  return phone;
}

function hashJudgeToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function bearerToken(req) {
  const auth = String(req.headers.authorization || '');
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return String(req.headers['x-judge-session'] || '').trim();
}

function sessionJudge(req) {
  const token = bearerToken(req);
  if (!token) return null;
  const tokenHash = hashJudgeToken(token);
  const session = judgeDb.sessions.find((item) => item.tokenHash === tokenHash && item.active !== false);
  if (!session) return null;
  const judge = judgeDb.judges.find((item) => item.id === session.judgeId);
  if (!judge) return null;
  return { token, session, judge };
}

function touchJudgeSession(req, auth) {
  if (!auth) return;
  const now = judgeNowIso();
  auth.session.lastSeenAt = now;
  auth.judge.lastSeenAt = now;
  auth.judge.lastIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  auth.judge.device = String(req.headers['user-agent'] || '').slice(0, 180);
  markJudgeDirty();
}

async function handleJudgeRegister(req, res) {
  let body;
  try { body = await readJsonBody(req); } catch (error) {
    return json(res, 400, { ok: false, error: error.message || '요청 내용을 확인해주세요.' });
  }

  const phone = normalizeAudiencePhone(body.phone);
  if (!phone) return json(res, 400, { ok: false, error: '010 휴대폰 번호를 정확히 입력해주세요.' });

  let judge = judgeDb.judges.find((item) => item.id === phone && item.type === 'audience');
  if (!judge && !judgeDb.event.registrationEnabled) {
    return json(res, 403, { ok: false, code: 'REGISTRATION_CLOSED', error: '현재 신규 심사위원 등록이 중지되어 있습니다.' });
  }

  const now = judgeNowIso();
  if (!judge) {
    judge = {
      id: phone,
      phone,
      type: 'audience',
      allowed: true,
      registeredAt: now,
      lastSeenAt: now,
      lastIp: '',
      device: '',
    };
    judgeDb.judges.push(judge);
    judgeAudit('judge.register', { judgeId: phone, phoneMasked: maskPhone(phone) });
  }

  // 같은 전화번호로 새 기기에서 들어오면 이전 세션을 종료합니다.
  for (const session of judgeDb.sessions) {
    if (session.judgeId === phone && session.active !== false) session.active = false;
  }

  const token = crypto.randomBytes(32).toString('hex');
  judgeDb.sessions.push({
    id: crypto.randomUUID(),
    judgeId: phone,
    tokenHash: hashJudgeToken(token),
    active: true,
    createdAt: now,
    lastSeenAt: now,
  });
  if (judgeDb.sessions.length > 5000) judgeDb.sessions = judgeDb.sessions.slice(-5000);
  markJudgeDirty();
  flushJudgeDb();

  touchJudgeSession(req, sessionJudge({ headers: { authorization: `Bearer ${token}` }, socket: req.socket }));

  return json(res, 200, {
    ok: true,
    sessionToken: token,
    judge: { id: phone, phoneMasked: maskPhone(phone), allowed: judge.allowed !== false },
    state: mobileJudgeState(judge),
  });
}

function mobileJudgeState(judge) {
  const publicState = publicJudgeState();
  const existingVote = judgeDb.votes.find(
    (vote) => Number(vote.teamId) === Number(judgeDb.event.currentTeamId) && vote.judgeId === judge.id && !vote.deleted
  );
  return {
    ...publicState,
    allowed: judge.allowed !== false,
    registrationEnabled: Boolean(judgeDb.event.registrationEnabled),
    allowVoteEdit: Boolean(judgeDb.event.allowVoteEdit),
    myVote: existingVote ? { score: Number(existingVote.score), updatedAt: existingVote.updatedAt } : null,
    phoneMasked: maskPhone(judge.phone),
  };
}

function requireMobileJudge(req, res) {
  const auth = sessionJudge(req);
  if (!auth) {
    json(res, 401, { ok: false, code: 'SESSION_INVALID', error: '심사위원 등록이 필요합니다.' });
    return null;
  }
  touchJudgeSession(req, auth);
  return auth;
}

function normalizeComment(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if ([...text].length > JUDGE_MAX_COMMENT_LENGTH) throw new Error(`댓글은 ${JUDGE_MAX_COMMENT_LENGTH}자 이내로 입력해주세요.`);
  if (/https?:\/\/|www\./i.test(text)) throw new Error('댓글에는 인터넷 주소를 넣을 수 없습니다.');
  if (/(?:01[016789])[- ]?\d{3,4}[- ]?\d{4}/.test(text)) throw new Error('댓글에는 전화번호를 넣을 수 없습니다.');
  return text;
}

async function handleJudgeMobileState(req, res) {
  const auth = requireMobileJudge(req, res);
  if (!auth) return;
  return json(res, 200, { ok: true, state: mobileJudgeState(auth.judge) });
}

async function handleJudgeHeartbeat(req, res) {
  const auth = requireMobileJudge(req, res);
  if (!auth) return;
  return json(res, 200, { ok: true, allowed: auth.judge.allowed !== false, serverTime: judgeNowIso() });
}

function upsertVote({ teamId, judgeId, judgeType, judgeLabel, score, batchId = null }) {
  const now = judgeNowIso();
  let vote = judgeDb.votes.find((item) => Number(item.teamId) === Number(teamId) && item.judgeId === judgeId && !item.deleted);
  if (vote) {
    vote.score = score;
    vote.updatedAt = now;
    vote.judgeType = judgeType;
    vote.judgeLabel = judgeLabel || vote.judgeLabel;
    if (batchId) vote.batchId = batchId;
  } else {
    vote = {
      id: crypto.randomUUID(),
      teamId: Number(teamId),
      judgeId,
      judgeType,
      judgeLabel: judgeLabel || judgeId,
      score,
      batchId,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    };
    judgeDb.votes.push(vote);
  }
  markJudgeDirty();
  return vote;
}

async function handleJudgeVote(req, res) {
  const auth = requireMobileJudge(req, res);
  if (!auth) return;
  const judge = auth.judge;

  if (judge.allowed === false) return json(res, 403, { ok: false, code: 'JUDGE_BLOCKED', error: '현재 심사 참여가 제한되어 있습니다.' });
  if (!judgeDb.event.mobileEnabled) return json(res, 403, { ok: false, code: 'MOBILE_DISABLED', error: '현재 모바일 심사가 일시 중지되어 있습니다.' });
  if (judgeDb.event.phase !== 'voting') return json(res, 409, { ok: false, code: 'NOT_VOTING', error: '현재 심사가 진행 중이 아닙니다.' });

  let body;
  try { body = await readJsonBody(req); } catch (error) {
    return json(res, 400, { ok: false, error: error.message || '요청 내용을 확인해주세요.' });
  }

  const teamId = Number(body.teamId || judgeDb.event.currentTeamId);
  if (teamId !== Number(judgeDb.event.currentTeamId)) return json(res, 409, { ok: false, error: '현재 심사 중인 팀이 아닙니다.' });

  const score = Number(body.score);
  if (!Number.isFinite(score) || score < 0 || score > 100) return json(res, 400, { ok: false, error: '점수는 0~100 범위로 입력해주세요.' });

  const existing = judgeDb.votes.find((vote) => Number(vote.teamId) === teamId && vote.judgeId === judge.id && !vote.deleted);
  if (existing && !judgeDb.event.allowVoteEdit) return json(res, 409, { ok: false, code: 'EDIT_DISABLED', error: '이미 제출한 평가는 수정할 수 없습니다.' });

  const vote = upsertVote({
    teamId,
    judgeId: judge.id,
    judgeType: 'audience',
    judgeLabel: maskPhone(judge.phone),
    score: Math.round(score * 10) / 10,
  });

  let comment = '';
  if (judgeDb.event.commentInputEnabled) {
    try { comment = normalizeComment(body.comment); } catch (error) {
      return json(res, 400, { ok: false, error: error.message });
    }
  }

  if (comment) {
    judgeDb.comments.push({
      id: crypto.randomUUID(),
      teamId,
      judgeId: judge.id,
      judgeType: 'audience',
      judgeLabel: maskPhone(judge.phone),
      text: comment,
      visible: true,
      deleted: false,
      createdAt: judgeNowIso(),
    });
    markJudgeDirty();
  }

  judgeAudit(existing ? 'vote.update' : 'vote.create', { teamId, judgeId: judge.id, judgeType: 'audience' });
  broadcastJudgeState();

  return json(res, 200, {
    ok: true,
    updated: Boolean(existing),
    vote: { score: Number(vote.score), teamId },
    participants: teamAggregate(teamId).participants,
  });
}

function stopJudgeCountdown() {
  if (judgeTimer) clearInterval(judgeTimer);
  judgeTimer = null;
}

function stopExpertTimersForTeam(teamId, markStatus = 'stopped') {
  for (const [key, timer] of expertTimers.entries()) {
    if (key.startsWith(`${Number(teamId)}:`)) {
      clearTimeout(timer);
      expertTimers.delete(key);
    }
  }
  for (const batch of judgeDb.expertBatches) {
    if (Number(batch.teamId) === Number(teamId) && batch.status === 'running') {
      batch.status = markStatus;
      batch.stoppedAt = judgeNowIso();
      for (const entry of batch.entries || []) {
        if (entry.status === 'pending') entry.status = 'cancelled';
      }
    }
  }
  markJudgeDirty();
}

function reschedulePendingExpertsForRemainingTime(teamId, newEndMs) {
  const numericTeamId = Number(teamId);

  // 기존 예약 타이머만 지웁니다. 이미 제출된 전문가 점수는 건드리지 않습니다.
  for (const [key, timer] of expertTimers.entries()) {
    if (key.startsWith(`${numericTeamId}:`)) {
      clearTimeout(timer);
      expertTimers.delete(key);
    }
  }

  for (const batch of judgeDb.expertBatches) {
    if (Number(batch.teamId) !== numericTeamId || batch.status !== 'running') continue;

    const pending = (batch.entries || []).filter((entry) => entry.status === 'pending');
    if (!pending.length) continue;

    const now = Date.now();
    const remainingMs = Math.max(250, newEndMs - now);
    const spacing = remainingMs / (pending.length + 1);
    let lastScheduledMs = now;

    pending.forEach((entry, index) => {
      const jitter = (Math.random() - 0.5) * Math.min(spacing * 0.35, 1200);
      let scheduledMs = now + spacing * (index + 1) + jitter;

      scheduledMs = Math.max(lastScheduledMs + 40, scheduledMs);
      scheduledMs = Math.min(newEndMs - 80, scheduledMs);

      // 남은 시간이 매우 짧은 경우에도 예약 시간이 과거가 되지 않게 합니다.
      scheduledMs = Math.max(now + 40, scheduledMs);

      lastScheduledMs = scheduledMs;
      entry.scheduledAt = new Date(scheduledMs).toISOString();
    });

    scheduleExpertBatch(batch);
  }

  markJudgeDirty();
}

function closeJudgeVoting(reason = 'timer') {
  stopJudgeCountdown();
  stopExpertTimersForTeam(judgeDb.event.currentTeamId, 'completed');
  judgeDb.event.phase = 'result';
  judgeDb.event.endsAt = judgeNowIso();
  judgeAudit('judge.close', { teamId: judgeDb.event.currentTeamId, reason });
  markJudgeDirty();
  flushJudgeDb();
  broadcastJudgeState();
}

function startJudgeCountdown() {
  stopJudgeCountdown();
  judgeTimer = setInterval(() => {
    if (judgeDb.event.phase !== 'voting') return;
    const remaining = judgeRemainingSeconds();
    if (remaining <= 0) closeJudgeVoting('timer');
    else broadcastJudgeState();
  }, 1000);
  judgeTimer.unref?.();
}

async function handleJudgeAdminStart(req, res) {
  if (!requireJudgeAdmin(req, res)) return;
  let body = {};
  try { body = await readJsonBody(req); } catch (error) { return json(res, 400, { ok: false, error: error.message }); }

  const teamId = Math.max(1, Math.min(11, Number(body.teamId || judgeDb.event.currentTeamId) || 1));
  const durationSeconds = Math.max(30, Math.min(600, Number(body.durationSeconds || JUDGE_DEFAULT_DURATION_SECONDS) || JUDGE_DEFAULT_DURATION_SECONDS));
  judgeDb.event.currentTeamId = teamId;
  judgeDb.event.durationSeconds = durationSeconds;
  judgeDb.event.phase = 'voting';
  judgeDb.event.startedAt = judgeNowIso();
  judgeDb.event.endsAt = new Date(Date.now() + durationSeconds * 1000).toISOString();
  judgeAudit('judge.start', { teamId, durationSeconds });
  markJudgeDirty();
  startJudgeCountdown();
  broadcastJudgeState();
  return json(res, 200, { ok: true, state: adminJudgeState() });
}

async function handleJudgeAdminClose(req, res) {
  if (!requireJudgeAdmin(req, res)) return;
  closeJudgeVoting('manual');
  return json(res, 200, { ok: true, state: adminJudgeState() });
}

async function handleJudgeAdminTime(req, res) {
  if (!requireJudgeAdmin(req, res)) return;

  if (judgeDb.event.phase !== 'voting') {
    return json(res, 409, {
      ok: false,
      error: '심사가 진행 중일 때만 남은 시간을 변경할 수 있습니다.',
    });
  }

  let body = {};
  try {
    body = await readJsonBody(req);
  } catch (error) {
    return json(res, 400, { ok: false, error: error.message });
  }

  const raw = Number(body.remainingSeconds);

  if (!Number.isFinite(raw)) {
    return json(res, 400, {
      ok: false,
      error: '남은 시간을 초 단위 숫자로 입력해주세요.',
    });
  }

  // 현장 운영 중 필요에 따라 최대 60분까지 즉시 조정 가능
  const remainingSeconds = Math.max(0, Math.min(3600, Math.round(raw)));

  if (remainingSeconds <= 0) {
    closeJudgeVoting('admin-time-zero');
    return json(res, 200, {
      ok: true,
      state: adminJudgeState(),
    });
  }

  const previousRemainingSeconds = judgeRemainingSeconds();
  const newEndMs = Date.now() + remainingSeconds * 1000;

  judgeDb.event.endsAt = new Date(newEndMs).toISOString();

  // 진행 중인 현장 전문가의 아직 미투입 점수도
  // 새 남은 시간 전체에 다시 균등 분배합니다.
  reschedulePendingExpertsForRemainingTime(
    judgeDb.event.currentTeamId,
    newEndMs
  );

  judgeAudit('judge.time.adjust', {
    teamId: judgeDb.event.currentTeamId,
    previousRemainingSeconds,
    remainingSeconds,
  });

  markJudgeDirty();
  void flushJudgeDb();

  // display의 SSE state가 즉시 새 시간으로 바뀝니다.
  broadcastJudgeState();

  return json(res, 200, {
    ok: true,
    state: adminJudgeState(),
  });
}

async function handleJudgeAdminReset(req, res) {
  if (!requireJudgeAdmin(req, res)) return;
  let body = {};
  try { body = await readJsonBody(req); } catch {}
  const teamId = Number(body.teamId || judgeDb.event.currentTeamId);
  stopExpertTimersForTeam(teamId, 'reset');
  judgeDb.votes = judgeDb.votes.filter((vote) => Number(vote.teamId) !== teamId);
  judgeDb.comments = judgeDb.comments.filter((comment) => Number(comment.teamId) !== teamId);
  judgeDb.expertBatches = judgeDb.expertBatches.filter((batch) => Number(batch.teamId) !== teamId);
  if (Number(judgeDb.event.currentTeamId) === teamId) {
    stopJudgeCountdown();
    judgeDb.event.phase = 'idle';
    judgeDb.event.startedAt = null;
    judgeDb.event.endsAt = null;
  }
  judgeAudit('team.reset', { teamId });
  markJudgeDirty();
  flushJudgeDb();
  broadcastJudgeState();
  return json(res, 200, { ok: true, state: adminJudgeState() });
}

async function handleJudgeAdminTeam(req, res) {
  if (!requireJudgeAdmin(req, res)) return;
  let body;
  try { body = await readJsonBody(req); } catch (error) { return json(res, 400, { ok: false, error: error.message }); }
  const teamId = Math.max(1, Math.min(11, Number(body.teamId) || 1));
  judgeDb.event.currentTeamId = teamId;
  judgeAudit('team.select', { teamId });
  markJudgeDirty();
  broadcastJudgeState();
  return json(res, 200, { ok: true, state: adminJudgeState() });
}

async function handleJudgeAdminOrder(req, res) {
  if (!requireJudgeAdmin(req, res)) return;
  let body;
  try { body = await readJsonBody(req); } catch (error) { return json(res, 400, { ok: false, error: error.message }); }
  const order = Array.isArray(body.teamOrder) ? body.teamOrder.map(Number) : [];
  const valid = new Set(judgeDb.teams.map((team) => Number(team.id)));
  if (order.length !== valid.size || new Set(order).size !== valid.size || order.some((id) => !valid.has(id))) {
    return json(res, 400, { ok: false, error: '합창단 전체 순서를 중복 없이 보내주세요.' });
  }
  judgeDb.event.teamOrder = order;
  judgeAudit('team.order', { teamOrder: order });
  markJudgeDirty();
  broadcastJudgeState();
  return json(res, 200, { ok: true, state: adminJudgeState() });
}

async function handleJudgeAdminDisplay(req, res) {
  if (!requireJudgeAdmin(req, res)) return;
  let body;
  try { body = await readJsonBody(req); } catch (error) { return json(res, 400, { ok: false, error: error.message }); }
  const allowedModes = new Set(['event_intro', 'team_intro', 'score']);
  if (body.displayMode && !allowedModes.has(String(body.displayMode))) return json(res, 400, { ok: false, error: '지원하지 않는 화면 종류입니다.' });
  if (body.displayMode) judgeDb.event.displayMode = String(body.displayMode);
  if (typeof body.eventTitle1 === 'string') judgeDb.event.eventTitle1 = body.eventTitle1.trim().slice(0, 80);
  if (typeof body.eventTitle2 === 'string') judgeDb.event.eventTitle2 = body.eventTitle2.trim().slice(0, 80);
  if (Number.isFinite(Number(body.introTeamId))) judgeDb.event.introTeamId = Math.max(1, Math.min(11, Number(body.introTeamId)));
  judgeAudit('display.update', {
    displayMode: judgeDb.event.displayMode,
    introTeamId: judgeDb.event.introTeamId,
  });
  markJudgeDirty();
  flushJudgeDb();
  broadcastJudgeState();
  return json(res, 200, { ok: true, state: adminJudgeState() });
}

async function handleJudgeAdminTeamMeta(req, res) {
  if (!requireJudgeAdmin(req, res)) return;
  let body;
  try { body = await readJsonBody(req); } catch (error) { return json(res, 400, { ok: false, error: error.message }); }
  const team = judgeTeam(body.teamId);
  if (!team) return json(res, 404, { ok: false, error: '합창단을 찾지 못했습니다.' });
  if (Array.isArray(body.songs)) team.songs = body.songs.slice(0, 2).map((song) => String(song || '').trim().slice(0, 100));
  if (typeof body.name === 'string' && body.name.trim()) team.name = body.name.trim().slice(0, 80);
  judgeAudit('team.meta', { teamId: team.id, songs: team.songs });
  markJudgeDirty();
  flushJudgeDb();
  broadcastJudgeState();
  return json(res, 200, { ok: true, state: adminJudgeState() });
}

async function handleJudgeAdminCommentDelete(req, res) {
  if (!requireJudgeAdmin(req, res)) return;
  let body;
  try { body = await readJsonBody(req); } catch (error) { return json(res, 400, { ok: false, error: error.message }); }
  const comment = judgeDb.comments.find((item) => item.id === String(body.commentId || ''));
  if (!comment) return json(res, 404, { ok: false, error: '댓글을 찾지 못했습니다.' });
  comment.deleted = true;
  comment.visible = false;
  comment.deletedAt = judgeNowIso();
  judgeAudit('comment.delete', { commentId: comment.id, teamId: comment.teamId });
  markJudgeDirty();
  broadcastJudgeState();
  return json(res, 200, { ok: true, state: adminJudgeState() });
}

async function handleJudgeAdminJudgeAllow(req, res) {
  if (!requireJudgeAdmin(req, res)) return;
  let body;
  try { body = await readJsonBody(req); } catch (error) { return json(res, 400, { ok: false, error: error.message }); }
  const judge = judgeDb.judges.find((item) => item.id === String(body.judgeId || '') && item.type === 'audience');
  if (!judge) return json(res, 404, { ok: false, error: '심사위원을 찾지 못했습니다.' });
  judge.allowed = body.allowed !== false;
  judgeAudit('judge.allow', { judgeId: judge.id, allowed: judge.allowed });
  markJudgeDirty();
  return json(res, 200, { ok: true, state: adminJudgeState() });
}

async function handleJudgeAdminSettings(req, res) {
  if (!requireJudgeAdmin(req, res)) return;
  let body;
  try { body = await readJsonBody(req); } catch (error) { return json(res, 400, { ok: false, error: error.message }); }
  const keys = ['mobileEnabled', 'registrationEnabled', 'commentInputEnabled', 'commentDisplayEnabled', 'allowVoteEdit'];
  for (const key of keys) if (typeof body[key] === 'boolean') judgeDb.event[key] = body[key];
  judgeAudit('settings.update', Object.fromEntries(keys.map((key) => [key, judgeDb.event[key]])));
  markJudgeDirty();
  broadcastJudgeState();
  return json(res, 200, { ok: true, state: adminJudgeState() });
}

function makeExpertScores(count, baseScore, spread) {
  const scores = [];
  const base = Math.max(0, Math.min(100, Number(baseScore)));
  const maxSpread = Math.max(0, Math.min(30, Number(spread)));
  const pairCount = Math.floor(count / 2);
  for (let i = 0; i < pairCount; i += 1) {
    const d = Math.random() * maxSpread;
    scores.push(Math.max(0, Math.min(100, base + d)));
    scores.push(Math.max(0, Math.min(100, base - d)));
  }
  if (count % 2 === 1) scores.push(base);
  for (let i = scores.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1);
    [scores[i], scores[j]] = [scores[j], scores[i]];
  }
  return scores.map((score) => Math.round(score * 10) / 10);
}

function fireExpertEntry(batchId, entryId) {
  const batch = judgeDb.expertBatches.find((item) => item.id === batchId);
  if (!batch || batch.status !== 'running') return;
  if (judgeDb.event.phase !== 'voting' || Number(judgeDb.event.currentTeamId) !== Number(batch.teamId)) return;
  const entry = (batch.entries || []).find((item) => item.id === entryId);
  if (!entry || entry.status !== 'pending') return;

  upsertVote({
    teamId: batch.teamId,
    judgeId: entry.judgeId,
    judgeType: 'onsite_expert',
    judgeLabel: entry.label,
    score: entry.score,
    batchId: batch.id,
  });
  entry.status = 'submitted';
  entry.submittedAt = judgeNowIso();
  const allDone = batch.entries.every((item) => item.status !== 'pending');
  if (allDone) {
    batch.status = 'completed';
    batch.completedAt = judgeNowIso();
  }
  markJudgeDirty();
  broadcastJudgeState();
}

function scheduleExpertBatch(batch) {
  for (const entry of batch.entries || []) {
    if (entry.status !== 'pending') continue;
    const delay = Math.max(40, new Date(entry.scheduledAt).getTime() - Date.now());
    const key = `${Number(batch.teamId)}:${batch.id}:${entry.id}`;
    const timer = setTimeout(() => {
      expertTimers.delete(key);
      fireExpertEntry(batch.id, entry.id);
    }, delay);
    timer.unref?.();
    expertTimers.set(key, timer);
  }
}

async function handleJudgeAdminExpertStart(req, res) {
  if (!requireJudgeAdmin(req, res)) return;
  if (judgeDb.event.phase !== 'voting') return json(res, 409, { ok: false, error: '심사가 진행 중일 때만 현장 전문가 점수를 투입할 수 있습니다.' });
  let body;
  try { body = await readJsonBody(req); } catch (error) { return json(res, 400, { ok: false, error: error.message }); }

  const count = Math.max(0, Math.min(500, Math.floor(Number(body.count) || 0)));
  const baseScore = Math.max(0, Math.min(100, Number(body.baseScore) || 0));
  const spread = Math.max(0, Math.min(30, Number(body.spread ?? 10) || 0));
  if (count === 0) return json(res, 200, { ok: true, state: adminJudgeState(), message: '현장 전문가 수가 0이므로 추가하지 않았습니다.' });

  const teamId = Number(judgeDb.event.currentTeamId);
  const remainingMs = Math.max(1500, new Date(judgeDb.event.endsAt).getTime() - Date.now());
  const scores = makeExpertScores(count, baseScore, spread);
  const batchId = crypto.randomUUID();
  const spacing = remainingMs / (count + 1);
  let lastAt = Date.now();
  const entries = scores.map((score, index) => {
    const jitter = (Math.random() - 0.5) * Math.min(spacing * 0.45, 1800);
    let scheduledMs = Date.now() + spacing * (index + 1) + jitter;
    scheduledMs = Math.max(lastAt + 40, scheduledMs);
    scheduledMs = Math.min(new Date(judgeDb.event.endsAt).getTime() - 120, scheduledMs);
    lastAt = scheduledMs;
    return {
      id: crypto.randomUUID(),
      judgeId: `onsite-expert-${String(index + 1).padStart(3, '0')}`,
      label: `가상 ${index + 1}`,
      score,
      scheduledAt: new Date(scheduledMs).toISOString(),
      status: 'pending',
      submittedAt: null,
    };
  });

  // 전문가 레코드 자체도 DB에서 유형을 구분해 둡니다.
  for (const entry of entries) {
    if (!judgeDb.judges.find((judge) => judge.id === entry.judgeId)) {
      judgeDb.judges.push({
        id: entry.judgeId,
        phone: '',
        type: 'onsite_expert',
        label: entry.label,
        allowed: true,
        registeredAt: judgeNowIso(),
        lastSeenAt: null,
      });
    }
  }

  const batch = {
    id: batchId,
    teamId,
    count,
    baseScore,
    spread,
    status: 'running',
    createdAt: judgeNowIso(),
    entries,
  };
  judgeDb.expertBatches.push(batch);
  judgeAudit('expert.batch.start', { teamId, count, baseScore, spread, batchId });
  markJudgeDirty();
  scheduleExpertBatch(batch);
  return json(res, 200, { ok: true, state: adminJudgeState() });
}

async function handleJudgeAdminExpertStop(req, res) {
  if (!requireJudgeAdmin(req, res)) return;
  stopExpertTimersForTeam(judgeDb.event.currentTeamId, 'stopped');
  judgeAudit('expert.batch.stop', { teamId: judgeDb.event.currentTeamId });
  markJudgeDirty();
  return json(res, 200, { ok: true, state: adminJudgeState() });
}

async function handleJudgeAdminExpertVote(req, res) {
  if (!requireJudgeAdmin(req, res)) return;
  let body;
  try { body = await readJsonBody(req); } catch (error) { return json(res, 400, { ok: false, error: error.message }); }
  const teamId = Number(body.teamId || judgeDb.event.currentTeamId);
  const judgeId = String(body.judgeId || '').trim();
  if (!judgeId.startsWith('onsite-expert-')) return json(res, 400, { ok: false, error: '현장 전문가 ID를 확인해주세요.' });
  const vote = judgeDb.votes.find((item) => Number(item.teamId) === teamId && item.judgeId === judgeId && !item.deleted);
  if (!vote) return json(res, 404, { ok: false, error: '현장 전문가 점수를 찾지 못했습니다.' });
  if (body.delete === true) {
    vote.deleted = true;
    vote.deletedAt = judgeNowIso();
    judgeAudit('expert.vote.delete', { teamId, judgeId });
  } else {
    const score = Number(body.score);
    if (!Number.isFinite(score) || score < 0 || score > 100) return json(res, 400, { ok: false, error: '점수는 0~100 범위여야 합니다.' });
    vote.score = Math.round(score * 10) / 10;
    vote.updatedAt = judgeNowIso();
    judgeAudit('expert.vote.update', { teamId, judgeId, score: vote.score });
  }
  markJudgeDirty();
  broadcastJudgeState();
  return json(res, 200, { ok: true, state: adminJudgeState() });
}

function csvEscape(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function handleJudgeAdminExport(req, res) {
  if (!requireJudgeAdmin(req, res)) return;
  const rows = [[
    'team_id','team_name','judge_id','judge_type','judge_label','score','created_at','updated_at','deleted'
  ]];
  for (const vote of judgeDb.votes) {
    const team = judgeTeam(vote.teamId);
    rows.push([
      vote.teamId,
      team?.name || '',
      vote.judgeId,
      vote.judgeType,
      vote.judgeLabel || '',
      vote.score,
      vote.createdAt,
      vote.updatedAt,
      vote.deleted ? '1' : '0',
    ]);
  }
  const csv = '\uFEFF' + rows.map((row) => row.map(csvEscape).join(',')).join('\r\n');
  res.writeHead(200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="judge-votes.csv"',
    'Cache-Control': 'no-store',
  });
  res.end(csv);
}

function restoreJudgeRuntime() {
  if (judgeDb.event.phase === 'voting') {
    if (judgeRemainingSeconds() <= 0) {
      judgeDb.event.phase = 'result';
      judgeDb.event.endsAt = judgeNowIso();
      markJudgeDirty();
    } else {
      startJudgeCountdown();
      for (const batch of judgeDb.expertBatches) {
        if (batch.status === 'running' && Number(batch.teamId) === Number(judgeDb.event.currentTeamId)) {
          scheduleExpertBatch(batch);
        }
      }
    }
  }
}

restoreJudgeRuntime();


const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;

  if (pathname === "/health") {
    return json(res, 200, {
      ok: true,
      service: "partner-apply-naver-sens",
      environment: {
        accessKey: Boolean(NCP_ACCESS_KEY),
        secretKey: Boolean(NCP_SECRET_KEY),
        serviceId: Boolean(NCP_SENS_SERVICE_ID),
        from: Boolean(NCP_SENS_FROM),
        fromMasked: NCP_SENS_FROM ? maskPhone(NCP_SENS_FROM) : "",
        googleSheet: Boolean(PARTNER_GSHEET_URL),
      },
      debugMode: PARTNER_DEBUG,
      judge: {
        adminKeyConfigured: Boolean(JUDGE_ADMIN_KEY),
        database: { backend: 'postgresql', connected: judgeDatabaseConnected, eventKey: JUDGE_EVENT_KEY, lastError: judgeDatabaseLastError },
        displayClients: judgeDisplayClients.size,
        state: publicJudgeState(),
      },
      serverTime: new Date().toISOString(),
    });
  }

  if (pathname === "/api/judge/live") {
    if (req.method !== "GET") return json(res, 405, { ok: false, error: "GET 요청만 사용할 수 있습니다." });
    return handleJudgeLive(req, res);
  }

  if (pathname === "/api/judge/state") {
    if (req.method !== "GET") return json(res, 405, { ok: false, error: "GET 요청만 사용할 수 있습니다." });
    return json(res, 200, { ok: true, state: publicJudgeState() });
  }

  if (pathname === "/api/judge/register") {
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "POST 요청만 사용할 수 있습니다." });
    return handleJudgeRegister(req, res);
  }

  if (pathname === "/api/judge/mobile/state") {
    if (req.method !== "GET") return json(res, 405, { ok: false, error: "GET 요청만 사용할 수 있습니다." });
    return handleJudgeMobileState(req, res);
  }

  if (pathname === "/api/judge/heartbeat") {
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "POST 요청만 사용할 수 있습니다." });
    return handleJudgeHeartbeat(req, res);
  }

  if (pathname === "/api/judge/vote") {
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "POST 요청만 사용할 수 있습니다." });
    return handleJudgeVote(req, res);
  }

  if (pathname === "/api/judge/admin/state") {
    if (req.method !== "GET") return json(res, 405, { ok: false, error: "GET 요청만 사용할 수 있습니다." });
    if (!requireJudgeAdmin(req, res)) return;
    return json(res, 200, { ok: true, state: adminJudgeState() });
  }

  if (pathname === "/api/judge/admin/start") {
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "POST 요청만 사용할 수 있습니다." });
    return handleJudgeAdminStart(req, res);
  }

  if (pathname === "/api/judge/admin/close") {
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "POST 요청만 사용할 수 있습니다." });
    return handleJudgeAdminClose(req, res);
  }

  if (pathname === "/api/judge/admin/time") {
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "POST 요청만 사용할 수 있습니다." });
    return handleJudgeAdminTime(req, res);
  }

  if (pathname === "/api/judge/admin/reset") {
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "POST 요청만 사용할 수 있습니다." });
    return handleJudgeAdminReset(req, res);
  }

  if (pathname === "/api/judge/admin/team") {
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "POST 요청만 사용할 수 있습니다." });
    return handleJudgeAdminTeam(req, res);
  }

  if (pathname === "/api/judge/admin/order") {
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "POST 요청만 사용할 수 있습니다." });
    return handleJudgeAdminOrder(req, res);
  }

  if (pathname === "/api/judge/admin/display") {
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "POST 요청만 사용할 수 있습니다." });
    return handleJudgeAdminDisplay(req, res);
  }

  if (pathname === "/api/judge/admin/team-meta") {
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "POST 요청만 사용할 수 있습니다." });
    return handleJudgeAdminTeamMeta(req, res);
  }

  if (pathname === "/api/judge/admin/comment/delete") {
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "POST 요청만 사용할 수 있습니다." });
    return handleJudgeAdminCommentDelete(req, res);
  }

  if (pathname === "/api/judge/admin/judge/allow") {
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "POST 요청만 사용할 수 있습니다." });
    return handleJudgeAdminJudgeAllow(req, res);
  }

  if (pathname === "/api/judge/admin/settings") {
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "POST 요청만 사용할 수 있습니다." });
    return handleJudgeAdminSettings(req, res);
  }

  if (pathname === "/api/judge/admin/expert/start") {
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "POST 요청만 사용할 수 있습니다." });
    return handleJudgeAdminExpertStart(req, res);
  }

  if (pathname === "/api/judge/admin/expert/stop") {
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "POST 요청만 사용할 수 있습니다." });
    return handleJudgeAdminExpertStop(req, res);
  }

  if (pathname === "/api/judge/admin/expert/vote") {
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "POST 요청만 사용할 수 있습니다." });
    return handleJudgeAdminExpertVote(req, res);
  }

  if (pathname === "/api/judge/admin/export.csv") {
    if (req.method !== "GET") return json(res, 405, { ok: false, error: "GET 요청만 사용할 수 있습니다." });
    return handleJudgeAdminExport(req, res);
  }

  if (pathname === "/api/partner/apply") {
    if (req.method !== "POST") {
      return json(res, 405, {
        ok: false,
        error: "POST 요청만 사용할 수 있습니다.",
      });
    }

    return handlePartnerApply(req, res);
  }

  return json(res, 404, {
    ok: false,
    error: "Not Found",
  });
});

(async () => {
  await initJudgeDatabase();

  server.listen(PORT, "127.0.0.1", () => {
    console.log(
      `[partner-api] NAVER SENS ready: http://127.0.0.1:${PORT}/api/partner/apply`
    );
    console.log(`[judge-api] ready: http://127.0.0.1:${PORT}/api/judge/state`);
    console.log(`[judge-api] db: PostgreSQL / ${JUDGE_EVENT_KEY} / connected=${judgeDatabaseConnected}`);
  });
})();
