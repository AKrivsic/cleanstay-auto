(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))a(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const r of t.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&a(r)}).observe(document,{childList:!0,subtree:!0});function o(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function a(e){if(e.ep)return;e.ep=!0;const t=o(e);fetch(e.href,t)}})();const y="modulepreload",b=function(s){return"/cleanstay/"+s},p={},h=function(n,o,a){let e=Promise.resolve();if(o&&o.length>0){let r=function(l){return Promise.all(l.map(c=>Promise.resolve(c).then(f=>({status:"fulfilled",value:f}),f=>({status:"rejected",reason:f}))))};document.getElementsByTagName("link");const i=document.querySelector("meta[property=csp-nonce]"),d=(i==null?void 0:i.nonce)||(i==null?void 0:i.getAttribute("nonce"));e=r(o.map(l=>{if(l=b(l),l in p)return;p[l]=!0;const c=l.endsWith(".css"),f=c?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${f}`))return;const u=document.createElement("link");if(u.rel=c?"stylesheet":y,c||(u.as="script"),u.crossOrigin="",u.href=l,d&&u.setAttribute("nonce",d),document.head.appendChild(u),c)return new Promise((m,v)=>{u.addEventListener("load",m),u.addEventListener("error",()=>v(new Error(`Unable to preload CSS for ${l}`)))})}))}function t(r){const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=r,window.dispatchEvent(i),!i.defaultPrevented)throw r}return e.then(r=>{for(const i of r||[])i.status==="rejected"&&t(i.reason);return n().catch(t)})};function k(){const s=document.getElementById("burgerBtn"),n=document.querySelector(".menu"),o=n.querySelector(".menu-close-btn"),a=n.querySelector(".menu-order-link");s.addEventListener("click",()=>{n.classList.toggle("is-open"),n.classList.toggle("is-close")}),o.addEventListener("click",()=>{n.classList.remove("is-open"),n.classList.add("is-close")}),document.addEventListener("click",e=>{n.classList.contains("is-open")&&!e.target.closest(".menu-wrapper")&&!e.target.closest("#burgerBtn")&&(n.classList.remove("is-open"),n.classList.add("is-close"))}),a&&a.addEventListener("click",e=>{n.classList.remove("is-open"),n.classList.add("is-close");const t=document.querySelector("#kontakt");t&&t.scrollIntoView({behavior:"smooth"}),e.preventDefault()})}function g(){const s=document.getElementById("space-type");if(!s){console.warn("Kalkulačka nebyla nalezena v DOMu");return}const n=document.getElementById("dynamic-inputs"),o=document.getElementById("result"),a=()=>{var d,l;const e=s.value;let t=0;const r=document.getElementById("frequency"),i=r?parseFloat(r.value):1;if(e==="byt"){const c=document.getElementById("byt-size");t=1e3*parseFloat((c==null?void 0:c.value)||0)*i}else e==="kancelar"?t=parseFloat(((d=document.getElementById("office-size"))==null?void 0:d.value)||0)*22*i:e==="airbnb"&&(t=parseInt(((l=document.getElementById("airbnb-count"))==null?void 0:l.value)||0)*500);t>0?(o.textContent=`Odhadovaná cena: ${Math.ceil(t/50)*50} Kč`,o.classList.remove("hidden")):(o.textContent="",o.classList.add("hidden"))};s.addEventListener("change",()=>{const e=s.value;n.innerHTML="",o.classList.add("hidden");let t="";e==="byt"&&(t=`
      <div class="form-group">
        <label for="byt-size">Velikost bytu/domu</label>
        <select id="byt-size" class="form-input">
          <option value="" disabled selected>Vyberte velikost bytu/domu</option>
          <option value="1">1+kk</option>
          <option value="1.5">2+kk</option>
          <option value="2">3+kk</option>
          <option value="2.5">4+kk a větší</option>
        </select>
      </div>
      <div class="form-group">
        <label for="frequency">Četnost úklidu</label>
        <select id="frequency" class="form-input">
          <option value="" disabled selected>Vyberte četnost úklidu</option>
          <option value="1">Jednorázový úklid</option>
          <option value="0.8">Týdenní</option>
          <option value="0.9">Každých 14 dnů</option>
        </select>
      </div>
    `),e==="kancelar"&&(t=`
      <div class="form-group">
        <label for="office-size">Rozloha kanceláře (m²)</label>
        <input id="office-size" type="number" class="form-input" placeholder="Např. 80">
      </div>
      <div class="form-group">
        <label for="frequency">Četnost úklidu</label>
        <select id="frequency" class="form-input">
          <option value="" disabled selected>Vyberte četnost úklidu</option>
          <option value="1">Jednorázový úklid</option>
          <option value="0.8">Týdenní</option>
          <option value="0.9">Každých 14 dnů</option>
        </select>
      </div>
    `),e==="airbnb"&&(t=`
      <div class="form-group">
        <label for="airbnb-count">Počet jednotek k úklidu</label>
        <input id="airbnb-count" type="number" class="form-input" placeholder="Např. 3">
      </div>
    `),n.innerHTML=t,setTimeout(()=>{n.querySelectorAll("select, input").forEach(i=>i.addEventListener("input",a))},0)})}async function L(){const n=[...document.querySelectorAll("[data-include]")].map(async o=>{const a=o.getAttribute("data-include");if(a){const t=await(await fetch(a)).text();o.innerHTML=t}});return Promise.all(n)}L().then(()=>{h(()=>import("./header-handler-0973Dvgf.js"),[]).then(o=>{o.default&&o.default()}),k(),g();const s=document.querySelector(".contact-link"),n=document.querySelector("#kontakt");s&&n&&s.addEventListener("click",function(o){o.preventDefault(),n.scrollIntoView({behavior:"smooth"})})});
