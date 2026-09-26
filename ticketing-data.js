/**
 * AFCON PAMOJA
 * Shared ticketing configuration
 *
 * This file is intentionally independent from the UI.
 * index.html and tickets.html both consume this data.
 */

window.TICKETING_DATA = {
  currency: 'KES',
  serviceLevyRate: 0.16,

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
      availability: 'High demand',
      sold: 51240
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
      availability: 'VIP only remaining',
      sold: 26800
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
      availability: 'Selling fast',
      sold: 13800
    }
  ],

  venues: {

    /**
     * Large-bowl configuration.
     *
     * More sections, longer rows and more seats per row.
     */
    kasarani: {
      name: 'Moi International Sports Centre, Kasarani',
      shortName: 'Kasarani Stadium',
      city: 'Nairobi, Kenya',
      capacity: 60000,
      layout: 'large-bowl',

      description:
        'A large multi-tier stadium layout with continuous north, east and south seating and a larger premium west grandstand.',

      stands: [
        {
          key: 'north',
          name: 'North Stand',
          tier: 'Category 3',
          price: 1000,
          sections: 12,
          rows: 14,
          seatsPerRow: 18,
          shape: 'end'
        },

        {
          key: 'east',
          name: 'East Stand',
          tier: 'Category 2',
          price: 1800,
          sections: 18,
          rows: 16,
          seatsPerRow: 20,
          shape: 'long'
        },

        {
          key: 'south',
          name: 'South Stand',
          tier: 'Category 3',
          price: 1000,
          sections: 12,
          rows: 14,
          seatsPerRow: 18,
          shape: 'end'
        },

        {
          key: 'west',
          name: 'West Grandstand',
          tier: 'Category 1',
          price: 3000,
          sections: 14,
          rows: 18,
          seatsPerRow: 20,
          shape: 'premium'
        }
      ]
    },


    /**
     * Smaller athletics-bowl configuration.
     */
    nyayo: {
      name: 'Nyayo National Stadium',
      shortName: 'Nyayo Stadium',
      city: 'Nairobi, Kenya',
      capacity: 30000,
      layout: 'athletics-bowl',

      description:
        'A more compact oval-style stadium configuration with shorter seating blocks and a dedicated premium west grandstand.',

      stands: [
        {
          key: 'north',
          name: 'North Stand',
          tier: 'Category 3',
          price: 1000,
          sections: 8,
          rows: 10,
          seatsPerRow: 16,
          shape: 'curve'
        },

        {
          key: 'east',
          name: 'East Stand',
          tier: 'Category 2',
          price: 1800,
          sections: 10,
          rows: 12,
          seatsPerRow: 18,
          shape: 'curve'
        },

        {
          key: 'south',
          name: 'South Stand',
          tier: 'Category 3',
          price: 1000,
          sections: 8,
          rows: 10,
          seatsPerRow: 16,
          shape: 'curve'
        },

        {
          key: 'west',
          name: 'West Grandstand',
          tier: 'VIP / Category 1',
          price: 3500,
          sections: 8,
          rows: 14,
          seatsPerRow: 18,
          shape: 'premium'
        }
      ]
    },


    /**
     * Compact venue configuration.
     *
     * Fewer sections and shorter seating blocks make this
     * intentionally different from the two Nairobi venues.
     */
    eldoret: {
      name: 'Kipchoge Keino Stadium',
      shortName: 'Kipchoge Keino Stadium',
      city: 'Eldoret, Kenya',
      capacity: 15000,
      layout: 'compact-bowl',

      description:
        'A smaller, more intimate bowl with fewer sections and shorter seating blocks for faster navigation.',

      stands: [
        {
          key: 'north',
          name: 'North Stand',
          tier: 'Category 3',
          price: 800,
          sections: 5,
          rows: 8,
          seatsPerRow: 14,
          shape: 'end'
        },

        {
          key: 'east',
          name: 'East Stand',
          tier: 'Category 2',
          price: 1400,
          sections: 6,
          rows: 9,
          seatsPerRow: 16,
          shape: 'long'
        },

        {
          key: 'south',
          name: 'South Stand',
          tier: 'Category 3',
          price: 800,
          sections: 5,
          rows: 8,
          seatsPerRow: 14,
          shape: 'end'
        },

        {
          key: 'west',
          name: 'Main Grandstand',
          tier: 'VIP / Category 1',
          price: 2500,
          sections: 5,
          rows: 10,
          seatsPerRow: 16,
          shape: 'premium'
        }
      ]
    }
  }
};


/* ============================================================
   Public helpers
============================================================ */

window.getMatch = function getMatch(matchId) {
  return window.TICKETING_DATA.matches.find(
    match => match.id === matchId
  ) || window.TICKETING_DATA.matches[0];
};


window.getVenue = function getVenue(match) {
  if (!match) {
    return null;
  }

  return window.TICKETING_DATA.venues[match.venueKey] || null;
};


window.money = function money(value) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: window.TICKETING_DATA.currency,
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
};


window.ticketingCapacity = function ticketingCapacity(venue) {
  if (!venue) {
    return 0;
  }

  return Number(venue.capacity) || 0;
};