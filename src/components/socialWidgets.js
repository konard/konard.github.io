import { loadEmbedScript } from '@link-foundation/ui-components/embed';

// Provider scripts own their iframe sizing and message protocols. Load each once;
// failed script requests may be retried from the archive's "Show embed" button.
export const loadWidget = (src) => loadEmbedScript(document, src);

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
