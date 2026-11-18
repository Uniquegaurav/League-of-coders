// Shared links carry ?ref=<username>. We keep it for 30 days so a sign-up later still credits the sharer.
const KEY = 'loc.ref';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const REF_RE = /^[a-z0-9][a-z0-9_-]{2,29}$/i;

/** Saves ?ref= from the URL. Returns true when one was found (the caller can then tidy the URL). */
export function captureReferral(search) {
  const ref = new URLSearchParams(search).get('ref');
  if (!ref || !REF_RE.test(ref)) return false;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ref: ref.toLowerCase(), at: Date.now() }));
  } catch {
    /* storage blocked: the referral is simply not credited */
  }
  return true;
}

export function storedReferral() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && Date.now() - saved.at < TTL_MS) return saved.ref;
  } catch {
    /* ignore */
  }
  return undefined;
}

export function clearReferral() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
