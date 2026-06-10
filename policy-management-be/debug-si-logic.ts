import { PrismaClient } from '@prisma/client';
import { prismaDirect } from './src/utils/prismaClient';

const prisma = prismaDirect;

async function debugSILogic() {
  try {
    console.log('🔍 Debugging SI condition logic...\n');

    // Get a policy with OPTIMA SECURE and high SI
    const policies = await prisma.policy.findMany({
      where: {
        sum_insured: { gte: 1000000 },
      },
      include: {
        policyName: {
          select: { name: true, company: { select: { name: true } } },
        },
      },
      take: 5,
    });

    console.log('Policies with SI >= 10L:');
    for (const policy of policies) {
      if (policy.policyName) {
        console.log(`  - ${policy.policyName.company?.name || 'Unknown'} - ${policy.policyName.name}`);
        console.log(`    SI: ₹${policy.sum_insured?.toLocaleString()}`);
        console.log(`    Status: ${policy.policy_creation_status}`);
        console.log(`    Commission: ${policy.calculated_commission_amount}%`);
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSILogic();
