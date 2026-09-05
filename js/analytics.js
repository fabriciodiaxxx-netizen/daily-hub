(() => {
  const config = window.DAILY_HUB_CONFIG || {};
  const endpoint = config.ANALYTICS_ENDPOINT;
  const apiKey = config.SUPABASE_PUBLISHABLE_KEY;
  if (!endpoint || !apiKey || !window.fetch) return;

  // No cookie, local-storage identifier, task data, referrer, or query string is sent.
  const path = window.location.pathname;
  window.setTimeout(() => {
    fetch(endpoint, {
      method: "POST", mode: "cors", credentials: "omit", keepalive: true,
      headers: { "Content-Type": "application/json", "apikey": apiKey },
      body: JSON.stringify({ path }),
    }).catch(() => { /* Analytics must never affect the app. */ });
  }, 0);
})();
