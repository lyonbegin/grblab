import React, { useEffect, useMemo, useRef, useState } from "react";

const NCP_CLIENT_ID = "fu193267aq";
const BUSAN = { lat: 35.1795543, lng: 129.0756416 };
const BUSAN_BOX = { south: 34.95, west: 128.72, north: 35.42, east: 129.32 };
const FONT = "-apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";

const MAX_NEIGHBORHOODS = 3;
const APARTMENTS_URL = "/busan-apartments-700plus-with-popularity.json";
// 신청과 문자 발송은 동일 출처 /api/partner/apply 서버에서 처리합니다.

const C = {
  ink: "#1f2329",
  muted: "#707782",
  line: "#e7e9ed",
  surface: "#ffffff",
  canvas: "#f5f4f2",
  brand: "#c95a70",
  brandSoft: "#fbf1f3",
  available: "#447d78",
  availableSoft: "#edf6f4",
  last: "#ad7a39",
  lastSoft: "#fbf4e9",
  full: "#9298a2",
  fullSoft: "#f1f2f4",
  navy: "#374151",
};

function apartmentStatusCircleSize(households) {
  const n = Math.max(0, Number(households) || 0);

  // 세대수에 선형 비례:
  // 1,000세대 = 22px
  // 2,000세대 = 44px
  // 3,000세대 = 66px
  // 4,000세대 = 88px
  // 700세대급은 너무 작아지지 않도록 최소 18px.
  return Math.max(18, Math.min(96, (n / 1000) * 22));
}

function apartmentPillMetrics(name, households) {
  const label = String(name || "");

  const circle = apartmentStatusCircleSize(households);
  const overlap = Math.min(8, Math.max(4, circle * 0.10));
  const pillHeight = 38;

  // 지도 라벨에는 아파트명만 표시한다.
  // 겹침은 줌으로 해결하므로 이름 가독성을 우선해 폭을 넉넉하게 잡는다.
  const labelWidth = Math.max(
    120,
    Math.min(320, 34 + Math.min(38, label.length) * 7.4)
  );

  return {
    labelWidth,
    pillHeight,
    circle,
    overlap,
    width: circle + labelWidth - overlap,
    height: Math.max(pillHeight, circle),
    labelLeft: circle - overlap,
  };
}

let _naverMapsLoadPromise = null;
function loadNaverMapsSDK(clientId) {
  if (_naverMapsLoadPromise) return _naverMapsLoadPromise;
  _naverMapsLoadPromise = new Promise((resolve, reject) => {
    if (window.naver?.maps?.Service) return resolve();
    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}&submodules=geocoder`;
    script.onload = resolve;
    script.onerror = () => {
      _naverMapsLoadPromise = null;
      reject(new Error("네이버 지도 SDK를 불러오지 못했습니다. NCP Web 서비스 URL을 확인하세요."));
    };
    document.head.appendChild(script);
  });
  return _naverMapsLoadPromise;
}

async function fetchAllApartments() {
  const res = await fetch(APARTMENTS_URL, {
    credentials: "omit",
    cache: "force-cache",
  });
  if (!res.ok) throw new Error(`${APARTMENTS_URL} HTTP ${res.status}`);

  const rows = await res.json();

  return rows.filter(
    (p) =>
      Number.isFinite(p.lat) &&
      Number.isFinite(p.lng) &&
      Number(p.households) > 0
  );
}



function apartmentKey(p) {
  return p.id || `${p.name}|${Number(p.lat).toFixed(6)}|${Number(p.lng).toFixed(6)}`;
}

function householdTier(n) {
  if (n >= 3000) return { label: "초대형 단지", size: 72 };
  if (n >= 2000) return { label: "초대형 단지", size: 64 };
  if (n >= 1500) return { label: "대형 단지", size: 58 };
  if (n >= 1000) return { label: "대단지", size: 52 };
  return { label: "대단지", size: 46 };
}


function popularityRegionKey(district, neighborhood) {
  return `${String(district || "").trim()}|${String(neighborhood || "").trim()}`;
}

function haversineKm(a, b) {
  const toRad = (value) => (Number(value) * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLat = lat2 - lat1;
  const dLng = toRad(Number(b.lng) - Number(a.lng));

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(h)));
}

function percentileRank(sortedValues, value) {
  if (!sortedValues.length) return 0;
  if (sortedValues.length === 1) return 1;

  let low = 0;
  let high = sortedValues.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (sortedValues[mid] <= value) low = mid + 1;
    else high = mid;
  }

  return Math.max(0, Math.min(1, low / sortedValues.length));
}

function popularityColor(level) {
  const colors = [
    "#ffffff",
    "#fde9ed",
    "#f7c2cc",
    "#ec7e91",
    "#d92f4c",
  ];

  return colors[Math.max(0, Math.min(4, Number(level || 1) - 1))];
}

function popularityStarColor(level) {
  return Number(level || 1) >= 4 ? "#ffffff" : "#b52f49";
}


function stableInterestRandom(p) {
  const source = `${p.id || ""}|${p.name || ""}|${p.district || ""}|${p.neighborhood || ""}`;
  let hash = 2166136261;

  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  // 0~1 사이의 고정된 값. 새로고침해도 같은 단지는 같은 값.
  return (hash >>> 0) / 4294967295;
}

function pointInBounds(p, b) {
  if (!b) return true;
  return p.lat >= b.south && p.lat <= b.north && p.lng >= b.west && p.lng <= b.east;
}

// 드래그 경계에서 마커가 갑자기 사라지지 않도록 화면보다 약간 넓게 유지한다.
function expandBounds(b, ratio = 0.20) {
  if (!b) return null;
  const latPad = (b.north - b.south) * ratio;
  const lngPad = (b.east - b.west) * ratio;
  return {
    south: b.south - latPad,
    north: b.north + latPad,
    west: b.west - lngPad,
    east: b.east + lngPad,
  };
}

function apartmentMarkerSize(households, zoom) {
  const n = Number(households) || 0;
  const rank = n >= 3000 ? 4 : n >= 2000 ? 3 : n >= 1500 ? 2 : n >= 1000 ? 1 : 0;
  if (zoom <= 12) return [18, 20, 22, 24, 27][rank];
  if (zoom === 13) return [28, 31, 34, 37, 40][rank];
  return [44, 50, 56, 62, 70][rank];
}

function aggregate(rows, keyFn) {
  const m = new Map();
  for (const p of rows) {
    const key = keyFn(p);
    if (!key) continue;
    const x = m.get(key) || { key, count: 0, households: 0, latSum: 0, lngSum: 0 };
    x.count += 1;
    x.households += Number(p.households) || 0;
    x.latSum += p.lat;
    x.lngSum += p.lng;
    m.set(key, x);
  }
  return [...m.values()].map((x) => ({ ...x, lat: x.latSum / x.count, lng: x.lngSum / x.count }));
}

function aggregateNeighborhoodHouseholds(rows) {
  const m = new Map();
  for (const p of rows) {
    if (!p.neighborhood) continue;
    const key = `${p.district}|${p.neighborhood}`;
    const x = m.get(key) || { key, district: p.district, neighborhood: p.neighborhood, count: 0, households: 0, latSum: 0, lngSum: 0 };
    x.count += 1;
    x.households += Number(p.households) || 0;
    x.latSum += p.lat;
    x.lngSum += p.lng;
    m.set(key, x);
  }
  return [...m.values()].map((x) => ({ ...x, lat: x.latSum / x.count, lng: x.lngSum / x.count }));
}


const svgProps = (size, color, strokeWidth = 2) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none",
  stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round",
});
function IconHospital({ size = 18, color = C.brand }) {
  return <svg {...svgProps(size, color)}><path d="M12 3v6M9 6h6"/><rect x="4" y="9" width="16" height="12" rx="2"/><path d="M8 21v-5h8v5"/></svg>;
}
function IconPin({ size = 16, color = C.brand }) {
  return <svg {...svgProps(size, color)}><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
}
function IconUsers({ size = 16, color = C.navy }) {
  return <svg {...svgProps(size, color)}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function IconChevronRight({ size = 18, color = C.muted }) {
  return <svg {...svgProps(size, color)}><path d="m9 18 6-6-6-6"/></svg>;
}
function IconChevronLeft({ size = 20, color = C.ink }) {
  return <svg {...svgProps(size, color)}><path d="m15 18-6-6 6-6"/></svg>;
}
function IconX({ size = 18, color = C.muted }) {
  return <svg {...svgProps(size, color)}><path d="M18 6 6 18M6 6l12 12"/></svg>;
}
function IconRefresh({ size = 16, color = C.muted }) {
  return <svg {...svgProps(size, color)}><path d="M20 4v5h-5"/><path d="M4 20v-5h5"/><path d="M5.5 9A7 7 0 0 1 17 6l3 3"/><path d="M18.5 15A7 7 0 0 1 7 18l-3-3"/></svg>;
}
function IconPlus({ size = 16, color = C.brand }) {
  return <svg {...svgProps(size, color)}><path d="M12 5v14M5 12h14"/></svg>;
}
function IconMinus({ size = 16, color = C.ink }) {
  return <svg {...svgProps(size, color)}><path d="M5 12h14"/></svg>;
}
function IconCheck({ size = 15, color = "#fff" }) {
  return <svg {...svgProps(size, color, 2.5)}><path d="m5 12 4 4L19 6"/></svg>;
}

const selectStyle = {
  flex: 1,
  minWidth: 0,
  height: 42,
  border: `1px solid ${C.line}`,
  borderRadius: 11,
  padding: "0 10px",
  fontSize: 13,
  fontWeight: 700,
  color: C.ink,
  background: "#fff",
};


function markerHtmlForApartment(
  p,
  isPriority,
  zoom,
  popularity = { level: 1, color: "#ffffff" }
) {
  const size = apartmentMarkerSize(p.households, zoom);

  if (zoom <= 13) {
    const circle = apartmentStatusCircleSize(p.households);
    return `
      <div style="
        width:${circle}px;
        height:${circle}px;
        border-radius:50%;
        background:${popularity.color};
        border:${isPriority ? "3px solid #a8243d" : popularity.level >= 4 ? "2px solid #d35b70" : "1.5px solid #d4d7dc"};
        box-shadow:${isPriority ? "0 0 0 5px rgba(201,90,112,.22),0 4px 12px rgba(31,35,41,.18)" : "0 3px 9px rgba(31,35,41,.14)"};
        display:grid;
        place-items:center;
        box-sizing:border-box;
        color:${popularityStarColor(popularity.level)};
        font-family:${FONT};
        font-weight:950;
        cursor:pointer;
      ">${isPriority ? "★" : ""}</div>`;
  }

  const m = apartmentPillMetrics(p.name, p.households);

  return `
    <div style="
      position:relative;
      width:${m.width + (isPriority ? 26 : 0)}px;
      height:${m.height}px;
      font-family:${FONT};
      cursor:pointer;
    ">
      <div style="
        position:absolute;
        left:${m.labelLeft}px;
        top:50%;
        transform:translateY(-50%);
        width:${m.labelWidth + (isPriority ? 26 : 0)}px;
        height:${m.pillHeight}px;
        border-radius:999px;
        background:#ffffff;
        border:1px solid ${isPriority ? C.brand : "#d8dde5"};
        box-shadow:${isPriority ? "0 4px 14px rgba(201,90,112,.20)" : "0 3px 10px rgba(31,35,41,.13)"};
        display:flex;
        align-items:center;
        padding:0 ${isPriority ? 40 : 14}px 0 ${Math.max(14, m.overlap + 10)}px;
        box-sizing:border-box;
        color:${isPriority ? "#8b3346" : "#20252c"};
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        font-size:11.5px;
        font-weight:850;
        letter-spacing:-.025em;
        z-index:1;
      ">
        <span style="display:block;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          ${String(p.name || "")}
        </span>

        ${isPriority ? `
          <div
            data-priority-clear="1"
            title="우선권 전담단지 해제"
            style="
              position:absolute;
              right:8px;
              top:50%;
              transform:translateY(-50%);
              width:22px;
              height:22px;
              border-radius:50%;
              background:#ffffff;
              border:1px solid #e3b2bd;
              color:${C.brand};
              display:grid;
              place-items:center;
              box-sizing:border-box;
              font-size:15px;
              line-height:1;
              font-weight:800;
              cursor:pointer;
              z-index:5;
              user-select:none;
            "
          >×</div>
        ` : ""}
      </div>

      <div style="
        position:absolute;
        left:0;
        top:50%;
        transform:translateY(-50%);
        width:${m.circle}px;
        height:${m.circle}px;
        border-radius:50%;
        background:${popularity.color};
        border:${isPriority ? "3px solid #a8243d" : popularity.level >= 4 ? "2px solid #d35b70" : "1.5px solid #d4d7dc"};
        box-shadow:${isPriority ? "0 0 0 5px rgba(201,90,112,.22),0 5px 14px rgba(31,35,41,.20)" : "0 4px 11px rgba(31,35,41,.16)"};
        display:grid;
        place-items:center;
        box-sizing:border-box;
        color:${popularityStarColor(popularity.level)};
        font-size:${m.circle >= 60 ? 18 : m.circle >= 40 ? 15 : 12}px;
        font-weight:950;
        z-index:2;
      ">
        ${isPriority ? "★" : ""}
      </div>
    </div>`;
}

