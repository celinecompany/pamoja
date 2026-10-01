(function () {
  'use strict';

  var STADIUMS = [
    {
      id: 'mkapa',
      name: 'Benjamin Mkapa National Stadium',
      city: 'Dar es Salaam',
      country: 'TZ',
      flag: '🇹🇿',
      lat: -6.8536,
      lng: 39.2738,
      capacity: 60000,
      role: 'Group stage · Semi-final · Final candidate',
      roleBadge: 'semi',
      roleLabel: 'Semi-final venue',
      note: 'CAF-accredited · Guaranteed semi-final',
      airport: '10km from JNIA (DAR)',
      link: '/where-to-stay-dar-es-salaam-afcon-2027',
      linkLabel: 'Dar es Salaam guide →'
    },
    {
      id: 'samia',
      name: 'Samia Suluhu Hassan Stadium',
      city: 'Arusha',
      country: 'TZ',
      flag: '🇹🇿',
      lat: -3.3869,
      lng: 36.6823,
      capacity: 32000,
      role: 'Group stage',
      roleBadge: 'group',
      roleLabel: 'Group stage',
      note: '$112M · New build · Tanzanite-inspired design',
      airport: '50km from Kilimanjaro Airport (JRO)',
      link: '/afcon-2027-arusha',
      linkLabel: 'Arusha fan guide →'
    },
    {
      id: 'fumba',
      name: 'Fumba City Stadium',
      city: 'Zanzibar',
      country: 'TZ',
      flag: '🇹🇿',
      lat: -6.3150,
      lng: 39.2800,
      capacity: 36500,
      role: 'Group stage',
      roleBadge: 'group',
      roleLabel: 'Group stage',
      note: 'New coastal stadium · ORKUN Group (Turkey)',
      airport: '25km from Zanzibar Airport (ZNZ)',
      link: '/where-to-stay-zanzibar-afcon-2027',
      linkLabel: 'Zanzibar fan guide →'
    },
    {
      id: 'amaan',
      name: 'New Amaan Sports Complex',
      city: 'Zanzibar City',
      country: 'TZ',
      flag: '🇹🇿',
      lat: -6.1659,
      lng: 39.1989,
      capacity: 15000,
      role: 'Group stage',
      roleBadge: 'group',
      roleLabel: 'Group stage',
      note: 'Stone Town area · UNESCO setting',
      airport: '10km from Zanzibar Airport (ZNZ)',
      link: '/where-to-stay-zanzibar-afcon-2027',
      linkLabel: 'Zanzibar fan guide →'
    },
    {
      id: 'talanta',
      name: 'Talanta Stadium',
      city: 'Nairobi',
      country: 'KE',
      flag: '🇰🇪',
      lat: -1.3061,
      lng: 36.7503,
      capacity: 60000,
      role: 'Group stage · Semi-final candidate',
      roleBadge: 'semi',
      roleLabel: 'Semi-final candidate',
      note: 'Raila Odinga International Stadium · New build',
      airport: '15km from JKIA (NBO)',
      link: '/nairobi-to-tanzania-afcon-2027',
      linkLabel: 'Nairobi travel guide →'
    },
    {
      id: 'kasarani',
      name: 'Moi International Sports Centre',
      city: 'Nairobi',
      country: 'KE',
      flag: '🇰🇪',
      lat: -1.2281,
      lng: 36.8906,
      capacity: 48000,
      role: 'Group stage',
      roleBadge: 'group',
      roleLabel: 'Group stage',
      note: 'Kasarani · Kenya\'s historic national stadium',
      airport: '18km from JKIA (NBO)',
      link: '/nairobi-to-tanzania-afcon-2027',
      linkLabel: 'Nairobi travel guide →'
    },
    {
      id: 'mandela',
      name: 'Mandela National Stadium',
      city: 'Kampala',
      country: 'UG',
      flag: '🇺🇬',
      lat: 0.3478,
      lng: 32.6592,
      capacity: 45000,
      role: 'Group stage',
      roleBadge: 'group',
      roleLabel: 'Group stage',
      note: 'Namboole · Uganda\'s flagship stadium',
      airport: '20km from Entebbe Airport (EBB)',
      link: '/afcon-2027-dates-host-countries-schedule',
      linkLabel: 'Tournament guide →'
    }
  ];

  var map, markers = {}, activeId = null;

  function countryClass(c) {
    return c === 'TZ' ? 'tz' : c === 'KE' ? 'ke' : 'ug';
  }

  function badgeClass(b) {
    if (b === 'final') return 'afcon-badge-final';
    if (b === 'semi') return 'afcon-badge-semi';
    return 'afcon-badge-group';
  }

  function countryBadge(c) {
    if (c === 'TZ') return '<span class="afcon-stadium-badge afcon-badge-tz">🇹🇿 Tanzania</span>';
    if (c === 'KE') return '<span class="afcon-stadium-badge afcon-badge-ke">🇰🇪 Kenya</span>';
    return '<span class="afcon-stadium-badge afcon-badge-ug">🇺🇬 Uganda</span>';
  }

  function createIcon(stadium, active) {
    var cc = countryClass(stadium.country);
    return L.divIcon({
      className: 'afcon-marker',
      html: '<div class="afcon-marker-pin ' + cc + (active ? ' pulsing' : '') + '"><span class="afcon-marker-inner">🏟</span></div><div class="afcon-marker-shadow"></div>',
      iconSize: [36, 44],
      iconAnchor: [18, 44],
      popupAnchor: [0, -44]
    });
  }

  function directionsUrl(s) {
    // Universal Google Maps directions URL — works on Android, iOS and desktop
    // Uses current location as origin, stadium coordinates as destination
    return 'https://www.google.com/maps/dir/?api=1&destination=' + s.lat + ',' + s.lng + '&destination_place_id=' + encodeURIComponent(s.name + ', ' + s.city) + '&travelmode=driving';
  }

  function buildPanel(s) {
    return '<div class="afcon-stadium-card">' +
      '<div class="afcon-stadium-card-left">' +
        '<p class="afcon-stadium-name">' + s.flag + ' ' + s.name + '</p>' +
        '<p class="afcon-stadium-city">📍 ' + s.city + '</p>' +
        '<div class="afcon-stadium-meta">' +
          countryBadge(s.country) +
          '<span class="afcon-stadium-badge ' + badgeClass(s.roleBadge) + '">' + s.roleLabel + '</span>' +
        '</div>' +
        '<p style="font-size:12px;color:#555;margin:0 0 4px">' + s.note + '</p>' +
        '<p style="font-size:11px;color:#888;margin:0 0 8px">✈️ ' + s.airport + '</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
          '<a href="' + directionsUrl(s) + '" target="_blank" rel="noopener" class="afcon-directions-btn" aria-label="Get directions to ' + s.name + ' in Google Maps">📍 Get directions</a>' +
          '<a href="' + s.link + '" class="afcon-stadium-link">' + s.linkLabel + '</a>' +
        '</div>' +
      '</div>' +
      '<div class="afcon-stadium-card-right">' +
        '<span class="afcon-stadium-cap">' + s.capacity.toLocaleString() + '</span>' +
        '<span class="afcon-stadium-cap-label" style="display:block;font-size:10px;color:#888">capacity</span>' +
      '</div>' +
    '</div>';
  }

  function activateMarker(id) {
    // Reset previous
    if (activeId && markers[activeId]) {
      var prev = STADIUMS.find(function(s){ return s.id === activeId; });
      if (prev) markers[activeId].setIcon(createIcon(prev, false));
    }
    activeId = id;
    var s = STADIUMS.find(function(s){ return s.id === id; });
    if (!s || !markers[id]) return;
    markers[id].setIcon(createIcon(s, true));

    // Update panel
    var panel = document.getElementById('afcon-map-panel');
    if (panel) panel.innerHTML = buildPanel(s);
  }

  function initMap() {
    var el = document.getElementById('afcon-leaflet-map');
    if (!el || typeof L === 'undefined') return;

    map = L.map('afcon-leaflet-map', {
      center: [-2.5, 35.5],
      zoom: 5,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false
    });

    // Tile layer — OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18
    }).addTo(map);

    // Add markers
    STADIUMS.forEach(function(s) {
      var icon = createIcon(s, false);
      var popup = L.popup({ offset: [0, -40], maxWidth: 240 }).setContent(
        '<div class="afcon-popup">' +
          '<p class="afcon-popup-name">' + s.flag + ' ' + s.name + '</p>' +
          '<p class="afcon-popup-city">' + s.city + ' · ' + s.roleLabel + '</p>' +
          '<p class="afcon-popup-cap">' + s.capacity.toLocaleString() + ' capacity</p>' +
        '</div>'
      );
      var m = L.marker([s.lat, s.lng], { icon: icon })
        .addTo(map)
        .bindPopup(popup);

      m.on('click', function() {
        activateMarker(s.id);
      });

      markers[s.id] = m;
    });

    // Filter tabs
    var filters = document.querySelectorAll('.afcon-map-filter');
    filters.forEach(function(btn) {
      btn.addEventListener('click', function() {
        filters.forEach(function(b) {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        var country = btn.getAttribute('data-country');
        var bounds = [];

        STADIUMS.forEach(function(s) {
          var show = country === 'all' || s.country === country;
          if (show) {
            if (!map.hasLayer(markers[s.id])) markers[s.id].addTo(map);
            bounds.push([s.lat, s.lng]);
          } else {
            if (map.hasLayer(markers[s.id])) map.removeLayer(markers[s.id]);
          }
        });

        if (bounds.length > 0) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
  } else {
    initMap();
  }

})();
