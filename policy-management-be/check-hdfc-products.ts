import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkHDFCProducts() {
  try {
    console.log('🔍 Checking all HDFC ERGO products...\n');

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

    console.log(`Found ${products.length} products:\n`);
    for (const product of products) {
      console.log(`- ${product.name} (ID: ${product.id})`);
    }

    // Check for duplicates
    const productNames = products.map(p => p.name);
    const duplicates = productNames.filter((name, index) => productNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      console.log(`\n⚠️ Duplicate products found:`, [...new Set(duplicates)]);
    } else {
      console.log('\n✅ No duplicates found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkHDFCProducts();
