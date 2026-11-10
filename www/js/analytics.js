/* ═══════════════════════════════════════════════════════════════════
   SWINGERSPHERE — ANALYTICS & EVENT TRACKING ENGINE v2.0
   Seguimiento de visitas, registros, conversiones y privacidad conforme a RGPD
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

window.Analytics = (function() {
  var _apiHost = '';

  function _getApiHost() {
    if (window.location.protocol.startsWith('http')) {
      return '';
    }
    return 'https://swingersphere.vercel.app';
  }

  function _hasConsent() {
    var consent = localStorage.getItem('ss_cookies_consent');
    return consent === 'all';
  }

  function trackEvent(eventName, details) {
    try {
      var payload = {
        event: eventName,
        details: details || {},
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      console.log('📊 [Analytics Track]:', eventName, details);

      // 1. Send to Telegram & Notification API Endpoint (Internal, essential)
      fetch(_getApiHost() + '/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function(e) { /* silent warning */ });

      // 2. Save to Cloud Database Endpoint
      fetch(_getApiHost() + '/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'events', record: payload })
      }).catch(function(e) { /* silent warning */ });

      // 3. Dispatch to Google Analytics (gtag) if installed and user granted consent
      if (_hasConsent() && typeof window.gtag === 'function') {
        window.gtag('event', eventName, details);
      }

    } catch (err) {
      console.error('Analytics error:', err);
    }
  }

  function trackPageview(pageName) {
    trackEvent('pageview', { page: pageName || window.location.pathname });
  }

  // Auto-track initial pageview on load
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(function() { trackPageview(); }, 800);
  } else {
    window.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() { trackPageview(); }, 800);
    });
  }

  return {
    trackEvent: trackEvent,
    trackPageview: trackPageview
  };
})();
