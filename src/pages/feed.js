// Deduplication of posts published on several networks (X, VK, Telegram) and
// in several languages. konard usually posts the same thought in Russian and in
// English within minutes, and repeats some posts on X and VK, so posts close in
// time are grouped and only one version of every group is shown.

export const WINDOW_MINUTES = 60;
// Posts that share most of their links (two or more) are versions of each
// other even when published hours apart (a long post translated later).
export const LINKS_WINDOW_MINUTES = 6 * 60;
export const SIMILARITY = 0.5;

const URL_RE = /https?:\/\/\S+/g;

/** Lowercase words of a post without links, mentions and punctuation. */
export function words(text = '') {
  return text
    .replace(URL_RE, ' ')
    .replace(/@\w+/g, ' ')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 1);
}

/** Links of a post without protocol and `www.`, used to match translations. */
export function links(text = '') {
  return (text.match(URL_RE) || []).map((u) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/[/.,)]+$/, ''));
}

function jaccard(a, b) {
  const x = new Set(a);
  const y = new Set(b);
  if (!x.size || !y.size) return 0;
  let common = 0;
  x.forEach((w) => y.has(w) && (common += 1));
  return common / (x.size + y.size - common);
}

/** Jaccard similarity of the word sets of two texts (0…1). */
export const similarity = (a, b) => jaccard(words(a), words(b));

const hasText = (p) => words(p.text).length > 0;
const minutes = (a, b) => Math.abs(Date.parse(a.publishedAt) - Date.parse(b.publishedAt)) / 60000;

/**
 * Whether `b` is another version of `a`: published within the time window and
 * either nearly the same text (a cross-post) or a translation (another
 * language with comparable length or a shared link), or sharing most of
 * several links within a longer window.
 */
export function isDuplicate(a, b, { window = WINDOW_MINUTES, linksWindow = LINKS_WINDOW_MINUTES } = {}) {
  if (a.id === b.id || !hasText(a) || !hasText(b)) return false;
  const gap = minutes(a, b);
  const [la, lb] = [links(a.text), links(b.text)];
  if (gap <= linksWindow && Math.min(la.length, lb.length) >= 2 && jaccard(la, lb) >= SIMILARITY) return true;
  if (gap > window) return false;
  if (similarity(a.text, b.text) >= SIMILARITY) return true;
  if (a.lang === b.lang) return false;
  if (la.some((l) => lb.includes(l))) return true;
  const ratio = a.text.length / b.text.length;
  return ratio > 0.4 && ratio < 2.5;
}

/**
 * Groups posts into stories: every story holds the versions of one post (at
 * most one per network and language). Stories are sorted newest first.
 */
export function dedupe(posts, options) {
  const sorted = [...posts].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
  const stories = [];
  sorted.forEach((post) => {
    const story = stories.find(
      (s) =>
        !s.posts.some((p) => p.network === post.network && p.lang === post.lang) &&
        s.posts.some((p) => isDuplicate(p, post, options)),
    );
    if (story) story.posts.push(post);
    else stories.push({ id: post.id, posts: [post] });
  });
  return stories.reverse();
}

// Which version to show: X for English readers, VK for Russian readers.
const PREFERENCE = {
  en: ['x:en', 'vk:en', 'telegram:en', 'x:', 'vk:', 'telegram:'],
  ru: ['vk:ru', 'telegram:ru', 'x:ru', 'vk:', 'telegram:', 'x:'],
};

/** The version of a story for a reader of `lang` ('en' or 'ru'). */
export function pick(story, lang) {
  const order = PREFERENCE[lang] || PREFERENCE.en;
  const rank = (p) => {
    const exact = order.indexOf(`${p.network}:${p.lang}`);
    if (exact >= 0) return exact;
    const network = order.indexOf(`${p.network}:`);
    return network >= 0 ? network : order.length;
  };
  return [...story.posts].sort((a, b) => rank(a) - rank(b))[0];
}

/** 'ru' when the browser prefers Russian (or a close language), otherwise 'en'. */
export function readerLanguage(nav = typeof navigator === 'undefined' ? null : navigator) {
  const list = nav ? [...(nav.languages || []), nav.language].filter(Boolean) : [];
  const first = (list[0] || 'en').toLowerCase();
  return /^(ru|be|uk|kk)\b/.test(first) ? 'ru' : 'en';
}

/** Whether a story should be listed for a reader of `lang`: stories without text are shown to everyone. */
export const visibleFor = (story, lang) => story.posts.some((p) => p.lang === lang || !hasText(p));
