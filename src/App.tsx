import React, { useEffect, useState } from 'react';
import {
  GMMSState,
  StallAllocation,
  StallAsset,
} from './types/gmms';
import {
  computeAllocationPenalties,
  createInitialGMMSState,
} from './data/seedData';
import { VisualStallMap, ZoneFilterType } from './components/VisualStallMap';
import { PenaltyAutomationPanel } from './components/PenaltyAutomationPanel';
import { SubLeaseLedgerPanel } from './components/SubLeaseLedgerPanel';
import { XamppCodeStudio } from './components/XamppCodeStudio';
import {
  Plus,
  Search,
  RotateCcw,
  X,
  ArrowRight,
  Calendar,
} from 'lucide-react';

type ActiveTab = 'dashboard' | 'stall_map' | 'penalties' | 'subleases' | 'xampp_code';

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
    imageAlt: 'Kigali Municipal Market Fresh Agricultural Produce stalls with plantains, avocados, and tomatoes',
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
    imageAlt: 'Kitenge and Apparel Textiles stalls with colorful wax-print fabrics and sewing workstations',
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
    imageAlt: 'Agaseke Cooperative stalls at Kimironko Market with handwoven baskets and Imigongo geometric art',
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
    imageAlt: 'Kigali Municipal Market Dairy Cold Chain counter and Domestic Hardware & Solar Lamps section',
    description:
      'Hygienic tiled bays equipped with three-phase power for refrigerated dairy/butchery units and solar electronics.',
    tariffBracket: 'RWF 95,000 – 110,000 / mo',
    stallDimension: '18m² – 20m² Bays',
  },
];

