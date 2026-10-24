// Saving and sharing the picture of a network (issue #17): downloads of SVG,
// PNG, JPEG and WebP (drawn from the same SVG on a canvas), the network as a
// links notation file, copies to the clipboard, the share sheet of the system
// (Web Share API, with the image when the browser can share files) and links
// that open the share dialogs of social networks.

/** "links-network-01-20.png". */
export const fileName = (code, ext) => `links-network-${code.replace(/[ ;,]/g, '-').slice(0, 160)}.${ext}`;

export const svgBlob = (svg) => new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });

export const FORMATS = [
  { id: 'png', type: 'image/png', label: 'PNG' },
  { id: 'jpeg', type: 'image/jpeg', label: 'JPEG', ext: 'jpg' },
  { id: 'webp', type: 'image/webp', label: 'WebP' },
];

/**
 * The SVG drawn on a canvas of `width` × `height` as a PNG, JPEG or WebP blob.
 * JPEG has no transparency, so `fill` is painted under it first.
 */
export function rasterize(svg, { width, height, type = 'image/png', quality = 0.92, fill = null }) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(svgBlob(svg));
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (fill) {
          context.fillStyle = fill;
          context.fillRect(0, 0, width, height);
        }
        context.drawImage(image, 0, 0, width, height);
        canvas.toBlob(
          (blob) =>
            blob?.type === type ? resolve(blob) : reject(new Error(`${type} is not supported; use PNG instead`)),
          type,
          quality,
        );
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('The SVG could not be drawn'));
    };
    image.src = url;
  });
}

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
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  const both = encodeURIComponent(`${text} ${url}`);
  return [
    { id: 'x', name: 'X (Twitter)', href: `https://x.com/intent/tweet?text=${t}&url=${u}` },
    { id: 'telegram', name: 'Telegram', href: `https://t.me/share/url?url=${u}&text=${t}` },
    { id: 'vk', name: 'VK', href: `https://vk.com/share.php?url=${u}&title=${t}` },
    { id: 'facebook', name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { id: 'linkedin', name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { id: 'reddit', name: 'Reddit', href: `https://www.reddit.com/submit?url=${u}&title=${t}` },
    { id: 'bluesky', name: 'Bluesky', href: `https://bsky.app/intent/compose?text=${both}` },
    { id: 'mastodon', name: 'Mastodon', href: `https://mastodonshare.com/?text=${t}&url=${u}` },
    { id: 'whatsapp', name: 'WhatsApp', href: `https://wa.me/?text=${both}` },
    { id: 'email', name: 'E-mail', href: `mailto:?subject=${t}&body=${both}` },
  ];
}
