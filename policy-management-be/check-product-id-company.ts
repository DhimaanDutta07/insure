import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProductIdCompany() {
  try {
    console.log('🔍 Checking product ID and company...\n');

    const policyNameId1 = '72117ce2-e315-4ec0-9885-39ec143a22f4';
    const policyNameId2 = '6bf8b02b-ab82-4071-8d6f-7bb297e03d06';
    const companyId = '424de7ec-1655-4d97-b068-086218b6fc18';

    const policyName1 = await prisma.policyName.findUnique({
      where: { id: policyNameId1 },
      include: { company: true },
    });

    const policyName2 = await prisma.policyName.findUnique({
      where: { id: policyNameId2 },
      include: { company: true },
    });

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    console.log('Request Company:', company?.name, `(ID: ${companyId})`);
    console.log('\nProduct 1 (OTHERS):');
    console.log('  Name:', policyName1?.name);
    console.log('  Company:', policyName1?.company?.name);
    console.log('  Company ID:', policyName1?.company_id);
    console.log('  Match?', policyName1?.company_id === companyId);

    console.log('\nProduct 2 (TRAVEL):');
    console.log('  Name:', policyName2?.name);
    console.log('  Company:', policyName2?.company?.name);
    console.log('  Company ID:', policyName2?.company_id);
    console.log('  Match?', policyName2?.company_id === companyId);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductIdCompany();
