# KMCH consultation camp landing page

Run `npm start`, then open http://localhost:3000. Requires Node.js 22 or newer; no dependencies to install. `npm test` checks contact validation, private-file protection, and the disconnected form state.

The page uses KMCH’s official logo, website colours (#194998, #09A2D6, #F0F4F8), locally hosted fonts, and a Magnific robotic surgery rendering. Camp facts come from `KMCH Camp brief for landing page.docx`. The original briefs are not served by the app.

## Google Sheets lead capture

The GitHub Pages form uses the public Apps Script endpoint in `api/config`. It checks receiver readiness and the destination headers before enabling submission. The deployed receiver is connected. A real enquiry through the live mobile form was verified in the sheet on September 10, 2026, and the test entry was removed. See [the setup notes](integration/SETUP.md) when maintaining the existing deployment.

The receiver is write-only, validates the nine answers and consent, rejects oversized requests and the spam field, prevents spreadsheet formula injection and duplicate request IDs, and applies a basic per-phone submission limit. Keep the Google Sheet private. No credentials are embedded in frontend files.

An optional Node server adapter remains available: configure `GOOGLE_APPS_SCRIPT_URL` and a matching private `LEAD_WEBHOOK_TOKEN` on the server and in Apps Script Properties. The Node server limits requests by socket IP and restricts served files. GitHub Pages uses the direct connection and does not require this server.

Leads include all nine form answers, consent, timestamp, UTM parameters, GCLID, request ID, and status. Google Tag Manager container `GTM-KBSMCVBN` is installed in the head with its noscript fallback immediately after the opening body. The form emits `kmch_lead_submitted` only after confirmed delivery, without form answers in the event. The ads team must verify the published container and configure/test the intended Google Ads conversion tag; installing the container alone does not verify conversion reporting. The optional Node server permits the exact GTM bootstrap via a CSP hash; additional tags may need their own narrowly scoped host permissions.

## Sources

- [KMCH official website](https://kmchhospitals.com/) — logo and blue/cyan palette.
- Magnific / Freepik stock item 61255985 — robotic-assisted surgery in an operating room, downloaded through the connected Magnific account. This is a representative 3D rendering, not a photo of KMCH equipment.
- [Google Apps Script web apps](https://developers.google.com/apps-script/guides/web) and [Sheet appendRow](https://developers.google.com/apps-script/reference/spreadsheet/sheet#appendrowrowcontents) — integration reference.

GitHub Pages serves `main` at https://manjumogebettu97-art.github.io/KMCH/. `npm run build:pages` creates an alternative public-assets-only bundle in `build/pages`. The endpoint URL is public; `.env` and `integration/Deploy.private.gs` must never be published.

## Updated popup form

Three steps: name / filling for / mobile / gender; city / health concern / surgery advice; duration / treatment at Coimbatore / consent. Questions 1–7 are required; duration and treatment preference remain optional as supplied. The repeated Gynaec Oncology choice is shown once. All other supplied choices are preserved, including overlapping duration options. The dialog supports Escape, focus restoration, keyboard navigation, per-step validation, and previous-answer retention.

Target: https://docs.google.com/spreadsheets/d/1I6PDYKCnt2Jn3h5WCdaovEcQDuEwXY4hoFQoq81yN7I/edit#gid=906712996 — **Landing Page Leads**, columns A:S. Existing tabs were preserved. Live writes have been verified.

## Google Analytics

GA4 measurement ID `G-7LXYJ200S2` is installed directly through the supplied Google tag, sharing dataLayer with GTM-KBSMCVBN. The published GTM container did not contain this GA4 ID when checked on September 11, 2026. Do not add a second configuration for the same measurement ID in GTM while this direct installation is active. Confirm received data in GA4 Realtime; account reports and key-event configuration require the Analytics account owner. The form's `kmch_lead_submitted` custom dataLayer event is retained; no extra GA4 lead event is introduced by this installation.
