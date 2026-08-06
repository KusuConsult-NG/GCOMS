import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

/**
 * Every seeded account previously shared the hardcoded password 'Password123!',
 * which the login page also offered as one-click buttons. If that seed ever ran
 * against a deployed environment, the whole system was open.
 *
 * Now: set SEED_PASSWORD to choose one (useful for demos), or leave it unset and
 * a random password is generated and printed once.
 */
function resolveSeedPassword(): { password: string; generated: boolean } {
  const fromEnv = process.env.SEED_PASSWORD?.trim();
  if (fromEnv) {
    if (fromEnv.length < 12) {
      throw new Error('SEED_PASSWORD must be at least 12 characters.');
    }
    return { password: fromEnv, generated: false };
  }
  return { password: `${randomBytes(12).toString('base64url')}Aa1!`, generated: true };
}

/**
 * The seed creates thirteen accounts that share one password, including
 * SYSTEM_ADMIN. That is fine for a laptop and catastrophic against a live
 * database, and the only thing standing between the two is which DATABASE_URL
 * happens to be in the environment.
 *
 * So it refuses to run in production. The override exists because a first
 * deployment sometimes does need a bootstrap, but it has to be a deliberate act
 * with the reason visible in the shell history — not something a deploy script
 * inherits by accident.
 */
function assertSafeToSeed(): void {
  if (process.env.NODE_ENV !== 'production') return;
  if (process.env.ALLOW_PRODUCTION_SEED === 'yes-i-mean-it') {
    console.warn(
      '\n⚠️  Seeding a production environment because ALLOW_PRODUCTION_SEED is set.\n' +
        '   Thirteen accounts are about to share one password. Change them.\n',
    );
    return;
  }
  throw new Error(
    'Refusing to seed: NODE_ENV=production. This creates thirteen accounts ' +
      'sharing one password, including SYSTEM_ADMIN. If you genuinely need to ' +
      'bootstrap a deployment, set ALLOW_PRODUCTION_SEED=yes-i-mean-it.',
  );
}

