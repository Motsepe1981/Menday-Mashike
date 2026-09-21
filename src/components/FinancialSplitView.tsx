import React, { useState, useMemo } from "react";
import { BusinessPlan } from "../types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  ArrowLeftRight,
  TrendingUp,
  DollarSign,
  PieChart,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  FileSpreadsheet,
  Building2,
  CheckCircle2,
  Info,
} from "lucide-react";
import { exportFinancialsToExcel } from "../utils/excelExporter";

interface FinancialSplitViewProps {
  plans: BusinessPlan[];
  initialPlanAId?: string;
  initialPlanBId?: string;
  onSelectPlanForStudio: (planId: string) => void;
  onOpenAudit?: (plan: BusinessPlan) => void;
  onCloseSplitView?: () => void;
}

export const FinancialSplitView: React.FC<FinancialSplitViewProps> = ({
  plans,
  initialPlanAId,
  initialPlanBId,
  onSelectPlanForStudio,
  onOpenAudit,
  onCloseSplitView,
}) => {
  // Select Plan A (defaults to attached reference or first plan)
  const [planAId, setPlanAId] = useState<string>(
    initialPlanAId || plans.find((p) => p.isAttachedReference)?.id || plans[0]?.id || ""
  );

  // Select Plan B (defaults to second plan if available, or first different plan)
  const [planBId, setPlanBId] = useState<string>(() => {
    if (initialPlanBId && initialPlanBId !== planAId) return initialPlanBId;
    const other = plans.find((p) => p.id !== (initialPlanAId || plans[0]?.id));
    return other ? other.id : plans[0]?.id || "";
  });

  const [activeChartCategory, setActiveChartCategory] = useState<
    "all" | "revenue" | "margins" | "cashflow" | "valuation"
  >("all");

  const [activeTab, setActiveTab] = useState<"visuals" | "schedules" | "both">("both");

  const planA = useMemo(() => plans.find((p) => p.id === planAId) || plans[0], [plans, planAId]);
  const planB = useMemo(
    () => plans.find((p) => p.id === planBId) || plans.find((p) => p.id !== planA.id) || plans[0],
    [plans, planBId, planA.id]
  );

  // Swap Plans function
  const handleSwapPlans = () => {
    const temp = planAId;
    setPlanAId(planBId);
    setPlanBId(temp);
  };

  // Formatters
  const formatCurrency = (val: number | undefined | null) => {
    if (val === undefined || val === null) return "$0";
    const prefix = val < 0 ? "-$" : "$";
    const abs = Math.abs(val);
    if (abs >= 1_000_000) return `${prefix}${(abs / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `${prefix}${(abs / 1_000).toFixed(0)}K`;
    return `${prefix}${abs.toLocaleString()}`;
  };

  const formatShortCurrency = (val: number) => {
    if (val === 0) return "$0";
    const prefix = val < 0 ? "-$" : "$";
    const abs = Math.abs(val);
    if (abs >= 1_000_000) return `${prefix}${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${prefix}${(abs / 1_000).toFixed(0)}K`;
    return `${prefix}${abs}`;
  };

  const formatPercent = (val: number | undefined | null) => {
    if (val === undefined || val === null) return "0.0%";
    return `${val.toFixed(1)}%`;
  };

  // Helper for Delta calculation
  const calculateDelta = (valA: number, valB: number) => {
    if (valA === 0) return { diff: valB, percentDiff: valB > 0 ? 100 : 0 };
    const diff = valB - valA;
    const percentDiff = (diff / Math.abs(valA)) * 100;
    return { diff, percentDiff };
  };

  // Prepare 5-Year comparison data for Recharts
  const years = planA.financials.years || ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"];

  const comparisonData = useMemo(() => {
    return years.map((yr, idx) => {
      const revA = planA.financials.totalRevenue[idx] || 0;
      const revB = planB.financials.totalRevenue[idx] || 0;
      const ebitdaA = planA.financials.ebitda[idx] || 0;
      const ebitdaB = planB.financials.ebitda[idx] || 0;
      const grossMarginA = planA.financials.grossMarginPercent[idx] || 0;
      const grossMarginB = planB.financials.grossMarginPercent[idx] || 0;
      const ebitdaMarginA = planA.financials.ebitdaMarginPercent[idx] || 0;
      const ebitdaMarginB = planB.financials.ebitdaMarginPercent[idx] || 0;
      const netIncomeA = planA.financials.netIncome[idx] || 0;
      const netIncomeB = planB.financials.netIncome[idx] || 0;
      const endingCashA = planA.financials.cashFlow?.endingCashBalance?.[idx] || 0;
      const endingCashB = planB.financials.cashFlow?.endingCashBalance?.[idx] || 0;
      const freeCashA = planA.financials.cashFlow?.freeCashFlow?.[idx] || 0;
      const freeCashB = planB.financials.cashFlow?.freeCashFlow?.[idx] || 0;
      const capexA = planA.financials.cashFlow?.capex?.[idx] || 0;
      const capexB = planB.financials.cashFlow?.capex?.[idx] || 0;

      return {
        year: yr.replace("Year ", "Y"),
        fullYear: yr,
        // Plan A metrics
        [`${planA.companyName} Revenue`]: revA,
        [`${planA.companyName} EBITDA`]: ebitdaA,
        [`${planA.companyName} Gross Margin %`]: grossMarginA,
        [`${planA.companyName} EBITDA Margin %`]: ebitdaMarginA,
        [`${planA.companyName} Net Income`]: netIncomeA,
        [`${planA.companyName} Ending Cash`]: endingCashA,
        [`${planA.companyName} Free Cash Flow`]: freeCashA,
        [`${planA.companyName} CapEx`]: capexA,
        // Plan B metrics
        [`${planB.companyName} Revenue`]: revB,
        [`${planB.companyName} EBITDA`]: ebitdaB,
        [`${planB.companyName} Gross Margin %`]: grossMarginB,
        [`${planB.companyName} EBITDA Margin %`]: ebitdaMarginB,
        [`${planB.companyName} Net Income`]: netIncomeB,
        [`${planB.companyName} Ending Cash`]: endingCashB,
        [`${planB.companyName} Free Cash Flow`]: freeCashB,
        [`${planB.companyName} CapEx`]: capexB,
      };
    });
  }, [planA, planB, years]);

  // Valuation & Investor Metrics Comparison Data for BarChart
  const investorMetricsData = useMemo(() => {
    return [
      {
        metric: "Target Raise",
        [`${planA.companyName}`]: planA.financials.investorMetrics.totalFundingRequired / 1_000_000,
        [`${planB.companyName}`]: planB.financials.investorMetrics.totalFundingRequired / 1_000_000,
        unit: "$M",
      },
      {
        metric: "Pre-Money Valuation",
        [`${planA.companyName}`]: planA.financials.investorMetrics.preMoneyValuation / 1_000_000,
        [`${planB.companyName}`]: planB.financials.investorMetrics.preMoneyValuation / 1_000_000,
        unit: "$M",
      },
      {
        metric: "Runway (Months)",
        [`${planA.companyName}`]: planA.financials.investorMetrics.runwayMonths,
        [`${planB.companyName}`]: planB.financials.investorMetrics.runwayMonths,
        unit: "Mo",
      },
      {
        metric: "Projected IRR (%)",
        [`${planA.companyName}`]: planA.financials.investorMetrics.projectedIRR,
        [`${planB.companyName}`]: planB.financials.investorMetrics.projectedIRR,
        unit: "%",
      },
      {
        metric: "LTV / CAC Ratio",
        [`${planA.companyName}`]: planA.financials.investorMetrics.ltvCacRatio,
        [`${planB.companyName}`]: planB.financials.investorMetrics.ltvCacRatio,
        unit: "x",
      },
    ];
  }, [planA, planB]);

  // Custom Tooltip for Recharts
  const CustomRechartsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1.5 z-50">
          <p className="font-bold text-slate-300 border-b border-slate-700 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => {
            const isPercent = entry.name.includes("%");
            return (
              <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-300">{entry.name}:</span>
                </div>
                <span className="font-mono font-bold text-white">
                  {isPercent ? `${entry.value.toFixed(1)}%` : formatCurrency(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Color constants
  const PLAN_A_COLOR = "#059669"; // Emerald
  const PLAN_A_LIGHT = "#10B981";
  const PLAN_B_COLOR = "#4F46E5"; // Indigo
  const PLAN_B_LIGHT = "#6366F1";

  // Scorecard Delta items
  const y5RevDelta = calculateDelta(
    planA.financials.totalRevenue[4] || 0,
    planB.financials.totalRevenue[4] || 0
  );
  const raiseDelta = calculateDelta(
    planA.financials.investorMetrics.totalFundingRequired || 0,
    planB.financials.investorMetrics.totalFundingRequired || 0
  );
  const irrDelta = calculateDelta(
    planA.financials.investorMetrics.projectedIRR || 0,
    planB.financials.investorMetrics.projectedIRR || 0
  );
  const breakEvenDelta = calculateDelta(
    planA.financials.breakEven.breakEvenMonth || 0,
    planB.financials.breakEven.breakEvenMonth || 0
  );

  return (
    <div className="w-full space-y-6" id="split-view-container">
      {/* Top Split-View Header & Selector Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800 uppercase tracking-wider">
                Financial Split-View Mode
              </span>
              <span className="text-xs text-slate-400 font-mono">Side-by-Side Recharts Comparative Engine</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              Cross-Venture Financial Model Comparison
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
              Compare revenue trajectories, operating margins, cash burn reserves, and investor capitalization metrics between any two ventures in the Activity Hub.
            </p>
          </div>

          {/* Quick controls & toggle back */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Filter Toggles */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab("both")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "both"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Comprehensive (Charts & Tables)
              </button>
              <button
                onClick={() => setActiveTab("visuals")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "visuals"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Charts Only
              </button>
              <button
                onClick={() => setActiveTab("schedules")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "schedules"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Financial Tables Only
              </button>
            </div>

            {onCloseSplitView && (
              <button
                onClick={onCloseSplitView}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
              >
                Exit Split-View
              </button>
            )}
          </div>
        </div>

        {/* Dual Plan Selector Console */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4 items-center">
          {/* Plan A Selector (Left) */}
          <div className="md:col-span-5 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                Plan A (Base Benchmark)
              </span>
              <button
                onClick={() => onSelectPlanForStudio(planA.id)}
                className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1"
                title="Open Plan A in Document Studio"
              >
                <span>Studio View</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="relative">
              <select
                id="select-plan-a"
                value={planAId}
                onChange={(e) => setPlanAId(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isAttachedReference ? "★ (Attached Master)" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-2.5 pointer-events-none text-slate-400" />
            </div>

            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">{planA.companyName}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-mono">
                {planA.sector}
              </span>
            </div>
          </div>

          {/* Swap Button (Middle) */}
          <div className="md:col-span-2 flex flex-col items-center justify-center">
            <button
              id="btn-swap-plans"
              onClick={handleSwapPlans}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-all shadow-xs cursor-pointer group"
              title="Swap Plan A and Plan B"
            >
              <ArrowLeftRight className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
            </button>
            <span className="text-[10px] text-slate-400 font-mono mt-1">VS Comparison</span>
          </div>

          {/* Plan B Selector (Right) */}
          <div className="md:col-span-5 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/20">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                Plan B (Comparison Target)
              </span>
              <button
                onClick={() => onSelectPlanForStudio(planB.id)}
                className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 hover:underline flex items-center gap-1"
                title="Open Plan B in Document Studio"
              >
                <span>Studio View</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="relative">
              <select
                id="select-plan-b"
                value={planBId}
                onChange={(e) => setPlanBId(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isAttachedReference ? "★ (Attached Master)" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-2.5 pointer-events-none text-slate-400" />
            </div>

            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">{planB.companyName}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-mono">
                {planB.sector}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Comparison Scorecard Bento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1: Y5 Projected Revenue */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Year 5 Revenue</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>

          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold truncate max-w-[110px]">
                {planA.companyName}:
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(planA.financials.totalRevenue[4])}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-indigo-700 dark:text-indigo-400 font-semibold truncate max-w-[110px]">
                {planB.companyName}:
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(planB.financials.totalRevenue[4])}
              </span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
            <span className="text-slate-500 font-mono">Variance (B vs A)</span>
            <span
              className={`font-bold font-mono px-1.5 py-0.5 rounded ${
                y5RevDelta.diff >= 0
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
              }`}
            >
              {y5RevDelta.diff >= 0 ? "+" : ""}
              {y5RevDelta.percentDiff.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Metric 2: Total Target Raise */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Target Capital Raise</span>
            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
          </div>

          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold truncate max-w-[110px]">
                {planA.companyName}:
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(planA.financials.investorMetrics.totalFundingRequired)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-indigo-700 dark:text-indigo-400 font-semibold truncate max-w-[110px]">
                {planB.companyName}:
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(planB.financials.investorMetrics.totalFundingRequired)}
              </span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
            <span className="text-slate-500 font-mono">Difference</span>
            <span className="font-bold font-mono text-slate-700 dark:text-slate-300">
              {raiseDelta.diff >= 0 ? "+" : ""}
              {formatShortCurrency(raiseDelta.diff)}
            </span>
          </div>
        </div>

        {/* Metric 3: Projected 5-Yr IRR */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Projected 5-Yr IRR</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          </div>

          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold truncate max-w-[110px]">
                {planA.companyName}:
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {formatPercent(planA.financials.investorMetrics.projectedIRR)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-indigo-700 dark:text-indigo-400 font-semibold truncate max-w-[110px]">
                {planB.companyName}:
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {formatPercent(planB.financials.investorMetrics.projectedIRR)}
              </span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
            <span className="text-slate-500 font-mono">IRR Spread</span>
            <span
              className={`font-bold font-mono px-1.5 py-0.5 rounded ${
                irrDelta.diff >= 0
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
              }`}
            >
              {irrDelta.diff >= 0 ? "+" : ""}
              {irrDelta.diff.toFixed(1)}% pts
            </span>
          </div>
        </div>

        {/* Metric 4: Break-Even Month */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Break-Even Velocity</span>
            <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
          </div>

          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold truncate max-w-[110px]">
                {planA.companyName}:
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {planA.financials.breakEven.breakEvenMonth
                  ? `Month ${planA.financials.breakEven.breakEvenMonth}`
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-indigo-700 dark:text-indigo-400 font-semibold truncate max-w-[110px]">
                {planB.companyName}:
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {planB.financials.breakEven.breakEvenMonth
                  ? `Month ${planB.financials.breakEven.breakEvenMonth}`
                  : "N/A"}
              </span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
            <span className="text-slate-500 font-mono">Velocity Lead</span>
            <span className="font-bold font-mono text-slate-700 dark:text-slate-300">
              {breakEvenDelta.diff === 0
                ? "Identical"
                : breakEvenDelta.diff < 0
                ? `${Math.abs(breakEvenDelta.diff)} mo faster (Plan B)`
                : `${Math.abs(breakEvenDelta.diff)} mo faster (Plan A)`}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: RECHARTS VISUAL COMPARISON SUITE */}
      {(activeTab === "both" || activeTab === "visuals") && (
        <div className="space-y-6">
          {/* Chart Filter Navigation Tabs */}
          <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Interactive Recharts Financial Analytics
              </h3>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
              <button
                onClick={() => setActiveChartCategory("all")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeChartCategory === "all"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                All Visualizations
              </button>
              <button
                onClick={() => setActiveChartCategory("revenue")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeChartCategory === "revenue"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Revenue & EBITDA
              </button>
              <button
                onClick={() => setActiveChartCategory("margins")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeChartCategory === "margins"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Operating Margins (%)
              </button>
              <button
                onClick={() => setActiveChartCategory("cashflow")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeChartCategory === "cashflow"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Cash Reserves & FCF
              </button>
              <button
                onClick={() => setActiveChartCategory("valuation")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeChartCategory === "valuation"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Valuation & Unit Econ
              </button>
            </div>
          </div>

          {/* Grid of Recharts Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Revenue Trajectory (Grouped Bar Chart) */}
            {(activeChartCategory === "all" || activeChartCategory === "revenue") && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      5-Year Revenue Comparison (Pro-Forma Growth)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Side-by-side annual top-line revenue trajectories
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Grouped Bars
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis
                        tickFormatter={(val) => formatShortCurrency(val)}
                        tick={{ fontSize: 10 }}
                        width={60}
                      />
                      <Tooltip content={<CustomRechartsTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Bar
                        dataKey={`${planA.companyName} Revenue`}
                        name={`${planA.companyName} (Rev)`}
                        fill={PLAN_A_COLOR}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey={`${planB.companyName} Revenue`}
                        name={`${planB.companyName} (Rev)`}
                        fill={PLAN_B_COLOR}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Chart 2: EBITDA Comparison (Bar & Area / Line Chart) */}
            {(activeChartCategory === "all" || activeChartCategory === "revenue") && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Operating EBITDA Growth Trajectory
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Earnings before interest, taxes, depreciation, and amortization
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Dual Curves
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={comparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis
                        tickFormatter={(val) => formatShortCurrency(val)}
                        tick={{ fontSize: 10 }}
                        width={60}
                      />
                      <Tooltip content={<CustomRechartsTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Line
                        type="monotone"
                        dataKey={`${planA.companyName} EBITDA`}
                        name={`${planA.companyName} (EBITDA)`}
                        stroke={PLAN_A_COLOR}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: PLAN_A_COLOR }}
                      />
                      <Line
                        type="monotone"
                        dataKey={`${planB.companyName} EBITDA`}
                        name={`${planB.companyName} (EBITDA)`}
                        stroke={PLAN_B_COLOR}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: PLAN_B_COLOR }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Chart 3: Margins Efficiency Comparison (LineChart) */}
            {(activeChartCategory === "all" || activeChartCategory === "margins") && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Gross vs EBITDA Margin Efficiency (%)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Unit economic scale and operational leverage expansion
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Margin %
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={comparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis
                        tickFormatter={(val) => `${val}%`}
                        tick={{ fontSize: 10 }}
                        width={45}
                      />
                      <Tooltip content={<CustomRechartsTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Line
                        type="monotone"
                        dataKey={`${planA.companyName} Gross Margin %`}
                        name={`${planA.companyName} (Gross %)`}
                        stroke={PLAN_A_COLOR}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey={`${planA.companyName} EBITDA Margin %`}
                        name={`${planA.companyName} (EBITDA %)`}
                        stroke={PLAN_A_LIGHT}
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey={`${planB.companyName} Gross Margin %`}
                        name={`${planB.companyName} (Gross %)`}
                        stroke={PLAN_B_COLOR}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey={`${planB.companyName} EBITDA Margin %`}
                        name={`${planB.companyName} (EBITDA %)`}
                        stroke={PLAN_B_LIGHT}
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Chart 4: Ending Cash Balance & Reserves (AreaChart) */}
            {(activeChartCategory === "all" || activeChartCategory === "cashflow") && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Liquidity & Ending Cash Reserves ($)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Cumulative treasury balance after CapEx and operating burn
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Area Trend
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={comparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <defs>
                        <linearGradient id="colorCashA" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={PLAN_A_COLOR} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={PLAN_A_COLOR} stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorCashB" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={PLAN_B_COLOR} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={PLAN_B_COLOR} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis
                        tickFormatter={(val) => formatShortCurrency(val)}
                        tick={{ fontSize: 10 }}
                        width={60}
                      />
                      <Tooltip content={<CustomRechartsTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Area
                        type="monotone"
                        dataKey={`${planA.companyName} Ending Cash`}
                        name={`${planA.companyName} (Cash)`}
                        stroke={PLAN_A_COLOR}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorCashA)"
                      />
                      <Area
                        type="monotone"
                        dataKey={`${planB.companyName} Ending Cash`}
                        name={`${planB.companyName} (Cash)`}
                        stroke={PLAN_B_COLOR}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorCashB)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Chart 5: Investor Metrics Comparison (Grouped Bar Chart) */}
            {(activeChartCategory === "all" || activeChartCategory === "valuation") && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Capitalization & Investor Multiples Comparison
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Benchmark key underwriting metrics: Capital asks ($M), Pre-Money Valuations ($M), Runway (Mo), and IRR (%)
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Comparative Benchmarks
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={investorMetricsData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 10 }} width={45} />
                      <Tooltip
                        formatter={(value: any, name: any, item: any) => [
                          `${value} ${item.payload.unit}`,
                          name,
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Bar
                        dataKey={`${planA.companyName}`}
                        fill={PLAN_A_COLOR}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey={`${planB.companyName}`}
                        fill={PLAN_B_COLOR}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: DETAILED SIDE-BY-SIDE FINANCIAL SCHEDULES TABLE */}
      {(activeTab === "both" || activeTab === "schedules") && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                Side-by-Side Financial Statement Schedules
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full 5-Year line-item variance comparison between {planA.companyName} and {planB.companyName}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportFinancialsToExcel(planA)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-300 dark:border-emerald-800 transition-colors"
                title="Export Plan A Financials to Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Plan A (.xlsx)</span>
              </button>

              <button
                onClick={() => exportFinancialsToExcel(planB)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg border border-indigo-300 dark:border-indigo-800 transition-colors"
                title="Export Plan B Financials to Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Plan B (.xlsx)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
                  <th className="py-2.5 px-3 text-left font-semibold">Financial Line Item</th>
                  <th className="py-2.5 px-3 text-left font-semibold">Venture Entity</th>
                  {years.map((yr) => (
                    <th key={yr} className="py-2.5 px-3 text-right font-mono font-semibold">
                      {yr.replace("Year ", "Y")}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right font-mono font-semibold">Y5 Spread (B vs A)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* Total Revenue Group */}
                <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                  <td rowSpan={2} className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-100 dark:border-slate-800">
                    Total Gross Revenue
                  </td>
                  <td className="py-2 px-3 font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    {planA.companyName}
                  </td>
                  {planA.financials.totalRevenue.map((val, idx) => (
                    <td key={idx} className="py-2 px-3 text-right font-mono text-slate-800 dark:text-slate-200">
                      {formatCurrency(val)}
                    </td>
                  ))}
                  <td rowSpan={2} className="py-2 px-3 text-right font-mono font-bold border-l border-slate-100 dark:border-slate-800">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        y5RevDelta.diff >= 0
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      }`}
                    >
                      {y5RevDelta.diff >= 0 ? "+" : ""}
                      {formatShortCurrency(y5RevDelta.diff)}
                    </span>
                  </td>
                </tr>
                <tr className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                  <td className="py-2 px-3 font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    {planB.companyName}
                  </td>
                  {planB.financials.totalRevenue.map((val, idx) => (
                    <td key={idx} className="py-2 px-3 text-right font-mono text-slate-800 dark:text-slate-200">
                      {formatCurrency(val)}
                    </td>
                  ))}
                </tr>

                {/* Gross Margin % Group */}
                <tr>
                  <td rowSpan={2} className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800">
                    Gross Margin (%)
                  </td>
                  <td className="py-2 px-3 text-emerald-700 dark:text-emerald-400 font-medium">
                    {planA.companyName}
                  </td>
                  {planA.financials.grossMarginPercent.map((val, idx) => (
                    <td key={idx} className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatPercent(val)}
                    </td>
                  ))}
                  <td rowSpan={2} className="py-2 px-3 text-right font-mono font-semibold border-l border-slate-100 dark:border-slate-800">
                    {((planB.financials.grossMarginPercent[4] || 0) - (planA.financials.grossMarginPercent[4] || 0) >= 0 ? "+" : "")}
                    {((planB.financials.grossMarginPercent[4] || 0) - (planA.financials.grossMarginPercent[4] || 0)).toFixed(1)}% pts
                  </td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <td className="py-2 px-3 text-indigo-700 dark:text-indigo-400 font-medium">
                    {planB.companyName}
                  </td>
                  {planB.financials.grossMarginPercent.map((val, idx) => (
                    <td key={idx} className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatPercent(val)}
                    </td>
                  ))}
                </tr>

                {/* Operating EBITDA Group */}
                <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                  <td rowSpan={2} className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-100 dark:border-slate-800">
                    Operating EBITDA
                  </td>
                  <td className="py-2 px-3 font-semibold text-emerald-700 dark:text-emerald-400">
                    {planA.companyName}
                  </td>
                  {planA.financials.ebitda.map((val, idx) => (
                    <td key={idx} className="py-2 px-3 text-right font-mono font-medium text-slate-800 dark:text-slate-200">
                      {formatCurrency(val)}
                    </td>
                  ))}
                  <td rowSpan={2} className="py-2 px-3 text-right font-mono font-bold border-l border-slate-100 dark:border-slate-800">
                    {formatShortCurrency((planB.financials.ebitda[4] || 0) - (planA.financials.ebitda[4] || 0))}
                  </td>
                </tr>
                <tr className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                  <td className="py-2 px-3 font-semibold text-indigo-700 dark:text-indigo-400">
                    {planB.companyName}
                  </td>
                  {planB.financials.ebitda.map((val, idx) => (
                    <td key={idx} className="py-2 px-3 text-right font-mono font-medium text-slate-800 dark:text-slate-200">
                      {formatCurrency(val)}
                    </td>
                  ))}
                </tr>

                {/* Net Income Group */}
                <tr>
                  <td rowSpan={2} className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800">
                    Net Income (After Tax)
                  </td>
                  <td className="py-2 px-3 text-emerald-700 dark:text-emerald-400 font-medium">
                    {planA.companyName}
                  </td>
                  {planA.financials.netIncome.map((val, idx) => (
                    <td key={idx} className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatCurrency(val)}
                    </td>
                  ))}
                  <td rowSpan={2} className="py-2 px-3 text-right font-mono font-semibold border-l border-slate-100 dark:border-slate-800">
                    {formatShortCurrency((planB.financials.netIncome[4] || 0) - (planA.financials.netIncome[4] || 0))}
                  </td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <td className="py-2 px-3 text-indigo-700 dark:text-indigo-400 font-medium">
                    {planB.companyName}
                  </td>
                  {planB.financials.netIncome.map((val, idx) => (
                    <td key={idx} className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatCurrency(val)}
                    </td>
                  ))}
                </tr>

                {/* Ending Cash Balance Group */}
                <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                  <td rowSpan={2} className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-100 dark:border-slate-800">
                    Ending Cash Balance
                  </td>
                  <td className="py-2 px-3 font-semibold text-emerald-700 dark:text-emerald-400">
                    {planA.companyName}
                  </td>
                  {(planA.financials.cashFlow?.endingCashBalance || [0, 0, 0, 0, 0]).map((val, idx) => (
                    <td key={idx} className="py-2 px-3 text-right font-mono text-slate-800 dark:text-slate-200">
                      {formatCurrency(val)}
                    </td>
                  ))}
                  <td rowSpan={2} className="py-2 px-3 text-right font-mono font-bold border-l border-slate-100 dark:border-slate-800">
                    {formatShortCurrency(
                      (planB.financials.cashFlow?.endingCashBalance?.[4] || 0) -
                        (planA.financials.cashFlow?.endingCashBalance?.[4] || 0)
                    )}
                  </td>
                </tr>
                <tr className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                  <td className="py-2 px-3 font-semibold text-indigo-700 dark:text-indigo-400">
                    {planB.companyName}
                  </td>
                  {(planB.financials.cashFlow?.endingCashBalance || [0, 0, 0, 0, 0]).map((val, idx) => (
                    <td key={idx} className="py-2 px-3 text-right font-mono text-slate-800 dark:text-slate-200">
                      {formatCurrency(val)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table summary note */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>
                All pro-forma calculations are verified against GAAP and standard Activity Hub financial schedules.
              </span>
            </div>
            <span className="font-mono text-[10px]">
              Currency: USD ($) • Model Revision: Standardized Investor Format
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
