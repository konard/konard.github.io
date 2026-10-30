import { useState } from 'react';
import NetworkGaps from './NetworkGaps';
import { canonical, decode, encode, mathNotation, randomCode } from '../links/configurations';
import {
  addLink,
  countOf,
  decimalOf,
  linksText,
  numberNotation,
  parseIndex,
  parseLinks,
  parseMath,
  parseNumber,
  setReference,
  signatureOf,
  theoryNotation,
} from '../links/edit';
import { useLang } from '../i18n/prefs';
import { plural } from '../i18n/plural';
import { formatNumber } from '../components/format';
import NumberInput from '../components/NumberInput';

const LINKS = { en: ['link', 'links'], ru: ['связь', 'связи', 'связей'] };
// "of N links", "one of N networks": Russian needs the genitive after «из».
const OF_LINKS = { en: ['link', 'links'], ru: ['связи', 'связей', 'связей'] };
const OF_NETWORKS = { en: ['network', 'networks'], ru: ['сети', 'сетей', 'сетей'] };
// Finding the smallest renaming tries every order of the links: n! of them.
const CANONICAL_UP_TO = 7;

/**
 * One editable notation. While it is typed in, the text stays as it is typed;
 * every valid text changes the network at once, and an invalid one shows why.
 * When the network is changed elsewhere, the field shows the new network.
 */
function NotationField({ id, label, hint, value, parse, format, onLinks, multiline = false }) {
  const { t } = useLang();
  const [draft, setDraft] = useState(null);
  // A draft belongs to the value it was typed against (or the value it produced).
  const active = draft && draft.at === value;
  const text = active ? draft.text : value;
  const error = active ? draft.error : null;
  const change = (event) => {
    const next = event.target.value;
    const result = parse(next);
    if (result.links) {
      setDraft({ text: next, at: format(result.links), error: null });
      onLinks(result.links);
    } else setDraft({ text: next, at: value, error: result.error });
  };
  const Input = multiline ? 'textarea' : 'input';
  return (
    <div className={`notation${error ? ' is-invalid' : ''}`}>
      <label htmlFor={id}>{t(label)}</label>
      <Input
        id={id}
        className="mono"
        value={text}
        onChange={change}
        onBlur={() => active && !error && setDraft(null)}
        spellCheck="false"
        autoComplete="off"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={`${id}-note`}
        rows={multiline ? 2 : undefined}
      />
      <small
        id={`${id}-note`}
        className={error ? 'notation__error' : 'notation__hint'}
        role={error ? 'alert' : undefined}
      >
        {error ? t(error) : t(hint)}
      </small>
    </div>
  );
}

