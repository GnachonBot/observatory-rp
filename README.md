# THE OBSERVATORY // Cortex Intelligence Archive (V6)

A single-page, static website built for GitHub Pages. Includes the eye-logo login, Cortex access, an emergency terminal, two five-level minigames, a reboot/name-only temporary session, a two-minute trace sequence, adaptive browser-generated music, and a 16-file classified archive.

## V6 — the revised investigation

The archive is written **from Cortex's limited point of view**. Cortex's objective is to locate Tiffy Lou and obtain a blood sample to understand how she survived a reportedly lethal Black Vein mismatch. He cannot find her. He watches Delilah because the two were best friends, hoping Delilah will eventually lead him to Tiff. Delilah has been seen repeatedly wearing yellow, but recent sightings show the pattern has stopped; Cortex does not know why.

**Important story continuity:** Cortex has no confirmed knowledge of Delilah's present memory condition. The archive does not establish any later recovery. All Pizza This references were removed at the publisher's direction. The case chronology ends with disappearance, memory-loss reports and subsequent surveillance.

Newly developed archive histories:

- **TIFF // DELILAH:** The combined investigation, failed search strategy, and unanswered signals.
- **TIFFY LOU:** Service history, House of Havoc, major injuries, Black Vein survival and current unknown location.
- **DELILAH:** Past leadership, presumed death, memory loss, yellow sightings and Cortex's surveillance.
- **RICK GNORC:** Echo founder, Sid Knee, Tiff's partner, suspected farm and Veil tracking program; no usable location.
- **ORIGINAL ECHO:** Rick and Sid's fear-based recruitment videos, Koa's hatch, Eggplant's emergence and the temporal rupture.
- **EGGPLANT:** Freedium, later called Element12; MIB's pursuit of the creatures for power.
- **BLACK VEIL:** Unresolved older index heading; not automatically equated with Black Vein or Veil.
- **BLACK VEIN:** Memory-erasing substance and Tiff's unexplained survival of an incompatible/lethal variant.
- **PROJECT VEIL:** Possible Rick-operated system for tracking people, not located by Cortex.
- **MIB // COLLAPSE:** Cortex's former crew, attempts to take creatures for energy, bunker raid and collapse.
- **KOA:** Intended creature hatched by Echo, missing from recent sightings.
- **SID KNEE:** Rick's founding collaborator, now unlocated.
- **TEMPORAL FRACTURES:** Larger creature hunting Element12, time ruptures and the team's scattering.
- **SKELETON CREW / DAISY ANDREWS / THE SANCTARY:** Struck-through records, redacted fragments and partial historical links where supplied.

A new **CORTEX NOTES** tab exists on each readable dossier. Margin notes also appear on overview pages and certain incident entries, with redacted scraps on withdrawn files. Search includes intercepted text and personal notes.

## Access and soundtrack

- Main login: **username `cortex` / password `element12`**. These are public, in-browser demo credentials.
- Emergency terminal: **Power Overload** (hold-to-trace wires) or **Brute Force** (type codes). Five levels per game, three lives per run, five global attempts.
- After a successful minigame: a reboot, then a name-only temporary archive session. No password for this emergency session.
- After two minutes in the archive: a dramatic **YOUR LOCATION HAS BEEN FOUND** search sequence, followed by a return to the login screen. This is **only a fictional animation**. No real geolocation or IP-based location tracking occurs.
- The original browser-synthesized soundtrack responds to page changes, games, levels, dossiers and final trace. Music was remixed into a clearer speaker-friendly frequency range. **MUSIC volume** and **▶ TEST MUSIC** controls are included alongside the master audio toggle. Browser sound usually requires a first click or tap.

## Publish or update GitHub Pages

1. Extract the ZIP. Upload these **seven** files into the root of your existing `observatory-rp` repository, replacing older versions:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `audio.js`
   - `archive.js`
   - `data.js`
   - `README.md`
2. Commit the changes to your `main` branch.
3. Ensure **Settings → Pages → Deploy from branch → main / (root)** is selected.
4. When the new version publishes, hard-refresh the site (`Ctrl+Shift+R`, or fully close and reopen the tab on mobile). Test `▶ TEST MUSIC` if only the clicks can be heard.

For local testing, from the extracted folder run `python -m http.server 8000` and open `http://localhost:8000`.

## Edit the stories

All dossier contents and cross-file links are in `data.js`. Each entry has an `id`, `name`, `lead`, `facts`, `paragraphs`, `events`, `links`, `questions` and `intercepts`. To extend the narrative, edit the text while preserving the JavaScript punctuation and the linked `id` fields. Cortex's current unknowns are deliberately written as open questions rather than resolved facts.

## Privacy and security note

This is a **fictional interactive experience, not a protected database**. GitHub Pages hosts the entire website as public static files. Anyone can inspect its JavaScript and retrieve the dossier text without passing the on-screen login, and the demo credentials cannot protect private information. Only publish fictional or deliberately public information. Real access control would need server-side authentication and private data storage.

Temporary session names are stored in `sessionStorage` for the current tab. Player-written field notes are stored in that browser's `localStorage`, and nothing is sent to a remote server. The animation never requests or identifies a visitor's actual location.
