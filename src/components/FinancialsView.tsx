import React, { useState } from "react";
import { FinancialData, BusinessPlan } from "../types";
import { CompactFinancialGraphs } from "./CompactFinancialGraphs";
import { WhatIfScenarioWorkbench } from "./WhatIfScenarioWorkbench";
import { YearlyRevenueHeatmap } from "./YearlyRevenueHeatmap";
import {
  AlertTriangle,
  Sparkles,
  Download,
  Copy,
  Check,
  TrendingUp,
  DollarSign,
  PieChart,
  ShieldCheck,
  ArrowUpRight,
  Layers,
  Sliders,
  ChevronDown,
  ChevronUp,
  Flame,
} from "lucide-react";

interface FinancialsViewProps {
  plan: BusinessPlan;
  onUpdatePlan?: (updated: BusinessPlan) => void;
  onVerifyAndComplete?: () => void;
  isVerifying?: boolean;
}

export const FinancialsView: React.FC<FinancialsViewProps> = ({
  plan,
  onUpdatePlan,
  onVerifyAndComplete,
  isVerifying = false,
}) => {
  const [activeTab, setActiveTab] = useState<"pnl" | "cashflow" | "uniteconomics" | "heatmap">("pnl");
  const [copied, setCopied] = useState(false);
  const [showWhatIfWorkbench, setShowWhatIfWorkbench] = useState(true);
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  const { financials } = plan;
  const years = financials.years || ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"];
  const hasMissing = financials.missingFields && financials.missingFields.length > 0;

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined || val === null) return "$0";
    const prefix = val < 0 ? "-$" : "$";
    const abs = Math.abs(val);
    if (abs >= 1000000) return `${prefix}${(abs / 1000000).toFixed(2)}M`;
    if (abs >= 1000) return `${prefix}${(abs / 1000).toFixed(0)}K`;
    return `${prefix}${abs.toLocaleString()}`;
  };

  const formatPercent = (val: number | undefined) => {
    if (val === undefined || val === null) return "0.0%";
    return `${val.toFixed(1)}%`;
  };

  const handleCopyTable = () => {
    const textRows: string[] = [];
    if (activeTab === "heatmap") {
      textRows.push(["Revenue Segment", "Category", ...years, "5-Yr CAGR", "Total Expansion"].join("\t"));
      financials.revenueStreams.forEach((stream) => {
        const y1 = stream.values[0] || 0;
        const yLast = stream.values[stream.values.length - 1] || 0;
        const cagr =
          y1 > 0 && yLast > 0
            ? (Math.pow(yLast / y1, 1 / Math.max(1, stream.values.length - 1)) - 1) * 100
            : 0;
        const totalGrowth = yLast - y1;
        textRows.push(
          [
            stream.name,
            stream.category,
            ...stream.values.map((v) => v.toString()),
            `+${cagr.toFixed(1)}%`,
            totalGrowth.toString(),
          ].join("\t")
        );
      });
      textRows.push([
        "Consolidated Total Revenue",
        "Total",
        ...financials.totalRevenue.map((v) => v.toString()),
        "-",
        (financials.totalRevenue[financials.totalRevenue.length - 1] - financials.totalRevenue[0]).toString(),
      ].join("\t"));
    } else {
      textRows.push(["Line Item", ...years].join("\t"));
      textRows.push(["Total Revenue", ...financials.totalRevenue.map((v) => v.toString())].join("\t"));
      textRows.push(["Gross Profit", ...financials.grossProfit.map((v) => v.toString())].join("\t"));
      textRows.push(["EBITDA", ...financials.ebitda.map((v) => v.toString())].join("\t"));
      textRows.push(["Net Income", ...financials.netIncome.map((v) => v.toString())].join("\t"));
    }

    navigator.clipboard.writeText(textRows.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full space-y-4">
      {/* Missing Data Alert Banner if plan has incomplete metrics */}
      {hasMissing && (
        <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-700/80 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-200 dark:bg-amber-900/80 text-amber-800 dark:text-amber-300 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Missing Financial Data Detected in Business Plan
                </h4>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-mono">
                  {financials.missingFields.length} Unresolved Fields
                </span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5">
                Target business plan lacks complete 5-year projections found in the Attached Reference Model:
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {financials.missingFields.map((field, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/80 dark:bg-slate-900/80 text-amber-900 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60"
                  >
                    • {field}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {onVerifyAndComplete && (
            <button
              onClick={onVerifyAndComplete}
              disabled={isVerifying}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm transition-all shrink-0 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isVerifying ? "Verifying with Attached Plan..." : "Auto-Fill & Verify Financials"}
            </button>
          )}
        </div>
      )}

      {/* Top Institutional KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-500 font-medium">Y5 Target Revenue</span>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
            {formatCurrency(financials.totalRevenue[financials.totalRevenue.length - 1])}
          </p>
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
            <ArrowUpRight className="w-2.5 h-2.5" /> High Growth
          </span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-500 font-medium">Y5 Gross Margin</span>
          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
            {formatPercent(financials.grossMarginPercent[financials.grossMarginPercent.length - 1])}
          </p>
          <span className="text-[9px] text-slate-500">Software & IP</span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-500 font-medium">Y5 EBITDA</span>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
            {formatCurrency(financials.ebitda[financials.ebitda.length - 1])}
          </p>
          <span className="text-[9px] text-slate-500">
            {formatPercent(financials.ebitdaMarginPercent[financials.ebitdaMarginPercent.length - 1])} margin
          </span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-500 font-medium">Break-Even</span>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
            {financials.breakEven?.breakEvenMonth ? `Month ${financials.breakEven.breakEvenMonth}` : "TBD"}
          </p>
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">Self-Sustaining</span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-500 font-medium">Projected IRR</span>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
            {financials.investorMetrics?.projectedIRR ? `${financials.investorMetrics.projectedIRR}%` : "Pending"}
          </p>
          <span className="text-[9px] text-slate-500">5-Year Horizon</span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-500 font-medium">Target Return</span>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
            {financials.investorMetrics?.projectedROI || "N/A"}
          </p>
          <span className="text-[9px] text-slate-500">Exit Multiple</span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-500 font-medium">Cash Runway</span>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
            {financials.investorMetrics?.runwayMonths || 18} Months
          </p>
          <span className="text-[9px] text-slate-500">Funded Runway</span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-500 font-medium">Round Target</span>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
            {formatCurrency(financials.investorMetrics?.totalFundingRequired)}
          </p>
          <span className="text-[9px] text-slate-500">
            Val: {formatCurrency(financials.investorMetrics?.preMoneyValuation)}
          </span>
        </div>
      </div>

      {/* What-If Scenario Analysis Tool & Projections Overlay */}
      {appliedToast && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-2 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{appliedToast}</span>
          </div>
          <button
            onClick={() => setAppliedToast(null)}
            className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 font-bold px-1.5 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* What-If Scenario Workbench Toggle Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-emerald-500/10 via-indigo-500/5 to-slate-50 dark:from-emerald-950/40 dark:via-indigo-950/20 dark:to-slate-900 rounded-xl border border-emerald-300/80 dark:border-emerald-700/60 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                What-If Scenario Analysis & Growth Stress-Test
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold border border-emerald-300 dark:border-emerald-800">
                5-Year Chart Overlay
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Simulate revenue growth, ARPU pricing, and cost variables to instantly recalculate EBITDA and capital runway.
            </p>
          </div>
        </div>

        <button
          id="btn-toggle-whatif-workbench"
          onClick={() => setShowWhatIfWorkbench(!showWhatIfWorkbench)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-emerald-300 dark:border-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
        >
          <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{showWhatIfWorkbench ? "Collapse What-If Tool" : "Open What-If Tool"}</span>
          {showWhatIfWorkbench ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded What-If Scenario Workbench */}
      {showWhatIfWorkbench && (
        <WhatIfScenarioWorkbench
          baselineFinancials={financials}
          onApplyScenario={(recalc) => {
            if (onUpdatePlan) {
              onUpdatePlan({
                ...plan,
                financials: recalc,
              });
              setAppliedToast("Recalculated What-If scenario projections successfully applied to Business Plan!");
              setTimeout(() => setAppliedToast(null), 4500);
            }
          }}
          onClose={() => setShowWhatIfWorkbench(false)}
        />
      )}

      {/* Space-Optimized Compact Financial Graphs */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Compact Financial Trajectory & Capital Metrics
            </h3>
            <span className="text-[10px] text-slate-500 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
              Optimized for Document Layout
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-quick-view-heatmap"
              onClick={() => {
                setActiveTab("heatmap");
                const el = document.getElementById("statement-table-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300/80 dark:border-emerald-800 rounded-lg transition-colors cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Revenue Heatmap</span>
              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
            </button>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              5-Year Projection Model
            </span>
          </div>
        </div>
        <CompactFinancialGraphs financials={financials} scale={plan.formatSettings.graphScale} />
      </div>

      {/* Financial Statement Tables Section */}
      <div
        id="statement-table-section"
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
      >
        {/* Table Top Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          {/* Statement Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-lg flex-wrap">
            <button
              id="tab-pnl"
              onClick={() => setActiveTab("pnl")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "pnl"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Income Statement (P&L)
            </button>
            <button
              id="tab-heatmap"
              onClick={() => setActiveTab("heatmap")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "heatmap"
                  ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-emerald-500" />
              <span>Revenue Heatmap (Segments)</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold">
                Intensity
              </span>
            </button>
            <button
              id="tab-cashflow"
              onClick={() => setActiveTab("cashflow")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "cashflow"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Cash Flow Statement
            </button>
            <button
              id="tab-uniteconomics"
              onClick={() => setActiveTab("uniteconomics")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "uniteconomics"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Break-Even & Unit Economics
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTable}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 shadow-2xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Values"}
            </button>
          </div>
        </div>

        {/* Tab 1: P&L Statement */}
        {activeTab === "pnl" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4 font-semibold w-1/3">Financial Line Item</th>
                  {years.map((yr, idx) => (
                    <th key={idx} className="py-2.5 px-3 text-right font-mono font-semibold">
                      {yr}
                    </th>
                  ))}
                  <th className="py-2.5 px-4 text-right font-mono font-semibold">5-Yr Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {/* Revenue Streams Header */}
                <tr className="bg-slate-50/50 dark:bg-slate-800/20 font-semibold text-[11px] text-slate-700 dark:text-slate-300">
                  <td colSpan={years.length + 2} className="py-2 px-4 uppercase tracking-wider text-[10px]">
                    Revenue Breakdown
                  </td>
                </tr>
                {financials.revenueStreams.map((stream, idx) => (
                  <tr key={`rev-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-4 pl-6 text-slate-600 dark:text-slate-400">
                      {stream.name}
                      <span className="ml-1.5 text-[9px] text-slate-400 font-mono">({stream.category})</span>
                    </td>
                    {stream.values.map((v, vIdx) => (
                      <td key={vIdx} className="py-2 px-3 text-right font-mono">
                        {formatCurrency(v)}
                      </td>
                    ))}
                    <td className="py-2 px-4 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {formatCurrency(stream.values.reduce((a, b) => a + b, 0))}
                    </td>
                  </tr>
                ))}

                {/* Total Revenue */}
                <tr className="bg-emerald-50/50 dark:bg-emerald-950/20 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                  <td className="py-2.5 px-4 text-emerald-900 dark:text-emerald-300">Total Net Revenue</td>
                  {financials.totalRevenue.map((v, idx) => (
                    <td key={idx} className="py-2.5 px-3 text-right font-mono text-emerald-900 dark:text-emerald-300">
                      {formatCurrency(v)}
                    </td>
                  ))}
                  <td className="py-2.5 px-4 text-right font-mono text-emerald-900 dark:text-emerald-300">
                    {formatCurrency(financials.totalRevenue.reduce((a, b) => a + b, 0))}
                  </td>
                </tr>

                {/* COGS Section */}
                <tr className="bg-slate-50/50 dark:bg-slate-800/20 font-semibold text-[11px] text-slate-700 dark:text-slate-300">
                  <td colSpan={years.length + 2} className="py-2 px-4 uppercase tracking-wider text-[10px]">
                    Cost of Goods Sold (COGS)
                  </td>
                </tr>
                {financials.cogs.map((item, idx) => (
                  <tr key={`cogs-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-4 pl-6 text-slate-600 dark:text-slate-400">{item.category}</td>
                    {item.values.map((v, vIdx) => (
                      <td key={vIdx} className="py-2 px-3 text-right font-mono text-rose-600/90 dark:text-rose-400">
                        {formatCurrency(v)}
                      </td>
                    ))}
                    <td className="py-2 px-4 text-right font-mono text-rose-600/90 dark:text-rose-400">
                      {formatCurrency(item.values.reduce((a, b) => a + b, 0))}
                    </td>
                  </tr>
                ))}

                {/* Gross Profit & Margin */}
                <tr className="bg-indigo-50/40 dark:bg-indigo-950/20 font-bold border-t border-slate-200 dark:border-slate-700">
                  <td className="py-2 px-4 text-indigo-900 dark:text-indigo-300">Gross Profit</td>
                  {financials.grossProfit.map((v, idx) => (
                    <td key={idx} className="py-2 px-3 text-right font-mono text-indigo-900 dark:text-indigo-300">
                      {formatCurrency(v)}
                    </td>
                  ))}
                  <td className="py-2 px-4 text-right font-mono text-indigo-900 dark:text-indigo-300">
                    {formatCurrency(financials.grossProfit.reduce((a, b) => a + b, 0))}
                  </td>
                </tr>
                <tr className="bg-indigo-50/20 dark:bg-indigo-950/10 text-[11px] italic">
                  <td className="py-1 px-4 pl-6 text-indigo-700 dark:text-indigo-400">Gross Margin %</td>
                  {financials.grossMarginPercent.map((m, idx) => (
                    <td key={idx} className="py-1 px-3 text-right font-mono text-indigo-700 dark:text-indigo-400">
                      {formatPercent(m)}
                    </td>
                  ))}
                  <td className="py-1 px-4 text-right font-mono text-indigo-700 dark:text-indigo-400">-</td>
                </tr>

                {/* Operating Expenses */}
                <tr className="bg-slate-50/50 dark:bg-slate-800/20 font-semibold text-[11px] text-slate-700 dark:text-slate-300">
                  <td colSpan={years.length + 2} className="py-2 px-4 uppercase tracking-wider text-[10px]">
                    Operating Expenses (OPEX)
                  </td>
                </tr>
                {financials.operatingExpenses.map((exp, idx) => (
                  <tr key={`opex-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-4 pl-6 text-slate-600 dark:text-slate-400">{exp.category}</td>
                    {exp.values.map((v, vIdx) => (
                      <td key={vIdx} className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        {formatCurrency(v)}
                      </td>
                    ))}
                    <td className="py-2 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                      {formatCurrency(exp.values.reduce((a, b) => a + b, 0))}
                    </td>
                  </tr>
                ))}

                {/* EBITDA */}
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 font-bold border-t border-slate-200 dark:border-slate-700">
                  <td className="py-2.5 px-4 text-slate-900 dark:text-slate-100">EBITDA (Operating Earnings)</td>
                  {financials.ebitda.map((v, idx) => (
                    <td
                      key={idx}
                      className={`py-2.5 px-3 text-right font-mono ${
                        v < 0 ? "text-rose-600" : "text-emerald-600 dark:text-emerald-400 font-bold"
                      }`}
                    >
                      {formatCurrency(v)}
                    </td>
                  ))}
                  <td className="py-2.5 px-4 text-right font-mono">
                    {formatCurrency(financials.ebitda.reduce((a, b) => a + b, 0))}
                  </td>
                </tr>

                {/* Depreciation & Amortization */}
                <tr className="text-slate-600 dark:text-slate-400">
                  <td className="py-2 px-4 pl-6">Less: Depreciation & Amortization (D&A)</td>
                  {financials.depreciationAmortization.map((v, idx) => (
                    <td key={idx} className="py-2 px-3 text-right font-mono">
                      {formatCurrency(v)}
                    </td>
                  ))}
                  <td className="py-2 px-4 text-right font-mono">
                    {formatCurrency(financials.depreciationAmortization.reduce((a, b) => a + b, 0))}
                  </td>
                </tr>

                {/* EBIT */}
                <tr className="font-semibold text-slate-700 dark:text-slate-300">
                  <td className="py-2 px-4 pl-6">Operating Profit (EBIT)</td>
                  {financials.ebit.map((v, idx) => (
                    <td key={idx} className="py-2 px-3 text-right font-mono">
                      {formatCurrency(v)}
                    </td>
                  ))}
                  <td className="py-2 px-4 text-right font-mono">
                    {formatCurrency(financials.ebit.reduce((a, b) => a + b, 0))}
                  </td>
                </tr>

                {/* Tax */}
                <tr className="text-slate-600 dark:text-slate-400">
                  <td className="py-2 px-4 pl-6">Income Tax Provision</td>
                  {financials.tax.map((v, idx) => (
                    <td key={idx} className="py-2 px-3 text-right font-mono text-slate-500">
                      {formatCurrency(v)}
                    </td>
                  ))}
                  <td className="py-2 px-4 text-right font-mono text-slate-500">
                    {formatCurrency(financials.tax.reduce((a, b) => a + b, 0))}
                  </td>
                </tr>

                {/* Net Income */}
                <tr className="bg-emerald-100/60 dark:bg-emerald-950/40 font-bold border-t-2 border-emerald-500 text-sm">
                  <td className="py-3 px-4 text-emerald-950 dark:text-emerald-200">Net Profit / (Loss)</td>
                  {financials.netIncome.map((v, idx) => (
                    <td
                      key={idx}
                      className={`py-3 px-3 text-right font-mono font-bold ${
                        v < 0 ? "text-rose-700 dark:text-rose-400" : "text-emerald-800 dark:text-emerald-300"
                      }`}
                    >
                      {formatCurrency(v)}
                    </td>
                  ))}
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-950 dark:text-emerald-200">
                    {formatCurrency(financials.netIncome.reduce((a, b) => a + b, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Cash Flow Statement */}
        {activeTab === "cashflow" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4 font-semibold w-1/3">Cash Flow Component</th>
                  {years.map((yr, idx) => (
                    <th key={idx} className="py-2.5 px-3 text-right font-mono font-semibold">
                      {yr}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-medium">Operating Cash Flow (OCF)</td>
                  {financials.cashFlow.operatingCashFlow.map((v, idx) => (
                    <td key={idx} className="py-2.5 px-3 text-right font-mono">
                      {formatCurrency(v)}
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-medium">Capital Expenditures (CapEx & Hardware)</td>
                  {financials.cashFlow.capex.map((v, idx) => (
                    <td key={idx} className="py-2.5 px-3 text-right font-mono text-rose-600">
                      -{formatCurrency(v)}
                    </td>
                  ))}
                </tr>

                <tr className="bg-sky-50/50 dark:bg-sky-950/20 font-bold border-t border-slate-200 dark:border-slate-700">
                  <td className="py-2.5 px-4 text-sky-900 dark:text-sky-300">Free Cash Flow to Firm (FCF)</td>
                  {financials.cashFlow.freeCashFlow.map((v, idx) => (
                    <td key={idx} className="py-2.5 px-3 text-right font-mono text-sky-900 dark:text-sky-300">
                      {formatCurrency(v)}
                    </td>
                  ))}
                </tr>

                <tr className="bg-amber-50/60 dark:bg-amber-950/40 font-bold border-t-2 border-amber-400 text-sm">
                  <td className="py-3 px-4 text-amber-950 dark:text-amber-200">Ending Cash Balance (Reserves)</td>
                  {financials.cashFlow.endingCashBalance.map((v, idx) => (
                    <td key={idx} className="py-3 px-3 text-right font-mono text-amber-950 dark:text-amber-200 font-bold">
                      {formatCurrency(v)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Unit Economics & Break-Even */}
        {activeTab === "uniteconomics" && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Venture Capital Unit Economics
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Customer Acquisition Cost (CAC)</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(financials.investorMetrics.cac)}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Customer Lifetime Value (LTV)</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(financials.investorMetrics.ltv)}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">LTV / CAC Ratio</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {financials.investorMetrics.ltvCacRatio > 0 ? `${financials.investorMetrics.ltvCacRatio}x` : "Unverified"}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">CAC Payback Period</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {financials.investorMetrics.paybackPeriodMonths || "N/A"} Months
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-amber-600" />
                Break-Even & Burn Rate Sensitivity
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Monthly Operating Burn Rate</span>
                  <span className="font-mono font-bold text-rose-600">
                    {formatCurrency(financials.breakEven.monthlyBurn)} / month
                  </span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Break-Even Timeline</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {financials.breakEven.breakEvenMonth ? `Month ${financials.breakEven.breakEvenMonth}` : "TBD"}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Break-Even Monthly Revenue</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(financials.breakEven.breakEvenRevenue)} / month
                  </span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Target Enterprise Unit Volume</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {financials.breakEven.targetUnits?.toLocaleString() || "N/A"} active contracts
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Yearly Revenue Heatmap */}
        {activeTab === "heatmap" && (
          <div className="p-3 sm:p-5">
            <YearlyRevenueHeatmap financials={financials} />
          </div>
        )}
      </div>
    </div>
  );
};
