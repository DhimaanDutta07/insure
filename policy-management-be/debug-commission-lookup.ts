import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugCommissionLookup() {
  try {
    console.log('🔍 Debugging commission lookup...\n');

    const hdfcCompany = await prisma.company.findFirst({
      where: { name: 'HDFC ERGO' },
    });

    if (!hdfcCompany) {
      console.error('❌ HDFC ERGO company not found');
      return;
    }

    const travelProduct = await prisma.policyName.findFirst({
      where: { company_id: hdfcCompany.id, name: 'TRAVEL' },
    });

    const othersProduct = await prisma.policyName.findFirst({
      where: { company_id: hdfcCompany.id, name: 'OTHERS' },
    });

    if (travelProduct) {
      console.log('--- TRAVEL ---');
      const travelRules = await prisma.commissionRule.findMany({
        where: { policy_name_id: travelProduct.id, is_active: true },
      });
      console.log(`Total rules: ${travelRules.length}`);
      for (const rule of travelRules) {
        console.log(`  - Status: ${rule.policyStatus}, Percent: ${rule.commissionPercent}%, SI: ${(rule as any).siCondition}`);
      }

      // Test lookup for Fresh status
      const freshRule = await prisma.commissionRule.findFirst({
        where: {
          policy_name_id: travelProduct.id,
          is_active: true,
          policyStatus: 'Fresh',
        },
      });
      console.log(`Fresh rule found: ${freshRule ? 'YES' : 'NO'}`);

      // Test lookup for Renewal status
      const renewalRule = await prisma.commissionRule.findFirst({
        where: {
          policy_name_id: travelProduct.id,
          is_active: true,
          policyStatus: 'Renewal',
        },
      });
      console.log(`Renewal rule found: ${renewalRule ? 'YES' : 'NO'}`);
    }

    if (othersProduct) {
      console.log('\n--- OTHERS ---');
      const othersRules = await prisma.commissionRule.findMany({
        where: { policy_name_id: othersProduct.id, is_active: true },
      });
      console.log(`Total rules: ${othersRules.length}`);
      for (const rule of othersRules) {
        console.log(`  - Status: ${rule.policyStatus}, Percent: ${rule.commissionPercent}%, SI: ${(rule as any).siCondition}`);
      }

      // Test lookup for Fresh status with SI
      const freshRuleLT = await prisma.commissionRule.findFirst({
        where: {
          policy_name_id: othersProduct.id,
          is_active: true,
          policyStatus: 'Fresh',
          siCondition: 'LESS_THAN_10_LAKHS',
        } as any,
      });
      console.log(`Fresh rule (<10L) found: ${freshRuleLT ? 'YES' : 'NO'}`);

      const freshRuleGE = await prisma.commissionRule.findFirst({
        where: {
          policy_name_id: othersProduct.id,
          is_active: true,
          policyStatus: 'Fresh',
          siCondition: 'GREATER_EQUAL_10_LAKHS',
        } as any,
      });
      console.log(`Fresh rule (>=10L) found: ${freshRuleGE ? 'YES' : 'NO'}`);

      // Test lookup for Fresh status without SI
      const freshRuleNoSI = await prisma.commissionRule.findFirst({
        where: {
          policy_name_id: othersProduct.id,
          is_active: true,
          policyStatus: 'Fresh',
          siCondition: null,
        } as any,
      });
      console.log(`Fresh rule (no SI) found: ${freshRuleNoSI ? 'YES' : 'NO'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCommissionLookup();
