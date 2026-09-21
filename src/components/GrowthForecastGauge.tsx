import React, { useState, useMemo } from "react";
import { FinancialData } from "../types";
import {
  TrendingUp,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
  Info,
  Calendar,
} from "lucide-react";

interface GrowthForecastGaugeProps {
  financials: FinancialData;
  scale?: "compact" | "medium" | "expanded";
  variant?: "full" | "compact" | "card";
  initialPeriodIndex?: number; // 0 for Y1->Y2, 1 for Y2->Y3, etc., or -1 for 5-Yr CAGR
  showPeriodSelector?: boolean;
  className?: string;
  onSelectPeriod?: (periodLabel: string) => void;
}

export const GrowthForecastGauge: React.FC<GrowthForecastGaugeProps> = ({
  financials,
  scale = "medium",
  variant = "full",
  initialPeriodIndex = 0,
  showPeriodSelector = true,
  className = "",
  onSelectPeriod,
}) => {
  // Selected period index: 0 = Y1->Y2, 1 = Y2->Y3, 2 = Y3->Y4, 3 = Y4->Y5, 4 = 5-Yr CAGR
  const [selectedPeriod, setSelectedPeriod] = useState<number>(initialPeriodIndex);

  const years = financials.years || ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"];
  const rev = financials.totalRevenue || [1000000, 2000000, 3500000, 6000000, 10000000];

  // Helper currency formatter
  const fmt = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return "$0";
    const abs = Math.abs(val);
    const sign = val < 0 ? "-" : "";
    if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(2)}M`;
    if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(0)}K`;
    return `${sign}$${abs.toLocaleString()}`;
  };

  // Period options
  const periods = useMemo(() => {
    const list = [];
    for (let i = 0; i < rev.length - 1; i++) {
      const fromYear = years[i]?.replace("Year ", "Y") || `Y${i + 1}`;
      const toYear = years[i + 1]?.replace("Year ", "Y") || `Y${i + 2}`;
      const fromRev = rev[i] || 1;
      const toRev = rev[i + 1] || 0;
      const growthPct = fromRev > 0 ? ((toRev - fromRev) / fromRev) * 100 : 0;
      const dollarDiff = toRev - fromRev;
      const multiple = fromRev > 0 ? toRev / fromRev : 0;

      list.push({
        id: i,
        label: `${fromYear} → ${toYear}`,
        shortLabel: `${fromYear}-${toYear}`,
        fromYear,
        toYear,
        fromRev,
        toRev,
        growthPct,
        dollarDiff,
        multiple,
        isCagr: false,
      });
    }

    // 5-Year CAGR
    const y1Rev = rev[0] || 1;
    const y5Rev = rev[rev.length - 1] || 0;
    const numYears = Math.max(1, rev.length - 1);
    const cagr = y1Rev > 0 && y5Rev > 0 ? (Math.pow(y5Rev / y1Rev, 1 / numYears) - 1) * 100 : 0;
    const totalMultiple = y1Rev > 0 ? y5Rev / y1Rev : 0;

    list.push({
      id: 4,
      label: "5-Year CAGR",
      shortLabel: "5-Yr CAGR",
      fromYear: years[0]?.replace("Year ", "Y") || "Y1",
      toYear: years[years.length - 1]?.replace("Year ", "Y") || "Y5",
      fromRev: y1Rev,
      toRev: y5Rev,
      growthPct: cagr,
      dollarDiff: y5Rev - y1Rev,
      multiple: totalMultiple,
      isCagr: true,
    });

    return list;
  }, [rev, years]);

  const activeData = periods[selectedPeriod] || periods[0];
  const growthRate = activeData.growthPct;

  // Gauge parameters
  // Max scale is 200% for the full gauge range (or 0% - 200%)
  const minRange = 0;
  const maxRange = 200;
  const clampedRate = Math.max(minRange, Math.min(maxRange, growthRate));
  const ratio = (clampedRate - minRange) / (maxRange - minRange);

  // SVG Geometry
  // Semicircle arc from 180° to 0°
  // Center: (100, 88), Radius: 64
  const cx = 100;
  const cy = 88;
  const r = 64;
  const arcLength = Math.PI * r; // ~201.06
  const strokeDashoffset = arcLength * (1 - ratio);

  // Needle calculation:
  // Angle in radians: at ratio 0 => PI (left), at ratio 1 => 0 (right)
  const needleAngleRad = Math.PI - ratio * Math.PI;
  const needleLength = 54;
  const tipX = cx + needleLength * Math.cos(needleAngleRad);
  const tipY = cy - needleLength * Math.sin(needleAngleRad);

  // Perpendicular offset for needle base width
  const baseWidth = 4;
  const basePerpAngle = needleAngleRad + Math.PI / 2;
  const p1X = cx + baseWidth * Math.cos(basePerpAngle);
  const p1Y = cy - baseWidth * Math.sin(basePerpAngle);
  const p2X = cx - baseWidth * Math.cos(basePerpAngle);
  const p2Y = cy + baseWidth * Math.sin(basePerpAngle);

  // Growth classification
  const getGrowthProfile = (rate: number) => {
    if (rate >= 100) {
      return {
        label: "Hypergrowth Velocity",
        subLabel: "Top-decile venture scale (>100% YoY)",
        badgeClass: "bg-emerald-500 text-slate-950",
        colorText: "text-emerald-600 dark:text-emerald-400",
        strokeColor: "#10b981",
        rating: "Exceptional",
      };
    }
    if (rate >= 50) {
      return {
        label: "High Expansion",
        subLabel: "Top-quartile commercial scaling (50-100% YoY)",
        badgeClass: "bg-teal-500 text-slate-950",
        colorText: "text-teal-600 dark:text-teal-400",
        strokeColor: "#14b8a6",
        rating: "Strong",
      };
    }
    if (rate >= 20) {
      return {
        label: "Solid Organic Expansion",
        subLabel: "Healthy sustainable trajectory (20-50% YoY)",
        badgeClass: "bg-indigo-500 text-white",
        colorText: "text-indigo-600 dark:text-indigo-400",
        strokeColor: "#6366f1",
        rating: "Healthy",
      };
    }
    if (rate >= 0) {
      return {
        label: "Moderate Growth",
        subLabel: "Steady baseline expansion (0-20% YoY)",
        badgeClass: "bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200",
        colorText: "text-slate-600 dark:text-slate-400",
        strokeColor: "#94a3b8",
        rating: "Steady",
      };
    }
    return {
      label: "Contraction Alert",
      subLabel: "Negative revenue progression (<0% YoY)",
      badgeClass: "bg-rose-500 text-white",
      colorText: "text-rose-600 dark:text-rose-400",
      strokeColor: "#f43f5e",
      rating: "Deficit",
    };
  };

  const profile = getGrowthProfile(growthRate);

  // Handle period change
  const handleSelect = (idx: number) => {
    setSelectedPeriod(idx);
    if (onSelectPeriod) {
      onSelectPeriod(periods[idx]?.label || "");
    }
  };

  // Compact Variant (e.g. for Bento Box or Compact Sidebar)
  if (variant === "compact") {
    return (
      <div
        id="growth-forecast-gauge-compact"
        className={`p-3 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              YoY Growth Forecast
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {activeData.shortLabel}
          </span>
        </div>

        {/* Micro Gauge Visual */}
        <div className="flex items-center justify-between my-1">
          <div className="w-24 h-14 relative flex items-center justify-center">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 200 110">
              <path
                d="M 36 88 A 64 64 0 0 1 164 88"
                fill="none"
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-700"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <path
                d="M 36 88 A 64 64 0 0 1 164 88"
                fill="none"
                stroke={profile.strokeColor}
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={arcLength}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out"
              />
              <polygon
                points={`${tipX},${tipY} ${p1X},${p1Y} ${p2X},${p2Y}`}
                fill="#0f172a"
                className="dark:fill-slate-100 transition-all duration-700 ease-out"
              />
              <circle cx={cx} cy={cy} r="6" fill="#0f172a" className="dark:fill-slate-100" />
              <circle cx={cx} cy={cy} r="2.5" fill="#10b981" />
            </svg>
          </div>

          <div className="text-right">
            <div className={`text-xl font-black font-mono tracking-tight ${profile.colorText}`}>
              {growthRate >= 0 ? "+" : ""}
              {growthRate.toFixed(1)}%
            </div>
            <span className="text-[10px] font-semibold text-slate-500">
              {activeData.multiple.toFixed(1)}x Multiple
            </span>
          </div>
        </div>

        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
          <span className="text-slate-500 font-mono">
            {fmt(activeData.fromRev)} → {fmt(activeData.toRev)}
          </span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {profile.rating}
          </span>
        </div>
      </div>
    );
  }

  // Full / Card Variant (Primary Investor Visual in Document Studio)
  return (
    <div
      id="growth-forecast-gauge-full"
      className={`p-4 sm:p-5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between transition-all ${className}`}
    >
      {/* Header Bar with Period Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                Growth Forecast & YoY Velocity
              </h3>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Investor Benchmark
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pro-forma year-over-year revenue scaling trajectory
            </p>
          </div>
        </div>

        {/* Period Selector Pills */}
        {showPeriodSelector && (
          <div className="flex items-center gap-1 overflow-x-auto p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold">
            {periods.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => handleSelect(idx)}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  selectedPeriod === idx
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-extrabold border border-slate-300/60 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {p.shortLabel}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Visual Section: Gauge + Key Metric Readout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center my-3">
        {/* Left: Semicircular Radial Gauge Visual (7 cols) */}
        <div className="md:col-span-7 flex flex-col items-center justify-center relative pt-2">
          <div className="w-full max-w-[260px] aspect-[200/120] relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 200 115">
              <defs>
                <linearGradient id="growthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="25%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="75%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>

                {/* Subtle drop shadow for the needle */}
                <filter id="gaugeShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" />
                </filter>
              </defs>

              {/* Background Inactive Arc Track */}
              <path
                d="M 36 88 A 64 64 0 0 1 164 88"
                fill="none"
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="16"
                strokeLinecap="round"
              />

              {/* Colored Segments / Milestone Indicators (Tick Marks) */}
              {/* 0% (Left) */}
              <circle cx="36" cy="88" r="2" fill="#94a3b8" />
              {/* 50% */}
              <circle cx="55" cy="43" r="2" fill="#38bdf8" />
              {/* 100% (Top Center) */}
              <circle cx="100" cy="24" r="2.5" fill="#10b981" />
              {/* 150% */}
              <circle cx="145" cy="43" r="2" fill="#14b8a6" />
              {/* 200% (Right) */}
              <circle cx="164" cy="88" r="2" fill="#6366f1" />

              {/* Active Progress Arc */}
              <path
                d="M 36 88 A 64 64 0 0 1 164 88"
                fill="none"
                stroke="url(#growthGradient)"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={arcLength}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out"
              />

              {/* Needle Pointer */}
              <polygon
                points={`${tipX},${tipY} ${p1X},${p1Y} ${p2X},${p2Y}`}
                fill="#0f172a"
                className="dark:fill-slate-100 transition-all duration-700 ease-out"
                filter="url(#gaugeShadow)"
              />

              {/* Center Pivot Hub */}
              <circle cx={cx} cy={cy} r="8" fill="#0f172a" className="dark:fill-slate-100" />
              <circle cx={cx} cy={cy} r="3.5" fill="#10b981" />

              {/* Tick Labels */}
              <text x="24" y="105" fontSize="9" fill="#94a3b8" fontWeight="600" textAnchor="middle">
                0%
              </text>
              <text x="100" y="14" fontSize="9" fill="#10b981" fontWeight="700" textAnchor="middle">
                100%
              </text>
              <text x="176" y="105" fontSize="9" fill="#6366f1" fontWeight="600" textAnchor="middle">
                200%+
              </text>
            </svg>
          </div>

          {/* Qualitative Profile Pill below the gauge */}
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase shadow-2xs ${profile.badgeClass}`}
            >
              {profile.label}
            </span>
          </div>
        </div>

        {/* Right: Key Pro-Forma Metrics Ledger (5 cols) */}
        <div className="md:col-span-5 space-y-2.5">
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {activeData.isCagr ? "Compound Annual Growth (CAGR)" : `${activeData.label} Revenue Growth`}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${profile.colorText}`}>
                {growthRate >= 0 ? "+" : ""}
                {growthRate.toFixed(1)}%
              </div>
              <div className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                <span>{activeData.multiple.toFixed(1)}x</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {profile.subLabel}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Starting Baseline</span>
              <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                {fmt(activeData.fromRev)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">({activeData.fromYear})</span>
            </div>

            <div className="p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Target Revenue</span>
              <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {fmt(activeData.toRev)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">({activeData.toYear})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Benchmark Corridor */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>
            Net Dollar Growth: <strong className="text-slate-800 dark:text-slate-200 font-mono">{fmt(activeData.dollarDiff)}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>5-Yr Multiplier: <strong>{(rev[rev.length - 1] / (rev[0] || 1)).toFixed(1)}x Total Expansion</strong></span>
        </div>
      </div>
    </div>
  );
};
