// Lightweight embed for static pages: toggles an iframe to /chat/embed
(function(){
  // Wait for DOM to be ready
  function init() {
    try {
      // Check if already initialized
      if (document.getElementById('chat-embed-root')) {
        console.log('[chat-embed] Already initialized');
        return;
      }
      
      // Ensure body exists
      if (!document.body) {
        setTimeout(init, 50);
        return;
      }
      
      const root = document.createElement('div');
      root.id = 'chat-embed-root';
      root.style.position = 'fixed';
      root.style.right = '24px';
      root.style.bottom = '24px';
      root.style.zIndex = '9999';
      document.body.appendChild(root);

    const fab = document.createElement('button');
    fab.setAttribute('aria-label', 'Otevřít chat');
    fab.textContent = '💬';
    fab.style.width = '48px';
    fab.style.height = '48px';
    fab.style.borderRadius = '24px';
    fab.style.border = 'none';
    fab.style.background = '#34D399';
    fab.style.color = '#fff';
    fab.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    root.appendChild(fab);

    const frame = document.createElement('iframe');
    frame.src = '/chat/embed';
    frame.title = 'CleanStay Chat';
    frame.style.position = 'absolute';
    frame.style.right = '0';
    frame.style.bottom = '56px';
    frame.style.width = '360px';
    frame.style.height = '480px';
    frame.style.border = '1px solid #E5E7EB';
    frame.style.borderRadius = '12px';
    frame.style.boxShadow = '0 10px 24px rgba(0,0,0,0.25)';
    frame.style.display = 'none';
    frame.setAttribute('aria-hidden', 'true');
    root.appendChild(frame);

    fab.addEventListener('click', function(){
      const open = frame.style.display !== 'none';
      frame.style.display = open ? 'none' : 'block';
      frame.setAttribute('aria-hidden', open ? 'true' : 'false');
    });
    
    console.log('[chat-embed] Initialized successfully');
  } catch (e) {
    console.warn('[chat-embed] Init failed:', e);
  }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already loaded
    init();
  }
})();


