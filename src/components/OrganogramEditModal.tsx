import React, { useState, useEffect } from "react";
import { OrganogramNode } from "../types";
import { X, Check, Trash2, UserPlus, Shield } from "lucide-react";

interface OrganogramEditModalProps {
  isOpen: boolean;
  node: OrganogramNode | null;
  existingNodes: OrganogramNode[];
  onClose: () => void;
  onSave: (node: OrganogramNode) => void;
  onDelete?: (nodeId: string) => void;
  isNew?: boolean;
}

export const OrganogramEditModal: React.FC<OrganogramEditModalProps> = ({
  isOpen,
  node,
  existingNodes,
  onClose,
  onSave,
  onDelete,
  isNew = false,
}) => {
  const [formData, setFormData] = useState<OrganogramNode>({
    id: `org-${Date.now()}`,
    name: "",
    title: "",
    department: "Executive",
    reportsToId: null,
    status: "Filled",
    email: "",
    bio: "",
    equityPercent: 1.0,
    isKeyHire: false,
    avatarInitials: "JD",
    colorScheme: "emerald",
  });

  useEffect(() => {
    if (node) {
      setFormData({ ...node });
    } else if (isNew) {
      setFormData({
        id: `org-${Date.now()}`,
        name: "",
        title: "",
        department: "Technology",
        reportsToId: existingNodes[0]?.id || null,
        status: "Filled",
        email: "",
        bio: "",
        equityPercent: 1.5,
        isKeyHire: true,
        avatarInitials: "NN",
        colorScheme: "indigo",
      });
    }
  }, [node, isNew, existingNodes]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.title.trim()) return;

    // Calculate avatar initials
    const parts = formData.name.trim().split(" ");
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : formData.name.substring(0, 2).toUpperCase();

    onSave({
      ...formData,
      avatarInitials: initials || "EX",
    });
    onClose();
  };

  const departments: OrganogramNode["department"][] = [
    "Executive",
    "Technology",
    "Finance & Legal",
    "Operations",
    "Growth & Sales",
    "Product & Clinical",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
              {isNew ? <UserPlus className="w-4 h-4" /> : formData.avatarInitials}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                {isNew ? "Add New Position to Organogram" : "Edit Organogram Role"}
              </h3>
              <p className="text-xs text-slate-500">
                System-fillable executive structure for investor review
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name / Placeholder *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Jane Doe, Ph.D."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Executive Title / Role *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Chief Operating Officer"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value as any })}
                className="w-full px-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reports Directly To
              </label>
              <select
                value={formData.reportsToId || ""}
                onChange={(e) => setFormData({ ...formData, reportsToId: e.target.value || null })}
                className="w-full px-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">None (Top Level / Board / CEO)</option>
                {existingNodes
                  .filter((n) => n.id !== formData.id)
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.title})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Position Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Filled">Filled (Active)</option>
                <option value="Open/Hiring">Open / Hiring</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Equity Allocation (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.equityPercent ?? 0}
                onChange={(e) => setFormData({ ...formData, equityPercent: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Key Hire Flag
              </label>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isKeyHire || false}
                  onChange={(e) => setFormData({ ...formData, isKeyHire: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-amber-500" /> Key Executive
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Work Email / Contact
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Executive Bio & Background
            </label>
            <textarea
              rows={2}
              placeholder="Key accomplishments, previous companies, or qualification highlights..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            {!isNew && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Remove ${formData.title} from organogram?`)) {
                    onDelete(formData.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Role
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                {isNew ? "Add to Organogram" : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
