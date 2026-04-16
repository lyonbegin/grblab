export default function GrbLabPage() {
  const css = `
    :root{
      --navy:#07142f;
      --navy2:#0d214d;
      --blue:#1f62ff;
      --cyan:#34c3ff;
      --sky:#eaf4ff;
      --text:#10213f;
      --muted:#6a7c99;
      --line:#d9e7ff;
      --white:#ffffff;
      --card:#f7fbff;
      --accent:#0b55ff;
      --shadow:0 16px 40px rgba(11,39,91,.14);
      --radius:24px;
      --max:1180px;
    }
    *{box-sizing:border-box}
    html{scroll-behavior:smooth}
    body{
      margin:0;
      font-family:"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif;
      color:var(--text);
      background:linear-gradient(180deg,#f7fbff 0%,#edf5ff 100%);
      line-height:1.7;
    }
    img{max-width:100%;display:block}
    a{text-decoration:none;color:inherit}
    .grb-container{max-width:var(--max);margin:0 auto;padding:0 28px}
    .grb-section{padding:88px 0}
    .grb-eyebrow{
      display:inline-block;
      padding:8px 14px;
      border-radius:999px;
      background:rgba(52,195,255,.12);
      color:#0f4ad0;
      font-size:13px;
      font-weight:800;
      letter-spacing:.04em;
    }
    .grb-section-title{
      margin:18px 0 12px;
      font-size:clamp(30px,4vw,48px);
      line-height:1.18;
      letter-spacing:-.03em;
    }
    .grb-section-desc{font-size:18px;color:var(--muted);max-width:820px}

    .grb-hero{
      position:relative;
      overflow:hidden;
      background:radial-gradient(circle at top right,rgba(52,195,255,.22),transparent 30%),linear-gradient(135deg,var(--navy) 0%,#0d1e42 38%,#143271 100%);
      color:#fff;
      padding:34px 0 78px;
    }
    .grb-hero:before{
      content:"";
      position:absolute;inset:0;
      background:linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px);
      background-size:32px 32px;
      mask-image:linear-gradient(180deg,rgba(0,0,0,.7),rgba(0,0,0,.15));
      pointer-events:none;
    }
    .grb-topbar{display:flex;justify-content:space-between;gap:20px;align-items:center;padding:12px 0 26px;position:relative;z-index:1}
    .grb-brand{font-size:15px;font-weight:900;letter-spacing:.08em}
    .grb-brand small{display:block;font-size:11px;font-weight:700;opacity:.72;letter-spacing:.12em;margin-top:3px}
    .grb-hero-grid{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(360px,.92fr);gap:40px;align-items:start;padding-top:20px}
    .grb-hero h1{font-size:clamp(38px,5vw,72px);line-height:1.05;letter-spacing:-.04em;margin:18px 0 20px}
    .grb-hero p.grb-lead{font-size:20px;line-height:1.65;color:rgba(255,255,255,.82);max-width:760px}
    .grb-hero-points{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:32px 0}
    .grb-hero-point{
      background:rgba(255,255,255,.09);
      border:1px solid rgba(255,255,255,.16);
      border-radius:18px;
      padding:18px 18px 16px;
      backdrop-filter:blur(10px);
      min-height:138px;
    }
    .grb-hero-point strong{display:block;font-size:28px;line-height:1.05;margin-bottom:10px}
    .grb-hero-point span{display:block;font-size:14px;color:rgba(255,255,255,.82)}
    .grb-cta-row{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px}
    .grb-btn{
      display:inline-flex;align-items:center;justify-content:center;
      min-height:56px;padding:0 26px;border-radius:999px;font-weight:900;font-size:16px;letter-spacing:-.01em;
      transition:.2s ease;border:1px solid transparent;cursor:pointer;
    }
    .grb-btn-primary{background:#fff;color:#0f3fbf;box-shadow:0 14px 28px rgba(0,0,0,.16)}
    .grb-btn-secondary{background:transparent;color:#fff;border-color:rgba(255,255,255,.28)}
    .grb-btn:hover{transform:translateY(-2px)}

    .grb-hero-visual{position:relative;min-width:0}
    .grb-hero-panel{
      position:relative;
      background:linear-gradient(180deg,rgba(255,255,255,.11),rgba(255,255,255,.05));
      border:1px solid rgba(255,255,255,.18);
      border-radius:32px;
      box-shadow:0 30px 60px rgba(0,0,0,.22);
      padding:16px;
      backdrop-filter:blur(10px);
      min-height:100%;
    }
    .grb-people-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:16px;align-items:stretch}
    .grb-person-card{
      background:rgba(255,255,255,.94);
      border-radius:24px;
      overflow:hidden;
      box-shadow:0 10px 30px rgba(7,20,47,.12);
      color:var(--text);
      display:flex;
      flex-direction:column;
      min-height:0;
      height:100%;
    }
    .grb-person-photo{
      background:#eef5ff;
      height:220px;
      display:flex;
      align-items:center;
      justify-content:center;
      overflow:hidden;
      flex-shrink:0;
    }
    .grb-person-photo img{width:100%;height:100%;object-fit:cover}
    .grb-person-body{padding:18px 20px 20px}
    .grb-person-role{font-size:12px;font-weight:900;color:#0f5cff;letter-spacing:.08em;margin-bottom:6px}
    .grb-person-body h3{margin:0 0 8px;font-size:22px;letter-spacing:-.02em}
    .grb-person-body p{margin:0;color:var(--muted);font-size:14px;line-height:1.6}

    .grb-mini-strip{margin-top:16px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
    .grb-mini-card{
      background:rgba(255,255,255,.92);
      border-radius:18px;
      overflow:hidden;
      color:var(--text);
    }
    .grb-mini-card .grb-thumb{height:148px;overflow:hidden;background:#eef4ff}
    .grb-mini-card .grb-thumb img{width:100%;height:100%;object-fit:cover}
    .grb-mini-card .grb-txt{padding:14px 16px 16px}
    .grb-mini-card strong{display:block;font-size:16px;margin-bottom:6px}
    .grb-mini-card span{font-size:13px;color:var(--muted)}

    .grb-section-light{background:#fff}
    .grb-section-soft{background:linear-gradient(180deg,#eff6ff 0%,#fff 100%)}

    .grb-existing-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(360px,.95fr);gap:32px;align-items:start;margin-top:32px}
    .grb-existing .grb-revenue-wrap{margin-top:0}
    .grb-existing .grb-metric-card .grb-big{
      font-size:clamp(40px,4vw,56px);
      line-height:1.35;
      font-weight:900;
      letter-spacing:-.02em;
      margin:18px 0 12px;
      word-break:keep-all;
    }
    .grb-existing .grb-authority-card{height:100%;display:flex;flex-direction:column}
    .grb-existing .grb-authority-card .grb-cover{height:290px}
    .grb-existing .grb-authority-card .grb-body{flex:1}
    .grb-cards-3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:34px}
    .grb-card{
      background:#fff;border:1px solid var(--line);border-radius:24px;padding:26px;box-shadow:var(--shadow)
    }
    .grb-card .grb-num{font-size:14px;font-weight:900;color:#0d5cff;letter-spacing:.1em;margin-bottom:10px}
    .grb-card h3{margin:0 0 12px;font-size:26px;line-height:1.15;letter-spacing:-.03em}
    .grb-card p{margin:0;color:var(--muted);font-size:15px}

    .grb-speech-boxes{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:34px}
    .grb-speech{
      position:relative;background:#fff;border:1px solid var(--line);border-radius:24px;padding:24px 24px 24px 26px;box-shadow:var(--shadow)
    }
    .grb-speech:before{content:"";position:absolute;left:24px;top:-10px;width:20px;height:20px;background:#fff;border-left:1px solid var(--line);border-top:1px solid var(--line);transform:rotate(45deg)}
    .grb-speech strong{display:block;font-size:20px;line-height:1.45;letter-spacing:-.02em}

    .grb-revenue-wrap{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:32px}
    .grb-metric-card{
      display:flex;
      flex-direction:column;
      justify-content:space-between;
      gap:10px;
      padding:28px;
      background:linear-gradient(180deg,#0d2048,#122e67);
      border-radius:28px;
      color:#fff;
      box-shadow:0 26px 50px rgba(10,29,70,.2)
    }
    .grb-metric-card .grb-tag{font-size:13px;font-weight:900;letter-spacing:.08em;color:#90dfff}
    .grb-metric-card .grb-big{
      font-size:clamp(40px,4vw,56px);
      line-height:1.25;
      font-weight:900;
      letter-spacing:-.03em;
      margin:16px 0 10px;
      word-break:keep-all;
    }
    .grb-metric-card p{margin:0;color:rgba(255,255,255,.82);font-size:14px;line-height:1.65}

    .grb-compare-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:26px;align-items:start;margin-top:34px}
    .grb-chart-stack{display:grid;gap:20px}
    .grb-chart-card{background:#fff;border:1px solid var(--line);border-radius:24px;padding:18px;box-shadow:var(--shadow)}
    .grb-chart-card img{border-radius:16px;width:100%;height:auto}
    .grb-caption{font-size:13px;color:var(--muted);margin-top:10px}

    .grb-benefit-list{display:grid;gap:16px}
    .grb-benefit-item{background:#fff;border:1px solid var(--line);border-radius:22px;padding:22px 22px 20px;box-shadow:var(--shadow)}
    .grb-benefit-item h4{margin:0 0 8px;font-size:22px;letter-spacing:-.02em}
    .grb-benefit-item p{margin:0;color:var(--muted)}

    .grb-authority-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:stretch;margin-top:34px}
    .grb-authority-card{background:#fff;border:1px solid var(--line);border-radius:24px;box-shadow:var(--shadow);overflow:hidden}
    .grb-authority-card .grb-cover{height:310px;background:#eef4ff}
    .grb-authority-card .grb-cover img{width:100%;height:100%;object-fit:cover}
    .grb-authority-card .grb-body{padding:24px}
    .grb-authority-card h3{margin:0 0 12px;font-size:28px;line-height:1.18;letter-spacing:-.03em}
    .grb-authority-card p{margin:0;color:var(--muted)}
    .grb-ticks{display:grid;gap:12px;margin-top:18px}
    .grb-tick{display:flex;gap:12px;align-items:flex-start;color:var(--text)}
    .grb-tick b{width:28px;height:28px;border-radius:50%;background:#eaf4ff;color:#0f57ff;display:inline-flex;align-items:center;justify-content:center;font-size:14px;flex:none}

    .grb-tech-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:32px}
    .grb-tech{background:#fff;border:1px solid var(--line);border-radius:22px;padding:24px;box-shadow:var(--shadow)}
    .grb-tech h4{margin:0 0 10px;font-size:21px;line-height:1.2;letter-spacing:-.02em}
    .grb-tech p{margin:0;color:var(--muted);font-size:14px}

    .grb-industry-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:30px}
    .grb-industry{background:linear-gradient(180deg,#fff,#f7fbff);border:1px solid var(--line);border-radius:22px;padding:24px;box-shadow:var(--shadow)}
    .grb-industry strong{display:block;font-size:20px;line-height:1.25;letter-spacing:-.02em;margin-bottom:10px}
    .grb-industry span{font-size:14px;color:var(--muted)}

    .grb-contact{background:linear-gradient(135deg,var(--navy) 0%,#102a5f 100%);color:#fff;position:relative;overflow:hidden}
    .grb-contact-grid{display:grid;grid-template-columns:1.02fr .98fr;gap:28px;align-items:center}
    .grb-contact .grb-section-desc{color:rgba(255,255,255,.78)}
    .grb-contact-card{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:28px;padding:28px;backdrop-filter:blur(10px)}
    .grb-contact-list{display:grid;gap:14px;margin-top:18px}
    .grb-contact-item{padding:16px 18px;background:rgba(255,255,255,.06);border-radius:18px;border:1px solid rgba(255,255,255,.12)}
    .grb-contact-item b{display:block;font-size:13px;color:#9adfff;letter-spacing:.08em;margin-bottom:4px}
    .grb-contact-item span{font-size:22px;font-weight:900;line-height:1.3}
    .grb-footer{padding:24px 0;text-align:center;font-size:13px;color:#88a0c8;background:#081530}

    @media(max-width:1080px){
      .grb-hero-grid,.grb-compare-grid,.grb-authority-grid,.grb-contact-grid,.grb-revenue-wrap,.grb-existing-grid{grid-template-columns:1fr}
      .grb-cards-3,.grb-tech-grid,.grb-industry-grid{grid-template-columns:repeat(2,1fr)}
      .grb-hero-points{grid-template-columns:1fr}
      .grb-people-grid{grid-template-columns:1fr}
    }
    @media(max-width:720px){
      .grb-container{padding:0 18px}
      .grb-section{padding:68px 0}
      .grb-topbar{display:block}
      .grb-hero-grid{gap:26px}
      .grb-people-grid,.grb-speech-boxes,.grb-cards-3,.grb-tech-grid,.grb-industry-grid,.grb-mini-strip{grid-template-columns:1fr}
      .grb-hero h1{font-size:40px}
      .grb-person-photo{height:200px}
      .grb-metric-card .grb-big{font-size:52px}
      .grb-section-title{font-size:32px}
    }
  `;

  return (
    <>
      <style>{css}</style>

      {/* ── HERO ── */}
      <section className="grb-hero" id="top">
        <div className="grb-container">
          <div className="grb-topbar">
            <div className="grb-brand">
              GRB LAB
              <small>SEOUL NATIONAL UNIVERSITY OF SCIENCE AND TECHNOLOGY SAFETY ENGINEERING</small>
            </div>
          </div>

          <div className="grb-hero-grid">
            <div>
              <span className="grb-eyebrow">서울과학기술대학교 안전공학과 교수팀 실증사업 · GRB LAB 주관</span>
              <h1  style={{  fontSize: 35 }} >산업화재보험 <br />설계사를 위한 산업전기 안전 &amp; 절감 파트너십</h1>
              <p className="grb-lead">
                고객에게는 연간 화재보험료 100% 지원과 전기요금 절감 제안을 동시에 제공하고,<br />
                설계사에게는 신규 영업 명분과 기존 고객 기반의 반복 수익 구조를 연결하는 파트너 프로그램입니다.
              </p>

              <div className="grb-hero-points">
                <div className="grb-hero-point">
                  <strong>100%</strong>
                  <span>참여 공장 대상 연간 화재보험료 지원 제안 가능</span>
                </div>
                <div className="grb-hero-point">
                  <strong>30%+</strong>
                  <span>도입 시 평균 30% 이상 전기요금 절감 메시지로 고객 설득 가능</span>
                </div>
                <div className="grb-hero-point">
                  <strong>20%</strong>
                  <span>정식 전환 시 절감 실적 배분금 중 운영 관리 지분 수익</span>
                </div>
              </div>

              <div className="grb-cta-row">
                <a className="grb-btn grb-btn-primary" href="#contact">파트너 상담 신청</a>
                <a className="grb-btn grb-btn-secondary" href="#benefits">핵심 혜택 보기</a>
              </div>
              <div style={{ marginTop: 16 }}>
                <a
                  className="grb-btn grb-btn-primary"
                  style={{ width: '100%', fontSize: 20, minHeight: 72 }}
                  href="brochure.pdf"
                  download
                >
                  자료 받기
                </a>
              </div>
            </div>

            <div className="grb-hero-visual">
              <div className="grb-hero-panel">
                <div className="grb-people-grid">
                  <div className="grb-person-card">
                    <div className="grb-person-photo"><img src="man1.png" alt="GRB LAB 직원 이미지 1" /></div>
                    <div className="grb-person-body">
                      <div className="grb-person-role">PARTNER RESPONSE TEAM</div>
                      <h3>설계사 전용 파트너 지원</h3>
                      <p>실무 담당 인력이 직접 대응합니다.</p>
                    </div>
                  </div>
                  <div className="grb-person-card">
                    <div className="grb-person-photo"><img src="man2.png" alt="GRB LAB 직원 이미지 2" /></div>
                    <div className="grb-person-body">
                      <div className="grb-person-role">BUSINESS SUPPORT</div>
                      <h3>신규 개척</h3>
                      <p>보험료 지원과 절감 제안을 함께 전달합니다.</p>
                    </div>
                  </div>
                  <div className="grb-person-card">
                    <div className="grb-person-photo"><img src="woman.png" alt="GRB LAB 직원 이미지 3" /></div>
                    <div className="grb-person-body">
                      <div className="grb-person-role">FIELD CONSULTING</div>
                      <h3>기존 고객 수익화</h3>
                      <p>절감 성과 기반의 반복 수익이 발생합니다.</p>
                    </div>
                  </div>
                  <div className="grb-person-card">
                    <div className="grb-person-photo"><img src="group.png" alt="GRB LAB 팀 이미지" /></div>
                    <div className="grb-person-body">
                      <div className="grb-person-role">OPERATION TEAM</div>
                      <h3>현장 운영 지원</h3>
                      <p>도입부터 운영까지 전담 지원합니다.</p>
                    </div>
                  </div>
                </div>

                <div className="grb-mini-strip">
                  <div className="grb-mini-card">
                    <div className="grb-thumb"><img src="682288b5-32bb-4b93-af54-02f884140b59.jpg" alt="산업용 전기요금 상승 그래프" /></div>
                    <div className="grb-txt">
                      <strong>산업용 전기요금 상승</strong>
                      <span>고객에게 바로 제시할 수 있는 핵심 근거</span>
                    </div>
                  </div>
                  <div className="grb-mini-card">
                    <div className="grb-thumb"><img src="dd3f364d-3db4-4a69-8b18-e4909dc2826d.jpg" alt="전기요금 조정 추이 그래프" /></div>
                    <div className="grb-txt">
                      <strong>절감 제안 타이밍</strong>
                      <span>보험과 고정비 절감을 함께 제안</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 02 : BENEFITS ── */}
      <section className="grb-section grb-section-light" id="benefits">
        <div className="grb-container">
          <span className="grb-eyebrow">SECTION 02</span>
          <h2 className="grb-section-title">설계사가 바로 활용할 수 있는 3가지 핵심 가치</h2>
          <p className="grb-section-desc">설계사가 바로 활용할 수 있는 수익과 영업 포인트를 우선적으로 제시합니다.</p>
          <div className="grb-cards-3">
            <div className="grb-card">
              <div className="grb-num">VALUE 01</div>
              <h3>신규 고객 확보가 쉬워집니다</h3>
              <p>보험료 지원 + 전기요금 절감 + 서울과기대 교수팀 실증사업 참여 명분을 동시에 제안할 수 있어, 기존 경쟁 설계사 대비 확실한 차별화를 만들 수 있습니다.</p>
            </div>
            <div className="grb-card">
              <div className="grb-num">VALUE 02</div>
              <h3>기존 고객 방어가 강해집니다</h3>
              <p>"실증사업 대상자로 우선 추천드렸습니다"라는 문장 하나만으로도 관계 유지와 경쟁 차단에 유리한 명분을 확보할 수 있습니다.</p>
            </div>
            <div className="grb-card">
              <div className="grb-num">VALUE 03</div>
              <h3>장기 수익 구조가 생깁니다</h3>
              <p>보험 수당 외에도 실증 종료 후 정식 전환이 이루어지면, 운영 기간 동안 절감 실적 기반의 추가 수익 구조를 기대할 수 있습니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 03 : EXISTING ── */}
      <section className="grb-section grb-section-soft grb-existing" id="existing">
        <div className="grb-container">
          <span className="grb-eyebrow">SECTION 03</span>
          <h2 className="grb-section-title">기존 고객만 있어도<br />바로 수익이 발생합니다</h2>
          <p className="grb-section-desc">신규 거래처는 보험료 지원을 앞세워 문을 열고, 기존 고객은 전기요금 절감과 성과 공유 구조로 바로 수익화합니다. 기존 고객을 기반으로 한 반복 수익 구조를 제공합니다.</p>

          <div className="grb-existing-grid">
            <div className="grb-revenue-wrap">
              <div className="grb-metric-card">
                <div className="grb-tag">신규 고객 조건</div>
                <div className="grb-big">완전 무료</div>
                <p>설치비 · 운영비 고객 부담 0원. 실증기간 동안 연간 화재보험료는 당사에서 전액 지원합니다.</p>
              </div>
              <div className="grb-metric-card">
                <div className="grb-tag">기존 고객 조건</div>
                <div className="grb-big">30%+ 절감</div>
                <p>도입 시 평균 30% 이상 전기요금 절감. 절감된 금액에서만 성과 공유 수수료가 발생합니다.</p>
              </div>
              <div className="grb-metric-card">
                <div className="grb-tag">성과 발생 기준</div>
                <div className="grb-big">성과 있을 때만</div>
                <p>절감이 없으면 수수료 0원. 절감이 발생한 경우에만 일부를 비용으로 분담합니다.</p>
              </div>
              <div className="grb-metric-card">
                <div className="grb-tag">리스크 제거</div>
                <div className="grb-big">제로 리스크</div>
                <p>절감이 없어도 실증기간 동안 화재보험료는 그대로 지원됩니다. 고객 리스크는 없습니다.</p>
              </div>
            </div>

            <div className="grb-authority-card">
              <div className="grb-cover"><img src="2026-04-16 181013.png" alt="사업 소개 이미지" /></div>
              <div className="grb-body">
                <h3>기존 고객 수익화 흐름</h3>
                <div className="grb-ticks">
                  <div className="grb-tick"><b>1</b><div>도입 직후 전기요금 절감 효과 체감</div></div>
                  <div className="grb-tick"><b>2</b><div>절감액 기준 성과 공유 구조 설명</div></div>
                  <div className="grb-tick"><b>3</b><div>매달 반복 수익으로 설계사 수익화</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 04 : PITCH ── */}
      <section className="grb-section grb-section-light" id="pitch">
        <div className="grb-container">
          <span className="grb-eyebrow">SECTION 04</span>
          <h2 className="grb-section-title">고객사 대표에게 이렇게 제안하십시오</h2>
          <p className="grb-section-desc">설계사는 '좋다'보다 바로 꺼낼 수 있는 멘트가 중요합니다. 핵심 제안 문장을 바로 활용할 수 있도록 제공합니다.</p>
          <div className="grb-speech-boxes">
            <div className="grb-speech"><strong>"서울과기대 교수팀 실증사업 대상지로 추천드릴 수 있습니다."</strong></div>
            <div className="grb-speech"><strong>"참여 시 연간 화재보험료 100% 지원 혜택을 받을 수 있습니다."</strong></div>
            <div className="grb-speech"><strong>"단순 보험이 아니라 전기요금 절감 구조까지 함께 검토 가능합니다."</strong></div>
            <div className="grb-speech"><strong>"도입 비용과 운영 비용이 없습니다."</strong></div>
          </div>
        </div>
      </section>

      {/* ── SECTION 05 : INCOME ── */}
      <section className="grb-section grb-section-soft" id="income">
        <div className="grb-container">
          <span className="grb-eyebrow">SECTION 05</span>
          <h2 className="grb-section-title">보험 수당 외 추가 수익 구조</h2>
          <p className="grb-section-desc">설계사 수익 구조를 중심으로 핵심 수치를 제시합니다. 20% 운영 관리 지분을 앞에 두고, 고객 60%는 설명으로 붙였습니다.</p>
          <div className="grb-revenue-wrap">
            <div className="grb-metric-card">
              <div className="grb-tag">AGENT REVENUE SHARE</div>
              <div className="grb-big">20%</div>
              <p>실증 종료 후 정식 계약 체결 시 절감 실적 배분금 중 운영 관리 지분 수익.</p>
            </div>
            <div className="grb-metric-card">
              <div className="grb-tag">CUSTOMER PROFIT UPSIDE</div>
              <div className="grb-big">60%</div>
              <p>고객은 절감액의 60%를 영업이익화하는 구조를 제안 포인트로 사용할 수 있습니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 06 : REASON ── */}
      <section className="grb-section grb-section-light" id="reason">
        <div className="grb-container">
          <span className="grb-eyebrow">SECTION 06</span>
          <h2 className="grb-section-title">고객이 이 제안에 반응하는 이유</h2>
          <div className="grb-compare-grid">
            <div className="grb-chart-stack">
              <div className="grb-chart-card">
                <img src="dd3f364d-3db4-4a69-8b18-e4909dc2826d.jpg" alt="전기요금 변동 그래프" />
                <div className="grb-caption">산업용 전기요금 상승 흐름을 명확히 보여줍니다.</div>
              </div>
              <div className="grb-chart-card">
                <img src="682288b5-32bb-4b93-af54-02f884140b59.jpg" alt="전기요금 조정 추이 그래프" />
                <div className="grb-caption">전기요금 상승 환경에서 절감 필요성을 보여주는 자료입니다.</div>
              </div>
            </div>
            <div className="grb-benefit-list">
              <div className="grb-benefit-item">
                <h4>연간 화재보험료 100% 지원</h4>
                <p>신규 거래처 발굴 시 가장 강한 진입 포인트로 사용합니다. 비용 부담을 줄이는 구조는 첫 미팅에서 반응을 끌어내기 좋습니다.</p>
              </div>
              <div className="grb-benefit-item">
                <h4>전기요금 30% 이상 절감</h4>
                <p>예를 들어 매월 전기요금으로 3,000만원을 납부하는 공장은 도입 이후 약 2,000만원 수준의 고지서를 받게 됩니다. 이처럼 기존 전기요금을 매월 평균 30% 이상 절감할 수 있으며, 절감된 금액에서만 비용이 발생하는 구조이므로 고객 입장에서는 실제로 돈이 남는 구조입니다.</p>
              </div>
              <div className="grb-benefit-item">
                <h4>추가 자본지출 없는 성과 공유 구조</h4>
                <p>정식 전환 시 검증된 절감액 기반으로 공장에도 이익이 발생합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 07 : AUTHORITY ── */}
      <section className="grb-section grb-section-soft" id="authority">
        <div className="grb-container">
          <span className="grb-eyebrow">SECTION 07</span>
          <h2 className="grb-section-title">제안의 신뢰를 뒷받침하는 공학적 기반</h2>
          <div className="grb-authority-grid">
            <div className="grb-authority-card">
              <div className="grb-cover"><img src="과기대.png" alt="사업 지원팀 이미지" /></div>
              <div className="grb-body">
                <h3>서울과기대 교수팀이 주관하는 EPC</h3>
                <p>서울과학기술대학교 안전공학과 김기연 교수팀이 주관하고, GRB LAB이 운영하는 전력 데이터 기반 실증사업입니다. 단순 설비 판매가 아니라 현장 적용과 기술 실효성을 검증하는 구조로 안내합니다.</p>
              </div>
            </div>
            <div className="grb-authority-card">
              <div className="grb-cover"><img src="인버터.png" alt="현장 운영팀 이미지" /></div>
              <div className="grb-body">
                <h3>현장 대응 조직이 직접 운영합니다</h3>
                <p>현장 운영팀, 사업 지원팀, 파트너 대응팀이 직접 운영합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 08 : TECH ── */}
      <section className="grb-section grb-section-light" id="tech">
        <div className="grb-container">
          <span className="grb-eyebrow">SECTION 08</span>
          <h2 className="grb-section-title">고객이 안심할 수 있는 기술 포인트</h2>
          <p className="grb-section-desc">정전 없이 설치 가능하며 원상복구가 가능합니다.</p>
          <div className="grb-tech-grid">
            <div className="grb-tech">
              <h4>지능형 이상 징후 관제</h4>
              <p>전력 과부하 등 사고 전조 증상을 24시간 감시한다는 메시지로 안전 관리 신뢰를 높입니다.</p>
            </div>
            <div className="grb-tech">
              <h4>데이터 기반 열화상 통합 제어</h4>
              <p>보이지 않는 화재 위험 요소를 사전에 감지하는 기술 근거를 짧고 실무적으로 제공합니다.</p>
            </div>
            <div className="grb-tech">
              <h4>비침습적 무정전 설치</h4>
              <p>공장 가동 중단 없이 설치 가능합니다.</p>
            </div>
            <div className="grb-tech">
              <h4>원상복구 및 사후 관리</h4>
              <p>실증 종료 후 요청 시 설치 전 상태로 복원하는 원칙을 명확히 합니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 09 : INDUSTRY ── */}
      <section className="grb-section grb-section-soft" id="industry">
        <div className="grb-container">
          <span className="grb-eyebrow">SECTION 09</span>
          <h2 className="grb-section-title">이런 고객사에 먼저 제안하십시오</h2>
          <p className="grb-section-desc">전력 사용량이 크고 비용 절감 니즈가 높은 제조업 고객이 우선 적용 대상입니다.</p>
          <div className="grb-industry-grid">
            <div className="grb-industry">
              <strong>냉동 · 냉장<br />식품 제조</strong>
              <span>실증 사례 중점 확보 업종</span>
            </div>
            <div className="grb-industry">
              <strong>정밀기계<br />금속가공 · 금형</strong>
              <span>전력 사용량이 큰 제조업군</span>
            </div>
            <div className="grb-industry">
              <strong>화학 · 플라스틱<br />고무</strong>
              <span>고정비 절감 니즈가 큰 업종</span>
            </div>
            <div className="grb-industry">
              <strong>기타 일반 제조</strong>
              <span>잔여 쿼터 문의 요망</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 10 : CONTACT ── */}
      <section className="grb-section grb-contact" id="contact">
        <div className="grb-container">
          <div className="grb-contact-grid">
            <div>
              <span className="grb-eyebrow">SECTION 10</span>
              <h2 className="grb-section-title">설계사 파트너 상담 신청</h2>
              <p className="grb-section-desc">영업 적용 고객군과 수익 구조를 상담으로 안내합니다.</p>
              <div className="grb-cta-row">
                <a className="grb-btn grb-btn-primary" href="tel:01074186848">전화 상담 연결</a>
                <a className="grb-btn grb-btn-secondary" href="mailto:info@grblab.co.kr">이메일 문의</a>
              </div>
            </div>
            <div className="grb-contact-card">
              <div className="grb-contact-list">
                <div className="grb-contact-item">
                  <b>사업 주관</b>
                  <span>GRB LAB</span>
                </div>
                <div className="grb-contact-item">
                  <b>파트너 전담 직통</b>
                  <span>010-7418-6848</span>
                </div>
                <div className="grb-contact-item">
                  <b>이메일</b>
                  <span>info@grblab.co.kr</span>
                </div>
                <div className="grb-contact-item">
                  <b>홈페이지</b>
                  <span>grblab.co.kr</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grb-footer">© 2026 GRB LAB · 산업화재보험 설계사 파트너 모집</div>
    </>
  );
}