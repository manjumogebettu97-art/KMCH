# KMCH consultation camp landing page

Run `npm start`, then open http://localhost:3000. Requires Node.js 22 or newer; no dependencies to install. `npm test` checks contact validation, private-file protection, and the disconnected form state.

The page uses KMCH’s official logo, website colours (#194998, #09A2D6, #F0F4F8), official hospital photography, locally hosted fonts, and a Magnific robotic surgery rendering. Camp facts come from `KMCH Camp brief for landing page.docx`. The original briefs are not served by the app.

## Google Sheets lead capture

The UI and server integration are prepared. The target spreadsheet and its Landing Page Leads tab are created. A deployed Apps Script web app is still required. The form remains disabled until configured; phone booking is available. A Google Sheet link alone does not provide a public submission endpoint.

1. After the spreadsheet is supplied, create or use the **Landing Page Leads** tab with the headers in `integration/Code.gs`. Existing tabs must be preserved.
2. In the target spreadsheet’s **Extensions → Apps Script**, add `integration/Code.gs`. In Script Properties set `SPREADSHEET_ID` and a random `LEAD_WEBHOOK_TOKEN` of at least 24 characters.
3. Deploy as a web app executing as the owner, accessible to anyone. Only requests containing the server-held token can write. Keep the Google Sheet private. Google may require the owner to authorize the script.
4. Configure `GOOGLE_APPS_SCRIPT_URL` (the deployment `/exec` URL) and the same `LEAD_WEBHOOK_TOKEN` in the hosting environment. Never place the token in frontend files. Restart the server.
5. Submit a clearly marked test enquiry, verify the row in the target tab, then remove that test row. Live delivery has not been tested yet.

The server validates fields, limits requests by socket IP, rejects cross-origin browser submissions, and waits for a positive Sheets acknowledgement. Apps Script prevents duplicate request IDs and spreadsheet formula injection. Configure host-level rate limiting if deploying behind a reverse proxy; the in-memory limiter otherwise groups visitors by proxy address. The site defaults to localhost; set `HOST=0.0.0.0` when required by a hosting platform. Live form capture requires Node hosting, not static-only hosting.

Leads include all nine form answers, consent, timestamp, UTM parameters, GCLID, request ID, and status. No ad conversion tag is configured; add the approved Google Ads identifiers before campaign launch.

## Sources

- [KMCH official website](https://kmchhospitals.com/) — logo, blue/cyan palette, hospital photo.
- Magnific / Freepik stock item 61255985 — robotic-assisted surgery in an operating room, downloaded through the connected Magnific account. This is a representative 3D rendering, not a photo of KMCH equipment.
- [Google Apps Script web apps](https://developers.google.com/apps-script/guides/web) and [Sheet appendRow](https://developers.google.com/apps-script/reference/spreadsheet/sheet#appendrowrowcontents) — integration reference.

No public deployment has been made.

## Updated popup form

Three steps: name / filling for / mobile / gender; city / health concern / surgery advice; duration / treatment at Coimbatore / consent. Questions 1–7 are required; duration and treatment preference remain optional as supplied. The repeated Gynaec Oncology choice is shown once. All other supplied choices are preserved, including overlapping duration options. The dialog supports Escape, focus restoration, keyboard navigation, per-step validation, and previous-answer retention.

Target: https://docs.google.com/spreadsheets/d/1I6PDYKCnt2Jn3h5WCdaovEcQDuEwXY4hoFQoq81yN7I/edit#gid=906712996 — **Landing Page Leads**, columns A:S. Existing tabs were preserved. Live writes are not yet connected.
