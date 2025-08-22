// content.js (classic script) — visual line splitting + re-annotate on resize
(function () {
  "use strict";

  const api = window.ckCherokee || {};
  const isCherokeeString = api.isCherokeeString;
  const pageLooksTranslated = api.pageLooksTranslated;
  const transliterateCherokee = api.transliterateCherokee;
  if (!isCherokeeString || !pageLooksTranslated || !transliterateCherokee) return;

  if (window.__ckCherokeeInit) return;
  window.__ckCherokeeInit = true;

  const ARTICLE_SELECTOR = "#article-body";
  const MARK_ATTR = "data-ck-translit-done";

  function shouldRun() {
    const root = document.querySelector(ARTICLE_SELECTOR);
    if (!root) return false;
    return pageLooksTranslated(root);
  }

  function injectToggle(root) {
    if (document.getElementById("ck-toggle")) return;
    const btn = document.createElement("button");
    btn.id = "ck-toggle";
    btn.textContent = "Transliteration: On";
    btn.classList.add("on");
    btn.addEventListener("click", () => {
      const on = btn.classList.toggle("on");
      btn.textContent = `Transliteration: ${on ? "On" : "Off"}`;
      document.body.classList.toggle("ck-hide-translit", !on);
    });

    const headline = document.querySelector("h1, .headline, .asset-headline");
    const parent = (headline && headline.parentElement) || root.parentElement || document.body;
    parent.insertBefore(btn, headline ? headline.nextSibling : parent.firstChild);
  }

  // Remove previous annotation so we can measure original text again
  function clearExistingAnnotation(root) {
    root.querySelectorAll(".ck-annotated").forEach(node => {
      const cherokeeText = (node.querySelector(".ck-cherokee") || node).textContent || "";
      node.replaceWith(document.createTextNode(cherokeeText));
    });
    root.removeAttribute(MARK_ATTR);
  }

  // Split a text node into strings for each rendered (visual) line using word boundaries
  function splitByVisualLines(textNode) {
    const orig = textNode.nodeValue || "";
    // Normalize special line/space chars so layout decides wrapping
    const normalized = orig.replace(/[\u2028\u2029]/g, " ").replace(/\u00A0/g, " ");
    if (normalized !== orig) textNode.nodeValue = normalized;

    const s = textNode.nodeValue || "";
    const lines = [];
    if (!s) return lines;

    // boundaries = indexes just after whitespace runs; ensures we measure by words
    const boundaries = [0];
    const re = /\s+/g;
    let m;
    while ((m = re.exec(s))) boundaries.push(m.index + m[0].length);
    boundaries.push(s.length);

    let start = 0;
    let lastTop = null;

    for (let bi = 1; bi < boundaries.length; bi++) {
      const i = boundaries[bi];
      const r = document.createRange();
      r.setStart(textNode, start);
      r.setEnd(textNode, i);
      const rects = r.getClientRects();
      if (r.detach) r.detach();
      if (!rects.length) continue; // invisible
      const curTop = Math.round(rects[rects.length - 1].top);
      if (lastTop === null) {
        lastTop = curTop;
        continue;
      }
      if (curTop !== lastTop) {
        const prevEnd = boundaries[bi - 1];
        lines.push(s.slice(start, prevEnd));
        start = prevEnd;
        lastTop = null; // force capture of baseline at next iteration
        bi--; // recheck current boundary with new baseline
      }
    }

    lines.push(s.slice(start));
    return lines.map(x => x.replace(/\s+$/g, ""));
  }

  function annotateBlock(el) {
    // If previously processed, reset so we can measure on original text
    if (el.getAttribute(MARK_ATTR) === "1") clearExistingAnnotation(el);

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const t = node.nodeValue || "";
        return t.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    for (const tn of textNodes) {
      const raw = tn.nodeValue || "";
      if (!isCherokeeString(raw)) continue;

      const parent = tn.parentNode;
      const frag = document.createDocumentFragment();
      const parts = splitByVisualLines(tn);
      const safeParts = parts.length ? parts : [raw];

      for (let idx = 0; idx < safeParts.length; idx++) {
        const cherokee = safeParts[idx];
        const latin = transliterateCherokee(cherokee);

        const wrapper = document.createElement("span");
        wrapper.className = "ck-annotated";

        const top = document.createElement("span");
        top.className = "ck-cherokee";
        top.textContent = cherokee;

        const br = document.createElement("br");

        const bottom = document.createElement("span");
        bottom.className = "ck-latin";
        bottom.textContent = latin;

        wrapper.appendChild(top);
        wrapper.appendChild(br);
        wrapper.appendChild(bottom);
        frag.appendChild(wrapper);

        if (idx < safeParts.length - 1) frag.appendChild(document.createElement("br"));
      }

      parent.replaceChild(frag, tn);
    }

    el.setAttribute(MARK_ATTR, "1");
  }

  function processArticle() {
    const root = document.querySelector(ARTICLE_SELECTOR);
    if (!root) return;
    injectToggle(root);
    if (!shouldRun()) return;
    annotateBlock(root);
  }

  function rerun() {
    const root = document.querySelector(ARTICLE_SELECTOR);
    if (!root) return;
    clearExistingAnnotation(root);
    annotateBlock(root);
  }

  // Initial run
  processArticle();

  // Re-run on resize and after fonts load (debounced)
  let tId;
  window.addEventListener("resize", () => {
    clearTimeout(tId);
    tId = setTimeout(rerun, 150);
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => setTimeout(rerun, 0)).catch(() => {});
  }

  // Minimal style
  const style = document.createElement("style");
  style.textContent = [
    "body.ck-hide-translit .ck-latin { display: none !important; }",
    ".ck-annotated .ck-latin { font-size: 0.8em; opacity: 0.85; }",
    "#ck-toggle { margin: 0.5rem 0; }"
  ].join("\n");
  document.head.appendChild(style);
})();
