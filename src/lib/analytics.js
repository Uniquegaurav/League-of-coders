// Product analytics through PostHog (free up to 1M events a month).
// Off unless VITE_POSTHOG_KEY is set. The library loads lazily so it never slows the first paint.
// We only send ids, usernames and game numbers. Never names or emails.
const KEY = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

let client = null;
let loading = null;
const queue = [];

function load() {
  if (!KEY || typeof window === 'undefined') return null;
  if (!loading) {
    loading = import('posthog-js')
      .then(({ default: posthog }) => {
        posthog.init(KEY, {
          api_host: HOST,
          capture_pageview: false, // sent from the router so SPA navigation counts
          person_profiles: 'identified_only',
          autocapture: false,
        });
        client = posthog;
        queue.splice(0).forEach((fn) => fn(posthog));
      })
      .catch(() => {});
  }
  return loading;
}

function run(fn) {
  if (!KEY) return;
  if (client) fn(client);
  else {
    queue.push(fn);
    load();
  }
}

export const initAnalytics = () => load();

/** Records a product event, e.g. track('match_finished', { players: 4 }). */
export const track = (event, props = {}) => run((ph) => ph.capture(event, props));

export const pageview = (path) => run((ph) => ph.capture('$pageview', { $current_url: window.location.origin + path }));

export const identify = (user) =>
  user &&
  run((ph) =>
    ph.identify(user.id, {
      username: user.username,
      rating: user.stats?.rating,
      battles: user.stats?.matches,
      leetcode_verified: !!user.leetcode?.verified,
      college: user.college || undefined,
    })
  );

export const resetAnalytics = () => run((ph) => ph.reset());
