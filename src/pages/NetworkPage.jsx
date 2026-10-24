import { useEffect, useMemo, useState } from 'react';
import './settings.css';
import './network.css';
import Layout from '../components/Layout';
import { decode, encode, mathNotation } from '../links/configurations';
import { solveCollisions } from '../links/collisions';
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
} from '../links/style';
import { useNotation } from '../links/notation';
import { useLang } from '../i18n/prefs';
import { LinksTable, Notations, randomLinks, stepped } from './NetworkEditor';
import NetworkShare from './NetworkShare';
import { Looks, StyleSections } from './NetworkStyle';

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

/** "?code=112212&…": the code without spaces, then only the options that differ from the defaults. */
export function networkQuery(links, style) {
  const params = styleToParams(style);
  return `?code=${encode(links).replace(/ /g, '')}${params.size ? `&${params}` : ''}`;
}

/** The page of one network (issue #17): view it, edit it in every notation, style its picture and share it. */
export default function NetworkPage() {
  const { t } = useLang();
  const { notation } = useNotation();
  const [initial] = useState(() => readNetwork(window.location.search));
  const [links, setLinks] = useState(initial.links);
  const [style, setStyleState] = useState(initial.style);
  const setStyle = (next) => setStyleState(normalizeStyle(next));
  const n = links.length;
  const code = encode(links);
  const query = networkQuery(links, style);

  // The address always opens exactly this picture, without adding a history entry per change.
  useEffect(() => {
    window.history.replaceState(null, '', `${window.location.pathname}${query}${window.location.hash}`);
  }, [query]);
  // The share icon of a gallery card opens /network/?code=…#share: the section is drawn after load.
  useEffect(() => {
    const target = window.location.hash && document.getElementById(window.location.hash.slice(1));
    target?.scrollIntoView?.();
  }, []);

  const shape = shapeOfStyle(style, n);
  const shapeKey = JSON.stringify([code, shape, style.solveRange, style.solveStep]);
  // The experimental solver of overlaps; it runs only when it is switched on or asked for.
  const solved = useMemo(
    () => (style.solve ? solveCollisions(links, shape, { range: style.solveRange, step: style.solveStep }) : null),
    // shapeKey stands for links, shape and the options of the solver.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shapeKey, style.solve],
  );
  const svg = useMemo(
    () => networkSvg(links, style, { notation, extraTurns: solved?.delta }),
    [links, style, notation, solved],
  );
  const colors = linkColors(style, n);
  const turns = linkTurns(style, n);

  const changeLinks = (next) => setLinks(next);
  const remove = (k) => {
    const keep = (list) => list.filter((_, i) => i !== k - 1);
    setLinks(removeLink(links, k));
    let next = withTurns(style, keep(linkTurns(style, n)));
    if (style.palette === 'custom') next = { ...next, colors: keep(linkColors(style, n)).join(',') };
    setStyle(next);
  };
  const turn = (i, end, value) =>
    setStyle(
      withTurns(
        style,
        turns.map((pair, k) => (k === i ? pair.map((a, e) => (e === end ? value : a)) : pair)),
      ),
    );
  const applySolved = () => {
    const found = solveCollisions(links, shape, { range: style.solveRange, step: style.solveStep });
    setStyle({ ...withTurns(style, found.turns), solve: false });
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
              className={`network__preview${style.background === 'transparent' ? ' is-transparent' : ''}`}
              style={{ aspectRatio: `${style.width} / ${style.height}` }}
              // The SVG names itself (role img, aria-label). It is built from normalized
              // options only and its caption is escaped (src/links/render.js).
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            <figcaption className="mono">
              {theoryNotation(links, notation)}
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
                onLinks={changeLinks}
                onRemove={remove}
                onColor={(i, value) => setStyle(withColor(style, n, i, value))}
                onTurn={turn}
                onStep={(step) => setLinks(stepped(links, step))}
                onRandom={() => setLinks(randomLinks(n))}
              />
            </section>
            <section id="style" className="network__panel" aria-labelledby="style-title">
              <h2 id="style-title">{t({ en: 'Style of the picture', ru: 'Оформление картинки' })}</h2>
              <p className="network__lead">
                {t({
                  en: 'Start from a look and change any detail. A card like in the gallery, or no card at all and only the lines on a black or transparent background: both are here.',
                  ru: 'Начните с готового оформления и меняйте любую деталь. Карточка как в галерее или без карточки, только линии на чёрном или прозрачном фоне: есть и то, и другое.',
                })}
              </p>
              <Looks style={style} onStyle={setStyle} />
              <div className="network__styles">
                <StyleSections style={style} onStyle={setStyle}>
                  <div className="network__actions">
                    <button type="button" className="button button--small" onClick={applySolved}>
                      {t({ en: 'Write the turns into the table of links', ru: 'Записать повороты в таблицу связей' })}
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
              <NetworkShare code={code} links={links} svg={svg} style={style} url={url} text={text} />
            </section>
          </div>
        </div>
      </section>
    </Layout>
  );
}
