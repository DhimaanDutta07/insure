import { PrismaClient } from '@prisma/client';
import { prismaDirect } from './src/utils/prismaClient';

const prisma = prismaDirect;

async function checkFileData() {
  const doc = await prisma.uploadedDocument.findFirst({
    where: {
      relative_path: {
        contains: '67779635-ca6d-4f2e-b0c2-0e092937b68b.pdf'
      }
    },
    select: {
      id: true,
      file_name: true,
      original_name: true,
      relative_path: true,
      file_data: true,
    },
  });

  if (doc) {
    console.log('Document found:');
    console.log('ID:', doc.id);
    console.log('File name:', doc.file_name);
    console.log('Original name:', doc.original_name);
    console.log('Relative path:', doc.relative_path);
    console.log('File data exists:', !!doc.file_data);
    console.log('File data type:', typeof doc.file_data);
    console.log('File data length:', doc.file_data?.length || 0);

    if (doc.file_data) {
      // Check if it's a valid PDF by looking at the header
      const buffer = Buffer.from(doc.file_data);
      const header = buffer.subarray(0, 4).toString('ascii');
      console.log('File header:', header);
      console.log('Is valid PDF header:', header === '%PDF');
      console.log('First 20 bytes:', buffer.subarray(0, 20));
    } else {
      console.log('No file_data - this is a legacy document that needs re-uploading');
    }
  } else {
    console.log('Document not found');
  }

  await prisma.$disconnect();
}

checkFileData().catch(console.error);
