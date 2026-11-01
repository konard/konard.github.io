import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import archive from '../data/posts.lino';
import { dedupe, isDuplicate, links, pick, readerLanguage, similarity, visibleFor, words } from './feed';

const post = (id, network, lang, publishedAt, text) => ({ id, network, lang, publishedAt, text });

const ruVk = post('vk-1', 'vk', 'ru', '2026-01-01T10:00:00Z', 'Связи — это всё, что нужно для описания любых данных');
const enVk = post('vk-2', 'vk', 'en', '2026-01-01T10:05:00Z', 'Links are all you need to describe any kind of data');
const enX = post('x-1', 'x', 'en', '2026-01-01T10:20:00Z', 'Links are all you need to describe any kind of data');
const other = post('vk-3', 'vk', 'en', '2026-01-01T15:00:00Z', 'A completely different thought, much later that day');

describe('feed text helpers', () => {
  it('split words without links, mentions and punctuation', () => {
    expect(words('Hello, @konard! See https://example.com/x — links & связи.')).toEqual([
      'hello',
      'see',
      'links',
      'связи',
    ]);
    expect(links('Read https://www.habr.com/a/1/, and http://x.com/b.')).toEqual(['habr.com/a/1', 'x.com/b']);
    expect(similarity('a links theory post', 'links theory post')).toBe(1);
    expect(similarity('', 'links')).toBe(0);
  });
});

describe('isDuplicate', () => {
  it('matches a translation published minutes later', () => {
    expect(isDuplicate(ruVk, enVk)).toBe(true);
  });

  it('matches a cross-post with the same text on another network', () => {
    expect(isDuplicate(enVk, enX)).toBe(true);
  });

  it('keeps posts far apart in time separate', () => {
    expect(isDuplicate(enVk, other)).toBe(false);
  });

  it('keeps different posts in the same language separate', () => {
    const near = post('vk-4', 'vk', 'en', '2026-01-01T10:10:00Z', 'Something else entirely about cats and dogs');
    expect(isDuplicate(enVk, near)).toBe(false);
  });

  it('matches versions that share most of their links hours apart', () => {
    const a = post('a', 'vk', 'ru', '2026-01-01T10:00:00Z', 'Теория https://habr.com/1 и https://github.com/x/y');
    const b = post('b', 'vk', 'en', '2026-01-01T13:00:00Z', 'Theory https://habr.com/1 and https://github.com/x/y');
    expect(isDuplicate(a, b)).toBe(true);
    expect(isDuplicate(a, { ...b, publishedAt: '2026-01-02T10:00:00Z' })).toBe(false);
  });

  it('never matches posts without text or a post with itself', () => {
    expect(isDuplicate(enVk, { ...enX, text: '' })).toBe(false);
    expect(isDuplicate(enVk, enVk)).toBe(false);
  });
});

describe('dedupe and pick', () => {
  const stories = dedupe([other, enX, ruVk, enVk]);

  it('groups the versions of one post into one story, newest first', () => {
    expect(stories.map((s) => s.posts.map((p) => p.id))).toEqual([['vk-3'], ['vk-1', 'vk-2', 'x-1']]);
  });

  it('shows the X version to English readers and the VK version to Russian readers', () => {
    expect(pick(stories[1], 'en').id).toBe('x-1');
    expect(pick(stories[1], 'ru').id).toBe('vk-1');
    expect(pick(stories[0], 'ru').id).toBe('vk-3');
  });

  it('falls back to any network in the reader language before other languages', () => {
    const story = { id: 's', posts: [ruVk, enVk] };
    expect(pick(story, 'en').id).toBe('vk-2');
    expect(pick({ id: 's', posts: [ruVk] }, 'en').id).toBe('vk-1');
  });

  it('lists a story for a language only when it has a version in it', () => {
    expect(visibleFor(stories[1], 'ru')).toBe(true);
    expect(visibleFor(stories[0], 'ru')).toBe(false);
    expect(visibleFor({ id: 'p', posts: [{ ...other, text: '' }] }, 'ru')).toBe(true);
  });

  it('never puts two posts of the same network and language into one story', () => {
    for (const story of dedupe(archive.posts)) {
      const keys = story.posts.map((p) => `${p.network}:${p.lang}`);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('merges the translations and cross-posts of the archive', () => {
    const merged = dedupe(archive.posts);
    expect(merged.length).toBeLessThan(archive.posts.length);
    expect(merged.some((s) => new Set(s.posts.map((p) => p.network)).size > 1)).toBe(true);
    expect(merged.reduce((sum, s) => sum + s.posts.length, 0)).toBe(archive.posts.length);
  });
});

describe('readerLanguage', () => {
  it('detects Russian-speaking readers from the browser languages', () => {
    expect(readerLanguage({ languages: ['ru-RU', 'en'] })).toBe('ru');
    expect(readerLanguage({ languages: [], language: 'uk' })).toBe('ru');
    expect(readerLanguage({ languages: ['en-US', 'ru'] })).toBe('en');
    expect(readerLanguage(null)).toBe('en');
  });
});

describe('archive', () => {
  it('keeps a copy of every picture, so a deleted post keeps its media', () => {
    const media = archive.posts.flatMap((p) => p.media).filter((m) => m.type === 'photo' || m.poster);
    // A picture the CDN no longer serves is marked, never silently skipped.
    media.forEach((m) => expect(m.file || m.posterFile || m.fileError).toBeTruthy());
    const pictures = media.flatMap((m) => [m.file, m.posterFile]).filter(Boolean);
    expect(pictures.length).toBeGreaterThan(media.length * 0.9);
    pictures.forEach((file) => {
      expect(file).toMatch(/^\/archive\/media\//);
      expect(fs.existsSync(`public${file}`)).toBe(true);
    });
  });
});
