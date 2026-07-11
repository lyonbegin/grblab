import React, { useState, useEffect } from 'react';

// 내장 데이터 객체
const GOALS_DATA = {
  "kor": [
    { "major": "Ⅰ. 문법", "mid": "A. 음운", "no": "2", "title": "음절과 음운의 개수", "stage": "중1", "importance": "★★☆", "content": "최소 발음단위, 음운 세기" },
    { "major": "Ⅰ. 문법", "mid": "A. 음운", "no": "3", "title": "교체 (음절끝소리·비음화·유음화)", "stage": "중3~고1", "importance": "★★★", "content": "대표음, 자음동화" },
    { "major": "Ⅰ. 문법", "mid": "A. 음운", "no": "4", "title": "교체 (구개음화·된소리되기)", "stage": "중3~고1", "importance": "★★★", "content": "ㄷㅌ+ㅣ→ㅈㅊ, 경음화 조건" },
    { "major": "Ⅰ. 문법", "mid": "A. 음운", "no": "5", "title": "탈락·첨가 (자음군단순화·ㄴ첨가 등)", "stage": "고1", "importance": "★★★", "content": "겹받침 탈락, 사잇소리" },
    { "major": "Ⅰ. 문법", "mid": "A. 음운", "no": "6", "title": "축약 (거센소리되기·모음축약)", "stage": "고1", "importance": "★★☆", "content": "ㅎ+예사→거센, 모음 줄기" },
    { "major": "Ⅰ. 문법", "mid": "B. 단어와 품사", "no": "7", "title": "체언 (명사·대명사·수사)", "stage": "중2", "importance": "★★☆", "content": "자립성, 조사와 결합" },
    { "major": "Ⅰ. 문법", "mid": "B. 단어와 품사", "no": "8", "title": "용언 (동사·형용사)와 활용", "stage": "중2", "importance": "★★★", "content": "어간·어미, 규칙·불규칙 활용" },
    { "major": "Ⅰ. 문법", "mid": "B. 단어와 품사", "no": "9", "title": "수식언·관계언·독립언", "stage": "중2", "importance": "★★☆", "content": "관형사·부사, 조사, 감탄사" },
    { "major": "Ⅰ. 문법", "mid": "B. 단어와 품사", "no": "10", "title": "어미와 조사", "stage": "중2~3", "importance": "★★★", "content": "선어말·어말어미, 격·접속·보조사" },
    { "major": "Ⅰ. 문법", "mid": "C. 단어의 형성·의미", "no": "11", "title": "어근과 접사", "stage": "중2~3", "importance": "★★☆", "content": "실질·형식 형태소" },
    { "major": "Ⅰ. 문법", "mid": "C. 단어의 형성·의미", "no": "12", "title": "파생어와 합성어", "stage": "중3", "importance": "★★★", "content": "단어 짜임, 통사적·비통사적 합성" },
    { "major": "Ⅰ. 문법", "mid": "C. 단어의 형성·의미", "no": "13", "title": "의미 관계 (유의·반의·상하의)", "stage": "중2", "importance": "★★☆", "content": "어휘 관계망" },
    { "major": "Ⅰ. 문법", "mid": "C. 단어의 형성·의미", "no": "14", "title": "다의어와 동음이의어", "stage": "중2", "importance": "★★☆", "content": "중심·주변 의미, 문맥 구별" },
    { "major": "Ⅰ. 문법", "mid": "D. 문장 성분·구조", "no": "15", "title": "주성분 (주어·서술어·목적어·보어)", "stage": "중2", "importance": "★★★", "content": "서술어 자릿수" },
    { "major": "Ⅰ. 문법", "mid": "D. 문장 성분·구조", "no": "16", "title": "부속·독립 성분", "stage": "중2", "importance": "★★☆", "content": "관형어·부사어·독립어" },
    { "major": "Ⅰ. 문법", "mid": "D. 문장 성분·구조", "no": "17", "title": "이어진 문장", "stage": "중3", "importance": "★★☆", "content": "대등·종속 연결" },
    { "major": "Ⅰ. 문법", "mid": "D. 문장 성분·구조", "no": "18", "title": "안은 문장 (명사절·관형절 등)", "stage": "중3~고1", "importance": "★★★", "content": "서술·부사·인용절, 겹문장 분석" },
    { "major": "Ⅰ. 문법", "mid": "E. 문법 요소", "no": "19", "title": "높임 표현", "stage": "고1", "importance": "★★★", "content": "주체·객체·상대 높임" },
    { "major": "Ⅰ. 문법", "mid": "E. 문법 요소", "no": "20", "title": "시간 표현 (시제·동작상)", "stage": "고1", "importance": "★★★", "content": "과거·현재·미래, 진행·완료상" },
    { "major": "Ⅰ. 문법", "mid": "E. 문법 요소", "no": "21", "title": "피동과 사동", "stage": "고1~2", "importance": "★★★", "content": "파생·통사적, 이중피동 오류" },
    { "major": "Ⅰ. 문법", "mid": "E. 문법 요소", "no": "22", "title": "부정 표현", "stage": "고1", "importance": "★★☆", "content": "안·못 부정, 긴/짧은 부정" },
    { "major": "Ⅰ. 문법", "mid": "E. 문법 요소", "no": "23", "title": "인용 표현", "stage": "고1", "importance": "★★☆", "content": "직접·간접 인용, 인용격조사" },
    { "major": "Ⅰ. 문법", "mid": "F. 담화·규범", "no": "24", "title": "담화와 맥락", "stage": "고2", "importance": "★★☆", "content": "지시·응집성, 발화 의도" },
    { "major": "Ⅰ. 문법", "mid": "F. 담화·규범", "no": "25", "title": "한글 맞춤법", "stage": "중~고", "importance": "★★☆", "content": "소리·어법 원리, 사이시옷" },
    { "major": "Ⅰ. 문법", "mid": "F. 담화·규범", "no": "26", "title": "띄어쓰기·표준어·표준발음", "stage": "중~고", "importance": "★★☆", "content": "조사·의존명사, 규정" },
    { "major": "Ⅰ. 문법", "mid": "G. 국어사", "no": "27", "title": "훈민정음과 표기 원리", "stage": "고2~3", "importance": "★★☆", "content": "제자원리, 이어적기·끊어적기" },
    { "major": "Ⅰ. 문법", "mid": "G. 국어사", "no": "28", "title": "중세·근대 국어의 특징", "stage": "고2~3", "importance": "★★☆", "content": "성조·모음조화, 음운·문법 변천" },
    { "major": "Ⅱ. 문학", "mid": "H. 문학 일반", "no": "29", "title": "문학의 갈래", "stage": "중~고", "importance": "★★☆", "content": "서정·서사·극·교술" },
    { "major": "Ⅱ. 문학", "mid": "H. 문학 일반", "no": "30", "title": "문학의 소통과 수용", "stage": "고", "importance": "★☆☆", "content": "작가-작품-독자, 내면화·감상" },
    { "major": "Ⅱ. 문학", "mid": "I. 표현 기법", "no": "31", "title": "비유와 상징", "stage": "중~고", "importance": "★★★", "content": "직유·은유·의인, 상징의 층위" },
    { "major": "Ⅱ. 문학", "mid": "I. 표현 기법", "no": "32", "title": "반어·역설·풍자", "stage": "중~고", "importance": "★★★", "content": "의미의 뒤틀기, 비판적 거리" },
    { "major": "Ⅱ. 문학", "mid": "I. 표현 기법", "no": "33", "title": "강조·변화의 기법", "stage": "고", "importance": "★★☆", "content": "반복·대구·도치·설의" },
    { "major": "Ⅱ. 문학", "mid": "J. 운문 (시)", "no": "34", "title": "시어와 심상 (이미지)", "stage": "중~고", "importance": "★★★", "content": "함축·비유, 시각·청각·공감각" },
    { "major": "Ⅱ. 문학", "mid": "J. 운문 (시)", "no": "35", "title": "운율과 형식", "stage": "중~고", "importance": "★★☆", "content": "내재율·외형률, 음보·음수" },
    { "major": "Ⅱ. 문학", "mid": "J. 운문 (시)", "no": "36", "title": "화자·어조·정서·태도", "stage": "중~고", "importance": "★★★", "content": "시적 화자, 감정과 자세" },
    { "major": "Ⅱ. 문학", "mid": "K. 고전 운문", "no": "37", "title": "향가·고려가요", "stage": "고1~3", "importance": "★★☆", "content": "갈래별 형식, 배경설화" },
    { "major": "Ⅱ. 문학", "mid": "K. 고전 운문", "no": "38", "title": "시조와 가사", "stage": "고1~3", "importance": "★★★", "content": "평·엇·사설시조, 가사의 율격" },
    { "major": "Ⅱ. 문학", "mid": "K. 고전 운문", "no": "39", "title": "고전 시가 어휘·정서", "stage": "고1~3", "importance": "★★★", "content": "고어 해독, 자연·연군 정서" },
    { "major": "Ⅱ. 문학", "mid": "L. 산문 (소설)", "no": "40", "title": "인물·사건·배경", "stage": "중~고", "importance": "★★★", "content": "서사 3요소, 갈등 양상" },
    { "major": "Ⅱ. 문학", "mid": "L. 산문 (소설)", "no": "41", "title": "시점과 서술자", "stage": "중~고", "importance": "★★★", "content": "1·3인칭, 전지적, 서술 거리" },
    { "major": "Ⅱ. 문학", "mid": "L. 산문 (소설)", "no": "42", "title": "서술 방식과 문체", "stage": "고", "importance": "★★☆", "content": "묘사·서술·대화, 어조" },
    { "major": "Ⅱ. 문학", "mid": "M. 고전 산문·극·수필", "no": "43", "title": "고전소설의 특징", "stage": "고1~3", "importance": "★★☆", "content": "전기성·우연성·행복결말" },
    { "major": "Ⅱ. 문학", "mid": "M. 고전 산문·극·수필", "no": "44", "title": "판소리·민속극·설화", "stage": "고", "importance": "★★☆", "content": "서술자 개입, 적층문학" },
    { "major": "Ⅱ. 문학", "mid": "M. 고전 산문·극·수필", "no": "45", "title": "극·수필의 갈래 지식", "stage": "고", "importance": "★☆☆", "content": "희곡·시나리오 용어, 수필 성격" },
    { "major": "Ⅱ. 문학", "mid": "N. 문학사·맥락", "no": "46", "title": "현대문학사 흐름", "stage": "고2~3", "importance": "★★☆", "content": "시대별 사조·경향" },
    { "major": "Ⅱ. 문학", "mid": "N. 문학사·맥락", "no": "47", "title": "사회·문화적 맥락과 감상", "stage": "고2~3", "importance": "★★☆", "content": "작품 배경지식, 외재적 감상" },
    { "major": "Ⅲ. 독서", "mid": "O. 읽기 방법", "no": "48", "title": "사실적 읽기", "stage": "중~고", "importance": "★★★", "content": "정보·중심내용 정확 파악" },
    { "major": "Ⅲ. 독서", "mid": "O. 읽기 방법", "no": "49", "title": "추론적 읽기", "stage": "고", "importance": "★★★", "content": "생략·함축, 전제·근거 도출" },
    { "major": "Ⅲ. 독서", "mid": "O. 읽기 방법", "no": "50", "title": "비판적 읽기", "stage": "고", "importance": "★★☆", "content": "타당성·신뢰성·공정성 평가" },
    { "major": "Ⅲ. 독서", "mid": "O. 읽기 방법", "no": "51", "title": "적용·창의적 읽기", "stage": "고", "importance": "★★☆", "content": "보기 적용, 다른 사례 확장" },
    { "major": "Ⅲ. 독서", "mid": "P. 글의 구조", "no": "52", "title": "전개 방식 (정의·예시·비교 등)", "stage": "중~고", "importance": "★★★", "content": "서술 방식식별" },
    { "major": "Ⅲ. 독서", "mid": "P. 글의 구조", "no": "53", "title": "논지 전개와 문단 관계", "stage": "고", "importance": "★★★", "content": "중심문장, 논리 흐름·연결" },
    { "major": "Ⅲ. 독서", "mid": "P. 글의 구조", "no": "54", "title": "관점·정보의 비교 통합", "stage": "고", "importance": "★★★", "content": "복수 지문·자료 종합" },
    { "major": "Ⅲ. 독서", "mid": "Q. 제재별 독해", "no": "55", "title": "인문 지문 (철학·역사·논리)", "stage": "고", "importance": "★★★", "content": "추상 개념·논증 구조" },
    { "major": "Ⅲ. 독서", "mid": "Q. 제재별 독해", "no": "56", "title": "사회 지문 (법·경제·제도)", "stage": "고", "importance": "★★★", "content": "이론·규정, 사례 적용" },
    { "major": "Ⅲ. 독서", "mid": "Q. 제재별 독해", "no": "57", "title": "과학 지문 (원리·과정)", "stage": "고", "importance": "★★★", "content": "메커니즘·인과, 최고난도" },
    { "major": "Ⅲ. 독서", "mid": "Q. 제재별 독해", "no": "58", "title": "기술·예술 지문", "stage": "고", "importance": "★★☆", "content": "구조·기법, 자료·도표 해석" },
    { "major": "Ⅳ. 어휘", "mid": "R. 어종·표현", "no": "59", "title": "고유어·한자어·외래어", "stage": "중~고", "importance": "★★★", "content": "어종 특성, 한자어=개념어 핵심" },
    { "major": "Ⅳ. 어휘", "mid": "R. 어종·표현", "no": "60", "title": "한자성어", "stage": "중~고", "importance": "★★☆", "content": "사자성어 함축·유래" },
    { "major": "Ⅳ. 어휘", "mid": "R. 어종·표현", "no": "61", "title": "속담·관용어", "stage": "중~고", "importance": "★★☆", "content": "비유적 고정표현" },
    { "major": "Ⅳ. 어휘", "mid": "S. 개념어·의미", "no": "62", "title": "학술 개념어·추상어", "stage": "고", "importance": "★★★", "content": "범주·양상·규정 등 비문학 관문" },
    { "major": "Ⅳ. 어휘", "mid": "S. 개념어·의미", "no": "63", "title": "문맥적 의미와 바꿔 쓰기", "stage": "중~고", "importance": "★★★", "content": "다의어 문맥 판단, 유의어 대체" },
    { "major": "Ⅴ. 화법·작문", "mid": "T. 화법", "no": "64", "title": "대화·토론·협상", "stage": "중~고", "importance": "★☆☆", "content": "협력·설득, 반론·논박" },
    { "major": "Ⅴ. 화법·작문", "mid": "T. 화법", "no": "65", "title": "발표·연설 전략", "stage": "고", "importance": "★☆☆", "content": "매체·청중 고려, 말하기 방식" },
    { "major": "Ⅴ. 화법·작문", "mid": "U. 작문", "no": "66", "title": "글쓰기의 과정", "stage": "중~고", "importance": "★★☆", "content": "계획-생성-조직-표현-고쳐쓰기" },
    { "major": "Ⅴ. 화법·작문", "mid": "U. 작문", "no": "67", "title": "글의 종류별 쓰기 (설명·논증·성찰)", "stage": "고", "importance": "★★☆", "content": "목적·조건에 맞는 서술" },
    { "major": "Ⅴ. 화법·작문", "mid": "U. 작문", "no": "68", "title": "고쳐쓰기·문장 다듬기", "stage": "중~고", "importance": "★★☆", "content": "어법·응집성·일관성" }
  ],
  "eng": [
    { "major": "Ⅰ. 문법", "mid": "A. 문장의 기초", "no": "2", "title": "문장 성분 (주어·동사·목적어·보어)", "stage": "중1", "importance": "★★★", "content": "문장을 이루는 자리" },
    { "major": "Ⅰ. 문법", "mid": "A. 문장의 기초", "no": "3", "title": "문장의 5형식", "stage": "중1", "importance": "★★★", "content": "동사 종류가 문형 결정(자·타·수여·불완전)" },
    { "major": "Ⅰ. 문법", "mid": "A. 문장의 기초", "no": "4", "title": "구와 절", "stage": "중2", "importance": "★★★", "content": "단어 묶음의 두 종류, 긴 문장의 단위" },
    { "major": "Ⅰ. 문법", "mid": "A. 문장의 기초", "no": "5", "title": "문장의 종류 (단문·복문)", "stage": "중2", "importance": "★★☆", "content": "홑문장·겹문장, 등위·종속 연결" },
    { "major": "Ⅰ. 문법", "mid": "B. 시제·상", "no": "6", "title": "현재·과거·미래 (단순시제)", "stage": "중1", "importance": "★★★", "content": "기본 시제와 동사 변화" },
    { "major": "Ⅰ. 문법", "mid": "B. 시제·상", "no": "7", "title": "진행형", "stage": "중1~2", "importance": "★★☆", "content": "be+V-ing, 현재·과거·미래진행" },
    { "major": "Ⅰ. 문법", "mid": "B. 시제·상", "no": "8", "title": "현재완료", "stage": "중2", "importance": "★★★", "content": "경험·완료·계속·결과, 과거와의 구별" },
    { "major": "Ⅰ. 문법", "mid": "B. 시제·상", "no": "9", "title": "과거완료·미래완료", "stage": "중3~고1", "importance": "★★☆", "content": "시제의 기준점, 대과거" },
    { "major": "Ⅰ. 문법", "mid": "C. 조동사·태", "no": "10", "title": "조동사 기본 (can/must/should 등)", "stage": "중2", "importance": "★★☆", "content": "능력·허가·의무·추측" },
    { "major": "Ⅰ. 문법", "mid": "C. 조동사·태", "no": "11", "title": "조동사+have p.p. (과거 추측·후회)", "stage": "고1", "importance": "★★★", "content": "must/should/could have p.p." },
    { "major": "Ⅰ. 문법", "mid": "C. 조동사·태", "no": "12", "title": "수동태 기본", "stage": "중2", "importance": "★★☆", "content": "be+p.p., 능동↔수동 전환" },
    { "major": "Ⅰ. 문법", "mid": "C. 조동사·태", "no": "13", "title": "수동태 심화 (4·5형식·구동사)", "stage": "중3~고1", "importance": "★★☆", "content": "목적어 두 개, 전치사 동반" },
    { "major": "Ⅰ. 문법", "mid": "D. 준동사", "no": "14", "title": "to부정사의 명사적 용용법", "stage": "중2", "importance": "★★★", "content": "주어·목적어·보어 자리" },
    { "major": "Ⅰ. 문법", "mid": "D. 준동사", "no": "15", "title": "to부정사의 형용사·부사적 용법", "stage": "중2~3", "importance": "★★★", "content": "수식·목적·결과·감정원인" },
    { "major": "Ⅰ. 문법", "mid": "D. 준동사", "no": "16", "title": "부정사의 의미상 주어·시제·태", "stage": "고1", "importance": "★★☆", "content": "for/of, 완료부정사" },
    { "major": "Ⅰ. 문법", "mid": "D. 준동사", "no": "17", "title": "동명사", "stage": "중2~3", "importance": "★★★", "content": "주어·목적어, 동명사만 취하는 동사" },
    { "major": "Ⅰ. 문법", "mid": "D. 준동사", "no": "18", "title": "부정사 vs 동명사 (목적어 구별)", "stage": "중3", "importance": "★★★", "content": "remember/stop/try 의미차" },
    { "major": "Ⅰ. 문법", "mid": "D. 준동사", "no": "19", "title": "현재분사·과거분사", "stage": "중3", "importance": "★★★", "content": "능동/수동, 감정동사 분사" },
    { "major": "Ⅰ. 문법", "mid": "D. 준동사", "no": "20", "title": "분사구문", "stage": "고1", "importance": "★★★", "content": "부사절 축약, 시간·이유·조건" },
    { "major": "Ⅰ. 문법", "mid": "D. 준동사", "no": "21", "title": "분사구문 심화 (독립·완료·with)", "stage": "고1~2", "importance": "★★☆", "content": "의미상 주어, having p.p., with+분사" },
    { "major": "Ⅰ. 문법", "mid": "E. 연결 구조", "no": "22", "title": "관계대명사", "stage": "중3", "importance": "★★★", "content": "who/which/that, 주격·목적격·소유격" },
    { "major": "Ⅰ. 문법", "mid": "E. 연결 구조", "no": "23", "title": "관계부사", "stage": "중3~고1", "importance": "★★★", "content": "where/when/why/how" },
    { "major": "Ⅰ. 문법", "mid": "E. 연결 구조", "no": "24", "title": "관계사 심화 (계속적·복합·전치사+관계사)", "stage": "고1~2", "importance": "★★★", "content": "콤마 용법, what, 관계사 whatever" },
    { "major": "Ⅰ. 문법", "mid": "E. 연결 구조", "no": "25", "title": "접속사 (등위·상관·종속)", "stage": "중2~3", "importance": "★★☆", "content": "and/but, both~and, because/although" },
    { "major": "Ⅰ. 문법", "mid": "E. 연결 구조", "no": "26", "title": "명사절·부사절", "stage": "중3~고1", "importance": "★★★", "content": "that/if/whether절, 시간·조건 부사절" },
    { "major": "Ⅰ. 문법", "mid": "F. 가정·특수구문", "no": "27", "title": "가정법 과거·과거완료", "stage": "고1", "importance": "★★★", "content": "현재·과거 반대 가정" },
    { "major": "Ⅰ. 문법", "mid": "F. 가정·특수구문", "no": "28", "title": "가정법 심화 (wish·as if·혼합)", "stage": "고1~2", "importance": "★★☆", "content": "if 생략 도치, without/but for" },
    { "major": "Ⅰ. 문법", "mid": "F. 가정·특수구문", "no": "29", "title": "도치", "stage": "고1~2", "importance": "★★★", "content": "부정어·장소부사구 도치" },
    { "major": "Ⅰ. 문법", "mid": "F. 가정·특수구문", "no": "30", "title": "강조·생략·삽입·동격", "stage": "고2", "importance": "★★☆", "content": "it-that 강조, 공통구문" },
    { "major": "Ⅰ. 문법", "mid": "F. 가정·특수구문", "no": "31", "title": "병렬·수일치·어순", "stage": "고1~2", "importance": "★★★", "content": "등위 병렬, 주어-동사 일치(어법 핵심)" },
    { "major": "Ⅰ. 문법", "mid": "G. 명사·수식·비교", "no": "32", "title": "명사·관사", "stage": "중1~2", "importance": "★★☆", "content": "가산/불가산, a/an/the/무관사" },
    { "major": "Ⅰ. 문법", "mid": "G. 명사·수식·비교", "no": "33", "title": "대명사", "stage": "중1~2", "importance": "★★☆", "content": "인칭·재귀·부정대명사(one/it/some)" },
    { "major": "Ⅰ. 문법", "mid": "G. 명사·수식·비교", "no": "34", "title": "형용사·부사", "stage": "중1~2", "importance": "★★☆", "content": "한정/서술, 빈도부사 위치" },
    { "major": "Ⅰ. 문법", "mid": "G. 명사·수식·비교", "no": "35", "title": "비교 구문", "stage": "중2", "importance": "★★★", "content": "원급·비교·최상, the 비교급, 배수" },
    { "major": "Ⅰ. 문법", "mid": "H. 화법·구문독해", "no": "36", "title": "화법 (직접·간접)", "stage": "중3", "importance": "★★☆", "content": "전달동사, 시제·인칭 전환" },
    { "major": "Ⅰ. 문법", "mid": "H. 화법·구문독해", "no": "37", "title": "복잡한 문장 구조 분석", "stage": "고2~3", "importance": "★★★", "content": "중문·복문 끊어읽기, 구문독해 완성" },
    { "major": "Ⅱ. 어휘", "mid": "I. 기본 어휘", "no": "38", "title": "초등 필수어 800", "stage": "초", "importance": "★★★", "content": "일상 최빈출, 읽기의 바닥" },
    { "major": "Ⅱ. 어휘", "mid": "I. 기본 어휘", "no": "39", "title": "중등 필수어 1200", "stage": "중", "importance": "★★★", "content": "교과서 핵심, 내신 기반" },
    { "major": "Ⅱ. 어휘", "mid": "I. 기본 어휘", "no": "40", "title": "기본 동사·형용사 활용어", "stage": "중", "importance": "★★☆", "content": "불규칙 변화, 다품사 단어" },
    { "major": "Ⅱ. 어휘", "mid": "J. 확장 어휘", "no": "41", "title": "고등 핵심어 (1500)", "stage": "고1~2", "importance": "★★★", "content": "EBS·기출 빈출 주력" },
    { "major": "Ⅱ. 어휘", "mid": "J. 확장 어휘", "no": "42", "title": "수능 고난도 어휘 (1500)", "stage": "고2~3", "importance": "★★★", "content": "실전 독해 상위어" },
    { "major": "Ⅱ. 어휘", "mid": "J. 확장 어휘", "no": "43", "title": "학술·추상 개념어", "stage": "고2~3", "importance": "★★★", "content": "심리·과학·철학 지문 관문" },
    { "major": "Ⅱ. 어휘", "mid": "J. 확장 어휘", "no": "44", "title": "다의어·혼동어", "stage": "중~고", "importance": "★★☆", "content": "spring/matter, 형태 유사어" },
    { "major": "Ⅱ. 어휘", "mid": "K. 어휘 확장 원리", "no": "45", "title": "접두사", "stage": "중~고", "importance": "★★★", "content": "un-/re-/dis-/pre- 의미 단위" },
    { "major": "Ⅱ. 어휘", "mid": "K. 어휘 확장 원리", "no": "46", "title": "접미사", "stage": "중~고", "importance": "★★☆", "content": "-tion/-able/-ness 품사 전환" },
    { "major": "Ⅱ. 어휘", "mid": "K. 어휘 확장 원리", "no": "47", "title": "어근 (라틴·그리스)", "stage": "고", "importance": "★★★", "content": "spect/dict/port, 미지어 추론" },
    { "major": "Ⅱ. 어휘", "mid": "K. 어휘 확장 원리", "no": "48", "title": "연어 (collocation)", "stage": "고", "importance": "★★☆", "content": "make/do/take 자연 결합" },
    { "major": "Ⅱ. 어휘", "mid": "K. 어휘 확장 원리", "no": "49", "title": "동의어·반의어 네트워크", "stage": "중~고", "importance": "★★☆", "content": "패러프레이징 토대" },
    { "major": "Ⅲ. 숙어·표현", "mid": "L. 구동사", "no": "50", "title": "기본 구동사 (get/put/take/come)", "stage": "중~고", "importance": "★★★", "content": "동사+전치사·부사, 최다 빈출" },
    { "major": "Ⅲ. 숙어·표현", "mid": "L. 구동사", "no": "51", "title": "구동사의 다의성", "stage": "고", "importance": "★★☆", "content": "같은 구동사 여러 뜻" },
    { "major": "Ⅲ. 숙어·표현", "mid": "M. 숙어·관용", "no": "52", "title": "관용 숙어 (idiom)", "stage": "중~고", "importance": "★★☆", "content": "비유적 고정표현, 직역 불가" },
    { "major": "Ⅲ. 숙어·표현", "mid": "M. 숙어·관용", "no": "53", "title": "전치사 관용구", "stage": "고", "importance": "★★☆", "content": "in terms of, on behalf of" },
    { "major": "Ⅲ. 숙어·표현", "mid": "N. 구문 표현", "no": "54", "title": "연결어·담화표지", "stage": "고", "importance": "★★★", "content": "however/therefore, 논리 뼈대" },
    { "major": "Ⅲ. 숙어·표현", "mid": "N. 구문 표현", "no": "55", "title": "강조·비교 구문 관용", "stage": "고", "importance": "★★☆", "content": "not only~but also, so~that, no sooner" },
    { "major": "Ⅳ. 독해·듣기", "mid": "O. 독해 기술", "no": "56", "title": "직독직해·끊어읽기", "stage": "중~고", "importance": "★★★", "content": "어순대로 의미 처리, 속도의 근원" },
    { "major": "Ⅳ. 독해·듣기", "mid": "O. 독해 기술", "no": "57", "title": "글의 논리구조 파악", "stage": "고", "importance": "★★★", "content": "주제-근거-예시, 대조·인과 흐름" },
    { "major": "Ⅳ. 독해·듣기", "mid": "O. 독해 기술", "no": "58", "title": "추론·행간 읽기", "stage": "고", "importance": "★★★", "content": "명시 안 된 의미·필자 의도" },
    { "major": "Ⅳ. 독해·듣기", "mid": "O. 독해 기술", "no": "59", "title": "패러프레이징 감각", "stage": "고", "importance": "★★★", "content": "같은 의미 다른 표현 인식(정답의 본질)" },
    { "major": "Ⅳ. 독해·듣기", "mid": "P. 듣기", "no": "60", "title": "발음·연음·강세", "stage": "중", "importance": "★★☆", "content": "소리→철자 연결, 듣기 기초" },
    { "major": "Ⅳ. 독해·듣기", "mid": "P. 듣기", "no": "61", "title": "청해 (세부·맥락)", "stage": "중~고", "importance": "★★☆", "content": "음성→의미 즉시 변환, 담화 흐름" },
    { "major": "Ⅴ. 배경·산출", "mid": "Q. 배경지식", "no": "62", "title": "과학·기술 배경", "stage": "고", "importance": "★★☆", "content": "최근 빈칸 단골 소재" },
    { "major": "Ⅴ. 배경·산출", "mid": "Q. 배경지식", "no": "63", "title": "인문·심리·철학 배경", "stage": "고", "importance": "★★☆", "content": "추상 주장문 이해" },
    { "major": "Ⅴ. 배경·산출", "mid": "Q. 배경지식", "no": "64", "title": "사회·경제·문화 배경", "stage": "고", "importance": "★☆☆", "content": "제도·이론, 영미권 상식" },
    { "major": "Ⅴ. 배경·산출", "mid": "R. 산출 (쓰기)", "no": "65", "title": "영작·문장 쓰기", "stage": "중~고", "importance": "★★☆", "content": "배운 문법으로 정확한 문장 생성" },
    { "major": "Ⅴ. 배경·산출", "mid": "R. 산출 (쓰기)", "no": "66", "title": "요약·서술형 답안", "stage": "고", "importance": "★★☆", "content": "내신 서술형, 핵심 압축" }
  ],
  "math": [
    { "part": "Ⅰ부", "category": "도구 1. 미분", "no": "1", "title": "부정형 극한(로피탈)", "difficulty": "2.2 (하)", "trend": "초반부 3점 계산 위주 출제" },
    { "part": "Ⅰ부", "category": "도구 1. 미분", "no": "2", "title": "접선의 기울기·방정식", "difficulty": "3.1 (중)", "trend": "3점 후반~쉬운 4점 형태" },
    { "part": "Ⅰ부", "category": "도구 1. 미분", "no": "3", "title": "증가·감소", "difficulty": "3.4 (중)", "trend": "함수의 조건 해석용으로 연계" },
    { "part": "Ⅰ부", "category": "도구 1. 미분", "no": "4", "title": "극대·극소", "difficulty": "4.3 (상)", "trend": "준킬러 및 킬러 문항의 단골 소재" },
    { "part": "Ⅰ부", "category": "도구 1. 미분", "no": "5", "title": "오목·볼록·변곡점", "difficulty": "4.1 (상)", "trend": "미적분 선택과목 고난도 문항" },
    { "part": "Ⅰ부", "category": "도구 1. 미분", "no": "6", "title": "함수의 최대·최소", "difficulty": "3.5 (상)", "trend": "도함수 활용 알고리즘 문항" },
    { "part": "Ⅰ부", "category": "도구 1. 미분", "no": "7", "title": "방정식 실근 개수·부등식 증명", "difficulty": "4.6 (최상)", "trend": "공통 22번 등 변별력 문항 핵심" },
    { "part": "Ⅰ부", "category": "도구 2. 그래프", "no": "8", "title": "방정식 해=교점", "difficulty": "4.2 (상)", "trend": "추론형 4점 문항의 핵심 도구" },
    { "part": "Ⅰ부", "category": "도구 2. 그래프", "no": "9", "title": "부등식 해=위/아래 구간", "difficulty": "3.2 (중)", "trend": "조건 제시형 문항으로 출제" },
    { "part": "Ⅰ부", "category": "도구 2. 그래프", "no": "10", "title": "판별식 D", "difficulty": "2.1 (하)", "trend": "타 개념의 보조 계산 도구로만 활용" },
    { "part": "Ⅰ부", "category": "도구 2. 그래프", "no": "11", "title": "이차·연립이차부등식", "difficulty": "2.5 (중)", "trend": "간접 출제 범위 형태" },
    { "part": "Ⅰ부", "category": "도구 2. 그래프", "no": "12", "title": "근의 분리", "difficulty": "3.6 (상)", "trend": "조건 만족하는 미정계수 결정" },
    { "part": "Ⅰ부", "category": "도구 2. 그래프", "no": "13", "title": "절댓값 방정식·부등식", "difficulty": "4.5 (최상)", "trend": "꺾인 점, 미분가능성과 결합된 킬러" },
    { "part": "Ⅰ부", "category": "도구 2. 그래프", "no": "14", "title": "지수·로그·삼각 방정식·부등식", "difficulty": "3.4 (중)", "trend": "공통과목 4점 초반부 배치" },
    { "part": "Ⅰ부", "category": "도구 2. 그래프", "no": "15", "title": "그래프 6질문(정의역·치역·절편 등)", "difficulty": "3.8 (상)", "trend": "초월함수 그래프 개형 추론" },
    { "part": "Ⅰ부", "category": "도구 3. 좌표화+거리", "no": "16", "title": "차원별 거리(공간공식)", "difficulty": "3.0 (중)", "trend": "기하 선택과목 또는 수1 기본 4점" },
    { "part": "Ⅰ부", "category": "도구 3. 좌표화+거리", "no": "17", "title": "중점·무게중심", "difficulty": "2.0 (하)", "trend": "기초 좌표 연산" },
    { "part": "Ⅰ부", "category": "도구 3. 좌표화+거리", "no": "18", "title": "각종 길이(대각선·높이)", "difficulty": "3.1 (중)", "trend": "도형의 성질과 결합된 문항" },
    { "part": "Ⅰ부", "category": "도구 3. 좌표화+거리", "no": "19", "title": "원의 방정식", "difficulty": "3.5 (상)", "trend": "삼각함수 도형 및 기하 연계" },
    { "part": "Ⅰ부", "category": "도구 3. 좌표화+거리", "no": "20", "title": "sin²θ+cos²θ=1", "difficulty": "2.8 (중)", "trend": "삼각함수 식 변형 필수 기본 도구" },
    { "part": "Ⅰ부", "category": "도구 3. 좌표화+거리", "no": "21", "title": "점과 직선 사이의 거리", "difficulty": "3.2 (중)", "trend": "최댓값/최솟값 구하는 조건 형성" },
    { "part": "Ⅰ부", "category": "도구 4. 내적", "no": "22", "title": "두 벡터의 각", "difficulty": "3.7 (상)", "trend": "기하 과목 평면벡터 고난도" },
    { "part": "Ⅰ부", "category": "도구 4. 내적", "no": "23", "title": "수직조건(내적=0)", "difficulty": "3.5 (상)", "trend": "내적의 성질을 이용한 방정식" },
    { "part": "Ⅰ부", "category": "도구 4. 내적", "no": "24", "title": "평행조건", "difficulty": "2.9 (중)", "trend": "벡터의 실수배 연산" },
    { "part": "Ⅰ부", "category": "도구 4. 내적", "no": "25", "title": "코사인법칙", "difficulty": "4.2 (상)", "trend": "최근 수1 도형 문항의 최고난도화" },
    { "part": "Ⅰ부", "category": "도구 5. 이동규칙", "no": "26", "title": "이차 표준형", "difficulty": "1.8 (하)", "trend": "단순 평행이동 기본 개념" },
    { "part": "Ⅰ부", "category": "도구 5. 이동규칙", "no": "27", "title": "유리·무리함수", "difficulty": "2.7 (중)", "trend": "격자점 개수 또는 역함수 연계" },
    { "part": "Ⅰ부", "category": "도구 5. 이동규칙", "no": "28", "title": "지수·로그함수", "difficulty": "3.9 (상)", "trend": "밑의 조건에 따른 대소 비교 등 추론" },
    { "part": "Ⅰ부", "category": "도구 5. 이동규칙", "no": "29", "title": "삼각함수 그래프", "difficulty": "4.0 (상)", "trend": "주기성과 대칭성을 이용한 복합 추론" },
    { "part": "Ⅰ부", "category": "도구 5. 이동규칙", "no": "30", "title": "원의 이동", "difficulty": "3.1 (중)", "trend": "자취의 방정식 연계" },
    { "part": "Ⅰ부", "category": "도구 5. 이동규칙", "no": "31", "title": "이차곡선", "difficulty": "3.8 (상)", "trend": "기하 과목 정의 활용 고난도" },
    { "part": "Ⅰ부", "category": "도구 6. 기본정리", "no": "32", "title": "부정적분(역미분)", "difficulty": "2.4 (하)", "trend": "기본 다항함수 적분 계산" },
    { "part": "Ⅰ부", "category": "도구 6. 기본정리", "no": "33", "title": "정적분의 뜻(넓이의 극한)", "difficulty": "4.2 (상)", "trend": "급수와 정적분의 전환 (미적분)" },
    { "part": "Ⅰ부", "category": "도구 6. 기본정리", "no": "34", "title": "넓이·부피·회전체·길이·거리", "difficulty": "3.7 (상)", "trend": "정적분 활용 문항 (속도와 거리 포함)" },
    { "part": "Ⅰ부", "category": "도구 7. 대수정리", "no": "35", "title": "인수정리·고차식 인수분해", "difficulty": "3.6 (상)", "trend": "다항함수 식을 빠르게 작성하는 도구" },
    { "part": "Ⅰ부", "category": "도구 7. 대수정리", "no": "36", "title": "켤레근·ω·두 근으로 방정식", "difficulty": "2.8 (중)", "trend": "대수적 성질 활용" },
    { "part": "Ⅰ부", "category": "도구 7. 대수정리", "no": "37", "title": "미정계수법", "difficulty": "3.2 (중)", "trend": "극한 조건 만족하는 계수 결정" },
    { "part": "Ⅰ부", "category": "도구 8. 확률", "no": "38", "title": "조건부확률", "difficulty": "3.6 (상)", "trend": "확통 선택과목의 대표적 4점 유형" },
    { "part": "Ⅰ부", "category": "도구 8. 확률", "no": "39", "title": "독립·종속·독립시행·복원", "difficulty": "3.4 (중)", "trend": "규칙적인 시행의 확률 계산" },
    { "part": "Ⅰ부", "category": "도구 8. 확률", "no": "40", "title": "정규분포·표준화", "difficulty": "3.0 (중)", "trend": "표준정규분포표 이용 (전형적 유형)" },
    { "part": "Ⅰ부", "category": "도구 8. 확률", "no": "41", "title": "이항분포 정규근사", "difficulty": "3.2 (중)", "trend": "개념 간 전환을 묻는 3~4점 문항" },
    { "part": "Ⅱ부", "category": "Ⅰ. 수와 연산", "no": "1", "title": "수 체계의 확장 원리", "difficulty": "1.5 (하)", "trend": "기초 수 연산" },
    { "part": "Ⅱ부", "category": "Ⅰ. 수와 연산", "no": "2", "title": "연산법칙(교환·결합·분배)", "difficulty": "1.5 (하)", "trend": "기본 수식 정리" },
    { "part": "Ⅱ부", "category": "Ⅰ. 수와 연산", "no": "3", "title": "역원", "difficulty": "-", "trend": "현 교육과정 직접 출제 배제" },
    { "part": "Ⅱ부", "category": "Ⅰ. 수와 연산", "no": "4", "title": "소인수분해", "difficulty": "2.5 (중)", "trend": "배수/약수 조건 추론" },
    { "part": "Ⅱ부", "category": "Ⅰ. 수와 연산", "no": "5", "title": "지수법칙", "difficulty": "1.8 (하)", "trend": "매년 1번 문항 출제" },
    { "part": "Ⅱ부", "category": "Ⅰ. 수와 연산", "no": "6", "title": "거듭제곱근", "difficulty": "3.8 (상)", "trend": "n제곱근 중 실수의 개수 (4점 단골)" },
    { "part": "Ⅱ부", "category": "Ⅰ. 수와 연산", "no": "7", "title": "로그", "difficulty": "2.6 (중)", "trend": "로그의 성질 및 밑 조건 계산" },
    { "part": "Ⅱ부", "category": "Ⅰ. 수와 연산", "no": "8", "title": "복소수와 켤레", "difficulty": "-", "trend": "수능 직접 출제 배제" },
    { "part": "Ⅱ부", "category": "Ⅱ. 문자와 식", "no": "9", "title": "문자로 수량 나타내기와 대입", "difficulty": "2.3 (하)", "trend": "문장제 문항 초기 식 세우기" },
    { "part": "Ⅱ부", "category": "Ⅱ. 문자와 식", "no": "10", "title": "다항식의 사칙연산", "difficulty": "1.8 (하)", "trend": "전개 및 동류항 정리" },
    { "part": "Ⅱ부", "category": "Ⅱ. 문자와 식", "no": "11", "title": "곱셈 공식", "difficulty": "2.2 (하)", "trend": "변형 공식 활용 연산" },
    { "part": "Ⅱ부", "category": "Ⅱ. 문자와 식", "no": "12", "title": "인수분해", "difficulty": "2.8 (중)", "trend": "식의 간소화 단계에서 활용" },
    { "part": "Ⅱ부", "category": "Ⅱ. 문자와 식", "no": "13", "title": "다항식의 나눗셈(A=BQ+R)", "difficulty": "2.5 (중)", "trend": "항등식의 성질 이용" },
    { "part": "Ⅱ부", "category": "Ⅱ. 문자와 식", "no": "14", "title": "유리식의 계산", "difficulty": "2.0 (하)", "trend": "분수식 형태 연산" },
    { "part": "Ⅱ부", "category": "Ⅱ. 문자와 식", "no": "15", "title": "절대부등식의 증명(산술·기하평균)", "difficulty": "3.5 (상)", "trend": "도형/함수 최솟값 구하기 융합" },
    { "part": "Ⅱ부", "category": "Ⅱ. 문자와 식", "no": "16", "title": "나머지정리", "difficulty": "3.0 (중)", "trend": "고1 연계 개념으로 간혹 출제" },
    { "part": "Ⅱ부", "category": "Ⅲ. 방정식·부등식", "no": "17", "title": "등식의 성질과 이항", "difficulty": "1.5 (하)", "trend": "기본 일차방정식 수준" },
    { "part": "Ⅱ부", "category": "Ⅲ. 방정식·부등식", "no": "18", "title": "근의 공식(유도 포함)", "difficulty": "2.1 (하)", "trend": "이차방정식 해 구하기" },
    { "part": "Ⅱ부", "category": "Ⅲ. 방정식·부등식", "no": "19", "title": "근과 계수의 관계", "difficulty": "2.9 (중)", "trend": "수열 및 미적분 계산 중간 도구" },
    { "part": "Ⅱ부", "category": "Ⅲ. 방정식·부등식", "no": "20", "title": "방정식의 활용(상황→식)", "difficulty": "3.4 (중)", "trend": "실생활 문장제 및 함수 모델링" },
    { "part": "Ⅱ부", "category": "Ⅳ. 함수", "no": "21", "title": "함수의 정의", "difficulty": "2.8 (중)", "trend": "정의역/공역 대응 관계" },
    { "part": "Ⅱ부", "category": "Ⅳ. 함수", "no": "22", "title": "일대일대응", "difficulty": "3.6 (상)", "trend": "역함수 존재 조건과 결합된 4점" },
    { "part": "Ⅱ부", "category": "Ⅳ. 함수", "no": "23", "title": "합성함수", "difficulty": "4.5 (최상)", "trend": "합성함수의 극대/극소, 킬러 단골" },
    { "part": "Ⅱ부", "category": "Ⅳ. 함수", "no": "24", "title": "역함수", "difficulty": "4.3 (상)", "trend": "역함수 미분법 및 적분 활용 고난도" },
    { "part": "Ⅱ부", "category": "Ⅴ. 기하", "no": "25", "title": "점·선·면과 각", "difficulty": "2.2 (하)", "trend": "중등 기하 기본 성질" },
    { "part": "Ⅱ부", "category": "Ⅴ. 기하", "no": "26", "title": "위치 관계(평면·공간)", "difficulty": "3.5 (상)", "trend": "공간도형 삼수선의 정리 연계" },
    { "part": "Ⅱ부", "category": "Ⅴ. 기하", "no": "27", "title": "평행선의 성질", "difficulty": "2.5 (중)", "trend": "동위각, 엇각을 통한 각의 이동" },
    { "part": "Ⅱ부", "category": "Ⅴ. 기하", "no": "28", "title": "삼각형의 합동 조건", "difficulty": "2.8 (중)", "trend": "도형 분석의 기초" },
    { "part": "Ⅱ부", "category": "Ⅴ. 기하", "no": "29", "title": "삼각형의 닮음 조건", "difficulty": "4.0 (상)", "trend": "무한등비급수 도형 문항 핵심 도구" },
    { "part": "Ⅱ부", "category": "Ⅴ. 기하", "no": "30", "title": "닮음비", "difficulty": "3.8 (상)", "trend": "닮음을 이용한 길이 표현" },
    { "part": "Ⅱ부", "category": "Ⅴ. 기하", "no": "31", "title": "직각삼각형의 닮음", "difficulty": "3.5 (상)", "trend": "삼각비 조건 도출" },
    { "part": "Ⅱ부", "category": "Ⅴ. 기하", "no": "32", "title": "피타고라스 정리의 증명", "difficulty": "2.0 (하)", "trend": "기본 길이 계산용" },
    { "part": "Ⅱ부", "category": "Ⅴ. 기하", "no": "33", "title": "삼각형의 내각·외각", "difficulty": "2.7 (중)", "trend": "외각의 성질을 이용한 각 변환" },
    { "part": "Ⅱ부", "category": "Ⅴ. 기하", "no": "34", "title": "삼각형의 오심", "difficulty": "3.6 (상)", "trend": "외심/내심 성질 활용 도형 문항" },
    { "part": "Ⅱ부", "category": "Ⅴ. 기하", "no": "35", "title": "평행사변형의 성질과 조건", "difficulty": "2.4 (하)", "trend": "벡터 평행사변형법 등 연계" },
    { "part": "Ⅱ부", "category": "Ⅴ. 기하", "no": "36", "title": "중심각과 호·넓이", "difficulty": "2.9 (중)", "trend": "부채꼴 호의 길이와 넓이 공식" },
    { "part": "Ⅱ부", "category": "Ⅴ. 기하", "no": "37", "title": "원주각", "difficulty": "4.1 (상)", "trend": "원에 내접하는 삼각형(사인법칙 연계)" },
    { "part": "Ⅱ부", "category": "Ⅴ. 기하", "no": "38", "title": "다면체·회전체·정다면체", "difficulty": "3.2 (중)", "trend": "공간도형 단면화 문제" },
    { "part": "Ⅱ부", "category": "Ⅴ. 기하", "no": "39", "title": "겉넓이와 부피", "difficulty": "2.5 (중)", "trend": "입체도형 기본 연산" },
    { "part": "Ⅱ부", "category": "Ⅴ. 기하", "no": "40", "title": "사인법칙·코사인법칙", "difficulty": "4.2 (상)", "trend": "최근 수1 변변력 핵심 문항" },
    { "part": "Ⅱ부", "category": "Ⅴ. 기하", "no": "41", "title": "삼각형의 넓이", "difficulty": "3.0 (중)", "trend": "0.5*a*b*sinθ 활용 공식" },
    { "part": "Ⅱ부", "category": "Ⅵ. 좌표기하", "no": "42", "title": "직선의 방정식", "difficulty": "2.8 (중)", "trend": "기울기 관계를 이용한 수직/평행" },
    { "part": "Ⅱ부", "category": "Ⅵ. 좌표기하", "no": "43", "title": "원과 직선의 위치 관계", "difficulty": "3.6 (상)", "trend": "d=r을 이용한 접선 추론" },
    { "part": "Ⅱ부", "category": "Ⅶ. 미적분", "no": "44", "title": "극한·연속의 정의", "difficulty": "3.7 (상)", "trend": "좌극한/우극한, 사잇값정리 응용" },
    { "part": "Ⅱ부", "category": "Ⅶ. 미적분", "no": "45", "title": "도함수(미분가능성)", "difficulty": "4.5 (최상)", "trend": "절댓값 함수와 결합된 미분가능성" },
    { "part": "Ⅱ부", "category": "Ⅶ. 미적분", "no": "46", "title": "미적분의 기본정리", "difficulty": "4.4 (상)", "trend": "정적분으로 정의된 함수 추론" },
    { "part": "Ⅱ부", "category": "Ⅷ. 확률·통계", "no": "47", "title": "합의 법칙·곱의 법칙", "difficulty": "3.2 (중)", "trend": "경우의 수 구하기 기초" },
    { "part": "Ⅱ부", "category": "Ⅷ. 확률·통계", "no": "48", "title": "순열", "difficulty": "3.4 (중)", "trend": "여러 가지 순열 (원순열, 중복순열 등)" },
    { "part": "Ⅱ부", "category": "Ⅷ. 확률·통계", "no": "49", "title": "조합(이항정리)", "difficulty": "3.8 (상)", "trend": "중복조합을 활용한 방정식 해 추론" },
    { "part": "Ⅱ부", "category": "Ⅷ. 확률·통계", "no": "50", "title": "확률의 뜻과 성질", "difficulty": "2.8 (중)", "trend": "수학적 확률 계산" },
    { "part": "Ⅱ부", "category": "Ⅷ. 확률·통계", "no": "51", "title": "확률의 덧셈정리·여사건", "difficulty": "3.5 (상)", "trend": "'적어도' 조건 처리 및 여사건 추론" },
    { "part": "Ⅱ부", "category": "Ⅷ. 확률·통계", "no": "52", "title": "도수분포와 대푯값·산포도", "difficulty": "2.2 (하)", "trend": "기초 통계량 계산" },
    { "part": "Ⅱ부", "category": "Ⅷ. 확률·통계", "no": "53", "title": "확률변수와 확률분포", "difficulty": "3.7 (상)", "trend": "이산확률변수의 평균/분산 추론" },
    { "part": "Ⅱ부", "category": "Ⅸ. 수열", "no": "54", "title": "수열과 일반항", "difficulty": "2.9 (중)", "trend": "규칙성 찾기 기초" },
    { "part": "Ⅱ부", "category": "Ⅸ. 수열", "no": "55", "title": "등차수열", "difficulty": "3.6 (상)", "trend": "등차수열 합의 대칭성 및 최댓값" },
    { "part": "Ⅱ부", "category": "Ⅸ. 수열", "no": "56", "title": "등비수열", "difficulty": "3.2 (중)", "trend": "등비수열의 성질 연산" },
    { "part": "Ⅱ부", "category": "Ⅸ. 수열", "no": "57", "title": "Σ의 성질과 거듭제곱 합", "difficulty": "3.4 (중)", "trend": "시그마 기호의 연산 및 성질" },
    { "part": "Ⅱ부", "category": "Ⅸ. 수열", "no": "58", "title": "점화식(Sn ↔ an 포함)", "difficulty": "4.6 (최상)", "trend": "역추적 및 발견적 추론 (15번 단골)" },
    { "part": "Ⅱ부", "category": "Ⅸ. 수열", "no": "59", "title": "수학적 귀납법", "difficulty": "3.8 (상)", "trend": "빈칸 채우기 형식으로 주로 출제" },
    { "part": "Ⅱ부", "category": "Ⅹ. 행렬·벡터", "no": "60", "title": "행렬의 연산", "difficulty": "2.0 (하)", "trend": "과거 교육과정 기출 행렬 계산" },
    { "part": "Ⅱ부", "category": "Ⅹ. 행렬·벡터", "no": "61", "title": "행렬 곱셈의 특이성", "difficulty": "3.5 (상)", "trend": "행렬 합답형 진위 판정 문항" },
    { "part": "Ⅱ부", "category": "Ⅹ. 행렬·벡터", "no": "62", "title": "벡터의 뜻과 연산", "difficulty": "4.2 (상)", "trend": "벡터 방정식 만족하는 점의 자취 추론" }
  ]
};

