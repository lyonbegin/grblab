/**
 * 병원동행 파트너 신청 API
 * - NAVER SENS LMS 발송
 * - Google Sheet 저장
 * - Railway에서 이 파일 하나만 실행
 */
const http = require("node:http");
const crypto = require("node:crypto");

const PORT = Number(process.env.PARTNER_API_PORT || 3001);

const NCP_ACCESS_KEY = process.env.NCP_ACCESS_KEY || "";
const NCP_SECRET_KEY = process.env.NCP_SECRET_KEY || "";
const NCP_SENS_SERVICE_ID = process.env.NCP_SENS_SERVICE_ID || "";
const NCP_SENS_FROM = String(process.env.NCP_SENS_FROM || "").replace(/\D/g, "");

const PARTNER_GSHEET_URL =
  process.env.PARTNER_GSHEET_URL ||
  "https://script.google.com/macros/s/AKfycbwypBqdKEw02OW06x4StD-BRNQJ7T9WcZSsWFHyT4KMD12hkPJBFbQz5JNVU5JIhkNd/exec";

const PARTNER_DEBUG = String(process.env.PARTNER_DEBUG || "") === "1";

const JUDGE_ADMIN_KEY = String(process.env.JUDGE_ADMIN_KEY || "");
const JUDGE_DEFAULT_DURATION_SECONDS = Math.max(
  30,
  Math.min(600, Number(process.env.JUDGE_DEFAULT_DURATION_SECONDS || 180))
);

// 객석심사 실시간 상태.
// 현재 단계에서는 메모리 기반입니다. 컨테이너가 재시작되면 초기화됩니다.
const judgeClients = new Set();
const judgeVotes = new Map();

let judgeState = {
  teamId: 1,
  phase: "idle", // idle | voting | result
  participants: 0,
  remainingSeconds: JUDGE_DEFAULT_DURATION_SECONDS,
  score: 0,
  comments: [],
  startedAt: null,
  endsAt: null,
};

let judgeTimer = null;

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


function judgeSnapshot() {
  let remainingSeconds = Number(judgeState.remainingSeconds) || 0;

  if (judgeState.phase === "voting" && judgeState.endsAt) {
    remainingSeconds = Math.max(
      0,
      Math.ceil((Number(judgeState.endsAt) - Date.now()) / 1000)
    );
  }

  return {
    teamId: Number(judgeState.teamId) || 1,
    phase: judgeState.phase,
    participants: Number(judgeState.participants) || 0,
    remainingSeconds,
    score: Number(judgeState.score) || 0,
    comments: Array.isArray(judgeState.comments)
      ? judgeState.comments.slice(-2)
      : [],
    startedAt: judgeState.startedAt,
    endsAt: judgeState.endsAt,
  };
}

