
(() => {
  const products = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
  const photos = window.PHOTOS || {};
  const grid = document.getElementById('productGrid');
  const search = document.getElementById('search');
  const clearSearch = document.getElementById('clearSearch');
  const categoryBox = document.getElementById('categories');
  const catPrev = document.getElementById('catPrev');
  const catNext = document.getElementById('catNext');
  const reset = document.getElementById('reset');
  const resultCount = document.getElementById('resultCount');
  const viewer = document.getElementById('viewer');
  const viewerImg = document.getElementById('viewerImg');
  const viewerTitle = document.getElementById('viewerTitle');
  const viewerClose = document.getElementById('viewerClose');

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));
  const article = p => String(p.article ?? '').trim();
  const title = p => p.name ?? p.title ?? ('Артикул ' + article(p));
  const cat = p => p.kind ?? p.category ?? p.type ?? p.group ?? '';

  function imageFor(p) {
    return photos[article(p)] || p.image || '';
  }

  function normalize(value) {
    return String(value ?? '')
      .toLocaleLowerCase('ru-RU')
      .replace(/ё/g, 'е')
      .replace(/[^a-zа-я0-9]+/gi, '');
  }

  const cats = [...new Set(products.map(cat).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru'));
  categoryBox.innerHTML =
    '<button class="cat active" data-cat="">Все</button>' +
    cats.map(c => `<button class="cat" data-cat="${esc(c)}">${esc(c)}</button>`).join('');

  let activeCat = '';

  function render(list) {
    grid.innerHTML = '';
    resultCount.textContent = `Показано: ${list.length} из ${products.length}`;

    if (!list.length) {
      grid.innerHTML = '<div class="empty">Ничего не найдено. Попробуйте другой артикул или название.</div>';
      return;
    }

    const frag = document.createDocumentFragment();
    list.forEach(p => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `<div class="photo"><img alt="${esc(title(p))}"></div>
        <div class="info"><h3>${esc(title(p))}</h3>
        ${article(p) ? `<div class="article">Артикул: ${esc(article(p))}</div>` : ''}
        ${cat(p) ? `<div class="category">${esc(cat(p))}</div>` : ''}</div>`;

      const img = card.querySelector('img');
      const src = imageFor(p);
      if (src) {
        img.src = src;
        img.addEventListener('click', () => openViewer(p));
      } else {
        img.classList.add('no-photo');
        img.alt = 'Фото отсутствует';
      }
      frag.appendChild(card);
    });
    grid.appendChild(frag);
  }

  function openViewer(p) {
    const src = imageFor(p);
    viewerTitle.textContent = `${title(p)}${article(p) ? ' · Артикул ' + article(p) : ''}`;
    if (src) viewerImg.src = src; else viewerImg.removeAttribute('src');
    viewer.classList.add('open');
    viewer.setAttribute('aria-hidden','false');
  }

  function closeViewer() {
    viewer.classList.remove('open');
    viewer.setAttribute('aria-hidden','true');
  }

  function filter() {
    const raw = search.value.trim();
    const q = normalize(raw);
    const terms = q ? [q] : [];

    const list = products.filter(p => {
      const hay = normalize([
        article(p), title(p), cat(p), p.group || '', p.unit || ''
      ].join(' '));
      return (!terms.length || terms.every(t => hay.includes(t))) &&
             (!activeCat || cat(p) === activeCat);
    });

    render(list);
    document.querySelector('.searchWrap').classList.toggle('hasText', !!raw);
    updateCategoryArrows();
  }

  function updateCategoryArrows() {
    const max = categoryBox.scrollWidth - categoryBox.clientWidth;
    catPrev.disabled = categoryBox.scrollLeft <= 2;
    catNext.disabled = categoryBox.scrollLeft >= max - 2;
  }

  search.addEventListener('input', filter);
  clearSearch.addEventListener('click', () => {
    search.value = '';
    search.focus();
    filter();
  });

  reset.addEventListener('click', () => {
    search.value = '';
    activeCat = '';
    document.querySelectorAll('.cat').forEach(b => b.classList.toggle('active', !b.dataset.cat));
    categoryBox.scrollTo({left: 0, behavior: 'smooth'});
    filter();
  });

  categoryBox.addEventListener('click', e => {
    const b = e.target.closest('.cat');
    if (!b) return;
    activeCat = b.dataset.cat || '';
    document.querySelectorAll('.cat').forEach(x => x.classList.toggle('active', x === b));
    filter();
  });

  catPrev.addEventListener('click', () => {
    categoryBox.scrollBy({left: -Math.max(220, categoryBox.clientWidth * .7), behavior: 'smooth'});
  });
  catNext.addEventListener('click', () => {
    categoryBox.scrollBy({left: Math.max(220, categoryBox.clientWidth * .7), behavior: 'smooth'});
  });
  categoryBox.addEventListener('scroll', updateCategoryArrows, {passive:true});
  window.addEventListener('resize', updateCategoryArrows);

  viewerClose.addEventListener('click', closeViewer);
  viewer.addEventListener('click', e => { if (e.target === viewer) closeViewer(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeViewer(); });

  render(products);
  requestAnimationFrame(updateCategoryArrows);
})();
