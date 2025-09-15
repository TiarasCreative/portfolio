// include.js — inject header/footer, then notify the page they're ready
async function injectFragment(targetId, filePath){
  const slot = document.getElementById(targetId);
  if(!slot) return false;
  try{
    const res = await fetch(filePath, { cache: "no-cache" });
    if(!res.ok) throw new Error(res.status + " " + res.statusText);
    slot.innerHTML = await res.text();
    return true;
  }catch(err){
    console.error("Failed to load", filePath, err);
    slot.innerHTML =
      "<div style='padding:12px;border:1px solid #ccc'>Could not load "
      + filePath +
      ". If you opened this file directly (file://), start a local server so fetch() can work.</div>";
    return false;
  }
}

// Optional helper: fix lazy-loaded images if your HTML used data-src/srcset
function fixLazyImages(root=document){
  root.querySelectorAll('img[data-src]').forEach(img => {
    if(!img.getAttribute('src')) img.setAttribute('src', img.getAttribute('data-src'));
  });
  root.querySelectorAll('img[data-srcset]').forEach(img => {
    if(!img.getAttribute('srcset')) img.setAttribute('srcset', img.getAttribute('data-srcset'));
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const h = await injectFragment("header", "header.html");
  const f = await injectFragment("footer", "footer.html");
  fixLazyImages(document);

  // Tell the rest of the app that fragments are ready
  window.dispatchEvent(new CustomEvent("fragments:loaded", { detail: { header: h, footer: f } }));
});

