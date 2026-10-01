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
     * AFCON RULE: one ticket per Fan ID per match (anti-hoarding).
     * Each entry is a section allocation.
     *
     * {
     *   sectionId: 'SECTION-42',
     *   tier: 'cat1',
     *   price: 3000,
     *   quantity: 1,
     *   path: SVGPathElement
     * }
     */
    allocations: [],

    /*
     * One Fan ID per ticket, linked at checkout time.
     */
    fanIds: [],

    /*
     * Current checkout stage.
     */
    step: 1,

    svgLoaded: false,

    /*
     * 10-minute checkout hold (CAF payment window).
     */
    checkoutTimerId: null,
    checkoutDeadline: 0,
    checkoutSecondsLeft: 0

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


  function setText(id, value) {

    const el =
      $(id);

    if (el) {
      el.textContent = value;
    }

  }


  function getSingleFanIdInput() {

    return (
      $('yalla-id') ||
      $('fan-id-input-0') ||
      document.querySelector('.fan-id-input')
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
     AFCON / PAMOJA RULE HELPERS (logic only, no visual change)
     ========================================================= */

  function maxTicketsPerOrder() {

    const configured =
      Number(
        data.rules &&
        data.rules.maximumTicketsPerOrder
      );

    /*
     * AFCON RULE: individual account limit is one ticket per match.
     * Clamp any legacy larger configuration down to 1.
     */
    if (!Number.isFinite(configured) || configured < 1) {
      return 1;
    }

    return Math.min(configured, 1);

  }


  function getFanIdPattern() {

    try {

      if (
        Array.isArray(data.fanIdPatternSources) &&
        data.fanIdPatternSources.length
      ) {
        return new RegExp(
          `(?:${data.fanIdPatternSources.join('|')})`,
          'i'
        );
      }

    } catch (error) {
      /* fall through to default pattern */
    }

    return /^(?:PAMOJA-[A-Z0-9]{6}|YALLA-[A-Z]{2}-\d{4}-[A-Z0-9]{4})$/i;

  }


  function normalizeFanId(value) {

    return String(value || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '');

  }


  function isFanIdFormatValid(value) {

    return getFanIdPattern().test(
      normalizeFanId(value)
    );

  }


  function getCurrentPhase() {

    const phases =
      data.salesPhases || {};

    const phase =
      String(phases.currentPhase || 'general')
        .trim()
        .toLowerCase();

    if (
      phase === 'visa-presale' ||
      phase === 'visa' ||
      phase === 'presale'
    ) {
      return 'visa-presale';
    }

    if (phase === 'final' || phase === 'final-drops') {
      return 'final';
    }

    return 'general';

  }


  function getAcceptedPaymentMethods() {

    const methods =
      Array.isArray(data.paymentMethods)
        ? data.paymentMethods.filter(method => method && method.enabled)
        : [];

    /*
     * Phase 1: Visa presale = Visa only (48h priority window).
     * Phase 2/3: general + final drops accept Visa, Mastercard,
     * M-Pesa and Airtel Money.
     */
    if (getCurrentPhase() === 'visa-presale') {
      return methods.filter(
        method =>
          String(method.id || '').toLowerCase() === 'visa'
      );
    }

    return methods;

  }


  function getCheckoutHoldSeconds() {

    const configured =
      Number(data.checkoutHoldSeconds);

    if (Number.isFinite(configured) && configured > 0) {
      return Math.floor(configured);
    }

    return 600;

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


      initialiseMapSections(
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

  function isStadiumSectionPath(path) {
    const groupId = String(path.closest('g[id]')?.id || '').toLowerCase();
    return groupId !== 'layer_1' && /vip|cat[1-5]/.test(groupId);
  }


  function initialiseMapSections(
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
      if (!isStadiumSectionPath(path)) {
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

      const unavailable =
        window.getUnavailableSections(match.id).has(sectionId);

      path.dataset.unavailable =
        String(unavailable);

      path.classList.toggle(
        'svg-seat-unavailable',
        unavailable
      );

      path.setAttribute(
        'aria-disabled',
        String(unavailable)
      );


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

          if (path.dataset.unavailable === 'true') {
            notify('This section is unavailable for the selected match.');
            return;
          }

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

            if (path.dataset.unavailable === 'true') {
              notify('This section is unavailable for the selected match.');
              return;
            }

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

    const allSectionsFilter = document.querySelector('[data-stand-filter="all"]');
    if (allSectionsFilter) allSectionsFilter.textContent = `All ${sectionNumber} Sections`;


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

    if (window.getUnavailableSections(match.id).has(sectionId)) {
      notify('This section is unavailable for the selected match.');
      return;
    }


    let allocation =
      state.allocations.find(
        item =>
          item.sectionId ===
          sectionId
      );


    /*
     * AFCON RULE: one ticket per match per account.
     * Clicking the already-selected section deselects it
     * (toggle). Clicking a different section REPLACES the
     * current pick — the map holds a single seat/category,
     * and pricing always reflects that one active selection.
     */

    if (allocation) {

      state.allocations = [];

      updateAll();

      return;
    }


    if (
      state.allocations.length > 0 ||
      totalTickets() >=
      maxTicketsPerOrder()
    ) {

      state.allocations = [];

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

    /*
     * AFCON RULE: quantity is fixed at 1 ticket per match.
     * The +/- steppers stay wired but cannot exceed 1, so the
     * single active seat/category keeps driving the price.
     */
    notify(
      `CAF limit: 1 ticket per match per Fan ID. To change category, pick a different section on the map.`
    );

    return;

  }


  function decreaseSection(
    sectionId
  ) {

    /*
     * AFCON RULE: single-ticket order, so decreasing removes
     * the active pick and releases the held seat.
     */
    const index =
      state.allocations.findIndex(
        item =>
          item.sectionId ===
          sectionId
      );


    if (index === -1) {
      return;
    }


    state.allocations.splice(
      index,
      1
    );


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

    /*
     * Live single Fan ID field in tickets.html stays authoritative.
     * Mirror it into state without touching its visual layout.
     */
    const singleInput =
      getSingleFanIdInput();

    if (singleInput) {

      if (
        document.activeElement !== singleInput &&
        typeof state.fanIds[0] === 'string' &&
        singleInput.value !== state.fanIds[0]
      ) {
        singleInput.value = state.fanIds[0];
      }

      if (singleInput.value) {
        state.fanIds[0] = normalizeFanId(singleInput.value);
      }

      renderFanIdStatus(
        state.fanIds[0]
          ? isFanIdFormatValid(state.fanIds[0])
          : null
      );

    }

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
              normalizeFanId(
                event.target.value
              );

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


    /*
     * AFCON RULE: one ticket per match per account.
     */
    if (
      count > maxTicketsPerOrder()
    ) {

      notify(
        'CAF limit: 1 ticket per match per Fan ID.'
      );

      return false;

    }


    const ids =
      state.fanIds
        .slice(0, count)
        .map(
          id =>
            normalizeFanId(id)
        );


    /*
     * Mandatory Fan ID: purchase cannot proceed without it.
     */
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
     * Fan ID format check (PAMOJA-XXXXXX or YALLA-XX-20XX-XXXX).
     * Name on ticket must match this Fan ID at the gate.
     */
    if (
      ids.some(
        id => !isFanIdFormatValid(id)
      )
    ) {

      notify(
        'Enter a valid Fan ID (e.g. YALLA-KE-2026-AB12). Name on ticket must match the Fan ID.'
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
                1
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
              ],

            /*
             * AFCON RULE: personalized + non-transferable.
             * A ticket cannot be used for immigration alone:
             * stadium face verification is mandatory.
             */
            personalized: true,
            nonTransferable: true,
            faceVerificationRequired: true

          };

        }
      );

  }


  /* =========================================================
     SUMMARY
  ========================================================= */

  function renderSummary() {

    /*
     * Live tickets.html panels (authoritative).
     * Keep legacy ticket-lines output too so both shells stay in sync.
     */
    const tickets =
      totalTickets();

    const subtotal =
      totalPrice();

    const fee =
      serviceFee();

    const total =
      grandTotal();

    const lines =
      $('ticket-lines');

    const seatLines =
      $('summary-seat-lines');

    const seatList =
      $('selected-seat-list');


    if (lines) {

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
                      ${allocation.tier.toUpperCase()} · 1 ticket (CAF limit)
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

    }


    if (seatLines) {

      if (!state.allocations.length) {

        seatLines.innerHTML = `
          <div class="text-[11px] text-slate-500">
            No seats selected yet. Click a coloured section on the map.
          </div>
        `;

      } else {

        seatLines.innerHTML =
          state.allocations
            .map(
              allocation => `
                <div class="flex items-center justify-between text-[11px] py-1 border-b border-slate-800/60">
                  <span class="font-mono text-slate-200">
                    ${escapeHtml(allocation.sectionId)} · ${allocation.tier.toUpperCase()}
                  </span>
                  <span class="font-mono text-amber-400">
                    ${money(allocation.price)}
                  </span>
                </div>
              `
            )
            .join('');

      }

    }


    if (seatList) {

      if (!state.allocations.length) {

        seatList.innerHTML = `
          <span class="text-[10px] text-slate-500">
            No seats selected yet.
          </span>
        `;

      } else {

        seatList.innerHTML =
          state.allocations
            .map(
              allocation => `
                <span class="px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
                  ${escapeHtml(allocation.sectionId)} · ${allocation.tier.toUpperCase()} · ${money(allocation.price)}
                </span>
              `
            )
            .join('');

      }

    }


    /*
     * Same AFCON single-ticket totals across every ID variant.
     */
    setText('selected-count', String(tickets));
    setText('subtotal', money(subtotal));
    setText('service-fee', money(fee));
    setText('total', money(total));
    setText('selected-seat-count', tickets === 1 ? '1 seat selected' : `${tickets} seats selected`);
    setText('map-selection-count', tickets === 1 ? '1 seat held' : `${tickets} seats held`);
    setText('summary-match', `${match.home} vs ${match.away}`);
    setText('summary-venue', `${venue.name} · ${venue.city}`);
    setText('summary-date', `${match.date} · ${match.time}`);
    setText('summary-seat-count', tickets === 1 ? '1 seat selected' : `${tickets} seats selected`);
    setText('summary-subtotal', money(subtotal));
    setText('summary-vat', money(fee));
    setText('summary-total', money(total));

    const payButton = $('pay-now-btn');
    if (payButton) payButton.textContent = `Pay ${money(total)}`;


    const checkout =
      $('checkout-button');

    if (checkout) {

      checkout.disabled =
        tickets === 0;

    }


    updateStepGates();

  }


  /* =========================================================
     MAP VISUAL STATE
  ========================================================= */

  function updateMapSelectionState() {

    const unavailableSections =
      window.getUnavailableSections(match.id);

    if (state.allocations.some(allocation => unavailableSections.has(allocation.sectionId))) {
      state.allocations = state.allocations.filter(
        allocation => !unavailableSections.has(allocation.sectionId)
      );
      notify('A selected section is no longer available and was removed from your cart.');
    }

    document
      .querySelectorAll(
        '#stadium-interactive-svg path[data-section-id]'
      )
      .forEach(path => {

        const unavailable = unavailableSections.has(path.dataset.sectionId);

        path.dataset.unavailable = String(unavailable);
        path.classList.toggle('svg-seat-unavailable', unavailable);
        path.setAttribute('aria-disabled', String(unavailable));
        path.setAttribute('tabindex', unavailable ? '-1' : '0');

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


  function updateStepGates() {

    const tickets =
      totalTickets();

    const fanOk =
      tickets > 0 &&
      state.fanIds
        .slice(0, tickets)
        .every(id => isFanIdFormatValid(id || ''));

    const detailsOk =
      tickets > 0 && fanOk;

    setStepState(
      'continue-details-btn',
      tickets > 0
    );

    setStepState(
      'continue-payment-btn',
      detailsOk
    );

    setStepState(
      'pay-now-btn',
      detailsOk
    );

    setStepState(
      'checkout-step-seat',
      tickets > 0,
      true
    );

    setStepState(
      'checkout-step-details',
      detailsOk,
      true
    );

  }


  function setStepState(id, enabled, isStep) {

    const el =
      $(id);

    if (!el) {
      return;
    }

    if (isStep) {

      el.classList.toggle('active', !!enabled);

      return;

    }

    el.disabled = !enabled;

    el.classList.toggle('cursor-not-allowed', !enabled);

    if (enabled) {

      el.classList.remove('bg-slate-800', 'text-slate-500');

      el.classList.add('bg-amber-500', 'text-slate-950');

    } else {

      el.classList.add('bg-slate-800', 'text-slate-500');

      el.classList.remove('bg-amber-500', 'text-slate-950');

    }

  }


  function wireStepButtons() {

    /*
     * Payment option buttons keep their existing look; selection is
     * only used by the phase gate (Visa presale vs general release).
     */
    document
      .querySelectorAll('.payment-option')
      .forEach(option => {

        if (option._wired) {
          return;
        }

        option._wired = true;

        option.addEventListener('click', () => {

          document
            .querySelectorAll('.payment-option')
            .forEach(other => other.classList.remove('active'));

          option.classList.add('active');

          const mpesa =
            $('mpesa-fields');

          const card =
            $('card-fields');

          const useCard =
            String(option.dataset.payment || '').toLowerCase() === 'card';

          if (mpesa) {
            mpesa.classList.toggle('hidden', useCard);
          }

          if (card) {
            card.classList.toggle('hidden', !useCard);
          }

        });

      });

    const detailsBtn =
      $('continue-details-btn');

    if (detailsBtn && !detailsBtn._wired) {

      detailsBtn._wired = true;

      detailsBtn.addEventListener('click', () => {

        const target =
          $('fan-details-card') ||
          $('fan-id-assignments');

        if (target) {

          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

        }

        const input =
          getSingleFanIdInput();

        if (input) {
          input.focus({ preventScroll: true });
        }

      });

    }

    const paymentBtn =
      $('continue-payment-btn');

    if (paymentBtn && !paymentBtn._wired) {

      paymentBtn._wired = true;

      paymentBtn.addEventListener('click', () => {

        const target =
          $('payment-method-card');

        if (target) {

          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

        }

      });

    }

    const payBtn =
      $('pay-now-btn');

    if (payBtn && !payBtn._wired) {

      payBtn._wired = true;

      payBtn.addEventListener('click', () => {

        startCheckoutFlow(true);

      });

    }

    const verifyBtn =
      $('verify-yalla-btn');

    if (verifyBtn && !verifyBtn._wired) {

      verifyBtn._wired = true;

      verifyBtn.addEventListener('click', () => {

        const input =
          getSingleFanIdInput();

        const value =
          normalizeFanId(input ? input.value : '');

        if (input) {
          input.value = value;
        }

        state.fanIds[0] = value;

        if (isFanIdFormatValid(value)) {

          notify('Fan ID verified for this ticket.');
          renderFanIdStatus(true);

        } else {

          notify('Enter a valid Fan ID (e.g. YALLA-KE-2026-AB12).');
          renderFanIdStatus(false);

        }

        updateStepGates();

      });

    }

    const singleInput =
      getSingleFanIdInput();

    if (singleInput && !singleInput._wired) {

      singleInput._wired = true;

      singleInput.addEventListener('input', event => {

        const value =
          normalizeFanId(event.target.value);

        state.fanIds[0] = value;

        renderFanIdStatus(
          value ? isFanIdFormatValid(value) : null
        );

        updateStepGates();

      });

    }

  }


  function renderFanIdStatus(verified) {

    const status =
      $('yalla-status');

    if (!status) {
      return;
    }

    if (verified === true) {

      status.className =
        'text-[10px] font-bold text-emerald-400';

      status.textContent =
        'Fan ID verified - linked to this ticket.';

    } else if (verified === false) {

      status.className =
        'text-[10px] font-bold text-red-400';

      status.textContent =
        'Invalid Fan ID format. Use YALLA-KE-2026-XXXX.';

    } else {

      status.className =
        'text-[10px] text-slate-500';

      status.textContent =
        'Each ticket is linked to one Fan ID.';

    }

  }



  /* =========================================================
     GLOBAL UI UPDATE
  ========================================================= */

  function updateAll() {

    updateMapSelectionState();

    updatePriceLegend();

    renderSummary();

    renderFanIdAssignments();

  }


  function updatePriceLegend() {
    ['vvip', 'cat1', 'cat2', 'cat3'].forEach(tier => {
      setText(`legend-price-${tier}`, money(window.getTicketPrice(match, tier)));
    });

    const currencySelect = $('display-currency');
    if (currencySelect) {
      currencySelect.value = window.getDisplayCurrency();
    }

    state.allocations.forEach(allocation => {
      allocation.price = window.getTicketPrice(match, allocation.tier);
    });

    document
      .querySelectorAll('#stadium-interactive-svg path[data-section-id]')
      .forEach(path => {
        const price = window.getTicketPrice(match, path.dataset.ticketTier);
        path.dataset.ticketPrice = String(price);
        path.setAttribute(
          'aria-label',
          `${path.dataset.sectionId}, ${path.dataset.ticketTier.toUpperCase()}, ${money(price)} per ticket${path.dataset.unavailable === 'true' ? ', unavailable' : ''}`
        );
      });
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
      console.info(message);
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
     CHECKOUT HOLD TIMER (strict 10-minute payment window)
     ========================================================= */

  function formatHoldTime(totalSeconds) {

    const safe =
      Math.max(0, Math.floor(totalSeconds || 0));

    const minutes =
      Math.floor(safe / 60);

    const seconds =
      safe % 60;

    const pad =
      value =>
        String(value).padStart(2, '0');

    return `${pad(minutes)}:${pad(seconds)}`;

  }


  function renderHoldTimer() {

    const label =
      $('hold-timer-value') ||
      $('checkout-hold-timer');

    if (label) {
      label.textContent =
        formatHoldTime(state.checkoutSecondsLeft);
    }

    const wrap =
      $('hold-timer');

    if (wrap) {
      wrap.classList.toggle(
        'hidden',
        !(state.checkoutTimerId || state.checkoutSecondsLeft > 0)
      );
    }

  }


  function releaseHeldSeats(reason) {

    stopCheckoutTimer(true);

    closeCheckout();

    state.allocations = [];

    state.fanIds = [];

    updateAll();

    notify(
      reason ||
      'Payment window expired. Your held seat was released back to general sale.'
    );

  }


  function stopCheckoutTimer(silent) {

    if (state.checkoutTimerId) {

      clearInterval(state.checkoutTimerId);

      state.checkoutTimerId = null;

    }

    if (!silent) {
      renderHoldTimer();
    }

  }


  function startCheckoutTimer() {

    stopCheckoutTimer(true);

    state.checkoutSecondsLeft =
      getCheckoutHoldSeconds();

    state.checkoutDeadline =
      Date.now() +
      state.checkoutSecondsLeft * 1000;

    renderHoldTimer();

    state.checkoutTimerId =
      setInterval(
        () => {

          const remaining =
            Math.ceil(
              (state.checkoutDeadline - Date.now()) / 1000
            );

          state.checkoutSecondsLeft =
            Math.max(0, remaining);

          renderHoldTimer();

          /*
           * CAF RULE: seats are stripped from the cart and
           * returned to circulation when the window lapses.
           */
          if (state.checkoutSecondsLeft <= 0) {

            releaseHeldSeats(
              'Payment window expired (10:00). Your held seat was released. Please pick again.'
            );

          }

        },
        500
      );

  }


  function renderPaymentMethods() {

    /*
     * Live payment card on tickets.html (no layout change):
     * show the phase-accepted method names in the existing method box.
     */
    const liveMethodBox =
      $('payment-method-name');

    if (liveMethodBox) {
      liveMethodBox.textContent =
        getAcceptedPaymentMethods()
          .map(method => method.name)
          .join(' · ') || '—';
    }

    const livePhaseNote =
      $('payment-phase-note');

    if (livePhaseNote) {
      livePhaseNote.textContent =
        getCurrentPhase() === 'visa-presale'
          ? 'Visa Presale: only Visa is accepted during the 48-hour priority window.'
          : 'General release: Visa, Mastercard, M-Pesa and Airtel Money are accepted.';
    }

    const container =
      $('checkout-payment-methods');

    if (!container) {
      return;
    }

    const accepted =
      getAcceptedPaymentMethods();

    const phase =
      getCurrentPhase();

    if (!accepted.length) {

      container.innerHTML = `
        <div class="payment-method-empty">
          No payment method is available for this sales phase.
        </div>
      `;

      return;

    }

    container.innerHTML =
      accepted
        .map(
          (method, index) => `
            <label class="payment-method-option">
              <input
                type="radio"
                name="payment-method"
                value="${escapeHtml(method.id)}"
                ${index === 0 ? 'checked' : ''}
              />
              <span>${escapeHtml(method.name)}</span>
            </label>
          `
        )
        .join('') +
      (
        phase === 'visa-presale'
          ? `
            <div class="payment-phase-note">
              Visa Presale window: only Visa cards are accepted for the exclusive 48-hour priority access.
            </div>
          `
          : `
            <div class="payment-phase-note">
              General release: Visa, Mastercard, M-Pesa and Airtel Money are accepted.
            </div>
          `
      );

  }


  function getSelectedPaymentMethod() {

    /*
     * Live page uses selectable M-Pesa/Card buttons plus a phase note.
     * Map that UI back to an accepted method ID for the phase gate.
     */
    const selected =
      document.querySelector(
        'input[name="payment-method"]:checked'
      );

    if (selected) {
      return String(selected.value || '').toLowerCase();
    }

    const activeOption =
      document.querySelector('.payment-option.active');

    const active =
      activeOption
        ? String(activeOption.dataset.payment || '').toLowerCase()
        : '';

    if (active === 'card') {
      return 'visa';
    }

    if (active === 'mpesa') {
      return 'mpesa';
    }

    const liveBox =
      $('payment-method-name');

    if (liveBox) {

      const text =
        liveBox.textContent.toLowerCase();

      if (text.includes('visa')) {
        return 'visa';
      }

    }

    const accepted =
      getAcceptedPaymentMethods();

    return accepted.length
      ? String(accepted[0].id || '').toLowerCase()
      : '';

  }


  function validatePaymentPhase() {

    const accepted =
      getAcceptedPaymentMethods().map(
        method =>
          String(method.id || '').toLowerCase()
      );

    const selected =
      getSelectedPaymentMethod() ||
      (accepted.length ? accepted[0] : '');

    /*
     * Phase 1 gate: Mastercard / mobile wallets are rejected
     * until the Visa presale window closes.
     */
    if (!accepted.includes(selected)) {

      if (getCurrentPhase() === 'visa-presale') {
        notify(
          'Visa Presale window: please pay with a Visa card. General sales (Mastercard / M-Pesa / Airtel Money) open after the 48-hour priority window.'
        );
      } else {
        notify(
          'Selected payment method is not available for this sales phase.'
        );
      }

      return false;

    }

    return true;

  }


  function startCheckoutFlow(fromPayButton) {

    startCheckout();

    if (!fromPayButton) {
      return;
    }

    /*
     * pay-now-btn on the live page means "finalize now": run the
     * same guards, hold timer, phase gate and digital issuance
     * as the modal confirm path.
     */
    confirmPayment();

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
     * AFCON RULE: cap the order before Fan ID linking.
     * One ticket per match per account.
     */

    if (
      totalTickets() >
      maxTicketsPerOrder()
    ) {

      notify(
        'CAF limit: 1 ticket per match per Fan ID.'
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

                  <small class="checkout-personalized-note">
                    Personalized · Non-transferable · Face check at gate
                  </small>

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


    renderPaymentMethods();

    startCheckoutTimer();


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

    stopCheckoutTimer(true);

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


    /*
     * Sales-phase payment gate (Visa presale vs general/final).
     */
    if (!validatePaymentPhase()) {
      return;
    }


    /*
     * CAF RULE: checkout only starts the 10-minute hold; a live page
     * without an open hold gets one now so expiry can release seats.
     */
    if (
      !state.checkoutTimerId &&
      state.checkoutSecondsLeft <= 0
    ) {
      startCheckoutTimer();
    }


    /*
     * Hold-window guard: an expired timer releases the seat.
     */
    if (state.checkoutSecondsLeft <= 0) {

      releaseHeldSeats(
        'Payment window expired (10:00). Your held seat was released. Please pick again.'
      );

      return;

    }


    const button =
      $('confirm-checkout') ||
      $('pay-now-btn');


    if (button) {

      button.disabled =
        true;

      if (button.dataset.label === undefined) {
        button.dataset.label = button.textContent;
      }

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
            paymentMethod: getSelectedPaymentMethod(),
            salesPhase: getCurrentPhase(),
            personalized: true,
            nonTransferable: true,
            faceVerificationRequired: true,
            subtotal: totalPrice(),
            serviceFee: serviceFee(),
            total: grandTotal()
          }
        );


        stopCheckoutTimer(true);


        closeCheckout();


        showSuccess();


        if (button) {

          button.disabled =
            false;

          button.textContent =
            button.dataset.label ||
            'Confirm & Pay';

          delete button.dataset.label;

        }

      },
      900
    );

  }


  /* =========================================================
     SUCCESS
  ========================================================= */

  function showSuccess() {

    /*
     * Live success modal IDs first, legacy IDs as fallback.
     */
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


    const ticketCount =
      totalTickets();

    const paidTotal =
      money(grandTotal());

    setText('success-order-number', orderNumber);
    setText('success-reference', orderNumber);
    setText(
      'success-ticket-count',
      `${ticketCount} personalized ticket${ticketCount === 1 ? '' : 's'}`
    );
    setText('success-total', paidTotal);


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
    startCheckoutFlow;

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

      wireStepButtons();

      renderPaymentMethods();

      updateAll();

      const currencySelect = $('display-currency');
      if (currencySelect) {
        currencySelect.value = window.getDisplayCurrency();
        currencySelect.addEventListener('change', () => {
          localStorage.setItem('pamoja_display_currency', currencySelect.value);
          updateAll();
        });
      }

      window.addEventListener('storage', event => {
        if (['pamoja_display_currency', 'pamoja_match_pricing', 'pamoja_match_unavailable_sections'].includes(event.key)) {
          updateAll();
        }
      });

      const closeSuccess =
        $('close-success-btn');

      if (closeSuccess && !closeSuccess._wired) {

        closeSuccess._wired = true;

        closeSuccess.addEventListener('click', () => {

          const modal =
            $('success-modal');

          if (modal) {

            modal.classList.add('hidden');

            modal.classList.remove('flex');

          }

        });

      }

    }
  );

})();