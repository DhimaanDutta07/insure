import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCommissionRules() {
  try {
    console.log('🔍 Checking commission rules in database...\n');

    const rules = await prisma.commissionRule.findMany({
      where: { is_active: true },
      include: {
        policyName: {
          select: { name: true, company: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Found ${rules.length} active commission rules:\n`);

    // Group by product
    const grouped = rules.reduce((acc, rule) => {
      const key = `${rule.policyName.company?.name || 'Unknown'} - ${rule.policyName.name}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(rule);
      return acc;
    }, {} as Record<string, any[]>);

    for (const [product, productRules] of Object.entries(grouped)) {
      console.log(`📦 ${product}:`);
      for (const rule of productRules) {
        console.log(`   - Status: ${rule.policyStatus || 'Any'}, SI: ${rule.siCondition || 'Any'}, Commission: ${rule.commissionPercent}%`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCommissionRules();
