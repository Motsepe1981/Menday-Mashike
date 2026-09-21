export interface RevenueStream {
  name: string;
  category: string;
  values: number[]; // 5-year values
}

export interface ExpenseItem {
  category: string;
  subcategory?: string;
  values: number[]; // 5-year values
}

export interface CashFlowStatement {
  operatingCashFlow: number[];
  capex: number[];
  freeCashFlow: number[];
  endingCashBalance: number[];
}

export interface BreakEvenAnalysis {
  monthlyBurn: number;
  breakEvenMonth: number;
  breakEvenRevenue: number;
  targetUnits: number;
  contributionMarginPercent: number;
}

export interface InvestorMetrics {
  totalFundingRequired: number;
  projectedIRR: number; // percentage
  projectedROI: string; // e.g. "5.2x"
  runwayMonths: number;
  preMoneyValuation: number;
  cac: number;
  ltv: number;
  ltvCacRatio: number;
  paybackPeriodMonths: number;
}

export interface FinancialData {
  currency: string;
  years: string[]; // ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"]
  revenueStreams: RevenueStream[];
  totalRevenue: number[];
  cogs: ExpenseItem[];
  totalCogs: number[];
  grossProfit: number[];
  grossMarginPercent: number[];
  operatingExpenses: ExpenseItem[];
  totalOpex: number[];
  ebitda: number[];
  ebitdaMarginPercent: number[];
  depreciationAmortization: number[];
  ebit: number[];
  tax: number[];
  netIncome: number[];
  netMarginPercent: number[];
  cashFlow: CashFlowStatement;
  breakEven: BreakEvenAnalysis;
  investorMetrics: InvestorMetrics;
  missingFields: string[];
}

export interface OrganogramNode {
  id: string;
  name: string;
  title: string;
  department: "Executive" | "Technology" | "Finance & Legal" | "Operations" | "Growth & Sales" | "Product & Clinical";
  reportsToId: string | null;
  status: "Filled" | "Open/Hiring";
  email: string;
  bio: string;
  equityPercent?: number;
  isKeyHire?: boolean;
  avatarInitials: string;
  colorScheme: string;
}

export interface DocumentSection {
  id: string;
  pageNumber: number;
  title: string;
  subtitle: string;
  content: string;
  bulletPoints?: string[];
  keyHighlights?: { label: string; value: string }[];
}

export interface FormatSettings {
  whitespaceDensity: "compact" | "balanced" | "spacious";
  graphScale: "compact" | "medium" | "expanded";
  fontHierarchy: "corporate" | "executive-serif" | "modern-sans";
  accentColor: "emerald" | "slate" | "navy" | "amber";
  showFooterVerifiedSeal: boolean;
  showWatermark: boolean;
  footerDisclaimer: string;
  confidentialNotice: string;
}

