import puppeteer from 'puppeteer';
import { paginate } from './paginate.js';

/**
 * Loads the HTML into headless Chrome, lays it out into pages, and prints it
 * to a PDF. The page size comes from the stylesheet's `@page` rule.
 *
 * @param {string} html
 * @param {string} outputPath
 */
export async function renderPdf(html, outputPath) {
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    // Lay out with print styles so the measurements match the printed PDF.
    await page.emulateMediaType('print');
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(paginate);
    await page.pdf({ path: outputPath, preferCSSPageSize: true, printBackground: true });
  } finally {
    await browser.close();
  }
}
