import React, { useEffect, useState } from 'react';
import {
  GMMSState,
  MunicipalRole,
  RbacAuditEntry,
  RevenueLeakageAlert,
  StallAllocation,
  StallAsset,
  UssdMomoTransaction,
} from './types/gmms';
import {
  computeAllocationPenalties,
  createInitialGMMSState,
} from './data/seedData';
import { VisualStallMap, ZoneFilterType } from './components/VisualStallMap';
import { PenaltyAutomationPanel } from './components/PenaltyAutomationPanel';
import { SubLeaseLedgerPanel } from './components/SubLeaseLedgerPanel';
import { OfflineUssdMomoPanel } from './components/OfflineUssdMomoPanel';
import { AuditAndForecastingSuite } from './components/AuditAndForecastingSuite';
import { XamppCodeStudio } from './components/XamppCodeStudio';
import {
  Plus,
  RotateCcw,
  X,
  ArrowRight,
  Calendar,
  Code2,
} from 'lucide-react';

const HERO_IMAGE_PATH = '/src/assets/images/kigali_market_hero_1791467420057.jpg';
const KIMIRONKO_IMAGE_PATH = '/src/assets/images/kimironko_hub_showcase_1791467432065.jpg';
const NYABUGOGO_IMAGE_PATH = '/src/assets/images/nyabugogo_hub_showcase_1791467444223.jpg';

const SECTOR_PRODUCE_IMAGE = '/src/assets/images/sector_fresh_produce_1791468058856.jpg';
const SECTOR_KITENGE_IMAGE = '/src/assets/images/sector_kitenge_textiles_1791468071530.jpg';
const SECTOR_AGASEKE_IMAGE = '/src/assets/images/sector_agaseke_crafts_1791468081768.jpg';
const SECTOR_COLDCHAIN_IMAGE = '/src/assets/images/sector_coldchain_hardware_1791468091931.jpg';

const QUICK_SIM_DATES = [
  { date: '2026-10-03', label: 'Oct 03 (Grace)' },
  { date: '2026-10-05', label: 'Oct 05 (5th Due)' },
  { date: '2026-10-08', label: 'Oct 08 (+3d Past 5th)' },
  { date: '2026-10-15', label: 'Oct 15 (+10d Past 5th)' },
];

interface MarketSectorSpotlight {
  zoneKey: ZoneFilterType;
  zoneLabel: string;
  title: string;
  localSubtitle: string;
  imagePath: string;
  imageAlt: string;
  description: string;
  tariffBracket: string;
  stallDimension: string;
}

const GOVERNMENT_MARKET_SECTORS: MarketSectorSpotlight[] = [
  {
    zoneKey: 'Zone A',
    zoneLabel: 'Zone A · Row 1 Bays',
    title: 'Fresh Produce & Wholesale Grains',
    localSubtitle: 'Amatoki · Ibirayi · Dry Cereals',
    imagePath: SECTOR_PRODUCE_IMAGE,
    imageAlt:
      'Kigali Municipal Market Fresh Agricultural Produce stalls with plantains, avocados, and tomatoes',
    description:
      'High-turnover agricultural bays for green plantains, fresh horticulture, and inter-district wholesale grain sacks.',
    tariffBracket: 'RWF 60,000 – 120,000 / mo',
    stallDimension: '12m² – 24m² Bays',
  },
  {
    zoneKey: 'Zone B',
    zoneLabel: 'Zone B · Row 2 Bays',
    title: 'Kitenge Textiles & Tailoring',
    localSubtitle: "Imyenda y'Umucyo · Apparel & Tools",
    imagePath: SECTOR_KITENGE_IMAGE,
    imageAlt:
      'Kitenge and Apparel Textiles stalls with colorful wax-print fabrics and sewing workstations',
    description:
      'Dedicated textile corridors housing wax-print Kitenge fabric merchants, garment tailors, and domestic hardware.',
    tariffBracket: 'RWF 85,000 – 90,000 / mo',
    stallDimension: '16m² – 18m² Bays',
  },
  {
    zoneKey: 'Zone C',
    zoneLabel: 'Zone C · Row 3 Bays',
    title: 'Agaseke & Imigongo Cooperatives',
    localSubtitle: 'Handwoven Peace Baskets · Leather',
    imagePath: SECTOR_AGASEKE_IMAGE,
    imageAlt:
      'Agaseke Cooperative stalls at Kimironko Market with handwoven baskets and Imigongo geometric art',
    description:
      'Artisanal cooperative stalls showcasing traditional Rwandan Agaseke peace baskets, Imigongo panels, and leather goods.',
    tariffBracket: 'RWF 70,000 – 80,000 / mo',
    stallDimension: '14m² – 15m² Bays',
  },
  {
    zoneKey: 'Zone D',
    zoneLabel: 'Zone D · Row 4 Bays',
    title: 'Cold Chain Dairy & Solar Hardware',
    localSubtitle: 'Amata · Butcheries · Electronics',
    imagePath: SECTOR_COLDCHAIN_IMAGE,
    imageAlt:
      'Kigali Municipal Market Dairy Cold Chain counter and Domestic Hardware & Solar Lamps section',
    description:
      'Hygienic tiled bays equipped with three-phase power for refrigerated dairy/butchery units and solar electronics.',
    tariffBracket: 'RWF 95,000 – 110,000 / mo',
    stallDimension: '18m² – 20m² Bays',
  },
];

const INITIAL_USSD_TRANSACTIONS: UssdMomoTransaction[] = [
  {
    id: 'USSD-001',
    momoRef: 'MOMO-RW-8492014',
    ussdSessionCode: '*909*1*KIM-B01#',
    allocationId: 'ALC-2026-002',
    stallCode: 'KIM-B01',
    marketName: 'Kimironko Market',
    payerName: 'Habimana Jean Paul',
    payerPhone: '+250 788 530 118',
    provider: 'MTN_MOMO',
    amountRwf: 97200,
    syncStatus: 'QUEUED_OFFLINE',
    createdAt: '2026-10-08 08:42:10',
    syncedAt: null,
  },
  {
    id: 'USSD-002',
    momoRef: 'AIRT-RW-5120983',
    ussdSessionCode: '*909*1*KIM-D01#',
    allocationId: 'ALC-2026-005',
    stallCode: 'KIM-D01',
    marketName: 'Kimironko Market',
    payerName: 'Ingabire Diane',
    payerPhone: '+250 785 214 776',
    provider: 'AIRTEL_MONEY',
    amountRwf: 86400,
    syncStatus: 'QUEUED_OFFLINE',
    createdAt: '2026-10-08 09:05:44',
    syncedAt: null,
  },
  {
    id: 'USSD-003',
    momoRef: 'MOMO-RW-7731902',
    ussdSessionCode: '*909*1*KIM-A01#',
    allocationId: 'ALC-2026-001',
    stallCode: 'KIM-A01',
    marketName: 'Kimironko Market',
    payerName: 'Uwimana Marie Claire',
    payerPhone: '+250 788 412 093',
    provider: 'MTN_MOMO',
    amountRwf: 60000,
    syncStatus: 'SYNCED_LEDGER',
    createdAt: '2026-10-03 14:20:00',
    syncedAt: '2026-10-03 14:21:05',
  },
  {
    id: 'USSD-004',
    momoRef: 'MOMO-RW-6619480',
    ussdSessionCode: '*909*1*NYA-A01#',
    allocationId: 'ALC-2026-008',
    stallCode: 'NYA-A01',
    marketName: 'Nyabugogo Market',
    payerName: 'Mugisha Patrick',
    payerPhone: '+250 788 309 551',
    provider: 'MTN_MOMO',
    amountRwf: 120000,
    syncStatus: 'SYNCED_LEDGER',
    createdAt: '2026-10-04 11:12:30',
    syncedAt: '2026-10-04 11:12:55',
  },
];

