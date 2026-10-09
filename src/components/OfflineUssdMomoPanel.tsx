import React, { useState } from 'react';
import { StallAllocation, UssdMomoTransaction } from '../types/gmms';
import { Smartphone, Wifi, WifiOff, RefreshCw, CheckCircle2, Send } from 'lucide-react';

interface OfflineUssdMomoPanelProps {
  allocations: StallAllocation[];
  simulatedDate: string;
  transactions: UssdMomoTransaction[];
  onQueueUssdPayment: (tx: Omit<UssdMomoTransaction, 'id' | 'createdAt' | 'syncedAt'>) => void;
  onSyncOfflineQueue: () => void;
}

export const OfflineUssdMomoPanel: React.FC<OfflineUssdMomoPanelProps> = ({
  allocations,
  simulatedDate,
  transactions,
  onQueueUssdPayment,
  onSyncOfflineQueue,
}) => {
  const unpaidAllocations = allocations.filter((a) => a.totalBalanceDueRwf > 0);
  const [selectedAllocId, setSelectedAllocId] = useState<string>(
    unpaidAllocations[0]?.id || allocations[0]?.id || ''
  );
  const [provider, setProvider] = useState<'MTN_MOMO' | 'AIRTEL_MONEY'>('MTN_MOMO');
  const [networkMode, setNetworkMode] = useState<'OFFLINE_CACHE' | 'ONLINE_DIRECT'>('OFFLINE_CACHE');
  const [momoPin, setMomoPin] = useState<string>('2026');
  const [ussdStep, setUssdStep] = useState<'MENU' | 'CONFIRM_PIN' | 'RECEIPT'>('MENU');
  const [lastReceiptRef, setLastReceiptRef] = useState<string>('');

  const targetAlloc =
    allocations.find((a) => a.id === selectedAllocId) ||
    unpaidAllocations[0] ||
    allocations[0];

  const queuedOfflineCount = transactions.filter((t) => t.syncStatus === 'QUEUED_OFFLINE').length;
  const queuedOfflineVolumeRwf = transactions
    .filter((t) => t.syncStatus === 'QUEUED_OFFLINE')
    .reduce((sum, t) => sum + t.amountRwf, 0);

  const handleUssdDialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAlloc) return;
    if (ussdStep === 'MENU') {
      setUssdStep('CONFIRM_PIN');
      return;
    }

    if (ussdStep === 'CONFIRM_PIN') {
      const refCode = `${provider === 'MTN_MOMO' ? 'MOMO' : 'AIRT'}-RW-${Math.floor(
        1000000 + Math.random() * 8999999
      )}`;
      const amountToPay =
        targetAlloc.totalBalanceDueRwf > 0
          ? targetAlloc.totalBalanceDueRwf
          : targetAlloc.baseRentRwf;

      onQueueUssdPayment({
        momoRef: refCode,
        ussdSessionCode: `*909*1*${targetAlloc.stallCode}#`,
        allocationId: targetAlloc.id,
        stallCode: targetAlloc.stallCode,
        marketName: targetAlloc.marketName,
        payerName: targetAlloc.primaryVendorName,
        payerPhone: targetAlloc.primaryVendorPhone,
        provider,
        amountRwf: amountToPay,
        syncStatus: networkMode === 'OFFLINE_CACHE' ? 'QUEUED_OFFLINE' : 'SYNCED_LEDGER',
      });

      setLastReceiptRef(refCode);
      setUssdStep('RECEIPT');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs font-medium text-emerald-700">
            Module 02B · Inclusive Last-Mile Revenue Collection
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-display mt-0.5">
            Integrated Offline USSD (*909#) &amp; Mobile Money (MoMo) Sync Terminal
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Enables feature-phone vendors and basement stall collectors to dial *909# without internet connectivity, caching signed MoMo tokens locally until batch synchronization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Connectivity Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setNetworkMode('OFFLINE_CACHE')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                networkMode === 'OFFLINE_CACHE'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline USSD Queue Mode</span>
            </button>
            <button
              type="button"
              onClick={() => setNetworkMode('ONLINE_DIRECT')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                networkMode === 'ONLINE_DIRECT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Direct Online Gateway</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onSyncOfflineQueue}
            disabled={queuedOfflineCount === 0}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap ${
              queuedOfflineCount > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>
              Sync Offline Queue ({queuedOfflineCount} Pending · RWF{' '}
              {queuedOfflineVolumeRwf.toLocaleString()})
            </span>
          </button>
        </div>
      </div>

      {/* Split Layout: Left = Interactive USSD Handset Simulator, Right = Offline/Online Sync Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Columns: Interactive USSD Handset Screen */}
        <div className="lg:col-span-5 bg-slate-950 text-white rounded-xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
            <span className="font-mono text-emerald-400 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" />
              <span>Rwanda Gov USSD Gateway · *909#</span>
            </span>
            <span className="font-mono text-slate-400 tabular-nums">
              {networkMode === 'OFFLINE_CACHE' ? 'GSM OFFLINE CACHE' : '4G LTE LIVE'}
            </span>
          </div>

          {/* Terminal Screen */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-3 min-h-[230px] flex flex-col justify-between">
            {ussdStep === 'MENU' && targetAlloc && (
              <div className="space-y-2.5">
                <div className="text-emerald-400 font-semibold">
                  CON Welcome to GMMS Rwanda (*909*1*Stall#)
                </div>
                <div className="text-slate-300 space-y-1 leading-relaxed">
                  <div>1. Stall: {targetAlloc.stallCode} ({targetAlloc.marketName})</div>
                  <div>2. Holder: {targetAlloc.primaryVendorName}</div>
                  <div>
                    3. Base Tariff: RWF {targetAlloc.baseRentRwf.toLocaleString()}
                  </div>
                  <div className={targetAlloc.totalPenaltyRwf > 0 ? 'text-amber-400' : 'text-slate-400'}>
                    4. 5th-Day Arrears Fine: RWF {targetAlloc.totalPenaltyRwf.toLocaleString()}
                  </div>
                  <div className="pt-1 border-t border-slate-800 text-white font-bold">
                    TOTAL DUE: RWF{' '}
                    {(targetAlloc.totalBalanceDueRwf > 0
                      ? targetAlloc.totalBalanceDueRwf
                      : targetAlloc.baseRentRwf
                    ).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {ussdStep === 'CONFIRM_PIN' && targetAlloc && (
              <div className="space-y-3">
                <div className="text-amber-400 font-semibold">
                  CON Authorize {provider === 'MTN_MOMO' ? 'MTN MoMo (*182#)' : 'Airtel Money (*500#)'}
                </div>
                <div className="text-slate-300 space-y-1">
                  <div>Payer Tel: {targetAlloc.primaryVendorPhone}</div>
                  <div>Stall Asset: {targetAlloc.stallCode}</div>
                  <div className="text-white font-bold">
                    Debit Amount: RWF{' '}
                    {(targetAlloc.totalBalanceDueRwf > 0
                      ? targetAlloc.totalBalanceDueRwf
                      : targetAlloc.baseRentRwf
                    ).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Enter 4-Digit Mobile Money PIN:
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={momoPin}
                    onChange={(e) => setMomoPin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono tracking-widest focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            )}

            {ussdStep === 'RECEIPT' && targetAlloc && (
              <div className="space-y-2.5">
                <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>END USSD Session Completed</span>
                </div>
                <div className="text-slate-300 space-y-1">
                  <div>Receipt Ref: {lastReceiptRef}</div>
                  <div>Stall: {targetAlloc.stallCode}</div>
                  <div>
                    Mode:{' '}
                    {networkMode === 'OFFLINE_CACHE'
                      ? 'Queued in Offline Collector Cache'
                      : 'Settled Directly in GMMS Ledger'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUssdStep('MENU')}
                  className="text-xs text-emerald-400 underline pt-1"
                >
                  Dial New *909# Session →
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>Session: *909*1*{targetAlloc?.stallCode || 'KIM-B01'}#</span>
              <span>{simulatedDate}</span>
            </div>
          </div>

          {/* Handset Controls */}
          <form onSubmit={handleUssdDialSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Select Target Stall Account
                </label>
                <select
                  value={selectedAllocId}
                  onChange={(e) => {
                    setSelectedAllocId(e.target.value);
                    setUssdStep('MENU');
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs font-mono text-white"
                >
                  {allocations.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.stallCode} · RWF{' '}
                      {(a.totalBalanceDueRwf > 0 ? a.totalBalanceDueRwf : a.baseRentRwf).toLocaleString()}{' '}
                      ({a.paymentStatus === 'OVERDUE_ARREARS' ? 'Overdue' : a.paymentStatus})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Mobile Wallet Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) =>
                    setProvider(e.target.value as 'MTN_MOMO' | 'AIRTEL_MONEY')
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs font-mono text-white"
                >
                  <option value="MTN_MOMO">MTN MoMo (*182#)</option>
                  <option value="AIRTEL_MONEY">Airtel Money (*500#)</option>
                </select>
              </div>
            </div>

            {ussdStep !== 'RECEIPT' && (
              <div className="flex items-center gap-2">
                {ussdStep === 'CONFIRM_PIN' && (
                  <button
                    type="button"
                    onClick={() => setUssdStep('MENU')}
                    className="px-3 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-xs text-slate-300"
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {ussdStep === 'MENU'
                      ? '1. Proceed to MoMo PIN Prompt'
                      : networkMode === 'OFFLINE_CACHE'
                      ? '2. Sign & Queue Offline USSD Payment'
                      : '2. Confirm & Settle Immediately'}
                  </span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right 7 Columns: Offline & Synchronized USSD / MoMo Transaction Queue */}
        <div className="lg:col-span-7 border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-slate-900">
                USSD (*909#) &amp; Mobile Money Sync Buffer Ledger
              </h4>
              <p className="text-[11px] text-slate-500">
                Offline transactions remain buffered in local collector memory until synchronized with the central MySQL database.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-600 tabular-nums">
              {transactions.length} Total Sessions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3.5">MoMo Ref &amp; USSD Code</th>
                  <th className="py-2.5 px-3.5">Stall &amp; Vendor</th>
                  <th className="py-2.5 px-3.5">Wallet</th>
                  <th className="py-2.5 px-3.5 text-right">Amount (RWF)</th>
                  <th className="py-2.5 px-3.5">Sync State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3.5 font-mono tabular-nums">
                      <div className="font-semibold text-slate-900">{tx.momoRef}</div>
                      <div className="text-[11px] text-slate-500">{tx.ussdSessionCode}</div>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-slate-900">
                        {tx.stallCode} · {tx.payerName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                        {tx.payerPhone}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[11px]">
                      {tx.provider === 'MTN_MOMO' ? 'MTN MoMo' : 'Airtel Money'}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      RWF {tx.amountRwf.toLocaleString()}
                    </td>
                    <td className="py-3 px-3.5">
                      {tx.syncStatus === 'QUEUED_OFFLINE' ? (
                        <span className="text-amber-700 font-semibold">
                          Buffered Offline · Awaiting Sync
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium">
                          Synced to Ledger ({tx.syncedAt})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
