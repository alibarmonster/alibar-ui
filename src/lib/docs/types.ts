/** Hand-written docs that live next to each component as `docs.ts`. */
export interface ComponentDocs {
  /** Minimal usage snippet shown under "Usage". */
  usage: string;
  /** Keyboard, screen reader and reduced-motion notes. */
  a11y: string[];
  /** Optional caveats shown under the props table. */
  notes?: string[];
}

export interface PropDoc {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
}

export interface PropsGroup {
  name: string;
  /** Native element whose attributes are forwarded, e.g. "button". */
  extendsElement?: string;
  /** Radix part whose props are forwarded, e.g. "Checkbox.Root". */
  extendsComponent?: string;
  props: PropDoc[];
}

export interface DemoVariant {
  /** Export name in demo.tsx. */
  name: string;
  label: string;
  code: string;
}
