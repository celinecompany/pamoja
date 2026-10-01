(function () {
  'use strict';

  // ── COST DATA (USD) ────────────────────────────────────────────────────────
  var FLIGHTS = {
    // Africa
    'nigeria':       { low: 200,  high: 450  },
    'ghana':         { low: 230,  high: 480  },
    'ivory-coast':   { low: 280,  high: 520  },
    'senegal':       { low: 260,  high: 500  },
    'cameroon':      { low: 250,  high: 490  },
    'algeria':       { low: 280,  high: 520  },
    'morocco':       { low: 300,  high: 560  },
    'egypt':         { low: 250,  high: 480  },
    'tunisia':       { low: 280,  high: 530  },
    'south-africa':  { low: 300,  high: 580  },
    'ethiopia':      { low: 80,   high: 200  },
    'kenya':         { low: 60,   high: 160  },
    'uganda':        { low: 80,   high: 180  },
    'rwanda':        { low: 100,  high: 220  },
    'zambia':        { low: 150,  high: 320  },
    'other-africa':  { low: 150,  high: 420  },
    // Europe
    'uk':            { low: 650,  high: 1100 },
    'netherlands':   { low: 580,  high: 950  },
    'france':        { low: 600,  high: 980  },
    'germany':       { low: 620,  high: 1000 },
    'spain':         { low: 650,  high: 1050 },
    'italy':         { low: 640,  high: 1020 },
    'portugal':      { low: 660,  high: 1080 },
    'belgium':       { low: 590,  high: 960  },
    'sweden':        { low: 620,  high: 1010 },
    'norway':        { low: 640,  high: 1040 },
    'denmark':       { low: 610,  high: 990  },
    'other-europe':  { low: 600,  high: 1050 },
    // Middle East
    'uae':           { low: 180,  high: 380  },
    'qatar':         { low: 180,  high: 360  },
    'saudi':         { low: 200,  high: 400  },
    'other-me':      { low: 200,  high: 420  },
    // Americas
    'usa':           { low: 900,  high: 1500 },
    'canada':        { low: 950,  high: 1600 },
    'other-americas':{ low: 1000, high: 1700 },
    // Asia / Oceania
    'china':         { low: 700,  high: 1200 },
    'india':         { low: 500,  high: 900  },
    'japan':         { low: 900,  high: 1500 },
    'australia':     { low: 1000, high: 1700 },
    'other-asia':    { low: 800,  high: 1400 }
  };

  var TICKETS = { // per ticket, per match
    'group':   { low: 10,  high: 45  },
    'quarters':{ low: 20,  high: 65  },
    'semis':   { low: 22,  high: 80  },
    'final':   { low: 30,  high: 120 },
    'mix':     { low: 15,  high: 60  }
  };

  var HOTELS = { // per night
    'budget':   { low: 16,  high: 45  },
    'midrange': { low: 60,  high: 130 },
    'upscale':  { low: 130, high: 210 },
    'luxury':   { low: 200, high: 420 }
  };

  var DAILY = { // food + transport per day
    'budget':    { low: 15, high: 30 },
    'standard':  { low: 35, high: 65 },
    'comfortable':{ low: 70, high: 130 }
  };

  var CITY_MULT = {
    'dar':      1.0,
    'arusha':   1.0,
    'zanzibar': 1.1,
    'multiple': 1.2  // extra for inter-city transport
  };

  var USD_TZS = 3800; // approx August 2026

  var HOTEL_LINKS = {
    'dar':      '/where-to-stay-dar-es-salaam-afcon-2027',
    'arusha':   '/afcon-2027-arusha',
    'zanzibar': '/where-to-stay-zanzibar-afcon-2027',
    'multiple': '/where-to-stay-dar-es-salaam-afcon-2027'
  };

  var ORIGIN_FLAGS = {
    'nigeria':'🇳🇬','ghana':'🇬🇭','ivory-coast':'🇨🇮','senegal':'🇸🇳','cameroon':'🇨🇲',
    'algeria':'🇩🇿','morocco':'🇲🇦','egypt':'🇪🇬','tunisia':'🇹🇳','south-africa':'🇿🇦',
    'ethiopia':'🇪🇹','kenya':'🇰🇪','uganda':'🇺🇬','rwanda':'🇷🇼','zambia':'🇿🇲',
    'other-africa':'🌍','uk':'🇬🇧','netherlands':'🇳🇱','france':'🇫🇷','germany':'🇩🇪',
    'spain':'🇪🇸','italy':'🇮🇹','portugal':'🇵🇹','belgium':'🇧🇪','sweden':'🇸🇪',
    'norway':'🇳🇴','denmark':'🇩🇰','other-europe':'🇪🇺','uae':'🇦🇪','qatar':'🇶🇦',
    'saudi':'🇸🇦','other-me':'🌙','usa':'🇺🇸','canada':'🇨🇦','other-americas':'🌎',
    'china':'🇨🇳','india':'🇮🇳','japan':'🇯🇵','australia':'🇦🇺','other-asia':'🌏'
  };

  // ── STATE ──────────────────────────────────────────────────────────────────
  var state = {
    step: 1,
    answers: {}
  };

  var totalSteps = 7;

  // ── INIT ───────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    var el = document.getElementById('afcon-budget');
    if (!el) return;
    updateProgress();
    bindOptions();
    bindReset();
    bindShare();
  });

  // ── NAVIGATION ─────────────────────────────────────────────────────────────
  function goToStep(n) {
    // Hide current
    var current = document.querySelector('.afcon-budget__step.active');
    if (current) current.classList.remove('active');

    if (n > totalSteps) {
      showResult();
      return;
    }

    state.step = n;
    var next = document.querySelector('.afcon-budget__step[data-step="' + n + '"]');
    if (next) next.classList.add('active');
    updateProgress();
    updateIndicator();
  }

  function updateProgress() {
    var fill = document.getElementById('budget-progress');
    if (fill) fill.style.width = ((state.step / totalSteps) * 100) + '%';
  }

  function updateIndicator() {
    var ind = document.getElementById('budget-step-indicator');
    if (ind) ind.textContent = 'Step ' + state.step + ' of ' + totalSteps;
  }

  // ── OPTION BINDING ─────────────────────────────────────────────────────────
  function bindOptions() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.afcon-budget__option');
      if (!btn) return;

      var key   = btn.getAttribute('data-key');
      var value = btn.getAttribute('data-value');
      var step  = parseInt(btn.closest('.afcon-budget__step').getAttribute('data-step'));

      // Deselect siblings
      var siblings = btn.closest('.afcon-budget__options').querySelectorAll('.afcon-budget__option');
      siblings.forEach(function (s) { s.classList.remove('selected'); });
      btn.classList.add('selected');

      state.answers[key] = value;

      // Auto-advance after brief delay
      setTimeout(function () { goToStep(step + 1); }, 280);
    });
  }

  // ── RESULT ─────────────────────────────────────────────────────────────────
  function showResult() {
    var a = state.answers;

    // Flights
    var fl = FLIGHTS[a.origin] || FLIGHTS['other-africa'];

    // Tickets
    var tk = TICKETS[a.matchtype] || TICKETS['group'];
    var matches = parseInt(a.matches) || 1;
    var tkLow  = tk.low  * matches;
    var tkHigh = tk.high * matches;

    // Hotel
    var ht = HOTELS[a.hotel] || HOTELS['midrange'];
    var nights = parseInt(a.nights) || 5;
    var htLow  = ht.low  * nights;
    var htHigh = ht.high * nights;

    // Daily (food + transport)
    var dl = DAILY[a.style] || DAILY['standard'];
    var dlLow  = dl.low  * nights;
    var dlHigh = dl.high * nights;

    // City multiplier
    var mult = CITY_MULT[a.city] || 1.0;
    var intraCityLow = 0, intraCityHigh = 0;
    if (a.city === 'multiple') { intraCityLow = 80; intraCityHigh = 180; }
    if (a.city === 'zanzibar') { intraCityLow = 20; intraCityHigh = 60; }

    // Buffer (10%)
    var subLow  = (fl.low  + tkLow  + htLow  + dlLow  + intraCityLow);
    var subHigh = (fl.high + tkHigh + htHigh + dlHigh + intraCityHigh);
    var bufLow  = Math.round(subLow  * 0.1);
    var bufHigh = Math.round(subHigh * 0.1);

    var totalLow  = Math.round(subLow  + bufLow);
    var totalHigh = Math.round(subHigh + bufHigh);

    // Apply city mult to non-flight costs
    var adjLow  = Math.round(fl.low  + (totalLow  - fl.low)  * mult);
    var adjHigh = Math.round(fl.high + (totalHigh - fl.high) * mult);

    // TZS
    var tzsLow  = Math.round(adjLow  * USD_TZS / 1000) * 1000;
    var tzsHigh = Math.round(adjHigh * USD_TZS / 1000) * 1000;

    // Render
    document.getElementById('result-flag').textContent = ORIGIN_FLAGS[a.origin] || '🌍';
    document.getElementById('result-range').textContent =
      '$' + fmt(adjLow) + ' – $' + fmt(adjHigh) + ' USD  ·  ' +
      fmtTZS(tzsLow) + ' – ' + fmtTZS(tzsHigh) + ' TZS';

    var bd = document.getElementById('result-breakdown');
    bd.innerHTML = row('✈️', 'Return flights', fl.low, fl.high) +
      row('🎟️', 'Match tickets (' + matches + ' match' + (matches > 1 ? 'es' : '') + ')', tkLow, tkHigh) +
      row('🏨', 'Accommodation (' + nights + ' nights)', htLow, htHigh) +
      row('🍽️', 'Food &amp; local transport', dlLow, dlHigh) +
      (intraCityHigh > 0 ? row('🚌', 'Inter-city travel', intraCityLow, intraCityHigh) : '') +
      row('🛡️', 'Contingency buffer (10%)', bufLow, bufHigh) +
      totalRow(adjLow, adjHigh, tzsLow, tzsHigh);

    document.getElementById('result-note').innerHTML =
      '⚠️ All figures are estimates based on 2025–2026 pricing. Flights and accommodation for AFCON 2027 ' +
      'will be significantly higher than off-peak rates — book early to secure the best prices. ' +
      'Ticket prices are expected based on AFCON 2025 precedent and subject to official CAF announcement.';

    // Update hotel link
    var hotelLink = document.getElementById('result-hotel-link');
    if (hotelLink) hotelLink.href = HOTEL_LINKS[a.city] || HOTEL_LINKS['dar'];

    // Store for share
    window._afconBudgetResult = {
      low: adjLow, high: adjHigh, origin: a.origin, city: a.city
    };

    document.getElementById('budget-steps').style.display = 'none';
    document.getElementById('budget-result').style.display = 'block';
    document.getElementById('budget-progress').style.width = '100%';
    document.getElementById('budget-step-indicator').textContent = 'Estimate complete ✓';
  }

  function row(icon, label, low, high) {
    return '<div class="afcon-budget__breakdown-row">' +
      '<span class="afcon-budget__breakdown-icon">' + icon + '</span>' +
      '<span class="afcon-budget__breakdown-label">' + label + '</span>' +
      '<span class="afcon-budget__breakdown-range">$' + fmt(low) + ' – $' + fmt(high) + '</span>' +
      '</div>';
  }

  function totalRow(usdLow, usdHigh, tzsLow, tzsHigh) {
    return '<div class="afcon-budget__breakdown-row afcon-budget__breakdown-row--total">' +
      '<span class="afcon-budget__breakdown-icon">💰</span>' +
      '<span class="afcon-budget__breakdown-label">Total estimated budget</span>' +
      '<span class="afcon-budget__breakdown-range">$' + fmt(usdLow) + ' – $' + fmt(usdHigh) +
      '<br><span style="font-size:11px;font-weight:500;color:#666">' +
      fmtTZS(tzsLow) + ' – ' + fmtTZS(tzsHigh) + ' TZS</span></span>' +
      '</div>';
  }

  function fmt(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function fmtTZS(n) {
    return (n / 1000000 >= 1)
      ? (n / 1000000).toFixed(1) + 'M'
      : (n / 1000).toFixed(0) + 'K';
  }

  // ── RESET ──────────────────────────────────────────────────────────────────
  function bindReset() {
    document.addEventListener('click', function (e) {
      if (e.target.id !== 'budget-reset') return;
      state = { step: 1, answers: {} };
      document.querySelectorAll('.afcon-budget__option').forEach(function (b) { b.classList.remove('selected'); });
      document.getElementById('budget-steps').style.display = '';
      document.getElementById('budget-result').style.display = 'none';
      goToStep(1);
    });
  }

  // ── SHARE ──────────────────────────────────────────────────────────────────
  function bindShare() {
    document.addEventListener('click', function (e) {
      if (e.target.id !== 'budget-share-twitter') return;
      var r = window._afconBudgetResult;
      if (!r) return;
      var text = 'My AFCON 2027 trip budget estimate: $' + fmt(r.low) + ' – $' + fmt(r.high) + ' USD 💰\n\nFlying to Tanzania for the tournament? Calculate yours 👇\nafcontanzaniaguide.com/afcon-2027-budget-calculator\n\n#AFCON2027 #Tanzania #PAMOJA2027';
      window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text), '_blank');
    });
  }

})();
