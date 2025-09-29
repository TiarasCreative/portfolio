// Minimal include helper with path rewriting + active-link highlighting
// Works from any folder depth (e.g., /about/index.html, /work/case-x/index.html)
(function () {
  const ABS_URL = /^(?:[a-z]+:)?\/\//i;

  function getBase() {
    // Optional deployment base (e.g., "/portfolio/"), set on <body data-base="/portfolio/">
    const el = document.body || document.documentElement;
    let base = (el && el.dataset && el.dataset.base) || "/";
    return base.endsWith("/") ? base : base + "/";
  }

  function prefixToRoot() {
    // How many ../ to reach the site root from the current page?
    let p = location.pathname.replace(/\/index\.html?$/i, "").replace(/\/+$/, "");
    const depth = p.split("/").filter(Boolean).length;
    return depth ? "../".repeat(depth) : "./";
  }

  function normalizePath(p) {
    return p.replace(/\/index\.html?$/i, "/").replace(/\/+$/, "/");
  }

  function rootFile(path) {
    // Always fetch from site root, adjusted by data-base if used
    const base = getBase();
    const clean = String(path || "").replace(/^\/+/, "");
    return base === "/" ? "/" + clean : base + clean;
  }

  function rewriteUrls(container) {
    const base = getBase();
    const pre = prefixToRoot();

    // Fix href/src and srcset so relative paths inside fragments work from any depth
    container.querySelectorAll("[href], [src], img[srcset], source[srcset], use[href]").forEach((el) => {
      function fixAttr(attr) {
        if (!el.hasAttribute(attr)) return;
        let val = el.getAttribute(attr);
        if (!val) return;

        // Skip absolute URLs, fragments, mailto/tel, or query-only
        if (ABS_URL.test(val) || val.startsWith("#") || val.startsWith("mailto:") || val.startsWith("tel:") || val.startsWith("?")) {
          return;
        }
        if (val.startsWith("/")) {
          // Root-absolute → prefix with base if site under subfolder
          el.setAttribute(attr, (base === "/" ? "" : base) + val.replace(/^\/+/, ""));
        } else {
          // Plain relative → add ../ hops
          el.setAttribute(attr, pre + val);
        }
      }

      // srcset handling
      if (el.hasAttribute("srcset")) {
        const fixed = el.getAttribute("srcset").split(",").map((part) => {
          const seg = part.trim().split(/\s+/, 2);
          let url = seg[0], size = seg[1] || "";
          if (!(ABS_URL.test(url) || url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("?"))) {
            url = url.startsWith("/")
              ? (base === "/" ? "" : base) + url.replace(/^\/+/, "")
              : prefixToRoot() + url;
          }
          return [url, size].filter(Boolean).join(" ");
        }).join(", ");
        el.setAttribute("srcset", fixed);
      }

      // href/src
      fixAttr("href");
      fixAttr("src");
    });
  }

  function highlightActive(container) {
    const here = normalizePath(location.pathname);
    container.querySelectorAll('a[href]').forEach((a) => {
      try {
        const url = new URL(a.getAttribute('href'), location.href);
        const path = normalizePath(url.pathname);
        if (path === here) {
          a.classList.add("active");
          a.setAttribute("aria-current", "page");
        }
      } catch (_) { /* ignore */ }
    });
  }

  async function include(target, file) {
    const mount = typeof target === "string" ? document.querySelector(target) : target;
    if (!mount || !file) return;

    const res = await fetch(rootFile(file), { credentials: "same-origin" });
    if (!res.ok) throw new Error(`Include failed: ${file} (${res.status})`);
    const html = await res.text();

    const tpl = document.createElement("template");
    tpl.innerHTML = html.trim();
    const frag = tpl.content;

    // Rewrite paths inside the included fragment
    rewriteUrls(frag);

    mount.replaceChildren(frag);

    // Execute inline/linked scripts found in the injected fragment
mount.querySelectorAll("script").forEach((old) => {
  const s = document.createElement("script");
  // copy attributes
  for (const a of old.attributes) s.setAttribute(a.name, a.value);
  // rewrite relative src for subfolder deployments
  if (s.src && !/^(?:[a-z]+:)?\/\//i.test(s.src)) {
    const base = (document.body?.dataset.base || "/");
    s.src = s.src.startsWith("/")
      ? (base === "/" ? "" : base) + s.src.replace(/^\/+/, "")
      : (function(){
          let p = location.pathname.replace(/\/index\.html?$/i,"").replace(/\/+$/,"");
          const depth = p.split("/").filter(Boolean).length;
          const pre = depth ? "../".repeat(depth) : "./";
          return pre + old.getAttribute("src");
        })();
  }
  if (!s.src) s.textContent = old.textContent;
  old.replaceWith(s);
});


    // Optional: wire up mobile menu if your header contains .nav-toggle / #primary-nav
    const toggle = mount.querySelector(".nav-toggle");
    const navEl  = mount.querySelector("#primary-nav");
    if (toggle && navEl) {
      toggle.addEventListener("click", () => {
        const open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!open));
        navEl.classList.toggle("open", !open);
        document.body.classList.toggle("no-scroll", !open);
      });
    }

    // Active link
    highlightActive(mount);
  }

  async function includeAll() {
    const nodes = Array.from(document.querySelectorAll("[data-include]"));
    for (const node of nodes) {
      const file = node.getAttribute("data-include");
      try { await include(node, file); } catch (e) { console.error(e); }
    }
  }

  // Public API
  window.App = {
    include,
    includeAll,
    setBase(path) {
      if (!path) return;
      const el = document.body || document.documentElement;
      el.dataset.base = path.endsWith("/") ? path : path + "/";
    }
  };

  // Auto-run after DOM is ready
  document.addEventListener("DOMContentLoaded", includeAll);
})();
