import React, { useState, useEffect } from "react";
import { BusinessPlan, SyncChangeDiff } from "../types";
import {
  Zap,
  Check,
  X,
  Layers,
  Sliders,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

interface SyncMasterFormatReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourcePlan: BusinessPlan;
  allPlans: BusinessPlan[];
  diffs?: SyncChangeDiff[];
  onApplySync: (targetPlanIds: string[]) => void;
  autoSyncEnabled: boolean;
  onToggleAutoSync: (enabled: boolean) => void;
}

export const SyncMasterFormatReviewModal: React.FC<SyncMasterFormatReviewModalProps> = ({
  isOpen,
  onClose,
  sourcePlan,
  allPlans,
  diffs,
  onApplySync,
  autoSyncEnabled,
  onToggleAutoSync,
}) => {
  const otherPlans = allPlans.filter((p) => p.id !== sourcePlan.id);

  // Default: select all other plans that have differing format settings
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Find plans that differ from sourcePlan
      const differing = otherPlans.filter(
        (p) =>
          p.formatSettings.whitespaceDensity !== sourcePlan.formatSettings.whitespaceDensity ||
          p.formatSettings.graphScale !== sourcePlan.formatSettings.graphScale ||
          p.formatSettings.fontHierarchy !== sourcePlan.formatSettings.fontHierarchy
      );
      setSelectedPlanIds(differing.map((p) => p.id));
    }
  }, [isOpen, sourcePlan, allPlans]);

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (selectedPlanIds.length === otherPlans.length) {
      setSelectedPlanIds([]);
    } else {
      setSelectedPlanIds(otherPlans.map((p) => p.id));
    }
  };

  const togglePlan = (id: string) => {
    setSelectedPlanIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    onApplySync(selectedPlanIds);
    onClose();
  };

  const inSyncCount = allPlans.filter(
    (p) =>
      p.formatSettings.whitespaceDensity === sourcePlan.formatSettings.whitespaceDensity &&
      p.formatSettings.graphScale === sourcePlan.formatSettings.graphScale
  ).length;

  const consistencyPercent = Math.round((inSyncCount / allPlans.length) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-review-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="sync-review-modal-title"
                  className="text-base font-bold text-slate-900 dark:text-slate-100"
                >
                  Sync Master Format Spacing
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Automated Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Apply spacing configuration from {sourcePlan.companyName} across your business plan library
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Consistency Overview Meter */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span>Library Spacing Alignment</span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {inSyncCount} of {allPlans.length} Plans Standardized
                </span>
              </div>
              <div className="w-48 sm:w-64 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${consistencyPercent}%` }}
                />
              </div>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {consistencyPercent}%
              </span>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Alignment
              </div>
            </div>
          </div>

          {/* Master Source Configuration Card */}
          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                  Source Spacing Configuration
                </span>
              </div>
              <span className="text-xs font-semibold font-mono text-emerald-700 dark:text-emerald-300">
                {sourcePlan.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-emerald-100 dark:border-emerald-900/40">
                <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  Whitespace Density
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100 capitalize mt-0.5">
                  {sourcePlan.formatSettings.whitespaceDensity}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {sourcePlan.formatSettings.whitespaceDensity === "compact"
                    ? "Zero topic gaps"
                    : sourcePlan.formatSettings.whitespaceDensity === "balanced"
                    ? "Standard padding"
                    : "Wide vertical spacing"}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-emerald-100 dark:border-emerald-900/40">
                <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  Financial Graph Scale
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100 capitalize mt-0.5">
                  {sourcePlan.formatSettings.graphScale}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {sourcePlan.formatSettings.graphScale === "compact"
                    ? "35% space-reduced"
                    : "Standard dimensions"}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-emerald-100 dark:border-emerald-900/40 col-span-2 sm:col-span-1">
                <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  Font Hierarchy
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100 capitalize mt-0.5">
                  {sourcePlan.formatSettings.fontHierarchy.replace("-", " ")}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Mathematical step ratio
                </div>
              </div>
            </div>
          </div>

          {/* Target Plans Selection List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Select Target Plans in Library
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Choose which business plans should inherit this spacing configuration
                </p>
              </div>

              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {selectedPlanIds.length === otherPlans.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {otherPlans.map((plan) => {
                const isSelected = selectedPlanIds.includes(plan.id);
                const isAlreadyAligned =
                  plan.formatSettings.whitespaceDensity === sourcePlan.formatSettings.whitespaceDensity &&
                  plan.formatSettings.graphScale === sourcePlan.formatSettings.graphScale;

                return (
                  <div
                    key={plan.id}
                    onClick={() => togglePlan(plan.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-600/70"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePlan(plan.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-emerald-500/20 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {plan.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {plan.sector}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          <span>
                            Current: {plan.formatSettings.whitespaceDensity} whitespace / {plan.formatSettings.graphScale} graphs
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAlreadyAligned ? (
                        <span className="px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 rounded border border-emerald-200 dark:border-emerald-800">
                          In Sync
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 rounded border border-amber-200 dark:border-amber-800">
                          Divergent
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Auto-Sync Toggle */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={(e) => onToggleAutoSync(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-emerald-500/20 cursor-pointer"
              />
              <div>
                <span className="font-semibold">
                  Enable automated background synchronization
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Automatically sync future manual layout adjustments across all plans without showing a proposal prompt.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            id="btn-apply-selected-sync"
            onClick={handleApply}
            disabled={selectedPlanIds.length === 0}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>
              Apply Spacing to {selectedPlanIds.length} Plan{selectedPlanIds.length !== 1 ? "s" : ""}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
