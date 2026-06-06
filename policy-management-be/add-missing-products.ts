import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMissingProducts() {
  try {
    console.log('🔧 Adding missing HDFC ERGO products...');

    const hdfcCompany = await prisma.company.findFirst({
      where: { name: 'HDFC ERGO' },
    });

    if (!hdfcCompany) {
      console.error('❌ HDFC ERGO company not found');
      return;
    }

    const healthGroup = await prisma.policyGroup.findFirst({
      where: { name: 'HEALTH INSURANCE' },
    });

    if (!healthGroup) {
      console.error('❌ HEALTH INSURANCE group not found');
      return;
    }

    const productsToAdd = ['STU', 'PA', 'SME'];

    for (const productName of productsToAdd) {
      const existing = await prisma.policyName.findFirst({
        where: {
          name: productName,
          company_id: hdfcCompany.id,
        },
      });

      if (!existing) {
        await prisma.policyName.create({
          data: {
            name: productName,
            company_id: hdfcCompany.id,
            policy_group_id: healthGroup.id,
          },
        });
        console.log(`✅ Added product: ${productName}`);
      } else {
        console.log(`ℹ️ Product already exists: ${productName}`);
      }
    }

    console.log('✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingProducts();
