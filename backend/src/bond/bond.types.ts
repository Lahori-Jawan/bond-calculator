export type CouponFrequency = "annual" | "semi-annual";

export interface CashFlowRow {
  period: number;
  paymentDate: string;
  couponPayment: number;
  cumulativeInterest: number;
  remainingPrincipal: number;
}

export interface BondCalculationResponse {
  currentYieldPct: number;
  ytmPct: number;
  totalInterest: number;
  premiumDiscount: "premium" | "discount" | "par";
  couponPayment: number;
  annualCouponAmount: number;
  totalPeriods: number;
  cashFlows: CashFlowRow[];
}
