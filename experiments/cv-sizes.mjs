// Prints the jobs and bullet counts of every tailored CV, to see which positions overflow 2 pages.
import { createServer } from 'vite';
const vite = await createServer({ logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' });
const { buildCv, POSITION_IDS } = await vite.ssrLoadModule('/src/cv/buildCv.js');
for (const role of POSITION_IDS) {
  const cv = buildCv({ role, style: 'classic', lang: 'en' });
  const bullets = cv.jobs.reduce((n, j) => n + j.bullets.length, 0);
  console.log(
    role.padEnd(10),
    'jobs',
    cv.jobs.length,
    'bullets',
    bullets,
    'products',
    cv.products.length,
    'practices',
    cv.practices.length,
    cv.jobs.map((j) => `${j.id}:${j.bullets.length}`).join(' '),
  );
}
await vite.close();
