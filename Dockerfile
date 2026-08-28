FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


FROM nginx:alpine

# 문자 API 실행용 Node 추가
RUN apk add --no-cache nodejs

# Vite 빌드 결과
COPY --from=builder /app/dist /usr/share/nginx/html

# 문자 API JS
COPY api-partner-apply.js /app/api-partner-apply.js

# nginx 설정
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

# Node API + nginx 동시 실행
CMD ["sh", "-c", "node /app/api-partner-apply.js & nginx -g 'daemon off;'"]