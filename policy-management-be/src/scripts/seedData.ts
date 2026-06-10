import prisma, { prismaDirect } from '../utils/prismaClient';

async function seedRequiredData() {
  try {
    console.log('🌱 Seeding required data...');

    // Seed Policy Groups
    const policyGroups = [
      'HEALTH INSURANCE',
      'LIFE INSURANCE',
      'MOTOR INSURANCE',
      'TRAVEL INSURANCE',
      'HOME INSURANCE',
    ];

    console.log('📦 Seeding Policy Groups...');
    const existingGroups = await prismaDirect.policyGroup.findMany({
      where: { name: { in: policyGroups } },
      select: { name: true, id: true },
    });
    const existingGroupMap = new Map(existingGroups.map(g => [g.name, g.id]));
    const newGroups = policyGroups.filter(name => !existingGroupMap.has(name));

    if (newGroups.length > 0) {
      const createdGroups = await prismaDirect.policyGroup.createMany({
        data: newGroups.map(name => ({ name })),
        skipDuplicates: true,
      });
      console.log(`  ✅ Created ${createdGroups.count} new policy groups`);
    } else {
      console.log(`  ✅ All policy groups already exist`);
    }

    const allGroups = await prismaDirect.policyGroup.findMany({
      where: { name: { in: policyGroups } },
      select: { name: true, id: true },
    });
    const policyGroupMap: Record<string, string> = {};
    for (const group of allGroups) {
      if (group.name) {
        policyGroupMap[group.name] = group.id;
      }
    }

    // Seed Companies
    const companies = [
      'HDFC ERGO',
      'NIVA BUPA',
      'STAR HEALTH',
      'CARE HEALTH',
      'ICICI LOMBARD',
    ];

    console.log('📦 Seeding Companies...');
    const companyMap: Record<string, string> = {};
    for (const name of companies) {
      const company = await prismaDirect.company.upsert({
        where: { name },
        update: {},
        create: { name, category: 'HEALTH' },
      });
      companyMap[name] = company.id;
      console.log(`  ✅ ${name}`);
    }

    // Seed Policy Types
    const policyTypes = ['Individual', 'Family', 'Group'];

    console.log('📦 Seeding Policy Types...');
    const policyTypeMap: Record<string, string> = {};
    for (const name of policyTypes) {
      const type = await prismaDirect.policyType.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      policyTypeMap[name] = type.id;
      console.log(`  ✅ ${name}`);
    }

    // Seed Policy Names
    const policiesByCompany: Record<string, string[]> = {
      'HDFC ERGO': [
        'OPTIMA RESTORE',
        'OPTIMA SECURE',
        'OPTIMA SUPER SECURE',
        'ENERGY',
        'EASY HEALTH',
        'KOTI SURAKSHA',
        'IPA',
        'STU',
        'PA',
        'SME',
        'TRAVEL',
        'OTHERS',
      ],
      'NIVA BUPA': [
        'ASPIRE',
        'REASSURE',
        'REASSURE 2.0',
        'PERSONAL ACCIDENT',
        'HEALTH RECHARGE V2',
        'HEALTH COMPANION',
        'HEARTBEAT',
        'OTHERS',
      ],
      'STAR HEALTH': [
        'SUPER STAR',
        'HEALTH ASSURE',
        'STAR COMPREHENSIVE',
        'YOUNG STAR',
        'WOMEN CARE',
        'FAMILY HEALTH OPTIMA',
        'TRAVEL',
        'OTHERS',
      ],
      'CARE HEALTH': [
        'CARE SUPREME',
        'CARE ULTIMATE',
        'IPA',
        'TRAVEL',
        'CARE ADVANTAGE',
        'OTHERS',
      ],
      'ICICI LOMBARD': [
        'ELEVATE',
        'HEALTH ADVANTEDGE',
        'TRAVEL',
        'COMPLETE HEALTH INSURANCE (CHI)',
        'OTHERS',
      ],
    };

    console.log('📦 Seeding Policy Names...');
    const policyNameData: { name: string; policy_group_id: string; company_id: string }[] = [];
    for (const [company, policies] of Object.entries(policiesByCompany)) {
      for (const policyName of policies) {
        policyNameData.push({
          name: policyName,
          policy_group_id: policyGroupMap['HEALTH INSURANCE'],
          company_id: companyMap[company],
        });
      }
    }
    await prismaDirect.policyName.createMany({
      data: policyNameData,
      skipDuplicates: true,
    });
    console.log(`  ✅ Total policies seeded: ${policyNameData.length}`);

    console.log('🎉 Seeding completed successfully!');
    
    // Disconnect the direct connection after seeding
    await prismaDirect.$disconnect();
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    await prismaDirect.$disconnect();
    throw error;
  }
}

if (require.main === module) {
  seedRequiredData().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export default seedRequiredData;
