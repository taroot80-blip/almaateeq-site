/* fx.js: الافتتاحية والليزر ودخول الأبواب وأصوات النوافذ */
(function () {
  'use strict';
  const root = document.documentElement;
  if ((navigator.hardwareConcurrency || 4) <= 2) root.classList.add('fx-lite');
  const L = document.createElement('div'); L.id = 'lasers'; L.setAttribute('aria-hidden', 'true');
  [['#F2B632', -14, 9, 0], ['#5b7bff', 11, 12, 3], ['#ffd98a', -24, 15, 7], ['#7f9bff', 19, 11, 10]].forEach(([c, a, d, w]) => {
    const i = document.createElement('i'); i.style.cssText = `--c:${c};--a:${a}deg;--d:${d}s;--w:${w}s;top:50%`; L.appendChild(i);
  });
  document.body.appendChild(L);

  const SP = document.createElement('div'); SP.id = 'splash'; SP.setAttribute('aria-hidden', 'true');
  SP.innerHTML = '<div class="box"><svg viewBox="0 0 512 512"><g class="r1"><circle cx="256" cy="256" r="236" fill="none" stroke="#c9a25a" stroke-width="10"/><path d="M256 8v52M256 452v52M8 256h52M452 256h52" stroke="#F2B632" stroke-width="12" stroke-linecap="round"/></g><circle class="r2" cx="256" cy="256" r="172" fill="none" stroke="#5b7bff" stroke-width="6" stroke-dasharray="10 16"/><path class="moon" d="M330 120a150 150 0 1 0 0 272a118 118 0 1 1 0-272z" fill="#F2B632"/></svg><b>المسبار</b><span>فيء الأخبار</span></div>';
  document.body.appendChild(SP);
  const close = () => { if (SP.classList.contains('out')) return; SP.classList.add('out'); setTimeout(() => SP.remove(), 460); };
  SP.addEventListener('click', close);
  try { self.SFX && SFX.play('orb'); } catch (e) { /* */ }
  setTimeout(close, 1700);

  // دخول متتابع عند تبديل الباب فقط، لا عند التحديث الدوري
  function enter(id) {
    const s = document.getElementById('v-' + id); if (!s) return;
    setTimeout(() => {
      [...s.querySelectorAll('.tile')].forEach((e, i) => e.style.setProperty('--i', i));
      [...s.querySelectorAll(':scope > .panel, :scope > .banner, :scope > .card, .vbody > *')].forEach((e, i) => e.style.setProperty('--i', i));
      s.classList.remove('enter'); void s.offsetWidth; s.classList.add('enter');
      setTimeout(() => s.classList.remove('enter'), 1500);
    }, 0);
  }
  document.addEventListener('misbar:view', (e) => enter(e.detail));
  const v0 = (location.hash || '#today').slice(1); setTimeout(() => enter(v0 || 'today'), 1200);

  // أصوات النوافذ
  if (self.HTMLDialogElement) {
    const sm = HTMLDialogElement.prototype.showModal;
    HTMLDialogElement.prototype.showModal = function () { try { SFX.play('pop'); } catch (e) { /* */ } return sm.apply(this, arguments); };
  }
})();
