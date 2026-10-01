(() => {
  'use strict';

  const venues = [
    { id: 'talanta', name: 'Talanta Sports Stadium', city: 'Nairobi', country: 'KE', capacity: 60000, position: [-1.3061, 36.7503], detail: 'Listed as the venue for the opening ceremony and match.' },
    { id: 'kasarani', name: 'Moi International Sports Centre (Kasarani)', city: 'Nairobi', country: 'KE', capacity: 60000, position: [-1.2281, 36.8906], detail: 'Multi-tier stadium with premium and category seating.' },
    { id: 'nyayo', name: 'Nyayo National Stadium', city: 'Nairobi', country: 'KE', capacity: 30000, position: [-1.3024, 36.8294], detail: 'Historic Nairobi venue listed for group-stage fixtures.' },
    { id: 'mkapa', name: 'Benjamin Mkapa Stadium', city: 'Dar es Salaam', country: 'TZ', capacity: 60000, position: [-6.8536, 39.2738], detail: 'Listed as a host venue in the project venue guide.' },
    { id: 'samia', name: 'Samia Suluhu Hassan Stadium', city: 'Arusha', country: 'TZ', capacity: 30000, position: [-3.3869, 36.6823], detail: 'Listed as a host venue in the project venue guide.' },
    { id: 'amaan', name: 'Amaan Complex', city: 'Zanzibar City', country: 'TZ', capacity: 15000, position: [-6.1659, 39.1989], detail: 'Listed for group-stage matches in the project venue guide.' },
    { id: 'mandela', name: 'Mandela National Stadium (Namboole)', city: 'Kampala', country: 'UG', capacity: 45000, position: [0.3478, 32.6592], detail: 'Uganda national stadium listed for tournament matches.' },
    { id: 'hoima', name: 'Hoima City Stadium', city: 'Hoima', country: 'UG', capacity: 20000, position: [1.4310, 31.3524], detail: 'Listed as a host venue in the project venue guide.' },
    { id: 'akii-bua', name: 'Akii-Bua Olympic Stadium', city: 'Lira', country: 'UG', capacity: 20000, position: [2.2499, 32.8998], detail: 'Listed as a northern Uganda tournament venue.' }
  ];

  const countryNames = { KE: 'Kenya', TZ: 'Tanzania', UG: 'Uganda' };
  const list = document.getElementById('venue-list');
  const detailPanel = document.getElementById('venue-detail-panel');
  const mapElement = document.getElementById('venue-leaflet-map');
  if (!list || !detailPanel || !mapElement || typeof L === 'undefined') return;

  const map = L.map(mapElement, { scrollWheelZoom: false }).setView([-2.5, 35.5], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }).addTo(map);

  const markers = new Map();
  let activeCountry = 'all';
  let activeVenueId = null;

  function createIcon(country) {
    const icon = L.divIcon({
      className: '',
      html: `<span class="venue-map-marker venue-map-marker-${country.toLowerCase()}">${country}</span>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    return icon;
  }

  function buildPopup(venue) {
    const content = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = venue.name;
    const location = document.createElement('div');
    location.textContent = `${venue.city}, ${countryNames[venue.country]}`;
    const capacity = document.createElement('div');
    capacity.textContent = `${venue.capacity.toLocaleString()} listed capacity`;
    content.append(name, location, capacity);
    return content;
  }

  function showVenue(venue) {
    activeVenueId = venue.id;
    const copy = document.createElement('div');
    copy.className = 'venue-detail-copy';
    const name = document.createElement('strong');
    name.textContent = venue.name;
    const location = document.createElement('span');
    location.textContent = `${venue.city}, ${countryNames[venue.country]} · ${venue.capacity.toLocaleString()} listed capacity`;
    const description = document.createElement('p');
    description.textContent = venue.detail;
    description.style.margin = '.35rem 0 0';
    copy.append(name, location, description);

    const directions = document.createElement('a');
    directions.className = 'venue-directions';
    directions.target = '_blank';
    directions.rel = 'noopener noreferrer';
    directions.href = `https://www.google.com/maps/dir/?api=1&destination=${venue.position[0]},${venue.position[1]}`;
    directions.textContent = 'Open directions';
    directions.setAttribute('aria-label', `Open directions to ${venue.name}`);
    detailPanel.replaceChildren(copy, directions);

    list.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-current', String(button.dataset.venueId === venue.id));
    });
    const marker = markers.get(venue.id);
    if (marker) marker.openPopup();
  }

  function renderVenues() {
    const visible = venues.filter(venue => activeCountry === 'all' || venue.country === activeCountry);
    list.replaceChildren();
    visible.forEach(venue => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.venueId = venue.id;
      button.setAttribute('aria-current', String(activeVenueId === venue.id));
      const name = document.createElement('strong');
      name.textContent = venue.name;
      const meta = document.createElement('span');
      meta.textContent = `${venue.city}, ${countryNames[venue.country]} · ${venue.capacity.toLocaleString()}`;
      button.append(name, meta);
      button.addEventListener('click', () => {
        map.setView(venue.position, 10);
        showVenue(venue);
      });
      list.appendChild(button);
    });

    venues.forEach(venue => {
      const marker = markers.get(venue.id);
      if (activeCountry === 'all' || venue.country === activeCountry) {
        if (!map.hasLayer(marker)) marker.addTo(map);
      } else if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });

    const points = visible.map(venue => venue.position);
    if (points.length > 1) map.fitBounds(points, { padding: [28, 28], maxZoom: 7 });
    else if (points.length === 1) map.setView(points[0], 8);

    activeVenueId = null;
    detailPanel.textContent = `${visible.length} ${visible.length === 1 ? 'venue' : 'venues'} shown. Select a venue for details and directions.`;
  }

  venues.forEach(venue => {
    const marker = L.marker(venue.position, { icon: createIcon(venue.country) })
      .bindPopup(buildPopup(venue))
      .addTo(map);
    marker.on('click', () => showVenue(venue));
    markers.set(venue.id, marker);
  });

  document.querySelectorAll('[data-venue-country]').forEach(button => {
    button.addEventListener('click', () => {
      activeCountry = button.dataset.venueCountry;
      document.querySelectorAll('[data-venue-country]').forEach(filter => {
        filter.setAttribute('aria-pressed', String(filter === button));
      });
      renderVenues();
    });
  });

  renderVenues();
  window.addEventListener('resize', () => map.invalidateSize());
})();
