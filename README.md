# Clock

An offline clock performance app with a personal wallpaper. Select one digit (1–9) to preset the clock **ahead** of real local time by that many minutes. A short tap on the lock screen then jumps backward to the real time and continues ticking normally. For example, at 18:38, choosing 3 shows 18:41; tapping the lock screen returns it to 18:38.

## Choose your wallpaper

Open **Appearance → Choose wallpaper** and pick a normal wallpaper from Photos or Files. The selected image and its preview are saved on this device. The app draws the live clock, live date, and flashlight/camera control replicas over the image. Those controls are decorative; they do not launch the camera or torch.

The photo fills the available viewport while the overlay layout stays independent of the photo's aspect ratio. Changing wallpapers therefore cannot crop or reposition the clock and controls. The default is a cleaned mountain wallpaper derived from the supplied reference. Import your original wallpaper for the original photo's exact detail. Old screenshot backgrounds are retained in their old storage record but are not reused by the new wallpaper renderer.

## Use

Choose 1–9, then **Show lock screen**. Another digit replaces the selection. The screen initially runs ahead. Tap once to jump back to the current real time; further taps leave it at real time. Hold still anywhere for one second to return to the keypad without triggering the jump. Drags and cancelled touches do not trigger. The date follows the displayed time, including midnight rollover. Appearance includes clock position, size, colour, font, date visibility and a real-time appearance preview.

Wait for **Ready offline** on the first online visit. Wallpaper and font imports stay in IndexedDB, settings in localStorage. No uploads are made. Browser storage can be cleared or evicted; keep a copy of your wallpaper/font.

For an older cached release, open [the updater](https://frozono9.github.io/lock-clock/update.html) and choose **Install latest version** between performances. Updates preserve saved imports and settings. Fresh release caches bypass stale browser HTTP responses.

## iPhone fullscreen limit

An iPhone PWA can still show iOS's actual status-bar time and reserve screen space. CSS cannot cover a system bar outside the web view. The website does not claim to hide it. See [WebKit's fullscreen status-bar issue](https://bugs.webkit.org/show_bug.cgi?id=301994).

For native status-bar control, the [iOS container](ios/README.md) bundles this same website and settings offline and places its web view against the physical screen edges. It requests a hidden status bar and automatic home-indicator hiding through UIKit. It needs full Xcode, device signing and device testing. Only Swift syntax and project metadata could be checked on the current Mac, which has Command Line Tools but no selected full Xcode/iOS SDK. The native app has not been built or installed on a phone.

## Exact font files

The reference serif requests Apple's native New York in Safari. To pin a file across browsers, choose **Appearance → Import exact clock font** and select `NewYork.ttf` or a usable TTF/OTF/WOFF/WOFF2 file. The actual file is decoded and saved locally, loaded before performance, and restored offline. Invalid replacements keep the old saved font. Failure to restore a saved font blocks serif performance with a recovery message rather than silently substituting another font.

Apple's [font guidance](https://developer.apple.com/documentation/technologyoverviews/fonts) says not to bundle system fonts, including New York, in distributed apps. Font binaries are not in this public repository. On a Mac, the system file is `/System/Library/Fonts/NewYork.ttf`; transfer it privately to the phone and import it there. Native viewer and Safari storage are separate.

## Development and publishing

No package installation or build is required for the website:

```sh
npm start
npm test
```

Open http://127.0.0.1:8765. `qa/reference.html` uses the current overlay markup and stylesheet at a fixed reference time for visual checks. Service workers require localhost or HTTPS. Bump the cache version in `sw.js` after runtime changes.

GitHub Pages uses the included Actions workflow on `main`. All runtime URLs are relative. Only this project directory belongs in the deployment repository. The iOS project bundles web resources through `python3 ios/prepare_web.py`; generated `ios/Web` files are ignored by Git.
