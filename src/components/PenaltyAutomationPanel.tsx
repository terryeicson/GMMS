import React, { useState } from 'react';
import { PenaltyAuditLog, StallAllocation } from '../types/gmms';
import { Calendar, Play, CheckCircle2, AlertCircle, Clock, CreditCard } from 'lucide-react';

interface PenaltyAutomationPanelProps {
  simulatedDate: string;
  allocations: StallAllocation[];
  penaltyLogs: PenaltyAuditLog[];
  onRunPenaltyCron: (targetDate: string, triggerType: 'CRON_SCHEDULED' | 'MANUAL_AUDIT' | 'DATE_SIMULATION') => void;
  onSettleAllocation: (allocationId: string) => void;
}

const PRESET_DATES = [
  { date: '2026-10-03', label: 'Oct 03 (Grace Period)' },
  { date: '2026-10-05', label: 'Oct 05 (5th Deadline)' },
  { date: '2026-10-06', label: 'Oct 06 (+1d Past 5th)' },
  { date: '2026-10-08', label: 'Oct 08 (+3d Past 5th)' },
  { date: '2026-10-15', label: 'Oct 15 (+10d Past 5th)' },
  { date: '2026-10-25', label: 'Oct 25 (+20d Past 5th)' },
];

export const PenaltyAutomationPanel: React.FC<PenaltyAutomationPanelProps> = ({
  simulatedDate,
  allocations,
  penaltyLogs,
  onRunPenaltyCron,
  onSettleAllocation,
}) => {
  const [dateInput, setDateInput] = useState<string>(simulatedDate);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OVERDUE_ARREARS' | 'PAID'>('ALL');

  const dayOfMonth = Number(simulatedDate.split('-')[2] || 8);
  const isPastFifth = dayOfMonth > 5;
  const daysPastFifth = Math.max(0, dayOfMonth - 5);

  const overdueAllocations = allocations.filter((a) => a.paymentStatus === 'OVERDUE_ARREARS');
  const totalUnpaidBaseRwf = allocations.reduce(
    (sum, a) => sum + Math.max(0, a.baseRentRwf - a.paidAmountRwf),
    0
  );
  const totalStatutoryFeeRwf = allocations.reduce((sum, a) => sum + a.statutoryFeeRwf, 0);
  const totalDailySurchargeRwf = allocations.reduce((sum, a) => sum + a.dailyCumulativePenaltyRwf, 0);
  const totalPenaltiesRwf = allocations.reduce((sum, a) => sum + a.totalPenaltyRwf, 0);

  const filteredAllocations = allocations.filter((a) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'OVERDUE_ARREARS') return a.paymentStatus === 'OVERDUE_ARREARS';
    return a.paymentStatus === 'PAID';
  });

  const handlePresetClick = (presetDate: string) => {
    setDateInput(presetDate);
    onRunPenaltyCron(presetDate, 'DATE_SIMULATION');
  };

  const handleManualCronSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRunPenaltyCron(dateInput, 'MANUAL_AUDIT');
  };

  return (
    <div className="space-y-6">
      {/* Header & Interactive Cron Simulator */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              02. Smart Fine & Penalty Automation Engine (5th-of-Month Threshold)
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Automated cron/date logic evaluating unpaid rental arrears lingering past the 5th calendar day of the month.
            </p>
          </div>

          <form onSubmit={handleManualCronSubmit} className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <label htmlFor="cron-date-input" className="text-xs font-medium text-slate-600 whitespace-nowrap">
                Evaluation Date:
              </label>
              <input
                id="cron-date-input"
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="text-xs font-mono font-semibold text-slate-900 bg-transparent focus:outline-none tabular-nums"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Execute Cron Audit</span>
            </button>
          </form>
        </div>

        {/* Preset Date Simulator Buttons for L4 Presentation Assessment */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-medium text-slate-600">
            Test Billing Cycle Dates (Before vs. Past the 5th Deadline):
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_DATES.map((preset) => {
              const active = simulatedDate === preset.date;
              return (
                <button
                  key={preset.date}
                  type="button"
                  onClick={() => handlePresetClick(preset.date)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap font-mono tabular-nums ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mathematical Rule Banner & Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-slate-200">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="text-xs text-slate-500">Current Threshold State</div>
            <div className="text-base font-bold text-slate-900 font-mono tabular-nums mt-1">
              {isPastFifth
                ? `Day ${dayOfMonth} · +${daysPastFifth}d Past 5th`
                : `Day ${dayOfMonth} · Grace Window (≤ 5th)`}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              {isPastFifth
                ? `Active Rate: 5% Base + ${daysPastFifth}% Daily = ${5 + daysPastFifth}%`
                : '0% Penalty Applied Before Day 6'}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="text-xs text-slate-500">Unpaid Principal Arrears</div>
            <div className="text-base font-bold text-slate-900 font-mono tabular-nums mt-1">
              RWF {totalUnpaidBaseRwf.toLocaleString()}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Across {overdueAllocations.length} overdue vendor accounts
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="text-xs text-slate-500">5% Statutory Trigger + 1%/d</div>
            <div className="text-base font-bold text-slate-900 font-mono tabular-nums mt-1">
              RWF {totalStatutoryFeeRwf.toLocaleString()} + RWF {totalDailySurchargeRwf.toLocaleString()}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Statutory Fee · Cumulative Surcharge
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="text-xs text-slate-500">Total Assessed Penalties</div>
            <div className="text-base font-bold text-red-700 font-mono tabular-nums mt-1">
              RWF {totalPenaltiesRwf.toLocaleString()}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Total Payable: RWF {(totalUnpaidBaseRwf + totalPenaltiesRwf).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Allocation Arrears & Penalty Computation Ledger */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Vendor Monthly Arrears & Cumulative Penalty Ledger
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluated for {simulatedDate} · Statutory Due Date: 2026-10-05
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { key: 'ALL', label: `All Accounts (${allocations.length})` },
                { key: 'OVERDUE_ARREARS', label: `Overdue Arrears (${overdueAllocations.length})` },
                { key: 'PAID', label: 'Paid & Compliant' },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === f.key
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Stall & Hub</th>
                <th className="py-3 px-4">Primary Asset Holder</th>
                <th className="py-3 px-4 text-right">Base Rent</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Days Past 5th</th>
                <th className="py-3 px-4 text-right">5% Statutory</th>
                <th className="py-3 px-4 text-right">1%/d Cumulative</th>
                <th className="py-3 px-4 text-right">Total Penalty</th>
                <th className="py-3 px-4 text-right">Total Payable</th>
                <th className="py-3 px-4">Compliance State</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
              {filteredAllocations.map((alloc) => (
                <tr key={alloc.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-mono font-semibold text-slate-900 tabular-nums">
                      {alloc.stallCode}
                    </div>
                    <div className="text-slate-500">{alloc.marketName}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{alloc.primaryVendorName}</div>
                    <div className="font-mono text-slate-500 tabular-nums">
                      NID: {alloc.primaryVendorNid}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    RWF {alloc.baseRentRwf.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-medium">
                    RWF {alloc.paidAmountRwf.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    {alloc.daysOverdue > 0 ? (
                      <span className="text-red-700 font-semibold">{alloc.daysOverdue} days</span>
                    ) : (
                      <span className="text-slate-400">0 days</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    RWF {alloc.statutoryFeeRwf.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    RWF {alloc.dailyCumulativePenaltyRwf.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-red-700">
                    RWF {alloc.totalPenaltyRwf.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                    RWF {alloc.totalBalanceDueRwf.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    {alloc.paymentStatus === 'PAID' ? (
                      <span className="text-emerald-700 font-medium">
                        Paid · Settled ({alloc.lastPaymentDate})
                      </span>
                    ) : alloc.paymentStatus === 'OVERDUE_ARREARS' ? (
                      <span className="text-red-700 font-semibold">
                        Overdue Arrears · Penalty Active
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium">
                        Pending · Grace Window (≤ 5th)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {alloc.totalBalanceDueRwf > 0 ? (
                      <button
                        type="button"
                        onClick={() => onSettleAllocation(alloc.id)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md transition-colors whitespace-nowrap"
                      >
                        Settle RWF
                      </button>
                    ) : (
                      <span className="text-slate-400 font-mono">Cleared</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cron Execution Audit Logs */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">
            Automated Penalty Cron Execution Audit Log
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-4">Audit Run ID</th>
                <th className="py-2.5 px-4">Evaluated Date</th>
                <th className="py-2.5 px-4">5th-of-Month Check</th>
                <th className="py-2.5 px-4 text-right">Accounts Checked</th>
                <th className="py-2.5 px-4 text-right">Overdue Flagged</th>
                <th className="py-2.5 px-4 text-right">Total Penalties Assessed</th>
                <th className="py-2.5 px-4">Trigger Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {penaltyLogs.map((log) => (
                <tr key={log.id}>
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-900 tabular-nums">
                    {log.id}
                  </td>
                  <td className="py-2.5 px-4 font-mono tabular-nums">
                    {log.simulatedAssessmentDate} (Day {log.dayOfMonthEvaluated})
                  </td>
                  <td className="py-2.5 px-4">
                    {log.pastFifthThreshold ? (
                      <span className="text-red-700 font-medium">
                        Past 5th Threshold (Penalties Enforced)
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium">
                        Within 1st–5th Grace Period
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                    {log.accountsEvaluated}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold">
                    {log.overdueAccountsFlagged}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                    RWF {log.totalPenaltiesAssessedRwf.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 font-mono">{log.triggerType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
