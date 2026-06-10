import { PrismaClient } from '@prisma/client';
import { prismaDirect } from './src/utils/prismaClient';

const prisma = prismaDirect;

async function listAllDocs() {
  const docs = await prisma.uploadedDocument.findMany({
    select: {
      id: true,
      file_name: true,
      original_name: true,
      relative_path: true,
      file_data: true,
      policy_id: true,
      category: true,
    },
  });

  console.log(`Total documents in database: ${docs.length}`);
  console.log('\nAll documents:');
  console.log('='.repeat(80));

  docs.forEach(doc => {
    console.log(`ID: ${doc.id}`);
    console.log(`File name: ${doc.file_name}`);
    console.log(`Original name: ${doc.original_name}`);
    console.log(`Relative path: ${doc.relative_path}`);
    console.log(`Has file_data: ${!!doc.file_data}`);
    console.log(`Policy ID: ${doc.policy_id}`);
    console.log(`Category: ${doc.category}`);
    console.log('-'.repeat(40));
  });

  await prisma.$disconnect();
}

listAllDocs().catch(console.error);
