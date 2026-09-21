import html2canvas from "html2canvas";

export interface ImageExportOptions {
  fileName?: string;
  backgroundColor?: string;
  scale?: number;
  onStart?: () => void;
  onFinish?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Captures an HTML element (such as the visual organogram tree)
 * and triggers a crisp PNG download formatted for investor decks and diligence binders.
 */
export async function exportElementAsPng(
  element: HTMLElement,
  options: ImageExportOptions = {}
): Promise<void> {
  const {
    fileName = "Organogram_Structure.png",
    backgroundColor = "#ffffff",
    scale = 2.5,
    onStart,
    onFinish,
    onError,
  } = options;

  try {
    if (onStart) onStart();

    // Small delay to allow any pending layout adjustments or fonts
    await new Promise((resolve) => setTimeout(resolve, 80));

    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor,
      allowTaint: true,
      ignoreElements: (el) => {
        return (
          el.classList.contains("pdf-exclude") ||
          el.classList.contains("print:hidden") ||
          el.getAttribute("data-ignore-export") === "true"
        );
      },
      onclone: (clonedDoc) => {
        // Find cloned element and make sure overflow is visible to capture full tree
        const clonedEl = clonedDoc.getElementById(element.id);
        if (clonedEl) {
          clonedEl.style.overflow = "visible";
          clonedEl.style.maxHeight = "none";
          clonedEl.style.maxWidth = "none";
        }
      },
    });

    // Create download link
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = fileName;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onFinish) onFinish();
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    if (onError) {
      onError(error);
    } else {
      console.error("Export as Image failed:", error);
    }
    throw error;
  }
}