async function main() {
  assertSafeToSeed();
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    throw new Error(
      'Refusing to seed demo data with NODE_ENV=production. ' +
        'Set ALLOW_PRODUCTION_SEED=true only if you really mean it.',
    );
  }

  console.log('🌱 Seeding database with rich enterprise operational records...');

  const { password, generated } = resolveSeedPassword();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // 1. Create Users for all key roles
  const users = [
    { email: 'executive@gcoms.org', firstName: 'Retsum', lastName: 'Anzaku', role: 'EXECUTIVE' },
    { email: 'clinician@gcoms.org', firstName: 'Dr. Sarah', lastName: 'Okonkwo', role: 'CLINICIAN' },
    // DOCTOR and NURSE are distinct roles with different permissions, so the
    // seed covers both — the UI verification signs in as every role, and a
    // missing account there is a failure nobody would otherwise notice.
    { email: 'doctor@gcoms.org', firstName: 'Dr. Ibrahim', lastName: 'Musa', role: 'DOCTOR' },
    { email: 'nurse@gcoms.org', firstName: 'Ngozi', lastName: 'Eze', role: 'NURSE' },
    { email: 'volunteer@gcoms.org', firstName: 'Amina', lastName: 'Bello', role: 'VOLUNTEER' },
    { email: 'field@gcoms.org', firstName: 'John', lastName: 'Danladi', role: 'FIELD_OFFICER' },
    { email: 'finance@gcoms.org', firstName: 'Emmanuel', lastName: 'Gyang', role: 'FINANCE' },
    { email: 'hr@gcoms.org', firstName: 'Grace', lastName: 'Pam', role: 'HR' },
    { email: 'admin@gcoms.org', firstName: 'System', lastName: 'Admin', role: 'SYSTEM_ADMIN' },
    { email: 'procurement@gcoms.org', firstName: 'Patrick', lastName: 'K.', role: 'PROCUREMENT' },
    { email: 'grant_manager@gcoms.org', firstName: 'Dr. George', lastName: 'A.', role: 'GRANT_MANAGER' },
    { email: 'project_manager@gcoms.org', firstName: 'Prof. Maryam', lastName: 'B.', role: 'PROJECT_MANAGER' },
    { email: 'inventory_manager@gcoms.org', firstName: 'Samuel', lastName: 'D.', role: 'INVENTORY_MANAGER' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { password: passwordHash, role: u.role },
      create: {
        email: u.email,
        password: passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isActive: true,
      },
    });
  }

  const executive = await prisma.user.findUnique({ where: { email: 'executive@gcoms.org' } });
  const finance = await prisma.user.findUnique({ where: { email: 'finance@gcoms.org' } });
  const clinician = await prisma.user.findUnique({ where: { email: 'clinician@gcoms.org' } });
  const volunteer = await prisma.user.findUnique({ where: { email: 'volunteer@gcoms.org' } });

  // 2. Seed Finance Transactions (Journal Entries & Payment Vouchers)
  await prisma.financeTransaction.createMany({
    data: [
      { amount: 50000000, type: 'INCOME', category: '4001 - Grant Inflow Global Fund', description: 'Tranche 1 Disbursement for Rural VIA Screening Drive', status: 'APPROVED', requestedById: finance!.id },
      { amount: 15000000, type: 'INCOME', category: '4002 - WHO Health Assistance Grant', description: 'Community Worker Stipend Assistance Inflow', status: 'APPROVED', requestedById: finance!.id },
      { amount: 4500000, type: 'EXPENSE', category: '5001 - Outreach Field Logistics', description: 'Barkin Ladi Outreach Vehicle Fuel & Logistics Advance', status: 'APPROVED', requestedById: finance!.id },
      { amount: 18500000, type: 'EXPENSE', category: '5002 - Medical Consumables & Reagents', description: 'Payment Voucher PV-9821: Acetic Acid 5% & Speculums Batch', status: 'APPROVED', requestedById: finance!.id },
      { amount: 8500000, type: 'EXPENSE', category: '5003 - Staff Salaries & Stipends', description: 'Monthly Volunteer Stipend Disbursement - Plateau LGAs', status: 'APPROVED', requestedById: finance!.id },
      { amount: 12500000, type: 'EXPENSE', category: '6001 - Clinical Equipment Purchase', description: 'Portable CO2 Cryotherapy Unit & Ultrasound Probes', status: 'APPROVED', requestedById: finance!.id },
      { amount: 2200000, type: 'EXPENSE', category: '5004 - Administrative & Utility Services', description: 'Office IT Network Maintenance & Cloud Infrastructure', status: 'PENDING', requestedById: finance!.id },
    ],
  });

  // 3. Seed Procurement Orders & Requisitions
  await prisma.procurementOrder.createMany({
    data: [
      { itemName: 'Acetic Acid 5% VIA Screening Solution (Pack of 500)', quantity: 20, estimatedCost: 1850000, vendor: 'JUTH Reagent Supplier', status: 'APPROVED', requestedById: executive!.id },
      { itemName: 'Portable CO2 Cryotherapy Units with Gas Cylinders', quantity: 4, estimatedCost: 12500000, vendor: 'MedPharma West Africa', status: 'APPROVED', requestedById: executive!.id },
      { itemName: 'Sterile Disposable Vaginal Speculums (Box of 1,000)', quantity: 15, estimatedCost: 2400000, vendor: 'Plateau Medical Logistics', status: 'APPROVED', requestedById: executive!.id },
      { itemName: 'Ruggedized Mobile Field Screening Laptops', quantity: 6, estimatedCost: 4800000, vendor: 'Jos Tech Hardware Supplies', status: 'PENDING', requestedById: executive!.id },
    ],
  });

  // 3b. The procurement suite proper: vendors, RFQs, the annual plan, goods
  // received notes and contracts. These have tables of their own — the screens
  // used to fabricate them, or write them into the requisition table behind a
  // "[VENDOR_REG] " prefix, because nothing here filled them in.
  const year = new Date().getFullYear();

  const vendorSeeds = [
    { name: 'JUTH Reagent Supplier', category: 'Medical Reagents', taxId: 'TIN-2201884', rating: 4.6, status: 'VERIFIED', email: 'supply@juthreagents.ng', phone: '+234 803 200 1188' },
    { name: 'MedPharma West Africa', category: 'Clinical Equipment', taxId: 'TIN-4417290', rating: 4.2, status: 'VERIFIED', email: 'orders@medpharmawa.com', phone: '+234 802 774 9011' },
    { name: 'Plateau Medical Logistics', category: 'Consumables', taxId: 'TIN-3390117', rating: 3.9, status: 'VERIFIED', email: 'info@plateaumedlog.ng', phone: '+234 806 551 3320' },
    { name: 'Jos Tech Hardware Supplies', category: 'IT & Field Hardware', taxId: 'TIN-5528803', rating: 3.4, status: 'PENDING', email: 'sales@jostech.ng', phone: '+234 805 119 4477' },
  ];
  for (const vendor of vendorSeeds) {
    await prisma.vendor.upsert({
      where: { name: vendor.name },
      update: {},
      create: vendor,
    });
  }
  const vendorsByName = new Map(
    (await prisma.vendor.findMany()).map((v) => [v.name, v]),
  );

  // One RFQ already evaluated, one still open, so the comparison matrix has
  // something to compare and the award path is visible without clicking.
  const awardedRfq = await prisma.rfq.upsert({
    where: { reference: `RFQ-${year}-0001` },
    update: {},
    create: {
      reference: `RFQ-${year}-0001`,
      description: 'CO2 Cryotherapy Units — supply and commissioning',
      status: 'COMPLETE',
      closingDate: new Date(`${year}-03-14`),
    },
  });
  await prisma.rfq.upsert({
    where: { reference: `RFQ-${year}-0002` },
    update: {},
    create: {
      reference: `RFQ-${year}-0002`,
      description: 'VIA screening consumables — annual framework',
      status: 'OPEN',
      closingDate: new Date(`${year}-11-30`),
    },
  });

  const quoteSeeds = [
    { vendor: 'MedPharma West Africa', price: 3125000, warranty: '2 years', score: 98, status: 'RECOMMENDED' },
    { vendor: 'Plateau Medical Logistics', price: 3400000, warranty: '1 year', score: 85, status: 'SUBMITTED' },
  ];
  for (const quote of quoteSeeds) {
    const vendor = vendorsByName.get(quote.vendor);
    if (!vendor) continue;
    await prisma.rfqQuote.upsert({
      where: { rfqId_vendorId: { rfqId: awardedRfq.id, vendorId: vendor.id } },
      update: {},
      create: {
        rfqId: awardedRfq.id,
        vendorId: vendor.id,
        price: quote.price,
        warranty: quote.warranty,
        score: quote.score,
        status: quote.status,
      },
    });
  }

  // The annual procurement plan. No stored total: quantity x unitPrice is
  // computed on read, so the two can never disagree.
  if ((await prisma.procurementPlanItem.count()) === 0) {
    await prisma.procurementPlanItem.createMany({
      data: [
        { fiscalYear: year, category: 'Medical Consumables', description: 'Acetic acid 5% VIA solution — quarterly resupply', quantity: 80, unitPrice: 92500, quarter: 'Q1', priority: 'HIGH', status: 'APPROVED', createdById: executive!.id },
        { fiscalYear: year, category: 'Clinical Equipment', description: 'Portable CO2 cryotherapy units', quantity: 4, unitPrice: 3125000, quarter: 'Q2', priority: 'HIGH', status: 'PROCURED', createdById: executive!.id },
        { fiscalYear: year, category: 'Consumables', description: 'Sterile disposable speculums (box of 1,000)', quantity: 30, unitPrice: 160000, quarter: 'Q2', priority: 'MEDIUM', status: 'PLANNED', createdById: executive!.id },
        { fiscalYear: year, category: 'IT & Field Hardware', description: 'Ruggedized field screening laptops', quantity: 6, unitPrice: 800000, quarter: 'Q3', priority: 'MEDIUM', status: 'PLANNED', createdById: executive!.id },
        { fiscalYear: year, category: 'Logistics', description: 'Mobile outreach van servicing and fuel', quantity: 12, unitPrice: 145000, quarter: 'Q4', priority: 'LOW', status: 'PLANNED', createdById: executive!.id },
      ],
    });
  }

  // Goods received notes, against real purchase orders rather than a free-text
  // reference that matched nothing.
  const orders = await prisma.procurementOrder.findMany({
    where: { status: 'APPROVED' },
    orderBy: { createdAt: 'asc' },
  });
  if ((await prisma.goodsReceivedNote.count()) === 0 && orders.length >= 2) {
    await prisma.goodsReceivedNote.createMany({
      data: [
        { reference: `GRN-${year}-0001`, procurementOrderId: orders[0].id, deliveryNote: 'DN-JUTH-4471', itemsReceived: 'Acetic Acid 5% VIA Screening Solution — 20 packs', quantity: 20, condition: 'GOOD', inspectionDate: new Date(`${year}-04-08`), officer: 'Retsum Anzaku', remarks: 'Seals intact, batch numbers logged.', receivedById: executive!.id },
        { reference: `GRN-${year}-0002`, procurementOrderId: orders[1].id, deliveryNote: 'DN-MPWA-1902', itemsReceived: 'CO2 Cryotherapy Units with gas cylinders — 3 of 4', quantity: 3, condition: 'PARTIAL', inspectionDate: new Date(`${year}-05-21`), officer: 'Retsum Anzaku', remarks: 'One unit backordered; supplier notified.', receivedById: executive!.id },
      ],
    });
  }

  // Contracts, tied to a vendor by relation rather than by a copied-in name.
  if ((await prisma.contract.count()) === 0) {
    const medpharma = vendorsByName.get('MedPharma West Africa');
    const juth = vendorsByName.get('JUTH Reagent Supplier');
    const contracts = [
      medpharma && { reference: `CTR-${year}-0001`, vendorId: medpharma.id, title: 'Cryotherapy equipment supply and 24-month servicing', value: 12500000, startDate: new Date(`${year}-05-01`), endDate: new Date(`${year + 2}-04-30`), deliverables: '4 units delivered, commissioned, with quarterly preventive servicing and operator training.', status: 'ACTIVE', createdById: executive!.id },
      juth && { reference: `CTR-${year}-0002`, vendorId: juth.id, title: 'VIA reagent annual supply framework', value: 7400000, startDate: new Date(`${year}-01-15`), endDate: new Date(`${year}-12-31`), deliverables: 'Quarterly resupply of acetic acid 5% solution with cold-chain certification.', status: 'ACTIVE', createdById: executive!.id },
    ].filter((c): c is NonNullable<typeof c> => Boolean(c));
    if (contracts.length) {
      await prisma.contract.createMany({ data: contracts });
    }
  }

  // 4. Seed Inventory Stock Items & Barcode Assets
  await prisma.inventoryItem.createMany({
    data: [
      { itemName: 'VIA Acetic Acid 5% Solution', category: 'MEDICATION', quantity: 45, unit: 'bottles', location: 'JUTH Base Warehouse', status: 'IN_STOCK', managedById: executive!.id },
      { itemName: 'Disposable Vaginal Speculums (Medium)', category: 'CONSUMABLE', quantity: 18, unit: 'boxes', location: 'Barkin Ladi Field Kit', status: 'LOW_STOCK', managedById: executive!.id },
      { itemName: 'CO2 Cryotherapy Gun (Tag #GC-EQUIP-001)', category: 'EQUIPMENT', quantity: 4, unit: 'units', location: 'Jos Central Clinic', status: 'IN_STOCK', managedById: executive!.id },
      { itemName: 'Diagnostic Mobile Ultrasound Probe (Tag #GC-EQUIP-002)', category: 'EQUIPMENT', quantity: 2, unit: 'units', location: 'Plateau Mobile Van', status: 'IN_STOCK', managedById: executive!.id },
    ],
  });

  // 5. Seed Grants & Milestones
  const grant1 = await prisma.grant.create({
    data: {
      donorName: 'Global Fund for Health',
      grantName: 'Plateau State Rural Cervical Cancer Elimination Project',
      amount: 150000000,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'ACTIVE',
      managedById: executive!.id,
    },
  });

  await prisma.grantMilestone.createMany({
    data: [
      { grantId: grant1.id, title: 'Milestone 1: 2,500 VIA Screenings Completed in Barkin Ladi', dueDate: new Date('2025-06-30'), status: 'COMPLETED', metric: '2,500 women screened', progress: 100 },
      { grantId: grant1.id, title: 'Milestone 2: Train 100 Community Health Workers in Mangu LGA', dueDate: new Date('2025-12-31'), status: 'COMPLETED', metric: '100 CHWs certified', progress: 100 },
      { grantId: grant1.id, title: 'Milestone 3: Establish Tertiary Referral Pipeline at JUTH', dueDate: new Date('2026-06-30'), status: 'IN_PROGRESS', metric: 'Referral MOU signed', progress: 40 },
    ],
  });

  // 6. Seed Projects & Tasks
  const project1 = await prisma.project.create({
    data: {
      projectName: 'LGA Community Health Worker Capacity Building Drive',
      description: 'Training 120 field volunteers across 17 LGAs in early cancer screening protocols',
      startDate: new Date('2025-03-01'),
      endDate: new Date('2026-09-30'),
      status: 'ACTIVE',
      budget: 25000000,
      managedById: executive!.id,
    },
  });

  await prisma.projectTask.createMany({
    data: [
      { projectId: project1.id, title: 'Draft Training Curriculum & Manuals', status: 'COMPLETED' },
      { projectId: project1.id, title: 'Procure Demonstration Models & Reagents', status: 'IN_PROGRESS' },
      { projectId: project1.id, title: 'Conduct Barkin Ladi CHW Workshop', status: 'PENDING' },
    ],
  });

  // 7. Seed Governance Meetings
  await prisma.governanceMeeting.createMany({
    data: [
      { title: 'Q3 Board of Directors & Audit Review Convening', meetingDate: new Date('2025-09-15'), status: 'COMPLETED', minutesUrl: 'https://gcoms.org/docs/q3-minutes.pdf', organizedById: executive!.id },
      { title: 'Clinical Governance & Oncology Standards Review', meetingDate: new Date('2025-11-20'), status: 'SCHEDULED', minutesUrl: 'https://gcoms.org/docs/agenda-clinical.pdf', organizedById: executive!.id },
    ],
  });

  console.log('✅ Database successfully seeded with full enterprise operational records!');

  if (generated) {
    console.log(
      `\n🔑 Seeded accounts share this generated password — it is shown once:\n\n    ${password}\n\n` +
        '   Set SEED_PASSWORD to choose your own instead.\n',
    );
  } else {
    console.log('\n🔑 Seeded accounts use the password from SEED_PASSWORD.\n');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
