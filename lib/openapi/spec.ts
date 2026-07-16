// =============================================================================
// VRINDAVAN BHANDARA — OpenAPI 3.1 Specification
// Source: 04-api-specification.md + Phase 2 §11/§12
//
// Hand-authored, fully-typed contract for the ENTIRE backend surface (public +
// authenticated + admin). This is the source of truth a future frontend (Open
// Design or any client) integrates against without rediscovering behavior.
// Served as JSON at /api/openapi and rendered as Swagger UI at /api/docs.
// =============================================================================

type JsonSchema = { [key: string]: unknown };
type MediaType = { schema: JsonSchema };
type Response = { description: string; content?: Record<string, MediaType> };
type Parameter = {
  name: string;
  in: "query" | "path" | "header";
  required?: boolean;
  description?: string;
  schema: JsonSchema;
};
type Operation = {
  tags: string[];
  summary: string;
  description?: string;
  operationId: string;
  security?: Array<Record<string, string[]>>;
  parameters?: Parameter[];
  requestBody?: { required: boolean; content: Record<string, MediaType> };
  responses: Record<string, Response>;
};
type PathItem = Partial<
  Record<"get" | "post" | "put" | "patch" | "delete", Operation>
>;
type OpenApiDocument = {
  openapi: string;
  info: { title: string; version: string; description: string };
  servers: Array<{ url: string; description?: string }>;
  tags: Array<{ name: string; description?: string }>;
  paths: Record<string, PathItem>;
  components: {
    securitySchemes: Record<string, JsonSchema>;
    schemas: Record<string, JsonSchema>;
  };
};

const json = (schema: JsonSchema): Record<string, MediaType> => ({
  "application/json": { schema },
});
const ref = (name: string): JsonSchema => ({ $ref: `#/components/schemas/${name}` });

const success = (data: JsonSchema): JsonSchema => ({
  type: "object",
  required: ["success", "data"],
  properties: {
    success: { type: "boolean", enum: [true] },
    data,
    message: { type: "string" },
  },
});

const paginatedSchema = (item: JsonSchema): JsonSchema => ({
  type: "object",
  properties: {
    data: { type: "array", items: item },
    total: { type: "integer" },
    page: { type: "integer" },
    pageSize: { type: "integer" },
    totalPages: { type: "integer" },
  },
});

const E = {
  400: { description: "Malformed request body", content: json(ref("ApiError")) },
  401: { description: "Authentication required", content: json(ref("ApiError")) },
  403: { description: "Forbidden", content: json(ref("ApiError")) },
  404: { description: "Not found", content: json(ref("ApiError")) },
  409: { description: "Conflict / invalid state", content: json(ref("ApiError")) },
  422: { description: "Validation failed", content: json(ref("ApiError")) },
  429: { description: "Rate limit exceeded", content: json(ref("ApiError")) },
  500: { description: "Internal error", content: json(ref("ApiError")) },
} satisfies Record<number, Response>;

const cookieAuth = [{ cookieAuth: [] }];
const idParam: Parameter = { name: "id", in: "path", required: true, schema: { type: "string" } };
const pageParams: Parameter[] = [
  { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
  { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 50 } },
];

