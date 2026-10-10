# SZR Autostrad

Two 3D driving games that run in the browser, set on real roads in two Arab cities:

- **لفّة عمّان (Amman Loop):** a 22 km loop over the hills of Amman, past Abdali, the King Abdullah I Mosque, the Citadel, the Raghadan flagpole, the Roman Theatre, Rainbow Street, Abdoun Bridge, the 7th Circle and Mecca Mall.
- **لفّة دبي (Dubai Loop):** a 47 km loop at sunset, down Sheikh Zayed Road past the Dubai Frame, the Museum of the Future, Emirates Towers, Burj Khalifa and Mall of the Emirates to the Marina and Ain Dubai, then back along Jumeirah past Burj Al Arab and Jumeirah Mosque.

The games come in English and Arabic. The Arabic text uses each city's own dialect, and the layout flips right to left.

![Amman welcome screen](docs/screenshots/amman-welcome.png)

| Amman | Dubai |
| --- | --- |
| ![Driving in Amman](docs/screenshots/amman-drive.png) | ![Driving in Dubai](docs/screenshots/dubai-drive.png) |
| ![Guided tour](docs/screenshots/amman-tour-trip.png) | ![Dubai welcome screen](docs/screenshots/dubai-welcome.png) |

On a phone, the game shows touch buttons:

![Phone screens: welcome, guided tour and driving](docs/screenshots/phone.png)

## Play

**Play online:** https://njarrar.github.io/SZR-Autostrad/

The page lets you pick Amman or Dubai. It works on a computer or a phone.

To play offline:

1. Download or clone this repo.
2. Open `dist/amman.html` or `dist/dubai.html` in Chrome, Edge, Safari or Firefox.

That's it. Each game is one file. It needs an internet connection the first time to load three.js and the fonts.

If your browser blocks local files, serve the folder instead:

```bash
npx http-server dist
```

Then open the address it prints and pick `amman.html` or `dubai.html`.

## Language

The game picks English or Arabic from your browser language. Press the language button at the top of the menu or the welcome screen to switch. Your choice is saved, and you can also add `?lang=en` or `?lang=ar` to the address.

![The Amman menu in English](docs/screenshots/amman-menu-en.png)

## First time playing

The game opens with a welcome screen that explains the three things to know. Press **Guided tour** (**جولة تعليمية** in Arabic) for a one minute tour on an empty road. The tour asks you to try each control (gas, changing lanes, braking and the horn), waits until you do it, then points at each part of the screen and explains it. Crashes and fines don't count during the tour. You can start the tour again at any time from the menu with **How to play** (**كيف ألعب؟**).

## Controls

| Action | Keyboard | Phone |
| --- | --- | --- |
| Gas | `↑` or `W` | Gas button (bottom right) |
| Brake | `↓` or `S` | Brake button |
| Change lane | `←` `→` or `A` `D` | Arrow buttons (bottom left) |
| Horn | `Space` or `H` | Horn button |
| Change camera | `C` | Pause menu |
| Pause | `P` or `Esc` | Pause button |

A quick tap of an arrow moves you one lane over, and the car settles in the middle of that lane on its own. Hold the arrow to cross several lanes. You can move the horn button to the left or right side from the settings.

## How to play

1. **Pick a direction**: clockwise or counterclockwise around the loop.
2. **Pick a trip**: from one landmark to another, a full lap, or free drive with no end.
3. **Pick your car** (see below).
4. **Pick the traffic**: light, normal or heavy.
5. **Drive to the end of the trip.** The box at the top shows where you're going and how far is left. The map shows you, the landmarks and your destination.

### Cars

Each city has three cars you see on its roads every day. Each one has four bars on the menu: speed, pick up, grip and toughness, plus what it does well and badly.

![Car picker in the Amman menu](docs/screenshots/amman-menu.png)

**Amman**

| Car | Top speed | Good at | Weak at |
| --- | --- | --- | --- |
| Hyundai Elantra (yellow taxi) | 175 km/h | Even all round, easy to weave | Nothing stands out |
| Toyota Prius | 165 km/h | Best grip in curves | Slowest pick up, takes the most damage |
| Toyota Hilux | 160 km/h | Takes the least damage | Slow and heavy in curves |

**Dubai**

| Car | Top speed | Good at | Weak at |
| --- | --- | --- | --- |
| Nissan Patrol | 210 km/h | Tough, shrugs off crashes | Heavy and hard to turn |
| Lamborghini Huracán | 300 km/h | Fastest and best grip | One crash hurts a lot |
| Toyota Camry (taxi) | 190 km/h | Even all round | Nothing stands out |

Damage from crashes, the barrier and speed bumps grows or shrinks with the car's toughness.

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
- The garage lets you change the car's color and your plate number.
- On a slow phone, set graphics to **سريعة** (fast) in the settings. It turns off shadows and draws fewer pixels.

## Project layout

```
src/engine.js          The game: road, terrain, buildings, landmarks, traffic, scoring, sound, HUD and guided tour
src/cities/amman.js    Amman: route, landmarks, building styles, cars, traffic, limits, fines and colors
src/cities/dubai.js    Dubai: the same for Dubai
lang/en.xml            English text for both games and the start page
lang/ar.xml            Arabic text (Jordanian for Amman, Gulf for Dubai)
src/template.html      Page layout and styles
src/landing.html       The start page that links to both games
.github/workflows/     Builds the games and publishes them to GitHub Pages
build.mjs              Builds one HTML file per city into dist/
dist/                  Ready to play builds
docs/screenshots/      Images used in this README
```

## Build

You need Node.js 18 or newer. There are no packages to install.

```bash
node build.mjs
```

This writes `dist/index.html`, `dist/amman.html` and `dist/dubai.html`. To add a link from each game to the other, create `links.json` next to `build.mjs`:

```json
{ "amman": "https://example.com/amman.html", "dubai": "https://example.com/dubai.html" }
```

## Add a language

1. Copy `lang/en.xml` to a new file, for example `lang/fr.xml`.
2. Set `code`, `name` (shown on the language button) and `dir` (`ltr` or `rtl`) on the `<language>` tag.
3. Translate each `<string>`. Keys in `<common>` apply to both cities, and a key under `<city>` wins over the same key in `<common>`. Keep text with tags such as `<kbd>` inside `<![CDATA[ ... ]]>`.
4. Run `node build.mjs`. The build stops and lists any key the new file is missing.

## Publish on GitHub Pages

Every push to `main` builds the games and publishes `dist/` with GitHub Actions. To turn this on once:

1. Open **Settings > Pages** in the repo.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.

GitHub Pages is free for public repos. A private repo needs a paid GitHub plan.

## Add a city

1. Copy `src/cities/dubai.js` to a new file, for example `src/cities/riyadh.js`.
2. Change `id`, `route` (latitude and longitude points in driving order), `landmarks`, `zones`, `cars`, `traffic`, `look`, `tour` and `page`.
3. Add a `<city id="...">` section to every file in `lang/` with the city's names, places, cars and tour text.
4. Add the city id to the `CITIES` list in `build.mjs`.
5. Run `node build.mjs`.

Landmark models are small builder functions in `src/engine.js` (the `LB` object). Add a new builder there if a landmark needs its own shape.

## Built with

- [three.js](https://threejs.org/) 0.160.0
- [Lalezar](https://fonts.google.com/specimen/Lalezar) and [IBM Plex Sans Arabic](https://fonts.google.com/specimen/IBM+Plex+Sans+Arabic) from Google Fonts

The routes follow real places but are drawn by hand from a handful of map points, so distances and curves are close, not exact.
