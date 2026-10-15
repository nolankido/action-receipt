import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

execFileSync(process.execPath, ["node_modules/vite/bin/vite.js", "build", "--config", "vite.static.config.ts"], { stdio: "inherit" });
const root = path.resolve("dist");
function localAsset(relative) {
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(root + path.sep)) throw new Error("A bundled asset is outside the output directory.");
  return resolved;
}
let html = await readFile(path.join(root, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)];
if (scripts.length !== 1 || (await readdir(path.join(root, "assets"))).filter(p => p.endsWith(".js")).length !== 1) throw new Error("Offline packaging requires one self-contained JavaScript bundle.");
for (const match of scripts) {
  const js = (await readFile(localAsset(match[1]), "utf8")).replace(/<\/script/gi, "<\\/script");
  html = html.replace(match[0], () => `<script type="module">${js}</script>`);
}
for (const match of [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)]) {
  const css = (await readFile(localAsset(match[1]), "utf8")).replace(/<\/style/gi, "<\\/style");
  html = html.replace(match[0], () => `<style>${css}</style>`);
}
const icon = (await readFile("public/favicon.svg")).toString("base64");
html = html.replace(/href="(?:\.\/)?favicon.svg"/, `href="data:image/svg+xml;base64,${icon}"`);
const csp = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'";
html = html.replace(/<meta charset="UTF-8">/i, `<meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="${csp}">`);
const notices = [];
for (const file of ["LICENSE", "node_modules/react/LICENSE", "node_modules/react-dom/LICENSE", "node_modules/lucide-react/LICENSE", "node_modules/zod/LICENSE"]) {
  notices.push(`${file}\n${await readFile(file, "utf8")}`);
}
html += `\n<!-- Bundled license notices\n${notices.join("\n\n").replace(/--/g, "- -")}\n-->\n`;
if (/<script\b[^>]*src=|<link\b[^>]*rel="stylesheet"|href="(?:\.\/)?favicon.svg"/i.test(html)) throw new Error("An external runtime asset remains in the offline app.");
if (!html.includes("connect-src 'none'")) throw new Error("The offline network-blocking policy is missing.");
await mkdir("release", { recursive: true });
for (const target of ["dist/index.html", "dist/action-receipt.html", "release/action-receipt.html"]) await writeFile(target, html);
console.log(`Offline app packaged: release/action-receipt.html (${Buffer.byteLength(html).toLocaleString()} bytes). No runtime model, API or remote assets.`);
