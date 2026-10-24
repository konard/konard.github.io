import { useState } from 'react';
import { canonical, decode, encode, mathNotation } from '../links/configurations';
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
import { MAX_LINKS } from '../links/glyph';
import { useLang } from '../i18n/prefs';
import { plural } from '../i18n/plural';
import { formatNumber } from '../components/format';

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
          en: `${n} ${plural(n, lang, LINKS)} after the zero link 0, in a doublet network ${signatureOf(notation)}: one of ${formatNumber(Number(count), lang)} ${plural(Number(count), lang, OF_NETWORKS)} of ${n} ${plural(n, lang, OF_LINKS)}, written with ${2 * n} digits in base ${n + 1}. Every notation below can be edited; the others follow.`,
          ru: `${n} ${plural(n, lang, LINKS)} после нулевой связи 0 в дуплетной сети ${signatureOf(notation)}: одна из ${formatNumber(Number(count), lang)} ${plural(Number(count), lang, OF_NETWORKS)} из ${n} ${plural(n, lang, OF_LINKS)}, записанная ${2 * n} цифрами в системе с основанием ${n + 1}. Любую запись ниже можно изменить, остальные изменятся вслед за ней.`,
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
          en: 'Source and target of each link as two digits, as under the symbols of the gallery.',
          ru: 'Начало и конец каждой связи двумя цифрами, как под символами галереи.',
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
          en: `The whole network as one number of ${2 * n} digits in base ${n + 1}; add or remove two digits to add or remove a link.`,
          ru: `Вся сеть как одно число из ${2 * n} цифр в системе с основанием ${n + 1}; две цифры больше или меньше — связью больше или меньше.`,
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
export function LinksTable({ links, colors, turns, onLinks, onRemove, onColor, onTurn, onStep, onRandom }) {
  const { t } = useLang();
  const n = links.length;
  const start = t({ en: 'source', ru: 'начало' });
  const end = t({ en: 'target', ru: 'конец' });
  return (
    <div className="links-table">
      <div className="links-table__scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">{t({ en: 'Link', ru: 'Связь' })}</th>
              <th scope="col">{t({ en: 'Source', ru: 'Начало' })}</th>
              <th scope="col">{t({ en: 'Target', ru: 'Конец' })}</th>
              <th scope="col">{t({ en: 'Colour', ru: 'Цвет' })}</th>
              <th scope="col">{t({ en: 'Turn of the source', ru: 'Поворот начала' })}</th>
              <th scope="col">{t({ en: 'Turn of the target', ru: 'Поворот конца' })}</th>
              <th scope="col">
                <span className="visually-hidden">{t({ en: 'Remove', ru: 'Удалить' })}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {links.map(([s, tg], i) => {
              const name = `${t({ en: 'Link', ru: 'Связь' })} ${i + 1}`;
              return (
                <tr key={i}>
                  <th scope="row" className="mono">
                    <span className="links-table__swatch" style={{ background: colors[i] }} aria-hidden="true" />
                    {i + 1}
                  </th>
                  <td>
                    <ReferenceSelect
                      id={`link-${i + 1}-source`}
                      value={s}
                      n={n}
                      self={i + 1}
                      label={`${name}: ${start}`}
                      onChange={(ref) => onLinks(setReference(links, i, 0, ref))}
                    />
                  </td>
                  <td>
                    <ReferenceSelect
                      id={`link-${i + 1}-target`}
                      value={tg}
                      n={n}
                      self={i + 1}
                      label={`${name}: ${end}`}
                      onChange={(ref) => onLinks(setReference(links, i, 1, ref))}
                    />
                  </td>
                  <td>
                    <input
                      type="color"
                      value={colors[i]}
                      aria-label={`${name}: ${t({ en: 'colour', ru: 'цвет' })}`}
                      onChange={(event) => onColor(i, event.target.value)}
                    />
                  </td>
                  {[0, 1].map((e) => (
                    <td key={e}>
                      <input
                        type="number"
                        className="mono"
                        min={-180}
                        max={180}
                        step={5}
                        value={turns[i][e]}
                        aria-label={`${name}: ${t({ en: 'turn of the', ru: 'поворот' })} ${e ? end : start}, °`}
                        onChange={(event) => onTurn(i, e, Number(event.target.value) || 0)}
                      />
                      °
                    </td>
                  ))}
                  <td>
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="network__actions">
        <button type="button" className="button" disabled={n >= MAX_LINKS} onClick={() => onLinks(addLink(links))}>
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

/** The network `step` positions after `links` among the networks of the same size (wrapping around). */
export function stepped(links, step) {
  const n = links.length;
  const count = countOf(n);
  const index = (((BigInt(decimalOf(links)) + BigInt(step)) % count) + count) % count;
  return parseIndex(index.toString(), n).links;
}

/** A random network of `n` links. */
export function randomLinks(n, random = Math.random) {
  return Array.from({ length: n }, () => [Math.floor(random() * (n + 1)), Math.floor(random() * (n + 1))]);
}