/** The four editable notations of the network (issue #17). */
export function Notations({ links, notation, onLinks }) {
  const { lang, t } = useLang();
  const n = links.length;
  const count = countOf(n);
  return (
    <div className="notations">
      <p className="muted">
        {t({
          en: `${n} ${plural(n, lang, LINKS)} after the zero link 0, in a doublet network ${signatureOf(notation)}: one of ${formatNumber(count, lang)} ${plural(Number(count), lang, OF_NETWORKS)} of ${n} ${plural(n, lang, OF_LINKS)}, written with ${2 * n} digits in base ${n + 1}. Every notation below can be edited; the others follow.`,
          ru: `${n} ${plural(n, lang, LINKS)} после нулевой связи 0 в дуплетной сети ${signatureOf(notation)}: одна из ${formatNumber(count, lang)} ${plural(Number(count), lang, OF_NETWORKS)} из ${n} ${plural(n, lang, OF_LINKS)}, записанная ${2 * n} цифрами в системе с основанием ${n + 1}. Любую запись ниже можно изменить, остальные изменятся вслед за ней.`,
        })}
      </p>
      <NotationField
        id="notation-theory"
        label={{ en: 'Math notation (the links theory)', ru: 'Математическая нотация (теория связей)' }}
        hint={{
          en: 'The function of the network: link ↦ (source, target). The names may be left out.',
          ru: 'Функция сети: связь ↦ (начало, конец). Имена связей можно не писать.',
        }}
        value={theoryNotation(links, notation)}
        format={(l) => theoryNotation(l, notation)}
        parse={parseMath}
        onLinks={onLinks}
      />
      <NotationField
        id="notation-pairs"
        label={{ en: 'Pairs with the base', ru: 'Пары с основанием' }}
        hint={{
          en: 'Source and target of each link as two digits (use (source,target) with a base for 10+ links), as under the symbols of the gallery.',
          ru: 'Начало и конец каждой связи двумя цифрами (для 10+ связей — (начало,конец) с основанием), как под символами галереи.',
        }}
        value={mathNotation(encode(links))}
        format={(l) => mathNotation(encode(l))}
        parse={parseMath}
        onLinks={onLinks}
      />
      <NotationField
        id="notation-number"
        label={{ en: 'N-ary number', ru: 'N-ричное число' }}
        hint={{
          en: `The whole network as one number of ${2 * n} digits in base ${n + 1}; for 10+ links use space-separated digits in [brackets].`,
          ru: `Вся сеть как одно число из ${2 * n} цифр в системе с основанием ${n + 1}; для 10+ связей разделяйте цифры пробелами в [скобках].`,
        }}
        value={numberNotation(links)}
        format={numberNotation}
        parse={parseNumber}
        onLinks={onLinks}
      />
      <NotationField
        id="notation-decimal"
        label={{ en: 'The same number in decimal', ru: 'То же число в десятичной системе' }}
        hint={{
          en: `The position of the network among all networks of ${n} ${plural(n, lang, LINKS)}, from 0 to ${count - 1n}.`,
          ru: `Номер сети среди всех сетей из ${n} ${plural(n, lang, OF_LINKS)}, от 0 до ${count - 1n}.`,
        }}
        value={decimalOf(links)}
        format={decimalOf}
        parse={(text) => parseIndex(text, n)}
        onLinks={onLinks}
      />
      <NotationField
        id="notation-links"
        label={{ en: 'Links notation', ru: 'Нотация связей' }}
        hint={{
          en: '(index: source target) for each link; 0 is nothing.',
          ru: '(индекс: начало конец) для каждой связи; 0 — это «ничего».',
        }}
        value={linksText(links)}
        format={(l) => linksText(l)}
        parse={parseLinks}
        onLinks={onLinks}
        multiline
      />
    </div>
  );
}

/** A choice of the link that an end refers to: 0 (nothing), the link itself or another link. */
function ReferenceSelect({ id, value, n, self, onChange, label }) {
  const { t } = useLang();
  // Avoid two n-option selects per row (quadratic DOM size) on large networks.
  if (n > 50)
    return (
      <NumberInput
        id={id}
        min={0}
        max={n}
        step={1}
        value={value}
        aria-label={label}
        onValue={(ref) => {
          if (ref !== null && Number.isInteger(ref) && ref >= 0 && ref <= n) onChange(ref);
        }}
      />
    );
  return (
    <select id={id} value={value} onChange={(event) => onChange(Number(event.target.value))} aria-label={label}>
      {Array.from({ length: n + 1 }, (_, ref) => (
        <option key={ref} value={ref}>
          {ref}
          {ref === 0
            ? ` — ${t({ en: 'nothing', ru: 'ничего' })}`
            : ref === self
              ? ` — ${t({ en: 'itself', ru: 'сама' })}`
              : ''}
        </option>
      ))}
    </select>
  );
}

/**
 * The links one by one: what each refers to, its colour and the turns of its
 * ends, with buttons to add and remove links and to move through the networks.
 */
