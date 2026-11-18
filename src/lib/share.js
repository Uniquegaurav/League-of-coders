// Share links go through /s/* so chat apps and social sites get a proper preview card
// (title, description and a generated image), then people are redirected into the app.
// ?ref=<username> credits the sharer if the visitor signs up.
const origin = () => window.location.origin;
const withRef = (path, user) => (user?.username ? `${path}?ref=${encodeURIComponent(user.username)}` : path);

export const shareUrl = {
  battle: (code, user) => origin() + withRef(`/s/m/${code}`, user),
  result: (code, userId, user) => origin() + withRef(`/s/r/${code}/${userId}`, user),
  profile: (handle, user) => origin() + withRef(`/s/u/${handle}`, user),
  challenge: (code, user) => origin() + withRef(`/s/c/${code}`, user),
  app: (user) => origin() + withRef('/', user),
};

// Direct app links (no server hop). Used for "Copy link" so a sleeping API never delays someone opening it.
export const directUrl = {
  battle: (code, user) => origin() + withRef(`/m/${code}`, user),
  result: (code, user) => origin() + withRef(`/m/${code}`, user),
  profile: (handle, user) => origin() + withRef(`/u/${handle}`, user),
  challenge: (code, user) => origin() + withRef(`/c/${code}`, user),
  app: (user) => origin() + withRef('/', user),
};

export const imageUrl = {
  result: (code, userId) => `${origin()}/og/r/${code}/${userId}.png`,
  profile: (handle) => `${origin()}/og/u/${handle}.png`,
  challenge: (code) => `${origin()}/og/c/${code}.png`,
  battle: (code) => `${origin()}/og/m/${code}.png`,
};

export const profileHandle = (player) => player?.username || player?.id;
