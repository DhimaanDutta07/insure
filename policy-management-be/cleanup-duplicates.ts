import { PrismaClient } from '@prisma/client';
import { prismaDirect } from './src/utils/prismaClient';

const prisma = prismaDirect;

async function cleanupDuplicates() {
  try {
    console.log('🧹 Cleaning up duplicate (HDFC) products...');

    // Find and delete products with (HDFC) suffix
    const hdfcProducts = await prisma.policyName.findMany({
      where: {
        name: {
          contains: '(HDFC)',
        },
      },
    });

    console.log(`Found ${hdfcProducts.length} products with (HDFC) suffix:`);
    hdfcProducts.forEach(p => console.log(`  - ${p.name} (ID: ${p.id})`));

    if (hdfcProducts.length > 0) {
      await prisma.policyName.deleteMany({
        where: {
          name: {
            contains: '(HDFC)',
          },
        },
      });
      console.log(`✅ Deleted ${hdfcProducts.length} duplicate products`);
    } else {
      console.log('ℹ️ No duplicate (HDFC) products found');
    }

    // List remaining HDFC ERGO products
    const remainingHdfc = await prisma.policyName.findMany({
      where: {
        company: {
          name: 'HDFC ERGO',
        },
      },
      include: {
        company: true,
      },
    });

    console.log('\n📋 Remaining HDFC ERGO products:');
    remainingHdfc.forEach(p => console.log(`  - ${p.name}`));

  } catch (error) {
    console.error('❌ Error cleaning up duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicates();
