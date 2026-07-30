# VLA HUD

A subscription-free personal operating system built as a progressive web app.

## Features

- Automatically resets daily tasks when the date changes
- Five selectable day modes: Long Workday, Short Workday, Recovery, Growth, Open
- Weekly cybersecurity, training, creative, and learning targets
- Rotating combat-athlete workout split
- Music and streaming treated as interchangeable creative blocks
- Gaming included as protected leisure
- Quick-capture inbox
- Offline support
- Local storage, so no account or subscription is required

## Run locally

Because service workers require a web server, do not open `index.html` directly from Finder.

### Python

```bash
cd vla-hud
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Put it on iPhone for free

1. Create a free GitHub account.
2. Create a new public repository named `vla-hud`.
3. Upload every file in this folder.
4. Open repository Settings → Pages.
5. Set Source to `Deploy from a branch`, then choose `main` and `/root`.
6. Open the GitHub Pages address in Safari on your iPhone.
7. Tap Share → Add to Home Screen.

It will launch in standalone mode like an app.

## Important limitation

Data is stored in the browser on each device. It does not sync across devices yet. A future version can use Supabase or Firebase free tiers for login and syncing.
