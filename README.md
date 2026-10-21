# Clock

A buildless, offline PWA that looks like a personal lock screen. Select exactly one digit (1–9) as a minute offset, choose forward or backward, then show the clock. Tapping another digit replaces the selection. There is no zero or multi-digit input in performance mode.

## On your phone

Open the published URL online and wait for **Ready offline**. On iPhone, open in Safari, choose **Share → Add to Home Screen** and enable **Open as Web App** if offered. Launch from that icon for the browser-free presentation. Other browsers can use their Install app option or fullscreen where supported. Browser fullscreen availability and iOS status/home bars depend on the OS; this is a simulated lock screen, not the system lock screen.

Choose a digit, then **Show lock screen**. Hold anywhere still for one second to return to the keypad. Escape also returns on a keyboard. Preview real time uses no offset. The clock is recomputed from the device time every 200 ms, including when returning from the background, and the date rolls over with the shifted time. It uses the phone's configured timezone and clock; it does not need GPS or an internet time server.

**Appearance** lets you import a JPEG/PNG or other browser-supported image, adjust clock/date position, font, text colour and size, and choose 12/24 hours. Imports are stored in local IndexedDB; appearance uses localStorage. Nothing is uploaded. Remove the old clock and date from screenshots before importing; this app does not automatically inpaint new screenshots. The included background is an edited copy of the supplied reference, with its original date and clock removed. Its carrier, battery, weather, and decorative buttons are static image details.

### Reference accuracy

The default background now uses the original 1170 × 2532 JPEG directly. Only the date/clock regions receive a feathered repair layer; the mountain, widgets, status icons and bottom controls come from the original screenshot. A custom background hides that repair layer.

The serif clock requests Apple's native New York via `ui-serif`, using calibrated optical size, weight, proportional lining figures, separate hour/minute spacing and the centered-colon alternate (`ss01`). The live date uses the system sans face. No Apple font files are redistributed. The reference profile is calibrated for Safari on Apple platforms; Chromium and other platforms may select a different fallback. Existing unchanged v1 defaults migrate automatically; **Restore reference typography** also restores the measured profile.

To pin the clock to an actual font file, open **Appearance → Import exact clock font** and choose `NewYork.ttf` (or another TTF, OTF, WOFF or WOFF2 file you can use). The app decodes the file through `FontFace`, saves the original file in local IndexedDB and loads it before displaying the clock. Once imported, the clock uses that file directly rather than the browser's serif fallback, including after an offline restart. Import once per browser/device; storage is not synced. A broken replacement file does not overwrite a working one. If a saved font cannot be restored, serif performance is blocked with a visible recovery message rather than silently switching to a lookalike. **Use device font instead** removes the saved font.

Apple's guidance says not to bundle its system fonts, including New York, in distributed apps: https://developer.apple.com/documentation/technologyoverviews/fonts . The public repository therefore contains the font loader, not Apple's font binaries. Font imports never leave the device. On a Mac the system font can be found at `/System/Library/Fonts/NewYork.ttf`; transfer the file privately to your phone and select it in the importer.

For visual checking, open `qa/reference.html` in Safari. It uses the same stylesheet and clock renderer as the real app, fixed to the screenshot's 16:52 and Wednesday, 21 October. Its `?pixel` mode renders a 585 CSS-pixel-wide reference, matching the original image width on a 2× Mac display. Final device verification still matters: iOS font versions, display scaling and the native status/home bars are outside this web app's control.

## Offline

The service worker precaches every runtime asset, including the default background and icons. After the first successful online load the app can reopen offline. Browser storage can be cleared or evicted; check the ready message before performing. Updates wait for existing app windows to close, so they do not replace assets mid-performance. Bump the cache version in `sw.js` whenever runtime files change.

## Development

No installation or build step:

```sh
npm start
npm test
```

Open http://127.0.0.1:8765. Service workers require HTTPS or localhost. Clear the site's service worker/cache during local development to see asset changes immediately.

## GitHub Pages

All URLs are relative and work under a repository subpath. In repository **Settings → Pages**, set the source to **GitHub Actions**. The included workflow deploys on pushes to `main` or manual dispatch. Only this directory belongs in the deployment repository; do not publish the surrounding workspace.
