(() => {
  const storageKey = 'nanumieum-2026-award-announcement-hide-until';
  try {
    if (Date.now() < Number(localStorage.getItem(storageKey))) return;
  } catch (_) {
    // The announcement still opens when browser storage is unavailable.
  }

  const dialog = document.createElement('dialog');
  dialog.id = 'award-announcement';
  dialog.setAttribute('aria-labelledby', 'award-announcement-title');
  dialog.innerHTML = `
    <div class="award-scroll">
      <header>
        <p class="award-event">2026 장애인 합창단 초청 음악회</p>
        <h2 id="award-announcement-title">입상팀 발표</h2>
      </header>
      <div class="award-body">
        <p>2026년 9월 29일 부산시민회관 대극장에서 개최된<br>
        「2026 장애인 합창단 초청 음악회」의 심사 결과,<br>
        다음 <strong>7개 합창단이 입상팀으로 선정되었습니다.</strong></p>
        <section aria-labelledby="award-announcement-teams">
          <h3 id="award-announcement-teams">입상팀</h3>
          <ul>
            <li>골프존파스텔합창단</li>
            <li>대구라온휠합창단</li>
            <li>어울림시각장애인합창단</li>
            <li>완주장애인합창단 ‘꽃’</li>
            <li>이지글리합창단</li>
            <li>코웨이물빛합창단</li>
            <li>KYCU 에바다합창단</li>
          </ul>
          <p class="award-note"><strong>※ 입상팀 명단은 순위와 관계없이 표기하였습니다.</strong></p>
        </section>
        <p>입상팀 여러분께 진심으로 축하의 말씀을 드립니다.</p>
        <p>입상팀은 앞으로 <strong>2027년 7월 도쿄국제합창콩쿠르(TICC) 본선 진출을 목표로 준비를 진행</strong>하게 됩니다.</p>
        <p class="award-next"><strong>향후 2027년 7월 도쿄국제합창콩쿠르 본선 진출을 위한 제반 사항은 나눔이음의료복지사회적협동조합이 진행합니다.</strong></p>
        <p>입상팀 여러분의 도쿄국제합창콩쿠르 도전을 함께 응원하겠습니다.</p>
        <p class="award-signature"><strong>나눔이음의료복지사회적협동조합</strong></p>
      </div>
    </div>
    <button class="award-close" type="button" aria-label="닫기" autofocus>×</button>
    <button class="award-hide" type="button">오늘 하루 보지 않기</button>
  `;
  dialog.querySelector('.award-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.award-hide').addEventListener('click', () => {
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    try {
      localStorage.setItem(storageKey, String(midnight.getTime()));
    } catch (_) {}
    dialog.close();
  });
  document.body.append(dialog);
  const previousOverflow = document.body.style.overflow;
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    dialog.remove();
  }, { once: true });
  dialog.showModal();
  document.body.style.overflow = 'hidden';
})();
