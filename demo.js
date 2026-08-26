/* wortlaut /demo — Suche über echte Wortlaut-Spans, Kontext aufziehen, Hash nachrechnen.
 *
 * Reine Funktionen (Daten -> HTML-String / Zustandsobjekt) + eine dünne DOM-Schicht.
 * Vanilla JS, kein Framework, keine Dependency. Die Funktionen sind mit `node --test`
 * prüfbar (siehe tests/demo.test.js); die DOM-Verdrahtung läuft nur im Browser.
 */

// Leerer Wert = Demo-Modus: Beispieldaten aus demo-fixtures.js, sichtbares Badge.
// Gesetzter Wert (z.B. "https://api.wortlaut.io") = Live-Modus mit echten Calls.
// WICHTIG: Ein Live-Fehler fällt NIEMALS auf die Beispieldaten zurück — das würde
// erfundene Zitate zeigen, die wie echte aussehen (Spec 0044 §0d).
export const API_BASE = "";

/* ---------------------------------------------------------------- *
 * Reine Funktionen
 * ---------------------------------------------------------------- */

/** & zuerst, dann < > " ' — in jeder anderen Reihenfolge würde Markup entstehen. */
export function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Rohtext + match-Offsets -> HTML. Die Offsets gelten für den ROHTEXT: wir schneiden
 * zuerst an den Offsets und escapen dann die drei Stücke einzeln (Spec §0a).
 * match=null oder ungültige Offsets (negativ, start >= end, jenseits der Länge)
 * -> Text vollständig escaped, ohne <mark>, ohne Fehler.
 */
export function renderVerbatim(text, match) {
  const raw = String(text ?? "");
  const valid =
    !!match &&
    Number.isInteger(match.start) &&
    Number.isInteger(match.end) &&
    match.start >= 0 &&
    match.start < match.end &&
    match.end <= raw.length;
  if (!valid) {
    return escapeHtml(raw);
  }
  return (
    escapeHtml(raw.slice(0, match.start)) +
    "<mark>" +
    escapeHtml(raw.slice(match.start, match.end)) +
    "</mark>" +
    escapeHtml(raw.slice(match.end))
  );
}

/** Partei-Punkt: ein neutraler Aufzählungspunkt, der für jede Fraktion die
 *  SELBE gedeckte Farbe trägt (Spec §4.3). Die Farbe kommt ausschließlich
 *  aus der CSS-Klasse `.dot` (demo.css) — kein Inline-`style`, kein
 *  Farb-Mapping je Partei, auch kein gehashtes: so eine Palette liest sich
 *  als Urteil. */
function partyTag(speaker) {
  if (!speaker || !speaker.party) return "";
  return (
    '<span class="party-tag">' +
    '<span class="dot"></span>' +
    escapeHtml(speaker.party) +
    "</span>"
  );
}

function fmtDate(iso) {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
  if (!m) return "";
  return `${m[3]}.${m[2]}.${m[1]}`;
}

/** URL-Sicherheit (Spec §11): API-Werte werden nur dann als `href` gesetzt,
 *  wenn sie mit `http://` oder `https://` beginnen — Escaping entschärft ein
 *  `javascript:`-Ziel nicht. Alles andere wird nicht verlinkt. */
function httpUrl(u) {
  const s = String(u ?? "");
  return s.startsWith("http://") || s.startsWith("https://") ? s : "";
}

/** SpanResult -> HTML-String einer Ergebniskarte.
 *  Kopf (Sprecher · Partei-Tag · Datum · TOP), voller Wortlaut via renderVerbatim,
 *  Aufzieh-Schalter als <button>, Provenienz-Zeile (Permalink · Wayback ·
 *  archive.today · span_hash · Verify-<button>).
 *  Optional fehlende Felder (match, archive_today, speaker.party/role, locator.*)
 *  werden WEGGELASSEN, nicht als „null" gerendert. Der Wortlaut steht vollständig
 *  im DOM; lange Beiträge sind optisch eingeklappt, aber aufklappbar (Spec §4.4). */
