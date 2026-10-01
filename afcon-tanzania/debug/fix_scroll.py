import re, glob, os
base = r"c:\Users\user\Desktop\scrapper\mirrors\afcon-tanzania"
files = glob.glob(os.path.join(base, "*.html"))
GUARD = """<script id="afcon-scroll-fix">
/* Scroll-lock guard: loader / CMP / scraper snapshot left body locked */
(function(){
  function unlock(){
    try{
      document.body.style.overflow='';
      document.body.style.overflowY='';
      document.documentElement.style.overflow='';
      document.documentElement.style.overflowY='';
      document.body.classList.remove('no-scroll','scroll-lock','locked','modal-open');
      document.documentElement.classList.remove('no-scroll','scroll-lock','locked','modal-open');
      var l=document.getElementById('afcon-loader');
      if(l && getComputedStyle(l).display!=='none'){
        // only force-hide a stuck loader after 2.5s max
        setTimeout(function(){ l.style.display='none'; }, 2500);
      }
      // reveal fallback: if IntersectionObserver frozen, show content
      if(!('IntersectionObserver' in window)){
        document.querySelectorAll('.reveal,.reveal-left,.reveal-scale,.stagger-children').forEach(function(el){ el.classList.add('visible'); });
      }
    }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', unlock);
  else unlock();
  window.addEventListener('load', unlock);
  setTimeout(unlock, 1000);
  setTimeout(unlock, 2500);
})();
</script>
</body>"""
for f in files:
    s = open(f, encoding='utf-8', errors='ignore').read()
    orig = s
    # 1) Remove overflow:hidden / overflow hidden from BODY tag inline style only
    def fix_body(m):
        tag = m.group(0)
        # strip overflow: hidden / overflow:hidden / overflow-y:hidden declarations inside body tag
        tag2 = re.sub(r'(?i)\s*overflow(-[xy])?\s*:\s*hidden\s*;?', '', tag)
        # clean empty style=""
        tag2 = re.sub(r'\s*style="\s*;\s*"', '', tag2)
        tag2 = re.sub(r'\s*style="\s*"', '', tag2)
        # tidy leftover "; ;"
        tag2 = tag2.replace(';;',';')
        return tag2
    s = re.sub(r'(?is)<body[^>]*>', fix_body, s, count=1)
    # 2) Remove scraper freeze <style> blocks that kill animations/transitions (keep overflow-x rule)
    # Block A: *,*::before animation-delay/duration 0s + scroll-behavior auto
    s = re.sub(r'(?s)<style[^>]*>\s*\*,\s*\*::before,\s*\*::after\s*\{\s*animation-delay: 0s !important;.*?scroll-behavior:\s*auto !important;\s*\}\s*html\s*\{\s*scroll-behavior: auto !important;\s*\}\s*</style>', '', s)
    # Block B: html,body scroll-behavior + animation-play-state paused + transition none + caret transparent + img/svg visibility + max-width + overflow-x
    # -> replace with minimal safe rule (only overflow-x)
    def repl_freeze(m):
        return '<style>body{overflow-x:hidden !important;}</style>'
    s = re.sub(r'(?s)<style[^>]*>\s*html,\s*body\s*\{\s*scroll-behavior:\s*auto !important;.*?body\s*\{\s*overflow-x:\s*hidden !important;\s*\}\s*</style>', repl_freeze, s)
    # 3) Strip per-element scraper noise: ' animation-play-state: paused;' fragments (keep rest of style)
    s = s.replace('animation-play-state: paused;', '').replace('animation-play-state:paused;', '')
    s = s.replace('style="; ', 'style="').replace('style=" ;', 'style="').replace('style=" "', '')
    # 4) Neutralize CMP forced wrapper display:block (mirror offline -> overlay can block scroll)
    s = s.replace('div.cmpwrapper:empty, div.cmpwrapper, div#cmpwrapper.cmpwrapper, div#cmpwrapper.cmpwrapper:empty{ display: block !important;}',
                  'div#cmpwrapper.cmpwrapper{display:none !important;}div#cmpwrapper.cmpwrapper.cmp-show{display:block !important;}')
    # 5) Loader script: also clear any body overflow lock when loader dismisses + when seen
    s = s.replace("if (seen) { loader.style.display = 'none'; return; }",
                  "if (seen) { loader.style.display = 'none'; document.body.style.overflow=''; document.documentElement.style.overflow=''; return; }")
    s = s.replace("loader.style.display = 'none';\n           sessionStorage.setItem('afcon-loader-seen','1');",
                  "loader.style.display = 'none';\n           document.body.style.overflow=''; document.documentElement.style.overflow='';\n           try{sessionStorage.setItem('afcon-loader-seen','1');}catch(e){}")
    s = s.replace("loader.style.display = 'none';\n          sessionStorage.setItem('afcon-loader-seen','1');",
                  "loader.style.display = 'none';\n          document.body.style.overflow=''; document.documentElement.style.overflow='';\n          try{sessionStorage.setItem('afcon-loader-seen','1');}catch(e){}")
    # 6) Inject guard before </body> (once)
    if 'afcon-scroll-fix' not in s:
        s = s.replace('</body>', GUARD, 1)
    if s != orig:
        open(f, 'w', encoding='utf-8', newline='').write(s)
        print('FIXED', os.path.basename(f))
    else:
        print('NOCHANGE', os.path.basename(f))
print('done')
