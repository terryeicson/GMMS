import React, { useState } from 'react';
import {
  MunicipalRole,
  RbacAuditEntry,
  RevenueLeakageAlert,
  StallAllocation,
  StallAsset,
  SubLeaseRecord,
} from '../types/gmms';
import {
  ShieldAlert,
  UserCheck,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Layers,
} from 'lucide-react';

interface AuditAndForecastingSuiteProps {
  stalls: StallAsset[];
  allocations: StallAllocation[];
  subLeases: SubLeaseRecord[];
  leakageAlerts: RevenueLeakageAlert[];
  rbacLogs: RbacAuditEntry[];
  activeRole: MunicipalRole;
  onSelectRole: (role: MunicipalRole) => void;
  onUpdateAlertStatus: (
    alertId: string,
    newStatus: 'NOTICE_DISPATCHED' | 'RESOLVED'
  ) => void;
}

type ForecastHorizon = '30_DAYS' | '90_DAYS' | '365_DAYS';

const ROLE_METADATA: Record<
  MunicipalRole,
  { title: string; officerName: string; clearance: string }
> = {
  DISTRICT_REVENUE_AUDITOR: {
    title: 'District Revenue Auditor',
    officerName: 'Uwizeyimana Jean Claude',
    clearance: 'Level 4 · Full Fiscal & Leakage Enforcement',
  },
  MARKET_HUB_MASTER: {
    title: 'Market Hub Master',
    officerName: 'Mugenzi Jean Bosco',
    clearance: 'Level 3 · Spatial Stall & Sub-Lease Supervision',
  },
  FIELD_TAX_ENFORCER: {
    title: 'Field Tax Enforcer',
    officerName: 'Mutabazi Eric',
    clearance: 'Level 2 · On-Site USSD (*909#) & Arrears Collection',
  },
  SYSTEM_CRON_DAEMON: {
    title: 'Automated Cron Daemon',
    officerName: 'gmms-cron-service@kigali.gov.rw',
    clearance: 'System · 5th-Day Penalty & Anomaly Scanner',
  },
};

