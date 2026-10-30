// Provider scripts own their iframe sizing and message protocols. Load each once;
// failed script requests may be retried from the archive's "Show embed" button.
const requests = new Map();
export function loadWidget(src) {
  if (requests.has(src)) return requests.get(src);
  const request = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    const fail = () => {
      clearTimeout(timer);
      requests.delete(src);
      script.remove();
      reject(new Error('Widget script unavailable'));
    };
    const timer = setTimeout(fail, 10000);
    script.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    script.onerror = fail;
    document.head.append(script);
  });
  requests.set(src, request);
  return request;
}

export function embedUrl(embed, theme) {
  if (embed?.type === 'x' && /^\d+$/.test(embed.id))
    return `https://platform.twitter.com/embed/Tweet.html?id=${embed.id}&theme=${theme}&dnt=true`;
  if (embed?.type === 'telegram' && /^[a-zA-Z0-9_]+\/\d+$/.test(embed.id))
    return `https://t.me/${embed.id}?embed=1&mode=tme${theme === 'dark' ? '&dark=1' : ''}`;
  if (embed?.type === 'vk' && /^-?\d+_\d+$/.test(embed.id) && /^[a-zA-Z0-9_-]+$/.test(embed.hash || '')) {
    const [owner, post] = embed.id.split('_');
    return `https://vk.com/widget_post.php?owner_id=${owner}&post_id=${post}&hash=${embed.hash}&width=auto`;
  }
  return null;
}