function aggregateBubbleHtml(a, type, isSelected = false) {
  const label = type === "district" ? String(a.key) : String(a.neighborhood || a.key);
  const households = Number(a.households) || 0;
  const size = households >= 30000 ? 78 : households >= 20000 ? 72 : households >= 10000 ? 66 : households >= 5000 ? 60 : 56;
  const caption = type === "district" ? "구·군" : "동";
  const accent = type === "district" ? C.navy : C.brand;
  const bg = isSelected ? C.brand : "#fff";
  const mainText = isSelected ? "#fff" : "#1f2329";
  const subText = isSelected ? "rgba(255,255,255,.84)" : "#8a9099";
  const countText = isSelected ? "#fff" : accent;

  return `
    <div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${bg};
      border:2px solid ${accent};
      box-shadow:${isSelected ? "0 0 0 5px rgba(201,90,112,.18),0 5px 14px rgba(31,35,41,.18)" : "0 4px 12px rgba(31,35,41,.16)"};
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      font-family:${FONT};cursor:pointer;text-align:center;line-height:1.08;padding:4px;
    ">
      <div style="font-size:8.5px;color:${subText};font-weight:700;">${isSelected ? "선택됨" : caption}</div>
      <div style="font-size:10.5px;color:${mainText};font-weight:900;max-width:${size - 8}px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px;">${label}</div>
      <div style="font-size:${households >= 10000 ? 11.5 : 10.5}px;color:${countText};font-weight:900;margin-top:4px;letter-spacing:-.03em;">${households.toLocaleString("ko-KR")}세대</div>
    </div>`;
}

