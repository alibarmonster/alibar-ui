# alibar-components

Personal collection of WebGL2 shaders, spring-physics tactile controls, and interactive UI primitives built for React 19, Next.js 16, and Tailwind CSS v4.

## Architecture

- **Raw WebGL2 Fullscreen Pipeline (`src/hooks/use-glsl.ts`)**: Bypasses heavy 3D scene graphs for 2D fragment shaders. Caps devicePixelRatio at 2x, interpolates pointer uniforms, pauses offscreen render loops via `IntersectionObserver`, and explicitly disposes GPU buffers/programs on unmount.
- **Tactile Controls (`src/components/bits/`)**: Built with pointer capture (`setPointerCapture`), keyboard ARIA semantics (`slider`, `tablist`), and spring physics (`motion/react`).
- **Zero-Package Ownership**: Every component in `src/components/bits/` is self-contained and ready to copy into any project.

## Components

- `ferrofluid-shader.tsx` — Domain-warped FBM liquid metal surface with magnetic cursor distortion.
- `dither-field.tsx` — Ordered 4x4 Bayer matrix quantization shader.
- `caustic-beams.tsx` — Multi-harmonic interferometric light curves with exponential tone mapping.
- `tactile-knob.tsx` — Rotary encoder knob with vertical drag, SVG arc gauge, and spring digit roller.
- `elastic-tabs.tsx` — Shared-layout morphing pill tabs with velocity spring physics.
- `reasoning-trace.tsx` — Collapsible execution trace card with staggered step telemetry.

## Development

```bash
bun install
bun run dev
bun run build
```
