/**
 * AFCON PAMOJA
 * Match-specific ticket selection
 *
 * Flow:
 *
 * index.html
 *     ↓
 * tickets.html?match=m1
 *     ↓
 * venue configuration
 *     ↓
 * individual seat selection
 *     ↓
 * ticket summary
 *     ↓
 * checkout review
 *
 * This is currently a front-end ticketing experience.
 * Actual payment processing / server-side inventory locking
 * should be connected before production use.
 */

(() => {
  'use strict';


  /* ==========================================================
     Data
  ========================================================== */

  const data = window.TICKETING_DATA;

  if (!data) {
    console.error(
      'TICKETING_DATA was not loaded.'
    );

    return;
  }


  /* ==========================================================
     URL
  ========================================================== */

  const params =
    new URLSearchParams(window.location.search);

  const matchId =
    params.get('match');


  const match =
    window.getMatch(matchId);


  const venue =
    window.getVenue(match);


  /* ==========================================================
     DOM
  ========================================================== */

  const els = {

    matchStage:
      document.getElementById('match-stage'),

    matchTitle:
      document.getElementById('match-title'),

    matchMeta:
      document.getElementById('match-meta'),

    venueName:
      document.getElementById('venue-name'),

    venueCity:
      document.getElementById('venue-city'),

    venueDescription:
      document.getElementById('venue-description'),

    venueCapacity:
      document.getElementById('venue-capacity'),

    stadium:
      document.getElementById('stadium'),

    selectedSeatsPreview:
      document.getElementById('selected-seats-preview'),

    selectedSeatChips:
      document.getElementById('selected-seat-chips'),

    selectedCount:
      document.getElementById('selected-count'),

    summaryTeams:
      document.getElementById('summary-teams'),

    summaryDate:
      document.getElementById('summary-date'),

    summaryVenue:
      document.getElementById('summary-venue'),

    ticketLines:
      document.getElementById('ticket-lines'),

    subtotal:
      document.getElementById('subtotal'),

    serviceFee:
      document.getElementById('service-fee'),

    total:
      document.getElementById('total'),

    checkoutButton:
      document.getElementById('checkout-button'),

    categoryList:
      document.getElementById('category-list'),

    checkoutModal:
      document.getElementById('checkout-modal'),

    closeCheckout:
      document.getElementById('close-checkout'),

    cancelCheckout:
      document.getElementById('cancel-checkout'),

    confirmCheckout:
      document.getElementById('confirm-checkout'),

    checkoutReview:
      document.getElementById('checkout-review'),

    checkoutTotal:
      document.getElementById('checkout-total'),

    invalidMatch:
      document.getElementById('invalid-match')
  };


  /* ==========================================================
     Invalid match
  ========================================================== */

  if (!match || !venue) {

    els.invalidMatch.classList.remove('hidden');

    return;
  }


  /* ==========================================================
     State
  ========================================================== */

  const state = {

    selectedSeats: new Map(),

    unavailableSeats: new Set(),

    seatRegistry: new Map()

  };


  /* ==========================================================
     Utility functions
  ========================================================== */

  function money(value) {

    return window.money(value);

  }


  function escapeHtml(value) {

    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  }


  function teamName(value) {

    return String(value || '')
      .replace(
        /(\p{Extended_Pictographic}.*)$/u,
        ''
      )
      .trim();

  }


  function seatKey(
    standKey,
    sectionNumber,
    rowNumber,
    seatNumber
  ) {

    return [
      standKey,
      sectionNumber,
      rowNumber,
      seatNumber
    ].join('-');

  }


  function seatLabel(
    stand,
    sectionNumber,
    rowNumber,
    seatNumber
  ) {

    const section =
      String(sectionNumber).padStart(2, '0');

    const row =
      String.fromCharCode(
        64 + rowNumber
      );

    return `${stand.key.toUpperCase()}-${section}-${row}-${seatNumber}`;

  }


  function deterministicOccupied(
    standIndex,
    sectionIndex,
    rowIndex,
    seatIndex
  ) {

    /*
     * Deterministic front-end availability simulation.
     *
     * This means refreshes do not randomly change the map.
     *
     * Production inventory should come from a backend.
     */

    const score =
      (
        (standIndex + 1) * 17 +
        (sectionIndex + 1) * 11 +
        (rowIndex + 1) * 7 +
        (seatIndex + 1) * 5
      ) % 97;


    /*
     * Different availability pressure per fixture.
     */

    let threshold = 8;

    if (match.id === 'm1') {
      threshold = 10;
    }

    if (match.id === 'm2') {
      threshold = 28;
    }

    if (match.id === 'm3') {
      threshold = 17;
    }

    return score < threshold;

  }


  function categoryClass(stand) {

    if (
      stand.tier.toLowerCase().includes('vip') ||
      stand.tier.toLowerCase().includes('category 1')
    ) {
      return 'vip';
    }

    return '';

  }


  /* ==========================================================
     Match header
  ========================================================== */

  function renderMatchHeader() {

    document.title =
      `${teamName(match.home)} vs ${teamName(match.away)} | AFCON PAMOJA 2026`;


    els.matchStage.textContent =
      match.stage;


    els.matchTitle.textContent =
      `${match.home} vs ${match.away}`;


    els.matchMeta.innerHTML = `
      <span>${escapeHtml(match.date)}</span>
      <span>${escapeHtml(match.time)}</span>
    `;


    els.venueName.textContent =
      venue.name;


    els.venueCity.textContent =
      venue.city;


    els.venueDescription.textContent =
      venue.description;


    els.venueCapacity.textContent =
      `${Number(venue.capacity).toLocaleString()} capacity`;


    els.summaryTeams.textContent =
      `${teamName(match.home)} vs ${teamName(match.away)}`;


    els.summaryDate.textContent =
      `${match.date} · ${match.time}`;


    els.summaryVenue.textContent =
      venue.name;

  }


  /* ==========================================================
     Category pricing
  ========================================================== */

  function renderCategoryPricing() {

    els.categoryList.innerHTML =
      venue.stands.map(stand => {

        return `
          <div class="category-row">

            <div class="category-info">

              <span class="category-dot"></span>

              <span class="category-name">
                ${escapeHtml(stand.name)}
                ·
                ${escapeHtml(stand.tier)}
              </span>

            </div>

            <span class="category-price">
              ${money(stand.price)}
            </span>

          </div>
        `;

      }).join('');

  }


  /* ==========================================================
     Stadium
  ========================================================== */

  function renderStadium() {

    els.stadium.dataset.layout =
      venue.layout;


    state.seatRegistry.clear();
    state.unavailableSeats.clear();


    const standElements = {

      north:
        document.getElementById('stand-north'),

      east:
        document.getElementById('stand-east'),

      south:
        document.getElementById('stand-south'),

      west:
        document.getElementById('stand-west')

    };


    venue.stands.forEach(
      (stand, standIndex) => {

        const container =
          standElements[stand.key];


        if (!container) {
          return;
        }


        container.innerHTML = '';


        const sectionWidth =
          Math.max(
            1,
            Math.min(
              8,
              Math.ceil(
                stand.sections / 2
              )
            )
          );


        for (
          let sectionIndex = 0;
          sectionIndex < stand.sections;
          sectionIndex++
        ) {

          const section =
            document.createElement('div');


          section.className =
            'stand-section';


          section.style.setProperty(
            '--section-columns',
            Math.min(
              stand.seatsPerRow,
              20
            )
          );


          section.style.gridTemplateRows =
            `repeat(${stand.rows}, minmax(0, 1fr))`;


          /*
           * On north/south, divide sections across
           * the available width.
           *
           * On east/west, the same sections are
           * visually stacked by the browser.
           */

          if (
            stand.key === 'north' ||
            stand.key === 'south'
          ) {

            section.style.width =
              `${100 / sectionWidth}%`;

          } else {

            section.style.width =
              `${100 / Math.min(stand.sections, 8)}%`;

          }


          const label =
            document.createElement('span');


          label.className =
            'section-label';


          label.textContent =
            `${stand.key.toUpperCase()} ${String(sectionIndex + 1).padStart(2, '0')}`;


          section.appendChild(label);


          /*
           * Generate actual individual seats.
           */

          for (
            let rowIndex = 0;
            rowIndex < stand.rows;
            rowIndex++
          ) {

            for (
              let seatIndex = 0;
              seatIndex < stand.seatsPerRow;
              seatIndex++
            ) {

              const seat =
                document.createElement('button');


              const key =
                seatKey(
                  stand.key,
                  sectionIndex + 1,
                  rowIndex + 1,
                  seatIndex + 1
                );


              const labelValue =
                seatLabel(
                  stand,
                  sectionIndex + 1,
                  rowIndex + 1,
                  seatIndex + 1
                );


              const occupied =
                deterministicOccupied(
                  standIndex,
                  sectionIndex,
                  rowIndex,
                  seatIndex
                );


              seat.type = 'button';

              seat.className = 'seat';

              seat.dataset.key = key;

              seat.dataset.stand =
                stand.key;

              seat.dataset.section =
                sectionIndex + 1;

              seat.dataset.row =
                rowIndex + 1;

              seat.dataset.number =
                seatIndex + 1;

              seat.dataset.category =
                stand.tier;

              seat.dataset.price =
                stand.price;

              seat.setAttribute(
                'aria-label',
                `${labelValue}, ${stand.tier}, ${money(stand.price)}`
              );


              if (
                categoryClass(stand)
              ) {

                seat.classList.add('vip');

              }


              if (occupied) {

                seat.disabled = true;

                seat.classList.add('occupied');

                state.unavailableSeats.add(key);

              }


              seat.addEventListener(
                'click',
                () => toggleSeat(
                  seat,
                  stand,
                  labelValue
                )
              );


              state.seatRegistry.set(
                key,
                {
                  key,
                  label: labelValue,
                  stand: stand.name,
                  tier: stand.tier,
                  price: Number(stand.price),
                  element: seat
                }
              );


              section.appendChild(seat);

            }

          }


          container.appendChild(section);

        }

      }
    );

  }


  /* ==========================================================
     Seat selection
  ========================================================== */

  function toggleSeat(
    seatElement,
    stand,
    label
  ) {

    const key =
      seatElement.dataset.key;


    if (
      state.unavailableSeats.has(key)
    ) {

      return;
    }


    if (
      state.selectedSeats.has(key)
    ) {

      state.selectedSeats.delete(key);

      seatElement.classList.remove('selected');

    } else {

      /*
       * Keep the cart deliberately bounded.
       * This avoids accidental massive selections while
       * still allowing normal group purchases.
       */

      if (
        state.selectedSeats.size >= 8
      ) {

        window.alert(
          'You can select up to 8 seats per order.'
        );

        return;
      }


      const registrySeat =
        state.seatRegistry.get(key);


      state.selectedSeats.set(
        key,
        registrySeat
      );


      seatElement.classList.add(
        'selected'
      );

    }


    updateSummary();

  }


  /* ==========================================================
     Summary
  ========================================================== */

  function calculateTotals() {

    const selected =
      Array.from(
        state.selectedSeats.values()
      );


    const subtotal =
      selected.reduce(
        (sum, seat) =>
          sum + Number(seat.price),
        0
      );


    const serviceFee =
      Math.round(
        subtotal * Number(data.serviceLevyRate || 0)
      );


    const total =
      subtotal + serviceFee;


    return {
      selected,
      subtotal,
      serviceFee,
      total
    };

  }


  function updateSummary() {

    const {
      selected,
      subtotal,
      serviceFee,
      total
    } = calculateTotals();


    els.selectedCount.textContent =
      selected.length;


    els.subtotal.textContent =
      money(subtotal);


    els.serviceFee.textContent =
      money(serviceFee);


    els.total.textContent =
      money(total);


    els.checkoutButton.disabled =
      selected.length === 0;


    renderTicketLines(selected);

    renderSelectedChips(selected);

  }


  function renderTicketLines(selected) {

    if (!selected.length) {

      els.ticketLines.innerHTML = `
        <div class="empty-summary">
          Select a seat to add a ticket.
        </div>
      `;

      return;
    }


    els.ticketLines.innerHTML =
      selected.map(seat => {

        return `
          <div class="ticket-line">

            <div class="ticket-line-main">

              <div class="ticket-line-seat">
                ${escapeHtml(seat.label)}
              </div>

              <div class="ticket-line-category">
                ${escapeHtml(seat.tier)}
              </div>

            </div>

            <div class="ticket-line-price">
              ${money(seat.price)}
            </div>

          </div>
        `;

      }).join('');

  }


  function renderSelectedChips(selected) {

    if (!selected.length) {

      els.selectedSeatsPreview.classList.add(
        'hidden'
      );

      els.selectedSeatChips.innerHTML =
        '';

      return;
    }


    els.selectedSeatsPreview.classList.remove(
      'hidden'
    );


    els.selectedSeatChips.innerHTML =
      selected.map(seat => {

        return `
          <span class="seat-chip">
            ${escapeHtml(seat.label)}
          </span>
        `;

      }).join('');

  }


  /* ==========================================================
     Checkout
  ========================================================== */

  function openCheckout() {

    const {
      selected,
      subtotal,
      serviceFee,
      total
    } = calculateTotals();


    if (!selected.length) {
      return;
    }


    els.checkoutReview.innerHTML = `

      <div class="checkout-review-line">

        <span>
          Match
        </span>

        <strong>
          ${escapeHtml(
            `${teamName(match.home)} vs ${teamName(match.away)}`
          )}
        </strong>

      </div>


      <div class="checkout-review-line">

        <span>
          Venue
        </span>

        <strong>
          ${escapeHtml(venue.shortName || venue.name)}
        </strong>

      </div>


      <div class="checkout-review-line">

        <span>
          Seats
        </span>

        <strong>
          ${selected.length}
        </strong>

      </div>


      <div class="checkout-review-line">

        <span>
          Tickets
        </span>

        <strong>
          ${money(subtotal)}
        </strong>

      </div>


      <div class="checkout-review-line">

        <span>
          Service levy
        </span>

        <strong>
          ${money(serviceFee)}
        </strong>

      </div>

    `;


    els.checkoutTotal.textContent =
      money(total);


    els.checkoutModal.classList.remove(
      'hidden'
    );

    els.checkoutModal.setAttribute(
      'aria-hidden',
      'false'
    );


    document.body.style.overflow =
      'hidden';

  }


  function closeCheckout() {

    els.checkoutModal.classList.add(
      'hidden'
    );

    els.checkoutModal.setAttribute(
      'aria-hidden',
      'true'
    );


    document.body.style.overflow =
      '';

  }


  /* ==========================================================
     Continue from checkout
  ========================================================== */

  function continueCheckout() {

    const {
      selected,
      subtotal,
      serviceFee,
      total
    } = calculateTotals();


    if (!selected.length) {
      return;
    }


    /*
     * Store the current ticketing state so a future
     * checkout/payment page can consume it.
     */

    const payload = {

      matchId: match.id,

      match: {
        home: match.home,
        away: match.away,
        stage: match.stage,
        date: match.date,
        time: match.time
      },

      venue: {
        key: match.venueKey,
        name: venue.name,
        city: venue.city
      },

      seats: selected.map(seat => ({
        id: seat.key,
        label: seat.label,
        stand: seat.stand,
        tier: seat.tier,
        price: seat.price
      })),

      pricing: {
        subtotal,
        serviceFee,
        total
      },

      createdAt:
        new Date().toISOString()

    };


    sessionStorage.setItem(
      'pamojaTicketSelection',
      JSON.stringify(payload)
    );


    /*
     * The current project does not yet have a production
     * payment endpoint. For now, confirm that the selection
     * has been captured and keep the user on the ticket page.
     */

    closeCheckout();


    window.alert(
      'Your ticket selection has been saved for this session. The payment/checkout integration can now be connected to the project backend.'
    );

  }


  /* ==========================================================
     Events
  ========================================================== */

  els.checkoutButton.addEventListener(
    'click',
    openCheckout
  );


  els.closeCheckout.addEventListener(
    'click',
    closeCheckout
  );


  els.cancelCheckout.addEventListener(
    'click',
    closeCheckout
  );


  els.confirmCheckout.addEventListener(
    'click',
    continueCheckout
  );


  els.checkoutModal
    .querySelector('.checkout-backdrop')
    .addEventListener(
      'click',
      closeCheckout
    );


  document.addEventListener(
    'keydown',
    event => {

      if (
        event.key === 'Escape' &&
        !els.checkoutModal.classList.contains('hidden')
      ) {

        closeCheckout();

      }

    }
  );


  /* ==========================================================
     Initialisation
  ========================================================== */

  renderMatchHeader();

  renderCategoryPricing();

  renderStadium();

  updateSummary();

})();