// Bouton de sortie rapide (redirection immédiate ou touche Échap)
function quickExit() {
  window.location.replace('https://www.meteofrance.com');
}

document.getElementById('exitBtn').addEventListener('click', quickExit);
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { quickExit(); }
});

// --- Chat maison : tout passe par notre backend Django, ---
// --- jamais d'appel direct à Voiceflow depuis le navigateur. ---
(function () {
  const panel = document.getElementById('chatPanel');
  const messagesEl = document.getElementById('chatMessages');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const openBtn = document.getElementById('openChat');
  const closeBtn = document.getElementById('closeChat');
  let started = false;

  function addMessage(text, from) {
    const div = document.createElement('div');
    div.className = 'chat-msg chat-msg-' + from;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addChoices(choices) {
    const wrap = document.createElement('div');
    wrap.className = 'chat-choices';
    choices.forEach(function (label) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      btn.addEventListener('click', function () { sendMessage(label); });
      wrap.appendChild(btn);
    });
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function renderResponse(data) {
    (data.messages || []).forEach(function (msg) {
      if (msg.type === 'text') { addMessage(msg.text, 'bot'); }
      else if (msg.type === 'choices') { addChoices(msg.choices); }
    });
  }

  async function post(url, body) {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': window.CSRF_TOKEN
      },
      body: JSON.stringify(body || {})
    });
    return resp.json();
  }

  async function startChat() {
    started = true;
    try {
      const data = await post('/api/chat/start/', {});
      renderResponse(data);
    } catch (e) {
      addMessage("Désolé, le chat est momentanément indisponible.", 'bot');
    }
  }

  async function sendMessage(text) {
    addMessage(text, 'user');
    try {
      const data = await post('/api/chat/message/', { message: text });
      renderResponse(data);
    } catch (e) {
      addMessage("Désolé, une erreur est survenue. Réessaie dans un instant.", 'bot');
    }
  }

  function openChat() {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    if (!started) { startChat(); }
    input.focus();
  }

  function closeChat() {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }

  openBtn.addEventListener('click', openChat);
  closeBtn.addEventListener('click', closeChat);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    sendMessage(text);
  });
})();

// Animation du ciel étoilé
(function () {
  var svgNS = "http://www.w3.org/2000/svg";
  var container = document.querySelector('.hero');
  if (container) {
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'stars');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    for (var i = 0; i < 40; i++) {
      var c = document.createElementNS(svgNS, 'circle');
      c.setAttribute('cx', Math.random() * 100);
      c.setAttribute('cy', Math.random() * 70);
      c.setAttribute('r', (Math.random() * 0.5 + 0.15).toFixed(2));
      c.setAttribute('fill', '#fff');
      c.setAttribute('opacity', (Math.random() * 0.5 + 0.15).toFixed(2));
      svg.appendChild(c);
    }
    container.prepend(svg);
  }
})();
