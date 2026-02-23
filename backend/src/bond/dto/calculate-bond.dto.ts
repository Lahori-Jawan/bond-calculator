import { Transform } from "class-transformer";
import {
  IsIn,
  IsNumber,
  Max,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from "class-validator";
import { BondInput, CouponFrequency } from "../bond.types";

const toNumber = ({ value }: { value: unknown }) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? Number.NaN : Number(trimmed);
  }
  return value;
};

@ValidatorConstraint({ name: "yearsToMaturityFrequency", async: false })
export class YearsToMaturityFrequencyConstraint
  implements ValidatorConstraintInterface
{
  validate(value: number, args: ValidationArguments): boolean {
    const payload = args.object as CalculateBondDto;
    if (!Number.isFinite(value)) return false;

    const frequency = payload.couponFrequency === "semi-annual" ? 2 : 1;
    return Number.isInteger(value * frequency);
  }

  defaultMessage(): string {
    return "Years to maturity must align with coupon frequency.";
  }
}

export class CalculateBondDto implements BondInput {
  @Transform(toNumber)
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: "Face value must be a number." }
  )
  @Min(0.000001, { message: "Face value must be greater than 0." })
  @Max(1_000_000_000, { message: "Face value must be <= 1000000000." })
  faceValue!: number;

  @Transform(toNumber)
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: "Annual coupon rate must be a number." }
  )
  @Min(0, { message: "Annual coupon rate must be at least 0." })
  @Max(100, { message: "Annual coupon rate must be <= 100." })
  annualCouponRate!: number;

  @Transform(toNumber)
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: "Market price must be a number." }
  )
  @Min(0.000001, { message: "Market price must be greater than 0." })
  @Max(1_000_000_000, { message: "Market price must be <= 1000000000." })
  marketPrice!: number;

  @Transform(toNumber)
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: "Years to maturity must be a number." }
  )
  @Min(0.000001, { message: "Years to maturity must be greater than 0." })
  @Max(100, { message: "Years to maturity must be <= 100." })
  @Validate(YearsToMaturityFrequencyConstraint, {
    message:
      "Years to maturity must align with coupon frequency (e.g. 10.5 years for semi-annual)."
  })
  yearsToMaturity!: number;

  @IsIn(["annual", "semi-annual"], {
    message: "Coupon frequency must be either annual or semi-annual."
  })
  couponFrequency!: CouponFrequency;
}
