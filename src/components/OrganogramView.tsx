import React, { useState } from "react";
import { OrganogramNode } from "../types";
import {
  UserPlus,
  Users,
  Edit2,
  Shield,
  Briefcase,
  Layers,
  Sparkles,
  ChevronDown,
  UserCheck,
  Image as ImageIcon,
  Loader2,
  Check,
  MessageSquare,
} from "lucide-react";
import { OrganogramEditModal } from "./OrganogramEditModal";
import { exportElementAsPng } from "../utils/imageExporter";
import { addExportRecord } from "../utils/exportHistoryStore";

interface OrganogramViewProps {
  organogram: OrganogramNode[];
  onUpdateOrganogram: (nodes: OrganogramNode[]) => void;
  isEditable?: boolean;
  companyName?: string;
  planId?: string;
  planName?: string;
  onCommentOnNode?: (node: OrganogramNode) => void;
  nodeCommentCounts?: Record<string, number>;
}

export const OrganogramView: React.FC<OrganogramViewProps> = ({
  organogram,
  onUpdateOrganogram,
  isEditable = true,
  companyName = "Company",
  planId,
  planName,
  onCommentOnNode,
  nodeCommentCounts,
}) => {
  const [selectedNode, setSelectedNode] = useState<OrganogramNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewNode, setIsNewNode] = useState(false);
  const [filterDept, setFilterDept] = useState<string>("All");
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const openRolesCount = organogram.filter((n) => n.status === "Open/Hiring").length;

  const handleEditNode = (node: OrganogramNode) => {
    if (!isEditable) return;
    setSelectedNode(node);
    setIsNewNode(false);
    setIsModalOpen(true);
  };

  const handleAddNewNode = () => {
    setSelectedNode(null);
    setIsNewNode(true);
    setIsModalOpen(true);
  };

  const handleSaveNode = (savedNode: OrganogramNode) => {
    if (isNewNode) {
      onUpdateOrganogram([...organogram, savedNode]);
    } else {
      onUpdateOrganogram(
        organogram.map((n) => (n.id === savedNode.id ? savedNode : n))
      );
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    // Re-parent children to null or parent of deleted node
    const deletedNode = organogram.find((n) => n.id === nodeId);
    const parentId = deletedNode?.reportsToId || null;
    const updated = organogram
      .filter((n) => n.id !== nodeId)
      .map((n) => (n.reportsToId === nodeId ? { ...n, reportsToId: parentId } : n));
    onUpdateOrganogram(updated);
  };

  const handleQuickFillOpenRoles = () => {
    const filled = organogram.map((n) => {
      if (n.status === "Open/Hiring") {
        return {
          ...n,
          status: "Filled" as const,
          name: n.name.startsWith("Open") ? `Candidate ${n.title.split(" ")[0]}` : n.name,
          email: `${n.title.toLowerCase().replace(/[^a-z]/g, "")}@company.com`,
          bio: "Vetted executive with 10+ years industry leadership and regulatory track record.",
        };
      }
      return n;
    });
    onUpdateOrganogram(filled);
  };

  const handleExportAsImage = async () => {
    const canvasElement = document.getElementById("organogram-visual-canvas");
    if (!canvasElement) return;

    setIsExportingImage(true);
    setExportSuccess(false);

    try {
      const sanitized = companyName.replace(/[^a-zA-Z0-9_-]/g, "_");
      const fileName = `${sanitized}_Organogram_Structure.png`;
      await exportElementAsPng(canvasElement, {
        fileName,
        scale: 2.5,
        backgroundColor: "#ffffff",
      });
      addExportRecord({
        planId: planId || "plan-active",
        planName: planName || companyName,
        companyName,
        fileName,
        format: "image",
        fileSizeFormatted: "820 KB",
        scope: "Governance Organogram Canvas",
        status: "success",
        triggeredBy: "Organogram Inline Action",
        notes: "Exported directly from Governance & Organogram interactive tab",
      });
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to export organogram image:", err);
      alert("Failed to export organogram as image. Please try again.");
    } finally {
      setIsExportingImage(false);
    }
  };

  // Group nodes by hierarchy levels
  const rootNodes = organogram.filter((n) => !n.reportsToId);
  const directReportsMap = new Map<string, OrganogramNode[]>();

  organogram.forEach((node) => {
    if (node.reportsToId) {
      const list = directReportsMap.get(node.reportsToId) || [];
      list.push(node);
      directReportsMap.set(node.reportsToId, list);
    }
  });

  const getDepartmentBadgeStyle = (dept: string) => {
    switch (dept) {
      case "Executive":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "Technology":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
      case "Finance & Legal":
        return "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700";
      case "Operations":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      case "Growth & Sales":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "Product & Clinical":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    }
  };

  const renderNodeCard = (node: OrganogramNode, isRoot = false) => {
    const isOpen = node.status === "Open/Hiring";
    const directReports = directReportsMap.get(node.id) || [];

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* The Card */}
        <div
          id={`org-node-${node.id}`}
          onClick={() => handleEditNode(node)}
          className={`group relative w-64 sm:w-72 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${
            isOpen
              ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-700/60 hover:border-amber-400"
              : isRoot
              ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/70 hover:border-emerald-400"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          {/* Top Bar: Dept + Equity + Status + Feedback Trigger */}
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getDepartmentBadgeStyle(
                node.department
              )}`}
            >
              {node.department}
            </span>

            <div className="flex items-center gap-1.5">
              {node.isKeyHire && (
                <span
                  title="Key Executive Position"
                  className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
                >
                  <Shield className="w-2.5 h-2.5" /> Key
                </span>
              )}
              {node.equityPercent !== undefined && node.equityPercent > 0 && (
                <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400">
                  {node.equityPercent}% Eq.
                </span>
              )}
              {onCommentOnNode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCommentOnNode(node);
                  }}
                  className="pdf-exclude print:hidden p-1 rounded-md bg-slate-100 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-indigo-950 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors relative cursor-pointer"
                  title={`Leave review feedback for ${node.name} (${node.title})`}
                >
                  <MessageSquare className="w-3 h-3" />
                  {nodeCommentCounts && (nodeCommentCounts[node.id] || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center leading-none">
                      {nodeCommentCounts[node.id]}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Name & Title */}
          <div className="flex items-start gap-2.5">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-transform group-hover:scale-105 ${
                isOpen
                  ? "bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200"
                  : isRoot
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
              }`}
            >
              {node.avatarInitials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {node.name}
                </h4>
                {isEditable && (
                  <span className="pdf-exclude print:hidden opacity-0 group-hover:opacity-100 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5 transition-opacity">
                    <Edit2 className="w-2.5 h-2.5" /> Edit
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-tight truncate">
                {node.title}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-500 truncate mt-0.5">
                {node.email || "No email assigned"}
              </p>
            </div>
          </div>

          {/* Status Flag */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
            <span
              className={`font-semibold flex items-center gap-1 ${
                isOpen ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOpen ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                }`}
              />
              {isOpen ? "Position Open (Recruiting)" : "Filled & Operational"}
            </span>

            {directReports.length > 0 && (
              <span className="text-slate-500 dark:text-slate-500 flex items-center gap-0.5">
                <Users className="w-3 h-3" /> {directReports.length} reports
              </span>
            )}
          </div>
        </div>

        {/* Tree Connectors & Direct Reports */}
        {directReports.length > 0 && (
          <div className="flex flex-col items-center w-full mt-3">
            {/* Vertical connector down */}
            <div className="w-px h-5 bg-slate-300 dark:bg-slate-700" />

            {/* Horizontal branch line if multiple reports */}
            {directReports.length > 1 && (
              <div
                className="h-px bg-slate-300 dark:bg-slate-700 mb-5 relative"
                style={{
                  width: `${Math.min(90, (directReports.length - 1) * 35)}%`,
                }}
              />
            )}

            {/* Direct reports row */}
            <div className="flex flex-wrap items-start justify-center gap-4 sm:gap-6 w-full">
              {directReports.map((report) => renderNodeCard(report, false))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Organogram Header & System Fill Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              System-Fillable Governance & Executive Organogram
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive organizational structure for venture capital & investor diligence ({organogram.length} total positions, {openRolesCount} open)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap pdf-exclude print:hidden">
          {/* Export as Image Button */}
          <button
            id="btn-export-organogram-img"
            onClick={handleExportAsImage}
            disabled={isExportingImage}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Export organogram hierarchy as crisp high-resolution PNG image for pitch decks"
          >
            {isExportingImage ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
            ) : exportSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <span>
              {isExportingImage
                ? "Exporting PNG..."
                : exportSuccess
                ? "Saved as PNG!"
                : "Export as Image"}
            </span>
          </button>

          {isEditable && openRolesCount > 0 && (
            <button
              onClick={handleQuickFillOpenRoles}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 rounded-lg border border-amber-300 dark:border-amber-800 transition-colors shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Fill Open Roles ({openRolesCount})
            </button>
          )}

          {isEditable && (
            <button
              onClick={handleAddNewNode}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Position
            </button>
          )}
        </div>
      </div>

      {/* Visual Organogram Canvas */}
      <div
        id="organogram-visual-canvas"
        className="w-full overflow-x-auto pb-8 pt-6 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-6 min-h-[420px] flex justify-center"
      >
        <div className="inline-flex flex-col items-center min-w-fit">
          {/* Subtle branding banner included in exported image */}
          <div className="mb-5 text-center pb-3 border-b border-slate-100 dark:border-slate-800/80 w-full">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {companyName} • Executive & Governance Structure
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Investor Diligence Hierarchy • {organogram.length} Assigned Positions
            </p>
          </div>
          {rootNodes.map((root) => renderNodeCard(root, true))}
        </div>
      </div>

      {/* Fillable Organogram Modal */}
      <OrganogramEditModal
        isOpen={isModalOpen}
        node={selectedNode}
        existingNodes={organogram}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNode}
        onDelete={handleDeleteNode}
        isNew={isNewNode}
      />
    </div>
  );
};
