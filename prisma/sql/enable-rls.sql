-- Enable RLS on all Prisma-owned public tables.
-- No FORCE, no policies: PostgREST anon/authenticated get deny-by-default;
-- Prisma (privileged DB role) continues to bypass RLS.
-- Safe for this app: all app CRUD goes through Prisma, not supabase.from(...).

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users',
    'accounts',
    'sessions',
    'verification_tokens',
    'admins',
    'service_categories',
    'packages',
    'package_items',
    'bookings',
    'payments',
    'media_proofs',
    'proof_timeline_events',
    'gallery_images',
    'festival_campaigns',
    'blogs',
    'testimonials',
    'faqs',
    'notifications',
    'whatsapp_logs',
    'audit_logs',
    'coupons',
    'coupon_usages',
    'referrals',
    'subscriptions',
    'donations',
    'seva_statistics',
    'location_pages',
    'site_configs',
    'contact_messages'
  ]
  LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;
