import { PrismaClient } from '@prisma/client';
import { prismaDirect } from './src/utils/prismaClient';

const prisma = prismaDirect;

async function checkProductCompany() {
  try {
    console.log('🔍 Checking product company...\n');

    const policyNameId = '72117ce2-e315-4ec0-9885-39ec143a22f4';
    const companyId = '424de7ec-1655-4d97-b068-086218b6fc18';

    const policyName = await prisma.policyName.findUnique({
      where: { id: policyNameId },
      include: { company: true },
    });

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    console.log('Policy Name:', policyName?.name);
    console.log('Policy Name Company:', policyName?.company?.name);
    console.log('Request Company ID:', companyId);
    console.log('Request Company:', company?.name);

    if (policyName?.company_id !== companyId) {
      console.log('\n❌ MISMATCH: Policy name belongs to different company than request!');
      console.log(`Policy company_id: ${policyName?.company_id}`);
      console.log(`Request company_id: ${companyId}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductCompany();
