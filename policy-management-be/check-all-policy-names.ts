import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllPolicyNames() {
  try {
    console.log('🔍 Checking all policy names...\n');

    const hdfcCompany = await prisma.company.findFirst({
      where: { name: 'HDFC ERGO' },
    });

    const iciciCompany = await prisma.company.findFirst({
      where: { name: 'ICICI LOMBARD' },
    });

    if (hdfcCompany) {
      const hdfcProducts = await prisma.policyName.findMany({
        where: { company_id: hdfcCompany.id },
      });
      console.log('HDFC ERGO Products:');
      for (const p of hdfcProducts) {
        console.log(`  - ${p.name} (ID: ${p.id}, company_id: ${p.company_id})`);
      }
    }

    if (iciciCompany) {
      const iciciProducts = await prisma.policyName.findMany({
        where: { company_id: iciciCompany.id },
      });
      console.log('\nICICI LOMBARD Products:');
      for (const p of iciciProducts) {
        console.log(`  - ${p.name} (ID: ${p.id}, company_id: ${p.company_id})`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllPolicyNames();
