import { useMemo, useState } from 'react';
import {
  classCount,
  codeAt,
  linksNotation,
  mathNotation,
  networkCount,
  representatives,
} from '../links/configurations';
import { COLORS } from '../links/glyph';
import { useLang, useResolvedTheme } from '../i18n/prefs';
import { plural } from '../i18n/plural';
import { formatNumber } from './format';
import Glyph from './Glyph';

const SIZES = [1, 2, 3, 4];
const PAGE = 243;
const SUPERSCRIPTS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const superscript = (k) =>
  String(k)
    .split('')
    .map((d) => SUPERSCRIPTS[d])
    .join('');
/** The page of one network (issue #17): /network/?code=0120. */
export const networkHref = (code, theme = 'dark') =>
  `/network/?code=${code.replace(/ /g, '')}${theme === 'light' ? '&palette=print' : ''}`;

const LINKS = { en: ['link', 'links'], ru: ['связь', 'связи', 'связей'] };
// "of N links": Russian needs the genitive after «из».
const OF_LINKS = { en: ['link', 'links'], ru: ['связи', 'связей', 'связей'] };
const REAL_LINKS = { en: ['real link', 'real links'], ru: ['настоящая связь', 'настоящие связи', 'настоящих связей'] };
const NETWORKS = { en: ['network', 'networks'], ru: ['сеть', 'сети', 'сетей'] };
const DIGITS = { en: ['digit', 'digits'], ru: ['цифра', 'цифры', 'цифр'] };
const CLASSES = { en: ['class', 'classes'], ru: ['класс', 'класса', 'классов'] };

/**
 * Every network of 1–4 links: all (N + 1)^(2N) codes in counting order, or
 * one network per renaming class. Symbols are drawn inline and shown page by
 * page, so even the 390,625 networks of 4 links never have to be enumerated.
 * "Only real references" (issue #13, off by default) leaves out every network
 * that refers to 0, so links refer only to each other or to themselves: N^(2N).
 */
