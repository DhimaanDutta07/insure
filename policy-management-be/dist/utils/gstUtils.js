"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEffectiveGstStatus = getEffectiveGstStatus;
const GST_CUTOFF = new Date('2025-09-22');
function getEffectiveGstStatus(policy) {
    if (!policy || !policy.start_date)
        return policy?.gst_status === true;
    const startDate = new Date(policy.start_date);
    return startDate < GST_CUTOFF;
}
