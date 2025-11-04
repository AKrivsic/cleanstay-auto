function m(){const l=window.location.pathname;let a=`
    <li class="nav-item"><a class="nav-link" href="uklid-domacnosti.html">Domácnost</a></li>
    <li class="nav-item"><a class="nav-link" href="uklid-firem.html">Pro firmy</a></li>
    <li class="nav-item"><a class="nav-link" href="airbnb.html">Airbnb</a></li>
    <li class="nav-item"><a class="nav-link" href="cenik.html">Ceník</a></li>
  `,n="#kontakt";(l.includes("uklid-domacnosti.html")||l.includes("uklid-firem.html")||l.includes("airbnb.html")||l.includes("cenik.html"))&&(a=`
      <li class="nav-item"><a class="nav-link" href="index.html">Domů</a></li>
      <li class="nav-item"><a class="nav-link" href="uklid-domacnosti.html">Domácnost</a></li>
      <li class="nav-item"><a class="nav-link" href="uklid-firem.html">Pro firmy</a></li>
      <li class="nav-item"><a class="nav-link" href="airbnb.html">Airbnb</a></li>
      <li class="nav-item"><a class="nav-link" href="cenik.html">Ceník</a></li>
    `,n="/index.html#kontakt"),document.querySelectorAll(".nav-list, .menu-nav-list").forEach(i=>{i.innerHTML=a;const e=i.querySelectorAll(".nav-link");i.querySelectorAll(".menu-nav-list"),e.forEach(t=>{const s=t.getAttribute("href");l.endsWith(s)&&t.classList.add("active")})}),document.querySelectorAll(".contact-link").forEach(i=>{i.setAttribute("href",n)})}export{m as default};
