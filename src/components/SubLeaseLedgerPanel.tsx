import React, { useState } from 'react';
import { StallAllocation, SubLeaseRecord } from '../types/gmms';
import { ArrowRightLeft, Plus, Trash2, Search } from 'lucide-react';

interface SubLeaseLedgerPanelProps {
  subLeases: SubLeaseRecord[];
  allocations: StallAllocation[];
  onOpenSubLeaseModal: (allocation: StallAllocation) => void;
  onRevokeSubLease: (subLeaseId: string) => void;
}

export const SubLeaseLedgerPanel: React.FC<SubLeaseLedgerPanelProps> = ({
  subLeases,
  allocations,
  onOpenSubLeaseModal,
  onRevokeSubLease,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [authFilter, setAuthFilter] = useState<'ALL' | 'AUTHORIZED' | 'MARGIN_VIOLATION'>('ALL');
  const [selectedAllocationIdForNew, setSelectedAllocationIdForNew] = useState<string>(
    allocations[0]?.id || ''
  );

  const filteredSubLeases = subLeases.filter((sl) => {
    if (authFilter !== 'ALL' && sl.authorizationStatus !== authFilter) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      sl.primaryVendorName.toLowerCase().includes(q) ||
      sl.operationalTenantName.toLowerCase().includes(q) ||
      sl.stallCode.toLowerCase().includes(q) ||
      sl.permitNumber.toLowerCase().includes(q) ||
      sl.marketName.toLowerCase().includes(q)
    );
  });

  const authorizedCount = subLeases.filter((s) => s.authorizationStatus === 'AUTHORIZED').length;
  const violationCount = subLeases.filter((s) => s.authorizationStatus === 'MARGIN_VIOLATION').length;

  const handleLaunchSubLeaseModal = () => {
    const targetAlloc =
      allocations.find((a) => a.id === selectedAllocationIdForNew) || allocations[0];
    if (targetAlloc) {
      onOpenSubLeaseModal(targetAlloc);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Relational Architecture Explanation */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              03. Vendor Sub-Letting Relational Tracking Ledger
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Maps foreign-key relationships between the Primary Asset Holder (Government Lessee) and the Current Operational Tenant on-site.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedAllocationIdForNew}
              onChange={(e) => setSelectedAllocationIdForNew(e.target.value)}
              aria-label="Select Primary Allocation Stall"
              className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 font-medium focus:outline-none focus:border-slate-900"
            >
              {allocations.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.stallCode} · Primary: {a.primaryVendorName}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleLaunchSubLeaseModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Link Operational Sub-Tenant</span>
            </button>
          </div>
        </div>

        {/* Relational Chain Visual Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div className="text-slate-500">Entity 1 · Municipal Lease Root</div>
            <div className="text-sm font-semibold text-slate-900 mt-1">
              Primary Asset Holder (`primary_vendor_id`)
            </div>
            <div className="text-slate-600 mt-1">
              Original Rwandan citizen authorized by the District Market Authority; legally accountable for base tariff & arrears.
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div className="text-slate-500">Entity 2 · On-Site Merchant</div>
            <div className="text-sm font-semibold text-slate-900 mt-1">
              Current Operational Tenant (`operational_tenant_id`)
            </div>
            <div className="text-slate-600 mt-1">
              Active merchant operating daily commercial trade inside the stall under a registered sub-lease permit.
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div className="text-slate-500">Anti-Profiteering Tariff Audit</div>
            <div className="text-sm font-semibold text-slate-900 mt-1 font-mono tabular-nums">
              {authorizedCount} Authorized · {violationCount} Margin Flag
            </div>
            <div className="text-slate-600 mt-1">
              Municipal policy caps sub-letting administrative markup at 15% above official government stall rent.
            </div>
          </div>
        </div>
      </div>

      {/* Relational Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setAuthFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                authFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Sub-Leases ({subLeases.length})
            </button>
            <button
              type="button"
              onClick={() => setAuthFilter('AUTHORIZED')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                authFilter === 'AUTHORIZED'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Authorized ≤15% Cap ({authorizedCount})
            </button>
            <button
              type="button"
              onClick={() => setAuthFilter('MARGIN_VIOLATION')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                authFilter === 'MARGIN_VIOLATION'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Margin Violations ({violationCount})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search primary holder, tenant, or permit..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {filteredSubLeases.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="text-sm font-medium text-slate-800">No Sub-Lease Records Found</div>
            <p className="text-xs text-slate-500">
              Select a stall allocation above and click "Link Operational Sub-Tenant" to record a relational sub-lease.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Permit & Stall</th>
                  <th className="py-3 px-4">Primary Asset Holder (Lessee)</th>
                  <th className="py-3 px-4">Current Operational Tenant (On-Site)</th>
                  <th className="py-3 px-4 text-right">Gov Base Rent</th>
                  <th className="py-3 px-4 text-right">Sub-Lease Charge</th>
                  <th className="py-3 px-4 text-right">Markup %</th>
                  <th className="py-3 px-4">Compliance & Term</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
                {filteredSubLeases.map((sl) => (
                  <tr key={sl.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-semibold text-slate-900 tabular-nums">
                        {sl.stallCode} · {sl.permitNumber}
                      </div>
                      <div className="text-slate-500">{sl.marketName}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{sl.primaryVendorName}</div>
                      <div className="font-mono text-slate-500 tabular-nums">
                        NID: {sl.primaryVendorNid} · {sl.primaryVendorPhone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-amber-900">{sl.operationalTenantName}</div>
                      <div className="font-mono text-slate-500 tabular-nums">
                        NID: {sl.operationalTenantNid} · {sl.operationalTrade}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      RWF {sl.governmentBaseRentRwf.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      RWF {sl.subLeaseMonthlyChargeRwf.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      <span
                        className={
                          sl.markupPercentage > 15
                            ? 'text-red-700 font-bold'
                            : 'text-emerald-700 font-semibold'
                        }
                      >
                        +{sl.markupPercentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        {sl.authorizationStatus === 'MARGIN_VIOLATION' ? (
                          <span className="text-red-700 font-semibold">
                            Margin Violation (&gt;15% Cap)
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium">
                            Authorized Municipal Sub-Lease
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 font-mono tabular-nums">
                        {sl.startDate} to {sl.endDate}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onRevokeSubLease(sl.id)}
                        className="px-2.5 py-1.5 border border-slate-300 hover:bg-red-50 hover:border-red-300 hover:text-red-700 text-slate-700 rounded-md font-medium transition-colors inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Terminate Link</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
