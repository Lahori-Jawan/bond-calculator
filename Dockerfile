# ──────────────────────────────────────────────
# Stage 1: Build the frontend (React + Vite)
# ──────────────────────────────────────────────
FROM node:22-alpine AS frontend-build

WORKDIR /app

# Copy workspace root files needed for npm install
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY frontend/package.json frontend/
COPY backend/package.json backend/

RUN npm ci --workspace=frontend

COPY frontend/ frontend/

# Frontend will call /api on the same origin
ENV VITE_API_BASE_URL=/api
RUN npm run build -w frontend

# ──────────────────────────────────────────────
# Stage 2: Build the backend (NestJS)
# ──────────────────────────────────────────────
FROM node:22-alpine AS backend-build

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

RUN npm ci --workspace=backend

COPY backend/ backend/

RUN npm run build -w backend

# ──────────────────────────────────────────────
# Stage 3: Production image
# ──────────────────────────────────────────────
FROM node:22-alpine

RUN apk add --no-cache nginx supervisor

WORKDIR /app

# Install production-only backend dependencies
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

RUN npm ci --workspace=backend --omit=dev

# Copy compiled backend
COPY --from=backend-build /app/backend/dist backend/dist

# Copy built frontend into Nginx's serve directory
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# Copy Nginx and Supervisor configs
COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY deploy/supervisord.conf /etc/supervisord.conf

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 8080

CMD ["supervisord", "-c", "/etc/supervisord.conf"]
