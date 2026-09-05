'use strict';

// Navigation remains ordinary HTML links: no tracking, intermediate redirects,
// form submission detection, or changes to the formal Feishu questionnaire.
(() => {
  const toast = document.getElementById('toast');
  let toastTimer;
  function announce(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 3000);
  }

  function legacyCopy(value) {
    const input = document.createElement('textarea');
    input.value = value;
    input.readOnly = true;
    input.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
    document.body.append(input);
    const previousFocus = document.activeElement;
    input.select();
    input.setSelectionRange(0, value.length);
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { /* Manual fallback below. */ }
    input.remove();
    previousFocus?.focus({ preventScroll: true });
    return copied;
  }

  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const value = button.dataset.copy;
      let copied = false;
      if (navigator.clipboard && window.isSecureContext) {
        try { await navigator.clipboard.writeText(value); copied = true; } catch { /* WeChat may deny clipboard permission. */ }
      }
      if (!copied) copied = legacyCopy(value);
      if (copied) announce(`${button.dataset.copyLabel}已复制`);
      else window.prompt('浏览器未允许自动复制，请长按或选中下方内容手动复制：', value);
    });
  });

  const dialog = document.getElementById('qr-dialog');
  let opener;
  document.querySelectorAll('[data-qr-open]').forEach(link => {
    link.addEventListener('click', event => {
      // Older browsers retain the direct original-image link.
      if (typeof dialog.showModal !== 'function') return;
      event.preventDefault();
      opener = link;
      dialog.showModal();
      document.body.classList.add('modal-open');
      dialog.querySelector('[data-qr-close]').focus({ preventScroll: true });
    });
  });
  dialog.querySelector('[data-qr-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    opener?.focus({ preventScroll: true });
  });
})();
