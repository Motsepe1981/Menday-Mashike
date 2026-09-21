import React, { useEffect, useState, useMemo } from "react";
import { BusinessPlan } from "../types";
import {
  FileDown,
  FileSpreadsheet,
  Image as ImageIcon,
  Printer,
  History,
  X,
  Sparkles,
  Check,
  ChevronRight,
  ChevronDown,
  Building2,
  FileText,
  Clock,
  Layers,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";

export interface QuickExportFloatingMenuProps {
  isOpen: boolean;
  onClose: () => void;
  plan: BusinessPlan;
  allPlans: BusinessPlan[];
  onSelectPlan: (planId: string) => void;
  onExportPdf: (singlePage?: number) => void;
  onExportExcel: () => void;
  onExportImage: () => void;
  onPrint: () => void;
  onOpenHistory: () => void;
  isGeneratingPdf?: boolean;
  isExportingExcel?: boolean;
  isExportingImage?: boolean;
}

const SINGLE_PAGES = [
  { page: 1, title: "Executive Summary & Thesis", desc: "Vision, traction & financing ask" },
  { page: 2, title: "TAM & Unit Economics", desc: "Market sizing, CAC & LTV payback" },
  { page: 3, title: "Governance & Organogram", desc: "Leadership hierarchy & open roles" },
  { page: 4, title: "5-Year Financial Schedules", desc: "P&L projections & compact graphs" },
  { page: 5, title: "Cash Reserves & Term Sheet", desc: "Capital runway & deal governance" },
];

export const QuickExportFloatingMenu: React.FC<QuickExportFloatingMenuProps> = ({
  isOpen,
  onClose,
  plan,
  allPlans,
  onSelectPlan,
  onExportPdf,
  onExportExcel,
  onExportImage,
  onPrint,
  onOpenHistory,
  isGeneratingPdf = false,
  isExportingExcel = false,
  isExportingImage = false,
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "single">("all");
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const isMac = useMemo(() => {
    return typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  }, []);

  const metaKeyLabel = isMac ? "⌘" : "Ctrl";

  // Power user keydown listeners when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger single-key actions if user is typing in an input or select
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") {
        if (e.key === "Escape") {
          onClose();
        }
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      const key = e.key.toLowerCase();

      // [P] Full PDF Memorandum
      if (key === "p" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onExportPdf();
        onClose();
        return;
      }

      // [X] Excel Workbook (.xlsx)
      if (key === "x" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onExportExcel();
        onClose();
        return;
      }

      // [I] Organogram PNG Image
      if (key === "i" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onExportImage();
        onClose();
        return;
      }

      // [R] Print View
      if (key === "r" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onPrint();
        onClose();
        return;
      }

      // [H] Export History
      if (key === "h" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onOpenHistory();
        onClose();
        return;
      }

      // [1] - [5] Single Page PDF extractions
      if (["1", "2", "3", "4", "5"].includes(e.key) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const pageNumber = parseInt(e.key, 10);
        onExportPdf(pageNumber);
        onClose();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onExportPdf, onExportExcel, onExportImage, onPrint, onOpenHistory]);

  if (!isOpen) return null;

  return (
    <div
      id="quick-export-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        id="quick-export-floating-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-export-title"
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
      >
        {/* Top Header Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-600/10 via-teal-500/5 to-transparent dark:from-emerald-950/40 dark:via-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Zap className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="quick-export-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Quick Export Command Hub
                </h2>
                <span className="flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                  <kbd className="font-sans">{metaKeyLabel}</kbd>+<kbd className="font-sans">E</kbd>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Power-user shortcuts for instant investor memorandums, Excel models, and diligence graphics
              </p>
            </div>
          </div>

          <button
            id="btn-close-quick-export"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Quick Export (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plan Switcher Context Bar */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-slate-500 dark:text-slate-400">Target Plan:</span>
            <div className="relative inline-block">
              <select
                id="quick-export-plan-select"
                value={plan.id}
                onChange={(e) => onSelectPlan(e.target.value)}
                className="appearance-none font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-2.5 pr-7 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
              >
                {allPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.companyName} ({p.sector})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-2 pointer-events-none text-slate-400" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Readiness:
            </span>
            <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              {plan.readinessScore}% Investor Ready
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Primary 3 Export Formats Grid */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Full-Document & Model Exports
              </span>
              <span className="text-[11px] text-slate-400">
                Single-key triggers active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Full PDF */}
              <button
                id="quick-export-btn-pdf"
                onClick={() => {
                  onExportPdf();
                  onClose();
                }}
                disabled={isGeneratingPdf}
                className="group relative text-left p-3.5 rounded-xl border-2 border-emerald-500/70 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/30 dark:to-slate-900 hover:border-emerald-600 dark:hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                    {isGeneratingPdf ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileDown className="w-4 h-4" />
                    )}
                  </div>
                  <kbd className="px-2 py-0.5 rounded font-mono text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                    P
                  </kbd>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Full Memorandum (PDF)
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  5-Page PDF with 300 DPI vector typography, compact graphs & verified seal.
                </p>
                <div className="mt-2.5 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-between text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
                  <span>Vector Print-Ready</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </button>

              {/* Option 2: Excel Financial Model */}
              <button
                id="quick-export-btn-excel"
                onClick={() => {
                  onExportExcel();
                  onClose();
                }}
                disabled={isExportingExcel}
                className="group relative text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-teal-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                    {isExportingExcel ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4" />
                    )}
                  </div>
                  <kbd className="px-2 py-0.5 rounded font-mono text-xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-2xs">
                    X
                  </kbd>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  Financial Model (.xlsx)
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Multi-tab workbook with 5-Yr P&L, unit economics, cash flows & drivers.
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  <span>Excel Multi-Tab</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </button>

              {/* Option 3: Organogram PNG Graphic */}
              <button
                id="quick-export-btn-image"
                onClick={() => {
                  onExportImage();
                  onClose();
                }}
                disabled={isExportingImage}
                className="group relative text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                    {isExportingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                  </div>
                  <kbd className="px-2 py-0.5 rounded font-mono text-xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-2xs">
                    I
                  </kbd>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Organogram Graphic (PNG)
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  2.5x high-res transparent image of hierarchy tree and open hiring nodes.
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  <span>Pitch Deck Slide Asset</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Single-Page Rapid Extraction */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Single-Page Rapid Extraction (PDF)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                Press numeric keys <kbd className="font-bold px-1 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">1</kbd> to <kbd className="font-bold px-1 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">5</kbd>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {SINGLE_PAGES.map((item) => (
                <button
                  key={item.page}
                  id={`quick-export-page-${item.page}`}
                  onClick={() => {
                    onExportPdf(item.page);
                    onClose();
                  }}
                  className="group p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-xs transition-all text-left cursor-pointer flex flex-col justify-between"
                  title={`Extract Page ${item.page}: ${item.title}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      Page {item.page}
                    </span>
                    <kbd className="w-5 h-5 rounded flex items-center justify-center font-mono text-xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors">
                      {item.page}
                    </kbd>
                  </div>
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 line-clamp-2 leading-tight">
                    {item.title}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Utility Shortcuts (Print & Audit Trail) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Direct Browser Print Dialog */}
            <button
              id="quick-export-btn-print"
              onClick={() => {
                onPrint();
                onClose();
              }}
              className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Printer className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
                    Browser Print Dialogue
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Hardcopy layout with clean print styles
                  </div>
                </div>
              </div>
              <kbd className="px-2 py-0.5 rounded font-mono text-xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                R
              </kbd>
            </button>

            {/* Export History & Audit Log */}
            <button
              id="quick-export-btn-history"
              onClick={() => {
                onOpenHistory();
                onClose();
              }}
              className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <History className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
                    Export History & Logs
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Audit previous downloads & re-export
                  </div>
                </div>
              </div>
              <kbd className="px-2 py-0.5 rounded font-mono text-xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                H
              </kbd>
            </button>
          </div>
        </div>

        {/* Bottom Keycap Cheatsheet Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-slate-700 dark:text-slate-300">Keymap:</span>
            <span><kbd className="font-mono font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">P</kbd> Full PDF</span>
            <span><kbd className="font-mono font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">X</kbd> Excel</span>
            <span><kbd className="font-mono font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">I</kbd> Image</span>
            <span><kbd className="font-mono font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">1-5</kbd> Page</span>
            <span><kbd className="font-mono font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">R</kbd> Print</span>
            <span><kbd className="font-mono font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">H</kbd> History</span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <span>Press <kbd className="font-mono font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">Esc</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
