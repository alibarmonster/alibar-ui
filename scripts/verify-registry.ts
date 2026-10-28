import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { REGISTRY } from "../src/lib/registry";

assert.equal(REGISTRY.length, 63, "Expected 63 core primitives in REGISTRY");
const oglCount = REGISTRY.filter((r) => r.category === "ogl").length;
assert.equal(oglCount, 20, "Expected 20 OGL shaders in REGISTRY");
const webglCount = REGISTRY.filter((r) => r.category === "webgl").length;
assert.equal(webglCount, 31, "Expected 31 WebGL shaders in REGISTRY");

for (const item of REGISTRY) {
  const fullPath = path.join(process.cwd(), item.filePath);
  assert.ok(fs.existsSync(fullPath), `Missing component file: ${item.filePath}`);
  const src = fs.readFileSync(fullPath, "utf8");
  assert.ok(src.includes('"use client"'), `${item.filePath} must be a client component`);
}

console.log(`✔ All ${REGISTRY.length} primitives (${webglCount} WebGL2 shaders) verified.`);
