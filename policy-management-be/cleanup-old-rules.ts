import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupOldRules() {
  try {
    console.log('🧹 Cleaning up old ALL_SI rules for products with SI classifications...\n');

    // Get HDFC ERGO company
    const hdfcCompany = await prisma.company.findFirst({
      where: { name: 'HDFC ERGO' },
    });

    if (!hdfcCompany) {
      console.error('❌ HDFC ERGO company not found');
      return;
    }

    // Get products with SI classifications
    const optimaSecure = await prisma.policyName.findFirst({
      where: { name: 'OPTIMA SECURE', company_id: hdfcCompany.id },
    });

    const others = await prisma.policyName.findFirst({
      where: { name: 'OTHERS', company_id: hdfcCompany.id },
    });

    if (!optimaSecure || !others) {
      console.error('❌ Products not found');
      return;
    }

    // Delete ALL_SI rules for these products (they now have specific SI rules)
    const deletedOptima = await prisma.commissionRule.deleteMany({
      where: {
        policy_name_id: optimaSecure.id,
        siCondition: 'ALL_SI',
      },
    });

    const deletedOthers = await prisma.commissionRule.deleteMany({
      where: {
        policy_name_id: others.id,
        siCondition: 'ALL_SI',
      },
    });

    console.log(`✅ Deleted ${deletedOptima.count} old rules for OPTIMA SECURE`);
    console.log(`✅ Deleted ${deletedOthers.count} old rules for OTHERS`);
    console.log('\n✅ Cleanup complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOldRules();
