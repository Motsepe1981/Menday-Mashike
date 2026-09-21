import {
  BusinessPlan,
  FinancialSnapshot,
  FinancialSnapshotMetrics,
  MetricVariance,
  SnapshotComparisonSummary,
} from "../types";

/**
 * Extracts current financial metrics from a BusinessPlan into a standardized snapshot metrics object.
 */
export function extractCurrentMetrics(plan: BusinessPlan): FinancialSnapshotMetrics {
  const fin = plan.financials;
  const inv = fin.investorMetrics;
  const bEven = fin.breakEven;

  const y1Rev = fin.totalRevenue?.[0] || 0;
  const y5Rev = fin.totalRevenue?.[fin.totalRevenue.length - 1] || 0;
  const ebitdaY5 = fin.ebitda?.[fin.ebitda.length - 1] || 0;
  const grossMarginY5 = fin.grossMarginPercent?.[fin.grossMarginPercent.length - 1] || 0;

  return {
    monthlyBurn: bEven?.monthlyBurn || 0,
    runwayMonths: inv?.runwayMonths || 24,
    cac: inv?.cac || 0,
    ltv: inv?.ltv || 0,
    ltvCacRatio: inv?.ltvCacRatio || (inv?.cac ? inv.ltv / inv.cac : 0),
    paybackPeriodMonths: inv?.paybackPeriodMonths || 12,
    breakEvenMonth: bEven?.breakEvenMonth || 18,
    breakEvenRevenue: bEven?.breakEvenRevenue || 0,
    totalRevenueY1: y1Rev,
    totalRevenueY5: y5Rev,
    ebitdaY5: ebitdaY5,
    grossMarginY5: grossMarginY5,
    totalFundingRequired: inv?.totalFundingRequired || 0,
    preMoneyValuation: inv?.preMoneyValuation || 0,
    targetUnits: bEven?.targetUnits || 0,
  };
}

/**
 * Computes detailed metric-by-metric variance between current projections and a previous version snapshot.
 * Highlights any metric exceeding the threshold (e.g. >10% fluctuation).
 */
