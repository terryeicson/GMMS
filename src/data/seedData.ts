import {
  GMMSState,
  MarketHub,
  PenaltyAuditLog,
  StallAllocation,
  StallAsset,
  SubLeaseRecord,
  VendorCitizen,
} from '../types/gmms.ts';

export function computeAllocationPenalties(
  allocation: Omit<
    StallAllocation,
    'daysOverdue' | 'statutoryFeeRwf' | 'dailyCumulativePenaltyRwf' | 'totalPenaltyRwf' | 'totalBalanceDueRwf' | 'paymentStatus'
  >,
  simulatedDateStr: string
): StallAllocation {
  const unpaidBase = Math.max(0, allocation.baseRentRwf - allocation.paidAmountRwf);

  // Parse day of month from YYYY-MM-DD
  const parts = simulatedDateStr.split('-').map(Number);
  const simYear = parts[0] || 2026;
  const simMonth = parts[1] || 10;
  const simDay = parts[2] || 8;

  const dueParts = allocation.dueDate.split('-').map(Number);
  const dueYear = dueParts[0] || 2026;
  const dueMonth = dueParts[1] || 10;
  const dueDay = dueParts[2] || 5;

  // Calculate days past the 5th of the billing month
  let daysOverdue = 0;
  if (simYear > dueYear || (simYear === dueYear && simMonth > dueMonth)) {
    const simDateObj = new Date(simYear, simMonth - 1, simDay);
    const dueDateObj = new Date(dueYear, dueMonth - 1, dueDay);
    daysOverdue = Math.max(0, Math.round((simDateObj.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24)));
  } else if (simYear === dueYear && simMonth === dueMonth && simDay > dueDay) {
    daysOverdue = simDay - dueDay;
  }

  if (unpaidBase === 0) {
    return {
      ...allocation,
      daysOverdue: 0,
      statutoryFeeRwf: 0,
      dailyCumulativePenaltyRwf: 0,
      totalPenaltyRwf: 0,
      totalBalanceDueRwf: 0,
      paymentStatus: 'PAID',
    };
  }

  if (daysOverdue <= 0) {
    return {
      ...allocation,
      daysOverdue: 0,
      statutoryFeeRwf: 0,
      dailyCumulativePenaltyRwf: 0,
      totalPenaltyRwf: 0,
      totalBalanceDueRwf: unpaidBase,
      paymentStatus: allocation.paidAmountRwf > 0 ? 'PARTIAL' : 'PENDING_GRACE',
    };
  }

  // L4 Smart Fine & Penalty Automation Rule (Past the 5th of the Calendar Month):
  // 1. 5% Flat Statutory Arrears Trigger Fee on unpaid base balance once past the 5th
  // 2. 1% Daily Cumulative Surcharge for every calendar day past the 5th
  const statutoryFeeRwf = Math.round(unpaidBase * 0.05);
  const dailyCumulativePenaltyRwf = Math.round(unpaidBase * 0.01 * daysOverdue);
  const totalPenaltyRwf = statutoryFeeRwf + dailyCumulativePenaltyRwf;
  const totalBalanceDueRwf = unpaidBase + totalPenaltyRwf;

  return {
    ...allocation,
    daysOverdue,
    statutoryFeeRwf,
    dailyCumulativePenaltyRwf,
    totalPenaltyRwf,
    totalBalanceDueRwf,
    paymentStatus: 'OVERDUE_ARREARS',
  };
}

