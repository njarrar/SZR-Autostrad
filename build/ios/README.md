# iOS build

An iPhone and iPad app can only be built on a Mac with Xcode 16 or newer, and putting it on a device or the App Store needs an Apple Developer account.

1. In `mobile/`, run `npm install` and then `npm run ios`. This builds the games, copies them into the app, sets the version and build number (2.19 becomes build 219) and opens the project in Xcode.
2. Click **App** in the left list, then **Signing & Capabilities**. Tick **Automatically manage signing** and pick your team.
3. To try it, pick your iPhone or iPad at the top and press **Run**.
4. For the App Store, pick **Any iOS Device (arm64)** at the top, choose **Product > Archive**, then **Distribute App > App Store Connect > Upload**.
5. The build shows up under **TestFlight** in App Store Connect, where you can test it and then submit it.

The app says it uses no special encryption (`ITSAppUsesNonExemptEncryption` in `Info.plist`), so Apple doesn't ask about export rules on each upload.
