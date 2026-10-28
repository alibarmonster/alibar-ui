import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { REGISTRY } from "../src/lib/registry";

assert.equal(REGISTRY.length, 6, "Expected 6 core primitives in REGISTRY");

for (const item of REGISTRY) {
  const fullPath = path.join(process.cwd(), item.filePath);
  assert.ok(fs.existsSync(fullPath), `Missing component file: ${item.filePath}`);
  const src = fs.readFileSync(fullPath, "utf8");
  assert.ok(src.includes('"use client"'), `${item.filePath} must be a client component`);
}

console.log("✔ All 6 component primitives verified.");
