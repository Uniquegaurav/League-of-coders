// Minutes per problem in a solo test. Keep in sync with SOLO_MINUTES in the backend match engine.
export const SOLO_MINUTES = { easy: 10, medium: 20, hard: 35 };

export function soloClock({ easy = 0, medium = 0, hard = 0 }) {
  const raw = easy * SOLO_MINUTES.easy + medium * SOLO_MINUTES.medium + hard * SOLO_MINUTES.hard;
  if (!raw) return { raw: 0, minutes: 0, capped: false };
  const minutes = Math.min(180, Math.max(10, raw));
  return { raw, minutes, capped: raw > 180 };
}
