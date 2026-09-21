import React, { useState, useMemo } from "react";
import { FinancialData, WhatIfVariables } from "../types";
import {
  WHAT_IF_PRESETS,
  DEFAULT_WHAT_IF_VARIABLES,
  recalculateWhatIfFinancials,
} from "../utils/whatIfCalculator";
import {
  Sliders,
  TrendingUp,
  TrendingDown,
  Sparkles,
  RefreshCw,
  Check,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  BarChart3,
  PieChart,
  Layers,
  ChevronDown,
  ChevronUp,
  Zap,
  BookmarkCheck,
  ShieldAlert,
} from "lucide-react";

interface WhatIfScenarioWorkbenchProps {
  baselineFinancials: FinancialData;
  onApplyScenario?: (recalculatedFinancials: FinancialData) => void;
  className?: string;
  onClose?: () => void;
}

type ChartMetric = "revenue" | "ebitda" | "cash" | "margins";

export const WhatIfScenarioWorkbench: React.FC<WhatIfScenarioWorkbenchProps> = ({
  baselineFinancials,
  onApplyScenario,
  className = "",
  onClose,
}) => {
  const [variables, setVariables] = useState<WhatIfVariables>(DEFAULT_WHAT_IF_VARIABLES);
  const [activePresetId, setActivePresetId] = useState<string>("base_case");
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>("revenue");
  const [hoveredYearIdx, setHoveredYearIdx] = useState<number | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [showAdvancedSliders, setShowAdvancedSliders] = useState(false);
  const [showTableComparison, setShowTableComparison] = useState(false);

  // Instantly recalculate 5-year financials when variables change
  const recalculated = useMemo(() => {
    return recalculateWhatIfFinancials(baselineFinancials, variables);
  }, [baselineFinancials, variables]);

  const years = baselineFinancials.years || ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"];

  // Helper formatters
  const formatCurrency = (val: number | undefined) => {
    if (val === undefined || val === null) return "$0";
    const prefix = val < 0 ? "-$" : "$";
    const abs = Math.abs(val);
    if (abs >= 1000000) return `${prefix}${(abs / 1000000).toFixed(2)}M`;
    if (abs >= 1000) return `${prefix}${(abs / 1000).toFixed(0)}K`;
    return `${prefix}${abs.toLocaleString()}`;
  };

  const formatShortCurrency = (val: number | undefined) => {
    if (val === undefined || val === null) return "$0";
    const prefix = val < 0 ? "-$" : "$";
    const abs = Math.abs(val);
    if (abs >= 1000000) return `${prefix}${(abs / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `${prefix}${(abs / 1000).toFixed(0)}K`;
    return `${prefix}${abs}`;
  };

  const formatPercent = (val: number | undefined) => {
    if (val === undefined || val === null) return "0.0%";
    return `${val.toFixed(1)}%`;
  };

  // Variable change handler
  const handleVariableChange = (field: keyof WhatIfVariables, value: number) => {
    setVariables((prev) => ({
      ...prev,
      [field]: value,
    }));
    setActivePresetId("custom");
  };

  // Preset selector
  const handleSelectPreset = (presetId: string) => {
    const preset = WHAT_IF_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setVariables(preset.variables);
      setActivePresetId(presetId);
    }
  };

  // Reset to Baseline
  const handleReset = () => {
    setVariables(DEFAULT_WHAT_IF_VARIABLES);
    setActivePresetId("base_case");
  };

  // Apply scenario to plan
  const handleApply = () => {
    if (onApplyScenario) {
      onApplyScenario(recalculated);
      setAppliedSuccess(true);
      setTimeout(() => setAppliedSuccess(false), 2500);
    }
  };

  // Check if anything differs from base
  const isModified =
    variables.revenueGrowthDelta !== 0 ||
    variables.pricingPowerDelta !== 0 ||
    variables.cogsEfficiencyDelta !== 0 ||
    variables.opexDelta !== 0 ||
    variables.cacDelta !== 0 ||
    variables.capexDelta !== 0;

  // Extract metric series for the Chart Overlay
  const getMetricSeries = () => {
    switch (selectedMetric) {
      case "revenue":
        return {
          title: "Total Net Revenue Trajectory",
          unit: "currency",
          base: baselineFinancials.totalRevenue,
          scenario: recalculated.totalRevenue,
          color: "#10b981", // Emerald
          gradientId: "revGrad",
        };
      case "ebitda":
        return {
          title: "EBITDA & Operating Cash Generation",
          unit: "currency",
          base: baselineFinancials.ebitda,
          scenario: recalculated.ebitda,
          color: "#0284c7", // Sky blue
          gradientId: "ebitdaGrad",
        };
      case "cash":
        return {
          title: "Ending Cash Balance & Capital Runway",
          unit: "currency",
          base: baselineFinancials.cashFlow.endingCashBalance,
          scenario: recalculated.cashFlow.endingCashBalance,
          color: "#6366f1", // Indigo
          gradientId: "cashGrad",
        };
      case "margins":
        return {
          title: "Gross Margin % Progression",
          unit: "percent",
          base: baselineFinancials.grossMarginPercent,
          scenario: recalculated.grossMarginPercent,
          color: "#f59e0b", // Amber
          gradientId: "marginGrad",
        };
    }
  };

  const currentSeries = getMetricSeries();

  // SVG Chart Geometry Calculations
  const chartWidth = 700;
  const chartHeight = 220;
  const padding = { top: 25, right: 30, bottom: 35, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Calculate scales
  const allValues = [...currentSeries.base, ...currentSeries.scenario];
  const minValue = Math.min(...allValues, 0);
  const maxValue = Math.max(...allValues, 1);
  const valueRange = maxValue - minValue || 1;

  const getX = (index: number) => {
    return padding.left + (index / (years.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    const norm = (val - minValue) / valueRange;
    return padding.top + innerHeight - norm * innerHeight;
  };

  // Path strings
  const basePathPoints = currentSeries.base.map((val, idx) => `${getX(idx)},${getY(val)}`).join(" L ");
  const basePath = `M ${basePathPoints}`;

  const scenarioPathPoints = currentSeries.scenario.map((val, idx) => `${getX(idx)},${getY(val)}`).join(" L ");
  const scenarioPath = `M ${scenarioPathPoints}`;

  // Area between baseline and scenario for visual delta overlay
  // Forward along scenario, backward along baseline
  const scenarioReversePoints = currentSeries.base
    .map((val, idx) => `${getX(idx)},${getY(val)}`)
    .reverse()
    .join(" L ");
  const deltaAreaPath = `M ${scenarioPathPoints} L ${scenarioReversePoints} Z`;

  // Net variance between Y5 scenario and Y5 baseline
  const y5Base = currentSeries.base[currentSeries.base.length - 1] || 0;
  const y5Scenario = currentSeries.scenario[currentSeries.scenario.length - 1] || 0;
  const y5Delta = y5Scenario - y5Base;
  const y5DeltaPercent = y5Base !== 0 ? (y5Delta / Math.abs(y5Base)) * 100 : 0;

  return (
    <div
      id="what-if-scenario-workbench"
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all ${className}`}
    >
      {/* Top Banner & Scenario Mode Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50/80 via-white to-indigo-50/60 dark:from-emerald-950/30 dark:via-slate-900 dark:to-indigo-950/20 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-xs">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                What-If Scenario Analysis & Projections Workbench
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold border border-emerald-300 dark:border-emerald-800">
                Live Chart Overlay
              </span>
              {isModified && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800 animate-pulse">
                  Custom Delta Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tune growth rates, pricing, and operating costs to stress-test 5-year returns and capital runway against the baseline model.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            id="btn-reset-whatif"
            onClick={handleReset}
            disabled={!isModified}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            title="Reset all variable sliders to baseline model"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset to Baseline</span>
          </button>

          {onApplyScenario && (
            <button
              id="btn-apply-whatif-plan"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all cursor-pointer"
              title="Apply these recalculated projections directly to the business plan model"
            >
              {appliedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Applied to Plan!</span>
                </>
              ) : (
                <>
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Apply Scenario to Plan</span>
                </>
              )}
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Close What-If Workbench"
            >
              <span className="text-sm font-bold">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Scenario Quick-Pills */}
      <div className="p-3.5 bg-slate-50/70 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          Scenarios:
        </span>
        {WHAT_IF_PRESETS.map((preset) => {
          const isActive = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-900 dark:bg-emerald-500 text-white font-bold shadow-xs scale-[1.02]"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700"
              }`}
              title={preset.description}
            >
              <span>{preset.name}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {preset.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Left Controls (Sliders) & Right Chart Overlay */}
      <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Variable Sliders (5 Cols on large screen) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Adjust Growth & Cost Variables
            </h4>
            <span className="text-[10px] font-mono text-slate-400">Instant Recalculation</span>
          </div>

          {/* Slider 1: Revenue Growth Rate Modifier */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-750 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Annual Revenue Growth Rate</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                    variables.revenueGrowthDelta > 0
                      ? "text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
                      : variables.revenueGrowthDelta < 0
                      ? "text-rose-700 bg-rose-100 dark:bg-rose-950 dark:text-rose-300"
                      : "text-slate-600 bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {variables.revenueGrowthDelta > 0 ? `+${variables.revenueGrowthDelta}%` : `${variables.revenueGrowthDelta}%`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleVariableChange("revenueGrowthDelta", Math.max(-50, variables.revenueGrowthDelta - 5))}
                className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                -
              </button>
              <input
                type="range"
                min="-50"
                max="100"
                step="5"
                value={variables.revenueGrowthDelta}
                onChange={(e) => handleVariableChange("revenueGrowthDelta", Number(e.target.value))}
                className="flex-1 accent-emerald-600 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => handleVariableChange("revenueGrowthDelta", Math.min(100, variables.revenueGrowthDelta + 5))}
                className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                +
              </button>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-50% (Contraction)</span>
              <span>Baseline (0%)</span>
              <span>+100% (Double Pace)</span>
            </div>
          </div>

          {/* Slider 2: Pricing Power & ARPU Expansion */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-750 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
                <span>Pricing Power / Contract ARPU</span>
              </label>
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                  variables.pricingPowerDelta > 0
                    ? "text-indigo-700 bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
                    : variables.pricingPowerDelta < 0
                    ? "text-rose-700 bg-rose-100 dark:bg-rose-950 dark:text-rose-300"
                    : "text-slate-600 bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {variables.pricingPowerDelta > 0 ? `+${variables.pricingPowerDelta}%` : `${variables.pricingPowerDelta}%`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleVariableChange("pricingPowerDelta", Math.max(-25, variables.pricingPowerDelta - 5))}
                className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                -
              </button>
              <input
                type="range"
                min="-25"
                max="35"
                step="5"
                value={variables.pricingPowerDelta}
                onChange={(e) => handleVariableChange("pricingPowerDelta", Number(e.target.value))}
                className="flex-1 accent-indigo-600 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => handleVariableChange("pricingPowerDelta", Math.min(35, variables.pricingPowerDelta + 5))}
                className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                +
              </button>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Expands revenue with zero incremental COGS, directly enhancing gross margin.
            </p>
          </div>

          {/* Slider 3: COGS / Direct Unit Cost Efficiency */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-750 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <PieChart className="w-3.5 h-3.5 text-amber-500" />
                <span>COGS / Direct Cost Delta</span>
              </label>
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                  variables.cogsEfficiencyDelta < 0
                    ? "text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
                    : variables.cogsEfficiencyDelta > 0
                    ? "text-rose-700 bg-rose-100 dark:bg-rose-950 dark:text-rose-300"
                    : "text-slate-600 bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {variables.cogsEfficiencyDelta > 0 ? `+${variables.cogsEfficiencyDelta}%` : `${variables.cogsEfficiencyDelta}%`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleVariableChange("cogsEfficiencyDelta", Math.max(-30, variables.cogsEfficiencyDelta - 5))}
                className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                -
              </button>
              <input
                type="range"
                min="-30"
                max="30"
                step="2"
                value={variables.cogsEfficiencyDelta}
                onChange={(e) => handleVariableChange("cogsEfficiencyDelta", Number(e.target.value))}
                className="flex-1 accent-amber-500 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => handleVariableChange("cogsEfficiencyDelta", Math.min(30, variables.cogsEfficiencyDelta + 5))}
                className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                +
              </button>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span className="text-emerald-600 dark:text-emerald-400">-30% (30% cheaper costs)</span>
              <span className="text-rose-600 dark:text-rose-400">+30% (cost inflation)</span>
            </div>
          </div>

          {/* Slider 4: Operating Expenses (OPEX / SG&A) */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-750 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5 text-sky-600" />
                <span>Operating Expenses (OPEX Scale)</span>
              </label>
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                  variables.opexDelta < 0
                    ? "text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
                    : variables.opexDelta > 0
                    ? "text-rose-700 bg-rose-100 dark:bg-rose-950 dark:text-rose-300"
                    : "text-slate-600 bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {variables.opexDelta > 0 ? `+${variables.opexDelta}%` : `${variables.opexDelta}%`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleVariableChange("opexDelta", Math.max(-40, variables.opexDelta - 5))}
                className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                -
              </button>
              <input
                type="range"
                min="-40"
                max="60"
                step="5"
                value={variables.opexDelta}
                onChange={(e) => handleVariableChange("opexDelta", Number(e.target.value))}
                className="flex-1 accent-sky-600 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => handleVariableChange("opexDelta", Math.min(60, variables.opexDelta + 5))}
                className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                +
              </button>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span className="text-emerald-600 dark:text-emerald-400">-40% (Lean team)</span>
              <span className="text-rose-600 dark:text-rose-400">+60% (Heavy headcount)</span>
            </div>
          </div>

          {/* Advanced Sliders Toggle (CAC & CapEx) */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvancedSliders(!showAdvancedSliders)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              {showAdvancedSliders ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{showAdvancedSliders ? "Hide Advanced Cost Variables" : "Show CAC & CapEx Variables"}</span>
            </button>

            {showAdvancedSliders && (
              <div className="mt-2 space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
                {/* CAC Efficiency */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">CAC Marketing Efficiency</span>
                    <span className="font-mono text-xs font-bold">
                      {variables.cacDelta > 0 ? `+${variables.cacDelta}%` : `${variables.cacDelta}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    step="5"
                    value={variables.cacDelta}
                    onChange={(e) => handleVariableChange("cacDelta", Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* CapEx Modifier */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">CapEx / Equipment Scale</span>
                    <span className="font-mono text-xs font-bold">
                      {variables.capexDelta > 0 ? `+${variables.capexDelta}%` : `${variables.capexDelta}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="50"
                    step="5"
                    value={variables.capexDelta}
                    onChange={(e) => handleVariableChange("capexDelta", Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chart Overlay & Impact Summary (7 Cols on large screen) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Chart Metric Tabs & Variance Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setSelectedMetric("revenue")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  selectedMetric === "revenue"
                    ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Revenue
              </button>
              <button
                type="button"
                onClick={() => setSelectedMetric("ebitda")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  selectedMetric === "ebitda"
                    ? "bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                EBITDA
              </button>
              <button
                type="button"
                onClick={() => setSelectedMetric("cash")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  selectedMetric === "cash"
                    ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Ending Cash
              </button>
              <button
                type="button"
                onClick={() => setSelectedMetric("margins")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  selectedMetric === "margins"
                    ? "bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Gross Margin %
              </button>
            </div>

            {/* Delta Callout */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Y5 Delta:</span>
              <span
                className={`text-xs font-mono font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
                  y5Delta > 0
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : y5Delta < 0
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {y5Delta > 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : y5Delta < 0 ? (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                ) : null}
                {currentSeries.unit === "currency"
                  ? `${y5Delta >= 0 ? "+" : ""}${formatCurrency(y5Delta)} (${y5DeltaPercent >= 0 ? "+" : ""}${y5DeltaPercent.toFixed(1)}%)`
                  : `${y5Delta >= 0 ? "+" : ""}${y5Delta.toFixed(1)}%`}
              </span>
            </div>
          </div>

          {/* Responsive SVG Chart Overlay Container */}
          <div className="bg-slate-50/90 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/80 relative">
            <div className="flex items-center justify-between text-xs mb-1 px-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                  <span className="w-3 h-0.5 border-b-2 border-dashed border-slate-400 inline-block"></span>
                  Baseline Model
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  <span
                    className="w-3 h-1 rounded-full inline-block"
                    style={{ backgroundColor: currentSeries.color }}
                  ></span>
                  What-If Recalculated
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Hover point to inspect delta
              </span>
            </div>

            {/* SVG Chart */}
            <div className="w-full relative" style={{ height: `${chartHeight}px` }}>
              <svg
                className="w-full h-full overflow-visible"
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="whatif-area-green" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                  </linearGradient>
                  <linearGradient id="whatif-area-red" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.05" />
                  </linearGradient>
                  <linearGradient id="scenario-line-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={currentSeries.color} />
                    <stop offset="100%" stopColor={currentSeries.color} />
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const val = minValue + (1 - ratio) * valueRange;
                  const y = padding.top + ratio * innerHeight;
                  return (
                    <g key={`grid-${idx}`}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={chartWidth - padding.right}
                        y2={y}
                        stroke="#94a3b8"
                        strokeDasharray="2 3"
                        strokeWidth="0.6"
                        opacity={0.35}
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 3.5}
                        textAnchor="end"
                        fontSize="9"
                        fill="#64748b"
                        className="font-mono select-none"
                      >
                        {currentSeries.unit === "currency" ? formatShortCurrency(val) : `${val.toFixed(0)}%`}
                      </text>
                    </g>
                  );
                })}

                {/* Shaded Delta Ribbon Area Between Baseline & What-If */}
                <path
                  d={deltaAreaPath}
                  fill={y5Delta >= 0 ? "url(#whatif-area-green)" : "url(#whatif-area-red)"}
                  opacity={0.65}
                />

                {/* Baseline Series Line (Dashed Silver/Slate) */}
                <path
                  d={basePath}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Recalculated Scenario Series Line (Bold Vibrant) */}
                <path
                  d={scenarioPath}
                  fill="none"
                  stroke={currentSeries.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points & Interactive Columns */}
                {years.map((year, idx) => {
                  const x = getX(idx);
                  const baseVal = currentSeries.base[idx] || 0;
                  const scVal = currentSeries.scenario[idx] || 0;
                  const yBase = getY(baseVal);
                  const ySc = getY(scVal);
                  const isHovered = hoveredYearIdx === idx;

                  return (
                    <g
                      key={`point-group-${idx}`}
                      onMouseEnter={() => setHoveredYearIdx(idx)}
                      onMouseLeave={() => setHoveredYearIdx(null)}
                      className="cursor-pointer"
                    >
                      {/* Vertical Indicator Guide when hovered */}
                      {isHovered && (
                        <line
                          x1={x}
                          y1={padding.top}
                          x2={x}
                          y2={padding.top + innerHeight}
                          stroke="#cbd5e1"
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                        />
                      )}

                      {/* Baseline Point */}
                      <circle
                        cx={x}
                        cy={yBase}
                        r={isHovered ? 4.5 : 3.5}
                        fill="#ffffff"
                        stroke="#64748b"
                        strokeWidth="1.5"
                      />

                      {/* Scenario Point */}
                      <circle
                        cx={x}
                        cy={ySc}
                        r={isHovered ? 6 : 4.5}
                        fill={currentSeries.color}
                        stroke="#ffffff"
                        strokeWidth="2"
                      />

                      {/* X-Axis Label */}
                      <text
                        x={x}
                        y={chartHeight - 10}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight={isHovered ? "bold" : "normal"}
                        fill={isHovered ? "#0f172a" : "#64748b"}
                        className="font-mono select-none"
                      >
                        {year}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Hover Tooltip Overlay */}
              {hoveredYearIdx !== null && (
                <div
                  className="absolute z-20 pointer-events-none transform -translate-x-1/2 bg-slate-900/95 text-white dark:bg-slate-950/95 dark:text-slate-100 p-2.5 rounded-lg shadow-xl border border-slate-750 text-xs w-48 animate-in fade-in duration-100"
                  style={{
                    left: `${(getX(hoveredYearIdx) / chartWidth) * 100}%`,
                    top: "15px",
                  }}
                >
                  <div className="font-bold border-b border-slate-750 pb-1 mb-1.5 flex items-center justify-between">
                    <span className="text-emerald-400 font-mono">{years[hoveredYearIdx]}</span>
                    <span className="text-[10px] text-slate-400">Delta Variance</span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between text-slate-300">
                      <span>Baseline:</span>
                      <span className="font-semibold">
                        {currentSeries.unit === "currency"
                          ? formatCurrency(currentSeries.base[hoveredYearIdx])
                          : formatPercent(currentSeries.base[hoveredYearIdx])}
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>What-If:</span>
                      <span>
                        {currentSeries.unit === "currency"
                          ? formatCurrency(currentSeries.scenario[hoveredYearIdx])
                          : formatPercent(currentSeries.scenario[hoveredYearIdx])}
                      </span>
                    </div>
                    {(() => {
                      const b = currentSeries.base[hoveredYearIdx] || 0;
                      const s = currentSeries.scenario[hoveredYearIdx] || 0;
                      const diff = s - b;
                      const pct = b !== 0 ? (diff / Math.abs(b)) * 100 : 0;
                      return (
                        <div
                          className={`flex justify-between pt-1 border-t border-slate-800 font-bold ${
                            diff >= 0 ? "text-emerald-300" : "text-rose-300"
                          }`}
                        >
                          <span>Variance:</span>
                          <span>
                            {diff >= 0 ? "+" : ""}
                            {currentSeries.unit === "currency" ? formatCurrency(diff) : `${diff.toFixed(1)}%`} (
                            {pct >= 0 ? "+" : ""}
                            {pct.toFixed(1)}%)
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Year-by-Year Delta Chips */}
          <div className="grid grid-cols-5 gap-2">
            {years.map((yr, idx) => {
              const baseV = currentSeries.base[idx] || 0;
              const scV = currentSeries.scenario[idx] || 0;
              const diff = scV - baseV;
              const pct = baseV !== 0 ? (diff / Math.abs(baseV)) * 100 : 0;
              return (
                <div
                  key={`delta-col-${idx}`}
                  className="p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center"
                >
                  <span className="text-[10px] font-mono text-slate-400 font-bold block">{`Y${idx + 1}`}</span>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                    {currentSeries.unit === "currency" ? formatShortCurrency(scV) : formatPercent(scV)}
                  </p>
                  <span
                    className={`text-[9px] font-mono font-semibold block ${
                      diff > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : diff < 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-slate-400"
                    }`}
                  >
                    {diff > 0 ? `+${pct.toFixed(0)}%` : diff < 0 ? `${pct.toFixed(0)}%` : "0%"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Recalculated KPI Impact Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {/* KPI 1: Y5 Target Revenue */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-500 font-medium block">Y5 Target Revenue</span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                {formatCurrency(recalculated.totalRevenue[recalculated.totalRevenue.length - 1])}
              </p>
              <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                Base: {formatShortCurrency(baselineFinancials.totalRevenue[baselineFinancials.totalRevenue.length - 1])}
              </span>
            </div>

            {/* KPI 2: Y5 EBITDA */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-500 font-medium block">Y5 EBITDA</span>
              <p className="text-sm font-bold text-sky-600 dark:text-sky-400 font-mono mt-0.5">
                {formatCurrency(recalculated.ebitda[recalculated.ebitda.length - 1])}
              </p>
              <span className="text-[9px] font-mono text-slate-500">
                {formatPercent(recalculated.ebitdaMarginPercent[recalculated.ebitdaMarginPercent.length - 1])} margin
              </span>
            </div>

            {/* KPI 3: Break-Even Timing */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-500 font-medium block">Break-Even Timing</span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                Month {recalculated.breakEven.breakEvenMonth}
              </p>
              <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {recalculated.breakEven.breakEvenMonth < (baselineFinancials.breakEven.breakEvenMonth || 16)
                  ? `${(baselineFinancials.breakEven.breakEvenMonth || 16) - recalculated.breakEven.breakEvenMonth} mos faster`
                  : recalculated.breakEven.breakEvenMonth > (baselineFinancials.breakEven.breakEvenMonth || 16)
                  ? `${recalculated.breakEven.breakEvenMonth - (baselineFinancials.breakEven.breakEvenMonth || 16)} mos later`
                  : "Same as baseline"}
              </span>
            </div>

            {/* KPI 4: Target Investor ROI Multiple */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-500 font-medium block">Projected 5-Yr ROI</span>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {recalculated.investorMetrics.projectedROI}
              </p>
              <span className="text-[9px] font-mono text-slate-500">
                IRR: {recalculated.investorMetrics.projectedIRR}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recalculated P&L Table Accordion Toggle */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowTableComparison(!showTableComparison)}
          className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-600" />
          <span>{showTableComparison ? "Hide Recalculated Financial Comparison Table" : "Inspect Recalculated 5-Year Financial Statement Line Items"}</span>
          {showTableComparison ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <span className="text-[10px] font-mono text-slate-400">
          Comparing Baseline vs. Recalculated Scenario
        </span>
      </div>

      {/* Recalculated P&L Table */}
      {showTableComparison && (
        <div className="overflow-x-auto border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
                <th className="py-2 px-4 w-1/3">Line Item</th>
                {years.map((yr, idx) => (
                  <th key={idx} className="py-2 px-3 text-right font-mono">
                    {yr}
                  </th>
                ))}
                <th className="py-2 px-4 text-right font-mono">5-Yr Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {/* Total Revenue */}
              <tr className="bg-emerald-50/40 dark:bg-emerald-950/20 font-bold">
                <td className="py-2 px-4 text-emerald-900 dark:text-emerald-300">
                  Total Net Revenue (What-If)
                </td>
                {recalculated.totalRevenue.map((v, idx) => {
                  const b = baselineFinancials.totalRevenue[idx] || 0;
                  const diff = v - b;
                  return (
                    <td key={idx} className="py-2 px-3 text-right font-mono">
                      <div>{formatCurrency(v)}</div>
                      {diff !== 0 && (
                        <div
                          className={`text-[9px] ${
                            diff > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {diff > 0 ? `+${formatShortCurrency(diff)}` : formatShortCurrency(diff)}
                        </div>
                      )}
                    </td>
                  );
                })}
                <td className="py-2 px-4 text-right font-mono text-emerald-900 dark:text-emerald-300">
                  {formatCurrency(recalculated.totalRevenue.reduce((a, b) => a + b, 0))}
                </td>
              </tr>

              {/* Total COGS */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400">Total COGS (Direct Costs)</td>
                {recalculated.totalCogs.map((v, idx) => (
                  <td key={idx} className="py-2 px-3 text-right font-mono text-rose-600/90 dark:text-rose-400">
                    {formatCurrency(v)}
                  </td>
                ))}
                <td className="py-2 px-4 text-right font-mono text-rose-600/90 dark:text-rose-400">
                  {formatCurrency(recalculated.totalCogs.reduce((a, b) => a + b, 0))}
                </td>
              </tr>

              {/* Gross Profit */}
              <tr className="bg-indigo-50/30 dark:bg-indigo-950/20 font-bold">
                <td className="py-2 px-4 text-indigo-900 dark:text-indigo-300">Gross Profit (What-If)</td>
                {recalculated.grossProfit.map((v, idx) => (
                  <td key={idx} className="py-2 px-3 text-right font-mono text-indigo-900 dark:text-indigo-300">
                    {formatCurrency(v)}
                    <span className="block text-[9px] font-normal text-indigo-700 dark:text-indigo-400">
                      {formatPercent(recalculated.grossMarginPercent[idx])}
                    </span>
                  </td>
                ))}
                <td className="py-2 px-4 text-right font-mono text-indigo-900 dark:text-indigo-300">
                  {formatCurrency(recalculated.grossProfit.reduce((a, b) => a + b, 0))}
                </td>
              </tr>

              {/* OPEX */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400">Operating Expenses (OPEX)</td>
                {recalculated.totalOpex.map((v, idx) => (
                  <td key={idx} className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                    {formatCurrency(v)}
                  </td>
                ))}
                <td className="py-2 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                  {formatCurrency(recalculated.totalOpex.reduce((a, b) => a + b, 0))}
                </td>
              </tr>

              {/* EBITDA */}
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 font-bold">
                <td className="py-2 px-4 text-slate-900 dark:text-slate-100">EBITDA (What-If)</td>
                {recalculated.ebitda.map((v, idx) => (
                  <td
                    key={idx}
                    className={`py-2 px-3 text-right font-mono ${
                      v < 0 ? "text-rose-600" : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {formatCurrency(v)}
                    <span className="block text-[9px] font-normal text-slate-500">
                      {formatPercent(recalculated.ebitdaMarginPercent[idx])}
                    </span>
                  </td>
                ))}
                <td className="py-2 px-4 text-right font-mono">
                  {formatCurrency(recalculated.ebitda.reduce((a, b) => a + b, 0))}
                </td>
              </tr>

              {/* Net Income */}
              <tr className="bg-slate-50/50 dark:bg-slate-850/40 font-bold">
                <td className="py-2 px-4 text-slate-900 dark:text-slate-100">Net Income (What-If)</td>
                {recalculated.netIncome.map((v, idx) => (
                  <td
                    key={idx}
                    className={`py-2 px-3 text-right font-mono ${
                      v < 0 ? "text-rose-600" : "text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    {formatCurrency(v)}
                  </td>
                ))}
                <td className="py-2 px-4 text-right font-mono">
                  {formatCurrency(recalculated.netIncome.reduce((a, b) => a + b, 0))}
                </td>
              </tr>

              {/* Ending Cash */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 font-semibold">
                <td className="py-2 px-4 text-indigo-700 dark:text-indigo-400">Cumulative Ending Cash</td>
                {recalculated.cashFlow.endingCashBalance.map((v, idx) => (
                  <td key={idx} className="py-2 px-3 text-right font-mono text-indigo-700 dark:text-indigo-400">
                    {formatCurrency(v)}
                  </td>
                ))}
                <td className="py-2 px-4 text-right font-mono text-indigo-700 dark:text-indigo-400">
                  {formatCurrency(recalculated.cashFlow.endingCashBalance[years.length - 1])}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
