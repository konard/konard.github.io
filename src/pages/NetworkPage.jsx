import { useEffect, useMemo, useRef, useState } from 'react';
import './settings.css';
import './network.css';
import Layout from '../components/Layout';
import { decode, encode, mathNotation } from '../links/configurations';
import { solveCollisions } from '../links/collisions';
import { linkGaps, withGaps } from '../links/gaps';
import { parseCode, removeLink, theoryNotation } from '../links/edit';
import { networkSvg } from '../links/render';
import {
  linkColors,
  linkTurns,
  normalizeStyle,
  shapeOfStyle,
  styleFromParams,
  styleToParams,
  withColor,
  withTurns,
  withSpacing,
} from '../links/style';
import { LANGS, useLang } from '../i18n/prefs';
import { LinksTable, Notations, randomLinks, stepped } from './NetworkEditor';
import NetworkShare from './NetworkShare';
import { Looks, StyleSections } from './NetworkStyle';
import { solverJob } from '../links/solver-job';
import { useCollisionSolver } from './useCollisionSolver';
import { useNetworkHistory } from './useNetworkHistory';

/** The network of the theory's example: two points and the link between them. */
export const DEFAULT_CODE = '11 22 12';

const SECTIONS = [
  ['notations', { en: 'Notations', ru: 'Нотации' }],
  ['links', { en: 'Links', ru: 'Связи' }],
  ['style', { en: 'Style', ru: 'Оформление' }],
  ['share', { en: 'Share', ru: 'Поделиться' }],
];

/** The network and the style of the picture in a query string (?code=112212&end=dot…). */
export function readNetwork(search) {
  const params = new URLSearchParams(search);
  const code = parseCode(params.get('code') || '') || DEFAULT_CODE;
  return { links: decode(code), style: styleFromParams(params) };
}

/** "?code=112212&…": non-default image options and the explicit page language, if present. */
export function networkQuery(links, style, lang = null) {
  const params = styleToParams(style);
  if (LANGS.includes(lang)) params.set('lang', lang);
  return `?code=${encode(links).replace(/ /g, '')}${params.size ? `&${params}` : ''}`;
}

