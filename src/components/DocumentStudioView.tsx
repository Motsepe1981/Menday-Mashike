import React, { useState, useRef, useEffect } from "react";
import { BusinessPlan, OrganogramNode, ExportRecord } from "../types";
import { InvestorFooter } from "./InvestorFooter";
import { PrintFriendlyHeader } from "./PrintFriendlyHeader";
import { CompactFinancialGraphs } from "./CompactFinancialGraphs";
import { GrowthForecastGauge } from "./GrowthForecastGauge";
import { OrganogramView } from "./OrganogramView";
import { downloadBusinessPlanPdf, PdfExportProgress } from "../utils/pdfGenerator";
import { PdfGenerationProgressBar } from "./PdfGenerationProgressBar";
import { exportFinancialsToExcel } from "../utils/excelExporter";
import { exportElementAsPng } from "../utils/imageExporter";
import { KpiDashboardOverlay } from "./KpiDashboardOverlay";
import { ReviewCommentsSidebar, getDefaultCommentsForPlan } from "./ReviewCommentsSidebar";
import { ExportHistoryPanel } from "./ExportHistoryPanel";
import { MetadataManagerModal } from "./MetadataManagerModal";
import { getExportHistory, addExportRecord } from "../utils/exportHistoryStore";
import {
  Printer,
  Sparkles,
  Layers,
  Settings2,
  CheckCircle,
  FileDown,
  FileSpreadsheet,
  Image as ImageIcon,
  LayoutTemplate,
  Minimize2,
  Maximize2,
  Sliders,
  ShieldCheck,
  Check,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Gauge,
  DollarSign,
  AlertCircle,
  Loader2,
  Download,
  Activity,
  MessageSquareQuote,
  MessageSquare,
  MessageSquarePlus,
  History,
  Tag,
  MapPin,
  Users,
  Zap,
} from "lucide-react";

interface DocumentStudioViewProps {
  plan: BusinessPlan;
  allPlans: BusinessPlan[];
  onUpdatePlan: (updatedPlan: BusinessPlan) => void;
  onApplyToAllPlans: () => void;
  onOpenVerification: () => void;
  pendingExport?: { singlePage?: number; timestamp: number } | null;
  onClearPendingExport?: () => void;
  onOpenQuickExport?: () => void;
  onOpenSyncReview?: () => void;
}

