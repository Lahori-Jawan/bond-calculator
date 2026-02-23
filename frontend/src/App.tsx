import { FormEvent, useMemo, useState } from "react";
import { calculateBond } from "./api";
import { BondCalculationResponse, CouponFrequency } from "./types";

interface FormState {
  faceValue: string;
  annualCouponRate: string;
  marketPrice: string;
  yearsToMaturity: string;
  couponFrequency: CouponFrequency;
}

const initialState: FormState = {
  faceValue: "1000",
  annualCouponRate: "5",
  marketPrice: "980",
  yearsToMaturity: "10",
  couponFrequency: "semi-annual"
};

export default function App() {
  const [form, setForm] = useState<FormState>(initialState);
  const [result, setResult] = useState<BondCalculationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const premiumLabel = useMemo(() => {
    if (!result) return "";
    if (result.premiumDiscount === "premium") return "Trading at Premium";
    if (result.premiumDiscount === "discount") return "Trading at Discount";
    return "Trading at Par";
  }, [result]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload = {
        faceValue: Number(form.faceValue),
        annualCouponRate: Number(form.annualCouponRate),
        marketPrice: Number(form.marketPrice),
        yearsToMaturity: Number(form.yearsToMaturity),
        couponFrequency: form.couponFrequency
      };

      const data = await calculateBond(payload);
      setResult(data);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Unexpected error.";
      setResult(null);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="panel">
        <h1>Bond Yield Calculator</h1>
        <p className="subtitle">
          Compute current yield, YTM, and full coupon cash-flow schedule.
        </p>

        <form className="form-grid" onSubmit={onSubmit}>
          <Field
            label="Face value"
            value={form.faceValue}
            onChange={(value) => setForm((prev) => ({ ...prev, faceValue: value }))}
          />
          <Field
            label="Annual coupon rate (%)"
            value={form.annualCouponRate}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, annualCouponRate: value }))
            }
          />
          <Field
            label="Market price"
            value={form.marketPrice}
            onChange={(value) => setForm((prev) => ({ ...prev, marketPrice: value }))}
          />
          <Field
            label="Years to maturity"
            value={form.yearsToMaturity}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, yearsToMaturity: value }))
            }
          />

          <label>
            Coupon frequency
            <select
              value={form.couponFrequency}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  couponFrequency: event.target.value as CouponFrequency
                }))
              }
            >
              <option value="annual">Annual</option>
              <option value="semi-annual">Semi-Annual</option>
            </select>
          </label>

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Calculating..." : "Calculate"}
          </button>
        </form>

        {error ? <p className="error">{error}</p> : null}
      </section>

      {result ? (
        <section className="panel result-panel">
          <h2>Results</h2>
          <div className="metrics">
            <Metric label="Current Yield" value={`${formatPercent(result.currentYieldPct)}`} />
            <Metric label="YTM" value={`${formatPercent(result.ytmPct)}`} />
            <Metric
              label="Total Interest"
              value={formatCurrency(result.totalInterest)}
            />
            <Metric label="Status" value={premiumLabel} />
          </div>

          <h3>Cash Flow Schedule ({result.totalPeriods} periods)</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Payment date</th>
                  <th>Coupon payment</th>
                  <th>Cumulative interest</th>
                  <th>Remaining principal</th>
                </tr>
              </thead>
              <tbody>
                {result.cashFlows.map((row) => (
                  <tr key={row.period}>
                    <td>{row.period}</td>
                    <td>{row.paymentDate}</td>
                    <td>{formatCurrency(row.couponPayment)}</td>
                    <td>{formatCurrency(row.cumulativeInterest)}</td>
                    <td>{formatCurrency(row.remainingPrincipal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {props.label}
      <input
        inputMode="decimal"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        required
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function formatPercent(value: number) {
  return `${value.toFixed(3)}%`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}
