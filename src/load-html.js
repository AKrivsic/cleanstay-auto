async function loadIncludes() {
  const elements = document.querySelectorAll('[data-include]');

  for (const el of elements) {
    const url = el.getAttribute('data-include');

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Chyba: ${res.status}`);
      const html = await res.text();
      el.innerHTML = html;
    } catch (err) {
      el.innerHTML = `<p style="color: red;">Nelze načíst ${url}</p>`;
      console.error(`Chyba při načítání ${url}:`, err);
    }
  }
}

loadIncludes();
