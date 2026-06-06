import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupHDFCProducts() {
  try {
    console.log('🔍 Cleaning up unwanted HDFC ERGO products...\n');

    const hdfcCompany = await prisma.company.findFirst({
      where: { name: 'HDFC ERGO' },
    });

    if (!hdfcCompany) {
      console.error('❌ HDFC ERGO company not found');
      return;
    }

    // Products to keep (these have commission rules or policies)
    const productsToKeep = [
      'OPTIMA SECURE',
      'OPTIMA SUPER SECURE', // Has 3 policies
      'OTHERS',
      'STU',
      'PA',
      'SME',
      'TRAVEL',
    ];

    // Products to delete (no policies and not in commission rules)
    const productsToDelete = [
      'EASY HEALTH',
      'ENERGY',
      'IPA',
      'KOTI SURAKSHA',
      'OPTIMA RESTORE',
    ];

    for (const productName of productsToDelete) {
      const product = await prisma.policyName.findFirst({
        where: {
          name: productName,
          company_id: hdfcCompany.id,
        },
      });

      if (product) {
        // Check if it has any policies
        const policyCount = await prisma.policy.count({
          where: { policy_name_id: product.id },
        });

        if (policyCount === 0) {
          console.log(`Deleting ${productName}...`);
          await prisma.policyName.delete({
            where: { id: product.id },
          });
          console.log(`✅ Deleted ${productName}`);
        } else {
          console.log(`⚠️ Skipping ${productName} - has ${policyCount} policies`);
        }
      } else {
        console.log(`⚠️ ${productName} not found`);
      }
    }

    // Verify remaining products
    const remainingProducts = await prisma.policyName.findMany({
      where: { company_id: hdfcCompany.id },
      orderBy: { name: 'asc' },
    });

    console.log(`\n✅ Cleanup complete. Remaining products (${remainingProducts.length}):`);
    for (const product of remainingProducts) {
      console.log(`- ${product.name}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupHDFCProducts();
