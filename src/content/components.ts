import { siteConfig } from "../config/site";

export type CategoryId =
  | "buttons"
  | "inputs"
  | "toggles"
  | "overlays"
  | "navigation"
  | "text"
  | "data"
  | "cards"
  | "media"
  | "ai"
  | "web3-wallet"
  | "web3-defi"
  | "marketing"
  | "shaders"
  | "orbits"
  | "galleries"
  | "surfaces"
  | "markets"
  | "billing"
  | "html-canvas";

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  /** Sidebar group heading shared by related categories, e.g. "Web3". */
  group?: string;
  /** Shorter name used under the group heading in the sidebar. */
  navName?: string;
}

export type ComponentStatus = "ready" | "planned";

export interface ComponentEntry {
  slug: string;
  name: string;
  category: CategoryId;
  description: string;
  status: ComponentStatus;
  /** Release that added the component, e.g. "0.2.0". */
  version: string;
  /** True for components added in the current release (shows the "New" badge). */
  isNew: boolean;
}

export const categories: Category[] = [
  { id: "buttons", name: "Buttons & Actions", description: "Presses, confirmations and micro-interactions." },
  { id: "inputs", name: "Inputs & Forms", description: "Fields that format, validate and feel alive." },
  { id: "toggles", name: "Toggles & Selection", description: "Switches, tabs, pickers and choice controls." },
  { id: "overlays", name: "Overlays & Feedback", description: "Modals, sheets, menus, tooltips and toasts." },
  { id: "navigation", name: "Navigation", description: "Docks, palettes, menus and wayfinding." },
  { id: "text", name: "Text Animations", description: "Type that scrambles, streams and reveals." },
  { id: "data", name: "Numbers & Data Display", description: "Counters, charts, rings and stat cards." },
  { id: "cards", name: "Cards & Layout", description: "Tilt, stack, flip, expand and reorder." },
  { id: "media", name: "Media, Scroll & Backgrounds", description: "Marquees, lightboxes and ambient fields." },
  { id: "ai", name: "Loaders, AI & Widgets", description: "Loading states and AI-native interfaces." },
  {
    id: "web3-wallet",
    name: "Web3: Wallet & Identity",
    navName: "Wallet & Identity",
    group: "Web3",
    description: "Connect, identify and track transactions.",
  },
  {
    id: "web3-defi",
    name: "Web3: DeFi & Trading",
    navName: "DeFi & Trading",
    group: "Web3",
    description: "Swaps, bridges, charts, staking and gas.",
  },
  { id: "marketing", name: "Marketing Sections & Logo Clouds", description: "Logo clouds, pricing, stats and CTAs." },
  { id: "shaders", name: "Shaders & Backgrounds", description: "GPU shaders and canvas scenes: clouds, gradients, fields and an ASCII aquarium." },
  { id: "orbits", name: "Orbits, Beams & Illustrations", description: "Orbits, beams, globes and graphs." },
  {
    id: "galleries",
    name: "3D Galleries & Carousels",
    navName: "Galleries & Carousels",
    group: "3D Galleries",
    description: "WebGL and CSS 3D image galleries you can drag, scroll and throw.",
  },
  {
    id: "surfaces",
    name: "Physical Surfaces & Navigation",
    navName: "Surfaces & Navigation",
    group: "Physical Surfaces",
    description: "Material cards and tab bars driven by continuous motion values.",
  },
  {
    id: "markets",
    name: "Prediction Markets",
    navName: "Market Components",
    group: "Prediction Markets",
    description: "Odds, trades, order books and leaderboards on simulated data.",
  },
  {
    id: "billing",
    name: "Usage, Billing & Agent Commerce",
    navName: "Usage, Billing & Agents",
    group: "Usage & Billing",
    description: "Spend meters, credit charts, receipts and a wallet agent.",
  },
  {
    id: "html-canvas",
    name: "HTML in Canvas",
    navName: "Live DOM Effects",
    group: "HTML in Canvas",
    description: "Live, interactive DOM drawn into a canvas and distorted (experimental).",
  },
];

