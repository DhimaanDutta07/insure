import { PrismaClient } from '@prisma/client';
import { prismaDirect } from './src/utils/prismaClient';

const prisma = prismaDirect;

async function checkHDFCOthers() {
  try {
    console.log('🔍 Checking HDFC ERGO OTHERS product...\n');

    const hdfcCompany = await prisma.company.findFirst({
      where: { name: 'HDFC ERGO' },
    });

    if (!hdfcCompany) {
      console.error('❌ HDFC ERGO company not found');
      return;
    }

    const othersProduct = await prisma.policyName.findFirst({
      where: { company_id: hdfcCompany.id, name: 'OTHERS' },
    });

    console.log('HDFC ERGO OTHERS ID:', othersProduct?.id);
    console.log('HDFC ERGO Company ID:', hdfcCompany.id);

    // Also check ICICI LOMBARD OTHERS
    const iciciCompany = await prisma.company.findFirst({
      where: { name: 'ICICI LOMBARD' },
    });

    if (iciciCompany) {
      const iciciOthers = await prisma.policyName.findFirst({
        where: { company_id: iciciCompany.id, name: 'OTHERS' },
      });
      console.log('ICICI LOMBARD OTHERS ID:', iciciOthers?.id);
      console.log('ICICI LOMBARD Company ID:', iciciCompany.id);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkHDFCOthers();
