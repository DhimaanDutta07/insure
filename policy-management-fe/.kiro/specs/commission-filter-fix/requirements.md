# Requirements Document

## Introduction

This document covers a set of targeted fixes to the commission rule management UI (`CommissionRule.tsx`) and the commission calculation logic (`policy.service.ts` / `commissionCalculation.service.ts`) in the insurance policy management system.

The changes address six distinct issues: a scroll container that traps filter rows off-screen, missing delete buttons on non-classified product rows, a hidden "Add New Filter" button for products without existing classified rules, hardcoded `policyStatus` in the add-filter modal, a wrong enum value (`'Portability'` vs `'Portablity'`) in the `hasStatusClassification` calculation path, and the need to verify that deductible-status priority and SI-threshold comparisons work end-to-end.

---

## Glossary

- **CommissionRule_UI**: The `CommissionRulePage` React component in `CommissionRule.tsx` responsible for displaying and editing commission rules.
- **Commission_Service**: The `calculateAndSetCommission` function in `policy.service.ts` that resolves the active commission rule for a given policy input.
- **PolicyCreationStatus**: The Prisma enum `Fresh | Renewal | Migration | Portablity` used as the canonical status stored in the database.
- **hasClassification**: A boolean derived in `CommissionRule_UI` — `true` when a product's existing rules include at least one `policyStatus` or a non-`ALL_SI` `siCondition`.
- **hasStatusClassification**: A boolean in `Commission_Service` — `true` for products in the set `{Optima Secure, Others (HDFC), STU, PA, SME, Travel}`.
- **hasSIClassification**: A boolean in `Commission_Service` — `true` for `{Optima Secure, Others (HDFC)}`.
- **statusForLookup**: The mapped string passed to Prisma when querying commission rules by policy status.
- **deductibleStatus**: A nullable boolean field on `CommissionRule`. `true` means the rule applies only when the policy's `deductible_amount_status` flag is `true`.
- **siCondition**: Enum field on `CommissionRule`: `ALL_SI | LESS_THAN_10_LAKHS | GREATER_EQUAL_10_LAKHS | null`.
- **customSIThreshold / customSIOperator**: Numeric threshold and `LESS_THAN | GREATER_THAN` operator for products that use non-standard SI breakpoints.
- **Add Filter modal**: The `Dialog` inside `CommissionRule_UI` used to create a new commission rule for a product.
- **Non-classified product**: A product whose `hasClassification` value is `false` — it has no status or SI rules and is rendered in the `!hasClassification` branch.

---

## Requirements

### Requirement 1: Filter Row Scroll

**User Story:** As a commission administrator, I want to scroll through all filter rows for a product, so that I can view and edit rules that would otherwise be hidden below the visible area.

#### Acceptance Criteria

1. WHEN a product's expanded filter list contains more than four rows, THE CommissionRule_UI SHALL make all rows reachable via vertical scrolling within the expanded panel.
2. WHILE a user is scrolling inside the filter list, THE CommissionRule_UI SHALL keep the "Add New Filter" button and the product header fixed outside the scroll area so they remain visible.
3. THE CommissionRule_UI SHALL constrain the scrollable filter list to a maximum height of 70 vh so that it does not overflow the viewport.

---

### Requirement 2: Delete Button on Non-Classified Product Rows

**User Story:** As a commission administrator, I want to delete any commission rule, so that I can remove outdated or incorrect flat-rate rules for non-classified products.

#### Acceptance Criteria

1. WHEN a non-classified product has a matching commission rule, THE CommissionRule_UI SHALL render a delete button (Trash2 icon) on that product's row.
2. WHEN a user clicks the delete button on a non-classified product row, THE CommissionRule_UI SHALL call `deleteCommissionRule` with that rule's `id` and refresh the rule list on success.
3. IF `deleteCommissionRule` returns an error, THEN THE CommissionRule_UI SHALL display an error toast and leave the rule list unchanged.
4. WHILE a delete operation is in progress, THE CommissionRule_UI SHALL disable the delete button and display a loading spinner in its place.

---

### Requirement 3: Add Filter Button Visible for All Products

**User Story:** As a commission administrator, I want to add commission filters to any product, so that I can set up status- or SI-based rules for products that have none yet.

#### Acceptance Criteria

1. THE CommissionRule_UI SHALL display an "Add New Filter" button for every product, regardless of whether that product's `hasClassification` value is `true` or `false`.
2. WHEN the "Add New Filter" button is clicked for a classified product, THE CommissionRule_UI SHALL open the Add Filter modal with that product pre-selected.
3. WHEN the "Add New Filter" button is clicked for a non-classified product, THE CommissionRule_UI SHALL open the Add Filter modal with that product pre-selected.
4. WHEN the Add Filter modal is submitted successfully for a product that previously had no classified rules, THE CommissionRule_UI SHALL refresh the rule list and reflect the new rule in the product's display.

