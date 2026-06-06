import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validatePDF() {
  const doc = await prisma.uploadedDocument.findFirst({
    where: { file_name: '623662b9-e27e-4ae9-b689-f038b7323dc1.pdf' },
    select: {
      id: true,
      file_name: true,
      original_name: true,
      file_data: true,
    },
  });

  if (doc && doc.file_data) {
    console.log('Document found');
    console.log('File data length:', doc.file_data.length);

    const buffer = Buffer.from(doc.file_data);
    const header = buffer.subarray(0, 4).toString('ascii');
    console.log('File header:', header);
    console.log('Is valid PDF header:', header === '%PDF');

    if (header === '%PDF') {
      console.log('✅ PDF header is valid');
    } else {
      console.log('❌ Invalid PDF header');
      console.log('First 20 bytes:', buffer.subarray(0, 20));
    }
  } else {
    console.log('Document not found or no file data');
  }

  await prisma.$disconnect();
}

validatePDF().catch(console.error);
