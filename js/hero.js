(function(){
  const section = document.querySelector('.hero');
  const bg = section.querySelector('.hero-bg');
  const floatersHost = section.querySelector('.hero-floaters');

  // --------------------------
  // Floating objects (dots)
  // --------------------------
  const count = parseInt(getComputedStyle(section).getPropertyValue('--floater-count')) || 12;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rand(min, max){ return Math.random() * (max - min) + min; }

  function createFloaters(){
    const hostRect = section.getBoundingClientRect();
    const min = parseFloat(getComputedStyle(section).getPropertyValue('--floater-min')) || 8;
    const max = parseFloat(getComputedStyle(section).getPropertyValue('--floater-max')) || 22;

    for(let i=0;i<count;i++){
      const el = document.createElement('span');
      el.className = 'floater';
      const size = rand(min, max);
      const left = rand(0, hostRect.width - size);
      const top = rand(0, hostRect.height - size);

      // Alternate colors for a bit of variety
      const color = i % 2 === 0
        ? getComputedStyle(section).getPropertyValue('--floater-color') || '#5c8df6'
        : getComputedStyle(section).getPropertyValue('--floater-color-2') || '#00bfa6';

      el.style.setProperty('--size', `${size}px`);
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
      el.style.setProperty('--dot-color', color.trim());
      el.style.setProperty('--dur', `${rand(12, 22)}s`);
      el.style.setProperty('--delay', `${rand(-8, 6)}s`);
      el.style.setProperty('--yStart', `${rand(-40, 40)}px`);
      el.style.setProperty('--yEnd', `${rand(60, 180)}px`);
      el.style.setProperty('--xStart', `${rand(-30, 30)}px`);
      el.style.setProperty('--xEnd', `${rand(50, 140)}px`);

      if(prefersReduced){
        // Place them statically if user prefers reduced motion
        el.style.animation = 'none';
      }
      floatersHost.appendChild(el);
    }
  }

  // --------------------------
  // Parallax background (no crop)
  // We translate the bg wrapper slightly. We keep the IMG object-fit:contain,
  // so the image never crops—movement may reveal letterbox edges, which is
  // why we scaled bg slightly in CSS (scale 1.06).
  // --------------------------
  let rafId = null;
  let pointerX = 0, pointerY = 0; // subtle pointer parallax
  const MAX_SHIFT = 18; // px of max shift due to scroll
  const MAX_MOUSE = 10; // px of max shift due to pointer

  function onScrollOrResize(){
    if(rafId) return;
    rafId = requestAnimationFrame(updateParallax);
  }

  function updateParallax(){
    rafId = null;
    if(prefersReduced) return;

    const rect = section.getBoundingClientRect();
    const vh = Math.max(window.innerHeight, 1);
    // progress: 0 when section top hits bottom of viewport,
    // 1 when section bottom hits top of viewport
    const visible = 1 - Math.min(Math.max((rect.top + rect.height) / (vh + rect.height), 0), 1);
    const shiftY = (visible - 0.5) * 2 * MAX_SHIFT; // -MAX..MAX

    // Combine with pointer parallax
    const shiftX = pointerX * MAX_MOUSE;
    const addY  = pointerY * MAX_MOUSE * 0.6;

    bg.style.transform = `translate3d(${shiftX}px, ${shiftY + addY}px, 0) scale(1.06)`;
  }

  function onPointerMove(e){
    // Normalize to -1..1 range
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    // dampen for smoothness
    pointerX += (x - pointerX) * 0.06;
    pointerY += (y - pointerY) * 0.06;
    onScrollOrResize();
  }

  // --------------------------
  // Init
  // --------------------------
  createFloaters();
  if(!prefersReduced){
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    // First paint
    onScrollOrResize();
  }
})();