type Row = [slug: string, name: string, description: string, status?: ComponentStatus, version?: string];

/** First release; rows without a version belong to it. */
const INITIAL_VERSION = "0.1.0";
const V020 = "0.2.0";
const V030 = "0.3.0";

const rows: Record<CategoryId, Row[]> = {
  buttons: [
    ["spring-press-button", "Spring Press Button", "Scales down on press and springs back on release.", "ready"],
    ["magnetic-button", "Magnetic Button", "Follows the cursor within a radius, then springs home.", "ready"],
    ["shimmer-button", "Shimmer Button", "A soft light sweep travels across the surface.", "ready"],
    ["stateful-button", "Stateful Button", "Idle, loading, success and reset, with a smooth width morph.", "ready"],
    ["hold-to-confirm-button", "Hold to Confirm", "A fill sweeps while held and cancels on early release.", "ready"],
    ["slide-to-confirm", "Slide to Confirm", "Drag the knob to the end to lock in a success state.", "ready"],
    ["like-button", "Like Button", "Heart fills, pops and bursts into particles with a rolling count.", "ready"],
    ["copy-button", "Copy Button", "Copy icon cross-fades into a check with a soft blur.", "ready"],
    ["tactile-button", "Tactile 3D Button", "A keycap with real depth that sinks when pressed.", "ready"],
    ["action-swap-button", "Action Swap Button", "Label and icon swap with blur and a vertical slide.", "ready"],
  ],
  inputs: [
    ["money-input", "Money Input", "Currency prefix, live separators and rolling digits (IDR/USD).", "ready"],
    ["otp-input", "OTP Input", "Gliding focus ring, rolling digits, shake on error, paste support.", "ready"],
    ["floating-label-input", "Floating Label Input", "The label glides into a notch in the border on focus.", "ready"],
    ["password-input", "Password Input", "Show/hide icon morph with an animated strength meter.", "ready"],
    ["search-input", "Search Input", "Clearing dissolves the query one word at a time.", "ready"],
    ["tag-input", "Tag Input", "Chips pop in and out with layout animation.", "ready"],
    ["quantity-stepper", "Quantity Stepper", "Minus and plus with a rolling number, clamped to range.", "ready"],
    ["range-slider", "Range Slider", "Tick dots and a thumb that bounces as it snaps to steps.", "ready"],
    ["phone-input", "Phone Input", "Country selector with live number formatting.", "ready"],
    ["file-dropzone", "File Upload Dropzone", "Drag-over morph, progress rings and per-file states.", "ready"],
  ],
  toggles: [
    ["spring-switch", "Spring Switch", "A thumb with squash, stretch and a double bounce.", "ready"],
    ["animated-checkbox", "Animated Checkbox", "The check stroke draws itself on.", "ready"],
    ["radio-card-group", "Radio Card Group", "Selectable cards with animated borders and arrow-key focus.", "ready"],
    ["segmented-control", "Segmented Control", "A white pill slides between segments.", "ready"],
    ["sliding-tabs", "Sliding Tabs", "Pill, underline and segment indicators on a spring.", "ready"],
    ["expandable-tabs", "Expandable Tabs", "Icon tabs expand into labeled pills; content morphs height.", "ready"],
    ["theme-toggle", "Theme Toggle", "A circular clip-path reveal via the View Transition API.", "ready"],
    ["star-rating", "Star Rating", "Hover preview, staggered pops and half-star support.", "ready"],
    ["color-picker", "Color Picker", "Swatches, a hue slider and a hex input.", "ready"],
    ["animated-select", "Animated Select", "A filterable list that scales from its trigger.", "ready"],
  ],
  overlays: [
    ["morphing-modal", "Morphing Modal", "One panel morphs between inner views with a blur cross-fade.", "ready"],
    ["bottom-sheet", "Bottom Sheet", "Draggable sheet with snap points and inertia.", "ready"],
    ["side-drawer", "Drawer", "Slides from either side with backdrop blur and scroll lock.", "ready"],
    ["origin-dropdown", "Origin-aware Dropdown", "A menu that scales out from its trigger.", "ready"],
    ["morph-menu", "Button-to-Menu Morph", "The trigger button morphs into the menu surface.", "ready"],
    ["glide-tooltip", "Tooltip", "Delayed in, glides between triggers, instant out.", "ready"],
    ["toast-stack", "Toast Stack", "Stacked toasts that expand on hover and swipe away.", "ready"],
    ["notification-badge", "Notification Badge", "A diagonal slide, spring pop and rolling count.", "ready"],
    ["error-shake-field", "Error Shake Field", "A crisp shake with a message that slides down.", "ready"],
    ["banner-stack", "Banner Stack", "Banners stacked three deep; dismissing reorders the deck.", "ready"],
  ],
  navigation: [
    ["dock", "Dock", "Icons magnify based on cursor distance, with tooltips.", "ready"],
    ["command-palette", "Command Palette", "Fuzzy search, grouped results and a spring-driven active row.", "ready"],
    ["dynamic-island", "Dynamic Island", "A pill that morphs between compact and expanded activities.", "ready"],
    ["action-bar", "Expandable Action Bar", "Icon buttons expand into labeled controls.", "ready"],
    ["radial-menu", "Radial Menu", "Items bloom out radially with a stagger.", "ready"],
    ["hover-nav-indicator", "Hover Navigation Indicator", "A highlight glides to the hovered item.", "ready"],
    ["collapsible-sidebar", "Collapsible Sidebar", "Collapses to icons while labels fade out.", "ready"],
    ["animated-breadcrumb", "Animated Breadcrumb", "Items slide in; overflow collapses into a menu.", "ready"],
    ["animated-pagination", "Animated Pagination", "A sliding indicator with rolling page numbers.", "ready"],
    ["proximity-nav", "Proximity Navigation", "Items scale and brighten as the cursor approaches.", "ready"],
  ],
  text: [
    ["text-scramble", "Text Scramble", "Characters scramble, then resolve in place.", "ready"],
    ["typewriter", "Typewriter", "Types, deletes and cycles phrases with a blinking caret.", "ready"],
    ["shimmer-text", "Shimmer Text", "A masked gradient sweep for thinking states.", "ready"],
    ["blur-reveal-text", "Blur Reveal Text", "Words reveal from blur as they scroll into view.", "ready"],
    ["flip-text", "Flip Text", "Letters flip vertically one by one on hover.", "ready"],
    ["word-rotator", "Word Rotator", "A rotating word that morphs its width.", "ready"],
    ["letter-cascade", "Letter Cascade", "Letters drop and swap in sequence.", "ready"],
    ["streaming-text", "Streaming Text", "Words resolve through a soft cross-blur, like an AI stream.", "ready"],
    ["annotated-text", "Annotated Text", "Hand-drawn underlines, circles and highlights.", "ready"],
    ["gradient-text", "Gradient Text", "A slow gradient wash moves across the letters.", "ready"],
  ],
  data: [
    ["number-ticker", "Number Ticker", "Counts up when it scrolls into view.", "ready"],
    ["rolling-digits", "Rolling Digits", "Each digit spins like an odometer reel.", "ready"],
    ["sparkline", "Sparkline", "An inline trend line that draws on, with a change badge.", "ready"],
    ["bar-chart", "Animated Bar Chart", "Bars spring in and reorder when data changes.", "ready"],
    ["area-chart", "Area Chart", "The line draws on, with a snapping crosshair and tooltip.", "ready"],
    ["donut-chart", "Donut Chart", "Segments sweep in; hover isolates one.", "ready"],
    ["progress-ring", "Progress Ring", "An SVG ring animates to its value as the label counts.", "ready"],
    ["activity-rings", "Activity Rings", "Three concentric rings for move, exercise and stand.", "ready"],
    ["contribution-heatmap", "Contribution Heatmap", "A calendar grid that fades in with a stagger.", "ready"],
    ["stat-card", "Stat Card", "A value, delta badge and mini chart that animate on change.", "ready"],
  ],
  cards: [
    ["tilt-card", "Tilt Card", "3D perspective tilt with cursor-tracked glare.", "ready"],
    ["stacked-cards", "Stacked Cards", "A stack that fans out on hover.", "ready"],
    ["swipe-cards", "Swipe Card Stack", "Drag to dismiss with rotation and fling.", "ready"],
    ["bouncy-accordion", "Bouncy Accordion", "Single-open sections with a weighted spring.", "ready"],
    ["expandable-card", "Expandable Card", "A card that expands into a detail view.", "ready"],
    ["folder-card", "Folder Card", "A folder that opens to reveal its contents.", "ready"],
    ["flip-card", "Flip Card", "A front and back 3D flip, wallet-pass style.", "ready"],
    ["spotlight-card", "Spotlight Card", "A radial glow follows the cursor across the surface.", "ready"],
    ["bento-grid", "Bento Grid", "Tiles lift on hover and animate their contents.", "ready"],
    ["sortable-list", "Sortable List", "Drag to reorder with layout animation.", "ready"],
  ],
  media: [
    ["draggable-marquee", "Draggable Marquee", "An infinite loop you can pause and scrub.", "ready"],
    ["logo-carousel", "Logo Carousel", "Logos cycle through fixed slots with a blur swap.", "ready"],
    ["image-lightbox", "Image Lightbox", "Zooms from the thumbnail; swipe between images.", "ready"],
    ["hover-image-reveal", "Hover Image Reveal", "An image follows the cursor across a list.", "ready"],
    ["parallax-slider", "Parallax Slider", "Layers move at different speeds while sliding.", "ready"],
    ["scroll-reveal", "Scroll Reveal Section", "Content blurs in on scroll with a progress bar.", "ready"],
    ["dot-grid", "Interactive Dot Grid", "Dots scale and brighten around the cursor.", "ready"],
    ["aurora-background", "Light Aurora", "Soft pastel blobs drifting on white.", "ready"],
    ["particle-field", "Particle Field", "Canvas particles that repel from the cursor.", "ready"],
    ["shimmering-dots", "Shimmering Grid Dots", "Random dots twinkle across a grid.", "ready"],
  ],
  ai: [
    ["skeleton-reveal", "Skeleton to Content", "A pulsing skeleton cross-fades into content.", "ready"],
    ["spinner-check", "Spinner to Check", "A spinner pops into a drawn checkmark.", "ready"],
    ["matrix-loader", "Matrix Dot Loader", "A 4×4 dot matrix pulsing in patterns.", "ready"],
    ["bars-loader", "Bars Loader", "Equalizer-style bars.", "ready"],
    ["thinking-states", "Thinking States", "A shimmering status line that steps through stages.", "ready"],
    ["ai-prompt-input", "AI Prompt Input", "Auto-growing input with attachments and an orbiting border.", "ready"],
    ["chat-bubbles", "Chat Bubbles", "Messages spring in, with a typing indicator.", "ready"],
    ["voice-orb", "Voice Orb", "A blob that reacts to audio level.", "ready"],
    ["agent-steps", "Agent Progress Steps", "Steps move from loading to done with drawn checks.", "ready"],
    ["swipe-row", "Swipeable List Row", "Swipe to reveal archive and delete actions.", "ready"],
  ],
  "web3-wallet": [
    ["connect-wallet-button", "Connect Wallet Button", "Opens a wallet list, spins while connecting, then morphs into an address pill.", "ready", V020],
    ["wallet-selector-modal", "Wallet Selector Modal", "Wallet list with a Recent badge that morphs into a QR code view.", "ready", V020],
    ["address-pill", "Address Pill", "Generated avatar, truncated address, copy morph and explorer link.", "ready", V020],
    ["network-switcher", "Network Switcher", "Chain dropdown with a switching state and a wrong-network warning.", "ready", V020],
    ["account-dropdown", "Account Dropdown", "Rolling total balance, address actions and disconnect.", "ready", V020],
    ["token-balance-list", "Token Balance List", "Token rows with USD value and 24h change, plus a hide-small-balances toggle.", "ready", V020],
    ["transaction-toast", "Transaction Toast", "A pending ring that resolves into a drawn check or a failure shake.", "ready", V020],
    ["transaction-history", "Transaction History", "Grouped by date; rows expand to show from, to, fee and hash.", "ready", V020],
    ["nft-card", "NFT Card", "Tilt and glare, a rarity badge, price, and traits on hover.", "ready", V020],
    ["transaction-review-modal", "Transaction Review Modal", "Summary, fees and total, confirmed with a hold-to-confirm button.", "ready", V020],
  ],
  "web3-defi": [
    ["token-swap-widget", "Token Swap Widget", "Flip-to-swap panels, a quote countdown, price impact and a staged button.", "ready", V020],
    ["token-selector-modal", "Token Selector Modal", "Search, popular chips and a keyboard-navigable token list.", "ready", V020],
    ["bridge-widget", "Cross-chain Bridge", "An animated route between chains, fee breakdown and progress tracker.", "ready", V020],
    ["slippage-settings", "Slippage Settings", "Preset chips with a sliding indicator, custom input and warnings.", "ready", V020],
    ["token-amount-input", "Token Amount Input", "Balance, percentage chips, USD value and a shake when over balance.", "ready", V020],
    ["price-chart", "Candlestick Chart", "Timeframe tabs, a crosshair with OHLC tooltip and smooth transitions.", "ready", V020],
    ["price-ticker", "Live Price Ticker", "A marquee of pairs with rolling digits and tick flashes.", "ready", V020],
    ["staking-card", "Staking Card", "APY badge, stake and unstake tabs, live rewards and a claim burst.", "ready", V020],
    ["liquidity-pool-card", "Liquidity Pool Card", "Pair icons, TVL and APR, and a two-handle price range.", "ready", V020],
    ["gas-fee-selector", "Gas Fee Selector", "Slow, standard and fast cards with a live pulse and cost.", "ready", V020],
  ],
  marketing: [
    ["logo-grid", "Logo Grid Hover Reveal", "Logos lift on hover to reveal a Learn More link.", "ready", V020],
    ["dual-logo-marquee", "Dual Logo Marquee", "Two rows scrolling in opposite directions with edge fades.", "ready", V020],
    ["logo-cloud-cycle", "Logo Cloud Blur Cycle", "Fixed slots where logos swap one by one with a blur.", "ready", V020],
    ["spotlight-logo-grid", "Spotlight Logo Grid", "A cursor glow lights up the cell borders nearby.", "ready", V020],
    ["testimonial-wall", "Testimonial Wall", "Masonry columns auto-scrolling at different speeds.", "ready", V020],
    ["feature-bento", "Feature Bento Section", "Tiles that each run their own micro-animation.", "ready", V020],
    ["pricing-section", "Pricing Section", "A monthly/yearly pill toggle with rolling prices.", "ready", V020],
    ["stats-section", "Stats Section", "Number tickers that start in view, with hairline dividers.", "ready", V020],
    ["faq-section", "FAQ Section", "A searchable accordion that filters with layout animation.", "ready", V020],
    ["cta-section", "CTA with Border Beam", "A light beam travels around the call-to-action card.", "ready", V020],
  ],
  shaders: [
    ["cloud-shader", "Cloud Shader", "Soft procedural clouds drifting across a sky gradient.", "ready", V020],
    ["mesh-gradient", "Mesh Gradient", "A slowly flowing pastel mesh in four colors.", "ready", V020],
    ["grain-gradient", "Grain Gradient", "A soft gradient with animated film grain.", "ready", V020],
    ["dithered-waves", "Dithered Waves", "Bayer-dithered waves in black on white.", "ready", V020],
    ["liquid-ripple", "Liquid Ripple", "Pointer movement and clicks ripple across a surface.", "ready", V020],
    ["dot-matrix-field", "Dot Matrix Field", "A dot grid scaling with a moving noise field.", "ready", V020],
    ["light-rays", "Light Rays", "Soft rays falling from the top with a gentle sway.", "ready", V020],
    ["gpu-aurora", "GPU Aurora", "A light pastel aurora rendered on the GPU.", "ready", V020],
    ["glow-orb", "Glow Orb", "A noisy, pulsing orb for AI assistants.", "ready", V020],
    ["pixel-reveal-image", "Pixel Reveal Image", "An image resolves from pixelated to sharp.", "ready", V020],
    ["ascii-aquarium-background", "ASCII Aquarium Background", "Glyph sea creatures swim on grid paper and circle your chat input.", "ready", V020],
  ],
  orbits: [
    ["orbiting-circles", "Orbiting Circles", "Icons orbit a center element on concentric rings.", "ready", V020],
    ["integration-hub", "Integration Hub", "Beams connect a center logo to the icons around it.", "ready", V020],
    ["animated-beam", "Animated Beam", "A gradient pulse travels along a curve between two elements.", "ready", V020],
    ["radar-sweep", "Radar Sweep", "A rotating sweep reveals blips as it passes.", "ready", V020],
    ["dotted-globe", "Dotted Globe", "A rotating globe of dots with arcs; drag to spin.", "ready", V020],
    ["ripple-rings", "Ripple Rings", "Concentric rings pulse outward behind an icon.", "ready", V020],
    ["icon-cloud", "Icon Cloud", "Icons on a 3D sphere that auto-rotates; drag to spin.", "ready", V020],
    ["border-beam", "Border Beam", "A light segment travels around any card's border.", "ready", V020],
    ["node-network", "Node Network", "Floating connected nodes; lines highlight on hover.", "ready", V020],
    ["animated-grid-pattern", "Animated Grid Pattern", "Grid squares light up in a subtle random pattern.", "ready", V020],
  ],
  galleries: [
    ["sleeve-rail", "Sleeve Rail", "A fanned rail of album sleeves; the focused record slides out and spins.", "ready", V030],
    ["curved-wall", "Curved Wall", "Image panels on the inside of a cylinder, with drift, steps and dial-like snapping.", "ready", V030],
    ["formation-gallery", "Formation Gallery", "Up to 160 cards flowing between rings, spiral, globe and field.", "ready", V030],
    ["darkroom-stream", "Darkroom Stream", "Photos stream out from the center and develop like prints.", "ready", V030],
    ["ring-reel", "Ring Reel", "A turning wheel of cards that zooms into an arc.", "ready", V030],
    ["helix-gallery", "Helix Gallery", "Cards wound on a vertical helix; scroll or drag to travel along it.", "ready", V030],
    ["depth-rail", "Depth Rail", "A lightweight CSS 3D coverflow with parallax and springy throws.", "ready", V030],
    ["page-flip-book", "Page Flip Book", "Pages turn with a curl and a shadow along the spine.", "ready", V030],
    ["infinite-canvas-gallery", "Infinite Canvas Gallery", "An endless pannable grid with momentum and column parallax.", "ready", V030],
    ["scattered-prints", "Scattered Prints", "Polaroids on a table you can pick up and throw.", "ready", V030],
  ],
  surfaces: [
    ["card-wallet", "Card Wallet", "Metal, black, glass and color cards you can fan, cycle and lift out.", "ready", V030],
    ["lens-tab-bar", "Lens Tab Bar", "A lens slides between tabs and redraws what passes under it inverted.", "ready", V030],
  ],
  markets: [
    ["market-card", "Market Card", "A prediction market with odds, a gauge and Yes/No buttons.", "ready", V030],
    ["trade-ticket", "Trade Ticket", "Buy and sell outcome shares with a live payout summary.", "ready", V030],
    ["probability-chart", "Probability Chart", "Odds over time per outcome with a snapping crosshair.", "ready", V030],
    ["outcome-ladder", "Outcome Ladder", "Outcomes re-sort by probability as the odds move.", "ready", V030],
    ["order-book", "Order Book", "Bids and asks with animated depth bars and the spread.", "ready", V030],
    ["mobile-trade-bar", "Mobile Trade Bar", "A sticky bar that expands into a trade sheet.", "ready", V030],
    ["positions-panel", "Positions Panel", "Open, resolved and past positions with P&L and claims.", "ready", V030],
    ["market-leaderboard", "Market Leaderboard", "A podium and ranked list by profit, volume or accuracy.", "ready", V030],
    ["resolution-card", "Resolution & Rules Card", "A status timeline, rules and a dispute countdown.", "ready", V030],
    ["market-activity", "Market Activity & Discussion", "A live trade stream and a threaded discussion.", "ready", V030],
  ],
  billing: [
    ["spend-meter", "Spend Meter", "Monthly usage by resource against an adjustable limit.", "planned", V030],
    ["credit-trend", "Credit Trend", "Daily credit spend with stacked bars and a projection.", "planned", V030],
    ["credit-breakdown", "Credit Breakdown", "Credits by category, workflow and teammate.", "planned", V030],
    ["printed-receipt", "Printed Receipt", "An order receipt that feeds out of a thermal printer.", "planned", V030],
    ["wallet-agent-chat", "Wallet Agent Chat", "An AI wallet assistant that answers with transaction cards.", "planned", V030],
  ],
  "html-canvas": [
    ["ripple-form", "Ripple Form", "A live sign-up form on a rippling water surface.", "planned", V030],
    ["peel-card", "Peel Card", "A DOM card that curls back like paper to reveal its back.", "planned", V030],
    ["living-book", "Living Book", "A 3D book whose pages are live, selectable DOM.", "planned", V030],
    ["dissolve-transition", "Dissolve Transition", "Outgoing content dissolves into pixels as the next resolves.", "planned", V030],
    ["crt-terminal", "CRT Terminal", "A real terminal on a curved, glowing CRT.", "planned", V030],
    ["disintegrate-delete", "Disintegrate Delete", "Deleted rows crumble into dust, with undo.", "planned", V030],
    ["magnifier-lens", "Magnifier Lens", "A loupe that magnifies the live DOM under the pointer.", "planned", V030],
    ["floating-screen", "Floating Screen", "A live mini-app on a tilted 3D device screen.", "planned", V030],
    ["cloth-banner", "Cloth Banner", "An announcement bar on gently waving cloth.", "planned", V030],
    ["liquid-glass-overlay", "Liquid Glass Overlay", "Draggable glass that refracts the live content below.", "planned", V030],
  ],
};

export const components: ComponentEntry[] = categories.flatMap((category) =>
  rows[category.id].map(([slug, name, description, status = "planned", version = INITIAL_VERSION]) => ({
    slug,
    name,
    category: category.id,
    description,
    status,
    version,
    isNew: version === siteConfig.version,
  })),
);

export const readyComponents = components.filter((c) => c.status === "ready");

export function getComponent(slug: string) {
  return components.find((c) => c.slug === slug);
}

export function getCategory(id: CategoryId) {
  return categories.find((c) => c.id === id)!;
}

/** Previous/next ready component in catalog order. */
export function getSiblings(slug: string) {
  const index = readyComponents.findIndex((c) => c.slug === slug);
  return {
    prev: index > 0 ? readyComponents[index - 1] : undefined,
    next: index >= 0 && index < readyComponents.length - 1 ? readyComponents[index + 1] : undefined,
  };
}
