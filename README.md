# Mia's World — 5.0.0

An original touch-first Phaser 3 game for ages 6–7. Ice cream, basketball, pretend play and a persistent collection, with occasional physical learning activities.

## Play

[Open Mia's World](https://simrandeepreen.github.io/math-quest/). Landscape is recommended. Open the freezer, drag a cone or cup to the counter, drag scoops and toppings onto it, and give the finished ice cream to the customer. Objects also support taps as a forgiving alternative. Tap the floor to walk. The shop sign changes bunting; the register and bell react to touch. Every third customer may invite a berry picnic; the invitation can be declined.

In the park, swipe the ball up and right. Dots show its flight; release to throw. A gentle assist helps already-close throws. In Mia's room, spend coins on toys, accessories, decorations and mint ice cream. Drag collected things onto the rug or into Mia's hands. Choose a collected item on the shelf to take it to the shop.

The lock in the upper-right opens the parent gate. Enter forty-two. Parent settings contain sound/music, free-play mode, topic toggles, learning focus, separate skill results and a confirmed reset. This is a casual parent gate, not security authentication.

## Development

Node 22+:

```sh
npm ci
npm run dev
npm test
npm run build
npx playwright install --with-deps chromium webkit
npm run test:e2e
```

`main` runs tests, builds, runs iPad browser smoke tests, and deploys the `dist` artifact to GitHub Pages. The Vite relative base supports `/math-quest/`. The `mia-world-v5` branch runs the same quality gates without deployment.

## Architecture

- `src/game/scenes`: boot, ice-cream shop, playground and personal room.
- `src/game/entities`: layered character rig; idle, walk, wave and celebration.
- `src/game/interactions`: reusable source drags, placeable objects, drop zones and bounds.
- `src/game/systems`: berry activity, rewards/catalogue and testable basketball physics.
- `src/learning`: constrained generators, topic registry and per-skill confidence adaptation.
- `src/persistence`: versioned IndexedDB save plus synchronous local-storage recovery copy.
- `src/audio`: original synthesized music and effects; no remote audio dependencies.
- `src/config/school-topics.json`: supported topic settings and inactive extension slots.
- `public/assets`: original SVG actors/objects and optimized original generated backgrounds.
- `scripts/generate-vectors.mjs`: editable vector-asset sources.
- `scripts/build-sw.mjs`: release-hashed offline worker generated after each build.

## Learning

Six independently tracked skills: addition/subtraction within 20, addition/subtraction across ten, inverse number relationships, and mixed addition/subtraction. Standard practice uses two-digit ± single-digit; crossing-ten and mixed patterns have strict bounds. Berry activities request challenges from `LearningEngine`; game logic does not generate equations. Children manipulate the changes, then label the quantity using a physical number dial. Inverse tasks ask them to make a target quantity. Hints and retries are unlimited. Time is observational and never drives promotion. Six recent outcomes adapt an individual skill; manual focus can choose a stage without exposing levels in gameplay.

Normal customers, decorating, character play and basketball have no knowledge gate. One in three customer slots can request learning; actual time split depends on how the child plays. Unsupported future subjects do not generate pretend activities.

## Saves and updates

Schema 5 stores coins, collected items, placements, accessories, shop bunting, preferences and skill history. Writes are serialized. A synchronous recovery copy protects against iPad tab termination before an IndexedDB transaction finishes. V4/V3/V2 coins and sound/adaptive preferences can migrate; aggregate prototype accuracy is intentionally not misattributed to new skills. Old save keys are preserved. Newer unsupported schemas are read-only and are never overwritten automatically.

Everything stays in this browser, with no backend, ads, trackers, social features or external accounts. Clearing Safari data removes the save; this release has no cross-device transfer. The welcome purse has eight coins.

Navigation is network-first. JS/CSS filenames are content hashed, and the complete offline cache has a release hash. Installation bypasses the HTTP cache, precaches the complete game, activates immediately, removes only known Mia/prototype caches, claims clients and reloads existing controlled tabs after their save queue flushes. Offline navigation uses the installed release HTML. The old service-worker URL is replaced by the new build at the same `/math-quest/sw.js` location.

## Asset provenance

All game art is original. The three environment paintings were created specifically for this project using image generation; exact briefs are in `docs/art/background-prompts.json`. Character rigs, props and UI illustrations are original SVGs generated from the checked-in script. Music and effects are original Web Audio synthesis. No ripped assets, copyrighted game characters, third-party music, external fonts or CDN scripts are used.

## Current scope

This is a substantial first vertical slice, not a full commercial content catalogue. It has three locations, one physics mini-game, nine purchasable rewards and a free plush. It does not yet include voiced instructions, German/English learning activities, cloud saves or additional sports. iPad browser emulation and practical Chrome testing are used; a physical iPad child playtest remains valuable.
