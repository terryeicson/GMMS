export type OccupancyStatus = 'OCCUPIED' | 'AVAILABLE' | 'SUB_LEASED' | 'MAINTENANCE';

export type PaymentComplianceStatus = 'PAID' | 'PENDING_GRACE' | 'OVERDUE_ARREARS' | 'PARTIAL';

export type SubLeaseAuthStatus = 'AUTHORIZED' | 'PENDING_REVIEW' | 'MARGIN_VIOLATION';

export interface MarketHub {
  id: string;
  code: string;
  name: string;
  district: string;
  sector: string;
  totalStalls: number;
  managerName: string;
}

export interface VendorCitizen {
  id: string;
  nationalId: string; // 16-digit Rwandan NID
  fullName: string;
  phone: string;
  tinNumber: string;
  tradeCategory: string;
  roleType: 'PRIMARY_HOLDER' | 'OPERATIONAL_TENANT' | 'BOTH';
  registeredDate: string;
}

export interface StallAsset {
  id: string;
  stallCode: string;
  marketId: string;
  marketName: string;
  zoneName: string;
  gridRow: number;
  gridCol: number;
  sizeSqm: number;
  monthlyRentRwf: number;
  occupancyStatus: OccupancyStatus;
}

export interface StallAllocation {
  id: string;
  stallId: string;
  stallCode: string;
  marketId: string;
  marketName: string;
  primaryVendorId: string;
  primaryVendorName: string;
  primaryVendorNid: string;
  primaryVendorPhone: string;
  tradeCategory: string;
  billingPeriod: string; // e.g. "2026-10"
  dueDate: string; // e.g. "2026-10-05"
  baseRentRwf: number;
  paidAmountRwf: number;
  daysOverdue: number;
  statutoryFeeRwf: number;
  dailyCumulativePenaltyRwf: number;
  totalPenaltyRwf: number;
  totalBalanceDueRwf: number;
  paymentStatus: PaymentComplianceStatus;
  lastPaymentDate: string | null;
}

export interface SubLeaseRecord {
  id: string;
  permitNumber: string;
  allocationId: string;
  stallId: string;
  stallCode: string;
  marketName: string;
  primaryVendorId: string;
  primaryVendorName: string;
  primaryVendorNid: string;
  primaryVendorPhone: string;
  operationalTenantId: string;
  operationalTenantName: string;
  operationalTenantNid: string;
  operationalTenantPhone: string;
  operationalTrade: string;
  governmentBaseRentRwf: number;
  subLeaseMonthlyChargeRwf: number;
  markupPercentage: number;
  authorizationStatus: SubLeaseAuthStatus;
  startDate: string;
  endDate: string;
}

export interface PenaltyAuditLog {
  id: string;
  executedAt: string;
  simulatedAssessmentDate: string;
  dayOfMonthEvaluated: number;
  pastFifthThreshold: boolean;
  accountsEvaluated: number;
  overdueAccountsFlagged: number;
  totalPenaltiesAssessedRwf: number;
  triggerType: 'CRON_SCHEDULED' | 'MANUAL_AUDIT' | 'DATE_SIMULATION';
}

export interface GMMSState {
  simulatedDate: string;
  markets: MarketHub[];
  vendors: VendorCitizen[];
  stalls: StallAsset[];
  allocations: StallAllocation[];
  subLeases: SubLeaseRecord[];
  penaltyLogs: PenaltyAuditLog[];
}
