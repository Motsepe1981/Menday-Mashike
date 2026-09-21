import React from "react";
import { ShieldCheck, Lock, FileText, CheckCircle, MapPin, Users } from "lucide-react";
import { BusinessPlan } from "../types";

interface InvestorFooterProps {
  plan: BusinessPlan;
  pageNumber?: number;
  totalPages?: number;
  compact?: boolean;
}

export const InvestorFooter: React.FC<InvestorFooterProps> = ({
  plan,
  pageNumber = 1,
  totalPages = 5,
  compact = false,
}) => {
  const isVerified = plan.status === "verified" || plan.isAttachedReference;
  const hasExtendedMetadata = Boolean(plan.tagline || plan.founderNames || plan.locationRegion);

  return (
    <footer
      id={`investor-footer-page-${pageNumber}`}
      className={`w-full mt-8 border-t border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 print:bg-white text-slate-500 dark:text-slate-400 text-xs select-none transition-colors ${
        compact ? "pt-2 pb-2" : "pt-3 pb-2.5"
      }`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-4">
        {/* Left: Confidentiality & Compliance */}
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
            <Lock className="w-3 h-3 text-amber-600 dark:text-amber-500 shrink-0" />
            <span className="tracking-wide">CONFIDENTIAL</span>
          </div>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
          <span className="text-slate-600 dark:text-slate-400 font-medium">
            {plan.formatSettings.footerDisclaimer || "Prepared For Accredited Investors Only"}
          </span>
        </div>

        {/* Center: Document Ref & Verification Badge */}
        <div className="flex items-center gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
            <FileText className="w-3 h-3 text-slate-500" />
            <span>{plan.docReference}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600 dark:text-slate-400 font-sans">{plan.revision}</span>
          </div>

          {plan.formatSettings.showFooterVerifiedSeal && (
            <div
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                isVerified
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
              }`}
            >
              {isVerified ? (
                <>
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Verified Hub Standard</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Pending Format Audit</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Page Counter & Stamp */}
        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 dark:text-slate-400">
          <span>{plan.companyName}</span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
            Page {pageNumber} of {totalPages}
          </span>
        </div>
      </div>

      {/* Injected Meta-Data Row: Project Tagline, Founder Names, and Location/Region */}
      {hasExtendedMetadata && (
        <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400 dark:text-slate-500 px-4">
          <div className="flex items-center gap-1.5 truncate max-w-xl">
            {plan.tagline && (
              <span className="italic font-serif text-slate-500 dark:text-slate-400 truncate">
                "{plan.tagline}"
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 font-mono text-[10px] flex-wrap justify-end">
            {plan.founderNames && (
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                <Users className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-slate-400 dark:text-slate-500 font-sans">Founders:</span>
                <span className="font-sans font-medium text-slate-700 dark:text-slate-300">{plan.founderNames}</span>
              </span>
            )}
            {plan.founderNames && plan.locationRegion && (
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            )}
            {plan.locationRegion && (
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                <MapPin className="w-2.5 h-2.5 text-indigo-500" />
                <span className="font-semibold text-slate-400 dark:text-slate-500 font-sans">Region:</span>
                <span className="font-sans font-medium text-slate-700 dark:text-slate-300">{plan.locationRegion}</span>
              </span>
            )}
          </div>
        </div>
      )}
    </footer>
  );
};
