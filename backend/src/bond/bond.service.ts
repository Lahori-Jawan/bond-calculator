import { Injectable } from "@nestjs/common";
import { BondCalculationResponse, BondInput, CashFlowRow } from "./bond.types";

@Injectable()
export class BondService {
  calculate(input: BondInput): BondCalculationResponse {
    const frequency = input.couponFrequency === "annual" ? 1 : 2;
    const totalPeriods = input.yearsToMaturity * frequency;
    const couponRate = input.annualCouponRate / 100;

    const couponPayment = input.faceValue * (couponRate / frequency);
    const annualCouponAmount = couponPayment * frequency;
    const currentYieldPct = (annualCouponAmount / input.marketPrice) * 100;
    const totalInterest = couponPayment * totalPeriods;

    const ytmPerPeriod = this.solveYtmPerPeriod({
      faceValue: input.faceValue,
      marketPrice: input.marketPrice,
      couponPayment,
      periods: totalPeriods
    });
    const ytmPct = ytmPerPeriod * frequency * 100;

    return {
      currentYieldPct: round(currentYieldPct, 6),
      ytmPct: round(ytmPct, 6),
      totalInterest: round(totalInterest, 2),
      premiumDiscount: premiumDiscount(input.marketPrice, input.faceValue),
      couponPayment: round(couponPayment, 2),
      annualCouponAmount: round(annualCouponAmount, 2),
      totalPeriods,
      cashFlows: this.buildCashFlows({
        totalPeriods,
        couponPayment,
        faceValue: input.faceValue,
        monthsPerPeriod: 12 / frequency
      })
    };
  }

  private solveYtmPerPeriod(params: {
    faceValue: number;
    marketPrice: number;
    couponPayment: number;
    periods: number;
  }): number {
    const { faceValue, marketPrice, couponPayment, periods } = params;

    const priceAtYield = (periodYield: number) => {
      let pv = 0;
      for (let period = 1; period <= periods; period += 1) {
        pv += couponPayment / (1 + periodYield) ** period;
      }
      return pv + faceValue / (1 + periodYield) ** periods;
    };

    let low = -0.9999;
    let high = 1;
    let lowValue = priceAtYield(low) - marketPrice;
    let highValue = priceAtYield(high) - marketPrice;

    // Expand search range for extreme pricing/yield cases.
    while (lowValue * highValue > 0 && high < 128) {
      high *= 2;
      highValue = priceAtYield(high) - marketPrice;
    }

    if (lowValue * highValue > 0) {
      return 0;
    }

    for (let i = 0; i < 200; i += 1) {
      const mid = (low + high) / 2;
      const midValue = priceAtYield(mid) - marketPrice;

      if (Math.abs(midValue) < 1e-10) {
        return mid;
      }

      if (lowValue * midValue <= 0) {
        high = mid;
        highValue = midValue;
      } else {
        low = mid;
        lowValue = midValue;
      }
    }

    return (low + high) / 2;
  }

  private buildCashFlows(params: {
    totalPeriods: number;
    couponPayment: number;
    faceValue: number;
    monthsPerPeriod: number;
  }): CashFlowRow[] {
    const { totalPeriods, couponPayment, faceValue, monthsPerPeriod } = params;
    const rows: CashFlowRow[] = [];
    let cumulativeInterest = 0;
    const start = new Date();

    for (let period = 1; period <= totalPeriods; period += 1) {
      cumulativeInterest += couponPayment;
      const paymentDate = addMonthsUtc(start, monthsPerPeriod * period);

      rows.push({
        period,
        paymentDate: paymentDate.toISOString().slice(0, 10),
        couponPayment: round(couponPayment, 2),
        cumulativeInterest: round(cumulativeInterest, 2),
        remainingPrincipal: period === totalPeriods ? 0 : round(faceValue, 2)
      });
    }

    return rows;
  }
}

function premiumDiscount(marketPrice: number, faceValue: number): "premium" | "discount" | "par" {
  const epsilon = 1e-8;
  if (marketPrice > faceValue + epsilon) {
    return "premium";
  }
  if (marketPrice < faceValue - epsilon) {
    return "discount";
  }
  return "par";
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function addMonthsUtc(date: Date, months: number): Date {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}
