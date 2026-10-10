# SZR Autostrad

Two 3D driving games that run in the browser, set on real roads in two Arab cities:

- **لفّة عمّان (Amman Loop):** a 22 km loop over the hills of Amman, past Abdali, the King Abdullah I Mosque, the Citadel, the Raghadan flagpole, the Roman Theatre, Rainbow Street, Abdoun Bridge, the 7th Circle and Mecca Mall.
- **لفّة دبي (Dubai Loop):** a 47 km loop at sunset, down Sheikh Zayed Road past the Dubai Frame, the Museum of the Future, Emirates Towers, Burj Khalifa and Mall of the Emirates to the Marina and Ain Dubai, then back along Jumeirah past Burj Al Arab and Jumeirah Mosque.

All on-screen text is in Arabic, in each city's own dialect.

![Amman welcome screen](docs/screenshots/amman-welcome.png)

| Amman | Dubai |
| --- | --- |
| ![Driving in Amman](docs/screenshots/amman-drive.png) | ![Driving in Dubai](docs/screenshots/dubai-drive.png) |
| ![Guided tour](docs/screenshots/amman-tour-trip.png) | ![Dubai welcome screen](docs/screenshots/dubai-welcome.png) |

On a phone, the game shows touch buttons:

![Phone screens: welcome, guided tour and driving](docs/screenshots/phone.png)

## Play

1. Download or clone this repo.
2. Open `dist/amman.html` or `dist/dubai.html` in Chrome, Edge, Safari or Firefox.

That's it. Each game is one file. It needs an internet connection the first time to load three.js and the fonts.

If your browser blocks local files, serve the folder instead:

```bash
npx http-server dist
```

Then open the address it prints and pick `amman.html` or `dubai.html`.

## First time playing

The game opens with a welcome screen that explains the three things to know. Press **جولة تعليمية** (guided tour) for a one minute tour on an empty road. The tour asks you to try each control (gas, changing lanes, braking and the horn), waits until you do it, then points at each part of the screen and explains it. Crashes and fines don't count during the tour. You can start the tour again at any time from the menu with **كيف ألعب؟**.

## Controls

| Action | Keyboard | Phone |
| --- | --- | --- |
| Gas | `↑` or `W` | بنزين / دعس button (bottom right) |
| Brake | `↓` or `S` | بريك button |
| Change lane | `←` `→` or `A` `D` | Arrow buttons (bottom left) |
| Horn | `Space` or `H` | زامور / هرن button |
| Change camera | `C` | Pause menu |
| Pause | `P` or `Esc` | وقّف button |

You can move the horn button to the left or right side from the settings.

## How to play

1. **Pick a direction**: clockwise or counterclockwise around the loop.
2. **Pick a trip**: from one landmark to another, a full lap, or free drive with no end.
3. **Pick the traffic**: light, normal or heavy.
4. **Drive to the end of the trip.** The box at the top shows where you're going and how far is left. The map shows you, the landmarks and your destination.

### Points

- You earn points for every kilometer you drive.
- Pass a car close and faster than it to earn bonus points. Passes in a row multiply the bonus.
- Every 10 km gives 500 bonus points.

### Watch out for

- **Speed cameras.** A yellow warning shows before each one. Amman fines you above 90 km/h (80 limit plus 10). Dubai fines you above 120 km/h (100 limit plus 20).
- **Crashes.** Hitting a car costs points, a fine and damage.
- **The barrier.** Scraping it slows you down and adds damage.
- **Speed bumps (Amman).** Take them under 35 km/h.
- **Salik gates (Dubai).** Each one adds 4 dirhams to your trip.

If damage reaches 100% the car breaks down and the trip ends. In free drive, the car gets repaired every 25 km.

### Tips

- Sound the horn behind a slow car. It moves over if the lane next to it is free.
- Curves push you outward at high speed, so steer into them.
- The garage lets you change the car, its color and your plate number.

## Project layout

```
src/engine.js          The game: road, terrain, buildings, landmarks, traffic, scoring, sound, HUD and guided tour
src/cities/amman.js    Amman: route, landmarks, building styles, cars, traffic, limits, fines, colors and all text
src/cities/dubai.js    Dubai: the same for Dubai
src/template.html      Page layout and styles
build.mjs              Builds one HTML file per city into dist/
dist/                  Ready to play builds
docs/screenshots/      Images used in this README
```

## Build

You need Node.js 18 or newer. There are no packages to install.

```bash
node build.mjs
```

This writes `dist/amman.html` and `dist/dubai.html`. To add a link from each game to the other, create `links.json` next to `build.mjs`:

```json
{ "amman": "https://example.com/amman.html", "dubai": "https://example.com/dubai.html" }
```

## Add a city

1. Copy `src/cities/dubai.js` to a new file, for example `src/cities/riyadh.js`.
2. Change `id`, `route` (latitude and longitude points in driving order), `landmarks`, `zones`, `cars`, `traffic`, `look`, `text`, `tour` and `page`.
3. Add the city id to the list in `build.mjs`.
4. Run `node build.mjs`.

Landmark models are small builder functions in `src/engine.js` (the `LB` object). Add a new builder there if a landmark needs its own shape.

## Built with

- [three.js](https://threejs.org/) 0.160.0
- [Lalezar](https://fonts.google.com/specimen/Lalezar) and [IBM Plex Sans Arabic](https://fonts.google.com/specimen/IBM+Plex+Sans+Arabic) from Google Fonts

The routes follow real places but are drawn by hand from a handful of map points, so distances and curves are close, not exact.
