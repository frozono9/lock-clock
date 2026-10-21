# Native fullscreen viewer

This container runs the same wallpaper picker, saved settings, font importer and backward-only clock as the website. It bundles the web assets and serves them on a loopback-only server, so it does not need internet access, GitHub Pages or a service worker. UIKit requests a hidden status bar, automatic home-indicator hiding and a view extending to the physical screen edges. iOS may temporarily show the home indicator during system gestures.

## Install on your iPhone

1. Install full Xcode (Command Line Tools alone do not include the iOS SDK).
2. Run `python3 ios/prepare_web.py` from the repository directory.
3. Open `ios/Clock.xcodeproj` in Xcode.
4. In the Clock target's Signing & Capabilities, choose your Personal Team and use a unique bundle identifier if needed.
5. Connect your iPhone, select it as the run destination, enable Developer Mode if iOS asks, then Run. Follow any device trust/signing prompts.

Wallpaper and font imports are private to this native viewer's storage, so import your wallpaper in its Appearance settings once. Files saved in Safari/PWA storage are not shared with WKWebView. The bundled default is a clean wallpaper, not a lock-screen screenshot. No Apple font binaries are bundled; Apple's WebKit uses the native serif font and you can also import a local font file.

The Xcode build phase refreshes bundled web resources on each build. Source and project metadata can be checked without Xcode, but the iOS app must be compiled and tested with the iOS SDK and on a device before claiming the status bar is hidden on that device.
