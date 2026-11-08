// BillingSourcebook maintenance worker.
// Serves the maintenance page with HTTP 503 + Retry-After for every path,
// which is how you tell Google the downtime is temporary.
// robots.txt stays 200 so crawlers can still read it.
//
// HOW TO TURN MAINTENANCE ON (Cloudflare dashboard, 2 minutes):
//   1. Go to Workers & Pages, click "Create", choose "Create Worker".
//   2. Name it billing-maintenance. Paste this whole file as the code. Deploy.
//   3. Go to the worker's Settings, Triggers, Add route:
//      Route: billingsourcebook.com/*   Zone: billingsourcebook.com
//      Add a second route: www.billingsourcebook.com/*
//   4. Check the live site: it must show the maintenance page, and the
//      status must be 503 (check with: curl -s -o /dev/null -w "%{http_code}"
//      https://billingsourcebook.com/ ).
//
// HOW TO TURN MAINTENANCE OFF:
//   Delete the two routes (or delete the worker). Traffic goes back to the
//   Astro site worker automatically. No code change needed on the main site.
//
// HOW LONG: Retry-After below is 86400 seconds (1 day). If the work runs
// longer, update this number to the new honest estimate and redeploy.
// Google treats a 503 as "try later" for a few days. If a 503 lasts more
// than about a week, Google may start dropping pages from the index anyway,
// so do not leave maintenance on longer than needed.

const RETRY_AFTER_SECONDS = 1814400; // 1 day

const MAINTENANCE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BillingSourcebook — We'll Be Back Soon</title>
<meta name="description" content="BillingSourcebook is temporarily down for maintenance. We'll be back soon.">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #f8fafc;
    color: #0f172a;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 48px 40px;
    max-width: 560px;
    width: 100%;
    text-align: center;
    box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
  }
  .logo { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 8px; }
  .logo span { color: #0d9488; }
  .badge {
    display: inline-block;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #0d9488;
    background: #f0fdfa;
    border: 1px solid #ccfbf1;
    border-radius: 999px;
    padding: 6px 14px;
    margin-bottom: 24px;
  }
  h1 { font-size: 30px; line-height: 1.2; letter-spacing: -0.5px; margin-bottom: 16px; }
  p { font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 12px; }
  p:last-child { margin-bottom: 0; }
  .note { font-size: 14px; color: #94a3b8; margin-top: 24px; }
</style>
</head>
<body>
  <div class="card">
    <div class="logo">Billing<span>Sourcebook</span></div>
    <div class="badge">Maintenance</div>
    <h1>We'll be back soon.</h1>
    <p>BillingSourcebook is temporarily down while we make the site faster, more secure, and more reliable.</p>
    <p>All 3,060 company listings, guides, and tools will be back shortly.</p>
    <p class="note">Thank you for your patience.</p>
  </div>
</body>
</html>`;

const ROBOTS_TXT = `User-agent: *
Allow: /
`;

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Keep robots.txt readable (200) so Google can still fetch it.
    if (url.pathname === "/robots.txt") {
      return new Response(ROBOTS_TXT, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    // Everything else: maintenance page with 503 + Retry-After.
    // 503 tells Google "temporarily down, try later" so it does NOT
    // drop your pages from the index. Never serve this page as 200.
    return new Response(MAINTENANCE_HTML, {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Retry-After": String(RETRY_AFTER_SECONDS),
        "Cache-Control": "no-store",
      },
    });
  },
};
