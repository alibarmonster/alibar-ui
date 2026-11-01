# alibar/ui

[![CI](https://github.com/alibarmonster/alibar-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/alibarmonster/alibar-ui/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

151 animated, accessible React components for Next.js and Tailwind CSS. Copy the source or install a component with the shadcn CLI. Once a component is in your project, the code is yours to edit.

- **151 components** in 15 categories, each with live demos, variants, a props table and accessibility notes.
- **Modern stack**: React 19, Next.js 16 (App Router), TypeScript (strict), Tailwind CSS v4, [Motion](https://motion.dev), [Radix UI](https://www.radix-ui.com) and [lucide-react](https://lucide.dev).
- **Accessible by default**: full keyboard support, visible focus rings, ARIA roles, 40px touch targets and `prefers-reduced-motion` fallbacks.
- **Smooth motion**: animates only `transform`, `opacity`, `filter` and `clip-path`, using shared duration, easing and spring tokens.
- **No lock-in**: each component lives in one folder, with no global state, no external images and no runtime dependency on this repository.
- **Web3-ready, safely**: wallet and DeFi components are presentational (data and callbacks in), use bigint math only and never touch a wallet themselves.
- **GPU backgrounds without three.js**: shaders run on a small WebGL2 hook that pauses offscreen, respects reduced motion and falls back to CSS.

## Using a component

Components target a React 19 + Tailwind CSS v4 project that has been set up with `shadcn init`.

### With the shadcn CLI

```bash
npx shadcn@latest init
npx shadcn@latest add <site-url>/r/spring-press-button.json
```

`<site-url>` is the address of the docs site. Every component page shows its exact command. The CLI installs the npm dependencies, the shared `cn` and motion helpers, the design tokens and any other alibar/ui components it relies on.

### Manually

Each component page lists the packages to install, the helper files (`lib/utils.ts`, `lib/motion.ts`) and the full component source to copy.

## Categories

| Category | Examples |
| --- | --- |
| Buttons & Actions | Spring Press Button, Hold to Confirm, Slide to Confirm, Like Button |
| Inputs & Forms | OTP Input, Money Input, Tag Input, Phone Input, File Dropzone |
| Toggles & Selection | Spring Switch, Segmented Control, Sliding Tabs, Color Picker |
| Overlays & Feedback | Morphing Modal, Bottom Sheet, Toast Stack, Glide Tooltip |
| Navigation | Dock, Command Palette, Dynamic Island, Radial Menu |
| Text Animations | Text Scramble, Typewriter, Word Rotator, Streaming Text |
| Numbers & Data Display | Number Ticker, Area Chart, Activity Rings, Contribution Heatmap |
| Cards & Layout | Tilt Card, Swipe Cards, Bento Grid, Sortable List |
| Media, Scroll & Backgrounds | Draggable Marquee, Parallax Slider, Hover Image Reveal |
| Loaders, AI & Widgets | Thinking States, AI Prompt Input, Chat Bubbles, Agent Steps |
| Web3: Wallet & Identity | Connect Wallet Button, Address Pill, Network Switcher, Transaction Toast |
| Web3: DeFi & Trading | Token Swap Widget, Cross-chain Bridge, Candlestick Chart, Staking Card |
| Marketing Sections & Logo Clouds | Logo Grid Hover Reveal, Testimonial Wall, Pricing Section, CTA with Border Beam |
| Shaders & Backgrounds | Cloud Shader, Mesh Gradient, Glow Orb, ASCII Aquarium Background |
| Orbits, Beams & Illustrations | Orbiting Circles, Animated Beam, Dotted Globe, Icon Cloud |

## Local development

Requirements: Node.js 20.9 or newer and [Bun](https://bun.sh) 1.2 or newer. The lockfile is `bun.lock`.

```bash
git clone https://github.com/alibarmonster/alibar-ui.git
cd alibar-ui
bun install
bun dev
```

Then open http://localhost:3000.

| Script | What it does |
| --- | --- |
| `bun dev` | Starts the docs site in development mode |
| `bun run build` | Builds the shadcn registry (`public/r`) and the production site |
| `bun run start` | Serves the production build |
| `bun run lint` | Runs ESLint, including the React Compiler rules |
| `bun run typecheck` | Generates route types and runs `tsc --noEmit` |
| `bun run check` | Checks that every component has its source, demo and docs, and is registered |
| `bun run registry:build` | Regenerates `registry.json` and `public/r/*.json` |
| `bun run lab:verify` | Checks the experimental primitives shown at `/lab` |

### Project structure

```text
src/
├── app/
│   ├── (site)/              # Landing page, /components gallery and detail pages, /docs
│   ├── lab/                 # Experimental WebGL2 playground (not in the registry, not indexed)
│   └── opengraph-image.tsx  # Social images, plus sitemap.ts and robots.ts next to it
├── components/
│   ├── ui/<slug>/           # One folder per component: <slug>.tsx, demo.tsx, docs.ts
│   ├── site/                # Docs site chrome (header, gallery, code blocks, ...)
│   └── bits/                # Lab primitives
├── content/                 # Component catalog, demo and docs indexes, docs navigation
├── lib/                     # cn(), motion tokens, color, webgl/ (shader hook, GLSL), web3/ (format, icons, mock), docs tooling
└── config/site.ts           # Site name, URL and links
scripts/                     # Registry build and consistency checks
```

### Adding a component

1. Create `src/components/ui/<slug>/` with `<slug>.tsx`, `demo.tsx` (each exported function becomes a variant) and `docs.ts`.
2. Document props with JSDoc on the exported `*Props` interface. `@default` tags feed the props table.
3. Set the catalog entry in `src/content/components.ts` to `"ready"`, then add one line each to `src/content/demos.ts` and `src/content/docs.ts`.
4. Run `bun run check`, `bun run lint`, `bun run typecheck` and `bun run build`.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full checklist.

## Deployment

Registry URLs, install commands, the sitemap and the social images all use the site's public URL. Set it before building:

```bash
cp .env.example .env.local   # then edit NEXT_PUBLIC_SITE_URL
bun run build
bun run start
```

On Vercel, the production URL is detected automatically.

## Contributing

Issues and pull requests are welcome. Please read the [contributing guide](./CONTRIBUTING.md) and follow the [code of conduct](./CODE_OF_CONDUCT.md). To report a vulnerability, see [SECURITY.md](./SECURITY.md).

## Acknowledgments

alibar/ui was built and is maintained with help from [Claude](https://www.anthropic.com/claude) by Anthropic. Claude worked as a pair programmer through the whole process: designing and implementing the components and the docs site, testing accessibility and performance, and preparing the repository for open source.

## License

[MIT](./LICENSE) © alibar
