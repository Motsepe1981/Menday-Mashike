import React from "react";
import { BusinessPlan } from "../types";
import { Zap, Check, AlertCircle } from "lucide-react";

interface SyncMasterFormatStatusBadgeProps {
  plans: BusinessPlan[];
  referencePlan: BusinessPlan;
  onOpenReview: () => void;
  autoSyncEnabled: boolean;
}

export const SyncMasterFormatStatusBadge: React.FC<SyncMasterFormatStatusBadgeProps> = ({
  plans,
  referencePlan,
  onOpenReview,
  autoSyncEnabled,
}) => {
  const masterWhitespace = referencePlan.formatSettings.whitespaceDensity;
  const masterGraphScale = referencePlan.formatSettings.graphScale;

  const inSyncCount = plans.filter(
    (p) =>
      p.formatSettings.whitespaceDensity === masterWhitespace &&
      p.formatSettings.graphScale === masterGraphScale
  ).length;

  const allInSync = inSyncCount === plans.length;

  return (
    <button
      id="btn-sync-master-format-status"
      onClick={onOpenReview}
      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-2xs group ${
        allInSync
          ? "bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
          : "bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100"
      }`}
      title={
        allInSync
          ? `All ${plans.length} plans synchronized with ${masterWhitespace} spacing & ${masterGraphScale} graphs`
          : `${plans.length - inSyncCount} plans diverge from ${masterWhitespace} spacing. Click to review.`
      }
    >
      <div className="relative flex items-center justify-center">
        <Zap
          className={`w-3.5 h-3.5 ${
            allInSync
              ? "text-emerald-600 dark:text-emerald-400 group-hover:scale-110"
              : "text-amber-600 dark:text-amber-400 animate-pulse"
          } transition-transform`}
        />
        <span
          className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${
            allInSync ? "bg-emerald-500" : "bg-amber-500 animate-ping"
          }`}
        />
      </div>

      <span className="hidden lg:inline text-[11px] font-bold">
        {allInSync ? "Master Spacing" : "Spacing Divergent"}
      </span>

      <span
        className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-extrabold ${
          allInSync
            ? "bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200"
            : "bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200"
        }`}
      >
        {inSyncCount}/{plans.length}
      </span>

      {autoSyncEnabled && (
        <span className="text-[9px] font-mono uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1 rounded border border-emerald-300 dark:border-emerald-800 hidden xl:inline">
          Auto
        </span>
      )}
    </button>
  );
};
