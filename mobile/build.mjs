// Builds the iPhone app's web layer into mobile/www (what Capacitor ships).
//
//   node mobile/build.mjs                     production: https://yalla-cards.vercel.app
//   API_BASE=http://localhost:3000 DRY_RUN=1 node mobile/build.mjs
//                                             test build: local server, grades never written
//   node mobile/build.mjs --web               the website's offline copy: public/app, same-origin API
//                                             (run by `npm run build`, so Vercel ships it)
import { build } from "esbuild";
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const web = process.argv.includes("--web");
const out = web ? "public/app" : "mobile/www";
const apiBase = web ? "" : process.env.API_BASE ?? "https://yalla-cards.vercel.app";
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

// The website serves this under /app/, and the service worker also hands it out
// for any page that cannot load offline (/today, /review…) — a base keeps its
// relative app.js / app.css pointing at /app/ from wherever it is shown.
const html = readFileSync("mobile/src/index.html", "utf8");
writeFileSync(`${out}/index.html`, web ? html.replace("<head>", '<head>\n    <base href="/app/" />') : html);
copyFileSync("mobile/src/app.css", `${out}/app.css`);
const font = "node_modules/@fontsource/ibm-plex-sans-hebrew/files/ibm-plex-sans-hebrew-hebrew";
copyFileSync(`${font}-400-normal.woff2`, `${out}/fonts/plex-hebrew-400.woff2`);
copyFileSync(`${font}-700-normal.woff2`, `${out}/fonts/plex-hebrew-700.woff2`);

console.log(`${out} built → ${apiBase || "same origin"}${dryRun ? " (DRY RUN: grades are not written)" : ""}`);
