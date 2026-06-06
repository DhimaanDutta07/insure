import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setCommissionRules() {
  try {
    console.log('🔧 Setting commission rules for HDFC ERGO products...');

    // Get HDFC ERGO company
    const hdfcCompany = await prisma.company.findFirst({
      where: { name: 'HDFC ERGO' },
    });

    if (!hdfcCompany) {
      console.error('❌ HDFC ERGO company not found');
      return;
    }

    // Get product IDs
    const stuProduct = await prisma.policyName.findFirst({
      where: { name: 'STU', company_id: hdfcCompany.id },
    });

    const paProduct = await prisma.policyName.findFirst({
      where: { name: 'PA', company_id: hdfcCompany.id },
    });

    const smeProduct = await prisma.policyName.findFirst({
      where: { name: 'SME', company_id: hdfcCompany.id },
    });

    if (!stuProduct || !paProduct || !smeProduct) {
      console.error('❌ One or more products not found');
      return;
    }

    console.log('✅ Found products:', {
      STU: stuProduct.id,
      PA: paProduct.id,
      SME: smeProduct.id,
    });

    // STU: Fresh 20%, Portability 20%
    console.log('📝 Setting STU commissions...');
    await prisma.commissionRule.deleteMany({
      where: { policy_name_id: stuProduct.id },
    });
    await prisma.commissionRule.createMany({
      data: [
        {
          policy_name_id: stuProduct.id,
          policyStatus: 'Fresh',
          deductibleType: 'ALL_SI',
          ageCondition: 'LESS_THAN_60',
          commissionPercent: 20.0,
          productType: null,
          siCondition: null,
          is_active: true,
        },
        {
          policy_name_id: stuProduct.id,
          policyStatus: 'Portablity',
          deductibleType: 'ALL_SI',
          ageCondition: 'LESS_THAN_60',
          commissionPercent: 20.0,
          productType: null,
          siCondition: null,
          is_active: true,
        },
      ],
    });

    // PA: Fresh 2%, Renewal 15.5%
    console.log('📝 Setting PA commissions...');
    await prisma.commissionRule.deleteMany({
      where: { policy_name_id: paProduct.id },
    });
    await prisma.commissionRule.createMany({
      data: [
        {
          policy_name_id: paProduct.id,
          policyStatus: 'Fresh',
          deductibleType: 'ALL_SI',
          ageCondition: 'LESS_THAN_60',
          commissionPercent: 2.0,
          productType: null,
          siCondition: null,
          is_active: true,
        },
        {
          policy_name_id: paProduct.id,
          policyStatus: 'Renewal',
          deductibleType: 'ALL_SI',
          ageCondition: 'LESS_THAN_60',
          commissionPercent: 15.5,
          productType: null,
          siCondition: null,
          is_active: true,
        },
      ],
    });

    // SME: Fresh 18%, Renewal 7.5%
    console.log('📝 Setting SME commissions...');
    await prisma.commissionRule.deleteMany({
      where: { policy_name_id: smeProduct.id },
    });
    await prisma.commissionRule.createMany({
      data: [
        {
          policy_name_id: smeProduct.id,
          policyStatus: 'Fresh',
          deductibleType: 'ALL_SI',
          ageCondition: 'LESS_THAN_60',
          commissionPercent: 18.0,
          productType: null,
          siCondition: null,
          is_active: true,
        },
        {
          policy_name_id: smeProduct.id,
          policyStatus: 'Renewal',
          deductibleType: 'ALL_SI',
          ageCondition: 'LESS_THAN_60',
          commissionPercent: 7.5,
          productType: null,
          siCondition: null,
          is_active: true,
        },
      ],
    });

    console.log('✅ Commission rules set successfully!');
    console.log('\n📊 Summary:');
    console.log('  STU: Fresh 20%, Portability 20%');
    console.log('  PA: Fresh 2%, Renewal 15.5%');
    console.log('  SME: Fresh 18%, Renewal 7.5%');
    console.log('  Renewal default: 15% (when no rule exists)');

  } catch (error) {
    console.error('❌ Error setting commission rules:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setCommissionRules();
