Consumer verification of `27d580f4bac4ebb4e70de3f78671153c2ef5dab9` in https://github.com/konard/konard.github.io/pull/55:

- Adopted unmodified source packages. The public `readNumber` clamp policy now preserves typed `0.075`, and directional `nextValue` stepping gives `0.08`. The React input delegates both operations and retains its native presentation/draft behavior. Clearing to an inherited `null` remains covered.
- Reproduced the scrolled-menu issue in the production consumer at 390×320: after scrolling 600px, the menu top was -384.21875 while its anchor was -420.21875. The new bounds assertion fails against `4564597`. With `27d580f`, the same menu stays at y=8, height=304 and the assertion passes. Before/after screenshots and geometry are retained in the consumer case study.
- Production build, 64 focused tests across nine files, both finite API contract probes, and seven Chromium production migration checks pass. The consumer's full existing three-browser CI remains the integration gate.

The previously reported continuous typed-number policy is resolved in this adopted snapshot. Package publication and the independent rendering/material/network/audio providers remain separate outstanding requirements in reports 209 and 211.
