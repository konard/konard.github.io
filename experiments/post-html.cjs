// HTML5 parsing for the public post archive. No page scripts are executed.
'use strict';
const { parseFragment } = require('parse5');

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

const ALLOWED = new Set(['a', 'b', 'strong', 'i', 'em', 'u', 's', 'code', 'pre', 'br', 'p', 'blockquote']);
const ALIAS = { del: 's', strike: 's', ins: 'u', 'tg-spoiler': null };
const DROP_CONTENT = new Set(['script', 'style', 'svg', 'template', 'noscript', 'button']);

// Traverse iteratively so deeply nested input does not consume the JS stack.
function* walk(root) {
  const pending = [{ node: root, close: false }];
  while (pending.length) {
    const item = pending.pop();
    yield item;
    if (item.close) continue;
    if (item.node.tagName) pending.push({ node: item.node, close: true });
    const children = item.node.childNodes || [];
    for (let i = children.length - 1; i >= 0; i--) pending.push({ node: children[i], close: false });
  }
}

function innerOf(outer) {
  const root = parseFragment(outer, { sourceCodeLocationInfo: true });
  const location = root.childNodes.find((node) => node.tagName)?.sourceCodeLocation;
  return location?.startTag
    ? outer.slice(location.startTag.endOffset, location.endTag?.startOffset ?? location.endOffset)
    : '';
}

function findElements(html, needle) {
  const root = parseFragment(html, { sourceCodeLocationInfo: true });
  const found = [];
  for (const { node, close } of walk(root)) {
    const location = node.sourceCodeLocation;
    if (
      !close &&
      location?.startTag &&
      html.slice(location.startOffset, location.startTag.endOffset).includes(needle)
    ) {
      found.push(html.slice(location.startOffset, location.endOffset));
    }
  }
  return found;
}

// Rebuild only the permitted formatting and href attributes from parsed nodes.
function sanitize(html, { resolveHref = (href) => href } = {}) {
  const output = [];
  const kept = new WeakMap();
  let dropDepth = 0;
  let emojiDepth = 0;
  for (const { node, close } of walk(parseFragment(html))) {
    const name = node.tagName;
    const emoji = name === 'i' && /\bemoji\b/.test(node.attrs.find((a) => a.name === 'class')?.value || '');
    if (emoji) emojiDepth += close ? -1 : 1;
    if (DROP_CONTENT.has(name)) {
      dropDepth += close ? -1 : 1;
      continue;
    }
    if (dropDepth) continue;
    if (close) {
      if (kept.get(node)) output.push(`</${kept.get(node)}>`);
      continue;
    }
    if (node.nodeName === '#text') {
      output.push(escapeHtml(node.value));
      continue;
    }
    let tag = Object.hasOwn(ALIAS, name) ? ALIAS[name] : ALLOWED.has(name) ? name : null;
    if (emoji || (tag === 'b' && emojiDepth)) tag = null;
    if (!tag) continue;
    if (tag === 'br') {
      output.push('<br>');
      continue;
    }
    if (tag === 'a') {
      const href = resolveHref(node.attrs.find((a) => a.name === 'href')?.value || '');
      if (!/^https?:\/\//i.test(href)) continue;
      output.push(`<a href="${escapeHtml(href)}">`);
    } else {
      output.push(`<${tag}>`);
    }
    kept.set(node, tag);
  }
  return output
    .join('')
    .replace(/[ \t]*<br>[ \t]*/g, '<br>')
    .replace(/(\s*<br>\s*){3,}/g, '<br><br>')
    .replace(/^(\s|<br>)+|(\s|<br>)+$/g, '');
}

// This result is plain text, not HTML; encoded literal markup stays literal.
function htmlToText(html) {
  const output = [];
  const pending = [{ node: parseFragment(html), close: false }];
  while (pending.length) {
    const { node, close } = pending.pop();
    if (DROP_CONTENT.has(node.tagName)) continue;
    if (close) {
      output.push('\n');
      continue;
    }
    if (node.nodeName === '#text') output.push(node.value);
    if (node.tagName === 'br') output.push('\n');
    const children = node.childNodes || [];
    if (node.tagName === 'a' && children.every((child) => child.nodeName === '#text')) {
      const text = children.map((child) => child.value).join('');
      const href = node.attrs.find((a) => a.name === 'href')?.value;
      if (href && (text.endsWith('...') || text.endsWith('…'))) {
        output.push(href);
        continue;
      }
    }
    if (['p', 'blockquote', 'pre'].includes(node.tagName)) pending.push({ node, close: true });
    for (let i = children.length - 1; i >= 0; i--) pending.push({ node: children[i], close: false });
  }
  return output
    .join('')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

module.exports = { attr, decodeEntities, escapeHtml, findElements, innerOf, sanitize, htmlToText };
