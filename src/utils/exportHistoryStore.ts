import { ExportRecord } from "../types";

const EXPORT_HISTORY_STORAGE_KEY = "bplan_export_history_v1";

const INITIAL_EXPORT_HISTORY: ExportRecord[] = [
  {
    id: "exp-init-001",
    planId: "plan-apex-agtech",
    planName: "Apex AgTech Systems",
    companyName: "Apex AgTech Systems Inc.",
    fileName: "Apex_AgTech_Systems_Investor_Business_Plan.pdf",
    format: "pdf",
    exportedAt: "2026-09-20T12:45:10.000Z",
    fileSizeFormatted: "2.8 MB",
    scope: "Full Memorandum (5 Pages)",
    status: "success",
    triggeredBy: "Document Studio Toolbar",
    notes: "Print-ready institutional memorandum with compact graphs and fillable organogram",
  },
  {
    id: "exp-init-002",
    planId: "plan-apex-agtech",
    planName: "Apex AgTech Systems",
    companyName: "Apex AgTech Systems Inc.",
    fileName: "Apex_AgTech_Systems_Financial_Model.xlsx",
    format: "excel",
    exportedAt: "2026-09-20T11:20:45.000Z",
    fileSizeFormatted: "44.2 KB",
    scope: "Complete Financial Model (5-Year P&L, FCF, Metrics)",
    status: "success",
    triggeredBy: "Excel Exporter Dropdown",
    notes: "Formatted multi-sheet workbook including revenue drivers and unit economics",
  },
  {
    id: "exp-init-003",
    planId: "plan-apex-agtech",
    planName: "Apex AgTech Systems",
    companyName: "Apex AgTech Systems Inc.",
    fileName: "Apex_AgTech_Systems_Governance_Organogram.png",
    format: "image",
    exportedAt: "2026-09-20T10:15:30.000Z",
    fileSizeFormatted: "860 KB",
    scope: "Organogram Hierarchy (Executive Tree)",
    status: "success",
    triggeredBy: "Organogram Image Export",
    notes: "High-resolution (2.5x retina) PNG canvas render with equity tags",
  },
  {
    id: "exp-init-004",
    planId: "plan-lumina-health",
    planName: "Lumina Health AI",
    companyName: "Lumina Health AI Corp.",
    fileName: "Lumina_Health_AI_Investor_Business_Plan.pdf",
    format: "pdf",
    exportedAt: "2026-09-19T17:32:00.000Z",
    fileSizeFormatted: "3.1 MB",
    scope: "Full Memorandum (5 Pages)",
    status: "success",
    triggeredBy: "Document Studio Toolbar",
    notes: "Includes clinical validation milestones and Series A term sheet",
  },
  {
    id: "exp-init-005",
    planId: "plan-lumina-health",
    planName: "Lumina Health AI",
    companyName: "Lumina Health AI Corp.",
    fileName: "Lumina_Health_AI_Financial_Model.xlsx",
    format: "excel",
    exportedAt: "2026-09-19T16:04:12.000Z",
    fileSizeFormatted: "46.8 KB",
    scope: "Complete Financial Model",
    status: "success",
    triggeredBy: "KPI Dashboard Export",
    notes: "Includes FDA timeline contingency buffers and EBITDA waterfall",
  },
  {
    id: "exp-init-006",
    planId: "plan-apex-agtech",
    planName: "Apex AgTech Systems",
    companyName: "Apex AgTech Systems Inc.",
    fileName: "Apex_AgTech_Page_4_Financials.pdf",
    format: "pdf",
    exportedAt: "2026-09-18T14:10:00.000Z",
    fileSizeFormatted: "1.2 MB",
    scope: "Page 4 - 5-Year Financial Model",
    status: "success",
    triggeredBy: "Single Page PDF Exporter",
    notes: "Stand-alone audit sheet for investment committee review",
  },
];

export function getExportHistory(): ExportRecord[] {
  try {
    const raw = localStorage.getItem(EXPORT_HISTORY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EXPORT_HISTORY_STORAGE_KEY, JSON.stringify(INITIAL_EXPORT_HISTORY));
      return INITIAL_EXPORT_HISTORY;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_EXPORT_HISTORY;
  } catch (err) {
    console.warn("Could not read export history from localStorage, using defaults:", err);
    return INITIAL_EXPORT_HISTORY;
  }
}

export function saveExportHistory(history: ExportRecord[]): void {
  try {
    localStorage.setItem(EXPORT_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (err) {
    console.error("Failed to save export history to localStorage:", err);
  }
}

export function addExportRecord(
  record: Omit<ExportRecord, "id" | "exportedAt"> & { id?: string; exportedAt?: string }
): ExportRecord {
  const existing = getExportHistory();
  const newRecord: ExportRecord = {
    ...record,
    id: record.id || `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    exportedAt: record.exportedAt || new Date().toISOString(),
  };

  const updated = [newRecord, ...existing];
  saveExportHistory(updated);
  return newRecord;
}

export function deleteExportRecord(id: string): ExportRecord[] {
  const existing = getExportHistory();
  const updated = existing.filter((item) => item.id !== id);
  saveExportHistory(updated);
  return updated;
}

export function clearExportHistory(): ExportRecord[] {
  saveExportHistory([]);
  return [];
}

export function formatExportTimestamp(isoString: string): { full: string; relative: string } {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return { full: isoString, relative: "Recently" };
    }

    const full = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
    let relative = "Just now";

    if (diffSeconds < 60) {
      relative = "Just now";
    } else if (diffSeconds < 3600) {
      const mins = Math.floor(diffSeconds / 60);
      relative = `${mins}m ago`;
    } else if (diffSeconds < 86400) {
      const hours = Math.floor(diffSeconds / 3600);
      relative = `${hours}h ago`;
    } else if (diffSeconds < 86400 * 7) {
      const days = Math.floor(diffSeconds / 86400);
      relative = `${days}d ago`;
    } else {
      relative = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

    return { full, relative };
  } catch {
    return { full: isoString, relative: "Recently" };
  }
}
