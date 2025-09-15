// app.js — robust menu control (works regardless of injection timing)

(function(){
  const body = document.body;

  function isOpen() {
    return document.getElementById("drawer")?.classList.contains("open");
  }

  function openMenu() {
    const hamburger = document.getElementById("hamburger");
    const drawer = document.getElementById("drawer");
    const backdrop = document.getElementById("backdrop");
    if (!drawer || !backdrop || !hamburger) return;
    drawer.classList.add("open");
    backdrop.classList.add("open");
    hamburger.setAttribute("aria-expanded", "true");
    body.classList.add("no-scroll");
  }

  function closeMenu() {
    const hamburger = document.getElementById("hamburger");
    const drawer = document.getElementById("drawer");
    const backdrop = document.getElementById("backdrop");
    if (!drawer || !backdrop || !hamburger) return;
    drawer.classList.remove("open");
    backdrop.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    body.classList.remove("no-scroll");
  }

  // Event delegation: handle clicks anywhere, even if header is injected later
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("#hamburger");
    const clickedBackdrop = e.target.closest("#backdrop");

    if (btn) {
      if (isOpen()) closeMenu(); else openMenu();
      e.preventDefault();
      return;
    }
    if (clickedBackdrop) {
      closeMenu();
      e.preventDefault();
      return;
    }
  });

  // ESC to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // When header/footer finish injecting, ensure aria state matches DOM
  window.addEventListener("fragments:loaded", () => {
    const hamburger = document.getElementById("hamburger");
    if (hamburger) {
      hamburger.setAttribute("aria-expanded", isOpen() ? "true" : "false");
    }
  });
  // After fragments load, move the hamburger to <body> so it's never covered
  function hoistHamburger() {
    const btn = document.getElementById("hamburger");
    if (!btn || btn.dataset.hoisted) return;
    document.body.appendChild(btn);           // reparent
    btn.dataset.hoisted = "1";
    btn.classList.add("hoisted-hamburger");   // gets fixed positioning
  }

  // Works with your include.js that dispatches 'fragments:loaded'
  window.addEventListener("fragments:loaded", hoistHamburger);
})();
