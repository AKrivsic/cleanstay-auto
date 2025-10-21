export default function initHeaderHandler() {
  const path = window.location.pathname;

  let navHTML = `
    <li class="nav-item"><a class="nav-link" href="uklid-domacnosti.html">Domácnost</a></li>
    <li class="nav-item"><a class="nav-link" href="uklid-firem.html">Pro firmy</a></li>
    <li class="nav-item"><a class="nav-link" href="airbnb.html">Airbnb</a></li>
    <li class="nav-item"><a class="nav-link" href="cenik.html">Ceník</a></li>
  `;
  let contactHref = "#kontakt";

  if (path.includes("uklid-domacnosti.html") || path.includes("uklid-firem.html") || path.includes("airbnb.html") || path.includes("cenik.html")) {
    navHTML = `
      <li class="nav-item"><a class="nav-link" href="index.html">Domů</a></li>
      <li class="nav-item"><a class="nav-link" href="uklid-domacnosti.html">Domácnost</a></li>
      <li class="nav-item"><a class="nav-link" href="uklid-firem.html">Pro firmy</a></li>
      <li class="nav-item"><a class="nav-link" href="airbnb.html">Airbnb</a></li>
      <li class="nav-item"><a class="nav-link" href="cenik.html">Ceník</a></li>
    `;
    contactHref = "/index.html#kontakt";
  }

  // Naplníme hlavní i modální menu
  const navLists = document.querySelectorAll(".nav-list, .menu-nav-list");
  navLists.forEach(nav => {
    nav.innerHTML = navHTML;

const links = nav.querySelectorAll(".nav-link"); 
const modalLinks = nav.querySelectorAll(".menu-nav-list");
    links.forEach(link => {
      const href = link.getAttribute("href");
      if (path.endsWith(href)) {
        link.classList.add("active");
      }
    });
  });

  const contactLinks = document.querySelectorAll(".contact-link");
  contactLinks.forEach(link => {
    link.setAttribute("href", contactHref);
  });
}