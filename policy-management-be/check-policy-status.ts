import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPolicyStatus() {
  try {
    console.log('🔍 Checking policies with OPTIMA SECURE...\n');

    const policies = await prisma.policy.findMany({
      where: {
        policyName: {
          name: 'OPTIMA SECURE',
        },
      },
      select: {
        id: true,
        policy_number: true,
        policy_creation_status: true,
        sum_insured: true,
        premium_amount: true,
        calculated_commission_amount: true,
        commission_add_on_percentage: true,
      },
      take: 5,
    });

    console.log(`Found ${policies.length} policies:`);
    for (const policy of policies) {
      console.log(`\n📋 Policy: ${policy.policy_number}`);
      console.log(`   Status: ${policy.policy_creation_status}`);
      console.log(`   SI: ₹${policy.sum_insured?.toLocaleString()}`);
      console.log(`   Premium: ₹${policy.premium_amount?.toLocaleString()}`);
      console.log(`   Commission: ${policy.calculated_commission_amount} (${policy.commission_add_on_percentage}%)`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPolicyStatus();
