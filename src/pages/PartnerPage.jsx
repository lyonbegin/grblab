export default function PartnerPage() {
  return (
    <>
      <style>{`
        ${document.querySelector("style")?.innerHTML || ""}
      `}</style>

      <section className="hero" id="top">
        <div className="container">
          <div className="topbar">
            <div className="brand">
              GRB LAB
              <small>SEOUL NATIONAL UNIVERSITY OF SCIENCE AND TECHNOLOGY SAFETY ENGINEERING</small>
            </div>
          </div>

          <div className="hero-grid">
            <div>
              <span className="eyebrow">
                서울과학기술대학교 안전공학과 교수팀 실증사업 · GRB LAB 주관
              </span>

              <h1>
                산업화재보험 설계사를 위한<br />실증사업 파트너십
              </h1>

              <p className="lead">
                고객에게는 연간 화재보험료 100% 지원과 전기요금 절감 제안을 동시에 제공하고,
                설계사에게는 신규 영업 명분과 기존 고객 기반의 반복 수익 구조를 연결하는 파트너 프로그램입니다.
              </p>

              <div className="hero-points">
                <div className="hero-point">
                  <strong>100%</strong>
                  <span>연간 화재보험료 지원</span>
                </div>
                <div className="hero-point">
                  <strong>30%+</strong>
                  <span>전기요금 절감</span>
                </div>
                <div className="hero-point">
                  <strong>20%</strong>
                  <span>운영 수익 지분</span>
                </div>
              </div>

              <div className="cta-row">
                <a className="btn btn-primary" href="#contact">파트너 상담 신청</a>
                <a className="btn btn-secondary" href="#benefits">핵심 혜택 보기</a>
              </div>

              <div style={{ marginTop: 16 }}>
                <a
                  className="btn btn-primary"
                  style={{ width: "100%", fontSize: 20, minHeight: 72 }}
                  href="/partner/brochure.pdf"
                  download
                >
                  자료 받기
                </a>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-panel">
                <div className="people-grid">

                  <div className="person-card">
                    <div className="person-photo">
                      <img src="/partner/man1.png" alt="" />
                    </div>
                    <div className="person-body">
                      <div className="person-role">PARTNER RESPONSE TEAM</div>
                      <h3>설계사 전용 파트너 지원 조직</h3>
                      <p>실무 담당 인력이 직접 대응</p>
                    </div>
                  </div>

                  <div className="stack">

                    <div className="person-card">
                      <div className="person-photo">
                        <img src="/partner/woman.png" alt="" />
                      </div>
                      <div className="person-body">
                        <h3>신규 개척</h3>
                        <p>보험 + 절감 + 실증사업</p>
                      </div>
                    </div>

                    <div className="person-card">
                      <div className="person-photo">
                        <img src="/partner/man2.png" alt="" />
                      </div>
                      <div className="person-body">
                        <h3>기존 고객 수익화</h3>
                        <p>절감 기반 반복 수익</p>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="mini-strip">
                  <div className="mini-card">
                    <div className="thumb">
                      <img src="/partner/2a8857af.png" alt="" />
                    </div>
                    <div className="txt">
                      <strong>전기요금 상승</strong>
                    </div>
                  </div>

                  <div className="mini-card">
                    <div className="thumb">
                      <img src="/partner/ac53f306.png" alt="" />
                    </div>
                    <div className="txt">
                      <strong>절감 제안 타이밍</strong>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      <div className="footer">
        © 2026 GRB LAB · 산업화재보험 설계사 파트너 모집
      </div>
    </>
  )
}