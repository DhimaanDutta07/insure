-- Add missing index on policy_form_value.policy_id
CREATE INDEX IF NOT EXISTS "policy_form_value_policy_id_idx" ON "policy_form_value"("policy_id");

-- Add missing index on policy_receipts.policy_id
CREATE INDEX IF NOT EXISTS "policy_receipts_policy_id_idx" ON "policy_receipts"("policy_id");
