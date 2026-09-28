# Sim Venture visual system — locked launch direction

This document records the product owner's supplied visual reference and is the
authoritative styling direction for the launch UI. It is a product constraint,
not optional inspiration.

## Character

- Editorial, optimistic and highly legible rather than generic SaaS blue.
- Large rounded panels arranged in calm bento-style compositions.
- Warm off-white application canvas with black/near-black typography.
- Soft lavender, mint, orange and lime surfaces used in large confident areas.
- Thin dark hairlines, restrained soft shadows and pill-shaped controls.
- Spacious layouts with a strong headline-to-detail hierarchy.
- Charts use simple lines, bars and meters; never decorative fake precision.
- 3D or photographic imagery may appear selectively, but must not compete with
  the venture information hierarchy.

## Tokens

The implementation source of truth is `packages/ui/src/tokens.css`.

- Canvas: warm off-white (`--vs-color-bg`)
- Ink: near-black (`--vs-color-ink`)
- Lavender: primary intelligence/research surface
- Mint: evidence/learning surface
- Orange: action/simulation surface
- Lime: progress, signal and compact brand accent
- Panel radius: 24–32px
- Control shape: pill or 16px rounded rectangle

## Layout rules

1. Prefer 2–4 meaningful panels over many small indistinguishable cards.
2. Every screen gets one dominant task or result.
3. Secondary data sits inside quiet translucent sub-panels.
4. Preserve generous whitespace; do not compress the UI to fit more controls.
5. Use color to establish sections, never to imply unsupported positive or
   negative conclusions.
6. Mobile reflows panels vertically without reducing tap targets below 44px.

## Prohibited drift

- Generic blue-purple SaaS gradients
- Dense walls of same-looking white cards
- Heavy shadows, glassmorphism or neon effects
- Fake dashboards or decorative metrics presented as real data
- Mixed icon styles or excessive emoji
- Public labels such as "prototype" on the finished V1
