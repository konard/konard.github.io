// Issue #47: "use high-quality SVG icons for social networks, and SVG instead of
// emojis everywhere". Emojis and symbol glyphs look different in every font and
// system; the site draws SVG icons instead. Arrows of formulas (L → L², C# → C++)
// are text, not icons, and stay.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Contacts from './Contacts';
import { BioText, BRANDS, hasContactIcon, SKILL_ICONS } from './icons';
import { profile, skillGroups, socials } from '../data/profile';

const SRC = join(__dirname, '..');
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
const SOURCES = walk(SRC).filter((file) => /\.(jsx?|css)$/.test(file) && !/\.test\./.test(file));

/** Emojis and the symbol glyphs the site used as icons. */
const ICON_GLYPH = /[\p{Extended_Pictographic}★●▶↺⤓✎✕⌄✓▹↑⌨◇⛁⚛◈⚙⬢✺✦]/u;
/** Comments may name the glyphs they replaced. */
const code = (line) => !/^\s*(\/\/|\*|\/\*)/.test(line);

describe('SVG instead of emojis and symbol glyphs (issue #47)', () => {
  it('leaves no emoji or symbol glyph in the interface', () => {
    const found = SOURCES.flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .map((line, i) => [line, i])
        .filter(([line]) => code(line) && ICON_GLYPH.test(line))
        .map(([line, i]) => `${file.slice(SRC.length + 1)}:${i + 1}: ${line.trim()}`),
    );
    expect(found).toEqual([]);
  });

  it('draws every contact with an SVG mark', () => {
    for (const { id } of socials) expect(hasContactIcon(id), id).toBe(true);
    const { container } = render(<Contacts socials={socials} />);
    const icons = container.querySelectorAll('.social__icon');
    expect(icons).toHaveLength(socials.length);
    for (const icon of icons) {
      expect(icon.querySelector('svg')).not.toBeNull();
      expect(icon.textContent).toBe('');
    }
  });

  it('uses real brand paths for the brands', () => {
    for (const [id, brand] of Object.entries(BRANDS)) expect(brand.path, id).toMatch(/^[Mm][\d.\s-]/);
  });
});

describe('icons in the texts (issue #47)', () => {
  it('draws the bio words as labelled SVG icons', () => {
    const { container, getAllByRole } = render(
      <p>
        <BioText text="I {passion} open-source. I am in {love} with Rust." lang="en" />
      </p>,
    );
    expect(container.querySelectorAll('svg')).toHaveLength(2);
    expect(container.textContent).toBe('I  open-source. I am in  with Rust.');
    expect(getAllByRole('img', { name: 'love' })).toHaveLength(2);
    // The bio of the profile uses only words that have icons.
    for (const line of profile.bio)
      for (const word of `${line.en} ${line.ru}`.match(/\{\w+\}/g) || [])
        expect(['{passion}', '{love}']).toContain(word);
  });

  it('has an SVG icon for every skill group', () => {
    for (const group of skillGroups) expect(Object.keys(SKILL_ICONS), group.id).toContain(group.icon);
  });
});
