FROM node:18-alpine AS builder

WORKDIR /app

RUN apk add git

RUN git clone --branch stable https://github.com/Aryan-verma-star/nexus-chat-full.git . && \
    npm install --legacy-peer-deps && \
    npm run build --legacy-peer-deps

FROM nginx:alpine

RUN apk add --no-cache bash curl

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

RUN envsubst '${HF_TOKEN}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

EXPOSE 7860

CMD ["nginx", "-g", "daemon off;"]
