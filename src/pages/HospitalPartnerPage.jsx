import React, { useEffect, useMemo, useRef, useState } from "react";

const NCP_CLIENT_ID = "fu193267aq";
const BUSAN = { lat: 35.1795543, lng: 129.0756416 };
const BUSAN_BOX = { south: 34.95, west: 128.72, north: 35.42, east: 129.32 };
const FONT = "'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";

const MAX_NEIGHBORHOODS = 3;
const APARTMENTS_URL = "/busan-apartments-700plus.json";
// TEST ONLY: 브라우저에서 SOLAPI 직접 호출
const SOLAPI_API_KEY = "NCSTBYVI4YZVHL54";
const SOLAPI_API_SECRET = "EJEAVM1ZEENMWA3TBMUMSQNDNMS8FEAS";

// SOLAPI에서 등록/승인된 실제 발신번호를 숫자만 입력하세요.
const SOLAPI_FROM = "발신번호입력";

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
  const res = await fetch(APARTMENTS_URL, { credentials: "omit" });
  if (!res.ok) throw new Error(`${APARTMENTS_URL} HTTP ${res.status}`);
  const rows = await res.json();
  return rows.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && Number(p.households) > 0);
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


function markerHtmlForApartment(p, isPriority, zoom) {
  const size = apartmentMarkerSize(p.households, zoom);

  if (zoom <= 13) {
    const circle = apartmentStatusCircleSize(p.households);
    return `
      <div style="
        width:${circle}px;
        height:${circle}px;
        border-radius:50%;
        background:${isPriority ? C.brand : "#ffffff"};
        border:2px solid ${isPriority ? C.brand : "#c95a70"};
        box-shadow:${isPriority ? "0 0 0 5px rgba(201,90,112,.22),0 4px 12px rgba(31,35,41,.18)" : "0 3px 9px rgba(31,35,41,.14)"};
        display:grid;
        place-items:center;
        box-sizing:border-box;
        color:#fff;
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
            title="우선권 단지 해제"
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
        background:${isPriority ? C.brand : "#ffffff"};
        border:2.2px solid ${isPriority ? C.brand : "#c95a70"};
        box-shadow:${isPriority ? "0 0 0 5px rgba(201,90,112,.22),0 5px 14px rgba(31,35,41,.20)" : "0 4px 11px rgba(31,35,41,.16)"};
        display:grid;
        place-items:center;
        box-sizing:border-box;
        color:#ffffff;
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
    <div style={{ height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", borderBottom: `1px solid ${C.line}`, background: "#fff", position: "sticky", top: 0, zIndex: 20 }}>
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
  const [error, setError] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState(() => new Map());
  const selectedNeighborhoodsRef = useRef(new Map());
  const [priorityApartmentKey, setPriorityApartmentKey] = useState(null);
  const [detailKey, setDetailKey] = useState(null);
  const [page, setPage] = useState("main"); // main | detail | summary | complete
  const [zoom, setZoom] = useState(11);
  const [bounds, setBounds] = useState(null);
  const [listLimit, setListLimit] = useState(12);

  const [applicantName, setApplicantName] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicationNo, setApplicationNo] = useState("");
  const [applicationSubmittedAt, setApplicationSubmittedAt] = useState("");
  const [showCertificate, setShowCertificate] = useState(false);
  const [submitState, setSubmitState] = useState({ loading: false, error: "" });

  // 고령 사용자용 단계 안내.
  // 처음에는 구 선택/지도 확대 방법부터 지도 위 큰 모달로 안내한다.
  const [guide, setGuide] = useState({ type: "start" });
  const [priorityStageStarted, setPriorityStageStarted] = useState(false);
  const dongGuideShownRef = useRef(false);

  useEffect(() => {
    selectedNeighborhoodsRef.current = selectedNeighborhoods;
  }, [selectedNeighborhoods]);

  // 지도 위 우선권 단지 알약의 오른쪽 X 버튼 처리.
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
    (async () => {
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

        setAllApartments(normalized);
      } catch (e) {
        console.error(e);
        if (!dead) setError(e?.message || "대단지 목록을 불러오지 못했습니다.");
      }
    })();
    return () => { dead = true; };
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

  const detail = useMemo(() => allApartments.find((p) => apartmentKey(p) === detailKey) || null, [allApartments, detailKey]);

  const priorityApartment = useMemo(
    () => allApartments.find((p) => apartmentKey(p) === priorityApartmentKey) || null,
    [allApartments, priorityApartmentKey]
  );

  // 동 3곳을 고른 뒤에도 바로 단지 화면으로 넘어가지 않는다.
  // 완료 모달의 [우선권 단지 선택] 버튼을 눌러야 다음 단계가 시작된다.
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
    (async () => {
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
      } catch (e) {
        console.error(e);
        if (!dead) setError(e?.message || "지도를 불러오지 못했습니다.");
      }
    })();
    return () => {
      dead = true;
      clearTimeout(districtSyncTimerRef.current);
      const nv = window.naver?.maps;
      markersRef.current.forEach(({ marker, listener }) => {
        if (listener && nv) nv.Event.removeListener(listener);
        marker.setMap(null);
      });
      markersRef.current.clear();
      if (nv) mapEventsRef.current.forEach((listener) => nv.Event.removeListener(listener));
      mapEventsRef.current = [];
      mapRef.current = null;
    };
  }, []);

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
  }, [page]);


  // 3/3 완료 모달에서 [우선권 단지 선택]을 누른 뒤에만
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
  // 우선권 단지 선택 모드:
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
        const pill = apartmentPillMetrics(p.name, p.households);

        upsertMarker(
          key,
          {
            position: new nv.LatLng(p.lat, p.lng),
            title: p.name,
            zIndex: isPriority ? 220 : 60,
            icon: {
              // 강제로 14를 넘겨서, 실제 지도 줌값이 낮아도 항상 알약 마커를 그린다.
              content: markerHtmlForApartment(p, isPriority, 14),
              anchor: new nv.Point(pill.circle / 2, pill.height / 2),
            },
          },
          () => openDetail(p)
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
  }, [zoom, bounds, allApartments, districtAgg, selectedNeighborhoods, selectedApartmentRows, priorityMode, priorityApartmentKey, selectedDistrict]);

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

    if (priorityApartmentKey === key) {
      // 이미 선택된 우선권 단지를 다시 누르면 해제만 하고 지도에 머문다.
      setPriorityApartmentKey(null);
      return;
    }

    // 새 선택 또는 기존 우선권 교체:
    // 선택 즉시 최종 '활동지역 확인' 화면으로 이동한다.
    setPriorityApartmentKey(key);
    setPage("summary");
  }

  function openDetail(p) {
    setDetailKey(apartmentKey(p));
    setPage("detail");
  }

  const detailNeighborhoodSelected = detail
    ? selectedNeighborhoods.has(neighborhoodKey(detail.district, detail.neighborhood))
    : false;
  const detailPriority = detail ? priorityApartmentKey === apartmentKey(detail) : false;

  function handleGuideAction() {
    if (!guide) return;

    if (guide.type === "dongComplete") {
      if (selectedNeighborhoodsRef.current.size !== MAX_NEIGHBORHOODS) return;
      setPriorityStageStarted(true);
      setGuide({ type: "priorityIntro" });
      return;
    }

    setGuide(null);
  }

  function renderMapGuide() {
    if (!guide || page !== "main") return null;

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
      body = "이제 선택한 3개 동의 대단지 중에서 우선권 단지 1곳을 선택합니다.";
      progress = "3 / 3";
      button = "우선권 단지 선택";
      accent = true;
    } else if (guide.type === "priorityIntro") {
      title = "우선권 단지를 선택해주세요";
      body = "선택한 3개 동의 아파트만 표시했습니다. 지도에서 아파트 이름을 눌러주세요.";
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

  function renderApplicationProgress(activeStep = 1) {
    const steps = [
      { no: 1, label: "활동지역 선택" },
      { no: 2, label: "신청자 정보" },
      { no: 3, label: "신청 완료" },
    ];

    return (
      <div style={{ marginTop: 17 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center" }}>
          {steps.map((step, index) => {
            const active = step.no === activeStep;
            const done = step.no < activeStep;
            return (
              <div
                key={step.no}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: index === 0 ? "flex-start" : index === 2 ? "flex-end" : "center",
                  minWidth: 0,
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
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      flex: "0 0 auto",
                      background: active ? C.brand : done ? C.brandSoft : "#fff",
                      border: active ? `1px solid ${C.brand}` : done ? "1px solid #e7bdc7" : "1px solid #d7dbe1",
                      color: active ? "#fff" : done ? C.brand : "#8b9098",
                      fontSize: 14,
                      fontWeight: 950,
                    }}
                  >
                    {done ? "✓" : step.no}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: active ? 950 : 800,
                      color: active ? C.brand : done ? C.ink : "#7e838b",
                      whiteSpace: "nowrap",
                      letterSpacing: "-.02em",
                    }}
                  >
                    {step.label}
                  </div>
                </div>
              </div>
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
              width: activeStep === 1 ? "33.333%" : activeStep === 2 ? "66.666%" : "100%",
              height: "100%",
              background: C.brand,
            }}
          />
        </div>
      </div>
    );
  }

  function renderMain() {
    const neighborhoodMode = !priorityMode && zoom >= 12;
    const apartmentMode = priorityMode;
    const remainingNeighborhoods = Math.max(
      0,
      MAX_NEIGHBORHOODS - selectedNeighborhoods.size
    );

    return (
      <>
        <header style={{ padding: "16px 18px 12px", background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 950,
                letterSpacing: "-.045em",
                color: C.ink,
              }}
            >
              나눔이음
            </div>

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
              활동지역 선택
            </div>
          </div>

          {renderApplicationProgress(1)}

          <div style={{ marginTop: 26 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 29,
                lineHeight: 1.25,
                letterSpacing: "-.045em",
                color: C.ink,
              }}
            >
              {priorityMode ? "우선권 단지를 선택해주세요" : "병원동행 파트너 신청"}
            </h1>

            {!priorityMode ? (
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
            ) : (
              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: 13.5,
                  color: C.muted,
                  lineHeight: 1.6,
                  fontWeight: 700,
                }}
              >
                선택한 3개 동의 대단지 중에서 우선권 단지 1곳을 선택해주세요.
              </p>
            )}
          </div>

          {!priorityMode && (
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

        <div style={{ padding: "0 18px", background: "#fff" }}>
          <div
            style={{
              position: "relative",
              height: priorityMode ? 360 : 405,
              borderRadius: 17,
              overflow: "hidden",
              background: "#edf0f2",
              border: `1px solid ${C.line}`,
            }}
          >
            <div ref={mapElRef} style={{ position: "absolute", inset: 0 }}/>

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
                선택한 3개 동의 대단지만 표시 · ★ 우선권 단지
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

        <section style={{ padding: "18px 18px 115px", background: "#fff" }}>
          {!priorityMode && (
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

          {neighborhoodMode ? (
            <div style={{ marginTop: 17 }}>
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
          ) : apartmentMode ? (
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
                  <div style={{ marginTop: 3, fontSize: 11.5, color: C.muted }}>
                    선택한 활동 동 안에서 우선권 단지 1곳을 선택하세요.
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
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedApartmentRows.slice(0, listLimit).map((p) => {
                    const key = apartmentKey(p);
                    const nKey = neighborhoodKey(p.district, p.neighborhood);
                    const regionSelected = selectedNeighborhoods.has(nKey);
                    const priority = priorityApartmentKey === key;
                    const tier = householdTier(p.households);

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
                          onClick={() => openDetail(p)}
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
                              ? "우선권 해제"
                              : regionSelected
                                ? "우선권 선택"
                                : "동 미선택"}
                          </button>

                          <button
                            type="button"
                            onClick={() => openDetail(p)}
                            style={{
                              border: 0,
                              background: "transparent",
                              color: C.muted,
                              fontSize: 10.5,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            상세 <IconChevronRight size={13}/>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedApartmentRows.length > listLimit && (
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

        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 0,
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: 520,
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
                ? "우선권 단지 선택하기"
                : `활동할 동 ${remainingNeighborhoods}곳을 선택해주세요`}
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
              {priorityApartment ? "선택 내용 확인" : "우선권 단지를 선택해주세요"}
            </button>
          )}
        </div>
      </>
    );
  }

  function renderDetail() {
    if (!detail) return null;
    const tier = householdTier(detail.households);
    const nKey = neighborhoodKey(detail.district, detail.neighborhood);
    const regionSelected = selectedNeighborhoods.has(nKey);
    const regionFull = !regionSelected && selectedNeighborhoods.size >= MAX_NEIGHBORHOODS;
    const replacingPriority = Boolean(priorityApartment && !detailPriority);

    return (
      <>
        <PageHeader title="대단지 상세" onBack={() => setPage("main")}/>
        <main style={{ padding: "22px 18px 110px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
            <div style={{ minWidth: 0 }}>
              {detailPriority && <div style={{ display: "inline-flex", padding: "5px 9px", borderRadius: 999, background: C.brandSoft, color: C.brand, fontSize: 11, fontWeight: 900 }}>★ 내 우선권 단지</div>}
              {replacingPriority && <div style={{ display: "inline-flex", padding: "5px 9px", borderRadius: 999, background: "#fff0f3", color: C.brand, border: "1px solid #ecc1cb", fontSize: 11, fontWeight: 900 }}>우선권 교체 후보</div>}
              <h2 style={{ margin: (detailPriority || replacingPriority) ? "12px 0 3px" : "0 0 3px", fontSize: 25, lineHeight: 1.22, letterSpacing: "-.04em" }}>{detail.name}</h2>
              <div style={{ fontSize: 12.5, color: C.muted }}>{detail.district} {detail.neighborhood}</div>
            </div>
            <div style={{ flex: "0 0 auto", textAlign: "right" }}>
              <strong style={{ display: "block", fontSize: detail.households >= 2000 ? 30 : 27, color: C.brand, letterSpacing: "-.04em" }}>{detail.households.toLocaleString("ko-KR")}</strong>
              <span style={{ fontSize: 11.5, color: C.muted }}>세대 · {tier.label}</span>
            </div>
          </div>

          <div style={{ marginTop: 22, padding: 16, border: regionSelected ? `1.5px solid ${C.brand}` : `1px solid ${C.line}`, borderRadius: 16, background: regionSelected ? "#fffafb" : "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 800 }}>이 단지가 속한 활동지역</div>
                <div style={{ marginTop: 4, fontSize: 18, fontWeight: 900 }}>{detail.neighborhood}</div>
              </div>
              <button
                type="button"
                disabled={regionFull}
                onClick={() => toggleNeighborhood({
                  district: detail.district,
                  neighborhood: detail.neighborhood,
                })}
                style={{ height: 36, padding: "0 12px", borderRadius: 10, border: `1px solid ${regionSelected ? C.line : regionFull ? C.line : C.brand}`, background: regionSelected ? "#fff" : regionFull ? "#f3f4f6" : C.brand, color: regionSelected ? C.muted : regionFull ? "#a2a7af" : "#fff", fontSize: 12, fontWeight: 900 }}
              >
                {regionSelected ? "활동지역 해제" : regionFull ? "3개 동 선택 완료" : "활동지역 선택"}
              </button>
            </div>
          </div>

          {replacingPriority && (
            <div style={{
              marginTop: 16,
              padding: "16px",
              borderRadius: 16,
              background: "#fff8fa",
              border: `1.5px solid #e8b4c0`,
            }}>
              <div style={{ fontSize: 13, color: C.brand, fontWeight: 900 }}>
                우선권 단지를 교체합니다
              </div>

              <div style={{
                marginTop: 12,
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) 28px minmax(0,1fr)",
                gap: 8,
                alignItems: "center",
              }}>
                <div style={{
                  minWidth: 0,
                  padding: "12px",
                  borderRadius: 12,
                  background: "#fff",
                  border: `1px solid ${C.line}`,
                }}>
                  <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 800 }}>현재 우선권</div>
                  <div style={{
                    marginTop: 5,
                    fontSize: 13,
                    fontWeight: 900,
                    color: C.ink,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {priorityApartment.name}
                  </div>
                  <div style={{ marginTop: 3, fontSize: 10.5, color: C.muted }}>
                    {priorityApartment.neighborhood}
                  </div>
                </div>

                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: C.brandSoft,
                  color: C.brand,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 17,
                  fontWeight: 900,
                }}>
                  →
                </div>

                <div style={{
                  minWidth: 0,
                  padding: "12px",
                  borderRadius: 12,
                  background: C.brandSoft,
                  border: `1.5px solid #e5aeba`,
                }}>
                  <div style={{ fontSize: 10.5, color: C.brand, fontWeight: 900 }}>새 우선권</div>
                  <div style={{
                    marginTop: 5,
                    fontSize: 13,
                    fontWeight: 900,
                    color: C.brand,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {detail.name}
                  </div>
                  <div style={{ marginTop: 3, fontSize: 10.5, color: "#9f5969" }}>
                    {detail.neighborhood}
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: 11,
                padding: "10px 11px",
                borderRadius: 10,
                background: "#fff",
                color: C.muted,
                fontSize: 11.5,
                lineHeight: 1.55,
              }}>
                이 단지를 선택하면 <strong style={{ color: C.ink }}>{priorityApartment.name}</strong>의 우선권은 자동으로 해제되고,
                <strong style={{ color: C.brand }}> {detail.name}</strong>으로 교체됩니다.
              </div>
            </div>
          )}

          <div style={{ marginTop: 16, padding: "18px 16px", borderRadius: 16, background: "#faf8f7", border: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 15, fontWeight: 900 }}>우선권 단지란?</div>
            <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.65, color: C.muted }}>
              선택한 3개 활동 동의 대단지 중 예약을 가장 우선적으로 받고 싶은 단지 1곳을 정합니다.
            </p>
            <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 12, background: "#fff", border: `1px solid ${C.line}`, fontSize: 12.5, lineHeight: 1.6 }}>
              다른 파트너의 선택 현황이나 선택 인원은 화면에 표시하지 않습니다.
            </div>
          </div>
        </main>

        <div style={{ position: "fixed", left: "50%", bottom: 0, transform: "translateX(-50%)", width: "100%", maxWidth: 520, padding: "10px 14px calc(10px + env(safe-area-inset-bottom))", background: "rgba(255,255,255,.97)", borderTop: `1px solid ${C.line}`, zIndex: 30 }}>
          <button
            type="button"
            disabled={!regionSelected}
            onClick={() => {
              if (!regionSelected) return;

              if (detailPriority) {
                // 현재 우선권 단지를 해제하는 경우에는 다시 지도에서 선택할 수 있게 복귀.
                setPriorityApartmentKey(null);
                setPage("main");
                return;
              }

              // 새 우선권 선택 또는 기존 우선권 교체:
              // 기존 key는 새 key로 덮어써지고 곧바로 최종 확인 화면을 보여준다.
              setPriorityApartmentKey(apartmentKey(detail));
              setPage("summary");
            }}
            style={{
              width: "100%",
              height: 52,
              border: 0,
              borderRadius: 14,
              background: !regionSelected ? "#d7d9de" : detailPriority ? "#fff" : C.brand,
              color: !regionSelected ? "#fff" : detailPriority ? C.brand : "#fff",
              boxShadow: detailPriority ? `inset 0 0 0 1px ${C.brand}` : replacingPriority ? "0 5px 14px rgba(201,90,112,.22)" : "none",
              fontWeight: 900,
              fontSize: 15,
            }}
          >
            {!regionSelected
              ? `${detail.neighborhood}을 먼저 활동지역으로 선택`
              : detailPriority
                ? "우선권 단지 선택 해제"
                : replacingPriority
                  ? "이 단지로 우선권 교체"
                  : "이 단지를 우선권 단지로 선택"}
          </button>
        </div>
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

  async function hmacSha256Hex(secret, message) {
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(message)
    );

    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function makeRandomSalt() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function makeClientApplicationNo() {
    const tail = String(Date.now()).slice(-6);
    const rand = String(Math.floor(Math.random() * 100)).padStart(2, "0");
    return `NE-0929-${tail}${rand}`;
  }

  async function makeSolapiAuthHeader() {
    const date = new Date().toISOString();
    const salt = makeRandomSalt();
    const signature = await hmacSha256Hex(
      SOLAPI_API_SECRET,
      date + salt
    );

    return `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;
  }

  function buildSolapiMessage({
    name,
    regions,
    priorityName,
    applicationNo,
  }) {
    return `[나눔이음의료복지사회적협동조합]
${name}님의 병원동행 파트너 신청이 접수되었습니다.

활동지역
${regions.map((n) => n.neighborhood).join(" / ")}

우선권 단지
${priorityName}

신청번호
${applicationNo}

9월 29일 병원동행 파트너 가입 안내
오후 1시
부산시민회관 대강당

당일 본인 확인 및 보유 우대 자격증 확인을 진행합니다.
신분증, 운전면허증, 보유 우대 자격증(해당자)을 준비해주세요.`;
  }

  async function submitApplication() {
    const name = applicantName.trim();
    const phone = applicantPhone.trim();
    const phoneDigits = phone.replace(/\D/g, "");
    const fromDigits = String(SOLAPI_FROM || "").replace(/\D/g, "");
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

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      setSubmitState({
        loading: false,
        error: "SOLAPI API Key / Secret 설정을 확인해주세요.",
      });
      return;
    }

    if (!/^\d{8,12}$/.test(fromDigits)) {
      setSubmitState({
        loading: false,
        error:
          "HospitalPartnerPage.jsx 상단의 SOLAPI_FROM에 SOLAPI에서 승인된 발신번호를 숫자만 입력해주세요.",
      });
      return;
    }

    setSubmitState({ loading: true, error: "" });

    const no = makeClientApplicationNo();
    const submittedAt = new Date().toLocaleString("ko-KR");

    try {
      const authorization = await makeSolapiAuthHeader();

      const messageText = buildSolapiMessage({
        name,
        regions,
        priorityName: priorityApartment.name,
        applicationNo: no,
      });

      console.log("[SOLAPI DIRECT] request", {
        to: phoneDigits.slice(0, 3) + "****" + phoneDigits.slice(-4),
        from: fromDigits,
        applicationNo: no,
        textLength: messageText.length,
      });

      const response = await fetch(
        "https://api.solapi.com/messages/v4/send-many/detail",
        {
          method: "POST",
          headers: {
            Authorization: authorization,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                to: phoneDigits,
                from: fromDigits,
                text: messageText,
                type: "LMS",
                country: "82",
                subject: "병원동행 파트너 신청 확인",
              },
            ],
            strict: true,
            allowDuplicates: false,
            showMessageList: true,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      console.log("[SOLAPI DIRECT] response", {
        httpStatus: response.status,
        ok: response.ok,
        data,
      });

      if (!response.ok) {
        const msg =
          data?.errorMessage ||
          data?.message ||
          data?.errorCode ||
          `SOLAPI HTTP ${response.status}`;

        throw new Error(`SOLAPI 오류: ${msg}`);
      }

      if (
        Array.isArray(data?.failedMessageList) &&
        data.failedMessageList.length > 0
      ) {
        const failed = data.failedMessageList[0] || {};
        throw new Error(
          `문자 접수 실패: ${
            failed.statusMessage ||
            failed.errorMessage ||
            failed.statusCode ||
            "SOLAPI에서 발송을 거절했습니다."
          }`
        );
      }

      const groupId =
        data?.groupInfo?.groupId ||
        data?.groupId ||
        "";

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
            smsRequestId: groupId,
            smsProvider: "SOLAPI_DIRECT_BROWSER",
          })
        );
      } catch (_) {}

      setSubmitState({ loading: false, error: "" });
      setPage("complete");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error("[SOLAPI DIRECT] failed", e);

      const raw = e?.message || String(e);
      const corsHint =
        /failed to fetch|networkerror|load failed/i.test(raw)
          ? "\n브라우저 직접 호출이 차단된 경우 개발자도구 Console의 CORS 오류를 확인해주세요."
          : "";

      setSubmitState({
        loading: false,
        error: `${raw}${corsHint}`,
      });
    }
  }

  // 우선권 단지를 새로 선택하거나 교체하면 이 화면으로 즉시 이동한다.
  function renderSummary() {
    const regions = [...selectedNeighborhoods.values()];
    const canSubmit =
      regions.length === MAX_NEIGHBORHOODS &&
      Boolean(priorityApartment) &&
      applicantName.trim().length >= 2 &&
      validApplicantPhone(applicantPhone);

    return (
      <>
        <PageHeader title="신청 내용 확인" onBack={() => setPage("main")}/>
        <div style={{ padding: "0 18px 4px", background: "#fff" }}>
          {renderApplicationProgress(2)}
        </div>
        <main style={{ padding: "22px 18px 150px" }}>
          <div>
            <div style={{ fontSize: 13, color: C.muted, fontWeight: 700 }}>선택한 활동지역</div>
            <div style={{ marginTop: 4, fontSize: 29, fontWeight: 900, letterSpacing: "-.04em" }}>
              <span style={{ color: C.brand }}>{regions.length}</span> / {MAX_NEIGHBORHOODS}개 동
            </div>
          </div>

          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 9 }}>
            {regions.map((n, i) => (
              <div
                key={neighborhoodKey(n.district, n.neighborhood)}
                style={{
                  padding: 14,
                  border: `1px solid ${C.line}`,
                  borderRadius: 15,
                  background: "#fff",
                  display: "grid",
                  gridTemplateColumns: "28px minmax(0,1fr) auto",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.brandSoft, color: C.brand, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 900 }}>
                  {i + 1}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 900 }}>{n.neighborhood}</div>
                  <div style={{ marginTop: 3, fontSize: 11.5, color: C.muted }}>
                    {n.district} · 대단지 {n.count || 0}곳 · {(n.households || 0).toLocaleString("ko-KR")}세대
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="활동지역 변경"
                  onClick={() => { toggleNeighborhood(n); setPage("main"); }}
                  style={{ width: 34, height: 34, border: `1px solid ${C.line}`, borderRadius: 10, background: "#fff", display: "grid", placeItems: "center" }}
                >
                  <IconX/>
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 13, color: C.muted, fontWeight: 700 }}>우선권 단지</div>
            {priorityApartment ? (
              <div
                style={{
                  marginTop: 9,
                  padding: "16px 15px",
                  borderRadius: 16,
                  background: C.brandSoft,
                  border: `1.5px solid #e7b5c1`,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ color: C.brand, fontSize: 18 }}>★</span>
                    <strong style={{ fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {priorityApartment.name}
                    </strong>
                  </div>
                  <div style={{ marginTop: 5, fontSize: 11.5, color: C.muted }}>
                    {priorityApartment.district} {priorityApartment.neighborhood} · {priorityApartment.households.toLocaleString("ko-KR")}세대
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setPriorityApartmentKey(null); setPage("main"); }}
                  style={{ flex: "0 0 auto", height: 34, padding: "0 10px", borderRadius: 10, border: `1px solid #e1a9b7`, background: "#fff", color: C.brand, fontSize: 11.5, fontWeight: 900 }}
                >
                  변경
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPage("main")}
                style={{ width: "100%", height: 52, marginTop: 9, borderRadius: 14, border: `1px dashed ${C.brand}`, background: "#fff", color: C.brand, fontSize: 14, fontWeight: 900 }}
              >
                우선권 단지 선택하기
              </button>
            )}
          </div>

          <div style={{ marginTop: 24, paddingTop: 22, borderTop: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 19, fontWeight: 950, letterSpacing: "-.03em" }}>
              신청자 정보를 입력해주세요
            </div>
            <div style={{ marginTop: 5, fontSize: 12.5, lineHeight: 1.6, color: C.muted }}>
              신청 확인서와 9월 29일 파트너 가입 안내를 보내드립니다.
            </div>

            <label style={{ display: "block", marginTop: 18 }}>
              <div style={{ marginBottom: 7, fontSize: 13, fontWeight: 900 }}>신청자 이름</div>
              <input
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value.slice(0, 20))}
                placeholder="이름을 입력해주세요"
                autoComplete="name"
                style={{
                  width: "100%",
                  height: 52,
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

            <label style={{ display: "block", marginTop: 15 }}>
              <div style={{ marginBottom: 7, fontSize: 13, fontWeight: 900 }}>
                신청 확인서를 받을 전화번호
              </div>
              <input
                value={applicantPhone}
                onChange={(e) => setApplicantPhone(normalizePhone(e.target.value))}
                placeholder="010-0000-0000"
                inputMode="numeric"
                autoComplete="tel"
                style={{
                  width: "100%",
                  height: 52,
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
              <div style={{ marginTop: 7, fontSize: 11.5, lineHeight: 1.55, color: C.muted }}>
                신청 완료 후 입력한 번호로 신청 확인서와 파트너 가입 안내를 보내드립니다.
              </div>
            </label>
          </div>

          <div
            style={{
              marginTop: 20,
              padding: "15px",
              borderRadius: 14,
              background: "#faf8f7",
              border: `1px solid ${C.line}`,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, color: C.ink }}>신청 후 다음 단계</div>
            <div style={{ marginTop: 7, fontSize: 12.5, lineHeight: 1.7, color: C.muted }}>
              <strong style={{ color: C.brand }}>9월 29일 오후 1시</strong> · 부산시민회관 대강당<br/>
              병원동행 파트너 가입 시 본인 확인 및 보유 우대 자격증 확인을 진행합니다.
            </div>
          </div>
        </main>

        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 0,
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: 520,
            padding: "10px 14px calc(10px + env(safe-area-inset-bottom))",
            background: "rgba(255,255,255,.97)",
            borderTop: `1px solid ${C.line}`,
            zIndex: 30,
          }}
        >
          <button
            type="button"
            disabled={!canSubmit || submitState.loading}
            onClick={submitApplication}
            style={{
              width: "100%",
              height: 54,
              border: 0,
              borderRadius: 14,
              background: canSubmit && !submitState.loading ? C.brand : "#d7d9de",
              color: "#fff",
              fontSize: 15.5,
              fontWeight: 950,
            }}
          >
            {submitState.loading ? "신청 접수 중..." : "이 내용으로 신청하기"}
          </button>
          {submitState.error && (
            <div style={{ marginTop: 8, padding: "0 4px", color: "#b42318", fontSize: 12, lineHeight: 1.5, textAlign: "center", fontWeight: 800 }}>
              <span style={{ whiteSpace: "pre-line" }}>{submitState.error}</span>
            </div>
          )}
        </div>
      </>
    );
  }

  function renderComplete() {
    const regions = [...selectedNeighborhoods.values()];
    const smsText = `[나눔이음의료복지사회적협동조합]

${applicantName.trim()}님의 병원동행 파트너 신청이 접수되었습니다.

활동지역
${regions.map((n) => n.neighborhood).join(" / ")}

우선권 단지
${priorityApartment?.name || "-"}

신청번호
${applicationNo}

9월 29일 병원동행 파트너 가입 안내
오후 1시 · 부산시민회관 대강당

당일 본인 확인 및 보유 우대 자격증 확인을 진행합니다.
신분증, 운전면허증, 보유 우대 자격증(해당자)을 준비해주세요.

[신청 확인서 보기]`;

    return (
      <>
        <PageHeader title="신청 완료"/>
        <div style={{ padding: "0 18px 4px", background: "#fff" }}>
          {renderApplicationProgress(3)}
        </div>
        <main style={{ padding: "28px 18px 80px" }}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 62,
                height: 62,
                margin: "0 auto",
                borderRadius: "50%",
                background: C.brand,
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontSize: 30,
                fontWeight: 950,
                boxShadow: "0 10px 28px rgba(201,90,112,.24)",
              }}
            >
              ✓
            </div>

            <h2 style={{ margin: "17px 0 6px", fontSize: 25, letterSpacing: "-.04em" }}>
              신청이 완료되었습니다
            </h2>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: C.muted }}>
              신청 확인서와 9월 29일 파트너 가입 안내를<br/>
              <strong style={{ color: C.ink }}>{applicantPhone}</strong> 번호로 보내드립니다.
            </p>
          </div>

          <div style={{ marginTop: 24, padding: "17px 16px", borderRadius: 16, background: "#fff", border: `1px solid ${C.line}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 800 }}>신청번호</div>
                <div style={{ marginTop: 4, fontSize: 18, fontWeight: 950, color: C.brand }}>{applicationNo}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 800 }}>신청자</div>
                <div style={{ marginTop: 4, fontSize: 14, fontWeight: 900 }}>{applicantName.trim()}</div>
              </div>
            </div>

            <div style={{ marginTop: 15, paddingTop: 15, borderTop: `1px solid ${C.line}` }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 800 }}>활동지역</div>
              <div style={{ marginTop: 5, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {regions.map((n) => (
                  <span
                    key={neighborhoodKey(n.district, n.neighborhood)}
                    style={{
                      padding: "6px 9px",
                      borderRadius: 999,
                      background: C.brandSoft,
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

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 800 }}>우선권 단지</div>
              <div style={{ marginTop: 5, fontSize: 15, fontWeight: 950 }}>
                ★ {priorityApartment?.name || "-"}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 16,
              padding: "18px 16px",
              borderRadius: 17,
              background: C.brandSoft,
              border: "1px solid #e9bdc7",
            }}
          >
            <div style={{ fontSize: 12, color: C.brand, fontWeight: 900 }}>다음 단계</div>
            <div style={{ marginTop: 5, fontSize: 21, fontWeight: 950, color: C.ink }}>
              9월 29일 병원동행 파트너 가입
            </div>
            <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, color: C.ink, fontWeight: 800 }}>
              오후 1시<br/>
              부산시민회관 대강당
            </div>

            <div style={{ marginTop: 13, padding: "12px", borderRadius: 12, background: "#fff", fontSize: 12.5, lineHeight: 1.7, color: C.muted }}>
              당일 <strong style={{ color: C.ink }}>본인 확인 및 보유 우대 자격증 확인</strong>을 진행합니다.<br/>
              신분증 · 운전면허증 · 보유 우대 자격증(해당자)을 준비해주세요.
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCertificate((v) => !v)}
            style={{
              width: "100%",
              height: 52,
              marginTop: 16,
              borderRadius: 14,
              border: `1.5px solid ${C.brand}`,
              background: "#fff",
              color: C.brand,
              fontSize: 14.5,
              fontWeight: 950,
            }}
          >
            {showCertificate ? "신청 확인서 닫기" : "신청 확인서 보기"}
          </button>

          {showCertificate && (
            <div style={{ marginTop: 12, padding: "18px 16px", borderRadius: 16, border: `1px solid ${C.line}`, background: "#fff" }}>
              <div style={{ textAlign: "center", fontSize: 18, fontWeight: 950 }}>병원동행 파트너 신청 확인서</div>
              <div style={{ marginTop: 4, textAlign: "center", fontSize: 11.5, color: C.muted }}>
                나눔이음의료복지사회적협동조합
              </div>

              <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "94px 1fr", rowGap: 10, fontSize: 12.5 }}>
                <div style={{ color: C.muted, fontWeight: 800 }}>신청번호</div><div style={{ fontWeight: 900 }}>{applicationNo}</div>
                <div style={{ color: C.muted, fontWeight: 800 }}>신청자</div><div style={{ fontWeight: 900 }}>{applicantName.trim()}</div>
                <div style={{ color: C.muted, fontWeight: 800 }}>전화번호</div><div style={{ fontWeight: 900 }}>{applicantPhone}</div>
                <div style={{ color: C.muted, fontWeight: 800 }}>활동지역</div><div style={{ fontWeight: 900 }}>{regions.map((n) => n.neighborhood).join(" / ")}</div>
                <div style={{ color: C.muted, fontWeight: 800 }}>우선권 단지</div><div style={{ fontWeight: 900 }}>{priorityApartment?.name || "-"}</div>
                <div style={{ color: C.muted, fontWeight: 800 }}>신청일시</div><div style={{ fontWeight: 900 }}>{applicationSubmittedAt}</div>
              </div>

              <div style={{ marginTop: 17, paddingTop: 14, borderTop: `1px solid ${C.line}`, fontSize: 12, lineHeight: 1.65, color: C.muted }}>
                위 내용으로 병원동행 파트너 활동지역 및 우선권 단지를 신청하였습니다.
              </div>
            </div>
          )}

          <div style={{ marginTop: 18, padding: "15px", borderRadius: 14, background: "#f7f7f8", border: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: C.ink }}>문자로 안내되는 내용</div>
            <pre
              style={{
                margin: "10px 0 0",
                whiteSpace: "pre-wrap",
                fontFamily: FONT,
                fontSize: 11.5,
                lineHeight: 1.65,
                color: C.muted,
              }}
            >
              {smsText}
            </pre>
          </div>
        </main>
      </>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.canvas, color: C.ink, fontFamily: FONT }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');
        * { box-sizing:border-box; }
        html,body,#root { margin:0; min-height:100%; background:${C.canvas}; }
        button,input,select { font:inherit; }
        button { cursor:pointer; }
        button:disabled { cursor:not-allowed; }
        select:disabled { cursor:not-allowed; }
      `}</style>
      <div style={{ width: "100%", maxWidth: 520, minHeight: "100vh", margin: "0 auto", background: C.surface, boxShadow: "0 0 36px rgba(31,35,41,.08)" }}>
        {/* main 화면은 unmount하지 않는다.
            상세/확인 화면에서 돌아왔을 때 Naver Map DOM과 mapRef 연결이 끊어지지 않게
            display만 전환한다. */}
        <div style={{ display: page === "main" ? "block" : "none" }}>
          {renderMain()}
        </div>

        <div style={{ display: page === "detail" ? "block" : "none" }}>
          {page === "detail" && renderDetail()}
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

