import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "dist");

const entries = [
  "404.html",
  "assets",
  "beats",
  "beats.html",
  "camera",
  "camera.html",
  "css",
  "favicon.ico",
  "favicon.svg",
  "favicon-16.png",
  "favicon-32.png",
  "index.html",
  "js",
  "robots.txt",
  "settings",
  "settings.html",
  "setup",
  "setup.html",
  "sitemap.xml",
  "vidcord"
];

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

await Promise.all(
  entries.map((entry) =>
    cp(path.join(root, entry), path.join(outDir, entry), { recursive: true })
  )
);

console.log(`Copied ${entries.length} static entries to ${path.relative(root, outDir)}/`);
