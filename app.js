'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const kyivToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
$$('[data-event-date]').forEach(row => { row.hidden = row.dataset.eventDate < kyivToday; });
$('#events-empty').hidden = $$('[data-event-date]').some(row => !row.hidden);

const menu = $('.menu-toggle');
const navigation = $('#navigation');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Відкрити меню'); navigation.classList.remove('open'); }
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню'); navigation.classList.toggle('open', open); });
$$('a', navigation).forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
document.addEventListener('click', e => { if (!e.target.closest('.site-header')) closeMenu(); });
window.matchMedia('(min-width: 801px)').addEventListener('change', e => { if (e.matches) closeMenu(); });

$$('[data-filter]').forEach(button => button.addEventListener('click', () => {
  $$('[data-filter]').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
  const filter = button.dataset.filter;
  let count = 0;
  $$('.format-card').forEach(card => { const show = filter === 'all' || card.dataset.categories.split(' ').includes(filter); card.hidden = !show; if (show) { count++; card.classList.add('visible'); } });
  $('#filter-status').textContent = `Показано форматів: ${count}.`;
}));

const recommendations = {
  first: { title: 'ВІДКРИТА КЛУБНА ГРА', copy: 'Знайомство з грою, інструктаж і командний сценарій. Якщо немає спорядження — запитай про оренду під час запису.', format: 'open' },
  player: { title: 'СЦЕНАРІЙ ДЛЯ ТВОЄЇ КОМАНДИ', copy: 'Обирай недільну гру, CQB або MilSim. Актуальні сценарії, вимоги та дати уточнюй в анонсах клубу.', format: 'milsim' },
  friends: { title: 'ПРИВАТНА ГРА ДЛЯ СВОЇХ', copy: 'Узгодь дату, кількість учасників і побажання. Клуб допоможе зі сценарієм, локацією та орендою спорядження.', format: 'private' }
};
$$('[data-experience]').forEach(button => button.addEventListener('click', () => {
  $$('[data-experience]').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
  const r = recommendations[button.dataset.experience];
  $('#recommend-title').textContent = r.title;
  $('#recommend-copy').textContent = r.copy;
  $('#finder-book').dataset.format = r.format;
}));

const booking = $('#booking-dialog');
const form = $('#booking-form');
const ready = $('#request-ready');
let lastTrigger = null;
let requestText = '';
const now = new Date();
$('#request-date').min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
function showForm() { form.hidden = false; ready.hidden = true; $('#copy-status').textContent = ''; }
$$('[data-book]').forEach(b => b.addEventListener('click', () => {
  lastTrigger = b;
  closeMenu();
  showForm();
  $('#request-format').value = b.dataset.format || 'advice';
  if (b.dataset.format === 'private' && $('#request-players').value === '1') $('#request-players').value = '6';
  booking.showModal();
  document.body.style.overflow = 'hidden';
}));
$$('[data-close]').forEach(b => b.addEventListener('click', () => document.getElementById(b.dataset.close).close()));
$$('dialog').forEach(dialog => {
  dialog.addEventListener('click', e => { if (e.target !== dialog) return; const rect = dialog.getBoundingClientRect(); if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) dialog.close(); });
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; if (lastTrigger) lastTrigger.focus({ preventScroll: true }); });
});
form.addEventListener('submit', e => {
  e.preventDefault();
  if (!form.reportValidity()) return;
  const format = $('#request-format').selectedOptions[0].textContent;
  const dateValue = $('#request-date').value;
  const date = dateValue ? new Date(dateValue + 'T12:00:00').toLocaleDateString('uk-UA') : 'Хочу узгодити';
  const comment = $('#request-comment').value.trim();
  requestText = `Вітаю, Corsairs! Хочу долучитися до гри.\n\nФормат: ${format}\nУчасників: ${$('#request-players').value}\nБажана дата: ${date}\nСпорядження: ${$('#request-gear').value}${comment ? '\n\nПобажання: ' + comment : ''}\n\nПідкажіть, будь ласка, доступні дати, локацію, умови та вартість.`;
  $('#request-preview').textContent = requestText;
  $('#email-request').href = `mailto:info.corsairs@gmail.com?subject=${encodeURIComponent('Запит на гру Corsairs — ' + format)}&body=${encodeURIComponent(requestText)}`;
  form.hidden = true;
  ready.hidden = false;
  $('#copy-request').focus({ preventScroll: true });
});
$('#edit-request').addEventListener('click', () => { showForm(); $('#request-format').focus(); });
$('#copy-request').addEventListener('click', async () => {
  const button = $('#copy-request');
  button.disabled = true;
  $('#copy-status').textContent = 'Копіюємо текст…';
  let timeout;
  try {
    await Promise.race([
      navigator.clipboard.writeText(requestText),
      new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Clipboard permission timeout')), 3000); })
    ]);
    $('#copy-status').textContent = 'Текст скопійовано. Встав його в повідомлення клубу.';
  } catch {
    const range = document.createRange(); range.selectNodeContents($('#request-preview')); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    $('#copy-status').textContent = 'Автоматичне копіювання недоступне. Текст виділено — скопіюй його вручну.';
  } finally {
    clearTimeout(timeout);
    button.disabled = false;
  }
});

const galleryDialog = $('#gallery-dialog');
$$('[data-gallery]').forEach(b => b.addEventListener('click', () => { lastTrigger = b; $('#gallery-full').src = b.dataset.gallery; $('#gallery-full').alt = b.dataset.caption; $('#gallery-caption').textContent = b.dataset.caption; galleryDialog.showModal(); document.body.style.overflow = 'hidden'; }));

if ('IntersectionObserver' in window) {
  if (motion) {
    document.documentElement.classList.add('motion-ready');
    const revealObserver = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); } }); }, { threshold: 0.08 });
    $$('.reveal').forEach(el => revealObserver.observe(el));
  }
  const ctaObserver = new IntersectionObserver(([entry]) => { $('.mobile-cta').classList.toggle('visible', !entry.isIntersecting && entry.boundingClientRect.bottom < 0); }, { threshold: 0 });
  ctaObserver.observe($('.hero'));
}
