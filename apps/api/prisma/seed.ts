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

async function main() {
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
