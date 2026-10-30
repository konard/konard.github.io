import { useEffect, useId, useRef } from 'react';
import { useLang } from '../i18n/prefs';
import { loadWidget } from './socialWidgets';

/** Official widgets create responsive, content-height iframes. We never read a
 * cross-origin document or accept unvalidated postMessage height instructions.
 * Defer provider work until near the viewport, cancel late results on changes,
 * and expose the existing archive if a blocked/deleted post cannot render.
 */
export default function SocialEmbed({ embed, theme, onError }) {
  const host = useRef(null);
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { t, lang } = useLang();
  useEffect(() => {
    const root = host.current;
    // Each generation owns a separate node: a late theme/language request must
    // never clear the new widget that has replaced it.
    const container = document.createElement('div');
    container.id = `social-${id}-${theme}-${lang}`;
    root.append(container);
    let cancelled = false;
    let loaded = false;
    let timer;
    let observer;
    const debug = (state, error) => {
      if (new URLSearchParams(location.search).get('debugEmbeds') === '1')
        console.debug('[social-embed]', { provider: embed.type, id: embed.id, state, error: error?.message });
    };
    const ready = () => {
      if (cancelled || loaded) return;
      loaded = true;
      clearTimeout(timer);
      root.dataset.loaded = 'true';
      const frame = container.querySelector('iframe');
      if (frame && !frame.title) frame.title = `${embed.type} post`;
      debug('ready');
    };
    const fail = (error) => {
      if (!cancelled) {
        clearTimeout(timer);
        debug('fallback', error);
        onError();
      }
    };
    const start = async () => {
      if (cancelled) return;
      debug('loading');
      timer = setTimeout(() => fail(new Error('Widget did not render within 12 seconds')), 12000);
      try {
        if (embed.type === 'x') {
          if (!window.twttr?.widgets) await loadWidget('https://platform.twitter.com/widgets.js');
          if (cancelled) return;
          const node = await window.twttr.widgets.createTweet(embed.id, container, {
            theme,
            lang,
            width: 550,
            align: 'center',
            dnt: true,
          });
          if (cancelled) {
            container.replaceChildren();
            return;
          }
          if (!node) throw new Error('Post is unavailable');
          ready();
        } else {
          // Telegram and VK install their own origin/source-checked resize handlers.
          observer = new MutationObserver(() => {
            const frame = container.querySelector('iframe');
            if (frame && (parseFloat(frame.style.height) > 0 || Number(frame.height) > 0)) ready();
          });
          observer.observe(container, { childList: true, subtree: true, attributes: true });
          if (embed.type === 'telegram') {
            const script = document.createElement('script');
            script.src = 'https://telegram.org/js/telegram-widget.js?22';
            script.async = true;
            script.setAttribute('data-telegram-post', embed.id);
            script.setAttribute('data-width', '100%');
            if (theme === 'dark') script.setAttribute('data-dark', '1');
            script.onerror = fail;
            container.append(script);
          } else {
            if (!window.VK?.Widgets) await loadWidget('https://vk.com/js/api/openapi.js?169');
            if (cancelled) return;
            const [owner, post] = embed.id.split('_');
            window.VK.Widgets.Post(container.id, Number(owner), Number(post), embed.hash, { width: '100%' });
          }
        }
      } catch (error) {
        fail(error);
      }
    };
    let intersection;
    if (typeof IntersectionObserver === 'function') {
      intersection = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            intersection.disconnect();
            start();
          }
        },
        { rootMargin: '400px' },
      );
      intersection.observe(root);
    } else start();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      intersection?.disconnect();
      observer?.disconnect();
      container.remove();
      delete root.dataset.loaded;
    };
  }, [embed.id, embed.type, embed.hash, theme, lang, onError, id]);
  return (
    <div
      id={`social-${id}`}
      ref={host}
      className={`post__widget post__widget--${embed.type}`}
      data-social-embed={embed.type}
      aria-label={t({ en: 'Original social post', ru: 'Оригинальная запись' })}
    />
  );
}
