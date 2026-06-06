import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addRenewalSIRules() {
  try {
    console.log('🔧 Adding Renewal rules with SI conditions for OPTIMA SECURE and OTHERS...\n');

    const hdfcCompany = await prisma.company.findFirst({
      where: { name: 'HDFC ERGO' },
    });

    if (!hdfcCompany) {
      console.error('❌ HDFC ERGO company not found');
      return;
    }

    const optimaSecure = await prisma.policyName.findFirst({
      where: { name: 'OPTIMA SECURE', company_id: hdfcCompany.id },
    });

    const others = await prisma.policyName.findFirst({
      where: { name: 'OTHERS', company_id: hdfcCompany.id },
    });

    if (!optimaSecure || !others) {
      console.error('❌ Products not found');
      return;
    }

    // OPTIMA SECURE Renewal rules with SI
    console.log('📝 Adding OPTIMA SECURE Renewal rules...');
    await prisma.commissionRule.createMany({
      data: [
        {
          policy_name_id: optimaSecure.id,
          policyStatus: 'Renewal',
          deductibleType: 'ALL_SI',
          ageCondition: 'LESS_THAN_60',
          commissionPercent: 15.0,
          siCondition: 'LESS_THAN_10_LAKHS',
          is_active: true,
        },
        {
          policy_name_id: optimaSecure.id,
          policyStatus: 'Renewal',
          deductibleType: 'ALL_SI',
          ageCondition: 'LESS_THAN_60',
          commissionPercent: 15.0,
          siCondition: 'GREATER_EQUAL_10_LAKHS',
          is_active: true,
        },
      ],
      skipDuplicates: true,
    });

    // OTHERS Renewal rules with SI
    console.log('📝 Adding OTHERS Renewal rules...');
    await prisma.commissionRule.createMany({
      data: [
        {
          policy_name_id: others.id,
          policyStatus: 'Renewal',
          deductibleType: 'ALL_SI',
          ageCondition: 'LESS_THAN_60',
          commissionPercent: 15.0,
          siCondition: 'LESS_THAN_10_LAKHS',
          is_active: true,
        },
        {
          policy_name_id: others.id,
          policyStatus: 'Renewal',
          deductibleType: 'ALL_SI',
          ageCondition: 'LESS_THAN_60',
          commissionPercent: 15.0,
          siCondition: 'GREATER_EQUAL_10_LAKHS',
          is_active: true,
        },
      ],
      skipDuplicates: true,
    });

    console.log('✅ Renewal SI rules added successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addRenewalSIRules();
