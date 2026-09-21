import React from "react";
import { Lock, FileText, Shield, MapPin, Users, Sparkles } from "lucide-react";
import { BusinessPlan } from "../types";

interface PrintFriendlyHeaderProps {
  plan: BusinessPlan;
  pageNumber: number;
  totalPages?: number;
  sectionTitle: string;
  isCoverPage?: boolean;
}

export const PrintFriendlyHeader: React.FC<PrintFriendlyHeaderProps> = ({
  plan,
  pageNumber,
  totalPages = 5,
  sectionTitle,
  isCoverPage = false,
}) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Current Diligence Cycle";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const formattedDate = formatDate(plan.lastUpdated);

  if (isCoverPage) {
    return (
      <header
        id={`print-header-page-${pageNumber}`}
        className="w-full pb-3 mb-4 border-b border-slate-300 dark:border-slate-700/80 text-xs select-none transition-colors"
      >
        <div className="flex items-center justify-between gap-2 flex-wrap pb-2 mb-2 border-b border-slate-200/70 dark:border-slate-800">
          {/* Left classification & document classification */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
              {plan.sector || "Venture"}
            </span>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Official Investor Memorandum & Operating Model
            </span>
          </div>

          {/* Right Reference & Provenance */}
          <div className="flex items-center gap-3 font-mono text-[10px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <Lock className="w-3 h-3 text-amber-600 dark:text-amber-500 shrink-0" />
              CONFIDENTIAL
            </span>
            <span>•</span>
            <span>{plan.docReference}</span>
            <span>•</span>
            <span>{plan.revision}</span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Dynamic Meta-Data Header Strip: Company, Tagline, Founders, Location */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-slate-950 dark:text-slate-50 text-sm tracking-tight">
              {plan.companyName}
            </span>
            {plan.tagline && (
              <>
                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                <span className="text-xs font-medium italic text-slate-600 dark:text-slate-300">
                  "{plan.tagline}"
                </span>
              </>
            )}
          </div>

          {/* Founders & Region Metadata Pills */}
          <div className="flex items-center gap-3 text-[10px] text-slate-600 dark:text-slate-400">
            {plan.founderNames && (
              <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded font-medium border border-slate-200 dark:border-slate-700">
                <Users className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Leadership:</span>
                <span className="truncate max-w-[220px]">{plan.founderNames}</span>
              </span>
            )}
            {plan.locationRegion && (
              <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded font-medium border border-slate-200 dark:border-slate-700">
                <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Region:</span>
                <span>{plan.locationRegion}</span>
              </span>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      id={`print-header-page-${pageNumber}`}
      className="w-full pb-2.5 mb-4 border-b border-slate-300 dark:border-slate-700/80 text-xs select-none transition-colors"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Left: Company name, sector, section identifier & Tagline snippet */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-extrabold text-slate-900 dark:text-slate-100 tracking-tight text-sm">
            {plan.companyName}
          </span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            {plan.sector}
          </span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            {sectionTitle}
          </span>
          {plan.locationRegion && (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              <MapPin className="w-2.5 h-2.5 text-indigo-500" />
              {plan.locationRegion}
            </span>
          )}
        </div>

        {/* Right: Provenance metadata, Founders, and Confidentiality notice */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500 dark:text-slate-400 flex-wrap">
          {plan.founderNames && (
            <span className="hidden lg:inline text-slate-500 dark:text-slate-400 font-sans text-[10px] max-w-[180px] truncate">
              {plan.founderNames}
            </span>
          )}
          <div className="flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400">
            <Lock className="w-2.5 h-2.5" />
            <span>CONFIDENTIAL</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">{plan.docReference}</span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span>{plan.revision}</span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="font-sans font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
            Page {pageNumber} of {totalPages}
          </span>
        </div>
      </div>

      {/* Subtle Tagline subline on pages 2-5 if present */}
      {plan.tagline && (
        <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
          <span className="italic truncate max-w-xl font-serif text-slate-500 dark:text-slate-400">
            "{plan.tagline}"
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
            Investor Diligence Memo
          </span>
        </div>
      )}
    </header>
  );
};
