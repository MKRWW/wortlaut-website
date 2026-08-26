// wortlaut /demo — node --test (Node 20+, keine Dependency).
// Prüft die reinen Funktionen aus demo.js gegen die Akzeptanzkriterien 0044.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  escapeHtml,
  renderVerbatim,
  renderCard,
  renderContext,
  verifyLabels,
  errorMessage,
} from "../demo.js";

// Vollständiges, erkennbar erfundenes Belegobjekt (alle optionalen Felder gesetzt).
function fullResult() {
  return {
    span_id: "a3f97c1e09bb4d201d44be0792fa3c55",
    verbatim_text:
      "Sehr geehrte Präsidentin, die Vorlage des <Finanzausschusses> & der Regierung zeigen: Wir werden den Ansatz für Klimaschutz um 1,2 Milliarden Euro erhöhen.",
    speaker: {
      name: "Beispiel Mustermann",
      party: "Beispielunion",
      role: "Mitglied des Bundestags",
      parliament: "Bundestag (Beispielsitzung)",
    },
    spoken_at: "2026-03-12T10:42:00Z",
    source: {
      type: "plenarprotokoll",
      permalink: "https://beispiel-archiv.example/plenum/2026/03/12/zp-14-2",
      archive_wayback: "https://web.archive.org/web/2026/x",
      archive_today: "https://archive.example/today/144220260312104200",
      content_hash: "8f14e45f2b3a9c61",
      rights_basis: "amtliches Werk, gemeinfrei (§ 5 UrhG)",
    },
    span_hash: "a3f97c1e09bb4d201d44be0792fa3c55",
    verification: "hash+tsa",
    locator: {
      protokoll: "31. Sitzung, 12.03.2026 (Beispielprotokoll 00/12345)",
      sitzung: "2026-03-12",
      tagesordnungspunkt: "TOP 14.2: Klimapakets 2026 (Beispiel)",
    },
    match: { start: 112, end: 123 },
  };
}

// AC1 — Karte enthält den VOLLSTÄNDIGEN Wortlaut plus alle Belegfelder.
test("karte_enthaelt_alle_belegfelder", () => {
  const r = fullResult();
  const html = renderCard(r);

  // Voller Text, nicht geschnitten: wenn man die <mark>-Tags wegstreicht,
  // muss exakt der komplette, escaped Wortlaut übrig bleiben.
  const stripped = html.replace(/<mark>/g, "").replace(/<\/mark>/g, "");
  assert.ok(
    stripped.includes(escapeHtml(r.verbatim_text)),
    "vollständiger Wortlaut muss ungeschnitten im Markup stehen",
  );
  // Sprecher, Partei, Datum, Tagesordnungspunkt.
  assert.ok(html.includes("Beispiel Mustermann"));
  assert.ok(html.includes("Beispielunion"));
  assert.ok(html.includes("12.03.2026"));
  assert.ok(html.includes("Tagesordnungspunkt: TOP 14.2: Klimapakets 2026 (Beispiel)"));
  // Permalink, beide Archiv-Felder, span_hash.
  assert.ok(html.includes("https://beispiel-archiv.example/plenum/2026/03/12/zp-14-2"));
  assert.ok(html.includes("https://web.archive.org/web/2026/x"));
  assert.ok(html.includes("https://archive.example/today/144220260312104200"));
  assert.ok(html.includes("a3f97c1e09bb4d201d44be0792fa3c55"));
  // „null" darf nirgends als Feld-Platzhalter erscheinen.
  assert.ok(!html.includes(">null<"));
});

// AC2 — exakt der Bereich zwischen den Offsets wird markiert.
test("markierung_exakt", () => {
  const t = "aaaa KLI bbb";
  const out = renderVerbatim(t, { start: 5, end: 8 });
  assert.equal(out, "aaaa <mark>KLI</mark> bbb");
});

// AC2b — Sonderzeichen VOR dem Treffer verschieben nichts (schieben → escape).
test("markierung_nach_sonderzeichen", () => {
  // "x & y < z & KLI w": KLI steht an Offset 12; VOR dem Treffer liegen & und <.
  const t = "x & y < z & KLI w";
  const out = renderVerbatim(t, { start: 12, end: 15 });
  assert.equal(out, "x &amp; y &lt; z &amp; <mark>KLI</mark> w");
  // Markiert genau das Suchwort, nicht eine um &/&lt; verschobene Stelle.
  const marks = out.match(/<mark>.*?<\/mark>/g);
  assert.equal(marks.length, 1);
  assert.equal(marks[0], "<mark>KLI</mark>");
});

