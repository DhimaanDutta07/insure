import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOptimaPortability() {
  try {
    console.log('🔍 Checking OPTIMA SECURE Portability rules...\n');

    const hdfcCompany = await prisma.company.findFirst({
      where: { name: 'HDFC ERGO' },
    });

    if (!hdfcCompany) {
      console.error('❌ HDFC ERGO company not found');
      return;
    }

    const optimaSecure = await prisma.policyName.findFirst({
      where: { name: 'OPTIMA SECURE', company_id: hdfcCompany.id },
    });

    if (!optimaSecure) {
      console.error('❌ OPTIMA SECURE not found');
      return;
    }

    const portabilityRules = await prisma.commissionRule.findMany({
      where: {
        policy_name_id: optimaSecure.id,
        policyStatus: 'Portablity',
        is_active: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Found ${portabilityRules.length} Portability rules for OPTIMA SECURE:`);
    for (const rule of portabilityRules) {
      console.log(`   - SI: ${rule.siCondition || 'ALL_SI'}, Commission: ${rule.commissionPercent}%`);
    }

    // Also check Fresh rules for comparison
    const freshRules = await prisma.commissionRule.findMany({
      where: {
        policy_name_id: optimaSecure.id,
        policyStatus: 'Fresh',
        is_active: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`\nFound ${freshRules.length} Fresh rules for OPTIMA SECURE:`);
    for (const rule of freshRules) {
      console.log(`   - SI: ${rule.siCondition || 'ALL_SI'}, Commission: ${rule.commissionPercent}%`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOptimaPortability();