export function renderCard(result) {
  const speaker = result.speaker ?? {};
  const source = result.source ?? {};
  const locator = result.locator ?? {};
  const text = String(result.verbatim_text ?? "");
  const long = text.length > 300;
  const blockId = "v-" + escapeHtml(result.span_id ?? "");

  const head = [
    `<span class="speaker">${escapeHtml(speaker.name ?? "")}</span>`,
    partyTag(speaker),
  ]
    .filter(Boolean)
    .join('<span class="sep">·</span>');

  const subParts = [
    speaker.role ? escapeHtml(speaker.role) : "",
    fmtDate(result.spoken_at)
      ? `<time datetime="${escapeHtml(result.spoken_at)}">${fmtDate(
          result.spoken_at,
        )}</time>`
      : "",
    locator.tagesordnungspunkt
      ? `Tagesordnungspunkt: ${escapeHtml(locator.tagesordnungspunkt)}`
      : "",
  ].filter(Boolean);
  const sub = subParts.length
    ? `<p class="d-sub">${subParts.join('<span class="sep">·</span>')}</p>`
    : "";

  const permalink = httpUrl(source.permalink);
  const wayback = httpUrl(source.archive_wayback);
  const today = httpUrl(source.archive_today);
  const provParts = [
    permalink
      ? `<a class="prov" href="${escapeHtml(permalink)}">Primärquelle</a>`
      : "",
    wayback ? `<a class="prov" href="${escapeHtml(wayback)}">Wayback</a>` : "",
    today
      ? `<a class="prov" href="${escapeHtml(today)}">archive.today</a>`
      : "",
    result.span_hash
      ? `<span class="hash" title="span_hash">${escapeHtml(result.span_hash)}</span>`
      : "",
    result.span_hash
      ? '<button type="button" class="toggle verify">Hash nachrechnen</button>'
      : "",
  ].filter(Boolean);

  return (
    `<article class="d-card" data-span-id="${escapeHtml(result.span_id ?? "")}">` +
    `<header class="d-head">${head}</header>` +
    sub +
    `<blockquote class="d-verbatim${long ? " collapsed" : ""}" data-block="${blockId}">` +
    `<p>${renderVerbatim(text, result.match)}</p>` +
    `</blockquote>` +
    (long
      ? `<button type="button" class="toggle verbatim-toggle" data-vblock="${blockId}" aria-expanded="false">vollständigen Beitrag anzeigen</button>`
      : "") +
    `<button type="button" class="toggle ctx-toggle" data-vblock="${blockId}" aria-expanded="false">Kontext aufziehen<span class="hint"> (1 Nachlade-Call, keine neue Suche)</span></button>` +
    `<div class="d-context" data-context hidden></div>` +
    `<footer class="d-prov">${provParts.join(
      '<span class="sep">·</span>',
    )}<span class="d-verify" data-verify></span></footer>` +
    `</article>`
  );
}

/** ContextItem[] -> HTML-String: je Nachbar-Beitrag Sprecher + wörtlicher Text.
 *  Reihenfolge bleibt exakt die aus der Antwort — kein Umsortieren (Spec §4.3). */
export function renderContext(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return '<p class="dim">Kein Kontext verfügbar.</p>';
  }
  return (
    '<div class="ctx">' +
    items
      .map(
        (it) =>
          `<div class="ctx-item">` +
          `<p class="ctx-head"><span class="speaker">${escapeHtml(
            it.speaker_name ?? "",
          )}</span>` +
          (it.party
            ? '<span class="party-tag"><span class="dot"></span>' +
              escapeHtml(it.party) +
              "</span>"
            : "") +
          `</p>` +
          `<p class="ctx-text">${escapeHtml(it.verbatim_text ?? "")}</p>` +
          `</div>`,
      )
      .join("") +
    "</div>"
  );
}

