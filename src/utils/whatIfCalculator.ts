import { FinancialData, WhatIfVariables, WhatIfScenarioPreset } from "../types";

export const DEFAULT_WHAT_IF_VARIABLES: WhatIfVariables = {
  revenueGrowthDelta: 0,
  pricingPowerDelta: 0,
  cogsEfficiencyDelta: 0,
  opexDelta: 0,
  cacDelta: 0,
  capexDelta: 0,
};

export const WHAT_IF_PRESETS: WhatIfScenarioPreset[] = [
  {
    id: "base_case",
    name: "Base Case",
    tagline: "Current Plan Baseline",
    description: "Original validated financial model without modifications.",
    badge: "0% Delta",
    badgeColor: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700",
    variables: {
      revenueGrowthDelta: 0,
      pricingPowerDelta: 0,
      cogsEfficiencyDelta: 0,
      opexDelta: 0,
      cacDelta: 0,
      capexDelta: 0,
    },
  },
  {
    id: "hyper_growth",
    name: "Hyper-Growth",
    tagline: "Venture Scale Bull Case",
    description: "Accelerated customer adoption (+30% Growth, +10% Pricing) supported by aggressive expansion spend (+15% OPEX).",
    badge: "Venture Bull",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
    variables: {
      revenueGrowthDelta: 30,
      pricingPowerDelta: 10,
      cogsEfficiencyDelta: -10, // 10% lower costs
      opexDelta: 15,
      cacDelta: -15,
      capexDelta: 15,
    },
  },
  {
    id: "lean_capital",
    name: "Lean & Cash-First",
    tagline: "High Margin & Fast Path to Profit",
    description: "Tight expense controls (-20% OPEX, -15% COGS) prioritizing immediate cash generation and early break-even.",
    badge: "Capital Efficient",
    badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300 dark:border-sky-800",
    variables: {
      revenueGrowthDelta: 10,
      pricingPowerDelta: 5,
      cogsEfficiencyDelta: -15,
      opexDelta: -20,
      cacDelta: -20,
      capexDelta: -20,
    },
  },
  {
    id: "market_downturn",
    name: "Market Downturn",
    tagline: "Conservative Downside Stress-Test",
    description: "Macro headwinds reduce demand (-25% Growth, -10% Pricing) with inflation driving up supplier costs (+10% COGS).",
    badge: "Bear Stress-Test",
    badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800",
    variables: {
      revenueGrowthDelta: -25,
      pricingPowerDelta: -10,
      cogsEfficiencyDelta: 12, // 12% higher costs
      opexDelta: -12,
      cacDelta: 25,
      capexDelta: -30,
    },
  },
  {
    id: "enterprise_expansion",
    name: "Enterprise Expansion",
    tagline: "High-Ticket Contract Power",
    description: "Strong enterprise pricing power (+20% Pricing) and higher gross margins offset by specialized enterprise sales cycles.",
    badge: "Enterprise SaaS",
    badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800",
    variables: {
      revenueGrowthDelta: 20,
      pricingPowerDelta: 20,
      cogsEfficiencyDelta: -12,
      opexDelta: 10,
      cacDelta: 10,
      capexDelta: 5,
    },
  },
];

/**
 * Recalculates 5-year financial projections based on adjusted What-If growth and cost variables
 */
