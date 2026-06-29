# WhatsApp Message Templates — Vrindavan Bhandara

> **Status**: Template definitions only. No provider SDK — uses Meta Cloud API via `fetch`.  
> **Environment Variables Required**: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`  
> **Submission**: Submit each template in Meta Business Manager → WhatsApp → Message Templates

---

## Template 1: `booking_confirmation`

**Trigger**: Admin confirms booking after payment verified  
**Category**: UTILITY | **Language**: en

### Variables
| Placeholder | Value | Example |
|---|---|---|
| `{{1}}` | Customer name | Ramesh Kumar |
| `{{2}}` | Booking number | VB-2024-001234 |
| `{{3}}` | Service name | Bhandara Seva |
| `{{4}}` | Seva date | 15 Jan 2025 |
| `{{5}}` | Amount | ₹5,001 |

### Template Body
```
Jai Shri Krishna! 🙏

Dear {{1}},

Your seva booking has been confirmed.

*Booking #*: {{2}}
*Service*: {{3}}
*Seva Date*: {{4}}
*Amount Paid*: {{5}}

Our team in Vrindavan will perform your seva with full devotion. You will receive proof photos and videos once completed.

With blessings,
Vrindavan Bhandara Team
```

### Code Mapping
```typescript
sendWhatsAppBookingConfirmation({ phone, name, bookingNumber, serviceName, sevaDate, amount })
```

---

## Template 2: `payment_received`

**Trigger**: Razorpay `payment.captured` webhook  
**Category**: UTILITY | **Language**: en

### Variables
| Placeholder | Value | Example |
|---|---|---|
| `{{1}}` | Customer name | Ramesh Kumar |
| `{{2}}` | Amount | ₹5,001 |
| `{{3}}` | Booking number | VB-2024-001234 |

### Template Body
```
Payment Received ✅

Dear {{1}},

We have received your payment of *{{2}}* for booking {{3}}.

Your seva is now scheduled. We will notify you when it begins.

Jai Shri Radhe!
Vrindavan Bhandara
```

---

## Template 3: `seva_in_progress`

**Trigger**: Admin changes booking status → `IN_PROGRESS`  
**Category**: UTILITY | **Language**: en

### Variables
| Placeholder | Value | Example |
|---|---|---|
| `{{1}}` | Customer name | Ramesh Kumar |
| `{{2}}` | Service name | Bhandara Seva |
| `{{3}}` | Seva date | 15 Jan 2025 |

### Template Body
```
Your Seva Has Begun 🪔

Jai Shri Krishna, {{1}}!

Our ground team has begun performing your *{{2}}* today, {{3}}.

We are dedicating this seva with full devotion on your behalf. Proof photos and videos will be shared with you shortly.

Hare Krishna!
Vrindavan Bhandara
```

---

## Template 4: `seva_completed`

**Trigger**: Admin marks booking → `COMPLETED`  
**Category**: UTILITY | **Language**: en | **Button**: View Dashboard (URL)

### Variables
| Placeholder | Value | Example |
|---|---|---|
| `{{1}}` | Customer name | Ramesh Kumar |
| `{{2}}` | Service name | Bhandara Seva |
| `{{3}}` | Dashboard URL | https://vrindavanbhandara.com/dashboard/bookings/... |

### Template Body
```
Seva Completed with Blessings 🙏

Dear {{1}},

Your *{{2}}* seva has been completed successfully in Vrindavan. The blessings of Shri Radha-Krishna are with you and your family.

Proof photos and videos have been uploaded to your account. View them anytime from your dashboard.
```

**Button**: View My Dashboard → `{{3}}`

---

## Template 5: `refund_processed`

**Trigger**: `refund.processed` Razorpay webhook  
**Category**: UTILITY | **Language**: en

### Variables
| Placeholder | Value | Example |
|---|---|---|
| `{{1}}` | Customer name | Ramesh Kumar |
| `{{2}}` | Booking number | VB-2024-001234 |
| `{{3}}` | Refund amount | ₹5,001 |
| `{{4}}` | Timeline | 5-7 business days |

### Template Body
```
Refund Processed 💰

Dear {{1}},

We have processed a refund for your booking *{{2}}*.

*Refund Amount*: {{3}}
*Expected Timeline*: {{4}}

The amount will be credited to your original payment method.

Vrindavan Bhandara Team
```

---

## Template 6: `festival_reminder`

**Trigger**: Admin broadcasts festival campaign  
**Category**: MARKETING | **Language**: en | **Button**: Book Now (URL)

### Variables
| Placeholder | Value | Example |
|---|---|---|
| `{{1}}` | Customer name | Ramesh Kumar |
| `{{2}}` | Festival name | Janmashtami |
| `{{3}}` | Festival date | 16 Aug 2025 |
| `{{4}}` | Booking URL | https://vrindavanbhandara.com/book?campaign=... |

### Template Body
```
🎊 {{2}} Seva — Book Your Spot!

Jai Shri Krishna, {{1}}!

{{2}} is approaching on *{{3}}*. Book your special seva in Vrindavan and Mathura to receive the blessings of Shri Radha-Krishna on this auspicious day.

Limited spots available.
```

**Button**: Book Seva Now → `{{4}}`

---

## Template 8: `admin_alert`

**Trigger**: System internal alerts (admin phones only — never customer phones)  
**Category**: UTILITY | **Language**: en

### Variables
| Placeholder | Value | Example |
|---|---|---|
| `{{1}}` | Alert type | New Booking |
| `{{2}}` | Message | VB-2024-001234 needs confirmation |
| `{{3}}` | Action URL | https://vrindavanbhandara.com/admin/... |

### Template Body
```
⚠️ Admin Alert: {{1}}

{{2}}

Admin Panel: {{3}}

— Vrindavan Bhandara System
```

---

## Meta Business Manager Submission Steps

1. **Meta Business Suite** → **WhatsApp** → **Message Templates** → **Create Template**
2. For each template, select:
   - **Category**: UTILITY or MARKETING (as noted above)
   - **Language**: `en`
3. Paste the body text exactly — use `{{n}}` for variable placeholders
4. Add CTA buttons where specified (type: URL, dynamic URL with `{{n}}` suffix)
5. Submit for review (typically 24–48 hours)
6. Set environment variables once approved:

```env
WHATSAPP_ACCESS_TOKEN=EAAxxxx...
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_BUSINESS_ID=987654321
```

---

## Future Template: `booking_reminder` (Phase 2)

Not yet coded. Trigger: 24h before seva date (cron job).

```
Reminder: Your {{1}} seva is scheduled for *tomorrow, {{2}}*, in Vrindavan.

Our team will begin the seva in the morning and send you live updates.

Jai Shri Radhe! 🙏
Vrindavan Bhandara
```
