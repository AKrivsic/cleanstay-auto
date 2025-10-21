// import './css/style.css';
import { initBurgerMenu } from './js/burgerMenu.js';
import { initCalculator } from './js/calculator.js';
import './js/chat-widget.js';
import './css/style.css';

// 1. Načtení partialů
async function loadPartials() {
  const includeElements = document.querySelectorAll('[data-include]');
  const promises = [...includeElements].map(async (el) => {
    const file = el.getAttribute('data-include');
    if (file) {
      const res = await fetch(file);
      const html = await res.text();
      el.innerHTML = html;
    }
  });

  return Promise.all(promises);
}

// 2. Inicializace po načtení partialů
loadPartials().then(() => {
  import('./js/header-handler.js').then((module) => {
    if (module.default) module.default(); // zavolá `initHeaderHandler()`
  });
  initBurgerMenu();
  initCalculator();

  // 2.1 Header handler – import dynamicky
  // import('./js/header-handler.js').then((module) => {
  //   if (module.default) module.default();
  // });

  // 2.2 Smooth scroll na #kontakt (musí být po načtení DOM!)
  const link = document.querySelector(".contact-link");
  const kontaktSekce = document.querySelector("#kontakt");

  if (link && kontaktSekce) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      kontaktSekce.scrollIntoView({ behavior: "smooth" });
    });
  }
});
