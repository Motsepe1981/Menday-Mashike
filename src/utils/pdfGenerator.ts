import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { BusinessPlan } from "../types";

export type PdfStage = "preparing" | "rendering" | "compiling" | "finalizing" | "completed";

export interface PdfExportProgress {
  currentPage: number;
  totalPages: number;
  percent: number;
  message: string;
  stage: PdfStage;
  currentPageTitle?: string;
  completedPages: number[];
  fileName?: string;
}

export interface PdfExportOptions {
  fileName?: string;
  onProgress?: (progress: PdfExportProgress) => void;
  format?: "a4" | "letter";
  abortSignal?: AbortSignal;
}

/**
 * Generates and downloads a multi-page investor-ready PDF of the Business Plan
 * Captures each of the 5 formatted pages while strictly preserving whitespace density,
 * compact financial graphs, unit economics, fillable organogram, and standardized investor footers.
 */
export async function downloadBusinessPlanPdf(
  plan: BusinessPlan,
  pageElements: HTMLElement[],
  options: PdfExportOptions = {}
): Promise<void> {
  const { onProgress, format = "a4", abortSignal } = options;
  const totalPages = pageElements.length;

  if (totalPages === 0) {
    throw new Error("No pages found to export.");
  }

  const completedPages: number[] = [];

  // Stage 1: Preparation
  if (onProgress) {
    onProgress({
      currentPage: 0,
      totalPages,
      percent: 5,
      message: "Initializing high-fidelity PDF canvas...",
      stage: "preparing",
      completedPages: [],
    });
  }

  if (abortSignal?.aborted) {
    throw new DOMException("PDF export cancelled by user.", "AbortError");
  }

  // Initialize jsPDF with A4 Portrait (210mm x 297mm)
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format,
    compress: true,
  });

  // Inject metadata into PDF document properties
  pdf.setProperties({
    title: `${plan.companyName} - Official Investor Memorandum`,
    subject: plan.tagline || "Investor Business Plan & Operating Model",
    author: plan.founderNames || plan.companyName,
    keywords: [
      plan.sector,
      plan.locationRegion || "Venture",
      "5-Year Financial Model",
      "Investor Diligence",
      "Governance Organogram",
    ]
      .filter(Boolean)
      .join(", "),
    creator: "Investor Business Plan Studio - Meta-Data Manager",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // 8mm margin on sides, 8mm top & bottom
  const marginX = 8;
  const marginY = 8;
  const contentWidth = pdfWidth - marginX * 2;
  const contentHeight = pdfHeight - marginY * 2;

  // Slight pause to ensure DOM paint has settled
  await new Promise((resolve) => setTimeout(resolve, 60));

  if (onProgress) {
    onProgress({
      currentPage: 0,
      totalPages,
      percent: 10,
      message: "Synchronizing layout geometry, fonts, and chart vectors...",
      stage: "preparing",
      completedPages: [],
    });
  }

  const pageWeight = 80 / totalPages;

  for (let i = 0; i < totalPages; i++) {
    if (abortSignal?.aborted) {
      throw new DOMException("PDF export cancelled by user.", "AbortError");
    }

    const pageEl = pageElements[i];
    const pageTitle = pageEl.getAttribute("data-page-title") || `Page ${i + 1}`;
    const basePercent = 10 + i * pageWeight;

    if (onProgress) {
      onProgress({
        currentPage: i + 1,
        totalPages,
        percent: Math.min(92, Math.round(basePercent + pageWeight * 0.2)),
        message: `Capturing Page ${i + 1} of ${totalPages}: ${pageTitle}`,
        stage: "rendering",
        currentPageTitle: pageTitle,
        completedPages: [...completedPages],
      });
    }

    // Brief yield to allow UI update & progress repaint
    await new Promise((resolve) => setTimeout(resolve, 40));

    if (abortSignal?.aborted) {
      throw new DOMException("PDF export cancelled by user.", "AbortError");
    }

    // Capture the page element with 2x resolution for retina-grade PDF typography
    const canvas = await html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 1200,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        // Ensure light paper styling for official investor print
        clonedDoc.documentElement.classList.remove("dark");
        clonedDoc.body.classList.remove("dark");
        const darkElements = clonedDoc.querySelectorAll(".dark");
        darkElements.forEach((el) => el.classList.remove("dark"));

        // Strip all tooltip attributes so browser hover popups never appear in the capture
        const elementsWithTooltips = clonedDoc.querySelectorAll("[title], [data-tooltip], [aria-label*='tooltip' i]");
        elementsWithTooltips.forEach((el) => {
          el.removeAttribute("title");
          el.removeAttribute("data-tooltip");
        });

        // Automatically hide non-essential UI elements like tooltips, interactive buttons, comment triggers, and modals
        const nonEssentialSelectors = [
          "button:not(.pdf-keep)",
          ".pdf-exclude",
          ".print\\:hidden",
          "[data-pdf-exclude]",
          "[role='tooltip']",
          ".tooltip",
          "[data-tooltip]",
          "[data-radix-popper-content-wrapper]",
          "[data-floating-ui-portal]",
          ".comment-badge",
          ".comment-trigger",
          "aside",
          "[role='dialog']",
          ".dropdown-menu",
          "#review-comments-sidebar",
          "#kpi-dashboard-overlay",
        ];

        const elementsToHide = clonedDoc.querySelectorAll(nonEssentialSelectors.join(", "));
        elementsToHide.forEach((el) => {
          (el as HTMLElement).style.setProperty("display", "none", "important");
        });

        // Remove active focus rings, selection outlines, and temporary highlight tints
        const highlightedElements = clonedDoc.querySelectorAll(
          ".ring-2, .ring-indigo-500, .ring-emerald-500, .bg-indigo-50\\/20, .dark\\:bg-indigo-950\\/30"
        );
        highlightedElements.forEach((el) => {
          el.classList.remove("ring-2", "ring-indigo-500", "ring-emerald-500", "bg-indigo-50/20", "dark:bg-indigo-950/30");
        });

        // Strip cursor pointer styles and interactive hover tags
        clonedDoc.querySelectorAll(".cursor-pointer").forEach((el) => {
          (el as HTMLElement).style.cursor = "default";
        });

        // Ensure page container has clean white background and sharp borders
        const clonedPage = clonedDoc.getElementById(pageEl.id);
        if (clonedPage) {
          clonedPage.style.background = "#ffffff";
          clonedPage.style.color = "#0f172a";
          clonedPage.style.boxShadow = "none";
          clonedPage.style.borderRadius = "0";
          clonedPage.style.width = "100%";
        }
      },
    });

    if (abortSignal?.aborted) {
      throw new DOMException("PDF export cancelled by user.", "AbortError");
    }

    if (onProgress) {
      onProgress({
        currentPage: i + 1,
        totalPages,
        percent: Math.min(92, Math.round(basePercent + pageWeight * 0.75)),
        message: `Rasterizing charts & vector typography for Page ${i + 1}...`,
        stage: "compiling",
        currentPageTitle: pageTitle,
        completedPages: [...completedPages],
      });
    }

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    // Calculate dimensions to fit page while maintaining aspect ratio
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const aspectRatio = imgWidth / imgHeight;

    let renderWidth = contentWidth;
    let renderHeight = renderWidth / aspectRatio;

    // If height exceeds content area, scale down proportionally
    if (renderHeight > contentHeight) {
      renderHeight = contentHeight;
      renderWidth = renderHeight * aspectRatio;
    }

    // Center horizontally if scaled down
    const posX = marginX + (contentWidth - renderWidth) / 2;
    const posY = marginY;

    if (i > 0) {
      pdf.addPage(format, "portrait");
    }

    pdf.addImage(imgData, "JPEG", posX, posY, renderWidth, renderHeight, undefined, "FAST");

    completedPages.push(i + 1);

    if (onProgress) {
      onProgress({
        currentPage: i + 1,
        totalPages,
        percent: Math.min(92, Math.round(basePercent + pageWeight)),
        message: `Page ${i + 1} of ${totalPages} compiled successfully`,
        stage: "compiling",
        currentPageTitle: pageTitle,
        completedPages: [...completedPages],
      });
    }
  }

  // Finalizing Stage
  if (onProgress) {
    onProgress({
      currentPage: totalPages,
      totalPages,
      percent: 95,
      message: "Assembling multi-page investor memorandum stream...",
      stage: "finalizing",
      completedPages: [...completedPages],
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 80));

  // Generate safe filename: Company_Name_Investor_Business_Plan.pdf
  const sanitizedName = plan.companyName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = options.fileName || `${sanitizedName}_Investor_Business_Plan.pdf`;

  if (onProgress) {
    onProgress({
      currentPage: totalPages,
      totalPages,
      percent: 98,
      message: `Packaging & saving ${fileName}...`,
      stage: "finalizing",
      completedPages: [...completedPages],
      fileName,
    });
  }

  pdf.save(fileName);

  if (onProgress) {
    onProgress({
      currentPage: totalPages,
      totalPages,
      percent: 100,
      message: "PDF downloaded successfully!",
      stage: "completed",
      completedPages: [...completedPages],
      fileName,
    });
  }
}