// AC2c — match=null: vollständig, escaped, ohne <mark>, ohne Fehler.
test("ohne_match", () => {
  assert.equal(renderVerbatim("hallo <b>& 'Welt'", null), "hallo &lt;b&gt;&amp; &#39;Welt&#39;");
  assert.equal(renderVerbatim("nur Text"), "nur Text");
  // Ungültige Offsets -> wie „kein Match" behandelt.
  assert.equal(renderVerbatim("abcdef", { start: 3, end: 3 }), "abcdef");
  assert.equal(renderVerbatim("abcdef", { start: -1, end: 3 }), "abcdef");
  assert.equal(renderVerbatim("abc", { start: 1, end: 99 }), "abc");
  // Ein gültiger 1-Zeichen-Match markiert exakt diesen (Gegenfall zu „kein Match").
  assert.equal(renderVerbatim("abcdef", { start: 1, end: 2 }), "a<mark>b</mark>cdef");
});

// AC3 — Kontext rendert je Nachbar Sprecher + Text; Reihenfolge bleibt erhalten.
test("kontext_rendert_nachbarn", () => {
  const items = [
    {
      span_id: "a",
      speaker_name: "Beispiel Dr. Vorne",
      party: "Bündnis für eine Faire Zukunft",
      text_start: 12,
      text_end: 24,
      verbatim_text: "Die Vorlage bringt nicht das, was sie verspricht.",
    },
    {
      span_id: "b",
      speaker_name: "Beispiel Lechner",
      party: "Beispielfraktion für Ordnung",
      text_start: 39,
      text_end: 47,
      verbatim_text: "Der Prüfbericht kommt, bevor ein Cent ausgegeben wird.",
    },
  ];
  const html = renderContext(items);
  assert.ok(html.includes("Beispiel Dr. Vorne"));
  assert.ok(html.includes("Beispiel Lechner"));
  assert.ok(html.includes("Die Vorlage bringt nicht das, was sie verspricht."));
  assert.ok(html.includes("Der Prüfbericht kommt, bevor ein Cent ausgegeben wird."));
  // Reihenfolge = Reihenfolge der Eingabe (kein Umsortieren).
  assert.ok(html.indexOf("Beispiel Dr. Vorne") < html.indexOf("Beispiel Lechner"));
});

// AC4 — Hash: ok=true -> bestätigend; ok=false -> negativ.
test("hash_ok", () => {
  const ok = verifyLabels({ ok: true, timestamp_status: "missing" });
  assert.equal(ok.hash.ok, true);
  assert.equal(ok.hash.text, "✓ Hash bestätigt");

  const bad = verifyLabels({ ok: false, timestamp_status: "missing" });
  assert.equal(bad.hash.ok, false);
  assert.equal(bad.hash.text, "✗ Hash weicht ab");
});

// AC4b — Zeitstempel trägt einen EIGENEN Zustand (TSA + Zeit), getrennt vom Hash.
test("zeitstempel_eigener_zustand", () => {
  const r = verifyLabels({
    ok: true,
    timestamp_status: "ok",
    timestamp_tsa: "TSA-Beispiel 2026-03-14T08:00:00Z",
    timestamp_gen_time: "2026-03-14T08:00:00Z",
  });
  assert.equal(r.stamp.state, "confirmed");
  assert.ok(r.stamp.text.includes("TSA-Beispiel 2026-03-14T08:00:00Z"));
  assert.ok(r.stamp.text.includes("2026-03-14T08:00:00Z"));
  // Getrennt vom Hash: Hash bleibt eigenständig „bestätigt".
  assert.equal(r.hash.ok, true);
  assert.equal(r.hash.text, "✓ Hash bestätigt");
  assert.notEqual(r.stamp.state, r.hash.ok);
});

// AC4c — kein Zeitstempel -> neutral (nicht error/fail); Hash bleibt unberührt.
test("ohne_zeitstempel_neutral", () => {
  const r = verifyLabels({ ok: true, timestamp_status: "missing" });
  assert.equal(r.stamp.state, "none");
  assert.notEqual(r.stamp.state, "error");
  assert.notEqual(r.stamp.state, "fail");
  assert.ok(!r.stamp.text.toLowerCase().includes("fehler"));
  // Hash unabhängig.
  assert.equal(r.hash.ok, true);
  assert.equal(r.hash.text, "✓ Hash bestätigt");
});

// AC4d — jeder der SECHS echten timestamp_status-Werte (Spec §3) entspricht
// exakt der Tabelle in §4.2 — je Wert ein Testfall. Kein erfundener
// Statuswert: „confirmed"/„none" sind UI-Zustände, nie API-Werte.
test("alle_echten_statuswerte", async (t) => {
  const table = [
    ["ok", "confirmed"],
    ["missing", "none"],
    ["mismatch", "error"],
    ["untrusted", "error"],
    ["malformed", "error"],
    ["unreadable", "error"],
  ];
  for (const [api, ui] of table) {
    await t.test(
      `timestamp_status=${JSON.stringify(api)} -> stamp.state=${JSON.stringify(ui)}`,
      () => {
        const r = verifyLabels({ ok: true, timestamp_status: api });
        assert.equal(r.stamp.state, ui);
        // Hash bleibt vom Zeitstempel-Zustand unberührt (§4.2).
        assert.equal(r.hash.ok, true);
      },
    );
  }
});

