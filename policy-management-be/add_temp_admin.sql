-- add_temp_admin.sql
-- Insert a super‑admin role with all permissions
INSERT INTO `roles` (`id`, `role_name`, `permissions`, `is_deleted`)
VALUES (UUID(), 'SUPERADMIN',
        JSON_ARRAY(
            'Dashboard','Users_Panel','Site','Items','All_Enquiry','All_Policy',
            'Clients','Agent','Reimbursement','Commission','Revenues',
            'PolicyGroup','Company','PolicyType','PolicyName','CompanyFormField'
        ),
        FALSE)
ON DUPLICATE KEY UPDATE
    permissions = VALUES(permissions),
    is_deleted = FALSE;

-- Insert a temporary admin user with the requested phone number
INSERT INTO `users` (
    `id`, `name`, `email`, `phone`, `password`, `status`, `web_access`, `app_access`,
    `permissions`, `created_at`, `updated_at`, `is_deleted`, `role_id`
) SELECT
    UUID(), 'Temp Admin', NULL, '9217248368', NULL, 'Active', TRUE, TRUE,
    '{}', NOW(), NOW(), FALSE, r.id
FROM `roles` r
WHERE r.role_name = 'SUPERADMIN'
ON DUPLICATE KEY UPDATE
    role_id = r.id,
    is_deleted = FALSE;
