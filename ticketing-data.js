/**
 * AFCON PAMOJA 2026
 * Ticketing configuration
 *
 * IMPORTANT:
 * Stadium geometry comes from old-index.html.
 * This file controls:
 *   - matches
 *   - ticket limits
 *   - pricing
 *   - Fan ID rules
 *   - fees
 */

window.TICKETING_DATA = {

  /* =========================================================
     TICKETING RULES
  ========================================================= */

  rules: {

    /*
     * AFCON / PAMOJA rule: one ticket per Fan ID per match.
     * Prevents hoarding and scalping. Buying for friends/family
     * requires a distinct Fan ID linked at checkout time, and the
     * name on the ticket must match the Fan ID holder. Secondary
     * resale / using someone else's ticket is prohibited.
     */
    minimumTicketsPerOrder: 1,

    /* CAF policy: individual account limit, one ticket per match. */
    maximumTicketsPerOrder: 1,

    /*
     * Every ticket must have one Fan ID linked BEFORE payment.
     * A Fan ID cannot be reused for another ticket
     * in the same match.
     */
    fanIdRequired: true,

    uniqueFanIdPerMatch: true,

    /* Tickets are strictly personalized and non-transferable. */
    nonTransferable: true,

    /*
     * Tickets are digital and personalized.
     */
    digitalOnly: true,
    personalized: true,

    /*
     * No stadium-door ticket sales.
     */
    stadiumSales: false,

    /*
     * PAMOJA Visa-waiver guard: a ticket alone does not confer
     * travel entry. Face verification at the gate is mandatory,
     * and failure to verify can invalidate the travel arrangement.
     */
    faceVerificationRequired: true,

    /*
     * Refund rule supplied for this product.
     */
    refundPolicy:
      'Refunds are available only when a match is officially cancelled by CAF.'
  },


  /* =========================================================
     SALES PHASES
     ========================================================= */

  /*
   * Phase 1 = Visa presale (exclusive 48h priority window).
   * Phase 2 = General public release (Visa + Mastercard +
   *           M-Pesa / Airtel Money).
   * Phase 3 = Final drops (remaining / returned allocations).
   *
   * currentPhase controls the checkout payment gate:
   *   - 'visa-presale'  -> only Visa is accepted
   *   - 'general'       -> all configured methods accepted
   *   - 'final'         -> all configured methods accepted
   *
   * To open general sales, set currentPhase to 'general'.
   */
  salesPhases: {
    currentPhase: 'general',
    visaPresaleHours: 48,
    visaPresaleCapacityShare: 0.3
  },


  /* =========================================================
     CHECKOUT HOLD TIMER
     ========================================================= */

  /*
   * Strict 10-minute payment window. If checkout is not
   * completed in time, seats are stripped from the cart and
   * returned to general circulation.
   */
  checkoutHoldSeconds: 600,


  /* =========================================================
     SERVICE CHARGES
  ========================================================= */

  serviceLevyRate: 0.16,


  /* =========================================================
     PAYMENT METHODS
  ========================================================= */

  paymentMethods: [

    {
      id: 'visa',
      name: 'Visa',
      enabled: true
    },

    {
      id: 'mastercard',
      name: 'Mastercard',
      enabled: true
    },

    {
      id: 'mpesa',
      name: 'M-Pesa',
      enabled: true
    },

    {
      id: 'airtel',
      name: 'Airtel Money',
      enabled: true
    }

  ],


  /* =========================================================
     FAN ID FORMAT
     ========================================================= */

  /*
   * Fan ID is mandatory before purchase. Format enforced in
   * tickets.js via getFanIdPattern():
   *   PAMOJA-XXXXXX  (legacy)  or  YALLA-XX-20XX-XXXX (current)
   */
  fanIdPatternSources: [
    '^PAMOJA-[A-Z0-9]{6}$',
    '^YALLA-[A-Z]{2}-\\d{4}-[A-Z0-9]{4}$'
  ],


  /* =========================================================
     MATCHES
  ========================================================= */

  matches: [

    {
      id: 'm1',

      home: 'Kenya 🇰🇪',
      away: 'Senegal 🇸🇳',

      stage: 'Grand Opening Match',
      stageKey: 'group',

      venueKey: 'kasarani',

      date: 'Fri, 18 Sep 2026',
      time: '20:00 EAT',

      capacity: 60000,

      occupiedSeats: 51240,

      stockStatus:
        '● High Demand - 85% Sold',

      stockColor:
        'text-amber-400 bg-amber-500/10 border-amber-500/30'
    },


    {
      id: 'm2',

      home: 'Nigeria 🇳🇬',
      away: 'Ivory Coast 🇨🇮',

      stage: 'Quarter-Final 1',
      stageKey: 'quarters',

      venueKey: 'nyayo',

      date: 'Sun, 20 Sep 2026',
      time: '17:00 EAT',

      capacity: 30000,

      occupiedSeats: 26800,

      stockStatus:
        '● VIP Only Remaining',

      stockColor:
        'text-orange-400 bg-orange-500/10 border-orange-500/30'
    },


    {
      id: 'm3',

      home: 'Morocco 🇲🇦',
      away: 'Egypt 🇪🇬',

      stage: 'Tournament Grand Final 🏆',
      stageKey: 'final',

      venueKey: 'eldoret',

      date: 'Sat, 26 Sep 2026',
      time: '21:00 EAT',

      capacity: 15000,

      occupiedSeats: 13800,

      stockStatus:
        '● Selling Fast (92%)',

      stockColor:
        'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    }

  ],


  /* =========================================================
     VENUE PRICING
  ========================================================= */

  venues: {

    kasarani: {

      name:
        'Moi International Sports Centre, Kasarani',

      city:
        'Nairobi, Kenya',

      capacity:
        60000,

      description:
        'A large multi-tier stadium with premium, Category 1, Category 2 and Category 3 seating.',

      /*
       * These prices are attached to the section/category,
       * NOT generated by the map.
       */

      pricing: {

        vvip: 5000,
        cat1: 3000,
        cat2: 1800,
        cat3: 1000

      }

    },


    nyayo: {

      name:
        'Nyayo National Stadium',

      city:
        'Nairobi, Kenya',

      capacity:
        30000,

      description:
        'A compact stadium with premium west-side seating and Category 2 and Category 3 sections.',

      pricing: {

        vvip: 5000,
        cat1: 3500,
        cat2: 1800,
        cat3: 1000

      }

    },


    eldoret: {

      name:
        'Kipchoge Keino Stadium',

      city:
        'Eldoret, Kenya',

      capacity:
        15000,

      description:
        'A smaller stadium offering an intimate match-day experience.',

      pricing: {

        vvip: 4000,
        cat1: 2500,
        cat2: 1400,
        cat3: 800

      }

    }

  }

};


/* =============================================================
   HELPERS
============================================================= */

window.getMatch = function(matchId) {

  return window.TICKETING_DATA.matches.find(
    match => match.id === matchId
  );

};


window.getVenue = function(match) {

  if (!match) {
    return null;
  }

  return window.TICKETING_DATA.venues[
    match.venueKey
  ];

};


window.getVenuePricing = function(match) {

  const venue =
    window.getVenue(match);

  return venue
    ? venue.pricing
    : {};

};


window.PAMOJA_CURRENCIES = {
  USD: { label: 'US Dollar', perUsd: 1 },
  KES: { label: 'Kenyan Shilling', perUsd: 129.68 },
  TZS: { label: 'Tanzanian Shilling', perUsd: 2642.54 },
  UGX: { label: 'Ugandan Shilling', perUsd: 3947.48 }
};


window.getDisplayCurrency = function() {
  const selected = localStorage.getItem('pamoja_display_currency') || 'KES';
  return window.PAMOJA_CURRENCIES[selected] ? selected : 'KES';
};


window.convertKes = function(value, currency = window.getDisplayCurrency()) {
  const amountKes = Number(value || 0);
  const rate = window.PAMOJA_CURRENCIES[currency]?.perUsd;
  const kesPerUsd = window.PAMOJA_CURRENCIES.KES.perUsd;
  return Number.isFinite(rate) ? amountKes / kesPerUsd * rate : amountKes;
};


window.getMatchPricing = function(match) {
  const venuePricing = window.getVenuePricing(match);
  try {
    const matchPricing = JSON.parse(localStorage.getItem('pamoja_match_pricing') || '{}');
    return { ...venuePricing, ...(matchPricing[match.id] || {}) };
  } catch (error) {
    return venuePricing;
  }
};


window.getUnavailableSections = function(matchId) {
  try {
    const inventory = JSON.parse(localStorage.getItem('pamoja_match_unavailable_sections') || '{}');
    return new Set(inventory[matchId] || []);
  } catch (error) {
    return new Set();
  }
};


window.getTicketPrice = function(match, tier) {
  const pricing = window.getMatchPricing(match);
  return Number(pricing[tier] || 0);

};


window.money = function(value) {
  const currency = window.getDisplayCurrency();
  const amount = window.convertKes(value, currency);
  const digits = currency === 'USD' ? 2 : 0;
  return `${currency} ${amount.toLocaleString('en', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })}`;

};