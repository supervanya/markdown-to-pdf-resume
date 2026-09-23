#!/usr/bin/env node
import { watch as watchDirectory } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { parseResume } from './parse-resume.js';
import { renderHtml } from './render-html.js';
import { renderPdf } from './render-pdf.js';

const STYLES_PATH = fileURLToPath(new URL('./styles.css', import.meta.url));

const USAGE = `Usage: resume-pdf <resume.md> [--output <file.pdf>] [--watch]

Options:
  -o, --output  Where to write the PDF (default: output/<resume name>.pdf)
  -w, --watch   Rebuild whenever the resume or styles.css changes
  -h, --help    Show this message`;

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: 'string', short: 'o' },
      watch: { type: 'boolean', short: 'w' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  const [inputPath] = positionals;
  if (values.help || !inputPath) {
    console.log(USAGE);
    process.exitCode = values.help ? 0 : 1;
    return;
  }

  const outputPath = values.output ?? path.join('output', `${path.parse(inputPath).name}.pdf`);
  let lastSources = await readSources(inputPath);
  await build(lastSources, outputPath);

  if (values.watch) {
    const rebuildIfChanged = async () => {
      const sources = await readSources(inputPath);
      // File events also fire when nothing changed (e.g. iCloud Drive touching a file as it syncs).
      if (sources.markdown === lastSources.markdown && sources.css === lastSources.css) return;
      lastSources = sources;
      await build(sources, outputPath);
    };

    // Queue rebuilds so two quick saves never render into the same file at once.
    let pending = Promise.resolve();
    watchFiles([inputPath, STYLES_PATH], () => {
      pending = pending.then(rebuildIfChanged).catch((error) => console.error(error.message));
    });
    console.log('Watching for changes. Press Ctrl+C to stop.');
  }
}

async function readSources(inputPath) {
  const [markdown, css] = await Promise.all([readFile(inputPath, 'utf8'), readFile(STYLES_PATH, 'utf8')]);
  return { markdown, css };
}

async function build({ markdown, css }, outputPath) {
  const html = renderHtml(parseResume(markdown), css);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await renderPdf(html, outputPath);

  console.log(`${new Date().toLocaleTimeString()}  Wrote ${outputPath}`);
}

/**
 * Calls `onChange` after any of `files` is saved. Watches the parent directories
 * rather than the files themselves: many editors save by replacing the file,
 * which would silently end a watcher attached to the original file.
 */
function watchFiles(files, onChange) {
  const watched = new Set(files.map((file) => path.resolve(file)));
  let debounceTimer;

  for (const directory of new Set([...watched].map((file) => path.dirname(file)))) {
    watchDirectory(directory, (_event, filename) => {
      if (!filename || !watched.has(path.join(directory, filename))) return;
      // A single save often fires several events; wait for them to settle.
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(onChange, 150);
    });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
