import http from 'node:http';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const endpoint = process.env.GOOGLE_APPS_SCRIPT_URL || '';
const token = process.env.LEAD_WEBHOOK_TOKEN || '';
const enabled = /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(endpoint) && token.length >= 24;
const schema = JSON.parse(readFileSync(path.join(root, 'form-schema.json'), 'utf8'));
const requiredChoices = ['fillingFor', 'gender', 'city', 'concern', 'surgeryAdvised'];
const optionalChoices = ['duration', 'comfortable'];
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.ttf': 'font/ttf' };
// Authorize the exact GTM and Analytics bootstraps without allowing arbitrary inline scripts.
const tagHashes = [...readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(([, code]) => "'sha256-" + createHash('sha256').update(code).digest('base64') + "'").join(' ');
const rates = new Map();
setInterval(() => { const now = Date.now(); for (const [key, value] of rates) if (value.until < now) rates.delete(key); }, 60000).unref();
function json(res, status, value) { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); }

export function validateLead(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const phone = typeof data.phone === 'string' ? data.phone.replace(/\s/g, '') : '';
  if (name.length < 2 || name.length > 80 || !/^[6-9]\d{9}$/.test(phone) || data.consent !== true || !/^[a-zA-Z0-9-]{16,80}$/.test(data.requestId || '')) return null;
  if (requiredChoices.some(key => !schema[key].includes(data[key]))) return null;
  if (optionalChoices.some(key => data[key] !== undefined && data[key] !== '' && !schema[key].includes(data[key]))) return null;
  return { name, phone, ...Object.fromEntries([...requiredChoices, ...optionalChoices].map(key => [key, data[key] || ''])), consent: true, requestId: data.requestId,
    campaign: Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid'].map(key => [key, String(data.campaign?.[key] || '').slice(0, 200)])) };
}

export const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', `default-src 'self'; img-src 'self' https://*.googletagmanager.com https://*.google-analytics.com; font-src 'self'; script-src 'self' ${tagHashes} https://www.googletagmanager.com; style-src 'self'; connect-src 'self' https://*.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com; frame-src https://www.googletagmanager.com; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`);
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/config' && req.method === 'GET') return json(res, 200, { leadCaptureEnabled: enabled });
    if (url.pathname === '/api/leads' && req.method === 'POST') {
      if (!enabled) return json(res, 503, { error: 'Online requests are not available yet. Please call +91 74188 87411.' });
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return json(res, 403, { error: 'Please submit from the camp website.' });
      const key = req.socket.remoteAddress;
      const rate = rates.get(key) || { count: 0, until: Date.now() + 600000 };
      if (rate.until < Date.now()) { rate.count = 0; rate.until = Date.now() + 600000; }
      if (++rate.count > 10) return json(res, 429, { error: 'Too many requests. Please call our camp team.' });
      rates.set(key, rate);
      let raw = '';
      for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 8192) return json(res, 413, { error: 'Request too large.' }); }
      let data; try { data = JSON.parse(raw); } catch { return json(res, 400, { error: 'Invalid request.' }); }
      if (!data || typeof data !== 'object' || Array.isArray(data)) return json(res, 400, { error: 'Invalid request.' });
      if (data.website) return json(res, 400, { error: 'Unable to process this request.' });
      const lead = validateLead(data);
      if (!lead) return json(res, 400, { error: 'Please complete all required fields and check your mobile number and consent.' });
      const upstream = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...lead, token }), signal: AbortSignal.timeout(20000) });
      const result = await upstream.json();
      if (!upstream.ok || result.ok !== true) throw new Error('Sheet did not confirm lead');
      return json(res, 200, { ok: true });
    }
    if (!['GET','HEAD'].includes(req.method)) return json(res, 405, { error: 'Method not allowed.' });
    // Only public website files are served; campaign briefs and integration credentials stay private.
    const pathname = decodeURIComponent(url.pathname);
    if (!(pathname === '/' || ['/index.html','/styles.css','/script.js'].includes(pathname) || /^\/assets\/[a-zA-Z0-9_-]+\.(png|webp|ttf|css)$/.test(pathname))) return json(res, 404, { error: 'Not found.' });
    const filename = path.join(root, pathname === '/' ? 'index.html' : pathname.slice(1));
    const body = await readFile(filename);
    res.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=86400' : 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) {
    if (error.code === 'ENOENT') return json(res, 404, { error: 'Not found.' });
    return json(res, 502, { error: 'We could not confirm your request. Please try again or call +91 74188 87411.' });
  }
});
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  server.listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => console.log(`KMCH preview: http://localhost:${process.env.PORT || 3000}`));
}
