import { mdiEmail, mdiLinkedin, mdiMapMarker, mdiPhone, mdiSchool } from '@mdi/js';

/**
 * Builds the resume HTML. Where each section goes:
 *   - sections with `###` entries      → main column (paginated, "continued" on later pages)
 *   - the Education section            → contact list under the name, with a school icon
 *   - every other section              → sidebar on the first page
 *
 * The page itself is assembled in the browser by `paginate()`, which pulls from
 * the #flow container and the two sidebar templates rendered here.
 *
 * @typedef {import('./parse-resume.js').Resume} Resume
 * @typedef {import('./parse-resume.js').Section} Section
 * @typedef {import('./parse-resume.js').Entry} Entry
 * @typedef {import('./parse-resume.js').Block} Block
 */

const EDUCATION_SECTION = 'education';

const CONTACT_ICONS = {
  education: mdiSchool,
  location: mdiMapMarker,
  email: mdiEmail,
  phone: mdiPhone,
  linkedin: mdiLinkedin,
};

/**
 * @param {Resume} resume
 * @param {string} css
 */
export function renderHtml(resume, css) {
  const isEducation = (section) => section.title.toLowerCase() === EDUCATION_SECTION;
  const mainSections = resume.sections.filter((section) => section.entries.length > 0);
  const sidebarSections = resume.sections.filter(
    (section) => section.entries.length === 0 && !isEducation(section),
  );
  const education = resume.sections.find(isEducation);

  const header = `
    <h1 class="name">${escapeHtml(resume.name)}</h1>
    ${renderContacts(resume, education)}`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(resume.name)} — Resume</title>
  <style>${css}</style>
</head>
<body>
  <template id="sidebar-first-page">${header}${sidebarSections.map(renderSidebarSection).join('')}</template>
  <template id="sidebar-other-pages">${header}</template>
  <div id="flow" hidden>${mainSections.map(renderMainSection).join('')}</div>
  <div id="pages"></div>
</body>
</html>`;
}

/**
 * @param {Resume} resume
 * @param {Section | undefined} education
 */
function renderContacts(resume, education) {
  const educationItems = (education?.blocks ?? []).flatMap(blockItems);
  const items = [
    ...educationItems.map((html) => renderContact('education', html)),
    ...resume.contacts.map(({ kind, label, href }) => {
      const text = escapeHtml(label);
      return renderContact(kind, href ? `<a href="${escapeHtml(href)}">${text}</a>` : text);
    }),
  ];
  return `<ul class="contacts">${items.join('')}</ul>`;
}

function renderContact(kind, contentHtml) {
  return `<li class="contact">${renderIcon(CONTACT_ICONS[kind])}<span>${contentHtml}</span></li>`;
}

function renderIcon(svgPath) {
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${svgPath}"/></svg>`;
}

/** @param {Section} section */
function renderSidebarSection(section) {
  return `
    <section class="sidebar-section">
      <h2 class="sidebar-section__title">${escapeHtml(section.title)}</h2>
      ${section.blocks.map(renderBlock).join('')}
    </section>`;
}

/**
 * Emits the section title and each entry as separate top-level blocks, so the
 * paginator can move them between pages independently.
 *
 * @param {Section} section
 */
function renderMainSection(section) {
  const sectionAttribute = `data-section="${escapeHtml(section.title)}"`;
  return `
    <h2 class="section-title" ${sectionAttribute}>${escapeHtml(section.title)}</h2>
    ${section.blocks.map((block) => `<div ${sectionAttribute}>${renderBlock(block)}</div>`).join('')}
    ${section.entries.map((entry) => renderEntry(entry, sectionAttribute)).join('')}`;
}

/** @param {Entry} entry */
function renderEntry(entry, sectionAttribute) {
  return `
    <article class="entry" ${sectionAttribute}>
      <h3 class="entry__title">${escapeHtml(entry.title)}</h3>
      <div class="entry__header">
        <span class="entry__organization">${entry.organization}</span>
        <span class="entry__dates">${entry.dates}</span>
      </div>
      ${entry.blocks.map(renderBlock).join('')}
    </article>`;
}

/** @param {Block} block */
function renderBlock(block) {
  return block.kind === 'list'
    ? `<ul>${block.items.map((item) => `<li>${item}</li>`).join('')}</ul>`
    : `<p>${block.html}</p>`;
}

/** @param {Block} block */
function blockItems(block) {
  return block.kind === 'list' ? block.items : [block.html];
}

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
