import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { REGISTRY } from "../src/lib/registry";

assert.equal(REGISTRY.length, 18, "Expected 18 core primitives in REGISTRY");

for (const item of REGISTRY) {
  const fullPath = path.join(process.cwd(), item.filePath);
  assert.ok(fs.existsSync(fullPath), `Missing component file: ${item.filePath}`);
  const src = fs.readFileSync(fullPath, "utf8");
  assert.ok(src.includes('"use client"'), `${item.filePath} must be a client component`);
}

console.log("✔ All 18 component primitives verified.");
