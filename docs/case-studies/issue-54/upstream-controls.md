Konard migration: control contracts and rich settings-panel gaps

Observed at f72e97fe2db100d88ea460ee8451bbf63a1b01b6 for #66 and konard/konard.github.io#54.

Concrete control failures and differences:

1. Mount `(s: select 'Pick' (value a) (a: option Alpha) (b: option Beta (disabled true)) (c: option Charlie))`. Open it, click disabled Beta, then ArrowDown/Enter. The disabled click closes the list before the user chooses anything. Expected: ignore the click and keep the list open. The consumer's existing regression test fails with unmodified SELECT_KIND.
2. Tab leaves the select without committing its active option; WAI APG select-only combobox commits on Tab. PageUp/PageDown jump to first/last rather than ten options. Source: packages/ui-components/src/controls/machines/select.lino and listbox.js. APG reference: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/
3. `connectListPopover` fixes width to the anchor, without configurable minimum width or maximum menu height. Consumers need viewport-bounded menu width/height settings. The non-Popover fallback lacks collision-safe positioning outside clipped panels. Pointer clicks should establish button focus explicitly for Safari.
4. Number fields commit on native change, whereas a live preview requires input commits, intermediate draft preservation, nullable inherited values, stepping from an inherited fallback, and pointer step buttons. Home/End and Shift+Page keys must preserve native text editing semantics. Color fields need keyboard-editable hex/RGB values and configurable named palettes rather than relying solely on platform color dialogs.

Settings panel requirements:

The current site's 608 fields include 349 conditional fields, per-section tabs and element levels, transparent frame previews, coupled fit limits, a two-column layout that moves whole sections, customized counts, saved named looks, a recoverable "Before the link" look, comfort preservation, copy/paste/import/export and randomization constraints. The generated framework panel does not yet expose equivalent declarative conditional/preview/tab/group/layout hooks. Replacing it would remove existing functionality.

Settings engine interoperability:

`ui-settings` snaps imported numbers to a step and accepts string numbers/booleans. Existing JSON imports clamp continuous numbers and reject wrong JSON primitive types. Runtime CSS updates need changed-only application, removing inherited sentinel variables, resolved corner inheritance, derived RGB/noise tokens and a before-paint compatibility reader for the existing `settings:` object-codec format. Framework codecs and paint snapshots currently use different formats/keys. Please expose normalization/coercion policy and compatibility codec hooks rather than requiring a separate engine.

Consumer workaround: framework defaults/merge/diff/shared-look engine; framework select rendering and behavior with small event/style adapters; retain the rich panel and number/color editors until extension hooks provide parity. Existing regression tests cover every listed interaction. No site code is copied upstream because the site currently has no license grant.

Consumer draft: https://github.com/konard/konard.github.io/pull/55
