import React, { useState } from "react";
import {
  X,
  Sliders,
  Settings2,
  FileText,
  Users,
  MapPin,
  Sparkles,
  Check,
  Layers,
  FileDown,
  Eye,
  ShieldCheck,
  AlertCircle,
  Building,
  Tag,
} from "lucide-react";
import { BusinessPlan, FormatSettings } from "../types";
import { PrintFriendlyHeader } from "./PrintFriendlyHeader";
import { InvestorFooter } from "./InvestorFooter";

interface MetadataManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: BusinessPlan;
  onUpdatePlan: (updated: BusinessPlan) => void;
  onApplyToAllPlans?: () => void;
  onTriggerExportPdf?: () => void;
}

export const MetadataManagerModal: React.FC<MetadataManagerModalProps> = ({
  isOpen,
  onClose,
  plan,
  onUpdatePlan,
  onApplyToAllPlans,
  onTriggerExportPdf,
}) => {
  // Local state for the Meta-Data inputs
  const [projectTagline, setProjectTagline] = useState(plan.tagline || "");
  const [founderNames, setFounderNames] = useState(plan.founderNames || "");
  const [locationRegion, setLocationRegion] = useState(plan.locationRegion || "");

  // Format settings local state
  const [whitespaceDensity, setWhitespaceDensity] = useState<FormatSettings["whitespaceDensity"]>(
    plan.formatSettings.whitespaceDensity
  );
  const [graphScale, setGraphScale] = useState<FormatSettings["graphScale"]>(
    plan.formatSettings.graphScale
  );
  const [showVerifiedSeal, setShowVerifiedSeal] = useState(
    plan.formatSettings.showFooterVerifiedSeal
  );
  const [footerDisclaimer, setFooterDisclaimer] = useState(
    plan.formatSettings.footerDisclaimer || "Prepared For Accredited Investors Only"
  );

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [appliedAllSuccess, setAppliedAllSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"metadata" | "format" | "preview">("metadata");

  // Keep local state in sync when plan changes
  React.useEffect(() => {
    setProjectTagline(plan.tagline || "");
    setFounderNames(plan.founderNames || "");
    setLocationRegion(plan.locationRegion || "");
    setWhitespaceDensity(plan.formatSettings.whitespaceDensity);
    setGraphScale(plan.formatSettings.graphScale);
    setShowVerifiedSeal(plan.formatSettings.showFooterVerifiedSeal);
    setFooterDisclaimer(plan.formatSettings.footerDisclaimer || "Prepared For Accredited Investors Only");
  }, [plan]);

  if (!isOpen) return null;

  // Build transient plan object for real-time live preview
  const previewPlan: BusinessPlan = {
    ...plan,
    tagline: projectTagline,
    founderNames: founderNames,
    locationRegion: locationRegion,
    formatSettings: {
      ...plan.formatSettings,
      whitespaceDensity,
      graphScale,
      showFooterVerifiedSeal: showVerifiedSeal,
      footerDisclaimer,
    },
  };

  const handleSave = () => {
    onUpdatePlan(previewPlan);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleApplyAll = () => {
    // First save current plan
    onUpdatePlan(previewPlan);
    if (onApplyToAllPlans) {
      onApplyToAllPlans();
    }
    setAppliedAllSuccess(true);
    setTimeout(() => {
      setAppliedAllSuccess(false);
    }, 2500);
  };

  const handleResetToDefaults = () => {
    setProjectTagline(plan.tagline || "Autonomous precision operating platform and yield model");
    setFounderNames("Dr. Eleanor Vance (CEO), Marcus Sterling (CTO)");
    setLocationRegion("San Francisco, CA & London, UK");
    setWhitespaceDensity("compact");
    setGraphScale("compact");
    setShowVerifiedSeal(true);
    setFooterDisclaimer("CONFIDENTIAL & PROPRIETARY • PREPARED FOR QUALIFIED INVESTORS • STRICTLY PRIVATE");
  };

  const regionalSuggestions = [
    "San Francisco, CA & Silicon Valley",
    "New York, NY & London, UK",
    "Boston, MA & Cambridge BioTech Hub",
    "Austin, TX & Munich, Germany",
    "Singapore & Sydney, APAC",
  ];

  return (
    <div
      id="metadata-manager-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white shadow-xs">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                  Document Studio Settings & Meta-Data Manager
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  PDF & Print Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Target Plan: <strong className="text-slate-800 dark:text-slate-200">{plan.companyName}</strong> ({plan.docReference})
              </p>
            </div>
          </div>

          <button
            id="btn-close-metadata-modal"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold">
          <button
            id="tab-metadata-manager"
            onClick={() => setActiveTab("metadata")}
            className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === "metadata"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Tag className="w-4 h-4 text-emerald-600" />
            <span>Meta-Data Manager</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
              Headers & Footers
            </span>
          </button>

          <button
            id="tab-live-preview"
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === "preview"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Eye className="w-4 h-4 text-indigo-500" />
            <span>Live Header/Footer Preview</span>
          </button>

          <button
            id="tab-format-settings"
            onClick={() => setActiveTab("format")}
            className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === "format"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Layout & Format Settings</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: Meta-Data Manager Section */}
          {activeTab === "metadata" && (
            <div className="space-y-6">
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-xl p-4 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1 leading-relaxed">
                  <p className="font-bold text-emerald-950 dark:text-emerald-100">
                    Automated PDF Header & Footer Injection
                  </p>
                  <p className="text-emerald-800/90 dark:text-emerald-300/90">
                    Values configured here are automatically synchronized into the top <strong>Print-Friendly Header</strong>, 
                    the bottom <strong>Investor Footer</strong>, and the embedded PDF document properties across all 5 pages.
                  </p>
                </div>
              </div>

              {/* Form Input 1: Project Tagline */}
              <div className="bg-white dark:bg-slate-800/60 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label htmlFor="input-project-tagline" className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Project Tagline / Investment Thesis</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Injected into Cover, Headers & PDF Meta
                  </span>
                </div>
                <input
                  id="input-project-tagline"
                  type="text"
                  value={projectTagline}
                  onChange={(e) => setProjectTagline(e.target.value)}
                  placeholder="e.g. Autonomous soil microbiome mapping and precision yield optimization platform"
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Concise 1-sentence value proposition displayed underneath the company title in printed headers and investor executive summaries.
                </p>
              </div>

              {/* Form Input 2: Founder Names */}
              <div className="bg-white dark:bg-slate-800/60 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label htmlFor="input-founder-names" className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Founder Names & Key Leadership</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Injected into Header & Footer Provenance
                  </span>
                </div>
                <input
                  id="input-founder-names"
                  type="text"
                  value={founderNames}
                  onChange={(e) => setFounderNames(e.target.value)}
                  placeholder="e.g. Dr. Eleanor Vance (CEO), Marcus Sterling (CTO)"
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Lists executive team members or founders. Appears in the cover page leadership badge, inner page headers, and footer verification line.
                </p>
              </div>

              {/* Form Input 3: Location / Region */}
              <div className="bg-white dark:bg-slate-800/60 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label htmlFor="input-location-region" className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Location / Region</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Injected into Jurisdictions & Footers
                  </span>
                </div>
                <input
                  id="input-location-region"
                  type="text"
                  value={locationRegion}
                  onChange={(e) => setLocationRegion(e.target.value)}
                  placeholder="e.g. San Francisco, CA & London, UK"
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                />

                {/* Quick Suggestion Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Presets:</span>
                  {regionalSuggestions.map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => setLocationRegion(region)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Live Real-Time Header & Footer Preview */}
          {activeTab === "preview" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    Real-Time PDF Header & Footer Live Preview
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    See exactly how your Project Tagline, Founder Names, and Location/Region will render on paper and in exported PDFs.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded font-bold border border-emerald-300 dark:border-emerald-800">
                  Live Synced
                </span>
              </div>

              {/* Cover Page Header Preview */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Cover Page Header (Page 1)</span>
                  <span className="text-emerald-600 font-mono">Branded Master Header</span>
                </div>
                <div className="bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
                  <PrintFriendlyHeader
                    plan={previewPlan}
                    pageNumber={1}
                    totalPages={5}
                    sectionTitle="Executive Memorandum & Operating Model"
                    isCoverPage={true}
                  />
                </div>
              </div>

              {/* Inner Page Header Preview */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Inner Page Header (Pages 2-5)</span>
                  <span className="text-indigo-600 font-mono">Compact Navigation Strip</span>
                </div>
                <div className="bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
                  <PrintFriendlyHeader
                    plan={previewPlan}
                    pageNumber={2}
                    totalPages={5}
                    sectionTitle="5-Year Financial P&L & Projections"
                    isCoverPage={false}
                  />
                </div>
              </div>

              {/* Investor Footer Preview */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Investor Institutional Footer</span>
                  <span className="text-amber-600 font-mono">Full Provenance & Compliance</span>
                </div>
                <div className="bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
                  <InvestorFooter
                    plan={previewPlan}
                    pageNumber={2}
                    totalPages={5}
                    compact={previewPlan.formatSettings.whitespaceDensity === "compact"}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: General Document Layout & Format Settings */}
          {activeTab === "format" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Whitespace density */}
                <div className="bg-white dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Whitespace Density</span>
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Controls vertical gap sizing below topic headers.
                  </p>
                  <select
                    value={whitespaceDensity}
                    onChange={(e) => setWhitespaceDensity(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <option value="compact">Compact (Standardized - No Dead Space)</option>
                    <option value="balanced">Balanced</option>
                    <option value="spacious">Spacious</option>
                  </select>
                </div>

                {/* Graph Scale */}
                <div className="bg-white dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Financial Graph Scale</span>
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Bento chart geometry to fit 5-year metrics on 1 page.
                  </p>
                  <select
                    value={graphScale}
                    onChange={(e) => setGraphScale(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <option value="compact">Compact (Space-Optimized Bento)</option>
                    <option value="medium">Medium</option>
                    <option value="expanded">Expanded</option>
                  </select>
                </div>
              </div>

              {/* Verified Seal Toggle */}
              <div className="bg-white dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Show Footer Verified Seal</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Includes official "Verified Hub Standard" seal in the PDF footer.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showVerifiedSeal}
                  onChange={(e) => setShowVerifiedSeal(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer rounded"
                />
              </div>

              {/* Footer Disclaimer Text */}
              <div className="bg-white dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <label className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Custom Footer Legal Disclaimer
                </label>
                <input
                  type="text"
                  value={footerDisclaimer}
                  onChange={(e) => setFooterDisclaimer(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/95 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline font-medium"
            >
              Reset to Master Template
            </button>
            {savedSuccess && (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                <Check className="w-3.5 h-3.5" />
                Saved & Injected!
              </span>
            )}
            {appliedAllSuccess && (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                <Check className="w-3.5 h-3.5" />
                Applied to All Hub Plans!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {onTriggerExportPdf && (
              <button
                type="button"
                onClick={() => {
                  onUpdatePlan(previewPlan);
                  onTriggerExportPdf();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer"
                title="Save and directly trigger PDF export with new metadata"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                <span>Save & Test PDF</span>
              </button>
            )}

            {onApplyToAllPlans && (
              <button
                type="button"
                onClick={handleApplyAll}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
                title="Apply these metadata conventions to all business plans in the Activity Hub"
              >
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>Apply to All Plans</span>
              </button>
            )}

            <button
              id="btn-save-metadata"
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save & Apply Meta-Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
