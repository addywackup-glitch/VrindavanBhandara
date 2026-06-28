# Repository Map

Repositories are the **only** modules that import Prisma. Every method accepts an optional `db: DbClient` (defaults to the singleton) so the same method works standalone or inside `runTransaction((tx) => …)`.

| Repository | File | Key methods |
| --- | --- | --- |
| Booking | `booking.repository.ts` | `create`, `findById`, `findWithPayment`, `findDetail`, `findForNotification`, `list`, `adminList`, `count`, `update` |
| ProofTimeline | `booking.repository.ts` | `create`, `listForBooking` |
| Payment | `payment.repository.ts` | `findByBookingId`, `findByOrderId(+WithBooking/+WithRefundContext)`, `findByPaymentIdWithRefundContext`, `upsertForBooking`, `update(+ByOrderId/+ByBookingId)`, `aggregateCaptured` |
| User | `user.repository.ts` | `findById`, `findByEmail`, `findByEmailWithAdmin`, `existsByEmail`, `create`, `update`, `touchLastLogin`, `count` |
| Package | `package.repository.ts` | `findActiveWithCategory`, `findById`, `findDetail`, `findBySlug`, `findByIdWithBookingCount`, `list`, `listPublic`, `count`, `create`, `update`, `setActive`, `delete`, `replaceItems`, `topByBookings` |
| ServiceCategory | `package.repository.ts` | `listAll`, `listActivePublic` |
| Coupon | `coupon.repository.ts` | `findByCode`, `incrementUsage`, `recordUsage` |
| Media | `media.repository.ts` | `create`, `countForBooking`, `listForBooking`, `delete` |
| Notification | `notification.repository.ts` | `create`, `listForUser`, `markRead`, `countUnread` |
| Blog | `blog.repository.ts` | `list`, `count`, `findById`, `findBySlug`, `create`, `update`, `delete` |
| Gallery | `gallery.repository.ts` | `list`, `count`, `findById`, `create`, `update`, `delete` |
| Testimonial | `testimonial.repository.ts` | `listPublic`, `findById`, `create`, `update`, `delete` |
| Settings / Message / FAQ / SevaStat | `settings.repository.ts` | `settingsRepository`, `messageRepository`, `faqRepository`, `sevaStatRepository` |
| Certificate | `certificate.repository.ts` | `findByBookingId`, `findByVerifyCode`, `create`, `incrementDownload` |
| Audit | `audit.repository.ts` | `create`, `list`, `count` |

## Transaction helper
`lib/repositories/transaction.ts` → `runTransaction(fn)` wraps `prisma.$transaction`. Services never import `prisma` directly.

## Canonical query shapes
Include/select shapes (and their derived payload types) are colocated with their repository, e.g. `bookingDetailInclude` → `BookingDetail`, `bookingNotifyInclude` → `BookingForNotification`. Import the **types** from `@/lib/repositories`.
