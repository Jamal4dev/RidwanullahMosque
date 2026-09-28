# Ridwanullah Central Mosque

A static frontend website for Ridwanullah Central Mosque in Ikorodu, Lagos. It brings together mosque information, a public prayer-time reference, Qur’an reading links, a dhikr counter, visitor guidance, and contact details.

## Features

- Daily prayer timetable and next-prayer countdown, loaded from Aladhan for Ikorodu, Nigeria
- Direct links to Quran.com for the full Qur’an, Al-Fatihah, Ayat al-Kursi, Al-Ikhlas, and Al-Falaq
- Dhikr counter with locally saved count and target
- Monthly calendar with Jumu’ah prayer listed every Friday at 2:30 PM
- Expandable visitor FAQs
- Contact form that validates fields and prepares an email in the visitor’s mail application
- Responsive navigation and layouts, light/dark theme, skip link, and reduced-motion support

## Technology

- HTML5, CSS3, and vanilla JavaScript
- Browser `localStorage` for theme and dhikr preferences
- Aladhan API for prayer times and Quran.com for Qur’an reading resources
- Google Fonts for typography

There is no backend, package manager, build step, or automated test suite in this project.

## Project files

- `index.html` — page structure, mosque information, metadata, and contact form
- `styles.css` — themes, layout, responsive behavior, and focus styling
- `script.js` — API request, prayer countdown, calendar, resource cards, dhikr, theme, FAQ, and mailto behavior
- `images/profile.jpeg` — local mosque image used in the header

## Run locally

Python 3 is sufficient to serve the static files. From the project directory, run:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000` in a browser. A local web server is recommended over opening `index.html` directly because browser security policies may block the prayer-time API request from a `file:` URL.

## Prayer times and events

Prayer times are requested in the browser from Aladhan’s `timingsByCity` endpoint with city `Ikorodu`, country `Nigeria`, and calculation method `2`. The next-prayer display updates every second. If the request fails, the page shows an unavailable message rather than substituting made-up times. Public calculated times are a reference, not a mosque-issued timetable; confirm local congregation times and special schedules with the mosque.

The calendar lists the recurring Friday Jumu’ah prayer at 2:30 PM, as provided by the mosque. It displays upcoming Friday occurrences for the next year.

## Contact form

The form checks that name, email, and message are provided, then opens a `mailto:` draft addressed to `addysam@yahoo.com`. It does not send or store messages itself; sending depends on the visitor having an email application configured.

## Content and external services

Qur’an links open Quran.com. Prayer timings require an internet connection and the Aladhan service to be reachable. Google Fonts also loads from Google when available; the site remains usable if external services are unavailable, except for live prayer data and linked resources.

Religious reminders and visitor guidance on this site are informational and do not replace mosque guidance or qualified scholarship. Confirm mosque-specific information with the administration before relying on or publishing it.

## Verification

There is no automated test runner configured. The available syntax check is:

```powershell
node --check .\script.js
```

For a browser smoke test, serve the site locally and verify:

- The page loads, the local mosque image appears, and no “undefined” text is rendered.
- Prayer times load when the API is available; the fallback appears when it is not.
- Qur’an resource links open their labeled Quran.com pages.
- The theme toggle, mobile menu, FAQ accordion, calendar navigation, and Friday Jumu’ah entries work.
- Dhikr increments, resets, changes presets, and persists after reload.
- Empty contact fields show validation feedback; complete fields prepare a mailto draft.
- At a narrow mobile viewport, content does not overflow horizontally.

## Deployment

This project is already deployed on Netlify and connected to its GitHub repository. Commit and push changes to the branch configured for the Netlify site; Netlify will build and publish the update automatically. No manual upload or separate deployment setup is needed.

The site is static and has no build command. Keep the existing Netlify build and publish settings for this repository. Local changes do not appear on the live site until they have been pushed and the Netlify deploy completes. Live prayer times require HTTPS and an available network connection.

## License

No project license is currently declared. Confirm reuse of the mosque’s content, image, and branding with the mosque administration.