const INITIAL_LEAKAGE_ALERTS: RevenueLeakageAlert[] = [
  {
    id: 'LKG-001',
    alertCode: 'ALR-2026-01',
    stallCode: 'NYA-D01',
    marketName: 'Nyabugogo Market',
    category: 'ILLEGAL_SUBLEASE_MARKUP',
    severity: 'CRITICAL',
    primaryHolderName: 'Bizimana Claude',
    operationalTenantName: 'Kamanzi Olivier',
    estimatedMonthlyLeakageRwf: 30000,
    description:
      'Sub-lease markup violation: Primary Asset Holder charges RWF 125,000/mo (+31.6% over RWF 95,000 Gov tariff), exceeding the 15% statutory administrative cap while leaving base rent unpaid past the 5th.',
    status: 'OPEN_INVESTIGATION',
    detectedAt: '2026-10-08 06:00',
  },
  {
    id: 'LKG-002',
    alertCode: 'ALR-2026-02',
    stallCode: 'KIM-B01',
    marketName: 'Kimironko Market',
    category: 'UNREMITTED_SUBTENANT_PASS_THROUGH',
    severity: 'HIGH',
    primaryHolderName: 'Habimana Jean Paul',
    operationalTenantName: 'Tuyisenge Fabrice',
    estimatedMonthlyLeakageRwf: 97200,
    description:
      'Pass-through remittance lag: Operational Sub-Tenant (Tuyisenge Fabrice) is actively trading on-site, but Primary Holder has not remitted October base rent (RWF 90,000 + RWF 7,200 penalty).',
    status: 'OPEN_INVESTIGATION',
    detectedAt: '2026-10-08 06:00',
  },
  {
    id: 'LKG-003',
    alertCode: 'ALR-2026-03',
    stallCode: 'NYA-A02',
    marketName: 'Nyabugogo Market',
    category: 'CHRONIC_FIFTH_DAY_DEFAULT',
    severity: 'MODERATE',
    primaryHolderName: 'Nkurunziza Emmanuel',
    operationalTenantName: null,
    estimatedMonthlyLeakageRwf: 129600,
    description:
      'Unpaid wholesale bay past the 5th deadline: RWF 120,000 principal + RWF 9,600 cumulative penalty accrued.',
    status: 'NOTICE_DISPATCHED',
    detectedAt: '2026-10-06 00:01',
  },
];

const INITIAL_RBAC_LOGS: RbacAuditEntry[] = [
  {
    id: 'AUD-904',
    timestamp: '2026-10-08 09:05:44',
    actorRole: 'FIELD_TAX_ENFORCER',
    actorName: 'Mutabazi Eric',
    actionType: 'USSD_OFFLINE_BUFFER',
    targetAsset: 'Stall KIM-D01',
    summary: 'Buffered offline Airtel Money receipt AIRT-RW-5120983 (RWF 86,400) via *909#',
    verificationHash: '8f4a92c1e0',
  },
  {
    id: 'AUD-903',
    timestamp: '2026-10-08 06:00:00',
    actorRole: 'SYSTEM_CRON_DAEMON',
    actorName: 'gmms-cron-service@kigali.gov.rw',
    actionType: 'PENALTY_CRON_EXEC',
    targetAsset: '12 Active Allocations',
    summary: 'Evaluated Day 8 (+3d past 5th): Applied 5% statutory + 3% daily surcharge on 5 accounts',
    verificationHash: '3b7e19d4a2',
  },
  {
    id: 'AUD-902',
    timestamp: '2026-10-07 15:18:22',
    actorRole: 'DISTRICT_REVENUE_AUDITOR',
    actorName: 'Uwizeyimana Jean Claude',
    actionType: 'LEAKAGE_FLAG_RAISED',
    targetAsset: 'Stall NYA-D01 (Permit SL-NYA-2026-058)',
    summary: 'Flagged +31.6% sub-lease markup violation between Bizimana Claude and Kamanzi Olivier',
    verificationHash: 'c91d04f8b5',
  },
  {
    id: 'AUD-901',
    timestamp: '2026-10-05 16:40:10',
    actorRole: 'MARKET_HUB_MASTER',
    actorName: 'Mugenzi Jean Bosco',
    actionType: 'SUBLEASE_PERMIT_AUDIT',
    targetAsset: 'Kimironko Hub (Zones A–D)',
    summary: 'Verified dual-tier sub-letting permits SL-GAS-2026-014 and SL-GAS-2026-029',
    verificationHash: '7a2c88e1f9',
  },
];

const ROLE_ACTOR_NAMES: Record<MunicipalRole, string> = {
  DISTRICT_REVENUE_AUDITOR: 'Uwizeyimana Jean Claude',
  MARKET_HUB_MASTER: 'Mugenzi Jean Bosco',
  FIELD_TAX_ENFORCER: 'Mutabazi Eric',
  SYSTEM_CRON_DAEMON: 'gmms-cron-service@kigali.gov.rw',
};

