import React, { useState, useMemo } from "react";
import { BusinessPlan, PlanComment, CommentReply, OrganogramNode } from "../types";
import {
  MessageSquare,
  MessageSquareQuote,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  CornerDownRight,
  Send,
  Plus,
  Filter,
  Search,
  Check,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  User,
  DollarSign,
  Users,
  ShieldCheck,
  Tag,
  Share2,
  Sparkles,
} from "lucide-react";

interface ReviewCommentsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  plan: BusinessPlan;
  onUpdatePlan: (updatedPlan: BusinessPlan) => void;
  activeTargetFilter?: { targetType: string; targetId: string; targetLabel: string } | null;
  onClearActiveTargetFilter?: () => void;
  onNavigateToTarget?: (targetPage?: number, targetId?: string) => void;
}

// Default seeded comments if a plan has none
export const getDefaultCommentsForPlan = (plan: BusinessPlan): PlanComment[] => {
  const isApex = plan.id.includes("apex");
  const now = new Date();
  
  // Format current or earlier time stamps
  const formatTime = (hoursAgo: number, minutesAgo: number = 0) => {
    const d = new Date(now.getTime() - (hoursAgo * 60 + minutesAgo) * 60 * 1000);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const firstNode = plan.organogram?.[0];
  const openHireNode = plan.organogram?.find((n) => n.status === "Open/Hiring") || plan.organogram?.[1];

  return [
    {
      id: `comment-${plan.id}-1`,
      planId: plan.id,
      authorName: "Marcus Vance",
      authorRole: "Due Diligence Partner",
      authorAvatar: "MV",
      targetType: "financial_section",
      targetId: "sec-unit-econ",
      targetLabel: "CAC & LTV Unit Economics",
      targetPage: 2,
      content: `LTV/CAC multiple of ${plan.financials.investorMetrics.ltvCacRatio}x is well above our 3.0x fund threshold. Please confirm whether the $${plan.financials.investorMetrics.cac} blended CAC includes agronomy pilot calibration costs or purely digital outbound.`,
      createdAt: formatTime(3, 20),
      status: "open",
      category: "financial",
      replies: [
        {
          id: `reply-${plan.id}-1-1`,
          authorName: "Sarah Jenkins",
          authorRole: "Financial Analyst",
          content: "Audit verified: CAC incorporates both direct hardware field trial demos ($380) and enterprise SDR outreach ($240).",
          createdAt: formatTime(1, 45),
        },
      ],
    },
    {
      id: `comment-${plan.id}-2`,
      planId: plan.id,
      authorName: "Elena Rostova",
      authorRole: "Investment Committee Lead",
      authorAvatar: "ER",
      targetType: "organogram_node",
      targetId: openHireNode?.id || "org-open",
      targetLabel: openHireNode ? `${openHireNode.name} (${openHireNode.title})` : "Key Executive Leadership",
      targetPage: 3,
      content: `The candidate profile for ${openHireNode?.title || "Key Leadership"} must be locked before closing the Preferred Seed round to mitigate commercial ramp risk.`,
      createdAt: formatTime(5, 10),
      status: "open",
      category: "governance",
    },
    {
      id: `comment-${plan.id}-3`,
      planId: plan.id,
      authorName: "David K. Chen",
      authorRole: "Managing Auditor",
      authorAvatar: "DC",
      targetType: "financial_section",
      targetId: "sec-breakeven",
      targetLabel: "Monthly Burn & Break-Even Horizon",
      targetPage: 5,
      content: `Verified: Net monthly burn rate of $${(plan.financials.breakEven.monthlyBurn / 1000).toFixed(0)}K/mo aligns with the ${plan.financials.investorMetrics.runwayMonths}-month runway buffer against the target capital raise.`,
      createdAt: formatTime(8, 0),
      status: "resolved",
      category: "audit",
      replies: [
        {
          id: `reply-${plan.id}-3-1`,
          authorName: "Marcus Vance",
          authorRole: "Due Diligence Partner",
          content: "Signed off during morning investment committee session.",
          createdAt: formatTime(6, 30),
        },
      ],
    },
  ];
};

export const ReviewCommentsSidebar: React.FC<ReviewCommentsSidebarProps> = ({
  isOpen,
  onClose,
  plan,
  onUpdatePlan,
  activeTargetFilter,
  onClearActiveTargetFilter,
  onNavigateToTarget,
}) => {
  // Ensure comments exist
  const comments: PlanComment[] = useMemo(() => {
    if (plan.comments && plan.comments.length > 0) {
      return plan.comments;
    }
    return getDefaultCommentsForPlan(plan);
  }, [plan]);

  // Form State
  const [isComposerOpen, setIsComposerOpen] = useState(true);
  const [authorName, setAuthorName] = useState("Lead Reviewer");
  const [authorRole, setAuthorRole] = useState("Due Diligence Partner");
  const [targetType, setTargetType] = useState<"financial_section" | "organogram_node" | "general">("financial_section");
  const [selectedTargetKey, setSelectedTargetKey] = useState("sec-revenue");
  const [category, setCategory] = useState<"audit" | "financial" | "governance" | "question">("financial");
  const [commentText, setCommentText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"all" | "financial" | "organogram" | "open" | "resolved">("all");

  // Pre-defined financial sections with target IDs and pages
  const financialSections = [
    { id: "sec-revenue", label: "Revenue Monetization Streams", page: 2 },
    { id: "sec-unit-econ", label: "CAC, LTV & Unit Economics", page: 2 },
    { id: "sec-pnl", label: "5-Year Income Statement & P&L", page: 4 },
    { id: "sec-cogs", label: "COGS & Operational Expenses", page: 4 },
    { id: "sec-ebitda", label: "EBITDA & Operating Margins", page: 4 },
    { id: "sec-cashflow", label: "Cash Flow & Capital Expenditures", page: 5 },
    { id: "sec-breakeven", label: "Monthly Burn & Break-Even Horizon", page: 5 },
    { id: "sec-offering", label: "Offering Structure & Pre-Money Valuation", page: 5 },
  ];

  // Helper to get current timestamp formatted
  const getFormattedCurrentTime = () => {
    const d = new Date();
    return (
      d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) +
      " at " +
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    );
  };

  // Sync composer target when an activeTargetFilter is passed
  React.useEffect(() => {
    if (activeTargetFilter) {
      if (activeTargetFilter.targetType === "organogram_node") {
        setTargetType("organogram_node");
        setSelectedTargetKey(activeTargetFilter.targetId);
      } else if (activeTargetFilter.targetType === "financial_section") {
        setTargetType("financial_section");
        setSelectedTargetKey(activeTargetFilter.targetId);
      }
      setIsComposerOpen(true);
    }
  }, [activeTargetFilter]);

  // Handle adding a new time-stamped comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    let targetLabel = "General Feedback";
    let targetPage = 1;

    if (targetType === "financial_section") {
      const match = financialSections.find((s) => s.id === selectedTargetKey);
      targetLabel = match ? match.label : selectedTargetKey;
      targetPage = match ? match.page : 2;
    } else if (targetType === "organogram_node") {
      const node = plan.organogram?.find((n) => n.id === selectedTargetKey);
      targetLabel = node ? `${node.name} (${node.title})` : "Organogram Node";
      targetPage = 3;
    }

    const initials = authorName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "RV";

    const newComment: PlanComment = {
      id: `comment-${Date.now()}`,
      planId: plan.id,
      authorName: authorName.trim() || "Institutional Reviewer",
      authorRole: authorRole,
      authorAvatar: initials,
      targetType: targetType,
      targetId: selectedTargetKey,
      targetLabel: targetLabel,
      targetPage: targetPage,
      content: commentText.trim(),
      createdAt: getFormattedCurrentTime(),
      status: "open",
      category: category,
      replies: [],
    };

    const updatedComments = [newComment, ...comments];
    onUpdatePlan({
      ...plan,
      comments: updatedComments,
    });

    setCommentText("");
  };

  // Handle adding a reply
  const handleAddReply = (commentId: string) => {
    if (!replyText.trim()) return;

    const initials = authorName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "RV";

    const newReply: CommentReply = {
      id: `reply-${Date.now()}`,
      authorName: authorName.trim() || "Institutional Reviewer",
      authorRole: authorRole,
      authorAvatar: initials,
      content: replyText.trim(),
      createdAt: getFormattedCurrentTime(),
    };

    const updatedComments = comments.map((c) => {
      if (c.id === commentId) {
        return {
          ...c,
          replies: [...(c.replies || []), newReply],
        };
      }
      return c;
    });

    onUpdatePlan({
      ...plan,
      comments: updatedComments,
    });

    setReplyingToId(null);
    setReplyText("");
  };

  // Toggle comment status (Open vs Resolved)
  const handleToggleStatus = (commentId: string) => {
    const updatedComments = comments.map((c) => {
      if (c.id === commentId) {
        return {
          ...c,
          status: (c.status === "open" ? "resolved" : "open") as "open" | "resolved",
        };
      }
      return c;
    });

    onUpdatePlan({
      ...plan,
      comments: updatedComments,
    });
  };

  // Delete comment
  const handleDeleteComment = (commentId: string) => {
    const updatedComments = comments.filter((c) => c.id !== commentId);
    onUpdatePlan({
      ...plan,
      comments: updatedComments,
    });
  };

  // Filtered comments
  const filteredComments = useMemo(() => {
    return comments.filter((item) => {
      // Active target filter override
      if (activeTargetFilter) {
        if (item.targetId !== activeTargetFilter.targetId) return false;
      }

      // Scope filter
      if (scopeFilter === "financial" && item.targetType !== "financial_section") return false;
      if (scopeFilter === "organogram" && item.targetType !== "organogram_node") return false;
      if (scopeFilter === "open" && item.status !== "open") return false;
      if (scopeFilter === "resolved" && item.status !== "resolved") return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesContent = item.content.toLowerCase().includes(q);
        const matchesAuthor = item.authorName.toLowerCase().includes(q);
        const matchesTarget = item.targetLabel.toLowerCase().includes(q);
        const matchesReplies = item.replies?.some((r) => r.content.toLowerCase().includes(q) || r.authorName.toLowerCase().includes(q));
        if (!matchesContent && !matchesAuthor && !matchesTarget && !matchesReplies) return false;
      }

      return true;
    });
  }, [comments, scopeFilter, searchQuery, activeTargetFilter]);

  const openCount = comments.filter((c) => c.status === "open").length;
  const resolvedCount = comments.filter((c) => c.status === "resolved").length;

  if (!isOpen) return null;

  return (
    <aside
      id="review-comments-sidebar"
      className="fixed inset-y-0 right-0 z-40 w-full sm:w-[460px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right"
      style={{ top: "49px" }}
    >
      {/* Top Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <MessageSquareQuote className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Review & Comments</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {comments.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Institutional due-diligence feedback & section audits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsComposerOpen(!isComposerOpen)}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isComposerOpen ? "Minimize composer" : "Add new feedback"}
          >
            <Plus className={`w-4 h-4 transition-transform ${isComposerOpen ? "rotate-45" : ""}`} />
          </button>
          <button
            id="btn-close-comments-sidebar"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close sidebar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Target Active Filter Callout Banner (if user clicked from document) */}
      {activeTargetFilter && (
        <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 border-b border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
          <div className="flex items-center gap-1.5 truncate">
            <Filter className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="text-[11px] font-medium text-slate-500">Filtered:</span>
            <span className="font-bold truncate text-[11px]">{activeTargetFilter.targetLabel}</span>
          </div>
          {onClearActiveTargetFilter && (
            <button
              onClick={onClearActiveTargetFilter}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 underline ml-2 shrink-0 cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>
      )}

      {/* Scope Filtering & Search Controls */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search feedback or reviewer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
          <button
            onClick={() => setScopeFilter("all")}
            className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              scopeFilter === "all"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            All ({comments.length})
          </button>
          <button
            onClick={() => setScopeFilter("financial")}
            className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer ${
              scopeFilter === "financial"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <DollarSign className="w-3 h-3" />
            Financials
          </button>
          <button
            onClick={() => setScopeFilter("organogram")}
            className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer ${
              scopeFilter === "organogram"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <Users className="w-3 h-3" />
            Organogram
          </button>
          <button
            onClick={() => setScopeFilter("open")}
            className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              scopeFilter === "open"
                ? "bg-amber-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            Open ({openCount})
          </button>
          <button
            onClick={() => setScopeFilter("resolved")}
            className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              scopeFilter === "resolved"
                ? "bg-slate-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* COMPOSER FORM */}
        {isComposerOpen && (
          <form
            onSubmit={handleAddComment}
            className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-xs animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                Leave Time-Stamped Feedback
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {/* Target Type Selector */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setTargetType("financial_section");
                  setSelectedTargetKey("sec-revenue");
                }}
                className={`py-1.5 px-2 rounded-lg font-medium border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  targetType === "financial_section"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-bold"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                <DollarSign className="w-3 h-3 text-emerald-600" />
                Financial Section
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetType("organogram_node");
                  setSelectedTargetKey(plan.organogram?.[0]?.id || "org-1");
                }}
                className={`py-1.5 px-2 rounded-lg font-medium border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  targetType === "organogram_node"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200 font-bold"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                <Users className="w-3 h-3 text-indigo-600" />
                Organogram Node
              </button>
            </div>

            {/* Target Specific Dropdown */}
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                Specific Section or Team Role
              </label>
              {targetType === "financial_section" ? (
                <select
                  value={selectedTargetKey}
                  onChange={(e) => setSelectedTargetKey(e.target.value)}
                  className="w-full text-xs py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  {financialSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.label} (Page {sec.page})
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedTargetKey}
                  onChange={(e) => setSelectedTargetKey(e.target.value)}
                  className="w-full text-xs py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  {plan.organogram?.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.name} — {node.title} ({node.status})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Author details */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                  Reviewer Name
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full text-xs py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                  Institutional Role
                </label>
                <select
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value)}
                  className="w-full text-xs py-1.5 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="Due Diligence Partner">Due Diligence Partner</option>
                  <option value="Lead Investment Director">Lead Investment Director</option>
                  <option value="Financial Analyst">Financial Analyst</option>
                  <option value="Managing Auditor">Managing Auditor</option>
                  <option value="Governance Committee">Governance Committee</option>
                </select>
              </div>
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                Feedback Classification
              </label>
              <div className="flex items-center gap-1.5 text-[11px]">
                {(["financial", "governance", "audit", "question"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-2 py-0.5 rounded capitalize font-medium border transition-colors cursor-pointer ${
                      category === cat
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent font-bold"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Body */}
            <div>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Enter detailed audit observation, benchmark check, or governance inquiry..."
                rows={3}
                className="w-full text-xs p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Submit button */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Clock className="w-3 h-3" />
                <span>Timestamped automatically</span>
              </div>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Post Feedback</span>
              </button>
            </div>
          </form>
        )}

        {/* FEEDBACK LIST */}
        <div className="space-y-3">
          {filteredComments.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No comments found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {searchQuery || activeTargetFilter
                  ? "Try clearing your search query or target filter."
                  : "Be the first to post feedback on this venture's financials or leadership."}
              </p>
            </div>
          ) : (
            filteredComments.map((comment) => {
              const isResolved = comment.status === "resolved";
              const isFinancial = comment.targetType === "financial_section";

              return (
                <div
                  key={comment.id}
                  id={`comment-card-${comment.id}`}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isResolved
                      ? "bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-85"
                      : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-xs"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-600">
                        {comment.authorAvatar || "RV"}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {comment.authorName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            • {comment.authorRole}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{comment.createdAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Toggle Button */}
                    <button
                      onClick={() => handleToggleStatus(comment.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 cursor-pointer transition-colors ${
                        isResolved
                          ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                      }`}
                      title="Click to toggle Open / Resolved"
                    >
                      {isResolved ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Resolved</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span>Open</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Target Reference Tag (Clickable to navigate to section) */}
                  <div className="mt-2.5 mb-2">
                    <button
                      onClick={() => {
                        if (onNavigateToTarget) {
                          onNavigateToTarget(comment.targetPage, comment.targetId);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors group cursor-pointer max-w-full"
                      title="Click to jump and highlight this section in the Document Studio"
                    >
                      {isFinancial ? (
                        <DollarSign className="w-3 h-3 text-emerald-600 shrink-0" />
                      ) : (
                        <Users className="w-3 h-3 text-indigo-600 shrink-0" />
                      )}
                      <span className="truncate font-semibold">{comment.targetLabel}</span>
                      {comment.targetPage && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          (Page {comment.targetPage})
                        </span>
                      )}
                      <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 shrink-0 ml-0.5" />
                    </button>
                  </div>

                  {/* Comment Body */}
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {comment.content}
                  </p>

                  {/* Threaded Replies List */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 pl-3 border-l-2 border-slate-200 dark:border-slate-700 space-y-2">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {reply.authorName} ({reply.authorRole})
                            </span>
                            <span className="text-[9px] font-mono">{reply.createdAt}</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Composer Form */}
                  {replyingToId === comment.id && (
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Write a response..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddReply(comment.id);
                          }
                        }}
                        className="flex-1 text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                      <button
                        onClick={() => handleAddReply(comment.id)}
                        className="px-2 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
                      >
                        Reply
                      </button>
                      <button
                        onClick={() => {
                          setReplyingToId(null);
                          setReplyText("");
                        }}
                        className="text-xs text-slate-400 hover:text-slate-600 px-1"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                    <button
                      onClick={() => {
                        setReplyingToId(replyingToId === comment.id ? null : comment.id);
                        setReplyText("");
                      }}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <CornerDownRight className="w-3 h-3" />
                      <span>Reply</span>
                    </button>

                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      title="Delete comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Feedback persistent to venture file</span>
        </div>
        <button
          onClick={onClose}
          className="font-semibold text-slate-700 dark:text-slate-300 hover:underline cursor-pointer"
        >
          Close Sidebar
        </button>
      </div>
    </aside>
  );
};
