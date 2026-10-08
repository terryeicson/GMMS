import React, { useState } from 'react';
import {
  StallAllocation,
  StallAsset,
  SubLeaseRecord,
  OccupancyStatus,
} from '../types/gmms';
import {
  ArrowRightLeft,
  Wrench,
  Plus,
  CreditCard,
  Code2,
} from 'lucide-react';

export type ZoneFilterType = 'ALL' | 'Zone A' | 'Zone B' | 'Zone C' | 'Zone D';

interface VisualStallMapProps {
  stalls: StallAsset[];
  allocations: StallAllocation[];
  subLeases: SubLeaseRecord[];
  simulatedDate: string;
  selectedZoneFilter?: ZoneFilterType;
  onZoneFilterChange?: (zone: ZoneFilterType) => void;
  onOpenAllocateModal: (stall: StallAsset) => void;
  onOpenSubLeaseModal: (allocation: StallAllocation) => void;
  onSettleAllocation: (allocationId: string) => void;
  onToggleMaintenance: (stallId: string) => void;
}

export const VisualStallMap: React.FC<VisualStallMapProps> = ({
  stalls,
  allocations,
  subLeases,
  simulatedDate,
  selectedZoneFilter = 'ALL',
  onZoneFilterChange,
  onOpenAllocateModal,
  onOpenSubLeaseModal,
  onSettleAllocation,
  onToggleMaintenance,
}) => {
  const [selectedMarket, setSelectedMarket] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OccupancyStatus | 'OVERDUE'>('ALL');
  const [internalZone, setInternalZone] = useState<ZoneFilterType>('ALL');
  const [selectedStallId, setSelectedStallId] = useState<string>(stalls[0]?.id || 'STL-KIM-B01');
  const [showJsonState, setShowJsonState] = useState<boolean>(false);

  const activeZoneFilter = onZoneFilterChange ? selectedZoneFilter : internalZone;
  const handleSetZone = (zone: ZoneFilterType) => {
    if (onZoneFilterChange) {
      onZoneFilterChange(zone);
    } else {
      setInternalZone(zone);
    }
  };

  const getStallDetails = (stall: StallAsset) => {
    const allocation = allocations.find((a) => a.stallId === stall.id) || null;
    const subLease = subLeases.find((sl) => sl.stallId === stall.id) || null;
    const isOverdue = allocation?.paymentStatus === 'OVERDUE_ARREARS';
    return { allocation, subLease, isOverdue };
  };

  const filteredStalls = stalls.filter((stall) => {
    if (selectedMarket !== 'ALL' && stall.marketId !== selectedMarket) return false;
    if (activeZoneFilter !== 'ALL' && !stall.zoneName.startsWith(activeZoneFilter)) return false;
    const { isOverdue } = getStallDetails(stall);
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'OVERDUE') return isOverdue;
    return stall.occupancyStatus === statusFilter;
  });

  const activeStall =
    stalls.find((s) => s.id === selectedStallId) || filteredStalls[0] || stalls[0];
  const activeDetails = activeStall
    ? getStallDetails(activeStall)
    : { allocation: null, subLease: null, isOverdue: false };

  const marketsToRender =
    selectedMarket === 'ALL'
      ? [
          { id: 'MKT-KIM', name: 'Kimironko Market · Gasabo District' },
          { id: 'MKT-NYA', name: 'Nyabugogo Market · Nyarugenge District' },
        ]
      : selectedMarket === 'MKT-KIM'
      ? [{ id: 'MKT-KIM', name: 'Kimironko Market · Gasabo District' }]
      : [{ id: 'MKT-NYA', name: 'Nyabugogo Market · Nyarugenge District' }];

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              01. Visual Stall Mapping &amp; Spatial State Matrix
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Interactive marketplace grid driven by real-time occupancy, sub-lease, and 5th-of-the-month arrears state arrays.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Market Hub Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setSelectedMarket('ALL')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedMarket === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Hubs (32)
              </button>
              <button
                type="button"
                onClick={() => setSelectedMarket('MKT-KIM')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedMarket === 'MKT-KIM'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kimironko (16)
              </button>
              <button
                type="button"
                onClick={() => setSelectedMarket('MKT-NYA')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedMarket === 'MKT-NYA'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Nyabugogo (16)
              </button>
            </div>

            {/* Occupancy & Compliance Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { key: 'ALL', label: 'All States' },
                  { key: 'AVAILABLE', label: 'Available' },
                  { key: 'OCCUPIED', label: 'Occupied' },
                  { key: 'SUB_LEASED', label: 'Sub-Leased' },
                  { key: 'OVERDUE', label: 'Arrears Overdue' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === tab.key
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Market Sector / Zone Filter Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-medium text-slate-500">
            Filter Grid by Commercial Market Sector:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { key: 'ALL', label: 'All Sectors (Zones A–D)' },
                { key: 'Zone A', label: 'Zone A · Produce & Wholesale' },
                { key: 'Zone B', label: 'Zone B · Kitenge & Hardware' },
                { key: 'Zone C', label: 'Zone C · Agaseke Crafts & Apparel' },
                { key: 'Zone D', label: 'Zone D · Cold Chain & Electronics' },
              ] as const
            ).map((z) => (
              <button
                key={z.key}
                type="button"
                onClick={() => handleSetZone(z.key)}
                className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                  activeZoneFilter === z.key
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {z.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split View: Spatial Grid + Selected Stall Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: Spatial Market Grids */}
        <div className="xl:col-span-8 space-y-6">
          {marketsToRender.map((market) => {
            const marketStalls = filteredStalls.filter((s) => s.marketId === market.id);
            return (
              <div key={market.id} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-200 gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{market.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>Spatial Layout 4×4</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {marketStalls.length} Stalls Displayed
                      </span>
                      {activeZoneFilter !== 'ALL' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-700 font-medium">
                            Filtered: {activeZoneFilter}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-medium text-emerald-700">Available (Vacant)</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-slate-800">Occupied (Direct)</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-amber-700">Sub-Leased (Tenant)</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-red-700">Arrears (Past 5th)</span>
                  </div>
                </div>

                {marketStalls.length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-500">
                    No stalls in {market.name} match the selected filter state.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {marketStalls.map((stall) => {
                      const { allocation, subLease, isOverdue } = getStallDetails(stall);
                      const isSelected = activeStall?.id === stall.id;

                      let containerStyle = 'border-slate-200 bg-white hover:border-slate-400';
                      let statusText = 'Occupied · Direct';
                      let statusColor = 'text-slate-700';

                      if (stall.occupancyStatus === 'AVAILABLE') {
                        containerStyle =
                          'border-emerald-500/70 bg-emerald-50/30 hover:bg-emerald-50/60 border-dashed';
                        statusText = 'Available · Vacant';
                        statusColor = 'text-emerald-800';
                      } else if (stall.occupancyStatus === 'MAINTENANCE') {
                        containerStyle = 'border-slate-300 bg-slate-100/70 text-slate-500';
                        statusText = 'Maintenance Hold';
                        statusColor = 'text-slate-600';
                      } else if (isOverdue) {
                        containerStyle = 'border-red-500 bg-red-50/40 hover:bg-red-50/70';
                        statusText = `Overdue (+${allocation?.daysOverdue}d)`;
                        statusColor = 'text-red-700';
                      } else if (stall.occupancyStatus === 'SUB_LEASED' || subLease) {
                        containerStyle = 'border-amber-500 bg-amber-50/40 hover:bg-amber-50/70';
                        statusText = 'Sub-Leased · Active';
                        statusColor = 'text-amber-800';
                      }

                      return (
                        <button
                          key={stall.id}
                          type="button"
                          onClick={() => setSelectedStallId(stall.id)}
                          className={`text-left p-3.5 rounded-lg border transition-all flex flex-col justify-between min-h-[128px] ${containerStyle} ${
                            isSelected ? 'ring-2 ring-slate-900 ring-offset-1' : ''
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                                {stall.stallCode}
                              </span>
                              <span
                                className={`text-[11px] font-semibold ${statusColor} truncate`}
                              >
                                {statusText}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                              {stall.zoneName} · {stall.sizeSqm}m²
                            </div>
                          </div>

                          <div className="my-2 pt-2 border-t border-slate-200/70">
                            {stall.occupancyStatus === 'AVAILABLE' ? (
                              <div className="text-xs font-medium text-emerald-800">
                                Ready for Vendor Allocation
                              </div>
                            ) : stall.occupancyStatus === 'MAINTENANCE' ? (
                              <div className="text-xs text-slate-500">
                                Civil works / electrical inspection
                              </div>
                            ) : (
                              <>
                                <div className="text-xs font-semibold text-slate-900 truncate">
                                  {allocation?.primaryVendorName || 'Allocated Holder'}
                                </div>
                                {subLease ? (
                                  <div className="text-[11px] text-amber-800 font-medium truncate mt-0.5">
                                    Tenant: {subLease.operationalTenantName}
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                    Self-Operated Primary Holder
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] font-mono tabular-nums pt-1">
                            <span className="text-slate-700 font-medium">
                              RWF {stall.monthlyRentRwf.toLocaleString()}
                            </span>
                            {isOverdue && allocation ? (
                              <span className="text-red-700 font-semibold">
                                +RWF {allocation.totalPenaltyRwf.toLocaleString()}
                              </span>
                            ) : allocation?.paymentStatus === 'PAID' ? (
                              <span className="text-emerald-700 font-medium">Paid</span>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right 4 Columns: Interactive Stall State Inspector & Action Console */}
        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-5 sticky top-20">
          {activeStall ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{activeStall.marketName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeStall.zoneName}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                    Stall {activeStall.stallCode}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowJsonState(!showJsonState)}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>{showJsonState ? 'View Details' : 'State Array JSON'}</span>
                </button>
              </div>

              {showJsonState ? (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-600">
                    Backend Grid Cell State Payload (PHP / Express API):
                  </div>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
                    {JSON.stringify(
                      {
                        stallCode: activeStall.stallCode,
                        marketId: activeStall.marketId,
                        coordinates: { row: activeStall.gridRow, col: activeStall.gridCol },
                        occupancyStatus: activeStall.occupancyStatus,
                        monthlyRentRwf: activeStall.monthlyRentRwf,
                        primaryHolder: activeDetails.allocation?.primaryVendorName ?? null,
                        operationalSubTenant:
                          activeDetails.subLease?.operationalTenantName ?? null,
                        paymentStatus:
                          activeDetails.allocation?.paymentStatus ?? 'UNALLOCATED',
                        daysPast5th: activeDetails.allocation?.daysOverdue ?? 0,
                        penaltyRwf: activeDetails.allocation?.totalPenaltyRwf ?? 0,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Spatial & Tariff Specifications */}
                  <div className="grid grid-cols-2 gap-3 py-3 border-b border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 block">Grid Coordinates</span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums mt-0.5 block">
                        Row {activeStall.gridRow} · Col {activeStall.gridCol} ({activeStall.sizeSqm} m²)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Monthly Tariff</span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums mt-0.5 block">
                        RWF {activeStall.monthlyRentRwf.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Primary Asset Holder Info */}
                  {activeDetails.allocation ? (
                    <div className="space-y-3 border-b border-slate-200 pb-4">
                      <div className="text-xs font-semibold text-slate-900">
                        Primary Asset Holder (Government Lessee)
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        {activeDetails.allocation.primaryVendorName}
                      </div>
                      <div className="text-xs text-slate-600 font-mono tabular-nums space-y-1">
                        <div>NID: {activeDetails.allocation.primaryVendorNid}</div>
                        <div>Tel: {activeDetails.allocation.primaryVendorPhone}</div>
                        <div>Trade: {activeDetails.allocation.tradeCategory}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-3 border-b border-slate-200">
                      <div className="text-xs font-semibold text-emerald-800">
                        Unallocated Municipal Property
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        This stall is currently vacant and ready for immediate citizen vendor allocation.
                      </p>
                    </div>
                  )}

                  {/* Sub-Lease Relational Link if Present */}
                  {activeDetails.subLease && (
                    <div className="space-y-2 border-b border-slate-200 pb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-amber-800 flex items-center gap-1.5">
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Active Sub-Lease Link</span>
                        </span>
                        <span className="font-mono text-slate-600 tabular-nums">
                          {activeDetails.subLease.permitNumber}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        {activeDetails.subLease.operationalTenantName}
                      </div>
                      <div className="text-xs text-slate-600 font-mono tabular-nums space-y-1">
                        <div>Tenant NID: {activeDetails.subLease.operationalTenantNid}</div>
                        <div>
                          Sub-Rent: RWF{' '}
                          {activeDetails.subLease.subLeaseMonthlyChargeRwf.toLocaleString()} (+
                          {activeDetails.subLease.markupPercentage}% vs Base)
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Billing & 5th-of-Month Penalty Breakdown */}
                  {activeDetails.allocation && (
                    <div className="space-y-2 border-b border-slate-200 pb-4 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Statutory Due Date</span>
                        <span className="font-mono font-medium text-slate-900 tabular-nums">
                          {activeDetails.allocation.dueDate} (5th of Month)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Evaluated Date</span>
                        <span className="font-mono font-medium text-slate-900 tabular-nums">
                          {simulatedDate}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Paid Toward Base</span>
                        <span className="font-mono font-medium text-emerald-700 tabular-nums">
                          RWF {activeDetails.allocation.paidAmountRwf.toLocaleString()}
                        </span>
                      </div>
                      {activeDetails.allocation.totalPenaltyRwf > 0 && (
                        <div className="flex items-center justify-between text-red-700 font-semibold">
                          <span>
                            Penalty ({activeDetails.allocation.daysOverdue}d past 5th)
                          </span>
                          <span className="font-mono tabular-nums">
                            + RWF {activeDetails.allocation.totalPenaltyRwf.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-sm font-bold text-slate-900">
                        <span>Total Payable Balance</span>
                        <span className="font-mono tabular-nums">
                          RWF {activeDetails.allocation.totalBalanceDueRwf.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Contextual Action Buttons */}
              <div className="space-y-2.5 pt-1">
                {activeStall.occupancyStatus === 'AVAILABLE' && (
                  <button
                    type="button"
                    onClick={() => onOpenAllocateModal(activeStall)}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Allocate Stall {activeStall.stallCode} to Vendor</span>
                  </button>
                )}

                {(activeStall.occupancyStatus === 'AVAILABLE' ||
                  activeStall.occupancyStatus === 'MAINTENANCE') && (
                  <button
                    type="button"
                    onClick={() => onToggleMaintenance(activeStall.id)}
                    className="w-full py-2 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>
                      {activeStall.occupancyStatus === 'MAINTENANCE'
                        ? 'Mark Available for Allocation'
                        : 'Place Stall Under Maintenance'}
                    </span>
                  </button>
                )}

                {activeDetails.allocation && (
                  <>
                    {activeDetails.allocation.totalBalanceDueRwf > 0 && (
                      <button
                        type="button"
                        onClick={() => onSettleAllocation(activeDetails.allocation!.id)}
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>
                          Settle Full Balance (RWF{' '}
                          {activeDetails.allocation.totalBalanceDueRwf.toLocaleString()})
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenSubLeaseModal(activeDetails.allocation!)}
                      className="w-full py-2 px-4 border border-slate-300 hover:bg-slate-50 text-slate-800 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>
                        {activeDetails.subLease
                          ? 'Update Operational Sub-Tenant'
                          : 'Register Sub-Lease Tenant'}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-500">
              Select any stall in the grid to inspect its state array and perform actions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
