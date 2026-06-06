import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPortabilityPolicies() {
  try {
    console.log('🔍 Checking policies with Portability status...\n');

    const policies = await prisma.policy.findMany({
      where: {
        policy_creation_status: 'Portablity',
      },
      select: {
        id: true,
        policy_number: true,
        policyName: {
          select: { name: true, company: { select: { name: true } } },
        },
        policy_creation_status: true,
        sum_insured: true,
        premium_amount: true,
        calculated_commission_amount: true,
        commission_add_on_percentage: true,
      },
      take: 10,
    });

    console.log(`Found ${policies.length} policies with Portability status:`);
    for (const policy of policies) {
      if (policy.policyName) {
        console.log(`\n📋 Policy: ${policy.policy_number}`);
        console.log(`   Product: ${policy.policyName.company?.name || 'Unknown'} - ${policy.policyName.name}`);
        console.log(`   Status: ${policy.policy_creation_status}`);
        console.log(`   SI: ₹${policy.sum_insured?.toLocaleString()}`);
        console.log(`   Premium: ₹${policy.premium_amount?.toLocaleString()}`);
        console.log(`   Commission: ${policy.calculated_commission_amount} (${policy.commission_add_on_percentage}%)`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPortabilityPolicies();
