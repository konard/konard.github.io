#!/usr/bin/env node
// Snapshots Habr articles of the Deep.Foundation company blog and of the Konard
// user with their statistics (views, score, bookmarks, comments). The website
// renders this snapshot and refreshes the numbers live from the same CORS API.
// Usage: node experiments/collect-habr.cjs [output-dir]
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2] || 'docs/case-studies/issue-7/data';
const API = 'https://habr.com/kek/v2';
const get = async (url) => {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url, { headers: { 'user-agent': 'konard.github.io data collector' } });
    if (response.ok) return response.json();
    if (attempt >= 4) throw new Error(`${response.status} ${url}`);
    await new Promise((resolve) => setTimeout(resolve, attempt * 3000));
  }
};
const text = (html) =>
  String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

async function list(filter) {
  const refs = [];
  for (let page = 1, pages = 1; page <= pages; page++) {
    const data = await get(`${API}/articles/?${filter}&fl=ru,en&hl=ru&page=${page}`);
    pages = data.pagesCount;
    refs.push(...data.publicationIds.map((id) => data.publicationRefs[id]));
  }
  return refs;
}

async function main() {
  const [company, user, companyArticles, userArticles] = await Promise.all([
    get(`${API}/companies/deepfoundation/card?fl=ru&hl=ru`),
    get(`${API}/users/Konard/card?fl=ru&hl=ru`),
    list('company=deepfoundation'),
    list('user=Konard'),
  ]);
  const byId = new Map();
  for (const a of [...companyArticles, ...userArticles]) {
    const detail = await get(`${API}/articles/${a.id}/?fl=ru&hl=ru`);
    byId.set(a.id, {
      id: a.id,
      title: text(a.titleHtml),
      url: `https://habr.com/${a.lang === 'en' ? 'en' : 'ru'}/articles/${a.id}/`,
      publishedAt: a.timePublished,
      lang: a.lang,
      company: a.isCorporative ? 'deepfoundation' : null,
      author: { alias: a.author.alias, name: a.author.fullname },
      hubs: a.hubs.map((h) => h.title),
      tags: (detail.tags || []).map((t) => t.titleHtml),
      lead: text(a.leadData?.textHtml).slice(0, 400),
      image: detail.leadData?.imageUrl || a.leadData?.imageUrl || null,
      statistics: {
        views: a.statistics.readingCount,
        score: a.statistics.score,
        votes: a.statistics.votesCount,
        bookmarks: a.statistics.favoritesCount,
        comments: a.statistics.commentsCount,
      },
    });
  }
  const articles = [...byId.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const snapshot = {
    collectedAt: new Date().toISOString(),
    company: {
      alias: company.alias,
      title: text(company.titleHtml),
      description: text(company.descriptionHtml),
      url: 'https://habr.com/ru/companies/deepfoundation/',
      rating: company.statistics.rating,
      subscribers: company.statistics.subscribersCount,
      posts: company.statistics.postsCount,
    },
    user: {
      alias: user.alias,
      name: user.fullname,
      url: 'https://habr.com/ru/users/Konard/',
      karma: user.scoreStats.score,
      karmaVotes: user.scoreStats.votesCount,
      rating: user.rating,
      followers: user.followStats.followersCount,
      registeredAt: user.registerDateTime,
    },
    articles,
  };
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'habr.json'), JSON.stringify(snapshot, null, 1) + '\n');
  console.error(`habr: ${articles.length} articles`);
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