const BOOKS_DATA = [
  { "area": "과학", "grade": "중1", "no": "2", "chapter": "여러 가지 힘", "intro": "빌 브라이슨, 거의 모든 것의 역사", "main": "뉴턴, 프린키피아", "deep": "레오나르도 다빈치, 코덱스" },
  { "area": "과학", "grade": "중1", "no": "3", "chapter": "생물의 다양성", "intro": "최재천, 생명이 있는 것은 다 아름답다", "main": "다윈, 종의 기원", "deep": "파브르, 곤충기" },
  { "area": "과학", "grade": "중1", "no": "4", "chapter": "기체의 성질", "intro": "빌 브라이슨, 거의 모든 것의 역사", "main": "파인만, 물리학 강의", "deep": "로버트 보일, 회의적 화학자" },
  { "area": "과학", "grade": "중1", "no": "5", "chapter": "물질의 상태 변화", "intro": "페니 카메론 르 쿠터, 역사를 바꾼 17가지 화학 이야기", "main": "라부아지에, 화학원론", "deep": "바슐라르, 불의 역사" },
  { "area": "과학", "grade": "중1", "no": "6", "chapter": "빛과 파동", "intro": "김상욱, 김상욱의 양자 공부", "main": "뉴턴, 광학", "deep": "케플러, 광학" },
  { "area": "과학", "grade": "중1", "no": "7", "chapter": "과학과 나의 미래", "intro": "칼 세이건, 코스모스", "main": "왓슨, 이중나선", "deep": "하라리, 호모 데우스" },
  { "area": "과학", "grade": "중2", "no": "8", "chapter": "물질의 구성", "intro": "페니 카메론 르 쿠터, 역사를 바꾼 17가지 화학 이야기", "main": "라부아지에, 화학원론", "deep": "샘 킨, 원소 사냥꾼" },
  { "area": "과학", "grade": "중2", "no": "9", "chapter": "전기와 자기", "intro": "빌 브라이슨, 거의 모든 것의 역사", "main": "마이클 패러데이, 양초 한 자루에 담긴 화학 이야기", "deep": "맥스웰, 전기이론" },
  { "area": "과학", "grade": "중2", "no": "10", "chapter": "태양계", "intro": "칼 세이건, 창백한 푸른 점", "main": "코페르니쿠스, 천구의 회전", "deep": "칼 세이건, 코스모스" },
  { "area": "과학", "grade": "중2", "no": "11", "chapter": "식물과 에너지", "intro": "페터 볼레벤, 나무 수업", "main": "호프 자런, 랩 걸", "deep": "만쿠소, 식물의 정신세계" },
  { "area": "과학", "grade": "중2", "no": "12", "chapter": "동물과 에너지", "intro": "최재천, 생명이 있는 것은 다 아름답다", "main": "최재천, 다윈지능", "deep": "프리쉬, 동물의 언어" },
  { "area": "과학", "grade": "중2", "no": "13", "chapter": "물질의 특성", "intro": "프리모 레비, 주기율표", "main": "라부아지에, 화학원론", "deep": "애트KINS, 분자의 세계" },
  { "area": "과학", "grade": "중2", "no": "14", "chapter": "수권과 해수의 순환", "intro": "레이첼 카슨, 바닷바람을 맞으며", "main": "레이첼 카슨, 우리를 둘러싼 바다", "deep": "스미스, 바다의 역사" },
  { "area": "과학", "grade": "중2", "no": "15", "chapter": "열과 우리 생활", "intro": "제러미 리프킨, 엔트로피", "main": "파인만, 물리학 강의", "deep": "리프킨, 엔트로피" },
  { "area": "과학", "grade": "중2", "no": "16", "chapter": "재해·재난과 안전", "intro": "빌 브라이슨, 거의 모든 것의 역사", "main": "레이첼 카슨, 침묵의 봄", "deep": "브라이슨, 공포의 대기" },
  { "area": "과학", "grade": "중3", "no": "17", "chapter": "화학 반응의 규칙성", "intro": "페니 카메론 르 쿠터, 역사를 바꾼 17가지 화학 이야기", "main": "라부아지에, 화학원론", "deep": "돌턴, 물질의 변화" },
  { "area": "과학", "grade": "중3", "no": "18", "chapter": "기권과 우주", "intro": "칼 세이건, 코스모스", "main": "레이첼 카슨, 침묵의 봄", "deep": "핀켈, 대기" },
  { "area": "과학", "grade": "중3", "no": "19", "chapter": "운동과 에너지", "intro": "리처드 파인만, 파인만 씨 농담도 잘하시네", "main": "뉴턴, 프린키피아", "deep": "스밀, 에너지" },
  { "area": "과학", "grade": "중3", "no": "20", "chapter": "자극과 반응", "intro": "올리버 색스, 뮤지코필리아", "main": "올리버 색스, 아내를 모자로 착각한 남자", "deep": "브로카, 뇌의 위대한 실수" },
  { "area": "과학", "grade": "중3", "no": "21", "chapter": "생식과 유전", "intro": "리처드 도킨스, 이기적 유전자", "main": "멘델, 실험 논문", "deep": "왓슨, 이중나선" },
  { "area": "과학", "grade": "중3", "no": "22", "chapter": "에너지 전환과 보존", "intro": "제러미 리프킨, 엔트로피", "main": "파인만, 물리학 강의", "deep": "클라우지우스, 열역학" },
  { "area": "과학", "grade": "중3", "no": "23", "chapter": "별과 우주", "intro": "스티븐 호킹, 시간의 역사", "main": "칼 세이건, 코스모스", "deep": "브라이언 그린, 우주의 구조" },
  { "area": "과학", "grade": "중3", "no": "24", "chapter": "과학기술과 인류 문명", "intro": "재레드 다이아몬드, 총 균 쇠", "main": "유발 하라리, 사피엔스", "deep": "케스틀러, 기계 속의 유령" },
  { "area": "과학", "grade": "고통과", "no": "25", "chapter": "화학의 언어", "intro": "", "main": "라부아지에, 화학원론", "deep": "라부아지에, 화학원론" },
  { "area": "과학", "grade": "고통과", "no": "26", "chapter": "물질의 규칙성과 성질", "intro": "", "main": "프리모 레비, 주기율표", "deep": "라이너스 폴링, 화학결합의 본질" },
  { "area": "과학", "grade": "고통과", "no": "27", "chapter": "세포와 물질대사", "intro": "", "main": "슈뢰딩거, 생명이란 무엇인가", "deep": "왓슨, 이중나선" },
  { "area": "과학", "grade": "고통과", "no": "28", "chapter": "화학 변화", "intro": "", "main": "라부아지에, 화학원론", "deep": "라부아지에, 화학원론" },
  { "area": "과학", "grade": "고통과", "no": "29", "chapter": "지구시스템", "intro": "", "main": "베게너, 대륙과 대양의 기원", "deep": "라이엘, 지질학 원리" },
  { "area": "과학", "grade": "고통과", "no": "30", "chapter": "역학적 시스템", "intro": "", "main": "뉴턴, 프린키피아", "deep": "아이작 뉴턴, 프린키피아" },
  { "area": "과학", "grade": "고통과", "no": "31", "chapter": "생명시스템", "intro": "", "main": "리처드 도킨스, 이기적 유전자", "deep": "맷 리들리, 게놈" },
  { "area": "과학", "grade": "고통과2", "no": "32", "chapter": "지구환경변화", "intro": "", "main": "레이첼 카슨, 침묵의 봄", "deep": "콜버트, 여섯 번째 대멸종" },
  { "area": "과학", "grade": "고통과2", "no": "33", "chapter": "생태계와 환경", "intro": "", "main": "페터 볼레벤, 나무의 비밀 생활", "deep": "카슨, 침묵의 봄" },
  { "area": "과학", "grade": "고통과2", "no": "34", "chapter": "전기와 자기의 이용", "intro": "", "main": "마이클 패러데이, 양초 한 자루에 담긴 화학 이야기", "deep": "마이클 패러데이, 양초 한 자루에 담긴 화학 이야기" },
  { "area": "과학", "grade": "고통과2", "no": "35", "chapter": "시스템과 재해·재난", "intro": "", "main": "알프레트 베게너, 대륙과 해양의 기원", "deep": "알프레트 베게너, 대륙과 해양의 기원" },
  { "area": "과학", "grade": "고통과2", "no": "36", "chapter": "과학과 미래사회", "intro": "", "main": "하라리, 사피엔스", "deep": "유발 하라리, 호모 데우스" },
  { "area": "과학", "grade": "고물", "no": "37", "chapter": "힘과 운동", "intro": "", "main": "뉴턴, 프린키피아", "deep": "아이작 뉴턴, 프린키피아" },
  { "area": "과학", "grade": "고물", "no": "38", "chapter": "에너지", "intro": "", "main": "파인만, 물리학 강의", "deep": "아인슈타인, 상대성이론" },
  { "area": "과학", "grade": "고물", "no": "39", "chapter": "전기와 자기", "intro": "빌 브라이슨, 거의 모든 것의 역사", "main": "마이클 패러데이, 양초 한 자루에 담긴 화학 이야기", "deep": "제임스 맥스웰, 전자기론" },
  { "area": "과학", "grade": "고물", "no": "40", "chapter": "빛과 물질의 이중성", "intro": "", "main": "파인만, QED 강연", "deep": "아인슈타인, 상대성이론" },
  { "area": "과학", "grade": "고화", "no": "41", "chapter": "화학의 첫걸음", "intro": "", "main": "라부아지에, 화학원론", "deep": "프리모 레비, 주기율표" },
  { "area": "과학", "grade": "고화", "no": "42", "chapter": "원자의 세계", "intro": "", "main": "프리모 레비, 주기율표", "deep": "피터 앳킨스, 원소의 왕국" },
  { "area": "과학", "grade": "고화", "no": "43", "chapter": "화학 결합과 분자", "intro": "", "main": "폴링, 화학결합의 본질", "deep": "라이너스 폴링, 화학결합의 본질" },
  { "area": "과학", "grade": "고화", "no": "44", "chapter": "역동적인 화학반응", "intro": "", "main": "라부아지에, 화학원론", "deep": "샘 킨, 원소 사냥꾼" },
  { "area": "과학", "grade": "고생", "no": "45", "chapter": "세포의 특성", "intro": "", "main": "슈뢰딩거, 생명이란 무엇인가", "deep": "에르빈 슈뢰딩거, 생명이란 무엇인가" },
  { "area": "과학", "grade": "고생", "no": "46", "chapter": "항상성과 몸의 조절", "intro": "", "main": "올리버 색스, 아내를 모자로 착각한 남자", "deep": "올리버 색스, 아내를 모자로 착각한 남자" },
  { "area": "과학", "grade": "고생", "no": "47", "chapter": "유전자와 생명공학", "intro": "", "main": "왓슨, 이중나선", "deep": "맷 리들리, 게놈" },
  { "area": "과학", "grade": "고생", "no": "48", "chapter": "생태계와 상호작용", "intro": "", "main": "볼레벤, 나무의 비밀 생활", "deep": "카슨, 침묵의 봄" },
  { "area": "과학", "grade": "고지", "no": "49", "chapter": "대기와 해양", "intro": "", "main": "레이첼 카슨, 우리를 둘러싼 바다", "deep": "레이첼 카슨, 침묵의 봄" },
  { "area": "과학", "grade": "고지", "no": "50", "chapter": "우주의 신비", "intro": "", "main": "칼 세이건, 코스모스", "deep": "호킹, 시간의 역사" },
  { "area": "과학", "grade": "고지", "no": "51", "chapter": "고체 지구", "intro": "", "main": "베게너, 대륙과 대양의 기원", "deep": "라이엘, 지질학 원리" },
  { "area": "과학", "grade": "고지", "no": "52", "chapter": "지구의 역사와 진화", "intro": "", "main": "라이엘, 지질학 원리", "deep": "노프, 지구의 짧은 역사" },
  { "area": "사회", "grade": "중1", "no": "1", "chapter": "내가 사는 세계", "intro": "유시민, 청춘의 독서", "main": "훔볼트, 코스모스", "deep": "스트라보, 지리학" },
  { "area": "사회", "grade": "중1", "no": "2", "chapter": "자연으로 떠나는 여행", "intro": "알랭 드 보통, 여행의 기술", "main": "훔볼트, 코스모스", "deep": "알랭 드 보통, 여행의 기술" },
  { "area": "사회", "grade": "중1", "no": "3", "chapter": "인권과 헌법", "intro": "조효제, 인권을 찾아서", "main": "UN, 세계인권선언", "deep": "존 스튜어트 밀, 자유론" },
  { "area": "사회", "grade": "중1", "no": "4", "chapter": "헌법과 국가기관", "intro": "유시민, 국가란 무엇인가", "main": "존 로크, 통치론", "deep": "홉스, 리바이어던" },
  { "area": "사회", "grade": "중2", "no": "5", "chapter": "인구 변화와 문제", "intro": "조영태, 정해진 미래", "main": "맬서스, 인구론", "deep": "골드스톤, 인구의 힘" },
  { "area": "사회", "grade": "중2", "no": "6", "chapter": "도시", "intro": "유현준, 도시는 무엇으로 사는가", "main": "제인 제이콥스, 미국 대도시의 죽음과 삶", "deep": "글레이저, 도시의 승리" },
  { "area": "사회", "grade": "중2", "no": "7", "chapter": "글로벌 경제 활동", "intro": "장하준, 나쁜 사마리아인들", "main": "아담 스미스, 국부론", "deep": "아리기, 장기 20세기" },
  { "area": "사회", "grade": "중2", "no": "8", "chapter": "시장 경제와 가격", "intro": "토드 부크홀츠, 죽은 경제학자의 살아있는 아이디어", "main": "아담 스미스, 국부론", "deep": "알프레드 마셜, 경제학의 원리" },
  { "area": "사회", "grade": "중2", "no": "9", "chapter": "국민 경제와 국제 거래", "intro": "장하준, 그들이 말하지 않는 23가지", "main": "부크홀츠, 경제학자의 아이디어", "deep": "케인즈, 일반이론" },
  { "area": "사회", "grade": "중2", "no": "10", "chapter": "국제 사회와 정치", "intro": "조지프 나이, 국제분쟁의 이해", "main": "헤로도토스, 역사", "deep": "아리스토텔레스, 정치학" },
  { "area": "사회", "grade": "중3", "no": "11", "chapter": "환경 문제", "intro": "최재천, 생태적 전환", "main": "레이첼 카슨, 침묵의 봄", "deep": "내쉬, 자연의 권리" },
  { "area": "사회", "grade": "중3", "no": "12", "chapter": "인구 변화 심화", "intro": "조영태, 정해진 미래", "main": "맬서스, 인구론", "deep": "토머스 맬서스, 인구론" },
  { "area": "사회", "grade": "중3", "no": "13", "chapter": "사회 변동과 문제", "intro": "지그문트 바우만, 왜 우리는 계속 가난한가", "main": "에밀 뒤르켐, 사회분업론", "deep": "막스 베버, 사회학의 기초" },
  { "area": "사회", "grade": "중3", "no": "14", "chapter": "정치 과정과 시민 참여", "intro": "한나 아렌트, 인간의 조건", "main": "헨리 데이비드 소로, 시민불복종", "deep": "간디, 나의 진리실험 이야기" },
  { "area": "사회", "grade": "중3", "no": "15", "chapter": "일상생활과 법", "intro": "김영란, 판결과 정의", "main": "베카리아, 범죄와 형벌", "deep": "다이시, 법의 지배" },
  { "area": "사회", "grade": "중3", "no": "16", "chapter": "사회 정의와 불평등", "intro": "마이클 샌델, 공정하다는 착각", "main": "마이클 샌델, 정의란 무엇인가", "deep": "존 롤스, 정의론" },
  { "area": "사회", "grade": "중3", "no": "17", "chapter": "문화의 이해와 창조", "intro": "유발 하라리, 사피엔스", "main": "에드워드 사이드, 오리엔탈리즘", "deep": "에드워드 사이드, 문화와 제국주의" },
  { "area": "사회", "grade": "고통사1", "no": "18", "chapter": "인간, 사회, 환경, 행복", "intro": "버트런드 러셀, 행복의 정복", "main": "아리스토텔레스, 니코마코스 윤리학", "deep": "버트런드 러셀, 행복의 정복" },
  { "area": "사회", "grade": "고통사1", "no": "19", "chapter": "자연환경과 인간", "intro": "헨리 데이비드 소로, 월든", "main": "레이첼 카슨, 침묵의 봄", "deep": "소로, 월든" },
  { "area": "사회", "grade": "고통사1", "no": "20", "chapter": "생활공간과 사회", "intro": "유현준, 도시는 무엇으로 사는가", "main": "제인 제이콥스, 대도시의 죽음과 삶", "deep": "제인 제이콥스, 미국 대도시의 죽음과 삶" },
  { "area": "사회", "grade": "고통사1", "no": "21", "chapter": "인권 보장과 헌법", "intro": "조효제, 인권을 찾아서", "main": "UN, 세계인권선언", "deep": "존 로크, 통치론" },
  { "area": "사회", "grade": "고통사1", "no": "22", "chapter": "사회 정의와 불평등", "intro": "마이클 샌델, 공정하다는 착각", "main": "마이클 샌델, 정의란 무엇인가", "deep": "존 롤스, 정의론" },
  { "area": "사회", "grade": "고통사2", "no": "23", "chapter": "문화와 다양성", "intro": "재레드 다이아몬드, 총 균 쇠", "main": "재레드 다이아몬드, 총, 균, 쇠", "deep": "마거릿 미드, 사모아의 청소년" },
  { "area": "사회", "grade": "고통사2", "no": "24", "chapter": "세계화와 평화", "intro": "토마스 프리드먼, 렉서스와 올리브나무", "main": "헤로도토스, 역사", "deep": "에드워드 기번, 로마제국 쇠망사" },
  { "area": "사회", "grade": "고통사2", "no": "25", "chapter": "미래와 지속 가능한 삶", "intro": "제러미 리프킨, 3차 산업혁명", "main": "맬서스, 인구론", "deep": "레이첼 카슨, 침묵의 봄" },
  { "area": "사회", "grade": "고통사2", "no": "26", "chapter": "시장경제와 금융", "intro": "마이클 샌델, 돈으로 살 수 없는 것들", "main": "아담 스미스, 국부론", "deep": "마이클 샌델, 돈으로 살 수 없는 것들" },
  { "area": "사회", "grade": "고통사2", "no": "27", "chapter": "과학기술과 정보사회", "intro": "유발 하라리, 21세기를 위한 21가지 제언", "main": "유발 하라리, 사피엔스", "deep": "루이스 멈퍼드, 기술과 문명" },
  { "area": "사회", "grade": "고정치", "no": "28", "chapter": "민주주의와 정치", "intro": "유시민, 국가란 무엇인가", "main": "존 로크, 통치론", "deep": "홉스, 리바이어던" },
  { "area": "사회", "grade": "고정치", "no": "29", "chapter": "헌법과 국가기관", "intro": "유시민, 국가란 무엇인가", "main": "UN, 세계인권선언", "deep": "몽테스키외, 법의 정신" },
  { "area": "사회", "grade": "고정치", "no": "30", "chapter": "정치과정과 참여", "intro": "한나 아렌트, 인간의 조건", "main": "아리스토텔레스, 정치학", "deep": "아리스토텔레스, 정치학" },
  { "area": "사회", "grade": "고정치", "no": "31", "chapter": "개인생활과 법", "intro": "", "main": "장 자크 루소, 사회계약론", "deep": "알렉시 드 토크빌, 미국의 민주주의" },
  { "area": "사회", "grade": "고정치", "no": "32", "chapter": "사회생활과 법", "intro": "", "main": "베카리아, 범죄와 형벌", "deep": "몽테스키외, 법의 정신" },
  { "area": "사회", "grade": "고정치", "no": "33", "chapter": "국제 관계와 한반도", "intro": "", "main": "투키디데스, 펠로폰네소스 전쟁사", "deep": "E.H. 카, 20년의 위기" },
  { "area": "사회", "grade": "고법사", "no": "34", "chapter": "개인 생활과 법", "intro": "", "main": "장 자크 루소, 사회계약론", "deep": "막스 베버, 경제와 사회" },
  { "area": "사회", "grade": "고법사", "no": "35", "chapter": "공동체 생활과 법", "intro": "", "main": "베카리아, 범죄와 형벌", "deep": "마이클 샌델, 정의란 무엇인가" },
  { "area": "사회", "grade": "고법사", "no": "36", "chapter": "사회 변화와 법", "intro": "", "main": "칼 마르크스, 자본론", "deep": "프리드리히 엥겔스, 영국 노동계급의 상황" },
  { "area": "사회", "grade": "고법사", "no": "37", "chapter": "국제 관계와 법", "intro": "", "main": "UN, 세계인권선언", "deep": "휴고 그로티우스, 전쟁과 평화의 법" },
  { "area": "사회", "grade": "고경제", "no": "38", "chapter": "경제생활과 선택", "intro": "토드 부크홀츠, 죽은 경제학자의 살아있는 아이디어", "main": "아담 스미스, 국부론", "deep": "라이오넬 로빈스, 경제학의 본질과 의의" },
  { "area": "사회", "grade": "고경제", "no": "39", "chapter": "시장과 자원 배분", "intro": "장하준, 장하준의 경제학 강의", "main": "아담 스미스, 국부론", "deep": "알프레드 마셜, 경제학 원리" },
  { "area": "사회", "grade": "고경제", "no": "40", "chapter": "국가와 경제 활동", "intro": "장하준, 그들이 말하지 않는 23가지", "main": "케인즈, 일반이론", "deep": "존 메이너드 케인즈, 고용·이자 및 화폐의 일반이론" },
  { "area": "사회", "grade": "고경제", "no": "41", "chapter": "세계 시장과 교역", "intro": "토마스 프리드먼, 세계는 평평하다", "main": "아담 스미스, 국부론", "deep": "프리드먼, 세계는 평평하다" },
  { "area": "사회", "grade": "고경제", "no": "42", "chapter": "경제생활과 금융", "intro": "토드 부크홀츠, 죽은 경제학자의 살아있는 아이디어", "main": "부크홀츠, 경제학자의 아이디어", "deep": "찰스 킨들버거, 광기 패닉 붕괴" },
  { "area": "사회", "grade": "고사문", "no": "43", "chapter": "사회·문화 현상의 탐구", "intro": "C. 라이트 밀스, 사회학적 상상력", "main": "막스 베버, 프로테스탄트 윤리", "deep": "막스 베버, 사회과학 방법론" },
  { "area": "사회", "grade": "고사문", "no": "44", "chapter": "개인과 사회 구조", "intro": "", "main": "에밀 뒤르켐, 사회분업론", "deep": "에밀 뒤르켐, 사회분업론" }
];

