# Kymzi local web, iOS and Android builds

This follows the neighboring Medinest project's local release workflow: Android AAB, iOS archive/IPA, synchronized build numbers, per-step logs and a release manifest. Kymzi uses the same Apple Developer team, `5Y3QHYUW35`. The scripts create local artifacts without uploading or publishing. Android upload credentials are configured separately for Kymzi.

## Commands

Run from the Kymzi project root, using Node 24 LTS:

```sh
npm ci
npm run build:doctor
npm run release:stores -- --dry-run
npm run release:stores
```

Individual targets:

```sh
npm run build:web                 # Vite web build -> dist/
npm run build:android             # signed Google Play .aab
npm run build:android:apk         # signed installable release .apk
npm run build:android:debug       # debug .apk, no release upload key
npm run build:ios                 # signed App Store .ipa and .xcarchive
npm run build:ios -- --preflight-only # check iOS setup without compiling
npm run build:ios:simulator       # Release simulator .app, no Apple signing
npm run build:all                 # web + Android AAB + iOS IPA
npm run build:bundles             # Metro JS/assets export only, not native binaries
npm run test:build                # offline build-script tests
```

`npm run ios` and `npm run android` compile/install a native development app using Expo CLI. `npm run mobile` starts the development server. A connected device or running simulator/emulator is needed for install/run commands. Device options pass through normally, for example `npm run ios -- --device` or `npm run android -- --device`. These development commands also select the connected full Xcode for their own child processes.

Native build/release and device launch helpers automatically select an installed compatible Node runtime when the shell uses unsupported Node 23/25. They prefer Node 24 LTS, then Node 22.18+ LTS, and keep that runtime on PATH for child tools. They check NVM, Homebrew, PATH and the local Codex runtime cache; they do not install Node or change the global shell setup. Use `KYMZI_NODE_BINARY=/absolute/path/to/node` to choose a runtime when automatic selection is needed. For `npm ci`, web development and other root commands, use `nvm use` with the included `.nvmrc` (Node 24).

## Live iPhone preview

Install the local development client once with the iPhone connected and unlocked:

```sh
npm run ios:dev
```

Select the physical iPhone if prompted. This builds Debug and starts Metro. For later editing sessions, open Kymzi on the phone and restart Metro from the project root:

```sh
npm run mobile
```

Keep the Mac and iPhone on the same local network. Saving React/TypeScript, copy or style changes triggers Fast Refresh. Shake the iPhone for the developer menu if you need Reload or to enable Fast Refresh. Keep Metro running while previewing. Native packages, app permissions, native configuration and bundle identifier changes require another `npm run ios:dev`; UI-only edits do not.

The launcher selects a compatible Node runtime automatically. iOS Debug uses source-built React Native core (`RCT_USE_PREBUILT_RNCORE=0`) with prebuilt third-party dependencies, because the SDK 54 prebuilt core omits `RCTPackagerConnection` needed by the development client. If the existing Pod lock still contains prebuilt React core, the native launcher refreshes Pods before building. The first Debug build takes longer; later UI edits use Metro. Store build scripts retain their normal native configuration.

### Standalone app on a connected iPhone

A Release build embeds JavaScript and images, so it opens without Metro or the Mac:

```sh
npm run ios -- --configuration Release --device --no-bundler
```

The native launcher preserves the terminal so Expo can show its device picker. In a non-interactive shell, supply the device UDID or exact device name instead of bare `--device`:

```sh
npm run ios -- --configuration Release --device YOUR_DEVICE_UDID --no-bundler
```

This installs the Release app directly; it does not export an IPA. `npm run build:ios` creates the App Store-signed archive and IPA. API-backed features still require an online backend; bundled artwork and local prototype data work without the development server.

## One-time local setup

Copy the included template:

```sh
cp .env.build.example .env.build.local
```

Edit `.env.build.local` locally. Existing shell environment variables take precedence. This file and all signing-key files are ignored by Git.

### Android

Install Android Studio, Android SDK/Build Tools and JDK 17. Set `JAVA_HOME` and `ANDROID_HOME` if they are not already configured. The SDK defaults to `~/Library/Android/sdk` on macOS. Google Play releases require your Kymzi upload keystore and its passwords:

```dotenv
KYMZI_ANDROID_KEYSTORE_PATH=/absolute/path/to/kymzi-upload.keystore
KYMZI_ANDROID_KEYSTORE_PASSWORD=
KYMZI_ANDROID_KEY_ALIAS=
KYMZI_ANDROID_KEY_PASSWORD=
```

