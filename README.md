# THE OBSERVATORY — RP Access + Classified Dossier Archive (v2)

A complete **static RP website** designed for GitHub Pages. The original black-and-white eye-shaped login has been kept, along with the playable access challenges, fictional reboot and local account creation. This update adds a dark-green classified-dossier workspace, subject profiles, incident logs, crossed-out files, a searchable directory and an archive terminal.

## What is included

**Entry and gameplay (preserved from v1):**

- Eye-shaped logo, 5-attempt login warning, eerie monochrome UI and emergency terminal.
- **Power Overload:** hold and trace each of 5 increasingly difficult wire paths without releasing; 3 lives per run.
- **Brute Force:** accurately type changing codes against shrinking timers; 5 escalating levels and 3 lives per run.
- Animated error effects on failure and a simulated reboot after completing either game.
- Account registration unlocked by a winning run. Identity stored **only on this device/browser**.

**New archive (v2):**

- Responsive dossier-dashboard interface with eye insignia, status indicators, sidebar, search and category filters.
- **Combined Tiff–Delilah case**: synopsis, facts, **14** linked incident entries, cross-references, **9** open questions.
- **Tiffy Lou**: subject summary, medical/organisational history and **11** recorded incidents. The source PDF names the subject *Tiff*; the full name “Tiffy Lou” is used as requested but is not confirmed by that PDF.
- **Delilah**: subject summary and **11** recorded incidents from the uploaded dossier.
- Reserved, **not fabricated**, dossier shells for **Rick Gnorc**, **Original Echo**, **Eggplant** and **Black Veil**.
- Crossed-out, withdrawn files for **Skeleton Crew**, **Daisy Andrews** and **The Sanctary** (original user spelling). Clicking “Request Restoration” triggers a simulated file error; there is no hidden record payload.
- Dossier tabs: **Overview**, **Incident Log**, **Connections**, **Open Questions**, **Field Notes**.
- Expandable incident timeline, clickable related dossiers, source labels, copy-file-ID and simulated integrity scan.
- Save per-record **field notes** locally in the browser; notes do not sync to another device.
- **Archive console**: open from the dashboard and type `help`, `list`, `open tiffy`, `open TFD-COMB`, `search Hazel`, `scan`, `status`, `clear`, `exit` or `logout`.
- `/` focuses archive search when not typing into a field. The login terminal can still be toggled with backtick (`) when the login page is visible.

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | Login, account creation, archive layout, terminal and minigame containers |
| `styles.css` | Dark UI, effects and responsive layouts |
| `app.js` | Login, minigames, reboot and terminal recovery logic |
| `data.js` | Public RP case facts, incident entries, subjects and redacted placeholders |
| `archive.js` | Interactive archive file navigation, filtering, tabs, local notes and terminal commands |
| `README.md` | These instructions |

## Running locally

1. Extract this ZIP.
2. Run a local static server in the extracted project folder:

   ```bash
   python -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser.
4. Choose **OPEN EMERGENCY TERMINAL**, complete all 5 levels of either minigame, wait for the reboot, create your RP identity and enter the archive. On returning, use your saved demo alias and passphrase to log in on the same device.

Using `http://localhost` is preferable to double-clicking `index.html` because passphrase hashing uses Web Crypto, which requires a supported secure browser context (localhost or HTTPS).

## Deploy to GitHub Pages

1. Create a repository on GitHub.
2. Upload the **contents** of the extracted folder (`index.html`, `app.js`, `archive.js`, `data.js`, `styles.css`, `README.md`) to the repository's default branch.
3. Go to **Settings → Pages**. Under **Build and deployment**, select **Deploy from a branch**, your branch (usually `main`), and `/(root)`.
4. Open the GitHub Pages URL displayed by GitHub after deployment. HTTPS is automatic for `github.io` deployments.

No bundler, package manager or build process is required. Google Fonts are optional; the site includes local font fallbacks.

## Updating RP lore

- Edit `data.js` to expand or change your RP story. Each record is a JavaScript object with its own `id`, `name`, `slug`, `kind`, `facts`, `paragraphs`, `events`, `links` and `questions`.
- For a chronology, use `events: [["REF","TITLE","DESCRIPTION"], ...]`.
- For an internal clickable relationship, use `links: [["EXISTING-RECORD-ID","NAME","RELATIONSHIP"], ...]`.
- For new people whose details are not supplied, keep `completeness:'EMPTY'` until you provide confirmed RP material.
- To cross out a record use `kind:'redacted'` and `category:'REDACTED'`. Its page intentionally shows only its title and visual redaction effect.
- The Tiff–Delilah case data is paraphrased from the user's provided **five-page “Tiff_Delilah_Combined_RP_Dossier_v4 (1).pdf”**. Its unresolved questions are intentionally retained.
- For the individual source subject labeled **Tiff**, the requested heading **Tiffy Lou** is provisional; verify the full name in your RP before treating it as established lore.

## Security / safety limitations — please read

**GitHub Pages is public and this is NOT secure authentication.** A GitHub Pages site serves `data.js` and all JavaScript to the public, regardless of whether someone has beaten the minigames or registered an account. Client-side checks, redactions and “classified” labels are RP effects, not access restrictions. **Do not upload real secrets, sensitive details or private data about real people.**

- Device-local accounts are only demonstrations, not shared multiuser credentials or secure identity management. Do not use a password from any real account.
- Per-record field notes are stored in browser `localStorage`, are accessible to scripts operating on the same origin and can be cleared when browser data is removed. They are **not encrypted** or cloud-synchronised.
- The in-game terminal, overload and brute-force mechanics are fictional simulations and never probe real systems.
- The terminal `reset` command on the login screen clears the RP account, its 5-attempt counter and local dossier notes for this browser. It does not affect other visitors or servers.
- For true member-only records and cross-device accounts, migrate to a protected backend/database with server-enforced access rules and proper authentication before publishing sensitive information.

The uploaded PDF itself is not bundled in this public template; its story information is contained in `data.js` and is **public**.
