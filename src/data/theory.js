// The links meta-theory (github.com/link-foundation/meta-theory) and the
// universal problem solving algorithm (github.com/konard/problem-solving).

export const metaTheory = {
  repo: 'https://github.com/link-foundation/meta-theory',
  pdfs: 'https://github.com/link-foundation/meta-theory/releases/latest/download/meta-theory-pdfs.zip',
  tldr: 'L → L²',
  summary:
    'A theory of everything built from a single concept, the link: an n-tuple of references to links that has its own reference. The goal is a meta-language that can describe philosophy, mathematics, physics and psychology in one formal language, so that every science becomes computable.',
  formulas: [
    { formula: 'L ⊆ ℕ₀', text: 'references to links (vectors) are natural numbers' },
    { formula: 'Vₙ = Lⁿ', text: 'all vectors of n references are the Cartesian power of L' },
    { formula: 'A = L × Vₙ', text: 'an association maps a reference to a vector of references' },
    { formula: 'λ: L → L × L', text: 'a doublet network gives every link a source and a target' },
    { formula: 'λ: L → L × L × L', text: 'a triplet network adds a type to every link' },
    {
      formula: 'L → L²',
      text: 'one formula is enough: any sequence converts to nested doublets and back (proved in Rocq/Coq)',
    },
  ],
  // The doublet network example from the article: 1 → (1,1), 2 → (2,2), 3 → (1,2),
  // written as a network code (link i is its source and target, 0 is nothing).
  example: { code: '11 22 12' },
  claims: [
    'Doublet-links are sufficient to represent tables, graphs, strings, arrays, lists, numbers, sound, images and video.',
    'A network of doublets can store the tape of a Turing machine, so links are as powerful as a Turing machine in storage capacity.',
    'A vertex is a link that refers to itself, an edge is a link between two vertices: graphs, relations and sets are special cases of links.',
  ],
  versions: [
    {
      version: '0.0.0',
      title: 'Math introduction to Deep Theory',
      lang: 'en',
      status: 'archived article',
      url: 'https://habr.com/en/articles/658705/',
    },
    {
      version: '0.0.1',
      title: 'Глубокая Теория Связей 0.0.1',
      lang: 'ru',
      status: 'archived article',
      url: 'https://habr.com/ru/articles/804617/',
    },
    {
      version: '0.0.2',
      title: 'The Links Theory 0.0.2',
      lang: 'en',
      status: 'archived article',
      url: 'https://habr.com/en/articles/895896/',
    },
    {
      version: '0.0.3',
      title: 'Мета-теория связей 0.0.3',
      lang: 'ru',
      status: 'draft',
      url: 'https://habr.com/ru/articles/1018142/',
    },
  ].map((v) => ({
    ...v,
    pdf: `https://github.com/link-foundation/meta-theory/releases/latest/download/meta-theory-${v.version}.pdf`,
  })),
  related: [
    ['deep-foundation/deep-theory', 'the earlier drafts and terminology of the theory'],
    ['link-foundation/links-notation', 'Links Notation (LiNo), a text format for links, with parsers in 6 languages'],
    ['linksplatform/Data.Doublets', 'a doublets database engine, the practical implementation in C# and C++'],
    ['konard/links-visuals', 'how links are drawn: dots, arrows and markers used on this site'],
  ],
};
