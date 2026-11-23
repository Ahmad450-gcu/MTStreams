# MTStreams

MTStreams is a movie and series discovery web application built with React and Vite. It uses TMDB metadata for titles, cast, season and episode information, and trailers.

## Features

- Discover trending movies and series through a rotating featured hero.
- Browse movie, television and people catalogues.
- Search across titles and people.
- View movie and series details, cast, crew, reviews and recommendations.
- Browse TV seasons and episode details in the MTStreams Season Library.
- Open the existing movie, TV and trailer routes.
- Install the web app on supported devices using its web app manifest and service worker.

## Tech stack

- React 18 and Vite
- React Router
- Redux Toolkit
- Tailwind CSS and custom CSS
- Axios for TMDB API requests
- TMDB for movie, TV, person, season, episode and trailer metadata

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local `.env` file with your TMDB v4 read access token and API base URL:

   ```env
   VITE_TMDB_KEY=your_tmdb_read_access_token
   VITE_BASE_URL=https://api.themoviedb.org/3
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Create a production build:

   ```bash
   npm run build
   ```

## Project areas

- `src/Components/pages` — page-level experiences and detail views.
- `src/Components/ui` — shared navigation, hero, cards, dialogs and presentation components.
- `src/store` — Redux slices and data-loading actions.
- `src/utils/axios.js` — same-origin TMDB API client.
- `api/tmdb.js` — Vercel Function that keeps the TMDB token server-side.
- `api/_tmdbShared.js` — shared endpoint allowlist and request validation.
- `vite.config.js` — local development proxy; reads the token only in the Vite server process.
- `src/providers` and `src/utils/playbackProviders.js` — existing playback provider configuration.
- `public/manifest.json` and `public/serviceworker.js` — PWA metadata and offline app-shell support.

## PWA and publishing

The project includes a web app manifest, branded application icons and a service worker for the application shell. Before a Microsoft Store release, verify production HTTPS hosting, installability, accessibility, content/data licensing, privacy disclosures and Microsoft Store requirements. A PWA package can then be generated with PWABuilder.

## Attribution

Movie and television metadata and images are provided by TMDB. MTStreams is not endorsed or certified by TMDB. Review TMDB's current API terms and attribution requirements before publishing or commercial use.
