/* =====================================================================
   Tienda configurable: app.js lee todo desde data.js (datos, fotos, textos).
   ===================================================================== */
(function () {
  'use strict';

  var S = window.STORE, P = window.PRODUCTS, CATS = window.CATS;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var fmt = function (n) { return n ? '$' + Math.round(n).toLocaleString('es-AR') : 'Consultar'; };
  var slug = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-'); };
  var bySlug = function (s) { return P.filter(function (p) { return p.slug === s; })[0]; };
  var byId = function (id) { return P.filter(function (p) { return p.id === id; })[0]; };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var safe = function (fn, d) { try { return fn(); } catch (e) { return d; } };
  var ARROW = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 8 8 2M3 2h5v5"/></svg>';

  gsap.registerPlugin(ScrollTrigger);
  history.scrollRestoration = 'manual';

  var app = $('#app'), hdr = $('#hdr');

  /* ------------------------------------------------------------------
     utilidades de UI: toast, overlays
     ------------------------------------------------------------------ */
  var toastT;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('is-on'); }, 2600);
  }
  var openEl = null, lastFocus = null;
  function openOverlay(el, focusSel) {
    if (openEl && openEl !== el) closeOverlay();
    lastFocus = document.activeElement; openEl = el;
    el.classList.add('is-open'); el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    setTimeout(function () { var f = focusSel ? $(focusSel, el) : $('.x', el); if (f) f.focus(); }, 80);
  }
  function closeOverlay() {
    if (!openEl) return;
    openEl.classList.remove('is-open'); openEl.setAttribute('aria-hidden', 'true');
    if (!$('#mmenu').classList.contains('is-open')) document.body.classList.remove('is-locked');
    openEl = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeOverlay(); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeOverlay(); setMenu(false); } });

  /* ------------------------------------------------------------------
     carrito
     ------------------------------------------------------------------ */
  var cart = safe(function () { return JSON.parse(localStorage.getItem(S.key + '-cart') || '[]'); }, []) || [];
  cart = cart.filter(function (l) { return byId(l.id) && l.qty > 0; });
  function saveCart() { safe(function () { localStorage.setItem(S.key + '-cart', JSON.stringify(cart)); }); }
  function cartCount() { return cart.reduce(function (a, l) { return a + l.qty; }, 0); }
  function cartTotal() { return cart.reduce(function (a, l) { return a + l.qty * byId(l.id).price; }, 0); }

  function renderCart() {
    var n = cartCount(), tot = cartTotal();
    $('#cartCount').textContent = n; $('#cartCount').dataset.n = n;
    $('#cartTot').textContent = fmt(tot);
    $('#cartSend').disabled = !n;
    $('#shipTxt').textContent = S.installments && n && tot ? 'Pagalo hasta en ' + S.installments + ' cuotas sin interés de ' + fmt(tot / S.installments) : S.shipText;
    $('#shipFill').style.width = '100%';
    var body = $('#cartBody');
    if (!n) { body.innerHTML = '<p class="cart-empty">Tu carrito está vacío.<br>Elegí algo del catálogo.</p>'; return; }
    body.innerHTML = cart.map(function (l, i) {
      var p = byId(l.id);
      return '<div class="line"><img src="' + (p.thumb || p.img) + '" alt="" width="76" height="94" loading="lazy" decoding="async"><div><b>' + p.name + '</b><small>Talle ' + l.size + ' · ' + fmt(p.price) + '</small>' +
        '<div class="qty"><button data-q="-1" data-i="' + i + '" aria-label="Quitar uno">−</button><b>' + l.qty + '</b><button data-q="1" data-i="' + i + '" aria-label="Sumar uno">+</button></div></div>' +
        '<div><div class="line__p">' + fmt(p.price * l.qty) + '</div><button class="line__rm" data-rm="' + i + '">Quitar</button></div></div>';
    }).join('');
  }
  function addToCart(id, size) {
    var f = cart.filter(function (l) { return l.id === id && l.size === size; })[0];
    if (f) f.qty = Math.min(f.qty + 1, 20); else cart.push({ id: id, size: size, qty: 1 });
    saveCart(); renderCart();
    var c = $('#cartCount'); gsap.fromTo(c, { scale: 1.8 }, { scale: 1, duration: .6, ease: 'back.out(3)' });
  }
  $('#cartBody').addEventListener('click', function (e) {
    var q = e.target.closest('[data-q]'), r = e.target.closest('[data-rm]');
    if (q) { var l = cart[+q.dataset.i]; l.qty += +q.dataset.q; if (l.qty <= 0) cart.splice(+q.dataset.i, 1); }
    else if (r) cart.splice(+r.dataset.rm, 1); else return;
    saveCart(); renderCart();
  });
  $('#cartSend').addEventListener('click', function () {
    if (!cart.length) return;
    var u = safe(function () { return JSON.parse(localStorage.getItem(S.key + '-user') || '{}'); }, {}) || {};
    var lines = cart.map(function (l) { var p = byId(l.id); return '• ' + l.qty + ' x ' + p.name + ' (talle ' + l.size + ') — ' + fmt(p.price * l.qty); });
    var msg = 'Hola ' + S.name + '! Quiero hacer este pedido:\n\n' + lines.join('\n') + '\n\nSubtotal: ' + fmt(cartTotal()) + (u.name ? '\nNombre: ' + u.name : '') + '\n\nGracias!';
    window.open('https://wa.me/' + S.whatsapp + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  });
  $('#btnCart').addEventListener('click', function () { renderCart(); openOverlay($('#cart')); });

  /* ------------------------------------------------------------------
     perfil + busqueda + menu movil
     ------------------------------------------------------------------ */
  function openProfile() {
    var u = safe(function () { return JSON.parse(localStorage.getItem(S.key + '-user') || '{}'); }, {}) || {};
    var f = $('#profForm'); f.name.value = u.name || ''; f.email.value = u.email || ''; f.tel.value = u.tel || '';
    $('#profHello').textContent = u.name ? 'Hola, ' + u.name + '. Podés actualizar tus datos.' : 'Guardá tus datos para completar tus pedidos más rápido.';
    openOverlay($('#profile'), 'input');
  }
  $('#btnProfile').addEventListener('click', openProfile);
  $('#profForm').addEventListener('submit', function (e) {
    e.preventDefault(); var f = e.target;
    safe(function () { localStorage.setItem(S.key + '-user', JSON.stringify({ name: f.name.value.trim(), email: f.email.value.trim(), tel: f.tel.value.trim() })); });
    closeOverlay(); toast('Datos guardados');
  });

  function productCard(p, opts) {
    opts = opts || {};
    return '<a class="card" href="#/producto/' + p.slug + '" data-flip>' +
      '<div class="card__media' + (p.cut ? ' is-cut' : '') + '">' + (p.tag ? '<span class="card__tag">' + p.tag + '</span>' : '') +
      '<img class="a" src="' + (p.thumb || p.img) + '" alt="' + p.name + '" loading="' + (opts.eager ? 'eager' : 'lazy') + '" decoding="async">' +
      (p.hover ? '<img class="b" src="' + p.hover + '" alt="" loading="lazy" decoding="async" aria-hidden="true">' : '') + '</div>' +
      '<div class="card__cap"><b>' + p.name + '</b><span>' + fmt(p.price) + '</span></div></a>';
  }
  function runSearch() {
    var q = $('#searchInput').value.trim().toLowerCase(), box = $('#searchRes');
    var res = !q ? P.slice(0, 8) : P.filter(function (p) { return (p.name + ' ' + p.cat + ' ' + p.desc).toLowerCase().indexOf(q) > -1; });
    box.innerHTML = res.length ? res.map(function (p) { return productCard(p); }).join('') : '<p class="msg">No encontramos resultados para “' + q.replace(/</g, '') + '”.</p>';
    bindFlip(box);
    $$('.card', box).forEach(function (c) { c.addEventListener('click', function () { closeOverlay(); }); });
  }
  function openSearch() { runSearch(); openOverlay($('#search'), '#searchInput'); }
  $('#btnSearch').addEventListener('click', openSearch);
  $('#searchInput').addEventListener('input', runSearch);

  var menuOpen = false;
  function setMenu(open) {
    if (open === menuOpen) return; menuOpen = open;
    $('#mmenu').classList.toggle('is-open', open); $('#mmenu').setAttribute('aria-hidden', !open);
    $('#burger').setAttribute('aria-expanded', open); $('#burger').setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    hdr.classList.toggle('is-menu', open);
    document.body.classList.toggle('is-locked', open);
  }
  $('#burger').addEventListener('click', function () { setMenu(!menuOpen); if (menuOpen) setTimeout(function () { $('#mmClose').focus(); }, 60); else $('#burger').focus(); });
  $('#mmWa').href = 'https://wa.me/' + S.whatsapp + '?text=' + encodeURIComponent('Hola ' + S.name + '!');
  $('#mmClose').addEventListener('click', function () { setMenu(false); $('#burger').focus(); });
  $('#mmenu').addEventListener('click', function (e) { if (e.target.closest('[data-menu-close]')) setMenu(false); });
  $('#mmCat').addEventListener('click', function () { var o = $('#mmCat').getAttribute('aria-expanded') !== 'true'; $('#mmCat').setAttribute('aria-expanded', o); $('#mmSub').classList.toggle('is-open', o); });
  $$('#mmenu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  $('#mmSearch').addEventListener('click', function () { setMenu(false); setTimeout(openSearch, 300); });
  $('#mmProfile').addEventListener('click', function () { setMenu(false); setTimeout(openProfile, 300); });
  matchMedia('(min-width:821px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });

  /* ------------------------------------------------------------------
     efecto de las tarjetas: la prenda gira y aparece el modelo
     ------------------------------------------------------------------ */
  function bindFlip(root) {
    $$('.card__media img', root).forEach(function (im) { gsap.set(im, { xPercent: -50, yPercent: -50, x: 0, y: 0 }); });
    if (!canHover || reduce) return;
    $$('[data-flip]', root).forEach(function (card) {
      var a = $('.a', card), b = $('.b', card), on = false; if (!b) return;
      gsap.set([a, b], { transformPerspective: 900 });
      card.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'touch' || on) return; on = true;
        gsap.killTweensOf([a, b]);
        gsap.timeline()
          .to(a, { rotateY: 90, duration: .24, ease: 'power2.in' })
          .set(a, { opacity: 0 }).set(b, { opacity: 1, rotateY: -90 })
          .to(b, { rotateY: 0, duration: .5, ease: 'power3.out' });
      });
      card.addEventListener('pointerleave', function () {
        if (!on) return; on = false;
        gsap.killTweensOf([a, b]);
        gsap.timeline()
          .to(b, { rotateY: 90, duration: .22, ease: 'power2.in' })
          .set(b, { opacity: 0 }).set(a, { opacity: 1, rotateY: -90 })
          .to(a, { rotateY: 0, duration: .5, ease: 'power3.out' });
      });
    });
  }

  /* ------------------------------------------------------------------
     header: color y logo segun la seccion
     ------------------------------------------------------------------ */
  var hs = { dark: false, logo: false, foot: false };
  function paintHeader() {
    var dark = hs.dark && !hs.foot;
    hdr.classList.toggle('is-dark', dark);
    hdr.classList.toggle('show-logo', hs.logo);
  }

  /* ------------------------------------------------------------------
     footer
     ------------------------------------------------------------------ */
  function footerHTML() {
    var ig = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1" class="dot"/></svg>';
    var wa = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3.2 20.8l1.5-4.6A8.7 8.7 0 1 1 8 19.5z"/><path d="M9.2 8.6c-.3.9 0 2 .9 3.2 1 1.4 2.3 2.4 3.9 2.7.8.1 1.4-.4 1.6-1l-1.6-.9-.8.6c-.8-.4-1.7-1.2-2.1-2l.6-.8-.8-1.6c-.7 0-1.4.3-1.7 1.8z" class="dot"/></svg>';
    return '<footer class="foot ft" id="foot"><div class="ft__in">' +
      '<div class="ft__join"><h2 class="ft__t">Unite a <b>Güemes</b></h2>' +
      '<p class="ft__lead">Registrate y enterate primero de cada pieza nueva.</p>' +
      '<form class="ft__form" id="newsForm"><input type="email" required placeholder="Ingresá tu email…" aria-label="Tu email" autocomplete="email" inputmode="email" enterkeyhint="send"><button type="submit">Enviar</button></form></div>' +
      '<div class="ft__cols">' +
      '<details class="ft__col" open><summary><h3>Menú</h3></summary><div class="ft__body"><ul><li><a href="#/">Inicio</a></li><li><a href="#/catalogo">Catálogo</a></li><li><a href="#/contacto">Contacto</a></li></ul></div></details>' +
      '<details class="ft__col" open><summary><h3>Tienda</h3></summary><div class="ft__body"><ul>' + CATS.map(function (c) { return '<li><a href="#/catalogo/' + slug(c) + '">' + c + '</a></li>'; }).join('') + '</ul></div></details>' +
      '<details class="ft__col" open><summary><h3>Visitanos</h3></summary><div class="ft__body"><ul class="ft__info"><li>' + S.address + '</li><li>' + S.city + '</li><li>' + S.hoursShort + '</li><li><a href="' + S.maps + '" target="_blank" rel="noopener">Cómo llegar</a></li></ul></div></details>' +
      '<details class="ft__col" open><summary><h3>Contactanos</h3></summary><div class="ft__body"><ul><li><a href="https://wa.me/' + S.whatsapp + '" target="_blank" rel="noopener">' + S.phone + '</a></li><li><a href="' + S.instagram + '" target="_blank" rel="noopener">' + S.handle + '</a></li></ul>' +
      '<div class="ft__social"><a href="' + S.instagram + '" target="_blank" rel="noopener" aria-label="Instagram ' + S.handle + '">' + ig + '</a><a href="https://wa.me/' + S.whatsapp + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + wa + '</a></div></div></details>' +
      '</div></div>' +
      '<div class="ft__legal"><span>© 2026 ' + S.name + ' · ' + S.tagline + '</span><span>' + S.shipText + (S.payments ? ' · ' + S.payments : '') + '</span></div></footer>';
  }
  /* frase gigante del footer: se ajusta para ocupar todo el ancho (como en psg.fr) */
  function fitSlogan(root) {
    var s = $('.foot__slogan', root), inner = s && $('.foot__sl', s); if (!inner) return;
    s.style.fontSize = '100px';
    var w = inner.getBoundingClientRect().width;
    if (w) s.style.fontSize = (100 * s.clientWidth / w).toFixed(2) + 'px';
  }
  function bindFooter(root) {
    fitSlogan(root);
    if (view) { var rf = function () { fitSlogan(root); }; addEventListener('resize', rf); onClean(function () { removeEventListener('resize', rf); }); }
    /* columnas del footer: acordeón en celular, siempre abiertas en escritorio */
    var cols = $$('.ft__col', root), wide = matchMedia('(min-width:821px)');
    var openCols = function () { cols.forEach(function (d) { d.open = wide.matches; }); };
    openCols();
    cols.forEach(function (d) { $('summary', d).addEventListener('click', function (e) { if (wide.matches) e.preventDefault(); }); });
    cols.forEach(function (d) { d.addEventListener('toggle', function () { ScrollTrigger.refresh(); }); });   // la altura del footer cambia al abrir/cerrar
    wide.addEventListener('change', openCols);
    if (view) onClean(function () { wide.removeEventListener('change', openCols); });
    var f = $('#newsForm', root);
    if (f) f.addEventListener('submit', function (e) { e.preventDefault(); f.reset(); toast('¡Gracias! Te vamos a avisar de cada novedad.'); });
  }

  /* =====================================================================
     VISTAS
     ===================================================================== */
  var view = null;   // { ctx, cleanups[], enter }
  function onClean(fn) { view.cleanups.push(fn); }

  /* ---------------------------- HOME ---------------------------------- */
  /* panel de categoria (hombre / mujer): foto grande con titulo, descripcion y enlace */
  function duoPanel(cls, href, img, alt, title, tag, desc) {
    var chars = title.split('').map(function (c) { return '<span class="dm"><span>' + c + '</span></span>'; }).join('');
    return '<a class="duo__p ' + cls + '" href="' + href + '"><div class="duo__frame"><img class="duo__img" src="' + img + '" alt="' + alt + '" loading="lazy" decoding="async"></div>' +
      '<div class="duo__shade"></div><div class="duo__txt"><div class="duo__row"><h2 class="duo__t" aria-label="' + title + '">' + chars + '</h2><span class="duo__tag">' + tag + '</span></div>' +
      '<p class="duo__d">' + desc + '</p><span class="duo__go">Ver todo ' + ARROW + '</span></div></a>';
  }

  /* seccion dividida: izquierda fija con la imagen cambiando, derecha carrusel vertical movido por el scroll */
  var SPLIT = S.split;
  function splitHTML() {
    var list = SPLIT.map(bySlug), pad = function (n) { return ('0' + n).slice(-2); };
    var title = function (s) { return '<span class="split__line">' + s.split('').map(function (c) { return '<span class="dm"><span>' + c + '</span></span>'; }).join('') + '</span>'; };
    return '<section class="split" id="split" aria-label="Nueva temporada"><div class="split__stage">' +
      '<div class="split__left"><div class="split__imgs" id="splitImgs">' + list.map(function (p, i) { return '<img src="' + window.SPLIT_BG[i] + '" alt="" loading="lazy" decoding="async">'; }).join('') + '</div>' +
      '<div class="split__shade"></div><div class="split__txt">' +
      '<span class="split__n" id="splitN">01 / ' + pad(list.length) + '</span>' +
      '<h2 class="split__t" aria-label="Nueva temporada">' + title('NUEVA') + title('TEMPORADA') + '</h2>' +
      '<p class="split__cur"><span class="split__mask"><b id="splitName">' + list[0].name + '</b></span><span class="split__mask"><i id="splitPrice">' + fmt(list[0].price) + '</i></span></p>' +
      '<a class="split__btn" href="#/catalogo">Ver el catálogo completo</a></div></div>' +
      '<div class="split__right"><div class="split__view"><div class="split__track" id="splitTrack">' +
      list.map(function (p, i) { return '<a class="split__item" href="#/producto/' + p.slug + '" data-i="' + i + '"><img src="' + (p.thumb || p.img) + '" alt="' + p.name + '" loading="lazy" decoding="async" draggable="false"><span class="split__cap">' + p.name + '<small>' + fmt(p.price) + '</small></span></a>'; }).join('') +
      '</div></div><div class="split__bar" aria-hidden="true"><i id="splitBar"></i></div></div></div></section>';
  }

  /* opiniones de Google Maps y datos del local */
  function reviewsHTML() {
    var stars = '<span class="rev__stars" role="img" aria-label="' + S.rating + ' de 5">★★★★★</span>';
    var qs = S.quotes;
    return '<section class="rev" id="rev" aria-label="Opiniones"><div class="rev__l"><span class="label">Opiniones en Google</span>' +
      '<div class="rev__score"><b>' + S.rating + '</b>' + stars + '<small>' + S.reviews + ' reseñas</small></div>' +
      '<ul class="rev__chips">' + S.chips.map(function (c) { return '<li>' + c + '</li>'; }).join('') + '</ul></div>' +
      '<div class="rev__r">' + qs.map(function (q) { return '<figure class="rev__q"><blockquote>“' + q[0] + '”</blockquote><figcaption>' + q[1] + '</figcaption></figure>'; }).join('') + '</div></section>';
  }
  function visitHTML() {
    return '<section class="visit" id="visit" aria-label="Visitanos"><div class="visit__img"><img src="' + S.visitImg[0] + '" alt="' + S.visitImg[1] + '" loading="lazy" decoding="async"></div>' +
      '<div class="visit__txt"><span class="label">Visitanos</span><h2>' + S.visitTitle + '</h2>' +
      '<p>' + S.address + ', ' + S.city + '. ' + S.visitText + '</p>' +
      '<dl class="visit__hours">' + S.hours.map(function (h) { return '<div><dt>' + h[0] + '</dt><dd>' + h[1] + '</dd></div>'; }).join('') + '</dl>' +
      '<div class="visit__cta"><a class="btn btn--dark" href="' + S.maps + '" target="_blank" rel="noopener">Cómo llegar</a><a class="btn btn--ghost" href="https://wa.me/' + S.whatsapp + '" target="_blank" rel="noopener">Escribinos por WhatsApp</a></div></div></section>';
  }

  /* ------------- "Recién colgado": perchas sobre un riel, cielo de atardecer ------------- */
  var HANGER = '<svg class="hg__hanger" viewBox="0 0 140 66" aria-hidden="true" focusable="false">' +
    '<path d="M70 34V26C70 19 77 17 77 11C77 5 72 2 66 3C61 4 59 9 61 13" fill="none" stroke="#9c9486" stroke-width="3.2" stroke-linecap="round"/>' +
    '<path d="M70 33 8 54C2 56 2 63 9 63H131C138 63 138 56 132 54Z" fill="#a87449"/>' +
    '<path d="M70 35 12 55" fill="none" stroke="rgba(255,255,255,.38)" stroke-width="1.6" stroke-linecap="round"/></svg>';

  function railHTML() {
    var cut = window.CUTOUTS || {};
    var list = P.filter(function (p) { return p.cat !== 'Looks' && cut[p.slug]; });
    while (list.length && list.length < 8) list = list.concat(list);   // el riel necesita largo para el bucle infinito
    var one = function (dup) {
      return list.map(function (p) {
        return '<div class="hg"' + (dup ? ' aria-hidden="true"' : '') + '><div class="hg__sway">' + HANGER +
          '<a class="hg__card" href="#/producto/' + p.slug + '"' + (dup ? ' tabindex="-1"' : '') + ' aria-label="' + p.name + '"><span class="hg__flip">' +
          '<img class="hg__cut" src="' + (p.thumb || cut[p.slug]) + '" alt="' + (dup ? '' : p.name) + '" loading="lazy" decoding="async" draggable="false">' +
          '<span class="hg__shine" style="--cut:url(../' + (p.thumb || cut[p.slug]) + ')"></span></span>' +
          '<span class="hg__tag"><small>' + p.cat + '</small><b>' + p.name + '</b><em>Ver pieza ' + ARROW + '</em></span>' +
          '</a></div></div>';
      }).join('');
    };
    return '<section class="rail" id="rail" aria-label="Recién colgado">' +
      '<div class="rail__sky" aria-hidden="true"><i class="rail__sun"></i><i class="rail__c rail__c--1"></i><i class="rail__c rail__c--2"></i><i class="rail__c rail__c--3"></i><i class="rail__grain"></i></div>' +
      '<div class="rail__stage" id="railStage"><svg class="rail__arc" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 0Q50 40 100 0" class="a1"/><path d="M0 0Q50 40 100 0" class="a2"/><path d="M0 0Q50 40 100 0" class="a3"/></svg><i class="rail__pin rail__pin--l"></i><i class="rail__pin rail__pin--r"></i>' +
      '<div class="rail__view" id="railView"><div class="rail__track" id="railTrack">' + one(false) + one(true) + '</div></div></div>' +
      '<div class="rail__p" id="railP"><p>Lo último que llegó al local, colgado del riel.</p><small>Cada prenda es única</small><a href="#/catalogo">Ver todo el catálogo</a></div>' +
      '<p class="rail__foot"><span class="only-hover">Arrastrá para recorrer. Pasá el mouse por una prenda para darla vuelta.</span><span class="only-touch">Deslizá para recorrer. Tocá una prenda para darla vuelta.</span></p>' +
      '<div class="rail__cur" id="railCur" aria-hidden="true">Arrastrar</div></section>';
  }

  /* carrusel infinito arrastrable; cada percha se mece con la inercia del riel y la prenda gira al pasar el mouse */
  function initRail() {
    var sec = $('#rail'), viewEl = $('#railView'), track = $('#railTrack'); if (!sec || !viewEl) return;
    var hgs = $$('.hg', track), half = 0, x = 0, px = 0, pvx = 0, drag = false, lastX = 0, vel = 0, extra = 0, inView = false, hover = 0, slow = 1, moved = 0;
    var small = matchMedia('(max-width:820px)').matches;   // celular: prendas más chicas, más balanceo y sin escalado (más fluido)
    var sw = hgs.map(function (el, i) { return { el: el.querySelector('.hg__sway'), a: 0, v: 0, k: (small ? 30 + (i * 5) % 16 : 44 + (i * 7) % 24), ph: i * 1.7 }; });
    var calc = function () { half = track.scrollWidth / 2; }; calc();
    var ro = new ResizeObserver(calc); ro.observe(track); onClean(function () { ro.disconnect(); });
    var io = new IntersectionObserver(function (e) { inView = e[0].isIntersecting; }); io.observe(sec); onClean(function () { io.disconnect(); });
    var st = ScrollTrigger.create({ trigger: sec, start: 'top bottom', end: 'bottom top', onUpdate: function (s) { extra = clamp(s.getVelocity() * .2, -700, 700); } });
    var cur = $('#railCur'), arc = $('.rail__arc', sec);

    /* entrada: las perchas caen y se acomodan, el titulo sube desde su mascara */
    if (!reduce) {
      gsap.set(hgs, { y: -110, opacity: 0 });
      gsap.set('#railP', { opacity: 0, y: 24 });
      var tr = ScrollTrigger.create({ trigger: sec, start: 'top 68%', once: true, onEnter: function () {
        gsap.to('#railP', { opacity: 1, y: 0, duration: 1.2, delay: .3, ease: 'expo.out' });
        gsap.to(hgs, { y: 0, opacity: 1, duration: 1.7, ease: 'back.out(1.5)', stagger: { amount: 1 }, delay: .15 });
      } });
      gsap.to('.rail__c--1', { xPercent: 14, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.to('.rail__c--2', { xPercent: -12, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.to('.rail__c--3', { xPercent: 9, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.to('.rail__sun', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
      onClean(function () { tr.kill(); });
    }

    /* fisica: cada percha es un resorte que cuelga del riel; sigue la velocidad con retraso y rebota */
    var last = performance.now();
    var tick = function () {
      var now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now;
      if (!inView || !half || !dt) return;
      extra *= Math.pow(.03, dt);
      slow += ((hover ? .1 : 1) - slow) * (1 - Math.exp(-dt * 5));
      if (!drag) { x -= ((reduce ? 0 : (small ? 44 : 34)) * slow + extra) * dt + vel * dt; vel *= Math.pow(.04, dt); }
      if (x <= -half) x += half; if (x > 0) x -= half;
      track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      var vx = (x - px) / dt; px = x;
      if (Math.abs(vx) > half) vx = pvx; pvx = vx;
      var lean = small ? clamp(vx * .017, -24, 24) : clamp(vx * .011, -16, 16), t = now / 1000;
      var vw = viewEl.clientWidth, cw = hgs[0].offsetWidth, sag = arc ? arc.getBoundingClientRect().height : 0;
      for (var i = 0; i < sw.length; i++) {
        var s = sw[i], tgt = lean + (reduce ? 0 : Math.sin(t * 1.15 + s.ph) * (small ? 3 : 1.1));
        s.v += ((tgt - s.a) * s.k - s.v * (small ? 1.7 : 2.6)) * dt; s.a += s.v * dt;
        /* la prenda que pasa por el centro del riel se agranda, como la pieza destacada */
        var d = Math.abs(hgs[i].offsetLeft + cw / 2 + x - vw / 2) / (vw * .5), sc = small ? 1 : 1 + .16 * Math.max(0, 1 - d * 1.6);
        var u = (hgs[i].offsetLeft + cw / 2 + x - vw / 2) / (vw * .5), oy = sag * Math.max(0, 1 - u * u);   // la percha sigue la curva del riel
        s.el.style.transform = 'translateY(' + oy.toFixed(1) + 'px) rotate(' + s.a.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
      }
    };
    gsap.ticker.add(tick); onClean(function () { gsap.ticker.remove(tick); st.kill(); });

    /* arrastre con el puntero (sin captura, para que el clic en la prenda siga funcionando) */
    var mv = function (e) { var dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx); x += dx; vel = -dx * 40; };
    var up = function () { drag = false; viewEl.classList.remove('is-drag'); if (cur) cur.classList.remove('is-drag'); removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); };
    viewEl.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      drag = true; moved = 0; lastX = e.clientX; vel = 0; viewEl.classList.add('is-drag'); if (cur) cur.classList.add('is-drag');
      addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    });
    onClean(function () { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); });
    viewEl.addEventListener('click', function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);   // arrastrar no abre la prenda

    /* giro de la prenda: mouse = al pasar, tactil = al tocar (el segundo toque abre la ficha) */
    var flip = function (card, on) {
      var t = card.firstElementChild;
      gsap.to(t, { rotationY: 0, rotationX: 0, z: on ? 70 : 0, scale: on ? 1.1 : 1, y: on ? -10 : 0, duration: on ? .8 : 1.1, ease: on ? 'power3.out' : 'elastic.out(1,.6)', overwrite: 'auto' });
      card.style.setProperty('--sx', '0'); card.style.setProperty('--sy', '1');
      card.classList.toggle('is-flip', on);
    };
    /* efecto 3D: la prenda se inclina hacia el cursor, el brillo recorre la silueta y la sombra se desplaza */
    var tilt = function (card, e) {
      var r = card.getBoundingClientRect(), px = clamp((e.clientX - r.left) / r.width, 0, 1) - .5, py = clamp((e.clientY - r.top) / r.height, 0, 1) - .5;
      gsap.to(card.firstElementChild, { rotationY: px * 34, rotationX: -py * 26, duration: .6, ease: 'power3.out', overwrite: 'auto' });
      card.style.setProperty('--mx', ((px + .5) * 100).toFixed(1) + '%'); card.style.setProperty('--my', ((py + .5) * 100).toFixed(1) + '%');
      card.style.setProperty('--sx', (-px * 2).toFixed(2)); card.style.setProperty('--sy', (1 + py).toFixed(2));
    };
    $$('.hg__card', track).forEach(function (card) {
      if (canHover) {
        card.addEventListener('pointermove', function (e) { if (!reduce) tilt(card, e); });
        card.addEventListener('pointerenter', function () { hover++; flip(card, true); if (cur) cur.classList.add('is-card'); });
        card.addEventListener('pointerleave', function () { hover = Math.max(0, hover - 1); flip(card, false); if (cur) cur.classList.remove('is-card'); });
      } else {
        card.addEventListener('click', function (e) { if (!card.classList.contains('is-flip')) { e.preventDefault(); $$('.hg__card.is-flip', track).forEach(function (c) { flip(c, false); }); flip(card, true); } });
      }
      card.addEventListener('focus', function () { flip(card, true); });
      card.addEventListener('blur', function () { flip(card, false); });
    });

    /* cursor propio sobre el riel */
    if (canHover && !reduce && cur) {
      gsap.set(cur, { xPercent: -50, yPercent: -50 });
      var qx = gsap.quickTo(cur, 'x', { duration: .45, ease: 'power3.out' }), qy = gsap.quickTo(cur, 'y', { duration: .45, ease: 'power3.out' });
      viewEl.addEventListener('pointermove', function (e) { qx(e.clientX); qy(e.clientY); });
      viewEl.addEventListener('pointerenter', function (e) { gsap.set(cur, { x: e.clientX, y: e.clientY }); cur.classList.add('is-on'); });
      viewEl.addEventListener('pointerleave', function () { cur.classList.remove('is-on'); });
    }
  }

  function homeHTML() {
    var feat = P.slice();   // se muestran todas las prendas
    var feed = window.FEED.map(function (s, i) { return '<div class="feed__item"><img src="' + s + '" alt="Look ' + S.name + ' ' + (i + 1) + '" loading="lazy" decoding="async" draggable="false"></div>'; }).join('');
    var word = (S.word || S.name).split('').map(function (c) { return '<span class="ch"><span>' + c + '</span></span>'; }).join('');
    var marq = ''; for (var i = 0; i < 4; i++) marq += '<span>' + S.marquee[0] + '</span><span>' + S.marquee[1] + '</span>';
    return '<div class="fly" id="fly"><div class="fly__w" id="flyW"><h1 class="hero__word" id="heroWord" aria-label="' + S.name + '">' + word + '</h1></div></div>' +
      '<div class="stage" id="stage">' +
      '<section class="hero" id="hero" aria-label="Portada">' +
      '<div class="hscene" id="hscene"><div class="hscene__bg" id="hbg"><div class="hphotos">' +
      S.hero.map(function (h, i) {
        return '<span class="hp hp--' + (i + 1) + '"><img ' + (i ? 'data-src' : 'src') + '="' + h[0] + '" alt="' + h[1] + '"' + (i === 0 ? ' fetchpriority="high"' : '') + ' decoding="async" width="1672" height="940"></span>';
      }).join('') + '</div></div>' +
      '<div class="hscene__tint"></div>' +
      (S.heroCut ? '<div class="hscene__cut" id="hcut" aria-hidden="true">' + [].concat(S.heroCut).map(function (c, i) { return '<img ' + (i ? 'data-src' : 'src') + '="' + c + '" alt="" decoding="async" draggable="false" width="1672" height="940">'; }).join('') + '</div>' : '') +
      '</div><div class="hero__tag"><span>' + S.tagline + '</span><span>' + S.city + '</span></div>' +
      '<div class="hero__grain"></div></section>' +
      '<div class="body" id="homeBody">' +
      railHTML() +
      '<section class="shelf" id="shelf"><div class="shelf__head"><span class="label">Colección completa · ' + feat.length + ' prendas</span><a class="link" href="#/catalogo">Ver por categoría ' + ARROW + '</a></div>' +
      '<div class="grid3" id="shelfGrid">' + feat.slice(0, 9).map(function (p, i) { return productCard(p, { eager: i < 3 }); }).join('') + '</div></section>' +
      '<section class="duo" id="duo" aria-label="Comprar por categoría">' +
      S.duo.map(function (d, i) { return duoPanel(i ? 'duo__p--w' : 'duo__p--m', d.href, d.img, d.alt, d.title, d.tag, d.desc); }).join('') +
      '<div class="duo__cur" id="duoCur" aria-hidden="true"><span>Ver</span></div></section>' +
      '<section class="shelf shelf--2" id="shelf2"><div class="grid3" id="shelfGrid2">' + feat.slice(9).map(function (p) { return productCard(p); }).join('') + '</div></section>' +
      splitHTML() +
      '<section class="feed" id="feed"><div class="feed__head"><h2>' + S.handle + '</h2><a class="btn btn--dark" href="' + S.instagram + '" target="_blank" rel="noopener">Seguinos en Instagram</a></div>' +
      '<div class="feed__view" id="feedView"><div class="feed__track" id="feedTrack">' + feed + feed + '</div></div></section>' +
      reviewsHTML() + visitHTML() +
      '<div class="perks" id="perks">' + S.perks.map(function (q) { return '<div><b>' + q[0] + '</b><span>' + q[1] + '</span></div>'; }).join('') + '</div>' +
      '<div class="marq" aria-hidden="true"><div class="marq__t" id="marq">' + marq + '</div></div>' +
      '</div></div>' + footerHTML();
  }

  function initHome() {
    var root = app;
    bindFlip(root); bindFooter(root);
    hs.dark = false; hs.logo = false; hs.foot = false; paintHeader();
    var word = $$('#heroWord .ch span'), bg = $('#hbg'), cut = $('#hcut'), vid = $('#hvid');
    var bgs = [bg, cut].filter(Boolean);   // la foto y el recorte del chico se mueven juntos
    var cards = $$('#shelfGrid .card, #shelfGrid2 .card'), items = $$('.feed__item');

    if (!reduce) {
      gsap.set(word, { yPercent: 108 });
      gsap.set(bgs, { x: 0, scale: 1.12, opacity: 0 });
      gsap.set(cards, { y: 90, opacity: 0 });
      gsap.set('.shelf__head', { opacity: 0, y: 20 });
      gsap.set('.feed__head', { opacity: 0, y: 24 });
      gsap.set(items, { opacity: 0, x: 80 });
      gsap.set('#perks > div', { opacity: 0, y: 30 });
      gsap.set('.rev__l > *, .rev__q', { opacity: 0, y: 34 });
      gsap.set('.visit__txt > *', { opacity: 0, y: 30 });
    }

    /* entrada del hero: la escena se revela, el modelo aparece y sube la fila de productos */
    var enter = function () {
      if (reduce) return;
      if (vid) { safe(function () { vid.currentTime = 0; }); var pr = safe(function () { return vid.play(); }); if (pr && pr.catch) pr.catch(function () {}); }   // el giro arranca desde el principio
      var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.to(bgs, { opacity: 1, scale: 1, duration: 2.4, ease: 'power3.out' }, 0)
        .to(word, { yPercent: 0, duration: 1.5, stagger: .09 }, .3);
    };
    /* el video se pausa cuando el hero sale de pantalla */
    if (vid && 'IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { var p2 = safe(function () { return vid.play(); }); if (p2 && p2.catch) p2.catch(function () {}); } else vid.pause(); }, { threshold: 0 });
      vio.observe($('#hero')); onClean(function () { vio.disconnect(); });
    }

    /* scroll: la palabra de la marca se achica y viaja hasta el logo del navbar (el modelo se desvanece) */
    var fly = $('#fly'), flyW = $('#flyW'), T = { x: 0, y: 0, s: .1 };
    var measure = function () {
      var logo = $('.hdr__logo'); if (!logo) return T;
      var b = logo.getBoundingClientRect(), r = flyW.getBoundingClientRect();
      var sc = gsap.getProperty(flyW, 'scaleX') || 1;
      // centro y ancho "en reposo" (sin la transformacion actual), sin depender de como el navegador exprese translate
      var cx = r.left + r.width / 2 - (gsap.getProperty(flyW, 'x') || 0), cy = r.top + r.height / 2 - (gsap.getProperty(flyW, 'y') || 0), w = r.width / sc;
      T = { x: b.left + b.width / 2 - cx, y: b.top + b.height / 2 - cy, s: b.width / w };
      return T;
    };
    var snap = function (on) { hs.logo = on; paintHeader(); fly.style.visibility = on ? 'hidden' : 'visible'; };
    var mq = matchMedia('(max-width:820px)');
    var centerWord = function () { gsap.set(flyW, { xPercent: -50, yPercent: mq.matches ? -50 : -56, x: 0, y: 0, scale: 1 }); };
    centerWord();
    var onMq = function () { centerWord(); ScrollTrigger.refresh(); };
    if (mq.addEventListener) { mq.addEventListener('change', onMq); onClean(function () { mq.removeEventListener('change', onMq); }); }
    if (!reduce) {
      gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom 70px', scrub: .55, invalidateOnRefresh: true,
          onLeave: function () { snap(true); }, onEnterBack: function () { snap(false); } } })
        .to(flyW, { x: function () { return measure().x; }, y: function () { return T.y; }, scale: function () { return T.s; }, duration: 1, ease: 'power2.inOut' }, 0)
        .to(bgs, { yPercent: 9, duration: 1, ease: 'none' }, 0);
    } else {
      ScrollTrigger.create({ trigger: '#homeBody', start: 'top 80%', onEnter: function () { snap(true); }, onLeaveBack: function () { snap(false); } });
    }
    ScrollTrigger.create({ trigger: '#homeBody', start: 'top 64px', onEnter: function () { hs.dark = true; paintHeader(); }, onLeaveBack: function () { hs.dark = false; paintHeader(); } });
    ScrollTrigger.create({ trigger: $('#foot').previousElementSibling, start: 'bottom 56px', onEnter: function () { hs.foot = true; paintHeader(); }, onLeaveBack: function () { hs.foot = false; paintHeader(); } });

    /* cambio de foto: fundido lento entre poses. La foto y el recorte del chico cambian a la vez,
       así la palabra GÜEMES queda siempre entre el fondo y el chico */
    var hpSpans = $$('#hbg .hp'), cutImgs = $$('#hcut img');
    var late = $$('[data-src]', root), loadLate = function () { late.forEach(function (im) { im.src = im.dataset.src; im.removeAttribute('data-src'); }); };
    if (document.readyState === 'complete') setTimeout(loadLate, 1200); else addEventListener('load', function () { setTimeout(loadLate, 1200); }, { once: true });
    if (!reduce && hpSpans.length > 1 && cutImgs.length === hpSpans.length) {
      var cur = 0, D = 2.8, hold = 5.5, dc = null, dtl = null;
      var step = function () {
        if ($$('#hbg .hp img, #hcut img').some(function (im) { return !im.complete || !im.naturalWidth; })) { dc = gsap.delayedCall(1, step); return; }   // espera a que la 2.ª pose esté descargada
        var k = (cur + 1) % hpSpans.length, n = cur;
        dtl = gsap.timeline({ onComplete: function () { cur = k; dc = gsap.delayedCall(hold, step); } });
        if (k === 0) dtl.to(hpSpans.slice(1), { opacity: 0, duration: D, ease: 'sine.inOut' }, 0);
        else dtl.to(hpSpans[k], { opacity: 1, duration: D, ease: 'sine.inOut' }, 0);
        dtl.to(cutImgs[k], { opacity: 1, duration: D, ease: 'sine.inOut' }, 0)
           .to(cutImgs[n], { opacity: 0, duration: D * .55, ease: 'sine.inOut' }, D * .45);
      };
      dc = gsap.delayedCall(5, step);
      onClean(function () { if (dc) dc.kill(); if (dtl) dtl.kill(); });
    }

    /* al bajar por el hero la foto va tomando color (la variable --tone va de 0 a 1) */
    var scene = $('#hscene');
    if (scene && !matchMedia('(max-width:820px)').matches) {   // en celular no se anima el color (filtros pesados)
      var tone = ScrollTrigger.create({ trigger: '#hero', start: 'top top', end: 'bottom 25%', onUpdate: function (s) { scene.style.setProperty('--tone', clamp(s.progress, 0, 1).toFixed(3)); } });
      onClean(function () { tone.kill(); });
    }

    /* parallax con el mouse */
    if (canHover && !reduce) {
      var qbs = bgs.map(function (el) { return gsap.quickTo(el, 'x', { duration: 1.8, ease: 'power3.out' }); });
      var qb = function (v) { qbs.forEach(function (q) { q(v); }); };
      var qw = gsap.quickTo('#heroWord', 'x', { duration: 1.4, ease: 'power3.out' });
      var mv = function (e) { var nx = e.clientX / innerWidth - .5; qb(nx * -26); qw(nx * -22); };
      addEventListener('pointermove', mv); onClean(function () { removeEventListener('pointermove', mv); });
    }

    /* productos: suben escalonados */
    if (!reduce) {
      ScrollTrigger.create({ trigger: '#shelf', start: 'top 78%', once: true, onEnter: function () { gsap.to('.shelf__head', { opacity: 1, y: 0, duration: .9, ease: 'expo.out' }); } });
      ScrollTrigger.batch(cards, { start: 'top 94%', once: true, batchMax: 3,
        onEnter: function (b) { gsap.to(b, { y: 0, opacity: 1, duration: 1.3, stagger: .12, ease: 'expo.out', overwrite: true }); } });
      ScrollTrigger.create({ trigger: '#feed', start: 'top 80%', once: true, onEnter: function () {
        gsap.to('.feed__head', { opacity: 1, y: 0, duration: 1, ease: 'expo.out' });
        gsap.to(items, { opacity: 1, x: 0, duration: 1.3, stagger: .06, ease: 'expo.out', delay: .1 });
      } });
      ScrollTrigger.create({ trigger: '#rev', start: 'top 80%', once: true, onEnter: function () { gsap.to('.rev__l > *, .rev__q', { opacity: 1, y: 0, duration: 1.1, stagger: .09, ease: 'expo.out' }); } });
      ScrollTrigger.create({ trigger: '#visit', start: 'top 75%', once: true, onEnter: function () {
        gsap.to('.visit__txt > *', { opacity: 1, y: 0, duration: 1.1, stagger: .09, ease: 'expo.out' });
        gsap.fromTo('.visit__img img', { scale: 1.25 }, { scale: 1.05, duration: 2.2, ease: 'expo.out' });
      } });
      ScrollTrigger.create({ trigger: '#perks', start: 'top 88%', once: true, onEnter: function () { gsap.to('#perks > div', { opacity: 1, y: 0, duration: 1, stagger: .12, ease: 'expo.out' }); } });
      gsap.to('#marq', { xPercent: -28, ease: 'none', scrollTrigger: { trigger: '.marq', start: 'top bottom', end: 'bottom top', scrub: true } });
    }

    initFeed();
    initRail();
    initDuo();
    initSplit();
    return enter;
  }

  function initSplit() {
    var sec = $('#split'); if (!sec) return;
    var stage = $('.split__stage', sec), track = $('#splitTrack'), items = $$('.split__item', sec), imgs = $$('#splitImgs img'), n = items.length;
    var nameEl = $('#splitName'), priceEl = $('#splitPrice'), numEl = $('#splitN'), barEl = $('#splitBar');
    var list = SPLIT.map(bySlug), pad = function (v) { return ('0' + v).slice(-2); };
    if (reduce) { sec.classList.add('is-static'); imgs[0] && imgs[0].classList.add('is-on'); return; }

    var chars = $$('.split__t .dm span', sec), btn = $('.split__btn', sec), meta = $$('.split__n, .split__cur', sec);
    gsap.set(chars, { yPercent: 118 }); gsap.set([btn].concat(meta), { opacity: 0, y: 22 }); gsap.set(items, { opacity: 0 });
    ScrollTrigger.create({ trigger: sec, start: 'top 70%', once: true, onEnter: function () {
      gsap.to(chars, { yPercent: 0, duration: 1.3, stagger: .045, ease: 'expo.out' });
      gsap.to([btn].concat(meta), { opacity: 1, y: 0, duration: 1, stagger: .08, ease: 'expo.out', delay: .5 });
      gsap.to(items, { opacity: 1, duration: 1.2, stagger: .06, ease: 'power2.out', delay: .2 });
    } });

    /* cambio de imagen en el panel fijo: barrido vertical segun la direccion del scroll */
    var active = -1, cur = null;
    var show = function (idx, dir) {
      if (idx === active) return; var prev = active; active = idx;
      var im = imgs[idx], old = prev > -1 ? imgs[prev] : null;
      gsap.killTweensOf(imgs); imgs.forEach(function (x) { if (x !== im && x !== old) { x.classList.remove('is-on'); gsap.set(x, { clearProps: 'clipPath,scale,zIndex' }); } });
      if (old) gsap.set(old, { zIndex: 1 });
      gsap.set(im, { zIndex: 2, opacity: 1 }); im.classList.add('is-on');
      gsap.fromTo(im, { clipPath: dir >= 0 ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)', scale: 1.18 },
        { clipPath: 'inset(0% 0% 0% 0%)', scale: 1.02, duration: 1.15, ease: 'expo.inOut', onComplete: function () { if (old) { old.classList.remove('is-on'); gsap.set(old, { clearProps: 'clipPath,scale,zIndex' }); } } });
      var p = list[idx];
      [nameEl, priceEl].forEach(function (el, k) { gsap.fromTo(el, { yPercent: dir >= 0 ? 110 : -110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .8, ease: 'expo.out', delay: k * .05, onStart: function () { el.textContent = k ? fmt(p.price) : p.name; } }); });
      numEl.textContent = pad(idx + 1) + ' / ' + pad(n);
    };
    show(0, 1);

    /* carrusel de la derecha: sigue el scroll con suavizado y enfoca el producto del centro */
    var target = 0, pos = 0, last = performance.now(), lastIdx = 0, itemH = 1, viewH = 1, inView = false, blurred = [];
    var measure = function () { viewH = stage.clientHeight; itemH = items[0].offsetHeight; };
    measure();
    var ro = new ResizeObserver(measure); ro.observe(stage); onClean(function () { ro.disconnect(); });
    var st = ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', onUpdate: function (s) { target = s.progress; }, onToggle: function (s) { inView = s.isActive; } });
    var io = new IntersectionObserver(function (e) { inView = e[0].isIntersecting; }, { threshold: 0 }); io.observe(sec); onClean(function () { io.disconnect(); });
    var tick = function () {
      var now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now;
      if (!inView) return;
      pos += (target - pos) * (1 - Math.exp(-dt * 6.5));
      var f = pos * (n - 1);
      track.style.transform = 'translate3d(0,' + (viewH / 2 - itemH / 2 - f * itemH).toFixed(1) + 'px,0)';
      for (var i = 0; i < n; i++) {
        var d = i - f, rawAd = Math.abs(d); if (rawAd > 2.4) continue;   // lo que esta lejos no se recalcula
        var ad = Math.min(1, rawAd), im = items[i].firstElementChild;
        var s = 1 - ad * .26, o = 1 - ad * .62, x = Math.sin(i * 1.7) * 7 * ad, rot = d * 2.2;
        im.style.transform = 'translate3d(' + x.toFixed(1) + '%,0,0) rotate(' + rot.toFixed(2) + 'deg) scale(' + s.toFixed(3) + ')';
        im.style.opacity = o.toFixed(2);
        var far = ad > .7 ? 1 : 0; if (far !== blurred[i]) { blurred[i] = far; im.classList.toggle('is-far', !!far); }   // desenfoque por niveles (no cada cuadro)
        items[i].lastElementChild.style.opacity = (1 - ad * 1.1).toFixed(2);
      }
      barEl.style.transform = 'scaleY(' + clamp(pos, 0, 1).toFixed(3) + ')';
      var idx = clamp(Math.round(f), 0, n - 1);
      if (idx !== lastIdx) { show(idx, idx > lastIdx ? 1 : -1); lastIdx = idx; }
    };
    gsap.ticker.add(tick); onClean(function () { gsap.ticker.remove(tick); st.kill(); });
  }

  /* paneles Hombre / Mujer: se revelan con un barrido, el texto sube letra por letra, parallax opuesto y cursor "Ver" */
  function initDuo() {
    var sec = $('#duo'); if (!sec) return;
    var panels = $$('.duo__p', sec), frames = $$('.duo__frame', sec), imgs = $$('.duo__img', sec);
    var chars = $$('.dm span', sec), rest = $$('.duo__tag, .duo__d, .duo__go', sec);
    if (!reduce) {
      gsap.set(panels, { clipPath: 'inset(100% 0% 0% 0%)' });
      gsap.set(imgs, { scale: 1.38 });
      gsap.set(chars, { yPercent: 118 });
      gsap.set(rest, { opacity: 0, y: 26 });
      ScrollTrigger.create({ trigger: sec, start: 'top 74%', once: true, onEnter: function () {
        var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        tl.to(panels, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.7, stagger: .2 }, 0)
          .to(imgs, { scale: 1.06, duration: 2.4, stagger: .2 }, 0)
          .to(chars, { yPercent: 0, duration: 1.25, stagger: .05 }, .6)
          .to(rest, { opacity: 1, y: 0, duration: 1, stagger: .07 }, 1.1);
      } });
      frames.forEach(function (f, i) {
        gsap.fromTo(f, { yPercent: i ? 8 : -8 }, { yPercent: i ? -8 : 8, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: .6 } });
      });
    }
    var cur = $('#duoCur');
    if (canHover && !reduce && cur) {
      var qx = gsap.quickTo(cur, 'x', { duration: .55, ease: 'power3.out' }), qy = gsap.quickTo(cur, 'y', { duration: .55, ease: 'power3.out' });
      panels.forEach(function (p) {
        p.addEventListener('pointermove', function (e) { var r = sec.getBoundingClientRect(); qx(e.clientX - r.left); qy(e.clientY - r.top); });
        p.addEventListener('pointerenter', function () { cur.classList.add('is-on'); sec.classList.add('is-hov'); p.classList.add('is-hov'); });
        p.addEventListener('pointerleave', function () { cur.classList.remove('is-on'); sec.classList.remove('is-hov'); p.classList.remove('is-hov'); });
      });
    }
  }

  /* carrusel del feed: automatico, arrastrable y empujado por el scroll */
  function initFeed() {
    var viewEl = $('#feedView'), track = $('#feedTrack'); if (!viewEl) return;
    var x = 0, half = 0, drag = false, lastX = 0, vel = 0, extra = 0, inView = true, auto = reduce ? 0 : 38;
    var calc = function () { half = track.scrollWidth / 2; }; calc();
    var ro = new ResizeObserver(calc); ro.observe(track); onClean(function () { ro.disconnect(); });
    var io = new IntersectionObserver(function (e) { inView = e[0].isIntersecting; }); io.observe(viewEl); onClean(function () { io.disconnect(); });
    var st = ScrollTrigger.create({ trigger: '#feed', start: 'top bottom', end: 'bottom top', onUpdate: function (s) { extra = clamp(s.getVelocity() * .22, -900, 900); } });
    var last = performance.now();
    var tick = function () {
      var now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now;
      if (!inView) return;
      extra *= Math.pow(.02, dt);
      if (!drag) { x -= (auto + extra) * dt + vel * dt; vel *= Math.pow(.04, dt); }
      if (half) { if (x <= -half) x += half; if (x > 0) x -= half; }
      track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
    };
    gsap.ticker.add(tick); onClean(function () { gsap.ticker.remove(tick); st.kill(); });
    viewEl.addEventListener('pointerdown', function (e) { drag = true; lastX = e.clientX; vel = 0; viewEl.classList.add('is-drag'); viewEl.setPointerCapture(e.pointerId); });
    viewEl.addEventListener('pointermove', function (e) { if (!drag) return; var dx = e.clientX - lastX; lastX = e.clientX; x += dx; vel = -dx * 40; });
    var up = function () { if (!drag) return; drag = false; viewEl.classList.remove('is-drag'); };
    viewEl.addEventListener('pointerup', up); viewEl.addEventListener('pointercancel', up);
  }

  /* --------------------------- CATALOGO -------------------------------- */
  var SORTS = (S.noPrices ? [['new', 'Novedades'], ['az', 'Nombre: A a Z'], ['za', 'Nombre: Z a A']] : [['new', 'Novedades'], ['asc', 'Precio: menor a mayor'], ['desc', 'Precio: mayor a menor'], ['az', 'Nombre: A a Z']]);
  var SLIDERS = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>';
  function catalogHTML(catSlug) {
    var chips = '<button class="chip' + (!catSlug ? ' is-on' : '') + '" data-cat="">Todo</button>' + CATS.map(function (c) { return '<button class="chip' + (slug(c) === catSlug ? ' is-on' : '') + '" data-cat="' + slug(c) + '">' + c + '</button>'; }).join('');
    return '<section class="page" id="cat"><div class="cat__h"><h1 aria-label="Catálogo"><span>Catálogo</span></h1><span class="cat__n" id="catN"></span></div>' +
      '<div class="tools"><div class="chips" role="group" aria-label="Categorías">' + chips + '</div>' +
      '<label class="sort">Ordenar <select id="sort">' + SORTS.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="ctools"><button class="fbtn" id="fOpen" type="button" aria-haspopup="dialog" aria-controls="fSheet">' + SLIDERS + '<span>Filtrar y ordenar</span><b id="fCount" hidden></b></button><div class="fact" id="fActive" aria-live="polite"></div></div>' +
      '<div class="grid4" id="catGrid"></div></section>' + footerHTML();
  }
  function initCatalog(catSlug) {
    var cur = catSlug || '', sort = 'new', pend = { cat: cur, sort: sort };
    var grid = $('#catGrid');
    var catName = function (sl) { return (CATS.filter(function (c) { return slug(c) === sl; })[0]) || ''; };
    var sortName = function (v) { return (SORTS.filter(function (o) { return o[0] === v; })[0] || ['', ''])[1]; };
    var listFor = function (c, so) {
      var list = P.filter(function (p) { return !c || slug(p.cat) === c; });
      if (so === 'asc') list.sort(function (a, b) { return a.price - b.price; });
      if (so === 'desc') list.sort(function (a, b) { return b.price - a.price; });
      if (so === 'az') list.sort(function (a, b) { return a.name.localeCompare(b.name, 'es'); });
      if (so === 'za') list.sort(function (a, b) { return b.name.localeCompare(a.name, 'es'); });
      return list;
    };
    /* estado visible: chips de escritorio, selector, botón móvil y filtros activos */
    function syncUI() {
      $$('.chip', $('#cat')).forEach(function (x) { x.classList.toggle('is-on', x.dataset.cat === cur); });
      $('#sort').value = sort;
      var n = (cur ? 1 : 0) + (sort !== 'new' ? 1 : 0), fc = $('#fCount');
      fc.hidden = !n; fc.textContent = n;
      var act = $('#fActive'); act.innerHTML = '';
      if (cur) act.insertAdjacentHTML('beforeend', '<button type="button" class="pill" data-rm="cat" aria-label="Quitar filtro ' + catName(cur) + '">' + catName(cur) + '<i aria-hidden="true">×</i></button>');
      if (sort !== 'new') act.insertAdjacentHTML('beforeend', '<button type="button" class="pill" data-rm="sort" aria-label="Quitar orden ' + sortName(sort) + '">' + sortName(sort) + '<i aria-hidden="true">×</i></button>');
    }
    function paint(animate) {
      var list = listFor(cur, sort);
      grid.innerHTML = list.length ? list.map(function (p, i) { return productCard(p, { eager: i < 6 }); }).join('') : '<p class="empty">No hay prendas en esta categoría por ahora.</p>';
      $('#catN').textContent = list.length + (list.length === 1 ? ' prenda' : ' prendas');
      bindFlip(grid); syncUI();
      history.replaceState(null, '', '#/catalogo' + (cur ? '/' + cur : ''));
      if (animate && !reduce) gsap.from($$('.card', grid), { y: 40, opacity: 0, duration: .8, stagger: .04, ease: 'expo.out', clearProps: 'transform,opacity' });
      ScrollTrigger.refresh();
    }
    $$('.chip', $('#cat')).forEach(function (c) { c.addEventListener('click', function () { cur = c.dataset.cat; paint(true); }); });
    $('#sort').addEventListener('change', function (e) { sort = e.target.value; paint(true); });
    $('#fActive').addEventListener('click', function (e) { var b = e.target.closest('[data-rm]'); if (!b) return; if (b.dataset.rm === 'cat') cur = ''; else sort = 'new'; paint(true); });

    /* panel inferior (bottom sheet) para móvil */
    var sheet = document.createElement('div');
    sheet.className = 'sheet'; sheet.id = 'fSheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', 'Filtrar y ordenar'); sheet.setAttribute('aria-hidden', 'true');
    sheet.innerHTML = '<div class="sheet__bg" data-close></div><div class="sheet__panel"><div class="sheet__grab" aria-hidden="true"></div>' +
      '<header class="sheet__h"><h2>Filtrar y ordenar</h2><button class="x" data-close aria-label="Cerrar"><i></i><i></i></button></header><div class="sheet__b">' +
      '<fieldset><legend>Categoría</legend><div class="sheet__chips"><button type="button" class="chip" data-c="">Todo</button>' + CATS.map(function (c) { return '<button type="button" class="chip" data-c="' + slug(c) + '">' + c + '</button>'; }).join('') + '</div></fieldset>' +
      '<fieldset><legend>Ordenar por</legend><div class="sheet__opts">' + SORTS.map(function (o) { return '<label class="opt"><input type="radio" name="ord" value="' + o[0] + '"><span>' + o[1] + '</span></label>'; }).join('') + '</div></fieldset></div>' +
      '<footer class="sheet__f"><button type="button" class="btn btn--ghost" id="fClear">Limpiar</button><button type="button" class="btn btn--dark" id="fApply">Ver prendas</button></footer></div>';
    document.body.appendChild(sheet);
    var syncSheet = function () {
      $$('[data-c]', sheet).forEach(function (b) { b.classList.toggle('is-on', b.dataset.c === pend.cat); });
      $$('input[name=ord]', sheet).forEach(function (r) { r.checked = r.value === pend.sort; });
      var n = listFor(pend.cat, pend.sort).length; $('#fApply').textContent = 'Ver ' + n + (n === 1 ? ' prenda' : ' prendas');
    };
    $('#fOpen').addEventListener('click', function () { pend = { cat: cur, sort: sort }; syncSheet(); openOverlay(sheet, '.chip.is-on'); });
    sheet.addEventListener('click', function (e) { var b = e.target.closest('[data-c]'); if (b) { pend.cat = b.dataset.c; syncSheet(); } });
    sheet.addEventListener('change', function (e) { if (e.target.name === 'ord') { pend.sort = e.target.value; syncSheet(); } });
    $('#fClear', sheet).addEventListener('click', function () { pend = { cat: '', sort: 'new' }; syncSheet(); });
    $('#fApply', sheet).addEventListener('click', function () { cur = pend.cat; sort = pend.sort; closeOverlay(); paint(true); });
    onClean(function () { if (openEl === sheet) closeOverlay(); sheet.remove(); });

    paint(false); bindFooter(app);
    hs.dark = true; hs.logo = true; hs.foot = false; paintHeader();
    ScrollTrigger.create({ trigger: $('#foot').previousElementSibling, start: 'bottom 56px', onEnter: function () { hs.foot = true; paintHeader(); }, onLeaveBack: function () { hs.foot = false; paintHeader(); } });
    var h = $('.cat__h h1 span');
    if (!reduce) { gsap.set(h, { yPercent: 110 }); gsap.set('.tools,.ctools,.cat__n', { opacity: 0, y: 20 }); gsap.set($$('.card', grid), { y: 70, opacity: 0 }); }
    return function () {
      if (reduce) return;
      gsap.to(h, { yPercent: 0, duration: 1.3, ease: 'expo.out' });
      gsap.to('.tools,.ctools,.cat__n', { opacity: 1, y: 0, duration: 1, stagger: .1, ease: 'expo.out', delay: .3 });
      gsap.to($$('.card', grid), { y: 0, opacity: 1, duration: 1.2, stagger: .06, ease: 'expo.out', delay: .4 });
    };
  }

  /* ---------------------------- PRODUCTO ------------------------------- */
  var selSize = null;
  function productHTML(p) {
    var n = p.gallery.length, rel = P.filter(function (x) { return x.id !== p.id && x.cat === p.cat; }).concat(P.filter(function (x) { return x.id !== p.id && x.cat !== p.cat; })).slice(0, 4);
    var cuota = fmt(p.price / S.installments);
    return '<section class="pd" id="pd" style="height:calc(var(--h) * ' + (1 + (n - 1) * .9) + ')">' +
      '<div class="pd__stage" id="pdStage"><div class="pd__bg" aria-hidden="true"><i class="o1"></i><i class="o2"></i><i class="o3"></i><i class="pd__glass"></i><i class="pd__floor"></i></div><div class="pd__imgs" id="pdImgs">' + p.gallery.map(function (s, i) { return '<img src="' + s + '" alt="' + p.name + ' · vista ' + (i + 1) + '" decoding="async"' + (i === 0 ? ' fetchpriority="high"' : '') + '>'; }).join('') + '</div>' +
      '<div class="pd__l"><a class="pd__back" href="#/catalogo"><svg viewBox="0 0 8 8"><path d="M5.5 1 2.5 4l3 3"/></svg> Volver</a>' +
      '<h1 class="pd__t">' + p.name + '</h1><p class="pd__d">' + p.desc + '</p><ul class="pd__spec">' + p.specs.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul></div>' +
      '<div class="pd__r"><div class="pd__price">' + fmt(p.price) + '</div><p class="pd__fee">' + (S.installments ? S.installments + ' cuotas sin interés de ' + cuota : (S.feeText || 'Consultá los medios de pago')) + (p.cash ? '<br>' + fmt(p.cash) + ' en efectivo o transferencia' : '') + '</p>' +
      '<div class="pd__sz"><div class="pd__lab">Talle <span>' + p.cat + '</span></div><div class="sizes" id="pdSizes" role="radiogroup" aria-label="Talle">' +
      p.sizes.map(function (s) { return '<button class="size" role="radio" aria-checked="false" data-s="' + s + '">' + s + '</button>'; }).join('') + '</div></div>' +
      '<button class="btn btn--dark btn--full" id="pdAdd">' + (S.noPrices ? 'Consultar por WhatsApp' : 'Añadir al carrito') + '</button>' +
      '<div class="pd__note"><span>' + S.shipText + '</span><span>Retiro en el local · ' + S.address + '</span></div></div>' +
      '<div class="pd__idx"><span id="pdN">01 / ' + String(n).padStart(2, '0') + '</span><i></i></div></div></section>' +
      '<section class="pd__info"><p>' + p.desc + '</p><ul>' + p.specs.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul><ul class="pd__ship"><li>' + S.shipText + '</li><li>Retiro en el local · ' + S.address + ', ' + S.city + '</li><li>' + (S.payments || 'Consultá los medios de pago') + '</li></ul></section>' +
      '<section class="related" id="related"><div class="shelf__head"><h2>También te puede gustar</h2><a class="link" href="#/catalogo">Ver todo ' + ARROW + '</a></div><div class="grid4" id="relGrid">' + rel.map(function (x) { return productCard(x); }).join('') + '</div></section>' + footerHTML();
  }
  function initProduct(p) {
    selSize = p.sizes.length === 1 ? p.sizes[0] : null;
    var imgs = $$('#pdImgs img'), n = imgs.length, stage = $('#pdStage');
    bindFlip($('#relGrid')); bindFooter(app);
    hs.dark = true; hs.logo = true; hs.foot = false; paintHeader();
    ScrollTrigger.create({ trigger: $('#foot').previousElementSibling, start: 'bottom 56px', onEnter: function () { hs.foot = true; paintHeader(); }, onLeaveBack: function () { hs.foot = false; paintHeader(); } });

    /* talles */
    var paintSizes = function () { $$('.size').forEach(function (b) { b.setAttribute('aria-checked', b.dataset.s === selSize); }); };
    var pickSize = function (s) { selSize = s; paintSizes(); };
    $$('#pdSizes .size').forEach(function (b) { b.addEventListener('click', function () { pickSize(b.dataset.s); }); });
    paintSizes();
    var add = function () {
      if (S.noPrices) {
        window.open('https://wa.me/' + S.whatsapp + '?text=' + encodeURIComponent('Hola ' + S.name + '! Me interesa esta pieza: ' + p.name), '_blank', 'noopener');
        return;
      }
      if (!selSize) {
        $$('#pdSizes .size').forEach(function (b) { b.classList.remove('is-err'); void b.offsetWidth; b.classList.add('is-err'); });
        toast('Elegí un talle'); return;
      }
      addToCart(p.id, selSize); renderCart(); openOverlay($('#cart')); toast('Añadido al carrito');
    };
    $('#pdAdd').addEventListener('click', add);

    /* barra inferior */
    $('#miniImg').src = p.thumb || p.img; $('#miniName').textContent = p.name; $('#miniPrice').textContent = fmt(p.price);
    $('#miniSizes').innerHTML = p.sizes.length > 1 ? p.sizes.map(function (s) { return '<button class="size" role="radio" aria-checked="false" data-s="' + s + '">' + s + '</button>'; }).join('') : '';
    $$('#miniSizes .size').forEach(function (b) { b.addEventListener('click', function () { pickSize(b.dataset.s); }); });
    paintSizes();
    $('#miniAdd').onclick = add;
    ScrollTrigger.create({ trigger: '#related', start: 'top 85%', onEnter: function () { $('#mini').classList.add('is-on'); $('#mini').setAttribute('aria-hidden', 'false'); }, onLeaveBack: function () { $('#mini').classList.remove('is-on'); $('#mini').setAttribute('aria-hidden', 'true'); } });
    ScrollTrigger.create({ trigger: '#foot', start: 'top 85%', onEnter: function () { $('#mini').classList.remove('is-on'); }, onLeaveBack: function () { $('#mini').classList.add('is-on'); } });
    onClean(function () { $('#mini').classList.remove('is-on'); $('#mini').setAttribute('aria-hidden', 'true'); });

    /* galeria: las imagenes pasan una por una con el scroll */
    var place = function (t) {
      var H = stage.clientHeight;
      imgs.forEach(function (im, i) {
        var d = i - t, ad = Math.abs(d);
        gsap.set(im, { x: 0, xPercent: -50, yPercent: -50, y: d * H * .82, scale: 1 - Math.min(ad, 1) * .1, opacity: clamp(1 - Math.max(0, ad - .18) * 1.25, 0, 1) });
      });
    };
    place(0);
    var counter = $('#pdN'), idx = $('.pd__idx i');
    ScrollTrigger.create({ trigger: '#pd', start: 'top top', end: 'bottom bottom', scrub: .45,
      onUpdate: function (s) {
        var t = clamp(s.progress, 0, 1) * (n - 1); place(t);
        counter.textContent = String(Math.min(n, Math.round(t) + 1)).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
        idx.style.setProperty('--p', n > 1 ? t / (n - 1) : 1);
      } });
    var onR = function () { place(clamp(ScrollTrigger.getAll().filter(function (s) { return s.trigger === $('#pd'); })[0].progress, 0, 1) * (n - 1)); };
    addEventListener('resize', onR); onClean(function () { removeEventListener('resize', onR); });

    /* efecto 3D con el mouse: la prenda se inclina y los paneles de vidrio, las esferas y la placa se desplazan a distinta profundidad */
    if (canHover && !reduce) {
      var onPd = function (e) {
        var r = stage.getBoundingClientRect(), nx = clamp((e.clientX - r.left) / r.width, 0, 1) - .5, ny = clamp((e.clientY - r.top) / r.height, 0, 1) - .5;
        stage.style.setProperty('--nx', nx.toFixed(3)); stage.style.setProperty('--ny', ny.toFixed(3));
        gsap.to(imgs, { rotationY: nx * 18, rotationX: -ny * 12, transformPerspective: 1100, duration: .9, ease: 'power3.out', overwrite: 'auto' });
      };
      var offPd = function () {
        stage.style.setProperty('--nx', 0); stage.style.setProperty('--ny', 0);
        gsap.to(imgs, { rotationY: 0, rotationX: 0, duration: 1.4, ease: 'elastic.out(1,.7)', overwrite: 'auto' });
      };
      stage.addEventListener('pointermove', onPd); stage.addEventListener('pointerleave', offPd);
      onClean(function () { stage.removeEventListener('pointermove', onPd); stage.removeEventListener('pointerleave', offPd); });
    }

    if (!reduce) {
      gsap.set('.pd__l > *', { opacity: 0, y: 24 }); gsap.set('.pd__r > *', { opacity: 0, y: 24 }); gsap.set('.pd__idx', { opacity: 0 });
      gsap.set(imgs[0], { y: stage.clientHeight * .5, opacity: 0 });
      gsap.set($$('#relGrid .card'), { y: 70, opacity: 0 });
      ScrollTrigger.create({ trigger: '#related', start: 'top 80%', once: true, onEnter: function () { gsap.to($$('#relGrid .card'), { y: 0, opacity: 1, duration: 1.2, stagger: .1, ease: 'expo.out' }); } });
    }
    return function () {
      if (reduce) return;
      gsap.to(imgs[0], { y: 0, opacity: 1, duration: 1.5, ease: 'expo.out' });
      gsap.to('.pd__l > *', { opacity: 1, y: 0, duration: 1.1, stagger: .09, ease: 'expo.out', delay: .25 });
      gsap.to('.pd__r > *', { opacity: 1, y: 0, duration: 1.1, stagger: .09, ease: 'expo.out', delay: .35 });
      gsap.to('.pd__idx', { opacity: 1, duration: 1, delay: .8 });
    };
  }

  /* ---------------------------- CONTACTO ------------------------------- */
  function contactHTML() {
    return '<section class="page" id="contact"><div class="contact"><div><h1 aria-label="Hablemos."><span class="ln"><span>Hablemos</span></span><span class="ln"><span>de ropa.</span></span></h1>' +
      '<div class="contact__side" style="margin-top:clamp(24px,5vh,50px)"><p>Escribinos por talles, envíos o para coordinar una compra. También podés pasar por el local, en ' + S.barrio + '.</p>' +
      '<div class="info"><div><span>WhatsApp</span><a href="https://wa.me/' + S.whatsapp + '" target="_blank" rel="noopener">' + S.phone + '</a></div>' +
      '<div><span>Instagram</span><a href="' + S.instagram + '" target="_blank" rel="noopener">' + S.handle + '</a></div>' +
      '<div><span>Local</span><a href="' + S.maps + '" target="_blank" rel="noopener">' + S.address + '<br>' + S.city + '</a></div>' +
      '<div><span>Horarios</span>' + S.hours.map(function (h) { return h[0] + ' · ' + h[1]; }).join('<br>') + '</div>' +
      '<div><span>Envíos</span>' + S.shipText + '</div><div><span>Pagos</span>' + S.payments + '</div></div></div></div>' +
      '<form class="form" id="contactForm" novalidate><label><span>Nombre</span><input name="name" required autocomplete="name" autocapitalize="words" enterkeyhint="next" placeholder="Tu nombre" aria-describedby="errName"><small class="err" id="errName" role="alert" hidden></small></label>' +
      '<label><span>Motivo</span><select name="why"><option>Consulta de talles</option><option>Consulta de un producto</option><option>Envíos</option><option>Otra consulta</option></select></label>' +
      '<label><span>Mensaje</span><textarea name="msg" required rows="4" autocapitalize="sentences" enterkeyhint="send" placeholder="Contanos en qué te ayudamos" aria-describedby="errMsg"></textarea><small class="err" id="errMsg" role="alert" hidden></small></label>' +
      '<button class="btn btn--dark btn--full" type="submit">Enviar por WhatsApp</button><p class="fine">Se abre WhatsApp con tu mensaje listo para enviar.</p></form></div></section>' + footerHTML();
  }
  function initContact() {
    bindFooter(app);
    hs.dark = true; hs.logo = true; hs.foot = false; paintHeader();
    ScrollTrigger.create({ trigger: $('#foot').previousElementSibling, start: 'bottom 56px', onEnter: function () { hs.foot = true; paintHeader(); }, onLeaveBack: function () { hs.foot = false; paintHeader(); } });
    var fail = function (el, msg) { var er = $('#' + el.getAttribute('aria-describedby')); er.textContent = msg; er.hidden = false; el.setAttribute('aria-invalid', 'true'); };
    $$('#contactForm input, #contactForm textarea').forEach(function (el) { el.addEventListener('input', function () { el.removeAttribute('aria-invalid'); $('#' + el.getAttribute('aria-describedby')).hidden = true; }); });
    $('#contactForm').addEventListener('submit', function (e) {
      e.preventDefault(); var f = e.target, bad = null;
      if (!f.name.value.trim()) { fail(f.name, 'Escribí tu nombre para que podamos responderte.'); bad = bad || f.name; }
      if (f.msg.value.trim().length < 5) { fail(f.msg, 'Contanos un poco más sobre tu consulta.'); bad = bad || f.msg; }
      if (bad) { bad.focus(); return; }
      var m = 'Hola ' + S.name + '! Soy ' + f.name.value + '.\nMotivo: ' + f.why.value + '\n\n' + f.msg.value;
      window.open('https://wa.me/' + S.whatsapp + '?text=' + encodeURIComponent(m), '_blank', 'noopener'); f.reset(); toast('Abriendo WhatsApp…');
    });
    var lines = $$('.contact h1 .ln span');
    if (!reduce) { gsap.set(lines, { yPercent: 110 }); gsap.set('.contact__side > *,.form > *', { opacity: 0, y: 28 }); }
    return function () {
      if (reduce) return;
      gsap.to(lines, { yPercent: 0, duration: 1.4, stagger: .12, ease: 'expo.out' });
      gsap.to('.contact__side > *', { opacity: 1, y: 0, duration: 1.1, stagger: .12, ease: 'expo.out', delay: .4 });
      gsap.to('.form > *', { opacity: 1, y: 0, duration: 1, stagger: .08, ease: 'expo.out', delay: .5 });
    };
  }

  /* =====================================================================
     RUTAS Y TRANSICIONES
     ===================================================================== */
  function parse() {
    var parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    var a = parts[0] || '';
    if (a === 'catalogo') return { name: 'catalog', cat: parts[1] || '' };
    if (a === 'producto' && bySlug(parts[1])) return { name: 'product', p: bySlug(parts[1]) };
    if (a === 'contacto') return { name: 'contact' };
    return { name: 'home' };
  }
  var routeKey = function (r) { return r.name + (r.p ? r.p.slug : '') + (r.cat || ''); };

  function unmount() {
    if (!view) return;
    view.cleanups.forEach(function (f) { safe(f); });
    ScrollTrigger.getAll().forEach(function (s) { s.kill(); });
    view = null;
  }
  function mount(r) {
    document.body.setAttribute('data-view', r.name);
    $$('[data-nav]').forEach(function (a) { a.classList.toggle('is-on', a.dataset.nav === r.name); });
    var html = r.name === 'home' ? homeHTML() : r.name === 'catalog' ? catalogHTML(r.cat) : r.name === 'product' ? productHTML(r.p) : contactHTML();
    app.innerHTML = html; window.scrollTo(0, 0);
    view = { cleanups: [], enter: null };
    var meta = r.name === 'product' ? r.p.name + ' · ' + S.name : r.name === 'catalog' ? 'Catálogo · ' + S.name : r.name === 'contact' ? 'Contacto · ' + S.name : S.name + ' · ' + S.tagline + ' · Córdoba';
    document.title = meta;
    view.enter = r.name === 'home' ? initHome() : r.name === 'catalog' ? initCatalog(r.cat) : r.name === 'product' ? initProduct(r.p) : initContact();
    ScrollTrigger.refresh();
  }

  var current = null, busy = false, pending = null;
  function navigate() {
    var r = parse();
    if (current && routeKey(r) === routeKey(current)) { if (!reduce) window.scrollTo({ top: 0, behavior: 'smooth' }); else window.scrollTo(0, 0); return; }
    if (busy) { pending = r; return; }
    busy = true;
    var finish = function () { current = r; busy = false; if (pending) { pending = null; navigate(); } };
    if (reduce) { unmount(); mount(r); finish(); return; }
    var wipe = $('#wipe');
    gsap.set(wipe, { x: 0, y: 0, yPercent: 101 });
    gsap.timeline({ defaults: { ease: 'power4.inOut' } })
      .fromTo(wipe, { yPercent: 101 }, { yPercent: 0, duration: .6 })
      .add(function () { unmount(); mount(r); closeOverlay(); setMenu(false); })
      .to(wipe, { yPercent: -101, duration: .7, delay: .08 })
      .add(function () { if (view && view.enter) view.enter(); finish(); }, '-=.35');
  }
  addEventListener('hashchange', navigate);

  /* ------------------------------------------------------------------
     arranque con pantalla de carga
     ------------------------------------------------------------------ */
  function boot() {
    var r = parse();
    renderCart();
    document.body.classList.remove('is-loading');
    mount(r); current = r;
    if (view && view.enter) view.enter();
  }
  /* tipografias del sistema: no hay nada que esperar */
  boot();
  addEventListener('load', function () { setTimeout(function () { ScrollTrigger.refresh(); }, 300); });
})();
