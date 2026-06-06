import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProductPolicies() {
  try {
    console.log('🔍 Checking policies for HDFC ERGO products...\n');

    const hdfcCompany = await prisma.company.findFirst({
      where: { name: 'HDFC ERGO' },
    });

    if (!hdfcCompany) {
      console.error('❌ HDFC ERGO company not found');
      return;
    }

    const products = await prisma.policyName.findMany({
      where: { company_id: hdfcCompany.id },
      orderBy: { name: 'asc' },
    });

    for (const product of products) {
      const policyCount = await prisma.policy.count({
        where: { policy_name_id: product.id },
      });

      console.log(`${product.name}: ${policyCount} policies`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductPolicies();
