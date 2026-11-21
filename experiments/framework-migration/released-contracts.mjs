// Print small public-API reproductions against the packages in package-lock.json.
import {
  createDoubletProvider,
  createNetworkEditorProvider,
  networkShareTargets,
  readDoubletOptions,
} from '@link-foundation/ui-components/links-view';
import { parseLinks, parseNumber, parseTheory } from '@link-foundation/ui-components/links-view/configurations';
import { telegramProvider } from '@link-foundation/ui-components/embed/providers/telegram';
import brands from '@link-foundation/ui-components/dist/icons/brand.js';
import { JSDOM } from 'jsdom';

const accepted = [
  [0, 1],
  [2, 0],
];
const notation = [
  [parseLinks, '((1: 0 1))', 'error'],
  [parseLinks, '(1: 0, 1) (2: 2, 0)', accepted],
  [parseLinks, '1:\n  0\n  1\n2:\n  2\n  0\n', accepted],
  [parseNumber, '0120', accepted],
  [parseNumber, '[0, 1, 2, 0]_3', accepted],
  [parseTheory, 'N² = {1 ↦ (0, 1), 2 ↦ (2, 0)}', accepted],
  [parseTheory, '1 -> (0 1), 2 -> (2 0)', accepted],
  [parseTheory, '{(0, 1), (2, 0)}', accepted],
];
const unsupported = [];
for (const option of ['(forceCharge: 1)', '(linejoin: bevel)']) {
  try {
    readDoubletOptions(option, 2);
  } catch (error) {
    unsupported.push({ option, error: error.message });
  }
}
const { window } = new JSDOM('<div id="post"></div>');
const post = window.document.getElementById('post');
let ready = 0;
let unavailable = 0;
const cleanup = telegramProvider.render(post, {
  url: 'https://t.me/public_channel/42?embed=1',
  labels: { title: 'Telegram post' },
  ready: () => ready++,
  unavailable: () => unavailable++,
});
const iframe = post.querySelector('iframe');
iframe.dispatchEvent(new window.Event('load'));
const telegram = { height: iframe.style.height, ready, unavailable };
cleanup();
window.close();

console.log(
  JSON.stringify(
    {
      notation: notation.map(([parse, input, expected]) => ({
        parse: parse.name,
        input,
        expected,
        actual: parse(input),
      })),
      providerMethods: {
        doublet: Object.keys(createDoubletProvider()),
        editor: Object.keys(createNetworkEditorProvider()),
      },
      unsupported,
      share: networkShareTargets('https://example.test/network/', 'Example'),
      telegram,
      bundledBrands: Object.keys(brands.icons),
    },
    null,
    2,
  ),
);
