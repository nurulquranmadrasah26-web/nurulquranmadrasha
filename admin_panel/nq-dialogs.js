/* নূরুল কোরআন মাদ্রাসা — সাইটের নিজস্ব Alert/Confirm dialog */
(function () {
  'use strict';

  var active = null;

  function ensureDialog() {
    if (active) return active;
    var overlay = document.createElement('div');
    overlay.className = 'nq-dialog-overlay';
    overlay.innerHTML =
      '<div class="nq-dialog" role="dialog" aria-modal="true" aria-labelledby="nqDialogTitle">' +
        '<div class="nq-dialog-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 17H3L12 3z"/><path d="M12 9v4"/><circle cx="12" cy="16.5" r=".7" fill="currentColor" stroke="none"/></svg></div>' +
        '<div class="nq-dialog-copy"><h3 id="nqDialogTitle"></h3><p id="nqDialogMessage"></p></div>' +
        '<div class="nq-dialog-actions"><button type="button" class="nq-dialog-cancel">বাতিল</button><button type="button" class="nq-dialog-ok">ঠিক আছে</button></div>' +
      '</div>';
    var style = document.createElement('style');
    style.id = 'nqDialogStyles';
    style.textContent =
      '.nq-dialog-overlay{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(10,25,18,.48);backdrop-filter:blur(4px);opacity:0;visibility:hidden;transition:opacity .18s ease,visibility .18s ease;}' +
      '.nq-dialog-open{overflow:hidden!important;}' +
      '.nq-dialog-overlay.open{opacity:1;visibility:visible;}' +
      '.nq-dialog{width:min(100%,430px);background:#fff;border:1px solid #e5ebe7;border-radius:4px;box-shadow:0 18px 55px rgba(0,0,0,.22);padding:24px;transform:translateY(12px) scale(.97);transition:transform .22s ease;}' +
      '.nq-dialog-overlay.open .nq-dialog{transform:none;}' +
      '.nq-dialog-copy{margin-left:62px;}.nq-dialog h3{margin:0 0 7px;color:#173b2c;font:700 19px Kalpurush,Hind Siliguri,Noto Sans Bengali,sans-serif;}.nq-dialog p{margin:0;color:#53635b;line-height:1.65;white-space:pre-line;font:400 14px Kalpurush,Hind Siliguri,Noto Sans Bengali,sans-serif;}' +
      '.nq-dialog-mark{float:left;width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#fff4d8;color:#d18a00;}.nq-dialog-mark svg{width:27px;height:27px;}' +
      '.nq-dialog-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:22px;clear:both;}.nq-dialog-actions button{min-width:92px;border:0;border-radius:4px;padding:10px 15px;cursor:pointer;font:600 14px Kalpurush,Hind Siliguri,Noto Sans Bengali,sans-serif;}.nq-dialog-cancel{background:#eef3ef;color:#365444;}.nq-dialog-ok{background:#176b42;color:#fff;}.nq-dialog-ok.danger{background:#c0392b;}.nq-dialog-actions button:focus{outline:3px solid rgba(31,174,100,.25);outline-offset:2px;}' +
      '@media(max-width:520px){.nq-dialog{padding:20px;}.nq-dialog h3{font-size:17px;}.nq-dialog-copy{margin-left:56px;}}';
    document.head.appendChild(style);
    document.body.appendChild(overlay);
    active = overlay;
    return overlay;
  }

  function openDialog(options) {
    options = options || {};
    var overlay = ensureDialog();
    var dialog = overlay.querySelector('.nq-dialog');
    var title = overlay.querySelector('#nqDialogTitle');
    var message = overlay.querySelector('#nqDialogMessage');
    var cancel = overlay.querySelector('.nq-dialog-cancel');
    var ok = overlay.querySelector('.nq-dialog-ok');
    title.textContent = options.title || (options.confirm ? 'অনুমতি নিশ্চিত করুন' : 'বার্তা');
    message.textContent = options.message || '';
    ok.textContent = options.confirmText || 'ঠিক আছে';
    cancel.textContent = options.cancelText || 'বাতিল';
    cancel.style.display = options.confirm ? '' : 'none';
    ok.classList.toggle('danger', options.tone === 'danger');
    overlay.classList.add('open');
    document.body.classList.add('nq-dialog-open');
    setTimeout(function () { (options.confirm ? cancel : ok).focus(); }, 20);

    return new Promise(function (resolve) {
      var done = false;
      function finish(value) {
        if (done) return;
        done = true;
        overlay.classList.remove('open');
        document.body.classList.remove('nq-dialog-open');
        cancel.removeEventListener('click', cancelIt);
        ok.removeEventListener('click', okIt);
        overlay.removeEventListener('click', outsideIt);
        document.removeEventListener('keydown', keyIt);
        resolve(value);
      }
      function cancelIt() { finish(false); }
      function okIt() { finish(true); }
      function outsideIt(e) { if (e.target === overlay && options.confirm) finish(false); }
      function keyIt(e) {
        if (e.key === 'Escape') finish(false);
        if (e.key === 'Enter') finish(true);
      }
      cancel.addEventListener('click', cancelIt);
      ok.addEventListener('click', okIt);
      overlay.addEventListener('click', outsideIt);
      document.addEventListener('keydown', keyIt);
      // ডায়ালগ বন্ধ হওয়ার পর পরের ব্যবহারের জন্য একই DOM রাখা হবে।
      void dialog;
    });
  }

  window.nqConfirm = function (options) {
    if (typeof options === 'string') options = { message: options };
    options = options || {};
    options.confirm = true;
    return openDialog(options);
  };
  window.nqAlert = function (message, title) {
    return openDialog({ message: message, title: title || 'বার্তা', confirm: false });
  };
})();