import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateHDFCCommissionRules() {
  try {
    console.log('🔍 Updating HDFC ERGO commission rules...\n');

    const hdfcCompany = await prisma.company.findFirst({
      where: { name: 'HDFC ERGO' },
    });

    if (!hdfcCompany) {
      console.error('❌ HDFC ERGO company not found');
      return;
    }

    const products = await prisma.policyName.findMany({
      where: { company_id: hdfcCompany.id },
    });

    // Delete all existing commission rules for HDFC ERGO
    console.log('Deleting existing commission rules...');
    await prisma.commissionRule.deleteMany({
      where: {
        policy_name_id: {
          in: products.map(p => p.id),
        },
      },
    });
    console.log('✅ Deleted existing rules\n');

    // Create new commission rules based on specifications
    const rulesToCreate: any[] = [];

    for (const product of products) {
      const productName = product.name;

      switch (productName) {
        case 'OPTIMA RESTORE':
          // 12% for all
          rulesToCreate.push({
            policy_name_id: product.id,
            policyStatus: 'Fresh',
            deductibleType: 'ALL_SI',
            ageCondition: 'LESS_THAN_60',
            commissionPercent: 12,
            siCondition: null,
            is_active: true,
          });
          rulesToCreate.push({
            policy_name_id: product.id,
            policyStatus: 'Renewal',
            deductibleType: 'ALL_SI',
            ageCondition: 'LESS_THAN_60',
            commissionPercent: 12,
            siCondition: null,
            is_active: true,
          });
          break;

        case 'OPTIMA SECURE':
          // Fresh, Portablity + SI
          rulesToCreate.push({
            policy_name_id: product.id,
            policyStatus: 'Fresh',
            deductibleType: 'ALL_SI',
            ageCondition: 'LESS_THAN_60',
            commissionPercent: 19,
            siCondition: 'LESS_THAN_10_LAKHS',
            is_active: true,
          });
          rulesToCreate.push({
            policy_name_id: product.id,
            policyStatus: 'Fresh',
            deductibleType: 'ALL_SI',
            ageCondition: 'LESS_THAN_60',
            commissionPercent: 20,
            siCondition: 'GREATER_EQUAL_10_LAKHS',
            is_active: true,
          });
          rulesToCreate.push({
            policy_name_id: product.id,
            policyStatus: 'Portablity',
            deductibleType: 'ALL_SI',
            ageCondition: 'LESS_THAN_60',
            commissionPercent: 19,
            siCondition: 'LESS_THAN_10_LAKHS',
            is_active: true,
          });
          rulesToCreate.push({
            policy_name_id: product.id,
            policyStatus: 'Portablity',
            deductibleType: 'ALL_SI',
            ageCondition: 'LESS_THAN_60',
            commissionPercent: 20,
            siCondition: 'GREATER_EQUAL_10_LAKHS',
            is_active: true,
          });
          break;

        case 'OPTIMA SUPER SECURE':
          // 12% for all
          rulesToCreate.push({
            policy_name_id: product.id,
            policyStatus: 'Fresh',
            deductibleType: 'ALL_SI',
            ageCondition: 'LESS_THAN_60',
            commissionPercent: 12,
            siCondition: null,
            is_active: true,
          });
          rulesToCreate.push({
            policy_name_id: product.id,
            policyStatus: 'Renewal',
            deductibleType: 'ALL_SI',
            ageCondition: 'LESS_THAN_60',
            commissionPercent: 12,
            siCondition: null,
            is_active: true,
          });
          break;

        case 'ENERGY':
        case 'EASY HEALTH':
        case 'KOTI SURAKSHA':
        case 'IPA':
          // 12% for all
          rulesToCreate.push({
            policy_name_id: product.id,
            policyStatus: 'Fresh',
            deductibleType: 'ALL_SI',
            ageCondition: 'LESS_THAN_60',
            commissionPercent: 12,
            siCondition: null,
            is_active: true,
          });
          rulesToCreate.push({
            policy_name_id: product.id,
            policyStatus: 'Renewal',
            deductibleType: 'ALL_SI',
            ageCondition: 'LESS_THAN_60',
            commissionPercent: 12,
            siCondition: null,
            is_active: true,
          });
          break;

        case 'TRAVEL':
          // Fresh and Renewal
          rulesToCreate.push({
            policy_name_id: product.id,
            policyStatus: 'Fresh',
            deductibleType: 'ALL_SI',
            ageCondition: 'LESS_THAN_60',
            commissionPercent: 12,
            siCondition: null,
            is_active: true,
          });
          rulesToCreate.push({
            policy_name_id: product.id,
            policyStatus: 'Renewal',
            deductibleType: 'ALL_SI',
            ageCondition: 'LESS_THAN_60',
            commissionPercent: 12,
            siCondition: null,
            is_active: true,
          });
          break;

        case 'OTHERS':
          // Fresh, Portablity + SI
          rulesToCreate.push({
            policy_name_id: product.id,
            policyStatus: 'Fresh',
            deductibleType: 'ALL_SI',
            ageCondition: 'LESS_THAN_60',
            commissionPercent: 16,
            siCondition: 'LESS_THAN_10_LAKHS',
            is_active: true,
          });
          rulesToCreate.push({
            policy_name_id: product.id,
            policyStatus: 'Fresh',
            deductibleType: 'ALL_SI',
            ageCondition: 'LESS_THAN_60',
            commissionPercent: 17,
            siCondition: 'GREATER_EQUAL_10_LAKHS',
            is_active: true,
          });
          rulesToCreate.push({
            policy_name_id: product.id,
            policyStatus: 'Portablity',
            deductibleType: 'ALL_SI',
            ageCondition: 'LESS_THAN_60',
            commissionPercent: 16,
            siCondition: 'LESS_THAN_10_LAKHS',
            is_active: true,
          });
          rulesToCreate.push({
            policy_name_id: product.id,
            policyStatus: 'Portablity',
            deductibleType: 'ALL_SI',
            ageCondition: 'LESS_THAN_60',
            commissionPercent: 17,
            siCondition: 'GREATER_EQUAL_10_LAKHS',
            is_active: true,
          });
          break;

        case 'STU':
          // Fresh, Portablity
          rulesToCreate.push({
            policy_name_id: product.id,
            policyStatus: 'Fresh',
            deductibleType: 'ALL_SI',
            ageCondition: 'LESS_THAN_60',
            commissionPercent: 20,
            siCondition: null,
            is_active: true,
          });
          rulesToCreate.push({
            policy_name_id: product.id,
            policyStatus: 'Portablity',
            deductibleType: 'ALL_SI',
            ageCondition: 'LESS_THAN_60',
            commissionPercent: 20,
            siCondition: null,
            is_active: true,
          });
          break;

        case 'PA':
          // Fresh, Renewal
          rulesToCreate.push({
            policy_name_id: product.id,
            policyStatus: 'Fresh',
            deductibleType: 'ALL_SI',
            ageCondition: 'LESS_THAN_60',
            commissionPercent: 2,
            siCondition: null,
            is_active: true,
          });
          rulesToCreate.push({
            policy_name_id: product.id,
            policyStatus: 'Renewal',
            deductibleType: 'ALL_SI',
            ageCondition: 'LESS_THAN_60',
            commissionPercent: 15,
            siCondition: null,
            is_active: true,
          });
          break;

        case 'SME':
          // Fresh, Renewal
          rulesToCreate.push({
            policy_name_id: product.id,
            policyStatus: 'Fresh',
            deductibleType: 'ALL_SI',
            ageCondition: 'LESS_THAN_60',
            commissionPercent: 18,
            siCondition: null,
            is_active: true,
          });
          rulesToCreate.push({
            policy_name_id: product.id,
            policyStatus: 'Renewal',
            deductibleType: 'ALL_SI',
            ageCondition: 'LESS_THAN_60',
            commissionPercent: 15,
            siCondition: null,
            is_active: true,
          });
          break;
      }
    }

    // Create all new rules
    console.log(`Creating ${rulesToCreate.length} new commission rules...`);
    await prisma.commissionRule.createMany({
      data: rulesToCreate,
    });
    console.log('✅ Created new rules\n');

    // Verify
    console.log('Verification:');
    for (const product of products) {
      const rules = await prisma.commissionRule.findMany({
        where: { policy_name_id: product.id, is_active: true },
      });
      console.log(`${product.name}: ${rules.length} rules`);
      for (const rule of rules) {
        console.log(`  - ${rule.policyStatus}: ${rule.commissionPercent}% (SI: ${(rule as any).siCondition || 'N/A'})`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateHDFCCommissionRules();
