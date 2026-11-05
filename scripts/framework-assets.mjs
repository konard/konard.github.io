// Vite recognizes new URL(..., import.meta.url), but not globalThis.URL.
// Keep the pinned package unmodified while letting Vite bundle the inspector's
// own assets. Remove with the upstream browser packaging fix.
export const frameworkAssets = () => ({
  name: 'framework-assets',
  enforce: 'pre',
  transform(code, id) {
    if (!/\/node_modules\/@link-foundation\/ui-devmode\/src\/(inspector|agent-instruction)\.js$/.test(id)) return null;
    return { code: code.replaceAll('new globalThis.URL(', 'new URL('), map: null };
  },
});
