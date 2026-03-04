FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite env vars are baked into the build bundle at build time.
# Railway passes these as build arguments (set them in the Railway service settings).
ARG VITE_API_BASE_URL
ARG VITE_BACKEND_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}

RUN npm run build

FROM nginx:1.27.4-alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
# Use nginx's built-in template mechanism: 20-envsubst-on-templates.sh
# automatically runs envsubst on /etc/nginx/templates/*.template → /etc/nginx/conf.d/
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
