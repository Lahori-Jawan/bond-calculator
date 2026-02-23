# Bond Yield Calculator

Minimal full-stack implementation for the interview brief:
- Frontend: React + TypeScript (Vite)
- Backend: NestJS + TypeScript
- Business logic: server-side only

## Features

- Inputs:
  - Face value
  - Annual coupon rate (%)
  - Market price
  - Years to maturity
  - Coupon frequency (annual / semi-annual)
- Outputs:
  - Current yield
  - Yield to maturity (YTM, nominal annualized)
  - Total interest over bond life
  - Premium / discount / par indicator
- Cash flow schedule table:
  - period
  - payment date
  - coupon payment
  - cumulative interest
  - remaining principal

## Security and DRY choices

- Server-side calculations only (`backend/src/bond/bond.service.ts`)
- Strict runtime input validation with Zod (`backend/src/bond/bond.schema.ts`)
- Rate limiting for calculation endpoint (`backend/src/common/rate-limit.middleware.ts`)
- Safe error responses without internal leakage (`backend/src/common/safe-http-exception.filter.ts`)
- Thin frontend: no duplicated financial formulas, only form + rendering

## Run

1. Install dependencies from repo root:

```bash
npm install
```

2. Start backend:

```bash
npm run dev:backend
```

3. Start frontend in a second terminal:

```bash
npm run dev:frontend
```

4. Open:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000/api/bond/calculate` (POST)

## Run With Docker Compose

From repo root:

```bash
docker compose up --build
```

Then open:
- Frontend: `http://localhost:5173`
- Backend API (through HAProxy): `http://localhost:5173/api/bond/calculate`

To stop:

```bash
docker compose down
```

If `5173` is already in use, override host port:

```bash
FRONTEND_PORT=5174 docker compose up --build
```

## Environment

- Backend example: `backend/.env.example`
- Frontend example: `frontend/.env.example`
