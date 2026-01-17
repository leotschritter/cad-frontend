# ===== build stage =====
FROM node:22-alpine AS build
WORKDIR /app

# Install deps with good caching
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund;

# Copy the rest
COPY . .

# Build-time configuration - Firebase config (shared across all tiers)
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID

# Build-time configuration - API Gateway URLs
# These are baked in at build time. Pass the correct URLs for your tier.
ARG VITE_API_BASE_URL=http://localhost:8080
ARG VITE_API_WEATHER_BASE_URL=http://localhost:8081
ARG VITE_API_TRAVEL_WARNINGS_BASE_URL=http://localhost:8082
ARG VITE_API_RECOMMENDATIONS_BASE_URL=http://localhost:8083
ARG VITE_API_COMMENTS_LIKES_BASE_URL=http://localhost:8084

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_WEATHER_BASE_URL=${VITE_API_WEATHER_BASE_URL}
ENV VITE_API_TRAVEL_WARNINGS_BASE_URL=${VITE_API_TRAVEL_WARNINGS_BASE_URL}
ENV VITE_API_RECOMMENDATIONS_BASE_URL=${VITE_API_RECOMMENDATIONS_BASE_URL}
ENV VITE_API_COMMENTS_LIKES_BASE_URL=${VITE_API_COMMENTS_LIKES_BASE_URL}

# NOTE: VITE_FIREBASE_TENANT_ID is NOT set at build time!
# It is injected at runtime via runtime-config.js for multi-tenancy support.
# This allows the same image to be deployed to different tenants.

# Build the app
RUN npm run build-only

# ===== runtime stage =====
FROM nginx:1.27-alpine

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

# Save the runtime-config.js template for envsubst
RUN mv /usr/share/nginx/html/runtime-config.js /usr/share/nginx/html/runtime-config.js.template

# Create nginx config template
RUN printf 'server { \
  listen $PORT; \
  server_name _; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { try_files $uri $uri/ /index.html; } \
}\n' > /etc/nginx/conf.d/default.conf.template

# Default values for runtime config
ENV PORT=8080
ENV VITE_FIREBASE_TENANT_ID=""
ENV VITE_API_BASE_URL=""

# Entrypoint: substitute env vars in templates, then start nginx
CMD /bin/sh -c "\
  envsubst '\$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && \
  envsubst '\$VITE_FIREBASE_TENANT_ID \$VITE_API_BASE_URL' < /usr/share/nginx/html/runtime-config.js.template > /usr/share/nginx/html/runtime-config.js && \
  nginx -g 'daemon off;'"