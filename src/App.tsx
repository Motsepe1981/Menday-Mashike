import React, { useState, useEffect, useMemo, useRef } from "react";
import { initialBusinessPlans } from "./data/initialBusinessPlans";
import { BusinessPlan, ExportRecord, FormatSettings, FormatSyncProposal, SyncChangeDiff } from "./types";
import { DocumentStudioView } from "./components/DocumentStudioView";
import { FinancialsView } from "./components/FinancialsView";
import { OrganogramView } from "./components/OrganogramView";
import { ActivityHubList } from "./components/ActivityHubList";
import { MissingDataVerificationModal } from "./components/MissingDataVerificationModal";
import { QuickExportFloatingMenu } from "./components/QuickExportFloatingMenu";
import { ExportHistoryPanel } from "./components/ExportHistoryPanel";
import { SyncMasterFormatProposal } from "./components/SyncMasterFormatProposal";
import { SyncMasterFormatReviewModal } from "./components/SyncMasterFormatReviewModal";
import { SyncMasterFormatStatusBadge } from "./components/SyncMasterFormatStatusBadge";
import { exportFinancialsToExcel } from "./utils/excelExporter";
import { exportElementAsPng } from "./utils/imageExporter";
import {
  getExportHistory,
  addExportRecord,
  saveExportHistory,
} from "./utils/exportHistoryStore";
import {
  FileText,
  TrendingUp,
  Users,
  LayoutGrid,
  Layers,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  Check,
  ExternalLink,
  Info,
  ArrowLeftRight,
  Zap,
  Download,
} from "lucide-react";

