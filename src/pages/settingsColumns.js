import { DEFAULTS } from '../settings/schema';

// Issue #49: "in settings we have big gap to the left, so we may need to
// rearrange blocks of settings". Every section named its column (issue #15):
// the background in the left one, the look in the right one, so with the
// futuristic skin the right column was 8749px high and the left one 3230px,
// with 5519px of nothing under it. The sections are now placed in order, each
// one into the column that is shorter so far, by an estimate of its height.
//
// The estimate does not measure the page and does not follow the settings of a
// section, only which sections are shown, so nothing moves while a section is
// configured (issue #15: "Skin jumped between the columns"); a section is
// placed by the sections before it only, and the sections shown or hidden by
// a setting (the skin options, the corners) come after it, so the section
// being changed stays where it is.

/** Pixels of the parts of a section, from the page at 1440px (experiments/issue-49-settings-columns.mjs). */
export const SIZES = { head: 70, lead: 44, row: 46, hint: 22, tabs: 44 };

/** Pixels of what a section shows besides its settings: previews, samples and palettes. */
export const EXTRA = {
  interface: 1190,
  futuristic: 60,
  corners: 290,
  glass: 66,
  liquid: 130,
};

/**
 * The height of `section` in pixels as it is first shown: its settings in the
 * first tab and level, with the defaults of its own settings.
 */
export function estimateHeight(section) {
  const level = section.levels?.[0].id;
  const inLevel = (field) => !section.levels || [].concat(field.level ?? level).includes(level);
  const shown = (field) =>
    inLevel(field) &&
    (!field.tab || field.tab === section.tabs?.[0].id) &&
    (!field.when || field.when(DEFAULTS, level));
  const fields = section.fields.filter(shown);
  return (
    SIZES.head +
    (section.lead ? SIZES.lead : 0) +
    fields.length * SIZES.row +
    fields.filter((field) => field.hint).length * SIZES.hint +
    ((section.tabs ? 1 : 0) + (section.levels ? 1 : 0)) * SIZES.tabs +
    (EXTRA[section.id] ?? 0)
  );
}

/** The sections in `count` columns, in order, each in the column that is the shortest so far. */
export function placeSections(sections, count = 2, height = estimateHeight) {
  const columns = Array.from({ length: count }, () => ({ height: 0, sections: [] }));
  for (const section of sections) {
    const shortest = columns.reduce((best, column) => (column.height < best.height ? column : best));
    shortest.sections.push(section);
    shortest.height += height(section);
  }
  return columns.map((column) => column.sections);
}
