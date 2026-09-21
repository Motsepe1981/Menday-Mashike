import React, { useState } from "react";
import { BusinessPlan } from "../types";
import { FinancialSplitView } from "./FinancialSplitView";
import {
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Layers,
  Sparkles,
  Users,
  FileSpreadsheet,
  CheckCircle2,
  Check,
  ArrowLeftRight,
  LayoutGrid,
} from "lucide-react";

interface ActivityHubListProps {
  plans: BusinessPlan[];
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
  onApplyMasterFormatToAll: () => void;
  onOpenAudit: (plan: BusinessPlan) => void;
  appliedSuccess?: boolean;
  initialSplitView?: boolean;
}

export const ActivityHubList: React.FC<ActivityHubListProps> = ({
  plans,
  selectedPlanId,
  onSelectPlan,
  onApplyMasterFormatToAll,
  onOpenAudit,
  appliedSuccess = false,
  initialSplitView = false,
}) => {
  const [hubViewMode, setHubViewMode] = useState<"grid" | "split">(
    initialSplitView ? "split" : "grid"
  );
  const [splitPlanAId, setSplitPlanAId] = useState<string>(
    selectedPlanId || plans.find((p) => p.isAttachedReference)?.id || plans[0]?.id || ""
  );
  const [splitPlanBId, setSplitPlanBId] = useState<string>(() => {
    const other = plans.find((p) => p.id !== selectedPlanId);
    return other ? other.id : plans[1]?.id || plans[0]?.id || "";
  });

  const masterPlan = plans.find((p) => p.isAttachedReference) || plans[0];
  const plansWithMissing = plans.filter((p) => p.financials.missingFields && p.financials.missingFields.length > 0);

  const handleStartCompare = (planId: string) => {
    if (planId === splitPlanAId) {
      // Pick another plan for B
      const other = plans.find((p) => p.id !== planId);
      if (other) setSplitPlanBId(other.id);
    } else {
      setSplitPlanBId(planId);
    }
    setHubViewMode("split");
  };

  const formatCurrency = (val: number | undefined) => {
    if (!val) return "$0";
    if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  return (
    <div className="w-full space-y-5">
      {/* Activity Hub Banner */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl border border-slate-700/60 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 uppercase tracking-wider">
              Activity Hub Portfolio
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {plans.length} Enterprise Business Plans Active
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Standardized Investor Business Plan Directory
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Attached Master Model (Apex AgTech) serves as the golden standard for financial columns, compact graphs, whitespace formatting, fillable organograms, and investor footers across all active ventures.
          </p>
        </div>

        {/* Master Actions & View Mode Toggle */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Mode Switcher: Grid vs Split-View */}
          <div className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-700/80 shadow-inner">
            <button
              id="btn-hub-grid-view"
              onClick={() => setHubViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                hubViewMode === "grid"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Directory Grid</span>
            </button>
            <button
              id="btn-hub-split-view"
              onClick={() => setHubViewMode("split")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                hubViewMode === "split"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-slate-300 hover:text-white"
              }`}
              title="Compare financials of any two business plans side-by-side using Recharts"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Split-View Mode</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-400/40">
                Recharts
              </span>
            </button>
          </div>

          <button
            onClick={onApplyMasterFormatToAll}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-md transition-all cursor-pointer"
          >
            {appliedSuccess ? <Check className="w-4 h-4 text-emerald-900" /> : <Layers className="w-4 h-4 text-emerald-900" />}
            {appliedSuccess ? "Formatting Applied!" : "Apply Master Format to All"}
          </button>
        </div>
      </div>

      {/* Render Split-View Mode */}
      {hubViewMode === "split" ? (
        <FinancialSplitView
          plans={plans}
          initialPlanAId={splitPlanAId}
          initialPlanBId={splitPlanBId}
          onSelectPlanForStudio={onSelectPlan}
          onOpenAudit={onOpenAudit}
          onCloseSplitView={() => setHubViewMode("grid")}
        />
      ) : (
        <>
          {/* Missing Data Warning Alert if any plans have missing info */}
          {plansWithMissing.length > 0 && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  <strong>{plansWithMissing.length} Business Plans</strong> have missing financial schedules (Cash flow, CapEx, or Break-even).
                </span>
              </div>
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                Use verification against the Attached Plan to complete.
              </span>
            </div>
          )}

          {/* Business Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan) => {
          const isSelected = plan.id === selectedPlanId;
          const isMaster = plan.isAttachedReference;
          const hasMissing = plan.financials.missingFields && plan.financials.missingFields.length > 0;
          const openRoles = plan.organogram.filter((n) => n.status === "Open/Hiring").length;

          return (
            <div
              key={plan.id}
              className={`p-5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? "bg-white dark:bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
              }`}
            >
              <div>
                {/* Top badges */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {plan.sector}
                    </span>
                    {isMaster && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        <ShieldCheck className="w-3 h-3" /> Attached Master Model
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {hasMissing ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                        <AlertTriangle className="w-2.5 h-2.5" /> Missing Data ({plan.financials.missingFields.length})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Verified Investor Ready
                      </span>
                    )}
                  </div>
                </div>

                {/* Plan Name & Tagline */}
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {plan.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {plan.tagline}
                </p>

                {/* Key Metrics Bento */}
                <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[9px] text-slate-500 uppercase">Y5 Revenue</span>
                    <p className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                      {formatCurrency(plan.financials.totalRevenue[plan.financials.totalRevenue.length - 1])}
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[9px] text-slate-500 uppercase">Target Raise</span>
                    <p className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatCurrency(plan.financials.investorMetrics.totalFundingRequired)}
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[9px] text-slate-500 uppercase">Break-Even</span>
                    <p className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                      {plan.financials.breakEven.breakEvenMonth ? `M${plan.financials.breakEven.breakEvenMonth}` : "Missing"}
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[9px] text-slate-500 uppercase">Organogram</span>
                    <p className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                      {plan.organogram.length} Roles
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                  <span>{plan.docReference}</span>
                  <span>•</span>
                  <span>{plan.revision}</span>
                </div>

                <div className="flex items-center gap-2">
                  {hasMissing && (
                    <button
                      onClick={() => onOpenAudit(plan)}
                      className="px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Audit & Verify
                    </button>
                  )}

                  <button
                    onClick={() => handleStartCompare(plan.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="Compare this plan's financials in Split-View"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
                    <span>Compare</span>
                  </button>

                  <button
                    onClick={() => onSelectPlan(plan.id)}
                    className={`flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <span>{isSelected ? "Active Plan" : "Open in Studio"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  )}
</div>
);
};
