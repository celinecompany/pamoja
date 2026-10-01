/* AFCON Tanzania Guide v3.0 — main.js */
(function(){
'use strict';
var THEME_KEY='afcon-theme';
var defaultTheme=(typeof afconData!=='undefined')?afconData.defaultTheme:'dark';
var currentTheme=localStorage.getItem(THEME_KEY)||defaultTheme;

function applyTheme(t){
  document.body.classList.toggle('light-theme',t==='light');
  document.documentElement.classList.remove('light-theme-preload');
  localStorage.setItem(THEME_KEY,t);
  currentTheme=t;
}

/* ── Scroll reveal observer ── */
function initReveal(){
  if(!window.IntersectionObserver) return;
  var opts={threshold:0.12,rootMargin:'0px 0px -40px 0px'};
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  },opts);

  /* Auto-mark sections with reveal classes */
  document.querySelectorAll('.section-heading').forEach(function(el){
    el.classList.add('reveal');
    obs.observe(el);
  });
  document.querySelectorAll('.cities-grid').forEach(function(el){
    el.classList.add('stagger-children');
    obs.observe(el);
  });
  document.querySelectorAll('.fixture-list').forEach(function(el){
    el.classList.add('reveal');
    obs.observe(el);
  });
  document.querySelectorAll('.updates-feed').forEach(function(el){
    el.classList.add('stagger-children');
    obs.observe(el);
  });
  document.querySelectorAll('.quicklinks-grid').forEach(function(el){
    el.classList.add('stagger-children');
    obs.observe(el);
  });
  document.querySelectorAll('.stadiums-grid').forEach(function(el){
    el.classList.add('stagger-children');
    obs.observe(el);
  });
  document.querySelectorAll('.venue-grid').forEach(function(el){
    el.classList.add('stagger-children');
    obs.observe(el);
  });
  document.querySelectorAll('.listings-grid').forEach(function(el){
    el.classList.add('stagger-children');
    obs.observe(el);
  });
  document.querySelectorAll('.pamoja-banner,.list-cta-strip').forEach(function(el){
    el.classList.add('reveal-scale');
    obs.observe(el);
  });
  document.querySelectorAll('.accordion').forEach(function(el){
    el.classList.add('stagger-children');
    obs.observe(el);
  });
  document.querySelectorAll('.contact-layout > *').forEach(function(el,i){
    el.classList.add(i===0?'reveal-left':'reveal');
    el.style.transitionDelay=(i*0.12)+'s';
    obs.observe(el);
  });
  document.querySelectorAll('.card,.contact-info-card').forEach(function(el){
    if(!el.closest('.stagger-children')){
      el.classList.add('reveal');
      obs.observe(el);
    }
  });
}

document.addEventListener('DOMContentLoaded',function(){
  applyTheme(currentTheme);

  var btn=document.getElementById('theme-toggle');
  if(btn) btn.addEventListener('click',function(){applyTheme(currentTheme==='dark'?'light':'dark');});

  var ham=document.getElementById('hamburger');
  var nav=document.getElementById('main-nav');
  if(ham&&nav) ham.addEventListener('click',function(){var o=nav.classList.toggle('is-open');ham.setAttribute('aria-expanded',o);});

  /* Countdown */
  var dateStr=(typeof afconData!=='undefined')?afconData.tournamentDate:'2027-06-19T17:00:00Z';
  var target=new Date(dateStr);
  function tick(){
    var diff=target-new Date();
    if(diff<=0)return;
    var d=Math.floor(diff/86400000),h=Math.floor((diff%86400000)/3600000),m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);
    var e=function(id){return document.getElementById(id);};
    if(e('cd-d'))e('cd-d').textContent=d;
    if(e('cd-h'))e('cd-h').textContent=String(h).padStart(2,'0');
    if(e('cd-m'))e('cd-m').textContent=String(m).padStart(2,'0');
    if(e('cd-s'))e('cd-s').textContent=String(s).padStart(2,'0');
  }
  tick();setInterval(tick,1000);

  /* Accordions */
  document.querySelectorAll('.accordion-header').forEach(function(hdr){
    hdr.addEventListener('click',function(){
      var item=hdr.closest('.accordion-item');
      item.classList.toggle('open');
      hdr.setAttribute('aria-expanded',item.classList.contains('open'));
    });
  });

  /* City tabs */
  document.querySelectorAll('.city-tab-btn').forEach(function(b){
    b.addEventListener('click',function(){
      var tgt=b.getAttribute('data-city');
      document.querySelectorAll('.city-tab-btn').forEach(function(x){x.classList.remove('active');});
      document.querySelectorAll('.city-panel').forEach(function(p){p.classList.remove('active');});
      b.classList.add('active');
      var p=document.getElementById('city-'+tgt);
      if(p)p.classList.add('active');
    });
  });

  /* Listing filters */
  document.querySelectorAll('.filter-btn').forEach(function(b){
    b.addEventListener('click',function(){
      document.querySelectorAll('.filter-btn').forEach(function(x){x.classList.remove('active');});
      b.classList.add('active');
      var cat=b.getAttribute('data-cat');
      document.querySelectorAll('.listing-card[data-cat]').forEach(function(c){
        c.style.display=(cat==='all'||c.getAttribute('data-cat')===cat)?'':'none';
      });
    });
  });

  /* Contact form */
  var form=document.getElementById('contact-form');
  var suc=document.getElementById('form-success');
  var sub=document.getElementById('form-submit-btn');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var n=document.getElementById('contact-name').value.trim();
      var em=document.getElementById('contact-email').value.trim();
      var msg=document.getElementById('contact-message').value.trim();
      var err=document.getElementById('form-error');
      if(!n||!em||!msg){if(err){err.textContent='Please fill in all required fields.';err.style.display='block';}return;}
      if(err)err.style.display='none';
      if(sub){sub.textContent='Sending...';sub.disabled=true;}
      if(typeof afconData!=='undefined'){
        var fd=new FormData(form);fd.append('action','afcon_contact');fd.append('nonce',afconData.nonce);
        fetch(afconData.ajaxurl,{method:'POST',body:fd}).then(function(r){return r.json();}).then(function(res){
          if(res.success){form.style.display='none';if(suc)suc.style.display='block';}
          else{if(err){err.textContent=res.data.message||'Something went wrong.';err.style.display='block';}if(sub){sub.textContent='Send Message';sub.disabled=false;}}
        }).catch(function(){if(err){err.textContent='Network error. Please try again.';err.style.display='block';}if(sub){sub.textContent='Send Message';sub.disabled=false;}});
      }else{setTimeout(function(){form.style.display='none';if(suc)suc.style.display='block';},900);}
    });
  }

  /* Sticky header shadow */
  var header=document.getElementById('site-header');
  if(header)window.addEventListener('scroll',function(){header.style.boxShadow=window.scrollY>10?'0 2px 20px rgba(0,0,0,0.15)':'';},{passive:true});

  /* Init scroll reveals (slight delay so page paints first) */
  setTimeout(initReveal, 80);
});
})();
