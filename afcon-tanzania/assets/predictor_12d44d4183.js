(function () {
  'use strict';

  // ── AFCON 2027 QUALIFYING — 12 GROUPS · 48 NATIONS · 24 FINALS SLOTS ──────
  // CAF-confirmed draw. Standard groups qualify top 2. Host groups (D, H, L)
  // qualify only the highest-ranked non-host team.
  var STANDARD_GROUPS = [
    { id: 'A', name: 'Group A', teams: [
      { name: 'Morocco',   flag: '🇲🇦' },
      { name: 'Gabon',     flag: '🇬🇦' },
      { name: 'Niger',     flag: '🇳🇪' },
      { name: 'Lesotho',   flag: '🇱🇸' }
    ]},
    { id: 'B', name: 'Group B', teams: [
      { name: 'Egypt',       flag: '🇪🇬' },
      { name: 'Angola',      flag: '🇦🇴' },
      { name: 'Malawi',      flag: '🇲🇼' },
      { name: 'South Sudan', flag: '🇸🇸' }
    ]},
    { id: 'C', name: 'Group C', teams: [
      { name: "Côte d'Ivoire", flag: '🇨🇮' },
      { name: 'Ghana',         flag: '🇬🇭' },
      { name: 'The Gambia',    flag: '🇬🇲' },
      { name: 'Somalia',       flag: '🇸🇴' }
    ]},
    { id: 'E', name: 'Group E', teams: [
      { name: 'DR Congo',          flag: '🇨🇩' },
      { name: 'Equatorial Guinea', flag: '🇬🇶' },
      { name: 'Sierra Leone',      flag: '🇸🇱' },
      { name: 'Zimbabwe',          flag: '🇿🇼' }
    ]},
    { id: 'F', name: 'Group F', teams: [
      { name: 'Burkina Faso',        flag: '🇧🇫' },
      { name: 'Benin',               flag: '🇧🇯' },
      { name: 'Mauritania',          flag: '🇲🇷' },
      { name: 'Central African Rep.',flag: '🇨🇫' }
    ]},
    { id: 'G', name: 'Group G', teams: [
      { name: 'Cameroon', flag: '🇨🇲' },
      { name: 'Comoros',  flag: '🇰🇲' },
      { name: 'Namibia',  flag: '🇳🇦' },
      { name: 'Congo',    flag: '🇨🇬' }
    ]},
    { id: 'I', name: 'Group I', teams: [
      { name: 'Algeria', flag: '🇩🇿' },
      { name: 'Zambia',  flag: '🇿🇲' },
      { name: 'Togo',    flag: '🇹🇬' },
      { name: 'Burundi', flag: '🇧🇮' }
    ]},
    { id: 'J', name: 'Group J', teams: [
      { name: 'Senegal',    flag: '🇸🇳' },
      { name: 'Mozambique', flag: '🇲🇿' },
      { name: 'Sudan',      flag: '🇸🇩' },
      { name: 'Ethiopia',   flag: '🇪🇹' }
    ]},
    { id: 'K', name: 'Group K', teams: [
      { name: 'Mali',       flag: '🇲🇱' },
      { name: 'Cape Verde', flag: '🇨🇻' },
      { name: 'Rwanda',     flag: '🇷🇼' },
      { name: 'Liberia',    flag: '🇱🇷' }
    ]}
  ];

  // Host groups — Tanzania (L), Kenya (D), Uganda (H) auto-qualify.
  // Only 1 non-host team from each qualifies.
  var HOST_GROUPS = [
    { id: 'D', name: 'Group D — 🇰🇪 Kenya (host)', host: 'Kenya', hostFlag: '🇰🇪', teams: [
      { name: 'Kenya',        flag: '🇰🇪', host: true },
      { name: 'South Africa', flag: '🇿🇦' },
      { name: 'Guinea',       flag: '🇬🇳' },
      { name: 'Eritrea',      flag: '🇪🇷' }
    ]},
    { id: 'H', name: 'Group H — 🇺🇬 Uganda (host)', host: 'Uganda', hostFlag: '🇺🇬', teams: [
      { name: 'Uganda',   flag: '🇺🇬', host: true },
      { name: 'Tunisia',  flag: '🇹🇳' },
      { name: 'Libya',    flag: '🇱🇾' },
      { name: 'Botswana', flag: '🇧🇼' }
    ]},
    { id: 'L', name: 'Group L — 🇹🇿 Tanzania (host)', host: 'Tanzania', hostFlag: '🇹🇿', teams: [
      { name: 'Tanzania',      flag: '🇹🇿', host: true },
      { name: 'Nigeria',       flag: '🇳🇬' },
      { name: 'Madagascar',    flag: '🇲🇬' },
      { name: 'Guinea-Bissau', flag: '🇬🇼' }
    ]}
  ];

  // ── STATE ──────────────────────────────────────────────────────────────────
  var state = { standardSelections: {}, hostSelections: {}, champion: null, step: 'groups' };

  // ── INIT ───────────────────────────────────────────────────────────────────
  function init() {
    var el = document.getElementById('afcon-predictor');
    if (!el) return;
    if (el.getAttribute('data-pred-init') === '1') return;
    el.setAttribute('data-pred-init', '1');
    renderStandardGroups();
    renderHostGroups();
    bindClicks();
    bindNavButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function esc(s) { return String(s).replace(/"/g, '&quot;'); }

  // ── STANDARD GROUPS (pick 2 from each) ─────────────────────────────────────
  function renderStandardGroups() {
    var grid = document.getElementById('groups-grid');
    if (!grid) return;
    grid.innerHTML = '';
    STANDARD_GROUPS.forEach(function (group) {
      var card = document.createElement('div');
      card.className = 'afcon-pred__group';
      card.setAttribute('data-group', group.id);
      var teamsHtml = group.teams.map(function (t) {
        return '<div class="afcon-pred__team" data-mode="standard"' +
          ' data-group="' + group.id + '" data-team="' + esc(t.name) + '" data-flag="' + t.flag + '"' +
          ' role="button" tabindex="0">' +
          '<span class="afcon-pred__team-flag">' + t.flag + '</span>' +
          '<span class="afcon-pred__team-name">' + t.name + '</span>' +
          '<span class="afcon-pred__team-check">✓</span></div>';
      }).join('');
      card.innerHTML =
        '<div class="afcon-pred__group-header">' + group.name + '</div>' +
        '<div class="afcon-pred__group-teams">' + teamsHtml + '</div>' +
        '<div class="afcon-pred__group-count" id="count-std-' + group.id + '">Pick 2 to qualify</div>';
      grid.appendChild(card);
    });
  }

  // ── HOST GROUPS (pick 1 non-host) ──────────────────────────────────────────
  function renderHostGroups() {
    var grid = document.getElementById('host-groups-grid');
    if (!grid) return;
    grid.innerHTML = '';
    HOST_GROUPS.forEach(function (group) {
      var card = document.createElement('div');
      card.className = 'afcon-pred__group afcon-pred__group--host';
      card.setAttribute('data-group', group.id);
      var teamsHtml = group.teams.map(function (t) {
        if (t.host) {
          return '<div class="afcon-pred__team host-auto"' +
            ' data-team="' + esc(t.name) + '" data-flag="' + t.flag + '">' +
            '<span class="afcon-pred__team-flag">' + t.flag + '</span>' +
            '<span class="afcon-pred__team-name">' + t.name + ' 🏠</span>' +
            '<span class="afcon-pred__team-badge">Auto</span></div>';
        }
        return '<div class="afcon-pred__team" data-mode="host"' +
          ' data-group="' + group.id + '" data-team="' + esc(t.name) + '" data-flag="' + t.flag + '"' +
          ' role="button" tabindex="0">' +
          '<span class="afcon-pred__team-flag">' + t.flag + '</span>' +
          '<span class="afcon-pred__team-name">' + t.name + '</span>' +
          '<span class="afcon-pred__team-check">✓</span></div>';
      }).join('');
      card.innerHTML =
        '<div class="afcon-pred__group-header">' + group.name + '</div>' +
        '<div class="afcon-pred__group-teams">' + teamsHtml + '</div>' +
        '<div class="afcon-pred__group-count" id="count-host-' + group.id + '">Pick 1 non-host to qualify</div>';
      grid.appendChild(card);
    });
  }

  // ── CLICK HANDLERS ─────────────────────────────────────────────────────────
  function bindClicks() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest('.afcon-pred__team');
      if (!t || t.classList.contains('host-auto')) return;
      var mode = t.getAttribute('data-mode');
      if (mode === 'standard') handleStandardPick(t);
      else if (mode === 'host') handleHostPick(t);
      else if (t.classList.contains('winner-choice')) handleChampionPick(t);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        var t = e.target.closest('.afcon-pred__team');
        if (t && !t.classList.contains('host-auto')) { e.preventDefault(); t.click(); }
      }
    });
  }

  function handleStandardPick(el) {
    var gid = el.getAttribute('data-group');
    var name = el.getAttribute('data-team');
    var flag = el.getAttribute('data-flag');
    if (!state.standardSelections[gid]) state.standardSelections[gid] = [];
    var sel = state.standardSelections[gid];
    var idx = sel.findIndex(function (s) { return s.name === name; });
    if (idx > -1) {
      sel.splice(idx, 1);
      el.classList.remove('selected');
    } else {
      if (sel.length >= 2) return;
      sel.push({ name: name, flag: flag });
      el.classList.add('selected');
    }
    updateStandardCount(gid);
    updateContinueBtn();
  }

  function handleHostPick(el) {
    var gid = el.getAttribute('data-group');
    var name = el.getAttribute('data-team');
    var flag = el.getAttribute('data-flag');
    var currentSel = state.hostSelections[gid];
    if (currentSel && currentSel.name === name) {
      // Deselect
      state.hostSelections[gid] = null;
      el.classList.remove('selected');
    } else {
      // Clear other selections in this group
      var groupEl = document.querySelector('.afcon-pred__group[data-group="' + gid + '"]');
      if (groupEl) {
        groupEl.querySelectorAll('.afcon-pred__team.selected').forEach(function (e) {
          e.classList.remove('selected');
        });
      }
      state.hostSelections[gid] = { name: name, flag: flag };
      el.classList.add('selected');
    }
    updateHostCount(gid);
    updateContinueBtn();
  }

  function updateStandardCount(gid) {
    var el = document.getElementById('count-std-' + gid);
    if (!el) return;
    var sel = state.standardSelections[gid] || [];
    if (sel.length === 2) {
      el.textContent = '✓ ' + sel.map(function (s) { return s.flag + ' ' + s.name; }).join(' & ');
      el.className = 'afcon-pred__group-count complete';
    } else {
      el.textContent = 'Pick ' + (2 - sel.length) + ' more';
      el.className = 'afcon-pred__group-count';
    }
  }

  function updateHostCount(gid) {
    var el = document.getElementById('count-host-' + gid);
    if (!el) return;
    var sel = state.hostSelections[gid];
    if (sel) {
      el.textContent = '✓ ' + sel.flag + ' ' + sel.name + ' joins the host';
      el.className = 'afcon-pred__group-count complete';
    } else {
      el.textContent = 'Pick 1 non-host to qualify';
      el.className = 'afcon-pred__group-count';
    }
  }

  function updateContinueBtn() {
    var btn = document.getElementById('btn-to-result');
    var standardComplete = STANDARD_GROUPS.every(function (g) {
      return (state.standardSelections[g.id] || []).length === 2;
    });
    var hostComplete = HOST_GROUPS.every(function (g) { return !!state.hostSelections[g.id]; });
    if (btn) btn.disabled = !(standardComplete && hostComplete);
  }

  // ── RESULT ─────────────────────────────────────────────────────────────────
  function buildQualifiersList() {
    var qualifiers = [];
    // Auto-qualified hosts
    HOST_GROUPS.forEach(function (g) {
      qualifiers.push({ name: g.host, flag: g.hostFlag, tag: '🏠 Host', groupId: g.id });
    });
    // Non-host qualifiers from host groups
    HOST_GROUPS.forEach(function (g) {
      var pick = state.hostSelections[g.id];
      if (pick) qualifiers.push({ name: pick.name, flag: pick.flag, tag: 'Group ' + g.id, groupId: g.id });
    });
    // Top 2 from each standard group
    STANDARD_GROUPS.forEach(function (g) {
      var picks = state.standardSelections[g.id] || [];
      picks.forEach(function (p) {
        qualifiers.push({ name: p.name, flag: p.flag, tag: 'Group ' + g.id, groupId: g.id });
      });
    });
    return qualifiers;
  }

  function renderResult() {
    var qualifiers = buildQualifiersList();
    var listEl = document.getElementById('qualifiers-list');
    if (!listEl) return;
    listEl.innerHTML = qualifiers.map(function (q) {
      var isHost = q.tag === '🏠 Host';
      return '<div class="afcon-pred__qualifier' + (isHost ? ' afcon-pred__qualifier--host' : '') + '">' +
        '<span class="afcon-pred__qualifier-flag">' + q.flag + '</span>' +
        '<span class="afcon-pred__qualifier-name">' + q.name + '</span>' +
        '<span class="afcon-pred__qualifier-tag">' + q.tag + '</span>' +
        '</div>';
    }).join('');

    // Winner picker
    var winnerPicker = document.getElementById('winner-picker');
    if (winnerPicker) {
      winnerPicker.innerHTML = qualifiers.map(function (q) {
        return '<div class="afcon-pred__team winner-choice" data-team="' + esc(q.name) + '" data-flag="' + q.flag + '" role="button" tabindex="0">' +
          '<span class="afcon-pred__team-flag">' + q.flag + '</span>' +
          '<span class="afcon-pred__team-name">' + q.name + '</span>' +
          '<span class="afcon-pred__team-check">🏆</span></div>';
      }).join('');
    }
  }

  function handleChampionPick(el) {
    var name = el.getAttribute('data-team');
    var flag = el.getAttribute('data-flag');
    document.querySelectorAll('.winner-choice').forEach(function (e) { e.classList.remove('selected'); });
    el.classList.add('selected');
    state.champion = { name: name, flag: flag };
    var reveal = document.getElementById('champion-reveal');
    var nameEl = document.getElementById('champion-name');
    if (reveal && nameEl) {
      nameEl.textContent = flag + ' ' + name;
      reveal.classList.remove('afcon-pred__champion-reveal--hidden');
    }
  }

  // ── NAV ────────────────────────────────────────────────────────────────────
  function bindNavButtons() {
    document.addEventListener('click', function (e) {
      if (e.target.id === 'btn-to-result') {
        renderResult();
        showSection('pred-result');
        setProgress(100);
        scrollTo('pred-result');
      }
      if (e.target.id === 'btn-reset') resetAll();
      if (e.target.id === 'btn-share-twitter') shareTwitter();
      if (e.target.id === 'btn-copy') copyResult();
    });
  }

  function showSection(id) {
    var sections = ['pred-groups', 'pred-result'];
    sections.forEach(function (s) {
      var el = document.getElementById(s);
      if (!el) return;
      el.classList.toggle('afcon-pred__section--hidden', s !== id);
    });
  }

  function setProgress(pct) {
    var fill = document.getElementById('pred-progress');
    if (fill) fill.style.width = pct + '%';
  }

  function scrollTo(id) {
    var el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 20, behavior: 'smooth' });
  }

  function shareTwitter() {
    var qualifiers = buildQualifiersList();
    var champion = state.champion;
    var text;
    if (champion) {
      text = 'My AFCON 2027 prediction:\n🏆 Champion: ' + champion.flag + ' ' + champion.name + '\n\nAll 24 qualifiers picked ✅\n\nMake yours:\nafcontanzaniaguide.com/afcon-2027-predictor\n#AFCON2027 #PAMOJA2027';
    } else {
      text = 'I just picked all 24 AFCON 2027 qualifiers! 🇹🇿🇰🇪🇺🇬\n\nMake yours:\nafcontanzaniaguide.com/afcon-2027-predictor\n#AFCON2027 #PAMOJA2027';
    }
    window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text), '_blank');
  }

  function copyResult() {
    var qualifiers = buildQualifiersList();
    var champion = state.champion;
    var list = qualifiers.map(function (q) { return q.flag + ' ' + q.name; }).join(', ');
    var text = 'My AFCON 2027 prediction: ' + list;
    if (champion) text += ' | 🏆 Champion: ' + champion.flag + ' ' + champion.name;
    text += ' | afcontanzaniaguide.com/afcon-2027-predictor';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () {
        var btn = document.getElementById('btn-copy');
        var orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(function () { btn.textContent = orig; }, 2000);
      });
    }
  }

  function resetAll() {
    state = { standardSelections: {}, hostSelections: {}, champion: null, step: 'groups' };
    document.querySelectorAll('.afcon-pred__team.selected').forEach(function (el) { el.classList.remove('selected'); });
    document.querySelectorAll('.afcon-pred__group-count').forEach(function (el) {
      var isHost = el.id.indexOf('count-host-') === 0;
      el.textContent = isHost ? 'Pick 1 non-host to qualify' : 'Pick 2 to qualify';
      el.className = 'afcon-pred__group-count';
    });
    var btn = document.getElementById('btn-to-result');
    if (btn) btn.disabled = true;
    var reveal = document.getElementById('champion-reveal');
    if (reveal) reveal.classList.add('afcon-pred__champion-reveal--hidden');
    ['pred-groups', 'pred-result'].forEach(function (s) {
      var el = document.getElementById(s);
      if (el) el.classList.toggle('afcon-pred__section--hidden', s !== 'pred-groups');
    });
    setProgress(33);
    scrollTo('afcon-predictor');
  }

})();
