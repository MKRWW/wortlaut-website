/* wortlaut /demo — Beispieldaten für den Demo-Modus (API_BASE = "").
 *
 * ALLE Daten hier sind erkennbar ERFUNDEN: erfundene Namen („Beispiel …"),
 * erfundene Fraktionen, erfundene Sitzungen. Sie stehen NIEMALS für echte
 * Zitate — das Demo-Badge und der Fußbereich der Seite machen das sichtbar.
 * Es gibt bewusst keine realen Politiker:innen, keine echten Protokoll-URLs
 * und keine Zugangsdaten irgendwelcher Art.
 */

export const FIXTURES = {
  demo_note:
    "Demo-Beispieldaten: Alle Namen, Fraktionen, Sätze und Hashes auf dieser Seite sind erfunden und stehen nicht für echte Zitate.",

  search: {
    total: 2,
    results: [
      {
        span_id: "a3f97c1e09bb4d201d44be0792fa3c55",
        verbatim_text:
          "Sehr geehrte Präsidentin, die Vorlage des <Finanzausschusses> & der Regierung zeigen: Wir werden den Ansatz für Klimaschutz um 1,2 Milliarden Euro erhöhen. Es geht nicht um Symbolpolitik, sondern um verlässliche Planungssicherheit. Der Wortlaut dieser Vereinbarung steht im Protokoll, und jeder ist eingeladen, ihn gegen seinen Hash nachzuprüfen.",
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
          archive_wayback:
            "https://web.archive.org/web/2026/https://beispiel-archiv.example/plenum/2026/03/12/zp-14-2",
          archive_today: "https://archive.example/today/144220260312104200",
          content_hash:
            "8f14e45f2b3a9c61d07e25a8c4b6f9e31d204a7c5b8e1f0d3a6c9b2e5f81a40",
          rights_basis: "amtliches Werk, gemeinfrei (§ 5 UrhG)",
        },
        span_hash:
          "a3f97c1e09bb4d201d44be0792fa3c556c2b81e40af7d539e70a4b8fc6113d9a",
        verification: "hash+tsa",
        locator: {
          protokoll: "31. Sitzung, 12.03.2026 (Beispielprotokoll 00/12345)",
          sitzung: "2026-03-12",
          tagesordnungspunkt: "TOP 14.2: Klimapakets 2026 (Beispiel)",
        },
        match: { start: 112, end: 123 },
      },
      {
        span_id: "be0792fa3c556c2b81e40af7d539e70a4b8f1c113d9a",
        verbatim_text:
          "Wir haben die Zahlen nachgerechnet: Die Mittel für Klimaschutz reichen nicht aus. Unsere Kalkulation zeigt einen Fehlbetrag von 800 Millionen Euro, und wir fordern einen unabhängigen Prüfbericht, bevor auch nur ein Cent ausgegeben wird.",
        speaker: {
          name: "Beispiel Schiller",
          party: "Bündnis für eine Faire Zukunft",
          role: "Mitglied des Bundestags",
          parliament: "Bundestag (Beispielsitzung)",
        },
        spoken_at: "2026-03-12T11:05:00Z",
        source: {
          type: "plenarprotokoll",
          permalink: "https://beispiel-archiv.example/plenum/2026/03/12/zp-14-2",
          archive_wayback:
            "https://web.archive.org/web/2026/https://beispiel-archiv.example/plenum/2026/03/12/zp-14-2",
          content_hash:
            "7c5b2a91f4e3d08c6a1b7f2e9d84c30b5a6f1d2e7c48b90f3a5d1c6e2b804a7f",
          rights_basis: "amtliches Werk, gemeinfrei (§ 5 UrhG)",
        },
        span_hash:
          "be0792fa3c556c2b81e40af7d539e70a4b8f1c113d9a6c2b81e40af7d539",
        verification: "hash",
        locator: {
          protokoll: "31. Sitzung, 12.03.2026 (Beispielprotokoll 00/12345)",
          sitzung: "2026-03-12",
          tagesordnungspunkt: "TOP 14.2: Klimapakets 2026 (Beispiel)",
        },
        match: { start: 51, end: 62 },
      },
    ],
  },

  // Kontext-Bündel: wird on demand über GET /v1/spans/{span_id} geladen.
  spans: {
    a3f97c1e09bb4d201d44be0792fa3c55: {
      context: [
        {
          span_id: "c0ffee01",
          speaker_name: "Beispiel Dr. Vorne",
          party: "Bündnis für eine Faire Zukunft",
          text_start: 12,
          text_end: 24,
          verbatim_text:
            "Die Vorlage bringt nicht das, was sie verspricht. Die Kalkulation ist nicht nachvollziehbar.",
        },
        {
          span_id: "a3f97c1e09bb4d201d44be0792fa3c55",
          speaker_name: "Beispiel Mustermann",
          party: "Beispielunion",
          text_start: 25,
          text_end: 38,
          verbatim_text:
            "Sehr geehrte Präsidentin, die Vorlage des <Finanzausschusses> & der Regierung zeigen: Wir werden den Ansatz für Klimaschutz um 1,2 Milliarden Euro erhöhen.",
        },
        {
          span_id: "c0ffee02",
          speaker_name: "Beispiel Lechner",
          party: "Beispielfraktion für Ordnung",
          text_start: 39,
          text_end: 47,
          verbatim_text:
            "Dann wollen wir es wissen. Der Prüfbericht kommt, bevor ein Cent ausgegeben wird.",
        },
      ],
    },
    be0792fa3c556c2b81e40af7d539e70a4b8f1c113d9a: {
      context: [
        {
          span_id: "be0792fa3c556c2b81e40af7d539e70a4b8f1c113d9a",
          speaker_name: "Beispiel Schiller",
          party: "Bündnis für eine Faire Zukunft",
          text_start: 12,
          text_end: 30,
          verbatim_text:
            "Wir haben die Zahlen nachgerechnet: Die Mittel für Klimaschutz reichen nicht aus. Unsere Kalkulation zeigt einen Fehlbetrag von 800 Millionen Euro.",
        },
      ],
    },
  },

  // Ein VerifyResult pro Treffer: einer bestätigt mit TSA, einer ohne Zeitstempel.
  verify: {
    a3f97c1e09bb4d201d44be0792fa3c55: {
      ok: true,
      status: "ok",
      content_hash_expected:
        "8f14e45f2b3a9c61d07e25a8c4b6f9e31d204a7c5b8e1f0d3a6c9b2e5f81a40",
      content_hash_actual:
        "8f14e45f2b3a9c61d07e25a8c4b6f9e31d204a7c5b8e1f0d3a6c9b2e5f81a40",
      span_in_source: true,
      archive_wayback:
        "https://web.archive.org/web/2026/https://beispiel-archiv.example/plenum/2026/03/12/zp-14-2",
      archive_today: "https://archive.example/today/144220260312104200",
      timestamp_status: "ok",
      timestamp_tsa: "TSA-Beispiel 2026-03-14T08:00:00Z",
      timestamp_gen_time: "2026-03-14T08:00:00Z",
    },
    be0792fa3c556c2b81e40af7d539e70a4b8f1c113d9a: {
      ok: true,
      status: "ok",
      content_hash_expected:
        "7c5b2a91f4e3d08c6a1b7f2e9d84c30b5a6f1d2e7c48b90f3a5d1c6e2b804a7f",
      content_hash_actual:
        "7c5b2a91f4e3d08c6a1b7f2e9d84c30b5a6f1d2e7c48b90f3a5d1c6e2b804a7f",
      span_in_source: true,
      archive_wayback:
        "https://web.archive.org/web/2026/https://beispiel-archiv.example/plenum/2026/03/12/zp-14-2",
      timestamp_status: "missing",
    },
  },
};