export default function NetworkGallery({ initial = 2 }) {
  const theme = useResolvedTheme();
  const [n, setN] = useState(initial);
  const [classes, setClasses] = useState(false);
  const [real, setReal] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const { lang, t } = useLang();
  const number = (v) => formatNumber(v, lang);
  const words = (k, forms) => plural(k, lang, forms);
  const only = { real };
  const total = classes ? classCount(n, { real }) : networkCount(n, { real });
  const codes = useMemo(
    () =>
      classes
        ? representatives(n, { real }).slice(0, shown)
        : Array.from({ length: Math.min(shown, total) }, (_, i) => codeAt(n, i, { real })),
    [n, classes, real, shown, total],
  );
  const choose = (k, c, r = real) => {
    setN(k);
    setClasses(c);
    setReal(r);
    setShown(PAGE);
  };
  const first = codeAt(n, 0, only);
  const last = codeAt(n, networkCount(n, only) - 1, only);

  return (
    <div className="symbols">
      <p className="section__lead">
        {t({
          en: 'Each symbol is one network of links, and each link is one unbroken line in its own colour: a bar marks its source, an arrow its target, and its middle is the point other links refer to. Link 0 (0: 0 0) is “nothing”: it always exists and is never drawn, so a reference to 0 is a free end, and a link that refers to itself twice is a figure eight. These networks are also the alphabet of the rain in the background.',
          ru: 'Каждый символ — одна сеть связей, а каждая связь — одна непрерывная линия своего цвета: черта отмечает её начало, стрелка — конец, а середина — точку, на которую ссылаются другие связи. Связь 0 (0: 0 0) — это «ничто»: она существует всегда и никогда не рисуется, поэтому ссылка на 0 — это свободный конец, а связь, которая дважды ссылается на себя, — восьмёрка. Эти сети — ещё и алфавит дождя на фоне.',
        })}
      </p>
      <div className="symbols__tabs" role="group" aria-label={t({ en: 'Number of links', ru: 'Количество связей' })}>
        {SIZES.map((k) => (
          <button key={k} type="button" className="button" aria-pressed={k === n} onClick={() => choose(k, classes)}>
            {k} {words(k, LINKS)} <span className="mono">{number(networkCount(k, only))}</span>
          </button>
        ))}
        <button type="button" className="button" aria-pressed={classes} onClick={() => choose(n, !classes)}>
          {t({ en: 'One per renaming', ru: 'Без переименований' })}{' '}
          <span className="mono">{number(classCount(n, only))}</span>
        </button>
        <button type="button" className="button" aria-pressed={real} onClick={() => choose(n, classes, !real)}>
          {t({ en: 'Show only real references', ru: 'Только настоящие ссылки' })}{' '}
          <span className="mono">
            {number(classes ? classCount(n, { real: true }) : networkCount(n, { real: true }))}
          </span>
        </button>
      </div>

      <dl className="symbols__formula">
        <dt>{t({ en: 'math notation', ru: 'математическая нотация' })}</dt>
        <dd className="mono">
          {mathNotation(first)} … {mathNotation(last)} → {real ? n : n + 1}
          {superscript(2 * n)} = {number(networkCount(n, only))} {words(networkCount(n, only), NETWORKS)}
        </dd>
        <dt>{t({ en: 'links notation', ru: 'нотация связей' })}</dt>
        <dd className="mono">
          {linksNotation(first).join(' ')} … {linksNotation(last).join(' ')}
        </dd>
        <dd className="muted">
          {t({
            en: `${n} ${words(n, REAL_LINKS)} after the zero link 0: every link is written as its source and target, so a network is ${2 * n} ${words(2 * n, DIGITS)} in base ${n + 1}.`,
            ru: `${n} ${words(n, REAL_LINKS)} после нулевой связи 0: каждая связь записывается своим началом и концом, поэтому сеть — это ${2 * n} ${words(2 * n, DIGITS)} в системе счисления с основанием ${n + 1}.`,
          })}
          {real &&
            t({
              en: ` Only real references: networks that refer to 0 are left out, so every link refers to real links (each other or itself) and each digit is one of 1…${n}, ${n}${superscript(2 * n)} = ${number(networkCount(n, only))} ${words(networkCount(n, only), NETWORKS)}.`,
              ru: ` Только настоящие ссылки: сети со ссылками на 0 не показаны, каждая связь ссылается на настоящие связи (друг на друга или на себя), и каждая цифра — одна из 1…${n}, ${n}${superscript(2 * n)} = ${number(networkCount(n, only))} ${words(networkCount(n, only), NETWORKS)}.`,
            })}
          {classes &&
            t({
              en: ` ${number(classCount(n, only))} ${words(classCount(n, only), CLASSES)} remain when networks that only rename the links are counted once (Burnside’s lemma).`,
              ru: ` Если сети, которые отличаются только переименованием связей, считать один раз, остаётся ${number(classCount(n, only))} ${words(classCount(n, only), CLASSES)} (лемма Бёрнсайда).`,
            })}
        </dd>
        <dd className="symbols__legend">
          {COLORS.slice(0, n).map((color, i) => (
            <span key={color} style={{ color }}>
              ━ {t({ en: 'link', ru: 'связь' })} {i + 1}
            </span>
          ))}
        </dd>
      </dl>

      <ul
        className="symbols__grid"
        aria-label={`${classes ? t({ en: 'Renaming classes', ru: 'Классы переименований' }) : t({ en: 'Networks', ru: 'Сети' })} ${t({ en: 'of', ru: 'из' })} ${n} ${words(n, OF_LINKS)}`}
      >
        {codes.map((code) => (
          <li key={code} title={linksNotation(code).join(' ')}>
            <a className="symbols__card" href={networkHref(code, theme)}>
              <Glyph code={code} size={64} />
              <span className="mono">{mathNotation(code)}</span>
            </a>
          </li>
        ))}
      </ul>
      {total > shown && (
        <button type="button" className="button" onClick={() => setShown(shown + PAGE * 2)}>
          {t({
            en: `Show more (${number(total - shown)} left)`,
            ru: `Показать ещё (осталось ${number(total - shown)})`,
          })}
        </button>
      )}
    </div>
  );
}
