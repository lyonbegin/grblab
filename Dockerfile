FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM nginx:alpine

# 최종 nginx 컨테이너에서도 Node 서버를 실행할 수 있게 설치
RUN apk add --no-cache nodejs

# Vite 빌드 결과
COPY --from=builder /app/dist /usr/share/nginx/html

# 병원동행 API 서버
COPY api-partner-apply.js /app/api-partner-apply.js

# nginx 설정
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

# Node API(3001) + nginx(8080) 함께 실행
CMD ["sh", "-c", "node /app/api-partner-apply.js & exec nginx -g 'daemon off;'"]