const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];

export function timeAgo(date) {
  const seconds = Math.round((new Date(date).getTime() - Date.now()) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

export function clock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export const elapsedLabel = (from, to) => clock(new Date(to) - new Date(from));

export const appPath = (path) =>
  import.meta.env.VITE_HASH_ROUTER === 'true' ? `${window.location.origin}/#${path}` : `${window.location.origin}${path}`;

export const inviteUrl = (code) => appPath(`/m/${code}`);

export const leetcodeUrl = (slug) => `https://leetcode.com/problems/${slug}/`;

export const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
