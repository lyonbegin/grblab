const http = require("node:http");
const crypto = require("node:crypto");

const PORT = Number(process.env.PARTNER_API_PORT || 3001);

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "";
const SOLAPI_FROM = String(process.env.SOLAPI_FROM || "").replace(/\D/g, "");

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
  solapiApiKeyConfigured: Boolean(SOLAPI_API_KEY),
  solapiApiSecretConfigured: Boolean(SOLAPI_API_SECRET),
  solapiFromConfigured: Boolean(SOLAPI_FROM),
  solapiFrom: SOLAPI_FROM ? maskPhone(SOLAPI_FROM) : "",
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

function createSolapiAuthorization() {
  if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
    throw new Error("SOLAPI_API_KEY / SOLAPI_API_SECRET 환경변수가 없습니다.");
  }

  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString("hex");

  const signature = crypto
    .createHmac("sha256", SOLAPI_API_SECRET)
    .update(date + salt)
    .digest("hex");

  return `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;
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

우선권 단지
${priorityApartment.name}

신청번호
${applicationNo}

9월 29일 병원동행 파트너 가입 안내
오후 1시
부산시민회관 대강당

당일 본인 확인 및 보유 우대 자격증 확인을 진행합니다.
신분증, 운전면허증, 보유 우대 자격증(해당자)을 준비해주세요.`;
}

async function sendSolapiLms({ to, text, debugId }) {
  if (!SOLAPI_FROM) {
    const error = new Error("SOLAPI_FROM 환경변수가 없습니다.");
    error.code = "ENV_FROM_MISSING";
    throw error;
  }

  const requestStartedAt = Date.now();

  console.log("[SOLAPI SEND START]", {
    debugId,
    to: maskPhone(to),
    from: maskPhone(SOLAPI_FROM),
    textLength: text.length,
  });

  let response;
  let data = {};

  try {
    response = await fetch(
      "https://api.solapi.com/messages/v4/send-many/detail",
      {
        method: "POST",
        headers: {
          Authorization: createSolapiAuthorization(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              to,
              from: SOLAPI_FROM,
              text,
              type: "LMS",
              subject: "병원동행 파트너 신청 확인",
              country: "82",
            },
          ],
          strict: true,
          allowDuplicates: false,
          showMessageList: true,
        }),
      }
    );

    data = await response.json().catch(() => ({}));
  } catch (networkError) {
    console.error("[SOLAPI NETWORK ERROR]", {
      debugId,
      message: networkError?.message || String(networkError),
      elapsedMs: Date.now() - requestStartedAt,
    });

    const error = new Error("SOLAPI 서버 연결에 실패했습니다.");
    error.code = "SOLAPI_NETWORK_ERROR";
    error.causeMessage = networkError?.message || String(networkError);
    throw error;
  }

  console.log("[SOLAPI RESPONSE]", {
    debugId,
    httpStatus: response.status,
    ok: response.ok,
    elapsedMs: Date.now() - requestStartedAt,
    response: data,
  });

  if (!response.ok) {
    const error = new Error(
      String(
        data?.errorMessage ||
        data?.message ||
        data?.errorCode ||
        `SOLAPI HTTP ${response.status}`
      )
    );

    error.code = String(data?.errorCode || `HTTP_${response.status}`);
    error.httpStatus = response.status;
    error.solapiResponse = data;
    throw error;
  }

  return data;
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
    const result = await sendSolapiLms({
      to: applicantPhone,
      text,
      debugId,
    });

    const groupId =
      result?.groupInfo?.groupId ||
      result?.groupId ||
      "";

    console.log("[PARTNER APPLY OK]", {
      applicationNo,
      applicantName,
      applicantPhone,
      regions,
      priorityApartment,
      solapiGroupId: groupId,
      debugId,
      elapsedMs: Date.now() - startedAt,
    });

    return json(res, 200, {
      ok: true,
      applicationNo,
      submittedAt,
      smsRequestId: groupId,
      debugId,
    });
  } catch (error) {
    console.error("[PARTNER APPLY FAILED]", {
      debugId,
      code: error?.code || "",
      httpStatus: error?.httpStatus || "",
      message: error?.message || String(error),
      causeMessage: error?.causeMessage || "",
      solapiResponse: error?.solapiResponse || null,
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
      service: "partner-apply-solapi",
      environment: {
        apiKey: Boolean(SOLAPI_API_KEY),
        apiSecret: Boolean(SOLAPI_API_SECRET),
        from: Boolean(SOLAPI_FROM),
        fromMasked: SOLAPI_FROM ? maskPhone(SOLAPI_FROM) : "",
      },
      debugMode: PARTNER_DEBUG,
      serverTime: new Date().toISOString(),
    });
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
    `[partner-api] SOLAPI ready: http://127.0.0.1:${PORT}/api/partner/apply`
  );
});
