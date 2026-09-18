(() => {
  'use strict';
  if (window.__incantareTrackingContext) return;
  const context = {
    procedure: 'harmonizacao_bumbum', clinic: 'incantare', city: 'joinville',
    source_page: 'harmonizacao-bumbum-incantare-joinville'
  };
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
  const safe = (value, key) => typeof value === 'string'
    && (['fbclid', 'gclid', 'gbraid', 'wbraid'].includes(key)
      ? /^[A-Za-z0-9_.~\-]{1,1024}$/.test(value)
      : value.length <= 200 && /^[\p{L}\p{N} _.,~+\-]+$/u.test(value)
        && !/^(?:\+?55[ .-]?)?(?:\d[ .-]?){10,11}$/.test(value));
  const params = new URLSearchParams(location.search);
  let stored = {};
  try { stored = JSON.parse(sessionStorage.getItem('incantare_bumbum_joinville_attribution') || '{}') || {}; } catch (_) {}
  // A new campaign replaces the old campaign as a unit; never mix their fields.
  if (keys.some(key => params.has(key))) stored = {};
  const attribution = {};
  keys.forEach(key => {
    const value = params.get(key) || stored[key];
    if (safe(value, key)) attribution[key] = value;
  });
  try { sessionStorage.setItem('incantare_bumbum_joinville_attribution', JSON.stringify(attribution)); } catch (_) {}
  // Only campaign parameters are allowed in the URL seen by analytics libraries.
  const clean = new URLSearchParams();
  [...keys, 'gclid', 'gbraid', 'wbraid'].forEach(key => {
    const value = params.get(key);
    if (safe(value, key)) clean.set(key, value);
  });
  const query = clean.toString();
  if (location.search !== (query ? '?' + query : '') || location.hash) {
    history.replaceState(history.state, '', location.pathname + (query ? '?' + query : ''));
  }
  window.__incantareTrackingContext = Object.freeze({ ...context, ...attribution });
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ...window.__incantareTrackingContext });
})();
