"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { AnimatedCheckbox, type CheckedState } from "@/components/ui/animated-checkbox/animated-checkbox";

export function Default() {
  return (
    <div className="flex max-w-xs items-start gap-3">
      <AnimatedCheckbox id="terms" className="mt-0.5" />
      <label htmlFor="terms" className="cursor-pointer">
        <span className="block text-sm font-medium text-foreground">Accept terms and conditions</span>
        <span className="mt-0.5 block text-[13px] text-muted-foreground">You agree to our Terms of Service and Privacy Policy.</span>
      </label>
    </div>
  );
}

const TASKS = ["Draft the launch post", "Record the demo video", "Update the changelog", "Ship v1.0"];

export function TaskList() {
  const [done, setDone] = useState<Set<number>>(() => new Set([0]));
  return (
    <ul className="w-full max-w-xs space-y-1 rounded-xl border border-border bg-background p-2 shadow-sm">
      {TASKS.map((task, i) => {
        const checked = done.has(i);
        return (
          <li key={task} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/60">
            <AnimatedCheckbox
              id={`task-${i}`}
              checked={checked}
              onCheckedChange={(next) =>
                setDone((current) => {
                  const updated = new Set(current);
                  if (next === true) updated.add(i);
                  else updated.delete(i);
                  return updated;
                })
              }
            />
            <label
              htmlFor={`task-${i}`}
              className={`relative cursor-pointer text-sm transition-colors duration-200 ${checked ? "text-muted-foreground" : "text-foreground"}`}
            >
              {task}
              <motion.span
                aria-hidden="true"
                className="absolute inset-x-0 top-1/2 h-px origin-left bg-muted-foreground"
                initial={false}
                animate={{ scaleX: checked ? 1 : 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              />
            </label>
          </li>
        );
      })}
    </ul>
  );
}

const CHANNELS = ["Email", "Push", "SMS"];

export function SelectAll() {
  const [selected, setSelected] = useState<string[]>(["Email"]);
  const all: CheckedState = selected.length === CHANNELS.length ? true : selected.length ? "indeterminate" : false;

  return (
    <fieldset className="w-full max-w-xs space-y-3">
      <legend className="sr-only">Notification channels</legend>
      <div className="flex items-center gap-3">
        <AnimatedCheckbox
          id="all-channels"
          checked={all}
          onCheckedChange={() => setSelected(all === true ? [] : CHANNELS)}
        />
        <label htmlFor="all-channels" className="cursor-pointer text-sm font-medium text-foreground">
          All channels
        </label>
      </div>
      <div className="ml-2.5 space-y-3 border-l border-border pl-5">
        {CHANNELS.map((channel) => (
          <div key={channel} className="flex items-center gap-3">
            <AnimatedCheckbox
              id={`channel-${channel}`}
              checked={selected.includes(channel)}
              onCheckedChange={(next) =>
                setSelected((current) => (next === true ? [...current, channel] : current.filter((c) => c !== channel)))
              }
            />
            <label htmlFor={`channel-${channel}`} className="cursor-pointer text-sm text-foreground">
              {channel}
            </label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