export default function App() {
  const [state, setState] = useState<GMMSState>(() => createInitialGMMSState('2026-10-08'));
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'MKT-KIM' | 'MKT-NYA'>('ALL');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<ZoneFilterType>('ALL');
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
      const updatedAllocations = prev.allocations.map((a) => computeAllocationPenalties(a, targetDate));
      const overdue = updatedAllocations.filter((a) => a.paymentStatus === 'OVERDUE_ARREARS');
      const totalPenalties = overdue.reduce((s, a) => s + a.totalPenaltyRwf, 0);
      const dayOfMonth = Number(targetDate.split('-')[2] || 8);
      const newLog = {
        id: `CRON-${targetDate.replace(/-/g, '')}-${String(prev.penaltyLogs.length + 1).padStart(3, '0')}`,
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
    notify(`Penalty Cron evaluated for ${targetDate}.`);
  };

  const handleSettleAllocation = async (allocationId: string) => {
    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocationId }),
      });
      if (res.ok) {
        const data = await res.json();
        setState(data.state);
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

  const handleToggleMaintenance = async (stallId: string) => {
    try {
      const res = await fetch('/api/toggle-stall-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stallId }),
      });
      if (res.ok) {
        const data = await res.json();
        setState(data.state);
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
          subLeaseMonthlyChargeRwf: Number(subLeaseMonthlyCharge) || targetAllocationForSub.baseRentRwf,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setState(data.state);
        setIsSubLeaseModalOpen(false);
        notify(`Relational Sub-Lease linked for Stall ${targetAllocationForSub.stallCode}.`);
        return;
      }
    } catch {
      // Fallback
    }
  };

  const handleRevokeSubLease = async (subLeaseId: string) => {
    try {
      const res = await fetch('/api/revoke-sublease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subLeaseId }),
      });
      if (res.ok) {
        const data = await res.json();
        setState(data.state);
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
        setMarketFilter('ALL');
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

  const filteredDashboardAllocations = state.allocations.filter((alloc) => {
    if (marketFilter !== 'ALL' && alloc.marketId !== marketFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const linkedSub = state.subLeases.find((sl) => sl.allocationId === alloc.id);
    return (
      alloc.primaryVendorName.toLowerCase().includes(q) ||
      alloc.stallCode.toLowerCase().includes(q) ||
      alloc.marketName.toLowerCase().includes(q) ||
      alloc.primaryVendorNid.includes(q) ||
      (linkedSub && linkedSub.operationalTenantName.toLowerCase().includes(q))
    );
  });

  const dayOfMonth = Number(state.simulatedDate.split('-')[2] || 8);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('dashboard');
          }}
          className="text-lg font-bold tracking-tight text-slate-950 font-display whitespace-nowrap"
        >
          GMMS Rwanda
        </a>

        {/* Zone 2: 5 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          {(
            [
              { id: 'dashboard', label: 'Command Home' },
              { id: 'stall_map', label: 'Visual Stall Map' },
              { id: 'penalties', label: 'Penalty Automation' },
              { id: 'subleases', label: 'Sub-Lease Ledger' },
              { id: 'xampp_code', label: 'XAMPP & SQL Package' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`py-1 transition-colors whitespace-nowrap border-b-2 ${
                activeTab === item.id
                  ? 'border-emerald-600 text-slate-950 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-950'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 2 primary actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleRunPenaltyCron(state.simulatedDate, 'MANUAL_AUDIT')}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            Audit 5th-Day Penalties
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

      {/* Mobile Navigation Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        {(
          [
            { id: 'dashboard', label: 'Home' },
            { id: 'stall_map', label: 'Stall Map' },
            { id: 'penalties', label: 'Penalties' },
            { id: 'subleases', label: 'Sub-Leases' },
            { id: 'xampp_code', label: 'XAMPP Code' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === item.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

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

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {activeTab === 'dashboard' ? (
          <div className="space-y-8">
            {/* 1. ARCHITECTURAL HERO SECTION + QUANTITATIVE PROOF STRIP */}
            <section className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 shadow-sm">
              {/* Hero Media Frame with Measured Scrim */}
              <div className="relative min-h-[420px] flex flex-col justify-between">
                {/* Resilient Fallback Background + High-Resolution Kigali Market Hero */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
                  <img
                    src={HERO_IMAGE_PATH}
                    alt="Kigali Municipal Covered Marketplace Pavilion with organized vendor stalls"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center opacity-65"
                  />
                  {/* Measured Contrast Scrim for WCAG AA/AAA Legibility */}
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/35" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                </div>

                {/* Hero Foreground Editorial Content */}
                <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-3xl space-y-5">
                  {/* Quiet Unboxed Institutional Trust Line */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-emerald-400 tracking-wide">
                    <span>Republic of Rwanda Local Government</span>
                    <span aria-hidden="true">·</span>
                    <span>Gasabo &amp; Nyarugenge Districts</span>
                    <span aria-hidden="true">·</span>
                    <span>L4 Software Architecture</span>
                  </div>

                  {/* Dominant Display Headline (No Orphans) */}
                  <h1
                    className="text-2xl sm:text-4xl lg:text-[42px] font-bold text-white font-display tracking-tight leading-[1.15]"
                    style={{ textWrap: 'balance' }}
                  >
                    Municipal Market Asset Supervision &amp; Automated Revenue Auditing.
                  </h1>

                  {/* Concrete Value Proposition */}
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl">
                    Digitizing stall occupancy arrays across Kimironko and Nyabugogo hubs, enforcing automated 5th-of-the-month arrears penalty structures, and auditing relational sub-leases between Primary Asset Holders and Operational Tenants.
                  </p>

                  {/* Single Primary CTA + Secondary Action */}
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
                      onClick={() => {
                        const el = document.getElementById('home-sectors-anchor');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap"
                    >
                      Explore Market Sectors
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('xampp_code')}
                      className="px-4 py-2.5 text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition-colors underline underline-offset-4 whitespace-nowrap"
                    >
                      View XAMPP PHP &amp; MySQL 3306 Blueprints
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

                  {/* Quick Date Switchers for L4 Assessor Live Testing */}
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

              {/* Quantitative Proof Strip Attached Directly Below Hero (Claim-to-Proof Adjacency) */}
              <div className="bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                <div className="p-5">
                  <div className="text-xs font-medium text-slate-500">
                    Spatial Stall Occupancy
                  </div>
                  <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                    {occupiedOrSubLeasedCount} / {state.stalls.length} Stalls
                  </div>
                  <div className="text-xs text-slate-600 mt-1.5 flex items-center gap-1.5 font-mono tabular-nums">
                    <span className="text-emerald-700 font-medium">{availableCount} Available</span>
                    <span aria-hidden="true">·</span>
                    <span>{state.subLeases.length} Sub-Leased</span>
                    <span aria-hidden="true">·</span>
                    <span>{maintenanceCount} Maint</span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-xs font-medium text-slate-500">
                    Verified Vendor &amp; Tenant Registry
                  </div>
                  <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                    {state.vendors.length} Citizens
                  </div>
                  <div className="text-xs text-slate-600 mt-1.5 flex items-center gap-1.5">
                    <span>{state.allocations.length} Primary Holders</span>
                    <span aria-hidden="true">·</span>
                    <span>{state.subLeases.length} On-Site Tenants</span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-xs font-medium text-slate-500">
                    Collected Base Rent ({state.simulatedDate.slice(0, 7)})
                  </div>
                  <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
                    RWF {totalCollectedRwf.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-600 mt-1.5">
                    Statutory Due Date: 5th of Every Month
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-xs font-medium text-slate-500">
                    Assessed 5th-Day Arrears Fines
                  </div>
                  <div className="text-2xl font-bold text-red-700 font-mono tabular-nums mt-1">
                    RWF {totalPenaltiesRwf.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-600 mt-1.5 font-mono tabular-nums">
                    {overdueAccountsCount} Overdue · Total Due RWF{' '}
                    {totalArrearsBalanceRwf.toLocaleString()}
                  </div>
                </div>
              </div>
            </section>

            {/* 2. ASYMMETRIC BENTO SHOWCASE: MUNICIPAL HUBS (7 COLS) + L4 ARCHITECTURE PILLARS (5 COLS) */}
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
                          Hub Officer: Mugenzi Jean Bosco
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-600 tabular-nums">
                        RWF 60k – 110k / mo
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setMarketFilter('MKT-KIM');
                          const el = document.getElementById('home-ledger-anchor');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <span>Filter Kimironko</span>
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
                          Hub Officer: Mukandayisenga Solange
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-600 tabular-nums">
                        RWF 80k – 120k / mo
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setMarketFilter('MKT-NYA');
                          const el = document.getElementById('home-ledger-anchor');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <span>Filter Nyabugogo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 5 Columns: L4 Innovative Compliance Architecture Index */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
                <div className="border-b border-slate-200 pb-4">
                  <div className="text-xs font-medium text-slate-500">
                    Level 4 Technical Assessment Criteria
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 font-display mt-0.5">
                    Three Core Innovation Processes
                  </h2>
                </div>

                <div className="divide-y divide-slate-200 my-auto">
                  {/* Process 01 */}
                  <div className="py-4 first:pt-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">
                        01. Visual Stall Mapping Grid
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('stall_map')}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
                      >
                        Launch Grid →
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      State arrays feed a 4×4 spatial matrix per hub, distinguishing Available, Occupied, Sub-Leased, and Overdue properties with live JSON state inspection.
                    </p>
                    <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                      State Array: {availableCount} Available · {occupiedOrSubLeasedCount} Allocated · {maintenanceCount} Maint
                    </div>
                  </div>

                  {/* Process 02 */}
                  <div className="py-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">
                        02. Smart Fine &amp; Penalty Automation
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('penalties')}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
                      >
                        Run Cron Simulator →
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Automated date/cron engine checks if the calendar day exceeds the 5th of the month, assessing a 5% statutory fee plus 1% daily cumulative surcharge.
                    </p>
                    <div className="text-[11px] font-mono text-red-700 font-medium tabular-nums">
                      Evaluated {state.simulatedDate}: {overdueAccountsCount} Accounts Flagged (RWF{' '}
                      {totalPenaltiesRwf.toLocaleString()})
                    </div>
                  </div>

                  {/* Process 03 */}
                  <div className="py-4 last:pb-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">
                        03. Vendor Sub-Letting Relational Ledger
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('subleases')}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
                      >
                        Inspect Links →
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Foreign-key ledger mapping the Primary Asset Holder (District Lessee) to the Current Operational Tenant on-site, enforcing a 15% markup cap.
                    </p>
                    <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                      Active Links: {state.subLeases.length} Permits · 15% Max Cap Audited
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Need SQL &amp; PHP files for phpMyAdmin?
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('xampp_code')}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                  >
                    Open XAMPP Code Studio
                  </button>
                </div>
              </div>
            </section>

            {/* 2.5. GOVERNMENT MARKET COMMERCIAL SECTORS & ZONE GALLERY (BETWEEN BENTO & STALL MAP) */}
            <section
              id="home-sectors-anchor"
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
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
                    Each municipal marketplace is partitioned into four specialized trade zones with standardized stall dimensions and tariff brackets. Select any sector to filter the spatial stall grid below.
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
                        {/* 4:3 Sector Documentary Image with Scrim */}
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

                        {/* Sector Specifications & Live Occupancy */}
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

                      {/* Interactive Filter Action */}
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
                            const el = document.getElementById('home-stall-map-anchor');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 whitespace-nowrap"
                        >
                          <span>
                            {isZoneSelected
                              ? 'Showing Sector'
                              : `Inspect ${sector.zoneKey}`}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 3. EMBEDDED INTERACTIVE VISUAL STALL MAP */}
            <div id="home-stall-map-anchor">
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
            </div>

            {/* 4. UNIFIED ACTIVE VENDOR ALLOCATION, SUB-LETTING & ARREARS REGISTER */}
            <section
              id="home-ledger-anchor"
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Active Vendor Allocations, Sub-Tenants &amp; 5th-Day Arrears Register
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time relational view combining Primary Asset Holders, on-site Operational Sub-Tenants, and automated penalty balances.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    {(
                      [
                        { key: 'ALL', label: 'All Hubs' },
                        { key: 'MKT-KIM', label: 'Kimironko' },
                        { key: 'MKT-NYA', label: 'Nyabugogo' },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setMarketFilter(m.key)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                          marketFilter === m.key
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search holder, tenant, or stall..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Stall &amp; Market Hub</th>
                      <th className="py-3 px-4">Primary Asset Holder (Gov Lessee)</th>
                      <th className="py-3 px-4">Current Operational Tenant (On-Site)</th>
                      <th className="py-3 px-4 text-right">Base Rent</th>
                      <th className="py-3 px-4 text-right">5th-Day Penalty</th>
                      <th className="py-3 px-4 text-right">Total Balance Due</th>
                      <th className="py-3 px-4">Compliance Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
                    {filteredDashboardAllocations.map((alloc) => {
                      const subLease = state.subLeases.find((sl) => sl.allocationId === alloc.id);
                      return (
                        <tr key={alloc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-semibold text-slate-900 tabular-nums">
                              {alloc.stallCode}
                            </div>
                            <div className="text-slate-500">{alloc.marketName}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">
                              {alloc.primaryVendorName}
                            </div>
                            <div className="font-mono text-slate-500 tabular-nums">
                              NID: {alloc.primaryVendorNid} · {alloc.primaryVendorPhone}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {subLease ? (
                              <div>
                                <div className="font-semibold text-amber-900">
                                  {subLease.operationalTenantName}
                                </div>
                                <div className="font-mono text-slate-500 tabular-nums">
                                  Permit {subLease.permitNumber} · RWF{' '}
                                  {subLease.subLeaseMonthlyChargeRwf.toLocaleString()} (+
                                  {subLease.markupPercentage}%)
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">
                                Self-Operated by Primary Holder
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                            RWF {alloc.baseRentRwf.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                            {alloc.totalPenaltyRwf > 0 ? (
                              <span className="text-red-700 font-semibold">
                                + RWF {alloc.totalPenaltyRwf.toLocaleString()} ({alloc.daysOverdue}d)
                              </span>
                            ) : (
                              <span className="text-slate-400">RWF 0</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                            RWF {alloc.totalBalanceDueRwf.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            {alloc.paymentStatus === 'PAID' ? (
                              <span className="text-emerald-700 font-medium">
                                Paid · Compliant
                              </span>
                            ) : alloc.paymentStatus === 'OVERDUE_ARREARS' ? (
                              <span className="text-red-700 font-semibold">
                                Overdue Arrears (Past 5th)
                              </span>
                            ) : (
                              <span className="text-amber-700 font-medium">
                                Grace Period (Due 5th)
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => handleOpenSubLeaseModal(alloc)}
                              className="px-2.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md font-medium transition-colors whitespace-nowrap"
                            >
                              {subLease ? 'Edit Tenant' : 'Sub-Lease'}
                            </button>
                            {alloc.totalBalanceDueRwf > 0 && (
                              <button
                                type="button"
                                onClick={() => handleSettleAllocation(alloc.id)}
                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium transition-colors whitespace-nowrap"
                              >
                                Settle RWF
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : (
          /* Secondary Tab Header Context Banner for Focused Sub-Views */
          <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-emerald-400 font-medium">
                  GMMS Rwanda · Active Evaluation Date: {state.simulatedDate}
                </div>
                <h1 className="text-xl font-bold font-display mt-0.5">
                  {activeTab === 'stall_map' && 'Interactive Visual Stall Mapping Matrix'}
                  {activeTab === 'penalties' && 'Smart Fine & 5th-Day Penalty Automation Engine'}
                  {activeTab === 'subleases' && 'Vendor Sub-Letting Relational Tracking Ledger'}
                  {activeTab === 'xampp_code' && 'L4 XAMPP / Apache / MySQL 3306 & PHP Source Suite'}
                </h1>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors self-start sm:self-auto whitespace-nowrap"
              >
                ← Back to Command Home
              </button>
            </div>

            {activeTab === 'stall_map' && (
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
            )}

            {activeTab === 'penalties' && (
              <PenaltyAutomationPanel
                simulatedDate={state.simulatedDate}
                allocations={state.allocations}
                penaltyLogs={state.penaltyLogs}
                onRunPenaltyCron={handleRunPenaltyCron}
                onSettleAllocation={handleSettleAllocation}
              />
            )}

            {activeTab === 'subleases' && (
              <SubLeaseLedgerPanel
                subLeases={state.subLeases}
                allocations={state.allocations}
                onOpenSubLeaseModal={handleOpenSubLeaseModal}
                onRevokeSubLease={handleRevokeSubLease}
              />
            )}

            {activeTab === 'xampp_code' && <XamppCodeStudio />}
          </div>
        )}
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
              onClick={() => setActiveTab('xampp_code')}
              className="hover:text-slate-900 underline"
            >
              View XAMPP PHP &amp; MySQL 3306 Source Package
            </button>
          </div>
        </div>
      </footer>

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
                    Also Link an Operational Sub-Tenant (L4 Sub-Letting Requirement)
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

      {/* MODAL 2: Link / Update Operational Sub-Tenant (Requirement 3) */}
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
