import prisma from './prismaClient';
import { referenceCache } from './lruCache';

const HDFC_PRODUCTS = [
  'OPTIMA RESTORE', 'OPTIMA SECURE', 'OPTIMA SUPER SECURE',
  'ENERGY', 'EASY HEALTH', 'KOTI SURAKSHA', 'IPA',
  'TRAVEL', 'OTHERS', 'STU', 'PA', 'SME',
];

export async function resolveEffectivePolicyNameId(policyNameId: string): Promise<{
  effectiveId: string;
  productName: string;
  companyName: string;
}> {
  const pnCacheKey = `pn:${policyNameId}`;
  let productName: string;
  let companyName: string;
  const cached = referenceCache.get(pnCacheKey) as { productName: string; companyName: string } | undefined;
  if (cached) {
    productName = cached.productName;
    companyName = cached.companyName;
  } else {
    const policyName = await prisma.policyName.findUnique({
      where: { id: policyNameId },
      select: { name: true, company: { select: { name: true } } },
    });
    productName = policyName?.name?.toUpperCase().trim() || '';
    companyName = policyName?.company?.name?.trim() || '';
    referenceCache.set(pnCacheKey, { productName, companyName }, 300_000);
  }

  let effectiveId = policyNameId;
  if (HDFC_PRODUCTS.includes(productName)) {
    let hdfcCompanyId = referenceCache.get('hdfc:companyId') as string | undefined;
    if (!hdfcCompanyId) {
      const hdfcCompany = await prisma.company.findFirst({ where: { name: 'HDFC ERGO' } });
      hdfcCompanyId = hdfcCompany?.id || '';
      if (hdfcCompanyId) referenceCache.set('hdfc:companyId', hdfcCompanyId, 300_000);
    }
    if (hdfcCompanyId) {
      const hdfcKey = `hdfc:pn:${policyNameId}`;
      let hdfcPid = referenceCache.get(hdfcKey) as string | undefined;
      if (!hdfcPid) {
        const hdfcProduct = await prisma.policyName.findFirst({
          where: { company_id: hdfcCompanyId, name: productName },
        });
        hdfcPid = hdfcProduct?.id || '';
        if (hdfcPid) referenceCache.set(hdfcKey, hdfcPid, 300_000);
      }
      if (hdfcPid) effectiveId = hdfcPid;
    }
  }

  return { effectiveId, productName, companyName };
}
