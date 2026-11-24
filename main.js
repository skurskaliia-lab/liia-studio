/* liia.studio — interactions */
(function(){
  const d=document, html=d.documentElement;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop=()=>innerWidth>=1000;
  const hasG=!!window.gsap;
  if(hasG && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  let lenis=null;
  if(window.Lenis && !reduce){
    lenis=new Lenis({lerp:.09,smoothWheel:true});
    if(hasG){ lenis.on('scroll',ScrollTrigger.update); gsap.ticker.add(t=>lenis.raf(t*1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf=t=>{lenis.raf(t);requestAnimationFrame(raf)}; requestAnimationFrame(raf); }
  }

  /* ---------- curtain / page transitions ---------- */
  const cur=d.querySelector('.curtain');
  if(cur){
    if(hasG && !reduce){ gsap.to(cur,{yPercent:-100,duration:.9,ease:'expo.inOut',delay:.15}); }
    else cur.style.display='none';
    d.addEventListener('click',e=>{
      const a=e.target.closest('a'); if(!a) return;
      const href=a.getAttribute('href');
      if(!href||href.startsWith('#')||href.startsWith('mailto')||a.target==='_blank'||/^https?:/.test(href)||e.metaKey||e.ctrlKey) return;
      if(!hasG||reduce) return;
      e.preventDefault();
      gsap.fromTo(cur,{yPercent:100},{yPercent:0,duration:.6,ease:'expo.in',onComplete:()=>location.href=href});
    });
    addEventListener('pageshow',ev=>{ if(ev.persisted&&hasG) gsap.set(cur,{yPercent:-100}); });
  }

  /* ---------- mobile nav ---------- */
  const burger=d.querySelector('.burger'), mnav=d.querySelector('.mnav');
  if(burger&&mnav) burger.addEventListener('click',()=>mnav.classList.toggle('open'));

  /* ---------- footer reveal ---------- */
  const ftr=d.querySelector('.ftr'), main=d.querySelector('.reveal-main');
  function footerReveal(){
    if(!ftr||!main) return;
    if(desktop() && ftr.offsetHeight < innerHeight){ ftr.classList.add('is-fixed'); main.style.marginBottom=ftr.offsetHeight+'px'; }
    else { ftr.classList.remove('is-fixed'); main.style.marginBottom=''; }
  }
  footerReveal(); addEventListener('resize',footerReveal); addEventListener('load',footerReveal);

  /* ---------- copy email ---------- */
  const toast=d.createElement('div'); toast.className='toast'; toast.textContent='Email copied ✓'; d.body.appendChild(toast);
  d.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',()=>{
    navigator.clipboard&&navigator.clipboard.writeText(b.dataset.copy);
    toast.classList.add('on'); setTimeout(()=>toast.classList.remove('on'),1800);
  }));

  if(!hasG||reduce){ d.querySelectorAll('[data-rise],.gallery figure').forEach(e=>{e.style.opacity=1;e.style.transform='none';e.style.clipPath='none'}); return; }

  /* ---------- generic rise-in ---------- */
  d.querySelectorAll('[data-rise]').forEach(el=>{
    gsap.to(el,{opacity:1,y:0,duration:1.1,ease:'expo.out',scrollTrigger:{trigger:el,start:'top 88%'}});
  });
  d.querySelectorAll('.gallery figure').forEach((f,i)=>{
    gsap.to(f,{clipPath:'inset(0% 0 0 0)',opacity:1,duration:1.2,ease:'expo.out',delay:(i%3)*.08,scrollTrigger:{trigger:f,start:'top 92%'}});
  });

  /* ---------- HERO: intro + mouse + scroll parallax ---------- */
  const hero=d.querySelector('.hero, .ab-hero');
  if(hero){
    const cards=[...hero.querySelectorAll('.hero-card,.ab-photo,.sticker')];
    const word=hero.querySelectorAll('.hero-word span, .hello');
    gsap.from(cards,{scale:0,rotate:()=>gsap.utils.random(-40,40),duration:1.2,ease:'back.out(1.6)',stagger:.07,delay:.5});
    gsap.from(word,{yPercent:60,opacity:0,duration:1.2,ease:'expo.out',stagger:.06,delay:.4});
    gsap.from(hero.querySelectorAll('.hero-side'),{opacity:0,y:20,duration:1,delay:1.1,stagger:.1});
    // idle float
    cards.forEach((c,i)=>{
      gsap.to(c,{y:'+='+gsap.utils.random(-14,14),rotate:'+='+gsap.utils.random(-4,4),duration:gsap.utils.random(3,5),yoyo:true,repeat:-1,ease:'sine.inOut',delay:1.8+i*.1});
    });
    // mouse parallax
    const inner=cards.map(c=>{ const w=d.createElement('div'); while(c.firstChild) w.appendChild(c.firstChild); c.appendChild(w); return w; });
    hero.addEventListener('mousemove',e=>{
      const x=e.clientX/innerWidth-.5, y=e.clientY/innerHeight-.5;
      inner.forEach((w,i)=>{ const k=(+cards[i].dataset.depth||1); gsap.to(w,{x:x*40*k,y:y*30*k,duration:1.2,ease:'power3.out'}); });
    });
    // scroll: cards fly apart / up at different speeds
    cards.forEach(c=>{
      const k=(+c.dataset.depth||1);
      gsap.to(c,{yPercent:-60*k,rotate:'+='+(k*12*(Math.random()>.5?1:-1)),ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:true}});
    });
    const hw=hero.querySelector('.hero-word,.hello');
    if(hw) gsap.to(hw,{scale:.86,opacity:.3,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:true}});
    // cycle hellos on about
    const helloEl=hero.querySelector('[data-hellos]');
    if(helloEl){
      const words=helloEl.dataset.hellos.split('|'); let i=0;
      setInterval(()=>{ i=(i+1)%words.length; gsap.fromTo(helloEl,{yPercent:40,opacity:0},{yPercent:0,opacity:1,duration:.55,ease:'expo.out',onStart:()=>helloEl.textContent=words[i]}); },1300);
    }
  }

  /* ---------- burst helper (images pop from centre one after another) ---------- */
  function burst(box,srcs){
    box.innerHTML='';
    const imgs=srcs.map(s=>{const im=new Image(); im.src=s; im.alt=''; box.appendChild(im); return im;});
    gsap.killTweensOf(imgs);
    gsap.fromTo(imgs,{scale:0},{scale:1.01,duration:.55,ease:'back.out(1.4)',stagger:.09});
  }

  /* ---------- services list (home) — cursor-following burst ---------- */
  const svcs=d.querySelectorAll('.svc'); const bx=d.querySelector('.burst');
  if(svcs.length&&bx){
    const xTo=gsap.quickTo(bx,'x',{duration:.6,ease:'power3'}), yTo=gsap.quickTo(bx,'y',{duration:.6,ease:'power3'});
    addEventListener('mousemove',e=>{ xTo(e.clientX+24); yTo(e.clientY-bx.offsetHeight/2); });
    svcs.forEach(s=>{
      s.addEventListener('mouseenter',()=>{ bx.classList.add('on'); svcs.forEach(o=>o.classList.remove('on')); s.classList.add('on'); burst(bx,JSON.parse(s.dataset.imgs)); });
      s.addEventListener('mouseleave',()=>{ bx.classList.remove('on'); s.classList.remove('on'); });
    });
    gsap.from(svcs,{opacity:0,y:50,duration:1,ease:'expo.out',stagger:.08,scrollTrigger:{trigger:'.services',start:'top 70%'}});
  }

  /* ---------- services (about) — central stage burst ---------- */
  const lis=d.querySelectorAll('.svc2 li'), stage=d.querySelector('.stage'), stTxt=d.querySelector('.svc2 .txt span');
  if(lis.length&&stage){
    const act=li=>{ if(li.classList.contains('on')&&stage.childElementCount) return; lis.forEach(o=>o.classList.remove('on')); li.classList.add('on'); burst(stage,JSON.parse(li.dataset.imgs)); if(stTxt){ gsap.fromTo(stTxt,{opacity:0,y:10},{opacity:1,y:0,duration:.5}); stTxt.textContent=li.dataset.txt; } };
    lis.forEach(li=>{ li.addEventListener('mouseenter',()=>act(li)); li.addEventListener('click',()=>act(li)); });
    ScrollTrigger.create({trigger:'.svc2',start:'top 60%',once:true,onEnter:()=>act(lis[0])});
  }

  /* ---------- manifesto word fill + dots ---------- */
  const man=d.querySelector('.man-text');
  if(man){
    // split into words, keep inline tags
    const walk=n=>{ [...n.childNodes].forEach(c=>{ if(c.nodeType===3){ const f=d.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach(t=>{ if(!t) return; if(/^\s+$/.test(t)) f.appendChild(d.createTextNode(t)); else { const s=d.createElement('span'); s.className='w'; s.textContent=t; f.appendChild(s);} }); c.replaceWith(f);} else walk(c); }); };
    walk(man);
    const ws=man.querySelectorAll('.w');
    gsap.to(ws,{color:'#142019',stagger:.05,ease:'none',scrollTrigger:{trigger:man,start:'top 75%',end:'bottom 45%',scrub:true}});
  }
  d.querySelectorAll('.dots').forEach(box=>{
    const sec=box.parentElement; const n=+box.dataset.n||18; const dots=[];
    for(let i=0;i<n;i++){ const s=d.createElement('span'); if(box.dataset.blue||i%7===3) s.className='b'; s.style.left=gsap.utils.random(3,95)+'%'; s.style.top=gsap.utils.random(6,90)+'%'; s.style.setProperty('--s',gsap.utils.random(10,22)+'px'); box.appendChild(s); dots.push(s); }
    gsap.from(dots,{scale:0,duration:.8,ease:'back.out(3)',stagger:.04,scrollTrigger:{trigger:sec,start:'top 70%'}});
    dots.forEach(s=>gsap.to(s,{yPercent:gsap.utils.random(-400,400),ease:'none',scrollTrigger:{trigger:sec,start:'top bottom',end:'bottom top',scrub:true}}));
    sec.addEventListener('mousemove',e=>{
      dots.forEach(s=>{ const r=s.getBoundingClientRect(); const dx=r.left+r.width/2-e.clientX, dy=r.top+r.height/2-e.clientY; const dist=Math.hypot(dx,dy); if(dist<140){ const f=(140-dist)/140; gsap.to(s,{x:'+='+dx/dist*60*f,y:'+='+dy/dist*60*f,duration:.6,ease:'power3.out'}); } });
    });
  });

  /* ---------- pinned work accordion ---------- */
  const acc=d.querySelector('.acc');
  if(acc){
    const panels=[...acc.querySelectorAll('.panel')]; const bar=d.querySelector('.acc-progress b');
    let cur=-1; const set=i=>{ if(i===cur) return; cur=i; panels.forEach((p,j)=>p.classList.toggle('on',j===i)); };
    set(0);
    ScrollTrigger.matchMedia({'(min-width:1000px)':()=>{
      ScrollTrigger.create({trigger:'.acc-wrap',start:'top top',end:'+='+(panels.length*innerHeight*.7),pin:acc,scrub:true,
        onUpdate:self=>{ set(Math.min(panels.length-1,Math.floor(self.progress*panels.length*.999))); if(bar) bar.style.width=(self.progress*100)+'%'; }});
    }});
    panels.forEach((p,i)=>p.addEventListener('mouseenter',()=>{}));
  }

  /* ---------- strips / big titles ---------- */
  d.querySelectorAll('.mega, .case-h, .cta h2, .contact h1').forEach(t=>{
    gsap.from(t,{yPercent:30,opacity:0,duration:1.3,ease:'expo.out',delay:.6,scrollTrigger:{trigger:t,start:'top 90%'}});
  });
  d.querySelectorAll('.cta .hand').forEach(h=>gsap.from(h,{scale:.4,rotate:-20,opacity:0,duration:1.2,ease:'back.out(2)',scrollTrigger:{trigger:h,start:'top 85%'}}));

  /* ---------- work filters ---------- */
  const chips=d.querySelectorAll('.chip');
  chips.forEach(c=>c.addEventListener('click',()=>{
    chips.forEach(o=>o.classList.remove('on')); c.classList.add('on');
    const f=c.dataset.f; const cards=d.querySelectorAll('.grid .card');
    gsap.to(cards,{opacity:0,y:20,duration:.25,onComplete:()=>{
      cards.forEach(k=>k.classList.toggle('hide',f!=='all'&&!k.dataset.f.includes(f)));
      gsap.to([...cards].filter(k=>!k.classList.contains('hide')),{opacity:1,y:0,duration:.6,ease:'expo.out',stagger:.06});
      ScrollTrigger.refresh();
    }});
  }));
  const grid=d.querySelector('.grid');
  if(grid) gsap.from(grid.querySelectorAll('.card'),{opacity:0,y:60,duration:1.1,ease:'expo.out',stagger:.1,scrollTrigger:{trigger:grid,start:'top 85%'}});
  const thumbs=d.querySelector('.thumbs');
  if(thumbs){ gsap.from(thumbs.children,{y:-40,opacity:0,duration:1,ease:'expo.out',stagger:.06,delay:.5}); gsap.to(thumbs,{x:-120,ease:'none',scrollTrigger:{trigger:thumbs,start:'top top',end:'bottom top',scrub:true}}); }

  /* ---------- drag carousel ---------- */
  d.querySelectorAll('.rel-track').forEach(t=>{
    let down=false,sx=0,sl=0,moved=false;
    t.addEventListener('pointerdown',e=>{down=true;moved=false;sx=e.clientX;sl=t.scrollLeft;t.classList.add('drag')});
    addEventListener('pointerup',()=>{down=false;t.classList.remove('drag')});
    t.addEventListener('pointermove',e=>{ if(!down) return; const dx=e.clientX-sx; if(Math.abs(dx)>4) moved=true; t.scrollLeft=sl-dx; });
    t.addEventListener('click',e=>{ if(moved){e.preventDefault();e.stopPropagation();} },true);
  });

  /* ---------- footer fan intro ---------- */
  const fan=d.querySelector('.fan');
  if(fan) gsap.from(fan,{y:200,duration:1.2,ease:'expo.out',stagger:.07,scrollTrigger:{trigger:fan,start:'top 95%'}});

  addEventListener('load',()=>ScrollTrigger.refresh());
})();
