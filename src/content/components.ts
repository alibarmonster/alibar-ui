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
  | "ai";

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
}

export type ComponentStatus = "ready" | "planned";

export interface ComponentEntry {
  slug: string;
  name: string;
  category: CategoryId;
  description: string;
  status: ComponentStatus;
  isNew?: boolean;
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
];

type Row = [slug: string, name: string, description: string, status?: ComponentStatus, isNew?: boolean];

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
    ["skeleton-reveal", "Skeleton to Content", "A pulsing skeleton cross-fades into content.", "ready", true],
    ["spinner-check", "Spinner to Check", "A spinner pops into a drawn checkmark.", "ready", true],
    ["matrix-loader", "Matrix Dot Loader", "A 4×4 dot matrix pulsing in patterns.", "ready", true],
    ["bars-loader", "Bars Loader", "Equalizer-style bars.", "ready", true],
    ["thinking-states", "Thinking States", "A shimmering status line that steps through stages.", "ready", true],
    ["ai-prompt-input", "AI Prompt Input", "Auto-growing input with attachments and an orbiting border.", "ready", true],
    ["chat-bubbles", "Chat Bubbles", "Messages spring in, with a typing indicator.", "ready", true],
    ["voice-orb", "Voice Orb", "A blob that reacts to audio level.", "ready", true],
    ["agent-steps", "Agent Progress Steps", "Steps move from loading to done with drawn checks.", "ready", true],
    ["swipe-row", "Swipeable List Row", "Swipe to reveal archive and delete actions.", "ready", true],
  ],
};

export const components: ComponentEntry[] = categories.flatMap((category) =>
  rows[category.id].map(([slug, name, description, status = "planned", isNew]) => ({
    slug,
    name,
    category: category.id,
    description,
    status,
    ...(isNew ? { isNew } : {}),
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
