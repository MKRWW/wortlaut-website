# wortlaut-website

Die statische Homepage von **[wortlaut.io](https://wortlaut.io)** — dem Archiv des
öffentlichen Wortes. Reines HTML/CSS, **kein Build, keine Abhängigkeiten**.

> Schwester-Repo zum Quellcode: **[MKRWW/wortlaut](https://github.com/MKRWW/wortlaut)**.
> Hier lebt nur die Website, damit der Webserver nichts anderes als die Seite ausliefert.

## Struktur
| Datei | Inhalt |
|-------|--------|
| `index.html` | Landingpage (Was · Prinzipien · Fahrplan · FAQ · Mitmachen) |
| `styles.css` | Marken-Look (Terminal-Dark, Monospace, Grün/Amber) |
| `impressum.html` | Impressum (§ 5 DDG) |
| `datenschutz.html` | Datenschutzerklärung (Entwurf, juristisch prüfen lassen) |

## Lokal ansehen
```bash
python -m http.server 8080   # dann http://localhost:8080
```

## Deploy (Plesk + Git-Pull)
- **Bereitstellungsmodus:** Automatisch (Push auf `main` → Auto-Deploy)
- **Repository-URL:** `https://github.com/MKRWW/wortlaut-website.git`
- **Branch:** `main`
- **Serverpfad:** `/httpdocs` — die Site liegt im **Repo-Root**, also Document Root = `/httpdocs` (Standard). Es wird ausschließlich die Website ausgeliefert.

## Mitmachen (GitFlow)
- `main` = veröffentlichter Stand (wird deployt). **Geschützt.**
- `develop` = Integration, Standard-Ziel für Beiträge. **Geschützt.**
- Feature-Branch aus `develop` → PR gegen `develop` → Release per Fast-Forward nach `main`.
- CI-Gate: Secret-Scan (gitleaks) + HTML/Link-Check müssen grün sein.

## Redaktionelles
- **Keine Betreiber-/Infra-Specifics**, **keine Klarnamen** der Truppe (öffentliche Disziplin).
- Lizenz: [AGPL-3.0](LICENSE), wie das Quellcode-Repo.
