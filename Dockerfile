FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM nginx:alpine

RUN apk add --no-cache nodejs

COPY --from=builder /app/dist /usr/share/nginx/html

COPY api-partner-apply.js /app/api-partner-apply.js

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["sh", "-c", "node /app/api-partner-apply.js & exec nginx -g 'daemon off;'"]