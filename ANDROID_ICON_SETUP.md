# Bilocost Android launcher icon

The official Bilocost green-and-white B artwork is stored at `resources/bilocost-icon.jpg`.

Android launcher resources are prepared under `android-resources/app/src/main/res`:
- `mipmap-mdpi`, `mipmap-hdpi`, `mipmap-xhdpi`, `mipmap-xxhdpi`, `mipmap-xxxhdpi`: launcher and round launcher artwork.
- `mipmap-anydpi-v26`: adaptive launcher icon XML.
- `drawable-nodpi`: adaptive foreground artwork.
- `values/ic_launcher_background.xml`: adaptive icon background.

The repository has Capacitor configuration but does not yet contain a generated native Android Gradle project. These files are kept outside the `android/` directory so that `npx cap add android` can generate that project normally. After generation, copy the contents of `android-resources/app/src/main/res` into `android/app/src/main/res`, verify the manifest uses `@mipmap/ic_launcher`, then run `npx cap sync android` and rebuild the APK/AAB. The repository change prepares the icon assets; it does not itself build an APK.
