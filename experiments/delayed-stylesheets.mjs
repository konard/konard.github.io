import { inlineJSON } from '../scripts/inline-json.mjs';

// Delay CSS until after module execution to reproduce the Safari canvas race.
export function delayedStylesheets(html) {
  return html.replace(
    /<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
    (_, href) =>
      `<script type="module">setTimeout(() => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = ${inlineJSON(href)}; document.head.append(l); }, 300)</script>`,
  );
}
