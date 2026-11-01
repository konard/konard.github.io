// Who wrote the Habr articles shown on the site (issue #47): the articles of the
// profile owner and those of the Deep.Foundation team are counted apart, so the
// totals never read as if every article were the owner's own.
export function habrAuthorship(habr) {
  const own = (a) => a.author?.alias?.toLowerCase() === habr.user.alias.toLowerCase();
  const mine = habr.articles.filter(own);
  const team = habr.articles.filter((a) => !own(a));
  const views = (list) => list.reduce((sum, a) => sum + a.statistics.views, 0);
  return { own, mine: mine.length, team: team.length, mineViews: views(mine), teamViews: views(team) };
}

/** The footnote that the stat tile and the article section both point to. */
export const HABR_NOTE_ID = 'habr-authorship';
