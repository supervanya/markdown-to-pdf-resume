# markdown-to-pdf-resume

Turns a Markdown resume into a two-column, letter-sized PDF: name, contacts, and summary/skills in a sidebar, work experience in the main column.

## Usage

```sh
npm install
npm run build -- Jessica_Danley_Resume-september-2026.md              # → output/Jessica_Danley_Resume-september-2026.pdf
npm run build -- Jessica_Danley_Resume-september-2026.md -o resume.pdf
npm run watch -- Jessica_Danley_Resume-september-2026.md              # rebuild on every save of the .md or src/styles.css
```

To work with the actual resume with the file that's outside:

```sh
npm run watch -- "../Current Resume/Jessica_Danley_Resume-september-2026.md" --output "../Current Resume/Jessica_Danley_Resume-september-2026.pdf"
```

Watch mode is easiest with the PDF open in a viewer that reloads changed files, such as macOS Preview or VS Code's PDF preview.

## Markdown conventions

```md
# Full Name

City, ST · 555-555-5555 · me@example.com · LinkedIn: linkedin.com/in/handle

## Summary ← sections without ### entries go in the sidebar (first page)

A paragraph or two.

## Core Skills

Skill one · Skill two · Skill three ← `·`-separated paragraphs become lists

## Work Experience ← sections with ### entries go in the main column

### Job Title

**Company** — City, ST · _Start – End_ ← first line of an entry: organization · dates
Optional description.

- Bullet points

## Education ← shown in the contact list with a graduation-cap icon

**Degree, School**
```

Jobs never split across pages. When a section continues onto a new page, its title repeats with "(continued)".

## How it works

| File                  | Role                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------- |
| `src/cli.js`          | Reads arguments and the Markdown file, then runs the steps below                        |
| `src/parse-resume.js` | Markdown → structured resume object (via [marked](https://marked.js.org))               |
| `src/render-html.js`  | Resume object → HTML, with icons from [@mdi/js](https://pictogrammers.com/library/mdi/) |
| `src/styles.css`      | All visual styling (fonts, sizes, spacing, colors)                                      |
| `src/paginate.js`     | Runs in the browser, laying blocks out onto fixed-size pages                            |
| `src/render-pdf.js`   | Prints the result to PDF with [Puppeteer](https://pptr.dev) (headless Chrome)           |

To change the look, edit `src/styles.css`. Layout sizes and colors are variables at the top.
