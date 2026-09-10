// Public, write-only receiver for the KMCH GitHub Pages consultation form.
// Deploy as a web app: Execute as Me, Who has access Anyone.
// A source marker identifies the form protocol; it is not an authentication secret.
const TAB_NAME = 'Landing Page Leads';
const HEADERS = ["Received at", "Full Name", "Filling form for", "Mobile Number", "Gender", "City / Location", "Health concern", "Doctor advised surgery", "Problem duration", "Treatment at Coimbatore KMCH", "Contact consent", "UTM source", "UTM medium", "UTM campaign", "UTM content", "UTM term", "GCLID", "Request ID", "Status"];
const SCHEMA = {
  "fillingFor": [
    "Myself",
    "Family Member",
    "Friend"
  ],
  "gender": [
    "Male",
    "Female",
    "Other"
  ],
  "city": [
    "Coimbatore",
    "Tiruppur",
    "Pollachi",
    "Erode",
    "Salem",
    "Namakkal",
    "Karur",
    "Palakkad",
    "Nilgiris",
    "Dharapuram",
    "Udumalpet",
    "Palani",
    "Oddanchatram",
    "Rasipuram",
    "Dharmapuri",
    "Sankagiri"
  ],
  "concern": [
    "Gynaec Oncology",
    "Hysterectomy / Uterine Fibroids",
    "Hernia",
    "Colon & Rectum Problems",
    "Weight Loss (Bariatric Surgery)",
    "Kidney, Prostate & Bladder Problems",
    "Urological Cancer",
    "Uterine Fibroids",
    "Thyroid Problem",
    "Lung Problem",
    "GI Cancer"
  ],
  "surgeryAdvised": [
    "Yes",
    "No",
    "Not Sure"
  ],
  "duration": [
    "Less than 1 month",
    "1–6 months",
    "More than 6 months",
    "More than 1 year"
  ],
  "comfortable": [
    "Yes",
    "No"
  ]
};
function doPost(e) {
  const reply = value => ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
  const lock = LockService.getScriptLock();
  try {
    if (!e || !e.postData || e.postData.contents.length > 8192) return reply({ ok: false });
    const data = JSON.parse(e.postData.contents);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return reply({ ok: false });
    if (data.action === 'status') {
      const sheet = SpreadsheetApp.openById('1I6PDYKCnt2Jn3h5WCdaovEcQDuEwXY4hoFQoq81yN7I').getSheetByName(TAB_NAME);
      const headers = sheet && sheet.getRange(1,1,1,HEADERS.length).getValues()[0];
      return reply({ ok: !!headers && HEADERS.every((header,index) => headers[index] === header), publicFormVersion: 1 });
    }
    const properties = PropertiesService.getScriptProperties();
    const token = properties.getProperty('LEAD_WEBHOOK_TOKEN');
    const serverAuthenticated = token && token.length >= 24 && data.token === token;
    if (!serverAuthenticated && (data.token !== undefined || data.source !== 'kmch-landing-page')) return reply({ ok: false });
    if (data.website) return reply({ ok: false });
    if (!/^[6-9]\d{9}$/.test(data.phone || '') || data.consent !== true || String(data.name || '').trim().length < 2 || String(data.name).length > 80 || !/^[a-zA-Z0-9-]{16,80}$/.test(data.requestId || '')) return reply({ ok: false });
    if (['fillingFor','gender','city','concern','surgeryAdvised'].some(key => !SCHEMA[key].includes(data[key]))) return reply({ ok: false });
    if (['duration','comfortable'].some(key => data[key] !== undefined && data[key] !== '' && !SCHEMA[key].includes(data[key]))) return reply({ ok: false });
    lock.waitLock(15000);
    const book = SpreadsheetApp.openById('1I6PDYKCnt2Jn3h5WCdaovEcQDuEwXY4hoFQoq81yN7I');
    let sheet = book.getSheetByName(TAB_NAME);
    if (!sheet) {
      sheet = book.insertSheet(TAB_NAME);
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
      sheet.getRange(1,1,1,HEADERS.length).setBackground('#f0f2f4').setFontColor('#111111').setFontWeight('bold');
      sheet.setColumnWidths(1,HEADERS.length,155);
      sheet.setColumnWidth(4,240);
    }
    const existingHeaders = sheet.getRange(1,1,1,HEADERS.length).getValues()[0];
    if (!HEADERS.every((header,index) => existingHeaders[index] === header)) return reply({ ok: false });
    // A retried request must not produce a duplicate lead after a network timeout.
    if (sheet.getLastRow() > 1 && sheet.getRange(2,18,sheet.getLastRow()-1,1).createTextFinder(data.requestId).matchEntireCell(true).findNext()) return reply({ ok: true });
    // Basic per-number abuse control. Exact retries above remain safe after a timeout.
    const cache = CacheService.getScriptCache();
    const rateKey = 'phone:' + data.phone;
    const count = Number(cache.get(rateKey) || 0);
    if (count >= 3) return reply({ ok: false, error: 'Several requests were received for this number. Please call +91 74188 87411.' });
    const safe = value => {
      const text = String(value || '').slice(0,200);
      return /^[\s]*[=+@-]/.test(text) ? "'" + text : text;
    };
    const c = data.campaign || {};
    sheet.appendRow([new Date(),safe(data.name),safe(data.fillingFor),"'"+data.phone,safe(data.gender),safe(data.city),safe(data.concern),safe(data.surgeryAdvised),safe(data.duration),safe(data.comfortable),'Yes',safe(c.utm_source),safe(c.utm_medium),safe(c.utm_campaign),safe(c.utm_content),safe(c.utm_term),safe(c.gclid),data.requestId,'New']);
    SpreadsheetApp.flush();
    cache.put(rateKey, String(count + 1), 600);
    return reply({ ok: true });
  } catch (error) { return reply({ ok: false }); }
  finally { if (lock.hasLock()) lock.releaseLock(); }
}
