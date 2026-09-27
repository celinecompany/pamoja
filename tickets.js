/**
 * AFCON PAMOJA 2026
 * Ticket selection engine
 *
 * 120 SVG sections come from old-index.html.
 *
 * A selected section represents a seating section.
 * Quantity represents how many tickets are requested
 * inside that section.
 */

(() => {

  'use strict';


  /* =========================================================
     INITIAL STATE
  ========================================================= */

  const data =
    window.TICKETING_DATA;

  const params =
    new URLSearchParams(
      window.location.search
    );

  const matchId =
    params.get('match');

  const match =
    window.getMatch(matchId);

  const venue =
    window.getVenue(match);


  const state = {

    /*
     * Each entry is a section allocation.
     *
     * {
     *   sectionId: 'SECTION-42',
     *   tier: 'cat1',
     *   price: 3000,
     *   quantity: 4,
     *   path: SVGPathElement
     * }
     */
    allocations: [],

    /*
     * One Fan ID per ticket.
     */
    fanIds: [],

    /*
     * Current checkout stage.
     */
    step: 1,

    svgLoaded: false

  };


  /* =========================================================
     DOM
  ========================================================= */

  const $ = id =>
    document.getElementById(id);


  /* =========================================================
     VALIDATION
  ========================================================= */

  if (!match || !venue) {

    const error =
      $('invalid-match');

    if (error) {
      error.classList.remove(
        'hidden'
      );
    }

    return;
  }


  /* =========================================================
     GENERAL HELPERS
  ========================================================= */

  function money(value) {

    return window.money(value);

  }


  function totalTickets() {

    return state.allocations.reduce(
      (sum, allocation) =>
        sum + allocation.quantity,
      0
    );

  }


  function totalPrice() {

    return state.allocations.reduce(
      (sum, allocation) =>
        sum +
        allocation.quantity *
        allocation.price,
      0
    );

  }


  function serviceFee() {

    return Math.round(
      totalPrice() *
      data.serviceLevyRate
    );

  }


  function grandTotal() {

    return (
      totalPrice() +
      serviceFee()
    );

  }


  function escapeHtml(value) {

    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  }


  /* =========================================================
     MATCH HEADER
  ========================================================= */

  function renderMatch() {

    const title =
      $('match-title');

    const stage =
      $('match-stage');

    const meta =
      $('match-meta');

    const venueName =
      $('venue-name');

    const venueCity =
      $('venue-city');

    const capacity =
      $('venue-capacity');

    const description =
      $('venue-description');


    if (title) {

      title.textContent =
        `${match.home} vs ${match.away}`;

    }


    if (stage) {

      stage.textContent =
        match.stage;

    }


    if (meta) {

      meta.textContent =
        `${match.date} · ${match.time}`;

    }


    if (venueName) {

      venueName.textContent =
        venue.name;

    }


    if (venueCity) {

      venueCity.textContent =
        venue.city;

    }


    if (capacity) {

      capacity.textContent =
        `${venue.capacity.toLocaleString()} capacity`;

    }


    if (description) {

      description.textContent =
        venue.description;

    }

  }


  /* =========================================================
     EXACT MAP FROM old-index.html
  ========================================================= */

  async function loadOriginalMap() {

    const wrapper =
      $('stadium-svg-map-wrapper');

    if (!wrapper) {
      return;
    }


    try {

      const response =
        await fetch(
          'old-index.html',
          {
            cache: 'no-cache'
          }
        );


      if (!response.ok) {

        throw new Error(
          `Could not load old-index.html: ${response.status}`
        );

      }


      const source =
        await response.text();


      const parser =
        new DOMParser();


      const sourceDocument =
        parser.parseFromString(
          source,
          'text/html'
        );


      const originalSvg =
        sourceDocument.querySelector(
          '#stadium-interactive-svg'
        );


      if (!originalSvg) {

        throw new Error(
          'The stadium SVG was not found in old-index.html.'
        );

      }


      /*
       * IMPORTANT:
       *
       * This clones the actual 120-section map.
       * No new geometry is generated.
       */

      const svg =
        originalSvg.cloneNode(true);


      svg.id =
        'stadium-interactive-svg';


      wrapper.innerHTML = '';

      wrapper.appendChild(svg);


      state.svgLoaded =
        true;


      initialise120Sections(
        svg
      );


    } catch (error) {

      console.error(error);

      wrapper.innerHTML = `
        <div class="map-error-state">

          <strong>
            Stadium map unavailable
          </strong>

          <span>
            Please refresh and try again.
          </span>

        </div>
      `;

    }

  }


  /* =========================================================
     120 SECTION MAP
  ========================================================= */

  function initialise120Sections(
    svg
  ) {

    /*
     * The original map is the authority.
     *
     * Every selectable path becomes one section.
     *
     * We deliberately do not recreate its coordinates,
     * shapes, dimensions or layout.
     */

    const paths =
      Array.from(
        svg.querySelectorAll(
          'path'
        )
      );


    let sectionNumber = 0;


    paths.forEach(path => {

      /*
       * Ignore decorative/background paths.
       */
      if (
        path.id === 'Layer_1' ||
        path.closest('#Layer_1')
      ) {
        return;
      }


      /*
       * Only bind meaningful map paths.
       */
      sectionNumber++;


      const sectionId =
        `SECTION-${String(
          sectionNumber
        ).padStart(3, '0')}`;


      const tier =
        detectTier(path);


      const price =
        window.getTicketPrice(
          match,
          tier
        );


      path.dataset.sectionId =
        sectionId;


      path.dataset.ticketTier =
        tier;


      path.dataset.ticketPrice =
        price;


      path.setAttribute(
        'tabindex',
        '0'
      );


      path.setAttribute(
        'role',
        'button'
      );


      path.setAttribute(
        'aria-label',
        `${sectionId}, ${tier.toUpperCase()}, ${money(price)} per ticket`
      );


      path.addEventListener(
        'click',
        event => {

          event.preventDefault();

          toggleSection(
            path
          );

        }
      );


      path.addEventListener(
        'keydown',
        event => {

          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {

            event.preventDefault();

            toggleSection(
              path
            );

          }

        }
      );

    });


    /*
     * Safety check.
     *
     * Your current map should resolve to 120 selectable
     * sections. If the number changes, we want to know.
     */

    console.info(
      `PAMOJA ticket map initialised: ${sectionNumber} sections`
    );


    updateMapSelectionState();

  }


  /* =========================================================
     CATEGORY DETECTION
  ========================================================= */

  function detectTier(path) {

    const id =
      String(
        path.id || ''
      ).toLowerCase();


    const parent =
      path.parentElement
        ? String(
            path.parentElement.id || ''
          ).toLowerCase()
        : '';


    const context =
      `${id} ${parent}`;


    if (
      context.includes('vip') ||
      context.includes('vvip')
    ) {

      return 'vvip';

    }


    if (
      context.includes('cat1') ||
      context.includes('category1')
    ) {

      return 'cat1';

    }


    if (
      context.includes('cat2') ||
      context.includes('category2')
    ) {

      return 'cat2';

    }


    /*
     * Default category.
     *
     * The exact SVG remains authoritative for geometry.
     * Pricing is handled separately here.
     */

    return 'cat3';

  }


  /* =========================================================
     SECTION SELECTION
  ========================================================= */

  function toggleSection(path) {

    const sectionId =
      path.dataset.sectionId;


    let allocation =
      state.allocations.find(
        item =>
          item.sectionId ===
          sectionId
      );


    /*
     * Section already selected:
     *
     * Increase quantity rather than creating
     * another "seat".
     */

    if (allocation) {

      if (
        totalTickets() >=
        data.rules.maximumTicketsPerOrder
      ) {

        notify(
          `You can select up to ${data.rules.maximumTicketsPerOrder} tickets per match.`
        );

        return;
      }


      allocation.quantity++;

      updateAll();

      return;
    }


    /*
     * New section.
     */

    if (
      totalTickets() >=
      data.rules.maximumTicketsPerOrder
    ) {

      notify(
        `You can select up to ${data.rules.maximumTicketsPerOrder} tickets per match.`
      );

      return;
    }


    allocation = {

      sectionId,

      tier:
        path.dataset.ticketTier,

      price:
        Number(
          path.dataset.ticketPrice
        ),

      quantity: 1,

      path

    };


    state.allocations.push(
      allocation
    );


    updateAll();

  }


  /* =========================================================
     CHANGE QUANTITY
  ========================================================= */

  function increaseSection(
    sectionId
  ) {

    if (
      totalTickets() >=
      data.rules.maximumTicketsPerOrder
    ) {

      notify(
        `Maximum ${data.rules.maximumTicketsPerOrder} tickets per match.`
      );

      return;
    }


    const allocation =
      state.allocations.find(
        item =>
          item.sectionId ===
          sectionId
      );


    if (!allocation) {
      return;
    }


    allocation.quantity++;

    updateAll();

  }


  function decreaseSection(
    sectionId
  ) {

    const index =
      state.allocations.findIndex(
        item =>
          item.sectionId ===
          sectionId
      );


    if (index === -1) {
      return;
    }


    const allocation =
      state.allocations[index];


    allocation.quantity--;


    if (
      allocation.quantity <= 0
    ) {

      state.allocations.splice(
        index,
        1
      );

    }


    updateAll();

  }


  /* =========================================================
     REMOVE SECTION
  ========================================================= */

  function removeSection(
    sectionId
  ) {

    state.allocations =
      state.allocations.filter(
        item =>
          item.sectionId !==
          sectionId
      );


    updateAll();

  }


  /* =========================================================
     FAN ID ASSIGNMENT
  ========================================================= */

  function renderFanIdAssignments() {

    const container =
      $('fan-id-assignments');

    if (!container) {
      return;
    }


    const count =
      totalTickets();


    if (!count) {

      container.innerHTML = `
        <div class="fan-id-empty">
          Select tickets to assign Fan IDs.
        </div>
      `;

      return;
    }


    /*
     * Preserve IDs already entered.
     */

    while (
      state.fanIds.length <
      count
    ) {

      state.fanIds.push('');

    }


    if (
      state.fanIds.length >
      count
    ) {

      state.fanIds.length =
        count;

    }


    let ticketNumber = 0;


    container.innerHTML =
      state.allocations
        .flatMap(
          allocation =>
            Array.from(
              {
                length:
                  allocation.quantity
              },
              () => allocation
            )
        )
        .map(
          allocation => {

            ticketNumber++;


            const index =
              ticketNumber - 1;


            return `
              <div
                class="fan-ticket-row"
                data-ticket-index="${index}"
              >

                <div class="fan-ticket-number">
                  <span>
                    Ticket ${ticketNumber}
                  </span>

                  <strong>
                    ${escapeHtml(
                      allocation.sectionId
                    )}
                  </strong>

                  <small>
                    ${allocation.tier.toUpperCase()}
                    ·
                    ${money(allocation.price)}
                  </small>
                </div>


                <div class="fan-id-field">

                  <label>
                    Fan ID
                  </label>

                  <input
                    type="text"
                    class="fan-id-input"
                    data-fan-index="${index}"
                    value="${escapeHtml(
                      state.fanIds[index]
                    )}"
                    placeholder="Enter Fan ID"
                    autocomplete="off"
                    required
                  />

                </div>

              </div>
            `;

          }
        )
        .join('');


    container
      .querySelectorAll(
        '.fan-id-input'
      )
      .forEach(input => {

        input.addEventListener(
          'input',
          event => {

            const index =
              Number(
                event.target.dataset.fanIndex
              );


            state.fanIds[index] =
              event.target.value
                .trim()
                .toUpperCase();

          }
        );

      });

  }


  /* =========================================================
     FAN ID VALIDATION
  ========================================================= */

  function validateFanIds() {

    const count =
      totalTickets();


    if (!count) {

      notify(
        'Select at least one ticket.'
      );

      return false;

    }


    const ids =
      state.fanIds
        .slice(0, count)
        .map(
          id =>
            String(id)
              .trim()
              .toUpperCase()
        );


    if (
      ids.some(
        id => !id
      )
    ) {

      notify(
        'Every ticket must have a Fan ID.'
      );

      return false;

    }


    /*
     * Same Fan ID cannot appear twice
     * for the same match.
     */

    const unique =
      new Set(ids);


    if (
      unique.size !==
      ids.length
    ) {

      notify(
        'Each ticket must use a different Fan ID for this match.'
      );

      return false;

    }


    state.fanIds =
      ids;


    return true;

  }


  /* =========================================================
     ORDER LINES
  ========================================================= */

  function buildOrderLines() {

    let ticketNumber = 0;


    return state.allocations
      .flatMap(
        allocation =>
          Array.from(
            {
              length:
                allocation.quantity
            },
            () => allocation
          )
      )
      .map(
        allocation => {

          ticketNumber++;


          return {

            ticketNumber,

            matchId:
              match.id,

            match:
              `${match.home} vs ${match.away}`,

            venue:
              venue.name,

            section:
              allocation.sectionId,

            category:
              allocation.tier,

            price:
              allocation.price,

            fanId:
              state.fanIds[
                ticketNumber - 1
              ]

          };

        }
      );

  }


  /* =========================================================
     SUMMARY
  ========================================================= */

  function renderSummary() {

    const lines =
      $('ticket-lines');


    if (!lines) {
      return;
    }


    if (
      !state.allocations.length
    ) {

      lines.innerHTML = `
        <div class="empty-summary">
          Select a section on the stadium map.
        </div>
      `;

    } else {

      lines.innerHTML =
        state.allocations
          .map(
            allocation => `
              <div class="ticket-summary-line">

                <div>

                  <strong>
                    ${escapeHtml(
                      allocation.sectionId
                    )}
                  </strong>

                  <small>
                    ${allocation.tier.toUpperCase()}
                  </small>

                </div>


                <div class="ticket-quantity-control">

                  <button
                    type="button"
                    onclick="decreaseSection('${allocation.sectionId}')"
                  >
                    −
                  </button>

                  <span>
                    ${allocation.quantity}
                  </span>

                  <button
                    type="button"
                    onclick="increaseSection('${allocation.sectionId}')"
                  >
                    +
                  </button>

                </div>


                <strong>
                  ${money(
                    allocation.quantity *
                    allocation.price
                  )}
                </strong>

              </div>
            `
          )
          .join('');

    }


    const subtotal =
      totalPrice();

    const fee =
      serviceFee();

    const total =
      grandTotal();


    if ($('selected-count')) {

      $('selected-count')
        .textContent =
        totalTickets();

    }


    if ($('subtotal')) {

      $('subtotal')
        .textContent =
        money(subtotal);

    }


    if ($('service-fee')) {

      $('service-fee')
        .textContent =
        money(fee);

    }


    if ($('total')) {

      $('total')
        .textContent =
        money(total);

    }


    const checkout =
      $('checkout-button');


    if (checkout) {

      checkout.disabled =
        totalTickets() === 0;

    }

  }


  /* =========================================================
     MAP VISUAL STATE
  ========================================================= */

  function updateMapSelectionState() {

    document
      .querySelectorAll(
        '#stadium-interactive-svg path[data-section-id]'
      )
      .forEach(path => {

        const selected =
          state.allocations.some(
            allocation =>
              allocation.sectionId ===
              path.dataset.sectionId
          );


        path.classList.toggle(
          'svg-seat-selected',
          selected
        );

      });

  }


  /* =========================================================
     GLOBAL UI UPDATE
  ========================================================= */

  function updateAll() {

    updateMapSelectionState();

    renderSummary();

    renderFanIdAssignments();

  }


  /* =========================================================
     CLEAR
  ========================================================= */

  function clearTickets() {

    state.allocations = [];

    state.fanIds = [];

    updateAll();

    notify(
      'Ticket selection cleared.'
    );

  }


  /* =========================================================
     NOTIFICATION
  ========================================================= */

  function notify(message) {

    const toast =
      $('toast-notification');

    const text =
      $('toast-message');


    if (!toast || !text) {
      alert(message);
      return;
    }


    text.textContent =
      message;


    toast.classList.remove(
      'opacity-0',
      'translate-y-6'
    );


    clearTimeout(
      toast._timer
    );


    toast._timer =
      setTimeout(
        () => {

          toast.classList.add(
            'opacity-0',
            'translate-y-6'
          );

        },
        3000
      );

  }


  /* =========================================================
     CHECKOUT
  ========================================================= */

  function startCheckout() {

    if (
      !totalTickets()
    ) {

      notify(
        'Select at least one ticket.'
      );

      return;

    }


    /*
     * Fan IDs must be entered before payment.
     */

    if (
      !validateFanIds()
    ) {

      const fanBlock =
        $('fan-id-assignments');

      if (fanBlock) {

        fanBlock.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

      }

      return;

    }


    const review =
      $('checkout-review');


    if (review) {

      review.innerHTML =
        buildOrderLines()
          .map(
            line => `
              <div class="checkout-review-line">

                <div>

                  <strong>
                    Ticket ${line.ticketNumber}
                  </strong>

                  <span>
                    ${escapeHtml(
                      line.section
                    )}
                    ·
                    ${line.category.toUpperCase()}
                  </span>

                </div>


                <div>

                  <span>
                    Fan ID
                  </span>

                  <strong>
                    ${escapeHtml(
                      line.fanId
                    )}
                  </strong>

                </div>


                <strong>
                  ${money(line.price)}
                </strong>

              </div>
            `
          )
          .join('');

    }


    if ($('checkout-total')) {

      $('checkout-total')
        .textContent =
        money(grandTotal());

    }


    const modal =
      $('checkout-modal');


    if (modal) {

      modal.classList.remove(
        'hidden'
      );

      modal.classList.add(
        'flex'
      );

    }

  }


  function closeCheckout() {

    const modal =
      $('checkout-modal');


    if (!modal) {
      return;
    }


    modal.classList.add(
      'hidden'
    );

    modal.classList.remove(
      'flex'
    );

  }


  /* =========================================================
     PAYMENT
  ========================================================= */

  function confirmPayment() {

    if (
      !validateFanIds()
    ) {

      closeCheckout();

      return;

    }


    const button =
      $('confirm-checkout');


    if (button) {

      button.disabled =
        true;

      button.textContent =
        'Processing payment…';

    }


    /*
     * This is the front-end payment placeholder.
     *
     * Later this should call the actual payment backend.
     */

    setTimeout(
      () => {

        const order =
          buildOrderLines();


        console.log(
          'PAMOJA ORDER',
          {
            match,
            venue,
            tickets: order,
            subtotal: totalPrice(),
            serviceFee: serviceFee(),
            total: grandTotal()
          }
        );


        closeCheckout();


        showSuccess();


        if (button) {

          button.disabled =
            false;

          button.textContent =
            'Confirm & Pay';

        }

      },
      900
    );

  }


  /* =========================================================
     SUCCESS
  ========================================================= */

  function showSuccess() {

    const modal =
      $('success-modal');


    if (!modal) {

      notify(
        'Payment successful.'
      );

      return;

    }


    const orderNumber =
      `PAM-${Date.now()
        .toString()
        .slice(-8)}`;


    const orderEl =
      $('success-order-number');


    if (orderEl) {

      orderEl.textContent =
        orderNumber;

    }


    const countEl =
      $('success-ticket-count');


    if (countEl) {

      countEl.textContent =
        `${totalTickets()} personalized ticket${totalTickets() === 1 ? '' : 's'}`;

    }


    modal.classList.remove(
      'hidden'
    );

    modal.classList.add(
      'flex'
    );

  }


  /* =========================================================
     GLOBAL API
  ========================================================= */

  window.increaseSection =
    increaseSection;

  window.decreaseSection =
    decreaseSection;

  window.removeSection =
    removeSection;

  window.clearSelectedSeats =
    clearTickets;

  window.openTicketCheckout =
    startCheckout;

  window.closeTicketCheckout =
    closeCheckout;

  window.confirmTicketCheckout =
    confirmPayment;


  /* =========================================================
     BOOT
  ========================================================= */

  document.addEventListener(
    'DOMContentLoaded',
    async () => {

      renderMatch();

      await loadOriginalMap();

      updateAll();

    }
  );

})();