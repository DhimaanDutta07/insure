import { PrismaClient } from '@prisma/client';
import { prismaDirect } from './src/utils/prismaClient';

const prisma = prismaDirect;

async function deleteDuplicateProducts() {
  try {
    console.log('🔍 Deleting duplicate OTHERS and TRAVEL products...\n');

    // Keep only HDFC ERGO versions of OTHERS and TRAVEL
    const hdfcCompany = await prisma.company.findFirst({
      where: { name: 'HDFC ERGO' },
    });

    if (!hdfcCompany) {
      console.error('❌ HDFC ERGO company not found');
      return;
    }

    // Delete OTHERS from other companies
    const othersToDelete = await prisma.policyName.findMany({
      where: {
        name: 'OTHERS',
        company_id: { not: hdfcCompany.id },
      },
    });

    console.log(`Found ${othersToDelete.length} OTHERS products to delete from other companies:`);
    for (const product of othersToDelete) {
      const policyCount = await prisma.policy.count({
        where: { policy_name_id: product.id },
      });

      if (policyCount === 0) {
        console.log(`Deleting OTHERS from ${product.company_id}...`);
        await prisma.policyName.delete({
          where: { id: product.id },
        });
        console.log(`✅ Deleted`);
      } else {
        console.log(`⚠️ Skipping - has ${policyCount} policies`);
      }
    }

    // Delete TRAVEL from other companies
    const travelToDelete = await prisma.policyName.findMany({
      where: {
        name: 'TRAVEL',
        company_id: { not: hdfcCompany.id },
      },
    });

    console.log(`\nFound ${travelToDelete.length} TRAVEL products to delete from other companies:`);
    for (const product of travelToDelete) {
      const policyCount = await prisma.policy.count({
        where: { policy_name_id: product.id },
      });

      if (policyCount === 0) {
        console.log(`Deleting TRAVEL from ${product.company_id}...`);
        await prisma.policyName.delete({
          where: { id: product.id },
        });
        console.log(`✅ Deleted`);
      } else {
        console.log(`⚠️ Skipping - has ${policyCount} policies`);
      }
    }

    // Verify remaining products
    const remainingOthers = await prisma.policyName.findMany({
      where: { name: 'OTHERS' },
      include: { company: { select: { name: true } } },
    });

    const remainingTravel = await prisma.policyName.findMany({
      where: { name: 'TRAVEL' },
      include: { company: { select: { name: true } } },
    });

    console.log(`\n✅ Cleanup complete.`);
    console.log(`Remaining OTHERS: ${remainingOthers.length}`);
    for (const p of remainingOthers) {
      console.log(`  - ${p.company?.name || 'Unknown'}`);
    }
    console.log(`Remaining TRAVEL: ${remainingTravel.length}`);
    for (const p of remainingTravel) {
      console.log(`  - ${p.company?.name || 'Unknown'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteDuplicateProducts();
