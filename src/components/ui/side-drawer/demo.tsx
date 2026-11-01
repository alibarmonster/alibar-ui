"use client";

import { useState } from "react";
import { BarChart3, FolderKanban, Home, Inbox, Menu, Minus, Plus, Settings, ShoppingBag, Users } from "lucide-react";
import { SideDrawer } from "@/components/ui/side-drawer/side-drawer";

const trigger =
  "inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-ring";

const ITEMS = [
  { id: "mug", name: "Stoneware mug", price: 18, hue: "from-amber-200 to-orange-400" },
  { id: "tote", name: "Canvas tote", price: 32, hue: "from-sky-200 to-blue-500" },
  { id: "print", name: "Riso print, A3", price: 45, hue: "from-rose-200 to-fuchsia-500" },
];

export function Default() {
  const [qty, setQty] = useState<Record<string, number>>({ mug: 2, tote: 1, print: 1 });
  const total = ITEMS.reduce((sum, item) => sum + item.price * (qty[item.id] ?? 0), 0);

  return (
    <SideDrawer
      title="Your cart"
      description={`${Object.values(qty).reduce((a, b) => a + b, 0)} items`}
      trigger={
        <button type="button" className={trigger}>
          <ShoppingBag className="size-4" aria-hidden="true" />
          Open cart
        </button>
      }
      footer={
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium text-foreground tabular-nums">${total}.00</span>
          </div>
          <button type="button" className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-md bg-foreground text-sm font-medium text-background hover:bg-foreground/90">
            Checkout
          </button>
        </div>
      }
    >
      <ul className="space-y-4">
        {ITEMS.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <span className={`size-14 shrink-0 rounded-lg bg-gradient-to-br ${item.hue}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
              <p className="text-[13px] text-muted-foreground tabular-nums">${item.price}.00</p>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
              <button
                type="button"
                aria-label={`Fewer ${item.name}`}
                onClick={() => setQty((q) => ({ ...q, [item.id]: Math.max(0, (q[item.id] ?? 0) - 1) }))}
                className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full hover:bg-accent"
              >
                <Minus className="size-3.5" aria-hidden="true" />
              </button>
              <span className="w-5 text-center text-sm tabular-nums">{qty[item.id]}</span>
              <button
                type="button"
                aria-label={`More ${item.name}`}
                onClick={() => setQty((q) => ({ ...q, [item.id]: (q[item.id] ?? 0) + 1 }))}
                className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full hover:bg-accent"
              >
                <Plus className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </SideDrawer>
  );
}

const NAV = [
  { label: "Home", icon: Home },
  { label: "Inbox", icon: Inbox },
  { label: "Projects", icon: FolderKanban },
  { label: "Analytics", icon: BarChart3 },
  { label: "Members", icon: Users },
  { label: "Settings", icon: Settings },
];

export function Navigation() {
  const [active, setActive] = useState("Home");
  return (
    <SideDrawer
      side="left"
      size="sm"
      title="Workspace"
      trigger={
        <button type="button" className={trigger}>
          <Menu className="size-4" aria-hidden="true" />
          Menu
        </button>
      }
    >
      <nav aria-label="Workspace">
        <ul className="space-y-0.5">
          {NAV.map(({ label, icon: Icon }) => (
            <li key={label}>
              <button
                type="button"
                aria-current={active === label ? "page" : undefined}
                onClick={() => setActive(label)}
                className={`flex h-10 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-sm transition-colors ${active === label ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </SideDrawer>
  );
}
