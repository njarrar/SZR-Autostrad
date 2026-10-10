# SZR Autostrad

Two 3D browser driving games set on real roads: a loop through Amman and a loop through Dubai along Sheikh Zayed Road and Jumeirah.

- `src/engine.js` holds the game: road, terrain, buildings, landmarks, traffic, scoring, sound and HUD. It uses three.js 0.160.0.
- `src/cities/amman.js` and `src/cities/dubai.js` hold each city: the route (real latitude and longitude points), landmarks, building styles, cars, traffic mix, speed limit, fines, colors and all on-screen text in local dialect.
- `src/template.html` is the page layout and styles.
- `node build.mjs` writes `dist/amman.html` and `dist/dubai.html`. Each is a single page you can open in a browser. An optional `links.json` (`{"amman": url, "dubai": url}`) adds a link from each game to the other.

## How the game plays

- Pick a direction (clockwise or counterclockwise), a trip between two landmarks, a full lap, or free drive, and how heavy traffic is.
- Drive with the arrow keys or WASD. Space sounds the horn. C changes the camera. P pauses. On phones, on-screen buttons appear.
- The horn makes the car in front move over when the next lane is free.
- Passing cars close and fast earns points, with a combo for passes in a row.
- Speed cameras fine you above the limit (Amman 80 km/h with 10 km/h grace, Dubai 100 km/h with 20 km/h grace).
- Amman has speed bumps. Dubai has Salik toll gates.
- Crashes and scraping the barrier add damage. At 100% the car is done. Free drive repairs the car every 25 km and gives a bonus every 10 km.

## Adding a city

Copy one of the city files, change the route points, landmarks and text, add the city to the list in `build.mjs`, and run the build. Landmark models are small builders in `engine.js` (the `LB` object).
