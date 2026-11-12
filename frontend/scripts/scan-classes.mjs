import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(scriptDir, "..", "src");

const classes = new Set();
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.tsx?$/.test(entry.name)) {
      const source = fs.readFileSync(file, "utf8");
      for (const match of source.matchAll(/className="([^"{]+)"/g)) {
        match[1].split(/\s+/).forEach((token) => token && classes.add(token));
      }
      for (const match of source.matchAll(/"([a-z][a-z0-9]*(?:-[a-z0-9]+)+)"/g)) {
        classes.add(match[1]);
      }
    }
  }
};

walk(srcDir);
const css = fs.readFileSync(path.join(srcDir, "styles.css"), "utf8");
const defined = new Set([...css.matchAll(/\.([A-Za-z][\w-]*)/g)].map((m) => m[1]));
console.log([...classes].filter((name) => !defined.has(name)).sort().join("\n"));