export const openApiDocument: OpenApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Vrindavan Bhandara API",
    version: "1.2.0",
    description:
      "Backend API for the Vrindavan Bhandara seva platform. Every response uses " +
      "a discriminated envelope: `{ success: true, data, message? }` on success or " +
      "`{ success: false, error, code, issues? }` on failure. List endpoints return " +
      "a paginated `data` object.",
  },
  servers: [
    { url: "/", description: "Current origin" },
    { url: "https://vrindavanbhandara.com", description: "Production" },
  ],
  tags: [
    { name: "Auth", description: "Registration and authentication" },
    { name: "Bookings", description: "Seva booking lifecycle" },
    { name: "Payments", description: "Razorpay orders, verification, webhooks" },
    { name: "Public", description: "Unauthenticated catalog & content reads" },
    { name: "Admin", description: "Admin-only management endpoints (RBAC enforced)" },
  ],
  paths: {
    // --- Auth -----------------------------------------------------------------
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new customer account",
        operationId: "registerUser",
        requestBody: { required: true, content: json(ref("RegisterRequest")) },
        responses: {
          "201": { description: "Account created", content: json(success(ref("RegisteredUser"))) },
          "409": E[409],
          "422": E[422],
          "429": E[429],
        },
      },
    },

    // --- Bookings -------------------------------------------------------------
    "/api/bookings": {
      get: {
        tags: ["Bookings"],
        summary: "List bookings (own for customers, all for admins)",
        operationId: "listBookings",
        security: cookieAuth,
        parameters: [...pageParams, { name: "status", in: "query", schema: ref("BookingStatus") }],
        responses: {
          "200": { description: "Paginated bookings", content: json(success(paginatedSchema(ref("Booking")))) },
          "401": E[401],
          "429": E[429],
        },
      },
      post: {
        tags: ["Bookings"],
        summary: "Create a new (PENDING) booking",
        operationId: "createBooking",
        security: cookieAuth,
        requestBody: { required: true, content: json(ref("CreateBookingRequest")) },
        responses: {
          "201": { description: "Booking created", content: json(success(ref("Booking"))) },
          "401": E[401],
          "404": E[404],
          "422": E[422],
          "429": E[429],
        },
      },
    },
    "/api/bookings/{id}": {
      get: {
        tags: ["Bookings"],
        summary: "Get a single booking with full details",
        operationId: "getBooking",
        security: cookieAuth,
        parameters: [idParam],
        responses: {
          "200": { description: "Booking detail", content: json(success(ref("BookingDetail"))) },
          "401": E[401],
          "403": E[403],
          "404": E[404],
        },
      },
      put: {
        tags: ["Bookings"],
        summary: "Update booking status (admin only)",
        operationId: "updateBookingStatus",
        security: cookieAuth,
        parameters: [idParam],
        requestBody: { required: true, content: json(ref("UpdateBookingStatusRequest")) },
        responses: {
          "200": { description: "Updated booking", content: json(success(ref("Booking"))) },
          "401": E[401],
          "403": E[403],
          "404": E[404],
          "409": E[409],
          "422": E[422],
        },
      },
    },

    // --- Payments -------------------------------------------------------------
    "/api/payment/create-order": {
      post: {
        tags: ["Payments"],
        summary: "Create a Razorpay order for a PENDING booking",
        operationId: "createPaymentOrder",
        security: cookieAuth,
        requestBody: { required: true, content: json(ref("CreatePaymentOrderRequest")) },
        responses: {
          "200": { description: "Razorpay order", content: json(success(ref("PaymentOrder"))) },
          "401": E[401],
          "403": E[403],
          "404": E[404],
          "409": E[409],
          "429": E[429],
        },
      },
    },
    "/api/payment/verify": {
      post: {
        tags: ["Payments"],
        summary: "Verify a Razorpay checkout signature and confirm the booking",
        operationId: "verifyPayment",
        security: cookieAuth,
        requestBody: { required: true, content: json(ref("VerifyPaymentRequest")) },
        responses: {
          "200": { description: "Payment verified", content: json(success(ref("VerifyPaymentResult"))) },
          "401": E[401],
          "402": { description: "Invalid payment signature", content: json(ref("ApiError")) },
          "403": E[403],
          "404": E[404],
          "422": E[422],
        },
      },
    },
    "/api/payment/webhook": {
      post: {
        tags: ["Payments"],
        summary: "Razorpay webhook (HMAC-verified, server-to-server)",
        description:
          "Verified via the `X-Razorpay-Signature` header against the raw body. " +
          "Handles payment.captured, payment.failed, refund.processed/created.",
        operationId: "razorpayWebhook",
        parameters: [{ name: "X-Razorpay-Signature", in: "header", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: json({ type: "object" }) },
        responses: {
          "200": { description: "Acknowledged", content: json({ type: "object", properties: { received: { type: "boolean" } } }) },
          "400": { description: "Invalid signature or JSON", content: json(ref("ApiError")) },
        },
      },
    },

    // --- Public ---------------------------------------------------------------
    "/api/services": {
      get: {
        tags: ["Public"],
        summary: "List active service categories",
        operationId: "listServices",
        responses: { "200": { description: "Service categories", content: json(success({ type: "array", items: ref("ServiceCategory") })) }, "429": E[429] },
      },
    },
    "/api/services/{slug}": {
      get: {
        tags: ["Public"],
        summary: "Aggregate content for a single service page",
        description:
          "Returns everything a service page needs in one round-trip: the service " +
          "(with validated pageSections), its active packages, service-scoped FAQs " +
          "(plus global), gallery images, testimonials, and computed related services.",
        operationId: "getServicePage",
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Service page payload", content: json(success(ref("ServicePage"))) },
          "404": E[404],
          "429": E[429],
        },
      },
    },
    "/api/packages": {
      get: {
        tags: ["Public"],
        summary: "List active packages (optionally filtered by service)",
        operationId: "listPublicPackages",
        parameters: [
          { name: "serviceType", in: "query", schema: ref("ServiceType") },
          { name: "serviceSlug", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Packages", content: json(success({ type: "array", items: ref("Package") })) }, "429": E[429] },
      },
    },
    "/api/gallery": {
      get: {
        tags: ["Public"],
        summary: "List public gallery images (optionally scoped to a service)",
        operationId: "listGallery",
        parameters: [
          { name: "serviceType", in: "query", schema: ref("ServiceType") },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 60 } },
        ],
        responses: { "200": { description: "Gallery images", content: json(success({ type: "array", items: ref("PublicGalleryImage") })) }, "429": E[429] },
      },
    },
    "/api/testimonials": {
      get: {
        tags: ["Public"],
        summary: "List approved/featured testimonials",
        operationId: "listPublicTestimonials",
        parameters: [
          { name: "featured", in: "query", schema: { type: "boolean" } },
          { name: "serviceType", in: "query", schema: ref("ServiceType") },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50 } },
        ],
        responses: { "200": { description: "Testimonials", content: json(success({ type: "array", items: ref("Testimonial") })) }, "429": E[429] },
      },
    },
    "/api/faqs": {
      get: {
        tags: ["Public"],
        summary: "List active FAQs (optionally scoped to a service)",
        operationId: "listFaqs",
        parameters: [{ name: "serviceType", in: "query", schema: ref("ServiceType") }],
        responses: { "200": { description: "FAQs", content: json(success({ type: "array", items: ref("Faq") })) }, "429": E[429] },
      },
    },
    "/api/seva-stats": {
      get: {
        tags: ["Public"],
        summary: "List visible seva statistics",
        operationId: "listSevaStats",
        responses: { "200": { description: "Statistics", content: json(success({ type: "array", items: ref("SevaStat") })) }, "429": E[429] },
      },
    },

    // --- Admin ----------------------------------------------------------------
    "/api/admin/bookings": {
      get: {
        tags: ["Admin"],
        summary: "List all bookings with search & filter",
        operationId: "adminListBookings",
        security: cookieAuth,
        parameters: [
          ...pageParams,
          { name: "status", in: "query", schema: ref("BookingStatus") },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Paginated bookings", content: json(success(paginatedSchema(ref("Booking")))) }, "401": E[401], "403": E[403] },
      },
    },
    "/api/admin/bookings/{id}/status": {
      patch: {
        tags: ["Admin"],
        summary: "Transition a booking to a new status",
        operationId: "adminUpdateBookingStatus",
        security: cookieAuth,
        parameters: [idParam],
        requestBody: { required: true, content: json(ref("UpdateBookingStatusRequest")) },
        responses: { "200": { description: "Updated", content: json(success(ref("Booking"))) }, "401": E[401], "403": E[403], "404": E[404], "409": E[409], "422": E[422] },
      },
    },
    "/api/admin/bookings/{id}/proof": {
      get: {
        tags: ["Admin"],
        summary: "List media proofs for a booking",
        operationId: "adminListProofs",
        security: cookieAuth,
        parameters: [idParam],
        responses: { "200": { description: "Proofs", content: json(success({ type: "array", items: ref("MediaProof") })) }, "401": E[401], "403": E[403] },
      },
      post: {
        tags: ["Admin"],
        summary: "Attach a media proof to a booking",
        operationId: "adminAddProof",
        security: cookieAuth,
        parameters: [idParam],
        requestBody: { required: true, content: json(ref("AddProofRequest")) },
        responses: { "201": { description: "Created", content: json(success(ref("MediaProof"))) }, "401": E[401], "403": E[403], "404": E[404], "422": E[422] },
      },
    },
    "/api/admin/packages": {
      get: {
        tags: ["Admin"],
        summary: "List packages (admin)",
        operationId: "adminListPackages",
        security: cookieAuth,
        parameters: [...pageParams, { name: "search", in: "query", schema: { type: "string" } }, { name: "categoryId", in: "query", schema: { type: "string" } }],
        responses: { "200": { description: "Paginated packages", content: json(success(paginatedSchema(ref("Package")))) }, "401": E[401], "403": E[403] },
      },
      post: {
        tags: ["Admin"],
        summary: "Create a package",
        operationId: "adminCreatePackage",
        security: cookieAuth,
        requestBody: { required: true, content: json(ref("CreatePackageRequest")) },
        responses: { "201": { description: "Created", content: json(success(ref("Package"))) }, "401": E[401], "403": E[403], "409": E[409], "422": E[422] },
      },
    },
    "/api/admin/packages/{id}": {
      get: { tags: ["Admin"], summary: "Get a package", operationId: "adminGetPackage", security: cookieAuth, parameters: [idParam], responses: { "200": { description: "Package", content: json(success(ref("Package"))) }, "401": E[401], "403": E[403], "404": E[404] } },
      patch: { tags: ["Admin"], summary: "Update a package", operationId: "adminUpdatePackage", security: cookieAuth, parameters: [idParam], requestBody: { required: true, content: json(ref("CreatePackageRequest")) }, responses: { "200": { description: "Updated", content: json(success(ref("Package"))) }, "401": E[401], "403": E[403], "404": E[404], "422": E[422] } },
      delete: { tags: ["Admin"], summary: "Delete or deactivate a package", operationId: "adminDeletePackage", security: cookieAuth, parameters: [idParam], responses: { "200": { description: "Deleted/Deactivated", content: json(success({ type: "object", properties: { deactivated: { type: "boolean" }, message: { type: "string" } } })) }, "401": E[401], "403": E[403], "404": E[404] } },
    },
    "/api/admin/blog": {
      get: { tags: ["Admin"], summary: "List blog posts", operationId: "adminListBlogs", security: cookieAuth, parameters: [...pageParams, { name: "search", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: ref("BlogStatus") }], responses: { "200": { description: "Paginated posts", content: json(success(paginatedSchema(ref("Blog")))) }, "401": E[401], "403": E[403] } },
      post: { tags: ["Admin"], summary: "Create a blog post", operationId: "adminCreateBlog", security: cookieAuth, requestBody: { required: true, content: json(ref("CreateBlogRequest")) }, responses: { "201": { description: "Created", content: json(success(ref("Blog"))) }, "401": E[401], "403": E[403], "409": E[409], "422": E[422] } },
    },
    "/api/admin/blog/{id}": {
      get: { tags: ["Admin"], summary: "Get a blog post", operationId: "adminGetBlog", security: cookieAuth, parameters: [idParam], responses: { "200": { description: "Post", content: json(success(ref("Blog"))) }, "401": E[401], "403": E[403], "404": E[404] } },
      patch: { tags: ["Admin"], summary: "Update a blog post", operationId: "adminUpdateBlog", security: cookieAuth, parameters: [idParam], requestBody: { required: true, content: json(ref("UpdateBlogRequest")) }, responses: { "200": { description: "Updated", content: json(success(ref("Blog"))) }, "401": E[401], "403": E[403], "404": E[404], "409": E[409], "422": E[422] } },
      delete: { tags: ["Admin"], summary: "Delete a blog post", operationId: "adminDeleteBlog", security: cookieAuth, parameters: [idParam], responses: { "200": { description: "Deleted", content: json(success({ type: "object", properties: { id: { type: "string" } } })) }, "401": E[401], "403": E[403], "404": E[404] } },
    },
    "/api/admin/gallery": {
      get: { tags: ["Admin"], summary: "List gallery images", operationId: "adminListGallery", security: cookieAuth, parameters: [...pageParams, { name: "category", in: "query", schema: { type: "string" } }, { name: "search", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Paginated images", content: json(success(paginatedSchema(ref("GalleryImage")))) }, "401": E[401], "403": E[403] } },
      post: { tags: ["Admin"], summary: "Add a gallery image", operationId: "adminCreateGallery", security: cookieAuth, requestBody: { required: true, content: json(ref("CreateGalleryRequest")) }, responses: { "201": { description: "Created", content: json(success(ref("GalleryImage"))) }, "401": E[401], "403": E[403], "422": E[422] } },
    },
    "/api/admin/gallery/{id}": {
      patch: { tags: ["Admin"], summary: "Update a gallery image", operationId: "adminUpdateGallery", security: cookieAuth, parameters: [idParam], requestBody: { required: true, content: json(ref("UpdateGalleryRequest")) }, responses: { "200": { description: "Updated", content: json(success(ref("GalleryImage"))) }, "401": E[401], "403": E[403], "404": E[404], "422": E[422] } },
      delete: { tags: ["Admin"], summary: "Delete a gallery image", operationId: "adminDeleteGallery", security: cookieAuth, parameters: [idParam], responses: { "200": { description: "Deleted", content: json(success({ type: "object", properties: { id: { type: "string" } } })) }, "401": E[401], "403": E[403], "404": E[404] } },
    },
    "/api/admin/testimonials/{id}": {
      patch: { tags: ["Admin"], summary: "Moderate a testimonial", operationId: "adminModerateTestimonial", security: cookieAuth, parameters: [idParam], requestBody: { required: true, content: json(ref("ModerateTestimonialRequest")) }, responses: { "200": { description: "Updated", content: json(success(ref("Testimonial"))) }, "401": E[401], "403": E[403], "404": E[404], "422": E[422] } },
      delete: { tags: ["Admin"], summary: "Delete a testimonial", operationId: "adminDeleteTestimonial", security: cookieAuth, parameters: [idParam], responses: { "200": { description: "Deleted", content: json(success({ type: "object", properties: { id: { type: "string" } } })) }, "401": E[401], "403": E[403], "404": E[404] } },
    },
    "/api/admin/messages/{id}": {
      patch: { tags: ["Admin"], summary: "Update a contact message", operationId: "adminUpdateMessage", security: cookieAuth, parameters: [idParam], requestBody: { required: true, content: json(ref("UpdateMessageRequest")) }, responses: { "200": { description: "Updated", content: json(success(ref("ContactMessage"))) }, "401": E[401], "403": E[403], "404": E[404], "422": E[422] } },
      delete: { tags: ["Admin"], summary: "Delete a contact message", operationId: "adminDeleteMessage", security: cookieAuth, parameters: [idParam], responses: { "200": { description: "Deleted", content: json(success({ type: "object", properties: { id: { type: "string" } } })) }, "401": E[401], "403": E[403], "404": E[404] } },
    },
    "/api/admin/settings": {
      get: { tags: ["Admin"], summary: "List site settings", operationId: "adminListSettings", security: cookieAuth, responses: { "200": { description: "Settings", content: json(success({ type: "array", items: ref("SiteConfig") })) }, "401": E[401], "403": E[403] } },
      post: { tags: ["Admin"], summary: "Create or update a setting", operationId: "adminUpsertSetting", security: cookieAuth, requestBody: { required: true, content: json(ref("UpsertSettingRequest")) }, responses: { "200": { description: "Saved", content: json(success(ref("SiteConfig"))) }, "401": E[401], "403": E[403], "422": E[422] } },
    },
    "/api/admin/stats": {
      get: { tags: ["Admin"], summary: "Dashboard metrics", operationId: "adminStats", security: cookieAuth, responses: { "200": { description: "Stats", content: json(success(ref("DashboardStats"))) }, "401": E[401], "403": E[403] } },
    },

    // --- API docs ------------------------------------------------------------
    "/api/openapi": {
      get: { tags: ["Public"], summary: "This OpenAPI document", operationId: "getOpenApi", responses: { "200": { description: "OpenAPI 3.1 JSON", content: json({ type: "object" }) } } },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "sb-access-token",
        description:
          "Supabase Auth session cookies (sb-*-auth-token). Set on login via /api/auth/login or OAuth callback.",
      },
    },
    schemas: {
      ApiError: {
        type: "object",
        required: ["success", "error", "code"],
        properties: {
          success: { type: "boolean", enum: [false] },
          error: { type: "string" },
          code: {
            type: "string",
            enum: ["VALIDATION_ERROR", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "CONFLICT", "RATE_LIMITED", "PAYMENT_ERROR", "INTERNAL_ERROR"],
          },
          issues: {
            type: "array",
            items: { type: "object", properties: { path: { type: "string" }, message: { type: "string" } } },
          },
        },
      },
      BookingStatus: { type: "string", enum: ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "REFUNDED"] },
      BlogStatus: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
      ServiceType: { type: "string", enum: ["BHANDARA", "BRAHMIN_BHOJ", "GAU_SEVA", "SADHU_BHOJAN", "FESTIVAL_SEVA", "ANNADAN_SEVA", "VIDHWA_SEVA"] },

      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 100 },
          email: { type: "string", format: "email" },
          phone: { type: "string", pattern: "^[6-9]\\d{9}$" },
          password: { type: "string", minLength: 8, maxLength: 128, description: "Must contain upper, lower, and a number." },
        },
      },
      RegisteredUser: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, email: { type: "string", format: "email" } } },

      CreateBookingRequest: {
        type: "object",
        required: ["packageId", "sevaDate"],
        properties: {
          packageId: { type: "string", description: "cuid of an active package" },
          sevaDate: { type: "string", format: "date-time", description: "At least 24h in the future" },
          sevaLocation: { type: "string", enum: ["Vrindavan", "Mathura"], default: "Vrindavan" },
          guestCount: { type: "integer", minimum: 1, maximum: 10000, default: 1 },
          dedicatedTo: { type: "string", maxLength: 100 },
          gotra: { type: "string", maxLength: 100 },
          occasion: { type: "string", maxLength: 100 },
          specialInstructions: { type: "string", maxLength: 1000 },
          couponCode: { type: "string", maxLength: 50 },
        },
      },
      UpdateBookingStatusRequest: {
        type: "object",
        required: ["status"],
        properties: { status: ref("BookingStatus"), adminNotes: { type: "string", maxLength: 2000 }, completionNotes: { type: "string", maxLength: 2000 } },
      },
      Booking: {
        type: "object",
        properties: {
          id: { type: "string" },
          bookingNumber: { type: "string", example: "VB-2026-123456" },
          status: ref("BookingStatus"),
          sevaDate: { type: "string", format: "date-time" },
          sevaLocation: { type: "string" },
          guestCount: { type: "integer" },
          baseAmount: { type: "number" },
          discountAmount: { type: "number" },
          taxAmount: { type: "number" },
          totalAmount: { type: "number" },
          currency: { type: "string", default: "INR" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      BookingDetail: {
        allOf: [
          ref("Booking"),
          {
            type: "object",
            properties: {
              user: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, email: { type: "string" }, phone: { type: "string", nullable: true } } },
              payment: { type: "object", nullable: true },
              proofTimeline: { type: "array", items: { type: "object" } },
              mediaProofs: { type: "array", items: ref("MediaProof") },
            },
          },
        ],
      },

      CreatePaymentOrderRequest: { type: "object", required: ["bookingId"], properties: { bookingId: { type: "string" } } },
      PaymentOrder: {
        type: "object",
        properties: {
          orderId: { type: "string", example: "order_XXXXXXXX" },
          amount: { type: "number", description: "Amount in INR" },
          currency: { type: "string", default: "INR" },
          bookingNumber: { type: "string" },
          keyId: { type: "string", description: "Razorpay public key id for checkout" },
        },
      },
      VerifyPaymentRequest: {
        type: "object",
        required: ["bookingId", "razorpay_order_id", "razorpay_payment_id", "razorpay_signature"],
        properties: {
          bookingId: { type: "string" },
          razorpay_order_id: { type: "string" },
          razorpay_payment_id: { type: "string" },
          razorpay_signature: { type: "string" },
        },
      },
      VerifyPaymentResult: { type: "object", properties: { bookingId: { type: "string" }, bookingNumber: { type: "string" } } },

      ServiceCategory: {
        type: "object",
        properties: { id: { type: "string" }, type: ref("ServiceType"), name: { type: "string" }, slug: { type: "string" }, shortDesc: { type: "string" }, icon: { type: "string", nullable: true }, image: { type: "string", nullable: true } },
      },
      ServicePageSections: {
        type: "object",
        description: "Presentation-oriented, content-driven page blocks (nullable). Validated by ServicePageSectionsSchema.",
        nullable: true,
        properties: {
          hero: { type: "object", properties: { tagline: { type: "string" }, badges: { type: "array", items: { type: "string" } }, backgroundImage: { type: "string", format: "uri" } } },
          benefits: { type: "array", items: { type: "object", properties: { icon: { type: "string" }, title: { type: "string" }, description: { type: "string" } } } },
          highlights: { type: "array", items: { type: "object", properties: { icon: { type: "string" }, title: { type: "string" }, description: { type: "string" } } } },
          howItWorks: { type: "array", items: { type: "object", properties: { step: { type: "integer" }, title: { type: "string" }, description: { type: "string" }, icon: { type: "string" } } } },
          trustBadges: { type: "array", items: { type: "object", properties: { icon: { type: "string" }, text: { type: "string" } } } },
          includedItems: { type: "array", items: { type: "string" } },
        },
      },
      ServiceDetail: {
        type: "object",
        description: "Full service record with validated pageSections.",
        properties: {
          id: { type: "string" },
          type: ref("ServiceType"),
          name: { type: "string" },
          slug: { type: "string" },
          shortDesc: { type: "string" },
          description: { type: "string" },
          icon: { type: "string", nullable: true },
          image: { type: "string", nullable: true },
          metaTitle: { type: "string", nullable: true },
          metaDesc: { type: "string", nullable: true },
          pageSections: ref("ServicePageSections"),
        },
      },
      ServicePage: {
        type: "object",
        description: "Aggregate payload for GET /api/services/{slug}.",
        properties: {
          service: ref("ServiceDetail"),
          packages: { type: "array", items: ref("Package") },
          faqs: { type: "array", items: ref("Faq") },
          gallery: { type: "array", items: ref("PublicGalleryImage") },
          testimonials: { type: "array", items: ref("Testimonial") },
          relatedServices: { type: "array", items: ref("ServiceCategory") },
        },
      },
      Package: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: "string" },
          shortDesc: { type: "string" },
          price: { type: "number" },
          currency: { type: "string" },
          isActive: { type: "boolean" },
          serviceCategory: ref("ServiceCategory"),
          items: { type: "array", items: { type: "object", properties: { description: { type: "string" }, quantity: { type: "integer" }, unit: { type: "string", nullable: true } } } },
        },
      },
      CreatePackageRequest: {
        type: "object",
        required: ["serviceCategoryId", "name", "slug", "description", "shortDesc", "price"],
        properties: {
          serviceCategoryId: { type: "string" },
          name: { type: "string" },
          slug: { type: "string", pattern: "^[a-z0-9-]+$" },
          description: { type: "string" },
          shortDesc: { type: "string" },
          price: { type: "number" },
          originalPrice: { type: "number" },
          maxGuests: { type: "integer" },
          duration: { type: "string" },
          isFeatured: { type: "boolean" },
          items: { type: "array", items: { type: "object", properties: { description: { type: "string" }, quantity: { type: "integer" }, unit: { type: "string" } } } },
        },
      },

      Blog: {
        type: "object",
        properties: { id: { type: "string" }, title: { type: "string" }, slug: { type: "string" }, excerpt: { type: "string" }, status: ref("BlogStatus"), tags: { type: "array", items: { type: "string" } }, publishedAt: { type: "string", format: "date-time", nullable: true } },
      },
      CreateBlogRequest: {
        type: "object",
        required: ["title", "slug", "excerpt", "content"],
        properties: { title: { type: "string" }, slug: { type: "string", pattern: "^[a-z0-9-]+$" }, excerpt: { type: "string" }, content: { type: "string" }, coverImage: { type: "string", format: "uri" }, tags: { type: "array", items: { type: "string" } }, status: ref("BlogStatus") },
      },
      UpdateBlogRequest: {
        type: "object",
        properties: { title: { type: "string" }, slug: { type: "string", pattern: "^[a-z0-9-]+$" }, excerpt: { type: "string" }, content: { type: "string" }, status: ref("BlogStatus"), tags: { type: "array", items: { type: "string" } } },
      },

      GalleryImage: {
        type: "object",
        properties: { id: { type: "string" }, url: { type: "string", format: "uri" }, title: { type: "string", nullable: true }, category: { type: "string" }, isActive: { type: "boolean" }, isFeatured: { type: "boolean" } },
      },
      CreateGalleryRequest: {
        type: "object",
        required: ["url", "category"],
        properties: { url: { type: "string", format: "uri" }, thumbnail: { type: "string", format: "uri" }, title: { type: "string" }, category: { type: "string", enum: ["BHANDARA", "BRAHMIN_BHOJ", "GAU_SEVA", "SADHU_BHOJAN", "FESTIVAL", "TEMPLE", "GENERAL"] }, tags: { type: "array", items: { type: "string" } }, isFeatured: { type: "boolean" } },
      },
      UpdateGalleryRequest: {
        type: "object",
        properties: { title: { type: "string", nullable: true }, category: { type: "string" }, isActive: { type: "boolean" }, isFeatured: { type: "boolean" }, sortOrder: { type: "integer" } },
      },

      Testimonial: {
        type: "object",
        properties: { id: { type: "string" }, name: { type: "string" }, city: { type: "string", nullable: true }, country: { type: "string", nullable: true }, rating: { type: "integer", minimum: 1, maximum: 5 }, comment: { type: "string" }, serviceType: { ...ref("ServiceType"), nullable: true }, isFeatured: { type: "boolean" }, createdAt: { type: "string", format: "date-time" } },
      },
      ModerateTestimonialRequest: { type: "object", required: ["action"], properties: { action: { type: "string", enum: ["approve", "reject", "feature", "unfeature"] } } },

      ContactMessage: {
        type: "object",
        properties: { id: { type: "string" }, name: { type: "string" }, email: { type: "string" }, subject: { type: "string" }, isRead: { type: "boolean" }, isReplied: { type: "boolean" } },
      },
      UpdateMessageRequest: { type: "object", properties: { isRead: { type: "boolean" }, isReplied: { type: "boolean" }, adminNotes: { type: "string", nullable: true } } },

      SiteConfig: { type: "object", properties: { key: { type: "string" }, value: { type: "string" }, type: { type: "string" }, group: { type: "string" } } },
      UpsertSettingRequest: { type: "object", required: ["key", "value"], properties: { key: { type: "string" }, value: { type: "string" }, type: { type: "string", enum: ["string", "number", "boolean", "json"] }, label: { type: "string" }, group: { type: "string" } } },

      MediaProof: {
        type: "object",
        properties: { id: { type: "string" }, url: { type: "string", format: "uri" }, type: { type: "string", enum: ["PHOTO", "VIDEO", "DOCUMENT"] }, caption: { type: "string", nullable: true }, isPublic: { type: "boolean" } },
      },
      AddProofRequest: {
        type: "object",
        required: ["url", "type"],
        properties: { url: { type: "string", format: "uri" }, type: { type: "string", enum: ["IMAGE", "PHOTO", "VIDEO", "DOCUMENT"] }, caption: { type: "string" }, isPublic: { type: "boolean" } },
      },

      Faq: { type: "object", properties: { id: { type: "string" }, question: { type: "string" }, answer: { type: "string" }, category: { type: "string" }, serviceType: { ...ref("ServiceType"), nullable: true }, sortOrder: { type: "integer" } } },
      PublicGalleryImage: {
        type: "object",
        properties: { id: { type: "string" }, url: { type: "string", format: "uri" }, thumbnail: { type: "string", format: "uri", nullable: true }, title: { type: "string", nullable: true }, description: { type: "string", nullable: true }, category: { type: "string" }, serviceType: { ...ref("ServiceType"), nullable: true }, width: { type: "integer", nullable: true }, height: { type: "integer", nullable: true } },
      },
      SevaStat: { type: "object", properties: { key: { type: "string" }, label: { type: "string" }, value: { type: "number" }, unit: { type: "string", nullable: true } } },
      DashboardStats: {
        type: "object",
        properties: {
          bookings: { type: "object", properties: { total: { type: "integer" }, pending: { type: "integer" }, confirmed: { type: "integer" }, completed: { type: "integer" }, cancelled: { type: "integer" }, inProgress: { type: "integer" } } },
          users: { type: "object", properties: { total: { type: "integer" } } },
          revenue: { type: "object", properties: { total: { type: "number" }, monthly: { type: "number" } } },
        },
      },
    },
  },
};
