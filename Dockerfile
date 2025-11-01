# ===== build stage =====
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

COPY . .

ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

ARG VITE_BASE=/
ENV BASE_URL=${VITE_BASE}
RUN npm run build-only

# ===== runtime stage =====
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html

RUN echo 'server { \
  listen $PORT; \
  server_name _; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { try_files $$uri $$uri/ /index.html; } \
}' > /etc/nginx/conf.d/default.conf.template

EXPOSE 8080

CMD ["/bin/sh", "-c", "envsubst '$$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
