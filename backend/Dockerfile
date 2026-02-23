FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY tsconfig.base.json ./
COPY backend/tsconfig.json backend/tsconfig.json
COPY backend/tsconfig.build.json backend/tsconfig.build.json

RUN npm ci --workspace backend

COPY backend/src backend/src
RUN npm run build -w backend

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
RUN npm ci --omit=dev --workspace backend && npm cache clean --force

COPY --from=build /app/backend/dist backend/dist

EXPOSE 3000
CMD ["npm", "run", "start", "-w", "backend"]