export function analyzeSnapshotVariance(
  plan: BusinessPlan,
  snapshot: FinancialSnapshot,
  thresholdPercent: number = 10
): SnapshotComparisonSummary {
  const current = extractCurrentMetrics(plan);
  const prev = snapshot.metrics;

  const createVariance = (
    key: string,
    name: string,
    category: MetricVariance["category"],
    currVal: number,
    prevVal: number,
    unit: MetricVariance["unit"],
    higherIsFavorable: boolean | "neutral",
    driverContext: { up: string; down: string; stable: string }
  ): MetricVariance => {
    const absoluteDiff = currVal - prevVal;
    const percentChange = prevVal !== 0 ? ((currVal - prevVal) / Math.abs(prevVal)) * 100 : 0;
    const isSignificant = Math.abs(percentChange) >= thresholdPercent;

    let impactDirection: MetricVariance["impactDirection"] = "neutral";
    if (higherIsFavorable !== "neutral") {
      if (percentChange === 0) {
        impactDirection = "neutral";
      } else if (higherIsFavorable) {
        impactDirection = percentChange > 0 ? "favorable" : "unfavorable";
      } else {
        impactDirection = percentChange > 0 ? "unfavorable" : "favorable";
      }
    }

    let driverNote = driverContext.stable;
    if (isSignificant) {
      driverNote = percentChange > 0 ? driverContext.up : driverContext.down;
    }

    return {
      key,
      name,
      category,
      currentVal: currVal,
      previousVal: prevVal,
      unit,
      absoluteDiff,
      percentChange,
      isSignificant,
      impactDirection,
      driverNote,
    };
  };

  const variances: MetricVariance[] = [
    // 1. Monthly Net Burn Rate (Primary Flagged Metric)
    createVariance(
      "monthlyBurn",
      "Net Monthly Burn Rate",
      "burn_runway",
      current.monthlyBurn,
      prev.monthlyBurn,
      "currency",
      false, // higher burn is unfavorable
      {
        up: `Burn rate expanded by ${Math.abs(((current.monthlyBurn - prev.monthlyBurn) / prev.monthlyBurn) * 100).toFixed(1)}% (+$${Math.round(current.monthlyBurn - prev.monthlyBurn).toLocaleString()}/mo). Operational cash bleed accelerated due to team expansion and operational scale.`,
        down: `Burn rate contracted by ${Math.abs(((current.monthlyBurn - prev.monthlyBurn) / prev.monthlyBurn) * 100).toFixed(1)}% (-$${Math.round(prev.monthlyBurn - current.monthlyBurn).toLocaleString()}/mo). Favorable cost-containment preserving capital reserves.`,
        stable: "Burn rate remains disciplined within the ±10% stabilization corridor.",
      }
    ),

    // 2. Customer Acquisition Cost (CAC)
    createVariance(
      "cac",
      "Customer Acquisition Cost (CAC)",
      "unit_economics",
      current.cac,
      prev.cac,
      "currency",
      false, // higher CAC is unfavorable
      {
        up: `CAC increased by ${Math.abs(((current.cac - prev.cac) / prev.cac) * 100).toFixed(1)}%. Customer acquisition friction higher across expanded outbound enterprise channels.`,
        down: `CAC declined by ${Math.abs(((current.cac - prev.cac) / prev.cac) * 100).toFixed(1)}%. Improved sales velocity and marketing organic referral efficiency.`,
        stable: "CAC is stable within the ±10% baseline variance threshold.",
      }
    ),

    // 3. Funded Cash Runway
    createVariance(
      "runwayMonths",
      "Funded Cash Runway",
      "burn_runway",
      current.runwayMonths,
      prev.runwayMonths,
      "months",
      true, // higher runway is favorable
      {
        up: `Runway extended by +${Math.round(current.runwayMonths - prev.runwayMonths)} months. Provides increased operational buffer prior to next financing.`,
        down: `Runway shortened by -${Math.round(prev.runwayMonths - current.runwayMonths)} months. Cash horizon compressed due to higher upfront investments.`,
        stable: "Runway horizon is aligned with baseline expectations.",
      }
    ),

    // 4. Annual Run-Rate (Y1 Revenue)
    createVariance(
      "totalRevenueY1",
      "Annual Run-Rate (Y1 ARR)",
      "topline_valuation",
      current.totalRevenueY1,
      prev.totalRevenueY1,
      "currency",
      true, // higher revenue is favorable
      {
        up: `Year 1 revenue projection raised by +${Math.abs(((current.totalRevenueY1 - prev.totalRevenueY1) / prev.totalRevenueY1) * 100).toFixed(1)}%. Stronger enterprise pipeline conversion and pilot adoption.`,
        down: `Year 1 revenue projection lowered by -${Math.abs(((current.totalRevenueY1 - prev.totalRevenueY1) / prev.totalRevenueY1) * 100).toFixed(1)}%. Adjusted for conservative enterprise contract onboarding cycles.`,
        stable: "Year 1 top-line forecast tracking closely with baseline model.",
      }
    ),

    // 5. Customer Lifetime Value (LTV)
    createVariance(
      "ltv",
      "Customer Lifetime Value (LTV)",
      "unit_economics",
      current.ltv,
      prev.ltv,
      "currency",
      true, // higher LTV is favorable
      {
        up: `LTV increased by +${Math.abs(((current.ltv - prev.ltv) / prev.ltv) * 100).toFixed(1)}% due to stronger retention and multi-year subscription expansion.`,
        down: `LTV decreased by -${Math.abs(((current.ltv - prev.ltv) / prev.ltv) * 100).toFixed(1)}% reflecting revised churn estimates.`,
        stable: "LTV model assumptions remain consistent with earlier projections.",
      }
    ),

    // 6. LTV / CAC Efficiency Ratio
    createVariance(
      "ltvCacRatio",
      "LTV / CAC Efficiency Ratio",
      "unit_economics",
      current.ltvCacRatio,
      prev.ltvCacRatio,
      "ratio",
      true, // higher ratio is favorable
      {
        up: `Unit capital efficiency increased to ${current.ltvCacRatio.toFixed(1)}x, well exceeding the 3.0x institutional benchmark.`,
        down: `Efficiency ratio compressed to ${current.ltvCacRatio.toFixed(1)}x, indicating tighter unit contribution margins.`,
        stable: "LTV/CAC ratio is consistent with previous snapshot.",
      }
    ),

    // 7. CAC Payback Period
    createVariance(
      "paybackPeriodMonths",
      "CAC Payback Period",
      "unit_economics",
      current.paybackPeriodMonths,
      prev.paybackPeriodMonths,
      "months",
      false, // shorter payback is favorable
      {
        up: `Payback period lengthened by +${(current.paybackPeriodMonths - prev.paybackPeriodMonths).toFixed(1)} months. Capital recovery cycle slowed.`,
        down: `Payback period accelerated by -${Math.abs(prev.paybackPeriodMonths - current.paybackPeriodMonths).toFixed(1)} months. Faster liquidity recycling into customer acquisition.`,
        stable: "Payback duration tracking within acceptable target range.",
      }
    ),

    // 8. 5-Year Revenue Horizon (Y5)
    createVariance(
      "totalRevenueY5",
      "5-Year Revenue Scale (Y5)",
      "topline_valuation",
      current.totalRevenueY5,
      prev.totalRevenueY5,
      "currency",
      true, // higher revenue is favorable
      {
        up: `Long-term revenue potential scaled up by +${Math.abs(((current.totalRevenueY5 - prev.totalRevenueY5) / prev.totalRevenueY5) * 100).toFixed(1)}%.`,
        down: `Long-term revenue projection revised down by -${Math.abs(((current.totalRevenueY5 - prev.totalRevenueY5) / prev.totalRevenueY5) * 100).toFixed(1)}%.`,
        stable: "5-Year revenue trajectory remains aligned with master model.",
      }
    ),

    // 9. Break-Even Horizon
    createVariance(
      "breakEvenMonth",
      "Operating Break-Even Milestone",
      "burn_runway",
      current.breakEvenMonth,
      prev.breakEvenMonth,
      "months",
      false, // earlier break-even is favorable
      {
        up: `Break-even delayed from Month ${prev.breakEvenMonth} to Month ${current.breakEvenMonth}. Venture requires extended runway before self-sustainability.`,
        down: `Break-even accelerated from Month ${prev.breakEvenMonth} to Month ${current.breakEvenMonth}. Early operational inflection milestone.`,
        stable: "Break-even milestone aligns with targeted capitalization schedule.",
      }
    ),

    // 10. Peak Gross Margin
    createVariance(
      "grossMarginY5",
      "Peak Gross Margin (Y5)",
      "margins",
      current.grossMarginY5,
      prev.grossMarginY5,
      "percent",
      true, // higher margin is favorable
      {
        up: `Gross margin projection increased by +${Math.abs(current.grossMarginY5 - prev.grossMarginY5).toFixed(1)}% due to volume manufacturing economies of scale.`,
        down: `Gross margin compressed by -${Math.abs(prev.grossMarginY5 - current.grossMarginY5).toFixed(1)}% due to elevated COGS input estimates.`,
        stable: "Gross margin trajectory conforms with unit economics profile.",
      }
    ),

    // 11. 5-Year EBITDA Scale
    createVariance(
      "ebitdaY5",
      "5-Year EBITDA Scale (Y5)",
      "margins",
      current.ebitdaY5,
      prev.ebitdaY5,
      "currency",
      true,
      {
        up: `Projected EBITDA expansion improved by +${Math.abs(((current.ebitdaY5 - prev.ebitdaY5) / Math.abs(prev.ebitdaY5 || 1)) * 100).toFixed(1)}%.`,
        down: `Projected EBITDA contracted by -${Math.abs(((current.ebitdaY5 - prev.ebitdaY5) / Math.abs(prev.ebitdaY5 || 1)) * 100).toFixed(1)}%.`,
        stable: "EBITDA scale is tracking along baseline trajectory.",
      }
    ),

    // 12. Target Capital Raise
    createVariance(
      "totalFundingRequired",
      "Target Capital Raise",
      "topline_valuation",
      current.totalFundingRequired,
      prev.totalFundingRequired,
      "currency",
      "neutral",
      {
        up: `Financing target increased from $${(prev.totalFundingRequired / 1000000).toFixed(2)}M to $${(current.totalFundingRequired / 1000000).toFixed(2)}M to fund higher burn and aggressive market capture.`,
        down: `Capital requirement reduced to $${(current.totalFundingRequired / 1000000).toFixed(2)}M due to reduced upfront CapEx.`,
        stable: "Target capitalization matches previously approved investment syndicate round.",
      }
    ),

    // 13. Pre-Money Valuation
    createVariance(
      "preMoneyValuation",
      "Pre-Money Valuation",
      "topline_valuation",
      current.preMoneyValuation,
      prev.preMoneyValuation,
      "currency",
      true,
      {
        up: `Pre-money valuation expectation lifted by +${Math.abs(((current.preMoneyValuation - prev.preMoneyValuation) / prev.preMoneyValuation) * 100).toFixed(1)}% based on commercial traction milestones.`,
        down: `Valuation adjusted downward by -${Math.abs(((current.preMoneyValuation - prev.preMoneyValuation) / prev.preMoneyValuation) * 100).toFixed(1)}% to match current market multiples.`,
        stable: "Valuation benchmark is unchanged.",
      }
    ),
  ];

  const burnRateVariance = variances.find((v) => v.key === "monthlyBurn") || variances[0];
  const significantCount = variances.filter((v) => v.isSignificant).length;
  const significantUnfavorableCount = variances.filter(
    (v) => v.isSignificant && v.impactDirection === "unfavorable"
  ).length;
  const significantFavorableCount = variances.filter(
    (v) => v.isSignificant && v.impactDirection === "favorable"
  ).length;

  return {
    snapshotId: snapshot.id,
    snapshotLabel: snapshot.versionLabel,
    snapshotDate: snapshot.date,
    thresholdPercent,
    totalMetricsCount: variances.length,
    significantCount,
    significantUnfavorableCount,
    significantFavorableCount,
    burnRateVariance,
    variances,
  };
}

/**
 * Creates a new financial snapshot from current business plan state.
 */
export function createNewSnapshot(
  plan: BusinessPlan,
  versionLabel: string,
  stage?: string,
  notes?: string
): FinancialSnapshot {
  return {
    id: `snapshot-${Date.now()}`,
    versionLabel,
    date: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    stage: stage || "Custom Checkpoint",
    notes: notes || `Manual financial snapshot captured for ${plan.companyName}`,
    metrics: extractCurrentMetrics(plan),
  };
}
