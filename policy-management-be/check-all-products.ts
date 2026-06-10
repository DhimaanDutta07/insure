import { PrismaClient } from '@prisma/client';
import { prismaDirect } from './src/utils/prismaClient';

const prisma = prismaDirect;

async function checkAllProducts() {
  try {
    console.log('🔍 Checking all products in database...\n');

    const products = await prisma.policyName.findMany({
      include: {
        company: {
          select: { name: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Group by name to find duplicates
    const productMap = new Map<string, any[]>();
    for (const product of products) {
      const name = product.name || 'Unknown';
      if (!productMap.has(name)) {
        productMap.set(name, []);
      }
      productMap.get(name)!.push(product);
    }

    console.log(`Total products: ${products.length}\n`);
    console.log('Products with duplicates:\n');

    for (const [name, items] of productMap) {
      if (items.length > 1) {
        console.log(`${name} (${items.length} times):`);
        for (const item of items) {
          console.log(`  - ${item.company?.name || 'Unknown'} (ID: ${item.id})`);
        }
      }
    }

    // Check specifically for OTHERS and TRAVEL
    console.log('\n--- OTHERS products ---');
    const others = products.filter(p => p.name === 'OTHERS');
    for (const product of others) {
      console.log(`- ${product.company?.name || 'Unknown'} (ID: ${product.id})`);
    }

    console.log('\n--- TRAVEL products ---');
    const travels = products.filter(p => p.name === 'TRAVEL');
    for (const product of travels) {
      console.log(`- ${product.company?.name || 'Unknown'} (ID: ${product.id})`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllProducts();
