#!/usr/bin/env python3
"""Bundle the same website and settings for fully offline native use."""
from pathlib import Path
import shutil

native = Path(__file__).resolve().parent
source = native.parent
dest = native / 'Web'
files = ['index.html', 'style.css', 'lock-screen.css', 'app.js', 'clock.js',
         'clock-display.js', 'local-assets.js', 'local-font.js', 'manifest.webmanifest',
         'assets/mountain-wallpaper.png', 'assets/icon.svg', 'assets/icon-192.png', 'assets/icon-512.png']
for name in files:
    target = dest / name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source / name, target)
print(f'Prepared {len(files)} offline resources in {dest}')
