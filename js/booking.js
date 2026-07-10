/* ═══════════════════════════════════════════════════════════════════
   SWINGERSPHERE — BOOKING LIFESTYLE ENGINE v1.0
   Reservas de hoteles, eventos, entradas y viajes lifestyle
   Sistema de comisiones por proveedor · Pagos via Transak/Crypto
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

// ── BOOKING CATEGORIES ───────────────────────────────────────────
var BOOKING_CATEGORIES = [
  {id:'hotels',  icon:'🏨', name:'Hoteles & Resorts',  commission:10, desc:'Alojamiento lifestyle-friendly'},
  {id:'events',  icon:'🎉', name:'Eventos & Fiestas',  commission:8,  desc:'Fiestas privadas y tematicas'},
  {id:'tickets', icon:'🎟️', name:'Entradas',            commission:5,  desc:'Clubs y experiencias'},
  {id:'travel',  icon:'✈️', name:'Viajes & Paquetes',   commission:7,  desc:'Escapadas lifestyle completas'},
];

// ── SAMPLE LISTINGS ──────────────────────────────────────────────
var BOOKING_LISTINGS = [
  // ─ Hotels ─
  {id:'htl-001', category:'hotels', name:'Desire Pearl Cancun',     location:'Cancun, Mexico',    price:350,  priceUnit:'noche',   rating:4.8, reviews:412,  certified:true,  image:'🏖️', description:'Resort adults-only todo incluido en la Riviera Maya. Ambiente lifestyle premium con playa privada, restaurantes gourmet y fiestas tematicas nocturnas.', dates:['2026-07-12','2026-07-19','2026-07-26','2026-08-02','2026-08-09','2026-08-16'], capacity:2},
  {id:'htl-002', category:'hotels', name:'Hedonism II Jamaica',     location:'Negril, Jamaica',   price:280,  priceUnit:'noche',   rating:4.6, reviews:287,  certified:true,  image:'🌴', description:'El resort lifestyle mas iconico del Caribe. Todo incluido con playa nudista, actividades acuaticas y noches de fiesta legendarias.', dates:['2026-07-05','2026-07-12','2026-07-19','2026-08-02','2026-08-09','2026-08-23'], capacity:2},
  {id:'htl-003', category:'hotels', name:'Cap d\'Agde Resort',      location:'Cap d\'Agde, Francia', price:180, priceUnit:'noche',  rating:4.3, reviews:198,  certified:true,  image:'🏰', description:'Complejo vacacional en la famosa villa naturista del sur de Francia. Apartamentos frente al mar con acceso directo a la playa lifestyle.', dates:['2026-06-28','2026-07-05','2026-07-12','2026-07-19','2026-08-02','2026-08-16'], capacity:4},
  {id:'htl-004', category:'hotels', name:'Temptation Cancun',       location:'Cancun, Mexico',    price:220,  priceUnit:'noche',   rating:4.5, reviews:356,  certified:true,  image:'🌊', description:'Resort topless-optional frente al mar Caribe. Pool parties diarias, espectaculos nocturnos y gastronomia internacional. Ambiente sensual y divertido.', dates:['2026-07-10','2026-07-17','2026-07-24','2026-08-07','2026-08-14','2026-08-21'], capacity:2},

  // ─ Events ─
  {id:'evt-001', category:'events', name:'Fiesta VIP Madrid Sabado',   location:'Madrid, Espana',     price:30,  priceUnit:'pareja',  rating:4.7, reviews:89,  certified:true,  image:'🥂', description:'Fiesta privada en mansion con piscina, DJ en vivo, barra libre premium y zona chill-out. Dress code elegante. Solo parejas y singles seleccionados.', dates:['2026-06-21','2026-06-28','2026-07-05','2026-07-12','2026-07-19','2026-07-26'], capacity:60},
  {id:'evt-002', category:'events', name:'Pool Party Ibiza',            location:'Ibiza, Espana',      price:45,  priceUnit:'persona', rating:4.9, reviews:134, certified:true,  image:'🏊', description:'La pool party lifestyle mas exclusiva de Ibiza. Villa privada con infinity pool, musica house, cocktails artesanales y sunset magico.', dates:['2026-07-04','2026-07-11','2026-07-18','2026-07-25','2026-08-01','2026-08-08'], capacity:80},
  {id:'evt-003', category:'events', name:'Cena Lifestyle Barcelona',    location:'Barcelona, Espana',  price:60,  priceUnit:'pareja',  rating:4.6, reviews:67,  certified:false, image:'🍷', description:'Cena gourmet de 5 platos con maridaje de vinos en restaurante privado. Ambiente intimo y sofisticado para conocer parejas afines.', dates:['2026-06-27','2026-07-04','2026-07-11','2026-07-18','2026-07-25','2026-08-01'], capacity:24},
  {id:'evt-004', category:'events', name:'Noche Tematica Valencia',     location:'Valencia, Espana',   price:25,  priceUnit:'persona', rating:4.4, reviews:52,  certified:false, image:'🎭', description:'Noche tematica mensual en local privado del centro. Cada edicion con tematica diferente: mascaras, neon, white party y mas.', dates:['2026-07-03','2026-07-17','2026-08-07','2026-08-21','2026-09-04','2026-09-18'], capacity:50},

  // ─ Tickets ─
  {id:'tkt-001', category:'tickets', name:'Entrada Privee Madrid',    location:'Madrid, Espana',    price:25,  priceUnit:'pareja',  rating:4.5, reviews:203, certified:true,  image:'🔑', description:'Acceso al club lifestyle mas exclusivo de Madrid. Instalaciones premium con multiples ambientes, terraza y barra libre incluida.', dates:['2026-06-20','2026-06-21','2026-06-27','2026-06-28','2026-07-04','2026-07-05'], capacity:100},
  {id:'tkt-002', category:'tickets', name:'Kit Kat Berlin',           location:'Berlin, Alemania',  price:20,  priceUnit:'persona', rating:4.8, reviews:478, certified:true,  image:'🖤', description:'El club alternativo mas famoso de Europa. Multiples salas, piscina interior y la mejor musica techno de Berlin. Dress code creativo obligatorio.', dates:['2026-06-20','2026-06-21','2026-06-27','2026-06-28','2026-07-04','2026-07-05'], capacity:200},
  {id:'tkt-003', category:'tickets', name:'Les Chandelles Paris',     location:'Paris, Francia',    price:80,  priceUnit:'pareja',  rating:4.7, reviews:156, certified:true,  image:'🕯️', description:'Club privado legendario en el corazon de Paris. Ambiente elegante en un hotel particular del siglo XVIII. Cena opcional con champagne.', dates:['2026-06-20','2026-06-21','2026-06-27','2026-06-28','2026-07-04','2026-07-05'], capacity:80},
  {id:'tkt-004', category:'tickets', name:'Oasis Barcelona',          location:'Barcelona, Espana', price:35,  priceUnit:'pareja',  rating:4.4, reviews:118, certified:false, image:'🌺', description:'Club lifestyle con piscina interior climatizada, jacuzzi y zona relax. Ambiente acogedor y seguro. Noches tematicas cada fin de semana.', dates:['2026-06-21','2026-06-28','2026-07-05','2026-07-12','2026-07-19','2026-07-26'], capacity:70},
  {id:'tkt-005', category:'tickets', name:'Entrada Limb Club Madrid',  location:'Madrid, Espana',    price:30,  priceUnit:'pareja',  rating:4.6, reviews:92,  certified:true,  image:'🏛️', description:'Acceso oficial a la famosa discoteca y club swinger de 600m². Varias plantas y playrooms privados premium.', dates:['2026-07-10','2026-07-11','2026-07-17','2026-07-18','2026-07-24','2026-07-25'], capacity:150},
  {id:'tkt-006', category:'tickets', name:'Entrada Sharon Club Madrid', location:'Madrid, Espana',    price:40,  priceUnit:'pareja',  rating:4.7, reviews:64,  certified:true,  image:'👠', description:'Acceso exclusivo al Sharon Club para parejas. Código de vestimenta estricto, ambiente selecto y playrooms elegantes.', dates:['2026-07-10','2026-07-11','2026-07-17','2026-07-18','2026-07-24','2026-07-25'], capacity:80},

  // ─ Travel ─
  {id:'trv-001', category:'travel', name:'Cap d\'Agde 5 dias',          location:'Cap d\'Agde, Francia', price:890,  priceUnit:'pp',     rating:4.5, reviews:76,  certified:true,  image:'🗼', description:'Escapada completa al pueblo naturista mas famoso de Europa. Incluye vuelo, apartamento frente al mar, seguro y guia lifestyle.', dates:['2026-07-07','2026-07-14','2026-07-21','2026-08-04','2026-08-11','2026-08-18'], capacity:2},
  {id:'trv-002', category:'travel', name:'Crucero Mediterranean',       location:'Mediterraneo',         price:1200, priceUnit:'pp',     rating:4.9, reviews:45,  certified:true,  image:'🚢', description:'Crucero lifestyle de 7 noches por el Mediterraneo. Puertos en Barcelona, Marsella, Roma y Mykonos. Fiestas a bordo, cenas de gala y excursiones privadas.', dates:['2026-08-01','2026-08-15','2026-09-05','2026-09-19','2026-10-03','2026-10-17'], capacity:2},
  {id:'trv-003', category:'travel', name:'Ibiza Weekend',               location:'Ibiza, Espana',        price:450,  priceUnit:'pp',     rating:4.6, reviews:93,  certified:true,  image:'🎧', description:'Fin de semana completo en Ibiza con hotel boutique, pool party VIP, entrada a clubs lifestyle y transfers privados. Viernes a domingo.', dates:['2026-07-04','2026-07-11','2026-07-18','2026-07-25','2026-08-01','2026-08-08'], capacity:2},
  {id:'trv-004', category:'travel', name:'Desire Riviera 7 noches',     location:'Riviera Maya, Mexico', price:2100, priceUnit:'pareja', rating:4.8, reviews:128, certified:true,  image:'🌅', description:'Paquete todo incluido en Desire Riviera Maya. Vuelo directo, transfer VIP, 7 noches en suite de lujo, spa y actividades lifestyle exclusivas.', dates:['2026-07-12','2026-07-26','2026-08-09','2026-08-23','2026-09-06','2026-09-20'], capacity:2},
];

// ── STATE ────────────────────────────────────────────────────────
var _bkActiveCategory = null;
var _bkSelectedDate = null;
var _bkPeopleCount = 2;

// ── HELPERS ──────────────────────────────────────────────────────
function _bkGetListing(id) {
  for (var i = 0; i < BOOKING_LISTINGS.length; i++) {
    if (BOOKING_LISTINGS[i].id === id) return BOOKING_LISTINGS[i];
  }
  return null;
}

function _bkGetCategory(catId) {
  for (var i = 0; i < BOOKING_CATEGORIES.length; i++) {
    if (BOOKING_CATEGORIES[i].id === catId) return BOOKING_CATEGORIES[i];
  }
  return null;
}

function _bkFormatPrice(price, unit) {
  return price + ' EUR/' + unit;
}

function _bkRenderStars(rating) {
  var full = Math.floor(rating);
  var half = (rating - full) >= 0.5;
  var stars = '';
  for (var i = 0; i < full; i++) stars += '★';
  if (half) stars += '½';
  return stars;
}

function _bkGenCode() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var code = '';
  for (var i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function _bkGetBookings() {
  try {
    return JSON.parse(localStorage.getItem('ss_bookings') || '[]');
  } catch(e) { return []; }
}

function _bkSaveBooking(booking) {
  try {
    var bookings = _bkGetBookings();
    bookings.unshift(booking);
    localStorage.setItem('ss_bookings', JSON.stringify(bookings.slice(0, 100)));
  } catch(e) {}
}

function _bkFormatDate(dateStr) {
  var parts = dateStr.split('-');
  var months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return parseInt(parts[2], 10) + ' ' + months[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
}

function _bkBuildQR() {
  // Visual QR placeholder grid
  var grid = document.createElement('div');
  grid.style.cssText = 'width:80px;height:80px;display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);gap:1px;margin:0 auto;';
  for (var i = 0; i < 64; i++) {
    var cell = document.createElement('div');
    var isCorner = (i < 3 || (i > 4 && i < 8) || i === 8 || i === 15 || i === 16 || i === 23 ||
      i === 40 || i === 47 || i === 48 || i === 55 || (i > 55 && i < 59) || (i > 60 && i < 64));
    cell.style.cssText = 'border-radius:1px;background:' + (isCorner || Math.random() > 0.5 ? '#c4813a' : 'rgba(255,255,255,0.08)') + ';';
    grid.appendChild(cell);
  }
  return grid;
}


// ══════════════════════════════════════════════════════════════════
//  1. BOOKING SCREEN
// ══════════════════════════════════════════════════════════════════
window.renderBookingScreen = function(container) {
  if (!container) return;
  container.innerHTML = '';

  var wrapper = document.createElement('div');
  wrapper.style.cssText = 'padding:0.75rem;';

  // ── Search bar ─────────────────────────────────────────────────
  var searchWrap = document.createElement('div');
  searchWrap.style.cssText = 'position:relative;margin-bottom:1rem;';

  var searchIcon = document.createElement('span');
  searchIcon.textContent = '🔍';
  searchIcon.style.cssText = 'position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);font-size:0.9rem;';
  searchWrap.appendChild(searchIcon);

  var searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Buscar hoteles, eventos, entradas...';
  searchInput.style.cssText = 'width:100%;box-sizing:border-box;background:var(--bg-elevated);border:1px solid var(--border);border-radius:14px;padding:0.7rem 0.75rem 0.7rem 2.4rem;font-size:0.82rem;color:var(--fg-primary);';
  searchInput.oninput = function() {
    var q = searchInput.value.trim();
    if (q.length >= 2) {
      _bkRenderFilteredListings(gridWrap, window.searchBookings(q));
    } else {
      _bkRenderFilteredListings(gridWrap, _bkGetFilteredListings());
    }
  };
  searchWrap.appendChild(searchInput);
  wrapper.appendChild(searchWrap);

  // ── Category filter row ────────────────────────────────────────
  var catRow = document.createElement('div');
  catRow.style.cssText = 'display:flex;gap:0.5rem;overflow-x:auto;margin-bottom:1.25rem;padding-bottom:0.25rem;-webkit-overflow-scrolling:touch;';

  var allBtn = document.createElement('button');
  allBtn.style.cssText = _bkCatBtnStyle(true);
  allBtn.innerHTML = '<span style="font-size:1rem;">📋</span><span style="font-size:0.68rem;">Todos</span>';
  allBtn.onclick = function() {
    _bkActiveCategory = null;
    _bkUpdateCatButtons(catRow);
    _bkRenderFilteredListings(gridWrap, _bkGetFilteredListings());
    _bkRenderFeatured(featuredWrap);
  };
  catRow.appendChild(allBtn);

  for (var ci = 0; ci < BOOKING_CATEGORIES.length; ci++) {
    (function(cat) {
      var btn = document.createElement('button');
      btn.style.cssText = _bkCatBtnStyle(false);
      btn.dataset.catId = cat.id;
      btn.innerHTML = '<span style="font-size:1rem;">' + cat.icon + '</span><span style="font-size:0.68rem;">' + cat.name.split(' ')[0] + '</span>';
      btn.onclick = function() {
        _bkActiveCategory = cat.id;
        _bkUpdateCatButtons(catRow);
        _bkRenderFilteredListings(gridWrap, _bkGetFilteredListings());
        _bkRenderFeatured(featuredWrap);
      };
      catRow.appendChild(btn);
    })(BOOKING_CATEGORIES[ci]);
  }
  wrapper.appendChild(catRow);

  // ── Featured listings ──────────────────────────────────────────
  var featuredTitle = document.createElement('div');
  featuredTitle.style.cssText = 'font-size:0.88rem;font-weight:700;color:var(--fg-primary);margin-bottom:0.6rem;';
  featuredTitle.textContent = '⭐ Destacados';
  wrapper.appendChild(featuredTitle);

  var featuredWrap = document.createElement('div');
  featuredWrap.style.cssText = 'display:flex;gap:0.75rem;overflow-x:auto;margin-bottom:1.5rem;padding-bottom:0.35rem;-webkit-overflow-scrolling:touch;';
  _bkRenderFeatured(featuredWrap);
  wrapper.appendChild(featuredWrap);

  // ── All listings grid ──────────────────────────────────────────
  var allTitle = document.createElement('div');
  allTitle.style.cssText = 'font-size:0.88rem;font-weight:700;color:var(--fg-primary);margin-bottom:0.6rem;';
  allTitle.textContent = '📋 Todas las opciones';
  wrapper.appendChild(allTitle);

  var gridWrap = document.createElement('div');
  gridWrap.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-bottom:1.5rem;';
  _bkRenderFilteredListings(gridWrap, _bkGetFilteredListings());
  wrapper.appendChild(gridWrap);

  // ── My Bookings button ─────────────────────────────────────────
  var myBkBtn = document.createElement('button');
  myBkBtn.className = 'btn btn-secondary w-full';
  myBkBtn.style.cssText += 'margin-bottom:1rem;font-size:0.78rem;';
  myBkBtn.textContent = '📄 Mis Reservas';
  myBkBtn.onclick = function() { window.showMyBookings(); };
  wrapper.appendChild(myBkBtn);

  // ── Footer ─────────────────────────────────────────────────────
  var footer = document.createElement('div');
  footer.style.cssText = 'text-align:center;padding:0.75rem 0;border-top:1px solid rgba(255,255,255,0.06);';
  footer.innerHTML = '<span style="font-size:0.62rem;color:#48484a;">Powered by SwingerSphere Booking</span>';
  wrapper.appendChild(footer);

  container.appendChild(wrapper);
};

// ── Category button style helper ─────────────────────────────────
function _bkCatBtnStyle(active) {
  return 'display:flex;flex-direction:column;align-items:center;gap:0.2rem;padding:0.5rem 0.75rem;border-radius:12px;border:1px solid ' +
    (active ? 'rgba(196,129,58,0.5)' : 'rgba(255,255,255,0.08)') + ';background:' +
    (active ? 'rgba(196,129,58,0.1)' : 'rgba(255,255,255,0.03)') + ';color:' +
    (active ? '#c4813a' : '#aeaeb2') + ';cursor:pointer;white-space:nowrap;flex-shrink:0;min-width:64px;';
}

function _bkUpdateCatButtons(catRow) {
  var btns = catRow.children;
  for (var i = 0; i < btns.length; i++) {
    var isActive = (i === 0 && !_bkActiveCategory) || (btns[i].dataset && btns[i].dataset.catId === _bkActiveCategory);
    btns[i].style.cssText = _bkCatBtnStyle(isActive);
  }
}

function _bkGetFilteredListings() {
  if (!_bkActiveCategory) return BOOKING_LISTINGS.slice();
  var filtered = [];
  for (var i = 0; i < BOOKING_LISTINGS.length; i++) {
    if (BOOKING_LISTINGS[i].category === _bkActiveCategory) filtered.push(BOOKING_LISTINGS[i]);
  }
  return filtered;
}

// ── Render featured cards ────────────────────────────────────────
function _bkRenderFeatured(container) {
  container.innerHTML = '';
  var listings = _bkGetFilteredListings();
  var featured = [];
  for (var i = 0; i < listings.length; i++) {
    if (listings[i].certified && featured.length < 3) featured.push(listings[i]);
  }
  if (featured.length === 0 && listings.length > 0) {
    featured = listings.slice(0, 3);
  }

  for (var fi = 0; fi < featured.length; fi++) {
    (function(listing) {
      var card = document.createElement('div');
      card.className = 'card';
      card.style.cssText = 'min-width:250px;width:250px;background:var(--bg-card);border:1px solid var(--border);border-radius:18px;overflow:hidden;flex-shrink:0;cursor:pointer;position:relative;box-shadow:var(--shadow-md);display:flex;flex-direction:column;transition:all var(--duration-base);';

      // Premium Header Banner
      var banner = document.createElement('div');
      var catColor = {
        'hotels': 'linear-gradient(135deg, #49287c 0%, #1a0c36 100%)',
        'events': 'linear-gradient(135deg, #7c4c28 0%, #36170c 100%)',
        'tickets': 'linear-gradient(135deg, #28647c 0%, #0c2736 100%)',
        'travel': 'linear-gradient(135deg, #287c48 0%, #0c3617 100%)'
      }[listing.category] || 'linear-gradient(135deg, #3a3a44 0%, #1e1e22 100%)';
      
      banner.style.cssText = 'width:100%;height:100px;background:' + catColor + ';display:flex;align-items:center;justify-content:center;position:relative;border-bottom:1px solid rgba(255,255,255,0.03);';
      
      var emojiEl = document.createElement('div');
      emojiEl.style.cssText = 'font-size:2.8rem;filter:drop-shadow(0 6px 16px rgba(0,0,0,0.6));';
      emojiEl.textContent = listing.image;
      banner.appendChild(emojiEl);

      if (listing.certified) {
        var badge = document.createElement('span');
        badge.style.cssText = 'position:absolute;top:0.5rem;right:0.5rem;font-size:0.55rem;background:rgba(48,209,88,0.2);color:#30d158;border:1px solid rgba(48,209,88,0.45);padding:3px 7px;border-radius:6px;font-weight:700;backdrop-filter:blur(4px);letter-spacing:0.5px;';
        badge.textContent = '✓ VERIFICADO';
        banner.appendChild(badge);
      }
      card.appendChild(banner);

      // Card Content
      var contentWrap = document.createElement('div');
      contentWrap.style.cssText = 'padding:0.875rem;display:flex;flex-direction:column;flex:1;';

      var nameEl = document.createElement('div');
      nameEl.style.cssText = 'font-size:0.82rem;font-weight:700;color:var(--fg-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:0.15rem;';
      nameEl.textContent = listing.name;
      contentWrap.appendChild(nameEl);

      var locEl = document.createElement('div');
      locEl.style.cssText = 'font-size:0.68rem;color:#aeaeb2;margin-bottom:0.5rem;';
      locEl.textContent = '📍 ' + listing.location;
      contentWrap.appendChild(locEl);

      var mid = document.createElement('div');
      mid.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem;';

      var priceEl = document.createElement('div');
      priceEl.style.cssText = 'font-size:1rem;font-weight:800;color:var(--copper);';
      priceEl.textContent = listing.price + ' EUR';
      var unitEl = document.createElement('span');
      unitEl.style.cssText = 'font-size:0.62rem;font-weight:400;color:#aeaeb2;';
      unitEl.textContent = '/' + listing.priceUnit;
      priceEl.appendChild(unitEl);
      mid.appendChild(priceEl);

      var ratingEl = document.createElement('div');
      ratingEl.style.cssText = 'font-size:0.72rem;color:#f5a623;';
      ratingEl.textContent = _bkRenderStars(listing.rating) + ' ' + listing.rating;
      mid.appendChild(ratingEl);
      contentWrap.appendChild(mid);

      var cta = document.createElement('button');
      cta.className = 'btn btn-primary w-full';
      cta.style.cssText = 'font-size:0.76rem;padding:0.5rem;';
      cta.textContent = 'Reservar';
      cta.onclick = function(e) {
        e.stopPropagation();
        window.showBookingDetail(listing.id);
      };
      contentWrap.appendChild(cta);
      card.appendChild(contentWrap);

      card.onclick = function() { window.showBookingDetail(listing.id); };
      container.appendChild(card);
    })(featured[fi]);
  }
}

// ── Render listings grid ─────────────────────────────────────────
function _bkRenderFilteredListings(container, listings) {
  container.innerHTML = '';

  if (listings.length === 0) {
    var empty = document.createElement('div');
    empty.style.cssText = 'grid-column:1/-1;text-align:center;padding:2rem 1rem;color:#636366;';
    empty.innerHTML = '<div style="font-size:1.5rem;margin-bottom:0.5rem;">🔍</div><div style="font-size:0.78rem;">No se encontraron resultados</div>';
    container.appendChild(empty);
    return;
  }

  for (var i = 0; i < listings.length; i++) {
    (function(listing) {
      var card = document.createElement('div');
      card.className = 'card';
      card.style.cssText = 'background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:0.6rem;cursor:pointer;transition:all 0.2s;box-shadow:var(--shadow-sm);';
      
      // Thumbnail with category gradient and floating emoji
      var thumb = document.createElement('div');
      var catColor = {
        'hotels': 'linear-gradient(135deg, #3a1d5d 0%, #15092a 100%)',
        'events': 'linear-gradient(135deg, #5b391d 0%, #201009 100%)',
        'tickets': 'linear-gradient(135deg, #1d4b5b 0%, #091a20 100%)',
        'travel': 'linear-gradient(135deg, #1d5b34 0%, #092010 100%)'
      }[listing.category] || 'linear-gradient(135deg, #242428 0%, #141416 100%)';
      
      thumb.style.cssText = 'width:100%;height:80px;border-radius:12px;background:' + catColor + ';display:flex;align-items:center;justify-content:center;position:relative;margin-bottom:0.6rem;overflow:hidden;border:1px solid rgba(255,255,255,0.03);';
      
      var emojiEl = document.createElement('span');
      emojiEl.style.cssText = 'font-size:2.2rem;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5));';
      emojiEl.textContent = listing.image;
      thumb.appendChild(emojiEl);

      if (listing.certified) {
        var cbadge = document.createElement('span');
        cbadge.style.cssText = 'position:absolute;top:0.4rem;right:0.4rem;font-size:0.55rem;background:rgba(48,209,88,0.2);color:#30d158;border:1px solid rgba(48,209,88,0.4);padding:2px 6px;border-radius:6px;font-weight:700;backdrop-filter:blur(4px);';
        cbadge.textContent = '✓ VERIFICADO';
        thumb.appendChild(cbadge);
      }
      card.appendChild(thumb);

      var nm = document.createElement('div');
      nm.style.cssText = 'font-size:0.74rem;font-weight:700;color:var(--fg-primary);margin-bottom:0.15rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
      nm.textContent = listing.name;
      card.appendChild(nm);

      var loc = document.createElement('div');
      loc.style.cssText = 'font-size:0.62rem;color:#aeaeb2;margin-bottom:0.35rem;';
      loc.textContent = listing.location;
      card.appendChild(loc);

      var btm = document.createElement('div');
      btm.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';

      var pr = document.createElement('div');
      pr.style.cssText = 'font-size:0.78rem;font-weight:700;color:var(--copper);';
      pr.textContent = listing.price + ' EUR';
      btm.appendChild(pr);

      var rt = document.createElement('div');
      rt.style.cssText = 'font-size:0.62rem;color:#f5a623;';
      rt.textContent = '★ ' + listing.rating;
      btm.appendChild(rt);

      card.appendChild(btm);

      card.onclick = function() { window.showBookingDetail(listing.id); };
      container.appendChild(card);
    })(listings[i]);
  }
}


// ══════════════════════════════════════════════════════════════════
//  2. LISTING DETAIL
// ══════════════════════════════════════════════════════════════════
window.showBookingDetail = function(listingId) {
  var listing = _bkGetListing(listingId);
  if (!listing) { if(typeof showToast==='function') showToast('Listing no encontrado','error'); return; }

  document.getElementById('bk-detail-ov')?.remove();
  _bkSelectedDate = null;
  _bkPeopleCount = 2;

  var ov = document.createElement('div');
  ov.id = 'bk-detail-ov';
  ov.className = 'overlay center';
  ov.style.cssText = 'z-index:77000;';

  var modal = document.createElement('div');
  modal.style.cssText = 'background:linear-gradient(135deg,#111318,#0d1520);border:1px solid rgba(196,129,58,0.3);border-radius:24px;padding:0;overflow:hidden;max-width:420px;width:100%;max-height:90vh;overflow-y:auto;';

  // ── Header ─────────────────────────────────────────────────────
  var hdr = document.createElement('div');
  hdr.style.cssText = 'background:linear-gradient(135deg,rgba(196,129,58,0.12),rgba(196,129,58,0.04));border-bottom:1px solid rgba(196,129,58,0.2);padding:1.25rem;text-align:center;position:sticky;top:0;z-index:2;backdrop-filter:blur(10px);';

  var emojiH = document.createElement('div');
  emojiH.style.cssText = 'font-size:2.2rem;margin-bottom:0.35rem;';
  emojiH.textContent = listing.image;
  hdr.appendChild(emojiH);

  var nameH = document.createElement('h2');
  nameH.style.cssText = 'font-size:1.1rem;font-weight:800;background:linear-gradient(135deg,#f2f2f7,#c4813a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:0.3rem;';
  nameH.textContent = listing.name;
  hdr.appendChild(nameH);

  var locH = document.createElement('div');
  locH.style.cssText = 'font-size:0.72rem;color:#aeaeb2;margin-bottom:0.25rem;';
  locH.textContent = '📍 ' + listing.location;
  hdr.appendChild(locH);

  if (listing.certified) {
    var certH = document.createElement('span');
    certH.style.cssText = 'font-size:0.62rem;background:rgba(196,129,58,0.15);color:#c4813a;padding:2px 8px;border-radius:6px;font-weight:600;';
    certH.textContent = '✓ Certificado SwingerSphere';
    hdr.appendChild(certH);
  }

  var closeBtn = document.createElement('button');
  closeBtn.style.cssText = 'position:absolute;top:1rem;right:1rem;background:none;border:none;color:#aeaeb2;font-size:1.1rem;cursor:pointer;padding:4px;';
  closeBtn.textContent = '\u2715';
  closeBtn.onclick = function() { ov.remove(); };
  hdr.appendChild(closeBtn);
  modal.appendChild(hdr);

  // ── Body ───────────────────────────────────────────────────────
  var body = document.createElement('div');
  body.style.cssText = 'padding:1.25rem;';

  // Price
  var priceRow = document.createElement('div');
  priceRow.style.cssText = 'text-align:center;margin-bottom:1rem;';
  var priceMain = document.createElement('div');
  priceMain.style.cssText = 'font-size:1.6rem;font-weight:800;color:var(--copper);';
  priceMain.textContent = listing.price + ' EUR';
  var priceUnitEl = document.createElement('span');
  priceUnitEl.style.cssText = 'font-size:0.72rem;font-weight:400;color:#aeaeb2;';
  priceUnitEl.textContent = ' / ' + listing.priceUnit;
  priceMain.appendChild(priceUnitEl);
  priceRow.appendChild(priceMain);
  body.appendChild(priceRow);

  // Rating
  var ratingRow = document.createElement('div');
  ratingRow.style.cssText = 'text-align:center;margin-bottom:1rem;font-size:0.78rem;color:#f5a623;';
  ratingRow.textContent = _bkRenderStars(listing.rating) + ' ' + listing.rating + '  ·  ' + listing.reviews + ' resenas';
  body.appendChild(ratingRow);

  // Description
  var descEl = document.createElement('p');
  descEl.style.cssText = 'font-size:0.76rem;color:#aeaeb2;line-height:1.5;margin-bottom:1.25rem;';
  descEl.textContent = listing.description;
  body.appendChild(descEl);

  // ── Available dates ────────────────────────────────────────────
  var datesLabel = document.createElement('div');
  datesLabel.style.cssText = 'font-size:0.78rem;font-weight:700;color:var(--fg-primary);margin-bottom:0.5rem;';
  datesLabel.textContent = '📅 Fechas disponibles';
  body.appendChild(datesLabel);

  var datesWrap = document.createElement('div');
  datesWrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:1.25rem;';

  for (var di = 0; di < listing.dates.length; di++) {
    (function(dateStr, idx) {
      var chip = document.createElement('button');
      chip.className = 'chip';
      chip.style.cssText = 'padding:0.35rem 0.65rem;border-radius:10px;font-size:0.68rem;cursor:pointer;border:1px solid var(--border);background:var(--bg-elevated);color:#aeaeb2;font-weight:500;';
      chip.textContent = _bkFormatDate(dateStr);
      chip.onclick = function() {
        _bkSelectedDate = dateStr;
        // Update chip styles
        var chips = datesWrap.children;
        for (var c = 0; c < chips.length; c++) {
          chips[c].style.background = 'var(--bg-elevated)';
          chips[c].style.color = '#aeaeb2';
          chips[c].style.borderColor = 'var(--border)';
        }
        chip.style.background = 'rgba(196,129,58,0.15)';
        chip.style.color = '#c4813a';
        chip.style.borderColor = 'rgba(196,129,58,0.5)';
        _bkUpdateTotal(totalEl, listing);
      };
      datesWrap.appendChild(chip);
    })(listing.dates[di], di);
  }
  body.appendChild(datesWrap);

  // ── People / quantity selector ─────────────────────────────────
  var peopleLabel = document.createElement('div');
  peopleLabel.style.cssText = 'font-size:0.78rem;font-weight:700;color:var(--fg-primary);margin-bottom:0.5rem;';
  peopleLabel.textContent = '👥 Personas / Cantidad';
  body.appendChild(peopleLabel);

  var peopleRow = document.createElement('div');
  peopleRow.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:1rem;margin-bottom:1.25rem;';

  var minusBtn = document.createElement('button');
  minusBtn.style.cssText = 'width:36px;height:36px;border-radius:50%;background:var(--bg-elevated);border:1px solid var(--border);color:var(--fg-primary);font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;';
  minusBtn.textContent = '−';

  var countEl = document.createElement('span');
  countEl.style.cssText = 'font-size:1.3rem;font-weight:700;color:var(--fg-primary);min-width:2rem;text-align:center;';
  countEl.textContent = String(_bkPeopleCount);

  var plusBtn = document.createElement('button');
  plusBtn.style.cssText = 'width:36px;height:36px;border-radius:50%;background:var(--bg-elevated);border:1px solid var(--border);color:var(--fg-primary);font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;';
  plusBtn.textContent = '+';

  minusBtn.onclick = function() {
    if (_bkPeopleCount > 1) {
      _bkPeopleCount--;
      countEl.textContent = String(_bkPeopleCount);
      _bkUpdateTotal(totalEl, listing);
    }
  };
  plusBtn.onclick = function() {
    if (_bkPeopleCount < 20) {
      _bkPeopleCount++;
      countEl.textContent = String(_bkPeopleCount);
      _bkUpdateTotal(totalEl, listing);
    }
  };

  peopleRow.appendChild(minusBtn);
  peopleRow.appendChild(countEl);
  peopleRow.appendChild(plusBtn);
  body.appendChild(peopleRow);

  // ── Total price ────────────────────────────────────────────────
  var totalWrap = document.createElement('div');
  totalWrap.style.cssText = 'background:rgba(196,129,58,0.06);border:1px solid rgba(196,129,58,0.2);border-radius:14px;padding:1rem;margin-bottom:0.5rem;text-align:center;';

  var totalLabel = document.createElement('div');
  totalLabel.style.cssText = 'font-size:0.68rem;color:#aeaeb2;margin-bottom:0.3rem;';
  totalLabel.textContent = 'Total estimado';
  totalWrap.appendChild(totalLabel);

  var totalEl = document.createElement('div');
  totalEl.style.cssText = 'font-size:1.4rem;font-weight:800;color:var(--copper);';
  _bkUpdateTotal(totalEl, listing);
  totalWrap.appendChild(totalEl);

  var commNote = document.createElement('div');
  commNote.style.cssText = 'font-size:0.6rem;color:#636366;margin-top:0.3rem;';
  commNote.textContent = 'Precio final — sin cargos adicionales';
  totalWrap.appendChild(commNote);
  body.appendChild(totalWrap);

  // ── CTA button ─────────────────────────────────────────────────
  var ctaBtn = document.createElement('button');
  ctaBtn.className = 'btn btn-primary w-full';
  ctaBtn.style.cssText += 'font-size:0.88rem;padding:0.75rem;margin-top:1rem;font-weight:700;';
  ctaBtn.textContent = 'Reservar ahora';
  ctaBtn.onclick = function() {
    if (!_bkSelectedDate) {
      if(typeof showToast==='function') showToast('Selecciona una fecha','error');
      return;
    }
    window.processBooking(listing.id, _bkSelectedDate, _bkPeopleCount);
  };
  body.appendChild(ctaBtn);

  // ── Footer ─────────────────────────────────────────────────────
  var footerDetail = document.createElement('div');
  footerDetail.style.cssText = 'text-align:center;margin-top:1rem;padding-top:0.75rem;border-top:1px solid rgba(255,255,255,0.06);';
  footerDetail.innerHTML = '<span style="font-size:0.58rem;color:#48484a;">Powered by SwingerSphere Booking · Comision 0% para ti</span>';
  body.appendChild(footerDetail);

  modal.appendChild(body);
  ov.appendChild(modal);
  ov.onclick = function(e) { if(e.target === ov) ov.remove(); };
  document.body.appendChild(ov);

  if (window.SecurityLog) SecurityLog.write('BOOKING_VIEW', {listingId: listing.id, name: listing.name});
};

function _bkUpdateTotal(totalEl, listing) {
  var multiplier = _bkPeopleCount;
  // For 'pareja' pricing, count by couples (pairs of 2)
  if (listing.priceUnit === 'pareja') {
    multiplier = Math.ceil(_bkPeopleCount / 2);
  }
  var total = listing.price * multiplier;
  totalEl.textContent = total + ' EUR';
}


// ══════════════════════════════════════════════════════════════════
//  3. BOOKING FLOW
// ══════════════════════════════════════════════════════════════════
window.processBooking = function(listingId, date, people) {
  var listing = _bkGetListing(listingId);
  if (!listing) return;

  document.getElementById('bk-confirm-ov')?.remove();

  var multiplier = people;
  if (listing.priceUnit === 'pareja') multiplier = Math.ceil(people / 2);
  var total = listing.price * multiplier;

  var ov = document.createElement('div');
  ov.id = 'bk-confirm-ov';
  ov.className = 'overlay center';
  ov.style.cssText = 'z-index:78000;';

  var modal = document.createElement('div');
  modal.style.cssText = 'background:linear-gradient(135deg,#111318,#0d1520);border:1px solid rgba(196,129,58,0.3);border-radius:24px;padding:1.5rem;max-width:380px;width:100%;';

  // Title
  var title = document.createElement('div');
  title.style.cssText = 'text-align:center;margin-bottom:1.25rem;';
  title.innerHTML = '<div style="font-size:1.5rem;margin-bottom:0.3rem;">📋</div>' +
    '<h3 style="font-size:1rem;font-weight:700;color:var(--fg-primary);margin-bottom:0.2rem;">Confirmar reserva</h3>';
  modal.appendChild(title);

  // Summary
  var summary = document.createElement('div');
  summary.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:14px;padding:1rem;margin-bottom:1.25rem;';

  var rows = [
    {label: listing.image + ' ' + listing.name, value: ''},
    {label: '📍 Ubicacion', value: listing.location},
    {label: '📅 Fecha', value: _bkFormatDate(date)},
    {label: '👥 Personas', value: String(people)},
    {label: '💰 Total', value: total + ' EUR', highlight: true},
  ];

  for (var ri = 0; ri < rows.length; ri++) {
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:0.35rem 0;' + (ri < rows.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.05);' : '');
    var lbl = document.createElement('span');
    lbl.style.cssText = 'font-size:0.74rem;color:' + (rows[ri].value === '' ? 'var(--fg-primary);font-weight:700' : '#aeaeb2') + ';';
    lbl.textContent = rows[ri].label;
    row.appendChild(lbl);
    if (rows[ri].value) {
      var val = document.createElement('span');
      val.style.cssText = 'font-size:0.78rem;font-weight:' + (rows[ri].highlight ? '800' : '600') + ';color:' + (rows[ri].highlight ? 'var(--copper)' : 'var(--fg-primary)') + ';';
      val.textContent = rows[ri].value;
      row.appendChild(val);
    }
    summary.appendChild(row);
  }
  modal.appendChild(summary);

  // Payment options
  var payLabel = document.createElement('div');
  payLabel.style.cssText = 'font-size:0.78rem;font-weight:700;color:var(--fg-primary);margin-bottom:0.6rem;text-align:center;';
  payLabel.textContent = 'Metodo de pago';
  modal.appendChild(payLabel);

  var payBtns = document.createElement('div');
  payBtns.style.cssText = 'display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1rem;';

  // ── Wallet balance display ──────────────────────────────────────
  var walletBal = (window.wallet && typeof wallet.getBalance === 'function') ? wallet.getBalance() : 0;
  var balInfo = document.createElement('div');
  balInfo.style.cssText = 'text-align:center;font-size:0.72rem;color:#aeaeb2;margin-bottom:0.6rem;padding:0.5rem;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid var(--border);';
  balInfo.innerHTML = '💰 Saldo wallet: <strong style="color:var(--copper);">' + walletBal.toFixed(2) + ' USDC</strong>';
  if (walletBal < total) {
    balInfo.innerHTML += '<br><span style="color:#ff6b6b;font-size:0.65rem;">⚠ Saldo insuficiente — recarga primero</span>';
  }
  payBtns.appendChild(balInfo);

  // Card payment (On-Ramp → wallet → pay)
  var cardBtn = document.createElement('button');
  cardBtn.className = 'btn btn-primary w-full';
  cardBtn.style.cssText += 'font-size:0.82rem;padding:0.65rem;';
  cardBtn.textContent = '💳 Pagar con tarjeta — ' + total + ' EUR';
  cardBtn.onclick = function() {
    _bkSimulatedPayment(listing, date, people, total, 'tarjeta', ov);
  };
  payBtns.appendChild(cardBtn);

  // Crypto payment (direct wallet pay)
  var cryptoBtn = document.createElement('button');
  cryptoBtn.className = 'btn btn-secondary w-full';
  cryptoBtn.style.cssText += 'font-size:0.82rem;padding:0.65rem;';
  cryptoBtn.textContent = '🪙 Pagar con crypto — ' + total + ' USDC';
  cryptoBtn.onclick = function() {
    _bkSimulatedPayment(listing, date, people, total, 'crypto', ov);
  };
  payBtns.appendChild(cryptoBtn);

  modal.appendChild(payBtns);

  // Cancel
  var cancelBtn = document.createElement('button');
  cancelBtn.style.cssText = 'width:100%;background:none;border:none;color:#636366;font-size:0.72rem;cursor:pointer;padding:0.5rem;';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.onclick = function() { ov.remove(); };
  modal.appendChild(cancelBtn);

  // Close button
  var closeBtn2 = document.createElement('button');
  closeBtn2.style.cssText = 'position:absolute;top:1rem;right:1rem;background:none;border:none;color:#aeaeb2;font-size:1.1rem;cursor:pointer;padding:4px;';
  closeBtn2.textContent = '\u2715';
  closeBtn2.onclick = function() { ov.remove(); };
  modal.style.position = 'relative';
  modal.appendChild(closeBtn2);

  ov.appendChild(modal);
  ov.onclick = function(e) { if(e.target === ov) ov.remove(); };
  document.body.appendChild(ov);

  if (window.SecurityLog) SecurityLog.write('BOOKING_CHECKOUT', {listingId: listing.id, date: date, people: people, total: total});
};

// ── Simulated Payment Flow ───────────────────────────────────────
function _bkSimulatedPayment(listing, date, people, total, method, previousOv) {
  var bal = (window.wallet && typeof wallet.getBalance === 'function') ? wallet.getBalance() : 0;

  // If balance insufficient, open On-Ramp first
  if (bal < total) {
    _bkShowOnRamp(total, bal, function() {
      // After recharge, proceed with payment
      _bkProcessPaymentAnimation(listing, date, people, total, method, previousOv);
    });
    return;
  }

  // Balance sufficient — proceed directly
  _bkProcessPaymentAnimation(listing, date, people, total, method, previousOv);
}

// ── On-Ramp Modal (Simulated fiat → crypto purchase) ─────────────
function _bkShowOnRamp(needed, currentBal, onSuccess) {
  var deficit = Math.ceil(needed - currentBal);
  var ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;z-index:80000;';

  var modal = document.createElement('div');
  modal.style.cssText = 'background:linear-gradient(135deg,#111318,#0d1520);border:1px solid rgba(196,129,58,0.4);border-radius:20px;padding:1.5rem;max-width:340px;width:90%;text-align:center;box-shadow:0 0 30px rgba(196,129,58,0.15);';

  modal.innerHTML =
    '<div style="font-size:2rem;margin-bottom:0.5rem;">🏦</div>' +
    '<h3 style="font-size:1rem;font-weight:700;color:var(--fg-primary);margin-bottom:0.3rem;">Recarga necesaria</h3>' +
    '<p style="font-size:0.72rem;color:#aeaeb2;margin-bottom:1rem;">Tu saldo actual es <strong style="color:var(--copper);">' + currentBal.toFixed(2) + ' USDC</strong>. Necesitas <strong style="color:#ff6b6b;">' + needed.toFixed(2) + ' USDC</strong>.</p>' +
    '<div style="background:rgba(196,129,58,0.06);border:1px solid rgba(196,129,58,0.2);border-radius:14px;padding:0.75rem;margin-bottom:1rem;">' +
      '<div style="font-size:0.65rem;color:#aeaeb2;">Comprando via On-Ramp (Simulado)</div>' +
      '<div style="font-size:1.3rem;font-weight:800;color:var(--copper);margin:0.3rem 0;">' + deficit + ' EUR → ' + deficit + ' USDC</div>' +
      '<div style="font-size:0.6rem;color:#636366;">Tasa: 1 EUR = 1 USDC (demo)</div>' +
    '</div>' +
    '<div id="onramp-actions"></div>';

  ov.appendChild(modal);
  document.body.appendChild(ov);

  var actionsDiv = modal.querySelector('#onramp-actions');

  var confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn btn-primary w-full';
  confirmBtn.style.cssText += 'font-size:0.82rem;padding:0.65rem;margin-bottom:0.5rem;';
  confirmBtn.textContent = '✅ Simular compra de ' + deficit + ' USDC';
  confirmBtn.onclick = function() {
    confirmBtn.disabled = true;
    confirmBtn.textContent = '⏳ Procesando...';
    confirmBtn.style.opacity = '0.6';

    setTimeout(function() {
      // Add balance
      if (window.wallet && typeof wallet.addBalance === 'function') {
        wallet.addBalance(deficit);
      }
      ov.remove();
      if (typeof showToast === 'function') showToast('✅ Recarga de ' + deficit + ' USDC completada', 'success');
      // Now proceed with payment
      if (onSuccess) onSuccess();
    }, 1500);
  };
  actionsDiv.appendChild(confirmBtn);

  var cancelBtn = document.createElement('button');
  cancelBtn.style.cssText = 'width:100%;background:none;border:none;color:#636366;font-size:0.72rem;cursor:pointer;padding:0.5rem;';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.onclick = function() { ov.remove(); };
  actionsDiv.appendChild(cancelBtn);
}

// ── Payment Processing Animation ─────────────────────────────────
function _bkProcessPaymentAnimation(listing, date, people, total, method, previousOv) {
  var ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;z-index:80000;';

  var modal = document.createElement('div');
  modal.style.cssText = 'background:linear-gradient(135deg,#111318,#0d1520);border:1px solid rgba(196,129,58,0.3);border-radius:20px;padding:2rem;max-width:300px;width:90%;text-align:center;';

  var spinner = document.createElement('div');
  spinner.style.cssText = 'width:48px;height:48px;border:3px solid rgba(196,129,58,0.2);border-top:3px solid #c4813a;border-radius:50%;margin:0 auto 1rem;animation:spin 1s linear infinite;';
  modal.appendChild(spinner);

  // Add spinner keyframes if not present
  if (!document.getElementById('bk-spin-style')) {
    var style = document.createElement('style');
    style.id = 'bk-spin-style';
    style.textContent = '@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}';
    document.head.appendChild(style);
  }

  var msg = document.createElement('div');
  msg.style.cssText = 'font-size:0.82rem;color:var(--fg-primary);font-weight:600;margin-bottom:0.3rem;';
  msg.textContent = 'Procesando pago...';
  modal.appendChild(msg);

  var sub = document.createElement('div');
  sub.style.cssText = 'font-size:0.68rem;color:#aeaeb2;';
  sub.textContent = 'Deduciendo ' + total + ' USDC de tu wallet';
  modal.appendChild(sub);

  ov.appendChild(modal);
  document.body.appendChild(ov);

  // Simulate processing delay
  setTimeout(function() {
    // Deduct from wallet
    if (window.wallet && typeof wallet.addBalance === 'function') {
      wallet.addBalance(-total);
    }

    ov.remove();
    _bkCompleteBooking(listing, date, people, total, method, previousOv);
  }, 2000);
}

// ── Complete booking after payment ───────────────────────────────
function _bkCompleteBooking(listing, date, people, total, method, previousOv) {
  var code = _bkGenCode();
  var booking = {
    id: 'bk-' + Date.now(),
    code: code,
    listingId: listing.id,
    listingName: listing.name,
    listingImage: listing.image,
    location: listing.location,
    date: date,
    people: people,
    total: total,
    method: method,
    status: 'Confirmada',
    createdAt: new Date().toISOString(),
  };

  _bkSaveBooking(booking);

  if (window.SecurityLog) SecurityLog.write('BOOKING_CONFIRMED', {code: code, listingId: listing.id, total: total, method: method});

  // Remove previous overlay
  if (previousOv) previousOv.remove();
  document.getElementById('bk-detail-ov')?.remove();

  // Show confirmation
  var ov = document.createElement('div');
  ov.id = 'bk-success-ov';
  ov.className = 'overlay center';
  ov.style.cssText = 'z-index:79000;';

  var modal = document.createElement('div');
  modal.style.cssText = 'background:linear-gradient(135deg,#111318,#0d1520);border:1px solid rgba(196,129,58,0.3);border-radius:24px;padding:1.5rem;max-width:380px;width:100%;text-align:center;';

  // Success animation
  var checkmark = document.createElement('div');
  checkmark.style.cssText = 'font-size:2.5rem;margin-bottom:0.5rem;';
  checkmark.textContent = '✅';
  modal.appendChild(checkmark);

  var successTitle = document.createElement('h3');
  successTitle.style.cssText = 'font-size:1.05rem;font-weight:800;color:var(--fg-primary);margin-bottom:0.3rem;';
  successTitle.textContent = 'Reserva confirmada!';
  modal.appendChild(successTitle);

  var successSub = document.createElement('p');
  successSub.style.cssText = 'font-size:0.72rem;color:#aeaeb2;margin-bottom:1.25rem;';
  successSub.textContent = 'Tu reserva ha sido procesada correctamente';
  modal.appendChild(successSub);

  // Confirmation code
  var codeWrap = document.createElement('div');
  codeWrap.style.cssText = 'background:rgba(196,129,58,0.08);border:1px solid rgba(196,129,58,0.25);border-radius:14px;padding:1rem;margin-bottom:1rem;';

  var codeLabel = document.createElement('div');
  codeLabel.style.cssText = 'font-size:0.62rem;color:#aeaeb2;margin-bottom:0.3rem;';
  codeLabel.textContent = 'Codigo de confirmacion';
  codeWrap.appendChild(codeLabel);

  var codeEl = document.createElement('div');
  codeEl.style.cssText = 'font-size:1.4rem;font-weight:800;color:var(--copper);letter-spacing:3px;font-family:monospace;';
  codeEl.textContent = code;
  codeWrap.appendChild(codeEl);
  modal.appendChild(codeWrap);

  // QR code placeholder
  var qrLabel = document.createElement('div');
  qrLabel.style.cssText = 'font-size:0.62rem;color:#636366;margin-bottom:0.4rem;';
  qrLabel.textContent = 'Tu QR de acceso';
  modal.appendChild(qrLabel);
  modal.appendChild(_bkBuildQR());

  // Details summary
  var detailsWrap = document.createElement('div');
  detailsWrap.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:12px;padding:0.75rem;margin-top:1rem;margin-bottom:1rem;text-align:left;';

  var dRows = [
    {label: listing.image + ' ' + listing.name, value: ''},
    {label: '📅 Fecha', value: _bkFormatDate(date)},
    {label: '👥 Personas', value: String(people)},
    {label: '💰 Total pagado', value: total + ' EUR'},
    {label: '💳 Metodo', value: method === 'tarjeta' ? 'Tarjeta' : 'Crypto'},
  ];

  for (var di = 0; di < dRows.length; di++) {
    var drow = document.createElement('div');
    drow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:0.25rem 0;font-size:0.7rem;';
    var dlbl = document.createElement('span');
    dlbl.style.cssText = 'color:' + (dRows[di].value === '' ? 'var(--fg-primary);font-weight:700' : '#aeaeb2') + ';';
    dlbl.textContent = dRows[di].label;
    drow.appendChild(dlbl);
    if (dRows[di].value) {
      var dval = document.createElement('span');
      dval.style.cssText = 'color:var(--fg-primary);font-weight:600;';
      dval.textContent = dRows[di].value;
      drow.appendChild(dval);
    }
    detailsWrap.appendChild(drow);
  }
  modal.appendChild(detailsWrap);

  // Guardar button
  var saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary w-full';
  saveBtn.style.cssText += 'font-size:0.82rem;padding:0.65rem;margin-bottom:0.5rem;';
  saveBtn.textContent = '💾 Guardar reserva';
  saveBtn.onclick = function() {
    ov.remove();
    if(typeof showToast==='function') showToast('Reserva guardada en Mis Reservas','success');
  };
  modal.appendChild(saveBtn);

  // Close
  var doneBtn = document.createElement('button');
  doneBtn.className = 'btn btn-secondary w-full';
  doneBtn.style.cssText += 'font-size:0.76rem;';
  doneBtn.textContent = 'Cerrar';
  doneBtn.onclick = function() { ov.remove(); };
  modal.appendChild(doneBtn);

  ov.appendChild(modal);
  ov.onclick = function(e) { if(e.target === ov) ov.remove(); };
  document.body.appendChild(ov);

  if(typeof showToast==='function') showToast('🎉 Reserva ' + code + ' confirmada!','copper');
}


// ══════════════════════════════════════════════════════════════════
//  4. MY BOOKINGS
// ══════════════════════════════════════════════════════════════════
window.showMyBookings = function() {
  document.getElementById('bk-mybookings-ov')?.remove();

  var ov = document.createElement('div');
  ov.id = 'bk-mybookings-ov';
  ov.className = 'overlay center';
  ov.style.cssText = 'z-index:77500;';

  var modal = document.createElement('div');
  modal.style.cssText = 'background:linear-gradient(135deg,#111318,#0d1520);border:1px solid rgba(196,129,58,0.3);border-radius:24px;padding:0;overflow:hidden;max-width:420px;width:100%;max-height:90vh;overflow-y:auto;';

  // Header
  var hdr = document.createElement('div');
  hdr.style.cssText = 'background:linear-gradient(135deg,rgba(196,129,58,0.12),rgba(196,129,58,0.04));border-bottom:1px solid rgba(196,129,58,0.2);padding:1.25rem;text-align:center;position:sticky;top:0;z-index:2;backdrop-filter:blur(10px);';

  var hdrEmoji = document.createElement('div');
  hdrEmoji.style.cssText = 'font-size:1.5rem;margin-bottom:0.3rem;';
  hdrEmoji.textContent = '📄';
  hdr.appendChild(hdrEmoji);

  var hdrTitle = document.createElement('h2');
  hdrTitle.style.cssText = 'font-size:1.1rem;font-weight:800;background:linear-gradient(135deg,#f2f2f7,#c4813a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;';
  hdrTitle.textContent = 'Mis Reservas';
  hdr.appendChild(hdrTitle);

  var closeBtn = document.createElement('button');
  closeBtn.style.cssText = 'position:absolute;top:1rem;right:1rem;background:none;border:none;color:#aeaeb2;font-size:1.1rem;cursor:pointer;padding:4px;';
  closeBtn.textContent = '\u2715';
  closeBtn.onclick = function() { ov.remove(); };
  hdr.appendChild(closeBtn);
  modal.appendChild(hdr);

  // Body
  var body = document.createElement('div');
  body.style.cssText = 'padding:1rem;';

  var bookings = _bkGetBookings();

  if (bookings.length === 0) {
    var empty = document.createElement('div');
    empty.style.cssText = 'text-align:center;padding:2.5rem 1rem;';
    empty.innerHTML = '<div style="font-size:2rem;margin-bottom:0.75rem;">🏨</div>' +
      '<div style="font-size:0.88rem;font-weight:700;color:var(--fg-primary);margin-bottom:0.3rem;">No tienes reservas</div>' +
      '<div style="font-size:0.72rem;color:#aeaeb2;">Explora hoteles y eventos!</div>';
    body.appendChild(empty);
  } else {
    for (var bi = 0; bi < bookings.length; bi++) {
      (function(bk) {
        var card = document.createElement('div');
        card.style.cssText = 'background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:0.85rem;margin-bottom:0.6rem;';

        var topRow = document.createElement('div');
        topRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;';

        var nameEl = document.createElement('div');
        nameEl.style.cssText = 'font-size:0.8rem;font-weight:700;color:var(--fg-primary);';
        nameEl.textContent = (bk.listingImage || '🏨') + ' ' + bk.listingName;
        topRow.appendChild(nameEl);

        var statusEl = document.createElement('span');
        var isConfirmed = bk.status === 'Confirmada';
        statusEl.style.cssText = 'font-size:0.58rem;padding:2px 8px;border-radius:6px;font-weight:600;background:' +
          (isConfirmed ? 'rgba(48,209,88,0.15)' : 'rgba(255,159,10,0.15)') + ';color:' +
          (isConfirmed ? '#30d158' : '#ff9f0a') + ';';
        statusEl.textContent = bk.status || 'Pendiente';
        topRow.appendChild(statusEl);
        card.appendChild(topRow);

        var detailsRow = document.createElement('div');
        detailsRow.style.cssText = 'display:flex;gap:1rem;font-size:0.68rem;color:#aeaeb2;margin-bottom:0.4rem;';
        detailsRow.innerHTML = '<span>📅 ' + _bkFormatDate(bk.date) + '</span><span>👥 ' + bk.people + '</span><span>💰 ' + bk.total + ' EUR</span>';
        card.appendChild(detailsRow);

        var codeRow = document.createElement('div');
        codeRow.style.cssText = 'font-size:0.68rem;color:var(--copper);font-weight:600;font-family:monospace;';
        codeRow.textContent = 'Codigo: ' + bk.code;
        card.appendChild(codeRow);

        body.appendChild(card);
      })(bookings[bi]);
    }
  }

  modal.appendChild(body);
  ov.appendChild(modal);
  ov.onclick = function(e) { if(e.target === ov) ov.remove(); };
  document.body.appendChild(ov);
};


// ══════════════════════════════════════════════════════════════════
//  5. SEARCH
// ══════════════════════════════════════════════════════════════════
window.searchBookings = function(query) {
  if (!query || typeof query !== 'string') return [];
  var q = query.toLowerCase();
  var results = [];
  for (var i = 0; i < BOOKING_LISTINGS.length; i++) {
    var l = BOOKING_LISTINGS[i];
    if (l.name.toLowerCase().indexOf(q) !== -1 ||
        l.location.toLowerCase().indexOf(q) !== -1 ||
        l.category.toLowerCase().indexOf(q) !== -1 ||
        l.description.toLowerCase().indexOf(q) !== -1) {
      results.push(l);
    }
  }
  return results;
};


// ══════════════════════════════════════════════════════════════════
//  6. LIMONCITO INTEGRATION HELPERS
// ══════════════════════════════════════════════════════════════════
window.getBookingRecommendations = function(city) {
  if (!city || typeof city !== 'string') return [];
  var c = city.toLowerCase();
  var results = [];
  for (var i = 0; i < BOOKING_LISTINGS.length; i++) {
    if (BOOKING_LISTINGS[i].location.toLowerCase().indexOf(c) !== -1) {
      results.push(BOOKING_LISTINGS[i]);
    }
  }
  return results;
};

window.getBookingCard = function(listing) {
  if (!listing) return '';
  var certBadge = listing.certified ? '<span style="font-size:0.55rem;background:rgba(196,129,58,0.15);color:#c4813a;padding:1px 5px;border-radius:4px;font-weight:600;margin-left:0.3rem;">✓ Certificado</span>' : '';
  var stars = _bkRenderStars(listing.rating);

  return '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:0.85rem;margin:0.5rem 0;">' +
    '<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem;">' +
      '<span style="font-size:1.3rem;">' + listing.image + '</span>' +
      '<div style="flex:1;">' +
        '<div style="font-size:0.8rem;font-weight:700;color:var(--fg-primary);">' + listing.name + certBadge + '</div>' +
        '<div style="font-size:0.65rem;color:#aeaeb2;">📍 ' + listing.location + '</div>' +
      '</div>' +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">' +
      '<span style="font-size:0.88rem;font-weight:800;color:var(--copper);">' + listing.price + ' EUR<span style="font-size:0.6rem;font-weight:400;color:#aeaeb2;">/' + listing.priceUnit + '</span></span>' +
      '<span style="font-size:0.65rem;color:#f5a623;">' + stars + ' ' + listing.rating + ' (' + listing.reviews + ')</span>' +
    '</div>' +
    '<button onclick="window.showBookingDetail(\'' + listing.id + '\')" class="btn btn-primary w-full" style="font-size:0.76rem;padding:0.45rem;">Reservar</button>' +
  '</div>';
};


console.log('🏨 SwingerSphere Booking Engine v1.0 | ' + BOOKING_LISTINGS.length + ' listings | 4 categories');