export const AuditAndForecastingSuite: React.FC<AuditAndForecastingSuiteProps> = ({
  stalls,
  allocations,
  subLeases,
  leakageAlerts,
  rbacLogs,
  activeRole,
  onSelectRole,
  onUpdateAlertStatus,
}) => {
  const [roleFilter, setRoleFilter] = useState<'ALL' | MunicipalRole>('ALL');
  const [horizon, setHorizon] = useState<ForecastHorizon>('90_DAYS');

  const multiplier = horizon === '30_DAYS' ? 1 : horizon === '90_DAYS' ? 3 : 12;
  const growthFactor = horizon === '30_DAYS' ? 1.04 : horizon === '90_DAYS' ? 1.12 : 1.28;

  const monthlyContractedBaseRwf = allocations.reduce((s, a) => s + a.baseRentRwf, 0);
  const currentPenaltiesRwf = allocations.reduce((s, a) => s + a.totalPenaltyRwf, 0);
  const projectedRevenueRwf = Math.round(
    (monthlyContractedBaseRwf * multiplier * growthFactor) + currentPenaltiesRwf
  );

  const openAlerts = leakageAlerts.filter((a) => a.status !== 'RESOLVED');
  const totalAtRiskLeakageRwf = openAlerts.reduce(
    (sum, a) => sum + a.estimatedMonthlyLeakageRwf,
    0
  );

  const filteredRbacLogs = rbacLogs.filter((entry) =>
    roleFilter === 'ALL' ? true : entry.actorRole === roleFilter
  );

  // Sector-level predictive forecasting calculations
  const sectorForecasts = [
    {
      zone: 'Zone A · Produce & Wholesale',
      totalBays: stalls.filter((s) => s.zoneName.startsWith('Zone A')).length,
      occupiedBays: stalls.filter(
        (s) => s.zoneName.startsWith('Zone A') && s.occupancyStatus !== 'AVAILABLE'
      ).length,
      waitlistDemand: Math.round(6 * growthFactor),
      projectedUtilPct: Math.min(99, Math.round(78 * growthFactor)),
      monthlyPowerKwh: Math.round(1450 * multiplier),
      wasteTonnage: (18.4 * multiplier).toFixed(1),
      recommendation: 'Convert 2 vacant bays to high-density wholesale grain storage',
    },
    {
      zone: 'Zone B · Kitenge & Hardware',
      totalBays: stalls.filter((s) => s.zoneName.startsWith('Zone B')).length,
      occupiedBays: stalls.filter(
        (s) => s.zoneName.startsWith('Zone B') && s.occupancyStatus !== 'AVAILABLE'
      ).length,
      waitlistDemand: Math.round(9 * growthFactor),
      projectedUtilPct: Math.min(99, Math.round(84 * growthFactor)),
      monthlyPowerKwh: Math.round(2100 * multiplier),
      wasteTonnage: (4.2 * multiplier).toFixed(1),
      recommendation: 'Authorize +3 cooperative tailoring sub-leases within 15% cap',
    },
    {
      zone: 'Zone C · Agaseke & Apparel',
      totalBays: stalls.filter((s) => s.zoneName.startsWith('Zone C')).length,
      occupiedBays: stalls.filter(
        (s) => s.zoneName.startsWith('Zone C') && s.occupancyStatus !== 'AVAILABLE'
      ).length,
      waitlistDemand: Math.round(5 * growthFactor),
      projectedUtilPct: Math.min(98, Math.round(74 * growthFactor)),
      monthlyPowerKwh: Math.round(980 * multiplier),
      wasteTonnage: (3.1 * multiplier).toFixed(1),
      recommendation: 'Allocate vacant bays to export-ready Agaseke women cooperatives',
    },
    {
      zone: 'Zone D · Cold Chain & Solar',
      totalBays: stalls.filter((s) => s.zoneName.startsWith('Zone D')).length,
      occupiedBays: stalls.filter(
        (s) => s.zoneName.startsWith('Zone D') && s.occupancyStatus !== 'AVAILABLE'
      ).length,
      waitlistDemand: Math.round(8 * growthFactor),
      projectedUtilPct: Math.min(99, Math.round(81 * growthFactor)),
      monthlyPowerKwh: Math.round(6400 * multiplier),
      wasteTonnage: (7.8 * multiplier).toFixed(1),
      recommendation: 'Upgrade 3-phase backup solar inverter for dairy cold-chain bays',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 3A & 3B Split: Automated Revenue Leakage Alerts + Role-Based Audit Trail Logging */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 6 Columns: 3A. Automated Revenue Leakage Alerts */}
        <div className="xl:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <div className="text-xs font-medium text-red-700 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Module 03A · Real-Time Fiscal Anomaly Detection</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-display mt-0.5">
                Automated Revenue Leakage Alerts
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Detects illegal sub-lease rent gouging (&gt;15% cap), unremitted sub-tenant pass-through rent, and chronic 5th-day defaults.
              </p>
            </div>
            <div className="text-right font-mono tabular-nums">
              <div className="text-xs text-slate-500">Revenue at Risk</div>
              <div className="text-sm font-bold text-red-700">
                RWF {totalAtRiskLeakageRwf.toLocaleString()} / mo
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {leakageAlerts.map((alert) => (
              <div key={alert.id} className="py-4 first:pt-1 last:pb-1 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {alert.stallCode}
                    </span>
                    <span aria-hidden="true" className="text-slate-400">·</span>
                    <span className="text-slate-600">{alert.marketName}</span>
                    <span aria-hidden="true" className="text-slate-400">·</span>
                    <span
                      className={`font-semibold ${
                        alert.severity === 'CRITICAL'
                          ? 'text-red-700'
                          : alert.severity === 'HIGH'
                          ? 'text-amber-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {alert.severity} RISK
                    </span>
                  </div>

                  <span className="font-mono text-xs font-semibold text-red-700 tabular-nums">
                    Leakage: RWF {alert.estimatedMonthlyLeakageRwf.toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {alert.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <div className="text-slate-500 font-mono">
                    Primary: {alert.primaryHolderName}
                    {alert.operationalTenantName
                      ? ` → Tenant: ${alert.operationalTenantName}`
                      : ''}
                  </div>

                  <div className="flex items-center gap-2">
                    {alert.status === 'RESOLVED' ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolved &amp; Audited</span>
                      </span>
                    ) : (
                      <>
                        {alert.status === 'OPEN_INVESTIGATION' && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateAlertStatus(alert.id, 'NOTICE_DISPATCHED')
                            }
                            className="px-2.5 py-1 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded font-medium transition-colors whitespace-nowrap"
                          >
                            Dispatch SMS Notice
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onUpdateAlertStatus(alert.id, 'RESOLVED')}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium transition-colors whitespace-nowrap"
                        >
                          Enforce &amp; Resolve
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 6 Columns: 3B. Role-Based Audit Trail Logging (RBAC) */}
        <div className="xl:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Module 03B · Cryptographic Access &amp; Action Ledger</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-display mt-0.5">
                Role-Based Audit Trail Logging (RBAC)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Every mutation across stalls, sub-leases, USSD syncs, and penalty crons is attributed to an authenticated municipal role.
              </p>
            </div>
          </div>

          {/* Active Session Role Switcher */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs">
              <div className="text-slate-500">Active Session Officer Role:</div>
              <div className="font-semibold text-slate-900 mt-0.5">
                {ROLE_METADATA[activeRole].title} · {ROLE_METADATA[activeRole].officerName}
              </div>
              <div className="text-[11px] text-emerald-700 font-mono">
                {ROLE_METADATA[activeRole].clearance}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="rbac-role-select" className="text-xs text-slate-600 font-medium">
                Switch Role:
              </label>
              <select
                id="rbac-role-select"
                value={activeRole}
                onChange={(e) => onSelectRole(e.target.value as MunicipalRole)}
                className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white font-medium text-slate-900"
              >
                <option value="DISTRICT_REVENUE_AUDITOR">District Revenue Auditor</option>
                <option value="MARKET_HUB_MASTER">Market Hub Master</option>
                <option value="FIELD_TAX_ENFORCER">Field Tax Enforcer</option>
                <option value="SYSTEM_CRON_DAEMON">System Cron Daemon</option>
              </select>
            </div>
          </div>

          {/* Role Filter Bar */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { key: 'ALL', label: `All Logs (${rbacLogs.length})` },
                { key: 'DISTRICT_REVENUE_AUDITOR', label: 'Auditor' },
                { key: 'MARKET_HUB_MASTER', label: 'Hub Master' },
                { key: 'FIELD_TAX_ENFORCER', label: 'Field Enforcer' },
                { key: 'SYSTEM_CRON_DAEMON', label: 'Cron Daemon' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setRoleFilter(tab.key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                  roleFilter === tab.key
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Immutable RBAC Table */}
          <div className="overflow-x-auto max-h-[340px] overflow-y-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Timestamp &amp; Hash</th>
                  <th className="py-2.5 px-3">Officer Role</th>
                  <th className="py-2.5 px-3">Action &amp; Asset</th>
                  <th className="py-2.5 px-3">Audit Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredRbacLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono tabular-nums">
                      <div className="text-slate-900">{log.timestamp}</div>
                      <div className="text-[10px] text-slate-400">
                        SHA: {log.verificationHash}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{log.actorName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {log.actorRole}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <div className="font-semibold text-emerald-800">{log.actionType}</div>
                      <div className="text-[11px] text-slate-500">{log.targetAsset}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{log.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3C. Predictive Marketspace & Resource Forecasting */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Module 03C · Capacity &amp; Utility Telemetry Projections</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display mt-0.5">
              Predictive Marketspace &amp; Municipal Resource Forecasting
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Projects commercial bay saturation, vendor waitlist absorption, RWF tariff revenue, cold-chain electricity demand (kWh), and waste management tonnage.
            </p>
          </div>

          {/* Horizon Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start lg:self-auto">
            {(
              [
                { key: '30_DAYS', label: 'Next 30 Days (Nov 2026)' },
                { key: '90_DAYS', label: 'Q1 2027 (+90 Days)' },
                { key: '365_DAYS', label: 'FY 2027 (+12 Months)' },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setHorizon(item.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  horizon === item.key
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Top Forecast Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div className="text-xs text-slate-500">Projected Tariff &amp; Fine Revenue</div>
            <div className="text-xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
              RWF {projectedRevenueRwf.toLocaleString()}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Includes base rent + USSD arrears recovery
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div className="text-xs text-slate-500">Projected Vendor Waitlist Demand</div>
            <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              +{Math.round(28 * growthFactor)} Applicants
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Highest pressure in Zone B Kitenge &amp; Zone D Dairy
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div className="text-xs text-slate-500">Cold-Chain &amp; Lighting Grid Load</div>
            <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {(10930 * multiplier).toLocaleString()} kWh
            </div>
            <div className="text-xs text-slate-600 mt-1">
              58% concentrated in Zone D Refrigeration
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div className="text-xs text-slate-500">Projected Municipal Waste Volume</div>
            <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {(33.5 * multiplier).toFixed(1)} Metric Tons
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Organic composting priority in Zone A Produce
            </div>
          </div>
        </div>

        {/* Sector-by-Sector Forecasting Matrix */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-3 px-4">Commercial Market Zone</th>
                <th className="py-3 px-4 text-right">Current Bays</th>
                <th className="py-3 px-4 text-right">Projected Saturation</th>
                <th className="py-3 px-4 text-right">Vendor Waitlist</th>
                <th className="py-3 px-4 text-right">Est. Power (kWh)</th>
                <th className="py-3 px-4 text-right">Sanitation / Waste</th>
                <th className="py-3 px-4">Infrastructure &amp; Space Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {sectorForecasts.map((row) => (
                <tr key={row.zone} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-semibold text-slate-900">{row.zone}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    {row.occupiedBays} / {row.totalBays} Active
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-emerald-700">
                    {row.projectedUtilPct}% Occupancy
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    +{row.waitlistDemand} Vendors
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    {row.monthlyPowerKwh.toLocaleString()} kWh
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    {row.wasteTonnage} Tons
                  </td>
                  <td className="py-3 px-4 text-slate-600">{row.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
