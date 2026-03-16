#!/usr/bin/env node
/**
 * Post-build minify for dist/ output.
 * Vite lib mode with format 'es' does not fully minify (keeps whitespace for tree-shaking).
 * This script runs esbuild minify on the built JS (and optionally CSS) so the final files are minified.
 */
import { buildSync } from 'esbuild'
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '..', 'dist')
const widgetJs = join(distDir, 'widget.js')
const widgetCss = join(distDir, 'widget.css')

if (!existsSync(widgetJs)) {
  console.error('dist/widget.js not found. Run vite build first.')
  process.exit(1)
}

// Minify JS with esbuild (output to temp then replace).
// The Vite bundle may contain require("fs") from deps (e.g. opentype.js/xlsx); esbuild leaves them
// as-is and warns when format is ESM. We silence that warning—output is still valid.
const outJs = join(distDir, 'widget.min.js')
buildSync({
  entryPoints: [widgetJs],
  outfile: outJs,
  minify: true,
  bundle: false, // single file already bundled by Vite
  format: 'esm',
  target: 'esnext',
  write: true,
  logOverride: { 'unsupported-require-call': 'silent' }
})
renameSync(outJs, widgetJs)
console.log('Minified dist/widget.js')

// Minify CSS (esbuild can minify CSS)
if (existsSync(widgetCss)) {
  const css = readFileSync(widgetCss, 'utf8')
  const minified = css
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
    .replace(/\s+/g, ' ')              // collapse whitespace
    .trim()
  writeFileSync(widgetCss, minified)
  console.log('Minified dist/widget.css')
}