/** The page of one network (issue #17): view it, edit it in every notation, style its picture and share it. */
export default function NetworkPage() {
  const { t } = useLang();
  const [initial] = useState(() => readNetwork(window.location.search));
  const [links, setLinks] = useState(initial.links);
  const [style, setStyleState] = useState(initial.style);
  const notation = style.notation;
  const setStyle = (next) => {
    // Manual geometry edits start a new drawing frame. Color/background edits
    // keep the applied spacing and its pinned positions.
    const changed = [...Object.keys(shapeOfStyle(style, links)), 'gaps'].some(
      (key) => !['frame', 'strokeWidth', 'linecap', 'linkGaps'].includes(key) && next[key] !== style[key],
    );
    setStyleState(normalizeStyle(changed ? { ...next, frame: '' } : next));
  };
  const n = links.length;
  const code = encode(links);
  const query = networkQuery(links, style, new URLSearchParams(window.location.search).get('lang'));

  useNetworkHistory(query);
  // Existing links may open a section directly, such as /network/?code=…#share.
  useEffect(() => {
    const target = window.location.hash && document.getElementById(window.location.hash.slice(1));
    target?.scrollIntoView?.();
  }, []);

  const shape = shapeOfStyle(style, links);
  const solverOptions = {
    debug: style.solveDebug,
    range: style.solveRange,
    step: style.solveStep,
    adjustGaps: style.solveGaps,
    gapRange: style.solveGapRange,
    middleRange: style.solveMiddleRange,
  };
  const shapeKey = JSON.stringify([links, shape, solverOptions]);
  const { result: solved, busy, error } = useCollisionSolver(shapeKey, style.solve);
  const pendingApply = useRef(null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState(null);
  useEffect(() => () => pendingApply.current?.cancel(), [shapeKey]);
  const svg = useMemo(
    () =>
      networkSvg(links, style, {
        notation,
        extraTurns: solved?.delta,
        extraGaps: solved?.linkGaps,
        extraFrame: solved?.frame,
      }),
    [links, style, notation, solved],
  );
  const colors = linkColors(style, n);
  const turns = linkTurns(style, links);
  const gaps = linkGaps(style, n);

  const changeLinks = (next) => {
    setStyle({ ...style, frame: '', ...(next.length !== n ? { order: '' } : {}) });
    setLinks(next);
  };
  const remove = (k) => {
    const keep = (list) => list.filter((_, i) => i !== k - 1);
    setLinks(removeLink(links, k));
    let next = style.turns ? withTurns(style, keep(turns)) : style;
    next = withGaps(next, keep(gaps));
    if (style.palette === 'custom') next = { ...next, colors: keep(linkColors(style, n)).join(',') };
    setStyle({ ...next, order: '', frame: '' });
  };
  const turn = (i, end, value) =>
    setStyle(
      withTurns(
        style,
        turns.map((pair, k) => (k === i ? pair.map((a, e) => (e === end ? value : a)) : pair)),
      ),
    );
  const applyResult = (found) => setStyleState((current) => withSpacing(current, found));
  const applySolved = async () => {
    if (solved || typeof Worker === 'undefined') {
      applyResult(solved || solveCollisions(links, shape, solverOptions));
      return;
    }
    setApplying(true);
    setApplyError(null);
    const job = solverJob([links, shape, solverOptions]);
    pendingApply.current = job;
    try {
      applyResult(await job.promise);
    } catch (error) {
      if (error.name !== 'AbortError') setApplyError(error.message);
    } finally {
      if (pendingApply.current === job) pendingApply.current = null;
      setApplying(false);
    }
  };

  const url = `${window.location.origin}/network/${query}`;
  const text = `${t({ en: 'Links network', ru: 'Сеть связей' })} ${mathNotation(code)}: ${theoryNotation(links, notation)}`;

  return (
    <Layout page="network" sections={SECTIONS}>
      <section className="section network" id="top">
        <h1 className="section__title">
          {t({ en: 'Links network', ru: 'Сеть связей' })}{' '}
          <span className="mono network__code">{mathNotation(code)}</span>
        </h1>
        <p className="section__lead">
          {t({
            en: 'One network of doublet links: change it in any notation or link by link, change every detail of its picture and save or share it. The address of the page keeps everything, so a link opens exactly this picture.',
            ru: 'Одна сеть дуплетных связей: меняйте её в любой нотации или по одной связи, меняйте каждую деталь её картинки, сохраняйте и делитесь. Адрес страницы хранит всё, поэтому ссылка открывает ровно эту картинку.',
          })}{' '}
          <a href="/art/#symbols">{t({ en: 'All networks of 1–4 links', ru: 'Все сети из 1–4 связей' })}</a>
        </p>
        <div className="network__layout">
          <figure className="network__view">
            <div
              aria-busy={busy || applying}
              className={`network__preview${style.background === 'transparent' ? ' is-transparent' : ''}`}
              style={{ aspectRatio: `${style.width} / ${style.height}` }}
              // The SVG names itself (role img, aria-label). It is built from normalized
              // options only and its caption is escaped (src/links/render.js).
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            <figcaption className="mono">
              {theoryNotation(links, notation)}
              {(busy || applying) && (
                <span role="status">
                  {' · '}
                  {t({ en: 'Spacing…', ru: 'Подбор зазоров…' })}
                </span>
              )}
              {(error || applyError) && (
                <span role="alert">
                  {' · '}
                  {t({ en: 'Could not calculate spacing', ru: 'Не удалось подобрать зазоры' })}: {error || applyError}
                </span>
              )}
              {solved && (
                <span className="network__score">
                  {' · '}
                  {t({ en: 'overlaps', ru: 'наложения' })} {solved.before.toFixed(1)} → {solved.after.toFixed(1)}
                </span>
              )}
            </figcaption>
          </figure>
          <div className="network__panels">
            <section id="notations" className="network__panel" aria-labelledby="notations-title">
              <h2 id="notations-title">{t({ en: 'Notations', ru: 'Нотации' })}</h2>
              <Notations links={links} notation={notation} onLinks={changeLinks} />
            </section>
            <section id="links" className="network__panel" aria-labelledby="links-title">
              <h2 id="links-title">{t({ en: 'Links', ru: 'Связи' })}</h2>
              <LinksTable
                links={links}
                colors={colors}
                turns={turns}
                turnDefaults={linkTurns({ ...style, turns: '' }, links)}
                gaps={gaps}
                style={style}
                onGap={(i, k, value) =>
                  setStyle(
                    withGaps(
                      style,
                      gaps.map((row, j) => (j === i ? row.map((v, column) => (column === k ? value : v)) : row)),
                    ),
                  )
                }
                onLinks={changeLinks}
                onRemove={remove}
                onColor={(i, value) => setStyle(withColor(style, n, i, value))}
                onTurn={turn}
                onStep={(step) => changeLinks(stepped(links, step))}
                onRandom={() => changeLinks(randomLinks(n))}
              />
            </section>
            <section className="network__panel" id="style" aria-labelledby="style-title">
              <h2 id="style-title">{t({ en: 'Style of the picture', ru: 'Оформление картинки' })}</h2>
              <p className="network__lead">
                {t({
                  en: 'Start from a look and change any detail. A card like in the gallery, or no card at all and only the lines on a black or transparent background: both are here.',
                  ru: 'Начните с готового оформления и меняйте любую деталь. Карточка как в галерее или без карточки, только линии на чёрном или прозрачном фоне: есть и то, и другое.',
                })}
              </p>
              <Looks style={style} onStyle={setStyle} />
              <div className="network__styles">
                <StyleSections links={links} style={style} onStyle={setStyle}>
                  <div className="network__actions">
                    <button
                      type="button"
                      className="button button--small"
                      disabled={busy || applying || Boolean(error)}
                      onClick={applySolved}
                    >
                      {t({ en: 'Apply turns and gaps to links', ru: 'Применить повороты и зазоры связей' })}
                    </button>
                    <button
                      type="button"
                      className="button button--small"
                      disabled={!style.turns}
                      onClick={() => setStyle({ ...style, turns: '' })}
                    >
                      {t({ en: 'Clear all turns', ru: 'Убрать все повороты' })}
                    </button>
                  </div>
                </StyleSections>
              </div>
            </section>
            <section id="share" className="network__panel" aria-labelledby="share-title">
              <h2 id="share-title">{t({ en: 'Save and share', ru: 'Сохранить и поделиться' })}</h2>
              <NetworkShare
                code={code}
                links={links}
                svg={svg}
                style={style}
                url={url}
                text={text}
                busy={busy || applying}
              />
            </section>
          </div>
        </div>
      </section>
    </Layout>
  );
}
