"use client";

import { useId, type ComponentProps, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface FloatingLabelInputProps extends Omit<ComponentProps<"input">, "size"> {
  /** Text of the label that floats into the border. */
  label: string;
  /** Helper text under the field. */
  description?: string;
  /** Error message under the field. Also marks the input invalid. */
  error?: string;
  /** Field height. @default "md" */
  size?: "sm" | "md" | "lg";
  /** Classes for the outer wrapper. */
  className?: string;
}

const sizes = {
  sm: { input: "h-10", half: "1.25rem" },
  md: { input: "h-12", half: "1.5rem" },
  lg: { input: "h-14", half: "1.75rem" },
} as const;

// Floating is pure CSS (:focus-within, :placeholder-shown, :autofill), so it is
// correct before hydration and for browser autofill.
const floated = [
  "group-focus-within/field:-translate-y-[calc(50%+var(--field-half))] group-focus-within/field:scale-75",
  "group-has-[input:not(:placeholder-shown)]/field:-translate-y-[calc(50%+var(--field-half))] group-has-[input:not(:placeholder-shown)]/field:scale-75",
  "group-has-[input:autofill]/field:-translate-y-[calc(50%+var(--field-half))] group-has-[input:autofill]/field:scale-75",
].join(" ");

const notchOpen =
  "group-focus-within/field:scale-x-0 group-has-[input:not(:placeholder-shown)]/field:scale-x-0 group-has-[input:autofill]/field:scale-x-0";

export function FloatingLabelInput({
  label,
  description,
  error,
  size = "md",
  className,
  id,
  placeholder,
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: FloatingLabelInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const invalid = Boolean(error) || ariaInvalid === true || ariaInvalid === "true";
  const message = error ?? description;

  return (
    <div className={cn("group/field w-full", className)} style={{ "--field-half": sizes[size].half } as CSSProperties}>
      <div className="relative">
        <input
          id={inputId}
          // A single space keeps :placeholder-shown meaningful when no placeholder is given.
          placeholder={placeholder ?? " "}
          aria-invalid={invalid || undefined}
          aria-describedby={[message ? messageId : null, describedBy].filter(Boolean).join(" ") || undefined}
          className={cn(
            "peer block w-full rounded-md bg-transparent px-3 text-sm text-foreground outline-none",
            "placeholder:text-transparent focus:placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
            sizes[size].input,
          )}
          {...props}
        />
        {/* The border. The legend reserves a notch the size of the floated label;
            a 1px "bridge" covers the notch until the label floats up into it. */}
        <fieldset
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 -top-[5px] bottom-0 m-0 min-w-0 rounded-md border border-input px-[9px] text-left shadow-xs transition-colors duration-200",
            "group-focus-within/field:border-2 group-focus-within/field:border-ring group-focus-within/field:px-[8px]",
            "group-hover/field:border-[color-mix(in_oklab,var(--input),var(--foreground)_15%)] group-focus-within/field:group-hover/field:border-ring",
            invalid && "border-destructive group-hover/field:border-destructive group-focus-within/field:border-destructive",
          )}
        >
          <legend className="invisible relative block h-[11px] w-auto max-w-full p-0 text-[0.65625rem] leading-none whitespace-nowrap">
            <span className="inline-block px-0.5">{label}</span>
            <span
              className={cn(
                "visible absolute inset-x-0 top-[5px] h-px origin-center transition-transform duration-200 ease-out motion-reduce:transition-none",
                invalid ? "bg-destructive" : "bg-input",
                notchOpen,
              )}
            />
          </legend>
        </fieldset>
        <label
          htmlFor={inputId}
          className={cn(
            "pointer-events-none absolute top-1/2 left-3 max-w-[calc(100%-1.5rem)] origin-[left_center] -translate-y-1/2 truncate text-sm text-muted-foreground",
            "transition-[translate,scale,color] duration-200 ease-out motion-reduce:transition-[color] group-focus-within/field:text-primary",
            floated,
            invalid && "text-destructive group-focus-within/field:text-destructive",
          )}
        >
          {label}
        </label>
      </div>

      {/* grid-template-rows 0fr → 1fr animates the message height without measuring. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          message ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <p
            id={messageId}
            aria-live="polite"
            className={cn("px-3 pt-1.5 text-[13px] leading-5", error ? "text-destructive" : "text-muted-foreground")}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
