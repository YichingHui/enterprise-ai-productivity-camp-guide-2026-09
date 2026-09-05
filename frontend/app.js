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

  // Keep brochure viewing on this page. Original JPEG links remain usable when
  // JavaScript or <dialog> is unavailable; no new blank WebP tab is required.
  const imageDialog = document.getElementById('image-dialog');
  const fullImage = document.getElementById('guide-full-image');
  const imageFrame = document.getElementById('image-frame');
  const imageStatus = document.getElementById('image-status');
  const imageOriginal = document.getElementById('image-original');
  const imageZoom = imageDialog.querySelector('[data-image-zoom]');
  const imageRetry = imageDialog.querySelector('[data-image-retry]');
  let imageOpener;
  let imageTimeout;

  function resetZoom() {
    imageFrame.classList.remove('is-zoomed');
    imageZoom.setAttribute('aria-pressed', 'false');
    imageZoom.textContent = '放大细节 ＋';
    imageFrame.scrollTo(0, 0);
  }
  function imageLoaded() {
    if (!fullImage.complete || !fullImage.naturalWidth) return;
    window.clearTimeout(imageTimeout);
    imageFrame.hidden = false;
    imageStatus.hidden = true;
    imageRetry.hidden = true;
    imageZoom.disabled = false;
  }
  function imageFailed() {
    window.clearTimeout(imageTimeout);
    imageStatus.hidden = false;
    imageStatus.textContent = '图片暂未加载，请重试；也可以点击上方“打开 JPG 原图”。';
    imageRetry.hidden = false;
    imageFrame.hidden = true;
    imageZoom.disabled = true;
  }
  function loadImage() {
    window.clearTimeout(imageTimeout);
    resetZoom();
    imageFrame.hidden = true;
    imageStatus.hidden = false;
    imageStatus.textContent = '正在加载高清图片…';
    imageRetry.hidden = true;
    imageZoom.disabled = true;
    // Remove the old source before assigning, including retries of a failed URL.
    fullImage.removeAttribute('src');
    fullImage.loading = 'eager';
    fullImage.src = imageOpener.href;
    imageTimeout = window.setTimeout(imageFailed, 15000);
    imageLoaded();
  }
  fullImage.addEventListener('load', imageLoaded);
  fullImage.addEventListener('error', imageFailed);
  document.querySelectorAll('[data-image-open]').forEach(link => {
    link.addEventListener('click', event => {
      if (typeof imageDialog.showModal !== 'function') return;
      event.preventDefault();
      imageOpener = link;
      document.getElementById('image-title').textContent = link.dataset.imageTitle;
      fullImage.alt = link.dataset.imageTitle;
      imageOriginal.href = link.href;
      imageDialog.showModal();
      document.body.classList.add('modal-open');
      imageDialog.querySelector('[data-image-close]').focus({ preventScroll: true });
      loadImage();
    });
  });
  imageZoom.addEventListener('click', () => {
    const zoomed = imageFrame.classList.toggle('is-zoomed');
    imageZoom.setAttribute('aria-pressed', String(zoomed));
    imageZoom.textContent = zoomed ? '适应屏幕 −' : '放大细节 ＋';
    imageFrame.scrollTo(0, 0);
  });
  imageRetry.addEventListener('click', loadImage);
  imageDialog.querySelector('[data-image-close]').addEventListener('click', () => imageDialog.close());
  imageDialog.addEventListener('click', event => {
    if (event.target !== imageDialog) return;
    const bounds = imageDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) imageDialog.close();
  });
  imageDialog.addEventListener('close', () => {
    window.clearTimeout(imageTimeout);
    document.body.classList.remove('modal-open');
    resetZoom();
    imageOpener?.focus({ preventScroll: true });
  });
})();
