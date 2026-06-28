// =============================================================================
// GET /api/docs  — Swagger UI for the OpenAPI spec
// Served as a plain HTML Response from a Route Handler (no JSX, backend only).
// Swagger UI assets are loaded from a pinned CDN version and point at
// /api/openapi for the live contract.
// =============================================================================

const SWAGGER_VERSION = "5.17.14";

const HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Vrindavan Bhandara API — Docs</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui.css" />
    <style>body { margin: 0; background: #fafafa; }</style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui-bundle.js" crossorigin></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: "/api/openapi",
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis],
        });
      };
    </script>
  </body>
</html>`;

export const dynamic = "force-static";

export function GET() {
  return new Response(HTML, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
