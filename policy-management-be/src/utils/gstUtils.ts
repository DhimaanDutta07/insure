const GST_CUTOFF = new Date('2025-09-22');

export function getEffectiveGstStatus(policy: any): boolean {
  if (!policy || !policy.start_date) return policy?.gst_status === true;
  const startDate = new Date(policy.start_date);
  return startDate < GST_CUTOFF;
}
