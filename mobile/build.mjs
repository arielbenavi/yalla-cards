// Builds the iPhone app's web layer into mobile/www (what Capacitor ships).
//
//   node mobile/build.mjs                     production: https://yalla-cards.vercel.app
//   API_BASE=http://localhost:3000 DRY_RUN=1 node mobile/build.mjs
//                                             test build: local server, grades never written
import { build } from "esbuild";
import { copyFileSync, mkdirSync, rmSync } from "node:fs";

const out = "mobile/www";
const apiBase = process.env.API_BASE ?? "https://yalla-cards.vercel.app";
const dryRun = process.env.DRY_RUN === "1";

rmSync(out, { recursive: true, force: true });
mkdirSync(`${out}/fonts`, { recursive: true });

await build({
  entryPoints: ["mobile/src/main.tsx"],
  bundle: true,
  minify: true,
  outfile: `${out}/app.js`,
  target: "safari16",
  jsx: "automatic",
  tsconfig: "tsconfig.json",
  define: {
    __API_BASE__: JSON.stringify(apiBase),
    __DRY_RUN__: String(dryRun),
    "process.env.NODE_ENV": '"production"',
  },
  logLevel: "warning",
});

copyFileSync("mobile/src/index.html", `${out}/index.html`);
copyFileSync("mobile/src/app.css", `${out}/app.css`);
const font = "node_modules/@fontsource/ibm-plex-sans-hebrew/files/ibm-plex-sans-hebrew-hebrew";
copyFileSync(`${font}-400-normal.woff2`, `${out}/fonts/plex-hebrew-400.woff2`);
copyFileSync(`${font}-700-normal.woff2`, `${out}/fonts/plex-hebrew-700.woff2`);

console.log(`mobile/www built → ${apiBase}${dryRun ? " (DRY RUN: grades are not written)" : ""}`);
