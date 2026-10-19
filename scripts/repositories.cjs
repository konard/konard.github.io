// Classification of every collected repository (docs/case-studies/issue-7/data/repositories.json):
// - kind: what the repository is (original work, a copy of a client project, a mirror, test noise);
// - fields: fields of study or business where the repository can be useful.
// Field descriptions shown on the website live in src/data/fields.js; the ids must match.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'docs', 'case-studies', 'issue-7', 'data');
const outFile = path.join(root, 'src', 'data', 'repositories.json');

// GitHub users/organizations whose projects konard copied into his account
// as `<owner>-<name>` to work on them for (or with) the owner. Reviewed by hand
// from the full list of konard/* repositories (see the issue-7 case study).
const CLIENTS = [
  'Aboba',
  'alekseymavai',
  'andchir',
  'asaraeva',
  'ideav',
  'IlyaElevrin',
  'Jhon-Crow',
  'kogeletey',
  'lefinepro',
  'lion-lef',
  'LPN1KoL',
  'Maksik1935',
  'maksmoroz91',
  'medmancifra',
  'Milana46',
  'MixaByk1996',
  'mxsrdesu',
  'olproff',
  'Payel-git-ol',
  'PavelLiakh',
  'RattusRex',
  'rolozz',
  'suenot',
  'uselessgoddess',
  'VisageDvachevsky',
  'xierongchuan',
  'xlab2016',
];
const clientPrefix = new RegExp(`^(${CLIENTS.join('|')})-`, 'i');

// Temporary/generated repositories that should not be shown as projects.
const isNoise = (repo) =>
  /^log-tmp-|solution-draft-log|^(test-feedback-lines-|test-hello-world-|hive-solve-|test-comment-fix-)/i.test(
    repo.name,
  ) || /^(konard\/test)$/i.test(repo.fullName || '');

const KINDS = ['own', 'client', 'mirror', 'noise'];

function kindOf(repo) {
  if (isNoise(repo)) return 'noise';
  if (repo.owner === 'konard' && clientPrefix.test(repo.name)) return 'client';
  if (repo.owner === 'konard' && /_fork$/.test(repo.name)) return 'mirror';
  // link-foundation keeps a backup copy of the deep-foundation repositories;
  // konard/<org>-<name> copies of an existing repository are mirrors as well.
  if (repo.copyOf) return /^(deep-foundation|link-foundation|linksplatform)\//.test(repo.copyOf) ? 'mirror' : 'client';
  if (/automatically exported from code\.google\.com/i.test(repo.description || '')) return 'mirror';
  return 'own';
}