/** VerifyResult -> ZWEI getrennte Aussagen (Spec §4.2):
 *  - hash: ok aus `ok` — „✓ Hash bestätigt" / „✗ Hash weicht ab".
 *    Ein fehlender Zeitstempel degradiert den Hash-Befund nicht.
 *  - stamp: eigener UI-Zustand aus dem API-Wert `timestamp_status` über die
 *    bindende Tabelle in §4.2: `"ok"` → `confirmed` · `"missing"` → `none`
 *    (NEUTRAL, nicht rot) · `"mismatch"`, `"untrusted"`, `"malformed"`,
 *    `"unreadable"` → `error` · unbekannt → `error` (fail-safe, AC4e).
 *    API-Wert und UI-Zustand sind zwei verschiedene Vokabulare. */
export function verifyLabels(v) {
  const hash = {
    ok: v.ok === true,
    text: v.ok === true ? "✓ Hash bestätigt" : "✗ Hash weicht ab",
  };

  let state;
  if (v.timestamp_status === "ok") state = "confirmed";
  else if (v.timestamp_status === "missing") state = "none";
  else state = "error";
  const text =
    state === "confirmed"
      ? "Zeitstempel bestätigt" +
        (v.timestamp_tsa ? ` · TSA: ${v.timestamp_tsa}` : "") +
        (v.timestamp_gen_time ? ` · ${v.timestamp_gen_time}` : "")
      : state === "none"
        ? "Kein Zeitstempel vorhanden — der Hash-Befund bleibt unverändert."
        : "Zeitstempel fehlerhaft — bitte nachprüfen.";
  return { hash, stamp: { state, text } };
}

/** Drei unterschiedliche, verständliche deutsche Fehlermeldungen.
 *  Kein Stacktrace, keine leere Seite, kein stiller Rückfall auf Beispieldaten. */
export function errorMessage(kind) {
  switch (kind) {
    case "network":
      return "Die Verbindung zur API ist fehlgeschlagen. Bitte Netzwerk und API-Adresse prüfen.";
    case "http":
      return "Die API hat mit einem Fehler geantwortet. Bitte später erneut versuchen.";
    case "empty":
      return "Keine Treffer für diese Suche. Anderen Begriff oder breitere Formulierung versuchen.";
    default:
      return "Unbekannter Fehler bei der Suche.";
  }
}

/* ---------------------------------------------------------------- *
 * Dünne DOM-Schicht — läuft nur im Browser.
 * ---------------------------------------------------------------- */
