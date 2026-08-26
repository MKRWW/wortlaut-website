# Increment-Spec: Demo-Unterseite /demo — FTS-Suche + Verify (#44)

> ## AUFTRAG AN DEN CODER — ZUERST LESEN
> Du bist der **Coder**, nicht der Reviewer. **Implementiere diese Spec.**
> - Lege die Dateien aus **§10** wirklich auf der Platte an und ändere die dort genannten
>   bestehenden Dateien.
> - **Keine Rückfragen.** Wenn etwas unklar ist, halte dich wörtlich an **§11**.
> - **Schreibe keine Review-Analyse** und **ändere diese Spec nicht.**
> - Halte die Do-NOT-Liste in **§12** ein.
> - Führe **keine** git-, docker- oder npm-Befehle aus außer dem in **§13**.

- **Story/Issue:** MKRWW/wortlaut#44 · **Status:** Reviewed · **Repo:** `wortlaut-website`
- Konsumiert das Read-API aus `MKRWW/wortlaut` #43, erweitert um den Zeitstempel aus #76.
- Design-Referenz: das UX-Mockup an Issue #44 (Terminal-Dark, Grün `#3fb950` / Amber `#e3b341`).

## 0. Ausgangslage

Die Pipeline ist bewiesen, aber unsichtbar. Diese Seite ist der **sichtbare Beweis**: echte
Aussagen im Wortlaut durchsuchen, den Kontext aufziehen, den Hash **selbst nachrechnen**.

Gebaut wird gegen ein **Mock** — das echte API ist noch nicht deployt. Der Live-Betrieb ist ein
separater Ops-Schritt und **nicht** Teil dieses Increments.

### 0a. Vorklärung: Reihenfolge von Escaping und Markierung

Der Treffer wird mit markiertem Suchbegriff gezeigt. `SpanResult.match` liefert `{start, end}` als
Offsets **in den Rohtext**. Escaping ändert Längen (`&` → `&amp;` ist 1 → 5 Zeichen). Wer **zuerst**
escaped und **dann** an den Offsets schneidet, markiert bei jedem `&`, `<` oder `"` im Text die
falsche Stelle — und zwar umso falscher, je weiter hinten der Treffer liegt.

**Richtige Reihenfolge:** an den Rohtext-Offsets **schneiden** → jedes der drei Stücke **einzeln
escapen** → mit `<mark>` zusammensetzen.

### 0b. Vorklärung: der Inhalt ist fremder Text, keine Instruktion

