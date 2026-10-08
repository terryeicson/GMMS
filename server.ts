import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { computeAllocationPenalties, createInitialGMMSState } from './src/data/seedData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbState = createInitialGMMSState('2026-10-08');

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. GET full GMMS state (Visual Stall Mapping array, Allocations, Sub-Leases, Penalty Logs)
  app.get('/api/state', (_req, res) => {
    res.json(dbState);
  });

  // 2. POST /api/run-penalty-cron: L4 Requirement 2 - Smart Fine & Penalty Automation past the 5th of the month
  app.post('/api/run-penalty-cron', (req, res) => {
    const { simulatedDate, triggerType } = req.body || {};
    const targetDate = typeof simulatedDate === 'string' && simulatedDate.trim() ? simulatedDate.trim() : dbState.simulatedDate;

    dbState.simulatedDate = targetDate;
    dbState.allocations = dbState.allocations.map((alloc) => computeAllocationPenalties(alloc, targetDate));

    const overdueAccounts = dbState.allocations.filter((a) => a.paymentStatus === 'OVERDUE_ARREARS');
    const totalPenaltiesRwf = overdueAccounts.reduce((sum, a) => sum + a.totalPenaltyRwf, 0);
    const dayOfMonth = Number(targetDate.split('-')[2] || 8);

    const newLog = {
      id: `CRON-${targetDate.replace(/-/g, '')}-${String(dbState.penaltyLogs.length + 1).padStart(3, '0')}`,
      executedAt: `${targetDate} ${new Date().toTimeString().slice(0, 8)} CAT`,
      simulatedAssessmentDate: targetDate,
      dayOfMonthEvaluated: dayOfMonth,
      pastFifthThreshold: dayOfMonth > 5,
      accountsEvaluated: dbState.allocations.length,
      overdueAccountsFlagged: overdueAccounts.length,
      totalPenaltiesAssessedRwf: totalPenaltiesRwf,
      triggerType: triggerType || 'MANUAL_AUDIT',
    };

    dbState.penaltyLogs = [newLog, ...dbState.penaltyLogs.slice(0, 19)];
    res.json({ status: 'success', state: dbState, latestAudit: newLog });
  });

  // 3. POST /api/allocate: Allocate an available stall to a Primary Asset Holder (and optional Operational Sub-Tenant)
  app.post('/api/allocate', (req, res) => {
    const {
      stallId,
      primaryVendorName,
      primaryVendorNid,
      primaryVendorPhone,
      tinNumber,
      tradeCategory,
      initialPaidRwf,
      enableSubLease,
      operationalTenantName,
      operationalTenantNid,
      operationalTenantPhone,
      operationalTrade,
      subLeaseMonthlyChargeRwf,
    } = req.body || {};

    const stall = dbState.stalls.find((s) => s.id === stallId);
    if (!stall) {
      return res.status(404).json({ error: 'Selected stall not found in GMMS registry.' });
    }
    if (stall.occupancyStatus !== 'AVAILABLE') {
      return res.status(400).json({ error: `Stall ${stall.stallCode} is currently ${stall.occupancyStatus}.` });
    }

    const newVendorId = `VND-${String(dbState.vendors.length + 1).padStart(3, '0')}`;
    const cleanNid = String(primaryVendorNid || '1199080054120981').slice(0, 16);
    const newVendor = {
      id: newVendorId,
      nationalId: cleanNid,
      fullName: String(primaryVendorName || 'New Registered Vendor').trim(),
      phone: String(primaryVendorPhone || '+250 788 000 000').trim(),
      tinNumber: String(tinNumber || '105882190').trim(),
      tradeCategory: String(tradeCategory || 'General Merchandise').trim(),
      roleType: 'PRIMARY_HOLDER' as 'PRIMARY_HOLDER',
      registeredDate: dbState.simulatedDate,
    };
    dbState.vendors.unshift(newVendor);

    const billingPeriod = dbState.simulatedDate.slice(0, 7);
    const dueDate = `${billingPeriod}-05`;
    const paidAmount = Math.max(0, Math.min(stall.monthlyRentRwf, Number(initialPaidRwf) || 0));

    const newAllocationId = `ALC-2026-${String(dbState.allocations.length + 1).padStart(3, '0')}`;
    const rawAlloc = {
      id: newAllocationId,
      stallId: stall.id,
      stallCode: stall.stallCode,
      marketId: stall.marketId,
      marketName: stall.marketName,
      primaryVendorId: newVendor.id,
      primaryVendorName: newVendor.fullName,
      primaryVendorNid: newVendor.nationalId,
      primaryVendorPhone: newVendor.phone,
      tradeCategory: newVendor.tradeCategory,
      billingPeriod,
      dueDate,
      baseRentRwf: stall.monthlyRentRwf,
      paidAmountRwf: paidAmount,
      lastPaymentDate: paidAmount > 0 ? dbState.simulatedDate : null,
    };

    const computedAlloc = computeAllocationPenalties(rawAlloc, dbState.simulatedDate);
    dbState.allocations.unshift(computedAlloc);

    // Update Visual Stall Mapping state
    stall.occupancyStatus = enableSubLease && operationalTenantName ? 'SUB_LEASED' : 'OCCUPIED';

    // If Sub-Letting is enabled at registration, create relational link in Sub-Lease Ledger
    if (enableSubLease && operationalTenantName) {
      const tenantId = `VND-${String(dbState.vendors.length + 1).padStart(3, '0')}`;
      const tenantVendor = {
        id: tenantId,
        nationalId: String(operationalTenantNid || '1199680071239012').slice(0, 16),
        fullName: String(operationalTenantName).trim(),
        phone: String(operationalTenantPhone || '+250 783 111 222').trim(),
        tinNumber: `107${Math.floor(100000 + Math.random() * 899999)}`,
        tradeCategory: String(operationalTrade || tradeCategory || 'Retail Trade').trim(),
        roleType: 'OPERATIONAL_TENANT' as const,
        registeredDate: dbState.simulatedDate,
      };
      dbState.vendors.unshift(tenantVendor);

      const chargeRwf = Number(subLeaseMonthlyChargeRwf) || Math.round(stall.monthlyRentRwf * 1.1);
      const markupPct = Number((((chargeRwf - stall.monthlyRentRwf) / stall.monthlyRentRwf) * 100).toFixed(1));
      const authStatus = markupPct > 15 ? 'MARGIN_VIOLATION' : 'AUTHORIZED';

      dbState.subLeases.unshift({
        id: `SUB-2026-${String(dbState.subLeases.length + 1).padStart(3, '0')}`,
        permitNumber: `SL-${stall.marketId === 'MKT-KIM' ? 'GAS' : 'NYA'}-2026-${String(dbState.subLeases.length + 70).padStart(3, '0')}`,
        allocationId: newAllocationId,
        stallId: stall.id,
        stallCode: stall.stallCode,
        marketName: stall.marketName,
        primaryVendorId: newVendor.id,
        primaryVendorName: newVendor.fullName,
        primaryVendorNid: newVendor.nationalId,
        primaryVendorPhone: newVendor.phone,
        operationalTenantId: tenantVendor.id,
        operationalTenantName: tenantVendor.fullName,
        operationalTenantNid: tenantVendor.nationalId,
        operationalTenantPhone: tenantVendor.phone,
        operationalTrade: tenantVendor.tradeCategory,
        governmentBaseRentRwf: stall.monthlyRentRwf,
        subLeaseMonthlyChargeRwf: chargeRwf,
        markupPercentage: markupPct,
        authorizationStatus: authStatus,
        startDate: dbState.simulatedDate,
        endDate: '2027-04-30',
      });
    }

    res.json({ status: 'success', state: dbState });
  });

  // 4. POST /api/sublease: Register a new Sub-Lease on an existing Occupied Stall (Requirement 3)
  app.post('/api/sublease', (req, res) => {
    const {
      allocationId,
      operationalTenantName,
      operationalTenantNid,
      operationalTenantPhone,
      operationalTrade,
      subLeaseMonthlyChargeRwf,
      startDate,
      endDate,
    } = req.body || {};

    const alloc = dbState.allocations.find((a) => a.id === allocationId);
    if (!alloc) {
      return res.status(404).json({ error: 'Primary stall allocation not found.' });
    }

    const stall = dbState.stalls.find((s) => s.id === alloc.stallId);
    if (stall) {
      stall.occupancyStatus = 'SUB_LEASED';
    }

    const tenantId = `VND-${String(dbState.vendors.length + 1).padStart(3, '0')}`;
    const tenantVendor = {
      id: tenantId,
      nationalId: String(operationalTenantNid || '1199580034192837').slice(0, 16),
      fullName: String(operationalTenantName || 'Operational Sub-Tenant').trim(),
      phone: String(operationalTenantPhone || '+250 788 555 111').trim(),
      tinNumber: `107${Math.floor(100000 + Math.random() * 899999)}`,
      tradeCategory: String(operationalTrade || alloc.tradeCategory).trim(),
      roleType: 'OPERATIONAL_TENANT' as const,
      registeredDate: dbState.simulatedDate,
    };
    dbState.vendors.unshift(tenantVendor);

    const chargeRwf = Number(subLeaseMonthlyChargeRwf) || Math.round(alloc.baseRentRwf * 1.1);
    const markupPct = Number((((chargeRwf - alloc.baseRentRwf) / alloc.baseRentRwf) * 100).toFixed(1));
    const authStatus = markupPct > 15 ? 'MARGIN_VIOLATION' : 'AUTHORIZED';

    // Remove existing sublease for this stall if any, then add updated relational link
    dbState.subLeases = dbState.subLeases.filter((sl) => sl.allocationId !== alloc.id);
    dbState.subLeases.unshift({
      id: `SUB-2026-${String(dbState.subLeases.length + 1).padStart(3, '0')}`,
      permitNumber: `SL-${alloc.marketId === 'MKT-KIM' ? 'GAS' : 'NYA'}-2026-${String(dbState.subLeases.length + 80).padStart(3, '0')}`,
      allocationId: alloc.id,
      stallId: alloc.stallId,
      stallCode: alloc.stallCode,
      marketName: alloc.marketName,
      primaryVendorId: alloc.primaryVendorId,
      primaryVendorName: alloc.primaryVendorName,
      primaryVendorNid: alloc.primaryVendorNid,
      primaryVendorPhone: alloc.primaryVendorPhone,
      operationalTenantId: tenantVendor.id,
      operationalTenantName: tenantVendor.fullName,
      operationalTenantNid: tenantVendor.nationalId,
      operationalTenantPhone: tenantVendor.phone,
      operationalTrade: tenantVendor.tradeCategory,
      governmentBaseRentRwf: alloc.baseRentRwf,
      subLeaseMonthlyChargeRwf: chargeRwf,
      markupPercentage: markupPct,
      authorizationStatus: authStatus,
      startDate: startDate || dbState.simulatedDate,
      endDate: endDate || '2027-04-30',
    });

    res.json({ status: 'success', state: dbState });
  });

  // 5. POST /api/revoke-sublease: Terminate sub-lease & return stall operation to Primary Asset Holder
  app.post('/api/revoke-sublease', (req, res) => {
    const { subLeaseId } = req.body || {};
    const target = dbState.subLeases.find((s) => s.id === subLeaseId);
    if (!target) {
      return res.status(404).json({ error: 'Sub-lease record not found.' });
    }
    dbState.subLeases = dbState.subLeases.filter((s) => s.id !== subLeaseId);
    const stall = dbState.stalls.find((st) => st.id === target.stallId);
    if (stall) {
      stall.occupancyStatus = 'OCCUPIED';
    }
    res.json({ status: 'success', state: dbState });
  });

  // 6. POST /api/pay: Settle rent & accumulated penalties for an allocation
  app.post('/api/pay', (req, res) => {
    const { allocationId, amountRwf } = req.body || {};
    const index = dbState.allocations.findIndex((a) => a.id === allocationId);
    if (index === -1) {
      return res.status(404).json({ error: 'Allocation record not found.' });
    }

    const current = dbState.allocations[index];
    const newPaidBase = amountRwf
      ? Math.min(current.baseRentRwf, current.paidAmountRwf + Number(amountRwf))
      : current.baseRentRwf;

    const updatedRaw = {
      ...current,
      paidAmountRwf: newPaidBase,
      lastPaymentDate: dbState.simulatedDate,
    };

    dbState.allocations[index] = computeAllocationPenalties(updatedRaw, dbState.simulatedDate);
    res.json({ status: 'success', state: dbState });
  });

  // 7. POST /api/toggle-stall-maintenance: Toggle between AVAILABLE and MAINTENANCE for unallocated stalls
  app.post('/api/toggle-stall-maintenance', (req, res) => {
    const { stallId } = req.body || {};
    const stall = dbState.stalls.find((s) => s.id === stallId);
    if (!stall) {
      return res.status(404).json({ error: 'Stall not found.' });
    }
    if (stall.occupancyStatus === 'AVAILABLE') {
      stall.occupancyStatus = 'MAINTENANCE';
    } else if (stall.occupancyStatus === 'MAINTENANCE') {
      stall.occupancyStatus = 'AVAILABLE';
    }
    res.json({ status: 'success', state: dbState });
  });

  // 8. POST /api/reset: Restore default Rwandan municipal dataset
  app.post('/api/reset', (_req, res) => {
    dbState = createInitialGMMSState('2026-10-08');
    res.json({ status: 'success', state: dbState });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GMMS Full-Stack Server listening on http://localhost:${PORT}`);
  });
}

startServer();
