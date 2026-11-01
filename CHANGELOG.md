# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-11-01

51 components in five new categories, built on shared foundations for WebGL2 shaders and bigint-safe web3 formatting. No breaking changes.

### Added

- Five categories in the catalog: Web3: Wallet & Identity, Web3: DeFi & Trading, Marketing Sections & Logo Clouds, Shaders & Backgrounds, and Orbits, Beams & Illustrations.
- `useShaderCanvas` (`src/lib/webgl/use-shader-canvas.ts`): WebGL2 fragment shaders on a fullscreen triangle, with a pixel-ratio cap, render scale, offscreen and hidden-tab pausing, a static frame under reduced motion, context-loss recovery and cleanup.
- GLSL snippets (hash, simplex noise, fBm, Bayer dither), a hex-to-vec3 color helper, bigint-safe web3 formatting built on viem, and mock web3 data for demos.
- Twelve original placeholder brands for demos.
- **Web3: Wallet & Identity**: Connect Wallet Button, Wallet Selector Modal, Address Pill, Network Switcher, Account Dropdown, Token Balance List, Transaction Toast, Transaction History, NFT Card and Transaction Review Modal. They're presentational (data and callbacks in, no wallet calls), use bigint math only, and every demo has a state switcher.
- **Web3: DeFi & Trading**: Token Swap Widget, Token Selector Modal, Cross-chain Bridge, Slippage Settings, Token Amount Input, Candlestick Chart, Live Price Ticker, Staking Card, Liquidity Pool Card and Gas Fee Selector. The swap widget composes Token Amount Input, Token Selector Modal and Slippage Settings; amounts, rates and fees use bigint math only.
- **Marketing Sections & Logo Clouds**: Logo Grid Hover Reveal, Dual Logo Marquee, Logo Cloud Blur Cycle, Spotlight Logo Grid, Testimonial Wall, Feature Bento Section, Pricing Section, Stats Section, FAQ Section and CTA with Border Beam. Feature Bento, Pricing, Stats and FAQ reuse existing components (Sparkline, Spring Switch, Typewriter, Activity Rings, Shimmer Text, Rolling Digits, Number Ticker, Bouncy Accordion).
- **Shaders & Backgrounds**: Cloud Shader, Mesh Gradient, Grain Gradient, Dithered Waves, Liquid Ripple, Dot Matrix Field, Light Rays, GPU Aurora, Glow Orb and Pixel Reveal Image, all on `useShaderCanvas` with CSS fallbacks, offscreen pausing and a still frame under reduced motion. Plus ASCII Aquarium Background: a 2D-canvas glyph aquarium on grid paper whose hero creature drifts toward the cursor and orbits a chat input while listening or thinking.
- **Orbits, Beams & Illustrations**: Orbiting Circles, Integration Hub, Animated Beam, Radar Sweep, Dotted Globe, Ripple Rings, Icon Cloud, Border Beam, Node Network and Animated Grid Pattern. CSS-keyframe pieces ship their keyframes through React 19 hoisted styles; canvas and 3D pieces pause offscreen and hold still under reduced motion.
- `useShaderCanvas` accepts sampler2D textures (images, canvases, video), uniforms as a per-frame function, and returns the shader clock as `time`. On software WebGL (SwiftShader, llvmpipe) it skips compiling and shows the CSS fallback, unless `allowSoftware` is set.
- Shared web3 helpers for registry items: generated token, chain, wallet and address avatars, `RollingValue` for rolling pre-formatted amounts with green/red flashes, and shared `Token`, `Chain`, `WalletOption` and `TxStatus` types.
- A version badge in the navbar and a `/changelog` page.
- Landing page: a "What's new in v0.2.0" section with live showcases (Token Swap Widget, Orbiting Circles), Logo Grid Hover Reveal under the hero, and an optional Cloud Shader hero background.

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

[Unreleased]: https://github.com/alibarmonster/alibar-ui/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/alibarmonster/alibar-ui/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/alibarmonster/alibar-ui/releases/tag/v0.1.0
