# Activate Google Sheets submissions

The **Landing Page Leads** tab is already created in the supplied spreadsheet, with all nine answers, consent, campaign information, and submission status. Existing tabs are untouched.

The remaining step needs the Google account owner because the connected Sheets tool cannot create or deploy an Apps Script web app.

1. Open the supplied spreadsheet and choose **Extensions → Apps Script**.
2. Copy the contents of the local `integration/Deploy.private.gs` file into the Apps Script editor. Save it. This private file includes the prepared handler and a setup function; keep it out of public repositories.
3. Select **configureKMCH** from the function dropdown and click **Run** once. Authorize Google if prompted. This configures authentication to match the local server.
4. Choose **Deploy → New deployment → Web app**. Set **Execute as: Me** and **Who has access: Anyone**, then deploy. The endpoint requires the server-held token before writing; spreadsheet sharing does not need to change.
5. Send the resulting `/exec` web-app URL back here. I can then set `GOOGLE_APPS_SCRIPT_URL` in `.env`, restart the server, and verify a clearly marked test submission in the new tab.

The page is currently available at http://localhost:3000. You can open and navigate all three popup steps, but submission is disabled until the connection is configured. Phone booking remains available.

For hosting later, configure both environment values from `.env` privately on the host. The file and the private deployment script are excluded from Git and cannot be served by the website.
