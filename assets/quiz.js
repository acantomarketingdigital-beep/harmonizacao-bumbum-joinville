(() => {
  'use strict';
  if (window.__incantareQuizInitialized) return;
  window.__incantareQuizInitialized = true;
  const context = window.__incantareTrackingContext;
  const state = { step: 1, started: false, completed: false, name: '', phone: '', goal: '', time: '' };
  const $ = selector => document.querySelector(selector);
  const digits = value => value.replace(/\D/g, '').slice(0, 11);
  const eventId = () => window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `evt_${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
  const emit = (event, extra = {}) => window.dataLayer.push({
    ...context, step_number: undefined, step_name: undefined, event_id: undefined,
    event, ...extra
  });
  function start() {
    if (state.started) return;
    state.started = true;
    emit('quiz_start');
  }
  function show(id, count, step) {
    state.step = step;
    ['s1', 's2', 's3', 'done'].forEach(key => $('#' + key).classList.toggle('hide', key !== id));
    $('#count').textContent = count;
  }
  function fmt(value) {
    const d = digits(value);
    if (d.length <= 2) return d ? '(' + d : '';
    const split = d.length === 11 ? 7 : 6;
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, split) + (d.length > split ? '-' + d.slice(split) : '');
  }
  document.querySelectorAll('.start').forEach(button => button.addEventListener('click', () => {
    start();
    $('#quiz').scrollIntoView({ behavior: 'smooth' });
  }));
  $('#name').addEventListener('input', start);
  $('#phone').addEventListener('input', event => { start(); event.target.value = fmt(event.target.value); });
  $('#n1').addEventListener('click', () => {
    if (state.step !== 1) return;
    const name = $('#name').value.trim();
    const phone = digits($('#phone').value);
    if (name.length < 2) return alert('Digite seu primeiro nome.');
    if (phone.length < 10) return alert('Digite um WhatsApp válido com DDD.');
    state.name = name;
    state.phone = phone;
    start();
    show('s2', '2 de 3', 2);
    emit('quiz_step', { step_number: 1, step_name: 'identificacao' });
  });
  document.querySelectorAll('[data-goal]').forEach(button => button.addEventListener('click', () => {
    if (state.step !== 2 || !button.dataset.goal) return;
    state.goal = button.dataset.goal;
    show('s3', '3 de 3', 3);
    emit('quiz_step', { step_number: 2, step_name: 'objetivo' });
  }));
  document.querySelectorAll('[data-time]').forEach(button => button.addEventListener('click', () => {
    if (state.step !== 3 || state.completed || !state.name || !state.phone || !state.goal || !button.dataset.time) return;
    state.time = button.dataset.time;
    state.completed = true;
    // No name, phone or individual quiz answers in the outbound URL.
    const message = 'Olá! Concluí o quiz do Mega Evento de Harmonização de Bumbum da Incantare Joinville e gostaria de receber os detalhes da condição de metade do preço.';
    $('#wa').href = 'https://wa.me/5547996650381?text=' + encodeURIComponent(message);
    show('done', 'Concluído', 4);
    emit('quiz_step', { step_number: 3, step_name: 'prazo' });
    emit('lead', { event_id: eventId() });
  }));
  function trackLink(link, eventName, canOpen, extra) {
    let lastClick = -Infinity;
    const handler = event => {
      if (event.type === 'auxclick' && event.button !== 1) return;
      const now = performance.now();
      if (!canOpen() || now - lastClick < 1000) { event.preventDefault(); return; }
      lastClick = now;
      emit(eventName, extra());
      // A separate tab keeps the landing alive long enough to dispatch analytics.
    };
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.addEventListener('click', handler);
    link.addEventListener('auxclick', handler);
  }
  trackLink($('#wa'), 'whatsapp_contact', () => state.completed, () => ({ event_id: eventId() }));
  $('#agency').href = 'https://wa.me/5541998362692?text=' + encodeURIComponent('Olá! Vim pela página do Mega Evento de Harmonização de Bumbum da Incantare Joinville e gostaria de entender como funciona essa estrutura de marketing para clínicas de estética.');
  trackLink($('#agency'), 'agency_footer_click', () => true, () => ({ agency: 'adriano_marketing', cta_position: 'agency_footer' }));
})();
