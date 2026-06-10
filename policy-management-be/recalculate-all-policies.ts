import { PrismaClient } from '@prisma/client';
import { calculateAndSetCommission } from './src/services/policy.service';
import { prismaDirect } from './src/utils/prismaClient';

const prisma = prismaDirect;

async function recalculateAllPolicies() {
  try {
    console.log('🔄 Recalculating commissions for all policies...\n');

    const policies = await prisma.policy.findMany({
      where: {
        policy_name_id: { not: null },
        premium_amount: { not: null },
      },
      select: {
        id: true,
        policy_name_id: true,
        policy_creation_status: true,
        sum_insured: true,
        premium_amount: true,
        gst_status: true,
      },
    });

    console.log(`Found ${policies.length} policies to recalculate\n`);

    let updated = 0;
    for (const policy of policies) {
      try {
        const policyInput: any = {
          policy_name_id: policy.policy_name_id,
          policy_creation_status: policy.policy_creation_status || 'Fresh',
          sum_insured: policy.sum_insured || 0,
          premium_amount: policy.premium_amount || 0,
          gst_status: policy.gst_status || false,
        };

        await calculateAndSetCommission(policyInput);

        // Update the policy with new commission
        await prisma.policy.update({
          where: { id: policy.id },
          data: {
            calculated_commission_amount: policyInput.calculated_commission_amount,
            commission_add_on_percentage: policyInput._commissionPercent,
          },
        });

        updated++;
        if (updated % 10 === 0) {
          console.log(`Updated ${updated}/${policies.length} policies...`);
        }
      } catch (error) {
        console.error(`Error updating policy ${policy.id}:`, error);
      }
    }

    console.log(`\n✅ Successfully updated ${updated} policies`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recalculateAllPolicies();
