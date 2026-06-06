import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProducts() {
  try {
    const hdfcCompany = await prisma.company.findFirst({
      where: { name: 'HDFC ERGO' },
    });

    if (!hdfcCompany) {
      console.log('HDFC ERGO company not found');
      return;
    }

    const products = await prisma.policyName.findMany({
      where: { company_id: hdfcCompany.id },
      select: { id: true, name: true },
    });

    console.log('HDFC ERGO products:');
    products.forEach(p => console.log(`  - ${p.name} (ID: ${p.id})`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();