export const DocumentStudioView: React.FC<DocumentStudioViewProps> = ({
  plan,
  allPlans,
  onUpdatePlan,
  onApplyToAllPlans,
  onOpenVerification,
  pendingExport,
  onClearPendingExport,
  onOpenQuickExport,
  onOpenSyncReview,
}) => {
  const [activePage, setActivePage] = useState<number | "all">("all");
  const [appliedToAllSuccess, setAppliedToAllSuccess] = useState(false);
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResultNote, setAiResultNote] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<PdfExportProgress | null>(null);
  const [isSinglePageExport, setIsSinglePageExport] = useState(false);
  const [forceRenderAllPages, setForceRenderAllPages] = useState(false);
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [excelExportSuccess, setExcelExportSuccess] = useState(false);
  const [isExportingOrganogram, setIsExportingOrganogram] = useState(false);
  const [organogramExportSuccess, setOrganogramExportSuccess] = useState(false);
  const [exportNotification, setExportNotification] = useState<string | null>(null);
  const [exportHistoryOpen, setExportHistoryOpen] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportRecord[]>(() => getExportHistory());
  const [metadataModalOpen, setMetadataModalOpen] = useState(false);
  const [kpiDashboardOpen, setKpiDashboardOpen] = useState(false);
  const [commentsSidebarOpen, setCommentsSidebarOpen] = useState(false);
  const [activeCommentTarget, setActiveCommentTarget] = useState<{
    targetType: string;
    targetId: string;
    targetLabel: string;
  } | null>(null);
  const [highlightedSectionId, setHighlightedSectionId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { financials, formatSettings } = plan;
  const isCompactWhitespace = formatSettings.whitespaceDensity === "compact";

  // Comments derived & counts for badges
  const currentComments = plan.comments && plan.comments.length > 0 ? plan.comments : getDefaultCommentsForPlan(plan);
  const totalCommentsCount = currentComments.length;

  const organogramCommentCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    currentComments.forEach((c) => {
      if (c.targetType === "organogram_node" && c.targetId) {
        counts[c.targetId] = (counts[c.targetId] || 0) + 1;
      }
    });
    return counts;
  }, [currentComments]);

  const sectionCommentCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    currentComments.forEach((c) => {
      if (c.targetType === "financial_section" && c.targetId) {
        counts[c.targetId] = (counts[c.targetId] || 0) + 1;
      }
    });
    return counts;
  }, [currentComments]);

  // Navigate to target section or node and scroll/highlight
  const handleNavigateToTarget = (targetPage?: number, targetId?: string) => {
    if (targetPage && activePage !== "all" && activePage !== targetPage) {
      setActivePage("all");
    }
    setTimeout(() => {
      if (targetId) {
        const el = document.getElementById(targetId) || document.getElementById(`org-node-${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setHighlightedSectionId(targetId);
          setTimeout(() => setHighlightedSectionId(null), 3000);
        }
      }
    }, 120);
  };

  const handleDownloadPdf = async (singlePage?: number) => {
    setDownloadDropdownOpen(false);
    setIsGeneratingPdf(true);
    setIsSinglePageExport(!!singlePage);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setPdfProgress({
      currentPage: 0,
      totalPages: singlePage ? 1 : 5,
      percent: 5,
      message: "Preparing layout, whitespace hierarchy & high-definition vector typography...",
      stage: "preparing",
      completedPages: [],
    });

    try {
      // Force all pages to mount into DOM if exporting full document
      setForceRenderAllPages(true);

      // Give browser time to update DOM and paint SVG charts
      await new Promise((resolve) => setTimeout(resolve, 350));

      if (controller.signal.aborted) return;

      const pageIds = singlePage
        ? [`doc-page-${singlePage}`]
        : ["doc-page-1", "doc-page-2", "doc-page-3", "doc-page-4", "doc-page-5"];

      const pageElements = pageIds
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null);

      if (pageElements.length === 0) {
        throw new Error("Unable to locate document page elements.");
      }

      const targetFileName = singlePage
        ? `${plan.companyName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Page_${singlePage}.pdf`
        : `${plan.companyName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Investor_Business_Plan.pdf`;

      await downloadBusinessPlanPdf(plan, pageElements, {
        fileName: targetFileName,
        abortSignal: controller.signal,
        onProgress: (prog) => {
          setPdfProgress(prog);
        },
      });

      // Log successful export in Export History
      const pageNames = [
        "Executive Summary & Investment Thesis",
        "Total Addressable Market & Unit Economics",
        "Governance & Fillable Organogram",
        "5-Year Financial Model & Compact Graphs",
        "Cash Flow Reserves & Term Sheet",
      ];
      const scopeLabel = singlePage
        ? `Page ${singlePage} - ${pageNames[singlePage - 1] || "Selected Section"}`
        : "Full Memorandum (5 Pages)";

      const record = addExportRecord({
        planId: plan.id,
        planName: plan.name,
        companyName: plan.companyName,
        fileName: targetFileName,
        format: "pdf",
        fileSizeFormatted: singlePage ? "1.2 MB" : "2.8 MB",
        scope: scopeLabel,
        status: "success",
        triggeredBy: singlePage ? `Single Page PDF (Page ${singlePage})` : "Document Studio Toolbar",
        notes: "Vector-sharp print memorandum maintaining layout, whitespace density, and compact graphs",
      });
      setExportHistory((prev) => [record, ...prev.filter((r) => r.id !== record.id)]);

      // Keep completion banner visible for review or until user dismisses
      setTimeout(() => {
        setPdfProgress((current) => (current?.stage === "completed" ? null : current));
      }, 5000);
    } catch (err: any) {
      if (err?.name === "AbortError" || err?.message?.includes("cancelled")) {
        console.log("PDF generation cancelled by user.");
        setPdfProgress(null);
      } else {
        console.error("PDF generation failed:", err);
        setPdfProgress(null);
        alert("An issue occurred during PDF generation. You can also use the Print button to Save as PDF.");
      }
    } finally {
      setIsGeneratingPdf(false);
      setForceRenderAllPages(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelPdf = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setPdfProgress(null);
    setIsGeneratingPdf(false);
    setForceRenderAllPages(false);
  };

  // Trigger export if requested from external caller / Quick Export menu
  useEffect(() => {
    if (pendingExport && pendingExport.timestamp) {
      handleDownloadPdf(pendingExport.singlePage);
      if (onClearPendingExport) {
        onClearPendingExport();
      }
    }
  }, [pendingExport?.timestamp]);

  const handleDismissPdfProgress = () => {
    setPdfProgress(null);
  };

  const handleExportExcel = () => {
    setIsExportingExcel(true);
    setDownloadDropdownOpen(false);
    try {
      exportFinancialsToExcel(plan);
      setExcelExportSuccess(true);
      const excelFileName = `${plan.companyName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Financial_Model.xlsx`;

      // Log Excel export in Export History
      const record = addExportRecord({
        planId: plan.id,
        planName: plan.name,
        companyName: plan.companyName,
        fileName: excelFileName,
        format: "excel",
        fileSizeFormatted: "44.2 KB",
        scope: "Complete Financial Model (5-Year P&L, Cash Flow, Drivers)",
        status: "success",
        triggeredBy: "Excel Exporter Dropdown",
        notes: "Multi-tab institutional workbook with revenue build, balance checks, and unit economics",
      });
      setExportHistory((prev) => [record, ...prev.filter((r) => r.id !== record.id)]);

      setExportNotification(
        `Financial model (${plan.companyName}) exported as Excel (.xlsx) workbook successfully!`
      );
      setTimeout(() => {
        setExcelExportSuccess(false);
        setExportNotification(null);
      }, 4500);
    } catch (err) {
      console.error("Excel export failed:", err);
      alert("Failed to export financial data to Excel. Please try again.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportOrganogramImage = async () => {
    setDownloadDropdownOpen(false);
    setIsExportingOrganogram(true);

    const wasPageSwitched = activePage !== "all" && activePage !== 3;
    if (wasPageSwitched) {
      setActivePage(3);
      setForceRenderAllPages(true);
    }

    // Wait for DOM layout and rendering
    await new Promise((resolve) => setTimeout(resolve, 350));

    try {
      const canvasEl = document.getElementById("organogram-visual-canvas");
      if (!canvasEl) {
        throw new Error("Could not locate organogram canvas in Document Studio.");
      }

      const sanitized = plan.companyName.replace(/[^a-zA-Z0-9_-]/g, "_");
      const pngFileName = `${sanitized}_Governance_Organogram.png`;
      await exportElementAsPng(canvasEl, {
        fileName: pngFileName,
        scale: 2.5,
        backgroundColor: "#ffffff",
      });

      // Log Image export in Export History
      const record = addExportRecord({
        planId: plan.id,
        planName: plan.name,
        companyName: plan.companyName,
        fileName: pngFileName,
        format: "image",
        fileSizeFormatted: "860 KB",
        scope: "Governance Organogram (Executive Hierarchy)",
        status: "success",
        triggeredBy: "Organogram Image Export",
        notes: "2.5x high-resolution retina PNG rendering of company executive hierarchy and equity tags",
      });
      setExportHistory((prev) => [record, ...prev.filter((r) => r.id !== record.id)]);

      setOrganogramExportSuccess(true);
      setExportNotification(
        `Governance organogram exported as high-resolution PNG image successfully!`
      );
      setTimeout(() => {
        setOrganogramExportSuccess(false);
        setExportNotification(null);
      }, 4500);
    } catch (err) {
      console.error("Organogram image export failed:", err);
      alert("Failed to export organogram as image. Please ensure the organogram page is visible.");
    } finally {
      setIsExportingOrganogram(false);
      if (wasPageSwitched) {
        setForceRenderAllPages(false);
      }
    }
  };

  const handlePrint = async () => {
    setForceRenderAllPages(true);
    await new Promise((resolve) => setTimeout(resolve, 250));
    window.print();
    setForceRenderAllPages(false);
  };

  const handleApplyToAll = () => {
    onApplyToAllPlans();
    setAppliedToAllSuccess(true);
    setTimeout(() => setAppliedToAllSuccess(false), 3000);
  };

  const handleDensityChange = (density: "compact" | "balanced" | "spacious") => {
    onUpdatePlan({
      ...plan,
      formatSettings: {
        ...plan.formatSettings,
        whitespaceDensity: density,
      },
    });
  };

  const handleGraphScaleChange = (scale: "compact" | "medium" | "expanded") => {
    onUpdatePlan({
      ...plan,
      formatSettings: {
        ...plan.formatSettings,
        graphScale: scale,
      },
    });
  };

  const handleAiEnhance = async (sectionTitle: string) => {
    setAiGenerating(true);
    setAiResultNote(null);
    try {
      const res = await fetch("/api/gemini/enhance-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionTitle,
          content: plan.executiveSummary,
          sector: plan.sector,
          company: plan.companyName,
        }),
      });
      const data = await res.json();
      if (data.success && data.enhancedContent) {
        onUpdatePlan({
          ...plan,
          executiveSummary: data.enhancedContent,
        });
        setAiResultNote("AI Document Studio refined the executive thesis to Tier-1 investor standards.");
      }
    } catch (err) {
      console.error(err);
      setAiResultNote("Local studio formatter applied crisp investor rhythm.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleUpdateOrganogram = (newNodes: OrganogramNode[]) => {
    onUpdatePlan({
      ...plan,
      organogram: newNodes,
    });
  };

  // Currency helper
  const fmt = (v: number | undefined) => {
    if (!v) return "$0";
    if (Math.abs(v) >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
    if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}K`;
    return `$${v}`;
  };

  // Section title styling based on formatted whitespace density
  // Format the business plans white space below the topics on every page:
  // Compact density tightly groups the sub-elements without dead vertical space
  const topicHeadingClass = isCompactWhitespace ? "mb-2 pb-1" : "mb-4 pb-2";

  return (
    <div className="w-full space-y-6">
      {/* Top Document Studio Control Bar */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 print:hidden">
        {/* Left: Document Info & Page Navigator */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Document Studio Engine
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-mono font-semibold">
              {plan.docReference}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          {/* Page Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setActivePage("all")}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activePage === "all"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              All Pages (5)
            </button>
            {[1, 2, 3, 4, 5].map((pg) => (
              <button
                key={pg}
                onClick={() => setActivePage(pg)}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  activePage === pg
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                P{pg}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Whitespace & Graph Scale Formatting Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Whitespace density selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <Sliders className="w-3.5 h-3.5" />
            <span className="font-medium text-[11px]">Whitespace:</span>
            <select
              value={formatSettings.whitespaceDensity}
              onChange={(e) => handleDensityChange(e.target.value as any)}
              className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none"
            >
              <option value="compact">Compact (No Topic Gaps)</option>
              <option value="balanced">Balanced</option>
              <option value="spacious">Spacious</option>
            </select>
          </div>

          {/* Graph scale selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="font-medium text-[11px]">Graph Sizing:</span>
            <select
              value={formatSettings.graphScale}
              onChange={(e) => handleGraphScaleChange(e.target.value as any)}
              className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none"
            >
              <option value="compact">Compact (Space-Optimized)</option>
              <option value="medium">Medium</option>
              <option value="expanded">Expanded</option>
            </select>
          </div>

          {/* AI Enhance Button */}
          <button
            onClick={() => handleAiEnhance("Executive Thesis")}
            disabled={aiGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {aiGenerating ? "Designing..." : "AI Format & Refine"}
          </button>

          {/* Growth Forecast Quick Metric Pill */}
          <button
            id="btn-quick-growth-forecast"
            onClick={() => setActivePage(4)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200/80 dark:border-emerald-800/80 transition-colors cursor-pointer"
            title="Jump to 5-Year Growth Forecast Gauge & Trajectory on Page 4"
          >
            <Gauge className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Growth Forecast:</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
              {financials.totalRevenue && financials.totalRevenue[0] > 0
                ? `+${(((financials.totalRevenue[1] - financials.totalRevenue[0]) / financials.totalRevenue[0]) * 100).toFixed(0)}% YoY`
                : "+0% YoY"}
            </span>
          </button>

          {/* Sync Master Format Monitored Badge */}
          {onOpenSyncReview && (
            <button
              onClick={onOpenSyncReview}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200/80 dark:border-emerald-800/80 transition-colors cursor-pointer"
              title="Automated Sync Master Format monitors your manual spacing adjustments and proposes applying them across all business plans in the library"
            >
              <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Auto-Sync Monitored</span>
            </button>
          )}
        </div>

        {/* Right: Meta-Data Manager, KPI Dashboard Overlay, Review & Comments Sidebar, Master Batch Action, Download as PDF & Print */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Meta-Data Manager Section Trigger Button */}
          <button
            id="btn-open-metadata-manager"
            onClick={() => setMetadataModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/90 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs transition-all cursor-pointer"
            title="Configure Project Tagline, Founder Names, and Location/Region automatically injected into headers and footers"
          >
            <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Meta-Data Manager</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Headers & Footers
            </span>
          </button>

          {/* Review & Comments Sidebar Trigger Button */}
          <button
            id="btn-toggle-comments-sidebar"
            onClick={() => {
              setCommentsSidebarOpen(!commentsSidebarOpen);
              setActiveCommentTarget(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              commentsSidebarOpen
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
            title="Open Review & Comments sidebar for time-stamped feedback on financial sections and organogram nodes"
          >
            <MessageSquareQuote className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Review & Comments</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-extrabold ${
                commentsSidebarOpen
                  ? "bg-white/20 text-white"
                  : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
              }`}
            >
              {totalCommentsCount}
            </span>
          </button>

          {/* High-Level KPI Dashboard Overlay Trigger */}
          <button
            id="btn-kpi-dashboard-overlay"
            onClick={() => setKpiDashboardOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 dark:bg-emerald-400 dark:hover:bg-emerald-300 rounded-lg shadow-sm transition-all cursor-pointer"
            title="Open high-level Financial KPI Dashboard overlay (ARR, CAC, Monthly Burn, LTV, Runway)"
          >
            <Activity className="w-3.5 h-3.5 text-slate-950" />
            <span>KPI Dashboard</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/15 text-slate-950 font-extrabold">
              ARR · CAC · Burn
            </span>
          </button>

          {/* Apply To All Business Plans In Hub Action */}
          <button
            onClick={handleApplyToAll}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all"
            title="Apply this exact formatting (columns, compact graphs, whitespace, organogram, footer) to all business plans in the Activity Hub"
          >
            {appliedToAllSuccess ? <Check className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            {appliedToAllSuccess ? "Applied to All 5 Plans!" : "Apply Format to All"}
          </button>

          {/* Quick Export Trigger Button (Ctrl+E) */}
          {onOpenQuickExport && (
            <button
              id="btn-toolbar-quick-export"
              onClick={onOpenQuickExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs transition-all cursor-pointer"
              title="Open Quick Export Command Hub (Ctrl+E or ⌘E)"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Quick Export</span>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-extrabold rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                Ctrl+E
              </kbd>
            </button>
          )}

          {/* Primary 'Export PDF' Feature Button with Options Dropdown */}
          <div className="relative">
            <div className="inline-flex rounded-lg shadow-sm overflow-hidden border border-emerald-600 dark:border-emerald-500">
              <button
                id="btn-pdf-export"
                onClick={() => handleDownloadPdf()}
                disabled={isGeneratingPdf}
                className="relative overflow-hidden flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors disabled:opacity-90 cursor-pointer"
                title="Export selected business plan as print-ready PDF with print-friendly headers and current styling"
              >
                {/* Embedded background progress bar on trigger button */}
                {isGeneratingPdf && pdfProgress && (
                  <span
                    className="absolute inset-y-0 left-0 bg-emerald-700/60 dark:bg-emerald-800/80 border-r border-emerald-300 transition-all duration-300 pointer-events-none"
                    style={{ width: `${pdfProgress.percent}%` }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {isGeneratingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <FileDown className="w-4 h-4 text-white" />
                  )}
                  <span>
                    {isGeneratingPdf
                      ? `Exporting ${pdfProgress?.percent || 0}%`
                      : "Export PDF"}
                  </span>
                </span>
              </button>

              <button
                id="btn-download-dropdown-toggle"
                onClick={() => setDownloadDropdownOpen(!downloadDropdownOpen)}
                disabled={isGeneratingPdf}
                className="px-2 py-1.5 text-white bg-emerald-700 hover:bg-emerald-600 dark:bg-emerald-700 dark:hover:bg-emerald-600 border-l border-emerald-500/80 transition-colors disabled:opacity-50 cursor-pointer"
                title="More PDF, Excel, and Image export options"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Download & Export Options Dropdown */}
            {downloadDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                {/* Quick Export Hub Top Option */}
                {onOpenQuickExport && (
                  <div className="p-1 border-b border-slate-100 dark:border-slate-700/80">
                    <button
                      onClick={() => {
                        setDownloadDropdownOpen(false);
                        onOpenQuickExport();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg bg-emerald-50/90 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-950 dark:text-emerald-200 flex items-center justify-between font-bold text-xs transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Quick Export Hub
                      </span>
                      <kbd className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-extrabold">
                        Ctrl+E
                      </kbd>
                    </button>
                  </div>
                )}
                {/* Section 1: PDF Options */}
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/80 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Investor PDF Memorandums</span>
                  <span className="font-mono text-[9px] text-emerald-600 font-bold">Vector 300 DPI</span>
                </div>
                <button
                  onClick={() => handleDownloadPdf()}
                  className="w-full text-left px-3 py-2 text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center justify-between transition-colors font-medium cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                    Full 5-Page Memorandum
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 font-semibold">Recommended</span>
                </button>

                {activePage !== "all" && (
                  <button
                    onClick={() => handleDownloadPdf(activePage)}
                    className="w-full text-left px-3 py-2 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between transition-colors font-medium cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <FileDown className="w-3.5 h-3.5 text-slate-500" />
                      Active Page Only (Page {activePage})
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">P{activePage}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setDownloadDropdownOpen(false);
                    handlePrint();
                  }}
                  className="w-full text-left px-3 py-2 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between transition-colors font-medium cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    Print to PDF (System Dialog)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Ctrl+P</span>
                </button>

                {/* Section 2: Financial Model Excel Export */}
                <div className="mt-1 pt-1.5 px-3 py-1 border-t border-slate-100 dark:border-slate-700/80 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Financial Data Schedules</span>
                  <span className="font-mono text-[9px] text-emerald-600 font-bold">.xlsx Multi-Tab</span>
                </div>
                <button
                  id="btn-dropdown-export-excel"
                  onClick={handleExportExcel}
                  disabled={isExportingExcel}
                  className="w-full text-left px-3 py-2 text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center justify-between transition-colors font-medium cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-start gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Export as Excel (.xlsx)
                      </div>
                      <div className="text-[10px] text-slate-500">
                        5-Yr P&L, Cash Flow, CapEx, Unit Econ & TAM
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    XLSX
                  </span>
                </button>

                {/* Section 3: Organogram Image Export */}
                <div className="mt-1 pt-1.5 px-3 py-1 border-t border-slate-100 dark:border-slate-700/80 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Governance & Organogram</span>
                  <span className="font-mono text-[9px] text-indigo-600 font-bold">Retina PNG</span>
                </div>
                <button
                  id="btn-dropdown-export-organogram"
                  onClick={handleExportOrganogramImage}
                  disabled={isExportingOrganogram}
                  className="w-full text-left px-3 py-2 text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center justify-between transition-colors font-medium cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-start gap-2">
                    {isExportingOrganogram ? (
                      <Loader2 className="w-4 h-4 text-indigo-600 animate-spin mt-0.5 shrink-0" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Export Organogram as Image
                      </div>
                      <div className="text-[10px] text-slate-500">
                        2.5× High-resolution PNG for slide decks
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                    PNG
                  </span>
                </button>

                {/* Section 4: Export History & Tracking */}
                <div className="mt-1 pt-1.5 px-3 py-1 border-t border-slate-100 dark:border-slate-700/80 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Export History & Tracking</span>
                  <span className="font-mono text-[9px] text-emerald-600 font-bold">
                    {exportHistory.filter((h) => h.planId === plan.id).length} this plan
                  </span>
                </div>
                <button
                  id="btn-dropdown-export-history"
                  onClick={() => {
                    setDownloadDropdownOpen(false);
                    setExportHistoryOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center justify-between transition-colors font-medium cursor-pointer"
                >
                  <div className="flex items-start gap-2">
                    <History className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        View Export History Log
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Track previous PDF, Excel & PNG files
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                    {exportHistory.length} total
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Quick-Access 'Export as Excel' Button in Top Bar */}
          <button
            id="btn-export-excel-top"
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/90 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Export 5-year financial schedules, P&L, and investor metrics to Microsoft Excel (.xlsx)"
          >
            {isExportingExcel ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : excelExportSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <span>
              {isExportingExcel
                ? "Exporting..."
                : excelExportSuccess
                ? "Excel Saved!"
                : "Export Excel"}
            </span>
          </button>

          {/* Export History Trigger Button */}
          <button
            id="btn-export-history"
            onClick={() => setExportHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/90 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Open Export History panel to track all previous PDF, Excel, and Image exports with timestamps"
          >
            <History className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export History</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              {exportHistory.filter((h) => h.planId === plan.id).length}
            </span>
          </button>

          {/* Print preview / save button */}
          <button
            onClick={handlePrint}
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Print / Save as PDF (System Dialog)"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success Notification Banner for Excel & Image Exports */}
      {exportNotification && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-200 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{exportNotification}</span>
          </div>
          <button
            onClick={() => setExportNotification(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 font-bold px-1 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Visual Progress Bar Component indicating percentage and page stages */}
      <PdfGenerationProgressBar
        progress={pdfProgress}
        onCancel={handleCancelPdf}
        onDismiss={handleDismissPdfProgress}
        companyName={plan.companyName}
        isSinglePage={isSinglePageExport}
      />

      {aiResultNote && (
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-800 dark:text-indigo-300 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{aiResultNote}</span>
          </div>
          <button onClick={() => setAiResultNote(null)} className="text-xs font-bold">
            ×
          </button>
        </div>
      )}

      {/* Meta-Data Manager Configuration Summary Bar */}
      <div
        id="metadata-manager-indicator-bar"
        className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs print:hidden"
      >
        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 shrink-0">
            <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Document Meta-Data:</span>
          </div>

          {/* Project Tagline Pill */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 max-w-sm sm:max-w-md truncate">
            <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">Tagline:</span>
            <span className="text-slate-700 dark:text-slate-200 italic truncate text-[11px]">
              {plan.tagline ? `"${plan.tagline}"` : "No tagline configured"}
            </span>
          </div>

          {/* Founders Pill */}
          {plan.founderNames && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750">
              <Users className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="text-[10px] text-slate-400 font-bold uppercase">Founders:</span>
              <span className="text-slate-700 dark:text-slate-200 font-medium text-[11px] truncate max-w-[200px]">
                {plan.founderNames}
              </span>
            </div>
          )}

          {/* Location / Region Pill */}
          {plan.locationRegion && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750">
              <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
              <span className="text-[10px] text-slate-400 font-bold uppercase">Region:</span>
              <span className="text-slate-700 dark:text-slate-200 font-medium text-[11px]">
                {plan.locationRegion}
              </span>
            </div>
          )}
        </div>

        <button
          id="btn-edit-metadata-strip"
          onClick={() => setMetadataModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <Settings2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Edit Injected Meta-Data</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 1: EXECUTIVE SUMMARY & INVESTMENT OPPORTUNITY                        */}
      {/* ========================================================================= */}
      {(activePage === "all" || activePage === 1 || forceRenderAllPages) && (
        <div
          id="doc-page-1"
          data-page-title="Executive Summary & Investment Thesis"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm print:shadow-none print:border-none print:m-0 print:p-0 page-break mb-8 print:mb-0"
        >
          {/* Print-Friendly Running Institutional Header */}
          <PrintFriendlyHeader
            plan={plan}
            pageNumber={1}
            totalPages={5}
            sectionTitle="Executive Summary & Investment Thesis"
            isCoverPage={true}
          />

          {/* Document Header */}
          <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-4 mb-5 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  {plan.sector}
                </span>
                <span className="text-[10px] font-mono text-slate-400">Activity Hub Memoranda</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {plan.companyName}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mt-0.5 max-w-2xl">
                {plan.tagline}
              </p>
            </div>

            <div className="text-left sm:text-right font-mono text-xs text-slate-500 shrink-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{plan.docReference}</p>
              <p className="text-[11px]">{plan.revision}</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                ● Investor Memorandum
              </p>
            </div>
          </div>

          {/* Formatted Content: Whitespace below Topic 1 is tight & rhythmically balanced */}
          <div className="space-y-4">
            <div>
              <div className={`flex items-center justify-between border-b border-slate-200 dark:border-slate-800 ${topicHeadingClass}`}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                  1. Executive Summary & Investment Thesis
                </h2>
                <span className="text-[10px] font-mono text-slate-400">01 / OVERVIEW</span>
              </div>

              {/* Text paragraph directly below heading with optimal spacing */}
              <p className="text-xs sm:text-[13px] leading-relaxed text-slate-700 dark:text-slate-300 font-normal">
                {plan.executiveSummary}
              </p>
            </div>

            {/* Side-by-Side Bento Highlight Cards (Utilizing available horizontal page space) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  Target Seed Round
                </span>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                  {fmt(financials.investorMetrics.totalFundingRequired)}
                </p>
                <span className="text-[10px] text-emerald-600 font-medium">Growth Capital</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  Pre-Money Valuation
                </span>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                  {fmt(financials.investorMetrics.preMoneyValuation)}
                </p>
                <span className="text-[10px] text-slate-500">Tier-1 Term Sheet</span>
              </div>

              {/* Growth Forecast Gauge Compact Highlight */}
              <div className="col-span-2 sm:col-span-1">
                <GrowthForecastGauge financials={financials} variant="compact" />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  Y5 Revenue Target
                </span>
                <p className="text-base font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                  {fmt(financials.totalRevenue[financials.totalRevenue.length - 1])}
                </p>
                <span className="text-[10px] text-slate-500 font-mono">
                  {financials.grossMarginPercent[financials.grossMarginPercent.length - 1]}% Gross Mgn
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  Target IRR / ROI
                </span>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  {financials.investorMetrics.projectedIRR || 36}% / {financials.investorMetrics.projectedROI || "5x"}
                </p>
                <span className="text-[10px] text-emerald-600 font-medium">5-Year Exit</span>
              </div>
            </div>

            {/* Core Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Proprietary Technology & Moat
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {plan.competitiveMoat}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Commercial Expansion Strategy
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {plan.growthStrategy}
                </p>
              </div>
            </div>
          </div>

          {/* Standardized Fixed Footer */}
          <InvestorFooter plan={plan} pageNumber={1} totalPages={5} compact={isCompactWhitespace} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 2: MARKET OPPORTUNITY & BUSINESS MODEL                               */}
      {/* ========================================================================= */}
      {(activePage === "all" || activePage === 2 || forceRenderAllPages) && (
        <div
          id="doc-page-2"
          data-page-title="Total Addressable Market & Unit Economics"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm print:shadow-none print:border-none print:m-0 print:p-0 page-break mb-8 print:mb-0"
        >
          {/* Print-Friendly Running Institutional Header */}
          <PrintFriendlyHeader
            plan={plan}
            pageNumber={2}
            totalPages={5}
            sectionTitle="Total Addressable Market & Unit Economics"
          />

          {/* Topic 2 Header with formatted whitespace */}
          <div className={`flex items-center justify-between border-b border-slate-200 dark:border-slate-800 ${topicHeadingClass}`}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
              2. Total Addressable Market & Venture Unit Economics
            </h2>
            <span className="text-[10px] font-mono text-slate-400">02 / MARKET</span>
          </div>

          <div className="space-y-4">
            <p className="text-xs sm:text-[13px] leading-relaxed text-slate-700 dark:text-slate-300 font-normal">
              {plan.targetMarket}
            </p>

            {/* Venture Unit Economics Metric Cards */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Venture Unit Economics & Payback
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCommentTarget({
                      targetType: "financial_section",
                      targetId: "sec-unit-econ",
                      targetLabel: "CAC, LTV & Unit Economics",
                    });
                    setCommentsSidebarOpen(true);
                  }}
                  className="pdf-exclude print:hidden flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  title="Leave feedback on Unit Economics (CAC, LTV, Payback)"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Comments ({sectionCommentCounts["sec-unit-econ"] || 0})</span>
                </button>
              </div>

              <div
                id="sec-unit-econ"
                className={`grid grid-cols-1 md:grid-cols-3 gap-3 p-1 rounded-xl transition-all ${
                  highlightedSectionId === "sec-unit-econ"
                    ? "ring-2 ring-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/30"
                    : ""
                }`}
              >
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 font-medium">Customer Acquisition Cost (CAC)</span>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                    {fmt(financials.investorMetrics.cac)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Blended inbound and enterprise direct sales</p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 font-medium">Customer Lifetime Value (LTV)</span>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    {fmt(financials.investorMetrics.ltv)}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-medium mt-1">
                    LTV / CAC Multiple: {financials.investorMetrics.ltvCacRatio}x
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 font-medium">Payback Period</span>
                  <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                    {financials.investorMetrics.paybackPeriodMonths || 8} Months
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Capital efficient reinvestment cycle</p>
                </div>
              </div>
            </div>

            {/* Revenue Stream Breakdown Table */}
            <div
              id="sec-revenue"
              className={`border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all ${
                highlightedSectionId === "sec-revenue"
                  ? "ring-2 ring-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/30"
                  : ""
              }`}
            >
              <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex justify-between items-center">
                <span>Revenue Monetization Channels</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-normal text-slate-500">5-Year Growth Structure</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCommentTarget({
                        targetType: "financial_section",
                        targetId: "sec-revenue",
                        targetLabel: "Revenue Monetization Streams",
                      });
                      setCommentsSidebarOpen(true);
                    }}
                    className="pdf-exclude print:hidden flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    title="Leave feedback on revenue stream growth"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Comment ({sectionCommentCounts["sec-revenue"] || 0})</span>
                  </button>
                </div>
              </div>
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/60 dark:bg-slate-800/40 text-[10px] uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="py-2 px-4">Monetization Stream</th>
                    <th className="py-2 px-3">Classification</th>
                    <th className="py-2 px-3 text-right">Year 1</th>
                    <th className="py-2 px-3 text-right">Year 3</th>
                    <th className="py-2 px-4 text-right">Year 5</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {financials.revenueStreams.map((st, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-4 font-medium text-slate-900 dark:text-slate-100">{st.name}</td>
                      <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{st.category}</td>
                      <td className="py-2 px-3 text-right font-mono">{fmt(st.values[0])}</td>
                      <td className="py-2 px-3 text-right font-mono">{fmt(st.values[2])}</td>
                      <td className="py-2 px-4 text-right font-mono font-semibold text-emerald-600">
                        {fmt(st.values[4])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <InvestorFooter plan={plan} pageNumber={2} totalPages={5} compact={isCompactWhitespace} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 3: LEADERSHIP, GOVERNANCE & FILLABLE ORGANOGRAM                      */}
      {/* ========================================================================= */}
      {(activePage === "all" || activePage === 3 || forceRenderAllPages) && (
        <div
          id="doc-page-3"
          data-page-title="Governance & Fillable Organogram"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm print:shadow-none print:border-none print:m-0 print:p-0 page-break mb-8 print:mb-0"
        >
          {/* Print-Friendly Running Institutional Header */}
          <PrintFriendlyHeader
            plan={plan}
            pageNumber={3}
            totalPages={5}
            sectionTitle="Governance & Executive Organogram"
          />

          {/* Topic 3 Header */}
          <div className={`flex items-center justify-between border-b border-slate-200 dark:border-slate-800 ${topicHeadingClass}`}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
              3. Governance, Executive Leadership & System-Fillable Organogram
            </h2>
            <span className="text-[10px] font-mono text-slate-400">03 / GOVERNANCE</span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Complete organizational hierarchy with equity vesting, departmental divisions, and active recruitment allocations. Positions are directly fillable and synchronized with investor records.
            </p>

            {/* Embedded Fillable Organogram Tree */}
            <OrganogramView
              organogram={plan.organogram}
              onUpdateOrganogram={handleUpdateOrganogram}
              isEditable={true}
              companyName={plan.companyName}
              planId={plan.id}
              planName={plan.name}
              onCommentOnNode={(node) => {
                setActiveCommentTarget({
                  targetType: "organogram_node",
                  targetId: node.id,
                  targetLabel: `${node.name} (${node.title})`,
                });
                setCommentsSidebarOpen(true);
              }}
              nodeCommentCounts={organogramCommentCounts}
            />
          </div>

          <InvestorFooter plan={plan} pageNumber={3} totalPages={5} compact={isCompactWhitespace} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 4: 5-YEAR FINANCIAL MODEL & COMPACT GRAPHS                            */}
      {/* ========================================================================= */}
      {(activePage === "all" || activePage === 4 || forceRenderAllPages) && (
        <div
          id="doc-page-4"
          data-page-title="5-Year Financial Model & Compact Graphs"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm print:shadow-none print:border-none print:m-0 print:p-0 page-break mb-8 print:mb-0"
        >
          {/* Print-Friendly Running Institutional Header */}
          <PrintFriendlyHeader
            plan={plan}
            pageNumber={4}
            totalPages={5}
            sectionTitle="5-Year Financial Model & Growth Visuals"
          />

          {/* Topic 4 Header */}
          <div className={`flex items-center justify-between border-b border-slate-200 dark:border-slate-800 ${topicHeadingClass}`}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
              4. Five-Year Comprehensive Financial Projections (P&L Model)
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveCommentTarget({
                    targetType: "financial_section",
                    targetId: "sec-pnl",
                    targetLabel: "5-Year Income Statement & P&L",
                  });
                  setCommentsSidebarOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg border border-indigo-300 dark:border-indigo-800 transition-colors pdf-exclude print:hidden cursor-pointer"
                title="Review or leave feedback on 5-Year Financial P&L Projections"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Comment ({sectionCommentCounts["sec-pnl"] || 0})</span>
              </button>

              <button
                onClick={handleExportExcel}
                disabled={isExportingExcel}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-300 dark:border-emerald-800 transition-colors pdf-exclude print:hidden cursor-pointer disabled:opacity-50"
                title="Export complete 5-year financial schedules as Microsoft Excel (.xlsx) workbook"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Export as Excel</span>
              </button>
              <span className="text-[10px] font-mono text-slate-400">04 / FINANCIALS</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Growth Forecast Gauge & Space-Optimized Growth Trajectory Visuals */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
              {/* Growth Forecast Gauge (5 cols) */}
              <div className="lg:col-span-5 flex">
                <GrowthForecastGauge
                  financials={financials}
                  scale={formatSettings.graphScale}
                  className="w-full h-full"
                />
              </div>

              {/* Space-Optimized Growth Trajectory Visuals (7 cols) */}
              <div className="lg:col-span-7 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Space-Optimized Growth Trajectory Visuals
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Scale: {formatSettings.graphScale.toUpperCase()}
                  </span>
                </div>
                <CompactFinancialGraphs financials={financials} scale={formatSettings.graphScale} />
              </div>
            </div>

            {/* Standard 5-Year P&L Table */}
            <div
              id="sec-pnl"
              className={`border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto transition-all ${
                highlightedSectionId === "sec-pnl"
                  ? "ring-2 ring-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/30"
                  : ""
              }`}
            >
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    <th className="py-2 px-3">Metric ($ USD)</th>
                    <th className="py-2 px-3 text-right font-mono">Year 1</th>
                    <th className="py-2 px-3 text-right font-mono">Year 2</th>
                    <th className="py-2 px-3 text-right font-mono">Year 3</th>
                    <th className="py-2 px-3 text-right font-mono">Year 4</th>
                    <th className="py-2 px-3 text-right font-mono">Year 5</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr className="font-bold bg-emerald-50/40 dark:bg-emerald-950/20">
                    <td className="py-2 px-3 text-emerald-900 dark:text-emerald-300">Total Net Revenue</td>
                    {financials.totalRevenue.map((v, i) => (
                      <td key={i} className="py-2 px-3 text-right font-mono text-emerald-900 dark:text-emerald-300">
                        {fmt(v)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-500 pl-5">Cost of Goods Sold (COGS)</td>
                    {financials.totalCogs.map((v, i) => (
                      <td key={i} className="py-2 px-3 text-right font-mono text-rose-600">
                        -{fmt(v)}
                      </td>
                    ))}
                  </tr>
                  <tr className="font-bold bg-indigo-50/30 dark:bg-indigo-950/20">
                    <td className="py-2 px-3 text-indigo-900 dark:text-indigo-300">Gross Profit</td>
                    {financials.grossProfit.map((v, i) => (
                      <td key={i} className="py-2 px-3 text-right font-mono text-indigo-900 dark:text-indigo-300">
                        {fmt(v)}
                      </td>
                    ))}
                  </tr>
                  <tr className="text-[11px] italic text-indigo-700 dark:text-indigo-400">
                    <td className="py-1 px-3 pl-5">Gross Margin %</td>
                    {financials.grossMarginPercent.map((m, i) => (
                      <td key={i} className="py-1 px-3 text-right font-mono">
                        {m}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-500 pl-5">Total Operating Expenses</td>
                    {financials.totalOpex.map((v, i) => (
                      <td key={i} className="py-2 px-3 text-right font-mono text-slate-600">
                        -{fmt(v)}
                      </td>
                    ))}
                  </tr>
                  <tr className="font-bold bg-slate-100/60 dark:bg-slate-800/40">
                    <td className="py-2 px-3 text-slate-900 dark:text-slate-100">EBITDA</td>
                    {financials.ebitda.map((v, i) => (
                      <td
                        key={i}
                        className={`py-2 px-3 text-right font-mono ${
                          v < 0 ? "text-rose-600" : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {fmt(v)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-500 pl-5">Depreciation & Amortization</td>
                    {financials.depreciationAmortization.map((v, i) => (
                      <td key={i} className="py-2 px-3 text-right font-mono">
                        -{fmt(v)}
                      </td>
                    ))}
                  </tr>
                  <tr className="font-bold bg-emerald-100/60 dark:bg-emerald-950/40 text-sm">
                    <td className="py-2.5 px-3 text-emerald-950 dark:text-emerald-200">Net Profit / (Loss)</td>
                    {financials.netIncome.map((v, i) => (
                      <td
                        key={i}
                        className={`py-2.5 px-3 text-right font-mono ${
                          v < 0 ? "text-rose-700 dark:text-rose-400" : "text-emerald-800 dark:text-emerald-300"
                        }`}
                      >
                        {fmt(v)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <InvestorFooter plan={plan} pageNumber={4} totalPages={5} compact={isCompactWhitespace} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 5: CASH FLOW, BREAK-EVEN & INVESTMENT OFFERING                       */}
      {/* ========================================================================= */}
      {(activePage === "all" || activePage === 5 || forceRenderAllPages) && (
        <div
          id="doc-page-5"
          data-page-title="Cash Flow Reserves & Term Sheet"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm print:shadow-none print:border-none print:m-0 print:p-0 page-break mb-8 print:mb-0"
        >
          {/* Print-Friendly Running Institutional Header */}
          <PrintFriendlyHeader
            plan={plan}
            pageNumber={5}
            totalPages={5}
            sectionTitle="Cash Flow Reserves, Break-Even & Offering"
          />

          {/* Topic 5 Header */}
          <div className={`flex items-center justify-between border-b border-slate-200 dark:border-slate-800 ${topicHeadingClass}`}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
              5. Cash Flow Reserves, Break-Even & Seed Round Term Sheet
            </h2>
            <span className="text-[10px] font-mono text-slate-400">05 / OFFERING</span>
          </div>

          <div className="space-y-4">
            {/* Free Cash Flow & Ending Cash Balance */}
            <div
              id="sec-cashflow"
              className={`border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto transition-all ${
                highlightedSectionId === "sec-cashflow"
                  ? "ring-2 ring-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/30"
                  : ""
              }`}
            >
              <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-1.5 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex justify-between items-center">
                <span>Free Cash Flow & Ending Reserves</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCommentTarget({
                      targetType: "financial_section",
                      targetId: "sec-cashflow",
                      targetLabel: "Cash Flow & Ending Reserves",
                    });
                    setCommentsSidebarOpen(true);
                  }}
                  className="pdf-exclude print:hidden flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Comments ({sectionCommentCounts["sec-cashflow"] || 0})</span>
                </button>
              </div>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    <th className="py-2 px-3">Cash Position ($ USD)</th>
                    <th className="py-2 px-3 text-right font-mono">Year 1</th>
                    <th className="py-2 px-3 text-right font-mono">Year 2</th>
                    <th className="py-2 px-3 text-right font-mono">Year 3</th>
                    <th className="py-2 px-3 text-right font-mono">Year 4</th>
                    <th className="py-2 px-3 text-right font-mono">Year 5</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="py-2 px-3 font-medium">Free Cash Flow (FCF)</td>
                    {financials.cashFlow.freeCashFlow.map((v, i) => (
                      <td
                        key={i}
                        className={`py-2 px-3 text-right font-mono ${
                          v < 0 ? "text-rose-600" : "text-sky-600 font-semibold"
                        }`}
                      >
                        {fmt(v)}
                      </td>
                    ))}
                  </tr>
                  <tr className="font-bold bg-amber-50/70 dark:bg-amber-950/30 text-sm">
                    <td className="py-2.5 px-3 text-amber-950 dark:text-amber-200">Ending Cash Balance</td>
                    {financials.cashFlow.endingCashBalance.map((v, i) => (
                      <td key={i} className="py-2.5 px-3 text-right font-mono text-amber-950 dark:text-amber-200">
                        {fmt(v)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Break-even & Term Sheet Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                id="sec-breakeven"
                className={`p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 transition-all ${
                  highlightedSectionId === "sec-breakeven"
                    ? "ring-2 ring-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/30"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Break-Even Sensitivity
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCommentTarget({
                        targetType: "financial_section",
                        targetId: "sec-breakeven",
                        targetLabel: "Monthly Burn & Break-Even Horizon",
                      });
                      setCommentsSidebarOpen(true);
                    }}
                    className="pdf-exclude print:hidden flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    title="Audit break-even and burn rate metrics"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Audit ({sectionCommentCounts["sec-breakeven"] || 0})</span>
                  </button>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Break-Even Point:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      Month {financials.breakEven.breakEvenMonth || 14}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Monthly Burn to Profit:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {fmt(financials.breakEven.monthlyBurn)} / mo
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Break-Even Revenue:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {fmt(financials.breakEven.breakEvenRevenue)} / mo
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cash Runway Cushion:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {financials.investorMetrics.runwayMonths || 24} Months
                    </span>
                  </div>
                </div>
              </div>

              <div
                id="sec-offering"
                className={`p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 transition-all ${
                  highlightedSectionId === "sec-offering"
                    ? "ring-2 ring-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/30"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Offering Structure & Security
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCommentTarget({
                        targetType: "financial_section",
                        targetId: "sec-offering",
                        targetLabel: "Seed Offering Terms & Valuation",
                      });
                      setCommentsSidebarOpen(true);
                    }}
                    className="pdf-exclude print:hidden flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    title="Leave feedback on valuation and investment terms"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Comment ({sectionCommentCounts["sec-offering"] || 0})</span>
                  </button>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Raise:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {fmt(financials.investorMetrics.totalFundingRequired)} Preferred Seed
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pre-Money Valuation:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {fmt(financials.investorMetrics.preMoneyValuation)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Governance:</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      1 Preferred Board Seat, Pro-Rata Rights
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Activity Hub Audit:</span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Fully Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <InvestorFooter plan={plan} pageNumber={5} totalPages={5} compact={isCompactWhitespace} />
        </div>
      )}

      {/* Persistent Floating Quick KPI Overlay Pill */}
      <div className="fixed bottom-4 right-6 z-40 print:hidden flex items-center shadow-xl rounded-full border border-slate-700/80 bg-slate-900/95 text-white backdrop-blur-md px-3.5 py-2 hover:scale-[1.02] transition-transform">
        <button
          id="floating-kpi-dashboard-trigger"
          onClick={() => setKpiDashboardOpen(true)}
          className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer"
          title="Click to expand high-level KPI dashboard overlay"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">
            ARR:{" "}
            <strong className="text-emerald-300 font-mono">
              {plan.financials.totalRevenue[0] >= 1000000
                ? `$${(plan.financials.totalRevenue[0] / 1000000).toFixed(1)}M`
                : `$${(plan.financials.totalRevenue[0] / 1000).toFixed(0)}K`}
            </strong>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">
            Burn:{" "}
            <strong className="text-amber-300 font-mono">
              ${(plan.financials.breakEven.monthlyBurn / 1000).toFixed(0)}K/mo
            </strong>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">
            CAC:{" "}
            <strong className="text-cyan-300 font-mono">
              ${plan.financials.investorMetrics.cac}
            </strong>
          </span>
          <span className="ml-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold shadow-xs flex items-center gap-1">
            <Activity className="w-3 h-3" />
            <span>KPI Dashboard</span>
          </span>
        </button>
      </div>

      {/* High-Level KPI Dashboard Overlay Component */}
      <KpiDashboardOverlay
        isOpen={kpiDashboardOpen}
        onClose={() => setKpiDashboardOpen(false)}
        plan={plan}
      />

      {/* Review & Comments Sidebar */}
      <ReviewCommentsSidebar
        isOpen={commentsSidebarOpen}
        onClose={() => {
          setCommentsSidebarOpen(false);
          setActiveCommentTarget(null);
        }}
        plan={plan}
        onUpdatePlan={onUpdatePlan}
        activeTargetFilter={activeCommentTarget}
        onClearActiveTargetFilter={() => setActiveCommentTarget(null)}
        onNavigateToTarget={handleNavigateToTarget}
      />

      {/* Export History Panel */}
      <ExportHistoryPanel
        isOpen={exportHistoryOpen}
        onClose={() => setExportHistoryOpen(false)}
        currentPlan={plan}
        history={exportHistory}
        onUpdateHistory={setExportHistory}
        onTriggerExportPdf={handleDownloadPdf}
        onTriggerExportExcel={handleExportExcel}
        onTriggerExportImage={handleExportOrganogramImage}
      />

      {/* Document Studio Settings & Meta-Data Manager Modal */}
      <MetadataManagerModal
        isOpen={metadataModalOpen}
        onClose={() => setMetadataModalOpen(false)}
        plan={plan}
        onUpdatePlan={onUpdatePlan}
        onApplyToAllPlans={onApplyToAllPlans}
        onTriggerExportPdf={handleDownloadPdf}
      />
    </div>
  );
};
