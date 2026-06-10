import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPortabilityTypo() {
  try {
    console.log('Updating policies with Portablity to Portability...');
    
    const result = await prisma.policy.updateMany({
      where: {
        policy_creation_status: 'Portablity'
      },
      data: {
        policy_creation_status: 'Portability'
      }
    });
    
    console.log(`Updated ${result.count} policies`);
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPortabilityTypo();