export function LinksTable({
  links,
  colors,
  turns,
  turnDefaults,
  gaps,
  style,
  onGap,
  onLinks,
  onRemove,
  onColor,
  onTurn,
  onStep,
  onRandom,
  onRandomReal,
}) {
  const { t } = useLang();
  const n = links.length;
  const start = t({ en: 'source', ru: 'начало' });
  const end = t({ en: 'target', ru: 'конец' });
  return (
    <div className="links-table">
      <p className="network__lead">
        {t({
          en: 'Each card contains all settings for one link. Empty gaps follow the global values shown in the fields. Reference gaps use layout units; middle cuts use 1/100 of the symbol.',
          ru: 'В каждой карточке — все настройки одной связи. Пустые зазоры следуют общим значениям из подсказок. Зазоры ссылок — в единицах размещения, разрывы середины — в 1/100 символа.',
        })}
      </p>
      <ul className="link-cards" aria-label={t({ en: 'Link configurations', ru: 'Настройки связей' })}>
        {links.map(([s, tg], i) => {
          const name = `${t({ en: 'Link', ru: 'Связь' })} ${i + 1}`;
          return (
            <li className="link-card" key={i}>
              <div className="link-card__head">
                <h3>
                  <span className="links-table__swatch" style={{ background: colors[i] }} aria-hidden="true" />
                  {name}
                </h3>
                <button
                  type="button"
                  className="button button--small"
                  disabled={n <= 1}
                  onClick={() => onRemove(i + 1)}
                  aria-label={`${t({ en: 'Remove', ru: 'Удалить' })}: ${name}`}
                  title={t({
                    en: 'References to this link become references to 0',
                    ru: 'Ссылки на эту связь станут ссылками на 0',
                  })}
                >
                  ✕
                </button>
              </div>
              <div className="link-card__fields">
                {[
                  [s, start, 'source'],
                  [tg, end, 'target'],
                ].map(([value, label, id], e) => (
                  <label key={id} htmlFor={`link-${i + 1}-${id}`}>
                    {t(e ? { en: 'Target', ru: 'Конец' } : { en: 'Source', ru: 'Начало' })}
                    <ReferenceSelect
                      id={`link-${i + 1}-${id}`}
                      value={value}
                      n={n}
                      self={i + 1}
                      label={`${name}: ${label}`}
                      onChange={(ref) => onLinks(setReference(links, i, e, ref))}
                    />
                  </label>
                ))}
                <label className="link-card__colour">
                  {t({ en: 'Colour', ru: 'Цвет' })}
                  <input
                    type="color"
                    value={colors[i]}
                    aria-label={`${name}: ${t({ en: 'colour', ru: 'цвет' })}`}
                    onChange={(event) => onColor(i, event.target.value)}
                  />
                </label>
              </div>
              <NetworkGaps
                i={i}
                row={gaps[i]}
                style={style}
                onGap={onGap}
                turns={turns[i]}
                turnDefaults={turnDefaults[i]}
                onTurn={onTurn}
              />
            </li>
          );
        })}
      </ul>
      <div className="network__actions">
        <button type="button" className="button" onClick={() => onLinks(addLink(links))}>
          + {t({ en: 'Add a link', ru: 'Добавить связь' })}
        </button>
        <button type="button" className="button" onClick={() => onStep(-1)}>
          ← {t({ en: 'Previous network', ru: 'Предыдущая сеть' })}
        </button>
        <button type="button" className="button" onClick={() => onStep(1)}>
          {t({ en: 'Next network', ru: 'Следующая сеть' })} →
        </button>
        <button type="button" className="button" onClick={onRandom}>
          {t({ en: 'Random network', ru: 'Случайная сеть' })}
        </button>
        <button type="button" className="button" onClick={onRandomReal}>
          {t({ en: 'Random real network', ru: 'Случайная настоящая сеть' })}
        </button>
        <button
          type="button"
          className="button"
          disabled={n > CANONICAL_UP_TO}
          onClick={() => onLinks(decode(canonical(links)))}
          title={t({
            en: 'The same network with the links renamed so that its code is the smallest',
            ru: 'Та же сеть, связи которой переименованы так, чтобы её код был наименьшим',
          })}
        >
          {t({ en: 'Smallest renaming', ru: 'Наименьшее переименование' })}
        </button>
      </div>
    </div>
  );
}

/** Step in counting order across all sizes, starting with the one-link network 00. */
export function stepped(links, step) {
  let n = links.length;
  let index = BigInt(decimalOf(links)) + BigInt(step);
  while (index >= countOf(n)) index -= countOf(n++);
  while (index < 0n && n > 1) index += countOf(--n);
  if (index < 0n) index = 0n;
  return parseIndex(index.toString(), n).links;
}

/** A random network of `n` links, optionally excluding every reference to zero. */
export function randomLinks(n, random = Math.random, options = {}) {
  if (options.real) return decode(randomCode(random, n, options));
  return Array.from({ length: n }, () => [Math.floor(random() * (n + 1)), Math.floor(random() * (n + 1))]);
}
