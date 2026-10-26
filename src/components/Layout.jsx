import '../App.css';
import '../App.sections.css';
import '../Layout.css';
import '../pages/pages.css';
// The skins (issue #13) and the technical fonts of the futuristic one.
import '@fontsource/orbitron/latin-500.css';
import '@fontsource/orbitron/latin-700.css';
import '@fontsource/electrolize/latin-400.css';
import '@fontsource/chakra-petch/latin-400.css';
import '@fontsource/chakra-petch/latin-600.css';
import '@fontsource/share-tech-mono/latin-400.css';
import '../skins.glass.css';
import '../skins.liquid.css';
import '../skins.future.css';
// Responsive and print overrides must come last.
import '../App.media.css';
import '../panels.css';
import { useEffect, useRef } from 'react';
import { motto } from '../data/motto';
import { centreCurrent, watchEdges } from './edges';
import { PAGES } from '../pages/pages';
import { useLang } from '../i18n/prefs';
import { useNotation } from '../links/notation';
import Cosmos from './Cosmos';
import LiquidRefraction from './LiquidRefraction';
import PrefSwitches from './PrefSwitches';
import Sound from './Sound';
import { watchPanelVisibility } from './panelVisibility';

/**
 * Shared frame of every page: the cosmic background, the page navigation
 * (plus optional in-page section links) and the footer with the link to the
 * settings of the background and the skin (issue #13).
 */
export default function Layout({ page, sections = null, children, footer = null }) {
  const { t } = useLang();
  const { n } = useNotation();
  const pages = useRef(null);
  const content = useRef(null);
  useEffect(() => watchPanelVisibility(content.current), []);
  const sectionList = useRef(null);
  const hasSections = Boolean(sections);
  // On a narrow screen the lists of pages and sections scroll sideways: show the current
  // page and fade the edges that have more links behind them.
  useEffect(() => {
    if (pages.current) centreCurrent(pages.current);
    return watchEdges([pages.current, sectionList.current].filter(Boolean));
  }, [page, hasSections]);
  return (
    <div className="app">
      <Cosmos />
      <LiquidRefraction />
      <Sound />
      <header className="topbar">
        <div className="topbar__row">
          <a className="nav__brand mono" href="/">
            konard<span className="nav__cursor">_</span>
          </a>
          <nav className="pages" aria-label="Pages">
            <ul ref={pages}>
              {PAGES.map((p) => (
                <li key={p.id}>
                  <a href={p.href} aria-current={p.id === page ? 'page' : undefined}>
                    {t(p.label)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <PrefSwitches />
        </div>
        {sections && (
          <nav className="nav" aria-label="Sections">
            <a className="nav__top mono" href="#top" aria-label={t({ en: 'Back to top', ru: 'Наверх' })}>
              ↑
            </a>
            <ul ref={sectionList}>
              {sections.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`}>{t(label)}</a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <main ref={content}>{children}</main>

      <footer className="footer">
        <span className="mono">{n(motto)}</span>
        <span>
          <a className="footer__settings" href="/settings/" aria-current={page === 'settings' ? 'page' : undefined}>
            {t({ en: 'Settings', ru: 'Настройки' })}
          </a>{' '}
          · {footer}
          {t({ en: 'Background: links of the', ru: 'Фон: связи' })}{' '}
          <a href="https://github.com/link-foundation/meta-theory" target="_blank" rel="noopener noreferrer">
            {t({ en: 'links theory', ru: 'теории связей' })}
          </a>{' '}
          {t({ en: 'in the', ru: 'в стиле' })}{' '}
          <a href="https://github.com/konard/links-visuals" target="_blank" rel="noopener noreferrer">
            links-visuals
          </a>
          {t({ en: ' style, raining as in', ru: ', падающие как в' })}{' '}
          <a href="https://github.com/konard/twittermatrix" target="_blank" rel="noopener noreferrer">
            twittermatrix
          </a>{' '}
          ·{' '}
          <a href="https://github.com/konard/konard.github.io" target="_blank" rel="noopener noreferrer">
            {t({ en: 'source', ru: 'исходный код' })}
          </a>
        </span>
      </footer>
    </div>
  );
}
