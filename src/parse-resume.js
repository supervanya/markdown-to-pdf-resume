import { marked } from 'marked';

/**
 * Turns resume Markdown into a structured object. Inline Markdown (bold,
 * italics, links) is converted to HTML here, so the renderer only arranges it.
 *
 * Expected Markdown shape:
 *
 *   # Name
 *   Location · Phone · Email · LinkedIn: linkedin.com/in/handle
 *
 *   ## Section                  (sidebar sections: Summary, Skills, ...)
 *   Paragraphs or lists. A paragraph of `·`-separated items becomes a list.
 *
 *   ## Section with entries     (main column: Work Experience, ...)
 *   ### Entry title
 *   **Organization** — Place · _Dates_      (the first paragraph is the entry's header line)
 *   Optional description paragraphs.
 *   - Bullet points
 *
 * @typedef {{ kind: 'paragraph', html: string } | { kind: 'list', items: string[] }} Block
 * @typedef {{ title: string, organization: string, dates: string, blocks: Block[] }} Entry
 * @typedef {{ title: string, blocks: Block[], entries: Entry[] }} Section
 * @typedef {{ kind: 'location' | 'phone' | 'email' | 'linkedin', label: string, href?: string }} Contact
 * @typedef {{ name: string, contacts: Contact[], sections: Section[] }} Resume
 */

const ITEM_SEPARATOR = ' · ';

/**
 * @param {string} markdown
 * @returns {Resume}
 */
export function parseResume(markdown) {
  /** @type {Resume} */
  const resume = { name: '', contacts: [], sections: [] };
  /** @type {Section | undefined} */
  let section;
  /** @type {Entry | undefined} */
  let entry;

  for (const token of marked.lexer(markdown)) {
    if (token.type === 'heading') {
      if (token.depth === 1) {
        resume.name = token.text;
      } else if (token.depth === 2) {
        section = { title: token.text, blocks: [], entries: [] };
        resume.sections.push(section);
        entry = undefined;
      } else if (section) {
        entry = { title: token.text, organization: '', dates: '', blocks: [] };
        section.entries.push(entry);
      }
    } else if (token.type === 'paragraph' || token.type === 'list') {
      if (!section) {
        resume.contacts.push(...parseContacts(token.text));
      } else if (entry && !entry.organization) {
        Object.assign(entry, parseEntryHeader(token.text));
      } else {
        (entry ?? section).blocks.push(toBlock(token));
      }
    }
    // Horizontal rules and blank lines only separate things visually in the Markdown.
  }

  return resume;
}

/** @returns {Block} */
function toBlock(token) {
  if (token.type === 'list') {
    return { kind: 'list', items: token.items.map((item) => marked.parseInline(item.text)) };
  }
  if (token.text.includes(ITEM_SEPARATOR)) {
    return { kind: 'list', items: token.text.split(ITEM_SEPARATOR).map((item) => marked.parseInline(item)) };
  }
  return { kind: 'paragraph', html: marked.parseInline(token.text) };
}

/** Splits `**Org** — Place · _Dates_` into its organization and dates. */
function parseEntryHeader(text) {
  const separatorIndex = text.lastIndexOf(ITEM_SEPARATOR);
  if (separatorIndex === -1) {
    return { organization: marked.parseInline(text), dates: '' };
  }
  return {
    organization: marked.parseInline(text.slice(0, separatorIndex)),
    dates: marked.parseInline(text.slice(separatorIndex + ITEM_SEPARATOR.length)),
  };
}

/** @returns {Contact[]} */
function parseContacts(text) {
  return text.split(ITEM_SEPARATOR).map((item) => parseContact(item.trim()));
}

/** @returns {Contact} */
function parseContact(item) {
  const linkedIn = item.match(/linkedin\.com\/in\/([\w-]+)/i);
  if (linkedIn) {
    return { kind: 'linkedin', label: `@${linkedIn[1]}`, href: `https://www.linkedin.com/in/${linkedIn[1]}` };
  }
  if (/^\S+@\S+\.\S+$/.test(item)) {
    return { kind: 'email', label: item, href: `mailto:${item}` };
  }
  if (/^\+?[\d\s().-]{7,}$/.test(item)) {
    return { kind: 'phone', label: item, href: `tel:${item.replace(/[^\d+]/g, '')}` };
  }
  return { kind: 'location', label: item };
}
