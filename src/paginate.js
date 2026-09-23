/**
 * Runs inside the browser page (Puppeteer serializes this function, so it must
 * not reference anything outside its own body).
 *
 * Moves the main-column blocks from #flow onto letter-sized pages one at a
 * time. A block that overflows the page starts the next one, so a job never
 * splits across pages. A section title is never left alone at the bottom of a
 * page, and a section that continues onto a new page gets a "(continued)" title.
 * The first page gets the full sidebar. Later pages get only the name and contacts.
 */
export function paginate() {
  const flow = document.getElementById('flow');
  const pages = document.getElementById('pages');

  const addPage = () => {
    const isFirstPage = pages.childElementCount === 0;
    const sidebarTemplate = document.getElementById(isFirstPage ? 'sidebar-first-page' : 'sidebar-other-pages');

    const page = document.createElement('section');
    page.className = 'page';
    page.innerHTML = '<aside class="sidebar"></aside><main class="main"></main><footer class="page-number"></footer>';
    page.querySelector('.sidebar').append(sidebarTemplate.content.cloneNode(true));
    pages.append(page);
    return page.querySelector('.main');
  };

  const continuedTitle = (sectionTitle) => {
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = sectionTitle;
    title.insertAdjacentHTML('beforeend', ' <span class="section-title__note">(continued)</span>');
    return title;
  };

  const overflows = (column) => column.scrollHeight > column.clientHeight;

  let column = addPage();
  for (const block of [...flow.children]) {
    column.append(block);
    if (!overflows(column)) continue;

    const previous = block.previousElementSibling;
    const carried = previous?.matches('.section-title') ? [previous, block] : [block];
    if (carried.length === column.childElementCount) continue; // Too tall for any page; let it clip.

    column = addPage();
    if (!carried[0].matches('.section-title')) {
      column.append(continuedTitle(block.dataset.section));
    }
    column.append(...carried);
  }

  const numbers = document.querySelectorAll('.page-number');
  numbers.forEach((number, index) => {
    number.textContent = `${index + 1} / ${numbers.length}`;
  });
}
