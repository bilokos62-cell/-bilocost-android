# Bilocost Android launcher icon

The official Bilocost green-and-white B artwork is stored at `resources/bilocost-icon.jpg`.

Android launcher resources are staged under `android/app/src/main/res`:
- `mipmap-mdpi`, `mipmap-hdpi`, `mipmap-xhdpi`, `mipmap-xxhdpi`, `mipmap-xxxhdpi`: legacy launcher and round launcher artwork.
- `mipmap-anydpi-v26`: adaptive launcher icon XML.
- `drawable-nodpi`: adaptive foreground artwork.
- `values/ic_launcher_background.xml`: adaptive icon background.

The repository currently contains the Capacitor configuration but not a generated native `android/` Gradle project. Once the native project is generated with `npx cap add android`, copy/retain these resources in its `app/src/main/res` directory, verify the application manifest references `@mipmap/ic_launcher`, then run `npx cap sync android` and rebuild the APK/AAB. The icon resources alone do not constitute a built APK.
