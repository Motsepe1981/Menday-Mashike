import React, { useState } from "react";
import { FinancialData } from "../types";
import { TrendingUp, BarChart3, PieChart, ShieldAlert, DollarSign } from "lucide-react";

interface CompactFinancialGraphsProps {
  financials: FinancialData;
  scale?: "compact" | "medium" | "expanded";
  accentColor?: string;
  className?: string;
}

export const CompactFinancialGraphs: React.FC<CompactFinancialGraphsProps> = ({
  financials,
  scale = "compact",
  className = "",
}) => {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  const years = financials.years || ["Y1", "Y2", "Y3", "Y4", "Y5"];
  const rev = financials.totalRevenue || [0, 0, 0, 0, 0];
  const ebitda = financials.ebitda || [0, 0, 0, 0, 0];
  const grossMargin = financials.grossMarginPercent || [0, 0, 0, 0, 0];
  const netMargin = financials.netMarginPercent || [0, 0, 0, 0, 0];
  const cashBal = financials.cashFlow?.endingCashBalance || [0, 0, 0, 0, 0];

  const maxRev = Math.max(...rev, 1);
  const minEbitda = Math.min(...ebitda, 0);
  const maxEbitda = Math.max(...ebitda, 1);
  const maxCash = Math.max(...cashBal, 1);

  // Height configurations based on scale (compact uses minimal height to prevent wasting document space)
  const chartHeight = scale === "compact" ? 95 : scale === "medium" ? 120 : 160;

  const formatCurrency = (val: number) => {
    if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  const hasMissingCash = cashBal.every((v) => v === 0) || cashBal.slice(2).some((v) => v === 0);

  return (
    <div className={`w-full ${className}`}>
      {/* 4-Item Compact Bento Grid that fits side-by-side with document text */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Graph 1: Revenue & EBITDA Growth */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Revenue & EBITDA</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              {hoveredYear !== null ? `${years[hoveredYear]}: ${formatCurrency(rev[hoveredYear])}` : `Y5: ${formatCurrency(rev[rev.length - 1])}`}
            </span>
          </div>

          {/* SVG Micro-Chart */}
          <div className="relative w-full" style={{ height: `${chartHeight}px` }}>
            <svg className="w-full h-full overflow-visible" viewBox="0 0 200 90" preserveAspectRatio="none">
              <line x1="0" y1="75" x2="200" y2="75" stroke="#cbd5e1" strokeDasharray="2 2" strokeWidth="0.8" />
              {rev.map((val, idx) => {
                const barWidth = 18;
                const spacing = (200 - barWidth * rev.length) / (rev.length + 1);
                const x = spacing + idx * (barWidth + spacing);
                const h = Math.max(4, (val / maxRev) * 65);
                const y = 75 - h;

                // EBITDA circle marker
                const ebVal = ebitda[idx] || 0;
                const ebNorm = ebVal >= 0 ? 75 - (ebVal / (maxEbitda || 1)) * 45 : 75 + Math.min(12, (Math.abs(ebVal) / (Math.abs(minEbitda) || 1)) * 12);

                const isHovered = hoveredYear === idx;

                return (
                  <g key={`rev-bar-${idx}`} onMouseEnter={() => setHoveredYear(idx)} onMouseLeave={() => setHoveredYear(null)} className="cursor-pointer">
                    {/* Revenue Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={h}
                      rx="2"
                      fill={isHovered ? "#059669" : "#10b981"}
                      opacity={isHovered ? 1 : 0.85}
                      className="transition-all duration-150"
                    />
                    {/* EBITDA Point */}
                    <circle cx={x + barWidth / 2} cy={ebNorm} r={isHovered ? "3.5" : "2.5"} fill="#0284c7" stroke="#ffffff" strokeWidth="1" />
                    {/* Year Label */}
                    <text x={x + barWidth / 2} y="88" textAnchor="middle" fontSize="7" fill="#64748b" className="font-mono">
                      {`Y${idx + 1}`}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-sm bg-emerald-500 inline-block"></span> Rev
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-600 inline-block"></span> EBITDA
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {financials.ebitdaMarginPercent?.[financials.ebitdaMarginPercent.length - 1] || 0}% Y5
            </span>
          </div>
        </div>

        {/* Graph 2: Margin Progression (% Gross vs Net) */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Margin Expansion</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Gross: {grossMargin[grossMargin.length - 1]}%
            </span>
          </div>

          <div className="relative w-full" style={{ height: `${chartHeight}px` }}>
            <svg className="w-full h-full overflow-visible" viewBox="0 0 200 90" preserveAspectRatio="none">
              <line x1="0" y1="75" x2="200" y2="75" stroke="#cbd5e1" strokeDasharray="2 2" strokeWidth="0.8" />
              <line x1="0" y1="20" x2="200" y2="20" stroke="#f1f5f9" strokeWidth="0.5" />

              {/* Area path for gross margin */}
              {(() => {
                const points = grossMargin.map((m, idx) => {
                  const x = 15 + idx * 42;
                  const clamped = Math.max(0, Math.min(100, m));
                  const y = 75 - (clamped / 100) * 55;
                  return `${x},${y}`;
                });
                const pathStr = `M 15,75 L ${points.join(" L ")} L 183,75 Z`;
                return (
                  <>
                    <path d={pathStr} fill="rgba(99, 102, 241, 0.15)" />
                    <polyline points={points.join(" ")} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
                  </>
                );
              })()}

              {/* Net margin dashed line */}
              {(() => {
                const netPoints = netMargin.map((nm, idx) => {
                  const x = 15 + idx * 42;
                  const y = nm >= 0 ? 75 - (Math.min(60, nm) / 60) * 40 : 75 + Math.min(12, (Math.abs(nm) / 80) * 12);
                  return `${x},${y}`;
                });
                return <polyline points={netPoints.join(" ")} fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="3 2" />;
              })()}

              {/* Marker nodes */}
              {grossMargin.map((m, idx) => {
                const x = 15 + idx * 42;
                const y = 75 - (Math.max(0, Math.min(100, m)) / 100) * 55;
                return (
                  <g key={`gm-pt-${idx}`}>
                    <circle cx={x} cy={y} r="2.5" fill="#4f46e5" stroke="#ffffff" strokeWidth="1" />
                    <text x={x} y="88" textAnchor="middle" fontSize="7" fill="#64748b" className="font-mono">
                      {`Y${idx + 1}`}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"></span> Gross Mgn
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block"></span> Net Mgn
            </span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              +{Math.max(0, (grossMargin[grossMargin.length - 1] || 0) - (grossMargin[0] || 0))}% Exp.
            </span>
          </div>
        </div>

        {/* Graph 3: Cash Runway & Ending Cash Reserves */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Ending Cash Balance</span>
            </div>
            {hasMissingCash ? (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-600 bg-amber-100/70 dark:bg-amber-900/40 px-1 py-0.2 rounded font-medium">
                <ShieldAlert className="w-2.5 h-2.5" /> Incomplete
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-500">
                {formatCurrency(cashBal[cashBal.length - 1])}
              </span>
            )}
          </div>

          <div className="relative w-full" style={{ height: `${chartHeight}px` }}>
            {hasMissingCash ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-2">
                <ShieldAlert className="w-5 h-5 text-amber-500 mb-1" />
                <p className="text-[10px] text-slate-500 font-medium leading-tight">
                  Missing Cash Flow schedule in later years
                </p>
                <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                  Verify against attached plan
                </span>
              </div>
            ) : (
              <svg className="w-full h-full overflow-visible" viewBox="0 0 200 90" preserveAspectRatio="none">
                <line x1="0" y1="75" x2="200" y2="75" stroke="#cbd5e1" strokeDasharray="2 2" strokeWidth="0.8" />
                {cashBal.map((val, idx) => {
                  const barWidth = 20;
                  const spacing = (200 - barWidth * cashBal.length) / (cashBal.length + 1);
                  const x = spacing + idx * (barWidth + spacing);
                  const h = Math.max(4, (val / maxCash) * 62);
                  const y = 75 - h;

                  return (
                    <g key={`cash-bar-${idx}`}>
                      <rect x={x} y={y} width={barWidth} height={h} rx="2" fill="#f59e0b" opacity="0.85" />
                      <text x={x + barWidth / 2} y="88" textAnchor="middle" fontSize="7" fill="#64748b" className="font-mono">
                        {`Y${idx + 1}`}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <span>Runway: {financials.investorMetrics?.runwayMonths || 18} mo</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              Break-Even: M{financials.breakEven?.breakEvenMonth || "N/A"}
            </span>
          </div>
        </div>

        {/* Graph 4: Expense Proportions & Cost Structure */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Y3 Cost Structure</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Opex + COGS</span>
          </div>

          {/* Compact Proportional Stacked Bars */}
          <div className="flex flex-col justify-center gap-2 py-1" style={{ height: `${chartHeight}px` }}>
            <div>
              <div className="flex justify-between text-[10px] mb-1 font-medium text-slate-700 dark:text-slate-300">
                <span>R&D & Engineering</span>
                <span className="font-mono">35%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-teal-500 h-full rounded-full" style={{ width: "35%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] mb-1 font-medium text-slate-700 dark:text-slate-300">
                <span>Sales & Marketing (CAC)</span>
                <span className="font-mono">42%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: "42%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] mb-1 font-medium text-slate-700 dark:text-slate-300">
                <span>General & Admin (G&A)</span>
                <span className="font-mono">16%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: "16%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] mb-1 font-medium text-slate-700 dark:text-slate-300">
                <span>Legal & Patents IP</span>
                <span className="font-mono">7%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-slate-500 h-full rounded-full" style={{ width: "7%" }} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <span>Burn: ${((financials.breakEven?.monthlyBurn || 90000) / 1000).toFixed(0)}k/mo</span>
            <span className="font-semibold text-teal-600 dark:text-teal-400">
              LTV/CAC: {financials.investorMetrics?.ltvCacRatio ? `${financials.investorMetrics.ltvCacRatio}x` : "Pending"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
