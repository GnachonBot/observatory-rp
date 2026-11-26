/*
 * OBSERVATORY // LIVE BUILD DETECTOR
 * Checks only this site's published index.html. No user data or external
 * network service is involved. Visitors choose whether to refresh.
 */
(() => {
  'use strict';
  const installed = document.querySelector('meta[name="observatory-release"]')?.getAttribute('content');
  const notice = document.getElementById('siteUpdateNotice');
  const refresh = document.getElementById('applySiteUpdate');
  const dismiss = document.getElementById('dismissSiteUpdate');
  if (!installed || !notice || !refresh || !dismiss || !window.fetch) return;

  let latest = null;
  let dismissedRelease = null;
  let checking = false;

  async function checkVersion() {
    if (checking || document.hidden || (navigator.onLine === false)) return;
    checking = true;
    try {
      // Fetch an uncached copy of the *published* page, not GitHub's latest
      // commit, so the notice appears only after Pages serves the new build.
      const url = new URL('./index.html', window.location.href);
      url.searchParams.set('observatory_version_check', String(Date.now()));
      const response = await fetch(url.href, { cache: 'no-store' });
      if (!response.ok) return;
      const html = await response.text();
      const remotePage = new DOMParser().parseFromString(html, 'text/html');
      const published = remotePage.querySelector('meta[name="observatory-release"]')?.getAttribute('content')?.trim();
      if (!published) return;
      if (published === installed) {
        notice.classList.add('hidden');
        return;
      }
      latest = published;
      if (dismissedRelease !== published) notice.classList.remove('hidden');
    } catch (_) {
      // Offline clients keep working; the next foreground check will retry.
    } finally {
      checking = false;
    }
  }

  refresh.addEventListener('click', () => {
    const url = new URL(window.location.href);
    url.searchParams.set('observatory_refresh', latest || String(Date.now()));
    window.location.assign(url.href);
  });
  dismiss.addEventListener('click', () => {
    dismissedRelease = latest;
    notice.classList.add('hidden');
  });

  window.setInterval(checkVersion, 60000);
  window.setTimeout(checkVersion, 12000);
  window.addEventListener('focus', checkVersion);
  window.addEventListener('online', checkVersion);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkVersion();
  });
})();
