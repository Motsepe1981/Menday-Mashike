import React, { useState, useMemo } from "react";
import { BusinessPlan, ExportFormat, ExportRecord } from "../types";
import {
  formatExportTimestamp,
  deleteExportRecord,
  clearExportHistory,
} from "../utils/exportHistoryStore";
import {
  X,
  History,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  ExternalLink,
  Layers,
  Sparkles,
  RefreshCw,
} from "lucide-react";

interface ExportHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: BusinessPlan;
  history: ExportRecord[];
  onUpdateHistory: (updated: ExportRecord[]) => void;
  onTriggerExportPdf: (singlePage?: number) => void;
  onTriggerExportExcel: () => void;
  onTriggerExportImage: () => void;
}

export const ExportHistoryPanel: React.FC<ExportHistoryPanelProps> = ({
  isOpen,
  onClose,
  currentPlan,
  history,
  onUpdateHistory,
  onTriggerExportPdf,
  onTriggerExportExcel,
  onTriggerExportImage,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | "all">("all");
  const [planFilter, setPlanFilter] = useState<"current" | "all">("current");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedFileNameId, setCopiedFileNameId] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Keyboard shortcut: close on ESC
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered exports
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // Plan filter
      if (planFilter === "current" && item.planId !== currentPlan.id) {
        return false;
      }
      // Format filter
      if (selectedFormat !== "all" && item.format !== selectedFormat) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesFile = item.fileName.toLowerCase().includes(q);
        const matchesPlan = (item.planName ? item.planName.toLowerCase().includes(q) : false) || item.companyName.toLowerCase().includes(q);
        const matchesScope = item.scope.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q) || false;
        return matchesFile || matchesPlan || matchesScope || matchesNotes;
      }
      return true;
    });
  }, [history, planFilter, currentPlan.id, selectedFormat, searchQuery]);

  // Overall metric counts
  const counts = useMemo(() => {
    const relevant = planFilter === "current" ? history.filter((h) => h.planId === currentPlan.id) : history;
    return {
      total: relevant.length,
      pdf: relevant.filter((h) => h.format === "pdf").length,
      excel: relevant.filter((h) => h.format === "excel").length,
      image: relevant.filter((h) => h.format === "image").length,
    };
  }, [history, planFilter, currentPlan.id]);

  const handleCopyFileName = (record: ExportRecord) => {
    navigator.clipboard.writeText(record.fileName);
    setCopiedFileNameId(record.id);
    setTimeout(() => {
      setCopiedFileNameId(null);
    }, 2000);
  };

  const handleDeleteRecord = (id: string) => {
    const updated = deleteExportRecord(id);
    onUpdateHistory(updated);
  };

  const handleClearAll = () => {
    const updated = clearExportHistory();
    onUpdateHistory(updated);
    setConfirmClearOpen(false);
  };

  const handleReExport = (record: ExportRecord) => {
    if (record.format === "pdf") {
      if (record.scope.includes("Page 1")) onTriggerExportPdf(1);
      else if (record.scope.includes("Page 2")) onTriggerExportPdf(2);
      else if (record.scope.includes("Page 3")) onTriggerExportPdf(3);
      else if (record.scope.includes("Page 4")) onTriggerExportPdf(4);
      else if (record.scope.includes("Page 5")) onTriggerExportPdf(5);
      else onTriggerExportPdf();
    } else if (record.format === "excel") {
      onTriggerExportExcel();
    } else if (record.format === "image") {
      onTriggerExportImage();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="export-history-overlay"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        id="export-history-panel"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl h-full flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-250 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Export History & Audit Log
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                  {counts.total} logged
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Full chronological tracking of PDF memorandums, Excel workbooks, and Image renders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-close-export-history"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Export History Panel (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Summary Counts Bar */}
        <div className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Total Exports</span>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
              {counts.total}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
            <span className="text-[10px] uppercase font-semibold text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
              <FileText className="w-2.5 h-2.5" /> PDF Files
            </span>
            <p className="text-sm font-bold text-red-700 dark:text-red-300 font-mono mt-0.5">
              {counts.pdf}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
            <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
              <FileSpreadsheet className="w-2.5 h-2.5" /> Excel Sheets
            </span>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
              {counts.excel}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
            <span className="text-[10px] uppercase font-semibold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
              <ImageIcon className="w-2.5 h-2.5" /> PNG Images
            </span>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300 font-mono mt-0.5">
              {counts.image}
            </p>
          </div>
        </div>

        {/* Controls, Filters & Search */}
        <div className="p-4 bg-slate-50/60 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 space-y-3">
          {/* Plan Scope Toggle & Clear Action */}
          <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 p-0.5 bg-slate-200 dark:bg-slate-800 rounded-lg">
              <button
                id="btn-history-filter-current"
                onClick={() => setPlanFilter("current")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  planFilter === "current"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                {currentPlan.companyName} ({history.filter((h) => h.planId === currentPlan.id).length})
              </button>
              <button
                id="btn-history-filter-all"
                onClick={() => setPlanFilter("all")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  planFilter === "all"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                All Plans ({history.length})
              </button>
            </div>

            {history.length > 0 && (
              <div>
                {confirmClearOpen ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-red-600 font-semibold">Clear all logs?</span>
                    <button
                      onClick={handleClearAll}
                      className="px-2 py-0.5 text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors cursor-pointer"
                    >
                      Yes, Clear
                    </button>
                    <button
                      onClick={() => setConfirmClearOpen(false)}
                      className="px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClearOpen(true)}
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors cursor-pointer"
                    title="Clear all export log entries"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Log</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Search Input & Format Filter Tabs */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by file name, plan, or scope..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setSelectedFormat("all")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  selectedFormat === "all"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedFormat("pdf")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                  selectedFormat === "pdf"
                    ? "bg-red-600 text-white border-red-600 shadow-xs"
                    : "bg-white dark:bg-slate-800 text-red-700 dark:text-red-400 border-slate-300 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>PDF</span>
              </button>
              <button
                onClick={() => setSelectedFormat("excel")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                  selectedFormat === "excel"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-slate-300 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                }`}
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span>Excel</span>
              </button>
              <button
                onClick={() => setSelectedFormat("image")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                  selectedFormat === "image"
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 border-slate-300 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                <span>Image</span>
              </button>
            </div>
          </div>
        </div>

        {/* Exports Log List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No exports found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {searchQuery || selectedFormat !== "all"
                  ? "No exported files match your current filters. Try resetting the search or category."
                  : `No export actions recorded yet for ${currentPlan.companyName}. Use Export PDF, Excel, or PNG to generate records.`}
              </p>
              {(searchQuery || selectedFormat !== "all" || planFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedFormat("all");
                    setPlanFilter("all");
                  }}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            filteredHistory.map((item, idx) => {
              const { full: fullDate, relative } = formatExportTimestamp(item.exportedAt);
              const isPdf = item.format === "pdf";
              const isExcel = item.format === "excel";
              const isImage = item.format === "image";

              return (
                <div
                  key={item.id}
                  id={`export-log-item-${item.id}`}
                  className={`pt-3.5 first:pt-0 group rounded-xl p-3.5 transition-all border ${
                    copiedFileNameId === item.id
                      ? "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20"
                      : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Format Icon & Primary Info */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Format Badge Icon */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs border ${
                          isPdf
                            ? "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60"
                            : isExcel
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60"
                            : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/60"
                        }`}
                      >
                        {isPdf && <FileText className="w-4.5 h-4.5" />}
                        {isExcel && <FileSpreadsheet className="w-4.5 h-4.5" />}
                        {isImage && <ImageIcon className="w-4.5 h-4.5" />}
                      </div>

                      {/* File Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-md select-all"
                            title={item.fileName}
                          >
                            {item.fileName}
                          </span>

                          {/* Format Tag */}
                          <span
                            className={`text-[10px] font-mono font-extrabold uppercase px-1.5 py-0.2 rounded border ${
                              isPdf
                                ? "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800"
                                : isExcel
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                : "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800"
                            }`}
                          >
                            {item.format}
                          </span>

                          {item.fileSizeFormatted && (
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                              {item.fileSizeFormatted}
                            </span>
                          )}

                          <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 ml-auto">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Saved</span>
                          </span>
                        </div>

                        {/* Scope and plan provenance */}
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-1 flex-wrap">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {item.companyName}
                          </span>
                          <span>•</span>
                          <span className="text-slate-500">{item.scope}</span>
                          {item.triggeredBy && (
                            <>
                              <span>•</span>
                              <span className="text-[11px] text-slate-400">via {item.triggeredBy}</span>
                            </>
                          )}
                        </div>

                        {/* Timestamp & note */}
                        <div className="flex items-center justify-between gap-2 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span title={fullDate} className="font-mono">
                            {fullDate} <span className="text-slate-400 font-sans font-normal">({relative})</span>
                          </span>
                        </div>

                        {item.notes && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded border border-slate-200/60 dark:border-slate-800/80 mt-1.5 italic">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions Column */}
                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      {/* Copy File Name */}
                      <button
                        type="button"
                        onClick={() => handleCopyFileName(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Copy exact file name to clipboard"
                      >
                        {copiedFileNameId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Re-export / Download Again */}
                      <button
                        type="button"
                        onClick={() => handleReExport(item)}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        title="Re-generate and download this export"
                      >
                        <RefreshCw className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Re-export</span>
                      </button>

                      {/* Delete item from history */}
                      <button
                        type="button"
                        onClick={() => handleDeleteRecord(item.id)}
                        className="p-1.5 text-slate-300 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                        title="Delete entry from log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info banner */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>All exports are timestamped and preserved in client storage.</span>
          <span className="font-mono text-[11px]">Audit Track v1.0</span>
        </div>
      </div>
    </div>
  );
};
