# Bilocost iOS clean rebuild

## Safety baseline
- This work is isolated on branch `rebuild/ios-clean-capacitor`.
- Android source and Android build configuration are not changed.
- Firebase project, Firestore data, Storage objects, and user accounts are not changed.
- The repository currently has no tracked `ios/` native project directory. The iOS workflow creates a fresh Capacitor iOS project during each CI run with `npx cap add ios`, then syncs the shared web bundle.
- Therefore there is no existing tracked native iOS project to delete. The existing workflow and its configuration are preserved as the starting reference.

## Rebuild sequence
1. Keep the current Android/web source as the shared application baseline.
2. Generate a fresh iOS platform with the repository's Capacitor 7 toolchain.
3. Sync the generated iOS project with the exact same web bundle used by Android.
4. Validate the generated Xcode workspace and build an iOS Simulator app.
5. Only after a successful simulator build, proceed to device-specific permissions, media capture/upload, push notifications, and signing/distribution work.

## CI stability adjustment
The iOS workflow's concurrency group no longer cancels an in-progress iOS build when another run is queued. This prevents overlapping pushes from automatically cancelling the active build. It does not solve GitHub-hosted macOS runner outages or queue delays.

## Distribution note
The current workflow produces an iOS Simulator `.app`, not an installable iPhone `.ipa`. Device distribution still requires Apple signing and an Apple Developer account.