function writeSse(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function broadcastJudge(payload) {
  const dead = [];

  for (const client of judgeClients) {
    try {
      writeSse(client, payload);
    } catch {
      dead.push(client);
    }
  }

  dead.forEach((client) => judgeClients.delete(client));
}

function broadcastJudgeState() {
  broadcastJudge({
    type: "state",
    ...judgeSnapshot(),
  });
}

function recalculateJudgeScore() {
  const prefix = `${Number(judgeState.teamId)}:`;
  const scores = [];

  for (const [key, vote] of judgeVotes.entries()) {
    if (!key.startsWith(prefix)) continue;
    const score = Number(vote?.score);
    if (Number.isFinite(score)) scores.push(score);
  }

  judgeState.participants = scores.length;

  if (!scores.length) {
    judgeState.score = 0;
    return;
  }

  const average = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  judgeState.score = Math.round(average * 10) / 10;
}

function stopJudgeTimer() {
  if (judgeTimer) {
    clearInterval(judgeTimer);
    judgeTimer = null;
  }
}

function startJudgeTimer() {
  stopJudgeTimer();

  judgeTimer = setInterval(() => {
    if (judgeState.phase !== "voting") return;

    const remainingSeconds = Math.max(
      0,
      Math.ceil((Number(judgeState.endsAt) - Date.now()) / 1000)
    );

    judgeState.remainingSeconds = remainingSeconds;

    if (remainingSeconds <= 0) {
      judgeState.phase = "result";
      judgeState.remainingSeconds = 0;
      recalculateJudgeScore();
      stopJudgeTimer();

      broadcastJudge({
        type: "result",
        teamId: judgeState.teamId,
        score: judgeState.score,
        participants: judgeState.participants,
      });
      broadcastJudgeState();
      return;
    }

    // 대형 화면의 카운트다운과 참여 숫자를 1초마다 동기화
    broadcastJudgeState();
  }, 1000);
}

function isJudgeAdmin(req) {
  // JUDGE_ADMIN_KEY를 설정하지 않은 경우에는 현장 테스트 편의를 위해 허용합니다.
  // 운영 전에는 반드시 환경변수에 키를 넣는 것을 권장합니다.
  if (!JUDGE_ADMIN_KEY) return true;

  const headerKey = String(req.headers["x-judge-admin-key"] || "");
  const auth = String(req.headers.authorization || "");
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  return headerKey === JUDGE_ADMIN_KEY || bearer === JUDGE_ADMIN_KEY;
}

function judgeAdminDenied(res) {
  return json(res, 401, {
    ok: false,
    error: "객석심사 관리자 인증이 필요합니다.",
  });
}

function normalizeJudgeComment(value) {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "";

  // 대형 스크린용: 너무 긴 문장, URL, 전화번호 형태는 송출하지 않습니다.
  if (text.length > 80) {
    throw new Error("댓글은 80자 이내로 입력해주세요.");
  }

  if (/https?:\/\/|www\./i.test(text)) {
    throw new Error("댓글에는 인터넷 주소를 넣을 수 없습니다.");
  }

  if (/(?:01[016789])[- ]?\d{3,4}[- ]?\d{4}/.test(text)) {
    throw new Error("댓글에는 전화번호를 넣을 수 없습니다.");
  }

  return text;
}

function appendJudgeComment(text) {
  if (!text) return;

  judgeState.comments = [...judgeState.comments, text].slice(-2);

  broadcastJudge({
    type: "comment",
    teamId: judgeState.teamId,
    text,
  });
}

function makeJudgeVoteKey(teamId, judgeId) {
  const cleanJudgeId = String(judgeId || "").trim();

  // judgeId가 있으면 같은 심사위원의 수정 제출은 1명으로 유지합니다.
  if (cleanJudgeId) return `${teamId}:${cleanJudgeId.slice(0, 120)}`;

  // judgeId가 아직 없는 초기 테스트에서는 요청마다 별도 참여자로 계산합니다.
  return `${teamId}:anon-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
}

function normalizeJudgeScore(body) {
  if (Number.isFinite(Number(body?.score))) {
    const score = Number(body.score);
    if (score < 0 || score > 100) {
      throw new Error("점수는 0~100 범위여야 합니다.");
    }
    return Math.round(score * 10) / 10;
  }

  // 모바일 화면에서 1~5점 항목 배열을 보낼 경우 자동으로 100점 환산
  if (Array.isArray(body?.scores) && body.scores.length > 0) {
    const values = body.scores.map(Number);

    if (
      values.some(
        (value) => !Number.isFinite(value) || value < 1 || value > 5
      )
    ) {
      throw new Error("항목 점수는 각각 1~5 범위여야 합니다.");
    }

    const average5 =
      values.reduce((sum, value) => sum + value, 0) / values.length;

    return Math.round(average5 * 20 * 10) / 10;
  }

  throw new Error("score 또는 scores를 보내주세요.");
}

function clearJudgeVotesForTeam(teamId) {
  const prefix = `${Number(teamId)}:`;

  for (const key of [...judgeVotes.keys()]) {
    if (key.startsWith(prefix)) judgeVotes.delete(key);
  }
}

function beginJudgeTeam(teamId, durationSeconds) {
  const safeTeamId = Math.max(1, Math.min(11, Number(teamId) || 1));
  const safeDuration = Math.max(
    30,
    Math.min(600, Number(durationSeconds) || JUDGE_DEFAULT_DURATION_SECONDS)
  );

  clearJudgeVotesForTeam(safeTeamId);

  const startedAtMs = Date.now();

  judgeState = {
    teamId: safeTeamId,
    phase: "voting",
    participants: 0,
    remainingSeconds: safeDuration,
    score: 0,
    comments: [],
    startedAt: new Date(startedAtMs).toISOString(),
    endsAt: startedAtMs + safeDuration * 1000,
  };

  startJudgeTimer();

  broadcastJudge({
    type: "team",
    teamId: safeTeamId,
  });
  broadcastJudgeState();

  return judgeSnapshot();
}

async function handleJudgeVote(req, res) {
  let body;

  try {
    body = await readJsonBody(req);
  } catch (error) {
    return json(res, 400, {
      ok: false,
      error: error.message || "요청 내용을 확인해주세요.",
    });
  }

  if (judgeState.phase !== "voting") {
    return json(res, 409, {
      ok: false,
      error: "현재 객석심사가 진행 중이 아닙니다.",
      state: judgeSnapshot(),
    });
  }

  const requestTeamId = Number(body.teamId || judgeState.teamId);

  if (requestTeamId !== Number(judgeState.teamId)) {
    return json(res, 409, {
      ok: false,
      error: "현재 진행 중인 합창단과 제출 대상이 다릅니다.",
      currentTeamId: judgeState.teamId,
    });
  }

  let score;
  let comment = "";

  try {
    score = normalizeJudgeScore(body);
    comment = normalizeJudgeComment(body.comment || body.text || "");
  } catch (error) {
    return json(res, 400, {
      ok: false,
      error: error.message,
    });
  }

  const voteKey = makeJudgeVoteKey(judgeState.teamId, body.judgeId);
  const existing = judgeVotes.get(voteKey);

  judgeVotes.set(voteKey, {
    score,
    submittedAt: new Date().toISOString(),
  });

  recalculateJudgeScore();

  if (comment) appendJudgeComment(comment);

  broadcastJudgeState();

  return json(res, 200, {
    ok: true,
    updated: Boolean(existing),
    teamId: judgeState.teamId,
    participants: judgeState.participants,
    score: judgeState.score,
    remainingSeconds: judgeSnapshot().remainingSeconds,
  });
}

async function handleJudgeComment(req, res) {
  let body;

  try {
    body = await readJsonBody(req);
  } catch (error) {
    return json(res, 400, {
      ok: false,
      error: error.message || "요청 내용을 확인해주세요.",
    });
  }

  if (judgeState.phase !== "voting") {
    return json(res, 409, {
      ok: false,
      error: "현재 객석심사가 진행 중이 아닙니다.",
    });
  }

  let comment;

  try {
    comment = normalizeJudgeComment(body.text || body.comment || "");
  } catch (error) {
    return json(res, 400, {
      ok: false,
      error: error.message,
    });
  }

  if (!comment) {
    return json(res, 400, {
      ok: false,
      error: "댓글 내용을 입력해주세요.",
    });
  }

  appendJudgeComment(comment);

  return json(res, 200, {
    ok: true,
    comments: judgeState.comments,
  });
}

function handleJudgeLive(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  res.write(": connected\n\n");
  writeSse(res, {
    type: "state",
    ...judgeSnapshot(),
  });

  judgeClients.add(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      clearInterval(heartbeat);
      judgeClients.delete(res);
    }
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    judgeClients.delete(res);
  });
}

async function handleJudgeAdminStart(req, res) {
  if (!isJudgeAdmin(req)) return judgeAdminDenied(res);

  let body = {};

  try {
    body = await readJsonBody(req);
  } catch (error) {
    return json(res, 400, {
      ok: false,
      error: error.message,
    });
  }

  const state = beginJudgeTeam(
    body.teamId || judgeState.teamId || 1,
    body.durationSeconds || JUDGE_DEFAULT_DURATION_SECONDS
  );

  return json(res, 200, {
    ok: true,
    state,
  });
}

async function handleJudgeAdminClose(req, res) {
  if (!isJudgeAdmin(req)) return judgeAdminDenied(res);

  stopJudgeTimer();
  judgeState.phase = "result";
  judgeState.remainingSeconds = 0;
  judgeState.endsAt = Date.now();
  recalculateJudgeScore();

  broadcastJudge({
    type: "result",
    teamId: judgeState.teamId,
    score: judgeState.score,
    participants: judgeState.participants,
  });
  broadcastJudgeState();

  return json(res, 200, {
    ok: true,
    state: judgeSnapshot(),
  });
}

async function handleJudgeAdminTeam(req, res) {
  if (!isJudgeAdmin(req)) return judgeAdminDenied(res);

  let body = {};

  try {
    body = await readJsonBody(req);
  } catch (error) {
    return json(res, 400, {
      ok: false,
      error: error.message,
    });
  }

  const safeTeamId = Math.max(1, Math.min(11, Number(body.teamId) || 1));
  judgeState.teamId = safeTeamId;

  broadcastJudge({
    type: "team",
    teamId: safeTeamId,
  });
  broadcastJudgeState();

  return json(res, 200, {
    ok: true,
    state: judgeSnapshot(),
  });
}

async function handleJudgeAdminReset(req, res) {
  if (!isJudgeAdmin(req)) return judgeAdminDenied(res);

  stopJudgeTimer();

  const teamId = Number(judgeState.teamId) || 1;
  clearJudgeVotesForTeam(teamId);

  judgeState = {
    teamId,
    phase: "idle",
    participants: 0,
    remainingSeconds: JUDGE_DEFAULT_DURATION_SECONDS,
    score: 0,
    comments: [],
    startedAt: null,
    endsAt: null,
  };

  broadcastJudgeState();

  return json(res, 200, {
    ok: true,
    state: judgeSnapshot(),
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
        defaultDurationSeconds: JUDGE_DEFAULT_DURATION_SECONDS,
        connectedDisplays: judgeClients.size,
        state: judgeSnapshot(),
      },
      serverTime: new Date().toISOString(),
    });
  }


  if (pathname === "/api/judge/live") {
    if (req.method !== "GET") {
      return json(res, 405, {
        ok: false,
        error: "GET 요청만 사용할 수 있습니다.",
      });
    }

    return handleJudgeLive(req, res);
  }

  if (pathname === "/api/judge/state") {
    if (req.method !== "GET") {
      return json(res, 405, {
        ok: false,
        error: "GET 요청만 사용할 수 있습니다.",
      });
    }

    return json(res, 200, {
      ok: true,
      state: judgeSnapshot(),
      connectedDisplays: judgeClients.size,
    });
  }

  if (pathname === "/api/judge/vote") {
    if (req.method !== "POST") {
      return json(res, 405, {
        ok: false,
        error: "POST 요청만 사용할 수 있습니다.",
      });
    }

    return handleJudgeVote(req, res);
  }

  if (pathname === "/api/judge/comment") {
    if (req.method !== "POST") {
      return json(res, 405, {
        ok: false,
        error: "POST 요청만 사용할 수 있습니다.",
      });
    }

    return handleJudgeComment(req, res);
  }

  if (pathname === "/api/judge/admin/start") {
    if (req.method !== "POST") {
      return json(res, 405, {
        ok: false,
        error: "POST 요청만 사용할 수 있습니다.",
      });
    }

    return handleJudgeAdminStart(req, res);
  }

  if (pathname === "/api/judge/admin/close") {
    if (req.method !== "POST") {
      return json(res, 405, {
        ok: false,
        error: "POST 요청만 사용할 수 있습니다.",
      });
    }

    return handleJudgeAdminClose(req, res);
  }

  if (pathname === "/api/judge/admin/team") {
    if (req.method !== "POST") {
      return json(res, 405, {
        ok: false,
        error: "POST 요청만 사용할 수 있습니다.",
      });
    }

    return handleJudgeAdminTeam(req, res);
  }

  if (pathname === "/api/judge/admin/reset") {
    if (req.method !== "POST") {
      return json(res, 405, {
        ok: false,
        error: "POST 요청만 사용할 수 있습니다.",
      });
    }

    return handleJudgeAdminReset(req, res);
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

server.listen(PORT, "127.0.0.1", () => {
  console.log(
    `[partner-api] NAVER SENS ready: http://127.0.0.1:${PORT}/api/partner/apply`
  );
  console.log(
    `[judge-api] SSE ready: http://127.0.0.1:${PORT}/api/judge/live`
  );
});
