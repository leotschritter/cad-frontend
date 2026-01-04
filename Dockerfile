# ===== build stage =====
# Satisfies "node": "^20.19.0  >=22.12.0"
FROM node:22-alpine AS build
WORKDIR /app

# Install OS deps only if your openapi generator needs Java (most recent @openapitools CLI bundles it, so usually not needed)
# RUN apk add --no-cache openjdk17-jre

# Install deps with good caching
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund;

# Copy the rest (includes backend.openapi.yaml so api:gen can run)
COPY . .

# Accept VITE_API_BASE_URL as build arg and set it as env var for Vite
ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

ARG VITE_API_WEATHER_BASE_URL=http://localhost:8081
ENV VITE_API_WEATHER_BASE_URL=${VITE_API_WEATHER_BASE_URL}

ARG VITE_API_TRAVEL_WARNINGS_BASE_URL=http://localhost:8082
ENV VITE_API_TRAVEL_WARNINGS_BASE_URL=${VITE_API_TRAVEL_WARNINGS_BASE_URL}

ARG VITE_API_RECOMMENDATIONS_BASE_URL=http://localhost:8082
ENV VITE_API_RECOMMENDATIONS_BASE_URL=${VITE_API_RECOMMENDATIONS_BASE_URL}

ARG VITE_API_COMMENTS_LIKES_BASE_URL=http://localhost:8084
ENV VITE_API_COMMENTS_LIKES_BASE_URL=${VITE_API_COMMENTS_LIKES_BASE_URL}

ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID

# Feature flags as build arguments
ARG VITE_FEATURE_WEATHER=true
ARG VITE_FEATURE_RECOMMENDATIONS=true
ARG VITE_FEATURE_TRAVEL_WARNINGS=true

ENV VITE_FEATURE_WEATHER=$VITE_FEATURE_WEATHER
ENV VITE_FEATURE_RECOMMENDATIONS=$VITE_FEATURE_RECOMMENDATIONS
ENV VITE_FEATURE_TRAVEL_WARNINGS=$VITE_FEATURE_TRAVEL_WARNINGS

# Type-check + build (your "build" calls type-check + vite build)
ARG VITE_BASE=/
ENV BASE_URL=${VITE_BASE}
RUN npm run build-only

# ===== runtime stage (static) =====
FROM nginx:1.27-alpine
# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

# Create nginx config that uses PORT env var (defaults to 8080)
RUN printf 'server { \
  listen $PORT; \
  server_name _; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { try_files $uri $uri/ /index.html; } \
}\n' > /etc/nginx/conf.d/default.conf.template

# Use envsubst to replace $PORT at runtime, then start nginx
CMD /bin/sh -c "envsubst '\
  \$PORT \
  \$VITE_FIREBASE_API_KEY \
  \$VITE_FIREBASE_AUTH_DOMAIN \
  \$VITE_FIREBASE_PROJECT_ID \
  \$VITE_API_BASE_URL \
  \$VITE_API_WEATHER_BASE_URL \
  \$VITE_API_TRAVEL_WARNINGS_BASE_URL \
  \$VITE_API_COMMENTS_LIKES_BASE_URL \
' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf \
&& nginx -g 'daemon off;'"