// [field id, keyword pattern over "owner/name description topics", languages implying the field]
const FIELD_RULES = [
  [
    'associative',
    /link|doublet|triplet|associativ|\blino\b|lino-|deep|meta-?(theory|language|notation|ontology|logic|expression|sovereign)|ideav|graph|semantic|ontolog|shuttler/,
    [],
  ],
  [
    'data',
    /sql|postgres|redis|neo4j|clickhouse|spacetime|database|\bdb\b|_db|storage|hasura|graphql|\bgql\b|json|xml|\bdata\b|data\.|elastic|search|vector|cache|queue|materialized|export|import|archive|codec|parse|benchmark|collect/,
    ['PLpgSQL', 'Jupyter Notebook', 'R'],
  ],
  [
    'ai',
    /\bai\b|-ai-|ai-|gpt|chatgpt|\bllm|claude|openai|codex|agent|cursor|ollama|llama|neural|\/models\b|model-in|assistant|prompt|hive-mind|transcri|wisper|whisper|speech|formal-ai|tutor|interpreter|fact-check|translator|nhack|cortex|research/,
    [],
  ],
  [
    'ml',
    /machine-learning|machine learning|neural|\bml\b|-ml|trading|inference|power-law|vector|markov|recogni|gaussian|statistic|analytics|image-to-number|patterns|medical|screening|transcri/,
    ['Jupyter Notebook', 'R', 'Julia', 'Cuda'],
  ],
  [
    'mlops',
    /gateway|router|model-in-browser|\bmodels\b|ai-driven-development-pipeline|llama\.cpp|local llm|offline|speech-to-text|open-interpreter|codex-sandbox|ai-ci|auto-review|ai-review|agent-commander|hive-mind|claude-profiles|watermarks-remover|\bagent\b|localcode|localmind|api-gateway|telegram-bot$|deep-gpt|gpu/,
    ['Cuda'],
  ],
  [
    'devops',
    /docker|\bci\b|-ci\b|\bcd\b|workflow|automation|deploy|script|install|kubernetes|k8s|helm|gh-|glab-|\bgit\b|git-|heroku|server-migration|migrat|infrastructure|\bbox\b|virtual|ram-volume|disk|backup|monitor|codespaces|gitpod|unfork|auto-merge|auto-issue|restore-history|package-registry|npm-automation|npm-packager|selectel|openproject|control-center|sync-auth|isolation-provider|homebrew|process-name|uncommitted|logs?-|-logs?\b|log-it|vault|playwright|e2e|sandbox|test-anywhere|jest|command-stream|\bstart\b/,
    ['Shell', 'Dockerfile', 'PowerShell', 'Nix', 'HCL', 'Batchfile', 'Procfile'],
  ],
  [
    'web',
    /react|\bvue|vue\.|next|svelte|\bweb\b|web-|site|html|\bcss\b|browser|capacitor|android|\bios\b|mobile|mini-app|github\.io|pages|\bui\b|-ui|frontend|extension|meteor|monaco|widget|playground|heroui|\bapp\b|-app|tilda|landing|resume|wedding|jsonschema-form|uniforms|imagemaker|markup|templates|style|oswst|perception|deepcase|deep-memo|deepmemo|firebase/,
    ['HTML', 'CSS', 'Vue', 'Svelte', 'SCSS', 'Less', 'Swift', 'Dart', 'Kotlin', 'Blade', 'Twig', 'Slim'],
  ],
  [
    'backend',
    /\bapi\b|-api|api-|server|microservice|rest|websocket|asp\.net|tcp|\brpc|backend|laravel|\bphp|yii|cake|payments?|merchant|payout|exchanger|hasura|deeplinks|deepclient|sdk|crm|concurrent|links-client|links-queue|bridge|capture|web-search|speech-to-text|router/,
    ['PHP', 'Go', 'Java', 'Elixir', 'Erlang', 'Crystal'],
  ],
  [
    'bots',
    /bot|telegram|\bvk\b|vk-|discord|anygram|bridge|broadcast|\bfollow\b|social|mini-app|chat|community-posts/,
    [],
  ],
  [
    'languages',
    /translat|transformer|parser|\bpeg|pegasus|antlr|grammar|regex|regular|notation|language|syntax|\bcst\b|compiler|recompile|cs2cpp|codegen|metalanguage|\blino|lino-|markup|\bt4|template|generics|roslyn|i18n|expression|yoptascript|source-code-tracer|recurscan|ln2json|outmark|deduplino|dedup-log|human-language|ipa/,
    ['ANTLR', 'PEG.js', 'Lex', 'Yacc', 'Mustache', 'Jinja', 'Mako', 'M4', 'GAP'],
  ],
  [
    'systems',
    /memory|unsafe|\btrees?\b|trees-|\bsbt\b|size-balanced|hashing|hashbrown|\bgpu\b|gpu-|kernel|native|bare|threading|benchmark|performance|epoll|rb-tree|layout|ram-|\bdisk|process|collections|numbers|bitcoin|sorting|mem-rs|platform-rs|data-rs|doublets-rs|delegates|disposables|interfaces|equality|incrementers|singletons|ranges|setters|scopes|converters|comparers|exceptions|reflection|timestamps|random|\bio\b|protocols|iddistributor|idclient|archiver|\bbar\b|veil|vpn|cpp|wasm|webassembly|audio-?system/,
    ['C', 'C++', 'Assembly', 'Cuda', 'WGSL', 'WebAssembly', 'Metal', 'Nim', 'Objective-C', 'RenderScript'],
  ],
  [
    'research',
    /p-vs-np|\btsp\b|travel|subset-sum|np hard|primes|golden-ratio|paradox|physic|unified-theory|gravity|wave|fractal|hash-inversion|proof|theory|logic|ontology|semantic-prime|isomorphism|solver|immortality|spacecraft|solar|research|\bsat\b|experiment|prototype|inference|universal|problem-solving|draw-to-solve|meta-|explanation|\brbe\b/,
    ['Coq', 'Rocq Prover', 'Lean', 'Agda', 'Isabelle', 'Haskell', 'OCaml', 'TeX', 'Julia'],
  ],
  ['legal', /\blaws?\b|laws-|-laws?\b|legal|verdict|codices|ndfl|tax|satyavera|agreement/, []],
  [
    'finance',
    /trad(e|er|ing)|money|networth|price|payments?|payplay|merchant|payout|exchanger|bitcoin|crypto|cbr|key-rate|wildberr|marketplace|retail|lazada|bidder|x402|tvm|tinkoff|groupbuy|gamestock|business|market-research|rbe|economy|yachts/,
    [],
  ],
  [
    'education',
    /tutor|school|moodle|learn|lesson|example|explanation|\blab|course|education|words|questions|answers|test-assig|documentation|\bwiki|articles|tasksandsolutions|tasks-and-solutions|ipa|foreign languages|teach|roadmap|discussions|how to/,
    [],
  ],
  [
    'art',
    /anime|\bart\b|paint|visual|animation|matrix|game|yin|fractal|simulation|audio|music|\bvoice|sound|gaussian|splatting|\b3d\b|avatar|drama|ending|draw|colou?r|svg|suno|image|video|watermark|resonance|dungeon|scoundrel|deck|pluriaxis|fantasy|wave|vision|editor|storygraph|mixer|fluid|flew|sonar|tic-tac-toe/,
    [],
  ],
  [
    'productivity',
    /\btools?\b|tool-|\bcli\b|-cli|todo|tasks?|issue|pull|gist|review|trello|kaiten|yougile|openproject|time-left|sleep|count-?down|tracker|manager|commander|converter|pdf|markdown|editor|upload|download|capture|search|sanitizer|dedup|\bcv\b|cv-|hh-|job|calculator|uuid|file-converter|clipboard|notes?|memo|organizer|navigator|accomodation|ticket|referencify|operator|conversation|profiles/,
    [],
  ],
];
const FIELDS = [...FIELD_RULES.map(([id]) => id), 'other'];

