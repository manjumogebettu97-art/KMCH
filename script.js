const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
  mobileNav.hidden = true;
}
menuToggle.addEventListener('click', () => {
  const opening = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(opening));
  menuToggle.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
  mobileNav.hidden = !opening;
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuToggle.focus(); }
});
window.matchMedia('(min-width: 1051px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});

const dialog = document.querySelector('#consultation-modal');
const leadForm = document.querySelector('#lead-form');
const steps = [...document.querySelectorAll('.form-step')];
const progress = [...document.querySelectorAll('.form-progress li')];
const title = document.querySelector('#modal-title');
const description = document.querySelector('#step-description');
const nextButton = document.querySelector('.next-step');
const backButton = document.querySelector('.back-step');
const submitButton = document.querySelector('.submit-lead');
const formStatus = document.querySelector('#form-status');
const notice = document.querySelector('#connection-notice');
let step = 0;
let leadCaptureEnabled = false;
let requestId = '';
let submitting = false;
let completed = false;
let opener;
const titles = ['Let’s get to know you.', 'Tell us about your health.', 'One last step.'];

function showStep(index, focus = true) {
  step = index;
  steps.forEach((panel, i) => { panel.hidden = i !== step; panel.disabled = i !== step; });
  progress.forEach((item, i) => {
    if (i === step) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
    item.classList.toggle('complete', i < step);
  });
  title.textContent = titles[step];
  description.textContent = `Step ${step + 1} of 3 · Fields marked * are required.`;
  document.querySelector('.step-counter').textContent = `${step + 1} / 3`;
  backButton.hidden = step === 0;
  nextButton.hidden = step === 2;
  submitButton.hidden = step !== 2;
  submitButton.disabled = !leadCaptureEnabled;
  formStatus.textContent = '';
  if (focus) { title.focus({ preventScroll: true }); document.querySelector('.modal-main').scrollTop = 0; }
}
function openForm(event) {
  event.preventDefault();
  opener = event.currentTarget;
  closeMenu();
  if (completed) {
    completed = false;
    document.querySelector('#form-content').hidden = false;
    document.querySelector('#form-success').hidden = true;
    showStep(0, false);
  }
  dialog.showModal();
  document.body.classList.add('modal-open');
  title.focus({ preventScroll: true });
}
document.querySelectorAll('a[href="#appointment"]').forEach(link => {
  link.setAttribute('aria-haspopup', 'dialog');
  link.setAttribute('aria-controls', 'consultation-modal');
  link.addEventListener('click', openForm);
});
document.querySelector('.modal-close').addEventListener('click', () => dialog.close());
document.querySelector('.done-button').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
});
dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); opener?.focus({ preventScroll: true }); });
backButton.addEventListener('click', () => { if (!submitting) showStep(step - 1); });
leadForm.addEventListener('input', () => { if (!submitting) requestId = ''; });
fetch('api/config').then(response => response.ok ? response.json() : null).then(config => {
  leadCaptureEnabled = config?.leadCaptureEnabled === true;
  submitButton.disabled = !leadCaptureEnabled;
  notice.hidden = leadCaptureEnabled;
}).catch(() => {});

function validateStep() {
  const invalid = [...steps[step].querySelectorAll('input, select')].find(input => !input.checkValidity());
  if (invalid) { invalid.reportValidity(); return false; }
  return true;
}
leadForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting || !validateStep()) return;
  if (step < 2) { showStep(step + 1); return; }
  if (!leadCaptureEnabled) return;
  // Read every step, including inactive fieldsets, without losing earlier answers.
  const value = name => {
    const fields = [...leadForm.querySelectorAll(`[name="${name}"]`)];
    return fields[0]?.type === 'radio' ? fields.find(field => field.checked)?.value || '' : fields[0]?.value.trim() || '';
  };
  requestId ||= crypto.randomUUID();
  const parameters = new URLSearchParams(location.search);
  const payload = Object.fromEntries(['name','phone','fillingFor','gender','city','concern','surgeryAdvised','duration','comfortable','website'].map(name => [name, value(name)]));
  payload.consent = leadForm.querySelector('[name="consent"]').checked;
  payload.requestId = requestId;
  payload.campaign = Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid'].map(key => [key, parameters.get(key) || '']));
  submitting = true;
  steps[step].disabled = true;
  submitButton.disabled = true;
  backButton.disabled = true;
  formStatus.textContent = 'Sending your request…';
  formStatus.classList.remove('error');
  try {
    const response = await fetch('api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(25000) });
    const result = await response.json();
    if (!response.ok || result.ok !== true) throw new Error(result.error || 'Your request could not be confirmed. Please call +91 74188 87411.');
    leadForm.reset(); requestId = ''; completed = true;
    document.querySelector('#form-content').hidden = true;
    document.querySelector('#form-success').hidden = false;
    if (dialog.open) document.querySelector('#success-title').focus({ preventScroll: true });
  } catch (error) {
    formStatus.textContent = error.name === 'TimeoutError' ? 'We could not confirm your request. Please retry or call +91 74188 87411.' : error.message;
    formStatus.classList.add('error');
  } finally {
    submitting = false; steps[step].disabled = false; submitButton.disabled = !leadCaptureEnabled; backButton.disabled = false;
  }
});

// Readable content stays visible with JavaScript disabled or reduced motion enabled.
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.section-heading, .specialty-card, .visit-copy, .section-intro, .benefit-intro').forEach(el => {
    el.classList.add('reveal'); observer.observe(el);
  });
}
