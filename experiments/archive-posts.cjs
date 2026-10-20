#!/usr/bin/env node
// Archives konard's public posts from X, Telegram channels and VK walls into a
// normalized JSON file, so the blog can render them even if the originals (and
// their embeds) disappear. No dependencies; requires Node 22+ (global fetch).
//
// Usage:
//   node experiments/archive-posts.cjs [options]
//
// Options (all optional):
//   --out=<file>            output JSON (default docs/case-studies/issue-7/data/posts.json; the
//                           same file is also copied to src/data/posts.json for the blog page)
//   --urls=<file>           extra post URLs, one per line (default .../data/post-urls.txt)
//   --vk=<a,b>              VK walls to crawl by screen name (default konard)
//   --vk-limit=<n>          newest own posts to archive per VK wall (default 40)
//   --telegram=<a,b>        public Telegram channels to crawl via t.me/s/<name> (default none:
//                           t.me/drakonard is a personal account, not a channel)
//   --telegram-limit=<n>    newest posts per Telegram channel (default 100)
//   --no-discover           only fetch URLs from --urls, skip wall/channel crawling
//   --media-only            fetch nothing new, only download the media of the archived posts
//
// Sources and why:
//   X:        https://cdn.syndication.twimg.com/tweet-result?id=<id>&token=x (public JSON used by
//             the official embed widget); falls back to publish.x.com/oembed. The profile timeline is
//             not public (syndication timeline returns zero entries without login), so tweet IDs
//             must be listed in post-urls.txt.
//   Telegram: https://t.me/s/<channel> (public HTML preview, paginated with ?before=<id>) and
//             https://t.me/<channel>/<id>?embed=1&mode=tme for single posts.
//   VK:       m.vk.com/vk.com serve server-rendered wall HTML only to search-engine crawlers
//             (regular browsers get a JS challenge, the API needs a token), so a crawler UA is used.
//             Listing: https://m.vk.com/wall<owner>?own=1&offset=<n>; each post page carries a
//             schema.org SocialMediaPosting (exact datePublished) and the full post text.
//
// The archive is append-only: posts that can no longer be fetched are kept. `archivedAt` is the
// first time a post was stored, `updatedAt` the last time its content changed, `unavailableAt` is
// set when the network explicitly reports the post as gone.
//
// Pictures (photos and video posters) are downloaded to public/archive/media/<post>-<n>.<ext> and
// stored as `file` / `posterFile`, because CDN links of deleted posts stop working too. The names
// depend on the post and position only: VK signs its image URLs anew on every fetch.
'use strict';
const fs = require('fs');
const path = require('path');

const DATA = 'docs/case-studies/issue-7/data';
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);
const OUT = args.out || path.join(DATA, 'posts.json');
// The blog page (src/pages/BlogPage.jsx) renders this copy.
const SITE_COPY = args.out ? null : 'src/data/posts.json';
const URLS = args.urls || path.join(DATA, 'post-urls.txt');
const list = (v, d) =>
  v === undefined
    ? d
    : v === true || v === ''
      ? []
      : String(v)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
const VK_WALLS = list(args.vk, ['konard']);
const VK_LIMIT = Number(args['vk-limit'] || 40);
const TG_CHANNELS = list(args.telegram, []);
const TG_LIMIT = Number(args['telegram-limit'] || 100);
const DISCOVER = !args['no-discover'] && !args['media-only'];
const FETCH = !args['media-only'];
const MEDIA_DIR = 'public/archive/media';
const MEDIA_URL = '/archive/media';

const BROWSER_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const CRAWLER_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.error(...a);

async function get(url, { ua = BROWSER_UA, json = false, tries = 3 } = {}) {
  for (let i = 1; ; i++) {
    let res;
    try {
      res = await fetch(url, {
        headers: { 'user-agent': ua, 'accept-language': 'ru,en;q=0.8' },
        redirect: 'follow',
        signal: AbortSignal.timeout(30000),
      });
    } catch (e) {
      if (i >= tries) return { status: 0, error: String(e) };
      await sleep(1000 * i);
      continue;
    }
    if ((res.status === 429 || res.status >= 500) && i < tries) {
      await sleep(2000 * i);
      continue;
    }
    const body = await res.text();
    if (!json) return { status: res.status, url: res.url, body };
    try {
      return { status: res.status, url: res.url, body: JSON.parse(body) };
    } catch {
      return { status: res.status, url: res.url, body: null, raw: body.slice(0, 200) };
    }
  }
}

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

