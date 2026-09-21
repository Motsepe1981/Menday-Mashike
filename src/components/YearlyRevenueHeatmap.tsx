import React, { useState, useMemo } from "react";
import { FinancialData, RevenueStream } from "../types";
import {
  Flame,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  SlidersHorizontal,
  Info,
  DollarSign,
  Percent,
  Check,
  Zap,
} from "lucide-react";

interface YearlyRevenueHeatmapProps {
  financials: FinancialData;
  className?: string;
}

type HeatmapMode = "growth" | "volume" | "share";
type SortOption = "cagr" | "y5revenue" | "growthDollar" | "default";

interface SegmentAnalysis {
  name: string;
  category: string;
  values: number[];
  yoyGrowth: (number | null)[]; // index 0 is null (no prior year), 1..4 are YoY %
  cagr: number;
  totalGrowthDollar: number;
  multiple: number;
  y5Share: number;
  yearlyShares: number[];
}

export const YearlyRevenueHeatmap: React.FC<YearlyRevenueHeatmapProps> = ({
  financials,
  className = "",
}) => {
  const [mode, setMode] = useState<HeatmapMode>("growth");
  const [sortBy, setSortBy] = useState<SortOption>("cagr");
  const [highGrowthOnly, setHighGrowthOnly] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    streamName: string;
    yearIdx: number;
    value: number;
    yoy: number | null;
    share: number;
    prevVal: number | null;
  } | null>(null);

  const years = financials.years || ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"];
  const totalRev = financials.totalRevenue || [1, 1, 1, 1, 1];

  // Helper currency formatter
  const fmt = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return "$0";
    const abs = Math.abs(val);
    const sign = val < 0 ? "-" : "";
    if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(2)}M`;
    if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(0)}K`;
    return `${sign}$${abs.toLocaleString()}`;
  };

  const fmtCompact = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return "$0";
    const abs = Math.abs(val);
    const sign = val < 0 ? "-" : "";
    if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(0)}K`;
    return `${sign}$${abs.toLocaleString()}`;
  };

  // Analyze all revenue streams
  const analyzedSegments: SegmentAnalysis[] = useMemo(() => {
    if (!financials.revenueStreams || financials.revenueStreams.length === 0) {
      return [];
    }

    const numYears = years.length;
    const y5Total = totalRev[numYears - 1] || 1;

    return financials.revenueStreams.map((stream) => {
      const vals = stream.values;
      const yoyGrowth: (number | null)[] = [null]; // Year 1 has no prior year

      for (let i = 1; i < vals.length; i++) {
        const prev = vals[i - 1];
        const curr = vals[i];
        if (prev > 0) {
          yoyGrowth.push(((curr - prev) / prev) * 100);
        } else if (curr > 0) {
          yoyGrowth.push(100); // From zero to positive
        } else {
          yoyGrowth.push(0);
        }
      }

      const y1 = vals[0] || 0;
      const yLast = vals[vals.length - 1] || 0;
      const duration = Math.max(1, vals.length - 1);

      // CAGR formula: (Ending / Beginning)^(1 / duration) - 1
      let cagr = 0;
      const firstNonZeroIdx = vals.findIndex((v) => v > 0);
      if (firstNonZeroIdx !== -1 && yLast > 0) {
        const firstVal = vals[firstNonZeroIdx];
        const span = vals.length - 1 - firstNonZeroIdx;
        if (span > 0 && firstVal > 0) {
          cagr = (Math.pow(yLast / firstVal, 1 / span) - 1) * 100;
        } else {
          cagr = 100;
        }
      }

      const totalGrowthDollar = yLast - y1;
      const multiple =
        y1 > 0
          ? yLast / y1
          : firstNonZeroIdx !== -1 && vals[firstNonZeroIdx] > 0
          ? yLast / vals[firstNonZeroIdx]
          : 0;
      const y5Share = (yLast / y5Total) * 100;

      const yearlyShares = vals.map((v, idx) => {
        const yrTotal = totalRev[idx] || 1;
        return yrTotal > 0 ? (v / yrTotal) * 100 : 0;
      });

      return {
        name: stream.name,
        category: stream.category,
        values: vals,
        yoyGrowth,
        cagr,
        totalGrowthDollar,
        multiple,
        y5Share,
        yearlyShares,
      };
    });
  }, [financials.revenueStreams, totalRev, years]);

  // Overall consolidated revenue analysis
  const consolidatedAnalysis = useMemo(() => {
    const vals = totalRev;
    const yoyGrowth: (number | null)[] = [null];

    for (let i = 1; i < vals.length; i++) {
      const prev = vals[i - 1];
      const curr = vals[i];
      if (prev > 0) {
        yoyGrowth.push(((curr - prev) / prev) * 100);
      } else {
        yoyGrowth.push(0);
      }
    }

    const y1 = vals[0] || 0;
    const yLast = vals[vals.length - 1] || 0;
    const duration = Math.max(1, vals.length - 1);
    const cagr = y1 > 0 && yLast > 0 ? (Math.pow(yLast / y1, 1 / duration) - 1) * 100 : 0;
    const totalGrowthDollar = yLast - y1;
    const multiple = y1 > 0 ? yLast / y1 : 0;

    return {
      name: "Consolidated Total Revenue",
      category: "Portfolio Aggregate",
      values: vals,
      yoyGrowth,
      cagr,
      totalGrowthDollar,
      multiple,
      y5Share: 100,
      yearlyShares: vals.map(() => 100),
    };
  }, [totalRev]);

  // Max value across all cells for volume normalization
  const maxSegmentValue = useMemo(() => {
    let max = 1;
    analyzedSegments.forEach((s) => {
      s.values.forEach((v) => {
        if (v > max) max = v;
      });
    });
    return max;
  }, [analyzedSegments]);

  // Sort segments
  const sortedSegments = useMemo(() => {
    const list = [...analyzedSegments];
    if (sortBy === "cagr") {
      list.sort((a, b) => b.cagr - a.cagr);
    } else if (sortBy === "y5revenue") {
      list.sort((a, b) => b.values[b.values.length - 1] - a.values[a.values.length - 1]);
    } else if (sortBy === "growthDollar") {
      list.sort((a, b) => b.totalGrowthDollar - a.totalGrowthDollar);
    }
    return list;
  }, [analyzedSegments, sortBy]);

  // Top high-growth segment
  const topGrowthSegment = useMemo(() => {
    if (analyzedSegments.length === 0) return null;
    return [...analyzedSegments].sort((a, b) => b.cagr - a.cagr)[0];
  }, [analyzedSegments]);

  // Highest revenue segment in Year 5
  const topY5Segment = useMemo(() => {
    if (analyzedSegments.length === 0) return null;
    return [...analyzedSegments].sort(
      (a, b) => b.values[b.values.length - 1] - a.values[a.values.length - 1]
    )[0];
  }, [analyzedSegments]);

  /**
   * Returns styling and semantic color coding based on performance intensity
   */
  const getIntensityStyle = (
    value: number,
    yoy: number | null,
    share: number,
    isDimmed: boolean = false
  ) => {
    if (isDimmed) {
      return {
        bgClass: "bg-slate-100/60 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 opacity-40 border-slate-200 dark:border-slate-800",
        badge: null,
      };
    }

    if (mode === "growth") {
      // Color-code by YoY Growth Rate
      if (yoy === null) {
        // Base year (Year 1)
        return {
          bgClass:
            "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60",
          badge: "Baseline",
          badgeColor: "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
        };
      }
      if (yoy >= 100) {
        // Hypergrowth (>100%)
        return {
          bgClass:
            "bg-emerald-500/90 hover:bg-emerald-500 text-slate-950 font-bold border-emerald-400 dark:border-emerald-400 shadow-2xs",
          badge: "Hypergrowth",
          badgeColor: "bg-slate-950/80 text-emerald-300",
        };
      }
      if (yoy >= 50) {
        // High Expansion (50% - 100%)
        return {
          bgClass:
            "bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold border-emerald-500 dark:border-emerald-600",
          badge: "High Velocity",
          badgeColor: "bg-emerald-950/80 text-emerald-200",
        };
      }
      if (yoy >= 25) {
        // Solid Growth (25% - 50%)
        return {
          bgClass:
            "bg-teal-500/30 hover:bg-teal-500/40 text-teal-900 dark:text-teal-200 border-teal-300 dark:border-teal-700 font-semibold",
          badge: "Solid",
          badgeColor: "bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300",
        };
      }
      if (yoy >= 10) {
        // Moderate Growth (10% - 25%)
        return {
          bgClass:
            "bg-sky-500/15 hover:bg-sky-500/25 text-slate-800 dark:text-slate-200 border-sky-200 dark:border-sky-800/80 font-medium",
          badge: "Moderate",
          badgeColor: "bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300",
        };
      }
      if (yoy >= 0) {
        // Low / Steady (0% - 10%)
        return {
          bgClass:
            "bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80",
          badge: "Steady",
          badgeColor: "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
        };
      }
      // Contraction (<0%)
      return {
        bgClass:
          "bg-rose-500/30 hover:bg-rose-500/40 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700 font-bold",
        badge: "Contraction",
        badgeColor: "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300",
      };
    }

    if (mode === "volume") {
      // Color-code by Revenue Volume
      const ratio = Math.min(1, value / maxSegmentValue);
      if (ratio > 0.75) {
        return {
          bgClass: "bg-emerald-600 text-white font-bold border-emerald-500",
          badge: "Top Volume",
          badgeColor: "bg-emerald-950 text-emerald-200",
        };
      }
      if (ratio > 0.45) {
        return {
          bgClass: "bg-teal-500/40 text-teal-900 dark:text-teal-200 border-teal-400 font-semibold",
          badge: "Core Volume",
          badgeColor: "bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300",
        };
      }
      if (ratio > 0.2) {
        return {
          bgClass: "bg-sky-500/25 text-slate-800 dark:text-slate-200 border-sky-300 font-medium",
          badge: "Moderate",
          badgeColor: "bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300",
        };
      }
      return {
        bgClass: "bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
        badge: "Early Stage",
        badgeColor: "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
      };
    }

    // mode === "share"
    // Color-code by Portfolio Mix Share
    if (share >= 50) {
      return {
        bgClass: "bg-emerald-600 text-white font-bold border-emerald-500",
        badge: "Majority Anchor (>50%)",
        badgeColor: "bg-emerald-950 text-emerald-200",
      };
    }
    if (share >= 30) {
      return {
        bgClass: "bg-teal-500/40 text-teal-900 dark:text-teal-200 border-teal-400 font-semibold",
        badge: "Primary Driver (30-50%)",
        badgeColor: "bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300",
      };
    }
    if (share >= 15) {
      return {
        bgClass: "bg-indigo-500/25 text-slate-800 dark:text-slate-200 border-indigo-300 font-medium",
        badge: "Key Segment (15-30%)",
        badgeColor: "bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300",
      };
    }
    return {
      bgClass: "bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      badge: "Niche (<15%)",
      badgeColor: "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
    };
  };

  return (
    <div
      id="yearly-revenue-heatmap-container"
      className={`p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 ${className}`}
    >
      {/* Heatmap Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/30 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
            <Flame className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                Yearly Revenue Segment Heatmap
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Performance Intensity
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Color-coded annual scaling velocity and revenue concentration across product segments
            </p>
          </div>
        </div>

        {/* Top Highlight Stat Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {topGrowthSegment && (
            <div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 text-xs">
              <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-slate-600 dark:text-slate-300 text-[11px]">Fastest Scaler:</span>
              <strong className="text-emerald-700 dark:text-emerald-300 font-bold font-mono text-[11px]">
                {topGrowthSegment.name.split(" ")[0]} (+{topGrowthSegment.cagr.toFixed(0)}% CAGR)
              </strong>
            </div>
          )}

          {topY5Segment && (
            <div className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 text-xs">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-slate-600 dark:text-slate-300 text-[11px]">Top Y5 Anchor:</span>
              <strong className="text-indigo-700 dark:text-indigo-300 font-bold font-mono text-[11px]">
                {fmtCompact(topY5Segment.values[topY5Segment.values.length - 1])} ({topY5Segment.y5Share.toFixed(0)}%)
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Controls Ribbon */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80">
        {/* Heatmap Intensity Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-900 p-1 rounded-lg">
          <button
            id="heatmap-mode-growth"
            onClick={() => setMode("growth")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              mode === "growth"
                ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-2xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>YoY Growth Velocity (%)</span>
          </button>

          <button
            id="heatmap-mode-volume"
            onClick={() => setMode("volume")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              mode === "volume"
                ? "bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-2xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Revenue Volume ($)</span>
          </button>

          <button
            id="heatmap-mode-share"
            onClick={() => setMode("share")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              mode === "share"
                ? "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-2xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Portfolio Mix Share (%)</span>
          </button>
        </div>

        {/* Sort & Filter Controls */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          {/* High Growth Highlight Filter */}
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={highGrowthOnly}
              onChange={(e) => setHighGrowthOnly(e.target.checked)}
              className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 dark:border-slate-700 focus:ring-emerald-500/20"
            />
            <span className="font-medium text-[11px]">Spotlight High-Growth (&gt;50%)</span>
          </label>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
            <SlidersHorizontal className="w-3 h-3 text-slate-500" />
            <span className="text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="cagr">Fastest Growth (CAGR)</option>
              <option value="y5revenue">Largest Y5 Revenue</option>
              <option value="growthDollar">Largest Dollar Expansion</option>
              <option value="default">Original Model Order</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Heatmap Grid Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/80 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3.5 w-64 min-w-[180px]">
                Revenue Segment & Category
              </th>
              {years.map((yr, idx) => (
                <th key={idx} className="py-3 px-2.5 text-center min-w-[110px]">
                  <div className="font-bold text-slate-800 dark:text-slate-200">{yr}</div>
                  <div className="text-[9px] font-mono text-slate-400 font-normal">
                    {mode === "growth"
                      ? idx === 0
                        ? "Starting Base"
                        : "YoY Velocity"
                      : mode === "volume"
                      ? "Dollar Volume"
                      : "Portfolio Share"}
                  </div>
                </th>
              ))}
              <th className="py-3 px-3 text-right min-w-[95px]">5-Yr CAGR</th>
              <th className="py-3 px-3 text-right min-w-[100px]">Total Expansion</th>
              <th className="py-3 px-3 text-right min-w-[85px]">Y5 Mix Share</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-xs">
            {sortedSegments.map((segment, sIdx) => (
              <tr
                key={segment.name}
                className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
              >
                {/* Segment Name & Category */}
                <td className="py-2.5 px-3.5 font-sans font-medium text-slate-900 dark:text-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-semibold text-xs leading-snug">{segment.name}</span>
                  </div>
                  <span className="ml-4 text-[10px] text-slate-400 font-mono block">
                    {segment.category}
                  </span>
                </td>

                {/* 5-Year Projection Heatmap Cells */}
                {segment.values.map((val, yIdx) => {
                  const yoy = segment.yoyGrowth[yIdx];
                  const share = segment.yearlyShares[yIdx];
                  const isHighGrowth = yoy !== null && yoy >= 50;
                  const isDimmed = highGrowthOnly && yIdx > 0 && !isHighGrowth;
                  const style = getIntensityStyle(val, yoy, share, isDimmed);

                  return (
                    <td key={yIdx} className="py-1.5 px-1.5 text-center">
                      <div
                        onClick={() =>
                          setSelectedCell({
                            streamName: segment.name,
                            yearIdx: yIdx,
                            value: val,
                            yoy,
                            share,
                            prevVal: yIdx > 0 ? segment.values[yIdx - 1] : null,
                          })
                        }
                        className={`p-2 rounded-lg border transition-all cursor-pointer ${style.bgClass} flex flex-col items-center justify-center min-h-[52px]`}
                        title={`Click to inspect ${segment.name} (${years[yIdx]})`}
                      >
                        {/* Primary Value */}
                        <div className="font-bold tracking-tight">
                          {mode === "growth" ? (
                            yIdx === 0 ? (
                              <span className="text-[11px] font-mono">{fmtCompact(val)}</span>
                            ) : (
                              <span>
                                {yoy !== null && yoy >= 0 ? "+" : ""}
                                {yoy !== null ? `${yoy.toFixed(0)}%` : "-"}
                              </span>
                            )
                          ) : mode === "volume" ? (
                            <span>{fmtCompact(val)}</span>
                          ) : (
                            <span>{share.toFixed(1)}%</span>
                          )}
                        </div>

                        {/* Secondary Context Label */}
                        <div className="text-[9.5px] opacity-80 mt-0.5 flex items-center gap-1">
                          {mode === "growth" ? (
                            <span>{fmtCompact(val)}</span>
                          ) : mode === "volume" ? (
                            yIdx > 0 && yoy !== null ? (
                              <span className="flex items-center">
                                {yoy >= 0 ? "+" : ""}
                                {yoy.toFixed(0)}%
                              </span>
                            ) : (
                              <span>Base</span>
                            )
                          ) : (
                            <span>{fmtCompact(val)}</span>
                          )}
                        </div>
                      </div>
                    </td>
                  );
                })}

                {/* 5-Yr CAGR Badge */}
                <td className="py-2.5 px-3 text-right font-sans">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                      segment.cagr >= 100
                        ? "bg-emerald-500 text-slate-950 font-black"
                        : segment.cagr >= 50
                        ? "bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800"
                        : segment.cagr >= 20
                        ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    +{segment.cagr.toFixed(1)}%
                  </span>
                </td>

                {/* Total Expansion ($ & Multiple) */}
                <td className="py-2.5 px-3 text-right">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    +{fmtCompact(segment.totalGrowthDollar)}
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-sans">
                    {segment.multiple.toFixed(1)}x multiple
                  </span>
                </td>

                {/* Y5 Mix Share */}
                <td className="py-2.5 px-3 text-right">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {segment.y5Share.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}

            {/* Consolidated Total Revenue Row */}
            <tr className="bg-emerald-50/60 dark:bg-emerald-950/30 border-t-2 border-emerald-500 font-bold">
              <td className="py-3 px-3.5 font-sans font-bold text-emerald-950 dark:text-emerald-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                  <span className="text-xs">Consolidated Total Revenue</span>
                </div>
                <span className="ml-4.5 text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-mono block">
                  Institutional Portfolio Rollup
                </span>
              </td>

              {consolidatedAnalysis.values.map((val, yIdx) => {
                const yoy = consolidatedAnalysis.yoyGrowth[yIdx];
                return (
                  <td key={yIdx} className="py-2 px-1.5 text-center">
                    <div className="p-2 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200 flex flex-col items-center justify-center min-h-[52px]">
                      <span className="text-xs font-black font-mono">{fmtCompact(val)}</span>
                      <span className="text-[9.5px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                        {yIdx === 0
                          ? "Starting Base"
                          : yoy !== null
                          ? `+${yoy.toFixed(0)}% YoY`
                          : "-"}
                      </span>
                    </div>
                  </td>
                );
              })}

              <td className="py-3 px-3 text-right font-sans">
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-slate-950 font-black font-mono text-[11px]">
                  +{consolidatedAnalysis.cagr.toFixed(1)}%
                </span>
              </td>

              <td className="py-3 px-3 text-right">
                <div className="font-black text-emerald-950 dark:text-emerald-200">
                  +{fmtCompact(consolidatedAnalysis.totalGrowthDollar)}
                </div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-sans font-bold">
                  {consolidatedAnalysis.multiple.toFixed(1)}x total
                </span>
              </td>

              <td className="py-3 px-3 text-right text-emerald-900 dark:text-emerald-300 font-bold">
                100.0%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Interactive Cell Inspector Popover / Drawer if clicked */}
      {selectedCell && (
        <div
          id="heatmap-cell-inspector"
          className="p-3.5 bg-slate-900 text-white rounded-xl border border-emerald-500/40 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-150"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-bold text-white">
                  {selectedCell.streamName} • {years[selectedCell.yearIdx]} Inspection
                </h4>
                {selectedCell.yoy !== null && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                      selectedCell.yoy >= 100
                        ? "bg-emerald-400 text-slate-950"
                        : selectedCell.yoy >= 50
                        ? "bg-teal-400 text-slate-950"
                        : "bg-slate-700 text-white"
                    }`}
                  >
                    {selectedCell.yoy >= 0 ? "+" : ""}
                    {selectedCell.yoy.toFixed(1)}% YoY
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 flex-wrap">
                <span>
                  Projected Revenue: <strong className="text-white font-mono">{fmt(selectedCell.value)}</strong>
                </span>
                {selectedCell.prevVal !== null && (
                  <span>
                    Prior Year: <strong className="text-slate-400 font-mono">{fmt(selectedCell.prevVal)}</strong> (
                    <span className="text-emerald-400 font-mono">
                      +{fmt(selectedCell.value - selectedCell.prevVal)}
                    </span>
                    )
                  </span>
                )}
                <span>
                  Portfolio Contribution: <strong className="text-emerald-300 font-mono">{selectedCell.share.toFixed(1)}%</strong> of Year Total
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setSelectedCell(null)}
            className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Performance Intensity Color Legend */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Performance Intensity Bands ({mode === "growth" ? "YoY Growth" : mode === "volume" ? "Volume" : "Portfolio Share"}):</span>
        </div>

        {mode === "growth" && (
          <div className="flex items-center gap-1 flex-wrap text-[10px] font-mono font-bold">
            <span className="px-2 py-0.5 rounded bg-rose-500/30 text-rose-900 dark:text-rose-200 border border-rose-400">
              &lt;0% Contraction
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
              0-10% Steady
            </span>
            <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-900 dark:text-sky-200 border border-sky-300">
              10-25% Moderate
            </span>
            <span className="px-2 py-0.5 rounded bg-teal-500/30 text-teal-900 dark:text-teal-200 border border-teal-400">
              25-50% Solid
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-600/80 text-white border border-emerald-500">
              50-100% High Velocity
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black shadow-2xs">
              &gt;100% Hypergrowth
            </span>
          </div>
        )}

        {mode === "volume" && (
          <div className="flex items-center gap-1 flex-wrap text-[10px] font-mono font-bold">
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Early Stage (&lt;20% of peak)
            </span>
            <span className="px-2 py-0.5 rounded bg-sky-500/25 text-slate-800 dark:text-slate-200">
              Moderate (20-45%)
            </span>
            <span className="px-2 py-0.5 rounded bg-teal-500/40 text-teal-900 dark:text-teal-200">
              Core Volume (45-75%)
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white">
              Top Volume (&gt;75%)
            </span>
          </div>
        )}

        {mode === "share" && (
          <div className="flex items-center gap-1 flex-wrap text-[10px] font-mono font-bold">
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Niche (&lt;15%)
            </span>
            <span className="px-2 py-0.5 rounded bg-indigo-500/25 text-slate-800 dark:text-slate-200">
              Key Segment (15-30%)
            </span>
            <span className="px-2 py-0.5 rounded bg-teal-500/40 text-teal-900 dark:text-teal-200">
              Primary Driver (30-50%)
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white">
              Majority Anchor (&gt;50%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
