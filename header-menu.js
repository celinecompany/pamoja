document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.site-public-nav').forEach((nav) => {
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

    const menuId = `mobile-menu-${Math.random().toString(36).slice(2)}`;
    const trigger = document.createElement('button');
    trigger.className = 'site-mobile-menu-trigger';
    trigger.type = 'button';
    trigger.setAttribute('aria-controls', menuId);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', 'Open navigation menu');
    trigger.innerHTML = '<span></span><span></span><span></span>';

    const backdrop = document.createElement('button');
    backdrop.className = 'site-mobile-menu-backdrop';
    backdrop.type = 'button';
    backdrop.setAttribute('aria-label', 'Close navigation menu');

    const drawer = document.createElement('aside');
    drawer.className = 'site-mobile-menu-drawer';
    drawer.id = menuId;
    drawer.setAttribute('aria-label', 'Mobile navigation');
    drawer.innerHTML = '<div class="site-mobile-menu-heading"><span>AFCON PAMOJA 2026</span><button type="button" aria-label="Close navigation menu">&times;</button></div>';
    const drawerLinks = links.cloneNode(true);
    drawerLinks.classList.add('site-mobile-menu-links');
    drawer.appendChild(drawerLinks);

    const closeMenu = () => {
      document.body.classList.remove('mobile-menu-open');
      trigger.setAttribute('aria-expanded', 'false');
      drawer.style.transform = 'translateX(105%)';
    };
    const openMenu = () => {
      document.body.classList.add('mobile-menu-open');
      trigger.setAttribute('aria-expanded', 'true');
      drawer.style.transform = 'none';
    };

    trigger.addEventListener('click', openMenu);
    backdrop.addEventListener('click', closeMenu);
    drawer.querySelector('button').addEventListener('click', closeMenu);
    drawer.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

    inner.appendChild(trigger);
    document.body.append(backdrop, drawer);
  });
});
