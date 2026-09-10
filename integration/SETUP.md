# Connect the GitHub Pages form

The site sends validated enquiries directly to Google Apps Script, which writes only to **Landing Page Leads**. No paid Node hosting or client-side secret is needed. Keep the spreadsheet private.

## Future updates in your existing Apps Script project

1. Open **KMCH Form** in Apps Script and select **Code.gs**.
2. Replace all editor contents with the complete code in [Code.gs](Code.gs), then save.
3. Choose **Deploy → Manage deployments → Edit (pencil)**.
4. Under **Version**, choose **New version**. Keep **Execute as: Me** and **Who has access: Anyone**, then click **Deploy**. Editing this deployment keeps the URL already configured on the website.
5. Refresh the landing page. It enables submission only after the script confirms that the destination tab has the correct headers.

The old configureKMCH setup function is no longer needed. Existing Script Properties can stay; no secret is used by the public form. The optional Node adapter can still authenticate using its private token.

## Verification

Send one clearly marked test enquiry, verify its answers in Landing Page Leads, then delete only that test row. The frontend requires a readable positive response before displaying success; a failed request retains the answers and request ID so a retry cannot create a duplicate.

The public receiver exposes no lead-reading route. It validates all choices and consent, caps request size, rejects the hidden spam field, prevents spreadsheet formulas and duplicate request IDs, and limits repeated submissions for a phone number. This basic limit is not a CAPTCHA and does not prevent distributed spam. Apps Script quotas still apply.

The receiver is deployed and live delivery was verified on September 10, 2026. No redeployment is needed merely to move this same website to a subdomain.
