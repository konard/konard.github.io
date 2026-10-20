// Live statistics of Habr articles. Habr's public API answers with
// `Access-Control-Allow-Origin: *`, so the browser refreshes the committed
// snapshot (src/data/habr.json, made by experiments/collect-habr.cjs) in place.
export const HABR_API = 'https://habr.com/kek/v2';
const FILTERS = ['company=deepfoundation', 'user=Konard'];

export const statisticsOf = (s) => ({
  views: s.readingCount,
  score: s.score,
  votes: s.votesCount,
  bookmarks: s.favoritesCount,
  comments: s.commentsCount,
});

async function getJson(url, fetchImpl) {
  const response = await fetchImpl(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

/** Fetches statistics of every listed article: { [id]: statistics }. */
export async function fetchHabrStatistics(fetchImpl = fetch) {
  const stats = {};
  for (const filter of FILTERS) {
    for (let page = 1, pages = 1; page <= pages && page <= 5; page++) {
      const data = await getJson(`${HABR_API}/articles/?${filter}&fl=ru,en&hl=ru&page=${page}`, fetchImpl);
      pages = data.pagesCount || 1;
      for (const id of data.publicationIds || []) {
        const ref = data.publicationRefs[id];
        if (ref?.statistics) stats[id] = statisticsOf(ref.statistics);
      }
    }
  }
  return stats;
}

/** Fetches the company rating and the author's karma. */
export async function fetchHabrCards(fetchImpl = fetch) {
  const [company, user] = await Promise.all([
    getJson(`${HABR_API}/companies/deepfoundation/card?fl=ru&hl=ru`, fetchImpl),
    getJson(`${HABR_API}/users/Konard/card?fl=ru&hl=ru`, fetchImpl),
  ]);
  return {
    company: { rating: company.statistics.rating, subscribers: company.statistics.subscribersCount },
    user: {
      karma: user.scoreStats.score,
      karmaVotes: user.scoreStats.votesCount,
      followers: user.followStats.followersCount,
    },
  };
}

/** Returns the snapshot with fresh numbers merged in. */
export function mergeHabr(snapshot, stats, cards = null) {
  return {
    ...snapshot,
    company: cards ? { ...snapshot.company, ...cards.company } : snapshot.company,
    user: cards ? { ...snapshot.user, ...cards.user } : snapshot.user,
    articles: snapshot.articles.map((a) => (stats[a.id] ? { ...a, statistics: stats[a.id] } : a)),
  };
}
