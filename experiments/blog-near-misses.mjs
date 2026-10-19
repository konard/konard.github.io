// Lists pairs of posts in different languages published within 6 hours that the
// blog does NOT group, to tune the dedup rules in src/pages/feed.js.
import fs from 'node:fs';
import { dedupe, links, similarity } from '../src/pages/feed.js';

const { posts } = JSON.parse(fs.readFileSync(process.argv[2] || 'src/data/posts.json', 'utf8'));
const story = new Map();
dedupe(posts).forEach((s, i) => s.posts.forEach((p) => story.set(p.id, i)));
const sorted = [...posts].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
for (let i = 0; i < sorted.length; i++)
  for (let j = i + 1; j < sorted.length; j++) {
    const [a, b] = [sorted[i], sorted[j]];
    const gap = (Date.parse(b.publishedAt) - Date.parse(a.publishedAt)) / 60000;
    if (gap > 360) break;
    if (story.get(a.id) === story.get(b.id) || !a.text || !b.text) continue;
    console.log(
      `${Math.round(gap)}min ${a.lang}/${b.lang} sim=${similarity(a.text, b.text).toFixed(2)} links=${links(a.text)}|${links(b.text)}`,
    );
    console.log('   ', JSON.stringify(a.text.slice(0, 60)), '\n   ', JSON.stringify(b.text.slice(0, 60)));
  }