If a key already exists for this application, reuse that key. For a brand-new application, create its upload key with Java's interactive `keytool` command; it prompts for the passwords:

```sh
keytool -genkeypair -v -storetype JKS \
  -keystore /absolute/private/path/kymzi-upload.keystore \
  -alias kymzi-upload -keyalg RSA -keysize 2048 -validity 10000
```

Keep a secure backup of the keystore. The local Expo config plugin reads signing values from environment variables rather than writing them into Gradle source. It replaces the template's debug signing for local release builds. The helper rejects the standard debug keystore/alias for store releases. Debug APK builds do not need these credentials.

### iOS

Install full Xcode and CocoaPods. Sign into the Medinest Apple Developer team in Xcode and configure its distribution signing access. `expo.ios.appleTeamId` in `apps/mobile/app.json` defaults to that team's ID. Optional local overrides:

```dotenv
IOS_TEAM_ID=5Y3QHYUW35
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
```

The helper selects full Xcode through `DEVELOPER_DIR` for its child processes. It does not change the machine's global `xcode-select` setting. If Xcode is on an external drive, connect that drive first. A simulator build skips Apple signing, but still needs Xcode and CocoaPods.

Optional overrides:

```dotenv
IOS_SCHEME=Kymzi
IOS_WORKSPACE=/absolute/path/to/Kymzi.xcworkspace
IOS_DERIVED_DATA_PATH=/Volumes/YourDrive/Kymzi-build-cache/ios/DerivedData
```

The default DerivedData cache is `artifacts/build-cache/ios/DerivedData`. An explicitly selected external cache requires its volume to be mounted; there is no silent fallback to the internal disk.

## Versioning and output

`apps/mobile/app.json` owns the marketing version, Android `versionCode` and iOS `buildNumber`. The application identifiers are `com.kymzi.app` on both platforms. Review these identifiers in that file before registering a new app in either store.

Android and iOS use the same build number. A normal invocation keeps the current number, which makes retries straightforward. Increment it for a new store build:

```sh
npm run release:stores -- --bump
npm run release:stores -- --version 0.2.0 --build-number 2
```

`--dry-run` prints the plan without changing configuration or running tools. It can be used before signing accounts are ready. `--preflight-only` checks the selected target's tools and signing settings without compiling, creating artifacts or applying version changes. It does not verify certificates, provisioning or Apple account access; those are validated during the native build. Actual runs check prerequisites before changing version metadata. Once a run starts, the selected version/build stays in app.json even if a later native compiler fails; retry without `--bump` to reuse it.

Outputs are collected into a fresh directory for each run:

```text
artifacts/store-releases/<version>-<build>-<timestamp>/
  Kymzi-<version>-<build>-android.aab
  Kymzi-<version>-<build>-ios.ipa
  Kymzi.xcarchive/
  release.json
  *.log
```

Only the requested platforms appear. The manifest records completed artifacts and checksums. A failed command stops the build; its manifest is marked failed rather than complete. Old release directories are preserved. Web output stays in `dist/`. For App Store builds, the archived app's actual version, build number and bundle ID are checked before export.

The helper uses a single local build lock to prevent simultaneous prebuilds/version changes. If a build was killed before cleanup, inspect `artifacts/store-releases/.build-lock/pid.json` and make sure that process is no longer running before removing the stale lock directory.

## Generated native projects

This app uses Expo Continuous Native Generation. Each build runs the installed Expo prebuild command without `--clean`, then installs iOS Pods and compiles the requested platform. `apps/mobile/ios` and `apps/mobile/android` are generated and ignored by Git. Keep lasting native changes in app.json or config plugins.

`--skip-prebuild`, `--skip-pods` and `--skip-checks` are available for deliberate local retries. Reusing native projects still checks Android version metadata and the local signing plugin. Keep `patches/metro+0.83.3.patch`; `npm ci` applies it through postinstall.

Interrupted CocoaPods downloads (timeouts, connection resets, truncated Git transfers and temporary server errors) retry up to twice, with a short delay. Retry attempts use Git HTTP/1.1 only for that CocoaPods process and preserve existing Git environment settings. The helper keeps all attempts in `cocoapods.log`; configuration, dependency-resolution and signing failures still stop immediately. After a manually completed `pod install`, resume compilation with `npm run build:ios -- --skip-prebuild --skip-pods`.

The local Android signing plugin is enabled only by the local build helper. Existing EAS configuration remains available independently; this setup does not start cloud builds or register an Expo project.

Reference: [Expo local release builds](https://docs.expo.dev/guides/local-app-production/), [Expo native generation](https://docs.expo.dev/workflow/continuous-native-generation/).
