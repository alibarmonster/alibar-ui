import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { REGISTRY } from "../src/lib/registry";

assert.equal(REGISTRY.length, 17, "Expected 17 core primitives in REGISTRY");
const webglCount = REGISTRY.filter((r) => r.category === "webgl").length;
assert.equal(webglCount, 5, "Expected 5 WebGL shaders in REGISTRY");

for (const item of REGISTRY) {
  const fullPath = path.join(process.cwd(), item.filePath);
  assert.ok(fs.existsSync(fullPath), `Missing component file: ${item.filePath}`);
  const src = fs.readFileSync(fullPath, "utf8");
  assert.ok(src.includes('"use client"'), `${item.filePath} must be a client component`);
}

console.log(`✔ All ${REGISTRY.length} primitives (${webglCount} WebGL2 shaders) verified.`);