export interface CommentReply {
  id: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface PlanComment {
  id: string;
  planId?: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  targetType: "financial_section" | "organogram_node" | "general";
  targetId: string; // e.g., "sec-revenue", "sec-unit-econ", "sec-pnl", "sec-cogs", "sec-cashflow", "sec-breakeven", or node id
  targetLabel: string; // Human-friendly label e.g., "Revenue Monetization Streams", "Dr. Eleanor Vance (CEO)"
  targetPage?: number; // Page 1 to 5
  content: string;
  createdAt: string; // Timestamp
  status: "open" | "resolved";
  category: "audit" | "financial" | "governance" | "question";
  replies?: CommentReply[];
}

export interface BusinessPlan {
  id: string;
  name: string;
  companyName: string;
  sector: string;
  tagline: string;
  founderNames?: string;
  locationRegion?: string;
  docReference: string;
  revision: string;
  lastUpdated: string;
  isAttachedReference: boolean; // Indicates the golden master template
  status: "verified" | "missing_data" | "standardized";
  readinessScore: number; // 0 to 100
  executiveSummary: string;
  targetMarket: string;
  valueProposition: string;
  competitiveMoat: string;
  growthStrategy: string;
  financials: FinancialData;
  organogram: OrganogramNode[];
  formatSettings: FormatSettings;
  sections: DocumentSection[];
  comments?: PlanComment[];
  versionSnapshots?: FinancialSnapshot[];
}

export interface FinancialSnapshotMetrics {
  monthlyBurn: number;
  runwayMonths: number;
  cac: number;
  ltv: number;
  ltvCacRatio: number;
  paybackPeriodMonths: number;
  breakEvenMonth: number;
  breakEvenRevenue: number;
  totalRevenueY1: number;
  totalRevenueY5: number;
  ebitdaY5: number;
  grossMarginY5: number;
  totalFundingRequired: number;
  preMoneyValuation: number;
  targetUnits?: number;
}

export interface FinancialSnapshot {
  id: string;
  versionLabel: string;
  date: string;
  stage?: string;
  notes?: string;
  metrics: FinancialSnapshotMetrics;
}

export interface MetricVariance {
  key: string;
  name: string;
  category: "burn_runway" | "unit_economics" | "topline_valuation" | "margins";
  currentVal: number;
  previousVal: number;
  unit: "currency" | "percent" | "months" | "ratio" | "number";
  absoluteDiff: number;
  percentChange: number;
  isSignificant: boolean;
  impactDirection: "favorable" | "unfavorable" | "neutral";
  driverNote: string;
}

export interface SnapshotComparisonSummary {
  snapshotId: string;
  snapshotLabel: string;
  snapshotDate: string;
  thresholdPercent: number;
  totalMetricsCount: number;
  significantCount: number;
  significantUnfavorableCount: number;
  significantFavorableCount: number;
  burnRateVariance: MetricVariance;
  variances: MetricVariance[];
}

export interface WhatIfVariables {
  revenueGrowthDelta: number; // percentage, e.g. +20 for +20%
  pricingPowerDelta: number; // percentage, e.g. +10 for +10%
  cogsEfficiencyDelta: number; // percentage, e.g. -10 for 10% lower direct costs (or +10 for 10% higher)
  opexDelta: number; // percentage, e.g. -15 for 15% lower OPEX (or +20 for higher burn)
  cacDelta: number; // percentage, e.g. -20 for 20% cheaper CAC
  capexDelta: number; // percentage, e.g. +10 for higher CapEx
}

export interface WhatIfScenarioPreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  badgeColor: string;
  variables: WhatIfVariables;
}

export interface SavedWhatIfScenario {
  id: string;
  name: string;
  tagline: string;
  category: "optimistic" | "conservative" | "baseline" | "custom";
  description: string;
  badge: string;
  color: string;
  lineStyle?: "solid" | "dashed" | "dotted";
  variables: WhatIfVariables;
  isCustom?: boolean;
  createdAt?: string;
}

export type ExportFormat = "pdf" | "excel" | "image";

export interface ExportRecord {
  id: string;
  planId?: string;
  planName?: string;
  companyName: string;
  fileName: string;
  format: ExportFormat;
  exportedAt: string; // ISO 8601 timestamp string
  fileSizeFormatted?: string;
  scope: string; // e.g. "Full Memorandum (5 Pages)", "Page 1 - Executive Summary", "Complete Financial Model", "Organogram Hierarchy"
  status: "success" | "failed";
  triggeredBy?: string; // e.g. "Document Studio Toolbar", "Excel Exporter", "Quick Action"
  notes?: string;
}

export interface SyncChangeDiff {
  attribute: "whitespaceDensity" | "graphScale" | "fontHierarchy";
  label: string;
  oldValue: string;
  newValue: string;
  description: string;
}

export interface FormatSyncProposal {
  id: string;
  sourcePlanId: string;
  sourcePlanName: string;
  sourceCompanyName: string;
  diffs: SyncChangeDiff[];
  newFormatSettings: FormatSettings;
  targetPlanIds: string[];
  targetPlanNames: string[];
  timestamp: number;
}

