import React, { useState } from "react";
import {
  FileDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Minimize2,
  Maximize2,
  FileText,
  Layers,
  Sparkles,
} from "lucide-react";
import { PdfExportProgress } from "../utils/pdfGenerator";

interface PdfGenerationProgressBarProps {
  progress: PdfExportProgress | null;
  onCancel?: () => void;
  onDismiss?: () => void;
  companyName: string;
  isSinglePage?: boolean;
}

const PAGE_NAMES: Record<number, string> = {
  1: "Executive Summary & Thesis",
  2: "TAM & Unit Economics",
  3: "Governance & Organogram",
  4: "5-Year Financial Schedule",
  5: "Cash Flow & Term Sheet",
};

export const PdfGenerationProgressBar: React.FC<PdfGenerationProgressBarProps> = ({
  progress,
  onCancel,
  onDismiss,
  companyName,
  isSinglePage = false,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!progress) return null;

  const isCompleted = progress.stage === "completed" || progress.percent >= 100;
  const isFinalizing = progress.stage === "finalizing" || progress.percent >= 93;
  const percentClamped = Math.min(100, Math.max(0, progress.percent));

  // If minimized, display a sleek docked mini pill at bottom-right
  if (isMinimized) {
    return (
      <div
        id="pdf-progress-minimized"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-xl animate-in slide-in-from-bottom-2 duration-200 print:hidden text-xs"
      >
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <Loader2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-spin shrink-0" />
          )}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {isCompleted ? "PDF Ready" : `Generating PDF (${percentClamped}%)`}
          </span>
        </div>

        {/* Mini progress bar */}
        <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${percentClamped}%` }}
          />
        </div>

        <button
          onClick={() => setIsMinimized(false)}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Expand progress details"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {isCompleted && onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      id="pdf-generation-progress-card"
      role="progressbar"
      aria-valuenow={percentClamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden print:hidden transition-all duration-200 animate-in slide-in-from-bottom-3"
    >
      {/* Top Header */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isCompleted
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {isCompleted
                ? "PDF Download Complete"
                : isFinalizing
                ? "Assembling Document"
                : "Rendering Investor PDF"}
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
              {companyName}
            </p>
          </div>
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Minimize to floating pill"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          {isCompleted && onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-5 space-y-4">
        {/* Percentage Counter & Stage Status */}
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span
              id="pdf-progress-percentage"
              className="text-3xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-slate-100"
            >
              {percentClamped}
            </span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              %
            </span>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isCompleted
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  Saved to Disk
                </>
              ) : (
                <>
                  <Loader2 className="w-2.5 h-2.5 animate-spin text-emerald-600" />
                  {progress.totalPages > 1
                    ? `Page ${Math.max(1, progress.currentPage)} of ${progress.totalPages}`
                    : "Processing Page"}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar Track */}
        <div className="relative">
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5">
            <div
              id="pdf-progress-fill-bar"
              className="h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 relative overflow-hidden"
              style={{ width: `${percentClamped}%` }}
            >
              {/* Shimmer pulse effect during active rendering */}
              {!isCompleted && (
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Active Stage & Status Text */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 shrink-0">
              {isCompleted ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Layers className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 leading-snug break-words">
                {progress.message}
              </p>
              {progress.currentPageTitle && !isCompleted && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Section: {progress.currentPageTitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Multi-Page Visual Step Indicators (for full document export) */}
        {!isSinglePage && progress.totalPages > 1 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Document Page Progress</span>
              <span>
                {progress.completedPages.length}/{progress.totalPages} Pages Ready
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((pageNum) => {
                const isPageDone = progress.completedPages.includes(pageNum);
                const isCurrent = progress.currentPage === pageNum && !isPageDone && !isCompleted;

                return (
                  <div
                    key={pageNum}
                    title={`Page ${pageNum}: ${PAGE_NAMES[pageNum] || ""}`}
                    className={`flex flex-col items-center p-1 rounded-lg border text-center transition-all ${
                      isPageDone
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                        : isCurrent
                        ? "bg-emerald-100/70 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/20"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-center w-4 h-4 mb-0.5">
                      {isPageDone ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      ) : isCurrent ? (
                        <Loader2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 animate-spin" />
                      ) : (
                        <span className="text-[9px] font-mono">{pageNum}</span>
                      )}
                    </div>
                    <span className="text-[8px] font-bold tracking-tight uppercase truncate w-full">
                      P{pageNum}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quality Footnote & Action Button */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[9px] text-slate-400 space-x-2">
            <span>A4 Portrait</span>
            <span>•</span>
            <span>2× Retina Vector</span>
            <span>•</span>
            <span>Compact Density</span>
          </div>

          {!isCompleted && onCancel ? (
            <button
              onClick={onCancel}
              className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          ) : isCompleted && onDismiss ? (
            <button
              onClick={onDismiss}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 transition-colors"
            >
              Dismiss
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