// AC4e — Werte, die nicht in §4.2 gelistet sind, fail-safe auf „error"
// (künftige API-Werte). Insbesondere die UI-Zustände „none"/„confirmed",
// als API-Wert missbraucht, sind unbekannt → „error".
test("unbekannter_status_ist_error", () => {
  for (const s of ["none", "confirmed", "pending"]) {
    const r = verifyLabels({ ok: true, timestamp_status: s });
    assert.equal(
      r.stamp.state,
      "error",
      `unbekannter Wert ${JSON.stringify(s)} muss auf error fail-safe n`,
    );
  }
});

// AC5b — Reihenfolge der Treffer bleibt identisch zur API-Antwort (kein Ranking).
test("reihenfolge_unveraendert", () => {
  const mk = (id, name) => ({
    ...fullResult(),
    span_id: id,
    speaker: { name, party: "Beispielunion" },
  });
  const list = [mk("b", "Beispiel Z"), mk("a", "Beispiel A"), mk("c", "Beispiel C")];
  const html = list.map(renderCard).join("");
  const ia = html.indexOf("Beispiel A");
  const ib = html.indexOf("Beispiel Z");
  const ic = html.indexOf("Beispiel C");
  // Identisch zur Eingabe-Zeichenfolge: b (Z), a (A), c (C).
  assert.ok(ib < ia && ia < ic, "Reihenfolge muss die der API-Antwort sein");
});

// AC5c — der Partei-Punkt ist farbneutral: EINE gedeckte Farbe für alle
// Fraktionen (CSS-Klasse `.dot` in demo.css). Im erzeugten HTML taucht
// keine partei-abhängige Farbe auf — insbesondere kein Inline-`style`
// (Spec §4.3).
test("partei_punkt_farbneutral", () => {
  const mk = (id, party) => ({
    ...fullResult(),
    span_id: id,
    speaker: { name: "Beispiel Person", party },
  });
  const htmlA = renderCard(mk("u1", "Beispielunion"));
  const htmlB = renderCard(mk("u2", "Bündnis für eine Faire Zukunft"));

  // Identisches Dot-Markup für beide Fraktionen → dieselbe (gedeckte) Farbe.
  const dot = (html) =>
    (html.match(/<span class="dot"[^>]*>/g) ?? []).join("|");
  assert.ok(dot(htmlA), "Partei-Punkt muss vorhanden sein");
  assert.ok(dot(htmlB), "Partei-Punkt muss vorhanden sein");
  assert.equal(dot(htmlA), dot(htmlB));
  // Kein Inline-`style` und keine Marken-Farbe: die Farbe kann nur aus
  // der CSS-Klasse kommen.
  assert.ok(!htmlA.includes("style="), "kein Inline-Style in der Karte");
  assert.ok(!htmlA.includes("#3fb950"), "kein Marken-Grün als Partei-Farbe");
  assert.ok(!htmlB.includes("style="), "kein Inline-Style in der Karte");
  assert.ok(!htmlB.includes("#3fb950"), "kein Marken-Grün als Partei-Farbe");
});

// AC6 — Fremddaten mit <script> werden escaped (Text, nie Markup).
test("script_wird_escaped", () => {
  const r = {
    ...fullResult(),
    span_id: "sec1",
    verbatim_text: 'sagte <script>alert(1)</script> laut',
    speaker: { name: '<script>alert(1)</script>', party: "Beispielunion" },
    locator: {
      tagesordnungspunkt: '<script>top()</script>',
    },
  };
  const html = renderCard(r);
  // Kein ausführbares <script> im Markup.
  assert.ok(!html.includes("<script>"));
  // Stattdessen die escaped Zeichenfolge.
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  // Sprechername und Tagesordnungspunkt einzeln escaped.
  assert.ok(html.includes("&lt;script&gt;top()&lt;/script&gt;"));
});

// AC7 — drei unterschiedliche, verständliche deutsche Fehlermeldungen.
test("fehlertexte_unterscheidbar", () => {
  const n = errorMessage("network");
  const h = errorMessage("http");
  const e = errorMessage("empty");
  assert.ok(n.length > 0 && h.length > 0 && e.length > 0);
  assert.notEqual(n, h);
  assert.notEqual(h, e);
  assert.notEqual(n, e);
  // Verständlich, kein Stacktrace: eine Zeile, ohne Frame-Marker („ at …“)
  // oder typische Fehler-Jargon-Begriffe.
  for (const t of [n, h, e]) {
    assert.ok(!t.includes("\n"), "eine Zeile, kein Stacktrace-Block");
    assert.ok(!t.includes(" at "), "kein Stacktrace-Frame-Marker");
    assert.ok(!t.includes("Exception"));
    assert.ok(!t.includes("Error:"));
    assert.ok(!t.includes("Traceback"));
  }
});
