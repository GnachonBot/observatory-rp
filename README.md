# The Observatory // Cortex Private Vault (V9)

A fictional interactive archive website. V8 revises **the presentation of the V6 archive** so visitors see Cortex's own files, as though they have gained access to his private recovery system. The dossiers are not a player briefing or a set of missions.

## What changed in V9

- The archive terminal has a new **03 // TRACE JAMMER** memory-minefield module (command: `mines`, `jammer` or `03`).
- A 4 × 4 board displays six safe blocks for seven seconds, then hides them. Select all six from memory; three mine strikes fail the run. Retrying does not spend an access attempt.
- A success disables the five-minute archive trace for the remainder of that browser-tab session (including refresh). It also disables the archive terminal's own shell timeout. The countdown reads `DISABLED`.
- Normal five-minute timeout and the extended location-found animation remain active until the minigame is won. Access through the main login or emergency recovery still works as before.
- This is a fictional, entirely client-side system. The archive remains public on GitHub Pages.

## Prior changes in V8

- Archive sessions end after **05:00** instead of 02:00.
- An open emergency/archive terminal shell has its own **05:00** auto-close timer; entering a game closes the shell timer.
- The “YOUR LOCATION HAS BEEN FOUND” screen lasts approximately **20 seconds** before returning to the login.

## What changed in V7

- The archive is titled **CORTEX // PRIVATE ARCHIVE**. The session identifies itself as a mirrored, unverified connection.
- The introductory directive has become **PERSONAL MEMO 001 // UNSENT** with internal cross-reference buttons.
- Instructions such as "Find the missing connections" have been replaced with the last known scan statuses and incomplete signal observations.
- The files use recovered incident chronology, internal analysis, unverified correlation tables, private logs, and redaction markings instead of author/development commentary.
- "CORTEX NOTES" now appears as **PRIVATE LOGS** and the editable note pad as a **LOCAL BUFFER**.
- The lore from V6 remains: Cortex cannot find Tiff; Delilah is his lead; Delilah's memory recovery is unknown to Cortex; Echo, Black Vein, Veil, Element12, MIB and the three crossed-out files remain.

## What remains unchanged

- First login: `cortex` / `element12`.
- Five-login-attempt limit and emergency terminal.
- Power Overload wire trace game and Brute Force typing game.
- Five stages, lives, reboot, and name-only temporary session.
- Five-minute archive sessions followed by an approximately 20-second simulated location-found trace before reset.
- Adaptive background soundscape, effects, mute toggle, music volume and test button.
- The complete 16-file dossier archive, including search, redacted records, and locally saved notes.

## Publish on GitHub Pages

1. Extract this ZIP.
2. Upload all **seven files** to the root of your existing `observatory-rp` GitHub repository, replacing the old versions.
3. Commit. GitHub Pages updates the published site automatically when configured to deploy from `main` / `/(root)`.
4. If you still see the previous version, hard-refresh the page or reopen it in a private browser tab to avoid cached JavaScript.

There is no build step or external dependency; the main entry point is `index.html`.

## Important hosting note

This website is a fictional game interface. GitHub Pages is public static hosting: the displayed login is not secure authentication and anyone can download the dossier data or see the credential values in JavaScript. Use only fictional or otherwise publicly shareable content. The location-found sequence is simulated and does not track the visitor.