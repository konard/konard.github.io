// Prints how the blog groups the archived posts into stories (see src/pages/feed.js).
// Usage: node experiments/blog-dedupe.mjs [posts.lino]
import { createRequire } from 'node:module';
import { dedupe, pick } from '../src/pages/feed.js';

const file = process.argv[2] || 'src/data/posts.lino';
const { posts } = createRequire(import.meta.url)('../scripts/lino-data.cjs').readLino(file);
const stories = dedupe(posts);
console.log(`${posts.length} posts -> ${stories.length} stories`);
for (const s of stories.filter((x) => x.posts.length > 1)) {
  console.log('---');
  for (const p of s.posts) console.log(p.publishedAt, p.network, p.lang, JSON.stringify(p.text.slice(0, 70)));
  console.log('  en ->', pick(s, 'en').id, ' ru ->', pick(s, 'ru').id);
}
