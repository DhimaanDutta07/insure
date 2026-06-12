const GST_CUTOFF = new Date('2025-09-22');

export function getEffectiveGstStatus(policy: any): boolean {
  if (!policy || !policy.start_date) return policy?.gst_status === true;
  const startDate = new Date(policy.start_date);
  return startDate < GST_CUTOFF;
}

export function enforceGstByDate(policyData: any): void {
  if (!policyData || !policyData.start_date) {
    console.log('[GST] enforceGstByDate skipped — no start_date');
    return;
  }
  const startDate = new Date(policyData.start_date);
  const before = policyData.gst_status;
  if (startDate < GST_CUTOFF) {
    policyData.gst_status = true;
  } else {
    policyData.gst_status = false;
  }
  console.log(`[GST] enforceGstByDate: start_date=${startDate.toISOString()}, was=${before}, now=${policyData.gst_status}`);
}
