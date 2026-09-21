import React from "react";
import { FormatSyncProposal } from "../types";
import {
  Zap,
  Check,
  X,
  Sliders,
  Layers,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface SyncMasterFormatProposalProps {
  proposal: FormatSyncProposal | null;
  onApplySync: (targetPlanIds?: string[]) => void;
  onOpenReview: () => void;
  onDismiss: () => void;
  autoSyncEnabled: boolean;
  onToggleAutoSync: (enabled: boolean) => void;
}

export const SyncMasterFormatProposal: React.FC<SyncMasterFormatProposalProps> = ({
  proposal,
  onApplySync,
  onOpenReview,
  onDismiss,
  autoSyncEnabled,
  onToggleAutoSync,
}) => {
  if (!proposal) return null;

  const targetCount = proposal.targetPlanIds.length;

  return (
    <div
      id="sync-master-format-proposal-banner"
      role="alert"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-xl bg-slate-900/95 dark:bg-slate-900/95 text-white backdrop-blur-md rounded-2xl shadow-2xl border border-emerald-500/40 p-4 sm:p-5 animate-in slide-in-from-bottom-5 duration-300 ring-1 ring-emerald-500/20"
    >
      {/* Top Header Bar */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
            <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400/20 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white tracking-wide uppercase">
                Sync Master Format Detected
              </h4>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                Automated Monitor
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Manual layout adjustment made in{" "}
              <strong className="text-emerald-300 font-semibold">
                {proposal.sourceCompanyName}
              </strong>
            </p>
          </div>
        </div>

        <button
          id="btn-dismiss-sync-proposal"
          onClick={onDismiss}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Keep only for this plan (Dismiss)"
          aria-label="Dismiss proposal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Detected Spacing Adjustments */}
      <div className="my-3 space-y-2">
        <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          Detected Spacing Configuration:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {proposal.diffs.map((diff, idx) => (
            <div
              key={idx}
              className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-xs"
            >
              <span className="text-slate-300 font-medium">{diff.label}</span>
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="text-slate-400 line-through capitalize">
                  {diff.oldValue}
                </span>
                <ArrowRight className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-300 font-bold capitalize bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-700/40">
                  {diff.newValue}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-300 leading-relaxed pt-1">
          Apply this exact spacing configuration to the other{" "}
          <strong className="text-white font-semibold">
            {targetCount} business plan{targetCount > 1 ? "s" : ""}
          </strong>{" "}
          in your library ({proposal.targetPlanNames.join(", ")}) to maintain institutional visual consistency?
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80">
        <label className="flex items-center gap-2 text-[11px] text-slate-400 hover:text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoSyncEnabled}
            onChange={(e) => onToggleAutoSync(e.target.checked)}
            className="w-3.5 h-3.5 text-emerald-500 rounded border-slate-700 bg-slate-800 focus:ring-emerald-500/20"
          />
          <span>Auto-sync future layout tweaks</span>
        </label>

        <div className="flex items-center gap-2 justify-end">
          <button
            id="btn-sync-review-customize"
            onClick={onOpenReview}
            className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/90 rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Review & Select</span>
          </button>

          <button
            id="btn-sync-apply-all-plans"
            onClick={() => onApplySync()}
            className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>Sync to All {targetCount} Plans</span>
          </button>
        </div>
      </div>
    </div>
  );
};