export function createInitialGMMSState(initialDate = '2026-10-08'): GMMSState {
  const markets: MarketHub[] = [
    {
      id: 'MKT-KIM',
      code: 'KIM-01',
      name: 'Kimironko Market',
      district: 'Gasabo District',
      sector: 'Kimironko Sector',
      totalStalls: 16,
      managerName: 'Mugenzi Jean Bosco',
    },
    {
      id: 'MKT-NYA',
      code: 'NYA-02',
      name: 'Nyabugogo Market',
      district: 'Nyarugenge District',
      sector: 'Muhima Sector',
      totalStalls: 16,
      managerName: 'Mukandayisenga Solange',
    },
  ];

  const vendors: VendorCitizen[] = [
    {
      id: 'VND-001',
      nationalId: '1198580041203089',
      fullName: 'Uwimana Marie Claire',
      phone: '+250 788 412 093',
      tinNumber: '104892103',
      tradeCategory: 'Fresh Agricultural Produce',
      roleType: 'PRIMARY_HOLDER',
      registeredDate: '2024-02-14',
    },
    {
      id: 'VND-002',
      nationalId: '1197980028910412',
      fullName: 'Habimana Jean Paul',
      phone: '+250 788 530 118',
      tinNumber: '103781920',
      tradeCategory: 'Kitenge & Apparel Textiles',
      roleType: 'PRIMARY_HOLDER',
      registeredDate: '2023-08-01',
    },
    {
      id: 'VND-003',
      nationalId: '1199070065120045',
      fullName: 'Mukamana Vestine',
      phone: '+250 783 901 442',
      tinNumber: '105903411',
      tradeCategory: 'Dry Grains & Legumes',
      roleType: 'PRIMARY_HOLDER',
      registeredDate: '2024-05-19',
    },
    {
      id: 'VND-004',
      nationalId: '1198280091034517',
      fullName: 'Ndayisaba Eric',
      phone: '+250 788 619 820',
      tinNumber: '104112098',
      tradeCategory: 'Agaseke & Artisanal Crafts',
      roleType: 'PRIMARY_HOLDER',
      registeredDate: '2023-11-10',
    },
    {
      id: 'VND-005',
      nationalId: '1199270033491028',
      fullName: 'Ingabire Diane',
      phone: '+250 785 214 776',
      tinNumber: '106234890',
      tradeCategory: 'Butchery & Cold Chain Dairy',
      roleType: 'PRIMARY_HOLDER',
      registeredDate: '2025-01-08',
    },
    {
      id: 'VND-006',
      nationalId: '1198880077231094',
      fullName: 'Mugisha Patrick',
      phone: '+250 788 309 551',
      tinNumber: '105001923',
      tradeCategory: 'Wholesale Rice & Flour',
      roleType: 'PRIMARY_HOLDER',
      registeredDate: '2024-03-22',
    },
    {
      id: 'VND-007',
      nationalId: '1198480055192031',
      fullName: 'Nkurunziza Emmanuel',
      phone: '+250 788 742 310',
      tinNumber: '104558219',
      tradeCategory: 'Domestic Hardware & Tools',
      roleType: 'PRIMARY_HOLDER',
      registeredDate: '2023-09-15',
    },
    {
      id: 'VND-008',
      nationalId: '1199470019823401',
      fullName: 'Mutoni Aline',
      phone: '+250 782 608 194',
      tinNumber: '106891204',
      tradeCategory: 'Footwear & Leather Goods',
      roleType: 'PRIMARY_HOLDER',
      registeredDate: '2025-04-02',
    },
    {
      id: 'VND-009',
      nationalId: '1198180084102938',
      fullName: 'Bizimana Claude',
      phone: '+250 788 915 402',
      tinNumber: '103994012',
      tradeCategory: 'Electronics & Solar Lamps',
      roleType: 'PRIMARY_HOLDER',
      registeredDate: '2024-07-11',
    },
    {
      id: 'VND-010',
      nationalId: '1199170042901823',
      fullName: 'Umutoniwase Chantal',
      phone: '+250 786 331 098',
      tinNumber: '105772310',
      tradeCategory: 'Spices & Cassava Flour',
      roleType: 'PRIMARY_HOLDER',
      registeredDate: '2024-10-03',
    },
    // Operational Sub-Tenants (Citizens operating stalls leased from Primary Asset Holders)
    {
      id: 'VND-011',
      nationalId: '1199680011294055',
      fullName: 'Tuyisenge Fabrice',
      phone: '+250 789 104 582',
      tinNumber: '107110294',
      tradeCategory: 'Tailoring & Kitenge Alterations',
      roleType: 'OPERATIONAL_TENANT',
      registeredDate: '2026-01-15',
    },
    {
      id: 'VND-012',
      nationalId: '1199570088341029',
      fullName: 'Nyirahabimana Claudine',
      phone: '+250 784 882 319',
      tinNumber: '107392011',
      tradeCategory: 'Handwoven Baskets & Souvenirs',
      roleType: 'OPERATIONAL_TENANT',
      registeredDate: '2026-03-01',
    },
    {
      id: 'VND-013',
      nationalId: '1199380061902384',
      fullName: 'Kamanzi Olivier',
      phone: '+250 787 409 221',
      tinNumber: '106948102',
      tradeCategory: 'Mobile Accessories & Repairs',
      roleType: 'OPERATIONAL_TENANT',
      registeredDate: '2026-02-10',
    },
    {
      id: 'VND-014',
      nationalId: '1199770029183746',
      fullName: 'Uwase Sandrine',
      phone: '+250 783 512 890',
      tinNumber: '107551920',
      tradeCategory: 'Wholesale Cereals & Sorghum',
      roleType: 'OPERATIONAL_TENANT',
      registeredDate: '2026-05-01',
    },
  ];

  const stalls: StallAsset[] = [
    // Kimironko Market (16 Stalls: 4x4 spatial matrix)
    { id: 'STL-KIM-A01', stallCode: 'KIM-A01', marketId: 'MKT-KIM', marketName: 'Kimironko Market', zoneName: 'Zone A · Produce', gridRow: 1, gridCol: 1, sizeSqm: 12, monthlyRentRwf: 60000, occupancyStatus: 'OCCUPIED' },
    { id: 'STL-KIM-A02', stallCode: 'KIM-A02', marketId: 'MKT-KIM', marketName: 'Kimironko Market', zoneName: 'Zone A · Produce', gridRow: 1, gridCol: 2, sizeSqm: 12, monthlyRentRwf: 60000, occupancyStatus: 'AVAILABLE' },
    { id: 'STL-KIM-A03', stallCode: 'KIM-A03', marketId: 'MKT-KIM', marketName: 'Kimironko Market', zoneName: 'Zone A · Produce', gridRow: 1, gridCol: 3, sizeSqm: 15, monthlyRentRwf: 75000, occupancyStatus: 'OCCUPIED' },
    { id: 'STL-KIM-A04', stallCode: 'KIM-A04', marketId: 'MKT-KIM', marketName: 'Kimironko Market', zoneName: 'Zone A · Produce', gridRow: 1, gridCol: 4, sizeSqm: 15, monthlyRentRwf: 75000, occupancyStatus: 'AVAILABLE' },

    { id: 'STL-KIM-B01', stallCode: 'KIM-B01', marketId: 'MKT-KIM', marketName: 'Kimironko Market', zoneName: 'Zone B · Textiles', gridRow: 2, gridCol: 1, sizeSqm: 18, monthlyRentRwf: 90000, occupancyStatus: 'SUB_LEASED' },
    { id: 'STL-KIM-B02', stallCode: 'KIM-B02', marketId: 'MKT-KIM', marketName: 'Kimironko Market', zoneName: 'Zone B · Textiles', gridRow: 2, gridCol: 2, sizeSqm: 18, monthlyRentRwf: 90000, occupancyStatus: 'OCCUPIED' },
    { id: 'STL-KIM-B03', stallCode: 'KIM-B03', marketId: 'MKT-KIM', marketName: 'Kimironko Market', zoneName: 'Zone B · Textiles', gridRow: 2, gridCol: 3, sizeSqm: 18, monthlyRentRwf: 90000, occupancyStatus: 'AVAILABLE' },
    { id: 'STL-KIM-B04', stallCode: 'KIM-B04', marketId: 'MKT-KIM', marketName: 'Kimironko Market', zoneName: 'Zone B · Textiles', gridRow: 2, gridCol: 4, sizeSqm: 18, monthlyRentRwf: 90000, occupancyStatus: 'MAINTENANCE' },

    { id: 'STL-KIM-C01', stallCode: 'KIM-C01', marketId: 'MKT-KIM', marketName: 'Kimironko Market', zoneName: 'Zone C · Crafts', gridRow: 3, gridCol: 1, sizeSqm: 14, monthlyRentRwf: 70000, occupancyStatus: 'SUB_LEASED' },
    { id: 'STL-KIM-C02', stallCode: 'KIM-C02', marketId: 'MKT-KIM', marketName: 'Kimironko Market', zoneName: 'Zone C · Crafts', gridRow: 3, gridCol: 2, sizeSqm: 14, monthlyRentRwf: 70000, occupancyStatus: 'AVAILABLE' },
    { id: 'STL-KIM-C03', stallCode: 'KIM-C03', marketId: 'MKT-KIM', marketName: 'Kimironko Market', zoneName: 'Zone C · Crafts', gridRow: 3, gridCol: 3, sizeSqm: 14, monthlyRentRwf: 70000, occupancyStatus: 'AVAILABLE' },
    { id: 'STL-KIM-C04', stallCode: 'KIM-C04', marketId: 'MKT-KIM', marketName: 'Kimironko Market', zoneName: 'Zone C · Crafts', gridRow: 3, gridCol: 4, sizeSqm: 14, monthlyRentRwf: 70000, occupancyStatus: 'OCCUPIED' },

    { id: 'STL-KIM-D01', stallCode: 'KIM-D01', marketId: 'MKT-KIM', marketName: 'Kimironko Market', zoneName: 'Zone D · Cold Chain', gridRow: 4, gridCol: 1, sizeSqm: 20, monthlyRentRwf: 110000, occupancyStatus: 'OCCUPIED' },
    { id: 'STL-KIM-D02', stallCode: 'KIM-D02', marketId: 'MKT-KIM', marketName: 'Kimironko Market', zoneName: 'Zone D · Cold Chain', gridRow: 4, gridCol: 2, sizeSqm: 20, monthlyRentRwf: 110000, occupancyStatus: 'AVAILABLE' },
    { id: 'STL-KIM-D03', stallCode: 'KIM-D03', marketId: 'MKT-KIM', marketName: 'Kimironko Market', zoneName: 'Zone D · Cold Chain', gridRow: 4, gridCol: 3, sizeSqm: 20, monthlyRentRwf: 110000, occupancyStatus: 'AVAILABLE' },
    { id: 'STL-KIM-D04', stallCode: 'KIM-D04', marketId: 'MKT-KIM', marketName: 'Kimironko Market', zoneName: 'Zone D · Cold Chain', gridRow: 4, gridCol: 4, sizeSqm: 20, monthlyRentRwf: 110000, occupancyStatus: 'AVAILABLE' },

    // Nyabugogo Market (16 Stalls: 4x4 spatial matrix)
    { id: 'STL-NYA-A01', stallCode: 'NYA-A01', marketId: 'MKT-NYA', marketName: 'Nyabugogo Market', zoneName: 'Zone A · Wholesale', gridRow: 1, gridCol: 1, sizeSqm: 24, monthlyRentRwf: 120000, occupancyStatus: 'SUB_LEASED' },
    { id: 'STL-NYA-A02', stallCode: 'NYA-A02', marketId: 'MKT-NYA', marketName: 'Nyabugogo Market', zoneName: 'Zone A · Wholesale', gridRow: 1, gridCol: 2, sizeSqm: 24, monthlyRentRwf: 120000, occupancyStatus: 'OCCUPIED' },
    { id: 'STL-NYA-A03', stallCode: 'NYA-A03', marketId: 'MKT-NYA', marketName: 'Nyabugogo Market', zoneName: 'Zone A · Wholesale', gridRow: 1, gridCol: 3, sizeSqm: 24, monthlyRentRwf: 120000, occupancyStatus: 'AVAILABLE' },
    { id: 'STL-NYA-A04', stallCode: 'NYA-A04', marketId: 'MKT-NYA', marketName: 'Nyabugogo Market', zoneName: 'Zone A · Wholesale', gridRow: 1, gridCol: 4, sizeSqm: 24, monthlyRentRwf: 120000, occupancyStatus: 'AVAILABLE' },

    { id: 'STL-NYA-B01', stallCode: 'NYA-B01', marketId: 'MKT-NYA', marketName: 'Nyabugogo Market', zoneName: 'Zone B · Hardware', gridRow: 2, gridCol: 1, sizeSqm: 16, monthlyRentRwf: 85000, occupancyStatus: 'OCCUPIED' },
    { id: 'STL-NYA-B02', stallCode: 'NYA-B02', marketId: 'MKT-NYA', marketName: 'Nyabugogo Market', zoneName: 'Zone B · Hardware', gridRow: 2, gridCol: 2, sizeSqm: 16, monthlyRentRwf: 85000, occupancyStatus: 'AVAILABLE' },
    { id: 'STL-NYA-B03', stallCode: 'NYA-B03', marketId: 'MKT-NYA', marketName: 'Nyabugogo Market', zoneName: 'Zone B · Hardware', gridRow: 2, gridCol: 3, sizeSqm: 16, monthlyRentRwf: 85000, occupancyStatus: 'MAINTENANCE' },
    { id: 'STL-NYA-B04', stallCode: 'NYA-B04', marketId: 'MKT-NYA', marketName: 'Nyabugogo Market', zoneName: 'Zone B · Hardware', gridRow: 2, gridCol: 4, sizeSqm: 16, monthlyRentRwf: 85000, occupancyStatus: 'AVAILABLE' },

    { id: 'STL-NYA-C01', stallCode: 'NYA-C01', marketId: 'MKT-NYA', marketName: 'Nyabugogo Market', zoneName: 'Zone C · Apparel', gridRow: 3, gridCol: 1, sizeSqm: 15, monthlyRentRwf: 80000, occupancyStatus: 'OCCUPIED' },
    { id: 'STL-NYA-C02', stallCode: 'NYA-C02', marketId: 'MKT-NYA', marketName: 'Nyabugogo Market', zoneName: 'Zone C · Apparel', gridRow: 3, gridCol: 2, sizeSqm: 15, monthlyRentRwf: 80000, occupancyStatus: 'AVAILABLE' },
    { id: 'STL-NYA-C03', stallCode: 'NYA-C03', marketId: 'MKT-NYA', marketName: 'Nyabugogo Market', zoneName: 'Zone C · Apparel', gridRow: 3, gridCol: 3, sizeSqm: 15, monthlyRentRwf: 80000, occupancyStatus: 'AVAILABLE' },
    { id: 'STL-NYA-C04', stallCode: 'NYA-C04', marketId: 'MKT-NYA', marketName: 'Nyabugogo Market', zoneName: 'Zone C · Apparel', gridRow: 3, gridCol: 4, sizeSqm: 15, monthlyRentRwf: 80000, occupancyStatus: 'AVAILABLE' },

    { id: 'STL-NYA-D01', stallCode: 'NYA-D01', marketId: 'MKT-NYA', marketName: 'Nyabugogo Market', zoneName: 'Zone D · Electronics', gridRow: 4, gridCol: 1, sizeSqm: 18, monthlyRentRwf: 95000, occupancyStatus: 'SUB_LEASED' },
    { id: 'STL-NYA-D02', stallCode: 'NYA-D02', marketId: 'MKT-NYA', marketName: 'Nyabugogo Market', zoneName: 'Zone D · Electronics', gridRow: 4, gridCol: 2, sizeSqm: 18, monthlyRentRwf: 95000, occupancyStatus: 'AVAILABLE' },
    { id: 'STL-NYA-D03', stallCode: 'NYA-D03', marketId: 'MKT-NYA', marketName: 'Nyabugogo Market', zoneName: 'Zone D · Electronics', gridRow: 4, gridCol: 3, sizeSqm: 18, monthlyRentRwf: 95000, occupancyStatus: 'AVAILABLE' },
    { id: 'STL-NYA-D04', stallCode: 'NYA-D04', marketId: 'MKT-NYA', marketName: 'Nyabugogo Market', zoneName: 'Zone D · Electronics', gridRow: 4, gridCol: 4, sizeSqm: 18, monthlyRentRwf: 95000, occupancyStatus: 'AVAILABLE' },
  ];

  const rawAllocations: Omit<
    StallAllocation,
    'daysOverdue' | 'statutoryFeeRwf' | 'dailyCumulativePenaltyRwf' | 'totalPenaltyRwf' | 'totalBalanceDueRwf' | 'paymentStatus'
  >[] = [
    {
      id: 'ALC-2026-001',
      stallId: 'STL-KIM-A01',
      stallCode: 'KIM-A01',
      marketId: 'MKT-KIM',
      marketName: 'Kimironko Market',
      primaryVendorId: 'VND-001',
      primaryVendorName: 'Uwimana Marie Claire',
      primaryVendorNid: '1198580041203089',
      primaryVendorPhone: '+250 788 412 093',
      tradeCategory: 'Fresh Agricultural Produce',
      billingPeriod: '2026-10',
      dueDate: '2026-10-05',
      baseRentRwf: 60000,
      paidAmountRwf: 60000,
      lastPaymentDate: '2026-10-03',
    },
    {
      id: 'ALC-2026-002',
      stallId: 'STL-KIM-B01',
      stallCode: 'KIM-B01',
      marketId: 'MKT-KIM',
      marketName: 'Kimironko Market',
      primaryVendorId: 'VND-002',
      primaryVendorName: 'Habimana Jean Paul',
      primaryVendorNid: '1197980028910412',
      primaryVendorPhone: '+250 788 530 118',
      tradeCategory: 'Kitenge & Apparel Textiles',
      billingPeriod: '2026-10',
      dueDate: '2026-10-05',
      baseRentRwf: 90000,
      paidAmountRwf: 0, // Unpaid past Oct 5 -> Triggers Smart Penalty Automation!
      lastPaymentDate: null,
    },
    {
      id: 'ALC-2026-003',
      stallId: 'STL-KIM-A03',
      stallCode: 'KIM-A03',
      marketId: 'MKT-KIM',
      marketName: 'Kimironko Market',
      primaryVendorId: 'VND-003',
      primaryVendorName: 'Mukamana Vestine',
      primaryVendorNid: '1199070065120045',
      primaryVendorPhone: '+250 783 901 442',
      tradeCategory: 'Dry Grains & Legumes',
      billingPeriod: '2026-10',
      dueDate: '2026-10-05',
      baseRentRwf: 75000,
      paidAmountRwf: 75000,
      lastPaymentDate: '2026-10-04',
    },
    {
      id: 'ALC-2026-004',
      stallId: 'STL-KIM-C01',
      stallCode: 'KIM-C01',
      marketId: 'MKT-KIM',
      marketName: 'Kimironko Market',
      primaryVendorId: 'VND-004',
      primaryVendorName: 'Ndayisaba Eric',
      primaryVendorNid: '1198280091034517',
      primaryVendorPhone: '+250 788 619 820',
      tradeCategory: 'Agaseke & Artisanal Crafts',
      billingPeriod: '2026-10',
      dueDate: '2026-10-05',
      baseRentRwf: 70000,
      paidAmountRwf: 70000,
      lastPaymentDate: '2026-10-02',
    },
    {
      id: 'ALC-2026-005',
      stallId: 'STL-KIM-D01',
      stallCode: 'KIM-D01',
      marketId: 'MKT-KIM',
      marketName: 'Kimironko Market',
      primaryVendorId: 'VND-005',
      primaryVendorName: 'Ingabire Diane',
      primaryVendorNid: '1199270033491028',
      primaryVendorPhone: '+250 785 214 776',
      tradeCategory: 'Butchery & Cold Chain Dairy',
      billingPeriod: '2026-10',
      dueDate: '2026-10-05',
      baseRentRwf: 110000,
      paidAmountRwf: 30000, // Partial payment, 80,000 RWF in arrears past the 5th!
      lastPaymentDate: '2026-10-01',
    },
    {
      id: 'ALC-2026-006',
      stallId: 'STL-KIM-B02',
      stallCode: 'KIM-B02',
      marketId: 'MKT-KIM',
      marketName: 'Kimironko Market',
      primaryVendorId: 'VND-010',
      primaryVendorName: 'Umutoniwase Chantal',
      primaryVendorNid: '1199170042901823',
      primaryVendorPhone: '+250 786 331 098',
      tradeCategory: 'Spices & Cassava Flour',
      billingPeriod: '2026-10',
      dueDate: '2026-10-05',
      baseRentRwf: 90000,
      paidAmountRwf: 90000,
      lastPaymentDate: '2026-10-05',
    },
    {
      id: 'ALC-2026-007',
      stallId: 'STL-KIM-C04',
      stallCode: 'KIM-C04',
      marketId: 'MKT-KIM',
      marketName: 'Kimironko Market',
      primaryVendorId: 'VND-008',
      primaryVendorName: 'Mutoni Aline',
      primaryVendorNid: '1199470019823401',
      primaryVendorPhone: '+250 782 608 194',
      tradeCategory: 'Footwear & Leather Goods',
      billingPeriod: '2026-10',
      dueDate: '2026-10-05',
      baseRentRwf: 70000,
      paidAmountRwf: 0, // Unpaid past Oct 5 -> Overdue Arrears!
      lastPaymentDate: null,
    },
    {
      id: 'ALC-2026-008',
      stallId: 'STL-NYA-A01',
      stallCode: 'NYA-A01',
      marketId: 'MKT-NYA',
      marketName: 'Nyabugogo Market',
      primaryVendorId: 'VND-006',
      primaryVendorName: 'Mugisha Patrick',
      primaryVendorNid: '1198880077231094',
      primaryVendorPhone: '+250 788 309 551',
      tradeCategory: 'Wholesale Rice & Flour',
      billingPeriod: '2026-10',
      dueDate: '2026-10-05',
      baseRentRwf: 120000,
      paidAmountRwf: 120000,
      lastPaymentDate: '2026-10-04',
    },
    {
      id: 'ALC-2026-009',
      stallId: 'STL-NYA-A02',
      stallCode: 'NYA-A02',
      marketId: 'MKT-NYA',
      marketName: 'Nyabugogo Market',
      primaryVendorId: 'VND-007',
      primaryVendorName: 'Nkurunziza Emmanuel',
      primaryVendorNid: '1198480055192031',
      primaryVendorPhone: '+250 788 742 310',
      tradeCategory: 'Domestic Hardware & Tools',
      billingPeriod: '2026-10',
      dueDate: '2026-10-05',
      baseRentRwf: 120000,
      paidAmountRwf: 0, // Unpaid past Oct 5 -> Overdue Arrears!
      lastPaymentDate: null,
    },
    {
      id: 'ALC-2026-010',
      stallId: 'STL-NYA-B01',
      stallCode: 'NYA-B01',
      marketId: 'MKT-NYA',
      marketName: 'Nyabugogo Market',
      primaryVendorId: 'VND-003',
      primaryVendorName: 'Mukamana Vestine',
      primaryVendorNid: '1199070065120045',
      primaryVendorPhone: '+250 783 901 442',
      tradeCategory: 'Dry Grains & Legumes',
      billingPeriod: '2026-10',
      dueDate: '2026-10-05',
      baseRentRwf: 85000,
      paidAmountRwf: 85000,
      lastPaymentDate: '2026-10-02',
    },
    {
      id: 'ALC-2026-011',
      stallId: 'STL-NYA-C01',
      stallCode: 'NYA-C01',
      marketId: 'MKT-NYA',
      marketName: 'Nyabugogo Market',
      primaryVendorId: 'VND-008',
      primaryVendorName: 'Mutoni Aline',
      primaryVendorNid: '1199470019823401',
      primaryVendorPhone: '+250 782 608 194',
      tradeCategory: 'Footwear & Leather Goods',
      billingPeriod: '2026-10',
      dueDate: '2026-10-05',
      baseRentRwf: 80000,
      paidAmountRwf: 80000,
      lastPaymentDate: '2026-10-05',
    },
    {
      id: 'ALC-2026-012',
      stallId: 'STL-NYA-D01',
      stallCode: 'NYA-D01',
      marketId: 'MKT-NYA',
      marketName: 'Nyabugogo Market',
      primaryVendorId: 'VND-009',
      primaryVendorName: 'Bizimana Claude',
      primaryVendorNid: '1198180084102938',
      primaryVendorPhone: '+250 788 915 402',
      tradeCategory: 'Electronics & Solar Lamps',
      billingPeriod: '2026-10',
      dueDate: '2026-10-05',
      baseRentRwf: 95000,
      paidAmountRwf: 0, // Unpaid past Oct 5 -> Overdue Arrears!
      lastPaymentDate: null,
    },
  ];

  const allocations: StallAllocation[] = rawAllocations.map((a) => computeAllocationPenalties(a, initialDate));

  // L4 Requirement 3: Vendor Sub-Letting Tracking Ledger (Primary Asset Holder -> Current Operational Tenant)
  const subLeases: SubLeaseRecord[] = [
    {
      id: 'SUB-2026-001',
      permitNumber: 'SL-GAS-2026-014',
      allocationId: 'ALC-2026-002',
      stallId: 'STL-KIM-B01',
      stallCode: 'KIM-B01',
      marketName: 'Kimironko Market',
      primaryVendorId: 'VND-002',
      primaryVendorName: 'Habimana Jean Paul',
      primaryVendorNid: '1197980028910412',
      primaryVendorPhone: '+250 788 530 118',
      operationalTenantId: 'VND-011',
      operationalTenantName: 'Tuyisenge Fabrice',
      operationalTenantNid: '1199680011294055',
      operationalTenantPhone: '+250 789 104 582',
      operationalTrade: 'Tailoring & Kitenge Alterations',
      governmentBaseRentRwf: 90000,
      subLeaseMonthlyChargeRwf: 99000, // +10% markup (Within 15% municipal cap)
      markupPercentage: 10.0,
      authorizationStatus: 'AUTHORIZED',
      startDate: '2026-06-01',
      endDate: '2026-12-31',
    },
    {
      id: 'SUB-2026-002',
      permitNumber: 'SL-GAS-2026-029',
      allocationId: 'ALC-2026-004',
      stallId: 'STL-KIM-C01',
      stallCode: 'KIM-C01',
      marketName: 'Kimironko Market',
      primaryVendorId: 'VND-004',
      primaryVendorName: 'Ndayisaba Eric',
      primaryVendorNid: '1198280091034517',
      primaryVendorPhone: '+250 788 619 820',
      operationalTenantId: 'VND-012',
      operationalTenantName: 'Nyirahabimana Claudine',
      operationalTenantNid: '1199570088341029',
      operationalTenantPhone: '+250 784 882 319',
      operationalTrade: 'Handwoven Baskets & Souvenirs',
      governmentBaseRentRwf: 70000,
      subLeaseMonthlyChargeRwf: 77000, // +10% markup (Authorized)
      markupPercentage: 10.0,
      authorizationStatus: 'AUTHORIZED',
      startDate: '2026-07-01',
      endDate: '2027-01-31',
    },
    {
      id: 'SUB-2026-003',
      permitNumber: 'SL-NYA-2026-041',
      allocationId: 'ALC-2026-008',
      stallId: 'STL-NYA-A01',
      stallCode: 'NYA-A01',
      marketName: 'Nyabugogo Market',
      primaryVendorId: 'VND-006',
      primaryVendorName: 'Mugisha Patrick',
      primaryVendorNid: '1198880077231094',
      primaryVendorPhone: '+250 788 309 551',
      operationalTenantId: 'VND-014',
      operationalTenantName: 'Uwase Sandrine',
      operationalTenantNid: '1199770029183746',
      operationalTenantPhone: '+250 783 512 890',
      operationalTrade: 'Wholesale Cereals & Sorghum',
      governmentBaseRentRwf: 120000,
      subLeaseMonthlyChargeRwf: 132000, // +10% markup (Authorized)
      markupPercentage: 10.0,
      authorizationStatus: 'AUTHORIZED',
      startDate: '2026-05-01',
      endDate: '2026-11-30',
    },
    {
      id: 'SUB-2026-004',
      permitNumber: 'SL-NYA-2026-058',
      allocationId: 'ALC-2026-012',
      stallId: 'STL-NYA-D01',
      stallCode: 'NYA-D01',
      marketName: 'Nyabugogo Market',
      primaryVendorId: 'VND-009',
      primaryVendorName: 'Bizimana Claude',
      primaryVendorNid: '1198180084102938',
      primaryVendorPhone: '+250 788 915 402',
      operationalTenantId: 'VND-013',
      operationalTenantName: 'Kamanzi Olivier',
      operationalTenantNid: '1199380061902384',
      operationalTenantPhone: '+250 787 409 221',
      operationalTrade: 'Mobile Accessories & Repairs',
      governmentBaseRentRwf: 95000,
      subLeaseMonthlyChargeRwf: 125000, // +31.6% markup -> Exceeds 15% municipal cap! Flagged as MARGIN_VIOLATION
      markupPercentage: 31.6,
      authorizationStatus: 'MARGIN_VIOLATION',
      startDate: '2026-08-01',
      endDate: '2027-02-28',
    },
  ];

  const overdueList = allocations.filter((a) => a.paymentStatus === 'OVERDUE_ARREARS');
  const totalPenalties = overdueList.reduce((acc, item) => acc + item.totalPenaltyRwf, 0);

  const penaltyLogs: PenaltyAuditLog[] = [
    {
      id: 'CRON-20261006-001',
      executedAt: '2026-10-06 00:01:00 CAT',
      simulatedAssessmentDate: '2026-10-06',
      dayOfMonthEvaluated: 6,
      pastFifthThreshold: true,
      accountsEvaluated: 12,
      overdueAccountsFlagged: 5,
      totalPenaltiesAssessedRwf: 27300,
      triggerType: 'CRON_SCHEDULED',
    },
    {
      id: 'CRON-20261008-002',
      executedAt: '2026-10-08 06:00:00 CAT',
      simulatedAssessmentDate: initialDate,
      dayOfMonthEvaluated: 8,
      pastFifthThreshold: true,
      accountsEvaluated: allocations.length,
      overdueAccountsFlagged: overdueList.length,
      totalPenaltiesAssessedRwf: totalPenalties,
      triggerType: 'CRON_SCHEDULED',
    },
  ];

  return {
    simulatedDate: initialDate,
    markets,
    vendors,
    stalls,
    allocations,
    subLeases,
    penaltyLogs,
  };
}