if (typeof document !== "undefined") {
  const { FIXTURES } = await import("./demo-fixtures.js");

  const form = document.querySelector("#search-form");
  const results = document.getElementById("results");
  const count = document.getElementById("result-count");

  const demoMode = API_BASE === "";

  // Badge und Fußbereich-Hinweis stehen im Markup und sind ohne JS sichtbar.
  // Im Live-Modus (API_BASE gesetzt) wären sie falsch — dort weglassen.
  if (!demoMode) {
    for (const id of ["demo-badge", "footer-demo-note"]) {
      const el = document.getElementById(id);
      if (el) el.hidden = true;
    }
  }

  async function fetchJson(url) {
    let res;
    try {
      res = await fetch(url);
    } catch {
      throw new Error("network");
    }
    if (!res.ok) throw new Error("http");
    return res.json();
  }

  function renderResults(resultsList, total) {
    // Reihenfolge bleibt EXAKT die der API-Antwort / der Fixtures (Spec §4.3, AC5b).
    results.innerHTML = resultsList.map(renderCard).join("");
    if (count) {
      count.textContent =
        `Zeige ${resultsList.length} von ${total} Treffern — ` +
        "wörtlich, in der Reihenfolge der Antwort.";
    }
  }

  function showFailure(kind) {
    // Ehrliche Fehlermeldung — NIEMALS ein stiller Rückfall auf Beispieldaten.
    results.innerHTML = "";
    const note = document.createElement("p");
    note.className = "error";
    note.textContent = errorMessage(kind);
    results.appendChild(note);
    if (count) count.textContent = "";
  }

  async function runSearch(query) {
    if (demoMode) {
      // Demo-Modus: Beispieldaten, sichtbares Badge. (Spec §0d)
      renderResults(FIXTURES.search.results, FIXTURES.search.total);
      return;
    }
    // Live-Modus: echte Calls; bei Fehler nur eine ehrliche Meldung. (Spec §0d)
    const params = new URLSearchParams({ q: query, limit: "20", offset: "0" });
    try {
      const data = await fetchJson(API_BASE + "/v1/search?" + params.toString());
      if (!Array.isArray(data.results) || data.results.length === 0) {
        showFailure("empty");
        return;
      }
      renderResults(data.results, data.total ?? data.results.length);
    } catch (e) {
      showFailure(e.message === "http" ? "http" : "network");
    }
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.elements["q"];
      runSearch(String(input.value).trim());
    });
  }

  results.addEventListener("click", (e) => {
    const toggle = e.target.closest(".toggle");
    if (!toggle) return;
    const card = toggle.closest(".d-card");
    if (!card) return;
    const spanId = card.dataset.spanId;

    if (toggle.classList.contains("verify")) {
      void loadVerify(card, spanId);
      return;
    }
    if (toggle.classList.contains("verbatim-toggle")) {
      const block = card.querySelector(`[data-block="${toggle.dataset.vblock}"]`);
      if (!block) return;
      const collapsed = block.classList.toggle("collapsed");
      toggle.setAttribute("aria-expanded", String(!collapsed));
      toggle.textContent = collapsed
        ? "vollständigen Beitrag anzeigen"
        : "Beitrag einklappen";
      return;
    }
    if (toggle.classList.contains("ctx-toggle")) {
      void toggleContext(card, spanId, toggle);
      return;
    }
  });

  // Kontext: on demand über GET /v1/spans/{id} — ein Nachlade-Call, die
  // Trefferliste wird NICHT neu geladen (Spec AC3).
  async function toggleContext(card, spanId, toggle) {
    const box = card.querySelector("[data-context]");
    if (!box) return;
    if (!box.hidden) {
      box.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      return;
    }
    box.hidden = false;
    box.innerHTML = '<p class="dim">Kontext wird geladen …</p>';
    let items = null;
    if (demoMode) {
      items = (FIXTURES.spans?.[spanId] ?? {}).context ?? null;
    } else {
      try {
        const detail = await fetchJson(
          `${API_BASE}/v1/spans/${encodeURIComponent(spanId)}`,
        );
        items = detail.context ?? null;
      } catch (err) {
        box.innerHTML =
          '<p class="error">' +
          escapeHtml(errorMessage(err.message === "http" ? "http" : "network")) +
          "</p>";
        return;
      }
    }
    box.innerHTML = renderContext(items ?? []);
    toggle.setAttribute("aria-expanded", "true");
  }

  // Verify: GET /v1/spans/{id}/verify -> zwei getrennte Aussagen (Hash, Zeitstempel).
  async function loadVerify(card, spanId) {
    const out = card.querySelector("[data-verify]");
    if (!out) return;
    out.textContent = "nachrechne …";
    let verify = null;
    if (demoMode) {
      verify = (FIXTURES.verify ?? {})[spanId] ?? null;
    } else {
      try {
        verify = await fetchJson(
          `${API_BASE}/v1/spans/${encodeURIComponent(spanId)}/verify`,
        );
      } catch (err) {
        out.textContent = errorMessage(err.message === "http" ? "http" : "network");
        return;
      }
    }
    if (!verify) {
      out.textContent = "Kein Verify-Ergebnis vorhanden.";
      return;
    }
    const { hash, stamp } = verifyLabels(verify);
    out.innerHTML =
      '<span class="v-hash ' + (hash.ok ? "ok" : "fail") + '">' +
      escapeHtml(hash.text) +
      "</span>" +
      '<span class="sep">·</span>' +
      '<span class="v-stamp ' + stamp.state + '">' +
      escapeHtml(stamp.text) +
      "</span>";
  }

  // Demo-Modus: Beispieldaten sofort sichtbar, noch vor der ersten Suche.
  if (demoMode) renderResults(FIXTURES.search.results, FIXTURES.search.total);
}
