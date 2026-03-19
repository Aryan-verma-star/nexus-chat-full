FROM node:18-alpine AS builder

WORKDIR /app

RUN apk add git

RUN git clone https://github.com/Aryan-verma-star/nexus-chat-full.git . && \
    npm install --legacy-peer-deps && \
    npm run build --legacy-peer-deps

FROM nginx:alpine

RUN apk add --no-cache bash curl

COPY --from=builder /app/dist /usr/share/nginx/html

RUN echo 'server { \
    listen 7860; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass https://nexus-chat-app-nexus-chat.hf.space/api/; \
        proxy_set_header Host nexus-chat-app-nexus-chat.hf.space; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        proxy_set_header Authorization $http_authorization; \
        proxy_pass_header Authorization; \
    } \
    gzip on; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript; \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 7860

CMD ["nginx", "-g", "daemon off;"]
