# Bond Yield Calculator — Code Audit

## HIGH Priority

### 1. Rate Limiter Memory Leak
**File:** `backend/src/common/rate-limit.middleware.ts:18`

The `Map<string, Bucket>` grows indefinitely. Expired buckets are never cleaned up. In a long-running process, every unique IP adds an entry that stays forever, eventually causing an out-of-memory crash.

**Fix:** Add periodic cleanup via `setInterval`, or prune stale entries on each request when the map exceeds a size threshold.

---

### 2. YTM Silent Fallback to 0
**File:** `backend/src/bond/bond.service.ts:69-71`

When the binary search cannot bracket a root, it silently returns `0`. The user sees a `0%` YTM with no indication that the calculation failed. This can occur with extreme inputs such as a zero-coupon bond priced above face value.

```typescript
if (lowValue * highValue > 0) {
  return 0; // Silent failure
}
```

**Fix:** Throw a descriptive error or return a flag indicating convergence failure so the caller can surface a warning.

---

### 3. Payment Dates Drift with `setUTCMonth`
**File:** `backend/src/bond/bond.service.ts:137-141`

JavaScript's `Date.setUTCMonth` does not clamp to end-of-month — it overflows. For example, starting from January 31 and adding 1 month produces March 2-3 instead of February 28. Over many periods, payment dates drift incorrectly.

```typescript
function addMonthsUtc(date: Date, months: number): Date {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}
```

**Fix:** Clamp the resulting day to the last day of the target month, or anchor the start date to the 1st of the month.

---

## MEDIUM Priority

### 4. Duplicated Types Between Frontend and Backend
**Files:** `frontend/src/types.ts` and `backend/src/bond/bond.types.ts`

The same interfaces are defined independently in both projects. If one side changes (e.g., renaming a field), the other silently goes out of sync, causing runtime errors with no compile-time warning.

**Fix:** Create a shared `packages/types` workspace in the monorepo, or export inferred types from the backend Zod schema and consume them in the frontend.

---

### 5. No Tests

There are no unit tests, integration tests, or e2e tests anywhere in the project. The core bond math in `BondService.calculate()` is the highest-value target for testing — verifiable against known financial examples.

**Fix:** Add at minimum unit tests for the service layer covering current yield, YTM, cash flow generation, and edge cases (zero coupon, par pricing).

---

### 6. Non-Deterministic Cash Flow Dates
**File:** `backend/src/bond/bond.service.ts:102`

```typescript
const start = new Date();
```

Using the current time as the start date means identical inputs produce different cash flow schedules depending on when the API is called. This makes the endpoint non-reproducible and difficult to test without mocking the clock.

**Fix:** Accept an optional `settlementDate` input, or default to a stable value such as the start of the current month.

---

### 7. Missing `type="number"` on Form Inputs
**File:** `frontend/src/App.tsx:170-171`

The `Field` component uses `inputMode="decimal"` but no `type="number"`. On desktop browsers this means no native spin controls and no built-in constraint validation. Server-side validation catches invalid input, but the UX suffers from delayed feedback.

**Fix:** Add `type="number"` and `step="any"` to the input element.

---

### 8. Unsafe Type Assertion for Coupon Frequency
**File:** `frontend/src/App.tsx:101`

```typescript
couponFrequency: event.target.value as CouponFrequency
```

This bypasses type safety. If the DOM value is unexpected (e.g., modified by a browser extension), an invalid value is sent to the API without any client-side check.

**Fix:** Validate against the known set of allowed values before assigning, or parse with a Zod schema on the client side.

---

## LOW Priority

### 9. Unchecked Error Body in API Client
**File:** `frontend/src/api.ts:20`

```typescript
const errorBody = (await response.json().catch(() => ({}))) as ApiError;
```

The `as ApiError` assertion is unchecked. If the server returns unexpected content (e.g., an HTML error page from a reverse proxy), the cast silently succeeds with undefined fields.

**Fix:** Use optional chaining defensively or validate the error shape before accessing properties.

---

### 10. Unnecessary `OPTIONS` in CORS Config
**File:** `backend/src/main.ts:25`

```typescript
methods: ["POST", "OPTIONS"]
```

`OPTIONS` is handled automatically by CORS preflight and does not need to be listed. Additionally, omitting `GET` blocks future health-check endpoints.

**Fix:** Remove `OPTIONS` from the list. Add `GET` if a health-check route is planned.

---

### 11. Unused `React` Import
**File:** `frontend/src/main.tsx:1`

```typescript
import React from "react";
```

With the `react-jsx` transform configured in tsconfig, this import is unnecessary dead code.

**Fix:** Remove the import.

---

### 12. Hardcoded USD Currency
**File:** `frontend/src/App.tsx:194`

`formatCurrency` is hardcoded to `USD`. If the bond is denominated in another currency, the display is misleading.

**Fix:** Accept currency as a parameter, or add a visible label clarifying that all values are in USD.
