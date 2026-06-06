import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDocuments() {
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

  const missingData = docs.filter(doc => !doc.file_data);

  console.log(`Total documents: ${docs.length}`);
  console.log(`Documents without file_data: ${missingData.length}`);
  console.log('\nDocuments that need re-uploading:');
  console.log('='.repeat(80));

  missingData.forEach(doc => {
    console.log(`ID: ${doc.id}`);
    console.log(`File: ${doc.original_name || doc.file_name}`);
    console.log(`Category: ${doc.category}`);
    console.log(`Policy ID: ${doc.policy_id}`);
    console.log(`Relative Path: ${doc.relative_path}`);
    console.log('-'.repeat(40));
  });

  await prisma.$disconnect();
}

checkDocuments().catch(console.error);
