# README Homepage Polish Design

## Goal

Refine the first screen of both `README.md` and `README.zh-CN.md` so the project looks more polished and credible at first glance, while keeping the rest of the documentation structure intact.

## Scope

In scope:
- polish the top section of `README.md`
- polish the top section of `README.zh-CN.md`
- improve the title area, tagline, supporting sentence, and first feature summary
- add a compact highlights section near the top

Out of scope:
- rewriting the full README from scratch
- changing the underlying setup, configuration, FAQ, or development guidance
- changing repository code, tests, or GitHub App behavior

## Current Context

The documentation has already been split into:
- `README.md` for English
- `README.zh-CN.md` for Chinese

Both files are structurally complete and aligned with the current runtime behavior. The remaining problem is presentation quality: the first screen is informative, but it still reads more like a draft documentation page than a mature open source project homepage.

## Recommended Approach

Keep the existing overall structure and improve only the first 40-60 lines of each README.

The new homepage section should contain:
- project title
- badges
- language switch link
- sharper one-line tagline
- one short supporting sentence
- a compact `Highlights` section

This keeps the README useful and grounded while making the first impression cleaner and more intentional.

## English README Direction

The English homepage should feel like a mature open source project:
- concise
- professional
- less repetitive
- stronger emphasis on what the app does in one glance

The top area should avoid long explanatory paragraphs. It should read like a homepage, not a setup guide.

## Chinese README Direction

The Chinese homepage should mirror the English structure, but it does not need to be a literal line-by-line translation.

It should feel:
- direct
- professional
- slightly more explanatory than the English version

The goal is consistency of structure and tone, not rigid sentence matching.

## Proposed Homepage Shape

For both files:

1. Title
2. Badges
3. Language switch link
4. Strong tagline
5. One-sentence support line
6. `Highlights` section with 3-4 bullets
7. Continue into the existing README body

## Content Guidelines

The homepage should emphasize:
- automatic PR description generation
- trigger coverage for opened, synchronize, and reopened
- OpenAI-compatible API support
- PR comments instead of overwriting PR body

The homepage should avoid:
- long configuration explanations near the top
- repeating the same idea in multiple nearby sentences
- mixing too much setup detail into the first screen

## Success Criteria

The polish is complete when:
- both README files have a more concise and polished first screen
- the top sections of both files feel structurally aligned
- the homepage communicates value quickly without sacrificing accuracy
- the rest of the documentation remains intact
