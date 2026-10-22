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
import { useLang } from '../i18n/prefs';
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
 */
export default function NetworkGallery({ initial = 2 }) {
  const [n, setN] = useState(initial);
  const [classes, setClasses] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const { lang, t } = useLang();
  const number = (v) => formatNumber(v, lang);
  const words = (k, forms) => plural(k, lang, forms);
  const total = classes ? classCount(n) : networkCount(n);
  const codes = useMemo(
    () =>
      classes
        ? representatives(n).slice(0, shown)
        : Array.from({ length: Math.min(shown, total) }, (_, i) => codeAt(n, i)),
    [n, classes, shown, total],
  );
  const choose = (k, c) => {
    setN(k);
    setClasses(c);
    setShown(PAGE);
  };

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
            {k} {words(k, LINKS)} <span className="mono">{number(networkCount(k))}</span>
          </button>
        ))}
        <button type="button" className="button" aria-pressed={classes} onClick={() => choose(n, !classes)}>
          {t({ en: 'One per renaming', ru: 'Без переименований' })}{' '}
          <span className="mono">{number(classCount(n))}</span>
        </button>
      </div>

      <dl className="symbols__formula">
        <dt>{t({ en: 'math notation', ru: 'математическая нотация' })}</dt>
        <dd className="mono">
          {mathNotation(codeAt(n, 0))} … {mathNotation(codeAt(n, networkCount(n) - 1))} → {n + 1}
          {superscript(2 * n)} = {number(networkCount(n))} {words(networkCount(n), NETWORKS)}
        </dd>
        <dt>{t({ en: 'links notation', ru: 'нотация связей' })}</dt>
        <dd className="mono">
          {linksNotation(codeAt(n, 0)).join(' ')} … {linksNotation(codeAt(n, networkCount(n) - 1)).join(' ')}
        </dd>
        <dd className="muted">
          {t({
            en: `${n} ${words(n, REAL_LINKS)} after the zero link 0: every link is written as its source and target, so a network is ${2 * n} ${words(2 * n, DIGITS)} in base ${n + 1}.`,
            ru: `${n} ${words(n, REAL_LINKS)} после нулевой связи 0: каждая связь записывается своим началом и концом, поэтому сеть — это ${2 * n} ${words(2 * n, DIGITS)} в системе счисления с основанием ${n + 1}.`,
          })}
          {classes &&
            t({
              en: ` ${number(classCount(n))} ${words(classCount(n), CLASSES)} remain when networks that only rename the links are counted once (Burnside’s lemma).`,
              ru: ` Если сети, которые отличаются только переименованием связей, считать один раз, остаётся ${number(classCount(n))} ${words(classCount(n), CLASSES)} (лемма Бёрнсайда).`,
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
            <Glyph code={code} size={64} />
            <span className="mono">{mathNotation(code)}</span>
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