// Organizations whose whole purpose is associative technology.
const ASSOCIATIVE_OWNERS = new Set(['linksplatform', 'deep-foundation', 'meteor-shuttler']);

function fieldsOf(repo) {
  const text = [repo.fullName, repo.description || '', (repo.topics || []).join(' ')].join(' ').toLowerCase();
  const languages = Object.keys(repo.languages || {});
  const primary = repo.language;
  const fields = FIELD_RULES.filter(
    ([id, pattern, langs]) =>
      pattern.test(text) ||
      (primary && langs.includes(primary)) ||
      // Proof assistants and data notebooks mark a field even as a secondary language.
      (['research', 'ml'].includes(id) && langs.some((l) => languages.includes(l))),
  ).map(([id]) => id);
  if (ASSOCIATIVE_OWNERS.has(repo.owner) && !fields.includes('associative')) fields.unshift('associative');
  return fields.length ? FIELDS.filter((f) => fields.includes(f)) : ['other'];
}

const readCollected = () => JSON.parse(fs.readFileSync(path.join(dataDir, 'repositories.json'), 'utf8'));

// Compact, sorted list consumed by the repositories page.
function buildRepositories({ write = true, repos = readCollected() } = {}) {
  const items = repos
    .map((r) => ({
      fullName: r.fullName,
      owner: r.owner,
      name: r.name,
      description: r.description || null,
      homepage: r.homepage || null,
      kind: kindOf(r),
      fields: fieldsOf(r),
      language: r.language || null,
      languages: Object.keys(r.languages || {}).slice(0, 6),
      stars: r.stars,
      forks: r.forks,
      archived: r.archived,
      createdAt: r.createdAt.slice(0, 10),
      pushedAt: r.pushedAt ? r.pushedAt.slice(0, 10) : null,
      topics: r.topics || [],
      ...(r.copyOf ? { copyOf: r.copyOf } : {}),
    }))
    .sort(
      (a, b) =>
        b.stars - a.stars || (b.pushedAt || '').localeCompare(a.pushedAt || '') || a.fullName.localeCompare(b.fullName),
    );
  const result = {
    generatedFrom: 'docs/case-studies/issue-7/data/repositories.json',
    kinds: KINDS,
    fields: FIELDS,
    items,
  };
  if (write) fs.writeFileSync(outFile, JSON.stringify(result) + '\n');
  return result;
}

module.exports = { CLIENTS, FIELDS, KINDS, buildRepositories, fieldsOf, isNoise, kindOf, readCollected };
