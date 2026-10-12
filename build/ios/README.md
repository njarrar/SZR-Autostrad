# iOS build

An iPhone and iPad app can only be built on a Mac with Xcode, and installing it on a device needs an Apple account.

1. In `mobile/`, run `npm install` and then `npm run ios`. This builds the games, copies them into the app and opens `ios/App/App.xcodeproj` in Xcode.
2. Under **Signing & Capabilities**, pick your team.
3. To try it, pick your iPhone or iPad at the top and press **Run**.
4. For the App Store, choose **Product > Archive**, then **Distribute App**.
