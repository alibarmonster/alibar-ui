"use client";

import { TestimonialWall, type Testimonial } from "@/components/ui/testimonial-wall/testimonial-wall";

const TESTIMONIALS: Testimonial[] = [
  { name: "Maya Chen", title: "Head of Design, Lumivo", quote: "We replaced three internal libraries in a week. The motion feels considered, not decorative.", rating: 5 },
  { name: "Raka Pratama", title: "Staff Engineer, Corvane", quote: "Copy, paste, own it. No wrapper package to fight when we need to change a detail." },
  { name: "Lena Okafor", title: "Founder, Driftwell", quote: "Our onboarding finally feels alive. Conversion on the setup flow went up 18%.", rating: 5 },
  { name: "Omar Haddad", title: "Product Designer, Mosaiq", quote: "Keyboard support and reduced motion are handled for every component. That's rare." },
  { name: "Sari Wibowo", title: "Frontend Lead, Tessaly", quote: "The swap widget saved us a sprint. Bigint everywhere, no rounding surprises.", rating: 4 },
  { name: "Theo Laurent", title: "CTO, Quorvex", quote: "It reads like code our own senior engineers would write: small, typed, no magic." },
  { name: "Nadia Rahman", title: "Design Engineer, Brightloom", quote: "The springs are tuned beautifully. I stopped tweaking easing curves by hand.", rating: 5 },
  { name: "Bima Santoso", title: "Engineer, Halvane", quote: "Dropped the logo grid into our marketing site in ten minutes. It just fit." },
  { name: "Iris Novak", title: "Head of Growth, Nimbra", quote: "Every interaction has a reason. Our landing page bounce rate dropped noticeably.", rating: 5 },
  { name: "Dimas Arya", title: "Indie Hacker, Fernwick", quote: "The docs show every state. I didn't need to read the source to ship." },
  { name: "Laras Putri", title: "UX Lead, Orbiq", quote: "Accessible by default. Our audit came back with zero issues on these components.", rating: 5 },
  { name: "Felix Moreau", title: "Engineer, Pylonix", quote: "Tiny bundle impact, and nothing runs when it's offscreen. Performance stayed green." },
];

export function Default() {
  return <TestimonialWall testimonials={TESTIMONIALS} />;
}

export function Short() {
  return <TestimonialWall testimonials={TESTIMONIALS.slice(0, 9)} height={360} speed={14} />;
}
