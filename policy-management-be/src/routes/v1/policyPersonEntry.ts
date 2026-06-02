import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import prisma from '../../utils/prismaClient'; // corrected import path

const router = Router();
const upload = multer({ dest: 'uploads/' });

// POST /admin/policy-person – create single proposer record
router.post('/', async (req, res) => {
  try {
    const { full_name, mobile, email, address } = req.body;
    const proposer = await prisma.proposer.create({
      data: { full_name, mobile, email, address },
    });
    res.status(201).json(proposer);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: (e as Error).message });
  }
});

// POST /admin/policy-person/upload – bulk upload via Excel (first row = headers)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const created: any[] = [];
    const errors: any[] = [];
    for (const row of rows) {
      try {
        // expect columns: full_name, mobile, email, address (case‑insensitive)
        const proposer = await prisma.proposer.create({
          data: {
            full_name: row.full_name || row.FullName || '',
            mobile: row.mobile || row.Mobile || '',
            email: row.email || row.Email || '',
            address: row.address || row.Address || '',
          },
        });
        created.push(proposer);
      } catch (e) {
        errors.push({ row, error: (e as Error).message });
      }
    }
    res.json({ inserted: created.length, errors });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
