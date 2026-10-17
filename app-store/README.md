# Publishing Autostrad on the App Store

Everything App Store Connect asks for is in this folder. Work through the steps in
order. You need a Mac with Xcode (free from the Mac App Store) and Node 20 or newer.

| What | Where |
|---|---|
| Bundle ID | `com.njarrar.autostrad` |
| Version | the game version in `build.mjs`, for example 2.20 (build 220) |
| Store text, English and Arabic | [`listing/`](listing) |
| App icon | [`graphics/icon-1024.png`](graphics) (already inside the app) |
| iPhone and iPad screenshots | [`screenshots/`](screenshots) |
| Privacy policy | https://njarrar.github.io/SZR-Autostrad/privacy.html |

## 1. Developer account

Join the Apple Developer Program at
[developer.apple.com/programs](https://developer.apple.com/programs/). It costs 99 US
dollars a year. Then open Xcode, go to **Settings > Accounts** and sign in with the
same Apple ID.

## 2. Build and upload

In Terminal, in the repo folder:

```sh
git pull
cd mobile
npm install
npm run ios
```

This builds the games, copies them into the app, sets the version and build number,
and opens the project in Xcode. Then in Xcode:

1. Click **App** in the left list, then **Signing & Capabilities**. Tick
   **Automatically manage signing** and pick your team.
2. To try it on your iPhone, plug it in, pick it at the top and press **Run**.
3. For the store, pick **Any iOS Device (arm64)** at the top, then **Product >
   Archive**.
4. When the Organizer opens, choose **Distribute App > App Store Connect > Upload**.

After about 15 minutes the build shows up under **TestFlight** in App Store Connect.
Install it with the TestFlight app and play it once before you submit. Apple doesn't
ask about encryption, because the app already says it uses none.

## 3. Create the app

In [App Store Connect](https://appstoreconnect.apple.com), **Apps > + > New App**:
platform iOS, name `Autostrad: Arab City Driving`, primary language English (U.S.),
bundle ID `com.njarrar.autostrad`, SKU `autostrad`, full access.

## 4. App information

- **Category:** Games, with the subcategories Racing and Family.
- **Content rights:** does not contain third-party content.
- **Age rating:** answer None or No to every question: no violence, no scary
  content, no gambling, no contests, no web browsing, no messaging, no user content,
  no ads, no purchases. That gives **4+**.
- **Made for Kids:** leave it off. Apple's Kids category asks for a grown-up check
  before every link out and every settings screen, and tests the whole app as a
  kids' app. The full game has fines, speed cameras and nitro, so it fits better as
  a 4+ racing game with a Kids Mode inside.
- **App Privacy:** "No, we do not collect data from this app". The label reads
  **Data Not Collected**.

## 5. Store listing

For English (U.S.), copy each box from `listing/en-US/`: `name.txt`, `subtitle.txt`,
`promotional-text.txt`, `keywords.txt`, `description.txt`, and `release-notes.txt`
into **What's New in This Version**. Then add Arabic with the language menu at the
top of the page and paste the files from `listing/ar/`.

- **Support URL:** https://github.com/njarrar/SZR-Autostrad
- **Marketing URL:** https://njarrar.github.io/SZR-Autostrad/
- **Privacy policy URL:** https://njarrar.github.io/SZR-Autostrad/privacy.html
- **Copyright:** 2026 njarrar
- **iPhone 6.9 inch screenshots:** the six in `screenshots/iphone/en/` (2868 x 1320).
- **iPad 13 inch screenshots:** the four in `screenshots/ipad/en/` (2752 x 2064).

App Store Connect scales these down for smaller iPhones and iPads.

## 6. Submit

1. **Pricing and availability:** Free, in all countries.
2. **App Review information:** no sign-in needed. In the notes, paste: "No account or
   sign-in. Pick a city and tap Start to drive. Kids Mode is the first button on the
   menu. To leave Kids Mode, hold the lock in the top corner for 3 seconds. The app
   makes no network calls and collects no data."
3. On the version page, under **Build**, pick the build you uploaded, then **Add for
   Review** and **Submit**. Review usually takes one to two days.

For later updates: raise `VERSION` in `build.mjs`, update
`listing/<lang>/release-notes.txt`, and repeat step 2. The build number follows the
version, so 2.21 becomes build 221.
