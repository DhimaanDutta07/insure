# TODO

## Step 1: CommissionRule UI (scroll + delete for all filters)
- [x] Update `policy-management-fe/src/components/CommissionRule/CommissionRule.tsx`

- [x] Fix expanded filters container so rows remain reachable even when there are >4 filters (robust scrolling).
- [ ] Add/delete option (trash) for every visible filter row type (standard SI/status rows + custom SI/custom threshold rows + deductible-on rows + non-classified products).

## Step 2: Commission percent fetch on Policy Create/Edit
- [ ] Update `policy-management-fe/src/components/policy/PolicyForm.tsx`

  - [ ] Remove/stop the simplified commissionPercent fetch from `GET /api/v1/commission-rules/policy-name/:id`.
  - [ ] Use backend commission calculation result so displayed percent matches deductible/SI/custom-threshold logic.
  - [ ] Ensure recalculation triggers on policy status, product, sum insured, deductible status.

## Step 3: Backend commission mapping correctness
- [ ] Update/verify `policy-management-be/src/services/policy.service.ts`
  - [ ] Centralize mapping of frontend policy_creation_status values to `commissionRule.policyStatus` enum strings.
  - [ ] Ensure Internal Portability => Migration and Renewal => Renwal (or correct DB value after verification).
  - [ ] Ensure Portablity typo handled consistently.

## Step 4: Validate deductible-ON ignores SI + thresholds
- [ ] Verify in `policy.service.ts` deductible_amount_status=true returns only deductibleStatus:true rule with siCondition=null.

## Step 5: Test/QA
- [ ] Manual QA CommissionRule page with >4 filters per product; confirm scrolling.
- [ ] Delete works for every row.
- [ ] Policy Create: deductible ON ignores SI/custom-threshold and uses correct rule.
- [ ] Policy Create: SI threshold selection works for Fresh/Portability/Internal Portability/Renewal.