export default function SceneGeneratorEngine() {
  const GEMINI_API_KEY = "AQ.Ab8RN6JzbpV_y9aVsJdMTJoCzEJhP3CLMC0myUIuFFmKlfCK_Q";

  // UI 상태 관리
  const [view, setView] = useState('setup');
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState('');
  const [availableBooks, setAvailableBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

  // 국어, 영어, 수학 목표 및 난이도 선택 상태
  const [goals, setGoals] = useState({ kor: 0, eng: 0, math: 0 });
  const [levels, setLevels] = useState({ kor: 1, eng: 1, math: 1 });

  // 이야기 진행 상태
  const [currentTrack, setCurrentTrack] = useState('kor');
  const [storyLogs, setStoryLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 초기화 및 드롭다운 바인딩
  useEffect(() => {
    const uniqueAreas = Array.from(new Set(BOOKS_DATA.map(b => b.area)));
    setAreas(uniqueAreas);
    if (uniqueAreas.length > 0) {
      handleAreaChange(uniqueAreas[0]);
    }

    setGoals({
      kor: GOALS_DATA.kor[0] ? 0 : 0,
      eng: GOALS_DATA.eng[0] ? 0 : 0,
      math: GOALS_DATA.math[0] ? 0 : 0
    });
  }, []);

  const handleAreaChange = (area) => {
    setSelectedArea(area);
    const filteredChapters = BOOKS_DATA.filter(b => b.area === area);
    setChapters(filteredChapters);
    if (filteredChapters.length > 0) {
      handleChapterChange(filteredChapters[0].chapter, filteredChapters);
    }
  };

  const handleChapterChange = (chapterName, currentChapters = chapters) => {
    setSelectedChapter(chapterName);
    const bookInfo = currentChapters.find(b => b.chapter === chapterName);
    if (bookInfo) {
      const cards = [];
      if (bookInfo.intro) cards.push({ type: '입문', title: bookInfo.intro });
      if (bookInfo.main) cards.push({ type: '대표', title: bookInfo.main });
      if (bookInfo.deep) cards.push({ type: '심화', title: bookInfo.deep });
      setAvailableBooks(cards);
      setSelectedBook(cards[0] || null);
    } else {
      setAvailableBooks([]);
      setSelectedBook(null);
    }
  };

  // Google Cloud Gemini API 통신 함수
 const callGeminiAPI = async (prompt) => {
  // 타겟 URL 변경: 브라우저는 Nginx 서버로 요청을 전송하며, Nginx가 Google로 라우팅
const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 요청 실패 (HTTP ${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("통신 에러 발생:", error);
    throw error;
  }
};
  const startScene = async () => {
    setErrorMsg('');
    if (!selectedBook) {
      setErrorMsg('세계관의 기반이 될 책을 선택해주세요.');
      return;
    }

    setView('stage');
    setLoading(true);
    setStoryLogs([]);
    setCurrentTrack('kor');

    const korGoal = GOALS_DATA.kor[goals.kor];

    const initialPrompt = `
      너는 교육용 인터랙티브 스토리텔링 엔진이다.
      기반 세계관 도서: "${selectedBook.title}" (${selectedBook.type} 과정)
      교과 단원: [${selectedArea}] ${selectedChapter}
      
      첫 번째 트랙인 [국어] 단계를 시작해라.
      국어 목표: ${korGoal.title} (${korGoal.content}) - 난이도 레벨 ${levels.kor}
      
      이 세계관 안에서 사건의 발단을 제시하고, 학습자가 국어 지식을 활용하여 해결해야 하는 상황을 3지선다형 선택지와 함께 생성해라.
      출력 형식은 반드시 아래 형식을 엄밀하게 유지해라. JSON 포맷이 아닌 텍스트로 줄 것:
      
      [스토리] 여기에 흥미진진한 이야기 서술...
      [선택지1] 오답 선택지 1
      [선택지2] 정답 선택지 (해결로 직행하는 논리적 정답)
      [선택지3] 오답 선택지 2
      [정답번호] 2
    `;

    try {
      const text = await callGeminiAPI(initialPrompt);
      parseAndAppendLog(text, 'kor');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = async (choiceIdx, correctIdx) => {
    // 사용자가 고른 답안 인덱스를 이전 상태 로그에 업데이트하여 바인딩 유지
    setStoryLogs(prev => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1].selectedChoice = choiceIdx;
      }
      return updated;
    });

    setLoading(true);
    setErrorMsg('');

    const isCorrect = choiceIdx === correctIdx;
    let nextTrackName = '';
    let nextPrompt = '';

    const engGoal = GOALS_DATA.eng[goals.eng];
    const mathGoal = GOALS_DATA.math[goals.math];

    if (currentTrack === 'kor') {
      nextTrackName = 'eng';
      setCurrentTrack('eng');
      nextPrompt = `
        이전 [국어] 선택에서 학습자는 ${isCorrect ? '정답' : '오답'}을 골랐다. 이에 따른 유기적인 결과 스토리를 이어가라.
        이어서 두 번째 트랙인 [영어] 단계를 진행해라.
        영어 목표: ${engGoal.title} (${engGoal.content}) - 난이도 레벨 ${levels.eng}
        
        스토리를 심화시키고 영어 개념과 결합된 위기 상황을 제시하여 3지선다형 선택지와 정답 번호를 생성해라.
        형식은 이전과 동일하게 [스토리], [선택지1], [선택지2], [선택지3], [정답번호] 태그를 붙여라.
      `;
    } else if (currentTrack === 'eng') {
      nextTrackName = 'math';
      setCurrentTrack('math');
      nextPrompt = `
        이전 [영어] 선택에서 학습자는 ${isCorrect ? '정답' : '오답'}을 골랐다. 이에 따른 유기적인 결과 스토리를 이어가라.
        이어서 세 번째 트랙인 [수학] 단계를 진행해라.
        수학 목표: ${mathGoal.title} (${mathGoal.trend || ''}) - 난이도 레벨 ${levels.math}
        
        스토리를 절정으로 이끌고 수학 개념과 결합된 최종 수수께끼나 계산 상황을 제시하여 3지선다형 선택지와 정답 번호를 생성해라.
        형식은 이전과 동일하게 [스토리], [선택지1], [선택지2], [선택지3], [정답번호] 태그를 붙여라.
      `;
    } else {
      nextTrackName = 'end';
      setCurrentTrack('end');
      nextPrompt = `
        이전 [수학] 선택에서 학습자는 ${isCorrect ? '정답' : '오답'}을 골랐다.
        모든 융합 트랙이 종료되었으므로, 이 세계관과 네 가지 트랙(단원 개념, 국어, 영어, 수학)이 멋지게 마무리되는 최종 결말 스토리와 에필로그를 작성해라.
        결말이므로 선택지는 필요 없다. [스토리] 태그만 사용해라.
      `;
    }

    try {
      const text = await callGeminiAPI(nextPrompt);
      parseAndAppendLog(text, nextTrackName);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseAndAppendLog = (text, track) => {
    const lines = text.split('\n');
    let story = '';
    let choices = [];
    let correctIdx = 1;

    lines.forEach(line => {
      if (line.startsWith('[스토리]')) {
        story = line.replace('[스토리]', '').trim();
      } else if (line.startsWith('[선택지1]')) {
        choices.push(line.replace('[선택지1]', '').trim());
      } else if (line.startsWith('[선택지2]')) {
        choices.push(line.replace('[선택지2]', '').trim());
      } else if (line.startsWith('[선택지3]')) {
        choices.push(line.replace('[선택지3]', '').trim());
      } else if (line.startsWith('[정답번호]')) {
        correctIdx = parseInt(line.replace('[정답번호]', '').trim(), 10);
      }
    });

    setStoryLogs(prev => [...prev, { track, story, choices, correctIdx, selectedChoice: null }]);
  };

  return (
    <div className="wrap">
      {view === 'setup' && (
        <div id="setup">
          <h1>장면 생성 엔진 프로토타입</h1>
          <p className="sub">교과 챕터를 고르면 그 챕터의 핵심 개념을 뿌리로 한 세계관이 자동 구성됩니다. 국영수 목표 3개를 더하면, 하나의 사건 속에서 네 트랙이 얽히는 장면이 생성됩니다.</p>

          <label>영역</label>
          <select value={selectedArea} onChange={(e) => handleAreaChange(e.target.value)}>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <label>학습 챕터 (교과 단원)</label>
          <select value={selectedChapter} onChange={(e) => handleChapterChange(e.target.value)}>
            {chapters.map((c, idx) => <option key={idx} value={c.chapter}>{c.chapter}</option>)}
          </select>

          <label>세계관의 기반이 될 책 (하나 선택)</label>
          <div className="book-cards">
            {availableBooks.map((b, idx) => (
              <button
                key={idx}
                type="button"
                className={`book-card ${selectedBook?.title === b.title ? 'selected' : ''}`}
                onClick={() => setSelectedBook(b)}
              >
                <span className="tier">{b.type}</span>
                <span className="book-title">{b.title}</span>
              </button>
            ))}
          </div>

          {/* 국어 목표선택 행 */}
          <div className="goal-row" style={{ marginTop: '20px' }}>
            <div className="goal-tag tag-kor">국어</div>
            <div>
              <select value={goals.kor} onChange={(e) => setGoals({ ...goals, kor: parseInt(e.target.value, 10) })}>
                {GOALS_DATA.kor.map((g, idx) => <option key={idx} value={idx}>{g.title}</option>)}
              </select>
              <div className="goal-detail">{GOALS_DATA.kor[goals.kor]?.content}</div>
              <div className="level-row">
                <span>난이도</span>
                <div className="level-btns">
                  {[1, 2, 3].map(v => (
                    <button
                      key={v}
                      type="button"
                      className={`level-btn ${levels.kor === v ? 'selected' : ''}`}
                      onClick={() => setLevels({ ...levels, kor: v })}
                    >{v}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 영어 목표선택 행 */}
          <div className="goal-row">
            <div className="goal-tag tag-eng">영어</div>
            <div>
              <select value={goals.eng} onChange={(e) => setGoals({ ...goals, eng: parseInt(e.target.value, 10) })}>
                {GOALS_DATA.eng.map((g, idx) => <option key={idx} value={idx}>{g.title}</option>)}
              </select>
              <div className="goal-detail">{GOALS_DATA.eng[goals.eng]?.content}</div>
              <div className="level-row">
                <span>난이도</span>
                <div className="level-btns">
                  {[1, 2, 3].map(v => (
                    <button
                      key={v}
                      type="button"
                      className={`level-btn ${levels.eng === v ? 'selected' : ''}`}
                      onClick={() => setLevels({ ...levels, eng: v })}
                    >{v}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 수학 목표선택 행 */}
          <div className="goal-row">
            <div className="goal-tag tag-math">수학</div>
            <div>
              <select value={goals.math} onChange={(e) => setGoals({ ...goals, math: parseInt(e.target.value, 10) })}>
                {GOALS_DATA.math.map((g, idx) => <option key={idx} value={idx}>{g.title}</option>)}
              </select>
              <div className="goal-detail">{GOALS_DATA.math[goals.math]?.trend}</div>
              <div className="level-row">
                <span>난이도</span>
                <div className="level-btns">
                  {[1, 2, 3].map(v => (
                    <button
                      key={v}
                      type="button"
                      className={`level-btn ${levels.math === v ? 'selected' : ''}`}
                      onClick={() => setLevels({ ...levels, math: v })}
                    >{v}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button className="primary" onClick={startScene} disabled={loading}>장면 시작</button>
          {errorMsg && <div className="err">{errorMsg}</div>}
        </div>
      )}

      {view === 'stage' && (
        <div id="stage" style={{ display: 'block' }}>
          <h1>장면 진행 중</h1>
          <div className="progress">
            <div className={`pill ${currentTrack === 'kor' ? 'active' : 'done'}`}>국어</div>
            <div className={`pill ${currentTrack === 'eng' ? 'active' : currentTrack === 'math' || currentTrack === 'end' ? 'done' : ''}`}>영어</div>
            <div className={`pill ${currentTrack === 'math' ? 'active' : currentTrack === 'end' ? 'done' : ''}`}>수학</div>
          </div>

          <div id="storyLog">
            {storyLogs.map((log, logIdx) => (
              <div key={logIdx} className="story-card">
                <div className="debug-strip"><b>트랙:</b> {log.track.toUpperCase()}</div>
                <p>{log.story}</p>
                {log.choices.length > 0 && (
                  <div className="choices">
                    {log.choices.map((choice, cIdx) => {
                      const choiceNum = cIdx + 1;
                      // 사용자가 이미 선택한 버튼이거나, 이 카드가 가장 마지막 카드가 아닐 때 비활성화 처리
                      const isSelected = log.selectedChoice === choiceNum;
                      const hasSelectedAny = log.selectedChoice !== null;

                      return (
                        <button
                          key={cIdx}
                          className={`choice-btn ${isSelected ? 'selected-answer' : ''}`}
                          disabled={hasSelectedAny}
                          onClick={() => handleChoice(choiceNum, log.correctIdx)}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                )}
                {log.track === 'end' && <div className="scene-end">모든 시나리오가 성공적으로 종료되었습니다.</div>}
              </div>
            ))}
          </div>

          {loading && <div className="loading">이야기를 쓰는 중...</div>}
          {errorMsg && <div className="err">{errorMsg}</div>}
        </div>
      )}
    </div>
  );
}