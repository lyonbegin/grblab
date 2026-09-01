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
    `[partner-api] NAVER SENS ready: http://127.0.0.1:${PORT}/api/partner/apply`
  );
});
