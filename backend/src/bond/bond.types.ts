export type CouponFrequency = "annual" | "semi-annual";

export interface BondInput {
  faceValue: number;
  annualCouponRate: number;
  marketPrice: number;
  yearsToMaturity: number;
  couponFrequency: CouponFrequency;
}

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
