# Publishing Autostrad on Google Play

Everything the Play Console asks for is in this folder or made by the
[Play Store workflow](../.github/workflows/play.yml). Work through the steps in order.
You only need a Mac with Terminal and a web browser. You don't need Android Studio.

| What | Where |
|---|---|
| Package name | `com.njarrar.autostrad` |
| Version | the game version in `build.mjs`, for example 2.20 (version code 220) |
| Release bundle | made by the Play Store workflow (step 3) |
| Store text, English and Arabic | [`listing/`](listing) |
| App icon, feature graphic | [`graphics/`](graphics) |
| Phone and tablet screenshots | [`screenshots/`](screenshots) |
| Privacy policy | https://njarrar.github.io/SZR-Autostrad/privacy.html |

## 1. Package name

The app's package name is **`com.njarrar.autostrad`**. It is the app's ID on Google
Play and can never change after the first upload. It doesn't need a website behind
it; it only has to be unique on Play, and the Console tells you on the first upload
if it is taken. The iPhone app uses the same ID.

## 2. Make an upload key (once, on your Mac)

Play needs every upload signed with your own key. Google then signs the copies
people download with its own key (Play App Signing), so if you ever lose the upload
key, Google can reset it. Never commit the key to the repo.

Your Mac already has the `openssl` program, so nothing needs installing. In Terminal:

```sh
cd ~
openssl req -x509 -newkey rsa:2048 -nodes -days 10000 -subj "/CN=Autostrad" \
  -keyout upload-key.pem -out upload-cert.pem
openssl pkcs12 -export -name upload -inkey upload-key.pem -in upload-cert.pem \
  -out autostrad-upload.p12
rm upload-key.pem upload-cert.pem
```

The second command asks for a password twice. Keep `~/autostrad-upload.p12` and the
password in a safe place, such as your password manager.

## 3. Let GitHub sign the bundle

1. Copy the key as text: `base64 -i ~/autostrad-upload.p12 | pbcopy`
2. In GitHub, open the repo's **Settings > Secrets and variables > Actions** and add
   four repository secrets:

   | Name | Value |
   |---|---|
   | `UPLOAD_KEYSTORE_BASE64` | paste (from step 1) |
   | `UPLOAD_KEYSTORE_PASSWORD` | your password |
   | `UPLOAD_KEY_ALIAS` | `upload` |
   | `UPLOAD_KEY_PASSWORD` | your password (the same one) |

3. Open **Actions > Play Store > Run workflow** on `main`. It builds the games into
   the app and makes the bundle. The run's summary says whether the bundle is
   signed. Download `Autostrad-<version>.aab` under **Artifacts** on the run page.

Without the secrets the workflow still builds the bundle, but unsigned, and Play
won't take it. Pushing a tag such as `v2.20` runs the workflow too.

## 4. Developer account

1. Sign up at [play.google.com/console](https://play.google.com/console) as a
   personal account. It costs a one-time 25 US dollars, and Google checks your ID.
2. **New personal accounts must run a closed test first:** at least 12 testers who
   keep the app installed for 14 days in a row before you can apply for production.
   Plan for this. Friends and family with Android phones and a Gmail address work.

## 5. Create the app

**Home > Create app:** name `Autostrad: Arab City Driving`, default language English
(United States), Game, Free. Tick the declarations.

## 6. App content (Policy > App content)

- **Privacy policy:** `https://njarrar.github.io/SZR-Autostrad/privacy.html`
- **App access:** All functions are available without special access. There is no
  sign-in.
- **Ads:** No, the app has no ads.
- **Content rating:** start the questionnaire, enter your email, category "Game".
  Answer No to every question: cars bump into each other but nobody is shown hurt,
  no fear, sex, language, drugs or gambling, no user to user chat or content
  sharing, no location sharing, no purchases, no web browser. Expect Everyone /
  PEGI 3.
- **Target audience:** tick every age group, from 5 and under up to 18 and over.
  Kids Mode is made for ages 4 to 7, so children are part of the audience, and
  Google's Families rules apply. The app already meets them: no ads, no data
  collected, no purchases, no links out of the game in Kids Mode, and a privacy
  policy. "Appeals to children": Yes.
- **News app:** No.
- **Data safety:**
  - Does your app collect or share any of the required user data types? **No.**
  - Reason: settings, scores, the garage and the sticker album stay on the phone,
    nothing goes to a server, and there are no analytics or ads. The Kids Mode
    voice uses the phone's own speech.
- **Advertising ID:** No.
- **Government app, financial features, health:** No to all.

## 7. Store listing (Grow users > Store presence > Main store listing)

- **App name, short description, full description:** copy from
  `listing/en-US/`. Then **Manage translations > Add your own translations** for
  Arabic `ar`, and paste the text from `listing/ar/`.
- **App icon:** `graphics/icon-512.png`
- **Feature graphic:** `graphics/feature-graphic.png` (the same one works for Arabic)
- **Phone screenshots:** all eight from `screenshots/phone/en/`, and the four in
  `screenshots/phone/ar/` for the Arabic translation. They are 1920 x 1080.
- **Tablet screenshots:** the four in `screenshots/tablet/en/` for both 7 inch and
  10 inch tablets. They are 2560 x 1600.
- **Category:** Game > Racing. **Tags:** Racing, Driving, Simulation, Kids.
- **Contact details:** your email. Website: https://njarrar.github.io/SZR-Autostrad/

## 8. Release

1. **Test and release > Testing > Closed testing > Create track.** Add your testers'
   emails, upload the `.aab` from step 3, paste the release notes from each
   `listing/<lang>/release-notes.txt`, and roll out. When asked, choose **Use Google
   Play App Signing**.
2. Share the opt-in link with testers. After 14 days with 12 or more testers,
   **Apply for production** from the Dashboard.
3. Then **Production > Create new release**, pick the same bundle from the library,
   and send it for review. Reviews often take a few days for a new app.

For later updates: raise `VERSION` in `build.mjs` (the version code follows it, so
2.21 becomes 221), update `listing/<lang>/release-notes.txt`, run the Play Store
workflow, and upload the new bundle.
