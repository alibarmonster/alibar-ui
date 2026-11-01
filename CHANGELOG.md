# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Work toward 0.2.0: 50 components in five new categories.

### Added

- Five categories in the catalog: Web3: Wallet & Identity, Web3: DeFi & Trading, Marketing Sections & Logo Clouds, Shaders & Backgrounds, and Orbits, Beams & Illustrations.
- `useShaderCanvas` (`src/lib/webgl/use-shader-canvas.ts`): WebGL2 fragment shaders on a fullscreen triangle, with a pixel-ratio cap, render scale, offscreen and hidden-tab pausing, a static frame under reduced motion, context-loss recovery and cleanup.
- GLSL snippets (hash, simplex noise, fBm, Bayer dither), a hex-to-vec3 color helper, bigint-safe web3 formatting built on viem, and mock web3 data for demos.
- Twelve original placeholder brands for demos.
- A version badge in the navbar and a `/changelog` page.

### Changed

- The "New" badge marks every component added in the latest release instead of a hand-picked list.
- Registry items can ship the new shared lib files next to a component.

## [0.1.0] - 2026-11-01

### Added

- 100 animated, accessible components in 10 categories: Buttons & Actions, Inputs & Forms, Toggles & Selection, Overlays & Feedback, Navigation, Text Animations, Numbers & Data Display, Cards & Layout, Media, Scroll & Backgrounds, and Loaders, AI & Widgets.
- A shadcn-compatible registry (`/r/<slug>.json`) that installs dependencies, helpers, design tokens and sibling components.
- A docs site: landing page with live featured components, a searchable gallery with a ⌘K palette, a page per component (live preview, variants, code, install commands, props table, accessibility notes) and guides for installation, theming and motion.
- Shared design tokens (colors, radius, shadows) and motion tokens (durations, easings, springs) in `src/lib/motion.ts`.
- SEO metadata, a sitemap, `robots.txt` and generated Open Graph images for the site and every component.
- An experimental WebGL2 playground at `/lab`.

[Unreleased]: https://github.com/alibarmonster/alibar-ui/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/alibarmonster/alibar-ui/releases/tag/v0.1.0