async function download(url, base) {
  const known = fs.existsSync(MEDIA_DIR) && fs.readdirSync(MEDIA_DIR).find((f) => f.startsWith(`${base}.`));
  if (known) return `${MEDIA_URL}/${known}`;
  // The VK CDN serves some pictures only to the crawler that received the page.
  for (const ua of [BROWSER_UA, CRAWLER_UA]) {
    for (let i = 1; i <= 3; i++) {
      try {
        const res = await fetch(url, { headers: { 'user-agent': ua }, signal: AbortSignal.timeout(30000) });
        const ext = EXT[(res.headers.get('content-type') || '').split(';')[0]];
        if (!res.ok || !ext) break;
        fs.mkdirSync(MEDIA_DIR, { recursive: true });
        fs.writeFileSync(path.join(MEDIA_DIR, `${base}.${ext}`), Buffer.from(await res.arrayBuffer()));
        return `${MEDIA_URL}/${base}.${ext}`;
      } catch {
        await sleep(1000 * i);
      }
    }
  }
  return null;
}

// Adds local copies of the pictures of a post; keeps the copies of earlier runs.
async function archiveMedia(post, prev) {
  const media = [];
  for (const [i, m] of post.media.entries()) {
    const old = prev?.media?.[i];
    const base = `${post.id.replace(/[^\w-]+/g, '-')}-${i + 1}`;
    const copy = { ...m };
    if (m.type === 'photo') copy.file = (await download(m.url, base)) || old?.file;
    if (m.poster) copy.posterFile = (await download(m.poster, `${base}-poster`)) || old?.posterFile;
    for (const k of ['file', 'posterFile']) if (!copy[k]) delete copy[k];
    delete copy.fileError;
    if ((m.type === 'photo' && !copy.file) || (m.poster && !copy.posterFile))
      copy.fileError = `not downloadable on ${new Date().toISOString().slice(0, 10)} (the CDN returned no image)`;
    media.push(copy);
  }
  return { ...post, media };
}

// ---------- HTML helpers ----------
const VOID = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);
const ALLOWED = new Set(['a', 'b', 'strong', 'i', 'em', 'u', 's', 'code', 'pre', 'br', 'p', 'blockquote']);
const ALIAS = { del: 's', strike: 's', ins: 'u', 'tg-spoiler': null };
const DROP_CONTENT = new Set(['script', 'style', 'svg', 'template', 'noscript', 'button']);
const TAG_RE =
  /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/g;

function attr(attrs, name) {
  const m = (attrs || '').match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? decodeEntities(m[1] ?? m[2] ?? m[3]) : null;
}

const NAMED = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  laquo: '«',
  raquo: '»',
  mdash: '—',
  ndash: '–',
  hellip: '…',
};
function decodeEntities(s) {
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const cp = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try {
        return String.fromCodePoint(cp);
      } catch {
        return m;
      }
    }
    return NAMED[e.toLowerCase()] ?? m;
  });
}
const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Returns the outer HTML of the element whose start tag begins at `start`.
function outerElement(html, start) {
  TAG_RE.lastIndex = start;
  let depth = 0;
  let m;
  while ((m = TAG_RE.exec(html))) {
    if (m[0].startsWith('<!--')) continue;
    const name = m[2].toLowerCase();
    if (VOID.has(name) || m[4]) {
      if (depth === 0) return html.slice(start, TAG_RE.lastIndex);
      continue;
    }
    depth += m[1] ? -1 : 1;
    if (depth === 0) return html.slice(start, TAG_RE.lastIndex);
  }
  return html.slice(start);
}
function innerOf(outer) {
  const a = outer.indexOf('>') + 1;
  const b = outer.lastIndexOf('</');
  return b > a ? outer.slice(a, b) : '';
}
function findElements(html, needle) {
  const out = [];
  let i = 0;
  while ((i = html.indexOf(needle, i)) !== -1) {
    const s = html.lastIndexOf('<', i);
    out.push(outerElement(html, s));
    i += needle.length;
  }
  return out;
}