export function recalculateWhatIfFinancials(
  baseline: FinancialData,
  variables: WhatIfVariables
): FinancialData {
  const yearsCount = baseline.years?.length || 5;
  const growthFrac = variables.revenueGrowthDelta / 100;
  const pricingFrac = variables.pricingPowerDelta / 100;
  const cogsEffFrac = variables.cogsEfficiencyDelta / 100;
  const opexFrac = variables.opexDelta / 100;
  const capexFrac = variables.capexDelta / 100;

  // Progressive multiplier weights across Years 1 through 5
  // Early years are anchored to current setup; later years feel the compounding leverage
  const progressiveGrowthWeights = [0.25, 0.50, 0.75, 0.90, 1.0];

  const totalRevenue: number[] = [];
  const totalCogs: number[] = [];
  const grossProfit: number[] = [];
  const grossMarginPercent: number[] = [];
  const totalOpex: number[] = [];
  const ebitda: number[] = [];
  const ebitdaMarginPercent: number[] = [];
  const depreciationAmortization: number[] = [];
  const ebit: number[] = [];
  const tax: number[] = [];
  const netIncome: number[] = [];
  const netMarginPercent: number[] = [];

  // Recalculate revenue streams
  const revenueStreams = baseline.revenueStreams.map((stream) => {
    const updatedValues = stream.values.map((val, idx) => {
      const weight = progressiveGrowthWeights[idx] ?? 1.0;
      const factor = Math.max(0.05, 1 + weight * growthFrac + pricingFrac);
      return Math.round(val * factor);
    });
    return {
      ...stream,
      values: updatedValues,
    };
  });

  // Calculate annual total revenue
  for (let idx = 0; idx < yearsCount; idx++) {
    const sumStream = revenueStreams.reduce((acc, s) => acc + (s.values[idx] || 0), 0);
    // Fallback to baseline totalRevenue scaled if revenueStreams was empty
    if (sumStream > 0) {
      totalRevenue.push(sumStream);
    } else {
      const weight = progressiveGrowthWeights[idx] ?? 1.0;
      const factor = Math.max(0.05, 1 + weight * growthFrac + pricingFrac);
      totalRevenue.push(Math.round((baseline.totalRevenue[idx] || 0) * factor));
    }
  }

  // Recalculate COGS
  const cogs = baseline.cogs.map((item) => {
    const updatedValues = item.values.map((val, idx) => {
      const weight = progressiveGrowthWeights[idx] ?? 1.0;
      // Volume scales with growth, pricing power does not incur COGS
      const volumeFactor = Math.max(0.1, 1 + weight * growthFrac);
      const cogsMultiplier = Math.max(0.05, volumeFactor * (1 + cogsEffFrac));
      return Math.round(val * cogsMultiplier);
    });
    return {
      ...item,
      values: updatedValues,
    };
  });

  for (let idx = 0; idx < yearsCount; idx++) {
    const sumCogs = cogs.reduce((acc, c) => acc + (c.values[idx] || 0), 0);
    totalCogs.push(sumCogs);
  }

  // Gross profit & Gross margin
  for (let idx = 0; idx < yearsCount; idx++) {
    const rev = totalRevenue[idx];
    const cg = totalCogs[idx];
    const gp = rev - cg;
    grossProfit.push(gp);
    const gm = rev > 0 ? Number(((gp / rev) * 100).toFixed(1)) : 0;
    grossMarginPercent.push(gm);
  }

  // Recalculate OPEX
  const operatingExpenses = baseline.operatingExpenses.map((exp) => {
    const updatedValues = exp.values.map((val) => {
      const opexMultiplier = Math.max(0.1, 1 + opexFrac);
      return Math.round(val * opexMultiplier);
    });
    return {
      ...exp,
      values: updatedValues,
    };
  });

  for (let idx = 0; idx < yearsCount; idx++) {
    const sumOpex = operatingExpenses.reduce((acc, o) => acc + (o.values[idx] || 0), 0);
    totalOpex.push(sumOpex);
  }

  // EBITDA
  for (let idx = 0; idx < yearsCount; idx++) {
    const gp = grossProfit[idx];
    const op = totalOpex[idx];
    const eb = gp - op;
    ebitda.push(eb);
    const rev = totalRevenue[idx];
    const ebm = rev > 0 ? Number(((eb / rev) * 100).toFixed(1)) : 0;
    ebitdaMarginPercent.push(ebm);
  }

  // D&A, EBIT, Tax, Net Income
  for (let idx = 0; idx < yearsCount; idx++) {
    const baseDA = baseline.depreciationAmortization[idx] || 0;
    const daVal = Math.round(baseDA * Math.max(0.2, 1 + capexFrac * 0.3));
    depreciationAmortization.push(daVal);

    const eb = ebitda[idx];
    const opProfit = eb - daVal;
    ebit.push(opProfit);

    const taxVal = opProfit > 0 ? Math.round(opProfit * 0.21) : 0;
    tax.push(taxVal);

    const ni = opProfit - taxVal;
    netIncome.push(ni);

    const rev = totalRevenue[idx];
    const nm = rev > 0 ? Number(((ni / rev) * 100).toFixed(1)) : 0;
    netMarginPercent.push(nm);
  }

  // Recalculate Cash Flow
  const capex = baseline.cashFlow.capex.map((c) =>
    Math.round(c * Math.max(0.1, 1 + capexFrac))
  );

  const operatingCashFlow: number[] = [];
  const freeCashFlow: number[] = [];
  const endingCashBalance: number[] = [];

  // Determine starting cash
  const initialBaseCash =
    baseline.cashFlow.endingCashBalance[0] ||
    baseline.investorMetrics.totalFundingRequired ||
    2000000;

  let currentCash = initialBaseCash;

  for (let idx = 0; idx < yearsCount; idx++) {
    // Op Cash ≈ EBITDA - Tax
    const opCash = ebitda[idx] - tax[idx];
    operatingCashFlow.push(opCash);

    const fcf = opCash - capex[idx];
    freeCashFlow.push(fcf);

    if (idx === 0) {
      currentCash = Math.round(initialBaseCash + fcf * 0.7);
    } else {
      currentCash = Math.round(currentCash + fcf);
    }
    endingCashBalance.push(Math.max(10000, currentCash));
  }

  // Recalculate Break-Even Analysis
  const year1Burn = Math.max(
    10000,
    Math.round(
      Math.abs(Math.min(0, ebitda[0])) / 12 +
        (totalOpex[0] * 0.3) / 12
    )
  );

  let breakEvenMonth = baseline.breakEven?.breakEvenMonth || 16;
  // If EBITDA is immediately positive in Y1:
  if (ebitda[0] > 0) {
    breakEvenMonth = Math.max(3, Math.round(breakEvenMonth * 0.5));
  } else if (ebitda[1] > 0) {
    breakEvenMonth = Math.max(10, Math.min(24, Math.round(breakEvenMonth * (1 - growthFrac * 0.3 + opexFrac * 0.2))));
  } else {
    breakEvenMonth = Math.min(48, Math.round(breakEvenMonth * (1 - growthFrac * 0.3 + opexFrac * 0.3)));
  }

  const breakEvenRevenue = Math.round(
    (baseline.breakEven?.breakEvenRevenue || 120000) *
      Math.max(0.5, 1 + opexFrac * 0.5 + cogsEffFrac * 0.3)
  );

  // Recalculate Investor Metrics
  const baseCac = baseline.investorMetrics?.cac || 450;
  const baseLtv = baseline.investorMetrics?.ltv || 2400;
  const baseValuation = baseline.investorMetrics?.preMoneyValuation || 15000000;

  const newCac = Math.round(baseCac * (1 + variables.cacDelta / 100));
  const newLtv = Math.round(
    baseLtv *
      (1 + pricingFrac) *
      (grossMarginPercent[yearsCount - 1] / (baseline.grossMarginPercent[yearsCount - 1] || 75))
  );
  const newLtvCac = newCac > 0 ? Number((newLtv / newCac).toFixed(1)) : 0;

  const basePayback = baseline.investorMetrics?.paybackPeriodMonths || 12;
  const newPayback = Math.max(
    1,
    Math.round(basePayback * ((1 + variables.cacDelta / 100) / (1 + pricingFrac)))
  );

  // Projected Y5 valuation multiple: 10x EBITDA / initial valuation
  const y5Ebitda = Math.max(100000, ebitda[yearsCount - 1]);
  const estimatedExitValuation = y5Ebitda * 10;
  const rawRoi = estimatedExitValuation / baseValuation;
  const projectedROI = `${Math.max(1.2, Number(rawRoi.toFixed(1)))}x`;
  const projectedIRR = Math.max(
    8,
    Math.min(125, Math.round(Math.pow(rawRoi, 1 / 5) * 100 - 100))
  );

  const runwayMonths =
    year1Burn > 0
      ? Math.min(60, Math.round(endingCashBalance[0] / year1Burn))
      : 36;

  return {
    ...baseline,
    revenueStreams,
    totalRevenue,
    cogs,
    totalCogs,
    grossProfit,
    grossMarginPercent,
    operatingExpenses,
    totalOpex,
    ebitda,
    ebitdaMarginPercent,
    depreciationAmortization,
    ebit,
    tax,
    netIncome,
    netMarginPercent,
    cashFlow: {
      operatingCashFlow,
      capex,
      freeCashFlow,
      endingCashBalance,
    },
    breakEven: {
      monthlyBurn: year1Burn,
      breakEvenMonth,
      breakEvenRevenue,
      targetUnits: Math.round(
        (baseline.breakEven?.targetUnits || 1200) * (1 + growthFrac * 0.7)
      ),
      contributionMarginPercent: grossMarginPercent[yearsCount - 1],
    },
    investorMetrics: {
      ...baseline.investorMetrics,
      cac: newCac,
      ltv: newLtv,
      ltvCacRatio: newLtvCac,
      paybackPeriodMonths: newPayback,
      projectedROI,
      projectedIRR,
      runwayMonths,
    },
  };
}
