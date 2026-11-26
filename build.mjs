#!/usr/bin/env node
/**
 * Zero-dependency bundler for Happy Mrs. Chicken (《快乐小鸡·成长乐园》).
 * Reads index.html, inlines css/*.css and js/*.js in exact dependency order,
 * and writes a self-contained single-file HTML bundle.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_HTML = path.join(__dirname, 'index.html');
const DEFAULT_OUTPUT_HTML = '/Users/lizhi/.gemini/antigravity/brain/3bc1dd78-3223-4809-bba9-daae4d753c08/happy_mrs_chicken.html';
const OUTPUT_HTML = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_OUTPUT_HTML;

const html = fs.readFileSync(SOURCE_HTML, 'utf8');

const inlinedCss = [];
const inlinedJs = [];

// 0. Strip relative PWA manifest.json & icon.svg <link> tags so single-file bundle makes zero relative requests
let bundled = html
  .replace(/^[ \t]*<link\s+[^>]*href=["'](?:\.\/)?manifest\.json["'][^>]*\/?>[ \t]*\r?\n?/gm, '')
  .replace(/^[ \t]*<link\s+[^>]*rel=["']apple-touch-icon["'][^>]*href=["'](?:\.\/)?icon\.svg["'][^>]*\/?>[ \t]*\r?\n?/gm, '');

const iconPath = path.join(__dirname, 'icon.svg');
const iconDataHref = fs.existsSync(iconPath)
  ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fs.readFileSync(iconPath, 'utf8').trim())}`
  : '';
bundled = bundled.replace(
  /^[ \t]*<link\s+[^>]*href=["'](?:\.\/)?icon\.svg["'][^>]*\/?>[ \t]*\r?\n?/gm,
  iconDataHref ? `  <link rel="icon" type="image/svg+xml" href="${iconDataHref}" />\n` : ''
);

// 1. Inline all local <link rel="stylesheet" href="css/..."> tags
const cssLinkRegex = /^[ \t]*<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["'](css\/[^"']+)["'][^>]*\/?>[ \t]*\r?\n?/gm;
let cssInsertMarkerPlaced = false;
bundled = bundled.replace(cssLinkRegex, (_match, relPath) => {
  const fullPath = path.join(__dirname, relPath);
  const content = fs.readFileSync(fullPath, 'utf8').trim();
  inlinedCss.push({ relPath, content });
  if (!cssInsertMarkerPlaced) {
    cssInsertMarkerPlaced = true;
    return '  <!--__INLINE_CSS__-->\n';
  }
  return '';
});

if (inlinedCss.length === 0) {
  throw new Error('No css/*.css stylesheet links found in index.html');
}

const combinedCss = inlinedCss
  .map(({ relPath, content }) => `/* === ${relPath} === */\n${content}`)
  .join('\n\n');

bundled = bundled.replace(
  '  <!--__INLINE_CSS__-->',
  `  <style>\n${combinedCss}\n  </style>`
);

// 2. Inline all local <script defer src="js/..."></script> tags
const jsScriptRegex = /^[ \t]*<script(?:\s+defer)?\s+src=["'](js\/[^"']+)["']\s*><\/script>[ \t]*\r?\n?/gm;
let jsInsertMarkerPlaced = false;
bundled = bundled.replace(jsScriptRegex, (_match, relPath) => {
  const fullPath = path.join(__dirname, relPath);
  const content = fs.readFileSync(fullPath, 'utf8').trim();
  inlinedJs.push({ relPath, content });
  if (!jsInsertMarkerPlaced) {
    jsInsertMarkerPlaced = true;
    return '  <!--__INLINE_JS__-->\n';
  }
  return '';
});

if (inlinedJs.length === 0) {
  throw new Error('No js/*.js script tags found in index.html');
}

const combinedJs =
  'window.__HMC_SINGLE_FILE__ = true;\n\n' +
  inlinedJs
    .map(({ relPath, content }) => `// === ${relPath} ===\n${content}`)
    .join('\n\n');

// Validate combined JS syntax before writing bundle
new Function(combinedJs);

// Escape any closing script tag sequence safely inside inline script
const safeJs = combinedJs.replace(/<\/script/gi, '<\\/script');

bundled = bundled.replace(
  '  <!--__INLINE_JS__-->',
  `  <script>\n${safeJs}\n  </script>`
);

const outDir = path.dirname(OUTPUT_HTML);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
fs.writeFileSync(OUTPUT_HTML, bundled, 'utf8');

const bytes = Buffer.byteLength(bundled, 'utf8');
const lines = bundled.split('\n').length;
console.log(`Built standalone bundle: ${OUTPUT_HTML}`);
console.log(`  CSS (${inlinedCss.length}): ${inlinedCss.map(x => x.relPath).join(', ')}`);
console.log(`  JS  (${inlinedJs.length}): ${inlinedJs.map(x => x.relPath).join(', ')}`);
console.log(`  Size: ${bytes} bytes (${lines} lines)`);
