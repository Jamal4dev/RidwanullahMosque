# Ridwanullah Central Mosque

A static frontend website for Ridwanullah Central Mosque in Ikorodu, Lagos. It brings together mosque information, a public prayer-time reference, Qur’an reading links, a dhikr counter, visitor guidance, and contact details.

## Features

- Daily calculated Adhan timetable and next-prayer countdown, loaded from Aladhan for Ikorodu, Nigeria
- Separate, manually editable Iqamah configuration; unconfirmed values display as “Not set”
- Direct links to Quran.com for the full Qur’an, Al-Fatihah, Ayat al-Kursi, Al-Ikhlas, Al-Falaq, and An-Nas
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
- `script.js` — API request, manually configured Iqamah values, prayer countdown, calendar, resource cards, dhikr, theme, FAQ, and mailto behavior
- `images/profile.jpeg` — local mosque image used in the header

## Run locally

Python 3 is sufficient to serve the static files. From the project directory, run:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000` in a browser. A local web server is recommended over opening `index.html` directly because browser security policies may block the prayer-time API request from a `file:` URL.

## Prayer times and events

Calculated Adhan times are requested in the browser from Aladhan’s `timingsByCity` endpoint with city `Ikorodu`, country `Nigeria`, and calculation method `2`. Prayer clock values and daily refresh boundaries use the mosque’s `Africa/Lagos` timezone, independent of the visitor’s device timezone. The page validates the response, shows an unavailable message if loading fails, refreshes when the Lagos date changes, and retries every 30 minutes while open. The countdown updates every second, but the timetable only rerenders when its data changes. Sunrise remains visible in the timetable but is excluded from next-prayer selection; after Isha the next prayer is tomorrow’s Fajr.

These are public calculated Adhan times, not a mosque-issued timetable. Mosque Iqamah times are kept separate in the clearly marked `IQAMAH_TIMES` object near the top of `script.js`. Replace a `null` value only with an Iqamah time confirmed by the mosque; Iqamah is never derived from Aladhan.

The calendar opens on the current local month and lists Jumu’ah every Friday at 2:30 PM, separate from the five daily prayers. It generates upcoming Friday occurrences for approximately one year.

## Contact form

The form checks that name, email, and message are provided, then opens a `mailto:` draft addressed to `addysam@yahoo.com`. It does not send or store messages itself; sending depends on the visitor having an email application configured.

## Content and external services

Qur’an links open Quran.com, including separate destinations for Al-Falaq and An-Nas. Prayer timings require an internet connection and the Aladhan service to be reachable. Google Fonts also loads from Google when available; the site remains usable if external services are unavailable, except for live prayer data and linked resources.

Religious reminders and visitor guidance on this site are informational and do not replace mosque guidance or qualified scholarship. Confirm mosque-specific information with the administration before relying on or publishing it.

## Verification

There is no automated test runner configured. The JavaScript syntax check is:

```powershell
node --check .\script.js
```

After serving the site locally, browser verification should cover:

- The page loads, the local mosque image appears, and no “undefined” text is rendered.
- Adhan values load; Iqamah placeholders remain separate; the API failure fallback appears when needed.
- Next-prayer boundaries select Fajr before Fajr, exclude Sunrise, and roll to tomorrow’s Fajr after Isha.
- Friday events remain at 2:30 PM; date-only event keys stay on the intended local day.
- All Qur’an links use HTTPS and the paired Al-Falaq/An-Nas resource links to both surahs.
- Theme, navigation, FAQ, calendar, dhikr persistence/target validation, and contact validation work.
- No horizontal overflow appears at 320, 360, 375, 390, 414, 768, 1024, or desktop widths.

## Deployment

Live site: [ridwanullahikorodu.netlify.app](https://ridwanullahikorodu.netlify.app/).

This project is already deployed on Netlify and connected to its GitHub repository. Commit and push changes to the branch configured for the Netlify site; Netlify will build and publish the update automatically. No manual upload or separate deployment setup is needed.

The site is static and has no build command. Keep the existing Netlify build and publish settings for this repository. Local changes do not appear on the live site until they have been pushed and the Netlify deploy completes. Live prayer times require HTTPS and an available network connection.

## License

No project license is currently declared. Confirm reuse of the mosque’s content, image, and branding with the mosque administration.
