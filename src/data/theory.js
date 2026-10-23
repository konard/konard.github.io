// The links meta-theory (github.com/link-foundation/meta-theory) and the
// universal problem solving algorithm (github.com/konard/problem-solving).
// Texts are `{ en, ru }` objects translated with useLang().t; formulas, version
// titles (titles of the published articles) and repository names stay as they are.
// Formulas are `{ L, R }`: the notation of draft 0.0.2 (L → L²) and of draft
// 0.0.3 (R → R²), chosen in the settings (src/links/notation.js, issue #13).

const ARCHIVED = { en: 'archived article', ru: 'архивная статья' };
const DRAFT = { en: 'draft', ru: 'черновик' };

export const metaTheory = {
  repo: 'https://github.com/link-foundation/meta-theory',
  pdfs: 'https://github.com/link-foundation/meta-theory/releases/latest/download/meta-theory-pdfs.zip',
  tldr: { L: 'L → L²', R: 'R → R²' },
  summary: {
    en: 'A theory of everything built from a single concept, the link: an n-tuple of references to links that has its own reference. The goal is a meta-language that can describe philosophy, mathematics, physics and psychology in one formal language, so that every science becomes computable.',
    ru: 'Теория всего, построенная на единственном понятии — связи: n-кортеже ссылок на связи, у которого есть собственная ссылка. Цель — метаязык, способный описать философию, математику, физику и психологию на одном формальном языке, чтобы любая наука стала вычислимой.',
  },
  formulas: [
    {
      formula: { L: 'L ⊆ ℕ₀', R: 'R ⊆ ℕ₀' },
      text: {
        L: {
          en: 'references to links (vectors) are natural numbers',
          ru: 'ссылки на связи (векторы) — натуральные числа',
        },
        R: {
          en: 'references to tuples are natural numbers',
          ru: 'ссылки на кортежи — натуральные числа',
        },
      },
    },
    {
      formula: { L: 'Vₙ = Lⁿ', R: 'Tₙ = Rⁿ' },
      text: {
        L: {
          en: 'all vectors of n references are the Cartesian power of L',
          ru: 'все векторы из n ссылок — декартова степень L',
        },
        R: {
          en: 'all tuples of n references are the Cartesian power of R',
          ru: 'все кортежи из n ссылок — декартова степень R',
        },
      },
    },
    {
      formula: { L: 'A = L × Vₙ', R: 'L = R × Tₙ' },
      text: {
        L: {
          en: 'an association maps a reference to a vector of references',
          ru: 'ассоциация сопоставляет ссылке вектор ссылок',
        },
        R: {
          en: 'a link pairs a reference with a tuple of references; a reference is a link of no references, R ⊆ L',
          ru: 'связь — пара из ссылки и кортежа ссылок; ссылка — связь без ссылок, R ⊆ L',
        },
      },
    },
    {
      formula: { L: 'λ: L → L × L', R: 'N²: R → R × R' },
      text: {
        en: 'a doublet network gives every link a source and a target',
        ru: 'сеть дуплетов задаёт каждой связи начало и конец',
      },
    },
    {
      formula: { L: 'λ: L → L × L × L', R: 'N³: R → R × R × R' },
      text: { en: 'a triplet network adds a type to every link', ru: 'сеть триплетов добавляет каждой связи тип' },
    },
    {
      formula: { L: 'L → L²', R: 'R → R²' },
      text: {
        en: 'one formula is enough: any sequence converts to nested doublets and back (proved in Rocq/Coq)',
        ru: 'достаточно одной формулы: любая последовательность преобразуется во вложенные дуплеты и обратно (доказано в Rocq/Coq)',
      },
    },
  ],
  // The doublet network example from the article: 1 → (1,1), 2 → (2,2), 3 → (1,2),
  // written as a network code (link i is its source and target, 0 is nothing).
  example: { code: '11 22 12' },
  claims: [
    {
      en: 'Doublet-links are sufficient to represent tables, graphs, strings, arrays, lists, numbers, sound, images and video.',
      ru: 'Связей-дуплетов достаточно, чтобы представить таблицы, графы, строки, массивы, списки, числа, звук, изображения и видео.',
    },
    {
      en: 'A network of doublets can store the tape of a Turing machine, so links are as powerful as a Turing machine in storage capacity.',
      ru: 'Сеть дуплетов может хранить ленту машины Тьюринга, поэтому по ёмкости хранения связи не уступают машине Тьюринга.',
    },
    {
      en: 'A vertex is a link that refers to itself, an edge is a link between two vertices: graphs, relations and sets are special cases of links.',
      ru: 'Вершина — это связь, которая ссылается на саму себя, ребро — связь между двумя вершинами: графы, отношения и множества — частные случаи связей.',
    },
  ],
  versions: [
    {
      version: '0.0.0',
      title: 'Math introduction to Deep Theory',
      lang: 'en',
      status: ARCHIVED,
      url: 'https://habr.com/en/articles/658705/',
    },
    {
      version: '0.0.1',
      title: 'Глубокая Теория Связей 0.0.1',
      lang: 'ru',
      status: ARCHIVED,
      url: 'https://habr.com/ru/articles/804617/',
    },
    {
      version: '0.0.2',
      title: 'The Links Theory 0.0.2',
      lang: 'en',
      status: ARCHIVED,
      url: 'https://habr.com/en/articles/895896/',
    },
    {
      version: '0.0.3',
      title: 'Мета-теория связей 0.0.3',
      lang: 'ru',
      status: DRAFT,
      url: 'https://habr.com/ru/articles/1018142/',
    },
  ].map((v) => ({
    ...v,
    pdf: `https://github.com/link-foundation/meta-theory/releases/latest/download/meta-theory-${v.version}.pdf`,
  })),
  related: [
    [
      'deep-foundation/deep-theory',
      {
        en: 'the earlier drafts and terminology of the theory',
        ru: 'ранние черновики и терминология теории',
      },
    ],
    [
      'link-foundation/links-notation',
      {
        en: 'Links Notation (LiNo), a text format for links, with parsers in 6 languages',
        ru: 'Links Notation (LiNo) — текстовый формат для связей с парсерами на 6 языках',
      },
    ],
    [
      'linksplatform/Data.Doublets',
      {
        en: 'a doublets database engine, the practical implementation in C# and C++',
        ru: 'движок базы данных дуплетов — практическая реализация на C# и C++',
      },
    ],
    [
      'konard/links-visuals',
      {
        en: 'how links are drawn: dots, arrows and markers used on this site',
        ru: 'как рисуются связи: точки, стрелки и маркеры, которые используются на этом сайте',
      },
    ],
  ],
};
