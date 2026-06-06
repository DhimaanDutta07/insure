import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSTUTravelRenewalRules() {
  try {
    console.log('🔧 Adding Renewal rules for STU and TRAVEL...\n');

    const hdfcCompany = await prisma.company.findFirst({
      where: { name: 'HDFC ERGO' },
    });

    if (!hdfcCompany) {
      console.error('❌ HDFC ERGO company not found');
      return;
    }

    const stuProduct = await prisma.policyName.findFirst({
      where: { name: 'STU', company_id: hdfcCompany.id },
    });

    const travelProduct = await prisma.policyName.findFirst({
      where: { name: 'TRAVEL', company_id: hdfcCompany.id },
    });

    if (!stuProduct || !travelProduct) {
      console.error('❌ Products not found');
      return;
    }

    // STU Renewal rule
    console.log('📝 Adding STU Renewal rule...');
    await prisma.commissionRule.create({
      data: {
        policy_name_id: stuProduct.id,
        policyStatus: 'Renewal',
        deductibleType: 'ALL_SI',
        ageCondition: 'LESS_THAN_60',
        commissionPercent: 15.0,
        is_active: true,
      },
    }).catch(() => console.log('STU Renewal rule already exists'));

    // TRAVEL Renewal rule
    console.log('📝 Adding TRAVEL Renewal rule...');
    await prisma.commissionRule.create({
      data: {
        policy_name_id: travelProduct.id,
        policyStatus: 'Renewal',
        deductibleType: 'ALL_SI',
        ageCondition: 'LESS_THAN_60',
        commissionPercent: 15.0,
        is_active: true,
      },
    }).catch(() => console.log('TRAVEL Renewal rule already exists'));

    console.log('✅ Renewal rules added successfully!');
    console.log('\n📊 Summary:');
    console.log('  STU: Fresh 20%, Portability 20%, Renewal 15%');
    console.log('  TRAVEL: Fresh 15%, Renewal 15%');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSTUTravelRenewalRules();
