import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRenewalRules() {
  try {
    console.log('🔍 Checking Renewal rules for HDFC ERGO...\n');

    const hdfcCompany = await prisma.company.findFirst({
      where: { name: 'HDFC ERGO' },
    });

    if (!hdfcCompany) {
      console.error('❌ HDFC ERGO company not found');
      return;
    }

    const hdfcProducts = await prisma.policyName.findMany({
      where: { company_id: hdfcCompany.id },
    });

    for (const product of hdfcProducts) {
      const renewalRules = await prisma.commissionRule.findMany({
        where: {
          policy_name_id: product.id,
          policyStatus: 'Renewal',
          is_active: true,
        },
      });

      if (renewalRules.length > 0) {
        console.log(`📦 ${product.name}:`);
        for (const rule of renewalRules) {
          console.log(`   - Commission: ${rule.commissionPercent}%`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRenewalRules();
