# Service Map

Every business operation lives in exactly one service. Services are framework-agnostic, return `ServiceResult<T>`, and depend only on repositories + `lib/api` + `lib/errors` + `features`.

| Service | File | Methods | Used by |
| --- | --- | --- | --- |
| Auth | `lib/services/auth.service.ts` | `registerUser` | `/api/auth/register`, `/api/auth/login`, Supabase Auth + Prisma profile sync |
| Booking | `lib/services/booking.service.ts` | `createBooking`, `listBookings`, `getBooking`, `updateBookingStatus`, `canTransition`, `toBookingDto` | bookings routes, admin status route, `app/actions/bookings` |
| Payment | `lib/services/payment.service.ts` | `createPaymentOrder`, `verifyPayment`, `processWebhookEvent` | payment routes, `app/actions/payments` |
| Refund | `lib/services/refund.service.ts` | `processRefundWebhook` | payment webhook |
| Package | `lib/services/package.service.ts` | `listPackages`, `getPackage`, `createPackage`, `updatePackage`, `deletePackage` | admin packages routes |
| Blog | `lib/services/blog.service.ts` | `listBlogs`, `getBlog`, `createBlog`, `updateBlog`, `deleteBlog` | admin blog routes |
| Gallery | `lib/services/gallery.service.ts` | `listGallery`, `createGalleryImage`, `updateGalleryImage`, `deleteGalleryImage` | admin gallery routes |
| Testimonial | `lib/services/testimonial.service.ts` | `listPublicTestimonials`, `moderateTestimonial`, `deleteTestimonial` | public + admin testimonials |
| Settings | `lib/services/settings.service.ts` | `listSettings`, `upsertSetting` | admin settings |
| Message | `lib/services/message.service.ts` | `updateMessage`, `deleteMessage` | admin messages |
| Media | `lib/services/media.service.ts` | `addProof`, `listProofs` | admin booking proof |
| Analytics | `lib/services/analytics.service.ts` | `getDashboardStats` | admin stats |
| Admin | `lib/services/admin.service.ts` | `adminListBookings` | admin bookings |
| Content | `lib/services/content.service.ts` | `listServices`, `listPublicPackages`, `listFaqs`, `listSevaStats` | public routes |
| Notification | `lib/services/notification.service.ts` | `listNotifications`, `unreadCount`, `markNotificationRead` | (ready for `/api/notifications`) |

## Shared helpers
- `lib/api/service.ts` — `execute()` (run + map throws to `ServiceResult`), `validate()` (Zod → throw `ValidationError`), `toServiceFailure()`.
- `lib/api/result.ts` — `ServiceResult`, `ok`, `fail`, `ServiceError`.
- `lib/api/http.ts` — `respond`, `handle`, `requireActor`, `requireAdmin`, `getActor`, `parseJsonBody`, IP helpers.
- `lib/api/pagination.ts` — `parsePagination`, `paginated`.
- `lib/api/validation.ts` — `parseWith`.
