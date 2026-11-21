// Saving and sharing the picture of a network (issue #17): downloads of SVG,
// PNG, JPEG and WebP (drawn from the same SVG on a canvas), the network as a
// links notation file, copies to the clipboard, the share sheet of the system
// (Web Share API, with the image when the browser can share files) and links
// that open the share dialogs of social networks.
import { networkShareTargets } from '@link-foundation/ui-components/links-view';

/** "links-network-01-20.png". */
export const fileName = (code, ext) => `links-network-${code.replace(/[ ;,]/g, '-').slice(0, 160)}.${ext}`;

export const svgBlob = (svg) => new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });

export const FORMATS = [
  { id: 'png', type: 'image/png', label: 'PNG' },
  { id: 'jpeg', type: 'image/jpeg', label: 'JPEG', ext: 'jpg' },
  { id: 'webp', type: 'image/webp', label: 'WebP' },
];

/** Saves `blob` as a file named `name`. */
export function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const canCopyText = () => Boolean(navigator.clipboard?.writeText);
export const canCopyImage = () =>
  typeof ClipboardItem !== 'undefined' &&
  Boolean(navigator.clipboard?.write) &&
  (!ClipboardItem.supports || ClipboardItem.supports('image/png'));
export const copyText = (text) =>
  canCopyText() ? navigator.clipboard.writeText(text) : Promise.reject(new Error('Select and copy the link manually'));

/** Copies an image blob (PNG: the format every clipboard takes). */
export function copyImage(blob) {
  if (!canCopyImage()) {
    // The caller may already have started conversion; consume a rejection too.
    Promise.resolve(blob).catch(() => {});
    return Promise.reject(new Error('Images cannot be copied in this browser; download PNG instead'));
  }
  // Call write during the click, before rasterization resolves. Safari otherwise
  // loses user activation across the canvas/image async boundary (WebKit #222262).
  try {
    return navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  } catch (error) {
    Promise.resolve(blob).catch(() => {});
    return Promise.reject(error);
  }
}

/** Whether the system share sheet can share `files` (or just a link without them). */
export function canShare(files) {
  if (typeof navigator === 'undefined' || !navigator.share) return false;
  if (!files) return true;
  return Boolean(navigator.canShare?.({ files }));
}

/** Links that open the share dialog of each network with `url` and `text`. */
export function shareTargets(url, text) {
  const targets = networkShareTargets(url, text);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  // Keep the established endpoints, instance chooser and complete email body.
  targets.X = `https://x.com/intent/tweet?text=${t}&url=${u}`;
  targets.Mastodon = `https://mastodonshare.com/?text=${t}&url=${u}`;
  targets['e-mail'] = `mailto:?subject=${t}&body=${encodeURIComponent(`${text} ${url}`)}`;
  const labels = { X: 'X (Twitter)', 'e-mail': 'E-mail' };
  return Object.entries(targets).map(([key, href]) => ({
    id: key.toLowerCase().replace('-', ''),
    name: labels[key] ?? key,
    href,
  }));
}