export function App() {
  const [plans, setPlans] = useState<BusinessPlan[]>(initialBusinessPlans);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("plan-apex-agtech");
  const [activeView, setActiveView] = useState<"studio" | "financials" | "organogram" | "hub" | "split">("studio");
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditedPlan, setAuditedPlan] = useState<BusinessPlan | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Export & Global Shortcut (Ctrl+E) state
  const [quickExportOpen, setQuickExportOpen] = useState(false);
  const [pendingPdfExport, setPendingPdfExport] = useState<{ singlePage?: number; timestamp: number } | null>(null);
  const [appExportHistoryOpen, setAppExportHistoryOpen] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportRecord[]>(() => getExportHistory());
  const [isExportingExcelApp, setIsExportingExcelApp] = useState(false);
  const [isExportingImageApp, setIsExportingImageApp] = useState(false);

  // Automated 'Sync Master Format' Background Process State
  const [syncProposal, setSyncProposal] = useState<FormatSyncProposal | null>(null);
  const [syncReviewModalOpen, setSyncReviewModalOpen] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem("syncMasterFormatAutoSync") === "true";
    } catch {
      return false;
    }
  });
  const prevFormatSettingsRef = useRef<Record<string, FormatSettings>>({});

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const referenceMasterPlan = plans.find((p) => p.isAttachedReference) || plans[0];

  // Initialize reference snapshot of plan layout & format settings
  useEffect(() => {
    if (Object.keys(prevFormatSettingsRef.current).length === 0) {
      const initialSnapshot: Record<string, FormatSettings> = {};
      plans.forEach((p) => {
        initialSnapshot[p.id] = { ...p.formatSettings };
      });
      prevFormatSettingsRef.current = initialSnapshot;
    }
  }, [plans]);

  const isMac = useMemo(() => {
    return typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  }, []);
  const shortcutDisplay = isMac ? "⌘E" : "Ctrl+E";

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Global Keyboard Shortcut Listener: Ctrl+E (or ⌘E on Mac)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "e" || e.code === "KeyE")) {
        e.preventDefault();
        e.stopPropagation();
        setQuickExportOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Quick Export Handlers
  const handleTriggerPdfExport = (singlePage?: number) => {
    if (activeView !== "studio") {
      setActiveView("studio");
    }
    setPendingPdfExport({
      singlePage,
      timestamp: Date.now(),
    });
  };

  const handleTriggerExcelExport = () => {
    setIsExportingExcelApp(true);
    try {
      exportFinancialsToExcel(selectedPlan);
      const excelFileName = `${selectedPlan.companyName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Financial_Model.xlsx`;

      const record = addExportRecord({
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        companyName: selectedPlan.companyName,
        fileName: excelFileName,
        format: "excel",
        fileSizeFormatted: "44.2 KB",
        scope: "Complete Financial Model (5-Year P&L, Cash Flow, Drivers)",
        status: "success",
        triggeredBy: `Quick Export (${shortcutDisplay})`,
        notes: "Multi-tab institutional workbook exported via Quick Export shortcut",
      });
      setExportHistory((prev) => [record, ...prev.filter((r) => r.id !== record.id)]);
      triggerToast(`Financial model for ${selectedPlan.companyName} exported as Excel (.xlsx) successfully!`);
    } catch (err) {
      console.error("Excel export failed:", err);
      triggerToast("Failed to export financial model to Excel. Please try again.");
    } finally {
      setIsExportingExcelApp(false);
    }
  };

  const handleTriggerImageExport = async () => {
    setIsExportingImageApp(true);
    let targetEl =
      document.getElementById("organogram-visual-canvas") ||
      document.getElementById("document-organogram-tree") ||
      document.getElementById("organogram-canvas-container");

    if (!targetEl) {
      setActiveView("organogram");
      await new Promise((r) => setTimeout(r, 350));
      targetEl =
        document.getElementById("organogram-visual-canvas") ||
        document.getElementById("document-organogram-tree") ||
        document.getElementById("organogram-canvas-container");
    }

    if (!targetEl) {
      setIsExportingImageApp(false);
      triggerToast("Unable to locate organogram tree for image export.");
      return;
    }

    try {
      const imgFileName = `${selectedPlan.companyName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Organogram_Structure.png`;
      await exportElementAsPng(targetEl, {
        fileName: imgFileName,
        scale: 2.5,
      });

      const record = addExportRecord({
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        companyName: selectedPlan.companyName,
        fileName: imgFileName,
        format: "image",
        fileSizeFormatted: "1.8 MB",
        scope: "Governance Structure & Fillable Organogram Tree",
        status: "success",
        triggeredBy: `Quick Export (${shortcutDisplay})`,
        notes: "High-resolution 2.5x transparent PNG graphic exported for pitch deck presentation slides",
      });
      setExportHistory((prev) => [record, ...prev.filter((r) => r.id !== record.id)]);
      triggerToast(`Organogram graphic for ${selectedPlan.companyName} exported as PNG successfully!`);
    } catch (err) {
      console.error("Organogram image export failed:", err);
      triggerToast("Failed to export organogram image. Please try again.");
    } finally {
      setIsExportingImageApp(false);
    }
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  const handleOpenHistory = () => {
    setAppExportHistoryOpen(true);
  };

  // User Request: "Apply exactly the formatting of the attached business plan to all business plans in the system"
  const handleApplyMasterFormatToAll = () => {
    const masterFormat = referenceMasterPlan.formatSettings;

    const updated = plans.map((p) => ({
      ...p,
      formatSettings: {
        ...p.formatSettings,
        whitespaceDensity: masterFormat.whitespaceDensity, // "compact" - no dead vertical gaps below topics
        graphScale: masterFormat.graphScale, // "compact" - reduced size graphs utilizing available space
        showFooterVerifiedSeal: true,
        footerDisclaimer: masterFormat.footerDisclaimer,
      },
    }));

    setPlans(updated);
    triggerToast(
      "Master formatting successfully applied to all 4 business plans in Activity Hub (Compact Whitespace, Compact Graphs, Fillable Organogram, Standardized Investor Footer)."
    );
  };

  const handleUpdateCurrentPlan = (updatedPlan: BusinessPlan) => {
    const prevSettings = prevFormatSettingsRef.current[updatedPlan.id] || updatedPlan.formatSettings;
    const newSettings = updatedPlan.formatSettings;

    // Detect if manual layout/spacing adjustments occurred
    const diffs: SyncChangeDiff[] = [];

    if (prevSettings.whitespaceDensity !== newSettings.whitespaceDensity) {
      diffs.push({
        attribute: "whitespaceDensity",
        label: "Whitespace Density",
        oldValue: prevSettings.whitespaceDensity,
        newValue: newSettings.whitespaceDensity,
        description: `Whitespace density updated from ${prevSettings.whitespaceDensity} to ${newSettings.whitespaceDensity}`,
      });
    }

    if (prevSettings.graphScale !== newSettings.graphScale) {
      diffs.push({
        attribute: "graphScale",
        label: "Financial Graph Sizing",
        oldValue: prevSettings.graphScale,
        newValue: newSettings.graphScale,
        description: `Graph scaling changed from ${prevSettings.graphScale} to ${newSettings.graphScale}`,
      });
    }

    if (prevSettings.fontHierarchy !== newSettings.fontHierarchy) {
      diffs.push({
        attribute: "fontHierarchy",
        label: "Font Hierarchy",
        oldValue: prevSettings.fontHierarchy,
        newValue: newSettings.fontHierarchy,
        description: `Typography hierarchy adjusted from ${prevSettings.fontHierarchy} to ${newSettings.fontHierarchy}`,
      });
    }

    // Update the targeted plan in state
    setPlans((currentPlans) =>
      currentPlans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
    );

    // Update snapshot for this plan
    prevFormatSettingsRef.current[updatedPlan.id] = { ...newSettings };

    // If layout or spacing adjustments were detected, find differing plans in library
    if (diffs.length > 0) {
      const otherPlans = plans.filter((p) => p.id !== updatedPlan.id);
      const differingPlans = otherPlans.filter(
        (p) =>
          p.formatSettings.whitespaceDensity !== newSettings.whitespaceDensity ||
          p.formatSettings.graphScale !== newSettings.graphScale ||
          p.formatSettings.fontHierarchy !== newSettings.fontHierarchy
      );

      if (differingPlans.length > 0) {
        if (autoSyncEnabled) {
          // Automated background process: silently sync layout across all other plans
          setPlans((currentPlans) =>
            currentPlans.map((p) => {
              if (differingPlans.some((dp) => dp.id === p.id)) {
                const synced = {
                  ...p,
                  formatSettings: {
                    ...p.formatSettings,
                    whitespaceDensity: newSettings.whitespaceDensity,
                    graphScale: newSettings.graphScale,
                    fontHierarchy: newSettings.fontHierarchy,
                  },
                };
                prevFormatSettingsRef.current[p.id] = { ...synced.formatSettings };
                return synced;
              }
              return p;
            })
          );
          triggerToast(
            `⚡ Auto-Sync Master Format: Automatically synchronized ${newSettings.whitespaceDensity} spacing across all ${differingPlans.length} other plans in library.`
          );
        } else {
          // Automated background process: propose applying this specific spacing configuration to all other plans
          setSyncProposal({
            id: `proposal-${Date.now()}`,
            sourcePlanId: updatedPlan.id,
            sourcePlanName: updatedPlan.name,
            sourceCompanyName: updatedPlan.companyName,
            diffs,
            newFormatSettings: { ...newSettings },
            targetPlanIds: differingPlans.map((p) => p.id),
            targetPlanNames: differingPlans.map((p) => p.name),
            timestamp: Date.now(),
          });
        }
      }
    }
  };

  const handleApplySyncProposal = (selectedTargetPlanIds?: string[]) => {
    const sourceSettings = syncProposal ? syncProposal.newFormatSettings : selectedPlan.formatSettings;
    const targetIds =
      selectedTargetPlanIds && selectedTargetPlanIds.length > 0
        ? selectedTargetPlanIds
        : syncProposal?.targetPlanIds || plans.filter((p) => p.id !== selectedPlan.id).map((p) => p.id);

    setPlans((currentPlans) =>
      currentPlans.map((p) => {
        if (targetIds.includes(p.id)) {
          const synced = {
            ...p,
            formatSettings: {
              ...p.formatSettings,
              whitespaceDensity: sourceSettings.whitespaceDensity,
              graphScale: sourceSettings.graphScale,
              fontHierarchy: sourceSettings.fontHierarchy,
            },
          };
          prevFormatSettingsRef.current[p.id] = { ...synced.formatSettings };
          return synced;
        }
        return p;
      })
    );

    const count = targetIds.length;
    triggerToast(
      `⚡ Master Format Synchronized: Applied ${sourceSettings.whitespaceDensity} spacing & ${sourceSettings.graphScale} graphs to ${count} plan${count > 1 ? "s" : ""} in library.`
    );
    setSyncProposal(null);
    setSyncReviewModalOpen(false);
  };

  const handleDismissSyncProposal = () => {
    setSyncProposal(null);
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSyncEnabled(enabled);
    try {
      localStorage.setItem("syncMasterFormatAutoSync", String(enabled));
    } catch {}
    if (enabled && syncProposal) {
      handleApplySyncProposal();
    } else {
      triggerToast(
        enabled
          ? "⚡ Auto-Sync enabled: Future layout adjustments will automatically sync across all plans."
          : "Proposal mode enabled: You will be asked before synchronizing layout adjustments."
      );
    }
  };

  const handleOpenAudit = (planToAudit: BusinessPlan) => {
    setAuditedPlan(planToAudit);
    setAuditModalOpen(true);
  };

  const handleApplyAuditCompletion = (completedPlan: BusinessPlan) => {
    setPlans(plans.map((p) => (p.id === completedPlan.id ? completedPlan : p)));
    triggerToast(`Financial data for ${completedPlan.name} verified and completed against Attached Master Plan!`);
  };

  const selectedPlanHasMissing =
    selectedPlan.financials.missingFields && selectedPlan.financials.missingFields.length > 0;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-4 max-w-md bg-slate-900 text-white dark:bg-emerald-950 dark:text-emerald-100 dark:border dark:border-emerald-700 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-slate-950 font-bold">
            <Check className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium leading-relaxed">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white text-xs ml-auto">
            ✕
          </button>
        </div>
      )}

      {/* Top Application Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Hub Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-slate-100">
                  Investor Business Plan Studio
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Activity Hub
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Standardized 5-Year Financials, Compact Bento Graphs & Fillable Organogram
              </p>
            </div>
          </div>

          {/* Quick Plan Switcher */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                id="plan-selector"
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isAttachedReference ? "★ (Attached Master)" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2.5 pointer-events-none text-slate-400" />
            </div>

            {/* Quick Status / Missing Warning */}
            {selectedPlanHasMissing ? (
              <button
                onClick={() => handleOpenAudit(selectedPlan)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 border border-amber-300 dark:border-amber-800 rounded-lg transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Missing Data ({selectedPlan.financials.missingFields.length})
              </button>
            ) : (
              <button
                onClick={() => handleOpenAudit(selectedPlan)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Audit Passed
              </button>
            )}

            {/* Sync Master Format Engine Monitor Status */}
            <SyncMasterFormatStatusBadge
              plans={plans}
              referencePlan={referenceMasterPlan}
              onOpenReview={() => setSyncReviewModalOpen(true)}
              autoSyncEnabled={autoSyncEnabled}
            />

            {/* Power-User Quick Export Hub Button */}
            <button
              id="btn-nav-quick-export"
              onClick={() => setQuickExportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs transition-all cursor-pointer group"
              title={`Open Quick Export Command Hub (${shortcutDisplay})`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span className="hidden md:inline">Quick Export</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-extrabold rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                {shortcutDisplay}
              </kbd>
            </button>

            {/* Master Batch Action */}
            <button
              onClick={handleApplyMasterFormatToAll}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-all cursor-pointer"
              title="Apply Attached Plan Formatting To All Plans"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Apply Format to All Plans</span>
              <span className="sm:hidden">Format All</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto border-t border-slate-200/60 dark:border-slate-800/60">
          <button
            onClick={() => setActiveView("studio")}
            className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeView === "studio"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            Document Studio & Formatted Pages
          </button>

          <button
            onClick={() => setActiveView("financials")}
            className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeView === "financials"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            5-Year Financial Statements & Graphs
          </button>

          <button
            onClick={() => setActiveView("organogram")}
            className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeView === "organogram"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            Fillable Governance Organogram
            {selectedPlan.organogram.some((n) => n.status === "Open/Hiring") && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

          <button
            onClick={() => setActiveView("hub")}
            className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeView === "hub"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Activity Hub Portfolio ({plans.length})
          </button>

          <button
            id="tab-nav-split-view"
            onClick={() => setActiveView("split")}
            className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeView === "split"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Split-View Financials</span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Recharts
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeView === "studio" && (
          <DocumentStudioView
            plan={selectedPlan}
            allPlans={plans}
            onUpdatePlan={handleUpdateCurrentPlan}
            onApplyToAllPlans={handleApplyMasterFormatToAll}
            onOpenVerification={() => handleOpenAudit(selectedPlan)}
            pendingExport={pendingPdfExport}
            onClearPendingExport={() => setPendingPdfExport(null)}
            onOpenQuickExport={() => setQuickExportOpen(true)}
            onOpenSyncReview={() => setSyncReviewModalOpen(true)}
          />
        )}

        {activeView === "financials" && (
          <FinancialsView
            plan={selectedPlan}
            onUpdatePlan={handleUpdateCurrentPlan}
            onVerifyAndComplete={() => handleOpenAudit(selectedPlan)}
            isVerifying={false}
          />
        )}

        {activeView === "organogram" && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <OrganogramView
              organogram={selectedPlan.organogram}
              onUpdateOrganogram={(nodes) =>
                handleUpdateCurrentPlan({ ...selectedPlan, organogram: nodes })
              }
              isEditable={true}
            />
          </div>
        )}

        {activeView === "hub" && (
          <ActivityHubList
            plans={plans}
            selectedPlanId={selectedPlanId}
            onSelectPlan={(id) => {
              setSelectedPlanId(id);
              setActiveView("studio");
            }}
            onApplyMasterFormatToAll={handleApplyMasterFormatToAll}
            onOpenAudit={handleOpenAudit}
          />
        )}

        {activeView === "split" && (
          <ActivityHubList
            plans={plans}
            selectedPlanId={selectedPlanId}
            initialSplitView={true}
            onSelectPlan={(id) => {
              setSelectedPlanId(id);
              setActiveView("studio");
            }}
            onApplyMasterFormatToAll={handleApplyMasterFormatToAll}
            onOpenAudit={handleOpenAudit}
          />
        )}
      </main>

      {/* Floating 'Quick Export' Trigger Button */}
      <button
        id="btn-floating-quick-export"
        onClick={() => setQuickExportOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 dark:bg-emerald-600 text-white shadow-xl hover:bg-slate-800 dark:hover:bg-emerald-500 border border-slate-700/80 dark:border-emerald-400 transition-all hover:scale-105 active:scale-95 cursor-pointer print:hidden group"
        title={`Open Quick Export Hub (${shortcutDisplay})`}
        aria-label="Quick Export"
      >
        <Zap className="w-4 h-4 text-emerald-400 dark:text-emerald-100 group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-bold tracking-tight">Quick Export</span>
        <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-extrabold rounded bg-slate-800 dark:bg-emerald-700/90 text-emerald-300 dark:text-emerald-100 border border-slate-700 dark:border-emerald-500 shadow-2xs">
          {shortcutDisplay}
        </kbd>
      </button>

      {/* Global Quick Export Hub Modal Menu (Ctrl+E / ⌘E) */}
      <QuickExportFloatingMenu
        isOpen={quickExportOpen}
        onClose={() => setQuickExportOpen(false)}
        plan={selectedPlan}
        allPlans={plans}
        onSelectPlan={(id) => setSelectedPlanId(id)}
        onExportPdf={handleTriggerPdfExport}
        onExportExcel={handleTriggerExcelExport}
        onExportImage={handleTriggerImageExport}
        onPrint={handleTriggerPrint}
        onOpenHistory={handleOpenHistory}
        isGeneratingPdf={false}
        isExportingExcel={isExportingExcelApp}
        isExportingImage={isExportingImageApp}
      />

      {/* Global Export History Panel */}
      <ExportHistoryPanel
        isOpen={appExportHistoryOpen}
        onClose={() => setAppExportHistoryOpen(false)}
        currentPlan={selectedPlan}
        history={exportHistory}
        onUpdateHistory={(updated) => {
          setExportHistory(updated);
          saveExportHistory(updated);
        }}
        onTriggerExportPdf={handleTriggerPdfExport}
        onTriggerExportExcel={handleTriggerExcelExport}
        onTriggerExportImage={handleTriggerImageExport}
      />

      {/* Verification & Missing Data Completion Modal */}
      {auditedPlan && (
        <MissingDataVerificationModal
          isOpen={auditModalOpen}
          targetPlan={auditedPlan}
          referencePlan={referenceMasterPlan}
          onClose={() => setAuditModalOpen(false)}
          onApplyCompletion={handleApplyAuditCompletion}
        />
      )}

      {/* Automated Sync Master Format Proposal Banner */}
      <SyncMasterFormatProposal
        proposal={syncProposal}
        onApplySync={handleApplySyncProposal}
        onOpenReview={() => setSyncReviewModalOpen(true)}
        onDismiss={handleDismissSyncProposal}
        autoSyncEnabled={autoSyncEnabled}
        onToggleAutoSync={handleToggleAutoSync}
      />

      {/* Sync Master Format Review & Plan Selection Modal */}
      <SyncMasterFormatReviewModal
        isOpen={syncReviewModalOpen}
        onClose={() => setSyncReviewModalOpen(false)}
        sourcePlan={
          syncProposal
            ? plans.find((p) => p.id === syncProposal.sourcePlanId) || selectedPlan
            : selectedPlan
        }
        allPlans={plans}
        diffs={syncProposal?.diffs}
        onApplySync={handleApplySyncProposal}
        autoSyncEnabled={autoSyncEnabled}
        onToggleAutoSync={handleToggleAutoSync}
      />
    </div>
  );
}

export default App;
