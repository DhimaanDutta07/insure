import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProductNames() {
  try {
    console.log('🔍 Checking HDFC ERGO product names...\n');

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

    console.log('Products in database:');
    for (const product of products) {
      console.log(`  - "${product.name}" (uppercase: "${(product.name || '').toUpperCase().trim()}")`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductNames();
