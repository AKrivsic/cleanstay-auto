export function initBurgerMenu() {
  const burgerBtn = document.getElementById('burgerBtn');
  const menu = document.querySelector('.menu');
  const closeBtn = menu.querySelector('.menu-close-btn');
  const orderBtn = menu.querySelector('.menu-order-link'); // Tlačítko Objednát

  burgerBtn.addEventListener('click', () => {
    menu.classList.toggle('is-open');
    menu.classList.toggle('is-close');
  });

  closeBtn.addEventListener('click', () => {
    menu.classList.remove('is-open');
    menu.classList.add('is-close');
  });

  document.addEventListener('click', (e) => {
    if (
      menu.classList.contains('is-open') &&                 
      !e.target.closest('.menu-wrapper') &&                   
      !e.target.closest('#burgerBtn')                        
    ) {
      menu.classList.remove('is-open');
      menu.classList.add('is-close');
    }
  });

  // Přidání funkce pro zavření menu a přechod na #kontakt
  if (orderBtn) {
    orderBtn.addEventListener('click', (e) => {
      // Zavřít modal
      menu.classList.remove('is-open');
      menu.classList.add('is-close');

      // Přejít na #kontakt
      const kontaktSekce = document.querySelector('#kontakt');
      if (kontaktSekce) {
        kontaktSekce.scrollIntoView({ behavior: 'smooth' });
      }

      // Prevence výchozího chování odkazu
      e.preventDefault();
    });
  }
}

