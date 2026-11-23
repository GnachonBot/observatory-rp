# THE OBSERVATORY // Archive Access (v3)

A static website for GitHub Pages with an eye-shaped login gateway, an emergency terminal, two escalating recovery challenges, a reboot sequence and the interactive classified dossier archive.

## Access flow

- **Primary credentials:** username `cortex`, password `element12`. Case-insensitive username, exact-case password. Signing in opens a timed archive session.
- **Emergency route:** choose **OPEN EMERGENCY TERMINAL**, then run **Power Overload** (trace wires) or **Brute Force** (type the sequences). Each has five levels and three lives per run. Each run consumes one of five attempts.
- **After successful recovery:** an animated reboot opens **TEMPORARY ACCESS**. Enter a name (no password). The name is saved in that browser's current tab session only.
- **Session timer:** both routes have **two minutes** after entering the archive. When it expires, the website displays **YOUR LOCATION HAS BEEN FOUND**, performs a cinematic *simulated* network search for approximately seven seconds, clears the temporary session and returns to the original login screen. Reloading does not extend a session.
- **Audio:** low-volume synthesized interface clicks, page cues, successes, errors, reboot and trace siren. Click the bottom-left **SOUND ON / OFF** control to mute or unmute. Browsers generally allow audio only after the first user interaction.

## Existing archive

The source-based Tiff and Delilah dossiers, combined case, timeline, unanswered questions, searchable files, notes, terminal commands and crossed-out records remain intact. Other subjects stay marked awaiting intel where no source information was supplied.

## Install on GitHub Pages

1. Extract the archive and upload the individual website files (`index.html`, `styles.css`, `app.js`, `audio.js`, `archive.js`, `data.js`) to the **root** of your GitHub repository.
2. Open the repository **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/(root)`, then save.
3. Open your Pages URL once publishing completes.

For local testing, run `python -m http.server 8000` inside the extracted folder and visit `http://localhost:8000`.

## What the site does *not* do (important for the publisher)

**The location detection is an animated narrative effect. It does NOT access the Geolocation API, IP geolocation services, or obtain anyone's actual location.** The 2-minute timer is entirely local.

**The credential check and minigame access checks are only client-side.** The example `cortex` / `element12` password is included in JavaScript and is not a secure secret. GitHub Pages serves all files—including `data.js`—publicly; anyone can inspect them even without logging in. Do not publish sensitive or private data about real people. For genuine restricted access, use a backend with server-side authentication and protected data storage.

Temporary session names are held in `sessionStorage`. Saved field notes remain browser-local in `localStorage` until they are manually cleared. Nothing is uploaded by this website.
