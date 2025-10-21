(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))a(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const l of t.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&a(l)}).observe(document,{childList:!0,subtree:!0});function o(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function a(e){if(e.ep)return;e.ep=!0;const t=o(e);fetch(e.href,t)}})();const v="modulepreload",g=function(i){return"/"+i},f={},b=function(n,o,a){let e=Promise.resolve();if(o&&o.length>0){let l=function(c){return Promise.all(c.map(r=>Promise.resolve(r).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};document.getElementsByTagName("link");const s=document.querySelector("meta[property=csp-nonce]"),d=(s==null?void 0:s.nonce)||(s==null?void 0:s.getAttribute("nonce"));e=l(o.map(c=>{if(c=g(c),c in f)return;f[c]=!0;const r=c.endsWith(".css"),m=r?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${m}`))return;const u=document.createElement("link");if(u.rel=r?"stylesheet":v,r||(u.as="script"),u.crossOrigin="",u.href=c,d&&u.setAttribute("nonce",d),document.head.appendChild(u),r)return new Promise((y,h)=>{u.addEventListener("load",y),u.addEventListener("error",()=>h(new Error(`Unable to preload CSS for ${c}`)))})}))}function t(l){const s=new Event("vite:preloadError",{cancelable:!0});if(s.payload=l,window.dispatchEvent(s),!s.defaultPrevented)throw l}return e.then(l=>{for(const s of l||[])s.status==="rejected"&&t(s.reason);return n().catch(t)})};function k(){const i=document.getElementById("burgerBtn"),n=document.querySelector(".menu"),o=n.querySelector(".menu-close-btn"),a=n.querySelector(".menu-order-link");i.addEventListener("click",()=>{n.classList.toggle("is-open"),n.classList.toggle("is-close")}),o.addEventListener("click",()=>{n.classList.remove("is-open"),n.classList.add("is-close")}),document.addEventListener("click",e=>{n.classList.contains("is-open")&&!e.target.closest(".menu-wrapper")&&!e.target.closest("#burgerBtn")&&(n.classList.remove("is-open"),n.classList.add("is-close"))}),a&&a.addEventListener("click",e=>{n.classList.remove("is-open"),n.classList.add("is-close");const t=document.querySelector("#kontakt");t&&t.scrollIntoView({behavior:"smooth"}),e.preventDefault()})}function E(){const i=document.getElementById("space-type");if(!i){console.warn("Kalkulačka nebyla nalezena v DOMu");return}const n=document.getElementById("dynamic-inputs"),o=document.getElementById("result"),a=()=>{var d,c;const e=i.value;let t=0;const l=document.getElementById("frequency"),s=l?parseFloat(l.value):1;if(e==="byt"){const r=document.getElementById("byt-size");t=1e3*parseFloat((r==null?void 0:r.value)||0)*s}else e==="kancelar"?t=parseFloat(((d=document.getElementById("office-size"))==null?void 0:d.value)||0)*22*s:e==="airbnb"&&(t=parseInt(((c=document.getElementById("airbnb-count"))==null?void 0:c.value)||0)*500);t>0?(o.textContent=`Odhadovaná cena: ${Math.ceil(t/50)*50} Kč`,o.classList.remove("hidden")):(o.textContent="",o.classList.add("hidden"))};i.addEventListener("change",()=>{const e=i.value;n.innerHTML="",o.classList.add("hidden");let t="";e==="byt"&&(t=`
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
    `),n.innerHTML=t,setTimeout(()=>{n.querySelectorAll("select, input").forEach(s=>s.addEventListener("input",a))},0)})}const L="https://cleanstay-chat-api2.vercel.app/api/chat",I=()=>{let i=localStorage.getItem("chatSessionId");return i||(i=crypto.randomUUID(),localStorage.setItem("chatSessionId",i)),i},S=I(),p=document.createElement("link");p.rel="stylesheet";p.href="/src/css/chat-widget.css";document.head.appendChild(p);const w=`
  <div id="cleanstay-chatbot">
    <button id="chat-toggle">
      💬
      <span id="chat-hint">Chcete pomoc?</span>
    </button>
    <div id="chat-window" hidden>
      <div id="chat-header">🧼 CleanStay asistent <button id="chat-close">✖</button></div>
      <div id="chat-messages"></div>
      <form id="chat-form">
        <input type="text" id="chat-input" placeholder="Zeptej se na úklid..." required />
        <button type="submit">📤</button>
      </form>
    </div>
  </div>
`;document.addEventListener("DOMContentLoaded",()=>{document.body.insertAdjacentHTML("beforeend",w);const i=document.getElementById("chat-toggle"),n=document.getElementById("chat-window"),o=document.getElementById("chat-form"),a=document.getElementById("chat-input"),e=document.getElementById("chat-messages"),t=document.getElementById("chat-hint"),l=document.getElementById("chat-close"),s=(d,c)=>{const r=document.createElement("div");r.className=`chat-msg ${c}`,r.textContent=d,e.appendChild(r),e.scrollTop=e.scrollHeight};i.onclick=()=>{n.classList.toggle("open");const d=n.classList.contains("open");t.style.display=d?"none":"inline"},l==null||l.addEventListener("click",()=>{n.classList.remove("open"),t.style.display="inline"}),o.onsubmit=async d=>{d.preventDefault();const c=a.value.trim();if(!c)return;s(c,"user"),a.value="",s("...přemýšlím...","bot");const u=(await(await fetch(L,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:c,sessionId:S})})).json()).reply||"Omlouvám se, něco se pokazilo.";e.lastChild.remove(),s(u,"bot")}});async function B(){const n=[...document.querySelectorAll("[data-include]")].map(async o=>{const a=o.getAttribute("data-include");if(a){const t=await(await fetch(a)).text();o.innerHTML=t}});return Promise.all(n)}B().then(()=>{b(()=>import("./header-handler-ZQ7XkgKy.js"),[]).then(o=>{o.default&&o.default()}),k(),E();const i=document.querySelector(".contact-link"),n=document.querySelector("#kontakt");i&&n&&i.addEventListener("click",function(o){o.preventDefault(),n.scrollIntoView({behavior:"smooth"})})});
