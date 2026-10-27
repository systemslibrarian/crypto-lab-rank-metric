import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../dist/", import.meta.url);
const required = ["index.html"];

for (const relative of required) {
  const info = await stat(new URL(relative, root));
  if (!info.isFile() || info.size === 0) {
    throw new Error(`missing or empty build asset: ${relative}`);
  }
}

const assets = await readdir(new URL("assets/", root));
if (!assets.some((name) => name.endsWith(".js"))) {
  throw new Error("production build has no JavaScript bundle");
}
if (!assets.some((name) => name.endsWith(".css"))) {
  throw new Error("production build has no CSS bundle");
}
if (assets.some((name) => name.endsWith(".map"))) {
  throw new Error("production build unexpectedly contains source maps");
}

const html = await readFile(new URL("index.html", root), "utf8");
if (!html.includes("Rank Metric Lab") || !html.includes("Not a cryptosystem")) {
  throw new Error("production HTML is missing the lesson identity or scope marker");
}

const assetBytes = await Promise.all(
  assets.map(async (name) => (await stat(join(new URL("assets/", root).pathname, name))).size),
);
console.log(
  `verified build: ${assets.length + 1} files, ${assetBytes.reduce((a, b) => a + b, html.length)} bytes`,
);
