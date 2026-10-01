document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.site-public-nav').forEach((nav, index) => {
    const inner = nav.querySelector('.site-public-nav-inner');
    const links = nav.querySelector('.site-public-nav-links');
    if (!inner || !links) return;

    let flags = nav.querySelector('.site-shell-flag-key');
    if (!flags) {
      flags = document.createElement('div');
      flags.className = 'site-shell-flag-key';
      flags.setAttribute('aria-label', 'Flag colors for Tanzania, Kenya and Uganda');
      flags.innerHTML = '<span class="flag-tz">Tanzania</span><span class="flag-ke">Kenya</span><span class="flag-ug">Uganda</span>';
      nav.insertBefore(flags, inner);
    }

    const menuId = `mobile-menu-${index + 1}`;
    let trigger = inner.querySelector('.site-mobile-menu-trigger');
    if (!trigger) {
      trigger = document.createElement('button');
      trigger.className = 'site-mobile-menu-trigger';
      trigger.type = 'button';
      trigger.innerHTML = '<span></span><span></span><span></span>';
      inner.appendChild(trigger);
    }
    trigger.setAttribute('aria-controls', menuId);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', 'Open navigation menu');

    const backdrop = document.createElement('button');
    backdrop.className = 'site-mobile-menu-backdrop';
    backdrop.type = 'button';
    backdrop.setAttribute('aria-label', 'Close navigation menu');

    const drawer = document.createElement('aside');
    drawer.className = 'site-mobile-menu-drawer';
    drawer.id = menuId;
    drawer.setAttribute('aria-label', 'Mobile navigation');
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.inert = true;
    drawer.innerHTML = '<div class="site-mobile-menu-heading"><span>AFCON PAMOJA 2026</span><button type="button" aria-label="Close navigation menu">&times;</button></div>';
    const drawerLinks = links.cloneNode(true);
    drawerLinks.classList.add('site-mobile-menu-links');
    drawer.appendChild(drawerLinks);

    const closeMenu = () => {
      document.body.classList.remove('mobile-menu-open');
      trigger.setAttribute('aria-expanded', 'false');
      drawer.style.transform = 'translateX(105%)';
      drawer.setAttribute('aria-hidden', 'true');
      drawer.inert = true;
      trigger.focus();
    };
    const openMenu = () => {
      document.body.classList.add('mobile-menu-open');
      trigger.setAttribute('aria-expanded', 'true');
      drawer.style.transform = 'none';
      drawer.setAttribute('aria-hidden', 'false');
      drawer.inert = false;
      drawer.querySelector('button').focus();
    };

    trigger.addEventListener('click', openMenu);
    backdrop.addEventListener('click', closeMenu);
    drawer.querySelector('button').addEventListener('click', closeMenu);
    drawer.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

    document.body.append(backdrop, drawer);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && trigger.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        trigger.focus();
      }
    });
  });
});
