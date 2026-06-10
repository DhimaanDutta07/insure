import { PrismaClient } from '@prisma/client';
import { prismaDirect } from './src/utils/prismaClient';

const prisma = prismaDirect;

async function checkFreshCommission() {
  try {
    console.log('🔍 Checking Fresh commission rules...\n');

    const hdfcCompany = await prisma.company.findFirst({
      where: { name: 'HDFC ERGO' },
    });

    if (!hdfcCompany) {
      console.error('❌ HDFC ERGO company not found');
      return;
    }

    const products = await prisma.policyName.findMany({
      where: { company_id: hdfcCompany.id },
    });

    for (const product of products) {
      console.log(`\n--- ${product.name} ---`);
      
      const freshRules = await prisma.commissionRule.findMany({
        where: {
          policy_name_id: product.id,
          policyStatus: 'Fresh',
          is_active: true,
        },
      });

      const renewalRules = await prisma.commissionRule.findMany({
        where: {
          policy_name_id: product.id,
          policyStatus: 'Renewal',
          is_active: true,
        },
      });

      console.log(`Fresh rules: ${freshRules.length}`);
      for (const rule of freshRules) {
        console.log(`  - ${rule.commissionPercent}% (SI: ${(rule as any).siCondition || 'N/A'})`);
      }

      console.log(`Renewal rules: ${renewalRules.length}`);
      for (const rule of renewalRules) {
        console.log(`  - ${rule.commissionPercent}% (SI: ${(rule as any).siCondition || 'N/A'})`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFreshCommission();
