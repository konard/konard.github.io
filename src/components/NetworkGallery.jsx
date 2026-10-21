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
const plural = (k) => (k === 1 ? 'link' : 'links');

/**
 * Every network of 1–4 links: all (N + 1)^(2N) codes in counting order, or
 * one network per renaming class. Symbols are drawn inline and shown page by
 * page, so even the 390,625 networks of 4 links never have to be enumerated.
 */
export default function NetworkGallery({ initial = 2 }) {
  const [n, setN] = useState(initial);
  const [classes, setClasses] = useState(false);
  const [shown, setShown] = useState(PAGE);
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
        Each symbol is one network of links, and each link is one unbroken line in its own colour: a bar marks its
        source, an arrow its target, and its middle is the point other links refer to. Link 0 (0: 0 0) is “nothing”: it
        always exists and is never drawn, so a reference to 0 is a free end, and a link that refers to itself twice is a
        figure eight. These networks are also the alphabet of the rain in the background.
      </p>
      <div className="symbols__tabs" role="group" aria-label="Number of links">
        {SIZES.map((k) => (
          <button key={k} type="button" className="button" aria-pressed={k === n} onClick={() => choose(k, classes)}>
            {k} {plural(k)} <span className="mono">{formatNumber(networkCount(k))}</span>
          </button>
        ))}
        <button type="button" className="button" aria-pressed={classes} onClick={() => choose(n, !classes)}>
          One per renaming <span className="mono">{formatNumber(classCount(n))}</span>
        </button>
      </div>

      <dl className="symbols__formula">
        <dt>math notation</dt>
        <dd className="mono">
          {mathNotation(codeAt(n, 0))} … {mathNotation(codeAt(n, networkCount(n) - 1))} → {n + 1}
          {superscript(2 * n)} = {formatNumber(networkCount(n))} networks
        </dd>
        <dt>links notation</dt>
        <dd className="mono">
          {linksNotation(codeAt(n, 0)).join(' ')} … {linksNotation(codeAt(n, networkCount(n) - 1)).join(' ')}
        </dd>
        <dd className="muted">
          {n} real {plural(n)} after the zero link 0: every link is written as its source and target, so a network is{' '}
          {2 * n} digits in base {n + 1}.
          {classes &&
            ` ${formatNumber(classCount(n))} classes remain when networks that only rename the links are counted once (Burnside’s lemma).`}
        </dd>
        <dd className="symbols__legend">
          {COLORS.slice(0, n).map((color, i) => (
            <span key={color} style={{ color }}>
              ━ link {i + 1}
            </span>
          ))}
        </dd>
      </dl>

      <ul className="symbols__grid" aria-label={`${classes ? 'Renaming classes' : 'Networks'} of ${n} ${plural(n)}`}>
        {codes.map((code) => (
          <li key={code} title={linksNotation(code).join(' ')}>
            <Glyph code={code} size={64} />
            <span className="mono">{mathNotation(code)}</span>
          </li>
        ))}
      </ul>
      {total > shown && (
        <button type="button" className="button" onClick={() => setShown(shown + PAGE * 2)}>
          Show more ({formatNumber(total - shown)} left)
        </button>
      )}
    </div>
  );
}