// Keeps only formatting tags; links keep a safe absolute href only. Output is balanced.
function sanitize(html, { resolveHref = (h) => h } = {}) {
  let out = '';
  const stack = []; // [name, keptName|null]
  let dropDepth = 0;
  let last = 0;
  TAG_RE.lastIndex = 0;
  let m;
  const text = (t) => {
    if (!dropDepth) out += t.replace(/[<>]/g, (c) => (c === '<' ? '&lt;' : '&gt;'));
  };
  while ((m = TAG_RE.exec(html))) {
    text(html.slice(last, m.index));
    last = TAG_RE.lastIndex;
    if (m[0].startsWith('<!--')) continue;
    const [, close, rawName, attrs, selfClose] = m;
    const name = rawName.toLowerCase();
    if (close) {
      const idx = stack.map((x) => x[0]).lastIndexOf(name);
      if (idx === -1) continue;
      while (stack.length > idx) {
        const [n, kept] = stack.pop();
        if (DROP_CONTENT.has(n)) dropDepth--;
        else if (kept && !dropDepth) out += `</${kept}>`;
      }
      continue;
    }
    if (VOID.has(name) || selfClose) {
      if (name === 'br' && !dropDepth) out += '<br>';
      continue;
    }
    if (DROP_CONTENT.has(name)) {
      stack.push([name, null]);
      dropDepth++;
      continue;
    }
    let kept = name in ALIAS ? ALIAS[name] : ALLOWED.has(name) ? name : null;
    if (kept === 'i' && /\bemoji\b/.test(attr(attrs, 'class') || '')) kept = null;
    if (kept === 'b' && stack.some((x) => x[0] === 'i' && x[1] === null)) kept = null; // emoji <i><b>
    let open = kept ? `<${kept}>` : '';
    if (kept === 'a') {
      const href = resolveHref(attr(attrs, 'href') || '');
      if (/^https?:\/\//i.test(href)) open = `<a href="${escapeHtml(href)}">`;
      else ((kept = null), (open = ''));
    }
    stack.push([name, kept]);
    if (!dropDepth) out += open;
  }
  text(html.slice(last));
  while (stack.length) {
    const [n, kept] = stack.pop();
    if (!DROP_CONTENT.has(n) && kept) out += `</${kept}>`;
  }
  return out
    .replace(/[ \t]*<br>[ \t]*/g, '<br>')
    .replace(/(\s*<br>\s*){3,}/g, '<br><br>')
    .replace(/^(\s|<br>)+|(\s|<br>)+$/g, '');
}

function htmlToText(html) {
  return decodeEntities(
    html
      // Links shortened for display ("github.com/link-found...") become their full URL in plain text.
      .replace(/<a href="([^"]+)">[^<]*?(?:\.\.\.|…)<\/a>/g, (m, href) => href)
      .replace(/<br>/g, '\n')
      .replace(/<\/(p|blockquote|pre)>/g, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function detectLang(text, fallback = 'en') {
  const cyr = (text.match(/[Ѐ-ӿ]/g) || []).length;
  const lat = (text.match(/[A-Za-z]/g) || []).length;
  if (cyr + lat === 0) return fallback;
  return cyr / (cyr + lat) >= 0.3 ? 'ru' : 'en';
}

// ---------- X ----------
async function fetchTweet(id) {
  const r = await get(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&token=x&lang=en`, { json: true });
  const t = r.body;
  if (r.status === 404 || t?.__typename === 'TweetTombstone') return { gone: true };
  if (r.status === 200 && t?.id_str) return { post: normalizeTweet(t) };
  // Fallback: oEmbed blockquote (text + date only).
  const o = await get(
    `https://publish.x.com/oembed?url=${encodeURIComponent(`https://x.com/i/status/${id}`)}&omit_script=1&dnt=1`,
    { json: true },
  );
  if (o.status === 404) return { gone: true };
  if (o.status !== 200 || !o.body?.html) return { error: `tweet-result ${r.status}, oembed ${o.status}` };
  const bq = o.body.html;
  const p = (bq.match(/<p[^>]*>([\s\S]*?)<\/p>/) || [])[1] || '';
  const html = sanitize(p);
  const text = htmlToText(html);
  const dateText = (bq.match(/<a [^>]*>([^<]*)<\/a><\/blockquote>/) || [])[1];
  const screen = (o.body.author_url || '').split('/').pop();
  return {
    post: {
      id: `x:${id}`,
      network: 'x',
      url: `https://x.com/${screen}/status/${id}`,
      author: { name: o.body.author_name, handle: screen, url: o.body.author_url },
      publishedAt: dateText ? new Date(dateText).toISOString() : null,
      lang: detectLang(text),
      text,
      html,
      media: [],
      embed: { type: 'x', id },
    },
  };
}

function normalizeTweet(t) {
  const cps = Array.from(t.text); // indices are in code points
  const [from, to] = t.display_text_range || [0, cps.length];
  const ents = [];
  const e = t.entities || {};
  for (const u of e.urls || [])
    ents.push({
      s: u.indices[0],
      e: u.indices[1],
      html: `<a href="${escapeHtml(u.expanded_url)}">${escapeHtml(u.display_url)}</a>`,
    });
  for (const u of e.user_mentions || [])
    ents.push({
      s: u.indices[0],
      e: u.indices[1],
      html: `<a href="https://x.com/${u.screen_name}">@${escapeHtml(u.screen_name)}</a>`,
    });
  for (const h of e.hashtags || [])
    ents.push({
      s: h.indices[0],
      e: h.indices[1],
      html: `<a href="https://x.com/hashtag/${encodeURIComponent(h.text)}">#${escapeHtml(h.text)}</a>`,
    });
  for (const h of e.symbols || [])
    ents.push({
      s: h.indices[0],
      e: h.indices[1],
      html: `<a href="https://x.com/search?q=%24${encodeURIComponent(h.text)}">$${escapeHtml(h.text)}</a>`,
    });
  for (const m of e.media || []) ents.push({ s: m.indices[0], e: m.indices[1], html: '' });
  ents.sort((a, b) => a.s - b.s);
  // Leading reply mentions (before display_text_range start) are dropped, as on x.com.
  let html = '';
  let pos = from;
  for (const en of ents) {
    if (en.e <= from || en.s >= to) continue;
    if (en.s > pos) html += escapeHtml(decodeEntities(cps.slice(pos, en.s).join('')));
    html += en.html;
    pos = Math.max(pos, en.e);
  }
  if (pos < to) html += escapeHtml(decodeEntities(cps.slice(pos, to).join('')));
  html = html.trim().replace(/\n/g, '<br>');
  const media = [];
  for (const m of t.mediaDetails || []) {
    if (m.type === 'photo') media.push({ type: 'photo', url: m.media_url_https, alt: m.ext_alt_text || '' });
    else {
      const best = (m.video_info?.variants || [])
        .filter((v) => v.content_type === 'video/mp4')
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
      media.push({
        type: m.type === 'animated_gif' ? 'gif' : 'video',
        url: best?.url || m.expanded_url,
        poster: m.media_url_https,
        alt: m.ext_alt_text || '',
      });
    }
  }
  const text = htmlToText(html);
  const post = {
    id: `x:${t.id_str}`,
    network: 'x',
    url: `https://x.com/${t.user.screen_name}/status/${t.id_str}`,
    author: { name: t.user.name, handle: t.user.screen_name, url: `https://x.com/${t.user.screen_name}` },
    publishedAt: new Date(t.created_at).toISOString(),
    lang: t.lang === 'ru' ? 'ru' : t.lang === 'en' ? 'en' : detectLang(text),
    text,
    html,
    media,
    embed: { type: 'x', id: t.id_str },
  };
  if (t.in_reply_to_status_id_str || t.in_reply_to_screen_name)
    post.inReplyTo = t.in_reply_to_status_id_str
      ? `https://x.com/${t.in_reply_to_screen_name}/status/${t.in_reply_to_status_id_str}`
      : `https://x.com/${t.in_reply_to_screen_name}`;
  if (t.quoted_tweet?.id_str)
    post.quoted = `https://x.com/${t.quoted_tweet.user?.screen_name || 'i'}/status/${t.quoted_tweet.id_str}`;
  return post;
}

// ---------- Telegram ----------
function parseTelegramMessages(html) {
  const posts = [];
  for (const el of findElements(html, 'class="tgme_widget_message ')) {
    const dataPost = attr(el.slice(0, el.indexOf('>')), 'data-post');
    if (!dataPost) continue;
    const [channel, msgId] = dataPost.split('/');
    const textEl = findElements(el, 'class="tgme_widget_message_text')[0];
    const body = sanitize(textEl ? innerOf(textEl) : '');
    const time = (el.match(/<time[^>]*datetime="([^"]+)"/) || [])[1];
    const owner = findElements(el, 'class="tgme_widget_message_owner_name')[0];
    const media = [];
    for (const m of el.matchAll(
      /class="tgme_widget_message_(photo_wrap|video_thumb)[^"]*"[^>]*background-image:url\('([^']+)'\)/g,
    )) {
      media.push({ type: m[1] === 'photo_wrap' ? 'photo' : 'video', url: m[2], alt: '' });
    }
    for (const m of el.matchAll(/<video[^>]*src="([^"]+)"/g)) {
      const v = media.find((x) => x.type === 'video' && !x.poster);
      if (v) Object.assign(v, { poster: v.url, url: m[1] });
      else media.push({ type: 'video', url: m[1], alt: '' });
    }
    const text = htmlToText(body);
    posts.push({
      id: `telegram:${channel}/${msgId}`,
      network: 'telegram',
      url: `https://t.me/${channel}/${msgId}`,
      author: {
        name: owner ? htmlToText(sanitize(innerOf(owner))) : channel,
        handle: channel,
        url: `https://t.me/${channel}`,
      },
      publishedAt: time ? new Date(time).toISOString() : null,
      lang: detectLang(text),
      text,
      html: body,
      media,
      embed: { type: 'telegram', id: `${channel}/${msgId}` },
    });
  }
  return posts;
}

async function crawlTelegram(channel, limit) {
  const found = new Map();
  let before = '';
  while (found.size < limit) {
    const r = await get(`https://t.me/s/${channel}${before ? `?before=${before}` : ''}`);
    if (r.status !== 200 || !new URL(r.url).pathname.startsWith('/s/')) {
      log(`telegram ${channel}: not a public channel (status ${r.status}, final url ${r.url})`);
      break;
    }
    const page = parseTelegramMessages(r.body);
    if (!page.length) break;
    for (const p of page) found.set(p.id, p);
    const next = (r.body.match(/tme_messages_more[^>]*data-before="(\d+)"/) || [])[1];
    if (!next || next === before) break;
    before = next;
    await sleep(800);
  }
  return [...found.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, limit);
}

async function fetchTelegramPost(channel, id) {
  const r = await get(`https://t.me/${channel}/${id}?embed=1&mode=tme`);
  if (r.status !== 200) return { error: `status ${r.status}` };
  if (/tgme_widget_message_error/.test(r.body)) return { gone: true };
  const p = parseTelegramMessages(r.body)[0];
  return p ? { post: p } : { error: 'no message in embed' };
}

// ---------- VK ----------
const vkAway = (h) => {
  if (!h) return h;
  const m = h.match(/away\.php\?to=([^&]+)/);
  if (m) return decodeURIComponent(m[1]);
  if (h.startsWith('/')) return `https://vk.com${h}`;
  return h.replace(/^https:\/\/(m\.)?vk\.ru\//, 'https://vk.com/');
};

async function resolveVkOwner(screenName) {
  if (/^-?\d+$/.test(screenName)) return screenName;
  const r = await get(`https://m.vk.com/${screenName}`, { ua: CRAWLER_UA });
  const counts = {};
  for (const m of r.body?.matchAll(/data-post-id="(-?\d+)_\d+"/g) || []) counts[m[1]] = (counts[m[1]] || 0) + 1;
  const owner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!owner) log(`vk ${screenName}: could not resolve owner id (status ${r.status})`);
  return owner;
}

async function listVkPosts(owner, limit) {
  const ids = [];
  for (let offset = 0; ids.length < limit && offset < limit + 100; offset += 10) {
    const r = await get(`https://m.vk.com/wall${owner}?own=1&offset=${offset}`, { ua: CRAWLER_UA });
    const page = [
      ...(r.body || '').matchAll(/data-testid="post" data-post-id="(-?\d+_\d+)" data-post-nesting-lvl="0"/g),
    ].map((m) => m[1]);
    const fresh = page.filter((id) => !ids.includes(id));
    if (!fresh.length) break;
    ids.push(...fresh);
    await sleep(700);
  }
  return ids.slice(0, limit);
}

// Crawler-rendered post pages append a "Последние записи:" (recent posts) link list to the text.
const stripVkRecent = (html) =>
  html.replace(
    /<!--\$-->(?:\s*<div[^>]*>\s*<br\s*\/?>\s*<\/div>)?\s*(?:Последние записи|Recent posts|Latest posts)[\s\S]*$/,
    '',
  );

function vkMedia(el) {
  const media = [];
  for (const ph of findElements(el, 'data-testid="primary-attachment-photo"')) {
    for (const m of ph.matchAll(/<img[^>]*>/g)) {
      const src = attr(m[0], 'src');
      if (src && !media.some((x) => x.url === src))
        media.push({ type: 'photo', url: src, alt: attr(m[0], 'alt') || '' });
    }
  }
  for (const v of findElements(el, 'data-testid="primary-attachment-video')) {
    const img = (v.match(/<img[^>]*>/) || [])[0];
    const href = (v.match(/href="(\/video-?\d+_\d+)[^"]*"/) || [])[1];
    media.push({
      type: 'video',
      url: href ? `https://vk.com${href}` : null,
      poster: img ? attr(img, 'src') : null,
      alt: '',
    });
  }
  for (const a of findElements(el, 'data-testid="secondaryattachment"')) {
    const href = vkAway(attr(a.slice(0, a.indexOf('>')), 'href') || (a.match(/href="([^"]+)"/) || [])[1]);
    const title = findElements(a, 'data-testid="secondaryattachment-title"')[0];
    if (href) media.push({ type: 'link', url: href, alt: title ? htmlToText(sanitize(innerOf(title))) : '' });
  }
  return media;
}

async function fetchVkPost(postId) {
  const r = await get(`https://vk.com/wall${postId}`, { ua: CRAWLER_UA });
  if (r.status !== 200) return { error: `status ${r.status}` };
  const ld = [...r.body.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => {
      try {
        return JSON.parse(m[1]);
      } catch {
        return null;
      }
    })
    .find((x) => x && x['@type'] === 'SocialMediaPosting');
  const root = findElements(r.body, `data-testid="post" data-post-id="${postId}" data-post-nesting-lvl="0"`)[0];
  if (!ld || !root) return { error: 'no post markup (deleted, private or blocked)' };
  const own = findElements(root, `data-testid="post_text" data-post-id="${postId}"`)[0];
  // Text sits inside the expanded "show more" wrapper.
  const textHost = own ? findElements(own, 'data-testid="showmoretext-in-expanded"')[0] || own : '';
  let html = textHost ? sanitize(stripVkRecent(innerOf(textHost)), { resolveHref: vkAway }) : '';
  const nested = findElements(root, 'data-post-nesting-lvl="1"')[0];
  let repostOf;
  if (nested) {
    const nid = attr(nested.slice(0, nested.indexOf('>')), 'data-post-id');
    const ntext = findElements(nested, 'data-testid="post_text"')[0];
    const ntitle = (nested.match(/data-testid="post-header-title" title="([^"]*)"/) || [])[1];
    repostOf = `https://vk.com/wall${nid}`;
    const quoted = ntext
      ? sanitize(stripVkRecent(innerOf(findElements(ntext, 'data-testid="showmoretext-in-expanded"')[0] || ntext)), {
          resolveHref: vkAway,
        })
      : '';
    html += `${html ? '<br>' : ''}<blockquote><a href="${repostOf}">${escapeHtml(decodeEntities(ntitle || 'Repost'))}</a>${quoted ? `<br>${quoted}` : ''}</blockquote>`;
  }
  const text = htmlToText(html);
  const authorUrl = vkAway(ld.author?.url || '');
  const post = {
    id: `vk:${postId}`,
    network: 'vk',
    url: `https://vk.com/wall${postId}`,
    author: { name: ld.author?.name || null, handle: authorUrl.split('/').pop(), url: authorUrl },
    publishedAt: new Date(ld.datePublished).toISOString(),
    lang: detectLang(text, 'ru'),
    text,
    html,
    media: vkMedia(root),
    embed: { type: 'vk', id: postId },
  };
  if (repostOf) post.repostOf = repostOf;
  return { post };
}

// ---------- URL routing ----------
function parsePostUrl(raw) {
  const s = raw.trim();
  if (!s || s.startsWith('#')) return null;
  let m;
  if ((m = s.match(/(?:x|twitter)\.com\/(?:[^/]+|i(?:\/web)?)\/status(?:es)?\/(\d+)/i)))
    return { network: 'x', id: m[1] };
  if ((m = s.match(/t\.me\/(?:s\/)?([A-Za-z0-9_]{4,})\/(\d+)/i)))
    return { network: 'telegram', channel: m[1], id: m[2] };
  if ((m = s.match(/vk\.(?:com|ru)\/.*?wall(-?\d+_\d+)/i))) return { network: 'vk', id: m[1] };
  return { unknown: s };
}

// ---------- main ----------
async function main() {
  const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { posts: [] };
  const byId = new Map((Array.isArray(existing) ? existing : existing.posts).map((p) => [p.id, p]));
  const existingById = new Map(byId);
  const now = new Date().toISOString();
  const report = {
    x: { ok: 0, gone: 0, failed: [] },
    telegram: { ok: 0, gone: 0, failed: [] },
    vk: { ok: 0, gone: 0, failed: [] },
  };
  let changed = false;

  const store = (post) => {
    const prev = byId.get(post.id);
    const content = (p) =>
      JSON.stringify({
        ...p,
        media: p.media.map(({ file, posterFile, fileError, ...m }) => m), // eslint-disable-line no-unused-vars
        archivedAt: undefined,
        updatedAt: undefined,
        unavailableAt: undefined,
      });
    if (prev && content(prev) === content(post) && !prev.unavailableAt) return;
    changed = true;
    byId.set(post.id, { ...post, archivedAt: prev?.archivedAt || now, ...(prev ? { updatedAt: now } : {}) });
  };
  const markGone = (id) => {
    const prev = byId.get(id);
    if (prev && !prev.unavailableAt) (byId.set(id, { ...prev, unavailableAt: now }), (changed = true));
  };
  const handle = async (network, id, fn) => {
    const r = await fn().catch((e) => ({ error: String(e) }));
    if (r.post) (store(r.post), report[network].ok++);
    else if (r.gone) (markGone(id), report[network].gone++);
    else report[network].failed.push(`${id}: ${r.error}`);
  };

  const targets = { x: new Set(), telegram: new Set(), vk: new Set() };
  if (FETCH && fs.existsSync(URLS)) {
    for (const line of fs.readFileSync(URLS, 'utf8').split('\n')) {
      const t = parsePostUrl(line);
      if (!t) continue;
      if (t.unknown) log(`skip unrecognized url: ${t.unknown}`);
      else targets[t.network].add(t.network === 'telegram' ? `${t.channel}/${t.id}` : t.id);
    }
  }
  // Re-check previously archived X posts too (cheap) so deletions get flagged.
  if (FETCH) for (const p of byId.values()) if (p.network === 'x') targets.x.add(p.embed.id);

  for (const id of targets.x) {
    await handle('x', `x:${id}`, () => fetchTweet(id));
    await sleep(300);
  }

  if (DISCOVER) {
    for (const ch of TG_CHANNELS) {
      for (const p of await crawlTelegram(ch, TG_LIMIT))
        (store(p), report.telegram.ok++, targets.telegram.delete(p.embed.id));
    }
  }
  for (const key of targets.telegram) {
    const [ch, id] = key.split('/');
    await handle('telegram', `telegram:${key}`, () => fetchTelegramPost(ch, id));
    await sleep(500);
  }

  if (DISCOVER) {
    for (const wall of VK_WALLS) {
      const owner = await resolveVkOwner(wall);
      if (!owner) continue;
      for (const id of await listVkPosts(owner, VK_LIMIT)) targets.vk.add(id);
    }
  }
  for (const id of targets.vk) {
    await handle('vk', `vk:${id}`, () => fetchVkPost(id));
    await sleep(700);
  }

  for (const [id, p] of byId) {
    const withMedia = await archiveMedia(p, existingById.get(id));
    if (JSON.stringify(withMedia.media) !== JSON.stringify(p.media)) changed = true;
    byId.set(id, withMedia);
  }

  const posts = [...byId.values()].sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
  const output = {
    generatedAt: changed || !existing.generatedAt ? now : existing.generatedAt,
    sources: {
      x: 'https://cdn.syndication.twimg.com/tweet-result (ids from post-urls.txt)',
      telegram: TG_CHANNELS.length
        ? TG_CHANNELS.map((c) => `https://t.me/s/${c}`)
        : 'post-urls.txt only (no public channel configured)',
      vk: VK_WALLS.map((w) => `https://vk.com/${w}`),
    },
    counts: posts.reduce((a, p) => ((a[p.network] = (a[p.network] || 0) + 1), a), {}),
    posts,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(output, null, 2)}\n`);
  if (SITE_COPY) fs.copyFileSync(OUT, SITE_COPY);
  log(JSON.stringify({ out: OUT, changed, counts: output.counts, report }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