function PageHeader({ title, onBack, right }) {
  return (
    <div className="hp-local-page-header" style={{ height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", borderBottom: `1px solid ${C.line}`, background: "#fff", position: "sticky", top: 0, zIndex: 20 }}>
      <div style={{ width: 34 }}>{onBack && <button onClick={onBack} style={{ width: 34, height: 34, border: 0, background: "transparent", display: "grid", placeItems: "center" }}><IconChevronLeft/></button>}</div>
      <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-.02em" }}>{title}</div>
      <div style={{ width: 34, display: "flex", justifyContent: "flex-end" }}>{right || null}</div>
    </div>
  );
}

export default function HospitalPartnerPage() {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const mapEventsRef = useRef([]);
  const userDraggingRef = useRef(false);
  const districtSyncTimerRef = useRef(null);

  const [allApartments, setAllApartments] = useState([]);
  const [dataReady, setDataReady] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState(() => new Map());
  const selectedNeighborhoodsRef = useRef(new Map());
  const [priorityApartmentKey, setPriorityApartmentKey] = useState(null);
  const [page, setPage] = useState("main"); // main | summary | complete
  const [zoom, setZoom] = useState(11);
  const [bounds, setBounds] = useState(null);
  const [listLimit, setListLimit] = useState(12);
  const [apartmentSort, setApartmentSort] = useState("households"); // households | popularity
  const [mapListView, setMapListView] = useState("map"); // map | list
  const [isDesktopLayout, setIsDesktopLayout] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 980px)").matches
      : false
  );

  const [applicantName, setApplicantName] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicationNo, setApplicationNo] = useState("");
  const [applicationSubmittedAt, setApplicationSubmittedAt] = useState("");
  const [showCertificate, setShowCertificate] = useState(false);
  const mobileFocusRef = useRef(null);
  const [submitState, setSubmitState] = useState({ loading: false, error: "" });
  const [applicantModalOpen, setApplicantModalOpen] = useState(false);
  const [globalMenuOpen, setGlobalMenuOpen] = useState(false);

  // 고령 사용자용 단계 안내.
  // 처음에는 구 선택/지도 확대 방법부터 지도 위 큰 모달로 안내한다.
  const [guide, setGuide] = useState({ type: "start" });
  const [priorityStageStarted, setPriorityStageStarted] = useState(false);
  const dongGuideShownRef = useRef(false);

  useEffect(() => {
    selectedNeighborhoodsRef.current = selectedNeighborhoods;
  }, [selectedNeighborhoods]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 980px)");
    const sync = () => setIsDesktopLayout(media.matches);

    sync();
    media.addEventListener?.("change", sync);

    return () => {
      media.removeEventListener?.("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!applicantModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [applicantModalOpen]);

  useEffect(() => {
    if (!(isDesktopLayout && page === "complete")) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDesktopLayout, page]);

  // 지도 위 우선권 전담단지 알약의 오른쪽 X 버튼 처리.
  // Custom Naver Marker HTML 내부 클릭이므로 document capture에서 받아
  // 전체 마커 클릭(상세 열기)으로 전달되지 않게 차단한다.
  useEffect(() => {
    const stopPriorityClearPointer = (e) => {
      const target = e.target?.closest?.('[data-priority-clear="1"]');
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
    };

    const clearPriorityFromMarker = (e) => {
      const target = e.target?.closest?.('[data-priority-clear="1"]');
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      setPriorityApartmentKey(null);
    };

    document.addEventListener("pointerdown", stopPriorityClearPointer, true);
    document.addEventListener("mousedown", stopPriorityClearPointer, true);
    document.addEventListener("click", clearPriorityFromMarker, true);

    return () => {
      document.removeEventListener("pointerdown", stopPriorityClearPointer, true);
      document.removeEventListener("mousedown", stopPriorityClearPointer, true);
      document.removeEventListener("click", clearPriorityFromMarker, true);
    };
  }, []);

  useEffect(() => {
    let dead = false;

    let raf1 = 0;
    let raf2 = 0;

    const loadData = async () => {
      try {
        const rows = await fetchAllApartments();
        if (dead) return;

        const normalized = rows.map((p) => ({
          ...p,
          households: Number(p.households) || 0,
          neighborhood: String(p.neighborhood || "").trim(),
        }));

        const missingNeighborhood = normalized.filter((p) => !p.neighborhood);
        if (missingNeighborhood.length > 0) {
          console.warn(
            `[활동지역] neighborhood 없는 단지 ${missingNeighborhood.length}개`,
            missingNeighborhood.map((p) => p.name)
          );
        }

        if (dead) return;
        setAllApartments(normalized);
        setDataReady(true);
      } catch (e) {
        console.error(e);
        if (!dead) {
          setDataReady(true);
          setError(e?.message || "대단지 목록을 불러오지 못했습니다.");
        }
      }
    };

    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        if (!dead) loadData();
      });
    });

    return () => {
      dead = true;
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, []);

  const districts = useMemo(
    () => [...new Set(allApartments.map((p) => p.district).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko")),
    [allApartments]
  );

  // 구·군 셀렉터는 "필터"가 아니라 지도 이동용이다.
  // 실제 표시 대상과 아래 목록은 항상 현재 지도 화면(bounds)을 기준으로 계산한다.
  const listRows = useMemo(() => allApartments
    .filter((p) => pointInBounds(p, bounds))
    .sort((a, b) => b.households - a.households), [allApartments, bounds]);


  const apartmentPopularity = useMemo(() => {
    const result = new Map();

    allApartments.forEach((p) => {
      const popularity = p?.popularity;
      if (!popularity) return;

      result.set(apartmentKey(p), {
        score: Number(popularity.score) || 0,
        rank: Number(popularity.rank) || 0,
        level: Number(popularity.level) || 1,
        color: popularity.color || "#ffffff",
      });
    });

    return result;
  }, [allApartments]);

  const priorityApartment = useMemo(
    () => allApartments.find((p) => apartmentKey(p) === priorityApartmentKey) || null,
    [allApartments, priorityApartmentKey]
  );

  // 동 3곳을 고른 뒤에도 바로 단지 화면으로 넘어가지 않는다.
  // 완료 모달의 [우선권 전담단지 선택] 버튼을 눌러야 다음 단계가 시작된다.
  const priorityMode =
    priorityStageStarted &&
    selectedNeighborhoods.size === MAX_NEIGHBORHOODS;

  const selectedApartmentRows = useMemo(() => {
    if (selectedNeighborhoods.size !== MAX_NEIGHBORHOODS) return [];

    const selectedKeys = new Set(selectedNeighborhoods.keys());
    return allApartments
      .filter((p) => selectedKeys.has(neighborhoodKey(p.district, p.neighborhood)))
      .sort((a, b) => b.households - a.households);
  }, [allApartments, selectedNeighborhoods]);


  const sortedSelectedApartmentRows = useMemo(() => {
    const rows = [...selectedApartmentRows];

    if (apartmentSort === "popularity") {
      rows.sort((a, b) => {
        const aPopularity = apartmentPopularity.get(apartmentKey(a));
        const bPopularity = apartmentPopularity.get(apartmentKey(b));

        const aRank = aPopularity?.rank ?? 0;
        const bRank = bPopularity?.rank ?? 0;

        if (bRank !== aRank) return bRank - aRank;
        return Number(b.households || 0) - Number(a.households || 0);
      });
    } else {
      rows.sort(
        (a, b) =>
          Number(b.households || 0) - Number(a.households || 0)
      );
    }

    return rows;
  }, [selectedApartmentRows, apartmentSort, apartmentPopularity]);

  const visibleNeighborhoods = useMemo(
    () => aggregateNeighborhoodHouseholds(listRows),
    [listRows]
  );

  const districtAgg = useMemo(() => aggregate(allApartments, (p) => p.district), [allApartments]);

  function updateMapState() {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    const sw = b.getSW();
    const ne = b.getNE();
    setZoom(map.getZoom());
    setBounds({ south: sw.lat(), west: sw.lng(), north: ne.lat(), east: ne.lng() });
  }

  function fitPriorityRows(rows) {
    const map = mapRef.current;
    const nv = window.naver?.maps;
    if (!map || !nv || rows.length === 0) return;

    if (rows.length === 1) {
      map.setCenter(new nv.LatLng(rows[0].lat, rows[0].lng));
      map.setZoom(14);
      return;
    }

    const b = new nv.LatLngBounds();
    rows.forEach((p) => b.extend(new nv.LatLng(p.lat, p.lng)));

    // 선택한 3개 동의 모든 단지가 한 화면에 최대한 들어오도록 맞춘다.
    // 이때 나온 줌값이 10, 11, 12, 13이어도 개별 단지 알약 표시는 유지한다.
    map.fitBounds(b, { top: 62, right: 78, bottom: 62, left: 78 });

    window.setTimeout(updateMapState, 140);
  }

  function navigateToDistrict(district) {
    setSelectedDistrict(district);
    setListLimit(12);

    const map = mapRef.current;
    const nv = window.naver?.maps;
    if (!map || !nv) return;

    if (!district) {
      map.setCenter(new nv.LatLng(BUSAN.lat, BUSAN.lng));
      map.setZoom(11);
      window.setTimeout(updateMapState, 80);
      return;
    }

    const rows = allApartments.filter((p) => p.district === district);
    if (rows.length === 0) return;

    if (rows.length === 1) {
      map.setCenter(new nv.LatLng(rows[0].lat, rows[0].lng));
      map.setZoom(12);
      window.setTimeout(updateMapState, 80);
      return;
    }

    const b = new nv.LatLngBounds();
    rows.forEach((p) => b.extend(new nv.LatLng(p.lat, p.lng)));

    // 구·군을 누르면 해당 구 전체로 이동하고,
    // 최소 줌 12까지 확대해서 바로 '동' 마커 단계로 진입한다.
    map.fitBounds(b, { top: 52, right: 52, bottom: 52, left: 52 });

    window.setTimeout(() => {
      if (map.getZoom() < 12) {
        map.setZoom(12);
      }
      updateMapState();
    }, 140);
  }

  function syncDistrictSelectorFromMapCenter() {
    const map = mapRef.current;
    const nv = window.naver?.maps;
    if (!map || !nv) return;

    const center = map.getCenter();

    const fallbackToNearestComplex = () => {
      if (!allApartments.length) return;
      let best = null;
      let bestD = Infinity;
      const lat = center.lat();
      const lng = center.lng();

      for (const p of allApartments) {
        const dy = p.lat - lat;
        const dx = (p.lng - lng) * Math.cos(lat * Math.PI / 180);
        const d = dy * dy + dx * dx;
        if (d < bestD) {
          bestD = d;
          best = p;
        }
      }
      if (best?.district) setSelectedDistrict(best.district);
    };

    if (!nv.Service?.reverseGeocode) {
      fallbackToNearestComplex();
      return;
    }

    nv.Service.reverseGeocode(
      {
        coords: center,
        orders: [
          nv.Service.OrderType?.LEGAL_CODE,
          nv.Service.OrderType?.ADM_CODE,
          nv.Service.OrderType?.ADDR,
          nv.Service.OrderType?.ROAD_ADDR,
        ].filter(Boolean).join(","),
      },
      (status, response) => {
        if (status !== nv.Service.Status.OK) {
          fallbackToNearestComplex();
          return;
        }

        const results = response?.v2?.results || [];
        const district = results
          .map((r) => r?.region?.area2?.name)
          .find(Boolean);

        if (district) setSelectedDistrict(district);
        else fallbackToNearestComplex();
      }
    );
  }

  useEffect(() => {
    let dead = false;
    let raf1 = 0;
    let raf2 = 0;

    const initializeMap = async () => {
      try {
        await loadNaverMapsSDK(NCP_CLIENT_ID);
        if (dead || !mapElRef.current) return;

        const nv = window.naver.maps;
        const map = new nv.Map(mapElRef.current, {
          center: new nv.LatLng(BUSAN.lat, BUSAN.lng),
          zoom: 11,
          minZoom: 10,
          maxZoom: 18,
          maxBounds: new nv.LatLngBounds(
            new nv.LatLng(BUSAN_BOX.south, BUSAN_BOX.west),
            new nv.LatLng(BUSAN_BOX.north, BUSAN_BOX.east)
          ),
          logoControl: false,
          mapDataControl: false,
          scaleControl: false,
          mapTypeControl: false,
          zoomControl: false,
        });

        mapRef.current = map;
        mapEventsRef.current = [
          nv.Event.addListener(map, "dragstart", () => {
            userDraggingRef.current = true;
          }),
          nv.Event.addListener(map, "idle", () => {
            updateMapState();

            if (userDraggingRef.current) {
              userDraggingRef.current = false;
              clearTimeout(districtSyncTimerRef.current);
              districtSyncTimerRef.current = window.setTimeout(
                syncDistrictSelectorFromMapCenter,
                120
              );
            }
          }),
        ];

        updateMapState();
        if (!dead) setMapReady(true);
      } catch (e) {
        console.error(e);
        if (!dead) {
          setMapReady(true);
          setError(e?.message || "지도를 불러오지 못했습니다.");
        }
      }
    };

    // React의 첫 화면을 먼저 2프레임 그린 뒤 지도 SDK를 붙인다.
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        if (!dead) initializeMap();
      });
    });

    return () => {
      dead = true;
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      clearTimeout(districtSyncTimerRef.current);

      const nv = window.naver?.maps;

      markersRef.current.forEach(({ marker, listener }) => {
        if (listener && nv) nv.Event.removeListener(listener);
        marker.setMap(null);
      });

      markersRef.current.clear();

      if (nv) {
        mapEventsRef.current.forEach((listener) =>
          nv.Event.removeListener(listener)
        );
      }

      mapEventsRef.current = [];
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (
      page !== "main" ||
      (!isDesktopLayout && mapListView !== "map")
    ) return;

    const map = mapRef.current;
    const nv = window.naver?.maps;
    if (!map || !nv) return;

    const center = map.getCenter();

    const id = window.requestAnimationFrame(() => {
      nv.Event.trigger(map, "resize");
      if (center) map.setCenter(center);
    });

    return () => window.cancelAnimationFrame(id);
  }, [page, mapListView, priorityStageStarted, isDesktopLayout]);

  // 처음 구를 누르거나 사용자가 직접 줌인해서 동 단계(12+)에 들어오면
  // 지도 위에 큰 "동 이름을 하나 눌러주세요" 안내를 최초 1회 띄운다.
  useEffect(() => {
    if (page !== "main") return;
    if (priorityStageStarted) return;
    if (selectedNeighborhoods.size !== 0) return;
    if (zoom < 12) return;
    if (dongGuideShownRef.current) return;
    if (guide) return;

    dongGuideShownRef.current = true;
    setGuide({ type: "dongIntro" });
  }, [page, zoom, selectedNeighborhoods, priorityStageStarted, guide]);

  // 3개 동에서 다시 2개 이하로 줄어들면 우선권 단계도 종료한다.
  useEffect(() => {
    if (selectedNeighborhoods.size >= MAX_NEIGHBORHOODS) return;
    if (!priorityStageStarted) return;
    setPriorityStageStarted(false);
  }, [selectedNeighborhoods, priorityStageStarted]);

  // 상세/확인 화면에서는 메인 지도 DOM을 숨기기만 한다.
  // 다시 메인으로 돌아오면 Naver Map에 resize를 알려 현재 위치/줌 그대로 다시 그린다.
  useEffect(() => {
    if (page !== "main") return;

    const map = mapRef.current;
    const nv = window.naver?.maps;
    if (!map || !nv) return;

    const center = map.getCenter();

    const id = window.requestAnimationFrame(() => {
      nv.Event.trigger(map, "resize");
      if (center) map.setCenter(center);
      window.setTimeout(updateMapState, 0);
    });

    return () => window.cancelAnimationFrame(id);
  }, [page, isDesktopLayout]);


  // 3/3 완료 모달에서 [우선권 전담단지 선택]을 누른 뒤에만
  // 선택한 3개 동의 모든 단지를 한 화면에 들어오도록 자동 fit한다.
  useEffect(() => {
    if (!priorityMode || selectedApartmentRows.length === 0) return;

    const id = window.requestAnimationFrame(() => {
      fitPriorityRows(selectedApartmentRows);
    });

    return () => window.cancelAnimationFrame(id);
  }, [priorityMode, selectedNeighborhoods]);

  // 줌 단계:
  // 동 선택 모드:
  //   10~11 = 구·군 총 세대수
  //   구·군 클릭 = 해당 구로 자동 확대하여 줌 12 이상 → 동 마커 표시
  //   12 이상 = 동 총 세대수 (동을 눌러도 자동 확대하지 않음)
  // 우선권 전담단지 선택 모드:
  //   줌과 무관하게 선택한 3개 동의 개별 단지 알약만 표시
  useEffect(() => {
    const map = mapRef.current;
    const nv = window.naver?.maps;
    if (!map || !nv || allApartments.length === 0) return;

    const desired = new Map();

    function upsertMarker(key, spec, onClick) {
      desired.set(key, true);
      const current = markersRef.current.get(key);
      if (current) {
        current.marker.setPosition(spec.position);
        current.marker.setIcon(spec.icon);
        current.marker.setZIndex(spec.zIndex || 0);
        if (spec.title != null) current.marker.setTitle(spec.title);

        // 중요: 기존 listener는 최초 렌더의 state를 기억할 수 있으므로
        // 매번 최신 onClick으로 교체한다.
        if (current.listener) nv.Event.removeListener(current.listener);
        current.listener = nv.Event.addListener(current.marker, "click", onClick);
        return;
      }
      const marker = new nv.Marker({ ...spec, map });
      const listener = nv.Event.addListener(marker, "click", onClick);
      markersRef.current.set(key, { marker, listener });
    }

    const buffered = expandBounds(bounds, 0.22);
    const visibleRows = allApartments.filter((p) => pointInBounds(p, buffered));

    if (priorityMode) {
      // 3개 동 선택 완료 후:
      // 선택한 3개 동의 단지만, 현재 bounds/zoom과 상관없이 전부 개별 알약으로 표시.
      selectedApartmentRows.forEach((p) => {
        const apartmentId = apartmentKey(p);
        const key = `priority-apt:${apartmentId}`;
        const isPriority = priorityApartmentKey === apartmentId;
        const popularity =
          apartmentPopularity.get(apartmentId) || {
            level: 1,
            color: "#ffffff",
          };
        const pill = apartmentPillMetrics(p.name, p.households);

        upsertMarker(
          key,
          {
            position: new nv.LatLng(p.lat, p.lng),
            title: p.name,
            zIndex: isPriority ? 220 : 60,
            icon: {
              // 강제로 14를 넘겨서, 실제 지도 줌값이 낮아도 항상 알약 마커를 그린다.
              content: markerHtmlForApartment(
                p,
                isPriority,
                14,
                popularity
              ),
              anchor: new nv.Point(pill.circle / 2, pill.height / 2),
            },
          },
          () => setPriorityApartment(p)
        );
      });
    } else if (zoom <= 11) {
      districtAgg.forEach((a) => {
        const key = `district:${a.key}`;
        const size = a.households >= 30000 ? 78 : a.households >= 20000 ? 72 : a.households >= 10000 ? 66 : a.households >= 5000 ? 60 : 56;
        upsertMarker(key, {
          position: new nv.LatLng(a.lat, a.lng),
          zIndex: selectedDistrict === a.key ? 80 : 20,
          title: a.key,
          icon: {
            content: aggregateBubbleHtml(a, "district", false),
            anchor: new nv.Point(size / 2, size / 2),
          },
        }, () => navigateToDistrict(a.key));
      });
    } else {
      // 동 선택이 3/3 완료되기 전에는, 줌 14 이상으로 사용자가 직접 확대해도
      // 개별 아파트로 바꾸지 않고 계속 동 단위 마커를 유지한다.
      const neighborhoods = aggregateNeighborhoodHouseholds(visibleRows);

      neighborhoods.forEach((a) => {
        const nKey = `${a.district}|${a.neighborhood}`;
        const isSelected = selectedNeighborhoods.has(nKey);
        const key = `dong:${nKey}`;
        const size =
          a.households >= 30000 ? 78 :
          a.households >= 20000 ? 72 :
          a.households >= 10000 ? 66 :
          a.households >= 5000 ? 60 : 56;

        upsertMarker(
          key,
          {
            position: new nv.LatLng(a.lat, a.lng),
            zIndex: isSelected ? 120 : 40,
            title: `${a.district} ${a.neighborhood}`,
            icon: {
              content: aggregateBubbleHtml(a, "neighborhood", isSelected),
              anchor: new nv.Point(size / 2, size / 2),
            },
          },
          () => {
            // 동을 눌렀을 때는 선택만 한다.
            // 지도 확대 / fitRows / 개별 단지 전환은 하지 않는다.
            selectNeighborhood(a);
            setSelectedDistrict(a.district);
          }
        );
      });
    }

    for (const [key, item] of markersRef.current.entries()) {
      if (desired.has(key)) continue;
      if (item.listener) nv.Event.removeListener(item.listener);
      item.marker.setMap(null);
      markersRef.current.delete(key);
    }
  }, [zoom, bounds, allApartments, districtAgg, selectedNeighborhoods, selectedApartmentRows, priorityMode, priorityApartmentKey, selectedDistrict, apartmentPopularity]);

  function neighborhoodKey(district, neighborhood) {
    return `${district}|${neighborhood}`;
  }

  function selectNeighborhood(a) {
    if (!a?.district || !a?.neighborhood) return;

    const key = neighborhoodKey(a.district, a.neighborhood);
    const current = selectedNeighborhoodsRef.current;

    if (current.has(key)) return;
    if (current.size >= MAX_NEIGHBORHOODS) return;

    const next = new Map(current);
    next.set(key, {
      district: a.district,
      neighborhood: a.neighborhood,
      households: Number(a.households) || allApartments
        .filter((p) => p.district === a.district && p.neighborhood === a.neighborhood)
        .reduce((s, p) => s + p.households, 0),
      count: Number(a.count) || allApartments
        .filter((p) => p.district === a.district && p.neighborhood === a.neighborhood).length,
    });

    // React state 반영 전에 ref부터 최신 상태로 갱신한다.
    // 따라서 연속된 마커 클릭에서도 선택 개수가 틀리지 않는다.
    selectedNeighborhoodsRef.current = next;
    setSelectedNeighborhoods(next);

    const nextCount = next.size;

    if (nextCount < MAX_NEIGHBORHOODS) {
      setGuide({
        type: "dongProgress",
        neighborhood: a.neighborhood,
        count: nextCount,
      });
    } else {
      setPriorityStageStarted(false);
      setGuide({
        type: "dongComplete",
        neighborhood: a.neighborhood,
        count: MAX_NEIGHBORHOODS,
      });
    }
  }

  function toggleNeighborhood(a) {
    if (!a?.district || !a?.neighborhood) return;

    const key = neighborhoodKey(a.district, a.neighborhood);

    if (!selectedNeighborhoods.has(key)) {
      selectNeighborhood(a);
      return;
    }

    const next = new Map(selectedNeighborhoodsRef.current);
    next.delete(key);
    selectedNeighborhoodsRef.current = next;
    setSelectedNeighborhoods(next);

    const priority = allApartments.find(
      (p) => apartmentKey(p) === priorityApartmentKey
    );
    if (
      priority &&
      neighborhoodKey(priority.district, priority.neighborhood) === key
    ) {
      setPriorityApartmentKey(null);
    }

    setPriorityStageStarted(false);
    setGuide(null);
  }

  function setPriorityApartment(p) {
    if (!p?.neighborhood) return;

    const nKey = neighborhoodKey(p.district, p.neighborhood);
    if (!selectedNeighborhoods.has(nKey)) return;

    const key = apartmentKey(p);

    // 지도 또는 목록에서 단지를 누르는 순간
    // 새 선택/교체 모두 바로 우선권 전담단지로 확정하고 신청 내용 확인으로 이동한다.
    setPriorityApartmentKey(key);
    setPage("summary");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleGuideAction() {
    if (!guide) return;

    if (guide.type === "dongComplete") {
      if (selectedNeighborhoodsRef.current.size !== MAX_NEIGHBORHOODS) return;
      setPriorityStageStarted(true);
      setMapListView("map");
      setGuide({ type: "priorityIntro" });
      return;
    }

    setGuide(null);
  }

  function renderMapGuide() {
    if (!guide || page !== "main") return null;
    if (guide.type === "dongComplete") return null;

    const selectedNames = [...selectedNeighborhoods.values()].map(
      (n) => n.neighborhood
    );

    let title = "";
    let body = "";
    let progress = null;
    let button = "확인";
    let accent = false;

    if (guide.type === "start") {
      title = "동 이름을 하나 눌러주세요";
      body = "먼저 원하는 구를 선택하거나 지도를 확대하면 동을 볼 수 있습니다.";
      button = "확인";
    } else if (guide.type === "dongIntro") {
      title = "활동할 동을 선택해주세요";
      body = "지도에 보이는 동 이름을 하나 눌러주세요.";
      progress = "0 / 3";
      button = "확인";
    } else if (guide.type === "dongProgress") {
      const remaining = MAX_NEIGHBORHOODS - Number(guide.count || 0);
      title = `✓ ${guide.neighborhood} 선택 완료`;
      body =
        remaining === 1
          ? "이제 1곳 남았어요. 마지막으로 활동할 동 이름을 눌러주세요."
          : `${remaining}곳 더 남았어요. 지도에서 다른 동 이름을 하나 더 눌러주세요.`;
      progress = `${guide.count} / ${MAX_NEIGHBORHOODS}`;
      button = remaining === 1 ? "마지막 동 선택하기" : "계속 선택하기";
    } else if (guide.type === "dongComplete") {
      title = "활동지역 선택 완료";
      body = "이제 선택한 3개 동의 대단지 중에서 우선권 전담단지 1곳을 선택합니다.";
      progress = "3 / 3";
      button = "우선권 전담단지 선택";
      accent = true;
    } else if (guide.type === "priorityIntro") {
      title = "우선권 전담단지를 선택해주세요";
      body = "선택한 3개 동의 대단지만 표시했습니다. 원하는 단지 이름을 누르면 바로 우선권 전담단지로 선택됩니다.";
      button = "확인";
      accent = true;
    }

    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 40,
          background: "rgba(31,35,41,.42)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 18,
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          style={{
            width: "100%",
            maxWidth: 330,
            background: "#fff",
            borderRadius: 20,
            padding: "22px 20px 18px",
            boxShadow: "0 18px 48px rgba(0,0,0,.24)",
            textAlign: "center",
            border: accent ? `2px solid #e8b4c0` : "1px solid rgba(255,255,255,.8)",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              margin: "0 auto",
              borderRadius: "50%",
              background: accent ? C.brand : C.brandSoft,
              color: accent ? "#fff" : C.brand,
              display: "grid",
              placeItems: "center",
              fontSize: 20,
              fontWeight: 950,
            }}
          >
            {guide.type === "dongComplete" ? "✓" : guide.type === "priorityIntro" ? "★" : "!"}
          </div>

          <div
            style={{
              marginTop: 13,
              fontSize: 21,
              lineHeight: 1.3,
              fontWeight: 950,
              letterSpacing: "-.035em",
              color: C.ink,
            }}
          >
            {title}
          </div>

          {progress && (
            <div
              style={{
                margin: "12px auto 0",
                width: 92,
                height: 40,
                borderRadius: 999,
                background: guide.type === "dongComplete" ? C.brand : C.brandSoft,
                color: guide.type === "dongComplete" ? "#fff" : C.brand,
                display: "grid",
                placeItems: "center",
                fontSize: 18,
                fontWeight: 950,
              }}
            >
              {progress}
            </div>
          )}

          {guide.type === "dongComplete" && selectedNames.length > 0 && (
            <div
              style={{
                marginTop: 12,
                display: "flex",
                justifyContent: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              {selectedNames.map((name) => (
                <span
                  key={name}
                  style={{
                    padding: "6px 9px",
                    borderRadius: 999,
                    background: "#faf6f7",
                    border: `1px solid #ecd0d6`,
                    color: C.brand,
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  ✓ {name}
                </span>
              ))}
            </div>
          )}

          <div
            style={{
              marginTop: 13,
              fontSize: 15,
              lineHeight: 1.65,
              color: C.muted,
              fontWeight: 750,
              wordBreak: "keep-all",
            }}
          >
            {body}
          </div>

          {guide.type === "start" && (
            <div
              style={{
                marginTop: 13,
                padding: "11px 12px",
                borderRadius: 12,
                background: "#faf9f8",
                textAlign: "left",
                fontSize: 13,
                lineHeight: 1.7,
                color: C.ink,
                fontWeight: 800,
              }}
            >
              <div>① <strong>구·군 선택</strong></div>
              <div>② 지도 확대 후 <strong>동 선택</strong></div>
            </div>
          )}

          <button
            type="button"
            onClick={handleGuideAction}
            style={{
              width: "100%",
              height: 50,
              marginTop: 17,
              border: 0,
              borderRadius: 14,
              background: C.brand,
              color: "#fff",
              fontSize: 15,
              fontWeight: 950,
              cursor: "pointer",
            }}
          >
            {button}
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const shouldLock =
      page === "main" &&
      guide?.type === "dongComplete";

    if (!shouldLock) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [page, guide?.type]);

  useEffect(() => {
    if (
      page !== "main" ||
      priorityMode ||
      selectedNeighborhoods.size <= 0 ||
      selectedNeighborhoods.size >= MAX_NEIGHBORHOODS
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      mobileFocusRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      window.setTimeout(() => {
        window.scrollBy({ top: -8, behavior: "smooth" });
      }, 180);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [page, priorityMode, selectedNeighborhoods.size]);

  function renderPriorityTransitionGuide() {
    if (
      page !== "main" ||
      !guide ||
      guide.type !== "dongComplete"
    ) {
      return null;
    }

    const selectedNames = [...selectedNeighborhoods.values()].map(
      (n) => n.neighborhood
    );

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="우선권 전담단지 선택 안내"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          background: isDesktopLayout
            ? "rgba(31,35,41,.44)"
            : "#f3f1ef",
          overflowY: "auto",
          overscrollBehavior: "contain",
          display: isDesktopLayout ? "grid" : "block",
          placeItems: isDesktopLayout ? "center" : undefined,
          padding: isDesktopLayout ? 28 : 0,
        }}
      >
        <div
          style={{
            width: isDesktopLayout ? "min(560px, calc(100vw - 56px))" : "100%",
            maxWidth: isDesktopLayout ? 560 : 520,
            minHeight: isDesktopLayout ? 0 : "100dvh",
            maxHeight: isDesktopLayout ? "calc(100vh - 56px)" : undefined,
            margin: isDesktopLayout ? 0 : "0 auto",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            borderRadius: isDesktopLayout ? 22 : 0,
            overflow: isDesktopLayout ? "hidden" : "visible",
            boxShadow: isDesktopLayout
              ? "0 28px 80px rgba(20,24,32,.28)"
              : "none",
          }}
        >
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 4,
              background: "rgba(255,255,255,.98)",
              backdropFilter: "blur(14px)",
              borderBottom: `1px solid ${C.line}`,
              padding: "10px 16px 9px",
            }}
          >
            <div
              style={{
                width: 38,
                height: 4,
                margin: "0 auto 8px",
                borderRadius: 999,
                background: "#e4e2e2",
              }}
            />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 950, letterSpacing: "-.035em" }}>
                나눔이음
              </div>
              <div
                style={{
                  padding: "5px 8px",
                  borderRadius: 999,
                  background: C.brandSoft,
                  color: C.brand,
                  fontSize: 10.5,
                  fontWeight: 900,
                }}
              >
                2 / 4 · 전담단지 선택
              </div>
            </div>

            <div
              style={{
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 10.5,
                fontWeight: 850,
                color: C.muted,
              }}
            >
              <span style={{ color: C.brand }}>✓ 활동지역 완료</span>
              <span>→</span>
              <span style={{ color: C.ink }}>우선권 전담단지</span>
              <span>→</span>
              <span>신청정보</span>
            </div>
          </div>

          <main
            style={{
              flex: "1 1 auto",
              padding: isDesktopLayout
                ? "16px 16px 18px"
                : "16px 16px 140px",
              overflowY: isDesktopLayout ? "auto" : "visible",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  margin: "0 auto",
                  borderRadius: "50%",
                  background: C.brand,
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 19,
                  fontWeight: 950,
                  boxShadow: "0 8px 22px rgba(208,90,114,.22)",
                }}
              >
                ✓
              </div>

              <h2
                style={{
                  margin: "11px 0 0",
                  fontSize: 22,
                  lineHeight: 1.3,
                  letterSpacing: "-.045em",
                  color: C.ink,
                }}
              >
                활동지역 선택이 완료되었습니다
              </h2>

              <p
                style={{
                  margin: "7px auto 0",
                  maxWidth: 390,
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: C.muted,
                  fontWeight: 750,
                  wordBreak: "keep-all",
                }}
              >
                이제 선택한 3개 동 안에서
                <br/>
                <strong style={{ color: C.brand }}>예약 우선권을 받을 전담단지 1곳</strong>을 선택합니다.
              </p>
            </div>

            <section
              style={{
                marginTop: 14,
                padding: "12px 13px",
                borderRadius: 14,
                background: "#faf8f7",
                border: `1px solid ${C.line}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 850 }}>
                  내가 선택한 활동지역
                </div>
                <div style={{ fontSize: 11.5, color: C.brand, fontWeight: 950 }}>
                  3 / 3 완료
                </div>
              </div>

              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                {selectedNames.map((name) => (
                  <span
                    key={name}
                    style={{
                      minHeight: 30,
                      padding: "6px 9px",
                      borderRadius: 999,
                      background: "#fff",
                      border: "1px solid #e8c0ca",
                      color: C.brand,
                      fontSize: 12,
                      fontWeight: 900,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span>✓</span>
                    <span>{name}</span>
                  </span>
                ))}
              </div>
            </section>

            <div
              style={{
                marginTop: 12,
                width: "100%",
                borderRadius: 16,
                overflow: "hidden",
                background: "#fff",
                border: "1px solid #f0d2d8",
              }}
            >
              <img
                src="/hospital-priority-guide.png"
                alt="우선권 전담단지 안내. 선택한 전담단지는 해당 단지와 주변의 병원동행 예약 신청을 다른 파트너보다 가장 먼저 받아볼 수 있습니다."
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  aspectRatio: "4 / 3",
                  objectFit: "cover",
                }}
              />
            </div>

          </main>

          <div
            style={{
              position: isDesktopLayout ? "relative" : "fixed",
              left: isDesktopLayout ? "auto" : "50%",
              bottom: isDesktopLayout ? "auto" : 0,
              transform: isDesktopLayout ? "none" : "translateX(-50%)",
              width: isDesktopLayout ? "100%" : "100%",
              maxWidth: isDesktopLayout ? "none" : 520,
              zIndex: 1002,
              padding: isDesktopLayout
                ? "10px 14px 12px"
                : "10px 14px calc(10px + env(safe-area-inset-bottom))",
              background: "rgba(255,255,255,.98)",
              borderTop: `1px solid ${C.line}`,
              backdropFilter: "blur(14px)",
              flex: "0 0 auto",
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (selectedNeighborhoodsRef.current.size !== MAX_NEIGHBORHOODS) return;
                setPriorityStageStarted(true);
                setMapListView("map");
                setGuide({ type: "priorityIntro" });
                window.scrollTo({ top: 0, behavior: "instant" });
              }}
              style={{
                width: "100%",
                height: 52,
                border: 0,
                borderRadius: 15,
                background: C.brand,
                color: "#fff",
                fontSize: 16,
                fontWeight: 950,
                boxShadow: "0 8px 18px rgba(208,90,114,.20)",
              }}
            >
              우선권 전담단지 선택하기
            </button>

            <button
              type="button"
              onClick={() => setGuide(null)}
              style={{
                width: "100%",
                height: 38,
                marginTop: 4,
                border: 0,
                background: "transparent",
                color: C.muted,
                fontSize: 12.5,
                fontWeight: 850,
              }}
            >
              활동지역 다시 선택
            </button>
          </div>
        </div>
      </div>
    );
  }

  function goToApplicationStep(stepNo, activeStep) {
    if (activeStep >= 4 || stepNo >= activeStep) return;

    if (stepNo === 1) {
      setPage("main");
      setPriorityStageStarted(false);
      setGuide(null);
      setMapListView("map");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (stepNo === 2 && selectedNeighborhoodsRef.current.size === MAX_NEIGHBORHOODS) {
      setPage("main");
      setPriorityStageStarted(true);
      setGuide(null);
      setMapListView("map");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function renderApplicationProgress(activeStep = 1) {
    const steps = [
      { no: 1, label: "활동지역" },
      { no: 2, label: "전담단지" },
      { no: 3, label: "신청자 정보" },
      { no: 4, label: "신청 완료" },
    ];

    return (
      <div style={{ marginTop: 17 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", alignItems: "center" }}>
          {steps.map((step, index) => {
            const active = step.no === activeStep;
            const done = step.no < activeStep;
            const canGoBack = activeStep < 4 && done && step.no <= 2;

            return (
              <button
                key={step.no}
                type="button"
                disabled={!canGoBack}
                onClick={() => goToApplicationStep(step.no, activeStep)}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    index === 0
                      ? "flex-start"
                      : index === steps.length - 1
                        ? "flex-end"
                        : "center",
                  minWidth: 0,
                  width: "100%",
                  border: 0,
                  padding: 0,
                  background: "transparent",
                  cursor: canGoBack ? "pointer" : "default",
                }}
              >
                {index > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      right: "50%",
                      top: 17,
                      width: "50%",
                      height: 1,
                      background: done || active ? "#e9c1ca" : "#e5e7eb",
                      zIndex: 0,
                    }}
                  />
                )}
                {index < steps.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: 17,
                      width: "50%",
                      height: 1,
                      background: done ? "#e9c1ca" : "#e5e7eb",
                      zIndex: 0,
                    }}
                  />
                )}

                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    background: "#fff",
                    padding: "0 5px",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      flex: "0 0 auto",
                      background: active ? C.brand : done ? C.brandSoft : "#fff",
                      border: active ? `1px solid ${C.brand}` : done ? "1px solid #e7bdc7" : "1px solid #d7dbe1",
                      color: active ? "#fff" : done ? C.brand : "#8b9098",
                      fontSize: 12.5,
                      fontWeight: 950,
                    }}
                  >
                    {done ? "✓" : step.no}
                  </div>

                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: active ? 950 : 800,
                      color: active ? C.brand : done ? C.ink : "#7e838b",
                      whiteSpace: "nowrap",
                      letterSpacing: "-.02em",
                    }}
                  >
                    {step.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 13,
            height: 2,
            borderRadius: 999,
            background: "#f0f1f3",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width:
                activeStep === 1
                  ? "25%"
                  : activeStep === 2
                    ? "50%"
                    : activeStep === 3
                      ? "75%"
                      : "100%",
              height: "100%",
              background: C.brand,
            }}
          />
        </div>
      </div>
    );
  }

  function renderGlobalHeader() {
    return (
      <header className="hp-global-header">
        <div className="hp-global-shell">
          <a
            className="hp-global-brand"
            href="/hpartners.html"
            aria-label="나눔이음 메인"
          >
            <span>나눔</span><b>이음</b>
          </a>

          <nav className="hp-global-nav" aria-label="나눔이음 주요 메뉴">
            <a href="/nanumieum_portal.html#cases">대표 이음 사례</a>
            <a href="/nanumieum_portal.html#together">후원과 세금혜택</a>
            <a href="/nanumieum_portal.html#archive">나눔 아카이브</a>
            <a href="/bazaar/bazaar.html">나눔이음바자</a>
            <a
              className="hp-global-current"
              href="/hpartners.html"
              aria-current="page"
            >
              병원동행 파트너스
            </a>
          </nav>

          <a className="hp-global-cta" href="/apply-concert.html">
            총회 & 음악회 참석신청
          </a>

          <button
            type="button"
            className="hp-global-menu-button"
            aria-label={globalMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={globalMenuOpen}
            onClick={() => setGlobalMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {globalMenuOpen && (
          <nav className="hp-global-mobile-nav" aria-label="모바일 메뉴">
            <a href="/nanumieum_portal.html#cases">대표 이음 사례</a>
            <a href="/nanumieum_portal.html#together">후원과 세금혜택</a>
            <a href="/nanumieum_portal.html#archive">나눔 아카이브</a>
            <a href="/bazaar/bazaar.html">나눔이음바자</a>
            <a className="hp-global-current" href="/hpartners.html">
              병원동행 파트너스
            </a>
            <a href="/apply-concert.html">총회 & 음악회 참석신청</a>
          </nav>
        )}
      </header>
    );
  }

  function renderMain() {
    const initialResourcesReady = dataReady && mapReady;
    const neighborhoodMode = !priorityMode && zoom >= 12;
    const apartmentMode = priorityMode;
    const remainingNeighborhoods = Math.max(
      0,
      MAX_NEIGHBORHOODS - selectedNeighborhoods.size
    );
    const compactActivityMode =
      !priorityMode && selectedNeighborhoods.size > 0;

    return (
      <>
        {renderPriorityTransitionGuide()}

        <header style={{ padding: "16px 18px 12px", background: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div
              style={{
                padding: "7px 10px",
                borderRadius: 999,
                background: C.brandSoft,
                color: C.brand,
                fontSize: 11.5,
                fontWeight: 900,
              }}
            >
              {priorityMode ? "우선권 전담단지" : "활동지역 선택"}
            </div>
          </div>

          {renderApplicationProgress(priorityMode ? 2 : 1)}

          <div style={{ marginTop: compactActivityMode ? 16 : 26 }}>
            <h1
              style={{
                margin: 0,
                fontSize: compactActivityMode ? 22 : 29,
                lineHeight: 1.25,
                letterSpacing: "-.045em",
                color: C.ink,
              }}
            >
              {priorityMode
                ? "우선권 전담단지를 선택해주세요"
                : compactActivityMode
                  ? `활동지역 ${selectedNeighborhoods.size} / ${MAX_NEIGHBORHOODS}`
                  : "병원동행 파트너 신청"}
            </h1>

            {!priorityMode && !compactActivityMode ? (
              <div style={{ marginTop: 11 }}>
                <div
                  style={{
                    fontSize: 16,
                    lineHeight: 1.55,
                    fontWeight: 800,
                    color: C.ink,
                  }}
                >
                  지원해주셔서 감사합니다.
                </div>
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 15,
                    lineHeight: 1.6,
                    color: C.muted,
                    fontWeight: 700,
                  }}
                >
                  먼저 활동할 지역을 선택해주세요.
                </div>
              </div>
            ) : priorityMode ? (
              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: 13.5,
                  color: C.muted,
                  lineHeight: 1.6,
                  fontWeight: 700,
                }}
              >
                선택한 3개 동의 대단지 중에서 우선권 전담단지 1곳을 선택해주세요.
              </p>
            ) : null}
          </div>

          {(isDesktopLayout || mapListView === "list") && !priorityMode && !compactActivityMode && (
            <div
              style={{
                marginTop: 22,
                padding: "18px 16px",
                border: `1px solid ${C.line}`,
                borderRadius: 17,
                background: "#fff",
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 950,
                  letterSpacing: "-.025em",
                  color: C.ink,
                }}
              >
                어느 구에서 활동하시겠어요?
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
                <div
                  style={{
                    height: 48,
                    padding: "0 13px",
                    border: `1px solid ${C.line}`,
                    borderRadius: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: 14,
                    fontWeight: 900,
                    background: "#fff",
                    flex: "0 0 auto",
                  }}
                >
                  <IconPin size={15}/> 부산
                </div>

                <select
                  value={selectedDistrict}
                  onChange={(e) => navigateToDistrict(e.target.value)}
                  style={{
                    ...selectStyle,
                    height: 48,
                    borderRadius: 13,
                    fontSize: 14,
                    fontWeight: 850,
                  }}
                >
                  <option value="">구·군 선택</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {!priorityMode && compactActivityMode && (
            <div
              ref={mobileFocusRef}
              style={{
                marginTop: 14,
                padding: "14px 14px 15px",
                border: `1px solid ${C.line}`,
                borderRadius: 15,
                background: "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  minHeight: 31,
                }}
              >
                {[...selectedNeighborhoods.values()].map((n) => (
                  <button
                    key={neighborhoodKey(n.district, n.neighborhood)}
                    type="button"
                    onClick={() => toggleNeighborhood(n)}
                    style={{
                      height: 31,
                      padding: "0 10px",
                      borderRadius: 999,
                      border: "1px solid #e7bcc6",
                      background: C.brandSoft,
                      color: C.brand,
                      fontSize: 11.5,
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    {n.neighborhood} <IconX size={12} color={C.brand}/>
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                <div
                  style={{
                    height: 44,
                    padding: "0 11px",
                    border: `1px solid ${C.line}`,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 900,
                    background: "#fff",
                    flex: "0 0 auto",
                  }}
                >
                  <IconPin size={14}/> 부산
                </div>

                <select
                  value={selectedDistrict}
                  onChange={(e) => navigateToDistrict(e.target.value)}
                  style={{
                    ...selectStyle,
                    height: 44,
                    borderRadius: 12,
                    fontSize: 13.5,
                    fontWeight: 850,
                  }}
                >
                  <option value="">구·군 선택</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {priorityMode && (
            <>
              <div
                style={{
                  marginTop: 18,
                  padding: "14px 15px",
                  borderRadius: 15,
                  background: "#faf9f8",
                  border: `1px solid ${C.line}`,
                }}
              >
                <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 800 }}>
                  선택한 활동지역
                </div>
                <div
                  style={{
                    marginTop: 7,
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  {[...selectedNeighborhoods.values()].map((n) => (
                    <span
                      key={neighborhoodKey(n.district, n.neighborhood)}
                      style={{
                        padding: "7px 10px",
                        borderRadius: 999,
                        background: "#fff",
                        border: `1px solid #e8c4cc`,
                        color: C.brand,
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      {n.neighborhood}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </header>

        {!isDesktopLayout && (neighborhoodMode || apartmentMode) && (
          <div
            style={{
              padding: "0 18px 10px",
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 5,
                padding: 4,
                borderRadius: 13,
                background: "#f3f4f6",
                border: `1px solid ${C.line}`,
              }}
            >
              {[
                ["map", "지도로 보기"],
                ["list", "리스트로 보기"],
              ].map(([value, label]) => {
                const active = mapListView === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setMapListView(value);

                      if (value === "map") {
                        window.requestAnimationFrame(() => {
                          const map = mapRef.current;
                          const nv = window.naver?.maps;
                          if (!map || !nv) return;
                          const center = map.getCenter();
                          nv.Event.trigger(map, "resize");
                          if (center) map.setCenter(center);
                        });
                      }
                    }}
                    style={{
                      minHeight: 42,
                      border: 0,
                      borderRadius: 10,
                      background: active ? "#fff" : "transparent",
                      color: active ? C.brand : C.muted,
                      fontSize: 13.5,
                      fontWeight: active ? 950 : 850,
                      boxShadow: active
                        ? "0 1px 5px rgba(31,35,41,.10)"
                        : "none",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {priorityMode && (isDesktopLayout || mapListView === "map") && (
          <div
            style={{
              padding: "0 18px 9px",
              background: "#fff",
            }}
          >
            <div
              style={{
                minHeight: 34,
                padding: "7px 10px",
                borderRadius: 11,
                border: `1px solid ${C.line}`,
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 900,
                  color: C.ink,
                  whiteSpace: "nowrap",
                }}
              >
                전담단지 관심도
              </span>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 10.5,
                    color: C.muted,
                    fontWeight: 800,
                  }}
                >
                  낮음
                </span>

                {[1, 2, 3, 4, 5].map((level) => (
                  <span
                    key={level}
                    aria-hidden="true"
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: popularityColor(level),
                      border:
                        level >= 4
                          ? "1px solid #d35b70"
                          : "1px solid #d4d7dc",
                      flex: "0 0 auto",
                    }}
                  />
                ))}

                <span
                  style={{
                    fontSize: 10.5,
                    color: C.muted,
                    fontWeight: 800,
                  }}
                >
                  높음
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="hp-map-list-layout">
        <div
          className="hp-map-pane"
          style={{
            padding: isDesktopLayout ? "0" : "0 18px",
            background: "#fff",
            display:
              isDesktopLayout || mapListView === "map"
                ? "block"
                : "none",
          }}
        >
          <div
            className="hp-map-canvas"
            style={{
              position: "relative",
              height: priorityMode ? 360 : compactActivityMode ? 350 : 405,
              borderRadius: 17,
              overflow: "hidden",
              background: "#edf0f2",
              border: `1px solid ${C.line}`,
            }}
          >
            <div ref={mapElRef} style={{ position: "absolute", inset: 0 }}/>

            {!mapReady && (
              <div
                aria-live="polite"
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 3,
                  display: "grid",
                  placeItems: "center",
                  background: "#f3f4f5",
                  color: C.muted,
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                {initialResourcesReady ? "지도 준비 중" : "활동지역 준비 중"}
              </div>
            )}

            {priorityMode && (
              <div
                style={{
                  position: "absolute",
                  left: 10,
                  top: 10,
                  zIndex: 5,
                  background: "rgba(255,255,255,.94)",
                  borderRadius: 10,
                  padding: "8px 10px",
                  boxShadow: "0 3px 10px rgba(0,0,0,.10)",
                  fontSize: 10.5,
                  color: C.muted,
                  fontWeight: 800,
                }}
              >
                선택한 3개 동의 대단지만 표시 · ★ 우선권 전담단지
              </div>
            )}

            <div
              style={{
                position: "absolute",
                right: 10,
                top: 10,
                zIndex: 5,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <button
                type="button"
                aria-label="확대"
                onClick={() =>
                  mapRef.current?.setZoom(
                    Math.min(18, (mapRef.current?.getZoom() || 11) + 1)
                  )
                }
                style={{
                  width: 36,
                  height: 36,
                  border: 0,
                  borderRadius: 10,
                  background: "rgba(255,255,255,.96)",
                  boxShadow: "0 3px 10px rgba(0,0,0,.10)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <IconPlus size={17} color={C.ink}/>
              </button>

              <button
                type="button"
                aria-label="축소"
                onClick={() =>
                  mapRef.current?.setZoom(
                    Math.max(10, (mapRef.current?.getZoom() || 11) - 1)
                  )
                }
                style={{
                  width: 36,
                  height: 36,
                  border: 0,
                  borderRadius: 10,
                  background: "rgba(255,255,255,.96)",
                  boxShadow: "0 3px 10px rgba(0,0,0,.10)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <IconMinus/>
              </button>
            </div>

            {error && (
              <div
                style={{
                  position: "absolute",
                  left: 10,
                  right: 10,
                  bottom: 10,
                  zIndex: 10,
                  background: "rgba(255,255,255,.96)",
                  borderRadius: 10,
                  padding: "8px 10px",
                  color: "#b42318",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {error}
              </div>
            )}

            {renderMapGuide()}
          </div>
        </div>

        <section
          className="hp-list-pane"
          style={{
            padding:
              isDesktopLayout
                ? "0 0 110px"
                : mapListView === "list"
                  ? "8px 18px 115px"
                  : "0 18px 115px",
            background: "#fff",
          }}
        >
          {!priorityMode && !compactActivityMode && (
            <div
              style={{
                padding: "18px 16px",
                borderRadius: 16,
                border: `1px solid ${C.line}`,
                background: "#fff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: C.brandSoft,
                    color: C.brand,
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 950,
                    fontSize: 13,
                  }}
                >
                  ✓
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 950,
                    letterSpacing: "-.02em",
                  }}
                >
                  선택한 활동지역
                </div>
              </div>

              <div
                style={{
                  marginTop: 9,
                  fontSize: 27,
                  lineHeight: 1.2,
                  fontWeight: 950,
                  letterSpacing: "-.045em",
                }}
              >
                <span style={{ color: C.brand }}>{selectedNeighborhoods.size}</span>
                {" / "}
                {MAX_NEIGHBORHOODS}개 동
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 12.5,
                  color: C.muted,
                  lineHeight: 1.55,
                  fontWeight: 700,
                }}
              >
                최대 3개 동까지 선택할 수 있습니다.
              </div>

              {selectedNeighborhoods.size > 0 && (
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  {[...selectedNeighborhoods.values()].map((n) => (
                    <button
                      key={neighborhoodKey(n.district, n.neighborhood)}
                      type="button"
                      onClick={() => toggleNeighborhood(n)}
                      style={{
                        height: 31,
                        padding: "0 10px",
                        borderRadius: 999,
                        border: `1px solid #e7bcc6`,
                        background: C.brandSoft,
                        color: C.brand,
                        fontSize: 11.5,
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      {n.neighborhood} <IconX size={12} color={C.brand}/>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {(isDesktopLayout || mapListView === "list") && neighborhoodMode ? (
            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "end",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900 }}>활동할 동 선택</div>
                  <div style={{ marginTop: 3, fontSize: 11.5, color: C.muted }}>
                    지도에 보이는 동을 눌러 최대 3곳까지 선택하세요.
                  </div>
                </div>
                <div style={{ fontSize: 12, color: C.brand, fontWeight: 900 }}>
                  {selectedNeighborhoods.size}/{MAX_NEIGHBORHOODS}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {visibleNeighborhoods.map((n) => {
                  const nKey = neighborhoodKey(n.district, n.neighborhood);
                  const chosen = selectedNeighborhoods.has(nKey);
                  const disabled =
                    !chosen &&
                    selectedNeighborhoods.size >= MAX_NEIGHBORHOODS;

                  return (
                    <div
                      key={nKey}
                      style={{
                        padding: "13px 14px",
                        borderRadius: 14,
                        border: chosen
                          ? `1.5px solid ${C.brand}`
                          : `1px solid ${C.line}`,
                        background: chosen ? "#fffafb" : "#fff",
                        display: "grid",
                        gridTemplateColumns: "minmax(0,1fr) auto",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          selectNeighborhood(n);
                          setSelectedDistrict(n.district);
                        }}
                        style={{
                          minWidth: 0,
                          textAlign: "left",
                          border: 0,
                          padding: 0,
                          background: "transparent",
                        }}
                      >
                        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                          <strong style={{ fontSize: 15, fontWeight: 900 }}>
                            {n.neighborhood}
                          </strong>
                          {chosen && (
                            <span
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                background: C.brand,
                                display: "grid",
                                placeItems: "center",
                              }}
                            >
                              <IconCheck size={12}/>
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 11.5,
                            color: C.muted,
                          }}
                        >
                          {n.district} · 대단지 {n.count}곳 ·{" "}
                          {n.households.toLocaleString("ko-KR")}세대
                        </div>
                      </button>

                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleNeighborhood(n)}
                        style={{
                          height: 34,
                          padding: "0 12px",
                          borderRadius: 10,
                          border: chosen
                            ? `1px solid ${C.line}`
                            : `1px solid ${disabled ? C.line : C.brand}`,
                          background: chosen
                            ? "#fff"
                            : disabled
                              ? "#f3f4f6"
                              : C.brand,
                          color: chosen
                            ? C.muted
                            : disabled
                              ? "#a2a7af"
                              : "#fff",
                          fontSize: 12,
                          fontWeight: 900,
                        }}
                      >
                        {chosen ? "해제" : "선택"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (isDesktopLayout || mapListView === "list") && apartmentMode ? (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "end",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900 }}>
                    대단지에서 우선권 선택
                  </div>
                  <div style={{ marginTop: 3, fontSize: 11.5, color: C.muted, lineHeight: 1.5 }}>
                    {priorityApartment
                      ? "다른 단지를 누르면 기존 전담단지가 자동으로 교체됩니다."
                      : "원하는 단지를 누르면 우선권 전담단지로 바로 선택됩니다."}
                  </div>
                </div>
                {selectedDistrict && (
                  <div style={{ fontSize: 11.5, color: C.brand, fontWeight: 800 }}>
                    {selectedDistrict}
                  </div>
                )}
              </div>

              {selectedApartmentRows.length === 0 ? (
                <div
                  style={{
                    padding: "34px 0",
                    textAlign: "center",
                    color: C.muted,
                    fontSize: 13,
                  }}
                >
                  선택한 활동 동에 표시할 대단지가 없습니다.
                </div>
              ) : (
                <>
                  <div
                    style={{
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11.5,
                        fontWeight: 850,
                        color: C.muted,
                      }}
                    >
                      정렬
                    </div>

                    <div
                      style={{
                        display: "inline-flex",
                        padding: 3,
                        borderRadius: 10,
                        background: "#f4f4f5",
                        border: `1px solid ${C.line}`,
                      }}
                    >
                      {[
                        ["households", "세대수순"],
                        ["popularity", "관심도순"],
                      ].map(([value, label]) => {
                        const active = apartmentSort === value;

                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              setApartmentSort(value);
                              setListLimit(12);
                            }}
                            style={{
                              minHeight: 32,
                              padding: "0 11px",
                              border: 0,
                              borderRadius: 8,
                              background: active ? "#fff" : "transparent",
                              color: active ? C.ink : C.muted,
                              fontSize: 11.5,
                              fontWeight: active ? 950 : 800,
                              boxShadow: active
                                ? "0 1px 4px rgba(31,35,41,.08)"
                                : "none",
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {sortedSelectedApartmentRows.slice(0, listLimit).map((p) => {
                    const key = apartmentKey(p);
                    const nKey = neighborhoodKey(p.district, p.neighborhood);
                    const regionSelected = selectedNeighborhoods.has(nKey);
                    const priority = priorityApartmentKey === key;
                    const tier = householdTier(p.households);
                    const popularity =
                      apartmentPopularity.get(key) || {
                        level: 1,
                        rank: 0,
                        color: "#ffffff",
                      };

                    return (
                      <div
                        key={key}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(0,1fr) auto",
                          gap: 10,
                          padding: "13px 13px 13px 14px",
                          border: priority
                            ? `1.5px solid ${C.brand}`
                            : `1px solid ${C.line}`,
                          background: priority ? "#fffafb" : "#fff",
                          borderRadius: 14,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setPriorityApartment(p)}
                          style={{
                            border: 0,
                            padding: 0,
                            background: "transparent",
                            textAlign: "left",
                            minWidth: 0,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <span
                              style={{
                                fontSize: 15,
                                fontWeight: 900,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {p.name}
                            </span>
                            {priority && (
                              <span style={{ color: C.brand, fontSize: 16 }}>★</span>
                            )}
                          </div>

                          <div style={{ marginTop: 3, fontSize: 11.5, color: C.muted }}>
                            {p.district} {p.neighborhood}
                          </div>

                          <div
                            style={{
                              marginTop: 8,
                              display: "flex",
                              alignItems: "baseline",
                              gap: 6,
                            }}
                          >
                            <strong
                              style={{
                                fontSize:
                                  p.households >= 2000
                                    ? 20
                                    : p.households >= 1000
                                      ? 18
                                      : 16,
                              }}
                            >
                              {p.households.toLocaleString("ko-KR")}
                            </strong>
                            <span style={{ fontSize: 11.5, color: C.muted }}>
                              세대 · {tier.label}
                            </span>
                          </div>

                          <div
                            style={{
                              marginTop: 7,
                              display: "flex",
                              alignItems: "center",
                              gap: 7,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 10.5,
                                color: C.muted,
                                fontWeight: 850,
                              }}
                            >
                              관심도
                            </span>

                            <div
                              aria-label={`관심도 ${popularity.level}점`}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                lineHeight: 1,
                              }}
                            >
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  aria-hidden="true"
                                  style={{
                                    fontSize: 14,
                                    color:
                                      star <= popularity.level
                                        ? C.brand
                                        : "#d9dadd",
                                  }}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                        </button>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            justifyContent: "center",
                            gap: 7,
                          }}
                        >
                          <button
                            type="button"
                            disabled={!regionSelected}
                            onClick={() => setPriorityApartment(p)}
                            style={{
                              height: 34,
                              minWidth: 76,
                              padding: "0 12px",
                              borderRadius: 10,
                              border: priority
                                ? `1px solid ${C.brand}`
                                : `1px solid ${
                                    regionSelected ? C.brand : C.line
                                  }`,
                              background: priority
                                ? C.brandSoft
                                : regionSelected
                                  ? C.brand
                                  : "#f3f4f6",
                              color: priority
                                ? C.brand
                                : regionSelected
                                  ? "#fff"
                                  : "#a2a7af",
                              fontSize: 12,
                              fontWeight: 900,
                            }}
                          >
                            {priority
                              ? "선택됨"
                              : regionSelected
                                ? "전담단지 선택"
                                : "동 미선택"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </>
              )}

              {sortedSelectedApartmentRows.length > listLimit && (
                <button
                  type="button"
                  onClick={() => setListLimit((n) => n + 12)}
                  style={{
                    width: "100%",
                    height: 44,
                    marginTop: 10,
                    border: `1px solid ${C.line}`,
                    borderRadius: 12,
                    background: "#fff",
                    color: C.ink,
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  12개 더 보기
                </button>
              )}
            </div>
          ) : null}
        </section>
        </div>

        {guide?.type !== "dongComplete" && (
        <div
          className="hp-bottom-action"
          style={{
            position: "fixed",
            left: isDesktopLayout ? "auto" : "50%",
            right: isDesktopLayout
              ? "max(24px, calc((100vw - min(1180px, calc(100vw - 48px))) / 2 + 28px))"
              : "auto",
            bottom: 0,
            transform: isDesktopLayout ? "none" : "translateX(-50%)",
            width: isDesktopLayout
              ? "clamp(320px, 34vw, 455px)"
              : "100%",
            maxWidth: isDesktopLayout ? "none" : 520,
            zIndex: 30,
            padding: "10px 14px calc(10px + env(safe-area-inset-bottom))",
            background: "rgba(255,255,255,.97)",
            borderTop: `1px solid ${C.line}`,
            backdropFilter: "blur(14px)",
          }}
        >
          {!priorityMode ? (
            <button
              type="button"
              disabled={selectedNeighborhoods.size !== MAX_NEIGHBORHOODS}
              onClick={() => {
                if (selectedNeighborhoods.size !== MAX_NEIGHBORHOODS) return;
                setPriorityStageStarted(true);
                setGuide({ type: "priorityIntro" });
              }}
              style={{
                width: "100%",
                height: 54,
                border: 0,
                borderRadius: 15,
                background:
                  selectedNeighborhoods.size === MAX_NEIGHBORHOODS
                    ? C.brand
                    : "#d7d9de",
                color: "#fff",
                fontSize: 15,
                fontWeight: 950,
              }}
            >
              {selectedNeighborhoods.size === MAX_NEIGHBORHOODS
                ? "우선권 전담단지 선택하기"
                : selectedNeighborhoods.size === 0
                  ? "활동할 동 3곳을 선택해주세요"
                  : `활동할 동 ${remainingNeighborhoods}곳을 더 선택해주세요`}
            </button>
          ) : (
            <button
              type="button"
              disabled={!priorityApartment}
              onClick={() => setPage("summary")}
              style={{
                width: "100%",
                height: 54,
                border: 0,
                borderRadius: 15,
                background: priorityApartment ? C.brand : "#d7d9de",
                color: "#fff",
                fontSize: 15,
                fontWeight: 950,
              }}
            >
              {priorityApartment ? "선택 내용 확인" : "우선권 전담단지를 선택해주세요"}
            </button>
          )}
        </div>
        )}
      </>
    );
  }

  function normalizePhone(value) {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  function validApplicantPhone(value) {
    return /^01[016789]-\d{3,4}-\d{4}$/.test(String(value || ""));
  }

  async function submitApplication() {
    const name = applicantName.trim();
    const phone = applicantPhone.trim();
    const phoneDigits = phone.replace(/\D/g, "");
    const regions = [...selectedNeighborhoods.values()];

    if (
      name.length < 2 ||
      !validApplicantPhone(phone) ||
      !priorityApartment ||
      regions.length !== MAX_NEIGHBORHOODS ||
      submitState.loading
    ) {
      return;
    }

    setSubmitState({ loading: true, error: "" });

    try {
      const response = await fetch("/api/partner/apply", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          applicantName: name,
          applicantPhone: phoneDigits,
          regions: regions.map((n) => ({
            district: n.district,
            neighborhood: n.neighborhood,
          })),
          priorityApartment: {
            id: apartmentKey(priorityApartment),
            name: priorityApartment.name,
            district: priorityApartment.district,
            neighborhood: priorityApartment.neighborhood,
            households: Number(priorityApartment.households) || 0,
          },
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.ok !== true) {
        const msg =
          data?.error ||
          data?.message ||
          `신청 처리 실패 (HTTP ${response.status})`;

        throw new Error(msg);
      }

      const no = String(data?.applicationNo || "");
      const submittedAt = String(
        data?.submittedAt || new Date().toLocaleString("ko-KR")
      );
      const requestId = String(data?.smsRequestId || "");

      setApplicationNo(no);
      setApplicationSubmittedAt(submittedAt);
      setShowCertificate(false);

      try {
        localStorage.setItem(
          "nanumieum-hospital-partner-application",
          JSON.stringify({
            applicationNo: no,
            applicantName: name,
            applicantPhone: phone,
            submittedAt,
            regions,
            priorityApartment: {
              id: apartmentKey(priorityApartment),
              name: priorityApartment.name,
              district: priorityApartment.district,
              neighborhood: priorityApartment.neighborhood,
              households: priorityApartment.households,
            },
            smsRequestId: requestId,
            smsProvider: "NAVER_CLOUD_SENS_SERVER",
          })
        );
      } catch (_) {}

      setSubmitState({ loading: false, error: "" });
      setApplicantModalOpen(false);
      setPage("complete");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error("[PARTNER APPLY] failed", e);

      setSubmitState({
        loading: false,
        error:
          e?.message ||
          "신청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.",
      });
    }
  }

  // 우선권 전담단지를 새로 선택하거나 교체하면 이 화면으로 즉시 이동한다.
  function renderApplicantModal() {
    if (!applicantModalOpen) return null;

    const canSubmit =
      applicantName.trim().length >= 2 &&
      validApplicantPhone(applicantPhone) &&
      Boolean(priorityApartment) &&
      selectedNeighborhoods.size === MAX_NEIGHBORHOODS;

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="신청자 정보 입력"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && !submitState.loading) {
            setApplicantModalOpen(false);
          }
        }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1200,
          background: "rgba(31,35,41,.46)",
          display: "flex",
          alignItems: isDesktopLayout ? "center" : "flex-end",
          justifyContent: "center",
          padding: isDesktopLayout ? 24 : 0,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: isDesktopLayout ? 520 : 520,
            maxHeight: isDesktopLayout ? "calc(100dvh - 48px)" : "92dvh",
            overflowY: "auto",
            borderRadius: isDesktopLayout ? 22 : "22px 22px 0 0",
            background: "#fff",
            boxShadow: isDesktopLayout
              ? "0 24px 70px rgba(31,35,41,.26)"
              : "0 -16px 42px rgba(31,35,41,.18)",
            paddingBottom: isDesktopLayout
              ? 16
              : "calc(16px + env(safe-area-inset-bottom))",
          }}
        >
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 2,
              background: "rgba(255,255,255,.98)",
              padding: isDesktopLayout ? "18px 18px 14px" : "10px 18px 12px",
              borderBottom: `1px solid ${C.line}`,
            }}
          >
            {!isDesktopLayout && (
              <div
                style={{
                  width: 40,
                  height: 4,
                  margin: "0 auto 10px",
                  borderRadius: 999,
                  background: "#dfe1e5",
                }}
              />
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 19,
                    fontWeight: 950,
                    letterSpacing: "-.035em",
                  }}
                >
                  신청자 정보를 입력해주세요
                </div>
              </div>

              <button
                type="button"
                disabled={submitState.loading}
                aria-label="닫기"
                onClick={() => setApplicantModalOpen(false)}
                style={{
                  width: 36,
                  height: 36,
                  flex: "0 0 auto",
                  borderRadius: 11,
                  border: `1px solid ${C.line}`,
                  background: "#fff",
                  display: "grid",
                  placeItems: "center",
                  color: C.muted,
                }}
              >
                <IconX/>
              </button>
            </div>
          </div>

          <div style={{ padding: "18px 18px 4px" }}>
            <label style={{ display: "block" }}>
              <div
                style={{
                  marginBottom: 7,
                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                신청자 이름
              </div>
              <input
                value={applicantName}
                onChange={(e) =>
                  setApplicantName(e.target.value.slice(0, 20))
                }
                placeholder="이름을 입력해주세요"
                autoComplete="name"
                autoFocus
                style={{
                  width: "100%",
                  height: 54,
                  padding: "0 14px",
                  borderRadius: 13,
                  border: `1.5px solid ${C.line}`,
                  background: "#fff",
                  color: C.ink,
                  fontSize: 16,
                  fontWeight: 800,
                  outline: "none",
                }}
              />
            </label>

            <label style={{ display: "block", marginTop: 17 }}>
              <div
                style={{
                  marginBottom: 7,
                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                신청 확인서를 받을 전화번호
              </div>
              <input
                value={applicantPhone}
                onChange={(e) =>
                  setApplicantPhone(normalizePhone(e.target.value))
                }
                placeholder="010-0000-0000"
                inputMode="numeric"
                autoComplete="tel"
                style={{
                  width: "100%",
                  height: 54,
                  padding: "0 14px",
                  borderRadius: 13,
                  border: `1.5px solid ${C.line}`,
                  background: "#fff",
                  color: C.ink,
                  fontSize: 17,
                  fontWeight: 850,
                  letterSpacing: ".01em",
                  outline: "none",
                }}
              />
            </label>

            <div
              style={{
                marginTop: 8,
                fontSize: 11.5,
                lineHeight: 1.55,
                color: C.muted,
              }}
            >
              신청 완료 후 입력한 번호로 신청 확인서와 파트너 가입 안내를 보내드립니다.
            </div>

            {submitState.error && (
              <div
                style={{
                  marginTop: 13,
                  padding: "11px 12px",
                  borderRadius: 11,
                  background: "#fff4f4",
                  border: "1px solid #f2c6c6",
                  color: "#b42318",
                  fontSize: 12,
                  lineHeight: 1.55,
                  fontWeight: 800,
                  whiteSpace: "pre-line",
                }}
              >
                {submitState.error}
              </div>
            )}

            <button
              type="button"
              disabled={!canSubmit || submitState.loading}
              onClick={submitApplication}
              style={{
                width: "100%",
                height: 56,
                marginTop: 20,
                border: 0,
                borderRadius: 15,
                background:
                  canSubmit && !submitState.loading
                    ? C.brand
                    : "#d7d9de",
                color: "#fff",
                fontSize: 16,
                fontWeight: 950,
              }}
            >
              {submitState.loading ? "신청 접수 중..." : "신청하기"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 우선권 전담단지를 선택한 뒤 보게 되는 첫 신청 화면.
  // 선택내용은 작게 확인하고, 파트너 활동방식을 이해한 뒤 신청버튼을 누른다.
  function renderSummary() {
    const regions = [...selectedNeighborhoods.values()];

    return (
      <>
        {renderApplicantModal()}

        <PageHeader title="신청 내용 확인" onBack={() => setPage("main")}/>

        <div style={{ padding: "0 18px 4px", background: "#fff" }}>
          {renderApplicationProgress(3)}
        </div>

        <div className="hp-summary-layout">
        <div
          className="hp-summary-hero-wrap"
          style={{
            padding: "10px 14px 0",
            background: "#fff",
          }}
        >
          <section
            aria-label="나눔이음 병원동행 파트너 안내"
            style={{
              position: "relative",
              minHeight: 188,
              overflow: "hidden",
              borderRadius: 22,
              background:
                "linear-gradient(112deg, #ffffff 0%, #ffffff 47%, #f7f4f1 72%, #eef1f3 100%)",
              border: `1px solid ${C.line}`,
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                right: "-28px",
                top: "-72px",
                width: 238,
                height: 238,
                borderRadius: "50%",
                background: "rgba(201,90,112,.055)",
              }}
            />

            <div
              style={{
                position: "relative",
                zIndex: 3,
                width: "58%",
                padding: "19px 0 18px 17px",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(17px, 4.8vw, 22px)",
                  lineHeight: 1,
                  fontWeight: 950,
                  letterSpacing: "-.045em",
                  color: C.ink,
                }}
              >
                나눔이음
              </div>

              <div
                style={{
                  marginTop: 9,
                  fontSize: "clamp(26px, 7.4vw, 35px)",
                  lineHeight: 1.05,
                  fontWeight: 950,
                  letterSpacing: "-.055em",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: C.brand }}>병원동행</span>{" "}
                <span style={{ color: C.ink }}>파트너</span>
              </div>

              <div
                style={{
                  marginTop: 14,
                  fontSize: "clamp(12px, 3.4vw, 15px)",
                  lineHeight: 1.48,
                  fontWeight: 800,
                  color: C.ink,
                  wordBreak: "keep-all",
                }}
              >
                운전면허만 있으면,
                <br/>
                바로 활동할 수 있습니다.
              </div>
            </div>

            <img
              src="/hospital-partner-cutout.png"
              alt=""
              aria-hidden="true"
              style={{
                position: "absolute",
                zIndex: 2,
                right: "-8px",
                bottom: "-4px",
                width: "56%",
                maxWidth: 248,
                height: "auto",
                display: "block",
                pointerEvents: "none",
                WebkitMaskImage:
                  "linear-gradient(90deg, transparent 0%, rgba(0,0,0,.55) 12%, #000 30%, #000 100%)",
                maskImage:
                  "linear-gradient(90deg, transparent 0%, rgba(0,0,0,.55) 12%, #000 30%, #000 100%)",
              }}
            />

            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                zIndex: 2,
                left: "47%",
                top: 0,
                bottom: 0,
                width: "18%",
                background:
                  "linear-gradient(90deg, #fff 0%, rgba(255,255,255,.72) 42%, rgba(255,255,255,0) 100%)",
                pointerEvents: "none",
              }}
            />
          </section>
        </div>

        <main
          className="hp-summary-main"
          style={{ padding: "12px 14px 112px" }}
        >
          <section
            className="hp-summary-selection"
            style={{
              border: `1px solid ${C.line}`,
              borderRadius: 16,
              background: "#fff",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 13px",
                borderBottom: `1px solid ${C.line}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 11.5,
                    color: C.muted,
                    fontWeight: 850,
                  }}
                >
                  선택한 활동지역
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPage("main");
                    setPriorityStageStarted(false);
                    setGuide(null);
                    setMapListView("map");
                  }}
                  style={{
                    border: 0,
                    background: "transparent",
                    color: C.brand,
                    fontSize: 11.5,
                    fontWeight: 900,
                    padding: "4px 0",
                  }}
                >
                  변경
                </button>
              </div>

              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                {regions.map((n) => (
                  <span
                    key={neighborhoodKey(n.district, n.neighborhood)}
                    style={{
                      padding: "6px 9px",
                      borderRadius: 999,
                      background: C.brandSoft,
                      color: C.brand,
                      border: "1px solid #efcbd3",
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    {n.neighborhood}
                  </span>
                ))}
              </div>
            </div>

            <div
              style={{
                padding: "12px 13px",
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) auto",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11.5,
                    color: C.muted,
                    fontWeight: 850,
                  }}
                >
                  우선권 전담단지
                </div>
                <div
                  style={{
                    marginTop: 5,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    minWidth: 0,
                  }}
                >
                  <span style={{ color: C.brand }}>★</span>
                  <strong
                    style={{
                      fontSize: 14.5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {priorityApartment?.name || "-"}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPriorityApartmentKey(null);
                  setPage("main");
                  setPriorityStageStarted(true);
                  setGuide(null);
                  setMapListView("map");
                }}
                style={{
                  height: 34,
                  padding: "0 10px",
                  borderRadius: 10,
                  border: "1px solid #e4a7b5",
                  background: "#fff",
                  color: C.brand,
                  fontSize: 11.5,
                  fontWeight: 900,
                }}
              >
                변경
              </button>
            </div>
          </section>

          <section
            className="hp-summary-activity"
            style={{
              marginTop: 14,
              padding: "15px 13px 5px",
              borderRadius: 17,
              border: `1px solid ${C.line}`,
              background: "#fff",
            }}
          >
            <div
              style={{
                fontSize: 17,
                fontWeight: 950,
                letterSpacing: "-.03em",
              }}
            >
              나눔이음 병원동행 파트너는 이렇게 활동합니다
            </div>

            {[
              {
                icon: "▣",
                title: "운전면허만 있으면 활동 가능",
                body: "내 차가 없어도 됩니다.",
              },
              {
                icon: "●",
                title: "병원동행 차량은 나눔이음조합 차량을 함께 이용합니다",
                body: "",
              },
              {
                icon: "✓",
                title: "가능한 예약을 직접 선택",
                body: "예약 신청을 확인하고 내가 가능한 예약을 직접 수락합니다.",
              },
              {
                icon: "★",
                title: "우선권 전담단지는 예약을 가장 먼저 받아봅니다",
                body: "선택한 단지와 주변 예약은 다른 파트너보다 가장 먼저 받아볼 수 있습니다.",
              },
            ].map((item, index) => (
              <div
                key={item.title}
                style={{
                  padding: "13px 0",
                  display: "grid",
                  gridTemplateColumns: "38px minmax(0,1fr)",
                  gap: 10,
                  alignItems: "start",
                  borderTop:
                    index === 0
                      ? "none"
                      : `1px dashed ${C.line}`,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: C.brandSoft,
                    color: C.brand,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 15,
                    fontWeight: 950,
                  }}
                >
                  {item.icon}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 13.5,
                      lineHeight: 1.45,
                      fontWeight: 950,
                      color: C.ink,
                      wordBreak: "keep-all",
                    }}
                  >
                    {item.title}
                  </div>

                  {item.body && (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 11.5,
                        lineHeight: 1.5,
                        color: C.muted,
                        wordBreak: "keep-all",
                      }}
                    >
                      {item.body}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>

          <section
            className="hp-summary-compare"
            style={{
              marginTop: 10,
              padding: "12px",
              borderRadius: 15,
              border: `1px solid ${C.line}`,
              background: "#faf9f8",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              <div
                style={{
                  minWidth: 0,
                  padding: "11px 9px",
                  borderRadius: 12,
                  background: "#fff",
                  border: `1px solid ${C.line}`,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 10.5,
                    color: C.muted,
                    fontWeight: 900,
                  }}
                >
                  일반 병원동행
                </div>
                <div
                  style={{
                    marginTop: 5,
                    fontSize: 12,
                    lineHeight: 1.45,
                    fontWeight: 850,
                  }}
                >
                  택시·대중교통 이용
                </div>
              </div>

              <div
                style={{
                  minWidth: 0,
                  padding: "11px 9px",
                  borderRadius: 12,
                  background: "#fff6f8",
                  border: "1px solid #efc4ce",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 10.5,
                    color: C.brand,
                    fontWeight: 900,
                  }}
                >
                  나눔이음
                </div>
                <div
                  style={{
                    marginTop: 5,
                    fontSize: 12,
                    lineHeight: 1.45,
                    fontWeight: 950,
                    color: C.ink,
                  }}
                >
                  조합 차량 공동 이용
                </div>
              </div>
            </div>
          </section>

          <section
            className="hp-summary-shared"
            style={{
              marginTop: 10,
              padding: "14px 13px",
              borderRadius: 16,
              background: "#fff6f8",
              border: "1px solid #efc5cf",
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 950,
                color: C.brand,
              }}
            >
              함께 차량을 이용하고, 함께 활동합니다
            </div>

            <div
              style={{
                marginTop: 7,
                fontSize: 12,
                lineHeight: 1.6,
                color: C.ink,
                fontWeight: 800,
                wordBreak: "keep-all",
              }}
            >
              나눔이음조합 파트너가 조합 차량을 함께 이용하며 병원동행 활동을 합니다.
            </div>

            <div
              style={{
                marginTop: 8,
                paddingTop: 8,
                borderTop: "1px dashed #e8b8c4",
                fontSize: 12,
                lineHeight: 1.55,
                color: C.ink,
                fontWeight: 900,
              }}
            >
              내가 수행한 예약에서는 별도의 중개 수수료를 공제하지 않습니다.
            </div>
          </section>
        </main>
        </div>

        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 0,
            transform: "translateX(-50%)",
            width: isDesktopLayout ? "calc(100% - 48px)" : "100%",
            maxWidth: isDesktopLayout ? 1180 : 520,
            padding: "10px 14px calc(10px + env(safe-area-inset-bottom))",
            background: "rgba(255,255,255,.98)",
            borderTop: `1px solid ${C.line}`,
            zIndex: 30,
          }}
        >
          <button
            type="button"
            disabled={
              selectedNeighborhoods.size !== MAX_NEIGHBORHOODS ||
              !priorityApartment
            }
            onClick={() => {
              setSubmitState({ loading: false, error: "" });
              setApplicantModalOpen(true);
            }}
            style={{
              width: "100%",
              height: 56,
              border: 0,
              borderRadius: 15,
              background:
                selectedNeighborhoods.size === MAX_NEIGHBORHOODS &&
                priorityApartment
                  ? C.brand
                  : "#d7d9de",
              color: "#fff",
              fontSize: 16,
              fontWeight: 950,
              boxShadow:
                selectedNeighborhoods.size === MAX_NEIGHBORHOODS &&
                priorityApartment
                  ? "0 8px 20px rgba(201,90,112,.20)"
                  : "none",
            }}
          >
            신청하기
          </button>
        </div>
      </>
    );
  }

  function renderComplete() {
    const regions = [...selectedNeighborhoods.values()];

    const smsText = `[나눔이음의료복지사회적협동조합]
${applicantName.trim()}님의 병원동행 파트너 신청이 접수되었습니다.

신청번호
${applicationNo}

활동지역
${regions.map((n) => n.neighborhood).join(" / ")}

우선권 전담단지
${priorityApartment?.name || "-"}

병원동행 파트너 가입 안내
9월 29일 오후 1시 30분
부산시민회관

병원동행 파트너 가입과 활동 안내를 진행합니다.

준비물
신분증 · 운전면허증 · 보유 우대 자격증(해당자)`;

    const completeContent = (
      <>
        <PageHeader title="신청 완료"/>

        <main style={{ padding: "24px 14px 70px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "72px minmax(0,1fr)",
              gap: 14,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: C.brandSoft,
                color: C.brand,
                display: "grid",
                placeItems: "center",
                fontSize: 31,
                fontWeight: 950,
              }}
            >
              ✓
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 24,
                  lineHeight: 1.25,
                  letterSpacing: "-.04em",
                  color: C.brand,
                }}
              >
                신청이 접수되었습니다
              </h2>
              <p
                style={{
                  margin: "7px 0 0",
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: C.muted,
                  wordBreak: "keep-all",
                }}
              >
                입력하신 전화번호로 신청 확인서와
                <br/>
                파트너 가입 안내를 보내드립니다.
              </p>
            </div>
          </div>

          <section
            style={{
              marginTop: 22,
              borderRadius: 16,
              border: `1px solid ${C.line}`,
              background: "#fff",
              overflow: "hidden",
            }}
          >
            {[
              ["신청자 이름", applicantName.trim()],
              ["신청 확인서를 받을 전화번호", applicantPhone],
            ].map(([label, value], index) => (
              <div
                key={label}
                style={{
                  minHeight: 64,
                  padding: "0 14px",
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) minmax(0,1.15fr)",
                  gap: 12,
                  alignItems: "center",
                  borderTop:
                    index === 0
                      ? "none"
                      : `1px solid ${C.line}`,
                }}
              >
                <div
                  style={{
                    fontSize: 12.5,
                    color: C.ink,
                    fontWeight: 900,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: index === 0 ? 17 : 16,
                    color: C.ink,
                    fontWeight: 950,
                    wordBreak: "break-all",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </section>

          <section
            style={{
              marginTop: 16,
              borderRadius: 17,
              border: `1.5px solid ${C.brand}`,
              background: "#fff",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                minHeight: 48,
                padding: "0 14px",
                background: C.brand,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 16,
                fontWeight: 950,
              }}
            >
              <span aria-hidden="true">▣</span>
              병원동행 파트너 가입 안내
            </div>

            <div style={{ padding: "18px 14px 14px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 0,
                  alignItems: "stretch",
                }}
              >
                <div
                  style={{
                    padding: "0 12px 0 4px",
                    borderRight: `1px solid ${C.line}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        color: C.brand,
                        fontSize: 26,
                        lineHeight: 1,
                      }}
                    >
                      ▦
                    </span>
                    <div>
                      <div
                        style={{
                          fontSize: 21,
                          lineHeight: 1.2,
                          fontWeight: 950,
                          whiteSpace: "nowrap",
                        }}
                      >
                        9월 29일
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 14,
                          fontWeight: 900,
                        }}
                      >
                        오후 1시 30분
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: "0 2px 0 14px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        color: C.brand,
                        fontSize: 27,
                        lineHeight: 1,
                      }}
                    >
                      ●
                    </span>
                    <div
                      style={{
                        fontSize: 18,
                        lineHeight: 1.35,
                        fontWeight: 950,
                        wordBreak: "keep-all",
                      }}
                    >
                      부산시민회관
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                  padding: "12px 4px",
                  borderTop: `1px dashed ${C.line}`,
                  borderBottom: `1px dashed ${C.line}`,
                  textAlign: "center",
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: C.ink,
                  fontWeight: 850,
                }}
              >
                병원동행 파트너 가입과 활동 안내를 진행합니다.
              </div>

              <div
                style={{
                  marginTop: 13,
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0,1fr)",
                  gap: 10,
                  alignItems: "start",
                }}
              >
                <span
                  style={{
                    padding: "5px 8px",
                    borderRadius: 8,
                    background: C.brand,
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 950,
                    whiteSpace: "nowrap",
                  }}
                >
                  준비물
                </span>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "7px 11px",
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: C.ink,
                    fontWeight: 850,
                  }}
                >
                  <span>▣ 신분증</span>
                  <span>▣ 운전면허증</span>
                  <span>★ 보유 우대 자격증(해당자)</span>
                </div>
              </div>
            </div>
          </section>

          <section
            style={{
              marginTop: 15,
              padding: "13px 14px",
              borderRadius: 14,
              border: `1px solid ${C.line}`,
              background: "#faf9f8",
            }}
          >
            <div
              style={{
                fontSize: 11.5,
                color: C.muted,
                fontWeight: 850,
              }}
            >
              신청번호
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 14,
                color: C.ink,
                fontWeight: 950,
              }}
            >
              {applicationNo}
            </div>
          </section>

          <details
            style={{
              marginTop: 12,
              borderRadius: 14,
              border: `1px solid ${C.line}`,
              background: "#fff",
              overflow: "hidden",
            }}
          >
            <summary
              style={{
                padding: "13px 14px",
                cursor: "pointer",
                fontSize: 12.5,
                color: C.ink,
                fontWeight: 900,
              }}
            >
              문자 발송 내용 확인
            </summary>

            <pre
              style={{
                margin: 0,
                padding: "0 14px 14px",
                whiteSpace: "pre-wrap",
                fontFamily: FONT,
                fontSize: 11.5,
                lineHeight: 1.65,
                color: C.muted,
              }}
            >
              {smsText}
            </pre>
          </details>

          <button
            type="button"
            onClick={() => {
              window.location.href = "https://grblab.co.kr/hpartners.html";
            }}
            style={{
              width: "100%",
              height: 56,
              marginTop: 18,
              border: 0,
              borderRadius: 15,
              background: C.brand,
              color: "#fff",
              fontSize: 16,
              fontWeight: 950,
              boxShadow: "0 8px 20px rgba(201,90,112,.20)",
            }}
          >
            확인
          </button>
        </main>
      </>
    );

    if (!isDesktopLayout) return completeContent;

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="신청 완료"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1200,
          display: "grid",
          placeItems: "center",
          padding: 28,
          background: "rgba(31,35,41,.44)",
          overflow: "auto",
        }}
      >
        <div
          style={{
            width: "min(680px, calc(100vw - 56px))",
            maxHeight: "calc(100vh - 56px)",
            overflowY: "auto",
            background: "#fff",
            borderRadius: 22,
            boxShadow: "0 28px 80px rgba(20,24,32,.28)",
          }}
        >
          {completeContent}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.canvas,
        color: C.ink,
        fontFamily: FONT,
      }}
    >
      <style>{`
        * { box-sizing:border-box; }
        html,body,#root { margin:0; min-height:100%; background:${C.canvas}; }
        button,input,select { font:inherit; }
        button { cursor:pointer; }
        button:disabled { cursor:not-allowed; }
        select:disabled { cursor:not-allowed; }

        .hp-global-header {
          height:78px;
          position:sticky;
          top:0;
          z-index:1100;
          background:rgba(255,250,247,.84);
          backdrop-filter:blur(18px);
          -webkit-backdrop-filter:blur(18px);
          border-bottom:1px solid rgba(115,84,68,.08);
        }

        .hp-global-shell {
          width:min(calc(100% - 48px),1180px);
          height:100%;
          margin-inline:auto;
          display:flex;
          align-items:center;
          gap:28px;
        }

        .hp-global-brand {
          font-family:var(--font-display,'Pretendard','Malgun Gothic',system-ui,sans-serif) !important;
          font-size:27px;
          font-weight:400;
          letter-spacing:-.08em;
          line-height:1;
          white-space:nowrap;
          color:#11192a;
          text-decoration:none;
        }

        .hp-global-brand span {
          color:#11192a;
          font:inherit;
        }

        .hp-global-brand b {
          color:#f4476b;
          font:inherit;
          font-weight:400;
        }

        .hp-global-nav {
          display:flex;
          align-items:center;
          gap:28px;
          margin-left:auto;
          font-family:var(--font-ui,'Pretendard','SUIT',system-ui,sans-serif) !important;
          font-size:13px;
          font-weight:700;
        }

        .hp-global-nav a {
          position:relative;
          color:#11192a;
          opacity:.78;
          font:inherit;
          letter-spacing:-.025em;
          line-height:1.2;
          text-decoration:none;
          white-space:nowrap;
        }

        .hp-global-nav a:hover {
          opacity:1;
        }

        .hp-global-nav .hp-global-current {
          color:#f4476b;
          opacity:1;
        }

        .hp-global-nav .hp-global-current::after {
          content:"";
          position:absolute;
          left:0;
          right:0;
          bottom:-12px;
          height:2px;
          border-radius:999px;
          background:#ee6f93;
        }

        .hp-global-cta {
          margin-left:6px;
          padding:10px 17px;
          border-radius:999px;
          background:#11192a;
          color:#fff;
          font-family:var(--font-ui,'Pretendard','SUIT',system-ui,sans-serif) !important;
          font-size:12px;
          font-weight:700;
          letter-spacing:-.025em;
          line-height:1.2;
          text-decoration:none;
          white-space:nowrap;
        }

        .hp-global-menu-button {
          display:none;
          margin-left:auto;
          width:40px;
          height:40px;
          border:0;
          background:transparent;
          padding:8px;
        }

        .hp-global-menu-button span {
          display:block;
          height:2px;
          margin:6px 0;
          background:#11192a;
        }

        .hp-global-mobile-nav {
          position:fixed;
          z-index:1099;
          left:14px;
          right:14px;
          top:72px;
          padding:12px;
          border:1px solid rgba(102,79,67,.14);
          border-radius:20px;
          background:#fff;
          box-shadow:0 24px 60px rgba(58,42,32,.11);
        }

        .hp-global-mobile-nav a {
          display:block;
          padding:14px;
          color:#11192a;
          font-family:var(--font-ui,'Pretendard','SUIT',system-ui,sans-serif) !important;
          font-size:13px;
          font-weight:700;
          text-decoration:none;
        }

        .hp-global-mobile-nav .hp-global-current {
          color:#f4476b;
        }

        .hp-local-page-header {
          top:78px !important;
        }

        .hp-page-frame {
          width:100%;
          max-width:520px;
          min-height:calc(100vh - 78px);
          margin:0 auto;
          background:#fff;
          box-shadow:0 0 36px rgba(31,35,41,.08);
        }

        .hp-map-list-layout {
          display:block;
        }

        .hp-summary-layout {
          display:block;
        }

        @media (max-width:980px) {
          .hp-global-nav,
          .hp-global-cta {
            display:none;
          }

          .hp-global-menu-button {
            display:block;
          }
        }

        @media (max-width:640px) {
          .hp-global-header {
            height:66px;
          }

          .hp-global-shell {
            width:calc(100% - 24px);
          }

          .hp-global-brand {
            font-size:24px;
          }

          .hp-global-mobile-nav {
            top:66px;
            left:12px;
            right:12px;
          }

          .hp-local-page-header {
            top:66px !important;
          }
        }

        @media (min-width:980px) {
          .hp-page-frame {
            width:calc(100% - 48px);
            max-width:1180px;
          }

          .hp-page-frame header {
            padding-left:clamp(18px, 2.4vw, 30px) !important;
            padding-right:clamp(18px, 2.4vw, 30px) !important;
          }

          .hp-page-frame.hp-main-desktop .hp-map-list-layout {
            display:grid;
            grid-template-columns:minmax(0,1.35fr) minmax(320px,.85fr);
            gap:16px;
            padding:0 28px 36px;
            align-items:start;
            background:#fff;
          }

          .hp-page-frame.hp-main-desktop .hp-map-pane {
            position:sticky;
            top:18px;
            min-width:0;
          }

          .hp-page-frame.hp-main-desktop .hp-map-canvas {
            height:calc(100vh - 185px) !important;
            min-height:540px;
            max-height:760px;
            border-radius:18px !important;
          }

          .hp-page-frame.hp-main-desktop .hp-list-pane {
            min-width:0;
            max-height:calc(100vh - 150px);
            overflow-y:auto;
            overscroll-behavior:contain;
            padding-right:4px !important;
          }

          .hp-page-frame.hp-main-desktop .hp-list-pane::-webkit-scrollbar {
            width:5px;
          }

          .hp-page-frame.hp-main-desktop .hp-list-pane::-webkit-scrollbar-thumb {
            background:#d9dce1;
            border-radius:999px;
          }

          .hp-summary-layout {
            display:grid;
            grid-template-columns:minmax(350px,.92fr) minmax(0,1.08fr);
            grid-template-rows:auto auto auto;
            column-gap:18px;
            row-gap:14px;
            padding:18px 28px 112px;
            align-items:start;
          }

          .hp-summary-hero-wrap {
            grid-column:1;
            grid-row:1;
            padding:0 !important;
          }

          .hp-summary-hero-wrap > section {
            min-height:290px !important;
          }

          .hp-summary-hero-wrap > section > img {
            width:62% !important;
            max-width:330px !important;
          }

          .hp-summary-main {
            display:contents;
          }

          .hp-summary-selection {
            grid-column:1;
            grid-row:2;
            margin:0 !important;
          }

          .hp-summary-activity {
            grid-column:2;
            grid-row:1;
            margin:0 !important;
          }

          .hp-summary-compare {
            grid-column:2;
            grid-row:2;
            margin:0 !important;
          }

          .hp-summary-shared {
            grid-column:2;
            grid-row:3;
            margin:0 !important;
          }
        }
      `}</style>

      {renderGlobalHeader()}

      <div
        className={`hp-page-frame ${
          page === "main" && isDesktopLayout
            ? "hp-main-desktop"
            : ""
        }`}
      >
        {/* main 화면은 unmount하지 않는다.
            상세/확인 화면에서 돌아왔을 때 Naver Map DOM과 mapRef 연결이 끊어지지 않게
            display만 전환한다. */}
        <div style={{ display: page === "main" ? "block" : "none" }}>
          {renderMain()}
        </div>

        <div style={{ display: page === "summary" ? "block" : "none" }}>
          {page === "summary" && renderSummary()}
        </div>

        <div style={{ display: page === "complete" ? "block" : "none" }}>
          {page === "complete" && renderComplete()}
        </div>
      </div>
    </div>
  );
}

