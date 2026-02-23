FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY tsconfig.base.json ./
COPY frontend/tsconfig.json frontend/tsconfig.json
COPY frontend/tsconfig.app.json frontend/tsconfig.app.json
COPY frontend/tsconfig.node.json frontend/tsconfig.node.json
COPY frontend/vite.config.ts frontend/vite.config.ts
COPY frontend/index.html frontend/index.html
COPY frontend/src frontend/src

RUN npm ci --workspace frontend
RUN npm run build -w frontend

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g serve@14.2.4

COPY --from=build /app/frontend/dist /app/dist

EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]