---

### Requirement 4: Status Selection in Add Filter Modal

**User Story:** As a commission administrator, I want to select any valid policy status when adding a filter, so that commission rules are stored with the correct status and matched accurately during calculation.

#### Acceptance Criteria

1. THE CommissionRule_UI SHALL present all four policy status options in the Add Filter modal: `Fresh`, `Portablity` (displayed as "Portability"), `Migration` (displayed as "Internal Portability"), and `Renewal`.
2. WHEN a user selects a status in the Add Filter modal and saves the rule, THE CommissionRule_UI SHALL send the selected `policyStatus` value to `createCommissionRule` — never a hardcoded value.
3. WHEN the Add Filter modal is opened, THE CommissionRule_UI SHALL default the `policyStatus` field to `Fresh`.
4. IF `createCommissionRule` returns a validation error for `policyStatus`, THEN THE CommissionRule_UI SHALL display the error message from the API response in a toast.

---

### Requirement 5: Status Mapping Bug Fix in Commission Calculation

**User Story:** As a policy creator, I want `Migration`-status policies to match the correct commission rule, so that the calculated commission is accurate for internally portable policies.

#### Acceptance Criteria

1. WHEN `Commission_Service` evaluates a policy with `policy_creation_status = 'Migration'` on the `hasStatusClassification` path, THE Commission_Service SHALL use `statusForLookup = 'Migration'` when querying the database.
2. WHEN `Commission_Service` evaluates a policy with `policy_creation_status = 'Portablity'` on the `hasStatusClassification` path, THE Commission_Service SHALL use `statusForLookup = 'Portablity'` when querying the database.
3. WHEN `Commission_Service` evaluates a policy with `policy_creation_status = 'Migration'` on the `else` (non-classified) path, THE Commission_Service SHALL use `statusForLookup = 'Migration'` when querying the database.
4. THE Commission_Service SHALL use `statusForLookup = policyStatus` for `Fresh` and `Renewal` on all calculation paths (no mapping applied).
5. WHEN `Commission_Service` uses a `statusForLookup` value that does not match any active commission rule, THE Commission_Service SHALL proceed to the final fallback and ultimately set `calculated_commission_amount = 0` rather than throwing an error.

---

### Requirement 6: Deductible Status Priority in Commission Calculation

**User Story:** As a policy creator, I want policies with deductible enabled to use the deductible-specific commission rule, so that the correct commission percentage is applied when a deductible is selected.

#### Acceptance Criteria

1. WHEN `Commission_Service` receives a policy with `deductible_amount_status = true`, THE Commission_Service SHALL first search for a commission rule where `deductibleStatus = true` for the matching `policy_name_id` and resolved `statusForLookup`.
2. WHEN a deductible-specific rule is found, THE Commission_Service SHALL use that rule's `commissionPercent` and SHALL NOT evaluate SI conditions for that policy.
3. WHEN no deductible-specific rule is found and `deductible_amount_status = true`, THE Commission_Service SHALL proceed to the standard SI-based lookup.
4. WHEN `Commission_Service` receives a policy with `deductible_amount_status = false`, THE Commission_Service SHALL include rules where `deductibleStatus = false` OR `deductibleStatus = null` in the SI-based lookup.
5. WHEN the commission calculation completes, THE CommissionRule_UI in the policy creation form SHALL display the resolved commission percentage to the user.

---

### Requirement 7: SI Threshold Comparison in Commission Calculation

**User Story:** As a policy creator, I want the system to apply the correct commission rate based on the policy's sum insured value, so that the commission matches the configured SI breakpoints.

#### Acceptance Criteria

1. WHEN `Commission_Service` evaluates a product with `hasSIClassification = true` and `sum_insured < 1,000,000`, THE Commission_Service SHALL use `siCondition = 'LESS_THAN_10_LAKHS'` in the primary lookup.
2. WHEN `Commission_Service` evaluates a product with `hasSIClassification = true` and `sum_insured >= 1,000,000`, THE Commission_Service SHALL use `siCondition = 'GREATER_EQUAL_10_LAKHS'` in the primary lookup.
3. WHEN no rule is found for the computed `siCondition` and `customSIThreshold` rules exist for the product and status, THE Commission_Service SHALL compare `sum_insured` against each rule's `customSIThreshold` using the rule's `customSIOperator`.
4. WHEN `customSIOperator = 'LESS_THAN'` and `sum_insured < customSIThreshold`, THE Commission_Service SHALL select that rule as the active rule.
5. WHEN `customSIOperator = 'GREATER_THAN'` and `sum_insured > customSIThreshold`, THE Commission_Service SHALL select that rule as the active rule.
6. WHEN multiple custom SI rules match, THE Commission_Service SHALL select the most recently created rule (ordered by `createdAt` descending).
