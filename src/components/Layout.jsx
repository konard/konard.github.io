import '../App.css';
import '../App.sections.css';
import '../Layout.css';
import '../pages/pages.css';
// Responsive and print overrides must come last.
import '../App.media.css';
import { profile } from '../data/profile';
import { PAGES } from '../pages/pages';
import Cosmos from './Cosmos';

/**
 * Shared frame of every page: the cosmic background, the page navigation
 * (plus optional in-page section links) and the footer.
 */
export default function Layout({ page, sections = null, children, footer = null }) {
  return (
    <div className="app">
      <Cosmos />
      <header className="topbar">
        <div className="topbar__row">
          <a className="nav__brand mono" href="/">
            konard<span className="nav__cursor">_</span>
          </a>
          <nav className="pages" aria-label="Pages">
            <ul>
              {PAGES.map((p) => (
                <li key={p.id}>
                  <a href={p.href} aria-current={p.id === page ? 'page' : undefined}>
                    {p.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        {sections && (
          <nav className="nav" aria-label="Sections">
            <a className="nav__top mono" href="#top" aria-label="Back to top">
              ↑
            </a>
            <ul>
              {sections.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`}>{label}</a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <main>{children}</main>

      <footer className="footer">
        <span className="mono">{profile.motto}</span>
        <span>
          {footer}
          Background: links of the{' '}
          <a href="https://github.com/link-foundation/meta-theory" target="_blank" rel="noopener noreferrer">
            links theory
          </a>{' '}
          in the{' '}
          <a href="https://github.com/link-foundation/links-visuals" target="_blank" rel="noopener noreferrer">
            links-visuals
          </a>{' '}
          style, raining as in{' '}
          <a href="https://github.com/konard/twittermatrix" target="_blank" rel="noopener noreferrer">
            twittermatrix
          </a>{' '}
          ·{' '}
          <a href="https://github.com/konard/konard.github.io" target="_blank" rel="noopener noreferrer">
            source
          </a>
        </span>
      </footer>
    </div>
  );
}
