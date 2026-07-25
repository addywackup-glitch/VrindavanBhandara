# Permission Matrix

RBAC is defined in `lib/rbac.ts` and enforced at one place: `requireAdmin(permission)` in `lib/api/http.ts`. Routes never re-implement permission logic. Admin nav items are also gated by permission in `AdminShell`.

## Roles
- `UserRole`: `CUSTOMER`, `ADMIN`
- `AdminRole`: `SUPER_ADMIN`, `OPERATIONS_ADMIN`, `CONTENT_ADMIN`, `SUPPORT_ADMIN`

A user must have `role = ADMIN` **and** an active `Admin` record carrying an `AdminRole`. `requireAdmin(p)` checks role then `hasPermission(adminRole, p)`.

## Permission → Role grants

| Permission | SUPER_ADMIN | OPERATIONS_ADMIN | CONTENT_ADMIN | SUPPORT_ADMIN |
| --- | :---: | :---: | :---: | :---: |
| bookings:read | ✓ | ✓ | | ✓ |
| bookings:write | ✓ | ✓ | | |
| bookings:delete | ✓ | | | |
| users:read | ✓ | ✓ | | ✓ |
| users:write | ✓ | | | |
| packages:read | ✓ | ✓ | | |
| packages:write | ✓ | ✓ | | |
| packages:delete | ✓ | | | |
| services:read | ✓ | ✓ | ✓ | ✓ |
| services:write | ✓ | ✓ | ✓ | |
| services:delete | ✓ | | | |
| faqs:write | ✓ | ✓ | ✓ | |
| coupons:read | ✓ | ✓ | | |
| coupons:write | ✓ | ✓ | | |
| payments:read | ✓ | ✓ | | ✓ |
| payments:refund | ✓ | ✓ | | |
| blogs:read/write/delete | ✓ | | ✓ | |
| proofs:upload | ✓ | ✓ | | |
| proofs:delete | ✓ | | | |
| testimonials:approve | ✓ | | ✓ | |
| campaigns:write | ✓ | ✓ | ✓ | |
| gallery:write | ✓ | ✓ | ✓ | |
| analytics:read | ✓ | ✓ | | |
| admins:manage | ✓ | | | |
| config:write | ✓ | | | |

## Endpoint → required permission
See the Admin table in `docs/api-reference.md`. Customer endpoints require only authentication (`requireActor`); ownership is enforced inside the service (e.g. `getBooking` rejects non-owners with `FORBIDDEN`).

Admin role assignment UI: `/admin/roles` (API: `GET|POST /api/admin/admins`, `PATCH /api/admin/admins/:id`) requires `admins:manage`.
