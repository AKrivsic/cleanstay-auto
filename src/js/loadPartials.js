async function loadPartials() {
  const includeElements = document.querySelectorAll('[data-include]');
  const promises = [...includeElements].map(async (el) => {
    const file = el.getAttribute('data-include');
    if (file) {
      const res = await fetch(file);
      const html = await res.text();
      el.innerHTML = html;
      console.log('Načtený obsah:', html); // Zobrazí načtený obsah
    }
  });

  return Promise.all(promises);
}
