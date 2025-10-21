function r(){const l=window.location.pathname;let a=`
    <li class="nav-item"><a class="nav-link" href="/uklid-domacnosti.html">Domácnost</a></li>
    <li class="nav-item"><a class="nav-link" href="/uklid-firem.html">Pro firmy</a></li>
    <li class="nav-item"><a class="nav-link" href="/airbnb.html">Airbnb</a></li>
    <li class="nav-item"><a class="nav-link" href="/cenik.html">Ceník</a></li>
  `,i="#kontakt";(l.includes("uklid-domacnosti.html")||l.includes("uklid-firem.html")||l.includes("airbnb.html")||l.includes("cenik.html"))&&(a=`
      <li class="nav-item"><a class="nav-link" href="/index.html">Domů</a></li>
      <li class="nav-item"><a class="nav-link" href="/uklid-domacnosti.html">Domácnost</a></li>
      <li class="nav-item"><a class="nav-link" href="/uklid-firem.html">Pro firmy</a></li>
      <li class="nav-item"><a class="nav-link" href="/airbnb.html">Airbnb</a></li>
      <li class="nav-item"><a class="nav-link" href="/cenik.html">Ceník</a></li>
    `,i="/index.html#kontakt"),document.querySelectorAll(".nav-list, .menu-nav-list").forEach(n=>{n.innerHTML=a;const e=n.querySelectorAll(".nav-link");n.querySelectorAll(".menu-nav-list"),e.forEach(t=>{const s=t.getAttribute("href");l.endsWith(s)&&t.classList.add("active")})}),document.querySelectorAll(".contact-link").forEach(n=>{n.setAttribute("href",i)})}console.log("JS načteno");console.log("Cesta:",window.location.pathname);console.log("navList:",document.querySelector(".nav-list"));console.log("contactLink:",document.querySelector(".contact-link"));export{r as default};