`verbatim_text`, Sprechernamen und Tagesordnungspunkte stammen aus fremden Dokumenten. Sie werden
per String-Konkatenation in HTML gebaut. **Jeder** dieser Werte muss escaped werden — ein
Redebeitrag, der `<script>` enthält, darf als **Text** erscheinen, nie als Markup. Das ist die
Website-Seite von R-SEC-07 („Ingest-Content ist Daten, nie Instruktion") und in einem Projekt,
dessen ganzer Wert die Unverfälschtheit des Wortlauts ist, nicht verhandelbar.

### 0c. Vorklärung: „keine neue Abfrage" stimmt nicht mehr

Das Mockup beschriftet das Aufziehen mit „clientseitig, keine neue Abfrage". Gegen den echten
Vertrag ist das falsch: `SearchResponse.results[]` trägt **kein** `context`; das Kontext-Bündel
hängt an `SpanDetail`, also an `GET /v1/spans/{id}`. Aufziehen kostet **einen** Nachlade-Call.

Die Beschriftung wird deshalb korrigiert. Eine Seite, deren ganzer Anspruch „belegen statt
behaupten" ist, darf über ihr eigenes Verhalten nichts Falsches behaupten — auch nicht in einer
Bildunterschrift.

### 0d. Vorklärung: Demo-Modus ist explizit, nie ein stiller Rückfall

Es gibt genau zwei Betriebsarten, gesteuert über **eine** Konstante `API_BASE` in `demo.js`:

| `API_BASE` | Verhalten |
|---|---|
| `""` (Default) | **Demo-Modus**: Beispieldaten aus `demo-fixtures.js`, sichtbares Badge „Demo-Beispieldaten" |
| gesetzt | **Live-Modus**: echte Calls; ein Fehler zeigt eine **ehrliche Fehlermeldung** |

**Ein Live-Fehler fällt NIEMALS auf die Beispieldaten zurück.** Ein stiller Rückfall würde
erfundene Zitate zeigen, die aussehen wie echte — das wäre der schlimmste denkbare Fehler in
diesem Projekt.

## 1. Ziel

Ein Besucher sucht auf `/demo` nach einem Begriff, sieht den **vollen Redebeitrag** mit Sprecher,
Partei, Datum, Tagesordnungspunkt, Permalink, Archivlinks und Hash, kann den **Kontext aufziehen**
und den **Hash selbst nachrechnen lassen** — inklusive der Aussage, ob der Wortlaut **unabhängig
zeitgestempelt** ist.

## 2. Nicht-Ziele (Scope-Grenze)

- **Kein API-Bau** (das ist #43) · **kein Deploy/Cloudflare-Setup** (Ops, privat).
- **Keine Auth, keine Accounts, kein Schreibpfad.**
- **Keine semantische Suche** (Flug #2) · **kein dialogischer Verbund** (#53).
- **Kein Framework, kein Build-Schritt, keine Runtime-Dependency.** Vanilla-JS, wie der Rest der Site.
- **Kein Ranking, keine Wertung, keine Sortierung nach Partei.**

## 3. Betroffene Interfaces

Konsumiert (read-only, alle `GET`):

```
GET /v1/search?q=…&limit=…&offset=…   -> {results: SpanResult[], total: number}
GET /v1/spans/{span_id}               -> SpanDetail   (= SpanResult + context: ContextItem[])
GET /v1/spans/{span_id}/verify        -> VerifyResult
```

Feldnamen exakt wie im API-Schema:

- `SpanResult`: `span_id`, `verbatim_text`, `speaker{name,party,role,parliament}`, `spoken_at`,
  `source{type,permalink,archive_wayback,archive_today,content_hash,rights_basis}`, `span_hash`,
  `verification`, `locator{protokoll,sitzung,tagesordnungspunkt}`, `match{start,end}|null`
- `ContextItem`: `span_id`, `speaker_name`, `party`, `text_start`, `text_end`, `verbatim_text`
- `VerifyResult`: `ok`, `status`, `content_hash_expected`, `content_hash_actual`, `span_in_source`,
  `archive_wayback`, `archive_today`, `timestamp_status`, `timestamp_tsa`, `timestamp_gen_time`

**`timestamp_status` hat genau diese sechs Werte** (aus `pipeline/verify.py`, Spec 0076) — sie sind
bindend, es gibt keine anderen:

```
"ok" | "mismatch" | "untrusted" | "malformed" | "missing" | "unreadable"
```

**Erfinde hier nichts.** Ein Mapping auf ausgedachte Werte wie `"confirmed"` oder `"none"` trifft
**nie** zu und schiebt damit *jeden* Span in den Fehlerzweig — auch den erfolgreich gestempelten.
Das ist im ersten Durchlauf genau so passiert.

**Optional sind** `match`, `archive_wayback`, `archive_today`, `speaker.party`, `speaker.role`,
`locator.*`, `timestamp_tsa`, `timestamp_gen_time` — jedes braucht einen Leerfall.

## 4. Design

### 4.1 Reine Funktionen + dünne DOM-Schicht

`demo.js` exportiert **reine Funktionen** (Daten → HTML-String bzw. Daten → Zustandsobjekt) und
verdrahtet sie in einer dünnen Schicht ans DOM. **Why:** So sind die AKs mit `node --test`
prüfbar — ohne Browser, ohne jsdom, ohne eine einzige neue Dependency. Node 20 steht in der CI
bereits für HTMLHint bereit.

Pflicht-Exporte (Namen bindend, die Tests hängen daran):

```js
export function escapeHtml(s)                  // & < > " ' -> Entities
export function renderVerbatim(text, match)    // Rohtext + Offsets -> escaped HTML mit <mark>
export function renderCard(result)             // SpanResult -> HTML-String einer Ergebniskarte
export function renderContext(items)           // ContextItem[] -> HTML-String
export function verifyLabels(verifyResult)     // VerifyResult -> {hash:{ok,text}, stamp:{state,text}}
export function errorMessage(kind)             // 'network'|'http'|'empty' -> verstaendlicher Text
```

### 4.2 Verify sind **zwei** Aussagen, nicht eine

`verifyLabels` liefert getrennt:

- **Hash** aus `ok`: „✓ Hash bestätigt" / „✗ Hash weicht ab".
- **Zeitstempel** aus `timestamp_status`, gemäß dieser **bindenden** Tabelle:

| `timestamp_status` (API) | `stamp.state` (UI) | Darstellung |
|---|---|---|
| `"ok"` | `confirmed` | bestätigt, mit TSA und `gen_time` |
| `"missing"` | `none` | **neutral** — kein Mangel |
| `"mismatch"` · `"untrusted"` · `"malformed"` · `"unreadable"` | `error` | auffällig |

Die API-Werte und die UI-Zustände sind **zwei verschiedene Vokabulare**. Nicht eins zu eins mappen.

Der Zustand „kein Zeitstempel" ist **neutral**, nicht rot. Das Schema sagt ausdrücklich: „Fehlender
Stempel degradiert nichts — `ok`/`status` bleiben hash-only." Eine Demo, die dafür Rot zeigt,
behauptet einen Mangel, den es nicht gibt.

### 4.3 Neutralität

Die Partei erscheint als **neutraler Tag**. Der Punkt davor ist ein reines Aufzählungszeichen und
trägt für **jede** Fraktion **dieselbe** gedeckte Farbe (`--muted`).

**Kein Farb-Mapping je Partei, auch kein gehashtes.** Ein Hash über den Parteinamen verteilt
Farben zufällig — und wenn dabei die Marken-Grün `#3fb950` herauskommt, steht der Partei-Tag in
exakt der Farbe, die zwei Zeilen darunter „✓ Hash bestätigt" bedeutet, während eine andere
Fraktion Rot bekommt. Das liest sich als Urteil. Neutralität ist in diesem Projekt eine
**Rechtsstrategie** (`docs/legal.md` §9), keine Geschmacksfrage: Sie entkräftet den Vorwurf, das
Werkzeug richte sich gegen eine bestimmte Partei. Diese Zufalls-Palette ist im ersten Durchlauf
entstanden und darf nicht wiederkommen.

Verboten sind damit: Valenz-Farben, partei-abhängige Farben jeder Art, Sortierung nach Partei,
Ranking. Die Reihenfolge ist exakt die der API-Antwort. Der Neutralitäts-Hinweis steht sichtbar
über den Ergebnissen.

### 4.4 Kein stiller Schnitt

`verbatim_text` wird **immer vollständig** ausgegeben. Lange Beiträge dürfen per CSS optisch
eingeklappt werden, aber der Text steht vollständig im DOM und ist aufklappbar. Ein
Satz-Schnipsel als „das Zitat" ist ein harter Stop (§12).

## 5. Testbare Akzeptanzkriterien

- [ ] **AC1** Given eine Suchantwort mit zwei Treffern, When `renderCard` je Treffer läuft, Then
  enthält der HTML-String den **vollständigen** `verbatim_text` sowie Sprecher, Partei, Datum,
  Tagesordnungspunkt, Permalink, beide Archiv-Felder und den `span_hash`.
- [ ] **AC2** Given `match={start,end}`, When `renderVerbatim` läuft, Then ist **genau** der
  Bereich zwischen den Offsets in `<mark>…</mark>` eingefasst.
- [ ] **AC2b** Given ein `verbatim_text`, der **vor** dem Treffer ein `&` oder `<` enthält, When
  `renderVerbatim` läuft, Then markiert `<mark>` weiterhin **exakt** das Suchwort — Beweis, dass
  an den Rohtext-Offsets geschnitten und erst danach escaped wird (§0a).
- [ ] **AC2c** Given `match=null`, When `renderVerbatim` läuft, Then wird der Text vollständig und
  escaped ausgegeben, **ohne** `<mark>` und ohne Fehler.
- [ ] **AC3** Given ein `SpanDetail` mit `context`, When `renderContext` läuft, Then erscheint je
  Nachbar-Beitrag Sprecher und Text; Kontext wird **on demand** über `/v1/spans/{id}` geladen, die
  Trefferliste wird dabei nicht neu geladen.
- [ ] **AC4** Given `ok=true`, When `verifyLabels` läuft, Then meldet `hash.ok === true` mit
  bestätigendem Text; given `ok=false`, Then `hash.ok === false`.
- [ ] **AC4b** Given `timestamp_status` bestätigt plus `timestamp_tsa`/`timestamp_gen_time`, When
  `verifyLabels` läuft, Then trägt `stamp` einen **eigenen** Zustand samt TSA und Zeit — getrennt
  vom Hash-Ergebnis.
- [ ] **AC4c** Given `timestamp_status === "missing"`, When `verifyLabels` läuft, Then ist
  `stamp.state === "none"` — **neutral**, nicht `error` — und `hash` bleibt davon unberührt.
- [ ] **AC4d** Given **jeden** der sechs echten `timestamp_status`-Werte, When `verifyLabels`
  läuft, Then entspricht `stamp.state` exakt der Tabelle in §4.2 — je Wert ein Testfall. Kein Test
  und keine Fixture darf einen erfundenen Statuswert verwenden.
- [ ] **AC4e** Given ein unbekannter, nicht in §4.2 gelisteter Statuswert, When `verifyLabels`
  läuft, Then ist `stamp.state === "error"` (fail-safe für künftige API-Werte).
- [ ] **AC5** Given die gerenderte Seite, Then ist der Neutralitäts-Hinweis im Markup vorhanden;
  die Partei erscheint als Tag; **keine** Sortier- oder Ranking-Steuerung existiert.
- [ ] **AC5b** Given eine Trefferliste, When gerendert wird, Then ist die Reihenfolge **identisch**
  zur Reihenfolge in `results` — kein Umsortieren im Client.
- [ ] **AC5c** Given zwei Treffer **verschiedener** Fraktionen, When `renderCard` läuft, Then ist
  die Farbe des Partei-Punkts für beide **identisch**; im erzeugten HTML taucht **keine**
  partei-abhängige Farbe auf (§4.3).
- [ ] **AC6** Given ein `verbatim_text` mit `<script>alert(1)</script>`, When `renderCard` läuft,
  Then enthält der HTML-String **kein** ausführbares `<script>`, sondern die escapte Zeichenfolge
  (§0b). Gleiches für Sprechername und Tagesordnungspunkt.
- [ ] **AC7** Given Netzfehler, HTTP-Fehler und leeres Ergebnis, When `errorMessage` läuft, Then
  liefert sie je einen **unterschiedlichen**, verständlichen deutschen Text — kein Stacktrace,
  keine leere Seite.
- [ ] **AC8** Given `API_BASE === ""`, Then läuft die Seite im Demo-Modus mit sichtbarem Badge
  „Demo-Beispieldaten"; given `API_BASE` gesetzt und der Call schlägt fehl, Then erscheint die
  Fehlermeldung aus AC7 und **keine** Beispieldaten (§0d).
- [ ] **AC9** Website-CI grün: gitleaks · HTMLHint über `*.html` · `scripts/check_links.py` ·
  der neue `node --test`-Job.
- [ ] **AC10** `demo.html` ist über die Navigation der Startseite erreichbar und verlinkt zurück;
  `check_links.py` findet alle Referenzen.

## 6. Testplan (Test-zu-AC-Mapping)

`tests/demo.test.js`, ausgeführt mit `node --test` (Node 20, **keine** Dependency):

| AC | Test |
|---|---|
| AC1 | `test_karte_enthaelt_alle_belegfelder` |
| AC2 / AC2b / AC2c | `test_markierung_exakt` · `test_markierung_nach_sonderzeichen` · `test_ohne_match` |
| AC3 | `test_kontext_rendert_nachbarn` |
| AC4 / AC4b / AC4c | `test_hash_ok` · `test_zeitstempel_eigener_zustand` · `test_ohne_zeitstempel_neutral` |
| AC4d / AC4e | `test_alle_echten_statuswerte` (parametrisiert über alle sechs) · `test_unbekannter_status_ist_error` |
| AC5b / AC5c | `test_reihenfolge_unveraendert` · `test_partei_punkt_farbneutral` |
| AC6 | `test_script_wird_escaped` (verbatim_text, speaker.name, tagesordnungspunkt) |
| AC7 | `test_fehlertexte_unterscheidbar` |

AC5, AC8, AC9, AC10 deckt die CI (HTMLHint · check_links) plus die visuelle Abnahme durch den
Stakeholder ab.

## 7. Recht / Security

- **Ausgabe = nur wörtliche Spans** (R-CORE-01). Kein generierter Text, keine Zusammenfassung.
- **Escaping ist Pflicht** (§0b, AC6) — fremder Text ist Daten, nie Markup.
- **Keine Secrets**: Die API-Basis-URL ist öffentlich; es gibt keine Tokens im Frontend. gitleaks
  läuft über den Diff. **Keine ausgeschriebenen Beispiel-URLs mit Zugangsdaten** in den Fixtures.
- **Neutralität by design** (R-CORE-03) — §4.3.
- **Barrierefreiheit:** semantisches HTML (`<main>`, `<section>`, `<button>`, `<mark>`),
  Tastaturbedienbarkeit, sichtbarer Fokus, ausreichender Kontrast. **Kein Unicode-Fett** als
  Auszeichnungsersatz.
- Die Fixtures sind **erkennbar erfunden** (Namen wie „Beispiel Mustermann") und als solche
  gekennzeichnet — sie dürfen nie für echte Zitate gehalten werden.

## 8. Risiken & offene Fragen

- **Risiko:** CORS. Das API erlaubt Herkünfte per ENV (Kern-Repo #86); für Live-Betrieb muss die
  Domain dort eingetragen sein. Für den Demo-Modus **irrelevant**.
- **Risiko:** Die Fixtures könnten für echte Zitate gehalten werden → Badge + erfundene Namen +
  Hinweis im Fußbereich.
- **Bewusst offen:** Paginierung über `limit`/`offset` wird **nicht** gebaut (Nicht-Ziel); die
  Antwort trägt `total`, und die Seite zeigt „N von M" ehrlich an, statt eine Vollständigkeit
  vorzutäuschen.

## 9. Definition of Done

AC1–AC10 grün · voller Redebeitrag, prüfbarer Kontext und Verify sichtbar · Marken-Look und
Neutralitäts-Hinweis · PR gegen `develop` mit `Closes MKRWW/wortlaut#44`.

## 10. Files (NUR diese anlegen bzw. ändern)

**Neu:**
1. `demo.html` — die Seite (Root, damit HTMLHint und `check_links.py` sie automatisch erfassen).
2. `demo.css` — seitenspezifische Stile; die Marken-Tokens kommen aus `styles.css`.
3. `demo.js` — reine Funktionen (§4.1) + DOM-Verdrahtung, ES-Modul.
4. `demo-fixtures.js` — Beispieldaten, ES-Modul, `export const FIXTURES = {...}`.
5. `tests/demo.test.js` — `node --test`.
6. `package.json` — **nur** `{"private": true, "type": "module", "scripts": {"test": "node --test"}}`.
   Keine Dependencies. **Why:** `type: module` macht `.js` in Node zu ESM, sodass Browser und
   `node --test` dieselben Dateien laden.

**Ändern:**
7. `index.html` — einen Navigationslink auf `demo.html` ergänzen. **Sonst nichts.**
8. `.github/workflows/ci.yml` — einen Job `js-tests` (Node 20, `node --test tests/`).

**Nicht anfassen:** `styles.css`, `impressum.html`, `datenschutz.html`, `beweiskraft.html`,
`scripts/check_links.py`, `README.md`, `LICENSE`.

## 11. Umsetzungsdetails

### `demo.js`

- Kopfzeile: `export const API_BASE = "";` mit Kommentar, dass ein leerer Wert den Demo-Modus
  bedeutet und ein Live-Fehler **nie** auf Fixtures zurückfällt (§0d).
- `escapeHtml`: `&` zuerst, dann `<`, `>`, `"`, `'`.
- `renderVerbatim(text, match)`: ohne `match` → `escapeHtml(text)`. Mit `match` → `text.slice(0,
  start)`, `text.slice(start, end)`, `text.slice(end)` **einzeln** escapen, Mitte in `<mark>`
  fassen, zusammensetzen (§0a). Ungültige Offsets (negativ, `start >= end`, jenseits der Länge)
  wie „kein Match" behandeln.
- `renderCard(result)`: Kopf (Sprecher · Partei-Tag · Datum · TOP), voller Text via
  `renderVerbatim`, Aufzieh-Schalter als `<button>`, Provenienz-Zeile (Permalink · Wayback ·
  archive.today · `span_hash` · Verify-`<button>`). Fehlende optionale Felder werden **weggelassen**,
  nicht als „null" gerendert.
- `verifyLabels(v)`: `{hash: {ok, text}, stamp: {state, text}}`. `state` ist der **UI**-Zustand
  `'confirmed' | 'none' | 'error'` und wird über die Tabelle in §4.2 aus dem **API**-Wert
  `timestamp_status` abgeleitet (`"ok"` → `confirmed`, `"missing"` → `none`, die vier übrigen →
  `error`, unbekannt → `error`). `'none'` ist neutral.
- `partyTag(speaker)`: Punkt in **einer** gedeckten Farbe für alle Fraktionen, per CSS-Klasse
  (`.dot`) statt Inline-`style`. **Keine** Funktion, die eine Farbe aus dem Parteinamen ableitet.
- **URL-Sicherheit:** `permalink`, `archive_wayback` und `archive_today` werden nur als `href`
  gesetzt, wenn sie mit `http://` oder `https://` beginnen — sonst weglassen. Escaping allein
  entschärft ein `javascript:`-Ziel **nicht**. Span-IDs im Pfad mit `encodeURIComponent`.
- `errorMessage(kind)`: drei unterschiedliche deutsche Texte für `'network'`, `'http'`, `'empty'`.
- DOM-Verdrahtung ganz unten, hinter `if (typeof document !== "undefined")`, damit der Import in
  Node nicht auf ein DOM trifft.

### `demo.html`

Kopf, Navigation und Fußbereich wie `index.html` (gleiche Marke, `styles.css` **zuerst**, dann
`demo.css`). `<script type="module" src="demo.js"></script>`. Suchfeld als `<form>` mit `<label>`.
Der Neutralitäts-Hinweis und das Demo-Badge stehen **im Markup**, nicht per JS erzeugt — sie
müssen auch ohne JavaScript sichtbar sein.

### `demo-fixtures.js`

Zwei Treffer, unterschiedliche Fraktionen, erkennbar erfundene Namen. **Einer mit
`timestamp_status: "ok"`**, **einer mit `timestamp_status: "missing"`** und **einer ohne
`archive_today`**, damit die Leerfälle im Demo-Modus tatsächlich sichtbar werden. Dazu ein
`context`-Bündel und je ein `VerifyResult`.

Die Statuswerte sind die **echten** aus §3 — `"confirmed"`/`"none"` gibt es nicht.

### `.github/workflows/ci.yml`

```yaml
  js-tests:
    name: JS-Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - name: node --test
        run: node --test
```

**`node --test` ohne Pfadargument.** `node --test tests/` scheitert mit
`Cannot find module …/tests` — ein Verzeichnis ist kein gültiges Argument. Ohne Argument sucht der
Test-Runner selbst nach `**/*.test.js`. (Im ersten Durchlauf stand hier die falsche Form.)

## 12. Do-NOT (hart)

- **KEIN** stiller Rückfall vom Live-Modus auf die Beispieldaten (§0d).
- **KEIN** gecroppter `verbatim_text` — nie ein Satz-Schnipsel als „das Zitat".
- **KEIN** unescapetes Einsetzen von API-Daten in HTML (§0b).
- **KEIN** `innerHTML` mit unescapten Fremddaten · **kein** `eval` · **kein** `document.write`.
- **KEINE** Sortierung, kein Ranking, keine Wertung.
- **KEINE** partei-abhängige Farbe — auch keine gehashte oder zufällige (§4.3).
- **KEIN** erfundener `timestamp_status`-Wert in Code, Tests oder Fixtures (§3).
- **KEIN** `href` aus API-Daten ohne `http`/`https`-Prüfung.
- **KEINE** Dependency, **kein** Framework, **kein** Build-Schritt, **kein** CDN-Script.
- **KEINE** Änderung an `styles.css` oder den übrigen Bestandsseiten außer dem Navigationslink.
- **KEIN** Unicode-Fett, **keine** `<div>`-Buttons (echte `<button>`-Elemente).
- **KEIN** erfundenes Zitat, das wie ein echtes aussieht — Fixtures tragen erkennbar erfundene Namen.

## 13. Abschluss (und NUR das an Kommandos ausführen)

- `git status --porcelain` ausgeben. **Sonst nichts.**

Das Gate (HTMLHint · check_links · `node --test`) fährt der Reviewer.
