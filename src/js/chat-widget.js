// === chat-widget.js ===
import '../css/chat-widget.css';

const API_PROXY = "https://cleanstay-chat-api2.vercel.app/api/chat";

//  sessionId do localStorage (vydrží mezi návštěvami)
const getSessionId = () => {
  let id = localStorage.getItem("chatSessionId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("chatSessionId", id);
  }
  return id;
};
const sessionId = getSessionId();

const styleLink = document.createElement("link");
styleLink.rel = "stylesheet";
styleLink.href = "/src/css/chat-widget.css";
document.head.appendChild(styleLink);

const widgetHTML = `
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
`;

document.addEventListener("DOMContentLoaded", () => {
  document.body.insertAdjacentHTML("beforeend", widgetHTML);

  const toggleBtn = document.getElementById("chat-toggle");
  const chatWindow = document.getElementById("chat-window");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatMessages = document.getElementById("chat-messages");
  const chatHint = document.getElementById("chat-hint");
  const chatClose = document.getElementById("chat-close");

  const addMessage = (text, sender) => {
    const msg = document.createElement("div");
    msg.className = `chat-msg ${sender}`;
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

 toggleBtn.onclick = () => {
  chatWindow.classList.toggle("open");
  const isNowOpen = chatWindow.classList.contains("open");
  chatHint.style.display = isNowOpen ? "none" : "inline";
};

 chatClose?.addEventListener("click", () => {
  chatWindow.classList.remove("open");
  chatHint.style.display = "inline";
});

  chatForm.onsubmit = async (e) => {
    e.preventDefault();
    const userInput = chatInput.value.trim();
    if (!userInput) return;

    addMessage(userInput, "user");
    chatInput.value = "";
    addMessage("...přemýšlím...", "bot");

    const response = await fetch(API_PROXY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userInput, sessionId: sessionId, })
    });

    const data = await response.json();
    const reply = data.reply || "Omlouvám se, něco se pokazilo.";

    chatMessages.lastChild.remove();
    addMessage(reply, "bot");
  };
});