export default function App() {
  const [state, setState] = useState<GMMSState>(() => createInitialGMMSState('2026-10-08'));
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<ZoneFilterType>('ALL');
  const [ussdTransactions, setUssdTransactions] = useState<UssdMomoTransaction[]>(
    INITIAL_USSD_TRANSACTIONS
  );
  const [leakageAlerts, setLeakageAlerts] = useState<RevenueLeakageAlert[]>(
    INITIAL_LEAKAGE_ALERTS
  );
  const [rbacLogs, setRbacLogs] = useState<RbacAuditEntry[]>(INITIAL_RBAC_LOGS);
  const [activeRole, setActiveRole] = useState<MunicipalRole>('DISTRICT_REVENUE_AUDITOR');
  const [isXamppModalOpen, setIsXamppModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal 1: Allocate Stall Modal State
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState<boolean>(false);
  const [selectedStallIdForAlloc, setSelectedStallIdForAlloc] = useState<string>('');
  const [primaryVendorName, setPrimaryVendorName] = useState<string>('');
  const [primaryVendorNid, setPrimaryVendorNid] = useState<string>('1199080054120981');
  const [primaryVendorPhone, setPrimaryVendorPhone] = useState<string>('+250 788 450 120');
  const [tradeCategory, setTradeCategory] = useState<string>('Fresh Agricultural Produce');
  const [initialPaidRwf, setInitialPaidRwf] = useState<string>('0');
  const [enableSubLeaseOnAlloc, setEnableSubLeaseOnAlloc] = useState<boolean>(false);
  const [allocSubTenantName, setAllocSubTenantName] = useState<string>('');
  const [allocSubTenantNid, setAllocSubTenantNid] = useState<string>('1199680033102941');
  const [allocSubTenantPhone, setAllocSubTenantPhone] = useState<string>('+250 783 220 910');
  const [allocSubLeaseRent, setAllocSubLeaseRent] = useState<string>('66000');

  // Modal 2: Sub-Lease Link Modal State
  const [isSubLeaseModalOpen, setIsSubLeaseModalOpen] = useState<boolean>(false);
  const [targetAllocationForSub, setTargetAllocationForSub] = useState<StallAllocation | null>(null);
  const [subTenantName, setSubTenantName] = useState<string>('');
  const [subTenantNid, setSubTenantNid] = useState<string>('1199580071203948');
  const [subTenantPhone, setSubTenantPhone] = useState<string>('+250 788 601 334');
  const [subTenantTrade, setSubTenantTrade] = useState<string>('Retail Merchandise & Tailoring');
  const [subLeaseMonthlyCharge, setSubLeaseMonthlyCharge] = useState<string>('99000');

  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const appendRbacLog = (
    actionType: string,
    targetAsset: string,
    summary: string,
    roleOverride?: MunicipalRole
  ) => {
    const roleUsed = roleOverride || activeRole;
    const hash = Math.random().toString(16).slice(2, 12);
    const newEntry: RbacAuditEntry = {
      id: `AUD-${905 + rbacLogs.length}`,
      timestamp: `${state.simulatedDate} ${new Date().toTimeString().slice(0, 8)}`,
      actorRole: roleUsed,
      actorName: ROLE_ACTOR_NAMES[roleUsed],
      actionType,
      targetAsset,
      summary,
      verificationHash: hash,
    };
    setRbacLogs((prev) => [newEntry, ...prev]);
  };

  useEffect(() => {
    fetch('/api/state')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: GMMSState) => {
        if (data && Array.isArray(data.stalls)) {
          setState(data);
        }
      })
      .catch(() => {
        // Fallback already initialized with createInitialGMMSState
      });
  }, []);

  const scrollToSection = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const availableStalls = state.stalls.filter((s) => s.occupancyStatus === 'AVAILABLE');

  const handleOpenAllocateModal = (stall?: StallAsset) => {
    const target = stall && stall.occupancyStatus === 'AVAILABLE' ? stall : availableStalls[0];
    if (target) {
      setSelectedStallIdForAlloc(target.id);
      setAllocSubLeaseRent(String(Math.round(target.monthlyRentRwf * 1.1)));
    }
    setIsAllocateModalOpen(true);
  };

  const handleOpenSubLeaseModal = (allocation: StallAllocation) => {
    setTargetAllocationForSub(allocation);
    const existing = state.subLeases.find((sl) => sl.allocationId === allocation.id);
    if (existing) {
      setSubTenantName(existing.operationalTenantName);
      setSubTenantNid(existing.operationalTenantNid);
      setSubTenantPhone(existing.operationalTenantPhone);
      setSubTenantTrade(existing.operationalTrade);
      setSubLeaseMonthlyCharge(String(existing.subLeaseMonthlyChargeRwf));
    } else {
      setSubTenantName('');
      setSubTenantNid('1199580071203948');
      setSubTenantPhone('+250 788 601 334');
      setSubTenantTrade(allocation.tradeCategory);
      setSubLeaseMonthlyCharge(String(Math.round(allocation.baseRentRwf * 1.1)));
    }
    setIsSubLeaseModalOpen(true);
  };

  const handleRunPenaltyCron = async (
    targetDate: string,
    triggerType: 'CRON_SCHEDULED' | 'MANUAL_AUDIT' | 'DATE_SIMULATION' = 'MANUAL_AUDIT'
  ) => {
    try {
      const res = await fetch('/api/run-penalty-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulatedDate: targetDate, triggerType }),
      });
      if (res.ok) {
        const data = await res.json();
        setState(data.state);
        const day = Number(targetDate.split('-')[2] || 8);
        appendRbacLog(
          'PENALTY_CRON_EXEC',
          `Billing Cycle ${targetDate}`,
          day > 5
            ? `Evaluated +${day - 5}d past 5th: Flagged ${data.latestAudit.overdueAccountsFlagged} overdue accounts (RWF ${data.latestAudit.totalPenaltiesAssessedRwf.toLocaleString()})`
            : `Evaluated ${targetDate} within 1st–5th grace window (RWF 0 late penalties)`
        );
        notify(
          day > 5
            ? `Penalty Cron evaluated ${targetDate} (+${day - 5}d past 5th): ${data.latestAudit.overdueAccountsFlagged} overdue accounts fined.`
            : `Penalty Cron evaluated ${targetDate} (Within 1st–5th Grace Period): RWF 0 late penalties applied.`
        );
        return;
      }
    } catch {
      // Local fallback execution
    }

    setState((prev) => {
      const updatedAllocations = prev.allocations.map((a) =>
        computeAllocationPenalties(a, targetDate)
      );
      const overdue = updatedAllocations.filter((a) => a.paymentStatus === 'OVERDUE_ARREARS');
      const totalPenalties = overdue.reduce((s, a) => s + a.totalPenaltyRwf, 0);
      const dayOfMonth = Number(targetDate.split('-')[2] || 8);
      const newLog = {
        id: `CRON-${targetDate.replace(/-/g, '')}-${String(prev.penaltyLogs.length + 1).padStart(
          3,
          '0'
        )}`,
        executedAt: `${targetDate} 08:00:00 CAT`,
        simulatedAssessmentDate: targetDate,
        dayOfMonthEvaluated: dayOfMonth,
        pastFifthThreshold: dayOfMonth > 5,
        accountsEvaluated: updatedAllocations.length,
        overdueAccountsFlagged: overdue.length,
        totalPenaltiesAssessedRwf: totalPenalties,
        triggerType,
      };
      return {
        ...prev,
        simulatedDate: targetDate,
        allocations: updatedAllocations,
        penaltyLogs: [newLog, ...prev.penaltyLogs],
      };
    });
    appendRbacLog(
      'PENALTY_CRON_EXEC',
      `Billing Cycle ${targetDate}`,
      `Executed 5th-day penalty engine for ${targetDate}`
    );
    notify(`Penalty Cron evaluated for ${targetDate}.`);
  };

  const handleSettleAllocation = async (allocationId: string) => {
    const target = state.allocations.find((a) => a.id === allocationId);
    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocationId }),
      });
      if (res.ok) {
        const data = await res.json();
        setState(data.state);
        if (target) {
          appendRbacLog(
            'ARREARS_SETTLEMENT',
            `Stall ${target.stallCode}`,
            `Settled RWF ${target.totalBalanceDueRwf.toLocaleString()} for ${target.primaryVendorName}`
          );
        }
        notify(`Allocation ${allocationId} settled in full. Arrears cleared.`);
        return;
      }
    } catch {
      // Local fallback
    }

    setState((prev) => ({
      ...prev,
      allocations: prev.allocations.map((a) =>
        a.id === allocationId
          ? computeAllocationPenalties(
              { ...a, paidAmountRwf: a.baseRentRwf, lastPaymentDate: prev.simulatedDate },
              prev.simulatedDate
            )
          : a
      ),
    }));
    notify(`Allocation ${allocationId} settled in full.`);
  };

  // USSD & MoMo Offline Queue Handlers
  const handleQueueUssdPayment = (
    txPayload: Omit<UssdMomoTransaction, 'id' | 'createdAt' | 'syncedAt'>
  ) => {
    const nowTime = `${state.simulatedDate} ${new Date().toTimeString().slice(0, 8)}`;
    const newTx: UssdMomoTransaction = {
      ...txPayload,
      id: `USSD-00${ussdTransactions.length + 1}`,
      createdAt: nowTime,
      syncedAt: txPayload.syncStatus === 'SYNCED_LEDGER' ? nowTime : null,
    };
    setUssdTransactions((prev) => [newTx, ...prev]);

    if (txPayload.syncStatus === 'SYNCED_LEDGER') {
      handleSettleAllocation(txPayload.allocationId);
      appendRbacLog(
        'USSD_DIRECT_SETTLE',
        `Stall ${txPayload.stallCode}`,
        `Direct *909# MoMo settlement ${txPayload.momoRef} (RWF ${txPayload.amountRwf.toLocaleString()})`,
        'FIELD_TAX_ENFORCER'
      );
      notify(`Direct *909# payment ${txPayload.momoRef} settled in GMMS Ledger.`);
    } else {
      appendRbacLog(
        'USSD_OFFLINE_BUFFER',
        `Stall ${txPayload.stallCode}`,
        `Queued offline USSD receipt ${txPayload.momoRef} (RWF ${txPayload.amountRwf.toLocaleString()})`,
        'FIELD_TAX_ENFORCER'
      );
      notify(`Offline USSD payment ${txPayload.momoRef} cached. Click 'Sync Offline Queue' to commit.`);
    }
  };

  const handleSyncOfflineQueue = async () => {
    const queuedList = ussdTransactions.filter((t) => t.syncStatus === 'QUEUED_OFFLINE');
    if (queuedList.length === 0) return;

    const nowTime = `${state.simulatedDate} ${new Date().toTimeString().slice(0, 8)}`;
    setUssdTransactions((prev) =>
      prev.map((tx) =>
        tx.syncStatus === 'QUEUED_OFFLINE'
          ? { ...tx, syncStatus: 'SYNCED_LEDGER', syncedAt: nowTime }
          : tx
      )
    );

    // Settle all allocations covered by the offline queue
    for (const tx of queuedList) {
      await handleSettleAllocation(tx.allocationId);
    }

    const totalSyncedRwf = queuedList.reduce((s, t) => s + t.amountRwf, 0);
    appendRbacLog(
      'MOMO_BATCH_SYNC',
      `${queuedList.length} Stall Accounts`,
      `Synchronized ${queuedList.length} buffered *909# MoMo payments totaling RWF ${totalSyncedRwf.toLocaleString()}`
    );
    notify(
      `Synchronized ${queuedList.length} offline USSD/MoMo payments (RWF ${totalSyncedRwf.toLocaleString()}) to ledger!`
    );
  };

  // Leakage Alert Status Handler
  const handleUpdateAlertStatus = (
    alertId: string,
    newStatus: 'NOTICE_DISPATCHED' | 'RESOLVED'
  ) => {
    const target = leakageAlerts.find((a) => a.id === alertId);
    setLeakageAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: newStatus } : a))
    );
    if (target) {
      appendRbacLog(
        newStatus === 'RESOLVED' ? 'LEAKAGE_RESOLVED' : 'STATUTORY_NOTICE_SENT',
        `Stall ${target.stallCode}`,
        `${newStatus === 'RESOLVED' ? 'Enforced and resolved' : 'Dispatched SMS notice for'} anomaly ${
          target.alertCode
        } (${target.primaryHolderName})`
      );
      notify(
        newStatus === 'RESOLVED'
          ? `Leakage Alert ${target.alertCode} enforced and marked resolved.`
          : `Statutory SMS compliance notice dispatched to ${target.primaryHolderName}.`
      );
    }
  };

  const handleToggleMaintenance = async (stallId: string) => {
    const st = state.stalls.find((s) => s.id === stallId);
    try {
      const res = await fetch('/api/toggle-stall-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stallId }),
      });
      if (res.ok) {
        const data = await res.json();
        setState(data.state);
        if (st) {
          appendRbacLog(
            'STALL_MAINTENANCE_TOGGLE',
            `Stall ${st.stallCode}`,
            `Updated spatial state for ${st.stallCode} in ${st.marketName}`
          );
        }
        notify('Updated stall maintenance status in spatial grid.');
        return;
      }
    } catch {
      // Fallback
    }

    setState((prev) => ({
      ...prev,
      stalls: prev.stalls.map((s) =>
        s.id === stallId
          ? {
              ...s,
              occupancyStatus: s.occupancyStatus === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE',
            }
          : s
      ),
    }));
  };

  const handleCreateAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryVendorName.trim() || !selectedStallIdForAlloc) return;
    const st = state.stalls.find((s) => s.id === selectedStallIdForAlloc);

    try {
      const res = await fetch('/api/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stallId: selectedStallIdForAlloc,
          primaryVendorName,
          primaryVendorNid,
          primaryVendorPhone,
          tradeCategory,
          initialPaidRwf: Number(initialPaidRwf) || 0,
          enableSubLease: enableSubLeaseOnAlloc,
          operationalTenantName: allocSubTenantName,
          operationalTenantNid: allocSubTenantNid,
          operationalTenantPhone: allocSubTenantPhone,
          operationalTrade: tradeCategory,
          subLeaseMonthlyChargeRwf: Number(allocSubLeaseRent) || 75000,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setState(data.state);
        appendRbacLog(
          'STALL_ALLOCATED',
          `Stall ${st?.stallCode || selectedStallIdForAlloc}`,
          `Allocated stall to Primary Holder ${primaryVendorName} (NID: ${primaryVendorNid})`
        );
        setIsAllocateModalOpen(false);
        setPrimaryVendorName('');
        setAllocSubTenantName('');
        notify('New stall allocated and Visual Stall Map updated.');
        return;
      }
    } catch {
      // Fallback handled if offline
    }
  };

  const handleCreateSubLease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAllocationForSub || !subTenantName.trim()) return;

    try {
      const res = await fetch('/api/sublease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocationId: targetAllocationForSub.id,
          operationalTenantName: subTenantName,
          operationalTenantNid: subTenantNid,
          operationalTenantPhone: subTenantPhone,
          operationalTrade: subTenantTrade,
          subLeaseMonthlyChargeRwf:
            Number(subLeaseMonthlyCharge) || targetAllocationForSub.baseRentRwf,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setState(data.state);
        appendRbacLog(
          'DUAL_TIER_SUBLEASE_LINK',
          `Stall ${targetAllocationForSub.stallCode}`,
          `Linked Primary Holder ${targetAllocationForSub.primaryVendorName} to Sub-Tenant ${subTenantName}`
        );
        setIsSubLeaseModalOpen(false);
        notify(`Relational Sub-Lease linked for Stall ${targetAllocationForSub.stallCode}.`);
        return;
      }
    } catch {
      // Fallback
    }
  };

  const handleRevokeSubLease = async (subLeaseId: string) => {
    const target = state.subLeases.find((s) => s.id === subLeaseId);
    try {
      const res = await fetch('/api/revoke-sublease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subLeaseId }),
      });
      if (res.ok) {
        const data = await res.json();
        setState(data.state);
        if (target) {
          appendRbacLog(
            'SUBLEASE_TERMINATED',
            `Stall ${target.stallCode} (${target.permitNumber})`,
            `Terminated sub-lease for ${target.operationalTenantName}; reverted to ${target.primaryVendorName}`
          );
        }
        notify('Sub-lease terminated. Stall returned to direct Primary Holder operation.');
        return;
      }
    } catch {
      // Fallback
    }
  };

  const handleResetDemo = async () => {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setState(data.state);
        setSelectedZoneFilter('ALL');
        setUssdTransactions(INITIAL_USSD_TRANSACTIONS);
        setLeakageAlerts(INITIAL_LEAKAGE_ALERTS);
        setRbacLogs(INITIAL_RBAC_LOGS);
        notify('GMMS dataset reset to default Rwandan municipal seed state.');
      }
    } catch {
      setState(createInitialGMMSState('2026-10-08'));
    }
  };

  // Computed KPI Metrics
  const occupiedOrSubLeasedCount = state.stalls.filter(
    (s) => s.occupancyStatus === 'OCCUPIED' || s.occupancyStatus === 'SUB_LEASED'
  ).length;
  const availableCount = state.stalls.filter((s) => s.occupancyStatus === 'AVAILABLE').length;
  const maintenanceCount = state.stalls.filter((s) => s.occupancyStatus === 'MAINTENANCE').length;
  const totalCollectedRwf = state.allocations.reduce((s, a) => s + a.paidAmountRwf, 0);
  const totalPenaltiesRwf = state.allocations.reduce((s, a) => s + a.totalPenaltyRwf, 0);
  const totalArrearsBalanceRwf = state.allocations.reduce((s, a) => s + a.totalBalanceDueRwf, 0);
  const overdueAccountsCount = state.allocations.filter(
    (a) => a.paymentStatus === 'OVERDUE_ARREARS'
  ).length;
  const queuedUssdCount = ussdTransactions.filter(
    (t) => t.syncStatus === 'QUEUED_OFFLINE'
  ).length;
  const openLeakageCount = leakageAlerts.filter((a) => a.status !== 'RESOLVED').length;

  // Market-specific stats for Hub Showcases
  const kimironkoStalls = state.stalls.filter((s) => s.marketId === 'MKT-KIM');
  const kimironkoActive = kimironkoStalls.filter(
    (s) => s.occupancyStatus === 'OCCUPIED' || s.occupancyStatus === 'SUB_LEASED'
  ).length;
  const kimironkoVacant = kimironkoStalls.filter((s) => s.occupancyStatus === 'AVAILABLE').length;

  const nyabugogoStalls = state.stalls.filter((s) => s.marketId === 'MKT-NYA');
  const nyabugogoActive = nyabugogoStalls.filter(
    (s) => s.occupancyStatus === 'OCCUPIED' || s.occupancyStatus === 'SUB_LEASED'
  ).length;
  const nyabugogoVacant = nyabugogoStalls.filter((s) => s.occupancyStatus === 'AVAILABLE').length;

  const dayOfMonth = Number(state.simulatedDate.split('-')[2] || 8);

  return (
    <div id="top" className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Strict 3-Zone Top Bar Contract (Single-Page Smooth Anchor Navigation) */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="text-lg font-bold tracking-tight text-slate-950 font-display whitespace-nowrap"
        >
          GMMS Rwanda
        </a>

        {/* Zone 2: 4 clean single-line navigation links to the 3 Main Feature Suites + Market Sectors */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => scrollToSection('market-sectors')}
            className="hover:text-slate-950 transition-colors whitespace-nowrap"
          >
            Market Sectors
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('spatial-modules')}
            className="hover:text-slate-950 transition-colors whitespace-nowrap"
          >
            01. Spatial &amp; Sub-Letting
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('financial-compliance')}
            className="hover:text-slate-950 transition-colors whitespace-nowrap"
          >
            02. Financial &amp; USSD Sync
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('audit-security')}
            className="hover:text-slate-950 transition-colors whitespace-nowrap"
          >
            03. Audit &amp; Forecasting
          </button>
        </nav>

        {/* Zone 3: 2 primary actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsXamppModalOpen(true)}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            XAMPP &amp; SQL Code
          </button>
          <button
            type="button"
            onClick={() => handleOpenAllocateModal()}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            + Allocate Stall
          </button>
        </div>
      </header>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700 text-xs font-medium flex items-center gap-3">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* UNIFIED SINGLE-PAGE HOME & COMMAND WORKSPACE */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-12">
        {/* ====================================================================
            HERO SECTION + LIVE CRON BAR + QUANTITATIVE PROOF STRIP
           ==================================================================== */}
        <section className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 shadow-sm">
          <div className="relative min-h-[430px] flex flex-col justify-between">
            {/* High-Resolution Kigali Market Hero with Measured Contrast Scrim */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
              <img
                src={HERO_IMAGE_PATH}
                alt="Kigali Municipal Covered Marketplace Pavilion with organized vendor stalls"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center opacity-65"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/35" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
            </div>

            {/* Hero Foreground Editorial Content */}
            <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-3xl space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-emerald-400 tracking-wide">
                <span>Republic of Rwanda Local Government</span>
                <span aria-hidden="true">·</span>
                <span>Kimironko &amp; Nyabugogo Hubs</span>
                <span aria-hidden="true">·</span>
                <span>Level 4 Full-Stack Architecture</span>
              </div>

              <h1
                className="text-2xl sm:text-4xl lg:text-[42px] font-bold text-white font-display tracking-tight leading-[1.14]"
                style={{ textWrap: 'balance' }}
              >
                Smart Municipal Market Supervision, Automated Compliance &amp; Predictive Auditing.
              </h1>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl">
                An integrated command platform uniting dynamic visual stall mapping, dual-tier sub-letting ledgers, 5th-day arrears penalty automation, offline USSD (*909#) &amp; MoMo synchronization, and role-based revenue leakage auditing.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenAllocateModal()}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Allocate Vacant Municipal Stall</span>
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('spatial-modules')}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap"
                >
                  01. Spatial &amp; Sub-Letting
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('financial-compliance')}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap"
                >
                  02. 5th-Day Fines &amp; *909# USSD
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('audit-security')}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap"
                >
                  03. Leakage Audit &amp; Forecast
                </button>
              </div>
            </div>

            {/* Integrated Bottom Simulation Bar inside Hero */}
            <div className="relative z-10 bg-slate-950/90 border-t border-white/10 px-6 sm:px-10 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Active Billing Assessment Date:</span>
                </span>
                <span className="font-mono font-semibold text-white tabular-nums">
                  {state.simulatedDate}
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span
                  className={`font-medium ${
                    dayOfMonth > 5 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {dayOfMonth > 5
                    ? `Day ${dayOfMonth} (+${dayOfMonth - 5} Days Past 5th Deadline · ${
                        5 + (dayOfMonth - 5)
                      }% Cumulative Fine Rate)`
                    : `Day ${dayOfMonth} (Within 1st–5th Statutory Grace Window · 0% Penalty)`}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 mr-1">Simulate Cron Date:</span>
                {QUICK_SIM_DATES.map((item) => {
                  const isCurrent = state.simulatedDate === item.date;
                  return (
                    <button
                      key={item.date}
                      type="button"
                      onClick={() => handleRunPenaltyCron(item.date, 'DATE_SIMULATION')}
                      className={`px-2.5 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap tabular-nums ${
                        isCurrent
                          ? 'bg-emerald-500 text-slate-950 font-semibold'
                          : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
                <input
                  type="date"
                  value={state.simulatedDate}
                  aria-label="Custom Simulation Date"
                  onChange={(e) => handleRunPenaltyCron(e.target.value, 'DATE_SIMULATION')}
                  className="bg-slate-900 border border-slate-700 text-white text-xs font-mono rounded px-2 py-1 focus:outline-none focus:border-emerald-400 tabular-nums"
                />
                <button
                  type="button"
                  onClick={handleResetDemo}
                  title="Reset Dataset to Seed Defaults"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quantitative Proof Strip Attached Directly Below Hero */}
          <div className="bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            <div className="p-5">
              <div className="text-xs font-medium text-slate-500">
                01. Spatial Grid &amp; Dual-Tier Ledger
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {occupiedOrSubLeasedCount} / {state.stalls.length} Stalls
              </div>
              <div className="text-xs text-slate-600 mt-1.5 flex items-center gap-1.5 font-mono tabular-nums">
                <span className="text-emerald-700 font-medium">{availableCount} Vacant</span>
                <span aria-hidden="true">·</span>
                <span>{state.subLeases.length} Sub-Leased</span>
                <span aria-hidden="true">·</span>
                <span>{maintenanceCount} Maint</span>
              </div>
            </div>

            <div className="p-5">
              <div className="text-xs font-medium text-slate-500">
                02. 5th-Day Arrears &amp; Penalties
              </div>
              <div className="text-2xl font-bold text-red-700 font-mono tabular-nums mt-1">
                RWF {totalPenaltiesRwf.toLocaleString()}
              </div>
              <div className="text-xs text-slate-600 mt-1.5 font-mono tabular-nums">
                {overdueAccountsCount} Overdue · Total Due RWF{' '}
                {totalArrearsBalanceRwf.toLocaleString()}
              </div>
            </div>

            <div className="p-5">
              <div className="text-xs font-medium text-slate-500">
                02B. Offline USSD (*909#) &amp; MoMo Queue
              </div>
              <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
                RWF {totalCollectedRwf.toLocaleString()}
              </div>
              <div className="text-xs text-slate-600 mt-1.5 font-mono tabular-nums">
                {queuedUssdCount} Offline Receipts Buffered for Sync
              </div>
            </div>

            <div className="p-5">
              <div className="text-xs font-medium text-slate-500">
                03. Audit, Leakage &amp; Forecasting
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {openLeakageCount} Active Alerts
              </div>
              <div className="text-xs text-slate-600 mt-1.5 font-mono tabular-nums">
                {rbacLogs.length} RBAC Audit Logs · 4 Zones Forecasted
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            ASYMMETRIC BENTO SHOWCASE: MUNICIPAL HUBS (7 COLS) + 3 MAIN PROJECT PILLARS (5 COLS)
           ==================================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 7 Columns: Kimironko & Nyabugogo Municipal Hub Spotlight */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs font-medium text-emerald-700">
                  Digitized Municipal Hubs · Kigali City
                </div>
                <h2 className="text-xl font-bold text-slate-900 font-display mt-0.5">
                  Supervised Commercial Marketplaces
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                2 Active District Hubs · 32 Spatial Bays
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Hub 1: Kimironko Market */}
              <div className="group flex flex-col justify-between border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                <div>
                  <div className="relative aspect-4/3 bg-slate-900 overflow-hidden">
                    <img
                      src={KIMIRONKO_IMAGE_PATH}
                      alt="Kimironko Market stalls featuring Rwandan Agaseke baskets and Kitenge textiles"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <div className="text-[11px] text-emerald-300 font-medium">
                        Gasabo District · Kimironko Sector
                      </div>
                      <h3 className="text-base font-bold leading-snug">
                        Kimironko Market Hub
                      </h3>
                    </div>
                  </div>

                  <div className="p-4 space-y-2.5 text-xs">
                    <p className="text-slate-600 leading-relaxed">
                      Zones A–D covering Fresh Produce, Kitenge Textiles, Agaseke Crafts, and Cold Chain Butchery.
                    </p>
                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between font-mono tabular-nums text-slate-700">
                      <span>{kimironkoActive} / 16 Occupied</span>
                      <span className="text-emerald-700 font-semibold">
                        {kimironkoVacant} Vacant
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Hub Master: Mugenzi Jean Bosco
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-600 tabular-nums">
                    RWF 60k – 110k / mo
                  </span>
                  <button
                    type="button"
                    onClick={() => scrollToSection('spatial-modules')}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>Inspect Spatial Grid</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Hub 2: Nyabugogo Market */}
              <div className="group flex flex-col justify-between border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                <div>
                  <div className="relative aspect-4/3 bg-slate-900 overflow-hidden">
                    <img
                      src={NYABUGOGO_IMAGE_PATH}
                      alt="Nyabugogo Market wholesale agricultural grain stalls and commercial bays"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <div className="text-[11px] text-emerald-300 font-medium">
                        Nyarugenge District · Muhima Sector
                      </div>
                      <h3 className="text-base font-bold leading-snug">
                        Nyabugogo Market Hub
                      </h3>
                    </div>
                  </div>

                  <div className="p-4 space-y-2.5 text-xs">
                    <p className="text-slate-600 leading-relaxed">
                      Inter-district wholesale grains, domestic hardware bays, footwear, and solar electronics.
                    </p>
                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between font-mono tabular-nums text-slate-700">
                      <span>{nyabugogoActive} / 16 Occupied</span>
                      <span className="text-emerald-700 font-semibold">
                        {nyabugogoVacant} Vacant
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Hub Master: Mukandayisenga Solange
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-600 tabular-nums">
                    RWF 80k – 120k / mo
                  </span>
                  <button
                    type="button"
                    onClick={() => scrollToSection('spatial-modules')}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>Inspect Spatial Grid</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: The 3 Core Project Architecture Pillars */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
            <div className="border-b border-slate-200 pb-4">
              <div className="text-xs font-medium text-slate-500">
                Core GMMS Project Architecture
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-display mt-0.5">
                Three Main Feature Pillars
              </h2>
            </div>

            <div className="divide-y divide-slate-200 my-auto">
              {/* Pillar 01 */}
              <div className="py-4 first:pt-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    01. Smart Operational &amp; Spatial Modules
                  </h3>
                  <button
                    type="button"
                    onClick={() => scrollToSection('spatial-modules')}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
                  >
                    Jump to Suite 01 →
                  </button>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Dynamic Visual Grid Stall Mapping</strong> (32-bay spatial state array with JSON inspector) &amp; <strong>Dual-Tier Sub-Letting Ledger</strong> linking Primary Asset Holders to Operational Sub-Tenants.
                </p>
                <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                  {occupiedOrSubLeasedCount} Active Stalls · {state.subLeases.length} Dual-Tier Sub-Leases
                </div>
              </div>

              {/* Pillar 02 */}
              <div className="py-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    02. Automated Financial Compliance
                  </h3>
                  <button
                    type="button"
                    onClick={() => scrollToSection('financial-compliance')}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
                  >
                    Jump to Suite 02 →
                  </button>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Smart Arrears &amp; Penalty Automation</strong> (5% statutory fee + 1%/day past the 5th of the month) &amp; <strong>Integrated Offline USSD (*909#) and MoMo Sync Mockup</strong>.
                </p>
                <div className="text-[11px] font-mono text-red-700 font-medium tabular-nums">
                  RWF {totalPenaltiesRwf.toLocaleString()} Active Fines · {queuedUssdCount} Offline USSD Buffered
                </div>
              </div>

              {/* Pillar 03 */}
              <div className="py-4 last:pb-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    03. Administrative Audit &amp; Security
                  </h3>
                  <button
                    type="button"
                    onClick={() => scrollToSection('audit-security')}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
                  >
                    Jump to Suite 03 →
                  </button>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Automated Revenue Leakage Alerts</strong> (&gt;15% sub-lease gouging &amp; unremitted pass-throughs), <strong>Role-Based Audit Trail Logging (RBAC)</strong>, &amp; <strong>Predictive Marketspace Forecasting</strong>.
                </p>
                <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                  {openLeakageCount} Leakage Alerts · {rbacLogs.length} RBAC Entries Logged
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                XAMPP MySQL 3306 &amp; PHP PDO Source Files
              </span>
              <button
                type="button"
                onClick={() => setIsXamppModalOpen(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Open XAMPP Code Studio</span>
              </button>
            </div>
          </div>
        </section>

        {/* ====================================================================
            GOVERNMENT MARKET COMMERCIAL SECTORS GALLERY (ZONES A–D)
           ==================================================================== */}
        <section
          id="market-sectors"
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 scroll-mt-20"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="text-xs font-medium text-emerald-700">
                Municipal Zoning &amp; Trade Classification · Zones A–D
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-display mt-0.5">
                Government Market Commercial Sectors
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Each municipal marketplace is partitioned into four specialized trade zones with standardized stall dimensions and tariff brackets. Click any sector to filter the spatial stall grid below.
              </p>
            </div>

            {selectedZoneFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedZoneFilter('ALL')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg transition-colors self-start sm:self-auto whitespace-nowrap"
              >
                Reset Sector Filter ({selectedZoneFilter})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {GOVERNMENT_MARKET_SECTORS.map((sector) => {
              const zoneStalls = state.stalls.filter((s) =>
                s.zoneName.startsWith(sector.zoneKey)
              );
              const zoneOccupied = zoneStalls.filter(
                (s) =>
                  s.occupancyStatus === 'OCCUPIED' ||
                  s.occupancyStatus === 'SUB_LEASED'
              ).length;
              const zoneVacant = zoneStalls.filter(
                (s) => s.occupancyStatus === 'AVAILABLE'
              ).length;
              const isZoneSelected = selectedZoneFilter === sector.zoneKey;

              return (
                <div
                  key={sector.zoneKey}
                  className={`group flex flex-col justify-between rounded-lg border overflow-hidden transition-all ${
                    isZoneSelected
                      ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/10'
                      : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="relative aspect-4/3 bg-slate-900 overflow-hidden">
                      <img
                        src={sector.imagePath}
                        alt={sector.imageAlt}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />
                      <div className="absolute top-3 left-3 text-[11px] font-mono font-semibold text-white bg-slate-950/75 px-2 py-0.5 rounded">
                        {sector.zoneLabel}
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <div className="text-[11px] text-emerald-300 font-medium">
                          {sector.localSubtitle}
                        </div>
                        <h3 className="text-sm font-bold leading-snug mt-0.5">
                          {sector.title}
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 space-y-3 text-xs">
                      <p className="text-slate-600 leading-relaxed">
                        {sector.description}
                      </p>
                      <div className="pt-2.5 border-t border-slate-200/80 space-y-1 font-mono tabular-nums text-[11px]">
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Tariff Bracket:</span>
                          <span className="font-semibold text-slate-900">
                            {sector.tariffBracket}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Stall Status:</span>
                          <span>
                            <strong className="text-slate-900">{zoneOccupied} Active</strong>
                            {' · '}
                            <strong className="text-emerald-700">{zoneVacant} Vacant</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                      {sector.stallDimension}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedZoneFilter(
                          isZoneSelected ? 'ALL' : sector.zoneKey
                        );
                        scrollToSection('spatial-modules');
                      }}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      <span>
                        {isZoneSelected
                          ? 'Showing Sector'
                          : `Filter ${sector.zoneKey}`}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ====================================================================
            FEATURE SUITE 01: SMART OPERATIONAL & SPATIAL MODULES
            (Dynamic Visual Grid Stall Mapping + Dual-Tier Sub-Letting Ledger)
           ==================================================================== */}
        <section id="spatial-modules" className="space-y-6 scroll-mt-20">
          <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-emerald-700">
                Main Feature Suite 01 · Spatial &amp; Relational Asset Control
              </div>
              <h2 className="text-2xl font-bold text-slate-950 font-display mt-0.5">
                Smart Operational &amp; Spatial Modules
              </h2>
            </div>
            <div className="text-xs text-slate-500">
              Dynamic Visual Grid Stall Mapping · Dual-Tier Sub-Letting Ledger
            </div>
          </div>

          {/* 01A: Dynamic Visual Grid Stall Mapping */}
          <VisualStallMap
            stalls={state.stalls}
            allocations={state.allocations}
            subLeases={state.subLeases}
            simulatedDate={state.simulatedDate}
            selectedZoneFilter={selectedZoneFilter}
            onZoneFilterChange={setSelectedZoneFilter}
            onOpenAllocateModal={handleOpenAllocateModal}
            onOpenSubLeaseModal={handleOpenSubLeaseModal}
            onSettleAllocation={handleSettleAllocation}
            onToggleMaintenance={handleToggleMaintenance}
          />

          {/* 01B: Dual-Tier Sub-Letting Relational Ledger */}
          <SubLeaseLedgerPanel
            subLeases={state.subLeases}
            allocations={state.allocations}
            onOpenSubLeaseModal={handleOpenSubLeaseModal}
            onRevokeSubLease={handleRevokeSubLease}
          />
        </section>

        {/* ====================================================================
            FEATURE SUITE 02: AUTOMATED FINANCIAL COMPLIANCE
            (Smart Arrears & Penalty Automation + Offline USSD *909# & MoMo Sync)
           ==================================================================== */}
        <section id="financial-compliance" className="space-y-6 scroll-mt-20">
          <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-emerald-700">
                Main Feature Suite 02 · Algorithmic Arrears &amp; Last-Mile Mobile Collection
              </div>
              <h2 className="text-2xl font-bold text-slate-950 font-display mt-0.5">
                Automated Financial Compliance
              </h2>
            </div>
            <div className="text-xs text-slate-500">
              5th-of-Month Smart Penalty Cron · Offline USSD (*909#) &amp; MoMo Sync Terminal
            </div>
          </div>

          {/* 02A: Smart Arrears & 5th-Day Penalty Automation */}
          <PenaltyAutomationPanel
            simulatedDate={state.simulatedDate}
            allocations={state.allocations}
            penaltyLogs={state.penaltyLogs}
            onRunPenaltyCron={handleRunPenaltyCron}
            onSettleAllocation={handleSettleAllocation}
          />

          {/* 02B: Integrated Offline USSD (*909#) & Mobile Money (MoMo) Sync Mockup */}
          <OfflineUssdMomoPanel
            allocations={state.allocations}
            simulatedDate={state.simulatedDate}
            transactions={ussdTransactions}
            onQueueUssdPayment={handleQueueUssdPayment}
            onSyncOfflineQueue={handleSyncOfflineQueue}
          />
        </section>

        {/* ====================================================================
            FEATURE SUITE 03: ADMINISTRATIVE AUDIT & SECURITY
            (Automated Revenue Leakage Alerts, Role-Based Audit Trail, Predictive Forecasting)
           ==================================================================== */}
        <section id="audit-security" className="space-y-6 scroll-mt-20">
          <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-emerald-700">
                Main Feature Suite 03 · Governance, RBAC Security &amp; Capacity Telemetry
              </div>
              <h2 className="text-2xl font-bold text-slate-950 font-display mt-0.5">
                Administrative Audit &amp; Security
              </h2>
            </div>
            <div className="text-xs text-slate-500">
              Automated Revenue Leakage Alerts · Role-Based Audit Trail · Predictive Marketspace Forecasting
            </div>
          </div>

          <AuditAndForecastingSuite
            stalls={state.stalls}
            allocations={state.allocations}
            subLeases={state.subLeases}
            leakageAlerts={leakageAlerts}
            rbacLogs={rbacLogs}
            activeRole={activeRole}
            onSelectRole={(newRole) => {
              setActiveRole(newRole);
              notify(`Switched active RBAC session role to ${newRole}.`);
            }}
            onUpdateAlertStatus={handleUpdateAlertStatus}
          />
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 px-6 mt-12">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            &copy; 2026 GMMS (Government Market Management System) · L4 Software Development Project
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsXamppModalOpen(true)}
              className="hover:text-slate-900 underline"
            >
              Inspect XAMPP PHP &amp; MySQL 3306 Source Package
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL: XAMPP & SQL Source Code Studio Drawer */}
      {isXamppModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-50 rounded-xl border border-slate-200 shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-semibold text-base font-display">
                  XAMPP / Apache (Port 80) / MySQL (Port 3306) &amp; PHP Source Package
                </h3>
                <p className="text-xs text-slate-400">
                  Complete SQL DDL, PHP PDO API, Cron Script, and Standalone index.html
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsXamppModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <XamppCodeStudio />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Allocate Available Stall to Primary Asset Holder */}
      {isAllocateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base">Register New Stall Allocation</h3>
                <p className="text-xs text-slate-400">
                  Assigns a vacant municipal stall to a verified Rwandan Primary Asset Holder
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAllocateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAllocation} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Vacant Municipal Stall
                </label>
                <select
                  value={selectedStallIdForAlloc}
                  onChange={(e) => {
                    setSelectedStallIdForAlloc(e.target.value);
                    const st = state.stalls.find((s) => s.id === e.target.value);
                    if (st) {
                      setAllocSubLeaseRent(String(Math.round(st.monthlyRentRwf * 1.1)));
                    }
                  }}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                >
                  {availableStalls.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.stallCode} · {s.marketName} ({s.zoneName}) — RWF{' '}
                      {s.monthlyRentRwf.toLocaleString()}/mo
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Asset Holder Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={primaryVendorName}
                    onChange={(e) => setPrimaryVendorName(e.target.value)}
                    placeholder="e.g. Kalisa Jean Damascene"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rwandan National ID (16 Digits)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={primaryVendorNid}
                    onChange={(e) => setPrimaryVendorNid(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={primaryVendorPhone}
                    onChange={(e) => setPrimaryVendorPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Rent Paid Today (RWF)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={initialPaidRwf}
                    onChange={(e) => setInitialPaidRwf(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono tabular-nums"
                  />
                  <span className="text-[11px] text-slate-500">
                    Leave 0 to test 5th-of-the-month overdue penalty calculation
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Commercial Trade Category
                </label>
                <input
                  type="text"
                  required
                  value={tradeCategory}
                  onChange={(e) => setTradeCategory(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Optional Sub-Lease Registration at Allocation Time */}
              <div className="pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableSubLeaseOnAlloc}
                    onChange={(e) => setEnableSubLeaseOnAlloc(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span>
                    Also Link an Operational Sub-Tenant (Dual-Tier Sub-Letting)
                  </span>
                </label>

                {enableSubLeaseOnAlloc && (
                  <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Operational Sub-Tenant Name
                        </label>
                        <input
                          type="text"
                          required={enableSubLeaseOnAlloc}
                          value={allocSubTenantName}
                          onChange={(e) => setAllocSubTenantName(e.target.value)}
                          placeholder="e.g. Mutesi Grace"
                          className="w-full p-2 border border-slate-300 rounded-md text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Sub-Tenant National ID
                        </label>
                        <input
                          type="text"
                          required={enableSubLeaseOnAlloc}
                          value={allocSubTenantNid}
                          onChange={(e) => setAllocSubTenantNid(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-md text-xs font-mono bg-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Sub-Tenant Phone
                        </label>
                        <input
                          type="tel"
                          value={allocSubTenantPhone}
                          onChange={(e) => setAllocSubTenantPhone(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-md text-xs font-mono bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Agreed Monthly Sub-Lease Rent (RWF)
                        </label>
                        <input
                          type="number"
                          value={allocSubLeaseRent}
                          onChange={(e) => setAllocSubLeaseRent(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-md text-xs font-mono bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAllocateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  Save Stall Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Link / Update Operational Sub-Tenant */}
      {isSubLeaseModalOpen && targetAllocationForSub && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base">
                  Link Operational Sub-Tenant · {targetAllocationForSub.stallCode}
                </h3>
                <p className="text-xs text-slate-400">
                  Primary Holder: {targetAllocationForSub.primaryVendorName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSubLeaseModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubLease} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Primary Asset Holder:</span>
                  <span className="font-semibold text-slate-900">
                    {targetAllocationForSub.primaryVendorName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Official Government Base Tariff:</span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    RWF {targetAllocationForSub.baseRentRwf.toLocaleString()} / mo
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Max 15% Authorized Sub-Rent:</span>
                  <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                    RWF {Math.round(targetAllocationForSub.baseRentRwf * 1.15).toLocaleString()} / mo
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Operational Tenant Full Name
                </label>
                <input
                  type="text"
                  required
                  value={subTenantName}
                  onChange={(e) => setSubTenantName(e.target.value)}
                  placeholder="e.g. Nshimiyimana Olivier"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tenant National ID (16 Digits)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={subTenantNid}
                    onChange={(e) => setSubTenantNid(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tenant Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={subTenantPhone}
                    onChange={(e) => setSubTenantPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    On-Site Trade Activity
                  </label>
                  <input
                    type="text"
                    required
                    value={subTenantTrade}
                    onChange={(e) => setSubTenantTrade(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly Sub-Lease Rent (RWF)
                  </label>
                  <input
                    type="number"
                    required
                    value={subLeaseMonthlyCharge}
                    onChange={(e) => setSubLeaseMonthlyCharge(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSubLeaseModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  Save Relational Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
