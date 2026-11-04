# Bilocost Android launcher icon and APK build

The official Bilocost launcher artwork is stored at `resources/bilocost-icon.jpg`. Android launcher resources are staged under `android-resources/app/src/main/res`, including density-specific mipmap assets and Android adaptive-icon XML.

The repository's GitHub Actions workflow at `.github/workflows/android-apk.yml` generates the Capacitor Android project, copies these launcher resources into the generated app, sets the launcher icon in the manifest, syncs Capacitor, and builds a debug APK. Run it from the Actions tab with **Build Bilocost Android APK** (or push a change to one of its watched paths).

The APK is published as the workflow artifact named `Bilocost-Android-APK`. This is a debug APK for testing, not a signed Play Store release.
