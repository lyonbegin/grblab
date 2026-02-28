# AI 위험성평가 (KRAS AI)

Vite + React + Ant Design으로 구축된 AI 기반 위험성평가 웹앱입니다.

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속

## 빌드 & Fly.io 배포

```bash
npm run build
# dist/ 폴더가 생성됨
```

Fly.io 배포 시 아래 Dockerfile 사용 권장:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

```bash
fly launch
fly deploy
```

## 환경 설정

Claude API 키는 앱 안에서 직접 입력하거나 `.env` 파일에 설정:

```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

API 키 없이도 **데모 모드**로 동작합니다.

## 화면 구성

| 화면 | 설명 |
|------|------|
| `/` | 입력 화면 (Google Lens 스타일) |
| `/result` | 결과 화면 (KRAS 5가지 방식) |

## 기술 스택

- **Vite** + **React 18**
- **Ant Design 5** (UI 컴포넌트)
- **Framer Motion** (스와이프 애니메이션)
- **Claude API** (이미지 분석)
- **html2canvas + jsPDF** (PDF 출력)
