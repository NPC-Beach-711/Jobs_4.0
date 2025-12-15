// /js/analytics.js
// GA4 click tracking for npc.org
// - Works with dynamically injected header/footer (event delegation)
// - Avoids duplicate click events

(function () {
  "use strict";

  var SITE_TAG = "npc.org";

  // Simple dedupe: ignore the same click target within a short window
  var lastSig = "";
  var lastTs = 0;
  function shouldSkipDedupe(sig) {
    var now = Date.now();
    if (sig === lastSig && now - lastTs < 600) return true; // 0.6s window
    lastSig = sig;
    lastTs = now;
    return false;
  }

  function safeText(el) {
    return ((el && el.textContent) || "").trim();
  }

  function isPdfHref(href) {
    if (!href) return false;
    try {
      var u = new URL(href, window.location.href);
      return u.pathname.toLowerCase().endsWith(".pdf");
    } catch (e) {
      return href.toLowerCase().includes(".pdf");
    }
  }

  function onDocumentClick(event) {
    // If GA isn't loaded yet, do nothing
    if (typeof window.gtag !== "function") return;

    // 1) Real <button> clicks
    var button = event.target.closest && event.target.closest("button");
    if (button) {
      var btnLabel = safeText(button) || button.id || button.name || "button";
      var btnSig = "btn|" + btnLabel;

      if (shouldSkipDedupe(btnSig)) return;

      window.gtag("event", "click", {
        event_category: "button – " + SITE_TAG,
        event_label: btnLabel + " – " + SITE_TAG,
        site_tag: SITE_TAG
      });
      return; // don't also treat it as a link
    }

    // 2) <a> link clicks
    var link = event.target.closest && event.target.closest("a");
    if (!link) return;

    // Ignore same-page hash-only clicks (optional, but reduces noise)
    var rawHref = link.getAttribute("href") || "";
    if (rawHref.startsWith("#")) return;

    var href = link.href || rawHref;
    var text = safeText(link);
    var label = text || href;

    var pdf = isPdfHref(href);
    var buttonStyle =
      link.classList.contains("btn") ||
      link.getAttribute("role") === "button";

    var category;
    if (pdf) category = "pdf – " + SITE_TAG;
    else if (buttonStyle) category = "button – " + SITE_TAG;
    else category = "nav – " + SITE_TAG;

    // Dedupe signature: category + href + label (shortened)
    var sig = "a|" + category + "|" + href + "|" + label.slice(0, 80);
    if (shouldSkipDedupe(sig)) return;

    window.gtag("event", "click", {
      event_category: category,
      event_label: label + " – " + SITE_TAG,
      link_url: href,
      site_tag: SITE_TAG
    });
  }

  document.addEventListener("click", onDocumentClick, true);
})();
