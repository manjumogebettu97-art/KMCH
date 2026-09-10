import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { server, validateLead } from '../server.mjs';
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
after(() => new Promise(resolve => server.close(resolve)));
const lead = { name: 'Test Visitor', phone: '9000000000', consent: true, fillingFor: 'Myself', gender: 'Male', city: 'Coimbatore', concern: 'Hernia', surgeryAdvised: 'Yes', duration: '', comfortable: '', requestId: '11111111-1111-4111-8111-111111111111' };
test('validates all seven required answers and valid optional choices before sending a lead', () => {
  assert.ok(validateLead(lead));
  assert.equal(validateLead(null), null);
  assert.ok(validateLead({ ...lead, duration: 'More than 1 year', comfortable: 'No' }));
  for (const invalid of [{ phone: '123' }, { consent: false }, { name: 'A' }, { concern: 'Unknown' }, { fillingFor: '' }, { gender: '' }, { city: '' }, { surgeryAdvised: '' }, { duration: 'Invalid' }, { comfortable: 'Maybe' }, { requestId: '' }]) assert.equal(validateLead({ ...lead, ...invalid }), null);
});
test('serves the landing page and keeps source documents and integration private', async () => {
  assert.equal((await fetch(base)).status, 200);
  for (const file of ['/server.mjs','/.env','/integration/Code.gs','/KMCH%20Camp%20brief%20for%20landing%20page.docx']) assert.equal((await fetch(base + file)).status, 404);
});
test('unconnected form never falsely confirms an enquiry', async () => {
  assert.deepEqual(await (await fetch(base + '/api/config')).json(), { leadCaptureEnabled: false });
  const response = await fetch(base + '/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).ok, undefined);
});
