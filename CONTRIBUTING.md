# Contributing to alibar/ui

Thanks for helping out! This guide covers setup, naming conventions and the bar every component has to clear.

## Setup

```bash
git clone https://github.com/alibarmonster/alibar-components.git
cd alibar-components
bun install
bun dev
```

You need Node.js 20.9 or newer and Bun 1.2 or newer. Please use Bun so `bun.lock` stays the only lockfile.

## Git conventions

### Branches

Branch off `main` and name the branch `<type>/<short-kebab-description>`:

```text
feat/magnetic-tabs
fix/dock-focus-ring
docs/theming-guide
chore/update-motion
```

### Commits

Commits follow [Conventional Commits](https://www.conventionalcommits.org):

```text
<type>(<scope>): <summary in the imperative, lower case, no period>
```

| Type | Use it for |
| --- | --- |
| `feat` | A new component, variant or site feature |
| `fix` | A bug fix |
| `perf` | A performance improvement |
| `refactor` | A code change that neither fixes a bug nor adds a feature |
| `docs` | Documentation only (README, docs pages, `docs.ts`) |
| `style` | Formatting only, no behavior change |
| `test` | Adding or fixing tests and checks |
| `build` | Dependencies, lockfile, build or registry tooling |
| `ci` | GitHub Actions and repository automation |
| `chore` | Maintenance that fits none of the above |
| `revert` | Reverting an earlier commit |

Common scopes: a component slug (`dock`, `otp-input`), `ui` (several components), `site`, `docs`, `registry`, `lab`, `deps`.

```text
feat(otp-input): add paste support for grouped codes
fix(dock): keep magnification off for keyboard focus
docs(theming): explain the chart color tokens
build(deps): update motion to 14.10
```

Mark breaking changes (renamed props, removed variants) with `!` after the type or scope, and add a `BREAKING CHANGE:` footer.

Pull requests are squash-merged, so the **PR title** becomes the commit on `main` and must follow the same format. A CI check enforces this.

### Files and code

- Folders and files use kebab-case: `src/components/ui/spring-press-button/spring-press-button.tsx`.
- Components and types use PascalCase (`SpringPressButton`, `SpringPressButtonProps`). Hooks and functions use camelCase.
- Every component folder holds `<slug>.tsx`, `demo.tsx` and `docs.ts`.

## Component checklist

Before opening a PR for a new or changed component, check that:

- [ ] It renders well on a white background and is responsive down to 360px wide. Hit areas are at least 40px.
- [ ] It animates only `transform`, `opacity`, `filter` or `clip-path`. Size changes use layout animations or the grid-rows trick.
- [ ] Motion values come from `src/lib/motion.ts` (durations, easings, springs).
- [ ] `prefers-reduced-motion` gets a fade or instant fallback. Markup and class names must never depend on `useReducedMotion()`, which would cause a hydration mismatch. Use the CSS `motion-reduce:` variant or Motion values instead.
- [ ] It is fully keyboard operable, shows a visible focus ring and uses correct ARIA roles and labels.
- [ ] Props are typed and have defaults. `className` is merged with `cn()`. Stateful components support controlled and uncontrolled use.
- [ ] It has no global state, no external image URLs and no console errors. Timers, observers and listeners are cleaned up.
- [ ] `demo.tsx` exports one to three variants, and `docs.ts` has a description, usage snippet and accessibility notes.

## Before you push

```bash
bun run lint
bun run typecheck
bun run check
bun run build
```

CI runs the same commands on every pull request.

## Reporting bugs and requesting components

Open an issue using one of the templates. For security problems, follow [SECURITY.md](./SECURITY.md) instead of opening a public issue.

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE).
