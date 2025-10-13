# ===== build stage =====
# Satisfies "node": "^20.19.0 || >=22.12.0"
FROM node:22-alpine AS build
WORKDIR /app

# Install OS deps only if your openapi generator needs Java (most recent @openapitools CLI bundles it, so usually not needed)
# RUN apk add --no-cache openjdk17-jre

# Install deps with good caching
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund;

# Copy the rest (includes openapi.yaml so api:gen can run)
COPY . .

# Type-check + build (your "build" calls type-check + vite build)
ARG VITE_BASE=/
ENV BASE_URL=${VITE_BASE}
RUN npm run build-only

# ===== runtime stage (static) =====
FROM nginx:1.27-alpine
# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

# Minimal nginx for SPA (history mode) - Changed to port 5173
RUN printf 'server { \
  listen 5173; \
  server_name _; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { try_files $uri $uri/ /index.html; } \
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
