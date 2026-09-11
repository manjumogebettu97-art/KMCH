# KMCH tracking handoff

GA4: **G-7LXYJ200S2**. GTM: **GTM-KBSMCVBN**.

Website tracking is implemented directly through the installed GA4 Google tag. The following events are sent to that measurement ID. GTM remains available for Google Ads tags. No Ads conversion ID/label or authenticated account-management connection was provided, so account-side key events, imports and conversion reporting are not configured here.

## Events now implemented

| Event | Meaning | Parameters |
| --- | --- | --- |
| `booking_click` | A booking CTA opens the consultation form | `cta_location` |
| `consultation_start` | First input interaction for a new enquiry | None |
| `form_step_view` | A form step is shown, including back/reopen | `step_number` (1–3) |
| `consultation_validation_error` | Required/invalid input prevents advancing or submitting | `step_number` |
| `consultation_submit_attempt` | Final submit is attempted, including keyboard submission; it may fail validation | None |
| `consultation_submit_error` | A request fails or cannot be confirmed | `error_type`: timeout or unconfirmed |
| `generate_lead` | Google Sheets confirms successful receipt | None |
| `click_to_call` | A visitor taps any telephone link | `cta_location` |
| `consultation_close` | An unfinished form is closed while no request is in progress | `step_number` |

Every custom GA4 event includes the fixed `form_id=consultation`. CTA locations use only fixed UI labels (header, hero, sticky_mobile, specialties, appointment, form, footer, page). Events contain no entered name, phone, health concern, city, answers, consent value or request ID. Normal Google tag page/campaign metadata is managed by the tag. Do not use personal information in ad URL parameters or enable collection of health answers through GTM variables.

A separate `kmch_lead_submitted` dataLayer event remains available to GTM after successful delivery. It contains only the event name. **Do not use it to send a second GA4 `generate_lead` event**: the website already sends that event directly. Use one conversion measurement route in Google Ads so a single enquiry is not counted twice.

Repeated successful responses from a retry do not produce another row because the receiver checks request IDs. In the browser, a pending submit disables the button, an unconfirmed request does not fire `generate_lead`, and an unchanged retry preserves its request ID. Analytics failures never block the form or telephone link. Tracking can still be blocked by browser privacy settings/ad blockers; this is not a count of every actual visitor.

## Account owner: finish conversion setup

1. Open the GA4 property for **G-7LXYJ200S2**. Under **Admin → Data display → Events**, mark **generate_lead** as a key event. If it is not listed yet, wait for a confirmed enquiry to be received or predeclare the key event with that exact name. Do not create a derived lead event from every page_view or button click.
2. Link the intended Google Ads account to this Analytics property if it is not already linked. In Google Ads, use **Goals → Conversions → Summary → Create conversion action**, select the linked Analytics source and import **generate_lead**. Choose the lead-form category and review its action-optimization setting. Use it as the primary enquiry conversion for bidding if that is the campaign's goal; an Analytics-side import may initially be secondary.
3. For call-button intent reporting, optionally mark/import **click_to_call** as a separate secondary conversion. This records a tap, not a connected or qualified call. Measuring completed calls or call duration needs separate Google Ads call-reporting/forwarding configuration where eligible; that has not been set up.
4. Keep submit attempts, form opens, step views and errors as diagnostics rather than primary conversions. Use them to identify where visitors stop or where submission fails.
5. Verify the intended events in GA4 Realtime/DebugView and the configured conversions in Google Ads. Check that one confirmed enquiry counts once and that a failed submit counts zero. Neither GA4 account receipt nor Ads attribution can be confirmed using the website code alone.

The same tracking IDs continue to work after this same site moves to a subdomain. Retest the destination, tags and form, and review any domain-specific triggers in the GTM account. No Apps Script redeployment is needed.

## Verification completed in code

Tests cover all call-link handlers, booking clicks, first input, three steps, required-field errors, final-submit attempts, failed delivery, successful retry, one confirmed lead event, form close, and booking while the analytics function throws. Analytics collection requests are intercepted and Sheets requests mocked in this test, so no test conversions or patient records are created. The test also checks that custom events and captured outgoing Analytics requests do not contain the entered test data.

The previously supplied Lighthouse scores predate GTM and Analytics; they are historical performance evidence, not a fresh score for this tracking update.

## Official references

- [GA4 recommended generate_lead event](https://developers.google.com/analytics/devguides/collection/ga4/reference/events#generate_lead)
- [Mark events as key events](https://support.google.com/analytics/answer/13128484?hl=en)
- [Import Analytics events into Google Ads](https://support.google.com/google-ads/answer/2375435?hl=en)
