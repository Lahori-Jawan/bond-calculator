import { z } from "zod";

const toNumber = (value: unknown) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? Number.NaN : Number(trimmed);
  }

  return value;
};

const numericField = (
  name: string,
  min: number,
  max: number,
  allowZero = false
) =>
  z
    .preprocess(
      toNumber,
      z
        .number({ invalid_type_error: `${name} must be a number.` })
        .finite(`${name} must be finite.`)
    )
    .refine((value) => (allowZero ? value >= min : value > min), {
      message: allowZero
        ? `${name} must be at least ${min}.`
        : `${name} must be greater than ${min}.`
    })
    .refine((value) => value <= max, {
      message: `${name} must be <= ${max}.`
    });

export const bondInputSchema = z
  .object({
    faceValue: numericField("Face value", 0, 1_000_000_000),
    annualCouponRate: numericField("Annual coupon rate", 0, 100, true),
    marketPrice: numericField("Market price", 0, 1_000_000_000),
    yearsToMaturity: numericField("Years to maturity", 0, 100),
    couponFrequency: z.enum(["annual", "semi-annual"])
  })
  .strict()
  .superRefine((value, ctx) => {
    const frequency = value.couponFrequency === "annual" ? 1 : 2;
    const periods = value.yearsToMaturity * frequency;

    if (!Number.isInteger(periods)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["yearsToMaturity"],
        message:
          "Years to maturity must align with coupon frequency (e.g. 10.5 years for semi-annual is valid)."
      });
    }
  });

export type BondInput = z.infer<typeof bondInputSchema>;

export function parseBondInput(payload: unknown): BondInput {
  return bondInputSchema.parse(payload);
}
