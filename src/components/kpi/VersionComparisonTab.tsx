import React, { useState } from "react";
import { BusinessPlan, SnapshotComparisonSummary, MetricVariance } from "../../types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Flame,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Users,
  Target,
  Plus,
  GitCompare,
  SlidersHorizontal,
  FileSpreadsheet,
  Info,
  DollarSign,
  Calendar,
} from "lucide-react";

interface VersionComparisonTabProps {
  plan: BusinessPlan;
  summary: SnapshotComparisonSummary;
  thresholdPercent: number;
  onOpenCreateSnapshot: () => void;
  fmtCurrency: (val: number | undefined) => string;
  fmtPercent: (val: number | undefined) => string;
}

export const VersionComparisonTab: React.FC<VersionComparisonTabProps> = ({
  plan,
  summary,
  thresholdPercent,
  onOpenCreateSnapshot,
  fmtCurrency,
  fmtPercent,
}) => {
  const [filter, setFilter] = useState<"all" | "significant" | "unfavorable" | "favorable">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const burn = summary.burnRateVariance;

  // Filtered variances for the audit table
  const filteredVariances = summary.variances.filter((v) => {
    if (filter === "significant" && !v.isSignificant) return false;
    if (filter === "unfavorable" && v.impactDirection !== "unfavorable") return false;
    if (filter === "favorable" && v.impactDirection !== "favorable") return false;
    if (categoryFilter !== "all" && v.category !== categoryFilter) return false;
    return true;
  });

  // Prepare data for the side-by-side grouped bar chart
  const chartMetrics = [
    {
      key: "monthlyBurn",
      label: "Monthly Burn ($K)",
      prev: Math.round(summary.burnRateVariance.previousVal / 1000),
      curr: Math.round(summary.burnRateVariance.currentVal / 1000),
      unit: "$K/mo",
      pct: summary.burnRateVariance.percentChange,
    },
    {
      key: "cac",
      label: "CAC ($)",
      prev: summary.variances.find((v) => v.key === "cac")?.previousVal || 0,
      curr: summary.variances.find((v) => v.key === "cac")?.currentVal || 0,
      unit: "$",
      pct: summary.variances.find((v) => v.key === "cac")?.percentChange || 0,
    },
    {
      key: "runwayMonths",
      label: "Runway (Mos)",
      prev: summary.variances.find((v) => v.key === "runwayMonths")?.previousVal || 0,
      curr: summary.variances.find((v) => v.key === "runwayMonths")?.currentVal || 0,
      unit: "mo",
      pct: summary.variances.find((v) => v.key === "runwayMonths")?.percentChange || 0,
    },
    {
      key: "breakEvenMonth",
      label: "Break-Even (M)",
      prev: summary.variances.find((v) => v.key === "breakEvenMonth")?.previousVal || 0,
      curr: summary.variances.find((v) => v.key === "breakEvenMonth")?.currentVal || 0,
      unit: "mo",
      pct: summary.variances.find((v) => v.key === "breakEvenMonth")?.percentChange || 0,
    },
    {
      key: "totalRevenueY1",
      label: "Y1 ARR ($10K)",
      prev: Math.round((summary.variances.find((v) => v.key === "totalRevenueY1")?.previousVal || 0) / 10000),
      curr: Math.round((summary.variances.find((v) => v.key === "totalRevenueY1")?.currentVal || 0) / 10000),
      unit: "$10K",
      pct: summary.variances.find((v) => v.key === "totalRevenueY1")?.percentChange || 0,
    },
  ];

  const cacVariance = summary.variances.find((v) => v.key === "cac");
  const y1RevVariance = summary.variances.find((v) => v.key === "totalRevenueY1");
  const runwayVariance = summary.variances.find((v) => v.key === "runwayMonths");

  const formatMetricVal = (val: number, unit: MetricVariance["unit"]) => {
    switch (unit) {
      case "currency":
        return fmtCurrency(val);
      case "percent":
        return fmtPercent(val);
      case "months":
        return `${Math.round(val)} Months`;
      case "ratio":
        return `${val.toFixed(1)}x`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. PRIMARY BURN RATE FLUCTUATION SPOTLIGHT HERO CARD */}
      <div
        id="kpi-burn-rate-spotlight"
        className={`p-5 rounded-2xl border transition-all ${
          burn.isSignificant && burn.impactDirection === "unfavorable"
            ? "bg-amber-500/10 dark:bg-amber-950/30 border-amber-400 dark:border-amber-700 shadow-sm"
            : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500 text-slate-950">
                <Flame className="w-4 h-4" />
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                Burn Rate Fluctuation Audit (Targeted Variance Monitor)
              </span>
              {burn.isSignificant && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 animate-pulse">
                  &gt;{thresholdPercent}% Fluctuation Alert
                </span>
              )}
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {burn.isSignificant && burn.impactDirection === "unfavorable"
                ? `Net Monthly Burn Increased by +${Math.abs(burn.percentChange).toFixed(1)}% vs ${summary.snapshotLabel}`
                : `Net Monthly Burn: ${burn.percentChange >= 0 ? "+" : ""}${burn.percentChange.toFixed(1)}% vs ${summary.snapshotLabel}`}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              {burn.driverNote}
            </p>
          </div>

          {/* Burn Numbers Comparison Box */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 shadow-xs shrink-0">
            <div className="text-center px-3 border-r border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Snapshot ({summary.snapshotLabel})</span>
              <p className="text-sm font-bold font-mono text-slate-600 dark:text-slate-400 mt-0.5">
                {fmtCurrency(burn.previousVal)}/mo
              </p>
            </div>

            <div className="flex items-center justify-center px-1">
              <div
                className={`p-1.5 rounded-full ${
                  burn.impactDirection === "unfavorable"
                    ? "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {burn.percentChange >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 font-bold" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 font-bold" />
                )}
              </div>
            </div>

            <div className="text-center px-3 border-r border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Current Projection</span>
              <p className="text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5">
                {fmtCurrency(burn.currentVal)}/mo
              </p>
            </div>

            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Variance Delta</span>
              <p
                className={`text-sm font-black font-mono mt-0.5 ${
                  burn.impactDirection === "unfavorable"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {burn.percentChange >= 0 ? "+" : ""}
                {burn.percentChange.toFixed(1)}% ({burn.absoluteDiff >= 0 ? "+" : ""}
                {fmtCurrency(burn.absoluteDiff)}/mo)
              </p>
            </div>
          </div>
        </div>

        {/* Tactical Guidance Pill */}
        <div className="mt-3.5 pt-3 border-t border-amber-200/60 dark:border-amber-900/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>
              <strong>Runway Sensitivity:</strong> Monthly burn expansion reduces funded runway from{" "}
              <strong>{runwayVariance?.previousVal} months</strong> to{" "}
              <strong>{runwayVariance?.currentVal} months</strong> (
              {runwayVariance?.absoluteDiff} months operational compression).
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Variance Threshold: &gt;{thresholdPercent}%
          </span>
        </div>
      </div>

      {/* 2. FOUR KEY METRIC VARIANCE SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Burn Rate */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Monthly Net Burn
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                burn.isSignificant
                  ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              {burn.isSignificant ? `>${thresholdPercent}% SIGNIFICANT` : "STABLE"}
            </span>
          </div>

          <div className="my-2.5">
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white flex items-baseline gap-1.5">
              <span>{fmtCurrency(burn.currentVal)}</span>
              <span className="text-xs font-sans text-slate-400">/mo</span>
            </div>
            <div
              className={`flex items-center gap-1 text-xs font-bold mt-1 ${
                burn.impactDirection === "unfavorable"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {burn.percentChange >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              <span>
                {burn.percentChange >= 0 ? "+" : ""}
                {burn.percentChange.toFixed(1)}% vs prev ({fmtCurrency(burn.previousVal)})
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
            <span>Net Delta:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              +{fmtCurrency(burn.absoluteDiff)}/mo
            </span>
          </div>
        </div>

        {/* Card 2: CAC */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Customer Acq. (CAC)
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                cacVariance?.isSignificant
                  ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              {cacVariance?.isSignificant ? `>${thresholdPercent}% SIGNIFICANT` : "STABLE"}
            </span>
          </div>

          <div className="my-2.5">
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {fmtCurrency(cacVariance?.currentVal)}
            </div>
            <div
              className={`flex items-center gap-1 text-xs font-bold mt-1 ${
                cacVariance?.impactDirection === "unfavorable"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {cacVariance && cacVariance.percentChange >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              <span>
                {cacVariance && cacVariance.percentChange >= 0 ? "+" : ""}
                {cacVariance?.percentChange.toFixed(1)}% vs prev ({fmtCurrency(cacVariance?.previousVal)})
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
            <span>Net Delta:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              +{fmtCurrency(cacVariance?.absoluteDiff)}
            </span>
          </div>
        </div>

        {/* Card 3: Year 1 Revenue / ARR */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Year 1 ARR Scale
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                y1RevVariance?.isSignificant
                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              {y1RevVariance?.isSignificant ? "EXPANDED GROWTH" : "STABLE"}
            </span>
          </div>

          <div className="my-2.5">
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {fmtCurrency(y1RevVariance?.currentVal)}
            </div>
            <div className="flex items-center gap-1 text-xs font-bold mt-1 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>
                +{y1RevVariance?.percentChange.toFixed(1)}% vs prev ({fmtCurrency(y1RevVariance?.previousVal)})
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
            <span>Top-Line Lift:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              +{fmtCurrency(y1RevVariance?.absoluteDiff)}
            </span>
          </div>
        </div>

        {/* Card 4: Funded Cash Runway */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Cash Runway
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                runwayVariance?.isSignificant
                  ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              {runwayVariance?.isSignificant ? `>${thresholdPercent}% SHIFT` : "PROTECTED"}
            </span>
          </div>

          <div className="my-2.5">
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {runwayVariance?.currentVal} Months
            </div>
            <div className="flex items-center gap-1 text-xs font-medium mt-1 text-slate-500">
              <span>Prev: {runwayVariance?.previousVal} Months</span>
              <span>•</span>
              <span
                className={
                  runwayVariance && runwayVariance.absoluteDiff < 0
                    ? "text-amber-600 dark:text-amber-400 font-bold"
                    : "text-emerald-600 dark:text-emerald-400 font-bold"
                }
              >
                {runwayVariance?.absoluteDiff} mos
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
            <span>Buffer to Break-Even:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              +12 Months Cushion
            </span>
          </div>
        </div>
      </div>

      {/* 3. SIDE-BY-SIDE GRAPHICAL COMPARISON CHART */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <GitCompare className="w-3.5 h-3.5 text-indigo-600" />
              Side-by-Side Metric Variance: Snapshot vs Current Projections
            </h4>
            <p className="text-[11px] text-slate-500">
              Visual comparison across primary operational benchmarks against baseline snapshot{" "}
              <strong>{summary.snapshotLabel}</strong> ({summary.snapshotDate})
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-400 dark:bg-slate-600"></span>
              <span className="text-slate-600 dark:text-slate-400">Previous Snapshot</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500"></span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Current Plan</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: any, name: any, item: any) => {
                  const label = name === "prev" ? `Snapshot (${summary.snapshotLabel})` : "Current Projection";
                  return [`${val} ${item.payload.unit}`, label];
                }}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  color: "#fff",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
              />
              <Legend
                formatter={(value) =>
                  value === "prev" ? `Snapshot (${summary.snapshotLabel})` : "Current Projections"
                }
                wrapperStyle={{ fontSize: "11px" }}
              />
              <Bar dataKey="prev" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="curr" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. INTERACTIVE VARIANCE AUDIT TABLE */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              Complete Financial Metric Variance Ledger
            </h4>
            <p className="text-[11px] text-slate-500">
              Audit all {summary.totalMetricsCount} institutional projection variables against baseline snapshot. Metrics
              fluctuating &gt;{thresholdPercent}% are highlighted.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                filter === "all"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              All Metrics ({summary.totalMetricsCount})
            </button>

            <button
              onClick={() => setFilter("significant")}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                filter === "significant"
                  ? "bg-amber-600 text-white font-bold"
                  : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>&gt;{thresholdPercent}% Significant ({summary.significantCount})</span>
            </button>

            <button
              onClick={() => setFilter("unfavorable")}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                filter === "unfavorable"
                  ? "bg-rose-600 text-white font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Unfavorable / Risk ({summary.significantUnfavorableCount})
            </button>

            <button
              onClick={() => setFilter("favorable")}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                filter === "favorable"
                  ? "bg-emerald-600 text-white font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Favorable Growth ({summary.significantFavorableCount})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700/70 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Metric Name</th>
                <th className="py-2.5 px-3 text-right">Snapshot ({summary.snapshotLabel})</th>
                <th className="py-2.5 px-3 text-right">Current Plan</th>
                <th className="py-2.5 px-3 text-right">Variance ($/Units)</th>
                <th className="py-2.5 px-3 text-right">% Fluctuation</th>
                <th className="py-2.5 px-3 text-center">Variance Status</th>
                <th className="py-2.5 px-3">Operational Driver & Sensitivity Analysis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredVariances.map((v) => {
                const isUnfavorable = v.impactDirection === "unfavorable";
                const isFavorable = v.impactDirection === "favorable";

                return (
                  <tr
                    key={v.key}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                      v.key === "monthlyBurn" && v.isSignificant
                        ? "bg-amber-500/5 dark:bg-amber-950/20 font-semibold"
                        : ""
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        {v.key === "monthlyBurn" && <Flame className="w-3.5 h-3.5 text-amber-500" />}
                        <span className="font-bold text-slate-900 dark:text-slate-100">{v.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {v.category.replace("_", " & ")}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {formatMetricVal(v.previousVal, v.unit)}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatMetricVal(v.currentVal, v.unit)}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {v.absoluteDiff >= 0 ? "+" : ""}
                      {formatMetricVal(v.absoluteDiff, v.unit)}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] ${
                          v.isSignificant && isUnfavorable
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-extrabold"
                            : v.isSignificant && isFavorable
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold"
                            : "text-slate-500 font-normal"
                        }`}
                      >
                        {v.percentChange >= 0 ? "+" : ""}
                        {v.percentChange.toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {v.isSignificant ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            isUnfavorable
                              ? "bg-amber-500 text-slate-950"
                              : "bg-emerald-600 text-white"
                          }`}
                        >
                          <AlertTriangle className="w-2.5 h-2.5" />
                          &gt;{thresholdPercent}% Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          <CheckCircle2 className="w-2.5 h-2.5 text-slate-400" />
                          Within Corridor
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-[11px] text-slate-600 dark:text-slate-300 max-w-sm leading-relaxed">
                      {v.driverNote}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Snapshot Capture Prompt Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
          <span className="text-slate-500">
            Comparing against snapshot recorded on <strong>{summary.snapshotDate}</strong>. Need to preserve current
            projections?
          </span>
          <button
            onClick={onOpenCreateSnapshot}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Capture Current as New Snapshot</span>
          </button>
        </div>
      </div>
    </div>
  );
};
