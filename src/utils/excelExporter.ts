import * as XLSX from "xlsx";
import { BusinessPlan } from "../types";

/**
 * Generates and downloads a multi-tab Microsoft Excel (.xlsx) workbook
 * containing 5-year projections, P&L statement, cash flows, unit economics,
 * and key investment metrics.
 */
export function exportFinancialsToExcel(plan: BusinessPlan): void {
  const { financials, companyName, sector, status, readinessScore } = plan;
  const { years, currency } = financials;

  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // Sheet 1: 5-Year Income Statement (P&L)
  // -------------------------------------------------------------
  const pnlData: (string | number)[][] = [
    [`${companyName} - 5-Year Pro-Forma Income Statement (P&L)`],
    [`Sector: ${sector} | Status: ${status.toUpperCase()} (${readinessScore}%) | Currency: ${currency}`],
    [],
    ["Metric / Line Item", ...years, "5-Yr CAGR / Total"],
    [],
    // Revenue Section
    ["REVENUE STREAMS"],
    ...financials.revenueStreams.map((stream) => {
      const sum = stream.values.reduce((a, b) => a + b, 0);
      return [stream.name, ...stream.values, sum];
    }),
    [
      "Total Revenue",
      ...financials.totalRevenue,
      financials.totalRevenue.reduce((a, b) => a + b, 0),
    ],
    [],
    // COGS Section
    ["COST OF GOODS SOLD (COGS)"],
    ...financials.cogs.map((item) => {
      const sum = item.values.reduce((a, b) => a + b, 0);
      return [item.category, ...item.values, sum];
    }),
    [
      "Total COGS",
      ...financials.totalCogs,
      financials.totalCogs.reduce((a, b) => a + b, 0),
    ],
    [],
    // Gross Profit
    [
      "Gross Profit",
      ...financials.grossProfit,
      financials.grossProfit.reduce((a, b) => a + b, 0),
    ],
    [
      "Gross Margin %",
      ...financials.grossMarginPercent.map((val) => `${val.toFixed(1)}%`),
      `${(
        (financials.grossProfit.reduce((a, b) => a + b, 0) /
          financials.totalRevenue.reduce((a, b) => a + b, 0)) *
        100
      ).toFixed(1)}%`,
    ],
    [],
    // Operating Expenses
    ["OPERATING EXPENSES (OPEX)"],
    ...financials.operatingExpenses.map((exp) => {
      const sum = exp.values.reduce((a, b) => a + b, 0);
      return [exp.category, ...exp.values, sum];
    }),
    [
      "Total Operating Expenses",
      ...financials.totalOpex,
      financials.totalOpex.reduce((a, b) => a + b, 0),
    ],
    [],
    // Profitability Metrics
    [
      "EBITDA",
      ...financials.ebitda,
      financials.ebitda.reduce((a, b) => a + b, 0),
    ],
    [
      "EBITDA Margin %",
      ...financials.ebitdaMarginPercent.map((val) => `${val.toFixed(1)}%`),
      `${(
        (financials.ebitda.reduce((a, b) => a + b, 0) /
          financials.totalRevenue.reduce((a, b) => a + b, 0)) *
        100
      ).toFixed(1)}%`,
    ],
    [
      "Depreciation & Amortization",
      ...financials.depreciationAmortization,
      financials.depreciationAmortization.reduce((a, b) => a + b, 0),
    ],
    ["EBIT (Operating Income)", ...financials.ebit, financials.ebit.reduce((a, b) => a + b, 0)],
    ["Income Tax Expense", ...financials.tax, financials.tax.reduce((a, b) => a + b, 0)],
    [
      "Net Income (Profit After Tax)",
      ...financials.netIncome,
      financials.netIncome.reduce((a, b) => a + b, 0),
    ],
    [
      "Net Margin %",
      ...financials.netMarginPercent.map((val) => `${val.toFixed(1)}%`),
      `${(
        (financials.netIncome.reduce((a, b) => a + b, 0) /
          financials.totalRevenue.reduce((a, b) => a + b, 0)) *
        100
      ).toFixed(1)}%`,
    ],
  ];

  const wsPnl = XLSX.utils.aoa_to_sheet(pnlData);
  // Column widths
  wsPnl["!cols"] = [
    { wch: 32 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPnl, "Income Statement (P&L)");

  // -------------------------------------------------------------
  // Sheet 2: Cash Flow Statement & CapEx
  // -------------------------------------------------------------
  const cf = financials.cashFlow;
  const cashFlowData: (string | number)[][] = [
    [`${companyName} - 5-Year Cash Flow & Capital Expenditure Projections`],
    [`Currency: ${currency}`],
    [],
    ["Cash Flow Line Item", ...years, "5-Year Cumulative"],
    [],
    [
      "Operating Cash Flow (OCF)",
      ...cf.operatingCashFlow,
      cf.operatingCashFlow.reduce((a, b) => a + b, 0),
    ],
    [
      "Capital Expenditure (CapEx)",
      ...cf.capex,
      cf.capex.reduce((a, b) => a + b, 0),
    ],
    [
      "Free Cash Flow (FCF = OCF - CapEx)",
      ...cf.freeCashFlow,
      cf.freeCashFlow.reduce((a, b) => a + b, 0),
    ],
    [
      "Ending Cash Balance",
      ...cf.endingCashBalance,
      cf.endingCashBalance[cf.endingCashBalance.length - 1] ?? 0,
    ],
    [],
    ["Liquidity Reserves & Burn"],
    ["Monthly Cash Burn", financials.breakEven.monthlyBurn],
    ["Break-Even Month", `Month ${financials.breakEven.breakEvenMonth}`],
    ["Break-Even Monthly Revenue", financials.breakEven.breakEvenRevenue],
    ["Target Units to Break Even", financials.breakEven.targetUnits],
    ["Contribution Margin %", `${financials.breakEven.contributionMarginPercent}%`],
  ];

  const wsCashFlow = XLSX.utils.aoa_to_sheet(cashFlowData);
  wsCashFlow["!cols"] = [
    { wch: 35 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCashFlow, "Cash Flow & Reserves");

  // -------------------------------------------------------------
  // Sheet 3: Investor Diligence Metrics & Unit Economics
  // -------------------------------------------------------------
  const inv = financials.investorMetrics;
  const investorData: (string | number)[][] = [
    [`${companyName} - Venture Capital & Investor Diligence Metrics`],
    [],
    ["Metric", "Value", "Benchmark / Notes"],
    ["Total Funding Required", inv.totalFundingRequired, "Primary round target ask"],
    ["Pre-Money Valuation", inv.preMoneyValuation, "Current negotiated entry baseline"],
    ["Projected Internal Rate of Return (IRR)", `${inv.projectedIRR}%`, "Target 5-year hurdle rate"],
    ["Projected ROI Multiple", inv.projectedROI, "Return multiple at liquidity exit"],
    ["Operating Runway (Months)", `${inv.runwayMonths} months`, "Capital runway post-closing"],
    [],
    ["UNIT ECONOMICS"],
    ["Customer Acquisition Cost (CAC)", inv.cac, `${currency} per converted customer`],
    ["Lifetime Value (LTV)", inv.ltv, `${currency} gross margin lifetime contribution`],
    [
      "LTV / CAC Ratio",
      `${inv.ltvCacRatio.toFixed(1)}x`,
      inv.ltvCacRatio >= 3 ? "Healthy VC benchmark (>= 3.0x)" : "Under optimization",
    ],
    ["CAC Payback Period", `${inv.paybackPeriodMonths} months`, "Months to cash-flow neutrality"],
  ];

  const wsInvestor = XLSX.utils.aoa_to_sheet(investorData);
  wsInvestor["!cols"] = [{ wch: 38 }, { wch: 18 }, { wch: 38 }];
  XLSX.utils.book_append_sheet(wb, wsInvestor, "Investor Metrics & Unit Econ");

  // -------------------------------------------------------------
  // Sheet 4: Market Opportunity & Venture Summary
  // -------------------------------------------------------------
  const marketData: (string | number)[][] = [
    [`${companyName} - Market Opportunity & Business Plan Overview`],
    [],
    ["Attribute", "Value"],
    ["Company Name", companyName],
    ["Industry Sector", sector],
    ["Readiness Status", `${status.toUpperCase()} (${readinessScore}% Score)`],
    ["Report Currency", currency],
    ["Document Reference", `${plan.docReference} Rev ${plan.revision}`],
    [],
    ["EXECUTIVE THESIS & STRATEGY"],
    ["Tagline", plan.tagline],
    ["Executive Summary", plan.executiveSummary],
    ["Target Market & Opportunity", plan.targetMarket],
    ["Value Proposition", plan.valueProposition],
    ["Competitive Moat", plan.competitiveMoat],
    ["Growth Strategy", plan.growthStrategy],
    [],
    ["CAPITALIZATION & FUNDING ASKS"],
    ["Total Funding Required", financials.investorMetrics.totalFundingRequired],
    ["Projected 5-Yr IRR", `${financials.investorMetrics.projectedIRR}%`],
    ["Target ROI Multiple", financials.investorMetrics.projectedROI],
    ["Runway Duration", `${financials.investorMetrics.runwayMonths} Months`],
    ["Pre-Money Valuation", financials.investorMetrics.preMoneyValuation],
  ];

  const wsMarket = XLSX.utils.aoa_to_sheet(marketData);
  wsMarket["!cols"] = [{ wch: 32 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsMarket, "Market & Plan Summary");

  // Output filename
  const sanitizedName = companyName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `${sanitizedName}_Financial_Model_5Year.xlsx`;

  XLSX.writeFile(wb, fileName);
}
