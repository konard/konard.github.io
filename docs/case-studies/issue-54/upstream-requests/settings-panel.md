ui-settings / createSettingsPanel: balanced columns, preset gallery with live miniatures, saved-look management, popover colour chooser and cross-tab sync

## Context

konard/konard.github.io#54 migrates the personal site fully onto link-foundation/ui, and the draft is https://github.com/konard/konard.github.io/pull/55. The site keeps its own settings page because the gaps below are not covered upstream. This request follows #66 and #210, which already brought controls, the codec, presets and the panel. The site has no licence, so this is a behaviour specification only and no site code is copied.

## Current upstream (b4baef4)

- `packages/ui-components/src/settings/settings-panel.js`, `panel-actions.js`, `panel-rows.js` and `saved-looks.js` provide the panel features below.
  - Sections are `<details>` with per-section reset, and props.group adds fieldsets. Tabs are buttons with `aria-pressed`, and there is one panel-wide `setLevel`.
  - The toolbar has a preset `<select>`, randomize (honouring `randomLocked` and comfort fields), reset-all with confirmation and a press-and-hold peek.
  - There is a changes textarea, copy with fallback, import/export of `.lino`/`.json` and share via `toShareHash`.
  - Saved looks are name + select + save/apply/delete, plus an in-memory "before link" snapshot.
- `columns` lays sections out in a row-aligned CSS grid (`repeat(var(--settings-columns), 1fr)`), so short sections leave gaps under them.
- `packages/ui-settings/src/presets.js` applies only whole looks over defaults. `random.js` draws from each field's full min..max range.
- `packages/ui-components/src/controls/color-field.js` provides hex + native picker, a flat palette and an inline RGB group. `controls/number-field.js` keeps its steppers enabled and in the tab order at the bounds.
- `packages/ui-config` `persistLayer` writes to localStorage but does not listen for `storage` events.

## Required behavior

- **Balanced columns.** Add `columns: {count, balance: 'estimate'}`.
  - Each visible section goes into the currently shortest column, in schema order. Height is estimated from rows, hints, tabs and lead text (plus an optional per-section `extraHeight`), using defaults and the first tab/level.
  - Editing must never move the section being edited. A section shown or hidden by another section's field is placed after that section.
- **Accessible tabs and per-section levels.**
  - Section tabs use `role=tablist/tab/tabpanel` with arrow/Home/End keys. Empty tabs are hidden.
  - Optional per-section level tabs show an indicator when a level owns values rather than inheriting them.
  - A sticky preview slot (`mountPreview`) gets the section's active level.
- **Preset gallery** (`presets: {display: 'cards'}`).
  - Each card shows its name, description and a live miniature rendered from `applyPreset(preset, current)`. The active card has `aria-pressed=true`.
  - Partial presets touch only the fields they list, which allows section-scoped presets (for example "material" buttons inside a section).
- **Saved looks, full management.**
  - The list uses cards with a miniature, apply, "update to current", inline rename (Enter commits, Escape cancels, a name collision replaces) and delete.
  - Default names are "Look N", with a maximum length of 60 and a localized empty state.
  - Persistence failures are reported (quota, privacy mode). "Copy all looks" exports a looks collection, and paste accepts either a settings document or a looks collection.
- **Shared-link safety.** When `applyShared` runs, the replaced look is persisted as a saved look named by the localized "Before the link" message, not kept only in memory. The hash is then removed with `history.replaceState`, so a reload does not apply it again.
- **Random bounds.** Add a field option `random: {min, max}` or `random: 'not-heavier-than-default'`, which keeps `randomize` within readable ranges.
- **Cross-tab sync.** `persistLayer({sync: true})` listens for `storage` events and updates bound panels and values without a reload.
- **Colour chooser popover** (`color-field` `mode: 'popover'`).
  - The swatch trigger has `aria-haspopup=dialog`, `aria-expanded` and `aria-controls`. The popover sits in the top layer via `positionFloating` and stays hidden until it is first positioned, then focuses the first slider.
  - Outside pointer or focus closes it. Escape closes it and returns focus to the trigger.
  - Palettes are grouped and named (`palettes: [{name, colors: [{name, hex}]}]`). Chips are labelled "name hex", and the matching chip has `aria-pressed`.
- **Number steppers at the bounds.** Steppers are disabled at min/max, take `tabindex=-1`, do not take focus on pointerdown and step ×10 with Shift.
- **Inheritable number** (`fallback` + `inherit: true`). A reset button sets `null`, and `aria-valuetext` says "inherited". A blank draft does not count as a reset.
- **Peek toggle and changed count.** Add `peek: 'toggle'`, which uses `aria-pressed` and shows a floating "back" button. The changed count is exposed for a page header.

## Acceptance criteria

- [ ] With `balance: 'estimate'`, the column heights of the gallery schema differ by no more than one average section, and editing a field never re-parents its section.
- [ ] Tabs pass an axe check and arrow-key navigation, and empty tabs are absent.
- [ ] Preset cards render miniatures, and a partial preset leaves unrelated fields unchanged.
- [ ] Rename, update, delete and "copy all looks" round-trip through import, and a quota error shows a status message.
- [ ] Opening a share link saves "Before the link", clears the hash, and a reload keeps the applied look.
- [ ] A field with `random` bounds never gets a value outside them in 1000 draws.
- [ ] A change in one tab appears in a second tab without a reload.
- [ ] Popover colour: Escape returns focus to the trigger, `aria-pressed` follows the value, and only exact `#rrggbb` commits.
- [ ] At max, the increment stepper is disabled and skipped by Tab.

## Consumer code that becomes deletable

| Path | Lines |
|---|---|
| src/pages/SettingsPage.jsx | 374 (about half) |
| src/pages/settingsColumns.js | 60 |
| src/pages/Presets.jsx | 347 |
| src/pages/LinkSetting.jsx | 77 |
| src/components/ColorInput.jsx | 162 |
| src/components/colorPalettes.js | 57 (data stays as a palette option) |
| src/components/NumberInput.jsx | 79 |
| src/components/numericKeys.js | 32 |
| src/settings/store.js | 123 |
| src/settings/presets.js | 405 (most of it; the preset data remains) |

Not requested: `src/pages/InterfacePreview.jsx` (92), `LevelPreview.jsx` (150), `UiSamples.jsx` (213) and `CornerTiles.jsx` (133). They are site previews mounted through the existing `mountPreview`/`mountControl` hooks.

No unlicensed site code is copied upstream.
