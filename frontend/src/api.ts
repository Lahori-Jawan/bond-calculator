import { BondCalculationResponse, BondInputRequest } from "./types";

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

interface ApiError {
  message?: string | string[];
  errors?: string[];
}

export async function calculateBond(
  payload: BondInputRequest
): Promise<BondCalculationResponse> {
  const response = await fetch(`${apiBase}/bond/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as ApiError;
    const detail =
      errorBody.errors?.[0] ??
      (Array.isArray(errorBody.message)
        ? errorBody.message[0]
        : errorBody.message) ??
      "Calculation failed.";
    throw new Error(detail);
  }

  return (await response.json()) as BondCalculationResponse;
}
