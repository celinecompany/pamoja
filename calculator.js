(() => {
  'use strict';

  const flightRanges = {
    nigeria: [200, 450], ghana: [230, 480], ivoryCoast: [280, 520], senegal: [260, 500],
    cameroon: [250, 490], algeria: [280, 520], morocco: [300, 560], egypt: [250, 480],
    tunisia: [280, 530], southAfrica: [300, 580], ethiopia: [80, 200], kenya: [60, 160],
    uganda: [80, 180], rwanda: [100, 220], zambia: [150, 320], otherAfrica: [150, 420],
    uk: [650, 1100], netherlands: [580, 950], france: [600, 980], germany: [620, 1000],
    spain: [650, 1050], italy: [640, 1020], portugal: [660, 1080], belgium: [590, 960],
    sweden: [620, 1010], norway: [640, 1040], denmark: [610, 990], otherEurope: [600, 1050],
    uae: [180, 380], qatar: [180, 360], saudiArabia: [200, 400], otherMiddleEast: [200, 420],
    usa: [900, 1500], canada: [950, 1600], otherAmericas: [1000, 1700], china: [700, 1200],
    india: [500, 900], japan: [900, 1500], australia: [1000, 1700], otherAsia: [800, 1400]
  };

  const origins = [
    ['Nigeria', 'nigeria'], ['Ghana', 'ghana'], ["Cote d'Ivoire", 'ivoryCoast'], ['Senegal', 'senegal'],
    ['Cameroon', 'cameroon'], ['Algeria', 'algeria'], ['Morocco', 'morocco'], ['Egypt', 'egypt'],
    ['Tunisia', 'tunisia'], ['South Africa', 'southAfrica'], ['Ethiopia', 'ethiopia'], ['Kenya', 'kenya'],
    ['Uganda', 'uganda'], ['Rwanda', 'rwanda'], ['Zambia', 'zambia'], ['Other Africa', 'otherAfrica'],
    ['United Kingdom', 'uk'], ['Netherlands', 'netherlands'], ['France', 'france'], ['Germany', 'germany'],
    ['Spain', 'spain'], ['Italy', 'italy'], ['Portugal', 'portugal'], ['Belgium', 'belgium'],
    ['Sweden', 'sweden'], ['Norway', 'norway'], ['Denmark', 'denmark'], ['Other Europe', 'otherEurope'],
    ['United Arab Emirates', 'uae'], ['Qatar', 'qatar'], ['Saudi Arabia', 'saudiArabia'], ['Other Middle East', 'otherMiddleEast'],
    ['United States', 'usa'], ['Canada', 'canada'], ['Other Americas', 'otherAmericas'],
    ['China', 'china'], ['India', 'india'], ['Japan', 'japan'], ['Australia', 'australia'], ['Other Asia / Oceania', 'otherAsia']
  ];

  const questions = [
    {
      key: 'origin', title: 'Where are you travelling from?', note: 'Choose the closest origin for a return-flight planning range.',
      options: origins.map(([label, value]) => ({ label, value }))
    },
    {
      key: 'country', title: 'Which host country are you visiting?', note: 'Choose the country where you expect to attend matches.',
      options: [
        { label: 'Kenya (Nairobi)', value: 'kenya' },
        { label: 'Tanzania', value: 'tanzania' },
        { label: 'Uganda', value: 'uganda' },
        { label: 'Multiple countries', value: 'multiple' }
      ]
    },
    {
      key: 'matches', title: 'How many matches will you attend?', note: 'Ticket figures are provisional planning ranges, not official prices.',
      options: [{ label: '1 match', value: '1' }, { label: '2 matches', value: '2' }, { label: '3 matches', value: '3' }, { label: '4 or more matches', value: '4' }]
    },
    {
      key: 'stage', title: 'Which match stages are you planning for?', note: 'Later rounds use a higher estimated range.',
      options: [
        { label: 'Group stage', value: 'group' }, { label: 'Quarter-finals', value: 'quarters' },
        { label: 'Semi-finals', value: 'semis' }, { label: 'Final', value: 'final' }, { label: 'A mix of stages', value: 'mix' }
      ]
    },
    {
      key: 'hotel', title: 'What accommodation level suits you?', note: 'Nightly estimates are shown in USD.',
      options: [
        { label: 'Budget stay · $16–45 / night', value: 'budget' },
        { label: 'Mid-range · $60–130 / night', value: 'midrange' },
        { label: 'Upscale · $130–210 / night', value: 'upscale' },
        { label: 'Luxury · $200–420 / night', value: 'luxury' }
      ]
    },
    {
      key: 'nights', title: 'How many nights will you stay?', note: 'Choose your expected trip duration.',
      options: [3, 5, 7, 10, 14].map(nights => ({ label: `${nights} nights`, value: String(nights) }))
    },
    {
      key: 'daily', title: 'What daily spending style should we use?', note: 'Includes a broad estimate for food and local transport.',
      options: [
        { label: 'Lean · $15–30 / day', value: 'lean' },
        { label: 'Standard · $35–65 / day', value: 'standard' },
        { label: 'Comfortable · $70–130 / day', value: 'comfortable' }
      ]
    }
  ];

  const ticketRanges = {
    group: [10, 45], quarters: [20, 65], semis: [22, 80], final: [30, 120], mix: [15, 60]
  };
  const hotelRanges = {
    budget: [16, 45], midrange: [60, 130], upscale: [130, 210], luxury: [200, 420]
  };
  const dailyRanges = {
    lean: [15, 30], standard: [35, 65], comfortable: [70, 130]
  };

  const questionHost = document.getElementById('budget-question');
  const resultHost = document.getElementById('budget-result');
  const stepLabel = document.getElementById('budget-step-label');
  const progressPercent = document.getElementById('budget-progress-percent');
  const progressFill = document.getElementById('budget-progress-fill');
  const progressBar = document.querySelector('.calculator-progress');
  const backButton = document.getElementById('budget-back');
  const state = { step: 0, answers: {}, result: null };

  function renderQuestion() {
    const question = questions[state.step];
    const progress = Math.round(((state.step + 1) / questions.length) * 100);
    stepLabel.textContent = `Step ${state.step + 1} of ${questions.length}`;
    progressPercent.textContent = `${progress}%`;
    progressFill.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', String(state.step + 1));
    backButton.disabled = state.step === 0;
    questionHost.hidden = false;
    resultHost.hidden = true;
    questionHost.replaceChildren();

    const heading = document.createElement('h2');
    heading.textContent = question.title;
    const note = document.createElement('p');
    note.textContent = question.note;
    const options = document.createElement('div');
    options.className = 'budget-option-grid';

    question.options.forEach(option => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'budget-option';
      button.textContent = option.label;
      button.dataset.value = option.value;
      button.setAttribute('aria-pressed', String(state.answers[question.key] === option.value));
      button.addEventListener('click', () => {
        state.answers[question.key] = option.value;
        if (state.step === questions.length - 1) showResult();
        else {
          state.step += 1;
          renderQuestion();
        }
      });
      options.appendChild(button);
    });

    questionHost.append(heading, note, options);
  }

  function estimateBudget() {
    const answers = state.answers;
    const flight = flightRanges[answers.origin] || flightRanges.otherAfrica;
    const ticket = ticketRanges[answers.stage] || ticketRanges.group;
    const hotel = hotelRanges[answers.hotel] || hotelRanges.midrange;
    const daily = dailyRanges[answers.daily] || dailyRanges.standard;
    const matchCount = Number(answers.matches) || 1;
    const nights = Number(answers.nights) || 5;
    const ticketLow = ticket[0] * matchCount;
    const ticketHigh = ticket[1] * matchCount;
    const hotelLow = hotel[0] * nights;
    const hotelHigh = hotel[1] * nights;
    const dailyLow = daily[0] * nights;
    const dailyHigh = daily[1] * nights;
    const transfer = answers.country === 'multiple' ? [80, 180] : [0, 0];
    const subtotalLow = flight[0] + ticketLow + hotelLow + dailyLow + transfer[0];
    const subtotalHigh = flight[1] + ticketHigh + hotelHigh + dailyHigh + transfer[1];
    const reserveLow = Math.round(subtotalLow * .1);
    const reserveHigh = Math.round(subtotalHigh * .1);
    const bufferedLow = subtotalLow + reserveLow;
    const bufferedHigh = subtotalHigh + reserveHigh;
    const multiFactor = answers.country === 'multiple' ? 1.2 : 1;
    const totalLow = Math.round(flight[0] + (bufferedLow - flight[0]) * multiFactor);
    const totalHigh = Math.round(flight[1] + (bufferedHigh - flight[1]) * multiFactor);
    const countryNames = { kenya: 'Kenya (Nairobi)', tanzania: 'Tanzania', uganda: 'Uganda', multiple: 'multiple host countries' };
    return {
      flight, ticketLow, ticketHigh, hotelLow, hotelHigh, dailyLow, dailyHigh,
      transfer, reserveLow, reserveHigh, totalLow, totalHigh, matchCount, nights,
      country: countryNames[answers.country] || 'East Africa'
    };
  }

  function formatUsd(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  }

  function formatCurrency(amountUsd, currency) {
    const rate = window.PAMOJA_CURRENCIES[currency].perUsd;
    const digits = currency === 'USD' ? 2 : 0;
    return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: digits, minimumFractionDigits: digits }).format(amountUsd * rate);
  }

  function row(label, low, high, currency) {
    const item = document.createElement('div');
    item.className = 'budget-row';
    const name = document.createElement('span');
    name.textContent = label;
    const amount = document.createElement('strong');
    amount.textContent = `${formatUsd(low)} – ${formatUsd(high)} USD`;
    item.append(name, amount);
    if (currency !== 'USD') {
      const converted = document.createElement('strong');
      converted.textContent = `${formatCurrency(low, currency)} – ${formatCurrency(high, currency)}`;
      converted.style.gridColumn = '2';
      converted.style.color = '#075b34';
      item.appendChild(converted);
    }
    return item;
  }

  function renderResult(currency = 'KES') {
    const estimate = state.result;
    resultHost.replaceChildren();
    const head = document.createElement('div');
    head.className = 'budget-result-head';
    const titleGroup = document.createElement('div');
    const title = document.createElement('h2');
    title.textContent = 'Your PAMOJA trip range';
    const subtitle = document.createElement('p');
    subtitle.textContent = `${estimate.country} · ${estimate.matchCount} match${estimate.matchCount === 1 ? '' : 'es'} · ${estimate.nights} nights`;
    titleGroup.append(title, subtitle);

    const currencyLabel = document.createElement('label');
    currencyLabel.className = 'budget-currency';
    currencyLabel.textContent = 'Show estimate in';
    const currencySelect = document.createElement('select');
    currencySelect.id = 'budget-currency';
    ['USD', 'KES', 'TZS', 'UGX'].forEach(code => {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = code;
      option.selected = code === currency;
      currencySelect.appendChild(option);
    });
    currencyLabel.appendChild(currencySelect);
    head.append(titleGroup, currencyLabel);

    const total = document.createElement('div');
    total.className = 'budget-total';
    const totalLabel = document.createElement('span');
    totalLabel.textContent = 'Estimated total';
    const totalAmount = document.createElement('strong');
    totalAmount.textContent = `${formatUsd(estimate.totalLow)} – ${formatUsd(estimate.totalHigh)} USD`;
    total.append(totalLabel, totalAmount);
    const secondaryTotal = document.createElement('small');
    secondaryTotal.textContent = `${formatCurrency(estimate.totalLow, currency)} – ${formatCurrency(estimate.totalHigh, currency)} · planning-rate conversion`;
    total.appendChild(secondaryTotal);

    const breakdown = document.createElement('div');
    breakdown.className = 'budget-breakdown';
    breakdown.append(
      row('Return flights', estimate.flight[0], estimate.flight[1], currency),
      row(`Match tickets (${estimate.matchCount})`, estimate.ticketLow, estimate.ticketHigh, currency),
      row(`Accommodation (${estimate.nights} nights)`, estimate.hotelLow, estimate.hotelHigh, currency),
      row('Food and local transport', estimate.dailyLow, estimate.dailyHigh, currency)
    );
    if (estimate.transfer[1] > 0) breakdown.appendChild(row('Between-country travel', estimate.transfer[0], estimate.transfer[1], currency));
    breakdown.appendChild(row('10% contingency', estimate.reserveLow, estimate.reserveHigh, currency));

    const note = document.createElement('p');
    note.className = 'budget-note';
    note.textContent = 'This is a planning estimate, not a quote. Ticket ranges are based on benchmark examples and are not official prices. Flight and accommodation prices vary; cross-border arrangements and entry documents must be confirmed with official authorities.';

    const links = document.createElement('div');
    links.className = 'budget-result-links';
    links.innerHTML = '<a href="index.html#matches">Browse match tickets</a><a href="venues.html#venue-map">Explore host venues</a><a href="guide.html">Read the purchase guide</a>';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'calculator-button secondary';
    edit.textContent = 'Edit answers';
    edit.addEventListener('click', () => {
      state.step = questions.length - 1;
      renderQuestion();
    });

    resultHost.append(head, total, breakdown, note, links, edit);
    resultHost.hidden = false;
    questionHost.hidden = true;
    stepLabel.textContent = 'Estimate complete';
    progressPercent.textContent = '100%';
    progressFill.style.width = '100%';
    progressBar.setAttribute('aria-valuenow', String(questions.length));
    backButton.disabled = true;
    currencySelect.addEventListener('change', () => renderResult(currencySelect.value));
  }

  function showResult() {
    state.result = estimateBudget();
    renderResult();
  }

  backButton.addEventListener('click', () => {
    if (state.step > 0) {
      state.step -= 1;
      renderQuestion();
    }
  });

  document.getElementById('budget-reset').addEventListener('click', () => {
    state.step = 0;
    state.answers = {};
    state.result = null;
    renderQuestion();
  });

  renderQuestion();
})();
