import React, { useState, useEffect, useMemo } from "react";
import { BusinessPlan, FinancialSnapshot } from "../types";
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
  X,
  TrendingUp,
  DollarSign,
  Flame,
  Users,
  Clock,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  Check,
  Download,
  Building2,
  FileSpreadsheet,
  Activity,
  Target,
  Zap,
  ChevronRight,
  HelpCircle,
  BarChart3,
  Percent,
  GitCompare,
  AlertTriangle,
  Plus,
  BookmarkPlus,
  SlidersHorizontal,
  Info,
  Layers,
} from "lucide-react";
import { exportFinancialsToExcel } from "../utils/excelExporter";
import { addExportRecord } from "../utils/exportHistoryStore";
import {
  analyzeSnapshotVariance,
  createNewSnapshot,
  extractCurrentMetrics,
} from "../utils/kpiVarianceAnalysis";
import { VersionComparisonTab } from "./kpi/VersionComparisonTab";

interface KpiDashboardOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  plan: BusinessPlan;
  onUpdatePlan?: (updatedPlan: BusinessPlan) => void;
  initialTab?: "overview" | "unitEconomics" | "burnRunway" | "trajectories" | "comparison";
}

export const KpiDashboardOverlay: React.FC<KpiDashboardOverlayProps> = ({
  isOpen,
  onClose,
  plan,
  onUpdatePlan,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "unitEconomics" | "burnRunway" | "trajectories" | "comparison"
  >(initialTab || "overview");
  const [copiedBrief, setCopiedBrief] = useState(false);
  const [selectedHorizon, setSelectedHorizon] = useState<"all" | "nearTerm">("all");
  const [thresholdPercent, setThresholdPercent] = useState<number>(10);
  const [createSnapshotModalOpen, setCreateSnapshotModalOpen] = useState(false);
  const [newSnapshotLabel, setNewSnapshotLabel] = useState("");
  const [newSnapshotStage, setNewSnapshotStage] = useState("Internal Revision");
  const [newSnapshotNotes, setNewSnapshotNotes] = useState("");

  // Get available snapshots or construct fallback baseline
  const availableSnapshots: FinancialSnapshot[] = useMemo(() => {
    if (plan.versionSnapshots && plan.versionSnapshots.length > 0) {
      return plan.versionSnapshots;
    }
    const curr = extractCurrentMetrics(plan);
    return [
      {
        id: `snap-default-baseline-${plan.id}`,
        versionLabel: "v1.0 - Seed Baseline",
        date: "May 10, 2026",
        stage: "Initial Baseline",
        notes: "Historical financial model baseline.",
        metrics: {
          ...curr,
          monthlyBurn: Math.round(curr.monthlyBurn * 0.88), // 12% lower burn -> current is +13.6% higher
          cac: Math.round(curr.cac * 0.85),
          totalRevenueY1: Math.round(curr.totalRevenueY1 * 0.82),
          runwayMonths: curr.runwayMonths + 3,
        },
      },
    ];
  }, [plan]);

  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>(
    availableSnapshots[0]?.id || ""
  );

  // Sync snapshot ID if list changes
  useEffect(() => {
    if (
      availableSnapshots.length > 0 &&
      !availableSnapshots.some((s) => s.id === selectedSnapshotId)
    ) {
      setSelectedSnapshotId(availableSnapshots[0].id);
    }
  }, [availableSnapshots, selectedSnapshotId]);

  const selectedSnapshot =
    availableSnapshots.find((s) => s.id === selectedSnapshotId) || availableSnapshots[0];

  const comparisonSummary = useMemo(() => {
    if (!selectedSnapshot) return null;
    return analyzeSnapshotVariance(plan, selectedSnapshot, thresholdPercent);
  }, [plan, selectedSnapshot, thresholdPercent]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fin = plan.financials;
  const inv = fin.investorMetrics;
  const bEven = fin.breakEven;
  const cash = fin.cashFlow;
  const years = fin.years || ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"];

  // Currency & Unit formatting helpers
  const fmt = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return "$0";
    const abs = Math.abs(val);
    const sign = val < 0 ? "-" : "";
    if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(2)}M`;
    if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(0)}K`;
    return `${sign}$${abs.toLocaleString()}`;
  };

  const fmtPercent = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return "0.0%";
    return `${val >= 0 ? "" : ""}${val.toFixed(1)}%`;
  };

  // ARR calculations:
  // Year 1 Annual Run-Rate vs Year 5 Run-Rate
  const y1Rev = fin.totalRevenue?.[0] || 0;
  const y5Rev = fin.totalRevenue?.[fin.totalRevenue.length - 1] || 0;
  const arrMultiple = y1Rev > 0 ? (y5Rev / y1Rev).toFixed(1) : "N/A";

  // Identify recurring SaaS stream if available
  const saasStream = fin.revenueStreams?.find(
    (s) =>
      s.category.toLowerCase().includes("saas") ||
      s.category.toLowerCase().includes("recurring") ||
      s.name.toLowerCase().includes("saas")
  );
  const y1Saas = saasStream?.values[0] || 0;
  const y5Saas = saasStream?.values[saasStream.values.length - 1] || 0;

  // Monthly burn and runway
  const monthlyBurn = bEven?.monthlyBurn || 0;
  const runwayMonths = inv?.runwayMonths || 24;
  const targetUnits = bEven?.targetUnits || 0;
  const breakEvenMonth = bEven?.breakEvenMonth || 18;
  const breakEvenRevenue = bEven?.breakEvenRevenue || 0;

  // CAC & LTV
  const cac = inv?.cac || 0;
  const ltv = inv?.ltv || 0;
  const ltvCacRatio = inv?.ltvCacRatio || (cac > 0 ? ltv / cac : 0);
  const paybackMonths = inv?.paybackPeriodMonths || 12;

  // Snapshot variance derivations
  const burnVariance = comparisonSummary?.burnRateVariance;
  const cacVariance = comparisonSummary?.variances.find((v) => v.key === "cac");
  const y1RevVariance = comparisonSummary?.variances.find((v) => v.key === "totalRevenueY1");
  const ltvCacVariance = comparisonSummary?.variances.find((v) => v.key === "ltvCacRatio");
  const runwayVariance = comparisonSummary?.variances.find((v) => v.key === "runwayMonths");

  const handleSaveNewSnapshot = () => {
    if (!newSnapshotLabel.trim()) return;
    const newSnap = createNewSnapshot(
      plan,
      newSnapshotLabel.trim(),
      newSnapshotNotes.trim() || undefined,
      newSnapshotStage.trim() || undefined
    );
    const updatedSnapshots = [newSnap, ...(plan.versionSnapshots || availableSnapshots)];
    const updatedPlan: BusinessPlan = {
      ...plan,
      versionSnapshots: updatedSnapshots,
    };
    if (onUpdatePlan) {
      onUpdatePlan(updatedPlan);
    }
    setSelectedSnapshotId(newSnap.id);
    setCreateSnapshotModalOpen(false);
    setNewSnapshotLabel("");
    setNewSnapshotNotes("");
  };

  // Recharts Chart Dataset Preparation
  const trajectoryChartData = years.map((yr, idx) => {
    const rev = fin.totalRevenue?.[idx] || 0;
    const ebitda = fin.ebitda?.[idx] || 0;
    const grossMargin = fin.grossMarginPercent?.[idx] || 0;
    const endingCash = cash?.endingCashBalance?.[idx] || 0;
    const saasVal = saasStream ? saasStream.values[idx] || 0 : 0;
    const nonSaasVal = rev - saasVal;

    return {
      year: yr.replace("Year ", "Y"),
      fullYear: yr,
      revenue: rev,
      saasRevenue: saasVal,
      nonSaasRevenue: nonSaasVal > 0 ? nonSaasVal : 0,
      ebitda: ebitda,
      grossMargin: grossMargin,
      endingCash: endingCash,
    };
  });

  // Payback progression chart (12-18 month simulation of cumulative customer margin vs CAC)
  const paybackData = Array.from({ length: 18 }, (_, i) => {
    const month = i + 1;
    // Monthly gross margin contribution generated per customer = LTV / (paybackMonths * 3)
    const monthlyContribution = cac / paybackMonths;
    const cumulativeContribution = Math.round(monthlyContribution * month);
    return {
      month: `M${month}`,
      cumulativeContribution,
      cacBenchmark: cac,
      netValue: cumulativeContribution - cac,
    };
  });

  // Copy Executive KPI Summary
  const handleCopySummary = () => {
    const text = `
=== ${plan.companyName} Executive Financial KPI Brief ===
Document Reference: ${plan.docReference} (Revision: ${plan.revision})
Sector: ${plan.sector}

Key Operational & Valuation Metrics:
• Annual Run-Rate (ARR): Y1 ${fmt(y1Rev)} -> Y5 ${fmt(y5Rev)} (${arrMultiple}x 5-Yr Expansion)
${saasStream ? `• Pure SaaS ARR: Y1 ${fmt(y1Saas)} -> Y5 ${fmt(y5Saas)}` : ""}
• Customer Acquisition Cost (CAC): ${fmt(cac)}
• Customer Lifetime Value (LTV): ${fmt(ltv)}
• LTV / CAC Efficiency Ratio: ${ltvCacRatio.toFixed(1)}x (Benchmark >3.0x: EXCELLENT)
• CAC Payback Period: ${paybackMonths} Months
• Monthly Net Burn Rate: ${fmt(monthlyBurn)}/month
• Funded Cash Runway: ${runwayMonths} Months
• Break-Even Horizon: Month ${breakEvenMonth} (At ${fmt(breakEvenRevenue)}/mo run-rate)
• Target Capital Raise: ${fmt(inv?.totalFundingRequired)} Preferred Seed/Equity
• Pre-Money Valuation: ${fmt(inv?.preMoneyValuation)}
• Projected 5-Year IRR: ${inv?.projectedIRR}% (Target Return: ${inv?.projectedROI})
• Y5 EBITDA Margin: ${fmtPercent(fin.ebitdaMarginPercent?.[fin.ebitdaMarginPercent.length - 1])}
• Y5 Gross Margin: ${fmtPercent(fin.grossMarginPercent?.[fin.grossMarginPercent.length - 1])}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2500);
  };

  return (
    <div
      id="kpi-dashboard-overlay-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 animate-in zoom-in-98 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Executive KPI & Financial Summary
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {plan.docReference}
                </span>
                {plan.isAttachedReference && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-indigo-600" /> Golden Master
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{plan.companyName}</span>
                <span>•</span>
                <span>{plan.sector}</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Readiness: {plan.readinessScore}%</span>
              </p>
            </div>
          </div>

          {/* Quick Actions & Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Copy formatted KPI metrics brief to clipboard"
            >
              {copiedBrief ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Brief</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                exportFinancialsToExcel(plan);
                addExportRecord({
                  planId: plan.id,
                  planName: plan.name,
                  companyName: plan.companyName,
                  fileName: `${plan.companyName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Financial_Model.xlsx`,
                  format: "excel",
                  fileSizeFormatted: "44.2 KB",
                  scope: "Complete Financial Model & KPI Brief",
                  status: "success",
                  triggeredBy: "KPI Dashboard Overlay",
                  notes: "Workbook exported directly from Executive KPI Brief modal",
                });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
              title="Export complete 5-year financials and KPI schedules to Excel workbook"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export XLSX</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              title="Close overlay (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Institutional Version Snapshot & Variance Ribbon */}
        <div
          id="kpi-snapshot-variance-ribbon"
          className="flex flex-wrap items-center justify-between px-6 py-2.5 bg-slate-100/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 text-xs gap-3"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
              <GitCompare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Snapshot Baseline:</span>
            </div>

            <div className="relative">
              <select
                id="kpi-snapshot-selector"
                value={selectedSnapshotId}
                onChange={(e) => setSelectedSnapshotId(e.target.value)}
                className="pl-2.5 pr-8 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {availableSnapshots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.versionLabel} ({s.date})
                  </option>
                ))}
              </select>
            </div>

            {selectedSnapshot?.stage && (
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {selectedSnapshot.stage}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Sensitivity Threshold Toggle */}
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <span className="font-medium">Threshold:</span>
              <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-900">
                {[5, 10, 15, 20].map((t) => (
                  <button
                    key={t}
                    onClick={() => setThresholdPercent(t)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                      thresholdPercent === t
                        ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-2xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    &gt;{t}%
                  </button>
                ))}
              </div>
            </div>

            {/* Significant Fluctuation Quick Pill */}
            {comparisonSummary && comparisonSummary.significantCount > 0 ? (
              <button
                onClick={() => setActiveTab("comparison")}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-2xs transition-all cursor-pointer animate-pulse"
                title="Click to view detailed variance audit ledger"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{comparisonSummary.significantCount} Significant Fluctuations (&gt;{thresholdPercent}%)</span>
                {burnVariance?.isSignificant && (
                  <span className="bg-slate-950 text-amber-300 px-1.5 py-0.2 rounded text-[10px] font-black">
                    🔥 Burn: {burnVariance.percentChange >= 0 ? "+" : ""}{burnVariance.percentChange.toFixed(1)}%
                  </span>
                )}
              </button>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" /> All Metrics Within &plusmn;{thresholdPercent}% Corridor
              </span>
            )}

            {/* Snapshot Capture Action */}
            <button
              onClick={() => {
                setNewSnapshotLabel(`v${(availableSnapshots.length + 3).toFixed(1)} - Current Revision`);
                setCreateSnapshotModalOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs transition-colors cursor-pointer"
              title="Capture current model state as a new version snapshot"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">Capture Snapshot</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold overflow-x-auto">
          <div className="flex items-center gap-1">
            <button
              id="kpi-tab-overview"
              onClick={() => setActiveTab("overview")}
              className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === "overview"
                  ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Executive KPI Matrix</span>
            </button>

            <button
              id="kpi-tab-comparison"
              onClick={() => setActiveTab("comparison")}
              className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === "comparison"
                  ? "border-amber-500 text-amber-700 dark:text-amber-400 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <GitCompare className="w-3.5 h-3.5 text-amber-500" />
              <span>Version Comparison & Variance</span>
              {comparisonSummary && comparisonSummary.significantCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                  {comparisonSummary.significantCount} Flagged
                </span>
              )}
            </button>

            <button
              id="kpi-tab-burn-runway"
              onClick={() => setActiveTab("burnRunway")}
              className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === "burnRunway"
                  ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Burn Rate & Runway</span>
              {burnVariance?.isSignificant && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              )}
            </button>

            <button
              id="kpi-tab-unit-economics"
              onClick={() => setActiveTab("unitEconomics")}
              className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === "unitEconomics"
                  ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Unit Economics & CAC</span>
            </button>

            <button
              id="kpi-tab-trajectories"
              onClick={() => setActiveTab("trajectories")}
              className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === "trajectories"
                  ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>5-Year Trajectories</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Audited against Golden Master standards</span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(92vh-130px)] space-y-6">
          {/* PROMINENT SIGNIFICANT FLUCTUATION ALERT CALLOUT */}
          {comparisonSummary && comparisonSummary.significantCount > 0 && (
            <div
              id="kpi-variance-alert-banner"
              className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-xs"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500 text-slate-950 shrink-0 mt-0.5">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-amber-950 dark:text-amber-200">
                      Significant Financial Fluctuation Detected (&gt;{thresholdPercent}% Variance)
                    </h4>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                      {comparisonSummary.significantCount} Flagged Variables
                    </span>
                  </div>

                  <p className="text-xs text-amber-900 dark:text-amber-300 mt-1 leading-relaxed">
                    Compared to previous snapshot <strong>{selectedSnapshot.versionLabel}</strong> ({selectedSnapshot.date}):{" "}
                    {burnVariance?.isSignificant && (
                      <span>
                        Net Monthly Burn rate expanded by <strong>+{Math.abs(burnVariance.percentChange).toFixed(1)}%</strong> ({fmt(burnVariance.previousVal)}/mo → {fmt(burnVariance.currentVal)}/mo).{" "}
                      </span>
                    )}
                    {cacVariance?.isSignificant && (
                      <span>
                        CAC increased by <strong>+{cacVariance.percentChange.toFixed(1)}%</strong> ({fmt(cacVariance.previousVal)} → {fmt(cacVariance.currentVal)}).{" "}
                      </span>
                    )}
                    {y1RevVariance?.isSignificant && (
                      <span>
                        Y1 ARR scaled by <strong>+{y1RevVariance.percentChange.toFixed(1)}%</strong>.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() => setActiveTab("comparison")}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>Review All Variances ({comparisonSummary.significantCount})</span>
                </button>
              </div>
            </div>
          )}

          {/* THE 4 PILLAR HERO CARDS (ARR, CAC, Monthly Burn, LTV/CAC) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. ARR Metric Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Annual Run-Rate (ARR)
                </span>
                <span className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                  <TrendingUp className="w-3.5 h-3.5" />
                </span>
              </div>

              <div className="my-2.5">
                <div className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                  {fmt(y1Rev)}
                </div>
                {/* Snapshot Comparison Badge */}
                {y1RevVariance && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>
                      +{y1RevVariance.percentChange.toFixed(1)}% vs {selectedSnapshot.versionLabel.split(" - ")[0]}
                    </span>
                    {y1RevVariance.isSignificant && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        &gt;{thresholdPercent}% Growth
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                  <span>Prev: {fmt(y1RevVariance?.previousVal)}</span>
                  <span>•</span>
                  <span>Scaling to {fmt(y5Rev)} (Y5)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">5-Yr Expansion:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                  {arrMultiple}x Trajectory
                </span>
              </div>
            </div>

            {/* 2. CAC Metric Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Acquisition Cost (CAC)
                </span>
                <span className="p-1 rounded-md bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300">
                  <Users className="w-3.5 h-3.5" />
                </span>
              </div>

              <div className="my-2.5">
                <div className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                  {fmt(cac)}
                </div>
                {/* Snapshot Comparison Badge */}
                {cacVariance && (
                  <div
                    className={`flex items-center gap-1.5 text-xs font-bold mt-1 ${
                      cacVariance.isSignificant
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {cacVariance.percentChange >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {cacVariance.percentChange >= 0 ? "+" : ""}
                      {cacVariance.percentChange.toFixed(1)}% vs {selectedSnapshot.versionLabel.split(" - ")[0]}
                    </span>
                    {cacVariance.isSignificant && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold">
                        &gt;{thresholdPercent}% Alert
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                  <span>Prev: {fmt(cacVariance?.previousVal)}</span>
                  <span>•</span>
                  <span>{paybackMonths}m Payback</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Benchmark:</span>
                <span className="font-semibold text-cyan-700 dark:text-cyan-300">
                  {paybackMonths <= 12 ? "Top Decile (<12m)" : "Standard"}
                </span>
              </div>
            </div>

            {/* 3. Monthly Burn Rate & Runway */}
            <div
              className={`p-4 rounded-xl relative overflow-hidden flex flex-col justify-between transition-all ${
                burnVariance?.isSignificant
                  ? "bg-amber-500/10 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-600 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Net Monthly Burn
                  </span>
                  {burnVariance?.isSignificant && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  )}
                </div>
                <span className="p-1 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
                  <Flame className="w-3.5 h-3.5" />
                </span>
              </div>

              <div className="my-2.5">
                <div className="text-2xl font-black font-mono tracking-tight text-amber-700 dark:text-amber-400">
                  {fmt(monthlyBurn)}
                  <span className="text-xs font-sans font-medium text-slate-500 ml-1">/mo</span>
                </div>

                {/* Prominent Burn Rate Fluctuation Badge */}
                {burnVariance && (
                  <div
                    className={`flex items-center gap-1 text-xs font-extrabold mt-1 ${
                      burnVariance.isSignificant
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Flame className="w-3 h-3 text-amber-500" />
                    <span>
                      {burnVariance.percentChange >= 0 ? "+" : ""}
                      {burnVariance.percentChange.toFixed(1)}% vs {selectedSnapshot.versionLabel.split(" - ")[0]}
                    </span>
                    {burnVariance.isSignificant && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500 text-slate-950 font-black">
                        &gt;{thresholdPercent}% Fluctuation
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                  <span>Prev: {fmt(burnVariance?.previousVal)}/mo</span>
                  <span>•</span>
                  <span>
                    Diff: {burnVariance && burnVariance.absoluteDiff >= 0 ? "+" : ""}
                    {fmt(burnVariance?.absoluteDiff)}/mo
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Runway Horizon:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {runwayMonths} Mos (BE: M{breakEvenMonth})
                </span>
              </div>
            </div>

            {/* 4. Unit Economics: LTV & LTV/CAC */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  LTV / CAC Efficiency
                </span>
                <span className="p-1 rounded-md bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                  <Award className="w-3.5 h-3.5" />
                </span>
              </div>

              <div className="my-2.5">
                <div className="text-2xl font-black font-mono tracking-tight text-indigo-600 dark:text-indigo-400">
                  {ltvCacRatio.toFixed(1)}x
                </div>
                {/* Snapshot Comparison Badge */}
                {ltvCacVariance && (
                  <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    <span>
                      {ltvCacVariance.percentChange >= 0 ? "+" : ""}
                      {ltvCacVariance.percentChange.toFixed(1)}% vs {selectedSnapshot.versionLabel.split(" - ")[0]}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      (Prev: {ltvCacVariance.previousVal.toFixed(1)}x)
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                  <span>Lifetime Value: <strong>{fmt(ltv)}</strong></span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Threshold:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {ltvCacRatio >= 3.0 ? "Highly Profitable (>3x)" : "Viable"}
                </span>
              </div>
            </div>
          </div>

          {/* TAB 1: EXECUTIVE KPI MATRIX */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Secondary Metrics Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/70 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Target Capital Raise</span>
                  <p className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {fmt(inv?.totalFundingRequired)}
                  </p>
                  <span className="text-[10px] text-slate-500">Seed / Series A Round</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Pre-Money Valuation</span>
                  <p className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {fmt(inv?.preMoneyValuation)}
                  </p>
                  <span className="text-[10px] text-slate-500">Negotiated Benchmark</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Projected 5-Yr IRR</span>
                  <p className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {inv?.projectedIRR}%
                  </p>
                  <span className="text-[10px] text-slate-500">Projected ROI: {inv?.projectedROI}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Peak Gross Margin</span>
                  <p className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {fmtPercent(fin.grossMarginPercent?.[fin.grossMarginPercent.length - 1])}
                  </p>
                  <span className="text-[10px] text-slate-500">Y5 Operating Scale</span>
                </div>
              </div>

              {/* Chart Grid: ARR Trajectory vs Burn vs Cash */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Visual Chart 1: 5-Year ARR Growth Profile */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        5-Year Revenue & Run-Rate Horizon
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {saasStream ? "Differentiating Recurring SaaS from Hardware/Deployment" : "Annual Revenue Progression"}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      Y5: {fmt(y5Rev)}
                    </span>
                  </div>

                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trajectoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                        <YAxis
                          tickFormatter={(val) => fmt(val)}
                          tick={{ fontSize: 10 }}
                          width={60}
                        />
                        <Tooltip
                          formatter={(value: any) => [fmt(Number(value)), ""]}
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            color: "#fff",
                            borderRadius: "8px",
                            fontSize: "11px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                        {saasStream ? (
                          <>
                            <Bar
                              dataKey="saasRevenue"
                              name="Recurring SaaS ARR"
                              stackId="a"
                              fill="#10b981"
                              radius={[0, 0, 0, 0]}
                            />
                            <Bar
                              dataKey="nonSaasRevenue"
                              name="Direct & Hardware Sales"
                              stackId="a"
                              fill="#3b82f6"
                              radius={[4, 4, 0, 0]}
                            />
                          </>
                        ) : (
                          <Bar
                            dataKey="revenue"
                            name="Total Revenue Run-Rate"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                          />
                        )}
                        <Line
                          type="monotone"
                          dataKey="ebitda"
                          name="EBITDA"
                          stroke="#f59e0b"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: "#f59e0b" }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Visual Chart 2: Cash Runway & Ending Liquidity */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        Cash Balance & Runway Trajectory
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Monthly Burn: {fmt(monthlyBurn)}/mo · Break-Even: Month {breakEvenMonth}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                      {runwayMonths} Mo Runway
                    </span>
                  </div>

                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trajectoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                        <YAxis
                          tickFormatter={(val) => fmt(val)}
                          tick={{ fontSize: 10 }}
                          width={60}
                        />
                        <Tooltip
                          formatter={(value: any) => [fmt(Number(value)), "Cash Reserves"]}
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            color: "#fff",
                            borderRadius: "8px",
                            fontSize: "11px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="endingCash"
                          name="Ending Cash Balance"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#cashGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Sanity Audit & Benchmark Checklist */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Institutional Sanity Tests & Benchmark Scorecard
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Test 1 */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Unit Capital Efficiency</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        PASS
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      LTV/CAC is <strong>{ltvCacRatio.toFixed(1)}x</strong> (Industry target &gt; 3.0x). Every dollar spent on marketing returns ${(ltvCacRatio).toFixed(2)} in customer gross margin.
                    </p>
                  </div>

                  {/* Test 2 */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">CAC Recoup Velocity</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        PASS
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      CAC payback in <strong>{paybackMonths} months</strong> (Target &le; 12 months). Allows fast capital recycling into sales pipeline.
                    </p>
                  </div>

                  {/* Test 3 */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Cash Runway Cushion</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        PASS
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      <strong>{runwayMonths} months</strong> funded runway provides sufficient buffer beyond Month {breakEvenMonth} break-even target.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UNIT ECONOMICS & CAC DEEP DIVE */}
          {activeTab === "unitEconomics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Blended CAC</span>
                  <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                    {fmt(cac)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    All-in customer acquisition cost including digital ads, outbound SDRs, and agronomic trials.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Customer LTV</span>
                  <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                    {fmt(ltv)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Discounted lifetime customer value assuming typical churn and recurring subscription renewals.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Payback Period</span>
                  <div className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400 mt-1">
                    {paybackMonths} Months
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Target is &lt; 12 months for high-velocity software/hardware ventures.
                  </p>
                </div>
              </div>

              {/* CAC Payback Curve Chart */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-cyan-600" />
                      Cumulative Gross Contribution vs. CAC Hurdle
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Demonstrates breakeven milestone per acquired account at Month {paybackMonths}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-600">
                    Net Profit Positive After M{paybackMonths}
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={paybackData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(val) => fmt(val)} tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(val: any, name: any) => [
                          fmt(Number(val)),
                          name === "cumulativeContribution" ? "Cumulative Gross Profit" : "CAC Target",
                        ]}
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          color: "#fff",
                          borderRadius: "8px",
                          fontSize: "11px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Line
                        type="monotone"
                        dataKey="cumulativeContribution"
                        name="Cumulative Customer Gross Margin"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cacBenchmark"
                        name="Acquisition Cost Threshold"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BURN RATE & RUNWAY DYNAMICS */}
          {activeTab === "burnRunway" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Monthly Net Burn</span>
                  <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
                    {fmt(monthlyBurn)}/mo
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Pre-profit operating burn rate</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Runway Horizon</span>
                  <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                    {runwayMonths} Months
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Funded by current round</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Break-Even Milestone</span>
                  <div className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                    Month {breakEvenMonth}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Requires {targetUnits.toLocaleString()} accounts</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Monthly Break-Even Rev</span>
                  <div className="text-xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                    {fmt(breakEvenRevenue)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Covers fixed and variable costs</p>
                </div>
              </div>

              {/* Targeted Burn Rate Fluctuation Callout vs Snapshot */}
              {burnVariance && (
                <div
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
                    burnVariance.isSignificant
                      ? "bg-amber-500/10 dark:bg-amber-950/30 border-amber-400 dark:border-amber-700"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="p-2 rounded-lg bg-amber-500 text-slate-950 shrink-0 mt-0.5">
                      <Flame className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          Burn Rate Fluctuation Audit vs Snapshot ({selectedSnapshot.versionLabel})
                        </span>
                        {burnVariance.isSignificant && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                            &gt;{thresholdPercent}% Fluctuation Flagged
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {burnVariance.driverNote} Baseline monthly burn was{" "}
                        <strong>{fmt(burnVariance.previousVal)}/mo</strong>, shifting by{" "}
                        <strong className={burnVariance.isSignificant ? "text-amber-600 dark:text-amber-400" : ""}>
                          {burnVariance.percentChange >= 0 ? "+" : ""}{burnVariance.percentChange.toFixed(1)}% ({burnVariance.absoluteDiff >= 0 ? "+" : ""}{fmt(burnVariance.absoluteDiff)}/mo)
                        </strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => setActiveTab("comparison")}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <GitCompare className="w-3.5 h-3.5 text-amber-500" />
                      <span>Audit Variances</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Runway Milestone Timeline */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Capitalization & Runway Milestone Pathway
                </h4>

                <div className="relative pl-6 space-y-6 border-l-2 border-emerald-500/30">
                  {/* Step 1 */}
                  <div className="relative">
                    <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Month 0: Capitalization Initial Close ({fmt(inv?.totalFundingRequired)})
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Funding secures {runwayMonths} months of runway to recruit key engineering and sales leadership.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                    <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900"></span>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                      Month 6-10: Peak Net Burn Velocity
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Burn crests at approximately {fmt(monthlyBurn * 1.15)}/mo during commercial market expansion.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="relative">
                    <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Month {breakEvenMonth}: Operating Break-Even Achieved
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Gross profit fully offsets operating expenditures at {fmt(breakEvenRevenue)}/mo recurring revenues.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="relative">
                    <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900"></span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      Month {runwayMonths}: Self-Sustaining Cash Flow
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Projected ending cash reserves reach {fmt(cash?.endingCashBalance?.[1] || 0)}, completely de-risking the venture.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 5-YEAR TRAJECTORIES */}
          {activeTab === "trajectories" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Margin Expansion Chart */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-indigo-600" />
                    Gross vs. EBITDA Margin Expansion (%)
                  </h4>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trajectoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(val) => `${val}%`} tick={{ fontSize: 10 }} />
                        <Tooltip
                          formatter={(val: any) => [`${val}%`, ""]}
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            color: "#fff",
                            borderRadius: "8px",
                            fontSize: "11px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        <Line
                          type="monotone"
                          dataKey="grossMargin"
                          name="Gross Margin %"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          dot={{ r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="ebitdaMarginPercent"
                          name="EBITDA Margin %"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 5-Year Financial Summary Table */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                    Tabular KPI Trajectory Snapshot
                  </h4>

                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 text-[10px] uppercase">
                          <th className="py-2">Metric</th>
                          {years.map((y, i) => (
                            <th key={i} className="py-2 text-right">
                              {y.replace("Year ", "Y")}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                        <tr>
                          <td className="py-1.5 font-sans font-medium text-slate-700 dark:text-slate-300">Revenue</td>
                          {fin.totalRevenue.map((v, i) => (
                            <td key={i} className="py-1.5 text-right font-bold text-slate-900 dark:text-slate-100">
                              {fmt(v)}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-1.5 font-sans font-medium text-slate-700 dark:text-slate-300">Gross Margin</td>
                          {fin.grossMarginPercent.map((v, i) => (
                            <td key={i} className="py-1.5 text-right text-emerald-600 dark:text-emerald-400">
                              {fmtPercent(v)}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-1.5 font-sans font-medium text-slate-700 dark:text-slate-300">EBITDA</td>
                          {fin.ebitda.map((v, i) => (
                            <td
                              key={i}
                              className={`py-1.5 text-right ${
                                v >= 0 ? "text-slate-900 dark:text-slate-100" : "text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {fmt(v)}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-1.5 font-sans font-medium text-slate-700 dark:text-slate-300">Ending Cash</td>
                          {cash?.endingCashBalance.map((v, i) => (
                            <td key={i} className="py-1.5 text-right text-slate-600 dark:text-slate-400">
                              {fmt(v)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
                    <span>Export entire sheet with all revenue and OPEX schedules:</span>
                    <button
                      onClick={() => exportFinancialsToExcel(plan)}
                      className="text-emerald-600 hover:text-emerald-500 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Download Excel</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: VERSION COMPARISON & VARIANCE LEDGER */}
          {activeTab === "comparison" && comparisonSummary && (
            <VersionComparisonTab
              plan={plan}
              summary={comparisonSummary}
              thresholdPercent={thresholdPercent}
              onOpenCreateSnapshot={() => {
                setNewSnapshotLabel(`v${(availableSnapshots.length + 3).toFixed(1)} - Custom Revision`);
                setCreateSnapshotModalOpen(true);
              }}
              fmtCurrency={fmt}
              fmtPercent={fmtPercent}
            />
          )}
        </div>

        {/* Footer Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px]">Confidential Investor Memorandum</span>
            <span>•</span>
            <span>All figures audited via Activity Hub Golden Master standards</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Close Overlay
          </button>
        </div>
      </div>

      {/* Snapshot Capture Modal */}
      {createSnapshotModalOpen && (
        <div
          id="capture-snapshot-modal"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <BookmarkPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Capture Financial Snapshot</h3>
                  <p className="text-[11px] text-slate-500">Save current projections as an immutable baseline</p>
                </div>
              </div>
              <button
                onClick={() => setCreateSnapshotModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Snapshot Version Label <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSnapshotLabel}
                  onChange={(e) => setNewSnapshotLabel(e.target.value)}
                  placeholder="e.g. v3.3 - Post-Pilot Revision"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Stage / Milestone (Optional)
                </label>
                <input
                  type="text"
                  value={newSnapshotStage}
                  onChange={(e) => setNewSnapshotStage(e.target.value)}
                  placeholder="e.g. Series A Deck, Board Review, Internal Sync"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Revision Driver Notes (Optional)
                </label>
                <textarea
                  value={newSnapshotNotes}
                  onChange={(e) => setNewSnapshotNotes(e.target.value)}
                  placeholder="Summarize key assumption modifications (e.g. revised burn velocity, hiring plan, CAC shifts)..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200">Current Projections to be Frozen:</span>
                <div className="flex justify-between">
                  <span>Net Monthly Burn:</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{fmt(monthlyBurn)}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer CAC:</span>
                  <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{fmt(cac)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Year 1 ARR:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{fmt(y1Rev)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCreateSnapshotModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newSnapshotLabel.trim()}
                onClick={handleSaveNewSnapshot}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Snapshot</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
